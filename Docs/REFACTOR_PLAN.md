# STARVIVORS Refactor Tracker

This document tracks the major organization refactor that started after checkpoint commit `743a112`.

## Goals

- Keep the game playable and buildable after every refactor phase.
- Preserve current gameplay behavior unless a blocker bug requires a documented fix.
- Reduce `GameScene.ts` from a monolithic implementation into orchestration plus focused systems.
- Split debug tooling after gameplay systems have clearer boundaries.

## Phase Status

- Phase 0, guardrails and documentation: complete.
- Phase 1, shared types and constants: complete.
- Phase 2, combat feedback extraction: complete.
- Phase 3, presentation systems: complete.
- Phase 4, entity runtime systems: complete. Runtime loops, spawning helpers, projectile hit scanning, and world impact response/loops have been extracted; scene-owned damage/reward/FX side effects remain in `GameScene` intentionally.
- Phase 5, screens and flow: next.
- Phase 6, debug tooling split: pending.
- Phase 7, final cleanup: pending.

## Verification Log

- Checkpoint baseline: `npm.cmd run build` passed before commit `743a112`.
- Phase 1/2/3 extraction: `npm.cmd run build` passed after type/constants, combat feedback, starfield, minimap, gameplay HUD, and collision debug overlay extraction.
- Phase 4 projectile weapon firing extraction: `npm.cmd run build` passed.
- Phase 4 player projectile runtime extraction: `npm.cmd run build` passed.
- Phase 4 enemy projectile runtime extraction: `npm.cmd run build` passed.
- Phase 4 basic asteroid runtime extraction: `npm.cmd run build` passed.
- Phase 4 asteroid collision resolution extraction: `npm.cmd run build` passed.
- Phase 4 asteroid breakup helper extraction: `npm.cmd run build` passed.
- Phase 4 basic enemy runtime extraction: `npm.cmd run build` passed.
- Phase 4 shooter enemy runtime extraction: `npm.cmd run build` passed.
- Phase 4 tank enemy runtime extraction: `npm.cmd run build` passed.
- Phase 4 enemy wreckage debris runtime extraction: `npm.cmd run build` passed.
- Phase 4 scrap pickup runtime extraction: `npm.cmd run build` passed.
- Phase 4 scrap pickup spawning extraction: `npm.cmd run build` passed.
- Phase 4 shared world impact response extraction: `npm.cmd run build` passed.
- Phase 4 world impact loop extraction: `npm.cmd run build` passed.
- Phase 4 projectile hit scanning extraction: `npm.cmd run build` passed.
- Phase 4 completion check: `npm.cmd run build` passed after tracker reconciliation.
- Phase 5 main menu screen extraction: `npm.cmd run build` passed.
- Phase 5 ship select screen extraction: `npm.cmd run build` passed.
- Phase 5 shop screen extraction: `npm.cmd run build` passed.
- Phase 5 results screen extraction: `npm.cmd run build` passed.
- Phase 5 screen helper cleanup: `npm.cmd run build` passed after removing obsolete `GameScene` hangar render helpers.
- Phase 6 debug persistence helper extraction: `npm.cmd run build` passed.
