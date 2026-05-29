# Enemy Lab Modular Attacks And Workflow Plan

Last updated: 2026-05-29

Status: Phase 8 attack visual profiles and audit harness complete in Enemy Lab. Active `GameScene` combat remains unchanged and should adopt the shared data/runtime shapes later without requiring a redesign.

## Goal

Rework Enemy Lab into the place where enemy attacks are authored, mixed, stress-tested, and saved. Attacks become modular data and runtime slots that can be mounted on any enemy ship, the player test ship, and future large hosts such as motherships. Movement and AI roles remain separate from attacks.

The intended workflow is:

1. Pick an enemy or squad.
2. Assign one or more attacks from a registry.
3. Test the same attack on its original host, a different enemy hull, or the default player ship.
4. Save the result through desktop-first preset files, with browser fallback preserved.
5. Promote stable definitions into live gameplay later.

## Current Baseline

Sources reviewed:

- `README_FOR_CODEX.md`
- `Docs/STARVIVORS_COMPLETE_GAME_CHECKLIST.md`
- `Docs/ENEMY_LAB.md`
- `src/scenes/EnemyLabScene.ts`
- `src/data/enemyLabDefinitions.ts`
- `src/systems/enemyLabAi.ts`
- `src/systems/enemyLabPresets.ts`
- `src/systems/debug/debugPersistence.ts`
- `src/systems/desktopBridge.ts`
- `electron/main.ts`
- `Docs/references/Enemy_Prototype/Preview Files`

Notes:

- The session instructions refer to `Docs/README_FOR_CODEX.md`, but the repo currently has `README_FOR_CODEX.md` at the root.
- Enemy Lab is standalone at `/enemy-lab.html` and intentionally separate from `GameScene`.
- The current lab overlay has modes: `shape`, `effects`, `behavior`, `squad`, and `stress`.
- Enemy definitions currently combine visual recipe, stats, movement/behavior id, optional weapon, and effect recipe in `EnemyLabDefinition`.
- `enemyLabAi.ts` owns movement, support auras, telegraphs, firing, spawning, status shots, reflect arcs, and detonation logic in one behavior switch.
- Presets are currently localStorage-backed variants and squads with Markdown import/export. The desktop bridge already supports `debug-presets`, `saveTextFile`, `readTextFile`, and `openDataFolder`.
- Existing harnesses include `enemyLabVector`, `enemyLabMonochrome`, `enemyLabPrototype`, and `smoke`.

## Visual Readability Baseline

Research references used for the attack visual pass:

- FFXIV AoE marker taxonomy: https://ffxiv.consolegameswiki.com/wiki/AoE_marker
- Anticipation/action/recovery timing: https://www.rivalslib.com/workshop_guide/art/anticipation_action_recovery.html
- Xbox Accessibility Guideline 102 contrast/readability guidance: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102
- Accessible Game Design aesthetics guidance: https://accessiblegamedesign.com/guidelines/aesthetics.html

Starvivors-specific rules:

- Color never carries enemy-attack meaning alone; every attack profile lists at least two non-color cues.
- Every danger shape needs a readable silhouette or pattern: lane, reticle, ring segment, tether, arc, socket, chevron, or corridor.
- Every attack has anticipation, resolve, impact, and recovery coverage in the visual audit data.
- Reduced-FX keeps critical markers visible by simplifying motion/particles rather than removing the danger shape.
- High-contrast mode resolves attack marker colors to the existing white/yellow readable palette and relies on width, pattern, and shape.

## Non-Goals

- Do not change active `GameScene` encounter balance in the first implementation pass.
- Do not delete the Forge workflow outright. Move Forge import/export out of the primary Enemy Lab path and keep it as an Advanced or legacy reference panel until unused code can be removed safely.
- Do not rebuild all attacks before stabilizing the lab UI and preset model.
- Do not move broad behavior into `GameScene`; new runtime code should live in focused `src/data` and `src/systems` modules.

## Core Model

### Attack Is Not Movement

Movement stays on the host:

```ts
interface EnemyLabDefinition {
  id: string;
  displayName: string;
  behavior: {
    id: EnemyLabBehaviorId;
    params?: Record<string, number | string | boolean>;
  };
  attacks: AttackLoadoutSlot[];
}
```

Attacks are separate loadout slots:

```ts
type AttackHostKind = 'enemy' | 'player-test' | 'mothership';
type AttackTargetKind = 'player' | 'enemy' | 'ally' | 'point' | 'self';

interface AttackLoadoutSlot {
  attackId: EnemyAttackId;
  enabled: boolean;
  params?: Record<string, number | string | boolean>;
  cooldownOffsetMs?: number;
  weight?: number;
  label?: string;
}

interface EnemyAttackDefinition {
  id: EnemyAttackId;
  displayName: string;
  baseHostIds: string[];
  sourceRole: EnemyLabRole | 'player-test' | 'mothership';
  tags: Array<
    | 'line'
    | 'beam'
    | 'lob'
    | 'area'
    | 'status'
    | 'summon'
    | 'support'
    | 'defense'
    | 'alarm'
    | 'contact'
    | 'readability-critical'
  >;
  defaultParams: Record<string, number | string | boolean>;
  timing: {
    initialDelayMs: number;
    cooldownMs: number;
    windupMs: number;
    channelMs?: number;
    activeMs?: number;
    recoveryMs: number;
    interruptible?: boolean;
  };
  targeting: {
    targetKind: AttackTargetKind;
    rangePx: number;
    leadTarget?: boolean;
    requiresLineOfSight?: boolean;
    preferDamagedAlly?: boolean;
  };
  telegraph: AttackTelegraphRecipe;
  activeEffect: AttackEffectRecipe;
  execution: AttackExecutionRecipe;
  reducedEffects?: Partial<AttackTelegraphRecipe & AttackEffectRecipe>;
  lab: {
    batch: 'A' | 'B' | 'C' | 'core';
    status: 'planned' | 'prototype' | 'ready';
    notes: string;
  };
}
```

