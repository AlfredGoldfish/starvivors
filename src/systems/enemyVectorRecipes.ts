import type {
  EnemyEffectRecipe,
  EnemyEffectRecipeEntry,
  EnemyDefinition,
  EnemyVisualStyle,
  VectorShapeRecipe
} from '../data/enemyDefinitions';
import {
  OBJECT_SOURCE_DIAMETER_PX,
  SHIP_ENEMY_COLLISION_RADIUS_RATIO,
  createObjectSizeProfileFromVisualDiameter,
  resolveObjectSizeProfile,
  type ResolvedObjectSizeProfile
} from '../data/objectSizeProfile';

export const MONOCHROME_OUTLINE_ACTIVE_IDS = [
  'scout',
  'carrier',
  'scrap-jackal',
  'electric-leech'
] as const;

export const PROTOTYPE_COLOR_ACTIVE_IDS = [
  'wedge-striker',
  'diamond-gunner',
  'hex-tank',
  'reactor-drone',
  'splitter',
  'shard-drone',
  'needle-sniper',
  'shield-frigate',
  'repair-skiff',
  'command-relay',
  'flanker',
  'reflector',
  'phase-skiff',
  'ambusher-mine',
  'berserker',
  'orbiter',
  'patrol-guard',
  'frost-gunner',
  'poison-leech',
  'combat-summoner',
  'scrap-thief',
  'spawner-nest',
  'impact-bomber'
] as const;

export const VECTOR_OUTLINE_MIGRATION_IDS = [
  'scout',
  'diamond-gunner',
  'hex-tank',
  'wedge-striker',
  'needle-sniper',
  'reactor-drone'
] as const;

export type MonochromeOutlineActiveId = (typeof MONOCHROME_OUTLINE_ACTIVE_IDS)[number];
export type PrototypeColorActiveId = (typeof PROTOTYPE_COLOR_ACTIVE_IDS)[number];
export type VectorOutlineMigrationId = (typeof VECTOR_OUTLINE_MIGRATION_IDS)[number];

export interface NormalizedEnemyEffectRecipeEntry {
  kind: EnemyEffectRecipeEntry['kind'];
  color: number;
  durationMs: number;
  radius: number;
  length: number;
  intensity: number;
}

export interface VectorEnemyValidationResult {
  valid: boolean;
  issues: string[];
}

const REQUIRED_EFFECT_SLOTS: Array<keyof EnemyEffectRecipe> = ['spawn', 'move', 'telegraph', 'fire', 'hit', 'death'];
const DEFAULT_EFFECT_ENTRY: NormalizedEnemyEffectRecipeEntry = {
  kind: 'spark-burst',
  color: 0xffffff,
  durationMs: 260,
  radius: 48,
  length: 96,
  intensity: 0.75
};

export function isVectorOutlineMigrationId(id: string): id is VectorOutlineMigrationId {
  return VECTOR_OUTLINE_MIGRATION_IDS.includes(id as VectorOutlineMigrationId);
}

export function getEnemyVisualStyle(definition: EnemyDefinition): EnemyVisualStyle {
  return definition.visualStyle ?? 'forge-texture';
}

export function isMonochromeOutlineActiveId(id: string): id is MonochromeOutlineActiveId {
  return MONOCHROME_OUTLINE_ACTIVE_IDS.includes(id as MonochromeOutlineActiveId);
}

export function isPrototypeColorActiveId(id: string): id is PrototypeColorActiveId {
  return PROTOTYPE_COLOR_ACTIVE_IDS.includes(id as PrototypeColorActiveId);
}

export function resolveEnemyDefinitionSize(definition: EnemyDefinition): ResolvedObjectSizeProfile {
  return resolveObjectSizeProfile(
    definition.sizeProfile ??
      createObjectSizeProfileFromVisualDiameter({
        kind: 'enemy',
        id: definition.id,
        visualDiameterPx: definition.visual.size,
        collisionRadiusRatio: SHIP_ENEMY_COLLISION_RADIUS_RATIO
      })
  );
}

