import type { ShipRegistryEntry } from '../data/ships';
import type { DamageVariance } from '../data/damageVariance';
import type { PlayerStats } from '../data/stats';
import {
  PULSE_ACCELERATED_COILS_COOLDOWN_MULTIPLIER,
  RAMMING_REINFORCED_PROJECTOR_HP_BONUS,
  SALVAGE_HEAT_SINK_COOLING_MULTIPLIER,
  WEAPON_MK_EFFECT_MULTIPLIER,
  type WeaponShopUpgradeLevels
} from '../data/shopUpgrades';
import { UPGRADE_CHOICES, type PulseProjectileEffectModifier, type PulseProjectilePatternModifier } from '../data/upgrades';
import type { BeamWeaponStats, RammingShieldStats, WeaponRegistryEntry, WeaponSlotType } from '../data/weapons';
import type { PlayerWeaponDebugTuning, PlayerWeaponUpgradeState } from './playerWeapons';
import { getAdditiveWeaponUpgradeModifier, getMultiplicativeWeaponUpgradeModifier, isUpgradeRelevantForWeapons } from './runUpgrades';

export interface ResolvedProjectilePatternStats {
  forwardExtraCount: number;
  spreadRadians: number;
  rearCount: number;
  sideCount: number;
  crossfire: boolean;
  burstCount: number;
  burstDelayMs: number;
}

export interface ResolvedProjectileEffectStats {
  bounceCount: number;
  explosionRadius: number;
  explosionDamageMultiplier: number;
  chainCount: number;
  chainRange: number;
  chainDamageMultiplier: number;
  lifestealPercent: number;
  lifestealCapPerSecond: number;
  ionizeDurationMs: number;
  ionizeDamageMultiplier: number;
  plasmaWakeDamageMultiplier: number;
  plasmaWakeDurationMs: number;
  homingStrength: number;
  homingRange: number;
  overloadEveryNShots: number;
  overloadDamageMultiplier: number;
  overloadSizeMultiplier: number;
  feedbackCooldownRefundMultiplier: number;
  feedbackCooldownRefundCapMs: number;
  criticalDamageBonusPerHit: number;
  criticalMaxStacks: number;
  criticalDurationMs: number;
  emergencyDamageMultiplier: number;
  emergencySizeMultiplier: number;
}

export interface ResolvedProjectileWeaponStats {
  damage: number;
  damageVariance?: DamageVariance;
  cooldownMs: number;
  baseCooldownMs: number;
  projectileSpeed: number;
  projectileLifetimeMs: number;
  projectileRange: number;
  projectileAreaScale: number;
  projectileCount: number;
  pierce: number;
  pattern: ResolvedProjectilePatternStats;
  effects: ResolvedProjectileEffectStats;
}

export interface ResolvedBeamWeaponStats extends BeamWeaponStats {
  tickIntervalMs: number;
  damageVariance?: DamageVariance;
}

export interface ResolvedWeaponStats {
  weapon: WeaponRegistryEntry;
  slot: WeaponSlotType;
  projectile?: ResolvedProjectileWeaponStats;
  rammingShield?: RammingShieldStats;
  beam?: ResolvedBeamWeaponStats;
}

export interface ResolveWeaponStatsInput {
  weapon: WeaponRegistryEntry;
  slot: WeaponSlotType;
  ship: ShipRegistryEntry;
  playerStats: PlayerStats;
  upgrades: PlayerWeaponUpgradeState;
  shopUpgradeLevels?: WeaponShopUpgradeLevels;
  debugTuning: PlayerWeaponDebugTuning;
}

const PLAYER_PROJECTILE_COUNT_CAP = 6;

export function resolveWeaponStats(input: ResolveWeaponStatsInput): ResolvedWeaponStats {
  return {
    weapon: input.weapon,
    slot: input.slot,
    projectile: resolveProjectileStats(input),
    rammingShield: resolveRammingShieldStats(input),
    beam: resolveBeamStats(input)
  };
}

