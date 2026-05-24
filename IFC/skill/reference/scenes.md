# Scenes

The `SceneManager` (`src/engine/core/SceneManager.ts`) maintains a stack of `Scene` objects. The top of the stack is the active scene. Scene transitions are how you move between a title screen, gameplay, pause menu, and game over. This file covers the stack model, the lifecycle callbacks, the cleanup contract, and the common patterns across ForgePlay's existing games.

Adjacent file: `gotchas.md` #1 (`world.state` vs `world.time`) and #2 (cleanup contract) are both rooted in the scene model — read them before writing any scene code.

---

## The `Scene` interface

A scene is a plain object:

```ts
interface Scene {
  name: string;
  systems: Record<string, GameSystem>;     // systems registered/removed by push/pop/replace
  onEnter?(engine: EngineInterface): void;
  onExit?(engine: EngineInterface): void;
  onPause?(engine: EngineInterface): void;   // called when another scene is pushed on top
  onResume?(engine: EngineInterface): void;  // called when the scene above is popped
}
```

A `GameSystem` is:

```ts
interface GameSystem {
  priority?: number;
  init?(engine: EngineInterface): void;
  update(engine: EngineInterface, dt: number): void;
  destroy?(engine: EngineInterface): void;
}
```

`SceneManager` calls `engine.addSystem(name, system)` for every entry in `scene.systems` when the scene becomes active, and `engine.removeSystem(name)` for every entry when it's deactivated. `addSystem` calls `system.init(engine)`; `removeSystem` calls `system.destroy(engine)`.

---

## Stack operations

### `engine.scenes.push(scene)`

Adds a new scene to the top. The previous top scene is paused: its systems are removed and `onPause` is called. The new scene's systems are added and `onEnter` is called.

**Use for:** pause menus, upgrade overlays, modal dialogs — anything that overlays the current game state without destroying it.

### `engine.scenes.pop()`

Removes the top scene. Its systems are removed and `onExit` is called. The scene below resumes: its systems are re-added and `onResume` is called.

**Use for:** dismissing an overlay, returning from a pause menu.

### `engine.scenes.replace(scene, options?)`

Removes the top scene (calls `onExit`, removes systems) and pushes the new one (adds systems, calls `onEnter`). Optionally plays a visual transition.

```ts
engine.scenes.replace(createGameplayScene(), { transition: 'fade', duration: 0.4 })
// Transitions: 'fade' | 'swipeLeft' | 'swipeRight' | 'none'
```

**Use for:** title → gameplay, gameplay → game-over, game-over → title. Most game transitions.

### Lifecycle summary

```
push(B)   → A.onPause     → A.systems removed → B.systems added → B.onEnter
pop()     → B.onExit      → B.systems removed → A.systems added → A.onResume
replace(C)→ A.onExit      → A.systems removed → C.systems added → C.onEnter
clear()   → each scene: onExit + systems removed (bottom to top)
```

---

## Writing a scene

A scene factory function is the standard pattern (named `createXxxScene()`). The factory captures any constructor-time parameters; `onEnter` does the runtime setup.

```ts
export function createGameplayScene(): Scene {
  // Capture handler refs so destroy() can remove them
  let onDied: EventHandler | null = null
  let drawHud: DrawCallback | null = null

  return {
    name: 'gameplay',
    systems: {
      playerInput:    new PlayerInputSystem(),
      playerMovement: new PlayerMovementSystem(),
      enemyAI:        new EnemyAISystem(),
      combat:         new CombatSystem(),
      waveSpawner:    new WaveSpawnerSystem(),
      hud:            new HUDSystem(),
    },
    onEnter(engine) {
      // ← RESET per-run state here
      engine.world.state = {}
      engine.world.width = WORLD_W
      engine.world.height = WORLD_H
      engine.physics.registerLayer('player')
      engine.physics.registerLayer('enemy')
      // ... spawn player, start camera follow, etc.
    },
    onExit(engine) {
      // ← CLEAN UP everything onEnter and the systems set up
      engine.world.clear()
      engine.physics.clear()
      engine.renderer.particles.clear()
      if (onDied) { engine.events.off('entity:died', onDied); onDied = null }
      if (drawHud) { engine.renderer.removeOnDraw(drawHud); drawHud = null }
    },
  }
}
```

