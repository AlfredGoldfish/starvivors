import Phaser from 'phaser';
import asteroidVariant1Url from '../../assets/asteroids/astroid_1.png';
import asteroidVariant2Url from '../../assets/asteroids/astroid_2.png';
import asteroidVariant3Url from '../../assets/asteroids/astroid_3.png';
import asteroidVariant4Url from '../../assets/asteroids/astroid_4.png';
import blackHoleEventHorizonLines1Url from '../../assets/blackhole/blackhole_eventhorizon1.png';
import blackHoleEventHorizonLines2Url from '../../assets/blackhole/blackhole_eventhorizon2.png';
import blackHoleEventHorizonLinesUrl from '../../assets/blackhole/blackhole_eventhorizon3.png';
import blackHoleFullLines1Url from '../../assets/blackhole/blackwhole_full1.png';
import blackHoleFullLines2Url from '../../assets/blackhole/blackhole_full2.png';
import blackHoleFullLinesUrl from '../../assets/blackhole/blackhole_full3.png';
import blackHoleFullLines4Url from '../../assets/blackhole/blackhole_full4.png';
import blackHoleFullLines5Url from '../../assets/blackhole/blackhole_full5.png';
import enemyChaserUrl from '../../assets/ships/enemy_chaser.png';
import enemyShooterUrl from '../../assets/ships/enemy_shooter.png';
import enemyTankUrl from '../../assets/ships/enemy_tank.png';
import enemyWreckageDebrisUrl from '../../assets/scraps_debri/debri.png';
import scrapPickupUrl from '../../assets/scraps_debri/scrap.png';
import bulwarkShipUrl from '../../assets/ships/bulwark.png';
import rammingShieldUrl from '../../assets/ships/ramming shield.png';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize, type ViewportSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { basicEnemy, shooterEnemy, tankEnemy, type EnemyStatProfile } from '../data/enemies';
import { interceptorMovement } from '../data/balance';
import { DEFAULT_SHIP_ID, getShipDefinition, shipRegistry, type ShipId, type ShipRegistryEntry } from '../data/ships';
import {
  INITIAL_PERMANENT_UPGRADE_LEVELS,
  PERMANENT_UPGRADE_DEFINITIONS,
  type PermanentUpgradeDefinition,
  type PermanentUpgradeId
} from '../data/permanentUpgrades';
import {
  DAMAGE_CONTROL_INVULNERABILITY_BONUS_MS,
  DAMAGE_CONTROL_REPAIR,
  HULL_PLATING_MAX_HULL_BONUS,
  HULL_PLATING_REPAIR,
  resolvePlayerStats,
  type PlayerStats
} from '../data/stats';
import {
  INITIAL_PASSIVE_UPGRADE_LEVELS,
  INITIAL_PULSE_UPGRADE_LEVELS,
  UPGRADE_CHOICES,
  type PassiveUpgradeId,
  type PulseUpgradeId,
  type UpgradeDefinition
} from '../data/upgrades';
import { getWeaponDefinition, isProjectileWeapon, type WeaponId, type WeaponRegistryEntry } from '../data/weapons';
import {
  createPlayerWeaponRuntimeState,
  getActiveMainWeaponDefinition,
  getActiveSecondaryWeaponDefinition,
  getPlayerWeaponBaseCooldownMs,
  getPlayerWeaponCooldownMs,
  getPlayerWeaponDamageMultiplier,
  getPlayerWeaponProjectileConfig,
  getPlayerWeaponProjectileSpeed,
  type PlayerWeaponRuntimeState,
  type PlayerWeaponUpgradeState
} from '../systems/playerWeapons';
import {
  activateRammingShieldDash,
  canApplyRammingShieldDamage,
  createRammingShieldRuntimeState,
  damageRammingShield,
  ensureRammingShieldRuntime,
  getRammingShieldCircleCollision as getRammingShieldCircleCollisionResult,
  getRammingShieldCollider as getRammingShieldColliderData,
  getRammingShieldDamage as getRammingShieldDamageValue,
  getRammingShieldStats,
  markRammingShieldDamageApplied,
  updateRammingShieldRuntime,
  type RammingShieldCollider,
  type RammingShieldRuntimeState
} from '../systems/rammingShield';
import {
  BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT,
  BLACK_HOLE_LENSING_ARC_MAX_COUNT,
  BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEY,
  BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS,
  BLACK_HOLE_FULL_TEXTURE_KEY,
  BLACK_HOLE_FULL_TEXTURE_KEYS,
  BLACK_HOLE_PNG_TEXTURE_KEYS,
  BLACK_HOLE_PNG_TEXTURE_LABELS,
  BlackHoleSystem,
  type BlackHoleCapturedProjectileState,
  type BlackHoleFieldTuningConfig,
  type BlackHolePngLayerConfig,
  type BlackHolePngTextureKey,
  type BlackHoleWhirlpoolTuning
} from '../systems/blackHole';
import { DebugState } from '../systems/debug/debugState';
import type { DebugAsteroidTier, DebugEnemyType } from '../systems/debug/debugTypes';
import { DEFAULT_BLACK_HOLE_FIELD_TUNING } from '../systems/worldForces';
import { createDebugMenu, type DebugMenuController } from '../ui/debugMenu';

const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];
const BASIC_ENEMY_TEXTURE_KEY = 'basic-enemy-spaceship-1';
const SHOOTER_ENEMY_TEXTURE_KEY = 'shooter-enemy-spaceship';
const TANK_ENEMY_TEXTURE_KEY = 'tank-enemy-spaceship';
const ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY = 'enemy-wreckage-debris';
const SCRAP_PICKUP_TEXTURE_KEY = 'scrap-pickup';
const PLAYER_SHIP_TEXTURE_KEY = 'player-ship-spaceship-1';
const RAMMING_SHIELD_TEXTURE_KEY = 'ramming-shield';
const ASTEROID_TEXTURES = [
  { key: 'asteroid-variant-1', url: asteroidVariant1Url },
  { key: 'asteroid-variant-2', url: asteroidVariant2Url },
  { key: 'asteroid-variant-3', url: asteroidVariant3Url },
  { key: 'asteroid-variant-4', url: asteroidVariant4Url }
] as const;
const BLACK_HOLE_FULL_TEXTURES = [
  { key: BLACK_HOLE_FULL_TEXTURE_KEYS[0], url: blackHoleFullLines1Url },
  { key: BLACK_HOLE_FULL_TEXTURE_KEYS[1], url: blackHoleFullLines2Url },
  { key: BLACK_HOLE_FULL_TEXTURE_KEY, url: blackHoleFullLinesUrl },
  { key: BLACK_HOLE_FULL_TEXTURE_KEYS[3], url: blackHoleFullLines4Url },
  { key: BLACK_HOLE_FULL_TEXTURE_KEYS[4], url: blackHoleFullLines5Url }
] as const;
const BLACK_HOLE_EVENT_HORIZON_TEXTURES = [
  { key: BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[0], url: blackHoleEventHorizonLines1Url },
  { key: BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[1], url: blackHoleEventHorizonLines2Url },
  { key: BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEY, url: blackHoleEventHorizonLinesUrl }
] as const;

interface SavedBlackHolePngLayer {
  image: unknown;
  speedRps: unknown;
  size: unknown;
  alpha: unknown;
  enabled: unknown;
  initialRotation?: unknown;
}

interface SavedBlackHolePngSetup {
  fieldScale?: unknown;
  visualScale?: unknown;
  coreScale?: unknown;
  allLayersEnabled?: unknown;
  addImage?: unknown;
  selectedLayerIndex?: unknown;
  layers?: unknown;
}

interface SavedBlackHoleFieldTuningPreset {
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

const STARFIELD_FAR_TEXTURE_KEY = 'starvivors-starfield-far-tile';
const STARFIELD_MID_TEXTURE_KEY = 'starvivors-starfield-mid-tile';
const STARFIELD_NEAR_TEXTURE_KEY = 'starvivors-starfield-near-tile';
const BACKGROUND_TILE_SIZE = 1024;
const DEFAULT_STARFIELD_FAR_PARALLAX = 0.25;
const DEFAULT_STARFIELD_MID_PARALLAX = 0.52;
const DEFAULT_STARFIELD_NEAR_PARALLAX = 0.82;
const STARFIELD_PARALLAX_STEP = 0.05;
const STARFIELD_PARALLAX_MIN = 0;
const STARFIELD_PARALLAX_MAX = 2;
const DEBUG_UPDATE_INTERVAL_MS = 150;
const PLAYER_PROJECTILE_MUZZLE_OFFSET = 36;
const PLAYER_PROJECTILE_TRAIL_OFFSET = 11;
const PLAYER_PROJECTILE_TRAIL_FADE_MS = 220;
const PLAYER_PROJECTILE_TRAIL_INTERVAL_MS = 28;
const PLAYER_SHIP_DISPLAY_SIZE = 118;
const PLAYER_SHIP_VISUAL_ROTATION = Math.PI;
const THRUSTER_FADE_MS = 170;
const FORWARD_THRUSTER_INTERVAL_MS = 26;
const SECONDARY_THRUSTER_INTERVAL_MS = 42;
const BASIC_ENEMY_COUNT = 2;
const BASIC_ENEMY_DISPLAY_SIZE = 86;
const BASIC_ENEMY_VISUAL_ROTATION = Math.PI;
const SHOOTER_ENEMY_COUNT = 0;
const SHOOTER_ENEMY_DISPLAY_SIZE = 92;
const SHOOTER_ENEMY_VISUAL_ROTATION = Math.PI;
const SHOOTER_PROJECTILE_HIT_RADIUS = 9;
const TANK_ENEMY_COUNT = 0;
const TANK_ENEMY_DISPLAY_SIZE = 126;
const TANK_ENEMY_VISUAL_ROTATION = Math.PI;
const ENEMY_SPAWN_INITIAL_DELAY_MS = 2500;
const ENEMY_SPAWN_INTERVAL_MS = 5200;
const ENEMY_SPAWN_MIN_INTERVAL_MS = 1800;
const ENEMY_SPAWN_ESCALATION_INTERVAL_MS = 30000;
const ENEMY_SPAWN_SAFE_DISTANCE = 620;
const ENEMY_SPAWN_MAX_ACTIVE_INITIAL = 4;
const ENEMY_SPAWN_MAX_ACTIVE_PER_STEP = 2;
const ENEMY_SPAWN_MAX_ACTIVE_HARD_CAP = 18;
const ENEMY_SPAWN_DOUBLE_SPAWN_STEP = 5;
const BASIC_ASTEROID_COUNT = 9;
const ASTEROID_MIN_ROTATION_SPEED = 0.08;
const ASTEROID_MAX_ROTATION_SPEED = 0.26;
const ASTEROID_SAFE_SPAWN_RADIUS = 520;
const ASTEROID_PARENT_VELOCITY_INHERITANCE = 0.62;
const ASTEROID_FRAGMENT_BURST_MIN_SPEED = 36;
const ASTEROID_FRAGMENT_BURST_MAX_SPEED = 128;
const DAMAGE_FLASH_MS = 90;
const ENEMY_IMPACT_EXPLOSION_MS = 150;
const ASTEROID_IMPACT_EXPLOSION_MS = 180;
const ASTEROID_BREAKUP_FEEDBACK_MS = 360;
const PLAYER_PROJECTILE_HIT_RADIUS = 8;
const PLAYER_MAX_HULL = 100;
const PLAYER_HIT_RADIUS = 32;
const PLAYER_DAMAGE_INVULNERABILITY_MS = 1000;
const PLAYER_DAMAGE_FLASH_MS = 130;
const ENEMY_CONTACT_DAMAGE = basicEnemy.stats.contactDamage;
const BASIC_ENEMY_XP_REWARD = basicEnemy.stats.xpValue;
const INITIAL_XP_THRESHOLD = 100;
const XP_THRESHOLD_GROWTH = 1.2;
const GAMEPLAY_MAX_VELOCITY = 500;
const PLAYER_MASS = 3;
const PLAYER_CONTACT_IMPULSE_COOLDOWN_MS = 140;
const PLAYER_CONTACT_MIN_IMPULSE = 120;
const PLAYER_CONTACT_MAX_IMPULSE = 460;
const PLAYER_CONTACT_RELATIVE_SPEED_SCALE = 0.42;
const PLAYER_CONTACT_SEPARATION_PERCENT = 0.42;
const PLAYER_CONTACT_MAX_SEPARATION = 18;
const PLAYER_REST_SPEED = 2;
const ENEMY_CONTACT_RESTITUTION_SHARE = 0.65;
const ENEMY_KNOCKBACK_DAMPING = 0.88;
const RAMMING_SHIELD_TEXTURE_CROP = { x: 208, y: 250, width: 295, height: 73 };
const RAMMING_SHIELD_COLLIDER_DEPTH = 84;
const DEBUG_ELLIPSE_SEGMENTS = 28;
const DEBUG_GRID_MINOR_SPACING = 240;
const DEBUG_GRID_MAJOR_SPACING = 480;
const HUD_BAR_WIDTH = 360;
const HUD_BAR_HEIGHT = 12;
const HUD_MARGIN = 16;
const HUD_RIGHT_BAR_Y = 174;
const MINIMAP_WIDTH = 220;
const MINIMAP_HEIGHT = 140;
const MINIMAP_MARGIN = 16;
const MINIMAP_PADDING = 8;
const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT = 1;
const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN = 0;
const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX = 4;
const DEBUG_BLACK_HOLE_LENS_DENSITY_MIN = 0;
const DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT = 1;
const DEBUG_BLACK_HOLE_LENS_LENGTH_MIN = 0.5;
const DEBUG_BLACK_HOLE_LENS_LENGTH_MAX = 2;
const DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT = 1;
const DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN = 0;
const DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX = 20;
const DEBUG_BLACK_HOLE_SELECTED_PNG_LAYER_DEFAULT = 32;
const DEBUG_BLACK_HOLE_ADD_PNG_TEXTURE_DEFAULT = BLACK_HOLE_FULL_TEXTURE_KEY;
const DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH = 220;
const DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT = 54;
const DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH = 176;
const DEBUG_BLACK_HOLE_LENS_SLIDER_GAP = 62;
const BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS = 650;
const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_INTERVAL_MS = 900;
const BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_BASE = 0.8;
const BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_EXTRA = 2.2;
const BLACK_HOLE_ENEMY_TIDAL_DAMAGE_BASE = 0.75;
const BLACK_HOLE_ENEMY_TIDAL_DAMAGE_EXTRA = 1.7;
const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_BASE = 0.5;
const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_EXTRA = 5;
const BLACK_HOLE_ENEMY_FIELD_DAMPING = 0.988;
const BLACK_HOLE_PLAYER_FIELD_MASS = 4.8;
const BLACK_HOLE_ZONE_CENTER_EXCLUSION_RATIO = 0.16;

const BLACK_HOLE_ASTEROID_FIELD_MASS_BY_TIER: Record<number, number> = {
  1: 1,
  2: 2.6,
  3: 4.8,
  4: 8.4,
  5: 13
};

const BLACK_HOLE_ASTEROID_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 110,
  radialExtraAcceleration: 1160,
  swirlBaseAcceleration: 95,
  swirlExtraAcceleration: 1020,
  maxSpeed: 620,
  mass: 1,
  massResistance: 0.42
};

const BLACK_HOLE_CHASER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 125,
  radialExtraAcceleration: 1220,
  swirlBaseAcceleration: 105,
  swirlExtraAcceleration: 1080,
  maxSpeed: basicEnemy.stats.blackHoleMaxSpeed,
  mass: basicEnemy.stats.mass,
  massResistance: basicEnemy.stats.blackHoleResistance
};

const BLACK_HOLE_SHOOTER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 115,
  radialExtraAcceleration: 1040,
  swirlBaseAcceleration: 95,
  swirlExtraAcceleration: 920,
  maxSpeed: shooterEnemy.stats.blackHoleMaxSpeed,
  mass: shooterEnemy.stats.mass,
  massResistance: shooterEnemy.stats.blackHoleResistance
};

const BLACK_HOLE_TANK_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 95,
  radialExtraAcceleration: 880,
  swirlBaseAcceleration: 76,
  swirlExtraAcceleration: 720,
  maxSpeed: tankEnemy.stats.blackHoleMaxSpeed,
  mass: tankEnemy.stats.mass,
  massResistance: tankEnemy.stats.blackHoleResistance
};

const BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 72,
  radialExtraAcceleration: 720,
  swirlBaseAcceleration: 64,
  swirlExtraAcceleration: 650,
  maxSpeed: 640,
  mass: BLACK_HOLE_PLAYER_FIELD_MASS,
  massResistance: 0.42
};

const BLACK_HOLE_DEBRIS_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 130,
  radialExtraAcceleration: 1240,
  swirlBaseAcceleration: 112,
  swirlExtraAcceleration: 1120,
  maxSpeed: 620,
  mass: 1,
  massResistance: 0.34
};

const BLACK_HOLE_SCRAP_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 150,
  radialExtraAcceleration: 1380,
  swirlBaseAcceleration: 132,
  swirlExtraAcceleration: 1280,
  maxSpeed: 680,
  mass: 0.55,
  massResistance: 0.28
};

const ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE = 34;
const ENEMY_WRECKAGE_DEBRIS_HIT_RADIUS = 15;
const ENEMY_WRECKAGE_DEBRIS_LIFETIME_MS = 45000;
const ENEMY_WRECKAGE_DEBRIS_MAX_ACTIVE = 90;
const ENEMY_WRECKAGE_DEBRIS_HP = 2;
const ENEMY_WRECKAGE_DEBRIS_CONTACT_DAMAGE = 8;
const ENEMY_WRECKAGE_DEBRIS_MIN_SPEED = 42;
const ENEMY_WRECKAGE_DEBRIS_MAX_SPEED = 156;
const ENEMY_WRECKAGE_DEBRIS_INHERITED_VELOCITY = 0.38;
const ENEMY_WRECKAGE_DEBRIS_MIN_ROTATION_SPEED = 0.7;
const ENEMY_WRECKAGE_DEBRIS_MAX_ROTATION_SPEED = 2.5;
const ENEMY_WRECKAGE_DEBRIS_COUNT_BY_ENEMY: Record<EnemySpawnType, number> = {
  chaser: 2,
  shooter: 3,
  tank: 6
};
const ENEMY_WRECKAGE_DEBRIS_MASS_BY_ENEMY: Record<EnemySpawnType, number> = {
  chaser: 0.75,
  shooter: 1.05,
  tank: 1.75
};

const SCRAP_PICKUP_DISPLAY_SIZE = 24;
const SCRAP_PICKUP_RADIUS = 18;
const SCRAP_PICKUP_COLLECT_RADIUS = 46;
const SCRAP_PICKUP_LIFETIME_MS = 60000;
const SCRAP_PICKUP_MAX_ACTIVE = 160;
const SCRAP_PICKUP_MASS = 0.55;
const SCRAP_PICKUP_MIN_SPEED = 24;
const SCRAP_PICKUP_MAX_SPEED = 100;
const SCRAP_PICKUP_INHERITED_VELOCITY = 0.25;
const SCRAP_PICKUP_DEBUG_VALUE = 10;
const SCRAP_TO_CREDIT_RATE = 1;
const SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER: Record<AsteroidTier, number> = {
  1: 1,
  2: 3,
  3: 6,
  4: 10,
  5: 16
};
const SCRAP_PICKUP_VALUE_FROM_DEBRIS = 2;

type AsteroidTier = 1 | 2 | 3 | 4 | 5;
type AsteroidBreakupProfileMode = 'many-small' | 'balanced' | 'few-large' | 'single-tier';
type EnemySpawnType = 'chaser' | 'shooter' | 'tank';
type ScrapSourceType = 'enemy' | 'debris' | 'asteroid';
type GameFlowState = 'mainMenu' | 'running' | 'results' | 'shop' | 'shipSelect';
type ShopBackTarget = 'mainMenu' | 'results';

interface SecondaryWeaponChoice {
  category: 'secondary-weapon';
  weaponId: WeaponId;
  name: string;
  description: string;
}

type UpgradeOverlayChoice = UpgradeDefinition | SecondaryWeaponChoice;

const ENEMY_SPAWN_WEIGHTS_BY_STEP: Array<Record<EnemySpawnType, number>> = [
  { chaser: 100, shooter: 0, tank: 0 },
  { chaser: 92, shooter: 8, tank: 0 },
  { chaser: 78, shooter: 22, tank: 0 },
  { chaser: 66, shooter: 28, tank: 6 },
  { chaser: 58, shooter: 34, tank: 8 },
  { chaser: 52, shooter: 38, tank: 10 }
];

const ASTEROID_CONTACT_DAMAGE_BY_TIER: Record<AsteroidTier, number> = {
  1: 8,
  2: 12,
  3: 16,
  4: 22,
  5: 28
};

const ASTEROID_XP_REWARD_BY_TIER: Record<AsteroidTier, number> = {
  1: 4,
  2: 8,
  3: 14,
  4: 24,
  5: 40
};

