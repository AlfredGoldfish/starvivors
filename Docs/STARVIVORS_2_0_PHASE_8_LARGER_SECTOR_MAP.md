# Starvivors 2.0 Phase 8 Larger Sector Map

Phase 8 increases sector scale without adding procedural generation.

## Implementation Notes

- Sector sizing is centralized in `src/core/arena.ts`.
- The default run sector is now `2x` the previous viewport-derived arena.
- Supported test scales are `1x`, `2x`, `3x`, and `5x`.
- Use `?sectorScale=1`, `?sectorScale=2`, `?sectorScale=3`, or `?sectorScale=5` to test a specific scale.
- The run camera now applies velocity look-ahead while preserving toroidal wrap recentering.
- The minimap now shows the camera viewport and extraction beacon so larger sectors remain navigable.
- Phase 8 verification is available with `?testHarness=phase8&sectorScale=5`.

## Deferred

- Procedural regions, landmarks, roaming squads, and world population are left for Phases 9 and 10.
