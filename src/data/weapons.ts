import type { ContentRegistryEntry } from './contentStatus';
import { PLAYER_WEAPON_DAMAGE_VARIANCE, type DamageVariance } from './damageVariance';
import type { PlayerStatKey } from './stats';
import { pulseCannonBalance, rammingShieldBalance, salvageBeamBalance } from './balance';

export type WeaponId = 'pulse-cannon' | 'ramming-shield' | 'salvage-beam';
export type WeaponSlotType = 'auto' | 'primary' | 'secondary';
export type WeaponAssignmentType = 'auto' | 'manual';
export type WeaponBehaviorType = 'projectile' | 'ramming-shield' | 'beam';
export type WeaponInputBehavior = 'hold' | 'tap';
export type WeaponTag = 'projectile' | 'pulse' | 'ramming' | 'shield' | 'beam' | 'salvage';
export type WeaponUpgradeBranch =
  | 'damage'
  | 'fire-rate'
  | 'projectile-speed'
  | 'dash-charges'
  | 'dash-recharge'
  | 'ram-damage'
  | 'shield-hp'
  | 'beam-focus'
  | 'heat-management'
  | 'beam-range';

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
  tags: WeaponTag[];
  inputBehavior: WeaponInputBehavior;
  autoFire?: boolean;
  assignmentType: WeaponAssignmentType;
  slotCompatibility: WeaponSlotType[];
  slotBehavior: WeaponSlotBehaviorDefinition;
  startingShipId: string;
  eligibleAsSecondary: boolean;
  scaling: WeaponScalingDefinition;
  upgradeBranches: WeaponUpgradeBranch[];
  damage?: number;
  damageVariance?: DamageVariance;
  cooldownSeconds?: number;
  projectileSpeed?: number;
  projectileLifetimeSeconds?: number;
  projectileRange?: number;
  projectileVisual?: ProjectileVisualDefinition;
  rammingShield?: typeof rammingShieldBalance;
  beam?: typeof salvageBeamBalance;
}

export type RammingShieldStats = typeof rammingShieldBalance;
export type BeamWeaponStats = typeof salvageBeamBalance;

export const pulseCannon: WeaponRegistryEntry = {
  id: 'pulse-cannon',
  displayName: 'Pulse Cannon',
  status: 'Implemented',
  description: 'Mouse-aimed cannon tuned for steady held fire.',
  sourceShipId: 'interceptor',
  behaviorType: 'projectile',
  tags: ['projectile', 'pulse'],
  inputBehavior: 'hold',
  autoFire: false,
  assignmentType: 'manual',
  slotCompatibility: ['primary', 'secondary'],
  slotBehavior: {
    primary: 'Hold left click or fire key to shoot toward the mouse.',
    secondary: 'Hold right click to shoot toward the mouse when equipped as a secondary weapon.'
  },
  startingShipId: 'interceptor',
  eligibleAsSecondary: true,
  scaling: {
    broadStats: ['damage', 'attackSpeed', 'projectileSpeed', 'area', 'duration', 'amount', 'pierce'],
    weaponSpecificStats: ['damage', 'cooldownSeconds', 'projectileSpeed', 'projectileLifetimeSeconds', 'projectileRange']
  },
  upgradeBranches: ['damage', 'fire-rate', 'projectile-speed'],
  damage: pulseCannonBalance.damage,
  damageVariance: PLAYER_WEAPON_DAMAGE_VARIANCE,
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
  tags: ['ramming', 'shield'],
  inputBehavior: 'tap',
  assignmentType: 'manual',
  slotCompatibility: ['primary', 'secondary'],
  slotBehavior: {
    primary: 'Left-click or fire key spends a dash charge for a forward ram burst.',
    secondary: 'Right-click spends a dash charge when equipped as a secondary weapon.'
  },
  startingShipId: 'bulwark',
  eligibleAsSecondary: true,
  scaling: {
    broadStats: ['damage', 'area', 'duration'],
    weaponSpecificStats: [
      'shieldMaxHp',
      'shieldRegenDelaySeconds',
      'shieldRegenRatePerSecond',
      'dashMaxCharges',
      'dashChargeRechargeSeconds',
      'dashDistance',
      'dashDurationSeconds',
      'range',
      'width',
      'guardDamage',
      'bashDamage',
      'knockback',
      'contactCooldownMs'
    ]
  },
  upgradeBranches: ['dash-charges', 'dash-recharge', 'ram-damage', 'shield-hp'],
  rammingShield: rammingShieldBalance
};

export const salvageBeam: WeaponRegistryEntry = {
  id: 'salvage-beam',
  displayName: 'Salvage Beam',
  status: 'MVP',
  description: 'Held cutter beam that pierces targets and overheats under sustained fire.',
  sourceShipId: 'engineer',
  behaviorType: 'beam',
  tags: ['beam', 'salvage'],
  inputBehavior: 'hold',
  autoFire: false,
  assignmentType: 'manual',
  slotCompatibility: ['primary', 'secondary'],
  slotBehavior: {
    primary: 'Hold left click or fire key to maintain a forward cutting beam.',
    secondary: 'Hold right click to maintain the beam when equipped as a secondary weapon.'
  },
  startingShipId: 'engineer',
  eligibleAsSecondary: true,
  scaling: {
    broadStats: ['damage', 'attackSpeed', 'area'],
    weaponSpecificStats: [
      'tickDamage',
      'tickRatePerSecond',
      'range',
      'width',
      'heatMax',
      'heatGainPerSecond',
      'coolingPerSecond',
      'overheatCoolingPerSecond'
    ]
  },
  upgradeBranches: ['beam-focus', 'heat-management', 'beam-range'],
  damageVariance: PLAYER_WEAPON_DAMAGE_VARIANCE,
  beam: salvageBeamBalance
};

export const weaponRegistry: WeaponRegistryEntry[] = [pulseCannon, rammingShield, salvageBeam];

export function getWeaponDefinition(weaponId: WeaponId): WeaponRegistryEntry {
  return weaponRegistry.find((weapon) => weapon.id === weaponId) ?? pulseCannon;
}

export function isWeaponId(value: string): value is WeaponId {
  return weaponRegistry.some((weapon) => weapon.id === value);
}

export function isProjectileWeapon(weapon: WeaponRegistryEntry): boolean {
  return weapon.behaviorType === 'projectile';
}

export function isBeamWeapon(weapon: WeaponRegistryEntry): boolean {
  return weapon.behaviorType === 'beam';
}
