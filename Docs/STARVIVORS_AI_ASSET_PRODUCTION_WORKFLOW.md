# Starvivors AI Asset Production Workflow

Last reviewed: 2026-05-30

This document is the reusable Codex workflow for future Starvivors AI asset production sessions. It replaces the earlier "generate everything in one session" approach with one game object per session, preserving the successful concept art direction while avoiding multi-object sheet cropping problems.

Use this document together with `Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md`. The runbook covers general generation, chroma-key removal, naming, and validation. This workflow controls the production cadence and per-object decision process.

## Purpose

The existing full-library batch is a concept test batch only. Future production candidates should be generated one named game object at a time, with user review before any selection or promotion into runtime.

Each production session generates exactly four standalone candidate variations for the named object. Do not generate follow-up damaged variants or "final" variant sets by default. Current image generation can change major structural details between related prompts, so damage-state variants are not reliable enough for the default workflow.

Generated assets are for review unless the user explicitly asks to wire them into gameplay, UI, manifests, data definitions, or build code.

## Required Session Inputs

At the start of each future asset session, the user only needs to provide:

```text
The phase/game object for this session is: <asset name or game object>
```

Examples:

```text
The phase/game object for this session is: Diamond Gunner.
The phase/game object for this session is: Primary button frame.
The phase/game object for this session is: Scrap tier 1 pickup.
The phase/game object for this session is: Interceptor player ship.
```

If the user does not provide the object, ask for it before generating images.

## Art Direction Anchor

Use the original single-sprite AI concepts in `assets/ai-generated-images/` as the style reference pack:

```text
assets/ai-generated-images/starvivors_enemy_diamond_gunner_ai.png
assets/ai-generated-images/starvivors_enemy_scout_ai.png
assets/ai-generated-images/starvivors_enemy_wedge_striker_ai.png
assets/ai-generated-images/starvivors_enemy_hex_tank_ai.png
assets/ai-generated-images/starvivors_enemy_reactor_drone_ai.png
assets/ai-generated-images/starvivors_enemy_phase_skiff_ai.png
```

Primary anchor: `starvivors_enemy_diamond_gunner_ai.png`.

Preserve these traits across future assets:

- Top-down orthographic view.
- Dark graphite geometric plating.
- Crisp white edge highlights.
- Neon energy accents, usually blue unless the object needs a different gameplay read.
- Strong, readable silhouettes.
- Clean arcade sci-fi finish.
- No scene lighting, floor plane, cast shadow, baked text, watermark, or background dependence.
- Readable at 64px for gameplay sprites and 32-64px for small icons.

The other reference sprites define acceptable role variety: Scout for simple light enemies, Wedge Striker for aggressive angular attackers, Hex Tank for heavy bodies, Reactor Drone for circular energy threats, and Phase Skiff for sleek special movement.

## Per-Object Session Workflow

Each session works on one named game object only. Do not generate a multi-object sheet, contact sheet, grid, or sprite atlas.

1. Read this workflow, the generation runbook, and the complete-game checklist.
2. Confirm the single phase/game object for the session.
3. Discuss the object before generation:
   - Gameplay role and first-read priority.
   - Silhouette shape and movement/attack identity.
   - Accent color and danger/readability color.
   - Required output size.
   - Candidate variation axes, such as silhouette, plating density, or accent placement.
4. Generate exactly 4 standalone candidate variations for that one object.
5. Save source chroma-key images and transparent candidates under the production-candidates folder.
6. Let the user pick a direction or request a combined revision in a later session if needed.
7. Validate transparency, dimensions, centering, cropping, and small-size readability for the four candidates.
8. Commit the completed asset session before the final report, including source chroma-key images, transparent candidates, and any tracker/checklist evidence updates.
9. Report candidate filenames, validation results, and the commit hash.

Do not make runtime code changes during an asset-only session.

## Output Location

Use this production root for all future one-object asset work:

```text
assets/ai-generated-images/production-candidates/
```

Suggested structure:

```text
assets/ai-generated-images/production-candidates/
  references/
  ships/<asset_id>/
  enemies/<asset_id>/
  projectiles/<asset_id>/
  vfx/<asset_id>/
  asteroids/<asset_id>/
  pickups/<asset_id>/
  ui/<asset_id>/
  buttons/<asset_id>/
  backgrounds/<asset_id>/
  source-chromakey/<asset_id>/
```

Keep source chroma-key images in `source-chromakey/<asset_id>/`. Keep transparent candidate PNGs in the relevant category/object folder.

Do not overwrite existing files unless the user explicitly asks. If a name already exists, add a version suffix such as `_v2`.

## Naming

Use stable lowercase snake-case names.

Candidates:

```text
starvivors_<category>_<asset_id>_candidate_01_ai.png
starvivors_<category>_<asset_id>_candidate_02_ai.png
starvivors_<category>_<asset_id>_candidate_03_ai.png
starvivors_<category>_<asset_id>_candidate_04_ai.png
```

Examples:

```text
starvivors_enemy_scout_candidate_01_ai.png
starvivors_enemy_scout_candidate_02_ai.png
starvivors_button_primary_idle_candidate_01_ai.png
starvivors_pickup_scrap_tier_01_candidate_01_ai.png
```

## Candidate Variation Rules

All production sessions:

```text
candidate_01
candidate_02
candidate_03
candidate_04
```

Do not generate damaged variants by default. In practice, damage prompts can change the ship or enemy's major structure, engine count, wing count, or silhouette, which makes them unsuitable for production review as variants of the same object.

