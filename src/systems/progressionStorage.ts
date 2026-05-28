import { INITIAL_PERMANENT_UPGRADE_LEVELS, type PermanentUpgradeId } from '../data/permanentUpgrades';
import { DEFAULT_SHIP_ID, isShipId, shipRegistry, type ShipId } from '../data/ships';
import {
  RUN_BOOST_IDS,
  RUN_PREP_UPGRADE_IDS,
  SHIP_SHOP_UPGRADE_IDS,
  WEAPON_SHOP_UPGRADE_IDS,
  type PendingRunBoosts,
  type RunPrepUpgradeLevels,
  type ShipShopUpgradeLevels,
  type WeaponShopUpgradeLevels
} from '../data/shopUpgrades';
import { getWeaponDefinition, isWeaponId, type WeaponId, type WeaponSlotType } from '../data/weapons';

export const REWARD_HOOK_IDS = [
  'mission.survey-signal',
  'mission.salvage-cache',
  'mission.enemy-probe',
  'mission.mothership-contract',
  'mission.rift-cache-contract',
  'world-event.mothership-prototype',
  'sector-scanner.black-hole-cache',
  'sector-scanner.hunter-swarm'
] as const;

export type RewardHookId = (typeof REWARD_HOOK_IDS)[number];

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
  shipUpgradeLevels: ShipShopUpgradeLevels;
  weaponUpgradeLevels: WeaponShopUpgradeLevels;
  runPrepUpgradeLevels: RunPrepUpgradeLevels;
  pendingRunBoosts: PendingRunBoosts;
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
    shipUpgradeLevels: createDefaultShipUpgradeLevels(),
    weaponUpgradeLevels: createDefaultWeaponUpgradeLevels(),
    runPrepUpgradeLevels: createDefaultRunPrepUpgradeLevels(),
    pendingRunBoosts: createDefaultPendingRunBoosts(),
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

export function isRewardHookId(value: unknown): value is RewardHookId {
  return typeof value === 'string' && (REWARD_HOOK_IDS as readonly string[]).includes(value);
}

export function normalizeProgressionState(value: unknown): ProgressionState {
  const base = createDefaultProgressionState();
  const record = isRecord(value) ? value : {};
  const permanentUpgradeLevels = normalizeUpgradeLevels(record.permanentUpgradeLevels);
  const activePermanentUpgradeLevels = normalizeUpgradeLevels(record.activePermanentUpgradeLevels);
  const weaponUpgradeLevels = normalizeWeaponShopUpgradeLevels(record.weaponUpgradeLevels, record.weaponMkLevels);
  const unlockedShipIds = normalizeUnlockedShipIds(record.unlockedShipIds, base.unlockedShipIds);
  const selectedShipId = normalizeSelectedShipId(record.selectedShipId, unlockedShipIds, base.selectedShipId);

  return {
    schemaVersion: 1,
    totalCredits: normalizeNonNegativeInteger(record.totalCredits, base.totalCredits),
    selectedShipId,
    selectedSkinIds: normalizeSelectedSkinIds(record.selectedSkinIds),
    unlockedShipIds,
    permanentUpgradeLevels,
    activePermanentUpgradeLevels: clampActiveUpgradeLevels(activePermanentUpgradeLevels, permanentUpgradeLevels),
    unlockedRewardHooks: normalizeRewardHookIds(record.unlockedRewardHooks),
    radarLevel: normalizeRadarLevel(record.radarLevel),
    sectorScannerLevel: normalizeScannerLevel(record.sectorScannerLevel),
    unlockedWeaponIds: normalizeUnlockedWeaponIds(record.unlockedWeaponIds, base.unlockedWeaponIds),
    weaponLoadout: normalizeWeaponLoadout(record.weaponLoadout),
    weaponMkLevels: normalizeWeaponMkLevels(record.weaponMkLevels, weaponUpgradeLevels),
    shipUpgradeLevels: normalizeShipShopUpgradeLevels(record.shipUpgradeLevels),
    weaponUpgradeLevels,
    runPrepUpgradeLevels: normalizeRunPrepUpgradeLevels(record.runPrepUpgradeLevels),
    pendingRunBoosts: normalizePendingRunBoosts(record.pendingRunBoosts),
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
    levels[id] = normalizeNonNegativeInteger(source[id], levels[id]);
  }

  return levels;
}

function createDefaultShipUpgradeLevels(): ShipShopUpgradeLevels {
  const levels: ShipShopUpgradeLevels = {};

  for (const ship of shipRegistry) {
    levels[ship.id] = {};
    for (const upgradeId of SHIP_SHOP_UPGRADE_IDS) {
      levels[ship.id]![upgradeId] = 0;
    }
  }

  return levels;
}

function createDefaultWeaponUpgradeLevels(): WeaponShopUpgradeLevels {
  const levels: WeaponShopUpgradeLevels = {};

  for (const weaponId of ['pulse-cannon', 'ramming-shield', 'salvage-beam'] as WeaponId[]) {
    levels[weaponId] = {};
    for (const upgradeId of WEAPON_SHOP_UPGRADE_IDS) {
      levels[weaponId]![upgradeId] = 0;
    }
  }

  return levels;
}

function createDefaultRunPrepUpgradeLevels(): RunPrepUpgradeLevels {
  const levels: RunPrepUpgradeLevels = {};

  for (const upgradeId of RUN_PREP_UPGRADE_IDS) {
    levels[upgradeId] = 0;
  }

  return levels;
}

function createDefaultPendingRunBoosts(): PendingRunBoosts {
  const boosts: PendingRunBoosts = {};

  for (const boostId of RUN_BOOST_IDS) {
    boosts[boostId] = 0;
  }

  return boosts;
}

