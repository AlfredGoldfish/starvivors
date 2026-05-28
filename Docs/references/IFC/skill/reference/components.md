# Components

The engine ships 36 built-in components that auto-register at Engine construction. You do not need to import or register them — they are available on every `engine.components` instance. Source: `src/engine/components/` (one file per component + `index.ts`). The registration order and the export list are both in `index.ts`.

A component is a `ComponentDefinition`: a `schema` of named fields with types and defaults, an optional `update(entity, engine, dt)` called once per logic tick for every entity carrying the component, and optional `description` / `category` metadata for editor tooling. The schema establishes the starting values when an entity is spawned with that component in its `components: []` list — you can override any field in the spawn props.

Components are attached at spawn, not added later:

```ts
engine.world.spawn({
  tags: ['enemy'],
  components: ['Health', 'ChaseAI'],
  hp: 40, maxHp: 40,         // override schema defaults
  chaseSpeed: 100,
  x: 200, y: 300, width: 18, height: 18, shape: 'circle', color: '#f44',
})
```

Adjacent file: `engine-facade.md` → `engine.components` for the registry API; `engine-facade.md` → `engine.prefabs` for stamping out components via prefab templates.

---

## Combat

### `Health`  (`Health.ts`)

HP, invincibility frames, death detection, and optional HP regen.

| Field | Default | Notes |
|-------|---------|-------|
| `hp` | 100 | Current HP. |
| `maxHp` | 100 | Cap; regen and clamp use this. |
| `invulnerable` | false | When true, Damage component has no effect. |
| `iframeDuration` | 0.5 | Seconds of forced invulnerability after a hit (set by CombatResolver). |
| `lastHitTime` | -999 | Timestamp of last hit; compared to `world.time`. |
| `regen` | 0 | HP per second passive regen. |

When `hp` reaches 0 the component sets `entity._dead = true` and emits `entity:died { id, tags }`. Listen for this event to trigger death effects — do not poll `hp` each frame.

### `Damage`  (`Damage.ts`)

Pure data — the amount of damage this entity deals on contact. Read by `CombatResolver`.

| Field | Default |
|-------|---------|
| `contactDamage` | 10 |
| `damageType` | `'contact'` — `'contact' | 'projectile' | 'area' | 'environmental'` |

### `Knockback`  (`Knockback.ts`)

Applies a decaying velocity burst when hit. `CombatResolver` writes `_kbVx` / `_kbVy` on the entity; this component ticks the decay (multiplied by 0.85 per tick, stops below 1 px/tick).

No schema fields you author — the impulse comes from `CombatResolver` calling the `applyKnockback` helper at hit time.

### `DamageFlash`  (`DamageFlash.ts`)

Briefly tints the entity's `color` to `flashColor` when hit, then restores the original.

| Field | Default |
|-------|---------|
| `flashColor` | `'#ffffff'` |
| `flashDuration` | 0.08 s |

Triggered by `triggerDamageFlash(entity)` (exported from `index.ts`). CombatResolver calls this automatically.

### `Shield`  (`Shield.ts`)

Absorbs damage before HP. Breaks at 0, enters a downtime cooldown, then recharges.

| Field | Default |
|-------|---------|
| `shieldHp` | 50 |
| `shieldMaxHp` | 50 |
| `shieldRecharge` | 10 HP/s |
| `shieldDowntime` | 2 s — cooldown after breaking before recharge begins |

Emits `shield:broke { id }` on break, `shield:restored { id }` when fully recharged.

### `StatusEffect`  (`StatusEffect.ts`)

Timed buffs/debuffs. The entity carries `_statusEffects: StatusEffectInstance[]`. The component ticks durations and removes expired effects.

Apply via the exported helper:
```ts
import { applyStatusEffect, hasStatusEffect, getStatusModifier } from '../engine/components'
applyStatusEffect(entity, 'slow', 3.0, { speedMult: 0.5 })
hasStatusEffect(entity, 'slow')               // → boolean
getStatusModifier(entity, 'slow', 'speedMult') // → number | undefined
```

Emits `status:applied { id, name }` and `status:expired { id, name }`.

### `AreaDamage`  (`AreaDamage.ts`)

Persistent damage zone around the entity. Ticks damage at a steady rate (not every frame) using a per-victim cooldown.

