import Phaser from 'phaser';
import type { ArenaSize } from '../core/arena';

export interface WorldForceSource {
  x: number;
  y: number;
}

export interface WorldForceRadii {
  influenceRadius: number;
  damageRadius: number;
  captureRadius: number;
  eventHorizonRadius: number;
}

export interface WorldForceSample {
  direction: Phaser.Math.Vector2;
  distance: number;
  proximity: number;
  isInsideInfluence: boolean;
  isInsideDamage: boolean;
  isInsideCapture: boolean;
  isInsideEventHorizon: boolean;
}

export interface BlackHoleWhirlpoolTuning {
  radialBaseAcceleration: number;
  radialExtraAcceleration: number;
  swirlBaseAcceleration: number;
  swirlExtraAcceleration: number;
  maxSpeed: number;
  mass: number;
  massResistance: number;
}

export interface BlackHoleFieldTuningConfig {
  radialStrengthMultiplier: number;
  radialCurve: number;
  swirlStrengthMultiplier: number;
  swirlCurve: number;
  massResistanceMultiplier: number;
  maxVelocityMultiplier: number;
  viscosityStrength: number;
  viscosityCurve: number;
  innerDrag: number;
  playerResistance: number;
}

export interface BlackHoleWhirlpoolResult extends WorldForceSample {
  acceleration: Phaser.Math.Vector2;
  dragMultiplier: number;
}

export const DEFAULT_BLACK_HOLE_FIELD_TUNING: BlackHoleFieldTuningConfig = {
  radialStrengthMultiplier: 1,
  radialCurve: 2,
  swirlStrengthMultiplier: 1,
  swirlCurve: 2,
  massResistanceMultiplier: 1,
  maxVelocityMultiplier: 1,
  viscosityStrength: 0,
  viscosityCurve: 2,
  innerDrag: 0.88,
  playerResistance: 1
};

