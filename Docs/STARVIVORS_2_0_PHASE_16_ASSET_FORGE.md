# Starvivors 2.0 Phase 16 Asset Forge

Phase 16 starts the SVG/vector asset pipeline by turning the Enemy Lab into the first host for a broader Starvivors Asset Forge.

## Implementation Notes

- The locked art theme is **Neon-Forward Salvagepunk**: neon energy should dominate the first read, while salvage/steampunk machinery supplies structure and silhouette.
- Forge source assets are structured TypeScript/JSON recipes, with SVG as an export/review artifact.
- Runtime gameplay continues to use cached Phaser textures instead of live SVG/vector redraws.
- Core Forge schema, style guide, texture rendering, SVG export, contact-sheet export, AI brief generation, import parsing, and promotion bundle helpers live in `src/systems/assetForge.ts`.
- Enemy Lab textures now route through the Forge renderer by converting existing `EnemyVisualDefinition` data into Forge assets.
- `/enemy-lab.html` now exposes an Asset Forge panel with Neon-Forward Salvagepunk guidance and export/import buttons for SVG, Forge JSON, contact sheets, Forge imports, and Forge promotion bundles.
- Phase 16B adds an in-lab enemy Forge editor for creating editable drafts, changing palette slots, selecting layers, changing layer color/alpha/stroke, moving/scaling/mirroring layers, adding common neon/salvage pieces, duplicating/deleting layers, and previewing combat/minimap/silhouette/starfield/hit-radius contexts.
- Phase 16C adds AI batch workflow support: batch-size briefs, `starvivors-forge-asset-batch` parsing, array/storage import parsing, style/version/layer validation, rejected-import reporting, and automatic draft tagging for AI batch imports.
- Phase 16D adds the production promotion bridge: enemy definitions can reference optional `visualAssetId`, runtime visuals resolve Forge registry assets first and keep embedded visuals as fallback, Forge drafts have status controls, approved assets can be marked `Promoted`, and the lab exports source-ready registry/definition patch bundles.
- Phase 16E starts expansion beyond enemies with a generic AI-first Forge workflow: reusable templates can create projectiles, weapon icons, effects, pickups, and UI icons; Pulse Cannon now consumes the generic `forge.projectile.neon-bolt-01` projectile asset as the first runtime proof.
- Phase 16E also adds AI task/response/validation/repair protocol support so external AI can receive a machine-readable task package, return assets or batches, get validation feedback, and repair failed imports.
- Existing Enemy Lab variants, squads, behavior testing, diagnostics, and preset import/export remain compatible.
- Enemy Lab AI briefs and promotion reports now include the Neon-Forward Salvagepunk style guide so AI-generated assets inherit the visual direction.

## Deferred

- Drag-and-drop layer manipulation and direct canvas picking.
- Dedicated Forge tabs for pickups, effects, UI icons, radar icons, ships, beams, and telegraphs.
- Direct in-app AI provider calls; 16E prepares provider-ready request data but still defaults to manual export/import.
- Direct browser-side source patching for promotions; 16D exports the exact bundle for AI/code to apply.
- Automated readability/contrast scoring.
