import { describe, expect, it } from 'vitest';
import {
  purchaseRadarUpgrade,
  purchaseRunBoost,
  purchaseRunPrepUpgrade,
  purchaseSectorScannerUpgrade,
  purchaseShipShopUpgrade,
  purchaseWeaponShopUpgrade
} from './progressionPurchases';
import { createDefaultProgressionState } from './progressionStorage';

describe('progression purchase helpers', () => {
  it('purchases ship upgrades only for unlocked ships with enough credits', () => {
    const state = createDefaultProgressionState();

    const locked = purchaseShipShopUpgrade(state, 1000, state.unlockedShipIds, 'bulwark', 'hull-retrofit');
    expect(locked.purchased).toBe(false);
    expect(state.shipUpgradeLevels.bulwark?.['hull-retrofit']).toBe(0);

    const insufficient = purchaseShipShopUpgrade(state, 69, state.unlockedShipIds, 'interceptor', 'hull-retrofit');
    expect(insufficient.purchased).toBe(false);
    expect(insufficient.cost).toBe(70);

    const purchased = purchaseShipShopUpgrade(state, 70, state.unlockedShipIds, 'interceptor', 'hull-retrofit');
    expect(purchased).toEqual({ purchased: true, totalCredits: 0, cost: 70 });
    expect(state.shipUpgradeLevels.interceptor?.['hull-retrofit']).toBe(1);
  });

  it('purchases weapon upgrades and mirrors weapon mk levels', () => {
    const state = createDefaultProgressionState();

    const wrongWeapon = purchaseWeaponShopUpgrade(
      state,
      state.weaponMkLevels,
      1000,
      ['ramming-shield'],
      'ramming-shield',
      'accelerated-coils'
    );
    expect(wrongWeapon.purchased).toBe(false);
    expect(state.weaponUpgradeLevels['ramming-shield']?.['accelerated-coils']).toBe(0);

    const purchased = purchaseWeaponShopUpgrade(
      state,
      state.weaponMkLevels,
      85,
      ['pulse-cannon'],
      'pulse-cannon',
      'weapon-mk'
    );
    expect(purchased).toEqual({ purchased: true, totalCredits: 0, cost: 85 });
    expect(state.weaponUpgradeLevels['pulse-cannon']?.['weapon-mk']).toBe(1);
    expect(state.weaponMkLevels['pulse-cannon']).toBe(2);
  });

  it('purchases run prep upgrades and single-use boosts with max-level gating', () => {
    const state = createDefaultProgressionState();

    const prep = purchaseRunPrepUpgrade(state, 80, 'expanded-launch-fuel');
    expect(prep).toEqual({ purchased: true, totalCredits: 0, cost: 80 });
    expect(state.runPrepUpgradeLevels['expanded-launch-fuel']).toBe(1);

    state.runPrepUpgradeLevels['expanded-launch-fuel'] = 3;
    const maxedPrep = purchaseRunPrepUpgrade(state, 1000, 'expanded-launch-fuel');
    expect(maxedPrep.purchased).toBe(false);
    expect(state.runPrepUpgradeLevels['expanded-launch-fuel']).toBe(3);

    const boost = purchaseRunBoost(state, 35, 'fuel-canister');
    expect(boost).toEqual({ purchased: true, totalCredits: 0, cost: 35 });
    expect(state.pendingRunBoosts['fuel-canister']).toBe(1);

    const maxedBoost = purchaseRunBoost(state, 1000, 'fuel-canister');
    expect(maxedBoost.purchased).toBe(false);
    expect(state.pendingRunBoosts['fuel-canister']).toBe(1);
  });

  it('purchases radar and scanner levels when progression permits them', () => {
    const state = createDefaultProgressionState();

    const radar = purchaseRadarUpgrade(state, 50);
    expect(radar).toEqual({ purchased: true, totalCredits: 0, cost: 50 });
    expect(state.radarLevel).toBe(1);

    const unavailableScanner = purchaseSectorScannerUpgrade(state, 1000);
    expect(unavailableScanner).toEqual({ purchased: false, totalCredits: 1000, cost: null });
    expect(state.sectorScannerLevel).toBe(0);

    state.unlockedRewardHooks.push('sector-scanner.black-hole-cache');
    const scanner = purchaseSectorScannerUpgrade(state, 75);
    expect(scanner).toEqual({ purchased: true, totalCredits: 0, cost: 75 });
    expect(state.sectorScannerLevel).toBe(1);
  });
});
