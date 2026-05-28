# Editor Panels

The dev environment lives in `src/dev-environment/` (28 files + `styles.css` + `main.ts`). Every panel visualizes an engine API that already exists — you can do anything the editor does from code. This is the API-first invariant (principles.md §2).

The shared graph surface for Dialog and Behaviors lives in `src/editor/components/` — see `graph-editor.md` for that.

Adjacent file: `graph-editor.md` for the `GraphEditor` backbone. `engine-facade.md` for the API each panel maps to.

---

## Shell & Infrastructure

### `DockManager.ts`

The layout system. A binary tree of `DockNode`s — each node is either a "leaf" (tab group) or a "split" (two children with a draggable divider). The canvas (game viewport) is a special leaf that cannot be closed.

Panels register as `DockPanelDef`:

```ts
interface DockPanelDef {
  id: string          // e.g. 'shape-composer'
  title: string       // tab label
  category?: 'core' | 'authoring' | 'debug' | 'browse'
  build(container: HTMLElement): void
  onFocus?(): void
  onBlur?(): void
}
```

Docking layout serializes to JSON for localStorage persistence. **Phase 2 (full drag-to-rearrange, floating windows)** is in `BRAIN.md` → Unresolved Decisions — not yet implemented.

### `MenuBar.ts`

Application menu bar: File / Edit / View / Tools / Help. Data-driven — menus are `MenuItemDef` arrays. Actions dispatch to registered callbacks. Keyboard shortcut display handled by `KeyboardShortcutManager`.

### `KeyboardShortcutManager.ts`

Global keyboard shortcut registry. Automatically skips when focus is in an `<input>`, `<textarea>`, or `<select>`. All global shortcuts (Ctrl+Z, Ctrl+S, F11, etc.) register here rather than raw `keydown` listeners.

### `Modal.ts` / `Toast.ts`

Non-native dialog replacements. `Modal` is a dismissable overlay for confirmations and multi-field dialogs. `Toast` is a transient bottom-right notification for save confirmations and operation results. Both replace `alert()`/`confirm()` (native dialogs freeze the CDP channel in headless Chrome automation).

```ts
import { showModal, showConfirm, showAlert } from './Modal'
import { showToast } from './Toast'

await showConfirm('Delete this prefab?')
showToast('Saved!', 'success')
```

### `StatusStrip.ts`

Persistent bottom bar showing live engine state at ~2 Hz: game name, mode, FPS, entity count, pause state, time scale. No interaction — read-only status.

### `AssetExportDialog.ts` / `AssetImportDialog.ts`

Modals for `.forgepack` file export and import. Export shows per-section checkboxes with entry counts; import shows a preview of the pack's contents plus conflict-resolution options (skip / overwrite / rename).

---

## The first shared UI primitive: `ColorPicker.ts`

`ColorPicker` is the first extracted shared component — the same widget appears in 6+ panels. It provides a compact swatch button that opens a dropdown with: native browser color input, hex text input with validation, recent colors (localStorage-persisted), and a preset palette.

```ts
// Standalone:
const picker = new ColorPicker('#FF0000', (hex) => applyColor(hex))
container.appendChild(picker.el)

// Labeled row helper:
const row = ColorPicker.createRow('Background', '#1e3a5f', (hex) => { engine.renderer.backgroundColor = hex })
panel.appendChild(row)
```

When building a new panel that needs color selection, use `ColorPicker` — don't roll a new one. It's the model for what future shared primitives should look like: a class with a public `.el` property and a callback-based API.

---

## Authoring Panels

### `ShapeComposerPanel.ts`

Visualizes `engine.shapes` (multi-part compositions). Canvas on the left at high zoom; controls on the right to add/edit/remove parts. Save writes via `engine.shapes.register`. Undo/redo via `engine.editor.commands`. Selection by clicking parts on the canvas.

**Size:** substantial panel. Model for what "gate-9 polish" looks like — canvas viewport + property sidebar is the template for the larger authoring panels.

### `EffectsEditorPanel.ts`

