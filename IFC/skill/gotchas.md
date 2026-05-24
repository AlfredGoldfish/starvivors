# Gotchas

Twelve ways the engine has bitten previous sessions. Each entry has the symptom, the cause, and the fix.

When you hit a symptom, scan the symptom column first — most of these reappear in disguise.

## 1. `world.time` vs `state.runTime`

**Symptom:** Win/lose condition fires on a fresh run. Wave escalation kicks in on frame one. Game feels fine for the first session but buggy after a long dev session.

**Cause:** `engine.world.time` is cumulative engine uptime across all scenes — it does NOT reset when you replace a scene. Using it for run-scoped checks (timers, wave schedules) means the >15 min total play corrupts the next run.

**Fix:** For per-run timing, use a `RunTimer` system that tracks `world.state.runTime`, and reset `world.state = {}` in `GameplayScene.onEnter`. Session 7 bug.

## 2. `destroy(engine)` must clean up everything `init` did

**Symptom:** Title-screen text stays visible during gameplay. Old event handlers fire in a new scene. Memory grows across scene transitions.

**Cause:** Every `onDraw`, `onWorldDraw`, and `events.on` registration set up in `init()` leaks unless `destroy()` removes it.

**Fix:** The engine passes itself to `destroy` for exactly this purpose. Store handler references in `init` and pass them to `off` / `removeOnDraw` / `removeOnWorldDraw` in `destroy`. Session 2 bug.

## 3. Events are deferred — `emit` doesn't deliver immediately

**Symptom:** A listener seems to receive an event "late," or the order of two emits from within a handler doesn't match what you expect.

**Cause:** `events.emit` queues. Delivery happens once per frame via `events.flush()`, called by the Engine after systems run. An event handler that emits another event queues it for the NEXT flush, not the current one.

**Fix:** Don't assume a handler runs before `emit` returns. If you need synchronous dispatch, call the function directly instead of going through the bus.

## 4. Pause behavior is specific — understand what freezes and what doesn't

**Symptom:** "Pause menu doesn't appear" / "enemies still move when paused" / "input doesn't work when paused."

**Cause:** When `engine.world.paused = true`, the engine: does not increment `world.time` / `elapsedTime`, sets `world.dt = 0`, skips `physics.step()` and `particles.update()`, still runs systems, still polls input, still draws.

**Fix:** UI systems (pause menus, upgrade cards) continue to run because systems themselves aren't halted — they just see `dt = 0`. Gameplay systems that should halt need to check the flag (or be priority-ordered so that a zero `dt` is a no-op). Don't try to gate pause via a missing frame.

## 5. Priority ordering — higher runs later, within the same frame

**Symptom:** `PlayerMovement` reads `player.aimAngle` but always sees last frame's value.

**Cause:** If system A reads a property system B writes, A's priority must be ≥ B's (higher = later). `PlayerShooting` writes `aimAngle` at priority 8; `PlayerMovement` reads it at priority 10. Get the numbers wrong and you're always one frame behind.

**Fix:** Order producers before consumers. If you need to change priority at runtime, see gotcha #12 — mutating `system.priority` in place does not re-sort.

## 6. Physics narrow-phase is AABB only

**Symptom:** Circle-on-circle collision fires at the corners of the bounding box, not on circumference.

**Cause:** Physics treats every shape as its axis-aligned bounding box. Circles, triangles, diamonds all use their `width`/`height` as AABB.

**Fix:** For circular hit detection, check distance manually in the collision handler (`dx*dx + dy*dy < r*r`). Don't try to teach the physics solver about radii.

## 7. Entity culling — renderer skips off-screen entities (+ 64 px margin)

**Symptom:** "Why isn't this entity drawing? Its position looks fine in the inspector."

**Cause:** The renderer skips entities outside the camera viewport plus a 64 px margin. Position can be right while viewport is wrong, or while the camera is on a different target.

**Fix:** Check the entity's position against `engine.camera.getViewport()`. If the entity needs to render regardless (HUD-attached world marker), pin it to the camera or draw via `onDraw` (screen-space) instead of `onWorldDraw` (world-space).

## 8. `String.replace` corrupts `$` in minified JS

**Symptom:** Exported bundle runs fine in dev but explodes in the exported HTML with `Unexpected token` or mangled identifiers.

**Cause:** `'template'.replace('{{BUNDLE}}', minifiedJs)` treats `$` sequences in the replacement string (`$&`, `$1`, `$$`) as special. Minifiers produce plenty of `$`.

**Fix:** Use the **function form** of replace: `template.replace('{{BUNDLE}}', () => bundleJs)`. Always. Session 5 bug.

## 9. Key codes use `KeyboardEvent.code`, not character

**Symptom:** `input.isDown('a')` never returns true. Arrow keys "don't work."

**Cause:** The input system uses `KeyboardEvent.code` values — `KeyA`, `Digit1`, `ArrowLeft`, `Space`, `Escape`, `Backquote`, `F3`. Not `'a'` or `'1'`.

**Fix:** Use the code form for keys. Mouse buttons: `Mouse0` (left), `Mouse1` (middle), `Mouse2` (right).

## 10. Max 16 physics layers

**Symptom:** `registerLayer` throws at some inconvenient seventeenth call.

**Cause:** Layers use a 16-bit mask internally.

**Fix:** Plan the layer list up front. Collapse close-kin layers (`'enemy-melee'` + `'enemy-ranged'` → `'enemy'`, distinguished by tag).

## 11. Particle pool is 500 — bursts recycle oldest

**Symptom:** Earlier explosions disappear mid-animation during heavy combat.

**Cause:** Global pool of 500 particles. `fx.burst(x, y, 50, ...)` consumes 50. When the pool is full, oldest active particles are recycled — they don't "overflow" gracefully, they just vanish from where they were.

**Fix:** Tune burst counts for heavy combat. If you need more headroom for a specific scene, reduce per-burst counts rather than chasing a bigger pool.

## 12. Priority changes at runtime require remove + re-add

**Symptom:** You set `system.priority = 5` mid-run and the execution order doesn't change.

**Cause:** `addSystem(name, system)` sorts by priority **at insertion time**. Mutating `.priority` after insertion doesn't re-sort the list.

**Fix:** `engine.removeSystem(name)`, update `priority`, `engine.addSystem(name, system)`. Or better — pick the priority at insertion and leave it alone.
