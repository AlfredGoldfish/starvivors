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
  velocity?: number;
  acceleration?: number;
  control?: number;
  tractorField?: number;
  fuel?: number;
}

export const SHIP_HULL_HP_CAP = 9999;
export const SHIP_STAT_CAP = 255;
export const SHIP_VELOCITY_CAP_PX_PER_SECOND = 700;
export const SHIP_ACCELERATION_CAP_PX_PER_SECOND_SQUARED = 1200;
export const SHIP_CONTROL_ROTATION_CAP = 5;
export const SHIP_TRACTOR_FIELD_CAP_RADIUS = 180;
export const SHIP_STARTING_FUEL_STAT = 58;

export interface ShipMasteryPreviewDefinition {
  level: number;
  label: string;
}

export interface ShipDisplayDefinition {
  roleTitle: string;
  shortDescription: string;
  tags: string[];
  statRatings: ShipDisplayStatRatings;
  fantasy?: string;
  passiveTitle?: string;
  passiveDescription?: string;
  strengths?: string[];
  weaknesses?: string[];
  exampleUpgradeIds?: string[];
  masteryPreview?: ShipMasteryPreviewDefinition[];
}

export interface ShipSkinDefinition {
  id: string;
  displayName: string;
  tint?: number;
  unlockedByDefault?: boolean;
}

export interface ShipLevelGrowthWeights {
  hull?: number;
  moveSpeed?: number;
  acceleration?: number;
  control?: number;
  tractorField?: number;
  fuel?: number;
  luck?: number;
}

export interface ShipRegistryEntry extends ContentRegistryEntry {
  id: ShipId;
  displayName: string;
  selectable: boolean;
  description: string;
  role: string;
  display: ShipDisplayDefinition;
  skins?: ShipSkinDefinition[];
  levelGrowthWeights?: ShipLevelGrowthWeights;
  baseStats: PlayerBaseStats;
  hitRadius: number;
  movementNotes: string;
  startingWeaponNotes: string;
  startingPrimaryWeaponId: WeaponId | null;
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
      fantasy: 'Fast precision striker',
      passiveTitle: 'Vector Tuning',
      passiveDescription: 'Starts with crisp control thrusters and strong pickup utility.',
      strengths: ['High velocity', 'Responsive control', 'Reliable manual fire'],
      weaknesses: ['Fragile hull', 'Lower fuel margin', 'Mistakes are costly'],
      tags: ['Ranged', 'Agile', 'Projectile', 'Beginner Friendly'],
      statRatings: {
        hull: 40,
        velocity: 182,
        acceleration: 119,
        control: 210,
        tractorField: 65,
        fuel: SHIP_STARTING_FUEL_STAT
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
      acceleration: 1,
      control: 1,
      tractorField: 0.35,
      fuel: 0.35
    },
    baseStats: {
      ...DEFAULT_PLAYER_BASE_STATS,
      maxHull: 40,
      moveSpeed: interceptorMovement.maxSpeed,
      thrust: interceptorMovement.thrustAcceleration,
      brake: interceptorMovement.reverseThrustAcceleration,
      strafe: interceptorMovement.strafeThrustAcceleration
    },
    hitRadius: 32,
    movementNotes: 'Fast thrust, responsive strafing, light hull.',
    startingWeaponNotes: `${pulseCannon.displayName} primary starter`,
    startingPrimaryWeaponId: pulseCannon.id,
    startingSecondaryWeaponId: null,
    skins: [
      { id: 'interceptor-cyan', displayName: 'Cyan', unlockedByDefault: true },
      { id: 'interceptor-amber', displayName: 'Amber', tint: 0xffc857, unlockedByDefault: true },
      { id: 'interceptor-ghost', displayName: 'Ghost', tint: 0xd6f7ff }
    ],
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
    description: 'Heavy ramming ship. Tough hull, slower control, and a forward Ramming Shield.',
    role: 'Heavy rammer',
    display: {
      roleTitle: 'Heavy Impact Defender',
      shortDescription: 'Tough shielded hull built for committed rams and close-range impact control.',
      fantasy: 'Heavy shield rammer',
      passiveTitle: 'Impact Bracing',
      passiveDescription: 'Carries shield charge support for committed close-range hits.',
      strengths: ['High hull', 'Shield pressure', 'Ramming control'],
      weaknesses: ['Slow control', 'Wide target', 'Risky recovery'],
      tags: ['Melee', 'Heavy', 'Shield', 'High Risk'],
      statRatings: {
        hull: 95,
        velocity: 155,
        acceleration: 42,
        control: 45,
        tractorField: 58,
        fuel: SHIP_STARTING_FUEL_STAT
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
      acceleration: 0.35,
      control: 0.35,
      tractorField: 0.25,
      fuel: 0.85
    },
    baseStats: {
      ...DEFAULT_PLAYER_BASE_STATS,
      maxHull: 95,
      moveSpeed: Math.round(interceptorMovement.maxSpeed * 0.85),
      thrust: Math.round(interceptorMovement.thrustAcceleration * 0.35),
      brake: Math.round(interceptorMovement.reverseThrustAcceleration * 0.45),
      strafe: Math.round(interceptorMovement.strafeThrustAcceleration * 0.3)
    },
    hitRadius: 35,
    movementNotes: 'Lower thrust response, lower top speed, stronger hull margin.',
    startingWeaponNotes: `${rammingShield.displayName} primary starter`,
    startingPrimaryWeaponId: rammingShield.id,
    startingSecondaryWeaponId: null,
    skins: [
      { id: 'bulwark-teal', displayName: 'Teal', unlockedByDefault: true },
      { id: 'bulwark-red', displayName: 'Redline', tint: 0xff5964, unlockedByDefault: true },
      { id: 'bulwark-gold', displayName: 'Gold', tint: 0xffc857 }
    ],
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
      lowFrictionDamping: 0.995,
      overspeedDamping: 2.2,
      maxSpeed: Math.round(interceptorMovement.maxSpeed * 0.85)
    }
  }
];

