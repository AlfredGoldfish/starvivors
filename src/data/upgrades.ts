import type { WeaponBehaviorType, WeaponId, WeaponTag } from './weapons';
import { COMBAT_NUMBER_SCALE } from './combatScale';

export type UpgradeCategory = 'projectile' | 'pulse' | 'ramming' | 'passive' | 'utility';
export type UpgradeRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type UpgradeStatus = 'implemented' | 'data-only';

export type UpgradeId =
  | 'pulse_damage'
  | 'pulse_flat_damage_common'
  | 'pulse_flat_damage_uncommon'
  | 'pulse_flat_damage_rare'
  | 'pulse_fire_rate'
  | 'pulse_velocity'
  | 'pulse_accelerated'
  | 'pulse_dense'
  | 'hull-plating'
  | 'engine-tuning'
  | 'damage-control'
  | 'pulse_size'
  | 'pulse_multishot'
  | 'pulse_pierce'
  | 'pulse_splitter'
  | 'pulse_rear_emitter'
  | 'pulse_side_emitters'
  | 'pulse_crossfire_array'
  | 'pulse_burst_capacitor'
  | 'pulse_refracting'
  | 'pulse_tracking'
  | 'pulse_chain_discharge'
  | 'pulse_volatile'
  | 'pulse_sapping'
  | 'pulse_ionized'
  | 'pulse_plasma_wake'
  | 'pulse_overload_chamber'
  | 'pulse_feedback_loop'
  | 'pulse_critical_capacitor'
  | 'pulse_emergency_discharge'
  | 'ram_damage'
  | 'shield_capacity'
  | 'shield_recharge'
  | 'impact_radius'
  | 'dash_recharge'
  | 'stat_amount'
  | 'stat_magnet'
  | 'stat_luck'
  | 'stat_growth'
  | 'stat_greed';

export type PassiveUpgradeId =
  | 'hull-plating'
  | 'engine-tuning'
  | 'damage-control'
  | 'stat_amount'
  | 'stat_magnet'
  | 'stat_luck'
  | 'stat_growth'
  | 'stat_greed';

export type WeaponUpgradeStat =
  | 'projectileDamageMultiplier'
  | 'projectileDamageFlat'
  | 'projectileCooldownMultiplier'
  | 'projectileSpeedMultiplier'
  | 'projectileRangeMultiplier'
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

export interface UpgradePrerequisite {
  id: UpgradeId;
  minLevel: number;
}

export interface PulseProjectilePatternModifier {
  forwardExtraCount?: number;
  spreadRadians?: number;
  rearCount?: number;
  sideCount?: number;
  crossfire?: boolean;
  burstCount?: number;
  burstDelayMs?: number;
}

