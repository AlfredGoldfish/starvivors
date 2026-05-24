import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { ASSET_DEFINITIONS } from "./assetPrompts.ts";

const DEFAULT_OUTPUT_DIR = "assets/ai_candidates";

type Args = {
  outputDir: string;
  fix: boolean;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(process.cwd(), args.outputDir);
  const missing: string[] = [];

  for (const definition of ASSET_DEFINITIONS) {
    const directory = resolve(root, ...definition.folderSegments);
    const exists = await pathExists(directory);

    if (!exists) {
      missing.push(directory);
      if (args.fix) {
        await mkdir(directory, { recursive: true });
      }
    }
  }

  if (missing.length === 0) {
    console.log(`Asset candidate folders are present under ${root}`);
    return;
  }

  if (args.fix) {
    console.log(`Created ${missing.length} missing asset candidate folder(s) under ${root}`);
    return;
  }

  console.log(`Missing ${missing.length} asset candidate folder(s):`);
  for (const directory of missing) {
    console.log(`- ${directory}`);
  }
  console.log("Run with --fix to create missing folders.");
  process.exitCode = 1;
}

function parseArgs(argv: string[]): Args {
  let outputDir = process.env.ASSET_GENERATION_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;
  let fix = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--fix") {
      fix = true;
      continue;
    }

    if (arg === "--output-dir" && next) {
      outputDir = next;
      index += 1;
    }
  }

  return { outputDir, fix };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
