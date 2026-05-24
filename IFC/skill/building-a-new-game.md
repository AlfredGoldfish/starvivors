# Building a New Game

How to add a new game on top of ForgePlay, post-S58 (manifest-based, project-centric). If you're reading an older SKILL.md checklist that mentions `src/entry-yourname.ts` as step 10, that's the pre-manifest flow — ignore it and use this doc.

## Mental model

A game is a `GameManifest` (defined in `src/engine/GameManifest.ts`). The manifest is the single hook the dev environment uses to load, wire, and run the game. The engine itself stays generic — no hardcoded per-game branches.

Minimum viable manifest:

```ts
export const myGameManifest: GameManifest = {
  id: 'mygame',                // kebab-case, unique
  name: 'My Game',             // shown in menus
  description: 'One-liner for the template card',
  physicsLayers: ['player', 'enemy'],
  wire(engine) { /* register templates, subscribe to scene events */ },
  createInitialScene() { return createTitleScene(); },
  // optional:
  editorSupport: true,
  getPalette() { return MY_PALETTE; },
  getDebugActions() { return [/* dev panel buttons */]; },
};
```

## Directory layout

Create `src/game-yourname/` with:

```
src/game-yourname/
├── main.ts          — thin entry; wires engine, pushes initial scene, start()
├── manifest.ts      — the GameManifest export
├── scenes/          — one file per scene (TitleScene, GameplayScene, GameOverScene)
├── entities/        — entity factory functions
├── systems/         — game-specific systems (added via engine.addSystem)
├── data/            — balance tables, wave schedules, upgrade trees
└── templates.ts     — (optional) visual templates + re-theme subscriber
```

## Step-by-step

### 1. Scaffolding

Copy `src/game-starvivors/` as a starting point if you want a full example with templates + debug actions. Copy `src/game-td/` for something smaller.

Rename the folder, scrub references to the old id, and clear out the per-game data.

### 2. Write `manifest.ts`

Declare the manifest exactly as shown above. A few patterns worth borrowing from the existing games:

- **`wire(engine)` should do three things:** register any game-specific templates (`registerMyTemplates(engine)`), subscribe to a template-change event for live re-paint (`subscribeMyRetheme(engine)`), and wire scene-transition event handlers (`engine.events.on('game:start', () => engine.scenes.replace(createGameplayScene(), {...}))`).
- **`createInitialScene()` returns the title/menu scene**, not gameplay. Gameplay is reached via the `game:start` event.
- **`getDebugActions()` is for the DevPanel quick-action buttons.** Typical entries: Start Game, Kill Player, Heal Player, Clear Enemies, Spawn Wave. Each receives the running engine.
- **`getPalette()` is only needed if `editorSupport: true`.** It returns a `GamePalette` with the level-editor prefab entries (player-start, spawn points, walls, pickups).

### 3. Write `main.ts`

The entry file is thin — everything substantive lives in the manifest. A working `main.ts`:

```ts
import { Engine } from '../engine/Engine';
import { myGameManifest } from './manifest';

export function startMyGame(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element #game not found');
  canvas.tabIndex = 1;
  canvas.focus();

  const engine = new Engine(canvas);
  for (const layer of myGameManifest.physicsLayers) {
    engine.physics.registerLayer(layer);
  }
  myGameManifest.wire(engine);
  engine.scenes.push(myGameManifest.createInitialScene());
  engine.start();
}
```

(Existing games like `game-starvivors/main.ts` still carry a `wireStarvivors(engine)` shim because they pre-date manifests. New games don't need one — go through the manifest.)

### 4. Author scenes

- **Title scene:** input system that listens for SPACE and emits `game:start`; renderer system that draws title + background.
- **Gameplay scene:** `onEnter` resets `world.state = {}`, sets world bounds, spawns player, registers emitters, camera.follow. `onExit` clears world + particles + physics.
- **Game-over scene:** displays stats, listens for a continue key, emits `game:restart` or `game:quit`.

Per-run timers live on `world.state.runTime`, not `world.time`. See `gotchas.md` #1.

### 5. Build systems incrementally

Each system is a file in `systems/` with `init(engine)`, `update(dt, engine)`, and `destroy(engine)`. Add via `engine.addSystem(name, system)` — the engine sorts by priority at insertion (see `gotchas.md` #5 and #12).

Typical system set for a new game: `PlayerInput`, `PlayerMovement`, `PlayerShooting`, `EnemyAI`, `Combat` (collision + damage), `WaveSpawner`, `HUD`.

Everything a system sets up in `init` (event subscriptions, `onDraw`, `onWorldDraw`) MUST be removed in `destroy`. See `gotchas.md` #2.

### 6. Data tables

Put balance numbers, wave schedules, upgrade trees, level definitions in `data/`. Systems read data; they do not embed hardcoded values. This is what lets the dev environment tune the game without a code edit.

### 7. HUD + background

- HUD bars, text, controls hint: `onDraw` callbacks (screen-space).
- World background (grid, parallax): `onWorldDraw` (world-space).
- Both must be removed in `destroy`.

### 8. Register with the dev environment

Open `src/dev-environment/main.ts` and add:

```ts
import { myGameManifest } from '../game-yourname/manifest';
// ...
GameRegistry.register(myGameManifest);
```

That's all — the Project Manager picks the manifest up by `id`, lists it as a template, and loads it through the generic path (`manifest.wire(engine)` → `engine.scenes.push(manifest.createInitialScene())`).

### 9. Verify

From the repo root:

- `npx tsc --noEmit` — must pass.
- `npx vitest run` — must pass.
- `npm run dev` — the game boots from the dev environment's project picker.
- If `editorSupport: true`, Edit Mode opens and the palette from `getPalette()` renders.
- DevPanel shows the quick-actions from `getDebugActions()`.

## What NOT to do

- **Don't add `src/entry-yourname.ts`.** The four existing `entry-*.ts` files at `src/` root (`entry-arena.ts`, `entry-platformer.ts`, `entry-starvivors.ts`, `entry-td.ts`) are pre-manifest shims kept for compatibility. New games don't need them.
- **Don't touch `scripts/export.ts` to register the game.** Template bundling is a separate concern; the manifest is what the dev environment loads.
- **Don't put game-specific logic in `src/engine/`.** Physics layers, template entries, scene transitions — all of it lives in `src/game-yourname/`. The engine stays game-agnostic.
- **Don't reach for `localStorage`.** Persistence goes through `ProjectStore` (IndexedDB). If the game needs a new kind of asset, follow the binary-asset pattern in `principles.md` §5.
- **Don't ship the game partial to hit the session bar.** A game that boots but has no game-over scene is on the roadmap, not shipped. See `principles.md` §3.

## Existing games as reference

| Game | Read when you want… |
|------|---------------------|
| `src/game-starvivors/` | Full manifest with templates + re-theme + debug actions |
| `src/game-td/` | Smaller manifest, data-heavy (waves + towers) |
| `src/game-platformer/` | Physics-driven movement, level-editor palette |
| `src/game-hexharvest-visual/` | Visual-first variant, tilemap integration |
| `src/game-hexharvest-api/` | API-first variant, programmatic level construction |
| `src/game-hexharvest-hybrid/` | Combined visual + API flow |
| `src/game/` (arena) | Minimal baseline — the "hello world" of ForgePlay games |
