import type { ShipRegistryEntry } from '../data/ships';
import { getWeaponDefinition, type WeaponId, type WeaponRegistryEntry } from '../data/weapons';
import type { WeaponLoadoutState } from './progressionStorage';
import type { RunUpgradeLevels } from './runUpgrades';

export interface PlayerWeaponRuntimeState {
  activeAutoWeaponId: WeaponRegistryEntry['id'] | null;
  activePrimaryWeaponId: WeaponRegistryEntry['id'] | null;
  activeSecondaryWeaponId: WeaponRegistryEntry['id'] | null;
  ownedAutoWeaponIds: WeaponRegistryEntry['id'][];
  ownedManualWeaponIds: WeaponRegistryEntry['id'][];
  nextAutoWeaponFireAt: number;
  nextPrimaryWeaponFireAt: number;
  nextSecondaryWeaponFireAt: number;
}

export type PlayerWeaponUpgradeState = RunUpgradeLevels;

export interface PlayerWeaponDebugTuning {
  damageMultiplier: number;
  fireRateMultiplier: number;
}

export function createPlayerWeaponRuntimeState(ship: ShipRegistryEntry, loadout?: WeaponLoadoutState): PlayerWeaponRuntimeState {
  const primaryWeaponIds = getCompatibleLoadoutWeapons(loadout?.primary, 'primary');
  const secondaryWeaponIds = getCompatibleLoadoutWeapons(loadout?.secondary, 'secondary');
  const autoWeaponIds = getCompatibleLoadoutWeapons(loadout?.auto, 'auto');
  const startingPrimaryWeaponId = primaryWeaponIds[0] ?? ship.startingPrimaryWeaponId;
  const startingSecondaryWeaponId = secondaryWeaponIds[0] ?? ship.startingSecondaryWeaponId;

  return {
    activeAutoWeaponId: autoWeaponIds[0] ?? null,
    activePrimaryWeaponId: startingPrimaryWeaponId,
    activeSecondaryWeaponId: startingSecondaryWeaponId,
    ownedAutoWeaponIds: autoWeaponIds,
    ownedManualWeaponIds: uniqueWeaponIds([...primaryWeaponIds, ...secondaryWeaponIds, ...(startingPrimaryWeaponId ? [startingPrimaryWeaponId] : [])]),
    nextAutoWeaponFireAt: 0,
    nextPrimaryWeaponFireAt: 0,
    nextSecondaryWeaponFireAt: 0
  };
}

function getCompatibleLoadoutWeapons(weaponIds: Array<WeaponId | null> | undefined, slot: 'auto' | 'primary' | 'secondary'): WeaponId[] {
  return uniqueWeaponIds(
    (weaponIds ?? []).filter((weaponId): weaponId is WeaponId => {
      if (!weaponId) {
        return false;
      }

      return getWeaponDefinition(weaponId).slotCompatibility.includes(slot);
    })
  );
}

function uniqueWeaponIds(weaponIds: WeaponId[]): WeaponId[] {
  return [...new Set(weaponIds)];
}

export function getActiveAutoWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry | undefined {
  return state.activeAutoWeaponId ? getWeaponDefinition(state.activeAutoWeaponId) : undefined;
}

export function getActivePrimaryWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry | undefined {
  return state.activePrimaryWeaponId ? getWeaponDefinition(state.activePrimaryWeaponId) : undefined;
}

export function getActiveSecondaryWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry | undefined {
  return state.activeSecondaryWeaponId ? getWeaponDefinition(state.activeSecondaryWeaponId) : undefined;
}

export function getOwnedAutoWeaponDefinitions(state: PlayerWeaponRuntimeState): WeaponRegistryEntry[] {
  return state.ownedAutoWeaponIds.map((weaponId) => getWeaponDefinition(weaponId));
}

export function getOwnedManualWeaponDefinitions(state: PlayerWeaponRuntimeState): WeaponRegistryEntry[] {
  return state.ownedManualWeaponIds.map((weaponId) => getWeaponDefinition(weaponId));
}
