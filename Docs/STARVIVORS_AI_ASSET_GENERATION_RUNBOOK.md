# Starvivors AI Asset Generation Runbook

Last reviewed: 2026-05-30

This runbook tells Codex how to generate Starvivors raster asset candidates with AI image generation. It is for asset creation and review only. Do not wire generated assets into gameplay, UI, manifests, data definitions, or build code unless the user explicitly asks for integration.

## Purpose

Use this guide when the user asks for AI-generated game art, including ships, enemies, projectiles, VFX, asteroids, pickups, UI icons, buttons, menu backgrounds, or style tests.

The goal is a repeatable asset workflow that produces clean project-local PNGs ready for human review.

## Required Reading

Before generating Starvivors assets, read:

- `Docs/README_FOR_CODEX.md`
- `Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md`
- `Docs/STARVIVORS_MVP_VISUAL_IDENTITY.md`
- `Docs/STARVIVORS_2_0_PHASE_16_ASSET_FORGE.md`
- This runbook

## Art Direction

Starvivors should read as a clean arcade sci-fi survival game.

Use these rules for generated assets:

- Prioritize readability over decoration.
- Use strong geometric silhouettes.
- Make every gameplay asset readable at small in-game sizes.
- Keep top-down sprites orthographic, centered, and fully visible.
- Use high contrast against a dark space background.
- Match the current Starvivors direction: Neon-Forward Salvagepunk.
- Let neon energy carry first read; use salvage-like machinery for structure.
- Avoid busy internal detail that collapses at gameplay scale.
- Avoid baked text except deliberate symbols or markings.

## Output Location

Save project-bound generated assets under:

```text
assets/ai-generated-images/
```

Use these subfolders for future batches:

```text
assets/ai-generated-images/
  ships/
  enemies/
  projectiles/
  vfx/
  asteroids/
  pickups/
  ui/
  buttons/
  backgrounds/
  source-chromakey/
```

The first test batch currently lives directly under `assets/ai-generated-images/`:

```text
starvivors_enemy_scout_ai.png
starvivors_enemy_wedge_striker_ai.png
starvivors_enemy_diamond_gunner_ai.png
starvivors_enemy_hex_tank_ai.png
starvivors_enemy_reactor_drone_ai.png
starvivors_enemy_phase_skiff_ai.png
```

For future batches, prefer the subfolders above.

## Naming

Use stable, descriptive lowercase snake-case filenames:

```text
starvivors_<category>_<asset_id>_ai.png
```

Examples:

```text
starvivors_ship_interceptor_ai.png
starvivors_enemy_scout_ai.png
starvivors_projectile_pulse_bolt_ai.png
starvivors_asteroid_tier_01_ai.png
starvivors_pickup_scrap_tier_01_ai.png
starvivors_ui_icon_hull_ai.png
starvivors_button_primary_idle_ai.png
```

Do not overwrite existing files unless the user explicitly asks. If a file exists, add a version suffix:

```text
starvivors_enemy_scout_ai_v2.png
```

## Default Transparent Asset Workflow

Use the built-in image generation tool first. For transparent sprites, use the chroma-key workflow:

1. Generate the asset on a perfectly flat solid `#00ff00` background.
2. Copy or process the generated output into the project.
3. Remove the chroma-key background with the installed helper:

```powershell
python C:\Users\joshu\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py `
  --input <source.png> `
  --out <transparent_candidate.png> `
  --auto-key border `
  --soft-matte `
  --transparent-threshold 12 `
  --opaque-threshold 220 `
  --despill `
  --force
```

4. Resize to the requested output dimensions while preserving alpha.
5. Validate the transparent candidate output.

Only ask about CLI/native transparency if chroma-key removal is unsuitable or fails.

## Validation

Before finishing an asset batch, validate:

- Files are in the requested project folder.
- Gameplay sprite candidates are PNG unless the user asks otherwise.
- Transparent assets use RGBA mode.
- Corners are transparent.
- Dimensions match the request, commonly `512x512` for sprites.
- The visible subject is not cropped.
- The asset remains readable when previewed around `64x64`.
- No text, watermark, extra object, floor plane, shadow, gradient background, or leftover green fringe is obvious.

After validation, commit the completed asset session before the final report. The commit should include the generated source chroma-key images, transparent candidates, and any asset tracker/checklist evidence updates for that session. Do not include runtime wiring, manifests, gameplay code, or unrelated work unless the user explicitly requested those changes.

For a quick Python validation:

```powershell
python -c "from pathlib import Path; from PIL import Image; root=Path(r'assets/ai-generated-images'); \
for p in sorted(root.rglob('*.png')): \
 im=Image.open(p).convert('RGBA'); a=im.getchannel('A'); \
 corners=[a.getpixel(xy) for xy in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]]; \
 print(f'{p}: size={im.size}, mode={im.mode}, corners={corners}, bbox={a.getbbox()}')"
```

## Batch Order

Generate assets in reviewable batches. Do not generate the whole game in one pass.

1. Style tests
   - 3 ship candidates
   - 3 asteroid candidates
   - 3 projectile or VFX candidates
   - 3 UI/button candidates
2. Player ships
   - Interceptor
   - Bulwark
   - Engineer
3. Core enemies
   - Scout
   - Wedge Striker
   - Diamond Gunner
   - Hex Tank
   - Reactor Drone
   - Splitter
   - Needle Sniper
   - Shield Frigate
   - Repair Skiff
   - Command Relay
   - Frost Gunner
   - Poison Leech
   - Combat Summoner
   - Spawner Nest
   - Impact Bomber
