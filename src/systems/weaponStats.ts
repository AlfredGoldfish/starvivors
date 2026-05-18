import type { ShipRegistryEntry } from '../data/ships';
import type { PlayerStats } from '../data/stats';
import type { RammingShieldStats, WeaponRegistryEntry, WeaponSlotType } from '../data/weapons';
import type { PlayerWeaponDebugTuning, PlayerWeaponUpgradeState } from './playerWeapons';
import { getAdditiveWeaponUpgradeModifier, getMultiplicativeWeaponUpgradeModifier } from './runUpgrades';

export interface ResolvedProjectileWeaponStats {
  damage: number;
  cooldownMs: number;
  baseCooldownMs: number;
  projectileSpeed: number;
  projectileLifetimeMs: number;
  projectileRange: number;
  projectileAreaScale: number;
  projectileCount: number;
  pierce: number;
}

export interface ResolvedWeaponStats {
  weapon: WeaponRegistryEntry;
  slot: WeaponSlotType;
  projectile?: ResolvedProjectileWeaponStats;
  rammingShield?: RammingShieldStats;
}

export interface ResolveWeaponStatsInput {
  weapon: WeaponRegistryEntry;
  slot: WeaponSlotType;
  ship: ShipRegistryEntry;
  playerStats: PlayerStats;
  upgrades: PlayerWeaponUpgradeState;
  debugTuning: PlayerWeaponDebugTuning;
}

const PLAYER_PROJECTILE_COUNT_CAP = 6;

export function resolveWeaponStats(input: ResolveWeaponStatsInput): ResolvedWeaponStats {
  return {
    weapon: input.weapon,
    slot: input.slot,
    projectile: resolveProjectileStats(input),
    rammingShield: resolveRammingShieldStats(input)
  };
}

export function resolveProjectileStats(input: ResolveWeaponStatsInput): ResolvedProjectileWeaponStats | undefined {
  const weapon = input.weapon;
  if (weapon.behaviorType !== 'projectile') {
    return undefined;
  }

  const baseCooldownMs = getProjectileBaseCooldownMs(weapon, input.upgrades);
  const projectileSpeed = getProjectileSpeed(weapon, input.upgrades, input.playerStats);
  const areaMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'projectileAreaMultiplier');
  const projectileCountBonus = getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'projectileCount');
  const projectilePierceBonus = getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'projectilePierce');

  return {
    damage: (weapon.damage ?? 0) * getWeaponDamageMultiplier(input.upgrades, weapon) * input.playerStats.damage * input.debugTuning.damageMultiplier,
    cooldownMs: baseCooldownMs / (input.playerStats.attackSpeed * input.debugTuning.fireRateMultiplier),
    baseCooldownMs,
    projectileSpeed,
    projectileLifetimeMs: (weapon.projectileLifetimeSeconds ?? 0) * 1000 * input.playerStats.duration,
    projectileRange: (weapon.projectileRange ?? 0) * input.playerStats.duration,
    projectileAreaScale: input.playerStats.area * areaMultiplier,
    projectileCount: Math.min(PLAYER_PROJECTILE_COUNT_CAP, Math.max(1, 1 + Math.floor(input.playerStats.amount + projectileCountBonus))),
    pierce: Math.max(0, Math.floor(input.playerStats.pierce + projectilePierceBonus))
  };
}

export function resolveRammingShieldStats(input: ResolveWeaponStatsInput): RammingShieldStats | undefined {
  if (!input.weapon.rammingShield) {
    return undefined;
  }

  const stats: RammingShieldStats = { ...input.weapon.rammingShield };
  const bonus =
    input.slot === 'main' && input.ship.startingMainWeaponId === input.weapon.id
      ? input.ship.defaultPrimaryWeaponBonuses?.[input.weapon.id]?.rammingShield
      : undefined;

  if (bonus) {
    const dashImpulseMultiplier = bonus.dashImpulseMultiplier ?? 1;
    const { dashImpulseMultiplier: _unusedDashImpulseMultiplier, ...overrides } = bonus;

    Object.assign(stats, {
      ...overrides,
      dashImpulse: (overrides.dashImpulse ?? stats.dashImpulse) * dashImpulseMultiplier
    });
  }

  const ramDamageMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'ramDamageMultiplier');
  const shieldMaxHpMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'shieldMaxHpMultiplier');
  const shieldRegenRateMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'shieldRegenRateMultiplier');
  const shieldRegenDelayMultiplier = getMultiplicativeWeaponUpgradeModifier(input.upgrades, input.weapon, 'shieldRegenDelayMultiplier');
  const impactRadiusMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'impactRadiusMultiplier');
  const dashRechargeMultiplier = getMultiplicativeWeaponUpgradeModifier(input.upgrades, input.weapon, 'dashRechargeMultiplier');

  return {
    ...stats,
    shieldMaxHp: stats.shieldMaxHp * shieldMaxHpMultiplier,
    shieldRegenDelaySeconds: stats.shieldRegenDelaySeconds * shieldRegenDelayMultiplier,
    shieldRegenRatePerSecond: stats.shieldRegenRatePerSecond * shieldRegenRateMultiplier,
    dashChargeRechargeSeconds: stats.dashChargeRechargeSeconds * dashRechargeMultiplier,
    range: stats.range * impactRadiusMultiplier,
    width: stats.width * impactRadiusMultiplier,
    baseDamage: stats.baseDamage * ramDamageMultiplier,
    maxDamage: stats.maxDamage * ramDamageMultiplier
  };
}

export function getWeaponDamageMultiplier(upgrades: PlayerWeaponUpgradeState, weapon: WeaponRegistryEntry): number {
  return 1 + getAdditiveWeaponUpgradeModifier(upgrades, weapon, 'projectileDamageMultiplier');
}

function getProjectileBaseCooldownMs(weapon: WeaponRegistryEntry, upgrades: PlayerWeaponUpgradeState): number {
  return (weapon.cooldownSeconds ?? 0) * 1000 * getMultiplicativeWeaponUpgradeModifier(upgrades, weapon, 'projectileCooldownMultiplier');
}

function getProjectileSpeed(weapon: WeaponRegistryEntry, upgrades: PlayerWeaponUpgradeState, playerStats: PlayerStats): number {
  const upgradeMultiplier = 1 + getAdditiveWeaponUpgradeModifier(upgrades, weapon, 'projectileSpeedMultiplier');
  return (weapon.projectileSpeed ?? 0) * upgradeMultiplier * playerStats.projectileSpeed;
}
