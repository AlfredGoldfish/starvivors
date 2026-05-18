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
import type { DebugImpactSourceType } from './debug/debugState';
import {
  applyCollisionImpulse,
  getClosingSpeed,
  getMassResponseShare,
  getRelativeVelocity
} from './physics';

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
}

export function resolveBodyImpactCollision(input: ResolveBodyImpactCollisionInput): void {
  if (!input.canApplyWorldCollisionDamage(input.firstBody, input.secondBody, input.time)) {
    return;
  }

  const offset = getWrappedDirection(
    input.arena,
    input.secondBody.x,
    input.secondBody.y,
    input.firstBody.x,
    input.firstBody.y
  );
  const normal = input.getCollisionNormal(offset);
  const relativeVelocity = getRelativeVelocity(input.firstTotalVelocity, input.secondTotalVelocity);
  const closingSpeed = getClosingSpeed(relativeVelocity, normal);
  const hitRadius = input.firstRadius + input.secondRadius;
  const penetration = Math.max(0, hitRadius - offset.length());
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
