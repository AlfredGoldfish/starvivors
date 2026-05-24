# Principles

The five ideas that govern every engine decision. If your work contradicts any of these, stop and write the contradiction into `SESSION_LOG.md` before continuing.

## 1. Hard boundary between engine and game

`src/engine/` provides primitives: a game loop, a renderer, a physics solver, an audio mixer, an event bus, a scene stack, registries for assets. `src/game-*/` provides mechanics: what an enemy does, how a wave spawns, what a power-up means.

- The engine never imports from `src/game-*/` or `src/dev-environment/` or `src/editor/`.
- The engine has zero knowledge of any specific game — no game names, character names, weapon names, or genre-specific branches.
- Games hook into the engine via two surfaces only: the public `Engine` facade (49 subsystems on `engine.<name>`) and the `GameManifest` contract.
- Never create a `src/engine/systems/` folder of pre-built mechanics ("wave spawner", "inventory UI", "boss fight"). Those belong in the game.

## 2. AI is the operator — API-first, GUI second

The primary operator of ForgePlay is AI writing code. The dev-environment editor is a visualization of the API, not its own surface.

- **Every action the editor exposes must also be callable as an API.** If you add an "Add Particle" button, ship `engine.fx.emit(...)` (or equivalent) in the same session.
- If you catch yourself adding an editor-only feature, stop. Either expose it on the API, or drop it. Record the API/GUI pairing in `SESSION_LOG.md` under the session's Results.
- When the editor and the API disagree, the API wins and the editor gets fixed.

## 3. Shippable-by-default — 10 gates, zero cuts

Nothing ships partial. A subsystem is not "done" until all 10 gates pass. Gate 9 (visual polish) is not optional.

The gate list lives in `docs/roadmap/ROADMAP_1.0.md`. If a gate can't pass in the current session, the subsystem stays on the roadmap as in-progress — do not declare it shipped, and do not remove it from the pass list to make the session look finished.

## 4. Tick order is sacred

The game loop is fixed-timestep at 60Hz with a variable-rate render (see `src/engine/Engine.ts` → `logicTick`). The order within a tick matters and is deliberate:

1. **Systems, in priority order** (higher priority = later). `addSystem(name, system)` sorts on insert; priority changes require `removeSystem` + re-add.
2. **Components** — `engine.components.runUpdates(dt)`.
3. **Behaviors** — `engine.behaviors.tickAll(dt)` (skipped when paused).
4. **Tween, Timer, Physics, Particles.**

Consequences:

- If you need "this must run before physics this frame," use a system with the right priority — don't try to chain callbacks or fight the loop.
- When paused, input is still polled and drawing still happens, but physics and particles are skipped and `world.time` does not advance. `state.runTime` (an engine-tracked ticker) is also frozen; don't confuse the two.
- `events.emit` is deferred — events flush once per frame at a well-defined point. Don't assume a listener runs before the emitter returns.

## 5. Project-centric persistence, binary-asset pattern

Post-S58, ForgePlay is project-centric. A "project" is the unit that saves, loads, imports, exports. Everything persistent goes through `ProjectStore` (IndexedDB-backed).

- **Do not reach for `localStorage` or `sessionStorage`.** The only saves left in `localStorage` are legacy save slots, and those are being migrated.
- **Binary assets follow the pattern.** For any file-backed registry (audio clips, images, sprite sheets, icon PNGs, exported ForgePacks, anything with a blob):
  1. Store the blob as an `AssetData` under the correct category in `ProjectStore.assets`.
  2. Keep only the `blobId` in the registry's serialized def.
  3. Call `setBlobLoader(id => ProjectStore.getXBlob(id))` on the subsystem. Add a `hydrateAll()` for eager warm-up on project open.
  4. Extend `ForgePackExporter` to bundle the bytes under `blobs/<blobId>.bin`. `importForgePack` re-persists them and rewrites ids.
  5. If one asset owns many blobbed children (one preset → many icon blobs), walk the array in both directions.
- **Every registry serializes cleanly through `ProjectStore`.** The last three gaps (`DialogTreeRegistry` S62, `BehaviorGraphRegistry` S65, `SequencerRegistry` S66) closed during Pass 1/2. New registries must round-trip by default — this is no longer a "known hole" it's OK to ship without.

The canonical examples to copy from are `MusicManager` (S59) and `InventorySystem` (S61).
