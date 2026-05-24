import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  ART_DIRECTION,
  ASSET_DEFINITIONS,
  DEFAULT_STYLE_SLUG,
  NEGATIVE_PROMPT,
  type AssetCategory,
  type AssetDefinition,
  buildAssetPrompt,
  getEstimatedNineSliceBorders,
} from "./assetPrompts.ts";
import { createContactSheetIfAvailable, existingPngFiles } from "./createContactSheet.ts";
import { createNanoBananaClientFromEnv, type NanoBananaClient } from "./nanoBananaClient.ts";

type CliOptions = {
  category?: AssetCategory;
  asset?: string;
  count: number;
  dryRun: boolean;
  outputDir: string;
  styleSlug: string;
};

type FailedRequest = {
  outputFile: string;
  candidateIndex: number;
  attempts: number;
  error: string;
};

const DEFAULT_OUTPUT_DIR = "assets/ai_candidates";
const RETRY_COUNT = 2;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const definitions = selectDefinitions(options);

  if (definitions.length === 0) {
    throw new Error("No asset definitions matched the requested filters.");
  }

  const outputRoot = resolve(process.cwd(), options.outputDir);
  const client = options.dryRun ? null : createNanoBananaClientFromEnv();

  console.log(
    `${options.dryRun ? "Dry run" : "Generating"} ${definitions.length} asset type(s) into ${outputRoot}`,
  );

  for (const definition of definitions) {
    await planOrGenerateBatch({ definition, options, outputRoot, client });
  }
}

async function planOrGenerateBatch({
  definition,
  options,
  outputRoot,
  client,
}: {
  definition: AssetDefinition;
  options: CliOptions;
  outputRoot: string;
  client: NanoBananaClient | null;
}) {
  const batchDirectory = await getNextBatchDirectory(
    outputRoot,
    definition,
    options.styleSlug,
    !options.dryRun,
  );
  const prompt = buildAssetPrompt(definition);
  const count = options.count;
  const plannedFiles = Array.from({ length: count }, (_, index) =>
    candidateFileName(definition.assetType, index + 1),
  );

  console.log("");
  console.log(`Asset: ${definition.category}/${definition.assetType}`);
  console.log(`Batch: ${batchDirectory}`);
  console.log(`Candidates: ${count}`);

  if (options.dryRun) {
    console.log("Prompt:");
    console.log(prompt);
    console.log("Negative prompt:");
    console.log(NEGATIVE_PROMPT);
    return;
  }

  if (!client) {
    throw new Error("Internal error: generation client was not initialized.");
  }

  await mkdir(batchDirectory, { recursive: true });
  await mkdir(join(batchDirectory, "rejected"), { recursive: true });
  await mkdir(join(batchDirectory, "selected"), { recursive: true });
  await writeFile(join(batchDirectory, "prompt.txt"), `${prompt}\n\nNegative prompt:\n${NEGATIVE_PROMPT}\n`);

  const manifest = createBatchManifest({
    definition,
    batchDirectory,
    modelName: client.modelName,
    prompt,
    requestedFiles: plannedFiles,
    generatedFiles: [],
    failedRequests: [],
    contactSheet: null,
  });

  await writeJson(join(batchDirectory, "manifest.json"), manifest);

  const generatedFiles: string[] = [];
  const failedRequests: FailedRequest[] = [];

  for (let index = 0; index < count; index += 1) {
    const outputFile = plannedFiles[index];
    const outputPath = join(batchDirectory, outputFile);

    try {
      await generateWithRetries(client, {
        prompt,
        negativePrompt: NEGATIVE_PROMPT,
        width: definition.width,
        height: definition.height,
        transparentBackground: definition.transparentBackground,
        outputPath,
      });
      generatedFiles.push(outputFile);
      console.log(`Saved ${outputPath}`);
    } catch (error) {
      const failedRequest = {
        outputFile,
        candidateIndex: index + 1,
        attempts: RETRY_COUNT + 1,
        error: error instanceof Error ? error.message : String(error),
      };
      failedRequests.push(failedRequest);
      console.error(`Failed ${outputFile}: ${failedRequest.error}`);
    }
  }

  let contactSheet: string | null = null;
  const existingImages = await existingPngFiles(batchDirectory, generatedFiles);

  try {
    contactSheet = await createContactSheetIfAvailable({
      batchDirectory,
      imageFiles: existingImages,
    });
    if (contactSheet) {
      console.log(`Saved ${contactSheet}`);
    }
  } catch (error) {
    console.error(`Contact sheet failed: ${error instanceof Error ? error.message : error}`);
  }

  if (failedRequests.length > 0) {
    await writeJson(join(batchDirectory, "failed.json"), failedRequests);
  }

  await writeJson(
    join(batchDirectory, "manifest.json"),
    createBatchManifest({
      definition,
      batchDirectory,
      modelName: client.modelName,
      prompt,
      requestedFiles: plannedFiles,
      generatedFiles,
      failedRequests,
      contactSheet,
    }),
  );
}

