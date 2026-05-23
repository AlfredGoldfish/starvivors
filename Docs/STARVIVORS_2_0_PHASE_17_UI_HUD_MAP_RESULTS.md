# Starvivors 2.0 Phase 17 UI/HUD/Map/Results

Phase 17 makes the 2.0 run structure readable during combat and at run end.

## Implementation Notes

- Phase 17A starts with viewport cleanup: the large runtime diagnostics text is hidden by default and toggled with `X`; `Z` remains the full debug menu.
- A minimal FPS readout remains visible during runs so performance is still visible without covering the playfield.
- The HUD is being reframed into compact combat groups for run time, hull, fuel, mission state, rewards, scanner state, upgrades, and weapons.
- Phase 16 Forge UI icon language is now available for HUD/radar readability work.
- Phase 17B starts the radar readability pass: the minimap now draws sector context first, separates signal markers from general region tint, labels signal count/nearest signal, and keeps scanner target treatment visually distinct.
- Phase 17C starts the run report pass: the results screen now summarizes outcome, rewards, mission state, ship/loadout, run upgrades, and sector context in readable report sections.
- Phase 17D starts the consistency pass: shared cockpit UI colors, panel frames, inner brass trim, and button treatment now carry across command, hangar, shop, pause/settings, main menu, and results screens.
- Phase 17E removes the normal-run FPS/debug readout, keeps diagnostics on `X`, and reshapes the combat HUD into a compact Neon-Forward Salvagepunk cockpit with top XP/timer, mission strip, lower hull/fuel/scrap/upgrade/scanner/radar modules, weapon cooldowns, and warning chips.
- Phase 17F turns the minimap into a persistent radar progression. New saves start at Radar Level 0 with the map offline; upgrades unlock scope, signals, resources, and threat/anomaly layers while the Sector Scanner remains a separate timed scan system.
- Phase 17G refines the cockpit pass with a full-width XP/run rail, moves mission detail into a dashboard mission button plus right-side questlog popup, and adds stronger neon/glow affordances without returning to debug-style text blocks.

## Subphases

- **17A HUD Reframe:** diagnostics hotkey, minimal FPS, compact combat HUD groups.
- **17B Radar and Sector Signals:** minimap hierarchy, scanner reveal language, sector signal indicators. Started with signal marker snapshots, radar grid, nearest-signal readout, and stronger mission/event/scanner layering.
- **17C Results and Build Summary:** clearer end-of-run report, rewards, mission result, ship/weapon/upgrade summary. Started with a wider report overlay and sectioned outcome/reward/build/upgrade/sector summaries.
- **17D UI Consistency Pass:** align HUD, map, results, pause/settings, and ship select around the Neon-Forward Salvagepunk interface style. Started with shared cockpit shell helpers and consistent neon/brass button and frame treatment.
- **17E Cockpit HUD:** compact cockpit modules and hotkey-only diagnostics. Started with hidden default diagnostics, top-center XP/timer rail, top-right mission strip, lower cockpit dashboard modules, and warning chips.
- **17F Radar Progression:** persistent radar levels and gated minimap layers. Started with Radar Level 0-4 storage, shop purchase flow, radar HUD status, minimap capabilities, and layer gating for mission, signals, resources, threats/events/anomalies, and scanner target reveal.
- **17G HUD Refinement:** full-width XP/run rail, dashboard mission button, side mission log popup, clustered dashboard controls, clearer button affordances, and restrained neon pulse/glow polish.

## Deferred

- Full minimap redesign beyond hierarchy/readability.
- New mission logic or reward tuning.
- Replacing all UI symbols with Forge icons in one pass.