Runtime host state should be generic:

```ts
interface AttackHostRuntime {
  hostKind: AttackHostKind;
  hostId: string;
  definitionId: string;
  body: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  attacks: AttackSlotRuntime[];
}

interface AttackSlotRuntime {
  slot: AttackLoadoutSlot;
  nextReadyAt: number;
  phase: 'idle' | 'windup' | 'channel' | 'active' | 'recovery';
  phaseStartedAt: number;
  target?: AttackTargetSnapshot;
}
```

This makes a berserker with `berserkChase` movement able to carry `emp-nova`, and a mothership able to carry `healing-beam`, `summon-glyphs`, and `mortar-lob` without one-off behavior ids.

## Registry Files

Recommended first modules:

- `src/data/enemyAttackDefinitions.ts`: attack ids, definitions, default loadout assignments, validation helpers.
- `src/systems/enemyAttackRuntime.ts`: host runtime slots, cooldowns, target selection, phase progression, execution dispatch.
- `src/systems/enemyLabAttackEffects.ts`: lab-only telegraph/effect helpers shared by all attack previews.
- `src/systems/enemyLabAttackPresets.ts`: schema helpers for loadouts and attack-test presets if `enemyLabPresets.ts` gets too broad.

Keep `src/scenes/EnemyLabScene.ts` as the owner of Phaser scene lifecycle and UI wiring only.

## UI Blueprint

Replace the primary overlay with tabs. Keep existing hotkeys and current lab capabilities reachable.

### Basic

Purpose: fast enemy spawn and loadout editing.

Controls:

- Enemy selector.
- Variant selector.
- Spawn count stepper/input.
- Spawn one.
- Spawn N.
- Clear.
- AI, labels, telegraphs, pause, invulnerable toggles.
- Attack loadout list for the selected enemy.
- `+` attack slot.
- `-` attack slot.
- Attack selector per slot.
- Parameter editor for the selected slot.
- Reset to default loadout.

Behavior:

- Each enemy starts with exactly its default attack loadout.
- If an enemy has no explicit saved override, the loadout comes from `getDefaultEnemyAttackLoadout(definition.id)`.
- Spawned enemies receive a resolved attack loadout snapshot. Editing UI after spawn does not mutate already spawned enemies unless an explicit "Apply to active" action is added.

### Squads

Purpose: build mixed groups with per-unit attack overrides.

Controls:

- Built-in squad selector.
- Custom squad selector.
- Squad name, status, tags, notes.
- Entries table: enemy, count, variant, formation offset, delay, attack override.
- Add selected enemy.
- Duplicate entry.
- Remove entry.
- Rotate, tighten/widen, mirror, clear.
- Spawn squad.
- Save squad preset.
- Load squad preset.
- Open squad folder.

Behavior:

- Count-based entries are supported for quick authoring.
- Expanded per-unit entries are supported for precise formations.
- Attack override can be empty, meaning "use enemy default".
- Attack override can be shared by count or expanded per unit.

### Attack Tester

Purpose: use the default player ship as the attack host and test enemy attacks quickly.

Controls:

- Host: default player ship initially, future dropdown can expose active ships.
- Attack selector.
- Slot stack for testing multi-attack combinations.
- Parameter editor.
- Fire once.
- Auto-cycle.
- Spawn target dummy.
- Spawn enemy target.
- Spawn allied target for support attacks.
- Clear test objects.
- Save attack-test preset.

Behavior:

- The player test host uses player movement and collision radius, but attack execution comes from enemy attack definitions.
- Enemy-targeting attacks should target dummies or spawned enemies.
- Ally-targeting attacks should spawn friendly dummy hulls so healing/shield logic can be evaluated.
- This tab is the fastest feel test for windup, telegraph, resolve, impact, recovery, and cooldown.

### Stress/Readability

Purpose: preserve and organize current readability tools.

Controls:

- Readability mode: normal, color-safe, high-contrast.
- Reduced FX.
- Telegraphs.
- Labels.
- Hit circles.
- Deconfliction.
- Clutter tests: single, squad, swarm, projectile clutter, asteroid clutter, asteroid gallery, debris, full stress mix.
- Attack stress: selected attack repeated across many hosts, mixed attacks, reduced/high-contrast comparison.
- Export diagnostics.

Behavior:

- Critical telegraphs must remain visible in reduced FX.
- High contrast should favor shape, width, stroke, and animation timing over color alone.
- Attack stress should include a no-damage option for readability-only tests.

### Presets

Purpose: desktop-first save/load/open-folder workflow.

Controls:

- Save variant.
- Load variant.
- Save squad.
- Load squad.
- Save loadout.
- Load loadout.
- Save attack test.
- Load attack test.
- Open Enemy Lab preset folder.
- Import legacy Markdown.
- Export legacy Markdown.

Behavior:

- Electron uses `window.starvivorsDesktop` through the existing `debug-presets` category.
- Browser fallback keeps localStorage and download/file-picker workflows.
- Old Forge import/export controls move to Advanced, outside the primary Presets workflow.

## Preset Hierarchy

Use the existing desktop bridge category:

```text
debug-presets/
  enemy-lab/
    variants/
    squads/
    loadouts/
    attack-tests/
    forge-legacy/
```

Desktop examples:

```ts
desktop.saveTextFile(
  'debug-presets',
  `enemy-lab/loadouts/${slug}.md`,
  markdown
);

desktop.readTextFile('debug-presets');
desktop.openDataFolder('debug-presets', 'enemy-lab/loadouts');
```

