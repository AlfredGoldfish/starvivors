# Starvivors 2.0 Phase 1 Baseline Audit

Date: 2026-05-19

## Scope

Phase 1 stabilizes the current playable baseline before deeper Starvivors 2.0 conversion work. This note records what was audited and what should be preserved or watched during later phases.

No gameplay redesign was done in this phase.

## Design Baseline

- Preserve the current best-feeling pieces: Asteroids-style thrust and drift, readable fast combat, black-hole/debris danger, survivor-style upgrades, the debug menu, smoke harnesses, and the shared enemy roster/behavior runtime.
- Treat the current main game as the baseline playable mode during conversion. It should continue to boot, start a run, spawn enemies, support upgrades, and expose diagnostics while 2.0 systems are introduced behind compatible bridges.
- Keep compatibility code until its replacement is verified. Removing old enemy paths too early would make projectile, collision, HUD, minimap, and test-harness work riskier.
- The minimum baseline experience that should not break is: main menu opens, a run can start, the player can move/fire, enemies spawn/update, pickups/upgrades remain reachable, and pause/debug tools still work.

## Entry Flow Audit

- `index.html` mounts `src/main.ts`, which creates a Phaser game from `src/config/gameConfig.ts`.
- `gameConfig` runs `BootScene` then `GameScene`.
- `BootScene.create()` immediately starts `GameScene`.
- `GameScene.create()` initializes shared systems, creates generated enemy visual textures for live-game use, shows the main menu, installs query-string smoke harnesses, installs auto-run diagnostics, and registers resize handling.
- `GameScene.startRun()` destroys menu/shop/results UI, calls `rebuildWorld()`, and starts auto-run diagnostics.
- `GameScene.rebuildWorld()` resets run state, creates the starfield/player, spawns initial live enemies, creates asteroids, creates a black hole, and recreates HUD/minimap/debug systems.
- `GameScene.update()` exits early for menu/shop/ship-select states. During a run it updates player movement, enemy spawning, live enemies, asteroids, black hole, debris, impacts, pickups, weapons, projectiles, HUD, minimap, debug UI, and performance profiling.

## Removed Enemy Sandbox

- The standalone enemy sandbox was later removed as a runnable/debug surface.
- The main game now owns verification for enemy visuals, behavior, and readability.
- The live game uses shared enemy definitions, visual texture generation, spawner helpers, and AI update code directly.

## Compatibility Bridges and Old Enemy Arrays

- Live-game enemies now spawn through `spawnEnemy()` / `spawnEnemySquad()` into `liveEnemies`.
- `legacySpawnType` maps live lab definitions back to `'chaser'`, `'shooter'`, or `'tank'` for rewards, damage feedback, debris, debug displays, and older assumptions.
- Old arrays still exist in `GameScene`: `basicEnemies`, `shooterEnemies`, and `tankEnemies`.
- Old creation/update methods still exist: `createBasicEnemies()`, `createShooterEnemies()`, `createTankEnemies()`, `updateBasicEnemies()`, `updateShooterEnemies()`, and `updateTankEnemies()`.
- Those old arrays are still referenced by the test harness, collision/debug overlay, minimap, projectile hit handling, ramming shield logic, player contact logic, black-hole/world-impact logic, debug text, and legacy reward/destruction paths.
- Current initial run spawning uses `createInitialLiveEnemies()` rather than the old initial enemy array creators.

## Known Risks

- Some specialized harness checks may still assume old enemy arrays, so they should be checked before relying on them during later enemy/runtime work.
- The live-game enemy runtime still has legacy enemy compatibility paths. This is useful during conversion but increases the chance of missing one path when changing combat, collisions, minimap, or HUD behavior.
- Enemy behavior and readability validation now need direct main-game harness or manual coverage.
- `GameScene.ts` remains the main orchestration point and is very large. Phase work should stay narrow and avoid broad refactors until the replacement systems are proven.
- The production build still emits a large chunk-size warning for `starfield`; this is not a Phase 1 blocker but should stay visible as 2.0 adds larger-sector content.

## Verification

- `npm.cmd run build`: passes. The existing large `starfield` chunk warning remains.
- Main game browser smoke check: passes with `?testHarness=smoke`.
- Main-game enemy validation remains the required follow-up after removing the standalone sandbox.
