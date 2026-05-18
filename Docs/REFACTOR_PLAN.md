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
- Phase 4, entity runtime systems: in progress. Projectile runtime, basic asteroid runtime updates, and asteroid collision resolution have been extracted; hit resolution remains in `GameScene`.
- Phase 5, screens and flow: pending.
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
