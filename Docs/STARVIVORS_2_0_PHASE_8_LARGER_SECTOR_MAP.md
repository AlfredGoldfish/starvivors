# Starvivors 2.0 Phase 8 Larger Sector Map

Phase 8 increases sector scale without adding procedural generation.

## Implementation Notes

- Sector sizing is centralized in `src/core/arena.ts`.
- The default run sector is now `2x` the previous viewport-derived arena.
- Supported test scales are `1x`, `2x`, `3x`, and `5x`.
- Use `?sectorScale=1`, `?sectorScale=2`, `?sectorScale=3`, or `?sectorScale=5` to test a specific scale.
- The run camera uses a subtle damped camera lead so movement reads without making the ship feel like it is orbiting a pivot.
- The minimap now shows the camera viewport so larger sectors remain navigable.
- The old Phase 8 browser query harness has been retired. Verify this area with focused unit tests or manual play, then run `?testHarness=smoke` for baseline browser smoke.

## Deferred

- Procedural regions, landmarks, roaming squads, and world population are left for Phases 9 and 10.
