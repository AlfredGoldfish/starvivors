# Starvivors AI Asset Production Tracker

Last reviewed: 2026-05-31

Use this tracker to choose the one game object for each future Starvivors AI asset production session. This is a living list: update it after each session with the candidate folder, selected candidate notes, validation result, and promotion status.

This tracker works with:

- `Docs/STARVIVORS_AI_ASSET_PRODUCTION_WORKFLOW.md`
- `Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md`
- `Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md`

The first full-library batch is archived as concept work only. Do not treat those assets as production-complete unless a future one-object session reviews and promotes them.

## Status Key

- `[ ]` Not started: no production one-object session yet.
- `[R]` Reference only: useful concept/reference art exists, but no production pass is complete.
- `[C]` Candidates: standalone candidate set has been generated and saved; normal rows use 4 candidates, and custom rows note exceptions.
- `[S]` Selected: one candidate has been selected for possible future promotion.
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
| `[C]` | Splitter enemy | `enemy_splitter` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/splitter/` | Four acid-yellow 512x512 RGBA splitter candidates; no runtime promotion. |
| `[C]` | Needle Sniper enemy | `enemy_needle_sniper` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/needle_sniper/` | Four crimson/red 512x512 RGBA sniper candidates; no runtime promotion. |
| `[C]` | Shield Frigate enemy | `enemy_shield_frigate` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/shield_frigate/` | Four amber/gold 512x512 RGBA support candidates; no runtime promotion. |
| `[C]` | Repair Skiff enemy | `enemy_repair_skiff` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/repair_skiff/` | Four coral/warm-white 512x512 RGBA repair candidates; no runtime promotion. |
| `[C]` | Command Relay enemy | `enemy_command_relay` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/command_relay/` | Four electric cyan/deep-blue 512x512 RGBA command-support candidates; no runtime promotion. |
| `[C]` | Frost Gunner enemy | `enemy_frost_gunner` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/frost_gunner/` | Four icy cyan/white 512x512 RGBA cold-status gunner candidates; no runtime promotion. |
| `[C]` | Poison Leech enemy | `enemy_poison_leech` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/poison_leech/` | Four toxic lime/acid-green 512x512 RGBA poison melee candidates; no runtime promotion. |
| `[C]` | Combat Summoner enemy | `enemy_combat_summoner` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/combat_summoner/` | Original four violet/magenta candidates plus four ship-theme cyan/blue and amber v2 candidates; no runtime promotion. |
| `[C]` | Spawner Nest enemy | `enemy_spawner_nest` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/spawner_nest/` | Original four hot orange/amber candidates plus four ship-theme cyan/blue and orange v2 candidates; no runtime promotion. |
| `[C]` | Impact Bomber enemy | `enemy_impact_bomber` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/impact_bomber/` | Four ship-theme graphite/white candidates with orange-red danger cores and small cyan lights; no runtime promotion. |
| `[C]` | Phase Skiff enemy | `enemy_phase_skiff` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/phase_skiff/` | Four violet/hot-pink 512x512 RGBA skiff candidates; no runtime promotion. |
| `[C]` | Mothership boss/event threat | `boss_mothership` | 4 candidates only | `assets/ai-generated-images/production-candidates/enemies/boss_mothership/` | Four boss/event-threat graphite carrier candidates with cyan systems and amber bay warnings; no runtime promotion. |
| `[ ]` | Stronghold event structure | `event_stronghold` | 4 candidates only |  | Produce only when stronghold art pass is requested. |

## Projectiles

Default production pass: exactly 4 standalone candidates. Additional intensity, charged, warning, or impact states should be separate explicit sessions. Default sizes: `128x128`, except long shots at `256x64` or arcs at `256x128`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[C]` | Pulse Cannon bolt projectile | `projectile_pulse_bolt` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/pulse_bolt/` | Four cyan/blue 128x128 RGBA player-primary bolt candidates; no runtime promotion. |
| `[C]` | Enemy bolt projectile | `projectile_enemy_bolt` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/enemy_bolt/` | Four red/orange 128x128 RGBA generic enemy-shot candidates; no runtime promotion. |
| `[C]` | Rail shot projectile | `projectile_rail_shot` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/rail_shot/` | Four cyan/blue 256x64 RGBA long thin rail candidates; no runtime promotion. |
| `[C]` | Frost needle projectile | `projectile_frost_needle` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/frost_needle/` | Four icy cyan/white 128x128 RGBA cold-status projectile candidates; no runtime promotion. |
| `[C]` | Poison shot projectile | `projectile_poison_shot` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/poison_shot/` | Four toxic lime/acid-green 128x128 RGBA poison-status candidates generated from magenta-key sources; no runtime promotion. |
| `[C]` | Electric arc bolt projectile | `projectile_electric_arc_bolt` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/electric_arc_bolt/` | Four cyan/violet 128x128 RGBA electric-status projectile candidates; no runtime promotion. |
| `[C]` | Summoner shot projectile | `projectile_summoner_shot` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/summoner_shot/` | Four violet/magenta 128x128 RGBA special enemy-shot candidates; no runtime promotion. |
| `[C]` | Impact bomber warning marker | `projectile_impact_bomber_warning_marker` | 4 candidates only | `assets/ai-generated-images/production-candidates/projectiles/impact_bomber_warning_marker/` | Four orange/amber 256x256 RGBA warning marker candidates; no runtime promotion. |
| `[C]` | Beam contact spark projectile/VFX | `projectile_beam_contact_spark` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/beam_contact_spark/` | Four cyan/white 256x256 RGBA beam contact VFX candidates; stored under VFX; no runtime promotion. |
| `[C]` | Shield impact shard projectile/VFX | `projectile_shield_impact_shard` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/shield_impact_shard/` | Four cyan/blue 256x256 RGBA shield impact shard VFX candidates; stored under VFX; no runtime promotion. |

## VFX

Default production pass: exactly 4 standalone candidates. Additional effect states should be separate explicit sessions. Default sizes: `256x256` for small effects, `512x512` for blasts/rings.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[C]` | Muzzle flash VFX | `vfx_muzzle_flash` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/muzzle_flash/` | Four cyan-white 256x256 RGBA candidates with amber heat accents; no runtime promotion. |
| `[C]` | Enemy hit spark VFX | `vfx_enemy_hit_spark` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/enemy_hit_spark/` | Four white/red-orange 256x256 RGBA hit-spark candidates; no runtime promotion. |
| `[C]` | Shield block spark VFX | `vfx_shield_block_spark` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/shield_block_spark/` | Four cyan-blue 256x256 RGBA defensive impact candidates; no runtime promotion. |
| `[C]` | Circular energy shield VFX | `vfx_circular_energy_shield` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/circular_energy_shield/` | Four cyan/blue 512x512 RGBA circular shield candidates; no runtime promotion. |
| `[C]` | Explosion ring VFX | `vfx_explosion_ring` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/explosion_ring/` | Four orange/yellow 512x512 RGBA blast-ring candidates; no runtime promotion. |
| `[C]` | Reactor blast VFX | `vfx_reactor_blast` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/reactor_blast/` | Four violet/magenta 512x512 RGBA reactor-pulse candidates; no runtime promotion. |
| `[C]` | Poison tick burst VFX | `vfx_poison_tick_burst` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/poison_tick_burst/` | Four toxic lime/yellow-green 256x256 RGBA candidates generated from magenta-key sources; no runtime promotion. |
| `[C]` | Frost shatter VFX | `vfx_frost_shatter` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/frost_shatter/` | Four icy cyan/white 256x256 RGBA crystalline burst candidates; no runtime promotion. |
| `[C]` | Electric status pulse VFX | `vfx_electric_status_pulse` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/electric_status_pulse/` | Four cyan/violet 256x256 RGBA pulse-ring candidates; no runtime promotion. |
| `[C]` | Scrap pickup glint VFX | `vfx_scrap_pickup_glint` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/scrap_pickup_glint/` | Four cyan-white 256x256 RGBA pickup-glint candidates with graphite facets; no runtime promotion. |
| `[C]` | Upgrade pickup burst VFX | `vfx_upgrade_pickup_burst` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/upgrade_pickup_burst/` | Four gold/cyan 256x256 RGBA upgrade-burst candidates with no symbols/text; no runtime promotion. |
| `[C]` | Player death shard burst VFX | `vfx_player_death_shard_burst` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/player_death_shard_burst/` | Four cyan-white/graphite 512x512 RGBA ship-shard burst candidates; no runtime promotion. |
| `[C]` | Black-hole warning ripple VFX | `vfx_black_hole_warning_ripple` | 4 candidates only | `assets/ai-generated-images/production-candidates/vfx/black_hole_warning_ripple/` | Four violet/cyan 512x512 RGBA gravitational warning-ripple candidates; no runtime promotion. |