interface StarvivorsTestHarnessState {
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

interface StarvivorsTestHarness {
  getState: () => StarvivorsTestHarnessState;
  addCredits: (amount: number) => StarvivorsTestHarnessState;
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

interface AsteroidTierConfig {
  displaySize: number;
  hitRadius: number;
  hp: number;
  massBudget: number;
  minSpeed: number;
  maxSpeed: number;
  impactImpulse: number;
  maxVelocity: number;
}

// Temporary asteroid HP for damage-feedback visibility; revisit during balance/polish.
const ASTEROID_TIER_CONFIG: Record<AsteroidTier, AsteroidTierConfig> = {
  1: {
    displaySize: 52,
    hitRadius: 20,
    hp: 2,
    massBudget: 1,
    minSpeed: 92,
    maxSpeed: 160,
    impactImpulse: 94,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  2: {
    displaySize: 76,
    hitRadius: 30,
    hp: 4,
    massBudget: 4,
    minSpeed: 76,
    maxSpeed: 138,
    impactImpulse: 78,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  3: {
    displaySize: 108,
    hitRadius: 42,
    hp: 6,
    massBudget: 8,
    minSpeed: 54,
    maxSpeed: 112,
    impactImpulse: 58,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  4: {
    displaySize: 154,
    hitRadius: 58,
    hp: 9,
    massBudget: 16,
    minSpeed: 34,
    maxSpeed: 78,
    impactImpulse: 36,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  5: {
    displaySize: 196,
    hitRadius: 74,
    hp: 13,
    massBudget: 32,
    minSpeed: 22,
    maxSpeed: 56,
    impactImpulse: 24,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  }
};

const ASTEROID_TIERS: AsteroidTier[] = [1, 2, 3, 4, 5];
const INITIAL_ASTEROID_TIERS: AsteroidTier[] = [5, 5, 4, 4, 4, 3, 3, 2, 2, 1];

interface PlayerProjectile extends BlackHoleCapturedProjectileState {
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

interface EnemyProjectile extends BlackHoleCapturedProjectileState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  hitRadius: number;
  expiresAt: number;
  distanceRemaining: number;
}

interface BasicEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  stats: EnemyStatProfile;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  blackHoleVelocity: Phaser.Math.Vector2;
  hp: number;
  nextBlackHoleDamageAt: number;
}

interface ShooterEnemy {
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

interface TankEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  stats: EnemyStatProfile;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  blackHoleVelocity: Phaser.Math.Vector2;
  hp: number;
  nextBlackHoleDamageAt: number;
}

interface BasicAsteroid {
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

interface EnemyWreckageDebris {
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

interface ScrapPickup {
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

interface AsteroidBreakupProfile {
  mode: AsteroidBreakupProfileMode;
  preferredTier?: AsteroidTier;
  burstMultiplier: number;
  spreadMultiplier: number;
}

interface PlayerEnemyContact {
  enemy: BasicEnemy | ShooterEnemy | TankEnemy;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  mass: number;
  hitRammingShield?: boolean;
}

interface PlayerAsteroidContact {
  asteroid: BasicAsteroid;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  hitRammingShield?: boolean;
}

interface PlayerDebrisContact {
  debris: EnemyWreckageDebris;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  hitRammingShield?: boolean;
}

interface RammingShieldCollision {
  normal: Phaser.Math.Vector2;
  penetration: number;
}

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private rammingShieldImage?: Phaser.GameObjects.Image;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private debugText!: Phaser.GameObjects.Text;
  private hudGraphics!: Phaser.GameObjects.Graphics;
  private hullText!: Phaser.GameObjects.Text;
  private upgradeButtonContainer!: Phaser.GameObjects.Container;
  private upgradeButtonGraphics!: Phaser.GameObjects.Graphics;
  private upgradeButtonText!: Phaser.GameObjects.Text;
  private blackHoleLensOrbitSliderContainer!: Phaser.GameObjects.Container;
  private blackHoleLensOrbitSliderGraphics!: Phaser.GameObjects.Graphics;
  private blackHoleLensOrbitSliderText!: Phaser.GameObjects.Text;
  private blackHoleLensDensitySliderContainer!: Phaser.GameObjects.Container;
  private blackHoleLensDensitySliderGraphics!: Phaser.GameObjects.Graphics;
  private blackHoleLensDensitySliderText!: Phaser.GameObjects.Text;
  private blackHoleLensLengthSliderContainer!: Phaser.GameObjects.Container;
  private blackHoleLensLengthSliderGraphics!: Phaser.GameObjects.Graphics;
  private blackHoleLensLengthSliderText!: Phaser.GameObjects.Text;
  private blackHoleFieldScaleSliderContainer!: Phaser.GameObjects.Container;
  private blackHoleFieldScaleSliderGraphics!: Phaser.GameObjects.Graphics;
  private blackHoleFieldScaleSliderText!: Phaser.GameObjects.Text;
  private blackHoleProjectionLensToggleContainer!: Phaser.GameObjects.Container;
  private blackHoleProjectionLensToggleGraphics!: Phaser.GameObjects.Graphics;
  private blackHoleProjectionLensToggleText!: Phaser.GameObjects.Text;
  private collisionDebugGraphics!: Phaser.GameObjects.Graphics;
  private mainMenuScreen?: Phaser.GameObjects.Container;
  private mainMenuActionZones: Phaser.GameObjects.Zone[] = [];
  private shipSelectScreen?: Phaser.GameObjects.Container;
  private shipSelectActionZones: Phaser.GameObjects.Zone[] = [];
  private shopScreen?: Phaser.GameObjects.Container;
  private shopActionZones: Phaser.GameObjects.Zone[] = [];
  private shopBackTarget: ShopBackTarget = 'mainMenu';
  private resultsScreen?: Phaser.GameObjects.Container;
  private resultsActionZones: Phaser.GameObjects.Zone[] = [];
  private farStarfield!: Phaser.GameObjects.TileSprite;
  private midStarfield!: Phaser.GameObjects.TileSprite;
  private nearStarfield!: Phaser.GameObjects.TileSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private debugMenuKey!: Phaser.Input.Keyboard.Key;
  private upgradeKey!: Phaser.Input.Keyboard.Key;
  private upgradeChoiceKeys!: Phaser.Input.Keyboard.Key[];
  private upgradeCancelKey!: Phaser.Input.Keyboard.Key;
  private minimapKey!: Phaser.Input.Keyboard.Key;
  private playerProjectiles: PlayerProjectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private basicEnemies: BasicEnemy[] = [];
  private shooterEnemies: ShooterEnemy[] = [];
  private tankEnemies: TankEnemy[] = [];
  private basicAsteroids: BasicAsteroid[] = [];
  private enemyWreckageDebris: EnemyWreckageDebris[] = [];
  private scrapPickups: ScrapPickup[] = [];
  private blackHole?: BlackHoleSystem;
  private gameFlowState: GameFlowState = 'mainMenu';
  private selectedShipId: ShipId = DEFAULT_SHIP_ID;
  private unlockedShipIds = new Set<ShipId>([DEFAULT_SHIP_ID]);
  private playerHull = PLAYER_MAX_HULL;
  private rammingShieldState: RammingShieldRuntimeState = createRammingShieldRuntimeState(false);
  private runScrapTotal = 0;
  private lastRunScrapTotal = 0;
  private totalCredits = 0;
  private lastRunCreditsEarned = 0;
  private hasPaidRunCredits = false;
  private lastRunSurvivalMs = 0;
  private playerInvulnerableUntil = 0;
  private isPlayerDead = false;
  private playerXp = 0;
  private nextXpThreshold = INITIAL_XP_THRESHOLD;
  private bankedUpgrades = 0;
  private asteroidCameraViewCount = 0;
  private asteroidWrappedViewCount = 0;
  private asteroidWrapMirrorCount = 0;
  private playerWeapons: PlayerWeaponRuntimeState = createPlayerWeaponRuntimeState(
    getShipDefinition(DEFAULT_SHIP_ID).startingMainWeaponId
  );
  private hasResolvedSecondaryWeaponChoice = false;
  private nextForwardThrusterAt = 0;
  private nextReverseThrusterAt = 0;
  private nextLeftStrafeThrusterAt = 0;
  private nextRightStrafeThrusterAt = 0;
  private nextDebugUpdateAt = 0;
  private nextPlayerContactImpulseAt = 0;
  private nextBlackHolePlayerDamageAt = 0;
  private nextEnemySpawnAt = 0;
  private runStartedAt = 0;
  private readonly debugState = new DebugState();
  private pulseUpgradeLevels: Record<PulseUpgradeId, number> = { ...INITIAL_PULSE_UPGRADE_LEVELS };
  private passiveUpgradeLevels: Record<PassiveUpgradeId, number> = { ...INITIAL_PASSIVE_UPGRADE_LEVELS };
  private isUpgradeOverlayOpen = false;
  private upgradeOverlayOpenedAt = 0;
  private totalUpgradePauseMs = 0;
  private debugMenu?: DebugMenuController;
  private debugMenuOpenedAt = 0;
  private totalDebugPauseMs = 0;
  private permanentUpgradeLevels: Record<PermanentUpgradeId, number> = { ...INITIAL_PERMANENT_UPGRADE_LEVELS };
  private upgradeOverlayGraphics!: Phaser.GameObjects.Graphics;
  private upgradeOverlayText!: Phaser.GameObjects.Text;
  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private isMinimapVisible = true;
  private farStarfieldParallax = DEFAULT_STARFIELD_FAR_PARALLAX;
  private midStarfieldParallax = DEFAULT_STARFIELD_MID_PARALLAX;
  private nearStarfieldParallax = DEFAULT_STARFIELD_NEAR_PARALLAX;
  private backgroundStarsVisible = true;
  private backgroundScrollX = 0;
  private backgroundScrollY = 0;
  private previousBackgroundPlayerX?: number;
  private previousBackgroundPlayerY?: number;
  private debugBlackHoleLensOrbitSpeedMultiplier = DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT;
  private debugBlackHoleLensDensity = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
  private debugBlackHoleLensLengthMultiplier = DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT;
  private debugBlackHoleInfluenceRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleDamageRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleVisualScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleCoreScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleFieldTuning: BlackHoleFieldTuningConfig = { ...DEFAULT_BLACK_HOLE_FIELD_TUNING };
  private areDebugBlackHoleProjectionLensLayersEnabled = true;
  private debugSelectedBlackHolePngLayerIndex = DEBUG_BLACK_HOLE_SELECTED_PNG_LAYER_DEFAULT;
  private debugAddBlackHolePngTextureKey: BlackHolePngTextureKey = DEBUG_BLACK_HOLE_ADD_PNG_TEXTURE_DEFAULT;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    for (const asteroidTexture of ASTEROID_TEXTURES) {
      this.load.image(asteroidTexture.key, asteroidTexture.url);
    }

    this.load.image(BASIC_ENEMY_TEXTURE_KEY, enemyChaserUrl);
    this.load.image(SHOOTER_ENEMY_TEXTURE_KEY, enemyShooterUrl);
    this.load.image(TANK_ENEMY_TEXTURE_KEY, enemyTankUrl);
    this.load.image(ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY, enemyWreckageDebrisUrl);
    this.load.image(SCRAP_PICKUP_TEXTURE_KEY, scrapPickupUrl);
    this.load.image(PLAYER_SHIP_TEXTURE_KEY, playerShipUrl);
    this.load.image('player-ship-bulwark', bulwarkShipUrl);
    this.load.image(RAMMING_SHIELD_TEXTURE_KEY, rammingShieldUrl);
    for (const blackHoleTexture of BLACK_HOLE_FULL_TEXTURES) {
      this.load.image(blackHoleTexture.key, blackHoleTexture.url);
    }

    for (const blackHoleTexture of BLACK_HOLE_EVENT_HORIZON_TEXTURES) {
      this.load.image(blackHoleTexture.key, blackHoleTexture.url);
    }
  }

  create(): void {
    this.createInput();
    this.createBackgroundTextures();
    this.showMainMenu();
    this.installTestHarness();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(time: number, delta: number): void {
    this.updateDebugMenuInput(time);

    if (this.gameFlowState === 'mainMenu' || this.gameFlowState === 'shop' || this.gameFlowState === 'shipSelect') {
      this.refreshDebugMenu();
      return;
    }

    this.updateUpgradeOverlayInput(time);

    if (this.isUpgradeOverlayOpen) {
      this.refreshDebugMenu();
      this.updateBackgroundTiles(time);
      this.updateGameplayHud(time);
      this.updateMinimap();
      this.updateDebugText(time);
      return;
    }

    if (this.isPlayerDead) {
      this.updatePlayerMovement(time, 0);
      this.updateCollisionDebugOverlay();
      this.updateBackgroundTiles(time);
      this.updateGameplayHud(time);
      this.updateMinimap();
      this.refreshDebugMenu();
      this.updateDebugText(time);
      return;
    }

    const deltaSeconds = delta / 1000;

    if (this.debugState.debugGamePaused) {
      this.updateBlackHole(time, deltaSeconds, false);
    } else {
      this.updatePlayerMovement(time, deltaSeconds);
      this.updateEnemySpawnDirector(time);
      this.updateBasicEnemies(deltaSeconds);
      this.updateShooterEnemies(time, deltaSeconds);
      this.updateTankEnemies(deltaSeconds);
      this.updateBasicAsteroids(deltaSeconds);
      this.updateBlackHole(time, deltaSeconds, true);
      this.updateEnemyWreckageDebris(time, deltaSeconds);
      this.wrapPlayer();
      this.updateScrapPickups(time, deltaSeconds);
      this.updateBlackHolePlayerCollision();
      this.updatePlayerContactDamage(time);
      this.updateRammingShield(time, deltaSeconds);
      this.updateActiveMainWeapon(time);
      this.updatePlayerProjectiles(time, deltaSeconds);
      this.updateEnemyProjectiles(time, deltaSeconds);
      this.updatePlayerDamageVisuals(time);
    }

    this.updateCollisionDebugOverlay();
    this.updateBackgroundTiles(time);
    this.updateGameplayHud(time);
    this.updateMinimap();
    this.refreshDebugMenu();
    this.updateDebugText(time);
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for the STARVIVORS scaffold.');
    }

    this.input.mouse?.disableContextMenu();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as Record<
      'W' | 'A' | 'S' | 'D',
      Phaser.Input.Keyboard.Key
    >;
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.debugMenuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.upgradeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.upgradeChoiceKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX)
    ];
    this.upgradeCancelKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.minimapKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  private createDebugMenu(): void {
    this.debugMenu?.destroy();
    this.debugMenu = createDebugMenu(this, {
      callbacks: {
        close: () => this.closeDebugMenu(this.time.now),
        toggleDebugPause: () => this.runDebugMenuAction(() => this.toggleDebugGamePause(this.time.now)),
        toggleEnemySpawning: () => this.runDebugMenuAction(() => {
          this.debugState.enemySpawningEnabled = !this.debugState.enemySpawningEnabled;
        }),
        spawnEnemy: (type) => this.runDebugMenuAction(() => this.spawnDebugEnemy(type)),
        clearEnemies: () => this.runDebugMenuAction(() => this.clearEnemies()),
        toggleAsteroidSpawning: () => this.runDebugMenuAction(() => {
          this.debugState.asteroidSpawningEnabled = false;
        }),
        spawnAsteroid: (tier) => this.runDebugMenuAction(() => this.spawnDebugAsteroid(tier)),
        clearAsteroids: () => this.runDebugMenuAction(() => this.clearAsteroids()),
        spawnDebris: () => this.runDebugMenuAction(() => this.spawnDebugEnemyWreckageDebris()),
        clearDebris: () => this.runDebugMenuAction(() => this.clearEnemyWreckageDebris()),
        spawnScrap: () => this.runDebugMenuAction(() => this.spawnDebugScrapPickup()),
        clearScrap: () => this.runDebugMenuAction(() => this.clearScrapPickups()),
        addScrap: (amount) => this.runDebugMenuAction(() => this.addRunScrap(amount)),
        addCredits: (amount) => this.runDebugMenuAction(() => this.addDebugCredits(amount)),
        clearPlayerProjectiles: () => this.runDebugMenuAction(() => this.clearPlayerProjectiles()),
        clearEnemyProjectiles: () => this.runDebugMenuAction(() => this.clearEnemyProjectiles()),
        restorePlayerHull: () => this.runDebugMenuAction(() => this.restorePlayerHull()),
        togglePlayerInvulnerability: () => this.runDebugMenuAction(() => {
          this.debugState.playerInvulnerable = !this.debugState.playerInvulnerable;
          if (this.debugState.playerInvulnerable) {
            this.playerInvulnerableUntil = Number.MAX_SAFE_INTEGER;
          } else {
            this.playerInvulnerableUntil = 0;
          }
        }),
        killPlayer: () => this.runDebugMenuAction(() => this.killPlayer()),
        adjustWeaponDamage: (delta) => this.runDebugMenuAction(() => this.debugState.adjustWeaponDamageMultiplier(delta)),
        adjustWeaponFireRate: (delta) => this.runDebugMenuAction(() => this.debugState.adjustWeaponFireRateMultiplier(delta)),
        adjustWeaponCooldownSeconds: (deltaSeconds) =>
          this.runDebugMenuAction(() =>
            this.debugState.adjustWeaponCooldownSeconds(
              this.getActiveMainWeaponBaseCooldownMs() / 1000,
              this.getActiveMainWeaponCooldownMs() / 1000,
              deltaSeconds
            )
          ),
        resetWeaponTuning: () => this.runDebugMenuAction(() => this.debugState.resetWeaponTuning()),
        adjustStarfieldParallax: (layer, direction) => this.runDebugMenuAction(() => this.adjustStarfieldParallax(layer, direction)),
        toggleBackgroundStars: () => this.runDebugMenuAction(() => this.toggleBackgroundStars()),
        resetStarfieldParallax: () => this.runDebugMenuAction(() => this.resetStarfieldParallax()),
        toggleBlackHoleRadii: () => this.runDebugMenuAction(() => {
          this.debugState.showBlackHoleRadii = !this.debugState.showBlackHoleRadii;
        }),
        toggleBlackHoleFieldDamage: () => this.runDebugMenuAction(() => {
          this.debugState.blackHoleFieldDamageEnabled = !this.debugState.blackHoleFieldDamageEnabled;
        }),
        toggleCollisionDebug: () => this.runDebugMenuAction(() => {
          this.debugState.collisionDebugEnabled = !this.debugState.collisionDebugEnabled;
        }),
        adjustBlackHoleLensOrbit: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleLensOrbitSpeed(delta)),
        adjustBlackHoleLensLength: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleLensLength(delta)),
        adjustBlackHoleInfluenceRadius: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleInfluenceRadius(delta)),
        adjustBlackHoleDamageRadius: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleDamageRadius(delta)),
        adjustBlackHoleVisualScale: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleVisualScale(delta)),
        adjustBlackHoleCoreScale: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleCoreScale(delta)),
        adjustBlackHoleRadialStrength: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleRadialStrength(delta)),
        adjustBlackHoleRadialCurve: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleRadialCurve(delta)),
        adjustBlackHoleSwirlStrength: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleSwirlStrength(delta)),
        adjustBlackHoleSwirlCurve: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleSwirlCurve(delta)),
        adjustBlackHoleMassResistance: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleMassResistance(delta)),
        adjustBlackHoleMaxVelocity: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleMaxVelocity(delta)),
        adjustBlackHoleViscosityStrength: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleViscosityStrength(delta)),
        adjustBlackHoleViscosityCurve: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleViscosityCurve(delta)),
        adjustBlackHoleInnerDrag: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleInnerDrag(delta)),
        adjustBlackHolePlayerResistance: (delta) => this.runDebugMenuAction(() => this.adjustBlackHolePlayerResistance(delta)),
        toggleBlackHoleProjectionLenses: () => this.runDebugMenuAction(() => {
          this.areDebugBlackHoleProjectionLensLayersEnabled = !this.areDebugBlackHoleProjectionLensLayersEnabled;
        }),
        selectPreviousBlackHolePngLayer: () => this.runDebugMenuAction(() => this.selectBlackHolePngLayer(-1)),
        selectNextBlackHolePngLayer: () => this.runDebugMenuAction(() => this.selectBlackHolePngLayer(1)),
        cycleBlackHolePngLayerImage: (direction) => this.runDebugMenuAction(() => this.cycleBlackHolePngLayerImage(direction)),
        cycleBlackHoleAddPngLayerImage: (direction) => this.runDebugMenuAction(() => this.cycleBlackHoleAddPngLayerImage(direction)),
        adjustBlackHolePngLayerSpeed: (delta) => this.runDebugMenuAction(() => this.adjustBlackHolePngLayerSpeed(delta)),
        adjustBlackHolePngLayerSize: (delta) => this.runDebugMenuAction(() => this.adjustBlackHolePngLayerSize(delta)),
        adjustBlackHolePngLayerAlpha: (delta) => this.runDebugMenuAction(() => this.adjustBlackHolePngLayerAlpha(delta)),
        toggleBlackHolePngLayer: () => this.runDebugMenuAction(() => this.toggleBlackHolePngLayer()),
        addBlackHolePngLayer: () => this.runDebugMenuAction(() => this.addBlackHolePngLayer()),
        duplicateBlackHolePngLayer: () => this.runDebugMenuAction(() => this.duplicateBlackHolePngLayer()),
        removeBlackHolePngLayer: () => this.runDebugMenuAction(() => this.removeBlackHolePngLayer()),
        saveBlackHolePngSetup: () => this.runDebugMenuAction(() => this.saveBlackHolePngSetup()),
        loadBlackHolePngSetup: () => this.runDebugMenuAction(() => this.loadBlackHolePngSetup()),
        saveBlackHoleFieldTuning: () => this.runDebugMenuAction(() => this.saveBlackHoleFieldTuning()),
        loadBlackHoleFieldTuning: () => this.runDebugMenuAction(() => this.loadBlackHoleFieldTuning()),
        resetBlackHoleLensTuning: () => this.runDebugMenuAction(() => this.resetBlackHoleLensTuning())
      }
    });
    this.refreshDebugMenu();
  }

  private runDebugMenuAction(action: () => void): void {
    action();
    this.refreshDebugMenu();
    this.updateCollisionDebugOverlay();
  }

  private addDebugCredits(amount: number): void {
    const shouldReopenDebugMenu = this.debugMenu?.isOpen() ?? false;
    this.totalCredits = Math.max(0, this.totalCredits + amount);

    if (this.gameFlowState === 'mainMenu') {
      this.showMainMenu();
    } else if (this.gameFlowState === 'shipSelect') {
      this.showShipSelect();
    } else if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
    } else if (this.gameFlowState === 'results') {
      this.showResultsScreen();
    } else {
      this.updateGameplayHud(this.time.now);
    }

    if (shouldReopenDebugMenu) {
      this.openDebugMenu(this.time.now);
    }
  }

  private toggleDebugGamePause(time: number): void {
    this.debugState.debugGamePaused = !this.debugState.debugGamePaused;

    if (this.debugState.debugGamePaused) {
      this.debugMenuOpenedAt = time;
      return;
    }

    const pauseDurationMs = Math.max(0, time - this.debugMenuOpenedAt);
    this.totalDebugPauseMs += pauseDurationMs;
    this.nextEnemySpawnAt += pauseDurationMs;
    this.debugMenuOpenedAt = 0;
  }

  private refreshDebugMenu(): void {
    if (!this.debugMenu) {
      return;
    }

    this.debugMenu.update(this.getDebugMenuValues());
  }

  private getDebugMenuValues() {
    const time = this.time.now;

    return this.debugState.createMenuValues({
      weaponCooldownSeconds: this.getActiveMainWeaponCooldownMs() / 1000,
      backgroundStarsVisible: this.backgroundStarsVisible,
      starfieldFarParallax: this.farStarfieldParallax,
      starfieldMidParallax: this.midStarfieldParallax,
      starfieldNearParallax: this.nearStarfieldParallax,
      blackHoleLensOrbitSpeedMultiplier: this.debugBlackHoleLensOrbitSpeedMultiplier,
      blackHoleLensDensity: this.debugBlackHoleLensDensity,
      blackHoleLensLengthMultiplier: this.debugBlackHoleLensLengthMultiplier,
      blackHoleInfluenceRadiusScale: this.debugBlackHoleInfluenceRadiusScale,
      blackHoleDamageRadiusScale: this.debugBlackHoleDamageRadiusScale,
      blackHoleVisualScale: this.debugBlackHoleVisualScale,
      blackHoleCoreScale: this.debugBlackHoleCoreScale,
      blackHoleRadialStrengthMultiplier: this.debugBlackHoleFieldTuning.radialStrengthMultiplier,
      blackHoleRadialCurve: this.debugBlackHoleFieldTuning.radialCurve,
      blackHoleSwirlStrengthMultiplier: this.debugBlackHoleFieldTuning.swirlStrengthMultiplier,
      blackHoleSwirlCurve: this.debugBlackHoleFieldTuning.swirlCurve,
      blackHoleMassResistanceMultiplier: this.debugBlackHoleFieldTuning.massResistanceMultiplier,
      blackHoleMaxVelocityMultiplier: this.debugBlackHoleFieldTuning.maxVelocityMultiplier,
      blackHoleViscosityStrength: this.debugBlackHoleFieldTuning.viscosityStrength,
      blackHoleViscosityCurve: this.debugBlackHoleFieldTuning.viscosityCurve,
      blackHoleInnerDrag: this.debugBlackHoleFieldTuning.innerDrag,
      blackHolePlayerResistance: this.debugBlackHoleFieldTuning.playerResistance,
      blackHoleProjectionLensLayersEnabled: this.areDebugBlackHoleProjectionLensLayersEnabled,
      blackHoleSelectedPngLayerIndex: this.debugSelectedBlackHolePngLayerIndex,
      blackHolePngLayerCount: this.blackHole?.getPngLayerCount() ?? 0,
      blackHoleSelectedPngLayer: this.blackHole?.getPngLayerSummary(this.debugSelectedBlackHolePngLayerIndex),
      blackHoleAddPngTextureKey: this.debugAddBlackHolePngTextureKey,
      blackHoleAddPngTextureLabel: BLACK_HOLE_PNG_TEXTURE_LABELS[this.debugAddBlackHolePngTextureKey],
      debugGamePaused: this.debugState.debugGamePaused,
      activeEnemies: this.getActiveEnemyCount(),
      activeAsteroids: this.basicAsteroids.length,
      activeDebris: this.enemyWreckageDebris.length,
      activeScrapPickups: this.scrapPickups.length,
      runScrapTotal: this.runScrapTotal,
      totalCredits: this.totalCredits,
      playerProjectiles: this.playerProjectiles.length,
      enemyProjectiles: this.enemyProjectiles.length,
      playerHull: this.playerHull,
      playerMaxHull: this.getPlayerMaxHull(),
      nextEnemySpawnSeconds: Math.max(0, this.nextEnemySpawnAt - time) / 1000
    });
  }

  private installTestHarness(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.starvivorsTestHarness = {
      getState: () => this.getTestHarnessState(),
      addCredits: (amount: number) => {
        this.totalCredits = Math.max(0, this.totalCredits + amount);
        return this.getTestHarnessState();
      },
      unlockShip: (shipId: ShipId) => {
        const ship = getShipDefinition(shipId);

        if (ship.selectable) {
          this.unlockedShipIds.add(ship.id);
        }

        return this.getTestHarnessState();
      },
      selectShip: (shipId: ShipId) => {
        const ship = getShipDefinition(shipId);

        if (this.canStartRunWithShip(ship)) {
          this.selectedShipId = ship.id;
        }

        return this.getTestHarnessState();
      },
      grantXp: (amount: number) => {
        this.grantXp(amount);
        return this.getTestHarnessState();
      },
      damagePlayer: (damage = ENEMY_CONTACT_DAMAGE) => {
        this.damagePlayer(damage, this.time.now);
        return this.getTestHarnessState();
      },
      expireInvulnerability: () => {
        this.playerInvulnerableUntil = 0;
        this.player.setVisible(true);
        this.updateGameplayHud(this.time.now);
        return this.getTestHarnessState();
      },
      placeEnemyOnPlayer: () => {
        const enemy = this.basicEnemies[0];

        if (enemy) {
          enemy.body.setPosition(this.player.x, this.player.y);
          enemy.wrapMirrorBody.setPosition(this.player.x, this.player.y);
          this.playerInvulnerableUntil = 0;
          this.updatePlayerContactDamage(this.time.now);
        }

        return this.getTestHarnessState();
      },
      placeAsteroidOnPlayer: (tier: AsteroidTier = 1) => {
        const asteroid = this.basicAsteroids.find((candidate) => candidate.tier === tier) ?? this.basicAsteroids[0];

        if (asteroid) {
          asteroid.body.setPosition(this.player.x, this.player.y);
          asteroid.wrapMirrorBody.setPosition(this.player.x, this.player.y);
          asteroid.velocity.set(0, 0);
          this.playerInvulnerableUntil = 0;
          this.updatePlayerContactDamage(this.time.now);
        }

        return this.getTestHarnessState();
      },
      destroyFirstEnemy: () => {
        const enemy = this.basicEnemies[0];

        if (enemy && !this.isPlayerDead) {
          enemy.body.destroy(true);
          enemy.wrapMirrorBody.destroy(true);
          this.basicEnemies.splice(0, 1);
          this.grantXp(basicEnemy.stats.xpValue);
        }

        return this.getTestHarnessState();
      },
      destroyFirstAsteroid: () => {
        if (this.basicAsteroids.length > 0 && !this.isPlayerDead) {
          this.destroyBasicAsteroid(0);
        }

        return this.getTestHarnessState();
      },
      killPlayer: () => {
        this.damagePlayer(this.getPlayerMaxHull(), this.time.now, this.player.x, this.player.y, {
          bypassShield: true,
          bypassDefense: true
        });
        return this.getTestHarnessState();
      },
      restartRun: () => {
        this.startRun();
        return this.getTestHarnessState();
      },
      openUpgradeOverlay: () => {
        if (this.bankedUpgrades > 0 && !this.isPlayerDead) {
          this.openUpgradeOverlay(this.time.now);
        }

        return this.getTestHarnessState();
      },
      closeUpgradeOverlay: () => {
        this.closeUpgradeOverlay(this.time.now);
        return this.getTestHarnessState();
      },
      selectPulseUpgrade: (choiceNumber: number) => {
        const choice = this.getUpgradeOverlayChoices()[choiceNumber - 1];

        if (choice) {
          if (!this.isUpgradeOverlayOpen && this.bankedUpgrades > 0 && !this.isPlayerDead) {
            this.openUpgradeOverlay(this.time.now);
          }

          this.selectUpgradeOverlayChoice(choice, this.time.now);
        }

        return this.getTestHarnessState();
      },
      clickUpgradeButton: () => {
        this.handleUpgradeButtonClick();
        return this.getTestHarnessState();
      },
      toggleMinimap: () => {
        this.isMinimapVisible = !this.isMinimapVisible;
        this.updateMinimap();
        return this.getTestHarnessState();
      }
    };

    const query = new URLSearchParams(window.location.search);

    this.debugState.collisionDebugEnabled = query.get('collisionDebug') === '1';

    if (query.get('testHarness') === 'smoke') {
      this.startRun();
      this.runTestHarnessSmoke();
    }

    if (query.get('testHarness') === 'bulwark') {
      this.runTestHarnessBulwark();
    }

    if (query.get('testHarness') === 'rammingShield') {
      this.runTestHarnessRammingShield();
    }

    if (query.get('testHarness') === 'secondaryWeapons') {
      this.runTestHarnessSecondaryWeapons();
    }
  }

  private getTestHarnessState(): StarvivorsTestHarnessState {
    const selectedShip = this.getSelectedShipDefinition();

    return {
      selectedShipId: selectedShip.id,
      selectedShipName: selectedShip.displayName,
      unlockedShipIds: [...this.unlockedShipIds],
      rammingShieldHp: this.rammingShieldState.hp,
      rammingShieldMaxHp: this.getRammingShieldMaxHp(),
      rammingShieldDashCharges: this.rammingShieldState.dashCharges,
      rammingShieldDashMaxCharges: this.hasRammingShield() ? this.getRammingShieldStats().dashMaxCharges : 0,
      hull: this.playerHull,
      maxHull: this.getPlayerMaxHull(),
      isPlayerDead: this.isPlayerDead,
      playerXp: this.playerXp,
      runScrapTotal: this.runScrapTotal,
      lastRunScrapTotal: this.lastRunScrapTotal,
      totalCredits: this.totalCredits,
      lastRunCreditsEarned: this.lastRunCreditsEarned,
      hasPaidRunCredits: this.hasPaidRunCredits,
      nextXpThreshold: this.nextXpThreshold,
      bankedUpgrades: this.bankedUpgrades,
      isUpgradeOverlayOpen: this.isUpgradeOverlayOpen,
      pulseDamageLevel: this.pulseUpgradeLevels['pulse-damage-1'],
      pulseFireRateLevel: this.pulseUpgradeLevels['pulse-fire-rate-1'],
      pulseVelocityLevel: this.pulseUpgradeLevels['pulse-velocity-1'],
      hullPlatingLevel: this.passiveUpgradeLevels['hull-plating'],
      engineTuningLevel: this.passiveUpgradeLevels['engine-tuning'],
      damageControlLevel: this.passiveUpgradeLevels['damage-control'],
      weaponDamageMultiplier: this.getActiveMainWeaponDamageMultiplier(),
      pulseCooldownMs: this.getActiveMainWeaponCooldownMs(),
      pulseProjectileSpeed: this.getActiveMainWeaponProjectileSpeed(),
      playerAccelerationMultiplier: this.getPlayerAccelerationMultiplier(),
      playerMaxSpeed: this.getPlayerMaxSpeed(),
      playerInvulnerabilityMs: this.getPlayerDamageInvulnerabilityMs(),
      isMinimapVisible: this.isMinimapVisible,
      enemies: this.basicEnemies.length,
      shooterEnemies: this.shooterEnemies.length,
      tankEnemies: this.tankEnemies.length,
      asteroids: this.basicAsteroids.length,
      scrapPickups: this.scrapPickups.length,
      projectiles: this.playerProjectiles.length,
      enemyProjectiles: this.enemyProjectiles.length
    };
  }

  private runTestHarnessSmoke(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-harness', 'fail');
      document.body.setAttribute('data-starvivors-harness-details', 'Harness was not installed.');
      return;
    }

    const initial = harness.getState();
    const enemyXp = harness.destroyFirstEnemy();
    const rollover = harness.grantXp(95);
    const multi = harness.grantXp(250);
    const buttonOpened = harness.clickUpgradeButton();
    harness.closeUpgradeOverlay();
    const opened = harness.openUpgradeOverlay();
    const damageUpgrade = harness.selectPulseUpgrade(1);
    const fireRateUpgrade = harness.selectPulseUpgrade(2);
    const rebanked = harness.grantXp(10);
    const velocityUpgrade = harness.selectPulseUpgrade(3);
    const passiveBank = harness.grantXp(900);
    const hullUpgrade = harness.selectPulseUpgrade(4);
    const engineUpgrade = harness.selectPulseUpgrade(5);
    const damageControlUpgrade = harness.selectPulseUpgrade(6);
    const minimapOff = harness.toggleMinimap();
    const minimapOn = harness.toggleMinimap();
    const dead = harness.killPlayer();
    const afterDeadXp = harness.grantXp(1000);
    const restarted = harness.restartRun();
    const pass =
      initial.playerXp === 0 &&
      initial.nextXpThreshold === INITIAL_XP_THRESHOLD &&
      initial.bankedUpgrades === 0 &&
      initial.shooterEnemies === SHOOTER_ENEMY_COUNT &&
      initial.tankEnemies === TANK_ENEMY_COUNT &&
      initial.enemyProjectiles === 0 &&
      enemyXp.playerXp === BASIC_ENEMY_XP_REWARD &&
      rollover.playerXp === 5 &&
      rollover.nextXpThreshold === 120 &&
      rollover.bankedUpgrades === 1 &&
      multi.playerXp === 135 &&
      multi.nextXpThreshold === 144 &&
      multi.bankedUpgrades === 2 &&
      buttonOpened.isUpgradeOverlayOpen &&
      opened.isUpgradeOverlayOpen &&
      damageUpgrade.bankedUpgrades === 1 &&
      !damageUpgrade.isUpgradeOverlayOpen &&
      damageUpgrade.pulseDamageLevel === 1 &&
      damageUpgrade.weaponDamageMultiplier === 1.25 &&
      fireRateUpgrade.bankedUpgrades === 0 &&
      fireRateUpgrade.pulseFireRateLevel === 1 &&
      fireRateUpgrade.pulseCooldownMs === 1100 &&
      rebanked.bankedUpgrades === 1 &&
      velocityUpgrade.bankedUpgrades === 0 &&
      velocityUpgrade.pulseVelocityLevel === 1 &&
      velocityUpgrade.pulseProjectileSpeed === 1176 &&
      passiveBank.bankedUpgrades === 3 &&
      hullUpgrade.bankedUpgrades === 2 &&
      hullUpgrade.hullPlatingLevel === 1 &&
      hullUpgrade.maxHull === PLAYER_MAX_HULL + HULL_PLATING_MAX_HULL_BONUS &&
      hullUpgrade.hull === PLAYER_MAX_HULL + HULL_PLATING_REPAIR &&
      engineUpgrade.bankedUpgrades === 1 &&
      engineUpgrade.engineTuningLevel === 1 &&
      engineUpgrade.playerAccelerationMultiplier === 1.08 &&
      engineUpgrade.playerMaxSpeed === Math.round(interceptorMovement.maxSpeed * 1.04) &&
      damageControlUpgrade.bankedUpgrades === 0 &&
      damageControlUpgrade.damageControlLevel === 1 &&
      damageControlUpgrade.playerInvulnerabilityMs === PLAYER_DAMAGE_INVULNERABILITY_MS + DAMAGE_CONTROL_INVULNERABILITY_BONUS_MS &&
      !minimapOff.isMinimapVisible &&
      minimapOn.isMinimapVisible &&
      dead.isPlayerDead &&
      afterDeadXp.playerXp === damageControlUpgrade.playerXp &&
      afterDeadXp.bankedUpgrades === damageControlUpgrade.bankedUpgrades &&
      restarted.hull === PLAYER_MAX_HULL &&
      restarted.maxHull === PLAYER_MAX_HULL &&
      restarted.playerXp === 0 &&
      restarted.nextXpThreshold === INITIAL_XP_THRESHOLD &&
      restarted.bankedUpgrades === 0 &&
      restarted.shooterEnemies === SHOOTER_ENEMY_COUNT &&
      restarted.tankEnemies === TANK_ENEMY_COUNT &&
      restarted.enemyProjectiles === 0 &&
      restarted.pulseDamageLevel === 0 &&
      restarted.pulseFireRateLevel === 0 &&
      restarted.pulseVelocityLevel === 0 &&
      restarted.hullPlatingLevel === 0 &&
      restarted.engineTuningLevel === 0 &&
      restarted.damageControlLevel === 0 &&
      !restarted.isPlayerDead;

    document.body.setAttribute('data-starvivors-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-harness-details',
      JSON.stringify({
        initial,
        enemyXp,
        rollover,
        multi,
        buttonOpened,
        opened,
        damageUpgrade,
        fireRateUpgrade,
        rebanked,
        velocityUpgrade,
        passiveBank,
        hullUpgrade,
        engineUpgrade,
        damageControlUpgrade,
        minimapOff,
        minimapOn,
        dead,
        afterDeadXp,
        restarted
      })
    );
  }

  private runTestHarnessBulwark(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-bulwark-harness', 'fail');
      document.body.setAttribute('data-starvivors-bulwark-harness-details', 'Harness was not installed.');
      return;
    }

    const locked = harness.selectShip('bulwark');
    harness.addCredits(100);
    const unlocked = harness.unlockShip('bulwark');
    const selected = harness.selectShip('bulwark');
    this.startRun();
    const started = harness.getState();
    const afterXp = harness.grantXp(BASIC_ENEMY_XP_REWARD);
    const afterScrap = harness.getState();
    this.addRunScrap(10);
    const afterScrapGain = harness.getState();
    const restarted = harness.restartRun();
    const pass =
      locked.selectedShipId === DEFAULT_SHIP_ID &&
      unlocked.unlockedShipIds.includes('bulwark') &&
      selected.selectedShipId === 'bulwark' &&
      started.selectedShipId === 'bulwark' &&
      started.hull === 150 &&
      started.maxHull === 150 &&
      started.playerMaxSpeed === 425 &&
      started.playerAccelerationMultiplier === 1 &&
      afterXp.playerXp === BASIC_ENEMY_XP_REWARD &&
      afterScrap.runScrapTotal === 0 &&
      afterScrapGain.runScrapTotal === 10 &&
      restarted.selectedShipId === 'bulwark' &&
      restarted.hull === 150 &&
      restarted.maxHull === 150 &&
      !restarted.isPlayerDead;

    document.body.setAttribute('data-starvivors-bulwark-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-bulwark-harness-details',
      JSON.stringify({
        locked,
        unlocked,
        selected,
        started,
        afterXp,
        afterScrap,
        afterScrapGain,
        restarted
      })
    );
  }

  private runTestHarnessRammingShield(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-shield-harness', 'fail');
      document.body.setAttribute('data-starvivors-shield-harness-details', 'Harness was not installed.');
      return;
    }

    harness.unlockShip('bulwark');
    harness.selectShip('bulwark');
    this.startRun();
    const started = harness.getState();
    const dashVelocityBefore = this.playerVelocity.length();
    this.useRammingShieldWeapon(this.time.now);
    const afterDash = harness.getState();
    const dashVelocityAfter = this.playerVelocity.length();
    const enemy = this.basicEnemies[0];
    const forward = this.getForwardDirection(this.player.rotation);

    if (enemy) {
      const shieldRange = this.getRammingShieldStats().range;
      enemy.body.setPosition(
        wrapCoordinate(this.player.x + forward.x * shieldRange, this.arena.width),
        wrapCoordinate(this.player.y + forward.y * shieldRange, this.arena.height)
      );
      enemy.wrapMirrorBody.setPosition(enemy.body.x, enemy.body.y);
      this.playerVelocity.set(forward.x * 240, forward.y * 240);
      this.playerInvulnerableUntil = 0;
      this.updatePlayerContactDamage(this.time.now);
    }

    const afterShieldHit = harness.getState();
    this.rammingShieldState.hp = 0;
    this.rammingShieldState.targetCooldowns = new WeakMap<object, number>();
    this.playerInvulnerableUntil = 0;
    this.damagePlayer(ENEMY_CONTACT_DAMAGE, this.time.now + this.getRammingShieldStats().contactCooldownMs + 1);

    const afterBrokenHit = harness.getState();
    this.rammingShieldState.hp = 10;
    this.rammingShieldState.nextRegenAt = this.time.now - 1;
    this.updateRammingShield(this.time.now, 1);
    const afterRegen = harness.getState();
    const pass =
      started.selectedShipId === 'bulwark' &&
      started.rammingShieldHp === this.getRammingShieldStats().shieldMaxHp &&
      afterDash.rammingShieldDashCharges === this.getRammingShieldStats().dashMaxCharges - 1 &&
      dashVelocityAfter > dashVelocityBefore &&
      afterShieldHit.rammingShieldHp < this.getRammingShieldStats().shieldMaxHp &&
      afterShieldHit.hull === started.hull &&
      afterBrokenHit.hull < afterShieldHit.hull &&
      afterRegen.rammingShieldHp === 20;

    document.body.setAttribute('data-starvivors-shield-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-shield-harness-details',
      JSON.stringify({
        started,
        afterDash,
        dashVelocityBefore,
        dashVelocityAfter,
        afterShieldHit,
        afterBrokenHit,
        afterRegen
      })
    );
  }

  private runTestHarnessSecondaryWeapons(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-secondary-harness', 'fail');
      document.body.setAttribute('data-starvivors-secondary-harness-details', 'Harness was not installed.');
      return;
    }

    harness.addCredits(100);
    harness.unlockShip('bulwark');
    harness.selectShip('interceptor');
    this.startRun();
    harness.grantXp(INITIAL_XP_THRESHOLD);
    const interceptorChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);
    const interceptorSecondary = harness.selectPulseUpgrade(1);
    const interceptorLaterChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);
    const interceptorRestarted = harness.restartRun();
    harness.grantXp(INITIAL_XP_THRESHOLD);
    const interceptorRestartChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);

    harness.selectShip('bulwark');
    this.startRun();
    harness.grantXp(INITIAL_XP_THRESHOLD);
    const bulwarkChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);
    const bulwarkSecondary = harness.selectPulseUpgrade(1);
    const shotsBefore = this.playerProjectiles.length;
    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();

    if (secondaryWeapon) {
      this.usePlayerWeapon(secondaryWeapon, this.time.now + 1000);
    }

    const shotsAfter = this.playerProjectiles.length;
    const pass =
      interceptorChoices.includes('ramming-shield') &&
      interceptorSecondary.rammingShieldMaxHp === this.getRammingShieldStats().shieldMaxHp &&
      interceptorLaterChoices.length === 0 &&
      interceptorRestarted.rammingShieldMaxHp === 0 &&
      interceptorRestartChoices.includes('ramming-shield') &&
      bulwarkChoices.includes('pulse-cannon') &&
      bulwarkSecondary.rammingShieldMaxHp === this.getRammingShieldStats().shieldMaxHp &&
      secondaryWeapon?.id === 'pulse-cannon' &&
      shotsAfter === shotsBefore + 1;

    document.body.setAttribute('data-starvivors-secondary-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-secondary-harness-details',
      JSON.stringify({
        interceptorChoices,
        interceptorSecondary,
        interceptorLaterChoices,
        interceptorRestarted,
        interceptorRestartChoices,
        bulwarkChoices,
        bulwarkSecondary,
        secondaryWeaponId: secondaryWeapon?.id,
        shotsBefore,
        shotsAfter
      })
    );
  }

  private rebuildWorld(): void {
    this.gameFlowState = 'running';
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.children.removeAll(true);
    this.debugMenu = undefined;
    this.mainMenuScreen = undefined;
    this.mainMenuActionZones = [];
    this.shipSelectScreen = undefined;
    this.shipSelectActionZones = [];
    this.shopScreen = undefined;
    this.shopActionZones = [];
    this.playerWeapons = createPlayerWeaponRuntimeState(this.getSelectedShipDefinition().startingMainWeaponId);
    this.hasResolvedSecondaryWeaponChoice = false;
    this.rammingShieldImage = undefined;
    this.rammingShieldState = createRammingShieldRuntimeState(this.hasRammingShield());
    this.playerVelocity.set(0, 0);
    this.runScrapTotal = 0;
    this.lastRunCreditsEarned = 0;
    this.hasPaidRunCredits = false;
    this.lastRunSurvivalMs = 0;
    this.playerInvulnerableUntil = 0;
    this.isPlayerDead = false;
    this.playerXp = 0;
    this.nextXpThreshold = INITIAL_XP_THRESHOLD;
    this.bankedUpgrades = 0;
    this.resultsScreen = undefined;
    this.resultsActionZones = [];
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.basicEnemies = [];
    this.shooterEnemies = [];
    this.tankEnemies = [];
    this.basicAsteroids = [];
    this.enemyWreckageDebris = [];
    this.scrapPickups = [];
    this.blackHole = undefined;
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;
    this.nextForwardThrusterAt = 0;
    this.nextReverseThrusterAt = 0;
    this.nextLeftStrafeThrusterAt = 0;
    this.nextRightStrafeThrusterAt = 0;
    this.nextDebugUpdateAt = 0;
    this.nextPlayerContactImpulseAt = 0;
    this.nextBlackHolePlayerDamageAt = 0;
    this.runStartedAt = this.time.now;
    this.nextEnemySpawnAt = this.runStartedAt + ENEMY_SPAWN_INITIAL_DELAY_MS;
    this.pulseUpgradeLevels = { ...INITIAL_PULSE_UPGRADE_LEVELS };
    this.passiveUpgradeLevels = { ...INITIAL_PASSIVE_UPGRADE_LEVELS };
    this.playerHull = this.getPlayerMaxHull();
    this.isUpgradeOverlayOpen = false;
    this.upgradeOverlayOpenedAt = 0;
    this.totalUpgradePauseMs = 0;
    this.debugMenuOpenedAt = 0;
    this.totalDebugPauseMs = 0;
    this.isMinimapVisible = true;
    this.debugState.resetForRun();
    this.debugBlackHoleLensOrbitSpeedMultiplier = DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT;
    this.debugBlackHoleLensDensity = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
    this.debugBlackHoleLensLengthMultiplier = DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT;
    this.debugBlackHoleInfluenceRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleDamageRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleVisualScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleCoreScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleFieldTuning = { ...DEFAULT_BLACK_HOLE_FIELD_TUNING };
    this.areDebugBlackHoleProjectionLensLayersEnabled = true;
    this.debugSelectedBlackHolePngLayerIndex = DEBUG_BLACK_HOLE_SELECTED_PNG_LAYER_DEFAULT;
    this.debugAddBlackHolePngTextureKey = DEBUG_BLACK_HOLE_ADD_PNG_TEXTURE_DEFAULT;
    this.backgroundStarsVisible = true;
    this.backgroundScrollX = 0;
    this.backgroundScrollY = 0;
    this.previousBackgroundPlayerX = undefined;
    this.previousBackgroundPlayerY = undefined;

    this.createStarfield();
    this.player = this.createPlayerShip(center.x, center.y);
    this.createBasicEnemies(center);
    this.createShooterEnemies(center);
    this.createTankEnemies(center);
    this.createBasicAsteroids(center);
    this.blackHole = new BlackHoleSystem(this, this.getRandomBlackHoleZoneSpawnPosition(viewport, center));
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.centerOn(center.x, center.y);
    this.resetBackgroundPlayerTracking();

    this.debugText = this.add
      .text(16, 16, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        color: '#c8f7ff',
        backgroundColor: 'rgba(2, 4, 10, 0.72)',
        padding: { x: 10, y: 8 }
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.hudGraphics = this.add.graphics().setScrollFactor(0).setDepth(1000);
    this.minimapGraphics = this.add.graphics().setScrollFactor(0).setDepth(1000);
    this.collisionDebugGraphics = this.add.graphics().setDepth(999);

    this.hullText = this.add
      .text(this.scale.width - HUD_MARGIN, HUD_MARGIN, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#f2fbff',
        backgroundColor: 'rgba(2, 4, 10, 0.72)',
        padding: { x: 10, y: 7 }
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    this.createUpgradeButton();
    this.createUpgradeOverlay();
    this.createBlackHoleLensOrbitSlider();
    this.createBlackHoleLensDensitySlider();
    this.createBlackHoleLensLengthSlider();
    this.createBlackHoleFieldScaleSlider();
    this.createBlackHoleProjectionLensToggle();
    this.createDebugMenu();
    this.updateGameplayHud(this.time.now);
    this.updateMinimap();
    this.updateDebugText(0);
  }

  private startRun(): void {
    const selectedShip = this.getSelectedShipDefinition();

    if (!this.canStartRunWithShip(selectedShip)) {
      this.selectedShipId = DEFAULT_SHIP_ID;
    }

    this.destroyMainMenuScreen();
    this.destroyShipSelectScreen();
    this.destroyShopScreen();
    this.destroyResultsScreen();
    this.rebuildWorld();
  }

  private showMainMenu(): void {
    this.gameFlowState = 'mainMenu';
    this.children.removeAll(true);
    this.debugMenu = undefined;
    this.mainMenuScreen = undefined;
    this.mainMenuActionZones = [];
    this.shopScreen = undefined;
    this.shopActionZones = [];
    this.shipSelectScreen = undefined;
    this.shipSelectActionZones = [];
    this.resultsScreen = undefined;
    this.resultsActionZones = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(width - 48, 520);
    const panelHeight = 374;
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;
    const background = this.add.graphics();
    background.fillStyle(0x02040a, 1);
    background.fillRect(-width / 2, -height / 2, width, height);
    background.fillStyle(0x071018, 0.96);
    background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    background.lineStyle(2, 0x42f5d7, 0.82);
    background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    const title = this.add
      .text(0, panelY + 38, 'STARVIVORS', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '38px',
        color: '#f2fbff',
        align: 'center'
      })
      .setOrigin(0.5, 0);
    const credits = this.add
      .text(0, panelY + 104, `Credits ${this.totalCredits}`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '20px',
        color: '#c8f7ff',
        align: 'center'
      })
      .setOrigin(0.5, 0);
    const selectedShip = this.add
      .text(0, panelY + 132, `Ship ${this.getSelectedShipDefinition().displayName}`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#9fb5d1',
        align: 'center'
      })
      .setOrigin(0.5, 0);

    this.mainMenuScreen = this.add
      .container(centerX, centerY, [background, title, credits, selectedShip])
      .setScrollFactor(0)
      .setDepth(1300);

    this.addScreenButton(this.mainMenuScreen, this.mainMenuActionZones, centerX, centerY, 0, panelY + 184, 240, 42, 'Start Run', () =>
      this.startRun()
    );
    this.addScreenButton(this.mainMenuScreen, this.mainMenuActionZones, centerX, centerY, 0, panelY + 238, 240, 42, 'Ship Select', () =>
      this.showShipSelect()
    );
    this.addScreenButton(this.mainMenuScreen, this.mainMenuActionZones, centerX, centerY, 0, panelY + 292, 240, 42, 'Shop', () =>
      this.showShop('mainMenu')
    );
    this.createDebugMenu();
  }

  private showShipSelect(): void {
    this.gameFlowState = 'shipSelect';
    this.destroyMainMenuScreen();
    this.destroyShipSelectScreen();

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(width - 48, 760);
    const panelHeight = Math.min(height - 48, 500);
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;
    const rowX = panelX + 32;
    const rowWidth = panelWidth - 64;
    const rowHeight = 128;
    const rowTop = panelY + 98;
    const rowGap = 14;
    const buttonWidth = 142;
    const buttonHeight = 36;
    const previewSize = 78;
    const selectedShip = this.getSelectedShipDefinition();

    const background = this.add.graphics();
    background.fillStyle(0x02040a, 1);
    background.fillRect(-width / 2, -height / 2, width, height);
    background.fillStyle(0x071018, 0.96);
    background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    background.lineStyle(2, 0x42f5d7, 0.82);
    background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    const title = this.add
      .text(panelX + 32, panelY + 28, 'SHIP SELECT', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '18px',
        color: '#f2fbff'
      })
      .setOrigin(0, 0);
    const selectedLabel = this.add
      .text(panelX + 32, panelY + 54, `Selected ${selectedShip.displayName}`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#c8f7ff'
      })
      .setOrigin(0, 0);

    this.shipSelectScreen = this.add
      .container(centerX, centerY, [background, title, selectedLabel])
      .setScrollFactor(0)
      .setDepth(1300);

    for (let i = 0; i < shipRegistry.length; i += 1) {
      const ship = shipRegistry[i];
      const rowY = rowTop + i * (rowHeight + rowGap);
      const isSelected = ship.id === this.selectedShipId;
      const isUnlocked = this.isShipUnlocked(ship.id);
      const canUnlock = this.canUnlockShip(ship);
      const isAvailable = this.canStartRunWithShip(ship);
      const statusLabel = isAvailable ? (isSelected ? 'Selected' : 'Available') : this.getShipLockedLabel(ship);
      const borderColor = isSelected ? 0x42f5d7 : isAvailable ? 0x52627f : 0x39445a;
      const textColor = isUnlocked ? '#f2fbff' : '#8090a6';
      const rowTextWidth = rowWidth - previewSize - buttonWidth - 68;
      const rowTextX = rowX + previewSize + 24;

      background.fillStyle(isSelected ? 0x102633 : 0x111a24, 0.94);
      background.fillRoundedRect(rowX, rowY, rowWidth, rowHeight, 6);
      background.lineStyle(2, borderColor, isSelected ? 0.9 : 0.72);
      background.strokeRoundedRect(rowX, rowY, rowWidth, rowHeight, 6);

      const preview = this.add
        .image(rowX + 48, rowY + rowHeight / 2, ship.textureKey)
        .setDisplaySize(previewSize, previewSize)
        .setRotation(ship.visualRotation)
        .setAlpha(isUnlocked ? 1 : 0.56);
      const text = this.add
        .text(
          rowTextX,
          rowY + 14,
          `${ship.displayName}  ${statusLabel}\n${ship.description}\nRole: ${ship.role}  Hull: ${ship.baseStats.maxHull}  Speed: ${ship.speedRating}  Handling: ${ship.handlingRating}\nMove: ${ship.movementNotes}\nWeapon: ${ship.startingWeaponNotes}`,
          {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '14px',
            color: textColor,
            fixedWidth: rowTextWidth,
            lineSpacing: 2,
            wordWrap: { width: rowTextWidth, useAdvancedWrap: true }
          }
        )
        .setOrigin(0, 0);
      this.shipSelectScreen.add([preview, text]);

      this.addScreenButton(
        this.shipSelectScreen,
        this.shipSelectActionZones,
        centerX,
        centerY,
        rowX + rowWidth - buttonWidth / 2 - 18,
        rowY + (rowHeight - buttonHeight) / 2,
        buttonWidth,
        buttonHeight,
        this.getShipActionLabel(ship),
        () => this.handleShipAction(ship),
        isAvailable || canUnlock
      );
    }

    this.addScreenButton(
      this.shipSelectScreen,
      this.shipSelectActionZones,
      centerX,
      centerY,
      0,
      panelY + panelHeight - 58,
      180,
      38,
      'Back',
      () => this.showMainMenu()
    );
    this.createDebugMenu();
  }

  private getShipActionLabel(ship: ShipRegistryEntry): string {
    if (!ship.selectable) {
      return 'Locked';
    }

    if (!this.isShipUnlocked(ship.id)) {
      return this.canUnlockShip(ship) ? `Unlock ${ship.unlockCostCredits}` : `Need ${ship.unlockCostCredits}`;
    }

    return ship.id === this.selectedShipId ? 'Start Run' : 'Select';
  }

  private handleShipAction(ship: ShipRegistryEntry): void {
    if (!ship.selectable) {
      return;
    }

    if (!this.isShipUnlocked(ship.id)) {
      this.unlockShip(ship);
      return;
    }

    if (ship.id === this.selectedShipId) {
      this.startRun();
      return;
    }

    this.selectedShipId = ship.id;
    this.showShipSelect();
  }

  private isShipUnlocked(shipId: ShipId): boolean {
    return this.unlockedShipIds.has(shipId);
  }

  private canStartRunWithShip(ship: ShipRegistryEntry): boolean {
    return ship.selectable && this.isShipUnlocked(ship.id);
  }

  private canUnlockShip(ship: ShipRegistryEntry): boolean {
    return ship.selectable && !this.isShipUnlocked(ship.id) && ship.unlockCostCredits !== undefined && this.totalCredits >= ship.unlockCostCredits;
  }

  private unlockShip(ship: ShipRegistryEntry): void {
    if (!this.canUnlockShip(ship) || ship.unlockCostCredits === undefined) {
      return;
    }

    this.totalCredits -= ship.unlockCostCredits;
    this.unlockedShipIds.add(ship.id);
    this.selectedShipId = ship.id;
    this.showShipSelect();
  }

  private getShipLockedLabel(ship: ShipRegistryEntry): string {
    if (!ship.selectable) {
      return 'Coming Soon';
    }

    return ship.unlockCostCredits === undefined ? 'Locked' : `Locked ${ship.unlockCostCredits} credits`;
  }

  private showShop(backTarget: ShopBackTarget): void {
    this.shopBackTarget = backTarget;
    this.gameFlowState = 'shop';
    this.destroyShopScreen();
    this.destroyShipSelectScreen();

    if (backTarget === 'mainMenu') {
      this.destroyMainMenuScreen();
    } else {
      this.destroyResultsScreen();
    }

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(width - 48, 680);
    const panelHeight = Math.min(height - 48, 430);
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;
    const rowX = panelX + 32;
    const rowWidth = panelWidth - 64;
    const rowHeight = 54;
    const rowTop = panelY + 106;
    const rowGap = 10;
    const buttonWidth = 124;
    const buttonHeight = 32;
    const buttonX = panelX + panelWidth - 92;
    const textX = rowX + 14;
    const textWidth = rowWidth - buttonWidth - 42;

    const background = this.add.graphics();
    background.fillStyle(0x02040a, backTarget === 'results' ? 0.82 : 1);
    background.fillRect(-width / 2, -height / 2, width, height);
    background.fillStyle(0x071018, 0.96);
    background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    background.lineStyle(2, 0x42f5d7, 0.82);
    background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    const title = this.add
      .text(panelX + 32, panelY + 28, 'SHOP', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '18px',
        color: '#f2fbff'
      })
      .setOrigin(0, 0);
    const credits = this.add
      .text(panelX + 32, panelY + 52, `Credits ${this.totalCredits}`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#c8f7ff'
      })
      .setOrigin(0, 0);

    this.shopScreen = this.add
      .container(centerX, centerY, [background, title, credits])
      .setScrollFactor(0)
      .setDepth(1300);

    for (let i = 0; i < PERMANENT_UPGRADE_DEFINITIONS.length; i += 1) {
      const rowY = rowTop + i * (rowHeight + rowGap);
      const upgrade = PERMANENT_UPGRADE_DEFINITIONS[i];
      const level = this.getPermanentUpgradeLevel(upgrade.id);
      const isMaxed = this.isPermanentUpgradeMaxed(upgrade);
      const canPurchase = this.canPurchasePermanentUpgrade(upgrade);
      const label = isMaxed ? 'Maxed' : canPurchase ? 'Buy' : 'Need Credits';
      const costLabel = isMaxed ? 'Maxed' : `Cost ${this.getPermanentUpgradeCost(upgrade)}`;

      background.fillStyle(0x111a24, 0.94);
      background.fillRoundedRect(rowX, rowY, rowWidth, rowHeight, 6);
      background.lineStyle(1, 0x52627f, 0.82);
      background.strokeRoundedRect(rowX, rowY, rowWidth, rowHeight, 6);

      const rowText = this.add
        .text(textX, rowY + 9, `${upgrade.name}  Lv ${level}/${upgrade.maxLevel}\n${upgrade.description}  ${costLabel}`, {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '14px',
          color: '#f2fbff',
          fixedWidth: textWidth,
          lineSpacing: 2,
          wordWrap: { width: textWidth, useAdvancedWrap: true }
        })
        .setOrigin(0, 0);
      this.shopScreen.add(rowText);

      this.addScreenButton(
        this.shopScreen,
        this.shopActionZones,
        centerX,
        centerY,
        buttonX,
        rowY + (rowHeight - buttonHeight) / 2,
        buttonWidth,
        buttonHeight,
        label,
        () => this.purchasePermanentUpgrade(upgrade),
        canPurchase
      );
    }

    this.addScreenButton(this.shopScreen, this.shopActionZones, centerX, centerY, 0, panelY + panelHeight - 58, 180, 38, 'Back', () =>
      this.handleShopBack()
    );
    this.createDebugMenu();
  }

  private getPermanentUpgradeLevel(id: PermanentUpgradeId): number {
    return this.permanentUpgradeLevels[id];
  }

  private getPermanentUpgradeCost(upgrade: PermanentUpgradeDefinition): number {
    return upgrade.baseCost * (this.getPermanentUpgradeLevel(upgrade.id) + 1);
  }

  private getSelectedShipDefinition(): ShipRegistryEntry {
    return getShipDefinition(this.selectedShipId);
  }

  private getResolvedPlayerStats(): PlayerStats {
    return resolvePlayerStats({
      baseStats: this.getSelectedShipDefinition().baseStats,
      passiveLevels: {
        hullPlating: this.passiveUpgradeLevels['hull-plating'],
        engineTuning: this.passiveUpgradeLevels['engine-tuning'],
        damageControl: this.passiveUpgradeLevels['damage-control']
      },
      permanentLevels: this.permanentUpgradeLevels
    });
  }

  private hasRammingShield(): boolean {
    return (
      this.playerWeapons.activeMainWeaponId === 'ramming-shield' ||
      this.playerWeapons.activeSecondaryWeaponId === 'ramming-shield'
    );
  }

  private getRammingShieldMaxHp(): number {
    return this.hasRammingShield() ? this.getRammingShieldStats().shieldMaxHp : 0;
  }

  private getRammingShieldStats() {
    return getRammingShieldStats();
  }

  private ensureRammingShieldRuntime(): void {
    if (!this.hasRammingShield()) {
      return;
    }

    ensureRammingShieldRuntime(this.rammingShieldState);

    if (!this.rammingShieldImage && this.player) {
      this.rammingShieldImage = this.createRammingShieldImage();
      this.player.add(this.rammingShieldImage);
      this.updateRammingShieldVisual(this.time.now);
    }
  }

  private getPlayerMass(): number {
    return this.getResolvedPlayerStats().mass;
  }

  private getPlayerHitRadius(): number {
    return this.getSelectedShipDefinition().hitRadius;
  }

  private getPlayerBlackHoleWhirlpoolTuning(): BlackHoleWhirlpoolTuning {
    const massMultiplier = this.getPlayerMass() / PLAYER_MASS;

    return {
      ...BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING,
      mass: BLACK_HOLE_PLAYER_FIELD_MASS * massMultiplier,
      massResistance: Math.min(0.72, BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING.massResistance * Math.sqrt(massMultiplier))
    };
  }

  private isPermanentUpgradeMaxed(upgrade: PermanentUpgradeDefinition): boolean {
    return this.getPermanentUpgradeLevel(upgrade.id) >= upgrade.maxLevel;
  }

  private canPurchasePermanentUpgrade(upgrade: PermanentUpgradeDefinition): boolean {
    return !this.isPermanentUpgradeMaxed(upgrade) && this.totalCredits >= this.getPermanentUpgradeCost(upgrade);
  }

  private purchasePermanentUpgrade(upgrade: PermanentUpgradeDefinition): void {
    if (!this.canPurchasePermanentUpgrade(upgrade)) {
      return;
    }

    this.totalCredits -= this.getPermanentUpgradeCost(upgrade);
    this.permanentUpgradeLevels[upgrade.id] += 1;
    this.showShop(this.shopBackTarget);
  }

  private handleShopBack(): void {
    const backTarget = this.shopBackTarget;
    this.destroyShopScreen();

    if (backTarget === 'results' && this.isPlayerDead) {
      this.gameFlowState = 'results';
      this.showResultsScreen();
      return;
    }

    this.showMainMenu();
  }

  private destroyMainMenuScreen(): void {
    for (const zone of this.mainMenuActionZones) {
      zone.destroy();
    }

    this.mainMenuActionZones = [];
    this.mainMenuScreen?.destroy(true);
    this.mainMenuScreen = undefined;
  }

  private destroyShipSelectScreen(): void {
    for (const zone of this.shipSelectActionZones) {
      zone.destroy();
    }

    this.shipSelectActionZones = [];
    this.shipSelectScreen?.destroy(true);
    this.shipSelectScreen = undefined;
  }

  private destroyShopScreen(): void {
    for (const zone of this.shopActionZones) {
      zone.destroy();
    }

    this.shopActionZones = [];
    this.shopScreen?.destroy(true);
    this.shopScreen = undefined;
  }

  private destroyResultsScreen(): void {
    for (const zone of this.resultsActionZones) {
      zone.destroy();
    }

    this.resultsActionZones = [];
    this.resultsScreen?.destroy(true);
    this.resultsScreen = undefined;
  }

  private addScreenButton(
    container: Phaser.GameObjects.Container,
    actionZones: Phaser.GameObjects.Zone[],
    screenCenterX: number,
    screenCenterY: number,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    callback: () => void,
    isEnabled = true
  ): void {
    const activeState = this.gameFlowState;
    const buttonBackground = this.add.graphics();
    buttonBackground.fillStyle(isEnabled ? 0x111a24 : 0x151922, 0.98);
    buttonBackground.fillRoundedRect(x - width / 2, y, width, height, 6);
    buttonBackground.lineStyle(2, isEnabled ? 0x42f5d7 : 0x52627f, isEnabled ? 0.88 : 0.6);
    buttonBackground.strokeRoundedRect(x - width / 2, y, width, height, 6);

    const buttonText = this.add
      .text(x, y + height / 2, label, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: isEnabled ? '#f2fbff' : '#8090a6',
        align: 'center',
        fixedWidth: width - 10
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(screenCenterX + x - width / 2, screenCenterY + y, width, height)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (isEnabled && this.gameFlowState === activeState) {
          callback();
        }
      });

    if (isEnabled) {
      zone.setInteractive({ useHandCursor: true });
    }

    container.add([buttonBackground, buttonText]);
    actionZones.push(zone);
  }

  private getRandomBlackHoleZoneSpawnPosition(
    viewport: ViewportSize,
    playerStart: Phaser.Math.Vector2
  ): Phaser.Math.Vector2 {
    const zoneColumns = Math.max(1, Math.floor(this.arena.width / viewport.width));
    const zoneRows = Math.max(1, Math.floor(this.arena.height / viewport.height));
    const playerZoneColumn = Phaser.Math.Clamp(Math.floor(playerStart.x / viewport.width), 0, zoneColumns - 1);
    const playerZoneRow = Phaser.Math.Clamp(Math.floor(playerStart.y / viewport.height), 0, zoneRows - 1);
    const availableZones: Array<{ column: number; row: number }> = [];

    for (let row = 0; row < zoneRows; row += 1) {
      for (let column = 0; column < zoneColumns; column += 1) {
        if (column === playerZoneColumn && row === playerZoneRow) {
          continue;
        }

        availableZones.push({ column, row });
      }
    }

    const zone = Phaser.Utils.Array.GetRandom(availableZones) ?? { column: playerZoneColumn, row: playerZoneRow };
    const zoneX = zone.column * viewport.width;
    const zoneY = zone.row * viewport.height;
    const zoneCenterX = zoneX + viewport.width / 2;
    const zoneCenterY = zoneY + viewport.height / 2;
    const centerExclusionRadius = Math.min(viewport.width, viewport.height) * BLACK_HOLE_ZONE_CENTER_EXCLUSION_RATIO;

    for (let i = 0; i < 16; i += 1) {
      const x = Phaser.Math.FloatBetween(zoneX, zoneX + viewport.width);
      const y = Phaser.Math.FloatBetween(zoneY, zoneY + viewport.height);
      const distanceFromZoneCenter = Phaser.Math.Distance.Between(x, y, zoneCenterX, zoneCenterY);

      if (distanceFromZoneCenter >= centerExclusionRadius) {
        return new Phaser.Math.Vector2(wrapCoordinate(x, this.arena.width), wrapCoordinate(y, this.arena.height));
      }
    }

    return new Phaser.Math.Vector2(
      wrapCoordinate(zoneX + viewport.width * 0.25, this.arena.width),
      wrapCoordinate(zoneY + viewport.height * 0.25, this.arena.height)
    );
  }

  private createBackgroundTextures(): void {
    this.createStarLayerTexture(STARFIELD_FAR_TEXTURE_KEY, 'starvivors-starfield-far-tile', 260, 0.45, 1.3, 0.18, 0.7);
    this.createStarLayerTexture(STARFIELD_MID_TEXTURE_KEY, 'starvivors-starfield-mid-tile', 180, 0.65, 2.1, 0.24, 0.82);
    this.createStarLayerTexture(STARFIELD_NEAR_TEXTURE_KEY, 'starvivors-starfield-near-tile', 118, 0.78, 2.6, 0.28, 0.82);
  }

  private createStarLayerTexture(
    textureKey: string,
    seed: string,
    starCount: number,
    minRadius: number,
    maxRadius: number,
    minAlpha: number,
    maxAlpha: number
  ): void {
    if (this.textures.exists(textureKey)) {
      return;
    }

    const starTexture = this.textures.createCanvas(textureKey, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

    if (!starTexture) {
      return;
    }

    const context = starTexture.getContext();
    const random = new Phaser.Math.RandomDataGenerator([seed]);

    context.clearRect(0, 0, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

    for (let i = 0; i < starCount; i += 1) {
      const x = random.between(0, BACKGROUND_TILE_SIZE);
      const y = random.between(0, BACKGROUND_TILE_SIZE);
      const radius = random.realInRange(minRadius, maxRadius);
      const alpha = random.realInRange(minAlpha, maxAlpha);
      const color = Phaser.Display.Color.IntegerToColor(Phaser.Utils.Array.GetRandom(STAR_COLORS));
      const glowRadius = radius * random.realInRange(1.8, 3.4);

      context.globalAlpha = alpha * 0.22;
      context.fillStyle = color.rgba;
      context.beginPath();
      context.arc(x, y, glowRadius, 0, Math.PI * 2);
      context.fill();

      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
    starTexture.refresh();
  }

  private createStarfield(): void {
    this.cameras.main.setBackgroundColor(0x02040a);

    this.farStarfield = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, STARFIELD_FAR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);

    this.midStarfield = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, STARFIELD_MID_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-19);

    this.nearStarfield = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, STARFIELD_NEAR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-18);

    this.applyBackgroundTilePositions();
    this.applyBackgroundStarVisibility();
  }

  private createPlayerShip(x: number, y: number): Phaser.GameObjects.Container {
    const shipDefinition = this.getSelectedShipDefinition();
    const sprite = this.add.image(0, 0, shipDefinition.textureKey);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(shipDefinition.displaySize, shipDefinition.displaySize);
    sprite.setRotation(shipDefinition.visualRotation);
    this.playerSprite = sprite;

    const ship = this.add.container(x, y, [sprite]);
    if (this.hasRammingShield()) {
      this.rammingShieldImage = this.createRammingShieldImage();
      this.updateRammingShieldVisual(this.time.now);
      ship.add(this.rammingShieldImage);
    }
    ship.setDepth(10);

    return ship;
  }

  private createRammingShieldImage(): Phaser.GameObjects.Image {
    const stats = this.getRammingShieldStats();
    const shield = this.add.image(0, -stats.range, RAMMING_SHIELD_TEXTURE_KEY);

    shield.setOrigin(0.5, 0.55);
    shield.setCrop(
      RAMMING_SHIELD_TEXTURE_CROP.x,
      RAMMING_SHIELD_TEXTURE_CROP.y,
      RAMMING_SHIELD_TEXTURE_CROP.width,
      RAMMING_SHIELD_TEXTURE_CROP.height
    );
    shield.setDisplaySize(stats.width, RAMMING_SHIELD_COLLIDER_DEPTH);
    shield.setDepth(6);

    return shield;
  }

  private createBasicEnemies(center: Phaser.Math.Vector2): void {
    const spawnDistance = Math.max(this.scale.width, this.scale.height) * 0.78;

    for (let index = 0; index < BASIC_ENEMY_COUNT; index += 1) {
      const angle = (Math.PI * 2 * index) / BASIC_ENEMY_COUNT + Math.PI / 8;
      const x = wrapCoordinate(center.x + Math.cos(angle) * spawnDistance, this.arena.width);
      const y = wrapCoordinate(center.y + Math.sin(angle) * spawnDistance, this.arena.height);
      const body = this.createBasicEnemy(x, y);
      const wrapMirrorBody = this.createBasicEnemy(x, y);
      wrapMirrorBody.setVisible(false);

      this.basicEnemies.push(this.createBasicEnemyInstance(body, wrapMirrorBody));
    }
  }

  private createBasicEnemy(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, BASIC_ENEMY_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(BASIC_ENEMY_DISPLAY_SIZE, BASIC_ENEMY_DISPLAY_SIZE);
    sprite.setRotation(BASIC_ENEMY_VISUAL_ROTATION);

    const enemy = this.add.container(x, y, [sprite]);
    enemy.setSize(BASIC_ENEMY_DISPLAY_SIZE, BASIC_ENEMY_DISPLAY_SIZE);
    enemy.setDepth(9);

    return enemy;
  }

  private createShooterEnemies(center: Phaser.Math.Vector2): void {
    const spawnDistance = Math.max(this.scale.width, this.scale.height) * 1.12;

    for (let index = 0; index < SHOOTER_ENEMY_COUNT; index += 1) {
      const angle = (Math.PI * 2 * index) / SHOOTER_ENEMY_COUNT + Math.PI / 2;
      const x = wrapCoordinate(center.x + Math.cos(angle) * spawnDistance, this.arena.width);
      const y = wrapCoordinate(center.y + Math.sin(angle) * spawnDistance, this.arena.height);
      const body = this.createShooterEnemy(x, y);
      const wrapMirrorBody = this.createShooterEnemy(x, y);
      wrapMirrorBody.setVisible(false);

      this.shooterEnemies.push(this.createShooterEnemyInstance(body, wrapMirrorBody, this.time.now));
    }
  }

  private createShooterEnemy(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, SHOOTER_ENEMY_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(SHOOTER_ENEMY_DISPLAY_SIZE, SHOOTER_ENEMY_DISPLAY_SIZE);
    sprite.setRotation(SHOOTER_ENEMY_VISUAL_ROTATION);

    const enemy = this.add.container(x, y, [sprite]);
    enemy.setSize(SHOOTER_ENEMY_DISPLAY_SIZE, SHOOTER_ENEMY_DISPLAY_SIZE);
    enemy.setDepth(9);

    return enemy;
  }

  private createTankEnemies(center: Phaser.Math.Vector2): void {
    const spawnDistance = Math.max(this.scale.width, this.scale.height) * 0.95;

    for (let index = 0; index < TANK_ENEMY_COUNT; index += 1) {
      const angle = (Math.PI * 2 * index) / TANK_ENEMY_COUNT + Math.PI * 1.25;
      const x = wrapCoordinate(center.x + Math.cos(angle) * spawnDistance, this.arena.width);
      const y = wrapCoordinate(center.y + Math.sin(angle) * spawnDistance, this.arena.height);
      const body = this.createTankEnemy(x, y);
      const wrapMirrorBody = this.createTankEnemy(x, y);
      wrapMirrorBody.setVisible(false);

      this.tankEnemies.push(this.createTankEnemyInstance(body, wrapMirrorBody));
    }
  }

  private createTankEnemy(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, TANK_ENEMY_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(TANK_ENEMY_DISPLAY_SIZE, TANK_ENEMY_DISPLAY_SIZE);
    sprite.setRotation(TANK_ENEMY_VISUAL_ROTATION);

    const enemy = this.add.container(x, y, [sprite]);
    enemy.setSize(TANK_ENEMY_DISPLAY_SIZE, TANK_ENEMY_DISPLAY_SIZE);
    enemy.setDepth(9);

    return enemy;
  }

  private createBasicEnemyInstance(
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container
  ): BasicEnemy {
    return {
      body,
      wrapMirrorBody,
      stats: basicEnemy.stats,
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
      hp: basicEnemy.stats.maxHull,
      nextBlackHoleDamageAt: 0
    };
  }

  private createShooterEnemyInstance(
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    time: number
  ): ShooterEnemy {
    return {
      body,
      wrapMirrorBody,
      stats: shooterEnemy.stats,
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
      nextFireAt: time + Phaser.Math.Between(700, Math.round(shooterEnemy.stats.attackCooldown * 1000)),
      hp: shooterEnemy.stats.maxHull,
      nextBlackHoleDamageAt: 0
    };
  }

  private createTankEnemyInstance(
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container
  ): TankEnemy {
    return {
      body,
      wrapMirrorBody,
      stats: tankEnemy.stats,
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
      hp: tankEnemy.stats.maxHull,
      nextBlackHoleDamageAt: 0
    };
  }

  private updateEnemySpawnDirector(time: number): void {
    if (
      this.isPlayerDead ||
      this.isUpgradeOverlayOpen ||
      this.debugMenu?.isOpen() ||
      !this.debugState.enemySpawningEnabled ||
      time < this.nextEnemySpawnAt
    ) {
      return;
    }

    const activeEnemyCount = this.getActiveEnemyCount();
    const maxActiveEnemies = this.getEnemySpawnMaxActiveEnemies(time);

    if (activeEnemyCount < maxActiveEnemies) {
      const spawnCount =
        this.getEnemySpawnDifficultyStep(time) >= ENEMY_SPAWN_DOUBLE_SPAWN_STEP &&
        activeEnemyCount + 1 < maxActiveEnemies &&
        Phaser.Math.FloatBetween(0, 1) < 0.25
          ? 2
          : 1;

      for (let i = 0; i < spawnCount && this.getActiveEnemyCount() < maxActiveEnemies; i += 1) {
        this.spawnDirectedEnemy(this.chooseDirectedEnemyType(time), time);
      }
    }

    this.nextEnemySpawnAt = time + this.getEnemySpawnIntervalMs(time);
  }

  private spawnDirectedEnemy(enemyType: EnemySpawnType, time: number): void {
    const position = this.getEnemyDirectorSpawnPosition();
    const body =
      enemyType === 'shooter'
        ? this.createShooterEnemy(position.x, position.y)
        : enemyType === 'tank'
          ? this.createTankEnemy(position.x, position.y)
          : this.createBasicEnemy(position.x, position.y);
    const wrapMirrorBody =
      enemyType === 'shooter'
        ? this.createShooterEnemy(position.x, position.y)
        : enemyType === 'tank'
          ? this.createTankEnemy(position.x, position.y)
          : this.createBasicEnemy(position.x, position.y);

    wrapMirrorBody.setVisible(false);

    if (enemyType === 'shooter') {
      this.shooterEnemies.push(this.createShooterEnemyInstance(body, wrapMirrorBody, time));
    } else if (enemyType === 'tank') {
      this.tankEnemies.push(this.createTankEnemyInstance(body, wrapMirrorBody));
    } else {
      this.basicEnemies.push(this.createBasicEnemyInstance(body, wrapMirrorBody));
    }
  }

  private getEnemyDirectorSpawnPosition(): Phaser.Math.Vector2 {
    const safeDistance = Math.min(
      ENEMY_SPAWN_SAFE_DISTANCE,
      Math.max(PLAYER_HIT_RADIUS * 4, Math.min(this.arena.width, this.arena.height) * 0.45)
    );

    for (let i = 0; i < 12; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(safeDistance, safeDistance * 1.55);
      const x = wrapCoordinate(this.player.x + Math.cos(angle) * distance, this.arena.width);
      const y = wrapCoordinate(this.player.y + Math.sin(angle) * distance, this.arena.height);
      const offsetFromPlayer = this.getWrappedDirection(this.player.x, this.player.y, x, y);

      if (offsetFromPlayer.length() >= safeDistance) {
        return new Phaser.Math.Vector2(x, y);
      }
    }

    const fallbackAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    return new Phaser.Math.Vector2(
      wrapCoordinate(this.player.x + Math.cos(fallbackAngle) * safeDistance, this.arena.width),
      wrapCoordinate(this.player.y + Math.sin(fallbackAngle) * safeDistance, this.arena.height)
    );
  }

  private chooseDirectedEnemyType(time: number): EnemySpawnType {
    const weights = this.getEnemySpawnWeights(time);
    const totalWeight = weights.chaser + weights.shooter + weights.tank;
    let roll = Phaser.Math.FloatBetween(0, totalWeight);

    roll -= weights.chaser;
    if (roll <= 0) {
      return 'chaser';
    }

    roll -= weights.shooter;
    return roll <= 0 ? 'shooter' : 'tank';
  }

  private getEnemySpawnWeights(time: number): Record<EnemySpawnType, number> {
    const step = Math.min(this.getEnemySpawnDifficultyStep(time), ENEMY_SPAWN_WEIGHTS_BY_STEP.length - 1);

    return ENEMY_SPAWN_WEIGHTS_BY_STEP[step];
  }

  private getEnemySpawnDifficultyStep(time: number): number {
    return Math.floor(this.getSurvivalElapsedMs(time) / ENEMY_SPAWN_ESCALATION_INTERVAL_MS);
  }

  private getEnemySpawnIntervalMs(time: number): number {
    const step = this.getEnemySpawnDifficultyStep(time);

    return Math.max(ENEMY_SPAWN_MIN_INTERVAL_MS, ENEMY_SPAWN_INTERVAL_MS - step * 420);
  }

  private getEnemySpawnMaxActiveEnemies(time: number): number {
    return Math.min(
      ENEMY_SPAWN_MAX_ACTIVE_HARD_CAP,
      ENEMY_SPAWN_MAX_ACTIVE_INITIAL + this.getEnemySpawnDifficultyStep(time) * ENEMY_SPAWN_MAX_ACTIVE_PER_STEP
    );
  }

  private getActiveEnemyCount(): number {
    return this.basicEnemies.length + this.shooterEnemies.length + this.tankEnemies.length;
  }

  private spawnDebugEnemy(enemyType: DebugEnemyType): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead) {
      return;
    }

    this.spawnDirectedEnemy(enemyType, this.time.now);
  }

  private clearEnemies(): void {
    for (const enemy of this.basicEnemies) {
      enemy.body.destroy(true);
      enemy.wrapMirrorBody.destroy(true);
    }

    for (const enemy of this.shooterEnemies) {
      enemy.body.destroy(true);
      enemy.wrapMirrorBody.destroy(true);
    }

    for (const enemy of this.tankEnemies) {
      enemy.body.destroy(true);
      enemy.wrapMirrorBody.destroy(true);
    }

    this.basicEnemies = [];
    this.shooterEnemies = [];
    this.tankEnemies = [];
  }

  private spawnDebugAsteroid(tier: DebugAsteroidTier): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead) {
      return;
    }

    const position = this.getDebugSpawnPosition(ASTEROID_SAFE_SPAWN_RADIUS);
    this.basicAsteroids.push(this.createAsteroidInstance(position.x, position.y, tier));
  }

  private getDebugSpawnPosition(safeDistance: number): Phaser.Math.Vector2 {
    for (let i = 0; i < 12; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(safeDistance, safeDistance * 1.35);
      const x = wrapCoordinate(this.player.x + Math.cos(angle) * distance, this.arena.width);
      const y = wrapCoordinate(this.player.y + Math.sin(angle) * distance, this.arena.height);
      const offsetFromPlayer = this.getWrappedDirection(this.player.x, this.player.y, x, y);

      if (offsetFromPlayer.length() >= safeDistance) {
        return new Phaser.Math.Vector2(x, y);
      }
    }

    return new Phaser.Math.Vector2(wrapCoordinate(this.player.x + safeDistance, this.arena.width), this.player.y);
  }

  private createBasicAsteroids(center: Phaser.Math.Vector2): void {
    for (let index = 0; index < BASIC_ASTEROID_COUNT; index += 1) {
      let x = Phaser.Math.Between(0, this.arena.width);
      let y = Phaser.Math.Between(0, this.arena.height);
      const offsetFromPlayer = this.getWrappedDirection(center.x, center.y, x, y);

      if (offsetFromPlayer.length() < ASTEROID_SAFE_SPAWN_RADIUS) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        x = wrapCoordinate(center.x + Math.cos(angle) * ASTEROID_SAFE_SPAWN_RADIUS, this.arena.width);
        y = wrapCoordinate(center.y + Math.sin(angle) * ASTEROID_SAFE_SPAWN_RADIUS, this.arena.height);
      }

      this.basicAsteroids.push(this.createAsteroidInstance(x, y, this.getRandomInitialAsteroidTier()));
    }
  }

  private updateBlackHole(time: number, deltaSeconds: number, shouldMove = true): void {
    if (!this.blackHole || this.isPlayerDead) {
      return;
    }

    const blackHole = this.blackHole.getState();

    this.blackHole.update(
      time,
      deltaSeconds,
      this.arena,
      this.debugState.collisionDebugEnabled,
      this.getActiveDebugBlackHoleLensOrbitSpeedMultiplier(),
      this.getActiveDebugBlackHoleLensDensity(),
      this.getActiveDebugBlackHoleLensLengthMultiplier(),
      this.getActiveDebugBlackHoleProjectionLensLayerState(),
      this.debugBlackHoleInfluenceRadiusScale,
      this.debugBlackHoleDamageRadiusScale,
      this.debugBlackHoleVisualScale,
      this.debugBlackHoleCoreScale,
      shouldMove
    );
    this.updateToroidalRenderMirror(
      blackHole.body,
      blackHole.wrapMirrorBody,
      blackHole.warningRadius
    );
  }

  private updateBlackHolePlayerCollision(): void {
    if (!this.blackHole || this.isPlayerDead) {
      return;
    }

    if (this.blackHole.wouldConsumePlayer(this.player.x, this.player.y, this.arena)) {
      this.killPlayer();
    }
  }

  private applyBlackHoleToPlayer(time: number, deltaSeconds: number): void {
    if (!this.blackHole || this.isPlayerDead) {
      return;
    }

    const playerWhirlpoolTuning = this.getPlayerBlackHoleWhirlpoolTuning();
    const result = this.blackHole.applyWhirlpoolToVelocity(
      this.player.x,
      this.player.y,
      this.playerVelocity,
      deltaSeconds,
      playerWhirlpoolTuning,
      this.arena,
      this.getActiveDebugBlackHoleFieldTuning(true)
    );

    if (result.isInsideEventHorizon) {
      return;
    }

    if (
      this.debugState.blackHoleFieldDamageEnabled &&
      result.isInsideDamage &&
      time >= this.nextBlackHolePlayerDamageAt
    ) {
      const damage = this.getBlackHoleTidalDamage(
        result.proximity,
        BLACK_HOLE_PLAYER_TIDAL_DAMAGE_BASE,
        BLACK_HOLE_PLAYER_TIDAL_DAMAGE_EXTRA,
        BLACK_HOLE_PLAYER_TIDAL_DAMAGE_INTERVAL_MS
      );

      this.damagePlayer(damage, time);
      this.nextBlackHolePlayerDamageAt = time + BLACK_HOLE_PLAYER_TIDAL_DAMAGE_INTERVAL_MS;
    }
  }

  private applyBlackHoleToAsteroid(asteroid: BasicAsteroid, index: number, deltaSeconds: number, time: number): boolean {
    if (!this.blackHole) {
      return false;
    }

    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];
    const result = this.blackHole.applyWhirlpoolToVelocity(
      asteroid.body.x,
      asteroid.body.y,
      asteroid.velocity,
      deltaSeconds,
      {
        ...BLACK_HOLE_ASTEROID_WHIRLPOOL_TUNING,
        mass: BLACK_HOLE_ASTEROID_FIELD_MASS_BY_TIER[asteroid.tier],
        maxSpeed: Math.max(tierConfig.maxVelocity, BLACK_HOLE_ASTEROID_WHIRLPOOL_TUNING.maxSpeed)
      },
      this.arena,
      this.getActiveDebugBlackHoleFieldTuning()
    );

    if (result.isInsideEventHorizon) {
      this.consumeBasicAsteroid(index);
      return true;
    }

    if (
      this.debugState.blackHoleFieldDamageEnabled &&
      result.isInsideDamage &&
      time >= asteroid.nextBlackHoleDamageAt
    ) {
      asteroid.hp -= this.getBlackHoleTidalDamage(
        result.proximity,
        BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_BASE,
        BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_EXTRA,
        BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS
      );
      asteroid.nextBlackHoleDamageAt = time + BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS;

      if (asteroid.hp <= 0) {
        this.destroyBasicAsteroid(index, false);
        return true;
      }

      this.flashDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
    }

    return false;
  }

  private applyBlackHoleToBasicEnemy(enemy: BasicEnemy, index: number, deltaSeconds: number, time: number): boolean {
    return this.applyBlackHoleToEnemy(
      enemy,
      this.basicEnemies,
      index,
      deltaSeconds,
      time,
      BLACK_HOLE_CHASER_WHIRLPOOL_TUNING
    );
  }

  private applyBlackHoleToShooterEnemy(enemy: ShooterEnemy, index: number, deltaSeconds: number, time: number): boolean {
    return this.applyBlackHoleToEnemy(
      enemy,
      this.shooterEnemies,
      index,
      deltaSeconds,
      time,
      BLACK_HOLE_SHOOTER_WHIRLPOOL_TUNING
    );
  }

  private applyBlackHoleToTankEnemy(enemy: TankEnemy, index: number, deltaSeconds: number, time: number): boolean {
    return this.applyBlackHoleToEnemy(
      enemy,
      this.tankEnemies,
      index,
      deltaSeconds,
      time,
      BLACK_HOLE_TANK_WHIRLPOOL_TUNING
    );
  }

  private applyBlackHoleToEnemy<T extends BasicEnemy | ShooterEnemy | TankEnemy>(
    enemy: T,
    enemies: T[],
    index: number,
    deltaSeconds: number,
    time: number,
    tuning: BlackHoleWhirlpoolTuning
  ): boolean {
    if (!this.blackHole) {
      return false;
    }

    const result = this.blackHole.applyWhirlpoolToVelocity(
      enemy.body.x,
      enemy.body.y,
      enemy.blackHoleVelocity,
      deltaSeconds,
      tuning,
      this.arena,
      this.getActiveDebugBlackHoleFieldTuning()
    );

    enemy.blackHoleVelocity.scale(Math.pow(BLACK_HOLE_ENEMY_FIELD_DAMPING, deltaSeconds * 60));

    if (result.isInsideEventHorizon) {
      this.destroyEnemyWithoutRewards(enemy);
      enemies.splice(index, 1);
      return true;
    }

    if (
      this.debugState.blackHoleFieldDamageEnabled &&
      result.isInsideDamage &&
      time >= enemy.nextBlackHoleDamageAt
    ) {
      this.damageEnemy(
        enemy,
        this.getBlackHoleTidalDamage(
          result.proximity,
          BLACK_HOLE_ENEMY_TIDAL_DAMAGE_BASE,
          BLACK_HOLE_ENEMY_TIDAL_DAMAGE_EXTRA,
          BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS
        )
      );
      enemy.nextBlackHoleDamageAt = time + BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS;

      if (enemy.hp <= 0) {
        this.destroyEnemyWithoutRewards(enemy);
        enemies.splice(index, 1);
        return true;
      }

      this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
    }

    return false;
  }

  private getBlackHoleTidalDamage(
    proximity: number,
    baseDamagePerSecond: number,
    extraDamagePerSecond: number,
    intervalMs: number
  ): number {
    const damagePerSecond = baseDamagePerSecond + proximity * proximity * extraDamagePerSecond;

    return damagePerSecond * (intervalMs / 1000);
  }

  private destroyEnemyWithoutRewards(enemy: BasicEnemy | ShooterEnemy | TankEnemy): void {
    enemy.body.destroy(true);
    enemy.wrapMirrorBody.destroy(true);
  }

  private spawnEnemyWreckageDebris(
    enemyType: EnemySpawnType,
    x: number,
    y: number,
    inheritedVelocity: Phaser.Math.Vector2
  ): void {
    const count = ENEMY_WRECKAGE_DEBRIS_COUNT_BY_ENEMY[enemyType];
    const mass = ENEMY_WRECKAGE_DEBRIS_MASS_BY_ENEMY[enemyType];

    for (let i = 0; i < count; i += 1) {
      if (this.enemyWreckageDebris.length >= ENEMY_WRECKAGE_DEBRIS_MAX_ACTIVE) {
        this.destroyEnemyWreckageDebris(this.enemyWreckageDebris.shift());
      }

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(ENEMY_WRECKAGE_DEBRIS_MIN_SPEED, ENEMY_WRECKAGE_DEBRIS_MAX_SPEED);
      const spread = Phaser.Math.FloatBetween(0, ENEMY_WRECKAGE_DEBRIS_HIT_RADIUS * 1.4);
      const spawnX = wrapCoordinate(x + Math.cos(angle) * spread, this.arena.width);
      const spawnY = wrapCoordinate(y + Math.sin(angle) * spread, this.arena.height);
      const body = this.createEnemyWreckageDebrisBody(spawnX, spawnY);
      const wrapMirrorBody = this.createEnemyWreckageDebrisBody(spawnX, spawnY);
      wrapMirrorBody.setVisible(false);

      this.enemyWreckageDebris.push({
        body,
        wrapMirrorBody,
        velocity: new Phaser.Math.Vector2(
          inheritedVelocity.x * ENEMY_WRECKAGE_DEBRIS_INHERITED_VELOCITY + Math.cos(angle) * speed,
          inheritedVelocity.y * ENEMY_WRECKAGE_DEBRIS_INHERITED_VELOCITY + Math.sin(angle) * speed
        ).limit(GAMEPLAY_MAX_VELOCITY),
        mass,
        hp: ENEMY_WRECKAGE_DEBRIS_HP,
        damage: ENEMY_WRECKAGE_DEBRIS_CONTACT_DAMAGE,
        hitRadius: ENEMY_WRECKAGE_DEBRIS_HIT_RADIUS,
        rotationSpeed:
          Phaser.Math.FloatBetween(
            ENEMY_WRECKAGE_DEBRIS_MIN_ROTATION_SPEED,
            ENEMY_WRECKAGE_DEBRIS_MAX_ROTATION_SPEED
          ) * (Phaser.Math.Between(0, 1) === 0 ? -1 : 1),
        expiresAt: this.time.now + ENEMY_WRECKAGE_DEBRIS_LIFETIME_MS
      });
    }
  }

  private createEnemyWreckageDebrisBody(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE, ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE);
    sprite.setTint(0xc7d4dc);

    const body = this.add.container(x, y, [sprite]);
    body.setSize(ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE, ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE);
    body.setDepth(6);
    body.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    return body;
  }

  private updateEnemyWreckageDebris(time: number, deltaSeconds: number): void {
    if (this.isPlayerDead) {
      return;
    }

    for (let i = this.enemyWreckageDebris.length - 1; i >= 0; i -= 1) {
      const debris = this.enemyWreckageDebris[i];

      if (this.applyBlackHoleToDebris(debris, i, deltaSeconds)) {
        continue;
      }

      if (time >= debris.expiresAt) {
        this.destroyEnemyWreckageDebris(debris);
        this.enemyWreckageDebris.splice(i, 1);
        continue;
      }

      debris.body.x = wrapCoordinate(debris.body.x + debris.velocity.x * deltaSeconds, this.arena.width);
      debris.body.y = wrapCoordinate(debris.body.y + debris.velocity.y * deltaSeconds, this.arena.height);
      debris.body.rotation += debris.rotationSpeed * deltaSeconds;
      this.updateToroidalRenderMirror(debris.body, debris.wrapMirrorBody, debris.hitRadius);
    }
  }

  private applyBlackHoleToDebris(debris: EnemyWreckageDebris, index: number, deltaSeconds: number): boolean {
    if (!this.blackHole) {
      return false;
    }

    const result = this.blackHole.applyWhirlpoolToVelocity(
      debris.body.x,
      debris.body.y,
      debris.velocity,
      deltaSeconds,
      {
        ...BLACK_HOLE_DEBRIS_WHIRLPOOL_TUNING,
        mass: debris.mass
      },
      this.arena,
      this.getActiveDebugBlackHoleFieldTuning()
    );

    if (result.isInsideEventHorizon) {
      this.destroyEnemyWreckageDebris(debris);
      this.enemyWreckageDebris.splice(index, 1);
      return true;
    }

    return false;
  }

  private destroyEnemyWreckageDebris(debris: EnemyWreckageDebris | undefined, emitEffect = false): void {
    if (!debris) {
      return;
    }

    if (emitEffect) {
      this.emitShipBulletImpactExplosion(debris.body.x, debris.body.y);
    }

    debris.body.destroy(true);
    debris.wrapMirrorBody.destroy(true);
  }

  private clearEnemyWreckageDebris(): void {
    for (const debris of this.enemyWreckageDebris) {
      this.destroyEnemyWreckageDebris(debris);
    }

    this.enemyWreckageDebris = [];
  }

  private spawnDebugEnemyWreckageDebris(): void {
    if (!this.isGameplayWorldActive() || !this.player || this.isPlayerDead) {
      return;
    }

    const forward = this.getForwardDirection(this.player.rotation);
    const x = wrapCoordinate(this.player.x + forward.x * 120, this.arena.width);
    const y = wrapCoordinate(this.player.y + forward.y * 120, this.arena.height);
    this.spawnEnemyWreckageDebris('shooter', x, y, this.playerVelocity);
  }

  private spawnScrapPickup(
    source: ScrapSourceType,
    value: number,
    x: number,
    y: number,
    inheritedVelocity: Phaser.Math.Vector2
  ): void {
    if (value <= 0) {
      return;
    }

    if (this.scrapPickups.length >= SCRAP_PICKUP_MAX_ACTIVE) {
      this.destroyScrapPickup(this.scrapPickups.shift());
    }

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(SCRAP_PICKUP_MIN_SPEED, SCRAP_PICKUP_MAX_SPEED);
    const spread = Phaser.Math.FloatBetween(0, SCRAP_PICKUP_RADIUS * 1.6);
    const spawnX = wrapCoordinate(x + Math.cos(angle) * spread, this.arena.width);
    const spawnY = wrapCoordinate(y + Math.sin(angle) * spread, this.arena.height);
    const body = this.createScrapPickupBody(spawnX, spawnY);
    const wrapMirrorBody = this.createScrapPickupBody(spawnX, spawnY);
    wrapMirrorBody.setVisible(false);

    this.scrapPickups.push({
      body,
      wrapMirrorBody,
      velocity: new Phaser.Math.Vector2(
        inheritedVelocity.x * SCRAP_PICKUP_INHERITED_VELOCITY + Math.cos(angle) * speed,
        inheritedVelocity.y * SCRAP_PICKUP_INHERITED_VELOCITY + Math.sin(angle) * speed
      ).limit(GAMEPLAY_MAX_VELOCITY),
      value,
      mass: SCRAP_PICKUP_MASS,
      source,
      pickupRadius: SCRAP_PICKUP_COLLECT_RADIUS * this.getResolvedPlayerStats().magnet,
      expiresAt: this.time.now + SCRAP_PICKUP_LIFETIME_MS,
      rotationSpeed: Phaser.Math.FloatBetween(0.9, 2.2) * (Phaser.Math.Between(0, 1) === 0 ? -1 : 1),
      bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2)
    });
  }

  private createScrapPickupBody(x: number, y: number): Phaser.GameObjects.Container {
    const glow = this.add.ellipse(0, 0, SCRAP_PICKUP_DISPLAY_SIZE * 1.55, SCRAP_PICKUP_DISPLAY_SIZE * 1.55, 0x73f2ff, 0.18);
    const sprite = this.add.image(0, 0, SCRAP_PICKUP_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(SCRAP_PICKUP_DISPLAY_SIZE, SCRAP_PICKUP_DISPLAY_SIZE);
    sprite.setTint(0xdaf8ff);

    const body = this.add.container(x, y, [glow, sprite]);
    body.setSize(SCRAP_PICKUP_DISPLAY_SIZE, SCRAP_PICKUP_DISPLAY_SIZE);
    body.setDepth(7);
    body.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    return body;
  }

  private updateScrapPickups(time: number, deltaSeconds: number): void {
    if (this.isPlayerDead) {
      return;
    }

    for (let i = this.scrapPickups.length - 1; i >= 0; i -= 1) {
      const scrap = this.scrapPickups[i];

      if (this.applyBlackHoleToScrap(scrap, i, deltaSeconds)) {
        continue;
      }

      if (time >= scrap.expiresAt) {
        this.destroyScrapPickup(scrap);
        this.scrapPickups.splice(i, 1);
        continue;
      }

      scrap.body.x = wrapCoordinate(scrap.body.x + scrap.velocity.x * deltaSeconds, this.arena.width);
      scrap.body.y = wrapCoordinate(scrap.body.y + scrap.velocity.y * deltaSeconds, this.arena.height);
      scrap.body.rotation += scrap.rotationSpeed * deltaSeconds;
      scrap.body.setScale(1 + Math.sin(time * 0.005 + scrap.bobPhase) * 0.08);
      this.updateToroidalRenderMirror(scrap.body, scrap.wrapMirrorBody, SCRAP_PICKUP_RADIUS);

      const offsetToPlayer = this.getWrappedDirection(scrap.body.x, scrap.body.y, this.player.x, this.player.y);

      if (offsetToPlayer.lengthSq() <= scrap.pickupRadius * scrap.pickupRadius) {
        this.collectScrapPickup(scrap);
        this.scrapPickups.splice(i, 1);
      }
    }
  }

  private applyBlackHoleToScrap(scrap: ScrapPickup, index: number, deltaSeconds: number): boolean {
    if (!this.blackHole) {
      return false;
    }

    const result = this.blackHole.applyWhirlpoolToVelocity(
      scrap.body.x,
      scrap.body.y,
      scrap.velocity,
      deltaSeconds,
      {
        ...BLACK_HOLE_SCRAP_WHIRLPOOL_TUNING,
        mass: scrap.mass
      },
      this.arena,
      this.getActiveDebugBlackHoleFieldTuning()
    );

    if (result.isInsideEventHorizon) {
      this.destroyScrapPickup(scrap);
      this.scrapPickups.splice(index, 1);
      return true;
    }

    return false;
  }

  private collectScrapPickup(scrap: ScrapPickup): void {
    this.addRunScrap(scrap.value);
    this.emitScrapPickupFeedback(scrap.body.x, scrap.body.y, scrap.value);
    this.destroyScrapPickup(scrap);
  }

  private addRunScrap(amount: number): void {
    if (amount <= 0) {
      return;
    }

    this.runScrapTotal += amount;
    this.updateGameplayHud(this.time.now);
  }

  private emitScrapPickupFeedback(x: number, y: number, value: number): void {
    const position = this.getNearestWrappedRenderPosition(x, y);
    const particleCount = Phaser.Math.Clamp(4 + Math.ceil(value / 4), 5, 12);
    const flash = this.add.circle(position.x, position.y, 9, 0x73f2ff, 0.38);

    flash.setDepth(12);
    flash.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(10, 28);
      const particle = this.add.circle(position.x, position.y, Phaser.Math.FloatBetween(1.5, 3), 0xdaf8ff, 0.82);

      particle.setDepth(12);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 180,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private destroyScrapPickup(scrap: ScrapPickup | undefined): void {
    if (!scrap) {
      return;
    }

    scrap.body.destroy(true);
    scrap.wrapMirrorBody.destroy(true);
  }

  private clearScrapPickups(): void {
    for (const scrap of this.scrapPickups) {
      this.destroyScrapPickup(scrap);
    }

    this.scrapPickups = [];
  }

  private spawnDebugScrapPickup(): void {
    if (!this.isGameplayWorldActive() || !this.player || this.isPlayerDead) {
      return;
    }

    const forward = this.getForwardDirection(this.player.rotation);
    const x = wrapCoordinate(this.player.x + forward.x * 105, this.arena.width);
    const y = wrapCoordinate(this.player.y + forward.y * 105, this.arena.height);
    this.spawnScrapPickup('debris', SCRAP_PICKUP_DEBUG_VALUE, x, y, this.playerVelocity);
  }

  private createAsteroidInstance(
    x: number,
    y: number,
    tier: AsteroidTier,
    velocity = this.createAsteroidVelocity(tier)
  ): BasicAsteroid {
    const tierConfig = ASTEROID_TIER_CONFIG[tier];
    const texture = ASTEROID_TEXTURES[Phaser.Math.Between(0, ASTEROID_TEXTURES.length - 1)];
    const body = this.createBasicAsteroid(x, y, texture.key, tierConfig.displaySize);
    const wrapMirrorBody = this.createBasicAsteroid(x, y, texture.key, tierConfig.displaySize);
    wrapMirrorBody.setVisible(false);

    return {
      body,
      wrapMirrorBody,
      variant: texture.key,
      tier,
      hp: tierConfig.hp,
      breakupProfile: this.createAsteroidBreakupProfile(tier),
      velocity,
      rotationSpeed:
        Phaser.Math.FloatBetween(ASTEROID_MIN_ROTATION_SPEED, ASTEROID_MAX_ROTATION_SPEED) *
        (Phaser.Math.Between(0, 1) === 0 ? -1 : 1),
      hitRadius: tierConfig.hitRadius,
      nextBlackHoleDamageAt: 0
    };
  }

  private createBasicAsteroid(
    x: number,
    y: number,
    textureKey: string,
    displaySize: number
  ): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, textureKey);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(displaySize, displaySize);

    const asteroid = this.add.container(x, y, [sprite]);
    asteroid.setSize(displaySize, displaySize);
    asteroid.setDepth(5);
    asteroid.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    return asteroid;
  }

  private getRandomInitialAsteroidTier(): AsteroidTier {
    return INITIAL_ASTEROID_TIERS[Phaser.Math.Between(0, INITIAL_ASTEROID_TIERS.length - 1)];
  }

  private createAsteroidVelocity(tier: AsteroidTier): Phaser.Math.Vector2 {
    const tierConfig = ASTEROID_TIER_CONFIG[tier];
    const driftAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const driftSpeed = Phaser.Math.FloatBetween(tierConfig.minSpeed, tierConfig.maxSpeed);

    return new Phaser.Math.Vector2(Math.cos(driftAngle) * driftSpeed, Math.sin(driftAngle) * driftSpeed);
  }

  private createAsteroidBreakupProfile(tier: AsteroidTier): AsteroidBreakupProfile {
    const modeRoll = Phaser.Math.Between(0, 3);
    const mode: AsteroidBreakupProfileMode =
      modeRoll === 0 ? 'many-small' : modeRoll === 1 ? 'balanced' : modeRoll === 2 ? 'few-large' : 'single-tier';
    const lowerTiers = this.getLowerAsteroidTiers(tier);

    return {
      mode,
      preferredTier:
        mode === 'single-tier' && lowerTiers.length > 0
          ? lowerTiers[Phaser.Math.Between(0, lowerTiers.length - 1)]
          : undefined,
      burstMultiplier: Phaser.Math.FloatBetween(0.85, 1.22),
      spreadMultiplier: Phaser.Math.FloatBetween(0.82, 1.28)
    };
  }

  private updatePlayerMovement(time: number, deltaSeconds: number): void {
    if (!this.player) {
      return;
    }

    if (this.isPlayerDead) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.startRun();
      }

      return;
    }

    this.updatePlayerFacing();

    const strafeLeft = this.wasdKeys.A.isDown || this.cursors.left.isDown;
    const strafeRight = this.wasdKeys.D.isDown || this.cursors.right.isDown;
    const thrustForward = this.wasdKeys.W.isDown || this.cursors.up.isDown;
    const thrustReverse = this.wasdKeys.S.isDown || this.cursors.down.isDown;
    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(-forward.y, forward.x);

    if (thrustForward) {
      this.playerVelocity.x += forward.x * this.getPlayerThrustAcceleration() * deltaSeconds;
      this.playerVelocity.y += forward.y * this.getPlayerThrustAcceleration() * deltaSeconds;
    }

    if (thrustReverse) {
      this.playerVelocity.x -= forward.x * this.getPlayerReverseThrustAcceleration() * deltaSeconds;
      this.playerVelocity.y -= forward.y * this.getPlayerReverseThrustAcceleration() * deltaSeconds;
    }

    if (strafeLeft) {
      this.playerVelocity.x -= right.x * this.getPlayerStrafeThrustAcceleration() * deltaSeconds;
      this.playerVelocity.y -= right.y * this.getPlayerStrafeThrustAcceleration() * deltaSeconds;
    }

    if (strafeRight) {
      this.playerVelocity.x += right.x * this.getPlayerStrafeThrustAcceleration() * deltaSeconds;
      this.playerVelocity.y += right.y * this.getPlayerStrafeThrustAcceleration() * deltaSeconds;
    }

    this.updateThrusterEffects(time, thrustForward, thrustReverse, strafeLeft, strafeRight);

    this.playerVelocity.scale(Math.pow(this.getSelectedShipDefinition().movement.lowFrictionDamping, deltaSeconds * 60));

    if (this.playerVelocity.lengthSq() < PLAYER_REST_SPEED * PLAYER_REST_SPEED) {
      this.playerVelocity.set(0, 0);
    }

    this.applyBlackHoleToPlayer(time, deltaSeconds);
    if (this.isPlayerDead) {
      return;
    }

    this.playerVelocity.limit(
      Math.max(
        this.getPlayerMaxSpeed(),
        this.getPlayerBlackHoleWhirlpoolTuning().maxSpeed * this.getActiveDebugBlackHoleFieldTuning().maxVelocityMultiplier
      )
    );

    this.player.x += this.playerVelocity.x * deltaSeconds;
    this.player.y += this.playerVelocity.y * deltaSeconds;
  }

  private updateDebugMenuInput(time: number): void {
    if (!this.debugMenu || !this.isDebugMenuAvailable()) {
      return;
    }

    if (this.debugMenu.isOpen() && this.isPlayerDead && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.startRun();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.debugMenuKey)) {
      if (this.isUpgradeOverlayOpen) {
        return;
      }

      if (this.debugMenu.isOpen()) {
        this.closeDebugMenu(time);
      } else {
        this.openDebugMenu(time);
      }
    }
  }

  private isDebugMenuAvailable(): boolean {
    return import.meta.env.DEV || this.debugState.collisionDebugEnabled;
  }

  private isGameplayWorldActive(): boolean {
    return this.gameFlowState === 'running' || this.gameFlowState === 'results';
  }

  private openDebugMenu(time: number): void {
    if (!this.debugMenu || this.debugMenu.isOpen() || this.isUpgradeOverlayOpen) {
      return;
    }

    this.debugMenu.open();
    this.refreshDebugMenu();
  }

  private closeDebugMenu(time: number): void {
    if (!this.debugMenu?.isOpen()) {
      return;
    }

    this.debugMenu.close();
    this.updateGameplayHud(time);
  }

  private updateUpgradeOverlayInput(time: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.minimapKey)) {
      this.isMinimapVisible = !this.isMinimapVisible;
    }

    if (this.isPlayerDead) {
      if (this.isUpgradeOverlayOpen) {
        this.closeUpgradeOverlay(time);
      }

      return;
    }

    if (!this.isUpgradeOverlayOpen) {
      if (this.bankedUpgrades > 0 && Phaser.Input.Keyboard.JustDown(this.upgradeKey)) {
        this.openUpgradeOverlay(time);
      }

      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.upgradeCancelKey)) {
      this.closeUpgradeOverlay(time);
      return;
    }

    for (let i = 0; i < this.upgradeChoiceKeys.length; i += 1) {
      if (Phaser.Input.Keyboard.JustDown(this.upgradeChoiceKeys[i])) {
        const choice = this.getUpgradeOverlayChoices()[i];

        if (choice) {
          this.selectUpgradeOverlayChoice(choice, time);
        }

        return;
      }
    }
  }

  private getActiveDebugWeaponDamageMultiplier(): number {
    return this.debugState.weaponDamageMultiplier;
  }

  private getActiveDebugWeaponFireRateMultiplier(): number {
    return this.debugState.weaponFireRateMultiplier;
  }

  private getActiveDebugBlackHoleLensOrbitSpeedMultiplier(): number {
    return this.debugBlackHoleLensOrbitSpeedMultiplier;
  }

  private getActiveDebugBlackHoleLensDensity(): number {
    return this.debugState.collisionDebugEnabled
      ? this.debugBlackHoleLensDensity
      : BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
  }

  private getActiveDebugBlackHoleLensLengthMultiplier(): number {
    return this.debugBlackHoleLensLengthMultiplier;
  }

  private getActiveDebugBlackHoleProjectionLensLayerState(): boolean {
    return this.areDebugBlackHoleProjectionLensLayersEnabled;
  }

  private getActiveDebugBlackHoleFieldTuning(isPlayer = false): BlackHoleFieldTuningConfig {
    if (isPlayer) {
      const resistance = Math.max(0.01, this.debugBlackHoleFieldTuning.playerResistance);

      return {
        ...this.debugBlackHoleFieldTuning,
        radialStrengthMultiplier: this.debugBlackHoleFieldTuning.radialStrengthMultiplier / resistance,
        swirlStrengthMultiplier: this.debugBlackHoleFieldTuning.swirlStrengthMultiplier / resistance,
        viscosityStrength: this.debugBlackHoleFieldTuning.viscosityStrength / resistance
      };
    }

    return this.debugBlackHoleFieldTuning;
  }

  private adjustStarfieldParallax(layer: 'far' | 'mid' | 'near', direction: number): void {
    const delta = direction * STARFIELD_PARALLAX_STEP;

    if (layer === 'far') {
      this.farStarfieldParallax = this.clampStarfieldParallax(this.farStarfieldParallax + delta);
    } else if (layer === 'mid') {
      this.midStarfieldParallax = this.clampStarfieldParallax(this.midStarfieldParallax + delta);
    } else {
      this.nearStarfieldParallax = this.clampStarfieldParallax(this.nearStarfieldParallax + delta);
    }

    this.applyBackgroundTilePositions();
  }

  private resetStarfieldParallax(): void {
    this.farStarfieldParallax = DEFAULT_STARFIELD_FAR_PARALLAX;
    this.midStarfieldParallax = DEFAULT_STARFIELD_MID_PARALLAX;
    this.nearStarfieldParallax = DEFAULT_STARFIELD_NEAR_PARALLAX;
    this.applyBackgroundTilePositions();
  }

  private toggleBackgroundStars(): void {
    this.backgroundStarsVisible = !this.backgroundStarsVisible;
    this.applyBackgroundStarVisibility();
  }

  private applyBackgroundStarVisibility(): void {
    if (!this.farStarfield || !this.midStarfield || !this.nearStarfield) {
      return;
    }

    this.farStarfield.setVisible(this.backgroundStarsVisible);
    this.midStarfield.setVisible(this.backgroundStarsVisible);
    this.nearStarfield.setVisible(this.backgroundStarsVisible);
  }

  private clampStarfieldParallax(value: number): number {
    return Number(Phaser.Math.Clamp(value, STARFIELD_PARALLAX_MIN, STARFIELD_PARALLAX_MAX).toFixed(2));
  }

  private openUpgradeOverlay(time: number): void {
    if (this.isUpgradeOverlayOpen || this.bankedUpgrades <= 0 || this.isPlayerDead) {
      return;
    }

    this.isUpgradeOverlayOpen = true;
    this.upgradeOverlayOpenedAt = time;
    this.refreshUpgradeOverlayText();
    this.upgradeOverlayGraphics.setVisible(true);
    this.upgradeOverlayText.setVisible(true);
    this.updateUpgradeButton();
  }

  private closeUpgradeOverlay(time: number): void {
    if (this.isUpgradeOverlayOpen) {
      const pauseDurationMs = Math.max(0, time - this.upgradeOverlayOpenedAt);
      this.totalUpgradePauseMs += pauseDurationMs;
      this.nextEnemySpawnAt += pauseDurationMs;
    }

    this.isUpgradeOverlayOpen = false;
    this.upgradeOverlayOpenedAt = 0;
    this.upgradeOverlayGraphics.setVisible(false);
    this.upgradeOverlayText.setVisible(false);
    this.updateGameplayHud(time);
    this.updateUpgradeButton();
  }

  private getUpgradeOverlayChoices(): UpgradeOverlayChoice[] {
    const secondaryChoices = this.getSecondaryWeaponChoices();
    return secondaryChoices.length > 0 ? secondaryChoices : UPGRADE_CHOICES;
  }

  private getSecondaryWeaponChoices(): SecondaryWeaponChoice[] {
    if (this.hasResolvedSecondaryWeaponChoice || this.playerWeapons.activeSecondaryWeaponId) {
      return [];
    }

    const primaryWeaponId = this.playerWeapons.activeMainWeaponId;
    const seenWeaponIds = new Set<WeaponId>();

    return shipRegistry
      .filter((ship) => this.isShipUnlocked(ship.id))
      .map((ship) => ship.startingMainWeaponId)
      .filter((weaponId): weaponId is WeaponId => {
        if (weaponId === primaryWeaponId || weaponId === this.playerWeapons.activeSecondaryWeaponId) {
          return false;
        }

        const weapon = getWeaponDefinition(weaponId);
        if (!weapon.eligibleAsSecondary || !weapon.slotCompatibility.includes('secondary') || seenWeaponIds.has(weaponId)) {
          return false;
        }

        seenWeaponIds.add(weaponId);
        return true;
      })
      .map((weaponId) => {
        const weapon = getWeaponDefinition(weaponId);

        return {
          category: 'secondary-weapon',
          weaponId,
          name: `Equip Secondary: ${weapon.displayName}`,
          description: `${weapon.description} Fills the right-click weapon slot.`
        };
      });
  }

  private selectUpgradeOverlayChoice(choice: UpgradeOverlayChoice, time: number): void {
    if (choice.category === 'secondary-weapon') {
      this.selectSecondaryWeapon(choice.weaponId, time);
      return;
    }

    this.selectUpgrade(choice, time);
  }

  private selectSecondaryWeapon(weaponId: WeaponId, time: number): void {
    if (this.bankedUpgrades <= 0 || this.playerWeapons.activeSecondaryWeaponId) {
      this.closeUpgradeOverlay(time);
      return;
    }

    this.playerWeapons.activeSecondaryWeaponId = weaponId;
    this.hasResolvedSecondaryWeaponChoice = true;
    this.playerWeapons.nextSecondaryWeaponFireAt = 0;
    this.ensureRammingShieldRuntime();
    this.bankedUpgrades -= 1;
    this.closeUpgradeOverlay(time);
  }

  private selectUpgrade(upgrade: UpgradeDefinition, time: number): void {
    if (this.bankedUpgrades <= 0) {
      this.closeUpgradeOverlay(time);
      return;
    }

    if (this.isUpgradeAtMaxLevel(upgrade)) {
      this.refreshUpgradeOverlayText();
      return;
    }

    if (upgrade.category === 'pulse') {
      this.pulseUpgradeLevels[upgrade.id as PulseUpgradeId] += 1;
    } else {
      this.applyPassiveUpgrade(upgrade.id as PassiveUpgradeId);
    }

    this.bankedUpgrades -= 1;
    this.closeUpgradeOverlay(time);
  }

  private applyPassiveUpgrade(upgradeId: PassiveUpgradeId): void {
    this.passiveUpgradeLevels[upgradeId] += 1;

    if (upgradeId === 'hull-plating') {
      this.playerHull = Math.min(this.getPlayerMaxHull(), this.playerHull + HULL_PLATING_REPAIR);
    } else if (upgradeId === 'damage-control') {
      this.playerHull = Math.min(this.getPlayerMaxHull(), this.playerHull + DAMAGE_CONTROL_REPAIR);
    }
  }

  private isUpgradeAtMaxLevel(upgrade: UpgradeDefinition): boolean {
    if (!upgrade.maxLevel || upgrade.category !== 'passive') {
      return false;
    }

    return this.passiveUpgradeLevels[upgrade.id as PassiveUpgradeId] >= upgrade.maxLevel;
  }

  private getUpgradeLevel(upgrade: UpgradeDefinition): number {
    return upgrade.category === 'pulse'
      ? this.pulseUpgradeLevels[upgrade.id as PulseUpgradeId]
      : this.passiveUpgradeLevels[upgrade.id as PassiveUpgradeId];
  }

  private getPlayerMaxHull(): number {
    return this.getResolvedPlayerStats().maxHull;
  }

  private getPlayerAccelerationMultiplier(): number {
    const baseThrust = this.getSelectedShipDefinition().baseStats.thrust;

    return baseThrust > 0 ? this.getResolvedPlayerStats().thrust / baseThrust : 1;
  }

  private getPlayerThrustAcceleration(): number {
    return this.getResolvedPlayerStats().thrust;
  }

  private getPlayerReverseThrustAcceleration(): number {
    return this.getResolvedPlayerStats().brake;
  }

  private getPlayerStrafeThrustAcceleration(): number {
    return this.getResolvedPlayerStats().strafe;
  }

  private getPlayerMaxSpeed(): number {
    return this.getResolvedPlayerStats().moveSpeed;
  }

  private getPlayerDamageInvulnerabilityMs(): number {
    return PLAYER_DAMAGE_INVULNERABILITY_MS + this.getResolvedPlayerStats().recovery;
  }

  private adjustBlackHoleLensOrbitSpeed(delta: number): void {
    this.debugBlackHoleLensOrbitSpeedMultiplier = Number(
      Phaser.Math.Clamp(
        this.debugBlackHoleLensOrbitSpeedMultiplier + delta,
        DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN,
        DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX
      ).toFixed(1)
    );
  }

  private adjustBlackHoleLensDensity(delta: number): void {
    this.debugBlackHoleLensDensity = Math.round(
      Phaser.Math.Clamp(
        this.debugBlackHoleLensDensity + delta,
        DEBUG_BLACK_HOLE_LENS_DENSITY_MIN,
        BLACK_HOLE_LENSING_ARC_MAX_COUNT
      )
    );
  }

  private adjustBlackHoleLensLength(delta: number): void {
    this.debugBlackHoleLensLengthMultiplier = Number(
      Phaser.Math.Clamp(
        this.debugBlackHoleLensLengthMultiplier + delta,
        DEBUG_BLACK_HOLE_LENS_LENGTH_MIN,
        DEBUG_BLACK_HOLE_LENS_LENGTH_MAX
      ).toFixed(1)
    );
  }

  private adjustBlackHoleInfluenceRadius(delta: number): void {
    this.debugBlackHoleInfluenceRadiusScale = this.clampBlackHoleRadiusScale(this.debugBlackHoleInfluenceRadiusScale + delta);
  }

  private adjustBlackHoleDamageRadius(delta: number): void {
    this.debugBlackHoleDamageRadiusScale = this.clampBlackHoleRadiusScale(this.debugBlackHoleDamageRadiusScale + delta);
  }

  private adjustBlackHoleVisualScale(delta: number): void {
    this.debugBlackHoleVisualScale = this.clampBlackHoleRadiusScale(this.debugBlackHoleVisualScale + delta);
  }

  private adjustBlackHoleCoreScale(delta: number): void {
    this.debugBlackHoleCoreScale = this.clampBlackHoleRadiusScale(this.debugBlackHoleCoreScale + delta);
  }

  private clampBlackHoleRadiusScale(value: number): number {
    return Number(Math.max(0, value).toFixed(1));
  }

  private adjustBlackHoleRadialStrength(delta: number): void {
    this.debugBlackHoleFieldTuning.radialStrengthMultiplier = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.radialStrengthMultiplier + delta
    );
  }

  private adjustBlackHoleRadialCurve(delta: number): void {
    this.debugBlackHoleFieldTuning.radialCurve = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.radialCurve + delta
    );
  }

  private adjustBlackHoleSwirlStrength(delta: number): void {
    this.debugBlackHoleFieldTuning.swirlStrengthMultiplier = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.swirlStrengthMultiplier + delta
    );
  }

  private adjustBlackHoleSwirlCurve(delta: number): void {
    this.debugBlackHoleFieldTuning.swirlCurve = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.swirlCurve + delta
    );
  }

  private adjustBlackHoleMassResistance(delta: number): void {
    this.debugBlackHoleFieldTuning.massResistanceMultiplier = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.massResistanceMultiplier + delta
    );
  }

  private adjustBlackHoleViscosityStrength(delta: number): void {
    this.debugBlackHoleFieldTuning.viscosityStrength = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.viscosityStrength + delta
    );
  }

  private adjustBlackHoleViscosityCurve(delta: number): void {
    this.debugBlackHoleFieldTuning.viscosityCurve = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.viscosityCurve + delta
    );
  }

  private adjustBlackHoleInnerDrag(delta: number): void {
    this.debugBlackHoleFieldTuning.innerDrag = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.innerDrag + delta
    );
  }

  private adjustBlackHolePlayerResistance(delta: number): void {
    this.debugBlackHoleFieldTuning.playerResistance = this.clampBlackHoleForceMultiplier(
      this.debugBlackHoleFieldTuning.playerResistance + delta
    );
  }

  private adjustBlackHoleMaxVelocity(delta: number): void {
    this.debugBlackHoleFieldTuning.maxVelocityMultiplier = Number(
      (this.debugBlackHoleFieldTuning.maxVelocityMultiplier + delta).toFixed(1)
    );
  }

  private clampBlackHoleForceMultiplier(value: number): number {
    return Number(value.toFixed(1));
  }

  private clampSelectedBlackHolePngLayer(): void {
    const layerCount = this.blackHole?.getPngLayerCount() ?? 0;
    this.debugSelectedBlackHolePngLayerIndex = Phaser.Math.Clamp(
      this.debugSelectedBlackHolePngLayerIndex,
      0,
      Math.max(0, layerCount - 1)
    );
  }

  private selectBlackHolePngLayer(direction: number): void {
    const layerCount = this.blackHole?.getPngLayerCount() ?? 0;

    if (layerCount <= 0) {
      this.debugSelectedBlackHolePngLayerIndex = 0;
      return;
    }

    this.debugSelectedBlackHolePngLayerIndex = Phaser.Math.Wrap(
      this.debugSelectedBlackHolePngLayerIndex + direction,
      0,
      layerCount
    );
  }

  private cycleBlackHolePngLayerImage(direction: number): void {
    this.clampSelectedBlackHolePngLayer();
    this.blackHole?.cyclePngLayerTexture(this.debugSelectedBlackHolePngLayerIndex, direction);
  }

  private cycleBlackHoleAddPngLayerImage(direction: number): void {
    const textureIndex = BLACK_HOLE_PNG_TEXTURE_KEYS.indexOf(this.debugAddBlackHolePngTextureKey);
    const nextIndex = Phaser.Math.Wrap(textureIndex + direction, 0, BLACK_HOLE_PNG_TEXTURE_KEYS.length);
    this.debugAddBlackHolePngTextureKey = BLACK_HOLE_PNG_TEXTURE_KEYS[nextIndex];
  }

  private adjustBlackHolePngLayerSpeed(delta: number): void {
    this.clampSelectedBlackHolePngLayer();
    this.blackHole?.adjustPngLayerSpeed(this.debugSelectedBlackHolePngLayerIndex, delta);
  }

  private adjustBlackHolePngLayerSize(delta: number): void {
    this.clampSelectedBlackHolePngLayer();
    this.blackHole?.adjustPngLayerSize(this.debugSelectedBlackHolePngLayerIndex, delta);
  }

  private adjustBlackHolePngLayerAlpha(delta: number): void {
    this.clampSelectedBlackHolePngLayer();
    this.blackHole?.adjustPngLayerAlpha(this.debugSelectedBlackHolePngLayerIndex, delta);
  }

  private toggleBlackHolePngLayer(): void {
    this.clampSelectedBlackHolePngLayer();
    this.blackHole?.togglePngLayer(this.debugSelectedBlackHolePngLayerIndex);
  }

  private addBlackHolePngLayer(): void {
    this.debugSelectedBlackHolePngLayerIndex = this.blackHole?.addPngLayer(this.debugAddBlackHolePngTextureKey) ?? 0;
  }

  private duplicateBlackHolePngLayer(): void {
    this.clampSelectedBlackHolePngLayer();
    this.debugSelectedBlackHolePngLayerIndex =
      this.blackHole?.duplicatePngLayer(this.debugSelectedBlackHolePngLayerIndex) ?? 0;
  }

  private removeBlackHolePngLayer(): void {
    this.clampSelectedBlackHolePngLayer();
    this.debugSelectedBlackHolePngLayerIndex =
      this.blackHole?.removePngLayer(this.debugSelectedBlackHolePngLayerIndex) ?? 0;
  }

  private saveBlackHolePngSetup(): void {
    const markdown = this.createBlackHolePngSetupMarkdown();
    const filename = `blackhole-setup-${this.getTimestampSlug()}.md`;

    this.downloadTextFile(filename, markdown, 'text/markdown');
  }

  private loadBlackHolePngSetup(): void {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.md,text/markdown,text/plain';
    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      void file.text().then((contents) => {
        this.applyBlackHolePngSetupMarkdown(contents);
        this.refreshDebugMenu();
      });
    };
    input.click();
  }

  private saveBlackHoleFieldTuning(): void {
    const markdown = this.createBlackHoleFieldTuningMarkdown();
    const filename = `blackhole-field-tuning-${this.getTimestampSlug()}.md`;

    this.downloadTextFile(filename, markdown, 'text/markdown');
  }

  private loadBlackHoleFieldTuning(): void {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.md,text/markdown,text/plain';
    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      void file.text().then((contents) => {
        this.applyBlackHoleFieldTuningMarkdown(contents);
        this.refreshDebugMenu();
      });
    };
    input.click();
  }

  private applyBlackHoleFieldTuningMarkdown(markdown: string): void {
    const setup = this.parseJsonBlock<SavedBlackHoleFieldTuningPreset>(markdown);

    if (!setup) {
      return;
    }

    if (typeof setup.influenceRadiusScale === 'number' && Number.isFinite(setup.influenceRadiusScale)) {
      this.debugBlackHoleInfluenceRadiusScale = this.clampBlackHoleRadiusScale(setup.influenceRadiusScale);
    }

    if (typeof setup.damageRadiusScale === 'number' && Number.isFinite(setup.damageRadiusScale)) {
      this.debugBlackHoleDamageRadiusScale = this.clampBlackHoleRadiusScale(setup.damageRadiusScale);
    }

    if (typeof setup.coreScale === 'number' && Number.isFinite(setup.coreScale)) {
      this.debugBlackHoleCoreScale = this.clampBlackHoleRadiusScale(setup.coreScale);
    }

    this.debugBlackHoleFieldTuning = this.normalizeBlackHoleFieldTuning(setup, this.debugBlackHoleFieldTuning);
  }

  private normalizeBlackHoleFieldTuning(
    rawTuning: SavedBlackHoleFieldTuningPreset,
    fallback: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
  ): BlackHoleFieldTuningConfig {
    return {
      radialStrengthMultiplier: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.radialStrengthMultiplier, fallback.radialStrengthMultiplier)
      ),
      radialCurve: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.radialCurve, fallback.radialCurve)
      ),
      swirlStrengthMultiplier: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.swirlStrengthMultiplier, fallback.swirlStrengthMultiplier)
      ),
      swirlCurve: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.swirlCurve, fallback.swirlCurve)
      ),
      massResistanceMultiplier: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.massResistanceMultiplier, fallback.massResistanceMultiplier)
      ),
      maxVelocityMultiplier: Number(
        this.getFiniteNumber(rawTuning.maxVelocityMultiplier, fallback.maxVelocityMultiplier).toFixed(1)
      ),
      viscosityStrength: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.viscosityStrength, fallback.viscosityStrength)
      ),
      viscosityCurve: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.viscosityCurve, fallback.viscosityCurve)
      ),
      innerDrag: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.innerDrag, fallback.innerDrag)
      ),
      playerResistance: this.clampBlackHoleForceMultiplier(
        this.getFiniteNumber(rawTuning.playerResistance, fallback.playerResistance)
      )
    };
  }

  private applyBlackHolePngSetupMarkdown(markdown: string): void {
    const setup = this.parseBlackHolePngSetupMarkdown(markdown);

    if (!setup) {
      return;
    }

    const layers = this.normalizeBlackHolePngSetupLayers(setup.layers);

    if (!layers) {
      return;
    }

    this.blackHole?.setPngLayers(layers);

    if (typeof setup.visualScale === 'number' && Number.isFinite(setup.visualScale)) {
      this.debugBlackHoleVisualScale = this.clampBlackHoleRadiusScale(setup.visualScale);
    } else if (typeof setup.fieldScale === 'number' && Number.isFinite(setup.fieldScale)) {
      this.debugBlackHoleVisualScale = this.clampBlackHoleRadiusScale(setup.fieldScale);
    }

    if (typeof setup.coreScale === 'number' && Number.isFinite(setup.coreScale)) {
      this.debugBlackHoleCoreScale = this.clampBlackHoleRadiusScale(setup.coreScale);
    }

    if (typeof setup.allLayersEnabled === 'boolean') {
      this.areDebugBlackHoleProjectionLensLayersEnabled = setup.allLayersEnabled;
    }

    if (this.isBlackHolePngTextureKey(setup.addImage)) {
      this.debugAddBlackHolePngTextureKey = setup.addImage;
    }

    const layerCount = this.blackHole?.getPngLayerCount() ?? 0;
    const selectedLayerIndex = typeof setup.selectedLayerIndex === 'number' && Number.isFinite(setup.selectedLayerIndex)
      ? setup.selectedLayerIndex
      : 0;

    this.debugSelectedBlackHolePngLayerIndex = Phaser.Math.Clamp(
      Math.trunc(selectedLayerIndex),
      0,
      Math.max(0, layerCount - 1)
    );
  }

  private parseBlackHolePngSetupMarkdown(markdown: string): SavedBlackHolePngSetup | undefined {
    return this.parseJsonBlock<SavedBlackHolePngSetup>(markdown);
  }

  private parseJsonBlock<T extends object>(markdown: string): T | undefined {
    const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)```/i);

    if (!jsonBlockMatch) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(jsonBlockMatch[1]) as unknown;

      return parsed && typeof parsed === 'object' ? (parsed as T) : undefined;
    } catch {
      return undefined;
    }
  }

  private normalizeBlackHolePngSetupLayers(rawLayers: unknown): BlackHolePngLayerConfig[] | undefined {
    if (!Array.isArray(rawLayers)) {
      return undefined;
    }

    const layers: BlackHolePngLayerConfig[] = [];

    for (const rawLayer of rawLayers) {
      if (!rawLayer || typeof rawLayer !== 'object') {
        return undefined;
      }

      const layer = rawLayer as SavedBlackHolePngLayer;

      if (!this.isBlackHolePngTextureKey(layer.image)) {
        return undefined;
      }

      layers.push({
        textureKey: layer.image,
        speedRps: this.getFiniteNumber(layer.speedRps, 0.25),
        sizeMultiplier: this.getFiniteNumber(layer.size, 1),
        alpha: this.getFiniteNumber(layer.alpha, 1),
        enabled: typeof layer.enabled === 'boolean' ? layer.enabled : true,
        initialRotation: this.getFiniteNumber(layer.initialRotation, Phaser.Math.FloatBetween(0, Math.PI * 2))
      });
    }

    return layers;
  }

  private isBlackHolePngTextureKey(value: unknown): value is BlackHolePngTextureKey {
    return typeof value === 'string' && BLACK_HOLE_PNG_TEXTURE_KEYS.includes(value as BlackHolePngTextureKey);
  }

  private getFiniteNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private createBlackHolePngSetupMarkdown(): string {
    const layers = this.blackHole?.getPngLayerSummaries() ?? [];
    const setup = {
      visualScale: this.debugBlackHoleVisualScale,
      coreScale: this.debugBlackHoleCoreScale,
      allLayersEnabled: this.areDebugBlackHoleProjectionLensLayersEnabled,
      addImage: this.debugAddBlackHolePngTextureKey,
      selectedLayerIndex: this.debugSelectedBlackHolePngLayerIndex,
      layers: layers.map((layer) => ({
        image: layer.textureKey,
        label: layer.textureLabel,
        speedRps: layer.speedRps,
        size: layer.sizeMultiplier,
        alpha: layer.alpha,
        enabled: layer.enabled,
        initialRotation: Number(layer.initialRotation.toFixed(4))
      }))
    };
    const layerRows = layers.length > 0
      ? layers
          .map(
            (layer) =>
              `| ${layer.index + 1} | ${layer.textureLabel} | ${layer.textureKey} | ${layer.speedRps.toFixed(2)} | ${layer.sizeMultiplier.toFixed(2)} | ${layer.alpha.toFixed(2)} | ${layer.enabled ? 'yes' : 'no'} |`
          )
          .join('\n')
      : '| none | | | | | | |';

    return [
      '# Black Hole PNG Setup',
      '',
      `Saved: ${new Date().toLocaleString()}`,
      '',
      '## Global Settings',
      '',
      `- Visual scale: ${this.debugBlackHoleVisualScale.toFixed(1)}`,
      `- All PNG layers enabled: ${this.areDebugBlackHoleProjectionLensLayersEnabled ? 'yes' : 'no'}`,
      `- Add image selector: ${BLACK_HOLE_PNG_TEXTURE_LABELS[this.debugAddBlackHolePngTextureKey]} (${this.debugAddBlackHolePngTextureKey})`,
      `- Selected layer index: ${this.debugSelectedBlackHolePngLayerIndex}`,
      '',
      '## Layers',
      '',
      '| # | Label | Texture key | Speed rps | Size | Alpha | Enabled |',
      '| - | - | - | -: | -: | -: | - |',
      layerRows,
      '',
      '## Machine Readable Setup',
      '',
      '```json',
      JSON.stringify(setup, null, 2),
      '```',
      ''
    ].join('\n');
  }

  private createBlackHoleFieldTuningMarkdown(): string {
    const tuning = this.debugBlackHoleFieldTuning;
    const setup = {
      influenceRadiusScale: this.debugBlackHoleInfluenceRadiusScale,
      damageRadiusScale: this.debugBlackHoleDamageRadiusScale,
      coreScale: this.debugBlackHoleCoreScale,
      ...tuning
    };

    return [
      '# Black Hole Field Tuning',
      '',
      `Saved: ${new Date().toLocaleString()}`,
      '',
      '## Settings',
      '',
      `- Influence radius: ${this.debugBlackHoleInfluenceRadiusScale.toFixed(1)}`,
      `- Damage radius: ${this.debugBlackHoleDamageRadiusScale.toFixed(1)}`,
      `- Core/event horizon: ${this.debugBlackHoleCoreScale.toFixed(1)}`,
      `- Radial strength: ${tuning.radialStrengthMultiplier.toFixed(1)}`,
      `- Radial curve: ${tuning.radialCurve.toFixed(1)}`,
      `- Swirl strength: ${tuning.swirlStrengthMultiplier.toFixed(1)}`,
      `- Swirl curve: ${tuning.swirlCurve.toFixed(1)}`,
      `- Mass resistance: ${tuning.massResistanceMultiplier.toFixed(1)}`,
      `- Max velocity: ${tuning.maxVelocityMultiplier.toFixed(1)}`,
      `- Viscosity strength: ${tuning.viscosityStrength.toFixed(1)}`,
      `- Viscosity curve: ${tuning.viscosityCurve.toFixed(1)}`,
      `- Inner drag: ${tuning.innerDrag.toFixed(1)}`,
      `- Player resistance: ${tuning.playerResistance.toFixed(1)}`,
      '',
      '## Machine Readable Setup',
      '',
      '```json',
      JSON.stringify(setup, null, 2),
      '```',
      ''
    ].join('\n');
  }

  private downloadTextFile(filename: string, contents: string, mimeType: string): void {
    const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private getTimestampSlug(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  private resetBlackHoleLensTuning(): void {
    this.debugBlackHoleLensOrbitSpeedMultiplier = DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT;
    this.debugBlackHoleLensDensity = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
    this.debugBlackHoleLensLengthMultiplier = DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT;
    this.debugBlackHoleInfluenceRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleDamageRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleVisualScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleCoreScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleFieldTuning = { ...DEFAULT_BLACK_HOLE_FIELD_TUNING };
    this.areDebugBlackHoleProjectionLensLayersEnabled = true;
    this.debugSelectedBlackHolePngLayerIndex = DEBUG_BLACK_HOLE_SELECTED_PNG_LAYER_DEFAULT;
    this.debugAddBlackHolePngTextureKey = DEBUG_BLACK_HOLE_ADD_PNG_TEXTURE_DEFAULT;
    this.blackHole?.resetPngLayers();
  }

  private createBlackHoleLensOrbitSlider(): void {
    this.blackHoleLensOrbitSliderGraphics = this.add.graphics();
    this.blackHoleLensOrbitSliderText = this.add
      .text(0, -15, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff'
      })
      .setOrigin(0.5);

    this.blackHoleLensOrbitSliderContainer = this.add
      .container(0, 0, [this.blackHoleLensOrbitSliderGraphics, this.blackHoleLensOrbitSliderText])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT)
      .setInteractive({ useHandCursor: true });

    this.input.setDraggable(this.blackHoleLensOrbitSliderContainer);
    this.blackHoleLensOrbitSliderContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleLensOrbitSliderPointer(pointer)
    );
    this.blackHoleLensOrbitSliderContainer.on('drag', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleLensOrbitSliderPointer(pointer)
    );
  }

  private handleBlackHoleLensOrbitSliderPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.debugState.collisionDebugEnabled || this.isUpgradeOverlayOpen || this.debugMenu?.isOpen() || this.isPlayerDead) {
      return;
    }

    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const localX = pointer.x - this.blackHoleLensOrbitSliderContainer.x;
    const progress = Phaser.Math.Clamp(localX - trackX, 0, DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH) /
      DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH;
    const value = Phaser.Math.Linear(
      DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN,
      DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX,
      progress
    );

    this.debugBlackHoleLensOrbitSpeedMultiplier = Number(value.toFixed(1));
    this.updateBlackHoleLensOrbitSlider();
    this.nextDebugUpdateAt = 0;
  }

  private updateBlackHoleLensOrbitSlider(): void {
    if (
      !this.blackHoleLensOrbitSliderContainer ||
      !this.blackHoleLensOrbitSliderGraphics ||
      !this.blackHoleLensOrbitSliderText
    ) {
      return;
    }

    const isVisible =
      this.debugState.collisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.debugMenu?.isOpen() && !this.isPlayerDead;
    const panelX = 16 + DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2;
    const panelY = Math.max(220, this.scale.height - 330);
    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const trackY = 10;
    const progress =
      (this.debugBlackHoleLensOrbitSpeedMultiplier - DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN) /
      (DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX - DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN);
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    const knobX = trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH * clampedProgress;

    this.blackHoleLensOrbitSliderContainer
      .setPosition(panelX, panelY)
      .setVisible(isVisible)
      .setActive(isVisible);

    this.blackHoleLensOrbitSliderText.setText(
      `Lens orbit x${this.debugBlackHoleLensOrbitSpeedMultiplier.toFixed(1)}`
    );

    this.blackHoleLensOrbitSliderGraphics.clear();
    this.blackHoleLensOrbitSliderGraphics.fillStyle(0x02040a, 0.82);
    this.blackHoleLensOrbitSliderGraphics.fillRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleLensOrbitSliderGraphics.lineStyle(1, 0x52627f, 0.72);
    this.blackHoleLensOrbitSliderGraphics.strokeRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleLensOrbitSliderGraphics.lineStyle(4, 0x24384f, 0.9);
    this.blackHoleLensOrbitSliderGraphics.lineBetween(
      trackX,
      trackY,
      trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH,
      trackY
    );
    this.blackHoleLensOrbitSliderGraphics.lineStyle(4, 0x42f5d7, 0.74);
    this.blackHoleLensOrbitSliderGraphics.lineBetween(trackX, trackY, knobX, trackY);
    this.blackHoleLensOrbitSliderGraphics.fillStyle(0xf2fbff, 0.96);
    this.blackHoleLensOrbitSliderGraphics.fillCircle(knobX, trackY, 6);
  }

  private createBlackHoleLensDensitySlider(): void {
    this.blackHoleLensDensitySliderGraphics = this.add.graphics();
    this.blackHoleLensDensitySliderText = this.add
      .text(0, -15, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff'
      })
      .setOrigin(0.5);

    this.blackHoleLensDensitySliderContainer = this.add
      .container(0, 0, [this.blackHoleLensDensitySliderGraphics, this.blackHoleLensDensitySliderText])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT)
      .setInteractive({ useHandCursor: true });

    this.input.setDraggable(this.blackHoleLensDensitySliderContainer);
    this.blackHoleLensDensitySliderContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleLensDensitySliderPointer(pointer)
    );
    this.blackHoleLensDensitySliderContainer.on('drag', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleLensDensitySliderPointer(pointer)
    );
  }

  private handleBlackHoleLensDensitySliderPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.debugState.collisionDebugEnabled || this.isUpgradeOverlayOpen || this.debugMenu?.isOpen() || this.isPlayerDead) {
      return;
    }

    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const localX = pointer.x - this.blackHoleLensDensitySliderContainer.x;
    const progress = Phaser.Math.Clamp(localX - trackX, 0, DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH) /
      DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH;
    const value = Phaser.Math.Linear(
      DEBUG_BLACK_HOLE_LENS_DENSITY_MIN,
      BLACK_HOLE_LENSING_ARC_MAX_COUNT,
      progress
    );

    this.debugBlackHoleLensDensity = Math.round(value);
    this.updateBlackHoleLensDensitySlider();
    this.nextDebugUpdateAt = 0;
  }

  private updateBlackHoleLensDensitySlider(): void {
    if (
      !this.blackHoleLensDensitySliderContainer ||
      !this.blackHoleLensDensitySliderGraphics ||
      !this.blackHoleLensDensitySliderText
    ) {
      return;
    }

    const isVisible =
      this.debugState.collisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.debugMenu?.isOpen() && !this.isPlayerDead;
    const panelX = 16 + DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2;
    const panelY = Math.max(220, this.scale.height - 330) + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP;
    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const trackY = 10;
    const progress =
      (this.debugBlackHoleLensDensity - DEBUG_BLACK_HOLE_LENS_DENSITY_MIN) /
      (BLACK_HOLE_LENSING_ARC_MAX_COUNT - DEBUG_BLACK_HOLE_LENS_DENSITY_MIN);
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    const knobX = trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH * clampedProgress;

    this.blackHoleLensDensitySliderContainer
      .setPosition(panelX, panelY)
      .setVisible(isVisible)
      .setActive(isVisible);

    this.blackHoleLensDensitySliderText.setText(`Lens density ${this.debugBlackHoleLensDensity}`);

    this.blackHoleLensDensitySliderGraphics.clear();
    this.blackHoleLensDensitySliderGraphics.fillStyle(0x02040a, 0.82);
    this.blackHoleLensDensitySliderGraphics.fillRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleLensDensitySliderGraphics.lineStyle(1, 0x52627f, 0.72);
    this.blackHoleLensDensitySliderGraphics.strokeRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleLensDensitySliderGraphics.lineStyle(4, 0x24384f, 0.9);
    this.blackHoleLensDensitySliderGraphics.lineBetween(
      trackX,
      trackY,
      trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH,
      trackY
    );
    this.blackHoleLensDensitySliderGraphics.lineStyle(4, 0x9fd8ff, 0.74);
    this.blackHoleLensDensitySliderGraphics.lineBetween(trackX, trackY, knobX, trackY);
    this.blackHoleLensDensitySliderGraphics.fillStyle(0xf2fbff, 0.96);
    this.blackHoleLensDensitySliderGraphics.fillCircle(knobX, trackY, 6);
  }

  private createBlackHoleLensLengthSlider(): void {
    this.blackHoleLensLengthSliderGraphics = this.add.graphics();
    this.blackHoleLensLengthSliderText = this.add
      .text(0, -15, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff'
      })
      .setOrigin(0.5);

    this.blackHoleLensLengthSliderContainer = this.add
      .container(0, 0, [this.blackHoleLensLengthSliderGraphics, this.blackHoleLensLengthSliderText])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT)
      .setInteractive({ useHandCursor: true });

    this.input.setDraggable(this.blackHoleLensLengthSliderContainer);
    this.blackHoleLensLengthSliderContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleLensLengthSliderPointer(pointer)
    );
    this.blackHoleLensLengthSliderContainer.on('drag', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleLensLengthSliderPointer(pointer)
    );
  }

  private handleBlackHoleLensLengthSliderPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.debugState.collisionDebugEnabled || this.isUpgradeOverlayOpen || this.debugMenu?.isOpen() || this.isPlayerDead) {
      return;
    }

    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const localX = pointer.x - this.blackHoleLensLengthSliderContainer.x;
    const progress = Phaser.Math.Clamp(localX - trackX, 0, DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH) /
      DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH;
    const value = Phaser.Math.Linear(
      DEBUG_BLACK_HOLE_LENS_LENGTH_MIN,
      DEBUG_BLACK_HOLE_LENS_LENGTH_MAX,
      progress
    );

    this.debugBlackHoleLensLengthMultiplier = Number(value.toFixed(1));
    this.updateBlackHoleLensLengthSlider();
    this.nextDebugUpdateAt = 0;
  }

  private updateBlackHoleLensLengthSlider(): void {
    if (
      !this.blackHoleLensLengthSliderContainer ||
      !this.blackHoleLensLengthSliderGraphics ||
      !this.blackHoleLensLengthSliderText
    ) {
      return;
    }

    const isVisible =
      this.debugState.collisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.debugMenu?.isOpen() && !this.isPlayerDead;
    const panelX = 16 + DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2;
    const panelY = Math.max(220, this.scale.height - 330) + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP * 2;
    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const trackY = 10;
    const progress =
      (this.debugBlackHoleLensLengthMultiplier - DEBUG_BLACK_HOLE_LENS_LENGTH_MIN) /
      (DEBUG_BLACK_HOLE_LENS_LENGTH_MAX - DEBUG_BLACK_HOLE_LENS_LENGTH_MIN);
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    const knobX = trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH * clampedProgress;

    this.blackHoleLensLengthSliderContainer
      .setPosition(panelX, panelY)
      .setVisible(isVisible)
      .setActive(isVisible);

    this.blackHoleLensLengthSliderText.setText(
      `Lens length x${this.debugBlackHoleLensLengthMultiplier.toFixed(1)}`
    );

    this.blackHoleLensLengthSliderGraphics.clear();
    this.blackHoleLensLengthSliderGraphics.fillStyle(0x02040a, 0.82);
    this.blackHoleLensLengthSliderGraphics.fillRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleLensLengthSliderGraphics.lineStyle(1, 0x52627f, 0.72);
    this.blackHoleLensLengthSliderGraphics.strokeRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleLensLengthSliderGraphics.lineStyle(4, 0x24384f, 0.9);
    this.blackHoleLensLengthSliderGraphics.lineBetween(
      trackX,
      trackY,
      trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH,
      trackY
    );
    this.blackHoleLensLengthSliderGraphics.lineStyle(4, 0xa8c7ff, 0.74);
    this.blackHoleLensLengthSliderGraphics.lineBetween(trackX, trackY, knobX, trackY);
    this.blackHoleLensLengthSliderGraphics.fillStyle(0xf2fbff, 0.96);
    this.blackHoleLensLengthSliderGraphics.fillCircle(knobX, trackY, 6);
  }

  private createBlackHoleFieldScaleSlider(): void {
    this.blackHoleFieldScaleSliderGraphics = this.add.graphics();
    this.blackHoleFieldScaleSliderText = this.add
      .text(0, -15, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff'
      })
      .setOrigin(0.5);

    this.blackHoleFieldScaleSliderContainer = this.add
      .container(0, 0, [this.blackHoleFieldScaleSliderGraphics, this.blackHoleFieldScaleSliderText])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT)
      .setInteractive({ useHandCursor: true });

    this.input.setDraggable(this.blackHoleFieldScaleSliderContainer);
    this.blackHoleFieldScaleSliderContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleFieldScaleSliderPointer(pointer)
    );
    this.blackHoleFieldScaleSliderContainer.on('drag', (pointer: Phaser.Input.Pointer) =>
      this.handleBlackHoleFieldScaleSliderPointer(pointer)
    );
  }

  private handleBlackHoleFieldScaleSliderPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.debugState.collisionDebugEnabled || this.isUpgradeOverlayOpen || this.debugMenu?.isOpen() || this.isPlayerDead) {
      return;
    }

    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const localX = pointer.x - this.blackHoleFieldScaleSliderContainer.x;
    const progress = Phaser.Math.Clamp(localX - trackX, 0, DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH) /
      DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH;
    const value = Phaser.Math.Linear(
      DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN,
      DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
      progress
    );

    this.debugBlackHoleVisualScale = Number(value.toFixed(1));
    this.updateBlackHoleFieldScaleSlider();
    this.nextDebugUpdateAt = 0;
  }

  private updateBlackHoleFieldScaleSlider(): void {
    if (
      !this.blackHoleFieldScaleSliderContainer ||
      !this.blackHoleFieldScaleSliderGraphics ||
      !this.blackHoleFieldScaleSliderText
    ) {
      return;
    }

    const isVisible =
      this.debugState.collisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.debugMenu?.isOpen() && !this.isPlayerDead;
    const panelX = 16 + DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2;
    const panelY = Math.max(220, this.scale.height - 330) + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP * 4;
    const trackX = -DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH / 2;
    const trackY = 10;
    const progress =
      (this.debugBlackHoleVisualScale - DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN) /
      (DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX - DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN);
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    const knobX = trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH * clampedProgress;

    this.blackHoleFieldScaleSliderContainer
      .setPosition(panelX, panelY)
      .setVisible(isVisible)
      .setActive(isVisible);

    this.blackHoleFieldScaleSliderText.setText(
      `Visual scale x${this.debugBlackHoleVisualScale.toFixed(1)}`
    );

    this.blackHoleFieldScaleSliderGraphics.clear();
    this.blackHoleFieldScaleSliderGraphics.fillStyle(0x02040a, 0.82);
    this.blackHoleFieldScaleSliderGraphics.fillRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleFieldScaleSliderGraphics.lineStyle(1, 0x52627f, 0.72);
    this.blackHoleFieldScaleSliderGraphics.strokeRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT / 2,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
      6
    );
    this.blackHoleFieldScaleSliderGraphics.lineStyle(4, 0x24384f, 0.9);
    this.blackHoleFieldScaleSliderGraphics.lineBetween(
      trackX,
      trackY,
      trackX + DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH,
      trackY
    );
    this.blackHoleFieldScaleSliderGraphics.lineStyle(4, 0xffc857, 0.74);
    this.blackHoleFieldScaleSliderGraphics.lineBetween(trackX, trackY, knobX, trackY);
    this.blackHoleFieldScaleSliderGraphics.fillStyle(0xf2fbff, 0.96);
    this.blackHoleFieldScaleSliderGraphics.fillCircle(knobX, trackY, 6);
  }

  private createBlackHoleProjectionLensToggle(): void {
    this.blackHoleProjectionLensToggleGraphics = this.add.graphics();
    this.blackHoleProjectionLensToggleText = this.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff'
      })
      .setOrigin(0, 0.5);

    this.blackHoleProjectionLensToggleContainer = this.add
      .container(0, 0, [this.blackHoleProjectionLensToggleGraphics, this.blackHoleProjectionLensToggleText])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH, 34)
      .setInteractive({ useHandCursor: true });

    this.blackHoleProjectionLensToggleContainer.on('pointerdown', () => {
      if (!this.debugState.collisionDebugEnabled || this.isUpgradeOverlayOpen || this.debugMenu?.isOpen() || this.isPlayerDead) {
        return;
      }

      this.areDebugBlackHoleProjectionLensLayersEnabled = !this.areDebugBlackHoleProjectionLensLayersEnabled;
      this.updateBlackHoleProjectionLensToggle();
      this.nextDebugUpdateAt = 0;
    });
  }

  private updateBlackHoleProjectionLensToggle(): void {
    if (
      !this.blackHoleProjectionLensToggleContainer ||
      !this.blackHoleProjectionLensToggleGraphics ||
      !this.blackHoleProjectionLensToggleText
    ) {
      return;
    }

    const isVisible =
      this.debugState.collisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.debugMenu?.isOpen() && !this.isPlayerDead;
    const panelX = 16 + DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2;
    const panelY = Math.max(220, this.scale.height - 330) + DEBUG_BLACK_HOLE_LENS_SLIDER_GAP * 3;
    const boxX = -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2 + 12;
    const boxY = -8;

    this.blackHoleProjectionLensToggleContainer
      .setPosition(panelX, panelY)
      .setVisible(isVisible)
      .setActive(isVisible);

    this.blackHoleProjectionLensToggleText
      .setPosition(boxX + 24, 0)
      .setText('Projection lens layers');

    this.blackHoleProjectionLensToggleGraphics.clear();
    this.blackHoleProjectionLensToggleGraphics.fillStyle(0x02040a, 0.82);
    this.blackHoleProjectionLensToggleGraphics.fillRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -17,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      34,
      6
    );
    this.blackHoleProjectionLensToggleGraphics.lineStyle(1, 0x52627f, 0.72);
    this.blackHoleProjectionLensToggleGraphics.strokeRoundedRect(
      -DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH / 2,
      -17,
      DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
      34,
      6
    );
    this.blackHoleProjectionLensToggleGraphics.fillStyle(0x071018, 0.95);
    this.blackHoleProjectionLensToggleGraphics.fillRect(boxX, boxY, 16, 16);
    this.blackHoleProjectionLensToggleGraphics.lineStyle(1, 0x9fd8ff, 0.82);
    this.blackHoleProjectionLensToggleGraphics.strokeRect(boxX, boxY, 16, 16);

    if (this.areDebugBlackHoleProjectionLensLayersEnabled) {
      this.blackHoleProjectionLensToggleGraphics.lineStyle(3, 0x42f5d7, 0.88);
      this.blackHoleProjectionLensToggleGraphics.lineBetween(boxX + 3, boxY + 8, boxX + 7, boxY + 12);
      this.blackHoleProjectionLensToggleGraphics.lineBetween(boxX + 7, boxY + 12, boxX + 13, boxY + 4);
    }
  }

  private createUpgradeButton(): void {
    this.upgradeButtonGraphics = this.add.graphics();
    this.upgradeButtonText = this.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#f2fbff'
      })
      .setOrigin(0.5);

    this.upgradeButtonContainer = this.add
      .container(this.scale.width / 2, this.scale.height - 42, [this.upgradeButtonGraphics, this.upgradeButtonText])
      .setScrollFactor(0)
      .setDepth(1002)
      .setSize(190, 42)
      .setInteractive({ useHandCursor: true });

    this.upgradeButtonContainer.on('pointerdown', () => this.handleUpgradeButtonClick());
    this.updateUpgradeButton();
  }

  private handleUpgradeButtonClick(): void {
    if (this.bankedUpgrades <= 0 || this.isPlayerDead || this.isUpgradeOverlayOpen) {
      return;
    }

    this.openUpgradeOverlay(this.time.now);
  }

  private updateUpgradeButton(): void {
    if (!this.upgradeButtonContainer || !this.upgradeButtonGraphics || !this.upgradeButtonText) {
      return;
    }

    const isVisible = this.bankedUpgrades > 0 && !this.isPlayerDead && !this.isUpgradeOverlayOpen;
    const label = this.bankedUpgrades > 1 ? `Upgrade (${this.bankedUpgrades})` : 'Upgrade';

    this.upgradeButtonContainer
      .setPosition(this.scale.width / 2, this.scale.height - 42)
      .setVisible(isVisible)
      .disableInteractive();

    if (isVisible) {
      this.upgradeButtonContainer.setInteractive({ useHandCursor: true });
    }

    this.upgradeButtonText.setText(label);
    this.upgradeButtonGraphics.clear();
    this.upgradeButtonGraphics.fillStyle(0x071018, 0.94);
    this.upgradeButtonGraphics.fillRoundedRect(-95, -21, 190, 42, 6);
    this.upgradeButtonGraphics.lineStyle(2, 0x42f5d7, 0.88);
    this.upgradeButtonGraphics.strokeRoundedRect(-95, -21, 190, 42, 6);
  }

  private createUpgradeOverlay(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const panelWidth = Math.min(width - 48, 720);
    const panelHeight = Math.min(height - 48, 430);
    const panelX = centerX - panelWidth / 2;
    const panelY = Math.max(56, height / 2 - panelHeight / 2);
    const cardX = panelX + 28;
    const cardWidth = panelWidth - 56;
    const cardHeight = 40;

    this.upgradeOverlayGraphics = this.add.graphics().setScrollFactor(0).setDepth(1200);
    this.upgradeOverlayGraphics.fillStyle(0x02040a, 0.76);
    this.upgradeOverlayGraphics.fillRect(0, 0, width, height);
    this.upgradeOverlayGraphics.fillStyle(0x071018, 0.95);
    this.upgradeOverlayGraphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    this.upgradeOverlayGraphics.lineStyle(2, 0x42f5d7, 0.75);
    this.upgradeOverlayGraphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    for (let i = 0; i < UPGRADE_CHOICES.length; i += 1) {
      const cardY = panelY + 96 + i * (cardHeight + 8);
      this.upgradeOverlayGraphics.fillStyle(0x111a24, 0.94);
      this.upgradeOverlayGraphics.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 6);
      this.upgradeOverlayGraphics.lineStyle(1, 0x52627f, 0.82);
      this.upgradeOverlayGraphics.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 6);
    }

    this.upgradeOverlayText = this.add
      .text(centerX, panelY + 28, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        color: '#f2fbff',
        align: 'left',
        fixedWidth: panelWidth - 56,
        lineSpacing: 4,
        wordWrap: { width: panelWidth - 56 }
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1201);

    this.upgradeOverlayGraphics.setVisible(false);
    this.upgradeOverlayText.setVisible(false);
  }

  private refreshUpgradeOverlayText(): void {
    const activeWeapon = this.getActiveMainWeaponDefinition();
    const damageMultiplier = this.getActiveMainWeaponDamageMultiplier();
    const cooldownSeconds = this.getActiveMainWeaponCooldownMs() / 1000;
    const speed = Math.round(this.getActiveMainWeaponProjectileSpeed());
    const choices = this.getUpgradeOverlayChoices();
    const choiceLines = choices.map((choice, index) => {
      if (choice.category === 'secondary-weapon') {
        return `${index + 1}. ${choice.name}\n   ${choice.description}`;
      }

      const level = this.getUpgradeLevel(choice);
      const maxLevel = choice.maxLevel ? `/${choice.maxLevel}` : '';
      const maxLabel = this.isUpgradeAtMaxLevel(choice) ? '  MAX' : '';

      return `${index + 1}. ${choice.name}  Lv ${level}${maxLevel}${maxLabel}\n   ${choice.description}`;
    }).join('\n\n');
    const choicePrompt = choices.length > 0 ? `Press 1-${choices.length} to choose.  Esc closes without spending.` : 'Esc closes.';

    this.upgradeOverlayText.setText(
      `UPGRADE SELECTION\n` +
        `Banked upgrades: ${this.bankedUpgrades}\n` +
        `${activeWeapon.displayName}: x${damageMultiplier.toFixed(2)} damage, ${cooldownSeconds.toFixed(2)}s cooldown, ${speed} speed\n` +
        `Ship: ${this.playerHull}/${this.getPlayerMaxHull()} hull, x${this.getPlayerAccelerationMultiplier().toFixed(2)} accel, ${(this.getPlayerDamageInvulnerabilityMs() / 1000).toFixed(2)}s i-frames\n\n` +
        `${choiceLines}\n\n` +
        choicePrompt
    );
  }

  private updatePlayerFacing(): void {
    const pointer = this.input.activePointer;
    const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const direction = this.getWrappedDirection(this.player.x, this.player.y, pointerWorld.x, pointerWorld.y);

    if (direction.lengthSq() > 0) {
      this.player.rotation = Math.atan2(direction.x, -direction.y);
    }
  }

  private updateThrusterEffects(
    time: number,
    thrustForward: boolean,
    thrustReverse: boolean,
    strafeLeft: boolean,
    strafeRight: boolean
  ): void {
    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(-forward.y, forward.x);

    if (thrustForward && time >= this.nextForwardThrusterAt) {
      this.emitThrusterParticle({ x: -10, y: 39 }, forward.clone().negate(), 1, right);
      this.emitThrusterParticle({ x: 10, y: 39 }, forward.clone().negate(), 1, right);
      this.nextForwardThrusterAt = time + FORWARD_THRUSTER_INTERVAL_MS;
    }

    if (thrustReverse && time >= this.nextReverseThrusterAt) {
      this.emitThrusterParticle({ x: -9, y: -34 }, forward, 0.62, right);
      this.emitThrusterParticle({ x: 9, y: -34 }, forward, 0.62, right);
      this.nextReverseThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeLeft && time >= this.nextLeftStrafeThrusterAt) {
      this.emitThrusterParticle({ x: 35, y: 2 }, right, 0.48, right);
      this.nextLeftStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeRight && time >= this.nextRightStrafeThrusterAt) {
      this.emitThrusterParticle({ x: -35, y: 2 }, right.clone().negate(), 0.48, right);
      this.nextRightStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }
  }

  private emitThrusterParticle(
    localOffset: { x: number; y: number },
    exhaustDirection: Phaser.Math.Vector2,
    intensity: number,
    right: Phaser.Math.Vector2
  ): void {
    const forward = this.getForwardDirection(this.player.rotation);
    const offset = this.getShipLocalOffset(localOffset.x, localOffset.y, forward, right);
    const jitter = Phaser.Math.FloatBetween(-2.2, 2.2) * intensity;
    const startX = this.player.x + offset.x + right.x * jitter;
    const startY = this.player.y + offset.y + right.y * jitter;
    const particle = this.add.circle(startX, startY, Phaser.Math.FloatBetween(2.2, 4.4) * intensity, 0x73f2ff, 0.75);
    const travel = Phaser.Math.FloatBetween(14, 26) * intensity;

    particle.setDepth(7);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: particle,
      x: startX + exhaustDirection.x * travel,
      y: startY + exhaustDirection.y * travel,
      alpha: 0,
      scale: 0.2,
      duration: THRUSTER_FADE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy()
    });
  }

  private wrapPlayer(): void {
    const wrappedX = wrapCoordinate(this.player.x, this.arena.width);
    const wrappedY = wrapCoordinate(this.player.y, this.arena.height);
    const didWrap = wrappedX !== this.player.x || wrappedY !== this.player.y;

    this.player.setPosition(wrappedX, wrappedY);

    if (didWrap) {
      this.cameras.main.centerOn(wrappedX, wrappedY);
    }
  }

  private updatePlayerContactDamage(time: number): void {
    if (this.isPlayerDead) {
      return;
    }

    const enemyContact = this.getEnemyContact();

    if (enemyContact) {
      this.resolvePlayerEnemyContact(enemyContact, time);
      return;
    }

    const asteroidContact = this.getAsteroidContact();

    if (asteroidContact) {
      this.resolvePlayerAsteroidContact(asteroidContact, time);
      return;
    }

    const debrisContact = this.getDebrisContact();

    if (debrisContact) {
      this.resolvePlayerDebrisContact(debrisContact, time);
    }
  }

  private updateRammingShield(time: number, deltaSeconds: number): void {
    if (!this.hasRammingShield() || this.isPlayerDead || this.gameFlowState !== 'running') {
      return;
    }

    updateRammingShieldRuntime(this.rammingShieldState, time, deltaSeconds);
    this.updateRammingShieldVisual(time);
  }

  private updateRammingShieldVisual(time: number): void {
    if (!this.rammingShieldImage || !this.hasRammingShield()) {
      return;
    }

    const shieldRatio = this.getRammingShieldMaxHp() > 0 ? this.rammingShieldState.hp / this.getRammingShieldMaxHp() : 0;
    const isBroken = this.rammingShieldState.hp <= 0;
    const isFlashing = time < this.rammingShieldState.impactFlashUntil;
    const alpha = isBroken ? 0.22 : 0.54 + shieldRatio * 0.28 + (isFlashing ? 0.18 : 0);
    const tint = isBroken ? 0xff5964 : isFlashing ? 0xf2fbff : 0xffffff;
    const stats = this.getRammingShieldStats();
    const areaScale = this.getResolvedPlayerStats().area;

    this.rammingShieldImage.setPosition(0, -stats.range);
    this.rammingShieldImage.setDisplaySize(stats.width * areaScale, RAMMING_SHIELD_COLLIDER_DEPTH * areaScale);
    this.rammingShieldImage.setAlpha(Math.min(1, alpha));
    this.rammingShieldImage.setTint(tint);
    this.rammingShieldImage.setVisible(true);
  }

  private getEnemyContact(): PlayerEnemyContact | undefined {
    const playerHitRadius = this.getPlayerHitRadius();
    for (const enemy of this.basicEnemies) {
      const hitHalfWidth = enemy.stats.hitHalfWidth + playerHitRadius;
      const hitHalfLength = enemy.stats.hitHalfLength + playerHitRadius;
      const shieldCollision = this.getRammingShieldCircleCollision(
        enemy.body.x,
        enemy.body.y,
        Math.max(enemy.stats.hitHalfWidth, enemy.stats.hitHalfLength)
      );
      if (shieldCollision) {
        return {
          enemy,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass,
          hitRammingShield: true
        };
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        return {
          enemy,
          normal: this.getCollisionNormal(offset),
          penetration: (1 - Math.sqrt(normalizedHit)) * Math.min(hitHalfWidth, hitHalfLength),
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass
        };
      }
    }

    for (const enemy of this.shooterEnemies) {
      const shooterHitHalfWidth = enemy.stats.hitHalfWidth + playerHitRadius;
      const shooterHitHalfLength = enemy.stats.hitHalfLength + playerHitRadius;
      const shieldCollision = this.getRammingShieldCircleCollision(
        enemy.body.x,
        enemy.body.y,
        Math.max(enemy.stats.hitHalfWidth, enemy.stats.hitHalfLength)
      );
      if (shieldCollision) {
        return {
          enemy,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass,
          hitRammingShield: true
        };
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit =
        (localX * localX) / (shooterHitHalfWidth * shooterHitHalfWidth) +
        (localY * localY) / (shooterHitHalfLength * shooterHitHalfLength);

      if (normalizedHit <= 1) {
        return {
          enemy,
          normal: this.getCollisionNormal(offset),
          penetration: (1 - Math.sqrt(normalizedHit)) * Math.min(shooterHitHalfWidth, shooterHitHalfLength),
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass
        };
      }
    }

    for (const enemy of this.tankEnemies) {
      const tankHitHalfWidth = enemy.stats.hitHalfWidth + playerHitRadius;
      const tankHitHalfLength = enemy.stats.hitHalfLength + playerHitRadius;
      const shieldCollision = this.getRammingShieldCircleCollision(
        enemy.body.x,
        enemy.body.y,
        Math.max(enemy.stats.hitHalfWidth, enemy.stats.hitHalfLength)
      );
      if (shieldCollision) {
        return {
          enemy,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass,
          hitRammingShield: true
        };
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (tankHitHalfWidth * tankHitHalfWidth) + (localY * localY) / (tankHitHalfLength * tankHitHalfLength);

      if (normalizedHit <= 1) {
        return {
          enemy,
          normal: this.getCollisionNormal(offset),
          penetration: (1 - Math.sqrt(normalizedHit)) * Math.min(tankHitHalfWidth, tankHitHalfLength),
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass
        };
      }
    }

    return undefined;
  }

  private getAsteroidContact(): PlayerAsteroidContact | undefined {
    const playerHitRadius = this.getPlayerHitRadius();

    for (const asteroid of this.basicAsteroids) {
      const shieldCollision = this.getRammingShieldCircleCollision(asteroid.body.x, asteroid.body.y, asteroid.hitRadius);
      if (shieldCollision) {
        return {
          asteroid,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: ASTEROID_CONTACT_DAMAGE_BY_TIER[asteroid.tier],
          hitRammingShield: true
        };
      }

      const offset = this.getWrappedDirection(asteroid.body.x, asteroid.body.y, this.player.x, this.player.y);
      const hitRadius = asteroid.hitRadius + playerHitRadius;

      if (offset.lengthSq() <= hitRadius * hitRadius) {
        return {
          asteroid,
          normal: this.getCollisionNormal(offset),
          penetration: hitRadius - offset.length(),
          damage: ASTEROID_CONTACT_DAMAGE_BY_TIER[asteroid.tier]
        };
      }
    }

    return undefined;
  }

  private getDebrisContact(): PlayerDebrisContact | undefined {
    const playerHitRadius = this.getPlayerHitRadius();

    for (const debris of this.enemyWreckageDebris) {
      const shieldCollision = this.getRammingShieldCircleCollision(debris.body.x, debris.body.y, debris.hitRadius);
      if (shieldCollision) {
        return {
          debris,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: debris.damage,
          hitRammingShield: true
        };
      }

      const offset = this.getWrappedDirection(debris.body.x, debris.body.y, this.player.x, this.player.y);
      const hitRadius = debris.hitRadius + playerHitRadius;

      if (offset.lengthSq() <= hitRadius * hitRadius) {
        return {
          debris,
          normal: this.getCollisionNormal(offset),
          penetration: hitRadius - offset.length(),
          damage: debris.damage
        };
      }
    }

    return undefined;
  }

  private getRammingShieldCollider(): RammingShieldCollider | undefined {
    if (!this.hasRammingShield() || this.rammingShieldState.hp <= 0) {
      return undefined;
    }

    const areaScale = this.getResolvedPlayerStats().area;
    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(-forward.y, forward.x);

    return getRammingShieldColliderData({
      playerX: this.player.x,
      playerY: this.player.y,
      arenaWidth: this.arena.width,
      arenaHeight: this.arena.height,
      areaScale,
      colliderDepth: RAMMING_SHIELD_COLLIDER_DEPTH,
      forward,
      right
    });
  }

  private getRammingShieldCircleCollision(
    targetX: number,
    targetY: number,
    targetRadius: number
  ): RammingShieldCollision | undefined {
    const collider = this.getRammingShieldCollider();
    if (!collider) {
      return undefined;
    }

    const collision = getRammingShieldCircleCollisionResult({
      collider,
      targetRadius,
      offsetFromShield: this.getWrappedDirection(collider.centerX, collider.centerY, targetX, targetY)
    });

    if (!collision) {
      return undefined;
    }

    const normal = this.getCollisionNormal(this.getWrappedDirection(targetX, targetY, this.player.x, this.player.y));

    return {
      normal,
      penetration: collision.penetration
    };
  }

  private resolvePlayerEnemyContact(contact: PlayerEnemyContact, time: number): void {
    this.applyPlayerEnemyKnockback(contact, time);
    if (contact.hitRammingShield) {
      this.applyRammingShieldImpact(contact.enemy.body, time, () => this.damageRammedEnemy(contact.enemy, time));
      this.blockDamageWithRammingShield(contact.damage, time, contact.enemy.body.x, contact.enemy.body.y);
      return;
    }

    if (time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitShipCollisionImpactExplosion(impact.x, impact.y);
      this.damagePlayer(contact.damage, time, impact.x, impact.y);
    }
  }

  private resolvePlayerAsteroidContact(contact: PlayerAsteroidContact, time: number): void {
    this.applyPlayerAsteroidKnockback(contact, time);
    if (contact.hitRammingShield) {
      this.applyRammingShieldImpact(contact.asteroid.body, time, () => this.damageRammedAsteroid(contact.asteroid, time));
      this.blockDamageWithRammingShield(contact.damage, time, contact.asteroid.body.x, contact.asteroid.body.y);
      return;
    }

    if (time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitAsteroidImpactExplosion(impact.x, impact.y, contact.asteroid.tier);
      this.damagePlayer(contact.damage, time, impact.x, impact.y);
    }
  }

  private resolvePlayerDebrisContact(contact: PlayerDebrisContact, time: number): void {
    this.applyPlayerDebrisKnockback(contact, time);
    if (contact.hitRammingShield) {
      this.applyRammingShieldImpact(contact.debris.body, time, () => this.damageRammedDebris(contact.debris, time));
      this.blockDamageWithRammingShield(contact.damage, time, contact.debris.body.x, contact.debris.body.y);
      return;
    }

    if (time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitShipCollisionImpactExplosion(impact.x, impact.y);
      this.damagePlayer(contact.damage, time, impact.x, impact.y);
    }
  }

  private applyRammingShieldImpact(
    target: Phaser.GameObjects.GameObject,
    time: number,
    damageTarget: () => void
  ): void {
    if (this.hasRammingShield() && this.rammingShieldState.hp > 0 && canApplyRammingShieldDamage(this.rammingShieldState, target, time)) {
      damageTarget();
      markRammingShieldDamageApplied(this.rammingShieldState, target, time);
    }
  }

  private getRammingShieldDamage(time = this.time.now): number {
    return getRammingShieldDamageValue(this.rammingShieldState, this.playerVelocity.length(), time, this.getResolvedPlayerStats());
  }

  private damageEnemy(enemy: BasicEnemy | ShooterEnemy | TankEnemy, damage: number): void {
    enemy.hp -= Math.max(1, damage - enemy.stats.defense);
  }

  private blockDamageWithRammingShield(damage: number, time: number, impactX: number, impactY: number): boolean {
    if (!this.hasRammingShield() || this.rammingShieldState.hp <= 0 || damage <= 0) {
      return false;
    }

    if (this.debugState.playerInvulnerable) {
      this.playerInvulnerableUntil = Number.MAX_SAFE_INTEGER;
      return true;
    }

    if (time < this.rammingShieldState.nextBlockDamageAt) {
      return true;
    }

    damageRammingShield(this.rammingShieldState, damage, time);
    this.rammingShieldState.nextBlockDamageAt = time + this.getPlayerDamageInvulnerabilityMs();
    this.updateRammingShieldVisual(time);
    this.emitRammingShieldDamageFeedback(impactX, impactY);
    this.updateGameplayHud(time);

    return true;
  }

  private emitRammingShieldDamageFeedback(impactX: number, impactY: number): void {
    const effectPosition = this.getNearestWrappedRenderPosition(impactX, impactY);
    const particleCount = 9;
    const flash = this.add.circle(effectPosition.x, effectPosition.y, 14, 0x42f5d7, 0.42);

    flash.setDepth(13);
    flash.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.4,
      duration: 130,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(14, 38);
      const particle = this.add.circle(
        effectPosition.x,
        effectPosition.y,
        Phaser.Math.FloatBetween(2, 4),
        0x42f5d7,
        0.82
      );

      particle.setDepth(13);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: effectPosition.x + Math.cos(angle) * distance,
        y: effectPosition.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 220,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private damageRammedEnemy(enemy: BasicEnemy | ShooterEnemy | TankEnemy, time: number): void {
    const damage = this.getRammingShieldDamage(time);
    if (damage <= 0) {
      return;
    }

    this.damageEnemy(enemy, damage);
    this.emitShipCollisionImpactExplosion(enemy.body.x, enemy.body.y);

    const basicIndex = this.basicEnemies.indexOf(enemy as BasicEnemy);
    if (basicIndex >= 0) {
      if (enemy.hp <= 0) {
        this.spawnEnemyWreckageDebris(
          'chaser',
          enemy.body.x,
          enemy.body.y,
          (enemy as BasicEnemy).velocity.clone().add((enemy as BasicEnemy).knockbackVelocity).add((enemy as BasicEnemy).blackHoleVelocity)
        );
        this.spawnScrapPickup(
          'enemy',
          enemy.stats.scrapValue,
          enemy.body.x,
          enemy.body.y,
          (enemy as BasicEnemy).velocity.clone().add((enemy as BasicEnemy).knockbackVelocity).add((enemy as BasicEnemy).blackHoleVelocity)
        );
        enemy.body.destroy(true);
        enemy.wrapMirrorBody.destroy(true);
        this.basicEnemies.splice(basicIndex, 1);
        this.grantXp(enemy.stats.xpValue);
      } else {
        this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
      }

      return;
    }

    const tankIndex = this.tankEnemies.indexOf(enemy as TankEnemy);
    if (tankIndex >= 0) {
      const tank = enemy as TankEnemy;
      if (tank.hp <= 0) {
        this.spawnEnemyWreckageDebris(
          'tank',
          tank.body.x,
          tank.body.y,
          tank.velocity.clone().add(tank.knockbackVelocity).add(tank.blackHoleVelocity)
        );
        this.spawnScrapPickup(
          'enemy',
          tank.stats.scrapValue,
          tank.body.x,
          tank.body.y,
          tank.velocity.clone().add(tank.knockbackVelocity).add(tank.blackHoleVelocity)
        );
        tank.body.destroy(true);
        tank.wrapMirrorBody.destroy(true);
        this.tankEnemies.splice(tankIndex, 1);
        this.grantXp(tank.stats.xpValue);
      } else {
        this.flashDamageSprites(tank.body, tank.wrapMirrorBody);
      }

      return;
    }

    const shooterIndex = this.shooterEnemies.indexOf(enemy as ShooterEnemy);
    if (shooterIndex >= 0) {
      const shooter = enemy as ShooterEnemy;
      if (shooter.hp <= 0) {
        this.spawnEnemyWreckageDebris(
          'shooter',
          shooter.body.x,
          shooter.body.y,
          shooter.velocity.clone().add(shooter.knockbackVelocity).add(shooter.blackHoleVelocity)
        );
        this.spawnScrapPickup(
          'enemy',
          shooter.stats.scrapValue,
          shooter.body.x,
          shooter.body.y,
          shooter.velocity.clone().add(shooter.knockbackVelocity).add(shooter.blackHoleVelocity)
        );
        shooter.body.destroy(true);
        shooter.wrapMirrorBody.destroy(true);
        this.shooterEnemies.splice(shooterIndex, 1);
        this.grantXp(shooter.stats.xpValue);
      } else {
        this.flashDamageSprites(shooter.body, shooter.wrapMirrorBody);
      }
    }
  }

  private damageRammedDebris(debris: EnemyWreckageDebris, time: number): void {
    const damage = this.getRammingShieldDamage(time);
    if (damage <= 0) {
      return;
    }

    debris.hp -= damage;
    this.emitShipCollisionImpactExplosion(debris.body.x, debris.body.y);

    if (debris.hp <= 0) {
      const index = this.enemyWreckageDebris.indexOf(debris);
      this.spawnScrapPickup('debris', SCRAP_PICKUP_VALUE_FROM_DEBRIS, debris.body.x, debris.body.y, debris.velocity);
      this.destroyEnemyWreckageDebris(debris, true);
      if (index >= 0) {
        this.enemyWreckageDebris.splice(index, 1);
      }
    } else {
      this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
    }
  }

  private damageRammedAsteroid(asteroid: BasicAsteroid, time: number): void {
    const damage = this.getRammingShieldDamage(time);
    if (damage <= 0) {
      return;
    }

    asteroid.hp -= damage;
    this.emitAsteroidImpactExplosion(asteroid.body.x, asteroid.body.y, asteroid.tier);

    const index = this.basicAsteroids.indexOf(asteroid);
    if (asteroid.hp <= 0 && index >= 0) {
      this.destroyBasicAsteroid(index);
    } else {
      this.flashDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
      this.applyRammingShieldAsteroidImpulse(asteroid);
    }
  }

  private applyRammingShieldAsteroidImpulse(asteroid: BasicAsteroid): void {
    const impactDirection = this.getWrappedDirection(this.player.x, this.player.y, asteroid.body.x, asteroid.body.y);
    if (impactDirection.lengthSq() <= 0.0001) {
      return;
    }

    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];
    impactDirection.normalize();
    asteroid.velocity.x += impactDirection.x * tierConfig.impactImpulse;
    asteroid.velocity.y += impactDirection.y * tierConfig.impactImpulse;
    asteroid.velocity.limit(tierConfig.maxVelocity);
  }

  private applyPlayerEnemyKnockback(contact: PlayerEnemyContact, time: number): void {
    const normal = contact.normal;
    const playerMass = this.getPlayerMass();
    const playerShare = this.getMassResponseShare(contact.mass, playerMass);
    const enemyShare = this.getMassResponseShare(playerMass, contact.mass);
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * playerShare);
    this.nudgeWrappedObject(contact.enemy.body, normal, -separation * enemyShare);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    const impulse = this.getContactImpulse(normal, contact.enemy.velocity.clone().add(contact.enemy.knockbackVelocity));

    this.playerVelocity.x += normal.x * impulse * playerShare;
    this.playerVelocity.y += normal.y * impulse * playerShare;
    this.playerVelocity.limit(this.getPlayerMaxSpeed());
    contact.enemy.knockbackVelocity.x -= normal.x * impulse * enemyShare * ENEMY_CONTACT_RESTITUTION_SHARE;
    contact.enemy.knockbackVelocity.y -= normal.y * impulse * enemyShare * ENEMY_CONTACT_RESTITUTION_SHARE;
    contact.enemy.knockbackVelocity.limit(GAMEPLAY_MAX_VELOCITY);
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private applyPlayerAsteroidKnockback(contact: PlayerAsteroidContact, time: number): void {
    const normal = contact.normal;
    const asteroidMass = this.getAsteroidMass(contact.asteroid.tier);
    const playerMass = this.getPlayerMass();
    const playerShare = this.getMassResponseShare(asteroidMass, playerMass);
    const asteroidShare = this.getMassResponseShare(playerMass, asteroidMass);
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * playerShare);
    this.nudgeWrappedObject(contact.asteroid.body, normal, -separation * asteroidShare);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    const impulse = this.getContactImpulse(normal, contact.asteroid.velocity);

    this.playerVelocity.x += normal.x * impulse * playerShare;
    this.playerVelocity.y += normal.y * impulse * playerShare;
    this.playerVelocity.limit(this.getPlayerMaxSpeed());
    contact.asteroid.velocity.x -= normal.x * impulse * asteroidShare;
    contact.asteroid.velocity.y -= normal.y * impulse * asteroidShare;
    contact.asteroid.velocity.limit(ASTEROID_TIER_CONFIG[contact.asteroid.tier].maxVelocity);
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private applyPlayerDebrisKnockback(contact: PlayerDebrisContact, time: number): void {
    const normal = contact.normal;
    const playerMass = this.getPlayerMass();
    const playerShare = this.getMassResponseShare(contact.debris.mass, playerMass);
    const debrisShare = this.getMassResponseShare(playerMass, contact.debris.mass);
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * playerShare);
    this.nudgeWrappedObject(contact.debris.body, normal, -separation * debrisShare);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    const impulse = this.getContactImpulse(normal, contact.debris.velocity);

    this.playerVelocity.x += normal.x * impulse * playerShare;
    this.playerVelocity.y += normal.y * impulse * playerShare;
    this.playerVelocity.limit(this.getPlayerMaxSpeed());
    contact.debris.velocity.x -= normal.x * impulse * debrisShare;
    contact.debris.velocity.y -= normal.y * impulse * debrisShare;
    contact.debris.velocity.limit(GAMEPLAY_MAX_VELOCITY);
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private getAsteroidMass(tier: AsteroidTier): number {
    return ASTEROID_TIER_CONFIG[tier].massBudget;
  }

  private getMassResponseShare(otherMass: number, selfMass: number): number {
    return otherMass / (selfMass + otherMass);
  }

  private getContactImpulse(normal: Phaser.Math.Vector2, otherVelocity: Phaser.Math.Vector2): number {
    const relativeVelocity = this.playerVelocity.clone().subtract(otherVelocity);
    const closingSpeed = Math.max(0, -relativeVelocity.dot(normal));

    return Phaser.Math.Clamp(
      PLAYER_CONTACT_MIN_IMPULSE + closingSpeed * PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
      PLAYER_CONTACT_MIN_IMPULSE,
      PLAYER_CONTACT_MAX_IMPULSE
    );
  }

  private getCollisionNormal(offset: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    if (offset.lengthSq() > 0.0001) {
      return offset.clone().normalize();
    }

    if (this.playerVelocity.lengthSq() > 0.0001) {
      return this.playerVelocity.clone().normalize();
    }

    return new Phaser.Math.Vector2(1, 0);
  }

  private nudgeWrappedObject(
    object: Phaser.GameObjects.Container,
    normal: Phaser.Math.Vector2,
    distance: number
  ): void {
    object.setPosition(
      wrapCoordinate(object.x + normal.x * distance, this.arena.width),
      wrapCoordinate(object.y + normal.y * distance, this.arena.height)
    );
  }

  private getPlayerContactImpactPoint(normal: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const playerHitRadius = this.getPlayerHitRadius();

    return new Phaser.Math.Vector2(
      wrapCoordinate(this.player.x - normal.x * playerHitRadius, this.arena.width),
      wrapCoordinate(this.player.y - normal.y * playerHitRadius, this.arena.height)
    );
  }

  private damagePlayer(
    damage: number,
    time: number,
    impactX = this.player.x,
    impactY = this.player.y,
    options: { bypassShield?: boolean; bypassDefense?: boolean } = {}
  ): void {
    if (this.debugState.playerInvulnerable) {
      this.playerInvulnerableUntil = Number.MAX_SAFE_INTEGER;
      return;
    }

    const hullDamage = options.bypassDefense ? damage : Math.max(1, damage - this.getResolvedPlayerStats().defense);
    this.playerInvulnerableUntil = time + this.getPlayerDamageInvulnerabilityMs();
    if (hullDamage <= 0) {
      this.updateGameplayHud(time);
      return;
    }

    this.playerHull = Math.max(0, this.playerHull - hullDamage);
    this.emitPlayerDamageFeedback(impactX, impactY);
    this.updateGameplayHud(time);

    if (this.playerHull <= 0) {
      this.killPlayer();
    }
  }

  private grantXp(amount: number): void {
    if (this.isPlayerDead || amount <= 0) {
      return;
    }

    this.playerXp += amount;

    while (this.playerXp >= this.nextXpThreshold) {
      this.playerXp -= this.nextXpThreshold;
      this.bankedUpgrades += 1;
      this.nextXpThreshold = Math.ceil(this.nextXpThreshold * XP_THRESHOLD_GROWTH);
    }

    this.updateGameplayHud(this.time.now);
  }

  private emitPlayerDamageFeedback(impactX = this.player.x, impactY = this.player.y): void {
    const effectPosition = this.getNearestWrappedRenderPosition(impactX, impactY);
    const particleCount = 10;

    this.playerSprite.setTint(0xff5964);

    this.tweens.add({
      targets: this.playerSprite,
      alpha: 0.45,
      yoyo: true,
      repeat: 1,
      duration: PLAYER_DAMAGE_FLASH_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.isPlayerDead) {
          this.playerSprite.clearTint();
          this.playerSprite.setAlpha(1);
        }
      }
    });

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(16, 42);
      const particle = this.add.circle(
        effectPosition.x,
        effectPosition.y,
        Phaser.Math.FloatBetween(2, 4),
        0xff6f7f,
        0.78
      );

      particle.setDepth(12);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: effectPosition.x + Math.cos(angle) * distance,
        y: effectPosition.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: 240,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private updatePlayerDamageVisuals(time: number): void {
    if (this.isPlayerDead) {
      return;
    }

    if (this.debugState.playerInvulnerable || time >= this.playerInvulnerableUntil) {
      this.player.setVisible(true);
      return;
    }

    this.player.setVisible(Math.floor(time / 85) % 2 === 0);
  }

  private killPlayer(): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead) {
      return;
    }

    this.isPlayerDead = true;
    this.gameFlowState = 'results';
    this.playerHull = 0;
    this.lastRunScrapTotal = this.runScrapTotal;
    this.lastRunSurvivalMs = this.getSurvivalElapsedMs(this.time.now);
    this.payRunCredits();
    this.playerVelocity.set(0, 0);
    this.player.setVisible(true);
    this.playerSprite.setTint(0xff5964);
    this.playerSprite.setAlpha(0.62);
    this.updateGameplayHud(this.time.now);
    this.showResultsScreen();
  }

  private restorePlayerHull(): void {
    if (!this.isGameplayWorldActive() || !this.player) {
      return;
    }

    this.playerHull = this.getPlayerMaxHull();
    this.isPlayerDead = false;
    this.player.setVisible(true);
    this.playerSprite.clearTint();
    this.playerSprite.setAlpha(1);

    if (this.debugState.playerInvulnerable) {
      this.playerInvulnerableUntil = Number.MAX_SAFE_INTEGER;
    } else {
      this.playerInvulnerableUntil = 0;
    }

    this.destroyResultsScreen();
    this.updateGameplayHud(this.time.now);
  }

  private payRunCredits(): void {
    if (this.hasPaidRunCredits) {
      return;
    }

    this.lastRunCreditsEarned = Math.floor(
      this.lastRunScrapTotal * SCRAP_TO_CREDIT_RATE * this.getScrapCreditMultiplier()
    );
    this.totalCredits += this.lastRunCreditsEarned;
    this.hasPaidRunCredits = true;
  }

  private getScrapCreditMultiplier(): number {
    return this.getResolvedPlayerStats().greed;
  }

  private showResultsScreen(): void {
    this.gameFlowState = 'results';
    this.destroyResultsScreen();

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(width - 48, 520);
    const panelHeight = Math.min(height - 48, 430);
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;
    const elapsedSeconds = Math.max(0, Math.floor(this.lastRunSurvivalMs / 1000));

    const background = this.add.graphics();
    background.fillStyle(0x02040a, 0.78);
    background.fillRect(-width / 2, -height / 2, width, height);
    background.fillStyle(0x071018, 0.96);
    background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    background.lineStyle(2, 0x42f5d7, 0.82);
    background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    const text = this.add
      .text(
        0,
        panelY + 28,
        `RUN RESULTS\n\n` +
          `Survival time        ${this.formatSurvivalTime(elapsedSeconds)}\n` +
          `Scrap collected      ${this.lastRunScrapTotal}\n` +
          `Credits earned       ${this.lastRunCreditsEarned}\n` +
          `Total credits        ${this.totalCredits}\n\n` +
          `Conversion: ${SCRAP_TO_CREDIT_RATE} scrap = ${SCRAP_TO_CREDIT_RATE} credit x${this.getScrapCreditMultiplier().toFixed(2)}\n` +
          `Press R to restart`,
        {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '18px',
          color: '#f2fbff',
          align: 'left',
          fixedWidth: panelWidth - 64,
          lineSpacing: 5
        }
      )
      .setOrigin(0.5, 0);

    this.resultsScreen = this.add
      .container(centerX, centerY, [background, text])
      .setScrollFactor(0)
      .setDepth(1250);

    this.addScreenButton(this.resultsScreen, this.resultsActionZones, centerX, centerY, 0, panelY + panelHeight - 150, 220, 38, 'Restart Run', () =>
      this.startRun()
    );
    this.addScreenButton(this.resultsScreen, this.resultsActionZones, centerX, centerY, 0, panelY + panelHeight - 104, 220, 38, 'Main Menu', () =>
      this.showMainMenu()
    );
    this.addScreenButton(this.resultsScreen, this.resultsActionZones, centerX, centerY, 0, panelY + panelHeight - 58, 220, 38, 'Shop', () =>
      this.showShop('results')
    );
    if (!this.debugMenu) {
      this.createDebugMenu();
    }
  }

  private updateBasicEnemies(deltaSeconds: number): void {
    for (let i = this.basicEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.basicEnemies[i];
      const direction = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      enemy.velocity.set(0, 0);

      if (direction.lengthSq() > 0) {
        direction.normalize();
        enemy.velocity.set(direction.x * enemy.stats.moveSpeed, direction.y * enemy.stats.moveSpeed);
        enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      }

      if (this.applyBlackHoleToBasicEnemy(enemy, i, deltaSeconds, this.time.now)) {
        continue;
      }

      const totalVelocity = enemy.velocity.clone().add(enemy.knockbackVelocity).add(enemy.blackHoleVelocity).limit(GAMEPLAY_MAX_VELOCITY);

      enemy.body.x = wrapCoordinate(
        enemy.body.x + totalVelocity.x * deltaSeconds,
        this.arena.width
      );
      enemy.body.y = wrapCoordinate(
        enemy.body.y + totalVelocity.y * deltaSeconds,
        this.arena.height
      );
      enemy.knockbackVelocity.scale(Math.pow(ENEMY_KNOCKBACK_DAMPING, deltaSeconds * 60));
      this.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, BASIC_ENEMY_DISPLAY_SIZE * 0.5);
    }
  }

  private updateShooterEnemies(time: number, deltaSeconds: number): void {
    for (let i = this.shooterEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.shooterEnemies[i];
      const offsetToPlayer = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      const distance = offsetToPlayer.length();

      enemy.velocity.set(0, 0);

      if (distance > 0) {
        const directionToPlayer = offsetToPlayer.clone().scale(1 / distance);

        enemy.body.rotation = Math.atan2(directionToPlayer.x, -directionToPlayer.y);

        if (distance > enemy.stats.preferredRange) {
          enemy.velocity.set(
            directionToPlayer.x * enemy.stats.moveSpeed,
            directionToPlayer.y * enemy.stats.moveSpeed
          );
        } else if (distance < enemy.stats.retreatThreshold) {
          enemy.velocity.set(
            -directionToPlayer.x * enemy.stats.moveSpeed * 0.72,
            -directionToPlayer.y * enemy.stats.moveSpeed * 0.72
          );
        }

        if (!this.isPlayerDead && time >= enemy.nextFireAt) {
          this.fireShooterProjectile(enemy, directionToPlayer, time);
          enemy.nextFireAt = time + enemy.stats.attackCooldown * 1000;
        }
      }

      if (this.applyBlackHoleToShooterEnemy(enemy, i, deltaSeconds, time)) {
        continue;
      }

      const totalVelocity = enemy.velocity
        .clone()
        .add(enemy.knockbackVelocity)
        .add(enemy.blackHoleVelocity)
        .limit(GAMEPLAY_MAX_VELOCITY);

      enemy.body.x = wrapCoordinate(enemy.body.x + totalVelocity.x * deltaSeconds, this.arena.width);
      enemy.body.y = wrapCoordinate(enemy.body.y + totalVelocity.y * deltaSeconds, this.arena.height);
      enemy.knockbackVelocity.scale(Math.pow(ENEMY_KNOCKBACK_DAMPING, deltaSeconds * 60));
      this.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, SHOOTER_ENEMY_DISPLAY_SIZE * 0.5);
    }
  }

  private updateTankEnemies(deltaSeconds: number): void {
    for (let i = this.tankEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.tankEnemies[i];
      const direction = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      enemy.velocity.set(0, 0);

      if (direction.lengthSq() > 0) {
        direction.normalize();
        enemy.velocity.set(direction.x * enemy.stats.moveSpeed, direction.y * enemy.stats.moveSpeed);
        enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      }

      if (this.applyBlackHoleToTankEnemy(enemy, i, deltaSeconds, this.time.now)) {
        continue;
      }

      const totalVelocity = enemy.velocity.clone().add(enemy.knockbackVelocity).add(enemy.blackHoleVelocity).limit(GAMEPLAY_MAX_VELOCITY);

      enemy.body.x = wrapCoordinate(enemy.body.x + totalVelocity.x * deltaSeconds, this.arena.width);
      enemy.body.y = wrapCoordinate(enemy.body.y + totalVelocity.y * deltaSeconds, this.arena.height);
      enemy.knockbackVelocity.scale(Math.pow(ENEMY_KNOCKBACK_DAMPING, deltaSeconds * 60));
      this.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, TANK_ENEMY_DISPLAY_SIZE * 0.5);
    }
  }

  private fireShooterProjectile(enemy: ShooterEnemy, direction: Phaser.Math.Vector2, time: number): void {
    const spawnDistance = SHOOTER_ENEMY_DISPLAY_SIZE * 0.42;
    const spawnX = wrapCoordinate(enemy.body.x + direction.x * spawnDistance, this.arena.width);
    const spawnY = wrapCoordinate(enemy.body.y + direction.y * spawnDistance, this.arena.height);
    const rotation = Math.atan2(direction.x, -direction.y);
    const body = this.createEnemyProjectile(spawnX, spawnY, rotation, enemy.stats.projectileSize);
    const wrapMirrorBody = this.createEnemyProjectile(spawnX, spawnY, rotation, enemy.stats.projectileSize);
    wrapMirrorBody.setVisible(false);

    this.enemyProjectiles.push({
      body,
      wrapMirrorBody,
      velocity: direction.clone().scale(enemy.stats.projectileSpeed),
      speed: enemy.stats.projectileSpeed,
      damage: enemy.stats.attackDamage,
      hitRadius: enemy.stats.projectileSize,
      expiresAt: time + enemy.stats.projectileLifetimeSeconds * 1000,
      distanceRemaining: enemy.stats.projectileRange
    });
  }

  private createEnemyProjectile(x: number, y: number, rotation: number, hitRadius = SHOOTER_PROJECTILE_HIT_RADIUS): Phaser.GameObjects.Container {
    const visualSize = hitRadius * 2.2;
    const glow = this.add.ellipse(0, 0, visualSize, visualSize, 0xff5964, 0.28);
    const body = this.add.ellipse(0, 0, hitRadius * 1.1, hitRadius * 1.78, 0xff8f4f, 0.94);
    body.setStrokeStyle(1, 0xfff0b8, 0.86);

    const projectile = this.add.container(x, y, [glow, body]);

    projectile.setSize(visualSize, visualSize);
    projectile.setRotation(rotation);
    projectile.setDepth(8);

    return projectile;
  }

  private updateEnemyProjectiles(time: number, deltaSeconds: number): void {
    if (this.isPlayerDead) {
      return;
    }

    for (let i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.enemyProjectiles[i];
      this.applyProjectileGravity(projectile, deltaSeconds);
      const travelDistance = projectile.speed * deltaSeconds;

      projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * deltaSeconds, this.arena.width);
      projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * deltaSeconds, this.arena.height);
      projectile.distanceRemaining -= travelDistance;
      this.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, projectile.hitRadius);

      if (projectile.capturedByBlackHole) {
        if (this.updateCapturedProjectile(projectile, deltaSeconds, projectile.hitRadius)) {
          this.destroyEnemyProjectile(projectile);
          this.enemyProjectiles.splice(i, 1);
        }

        continue;
      }

      if (this.tryHitPlayerWithEnemyProjectile(projectile, time)) {
        this.destroyEnemyProjectile(projectile);
        this.enemyProjectiles.splice(i, 1);
      } else if (time >= projectile.expiresAt || projectile.distanceRemaining <= 0) {
        this.destroyEnemyProjectile(projectile);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private tryHitPlayerWithEnemyProjectile(projectile: EnemyProjectile, time: number): boolean {
    if (this.isPlayerDead) {
      return false;
    }

    const shieldCollision = this.getRammingShieldCircleCollision(
      projectile.body.x,
      projectile.body.y,
      projectile.hitRadius
    );
    if (shieldCollision) {
      this.blockDamageWithRammingShield(projectile.damage, time, projectile.body.x, projectile.body.y);
      return true;
    }

    const offset = this.getWrappedDirection(projectile.body.x, projectile.body.y, this.player.x, this.player.y);
    const hitRadius = this.getPlayerHitRadius() + projectile.hitRadius;

    if (offset.lengthSq() > hitRadius * hitRadius) {
      return false;
    }

    if (time >= this.playerInvulnerableUntil) {
      this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
      this.damagePlayer(projectile.damage, time, projectile.body.x, projectile.body.y);
    }

    return true;
  }

  private destroyEnemyProjectile(projectile: EnemyProjectile): void {
    projectile.body.destroy(true);
    projectile.wrapMirrorBody.destroy(true);
  }

  private updateBasicAsteroids(deltaSeconds: number): void {
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;

    for (let i = this.basicAsteroids.length - 1; i >= 0; i -= 1) {
      const asteroid = this.basicAsteroids[i];
      this.validateAsteroidRenderState(asteroid);

      if (this.applyBlackHoleToAsteroid(asteroid, i, deltaSeconds, this.time.now)) {
        continue;
      }

      asteroid.body.x = wrapCoordinate(asteroid.body.x + asteroid.velocity.x * deltaSeconds, this.arena.width);
      asteroid.body.y = wrapCoordinate(asteroid.body.y + asteroid.velocity.y * deltaSeconds, this.arena.height);
      asteroid.body.rotation += asteroid.rotationSpeed * deltaSeconds;
      this.updateAsteroidWrapMirror(asteroid);
    }
  }

  private getActiveMainWeaponDefinition(): WeaponRegistryEntry {
    return getActiveMainWeaponDefinition(this.playerWeapons);
  }

  private getActiveSecondaryWeaponDefinition(): WeaponRegistryEntry | undefined {
    return getActiveSecondaryWeaponDefinition(this.playerWeapons);
  }

  private getPlayerWeaponUpgradeState(): PlayerWeaponUpgradeState {
    return {
      projectileDamageLevel: this.pulseUpgradeLevels['pulse-damage-1'],
      projectileFireRateLevel: this.pulseUpgradeLevels['pulse-fire-rate-1'],
      projectileVelocityLevel: this.pulseUpgradeLevels['pulse-velocity-1']
    };
  }

  private getActiveMainWeaponDamageMultiplier(): number {
    return getPlayerWeaponDamageMultiplier(this.getPlayerWeaponUpgradeState()) * this.getResolvedPlayerStats().damage;
  }

  private getActiveMainWeaponCooldownMs(): number {
    return getPlayerWeaponCooldownMs(
      this.getActiveMainWeaponDefinition(),
      this.getPlayerWeaponUpgradeState(),
      this.getResolvedPlayerStats(),
      {
        damageMultiplier: this.getActiveDebugWeaponDamageMultiplier(),
        fireRateMultiplier: this.getActiveDebugWeaponFireRateMultiplier()
      }
    );
  }

  private getActiveMainWeaponBaseCooldownMs(): number {
    return getPlayerWeaponBaseCooldownMs(this.getActiveMainWeaponDefinition(), this.getPlayerWeaponUpgradeState());
  }

  private getActiveMainWeaponProjectileSpeed(): number {
    return getPlayerWeaponProjectileSpeed(
      this.getActiveMainWeaponDefinition(),
      this.getPlayerWeaponUpgradeState(),
      this.getResolvedPlayerStats()
    );
  }

  private getActiveMainWeaponUpgradeHudSummary(): string {
    const damageLevel = this.pulseUpgradeLevels['pulse-damage-1'];
    const fireRateLevel = this.pulseUpgradeLevels['pulse-fire-rate-1'];
    const velocityLevel = this.pulseUpgradeLevels['pulse-velocity-1'];

    if (damageLevel + fireRateLevel + velocityLevel === 0) {
      return 'Weapon upgrades none';
    }

    return `Weapon upgrades D${damageLevel} R${fireRateLevel} V${velocityLevel}`;
  }

  private updateActiveMainWeapon(time: number): void {
    if (this.isPlayerDead || this.isUpgradeOverlayOpen) {
      return;
    }

    const isPrimaryFiring = this.fireKey.isDown || this.input.activePointer.leftButtonDown();
    if (isPrimaryFiring && time >= this.playerWeapons.nextMainWeaponFireAt) {
      const result = this.usePlayerWeapon(this.getActiveMainWeaponDefinition(), time);
      this.playerWeapons.nextMainWeaponFireAt = time + result.cooldownMs;
    }

    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    if (secondaryWeapon && this.input.activePointer.rightButtonDown() && time >= this.playerWeapons.nextSecondaryWeaponFireAt) {
      const result = this.usePlayerWeapon(secondaryWeapon, time);
      this.playerWeapons.nextSecondaryWeaponFireAt = time + result.cooldownMs;
    }
  }

  private usePlayerWeapon(weapon: WeaponRegistryEntry, time: number): { cooldownMs: number } {
    if (weapon.behaviorType === 'ramming-shield') {
      return { cooldownMs: this.useRammingShieldWeapon(time) ? this.getRammingShieldStats().contactCooldownMs : 0 };
    }

    return this.fireProjectileWeapon(weapon, time);
  }

  private useRammingShieldWeapon(time: number): boolean {
    if (!this.hasRammingShield()) {
      return false;
    }

    const stats = this.getRammingShieldStats();
    if (!activateRammingShieldDash(this.rammingShieldState, time, this.getResolvedPlayerStats())) {
      return false;
    }

    const direction = this.getForwardDirection(this.player.rotation);
    this.playerVelocity.x += direction.x * stats.dashImpulse;
    this.playerVelocity.y += direction.y * stats.dashImpulse;
    this.updateRammingShieldVisual(time);
    return true;
  }

  private fireProjectileWeapon(weapon: WeaponRegistryEntry, time: number): { cooldownMs: number } {
    if (!isProjectileWeapon(weapon) || !weapon.projectileVisual) {
      return { cooldownMs: 0 };
    }

    const projectileConfig = getPlayerWeaponProjectileConfig(
      weapon,
      this.getPlayerWeaponUpgradeState(),
      this.getResolvedPlayerStats(),
      {
        damageMultiplier: this.getActiveDebugWeaponDamageMultiplier(),
        fireRateMultiplier: this.getActiveDebugWeaponFireRateMultiplier()
      }
    );
    const direction = this.getForwardDirection(this.player.rotation);
    const spawnX = this.player.x + direction.x * PLAYER_PROJECTILE_MUZZLE_OFFSET;
    const spawnY = this.player.y + direction.y * PLAYER_PROJECTILE_MUZZLE_OFFSET;

    for (let index = 0; index < projectileConfig.projectileCount; index += 1) {
      const spreadOffset = index - (projectileConfig.projectileCount - 1) / 2;
      const projectileRotation = this.player.rotation + spreadOffset * 0.08;
      const projectileDirection = this.getForwardDirection(projectileRotation);
      const body = this.createPlayerProjectile(spawnX, spawnY, projectileRotation, weapon, projectileConfig.projectileAreaScale);
      const wrapMirrorBody = this.createPlayerProjectile(
        spawnX,
        spawnY,
        projectileRotation,
        weapon,
        projectileConfig.projectileAreaScale
      );
      wrapMirrorBody.setVisible(false);

      this.playerProjectiles.push({
        body,
        wrapMirrorBody,
        velocity: projectileDirection.scale(projectileConfig.projectileSpeed),
        speed: projectileConfig.projectileSpeed,
        damage: projectileConfig.damage,
        hitRadius: PLAYER_PROJECTILE_HIT_RADIUS * projectileConfig.projectileAreaScale,
        pierceRemaining: projectileConfig.pierce,
        piercedTargets: new WeakSet<object>(),
        expiresAt: time + projectileConfig.projectileLifetimeMs,
        distanceRemaining: projectileConfig.projectileRange,
        nextTrailAt: time,
        trailColor: weapon.projectileVisual.trailColor
      });
    }

    return { cooldownMs: projectileConfig.cooldownMs };
  }

  private createPlayerProjectile(
    x: number,
    y: number,
    rotation: number,
    weapon: WeaponRegistryEntry,
    areaScale = 1
  ): Phaser.GameObjects.Container {
    const visual = weapon.projectileVisual;
    if (!visual) {
      throw new Error(`${weapon.displayName} does not define projectile visuals.`);
    }

    const glow = this.add.ellipse(0, 0, visual.width * areaScale, visual.height * areaScale, visual.glowColor, visual.glowAlpha);
    const body = this.add.ellipse(0, 0, visual.width * 0.44 * areaScale, visual.height * 0.63 * areaScale, visual.bodyColor, 1);
    body.setStrokeStyle(1, visual.bodyStrokeColor, 0.95);

    const projectile = this.add.container(x, y, [glow, body]);

    projectile.setSize(visual.width * areaScale, visual.height * areaScale);
    projectile.setRotation(rotation);
    projectile.setDepth(8);

    return projectile;
  }

  private updatePlayerProjectiles(time: number, deltaSeconds: number): void {
    if (this.isPlayerDead) {
      return;
    }

    for (let i = this.playerProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.playerProjectiles[i];
      this.applyProjectileGravity(projectile, deltaSeconds);
      const travelDistance = projectile.speed * deltaSeconds;

      projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * deltaSeconds, this.arena.width);
      projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * deltaSeconds, this.arena.height);
      projectile.distanceRemaining -= travelDistance;
      this.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, PLAYER_PROJECTILE_MUZZLE_OFFSET);

      if (projectile.capturedByBlackHole) {
        if (this.updateCapturedProjectile(projectile, deltaSeconds, PLAYER_PROJECTILE_MUZZLE_OFFSET)) {
          this.destroyPlayerProjectile(projectile);
          this.playerProjectiles.splice(i, 1);
        }

        continue;
      }

      const didHitTarget =
        !this.isPlayerDead &&
        (
          this.tryHitBasicEnemy(projectile) ||
          this.tryHitShooterEnemy(projectile) ||
          this.tryHitTankEnemy(projectile) ||
          this.tryHitEnemyWreckageDebris(projectile) ||
          this.tryHitBasicAsteroid(projectile)
        );

      if (didHitTarget && this.shouldDestroyProjectileAfterHit(projectile)) {
        this.destroyPlayerProjectile(projectile);
        this.playerProjectiles.splice(i, 1);
      } else if (time >= projectile.expiresAt || projectile.distanceRemaining <= 0) {
        this.destroyPlayerProjectile(projectile);
        this.playerProjectiles.splice(i, 1);
      } else if (time >= projectile.nextTrailAt) {
        this.emitPlayerProjectileTrail(projectile);
        projectile.nextTrailAt = time + PLAYER_PROJECTILE_TRAIL_INTERVAL_MS;
      }
    }
  }

  private shouldDestroyProjectileAfterHit(projectile: PlayerProjectile): boolean {
    if (projectile.pierceRemaining <= 0) {
      return true;
    }

    projectile.pierceRemaining -= 1;
    return false;
  }

  private emitPlayerProjectileTrail(projectile: PlayerProjectile): void {
    const movementDirection = projectile.velocity.clone().normalize();
    const trailDirection = movementDirection.clone().negate();
    const sideDirection = new Phaser.Math.Vector2(-movementDirection.y, movementDirection.x);
    const jitter = Phaser.Math.FloatBetween(-2.4, 2.4);
    const x = projectile.body.x + trailDirection.x * PLAYER_PROJECTILE_TRAIL_OFFSET + sideDirection.x * jitter;
    const y = projectile.body.y + trailDirection.y * PLAYER_PROJECTILE_TRAIL_OFFSET + sideDirection.y * jitter;
    const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(2.2, 4.2), projectile.trailColor, 0.7);

    particle.setDepth(7);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: particle,
      x: x + trailDirection.x * 12,
      y: y + trailDirection.y * 12,
      alpha: 0,
      scale: 0.18,
      duration: PLAYER_PROJECTILE_TRAIL_FADE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy()
    });
  }

  private destroyPlayerProjectile(projectile: PlayerProjectile): void {
    projectile.body.destroy(true);
    projectile.wrapMirrorBody.destroy(true);
  }

  private clearPlayerProjectiles(): void {
    for (const projectile of this.playerProjectiles) {
      this.destroyPlayerProjectile(projectile);
    }

    this.playerProjectiles = [];
  }

  private clearEnemyProjectiles(): void {
    for (const projectile of this.enemyProjectiles) {
      this.destroyEnemyProjectile(projectile);
    }

    this.enemyProjectiles = [];
  }

  private applyProjectileGravity(projectile: PlayerProjectile | EnemyProjectile, deltaSeconds: number): void {
    if (!this.blackHole) {
      return;
    }

    this.blackHole.applyProjectileGravity(projectile, deltaSeconds, this.arena, this.getActiveDebugBlackHoleFieldTuning());
  }

  private updateCapturedProjectile(
    projectile: PlayerProjectile | EnemyProjectile,
    deltaSeconds: number,
    mirrorViewRadius: number
  ): boolean {
    if (!this.blackHole) {
      return false;
    }

    const isConsumed = this.blackHole.updateCapturedProjectile(projectile, deltaSeconds, this.arena);
    this.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, mirrorViewRadius);

    return isConsumed;
  }

  private flashDamageSprites(...containers: Phaser.GameObjects.Container[]): void {
    for (const container of containers) {
      if (!container.scene) {
        continue;
      }

      for (const child of container.list) {
        if (child instanceof Phaser.GameObjects.Image) {
          child.setTintFill(0xffffff);

          this.tweens.add({
            targets: child,
            alpha: 0.9,
            yoyo: true,
            duration: DAMAGE_FLASH_MS * 0.5,
            ease: 'Quad.easeOut',
            onComplete: () => {
              child.clearTint();
              child.setAlpha(1);
            }
          });
        }
      }
    }
  }

  private emitShipBulletImpactExplosion(x: number, y: number): void {
    const effectPosition = this.getNearestWrappedRenderPosition(x, y);
    const particleCount = 10;
    const flash = this.add.circle(effectPosition.x, effectPosition.y, 10, 0xf2fbff, 0.58);

    flash.setDepth(12);
    flash.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.1,
      duration: 110,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(12, 30);
      const particle = this.add.circle(
        effectPosition.x,
        effectPosition.y,
        Phaser.Math.FloatBetween(1.8, 3.4),
        Phaser.Utils.Array.GetRandom([0xf2fbff, 0xfff0b8, 0x73f2ff]),
        0.9
      );

      particle.setDepth(12);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: effectPosition.x + Math.cos(angle) * distance,
        y: effectPosition.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.18,
        duration: 145,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private emitShipCollisionImpactExplosion(x: number, y: number): void {
    const effectPosition = this.getNearestWrappedRenderPosition(x, y);
    const particleCount = 9;

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(16, 42);
      const particle = this.add.circle(
        effectPosition.x,
        effectPosition.y,
        Phaser.Math.FloatBetween(2.2, 4.2),
        Phaser.Utils.Array.GetRandom([0xff5964, 0xff8f4f, 0xffc857]),
        0.86
      );

      particle.setDepth(11);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: effectPosition.x + Math.cos(angle) * distance,
        y: effectPosition.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: ENEMY_IMPACT_EXPLOSION_MS,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private emitAsteroidImpactExplosion(x: number, y: number, tier: AsteroidTier): void {
    const effectPosition = this.getNearestWrappedRenderPosition(x, y);
    x = effectPosition.x;
    y = effectPosition.y;
    const tierConfig = ASTEROID_TIER_CONFIG[tier];
    const particleCount = Phaser.Math.Clamp(tier * 2 + 5, 7, 15);
    const flashRadius = Math.max(12, tierConfig.hitRadius * 0.34);
    const flash = this.add.circle(x, y, flashRadius, 0xf2fbff, 0.18);
    const ring = this.add.circle(x, y, flashRadius * 0.78, 0xf2fbff, 0);
    const dust = this.add.circle(x, y, Math.max(14, tierConfig.hitRadius * 0.38), 0xc2ad8f, 0.34);

    flash.setDepth(12);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    ring.setStrokeStyle(2, 0xf2fbff, 0.62);
    ring.setDepth(12);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    dust.setDepth(11);

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(14, 28 + tier * 5);
      const particle = this.add.circle(
        x,
        y,
        Phaser.Math.FloatBetween(2.2, 4.8),
        Phaser.Utils.Array.GetRandom([0x9b8b75, 0xc2ad8f, 0xe4d6bd, 0xfff2d2, 0xf2fbff]),
        0.92
      );

      particle.setDepth(12);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.25,
        duration: ASTEROID_IMPACT_EXPLOSION_MS,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.35,
      duration: ASTEROID_IMPACT_EXPLOSION_MS * 0.65,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.75,
      duration: ASTEROID_IMPACT_EXPLOSION_MS,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    this.tweens.add({
      targets: dust,
      alpha: 0,
      scale: 1.85,
      duration: ASTEROID_IMPACT_EXPLOSION_MS * 1.15,
      ease: 'Quad.easeOut',
      onComplete: () => dust.destroy()
    });
  }

  private emitAsteroidBreakupFeedback(x: number, y: number, tier: AsteroidTier): void {
    const effectPosition = this.getNearestWrappedRenderPosition(x, y);
    x = effectPosition.x;
    y = effectPosition.y;
    const tierConfig = ASTEROID_TIER_CONFIG[tier];
    const ring = this.add.circle(x, y, tierConfig.hitRadius * 0.62, 0x9fd8ff, 0);
    const particleCount = Phaser.Math.Clamp(tier * 5, 6, 25);

    ring.setStrokeStyle(2, 0x73f2ff, 0.56);
    ring.setDepth(6);
    ring.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.75,
      duration: ASTEROID_BREAKUP_FEEDBACK_MS,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    for (let i = 0; i < particleCount; i += 1) {
      const angle = (Math.PI * 2 * i) / particleCount + Phaser.Math.FloatBetween(-0.18, 0.18);
      const distance = Phaser.Math.FloatBetween(tierConfig.hitRadius * 0.35, tierConfig.hitRadius * 1.18);
      const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(1.8, 4.2), 0x8fb6c8, 0.72);

      particle.setDepth(6);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(220, ASTEROID_BREAKUP_FEEDBACK_MS),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private tryHitBasicEnemy(projectile: PlayerProjectile): boolean {
    for (let i = this.basicEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.basicEnemies[i];
      const hitHalfWidth = enemy.stats.hitHalfWidth + projectile.hitRadius;
      const hitHalfLength = enemy.stats.hitHalfLength + projectile.hitRadius;
      if (projectile.piercedTargets.has(enemy.body)) {
        continue;
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        projectile.piercedTargets.add(enemy.body);
        this.damageEnemy(enemy, projectile.damage);

        if (enemy.hp <= 0) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          this.spawnEnemyWreckageDebris(
            'chaser',
            enemy.body.x,
            enemy.body.y,
            enemy.velocity.clone().add(enemy.knockbackVelocity).add(enemy.blackHoleVelocity)
          );
          this.spawnScrapPickup(
            'enemy',
            enemy.stats.scrapValue,
            enemy.body.x,
            enemy.body.y,
            enemy.velocity.clone().add(enemy.knockbackVelocity).add(enemy.blackHoleVelocity)
          );
          enemy.body.destroy(true);
          enemy.wrapMirrorBody.destroy(true);
          this.basicEnemies.splice(i, 1);
          this.grantXp(enemy.stats.xpValue);
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }

        return true;
      }
    }

    return false;
  }

  private tryHitShooterEnemy(projectile: PlayerProjectile): boolean {
    for (let i = this.shooterEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.shooterEnemies[i];
      const hitHalfWidth = enemy.stats.hitHalfWidth + projectile.hitRadius;
      const hitHalfLength = enemy.stats.hitHalfLength + projectile.hitRadius;
      if (projectile.piercedTargets.has(enemy.body)) {
        continue;
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        projectile.piercedTargets.add(enemy.body);
        this.damageEnemy(enemy, projectile.damage);

        if (enemy.hp <= 0) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          this.spawnEnemyWreckageDebris(
            'shooter',
            enemy.body.x,
            enemy.body.y,
            enemy.velocity.clone().add(enemy.blackHoleVelocity)
          );
          this.spawnScrapPickup(
            'enemy',
            enemy.stats.scrapValue,
            enemy.body.x,
            enemy.body.y,
            enemy.velocity.clone().add(enemy.blackHoleVelocity)
          );
          enemy.body.destroy(true);
          enemy.wrapMirrorBody.destroy(true);
          this.shooterEnemies.splice(i, 1);
          this.grantXp(enemy.stats.xpValue);
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }

        return true;
      }
    }

    return false;
  }

  private tryHitTankEnemy(projectile: PlayerProjectile): boolean {
    for (let i = this.tankEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.tankEnemies[i];
      const hitHalfWidth = enemy.stats.hitHalfWidth + projectile.hitRadius;
      const hitHalfLength = enemy.stats.hitHalfLength + projectile.hitRadius;
      if (projectile.piercedTargets.has(enemy.body)) {
        continue;
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        projectile.piercedTargets.add(enemy.body);
        this.damageEnemy(enemy, projectile.damage);

        if (enemy.hp <= 0) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          this.spawnEnemyWreckageDebris(
            'tank',
            enemy.body.x,
            enemy.body.y,
            enemy.velocity.clone().add(enemy.knockbackVelocity).add(enemy.blackHoleVelocity)
          );
          this.spawnScrapPickup(
            'enemy',
            enemy.stats.scrapValue,
            enemy.body.x,
            enemy.body.y,
            enemy.velocity.clone().add(enemy.knockbackVelocity).add(enemy.blackHoleVelocity)
          );
          enemy.body.destroy(true);
          enemy.wrapMirrorBody.destroy(true);
          this.tankEnemies.splice(i, 1);
          this.grantXp(enemy.stats.xpValue);
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }

        return true;
      }
    }

    return false;
  }

  private tryHitEnemyWreckageDebris(projectile: PlayerProjectile): boolean {
    for (let i = this.enemyWreckageDebris.length - 1; i >= 0; i -= 1) {
      const debris = this.enemyWreckageDebris[i];
      if (projectile.piercedTargets.has(debris.body)) {
        continue;
      }

      const offset = this.getWrappedDirection(debris.body.x, debris.body.y, projectile.body.x, projectile.body.y);
      const hitRadius = debris.hitRadius + projectile.hitRadius;

      if (offset.lengthSq() <= hitRadius * hitRadius) {
        projectile.piercedTargets.add(debris.body);
        debris.hp -= projectile.damage;

        if (debris.hp <= 0) {
          this.spawnScrapPickup('debris', SCRAP_PICKUP_VALUE_FROM_DEBRIS, debris.body.x, debris.body.y, debris.velocity);
          this.destroyEnemyWreckageDebris(debris, true);
          this.enemyWreckageDebris.splice(i, 1);
        } else {
          this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }

        return true;
      }
    }

    return false;
  }

  private tryHitBasicAsteroid(projectile: PlayerProjectile): boolean {
    for (let i = this.basicAsteroids.length - 1; i >= 0; i -= 1) {
      const asteroid = this.basicAsteroids[i];
      if (projectile.piercedTargets.has(asteroid.body)) {
        continue;
      }

      const offset = this.getWrappedDirection(asteroid.body.x, asteroid.body.y, projectile.body.x, projectile.body.y);
      const hitRadius = asteroid.hitRadius + projectile.hitRadius;

      if (offset.lengthSq() <= hitRadius * hitRadius) {
        projectile.piercedTargets.add(asteroid.body);
        asteroid.hp -= projectile.damage;

        if (asteroid.hp <= 0) {
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier);
          this.destroyBasicAsteroid(i);
        } else {
          this.flashDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier);
          this.applyAsteroidImpact(asteroid, projectile);
        }

        return true;
      }
    }

    return false;
  }

  private applyAsteroidImpact(asteroid: BasicAsteroid, projectile: PlayerProjectile): void {
    const impactDirection = projectile.velocity.clone().normalize();
    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];

    asteroid.velocity.x += impactDirection.x * tierConfig.impactImpulse;
    asteroid.velocity.y += impactDirection.y * tierConfig.impactImpulse;
    asteroid.velocity.limit(tierConfig.maxVelocity);
  }

  private destroyBasicAsteroid(index: number, grantReward = true): void {
    const asteroid = this.basicAsteroids[index];
    const x = asteroid.body.x;
    const y = asteroid.body.y;
    const velocity = asteroid.velocity.clone();
    const fragmentTiers = this.createAsteroidFragmentTiers(asteroid.tier, asteroid.breakupProfile);

    if (grantReward) {
      this.grantXp(ASTEROID_XP_REWARD_BY_TIER[asteroid.tier]);
      this.spawnScrapPickup('asteroid', SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER[asteroid.tier], x, y, velocity);
    }

    this.emitAsteroidBreakupFeedback(x, y, asteroid.tier);
    asteroid.body.destroy(true);
    asteroid.wrapMirrorBody.destroy(true);
    this.basicAsteroids.splice(index, 1);

    if (fragmentTiers.length > 0) {
      this.spawnAsteroidFragments(x, y, velocity, asteroid.breakupProfile, fragmentTiers);
    }
  }

  private consumeBasicAsteroid(index: number): void {
    const asteroid = this.basicAsteroids[index];

    asteroid.body.destroy(true);
    asteroid.wrapMirrorBody.destroy(true);
    this.basicAsteroids.splice(index, 1);
  }

  private clearAsteroids(): void {
    for (const asteroid of this.basicAsteroids) {
      asteroid.body.destroy(true);
      asteroid.wrapMirrorBody.destroy(true);
    }

    this.basicAsteroids = [];
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;
  }

  private spawnAsteroidFragments(
    x: number,
    y: number,
    parentVelocity: Phaser.Math.Vector2,
    breakupProfile: AsteroidBreakupProfile,
    fragmentTiers: AsteroidTier[]
  ): void {
    const baseAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    for (let i = 0; i < fragmentTiers.length; i += 1) {
      const fragmentTier = fragmentTiers[i];
      const fragmentConfig = ASTEROID_TIER_CONFIG[fragmentTier];
      const angle =
        baseAngle +
        (Math.PI * 2 * i) / fragmentTiers.length +
        Phaser.Math.FloatBetween(-0.22, 0.22);
      const offsetDistance =
        Phaser.Math.FloatBetween(8, fragmentConfig.displaySize * 0.38) * breakupProfile.spreadMultiplier;
      const burstSpeed =
        Phaser.Math.FloatBetween(ASTEROID_FRAGMENT_BURST_MIN_SPEED, ASTEROID_FRAGMENT_BURST_MAX_SPEED) *
        breakupProfile.burstMultiplier;
      const velocity = parentVelocity
        .clone()
        .scale(ASTEROID_PARENT_VELOCITY_INHERITANCE)
        .add(new Phaser.Math.Vector2(Math.cos(angle) * burstSpeed, Math.sin(angle) * burstSpeed));

      velocity.limit(fragmentConfig.maxVelocity);

      this.basicAsteroids.push(
        this.createAsteroidInstance(
          wrapCoordinate(x + Math.cos(angle) * offsetDistance, this.arena.width),
          wrapCoordinate(y + Math.sin(angle) * offsetDistance, this.arena.height),
          fragmentTier,
          velocity
        )
      );
    }
  }

  private createAsteroidFragmentTiers(
    parentTier: AsteroidTier,
    breakupProfile: AsteroidBreakupProfile
  ): AsteroidTier[] {
    if (parentTier === 1) {
      return [];
    }

    if (breakupProfile.mode === 'single-tier' && breakupProfile.preferredTier) {
      return this.createSingleTierAsteroidFragments(parentTier, breakupProfile.preferredTier);
    }

    const mixedMode = breakupProfile.mode === 'single-tier' ? 'balanced' : breakupProfile.mode;
    const fragments: AsteroidTier[] = [];
    let remainingMass = ASTEROID_TIER_CONFIG[parentTier].massBudget;

    while (remainingMass > 0) {
      const validTiers = this.getLowerAsteroidTiers(parentTier).filter(
        (tier) => ASTEROID_TIER_CONFIG[tier].massBudget <= remainingMass
      );

      if (validTiers.length === 0) {
        break;
      }

      const tier = this.pickAsteroidFragmentTier(validTiers, mixedMode);
      fragments.push(tier);
      remainingMass -= ASTEROID_TIER_CONFIG[tier].massBudget;
    }

    return fragments;
  }

  private createSingleTierAsteroidFragments(parentTier: AsteroidTier, fragmentTier: AsteroidTier): AsteroidTier[] {
    const parentMass = ASTEROID_TIER_CONFIG[parentTier].massBudget;
    const fragmentMass = ASTEROID_TIER_CONFIG[fragmentTier].massBudget;
    const fragmentCount = Math.floor(parentMass / fragmentMass);

    return Array.from({ length: fragmentCount }, () => fragmentTier);
  }

  private pickAsteroidFragmentTier(
    validTiers: AsteroidTier[],
    mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
  ): AsteroidTier {
    const weightedTiers: AsteroidTier[] = [];

    for (const tier of validTiers) {
      const weight = this.getAsteroidFragmentTierWeight(tier, validTiers, mode);

      for (let i = 0; i < weight; i += 1) {
        weightedTiers.push(tier);
      }
    }

    return weightedTiers[Phaser.Math.Between(0, weightedTiers.length - 1)];
  }

  private getAsteroidFragmentTierWeight(
    tier: AsteroidTier,
    validTiers: AsteroidTier[],
    mode: Exclude<AsteroidBreakupProfileMode, 'single-tier'>
  ): number {
    const minTier = Math.min(...validTiers);
    const maxTier = Math.max(...validTiers);

    if (mode === 'many-small') {
      return maxTier - tier + 1;
    }

    if (mode === 'few-large') {
      return tier - minTier + 1;
    }

    return 1;
  }

  private getLowerAsteroidTiers(tier: AsteroidTier): AsteroidTier[] {
    return ASTEROID_TIERS.filter((candidateTier) => candidateTier < tier);
  }

  private updateAsteroidWrapMirror(asteroid: BasicAsteroid): void {
    const mirrorState = this.updateToroidalRenderMirror(asteroid.body, asteroid.wrapMirrorBody, asteroid.hitRadius);

    if (mirrorState.baseVisible) {
      this.asteroidCameraViewCount += 1;
    }

    if (mirrorState.baseVisible || mirrorState.mirrorVisible) {
      this.asteroidWrappedViewCount += 1;
    }

    if (mirrorState.showMirror) {
      this.asteroidWrapMirrorCount += 1;
    }
  }

  private updateToroidalRenderMirror(
    source: Phaser.GameObjects.Container,
    mirror: Phaser.GameObjects.Container,
    viewRadius: number
  ): { baseVisible: boolean; mirrorVisible: boolean; showMirror: boolean } {
    const camera = this.cameras.main;
    const cameraCenterX = camera.scrollX + camera.width / 2;
    const cameraCenterY = camera.scrollY + camera.height / 2;
    const mirrorX = this.getNearestWrappedRenderCoordinate(source.x, cameraCenterX, this.arena.width);
    const mirrorY = this.getNearestWrappedRenderCoordinate(source.y, cameraCenterY, this.arena.height);
    const baseVisible = this.isCircleInCameraView(source.x, source.y, viewRadius);
    const mirrorVisible = this.isCircleInCameraView(mirrorX, mirrorY, viewRadius);
    const showMirror = source.visible && (mirrorX !== source.x || mirrorY !== source.y) && mirrorVisible;

    mirror.setPosition(mirrorX, mirrorY);
    mirror.setRotation(source.rotation);
    mirror.setScale(source.scaleX, source.scaleY);
    mirror.setAlpha(source.alpha);
    mirror.setVisible(showMirror);

    return { baseVisible, mirrorVisible, showMirror };
  }

  private getNearestWrappedRenderCoordinate(value: number, cameraCenter: number, arenaSize: number): number {
    const delta = cameraCenter - value;

    if (delta > arenaSize / 2) {
      return value + arenaSize;
    }

    if (delta < -arenaSize / 2) {
      return value - arenaSize;
    }

    return value;
  }

  private getNearestWrappedRenderPosition(x: number, y: number): Phaser.Math.Vector2 {
    const camera = this.cameras.main;
    const cameraCenterX = camera.scrollX + camera.width / 2;
    const cameraCenterY = camera.scrollY + camera.height / 2;

    return new Phaser.Math.Vector2(
      this.getNearestWrappedRenderCoordinate(x, cameraCenterX, this.arena.width),
      this.getNearestWrappedRenderCoordinate(y, cameraCenterY, this.arena.height)
    );
  }

  private isCircleInCameraView(x: number, y: number, radius: number): boolean {
    const camera = this.cameras.main;
    const left = camera.scrollX;
    const top = camera.scrollY;
    const right = left + camera.width;
    const bottom = top + camera.height;

    return x + radius >= left && x - radius <= right && y + radius >= top && y - radius <= bottom;
  }

  private validateAsteroidRenderState(asteroid: BasicAsteroid): void {
    if (
      Number.isNaN(asteroid.body.x) ||
      Number.isNaN(asteroid.body.y) ||
      Number.isNaN(asteroid.velocity.x) ||
      Number.isNaN(asteroid.velocity.y)
    ) {
      console.warn('Invalid asteroid position or velocity.', {
        x: asteroid.body.x,
        y: asteroid.body.y,
        velocityX: asteroid.velocity.x,
        velocityY: asteroid.velocity.y,
        tier: asteroid.tier,
        variant: asteroid.variant
      });
    }

    if (!asteroid.body.scene || asteroid.body.list.length === 0 || !asteroid.wrapMirrorBody.scene) {
      console.warn('Invalid asteroid render object state.', {
        hasBodyScene: Boolean(asteroid.body.scene),
        childCount: asteroid.body.list.length,
        hasMirrorScene: Boolean(asteroid.wrapMirrorBody.scene),
        tier: asteroid.tier,
        variant: asteroid.variant
      });
    }
  }

  private getWrappedDirection(fromX: number, fromY: number, toX: number, toY: number): Phaser.Math.Vector2 {
    let x = toX - fromX;
    let y = toY - fromY;

    if (Math.abs(x) > this.arena.width / 2) {
      x -= Math.sign(x) * this.arena.width;
    }

    if (Math.abs(y) > this.arena.height / 2) {
      y -= Math.sign(y) * this.arena.height;
    }

    return new Phaser.Math.Vector2(x, y);
  }

  private getForwardDirection(rotation: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(Math.sin(rotation), -Math.cos(rotation));
  }

  private getShipLocalOffset(
    localX: number,
    localY: number,
    forward: Phaser.Math.Vector2,
    right: Phaser.Math.Vector2
  ): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(right.x * localX - forward.x * localY, right.y * localX - forward.y * localY);
  }

  private resetBackgroundPlayerTracking(): void {
    this.previousBackgroundPlayerX = this.player.x;
    this.previousBackgroundPlayerY = this.player.y;
  }

  private applyBackgroundTilePositions(): void {
    this.farStarfield.tilePositionX = this.backgroundScrollX * this.farStarfieldParallax;
    this.farStarfield.tilePositionY = this.backgroundScrollY * this.farStarfieldParallax;
    this.midStarfield.tilePositionX = this.backgroundScrollX * this.midStarfieldParallax;
    this.midStarfield.tilePositionY = this.backgroundScrollY * this.midStarfieldParallax;
    this.nearStarfield.tilePositionX = this.backgroundScrollX * this.nearStarfieldParallax;
    this.nearStarfield.tilePositionY = this.backgroundScrollY * this.nearStarfieldParallax;
  }

  private updateBackgroundTiles(time: number): void {
    if (!this.farStarfield || !this.midStarfield || !this.nearStarfield) {
      return;
    }

    const twinkleTime = time * 0.001;

    if (this.previousBackgroundPlayerX === undefined || this.previousBackgroundPlayerY === undefined) {
      this.previousBackgroundPlayerX = this.player.x;
      this.previousBackgroundPlayerY = this.player.y;
    }

    const playerDelta = this.getWrappedDirection(
      this.previousBackgroundPlayerX,
      this.previousBackgroundPlayerY,
      this.player.x,
      this.player.y
    );

    this.backgroundScrollX += playerDelta.x;
    this.backgroundScrollY += playerDelta.y;
    this.previousBackgroundPlayerX = this.player.x;
    this.previousBackgroundPlayerY = this.player.y;

    this.applyBackgroundTilePositions();

    if (!this.backgroundStarsVisible) {
      this.applyBackgroundStarVisibility();
      return;
    }

    this.farStarfield.setAlpha(0.72);
    this.midStarfield.setAlpha(0.82 + Math.sin(twinkleTime * 0.32 + 1.8) * 0.012);
    this.nearStarfield.setAlpha(0.78 + Math.sin(twinkleTime * 0.42 + 3.4) * 0.016);
  }

  private updateCollisionDebugOverlay(): void {
    if (!this.collisionDebugGraphics) {
      return;
    }

    this.collisionDebugGraphics.clear();
    const shouldShowBlackHoleRadii = this.debugState.showBlackHoleRadii && Boolean(this.blackHole);
    this.collisionDebugGraphics.setVisible(this.debugState.collisionDebugEnabled || shouldShowBlackHoleRadii);
    this.updateBlackHoleDebugControls();

    if (!this.debugState.collisionDebugEnabled && !shouldShowBlackHoleRadii) {
      return;
    }

    if (this.debugState.collisionDebugEnabled) {
      this.drawDebugArenaGrid();
      this.drawPlayerCollisionDebug();
      this.drawEnemyCollisionDebug();
      this.drawAsteroidCollisionDebug();
      this.drawDebrisCollisionDebug();
      this.drawScrapCollisionDebug();
    }

    this.drawBlackHoleCollisionDebug();

    if (this.debugState.collisionDebugEnabled) {
      this.drawProjectileCollisionDebug();
    }
  }

  private updateBlackHoleDebugControls(): void {
    this.updateBlackHoleLensOrbitSlider();
    this.updateBlackHoleLensDensitySlider();
    this.updateBlackHoleLensLengthSlider();
    this.updateBlackHoleFieldScaleSlider();
    this.updateBlackHoleProjectionLensToggle();
  }

  private drawDebugArenaGrid(): void {
    const camera = this.cameras.main;
    const left = camera.scrollX;
    const right = camera.scrollX + camera.width;
    const top = camera.scrollY;
    const bottom = camera.scrollY + camera.height;
    const cameraCenterX = left + camera.width / 2;
    const cameraCenterY = top + camera.height / 2;

    this.drawDebugGridLines(left, right, top, bottom);

    const seamX = this.getNearestWrappedRenderCoordinate(0, cameraCenterX, this.arena.width);
    const seamY = this.getNearestWrappedRenderCoordinate(0, cameraCenterY, this.arena.height);

    this.collisionDebugGraphics.lineStyle(2, 0x42f5d7, 0.62);

    if (seamX >= left && seamX <= right) {
      this.collisionDebugGraphics.lineBetween(seamX, top, seamX, bottom);
    }

    if (seamY >= top && seamY <= bottom) {
      this.collisionDebugGraphics.lineBetween(left, seamY, right, seamY);
    }
  }

  private drawDebugGridLines(left: number, right: number, top: number, bottom: number): void {
    const firstMinorX = Math.floor(left / DEBUG_GRID_MINOR_SPACING) * DEBUG_GRID_MINOR_SPACING;
    const firstMinorY = Math.floor(top / DEBUG_GRID_MINOR_SPACING) * DEBUG_GRID_MINOR_SPACING;

    for (let x = firstMinorX; x <= right; x += DEBUG_GRID_MINOR_SPACING) {
      const isMajor = Math.abs(x % DEBUG_GRID_MAJOR_SPACING) < 0.001;
      this.collisionDebugGraphics.lineStyle(isMajor ? 1 : 1, isMajor ? 0x52627f : 0x24384f, isMajor ? 0.42 : 0.22);
      this.collisionDebugGraphics.lineBetween(x, top, x, bottom);
    }

    for (let y = firstMinorY; y <= bottom; y += DEBUG_GRID_MINOR_SPACING) {
      const isMajor = Math.abs(y % DEBUG_GRID_MAJOR_SPACING) < 0.001;
      this.collisionDebugGraphics.lineStyle(isMajor ? 1 : 1, isMajor ? 0x52627f : 0x24384f, isMajor ? 0.42 : 0.22);
      this.collisionDebugGraphics.lineBetween(left, y, right, y);
    }
  }

  private drawPlayerCollisionDebug(): void {
    const playerPosition = this.getNearestWrappedRenderPosition(this.player.x, this.player.y);

    this.collisionDebugGraphics.lineStyle(2, 0x73f2ff, 0.82);
    this.collisionDebugGraphics.strokeCircle(playerPosition.x, playerPosition.y, this.getPlayerHitRadius());

    const shieldCollider = this.getRammingShieldCollider();
    if (shieldCollider) {
      const shieldPosition = this.getNearestWrappedRenderPosition(shieldCollider.centerX, shieldCollider.centerY);
      this.strokeOrientedEllipse(
        shieldPosition,
        new Phaser.Math.Vector2(shieldCollider.rightX, shieldCollider.rightY),
        new Phaser.Math.Vector2(shieldCollider.forwardX, shieldCollider.forwardY),
        shieldCollider.halfWidth,
        shieldCollider.halfDepth,
        0x42f5d7,
        0.78
      );
    }
  }

  private drawEnemyCollisionDebug(): void {
    const playerHitRadius = this.getPlayerHitRadius();

    for (const enemy of this.basicEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, BASIC_ENEMY_DISPLAY_SIZE * 0.5 + playerHitRadius)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        basicEnemy.stats.hitHalfWidth,
        basicEnemy.stats.hitHalfLength,
        0xffc857,
        0.8
      );
      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        basicEnemy.stats.hitHalfWidth + playerHitRadius,
        basicEnemy.stats.hitHalfLength + playerHitRadius,
        0xff5964,
        0.42
      );
    }

    for (const enemy of this.shooterEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, SHOOTER_ENEMY_DISPLAY_SIZE * 0.5 + playerHitRadius)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        shooterEnemy.stats.hitHalfWidth,
        shooterEnemy.stats.hitHalfLength,
        0xff5964,
        0.8
      );
    }

    for (const enemy of this.tankEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, TANK_ENEMY_DISPLAY_SIZE * 0.5 + playerHitRadius)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        tankEnemy.stats.hitHalfWidth,
        tankEnemy.stats.hitHalfLength,
        0xb48cff,
        0.84
      );
      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        tankEnemy.stats.hitHalfWidth + playerHitRadius,
        tankEnemy.stats.hitHalfLength + playerHitRadius,
        0xff5964,
        0.38
      );
    }
  }

  private drawAsteroidCollisionDebug(): void {
    const playerHitRadius = this.getPlayerHitRadius();

    for (const asteroid of this.basicAsteroids) {
      const asteroidPosition = this.getNearestWrappedRenderPosition(asteroid.body.x, asteroid.body.y);

      if (!this.isCircleInCameraView(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius + playerHitRadius)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(2, 0x9fd8ff, 0.78);
      this.collisionDebugGraphics.strokeCircle(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius);
      this.collisionDebugGraphics.lineStyle(1, 0xff5964, 0.38);
      this.collisionDebugGraphics.strokeCircle(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius + playerHitRadius);
    }
  }

  private drawDebrisCollisionDebug(): void {
    const playerHitRadius = this.getPlayerHitRadius();

    for (const debris of this.enemyWreckageDebris) {
      const debrisPosition = this.getNearestWrappedRenderPosition(debris.body.x, debris.body.y);

      if (!this.isCircleInCameraView(debrisPosition.x, debrisPosition.y, debris.hitRadius + playerHitRadius)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(1, 0xc7d4dc, 0.74);
      this.collisionDebugGraphics.strokeCircle(debrisPosition.x, debrisPosition.y, debris.hitRadius);
      this.collisionDebugGraphics.lineStyle(1, 0xff5964, 0.32);
      this.collisionDebugGraphics.strokeCircle(debrisPosition.x, debrisPosition.y, debris.hitRadius + playerHitRadius);
    }
  }

  private drawScrapCollisionDebug(): void {
    for (const scrap of this.scrapPickups) {
      const scrapPosition = this.getNearestWrappedRenderPosition(scrap.body.x, scrap.body.y);

      if (!this.isCircleInCameraView(scrapPosition.x, scrapPosition.y, scrap.pickupRadius)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(1, 0x73f2ff, 0.74);
      this.collisionDebugGraphics.strokeCircle(scrapPosition.x, scrapPosition.y, SCRAP_PICKUP_RADIUS);
      this.collisionDebugGraphics.lineStyle(1, 0xdaf8ff, 0.28);
      this.collisionDebugGraphics.strokeCircle(scrapPosition.x, scrapPosition.y, scrap.pickupRadius);
    }
  }

  private drawBlackHoleCollisionDebug(): void {
    if (!this.blackHole) {
      return;
    }

    const blackHolePosition = this.getNearestWrappedRenderPosition(this.blackHole.body.x, this.blackHole.body.y);

    if (!this.isCircleInCameraView(blackHolePosition.x, blackHolePosition.y, this.blackHole.influenceRadius)) {
      return;
    }

    this.collisionDebugGraphics.lineStyle(2, 0xff5964, 0.9);
    this.collisionDebugGraphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, this.blackHole.eventHorizonRadius);
    this.collisionDebugGraphics.lineStyle(1, 0xffc857, 0.44);
    this.collisionDebugGraphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, this.blackHole.damageRadius);
    this.collisionDebugGraphics.lineStyle(1, 0x42f5d7, 0.42);
    this.collisionDebugGraphics.strokeCircle(
      blackHolePosition.x,
      blackHolePosition.y,
      this.blackHole.captureRadius
    );
    this.collisionDebugGraphics.lineStyle(1, 0x9fd8ff, 0.22);
    this.collisionDebugGraphics.strokeCircle(
      blackHolePosition.x,
      blackHolePosition.y,
      this.blackHole.influenceRadius
    );
  }

  private drawProjectileCollisionDebug(): void {
    for (const projectile of this.playerProjectiles) {
      const projectilePosition = this.getNearestWrappedRenderPosition(projectile.body.x, projectile.body.y);

      if (!this.isCircleInCameraView(projectilePosition.x, projectilePosition.y, projectile.hitRadius)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(1, 0x42f5d7, projectile.capturedByBlackHole ? 0.22 : 0.55);
      this.collisionDebugGraphics.strokeCircle(projectilePosition.x, projectilePosition.y, projectile.hitRadius);
    }

    for (const projectile of this.enemyProjectiles) {
      const projectilePosition = this.getNearestWrappedRenderPosition(projectile.body.x, projectile.body.y);

      if (!this.isCircleInCameraView(projectilePosition.x, projectilePosition.y, projectile.hitRadius)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(1, 0xff5964, projectile.capturedByBlackHole ? 0.22 : 0.62);
      this.collisionDebugGraphics.strokeCircle(projectilePosition.x, projectilePosition.y, projectile.hitRadius);
    }

    for (const debris of this.enemyWreckageDebris) {
      const debrisPosition = this.getNearestWrappedRenderPosition(debris.body.x, debris.body.y);

      if (!this.isCircleInCameraView(debrisPosition.x, debrisPosition.y, debris.hitRadius)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(1, 0xc7d4dc, 0.52);
      this.collisionDebugGraphics.strokeCircle(debrisPosition.x, debrisPosition.y, debris.hitRadius);
    }
  }

  private strokeOrientedEllipse(
    center: Phaser.Math.Vector2,
    right: Phaser.Math.Vector2,
    forward: Phaser.Math.Vector2,
    halfWidth: number,
    halfLength: number,
    color: number,
    alpha: number
  ): void {
    this.collisionDebugGraphics.lineStyle(1, color, alpha);

    let previousX = center.x + right.x * halfWidth;
    let previousY = center.y + right.y * halfWidth;

    for (let i = 1; i <= DEBUG_ELLIPSE_SEGMENTS; i += 1) {
      const angle = (Math.PI * 2 * i) / DEBUG_ELLIPSE_SEGMENTS;
      const x = center.x + right.x * Math.cos(angle) * halfWidth + forward.x * Math.sin(angle) * halfLength;
      const y = center.y + right.y * Math.cos(angle) * halfWidth + forward.y * Math.sin(angle) * halfLength;

      this.collisionDebugGraphics.lineBetween(previousX, previousY, x, y);
      previousX = x;
      previousY = y;
    }
  }

  private updateMinimap(): void {
    if (!this.minimapGraphics || !this.player) {
      return;
    }

    this.minimapGraphics.clear();
    this.minimapGraphics.setVisible(this.isMinimapVisible && !this.isUpgradeOverlayOpen);

    if (!this.isMinimapVisible || this.isUpgradeOverlayOpen) {
      return;
    }

    const mapX = MINIMAP_MARGIN;
    const mapY = this.scale.height - MINIMAP_MARGIN - MINIMAP_HEIGHT;
    const innerX = mapX + MINIMAP_PADDING;
    const innerY = mapY + MINIMAP_PADDING;
    const innerWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
    const innerHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;

    this.minimapGraphics.fillStyle(0x02040a, 0.72);
    this.minimapGraphics.fillRoundedRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);
    this.minimapGraphics.lineStyle(1, 0x52627f, 0.86);
    this.minimapGraphics.strokeRoundedRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);
    this.minimapGraphics.lineStyle(1, 0x42f5d7, 0.42);
    this.minimapGraphics.strokeRect(innerX, innerY, innerWidth, innerHeight);

    for (const asteroid of this.basicAsteroids) {
      const position = this.getMinimapPosition(asteroid.body.x, asteroid.body.y, innerX, innerY, innerWidth, innerHeight);
      const markerRadius = 1.3 + asteroid.tier * 0.55;

      this.minimapGraphics.fillStyle(0x9fd8ff, 0.68);
      this.minimapGraphics.fillCircle(position.x, position.y, markerRadius);
    }

    for (const enemy of this.basicEnemies) {
      const position = this.getMinimapPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight);

      this.minimapGraphics.fillStyle(0xffc857, 0.88);
      this.minimapGraphics.fillTriangle(
        position.x,
        position.y - 3.4,
        position.x - 3,
        position.y + 2.8,
        position.x + 3,
        position.y + 2.8
      );
    }

    for (const enemy of this.shooterEnemies) {
      const position = this.getMinimapPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight);

      this.minimapGraphics.fillStyle(0xff5964, 0.92);
      this.minimapGraphics.fillRect(position.x - 2.8, position.y - 2.8, 5.6, 5.6);
    }

    for (const enemy of this.tankEnemies) {
      const position = this.getMinimapPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight);

      this.minimapGraphics.fillStyle(0xb48cff, 0.94);
      this.minimapGraphics.fillCircle(position.x, position.y, 4.2);
      this.minimapGraphics.lineStyle(1, 0xf2fbff, 0.78);
      this.minimapGraphics.strokeCircle(position.x, position.y, 5.4);
    }

    for (const scrap of this.scrapPickups) {
      const position = this.getMinimapPosition(scrap.body.x, scrap.body.y, innerX, innerY, innerWidth, innerHeight);

      this.minimapGraphics.fillStyle(0x73f2ff, 0.86);
      this.minimapGraphics.fillCircle(position.x, position.y, 1.8);
    }

    if (this.blackHole) {
      const position = this.getMinimapPosition(this.blackHole.body.x, this.blackHole.body.y, innerX, innerY, innerWidth, innerHeight);

      this.minimapGraphics.fillStyle(0x05030a, 0.96);
      this.minimapGraphics.fillCircle(position.x, position.y, 5.6);
      this.minimapGraphics.lineStyle(2, 0xf2fbff, 0.82);
      this.minimapGraphics.strokeCircle(position.x, position.y, 7.2);
    }

    const playerPosition = this.getMinimapPosition(this.player.x, this.player.y, innerX, innerY, innerWidth, innerHeight);

    this.minimapGraphics.fillStyle(0x42f5d7, 1);
    this.minimapGraphics.fillCircle(playerPosition.x, playerPosition.y, 4.2);
    this.minimapGraphics.lineStyle(1, 0xf2fbff, 0.95);
    this.minimapGraphics.strokeCircle(playerPosition.x, playerPosition.y, 5.6);
  }

  private getMinimapPosition(
    worldX: number,
    worldY: number,
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ): { x: number; y: number } {
    const wrappedX = wrapCoordinate(worldX, this.arena.width);
    const wrappedY = wrapCoordinate(worldY, this.arena.height);

    return {
      x: mapX + (wrappedX / this.arena.width) * mapWidth,
      y: mapY + (wrappedY / this.arena.height) * mapHeight
    };
  }

  private updateGameplayHud(time: number): void {
    if (!this.hullText || !this.hudGraphics) {
      return;
    }

    const status = this.isPlayerDead
      ? 'CRITICAL'
      : this.debugState.playerInvulnerable
        ? 'DEBUG INVULN'
        : this.playerInvulnerableUntil > time
          ? 'HIT'
          : 'STABLE';
    const elapsedSeconds = Math.max(0, Math.floor(this.getSurvivalElapsedMs(time) / 1000));
    const survivalTime = this.formatSurvivalTime(elapsedSeconds);
    const maxHull = this.getPlayerMaxHull();
    const xpProgress = this.nextXpThreshold > 0 ? this.playerXp / this.nextXpThreshold : 0;
    const hullProgress = this.playerHull / maxHull;
    const activeWeapon = this.getActiveMainWeaponDefinition();
    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    const weaponCooldownMs = this.getActiveMainWeaponCooldownMs();
    const weaponRemainingMs = Math.max(0, this.playerWeapons.nextMainWeaponFireAt - time);
    const weaponProgress = weaponCooldownMs > 0 ? 1 - weaponRemainingMs / weaponCooldownMs : 1;
    const weaponStatus = weaponRemainingMs <= 0 ? 'Ready' : `Cooling ${Math.ceil(weaponRemainingMs / 1000)}s`;
    const secondaryStatus = secondaryWeapon ? secondaryWeapon.displayName : 'Empty';
    const upgradeStatus =
      this.bankedUpgrades > 0 ? `Upgrade available x${this.bankedUpgrades}  Press U` : 'No upgrade banked';
    const shieldStatus = this.hasRammingShield()
      ? `Shield ${Math.ceil(this.rammingShieldState.hp)} / ${this.getRammingShieldMaxHp()}${this.rammingShieldState.hp <= 0 ? '  BROKEN' : ''}\n` +
        `Shield dash ${this.rammingShieldState.dashCharges} / ${this.getRammingShieldStats().dashMaxCharges}${time < this.rammingShieldState.empoweredUntil ? '  EMPOWERED' : ''}\n`
      : '';

    this.hullText.setText(
      `Time ${survivalTime}\n` +
        `Hull ${this.playerHull} / ${maxHull}  ${status}\n` +
        shieldStatus +
        `XP ${this.playerXp} / ${this.nextXpThreshold}\n` +
        `Scrap ${this.runScrapTotal}\n` +
        `Banked upgrades ${this.bankedUpgrades}\n` +
        `${upgradeStatus}\n` +
        `Primary ${activeWeapon.displayName} ${weaponStatus}\n` +
        `Secondary ${secondaryStatus}\n` +
        `${this.getActiveMainWeaponUpgradeHudSummary()}`
    );

    this.drawGameplayHudBars(hullProgress, xpProgress, weaponProgress);
    this.updateUpgradeButton();
  }

  private drawGameplayHudBars(hullProgress: number, xpProgress: number, pulseProgress: number): void {
    const centerX = this.scale.width / 2;
    const xpX = centerX - HUD_BAR_WIDTH / 2;
    const xpY = HUD_MARGIN;
    const hullX = this.scale.width - HUD_MARGIN - HUD_BAR_WIDTH;
    const hullY = HUD_RIGHT_BAR_Y;
    const pulseY = hullY + 26;
    const shieldY = pulseY + 26;

    this.hudGraphics.clear();
    this.drawHudBar(xpX, xpY, HUD_BAR_WIDTH, HUD_BAR_HEIGHT, Phaser.Math.Clamp(xpProgress, 0, 1), 0x42f5d7);
    this.drawHudBar(hullX, hullY, HUD_BAR_WIDTH, HUD_BAR_HEIGHT, Phaser.Math.Clamp(hullProgress, 0, 1), 0xff5964);
    this.drawHudBar(hullX, pulseY, HUD_BAR_WIDTH, HUD_BAR_HEIGHT, Phaser.Math.Clamp(pulseProgress, 0, 1), 0xffc857);

    if (this.hasRammingShield()) {
      const shieldProgress = this.getRammingShieldMaxHp() > 0 ? this.rammingShieldState.hp / this.getRammingShieldMaxHp() : 0;
      this.drawHudBar(hullX, shieldY, HUD_BAR_WIDTH, HUD_BAR_HEIGHT, Phaser.Math.Clamp(shieldProgress, 0, 1), 0x42f5d7);
    }
  }

  private drawHudBar(x: number, y: number, width: number, height: number, progress: number, color: number): void {
    this.hudGraphics.fillStyle(0x02040a, 0.76);
    this.hudGraphics.fillRoundedRect(x - 2, y - 2, width + 4, height + 4, 4);
    this.hudGraphics.lineStyle(1, 0x52627f, 0.78);
    this.hudGraphics.strokeRoundedRect(x - 2, y - 2, width + 4, height + 4, 4);
    this.hudGraphics.fillStyle(0x111a24, 0.92);
    this.hudGraphics.fillRect(x, y, width, height);
    this.hudGraphics.fillStyle(color, 0.88);
    this.hudGraphics.fillRect(x, y, width * progress, height);
  }

  private formatSurvivalTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private getSurvivalElapsedMs(time: number): number {
    const activePauseMs = this.isUpgradeOverlayOpen ? Math.max(0, time - this.upgradeOverlayOpenedAt) : 0;
    const activeDebugPauseMs = this.debugState.debugGamePaused ? Math.max(0, time - this.debugMenuOpenedAt) : 0;

    return Math.max(0, time - this.runStartedAt - this.totalUpgradePauseMs - this.totalDebugPauseMs - activePauseMs - activeDebugPauseMs);
  }

  private updateDebugText(time: number): void {
    if (!this.debugText || !this.player) {
      return;
    }

    if (time < this.nextDebugUpdateAt) {
      return;
    }

    this.nextDebugUpdateAt = time + DEBUG_UPDATE_INTERVAL_MS;

    const fps = Math.round(this.game.loop.actualFps);
    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;
    const spawnDirectorLine = this.debugState.collisionDebugEnabled
      ? `Spawn director: step ${this.getEnemySpawnDifficultyStep(time)} / active ${this.getActiveEnemyCount()} of ${this.getEnemySpawnMaxActiveEnemies(time)} / next ${(Math.max(0, this.nextEnemySpawnAt - time) / 1000).toFixed(1)}s\n`
      : '';
    const debugWeaponLine = this.debugState.collisionDebugEnabled
      ? `Debug weapon: ${this.getActiveMainWeaponDefinition().displayName} dmg x${this.debugState.weaponDamageMultiplier.toFixed(1)} / fire x${this.debugState.weaponFireRateMultiplier.toFixed(1)} / cooldown ${(this.getActiveMainWeaponCooldownMs() / 1000).toFixed(2)}s\n` +
        `Debug weapon tuning: Z menu\n`
      : '';
    const blackHoleDebugLine = this.debugState.collisionDebugEnabled
      ? `Black hole PNG layers: selected ${this.debugSelectedBlackHolePngLayerIndex + 1} / ${this.blackHole?.getPngLayerCount() ?? 0} / visual x${this.debugBlackHoleVisualScale.toFixed(1)} / layers ${this.areDebugBlackHoleProjectionLensLayersEnabled ? 'on' : 'off'}\n`
      : '';

    this.debugText.setText(
      `FPS: ${fps}\n` +
        `Viewport: ${viewportWidth} x ${viewportHeight}\n` +
        `Arena: ${this.arena.width} x ${this.arena.height}\n` +
        `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)} (wrapped)\n` +
        `Hull: ${this.playerHull} / ${this.getPlayerMaxHull()}${this.isPlayerDead ? ' (dead)' : ''}\n` +
        `XP: ${this.playerXp} / ${this.nextXpThreshold}, Banked upgrades: ${this.bankedUpgrades}\n` +
        `Scrap: ${this.runScrapTotal} run / ${this.scrapPickups.length} pickups\n` +
        `Upgrades: D${this.pulseUpgradeLevels['pulse-damage-1']} R${this.pulseUpgradeLevels['pulse-fire-rate-1']} V${this.pulseUpgradeLevels['pulse-velocity-1']} H${this.passiveUpgradeLevels['hull-plating']} E${this.passiveUpgradeLevels['engine-tuning']} C${this.passiveUpgradeLevels['damage-control']}${this.isUpgradeOverlayOpen ? ' (open)' : ''}\n` +
        `Velocity: ${Math.round(this.playerVelocity.x)}, ${Math.round(this.playerVelocity.y)}\n` +
        `Player shots: ${this.playerProjectiles.length} active, enemy shots: ${this.enemyProjectiles.length}\n` +
        `Debris: ${this.enemyWreckageDebris.length} active\n` +
        `Enemies: ${this.basicEnemies.length} chaser / ${this.shooterEnemies.length} shooter / ${this.tankEnemies.length} tank\n` +
        spawnDirectorLine +
        `Asteroids: ${this.basicAsteroids.length} active\n` +
        `Debug menu: Z ${this.debugMenu?.isOpen() ? 'open' : 'closed'} / pause ${this.debugState.debugGamePaused ? 'on' : 'off'} / enemy spawning ${this.debugState.enemySpawningEnabled ? 'on' : 'off'} / invuln ${this.debugState.playerInvulnerable ? 'on' : 'off'}\n` +
        `Collision visuals: ${this.debugState.collisionDebugEnabled ? 'on' : 'off'}\n` +
        blackHoleDebugLine +
        debugWeaponLine +
        `Asteroid view: ${this.asteroidCameraViewCount} direct / ${this.asteroidWrappedViewCount} wrapped / ${this.asteroidWrapMirrorCount} mirrored`
    );
  }

  private handleResize(): void {
    if (this.gameFlowState === 'mainMenu') {
      this.showMainMenu();
      return;
    }

    if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
      return;
    }

    if (this.gameFlowState === 'shipSelect') {
      this.showShipSelect();
      return;
    }

    if (this.gameFlowState === 'results') {
      this.showResultsScreen();
      return;
    }

    this.rebuildWorld();
  }
}

