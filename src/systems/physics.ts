import Phaser from 'phaser';

export interface PhysicsBodyLike {
  velocity: Phaser.Math.Vector2;
  mass: number;
  maxSpeed?: number;
}

export interface ImpactDamageInput {
  baseDamage: number;
  attackerMass: number;
  targetMass: number;
  impactSpeed: number;
  minImpactSpeed: number;
  speedDamageScale: number;
  massDamageScale: number;
  minDamage: number;
  maxDamage: number;
  multiplier?: number;
}

export interface CollisionImpulseInput {
  normal: Phaser.Math.Vector2;
  firstVelocity: Phaser.Math.Vector2;
  secondVelocity: Phaser.Math.Vector2;
  firstMass: number;
  secondMass: number;
  minImpulse: number;
  maxImpulse: number;
  relativeSpeedScale: number;
  firstMaxSpeed?: number;
  secondMaxSpeed?: number;
  firstImpulseScale?: number;
  secondImpulseScale?: number;
  restitution?: number;
  relativeVelocity?: Phaser.Math.Vector2;
}

export interface CollisionImpulseResult {
  impulse: number;
  closingSpeed: number;
  firstShare: number;
  secondShare: number;
}

export interface MassAccelerationInput {
  velocity: Phaser.Math.Vector2;
  acceleration: Phaser.Math.Vector2;
  mass: number;
  deltaSeconds: number;
  referenceMass?: number;
  massExponent?: number;
  accelerationScale?: number;
  maxSpeed?: number;
}

export interface VelocitySteeringInput {
  velocity: Phaser.Math.Vector2;
  targetVelocity: Phaser.Math.Vector2;
  response: number;
  deltaSeconds: number;
  mass?: number;
  referenceMass?: number;
  massExponent?: number;
  maxSpeed?: number;
}

const MIN_MASS = 0.001;

export function getRelativeVelocity(
  firstVelocity: Phaser.Math.Vector2,
  secondVelocity: Phaser.Math.Vector2
): Phaser.Math.Vector2 {
  return firstVelocity.clone().subtract(secondVelocity);
}

export function getRelativeSpeed(
  firstVelocity: Phaser.Math.Vector2,
  secondVelocity: Phaser.Math.Vector2
): number {
  return getRelativeVelocity(firstVelocity, secondVelocity).length();
}

export function getClosingSpeed(relativeVelocity: Phaser.Math.Vector2, collisionNormal: Phaser.Math.Vector2): number {
  return Math.max(0, -relativeVelocity.dot(collisionNormal));
}

export function getMassResponseShare(otherMass: number, selfMass: number): number {
  const safeOtherMass = Math.max(MIN_MASS, otherMass);
  const safeSelfMass = Math.max(MIN_MASS, selfMass);

  return safeOtherMass / (safeSelfMass + safeOtherMass);
}

export function getEffectiveImpactMass(attackerMass: number, targetMass: number): number {
  const safeAttackerMass = Math.max(MIN_MASS, attackerMass);
  const safeTargetMass = Math.max(MIN_MASS, targetMass);

  return (safeAttackerMass * safeTargetMass) / (safeAttackerMass + safeTargetMass);
}

export function calculateImpactDamage(input: ImpactDamageInput): number {
  const speedOverThreshold = Math.max(0, input.impactSpeed - input.minImpactSpeed);

  if (speedOverThreshold <= 0 && input.baseDamage <= 0) {
    return 0;
  }

  const effectiveMass = getEffectiveImpactMass(input.attackerMass, input.targetMass);
  const massFactor = 1 + effectiveMass * Math.max(0, input.massDamageScale);
  const multiplier = input.multiplier ?? 1;
  const damage = (Math.max(0, input.baseDamage) + speedOverThreshold * input.speedDamageScale * massFactor) * multiplier;

  return Phaser.Math.Clamp(damage, input.minDamage, input.maxDamage);
}

export function clampVelocity(velocity: Phaser.Math.Vector2, maxSpeed: number): void {
  velocity.limit(Math.max(0, maxSpeed));
}

export function getMassAccelerationScale(mass: number, referenceMass = 1, massExponent = 1): number {
  const safeMass = Math.max(MIN_MASS, mass);
  const safeReferenceMass = Math.max(MIN_MASS, referenceMass);

  return Math.pow(safeReferenceMass / safeMass, Math.max(0, massExponent));
}

export function applyAccelerationWithMass(input: MassAccelerationInput): void {
  const massScale = getMassAccelerationScale(input.mass, input.referenceMass, input.massExponent);
  const accelerationScale = input.accelerationScale ?? 1;

  input.velocity.x += input.acceleration.x * massScale * accelerationScale * input.deltaSeconds;
  input.velocity.y += input.acceleration.y * massScale * accelerationScale * input.deltaSeconds;

  if (input.maxSpeed !== undefined) {
    clampVelocity(input.velocity, input.maxSpeed);
  }
}

export function steerVelocityToward(input: VelocitySteeringInput): void {
  const massScale = input.mass === undefined
    ? 1
    : getMassAccelerationScale(input.mass, input.referenceMass, input.massExponent);
  const blend = 1 - Math.exp(-Math.max(0, input.response) * massScale * input.deltaSeconds);

  input.velocity.x = Phaser.Math.Linear(input.velocity.x, input.targetVelocity.x, blend);
  input.velocity.y = Phaser.Math.Linear(input.velocity.y, input.targetVelocity.y, blend);

  if (input.maxSpeed !== undefined) {
    clampVelocity(input.velocity, input.maxSpeed);
  }
}

export function applyCollisionImpulse(input: CollisionImpulseInput): CollisionImpulseResult {
  const relativeVelocity = input.relativeVelocity ?? getRelativeVelocity(input.firstVelocity, input.secondVelocity);
  const closingSpeed = getClosingSpeed(relativeVelocity, input.normal);
  const impulse = Phaser.Math.Clamp(
    input.minImpulse + closingSpeed * input.relativeSpeedScale,
    input.minImpulse,
    input.maxImpulse
  );
  const firstShare = getMassResponseShare(input.secondMass, input.firstMass);
  const secondShare = getMassResponseShare(input.firstMass, input.secondMass);
  const firstImpulseScale = input.firstImpulseScale ?? 1;
  const secondImpulseScale = input.secondImpulseScale ?? 1;
  const restitution = input.restitution ?? 1;

  input.firstVelocity.x += input.normal.x * impulse * firstShare * firstImpulseScale;
  input.firstVelocity.y += input.normal.y * impulse * firstShare * firstImpulseScale;
  input.secondVelocity.x -= input.normal.x * impulse * secondShare * secondImpulseScale * restitution;
  input.secondVelocity.y -= input.normal.y * impulse * secondShare * secondImpulseScale * restitution;

  if (input.firstMaxSpeed !== undefined) {
    clampVelocity(input.firstVelocity, input.firstMaxSpeed);
  }

  if (input.secondMaxSpeed !== undefined) {
    clampVelocity(input.secondVelocity, input.secondMaxSpeed);
  }

  return {
    impulse,
    closingSpeed,
    firstShare,
    secondShare
  };
}