function normalizeShipShopUpgradeLevels(value: unknown): ShipShopUpgradeLevels {
  const source = isRecord(value) ? value : {};
  const levels = createDefaultShipUpgradeLevels();

  for (const ship of shipRegistry) {
    const rawShipSource = source[ship.id];
    const shipSource = isRecord(rawShipSource) ? rawShipSource : {};
    for (const upgradeId of SHIP_SHOP_UPGRADE_IDS) {
      levels[ship.id]![upgradeId] = clampShopLevel(shipSource[upgradeId], 3);
    }
  }

  return levels;
}

function normalizeWeaponShopUpgradeLevels(value: unknown, legacyMkLevels: unknown): WeaponShopUpgradeLevels {
  const source = isRecord(value) ? value : {};
  const legacyMk = isRecord(legacyMkLevels) ? legacyMkLevels : {};
  const levels = createDefaultWeaponUpgradeLevels();

  for (const weaponId of Object.keys(levels) as WeaponId[]) {
    const weaponSource = isRecord(source[weaponId]) ? source[weaponId] : {};
    for (const upgradeId of WEAPON_SHOP_UPGRADE_IDS) {
      const legacyLevel = upgradeId === 'weapon-mk' ? Math.max(0, normalizeNonNegativeInteger(legacyMk[weaponId], 1) - 1) : 0;
      levels[weaponId]![upgradeId] = clampShopLevel(weaponSource[upgradeId] ?? legacyLevel, 3);
    }
  }

  return levels;
}

function normalizeRunPrepUpgradeLevels(value: unknown): RunPrepUpgradeLevels {
  const source = isRecord(value) ? value : {};
  const levels = createDefaultRunPrepUpgradeLevels();

  for (const upgradeId of RUN_PREP_UPGRADE_IDS) {
    levels[upgradeId] = clampShopLevel(source[upgradeId], 3);
  }

  return levels;
}

function normalizePendingRunBoosts(value: unknown): PendingRunBoosts {
  const source = isRecord(value) ? value : {};
  const boosts = createDefaultPendingRunBoosts();

  for (const boostId of RUN_BOOST_IDS) {
    boosts[boostId] = clampShopLevel(source[boostId], 1);
  }

  return boosts;
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

function normalizeUnlockedShipIds(value: unknown, fallback: ShipId[]): ShipId[] {
  const source = Array.isArray(value) ? [...fallback, ...value] : fallback;
  const shipIds = normalizeUniqueArray(source, fallback).filter(isShipId);
  return shipIds.includes(DEFAULT_SHIP_ID) ? shipIds : [DEFAULT_SHIP_ID, ...shipIds];
}

function normalizeSelectedShipId(value: unknown, unlockedShipIds: ShipId[], fallback: ShipId): ShipId {
  if (isShipId(value) && unlockedShipIds.includes(value)) {
    return value;
  }

  return unlockedShipIds.includes(fallback) ? fallback : DEFAULT_SHIP_ID;
}

function normalizeRewardHookIds(value: unknown): RewardHookId[] {
  return normalizeUniqueArray(value, []).filter(isRewardHookId);
}

function normalizeSelectedSkinIds(value: unknown): Partial<Record<ShipId, string>> {
  const source = isRecord(value) ? value : {};
  const skins: Partial<Record<ShipId, string>> = {};

  for (const [shipId, skinId] of Object.entries(source)) {
    if (isShipId(shipId) && isShipSkinId(shipId, skinId)) {
      skins[shipId] = skinId;
    }
  }

  return skins;
}

function isShipSkinId(shipId: ShipId, value: unknown): value is string {
  return typeof value === 'string' && Boolean(shipRegistry.find((ship) => ship.id === shipId)?.skins?.some((skin) => skin.id === value));
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

function normalizeWeaponMkLevels(value: unknown, weaponUpgradeLevels: WeaponShopUpgradeLevels): WeaponMkLevels {
  const source = isRecord(value) ? value : {};
  const levels: WeaponMkLevels = {
    'pulse-cannon': 1,
    'ramming-shield': 1,
    'salvage-beam': 1
  };

  for (const [weaponId, level] of Object.entries(source)) {
    if (isWeaponId(weaponId)) {
      levels[weaponId] = Math.max(1, normalizeNonNegativeInteger(level, 1));
    }
  }

  for (const [weaponId, upgrades] of Object.entries(weaponUpgradeLevels)) {
    if (isWeaponId(weaponId)) {
      levels[weaponId] = Math.max(levels[weaponId] ?? 1, 1 + (upgrades?.['weapon-mk'] ?? 0));
    }
  }

  return levels;
}

function clampShopLevel(value: unknown, maxLevel: number): number {
  return Math.min(maxLevel, normalizeNonNegativeInteger(value, 0));
}

function normalizeUnlockedWeaponIds(value: unknown, fallback: WeaponId[]): WeaponId[] {
  const source = Array.isArray(value) ? [...fallback, ...value] : fallback;
  return normalizeUniqueArray(source, fallback).filter(isWeaponId);
}

function normalizeScannerLevel(value: unknown): SectorScannerLevel {
  const level = Math.min(3, normalizeNonNegativeInteger(value, 0));
  return level as SectorScannerLevel;
}

function normalizeRadarLevel(value: unknown): RadarLevel {
  const level = Math.min(4, normalizeNonNegativeInteger(value, 0));
  return level as RadarLevel;
}

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? Math.max(0, Math.floor(numberValue)) : Math.max(0, Math.floor(fallback));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
