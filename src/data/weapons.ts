import type { ContentRegistryEntry } from './contentStatus';
import { pulseCannonBalance } from './balance';

export interface WeaponRegistryEntry extends ContentRegistryEntry {
  displayName: string;
  cooldownSeconds: number;
  projectileSpeed: number;
  projectileLifetimeSeconds: number;
  projectileRange: number;
}

export const pulseCannon: WeaponRegistryEntry = {
  id: 'pulse-cannon',
  displayName: 'Pulse Cannon',
  status: 'Implemented',
  cooldownSeconds: pulseCannonBalance.cooldownSeconds,
  projectileSpeed: pulseCannonBalance.projectileSpeed,
  projectileLifetimeSeconds: pulseCannonBalance.projectileLifetimeSeconds,
  projectileRange: pulseCannonBalance.projectileRange
};

export const weaponRegistry: WeaponRegistryEntry[] = [pulseCannon];