Browser fallback:

- `localStorage` remains the quick working cache.
- Downloaded Markdown remains the portable export.
- File picker remains the import path.
- Browser UI should label folder buttons as desktop-only or hide them when the bridge is unavailable.

Recommended schemas:

```ts
interface EnemyLabAttackLoadoutPreset {
  type: 'starvivors-enemy-lab-attack-loadout';
  version: 1;
  id: string;
  displayName: string;
  hostDefinitionId: string;
  hostKind: AttackHostKind;
  slots: AttackLoadoutSlot[];
  tags: string[];
  notes: string;
  savedAt: string;
}

interface EnemyLabAttackTestPreset {
  type: 'starvivors-enemy-lab-attack-test';
  version: 1;
  id: string;
  displayName: string;
  hostShipId: string;
  slots: AttackLoadoutSlot[];
  targetSetup: 'dummy' | 'enemy' | 'ally' | 'mixed';
  readabilityMode: EnemyLabReadabilityMode;
  reducedEffects: boolean;
  notes: string;
  savedAt: string;
}
```

Variant and squad presets should move to version 2 when attack loadouts are added:

- Variant v2 adds `attackLoadoutOverride?: AttackLoadoutSlot[]`.
- Squad v2 entries add `attackLoadoutOverride?: AttackLoadoutSlot[]`.
- Import should still accept v1 variants/squads and resolve attacks from enemy defaults.

## Attack Catalogue

Every attack needs prototype-quality beats:

- Anticipation.
- Telegraph.
- Resolve.
- Impact.
- Recovery.
- Reduced-effects variant.

### Batch A

| Attack | Base host | Tags | Default params | Telegraph and execution |
| --- | --- | --- | --- | --- |
| `rail-line` | `needle-sniper` | line, readability-critical | `aimMs: 900`, `lockMs: 320`, `damage: 30`, `rangePx: 1550` | Draws a thin tracking line, locks the final point with a brighter stroke, then fires a high-damage beam at the locked point. |
| `mortar-lob` | bomber/artillery host | lob, area | `windupMs: 650`, `travelMs: 850`, `splashRadiusPx: 150`, `damage: 22` | Shows a predictive landing circle, launches an arcing projectile, then resolves with splash. |
| `emp-nova` | `electric-leech`, `berserker` | area, status | `windupMs: 520`, `radiusPx: 230`, `damage: 6`, `slowMs: 2400`, `drag: 0.2` | Expanding ring applies low damage plus thrust/turn slow and acceleration drag. |
| `summon-glyphs` | `combat-summoner`, `carrier`, `spawner-nest` | summon, support | `channelMs: 900`, `count: 3`, `spawnId: scout`, `glyphRadiusPx: 220` | Creates 2-4 visible glyphs during a channel, then spawns adds unless interrupted. |

### Batch B

| Attack | Base host | Tags | Default params | Telegraph and execution |
| --- | --- | --- | --- | --- |
| `sweep-laser` | `needle-sniper`, elite turret | beam, line, readability-critical | `windupMs: 500`, `sweepMs: 1300`, `arcDegrees: 80`, `damagePerSecond: 28` | Slow rotating danger lane, then a bright core beam sweeps through the lane. |
| `healing-beam` | `repair-skiff` | support | `rangePx: 280`, `healPerSecond: 13`, `retargetMs: 250` | Tether beam picks damaged allies first and makes the priority target obvious. |
| `shield-wall` | `shield-frigate`, `reflector` | defense, support | `activeMs: 1200`, `cooldownMs: 2800`, `arcDegrees: 95`, `reflect: false` | Directional arc blocks shots during a timed window. Reflect mode returns shots toward the source. |
| `plasma-puddle` | status shooter/bomber | area, status | `landingMs: 650`, `durationMs: 3600`, `radiusPx: 125`, `tickDamage: 4`, `slow: 0.25` | Landing mark resolves into a lingering hazard zone with ticking damage or slow. |

### Batch C

| Attack | Base host | Tags | Default params | Telegraph and execution |
| --- | --- | --- | --- | --- |
| `cluster-bomb` | bomber | lob, area | `travelMs: 800`, `splitCount: 5`, `secondaryRadiusPx: 70`, `delayMs: 420` | Main lob lands, then splits into smaller delayed secondary circles. |
| `alarm-ping` | `patrol-guard` | alarm, summon | `detectMs: 700`, `callDelayMs: 900`, `squadId: scout-pack` | Detection beam marks the player, then calls a squad if not interrupted. |
| `berserker-shockwave` | `berserker` | area, status | `hpThresholds: 0.5/0.25`, `radiusPx: 180`, `knockback: 240`, `slowMs: 700` | HP-gated roar pulse knocks back or briefly slows the player. |
| `mine-reveal` | `ambusher-mine` | contact, area, readability-critical | `revealRangePx: 220`, `chargeMs: 420`, `blastRadiusPx: 125`, `damage: 26` | Hidden host reveals with a charge line or delayed blast radius before impact. |

### Core Compatibility Attacks

These preserve existing lab behavior while the showcase attacks are built:

| Attack | Purpose |
| --- | --- |
| `contact-ram` | Baseline contact damage for chasers, tanks, orbiters, and flankers. |
| `simple-bolt` | Current ranged projectile behavior for gunners and summoners. |
| `charge-strike` | Wedge-style dash impact, separate from movement once runtime exists. |
| `self-destruct-radius` | Reactor/impact bomber proximity explosion. |
| `split-shards` | Splitter death or threshold spawn behavior. |
| `command-buff-pulse` | Command relay speed/fire-rate/damage buff aura. |
| `scrap-steal` | Scrap thief/jackal pickup theft behavior. |
| `phase-blink-strike` | Future optional phase-skiff attack if teleport becomes movement-only. |

