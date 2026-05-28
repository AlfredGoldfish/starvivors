import type { ShipId } from './ships';
import type { WeaponId } from './weapons';

export type ShopSectionId = 'ships' | 'weapons' | 'systems' | 'run-prep' | 'boosts';

export type ShipShopUpgradeId = 'hull-retrofit' | 'thruster-tuning' | 'reserve-tanks';
export type WeaponShopUpgradeId = 'weapon-mk' | 'accelerated-coils' | 'reinforced-projector' | 'heat-sink-lattice';
export type RunPrepUpgradeId = 'expanded-launch-fuel' | 'reroll-logistics' | 'scrap-brokerage';
export type RunBoostId = 'emergency-patch-kit' | 'fuel-canister';

export type ShopUpgradeLevelMap<T extends string> = Partial<Record<T, number>>;
export type ShipShopUpgradeLevels = Partial<Record<ShipId, ShopUpgradeLevelMap<ShipShopUpgradeId>>>;
export type WeaponShopUpgradeLevels = Partial<Record<WeaponId, ShopUpgradeLevelMap<WeaponShopUpgradeId>>>;
export type RunPrepUpgradeLevels = ShopUpgradeLevelMap<RunPrepUpgradeId>;
export type PendingRunBoosts = Partial<Record<RunBoostId, number>>;

export interface BaseShopUpgradeDefinition<TId extends string> {
  id: TId;
  name: string;
  label: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  accentColor: number;
}

export interface ShipShopUpgradeDefinition extends BaseShopUpgradeDefinition<ShipShopUpgradeId> {
  targetType: 'ship';
}

export interface WeaponShopUpgradeDefinition extends BaseShopUpgradeDefinition<WeaponShopUpgradeId> {
  targetType: 'weapon';
  weaponId?: WeaponId;
}

export interface RunPrepUpgradeDefinition extends BaseShopUpgradeDefinition<RunPrepUpgradeId> {
  targetType: 'run-prep';
}

export interface RunBoostDefinition extends BaseShopUpgradeDefinition<RunBoostId> {
  targetType: 'boost';
}

export const SHOP_SECTIONS: Array<{ id: ShopSectionId; label: string }> = [
  { id: 'ships', label: 'SHIPS' },
  { id: 'weapons', label: 'WEAPONS' },
  { id: 'systems', label: 'SYSTEMS' },
  { id: 'run-prep', label: 'RUN PREP' },
  { id: 'boosts', label: 'BOOSTS' }
];

export const SHIP_SHOP_UPGRADES: ShipShopUpgradeDefinition[] = [
  {
    id: 'hull-retrofit',
    targetType: 'ship',
    name: 'Hull Retrofit',
    label: 'HUL',
    description: '+5 max hull per level for this ship.',
    maxLevel: 3,
    baseCost: 70,
    costStep: 45,
    accentColor: 0xff5964
  },
  {
    id: 'thruster-tuning',
    targetType: 'ship',
    name: 'Thruster Tuning',
    label: 'THR',
    description: '+3% thrust, strafe, and brake per level for this ship.',
    maxLevel: 3,
    baseCost: 80,
    costStep: 55,
    accentColor: 0x42f5d7
  },
  {
    id: 'reserve-tanks',
    targetType: 'ship',
    name: 'Reserve Tanks',
    label: 'FUL',
    description: '+5 max fuel per level for this ship.',
    maxLevel: 3,
    baseCost: 65,
    costStep: 45,
    accentColor: 0x73f2ff
  }
];

export const WEAPON_SHOP_UPGRADES: WeaponShopUpgradeDefinition[] = [
  {
    id: 'weapon-mk',
    targetType: 'weapon',
    name: 'Weapon Mk',
    label: 'MK',
    description: '+5% damage or effect strength per level for this weapon.',
    maxLevel: 3,
    baseCost: 85,
    costStep: 65,
    accentColor: 0xffc857
  },
  {
    id: 'accelerated-coils',
    targetType: 'weapon',
    weaponId: 'pulse-cannon',
    name: 'Accelerated Coils',
    label: 'COL',
    description: '-5% cooldown per level for Pulse Cannon.',
    maxLevel: 3,
    baseCost: 95,
    costStep: 65,
    accentColor: 0x38bdf8
  },
  {
    id: 'reinforced-projector',
    targetType: 'weapon',
    weaponId: 'ramming-shield',
    name: 'Reinforced Projector',
    label: 'SHP',
    description: '+10 shield HP per level for Ramming Shield.',
    maxLevel: 3,
    baseCost: 100,
    costStep: 70,
    accentColor: 0xb88cff
  },
  {
    id: 'heat-sink-lattice',
    targetType: 'weapon',
    weaponId: 'salvage-beam',
    name: 'Heat Sink Lattice',
    label: 'HT',
    description: '+8% cooling per level for Salvage Beam.',
    maxLevel: 3,
    baseCost: 90,
    costStep: 60,
    accentColor: 0x69f0ae
  }
];

