# Starvivors AI Asset Production Tracker

Last reviewed: 2026-05-30

Use this tracker to choose the one game object for each future Starvivors AI asset production session. This is a living list: update it after each session with the candidate folder, selected candidate notes, validation result, and promotion status.

This tracker works with:

- `Docs/STARVIVORS_AI_ASSET_PRODUCTION_WORKFLOW.md`
- `Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md`
- `Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md`

The first full-library batch is archived as concept work only. Do not treat those assets as production-complete unless a future one-object session reviews and promotes them.

## Status Key

- `[ ]` Not started: no production one-object session yet.
- `[R]` Reference only: useful concept/reference art exists, but no production pass is complete.
- `[C]` Candidates: 4 standalone candidates have been generated and saved.
- `[S]` Selected: one of the 4 candidates has been selected for possible future promotion.
- `[P]` Promoted: asset has been manually wired into runtime/UI by explicit user request.

## Session Starter Prompt

Copy this prompt into a new Codex session, then paste one row's `Session prompt object` after the final line.

```text
We are working on Starvivors AI asset production.

Read and follow:
- Docs/STARVIVORS_AI_ASSET_PRODUCTION_WORKFLOW.md
- Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md
- Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md

This is an asset-generation-only session. Do not write gameplay code, wire assets into runtime, edit manifests, or replace existing runtime assets unless I explicitly ask.

Use the original root AI concepts as the style reference pack:
- assets/ai-generated-images/starvivors_enemy_diamond_gunner_ai.png
- assets/ai-generated-images/starvivors_enemy_hex_tank_ai.png
- assets/ai-generated-images/starvivors_enemy_reactor_drone_ai.png
- assets/ai-generated-images/starvivors_enemy_phase_skiff_ai.png

The primary art anchor is Diamond Gunner: top-down orthographic, dark graphite geometric plating, crisp white edge highlights, blue/neon energy accents, clean arcade sci-fi readability, no scene lighting, no floor plane, no text.

This session's phase/game object is:
```

Reference note: `starvivors_enemy_scout_ai.png` and `starvivors_enemy_wedge_striker_ai.png` also exist as optional style references in the production workflow doc. Use them when the session object benefits from light-enemy or charger silhouette language.

## How To Update This Tracker

After each production session, update that object's row:

- Set `Status` to `[C]`, `[S]`, or `[P]`.
- Add the production folder path in `Evidence / Folder`.
- Add selected candidate filename or review notes in `Notes`.
- Leave status below `[P]` until the user explicitly asks to wire the asset into the game.

## Player Ships