## Default Enemy Attack Assignments

All active Enemy Lab definitions should have one explicit default loadout. Multi-slot defaults are allowed only where the current enemy already does multiple combat things.

| Enemy | Movement behavior retained | Default attack loadout | Notes |
| --- | --- | --- | --- |
| `scout` | `directChase` | `contact-ram` | Keeps basic chase pressure. |
| `wedge-striker` | `chargeDash` | `charge-strike` | Dash movement and damage become separable later. |
| `diamond-gunner` | `rangeOrbitShooter` | `simple-bolt` | Existing bolt projectile path. |
| `hex-tank` | `heavyChase` | `contact-ram` | Slow pressure body. |
| `reactor-drone` | `proximityDetonate` | `self-destruct-radius` | Existing warning radius and blast. |
| `splitter` | `splitterChase` | `split-shards` | Child spawn becomes a reusable attack/effect. |
| `shard-drone` | `directChase` | `contact-ram` | Spawned child baseline. |
| `needle-sniper` | sniper positioning | `rail-line` | First showcase attack. |
| `carrier` | carrier drift/positioning | `summon-glyphs` | Replaces behavior-locked spawning. |
| `shield-frigate` | support positioning | `shield-wall` | Directional or aura shield authored as an attack. |
| `repair-skiff` | support positioning | `healing-beam` | Ally priority and tether visuals are attack-owned. |
| `command-relay` | support positioning | `command-buff-pulse` | Existing buff aura as compatibility attack. |
| `scrap-jackal` | `scrapScavenger` | `scrap-steal` | Keeps scrap behavior independent from movement. |
| `flanker` | `flanker` | `contact-ram` | Flank path remains movement. |
| `reflector` | chase/face player | `shield-wall` with `reflect: true` | Reflect arc is attack-owned. |
| `phase-skiff` | `phaseTeleport` | `contact-ram` | Teleport remains movement until a phase attack is needed. |
| `ambusher-mine` | `ambushReveal` | `mine-reveal` | Reveal/strike or delayed blast becomes reusable. |
| `berserker` | `berserkChase` | `berserker-shockwave` | HP-gated attack independent from chase scaling. |
| `orbiter` | `orbiterCage` | `contact-ram` | Cage movement can later carry EMP or puddle attacks. |
| `patrol-guard` | `patrolAlert` | `alarm-ping` | Alert behavior and squad call become attack-owned. |
| `frost-gunner` | `statusShooter` positioning | `plasma-puddle` with slow params | Current slow identity becomes area/status authoring path. |
| `electric-leech` | `statusShooter` positioning | `emp-nova` | Electric drag/slow role becomes radial attack. |
| `combat-summoner` | ranged kiting | `simple-bolt`, `summon-glyphs` | Keeps combat plus channel identity. |
| `scrap-thief` | `scrapThief` | `scrap-steal` | Theft is attack/loadout behavior. |
| `impact-bomber` | fast chase | `self-destruct-radius` | Instant-contact bomber remains readable through hit circles. |
| `spawner-nest` | stationary/drift host | `summon-glyphs` | Stationary source can share summon attack with carrier/summoner. |

## Reference Notes

Reference files under `Docs/references/Enemy_Prototype/Preview Files` are standalone animated HTML previews. `FORGEPLAY_PREVIEW_SYSTEM.md` describes them as self-contained, dark-background, legend-backed animations. Enemy Lab harnesses should borrow that clarity: one focused interaction, clear legend, and visible state transitions.

Specific notes:

- `preview-enemy-sniper.html`: supports `rail-line`; the important behavior is a warning line that locks to a point before the shot resolves.
- `preview-action-throw.html`: supports `mortar-lob` and `cluster-bomb`; use arc motion plus a landing marker or shadow so players understand where the hit will happen.
- `preview-enemy-poisoner-freezer.html`: supports `emp-nova` and `plasma-puddle`; the key value is a status combo that is readable before it becomes lethal.
- `preview-enemy-summoner.html`: supports `summon-glyphs`; distinguish a combat summoner that fights and channels from a stationary spawner source.
- `preview-action-summon.html`: supports ownership/links for spawned units; glyphs and tethers should clarify what created the adds.
- `preview-enemy-healer.html` and `preview-enemy-shield-bearer.html`: support `healing-beam` and `shield-wall`; the player should understand target priority at a glance.
- `preview-enemy-reflector.html`: supports reflect mode for `shield-wall`; the arc should communicate "do not shoot this angle right now".
- `preview-enemy-berserker.html`: supports `berserker-shockwave`; HP thresholds need visible state changes before the pulse.
- `preview-enemy-ambusher.html`: supports `mine-reveal`; hidden/reveal/strike beats need fair warning in Starvivors scale.
- `preview-enemy-patrol.html`: supports `alarm-ping`; patrol path, detection beam, and called squad should be distinguishable.
- `preview-enemy-spawner.html`: supports `summon-glyphs` on a stationary host; the source should read as the priority target.

Suggested future screenshot references to capture during implementation:

- `artifacts/visual-smoke/enemy-lab-attacks-basic-1280x720.png`
- `artifacts/visual-smoke/enemy-lab-attacks-squads-1280x720.png`
- `artifacts/visual-smoke/enemy-lab-attacks-player-test-1280x720.png`
- `artifacts/visual-smoke/enemy-lab-attacks-stress-high-contrast-1280x720.png`

Existing current-state baselines:

- `artifacts/visual-smoke/enemy-lab-monochrome-1280x720.png`
- `artifacts/visual-smoke/enemy-lab-prototype-gallery-1280x720.png`

## Implementation Phases

### Phase 1: Design Doc And UI Blueprint

Status: this document.

Acceptance:

