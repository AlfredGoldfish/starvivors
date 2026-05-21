# Starvivors 2.0 Phase 12 Stronghold and Mothership Prototype

Phase 12 adds the first world-anchor event structure with a prototype mothership.

## Implementation Notes

- World event definitions are centralized in `src/data/worldEvents.ts`.
- World event generation is centralized in `src/systems/worldEventGeneration.ts`.
- World events are generated during run creation, not spawned randomly mid-run.
- The first event definition is `mothership-prototype`.
- If no contract requires a world event, one ambient prototype mothership is generated for the current early prototype pass.
- The `mothership-contract` mission guarantees a prototype mothership in the generated sector.
- Mission objectives can now target generated world events through `destroy-world-event`.
- The prototype mothership is stationary for now, but stored as an event instance so later variants can move, patrol, or behave like larger world events.
- Entering the mothership danger radius spawns existing Enemy Lab guard squads.
- Player projectiles can damage and destroy the mothership.
- Destroying the mothership drops a high-value scrap pickup and banked-upgrade crates.
- The minimap shows world event markers and danger presence.
- Phase 12 verification is available with `?testHarness=phase12&sectorSeed=phase12-smoke`.

## Design Notes

- Strongholds and motherships should be able to support raid, avoid, farm, and destroy play patterns.
- Contract missions can guarantee event generation when the contract is flagged for a specific event.
- Ambient events and contract events should share the same generated world-event system.
- `Sector Scanner` is the working name for the future shop/unlock discovery system.
- Sector Scanner upgrades should eventually support reduced investigation time, minimap display, directional edge arrows, and mission-aware marker routing.
- The current prototype treats scanner/radar behavior as deferred so the world-anchor architecture can settle first.

## Deferred

- Stronghold event definitions.
- Moving/patrolling mothership behavior.
- Variant-specific event attacks, weak points, phases, and spawn bays.
- Sector Scanner item, upgrades, timer buildup, juice, and directional arrow UI.
- Unique weapon, ship, and shop-item unlock rewards.
- Final art, audio, warning effects, and balance.