4. Projectiles
   - Pulse Cannon bolt
   - enemy bolt
   - rail shot
   - frost needle
   - poison shot
   - electric arc bolt
   - summoner shot
   - beam contact spark
5. VFX
   - muzzle flash
   - hit spark
   - shield block spark
   - explosion ring
   - reactor blast
   - poison tick burst
   - frost shatter
   - electric status pulse
   - pickup glint
6. Asteroids and debris
   - tiered asteroid families
   - fractured variants
   - debris chunks
   - rare ore variants
7. Pickups and resources
   - scrap tiers
   - credits
   - upgrade crate
   - banked upgrade pickup
   - special upgrade pickup
   - fuel cell if still desired
8. UI and buttons
   - icons
   - button states
   - card frames
   - panel accents
   - warning badges
9. Background and menu art
   - starfield plates
   - nebula backdrops
   - hangar backdrop
   - results backdrop
   - black-hole reference art

## Recommended Sizes

Use these defaults unless the user specifies otherwise:

```text
Gameplay ship/enemy sprites: 512x512
Hangar or profile renders: 1024x1024
Projectile sprites: 128x128 or 256x64 for long shots
VFX plates: 256x256 or 512x512
Asteroids: 512x512
Debris chunks: 256x256
Pickup sprites: 256x256
UI icons: 128x128 or 256x256
Buttons and frames: generate without baked text
Backgrounds: 1920x1080 or larger if requested
```

## Prompt Template: Transparent Top-Down Sprite

```text
Use case: stylized-concept
Asset type: game sprite, <size> PNG source for transparent cutout
Primary request: Create one top-down <asset name> for Starvivors.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal.
Subject: <clear silhouette and role>, readable at 64px.
Style/medium: polished 2D arcade game sprite, geometric sci-fi, Neon-Forward Salvagepunk, crisp edges, high contrast, no pixel art, no 3D perspective.
Composition/framing: centered, single isolated sprite, generous padding, orthographic top-down, full object visible.
Color palette: dark graphite structure with bright neon accents; do not use #00ff00 anywhere in the subject.
Constraints: background must be one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, lighting variation, text, watermark, or extra objects. No cast shadow. Keep edges crisp for chroma-key removal.
```

## Prompt Template: Projectile

```text
Use case: stylized-concept
Asset type: game projectile sprite, transparent cutout source
Primary request: Create one Starvivors <projectile name>.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Subject: bright readable projectile shape with strong silhouette and clear damage type.
Style/medium: polished 2D arcade sci-fi VFX sprite, crisp edge, minimal internal detail.
Composition/framing: centered, isolated, full object visible, generous padding.
Color palette: <damage type colors>; do not use #00ff00 in the projectile.
Constraints: no text, no watermark, no trail that reaches image edges, no background variation.
```

## Prompt Template: Asteroid Or Debris

```text
Use case: stylized-concept
Asset type: asteroid or debris gameplay sprite
Primary request: Create one Starvivors <asteroid/debris name>.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Subject: rough polygonal space rock with clear hazard silhouette, readable at gameplay scale.
Style/medium: 2D arcade sci-fi asset, simple angular planes, subtle mineral seams, high contrast.
Composition/framing: centered, isolated, full object visible, generous padding.
Color palette: dark basalt, cool gray edges, optional neon mineral cracks; do not use #00ff00 in the subject.
Constraints: no cast shadow, no dust cloud, no background stars, no text, no watermark.
```

## Prompt Template: Pickup Or UI Icon

```text
Use case: stylized-concept
Asset type: Starvivors pickup or UI icon
Primary request: Create one <pickup/icon name>.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Subject: simple icon-like object with a unique silhouette and strong center read.
Style/medium: polished arcade sci-fi icon, geometric, clean, readable at 32px and 64px.
Composition/framing: centered, isolated, full object visible, generous padding.
Color palette: high contrast with a distinct accent color; do not use #00ff00 in the subject.
Constraints: no words, no numbers, no watermark, no background effects, no cast shadow.
```

## Prompt Template: UI Button Or Frame

```text
Use case: ui-mockup
Asset type: Starvivors UI button or frame asset
Primary request: Create one <button/frame state> asset with no baked text.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Subject: clean sci-fi UI frame with Neon-Forward Salvagepunk accents, readable against dark panels.
Style/medium: 2D game UI asset, crisp border, restrained detail, usable as a reusable frame.
Composition/framing: centered, isolated, full frame visible, transparent-safe edges.
Color palette: dark graphite base, pale outline, neon accent; do not use #00ff00 in the subject.
Constraints: no text, no icons unless requested, no watermark, no background texture, no shadow.
```

## Do Not

- Do not change runtime code during an asset-generation-only request.
- Do not edit asset manifests or definitions unless the user asks for integration.
- Do not overwrite existing project assets without explicit permission.
- Do not delete the built-in generated source files under `.codex/generated_images`.
- Do not leave project-bound generated assets only under `.codex/generated_images`.
- Do not bake UI text into buttons or panels unless the user gives exact text.
- Do not use busy backgrounds or shadows for transparent gameplay sprites.
- Do not treat generated assets as approved final art until the user reviews them.

## Reporting Back

At the end of an asset session, report:

- The saved candidate folder.
- The file names generated.
- Whether assets are transparent PNGs and their dimensions.
- Whether chroma-key removal and alpha validation passed.
- The git commit hash for the completed asset session.
- Any assets that need regeneration or manual review.

Keep the response short unless the user asks for a detailed audit.
