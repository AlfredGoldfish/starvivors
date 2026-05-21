# Starvivors 2.0 Phase 11 Mission Framework

Phase 11 adds the first mission/contract framework without building a polished mission UI.

## Implementation Notes

- Mission definitions are centralized in `src/data/missions.ts`.
- Mission objective placement is centralized in `src/systems/missionGeneration.ts`.
- The main menu now shows the selected contract and a placeholder `Change Contract` action.
- Supported first-pass contracts are Survey Signal, Salvage Cache, and Enemy Probe.
- Each run starts with a selected mission and a guaranteed reach-location objective in a matching generated sector region.
- Mission objectives have in-world markers, minimap markers, HUD distance/status text, and result-screen status.
- Active missions complete when the player reaches the objective radius.
- Active missions fail when the player dies, and are marked incomplete if the player extracts before completing the objective.
- Query-string mission selection is available with `?missionId=survey-signal`, `?missionId=salvage-cache`, or `?missionId=enemy-probe`.
- Phase 11 verification is available with `?testHarness=phase11&sectorSeed=phase11-smoke`.

## Deferred

- Polished mission selection screen.
- Mission reward payout and unlock triggers.
- Mission-specific enemy, stronghold, mothership, or rare-event objective types.
- Mission retry/abandon flow.
- Persistent mission history or contract reroll economy.
