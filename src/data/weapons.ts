import type { ContentRegistryEntry } from './contentStatus';
import { pulseCannonBalance, rammingShieldBalance } from './balance';

export type WeaponId = 'pulse-cannon' | 'ramming-shield';
export type WeaponSlotType = 'main' | 'secondary';
export type WeaponBehaviorType = 'projectile' | 'ramming-shield';

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
  behaviorType: WeaponBehaviorType;
  slotCompatibility: WeaponSlotType[];
  startingShipId: string;
  eligibleAsSecondary: boolean;
  damage?: number;
  cooldownSeconds?: number;
  projectileSpeed?: number;
  projectileLifetimeSeconds?: number;
  projectileRange?: number;
  projectileVisual?: ProjectileVisualDefinition;
  rammingShield?: typeof rammingShieldBalance;
}

export const pulseCannon: WeaponRegistryEntry = {
  id: 'pulse-cannon',
  displayName: 'Pulse Cannon',
  status: 'Implemented',
  description: 'Fast main cannon tuned for the Interceptor.',
  behaviorType: 'projectile',
  slotCompatibility: ['main', 'secondary'],
  startingShipId: 'interceptor',
  eligibleAsSecondary: true,
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

export const rammingShield: WeaponRegistryEntry = {
  id: 'ramming-shield',
  displayName: 'Ramming Shield',
  status: 'MVP',
  description: 'Rechargeable forward impact shield tuned for Bulwark ramming.',
  behaviorType: 'ramming-shield',
  slotCompatibility: ['main', 'secondary'],
  startingShipId: 'bulwark',
  eligibleAsSecondary: true,
  rammingShield: rammingShieldBalance
};

export const weaponRegistry: WeaponRegistryEntry[] = [pulseCannon, rammingShield];

export function getWeaponDefinition(weaponId: WeaponId): WeaponRegistryEntry {
  return weaponRegistry.find((weapon) => weapon.id === weaponId) ?? pulseCannon;
}

export function isProjectileWeapon(weapon: WeaponRegistryEntry): boolean {
  return weapon.behaviorType === 'projectile';
}