Visualizes `engine.fx` (particles, shakes, flashes). Three sub-tabs with a shared live-preview arena at top. The "Fire" / "Shake" buttons exercise the real engine APIs so the preview is always accurate.

### `SoundEditorPanel.ts`

Visualizes `engine.audio.registerSfx`. Sliders for every `SfxPreset` field plus a live "Play" button that uses `engine.audio.playSpec(spec)` to audition unsaved changes. A waveform glyph gives visual anchor.

### `AnimationEditorPanel.ts`

Visualizes `engine.animations`. Timeline strip proportional to frame durations; per-frame property editor (composition, color, alpha, duration, event name); preview canvas with independent RAF loop.

### `TemplateEditorPanel.ts`

Visualizes `engine.templates`. Template list with one-click "Apply"; palette swatch grid with `ColorPicker` per slot; font/fx/audio fields as key-value pairs.

### `ScreenEditorPanel.ts`

Visualizes `engine.screens`. Screen list + activate/deactivate; element tree with per-node add/remove/reorder; typed property forms per element kind (text, bar, button, panel). S44 replaced the raw JSON editor from S43 with typed inputs.

### `InventoryEditorPanel.ts`

Visualizes `engine.inventory` (three layers). Two sub-views toggled by header: **Items** (catalogue grouped by rarity, icon preview, full field editor with binary blob import) and **Templates** (slot-shape blueprints). Test harness at the bottom to create instances.

### `MusicEditorPanel.ts`

Visualizes `engine.music`. Tracks grouped by tag. Every mutation flows through `engine.editor.commands` so Ctrl+Z works. Blobs persisted to `ProjectStore` (category `'music'`) before the register command fires; `blobId` goes in the def. Hydrates blobs on open via `engine.music`'s blob loader.

### `ParallaxEditorPanel.ts`

Visualizes `engine.parallax`. Preset cards with expandable layer list. Auto-panning live-preview canvas per preset. All mutations via `engine.editor.commands`.

### `PrefabBrowserPanel.ts`

Visualizes `engine.prefabs`. Grid of prefab cards grouped by category, with thumbnail drawn from prefab `preview` metadata. Click to select; click canvas to spawn via `engine.world.spawnPrefab`.

### `ProjectManagerPanel.ts`

