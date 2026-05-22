# GameScene Refactor Plan

Last updated: 2026-05-22

This plan is for reducing `src/scenes/GameScene.ts` without changing gameplay behavior. It should be followed before moving code into new modules.

## Purpose

`GameScene.ts` is currently the main orchestration scene and is about 14,500 lines. It owns scene lifecycle, run reset, UI flow, debug adapters, test harnesses, sector generation wiring, mission/event runtime, weapon runtime, collision side effects, rewards, HUD snapshots, and many Phaser object factories.

The goal is not a rewrite. The goal is to keep `GameScene.ts` as the conductor while moving self-contained responsibilities into focused modules that are easier to test, preserve, and extend.

Use this as the overall refactor workflow: `GameScene.ts` conducts the game, focused modules do the work.

## Non-Negotiables

- Preserve current gameplay behavior unless the task explicitly authorizes a behavior change.
- Keep the game buildable after every focused extraction.
- Preserve query-string smoke harnesses and debug menu behavior.
- Preserve desktop bridge behavior and auto diagnostics.
- Do not delete legacy compatibility paths until replacements are verified.
- Do not mix gameplay tuning, balance changes, asset changes, or new content into refactor slices.
- Prefer extracting pure data transforms and adapters before extracting Phaser object ownership.
- Keep Phaser object creation inside the scene until a module boundary has a clear lifecycle contract.

## Target Shape

`GameScene.ts` should remain responsible for:

- Phaser scene lifecycle: `preload`, `create`, `update`, resize handling.
- High-level run orchestration.
- Owning scene-created Phaser objects when lifetime is scene-wide.
- Wiring systems together.
- Calling focused modules and applying their returned effects.

Focused modules should own:

- State normalization and reset helpers.
- Test harness installation and scenario logic.
- Mission, event, scanner, and sector runtime coordination.
- Upgrade overlay UI construction and selection behavior.
- Weapon runtime behavior that can be separated from scene-wide side effects.
- Collision/contact resolution helpers with explicit callbacks for scene effects.
- HUD/minimap/results/debug snapshot builders.

## Extraction Principles

1. Extract around stable seams, not around arbitrary line ranges.
2. Start with modules that mostly read state or return plain objects.
3. When a module needs scene side effects, pass explicit callbacks instead of importing `GameScene`.
4. Keep extracted functions narrow and named after gameplay responsibilities.
5. Add small adapter interfaces when a module needs only part of `GameScene`.
6. Keep all exported types close to the module that owns the concept.
7. Run `npm.cmd run build` after each extraction slice.
8. When practical, run the relevant query-string harness for the touched area.

## Proposed Module Map

New or expanded modules:

- `src/scenes/gameSceneRunState.ts`: run reset defaults, run result capture helpers, run lifecycle state helpers.
- `src/scenes/gameSceneHarness.ts`: query-string harness installation and scenario functions.
- `src/scenes/gameScenePreRunFlow.ts`: main menu, ship select, loadout, mission cycling, and shop navigation adapters.
- `src/systems/missionRuntime.ts`: mission runtime creation, completion/failure transitions, objective targeting.
- `src/systems/worldEventRuntime.ts`: world-event instance creation/update/reward hooks.
- `src/systems/rareEventRuntime.ts`: rare-event instance creation/update/reward hooks. Existing file can be expanded.
- `src/systems/sectorRuntime.ts`: sector spawn bookkeeping, active sector object maps, signal/scrap/asteroid population helpers.
- `src/ui/upgradeOverlay.ts`: upgrade overlay construction, layout, text refresh, hit zones, and reroll prompt behavior.
- `src/systems/playerWeaponRuntime.ts`: active weapon update orchestration, hotbar assignment, beam state helpers, projectile/beam dispatch.
- `src/systems/playerContactRuntime.ts`: player contact detection and impact resolution helpers.
- `src/systems/gameplaySnapshots.ts`: HUD, minimap, debug, collision overlay, and diagnostics snapshot builders.

These names are starting points. If an existing module already owns the concept cleanly, extend that module instead of creating a near-duplicate.

## Phase 0: Baseline Verification

Scope:

