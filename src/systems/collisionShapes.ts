import Phaser from 'phaser';
import type { ArenaSize } from '../core/arena';

export interface CircleCollisionShape {
  x: number;
  y: number;
  radius: number;
}

export interface OrientedCapsuleCollisionShape {
  x: number;
  y: number;
  right: Phaser.Math.Vector2;
  forward: Phaser.Math.Vector2;
  halfWidth: number;
  halfLength: number;
}

export interface ShapeCollisionResult {
  normal: Phaser.Math.Vector2;
  penetration: number;
  offset: Phaser.Math.Vector2;
}

export function scaleRadius(radius: number, scale: number): number {
  return Math.max(1, radius * scale);
}

export function scaleHalfExtent(halfExtent: number, scale: number): number {
  return Math.max(1, halfExtent * scale);
}

export function getWrappedDirection(
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

export function getCircleCollision(
  arena: ArenaSize,
  first: CircleCollisionShape,
  second: CircleCollisionShape
): ShapeCollisionResult | undefined {
  const offset = getWrappedDirection(arena, second.x, second.y, first.x, first.y);
  const hitRadius = first.radius + second.radius;
  const distanceSq = offset.lengthSq();

  if (distanceSq > hitRadius * hitRadius) {
    return undefined;
  }

  const distance = Math.sqrt(distanceSq);
  const normal = distance > 0 ? offset.clone().scale(1 / distance) : new Phaser.Math.Vector2(1, 0);

  return {
    normal,
    penetration: hitRadius - distance,
    offset
  };
}

export function getCapsuleCircleCollision(
  arena: ArenaSize,
  capsule: OrientedCapsuleCollisionShape,
  circle: CircleCollisionShape
): ShapeCollisionResult | undefined {
  const capsuleToCircle = getWrappedDirection(arena, capsule.x, capsule.y, circle.x, circle.y);
  const localX = capsuleToCircle.dot(capsule.right);
  const localY = capsuleToCircle.dot(capsule.forward);
  const capsuleRadius = Math.max(1, capsule.halfWidth);
  const segmentHalfLength = Math.max(0, capsule.halfLength - capsuleRadius);
  const closestLocalY = Phaser.Math.Clamp(localY, -segmentHalfLength, segmentHalfLength);
  const closestToCircle = new Phaser.Math.Vector2(localX, localY - closestLocalY);
  const hitRadius = capsuleRadius + circle.radius;
  const distanceSq = closestToCircle.lengthSq();

  if (distanceSq > hitRadius * hitRadius) {
    return undefined;
  }

  const distance = Math.sqrt(distanceSq);
  const capsuleToCircleNormal =
    distance > 0
      ? closestToCircle.scale(1 / distance)
      : new Phaser.Math.Vector2(localX >= 0 ? 1 : -1, 0);
  const normalFromCircleToCapsule = new Phaser.Math.Vector2(
    -(capsule.right.x * capsuleToCircleNormal.x + capsule.forward.x * capsuleToCircleNormal.y),
    -(capsule.right.y * capsuleToCircleNormal.x + capsule.forward.y * capsuleToCircleNormal.y)
  );

  return {
    normal: normalFromCircleToCapsule,
    penetration: hitRadius - distance,
    offset: getWrappedDirection(arena, circle.x, circle.y, capsule.x, capsule.y)
  };
}