---

## The cleanup contract (gotchas.md #2)

Everything `onEnter` and system `init` methods set up must be torn down in `onExit` and system `destroy` methods.

**What leaks if you don't clean up:**

- `engine.events.on(...)` → listener fires in a scene it was never registered for
- `engine.renderer.onDraw(...)` → HUD from a dead scene overlays the next scene
- `engine.renderer.onWorldDraw(...)` → same problem in world-space
- `engine.camera.follow(entity)` → camera follows a dead entity (which may be at x=0,y=0 or removed)
- `engine.physics.registerLayer(...)` → layers accumulate but cannot be removed mid-run; they reset only through `physics.clear()`

The engine passes itself to `destroy(engine)` precisely so you can call `off`, `removeOnDraw`, and `clear`.

**Pattern for event handler refs:**

```ts
// In the system class:
private onEnemyKilled: EventHandler | null = null

init(engine) {
  this.onEnemyKilled = (data) => this.handleKill(data)
  engine.events.on('entity:died', this.onEnemyKilled)
}

destroy(engine) {
  if (this.onEnemyKilled) {
    engine.events.off('entity:died', this.onEnemyKilled)
    this.onEnemyKilled = null
  }
}
```

---

## `world.state` reset (gotchas.md #1)

`engine.world.time` is cumulative engine uptime. It does NOT reset between runs. If your wave logic says "start boss at 180 seconds," it will fire on the first run that starts 180 seconds after page load, not 180 seconds into the current run.

**Fix:** Reset `engine.world.state = {}` in `onEnter` and track run-scoped time in a system:

```ts
// In a RunTimer system:
init(engine) {
  engine.world.state.runTime = 0
}
update(engine, dt) {
  if (!engine.world.paused) {
    engine.world.state.runTime = ((engine.world.state.runTime as number) ?? 0) + dt
  }
}
```

Then wave schedules check `engine.world.state.runTime`, not `engine.world.time`.

---

## Three-scene pattern

Every ForgePlay game follows this structure:

**TitleScene** — renders title + controls hint via `onWorldDraw` or `onDraw`; has an input system that listens for SPACE (or start button) and emits `game:start`.

**GameplayScene** — the core loop. `onEnter` resets `world.state`, sets world bounds, spawns the player, registers physics layers, starts camera follow. `onExit` calls `world.clear()`, `physics.clear()`, `particles.clear()`.

**GameOverScene** — displays stats and final score; listens for input to emit `game:restart` or `game:quit`. Transition via `replace` from `GameplayScene`'s logic, typically triggered by listening for `entity:died` on the player entity.

Wire the event-based transitions in `GameManifest.wire()`:

```ts
wire(engine) {
  engine.events.on('game:start',   () => engine.scenes.replace(createGameplayScene(), { transition: 'fade', duration: 0.3 }))
  engine.events.on('game:over',    () => engine.scenes.replace(createGameOverScene()))
  engine.events.on('game:restart', () => engine.scenes.replace(createGameplayScene()))
  engine.events.on('game:quit',    () => engine.scenes.replace(createTitleScene()))
}
```

---

## Pause menu pattern

A pause menu is a pushed scene, not a replaced one, because the gameplay scene stays alive underneath:

```ts
// In the gameplay input system:
if (engine.input.isPressed('Escape')) {
  engine.pause()
  engine.scenes.push(createPauseMenuScene())
}

// In the pause menu's "Resume" handler:
engine.scenes.pop()
engine.resume()
```

The pause menu's systems run (UI), but `engine.world.paused = true` means gameplay systems see `dt = 0`, physics is skipped, and particles are frozen (gotchas.md #4).