## Asteroids, Debris, And World Hazards

Default production pass: exactly 4 standalone candidates per named object. Asteroids default to `512x512`; debris defaults to `256x256`.

The 2026-05-31 mineral-composite asteroid batch is a custom exception: exactly 3 standalone `1024x1024` candidates per named asteroid family, with preserved chroma-key sources.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[C]` | Basalt crater asteroid mineral family | `asteroid_basalt_crater` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_basalt_crater/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Iron ore asteroid mineral family | `asteroid_iron_ore` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_iron_ore/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Copper ore asteroid mineral family | `asteroid_copper_ore` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_copper_ore/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Gold vein asteroid mineral family | `asteroid_gold_vein` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_gold_vein/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Diamond crystal asteroid mineral family | `asteroid_diamond_crystal` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_diamond_crystal/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Ice crystal asteroid mineral family | `asteroid_ice_crystal` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_ice_crystal/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Uranium ore asteroid mineral family | `asteroid_uranium_ore` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_uranium_ore/` | Three RGBA candidates with preserved magenta-key sources; no runtime promotion. |
| `[C]` | Obsidian glass asteroid mineral family | `asteroid_obsidian_glass` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_obsidian_glass/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Quartz vein asteroid mineral family | `asteroid_quartz_vein` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_quartz_vein/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
| `[C]` | Sulfur crater asteroid mineral family | `asteroid_sulfur_crater` | 3 candidates only, `1024x1024` | `assets/ai-generated-images/production-candidates/asteroids/asteroid_sulfur_crater/` | Three RGBA candidates with preserved chroma-key sources; no runtime promotion. |
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
- 2026-05-30: `enemy_phase_skiff` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/phase_skiff/` - Four standalone violet/hot-pink 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_splitter` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/splitter/` - Four standalone acid-yellow 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_needle_sniper` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/needle_sniper/` - Four standalone crimson/red 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_shield_frigate` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/shield_frigate/` - Four standalone amber/gold 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_repair_skiff` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/repair_skiff/` - Four standalone coral/warm-white 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_command_relay` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/command_relay/` - Four standalone electric cyan/deep-blue 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_frost_gunner` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/frost_gunner/` - Four standalone icy cyan/white 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_poison_leech` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/poison_leech/` - Four standalone toxic lime/acid-green 512x512 RGBA candidates generated with preserved magenta-key sources; no runtime promotion.
- 2026-05-30: `enemy_combat_summoner` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/combat_summoner/` - Four standalone violet/magenta 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_spawner_nest` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/spawner_nest/` - Four standalone hot orange/amber 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_combat_summoner` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/combat_summoner/` - Four standalone ship-theme cyan/blue and amber v2 candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_spawner_nest` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/spawner_nest/` - Four standalone ship-theme cyan/blue and orange v2 candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `enemy_impact_bomber` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/impact_bomber/` - Four standalone graphite/white/orange-red 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `boss_mothership` - `[C]` - `assets/ai-generated-images/production-candidates/enemies/boss_mothership/` - Four standalone graphite carrier 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_pulse_bolt` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/pulse_bolt/` - Four standalone cyan/blue 128x128 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_enemy_bolt` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/enemy_bolt/` - Four standalone red/orange 128x128 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_rail_shot` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/rail_shot/` - Four standalone cyan/blue 256x64 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_frost_needle` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/frost_needle/` - Four standalone icy cyan/white 128x128 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_poison_shot` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/poison_shot/` - Four standalone toxic lime/acid-green 128x128 RGBA candidates generated with preserved magenta-key sources; no runtime promotion.
- 2026-05-30: `projectile_electric_arc_bolt` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/electric_arc_bolt/` - Four standalone cyan/violet 128x128 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_summoner_shot` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/summoner_shot/` - Four standalone violet/magenta 128x128 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_impact_bomber_warning_marker` - `[C]` - `assets/ai-generated-images/production-candidates/projectiles/impact_bomber_warning_marker/` - Four standalone orange/amber 256x256 RGBA warning candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_beam_contact_spark` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/beam_contact_spark/` - Four standalone cyan/white 256x256 RGBA VFX candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `projectile_shield_impact_shard` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/shield_impact_shard/` - Four standalone cyan/blue 256x256 RGBA VFX candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-30: `vfx_circular_energy_shield` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/circular_energy_shield/` - Four standalone cyan/blue 512x512 RGBA shield candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_muzzle_flash` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/muzzle_flash/` - Four standalone cyan-white 256x256 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_enemy_hit_spark` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/enemy_hit_spark/` - Four standalone white/red-orange 256x256 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_shield_block_spark` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/shield_block_spark/` - Four standalone cyan-blue 256x256 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_explosion_ring` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/explosion_ring/` - Four standalone orange/yellow 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_reactor_blast` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/reactor_blast/` - Four standalone violet/magenta 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_poison_tick_burst` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/poison_tick_burst/` - Four standalone toxic lime/yellow-green 256x256 RGBA candidates generated with preserved magenta-key sources; no runtime promotion.
- 2026-05-31: `vfx_frost_shatter` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/frost_shatter/` - Four standalone icy cyan/white 256x256 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_electric_status_pulse` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/electric_status_pulse/` - Four standalone cyan/violet 256x256 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_scrap_pickup_glint` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/scrap_pickup_glint/` - Four standalone cyan-white 256x256 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_upgrade_pickup_burst` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/upgrade_pickup_burst/` - Four standalone gold/cyan 256x256 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_player_death_shard_burst` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/player_death_shard_burst/` - Four standalone cyan-white/graphite 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: `vfx_black_hole_warning_ripple` - `[C]` - `assets/ai-generated-images/production-candidates/vfx/black_hole_warning_ripple/` - Four standalone violet/cyan 512x512 RGBA candidates generated with preserved chroma-key sources; no runtime promotion.
- 2026-05-31: asteroid mineral-composite batch - `[C]` - `assets/ai-generated-images/production-candidates/asteroids/` - Three standalone 1024x1024 RGBA candidates each for basalt crater, iron ore, copper ore, gold vein, diamond crystal, ice crystal, uranium ore, obsidian glass, quartz vein, and sulfur crater; preserved chroma-key sources; no runtime promotion.
