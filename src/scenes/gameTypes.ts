import Phaser from 'phaser';
import type { PermanentUpgradeId } from '../data/permanentUpgrades';
import type { MissionDefinitionId } from '../data/missions';
import type { ShipId } from '../data/ships';
import type { UpgradeDefinition } from '../data/upgrades';
import type { WeaponId, WeaponSlotType } from '../data/weapons';
import type { EnemyStatProfile } from '../data/enemies';
import type { EnemyLabInstance } from '../systems/enemyLabSpawner';
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
export type GameFlowState = 'splash' | 'command' | 'running' | 'results' | 'shop' | 'shipSelect' | 'settings';
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
  selectedMissionId: MissionDefinitionId;
  selectedMissionName: string;
  missionStatus: string;
  missionObjectiveDistance: number;
  missionObjectiveRadius: number;
  missionObjectiveRegionId: string | null;
  worldEventCount: number;
  activeWorldEventCount: number;
  destroyedWorldEventCount: number;
  firstWorldEventName: string | null;
  firstWorldEventHp: number;
  firstWorldEventMaxHp: number;
  rareEventCount: number;
  activeRareEventCount: number;
  completedRareEventCount: number;
  firstRareEventName: string | null;
  firstRareEventStatus: string | null;
  firstRareEventProgress: number;
  unlockedShipIds: ShipId[];
  rammingShieldHp: number;
  rammingShieldMaxHp: number;
  rammingShieldDashCharges: number;
  rammingShieldDashMaxCharges: number;
  hull: number;
  maxHull: number;
  isPlayerDead: boolean;
  runEndReason: string;
  canContinueRun: boolean;
  isEjectConfirmOpen: boolean;
  sectorScale: number;
  sectorSeed: string;
  sectorRegionCount: number;
  sectorSignalCount: number;
  generatedSectorAsteroidCount: number;
  generatedSectorScrapCount: number;
  activeSectorAsteroidCount: number;
  activeSectorScrapCount: number;
  activeSectorSignalCount: number;
  worldSquadCount: number;
  activeWorldSquadCount: number;
  defeatedWorldSquadCount: number;
  arenaWidth: number;
  arenaHeight: number;
  cameraFollowOffsetX: number;
  cameraFollowOffsetY: number;
  fuel: number;
  maxFuel: number;
  fuelDrainEnabled: boolean;
  fuelDrainMode: string;
  playerXp: number;
  runScrapTotal: number;
  runScrapSpent: number;
  lastRunScrapTotal: number;
  lastRunScrapSpent: number;
  lastRunScrapConverted: number;
  totalCredits: number;
  lastRunCreditsEarned: number;
  hasPaidRunCredits: boolean;
  unlockedRewardHooks: string[];
  lastRunUnlockedRewards: string[];
  radarLevel: number;
  radarStatus: string;
  sectorScannerAvailable: boolean;
  sectorScannerLevel: number;
  sectorScannerProgress: number;
  sectorScannerTargetLabel: string | null;
  sectorScannerShowsArrow: boolean;
  sectorScannerShowsMinimap: boolean;
  rerollsThisRun: number;
  nextRerollCost: number;
  debugRerollCostBase: number;
  upgradeChoiceCount: number;
  nextXpThreshold: number;
  bankedUpgrades: number;
  pendingRareUpgrades: number;
  upgradeOverlayMode: 'normal' | 'rare' | null;
  isUpgradeOverlayOpen: boolean;
  isResultsScreenOpen: boolean;
  isResultsButtonVisible: boolean;
  autoWeaponId: WeaponId | null;
  primaryWeaponId: WeaponId | null;
  secondaryWeaponId: WeaponId | null;
  ownedAutoWeaponIds: WeaponId[];
  ownedManualWeaponIds: WeaponId[];
  beamHeat: number;
  beamOverheated: boolean;
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
  liveEnemies: number;
  activeEnemies: number;
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
  selectMission: (missionId: MissionDefinitionId) => StarvivorsTestHarnessState;
  grantXp: (amount: number) => StarvivorsTestHarnessState;
  damagePlayer: (damage?: number) => StarvivorsTestHarnessState;
  expireInvulnerability: () => StarvivorsTestHarnessState;
  placeEnemyOnPlayer: () => StarvivorsTestHarnessState;
  placeAsteroidOnPlayer: (tier?: AsteroidTier) => StarvivorsTestHarnessState;
  destroyFirstEnemy: () => StarvivorsTestHarnessState;
  destroyFirstAsteroid: () => StarvivorsTestHarnessState;
  destroyFirstWorldEvent: () => StarvivorsTestHarnessState;
  collectAllScrap: () => StarvivorsTestHarnessState;
  killPlayer: () => StarvivorsTestHarnessState;
  requestEject: () => StarvivorsTestHarnessState;
  cancelEject: () => StarvivorsTestHarnessState;
  confirmEject: () => StarvivorsTestHarnessState;
  continueRun: () => StarvivorsTestHarnessState;
  refillFuel: () => StarvivorsTestHarnessState;
  emptyFuel: () => StarvivorsTestHarnessState;
  toggleFuelDrain: () => StarvivorsTestHarnessState;
  toggleFuelDrainMode: () => StarvivorsTestHarnessState;
  resetProgression: () => StarvivorsTestHarnessState;
  unlockRewardHook: (hook: string) => StarvivorsTestHarnessState;
  purchaseRadarUpgrade: () => StarvivorsTestHarnessState;
  purchaseSectorScanner: () => StarvivorsTestHarnessState;
  fastForwardScanner: () => StarvivorsTestHarnessState;
  addRunScrap: (amount: number) => StarvivorsTestHarnessState;
  rerollUpgrades: () => StarvivorsTestHarnessState;
  toggleRerollDebugCost: () => StarvivorsTestHarnessState;
  restartRun: () => StarvivorsTestHarnessState;
  openUpgradeOverlay: () => StarvivorsTestHarnessState;
  closeUpgradeOverlay: () => StarvivorsTestHarnessState;
  selectPulseUpgrade: (choiceNumber: number) => StarvivorsTestHarnessState;
  assignWeaponSlot: (slot: WeaponSlotType, weaponId: WeaponId) => StarvivorsTestHarnessState;
  clickUpgradeButton: () => StarvivorsTestHarnessState;
  clickRareUpgradeButton: () => StarvivorsTestHarnessState;
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
  enemy: BasicEnemy | ShooterEnemy | TankEnemy | EnemyLabInstance;
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