- Attack registry shape is defined.
- Tab layout is defined.
- Preset hierarchy is defined.
- Attack catalogue is defined.
- Default enemy attack assignments are defined.
- Reference notes from `Docs/references/Enemy_Prototype/Preview Files` are captured.

### Phase 2: UI First

Status: started 2026-05-28.

Progress:

- Added `src/data/enemyAttackDefinitions.ts` with typed attack definitions, default enemy attack loadouts, and validation helpers.
- Added registry validation coverage in `src/data/enemyAttackDefinitions.test.ts`.
- Replaced the primary overlay mode row with Basic, Squads, Attack Tester, Stress/Readability, and Presets tabs.
- Basic shows the selected enemy's resolved default attack loadout.
- Attack Tester can select the default player test host and any registered attack, while execution buttons remain disabled until the runtime phase.
- Existing spawn, squad, stress, readability, variant/preset, Forge, hotkey, and harness paths remain reachable.

Files to read:

- `src/scenes/EnemyLabScene.ts`
- `src/systems/enemyLabPresets.ts`
- `src/systems/enemyLabSpawner.ts`
- `src/data/enemyLabDefinitions.ts`
- `Docs/ENEMY_LAB.md`

Tasks:

- Replace primary lab mode buttons with tabs: Basic, Squads, Attack Tester, Stress/Readability, Presets.
- Keep existing spawn, clear, AI, invulnerable, labels, telegraphs, pause, deconfliction, hit circles, readability, stress tests, and squad tools reachable.
- Move Forge controls into an Advanced section.
- Add loadout controls with `+/-`, reset to defaults, and slot parameter display.
- It is acceptable for the first UI pass to show non-functional attack slot controls if defaults are clearly wired and no misleading active behavior is implied.

Acceptance:

- `/enemy-lab.html` opens with Basic tab as the primary workflow.
- Existing hotkeys still work.
- Current variant/squad tools are not lost.
- Attack loadout UI shows exactly the default slots for each selected enemy.
- Attack Tester can select the player test host and any attack definition, even before all attacks execute.

### Phase 3: Preset Persistence

Files to read:

- `src/systems/debug/debugPersistence.ts`
- `src/systems/desktopBridge.ts`
- `electron/main.ts`
- `electron/preload.ts`
- `src/systems/enemyLabPresets.ts`

Tasks:

- Add Markdown creators/parsers for attack loadouts and attack-test presets.
- Add desktop saves under `debug-presets/enemy-lab/...`.
- Add open-folder buttons for each preset category.
- Keep localStorage as working cache.
- Keep browser download/load fallback.
- Add v1-to-v2 migration for existing variant/squad presets.

Acceptance:

- Desktop save writes nested paths under `runtime-data/debug-presets/enemy-lab/...` in dev.
- Browser save still downloads Markdown.
- Existing v1 variants and squads still import.
- Attack loadout presets round-trip with slots and params intact.

### Phase 4: Modular Attack Runtime

Status: completed 2026-05-28.

Progress:

- Added `src/systems/enemyAttackRuntime.ts` with host/slot runtimes, queued/manual slots, cooldowns, windup/channel/active/recovery phases, target snapshots, runtime recipe normalization, and typed callbacks for projectiles, area damage, status, summons, heal/buff/shield/scrap, telegraphs, and lab effects.
- Initialized spawned Enemy Lab enemies with attack runtimes from their cloned `attackLoadoutSnapshot`.
- Wired Basic and Squad spawned enemies so persisted/default loadouts execute through the runtime while live `GameScene` remains untouched.
- Gated legacy lab attack firing/spawning/support/detonation paths when a modular runtime is present, so movement behavior stays in `enemyLabAi.ts` without double-firing default loadouts.
- Enabled Attack Tester `Fire Once`, `Auto-Cycle`, dummy/enemy/ally target spawning, and `Clear Tests` through a player-test runtime using the lab player body, velocity, facing, readability mode, and reduced-FX settings.
- Added `enemyLabAttacks` harness coverage for `rail-line`, `simple-bolt`, `emp-nova`, and `summon-glyphs`.

Verification:

- `npm.cmd run test` passed with 19 files and 78 tests.
- `npm.cmd run build` passed.
- `npm.cmd run electron:build` passed.
- Headless `/enemy-lab.html` Basic smoke showed the Basic tab active and enabled Attack Tester controls.
- Headless `/enemy-lab.html?testHarness=enemyLabAttacks` reported `data-starvivors-enemy-lab-attack-harness="ready"` with slots `rail-line`, `simple-bolt`, `emp-nova`, and `summon-glyphs`.
- Headless `/enemy-lab.html?testHarness=enemyLabPrototype` still reported `data-starvivors-enemy-lab-harness="monochrome-ready"`.

Files to read:

- `src/systems/enemyLabAi.ts`
- `src/systems/enemyLabEffects.ts`
- `src/systems/enemyLabSpawner.ts`
- `src/systems/playerStatusEffects.ts`
- `src/systems/enemyProjectiles.ts`
- `src/data/enemyLabDefinitions.ts`

Tasks:

- Add `enemyAttackDefinitions.ts` and validation tests.
- Add per-host attack slot runtime.
- Move projectile, beam, ring, radius, support, summon, and reflect execution into attack execution helpers.
- Keep movement behavior update separate from attack update.
- Preserve existing deconfliction, hit circles, status effects, and telegraph toggles.
- Add reduced/high-contrast handling per telegraph recipe.

Acceptance:

- Movement behavior can run with no attack.
- A host can run one or more attacks.
- A non-native attack can be assigned to any enemy host.
- The player test host can execute enemy attacks in Attack Tester.
- Existing lab enemies still behave the same when using default loadouts.

### Phase 5: Attack Batches

