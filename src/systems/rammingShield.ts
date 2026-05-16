import { getWeaponDefinition } from '../data/weapons';
import type { PlayerStats } from '../data/stats';

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
  targetRadius: number;
  offsetFromShield: { x: number; y: number };
}

export interface RammingShieldCircleCollision {
  penetration: number;
}

export function getRammingShieldStats() {
  const stats = getWeaponDefinition('ramming-shield').rammingShield;

  if (!stats) {
    throw new Error('Ramming Shield stats are required.');
  }

  return stats;
}

export function createRammingShieldRuntimeState(isEquipped: boolean): RammingShieldRuntimeState {
  const stats = getRammingShieldStats();

  return {
    hp: isEquipped ? stats.shieldMaxHp : 0,
    nextRegenAt: 0,
    impactFlashUntil: 0,
    dashCharges: isEquipped ? stats.dashMaxCharges : 0,
    nextDashChargeAt: 0,
    empoweredUntil: 0,
    nextBlockDamageAt: 0,
    targetCooldowns: new WeakMap<object, number>()
  };
}

export function ensureRammingShieldRuntime(state: RammingShieldRuntimeState): void {
  const stats = getRammingShieldStats();

  if (state.hp <= 0) {
    state.hp = stats.shieldMaxHp;
  }

  if (state.dashCharges <= 0) {
    state.dashCharges = stats.dashMaxCharges;
    state.nextDashChargeAt = 0;
  }
}

export function updateRammingShieldRuntime(state: RammingShieldRuntimeState, time: number, deltaSeconds: number): void {
  const stats = getRammingShieldStats();

  if (state.hp < stats.shieldMaxHp && time >= state.nextRegenAt) {
    state.hp = Math.min(stats.shieldMaxHp, state.hp + stats.shieldRegenRatePerSecond * deltaSeconds);
  }

  updateRammingShieldDashRecharge(state, time);
}

export function updateRammingShieldDashRecharge(state: RammingShieldRuntimeState, time: number): void {
  const stats = getRammingShieldStats();

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

export function canActivateRammingShieldDash(state: RammingShieldRuntimeState): boolean {
  const stats = getRammingShieldStats();

  return state.hp > 0 && state.dashCharges > 0 && (!stats.dashRequiresShieldHp || state.hp > 0);
}

export function activateRammingShieldDash(state: RammingShieldRuntimeState, time: number, playerStats: PlayerStats): boolean {
  if (!canActivateRammingShieldDash(state)) {
    return false;
  }

  const stats = getRammingShieldStats();
  state.dashCharges = Math.max(0, state.dashCharges - 1);

  if (state.nextDashChargeAt <= 0) {
    state.nextDashChargeAt = time + stats.dashChargeRechargeSeconds * 1000;
  }

  state.empoweredUntil = time + stats.dashEmpoweredWindowSeconds * 1000 * playerStats.duration;
  state.impactFlashUntil = time + 140;
  return true;
}

export function damageRammingShield(state: RammingShieldRuntimeState, damage: number, time: number): void {
  if (damage <= 0) {
    return;
  }

  state.hp = Math.max(0, state.hp - damage);
  state.nextRegenAt = time + getRammingShieldStats().shieldRegenDelaySeconds * 1000;
  state.impactFlashUntil = time + 140;
}

export function canApplyRammingShieldDamage(state: RammingShieldRuntimeState, target: object, time: number): boolean {
  return time >= (state.targetCooldowns.get(target) ?? 0);
}

export function markRammingShieldDamageApplied(state: RammingShieldRuntimeState, target: object, time: number): void {
  state.targetCooldowns.set(target, time + getRammingShieldStats().contactCooldownMs);
  state.impactFlashUntil = time + 140;
}

export function getRammingShieldDamage(state: RammingShieldRuntimeState, speed: number, time: number, playerStats: PlayerStats): number {
  const stats = getRammingShieldStats();
  const strongRamBonus = Math.max(0, speed - stats.strongRamSpeed) * stats.speedDamageMultiplier;
  const activeMultiplier = state.hp > 0 ? 1 : stats.brokenDamageMultiplier;
  const dashMultiplier = time < state.empoweredUntil ? stats.dashRamDamageMultiplier : 1;

  return Math.max(0, Math.min(stats.maxDamage, stats.baseDamage + strongRamBonus) * activeMultiplier * dashMultiplier * playerStats.damage);
}

export function getRammingShieldCollider(input: RammingShieldColliderInput): RammingShieldCollider {
  const stats = getRammingShieldStats();
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
  const localX = input.offsetFromShield.x * input.collider.rightX + input.offsetFromShield.y * input.collider.rightY;
  const localY = input.offsetFromShield.x * input.collider.forwardX + input.offsetFromShield.y * input.collider.forwardY;
  const overlapX = input.collider.halfWidth + input.targetRadius - Math.abs(localX);
  const overlapY = input.collider.halfDepth + input.targetRadius - Math.abs(localY);

  if (overlapX <= 0 || overlapY <= 0) {
    return undefined;
  }

  return {
    penetration: Math.min(overlapX, overlapY)
  };
}

function wrapCoordinate(value: number, max: number): number {
  return ((value % max) + max) % max;
}
