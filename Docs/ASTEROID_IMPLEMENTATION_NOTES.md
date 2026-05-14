# Asteroid Implementation Notes

Current implementation lives in `src/scenes/GameScene.ts`.

## Runtime Assets

Asteroids use four image variants loaded from:

```text
assets/asteroids/astroid_1.png
assets/asteroids/astroid_2.png
assets/asteroids/astroid_3.png
assets/asteroids/astroid_4.png
```

Visual variant is separate from gameplay tier. Any asteroid tier can use any available asteroid image.

## Asteroid Model

Each active asteroid is tracked in the scene-local `basicAsteroids` array.

```ts
interface BasicAsteroid {
  body: Phaser.GameObjects.Container;
  variant: string;
  tier: AsteroidTier;
  hp: number;
  breakupProfile: AsteroidBreakupProfile;
  velocity: Phaser.Math.Vector2;
  rotationSpeed: number;
  hitRadius: number;
}
```

This is intentionally asteroid-only state. There is no shared health/damage framework for enemies, player, or other objects yet.

## Gameplay Tiers

Asteroids use five numbered gameplay tiers:

- `5` is the largest asteroid.
- `1` is the smallest terminal asteroid.
- Tiers `2` through `5` break into lower-tier asteroids.
- Tier `1` does not break further.

| Tier | HP | Display size | Hit radius | Spawn speed | Impact impulse | Max velocity | Mass budget |
| ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| `1` | 1 | 52 | 20 | 92-160 | 94 | 245 | 1 |
| `2` | 2 | 76 | 30 | 76-138 | 78 | 220 | 4 |
| `3` | 3 | 108 | 42 | 54-112 | 58 | 190 | 8 |
| `4` | 5 | 154 | 58 | 34-78 | 36 | 155 | 16 |
| `5` | 8 | 196 | 74 | 22-56 | 24 | 125 | 32 |

Tier controls display size, collision radius, HP, initial speed range, projectile impact response, velocity cap, and breakup mass budget.

## Spawning

The scene spawns `9` asteroids when the world is rebuilt. Initial tier selection is random from a weighted list:

```ts
const INITIAL_ASTEROID_TIERS: AsteroidTier[] = [5, 5, 4, 4, 4, 3, 3, 2, 2, 1];
```

Each asteroid gets:

- Random world position
- Safe minimum distance from the initial player position
- Random visual variant
- Tier-based randomized velocity
- Random slow rotation direction and speed
- A new randomized breakup profile

## Breakup Profiles

Each asteroid gets a `breakupProfile` when it is created. This is local random state stored on the asteroid, not a deterministic seeded RNG system.

Current profile fields:

```ts
interface AsteroidBreakupProfile {
  mode: 'many-small' | 'balanced' | 'few-large' | 'single-tier';
  preferredTier?: AsteroidTier;
  burstMultiplier: number;
  spreadMultiplier: number;
}
```

The profile influences how that asteroid breaks later:

- `many-small` weights lower tiers more heavily.
- `balanced` gives valid lower tiers even weight.
- `few-large` weights the largest valid lower tiers more heavily.
- `single-tier` spends the full mass budget on one lower tier, enabling outcomes like `32x tier 1` from a tier 5 asteroid.
- `burstMultiplier` and `spreadMultiplier` vary child separation.

Every child asteroid receives its own new breakup profile.

## Movement And Wrapping

Asteroids drift by applying velocity every frame, then wrap through the arena edges:

```ts
asteroid.body.x = wrapCoordinate(asteroid.body.x + asteroid.velocity.x * deltaSeconds, this.arena.width);
asteroid.body.y = wrapCoordinate(asteroid.body.y + asteroid.velocity.y * deltaSeconds, this.arena.height);
asteroid.body.rotation += asteroid.rotationSpeed * deltaSeconds;
```

This uses the same toroidal arena wrapping helper as other world objects.

## Projectile Hits

Pulse Cannon projectiles check asteroids after enemy hit checks. A projectile hit:

1. Deals `1` asteroid damage.
2. Removes the projectile.
3. If the asteroid survives, applies an impulse in the projectile travel direction.
4. If HP reaches zero, destroys the asteroid and may spawn lower-tier asteroids.

Surviving impact response:

```ts
const impactDirection = projectile.velocity.clone().normalize();
const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];

asteroid.velocity.x += impactDirection.x * tierConfig.impactImpulse;
asteroid.velocity.y += impactDirection.y * tierConfig.impactImpulse;
asteroid.velocity.limit(tierConfig.maxVelocity);
```

Higher-tier asteroids are harder to shove. Lower-tier asteroids are easier to shove.

## Mass-Budgeted Breakup

"Fragment" is only a descriptive term for an asteroid created by breakup. A fragment is a normal asteroid with normal tier behavior, HP, hit radius, movement, impact response, wrapping, and future breakup behavior.

Breakup uses the destroyed asteroid's mass budget:

```text
tier 1 = 1 mass
tier 2 = 4 mass
tier 3 = 8 mass
tier 4 = 16 mass
tier 5 = 32 mass
```

Rules:

- Tier `5` can break into any mix of tiers `1` through `4`.
- Tier `4` can break into any mix of tiers `1` through `3`.
- Tier `3` can break into any mix of tiers `1` through `2`.
- Tier `2` breaks into tier `1` asteroids.
- Tier `1` disappears.
- Fragment tiers are always lower than the destroyed parent tier.
- The generator repeatedly chooses valid lower tiers and subtracts their mass cost until the parent budget is spent.
- Exact mass-budget outcomes are preferred; the current implementation spends the full budget because tier `1` can always fill any remainder.

Required outcomes are possible through the `single-tier` breakup profile:

- Tier `5`: `32x tier 1`, `8x tier 2`, `4x tier 3`, or `2x tier 4`
- Tier `4`: `16x tier 1`, `4x tier 2`, or `2x tier 3`
- Tier `3`: `8x tier 1` or `2x tier 2`
- Tier `2`: `4x tier 1`

Mixed outcomes are generated by the weighted profile modes and still spend the parent mass budget.

## Breakup Spawning

Children spawn near the destroyed parent and spread around it:

```ts
const velocity = parentVelocity
  .clone()
  .scale(ASTEROID_PARENT_VELOCITY_INHERITANCE)
  .add(new Phaser.Math.Vector2(Math.cos(angle) * burstSpeed, Math.sin(angle) * burstSpeed));

velocity.limit(fragmentConfig.maxVelocity);
```

Children inherit `62%` of parent velocity, add outward burst velocity, use random asteroid visual variants, and are pushed into the active `basicAsteroids` array as normal asteroids.

## Future Hooks

Later loot/drop behavior should trigger from asteroid destruction events, including destruction events that also create child asteroids. Loot, XP, scrap, and pickups are not implemented yet.

## Current Non-Features

Asteroids currently do not:

- Damage the player
- Award XP
- Drop scrap, loot, or pickups
- Interact with enemies
- Interact with black holes
- Use Phaser physics bodies

All collision is manual distance checking in `GameScene`.
