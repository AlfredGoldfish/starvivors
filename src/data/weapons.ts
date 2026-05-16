import type { ContentRegistryEntry } from './contentStatus';
import { bulwarkCannonBalance, pulseCannonBalance } from './balance';

export type WeaponId = 'pulse-cannon' | 'bulwark-cannon';
export type WeaponSlotType = 'main' | 'secondary';

export interface ProjectileVisualDefinition {
  glowColor: number;
  glowAlpha: number;
  bodyColor: number;
  bodyStrokeColor: number;
  trailColor: number;
  width: number;
  height: number;
}

export interface WeaponRegistryEntry extends ContentRegistryEntry {
  id: WeaponId;
  displayName: string;
  description: string;
  slotType: WeaponSlotType;
  damage: number;
  cooldownSeconds: number;
  projectileSpeed: number;
  projectileLifetimeSeconds: number;
  projectileRange: number;
  projectileVisual: ProjectileVisualDefinition;
}

export const pulseCannon: WeaponRegistryEntry = {
  id: 'pulse-cannon',
  displayName: 'Pulse Cannon',
  status: 'Implemented',
  description: 'Fast main cannon tuned for the Interceptor.',
  slotType: 'main',
  damage: pulseCannonBalance.damage,
  cooldownSeconds: pulseCannonBalance.cooldownSeconds,
  projectileSpeed: pulseCannonBalance.projectileSpeed,
  projectileLifetimeSeconds: pulseCannonBalance.projectileLifetimeSeconds,
  projectileRange: pulseCannonBalance.projectileRange,
  projectileVisual: {
    glowColor: 0x42f5d7,
    glowAlpha: 0.3,
    bodyColor: 0x73f2ff,
    bodyStrokeColor: 0xf2fbff,
    trailColor: 0x42f5d7,
    width: 18,
    height: 24
  }
};

export const bulwarkCannon: WeaponRegistryEntry = {
  id: 'bulwark-cannon',
  displayName: 'Bulwark Cannon',
  status: 'MVP',
  description: 'Heavy placeholder main cannon for the Bulwark.',
  slotType: 'main',
  damage: bulwarkCannonBalance.damage,
  cooldownSeconds: bulwarkCannonBalance.cooldownSeconds,
  projectileSpeed: bulwarkCannonBalance.projectileSpeed,
  projectileLifetimeSeconds: bulwarkCannonBalance.projectileLifetimeSeconds,
  projectileRange: bulwarkCannonBalance.projectileRange,
  projectileVisual: {
    glowColor: 0xffc857,
    glowAlpha: 0.28,
    bodyColor: 0xffd98a,
    bodyStrokeColor: 0xfff4cf,
    trailColor: 0xffc857,
    width: 22,
    height: 28
  }
};

export const weaponRegistry: WeaponRegistryEntry[] = [pulseCannon, bulwarkCannon];

export function getWeaponDefinition(weaponId: WeaponId): WeaponRegistryEntry {
  return weaponRegistry.find((weapon) => weapon.id === weaponId) ?? pulseCannon;
}