export function getWrappedDirection(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  arena: ArenaSize
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

export function getForceProximity(distance: number, influenceRadius: number, eventHorizonRadius: number): number {
  return Phaser.Math.Clamp(
    (influenceRadius - distance) / Math.max(1, influenceRadius - eventHorizonRadius),
    0,
    1
  );
}

export function sampleWorldForce(
  source: WorldForceSource & WorldForceRadii,
  objectX: number,
  objectY: number,
  arena: ArenaSize
): WorldForceSample {
  const direction = getWrappedDirection(objectX, objectY, source.x, source.y, arena);
  const distance = direction.length();

  return {
    direction,
    distance,
    proximity: getForceProximity(distance, source.influenceRadius, source.eventHorizonRadius),
    isInsideInfluence: distance < source.influenceRadius,
    isInsideDamage: distance < source.damageRadius,
    isInsideCapture: distance <= source.captureRadius,
    isInsideEventHorizon: distance <= source.eventHorizonRadius
  };
}

export function getMassResistanceScale(mass: number, massResistance: number): number {
  return 1 / (1 + Math.max(0, mass - 1) * Math.max(0, massResistance));
}

export function getProximityCurve(proximity: number, curve: number): number {
  return Math.pow(Phaser.Math.Clamp(proximity, 0, 1), Math.max(0, curve));
}

export function applyAccelerationToVelocity(
  velocity: Phaser.Math.Vector2,
  acceleration: Phaser.Math.Vector2,
  deltaSeconds: number
): void {
  velocity.x += acceleration.x * deltaSeconds;
  velocity.y += acceleration.y * deltaSeconds;
}

export function clampVelocity(velocity: Phaser.Math.Vector2, maxSpeed: number): void {
  velocity.limit(Math.max(0, maxSpeed));
}

export function applyBlackHoleFieldTuning(
  tuning: BlackHoleWhirlpoolTuning,
  fieldTuning: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
): BlackHoleWhirlpoolTuning {
  return {
    radialBaseAcceleration: tuning.radialBaseAcceleration * fieldTuning.radialStrengthMultiplier,
    radialExtraAcceleration: tuning.radialExtraAcceleration * fieldTuning.radialStrengthMultiplier,
    swirlBaseAcceleration: tuning.swirlBaseAcceleration * fieldTuning.swirlStrengthMultiplier,
    swirlExtraAcceleration: tuning.swirlExtraAcceleration * fieldTuning.swirlStrengthMultiplier,
    maxSpeed: tuning.maxSpeed * fieldTuning.maxVelocityMultiplier,
    mass: tuning.mass,
    massResistance: tuning.massResistance * fieldTuning.massResistanceMultiplier
  };
}

export function computeBlackHoleViscosityDrag(
  proximity: number,
  fieldTuning: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
): number {
  const viscosity = Math.max(0, fieldTuning.viscosityStrength);

  if (viscosity <= 0) {
    return 1;
  }

  const curve = getProximityCurve(proximity, fieldTuning.viscosityCurve);
  const innerDrag = Math.min(1, fieldTuning.innerDrag);
  const dragFloor = Phaser.Math.Linear(1, innerDrag, Math.min(1, viscosity));
  const extraDrag = Math.max(0, viscosity - 1);

  return Math.max(0, Phaser.Math.Linear(1, dragFloor, curve) - extraDrag * curve * 0.08);
}

export function computeBlackHoleWhirlpoolForce(
  source: WorldForceSource & WorldForceRadii,
  objectX: number,
  objectY: number,
  velocity: Phaser.Math.Vector2,
  tuning: BlackHoleWhirlpoolTuning,
  arena: ArenaSize,
  fieldTuning: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
): BlackHoleWhirlpoolResult {
  const sample = sampleWorldForce(source, objectX, objectY, arena);
  const acceleration = new Phaser.Math.Vector2(0, 0);
  const dragMultiplier = computeBlackHoleViscosityDrag(sample.proximity, fieldTuning);

  if (sample.distance <= 0 || !sample.isInsideInfluence) {
    return { ...sample, acceleration, dragMultiplier: 1 };
  }

  const activeTuning = applyBlackHoleFieldTuning(tuning, fieldTuning);
  const inward = sample.direction.clone().scale(1 / sample.distance);
  const tangent = new Phaser.Math.Vector2(-inward.y, inward.x);
  const orbitSign = velocity.lengthSq() > 0 && velocity.dot(tangent) < 0 ? -1 : 1;
  const radialCurve = getProximityCurve(sample.proximity, fieldTuning.radialCurve);
  const swirlCurve = getProximityCurve(sample.proximity, fieldTuning.swirlCurve);
  const massScale = getMassResistanceScale(activeTuning.mass, activeTuning.massResistance);
  const radialAcceleration =
    (activeTuning.radialBaseAcceleration + radialCurve * activeTuning.radialExtraAcceleration) * massScale;
  const tangentialAcceleration =
    (activeTuning.swirlBaseAcceleration + swirlCurve * activeTuning.swirlExtraAcceleration) * massScale;

  acceleration.set(
    inward.x * radialAcceleration + tangent.x * tangentialAcceleration * orbitSign,
    inward.y * radialAcceleration + tangent.y * tangentialAcceleration * orbitSign
  );

  return { ...sample, acceleration, dragMultiplier };
}

export function applyBlackHoleWhirlpoolForce(
  source: WorldForceSource & WorldForceRadii,
  objectX: number,
  objectY: number,
  velocity: Phaser.Math.Vector2,
  deltaSeconds: number,
  tuning: BlackHoleWhirlpoolTuning,
  arena: ArenaSize,
  fieldTuning: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
): BlackHoleWhirlpoolResult {
  const result = computeBlackHoleWhirlpoolForce(source, objectX, objectY, velocity, tuning, arena, fieldTuning);

  if (result.isInsideInfluence) {
    applyAccelerationToVelocity(velocity, result.acceleration, deltaSeconds);
    velocity.scale(Math.pow(result.dragMultiplier, deltaSeconds * 60));
    clampVelocity(velocity, applyBlackHoleFieldTuning(tuning, fieldTuning).maxSpeed);
  }

  return result;
}
