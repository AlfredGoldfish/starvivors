import { createObjectSizeProfileFromCollisionRadius, type ObjectSizeProfile } from './objectSizeProfile';
import type { EnemyStatusEffect } from '../systems/playerStatusEffects';

export type EnemyRole =
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
  | 'teleporter'
  | 'ambusher'
  | 'berserker'
  | 'orbiter'
  | 'patrol'
  | 'freezer'
  | 'electric'
  | 'summoner'
  | 'thief';

export type EnemyHullShape =
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
  | 'phase'
  | 'trap'
  | 'orbiter';

export type EnemyTrailType = 'none' | 'spark' | 'ion' | 'plasma' | 'scrap';
export type EnemyTelegraphType = 'none' | 'charge-line' | 'sniper-beam' | 'blast-radius' | 'support-aura' | 'phase-ring';
export type EnemyVisualStyle = 'forge-texture' | 'vector-outline' | 'monochrome-outline';
export type VectorShapeBase =
  | 'arrow-diamond'
  | 'chevron'
  | 'hex'
  | 'wedge'
  | 'needle'
  | 'starburst'
  | 'support-core'
  | 'carrier-frame';
export type VectorShapeAttachment =
  | 'nose-line'
  | 'barrel-notch'
  | 'rear-thrusters'
  | 'aim-line'
  | 'core-ring'
  | 'shield-brackets'
  | 'bay-notches'
  | 'crossbars';
export type EnemyEffectKind =
  | 'blink-ring'
  | 'line-sweep'
  | 'spark-trail'
  | 'warning-line'
  | 'warning-radius'
  | 'muzzle-flash'
  | 'spark-burst'
  | 'outline-flash'
  | 'shard-burst'
  | 'support-aura'
  | 'projectile-trail'
  | 'bracket-pulse';

export interface VectorShapeRecipe {
  basePolygon: VectorShapeBase;
  strokeWidth: number;
  outlineColor: number;
  accentColor: number;
  fillColor?: number;
  fillAlpha?: number;
  attachments?: VectorShapeAttachment[];
}

export interface EnemyEffectRecipeEntry {
  kind: EnemyEffectKind;
  color?: number;
  durationMs?: number;
  radius?: number;
  length?: number;
  intensity?: number;
}

export interface EnemyEffectRecipe {
  spawn: EnemyEffectRecipeEntry;
  move: EnemyEffectRecipeEntry;
  telegraph: EnemyEffectRecipeEntry;
  fire: EnemyEffectRecipeEntry;
  hit: EnemyEffectRecipeEntry;
  death: EnemyEffectRecipeEntry;
  status?: EnemyEffectRecipeEntry;
}

export interface EnemyVisualDefinition {
  hullShape: EnemyHullShape;
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
  trailType: EnemyTrailType;
  telegraphType: EnemyTelegraphType;
  hasCore?: boolean;
  hasRing?: boolean;
  hasFins?: boolean;
}

export const DEFAULT_ENEMY_VISUAL_SCALE = 3;

export function resolveEnemyVisualScale(visual: Pick<EnemyVisualDefinition, 'scaleX' | 'scaleY'>): {
  scaleX: number;
  scaleY: number;
} {
  return {
    scaleX: visual.scaleX ?? DEFAULT_ENEMY_VISUAL_SCALE,
    scaleY: visual.scaleY ?? DEFAULT_ENEMY_VISUAL_SCALE
  };
}

export type EnemyBehaviorId =
  | 'directChase'
  | 'ambushReveal'
  | 'berserkChase'
  | 'orbiterCage'
  | 'patrolAlert'
  | 'statusShooter'
  | 'summonerShooter'
  | 'scrapThief'
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

export const ENEMY_BEHAVIOR_IDS = [
  'directChase',
  'ambushReveal',
  'berserkChase',
  'orbiterCage',
  'patrolAlert',
  'statusShooter',
  'summonerShooter',
  'scrapThief',
  'chargeDash',
  'rangeOrbitShooter',
  'heavyChase',
  'proximityDetonate',
  'splitterChase',
  'sniper',
  'carrierSpawner',
  'shieldSupport',
  'repairSupport',
  'commandBuff',
  'scrapScavenger',
  'flanker',
  'reflectorPulse',
  'phaseTeleport'
] as const satisfies readonly EnemyBehaviorId[];