export const RUN_PREP_UPGRADES: RunPrepUpgradeDefinition[] = [
  {
    id: 'expanded-launch-fuel',
    targetType: 'run-prep',
    name: 'Expanded Launch Fuel',
    label: 'FUL',
    description: '+5 global max fuel per level.',
    maxLevel: 3,
    baseCost: 80,
    costStep: 55,
    accentColor: 0x73f2ff
  },
  {
    id: 'reroll-logistics',
    targetType: 'run-prep',
    name: 'Reroll Logistics',
    label: 'RER',
    description: 'Reduces base reroll scrap cost by 1 per level.',
    maxLevel: 3,
    baseCost: 90,
    costStep: 60,
    accentColor: 0xc084fc
  },
  {
    id: 'scrap-brokerage',
    targetType: 'run-prep',
    name: 'Scrap Brokerage',
    label: 'CRD',
    description: '+5% scrap-to-credit conversion per level.',
    maxLevel: 3,
    baseCost: 100,
    costStep: 70,
    accentColor: 0xf59e0b
  }
];

export const RUN_BOOSTS: RunBoostDefinition[] = [
  {
    id: 'emergency-patch-kit',
    targetType: 'boost',
    name: 'Emergency Patch Kit',
    label: 'KIT',
    description: 'Next run starts with +15 temporary hull. Consumed on launch.',
    maxLevel: 1,
    baseCost: 45,
    costStep: 0,
    accentColor: 0xff5964
  },
  {
    id: 'fuel-canister',
    targetType: 'boost',
    name: 'Fuel Canister',
    label: 'CAN',
    description: 'Next run starts with +20 fuel. Consumed on launch.',
    maxLevel: 1,
    baseCost: 35,
    costStep: 0,
    accentColor: 0x73f2ff
  }
];

export const SHIP_SHOP_UPGRADE_IDS = SHIP_SHOP_UPGRADES.map((upgrade) => upgrade.id);
export const WEAPON_SHOP_UPGRADE_IDS = WEAPON_SHOP_UPGRADES.map((upgrade) => upgrade.id);
export const RUN_PREP_UPGRADE_IDS = RUN_PREP_UPGRADES.map((upgrade) => upgrade.id);
export const RUN_BOOST_IDS = RUN_BOOSTS.map((boost) => boost.id);

export const SHIP_HULL_RETROFIT_MAX_HULL_BONUS = 5;
export const SHIP_THRUSTER_TUNING_MULTIPLIER = 0.03;
export const SHIP_RESERVE_TANKS_FUEL_BONUS = 5;
export const WEAPON_MK_EFFECT_MULTIPLIER = 0.05;
export const PULSE_ACCELERATED_COILS_COOLDOWN_MULTIPLIER = 0.05;
export const RAMMING_REINFORCED_PROJECTOR_HP_BONUS = 10;
export const SALVAGE_HEAT_SINK_COOLING_MULTIPLIER = 0.08;
export const RUN_PREP_EXPANDED_FUEL_BONUS = 5;
export const RUN_PREP_REROLL_COST_REDUCTION = 1;
export const RUN_PREP_SCRAP_BROKERAGE_MULTIPLIER = 0.05;
export const BOOST_EMERGENCY_PATCH_HULL_BONUS = 15;
export const BOOST_FUEL_CANISTER_BONUS = 20;

export function getShopUpgradeCost(definition: BaseShopUpgradeDefinition<string>, level: number): number {
  return definition.baseCost + definition.costStep * Math.max(0, Math.floor(level));
}

export function getShipShopUpgradeDefinition(id: ShipShopUpgradeId): ShipShopUpgradeDefinition {
  return SHIP_SHOP_UPGRADES.find((upgrade) => upgrade.id === id) ?? SHIP_SHOP_UPGRADES[0];
}

export function getWeaponShopUpgradeDefinition(id: WeaponShopUpgradeId): WeaponShopUpgradeDefinition {
  return WEAPON_SHOP_UPGRADES.find((upgrade) => upgrade.id === id) ?? WEAPON_SHOP_UPGRADES[0];
}

export function getRunPrepUpgradeDefinition(id: RunPrepUpgradeId): RunPrepUpgradeDefinition {
  return RUN_PREP_UPGRADES.find((upgrade) => upgrade.id === id) ?? RUN_PREP_UPGRADES[0];
}
