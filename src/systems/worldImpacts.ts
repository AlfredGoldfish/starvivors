import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  ASTEROID_COLLISION_IMPULSE_SPEED_SCALE,
  ASTEROID_COLLISION_MAX_IMPULSE,
  ASTEROID_COLLISION_MAX_SEPARATION,
  ASTEROID_COLLISION_MIN_IMPULSE,
  ASTEROID_COLLISION_RESTITUTION,
  ASTEROID_COLLISION_SEPARATION_PERCENT
} from '../scenes/gameConstants';
import type {
  BasicAsteroid,
  BasicEnemy,
  EnemyWreckageDebris,
  ShooterEnemy,
  TankEnemy
} from '../scenes/gameTypes';
import type { EnemyLabInstance } from './enemyLabSpawner';
import type { DebugImpactSourceType } from './debug/debugState';
import {
  getCapsuleCircleCollision,
  getCircleCollision,
  getWrappedDirection,
  scaleHalfExtent,
  type ShapeCollisionResult
} from './collisionShapes';
import {
  applyCollisionImpulse,
  getClosingSpeed,
  getMassResponseShare,
  getRelativeVelocity
} from './physics';

type WorldEnemy = BasicEnemy | ShooterEnemy | TankEnemy | EnemyLabInstance;
type BodyImpactCollisionRequest = Pick<
  ResolveBodyImpactCollisionInput,
  | 'firstBody'
  | 'secondBody'
  | 'firstVelocity'
  | 'secondVelocity'
  | 'firstTotalVelocity'
  | 'secondTotalVelocity'
  | 'firstMass'
  | 'secondMass'
  | 'firstRadius'
  | 'secondRadius'
  | 'firstSource'
  | 'secondSource'
  | 'firstMaxSpeed'
  | 'secondMaxSpeed'
  | 'time'
  | 'damageFirst'
  | 'damageSecond'
  | 'collisionNormal'
  | 'collisionPenetration'
  | 'collisionOffset'
>;

export interface ResolveWorldImpactCollisionsInput {
  arena: ArenaSize;
  enemies: WorldEnemy[];
  asteroids: BasicAsteroid[];
  debris: EnemyWreckageDebris[];
  time: number;
  getEnemyHitRadius: (enemy: WorldEnemy) => number;
  getEnemyCollisionScale: () => number;
  getAsteroidCollisionRadius: (asteroid: BasicAsteroid) => number;
  getDebrisCollisionRadius: (debris: EnemyWreckageDebris) => number;
  getEnemyTotalVelocity: (enemy: WorldEnemy) => Phaser.Math.Vector2;
  getAsteroidMass: (tier: BasicAsteroid['tier']) => number;
  getGlobalMaxSpeed: () => number;
  resolveBodyImpactCollision: (input: BodyImpactCollisionRequest) => void;
  damageEnemyFromAsteroid: (enemy: WorldEnemy, damage: number) => void;
  damageEnemyFromDebris: (enemy: WorldEnemy, damage: number) => void;
  damageAsteroidFromEnemy: (asteroid: BasicAsteroid, damage: number) => void;
  damageAsteroidFromDebris: (asteroid: BasicAsteroid, damage: number) => void;
  damageDebrisFromEnemy: (debris: EnemyWreckageDebris, damage: number) => void;
  damageDebrisFromAsteroid: (debris: EnemyWreckageDebris, damage: number) => void;
}

export interface ResolveBodyImpactCollisionInput {
  arena: ArenaSize;
  firstBody: Phaser.GameObjects.Container;
  secondBody: Phaser.GameObjects.Container;
  firstVelocity: Phaser.Math.Vector2;
  secondVelocity: Phaser.Math.Vector2;
  firstTotalVelocity: Phaser.Math.Vector2;
  secondTotalVelocity: Phaser.Math.Vector2;
  firstMass: number;
  secondMass: number;
  firstRadius: number;
  secondRadius: number;
  firstSource: DebugImpactSourceType;
  secondSource: DebugImpactSourceType;
  firstMaxSpeed: number;
  secondMaxSpeed: number;
  time: number;
  asteroidCollisionImpulseScale: number;
  canApplyWorldCollisionDamage: (first: object, second: object, time: number) => boolean;
  markWorldCollisionDamageApplied: (first: object, second: object, time: number) => void;
  getCollisionNormal: (offset: Phaser.Math.Vector2) => Phaser.Math.Vector2;
  nudgeWrappedObject: (object: Phaser.GameObjects.Container, normal: Phaser.Math.Vector2, distance: number) => void;
  calculatePhysicalImpactDamage: (input: {
    source: DebugImpactSourceType;
    baseDamage: number;
    attackerMass: number;
    targetMass: number;
    impactSpeed: number;
  }) => number;
  damageFirst: (damage: number) => void;
  damageSecond: (damage: number) => void;
  emitImpactExplosion: (x: number, y: number) => void;
  collisionNormal?: Phaser.Math.Vector2;
  collisionPenetration?: number;
  collisionOffset?: Phaser.Math.Vector2;
}

