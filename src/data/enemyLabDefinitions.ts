export type EnemyLabRole =
  | 'chaser'
  | 'charger'
  | 'ranged'
  | 'tank'
  | 'exploder'
  | 'splitter'
  | 'sniper'
  | 'carrier'
  | 'shield'
  | 'repair'
  | 'buffer'
  | 'scavenger'
  | 'flanker'
  | 'reflector'
  | 'teleporter';

export type EnemyLabHullShape =
  | 'kite'
  | 'wedge'
  | 'diamond'
  | 'hex'
  | 'reactor'
  | 'crystal'
  | 'needle'
  | 'carrier'
  | 'crescent'
  | 'cross'
  | 'command'
  | 'boomerang'
  | 'reflector'
  | 'phase';

export type EnemyLabTrailType = 'none' | 'spark' | 'ion' | 'plasma' | 'scrap';
export type EnemyLabTelegraphType = 'none' | 'charge-line' | 'sniper-beam' | 'blast-radius' | 'support-aura' | 'phase-ring';

export interface EnemyVisualDefinition {
  hullShape: EnemyLabHullShape;
  size: number;
  scaleX?: number;
  scaleY?: number;
  rotationOffset?: number;
  glowScale?: number;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  glowColor: number;
  outlineColor: number;
  engineColor: number;
  trailType: EnemyLabTrailType;
  telegraphType: EnemyLabTelegraphType;
  hasCore?: boolean;
  hasRing?: boolean;
  hasFins?: boolean;
}

export type EnemyLabBehaviorId =
  | 'directChase'
  | 'chargeDash'
  | 'rangeOrbitShooter'
  | 'heavyChase'
  | 'proximityDetonate'
  | 'splitterChase'
  | 'sniper'
  | 'carrierSpawner'
  | 'shieldSupport'
  | 'repairSupport'
  | 'commandBuff'
  | 'scrapScavenger'
  | 'flanker'
  | 'reflectorPulse'
  | 'phaseTeleport';

export interface EnemyLabStats {
  hp: number;
  speed: number;
  acceleration?: number;
  turnRate?: number;
  contactDamage: number;
  radius: number;
}

export interface EnemyLabWeaponDefinition {
  id: string;
  cooldownMs: number;
  projectileSpeed: number;
  damage: number;
  range?: number;
  spread?: number;
  burstCount?: number;
}

export interface EnemyLabDefinition {
  id: string;
  displayName: string;
  role: EnemyLabRole;
  tier: number;
  visual: EnemyVisualDefinition;
  stats: EnemyLabStats;
  behavior: {
    id: EnemyLabBehaviorId;
    params?: Record<string, number | string | boolean>;
  };
  weapon?: EnemyLabWeaponDefinition;
  rewards?: {
    scrap?: number;
    xp?: number;
  };
}

export interface EnemyLabSquadDefinition {
  id: string;
  displayName: string;
  entries: Array<{
    definitionId: string;
    count: number;
  }>;
  radius: number;
}

