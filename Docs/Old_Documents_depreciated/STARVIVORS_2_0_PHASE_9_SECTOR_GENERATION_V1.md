# Starvivors 2.0 Phase 9 Sector Generation V1

Phase 9 adds the first readable sector layout on top of the larger Phase 8 map.

## Implementation Notes

- Sector generation is centralized in `src/systems/sectorGeneration.ts`.
- Each run receives a sector seed. Use `?sectorSeed=example` to reproduce a layout.
- The first layout creates a quiet start region plus salvage fields, asteroid belts, enemy territory, and an anomaly signal.
- Region placement drives initial asteroid clusters and scrap pockets.
- High-signal regions get visible in-world beacon placeholders.
- The minimap shows region outlines, danger/resource signals, mission/event markers, and the camera viewport.
- Sector asteroids, scrap pockets, and signal beacons are now stored as lightweight generated data first.
- Only nearby sector content is activated as Phaser objects; distant static sector content is destroyed and restored from data when the player returns.
- The debug overlay shows active/generated sector counts for asteroids, scrap, and signals.
- The old Phase 9 browser query harness has been retired. Verify this area with focused unit tests or manual play, then run `?testHarness=smoke` for baseline browser smoke.

## Deferred

- Full mission objectives, regional reward tables, roaming squads, faction behavior, and procedural biome naming remain later-phase work.