Status: Batch A, Batch B, and Batch C completed 2026-05-28.

Progress:

- Marked Batch A definitions `ready` with final lab defaults for `rail-line`, `mortar-lob`, `emp-nova`, and `summon-glyphs`.
- Added runtime beats for tracking, lock, anticipation, channel, resolve, and delayed impact.
- Added delayed impact execution for `mortar-lob`, with `travelMs` driving active travel and splash timing.
- Fixed current-slot parameter use for range, projectile lead, and radius aliases such as `splashRadiusPx` and `glyphRadiusPx`.
- Added repeated windup/channel telegraph refresh for Batch A without changing live `GameScene` combat.
- Polished Enemy Lab visuals for Batch A: rail tracking/lock/beam markers, mortar landing reticle/arc/splash, EMP warning/status burst, and summon glyph ownership links.
- Updated the deterministic `enemyLabAttacks` harness to run `rail-line`, `mortar-lob`, `emp-nova`, and `summon-glyphs`.
- Marked Batch B definitions `ready` with final lab defaults for `sweep-laser`, `healing-beam`, `shield-wall`, and `plasma-puddle`.
- Added sustained active ticks for Batch B: sweep line damage over `sweepMs`, healing ticks with damaged-ally retarget cadence, and lingering puddle tick damage/status.
- Added Batch B timing/recipe aliases so current-slot params drive `sweepMs`, `arcDegrees`, `healPerSecond`, `retargetMs`, `activeMs`, `durationMs`, `tickDamage`, `slow`, and `reflect`.
- Polished Enemy Lab visuals for Batch B: broad sweep lane/endpoints, healing tether plus target pulse, directional shield arcs with reflect styling, plasma landing reticle, lingering hazard ring, and status tick feedback.
- Expanded the deterministic `enemyLabAttacks` harness to keep Batch A slots and add all four Batch B slots with dummy, enemy, and damaged ally targets.
- Marked Batch C definitions `ready` with final lab defaults for `cluster-bomb`, `alarm-ping`, `berserker-shockwave`, and `mine-reveal`.
- Added delayed multi-impact support for `cluster-bomb`: primary lob travel, primary impact, split warning reticles, and delayed secondary impact circles.
- Added Batch C timing/recipe aliases so current-slot params drive `travelMs`, `splitCount`, `secondaryRadiusPx`, `delayMs`, `detectMs`, `callDelayMs`, `chargeMs`, `blastRadiusPx`, `knockback`, and `slowMs`.
- Kept `alarm-ping` as a channel-to-summon attack using the existing summon callback, resolving `squadId` as the requested squad/definition id.
- Kept `berserker-shockwave` and `mine-reveal` lab-authored only: shockwave previews HP-threshold/state cues without live HP gating, and mine reveal uses existing lab target selection without a hidden enemy AI rewrite.
- Polished Enemy Lab visuals for Batch C: cluster split spokes/secondary reticles, alarm detection marker and call pulse, berserker windup/state/impact burst, and mine reveal charge/blast feedback.
- Expanded the deterministic `enemyLabAttacks` harness to keep Batch A+B slots and add all four Batch C slots with point, enemy, self, and summon target coverage.

Verification:

- `npm.cmd run test` passed with 19 files and 96 tests.
- `npm.cmd run build` passed.
- `npm.cmd run electron:build` passed.
- Headless `/enemy-lab.html` smoke on local dev port 5175 showed `enemy-lab-overlay is-mode-basic`, active Basic tab, and Attack Tester target controls `attackTesterSpawnDummy`, `attackTesterSpawnEnemy`, and `attackTesterSpawnAlly`.
- Headless `/enemy-lab.html?testHarness=enemyLabAttacks` on local dev port 5175 reported `data-starvivors-enemy-lab-attack-harness="ready"` with slots `rail-line`, `mortar-lob`, `emp-nova`, `summon-glyphs`, `sweep-laser`, `healing-beam`, `shield-wall`, `plasma-puddle`, `cluster-bomb`, `alarm-ping`, `berserker-shockwave`, and `mine-reveal`; `batchBSlots` and `batchCSlots` reported all four attacks in each batch.
- Headless `/enemy-lab.html?testHarness=enemyLabPrototype` still reported `data-starvivors-enemy-lab-harness="monochrome-ready"`.

Batch A:

- `rail-line`
- `mortar-lob`
- `emp-nova`
- `summon-glyphs`

Batch B:

- `sweep-laser`
- `healing-beam`
- `shield-wall`
- `plasma-puddle`

Batch C:

- `cluster-bomb`
- `alarm-ping`
- `berserker-shockwave`
- `mine-reveal`

Acceptance per attack:

- Has anticipation, telegraph, resolve, impact, recovery.
- Has reduced-effects behavior.
- Has high-contrast readable telegraph.
- Works on base host, another enemy host, and player test host where target rules make sense.
- Has default params documented in the registry.
- Does not require a new movement behavior id.

### Phase 6: Verification And Polish

Status: completed 2026-05-28. Scope stayed Enemy Lab-only: no live `GameScene` combat wiring, no attack audio, and no new enabled manual stress UI.

Progress:

- Added focused unit coverage for exact non-empty default loadout resolution across all Enemy Lab enemies, attack loadout preset labels/enabled state/params/host metadata, Attack Tester preset stack/readability/reduced-FX round-trip, v1 variant/squad migration, non-native attack execution, player-test target coverage, and all ready Batch A/B/C reduced-FX/high-contrast recipes.
- Extended `/enemy-lab.html?testHarness=enemyLabAttacks` to report deterministic Phase 6 JSON details: `defaultLoadoutPass`, `mixedSquadPass`, `attackTesterTargetCoverage`, `reducedFxPass`, and `highContrastPass`.
- Kept `data-starvivors-enemy-lab-harness="monochrome-ready"` intact for `/enemy-lab.html?testHarness=enemyLabPrototype`.
- Added screenshot-only Phase 6 harness URLs with `data-starvivors-enemy-lab-phase6-harness="ready"` for Basic, Squads, Attack Tester, and reduced-FX/high-contrast stress views.