- Do not move code.
- Record current build and smoke status.
- Confirm which phase harnesses are expected to pass.

Tasks:

- Run `npm.cmd run build`.
- Run main smoke harness: `?testHarness=smoke`.
- Run currently relevant phase harnesses, especially Phase 14, Phase 15A, Phase 15B, and Phase 15.5.
- Record results in the commit or phase notes.

Acceptance:

- Known baseline is documented before extraction starts.
- Any failing harness is marked as pre-existing.

## Phase 1: Test Harness Extraction

Why first:

- Harness code is large and mostly isolated.
- This reduces `GameScene.ts` size without changing runtime gameplay.
- It makes future refactors easier to verify.

Candidate extraction:

- `installTestHarness`
- `getTestHarnessState`
- `runTestHarnessSmoke`
- `runTestHarnessPhase*`
- Other query-string scenario methods

Target:

- `src/scenes/gameSceneHarness.ts`

Boundary:

- The module should receive a narrow adapter object exposing only the methods and state needed by harnesses.
- `GameScene.ts` should install the harness by passing adapter callbacks.

Acceptance:

- Existing query-string harness attributes are unchanged.
- `npm.cmd run build` passes.
- Main smoke and at least one phase harness still pass.

## Phase 2: Snapshot Builder Extraction

Why next:

- Snapshot builders are mostly read-only and should be low-risk.
- This reduces coupling between HUD/minimap/debug UI and scene internals.

Candidate extraction:

- `getAutoRunDiagnosticsState`
- `getPerformanceProfilerCounts`
- `getPerformanceProfilerFlags`
- `getCollisionDebugOverlaySnapshot`
- `getMinimapSnapshot`
- `getGameplayHudSnapshot`
- weapon hotbar tooltip/snapshot helpers where practical

Target:

- `src/systems/gameplaySnapshots.ts`

Boundary:

- Pass a plain snapshot input object from `GameScene`.
- Keep Phaser object references out unless absolutely necessary.

Acceptance:

- HUD, minimap, collision overlay, and diagnostics still render/update.
- `npm.cmd run build` passes.
- Main smoke harness still passes.

## Phase 3: Run Lifecycle And Reset Extraction

Why now:

- `rebuildWorld` resets many unrelated state groups.
- A structured reset module will make later extractions safer.

Candidate extraction:

- Run-state default builders.
- Reset helpers for projectiles, enemies, sector maps, result fields, upgrade state, timers, pulse state, beam state, pause state, and black-hole debug defaults.
- Result capture helpers that do not require Phaser object creation.

Target:

- `src/scenes/gameSceneRunState.ts`

Boundary:

- Do not move Phaser object destruction until ownership is clear.
- Start by extracting pure reset value builders and grouped helper functions.

Acceptance:

- Starting, restarting, continuing, dying, ejecting, and returning to menu preserve behavior.
- `npm.cmd run build` passes.
- Run lifecycle harnesses still pass.

## Phase 4: Pre-Run Flow Adapter Extraction

Why:

- Ship select, mission cycling, loadout, shop routing, unlock checks, and progression save calls are a coherent responsibility.

Candidate extraction:

- `showMainMenu`
- `cycleSelectedMission`
- `showSettings`
- `getPreRunNavConfig`
- `showShipSelect`
- `handleShipAction`
- `canStartConfiguredRun`
- loadout assign/clear helpers
- ship unlock helpers
- shop back routing where it belongs to pre-run flow

Target:

- `src/scenes/gameScenePreRunFlow.ts`

Boundary:

- Keep actual UI screen modules in `src/ui`.
- The new adapter should prepare configs and callbacks for existing UI modules.

Acceptance:

- Main menu, settings, ship select, loadout assignment, shop entry/back, and run start still work.
- `npm.cmd run build` passes.
- Ship/loadout harnesses still pass.

## Phase 5: Mission, World Event, Rare Event, Scanner Extraction

Why:

- These systems define the 2.0 loop and are currently scattered across scene state, object creation, updates, rewards, and HUD refreshes.

Candidate extraction:

- `createMissionRuntime`
- mission objective generation/completion/failure transitions
- world-event creation/update/reward resolution
- rare-event creation/update/reward resolution
- sector scanner target selection and arrow state

