import { describe, expect, it } from 'vitest';
import { DEFAULT_SHIP_ID, isShipId } from '../data/ships';
import { isRewardHookId, normalizeProgressionState } from './progressionStorage';

describe('progression normalization', () => {
  it('validates ship ids and keeps the selected ship unlocked', () => {
    const state = normalizeProgressionState({
      selectedShipId: 'ghost',
      unlockedShipIds: ['bulwark', 'ghost', 'bulwark', 42],
      selectedSkinIds: {
        interceptor: 'interceptor-ghost',
        bulwark: 'bulwark-red',
        engineer: 'not-a-skin',
        ghost: 'ghost-skin'
      }
    });

    expect(state.selectedShipId).toBe(DEFAULT_SHIP_ID);
    expect(state.unlockedShipIds).toEqual(['interceptor', 'bulwark']);
    expect(state.selectedSkinIds).toEqual({
      interceptor: 'interceptor-ghost',
      bulwark: 'bulwark-red'
    });
  });

  it('falls back when a valid selected ship is not unlocked', () => {
    const state = normalizeProgressionState({
      selectedShipId: 'engineer',
      unlockedShipIds: ['bulwark']
    });

    expect(state.selectedShipId).toBe(DEFAULT_SHIP_ID);
    expect(state.unlockedShipIds).toEqual(['interceptor', 'bulwark']);
  });

  it('filters reward hooks to known ids', () => {
    const state = normalizeProgressionState({
      unlockedRewardHooks: [
        'mission.survey-signal',
        'bad-hook',
        'sector-scanner.hunter-swarm',
        'mission.survey-signal'
      ]
    });

    expect(state.unlockedRewardHooks).toEqual(['mission.survey-signal', 'sector-scanner.hunter-swarm']);
  });

  it('normalizes non-finite numeric fields to safe values', () => {
    const state = normalizeProgressionState({
      totalCredits: Number.POSITIVE_INFINITY,
      radarLevel: Number.NaN,
      sectorScannerLevel: '9',
      permanentUpgradeLevels: {
        'hull-reinforcement': '2',
        'velocity-limiter': Number.NaN
      },
      activePermanentUpgradeLevels: {
        'hull-reinforcement': '9'
      },
      weaponUpgradeLevels: {
        'pulse-cannon': {
          'weapon-mk': '2',
          'accelerated-coils': Number.POSITIVE_INFINITY
        }
      },
      weaponMkLevels: {
        'pulse-cannon': Number.NaN,
        'salvage-beam': '3'
      }
    });

    expect(state.totalCredits).toBe(0);
    expect(state.radarLevel).toBe(0);
    expect(state.sectorScannerLevel).toBe(3);
    expect(state.permanentUpgradeLevels['hull-reinforcement']).toBe(2);
    expect(state.permanentUpgradeLevels['velocity-limiter']).toBe(0);
    expect(state.activePermanentUpgradeLevels['hull-reinforcement']).toBe(2);
    expect(state.weaponUpgradeLevels['pulse-cannon']?.['weapon-mk']).toBe(2);
    expect(state.weaponUpgradeLevels['pulse-cannon']?.['accelerated-coils']).toBe(0);
    expect(state.weaponMkLevels['pulse-cannon']).toBe(3);
    expect(state.weaponMkLevels['salvage-beam']).toBe(3);
  });

  it('preserves weapon loadout compatibility and deduping behavior', () => {
    const state = normalizeProgressionState({
      unlockedWeaponIds: ['salvage-beam', 'bogus-weapon'],
      weaponLoadout: {
        primary: ['pulse-cannon', 'bogus-weapon', 'pulse-cannon'],
        secondary: ['salvage-beam', 'ramming-shield'],
        auto: ['pulse-cannon']
      }
    });

    expect(state.unlockedWeaponIds).toEqual(['pulse-cannon', 'salvage-beam']);
    expect(state.weaponLoadout).toEqual({
      primary: ['pulse-cannon', null, null],
      secondary: ['salvage-beam', 'ramming-shield', null],
      auto: [null, null, null]
    });
  });
});

describe('progression id guards', () => {
  it('identifies known ship and reward ids', () => {
    expect(isShipId('interceptor')).toBe(true);
    expect(isShipId('ghost')).toBe(false);
    expect(isRewardHookId('mission.survey-signal')).toBe(true);
    expect(isRewardHookId('bad-hook')).toBe(false);
  });
});
