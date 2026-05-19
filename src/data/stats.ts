import {
  ARMOR_PLATING_DEFENSE_BONUS,
  COMBAT_TRAINING_XP_MULTIPLIER,
  ENGINE_CALIBRATION_ACCELERATION_MULTIPLIER,
  EXTRA_PAYLOAD_AMOUNT_BONUS,
  HULL_REINFORCEMENT_MAX_HULL_BONUS,
  LUCKY_CHARM_DROP_CHANCE_BONUS,
  MAGNET_ARRAY_RADIUS_MULTIPLIER,
  PIERCING_ROUNDS_PIERCE_BONUS,
  SALVAGE_TRAINING_CREDIT_MULTIPLIER,
  type PermanentUpgradeId
} from './permanentUpgrades';
import { COMBAT_NUMBER_SCALE } from './combatScale';

export type PlayerStatKey =
  | 'maxHull'
  | 'defense'
  | 'recovery'
  | 'moveSpeed'
  | 'thrust'
  | 'brake'
  | 'strafe'
  | 'mass'
  | 'damage'
  | 'attackSpeed'
  | 'projectileSpeed'
  | 'area'
  | 'duration'
  | 'amount'
  | 'pierce'
  | 'magnet'
  | 'luck'
  | 'growth'
  | 'greed';

export type PlayerStats = Record<PlayerStatKey, number>;

export type PlayerBaseStats = PlayerStats;

export interface PlayerPassiveStatLevels {
  hullPlating: number;
  engineTuning: number;
  damageControl: number;
  amount: number;
  magnet: number;
  luck: number;
  growth: number;
  greed: number;
}

export interface ResolvePlayerStatsInput {
  baseStats: PlayerBaseStats;
  passiveLevels: PlayerPassiveStatLevels;
  permanentLevels: Record<PermanentUpgradeId, number>;
}

export const DEFAULT_PLAYER_BASE_STATS: PlayerBaseStats = {
  maxHull: 40 * COMBAT_NUMBER_SCALE,
  defense: 0,
  recovery: 0,
  moveSpeed: 500,
  thrust: 560,
  brake: 335,
  strafe: 225,
  mass: 3,
  damage: 1,
  attackSpeed: 1,
  projectileSpeed: 1,
  area: 1,
  duration: 1,
  amount: 0,
  pierce: 0,
  magnet: 1,
  luck: 0,
  growth: 1,
  greed: 1
};

export const HULL_PLATING_MAX_HULL_BONUS = 15 * COMBAT_NUMBER_SCALE;
export const ENGINE_TUNING_ACCELERATION_MULTIPLIER = 0.08;
export const ENGINE_TUNING_MAX_SPEED_MULTIPLIER = 0.04;
export const DAMAGE_CONTROL_INVULNERABILITY_BONUS_MS = 150;
export const DAMAGE_CONTROL_REPAIR = 10 * COMBAT_NUMBER_SCALE;
export const HULL_PLATING_REPAIR = 15 * COMBAT_NUMBER_SCALE;
export const PERMANENT_PLAYER_DAMAGE_MULTIPLIER = 0.05;
export const RUN_AMOUNT_BONUS = 1;
export const RUN_MAGNET_RADIUS_MULTIPLIER = 0.18;
export const RUN_LUCK_DROP_CHANCE_BONUS = 0.04;
export const RUN_GROWTH_XP_MULTIPLIER = 0.1;
export const RUN_GREED_CREDIT_MULTIPLIER = 0.1;

export function resolvePlayerStats(input: ResolvePlayerStatsInput): PlayerStats {
  const engineAccelerationMultiplier =
    1 +
    input.passiveLevels.engineTuning * ENGINE_TUNING_ACCELERATION_MULTIPLIER +
    input.permanentLevels['engine-calibration'] * ENGINE_CALIBRATION_ACCELERATION_MULTIPLIER;
  const engineSpeedMultiplier = 1 + input.passiveLevels.engineTuning * ENGINE_TUNING_MAX_SPEED_MULTIPLIER;

  return {
    ...input.baseStats,
    maxHull:
      input.baseStats.maxHull +
      input.passiveLevels.hullPlating * HULL_PLATING_MAX_HULL_BONUS +
      input.permanentLevels['hull-reinforcement'] * HULL_REINFORCEMENT_MAX_HULL_BONUS,
    moveSpeed: Math.round(input.baseStats.moveSpeed * engineSpeedMultiplier),
    thrust: input.baseStats.thrust * engineAccelerationMultiplier,
    brake: input.baseStats.brake * engineAccelerationMultiplier,
    strafe: input.baseStats.strafe * engineAccelerationMultiplier,
    damage: input.baseStats.damage * (1 + input.permanentLevels['pulse-capacitor'] * PERMANENT_PLAYER_DAMAGE_MULTIPLIER),
    recovery: input.baseStats.recovery + input.passiveLevels.damageControl * DAMAGE_CONTROL_INVULNERABILITY_BONUS_MS,
    defense: input.baseStats.defense + input.permanentLevels['armor-plating'] * ARMOR_PLATING_DEFENSE_BONUS,
    amount:
      input.baseStats.amount +
      input.permanentLevels['extra-payload'] * EXTRA_PAYLOAD_AMOUNT_BONUS +
      input.passiveLevels.amount * RUN_AMOUNT_BONUS,
    pierce: input.baseStats.pierce + input.permanentLevels['piercing-rounds'] * PIERCING_ROUNDS_PIERCE_BONUS,
    magnet:
      input.baseStats.magnet *
      (1 +
        input.permanentLevels['magnet-array'] * MAGNET_ARRAY_RADIUS_MULTIPLIER +
        input.passiveLevels.magnet * RUN_MAGNET_RADIUS_MULTIPLIER),
    growth:
      input.baseStats.growth *
      (1 +
        input.permanentLevels['combat-training'] * COMBAT_TRAINING_XP_MULTIPLIER +
        input.passiveLevels.growth * RUN_GROWTH_XP_MULTIPLIER),
    greed:
      input.baseStats.greed *
      (1 +
        input.permanentLevels['salvage-training'] * SALVAGE_TRAINING_CREDIT_MULTIPLIER +
        input.passiveLevels.greed * RUN_GREED_CREDIT_MULTIPLIER),
    luck:
      input.baseStats.luck +
      input.permanentLevels['lucky-charm'] * LUCKY_CHARM_DROP_CHANCE_BONUS +
      input.passiveLevels.luck * RUN_LUCK_DROP_CHANCE_BONUS
  };
}
