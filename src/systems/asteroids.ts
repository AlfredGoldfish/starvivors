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
  AsteroidBreakupMotionMode,
  AsteroidBreakupProfileMode,
  AsteroidTier,
  BasicAsteroid
} from '../scenes/gameTypes';
import {
  applyCollisionImpulse,
  getRelativeVelocity
} from './physics';
import { buildSpatialHash, querySpatialHash } from './spatialHash';

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
  getAsteroidCollisionRadius: (asteroid: BasicAsteroid) => number;
  getGlobalMaxSpeed: () => number;
  nudgeWrappedObject: (object: Phaser.GameObjects.Container, normal: Phaser.Math.Vector2, distance: number) => void;
  updateAsteroidWrapMirror: (asteroid: BasicAsteroid) => void;
  canApplyAsteroidCollisionDamage: (first: BasicAsteroid, second: BasicAsteroid, time: number) => boolean;
  markAsteroidCollisionDamageApplied: (first: BasicAsteroid, second: BasicAsteroid, time: number) => void;
  rollAsteroidCollisionDamage: (tier: AsteroidTier) => number;
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
  const asteroidRadii = new Map<BasicAsteroid, number>();
  let maxAsteroidRadius = 0;

  for (const asteroid of input.asteroids) {
    const radius = input.getAsteroidCollisionRadius(asteroid);
    asteroidRadii.set(asteroid, radius);
    maxAsteroidRadius = Math.max(maxAsteroidRadius, radius);
  }

  const spatialHash = buildSpatialHash(
    input.arena,
    input.asteroids.map((asteroid) => ({
      target: asteroid,
      x: asteroid.body.x,
      y: asteroid.body.y
    })),
    Math.max(240, maxAsteroidRadius * 2.5)
  );
  const asteroidIndexes = new Map(input.asteroids.map((asteroid, index) => [asteroid, index]));

  for (let i = 0; i < input.asteroids.length; i += 1) {
    const first = input.asteroids[i];
    if (destroyedAsteroids.has(first)) {
      continue;
    }

    const firstRadius = asteroidRadii.get(first) ?? input.getAsteroidCollisionRadius(first);
    const nearbyAsteroids = querySpatialHash(spatialHash, first.body.x, first.body.y, firstRadius + maxAsteroidRadius);

    for (const second of nearbyAsteroids) {
      const secondIndex = asteroidIndexes.get(second) ?? -1;
      if (secondIndex <= i || destroyedAsteroids.has(second)) {
        continue;
      }

      const offset = getWrappedDirection(input.arena, second.body.x, second.body.y, first.body.x, first.body.y);
      const hitRadius = firstRadius + (asteroidRadii.get(second) ?? input.getAsteroidCollisionRadius(second));
      const distance = offset.length();

      if (distance > hitRadius) {
        continue;
      }

      const normal = input.getCollisionNormal(offset);
      const penetration = hitRadius - distance;
      const separation = Math.min(
        penetration * ASTEROID_COLLISION_SEPARATION_PERCENT,
        ASTEROID_COLLISION_MAX_SEPARATION
      );

      input.nudgeWrappedObject(first.body, normal, separation * 0.5);
      input.nudgeWrappedObject(second.body, normal, -separation * 0.5);
      input.updateAsteroidWrapMirror(first);
      input.updateAsteroidWrapMirror(second);

      const relativeVelocity = getRelativeVelocity(first.velocity, second.velocity);

      applyCollisionImpulse({
        normal,
        firstVelocity: first.velocity,
        secondVelocity: second.velocity,
        minImpulse: ASTEROID_COLLISION_MIN_IMPULSE * input.asteroidCollisionImpulseScale,
        maxImpulse: ASTEROID_COLLISION_MAX_IMPULSE * input.asteroidCollisionImpulseScale,
        relativeSpeedScale: ASTEROID_COLLISION_IMPULSE_SPEED_SCALE * input.asteroidCollisionImpulseScale,
        firstMaxSpeed: input.getGlobalMaxSpeed(),
        secondMaxSpeed: input.getGlobalMaxSpeed(),
        restitution: ASTEROID_COLLISION_RESTITUTION,
        relativeVelocity
      });

      if (!input.canApplyAsteroidCollisionDamage(first, second, input.time)) {
        continue;
      }

      input.damageAsteroid(first, input.rollAsteroidCollisionDamage(second.tier));
      input.damageAsteroid(second, input.rollAsteroidCollisionDamage(first.tier));
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
    motionMode: pickAsteroidBreakupMotionMode(),
    preferredTier:
      mode === 'single-tier' && lowerTiers.length > 0
        ? lowerTiers[Phaser.Math.Between(0, lowerTiers.length - 1)]
        : undefined,
    burstMultiplier: Phaser.Math.FloatBetween(0.72, 1.05),
    spreadMultiplier: Phaser.Math.FloatBetween(0.72, 1.08)
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
    return createTierRecipeAsteroidFragments(parentTier, breakupProfile.preferredTier);
  }

  const mixedMode = breakupProfile.mode === 'single-tier' ? 'balanced' : breakupProfile.mode;
  const fragments = pickAsteroidBreakupRecipe(parentTier, mixedMode);

  return fragments;
}

