import Phaser from 'phaser';
import asteroidVariant1Url from '../../assets/asteroids/astroid_1.png';
import asteroidVariant2Url from '../../assets/asteroids/astroid_2.png';
import asteroidVariant3Url from '../../assets/asteroids/astroid_3.png';
import asteroidVariant4Url from '../../assets/asteroids/astroid_4.png';
import enemyChaserUrl from '../../assets/ships/enemy_chaser.png';
import enemyShooterUrl from '../../assets/ships/enemy_shooter.png';
import enemyTankUrl from '../../assets/ships/enemy_tank.png';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { basicEnemy, shooterEnemy, tankEnemy } from '../data/enemies';
import { interceptorMovement, shooterEnemyBalance, tankEnemyBalance } from '../data/balance';
import { pulseCannon } from '../data/weapons';
import {
  BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT,
  BLACK_HOLE_LENSING_ARC_MAX_COUNT,
  BlackHoleSystem,
  type BlackHoleRingDebugColorMode
} from '../systems/blackHole';

const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];
const BASIC_ENEMY_TEXTURE_KEY = 'basic-enemy-spaceship-1';
const SHOOTER_ENEMY_TEXTURE_KEY = 'shooter-enemy-spaceship';
const TANK_ENEMY_TEXTURE_KEY = 'tank-enemy-spaceship';
const PLAYER_SHIP_TEXTURE_KEY = 'player-ship-spaceship-1';
const ASTEROID_TEXTURES = [
  { key: 'asteroid-variant-1', url: asteroidVariant1Url },
  { key: 'asteroid-variant-2', url: asteroidVariant2Url },
  { key: 'asteroid-variant-3', url: asteroidVariant3Url },
  { key: 'asteroid-variant-4', url: asteroidVariant4Url }
] as const;
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
const PULSE_CANNON_MUZZLE_OFFSET = 36;
const PULSE_TRAIL_OFFSET = 11;
const PULSE_TRAIL_FADE_MS = 220;
const PULSE_TRAIL_INTERVAL_MS = 28;
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
const PULSE_CANNON_ASTEROID_DAMAGE = 1;
const PROJECTILE_HIT_RADIUS = 8;
const PLAYER_MAX_HULL = 100;
const PLAYER_HIT_RADIUS = 32;
const PLAYER_DAMAGE_INVULNERABILITY_MS = 1000;
const PLAYER_DAMAGE_FLASH_MS = 130;
const ENEMY_CONTACT_DAMAGE = 15;
const BASIC_ENEMY_XP_REWARD = 10;
const INITIAL_XP_THRESHOLD = 100;
const XP_THRESHOLD_GROWTH = 1.2;
const GAMEPLAY_MAX_VELOCITY = 500;
const PLAYER_MASS = 3;
const BASIC_ENEMY_MASS = 2;
const PLAYER_CONTACT_IMPULSE_COOLDOWN_MS = 140;
const PLAYER_CONTACT_MIN_IMPULSE = 120;
const PLAYER_CONTACT_MAX_IMPULSE = 460;
const PLAYER_CONTACT_RELATIVE_SPEED_SCALE = 0.42;
const PLAYER_CONTACT_SEPARATION_PERCENT = 0.42;
const PLAYER_CONTACT_MAX_SEPARATION = 18;
const PLAYER_REST_SPEED = 2;
const ENEMY_CONTACT_RESTITUTION_SHARE = 0.65;
const ENEMY_KNOCKBACK_DAMPING = 0.88;
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
const PULSE_DAMAGE_UPGRADE_MULTIPLIER = 0.25;
const PULSE_FIRE_RATE_COOLDOWN_MULTIPLIER = 0.88;
const PULSE_VELOCITY_UPGRADE_MULTIPLIER = 0.2;
const PASSIVE_UPGRADE_MAX_LEVEL = 5;
const HULL_PLATING_MAX_HULL_BONUS = 15;
const HULL_PLATING_REPAIR = 15;
const ENGINE_TUNING_ACCELERATION_MULTIPLIER = 0.08;
const ENGINE_TUNING_MAX_SPEED_MULTIPLIER = 0.04;
const DAMAGE_CONTROL_INVULNERABILITY_BONUS_MS = 150;
const DAMAGE_CONTROL_REPAIR = 10;
const DEBUG_PULSE_DAMAGE_MULTIPLIER_MIN = 1;
const DEBUG_PULSE_DAMAGE_MULTIPLIER_MAX = 10;
const DEBUG_PULSE_DAMAGE_MULTIPLIER_STEP = 0.5;
const DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MIN = 1;
const DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MAX = 12.5;
const DEBUG_PULSE_FIRE_RATE_MULTIPLIER_STEP = 0.5;
const DEBUG_PULSE_MIN_COOLDOWN_MS = 100;
const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT = 1;
const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN = 0;
const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX = 8;
const DEBUG_BLACK_HOLE_LENS_DENSITY_MIN = 0;
const DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT = 1;
const DEBUG_BLACK_HOLE_LENS_LENGTH_MIN = 0.25;
const DEBUG_BLACK_HOLE_LENS_LENGTH_MAX = 4;
const DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH = 220;
const DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT = 54;
const DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH = 176;
const DEBUG_BLACK_HOLE_LENS_SLIDER_GAP = 62;

type PulseUpgradeId = 'pulse-damage-1' | 'pulse-fire-rate-1' | 'pulse-velocity-1';
type PassiveUpgradeId = 'hull-plating' | 'engine-tuning' | 'damage-control';
type UpgradeId = PulseUpgradeId | PassiveUpgradeId;
type UpgradeCategory = 'pulse' | 'passive';

type AsteroidTier = 1 | 2 | 3 | 4 | 5;
type AsteroidBreakupProfileMode = 'many-small' | 'balanced' | 'few-large' | 'single-tier';
type EnemySpawnType = 'chaser' | 'shooter' | 'tank';

interface UpgradeDefinition {
  id: UpgradeId;
  category: UpgradeCategory;
  name: string;
  description: string;
  maxLevel?: number;
}

const UPGRADE_CHOICES: UpgradeDefinition[] = [
  {
    id: 'pulse-damage-1',
    category: 'pulse',
    name: 'Pulse Damage I',
    description: '+25% projectile damage per level.'
  },
  {
    id: 'pulse-fire-rate-1',
    category: 'pulse',
    name: 'Pulse Fire Rate I',
    description: 'Reduces cooldown by 12% per level.'
  },
  {
    id: 'pulse-velocity-1',
    category: 'pulse',
    name: 'Pulse Velocity I',
    description: '+20% projectile speed per level.'
  },
  {
    id: 'hull-plating',
    category: 'passive',
    name: 'Hull Plating',
    description: '+15 max hull and repair 15 hull.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'engine-tuning',
    category: 'passive',
    name: 'Engine Tuning',
    description: '+8% acceleration and +4% max speed.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  },
  {
    id: 'damage-control',
    category: 'passive',
    name: 'Damage Control',
    description: '+0.15s hit invulnerability and repair 10 hull.',
    maxLevel: PASSIVE_UPGRADE_MAX_LEVEL
  }
];

const INITIAL_PULSE_UPGRADE_LEVELS: Record<PulseUpgradeId, number> = {
  'pulse-damage-1': 0,
  'pulse-fire-rate-1': 0,
  'pulse-velocity-1': 0
};

const INITIAL_PASSIVE_UPGRADE_LEVELS: Record<PassiveUpgradeId, number> = {
  'hull-plating': 0,
  'engine-tuning': 0,
  'damage-control': 0
};

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
  hull: number;
  maxHull: number;
  isPlayerDead: boolean;
  playerXp: number;
  nextXpThreshold: number;
  bankedUpgrades: number;
  isUpgradeOverlayOpen: boolean;
  pulseDamageLevel: number;
  pulseFireRateLevel: number;
  pulseVelocityLevel: number;
  hullPlatingLevel: number;
  engineTuningLevel: number;
  damageControlLevel: number;
  pulseDamageMultiplier: number;
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
  projectiles: number;
  enemyProjectiles: number;
}