export interface EnemyStats {
  hp: number;
  speed: number;
  acceleration?: number;
  turnRate?: number;
  contactDamage: number;
  contactKnockbackMultiplier?: number;
  contactSelfImpulseMultiplier?: number;
  radius: number;
}

export interface EnemyWeaponDefinition {
  id: string;
  cooldownMs: number;
  projectileSpeed: number;
  damage: number;
  range?: number;
  spread?: number;
  burstCount?: number;
  statuses?: EnemyStatusEffect[];
}

export interface EnemyDefinition {
  id: string;
  displayName: string;
  role: EnemyRole;
  tier: number;
  visualStyle?: EnemyVisualStyle;
  sizeProfile?: ObjectSizeProfile;
  shapeRecipe?: VectorShapeRecipe;
  effectRecipe?: EnemyEffectRecipe;
  visualAssetId?: string;
  visual: EnemyVisualDefinition;
  stats: EnemyStats;
  behavior: {
    id: EnemyBehaviorId;
    params?: Record<string, number | string | boolean>;
  };
  weapon?: EnemyWeaponDefinition;
  rewards?: {
    scrap?: number;
    xp?: number;
  };
}

export interface EnemySquadDefinition {
  id: string;
  displayName: string;
  entries: Array<{
    definitionId: string;
    count: number;
  }>;
  radius: number;
}

const MONOCHROME_WHITE = 0xffffff;
const MONOCHROME_BLACK = 0x000000;

function createEnemySizeProfile(id: string, collisionRadiusPx: number, strokeWidthPx: number): ObjectSizeProfile {
  return createObjectSizeProfileFromCollisionRadius({
    kind: 'enemy',
    id,
    collisionRadiusPx,
    strokeWidthPx
  });
}

function createMonochromeShapeRecipe(
  basePolygon: VectorShapeBase,
  strokeWidth: number,
  attachments: VectorShapeAttachment[] = []
): VectorShapeRecipe {
  return {
    basePolygon,
    strokeWidth,
    outlineColor: MONOCHROME_WHITE,
    accentColor: MONOCHROME_WHITE,
    fillColor: MONOCHROME_BLACK,
    fillAlpha: 1,
    attachments
  };
}

export function resolveEnemyContactKnockbackMultiplier(definition: Pick<EnemyDefinition, 'stats'>): number {
  return sanitizeContactImpulseMultiplier(definition.stats.contactKnockbackMultiplier);
}

export function resolveEnemyContactSelfImpulseMultiplier(definition: Pick<EnemyDefinition, 'stats'>): number {
  return sanitizeContactImpulseMultiplier(definition.stats.contactSelfImpulseMultiplier);
}

function sanitizeContactImpulseMultiplier(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(0, value as number);
}

