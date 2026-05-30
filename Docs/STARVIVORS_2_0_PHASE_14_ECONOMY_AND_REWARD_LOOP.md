# Starvivors 2.0 Phase 14 Economy and Reward Loop

Phase 14 connects run rewards to persistent progression and adds the first Sector Scanner path.

## Implementation Notes

- Progression storage is centralized in `src/systems/progressionStorage.ts`.
- Reward hook resolution is centralized in `src/systems/rewardResolver.ts`.
- Sector Scanner runtime is centralized in `src/systems/sectorScanner.ts`.
- Credits remain the persistent spendable currency.
- Run scrap remains an in-run resource and converts to credits at results.
- Rerolling upgrade choices spends run scrap before conversion.
- Normal upgrade selections now show 3 choices.
- Reroll cost starts at 5 run scrap and scales by +5 per reroll in the same run.
- The debug menu can switch reroll testing to 10/+10 scaling.
- Mission, world-event, and rare-event definitions can now expose deterministic reward hooks.
- Completing the Rift Cache path unlocks the Sector Scanner shop path.
- Sector Scanner has three levels:
  - Level 1: timed scan only.
  - Level 2: edge arrow after scan completion.
  - Level 3: scanner target minimap marker after scan completion.
- The old Phase 14 browser query harness has been retired. Verify this area with focused unit tests or manual play, then run `?testHarness=smoke` for baseline browser smoke.

## Phase Alignment Check

- Phases 8-10 remain aligned: larger sectors, generated regions, and roaming squads provide the world for scanner/reward routing.
- Phases 10.5 and 10.6 remain aligned: scrap is still collected for XP and conserved through performance systems.
- Phase 11 deferred mission payouts and unlock triggers are now connected through reward hooks.
- Phase 12 deferred Sector Scanner/shop unlock rewards are now partially connected.
- Phase 13 deferred rare-event unlock hook resolution is now connected.
- Unique weapon content and ship-select loadout editing remain Phase 15 work.
- Final scanner juice, polish effects, audio, mission-aware routing, and broad content expansion remain later work.

## Deferred

- Full unique weapon unlock content.
- Ship-select loadout UI for persistent weapon selection.
- Sector Scanner juice/effects polish.
- Mission-aware scanner routing beyond nearest-event targeting.
- Visible rare-parts currency.
- Persistent mission history, codex entries, and contract reroll economy.
