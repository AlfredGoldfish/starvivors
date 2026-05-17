import type { ContentRegistryEntry } from './contentStatus';
import { interceptorMovement } from './balance';
import { DEFAULT_PLAYER_BASE_STATS, type PlayerBaseStats } from './stats';
import { pulseCannon, rammingShield, type RammingShieldStats, type WeaponId } from './weapons';

export interface ShipWeaponBonusDefinition {
  rammingShield?: Partial<RammingShieldStats> & {
    dashImpulseMultiplier?: number;
  };
}

export interface ShipRegistryEntry extends ContentRegistryEntry {
  id: ShipId;
  displayName: string;
  selectable: boolean;
  description: string;
  role: string;
  baseStats: PlayerBaseStats;
  hitRadius: number;
  movementNotes: string;
  startingWeaponNotes: string;
  startingMainWeaponId: WeaponId;
  startingSecondaryWeaponId: WeaponId | null;
  defaultPrimaryWeaponBonuses?: Partial<Record<WeaponId, ShipWeaponBonusDefinition>>;
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
    baseStats: {
      ...DEFAULT_PLAYER_BASE_STATS,
      maxHull: 100,
      mass: 3,
      moveSpeed: interceptorMovement.maxSpeed,
      thrust: interceptorMovement.thrustAcceleration,
      brake: interceptorMovement.reverseThrustAcceleration,
      strafe: interceptorMovement.strafeThrustAcceleration
    },
    hitRadius: 32,
    movementNotes: 'Fast thrust, responsive strafing, light hull.',
    startingWeaponNotes: `${pulseCannon.displayName} starter`,
    startingMainWeaponId: pulseCannon.id,
    startingSecondaryWeaponId: null,
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
    description: 'Heavy ramming ship. Tough hull, slower handling, and a forward Ramming Shield.',
    role: 'Heavy rammer',
    baseStats: {
      ...DEFAULT_PLAYER_BASE_STATS,
      maxHull: 150,
      mass: 5.5,
      moveSpeed: Math.round(interceptorMovement.maxSpeed * 0.85),
      thrust: Math.round(interceptorMovement.thrustAcceleration * 0.35),
      brake: Math.round(interceptorMovement.reverseThrustAcceleration * 0.45),
      strafe: Math.round(interceptorMovement.strafeThrustAcceleration * 0.3)
    },
    hitRadius: 35,
    movementNotes: 'Heavier thrust response, lower top speed, stronger knockback resistance.',
    startingWeaponNotes: `${rammingShield.displayName} starter`,
    startingMainWeaponId: rammingShield.id,
    startingSecondaryWeaponId: null,
    defaultPrimaryWeaponBonuses: {
      'ramming-shield': {
        rammingShield: {
          dashMaxCharges: 6,
          dashChargeRechargeSeconds: 2,
          dashImpulseMultiplier: 1.25
        }
      }
    },
    speedRating: 'Moderate',
    handlingRating: 'Heavy',
    unlockCostCredits: 100,
    textureKey: 'player-ship-bulwark',
    displaySize: 128,
    visualRotation: Math.PI,
    movement: {
      ...interceptorMovement,
      thrustAcceleration: Math.round(interceptorMovement.thrustAcceleration * 0.35),
      reverseThrustAcceleration: Math.round(interceptorMovement.reverseThrustAcceleration * 0.45),
      strafeThrustAcceleration: Math.round(interceptorMovement.strafeThrustAcceleration * 0.3),
      maxSpeed: Math.round(interceptorMovement.maxSpeed * 0.85)
    }
  }
];

export function getShipDefinition(shipId: ShipId): ShipRegistryEntry {
  return shipRegistry.find((ship) => ship.id === shipId) ?? shipRegistry[0];
}