export function resolveProjectileStats(input: ResolveWeaponStatsInput): ResolvedProjectileWeaponStats | undefined {
  const weapon = input.weapon;
  if (weapon.behaviorType !== 'projectile') {
    return undefined;
  }

  const baseCooldownMs = getProjectileBaseCooldownMs(weapon, input.upgrades, input.shopUpgradeLevels);
  const projectileSpeed = getProjectileSpeed(weapon, input.upgrades, input.playerStats);
  const areaMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'projectileAreaMultiplier');
  const projectileCountBonus = getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'projectileCount');
  const projectilePierceBonus = getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'projectilePierce');
  const rangeMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'projectileRangeMultiplier');
  const flatDamage = getWeaponFlatDamageBonus(input.upgrades, weapon);

  return {
    damage:
      ((weapon.damage ?? 0) + flatDamage) *
      getWeaponDamageMultiplier(input.upgrades, weapon) *
      getWeaponMkMultiplier(input.shopUpgradeLevels, weapon.id) *
      input.playerStats.damage *
      input.debugTuning.damageMultiplier,
    damageVariance: weapon.damageVariance,
    cooldownMs: baseCooldownMs / (input.playerStats.attackSpeed * input.debugTuning.fireRateMultiplier),
    baseCooldownMs,
    projectileSpeed,
    projectileLifetimeMs: (weapon.projectileLifetimeSeconds ?? 0) * 1000 * input.playerStats.duration,
    projectileRange: (weapon.projectileRange ?? 0) * input.playerStats.duration * rangeMultiplier,
    projectileAreaScale: input.playerStats.area * areaMultiplier,
    projectileCount: Math.min(PLAYER_PROJECTILE_COUNT_CAP, Math.max(1, 1 + Math.floor(input.playerStats.amount + projectileCountBonus))),
    pierce: Math.max(0, Math.floor(input.playerStats.pierce + projectilePierceBonus)),
    pattern: resolveProjectilePatternStats(input.upgrades, weapon),
    effects: resolveProjectileEffectStats(input.upgrades, weapon)
  };
}

export function resolveRammingShieldStats(input: ResolveWeaponStatsInput): RammingShieldStats | undefined {
  if (!input.weapon.rammingShield) {
    return undefined;
  }

  const stats: RammingShieldStats = { ...input.weapon.rammingShield };
  const bonus =
    input.slot === 'primary' && input.ship.startingPrimaryWeaponId === input.weapon.id
      ? input.ship.defaultPrimaryWeaponBonuses?.[input.weapon.id]?.rammingShield
      : undefined;

  if (bonus) {
    Object.assign(stats, bonus);
  }

  const ramDamageMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'ramDamageMultiplier');
  const ramDamageFlat = getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'ramDamageFlat');
  const shieldMaxHpMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'shieldMaxHpMultiplier');
  const shieldRegenRateMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'shieldRegenRateMultiplier');
  const shieldRegenDelayMultiplier = getMultiplicativeWeaponUpgradeModifier(input.upgrades, input.weapon, 'shieldRegenDelayMultiplier');
  const impactRadiusMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'impactRadiusMultiplier');
  const dashRechargeMultiplier = getMultiplicativeWeaponUpgradeModifier(input.upgrades, input.weapon, 'dashRechargeMultiplier');
  const dashChargeBonus = getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'dashChargeBonus');
  const knockbackMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'ramKnockbackMultiplier');
  const dashDistanceMultiplier = Math.max(0.25, 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, input.weapon, 'dashDistanceMultiplier'));
  const weaponMkMultiplier = getWeaponMkMultiplier(input.shopUpgradeLevels, input.weapon.id);
  const reinforcedProjectorBonus =
    input.weapon.id === 'ramming-shield'
      ? getWeaponShopLevel(input.shopUpgradeLevels, input.weapon.id, 'reinforced-projector') * RAMMING_REINFORCED_PROJECTOR_HP_BONUS
      : 0;
  const behaviorFlags = UPGRADE_CHOICES.flatMap((upgrade) => {
    const level = input.upgrades[upgrade.id] ?? 0;
    if (level <= 0 || !upgrade.behaviorFlags || !isUpgradeRelevantForWeapons(upgrade, [input.weapon])) {
      return [];
    }

    return upgrade.behaviorFlags;
  });

  return {
    ...stats,
    shieldMaxHp: stats.shieldMaxHp * shieldMaxHpMultiplier + reinforcedProjectorBonus,
    shieldRegenDelaySeconds: stats.shieldRegenDelaySeconds * shieldRegenDelayMultiplier,
    shieldRegenRatePerSecond: stats.shieldRegenRatePerSecond * shieldRegenRateMultiplier,
    dashMaxCharges: stats.dashMaxCharges + Math.floor(dashChargeBonus),
    dashChargeRechargeSeconds: stats.dashChargeRechargeSeconds * dashRechargeMultiplier,
    range: stats.range * impactRadiusMultiplier,
    width: stats.width * impactRadiusMultiplier,
    guardDamage: (stats.guardDamage + ramDamageFlat) * ramDamageMultiplier * weaponMkMultiplier,
    bashDamage: (stats.bashDamage + ramDamageFlat) * ramDamageMultiplier * weaponMkMultiplier,
    knockback: stats.knockback * knockbackMultiplier,
    dashDistance: stats.dashDistance * dashDistanceMultiplier,
    behaviorFlags: [...new Set([...stats.behaviorFlags, ...behaviorFlags])]
  };
}