Two views: **Project List** (all IndexedDB projects: create / open / rename / duplicate / delete, with substring search over name + template) and **Asset Tree** (virtual folder tree of the open project's registry contents). Registers as a `DockPanelDef`.

**Public API** (contract for `main.ts` + Recent Projects MRU + boot-time auto-restore):

- `createDockDef(): DockPanelDef` — dock registration.
- `showNewProject(): void` — open the new-project dialog programmatically (called by File > New Game).
- `openProject(id: ProjectId): Promise<void>` — the canonical open path. Used by File > Open Game, File > Recent Projects (S87), the per-row Open button, and boot-time auto-restore. Surfaces a toast on load failure; prunes the id from `RecentProjectsStore` when the project is missing so a stale MRU entry self-heals.
- `refresh(): void` — re-render the current view after an external mutation (forgepack import, restored layout).

**Lifecycle callbacks** (constructor opts):

- `onOpen(project: ProjectData | null): void` — `null` = "the active project was just deleted; drop engine state back to blank." Non-null = "this project is now active" (fresh open, switch, or duplicate-and-open).
- `onCreate(project: ProjectData): void` — fires once, right after a fresh project is inserted into `ProjectStore` and before the Asset Tree renders.

**Backing store API** on `ProjectStore` (relevant to the panel):

- `listProjects(): Promise<ProjectMeta[]>` — sorted by `updatedAt` desc (most-recent first).
- `createProject(name, template?): Promise<ProjectData>` — inserts an empty project.
- `renameProject(id, newName): Promise<ProjectData>` — trims, throws on empty, bumps `updatedAt`, preserves id.
- `duplicateProject(sourceId, newName): Promise<ProjectData>` — deep-clones everything except blobs (binary assets are shared via `blobId` references — matches desktop-app duplicate semantics).
- `deleteProject(id): Promise<void>` — cascades into assets + autosaves indexes.

**Helpers exported for test**:

- `filterProjects(metas, query): ProjectMeta[]` — pure case-insensitive substring filter on name + template. The Project List search input wraps this on every render; the helper itself has no DOM dependency.

**Convention notes**:

- Destructive confirmations (delete) go through `showModal` — never `window.confirm()` (the native dialog freezes CDP in Chrome-automation).
- Load / rename / duplicate failures surface via `showToast(msg, 'error', 3000)` rather than console-only.
- `RecentProjectsStore` (from `dev-environment/RecentProjectsStore.ts`) is kept in sync automatically: `onOpen` / `onCreate` add to the MRU; delete removes; duplicate adds the clone; rename re-adds only if the id was already in the MRU (renaming a project shouldn't sneak random projects into File > Recent).
- Project CRUD does **not** route through `engine.editor.commands` — these are workspace-level filesystem-analog operations, not engine-world mutations. The engine command stack is for world edits that need undo; project delete has its own confirmation dialog as the undo-equivalent surface.

---

## Editor / Level Panels

### `LevelEditor.ts`

Universal level design tool running in Edit Mode. Own RAF loop on the game canvas. Features: universal palette (reads from `GameManifest.getPalette()`), undo/redo, multi-select, keyboard shortcuts (Delete, Ctrl+C/V/D/A, arrow nudge, G for grid-snap, Escape). Paired with `EditorPanels.ts` for the surrounding UI (toolbar, palette panel, properties panel, entity list, level settings).

### `EditorPanels.ts`

The edit-mode panel UI for `LevelEditor`. Toolbar (undo/redo buttons), palette panel (prefab/entity type selection), properties panel (selected entity fields), entity list with z-order controls, level settings, and keyboard shortcut reference. Uses `ColorPicker` for color properties.

---

## Debug / Browse Panels

### `DebugPanel.ts`

Visualizes `engine.inspector`. Three sections: overlay toggles (physics AABB color-coded by layer), filterable event log (last 300 events, filter by event name or entity id), and selected-entity report.

### `SceneHierarchyPanel.ts`

Visualizes `engine.world.hierarchy()`. Category-grouped, collapsible entity tree. Clicking an entity notifies `DevPanel` to select it (inspector + selection ring in viewport).

### `AssetBrowserPanel.ts`

Unified tabbed index of everything authorable. Tabs: Prefabs, Paths, Shapes, Effects, Sounds, Animations, Templates, Behaviors, Tilemap, Materials, Music, Inventory, i18n, Dialog, Quests, Sequences, Textures, Parallax, Replay, Lighting, PostProcess, Forces. Each tab reads the matching engine registry. AI-agency invariant: everything listed is also enumerable from code.

### `DevPanel.ts`

The top-level dev environment control UI. Wires all panels together and binds reactive updates to the engine. Contains the `ColorPicker` import and the editable-entity properties (EDITABLE_NUMERIC_KEYS). Acts as the coordinator that panels notify when an entity is selected.

---

## Conventions when authoring a new panel

1. **API-first.** Map every UI control to an existing engine API call. If the API doesn't exist, add it to the engine first.
2. **Register as a `DockPanelDef`** so the dock system can place it. See `ResolutionPanel.ts` for a self-contained example of a small panel.
3. **Use `ColorPicker` for any color selection.** The `createRow` helper covers the labeled-row case.
4. **Route mutations through `engine.editor.commands`** for undo/redo. Use `CommandHistory.execute(command)`, where a command implements `{ execute(): void; undo(): void; name: string }`.
5. **Use `showToast` for save confirmations.** Use `showConfirm` for destructive actions. Do not call native `alert()`/`confirm()`.
6. **Small panels** (like `ResolutionPanel.ts`, `StatusStrip.ts`) are single files, no sub-views. Panels with multiple logical sub-sections (like `InventoryEditorPanel.ts`, `ShapeComposerPanel.ts`) split into sub-views toggled by a header or tabs — avoid flat lists for hierarchical content.
7. **Never import from `src/game-*/`.** The editor must be game-agnostic and work via any registered `GameManifest`.