export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
  {
    id: 'scout',
    displayName: 'Scout',
    role: 'chaser',
    tier: 1,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('scout', 20, 1),
    shapeRecipe: createMonochromeShapeRecipe('arrow-diamond', 1, ['nose-line', 'rear-thrusters']),
    effectRecipe: {
      spawn: { kind: 'blink-ring', color: 0xdce8f5, durationMs: 360, radius: 38, intensity: 0.9 },
      move: { kind: 'spark-trail', color: 0xff5964, durationMs: 140, length: 22, intensity: 0.42 },
      telegraph: { kind: 'line-sweep', color: 0xff5964, durationMs: 260, length: 72, intensity: 0.38 },
      fire: { kind: 'muzzle-flash', color: 0xff5964, durationMs: 130, radius: 14, intensity: 0.5 },
      hit: { kind: 'outline-flash', color: 0xffffff, durationMs: 90, intensity: 0.85 },
      death: { kind: 'shard-burst', color: 0xdce8f5, durationMs: 300, radius: 52, intensity: 0.58 }
    },
    visualAssetId: 'forge.enemy.scout-01',
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('wedge-striker', 29, 1),
    shapeRecipe: createMonochromeShapeRecipe('wedge', 1, ['nose-line', 'rear-thrusters']),
    effectRecipe: {
      spawn: { kind: 'line-sweep', color: 0xff8f4f, durationMs: 320, length: 92, intensity: 0.9 },
      move: { kind: 'spark-trail', color: 0xff8f4f, durationMs: 180, length: 44, intensity: 0.9 },
      telegraph: { kind: 'warning-line', color: 0xff8f4f, durationMs: 720, length: 640, intensity: 1 },
      fire: { kind: 'muzzle-flash', color: 0xffc857, durationMs: 140, radius: 18, intensity: 0.75 },
      hit: { kind: 'outline-flash', color: 0xffffff, durationMs: 80, intensity: 0.95 },
      death: { kind: 'shard-burst', color: 0xff8f4f, durationMs: 420, radius: 86, intensity: 0.95 }
    },
    visual: {
      hullShape: 'wedge',
      size: 74,
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
    stats: { hp: 34, speed: 112, acceleration: 5.1, contactDamage: 18, radius: 29 },
    behavior: {
      id: 'chargeDash',
      params: { aimMs: 220, windupMs: 760, dashMs: 560, recoverMs: 850, dashSpeed: 520, triggerRange: 760, reacquireMs: 900 }
    },
    rewards: { scrap: 2, xp: 10 }
  },
  {
    id: 'diamond-gunner',
    displayName: 'Diamond Gunner',
    role: 'ranged',
    tier: 2,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('diamond-gunner', 27, 2.4),
    shapeRecipe: createMonochromeShapeRecipe('chevron', 2.4, ['barrel-notch']),
    effectRecipe: {
      spawn: { kind: 'blink-ring', color: 0xdce8f5, durationMs: 340, radius: 46, intensity: 0.8 },
      move: { kind: 'spark-trail', color: 0xff5964, durationMs: 190, length: 24, intensity: 0.55 },
      telegraph: { kind: 'line-sweep', color: 0xff5964, durationMs: 260, length: 110, intensity: 0.65 },
      fire: { kind: 'muzzle-flash', color: 0xff5964, durationMs: 130, radius: 18, intensity: 0.95 },
      hit: { kind: 'outline-flash', color: 0xffffff, durationMs: 85, intensity: 0.85 },
      death: { kind: 'shard-burst', color: 0xdce8f5, durationMs: 390, radius: 76, intensity: 0.8 }
    },
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
    weapon: { id: 'enemy-bolt', cooldownMs: 1250, projectileSpeed: 430, damage: 10, range: 1050 },
    rewards: { scrap: 3, xp: 14 }
  },
  {
    id: 'hex-tank',
    displayName: 'Hex Tank',
    role: 'tank',
    tier: 3,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('hex-tank', 40, 1),
    shapeRecipe: createMonochromeShapeRecipe('hex', 1, ['core-ring']),
    effectRecipe: {
      spawn: { kind: 'blink-ring', color: 0xdce8f5, durationMs: 440, radius: 70, intensity: 0.8 },
      move: { kind: 'spark-trail', color: 0xffc857, durationMs: 220, length: 18, intensity: 0.35 },
      telegraph: { kind: 'bracket-pulse', color: 0xffc857, durationMs: 520, radius: 74, intensity: 0.7 },
      fire: { kind: 'muzzle-flash', color: 0xffc857, durationMs: 160, radius: 20, intensity: 0.65 },
      hit: { kind: 'outline-flash', color: 0xffffff, durationMs: 120, intensity: 1 },
      death: { kind: 'shard-burst', color: 0xdce8f5, durationMs: 480, radius: 104, intensity: 0.9 }
    },
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
    stats: {
      hp: 150,
      speed: 58,
      acceleration: 2.6,
      contactDamage: 26,
      contactKnockbackMultiplier: 4,
      contactSelfImpulseMultiplier: 0.45,
      radius: 40
    },
    behavior: { id: 'heavyChase' },
    rewards: { scrap: 6, xp: 28 }
  },
  {
    id: 'reactor-drone',
    displayName: 'Reactor Drone',
    role: 'exploder',
    tier: 2,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('reactor-drone', 26, 2.5),
    shapeRecipe: createMonochromeShapeRecipe('starburst', 2.5, ['core-ring']),
    effectRecipe: {
      spawn: { kind: 'blink-ring', color: 0xffc857, durationMs: 360, radius: 50, intensity: 0.9 },
      move: { kind: 'spark-trail', color: 0xff8f4f, durationMs: 170, length: 32, intensity: 0.85 },
      telegraph: { kind: 'warning-radius', color: 0xff5964, durationMs: 1500, radius: 170, intensity: 1 },
      fire: { kind: 'support-aura', color: 0xff5964, durationMs: 260, radius: 80, intensity: 0.75 },
      hit: { kind: 'outline-flash', color: 0xffffff, durationMs: 80, intensity: 0.95 },
      death: { kind: 'shard-burst', color: 0xff5964, durationMs: 460, radius: 112, intensity: 1 }
    },
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('splitter', 28, 2.5),
    shapeRecipe: createMonochromeShapeRecipe('starburst', 2.5, ['crossbars']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('shard-drone', 15, 1.9),
    shapeRecipe: createMonochromeShapeRecipe('arrow-diamond', 1.9),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('needle-sniper', 29, 2.3),
    shapeRecipe: createMonochromeShapeRecipe('needle', 2.3, ['aim-line']),
    effectRecipe: {
      spawn: { kind: 'line-sweep', color: 0xe96dff, durationMs: 360, length: 120, intensity: 0.75 },
      move: { kind: 'spark-trail', color: 0xe96dff, durationMs: 200, length: 18, intensity: 0.35 },
      telegraph: { kind: 'warning-line', color: 0xffd166, durationMs: 1100, length: 960, intensity: 1 },
      fire: { kind: 'projectile-trail', color: 0xff5964, durationMs: 190, length: 180, intensity: 1 },
      hit: { kind: 'outline-flash', color: 0xffffff, durationMs: 85, intensity: 0.9 },
      death: { kind: 'shard-burst', color: 0xe96dff, durationMs: 420, radius: 88, intensity: 0.85 }
    },
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
    weapon: { id: 'enemy-rail', cooldownMs: 2600, projectileSpeed: 980, damage: 26, range: 1550 },
    rewards: { scrap: 5, xp: 24 }
  },
  {
    id: 'carrier',
    displayName: 'Carrier Foundry',
    role: 'carrier',
    tier: 4,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('carrier', 50, 3.3),
    shapeRecipe: createMonochromeShapeRecipe('carrier-frame', 3.3, ['crossbars']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('shield-frigate', 36, 3.1),
    shapeRecipe: createMonochromeShapeRecipe('support-core', 3.1, ['core-ring']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('repair-skiff', 25, 2.6),
    shapeRecipe: createMonochromeShapeRecipe('support-core', 2.6, ['crossbars']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('command-relay', 32, 2.9),
    shapeRecipe: createMonochromeShapeRecipe('hex', 2.9, ['core-ring', 'crossbars']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('scrap-jackal', 21, 2.2),
    shapeRecipe: createMonochromeShapeRecipe('arrow-diamond', 2.2, ['rear-thrusters']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('flanker', 28, 2.4),
    shapeRecipe: createMonochromeShapeRecipe('chevron', 2.4, ['nose-line']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('reflector', 34, 3),
    shapeRecipe: createMonochromeShapeRecipe('carrier-frame', 3, ['crossbars']),
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
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('phase-skiff', 25, 2.4),
    shapeRecipe: createMonochromeShapeRecipe('needle', 2.4, ['core-ring']),
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
  },
  {
    id: 'ambusher-mine',
    displayName: 'Ambusher Mine',
    role: 'ambusher',
    tier: 2,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('ambusher-mine', 22, 2.4),
    shapeRecipe: createMonochromeShapeRecipe('starburst', 2.4, ['core-ring']),
    visual: {
      hullShape: 'trap',
      size: 48,
      primaryColor: 0xfdd835,
      secondaryColor: 0x5a4a12,
      accentColor: 0xfdd835,
      glowColor: 0xfdd835,
      outlineColor: 0xfff3b0,
      engineColor: 0xff8f4f,
      trailType: 'none',
      telegraphType: 'charge-line',
      hasCore: true
    },
    stats: { hp: 20, speed: 118, acceleration: 5.8, contactDamage: 18, radius: 22 },
    behavior: {
      id: 'ambushReveal',
      params: { revealRange: 220, revealMs: 420, strikeMs: 340, strikeSpeed: 500, chaseSpeedScale: 1.18 }
    },
    rewards: { scrap: 2, xp: 12 }
  },
  {
    id: 'berserker',
    displayName: 'Berserker',
    role: 'berserker',
    tier: 3,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('berserker', 32, 3),
    shapeRecipe: createMonochromeShapeRecipe('wedge', 3, ['nose-line', 'rear-thrusters']),
    visual: {
      hullShape: 'wedge',
      size: 68,
      primaryColor: 0x8d6e63,
      secondaryColor: 0x3a2420,
      accentColor: 0xef5350,
      glowColor: 0xef5350,
      outlineColor: 0xffc2bd,
      engineColor: 0xef5350,
      trailType: 'plasma',
      telegraphType: 'none',
      hasCore: true
    },
    stats: { hp: 86, speed: 104, acceleration: 5.2, contactDamage: 18, radius: 32 },
    behavior: {
      id: 'berserkChase',
      params: { firstThreshold: 0.5, secondThreshold: 0.25, calmSpeedScale: 0.92, firstSpeedScale: 1.34, secondSpeedScale: 1.74 }
    },
    rewards: { scrap: 5, xp: 24 }
  },
  {
    id: 'orbiter',
    displayName: 'Orbiter Cage',
    role: 'orbiter',
    tier: 3,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('orbiter', 24, 2.4),
    shapeRecipe: createMonochromeShapeRecipe('support-core', 2.4, ['core-ring']),
    visual: {
      hullShape: 'orbiter',
      size: 54,
      primaryColor: 0xffab40,
      secondaryColor: 0x5a3210,
      accentColor: 0xffab40,
      glowColor: 0xffab40,
      outlineColor: 0xffdfb0,
      engineColor: 0xffc857,
      trailType: 'spark',
      telegraphType: 'support-aura',
      hasRing: true
    },
    stats: { hp: 42, speed: 138, acceleration: 5.6, contactDamage: 10, radius: 24 },
    behavior: {
      id: 'orbiterCage',
      params: { startRadius: 350, minRadius: 185, tightenMs: 7200, orbitSpeed: 0.92, radialResponse: 1.55 }
    },
    rewards: { scrap: 4, xp: 18 }
  },
  {
    id: 'patrol-guard',
    displayName: 'Patrol Guard',
    role: 'patrol',
    tier: 2,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('patrol-guard', 27, 2.6),
    shapeRecipe: createMonochromeShapeRecipe('hex', 2.6, ['crossbars']),
    visual: {
      hullShape: 'hex',
      size: 58,
      primaryColor: 0xffa726,
      secondaryColor: 0x5a3410,
      accentColor: 0xffa726,
      glowColor: 0xffa726,
      outlineColor: 0xffdfac,
      engineColor: 0xffc857,
      trailType: 'spark',
      telegraphType: 'charge-line',
      hasCore: true
    },
    stats: { hp: 46, speed: 92, acceleration: 4.2, contactDamage: 12, radius: 27 },
    behavior: { id: 'patrolAlert', params: { detectRange: 360, loseRange: 650, patrolRadius: 280 } },
    rewards: { scrap: 3, xp: 16 }
  },
  {
    id: 'frost-gunner',
    displayName: 'Frost Gunner',
    role: 'freezer',
    tier: 3,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('frost-gunner', 26, 2.4),
    shapeRecipe: createMonochromeShapeRecipe('needle', 2.4, ['barrel-notch']),
    effectRecipe: {
      spawn: { kind: 'blink-ring', color: 0x40c4ff, durationMs: 340, radius: 48, intensity: 0.8 },
      move: { kind: 'spark-trail', color: 0x40c4ff, durationMs: 180, length: 22, intensity: 0.5 },
      telegraph: { kind: 'line-sweep', color: 0x8eeaff, durationMs: 300, length: 120, intensity: 0.75 },
      fire: { kind: 'muzzle-flash', color: 0x8eeaff, durationMs: 150, radius: 18, intensity: 1 },
      hit: { kind: 'outline-flash', color: 0xffffff, durationMs: 90, intensity: 0.9 },
      death: { kind: 'shard-burst', color: 0x40c4ff, durationMs: 420, radius: 78, intensity: 0.85 },
      status: { kind: 'spark-burst', color: 0x8eeaff, durationMs: 240, radius: 48, intensity: 0.9 }
    },
    visual: {
      hullShape: 'needle',
      size: 56,
      primaryColor: 0x40c4ff,
      secondaryColor: 0x123b5a,
      accentColor: 0x8eeaff,
      glowColor: 0x40c4ff,
      outlineColor: 0xc8f7ff,
      engineColor: 0x8eeaff,
      trailType: 'ion',
      telegraphType: 'none',
      hasCore: true
    },
    stats: { hp: 38, speed: 82, acceleration: 3.8, contactDamage: 7, radius: 26 },
    behavior: {
      id: 'statusShooter',
      params: { statusKind: 'frost', statusDurationMs: 2200, statusIntensity: 1, preferredRange: 560, retreatRange: 300 }
    },
    weapon: { id: 'enemy-frost-needle', cooldownMs: 1450, projectileSpeed: 390, damage: 6, range: 950 },
    rewards: { scrap: 4, xp: 22 }
  },
  {
    id: 'electric-leech',
    displayName: 'Electric Leech',
    role: 'electric',
    tier: 3,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('electric-leech', 24, 2.5),
    shapeRecipe: createMonochromeShapeRecipe('chevron', 2.5, ['rear-thrusters']),
    visual: {
      hullShape: 'boomerang',
      size: 54,
      primaryColor: 0x69f0ae,
      secondaryColor: 0x164c38,
      accentColor: 0xb3f7ff,
      glowColor: 0x69f0ae,
      outlineColor: 0xd5fff1,
      engineColor: 0x73f2ff,
      trailType: 'ion',
      telegraphType: 'none',
      hasFins: true
    },
    stats: { hp: 34, speed: 132, acceleration: 5.4, contactDamage: 9, radius: 24 },
    behavior: {
      id: 'statusShooter',
      params: {
        statusKind: 'electric',
        statusDurationMs: 3200,
        statusIntensity: 1,
        statusDamagePerSecond: 5,
        statusTickMs: 500,
        statusAccelerationDrag: 0.18,
        preferredRange: 420,
        retreatRange: 190
      }
    },
    weapon: { id: 'enemy-arc-bolt', cooldownMs: 1650, projectileSpeed: 360, damage: 5, range: 820 },
    rewards: { scrap: 4, xp: 22 }
  },
  {
    id: 'combat-summoner',
    displayName: 'Combat Summoner',
    role: 'summoner',
    tier: 4,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('combat-summoner', 34, 3),
    shapeRecipe: createMonochromeShapeRecipe('carrier-frame', 3, ['core-ring', 'bay-notches']),
    visual: {
      hullShape: 'carrier',
      size: 74,
      primaryColor: 0x00bcd4,
      secondaryColor: 0x123f4a,
      accentColor: 0xff6e40,
      glowColor: 0x00bcd4,
      outlineColor: 0xb2ebf2,
      engineColor: 0xff6e40,
      trailType: 'ion',
      telegraphType: 'support-aura',
      hasCore: true
    },
    stats: { hp: 82, speed: 74, acceleration: 3.4, contactDamage: 10, radius: 34 },
    behavior: {
      id: 'summonerShooter',
      params: { summonId: 'scout', summonCount: 3, summonEveryMs: 5600, channelMs: 900, preferredRange: 620, retreatRange: 340 }
    },
    weapon: { id: 'enemy-summoner-shot', cooldownMs: 1550, projectileSpeed: 420, damage: 9, range: 1000 },
    rewards: { scrap: 7, xp: 34 }
  },
  {
    id: 'scrap-thief',
    displayName: 'Scrap Thief',
    role: 'thief',
    tier: 2,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('scrap-thief', 20, 2.2),
    shapeRecipe: createMonochromeShapeRecipe('arrow-diamond', 2.2, ['rear-thrusters']),
    visual: {
      hullShape: 'kite',
      size: 44,
      primaryColor: 0xffca28,
      secondaryColor: 0x5c410f,
      accentColor: 0xffca28,
      glowColor: 0xffca28,
      outlineColor: 0xffef9d,
      engineColor: 0xff8f4f,
      trailType: 'scrap',
      telegraphType: 'none',
      hasFins: true
    },
    stats: { hp: 22, speed: 196, acceleration: 7.4, contactDamage: 3, radius: 20 },
    behavior: { id: 'scrapThief', params: { fleeDistance: 480, pickupRange: 46, bonusScrap: 3 } },
    rewards: { scrap: 2, xp: 10 }
  },
  {
    id: 'impact-bomber',
    displayName: 'Impact Bomber',
    role: 'exploder',
    tier: 2,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('impact-bomber', 24, 2.5),
    shapeRecipe: createMonochromeShapeRecipe('starburst', 2.5, ['core-ring']),
    visual: {
      hullShape: 'reactor',
      size: 52,
      primaryColor: 0xff7043,
      secondaryColor: 0x5c1e14,
      accentColor: 0xffc857,
      glowColor: 0xff7043,
      outlineColor: 0xffd0b0,
      engineColor: 0xffc857,
      trailType: 'plasma',
      telegraphType: 'blast-radius',
      hasCore: true
    },
    stats: { hp: 22, speed: 132, acceleration: 4.6, contactDamage: 8, radius: 24 },
    behavior: {
      id: 'proximityDetonate',
      params: { triggerRange: 62, blastRadius: 125, countdownMs: 0, blastDamage: 26 }
    },
    rewards: { scrap: 2, xp: 10 }
  },
  {
    id: 'spawner-nest',
    displayName: 'Spawner Nest',
    role: 'carrier',
    tier: 4,
    visualStyle: 'monochrome-outline',
    sizeProfile: createEnemySizeProfile('spawner-nest', 48, 3.4),
    shapeRecipe: createMonochromeShapeRecipe('carrier-frame', 3.4, ['bay-notches']),
    visual: {
      hullShape: 'carrier',
      size: 96,
      primaryColor: 0x9c27b0,
      secondaryColor: 0x33123f,
      accentColor: 0xffc857,
      glowColor: 0x9c27b0,
      outlineColor: 0xf0c2ff,
      engineColor: 0xffc857,
      trailType: 'none',
      telegraphType: 'support-aura',
      hasCore: true
    },
    stats: { hp: 150, speed: 18, acceleration: 0.9, contactDamage: 12, radius: 48 },
    behavior: {
      id: 'carrierSpawner',
      params: { spawnId: 'shard-drone', spawnEveryMs: 2600, maxChildren: 10, driftRange: 240 }
    },
    rewards: { scrap: 8, xp: 36 }
  }
];

export const ENEMY_SQUADS: EnemySquadDefinition[] = [
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
  },
  {
    id: 'prototype-sampler',
    displayName: 'Prototype Sampler',
    radius: 320,
    entries: [
      { definitionId: 'ambusher-mine', count: 1 },
      { definitionId: 'berserker', count: 1 },
      { definitionId: 'orbiter', count: 1 },
      { definitionId: 'patrol-guard', count: 1 },
      { definitionId: 'frost-gunner', count: 1 },
      { definitionId: 'electric-leech', count: 1 },
      { definitionId: 'combat-summoner', count: 1 },
      { definitionId: 'scrap-thief', count: 1 }
    ]
  },
  {
    id: 'support-trio',
    displayName: 'Support Trio',
    radius: 220,
    entries: [
      { definitionId: 'hex-tank', count: 1 },
      { definitionId: 'shield-frigate', count: 1 },
      { definitionId: 'repair-skiff', count: 1 }
    ]
  },
  {
    id: 'status-combo',
    displayName: 'Frost Arc Combo',
    radius: 260,
    entries: [
      { definitionId: 'frost-gunner', count: 2 },
      { definitionId: 'electric-leech', count: 2 },
      { definitionId: 'berserker', count: 1 }
    ]
  },
  {
    id: 'summoner-cell',
    displayName: 'Summoner Cell',
    radius: 280,
    entries: [
      { definitionId: 'combat-summoner', count: 1 },
      { definitionId: 'spawner-nest', count: 1 },
      { definitionId: 'patrol-guard', count: 2 }
    ]
  }
];

export function getEnemyDefinition(id: string): EnemyDefinition {
  const definition = ENEMY_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new Error(`Unknown enemy definition: ${id}`);
  }

  return definition;
}
