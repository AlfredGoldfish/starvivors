import type { ContentRegistryEntry } from './contentStatus';
import { interceptorMovement } from './balance';
import { DEFAULT_PLAYER_BASE_STATS, type PlayerBaseStats } from './stats';
import { pulseCannon, rammingShield, type RammingShieldStats, type WeaponId } from './weapons';

export interface ShipWeaponBonusDefinition {
  rammingShield?: Partial<RammingShieldStats> & {
    dashImpulseMultiplier?: number;
  };
}

export interface ShipDisplayStatRatings {
  hull?: number;
  shield?: number;
  speed?: number;
  handling?: number;
  mass?: number;
  primaryDamage?: number;
  fireRate?: number;
  ramDamage?: number;
  shieldRegen?: number;
  pickupRange?: number;
}

export interface ShipMasteryPreviewDefinition {
  level: number;
  label: string;
}

export interface ShipDisplayDefinition {
  roleTitle: string;
  shortDescription: string;
  tags: string[];
  statRatings: ShipDisplayStatRatings;
  exampleUpgradeIds?: string[];
  masteryPreview?: ShipMasteryPreviewDefinition[];
}

export interface ShipLevelGrowthWeights {
  hull?: number;
  shieldCapacity?: number;
  shieldRegen?: number;
  moveSpeed?: number;
  handling?: number;
  mass?: number;
  primaryDamage?: number;
  primaryFireRate?: number;
  projectileSpeed?: number;
  projectileSize?: number;
  ramDamage?: number;
  pickupRange?: number;
  luck?: number;
}

export interface ShipRegistryEntry extends ContentRegistryEntry {
  id: ShipId;
  displayName: string;
  selectable: boolean;
  description: string;
  role: string;
  display: ShipDisplayDefinition;
  levelGrowthWeights?: ShipLevelGrowthWeights;
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
    overspeedDamping: number;
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
    display: {
      roleTitle: 'Agile Ranged Striker',
      shortDescription: 'Fast, responsive, and tuned for evasive Pulse Cannon runs.',
      tags: ['Ranged', 'Agile', 'Projectile', 'Beginner Friendly'],
      statRatings: {
        hull: 4,
        speed: 9,
        handling: 8,
        mass: 3,
        primaryDamage: 6,
        fireRate: 7,
        pickupRange: 5
      },
      exampleUpgradeIds: ['Multishot', 'Pierce', 'Rapid Fire', 'Explosive Pulse'],
      masteryPreview: [
        { level: 5, label: 'Pulse Cannon starts stronger' },
        { level: 10, label: 'Improved projectile upgrade choices' },
        { level: 15, label: 'Faster primary weapon scaling' },
        { level: 20, label: 'Interceptor mastery bonus coming soon' }
      ]
    },
    levelGrowthWeights: {
      moveSpeed: 1,
      handling: 1,
      primaryDamage: 0.9,
      primaryFireRate: 0.85,
      projectileSpeed: 0.75,
      projectileSize: 0.45,
      pickupRange: 0.35
    },
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
    display: {
      roleTitle: 'Heavy Impact Defender',
      shortDescription: 'Tough shielded hull built for committed rams and close-range impact control.',
      tags: ['Melee', 'Heavy', 'Shield', 'High Risk'],
      statRatings: {
        hull: 9,
        shield: 8,
        speed: 5,
        handling: 3,
        mass: 9,
        ramDamage: 8,
        shieldRegen: 7,
        pickupRange: 4
      },
      exampleUpgradeIds: ['Shield Capacity', 'Ram Damage', 'Impact Radius', 'Shockwave Ram'],
      masteryPreview: [
        { level: 5, label: 'Shield capacity improves' },
        { level: 10, label: 'Shield regen improves' },
        { level: 15, label: 'Ram impact scaling improves' },
        { level: 20, label: 'Bulwark mastery bonus coming soon' }
      ]
    },
    levelGrowthWeights: {
      hull: 1,
      shieldCapacity: 1,
      shieldRegen: 0.85,
      mass: 0.9,
      ramDamage: 1,
      handling: 0.35,
      pickupRange: 0.25
    },
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
      overspeedDamping: 2.2,
      maxSpeed: Math.round(interceptorMovement.maxSpeed * 0.85)
    }
  }
];

export function getShipDefinition(shipId: ShipId): ShipRegistryEntry {
  return shipRegistry.find((ship) => ship.id === shipId) ?? shipRegistry[0];
}

export function getShipDisplayStats(ship: ShipRegistryEntry): ShipDisplayStatRatings {
  return ship.display.statRatings;
}
