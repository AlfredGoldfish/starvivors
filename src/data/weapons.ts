import type { ContentRegistryEntry } from './contentStatus';
import { PLAYER_WEAPON_DAMAGE_VARIANCE, type DamageVariance } from './damageVariance';
import type { PlayerStatKey } from './stats';
import { pulseCannonBalance, rammingShieldBalance } from './balance';

export type WeaponId = 'pulse-cannon' | 'ramming-shield' | 'test1-weapon' | 'test2-weapon' | 'test3-weapon' | 'test4-weapon';
export type WeaponSlotType = 'auto' | 'primary' | 'secondary';
export type WeaponAssignmentType = 'auto' | 'manual';
export type WeaponBehaviorType = 'projectile' | 'ramming-shield';
export type WeaponInputBehavior = 'hold' | 'tap';
export type WeaponTag = 'projectile' | 'pulse' | 'ramming' | 'shield';
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
}

export type RammingShieldStats = typeof rammingShieldBalance;

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

function createTestWeaponTemplate(
  id: Extract<WeaponId, 'test1-weapon' | 'test2-weapon' | 'test3-weapon' | 'test4-weapon'>,
  displayName: string,
  visual: ProjectileVisualDefinition,
  slotCompatibility: WeaponSlotType[],
  assignmentType: WeaponAssignmentType = 'manual'
): WeaponRegistryEntry {
  const isAuto = slotCompatibility.includes('auto');
  return {
    id,
    displayName,
    status: 'WIP',
    description: 'Empty test weapon template for future Hangar and loadout experiments.',
    sourceShipId: 'test',
    behaviorType: 'projectile',
    tags: ['projectile'],
    inputBehavior: 'hold',
    autoFire: isAuto,
    assignmentType,
    slotCompatibility,
    slotBehavior: {
      primary: 'Template primary behavior placeholder.',
      secondary: 'Template secondary behavior placeholder.'
    },
    startingShipId: 'test',
    eligibleAsSecondary: slotCompatibility.includes('secondary'),
    scaling: {
      broadStats: ['damage', 'attackSpeed', 'projectileSpeed', 'area', 'duration', 'amount', 'pierce'],
      weaponSpecificStats: ['damage', 'cooldownSeconds', 'projectileSpeed', 'projectileLifetimeSeconds', 'projectileRange']
    },
    upgradeBranches: ['damage', 'fire-rate', 'projectile-speed'],
    damage: 0,
    damageVariance: PLAYER_WEAPON_DAMAGE_VARIANCE,
    cooldownSeconds: 1,
    projectileSpeed: 0,
    projectileLifetimeSeconds: 0,
    projectileRange: 0,
    projectileVisual: visual
  };
}

export const test1Weapon = createTestWeaponTemplate('test1-weapon', 'Test 1 Weapon', {
  glowColor: 0xffc857,
  glowAlpha: 0.26,
  bodyColor: 0xffe08a,
  bodyStrokeColor: 0xf2fbff,
  trailColor: 0xffc857,
  width: 16,
  height: 22
}, ['primary', 'secondary']);

export const test2Weapon = createTestWeaponTemplate('test2-weapon', 'Test 2 Weapon', {
  glowColor: 0xff5964,
  glowAlpha: 0.24,
  bodyColor: 0xff8f95,
  bodyStrokeColor: 0xf2fbff,
  trailColor: 0xff5964,
  width: 16,
  height: 22
}, ['primary', 'secondary']);

export const test3Weapon = createTestWeaponTemplate('test3-weapon', 'Test 3 Weapon', {
  glowColor: 0xb88cff,
  glowAlpha: 0.24,
  bodyColor: 0xd8c2ff,
  bodyStrokeColor: 0xf2fbff,
  trailColor: 0xb88cff,
  width: 16,
  height: 22
}, ['primary', 'secondary']);

export const test4Weapon = createTestWeaponTemplate('test4-weapon', 'Test 4 Weapon', {
  glowColor: 0x69f0ae,
  glowAlpha: 0.24,
  bodyColor: 0xa8ffd2,
  bodyStrokeColor: 0xf2fbff,
  trailColor: 0x69f0ae,
  width: 16,
  height: 22
}, ['auto'], 'auto');

export const weaponRegistry: WeaponRegistryEntry[] = [pulseCannon, rammingShield, test1Weapon, test2Weapon, test3Weapon, test4Weapon];

export function getWeaponDefinition(weaponId: WeaponId): WeaponRegistryEntry {
  return weaponRegistry.find((weapon) => weapon.id === weaponId) ?? pulseCannon;
}

export function isProjectileWeapon(weapon: WeaponRegistryEntry): boolean {
  return weapon.behaviorType === 'projectile';
}