| Field | Default |
|-------|---------|
| `areaDamage` | 5 |
| `areaRadius` | 80 px |
| `areaTargetTag` | `'enemy'` |
| `areaTickRate` | 0.5 s per victim |

### `CombatResolver`  (`CombatResolver.ts`)

Not a component registered via `engine.components` — it's a utility class exported from `index.ts`. Call it from a game system to process a collision:

```ts
import { CombatResolver } from '../engine/components'
const resolver = new CombatResolver(engine)
// In a collision handler:
resolver.resolve(attacker, defender)
// Reads Damage on attacker, applies to Health on defender, triggers DamageFlash, Knockback.
```

---

## Movement

### `TopDownMovement`  (`TopDownMovement.ts`)

WASD/arrow player movement. Reads `moveLeft`, `moveRight`, `moveUp`, `moveDown` input actions (register with `registerTopDownMovementInput(engine)` — exported from `index.ts`).

| Field | Default |
|-------|---------|
| `moveSpeed` | 200 px/s |
| `acceleration` | 0 — 0 = instant, >0 = time to reach full speed |
| `friction` | 0 — velocity decay coefficient |
| `diagonalNormalize` | true |

Yields to `Dash` while `entity._dashActive === true`.

### `SpaceMovement`  (`SpaceMovement.ts`)

Inertia-based "spaceship" movement. Input adds acceleration; drag decays velocity passively.

| Field | Default |
|-------|---------|
| `thrust` | 900 px/s² |
| `maxSpeed` | 240 px/s |
| `drag` | 0.6 per-second decay coefficient |
| `hullTurnRate` | 3 rad/s |
| `diagonalNormalize` | true |

Writes `vx`, `vy`, and `rotation`. Yields to `Dash`.

### `Dash`  (`Dash.ts`)

Burst movement with i-frames and charge-based cooldown. Direction modes: `'movement'` (current velocity) or `'mouse'`.

| Field | Default |
|-------|---------|
| `dashInput` | `'dash'` |
| `dashImpulse` | 600 px/s |
| `dashDuration` | 0.15 s |
| `dashCooldown` | 0.8 s |
| `dashCharges` | 1 |
| `dashIframeDuration` | 0.1 s |
| `dashAimMode` | `'movement'` |

Sets `entity._dashActive = true` during the burst. Both `TopDownMovement` and `SpaceMovement` skip their logic while this flag is set.

### `PathFollower`  (`PathFollower.ts`)

Moves entity along an attached `_path` (`Path` instance). Set `entity._path = engine.paths.get('my-route')` at spawn.

| Field | Default |
|-------|---------|
| `pathDistance` | 0 — current distance along the path |
| `pathSpeed` | 60 px/s |
| `pathLoop` | false |

Emits `path:completed { id }` when the end is reached (if not looping).

### `GridFollower`  (`GridFollower.ts`)

A* pathfinder-guided movement over a registered tilemap. Re-paths at `gridRepathInterval`.

| Field | Default |
|-------|---------|
| `gridMapName` | `''` |
| `gridTargetX` | 0 |
| `gridTargetY` | 0 |
| `gridFollowSpeed` | 80 px/s |
| `gridRepathInterval` | 1 s |

---

## AI

### `ChaseAI`  (`ChaseAI.ts`)

Moves entity toward the nearest target with a given tag.

| Field | Default |
|-------|---------|
| `chaseSpeed` | 80 px/s |
| `chaseTarget` | `'player'` |
| `chaseRange` | 9999 px |
| `loseRange` | 9999 px |

Stops chasing when no target is within `chaseRange`; gives up when target exits `loseRange`.

### `PatrolAI`  (`PatrolAI.ts`)

Moves entity back and forth on one axis.

| Field | Default |
|-------|---------|
| `patrolSpeed` | 60 px/s |
| `patrolMinX` | 0 |
| `patrolMaxX` | 800 |
| `patrolAxis` | `'x'` |
| `patrolDirection` | 1 |

### `Turret`  (`Turret.ts`)

A sub-entity that colocates with a parent ship, tracks the mouse fast, and fires its own `Weapon`. Set `entity._turretParent = parentEntityId` at spawn.

| Field | Default |
|-------|---------|
| `turretTurnRate` | 8 rad/s |

---

