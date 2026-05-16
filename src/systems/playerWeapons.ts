import { getWeaponDefinition, type WeaponRegistryEntry } from '../data/weapons';

export interface PlayerWeaponRuntimeState {
  activeMainWeaponId: WeaponRegistryEntry['id'];
  activeSecondaryWeaponId: WeaponRegistryEntry['id'] | null;
  nextMainWeaponFireAt: number;
  nextSecondaryWeaponFireAt: number;
}

export interface PlayerWeaponUpgradeState {
  projectileDamageLevel: number;
  projectileFireRateLevel: number;
  projectileVelocityLevel: number;
}

export interface PlayerWeaponDebugTuning {
  damageMultiplier: number;
  fireRateMultiplier: number;
}

export interface PlayerWeaponProjectileConfig {
  damage: number;
  cooldownMs: number;
  projectileSpeed: number;
  projectileLifetimeMs: number;
  projectileRange: number;
}

export const PROJECTILE_DAMAGE_UPGRADE_MULTIPLIER = 0.25;
export const PROJECTILE_FIRE_RATE_COOLDOWN_MULTIPLIER = 0.88;
export const PROJECTILE_VELOCITY_UPGRADE_MULTIPLIER = 0.2;

export function createPlayerWeaponRuntimeState(activeMainWeaponId: WeaponRegistryEntry['id']): PlayerWeaponRuntimeState {
  return {
    activeMainWeaponId,
    activeSecondaryWeaponId: null,
    nextMainWeaponFireAt: 0,
    nextSecondaryWeaponFireAt: 0
  };
}

export function getActiveMainWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry {
  return getWeaponDefinition(state.activeMainWeaponId);
}

export function getActiveSecondaryWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry | undefined {
  return state.activeSecondaryWeaponId ? getWeaponDefinition(state.activeSecondaryWeaponId) : undefined;
}

export function getPlayerWeaponDamageMultiplier(upgrades: PlayerWeaponUpgradeState): number {
  return 1 + upgrades.projectileDamageLevel * PROJECTILE_DAMAGE_UPGRADE_MULTIPLIER;
}

export function getPlayerWeaponBaseCooldownMs(
  weapon: WeaponRegistryEntry,
  upgrades: PlayerWeaponUpgradeState
): number {
  return (
    (weapon.cooldownSeconds ?? 0) *
    1000 *
    Math.pow(PROJECTILE_FIRE_RATE_COOLDOWN_MULTIPLIER, upgrades.projectileFireRateLevel)
  );
}

export function getPlayerWeaponCooldownMs(
  weapon: WeaponRegistryEntry,
  upgrades: PlayerWeaponUpgradeState,
  debugTuning: PlayerWeaponDebugTuning
): number {
  return getPlayerWeaponBaseCooldownMs(weapon, upgrades) / debugTuning.fireRateMultiplier;
}

export function getPlayerWeaponProjectileSpeed(
  weapon: WeaponRegistryEntry,
  upgrades: PlayerWeaponUpgradeState
): number {
  return (weapon.projectileSpeed ?? 0) * (1 + upgrades.projectileVelocityLevel * PROJECTILE_VELOCITY_UPGRADE_MULTIPLIER);
}

export function getPlayerWeaponProjectileConfig(
  weapon: WeaponRegistryEntry,
  upgrades: PlayerWeaponUpgradeState,
  debugTuning: PlayerWeaponDebugTuning
): PlayerWeaponProjectileConfig {
  return {
    damage: (weapon.damage ?? 0) * getPlayerWeaponDamageMultiplier(upgrades) * debugTuning.damageMultiplier,
    cooldownMs: getPlayerWeaponCooldownMs(weapon, upgrades, debugTuning),
    projectileSpeed: getPlayerWeaponProjectileSpeed(weapon, upgrades),
    projectileLifetimeMs: (weapon.projectileLifetimeSeconds ?? 0) * 1000,
    projectileRange: weapon.projectileRange ?? 0
  };
}