Targets:

- Expand `src/systems/missionGeneration.ts` or add `src/systems/missionRuntime.ts`.
- Expand `src/systems/rareEventRuntime.ts`.
- Add or expand `src/systems/worldEventRuntime.ts`.
- Keep scanner runtime in `src/systems/sectorScanner.ts` unless the scene adapter becomes large.

Boundary:

- Keep Phaser visual object creation in `GameScene` or scene-specific visual helpers until lifecycle is explicit.
- Extract status transitions and reward decisions before visual effects.

Acceptance:

- Free Range and mission starts still work.
- Mission completion does not force results unless intended.
- Rare event and world event reward hooks still persist.
- Phase 11, 12, 13, 14, and 15.5 harnesses still pass.
- `npm.cmd run build` passes.

## Phase 6: Upgrade Overlay Extraction

Why:

- The upgrade overlay is a self-contained UI surface with layout, text, hit zones, and selection behavior.

Candidate extraction:

- `createUpgradeButton`
- `updateUpgradeButton`
- `createResultsButton` only if it fits the same UI adapter, otherwise defer
- `createUpgradeOverlay`
- `refreshUpgradeOverlayText`
- `drawUpgradeOverlayCards`
- `getUpgradeOverlayLayout`
- upgrade overlay tooltip/summary helpers

Target:

- `src/ui/upgradeOverlay.ts`

Boundary:

- The UI module owns Phaser display objects for the overlay through a controller object.
- `GameScene.ts` supplies callbacks for selecting, rerolling, closing, and reading current upgrade state.

Acceptance:

- Banked upgrade button and overlay still work with mouse and keyboard.
- Reroll cost and upgrade choices remain unchanged.
- Upgrade overlay harness still passes.
- `npm.cmd run build` passes.

## Phase 7: Player Weapon Runtime Extraction

Why:

- Weapon update code is large and mechanically cohesive, but it touches many scene side effects.
- This should happen after snapshots and upgrade overlay are cleaner.

Candidate extraction:

- Hotbar assignment validation.
- Active weapon update orchestration.
- Beam slot cooling/heating state.
- Beam hit scanning where callbacks can handle damage/rewards/FX.
- Projectile weapon dispatch where existing `projectileWeapons` helpers do not already own it.

Targets:

- Expand `src/systems/playerWeapons.ts`.
- Add `src/systems/playerWeaponRuntime.ts` if orchestration becomes distinct from data helpers.

Boundary:

- Damage application, reward drops, and Phaser VFX can remain callbacks into `GameScene` at first.
- Do not mix beam balance or weapon tuning changes into this phase.

Acceptance:

- Pulse Cannon, Ramming Shield, Salvage Beam, secondary weapons, and hotbar behavior remain unchanged.
- Weapon harnesses still pass.
- `npm.cmd run build` passes.

## Phase 8: Player Contact And Damage Side Effects Extraction

Why:

- Contact, ramming, physical impacts, and damage side effects are high-risk. Do this only after lower-risk extractions have reduced noise.

Candidate extraction:

- Contact detection helpers for enemy, asteroid, debris, and ramming shield colliders.
- Impact damage calculation wrappers.
- Cooldown map helpers.
- Ramming shield impact state transitions where practical.

Targets:

- Expand `src/systems/worldImpacts.ts`.
- Expand `src/systems/rammingShield.ts`.
- Add `src/systems/playerContactRuntime.ts` for player-specific orchestration.

Boundary:

- Keep actual object destruction/reward side effects in `GameScene` until all callback contracts are explicit.
- Preserve collision timing and damage cooldown semantics exactly.

Acceptance:

- Player contact damage, ramming shield, asteroid/debris impacts, black-hole damage, and death flow remain unchanged.
- Contact/balance/world-impact harnesses still pass.
- `npm.cmd run build` passes.

## Phase 9: Sector Object Runtime Extraction

Why:

- Sector asteroid/scrap/signal bookkeeping is a coherent system but touches existing asteroid/pickup arrays.

Candidate extraction:

- Sector spawn generation and active maps.
- Spawn activation/deactivation bookkeeping.
- Sector signal beacon state.
- Scrap rollup and asteroid coalescing decision helpers where practical.