## Weapon System (S40 decomposition)

The six components below are orthogonal primitives that compose into any firing pattern. They replaced the monolithic `Weapon` component for new games (though `Weapon` still exists for Arena/TD/Platformer back-compat). Execution order at registration time matters: `Aim → Cooldown → Trigger → Magazine → Pattern → Recoil`.

### `Aim`

Resolves `_aimAngle` (radians) from one of five sources: `'mouse'`, `'forward'`, `'fixed'` (reads `aimFixedAngle`), `'nearest'` (nearest entity tagged `aimTargetTag` within `aimRange`), or `'velocity'` (entity's own velocity vector).

### `Cooldown`

Maintains `_cooldownTimer` and `_canFire`. Optional heat mode (`cooldownHeat: true`) accumulates heat per shot and blocks firing when overheated.

| Field | Default |
|-------|---------|
| `fireRate` | 0.2 s |
| `cooldownHeat` | false |
| `heatPerShot` | 10 |
| `heatCool` | 20 /s |
| `heatMax` | 100 |

### `Trigger`

Sets `_wantsToFire` from input or automatically. Modes: `'hold'`, `'tap'`, `'auto'`, `'charge'`.

| Field | Default |
|-------|---------|
| `triggerMode` | `'auto'` |
| `triggerInput` | `'fire1'` |
| `triggerChargeMin` | 0.3 s |

### `Magazine`

Ammo gating. Modes: `'infinite'`, `'clip'`, `'heat'`. Clip mode auto-reloads; manual reload via `reloadInput`.

| Field | Default |
|-------|---------|
| `magazineMode` | `'infinite'` |
| `clipSize` | 10 |
| `reloadTime` | 1.5 s |
| `reloadInput` | `'reload'` |

### `Pattern`

Projectile spawn shape when all four gates (`_wantsToFire`, `_canFire`, `_hasAmmo`, and a valid `_aimAngle`) align. Patterns: `'single'`, `'spread'`, `'ring'`, `'rear'`, `'burst'`.

| Field | Default |
|-------|---------|
| `patternType` | `'single'` |
| `patternCount` | 3 (for spread/ring) |
| `patternSpread` | 0.3 rad |
| `bulletPrefab` | `''` — prefab to spawn; must be registered |
| `bulletSpeed` | 300 px/s |

### `Recoil`

Post-fire feedback (knockback, camera shake, or both). Reads `_justFired` (set by Pattern).

| Field | Default |
|-------|---------|
| `recoilMode` | `'none'` |
| `recoilImpulse` | 80 px/s |
| `recoilShakeIntensity` | 3 |
| `recoilShakeDuration` | 0.15 s |

### `Weapon` (legacy)  (`Weapon.ts`)

The monolithic all-in-one firer retained for Arena/TD/Platformer back-compat. For new games, prefer the six primitives above. Aim modes: `'nearest'`, `'mouse'`, `'forward'`, `'fixed'`. Supports multishot, spread, rear shot, clip + reload, and pooled bullets.

---

## Collection & Economy

### `Magnet`  (`Magnet.ts`)

Pulls tagged entities toward the host and collects them on contact. Emits `magnet:collect { collectorId, collectedId }`.

| Field | Default |
|-------|---------|
| `magnetTags` | `['pickup']` — array at runtime, authored as a space-separated string in schema |
| `magnetRange` | 80 px |
| `magnetPull` | 200 px/s |
| `magnetPickupRadius` | 14 px |

### `XPSource`  (`XPSource.ts`)

Pure data — marks an entity as worth XP when collected.

| Field | Default |
|-------|---------|
| `xpValue` | 5 |

### `XPCollector`  (`XPCollector.ts`)

Pulls XPSource entities (tagged `'xpgem'`) and tracks XP + level.

| Field | Default |
|-------|---------|
| `magnetRange` | 80 px |
| `xp` | 0 |
| `level` | 1 |

Emits `xp:collected { amount }` and `player:levelup { level }`.

### `Currency`  (`Currency.ts`)

A resource amount on a collectible or holder entity. Pure data — no update logic. For multi-currency entities, use `currencyPurse: { gold: 100, scrap: 5 }`.

| Field | Default |
|-------|---------|
| `currencyType` | `'gold'` |
| `currencyValue` | 1 — amount given on collection |
| `currencyAmount` | 0 — running total on a wallet entity |

---

## Spawning

### `Spawner`  (`Spawner.ts`)

Periodic prefab spawner. Spawn areas: `'point'`, `'rect'`, `'ring'`, `'circle'`.

| Field | Default |
|-------|---------|
| `spawnPrefab` | `''` |
| `spawnInterval` | 1 s |
| `spawnMax` | 0 — 0 = unlimited |
| `spawnArea` | `'point'` |
| `spawnAreaWidth` | 100 px (rect mode) |
| `spawnAreaRadius` | 100 px (ring/circle mode) |

### `WaveSpawner`  (`WaveSpawner.ts`)

Time-gated multi-prefab spawner. The entity carries `waveSchedule: WaveEntry[]` — each entry specifies `startAt`, optional `endAt`, `prefab`, and `interval`. Good for survivor-style "introduce new enemy type at 1:00".

| Field | Default |
|-------|---------|
| `waveGlobalMaxActive` | 0 — 0 = unlimited |

---

## Physics Helpers

### `Homing`  (`Homing.ts`)

Bends a projectile's velocity toward the nearest tagged target. Speed is preserved.

| Field | Default |
|-------|---------|
| `homingTargetTag` | `'enemy'` |
| `homingTurnRate` | 3 rad/s |
| `homingRange` | 400 px |

### `GravityWell`  (`GravityWell.ts`)

Inverse-square pull. Entities inside `wellKillRadius` are consumed (emits `gravitywell:consumed`).

| Field | Default |
|-------|---------|
| `wellStrength` | 5e5 |
| `wellKillRadius` | 20 px |
| `wellPullRange` | 400 px |

### `Orbit`  (`Orbit.ts`)

Circles this entity around a tagged target at fixed radius.

| Field | Default |
|-------|---------|
| `orbitTargetTag` | `'player'` |
| `orbitRadius` | 60 px |
| `orbitSpeed` | 2 rad/s |
| `orbitDirection` | 1 — 1 = CCW, -1 = CW |
| `orbitInitialAngle` | 0 rad |

### `ProximityTrigger`  (`ProximityTrigger.ts`)

Fires `entity:triggered { id }` when a tagged entity enters `triggerRadius`. `armDelay` prevents immediate self-trigger.

| Field | Default |
|-------|---------|
| `triggerTag` | `'player'` |
| `triggerRadius` | 60 px |
| `armDelay` | 0.3 s |
| `triggerOnce` | true |

### `ExplodeOnTrigger`  (`ProximityTrigger.ts`)

Companion to `ProximityTrigger`. Listens for `entity:triggered` on its own entity and detonates (burst FX + AreaDamage + self-destruct). Both components together = mine.

---

## Lifecycle

### `Lifetime`  (`Lifetime.ts`)

Removes the entity after `lifetime` seconds. Pool-aware: calls `engine.pool.release` instead of `engine.world.remove` if `entity._pool` is set.

| Field | Default |
|-------|---------|
| `lifetime` | 2 s |

### `Emitter`  (`Emitter.ts`)

Attaches a continuous particle emitter to the entity's position. The emitter follows the entity each tick.

| Field | Default |
|-------|---------|
| `emitterPreset` | `''` — registered FX particle preset name |
| `emitterInterval` | 0.05 s |
| `emitterOffsetX` | 0 |
| `emitterOffsetY` | 0 |
| `emitterActive` | true |

---

## Groupings at a glance

```
Combat:    Health  Damage  Knockback  DamageFlash  Shield  StatusEffect  AreaDamage  CombatResolver
Movement:  TopDownMovement  SpaceMovement  Dash  PathFollower  GridFollower
AI:        ChaseAI  PatrolAI  Turret
Weapon:    Aim  Cooldown  Trigger  Magazine  Pattern  Recoil  (Weapon — legacy)
Economy:   Magnet  XPSource  XPCollector  Currency
Spawning:  Spawner  WaveSpawner
Physics:   Homing  GravityWell  Orbit  ProximityTrigger  ExplodeOnTrigger
Lifecycle: Lifetime  Emitter
```

`CombatResolver` is not a registered component — it is an exported utility class used inside game systems to wire together `Damage`, `Health`, `Knockback`, and `DamageFlash`.