interface StarvivorsTestHarness {
  getState: () => StarvivorsTestHarnessState;
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

interface PulseCannonProjectile {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  expiresAt: number;
  distanceRemaining: number;
  nextTrailAt: number;
}

interface EnemyProjectile {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  expiresAt: number;
  distanceRemaining: number;
}

interface BasicEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  hp: number;
}

interface ShooterEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  nextFireAt: number;
  hp: number;
}

interface TankEnemy {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  knockbackVelocity: Phaser.Math.Vector2;
  hp: number;
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
}

interface AsteroidBreakupProfile {
  mode: AsteroidBreakupProfileMode;
  preferredTier?: AsteroidTier;
  burstMultiplier: number;
  spreadMultiplier: number;
}

interface PlayerEnemyContact {
  enemy: BasicEnemy | TankEnemy;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
  mass: number;
}

interface PlayerAsteroidContact {
  asteroid: BasicAsteroid;
  normal: Phaser.Math.Vector2;
  penetration: number;
  damage: number;
}

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
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
  private collisionDebugGraphics!: Phaser.GameObjects.Graphics;
  private deathText?: Phaser.GameObjects.Text;
  private farStarfield!: Phaser.GameObjects.TileSprite;
  private midStarfield!: Phaser.GameObjects.TileSprite;
  private nearStarfield!: Phaser.GameObjects.TileSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private collisionDebugKey!: Phaser.Input.Keyboard.Key;
  private parallaxTunerKey!: Phaser.Input.Keyboard.Key;
  private parallaxResetKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private upgradeKey!: Phaser.Input.Keyboard.Key;
  private upgradeChoiceKeys!: Phaser.Input.Keyboard.Key[];
  private upgradeCancelKey!: Phaser.Input.Keyboard.Key;
  private minimapKey!: Phaser.Input.Keyboard.Key;
  private debugPulseDamageDecreaseKey!: Phaser.Input.Keyboard.Key;
  private debugPulseDamageIncreaseKey!: Phaser.Input.Keyboard.Key;
  private debugPulseFireRateDecreaseKey!: Phaser.Input.Keyboard.Key;
  private debugPulseFireRateIncreaseKey!: Phaser.Input.Keyboard.Key;
  private debugPulseResetKey!: Phaser.Input.Keyboard.Key;
  private blackHoleRingDebugColorKey!: Phaser.Input.Keyboard.Key;
  private pulseCannonProjectiles: PulseCannonProjectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private basicEnemies: BasicEnemy[] = [];
  private shooterEnemies: ShooterEnemy[] = [];
  private tankEnemies: TankEnemy[] = [];
  private basicAsteroids: BasicAsteroid[] = [];
  private blackHole?: BlackHoleSystem;
  private playerHull = PLAYER_MAX_HULL;
  private playerInvulnerableUntil = 0;
  private isPlayerDead = false;
  private playerXp = 0;
  private nextXpThreshold = INITIAL_XP_THRESHOLD;
  private bankedUpgrades = 0;
  private asteroidCameraViewCount = 0;
  private asteroidWrappedViewCount = 0;
  private asteroidWrapMirrorCount = 0;
  private nextPulseCannonFireAt = 0;
  private nextForwardThrusterAt = 0;
  private nextReverseThrusterAt = 0;
  private nextLeftStrafeThrusterAt = 0;
  private nextRightStrafeThrusterAt = 0;
  private nextDebugUpdateAt = 0;
  private nextPlayerContactImpulseAt = 0;
  private nextEnemySpawnAt = 0;
  private runStartedAt = 0;
  private isCollisionDebugEnabled = false;
  private pulseUpgradeLevels: Record<PulseUpgradeId, number> = { ...INITIAL_PULSE_UPGRADE_LEVELS };
  private passiveUpgradeLevels: Record<PassiveUpgradeId, number> = { ...INITIAL_PASSIVE_UPGRADE_LEVELS };
  private isUpgradeOverlayOpen = false;
  private upgradeOverlayOpenedAt = 0;
  private totalUpgradePauseMs = 0;
  private upgradeOverlayGraphics!: Phaser.GameObjects.Graphics;
  private upgradeOverlayText!: Phaser.GameObjects.Text;
  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private parallaxTunerText!: Phaser.GameObjects.Text;
  private isMinimapVisible = true;
  private isParallaxTunerVisible = false;
  private farStarfieldParallax = DEFAULT_STARFIELD_FAR_PARALLAX;
  private midStarfieldParallax = DEFAULT_STARFIELD_MID_PARALLAX;
  private nearStarfieldParallax = DEFAULT_STARFIELD_NEAR_PARALLAX;
  private backgroundScrollX = 0;
  private backgroundScrollY = 0;
  private previousBackgroundPlayerX?: number;
  private previousBackgroundPlayerY?: number;
  // Debug/testing modifiers only. These are reset with each rebuilt run and never alter upgrade levels.
  private debugPulseDamageMultiplier = 1;
  private debugPulseFireRateMultiplier = 1;
  private debugBlackHoleLensOrbitSpeedMultiplier = DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT;
  private debugBlackHoleLensDensity = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
  private debugBlackHoleLensLengthMultiplier = DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT;
  private blackHoleRingDebugColorMode: BlackHoleRingDebugColorMode = 'normal';

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
    this.load.image(PLAYER_SHIP_TEXTURE_KEY, playerShipUrl);
  }

  create(): void {
    this.createInput();
    this.createBackgroundTextures();
    this.rebuildWorld();
    this.installTestHarness();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(time: number, delta: number): void {
    this.updateParallaxTunerInput();
    this.updateUpgradeOverlayInput(time);
    this.updateDebugWeaponTuningInput();

    if (this.isUpgradeOverlayOpen) {
      this.updateBackgroundTiles(time);
      this.updateGameplayHud(time);
      this.updateMinimap();
      this.updateParallaxTunerText();
      this.updateBlackHoleLensOrbitSlider();
      this.updateBlackHoleLensDensitySlider();
      this.updateBlackHoleLensLengthSlider();
      this.updateDebugText(time);
      return;
    }

    this.updatePlayerMovement(time, delta / 1000);
    this.updateEnemySpawnDirector(time);
    this.updateBasicEnemies(delta / 1000);
    this.updateShooterEnemies(time, delta / 1000);
    this.updateTankEnemies(delta / 1000);
    this.updateBasicAsteroids(delta / 1000);
    this.updateBlackHole(time, delta / 1000);
    this.wrapPlayer();
    this.updateBlackHolePlayerCollision();
    this.updatePlayerContactDamage(time);
    this.updatePulseCannon(time);
    this.updatePulseCannonProjectiles(time, delta / 1000);
    this.updateEnemyProjectiles(time, delta / 1000);
    this.updatePlayerDamageVisuals(time);
    this.updateCollisionDebugOverlay();
    this.updateBackgroundTiles(time);
    this.updateGameplayHud(time);
    this.updateMinimap();
    this.updateParallaxTunerText();
    this.updateBlackHoleLensOrbitSlider();
    this.updateBlackHoleLensDensitySlider();
    this.updateBlackHoleLensLengthSlider();
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
    this.collisionDebugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
    this.parallaxTunerKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
    this.parallaxResetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
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
    this.debugPulseDamageDecreaseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET);
    this.debugPulseDamageIncreaseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET);
    this.debugPulseFireRateDecreaseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEMICOLON);
    this.debugPulseFireRateIncreaseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.QUOTES);
    this.debugPulseResetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    this.blackHoleRingDebugColorKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
  }

  private installTestHarness(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.starvivorsTestHarness = {
      getState: () => this.getTestHarnessState(),
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
          this.grantXp(BASIC_ENEMY_XP_REWARD);
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
        this.damagePlayer(this.getPlayerMaxHull(), this.time.now);
        return this.getTestHarnessState();
      },
      restartRun: () => {
        this.rebuildWorld();
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
        const upgrade = UPGRADE_CHOICES[choiceNumber - 1];

        if (upgrade) {
          if (!this.isUpgradeOverlayOpen && this.bankedUpgrades > 0 && !this.isPlayerDead) {
            this.openUpgradeOverlay(this.time.now);
          }

          this.selectUpgrade(upgrade, this.time.now);
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

    this.isCollisionDebugEnabled = query.get('collisionDebug') === '1';

    if (query.get('testHarness') === 'smoke') {
      this.runTestHarnessSmoke();
    }
  }

  private getTestHarnessState(): StarvivorsTestHarnessState {
    return {
      hull: this.playerHull,
      maxHull: this.getPlayerMaxHull(),
      isPlayerDead: this.isPlayerDead,
      playerXp: this.playerXp,
      nextXpThreshold: this.nextXpThreshold,
      bankedUpgrades: this.bankedUpgrades,
      isUpgradeOverlayOpen: this.isUpgradeOverlayOpen,
      pulseDamageLevel: this.pulseUpgradeLevels['pulse-damage-1'],
      pulseFireRateLevel: this.pulseUpgradeLevels['pulse-fire-rate-1'],
      pulseVelocityLevel: this.pulseUpgradeLevels['pulse-velocity-1'],
      hullPlatingLevel: this.passiveUpgradeLevels['hull-plating'],
      engineTuningLevel: this.passiveUpgradeLevels['engine-tuning'],
      damageControlLevel: this.passiveUpgradeLevels['damage-control'],
      pulseDamageMultiplier: this.getPulseDamageMultiplier(),
      pulseCooldownMs: this.getPulseCooldownMs(),
      pulseProjectileSpeed: this.getPulseProjectileSpeed(),
      playerAccelerationMultiplier: this.getPlayerAccelerationMultiplier(),
      playerMaxSpeed: this.getPlayerMaxSpeed(),
      playerInvulnerabilityMs: this.getPlayerDamageInvulnerabilityMs(),
      isMinimapVisible: this.isMinimapVisible,
      enemies: this.basicEnemies.length,
      shooterEnemies: this.shooterEnemies.length,
      tankEnemies: this.tankEnemies.length,
      asteroids: this.basicAsteroids.length,
      projectiles: this.pulseCannonProjectiles.length,
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
      damageUpgrade.pulseDamageMultiplier === 1.25 &&
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

  private rebuildWorld(): void {
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.children.removeAll(true);
    this.playerVelocity.set(0, 0);
    this.playerHull = PLAYER_MAX_HULL;
    this.playerInvulnerableUntil = 0;
    this.isPlayerDead = false;
    this.playerXp = 0;
    this.nextXpThreshold = INITIAL_XP_THRESHOLD;
    this.bankedUpgrades = 0;
    this.deathText = undefined;
    this.pulseCannonProjectiles = [];
    this.enemyProjectiles = [];
    this.basicEnemies = [];
    this.shooterEnemies = [];
    this.tankEnemies = [];
    this.basicAsteroids = [];
    this.blackHole = undefined;
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;
    this.nextPulseCannonFireAt = 0;
    this.nextForwardThrusterAt = 0;
    this.nextReverseThrusterAt = 0;
    this.nextLeftStrafeThrusterAt = 0;
    this.nextRightStrafeThrusterAt = 0;
    this.nextDebugUpdateAt = 0;
    this.nextPlayerContactImpulseAt = 0;
    this.runStartedAt = this.time.now;
    this.nextEnemySpawnAt = this.runStartedAt + ENEMY_SPAWN_INITIAL_DELAY_MS;
    this.pulseUpgradeLevels = { ...INITIAL_PULSE_UPGRADE_LEVELS };
    this.passiveUpgradeLevels = { ...INITIAL_PASSIVE_UPGRADE_LEVELS };
    this.isUpgradeOverlayOpen = false;
    this.upgradeOverlayOpenedAt = 0;
    this.totalUpgradePauseMs = 0;
    this.isMinimapVisible = true;
    this.resetDebugWeaponTuning();
    this.debugBlackHoleLensOrbitSpeedMultiplier = DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT;
    this.debugBlackHoleLensDensity = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
    this.debugBlackHoleLensLengthMultiplier = DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT;
    this.blackHoleRingDebugColorMode = 'normal';
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
    this.blackHole = new BlackHoleSystem(this, this.arena, center);
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

    this.createParallaxTuner();
    this.createBlackHoleLensOrbitSlider();
    this.createBlackHoleLensDensitySlider();
    this.createBlackHoleLensLengthSlider();
    this.createUpgradeButton();
    this.createUpgradeOverlay();
    this.updateGameplayHud(this.time.now);
    this.updateMinimap();
    this.updateParallaxTunerText();
    this.updateBlackHoleLensOrbitSlider();
    this.updateBlackHoleLensDensitySlider();
    this.updateBlackHoleLensLengthSlider();
    this.updateDebugText(0);
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
  }

  private createPlayerShip(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, PLAYER_SHIP_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(PLAYER_SHIP_DISPLAY_SIZE, PLAYER_SHIP_DISPLAY_SIZE);
    sprite.setRotation(PLAYER_SHIP_VISUAL_ROTATION);
    this.playerSprite = sprite;

    const ship = this.add.container(x, y, [sprite]);
    ship.setDepth(10);

    return ship;
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
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      hp: basicEnemy.hp
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
      velocity: new Phaser.Math.Vector2(0, 0),
      nextFireAt: time + Phaser.Math.Between(700, Math.round(shooterEnemyBalance.fireCooldownSeconds * 1000)),
      hp: shooterEnemy.hp
    };
  }

  private createTankEnemyInstance(
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container
  ): TankEnemy {
    return {
      body,
      wrapMirrorBody,
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      hp: tankEnemy.hp
    };
  }

  private updateEnemySpawnDirector(time: number): void {
    if (this.isPlayerDead || this.isUpgradeOverlayOpen || time < this.nextEnemySpawnAt) {
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

  private updateBlackHole(time: number, deltaSeconds: number): void {
    if (!this.blackHole || this.isPlayerDead) {
      return;
    }

    const blackHole = this.blackHole.getState();

    this.blackHole.update(
      time,
      deltaSeconds,
      this.arena,
      this.blackHoleRingDebugColorMode,
      this.isCollisionDebugEnabled,
      this.getActiveDebugBlackHoleLensOrbitSpeedMultiplier(),
      this.getActiveDebugBlackHoleLensDensity(),
      this.getActiveDebugBlackHoleLensLengthMultiplier()
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
      hitRadius: tierConfig.hitRadius
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
        this.rebuildWorld();
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

    this.playerVelocity.scale(Math.pow(interceptorMovement.lowFrictionDamping, deltaSeconds * 60));

    if (this.playerVelocity.lengthSq() < PLAYER_REST_SPEED * PLAYER_REST_SPEED) {
      this.playerVelocity.set(0, 0);
    }

    this.playerVelocity.limit(this.getPlayerMaxSpeed());

    this.player.x += this.playerVelocity.x * deltaSeconds;
    this.player.y += this.playerVelocity.y * deltaSeconds;
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
        const upgrade = UPGRADE_CHOICES[i];

        if (upgrade) {
          this.selectUpgrade(upgrade, time);
        }

        return;
      }
    }
  }

  private updateParallaxTunerInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.parallaxTunerKey)) {
      this.isParallaxTunerVisible = !this.isParallaxTunerVisible;
      this.updateParallaxTunerText();
    }

    if (!this.isParallaxTunerVisible || this.isUpgradeOverlayOpen) {
      return;
    }

    const direction = this.shiftKey.isDown ? 1 : -1;

    if (Phaser.Input.Keyboard.JustDown(this.upgradeChoiceKeys[0])) {
      this.adjustStarfieldParallax('far', direction);
    } else if (Phaser.Input.Keyboard.JustDown(this.upgradeChoiceKeys[1])) {
      this.adjustStarfieldParallax('mid', direction);
    } else if (Phaser.Input.Keyboard.JustDown(this.upgradeChoiceKeys[2])) {
      this.adjustStarfieldParallax('near', direction);
    } else if (Phaser.Input.Keyboard.JustDown(this.parallaxResetKey)) {
      this.resetStarfieldParallax();
    }
  }

  private updateDebugWeaponTuningInput(): void {
    if (!this.isCollisionDebugEnabled || this.isUpgradeOverlayOpen) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.blackHoleRingDebugColorKey)) {
      this.cycleBlackHoleRingDebugColorMode();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.debugPulseDamageDecreaseKey)) {
      this.adjustDebugPulseDamageMultiplier(-DEBUG_PULSE_DAMAGE_MULTIPLIER_STEP);
    } else if (Phaser.Input.Keyboard.JustDown(this.debugPulseDamageIncreaseKey)) {
      this.adjustDebugPulseDamageMultiplier(DEBUG_PULSE_DAMAGE_MULTIPLIER_STEP);
    } else if (Phaser.Input.Keyboard.JustDown(this.debugPulseFireRateDecreaseKey)) {
      this.adjustDebugPulseFireRateMultiplier(-DEBUG_PULSE_FIRE_RATE_MULTIPLIER_STEP);
    } else if (Phaser.Input.Keyboard.JustDown(this.debugPulseFireRateIncreaseKey)) {
      this.adjustDebugPulseFireRateMultiplier(DEBUG_PULSE_FIRE_RATE_MULTIPLIER_STEP);
    } else if (Phaser.Input.Keyboard.JustDown(this.debugPulseResetKey)) {
      this.resetDebugWeaponTuning();
    }
  }

  private cycleBlackHoleRingDebugColorMode(): void {
    const modes: BlackHoleRingDebugColorMode[] = ['normal', 'red', 'green', 'cyan', 'white'];
    const currentIndex = modes.indexOf(this.blackHoleRingDebugColorMode);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % modes.length;

    this.blackHoleRingDebugColorMode = modes[nextIndex];
  }

  private adjustDebugPulseDamageMultiplier(delta: number): void {
    this.debugPulseDamageMultiplier = Number(
      Phaser.Math.Clamp(
        this.debugPulseDamageMultiplier + delta,
        DEBUG_PULSE_DAMAGE_MULTIPLIER_MIN,
        DEBUG_PULSE_DAMAGE_MULTIPLIER_MAX
      ).toFixed(1)
    );
  }

  private adjustDebugPulseFireRateMultiplier(delta: number): void {
    this.debugPulseFireRateMultiplier = Number(
      Phaser.Math.Clamp(
        this.debugPulseFireRateMultiplier + delta,
        DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MIN,
        DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MAX
      ).toFixed(1)
    );
  }

  private resetDebugWeaponTuning(): void {
    this.debugPulseDamageMultiplier = 1;
    this.debugPulseFireRateMultiplier = 1;
  }

  private getActiveDebugPulseDamageMultiplier(): number {
    return this.isCollisionDebugEnabled ? this.debugPulseDamageMultiplier : 1;
  }

  private getActiveDebugPulseFireRateMultiplier(): number {
    return this.isCollisionDebugEnabled ? this.debugPulseFireRateMultiplier : 1;
  }

  private getActiveDebugBlackHoleLensOrbitSpeedMultiplier(): number {
    return this.isCollisionDebugEnabled
      ? this.debugBlackHoleLensOrbitSpeedMultiplier
      : DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT;
  }

  private getActiveDebugBlackHoleLensDensity(): number {
    return this.isCollisionDebugEnabled
      ? this.debugBlackHoleLensDensity
      : BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
  }

  private getActiveDebugBlackHoleLensLengthMultiplier(): number {
    return this.isCollisionDebugEnabled
      ? this.debugBlackHoleLensLengthMultiplier
      : DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT;
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
    this.updateParallaxTunerText();
  }

  private resetStarfieldParallax(): void {
    this.farStarfieldParallax = DEFAULT_STARFIELD_FAR_PARALLAX;
    this.midStarfieldParallax = DEFAULT_STARFIELD_MID_PARALLAX;
    this.nearStarfieldParallax = DEFAULT_STARFIELD_NEAR_PARALLAX;
    this.applyBackgroundTilePositions();
    this.updateParallaxTunerText();
  }

  private clampStarfieldParallax(value: number): number {
    return Number(Phaser.Math.Clamp(value, STARFIELD_PARALLAX_MIN, STARFIELD_PARALLAX_MAX).toFixed(2));
  }

  private createParallaxTuner(): void {
    this.parallaxTunerText = this.add
      .text(this.scale.width - HUD_MARGIN, HUD_MARGIN + 54, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        color: '#f2fbff',
        backgroundColor: 'rgba(2, 4, 10, 0.82)',
        padding: { x: 10, y: 8 },
        align: 'left'
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1001);
  }

  private updateParallaxTunerText(): void {
    if (!this.parallaxTunerText) {
      return;
    }

    const isVisible = this.isParallaxTunerVisible && !this.isUpgradeOverlayOpen;

    this.parallaxTunerText.setVisible(isVisible);

    if (!isVisible) {
      return;
    }

    this.parallaxTunerText
      .setPosition(this.scale.width - HUD_MARGIN, HUD_MARGIN + 54)
      .setText(
        `DEBUG PARALLAX TUNER\n` +
          `Far:  ${this.farStarfieldParallax.toFixed(2)}  1 / Shift+1\n` +
          `Mid:  ${this.midStarfieldParallax.toFixed(2)}  2 / Shift+2\n` +
          `Near: ${this.nearStarfieldParallax.toFixed(2)}  3 / Shift+3\n` +
          `0 reset   F3 hide\n` +
          `Step ${STARFIELD_PARALLAX_STEP.toFixed(2)}  Range ${STARFIELD_PARALLAX_MIN.toFixed(2)}-${STARFIELD_PARALLAX_MAX.toFixed(2)}`
      );
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
    this.updateParallaxTunerText();
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
    this.updateParallaxTunerText();
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
    return PLAYER_MAX_HULL + this.passiveUpgradeLevels['hull-plating'] * HULL_PLATING_MAX_HULL_BONUS;
  }

  private getPlayerAccelerationMultiplier(): number {
    return 1 + this.passiveUpgradeLevels['engine-tuning'] * ENGINE_TUNING_ACCELERATION_MULTIPLIER;
  }

  private getPlayerThrustAcceleration(): number {
    return interceptorMovement.thrustAcceleration * this.getPlayerAccelerationMultiplier();
  }

  private getPlayerReverseThrustAcceleration(): number {
    return interceptorMovement.reverseThrustAcceleration * this.getPlayerAccelerationMultiplier();
  }

  private getPlayerStrafeThrustAcceleration(): number {
    return interceptorMovement.strafeThrustAcceleration * this.getPlayerAccelerationMultiplier();
  }

  private getPlayerMaxSpeed(): number {
    return Math.round(
      interceptorMovement.maxSpeed *
        (1 + this.passiveUpgradeLevels['engine-tuning'] * ENGINE_TUNING_MAX_SPEED_MULTIPLIER)
    );
  }

  private getPlayerDamageInvulnerabilityMs(): number {
    return (
      PLAYER_DAMAGE_INVULNERABILITY_MS +
      this.passiveUpgradeLevels['damage-control'] * DAMAGE_CONTROL_INVULNERABILITY_BONUS_MS
    );
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
    if (!this.isCollisionDebugEnabled || this.isUpgradeOverlayOpen || this.isPlayerDead) {
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

    const isVisible = this.isCollisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.isPlayerDead;
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
    if (!this.isCollisionDebugEnabled || this.isUpgradeOverlayOpen || this.isPlayerDead) {
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

    const isVisible = this.isCollisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.isPlayerDead;
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
    if (!this.isCollisionDebugEnabled || this.isUpgradeOverlayOpen || this.isPlayerDead) {
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

    const isVisible = this.isCollisionDebugEnabled && !this.isUpgradeOverlayOpen && !this.isPlayerDead;
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
    const damageMultiplier = this.getPulseDamageMultiplier();
    const cooldownSeconds = this.getPulseCooldownMs() / 1000;
    const speed = Math.round(this.getPulseProjectileSpeed());
    const choiceLines = UPGRADE_CHOICES.map((upgrade, index) => {
      const level = this.getUpgradeLevel(upgrade);
      const maxLevel = upgrade.maxLevel ? `/${upgrade.maxLevel}` : '';
      const maxLabel = this.isUpgradeAtMaxLevel(upgrade) ? '  MAX' : '';

      return `${index + 1}. ${upgrade.name}  Lv ${level}${maxLevel}${maxLabel}\n   ${upgrade.description}`;
    }).join('\n\n');

    this.upgradeOverlayText.setText(
      `UPGRADE SELECTION\n` +
        `Banked upgrades: ${this.bankedUpgrades}\n` +
        `Pulse: x${damageMultiplier.toFixed(2)} damage, ${cooldownSeconds.toFixed(2)}s cooldown, ${speed} speed\n` +
        `Ship: ${this.playerHull}/${this.getPlayerMaxHull()} hull, x${this.getPlayerAccelerationMultiplier().toFixed(2)} accel, ${(this.getPlayerDamageInvulnerabilityMs() / 1000).toFixed(2)}s i-frames\n\n` +
        `${choiceLines}\n\n` +
        `Press 1-6 to choose.  Esc closes without spending.`
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
    }
  }

  private getEnemyContact(): PlayerEnemyContact | undefined {
    const hitHalfWidth = basicEnemy.hitHalfWidth + PLAYER_HIT_RADIUS;
    const hitHalfLength = basicEnemy.hitHalfLength + PLAYER_HIT_RADIUS;

    for (const enemy of this.basicEnemies) {
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
          damage: ENEMY_CONTACT_DAMAGE,
          mass: BASIC_ENEMY_MASS
        };
      }
    }

    const tankHitHalfWidth = tankEnemy.hitHalfWidth + PLAYER_HIT_RADIUS;
    const tankHitHalfLength = tankEnemy.hitHalfLength + PLAYER_HIT_RADIUS;

    for (const enemy of this.tankEnemies) {
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
          damage: tankEnemyBalance.contactDamage,
          mass: tankEnemyBalance.mass
        };
      }
    }

    return undefined;
  }

  private getAsteroidContact(): PlayerAsteroidContact | undefined {
    for (const asteroid of this.basicAsteroids) {
      const offset = this.getWrappedDirection(asteroid.body.x, asteroid.body.y, this.player.x, this.player.y);
      const hitRadius = asteroid.hitRadius + PLAYER_HIT_RADIUS;

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

  private resolvePlayerEnemyContact(contact: PlayerEnemyContact, time: number): void {
    this.applyPlayerEnemyKnockback(contact, time);

    if (time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitShipCollisionImpactExplosion(impact.x, impact.y);
      this.damagePlayer(contact.damage, time, impact.x, impact.y);
    }
  }

  private resolvePlayerAsteroidContact(contact: PlayerAsteroidContact, time: number): void {
    this.applyPlayerAsteroidKnockback(contact, time);

    if (time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitAsteroidImpactExplosion(impact.x, impact.y, contact.asteroid.tier);
      this.damagePlayer(contact.damage, time, impact.x, impact.y);
    }
  }

  private applyPlayerEnemyKnockback(contact: PlayerEnemyContact, time: number): void {
    const normal = contact.normal;
    const playerShare = this.getMassResponseShare(contact.mass, PLAYER_MASS);
    const enemyShare = this.getMassResponseShare(PLAYER_MASS, contact.mass);
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
    const playerShare = this.getMassResponseShare(asteroidMass, PLAYER_MASS);
    const asteroidShare = this.getMassResponseShare(PLAYER_MASS, asteroidMass);
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
    return new Phaser.Math.Vector2(
      wrapCoordinate(this.player.x - normal.x * PLAYER_HIT_RADIUS, this.arena.width),
      wrapCoordinate(this.player.y - normal.y * PLAYER_HIT_RADIUS, this.arena.height)
    );
  }

  private damagePlayer(damage: number, time: number, impactX = this.player.x, impactY = this.player.y): void {
    this.playerHull = Math.max(0, this.playerHull - damage);
    this.playerInvulnerableUntil = time + this.getPlayerDamageInvulnerabilityMs();
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

    if (time >= this.playerInvulnerableUntil) {
      this.player.setVisible(true);
      return;
    }

    this.player.setVisible(Math.floor(time / 85) % 2 === 0);
  }

  private killPlayer(): void {
    this.isPlayerDead = true;
    this.playerHull = 0;
    this.playerVelocity.set(0, 0);
    this.player.setVisible(true);
    this.playerSprite.setTint(0xff5964);
    this.playerSprite.setAlpha(0.62);
    this.updateGameplayHud(this.time.now);
    this.showDeathText();
  }

  private showDeathText(): void {
    this.deathText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'HULL BREACHED\nPRESS R TO RESTART', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '30px',
        color: '#f2fbff',
        align: 'center',
        backgroundColor: 'rgba(2, 4, 10, 0.78)',
        padding: { x: 20, y: 16 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);
  }

  private updateBasicEnemies(deltaSeconds: number): void {
    for (const enemy of this.basicEnemies) {
      const direction = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      enemy.velocity.set(0, 0);

      if (direction.lengthSq() > 0) {
        direction.normalize();
        enemy.velocity.set(direction.x * basicEnemy.moveSpeed, direction.y * basicEnemy.moveSpeed);
        enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      }

      const totalVelocity = enemy.velocity.clone().add(enemy.knockbackVelocity).limit(GAMEPLAY_MAX_VELOCITY);

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
    for (const enemy of this.shooterEnemies) {
      const offsetToPlayer = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      const distance = offsetToPlayer.length();

      enemy.velocity.set(0, 0);

      if (distance > 0) {
        const directionToPlayer = offsetToPlayer.clone().scale(1 / distance);

        enemy.body.rotation = Math.atan2(directionToPlayer.x, -directionToPlayer.y);

        if (distance > shooterEnemyBalance.preferredRange) {
          enemy.velocity.set(
            directionToPlayer.x * shooterEnemyBalance.moveSpeed,
            directionToPlayer.y * shooterEnemyBalance.moveSpeed
          );
        } else if (distance < shooterEnemyBalance.tooCloseRange) {
          enemy.velocity.set(
            -directionToPlayer.x * shooterEnemyBalance.moveSpeed * 0.72,
            -directionToPlayer.y * shooterEnemyBalance.moveSpeed * 0.72
          );
        }

        if (!this.isPlayerDead && time >= enemy.nextFireAt) {
          this.fireShooterProjectile(enemy, directionToPlayer, time);
          enemy.nextFireAt = time + shooterEnemyBalance.fireCooldownSeconds * 1000;
        }
      }

      enemy.body.x = wrapCoordinate(enemy.body.x + enemy.velocity.x * deltaSeconds, this.arena.width);
      enemy.body.y = wrapCoordinate(enemy.body.y + enemy.velocity.y * deltaSeconds, this.arena.height);
      this.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, SHOOTER_ENEMY_DISPLAY_SIZE * 0.5);
    }
  }

  private updateTankEnemies(deltaSeconds: number): void {
    for (const enemy of this.tankEnemies) {
      const direction = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      enemy.velocity.set(0, 0);

      if (direction.lengthSq() > 0) {
        direction.normalize();
        enemy.velocity.set(direction.x * tankEnemyBalance.moveSpeed, direction.y * tankEnemyBalance.moveSpeed);
        enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      }

      const totalVelocity = enemy.velocity.clone().add(enemy.knockbackVelocity).limit(GAMEPLAY_MAX_VELOCITY);

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
    const body = this.createEnemyProjectile(spawnX, spawnY, rotation);
    const wrapMirrorBody = this.createEnemyProjectile(spawnX, spawnY, rotation);
    wrapMirrorBody.setVisible(false);

    this.enemyProjectiles.push({
      body,
      wrapMirrorBody,
      velocity: direction.clone().scale(shooterEnemyBalance.projectileSpeed),
      speed: shooterEnemyBalance.projectileSpeed,
      damage: shooterEnemyBalance.projectileDamage,
      expiresAt: time + shooterEnemyBalance.projectileLifetimeSeconds * 1000,
      distanceRemaining: shooterEnemyBalance.projectileRange
    });
  }

  private createEnemyProjectile(x: number, y: number, rotation: number): Phaser.GameObjects.Container {
    const glow = this.add.ellipse(0, 0, 20, 20, 0xff5964, 0.28);
    const body = this.add.ellipse(0, 0, 10, 16, 0xff8f4f, 0.94);
    body.setStrokeStyle(1, 0xfff0b8, 0.86);

    const projectile = this.add.container(x, y, [glow, body]);

    projectile.setSize(20, 20);
    projectile.setRotation(rotation);
    projectile.setDepth(8);

    return projectile;
  }

  private updateEnemyProjectiles(time: number, deltaSeconds: number): void {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.enemyProjectiles[i];
      const travelDistance = projectile.speed * deltaSeconds;

      projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * deltaSeconds, this.arena.width);
      projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * deltaSeconds, this.arena.height);
      projectile.distanceRemaining -= travelDistance;
      this.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, SHOOTER_PROJECTILE_HIT_RADIUS);

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

    const offset = this.getWrappedDirection(projectile.body.x, projectile.body.y, this.player.x, this.player.y);
    const hitRadius = PLAYER_HIT_RADIUS + SHOOTER_PROJECTILE_HIT_RADIUS;

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

    for (const asteroid of this.basicAsteroids) {
      this.validateAsteroidRenderState(asteroid);
      asteroid.body.x = wrapCoordinate(asteroid.body.x + asteroid.velocity.x * deltaSeconds, this.arena.width);
      asteroid.body.y = wrapCoordinate(asteroid.body.y + asteroid.velocity.y * deltaSeconds, this.arena.height);
      asteroid.body.rotation += asteroid.rotationSpeed * deltaSeconds;
      this.updateAsteroidWrapMirror(asteroid);
    }
  }

  private getPulseDamageMultiplier(): number {
    return 1 + this.pulseUpgradeLevels['pulse-damage-1'] * PULSE_DAMAGE_UPGRADE_MULTIPLIER;
  }

  private getPulseDamage(): number {
    return PULSE_CANNON_ASTEROID_DAMAGE * this.getPulseDamageMultiplier() * this.getActiveDebugPulseDamageMultiplier();
  }

  private getPulseCooldownMs(): number {
    const upgradedCooldownMs =
      pulseCannon.cooldownSeconds *
      1000 *
      Math.pow(PULSE_FIRE_RATE_COOLDOWN_MULTIPLIER, this.pulseUpgradeLevels['pulse-fire-rate-1']);

    return Math.max(DEBUG_PULSE_MIN_COOLDOWN_MS, upgradedCooldownMs / this.getActiveDebugPulseFireRateMultiplier());
  }

  private getPulseProjectileSpeed(): number {
    return (
      pulseCannon.projectileSpeed *
      (1 + this.pulseUpgradeLevels['pulse-velocity-1'] * PULSE_VELOCITY_UPGRADE_MULTIPLIER)
    );
  }

  private getPulseUpgradeHudSummary(): string {
    const damageLevel = this.pulseUpgradeLevels['pulse-damage-1'];
    const fireRateLevel = this.pulseUpgradeLevels['pulse-fire-rate-1'];
    const velocityLevel = this.pulseUpgradeLevels['pulse-velocity-1'];

    if (damageLevel + fireRateLevel + velocityLevel === 0) {
      return 'Pulse upgrades none';
    }

    return `Pulse upgrades D${damageLevel} R${fireRateLevel} V${velocityLevel}`;
  }

  private updatePulseCannon(time: number): void {
    if (this.isPlayerDead || this.isUpgradeOverlayOpen) {
      return;
    }

    const isFiring =
      this.fireKey.isDown || this.input.activePointer.leftButtonDown() || this.input.activePointer.rightButtonDown();

    if (!isFiring || time < this.nextPulseCannonFireAt) {
      return;
    }

    this.firePulseCannon(time);
    this.nextPulseCannonFireAt = time + this.getPulseCooldownMs();
  }

  private firePulseCannon(time: number): void {
    const direction = this.getForwardDirection(this.player.rotation);
    const projectileSpeed = this.getPulseProjectileSpeed();
    const spawnX = this.player.x + direction.x * PULSE_CANNON_MUZZLE_OFFSET;
    const spawnY = this.player.y + direction.y * PULSE_CANNON_MUZZLE_OFFSET;
    const body = this.createPulseCannonProjectile(spawnX, spawnY, this.player.rotation);
    const wrapMirrorBody = this.createPulseCannonProjectile(spawnX, spawnY, this.player.rotation);
    wrapMirrorBody.setVisible(false);

    this.pulseCannonProjectiles.push({
      body,
      wrapMirrorBody,
      velocity: direction.scale(projectileSpeed),
      speed: projectileSpeed,
      damage: this.getPulseDamage(),
      expiresAt: time + pulseCannon.projectileLifetimeSeconds * 1000,
      distanceRemaining: pulseCannon.projectileRange,
      nextTrailAt: time
    });
  }

  private createPulseCannonProjectile(x: number, y: number, rotation: number): Phaser.GameObjects.Container {
    const glow = this.add.ellipse(0, 0, 18, 24, 0x42f5d7, 0.3);
    const body = this.add.ellipse(0, 0, 8, 15, 0x73f2ff, 1);
    body.setStrokeStyle(1, 0xf2fbff, 0.95);

    const projectile = this.add.container(x, y, [glow, body]);

    projectile.setSize(18, 24);
    projectile.setRotation(rotation);
    projectile.setDepth(8);

    return projectile;
  }

  private updatePulseCannonProjectiles(time: number, deltaSeconds: number): void {
    for (let i = this.pulseCannonProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.pulseCannonProjectiles[i];
      const travelDistance = projectile.speed * deltaSeconds;

      projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * deltaSeconds, this.arena.width);
      projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * deltaSeconds, this.arena.height);
      projectile.distanceRemaining -= travelDistance;
      this.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, PULSE_CANNON_MUZZLE_OFFSET);

      if (
        !this.isPlayerDead &&
        (
          this.tryHitBasicEnemy(projectile) ||
          this.tryHitShooterEnemy(projectile) ||
          this.tryHitTankEnemy(projectile) ||
          this.tryHitBasicAsteroid(projectile)
        )
      ) {
        this.destroyPulseCannonProjectile(projectile);
        this.pulseCannonProjectiles.splice(i, 1);
      } else if (time >= projectile.expiresAt || projectile.distanceRemaining <= 0) {
        this.destroyPulseCannonProjectile(projectile);
        this.pulseCannonProjectiles.splice(i, 1);
      } else if (time >= projectile.nextTrailAt) {
        this.emitPulseCannonTrail(projectile);
        projectile.nextTrailAt = time + PULSE_TRAIL_INTERVAL_MS;
      }
    }
  }

  private emitPulseCannonTrail(projectile: PulseCannonProjectile): void {
    const movementDirection = projectile.velocity.clone().normalize();
    const trailDirection = movementDirection.clone().negate();
    const sideDirection = new Phaser.Math.Vector2(-movementDirection.y, movementDirection.x);
    const jitter = Phaser.Math.FloatBetween(-2.4, 2.4);
    const x = projectile.body.x + trailDirection.x * PULSE_TRAIL_OFFSET + sideDirection.x * jitter;
    const y = projectile.body.y + trailDirection.y * PULSE_TRAIL_OFFSET + sideDirection.y * jitter;
    const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(2.2, 4.2), 0x42f5d7, 0.7);

    particle.setDepth(7);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: particle,
      x: x + trailDirection.x * 12,
      y: y + trailDirection.y * 12,
      alpha: 0,
      scale: 0.18,
      duration: PULSE_TRAIL_FADE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => particle.destroy()
    });
  }

  private destroyPulseCannonProjectile(projectile: PulseCannonProjectile): void {
    projectile.body.destroy(true);
    projectile.wrapMirrorBody.destroy(true);
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

  private tryHitBasicEnemy(projectile: PulseCannonProjectile): boolean {
    const hitHalfWidth = basicEnemy.hitHalfWidth + PROJECTILE_HIT_RADIUS;
    const hitHalfLength = basicEnemy.hitHalfLength + PROJECTILE_HIT_RADIUS;

    for (let i = this.basicEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.basicEnemies[i];
      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        enemy.hp -= projectile.damage;

        if (enemy.hp <= 0) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          enemy.body.destroy(true);
          enemy.wrapMirrorBody.destroy(true);
          this.basicEnemies.splice(i, 1);
          this.grantXp(BASIC_ENEMY_XP_REWARD);
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }

        return true;
      }
    }

    return false;
  }

  private tryHitShooterEnemy(projectile: PulseCannonProjectile): boolean {
    const hitHalfWidth = shooterEnemy.hitHalfWidth + PROJECTILE_HIT_RADIUS;
    const hitHalfLength = shooterEnemy.hitHalfLength + PROJECTILE_HIT_RADIUS;

    for (let i = this.shooterEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.shooterEnemies[i];
      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        enemy.hp -= projectile.damage;

        if (enemy.hp <= 0) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          enemy.body.destroy(true);
          enemy.wrapMirrorBody.destroy(true);
          this.shooterEnemies.splice(i, 1);
          this.grantXp(shooterEnemyBalance.xpReward);
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }

        return true;
      }
    }

    return false;
  }

  private tryHitTankEnemy(projectile: PulseCannonProjectile): boolean {
    const hitHalfWidth = tankEnemy.hitHalfWidth + PROJECTILE_HIT_RADIUS;
    const hitHalfLength = tankEnemy.hitHalfLength + PROJECTILE_HIT_RADIUS;

    for (let i = this.tankEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.tankEnemies[i];
      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
      const localX = offset.dot(enemyRight);
      const localY = offset.dot(enemyForward);
      const normalizedHit = (localX * localX) / (hitHalfWidth * hitHalfWidth) + (localY * localY) / (hitHalfLength * hitHalfLength);

      if (normalizedHit <= 1) {
        enemy.hp -= projectile.damage;

        if (enemy.hp <= 0) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          enemy.body.destroy(true);
          enemy.wrapMirrorBody.destroy(true);
          this.tankEnemies.splice(i, 1);
          this.grantXp(tankEnemyBalance.xpReward);
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }

        return true;
      }
    }

    return false;
  }

  private tryHitBasicAsteroid(projectile: PulseCannonProjectile): boolean {
    for (let i = this.basicAsteroids.length - 1; i >= 0; i -= 1) {
      const asteroid = this.basicAsteroids[i];
      const offset = this.getWrappedDirection(asteroid.body.x, asteroid.body.y, projectile.body.x, projectile.body.y);
      const hitRadius = asteroid.hitRadius + PROJECTILE_HIT_RADIUS;

      if (offset.lengthSq() <= hitRadius * hitRadius) {
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

  private applyAsteroidImpact(asteroid: BasicAsteroid, projectile: PulseCannonProjectile): void {
    const impactDirection = projectile.velocity.clone().normalize();
    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];

    asteroid.velocity.x += impactDirection.x * tierConfig.impactImpulse;
    asteroid.velocity.y += impactDirection.y * tierConfig.impactImpulse;
    asteroid.velocity.limit(tierConfig.maxVelocity);
  }

  private destroyBasicAsteroid(index: number): void {
    const asteroid = this.basicAsteroids[index];
    const x = asteroid.body.x;
    const y = asteroid.body.y;
    const velocity = asteroid.velocity.clone();
    const fragmentTiers = this.createAsteroidFragmentTiers(asteroid.tier, asteroid.breakupProfile);

    this.grantXp(ASTEROID_XP_REWARD_BY_TIER[asteroid.tier]);
    this.emitAsteroidBreakupFeedback(x, y, asteroid.tier);
    asteroid.body.destroy(true);
    asteroid.wrapMirrorBody.destroy(true);
    this.basicAsteroids.splice(index, 1);

    if (fragmentTiers.length > 0) {
      this.spawnAsteroidFragments(x, y, velocity, asteroid.breakupProfile, fragmentTiers);
    }
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

    this.farStarfield.setAlpha(0.72);
    this.midStarfield.setAlpha(0.82 + Math.sin(twinkleTime * 0.32 + 1.8) * 0.012);
    this.nearStarfield.setAlpha(0.78 + Math.sin(twinkleTime * 0.42 + 3.4) * 0.016);
  }

  private updateCollisionDebugOverlay(): void {
    if (Phaser.Input.Keyboard.JustDown(this.collisionDebugKey)) {
      this.isCollisionDebugEnabled = !this.isCollisionDebugEnabled;
    }

    if (!this.collisionDebugGraphics) {
      return;
    }

    this.collisionDebugGraphics.clear();
    this.collisionDebugGraphics.setVisible(this.isCollisionDebugEnabled);

    if (!this.isCollisionDebugEnabled) {
      return;
    }

    this.drawDebugArenaGrid();
    this.drawPlayerCollisionDebug();
    this.drawEnemyCollisionDebug();
    this.drawAsteroidCollisionDebug();
    this.drawBlackHoleCollisionDebug();
    this.drawProjectileCollisionDebug();
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
    this.collisionDebugGraphics.strokeCircle(playerPosition.x, playerPosition.y, PLAYER_HIT_RADIUS);
  }

  private drawEnemyCollisionDebug(): void {
    for (const enemy of this.basicEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, BASIC_ENEMY_DISPLAY_SIZE * 0.5 + PLAYER_HIT_RADIUS)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        basicEnemy.hitHalfWidth,
        basicEnemy.hitHalfLength,
        0xffc857,
        0.8
      );
      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        basicEnemy.hitHalfWidth + PLAYER_HIT_RADIUS,
        basicEnemy.hitHalfLength + PLAYER_HIT_RADIUS,
        0xff5964,
        0.42
      );
    }

    for (const enemy of this.shooterEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, SHOOTER_ENEMY_DISPLAY_SIZE * 0.5 + PLAYER_HIT_RADIUS)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        shooterEnemy.hitHalfWidth,
        shooterEnemy.hitHalfLength,
        0xff5964,
        0.8
      );
    }

    for (const enemy of this.tankEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, TANK_ENEMY_DISPLAY_SIZE * 0.5 + PLAYER_HIT_RADIUS)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        tankEnemy.hitHalfWidth,
        tankEnemy.hitHalfLength,
        0xb48cff,
        0.84
      );
      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        tankEnemy.hitHalfWidth + PLAYER_HIT_RADIUS,
        tankEnemy.hitHalfLength + PLAYER_HIT_RADIUS,
        0xff5964,
        0.38
      );
    }
  }

  private drawAsteroidCollisionDebug(): void {
    for (const asteroid of this.basicAsteroids) {
      const asteroidPosition = this.getNearestWrappedRenderPosition(asteroid.body.x, asteroid.body.y);

      if (!this.isCircleInCameraView(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius + PLAYER_HIT_RADIUS)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(2, 0x9fd8ff, 0.78);
      this.collisionDebugGraphics.strokeCircle(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius);
      this.collisionDebugGraphics.lineStyle(1, 0xff5964, 0.38);
      this.collisionDebugGraphics.strokeCircle(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius + PLAYER_HIT_RADIUS);
    }
  }

  private drawBlackHoleCollisionDebug(): void {
    if (!this.blackHole) {
      return;
    }

    const blackHolePosition = this.getNearestWrappedRenderPosition(this.blackHole.body.x, this.blackHole.body.y);

    if (!this.isCircleInCameraView(blackHolePosition.x, blackHolePosition.y, this.blackHole.warningRadius)) {
      return;
    }

    this.collisionDebugGraphics.lineStyle(2, 0xb48cff, 0.82);
    this.collisionDebugGraphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, this.blackHole.coreRadius);
    this.collisionDebugGraphics.lineStyle(1, 0xb48cff, 0.34);
    this.collisionDebugGraphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, this.blackHole.warningRadius);
  }

  private drawProjectileCollisionDebug(): void {
    for (const projectile of this.pulseCannonProjectiles) {
      const projectilePosition = this.getNearestWrappedRenderPosition(projectile.body.x, projectile.body.y);

      if (!this.isCircleInCameraView(projectilePosition.x, projectilePosition.y, PROJECTILE_HIT_RADIUS)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(1, 0x42f5d7, 0.55);
      this.collisionDebugGraphics.strokeCircle(projectilePosition.x, projectilePosition.y, PROJECTILE_HIT_RADIUS);
    }

    for (const projectile of this.enemyProjectiles) {
      const projectilePosition = this.getNearestWrappedRenderPosition(projectile.body.x, projectile.body.y);

      if (!this.isCircleInCameraView(projectilePosition.x, projectilePosition.y, SHOOTER_PROJECTILE_HIT_RADIUS)) {
        continue;
      }

      this.collisionDebugGraphics.lineStyle(1, 0xff5964, 0.62);
      this.collisionDebugGraphics.strokeCircle(projectilePosition.x, projectilePosition.y, SHOOTER_PROJECTILE_HIT_RADIUS);
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

    const status = this.isPlayerDead ? 'CRITICAL' : this.playerInvulnerableUntil > time ? 'HIT' : 'STABLE';
    const elapsedSeconds = Math.max(0, Math.floor(this.getSurvivalElapsedMs(time) / 1000));
    const survivalTime = this.formatSurvivalTime(elapsedSeconds);
    const maxHull = this.getPlayerMaxHull();
    const xpProgress = this.nextXpThreshold > 0 ? this.playerXp / this.nextXpThreshold : 0;
    const hullProgress = this.playerHull / maxHull;
    const pulseCooldownMs = this.getPulseCooldownMs();
    const pulseRemainingMs = Math.max(0, this.nextPulseCannonFireAt - time);
    const pulseProgress = pulseCooldownMs > 0 ? 1 - pulseRemainingMs / pulseCooldownMs : 1;
    const pulseStatus = pulseRemainingMs <= 0 ? 'Ready' : `Cooling ${Math.ceil(pulseRemainingMs / 1000)}s`;
    const upgradeStatus =
      this.bankedUpgrades > 0 ? `Upgrade available x${this.bankedUpgrades}  Press U` : 'No upgrade banked';

    this.hullText.setText(
      `Time ${survivalTime}\n` +
        `Hull ${this.playerHull} / ${maxHull}  ${status}\n` +
        `XP ${this.playerXp} / ${this.nextXpThreshold}\n` +
        `Banked upgrades ${this.bankedUpgrades}\n` +
        `${upgradeStatus}\n` +
        `Pulse ${pulseStatus}\n` +
        `${this.getPulseUpgradeHudSummary()}`
    );

    this.drawGameplayHudBars(hullProgress, xpProgress, pulseProgress);
    this.updateUpgradeButton();
  }

  private drawGameplayHudBars(hullProgress: number, xpProgress: number, pulseProgress: number): void {
    const centerX = this.scale.width / 2;
    const xpX = centerX - HUD_BAR_WIDTH / 2;
    const xpY = HUD_MARGIN;
    const hullX = this.scale.width - HUD_MARGIN - HUD_BAR_WIDTH;
    const hullY = HUD_RIGHT_BAR_Y;
    const pulseY = hullY + 26;

    this.hudGraphics.clear();
    this.drawHudBar(xpX, xpY, HUD_BAR_WIDTH, HUD_BAR_HEIGHT, Phaser.Math.Clamp(xpProgress, 0, 1), 0x42f5d7);
    this.drawHudBar(hullX, hullY, HUD_BAR_WIDTH, HUD_BAR_HEIGHT, Phaser.Math.Clamp(hullProgress, 0, 1), 0xff5964);
    this.drawHudBar(hullX, pulseY, HUD_BAR_WIDTH, HUD_BAR_HEIGHT, Phaser.Math.Clamp(pulseProgress, 0, 1), 0xffc857);
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

    return Math.max(0, time - this.runStartedAt - this.totalUpgradePauseMs - activePauseMs);
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
    const spawnDirectorLine = this.isCollisionDebugEnabled
      ? `Spawn director: step ${this.getEnemySpawnDifficultyStep(time)} / active ${this.getActiveEnemyCount()} of ${this.getEnemySpawnMaxActiveEnemies(time)} / next ${(Math.max(0, this.nextEnemySpawnAt - time) / 1000).toFixed(1)}s\n`
      : '';
    const debugWeaponLine = this.isCollisionDebugEnabled
      ? `Debug weapon: dmg x${this.debugPulseDamageMultiplier.toFixed(1)} / fire x${this.debugPulseFireRateMultiplier.toFixed(1)} / cooldown ${(this.getPulseCooldownMs() / 1000).toFixed(2)}s\n` +
        `Debug weapon keys: [ ] damage, ; ' fire, 0 reset\n`
      : '';
    const blackHoleDebugLine = this.isCollisionDebugEnabled
      ? `Black hole rings: ${this.blackHoleRingDebugColorMode}  B cycle\n` +
        `Black hole lenses: orbit x${this.debugBlackHoleLensOrbitSpeedMultiplier.toFixed(1)} / density ${this.debugBlackHoleLensDensity} / length x${this.debugBlackHoleLensLengthMultiplier.toFixed(1)}\n`
      : '';

    this.debugText.setText(
      `FPS: ${fps}\n` +
        `Viewport: ${viewportWidth} x ${viewportHeight}\n` +
        `Arena: ${this.arena.width} x ${this.arena.height}\n` +
        `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)} (wrapped)\n` +
        `Hull: ${this.playerHull} / ${this.getPlayerMaxHull()}${this.isPlayerDead ? ' (dead)' : ''}\n` +
        `XP: ${this.playerXp} / ${this.nextXpThreshold}, Banked upgrades: ${this.bankedUpgrades}\n` +
        `Upgrades: D${this.pulseUpgradeLevels['pulse-damage-1']} R${this.pulseUpgradeLevels['pulse-fire-rate-1']} V${this.pulseUpgradeLevels['pulse-velocity-1']} H${this.passiveUpgradeLevels['hull-plating']} E${this.passiveUpgradeLevels['engine-tuning']} C${this.passiveUpgradeLevels['damage-control']}${this.isUpgradeOverlayOpen ? ' (open)' : ''}\n` +
        `Velocity: ${Math.round(this.playerVelocity.x)}, ${Math.round(this.playerVelocity.y)}\n` +
        `Pulse: ${this.pulseCannonProjectiles.length} active, enemy shots: ${this.enemyProjectiles.length}\n` +
        `Enemies: ${this.basicEnemies.length} chaser / ${this.shooterEnemies.length} shooter / ${this.tankEnemies.length} tank\n` +
        spawnDirectorLine +
        `Asteroids: ${this.basicAsteroids.length} active\n` +
        `Collision debug: ${this.isCollisionDebugEnabled ? 'F2 on' : 'F2 off'}\n` +
        blackHoleDebugLine +
        debugWeaponLine +
        `Asteroid view: ${this.asteroidCameraViewCount} direct / ${this.asteroidWrappedViewCount} wrapped / ${this.asteroidWrapMirrorCount} mirrored`
    );
  }

  private handleResize(): void {
    this.rebuildWorld();
  }
}
