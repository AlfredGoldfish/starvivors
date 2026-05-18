import { getWeaponDefinition, type WeaponRegistryEntry } from '../data/weapons';
import type { RunUpgradeLevels } from './runUpgrades';

export interface PlayerWeaponRuntimeState {
  activeMainWeaponId: WeaponRegistryEntry['id'];
  activeSecondaryWeaponId: WeaponRegistryEntry['id'] | null;
  nextMainWeaponFireAt: number;
  nextSecondaryWeaponFireAt: number;
}

export type PlayerWeaponUpgradeState = RunUpgradeLevels;

export interface PlayerWeaponDebugTuning {
  damageMultiplier: number;
  fireRateMultiplier: number;
}

export function createPlayerWeaponRuntimeState(activeMainWeaponId: WeaponRegistryEntry['id']): PlayerWeaponRuntimeState {
  return {
    activeMainWeaponId,
    activeSecondaryWeaponId: null,
    nextMainWeaponFireAt: 0,
    nextSecondaryWeaponFireAt: 0
  };
}

export function getActiveMainWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry {
  return getWeaponDefinition(state.activeMainWeaponId);
}

export function getActiveSecondaryWeaponDefinition(state: PlayerWeaponRuntimeState): WeaponRegistryEntry | undefined {
  return state.activeSecondaryWeaponId ? getWeaponDefinition(state.activeSecondaryWeaponId) : undefined;
}
