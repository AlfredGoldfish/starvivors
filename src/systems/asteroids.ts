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
import type { AsteroidTier, BasicAsteroid } from '../scenes/gameTypes';
import {
  applyCollisionImpulse,
  getClosingSpeed,
  getMassResponseShare,
  getRelativeVelocity
} from './physics';

export interface UpdateBasicAsteroidsInput {
  arena: ArenaSize;
  asteroids: BasicAsteroid[];
  deltaSeconds: number;
  time: number;
  validateAsteroidRenderState: (asteroid: BasicAsteroid) => void;
  applyBlackHoleToAsteroid: (
    asteroid: BasicAsteroid,
    index: number,
    deltaSeconds: number,
    time: number
  ) => boolean;
  updateAsteroidWrapMirror: (asteroid: BasicAsteroid) => void;
}

export interface ResolveAsteroidCollisionsInput {
  arena: ArenaSize;
  asteroids: BasicAsteroid[];
  time: number;
  asteroidCollisionImpulseScale: number;
  getCollisionNormal: (offset: Phaser.Math.Vector2) => Phaser.Math.Vector2;
  getAsteroidMass: (tier: AsteroidTier) => number;
  getGlobalMaxSpeed: () => number;
  nudgeWrappedObject: (object: Phaser.GameObjects.Container, normal: Phaser.Math.Vector2, distance: number) => void;
  updateAsteroidWrapMirror: (asteroid: BasicAsteroid) => void;
  canApplyAsteroidCollisionDamage: (first: BasicAsteroid, second: BasicAsteroid, time: number) => boolean;
  markAsteroidCollisionDamageApplied: (first: BasicAsteroid, second: BasicAsteroid, time: number) => void;
  calculateAsteroidImpactDamage: (firstMass: number, secondMass: number, closingSpeed: number) => number;
  damageAsteroid: (asteroid: BasicAsteroid, damage: number) => void;
  emitAsteroidImpactExplosion: (x: number, y: number, tier: AsteroidTier) => void;
  flashDamageSprites: (...containers: Phaser.GameObjects.Container[]) => void;
  destroyAsteroidsFromCollision: (destroyedAsteroids: Set<BasicAsteroid>) => void;
}

export function updateBasicAsteroidRuntime(input: UpdateBasicAsteroidsInput): void {
  for (let i = input.asteroids.length - 1; i >= 0; i -= 1) {
    const asteroid = input.asteroids[i];
    input.validateAsteroidRenderState(asteroid);

    if (input.applyBlackHoleToAsteroid(asteroid, i, input.deltaSeconds, input.time)) {
      continue;
    }

    asteroid.body.x = wrapCoordinate(asteroid.body.x + asteroid.velocity.x * input.deltaSeconds, input.arena.width);
    asteroid.body.y = wrapCoordinate(asteroid.body.y + asteroid.velocity.y * input.deltaSeconds, input.arena.height);
    asteroid.body.rotation += asteroid.rotationSpeed * input.deltaSeconds;
    input.updateAsteroidWrapMirror(asteroid);
  }
}

export function resolveAsteroidCollisions(input: ResolveAsteroidCollisionsInput): void {
  const destroyedAsteroids = new Set<BasicAsteroid>();

  for (let i = 0; i < input.asteroids.length; i += 1) {
    const first = input.asteroids[i];
    if (destroyedAsteroids.has(first)) {
      continue;
    }

    for (let j = i + 1; j < input.asteroids.length; j += 1) {
      const second = input.asteroids[j];
      if (destroyedAsteroids.has(second)) {
        continue;
      }

      const offset = getWrappedDirection(input.arena, second.body.x, second.body.y, first.body.x, first.body.y);
      const hitRadius = first.hitRadius + second.hitRadius;
      const distance = offset.length();

      if (distance > hitRadius) {
        continue;
      }

      const normal = input.getCollisionNormal(offset);
      const penetration = hitRadius - distance;
      const firstMass = input.getAsteroidMass(first.tier);
      const secondMass = input.getAsteroidMass(second.tier);
      const firstShare = getMassResponseShare(secondMass, firstMass);
      const secondShare = getMassResponseShare(firstMass, secondMass);
      const separation = Math.min(
        penetration * ASTEROID_COLLISION_SEPARATION_PERCENT,
        ASTEROID_COLLISION_MAX_SEPARATION
      );

      input.nudgeWrappedObject(first.body, normal, separation * firstShare);
      input.nudgeWrappedObject(second.body, normal, -separation * secondShare);
      input.updateAsteroidWrapMirror(first);
      input.updateAsteroidWrapMirror(second);

      if (!input.canApplyAsteroidCollisionDamage(first, second, input.time)) {
        continue;
      }

      const relativeVelocity = getRelativeVelocity(first.velocity, second.velocity);
      const closingSpeed = getClosingSpeed(relativeVelocity, normal);
      const impactDamage = input.calculateAsteroidImpactDamage(firstMass, secondMass, closingSpeed);

      applyCollisionImpulse({
        normal,
        firstVelocity: first.velocity,
        secondVelocity: second.velocity,
        firstMass,
        secondMass,
        minImpulse: ASTEROID_COLLISION_MIN_IMPULSE * input.asteroidCollisionImpulseScale,
        maxImpulse: ASTEROID_COLLISION_MAX_IMPULSE * input.asteroidCollisionImpulseScale,
        relativeSpeedScale: ASTEROID_COLLISION_IMPULSE_SPEED_SCALE * input.asteroidCollisionImpulseScale,
        firstMaxSpeed: input.getGlobalMaxSpeed(),
        secondMaxSpeed: input.getGlobalMaxSpeed(),
        restitution: ASTEROID_COLLISION_RESTITUTION,
        relativeVelocity
      });

      if (impactDamage <= 0) {
        input.markAsteroidCollisionDamageApplied(first, second, input.time);
        continue;
      }

      input.damageAsteroid(first, impactDamage);
      input.damageAsteroid(second, impactDamage);
      input.emitAsteroidImpactExplosion(
        wrapCoordinate((first.body.x + second.body.x) * 0.5, input.arena.width),
        wrapCoordinate((first.body.y + second.body.y) * 0.5, input.arena.height),
        Math.max(first.tier, second.tier) as AsteroidTier
      );
      input.flashDamageSprites(first.body, first.wrapMirrorBody, second.body, second.wrapMirrorBody);
      input.markAsteroidCollisionDamageApplied(first, second, input.time);

      if (first.hp <= 0) {
        destroyedAsteroids.add(first);
      }

      if (second.hp <= 0) {
        destroyedAsteroids.add(second);
      }
    }
  }

  input.destroyAsteroidsFromCollision(destroyedAsteroids);
}

function getWrappedDirection(
  arena: ArenaSize,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Phaser.Math.Vector2 {
  let x = toX - fromX;
  let y = toY - fromY;

  if (Math.abs(x) > arena.width / 2) {
    x -= Math.sign(x) * arena.width;
  }

  if (Math.abs(y) > arena.height / 2) {
    y -= Math.sign(y) * arena.height;
  }

  return new Phaser.Math.Vector2(x, y);
}
