import type { ContentRegistryEntry } from './contentStatus';
import type { PlayerStatKey } from './stats';
import { pulseCannonBalance, rammingShieldBalance } from './balance';

export type WeaponId = 'pulse-cannon' | 'ramming-shield';
export type WeaponSlotType = 'main' | 'secondary';
export type WeaponBehaviorType = 'projectile' | 'ramming-shield';
export type WeaponInputBehavior = 'hold' | 'tap';
export type WeaponUpgradeBranch = 'damage' | 'fire-rate' | 'projectile-speed' | 'dash-charges' | 'dash-recharge' | 'ram-damage' | 'shield-hp';

export interface WeaponSlotBehaviorDefinition {
  primary: string;
  secondary: string;
}

export interface WeaponScalingDefinition {
  broadStats: PlayerStatKey[];
  weaponSpecificStats: string[];
}

export interface ProjectileVisualDefinition {
  glowColor: number;
  glowAlpha: number;
  bodyColor: number;
  bodyStrokeColor: number;
  trailColor: number;
  width: number;
  height: number;
}

export interface WeaponRegistryEntry extends ContentRegistryEntry {
  id: WeaponId;
  displayName: string;
  description: string;
  sourceShipId: string;
  behaviorType: WeaponBehaviorType;
  inputBehavior: WeaponInputBehavior;
  slotCompatibility: WeaponSlotType[];
  slotBehavior: WeaponSlotBehaviorDefinition;
  startingShipId: string;
  eligibleAsSecondary: boolean;
  scaling: WeaponScalingDefinition;
  upgradeBranches: WeaponUpgradeBranch[];
  damage?: number;
  cooldownSeconds?: number;
  projectileSpeed?: number;
  projectileLifetimeSeconds?: number;
  projectileRange?: number;
  projectileVisual?: ProjectileVisualDefinition;
  rammingShield?: typeof rammingShieldBalance;
}

export type RammingShieldStats = typeof rammingShieldBalance;

export const pulseCannon: WeaponRegistryEntry = {
  id: 'pulse-cannon',
  displayName: 'Pulse Cannon',
  status: 'Implemented',
  description: 'Fast main cannon tuned for the Interceptor.',
  sourceShipId: 'interceptor',
  behaviorType: 'projectile',
  inputBehavior: 'hold',
  slotCompatibility: ['main', 'secondary'],
  slotBehavior: {
    primary: 'Left-click or fire key fires the active primary projectile weapon.',
    secondary: 'Right-click fires the projectile as a secondary weapon.'
  },
  startingShipId: 'interceptor',
  eligibleAsSecondary: true,
  scaling: {
    broadStats: ['damage', 'attackSpeed', 'projectileSpeed', 'area', 'duration', 'amount', 'pierce'],
    weaponSpecificStats: ['damage', 'cooldownSeconds', 'projectileSpeed', 'projectileLifetimeSeconds', 'projectileRange']
  },
  upgradeBranches: ['damage', 'fire-rate', 'projectile-speed'],
  damage: pulseCannonBalance.damage,
  cooldownSeconds: pulseCannonBalance.cooldownSeconds,
  projectileSpeed: pulseCannonBalance.projectileSpeed,
  projectileLifetimeSeconds: pulseCannonBalance.projectileLifetimeSeconds,
  projectileRange: pulseCannonBalance.projectileRange,
  projectileVisual: {
    glowColor: 0x42f5d7,
    glowAlpha: 0.3,
    bodyColor: 0x73f2ff,
    bodyStrokeColor: 0xf2fbff,
    trailColor: 0x42f5d7,
    width: 18,
    height: 24
  }
};

export const rammingShield: WeaponRegistryEntry = {
  id: 'ramming-shield',
  displayName: 'Ramming Shield',
  status: 'MVP',
  description: 'Rechargeable forward impact shield tuned for Bulwark ramming.',
  sourceShipId: 'bulwark',
  behaviorType: 'ramming-shield',
  inputBehavior: 'tap',
  slotCompatibility: ['main', 'secondary'],
  slotBehavior: {
    primary: 'Left-click or fire key spends a dash charge for a forward ram burst.',
    secondary: 'Right-click spends a dash charge when equipped as a secondary weapon.'
  },
  startingShipId: 'bulwark',
  eligibleAsSecondary: true,
  scaling: {
    broadStats: ['damage', 'area', 'duration', 'mass'],
    weaponSpecificStats: [
      'shieldMaxHp',
      'shieldRegenDelaySeconds',
      'shieldRegenRatePerSecond',
      'dashMaxCharges',
      'dashChargeRechargeSeconds',
      'dashImpulse',
      'dashRamDamageMultiplier',
      'range',
      'width',
      'baseDamage',
      'speedDamageMultiplier',
      'maxDamage',
      'contactCooldownMs'
    ]
  },
  upgradeBranches: ['dash-charges', 'dash-recharge', 'ram-damage', 'shield-hp'],
  rammingShield: rammingShieldBalance
};

export const weaponRegistry: WeaponRegistryEntry[] = [pulseCannon, rammingShield];

export function getWeaponDefinition(weaponId: WeaponId): WeaponRegistryEntry {
  return weaponRegistry.find((weapon) => weapon.id === weaponId) ?? pulseCannon;
}

export function isProjectileWeapon(weapon: WeaponRegistryEntry): boolean {
  return weapon.behaviorType === 'projectile';
}
