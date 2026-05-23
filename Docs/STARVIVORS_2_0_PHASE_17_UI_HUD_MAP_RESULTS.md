# Starvivors 2.0 Phase 17 UI/HUD/Map/Results

Phase 17 makes the 2.0 run structure readable during combat and at run end.

## Implementation Notes

- Phase 17A starts with viewport cleanup: the large runtime diagnostics text is hidden by default and toggled with `X`; `Z` remains the full debug menu.
- A minimal FPS readout remains visible during runs so performance is still visible without covering the playfield.
- The HUD is being reframed into compact combat groups for run time, hull, fuel, mission state, rewards, scanner state, upgrades, and weapons.
- Phase 16 Forge UI icon language is now available for HUD/radar readability work.

## Subphases

- **17A HUD Reframe:** diagnostics hotkey, minimal FPS, compact combat HUD groups.
- **17B Radar and Sector Signals:** minimap hierarchy, scanner reveal language, sector signal indicators.
- **17C Results and Build Summary:** clearer end-of-run report, rewards, mission result, ship/weapon/upgrade summary.
- **17D UI Consistency Pass:** align HUD, map, results, pause/settings, and ship select around the Neon-Forward Salvagepunk interface style.

## Deferred

- Full minimap redesign beyond hierarchy/readability.
- New mission logic or reward tuning.
- Replacing all UI symbols with Forge icons in one pass.
