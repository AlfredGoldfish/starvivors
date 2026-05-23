import { INITIAL_PERMANENT_UPGRADE_LEVELS, type PermanentUpgradeId } from '../data/permanentUpgrades';
import { DEFAULT_SHIP_ID, type ShipId } from '../data/ships';
import { getWeaponDefinition, isWeaponId, type WeaponId, type WeaponSlotType } from '../data/weapons';

export type RewardHookId =
  | 'mission.survey-signal'
  | 'mission.salvage-cache'
  | 'mission.enemy-probe'
  | 'mission.mothership-contract'
  | 'mission.rift-cache-contract'
  | 'world-event.mothership-prototype'
  | 'sector-scanner.black-hole-cache'
  | 'sector-scanner.hunter-swarm';

export type SectorScannerLevel = 0 | 1 | 2 | 3;
export type RadarLevel = 0 | 1 | 2 | 3 | 4;
export type WeaponLoadoutState = Record<WeaponSlotType, Array<WeaponId | null>>;
export type WeaponMkLevels = Partial<Record<WeaponId, number>>;

export const WEAPON_LOADOUT_SLOT_COUNT = 3;
const DEFAULT_UNLOCKED_WEAPON_IDS: WeaponId[] = ['pulse-cannon'];

export interface ProgressionState {
  schemaVersion: 1;
  totalCredits: number;
  selectedShipId: ShipId;
  selectedSkinIds: Partial<Record<ShipId, string>>;
  unlockedShipIds: ShipId[];
  permanentUpgradeLevels: Record<PermanentUpgradeId, number>;
  activePermanentUpgradeLevels: Record<PermanentUpgradeId, number>;
  unlockedRewardHooks: RewardHookId[];
  radarLevel: RadarLevel;
  sectorScannerLevel: SectorScannerLevel;
  unlockedWeaponIds: WeaponId[];
  weaponLoadout: WeaponLoadoutState;
  weaponMkLevels: WeaponMkLevels;
  secretControlUnlocked: boolean;
}

const STORAGE_KEY = 'starvivors.progression.v1';

export const SECTOR_SCANNER_COSTS: Record<Exclude<SectorScannerLevel, 0>, number> = {
  1: 75,
  2: 125,
  3: 175
};

export const RADAR_UPGRADE_COSTS: Record<Exclude<RadarLevel, 0>, number> = {
  1: 50,
  2: 100,
  3: 150,
  4: 225
};

export function createDefaultProgressionState(): ProgressionState {
  return {
    schemaVersion: 1,
    totalCredits: 0,
    selectedShipId: DEFAULT_SHIP_ID,
    selectedSkinIds: {},
    unlockedShipIds: [DEFAULT_SHIP_ID],
    permanentUpgradeLevels: { ...INITIAL_PERMANENT_UPGRADE_LEVELS },
    activePermanentUpgradeLevels: { ...INITIAL_PERMANENT_UPGRADE_LEVELS },
    unlockedRewardHooks: [],
    radarLevel: 0,
    sectorScannerLevel: 0,
    unlockedWeaponIds: [...DEFAULT_UNLOCKED_WEAPON_IDS],
    weaponLoadout: createDefaultWeaponLoadout(),
    weaponMkLevels: {
      'pulse-cannon': 1,
      'ramming-shield': 1,
      'salvage-beam': 1
    },
    secretControlUnlocked: false
  };
}

export function createDefaultWeaponLoadout(): WeaponLoadoutState {
  return {
    primary: ['pulse-cannon', null, null],
    secondary: [null, null, null],
    auto: [null, null, null]
  };
}

export function loadProgressionState(): ProgressionState {
  if (typeof window === 'undefined') {
    return createDefaultProgressionState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultProgressionState();
    }

    return normalizeProgressionState(JSON.parse(raw));
  } catch {
    return createDefaultProgressionState();
  }
}

export function saveProgressionState(state: ProgressionState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgressionState(state)));
}

export function resetProgressionState(): ProgressionState {
  const state = createDefaultProgressionState();
  saveProgressionState(state);
  return state;
}

export function normalizeProgressionState(value: unknown): ProgressionState {
  const base = createDefaultProgressionState();
  const record = isRecord(value) ? value : {};
  const permanentUpgradeLevels = normalizeUpgradeLevels(record.permanentUpgradeLevels);
  const activePermanentUpgradeLevels = normalizeUpgradeLevels(record.activePermanentUpgradeLevels);

  return {
    schemaVersion: 1,
    totalCredits: Math.max(0, Math.floor(Number(record.totalCredits ?? base.totalCredits))),
    selectedShipId: typeof record.selectedShipId === 'string' ? (record.selectedShipId as ShipId) : base.selectedShipId,
    selectedSkinIds: normalizeSelectedSkinIds(record.selectedSkinIds),
    unlockedShipIds: normalizeUniqueArray(record.unlockedShipIds, base.unlockedShipIds) as ShipId[],
    permanentUpgradeLevels,
    activePermanentUpgradeLevels: clampActiveUpgradeLevels(activePermanentUpgradeLevels, permanentUpgradeLevels),
    unlockedRewardHooks: normalizeUniqueArray(record.unlockedRewardHooks, []) as RewardHookId[],
    radarLevel: normalizeRadarLevel(record.radarLevel),
    sectorScannerLevel: normalizeScannerLevel(record.sectorScannerLevel),
    unlockedWeaponIds: normalizeUnlockedWeaponIds(record.unlockedWeaponIds, base.unlockedWeaponIds),
    weaponLoadout: normalizeWeaponLoadout(record.weaponLoadout),
    weaponMkLevels: normalizeWeaponMkLevels(record.weaponMkLevels),
    secretControlUnlocked: record.secretControlUnlocked === true
  };
}

