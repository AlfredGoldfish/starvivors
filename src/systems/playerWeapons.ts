import { getWeaponDefinition, type WeaponRegistryEntry } from '../data/weapons';

export interface PlayerWeaponRuntimeState {
  activeMainWeaponId: WeaponRegistryEntry['id'];
  activeSecondaryWeaponId: WeaponRegistryEntry['id'] | null;
  nextMainWeaponFireAt: number;
}

export interface PlayerWeaponUpgradeState {
  projectileDamageLevel: number;
  projectileFireRateLevel: number;
  projectileVelocityLevel: number;
  permanentDamageLevel: number;
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
export const PERMANENT_PLAYER_WEAPON_DAMAGE_MULTIPLIER = 0.05;

export function createPlayerWeaponRuntimeState(activeMainWeaponId: WeaponRegistryEntry['id']): PlayerWeaponRuntimeState {
  return {
    activeMainWeaponId,
    activeSecondaryWeaponId: null,
    nextMainWeaponFireAt: 0
  };
}

export function getActiveMainWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry {
  return getWeaponDefinition(state.activeMainWeaponId);
}

export function getPlayerWeaponDamageMultiplier(upgrades: PlayerWeaponUpgradeState): number {
  return (
    1 +
    upgrades.projectileDamageLevel * PROJECTILE_DAMAGE_UPGRADE_MULTIPLIER +
    upgrades.permanentDamageLevel * PERMANENT_PLAYER_WEAPON_DAMAGE_MULTIPLIER
  );
}

export function getPlayerWeaponBaseCooldownMs(
  weapon: WeaponRegistryEntry,
  upgrades: PlayerWeaponUpgradeState
): number {
  return (
    weapon.cooldownSeconds *
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
  return weapon.projectileSpeed * (1 + upgrades.projectileVelocityLevel * PROJECTILE_VELOCITY_UPGRADE_MULTIPLIER);
}

export function getPlayerWeaponProjectileConfig(
  weapon: WeaponRegistryEntry,
  upgrades: PlayerWeaponUpgradeState,
  debugTuning: PlayerWeaponDebugTuning
): PlayerWeaponProjectileConfig {
  return {
    damage: weapon.damage * getPlayerWeaponDamageMultiplier(upgrades) * debugTuning.damageMultiplier,
    cooldownMs: getPlayerWeaponCooldownMs(weapon, upgrades, debugTuning),
    projectileSpeed: getPlayerWeaponProjectileSpeed(weapon, upgrades),
    projectileLifetimeMs: weapon.projectileLifetimeSeconds * 1000,
    projectileRange: weapon.projectileRange
  };
}
