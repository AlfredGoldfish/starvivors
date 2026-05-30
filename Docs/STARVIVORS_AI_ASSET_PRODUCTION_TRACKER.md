# Starvivors AI Asset Production Tracker

Last reviewed: 2026-05-30

Use this tracker to choose the one game object for each future Starvivors AI asset production session. This is a living list: update it after each session with the candidate folder, selected finals, validation result, and promotion status.

This tracker works with:

- `Docs/STARVIVORS_AI_ASSET_PRODUCTION_WORKFLOW.md`
- `Docs/STARVIVORS_AI_ASSET_GENERATION_RUNBOOK.md`
- `Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md`

The first full-library batch is archived as concept work only. Do not treat those assets as production-complete unless a future one-object session reviews and promotes them.

## Status Key

- `[ ]` Not started: no production one-object session yet.
- `[R]` Reference only: useful concept/reference art exists, but no production pass is complete.
- `[C]` Candidates: 4 standalone candidates have been generated and saved.
- `[S]` Selected: a candidate direction has been selected.
- `[F]` Finals: final variants have been generated and validated.
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

- Set `Status` to `[C]`, `[S]`, `[F]`, or `[P]`.
- Add the production folder path in `Evidence / Folder`.
- Add selected final filenames or notes in `Notes`.
- Leave status below `[P]` until the user explicitly asks to wire the asset into the game.

## Player Ships

Default finals for each ship: `base`, `damaged_01`, `damaged_02`, `damaged_03`. Default size: `512x512` gameplay sprite. Add profile/icon passes only as separate rows if needed.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Interceptor player ship gameplay sprite | `ship_interceptor` | base + 3 damage variants |  | Fast/light player ship. |
| `[ ]` | Bulwark player ship gameplay sprite | `ship_bulwark` | base + 3 damage variants |  | Heavy defensive player ship. |
| `[ ]` | Engineer player ship gameplay sprite | `ship_engineer` | base + 3 damage variants |  | Utility/support player ship. |
| `[ ]` | Interceptor player ship hangar/profile render | `ship_interceptor_profile` | 1024x1024 profile render |  | Optional menu/hangar art. |
| `[ ]` | Bulwark player ship hangar/profile render | `ship_bulwark_profile` | 1024x1024 profile render |  | Optional menu/hangar art. |
| `[ ]` | Engineer player ship hangar/profile render | `ship_engineer_profile` | 1024x1024 profile render |  | Optional menu/hangar art. |
| `[ ]` | Interceptor player ship icon | `ship_interceptor_icon` | 256x256 icon |  | Optional UI icon. |
| `[ ]` | Bulwark player ship icon | `ship_bulwark_icon` | 256x256 icon |  | Optional UI icon. |
| `[ ]` | Engineer player ship icon | `ship_engineer_icon` | 256x256 icon |  | Optional UI icon. |

## Enemies, Bosses, And Special Threats