Verification:

- `npm.cmd run test` passed with 19 files and 99 tests.
- `npm.cmd run build` passed.
- `npm.cmd run electron:build` passed.
- Headless `/enemy-lab.html` smoke on local dev port 5176 showed `enemy-lab-overlay is-mode-basic` and Attack Tester target controls `attackTesterSpawnDummy`, `attackTesterSpawnEnemy`, and `attackTesterSpawnAlly`.
- Headless `/enemy-lab.html?testHarness=enemyLabAttacks` on local dev port 5176 reported `data-starvivors-enemy-lab-attack-harness="ready"` with all ready Batch A/B/C slots: `rail-line`, `mortar-lob`, `emp-nova`, `summon-glyphs`, `sweep-laser`, `healing-beam`, `shield-wall`, `plasma-puddle`, `cluster-bomb`, `alarm-ping`, `berserker-shockwave`, and `mine-reveal`.
- The same attack harness reported `defaultLoadoutPass=true`, `mixedSquadPass=true`, `reducedFxPass=true`, `highContrastPass=true`, `missingReadyBatchSlots=[]`, and `attackTesterTargetCoverage.pass=true` across point, enemy, ally, self, and summon paths.
- Headless `/enemy-lab.html?testHarness=enemyLabPrototype` on local dev port 5176 still reported `data-starvivors-enemy-lab-harness="monochrome-ready"`.
- Screenshot command shape: `node scripts/captureHarnessScreenshot.mjs <url> <path> data-starvivors-enemy-lab-phase6-harness ready 700 1280x720`.
- Captured `artifacts/visual-smoke/enemy-lab-attacks-basic-1280x720.png` from `/enemy-lab.html?testHarness=enemyLabPhase6Basic`.
- Captured `artifacts/visual-smoke/enemy-lab-attacks-squads-1280x720.png` from `/enemy-lab.html?testHarness=enemyLabPhase6Squads`.
- Captured `artifacts/visual-smoke/enemy-lab-attacks-player-test-1280x720.png` from `/enemy-lab.html?testHarness=enemyLabPhase6PlayerTest`.
- Captured `artifacts/visual-smoke/enemy-lab-attacks-stress-high-contrast-1280x720.png` from `/enemy-lab.html?testHarness=enemyLabPhase6StressHighContrast`.

Unit tests:

- Attack registry validation.
- Every enemy has exactly its default attack loadout.
- Loadout preset round-trip.
- Variant/squad v1 import migration.
- Attack assignment to non-native host.
- Reduced/high-contrast recipe normalization.

Harnesses:

- `/enemy-lab.html?testHarness=enemyLabAttacks`
- Basic tab loadout defaults.
- Squads mixed loadout.
- Attack Tester player-host attack execution.
- Attack stress readability.

Visual smoke:

- Default attacks.
- Mixed attacks on non-native hosts.
- Player Attack Tester.
- Reduced FX.
- High contrast.

