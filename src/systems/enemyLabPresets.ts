import {
  resolveEnemyVisualScale,
  type EnemyLabDefinition,
  type EnemyLabSquadDefinition
} from '../data/enemyLabDefinitions';
import { normalizeAttackLoadoutSlots, type AttackLoadoutSlot } from '../data/enemyAttackDefinitions';
import { createObjectSizeProfileFromCollisionRadius, resolveObjectSizeProfile } from '../data/objectSizeProfile';
import {
  FORGE_STYLE_GUIDE_VERSION,
  createForgeAiBrief,
  getNeonForwardSalvagepunkStyleGuide,
  parseForgeAssetImport,
  type ForgeAsset
} from './assetForge';

export type EnemyLabAssetStatus =
  | 'Generated'
  | 'Idea'
  | 'Visual Pass'
  | 'Behavior Pass'
  | 'Needs Tuning'
  | 'Playable Candidate'
  | 'Approved Visual'
  | 'Approved Gameplay'
  | 'Promoted'
  | 'Candidate'
  | 'Approved'
  | 'Rejected'
  | 'Implemented';

export interface EnemyLabVisualOverrides {
  visualScale?: number;
  scaleX?: number;
  scaleY?: number;
  rotationOffsetDegrees?: number;
  glowScale?: number;
}

export interface EnemyLabStatOverrides {
  hp?: number;
  speed?: number;
  contactDamage?: number;
  radius?: number;
}

export interface EnemyLabVariantPreset {
  type: 'starvivors-enemy-lab-variant';
  version: 2;
  id: string;
  baseDefinitionId: string;
  displayName: string;
  status: EnemyLabAssetStatus;
  tags: string[];
  notes: string;
  savedAt: string;
  visualOverrides: EnemyLabVisualOverrides;
  statOverrides: EnemyLabStatOverrides;
  behaviorParamOverrides: Record<string, number | string | boolean>;
  attackLoadoutOverride?: AttackLoadoutSlot[];
}

export interface EnemyLabSquadPresetEntry {
  definitionId: string;
  variantId?: string;
  x: number;
  y: number;
  spawnDelayMs?: number;
  notes?: string;
  attackLoadoutOverride?: AttackLoadoutSlot[];
}

export interface EnemyLabSquadPreset {
  type: 'starvivors-enemy-lab-squad';
  version: 2;
  id: string;
  displayName: string;
  status: EnemyLabAssetStatus;
  tags: string[];
  notes: string;
  savedAt: string;
  entries: EnemyLabSquadPresetEntry[];
}

export interface EnemyLabStorageState {
  variants: EnemyLabVariantPreset[];
  squads: EnemyLabSquadPreset[];
  forgeAssets: ForgeAsset[];
}

export interface EnemyLabContextSnapshot {
  selectedEnemyName: string;
  selectedVariantName?: string;
  selectedSquadName?: string;
  enemyCount: number;
  projectileCount: number;
  speedMultiplier: number;
  hpMultiplier: number;
  fireRateMultiplier: number;
  deconfliction: string;
  notes: string;
}

export const ENEMY_LAB_STORAGE_KEY = 'starvivors.enemyLab.v1';

export const ENEMY_LAB_ASSET_STATUSES: EnemyLabAssetStatus[] = [
  'Generated',
  'Idea',
  'Visual Pass',
  'Behavior Pass',
  'Needs Tuning',
  'Playable Candidate',
  'Approved Visual',
  'Approved Gameplay',
  'Promoted',
  'Candidate',
  'Approved',
  'Rejected',
  'Implemented'
];

export const ENEMY_LAB_QUICK_TAGS = [
  'Too fast',
  'Too slow',
  'Hard to read',
  'Telegraph unclear',
  'Projectile unclear',
  'Too weak',
  'Too strong',
  'Feels good',
  'Needs visual pass',
  'Needs behavior pass',
  'Candidate'
];

export function createInitialEnemyLabStorageState(): EnemyLabStorageState {
  return { variants: [], squads: [], forgeAssets: [] };
}