export function resolveBeamStats(input: ResolveWeaponStatsInput): ResolvedBeamWeaponStats | undefined {
  const weapon = input.weapon;
  const beam = weapon.beam;
  if (weapon.behaviorType !== 'beam' || !beam) {
    return undefined;
  }

  const damageMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'beamDamageMultiplier');
  const rangeMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'beamRangeMultiplier');
  const widthMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'beamWidthMultiplier');
  const coolingMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'beamCoolingMultiplier');
  const overheatCoolingMultiplier = 1 + getAdditiveWeaponUpgradeModifier(input.upgrades, weapon, 'beamOverheatCoolingMultiplier');
  const heatGainMultiplier = getMultiplicativeWeaponUpgradeModifier(input.upgrades, weapon, 'beamHeatGainMultiplier');
  const weaponMkMultiplier = getWeaponMkMultiplier(input.shopUpgradeLevels, weapon.id);
  const heatSinkCoolingMultiplier =
    weapon.id === 'salvage-beam'
      ? 1 + getWeaponShopLevel(input.shopUpgradeLevels, weapon.id, 'heat-sink-lattice') * SALVAGE_HEAT_SINK_COOLING_MULTIPLIER
      : 1;
  const tickRatePerSecond = Math.max(0.1, beam.tickRatePerSecond * input.playerStats.attackSpeed * input.debugTuning.fireRateMultiplier);

  return {
    ...beam,
    tickDamage: beam.tickDamage * damageMultiplier * weaponMkMultiplier * input.playerStats.damage * input.debugTuning.damageMultiplier,
    tickRatePerSecond,
    tickIntervalMs: 1000 / tickRatePerSecond,
    range: beam.range * rangeMultiplier,
    width: beam.width * input.playerStats.area * widthMultiplier,
    heatGainPerSecond: beam.heatGainPerSecond * heatGainMultiplier,
    coolingPerSecond: beam.coolingPerSecond * coolingMultiplier * heatSinkCoolingMultiplier,
    overheatCoolingPerSecond: beam.overheatCoolingPerSecond * overheatCoolingMultiplier * heatSinkCoolingMultiplier,
    damageVariance: weapon.damageVariance
  };
}

export function getWeaponDamageMultiplier(upgrades: PlayerWeaponUpgradeState, weapon: WeaponRegistryEntry): number {
  return 1 + getAdditiveWeaponUpgradeModifier(upgrades, weapon, 'projectileDamageMultiplier');
}

export function getWeaponFlatDamageBonus(upgrades: PlayerWeaponUpgradeState, weapon: WeaponRegistryEntry): number {
  return getAdditiveWeaponUpgradeModifier(upgrades, weapon, 'projectileDamageFlat');
}

