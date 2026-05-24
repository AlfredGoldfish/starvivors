# Conventions

The code style for ForgePlay. The root `CONVENTIONS.md` is the source of truth; this file adapts it to the engine/game/editor layering and flags the spots where reality has drifted ahead of the original doc (e.g. seven game directories, not one).

## TypeScript

- Strict mode. No `any` — use `unknown` and narrow with type guards.
- Public methods and exported interfaces carry JSDoc. Private helpers don't need it.
- Prefer `interface` over `type` for object shapes.
- Prefer `readonly` for fields that don't change after construction.
- No class over ~300 lines — split into helpers.
- No barrel files. Import directly from the source file.

## Naming

- Files: `PascalCase.ts` for classes, `camelCase.ts` for utilities.
- Classes and interfaces: `PascalCase`.
- Methods and functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Event names: `namespace:action` — `enemy:killed`, `game:over`, `template:changed`.
- Entity tags: `kebab-case` — `'player'`, `'xp-gem'`, `'player-owned'`.
- Manifest ids: `kebab-case` — `'starvivors'`, `'hexharvest-visual'`.

## File layout

- One primary export per file (`World.ts` exports `World`).
- Single-use helpers live in the same file, not exported.
- Cross-module helpers go in a `utils/` directory.
- Tests sit next to source: `World.ts` → `World.test.ts`.

## Engine code — `src/engine/`

- **Zero imports from `src/game-*/`, `src/dev-environment/`, or `src/editor/`.** Ever.
- Zero imports from React, Zustand, or any UI framework.
- Only browser APIs: Canvas2D, Web Audio, DOM events, `requestAnimationFrame`, IndexedDB (through `ProjectStore`).
- All public API is on the `Engine` facade or its direct subsystem references (`engine.world`, `engine.events`, etc.).
- Internal methods are private. Don't expose implementation details.
- Subsystem tests live next to the subsystem (`AudioRegistry.ts` → `AudioRegistry.test.ts`).

## Game code — `src/game-*/`

There are currently seven game directories: `game/`, `game-platformer/`, `game-starvivors/`, `game-td/`, `game-hexharvest-api/`, `game-hexharvest-hybrid/`, `game-hexharvest-visual/`. The per-game structure is:

- `main.ts` — thin entry. Creates the canvas, the engine, calls a `wire<Name>(engine)` helper (or uses the manifest directly), pushes the initial scene, `engine.start()`.
- `manifest.ts` — exports the `GameManifest`. This is the single hook the dev environment uses to load the game.
- `scenes/` — one file per scene (`TitleScene.ts`, `GameplayScene.ts`).
- `entities/` — entity factory functions.
- `systems/` — game-specific systems added via `engine.addSystem`.
- `data/` — balance tables, wave schedules, upgrade trees.
- `templates.ts` (optional) — visual-template registration + re-theme subscribers.

Game code imports the engine only through its public API. Do not reach into `src/engine/` internals.

The four `entry-*.ts` files at `src/` root (`entry-arena.ts`, `entry-platformer.ts`, `entry-starvivors.ts`, `entry-td.ts`) are the pre-manifest entry shims. Post-S58, the canonical entry is the dev-environment's project loader reading a `GameManifest`. If you're adding a new game, follow the manifest pattern — don't add a fifth `entry-*.ts`.

## Editor / dev-environment code — `src/dev-environment/` and `src/editor/`

- Imports the engine only through its public API.
- Never imports from `src/game-*/` — the editor must be game-agnostic and work off any registered manifest.
- `src/editor/components/GraphEditor.ts` is the shared graph backbone. Don't fork it — supply a `NodeTypeSpec` palette instead.
- Panels are self-contained files in `src/dev-environment/` (e.g. `ResolutionPanel.ts`, `InventoryEditorPanel.ts`). Modal-ish UIs go through `Modal.ts` / `Toast.ts` / `DockManager.ts`.

## Testing

- Every engine module has a corresponding test file.
- Vitest. Test file naming: `ModuleName.test.ts`.
- Tests cover: creation, core functionality, edge cases, cleanup (and round-trip for anything that serializes).
- Game code tests are optional but encouraged for complex systems.
- Editor panels that do non-trivial work (e.g. `GraphEditor.ts`) get tests. Pure rendering glue doesn't need them.

## Comments

- Comment *why*, not *what*. `// Cap accumulator to prevent spiral of death` is good. `// Set x to 5` is bad.
- File-level comment: one line describing the module's purpose.
- No commented-out code — delete it. It lives in git history.

## Git

- Don't commit `node_modules/`, `dist/`, `.vite/`, or the `vite.config.ts.timestamp-*.mjs` files.
- `reference/` is committed but never imported from in source code.
- IndexedDB state is per-machine and not committed — don't generate fixtures that assume a pre-populated `ProjectStore`.