export function validateVectorEnemyDefinition(definition: EnemyDefinition): VectorEnemyValidationResult {
  const issues: string[] = [];

  if (getEnemyVisualStyle(definition) !== 'vector-outline') {
    issues.push('visualStyle must be vector-outline');
  }

  validateShapeRecipe(definition.shapeRecipe, issues);
  validateEffectRecipe(definition.effectRecipe, issues);

  return {
    valid: issues.length === 0,
    issues
  };
}

export function validateMonochromeEnemyDefinition(definition: EnemyDefinition): VectorEnemyValidationResult {
  const issues: string[] = [];

  if (getEnemyVisualStyle(definition) !== 'monochrome-outline') {
    issues.push('visualStyle must be monochrome-outline');
  }

  validateShapeRecipe(definition.shapeRecipe, issues);
  validateMonochromeShapeRecipe(definition.shapeRecipe, issues);
  validateEnemySizeProfile(definition, issues);

  return {
    valid: issues.length === 0,
    issues
  };
}

export function normalizeEnemyEffectEntry(
  entry: EnemyEffectRecipeEntry | undefined,
  reducedEffects = false
): NormalizedEnemyEffectRecipeEntry {
  const durationMax = reducedEffects ? 620 : 2000;
  const radiusMax = reducedEffects ? 520 : 1600;
  const lengthMax = reducedEffects ? 900 : 2400;
  const intensityMax = reducedEffects ? 0.55 : 1.5;

  return {
    kind: entry?.kind ?? DEFAULT_EFFECT_ENTRY.kind,
    color: normalizeColor(entry?.color, DEFAULT_EFFECT_ENTRY.color),
    durationMs: clampFinite(entry?.durationMs, DEFAULT_EFFECT_ENTRY.durationMs, 40, durationMax),
    radius: clampFinite(entry?.radius, DEFAULT_EFFECT_ENTRY.radius, 4, radiusMax),
    length: clampFinite(entry?.length, DEFAULT_EFFECT_ENTRY.length, 8, lengthMax),
    intensity: clampFinite(entry?.intensity, DEFAULT_EFFECT_ENTRY.intensity, 0.05, intensityMax)
  };
}

export function normalizeEnemyEffectRecipe(
  recipe: Partial<EnemyEffectRecipe> | undefined,
  reducedEffects = false
): Record<keyof EnemyEffectRecipe, NormalizedEnemyEffectRecipeEntry> {
  return {
    spawn: normalizeEnemyEffectEntry(recipe?.spawn, reducedEffects),
    move: normalizeEnemyEffectEntry(recipe?.move, reducedEffects),
    telegraph: normalizeEnemyEffectEntry(recipe?.telegraph, reducedEffects),
    fire: normalizeEnemyEffectEntry(recipe?.fire, reducedEffects),
    hit: normalizeEnemyEffectEntry(recipe?.hit, reducedEffects),
    death: normalizeEnemyEffectEntry(recipe?.death, reducedEffects),
    status: normalizeEnemyEffectEntry(recipe?.status, reducedEffects)
  };
}

export function normalizeVectorShapeRecipe(recipe: VectorShapeRecipe | undefined): VectorShapeRecipe | undefined {
  if (!recipe) {
    return undefined;
  }

  return {
    ...recipe,
    strokeWidth: clampFinite(recipe.strokeWidth, 2, 0.75, 8),
    outlineColor: normalizeColor(recipe.outlineColor, 0xdce8f5),
    accentColor: normalizeColor(recipe.accentColor, 0xff5964),
    fillColor: normalizeColor(recipe.fillColor, 0x000000),
    fillAlpha: clampFinite(recipe.fillAlpha, 0.02, 0, 1),
    attachments: Array.isArray(recipe.attachments) ? recipe.attachments : [],
    symbol: typeof recipe.symbol === 'string' ? recipe.symbol : undefined,
    symbolColor: normalizeColor(recipe.symbolColor, recipe.accentColor),
    label: typeof recipe.label === 'string' ? recipe.label : undefined,
    labelColor: normalizeColor(recipe.labelColor, recipe.accentColor)
  };
}

