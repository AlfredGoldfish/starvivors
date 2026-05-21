export type PermanentUpgradeId =
  | 'hull-reinforcement'
  | 'velocity-limiter'
  | 'engine-calibration'
  | 'pulse-capacitor'
  | 'extra-payload'
  | 'piercing-rounds'
  | 'armor-plating'
  | 'magnet-array'
  | 'combat-training'
  | 'salvage-training'
  | 'lucky-charm';

export interface PermanentUpgradeDefinition {
  id: PermanentUpgradeId;
  name: string;
  description: string;
  baseCost: number;
  maxLevel: number;
  statLabel: string;
  accentColor: number;
}

export const PERMANENT_UPGRADE_DEFINITIONS: PermanentUpgradeDefinition[] = [
  {
    id: 'hull-reinforcement',
    name: 'Hull Reinforcement',
    description: '+10 starting and max hull per level.',
    baseCost: 50,
    maxLevel: 5,
    statLabel: 'HUL',
    accentColor: 0xff5964
  },
  {
    id: 'velocity-limiter',
    name: 'Velocity Limiter',
    description: '+100 ship speed limit per active level.',
    baseCost: 100,
    maxLevel: 5,
    statLabel: 'VEL',
    accentColor: 0x38bdf8
  },
  {
    id: 'engine-calibration',
    name: 'Engine Calibration',
    description: '+5% thrust acceleration per level.',
    baseCost: 60,
    maxLevel: 5,
    statLabel: 'ENG',
    accentColor: 0x42f5d7
  },
  {
    id: 'pulse-capacitor',
    name: 'Pulse Capacitor',
    description: '+5% main weapon damage per level.',
    baseCost: 75,
    maxLevel: 5,
    statLabel: 'DMG',
    accentColor: 0xffc857
  },
  {
    id: 'extra-payload',
    name: 'Extra Payload',
    description: '+1 projectile amount per level.',
    baseCost: 120,
    maxLevel: 5,
    statLabel: 'AMT',
    accentColor: 0x73f2ff
  },
  {
    id: 'piercing-rounds',
    name: 'Piercing Rounds',
    description: '+1 projectile pierce per level.',
    baseCost: 110,
    maxLevel: 5,
    statLabel: 'PIR',
    accentColor: 0xf2fbff
  },
  {
    id: 'armor-plating',
    name: 'Armor Plating',
    description: '+1 defense per level.',
    baseCost: 90,
    maxLevel: 5,
    statLabel: 'DEF',
    accentColor: 0x8fb6c8
  },
  {
    id: 'magnet-array',
    name: 'Magnet Array',
    description: '+10% scrap pickup radius per level.',
    baseCost: 80,
    maxLevel: 5,
    statLabel: 'MAG',
    accentColor: 0xb0ff8f
  },
  {
    id: 'combat-training',
    name: 'Combat Training',
    description: '+5% XP gain per level.',
    baseCost: 95,
    maxLevel: 5,
    statLabel: 'GRW',
    accentColor: 0xc084fc
  },
  {
    id: 'salvage-training',
    name: 'Salvage Training',
    description: '+5% credits earned from scrap per level.',
    baseCost: 80,
    maxLevel: 5,
    statLabel: 'GRD',
    accentColor: 0xf59e0b
  },
  {
    id: 'lucky-charm',
    name: 'Lucky Charm',
    description: '+5% drop chance per level.',
    baseCost: 100,
    maxLevel: 5,
    statLabel: 'LCK',
    accentColor: 0xf472b6
  }
];

export const INITIAL_PERMANENT_UPGRADE_LEVELS: Record<PermanentUpgradeId, number> = {
  'hull-reinforcement': 0,
  'velocity-limiter': 0,
  'engine-calibration': 0,
  'pulse-capacitor': 0,
  'extra-payload': 0,
  'piercing-rounds': 0,
  'armor-plating': 0,
  'magnet-array': 0,
  'combat-training': 0,
  'salvage-training': 0,
  'lucky-charm': 0
};

export const HULL_REINFORCEMENT_MAX_HULL_BONUS = 10;
export const VELOCITY_LIMITER_BASE_SPEED = 500;
export const VELOCITY_LIMITER_SPEED_BONUS = 100;
export const ENGINE_CALIBRATION_ACCELERATION_MULTIPLIER = 0.05;
export const EXTRA_PAYLOAD_AMOUNT_BONUS = 1;
export const PIERCING_ROUNDS_PIERCE_BONUS = 1;
export const ARMOR_PLATING_DEFENSE_BONUS = 1;
export const MAGNET_ARRAY_RADIUS_MULTIPLIER = 0.1;
export const COMBAT_TRAINING_XP_MULTIPLIER = 0.05;
export const SALVAGE_TRAINING_CREDIT_MULTIPLIER = 0.05;
export const LUCKY_CHARM_DROP_CHANCE_BONUS = 0.05;