export interface PulseProjectileEffectModifier {
  bounceCount?: number;
  explosionRadius?: number;
  explosionDamageMultiplier?: number;
  chainCount?: number;
  chainRange?: number;
  chainDamageMultiplier?: number;
  lifestealPercent?: number;
  lifestealCapPerSecond?: number;
  ionizeDurationMs?: number;
  ionizeDamageMultiplier?: number;
  plasmaWakeDamageMultiplier?: number;
  plasmaWakeDurationMs?: number;
  homingStrength?: number;
  homingRange?: number;
  overloadEveryNShots?: number;
  overloadDamageMultiplier?: number;
  overloadSizeMultiplier?: number;
  feedbackCooldownRefundMultiplier?: number;
  feedbackCooldownRefundCapMs?: number;
  criticalDamageBonusPerHit?: number;
  criticalMaxStacks?: number;
  criticalDurationMs?: number;
  emergencyDamageMultiplier?: number;
  emergencySizeMultiplier?: number;
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
  prerequisites?: UpgradePrerequisite[];
  projectilePattern?: PulseProjectilePatternModifier;
  projectileEffects?: PulseProjectileEffectModifier;
  behaviorFlags?: string[];
  status?: UpgradeStatus;
  todo?: string;
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
    id: 'pulse_flat_damage_common',
    category: 'pulse',
    rarity: 'common',
    name: 'Pulse Slugs',
    description: '+5 flat Pulse Cannon damage per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['pulse-cannon'] },
    statModifiers: [{ stat: 'projectileDamageFlat', operation: 'add', value: 5 }]
  },
  {
    id: 'pulse_flat_damage_uncommon',
    category: 'pulse',
    rarity: 'uncommon',
    name: 'Pulse Warheads',
    description: '+10 flat Pulse Cannon damage per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['pulse-cannon'] },
    statModifiers: [{ stat: 'projectileDamageFlat', operation: 'add', value: 10 }]
  },
  {
    id: 'pulse_flat_damage_rare',
    category: 'pulse',
    rarity: 'rare',
    name: 'Pulse Core Rounds',
    description: '+15 flat Pulse Cannon damage per level.',
    maxLevel: WEAPON_UPGRADE_MAX_LEVEL,
    target: { weaponIds: ['pulse-cannon'] },
    statModifiers: [{ stat: 'projectileDamageFlat', operation: 'add', value: 15 }]
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
    id: 'pulse_accelerated',
    category: 'pulse',
    rarity: 'common',
    name: 'Accelerated Pulse',
    description: '+18% Pulse speed and +12% range per level.',
    maxLevel: 4,
    target: { weaponIds: ['pulse-cannon'] },
    statModifiers: [
      { stat: 'projectileSpeedMultiplier', operation: 'add', value: 0.18 },
      { stat: 'projectileRangeMultiplier', operation: 'add', value: 0.12 }
    ]
  },
  {
    id: 'pulse_dense',
    category: 'pulse',
    rarity: 'common',
    name: 'Dense Pulse',
    description: '+18% damage and +14% size, but -8% speed per level.',
    maxLevel: 4,
    target: { weaponIds: ['pulse-cannon'] },
    statModifiers: [
      { stat: 'projectileDamageMultiplier', operation: 'add', value: 0.18 },
      { stat: 'projectileAreaMultiplier', operation: 'add', value: 0.14 },
      { stat: 'projectileSpeedMultiplier', operation: 'add', value: -0.08 }
    ]
  },
  {
    id: 'hull-plating',
    category: 'passive',
    rarity: 'common',
    name: 'Hull Plating',
    description: '+750 max hull and repair 750 hull.',
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
    description: '+0.15s hit invulnerability and repair 500 hull.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'stat_amount',
    category: 'passive',
    rarity: 'rare',
    name: 'Amount',
    description: '+1 projectile amount per level.',
    maxLevel: 3
  },
  {
    id: 'stat_magnet',
    category: 'passive',
    rarity: 'common',
    name: 'Magnet',
    description: '+18% pickup vacuum range per level.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'stat_luck',
    category: 'utility',
    rarity: 'uncommon',
    name: 'Luck',
    description: '+4% enemy drop chance scaling per level.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'stat_growth',
    category: 'passive',
    rarity: 'common',
    name: 'Growth',
    description: '+10% XP gain per level.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'stat_greed',
    category: 'utility',
    rarity: 'common',
    name: 'Greed',
    description: '+10% credits earned from scrap per level.',
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
    id: 'pulse_splitter',
    category: 'pulse',
    rarity: 'uncommon',
    name: 'Pulse Splitter',
    description: 'Adds angled forward shots for a wider Pulse fan.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectilePattern: { forwardExtraCount: 2, spreadRadians: 0.2 }
  },
  {
    id: 'pulse_rear_emitter',
    category: 'pulse',
    rarity: 'uncommon',
    name: 'Rear Emitter',
    description: 'Adds Pulse shots behind the ship.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectilePattern: { rearCount: 1 }
  },
  {
    id: 'pulse_side_emitters',
    category: 'pulse',
    rarity: 'uncommon',
    name: 'Side Emitters',
    description: 'Adds Pulse shots to the left and right.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectilePattern: { sideCount: 1 }
  },
  {
    id: 'pulse_crossfire_array',
    category: 'pulse',
    rarity: 'epic',
    name: 'Crossfire Array',
    description: 'Completes the directional array with forward, rear, and side coverage.',
    maxLevel: 1,
    target: { weaponIds: ['pulse-cannon'] },
    prerequisites: [
      { id: 'pulse_rear_emitter', minLevel: 1 },
      { id: 'pulse_side_emitters', minLevel: 1 }
    ],
    projectilePattern: { crossfire: true }
  },
  {
    id: 'pulse_burst_capacitor',
    category: 'pulse',
    rarity: 'uncommon',
    name: 'Burst Capacitor',
    description: 'Fires a short 2-shot Pulse burst per attack cycle.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectilePattern: { burstCount: 1, burstDelayMs: 85 }
  },
  {
    id: 'pulse_refracting',
    category: 'pulse',
    rarity: 'rare',
    name: 'Refracting Pulse',
    description: 'Pulse shots redirect once after a valid hit.',
    maxLevel: 1,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { bounceCount: 1 }
  },
  {
    id: 'pulse_tracking',
    category: 'pulse',
    rarity: 'rare',
    name: 'Tracking Pulse',
    description: 'Pulse shots steer slightly toward nearby enemies.',
    maxLevel: 3,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { homingStrength: 2.8, homingRange: 420 }
  },
  {
    id: 'pulse_chain_discharge',
    category: 'pulse',
    rarity: 'rare',
    name: 'Chain Discharge',
    description: 'Pulse hits arc to one nearby enemy for partial damage.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { chainCount: 1, chainRange: 210, chainDamageMultiplier: 0.45 }
  },
  {
    id: 'pulse_volatile',
    category: 'pulse',
    rarity: 'rare',
    name: 'Volatile Pulse',
    description: 'Pulse shots explode on impact for light area damage.',
    maxLevel: 3,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { explosionRadius: 72, explosionDamageMultiplier: 0.35 }
  },
  {
    id: 'pulse_sapping',
    category: 'pulse',
    rarity: 'rare',
    name: 'Sapping Pulse',
    description: 'Pulse damage restores a small amount of shield or hull, capped per second.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { lifestealPercent: 0.035, lifestealCapPerSecond: 4 * COMBAT_NUMBER_SCALE }
  },
  {
    id: 'pulse_ionized',
    category: 'pulse',
    rarity: 'epic',
    name: 'Ionized Pulse',
    description: 'Pulse hits ionize targets, increasing later Pulse damage.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { ionizeDurationMs: 2600, ionizeDamageMultiplier: 0.12 }
  },
  {
    id: 'pulse_plasma_wake',
    category: 'pulse',
    rarity: 'epic',
    name: 'Plasma Wake',
    description: 'Pulse shots will leave a damaging plasma trail.',
    maxLevel: 1,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { plasmaWakeDamageMultiplier: 0.18, plasmaWakeDurationMs: 520 },
    status: 'data-only',
    todo: 'TODO: Requires a persistent area-damage trail runtime; current projectile trails are visual particles only.'
  },
  {
    id: 'pulse_overload_chamber',
    category: 'pulse',
    rarity: 'epic',
    name: 'Overload Chamber',
    description: 'Every fifth Pulse volley fires empowered shots.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { overloadEveryNShots: 5, overloadDamageMultiplier: 0.8, overloadSizeMultiplier: 0.35 }
  },
  {
    id: 'pulse_feedback_loop',
    category: 'pulse',
    rarity: 'epic',
    name: 'Feedback Loop',
    description: 'Pulse Cannon kills partially refund the next cooldown.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { feedbackCooldownRefundMultiplier: 0.12, feedbackCooldownRefundCapMs: 180 }
  },
  {
    id: 'pulse_critical_capacitor',
    category: 'pulse',
    rarity: 'epic',
    name: 'Critical Capacitor',
    description: 'Repeated Pulse hits on the same enemy build bonus damage.',
    maxLevel: 2,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { criticalDamageBonusPerHit: 0.08, criticalMaxStacks: 4, criticalDurationMs: 3600 }
  },
  {
    id: 'pulse_emergency_discharge',
    category: 'pulse',
    rarity: 'epic',
    name: 'Emergency Discharge',
    description: 'After taking damage, the next Pulse volley is empowered.',
    maxLevel: 1,
    target: { weaponIds: ['pulse-cannon'] },
    projectileEffects: { emergencyDamageMultiplier: 0.65, emergencySizeMultiplier: 0.3 }
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