Default finals for each enemy or ship-like threat: `base`, `damaged_01`, `damaged_02`, `damaged_03`. Default size: `512x512`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[R]` | Scout enemy | `enemy_scout` | base + 3 damage variants | `assets/ai-generated-images/starvivors_enemy_scout_ai.png` | Root concept exists; production pass not started. |
| `[R]` | Wedge Striker enemy | `enemy_wedge_striker` | base + 3 damage variants | `assets/ai-generated-images/starvivors_enemy_wedge_striker_ai.png` | Root concept exists; production pass not started. |
| `[R]` | Diamond Gunner enemy | `enemy_diamond_gunner` | base + 3 damage variants | `assets/ai-generated-images/starvivors_enemy_diamond_gunner_ai.png` | Primary art anchor; recommended first production pass. |
| `[R]` | Hex Tank enemy | `enemy_hex_tank` | base + 3 damage variants | `assets/ai-generated-images/starvivors_enemy_hex_tank_ai.png` | Root concept exists; production pass not started. |
| `[R]` | Reactor Drone enemy | `enemy_reactor_drone` | base + 3 damage variants | `assets/ai-generated-images/starvivors_enemy_reactor_drone_ai.png` | Root concept exists; production pass not started. |
| `[ ]` | Splitter enemy | `enemy_splitter` | base + 3 damage variants |  | Needs production concept. |
| `[ ]` | Needle Sniper enemy | `enemy_needle_sniper` | base + 3 damage variants |  | Long-range high-threat silhouette. |
| `[ ]` | Shield Frigate enemy | `enemy_shield_frigate` | base + 3 damage variants |  | Support/defensive threat. |
| `[ ]` | Repair Skiff enemy | `enemy_repair_skiff` | base + 3 damage variants |  | Support healer/repair read. |
| `[ ]` | Command Relay enemy | `enemy_command_relay` | base + 3 damage variants |  | Priority support target. |
| `[ ]` | Frost Gunner enemy | `enemy_frost_gunner` | base + 3 damage variants |  | Cold/status color read. |
| `[ ]` | Poison Leech enemy | `enemy_poison_leech` | base + 3 damage variants |  | Poison/status melee read. |
| `[ ]` | Combat Summoner enemy | `enemy_combat_summoner` | base + 3 damage variants |  | Spawns or calls support. |
| `[ ]` | Spawner Nest enemy | `enemy_spawner_nest` | base + 3 damage variants |  | Large stationary/slow spawning threat. |
| `[ ]` | Impact Bomber enemy | `enemy_impact_bomber` | base + 3 damage variants |  | Explosive warning silhouette. |
| `[R]` | Phase Skiff enemy | `enemy_phase_skiff` | base + 3 damage variants | `assets/ai-generated-images/starvivors_enemy_phase_skiff_ai.png` | Root concept exists; not currently listed in core roster but useful special reference. |
| `[ ]` | Mothership boss/event threat | `boss_mothership` | base + 3 damage variants |  | Produce only when boss art pass is requested. |
| `[ ]` | Stronghold event structure | `event_stronghold` | base + damage/weakpoint variants |  | Produce only when stronghold art pass is requested. |

## Projectiles

Default first pass: 4 standalone candidates. Finals are object-specific, usually `base` plus intensity, charged, warning, or impact variants. Default sizes: `128x128`, except long shots at `256x64` or arcs at `256x128`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Pulse Cannon bolt projectile | `projectile_pulse_bolt` | candidates + selected finals |  | Player primary projectile. |
| `[ ]` | Enemy bolt projectile | `projectile_enemy_bolt` | candidates + selected finals |  | Generic enemy shot. |
| `[ ]` | Rail shot projectile | `projectile_rail_shot` | candidates + selected finals |  | Long thin sniper/rail asset. |
| `[ ]` | Frost needle projectile | `projectile_frost_needle` | candidates + selected finals |  | Cold/status projectile. |
| `[ ]` | Poison shot projectile | `projectile_poison_shot` | candidates + selected finals |  | Poison/status projectile. |
| `[ ]` | Electric arc bolt projectile | `projectile_electric_arc_bolt` | candidates + selected finals |  | Electric/status projectile. |
| `[ ]` | Summoner shot projectile | `projectile_summoner_shot` | candidates + selected finals |  | Special enemy projectile. |
| `[ ]` | Impact bomber warning marker | `projectile_impact_bomber_warning_marker` | candidates + selected finals |  | Warning/telegraph marker. |
| `[ ]` | Beam contact spark projectile/VFX | `projectile_beam_contact_spark` | candidates + selected finals |  | Beam impact contact effect. |
| `[ ]` | Shield impact shard projectile/VFX | `projectile_shield_impact_shard` | candidates + selected finals |  | Defensive impact fragment. |

## VFX

Default first pass: 4 standalone candidates. Finals are object-specific. Default sizes: `256x256` for small effects, `512x512` for blasts/rings.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Muzzle flash VFX | `vfx_muzzle_flash` | candidates + selected finals |  | Weapon firing flash. |
| `[ ]` | Enemy hit spark VFX | `vfx_enemy_hit_spark` | candidates + selected finals |  | Common hit feedback. |
| `[ ]` | Shield block spark VFX | `vfx_shield_block_spark` | candidates + selected finals |  | Ramming Shield/block feedback. |
| `[ ]` | Explosion ring VFX | `vfx_explosion_ring` | candidates + selected finals |  | General explosion ring. |
| `[ ]` | Reactor blast VFX | `vfx_reactor_blast` | candidates + selected finals |  | Reactor Drone blast. |
| `[ ]` | Poison tick burst VFX | `vfx_poison_tick_burst` | candidates + selected finals |  | DOT/status feedback. |
| `[ ]` | Frost shatter VFX | `vfx_frost_shatter` | candidates + selected finals |  | Cold/status feedback. |
| `[ ]` | Electric status pulse VFX | `vfx_electric_status_pulse` | candidates + selected finals |  | Electric/status feedback. |
| `[ ]` | Scrap pickup glint VFX | `vfx_scrap_pickup_glint` | candidates + selected finals |  | Pickup feedback. |
| `[ ]` | Upgrade pickup burst VFX | `vfx_upgrade_pickup_burst` | candidates + selected finals |  | Upgrade feedback. |
| `[ ]` | Player death shard burst VFX | `vfx_player_death_shard_burst` | candidates + selected finals |  | Player destruction feedback. |
| `[ ]` | Black-hole warning ripple VFX | `vfx_black_hole_warning_ripple` | candidates + selected finals |  | Hazard warning feedback. |

## Asteroids, Debris, And World Hazards

Default first pass: 4 standalone candidates per named object. Asteroids default to `512x512`; debris defaults to `256x256`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Asteroid tier 01 | `asteroid_tier_01` | candidates + selected final |  | Small/basic hazard. |
| `[ ]` | Asteroid tier 02 | `asteroid_tier_02` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 03 | `asteroid_tier_03` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 04 | `asteroid_tier_04` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 05 | `asteroid_tier_05` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 06 | `asteroid_tier_06` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 07 | `asteroid_tier_07` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 08 | `asteroid_tier_08` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 09 | `asteroid_tier_09` | candidates + selected final |  |  |
| `[ ]` | Asteroid tier 10 | `asteroid_tier_10` | candidates + selected final |  | Large/high-value hazard. |
| `[ ]` | Fractured asteroid family | `asteroid_fractured_family` | 4 fracture finals |  | Can be handled as one small family session. |
| `[ ]` | Debris chunk family | `debris_chunk_family` | 4 debris finals |  | Can be handled as one small family session. |
| `[ ]` | Rare ore asteroid | `asteroid_rare_ore` | candidates + selected final |  | Resource variant. |
| `[ ]` | Rare crystal asteroid | `asteroid_rare_crystal` | candidates + selected final |  | Resource variant. |
| `[ ]` | Black-hole visual reference | `world_black_hole_reference` | candidates + selected final |  | Background/reference or hazard art. |

## Pickups And Resources

Default first pass: 4 standalone candidates. Gameplay pickup default size: `256x256`; UI icons can be `128x128` or `256x256`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Scrap tier 1 pickup | `pickup_scrap_tier_01` | candidates + selected final |  | Lowest scrap tier. |
| `[ ]` | Scrap tier 2 pickup | `pickup_scrap_tier_02` | candidates + selected final |  |  |
| `[ ]` | Scrap tier 3 pickup | `pickup_scrap_tier_03` | candidates + selected final |  |  |
| `[ ]` | Scrap tier 4 pickup | `pickup_scrap_tier_04` | candidates + selected final |  | Highest scrap tier. |
| `[ ]` | Credits pickup/resource icon | `pickup_credits` | candidates + selected final |  | Post-run spend resource. |
| `[ ]` | Upgrade crate pickup | `pickup_upgrade_crate` | candidates + selected final |  | Upgrade source. |
| `[ ]` | Banked upgrade pickup | `pickup_banked_upgrade` | candidates + selected final |  | Banked progression pickup. |
| `[ ]` | Special upgrade pickup | `pickup_special_upgrade` | candidates + selected final |  | Rare upgrade source. |
| `[ ]` | Fuel cell pickup | `pickup_fuel_cell` | candidates + selected final |  | Optional/future. |
| `[ ]` | Rare part pickup/resource icon | `pickup_rare_part` | candidates + selected final |  | Optional/future. |

## UI, Buttons, Cards, And Icons

Buttons and reusable frames should not contain baked text. Button frame finals default to 3 intent families with 4 states each: `primary`, `danger`, `neutral` x `idle`, `hover`, `pressed`, `disabled`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Primary button frame family | `button_primary_family` | primary idle/hover/pressed/disabled |  | No baked text. |
| `[ ]` | Danger button frame family | `button_danger_family` | danger idle/hover/pressed/disabled |  | Eject/warning actions. |
| `[ ]` | Neutral button frame family | `button_neutral_family` | neutral idle/hover/pressed/disabled |  | Secondary actions. |
| `[ ]` | Panel backing UI frame | `ui_panel_backing` | candidates + selected final |  | Reusable panel texture/frame. |
| `[ ]` | Tab active UI frame | `ui_tab_active` | candidates + selected final |  | No baked text. |
| `[ ]` | Tab inactive UI frame | `ui_tab_inactive` | candidates + selected final |  | No baked text. |
| `[ ]` | Common upgrade card frame | `ui_card_common` | candidates + selected final |  | Rarity frame. |
| `[ ]` | Rare upgrade card frame | `ui_card_rare` | candidates + selected final |  | Rarity frame. |
| `[ ]` | Epic upgrade card frame | `ui_card_epic` | candidates + selected final |  | Rarity frame. |
| `[ ]` | Legendary upgrade card frame | `ui_card_legendary` | candidates + selected final |  | Rarity frame. |
| `[ ]` | Danger warning badge icon | `ui_warning_badge_danger` | candidates + selected final |  | Warning icon/badge. |
| `[ ]` | Mission warning badge icon | `ui_warning_badge_mission` | candidates + selected final |  | Mission/objective badge. |
| `[ ]` | Hull stat icon | `ui_icon_hull` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Fuel stat icon | `ui_icon_fuel` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Scrap resource icon | `ui_icon_scrap` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Weapon icon | `ui_icon_weapon` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Settings icon | `ui_icon_settings` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Radar icon | `ui_icon_radar` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Minimap icon | `ui_icon_minimap` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Speed stat icon | `ui_icon_speed` | candidates + selected final |  | 32-64px readability. |
| `[ ]` | Shield stat icon | `ui_icon_shield` | candidates + selected final |  | 32-64px readability. |

## Backgrounds And Menu Art

Backgrounds do not need transparency unless the user asks for layered UI pieces. Default size: `1920x1080`.

| Status | Session prompt object | Asset ID | Required production outputs | Evidence / Folder | Notes |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | Starfield background plate | `background_starfield_plate` | candidates + selected final |  | Menu/gameplay background candidate. |
| `[ ]` | Nebula backdrop | `background_nebula_backdrop` | candidates + selected final |  | Menu mood/background. |
| `[ ]` | Sector map background | `background_sector_map` | candidates + selected final |  | Map/menu background. |
| `[ ]` | Hangar backdrop | `background_hangar_backdrop` | candidates + selected final |  | Ship/hangar screen. |
| `[ ]` | Results screen background | `background_results_screen` | candidates + selected final |  | Debrief/results screen. |
| `[ ]` | Black-hole background/reference art | `background_black_hole_reference` | candidates + selected final |  | Menu/reference background. |

## Session Log

Add one line per completed production session.

```text
- YYYY-MM-DD: <asset id> - <status> - <folder/path> - <notes>
```
