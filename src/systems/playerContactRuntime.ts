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
import type { EnemyInstance } from './enemySpawner';
import {
  createCircleCollisionShape,
  getCircleCollision,
  getWrappedDirection
} from './collisionShapes';

export interface FindPlayerEnemyContactInput {
  arena: ArenaSize;
  player: Phaser.GameObjects.Container;
  playerHitRadius: number;
  previousPlayerX?: number;
  previousPlayerY?: number;
  enemies: EnemyInstance[];
  getRammingShieldCircleCollision: (targetX: number, targetY: number, targetRadius: number) => RammingShieldCollision | undefined;
}

export interface FindPlayerAsteroidContactInput {
  arena: ArenaSize;
  player: Phaser.GameObjects.Container;
  playerHitRadius: number;
  previousPlayerX?: number;
  previousPlayerY?: number;
  asteroids: BasicAsteroid[];
  getAsteroidCollisionRadius: (asteroid: BasicAsteroid) => number;
  getAsteroidContactDamage: (asteroid: BasicAsteroid) => number;
  getRammingShieldCircleCollision: (targetX: number, targetY: number, targetRadius: number) => RammingShieldCollision | undefined;
}

export interface FindPlayerDebrisContactInput {
  arena: ArenaSize;
  player: Phaser.GameObjects.Container;
  playerHitRadius: number;
  previousPlayerX?: number;
  previousPlayerY?: number;
  debris: EnemyWreckageDebris[];
  getDebrisCollisionRadius: (debris: EnemyWreckageDebris) => number;
  getRammingShieldCircleCollision: (targetX: number, targetY: number, targetRadius: number) => RammingShieldCollision | undefined;
}

function getSweptPlayerCircleContact(input: {
  arena: ArenaSize;
  playerX: number;
  playerY: number;
  previousPlayerX?: number;
  previousPlayerY?: number;
  playerHitRadius: number;
  targetX: number;
  targetY: number;
  targetRadius: number;
}): { normal: Phaser.Math.Vector2; penetration: number } | undefined {
  if (input.previousPlayerX === undefined || input.previousPlayerY === undefined) {
    return undefined;
  }

  const movement = getWrappedDirection(
    input.arena,
    input.previousPlayerX,
    input.previousPlayerY,
    input.playerX,
    input.playerY
  );
  const movementLengthSq = movement.lengthSq();

  if (movementLengthSq <= 0.0001) {
    return undefined;
  }

  const currentOffset = getWrappedDirection(
    input.arena,
    input.targetX,
    input.targetY,
    input.playerX,
    input.playerY
  );
  const previousOffset = new Phaser.Math.Vector2(
    currentOffset.x - movement.x,
    currentOffset.y - movement.y
  );
  const closestRatio = Phaser.Math.Clamp(-previousOffset.dot(movement) / movementLengthSq, 0, 1);
  const closestOffset = new Phaser.Math.Vector2(
    previousOffset.x + movement.x * closestRatio,
    previousOffset.y + movement.y * closestRatio
  );
  const hitRadius = input.playerHitRadius + input.targetRadius;
  const closestDistanceSq = closestOffset.lengthSq();

  if (closestDistanceSq > hitRadius * hitRadius) {
    return undefined;
  }

  const closestDistance = Math.sqrt(closestDistanceSq);
  let normal: Phaser.Math.Vector2;

  if (closestDistance > 0) {
    normal = closestOffset.clone().scale(1 / closestDistance);
  } else if (currentOffset.lengthSq() > 0) {
    normal = currentOffset.clone().normalize();
  } else {
    normal = movement.clone().normalize();
  }

  return {
    normal,
    penetration: Math.max(1, hitRadius - closestDistance)
  };
}

