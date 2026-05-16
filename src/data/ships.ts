import type { ContentRegistryEntry } from './contentStatus';
import { interceptorMovement } from './balance';
import { pulseCannon } from './weapons';

export interface ShipRegistryEntry extends ContentRegistryEntry {
  id: ShipId;
  displayName: string;
  selectable: boolean;
  description: string;
  role: string;
  baseHull: number;
  movementNotes: string;
  startingWeaponNotes: string;
  textureKey: string;
  displaySize: number;
  visualRotation: number;
  movement: {
    thrustAcceleration: number;
    reverseThrustAcceleration: number;
    strafeThrustAcceleration: number;
    rotationSpeed: number;
    brakeDamping: number;
    lowFrictionDamping: number;
    maxSpeed: number;
  };
}

export type ShipId = 'interceptor' | 'bulwark';

export const DEFAULT_SHIP_ID: ShipId = 'interceptor';

export const shipRegistry: ShipRegistryEntry[] = [
  {
    id: 'interceptor',
    displayName: 'Interceptor',
    status: 'Implemented',
    selectable: true,
    description: 'Current default ship. Fast, responsive, and tuned for evasive Pulse Cannon runs.',
    role: 'Agile striker',
    baseHull: 100,
    movementNotes: 'Fast thrust, responsive strafing, light hull.',
    startingWeaponNotes: `${pulseCannon.displayName} starter`,
    textureKey: 'player-ship-spaceship-1',
    displaySize: 118,
    visualRotation: Math.PI,
    movement: interceptorMovement
  },
  {
    id: 'bulwark',
    displayName: 'Bulwark',
    status: 'WIP',
    selectable: false,
    description: 'Heavy ramming ship planned for a future playable pass.',
    role: 'Heavy rammer',
    baseHull: 160,
    movementNotes: 'Future slower, heavier handling.',
    startingWeaponNotes: 'Future Ramming Shield',
    textureKey: 'player-ship-bulwark',
    displaySize: 128,
    visualRotation: Math.PI,
    movement: interceptorMovement
  }
];

export function getShipDefinition(shipId: ShipId): ShipRegistryEntry {
  return shipRegistry.find((ship) => ship.id === shipId) ?? shipRegistry[0];
}
