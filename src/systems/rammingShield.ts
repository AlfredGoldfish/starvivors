import Phaser from 'phaser';
import type { RammingShieldStats } from '../data/weapons';
import { getCapsuleCircleCollision } from './collisionShapes';

export interface RammingShieldRuntimeState {
  hp: number;
  nextRegenAt: number;
  impactFlashUntil: number;
  dashCharges: number;
  nextDashChargeAt: number;
  empoweredUntil: number;
  nextBlockDamageAt: number;
  targetCooldowns: WeakMap<object, number>;
}

export interface RammingShieldColliderInput {
  playerX: number;
  playerY: number;
  arenaWidth: number;
  arenaHeight: number;
  areaScale: number;
  colliderDepth: number;
  forward: { x: number; y: number };
  right: { x: number; y: number };
}

export interface RammingShieldCollider {
  centerX: number;
  centerY: number;
  forwardX: number;
  forwardY: number;
  rightX: number;
  rightY: number;
  halfWidth: number;
  halfDepth: number;
}

export interface RammingShieldCircleCollisionInput {
  collider: RammingShieldCollider;
  arenaWidth: number;
  arenaHeight: number;
  targetX: number;
  targetY: number;
  targetRadius: number;
}

export interface RammingShieldCircleCollision {
  normalX: number;
  normalY: number;
  penetration: number;
}

export function createRammingShieldRuntimeState(isEquipped: boolean, stats?: RammingShieldStats): RammingShieldRuntimeState {
  return {
    hp: isEquipped && stats ? stats.shieldMaxHp : 0,
    nextRegenAt: 0,
    impactFlashUntil: 0,
    dashCharges: isEquipped && stats ? stats.dashMaxCharges : 0,
    nextDashChargeAt: 0,
    empoweredUntil: 0,
    nextBlockDamageAt: 0,
    targetCooldowns: new WeakMap<object, number>()
  };
}

export function ensureRammingShieldRuntime(state: RammingShieldRuntimeState, stats: RammingShieldStats): void {
  if (state.hp <= 0) {
    state.hp = stats.shieldMaxHp;
  }

  if (state.dashCharges <= 0) {
    state.dashCharges = stats.dashMaxCharges;
    state.nextDashChargeAt = 0;
  }
}

export function updateRammingShieldRuntime(state: RammingShieldRuntimeState, stats: RammingShieldStats, time: number, deltaSeconds: number): void {
  if (state.hp < stats.shieldMaxHp && time >= state.nextRegenAt) {
    state.hp = Math.min(stats.shieldMaxHp, state.hp + stats.shieldRegenRatePerSecond * deltaSeconds);
  }

  updateRammingShieldDashRecharge(state, stats, time);
}

export function updateRammingShieldDashRecharge(state: RammingShieldRuntimeState, stats: RammingShieldStats, time: number): void {
  if (state.dashCharges >= stats.dashMaxCharges) {
    state.nextDashChargeAt = 0;
    return;
  }

  if (state.nextDashChargeAt <= 0) {
    state.nextDashChargeAt = time + stats.dashChargeRechargeSeconds * 1000;
    return;
  }

  if (time < state.nextDashChargeAt) {
    return;
  }

  state.dashCharges = Math.min(stats.dashMaxCharges, state.dashCharges + 1);
  state.nextDashChargeAt = state.dashCharges >= stats.dashMaxCharges ? 0 : time + stats.dashChargeRechargeSeconds * 1000;
}

export function canActivateRammingShieldDash(state: RammingShieldRuntimeState, stats: RammingShieldStats): boolean {
  return state.hp > 0 && state.dashCharges > 0 && (!stats.dashRequiresShieldHp || state.hp > 0);
}

export function activateRammingShieldDash(state: RammingShieldRuntimeState, stats: RammingShieldStats, time: number): boolean {
  if (!canActivateRammingShieldDash(state, stats)) {
    return false;
  }

  state.dashCharges = Math.max(0, state.dashCharges - 1);

  if (state.nextDashChargeAt <= 0) {
    state.nextDashChargeAt = time + stats.dashChargeRechargeSeconds * 1000;
  }

  state.empoweredUntil = time + stats.dashDurationSeconds * 1000;
  state.impactFlashUntil = time + 140;
  return true;
}

export function damageRammingShield(state: RammingShieldRuntimeState, stats: RammingShieldStats, damage: number, time: number): void {
  if (damage <= 0) {
    return;
  }

  state.hp = Math.max(0, state.hp - damage);
  state.nextRegenAt = time + stats.shieldRegenDelaySeconds * 1000;
  state.impactFlashUntil = time + 140;
}

export function canApplyRammingShieldDamage(state: RammingShieldRuntimeState, target: object, time: number): boolean {
  return time >= (state.targetCooldowns.get(target) ?? 0);
}

export function markRammingShieldDamageApplied(state: RammingShieldRuntimeState, stats: RammingShieldStats, target: object, time: number): void {
  state.targetCooldowns.set(target, time + stats.contactCooldownMs);
  state.impactFlashUntil = time + 140;
}

export function getRammingShieldDamage(
  state: RammingShieldRuntimeState,
  stats: RammingShieldStats,
  time: number,
  playerDamageMultiplier: number
): number {
  if (state.hp <= 0) {
    return 0;
  }

  const baseDamage = time < state.empoweredUntil ? stats.bashDamage : stats.guardDamage;
  return Math.max(0, baseDamage * playerDamageMultiplier);
}

export function getRammingShieldCollider(input: RammingShieldColliderInput, stats: RammingShieldStats): RammingShieldCollider {
  const centerX = wrapCoordinate(input.playerX + input.forward.x * stats.range, input.arenaWidth);
  const centerY = wrapCoordinate(input.playerY + input.forward.y * stats.range, input.arenaHeight);

  return {
    centerX,
    centerY,
    forwardX: input.forward.x,
    forwardY: input.forward.y,
    rightX: input.right.x,
    rightY: input.right.y,
    halfWidth: (stats.width * input.areaScale) / 2,
    halfDepth: (input.colliderDepth * input.areaScale) / 2
  };
}

export function getRammingShieldCircleCollision(input: RammingShieldCircleCollisionInput): RammingShieldCircleCollision | undefined {
  const collision = getCapsuleCircleCollision(
    {
      width: input.arenaWidth,
      height: input.arenaHeight
    },
    {
      x: input.collider.centerX,
      y: input.collider.centerY,
      right: new Phaser.Math.Vector2(input.collider.rightX, input.collider.rightY),
      forward: new Phaser.Math.Vector2(input.collider.forwardX, input.collider.forwardY),
      halfWidth: input.collider.halfDepth,
      halfLength: input.collider.halfWidth
    },
    {
      x: input.targetX,
      y: input.targetY,
      radius: input.targetRadius
    }
  );

  if (!collision) {
    return undefined;
  }

  return {
    normalX: collision.normal.x,
    normalY: collision.normal.y,
    penetration: collision.penetration
  };
}

function wrapCoordinate(value: number, max: number): number {
  return ((value % max) + max) % max;
}