export function resolveWorldImpactCollisions(input: ResolveWorldImpactCollisionsInput): void {
  resolveEnemyAsteroidImpactCollisions(input);
  resolveEnemyDebrisImpactCollisions(input);
  resolveAsteroidDebrisImpactCollisions(input);
}

export function resolveBodyImpactCollision(input: ResolveBodyImpactCollisionInput): void {
  if (!input.canApplyWorldCollisionDamage(input.firstBody, input.secondBody, input.time)) {
    return;
  }

  const offset =
    input.collisionOffset ??
    getWrappedDirection(input.arena, input.secondBody.x, input.secondBody.y, input.firstBody.x, input.firstBody.y);
  const normal = input.collisionNormal ?? input.getCollisionNormal(offset);
  const relativeVelocity = getRelativeVelocity(input.firstTotalVelocity, input.secondTotalVelocity);
  const closingSpeed = getClosingSpeed(relativeVelocity, normal);
  const hitRadius = input.firstRadius + input.secondRadius;
  const penetration = input.collisionPenetration ?? Math.max(0, hitRadius - offset.length());
  const separation = Math.min(penetration * ASTEROID_COLLISION_SEPARATION_PERCENT, ASTEROID_COLLISION_MAX_SEPARATION);
  const firstShare = getMassResponseShare(input.secondMass, input.firstMass);
  const secondShare = getMassResponseShare(input.firstMass, input.secondMass);

  input.nudgeWrappedObject(input.firstBody, normal, separation * firstShare);
  input.nudgeWrappedObject(input.secondBody, normal, -separation * secondShare);
  applyCollisionImpulse({
    normal,
    firstVelocity: input.firstVelocity,
    secondVelocity: input.secondVelocity,
    firstMass: input.firstMass,
    secondMass: input.secondMass,
    minImpulse: ASTEROID_COLLISION_MIN_IMPULSE * input.asteroidCollisionImpulseScale,
    maxImpulse: ASTEROID_COLLISION_MAX_IMPULSE * input.asteroidCollisionImpulseScale,
    relativeSpeedScale: ASTEROID_COLLISION_IMPULSE_SPEED_SCALE * input.asteroidCollisionImpulseScale,
    firstMaxSpeed: input.firstMaxSpeed,
    secondMaxSpeed: input.secondMaxSpeed,
    restitution: ASTEROID_COLLISION_RESTITUTION,
    relativeVelocity
  });

  const damageToFirst = input.calculatePhysicalImpactDamage({
    source: input.secondSource,
    baseDamage: 0,
    attackerMass: input.secondMass,
    targetMass: input.firstMass,
    impactSpeed: closingSpeed
  });
  const damageToSecond = input.calculatePhysicalImpactDamage({
    source: input.firstSource,
    baseDamage: 0,
    attackerMass: input.firstMass,
    targetMass: input.secondMass,
    impactSpeed: closingSpeed
  });

  input.markWorldCollisionDamageApplied(input.firstBody, input.secondBody, input.time);
  if (damageToFirst > 0) {
    input.damageFirst(damageToFirst);
  }
  if (damageToSecond > 0) {
    input.damageSecond(damageToSecond);
  }
  if (damageToFirst > 0 || damageToSecond > 0) {
    input.emitImpactExplosion(
      wrapCoordinate((input.firstBody.x + input.secondBody.x) * 0.5, input.arena.width),
      wrapCoordinate((input.firstBody.y + input.secondBody.y) * 0.5, input.arena.height)
    );
  }
}

function resolveEnemyAsteroidImpactCollisions(input: ResolveWorldImpactCollisionsInput): void {
  for (const enemy of input.enemies) {
    for (const asteroid of [...input.asteroids]) {
      const enemyHitRadius = input.getEnemyHitRadius(enemy);
      const asteroidRadius = input.getAsteroidCollisionRadius(asteroid);
      const collision = getEnemyCircleCollision(input, enemy, asteroid.body.x, asteroid.body.y, asteroidRadius);
      if (
        !input.asteroids.includes(asteroid) ||
        !collision
      ) {
        continue;
      }

      input.resolveBodyImpactCollision({
        firstBody: enemy.body,
        secondBody: asteroid.body,
        firstVelocity: enemy.knockbackVelocity,
        secondVelocity: asteroid.velocity,
        firstTotalVelocity: input.getEnemyTotalVelocity(enemy),
        secondTotalVelocity: asteroid.velocity,
        firstMass: getEnemyMass(enemy),
        secondMass: input.getAsteroidMass(asteroid.tier),
        firstRadius: enemyHitRadius,
        secondRadius: asteroidRadius,
        firstSource: 'enemy',
        secondSource: 'asteroid',
        firstMaxSpeed: input.getGlobalMaxSpeed(),
        secondMaxSpeed: input.getGlobalMaxSpeed(),
        time: input.time,
        damageFirst: (damage) => input.damageEnemyFromAsteroid(enemy, damage),
        damageSecond: (damage) => input.damageAsteroidFromEnemy(asteroid, damage),
        collisionNormal: collision.normal,
        collisionPenetration: collision.penetration,
        collisionOffset: collision.offset
      });
    }
  }
}

