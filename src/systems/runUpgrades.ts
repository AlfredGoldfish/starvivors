import { UPGRADE_CHOICES, type UpgradeDefinition, type UpgradeId, type WeaponUpgradeStat } from '../data/upgrades';
import type { WeaponRegistryEntry } from '../data/weapons';

export type RunUpgradeLevels = Record<UpgradeId, number>;

export function createInitialRunUpgradeLevels(): RunUpgradeLevels {
  return UPGRADE_CHOICES.reduce((levels, upgrade) => {
    levels[upgrade.id] = 0;
    return levels;
  }, {} as RunUpgradeLevels);
}

export function getRunUpgradeLevel(levels: RunUpgradeLevels, upgrade: UpgradeDefinition): number {
  return levels[upgrade.id] ?? 0;
}

export function isRunUpgradeAtMaxLevel(levels: RunUpgradeLevels, upgrade: UpgradeDefinition): boolean {
  return getRunUpgradeLevel(levels, upgrade) >= upgrade.maxLevel;
}

export function getAvailableRunUpgrades(
  levels: RunUpgradeLevels,
  equippedWeapons: WeaponRegistryEntry[],
  upgrades: UpgradeDefinition[] = UPGRADE_CHOICES
): UpgradeDefinition[] {
  const available = upgrades.filter(
    (upgrade) => isUpgradeRelevantForWeapons(upgrade, equippedWeapons) && !isRunUpgradeAtMaxLevel(levels, upgrade)
  );

  if (available.length > 0) {
    return available;
  }

  return upgrades.filter(
    (upgrade) => (upgrade.category === 'passive' || upgrade.category === 'utility') && !isRunUpgradeAtMaxLevel(levels, upgrade)
  );
}

export function isUpgradeRelevantForWeapons(upgrade: UpgradeDefinition, equippedWeapons: WeaponRegistryEntry[]): boolean {
  const target = upgrade.target;

  if (!target) {
    return true;
  }

  return equippedWeapons.some((weapon) => {
    const matchesWeaponId = target.weaponIds?.includes(weapon.id) ?? false;
    const matchesBehaviorType = target.behaviorTypes?.includes(weapon.behaviorType) ?? false;
    const matchesTag = target.weaponTags?.some((tag) => weapon.tags.includes(tag)) ?? false;

    return matchesWeaponId || matchesBehaviorType || matchesTag;
  });
}

export function incrementRunUpgradeLevel(levels: RunUpgradeLevels, upgrade: UpgradeDefinition): void {
  levels[upgrade.id] = Math.min(upgrade.maxLevel, getRunUpgradeLevel(levels, upgrade) + 1);
}

export function getAdditiveWeaponUpgradeModifier(
  levels: RunUpgradeLevels,
  weapon: WeaponRegistryEntry,
  stat: WeaponUpgradeStat
): number {
  return UPGRADE_CHOICES.reduce((total, upgrade) => {
    const level = levels[upgrade.id] ?? 0;
    if (level <= 0 || !isUpgradeRelevantForWeapons(upgrade, [weapon])) {
      return total;
    }

    return (
      total +
      (upgrade.statModifiers ?? [])
        .filter((modifier) => modifier.stat === stat && modifier.operation === 'add')
        .reduce((modifierTotal, modifier) => modifierTotal + modifier.value * level, 0)
    );
  }, 0);
}

export function getMultiplicativeWeaponUpgradeModifier(
  levels: RunUpgradeLevels,
  weapon: WeaponRegistryEntry,
  stat: WeaponUpgradeStat
): number {
  return UPGRADE_CHOICES.reduce((total, upgrade) => {
    const level = levels[upgrade.id] ?? 0;
    if (level <= 0 || !isUpgradeRelevantForWeapons(upgrade, [weapon])) {
      return total;
    }

    return (upgrade.statModifiers ?? [])
      .filter((modifier) => modifier.stat === stat && modifier.operation === 'multiply')
      .reduce((modifierTotal, modifier) => modifierTotal * Math.pow(modifier.value, level), total);
  }, 1);
}
