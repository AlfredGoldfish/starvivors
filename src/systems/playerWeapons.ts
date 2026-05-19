import type { ShipRegistryEntry } from '../data/ships';
import { getWeaponDefinition, type WeaponRegistryEntry } from '../data/weapons';
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

export function createPlayerWeaponRuntimeState(ship: ShipRegistryEntry): PlayerWeaponRuntimeState {
  const startingPrimaryWeaponId = ship.startingPrimaryWeaponId;

  return {
    activeAutoWeaponId: null,
    activePrimaryWeaponId: startingPrimaryWeaponId,
    activeSecondaryWeaponId: null,
    ownedAutoWeaponIds: [],
    ownedManualWeaponIds: startingPrimaryWeaponId ? [startingPrimaryWeaponId] : [],
    nextAutoWeaponFireAt: 0,
    nextPrimaryWeaponFireAt: 0,
    nextSecondaryWeaponFireAt: 0
  };
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
