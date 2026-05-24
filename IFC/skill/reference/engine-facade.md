# Engine Facade

One `Engine` instance exposes exactly 49 readonly subsystems. You never `new` a subsystem directly — you reach everything through `engine.<name>`. This file is the catalog: what each subsystem is for, its most-used API calls, and where its source lives. Source of truth is `src/engine/Engine.ts`; the field declarations are the canonical list.

Subsystems are grouped by role below. For adding a new subsystem, see `adding-a-subsystem.md`. For the tick order they run in, see `principles.md` §4.

---

## Core Runtime

These five are the heartbeat of every running game.

### `engine.world` — `World` (`src/engine/core/World.ts`)

Entity storage and query engine. Every entity is a plain object with `id`, `tags`, `x`, `y`, `width`, `height`, and whatever properties your game adds. Tests: `World.test.ts`, `World.wrap.test.ts`, `World.hierarchy.test.ts`.

```ts
engine.world.spawn({ tags: ['player'], x: 400, y: 300, width: 20, height: 20, color: '#4af', shape: 'circle' })
engine.world.get(id)              // → Entity | undefined
engine.world.all()                // → Entity[]
engine.world.query({ tag: 'enemy' })
engine.world.query({ tag: 'enemy', near: { x, y, radius: 200 } })
engine.world.remove(id)
engine.world.clear()              // removes all entities
engine.world.state                // per-run scratch object; reset in onEnter
engine.world.time                 // cumulative unpaused seconds — NOT per-run (gotchas.md #1)
engine.world.paused               // boolean; set by engine.pause() / engine.resume()
engine.world.width / .height      // world dimensions (default 800×600)
engine.world.wrap                 // { width, height } | null — wrap-around mode
engine.world.spawnPrefab(name, x, y, overrides?)  // delegates to engine.prefabs
```