export function getShipDefinition(shipId: ShipId): ShipRegistryEntry {
  return shipRegistry.find((ship) => ship.id === shipId) ?? shipRegistry[0];
}

export function getShipDisplayStats(ship: ShipRegistryEntry): ShipDisplayStatRatings {
  return {
    hull: Math.round(ship.baseStats.maxHull),
    velocity: normalizeShipStat(ship.movement.maxSpeed, SHIP_VELOCITY_CAP_PX_PER_SECOND),
    acceleration: normalizeShipStat(ship.movement.thrustAcceleration, SHIP_ACCELERATION_CAP_PX_PER_SECOND_SQUARED),
    control: getShipControlStat(ship),
    tractorField: ship.display.statRatings.tractorField ?? normalizeShipStat(46 * ship.baseStats.magnet, SHIP_TRACTOR_FIELD_CAP_RADIUS),
    fuel: ship.display.statRatings.fuel ?? SHIP_STARTING_FUEL_STAT
  };
}

function getShipControlStat(ship: ShipRegistryEntry): number {
  const thrust = Math.max(1, ship.movement.thrustAcceleration);
  const strafeScore = normalizeShipStat(ship.movement.strafeThrustAcceleration / thrust, 1);
  const brakeScore = normalizeShipStat(ship.movement.reverseThrustAcceleration / thrust, 1);
  const turnScore = normalizeShipStat(ship.movement.rotationSpeed, SHIP_CONTROL_ROTATION_CAP);
  const driftCorrectionScore = ship.display.statRatings.control ?? 128;

  return Math.round(
    strafeScore * 0.35 +
      brakeScore * 0.3 +
      turnScore * 0.2 +
      clamp(driftCorrectionScore, 0, SHIP_STAT_CAP) * 0.15
  );
}

function normalizeShipStat(value: number, cap: number): number {
  return Math.round(clamp(value / Math.max(1, cap), 0, 1) * SHIP_STAT_CAP);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
