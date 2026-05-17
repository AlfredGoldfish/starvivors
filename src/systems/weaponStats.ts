import type { ShipRegistryEntry } from '../data/ships';
import type { PlayerStats } from '../data/stats';
import type { RammingShieldStats, WeaponRegistryEntry, WeaponSlotType } from '../data/weapons';
import type { PlayerWeaponDebugTuning, PlayerWeaponUpgradeState } from './playerWeapons';

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

const PROJECTILE_DAMAGE_UPGRADE_MULTIPLIER = 0.25;
const PROJECTILE_FIRE_RATE_COOLDOWN_MULTIPLIER = 0.88;
const PROJECTILE_VELOCITY_UPGRADE_MULTIPLIER = 0.2;
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

  return {
    damage: (weapon.damage ?? 0) * getWeaponDamageMultiplier(input.upgrades) * input.playerStats.damage * input.debugTuning.damageMultiplier,
    cooldownMs: baseCooldownMs / (input.playerStats.attackSpeed * input.debugTuning.fireRateMultiplier),
    baseCooldownMs,
    projectileSpeed,
    projectileLifetimeMs: (weapon.projectileLifetimeSeconds ?? 0) * 1000 * input.playerStats.duration,
    projectileRange: (weapon.projectileRange ?? 0) * input.playerStats.duration,
    projectileAreaScale: input.playerStats.area,
    projectileCount: Math.min(PLAYER_PROJECTILE_COUNT_CAP, Math.max(1, 1 + Math.floor(input.playerStats.amount))),
    pierce: Math.max(0, Math.floor(input.playerStats.pierce))
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

  if (!bonus) {
    return stats;
  }

  const dashImpulseMultiplier = bonus.dashImpulseMultiplier ?? 1;
  const { dashImpulseMultiplier: _unusedDashImpulseMultiplier, ...overrides } = bonus;

  return {
    ...stats,
    ...overrides,
    dashImpulse: (overrides.dashImpulse ?? stats.dashImpulse) * dashImpulseMultiplier
  };
}

export function getWeaponDamageMultiplier(upgrades: PlayerWeaponUpgradeState): number {
  return 1 + upgrades.projectileDamageLevel * PROJECTILE_DAMAGE_UPGRADE_MULTIPLIER;
}

function getProjectileBaseCooldownMs(weapon: WeaponRegistryEntry, upgrades: PlayerWeaponUpgradeState): number {
  return (weapon.cooldownSeconds ?? 0) * 1000 * Math.pow(PROJECTILE_FIRE_RATE_COOLDOWN_MULTIPLIER, upgrades.projectileFireRateLevel);
}

function getProjectileSpeed(weapon: WeaponRegistryEntry, upgrades: PlayerWeaponUpgradeState, playerStats: PlayerStats): number {
  return (weapon.projectileSpeed ?? 0) * (1 + upgrades.projectileVelocityLevel * PROJECTILE_VELOCITY_UPGRADE_MULTIPLIER) * playerStats.projectileSpeed;
}