Target:

- `src/systems/sectorRuntime.ts`

Boundary:

- Keep actual Phaser object creation and destruction in scene adapters at first.
- Preserve active object IDs and weak-map behavior.

Acceptance:

- Larger sector, sector generation, scrap rollup, and asteroid/debris performance harnesses still pass.
- `npm.cmd run build` passes.

## Phase 10: Cleanup And Guardrail Pass

Scope:

- Remove obsolete wrappers only after their replacements are verified.
- Reconcile imports and docs.
- Add comments only where module boundaries need explanation.

Tasks:

- Check `GameScene.ts` for newly extractable leftovers.
- Confirm no new large feature logic was added during refactor.
- Update this plan with completed phases and any deferred risks.

Acceptance:

- `GameScene.ts` is materially smaller.
- Main scene reads as lifecycle and orchestration.
- `npm.cmd run build` passes.
- Relevant smoke harnesses pass.
- Docs reflect the final module ownership.

## Suggested Work Order For The Next Coding Task

Start with Phase 0 and Phase 1 only.

Recommended first implementation prompt:

```text
Extract GameScene query-string test harness logic into a focused module.

Read:
- Docs/GAMESCENE_REFACTOR_PLAN.md
- Docs/README_FOR_CODEX.md
- src/scenes/GameScene.ts

Requirements:
- Do not change gameplay behavior.
- Preserve all existing data-starvivors-* harness attributes.
- Keep GameScene responsible for calling the installer.
- Use a narrow adapter object instead of importing GameScene into the harness module.
- Run npm.cmd run build.

Acceptance:
- Build passes.
- ?testHarness=smoke still reports pass.
- No unrelated files changed.
```

## Tracking

Use this section to record extraction progress.

- Phase 0: complete. Baseline build and smoke harnesses passed before code extraction.
- Phase 1: in progress. Harness installation and query-string dispatch moved to `src/scenes/gameSceneHarness.ts`; deep scenario bodies remain in `GameScene.ts` for later adapter-based extraction.
- Phase 2: complete. Read-only snapshot shaping for diagnostics, profiler counts/flags, collision overlay, minimap, and gameplay HUD moved to `src/systems/gameplaySnapshots.ts`.
- Phase 3: complete. Pure per-run reset defaults for rewards, progression, counters, pulse runtime, encounter timing, pause/overlay state, beam slots, and black-hole debug state moved to `src/scenes/gameSceneRunState.ts`.
- Phase 4: complete. Pre-run decision/config helpers for navigation, ship availability, play disabled reasons, unlock checks, hangar weapon availability, and lock labels moved to `src/scenes/gameScenePreRunFlow.ts`.
- Phase 5: complete. Mission runtime creation and sector scanner target shaping moved to systems; scene-owned visuals, rewards, and completion side effects remain in `GameScene`.
- Phase 6: complete. Upgrade overlay button, layout, card drawing, hit zones, text refresh, rarity colors, and weapon summary formatting moved to `src/ui/upgradeOverlay.ts`; `GameScene` remains the conductor for open/close timing, rerolls, choice generation, and applying selections.
- Phase 7: complete. Hotbar assignment rules moved to `src/systems/playerWeapons.ts`; active weapon firing cadence and beam heat/tick runtime moved to `src/systems/playerWeaponRuntime.ts`; `GameScene` remains the conductor for input, projectile spawning, ramming shield effects, beam visuals, damage, and rewards.
- Phase 8: complete. Player/enemy, asteroid, and debris contact detection plus player/world impact cooldown bookkeeping moved to `src/systems/playerContactRuntime.ts`; `GameScene` remains the conductor for knockback, damage, VFX, destruction, rewards, black-hole death checks, and ramming shield side effects.
- Phase 9: complete. Sector asteroid, scrap, and signal spawn data creation plus sector asteroid/scrap completion bookkeeping moved to `src/systems/sectorRuntime.ts`; `GameScene` remains the conductor for streaming decisions, Phaser object creation/destruction, active maps, beacon visuals, scrap rollup, and asteroid coalescing.
- Phase 10: pending
