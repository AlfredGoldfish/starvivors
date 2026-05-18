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
- Phase 3, presentation systems: in progress. Starfield, minimap, and gameplay HUD are extracted; collision debug remains.
- Phase 4, entity runtime systems: pending.
- Phase 5, screens and flow: pending.
- Phase 6, debug tooling split: pending.
- Phase 7, final cleanup: pending.

## Verification Log

- Checkpoint baseline: `npm.cmd run build` passed before commit `743a112`.
- Phase 1/2/3 partial extraction: `npm.cmd run build` passed after type/constants, combat feedback, starfield, minimap, and gameplay HUD extraction.