export const ENEMY_LAB_DEFINITIONS: EnemyLabDefinition[] = [
  {
    id: 'scout',
    displayName: 'Scout',
    role: 'chaser',
    tier: 1,
    visual: {
      hullShape: 'kite',
      size: 42,
      primaryColor: 0x42f5d7,
      secondaryColor: 0x147a8a,
      accentColor: 0xf2fbff,
      glowColor: 0x42f5d7,
      outlineColor: 0xa8fff2,
      engineColor: 0x73f2ff,
      trailType: 'ion',
      telegraphType: 'none',
      hasFins: true
    },
    stats: { hp: 18, speed: 122, acceleration: 4.8, contactDamage: 8, radius: 20 },
    behavior: { id: 'directChase' },
    rewards: { scrap: 1, xp: 4 }
  },
  {
    id: 'wedge-striker',
    displayName: 'Wedge Striker',
    role: 'charger',
    tier: 2,
    visual: {
      hullShape: 'wedge',
      size: 62,
      primaryColor: 0xff5964,
      secondaryColor: 0x7a1f36,
      accentColor: 0xffd166,
      glowColor: 0xff5964,
      outlineColor: 0xffb3a8,
      engineColor: 0xff8f4f,
      trailType: 'plasma',
      telegraphType: 'charge-line',
      hasCore: true
    },
    stats: { hp: 34, speed: 112, acceleration: 5.1, contactDamage: 18, radius: 25 },
    behavior: {
      id: 'chargeDash',
      params: { windupMs: 720, dashMs: 560, recoverMs: 850, dashSpeed: 520 }
    },
    rewards: { scrap: 2, xp: 10 }
  },
  {
    id: 'diamond-gunner',
    displayName: 'Diamond Gunner',
    role: 'ranged',
    tier: 2,
    visual: {
      hullShape: 'diamond',
      size: 58,
      primaryColor: 0x73f2ff,
      secondaryColor: 0x264b7a,
      accentColor: 0xf2fbff,
      glowColor: 0x73f2ff,
      outlineColor: 0xc8f7ff,
      engineColor: 0x42f5d7,
      trailType: 'spark',
      telegraphType: 'none',
      hasFins: true
    },
    stats: { hp: 42, speed: 88, acceleration: 3.7, contactDamage: 8, radius: 27 },
    behavior: {
      id: 'rangeOrbitShooter',
      params: { preferredRange: 560, retreatRange: 340, orbitSpeed: 0.56 }
    },
    weapon: { id: 'lab-bolt', cooldownMs: 1250, projectileSpeed: 430, damage: 10, range: 1050 },
    rewards: { scrap: 3, xp: 14 }
  },
  {
    id: 'hex-tank',
    displayName: 'Hex Tank',
    role: 'tank',
    tier: 3,
    visual: {
      hullShape: 'hex',
      size: 82,
      primaryColor: 0x8fa3b8,
      secondaryColor: 0x34485e,
      accentColor: 0xffc857,
      glowColor: 0x52627f,
      outlineColor: 0xdce8f5,
      engineColor: 0xffc857,
      trailType: 'none',
      telegraphType: 'none',
      hasCore: true
    },
    stats: { hp: 150, speed: 58, acceleration: 2.6, contactDamage: 26, radius: 40 },
    behavior: { id: 'heavyChase' },
    rewards: { scrap: 6, xp: 28 }
  },
  {
    id: 'reactor-drone',
    displayName: 'Reactor Drone',
    role: 'exploder',
    tier: 2,
    visual: {
      hullShape: 'reactor',
      size: 56,
      primaryColor: 0xffc857,
      secondaryColor: 0x5c2c14,
      accentColor: 0xff5964,
      glowColor: 0xffc857,
      outlineColor: 0xffe7a8,
      engineColor: 0xff5964,
      trailType: 'plasma',
      telegraphType: 'blast-radius',
      hasCore: true,
      hasRing: true
    },
    stats: { hp: 30, speed: 104, acceleration: 3.8, contactDamage: 10, radius: 26 },
    behavior: {
      id: 'proximityDetonate',
      params: { triggerRange: 120, blastRadius: 170, countdownMs: 1500, blastDamage: 35 }
    },
    rewards: { scrap: 2, xp: 12 }
  },
  {
    id: 'splitter',
    displayName: 'Splitter',
    role: 'splitter',
    tier: 2,
    visual: {
      hullShape: 'crystal',
      size: 60,
      primaryColor: 0xb88cff,
      secondaryColor: 0x3c2866,
      accentColor: 0xf2fbff,
      glowColor: 0xb88cff,
      outlineColor: 0xdcc7ff,
      engineColor: 0x73f2ff,
      trailType: 'spark',
      telegraphType: 'none',
      hasCore: true
    },
    stats: { hp: 48, speed: 92, acceleration: 3.8, contactDamage: 12, radius: 28 },
    behavior: { id: 'splitterChase', params: { childId: 'shard-drone', childCount: 3 } },
    rewards: { scrap: 2, xp: 12 }
  },
  {
    id: 'shard-drone',
    displayName: 'Shard Drone',
    role: 'chaser',
    tier: 1,
    visual: {
      hullShape: 'kite',
      size: 30,
      primaryColor: 0xdcc7ff,
      secondaryColor: 0x5b3f8a,
      accentColor: 0xf2fbff,
      glowColor: 0xb88cff,
      outlineColor: 0xf2fbff,
      engineColor: 0x73f2ff,
      trailType: 'spark',
      telegraphType: 'none'
    },
    stats: { hp: 10, speed: 142, acceleration: 5.3, contactDamage: 6, radius: 15 },
    behavior: { id: 'directChase' },
    rewards: { scrap: 1, xp: 2 }
  },
  {
    id: 'needle-sniper',
    displayName: 'Needle Sniper',
    role: 'sniper',
    tier: 3,
    visual: {
      hullShape: 'needle',
      size: 76,
      primaryColor: 0xe96dff,
      secondaryColor: 0x40115c,
      accentColor: 0xf2fbff,
      glowColor: 0xe96dff,
      outlineColor: 0xffcaff,
      engineColor: 0x73f2ff,
      trailType: 'none',
      telegraphType: 'sniper-beam',
      hasCore: true
    },
    stats: { hp: 46, speed: 54, acceleration: 2.1, contactDamage: 9, radius: 29 },
    behavior: {
      id: 'sniper',
      params: { preferredRange: 860, aimMs: 1100, lockMs: 380, cooldownMs: 1800 }
    },
    weapon: { id: 'lab-rail', cooldownMs: 2600, projectileSpeed: 980, damage: 26, range: 1550 },
    rewards: { scrap: 5, xp: 24 }
  },
  {
    id: 'carrier',
    displayName: 'Carrier Foundry',
    role: 'carrier',
    tier: 4,
    visual: {
      hullShape: 'carrier',
      size: 100,
      primaryColor: 0x6f89b7,
      secondaryColor: 0x26334a,
      accentColor: 0xffc857,
      glowColor: 0x73f2ff,
      outlineColor: 0xc6d8ff,
      engineColor: 0x42f5d7,
      trailType: 'ion',
      telegraphType: 'none',
      hasCore: true
    },
    stats: { hp: 180, speed: 42, acceleration: 1.8, contactDamage: 18, radius: 50 },
    behavior: {
      id: 'carrierSpawner',
      params: { spawnId: 'scout', spawnEveryMs: 3400, maxChildren: 8, driftRange: 720 }
    },
    rewards: { scrap: 9, xp: 42 }
  },
  {
    id: 'shield-frigate',
    displayName: 'Shield Frigate',
    role: 'shield',
    tier: 3,
    visual: {
      hullShape: 'crescent',
      size: 76,
      primaryColor: 0x42a5f5,
      secondaryColor: 0x173a6a,
      accentColor: 0xf2fbff,
      glowColor: 0x42a5f5,
      outlineColor: 0xb9e4ff,
      engineColor: 0x73f2ff,
      trailType: 'ion',
      telegraphType: 'support-aura',
      hasRing: true
    },
    stats: { hp: 74, speed: 80, acceleration: 3.2, contactDamage: 10, radius: 36 },
    behavior: { id: 'shieldSupport', params: { auraRadius: 230, damageReduction: 0.45 } },
    rewards: { scrap: 5, xp: 24 }
  },
  {
    id: 'repair-skiff',
    displayName: 'Repair Skiff',
    role: 'repair',
    tier: 3,
    visual: {
      hullShape: 'cross',
      size: 52,
      primaryColor: 0x66bb6a,
      secondaryColor: 0x1e5a37,
      accentColor: 0xf2fbff,
      glowColor: 0x66bb6a,
      outlineColor: 0xc7ffd0,
      engineColor: 0x42f5d7,
      trailType: 'spark',
      telegraphType: 'support-aura',
      hasCore: true
    },
    stats: { hp: 38, speed: 108, acceleration: 4.6, contactDamage: 6, radius: 25 },
    behavior: { id: 'repairSupport', params: { healRange: 260, healPerSecond: 13 } },
    rewards: { scrap: 4, xp: 20 }
  },
  {
    id: 'command-relay',
    displayName: 'Command Relay',
    role: 'buffer',
    tier: 3,
    visual: {
      hullShape: 'command',
      size: 68,
      primaryColor: 0xffd166,
      secondaryColor: 0x5a4114,
      accentColor: 0xf2fbff,
      glowColor: 0xffd166,
      outlineColor: 0xffedb6,
      engineColor: 0x73f2ff,
      trailType: 'none',
      telegraphType: 'support-aura',
      hasRing: true
    },
    stats: { hp: 58, speed: 76, acceleration: 3.1, contactDamage: 8, radius: 32 },
    behavior: { id: 'commandBuff', params: { auraRadius: 270, speedBonus: 1.22, fireRateBonus: 0.78 } },
    rewards: { scrap: 5, xp: 24 }
  },
  {
    id: 'scrap-jackal',
    displayName: 'Scrap Jackal',
    role: 'scavenger',
    tier: 2,
    visual: {
      hullShape: 'kite',
      size: 46,
      primaryColor: 0xffb703,
      secondaryColor: 0x8a3f00,
      accentColor: 0xf2fbff,
      glowColor: 0xffb703,
      outlineColor: 0xffef9d,
      engineColor: 0xff5964,
      trailType: 'scrap',
      telegraphType: 'none',
      hasFins: true
    },
    stats: { hp: 24, speed: 190, acceleration: 7.2, contactDamage: 4, radius: 21 },
    behavior: { id: 'scrapScavenger', params: { fleeDistance: 360, pickupRange: 40 } },
    rewards: { scrap: 4, xp: 10 }
  },
  {
    id: 'flanker',
    displayName: 'Flanker',
    role: 'flanker',
    tier: 2,
    visual: {
      hullShape: 'boomerang',
      size: 60,
      primaryColor: 0x4dd0e1,
      secondaryColor: 0x174f62,
      accentColor: 0xffc857,
      glowColor: 0x4dd0e1,
      outlineColor: 0xc8f7ff,
      engineColor: 0xffc857,
      trailType: 'ion',
      telegraphType: 'none',
      hasCore: true
    },
    stats: { hp: 40, speed: 126, acceleration: 4.8, contactDamage: 12, radius: 28 },
    behavior: { id: 'flanker', params: { flankDistance: 300, attackRange: 170 } },
    rewards: { scrap: 3, xp: 16 }
  },
  {
    id: 'reflector',
    displayName: 'Reflector',
    role: 'reflector',
    tier: 4,
    visual: {
      hullShape: 'reflector',
      size: 72,
      primaryColor: 0xf2fbff,
      secondaryColor: 0x31415e,
      accentColor: 0xff5964,
      glowColor: 0xa8c7ff,
      outlineColor: 0xffffff,
      engineColor: 0x73f2ff,
      trailType: 'none',
      telegraphType: 'support-aura',
      hasCore: true
    },
    stats: { hp: 70, speed: 82, acceleration: 3.1, contactDamage: 12, radius: 34 },
    behavior: { id: 'reflectorPulse', params: { shieldMs: 1200, cooldownMs: 2800, frontArcDegrees: 92 } },
    rewards: { scrap: 5, xp: 26 }
  },
  {
    id: 'phase-skiff',
    displayName: 'Phase Skiff',
    role: 'teleporter',
    tier: 4,
    visual: {
      hullShape: 'phase',
      size: 54,
      primaryColor: 0x8f7cff,
      secondaryColor: 0x24205a,
      accentColor: 0x42f5d7,
      glowColor: 0x8f7cff,
      outlineColor: 0xd6ccff,
      engineColor: 0x42f5d7,
      trailType: 'spark',
      telegraphType: 'phase-ring',
      hasRing: true
    },
    stats: { hp: 36, speed: 128, acceleration: 5.4, contactDamage: 11, radius: 25 },
    behavior: { id: 'phaseTeleport', params: { teleportEveryMs: 3200, minRange: 260, maxRange: 520 } },
    rewards: { scrap: 5, xp: 28 }
  }
];

