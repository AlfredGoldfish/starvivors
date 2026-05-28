import type { EnemyLabRole } from './enemyLabDefinitions';

export type EnemyAttackId =
  | 'rail-line'
  | 'mortar-lob'
  | 'emp-nova'
  | 'summon-glyphs'
  | 'sweep-laser'
  | 'healing-beam'
  | 'shield-wall'
  | 'plasma-puddle'
  | 'cluster-bomb'
  | 'alarm-ping'
  | 'berserker-shockwave'
  | 'mine-reveal'
  | 'contact-ram'
  | 'simple-bolt'
  | 'charge-strike'
  | 'self-destruct-radius'
  | 'split-shards'
  | 'command-buff-pulse'
  | 'scrap-steal'
  | 'phase-blink-strike';

export type AttackHostKind = 'enemy' | 'player-test' | 'mothership';
export type AttackTargetKind = 'player' | 'enemy' | 'ally' | 'point' | 'self';
export type EnemyAttackParamValue = number | string | boolean;
export type EnemyAttackBatch = 'A' | 'B' | 'C' | 'core';
export type EnemyAttackStatus = 'planned' | 'prototype' | 'ready';
export type EnemyAttackTag =
  | 'line'
  | 'beam'
  | 'lob'
  | 'area'
  | 'status'
  | 'summon'
  | 'support'
  | 'defense'
  | 'alarm'
  | 'contact'
  | 'readability-critical';

export interface AttackLoadoutSlot {
  attackId: EnemyAttackId;
  enabled: boolean;
  params?: Record<string, EnemyAttackParamValue>;
  cooldownOffsetMs?: number;
  weight?: number;
  label?: string;
}

export interface AttackTelegraphRecipe {
  kind: 'line-lock' | 'landing-circle' | 'expanding-ring' | 'glyphs' | 'sweep-lane' | 'tether' | 'shield-arc' | 'detect-beam' | 'hidden-reveal' | 'none';
  color: number;
  accentColor?: number;
  strokeWidthPx?: number;
  radiusPx?: number;
  rangePx?: number;
  durationMs?: number;
}

export interface AttackEffectRecipe {
  kind: 'beam' | 'lob-projectile' | 'nova-ring' | 'summon-glyphs' | 'sweep-beam' | 'support-tether' | 'shield-arc' | 'puddle-zone' | 'cluster-split' | 'alarm-ping' | 'shockwave' | 'blast-radius' | 'contact' | 'projectile' | 'shards' | 'buff-pulse' | 'scrap-link' | 'blink-strike';
  color: number;
  accentColor?: number;
  radiusPx?: number;
  widthPx?: number;
  durationMs?: number;
}

export interface AttackExecutionRecipe {
  kind: EnemyAttackId;
  damage?: number;
  statusKind?: 'frost' | 'electric' | 'slow';
  spawnId?: string;
  projectileSpeedPx?: number;
  reflect?: boolean;
}

export interface EnemyAttackDefinition {
  id: EnemyAttackId;
  displayName: string;
  baseHostIds: string[];
  sourceRole: EnemyLabRole | 'player-test' | 'mothership';
  tags: EnemyAttackTag[];
  defaultParams: Record<string, EnemyAttackParamValue>;
  timing: {
    initialDelayMs: number;
    cooldownMs: number;
    windupMs: number;
    channelMs?: number;
    activeMs?: number;
    recoveryMs: number;
    interruptible?: boolean;
  };
  targeting: {
    targetKind: AttackTargetKind;
    rangePx: number;
    leadTarget?: boolean;
    requiresLineOfSight?: boolean;
    preferDamagedAlly?: boolean;
  };
  telegraph: AttackTelegraphRecipe;
  activeEffect: AttackEffectRecipe;
  execution: AttackExecutionRecipe;
  reducedEffects?: Partial<AttackTelegraphRecipe & AttackEffectRecipe>;
  lab: {
    batch: EnemyAttackBatch;
    status: EnemyAttackStatus;
    notes: string;
  };
}

const ATTACK_WARNING = 0xff5964;
const ATTACK_WHITE = 0xffffff;
const ATTACK_STATUS = 0x8eeaff;
const ATTACK_SUPPORT = 0x73f2ff;
const ATTACK_AREA = 0xffc857;