export function loadEnemyLabStorageState(): EnemyLabStorageState {
  if (typeof window === 'undefined') {
    return createInitialEnemyLabStorageState();
  }

  try {
    const raw = window.localStorage.getItem(ENEMY_LAB_STORAGE_KEY);
    if (!raw) {
      return createInitialEnemyLabStorageState();
    }

    const parsed = JSON.parse(raw) as Partial<EnemyLabStorageState>;
    return {
      variants: Array.isArray(parsed.variants)
        ? parsed.variants
            .map(normalizeEnemyLabVariantPreset)
            .filter((variant): variant is EnemyLabVariantPreset => Boolean(variant))
        : [],
      squads: Array.isArray(parsed.squads)
        ? parsed.squads
            .map(normalizeEnemyLabSquadPreset)
            .filter((squad): squad is EnemyLabSquadPreset => Boolean(squad))
        : [],
      forgeAssets: Array.isArray(parsed.forgeAssets)
        ? parsed.forgeAssets
            .map((candidate) => parseForgeAssetImport(JSON.stringify(candidate)))
            .filter((candidate): candidate is ForgeAsset => Boolean(candidate))
        : []
    };
  } catch {
    return createInitialEnemyLabStorageState();
  }
}

export function saveEnemyLabStorageState(state: EnemyLabStorageState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ENEMY_LAB_STORAGE_KEY, JSON.stringify(state));
}

export function createVariantFromDefinition(definition: EnemyLabDefinition): EnemyLabVariantPreset {
  const { scaleX, scaleY } = resolveEnemyVisualScale(definition.visual);

  return {
    type: 'starvivors-enemy-lab-variant',
    version: 2,
    id: `${slugify(definition.displayName)}-${Date.now()}`,
    baseDefinitionId: definition.id,
    displayName: `${definition.displayName} Variant`,
    status: 'Idea',
    tags: [],
    notes: '',
    savedAt: new Date().toISOString(),
    visualOverrides: {
      visualScale: 1,
      scaleX,
      scaleY,
      rotationOffsetDegrees: 0,
      glowScale: 1
    },
    statOverrides: {
      hp: definition.stats.hp,
      speed: definition.stats.speed,
      contactDamage: definition.stats.contactDamage,
      radius: definition.stats.radius
    },
    behaviorParamOverrides: { ...(definition.behavior.params ?? {}) }
  };
}

export function duplicateVariant(variant: EnemyLabVariantPreset): EnemyLabVariantPreset {
  return {
    ...cloneJson(variant),
    id: `${slugify(variant.displayName)}-${Date.now()}`,
    displayName: `${variant.displayName} Copy`,
    savedAt: new Date().toISOString()
  };
}

export function applyVariantToDefinition(
  definition: EnemyLabDefinition,
  variant?: EnemyLabVariantPreset
): EnemyLabDefinition {
  if (!variant) {
    return definition;
  }

  const defaultVisualScale = resolveEnemyVisualScale(definition.visual);
  const visualScale = sanitizePositiveNumber(variant.visualOverrides.visualScale, 1);
  const scaleX = sanitizePositiveNumber(variant.visualOverrides.scaleX, defaultVisualScale.scaleX);
  const scaleY = sanitizePositiveNumber(variant.visualOverrides.scaleY, defaultVisualScale.scaleY);
  const glowScale = sanitizePositiveNumber(variant.visualOverrides.glowScale, 1);
  const rotationOffsetDegrees = sanitizeNumber(variant.visualOverrides.rotationOffsetDegrees, 0);
  const requestedRadius = sanitizePositiveNumber(variant.statOverrides.radius, definition.stats.radius);
  const radius =
    Math.abs(requestedRadius - definition.stats.radius) <= 0.001
      ? definition.stats.radius * visualScale
      : requestedRadius;
  const sizeProfile = definition.sizeProfile
    ? createObjectSizeProfileFromCollisionRadius({
        kind: 'enemy',
        id: definition.sizeProfile.id,
        collisionRadiusPx: radius,
        strokeWidthPx: definition.sizeProfile.strokeWidthPx
      })
    : undefined;
  const visualDiameter = sizeProfile ? resolveObjectSizeProfile(sizeProfile).visualDiameterPx : Math.max(12, definition.visual.size * visualScale);

  return {
    ...definition,
    displayName: variant.displayName.trim() || definition.displayName,
    sizeProfile,
    visual: {
      ...definition.visual,
      size: visualDiameter,
      scaleX,
      scaleY,
      glowScale,
      rotationOffset: PhaserMathDegToRad(rotationOffsetDegrees)
    },
    stats: {
      ...definition.stats,
      hp: sanitizePositiveNumber(variant.statOverrides.hp, definition.stats.hp),
      speed: sanitizePositiveNumber(variant.statOverrides.speed, definition.stats.speed),
      contactDamage: sanitizePositiveNumber(variant.statOverrides.contactDamage, definition.stats.contactDamage),
      radius
    },
    behavior: {
      ...definition.behavior,
      params: {
        ...(definition.behavior.params ?? {}),
        ...variant.behaviorParamOverrides
      }
    }
  };
}

