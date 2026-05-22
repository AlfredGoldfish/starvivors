import { getShipDefinition } from '../data/ships';
import type { WeaponId } from '../data/weapons';
import { createPlayerWeaponRuntimeState } from './playerWeapons';
import { loadProgressionState, normalizeProgressionState } from './progressionStorage';

export interface ProgressionLoadoutHarnessResult {
  pass: boolean;
  checks: Record<string, boolean>;
  details: Record<string, unknown>;
}

const PROGRESSION_STORAGE_KEY = 'starvivors.progression.v1';

export function runProgressionLoadoutMigrationHarness(): ProgressionLoadoutHarnessResult {
  const legacySave = {
    totalCredits: 25,
    selectedShipId: 'interceptor',
    unlockedShipIds: ['interceptor', 'bulwark'],
    unlockedWeaponIds: [
      'pulse-cannon',
      'test1-weapon',
      'test2-weapon',
      'test3-weapon',
      'test4-weapon',
      'ramming-shield',
      'unknown-weapon'
    ],
    weaponLoadout: {
      primary: ['test1-weapon', 'ramming-shield', 'pulse-cannon'],
      secondary: ['test2-weapon', 'pulse-cannon', 'ramming-shield'],
      auto: ['test4-weapon', 'pulse-cannon', 'unknown-weapon']
    },
    weaponMkLevels: {
      'pulse-cannon': 3,
      'ramming-shield': 2,
      'test1-weapon': 9,
      'test4-weapon': 4,
      'unknown-weapon': 99
    }
  };

  const migrated = normalizeProgressionState(JSON.parse(JSON.stringify(legacySave)));
  const loadedFromStorage = runStorageRoundTrip(legacySave);
  const starterSecondaryRuntime = createPlayerWeaponRuntimeState(
    {
      ...getShipDefinition('interceptor'),
      startingSecondaryWeaponId: 'ramming-shield'
    },
    {
      primary: ['pulse-cannon', null, null],
      secondary: [null, null, null],
      auto: [null, null, null]
    }
  );

  const checks = {
    removedWeaponsDroppedFromUnlocks: !hasAnyRemovedPlaceholder(migrated.unlockedWeaponIds),
    realWeaponsRemainUnlocked:
      migrated.unlockedWeaponIds.includes('pulse-cannon') && migrated.unlockedWeaponIds.includes('ramming-shield'),
    invalidLoadoutSlotsCleared:
      migrated.weaponLoadout.primary[0] === null &&
      migrated.weaponLoadout.secondary.every((weaponId) => weaponId === null) &&
      migrated.weaponLoadout.auto.every((weaponId) => weaponId === null),
    validLoadoutWeaponsRemain:
      migrated.weaponLoadout.primary[1] === 'ramming-shield' && migrated.weaponLoadout.primary[2] === 'pulse-cannon',
    removedMkLevelsDropped:
      !('test1-weapon' in migrated.weaponMkLevels) &&
      !('test4-weapon' in migrated.weaponMkLevels) &&
      !('unknown-weapon' in migrated.weaponMkLevels),
    realMkLevelsRemain: migrated.weaponMkLevels['pulse-cannon'] === 3 && migrated.weaponMkLevels['ramming-shield'] === 2,
    storageLoadMigratesRemovedWeapons:
      loadedFromStorage !== null &&
      !hasAnyRemovedPlaceholder(loadedFromStorage.unlockedWeaponIds) &&
      loadedFromStorage.weaponLoadout.primary[0] === null &&
      loadedFromStorage.weaponMkLevels['pulse-cannon'] === 3,
    starterSecondaryIsActiveAndOwned:
      starterSecondaryRuntime.activeSecondaryWeaponId === 'ramming-shield' &&
      starterSecondaryRuntime.ownedManualWeaponIds.includes('ramming-shield')
  };

  return {
    pass: Object.values(checks).every(Boolean),
    checks,
    details: {
      migratedUnlocks: migrated.unlockedWeaponIds,
      migratedLoadout: migrated.weaponLoadout,
      migratedMkLevels: migrated.weaponMkLevels,
      loadedFromStorage,
      starterSecondaryRuntime
    }
  };
}

function runStorageRoundTrip(legacySave: unknown): ReturnType<typeof loadProgressionState> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const previous = window.localStorage.getItem(PROGRESSION_STORAGE_KEY);

  try {
    window.localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(legacySave));
    return loadProgressionState();
  } finally {
    if (previous === null) {
      window.localStorage.removeItem(PROGRESSION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PROGRESSION_STORAGE_KEY, previous);
    }
  }
}

function hasAnyRemovedPlaceholder(weaponIds: WeaponId[]): boolean {
  return weaponIds.some((weaponId) =>
    ['test1-weapon', 'test2-weapon', 'test3-weapon', 'test4-weapon'].includes(weaponId)
  );
}