function getProjectileBaseCooldownMs(
  weapon: WeaponRegistryEntry,
  upgrades: PlayerWeaponUpgradeState,
  shopUpgradeLevels?: WeaponShopUpgradeLevels
): number {
  const acceleratedCoilsMultiplier =
    weapon.id === 'pulse-cannon'
      ? Math.max(
          0.2,
          1 - getWeaponShopLevel(shopUpgradeLevels, weapon.id, 'accelerated-coils') * PULSE_ACCELERATED_COILS_COOLDOWN_MULTIPLIER
        )
      : 1;
  return (
    (weapon.cooldownSeconds ?? 0) *
    1000 *
    getMultiplicativeWeaponUpgradeModifier(upgrades, weapon, 'projectileCooldownMultiplier') *
    acceleratedCoilsMultiplier
  );
}

function getWeaponMkMultiplier(shopUpgradeLevels: WeaponShopUpgradeLevels | undefined, weaponId: string): number {
  return 1 + getWeaponShopLevel(shopUpgradeLevels, weaponId, 'weapon-mk') * WEAPON_MK_EFFECT_MULTIPLIER;
}

function getWeaponShopLevel(shopUpgradeLevels: WeaponShopUpgradeLevels | undefined, weaponId: string, upgradeId: string): number {
  return shopUpgradeLevels?.[weaponId as keyof WeaponShopUpgradeLevels]?.[upgradeId as keyof NonNullable<WeaponShopUpgradeLevels[keyof WeaponShopUpgradeLevels]>] ?? 0;
}

function getProjectileSpeed(weapon: WeaponRegistryEntry, upgrades: PlayerWeaponUpgradeState, playerStats: PlayerStats): number {
  const upgradeMultiplier = 1 + getAdditiveWeaponUpgradeModifier(upgrades, weapon, 'projectileSpeedMultiplier');
  return Math.max(120, (weapon.projectileSpeed ?? 0) * upgradeMultiplier * playerStats.projectileSpeed);
}

function resolveProjectilePatternStats(upgrades: PlayerWeaponUpgradeState, weapon: WeaponRegistryEntry): ResolvedProjectilePatternStats {
  const modifiers = getLeveledProjectilePatternModifiers(upgrades, weapon);
  const forwardExtraCount = sumPatternValue(modifiers, 'forwardExtraCount');
  const rearCount = sumPatternValue(modifiers, 'rearCount');
  const sideCount = sumPatternValue(modifiers, 'sideCount');
  const burstExtraCount = sumPatternValue(modifiers, 'burstCount');
  const spreadRadians = Math.max(0.08, sumPatternValue(modifiers, 'spreadRadians'));
  const burstDelayMs = modifiers.reduce((delay, modifier) => Math.max(delay, modifier.burstDelayMs ?? 0), 0);

  return {
    forwardExtraCount: Math.max(0, Math.floor(forwardExtraCount)),
    spreadRadians,
    rearCount: Math.max(0, Math.floor(rearCount)),
    sideCount: Math.max(0, Math.floor(sideCount)),
    crossfire: modifiers.some((modifier) => modifier.crossfire),
    burstCount: Math.max(1, 1 + Math.floor(burstExtraCount)),
    burstDelayMs
  };
}

