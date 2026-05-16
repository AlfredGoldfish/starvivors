# Player Projectile Extraction Plan

## When To Extract

Extract player projectiles after the game has more than one projectile-style player weapon, or when projectile weapons start needing different behavior such as:

- spread patterns
- explosive shots
- homing shots
- chain or bounce behavior
- status effects
- weapon-specific projectile visuals
- weapon-specific hit rules

Right now, the code has generic player projectile names, but the behavior is still mostly Pulse Cannon behavior. Keeping the collision-heavy code in `GameScene.ts` is acceptable until more projectile weapons exist.

## Recommended Shape

Create:

```text
src/systems/playerProjectiles.ts
```

The first version should own:

- the player projectile runtime type
- the projectile array
- projectile spawn helpers
- projectile visual creation helpers if practical
- projectile lifetime and range cleanup
- pierce bookkeeping
- trail timing
- generic movement update

`GameScene.ts` should still own world side effects at first:

- damaging enemies
- destroying enemies
- spawning scrap
- granting XP
- asteroid breakup
- debris destruction
- impact feedback
- black hole system calls

## First-Pass API

A safe first-pass manager could look like this:

```ts
interface PlayerProjectileManagerCallbacks {
  applyWorldForces(projectile: PlayerProjectile, deltaSeconds: number): void;
  updateToroidalMirror(projectile: PlayerProjectile): void;
  tryHitWorld(projectile: PlayerProjectile): boolean;
  emitTrail(projectile: PlayerProjectile): void;
  destroyVisual(projectile: PlayerProjectile): void;
}
```

The manager updates projectile movement and decides whether a projectile should continue, pierce, expire, or be destroyed. `GameScene` supplies callbacks for anything that touches enemies, asteroids, debris, black holes, or Phaser scene-specific effects.

## Avoid For Now

Do not move all projectile collision into the first extraction. That code currently reaches into too many scene-owned systems:

- enemy arrays
- asteroid arrays
- debris arrays
- scrap spawning
- XP rewards
- black hole capture
- visual effects

Moving all of that at once would become a combat/world refactor and is more likely to break gameplay.

## Later Extraction

After enemies, asteroids, debris, and combat rewards are less scene-local, projectile hit handling can move into a combat module.

Possible later files:

```text
src/systems/playerProjectiles.ts
src/systems/combatResolution.ts
src/systems/worldEntities.ts
```

At that point, `GameScene.ts` should mostly orchestrate input, rendering, and high-level update order.