export function convertBuiltInSquadToPreset(squad: EnemyLabSquadDefinition): EnemyLabSquadPreset {
  const entries: EnemyLabSquadPresetEntry[] = [];
  const totalCount = squad.entries.reduce((sum, entry) => sum + entry.count, 0);
  let index = 0;

  for (const entry of squad.entries) {
    for (let i = 0; i < entry.count; i += 1) {
      const angle = (Math.PI * 2 * index) / Math.max(1, totalCount);
      const ring = squad.radius * (0.38 + 0.62 * ((index % 3) / 2));
      entries.push({
        definitionId: entry.definitionId,
        x: Math.round(Math.cos(angle) * ring),
        y: Math.round(Math.sin(angle) * ring)
      });
      index += 1;
    }
  }

  return {
    type: 'starvivors-enemy-lab-squad',
    version: 2,
    id: `${slugify(squad.displayName)}-${Date.now()}`,
    displayName: `${squad.displayName} Custom`,
    status: 'Idea',
    tags: [],
    notes: '',
    savedAt: new Date().toISOString(),
    entries
  };
}

export function createEmptySquadPreset(): EnemyLabSquadPreset {
  return {
    type: 'starvivors-enemy-lab-squad',
    version: 2,
    id: `custom-squad-${Date.now()}`,
    displayName: 'Custom Squad',
    status: 'Idea',
    tags: [],
    notes: '',
    savedAt: new Date().toISOString(),
    entries: []
  };
}

export function createEnemyVariantMarkdown(variant: EnemyLabVariantPreset): string {
  return createMarkdownWithJson(`Enemy Lab Variant Preset: ${variant.displayName}`, [
    ['Status', variant.status],
    ['Base Enemy', variant.baseDefinitionId],
    ['Tags', variant.tags.join(', ') || 'None'],
    ['Dev Notes', variant.notes || 'None']
  ], variant);
}

export function createEnemySquadMarkdown(squad: EnemyLabSquadPreset): string {
  return createMarkdownWithJson(`Enemy Lab Squad Preset: ${squad.displayName}`, [
    ['Status', squad.status],
    ['Entries', String(squad.entries.length)],
    ['Tags', squad.tags.join(', ') || 'None'],
    ['Dev Notes', squad.notes || 'None']
  ], squad);
}

export function createEnemyLabAiBriefMarkdown(input: {
  targetLabel: string;
  targetData: EnemyLabVariantPreset | EnemyLabSquadPreset;
  context: EnemyLabContextSnapshot;
  requestedWork?: string;
}): string {
  const requestedWork = input.requestedWork?.trim() || 'Use the dev feedback to revise this lab-only enemy or squad. Do not touch live game files.';
  const forgeBrief = createForgeAiBrief({
    targetLabel: input.targetLabel,
    targetKind: 'enemy',
    context: [
      `Selected enemy: ${input.context.selectedEnemyName}`,
      `Selected variant: ${input.context.selectedVariantName ?? 'None'}`,
      `Selected squad: ${input.context.selectedSquadName ?? 'None'}`,
      `Enemies active: ${input.context.enemyCount}`,
      `Projectiles active: ${input.context.projectileCount}`,
      `Speed multiplier: ${input.context.speedMultiplier}`,
      `HP multiplier: ${input.context.hpMultiplier}`,
      `Fire-rate multiplier: ${input.context.fireRateMultiplier}`,
      `Deconfliction: ${input.context.deconfliction}`,
      '',
      input.context.notes || 'No notes entered.'
    ].join('\n'),
    requestedWork
  });

  return [
    forgeBrief,
    '## Enemy Lab Context',
    '',
    '## Current Lab Context',
    `- Selected enemy: ${input.context.selectedEnemyName}`,
    `- Selected variant: ${input.context.selectedVariantName ?? 'None'}`,
    `- Selected squad: ${input.context.selectedSquadName ?? 'None'}`,
    `- Enemies active: ${input.context.enemyCount}`,
    `- Projectiles active: ${input.context.projectileCount}`,
    `- Speed multiplier: ${input.context.speedMultiplier}`,
    `- HP multiplier: ${input.context.hpMultiplier}`,
    `- Fire-rate multiplier: ${input.context.fireRateMultiplier}`,
    `- Deconfliction: ${input.context.deconfliction}`,
    '',
    '## Dev Feedback',
    input.context.notes || 'No notes entered.',
    '',
    '## Lab Data',
    '```json',
    JSON.stringify(input.targetData, null, 2),
    '```',
    ''
  ].join('\n');
}

