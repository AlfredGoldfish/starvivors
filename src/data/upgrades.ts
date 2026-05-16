export type PulseUpgradeId = 'pulse-damage-1' | 'pulse-fire-rate-1' | 'pulse-velocity-1';
export type PassiveUpgradeId = 'hull-plating' | 'engine-tuning' | 'damage-control';
export type UpgradeId = PulseUpgradeId | PassiveUpgradeId;
export type UpgradeCategory = 'pulse' | 'passive';

export interface UpgradeDefinition {
  id: UpgradeId;
  category: UpgradeCategory;
  name: string;
  description: string;
  maxLevel?: number;
}

export const PASSIVE_UPGRADE_MAX_LEVEL = 5;

export const UPGRADE_CHOICES: UpgradeDefinition[] = [
  {
    id: 'pulse-damage-1',
    category: 'pulse',
    name: 'Weapon Damage I',
    description: '+25% projectile damage per level.'
  },
  {
    id: 'pulse-fire-rate-1',
    category: 'pulse',
    name: 'Weapon Fire Rate I',
    description: 'Reduces cooldown by 12% per level.'
  },
  {
    id: 'pulse-velocity-1',
    category: 'pulse',
    name: 'Weapon Velocity I',
    description: '+20% projectile speed per level.'
  },
  {
    id: 'hull-plating',
    category: 'passive',
    name: 'Hull Plating',
    description: '+15 max hull and repair 15 hull.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'engine-tuning',
    category: 'passive',
    name: 'Engine Tuning',
    description: '+8% acceleration and +4% max speed.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'damage-control',
    category: 'passive',
    name: 'Damage Control',
    description: '+0.15s hit invulnerability and repair 10 hull.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  }
];

export const INITIAL_PULSE_UPGRADE_LEVELS: Record<PulseUpgradeId, number> = {
  'pulse-damage-1': 0,
  'pulse-fire-rate-1': 0,
  'pulse-velocity-1': 0
};

export const INITIAL_PASSIVE_UPGRADE_LEVELS: Record<PassiveUpgradeId, number> = {
  'hull-plating': 0,
  'engine-tuning': 0,
  'damage-control': 0
};
