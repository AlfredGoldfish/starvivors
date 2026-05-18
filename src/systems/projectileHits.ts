import Phaser from 'phaser';
import type { ArenaSize } from '../core/arena';
import type { PlayerProjectile } from '../scenes/gameTypes';

export interface EllipseProjectileTarget {
  body: Phaser.GameObjects.Container;
  stats: {
    hitHalfWidth: number;
    hitHalfLength: number;
  };
}

export interface CircleProjectileTarget {
  body: Phaser.GameObjects.Container;
  hitRadius: number;
}

export interface TryHitEllipseTargetsInput<T extends EllipseProjectileTarget> {
  arena: ArenaSize;
  projectile: PlayerProjectile;
  targets: T[];
  getForwardDirection: (rotation: number) => Phaser.Math.Vector2;
  onHit: (target: T, index: number) => void;
}

export interface TryHitCircleTargetsInput<T extends CircleProjectileTarget> {
  arena: ArenaSize;
  projectile: PlayerProjectile;
  targets: T[];
  onHit: (target: T, index: number) => void;
}

export function tryHitEllipseTargets<T extends EllipseProjectileTarget>(
  input: TryHitEllipseTargetsInput<T>
): boolean {
  for (let i = input.targets.length - 1; i >= 0; i -= 1) {
    const target = input.targets[i];
    if (input.projectile.piercedTargets.has(target.body)) {
      continue;
    }

    const hitHalfWidth = target.stats.hitHalfWidth + input.projectile.hitRadius;
    const hitHalfLength = target.stats.hitHalfLength + input.projectile.hitRadius;
    const offset = getWrappedDirection(
      input.arena,
      target.body.x,
      target.body.y,
      input.projectile.body.x,
      input.projectile.body.y
    );
    const targetForward = input.getForwardDirection(target.body.rotation);
    const targetRight = new Phaser.Math.Vector2(-targetForward.y, targetForward.x);
    const localX = offset.dot(targetRight);
    const localY = offset.dot(targetForward);
    const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

    if (normalizedHit <= 1) {
      input.projectile.piercedTargets.add(target.body);
      input.onHit(target, i);
      return true;
    }
  }

  return false;
}

export function tryHitCircleTargets<T extends CircleProjectileTarget>(
  input: TryHitCircleTargetsInput<T>
): boolean {
  for (let i = input.targets.length - 1; i >= 0; i -= 1) {
    const target = input.targets[i];
    if (input.projectile.piercedTargets.has(target.body)) {
      continue;
    }

    const offset = getWrappedDirection(
      input.arena,
      target.body.x,
      target.body.y,
      input.projectile.body.x,
      input.projectile.body.y
    );
    const hitRadius = target.hitRadius + input.projectile.hitRadius;

    if (offset.lengthSq() <= hitRadius * hitRadius) {
      input.projectile.piercedTargets.add(target.body);
      input.onHit(target, i);
      return true;
    }
  }

  return false;
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
