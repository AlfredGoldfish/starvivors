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
  createCircleCollisionShape,
  createOrientedCapsuleCollisionShape,
  getCapsuleCircleCollision,
  getCircleCollision,
  getWrappedDirection,
  scaleHalfExtent,
  type ShapeCollisionResult
} from './collisionShapes';
import {
  applyCollisionImpulse,
  getClosingSpeed,
  getRelativeVelocity
} from './physics';
import { buildSpatialHash, querySpatialHash, type SpatialHashGrid } from './spatialHash';

type WorldEnemy = BasicEnemy | ShooterEnemy | TankEnemy | EnemyLabInstance;
type BodyImpactCollisionRequest = Pick<
  ResolveBodyImpactCollisionInput,
  | 'firstBody'
  | 'secondBody'
  | 'firstVelocity'
  | 'secondVelocity'
  | 'firstTotalVelocity'
  | 'secondTotalVelocity'
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
  const asteroidRadii = new Map<BasicAsteroid, number>();
  const debrisRadii = new Map<EnemyWreckageDebris, number>();
  let maxAsteroidRadius = 0;
  let maxDebrisRadius = 0;

  for (const asteroid of input.asteroids) {
    const radius = input.getAsteroidCollisionRadius(asteroid);
    asteroidRadii.set(asteroid, radius);
    maxAsteroidRadius = Math.max(maxAsteroidRadius, radius);
  }

  for (const debris of input.debris) {
    const radius = input.getDebrisCollisionRadius(debris);
    debrisRadii.set(debris, radius);
    maxDebrisRadius = Math.max(maxDebrisRadius, radius);
  }

  const asteroidSpatialHash = buildSpatialHash(
    input.arena,
    input.asteroids.map((asteroid) => ({
      target: asteroid,
      x: asteroid.body.x,
      y: asteroid.body.y
    })),
    Math.max(240, maxAsteroidRadius * 2.5)
  );
  const debrisSpatialHash = buildSpatialHash(
    input.arena,
    input.debris.map((debris) => ({
      target: debris,
      x: debris.body.x,
      y: debris.body.y
    })),
    Math.max(180, maxDebrisRadius * 4)
  );
  const spatialContext: WorldImpactSpatialContext = {
    asteroidRadii,
    debrisRadii,
    maxAsteroidRadius,
    maxDebrisRadius,
    asteroidSpatialHash,
    debrisSpatialHash
  };

  resolveEnemyAsteroidImpactCollisions(input, spatialContext);
  resolveEnemyDebrisImpactCollisions(input, spatialContext);
  resolveAsteroidDebrisImpactCollisions(input, spatialContext);
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

  input.nudgeWrappedObject(input.firstBody, normal, separation * 0.5);
  input.nudgeWrappedObject(input.secondBody, normal, -separation * 0.5);
  applyCollisionImpulse({
    normal,
    firstVelocity: input.firstVelocity,
    secondVelocity: input.secondVelocity,
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
    impactSpeed: closingSpeed
  });
  const damageToSecond = input.calculatePhysicalImpactDamage({
    source: input.firstSource,
    baseDamage: 0,
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

interface WorldImpactSpatialContext {
  asteroidRadii: Map<BasicAsteroid, number>;
  debrisRadii: Map<EnemyWreckageDebris, number>;
  maxAsteroidRadius: number;
  maxDebrisRadius: number;
  asteroidSpatialHash: SpatialHashGrid<BasicAsteroid>;
  debrisSpatialHash: SpatialHashGrid<EnemyWreckageDebris>;
}

function resolveEnemyAsteroidImpactCollisions(
  input: ResolveWorldImpactCollisionsInput,
  spatialContext: WorldImpactSpatialContext
): void {
  for (const enemy of input.enemies) {
    if (!isActiveWorldEnemy(enemy)) {
      continue;
    }

    const enemyHitRadius = input.getEnemyHitRadius(enemy);
    const nearbyAsteroids = querySpatialHash(
      spatialContext.asteroidSpatialHash,
      enemy.body.x,
      enemy.body.y,
      enemyHitRadius + spatialContext.maxAsteroidRadius
    );

    for (const asteroid of nearbyAsteroids) {
      if (!isActiveWorldEnemy(enemy)) {
        break;
      }

      const asteroidRadius = spatialContext.asteroidRadii.get(asteroid) ?? input.getAsteroidCollisionRadius(asteroid);
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

function resolveEnemyDebrisImpactCollisions(
  input: ResolveWorldImpactCollisionsInput,
  spatialContext: WorldImpactSpatialContext
): void {
  for (const enemy of input.enemies) {
    if (!isActiveWorldEnemy(enemy)) {
      continue;
    }

    const enemyHitRadius = input.getEnemyHitRadius(enemy);
    const nearbyDebris = querySpatialHash(
      spatialContext.debrisSpatialHash,
      enemy.body.x,
      enemy.body.y,
      enemyHitRadius + spatialContext.maxDebrisRadius
    );

    for (const debris of nearbyDebris) {
      if (!isActiveWorldEnemy(enemy)) {
        break;
      }

      const debrisRadius = spatialContext.debrisRadii.get(debris) ?? input.getDebrisCollisionRadius(debris);
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

function resolveAsteroidDebrisImpactCollisions(
  input: ResolveWorldImpactCollisionsInput,
  spatialContext: WorldImpactSpatialContext
): void {
  for (const asteroid of input.asteroids) {
    const asteroidRadius = spatialContext.asteroidRadii.get(asteroid) ?? input.getAsteroidCollisionRadius(asteroid);
    const nearbyDebris = querySpatialHash(
      spatialContext.debrisSpatialHash,
      asteroid.body.x,
      asteroid.body.y,
      asteroidRadius + spatialContext.maxDebrisRadius
    );

    for (const debris of nearbyDebris) {
      const debrisRadius = spatialContext.debrisRadii.get(debris) ?? input.getDebrisCollisionRadius(debris);
      const collision = getCircleCollision(
        input.arena,
        createCircleCollisionShape(asteroid.body, asteroidRadius),
        createCircleCollisionShape(debris.body, debrisRadius)
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
      createCircleCollisionShape(enemy.body, enemy.definition.stats.radius * input.getEnemyCollisionScale()),
      { x: circleX, y: circleY, radius: circleRadius }
    );
  }

  const enemyScale = input.getEnemyCollisionScale();

  return getCapsuleCircleCollision(
    input.arena,
    createOrientedCapsuleCollisionShape({
      body: enemy.body,
      halfWidth: scaleHalfExtent(enemy.stats.hitHalfWidth, enemyScale),
      halfLength: scaleHalfExtent(enemy.stats.hitHalfLength, enemyScale)
    }),
    {
      x: circleX,
      y: circleY,
      radius: circleRadius
    }
  );
}

function isLiveEnemy(enemy: WorldEnemy): enemy is EnemyLabInstance {
  return 'definition' in enemy;
}

function isActiveWorldEnemy(enemy: WorldEnemy): boolean {
  return Boolean(enemy.body.scene && enemy.wrapMirrorBody.scene);
}
