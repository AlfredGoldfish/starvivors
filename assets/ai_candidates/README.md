# Starvivors AI Candidate Assets

This folder is for AI-generated candidate assets only. Files generated here are not automatically used by the game, and no gameplay rendering should import from this folder.

Use this area for batch art exploration, manual review, and short-lived experiments. Move only approved keepers into the production asset folders after they have been reviewed, cleaned up, renamed, optimized, and checked against gameplay readability.

## Setup

Set the Nano Banana Pro API key in your shell before generating real images:

```powershell
$env:NANO_BANANA_API_KEY = "your-api-key"
$env:NANO_BANANA_MODEL = "gemini-3-pro-image-preview"
```

If neither `NANO_BANANA_API_KEY` nor `GEMINI_API_KEY` is set, the generator reads `nano_key.txt` from the project root. `nano_key.txt` is ignored by git. The client extracts the Google API key token from the file, so a trailing note after the key will not be sent to the API.

The current client wrapper is isolated in `scripts/nanoBananaClient.ts`. If the exact Nano Banana Pro endpoint or SDK changes, update that wrapper only. Do not commit API keys.

Optional environment variables:

- `ASSET_GENERATION_OUTPUT_DIR`, default `assets/ai_candidates`
- `ASSET_GENERATION_COUNT`, default `10`
- `NANO_BANANA_MODEL`, default `gemini-3-pro-image-preview`
- `NANO_BANANA_API_URL`, optional override for the Gemini image generation endpoint
- `NANO_BANANA_API_KEY_FILE`, optional path to a local key file, default `nano_key.txt`

## Background Policy

Future Nano Banana Pro outputs should use a pure `#FFFFFF` white background. Checkerboard backgrounds are not desired because they are baked into the image and cannot be treated as real transparency.

Background removal will be handled manually outside this repo workflow. Do not add background-removal scripts, services, or image-processing dependencies to this pipeline.

UI/HUD frame interiors should not be white. White is only for the outside background around the asset silhouette. Usable interior panel areas should be dark gray, gunmetal, dark glass, dark amber-gray, dark red, or another appropriate in-world panel material so live Phaser text and meters can be drawn over them.

## Commands

Preview planned folders and prompts without calling the API:

```powershell
npm run generate:assets -- --dry-run
npm run generate:assets -- --category hud --asset weapon_slot_frame --count 2 --dry-run
```

Generate a small review batch first:

```powershell
npm run generate:assets -- --category hud --asset weapon_slot_frame --count 2
```

Category shortcuts:

```powershell
npm run generate:assets:hud
npm run generate:assets:ships
npm run generate:assets:icons
npm run generate:assets:hazards
```

Validate or create the expected folder layout:

```powershell
npm run validate:asset-folders
npm run validate:asset-folders -- --fix
```

## Batch Contents

Each generated batch is saved under its own folder, for example:

```text
assets/ai_candidates/hud/weapon_slot_frame/2026-05-24_deep_neon_salvagepunk_batch_001/
```

Each batch contains:

- candidate PNG files such as `weapon_slot_frame_001.png`
- `prompt.txt`
- `manifest.json`
- `failed.json` when any candidates fail
- `contact_sheet.png` when ImageMagick is available
- `selected/` and `rejected/` review folders

## Review Notes

Generated assets need manual production cleanup before shipping. Check for baked background artifacts, stray white edge pixels after manual removal, false text-like marks, unwanted logos, bad cropping, excess noise, poor small-size readability, and inconsistent perspective.

HUD and UI frame candidates also need manual 9-slice review. The batch metadata includes estimated border values, but those are only starting points. Confirm that corners stay decorative, horizontal and vertical edges stretch cleanly, and no complex art crosses the stretch zones.

Candidate images are still not automatically imported into gameplay.
