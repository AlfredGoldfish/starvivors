import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  ASTEROID_FRAGMENT_BURST_MAX_SPEED,
  ASTEROID_FRAGMENT_BURST_MIN_SPEED,
  ASTEROID_COLLISION_IMPULSE_SPEED_SCALE,
  ASTEROID_COLLISION_MAX_IMPULSE,
  ASTEROID_COLLISION_MAX_SEPARATION,
  ASTEROID_COLLISION_MIN_IMPULSE,
  ASTEROID_COLLISION_RESTITUTION,
  ASTEROID_COLLISION_SEPARATION_PERCENT,
  ASTEROID_PARENT_VELOCITY_INHERITANCE,
  ASTEROID_TIER_CONFIG,
  ASTEROID_TIERS
} from '../scenes/gameConstants';
import type {
  AsteroidBreakupProfile,
  AsteroidBreakupProfileMode,
  AsteroidTier,
  BasicAsteroid
} from '../scenes/gameTypes';
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

export interface SpawnAsteroidFragmentsInput {
  arena: ArenaSize;
  asteroids: BasicAsteroid[];
  x: number;
  y: number;
  parentVelocity: Phaser.Math.Vector2;
  breakupProfile: AsteroidBreakupProfile;
  fragmentTiers: AsteroidTier[];
  getGlobalMaxSpeed: () => number;
  createAsteroidInstance: (x: number, y: number, tier: AsteroidTier, velocity: Phaser.Math.Vector2) => BasicAsteroid;
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

export function createAsteroidBreakupProfile(tier: AsteroidTier): AsteroidBreakupProfile {
  const modeRoll = Phaser.Math.Between(0, 3);
  const mode: AsteroidBreakupProfileMode =
    modeRoll === 0 ? 'many-small' : modeRoll === 1 ? 'balanced' : modeRoll === 2 ? 'few-large' : 'single-tier';
  const lowerTiers = getLowerAsteroidTiers(tier);

  return {
    mode,
    preferredTier:
      mode === 'single-tier' && lowerTiers.length > 0
        ? lowerTiers[Phaser.Math.Between(0, lowerTiers.length - 1)]
        : undefined,
    burstMultiplier: Phaser.Math.FloatBetween(0.85, 1.22),
    spreadMultiplier: Phaser.Math.FloatBetween(0.82, 1.28)
  };
}

export function createAsteroidFragmentTiers(
  parentTier: AsteroidTier,
  breakupProfile: AsteroidBreakupProfile
): AsteroidTier[] {
  if (parentTier === 1) {
    return [];
  }

  if (breakupProfile.mode === 'single-tier' && breakupProfile.preferredTier) {
    return createSingleTierAsteroidFragments(parentTier, breakupProfile.preferredTier);
  }

  const mixedMode = breakupProfile.mode === 'single-tier' ? 'balanced' : breakupProfile.mode;
  const fragments: AsteroidTier[] = [];
  let remainingMass = ASTEROID_TIER_CONFIG[parentTier].massBudget;

  while (remainingMass > 0) {
    const validTiers = getLowerAsteroidTiers(parentTier).filter(
      (tier) => ASTEROID_TIER_CONFIG[tier].massBudget <= remainingMass
    );

    if (validTiers.length === 0) {
      break;
    }

    const tier = pickAsteroidFragmentTier(validTiers, mixedMode);
    fragments.push(tier);
    remainingMass -= ASTEROID_TIER_CONFIG[tier].massBudget;
  }

  return fragments;
}

export function spawnAsteroidFragments(input: SpawnAsteroidFragmentsInput): void {
  const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

  for (let i = 0; i < input.fragmentTiers.length; i += 1) {
    const fragmentTier = input.fragmentTiers[i];
    const fragmentConfig = ASTEROID_TIER_CONFIG[fragmentTier];
    const angle =
      baseAngle +
      (Math.PI * 2 * i) / input.fragmentTiers.length +
      Phaser.Math.FloatBetween(-0.22, 0.22);
    const offsetDistance =
      Phaser.Math.FloatBetween(8, fragmentConfig.displaySize * 0.38) * input.breakupProfile.spreadMultiplier;
    const burstSpeed =
      Phaser.Math.FloatBetween(ASTEROID_FRAGMENT_BURST_MIN_SPEED, ASTEROID_FRAGMENT_BURST_MAX_SPEED) *
      input.breakupProfile.burstMultiplier;
    const velocity = input.parentVelocity
      .clone()
      .scale(ASTEROID_PARENT_VELOCITY_INHERITANCE)
      .add(new Phaser.Math.Vector2(Math.cos(angle) * burstSpeed, Math.sin(angle) * burstSpeed));

    velocity.limit(input.getGlobalMaxSpeed());

    input.asteroids.push(
      input.createAsteroidInstance(
        wrapCoordinate(input.x + Math.cos(angle) * offsetDistance, input.arena.width),
        wrapCoordinate(input.y + Math.sin(angle) * offsetDistance, input.arena.height),
        fragmentTier,
        velocity
      )
    );
  }
}

export function destroyAsteroidRenderObjects(asteroid: BasicAsteroid): void {
  asteroid.body.destroy(true);
  asteroid.wrapMirrorBody.destroy(true);
}

export function clearBasicAsteroids(asteroids: BasicAsteroid[]): BasicAsteroid[] {
  for (const asteroid of asteroids) {
    destroyAsteroidRenderObjects(asteroid);
  }

  return [];
}

function createSingleTierAsteroidFragments(parentTier: AsteroidTier, fragmentTier: AsteroidTier): AsteroidTier[] {
  const parentMass = ASTEROID_TIER_CONFIG[parentTier].massBudget;
  const fragmentMass = ASTEROID_TIER_CONFIG[fragmentTier].massBudget;
  const fragmentCount = Math.floor(parentMass / fragmentMass);

  return Array.from({ length: fragmentCount }, () => fragmentTier);
}

function pickAsteroidFragmentTier(
  validTiers: AsteroidTier[],
  mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
): AsteroidTier {
  const weightedTiers: AsteroidTier[] = [];

  for (const tier of validTiers) {
    const weight = getAsteroidFragmentTierWeight(tier, validTiers, mode);

    for (let i = 0; i < weight; i += 1) {
      weightedTiers.push(tier);
    }
  }

  return weightedTiers[Phaser.Math.Between(0, weightedTiers.length - 1)];
}

function getAsteroidFragmentTierWeight(
  tier: AsteroidTier,
  validTiers: AsteroidTier[],
  mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
): number {
  const minTier = Math.min(...validTiers);
  const maxTier = Math.max(...validTiers);

  if (mode === 'many-small') {
    return maxTier - tier + 1;
  }

  if (mode === 'few-large') {
    return tier - minTier + 1;
  }

  return 1;
}

function getLowerAsteroidTiers(tier: AsteroidTier): AsteroidTier[] {
  return ASTEROID_TIERS.filter((candidateTier) => candidateTier < tier);
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
