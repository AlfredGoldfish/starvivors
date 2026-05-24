# Deep Neon Salvagepunk V1 Campaign Progress

## Where To Pick Up Next

Sections 3 and 4 ship generation is complete and waiting for review. Section 5 Hazards is next, but do not start it until the user explicitly says to continue.

Exact next Codex instruction to resume:

`Review the player and enemy ship contact sheets, then tell Codex whether to continue to Section 5.`

## Current Campaign Status

- Campaign ID: `deep_neon_salvagepunk_v1_campaign`
- Style preset: `deep_neon_salvagepunk_v1`
- Status: `waiting_for_review`
- Current section: `section_4_enemy_ships`
- Next section: `section_5_hazards`
- Started at: `2026-05-24T08:55:10.6538784-04:00`
- Updated at: `2026-05-24T10:00:38.9454798-04:00`

## Section Checklist

- [x] Section 1: HUD / UI Frames - complete by reduced-scope user approval
- [x] Section 2: Icons - complete, waiting for review
- [x] Section 3: Player Ships - complete, waiting for review
- [x] Section 4: Enemy Ships - complete, waiting for review
- [ ] Section 5: Hazards
- [ ] Section 6: Pickups
- [ ] Section 7: Projectiles and Effects

## Section 1 Output Folders

Attempted:

- `assets/ai_candidates/hud/status_readout_frame/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/hud/status_readout_frame/2026-05-24_deep_neon_salvagepunk_v1_batch_002/`

Still pending generation:

- `assets/ai_candidates/hud/status_readout_frame/`
- `assets/ai_candidates/hud/weapon_slot_frame/`
- `assets/ai_candidates/hud/mission_console_frame/`
- `assets/ai_candidates/hud/eject_button_frame/`
- `assets/ai_candidates/hud/warning_chip_frame/`
- `assets/ai_candidates/hud/tooltip_panel/`
- `assets/ai_candidates/hud/minimap_frame/`
- `assets/ai_candidates/hud/dashboard_shell/`

## Generated Counts

- `status_readout_frame` failed batch: requested 10, generated 0, failures 10.
- `status_readout_frame` retry batch: requested 3, generated 3, failures 0.
- Remaining Section 1 asset types: not attempted in this campaign run.
- `stats_icon_sheet`: requested 3, generated 3, failures 0.
- `resource_icon_sheet`: requested 3, generated 3, failures 0.
- `weapon_icon_sheet`: requested 3, generated 3, failures 0.
- `player_ship_interceptor`: requested 3, generated 3, failures 0.
- `player_ship_bulwark`: requested 3, generated 3, failures 0.
- `player_ship_variants`: requested 3, generated 3, failures 0.
- `enemy_basic_swarm_ship`: requested 3, generated 3, failures 0.
- `enemy_shooter_ship`: requested 3, generated 3, failures 0.
- `enemy_tank_ship`: requested 3, generated 3, failures 0.
- `enemy_elite_ship_sheet`: requested 3, generated 3, failures 0.
- `enemy_boss_ship`: requested 3, generated 3, failures 0.

## Contact Sheets

No Section 1 campaign contact sheets generated yet. The failed batch produced no images. The successful 3-image retry skipped contact sheet creation because ImageMagick `magick` was not available.

Section 2 contact sheets:

- `assets/ai_candidates/icons/stats/stats_icon_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/icons/resources/resource_icon_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/icons/weapons/weapon_icon_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`

Section 3 contact sheets:

- `assets/ai_candidates/ships/player_ships/player_ship_interceptor/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/ships/player_ships/player_ship_bulwark/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/ships/player_ships/player_ship_variants/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`

Section 4 contact sheets:

- `assets/ai_candidates/ships/enemy_ships/enemy_basic_swarm_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/ships/enemy_ships/enemy_shooter_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/ships/enemy_ships/enemy_tank_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/ships/enemy_ships/enemy_elite_ship_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`
- `assets/ai_candidates/ships/bosses/enemy_boss_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/contact_sheet.png`

## Failures

- `assets/ai_candidates/hud/status_readout_frame/2026-05-24_deep_neon_salvagepunk_v1_batch_001/failed.json`
- Failure reason: the old run sent invalid key/model configuration. This is stale after the generator key-file fix; retry into a new batch.
- `assets/ai_candidates/hud/status_readout_frame/2026-05-24_deep_neon_salvagepunk_v1_batch_002/`: no failures.
- Section 2: no failures.
- Section 3: no failures.
- Section 4: no failures.

## Section 2 Output Folders

- `assets/ai_candidates/icons/stats/stats_icon_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/icons/resources/resource_icon_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/icons/weapons/weapon_icon_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`

## Section 3 Output Folders

- `assets/ai_candidates/ships/player_ships/player_ship_interceptor/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/ships/player_ships/player_ship_bulwark/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/ships/player_ships/player_ship_variants/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`

## Section 4 Output Folders

- `assets/ai_candidates/ships/enemy_ships/enemy_basic_swarm_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/ships/enemy_ships/enemy_shooter_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/ships/enemy_ships/enemy_tank_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/ships/enemy_ships/enemy_elite_ship_sheet/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`
- `assets/ai_candidates/ships/bosses/enemy_boss_ship/2026-05-24_deep_neon_salvagepunk_v1_batch_001/`

## Notes For Human Review

- All generated images must remain under `assets/ai_candidates/`.
- Existing generated batches must be preserved.
- Generated candidates are not imported into gameplay, GameScene, HUD systems, or production asset folders.
- Section 1 was reduced from the original full HUD frame list to the accepted 3-image `status_readout_frame` batch by user direction.
- Section 2 generated `stats_icon_sheet`, `resource_icon_sheet`, and `weapon_icon_sheet`, 3 candidates each.
- `stats_icon_sheet` was written to the corrected `assets/ai_candidates/icons/stats/stats_icon_sheet/` folder, not the older misplaced `assets/ai_candidates/icons/stats_icon_sheet/` folder.
- User explicitly instructed to skip to player and enemy ships, overriding the prior wait point.
- Ship prompts were tightened to strict top-down orthographic game sprite view before generating Sections 3 and 4.
- Review Sections 3 and 4 before continuing to hazards.
