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
  baseMass: number;
  hitRadius: number;
  movementNotes: string;
  startingWeaponNotes: string;
  speedRating: string;
  handlingRating: string;
  unlockCostCredits?: number;
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
    baseMass: 3,
    hitRadius: 32,
    movementNotes: 'Fast thrust, responsive strafing, light hull.',
    startingWeaponNotes: `${pulseCannon.displayName} starter`,
    speedRating: 'Fast',
    handlingRating: 'Responsive',
    textureKey: 'player-ship-spaceship-1',
    displaySize: 118,
    visualRotation: Math.PI,
    movement: interceptorMovement
  },
  {
    id: 'bulwark',
    displayName: 'Bulwark',
    status: 'MVP',
    selectable: true,
    description: 'Heavy ramming ship. Tough hull, slower handling. Ramming Shield coming next.',
    role: 'Heavy rammer',
    baseHull: 150,
    baseMass: 5.5,
    hitRadius: 35,
    movementNotes: 'Heavier thrust response, lower top speed, stronger knockback resistance.',
    startingWeaponNotes: `${pulseCannon.displayName} starter. Ramming Shield coming next.`,
    speedRating: 'Moderate',
    handlingRating: 'Heavy',
    unlockCostCredits: 100,
    textureKey: 'player-ship-bulwark',
    displaySize: 128,
    visualRotation: Math.PI,
    movement: {
      ...interceptorMovement,
      thrustAcceleration: Math.round(interceptorMovement.thrustAcceleration * 0.75),
      reverseThrustAcceleration: Math.round(interceptorMovement.reverseThrustAcceleration * 0.75),
      strafeThrustAcceleration: Math.round(interceptorMovement.strafeThrustAcceleration * 0.72),
      maxSpeed: Math.round(interceptorMovement.maxSpeed * 0.85)
    }
  }
];

export function getShipDefinition(shipId: ShipId): ShipRegistryEntry {
  return shipRegistry.find((ship) => ship.id === shipId) ?? shipRegistry[0];
}
