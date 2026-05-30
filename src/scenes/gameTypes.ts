import Phaser from 'phaser';
import type { UpgradeDefinition } from '../data/upgrades';
import type { WeaponId } from '../data/weapons';
import type { EnemyStatProfile } from '../data/enemies';
import type { ObjectSizeProfile } from '../data/objectSizeProfile';
import type { EnemyInstance } from '../systems/enemySpawner';
import type { RuntimeProjectile, ProjectileSplashPayload, ProjectileStatusPayload } from '../systems/projectiles';
import type { ResolvedProjectileEffectStats } from '../systems/weaponStats';

export interface SavedBlackHoleFieldTuningPreset {
  influenceRadiusScale?: unknown;
  damageRadiusScale?: unknown;
  coreScale?: unknown;
  radialStrengthMultiplier?: unknown;
  radialCurve?: unknown;
  swirlStrengthMultiplier?: unknown;
  swirlCurve?: unknown;
  maxVelocityMultiplier?: unknown;
  viscosityStrength?: unknown;
  viscosityCurve?: unknown;
  innerDrag?: unknown;
  playerResistance?: unknown;
}

export interface SavedDebugShipLoadout {
  type?: unknown;
  schemaVersion?: unknown;
  shipId?: unknown;
  displayName?: unknown;
  overrides?: unknown;
}

export interface SavedDebugWeaponLoadout {
  type?: unknown;
  schemaVersion?: unknown;
  weaponId?: unknown;
  displayName?: unknown;
  overrides?: unknown;
}

export type AsteroidTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type AsteroidBreakupProfileMode = 'many-small' | 'balanced' | 'few-large' | 'single-tier';
export type AsteroidBreakupMotionMode = 'crumble' | 'shear' | 'split' | 'burst';
export type EnemySpawnType = 'chaser' | 'shooter' | 'tank';
export type ScrapSourceType = 'enemy' | 'debris' | 'asteroid';
export type PlayerPickupKind = 'scrap' | 'banked-upgrade' | 'special-upgrade';
export type GameFlowState = 'command' | 'running' | 'results' | 'shop' | 'shipSelect' | 'settings';
export type ShopBackTarget = 'mainMenu' | 'results';
export type ResultsPanelTab = 'start' | 'debrief' | 'command' | 'hangar' | 'shop' | 'settings';
export type DamageFeedbackSource = 'player' | 'enemy' | 'asteroid' | 'debris' | 'blackHole' | 'shield' | 'environment';

export interface SecondaryWeaponChoice {
  category: 'secondary-weapon';
  weaponId: WeaponId;
  name: string;
  description: string;
}

export type UpgradeOverlayChoice = UpgradeDefinition | SecondaryWeaponChoice;

export interface AsteroidTierConfig {
  displaySize: number;
  hitRadius: number;
  hp: number;
  minSpeed: number;
  maxSpeed: number;
  impactImpulse: number;
  maxVelocity: number;
}

export interface PlayerProjectile extends RuntimeProjectile {
  bouncesRemaining: number;
  piercedTargets: WeakSet<object>;
  nextTrailAt: number;
  trailColor: number;
  effects: ResolvedProjectileEffectStats;
  isOverloaded: boolean;
  isEmergencyEmpowered: boolean;
  splash?: ProjectileSplashPayload;
  statuses?: ProjectileStatusPayload[];
}

export interface EnemyProjectile extends RuntimeProjectile {}

export interface BasicEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  stats: EnemyStatProfile;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  blackHoleVelocity: Phaser.Math.Vector2;
  hp: number;
  nextBlackHoleDamageAt: number;
}

export interface ShooterEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  stats: EnemyStatProfile;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  blackHoleVelocity: Phaser.Math.Vector2;
  nextFireAt: number;
  hp: number;
  nextBlackHoleDamageAt: number;
}

export interface TankEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  stats: EnemyStatProfile;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  blackHoleVelocity: Phaser.Math.Vector2;
  hp: number;
  nextBlackHoleDamageAt: number;
}

export interface BasicAsteroid {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  sizeProfile: ObjectSizeProfile;
  variant: string;
  tier: AsteroidTier;
  hp: number;
  breakupProfile: AsteroidBreakupProfile;
  velocity: Phaser.Math.Vector2;
  rotationSpeed: number;
  hitRadius: number;
  offscreenSince: number | null;
  collisionInvulnerableUntil: number;
  nextBlackHoleDamageAt: number;
}

export interface EnemyWreckageDebris {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  hp: number;
  damage: number;
  hitRadius: number;
  rotationSpeed: number;
  expiresAt: number;
}

export interface HealthBarFeedback {
  body: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  maxHp: number;
  radius: number;
  revealed: boolean;
}

export interface FloatingDamageText {
  text: Phaser.GameObjects.Text;
  originX: number;
  originY: number;
  ageMs: number;
  lifetimeMs: number;
  riseDistance: number;
  driftX: number;
  startScale: number;
}

export interface ScrapPickup {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  kind: PlayerPickupKind;
  value: number;
  source: ScrapSourceType;
  pickupRadius: number;
  magnetRadius: number;
  isMagnetized: boolean;
  visualScale: number;
  offscreenSince: number | null;
  expiresAt: number;
  rotationSpeed: number;
  bobPhase: number;
}

export interface AsteroidBreakupProfile {
  mode: AsteroidBreakupProfileMode;
  motionMode: AsteroidBreakupMotionMode;
  preferredTier?: AsteroidTier;
  burstMultiplier: number;
  spreadMultiplier: number;
}

export interface PlayerEnemyContact {
  enemy: BasicEnemy | ShooterEnemy | TankEnemy | EnemyInstance;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  hitRammingShield?: boolean;
}

export interface PlayerAsteroidContact {
  asteroid: BasicAsteroid;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  hitRammingShield?: boolean;
}

export interface PlayerDebrisContact {
  debris: EnemyWreckageDebris;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  hitRammingShield?: boolean;
}

export interface RammingShieldCollision {
  normal: Phaser.Math.Vector2;
  penetration: number;
}

export interface HangarStatRow {
  label: string;
  pipValue: number;
  valueLabel: string;
  unitsPerPip: number;
}
