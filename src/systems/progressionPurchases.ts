import {
  RUN_BOOSTS,
  getRunPrepUpgradeDefinition,
  getShipShopUpgradeDefinition,
  getShopUpgradeCost,
  getWeaponShopUpgradeDefinition,
  type RunBoostId,
  type RunPrepUpgradeId,
  type ShipShopUpgradeId,
  type WeaponShopUpgradeId
} from '../data/shopUpgrades';
import type { ShipId } from '../data/ships';
import type { WeaponId } from '../data/weapons';
import {
  getNextRadarLevel,
  getNextSectorScannerLevel,
  getRadarUpgradeCost,
  getSectorScannerCost,
  type ProgressionState,
  type WeaponMkLevels
} from './progressionStorage';

export interface ShopPurchaseResult {
  purchased: boolean;
  totalCredits: number;
  cost: number | null;
}

export function purchaseShipShopUpgrade(
  state: ProgressionState,
  totalCredits: number,
  unlockedShipIds: ReadonlySet<ShipId> | readonly ShipId[],
  shipId: ShipId,
  upgradeId: ShipShopUpgradeId
): ShopPurchaseResult {
  const upgrade = getShipShopUpgradeDefinition(upgradeId);
  const level = state.shipUpgradeLevels[shipId]?.[upgradeId] ?? 0;
  const cost = getShopUpgradeCost(upgrade, level);

  if (!hasValue(unlockedShipIds, shipId) || level >= upgrade.maxLevel || totalCredits < cost) {
    return { purchased: false, totalCredits, cost };
  }

  state.shipUpgradeLevels[shipId] = {
    ...state.shipUpgradeLevels[shipId],
    [upgradeId]: level + 1
  };

  return { purchased: true, totalCredits: totalCredits - cost, cost };
}

export function purchaseWeaponShopUpgrade(
  state: ProgressionState,
  weaponMkLevels: WeaponMkLevels,
  totalCredits: number,
  availableWeaponIds: readonly WeaponId[],
  weaponId: WeaponId,
  upgradeId: WeaponShopUpgradeId
): ShopPurchaseResult {
  const upgrade = getWeaponShopUpgradeDefinition(upgradeId);
  const level = state.weaponUpgradeLevels[weaponId]?.[upgradeId] ?? 0;
  const cost = getShopUpgradeCost(upgrade, level);

  if (
    !availableWeaponIds.includes(weaponId) ||
    (upgrade.weaponId && upgrade.weaponId !== weaponId) ||
    level >= upgrade.maxLevel ||
    totalCredits < cost
  ) {
    return { purchased: false, totalCredits, cost };
  }

  state.weaponUpgradeLevels[weaponId] = {
    ...state.weaponUpgradeLevels[weaponId],
    [upgradeId]: level + 1
  };
  if (upgradeId === 'weapon-mk') {
    weaponMkLevels[weaponId] = 1 + level + 1;
  }

  return { purchased: true, totalCredits: totalCredits - cost, cost };
}

export function purchaseRunPrepUpgrade(
  state: ProgressionState,
  totalCredits: number,
  upgradeId: RunPrepUpgradeId
): ShopPurchaseResult {
  const upgrade = getRunPrepUpgradeDefinition(upgradeId);
  const level = state.runPrepUpgradeLevels[upgradeId] ?? 0;
  const cost = getShopUpgradeCost(upgrade, level);

  if (level >= upgrade.maxLevel || totalCredits < cost) {
    return { purchased: false, totalCredits, cost };
  }

  state.runPrepUpgradeLevels[upgradeId] = level + 1;
  return { purchased: true, totalCredits: totalCredits - cost, cost };
}

export function purchaseRunBoost(
  state: ProgressionState,
  totalCredits: number,
  boostId: RunBoostId
): ShopPurchaseResult {
  const boost = RUN_BOOSTS.find((candidate) => candidate.id === boostId);
  const level = state.pendingRunBoosts[boostId] ?? 0;

  if (!boost) {
    return { purchased: false, totalCredits, cost: null };
  }

  const cost = getShopUpgradeCost(boost, level);
  if (level >= boost.maxLevel || totalCredits < cost) {
    return { purchased: false, totalCredits, cost };
  }

  state.pendingRunBoosts[boostId] = level + 1;
  return { purchased: true, totalCredits: totalCredits - cost, cost };
}

export function purchaseRadarUpgrade(state: ProgressionState, totalCredits: number): ShopPurchaseResult {
  const nextLevel = getNextRadarLevel(state);
  const cost = getRadarUpgradeCost(state);

  if (!nextLevel || cost === null || totalCredits < cost) {
    return { purchased: false, totalCredits, cost };
  }

  state.radarLevel = nextLevel;
  return { purchased: true, totalCredits: totalCredits - cost, cost };
}

export function purchaseSectorScannerUpgrade(state: ProgressionState, totalCredits: number): ShopPurchaseResult {
  const nextLevel = getNextSectorScannerLevel(state);
  const cost = getSectorScannerCost(state);

  if (!nextLevel || cost === null || totalCredits < cost) {
    return { purchased: false, totalCredits, cost };
  }

  state.sectorScannerLevel = nextLevel;
  return { purchased: true, totalCredits: totalCredits - cost, cost };
}

function hasValue<T>(values: ReadonlySet<T> | readonly T[], value: T): boolean {
  return values instanceof Set ? values.has(value) : (values as readonly T[]).includes(value);
}
