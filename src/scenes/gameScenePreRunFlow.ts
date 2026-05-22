import { getWeaponDefinition, type WeaponId, type WeaponSlotType } from '../data/weapons';
import { shipRegistry, type ShipId, type ShipRegistryEntry } from '../data/ships';
import type { WeaponLoadoutState } from '../systems/progressionStorage';
import type { PreRunNavConfig } from '../ui/preRunHubScreen';

export type GameScenePreRunNavConfig = Omit<PreRunNavConfig, 'scene' | 'container' | 'actionZones' | 'activeTab'>;

export interface CreatePreRunNavConfigInput {
  canPlay: boolean;
  playDisabledReason: string;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onPlay: () => void;
  onShowCommand: () => void;
  onShowHangar: () => void;
  onShowShop: () => void;
  onShowSettings: () => void;
}

export interface RunConfigurationInput {
  selectedShip: ShipRegistryEntry;
  unlockedShipIds: ReadonlySet<ShipId>;
  weaponLoadout: WeaponLoadoutState;
}

export interface ShipUnlockInput {
  ship: ShipRegistryEntry;
  unlockedShipIds: ReadonlySet<ShipId>;
  totalCredits: number;
}

export interface AvailableHangarWeaponInput {
  unlockedShipIds: ReadonlySet<ShipId>;
  unlockedWeaponIds: readonly WeaponId[];
}

export function createPreRunNavConfig(input: CreatePreRunNavConfigInput): GameScenePreRunNavConfig {
  return {
    canPlay: input.canPlay,
    playDisabledReason: input.playDisabledReason,
    isActionActive: input.isActionActive,
    resetCursor: input.resetCursor,
    onPlay: input.onPlay,
    onShowCommand: input.onShowCommand,
    onShowHangar: input.onShowHangar,
    onShowShop: input.onShowShop,
    onShowSettings: input.onShowSettings
  };
}

export function isShipUnlocked(unlockedShipIds: ReadonlySet<ShipId>, shipId: ShipId): boolean {
  return unlockedShipIds.has(shipId);
}

export function canStartRunWithShip(ship: ShipRegistryEntry, unlockedShipIds: ReadonlySet<ShipId>): boolean {
  return ship.selectable && isShipUnlocked(unlockedShipIds, ship.id);
}

export function getFirstLoadoutWeaponId(loadout: WeaponLoadoutState, slot: WeaponSlotType): WeaponId | null {
  return loadout[slot].find((weaponId) => weaponId !== null && getWeaponDefinition(weaponId).slotCompatibility.includes(slot)) ?? null;
}

export function canStartConfiguredRun(input: RunConfigurationInput): boolean {
  return canStartRunWithShip(input.selectedShip, input.unlockedShipIds) && getFirstLoadoutWeaponId(input.weaponLoadout, 'primary') !== null;
}

export function getPlayDisabledReason(input: RunConfigurationInput): string {
  if (!canStartRunWithShip(input.selectedShip, input.unlockedShipIds)) {
    return 'LOCKED';
  }

  if (!getFirstLoadoutWeaponId(input.weaponLoadout, 'primary')) {
    return 'NO LEFT WEAPON';
  }

  return 'PLAY';
}

export function canUnlockShip(input: ShipUnlockInput): boolean {
  return (
    input.ship.selectable &&
    !isShipUnlocked(input.unlockedShipIds, input.ship.id) &&
    input.ship.unlockCostCredits !== undefined &&
    input.totalCredits >= input.ship.unlockCostCredits
  );
}

export function isOtherShipStartingWeapon(weaponId: WeaponId | null, selectedShipId: ShipId): boolean {
  if (!weaponId) {
    return false;
  }

  return shipRegistry.some(
    (ship) => ship.id !== selectedShipId && (ship.startingPrimaryWeaponId === weaponId || ship.startingSecondaryWeaponId === weaponId)
  );
}

export function getAvailableHangarWeaponIds(input: AvailableHangarWeaponInput): WeaponId[] {
  const weaponIds = new Set<WeaponId>(['pulse-cannon', ...input.unlockedWeaponIds]);
  for (const ship of shipRegistry) {
    if (isShipUnlocked(input.unlockedShipIds, ship.id) && ship.startingPrimaryWeaponId) {
      weaponIds.add(ship.startingPrimaryWeaponId);
    }
    if (isShipUnlocked(input.unlockedShipIds, ship.id) && ship.startingSecondaryWeaponId) {
      weaponIds.add(ship.startingSecondaryWeaponId);
    }
  }

  return [...weaponIds];
}

export function getShipLockedLabel(ship: ShipRegistryEntry): string {
  if (!ship.selectable) {
    return 'Coming Soon';
  }

  return ship.unlockCostCredits === undefined ? 'Locked' : `Locked ${ship.unlockCostCredits} credits`;
}