function resolveProjectileEffectStats(upgrades: PlayerWeaponUpgradeState, weapon: WeaponRegistryEntry): ResolvedProjectileEffectStats {
  const modifiers = getLeveledProjectileEffectModifiers(upgrades, weapon);
  const minPositive = (key: keyof PulseProjectileEffectModifier) =>
    modifiers
      .map((modifier) => modifier[key])
      .filter((value): value is number => typeof value === 'number' && value > 0)
      .reduce((lowest, value) => Math.min(lowest, value), Number.POSITIVE_INFINITY);
  const minOrZero = (key: keyof PulseProjectileEffectModifier) => {
    const value = minPositive(key);
    return Number.isFinite(value) ? value : 0;
  };

  return {
    bounceCount: Math.floor(sumEffectValue(modifiers, 'bounceCount')),
    explosionRadius: sumEffectValue(modifiers, 'explosionRadius'),
    explosionDamageMultiplier: sumEffectValue(modifiers, 'explosionDamageMultiplier'),
    chainCount: Math.floor(sumEffectValue(modifiers, 'chainCount')),
    chainRange: sumEffectValue(modifiers, 'chainRange'),
    chainDamageMultiplier: sumEffectValue(modifiers, 'chainDamageMultiplier'),
    lifestealPercent: sumEffectValue(modifiers, 'lifestealPercent'),
    lifestealCapPerSecond: sumEffectValue(modifiers, 'lifestealCapPerSecond'),
    ionizeDurationMs: sumEffectValue(modifiers, 'ionizeDurationMs'),
    ionizeDamageMultiplier: sumEffectValue(modifiers, 'ionizeDamageMultiplier'),
    plasmaWakeDamageMultiplier: sumEffectValue(modifiers, 'plasmaWakeDamageMultiplier'),
    plasmaWakeDurationMs: sumEffectValue(modifiers, 'plasmaWakeDurationMs'),
    homingStrength: sumEffectValue(modifiers, 'homingStrength'),
    homingRange: sumEffectValue(modifiers, 'homingRange'),
    overloadEveryNShots: Math.floor(minOrZero('overloadEveryNShots')),
    overloadDamageMultiplier: sumEffectValue(modifiers, 'overloadDamageMultiplier'),
    overloadSizeMultiplier: sumEffectValue(modifiers, 'overloadSizeMultiplier'),
    feedbackCooldownRefundMultiplier: sumEffectValue(modifiers, 'feedbackCooldownRefundMultiplier'),
    feedbackCooldownRefundCapMs: sumEffectValue(modifiers, 'feedbackCooldownRefundCapMs'),
    criticalDamageBonusPerHit: sumEffectValue(modifiers, 'criticalDamageBonusPerHit'),
    criticalMaxStacks: Math.floor(sumEffectValue(modifiers, 'criticalMaxStacks')),
    criticalDurationMs: sumEffectValue(modifiers, 'criticalDurationMs'),
    emergencyDamageMultiplier: sumEffectValue(modifiers, 'emergencyDamageMultiplier'),
    emergencySizeMultiplier: sumEffectValue(modifiers, 'emergencySizeMultiplier')
  };
}

function getLeveledProjectilePatternModifiers(
  upgrades: PlayerWeaponUpgradeState,
  weapon: WeaponRegistryEntry
): PulseProjectilePatternModifier[] {
  return UPGRADE_CHOICES.flatMap((upgrade) => {
    const level = upgrades[upgrade.id] ?? 0;
    if (level <= 0 || !upgrade.projectilePattern || !isUpgradeRelevantForWeapons(upgrade, [weapon])) {
      return [];
    }

    return Array.from({ length: level }, () => upgrade.projectilePattern as PulseProjectilePatternModifier);
  });
}

function getLeveledProjectileEffectModifiers(
  upgrades: PlayerWeaponUpgradeState,
  weapon: WeaponRegistryEntry
): PulseProjectileEffectModifier[] {
  return UPGRADE_CHOICES.flatMap((upgrade) => {
    const level = upgrades[upgrade.id] ?? 0;
    if (level <= 0 || !upgrade.projectileEffects || !isUpgradeRelevantForWeapons(upgrade, [weapon])) {
      return [];
    }

    return Array.from({ length: level }, () => upgrade.projectileEffects as PulseProjectileEffectModifier);
  });
}

function sumPatternValue(modifiers: PulseProjectilePatternModifier[], key: keyof PulseProjectilePatternModifier): number {
  return modifiers.reduce((total, modifier) => total + (typeof modifier[key] === 'number' ? modifier[key] : 0), 0);
}

function sumEffectValue(modifiers: PulseProjectileEffectModifier[], key: keyof PulseProjectileEffectModifier): number {
  return modifiers.reduce((total, modifier) => total + (typeof modifier[key] === 'number' ? modifier[key] : 0), 0);
}