export const ENEMY_ATTACK_DEFINITIONS: EnemyAttackDefinition[] = [
  {
    id: 'rail-line',
    displayName: 'Rail Line',
    baseHostIds: ['needle-sniper'],
    sourceRole: 'sniper',
    tags: ['line', 'readability-critical'],
    defaultParams: { aimMs: 900, lockMs: 320, damage: 30, rangePx: 1550 },
    timing: { initialDelayMs: 250, cooldownMs: 3100, windupMs: 1220, activeMs: 110, recoveryMs: 420 },
    targeting: { targetKind: 'player', rangePx: 1550, leadTarget: false, requiresLineOfSight: true },
    telegraph: { kind: 'line-lock', color: ATTACK_AREA, accentColor: ATTACK_WHITE, strokeWidthPx: 2, rangePx: 1550, durationMs: 1220 },
    activeEffect: { kind: 'beam', color: ATTACK_WHITE, accentColor: ATTACK_WARNING, widthPx: 7, durationMs: 110 },
    execution: { kind: 'rail-line', damage: 30 },
    reducedEffects: { strokeWidthPx: 3, widthPx: 6 },
    lab: { batch: 'A', status: 'ready', notes: 'Tracks through aim, flashes a locked line, then resolves a high-damage beam.' }
  },
  {
    id: 'mortar-lob',
    displayName: 'Mortar Lob',
    baseHostIds: ['impact-bomber'],
    sourceRole: 'exploder',
    tags: ['lob', 'area'],
    defaultParams: { windupMs: 650, travelMs: 850, splashRadiusPx: 150, damage: 22, rangePx: 900 },
    timing: { initialDelayMs: 350, cooldownMs: 3200, windupMs: 650, activeMs: 850, recoveryMs: 460 },
    targeting: { targetKind: 'point', rangePx: 900, leadTarget: true },
    telegraph: { kind: 'landing-circle', color: ATTACK_AREA, radiusPx: 150, durationMs: 650 },
    activeEffect: { kind: 'lob-projectile', color: ATTACK_AREA, accentColor: ATTACK_WHITE, radiusPx: 150, durationMs: 850 },
    execution: { kind: 'mortar-lob', damage: 22 },
    reducedEffects: { strokeWidthPx: 3 },
    lab: { batch: 'A', status: 'ready', notes: 'Predictive landing circle launches an arcing shell, then resolves delayed splash at impact.' }
  },
  {
    id: 'emp-nova',
    displayName: 'EMP Nova',
    baseHostIds: ['electric-leech', 'berserker'],
    sourceRole: 'electric',
    tags: ['area', 'status'],
    defaultParams: { windupMs: 520, radiusPx: 230, damage: 6, slowMs: 2400, drag: 0.2 },
    timing: { initialDelayMs: 400, cooldownMs: 3200, windupMs: 520, activeMs: 220, recoveryMs: 520 },
    targeting: { targetKind: 'self', rangePx: 230 },
    telegraph: { kind: 'expanding-ring', color: ATTACK_STATUS, accentColor: ATTACK_WHITE, radiusPx: 230, durationMs: 520 },
    activeEffect: { kind: 'nova-ring', color: ATTACK_STATUS, radiusPx: 230, durationMs: 220 },
    execution: { kind: 'emp-nova', damage: 6, statusKind: 'electric' },
    reducedEffects: { strokeWidthPx: 3, widthPx: 5 },
    lab: { batch: 'A', status: 'ready', notes: 'Expanding warning ring resolves into a low-damage electric drag pulse.' }
  },
  {
    id: 'summon-glyphs',
    displayName: 'Summon Glyphs',
    baseHostIds: ['combat-summoner', 'carrier', 'spawner-nest'],
    sourceRole: 'summoner',
    tags: ['summon', 'support'],
    defaultParams: { channelMs: 900, count: 3, spawnId: 'scout', glyphRadiusPx: 220 },
    timing: { initialDelayMs: 600, cooldownMs: 4200, windupMs: 180, channelMs: 900, activeMs: 180, recoveryMs: 550, interruptible: true },
    targeting: { targetKind: 'point', rangePx: 720 },
    telegraph: { kind: 'glyphs', color: ATTACK_SUPPORT, accentColor: ATTACK_WHITE, radiusPx: 220, durationMs: 900 },
    activeEffect: { kind: 'summon-glyphs', color: ATTACK_SUPPORT, radiusPx: 220, durationMs: 180 },
    execution: { kind: 'summon-glyphs', spawnId: 'scout' },
    reducedEffects: { strokeWidthPx: 3 },
    lab: { batch: 'A', status: 'ready', notes: 'Channel glyphs persist through the cast and spawn clearly owned adds.' }
  },
  {
    id: 'sweep-laser',
    displayName: 'Sweep Laser',
    baseHostIds: ['needle-sniper'],
    sourceRole: 'sniper',
    tags: ['beam', 'line', 'readability-critical'],
    defaultParams: { windupMs: 500, sweepMs: 1300, arcDegrees: 80, damagePerSecond: 28 },
    timing: { initialDelayMs: 450, cooldownMs: 3600, windupMs: 500, channelMs: 1300, recoveryMs: 650 },
    targeting: { targetKind: 'player', rangePx: 1250, leadTarget: false, requiresLineOfSight: true },
    telegraph: { kind: 'sweep-lane', color: ATTACK_AREA, accentColor: ATTACK_WHITE, rangePx: 1250, durationMs: 500 },
    activeEffect: { kind: 'sweep-beam', color: ATTACK_WHITE, accentColor: ATTACK_WARNING, widthPx: 7, durationMs: 1300 },
    execution: { kind: 'sweep-laser', damage: 28 },
    lab: { batch: 'B', status: 'planned', notes: 'Danger lane rotates slowly before the active beam sweeps.' }
  },
  {
    id: 'healing-beam',
    displayName: 'Healing Beam',
    baseHostIds: ['repair-skiff'],
    sourceRole: 'repair',
    tags: ['support'],
    defaultParams: { rangePx: 280, healPerSecond: 13, retargetMs: 250 },
    timing: { initialDelayMs: 200, cooldownMs: 500, windupMs: 120, channelMs: 900, recoveryMs: 180 },
    targeting: { targetKind: 'ally', rangePx: 280, preferDamagedAlly: true },
    telegraph: { kind: 'tether', color: 0x66bb6a, accentColor: ATTACK_WHITE, rangePx: 280, durationMs: 120 },
    activeEffect: { kind: 'support-tether', color: 0x66bb6a, accentColor: ATTACK_WHITE, durationMs: 900 },
    execution: { kind: 'healing-beam' },
    lab: { batch: 'B', status: 'planned', notes: 'Damaged ally priority must be obvious at a glance.' }
  },
  {
    id: 'shield-wall',
    displayName: 'Shield Wall',
    baseHostIds: ['shield-frigate', 'reflector'],
    sourceRole: 'shield',
    tags: ['defense', 'support'],
    defaultParams: { activeMs: 1200, cooldownMs: 2800, arcDegrees: 95, reflect: false },
    timing: { initialDelayMs: 300, cooldownMs: 2800, windupMs: 220, activeMs: 1200, recoveryMs: 450 },
    targeting: { targetKind: 'self', rangePx: 180 },
    telegraph: { kind: 'shield-arc', color: ATTACK_SUPPORT, accentColor: ATTACK_WHITE, radiusPx: 112, durationMs: 220 },
    activeEffect: { kind: 'shield-arc', color: ATTACK_SUPPORT, radiusPx: 112, durationMs: 1200 },
    execution: { kind: 'shield-wall', reflect: false },
    lab: { batch: 'B', status: 'planned', notes: 'Directional defensive arc; reflector uses the same attack with reflect enabled.' }
  },
  {
    id: 'plasma-puddle',
    displayName: 'Plasma Puddle',
    baseHostIds: ['frost-gunner'],
    sourceRole: 'freezer',
    tags: ['area', 'status'],
    defaultParams: { landingMs: 650, durationMs: 3600, radiusPx: 125, tickDamage: 4, slow: 0.25 },
    timing: { initialDelayMs: 350, cooldownMs: 3000, windupMs: 650, activeMs: 3600, recoveryMs: 350 },
    targeting: { targetKind: 'point', rangePx: 760, leadTarget: true },
    telegraph: { kind: 'landing-circle', color: ATTACK_STATUS, radiusPx: 125, durationMs: 650 },
    activeEffect: { kind: 'puddle-zone', color: ATTACK_STATUS, radiusPx: 125, durationMs: 3600 },
    execution: { kind: 'plasma-puddle', damage: 4, statusKind: 'frost' },
    lab: { batch: 'B', status: 'planned', notes: 'Landing mark resolves into a lingering slow/damage zone.' }
  },
  {
    id: 'cluster-bomb',
    displayName: 'Cluster Bomb',
    baseHostIds: ['impact-bomber'],
    sourceRole: 'exploder',
    tags: ['lob', 'area'],
    defaultParams: { travelMs: 800, splitCount: 5, secondaryRadiusPx: 70, delayMs: 420 },
    timing: { initialDelayMs: 450, cooldownMs: 3600, windupMs: 550, activeMs: 1220, recoveryMs: 520 },
    targeting: { targetKind: 'point', rangePx: 850, leadTarget: true },
    telegraph: { kind: 'landing-circle', color: ATTACK_AREA, radiusPx: 140, durationMs: 550 },
    activeEffect: { kind: 'cluster-split', color: ATTACK_AREA, radiusPx: 70, durationMs: 1220 },
    execution: { kind: 'cluster-bomb', damage: 18 },
    lab: { batch: 'C', status: 'planned', notes: 'Main lob splits into smaller delayed secondary danger circles.' }
  },
  {
    id: 'alarm-ping',
    displayName: 'Alarm Ping',
    baseHostIds: ['patrol-guard'],
    sourceRole: 'patrol',
    tags: ['alarm', 'summon'],
    defaultParams: { detectMs: 700, callDelayMs: 900, squadId: 'scout-pack' },
    timing: { initialDelayMs: 250, cooldownMs: 4800, windupMs: 700, channelMs: 900, recoveryMs: 500, interruptible: true },
    targeting: { targetKind: 'player', rangePx: 650, requiresLineOfSight: true },
    telegraph: { kind: 'detect-beam', color: ATTACK_AREA, accentColor: ATTACK_WHITE, rangePx: 650, durationMs: 700 },
    activeEffect: { kind: 'alarm-ping', color: ATTACK_AREA, radiusPx: 220, durationMs: 900 },
    execution: { kind: 'alarm-ping', spawnId: 'scout-pack' },
    lab: { batch: 'C', status: 'planned', notes: 'Detection beam marks the player, then calls a squad if uninterrupted.' }
  },
  {
    id: 'berserker-shockwave',
    displayName: 'Berserker Shockwave',
    baseHostIds: ['berserker'],
    sourceRole: 'berserker',
    tags: ['area', 'status'],
    defaultParams: { hpThresholds: '0.5/0.25', radiusPx: 180, knockback: 240, slowMs: 700 },
    timing: { initialDelayMs: 0, cooldownMs: 9999, windupMs: 260, activeMs: 180, recoveryMs: 420 },
    targeting: { targetKind: 'self', rangePx: 180 },
    telegraph: { kind: 'expanding-ring', color: ATTACK_WARNING, accentColor: ATTACK_WHITE, radiusPx: 180, durationMs: 260 },
    activeEffect: { kind: 'shockwave', color: ATTACK_WARNING, radiusPx: 180, durationMs: 180 },
    execution: { kind: 'berserker-shockwave', damage: 6, statusKind: 'slow' },
    lab: { batch: 'C', status: 'planned', notes: 'HP-gated roar pulse with visible state changes before impact.' }
  },
  {
    id: 'mine-reveal',
    displayName: 'Mine Reveal',
    baseHostIds: ['ambusher-mine'],
    sourceRole: 'ambusher',
    tags: ['contact', 'area', 'readability-critical'],
    defaultParams: { revealRangePx: 220, chargeMs: 420, blastRadiusPx: 125, damage: 26 },
    timing: { initialDelayMs: 0, cooldownMs: 2600, windupMs: 420, activeMs: 180, recoveryMs: 360 },
    targeting: { targetKind: 'player', rangePx: 220 },
    telegraph: { kind: 'hidden-reveal', color: ATTACK_AREA, accentColor: ATTACK_WHITE, radiusPx: 125, durationMs: 420 },
    activeEffect: { kind: 'blast-radius', color: ATTACK_WARNING, radiusPx: 125, durationMs: 180 },
    execution: { kind: 'mine-reveal', damage: 26 },
    lab: { batch: 'C', status: 'planned', notes: 'Hidden/reveal/strike beats must remain fair at combat scale.' }
  },
  {
    id: 'contact-ram',
    displayName: 'Contact Ram',
    baseHostIds: ['scout', 'hex-tank', 'flanker', 'orbiter', 'phase-skiff', 'shard-drone'],
    sourceRole: 'chaser',
    tags: ['contact'],
    defaultParams: { useContactDamage: true },
    timing: { initialDelayMs: 0, cooldownMs: 250, windupMs: 0, activeMs: 250, recoveryMs: 0 },
    targeting: { targetKind: 'player', rangePx: 60 },
    telegraph: { kind: 'none', color: ATTACK_WHITE },
    activeEffect: { kind: 'contact', color: ATTACK_WHITE, durationMs: 100 },
    execution: { kind: 'contact-ram' },
    lab: { batch: 'core', status: 'prototype', notes: 'Compatibility attack for baseline contact damage pressure.' }
  },
  {
    id: 'simple-bolt',
    displayName: 'Simple Bolt',
    baseHostIds: ['diamond-gunner', 'combat-summoner'],
    sourceRole: 'ranged',
    tags: ['line'],
    defaultParams: { cooldownMs: 1250, projectileSpeed: 430, damage: 10, rangePx: 1050 },
    timing: { initialDelayMs: 350, cooldownMs: 1250, windupMs: 120, activeMs: 120, recoveryMs: 260 },
    targeting: { targetKind: 'player', rangePx: 1050, leadTarget: true },
    telegraph: { kind: 'line-lock', color: ATTACK_WARNING, rangePx: 1050, durationMs: 120 },
    activeEffect: { kind: 'projectile', color: ATTACK_WARNING, radiusPx: 7, durationMs: 120 },
    execution: { kind: 'simple-bolt', damage: 10, projectileSpeedPx: 430 },
    lab: { batch: 'core', status: 'prototype', notes: 'Compatibility attack for current ranged projectile behavior.' }
  },
  {
    id: 'charge-strike',
    displayName: 'Charge Strike',
    baseHostIds: ['wedge-striker'],
    sourceRole: 'charger',
    tags: ['line', 'contact', 'readability-critical'],
    defaultParams: { windupMs: 720, dashMs: 560, dashSpeed: 520, damage: 18 },
    timing: { initialDelayMs: 450, cooldownMs: 2400, windupMs: 720, activeMs: 560, recoveryMs: 850 },
    targeting: { targetKind: 'player', rangePx: 760, leadTarget: false },
    telegraph: { kind: 'line-lock', color: ATTACK_AREA, rangePx: 760, durationMs: 720 },
    activeEffect: { kind: 'contact', color: ATTACK_WARNING, durationMs: 560 },
    execution: { kind: 'charge-strike', damage: 18 },
    lab: { batch: 'core', status: 'prototype', notes: 'Compatibility attack for wedge dash impact, separate from movement later.' }
  },
  {
    id: 'self-destruct-radius',
    displayName: 'Self-Destruct Radius',
    baseHostIds: ['reactor-drone', 'impact-bomber'],
    sourceRole: 'exploder',
    tags: ['area', 'readability-critical'],
    defaultParams: { triggerRangePx: 120, blastRadiusPx: 170, countdownMs: 1500, damage: 35 },
    timing: { initialDelayMs: 0, cooldownMs: 9999, windupMs: 1500, activeMs: 160, recoveryMs: 0 },
    targeting: { targetKind: 'self', rangePx: 170 },
    telegraph: { kind: 'expanding-ring', color: ATTACK_WARNING, radiusPx: 170, durationMs: 1500 },
    activeEffect: { kind: 'blast-radius', color: ATTACK_WARNING, radiusPx: 170, durationMs: 160 },
    execution: { kind: 'self-destruct-radius', damage: 35 },
    lab: { batch: 'core', status: 'prototype', notes: 'Compatibility attack for proximity and impact bomber explosions.' }
  },
  {
    id: 'split-shards',
    displayName: 'Split Shards',
    baseHostIds: ['splitter'],
    sourceRole: 'splitter',
    tags: ['summon'],
    defaultParams: { childId: 'shard-drone', childCount: 3 },
    timing: { initialDelayMs: 0, cooldownMs: 9999, windupMs: 0, activeMs: 220, recoveryMs: 0 },
    targeting: { targetKind: 'self', rangePx: 140 },
    telegraph: { kind: 'none', color: ATTACK_WHITE },
    activeEffect: { kind: 'shards', color: 0xdcc7ff, radiusPx: 140, durationMs: 220 },
    execution: { kind: 'split-shards', spawnId: 'shard-drone' },
    lab: { batch: 'core', status: 'prototype', notes: 'Compatibility attack for child spawn on death or threshold.' }
  },
  {
    id: 'command-buff-pulse',
    displayName: 'Command Buff Pulse',
    baseHostIds: ['command-relay'],
    sourceRole: 'buffer',
    tags: ['support'],
    defaultParams: { auraRadiusPx: 270, speedBonus: 1.22, fireRateBonus: 0.78 },
    timing: { initialDelayMs: 250, cooldownMs: 900, windupMs: 120, activeMs: 900, recoveryMs: 120 },
    targeting: { targetKind: 'ally', rangePx: 270 },
    telegraph: { kind: 'tether', color: ATTACK_AREA, radiusPx: 270, durationMs: 120 },
    activeEffect: { kind: 'buff-pulse', color: ATTACK_AREA, radiusPx: 270, durationMs: 900 },
    execution: { kind: 'command-buff-pulse' },
    lab: { batch: 'core', status: 'prototype', notes: 'Compatibility attack for command speed/fire-rate buff aura.' }
  },
  {
    id: 'scrap-steal',
    displayName: 'Scrap Steal',
    baseHostIds: ['scrap-jackal', 'scrap-thief'],
    sourceRole: 'scavenger',
    tags: ['support'],
    defaultParams: { pickupRangePx: 46, bonusScrap: 0 },
    timing: { initialDelayMs: 0, cooldownMs: 300, windupMs: 0, activeMs: 300, recoveryMs: 0 },
    targeting: { targetKind: 'point', rangePx: 480 },
    telegraph: { kind: 'none', color: ATTACK_AREA },
    activeEffect: { kind: 'scrap-link', color: ATTACK_AREA, durationMs: 180 },
    execution: { kind: 'scrap-steal' },
    lab: { batch: 'core', status: 'prototype', notes: 'Compatibility attack for scrap pickup theft behavior.' }
  },
  {
    id: 'phase-blink-strike',
    displayName: 'Phase Blink Strike',
    baseHostIds: ['phase-skiff'],
    sourceRole: 'teleporter',
    tags: ['contact'],
    defaultParams: { blinkMs: 320, strikeRangePx: 180, damage: 14 },
    timing: { initialDelayMs: 700, cooldownMs: 3200, windupMs: 320, activeMs: 220, recoveryMs: 520 },
    targeting: { targetKind: 'player', rangePx: 520 },
    telegraph: { kind: 'hidden-reveal', color: 0x8f7cff, accentColor: ATTACK_WHITE, radiusPx: 90, durationMs: 320 },
    activeEffect: { kind: 'blink-strike', color: 0x8f7cff, radiusPx: 90, durationMs: 220 },
    execution: { kind: 'phase-blink-strike', damage: 14 },
    lab: { batch: 'core', status: 'planned', notes: 'Optional future phase attack if teleport becomes movement-only.' }
  }
];