Default production pass for each ship: exactly 4 standalone candidates. Do not generate damaged variants. Default size: `512x512` gameplay sprite. Add profile/icon passes only as separate rows if needed.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[C]` | Interceptor player ship gameplay sprite | `ship_interceptor` | 4 candidates only | `assets/ai-generated-images/production-candidates/ships/interceptor/` | Candidate 04 is the preferred direction; no runtime promotion. |
| `[C]` | Bulwark player ship gameplay sprite | `ship_bulwark` | 4 candidates only | `assets/ai-generated-images/production-candidates/ships/bulwark/` | Four 512x512 RGBA candidates; no runtime promotion. |
| `[C]` | Engineer player ship gameplay sprite | `ship_engineer` | 4 candidates only | `assets/ai-generated-images/production-candidates/ships/engineer/` | Four red/orange-accent 512x512 RGBA candidates; no runtime promotion. |
| `[ ]` | Interceptor player ship hangar/profile render | `ship_interceptor_profile` | 4 candidates only |  | Optional menu/hangar art. |
| `[ ]` | Bulwark player ship hangar/profile render | `ship_bulwark_profile` | 4 candidates only |  | Optional menu/hangar art. |
| `[ ]` | Engineer player ship hangar/profile render | `ship_engineer_profile` | 4 candidates only |  | Optional menu/hangar art. |
| `[ ]` | Interceptor player ship icon | `ship_interceptor_icon` | 4 candidates only |  | Optional UI icon. |
| `[ ]` | Bulwark player ship icon | `ship_bulwark_icon` | 4 candidates only |  | Optional UI icon. |
| `[ ]` | Engineer player ship icon | `ship_engineer_icon` | 4 candidates only |  | Optional UI icon. |

## Enemies, Bosses, And Special Threats

Default production pass for each enemy or ship-like threat: exactly 4 standalone candidates. Do not generate damaged variants. Default size: `512x512`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[C]` | Scout enemy | `enemy_scout` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/scout/` | Four cyan/teal 512x512 RGBA candidates; no runtime promotion. |
| `[C]` | Wedge Striker enemy | `enemy_wedge_striker` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/wedge_striker/` | Four red/orange 512x512 RGBA charger candidates; no runtime promotion. |
| `[C]` | Diamond Gunner enemy | `enemy_diamond_gunner` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/diamond_gunner/` | Four blue 512x512 RGBA gunship candidates; no runtime promotion. |
| `[C]` | Hex Tank enemy | `enemy_hex_tank` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/hex_tank/` | Four amber/yellow 512x512 RGBA heavy candidates; no runtime promotion. |
| `[C]` | Reactor Drone enemy | `enemy_reactor_drone` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/reactor_drone/` | Four violet/magenta 512x512 RGBA reactor candidates; no runtime promotion. |
| `[ ]` | Splitter enemy | `enemy_splitter` | 4 candidates only |  | Needs production concept. |
| `[ ]` | Needle Sniper enemy | `enemy_needle_sniper` | 4 candidates only |  | Long-range high-threat silhouette. |
| `[ ]` | Shield Frigate enemy | `enemy_shield_frigate` | 4 candidates only |  | Support/defensive threat. |
| `[ ]` | Repair Skiff enemy | `enemy_repair_skiff` | 4 candidates only |  | Support healer/repair read. |
| `[ ]` | Command Relay enemy | `enemy_command_relay` | 4 candidates only |  | Priority support target. |
| `[ ]` | Frost Gunner enemy | `enemy_frost_gunner` | 4 candidates only |  | Cold/status color read. |
| `[ ]` | Poison Leech enemy | `enemy_poison_leech` | 4 candidates only |  | Poison/status melee read. |
| `[ ]` | Combat Summoner enemy | `enemy_combat_summoner` | 4 candidates only |  | Spawns or calls support. |
| `[ ]` | Spawner Nest enemy | `enemy_spawner_nest` | 4 candidates only |  | Large stationary/slow spawning threat. |
| `[ ]` | Impact Bomber enemy | `enemy_impact_bomber` | 4 candidates only |  | Explosive warning silhouette. |
| `[R]` | Phase Skiff enemy | `enemy_phase_skiff` | 4 candidates only | `assets/ai-generated-images/starvivors_enemy_phase_skiff_ai.png` | Root concept exists; not currently listed in core roster but useful special reference. |
| `[ ]` | Mothership boss/event threat | `boss_mothership` | 4 candidates only |  | Produce only when boss art pass is requested. |
| `[ ]` | Stronghold event structure | `event_stronghold` | 4 candidates only |  | Produce only when stronghold art pass is requested. |

## Projectiles

Default production pass: exactly 4 standalone candidates. Additional intensity, charged, warning, or impact states should be separate explicit sessions. Default sizes: `128x128`, except long shots at `256x64` or arcs at `256x128`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Pulse Cannon bolt projectile | `projectile_pulse_bolt` | 4 candidates only |  | Player primary projectile. |
| `[ ]` | Enemy bolt projectile | `projectile_enemy_bolt` | 4 candidates only |  | Generic enemy shot. |
| `[ ]` | Rail shot projectile | `projectile_rail_shot` | 4 candidates only |  | Long thin sniper/rail asset. |
| `[ ]` | Frost needle projectile | `projectile_frost_needle` | 4 candidates only |  | Cold/status projectile. |
| `[ ]` | Poison shot projectile | `projectile_poison_shot` | 4 candidates only |  | Poison/status projectile. |
| `[ ]` | Electric arc bolt projectile | `projectile_electric_arc_bolt` | 4 candidates only |  | Electric/status projectile. |
| `[ ]` | Summoner shot projectile | `projectile_summoner_shot` | 4 candidates only |  | Special enemy projectile. |
| `[ ]` | Impact bomber warning marker | `projectile_impact_bomber_warning_marker` | 4 candidates only |  | Warning/telegraph marker. |
| `[ ]` | Beam contact spark projectile/VFX | `projectile_beam_contact_spark` | 4 candidates only |  | Beam impact contact effect. |
| `[ ]` | Shield impact shard projectile/VFX | `projectile_shield_impact_shard` | 4 candidates only |  | Defensive impact fragment. |

## VFX

Default production pass: exactly 4 standalone candidates. Additional effect states should be separate explicit sessions. Default sizes: `256x256` for small effects, `512x512` for blasts/rings.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Muzzle flash VFX | `vfx_muzzle_flash` | 4 candidates only |  | Weapon firing flash. |
| `[ ]` | Enemy hit spark VFX | `vfx_enemy_hit_spark` | 4 candidates only |  | Common hit feedback. |
| `[ ]` | Shield block spark VFX | `vfx_shield_block_spark` | 4 candidates only |  | Ramming Shield/block feedback. |
| `[ ]` | Explosion ring VFX | `vfx_explosion_ring` | 4 candidates only |  | General explosion ring. |
| `[ ]` | Reactor blast VFX | `vfx_reactor_blast` | 4 candidates only |  | Reactor Drone blast. |
| `[ ]` | Poison tick burst VFX | `vfx_poison_tick_burst` | 4 candidates only |  | DOT/status feedback. |
| `[ ]` | Frost shatter VFX | `vfx_frost_shatter` | 4 candidates only |  | Cold/status feedback. |
| `[ ]` | Electric status pulse VFX | `vfx_electric_status_pulse` | 4 candidates only |  | Electric/status feedback. |
| `[ ]` | Scrap pickup glint VFX | `vfx_scrap_pickup_glint` | 4 candidates only |  | Pickup feedback. |
| `[ ]` | Upgrade pickup burst VFX | `vfx_upgrade_pickup_burst` | 4 candidates only |  | Upgrade feedback. |
| `[ ]` | Player death shard burst VFX | `vfx_player_death_shard_burst` | 4 candidates only |  | Player destruction feedback. |
| `[ ]` | Black-hole warning ripple VFX | `vfx_black_hole_warning_ripple` | 4 candidates only |  | Hazard warning feedback. |

## Asteroids, Debris, And World Hazards

Default production pass: exactly 4 standalone candidates per named object. Asteroids default to `512x512`; debris defaults to `256x256`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Asteroid tier 01 | `asteroid_tier_01` | 4 candidates only |  | Small/basic hazard. |
| `[ ]` | Asteroid tier 02 | `asteroid_tier_02` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 03 | `asteroid_tier_03` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 04 | `asteroid_tier_04` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 05 | `asteroid_tier_05` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 06 | `asteroid_tier_06` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 07 | `asteroid_tier_07` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 08 | `asteroid_tier_08` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 09 | `asteroid_tier_09` | 4 candidates only |  |  |
| `[ ]` | Asteroid tier 10 | `asteroid_tier_10` | 4 candidates only |  | Large/high-value hazard. |
| `[ ]` | Fractured asteroid family | `asteroid_fractured_family` | 4 candidates only |  | Can be handled as one small family session. |
| `[ ]` | Debris chunk family | `debris_chunk_family` | 4 candidates only |  | Can be handled as one small family session. |
| `[ ]` | Rare ore asteroid | `asteroid_rare_ore` | 4 candidates only |  | Resource variant. |
| `[ ]` | Rare crystal asteroid | `asteroid_rare_crystal` | 4 candidates only |  | Resource variant. |
| `[ ]` | Black-hole visual reference | `world_black_hole_reference` | 4 candidates only |  | Background/reference or hazard art. |

## Pickups And Resources

Default production pass: exactly 4 standalone candidates. Gameplay pickup default size: `256x256`; UI icons can be `128x128` or `256x256`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Scrap tier 1 pickup | `pickup_scrap_tier_01` | 4 candidates only |  | Lowest scrap tier. |
| `[ ]` | Scrap tier 2 pickup | `pickup_scrap_tier_02` | 4 candidates only |  |  |
| `[ ]` | Scrap tier 3 pickup | `pickup_scrap_tier_03` | 4 candidates only |  |  |
| `[ ]` | Scrap tier 4 pickup | `pickup_scrap_tier_04` | 4 candidates only |  | Highest scrap tier. |
| `[ ]` | Credits pickup/resource icon | `pickup_credits` | 4 candidates only |  | Post-run spend resource. |
| `[ ]` | Upgrade crate pickup | `pickup_upgrade_crate` | 4 candidates only |  | Upgrade source. |
| `[ ]` | Banked upgrade pickup | `pickup_banked_upgrade` | 4 candidates only |  | Banked progression pickup. |
| `[ ]` | Special upgrade pickup | `pickup_special_upgrade` | 4 candidates only |  | Rare upgrade source. |
| `[ ]` | Fuel cell pickup | `pickup_fuel_cell` | 4 candidates only |  | Optional/future. |
| `[ ]` | Rare part pickup/resource icon | `pickup_rare_part` | 4 candidates only |  | Optional/future. |

## UI, Buttons, Cards, And Icons

Buttons and reusable frames should not contain baked text. Each button/frame/icon session still produces exactly 4 candidates only. If a full button state set is needed later, run each state as its own explicit session.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Primary button frame family | `button_primary_family` | 4 candidates only |  | No baked text. |
| `[ ]` | Danger button frame family | `button_danger_family` | 4 candidates only |  | Eject/warning actions. |
| `[ ]` | Neutral button frame family | `button_neutral_family` | 4 candidates only |  | Secondary actions. |
| `[ ]` | Panel backing UI frame | `ui_panel_backing` | 4 candidates only |  | Reusable panel texture/frame. |
| `[ ]` | Tab active UI frame | `ui_tab_active` | 4 candidates only |  | No baked text. |
| `[ ]` | Tab inactive UI frame | `ui_tab_inactive` | 4 candidates only |  | No baked text. |
| `[ ]` | Common upgrade card frame | `ui_card_common` | 4 candidates only |  | Rarity frame. |
| `[ ]` | Rare upgrade card frame | `ui_card_rare` | 4 candidates only |  | Rarity frame. |
| `[ ]` | Epic upgrade card frame | `ui_card_epic` | 4 candidates only |  | Rarity frame. |
| `[ ]` | Legendary upgrade card frame | `ui_card_legendary` | 4 candidates only |  | Rarity frame. |
| `[ ]` | Danger warning badge icon | `ui_warning_badge_danger` | 4 candidates only |  | Warning icon/badge. |
| `[ ]` | Mission warning badge icon | `ui_warning_badge_mission` | 4 candidates only |  | Mission/objective badge. |
| `[ ]` | Hull stat icon | `ui_icon_hull` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Fuel stat icon | `ui_icon_fuel` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Scrap resource icon | `ui_icon_scrap` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Weapon icon | `ui_icon_weapon` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Settings icon | `ui_icon_settings` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Radar icon | `ui_icon_radar` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Minimap icon | `ui_icon_minimap` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Speed stat icon | `ui_icon_speed` | 4 candidates only |  | 32-64px readability. |
| `[ ]` | Shield stat icon | `ui_icon_shield` | 4 candidates only |  | 32-64px readability. |

## Backgrounds And Menu Art

Backgrounds do not need transparency unless the user asks for layered UI pieces. Default production pass is exactly 4 standalone candidates. Default size: `1920x1080`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Starfield background plate | `background_starfield_plate` | 4 candidates only |  | Menu/gameplay background candidate. |
| `[ ]` | Nebula backdrop | `background_nebula_backdrop` | 4 candidates only |  | Menu mood/background. |
| `[ ]` | Sector map background | `background_sector_map` | 4 candidates only |  | Map/menu background. |
| `[ ]` | Hangar backdrop | `background_hangar_backdrop` | 4 candidates only |  | Ship/hangar screen. |
| `[ ]` | Results screen background | `background_results_screen` | 4 candidates only |  | Debrief/results screen. |
| `[ ]` | Black-hole background/reference art | `background_black_hole_reference` | 4 candidates only |  | Menu/reference background. |

## Session Log

Add one line per completed production session.

```text
- YYYY-MM-DD: <asset id> - <status> - <folder/path> - <notes>
```

- 2026-05-30: `ship_bulwark` - `[C]` - `assets/ai-generated-images/production-candidates/ships/bulwark/` - Four standalone 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `ship_engineer` - `[C]` - `assets/ai-generated-images/production-candidates/ships/engineer/` - Four standalone red/orange-accent 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_diamond_gunner` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/diamond_gunner/` - Four standalone blue 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_scout` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/scout/` - Four standalone cyan/teal 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_wedge_striker` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/wedge_striker/` - Four standalone red/orange 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_hex_tank` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/hex_tank/` - Four standalone amber/yellow 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_reactor_drone` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/reactor_drone/` - Four standalone violet/magenta 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