function validateShapeRecipe(recipe: VectorShapeRecipe | undefined, issues: string[]): void {
  if (!recipe) {
    issues.push('shapeRecipe is required');
    return;
  }

  if (!recipe.basePolygon) {
    issues.push('shapeRecipe.basePolygon is required');
  }

  if (!Number.isFinite(recipe.strokeWidth) || recipe.strokeWidth <= 0) {
    issues.push('shapeRecipe.strokeWidth must be positive');
  }

  if (!isValidColor(recipe.outlineColor)) {
    issues.push('shapeRecipe.outlineColor must be a 24-bit color');
  }

  if (!isValidColor(recipe.accentColor)) {
    issues.push('shapeRecipe.accentColor must be a 24-bit color');
  }

  if (recipe.fillColor !== undefined && !isValidColor(recipe.fillColor)) {
    issues.push('shapeRecipe.fillColor must be a 24-bit color');
  }

  if (recipe.symbolColor !== undefined && !isValidColor(recipe.symbolColor)) {
    issues.push('shapeRecipe.symbolColor must be a 24-bit color');
  }

  if (recipe.labelColor !== undefined && !isValidColor(recipe.labelColor)) {
    issues.push('shapeRecipe.labelColor must be a 24-bit color');
  }
}

function validateMonochromeShapeRecipe(recipe: VectorShapeRecipe | undefined, issues: string[]): void {
  if (!recipe) {
    return;
  }

  if (recipe.outlineColor !== 0xffffff) {
    issues.push('shapeRecipe.outlineColor must be white for monochrome-outline');
  }

  if (recipe.accentColor !== 0xffffff) {
    issues.push('shapeRecipe.accentColor must be white for monochrome-outline');
  }

  if ((recipe.fillColor ?? 0x000000) !== 0x000000) {
    issues.push('shapeRecipe.fillColor must be black for monochrome-outline');
  }

  if (recipe.fillAlpha !== undefined && recipe.fillAlpha < 1) {
    issues.push('shapeRecipe.fillAlpha must fully enclose the silhouette');
  }

  if ((recipe.attachments?.length ?? 0) > 2) {
    issues.push('shapeRecipe.attachments must stay at or below two detail marks');
  }
}

function validateEnemySizeProfile(definition: EnemyDefinition, issues: string[]): void {
  if (!definition.sizeProfile) {
    issues.push('sizeProfile is required');
    return;
  }

  const resolved = resolveEnemyDefinitionSize(definition);
  if (resolved.sourceDiameterPx !== OBJECT_SOURCE_DIAMETER_PX) {
    issues.push('sizeProfile.sourceDiameterPx must be 320');
  }

  if (resolved.collisionRadiusRatio !== SHIP_ENEMY_COLLISION_RADIUS_RATIO) {
    issues.push('sizeProfile.collisionRadiusRatio must use the ship/enemy default ratio');
  }

  if (Math.abs(resolved.collisionRadiusPx - definition.stats.radius) > 0.001) {
    issues.push('stats.radius must match the resolved size profile collision radius');
  }
}

function validateEffectRecipe(recipe: EnemyEffectRecipe | undefined, issues: string[]): void {
  if (!recipe) {
    issues.push('effectRecipe is required');
    return;
  }

  for (const slot of REQUIRED_EFFECT_SLOTS) {
    const entry = recipe[slot];
    if (!entry) {
      issues.push(`effectRecipe.${slot} is required`);
      continue;
    }

    if (!entry.kind) {
      issues.push(`effectRecipe.${slot}.kind is required`);
    }

    if (entry.color !== undefined && !isValidColor(entry.color)) {
      issues.push(`effectRecipe.${slot}.color must be a 24-bit color`);
    }
  }
}

function normalizeColor(value: unknown, fallback: number): number {
  return isValidColor(value) ? Math.trunc(value) : fallback;
}

function isValidColor(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 0xffffff;
}

function clampFinite(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numberValue));
}