async function generateWithRetries(
  client: NanoBananaClient,
  request: Parameters<NanoBananaClient["generateImage"]>[0],
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRY_COUNT + 1; attempt += 1) {
    try {
      await client.generateImage(request);
      return;
    } catch (error) {
      lastError = error;
      if (attempt <= RETRY_COUNT) {
        console.log(`Retrying ${request.outputPath} (${attempt}/${RETRY_COUNT})`);
        await sleep(750 * attempt);
      }
    }
  }

  throw lastError;
}

function createBatchManifest({
  definition,
  batchDirectory,
  modelName,
  prompt,
  requestedFiles,
  generatedFiles,
  failedRequests,
  contactSheet,
}: {
  definition: AssetDefinition;
  batchDirectory: string;
  modelName: string;
  prompt: string;
  requestedFiles: string[];
  generatedFiles: string[];
  failedRequests: FailedRequest[];
  contactSheet: string | null;
}) {
  const now = new Date();

  return {
    batchId: batchDirectory.split(/[\\/]/).at(-1),
    timestamp: now.toISOString(),
    category: definition.category,
    assetType: definition.assetType,
    modelName,
    artDirection: ART_DIRECTION,
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
    targetDimensions: {
      width: definition.width,
      height: definition.height,
    },
    transparentBackgroundRequested: definition.transparentBackground,
    candidateCount: requestedFiles.length,
    outputFileList: generatedFiles,
    requestedFileList: requestedFiles,
    failedRequestCount: failedRequests.length,
    failedRequestFile: failedRequests.length > 0 ? "failed.json" : null,
    contactSheet: contactSheet ? "contact_sheet.png" : null,
    notes: definition.notes || "",
    selected: false,
    validation: {
      nineSlice: getEstimatedNineSliceBorders(definition),
    },
  };
}

async function getNextBatchDirectory(
  outputRoot: string,
  definition: AssetDefinition,
  styleSlug: string,
  createDirectories: boolean,
): Promise<string> {
  const assetRoot = join(outputRoot, ...definition.folderSegments);
  if (createDirectories) {
    await mkdir(assetRoot, { recursive: true });
  }

  const date = new Date().toISOString().slice(0, 10);
  const prefix = `${date}_${styleSlug}_batch_`;
  const existing = await readdir(assetRoot, { withFileTypes: true }).catch(() => []);
  const existingNumbers = existing
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
    .map((entry) => Number(entry.name.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));
  const nextNumber = existingNumbers.length === 0 ? 1 : Math.max(...existingNumbers) + 1;
  const batchName = `${prefix}${String(nextNumber).padStart(3, "0")}`;

  return join(assetRoot, batchName);
}

function parseArgs(argv: string[]): CliOptions {
  let category: AssetCategory | undefined;
  let asset: string | undefined;
  let dryRun = false;
  let outputDir = process.env.ASSET_GENERATION_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;
  let styleSlug = DEFAULT_STYLE_SLUG;
  let count = parsePositiveInteger(process.env.ASSET_GENERATION_COUNT, 10);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--category" && next) {
      category = parseCategory(next);
      index += 1;
      continue;
    }

    if (arg === "--asset" && next) {
      asset = next;
      index += 1;
      continue;
    }

    if (arg === "--count" && next) {
      count = parsePositiveInteger(next, count);
      index += 1;
      continue;
    }

    if (arg === "--output-dir" && next) {
      outputDir = next;
      index += 1;
      continue;
    }

    if (arg === "--style-slug" && next) {
      styleSlug = slugify(next);
      index += 1;
      continue;
    }
  }

  return { category, asset, count, dryRun, outputDir, styleSlug };
}

function selectDefinitions(options: CliOptions): AssetDefinition[] {
  return ASSET_DEFINITIONS.filter((definition) => {
    if (options.category && definition.category !== options.category) {
      return false;
    }

    if (options.asset && definition.assetType !== options.asset) {
      return false;
    }

    return true;
  });
}

function candidateFileName(assetType: string, index: number): string {
  return `${assetType}_${String(index).padStart(3, "0")}.png`;
}

function parseCategory(value: string): AssetCategory {
  const categories = new Set(ASSET_DEFINITIONS.map((definition) => definition.category));

  if (!categories.has(value as AssetCategory)) {
    throw new Error(`Unknown category "${value}". Expected one of: ${Array.from(categories).join(", ")}`);
  }

  return value as AssetCategory;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, received "${value}"`);
  }

  return parsed;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