export const ENEMY_LAB_SQUADS: EnemyLabSquadDefinition[] = [
  { id: 'scout-pack', displayName: 'Scout Pack', radius: 170, entries: [{ definitionId: 'scout', count: 8 }] },
  { id: 'strike-wing', displayName: 'Strike Wing', radius: 190, entries: [{ definitionId: 'wedge-striker', count: 3 }] },
  {
    id: 'gunner-escort',
    displayName: 'Gunner Escort',
    radius: 210,
    entries: [
      { definitionId: 'diamond-gunner', count: 1 },
      { definitionId: 'scout', count: 4 }
    ]
  },
  {
    id: 'carrier-group',
    displayName: 'Carrier Group',
    radius: 240,
    entries: [
      { definitionId: 'carrier', count: 1 },
      { definitionId: 'scout', count: 6 }
    ]
  },
  {
    id: 'support-group',
    displayName: 'Support Group',
    radius: 260,
    entries: [
      { definitionId: 'shield-frigate', count: 1 },
      { definitionId: 'repair-skiff', count: 1 },
      { definitionId: 'command-relay', count: 1 },
      { definitionId: 'scout', count: 3 },
      { definitionId: 'diamond-gunner', count: 2 },
      { definitionId: 'hex-tank', count: 1 }
    ]
  },
  {
    id: 'sniper-screen',
    displayName: 'Sniper Screen',
    radius: 260,
    entries: [
      { definitionId: 'needle-sniper', count: 2 },
      { definitionId: 'scout', count: 4 }
    ]
  }
];

export function getEnemyLabDefinition(id: string): EnemyLabDefinition {
  const definition = ENEMY_LAB_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new Error(`Unknown enemy lab definition: ${id}`);
  }

  return definition;
}