export function getNextRadarLevel(state: ProgressionState): Exclude<RadarLevel, 0> | null {
  if (state.radarLevel >= 4) {
    return null;
  }

  return (state.radarLevel + 1) as Exclude<RadarLevel, 0>;
}

export function getRadarUpgradeCost(state: ProgressionState): number | null {
  const nextLevel = getNextRadarLevel(state);
  return nextLevel ? RADAR_UPGRADE_COSTS[nextLevel] : null;
}

export function isSectorScannerAvailable(state: ProgressionState): boolean {
  return (
    state.sectorScannerLevel > 0 ||
    state.unlockedRewardHooks.some((hook) => hook === 'sector-scanner.black-hole-cache' || hook === 'sector-scanner.hunter-swarm')
  );
}

export function getNextSectorScannerLevel(state: ProgressionState): Exclude<SectorScannerLevel, 0> | null {
  if (!isSectorScannerAvailable(state) || state.sectorScannerLevel >= 3) {
    return null;
  }

  return (state.sectorScannerLevel + 1) as Exclude<SectorScannerLevel, 0>;
}

export function getSectorScannerCost(state: ProgressionState): number | null {
  const nextLevel = getNextSectorScannerLevel(state);
  return nextLevel ? SECTOR_SCANNER_COSTS[nextLevel] : null;
}

function normalizeUpgradeLevels(value: unknown): Record<PermanentUpgradeId, number> {
  const source = isRecord(value) ? value : {};
  const levels = { ...INITIAL_PERMANENT_UPGRADE_LEVELS };

  for (const id of Object.keys(levels) as PermanentUpgradeId[]) {
    levels[id] = Math.max(0, Math.floor(Number(source[id] ?? levels[id])));
  }

  return levels;
}

function clampActiveUpgradeLevels(
  activeLevels: Record<PermanentUpgradeId, number>,
  purchasedLevels: Record<PermanentUpgradeId, number>
): Record<PermanentUpgradeId, number> {
  const clamped = { ...activeLevels };

  for (const id of Object.keys(clamped) as PermanentUpgradeId[]) {
    clamped[id] = Math.max(0, Math.min(clamped[id], purchasedLevels[id]));
  }

  return clamped;
}

function normalizeUniqueArray(value: unknown, fallback: string[]): string[] {
  const source = Array.isArray(value) ? value : fallback;
  return [...new Set(source.filter((item): item is string => typeof item === 'string'))];
}

function normalizeSelectedSkinIds(value: unknown): Partial<Record<ShipId, string>> {
  const source = isRecord(value) ? value : {};
  const skins: Partial<Record<ShipId, string>> = {};

  for (const [shipId, skinId] of Object.entries(source)) {
    if (typeof skinId === 'string') {
      skins[shipId as ShipId] = skinId;
    }
  }

  return skins;
}

function normalizeWeaponLoadout(value: unknown): WeaponLoadoutState {
  const defaults = createDefaultWeaponLoadout();
  const source = isRecord(value) ? value : {};
  const usedWeaponIds = new Set<WeaponId>();

  return {
    primary: normalizeWeaponLoadoutSlots(source.primary, defaults.primary, 'primary', usedWeaponIds),
    secondary: normalizeWeaponLoadoutSlots(source.secondary, defaults.secondary, 'secondary', usedWeaponIds),
    auto: normalizeWeaponLoadoutSlots(source.auto, defaults.auto, 'auto', usedWeaponIds)
  };
}

function normalizeWeaponLoadoutSlots(
  value: unknown,
  fallback: Array<WeaponId | null>,
  slot: WeaponSlotType,
  usedWeaponIds: Set<WeaponId>
): Array<WeaponId | null> {
  const source = Array.isArray(value) ? value : fallback;
  const slots: Array<WeaponId | null> = [];

  for (let index = 0; index < WEAPON_LOADOUT_SLOT_COUNT; index += 1) {
    const weaponId = source[index];
    if (typeof weaponId !== 'string') {
      slots.push(null);
      continue;
    }

    if (!isWeaponId(weaponId)) {
      slots.push(null);
      continue;
    }

    const typedWeaponId = weaponId;
    if (usedWeaponIds.has(typedWeaponId) || !getWeaponDefinition(typedWeaponId).slotCompatibility.includes(slot)) {
      slots.push(null);
      continue;
    }

    usedWeaponIds.add(typedWeaponId);
    slots.push(typedWeaponId);
  }

  return slots;
}

function normalizeWeaponMkLevels(value: unknown): WeaponMkLevels {
  const source = isRecord(value) ? value : {};
  const levels: WeaponMkLevels = {
    'pulse-cannon': 1,
    'ramming-shield': 1,
    'salvage-beam': 1
  };

  for (const [weaponId, level] of Object.entries(source)) {
    if (isWeaponId(weaponId)) {
      levels[weaponId] = Math.max(1, Math.floor(Number(level ?? 1)));
    }
  }

  return levels;
}

function normalizeUnlockedWeaponIds(value: unknown, fallback: WeaponId[]): WeaponId[] {
  const source = Array.isArray(value) ? [...fallback, ...value] : fallback;
  return normalizeUniqueArray(source, fallback).filter(isWeaponId);
}

function normalizeScannerLevel(value: unknown): SectorScannerLevel {
  const level = Math.max(0, Math.min(3, Math.floor(Number(value ?? 0))));
  return level as SectorScannerLevel;
}

function normalizeRadarLevel(value: unknown): RadarLevel {
  const level = Math.max(0, Math.min(4, Math.floor(Number(value ?? 0))));
  return level as RadarLevel;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