export function spawnAsteroidFragments(input: SpawnAsteroidFragmentsInput): void {
  const motionPlan = createAsteroidBreakupMotionPlan(input.breakupProfile.motionMode);

  for (let i = 0; i < input.fragmentTiers.length; i += 1) {
    const fragmentTier = input.fragmentTiers[i];
    const fragmentConfig = ASTEROID_TIER_CONFIG[fragmentTier];
    const motion = getAsteroidFragmentMotion(input.breakupProfile.motionMode, motionPlan, i, input.fragmentTiers.length);
    const offsetDistance =
      Phaser.Math.FloatBetween(8, fragmentConfig.displaySize * motion.offsetScale) * input.breakupProfile.spreadMultiplier;
    const burstSpeed =
      Phaser.Math.FloatBetween(ASTEROID_FRAGMENT_BURST_MIN_SPEED, ASTEROID_FRAGMENT_BURST_MAX_SPEED) *
      motion.speedScale *
      input.breakupProfile.burstMultiplier;
    const velocity = input.parentVelocity
      .clone()
      .scale(ASTEROID_PARENT_VELOCITY_INHERITANCE)
      .add(new Phaser.Math.Vector2(Math.cos(motion.angle) * burstSpeed, Math.sin(motion.angle) * burstSpeed));

    velocity.limit(input.getGlobalMaxSpeed());

    input.asteroids.push(
      input.createAsteroidInstance(
        wrapCoordinate(input.x + Math.cos(motion.angle) * offsetDistance, input.arena.width),
        wrapCoordinate(input.y + Math.sin(motion.angle) * offsetDistance, input.arena.height),
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

function createTierRecipeAsteroidFragments(parentTier: AsteroidTier, fragmentTier: AsteroidTier): AsteroidTier[] {
  const highestFragmentTier = getHighestBreakupFragmentTier(parentTier);
  const lowerTier = Math.min(highestFragmentTier, Math.max(1, fragmentTier)) as AsteroidTier;
  const tierDrop = parentTier - lowerTier;
  const fragmentCount = tierDrop <= 2 ? 5 : 7;

  return Array.from({ length: fragmentCount }, () => lowerTier);
}

function pickAsteroidBreakupRecipe(
  parentTier: AsteroidTier,
  mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
): AsteroidTier[] {
  const highTierRecipe = pickHighTierAsteroidBreakupRecipe(parentTier, mode);
  if (highTierRecipe) {
    return highTierRecipe;
  }

  const oneLower = Math.max(1, parentTier - 1) as AsteroidTier;
  const twoLower = Math.max(1, parentTier - 2) as AsteroidTier;
  const threeLower = Math.max(1, parentTier - 3) as AsteroidTier;

  if (mode === 'many-small') {
    return [oneLower, twoLower, twoLower, threeLower, threeLower, threeLower];
  }

  if (mode === 'few-large') {
    return [oneLower, oneLower, twoLower, twoLower, threeLower];
  }

  return [oneLower, oneLower, twoLower, twoLower, threeLower];
}

function pickHighTierAsteroidBreakupRecipe(
  parentTier: AsteroidTier,
  mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
): AsteroidTier[] | undefined {
  if (parentTier < 6) {
    return undefined;
  }

  if (mode === 'few-large') {
    return getClampedAsteroidRecipe(parentTier, [2, 2, 3, 3, 4]);
  }

  if (mode === 'many-small') {
    return getClampedAsteroidRecipe(parentTier, [3, 4, 4, 5, 5, 6]);
  }

  return getClampedAsteroidRecipe(parentTier, [3, 3, 4, 4, 5]);
}

function getClampedAsteroidRecipe(parentTier: AsteroidTier, tierDrops: number[]): AsteroidTier[] {
  return tierDrops.map((tierDrop) => Math.max(1, parentTier - tierDrop) as AsteroidTier);
}

function getHighestBreakupFragmentTier(parentTier: AsteroidTier): AsteroidTier {
  return Math.max(1, parentTier - (parentTier >= 6 ? 2 : 1)) as AsteroidTier;
}

function getLowerAsteroidTiers(tier: AsteroidTier): AsteroidTier[] {
  const highestFragmentTier = getHighestBreakupFragmentTier(tier);

  return ASTEROID_TIERS.filter((candidateTier) => candidateTier <= highestFragmentTier);
}

function pickAsteroidBreakupMotionMode(): AsteroidBreakupMotionMode {
  const roll = Phaser.Math.Between(1, 100);

  if (roll <= 40) {
    return 'crumble';
  }

  if (roll <= 70) {
    return 'shear';
  }

  if (roll <= 90) {
    return 'split';
  }

  return 'burst';
}

interface AsteroidBreakupMotionPlan {
  baseAngle: number;
  secondaryAngle: number;
  dominantIndex: number;
}

interface AsteroidFragmentMotion {
  angle: number;
  speedScale: number;
  offsetScale: number;
}

function createAsteroidBreakupMotionPlan(mode: AsteroidBreakupMotionMode): AsteroidBreakupMotionPlan {
  const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  const secondaryAngle =
    mode === 'split'
      ? baseAngle + Math.PI + Phaser.Math.FloatBetween(-0.42, 0.42)
      : baseAngle + Phaser.Math.FloatBetween(-0.8, 0.8);

  return {
    baseAngle,
    secondaryAngle,
    dominantIndex: Phaser.Math.Between(0, 100000)
  };
}

function getAsteroidFragmentMotion(
  mode: AsteroidBreakupMotionMode,
  plan: AsteroidBreakupMotionPlan,
  index: number,
  fragmentCount: number
): AsteroidFragmentMotion {
  const dominant = index === plan.dominantIndex % Math.max(1, fragmentCount);

  if (mode === 'crumble') {
    return {
      angle: plan.baseAngle + Phaser.Math.FloatBetween(-1.05, 1.05),
      speedScale: Phaser.Math.FloatBetween(0.18, dominant ? 0.52 : 0.38),
      offsetScale: Phaser.Math.FloatBetween(0.08, 0.22)
    };
  }

  if (mode === 'shear') {
    return {
      angle: plan.baseAngle + Phaser.Math.FloatBetween(-0.38, 0.38),
      speedScale: Phaser.Math.FloatBetween(0.3, dominant ? 0.9 : 0.62),
      offsetScale: Phaser.Math.FloatBetween(0.12, 0.28)
    };
  }

  if (mode === 'split') {
    const lobeAngle = index % 2 === 0 ? plan.baseAngle : plan.secondaryAngle;
    return {
      angle: lobeAngle + Phaser.Math.FloatBetween(-0.44, 0.44),
      speedScale: Phaser.Math.FloatBetween(0.35, dominant ? 0.96 : 0.72),
      offsetScale: Phaser.Math.FloatBetween(0.14, 0.32)
    };
  }

  return {
    angle: plan.baseAngle + (Math.PI * 2 * index) / Math.max(1, fragmentCount) + Phaser.Math.FloatBetween(-0.38, 0.38),
    speedScale: Phaser.Math.FloatBetween(0.55, dominant ? 1.16 : 0.9),
    offsetScale: Phaser.Math.FloatBetween(0.18, 0.36)
  };
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
