import Phaser from 'phaser';
import type { PermanentUpgradeId } from '../data/permanentUpgrades';
import type { ShipId } from '../data/ships';
import type { UpgradeDefinition } from '../data/upgrades';
import type { WeaponId } from '../data/weapons';
import type { EnemyStatProfile } from '../data/enemies';
import type { BlackHoleCapturedProjectileState } from '../systems/blackHole';

export interface SavedBlackHolePngLayer {
  image: unknown;
  speedRps: unknown;
  size: unknown;
  alpha: unknown;
  enabled: unknown;
  initialRotation?: unknown;
}

export interface SavedBlackHolePngSetup {
  fieldScale?: unknown;
  visualScale?: unknown;
  coreScale?: unknown;
  allLayersEnabled?: unknown;
  addImage?: unknown;
  selectedLayerIndex?: unknown;
  layers?: unknown;
}

export interface SavedBlackHoleFieldTuningPreset {
  influenceRadiusScale?: unknown;
  damageRadiusScale?: unknown;
  coreScale?: unknown;
  radialStrengthMultiplier?: unknown;
  radialCurve?: unknown;
  swirlStrengthMultiplier?: unknown;
  swirlCurve?: unknown;
  massResistanceMultiplier?: unknown;
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

export type AsteroidTier = 1 | 2 | 3 | 4 | 5;
export type AsteroidBreakupProfileMode = 'many-small' | 'balanced' | 'few-large' | 'single-tier';
export type EnemySpawnType = 'chaser' | 'shooter' | 'tank';
export type ScrapSourceType = 'enemy' | 'debris' | 'asteroid';
export type GameFlowState = 'mainMenu' | 'running' | 'results' | 'shop' | 'shipSelect';
export type ShopBackTarget = 'mainMenu' | 'results';
export type DamageFeedbackSource = 'player' | 'enemy' | 'asteroid' | 'debris' | 'blackHole' | 'shield' | 'environment';

export interface SecondaryWeaponChoice {
  category: 'secondary-weapon';
  weaponId: WeaponId;
  name: string;
  description: string;
}

export type UpgradeOverlayChoice = UpgradeDefinition | SecondaryWeaponChoice;

export interface StarvivorsTestHarnessState {
  selectedShipId: ShipId;
  selectedShipName: string;
  unlockedShipIds: ShipId[];
  rammingShieldHp: number;
  rammingShieldMaxHp: number;
  rammingShieldDashCharges: number;
  rammingShieldDashMaxCharges: number;
  hull: number;
  maxHull: number;
  isPlayerDead: boolean;
  playerXp: number;
  runScrapTotal: number;
  lastRunScrapTotal: number;
  totalCredits: number;
  lastRunCreditsEarned: number;
  hasPaidRunCredits: boolean;
  nextXpThreshold: number;
  bankedUpgrades: number;
  isUpgradeOverlayOpen: boolean;
  pulseDamageLevel: number;
  pulseFireRateLevel: number;
  pulseVelocityLevel: number;
  hullPlatingLevel: number;
  engineTuningLevel: number;
  damageControlLevel: number;
  velocityLimiterLevel: number;
  velocityLimiterActiveLevel: number;
  playerVelocityLimit: number;
  playerSpeed: number;
  weaponDamageMultiplier: number;
  pulseCooldownMs: number;
  pulseProjectileSpeed: number;
  playerAccelerationMultiplier: number;
  playerMaxSpeed: number;
  playerInvulnerabilityMs: number;
  isMinimapVisible: boolean;
  enemies: number;
  shooterEnemies: number;
  tankEnemies: number;
  asteroids: number;
  scrapPickups: number;
  projectiles: number;
  enemyProjectiles: number;
}

export interface StarvivorsTestHarness {
  getState: () => StarvivorsTestHarnessState;
  addCredits: (amount: number) => StarvivorsTestHarnessState;
  purchasePermanentUpgrade: (upgradeId: PermanentUpgradeId) => StarvivorsTestHarnessState;
  adjustActivePermanentUpgrade: (upgradeId: PermanentUpgradeId, delta: number) => StarvivorsTestHarnessState;
  unlockShip: (shipId: ShipId) => StarvivorsTestHarnessState;
  selectShip: (shipId: ShipId) => StarvivorsTestHarnessState;
  grantXp: (amount: number) => StarvivorsTestHarnessState;
  damagePlayer: (damage?: number) => StarvivorsTestHarnessState;
  expireInvulnerability: () => StarvivorsTestHarnessState;
  placeEnemyOnPlayer: () => StarvivorsTestHarnessState;
  placeAsteroidOnPlayer: (tier?: AsteroidTier) => StarvivorsTestHarnessState;
  destroyFirstEnemy: () => StarvivorsTestHarnessState;
  destroyFirstAsteroid: () => StarvivorsTestHarnessState;
  killPlayer: () => StarvivorsTestHarnessState;
  restartRun: () => StarvivorsTestHarnessState;
  openUpgradeOverlay: () => StarvivorsTestHarnessState;
  closeUpgradeOverlay: () => StarvivorsTestHarnessState;
  selectPulseUpgrade: (choiceNumber: number) => StarvivorsTestHarnessState;
  clickUpgradeButton: () => StarvivorsTestHarnessState;
  toggleMinimap: () => StarvivorsTestHarnessState;
}

declare global {
  interface Window {
    starvivorsTestHarness?: StarvivorsTestHarness;
  }
}

export interface AsteroidTierConfig {
  displaySize: number;
  hitRadius: number;
  hp: number;
  massBudget: number;
  minSpeed: number;
  maxSpeed: number;
  impactImpulse: number;
  maxVelocity: number;
}

export interface PlayerProjectile extends BlackHoleCapturedProjectileState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  hitRadius: number;
  pierceRemaining: number;
  piercedTargets: WeakSet<object>;
  expiresAt: number;
  distanceRemaining: number;
  nextTrailAt: number;
  trailColor: number;
}

export interface EnemyProjectile extends BlackHoleCapturedProjectileState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  hitRadius: number;
  expiresAt: number;
  distanceRemaining: number;
}

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
  variant: string;
  tier: AsteroidTier;
  hp: number;
  breakupProfile: AsteroidBreakupProfile;
  velocity: Phaser.Math.Vector2;
  rotationSpeed: number;
  hitRadius: number;
  nextBlackHoleDamageAt: number;
}

export interface EnemyWreckageDebris {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  mass: number;
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
  value: number;
  mass: number;
  source: ScrapSourceType;
  pickupRadius: number;
  expiresAt: number;
  rotationSpeed: number;
  bobPhase: number;
}

export interface AsteroidBreakupProfile {
  mode: AsteroidBreakupProfileMode;
  preferredTier?: AsteroidTier;
  burstMultiplier: number;
  spreadMultiplier: number;
}

export interface PlayerEnemyContact {
  enemy: BasicEnemy | ShooterEnemy | TankEnemy;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  mass: number;
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
