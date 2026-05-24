import { access } from "node:fs/promises";
import { basename, join } from "node:path";
import { spawn } from "node:child_process";

export type ContactSheetOptions = {
  batchDirectory: string;
  imageFiles: string[];
  outputFileName?: string;
};

export async function createContactSheetIfAvailable(options: ContactSheetOptions): Promise<string | null> {
  if (options.imageFiles.length === 0) {
    return null;
  }

  const magickCommand = await resolveMagickCommand();
  const outputFileName = options.outputFileName || "contact_sheet.png";
  const outputPath = join(options.batchDirectory, outputFileName);

  if (!magickCommand) {
    console.log("Contact sheet skipped: ImageMagick `magick` command was not found.");
    return null;
  }

  const labelArgs = options.imageFiles.flatMap((file) => [
    "-label",
    basename(file),
    join(options.batchDirectory, file),
  ]);

  await runCommand(magickCommand, [
    "montage",
    ...labelArgs,
    "-thumbnail",
    "240x240",
    "-tile",
    "5x",
    "-geometry",
    "+16+32",
    "-background",
    "#101217",
    "-fill",
    "#d7e7ff",
    outputPath,
  ]);

  return outputPath;
}

async function resolveMagickCommand(): Promise<string | null> {
  const candidates = [
    process.env.MAGICK_PATH,
    "magick",
    "C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe",
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (await commandExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function commandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, ["-version"], { stdio: "ignore", shell: false });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe", shell: false });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code}: ${stderr}`));
      }
    });
  });
}

export async function existingPngFiles(batchDirectory: string, fileNames: string[]): Promise<string[]> {
  const existing: string[] = [];

  for (const fileName of fileNames) {
    try {
      await access(join(batchDirectory, fileName));
      existing.push(fileName);
    } catch {
      // Missing files are expected when individual generations fail.
    }
  }

  return existing;
}