Commands for implementation phases:

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run electron:build
```

Desktop smoke:

```powershell
npm.cmd run dev:desktop:enemy-lab
```

### Phase 7: Attack Audio And Player-Hosted Attack Mode

Status: completed 2026-05-28. Scope stayed Enemy Lab-only: no live `GameScene` combat wiring and no external audio assets.

Progress:

- Added `src/systems/audio/attackAudio.ts` as the source of truth for attack audio beats: `telegraph`, `channel`, `resolve`, `impact`, and `tick`.
- Refactored `AudioCueId` so it is inferred from `AUDIO_CUE_REGISTRY` keys, then generated procedural SFX cue definitions for every attack cue referenced by the attack audio map.
- Covered every attack in `ENEMY_ATTACK_DEFINITIONS` with at least one `resolve` cue, telegraph/channel cue coverage where the attack has a telegraph, and tick cue coverage for sustained sweep/heal/puddle attacks.
- Wired `AudioManager` into `EnemyLabScene` using saved Sound settings, unlock listeners, shutdown/destroy disposal, cue history, AudioManager cooldowns, and a small per-attack/beat throttle.
- Routed Enemy Lab runtime callbacks to lab-only audio beats: telegraphs, channel warnings, resolves, projectile/area/support impacts, and sustained ticks. Live `GameScene` combat remains unchanged.
- Added session-local player fire mode defaults: Basic/Squads/Stress/Presets default to `Player Fire: Pulse`, while Attack Tester defaults to `Player Fire: Selected Attack`.
- Added visible Player Fire toggle controls and status text; selected-attack fire queues the currently selected Attack Tester slot on the player-test runtime while preserving Fire Once and Auto-Cycle.
- Added `src/systems/enemyLabPlayerAttackMode.ts` with focused unit coverage for pulse-vs-selected attack routing and default mode behavior.
- Added `/enemy-lab.html?testHarness=enemyLabAttackAudio`, which runs all registry attacks through the player-test runtime, records attack cue IDs in `AudioManager.recentCueIds`, and reports coverage JSON.

Verification:

- `npm.cmd run test` passed with 20 files and 104 tests.
- `npm.cmd run build` passed.
- `npm.cmd run electron:build` passed.
- Headless `/enemy-lab.html` smoke on local dev port 5177 showed `enemy-lab-overlay is-mode-basic` and visible `Player Fire: Pulse`.
- Headless `/enemy-lab.html?testHarness=enemyLabAttackAudio` on local dev port 5177 reported `data-starvivors-enemy-lab-audio-harness="ready"`.
- The audio harness reported all 20 registry attack IDs covered, `missingAttackIds=[]`, `missingRequiredResolveCues=[]`, covered beats `channel`, `impact`, `resolve`, `telegraph`, and `tick`, and `playerFireMode.pass=true`.
- Headless `/enemy-lab.html?testHarness=enemyLabAttacks` still reported `data-starvivors-enemy-lab-attack-harness="ready"`.
- Headless `/enemy-lab.html?testHarness=enemyLabPrototype` still reported `data-starvivors-enemy-lab-harness="monochrome-ready"`.
- Optional screenshot captured at `artifacts/visual-smoke/enemy-lab-attack-audio-player-mode-1280x720.png`.

Future Hazard Audio Reminder:

- Enemy attack cues now exist in Enemy Lab, but asteroid/debris/black-hole hazard audio remains future work outside this phase.

### Phase 8: Attack Visual Profiles And Audit Harness

Status: completed 2026-05-29. Scope stayed Enemy Lab-only: no live `GameScene` combat wiring and no new encounter tuning.

Progress:

- Added `src/data/enemyAttackVisualProfiles.ts` as the attack visual audit source of truth, with shared grammar families: `line`, `landing`, `radial`, `support`, and `summon`.
- Covered every `ENEMY_ATTACK_DEFINITIONS` id with a visual profile containing tell shape, danger shape, explicit marker level, diegetic tell, marker pattern, anticipation/resolve/impact/recovery beats, reduced-FX fallback, high-contrast fallback, non-color cues, and screenshot scenario.
- Promoted the 8 core/planned compatibility attacks to Enemy Lab `ready` status after confirming they have real lab execution paths and reduced/high-contrast visual fallbacks: `contact-ram`, `simple-bolt`, `charge-strike`, `self-destruct-radius`, `split-shards`, `command-buff-pulse`, `scrap-steal`, and `phase-blink-strike`.
- Added `/enemy-lab.html?testHarness=enemyLabAttackVisuals` plus reduced/high-contrast variants: `enemyLabAttackVisualsReduced` and `enemyLabAttackVisualsHighContrast`.
- The visual harness renders a compact all-attack audit gallery, reports `data-starvivors-enemy-lab-visual-harness="ready"`, and publishes JSON details for rendered attack ids, profile validation, reduced-FX coverage, high-contrast coverage, visual beat coverage, and resolve-audio cue coverage.
- Expanded unit coverage for all-attack visual profiles, all-attack reduced/high-contrast runtime recipes, and player-host cursor targeting across every player-targeted attack.

Verification:

- `npm.cmd run test` passed with 21 files and 114 tests.
- `npm.cmd run build` passed.
- `npm.cmd run electron:build` passed.
- Headless `/enemy-lab.html?testHarness=enemyLabAttackVisuals` on local dev port 5178 reported `data-starvivors-enemy-lab-visual-harness="ready"`, `attackCount=20`, `missingRenderedAttackIds=[]`, `visualProfileErrors=[]`, `reducedFxPass=true`, `highContrastPass=true`, `beatsPass=true`, and `missingAudioCueAttackIds=[]`.
- Headless `/enemy-lab.html?testHarness=enemyLabAttacks` still reported `data-starvivors-enemy-lab-attack-harness="ready"`.
- Headless `/enemy-lab.html?testHarness=enemyLabAttackAudio` still reported `data-starvivors-enemy-lab-audio-harness="ready"` with all 20 attack ids covered.
- Headless `/enemy-lab.html?testHarness=enemyLabPrototype` still reported `data-starvivors-enemy-lab-harness="monochrome-ready"`.
- Captured `artifacts/visual-smoke/enemy-lab-attack-visuals-normal-1280x720.png` from `/enemy-lab.html?testHarness=enemyLabAttackVisuals`.
- Captured `artifacts/visual-smoke/enemy-lab-attack-visuals-reduced-1280x720.png` from `/enemy-lab.html?testHarness=enemyLabAttackVisualsReduced`.
- Captured `artifacts/visual-smoke/enemy-lab-attack-visuals-high-contrast-1280x720.png` from `/enemy-lab.html?testHarness=enemyLabAttackVisualsHighContrast`.

## Risks And Decisions

- `EnemyLabScene.ts` is already large. UI rework should be incremental and should move reusable data/preset/runtime logic out of the scene.
- Some existing behavior ids include attacks today, especially sniper, support, reflector, spawner, status shooter, and detonation. Runtime extraction should preserve behavior first, then remove duplicated logic.
- Attack Tester changes target semantics because the player ship can host enemy attacks. The runtime must use host kind and target kind instead of assuming enemy-to-player.
- Preset versioning matters. Do not break existing localStorage or Markdown import paths.
- Desktop nested paths are supported by `electron/main.ts` through sanitized relative paths, but file read by picker is category-wide unless a filename is supplied. The UI should open the category folder for browsing rather than pretending it has an in-app file tree before one exists.

## Done Criteria For The Full Rework

- Basic, Squads, Attack Tester, Stress/Readability, and Presets tabs are all usable.
- Every Enemy Lab enemy starts with exactly its default attack loadout.
- `+/-` attack controls work.
- Any attack can be assigned to any enemy.
- The default player ship can test each enemy attack.
- Squads can mix enemies and attack loadouts.
- Every registered attack has an auditable visual profile with reduced-FX and high-contrast fallback coverage.
- Desktop presets save/load from the Electron data folder.
- Browser fallback still works.
- Reduced FX and high contrast preserve telegraph readability.
- Tests and smoke harnesses cover the new workflow.
- Active `GameScene` combat remains unchanged until a later adoption task explicitly wires the shared attack runtime into live encounters.
