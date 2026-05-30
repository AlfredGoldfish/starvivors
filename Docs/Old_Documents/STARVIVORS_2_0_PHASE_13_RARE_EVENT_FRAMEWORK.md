# Starvivors 2.0 Phase 13 Rare Event Framework

Phase 13 adds the first rare-event layer for unusual, high-value sector encounters.

## Implementation Notes

- Rare event definitions are centralized in `src/data/rareEvents.ts`.
- Rare event generation is centralized in `src/systems/rareEventGeneration.ts`.
- Runtime rare-event state helpers are centralized in `src/systems/rareEventRuntime.ts`.
- Rare events are generated during run creation, not randomly inserted mid-run.
- Contract missions can guarantee a rare event through `guaranteedRareEventId`.
- The first contract rare event is `unstable-black-hole-cache`, used by `rift-cache-contract`.
- The first themed squad rare event is `hunter-swarm`.
- Black-hole rare events use investigation completion and place the global black-hole hazard at the event anchor.
- Swarm rare events complete after their themed squad enemies are defeated.
- Rare events drop scrap and banked-upgrade crates, with unlock hook ids reserved for Phase 14.
- The minimap now shows rare-event signal, danger, and objective markers.
- The old Phase 13 browser query harness has been retired. Verify this area with focused unit tests or manual play, then run `?testHarness=smoke` for baseline browser smoke.

## Design Notes

- Rare events share the same run-generation philosophy as motherships and strongholds: they are part of the generated sector plan.
- A contract can force an event/mothership/stronghold to spawn when the mission requires it.
- Ambient rare events are intentionally sparse until the framework has more variants.
- `Sector Scanner` remains the working name for the shop item that will reveal event knowledge over time.
- Sector Scanner upgrades should later support reduced scan time, minimap display, edge arrows, and mission-aware routing.

## Deferred

- Persistent unlock storage and shop inventory rewards.
- Sector Scanner item, scanner juice, scan timer effects, directional edge arrow, and upgrade tiers.
- Multiple black-hole cache variants.
- Multiple swarm/themed squad variants.
- Stronghold and mothership variant tables that share this event framework.
- Final art, audio, warning effects, and balance.
