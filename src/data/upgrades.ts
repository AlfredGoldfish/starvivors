import type { WeaponBehaviorType, WeaponId, WeaponTag } from './weapons';

export type UpgradeCategory = 'projectile' | 'pulse' | 'ramming' | 'passive' | 'utility';
export type UpgradeRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type UpgradeStatus = 'implemented' | 'data-only';

export type UpgradeId =
  | 'pulse_damage'
  | 'pulse_fire_rate'
  | 'pulse_velocity'
  | 'hull-plating'
  | 'engine-tuning'
  | 'damage-control'
  | 'pulse_size'
  | 'pulse_multishot'
  | 'pulse_pierce'
  | 'ram_damage'
  | 'shield_capacity'
  | 'shield_recharge'
  | 'impact_radius'
  | 'dash_recharge';

export type PassiveUpgradeId = 'hull-plating' | 'engine-tuning' | 'damage-control';

export type WeaponUpgradeStat =
  | 'projectileDamageMultiplier'
  | 'projectileCooldownMultiplier'
  | 'projectileSpeedMultiplier'
  | 'projectileAreaMultiplier'
  | 'projectileCount'
  | 'projectilePierce'
  | 'ramDamageMultiplier'
  | 'shieldMaxHpMultiplier'
  | 'shieldRegenRateMultiplier'
  | 'shieldRegenDelayMultiplier'
  | 'impactRadiusMultiplier'
  | 'dashRechargeMultiplier';

export type UpgradeModifierOperation = 'add' | 'multiply';

export interface UpgradeTargetRule {
  weaponIds?: WeaponId[];
  weaponTags?: WeaponTag[];
  behaviorTypes?: WeaponBehaviorType[];
}

export interface UpgradeStatModifier {
  stat: WeaponUpgradeStat;
  operation: UpgradeModifierOperation;
  value: number;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  category: UpgradeCategory;
  rarity: UpgradeRarity;
  name: string;
  description: string;
  maxLevel: number;
  target?: UpgradeTargetRule;
  statModifiers?: UpgradeStatModifier[];
  behaviorFlags?: string[];
  status?: UpgradeStatus;
}

export const PASSIVE_UPGRADE_MAX_LEVEL = 5;
export const WEAPON_UPGRADE_MAX_LEVEL = 5;

export const UPGRADE_CHOICES: UpgradeDefinition[] = [
  {
    id: 'pulse_damage',
    category: 'pulse',
    rarity: 'common',
    name: 'Pulse Damage',
    description: '+25% Pulse Cannon damage per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['pulse-cannon'] },
    statModifiers: [{ stat: 'projectileDamageMultiplier', operation: 'add', value: 0.25 }]
  },
  {
    id: 'pulse_fire_rate',
    category: 'pulse',
    rarity: 'common',
    name: 'Pulse Fire Rate',
    description: 'Reduces Pulse Cannon cooldown by 12% per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['pulse-cannon'] },
    statModifiers: [{ stat: 'projectileCooldownMultiplier', operation: 'multiply', value: 0.88 }]
  },
  {
    id: 'pulse_velocity',
    category: 'projectile',
    rarity: 'common',
    name: 'Projectile Velocity',
    description: '+20% projectile speed per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { behaviorTypes: ['projectile'] },
    statModifiers: [{ stat: 'projectileSpeedMultiplier', operation: 'add', value: 0.2 }]
  },
  {
    id: 'hull-plating',
    category: 'passive',
    rarity: 'common',
    name: 'Hull Plating',
    description: '+15 max hull and repair 15 hull.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'engine-tuning',
    category: 'passive',
    rarity: 'common',
    name: 'Engine Tuning',
    description: '+8% acceleration and +4% max speed.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'damage-control',
    category: 'utility',
    rarity: 'uncommon',
    name: 'Damage Control',
    description: '+0.15s hit invulnerability and repair 10 hull.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'pulse_size',
    category: 'projectile',
    rarity: 'uncommon',
    name: 'Projectile Size',
    description: '+12% projectile size per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { behaviorTypes: ['projectile'] },
    statModifiers: [{ stat: 'projectileAreaMultiplier', operation: 'add', value: 0.12 }]
  },
  {
    id: 'pulse_multishot',
    category: 'projectile',
    rarity: 'rare',
    name: 'Multishot',
    description: '+1 projectile every 2 levels.',
    maxLevel: 4,
    target: { behaviorTypes: ['projectile'] },
    statModifiers: [{ stat: 'projectileCount', operation: 'add', value: 0.5 }]
  },
  {
    id: 'pulse_pierce',
    category: 'projectile',
    rarity: 'uncommon',
    name: 'Piercing Pulse',
    description: '+1 projectile pierce per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { behaviorTypes: ['projectile'] },
    statModifiers: [{ stat: 'projectilePierce', operation: 'add', value: 1 }]
  },
  {
    id: 'ram_damage',
    category: 'ramming',
    rarity: 'common',
    name: 'Ram Damage',
    description: '+20% Ramming Shield impact damage per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['ramming-shield'] },
    statModifiers: [{ stat: 'ramDamageMultiplier', operation: 'add', value: 0.2 }]
  },
  {
    id: 'shield_capacity',
    category: 'ramming',
    rarity: 'common',
    name: 'Shield Capacity',
    description: '+15% Ramming Shield capacity per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['ramming-shield'] },
    statModifiers: [{ stat: 'shieldMaxHpMultiplier', operation: 'add', value: 0.15 }]
  },
  {
    id: 'shield_recharge',
    category: 'ramming',
    rarity: 'uncommon',
    name: 'Shield Recharge',
    description: '+18% shield regeneration and -6% regen delay per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['ramming-shield'] },
    statModifiers: [
      { stat: 'shieldRegenRateMultiplier', operation: 'add', value: 0.18 },
      { stat: 'shieldRegenDelayMultiplier', operation: 'multiply', value: 0.94 }
    ]
  },
  {
    id: 'impact_radius',
    category: 'ramming',
    rarity: 'uncommon',
    name: 'Impact Radius',
    description: '+10% Ramming Shield impact reach per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['ramming-shield'] },
    statModifiers: [{ stat: 'impactRadiusMultiplier', operation: 'add', value: 0.1 }]
  },
  {
    id: 'dash_recharge',
    category: 'ramming',
    rarity: 'rare',
    name: 'Dash Recharge',
    description: 'Reduces Ramming Shield dash recharge by 10% per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['ramming-shield'] },
    statModifiers: [{ stat: 'dashRechargeMultiplier', operation: 'multiply', value: 0.9 }]
  }
];