For every asset type:

- Generate exactly 4 standalone candidates for the named object.
- Keep each prompt close to the same gameplay role and output size.
- Vary one or two reviewable qualities: silhouette, armor/plating density, accent placement, color read, or proportion.
- If the game later needs another state, tier, UI state, or damage state, treat that as a separate explicit asset session with its own 4 candidates.

## Asset Coverage

Use this list to choose future one-object sessions. Do not generate the whole list in one session.

Player ships:

- Interceptor
- Bulwark
- Engineer

Enemies, bosses, and special threats:

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
- Any future boss or special event threat named by the user

Projectiles:

- Pulse Cannon bolt
- Enemy bolt
- Rail shot
- Frost needle
- Poison shot
- Electric arc bolt
- Summoner shot
- Impact bomber warning marker
- Beam contact spark
- Shield impact shard

VFX:

- Muzzle flash
- Enemy hit spark
- Shield block spark
- Explosion ring
- Reactor blast
- Poison tick burst
- Frost shatter
- Electric status pulse
- Scrap pickup glint
- Upgrade pickup burst
- Player death shard burst

World assets:

- Asteroid tiers
- Fractured asteroids
- Debris chunks
- Rare ore asteroid
- Rare crystal asteroid
- Black-hole warning/reference art

Pickups and resources:

- Scrap tiers
- Credits
- Upgrade crate
- Banked upgrade pickup
- Special upgrade pickup
- Fuel cell if still desired
- Rare part placeholder if still desired

UI and buttons:

- Button families
- Panel backings
- Tabs
- Card frames by rarity
- Warning badges
- Ship stat icons
- Weapon icons
- Settings icons
- Radar/minimap icons

Backgrounds:

- Starfield plate
- Nebula backdrop
- Sector map background
- Hangar backdrop
- Results screen background
- Black-hole reference art

## Transparency Workflow

Use single-image chroma-key removal for transparent assets.

Rules:

- One source image must contain one candidate only.
- Use a perfectly flat solid chroma-key background.
- Do not use multi-object sheets, grids, contact sheets, or atlases.
- Keep the object centered with generous padding.
- Preserve the source chroma-key image.
- Remove the key color locally and export a transparent PNG.

If the user later asks for native transparency instead of chroma-key removal, explain that it is a different generation path and ask before switching.

## Validation

Before ending each asset session, validate:

- Files are saved under `assets/ai-generated-images/production-candidates/`.
- Transparent candidate assets are PNG files in RGBA mode.
- Corners are transparent.
- Dimensions match the agreed output size.
- The object is centered and not cropped.
- The object has no leftover chroma-key fringe.
- No baked UI text, watermark, shadows, floor plane, or extra objects.
- Gameplay sprites remain readable around 64px.
- UI icons remain readable around 32-64px.

Report:

- Saved candidate folder.
- Saved source chroma-key folder.
- Candidate filenames.
- Dimensions.
- Alpha validation result.
- Any asset that needs regeneration or manual review.

## Copy/Paste Prompt For Future Codex Sessions

Use this prompt to start future production sessions. Replace only the final placeholder with the current phase/game object.

```text
We are working on Starvivors AI asset production.

Read and follow:
- Docs/STARVIVORS_AI_ASSET_PRODUCTION_WORKFLOW.md
- Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md
- Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md

This is an asset-generation-only session. Do not write gameplay code, wire assets into runtime, edit manifests, or replace existing runtime assets unless I explicitly ask.

Use the original root AI concepts as the style reference pack:
- assets/ai-generated-images/starvivors_enemy_diamond_gunner_ai.png
- assets/ai-generated-images/starvivors_enemy_scout_ai.png
- assets/ai-generated-images/starvivors_enemy_wedge_striker_ai.png
- assets/ai-generated-images/starvivors_enemy_hex_tank_ai.png
- assets/ai-generated-images/starvivors_enemy_reactor_drone_ai.png
- assets/ai-generated-images/starvivors_enemy_phase_skiff_ai.png

The primary art anchor is Diamond Gunner: top-down orthographic, dark graphite geometric plating, crisp white edge highlights, blue/neon energy accents, clean arcade sci-fi readability, no scene lighting, no floor plane, no text.

This session's phase/game object is:

<PHASE_OR_GAME_OBJECT_HERE>

Start by discussing this specific object's gameplay role, silhouette, candidate variation axes, accent color, and required output size. Then make a clear per-object image-generation plan before generating anything.

Important rules:
- Work on one named game object only.
- Generate standalone images only, never multi-object sheets or grids.
- Generate exactly 4 candidate variations.
- Do not generate damaged variants or final variant sets by default.
- Use single-image chroma-key removal for transparent assets.
- Save candidates under assets/ai-generated-images/production-candidates/.
- Preserve source chroma-key images.
- Validate dimensions, RGBA alpha, transparent corners, centering, and 64px readability.
- Report candidate saved filenames and validation results.
```

## Session Closeout

For checklist-related asset work, update `Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md` with evidence before ending the session. Do not mark final art complete until a candidate has been reviewed at gameplay scale and explicitly promoted.

Every AI asset production session must end with a git commit after validation and evidence updates. Include only the session's generated source images, transparent candidate assets, and asset/checklist documentation changes. Do not include gameplay code, runtime wiring, manifests, or unrelated work unless the user explicitly requested those changes. If the worktree has no session changes to commit, state that explicitly in the final report.
