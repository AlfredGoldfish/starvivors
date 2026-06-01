# Starvivors 2.0 Phase 10 Roaming Squads

Phase 10 starts world population by making squads exist in the sector instead of only spawning near the player.

## Implementation Notes

- World squads are generated deterministically from the sector seed after Phase 9 regions are created.
- Squads are lightweight data while distant, with a region, position, home point, patrol point, and state.
- Supported squad states are `roam`, `patrol`, `guard`, `pursue`, `disengage`, and `defeated`.
- Nearby squads activate into live shared enemy squads and pursue the player.
- Squads have a leash: if the player escapes far enough from the squad home, remaining members despawn without rewards and the squad enters `disengage`.
- Distant squads update on a low-frequency timer instead of simulating full enemy AI.
- The debug overlay shows active and defeated world squad counts.
- The old Phase 10 browser query harness has been retired. Verify this area with focused unit tests or manual play, then run `?testHarness=smoke` for baseline browser smoke.

## Deferred

- Ally-call behavior, radar warnings, faction identity, squad-specific loot, mission integration, and polished minimap squad markers remain later-phase work.