const DEFAULT_ENEMY_ATTACK_LOADOUTS: Record<string, AttackLoadoutSlot[]> = {
  scout: [{ attackId: 'contact-ram', enabled: true }],
  'wedge-striker': [{ attackId: 'charge-strike', enabled: true }],
  'diamond-gunner': [{ attackId: 'simple-bolt', enabled: true }],
  'hex-tank': [{ attackId: 'contact-ram', enabled: true }],
  'reactor-drone': [{ attackId: 'self-destruct-radius', enabled: true }],
  splitter: [{ attackId: 'split-shards', enabled: true }],
  'shard-drone': [{ attackId: 'contact-ram', enabled: true }],
  'needle-sniper': [{ attackId: 'rail-line', enabled: true }],
  carrier: [{ attackId: 'summon-glyphs', enabled: true, params: { spawnId: 'scout', count: 3 } }],
  'shield-frigate': [{ attackId: 'shield-wall', enabled: true }],
  'repair-skiff': [{ attackId: 'healing-beam', enabled: true }],
  'command-relay': [{ attackId: 'command-buff-pulse', enabled: true }],
  'scrap-jackal': [{ attackId: 'scrap-steal', enabled: true }],
  flanker: [{ attackId: 'contact-ram', enabled: true }],
  reflector: [{ attackId: 'shield-wall', enabled: true, params: { reflect: true }, label: 'Reflect Wall' }],
  'phase-skiff': [{ attackId: 'contact-ram', enabled: true }],
  'ambusher-mine': [{ attackId: 'mine-reveal', enabled: true }],
  berserker: [{ attackId: 'berserker-shockwave', enabled: true }],
  orbiter: [{ attackId: 'contact-ram', enabled: true }],
  'patrol-guard': [{ attackId: 'alarm-ping', enabled: true }],
  'frost-gunner': [{ attackId: 'plasma-puddle', enabled: true, params: { statusKind: 'frost', slow: 0.25 } }],
  'electric-leech': [{ attackId: 'emp-nova', enabled: true }],
  'combat-summoner': [
    { attackId: 'simple-bolt', enabled: true },
    { attackId: 'summon-glyphs', enabled: true, params: { spawnId: 'scout', count: 3 }, cooldownOffsetMs: 700 }
  ],
  'scrap-thief': [{ attackId: 'scrap-steal', enabled: true, params: { bonusScrap: 3 } }],
  'impact-bomber': [{ attackId: 'self-destruct-radius', enabled: true, params: { triggerRangePx: 62, blastRadiusPx: 125, countdownMs: 0, damage: 26 } }],
  'spawner-nest': [{ attackId: 'summon-glyphs', enabled: true, params: { spawnId: 'shard-drone', count: 3, glyphRadiusPx: 180 } }]
};