`world.state` is the right place for run-scoped variables (score, wave counter). Reset it to `{}` in each `GameplayScene.onEnter` to avoid bleed-through (gotchas.md #1).

### `engine.events` — `EventBus` (`src/engine/core/EventBus.ts`)

Deferred pub/sub. Events are queued on `emit` and delivered once per frame when `GameLoop` calls `events.flush()`. See `events.md` for the full model. Tests: `EventBus.test.ts`.

```ts
engine.events.on('enemy:killed', (data) => { ... })
engine.events.off('enemy:killed', handler)
engine.events.once('game:over', handler)
engine.events.emit('player:died', { id: playerId })
engine.events.observe((event, data) => { ... })   // synchronous pre-delivery observer
engine.events.flush()    // called automatically by GameLoop — don't call manually
engine.events.clear()    // removes all listeners and queued events
```

### `engine.scenes` — `SceneManager` (`src/engine/core/SceneManager.ts`)

Scene stack — push/replace/pop with lifecycle hooks. See `scenes.md` for the full model. Tests: `SceneManager.test.ts`.

```ts
engine.scenes.push(scene)
engine.scenes.replace(scene, { transition: 'fade', duration: 0.3 })
engine.scenes.pop()
engine.scenes.current()   // → Scene | undefined
engine.scenes.clear()     // calls onExit on all scenes; used by engine.destroy()
```

### `engine.tween` — `TweenManager` (`src/engine/core/TweenManager.ts`)

Property animation. Creates `Tween` builders; updated automatically from the logic tick. Frozen during pause. Tests: `Tween.test.ts`.

```ts
engine.tween.create(entity)
  .to({ x: 500, y: 300 }, 1.0)
  .easing('easeInOutQuad')
  .onComplete(() => engine.events.emit('tween:done'))
  .start()
engine.tween.clear()   // stops and removes all tweens
```

### `engine.timer` — `Timer` (`src/engine/core/Timer.ts`)

Delayed and repeating callbacks. Updated from logic tick; respects pause and `timeScale`. Tests: `Timer.test.ts`.

```ts
const id = engine.timer.after(2.0, () => spawnBoss())
const rid = engine.timer.repeat(1.0, () => spawnEnemy())
engine.timer.cancel(id)
engine.timer.clear()
```

---

## Entity System

### `engine.components` — `ComponentRegistry` (`src/engine/core/ComponentRegistry.ts`)

Named bundles of schema defaults + per-frame update functions. All 36 built-in components auto-register at Engine construction. See `components.md` for the full catalog. Tests: `ComponentRegistry.test.ts`.

```ts
engine.components.register('MyComponent', { schema: { speed: { type: 'number', default: 100 } }, update(e, eng, dt) { ... } })
engine.components.get('Health')         // → ComponentDefinition | undefined
engine.components.list()                // → ComponentListEntry[]
engine.components.runUpdates(entities, engine, dt)   // called by Engine.logicTick
```

Attach to entity via `components: ['Health', 'ChaseAI']` in the spawn props.

### `engine.prefabs` — `PrefabRegistry` (`src/engine/core/PrefabRegistry.ts`)

Named entity templates that can be spawned from data. Tests: `PrefabRegistry.test.ts`.

```ts
engine.prefabs.register('basicEnemy', {
  tags: ['enemy'], components: ['Health', 'ChaseAI'],
  properties: { hp: 40, maxHp: 40, chaseSpeed: 80, color: '#f44', shape: 'circle', width: 16, height: 16 },
  category: 'enemy', description: 'Basic chaser',
})
engine.prefabs.spawn(engine, 'basicEnemy', x, y, { hp: 60 })  // overrides optional
engine.prefabs.list()    // → PrefabListEntry[]
engine.world.spawnPrefab('basicEnemy', x, y)   // shorthand through World
```

### `engine.pool` — `PoolManager` (`src/engine/core/ObjectPool.ts`)

Entity recycling — avoids constant alloc/dealloc for bullets and particles. Tests: `ObjectPool.test.ts`.

```ts
engine.pool.create('bullet', () => engine.world.spawn({ tags: ['projectile'], ... }), 50)
const bullet = engine.pool.acquire('bullet')   // reuses or spawns
engine.pool.release(bullet)                    // returns to pool (does NOT remove from world)
engine.pool.clear()
```

Lifetime component and Magnet component are pool-aware: they call `engine.pool.release` instead of `engine.world.remove` when `entity._pool` is set.

### `engine.random` — `Random` (`src/engine/core/Random.ts`)

Convenience helpers + seeded RNG. Tests: `Random.test.ts`.

```ts
engine.random.float()                // 0..1
engine.random.range(min, max)        // float in [min, max)
engine.random.int(min, max)          // integer in [min, max]
engine.random.pick(['a', 'b', 'c'])  // random element
engine.random.shuffle(arr)           // in-place Fisher-Yates
engine.random.chance(0.3)            // true 30% of the time

// Deterministic (for replays / tests):
const seeded = engine.random.seeded(42)
seeded.float()
seeded.range(0, 100)
```

---

## Rendering

### `engine.renderer` — `Renderer` (`src/engine/rendering/Renderer.ts`)

Canvas2D draw loop. Manages screen-space and world-space draw callbacks, entity culling, particle overlay, and transitions. The renderer draws entities tagged with standard visual properties (`shape`, `color`, `width`, `height`, `rotation`, `alpha`, `_material`, `composition`).

```ts
engine.renderer.backgroundColor = '#1a1a2e'
const removeWorld = engine.renderer.onWorldDraw((ctx) => { /* world-space draw */ })
const removeScreen = engine.renderer.onDraw((ctx) => { /* screen-space HUD draw */ })
removeWorld()   // call the returned function to unregister
removeScreen()
engine.renderer.particles   // → ParticleSystem (internal; use engine.fx for authored FX)
engine.renderer.transitions // → TransitionManager (used by SceneManager)
```

Always remove `onDraw` and `onWorldDraw` callbacks in `destroy()` — see gotchas.md #2.

### `engine.camera` — `Camera` (`src/engine/rendering/Camera.ts`)

Viewport management: follow, bounds, zoom, shake, rotation. Alias for `engine.renderer.camera`.

```ts
engine.camera.follow(playerEntity, 0.1)   // lerp speed 0..1
engine.camera.setPosition(x, y)
engine.camera.setBounds(x, y, width, height)
engine.camera.clearBounds()
engine.camera.shake(intensity, duration)
engine.camera.zoom = 1.5
engine.camera.getViewport()               // → { x, y, w, h } in world coords
engine.camera.worldToScreen(x, y)
engine.camera.screenToWorld(x, y)
```

Entity culling uses `camera.getViewport()` + 64 px margin — see gotchas.md #7.

### `engine.shapes` — `ShapeRegistry` (`src/engine/rendering/ShapeRegistry.ts`)

Named multi-part shape compositions. An entity with `composition: 'myShip'` is drawn as the registered composition instead of a single primitive.

```ts
engine.shapes.register('myShip', [
  { shape: 'triangle', color: '#4af', width: 24, height: 30, offsetX: 0, offsetY: 0 },
  { shape: 'circle',   color: '#ff0', width: 8,  height: 8,  offsetX: 12, offsetY: 0 },
])
engine.shapes.get('myShip')   // → Composition | undefined
engine.shapes.list()
engine.shapes.clear()
engine.shapes.serialize() / .deserialize()  // round-trips through engine.save()
```

### `engine.materials` — `MaterialStyleRegistry` (`src/engine/rendering/MaterialStyle.ts`)

Per-entity rendering styles: glow, outline, shadow, tint. Assign `entity._material = 'styleName'`.

```ts
engine.materials.register('shieldGlow', { glow: { color: '#4af', radius: 12, intensity: 0.8 } })
engine.materials.register('enemyOutline', { outline: { color: '#f00', width: 2 } })
engine.materials.serialize() / .deserialize()
```

### `engine.lighting` — `LightingSystem` (`src/engine/rendering/LightingSystem.ts`)

2D point-light system using an offscreen light map composited each frame. Applied after the main render call (not part of `Renderer.draw`).

```ts
engine.lighting.setAmbient({ color: '#1a1a2e', intensity: 0.3 })
engine.lighting.addLight({ id: 'torch1', x: 400, y: 300, radius: 150, color: '#ff8c00', intensity: 0.9 })
engine.lighting.addLight({ id: 'player-lamp', followEntityId: playerId, radius: 100, color: '#fff', intensity: 0.6 })
engine.lighting.removeLight('torch1')
engine.lighting.setCompositeMode('multiply')  // 'multiply' | 'additive'
engine.lighting.clearLights()
```

### `engine.postProcess` — `PostProcessPipeline` (`src/engine/rendering/PostProcess.ts`)

Effect chain applied to the whole canvas after lighting. Built-ins: `vignette`, `scanlines`, `colorTint`, `brightness`. Games can add custom effects.

```ts
engine.postProcess.add('vignette', vignetteEffect, { intensity: 0.4 }, 10)
engine.postProcess.setEnabled('vignette', true)
engine.postProcess.setParam('vignette', 'intensity', 0.6)
engine.postProcess.register('myBlur', myBlurFn)
engine.postProcess.clear()
```

### `engine.textures` — `ProceduralTextureRegistry` (`src/engine/rendering/ProceduralTexture.ts`)

Math-based texture generation via offscreen canvas. Built-in generators: `noise`, `gradient`, `checker`, `stripe`, `brick`, `circle`.

```ts
engine.textures.register('starField', { type: 'noise', width: 512, height: 512, scale: 4, colors: ['#000', '#fff'] })
engine.textures.getCanvas('starField')   // → HTMLCanvasElement | null
engine.textures.serialize() / .deserialize()
```

### `engine.parallax` — `ParallaxLayerRegistry` (`src/engine/rendering/ParallaxLayer.ts`)

Multi-layer parallax backgrounds. One preset is active; layers scroll at different speeds relative to the camera.

```ts
engine.parallax.register('space-bg', [
  { scrollX: 0.05, scrollY: 0.05, color: '#0a0a1e', opacity: 1 },
  { scrollX: 0.2,  scrollY: 0.2,  color: '#1a1a3e', opacity: 0.5 },
])
engine.parallax.activate('space-bg')
engine.parallax.deactivate()
engine.parallax.setBlobLoader(...)   // wire up image blobs from ProjectStore
engine.parallax.serialize() / .deserialize()
```

### `engine.screen` — `Screen` (`src/engine/rendering/Screen.ts`)

Resolution and scale-mode management. CSS transforms the canvas to fit the window. InputManager queries `engine.screen` for the scale factor so mouse coords stay accurate.

```ts
engine.screen.setResolution(1280, 720)
engine.screen.setScaleMode('fitBest')   // 'fixed' | 'fitWidth' | 'fitHeight' | 'fitBest' | 'stretch'
engine.screen.setFullscreen(true)
engine.screen.onResize((w, h) => { ... })
```

### `engine.cursor` — `Cursor` (`src/engine/rendering/Cursor.ts`)

Thin API over the canvas's `style.cursor`. Provides consistent cursor changes without direct DOM access.

```ts
engine.cursor.set('crosshair')
engine.cursor.set('pointer')
engine.cursor.set('default')   // resets
```

### `engine.debug` — `DebugOverlay` (`src/engine/rendering/DebugOverlay.ts`)

Toggleable FPS/stats overlay. Press `` ` `` or `F3` to show/hide. No direct API needed for games — the overlay reads from engine internals automatically.

### `engine.inspector` — `DebugInspector` (`src/engine/debug/DebugInspector.ts`)

Structured debug queries — the AI-facing side of the debug layer.

```ts
engine.inspector.recentEvents(20, { event: 'collision' })
engine.inspector.entityReport(entityId)
engine.inspector.describe('Health')
engine.inspector.snapshot()
engine.inspector.enableProfiling(true)    // wraps each system in a perf timer
```

---

## Physics

### `engine.physics` — `Physics` (`src/engine/physics/Physics.ts`)

AABB collision detection + response with layers and sensors. Narrow phase is AABB only — no circle/polygon collision (gotchas.md #6).

```ts
engine.physics.registerLayer('player')
engine.physics.registerLayer('enemy')
engine.physics.setLayer(entity, 'player')
engine.physics.setMask(entity, ['enemy', 'wall'])   // what it collides with
engine.physics.setSensor(entity, true)               // detects but doesn't push
engine.physics.onCollision('player', 'enemy', (a, b) => { ... })
engine.physics.raycast(x, y, dx, dy, maxDist, layerName)   // → RaycastHit | null
engine.physics.query(x, y, radius, layerName)               // → Entity[]
engine.physics.clear()  // removes all pairs and layers
```

Max 16 layers (gotchas.md #10).

### `engine.forces` — `ForceSystem` (`src/engine/physics/ForceSystem.ts`)

Force accumulation, gravity, and velocity damping. Applied before `Physics.step()` each tick. Entities opt in by having a `mass` property.

```ts
engine.forces.setGravity(0, 400)      // px/s² (y-down is positive)
engine.forces.applyForce(entity, fx, fy)           // transient (one tick)
engine.forces.addPersistentForce(entity, 'thrust', fx, fy)
engine.forces.removePersistentForce(entity, 'thrust')
engine.forces.setDamping(entity, 0.95)
engine.forces.serialize() / .deserialize()
```

---

## Audio

### `engine.audio` — `AudioManager` (`src/engine/audio/AudioManager.ts`)

Procedural sound effects via Web Audio oscillators. Every game has working SFX with zero assets — just frequency + duration definitions.

```ts
engine.audio.registerSfx('blast', { type: 'sawtooth', frequency: 120, duration: 0.2, sweep: -60, noise: true })
engine.audio.playSfx('blast')
engine.audio.playSfx('hit')           // built-in: hit, explosion, pickup, jump, laser, powerup, death
engine.audio.setVolume(0.6)
engine.audio.list()                   // → SfxListEntry[]
engine.audio.serialize() / .deserialize()
```

### `engine.music` — `MusicManager` (`src/engine/audio/MusicManager.ts`)

File-based background music registry. Binary-asset pattern: blob lives in `ProjectStore.assets` (category `'music'`); `MusicTrackDef` carries only a `blobId`. Crossfade via GainNode ramps.

```ts
engine.music.register('boss-theme', { blobId: 'abc123', filename: 'boss.mp3', mimeType: 'audio/mpeg' }, blob)
engine.music.play('boss-theme', { loop: true, volume: 0.8 })
engine.music.crossfade('boss-theme', 'explore-theme', { duration: 2.0 })
engine.music.stop('boss-theme')
engine.music.stopAll()
engine.music.setBlobLoader(async (id) => (await ProjectStore.getAsset(id))?.content as Blob | null)
engine.music.serialize() / .deserialize()   // defs only — blobs live in ProjectStore
```

---

## Input

### `engine.input` — `InputManager` (`src/engine/input/InputManager.ts`)

Keyboard + mouse input with named action mapping. Uses `KeyboardEvent.code` — not character keys (gotchas.md #9).

```ts
engine.input.mapAction('fire1', ['Mouse0', 'Space'])
engine.input.isDown('fire1')         // held this frame
engine.input.isPressed('fire1')      // just pressed
engine.input.isReleased('fire1')     // just released
engine.input.mousePosition()         // → { x, y } in screen coords
engine.input.mouseWorldPosition(camera)  // → { x, y } in world coords
engine.input.mouseClicked()          // true on the frame of click
engine.input.wheelDelta()            // -1 | 0 | +1 this frame
engine.input.injectAction(name, frames)  // programmatic input (for tests / replay)
```

Key codes: `KeyA`–`KeyZ`, `Digit0`–`Digit9`, `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Space`, `Escape`, `Enter`, `Backquote`, `F1`–`F12`. Mouse: `Mouse0` (left), `Mouse1` (middle), `Mouse2` (right).

### `engine.rebind` — `InputRebindManager` (`src/engine/input/InputRebindManager.ts`)

Runtime action-to-key remapping with localStorage persistence and capture mode.

```ts
engine.rebind.registerDefaults({ fire1: ['Mouse0'], move_up: ['KeyW', 'ArrowUp'] })
engine.rebind.loadFromStorage()
engine.rebind.startCapture('fire1', (key) => { console.log('Rebound to', key) })
engine.rebind.cancelCapture()
engine.rebind.listBindings()   // → BindingEntry[]
engine.rebind.resetToDefaults()
```

---

## Scene & Content Authoring

### `engine.templates` — `TemplateRegistry` (`src/engine/templates/TemplateRegistry.ts`)

Named visual identity presets (palette, typography, UI tokens, FX intensities). `apply('name')` emits `template:changed` so systems can refresh.

```ts
engine.templates.register('starvivors_arcade', { palette: { primary: '#4af', accent: '#ff0', ... }, ... })
engine.templates.apply('starvivors_arcade')
engine.templates.color('accent')    // → '#ff0'
engine.templates.font('ui')         // → '14px monospace'
engine.templates.serialize() / .deserialize()
```

### `engine.fx` — `FxRegistry` (`src/engine/fx/FxRegistry.ts`)

Named particle presets, shake profiles, and hit-flash recipes. The particle pool is 500 — tune burst counts for heavy combat (gotchas.md #11).

```ts
engine.fx.registerParticle('explosion', { count: 20, speed: 120, lifetime: 0.6, color: '#f80' })
engine.fx.registerShake('big-hit', { intensity: 8, duration: 0.3, decay: 'easeOutCubic' })
engine.fx.registerFlash('hit-flash', { color: '#fff', duration: 0.08, particleBurst: 'hit-spark' })
engine.fx.burst(x, y, 'explosion')
engine.fx.shake('big-hit')
engine.fx.flash(entity, 'hit-flash')
engine.fx.emitter(entity, 'thruster-trail', 0.05)  // → emitter id
engine.fx.stopEmitter(id)
engine.fx.serialize() / .deserialize()
```

### `engine.animations` — `AnimationRegistry` (`src/engine/animation/AnimationRegistry.ts`)

Frame-timeline animations that swap entity visual properties over time.

```ts
engine.animations.register('walk', [
  { duration: 0.1, composition: 'playerWalkA' },
  { duration: 0.1, composition: 'playerWalkB' },
])
engine.animations.play(entity, 'walk', true)   // third arg = loop
engine.animations.stop(entity)
engine.animations.serialize() / .deserialize()
```

### `engine.screens` — `ScreenRegistry` (`src/engine/screens/ScreenRegistry.ts`)

Named bundles of UI elements. A Screen is authored JSON — it activates/deactivates as a unit and round-trips through `engine.save()`.

```ts
engine.screens.register('hud', { elements: [...] })
engine.screens.activate('hud')
engine.screens.deactivate('hud')
engine.screens.serialize() / .deserialize()
```

### `engine.ui` — `UIManager` (`src/engine/ui/UIManager.ts`)

Screen-space declarative UI elements drawn after the world layer. Dynamic values can be functions evaluated each frame.

```ts
engine.ui.addText({ id: 'score', text: () => `Score: ${score}`, x: 16, y: 16, color: '#fff', font: '16px monospace' })
engine.ui.addBar({ id: 'hp', x: 16, y: 40, width: 120, height: 12, value: () => hp / maxHp, fillColor: '#4f4' })
engine.ui.addButton({ id: 'restart', label: 'Restart', x: 300, y: 400, onClick: () => engine.events.emit('game:restart') })
engine.ui.remove('score')
engine.ui.clear()
```

---

## Tilemap & Navigation

### `engine.tilemap` — `TilemapRegistry` (`src/engine/tilemap/TilemapRegistry.ts`)

Grid-based tile data + rendering. Frustum-culled tile drawing; pathfinder reads walkability.

```ts
engine.tilemap.registerTileType(1, { id: 1, name: 'wall', color: '#666', walkable: false })
engine.tilemap.registerTileType(2, { id: 2, name: 'floor', color: '#333', walkable: true })
engine.tilemap.register('level1', { width: 20, height: 15, tileSize: 32, tiles: [...] })
engine.tilemap.draw(ctx, 'level1', camera)
engine.tilemap.isWalkable('level1', gx, gy)
engine.tilemap.setTile('level1', gx, gy, tileId)
engine.tilemap.serialize() / .deserialize()
```

### `engine.pathfinder` — `Pathfinder` (`src/engine/tilemap/Pathfinder.ts`)

A* pathfinding over a registered tilemap. Used by the `GridFollower` component.

```ts
const path = engine.pathfinder.findPath('level1', fromX, fromY, toX, toY)
// → { waypoints: Point[] } | null
```

---

## Narrative & Game Systems

### `engine.dialog` — `DialogTreeRegistry` (`src/engine/dialog/DialogTree.ts`)

Branching dialogue — nodes with speaker text and choices. **Currently lacks `serialize`** — Asset Browser tab is view-only until fixed (see `BRAIN.md` Sticky Warnings).

```ts
engine.dialog.register('npc-intro', { nodes: { start: { text: 'Hello traveler!', choices: [...] } }, startNode: 'start' })
engine.dialog.start('npc-intro')
engine.dialog.choose(0)
engine.dialog.current()   // → { text, choices, speaker? }
engine.dialog.end()
```

### `engine.behaviors` — `BehaviorGraphRegistry` (`src/engine/behavior/BehaviorGraph.ts`)

State-machine registry for entity AI. Attach a graph to an entity; `tickAll()` runs transitions and `onTick` callbacks. **Currently lacks `serialize`** — same issue as `dialog`.

```ts
engine.behaviors.register('enemy-ai', {
  states: {
    idle:    { transitions: [{ to: 'chase', condition: (e, eng) => seesPlayer(e, eng) }] },
    chase:   { onTick: (e, eng, dt) => moveToward(e, eng, dt), transitions: [...] },
  },
  initialState: 'idle',
})
engine.behaviors.attach(entity, 'enemy-ai')
engine.behaviors.tickAll(dt)   // called by Engine.logicTick
```

### `engine.sequencer` — `SequencerRegistry` (`src/engine/sequencer/Sequencer.ts`)

Timed event sequences (cutscenes, boss patterns). **Currently lacks `serialize`**.

```ts
engine.sequencer.register('boss-intro', {
  keyframes: [
    { time: 0.0, action: () => engine.camera.shake(6, 0.5) },
    { time: 1.5, action: () => spawnBoss() },
    { time: 3.0, action: () => engine.events.emit('boss:engaged') },
  ],
})
engine.sequencer.play('boss-intro')
engine.sequencer.stop('boss-intro')
```

### `engine.quests` — `QuestSystem` (`src/engine/quest/QuestSystem.ts`)

Objectives, tracking, completion, and optional rewards.

```ts
engine.quests.register('kill-10-enemies', {
  name: 'Pest Control', description: 'Kill 10 enemies',
  objectives: [{ id: 'kills', label: 'Enemies killed', target: 10 }],
  onComplete: (engine) => engine.events.emit('reward:granted', { xp: 500 }),
})
engine.quests.activate('kill-10-enemies')
engine.quests.advance('kill-10-enemies', 'kills', 1)
engine.quests.getState('kill-10-enemies')  // → { status, objectives: [...] }
engine.quests.serialize() / .deserialize()
```

### `engine.inventory` — `InventorySystem` (`src/engine/inventory/InventorySystem.ts`)

Three-layer: item registry → slot-shape templates → runtime instances. Binary-asset pattern for item icons (`iconBlobId`). Established in S61.

```ts
engine.inventory.registerItem('sword', { name: 'Iron Sword', tags: ['weapon'], stats: { damage: 15 }, iconBlobId: 'blob123' })
engine.inventory.registerTemplate('rpg-equipment', { slots: [{ id: 'weapon', accepts: ['weapon'] }, { id: 'armor', accepts: ['armor'] }] })
const inv = engine.inventory.createInstance('rpg-equipment')
engine.inventory.addItem(inv, 'sword')
engine.inventory.getSlotContents(inv, 'weapon')
engine.inventory.serialize() / .deserialize()
```

---

## Paths & Persistence

### `engine.paths` — `PathRegistry` (`src/engine/core/PathRegistry.ts`)

Named reusable waypoint paths. The `PathFollower` component looks up paths by name. Tests: `PathRegistry.test.ts`.

```ts
engine.paths.register('patrol-route', [{ x: 100, y: 100 }, { x: 400, y: 100 }, { x: 400, y: 400 }])
engine.paths.get('patrol-route')   // → Path | undefined
engine.paths.list()
engine.paths.clear()
```

### `engine.saveSlots` — `SaveSlotManager` (`src/engine/saves/SaveSlotManager.ts`)

Multiple named save slots with metadata, auto-save, and quicksave. Builds on `engine.save()` / `engine.load()`.

```ts
engine.saveSlots.save('slot1', { label: 'My Save', playtime: 3600 })
engine.saveSlots.load('slot1')     // → true if found
engine.saveSlots.delete('slot1')
engine.saveSlots.list()            // → SaveSlotMeta[]
engine.saveSlots.enableAutoSave('slot1', 60)  // save every 60 seconds
engine.saveSlots.quicksave()
engine.saveSlots.quickload()
```

---

## Dev & Tooling

### `engine.settings` — `SettingsRegistry` (`src/engine/settings/SettingsRegistry.ts`)

Player-facing preferences with localStorage persistence and `setting:changed` events.

```ts
engine.settings.register('volume.master', { default: 0.3, type: 'number', min: 0, max: 1, label: 'Master volume' })
engine.settings.get('volume.master')    // → 0.3
engine.settings.set('volume.master', 0.6)
engine.settings.list()
```

### `engine.macros` — `MacroRegistry` (`src/engine/macros/MacroRegistry.ts`)

Named, data-driven engine API sequences. Macros are JSON — they round-trip through `engine.save()` and persist across sessions.

```ts
engine.macros.register('setup-kill-fx', {
  steps: [
    { path: 'fx.registerParticle', args: ['death-burst', { count: 12, ... }] },
    { path: 'fx.registerShake',    args: ['kill-shake',  { intensity: 4, ... }] },
    { path: 'audio.registerSfx',   args: ['kill-sound',  { type: 'square', ... }] },
  ],
})
engine.macros.run('setup-kill-fx')
engine.macros.list()
engine.macros.serialize() / .deserialize()
```

### `engine.docs` — `DocsRegistry` (`src/engine/docs/DocsRegistry.ts`)

Queryable schema + description layer for the whole engine. Aggregates data from `components`, `prefabs`, `shapes`, `fx`, `audio`, `animations`, and `templates`. Use it to look up what fields a component or prefab expects.

```ts
engine.docs.lookup('Weapon')           // → DocEntry with schema, description, examples
engine.docs.lookup('explosion')        // → FX preset entry
engine.docs.search('health')           // → DocEntry[]
engine.docs.register('player:died', { description: '...', payload: '{ id: number }' })
engine.docs.all()                      // → all entries
```

### `engine.tests` — `TestRegistry` (`src/engine/tests/TestRegistry.ts`)

Scripted scenarios the AI runs to verify behavior without asking a human to playtest. Scenarios run in isolation (world snapshot + restore).

```ts
engine.tests.register('weapon-fires-on-hold', async (run) => {
  const player = run.spawn('viper', 100, 100)
  run.holdAction('fire1')
  run.advance(1.0)
  const bullets = run.query({ tag: 'projectile' })
  run.expectAtLeast('bullet count', bullets.length, 5)
})
await engine.tests.run('weapon-fires-on-hold')
await engine.tests.runAll()
```

### `engine.replay` — `ReplaySystem` (`src/engine/replay/ReplaySystem.ts`)

Deterministic input recording and playback. Records input state each tick; playback injects back through `InputManager`.

```ts
engine.replay.startRecording()
// ... play the game ...
const recording = engine.replay.stopRecording()
engine.replay.playback(recording)   // injects inputs frame-by-frame
engine.replay.clear()
```

### `engine.editor` — `Editor` (`src/engine/editor/Editor.ts`)

Engine-layer authoring state. Currently hosts the `commands` undo/redo history used by the GraphEditor and LevelEditor.

```ts
engine.editor.commands.execute(myCommand)
engine.editor.commands.undo()
engine.editor.commands.redo()
engine.editor.commands.clear()
engine.editor.clear()   // called by engine.destroy()
```

---

## Drift notes

- **`engine.canvas`** is the 49th field — a plain `HTMLCanvasElement`, not a subsystem. It's in the `readonly` list because game code sometimes needs the raw canvas for special draw calls.
- The legacy `SKILL.md` showed ~12 subsystems in its architecture diagram. The actual count is 49. The diagram is stale; `Engine.ts` is the canonical list.
- `behaviors`, `dialog`, and `sequencer` all lack `serialize` — their data doesn't persist through `engine.save()` yet. Tracked in `BRAIN.md` Sticky Warnings.
