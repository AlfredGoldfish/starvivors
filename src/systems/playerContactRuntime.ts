import Phaser from 'phaser';
import type { ArenaSize } from '../core/arena';
import type {
  BasicAsteroid,
  EnemyWreckageDebris,
  PlayerAsteroidContact,
  PlayerDebrisContact,
  PlayerEnemyContact,
  RammingShieldCollision
} from '../scenes/gameTypes';
import type { EnemyLabInstance } from './enemyLabSpawner';
import {
  createCircleCollisionShape,
  getCircleCollision
} from './collisionShapes';

export interface FindPlayerEnemyContactInput {
  arena: ArenaSize;
  player: Phaser.GameObjects.Container;
  playerHitRadius: number;
  enemies: EnemyLabInstance[];
  getRammingShieldCircleCollision: (targetX: number, targetY: number, targetRadius: number) => RammingShieldCollision | undefined;
}

export interface FindPlayerAsteroidContactInput {
  arena: ArenaSize;
  player: Phaser.GameObjects.Container;
  playerHitRadius: number;
  asteroids: BasicAsteroid[];
  getAsteroidCollisionRadius: (asteroid: BasicAsteroid) => number;
  getAsteroidContactDamage: (asteroid: BasicAsteroid) => number;
  getRammingShieldCircleCollision: (targetX: number, targetY: number, targetRadius: number) => RammingShieldCollision | undefined;
}

export interface FindPlayerDebrisContactInput {
  arena: ArenaSize;
  player: Phaser.GameObjects.Container;
  playerHitRadius: number;
  debris: EnemyWreckageDebris[];
  getDebrisCollisionRadius: (debris: EnemyWreckageDebris) => number;
  getRammingShieldCircleCollision: (targetX: number, targetY: number, targetRadius: number) => RammingShieldCollision | undefined;
}

export function findPlayerEnemyContact(input: FindPlayerEnemyContactInput): PlayerEnemyContact | undefined {
  for (const enemy of input.enemies) {
    const enemyRadius = enemy.definition.stats.radius;
    const shieldCollision = input.getRammingShieldCircleCollision(enemy.body.x, enemy.body.y, enemyRadius);
    if (shieldCollision) {
      return {
        enemy,
        normal: shieldCollision.normal,
        penetration: shieldCollision.penetration,
        damage: enemy.definition.stats.contactDamage * enemy.damageMultiplier,
        hitRammingShield: true
      };
    }

    const collision = getCircleCollision(
      input.arena,
      createCircleCollisionShape(input.player, input.playerHitRadius),
      createCircleCollisionShape(enemy.body, enemyRadius)
    );
    if (collision) {
      return {
        enemy,
        normal: collision.normal,
        penetration: collision.penetration,
        damage: enemy.definition.stats.contactDamage * enemy.damageMultiplier
      };
    }
  }

  return undefined;
}

export function findPlayerAsteroidContact(input: FindPlayerAsteroidContactInput): PlayerAsteroidContact | undefined {
  for (const asteroid of input.asteroids) {
    const asteroidRadius = input.getAsteroidCollisionRadius(asteroid);
    const shieldCollision = input.getRammingShieldCircleCollision(asteroid.body.x, asteroid.body.y, asteroidRadius);
    if (shieldCollision) {
      return {
        asteroid,
        normal: shieldCollision.normal,
        penetration: shieldCollision.penetration,
        damage: input.getAsteroidContactDamage(asteroid),
        hitRammingShield: true
      };
    }

    const collision = getCircleCollision(
      input.arena,
      createCircleCollisionShape(input.player, input.playerHitRadius),
      createCircleCollisionShape(asteroid.body, asteroidRadius)
    );
    if (collision) {
      return {
        asteroid,
        normal: collision.normal,
        penetration: collision.penetration,
        damage: input.getAsteroidContactDamage(asteroid)
      };
    }
  }

  return undefined;
}

export function findPlayerDebrisContact(input: FindPlayerDebrisContactInput): PlayerDebrisContact | undefined {
  for (const debris of input.debris) {
    const debrisRadius = input.getDebrisCollisionRadius(debris);
    const shieldCollision = input.getRammingShieldCircleCollision(debris.body.x, debris.body.y, debrisRadius);
    if (shieldCollision) {
      return {
        debris,
        normal: shieldCollision.normal,
        penetration: shieldCollision.penetration,
        damage: debris.damage,
        hitRammingShield: true
      };
    }

    const collision = getCircleCollision(
      input.arena,
      createCircleCollisionShape(input.player, input.playerHitRadius),
      createCircleCollisionShape(debris.body, debrisRadius)
    );
    if (collision) {
      return {
        debris,
        normal: collision.normal,
        penetration: collision.penetration,
        damage: debris.damage
      };
    }
  }

  return undefined;
}

export function canApplyCooldown(cooldowns: WeakMap<object, number>, target: object, time: number): boolean {
  return time >= (cooldowns.get(target) ?? 0);
}

export function markCooldown(cooldowns: WeakMap<object, number>, target: object, time: number, durationMs: number): void {
  cooldowns.set(target, time + durationMs);
}

export function canApplyPairCooldown(
  cooldowns: WeakMap<object, WeakMap<object, number>>,
  first: object,
  second: object,
  time: number
): boolean {
  return time >= (cooldowns.get(first)?.get(second) ?? 0);
}

export function markPairCooldown(
  cooldowns: WeakMap<object, WeakMap<object, number>>,
  first: object,
  second: object,
  time: number,
  durationMs: number
): void {
  let firstCooldowns = cooldowns.get(first);
  let secondCooldowns = cooldowns.get(second);

  if (!firstCooldowns) {
    firstCooldowns = new WeakMap<object, number>();
    cooldowns.set(first, firstCooldowns);
  }

  if (!secondCooldowns) {
    secondCooldowns = new WeakMap<object, number>();
    cooldowns.set(second, secondCooldowns);
  }

  const nextDamageAt = time + durationMs;
  firstCooldowns.set(second, nextDamageAt);
  secondCooldowns.set(first, nextDamageAt);
}
