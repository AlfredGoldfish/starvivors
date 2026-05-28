import { DEFAULT_SHIP_ID, type ShipId } from '../data/ships';
import {
  cloneAttackLoadoutSlots,
  normalizeAttackLoadoutSlots,
  type AttackHostKind,
  type AttackLoadoutSlot
} from '../data/enemyAttackDefinitions';
import type { EnemyLabReadabilityMode } from './enemyLabEffects';

export interface EnemyLabAttackLoadoutPreset {
  type: 'starvivors-enemy-lab-attack-loadout';
  version: 1;
  id: string;
  displayName: string;
  savedAt: string;
  hostKind: AttackHostKind;
  hostDefinitionId: string;
  slots: AttackLoadoutSlot[];
  notes?: string;
}

export interface EnemyLabAttackTestPreset {
  type: 'starvivors-enemy-lab-attack-test';
  version: 1;
  id: string;
  displayName: string;
  savedAt: string;
  hostKind: 'player-test';
  hostShipId: ShipId;
  targetSetup: 'dummy';
  readabilityMode: EnemyLabReadabilityMode;
  reducedEffects: boolean;
  slots: AttackLoadoutSlot[];
  notes?: string;
}

export function createEnemyLabAttackLoadoutPreset(input: {
  id: string;
  displayName: string;
  hostKind: AttackHostKind;
  hostDefinitionId: string;
  slots: AttackLoadoutSlot[];
  notes?: string;
}): EnemyLabAttackLoadoutPreset {
  return {
    type: 'starvivors-enemy-lab-attack-loadout',
    version: 1,
    id: input.id,
    displayName: input.displayName,
    savedAt: new Date().toISOString(),
    hostKind: input.hostKind,
    hostDefinitionId: input.hostDefinitionId,
    slots: normalizeAttackLoadoutSlots(input.slots),
    ...(input.notes ? { notes: input.notes } : {})
  };
}

export function createEnemyLabAttackTestPreset(input: {
  id: string;
  displayName: string;
  hostShipId?: ShipId;
  targetSetup?: 'dummy';
  readabilityMode: EnemyLabReadabilityMode;
  reducedEffects: boolean;
  slots: AttackLoadoutSlot[];
  notes?: string;
}): EnemyLabAttackTestPreset {
  return {
    type: 'starvivors-enemy-lab-attack-test',
    version: 1,
    id: input.id,
    displayName: input.displayName,
    savedAt: new Date().toISOString(),
    hostKind: 'player-test',
    hostShipId: input.hostShipId ?? DEFAULT_SHIP_ID,
    targetSetup: input.targetSetup ?? 'dummy',
    readabilityMode: input.readabilityMode,
    reducedEffects: input.reducedEffects,
    slots: normalizeAttackLoadoutSlots(input.slots),
    ...(input.notes ? { notes: input.notes } : {})
  };
}

export function createEnemyLabAttackLoadoutMarkdown(preset: EnemyLabAttackLoadoutPreset): string {
  return createMarkdownWithJson(`Enemy Lab Attack Loadout: ${preset.displayName}`, [
    ['Host', `${preset.hostKind}:${preset.hostDefinitionId}`],
    ['Slots', String(preset.slots.length)],
    ['Dev Notes', preset.notes ?? 'None']
  ], preset);
}

export function createEnemyLabAttackTestMarkdown(preset: EnemyLabAttackTestPreset): string {
  return createMarkdownWithJson(`Enemy Lab Attack Test: ${preset.displayName}`, [
    ['Host', `${preset.hostKind}:${preset.hostShipId}`],
    ['Target Setup', preset.targetSetup],
    ['Readability', `${preset.readabilityMode}${preset.reducedEffects ? ' reduced-fx' : ''}`],
    ['Slots', String(preset.slots.length)],
    ['Dev Notes', preset.notes ?? 'None']
  ], preset);
}

export function parseEnemyLabAttackLoadoutMarkdown(markdown: string): EnemyLabAttackLoadoutPreset | undefined {
  const raw = parseJsonPayload(markdown);
  if (!raw || raw.type !== 'starvivors-enemy-lab-attack-loadout' || raw.version !== 1) {
    return undefined;
  }

  const hostKind = normalizeHostKind(raw.hostKind);
  const id = normalizeString(raw.id);
  const displayName = normalizeString(raw.displayName);
  const hostDefinitionId = normalizeString(raw.hostDefinitionId);
  if (!hostKind || !id || !displayName || !hostDefinitionId) {
    return undefined;
  }

  return {
    type: 'starvivors-enemy-lab-attack-loadout',
    version: 1,
    id,
    displayName,
    savedAt: normalizeString(raw.savedAt) || new Date().toISOString(),
    hostKind,
    hostDefinitionId,
    slots: normalizeAttackLoadoutSlots(raw.slots),
    ...(typeof raw.notes === 'string' ? { notes: raw.notes } : {})
  };
}

export function parseEnemyLabAttackTestMarkdown(markdown: string): EnemyLabAttackTestPreset | undefined {
  const raw = parseJsonPayload(markdown);
  if (!raw || raw.type !== 'starvivors-enemy-lab-attack-test' || raw.version !== 1) {
    return undefined;
  }

  const id = normalizeString(raw.id);
  const displayName = normalizeString(raw.displayName);
  if (!id || !displayName) {
    return undefined;
  }

  return {
    type: 'starvivors-enemy-lab-attack-test',
    version: 1,
    id,
    displayName,
    savedAt: normalizeString(raw.savedAt) || new Date().toISOString(),
    hostKind: 'player-test',
    hostShipId: normalizeShipId(raw.hostShipId),
    targetSetup: 'dummy',
    readabilityMode: normalizeReadabilityMode(raw.readabilityMode),
    reducedEffects: raw.reducedEffects === true,
    slots: normalizeAttackLoadoutSlots(raw.slots),
    ...(typeof raw.notes === 'string' ? { notes: raw.notes } : {})
  };
}

export function clonePresetSlots(slots: AttackLoadoutSlot[]): AttackLoadoutSlot[] {
  return cloneAttackLoadoutSlots(normalizeAttackLoadoutSlots(slots));
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

function parseJsonPayload(markdown: string): Record<string, unknown> | undefined {
  const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);
  const raw = jsonBlockMatch ? jsonBlockMatch[1] : markdown;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeHostKind(value: unknown): AttackHostKind | undefined {
  return value === 'enemy' || value === 'player-test' || value === 'mothership' ? value : undefined;
}

function normalizeReadabilityMode(value: unknown): EnemyLabReadabilityMode {
  return value === 'color-safe' || value === 'high-contrast' ? value : 'normal';
}

function normalizeShipId(value: unknown): ShipId {
  return value === 'bulwark' || value === 'engineer' || value === 'interceptor' ? value : DEFAULT_SHIP_ID;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