export function createEnemyLabPromotionMarkdown(input: {
  variant: EnemyLabVariantPreset;
  context: EnemyLabContextSnapshot;
}): string {
  const styleGuide = getNeonForwardSalvagepunkStyleGuide();
  return [
    `# Enemy Promotion Report: ${input.variant.displayName}`,
    '',
    `- Status: ${input.variant.status}`,
    `- Base enemy: ${input.variant.baseDefinitionId}`,
    `- Style guide: ${styleGuide.displayName} (${FORGE_STYLE_GUIDE_VERSION})`,
    `- Tags: ${input.variant.tags.join(', ') || 'None'}`,
    '',
    '## Locked Art Theme',
    styleGuide.summary,
    '',
    '## Required Neon-Forward Salvagepunk Checks',
    ...styleGuide.rules.map((rule) => `- ${rule}`),
    '',
    '## Dev Notes',
    input.variant.notes || 'No notes entered.',
    '',
    '## Recommended Production Readiness Checks',
    '- Silhouette is readable at combat zoom.',
    '- Telegraphs and projectiles remain visible over the starfield.',
    '- Hit radius feels fair relative to visual size.',
    '- Enemy works alone and inside a mixed squad.',
    '- Enemy does not create excessive projectiles, children, or visual noise.',
    '',
    '## Current Lab Context',
    `- Enemies active: ${input.context.enemyCount}`,
    `- Projectiles active: ${input.context.projectileCount}`,
    `- Lab multipliers: speed ${input.context.speedMultiplier}, HP ${input.context.hpMultiplier}, fire rate ${input.context.fireRateMultiplier}`,
    '',
    '## Variant Data',
    '```json',
    JSON.stringify(input.variant, null, 2),
    '```',
    ''
  ].join('\n');
}

export function parseEnemyLabPresetMarkdown(markdown: string): EnemyLabVariantPreset | EnemyLabSquadPreset | undefined {
  const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);
  const raw = jsonBlockMatch ? jsonBlockMatch[1] : markdown;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeEnemyLabVariantPreset(parsed) ?? normalizeEnemyLabSquadPreset(parsed);
  } catch {
    return undefined;
  }
}

export function parseEnemyVariantPresetMarkdown(markdown: string): EnemyLabVariantPreset | undefined {
  const preset = parseEnemyLabPresetMarkdown(markdown);

  return preset?.type === 'starvivors-enemy-lab-variant' ? preset : undefined;
}

export function parseEnemySquadPresetMarkdown(markdown: string): EnemyLabSquadPreset | undefined {
  const preset = parseEnemyLabPresetMarkdown(markdown);

  return preset?.type === 'starvivors-enemy-lab-squad' ? preset : undefined;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'enemy-lab';
}

function createMarkdownWithJson(title: string, rows: Array<[string, string]>, data: object): string {
  return [
    `# ${title}`,
    '',
    ...rows.flatMap(([label, value]) => [`## ${label}`, value, '']),
    '## Data',
    '```json',
    JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2),
    '```',
    ''
  ].join('\n');
}

function normalizeEnemyLabVariantPreset(value: unknown): EnemyLabVariantPreset | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  if (
    candidate.type !== 'starvivors-enemy-lab-variant' ||
    !isSupportedPresetVersion(candidate.version) ||
    typeof candidate.id !== 'string' ||
    typeof candidate.baseDefinitionId !== 'string' ||
    typeof candidate.displayName !== 'string'
  ) {
    return undefined;
  }

  const attackLoadoutOverride = normalizeOptionalAttackLoadout(candidate.attackLoadoutOverride);

  return {
    type: 'starvivors-enemy-lab-variant',
    version: 2,
    id: candidate.id,
    baseDefinitionId: candidate.baseDefinitionId,
    displayName: candidate.displayName,
    status: normalizeAssetStatus(candidate.status),
    tags: normalizeStringList(candidate.tags),
    notes: typeof candidate.notes === 'string' ? candidate.notes : '',
    savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date().toISOString(),
    visualOverrides: normalizeVisualOverrides(candidate.visualOverrides),
    statOverrides: normalizeStatOverrides(candidate.statOverrides),
    behaviorParamOverrides: normalizePrimitiveRecord(candidate.behaviorParamOverrides),
    ...(attackLoadoutOverride ? { attackLoadoutOverride } : {})
  };
}