function resolveEnemyDebrisImpactCollisions(input: ResolveWorldImpactCollisionsInput): void {
  for (const enemy of input.enemies) {
    for (const debris of [...input.debris]) {
      const enemyHitRadius = input.getEnemyHitRadius(enemy);
      const debrisRadius = input.getDebrisCollisionRadius(debris);
      const collision = getEnemyCircleCollision(input, enemy, debris.body.x, debris.body.y, debrisRadius);
      if (
        !input.debris.includes(debris) ||
        !collision
      ) {
        continue;
      }

      input.resolveBodyImpactCollision({
        firstBody: enemy.body,
        secondBody: debris.body,
        firstVelocity: enemy.knockbackVelocity,
        secondVelocity: debris.velocity,
        firstTotalVelocity: input.getEnemyTotalVelocity(enemy),
        secondTotalVelocity: debris.velocity,
        firstMass: getEnemyMass(enemy),
        secondMass: debris.mass,
        firstRadius: enemyHitRadius,
        secondRadius: debrisRadius,
        firstSource: 'enemy',
        secondSource: 'debris',
        firstMaxSpeed: input.getGlobalMaxSpeed(),
        secondMaxSpeed: input.getGlobalMaxSpeed(),
        time: input.time,
        damageFirst: (damage) => input.damageEnemyFromDebris(enemy, damage),
        damageSecond: (damage) => input.damageDebrisFromEnemy(debris, damage),
        collisionNormal: collision.normal,
        collisionPenetration: collision.penetration,
        collisionOffset: collision.offset
      });
    }
  }
}

function resolveAsteroidDebrisImpactCollisions(input: ResolveWorldImpactCollisionsInput): void {
  for (const asteroid of [...input.asteroids]) {
    for (const debris of [...input.debris]) {
      const asteroidRadius = input.getAsteroidCollisionRadius(asteroid);
      const debrisRadius = input.getDebrisCollisionRadius(debris);
      const collision = getCircleCollision(
        input.arena,
        { x: asteroid.body.x, y: asteroid.body.y, radius: asteroidRadius },
        { x: debris.body.x, y: debris.body.y, radius: debrisRadius }
      );
      if (
        !input.asteroids.includes(asteroid) ||
        !input.debris.includes(debris) ||
        !collision
      ) {
        continue;
      }

      input.resolveBodyImpactCollision({
        firstBody: asteroid.body,
        secondBody: debris.body,
        firstVelocity: asteroid.velocity,
        secondVelocity: debris.velocity,
        firstTotalVelocity: asteroid.velocity,
        secondTotalVelocity: debris.velocity,
        firstMass: input.getAsteroidMass(asteroid.tier),
        secondMass: debris.mass,
        firstRadius: asteroidRadius,
        secondRadius: debrisRadius,
        firstSource: 'asteroid',
        secondSource: 'debris',
        firstMaxSpeed: input.getGlobalMaxSpeed(),
        secondMaxSpeed: input.getGlobalMaxSpeed(),
        time: input.time,
        damageFirst: (damage) => input.damageAsteroidFromDebris(asteroid, damage),
        damageSecond: (damage) => input.damageDebrisFromAsteroid(debris, damage),
        collisionNormal: collision.normal,
        collisionPenetration: collision.penetration,
        collisionOffset: collision.offset
      });
    }
  }
}

function getEnemyCircleCollision(
  input: ResolveWorldImpactCollisionsInput,
  enemy: WorldEnemy,
  circleX: number,
  circleY: number,
  circleRadius: number
): ShapeCollisionResult | undefined {
  if (isLiveEnemy(enemy)) {
    return getCircleCollision(
      input.arena,
      {
        x: enemy.body.x,
        y: enemy.body.y,
        radius: enemy.definition.stats.radius * input.getEnemyCollisionScale()
      },
      {
        x: circleX,
        y: circleY,
        radius: circleRadius
      }
    );
  }

  const forward = new Phaser.Math.Vector2(Math.cos(enemy.body.rotation - Math.PI / 2), Math.sin(enemy.body.rotation - Math.PI / 2));
  const right = new Phaser.Math.Vector2(-forward.y, forward.x);
  const enemyScale = input.getEnemyCollisionScale();

  return getCapsuleCircleCollision(
    input.arena,
    {
      x: enemy.body.x,
      y: enemy.body.y,
      right,
      forward,
      halfWidth: scaleHalfExtent(enemy.stats.hitHalfWidth, enemyScale),
      halfLength: scaleHalfExtent(enemy.stats.hitHalfLength, enemyScale)
    },
    {
      x: circleX,
      y: circleY,
      radius: circleRadius
    }
  );
}

function getEnemyMass(enemy: WorldEnemy): number {
  return isLiveEnemy(enemy) ? enemy.definition.stats.mass ?? 1 : enemy.stats.mass;
}

function isLiveEnemy(enemy: WorldEnemy): enemy is EnemyLabInstance {
  return 'definition' in enemy;
}
