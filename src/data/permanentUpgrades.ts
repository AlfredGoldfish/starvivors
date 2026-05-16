export type PermanentUpgradeId =
  | 'hull-reinforcement'
  | 'engine-calibration'
  | 'pulse-capacitor'
  | 'salvage-training';

export interface PermanentUpgradeDefinition {
  id: PermanentUpgradeId;
  name: string;
  description: string;
  baseCost: number;
  maxLevel: number;
}

export const PERMANENT_UPGRADE_DEFINITIONS: PermanentUpgradeDefinition[] = [
  {
    id: 'hull-reinforcement',
    name: 'Hull Reinforcement',
    description: '+10 starting and max hull per level.',
    baseCost: 50,
    maxLevel: 5
  },
  {
    id: 'engine-calibration',
    name: 'Engine Calibration',
    description: '+5% thrust acceleration per level.',
    baseCost: 60,
    maxLevel: 5
  },
  {
    id: 'pulse-capacitor',
    name: 'Pulse Capacitor',
    description: '+5% main weapon damage per level.',
    baseCost: 75,
    maxLevel: 5
  },
  {
    id: 'salvage-training',
    name: 'Salvage Training',
    description: '+5% credits earned from scrap per level.',
    baseCost: 80,
    maxLevel: 5
  }
];

export const INITIAL_PERMANENT_UPGRADE_LEVELS: Record<PermanentUpgradeId, number> = {
  'hull-reinforcement': 0,
  'engine-calibration': 0,
  'pulse-capacitor': 0,
  'salvage-training': 0
};

export const HULL_REINFORCEMENT_MAX_HULL_BONUS = 10;
export const ENGINE_CALIBRATION_ACCELERATION_MULTIPLIER = 0.05;
export const SALVAGE_TRAINING_CREDIT_MULTIPLIER = 0.05;