function normalizeEnemyLabSquadPreset(value: unknown): EnemyLabSquadPreset | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  if (
    candidate.type !== 'starvivors-enemy-lab-squad' ||
    !isSupportedPresetVersion(candidate.version) ||
    typeof candidate.id !== 'string' ||
    typeof candidate.displayName !== 'string' ||
    !Array.isArray(candidate.entries)
  ) {
    return undefined;
  }

  return {
    type: 'starvivors-enemy-lab-squad',
    version: 2,
    id: candidate.id,
    displayName: candidate.displayName,
    status: normalizeAssetStatus(candidate.status),
    tags: normalizeStringList(candidate.tags),
    notes: typeof candidate.notes === 'string' ? candidate.notes : '',
    savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date().toISOString(),
    entries: candidate.entries
      .map(normalizeEnemyLabSquadPresetEntry)
      .filter((entry): entry is EnemyLabSquadPresetEntry => Boolean(entry))
  };
}

function normalizeEnemyLabSquadPresetEntry(value: unknown): EnemyLabSquadPresetEntry | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.definitionId !== 'string') {
    return undefined;
  }

  const spawnDelayMs = sanitizeOptionalNonNegativeNumber(candidate.spawnDelayMs);
  const attackLoadoutOverride = normalizeOptionalAttackLoadout(candidate.attackLoadoutOverride);

  return {
    definitionId: candidate.definitionId,
    ...(typeof candidate.variantId === 'string' && candidate.variantId.trim() ? { variantId: candidate.variantId } : {}),
    x: sanitizeNumber(candidate.x, 0),
    y: sanitizeNumber(candidate.y, 0),
    ...(spawnDelayMs !== undefined ? { spawnDelayMs } : {}),
    ...(typeof candidate.notes === 'string' ? { notes: candidate.notes } : {}),
    ...(attackLoadoutOverride ? { attackLoadoutOverride } : {})
  };
}

function isSupportedPresetVersion(value: unknown): boolean {
  return value === 1 || value === 2;
}

function normalizeAssetStatus(value: unknown): EnemyLabAssetStatus {
  return typeof value === 'string' && ENEMY_LAB_ASSET_STATUSES.includes(value as EnemyLabAssetStatus)
    ? value as EnemyLabAssetStatus
    : 'Idea';
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function normalizeVisualOverrides(value: unknown): EnemyLabVisualOverrides {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    visualScale: sanitizePositiveNumber(raw.visualScale, 1),
    scaleX: sanitizePositiveNumber(raw.scaleX, 1),
    scaleY: sanitizePositiveNumber(raw.scaleY, 1),
    rotationOffsetDegrees: sanitizeNumber(raw.rotationOffsetDegrees, 0),
    glowScale: sanitizeNonNegativeNumber(raw.glowScale, 1)
  };
}

function normalizeStatOverrides(value: unknown): EnemyLabStatOverrides {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    hp: sanitizePositiveNumber(raw.hp, 1),
    speed: sanitizePositiveNumber(raw.speed, 1),
    contactDamage: sanitizeNonNegativeNumber(raw.contactDamage, 0),
    radius: sanitizePositiveNumber(raw.radius, 1)
  };
}

function normalizePrimitiveRecord(value: unknown): Record<string, number | string | boolean> {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const normalized: Record<string, number | string | boolean> = {};

  for (const [key, entry] of Object.entries(raw)) {
    if (
      typeof entry === 'string' ||
      typeof entry === 'boolean' ||
      (typeof entry === 'number' && Number.isFinite(entry))
    ) {
      normalized[key] = entry;
    }
  }

  return normalized;
}

function normalizeOptionalAttackLoadout(value: unknown): AttackLoadoutSlot[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return normalizeAttackLoadoutSlots(value);
}

function sanitizePositiveNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function sanitizeNonNegativeNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback;
}

function sanitizeOptionalNonNegativeNumber(value: unknown): number | undefined {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined;
}

function sanitizeNumber(value: unknown, fallback: number): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function PhaserMathDegToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
