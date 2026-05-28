# Events

The `EventBus` (`src/engine/core/EventBus.ts`) is ForgePlay's pub/sub backbone. It routes all inter-system communication — collisions, deaths, level transitions, UI triggers, input signals. Understanding its delivery model is the single most important thing you can know about the bus; getting it wrong causes subtle ordering bugs that are hard to reproduce. Tests: `EventBus.test.ts`.

Adjacent file: `gotchas.md` #3 is entirely about the deferred delivery model described below.

---

## How delivery works

`emit` is **deferred** — it queues, it does not deliver.

```
Frame N:
  → logic tick runs (systems, components, behaviors)
  → systems call engine.events.emit('enemy:killed', { id: 42 })
  → events go into a queue — no handler runs yet
  → engine calls events.flush()
  → all queued events are dispatched to listeners NOW, in queue order
  → render happens
```

`flush()` is called by `GameLoop` after all systems run, automatically, once per frame. You never call `flush` yourself.

**Consequence:** a listener for `enemy:killed` runs after every system has updated this frame. It runs in the same frame the emit happened, but after the tick is complete. If the listener itself calls `emit`, that new event is queued for the _next_ flush — not delivered before the current flush finishes.

```ts
// This is what happens:
system.update() { engine.events.emit('A') }    // queued
flush() starts:
  dispatch 'A' → handler runs → engine.events.emit('B')  // 'B' queued for NEXT flush
flush() ends
// 'B' is dispatched next frame
```

This means: don't assume order of events across systems within a single tick. If you need immediate synchronous behavior, call the function directly instead of routing through the bus.

**Observers** are the one synchronous escape hatch. An observer registered via `observe()` fires on every `emit()` call, _before_ the event is queued, synchronously. The `DebugInspector` uses observers to build its event ring buffer. Observers must not emit events themselves — there is no recursion guard.

---

## API

```ts
// Subscribe
engine.events.on('enemy:killed', handler)       // persistent
engine.events.once('game:over', handler)         // unsubscribes after first delivery
// Unsubscribe — use the exact same function reference
engine.events.off('enemy:killed', handler)

// Emit
engine.events.emit('enemy:killed', { id: 42, x: 100, y: 200 })
engine.events.emit('game:pause')    // no payload is fine

// Synchronous observer (rare — debug/profiler use)
const unsub = engine.events.observe((event, data) => { /* inspect every emit */ })
unsub()   // remove observer

// Bulk clear (called by engine.destroy() and scenes.clear())
engine.events.clear()   // removes all listeners and drains the queue
                        // observers survive clear() — inspector keeps watching across scenes
```

---

## Naming convention

Event names are `namespace:action` — two segments, separated by a colon.

```
namespace  — the subsystem or domain that owns the event
action     — past-tense verb describing what happened
```

```
entity:died       enemy:killed     player:levelup    game:over
game:start        game:restart     game:pause        game:resume
collision:start   collision:end
setting:changed   template:changed
status:applied    status:expired
shield:broke      shield:restored
track:started     track:ended      track:stopped
inventory:item-added  inventory:item-removed
quest:activated   quest:completed  quest:failed
reward:granted
magnet:collect
xp:collected
path:completed
gravitywell:consumed
entity:triggered
replay:completed
```

Custom events follow the same pattern: `powerup:collected`, `boss:phase-changed`, `wave:started`, `wave:ended`.

Do not use bare names like `'killed'` or `'hit'` — collisions between event names from different systems are inevitable without namespacing.

---

## Unsubscribe hygiene

The most common event-related bug is a listener that outlives its context (scene, system, UI element) and fires where it shouldn't.

**Rule:** every `events.on` must have a matching `events.off` in the system's `destroy` method (or the scene's `onExit`). Store the handler reference to make this possible:

```ts
class EnemySpawnSystem implements GameSystem {
  private onWaveStart: EventHandler | null = null

  init(engine) {
    this.onWaveStart = (data) => this.spawnWave(data as WaveData)
    engine.events.on('wave:started', this.onWaveStart)
  }

  update(engine, dt) { /* ... */ }

  destroy(engine) {
    if (this.onWaveStart) {
      engine.events.off('wave:started', this.onWaveStart)
      this.onWaveStart = null
    }
  }
}
```

**`events.once` is automatically safe** — the wrapper unsubscribes itself after the first delivery. Use `once` for one-shot transitions:

```ts
engine.events.once('game:over', () => {
  engine.scenes.replace(createGameOverScene())
})
```

But even `once` can leak if the event never fires (e.g. the game is destroyed before `game:over` is emitted). For long-lived once-per-scene subscriptions, use `on` + `off` in `destroy` instead.

---

## Payload typing

Payloads are `unknown` at the bus boundary. Narrow with a cast or a type guard:

```ts
// Simple cast (fine when you control both ends):
engine.events.on('enemy:killed', (data) => {
  const { id, x, y } = data as { id: number; x: number; y: number }
  engine.fx.burst(x, y, 'death-burst')
})

// Or define a typed helper:
type EnemyKilledPayload = { id: number; x: number; y: number }
engine.events.on('enemy:killed', (data) => {
  const p = data as EnemyKilledPayload
  score += 10
  spawnXpGem(p.x, p.y)
})
```

Document your custom events in `engine.docs.register('namespace:action', { description, payload })` so `engine.docs.lookup` finds them.

---

## Deferred delivery patterns

**Do:** use events for cross-system communication that doesn't need to execute before the current tick ends.

```ts
// Combat system detects a kill:
engine.events.emit('enemy:killed', { id: entity.id, x: entity.x, y: entity.y })
// Score system and XP system both hear it next flush — no ordering dependency
```

**Don't:** emit and then immediately read side effects in the same tick:

```ts
// WRONG — you won't see the effect until next frame
engine.events.emit('player:died')
if (engine.world.state.isDead) { ... }  // ← state hasn't been set yet
```

**Do:** call the state mutation directly if you need it synchronously:

```ts
engine.world.state.isDead = true
engine.events.emit('player:died')   // notification for other systems
```

---

## Observers for debug / profiling

Observers are synchronous and fire on every `emit`. Use them for observability, not for gameplay logic:

```ts
// Debug: log all game events
const unsub = engine.events.observe((event, data) => {
  if (event.startsWith('game:')) console.log('[event]', event, data)
})

// Profiler: count events per frame
let frameEventCount = 0
engine.events.observe(() => frameEventCount++)
// ... reset frameEventCount in each frame ...
```

Observers survive `events.clear()` (scenes can clear without losing the debug inspector observer).