function getSweptMovingCircleContact(input: {
  arena: ArenaSize;
  playerX: number;
  playerY: number;
  previousPlayerX?: number;
  previousPlayerY?: number;
  playerHitRadius: number;
  targetX: number;
  targetY: number;
  previousTargetX?: number;
  previousTargetY?: number;
  targetRadius: number;
}): { normal: Phaser.Math.Vector2; penetration: number } | undefined {
  if (
    input.previousPlayerX === undefined ||
    input.previousPlayerY === undefined ||
    input.previousTargetX === undefined ||
    input.previousTargetY === undefined
  ) {
    return undefined;
  }

  const playerMovement = getWrappedDirection(
    input.arena,
    input.previousPlayerX,
    input.previousPlayerY,
    input.playerX,
    input.playerY
  );
  const targetMovement = getWrappedDirection(
    input.arena,
    input.previousTargetX,
    input.previousTargetY,
    input.targetX,
    input.targetY
  );
  const relativeMovement = playerMovement.subtract(targetMovement);
  const movementLengthSq = relativeMovement.lengthSq();

  if (movementLengthSq <= 0.0001) {
    return undefined;
  }

  const currentOffset = getWrappedDirection(
    input.arena,
    input.targetX,
    input.targetY,
    input.playerX,
    input.playerY
  );
  const previousOffset = new Phaser.Math.Vector2(
    currentOffset.x - relativeMovement.x,
    currentOffset.y - relativeMovement.y
  );
  const closestRatio = Phaser.Math.Clamp(-previousOffset.dot(relativeMovement) / movementLengthSq, 0, 1);
  const closestOffset = new Phaser.Math.Vector2(
    previousOffset.x + relativeMovement.x * closestRatio,
    previousOffset.y + relativeMovement.y * closestRatio
  );
  const hitRadius = input.playerHitRadius + input.targetRadius;
  const closestDistanceSq = closestOffset.lengthSq();

  if (closestDistanceSq > hitRadius * hitRadius) {
    return undefined;
  }

  const closestDistance = Math.sqrt(closestDistanceSq);
  let normal: Phaser.Math.Vector2;

  if (closestDistance > 0) {
    normal = closestOffset.clone().scale(1 / closestDistance);
  } else if (currentOffset.lengthSq() > 0) {
    normal = currentOffset.clone().normalize();
  } else if (previousOffset.lengthSq() > 0) {
    normal = previousOffset.clone().normalize();
  } else {
    normal = relativeMovement.clone().normalize();
  }

  return {
    normal,
    penetration: Math.max(1, hitRadius - closestDistance)
  };
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

    const sweptCollision = getSweptPlayerCircleContact({
      arena: input.arena,
      playerX: input.player.x,
      playerY: input.player.y,
      previousPlayerX: input.previousPlayerX,
      previousPlayerY: input.previousPlayerY,
      playerHitRadius: input.playerHitRadius,
      targetX: enemy.body.x,
      targetY: enemy.body.y,
      targetRadius: enemyRadius
    });
    if (sweptCollision) {
      return {
        enemy,
        normal: sweptCollision.normal,
        penetration: sweptCollision.penetration,
        damage: enemy.definition.stats.contactDamage * enemy.damageMultiplier
      };
    }

    const sweptMovingCollision = getSweptMovingCircleContact({
      arena: input.arena,
      playerX: input.player.x,
      playerY: input.player.y,
      previousPlayerX: input.previousPlayerX,
      previousPlayerY: input.previousPlayerY,
      playerHitRadius: input.playerHitRadius,
      targetX: enemy.body.x,
      targetY: enemy.body.y,
      previousTargetX: enemy.previousX,
      previousTargetY: enemy.previousY,
      targetRadius: enemyRadius
    });
    if (sweptMovingCollision) {
      return {
        enemy,
        normal: sweptMovingCollision.normal,
        penetration: sweptMovingCollision.penetration,
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

    const sweptCollision = getSweptPlayerCircleContact({
      arena: input.arena,
      playerX: input.player.x,
      playerY: input.player.y,
      previousPlayerX: input.previousPlayerX,
      previousPlayerY: input.previousPlayerY,
      playerHitRadius: input.playerHitRadius,
      targetX: asteroid.body.x,
      targetY: asteroid.body.y,
      targetRadius: asteroidRadius
    });
    if (sweptCollision) {
      return {
        asteroid,
        normal: sweptCollision.normal,
        penetration: sweptCollision.penetration,
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

    const sweptCollision = getSweptPlayerCircleContact({
      arena: input.arena,
      playerX: input.player.x,
      playerY: input.player.y,
      previousPlayerX: input.previousPlayerX,
      previousPlayerY: input.previousPlayerY,
      playerHitRadius: input.playerHitRadius,
      targetX: debris.body.x,
      targetY: debris.body.y,
      targetRadius: debrisRadius
    });
    if (sweptCollision) {
      return {
        debris,
        normal: sweptCollision.normal,
        penetration: sweptCollision.penetration,
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