export function getEnemyAttackDefinition(id: EnemyAttackId): EnemyAttackDefinition {
  const definition = ENEMY_ATTACK_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new Error(`Unknown enemy attack definition: ${id}`);
  }

  return definition;
}

export function getEnemyAttackDefinitions(): EnemyAttackDefinition[] {
  return ENEMY_ATTACK_DEFINITIONS;
}

export function isEnemyAttackId(value: string): value is EnemyAttackId {
  return ENEMY_ATTACK_DEFINITIONS.some((definition) => definition.id === value);
}

export function cloneAttackLoadoutSlots(loadout: AttackLoadoutSlot[]): AttackLoadoutSlot[] {
  return loadout.map((slot) => ({
    ...slot,
    params: slot.params ? { ...slot.params } : undefined
  }));
}

export function createDefaultAttackLoadoutSlot(attackId: EnemyAttackId): AttackLoadoutSlot {
  const definition = getEnemyAttackDefinition(attackId);

  return {
    attackId,
    enabled: true,
    label: definition.displayName,
    cooldownOffsetMs: 0,
    weight: 1,
    params: { ...definition.defaultParams }
  };
}

export function normalizeAttackLoadoutSlots(loadout: unknown): AttackLoadoutSlot[] {
  if (!Array.isArray(loadout)) {
    return [];
  }

  const normalized: AttackLoadoutSlot[] = [];

  for (const rawSlot of loadout) {
    if (!rawSlot || typeof rawSlot !== 'object' || Array.isArray(rawSlot)) {
      continue;
    }

    const slot = rawSlot as Record<string, unknown>;
    const attackId = typeof slot.attackId === 'string' && isEnemyAttackId(slot.attackId)
      ? slot.attackId
      : undefined;
    if (!attackId) {
      continue;
    }

    const definition = getEnemyAttackDefinition(attackId);
    const cooldownOffsetMs = typeof slot.cooldownOffsetMs === 'number' && Number.isFinite(slot.cooldownOffsetMs)
      ? slot.cooldownOffsetMs
      : undefined;
    const weight = typeof slot.weight === 'number' && Number.isFinite(slot.weight)
      ? Math.max(0, slot.weight)
      : undefined;
    const label = typeof slot.label === 'string' && slot.label.trim().length > 0
      ? slot.label.trim()
      : undefined;
    const params = slot.params && typeof slot.params === 'object' && !Array.isArray(slot.params)
      ? sanitizeAttackParams(slot.params as Record<string, unknown>, definition.defaultParams)
      : {};

    normalized.push({
      attackId,
      enabled: slot.enabled !== false,
      ...(label ? { label } : {}),
      ...(cooldownOffsetMs !== undefined ? { cooldownOffsetMs } : {}),
      ...(weight !== undefined ? { weight } : {}),
      params: {
        ...definition.defaultParams,
        ...params
      }
    });
  }

  return normalized;
}

