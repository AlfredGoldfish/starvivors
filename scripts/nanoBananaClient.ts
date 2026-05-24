import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type GenerateImageRequest = {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  outputPath: string;
};

export type NanoBananaClient = {
  modelName: string;
  generateImage(request: GenerateImageRequest): Promise<void>;
};

type NanoBananaClientOptions = {
  apiKey: string;
  modelName: string;
  endpointUrl?: string;
};

const DEFAULT_KEY_FILE = "nano_key.txt";

export function createNanoBananaClientFromEnv(): NanoBananaClient {
  const apiKey = readApiKey();

  if (!apiKey) {
    throw new Error(
      "NANO_BANANA_API_KEY, GEMINI_API_KEY, or nano_key.txt is required for asset generation. Keep API keys out of git.",
    );
  }

  return createNanoBananaClient({
    apiKey,
    modelName: process.env.NANO_BANANA_MODEL || "gemini-3-pro-image-preview",
    endpointUrl: process.env.NANO_BANANA_API_URL,
  });
}

export function createNanoBananaClient(options: NanoBananaClientOptions): NanoBananaClient {
  return {
    modelName: options.modelName,
    async generateImage(request: GenerateImageRequest): Promise<void> {
      const endpointUrl =
        options.endpointUrl ||
        `https://generativelanguage.googleapis.com/v1beta/models/${options.modelName}:generateContent`;
      const prompt = `${request.prompt}

Exclusions: ${request.negativePrompt}`;

      // Gemini API image generation REST shape for Nano Banana / Nano Banana Pro.
      // Keep this wrapper isolated so any future SDK or API changes do not touch gameplay code.
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "x-goog-api-key": options.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: closestGeminiAspectRatio(request.width, request.height),
              imageSize: "1K",
            },
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Nano Banana Pro request failed (${response.status}): ${body}`);
      }

      const payload = await response.json();
      const parts = payload?.candidates?.[0]?.content?.parts;
      const inlineData = Array.isArray(parts)
        ? parts.find((part) => typeof part?.inlineData?.data === "string")?.inlineData
        : null;
      const imagePayload =
        inlineData?.data ||
        payload?.data?.[0]?.b64_json ||
        payload?.data?.[0]?.image_base64 ||
        payload?.image?.b64_json ||
        payload?.image_base64;
      const imageUrl = payload?.data?.[0]?.url || payload?.image_url;

      if (typeof imagePayload === "string") {
        const { writeFile } = await import("node:fs/promises");
        await writeFile(request.outputPath, Buffer.from(stripDataUrlPrefix(imagePayload), "base64"));
        return;
      }

      if (typeof imageUrl === "string") {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Generated image download failed (${imageResponse.status})`);
        }

        const { writeFile } = await import("node:fs/promises");
        await writeFile(request.outputPath, Buffer.from(await imageResponse.arrayBuffer()));
        return;
      }

      throw new Error(
        "Nano Banana Pro/Gemini response did not include a recognized inline image, base64 image, or image URL.",
      );
    },
  };
}

function readApiKey(): string | null {
  return (
    extractApiKey(process.env.NANO_BANANA_API_KEY) ||
    extractApiKey(process.env.GEMINI_API_KEY) ||
    readApiKeyFile(process.env.NANO_BANANA_API_KEY_FILE || DEFAULT_KEY_FILE)
  );
}

function readApiKeyFile(path: string): string | null {
  const resolvedPath = resolve(process.cwd(), path);

  if (!existsSync(resolvedPath)) {
    return null;
  }

  return extractApiKey(readFileSync(resolvedPath, "utf8"));
}

function extractApiKey(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const explicitGoogleKey = trimmed.match(/AIza[0-9A-Za-z_-]{20,}/)?.[0];
  if (explicitGoogleKey) {
    return explicitGoogleKey;
  }

  return trimmed.split(/\s+/)[0] || null;
}

function closestGeminiAspectRatio(width: number, height: number): string {
  const target = width / height;
  const supported = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

  return supported
    .map((ratio) => {
      const [ratioWidth, ratioHeight] = ratio.split(":").map(Number);
      return {
        ratio,
        distance: Math.abs(target - ratioWidth / ratioHeight),
      };
    })
    .sort((a, b) => a.distance - b.distance)[0].ratio;
}

function stripDataUrlPrefix(value: string): string {
  const marker = "base64,";
  const index = value.indexOf(marker);
  return index === -1 ? value : value.slice(index + marker.length);
}