export function validateAttackLoadoutSlots(loadout: unknown, label = 'Attack loadout'): string[] {
  const errors: string[] = [];

  if (!Array.isArray(loadout)) {
    return [`${label} must be an array.`];
  }

  loadout.forEach((slot, index) => {
    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
      errors.push(`${label} slot ${index + 1} must be an object.`);
      return;
    }

    const attackId = (slot as Record<string, unknown>).attackId;
    if (typeof attackId !== 'string' || !isEnemyAttackId(attackId)) {
      errors.push(`${label} slot ${index + 1} references unknown attack ${String(attackId)}.`);
    }
  });

  return errors;
}

export function getDefaultEnemyAttackLoadout(definitionId: string): AttackLoadoutSlot[] {
  const loadout = DEFAULT_ENEMY_ATTACK_LOADOUTS[definitionId] ?? [];
  return cloneAttackLoadoutSlots(loadout);
}

export function resolveAttackLoadoutSlotParams(slot: AttackLoadoutSlot): Record<string, EnemyAttackParamValue> {
  return {
    ...getEnemyAttackDefinition(slot.attackId).defaultParams,
    ...(slot.params ?? {})
  };
}

export function validateEnemyAttackRegistry(enemyDefinitionIds: string[]): string[] {
  const errors: string[] = [];
  const attackIds = new Set(ENEMY_ATTACK_DEFINITIONS.map((definition) => definition.id));

  if (attackIds.size !== ENEMY_ATTACK_DEFINITIONS.length) {
    errors.push('Enemy attack ids must be unique.');
  }

  for (const enemyDefinitionId of enemyDefinitionIds) {
    const loadout = DEFAULT_ENEMY_ATTACK_LOADOUTS[enemyDefinitionId];
    if (!loadout || loadout.length === 0) {
      errors.push(`Missing default attack loadout for ${enemyDefinitionId}.`);
      continue;
    }

    for (const slot of loadout) {
      if (!attackIds.has(slot.attackId)) {
        errors.push(`Default loadout for ${enemyDefinitionId} references unknown attack ${slot.attackId}.`);
      }
    }
  }

  for (const definitionId of Object.keys(DEFAULT_ENEMY_ATTACK_LOADOUTS)) {
    if (!enemyDefinitionIds.includes(definitionId)) {
      errors.push(`Default attack loadout references unknown enemy ${definitionId}.`);
    }
  }

  return errors;
}

function sanitizeAttackParams(
  params: Record<string, unknown>,
  defaults: Record<string, EnemyAttackParamValue>
): Record<string, EnemyAttackParamValue> {
  const sanitized: Record<string, EnemyAttackParamValue> = {};

  for (const [key, value] of Object.entries(params)) {
    const defaultValue = defaults[key];
    if (defaultValue !== undefined && typeof value !== typeof defaultValue) {
      continue;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
