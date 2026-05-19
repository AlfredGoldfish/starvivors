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
import enemyWreckageDebrisUrl from '../../assets/scraps_debri/debri.png';
import scrapPickupUrl from '../../assets/scraps_debri/scrap.png';
import upgradeCratePickupUrl from '../../assets/upgrade_create.png';
import bulwarkShipUrl from '../../assets/ships/bulwark.png';
import rammingShieldUrl from '../../assets/ships/ramming shield.png';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize, type ViewportSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { basicEnemy, shooterEnemy, tankEnemy, type EnemyStatProfile } from '../data/enemies';
import { COMBAT_NUMBER_SCALE, COMBAT_VARIANCE } from '../data/combatScale';
import { interceptorMovement } from '../data/balance';
import { DEFAULT_SHIP_ID, getShipDefinition, shipRegistry, type ShipId, type ShipRegistryEntry } from '../data/ships';
import {
  INITIAL_PERMANENT_UPGRADE_LEVELS,
  PERMANENT_UPGRADE_DEFINITIONS,
  VELOCITY_LIMITER_BASE_SPEED,
  VELOCITY_LIMITER_SPEED_BONUS,
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
  UPGRADE_CHOICES,
  type PassiveUpgradeId,
  type UpgradeId,
  type UpgradeDefinition
} from '../data/upgrades';
import { getWeaponDefinition, type RammingShieldStats, type WeaponId, type WeaponRegistryEntry, type WeaponSlotType } from '../data/weapons';
import {
  createPlayerWeaponRuntimeState,
  getActiveAutoWeaponDefinition,
  getActivePrimaryWeaponDefinition,
  getActiveSecondaryWeaponDefinition,
  getOwnedAutoWeaponDefinitions,
  getOwnedManualWeaponDefinitions,
  type PlayerWeaponRuntimeState,
  type PlayerWeaponUpgradeState
} from '../systems/playerWeapons';
import {
  clearPlayerProjectiles as clearPlayerProjectilesSystem,
  destroyPlayerProjectile as destroyPlayerProjectileSystem,
  fireProjectileWeapon as fireProjectileWeaponSystem,
  updatePlayerProjectiles as updatePlayerProjectilesSystem
} from '../systems/projectileWeapons';
import {
  tryHitCircleTargets,
  tryHitEllipseTargets
} from '../systems/projectileHits';
import {
  clearEnemyProjectiles as clearEnemyProjectilesSystem,
  fireShooterProjectile as fireShooterProjectileSystem,
  updateEnemyProjectiles as updateEnemyProjectilesSystem
} from '../systems/enemyProjectiles';
import {
  activateRammingShieldDash,
  canApplyRammingShieldDamage,
  createRammingShieldRuntimeState,
  damageRammingShield,
  ensureRammingShieldRuntime,
  getRammingShieldCircleCollision as getRammingShieldCircleCollisionResult,
  getRammingShieldCollider as getRammingShieldColliderData,
  markRammingShieldDamageApplied,
  updateRammingShieldRuntime,
  type RammingShieldCollider,
  type RammingShieldRuntimeState
} from '../systems/rammingShield';
import {
  createInitialRunUpgradeLevels,
  getAvailableRunUpgrades,
  getRunUpgradeLevel,
  incrementRunUpgradeLevel,
  isRunUpgradeAtMaxLevel,
  type RunUpgradeLevels
} from '../systems/runUpgrades';
import { getWeaponDamageMultiplier, resolveWeaponStats, type ResolvedWeaponStats } from '../systems/weaponStats';
import {
  formatIntegerDisplayUnits,
  toDisplayUnits
} from '../systems/statUnits';
import {
  applyAccelerationWithMass,
  applyCollisionImpulse,
  calculateImpactDamage,
  getClosingSpeed,
  getMassResponseShare,
  getRelativeSpeed,
  getRelativeVelocity,
  steerVelocityToward
} from '../systems/physics';
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
  type BlackHoleFieldTuningConfig,
  type BlackHolePngTextureKey,
  type BlackHoleWhirlpoolTuning
} from '../systems/blackHole';
import {
  DebugState,
  type DebugImpactSourceType,
  type DebugShipStatKey,
  type DebugWeaponStatKey
} from '../systems/debug/debugState';
import {
  createDebugShipLoadoutMarkdown,
  createDebugWeaponLoadoutMarkdown,
  createDebugPresetMarkdown,
  downloadTextFile,
  getTimestampSlug,
  loadMarkdownFile,
  openDesktopDataFolder,
  parseDebugPresetMarkdown,
  parseDebugShipLoadoutMarkdown,
  parseDebugWeaponLoadoutMarkdown,
  toRawDebugDelta,
  toRawDebugValue
} from '../systems/debug/debugPersistence';
import {
  clampBlackHoleForceMultiplier as clampBlackHoleForceMultiplierDebug,
  clampBlackHoleRadiusScale as clampBlackHoleRadiusScaleDebug,
  createBlackHoleFieldTuningMarkdown as createBlackHoleFieldTuningMarkdownDebug,
  createBlackHolePngSetupMarkdown as createBlackHolePngSetupMarkdownDebug,
  isBlackHolePngTextureKey as isBlackHolePngTextureKeyDebug,
  normalizeBlackHoleFieldTuning as normalizeBlackHoleFieldTuningDebug,
  normalizeBlackHolePngSetupLayers as normalizeBlackHolePngSetupLayersDebug,
  parseBlackHoleFieldTuningMarkdown,
  parseBlackHolePngSetupMarkdown
} from '../systems/debug/blackHoleDebugTuning';
import type { DebugAsteroidTier, DebugEnemyType } from '../systems/debug/debugTypes';
import { BlackHoleDebugControls } from '../systems/debug/blackHoleDebugControls';
import { DebugMenuHost } from '../systems/debug/debugMenuHost';
import { DEFAULT_BLACK_HOLE_FIELD_TUNING } from '../systems/worldForces';
import {
  clearBasicAsteroids as clearBasicAsteroidsSystem,
  createAsteroidBreakupProfile as createAsteroidBreakupProfileSystem,
  createAsteroidFragmentTiers as createAsteroidFragmentTiersSystem,
  destroyAsteroidRenderObjects,
  resolveAsteroidCollisions as resolveAsteroidCollisionsSystem,
  spawnAsteroidFragments as spawnAsteroidFragmentsSystem,
  updateBasicAsteroidRuntime
} from '../systems/asteroids';
import {
  updateBasicEnemies as updateBasicEnemiesSystem,
  updateShooterEnemies as updateShooterEnemiesSystem,
  updateTankEnemies as updateTankEnemiesSystem
} from '../systems/enemies';
import {
  ENEMY_LAB_DEFINITIONS,
  ENEMY_LAB_SQUADS,
  type EnemyLabDefinition,
  type EnemyLabSquadDefinition
} from '../data/enemyLabDefinitions';
import { createEnemyLabVisualTextures, getEnemyLabTextureKey } from '../systems/enemyVisuals';
import {
  updateEnemyLabAi as updateLiveEnemyAiSystem,
  type EnemyLabProjectileRequest,
  type EnemyLabScrapTarget
} from '../systems/enemyLabAi';
import {
  clearEnemyLabEnemies as clearLiveEnemiesSystem,
  destroyEnemyLabEnemy as destroyLiveEnemySystem,
  spawnEnemyLabEnemy as spawnLiveEnemySystem,
  spawnEnemyLabSquad as spawnLiveEnemySquadSystem,
  type EnemyLabInstance
} from '../systems/enemyLabSpawner';
import {
  clearEnemyWreckageDebris as clearEnemyWreckageDebrisSystem,
  destroyEnemyWreckageDebris as destroyEnemyWreckageDebrisSystem,
  updateEnemyWreckageDebris as updateEnemyWreckageDebrisSystem
} from '../systems/debris';
import {
  clearDeathShards as clearDeathShardsSystem,
  emitDeathShards as emitDeathShardsSystem,
  updateDeathShards as updateDeathShardsSystem,
  type DeathShard,
  type DeathShardStyle
} from '../systems/deathEffects';
import {
  clearScrapPickups as clearScrapPickupsSystem,
  destroyScrapPickup as destroyScrapPickupSystem,
  spawnScrapPickup as spawnScrapPickupSystem,
  updateScrapPickups as updateScrapPickupsSystem
} from '../systems/pickups';
import {
  resolveBodyImpactCollision as resolveBodyImpactCollisionSystem,
  resolveWorldImpactCollisions as resolveWorldImpactCollisionsSystem
} from '../systems/worldImpacts';
import { createMainMenuScreen } from '../ui/mainMenuScreen';
import { createResultsScreen } from '../ui/resultsScreen';
import { createShipSelectScreen } from '../ui/shipSelectScreen';
import { createShopScreen } from '../ui/shopScreen';
import { createPauseMenuScreen, type PauseMenuTab } from '../ui/pauseMenu';
import { destroyScreenHandle, type ScreenHandle } from '../ui/screenUi';
import type {
  AsteroidBreakupProfile,
  AsteroidTier,
  BasicAsteroid,
  BasicEnemy,
  DamageFeedbackSource,
  EnemyProjectile,
  EnemySpawnType,
  EnemyWreckageDebris,
  GameFlowState,
  PlayerAsteroidContact,
  PlayerDebrisContact,
  PlayerEnemyContact,
  PlayerPickupKind,
  PlayerProjectile,
  RammingShieldCollision,
  ScrapPickup,
  ScrapSourceType,
  SecondaryWeaponChoice,
  ShooterEnemy,
  ShopBackTarget,
  StarvivorsTestHarnessState,
  TankEnemy,
  UpgradeOverlayChoice
} from './gameTypes';
import { CombatFeedbackSystem, type CombatFeedbackSnapshot } from '../systems/combatFeedback';
import { CollisionDebugOverlaySystem, type CollisionDebugOverlaySnapshot } from '../systems/collisionDebugOverlay';
import {
  AutoRunDiagnosticsSystem,
  type AutoRunDiagnosticsRunState
} from '../systems/autoRunDiagnostics';
import {
  getCapsuleCircleCollision,
  getCircleCollision,
  scaleHalfExtent,
  scaleRadius
} from '../systems/collisionShapes';
import { GameplayHudSystem, type GameplayHudSnapshot, type WeaponHotbarSlotSnapshot } from '../systems/gameplayHud';
import { MinimapSystem, type MinimapSnapshot } from '../systems/minimap';
import {
  PerformanceProfilerSystem,
  type PerformanceProfilerCounts,
  type PerformanceProfilerFlags
} from '../systems/performanceProfiler';
import { StarfieldSystem } from '../systems/starfield';
import {
  cloneGameSettings,
  loadGameSettings,
  resetControlSettings,
  resetGameSettings,
  saveGameSettings,
  type BindingSlot,
  type GameSettings,
  type MovementMode,
  type RunControlAction
} from '../systems/gameSettings';

import {
  ASTEROID_BREAKUP_FEEDBACK_MS,
  ASTEROID_COLLISION_COOLDOWN_MS,
  ASTEROID_COLLISION_IMPULSE_SPEED_SCALE,
  ASTEROID_COLLISION_MASS_DAMAGE_SCALE,
  ASTEROID_COLLISION_MAX_DAMAGE,
  ASTEROID_COLLISION_MAX_IMPULSE,
  ASTEROID_COLLISION_MAX_SEPARATION,
  ASTEROID_COLLISION_MIN_DAMAGE_SPEED,
  ASTEROID_COLLISION_MIN_IMPULSE,
  ASTEROID_COLLISION_RESTITUTION,
  ASTEROID_COLLISION_SEPARATION_PERCENT,
  ASTEROID_COLLISION_SPEED_DAMAGE_SCALE,
  ASTEROID_CONTACT_DAMAGE_BY_TIER,
  ASTEROID_IMPACT_EXPLOSION_MS,
  ASTEROID_MAX_ROTATION_SPEED,
  ASTEROID_MIN_ROTATION_SPEED,
  ASTEROID_SAFE_SPAWN_RADIUS,
  ASTEROID_TIER_CONFIG,
  ASTEROID_XP_REWARD_BY_TIER,
  BACKGROUND_TILE_SIZE,
  BASIC_ASTEROID_COUNT,
  BASIC_ENEMY_COUNT,
  BASIC_ENEMY_DISPLAY_SIZE,
  BASIC_ENEMY_TEXTURE_KEY,
  BASIC_ENEMY_VISUAL_ROTATION,
  BASIC_ENEMY_XP_REWARD,
  BLACK_HOLE_ASTEROID_FIELD_MASS_BY_TIER,
  BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_BASE,
  BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_EXTRA,
  BLACK_HOLE_ASTEROID_WHIRLPOOL_TUNING,
  BLACK_HOLE_CHASER_WHIRLPOOL_TUNING,
  BLACK_HOLE_DEBRIS_WHIRLPOOL_TUNING,
  BLACK_HOLE_ENEMY_FIELD_DAMPING,
  BLACK_HOLE_ENEMY_TIDAL_DAMAGE_BASE,
  BLACK_HOLE_ENEMY_TIDAL_DAMAGE_EXTRA,
  BLACK_HOLE_PLAYER_FIELD_MASS,
  BLACK_HOLE_PLAYER_TIDAL_DAMAGE_BASE,
  BLACK_HOLE_PLAYER_TIDAL_DAMAGE_EXTRA,
  BLACK_HOLE_PLAYER_TIDAL_DAMAGE_INTERVAL_MS,
  BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING,
  BLACK_HOLE_SCRAP_WHIRLPOOL_TUNING,
  BLACK_HOLE_SHOOTER_WHIRLPOOL_TUNING,
  BLACK_HOLE_TANK_WHIRLPOOL_TUNING,
  BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS,
  BLACK_HOLE_ZONE_CENTER_EXCLUSION_RATIO,
  CONTACT_IMPACT_MASS_DAMAGE_SCALE,
  CONTACT_IMPACT_MAX_DAMAGE_MULTIPLIER,
  CONTACT_IMPACT_MIN_DAMAGE_SPEED,
  CONTACT_IMPACT_SPEED_DAMAGE_SCALE,
  DAMAGE_FLASH_MS,
  DEBUG_BLACK_HOLE_ADD_PNG_TEXTURE_DEFAULT,
  DEBUG_BLACK_HOLE_LENS_DENSITY_MIN,
  DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT,
  DEBUG_BLACK_HOLE_LENS_LENGTH_MAX,
  DEBUG_BLACK_HOLE_LENS_LENGTH_MIN,
  DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT,
  DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX,
  DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN,
  DEBUG_BLACK_HOLE_LENS_SLIDER_GAP,
  DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT,
  DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH,
  DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN,
  DEBUG_BLACK_HOLE_SELECTED_PNG_LAYER_DEFAULT,
  DEBUG_UPDATE_INTERVAL_MS,
  DEFAULT_STARFIELD_FAR_PARALLAX,
  DEFAULT_STARFIELD_MID_PARALLAX,
  DEFAULT_STARFIELD_NEAR_PARALLAX,
  ENEMY_CONTACT_DAMAGE,
  ENEMY_CONTACT_RESTITUTION_SHARE,
  ENEMY_IMPACT_EXPLOSION_MS,
  ENEMY_SCALING_TARGET_DAMAGE_MULTIPLIER,
  ENEMY_SCALING_TARGET_HP_MULTIPLIER,
  ENEMY_SCALING_TARGET_RUN_MINUTES,
  ENEMY_SPAWN_DOUBLE_SPAWN_STEP,
  ENEMY_SPAWN_ESCALATION_INTERVAL_MS,
  ENEMY_SPAWN_INITIAL_DELAY_MS,
  ENEMY_SPAWN_INTERVAL_MS,
  ENEMY_SPAWN_MAX_ACTIVE_HARD_CAP,
  ENEMY_SPAWN_MAX_ACTIVE_INITIAL,
  ENEMY_SPAWN_MAX_ACTIVE_PER_STEP,
  ENEMY_SPAWN_MIN_INTERVAL_MS,
  ENEMY_SPAWN_SAFE_DISTANCE,
  ENEMY_SPAWN_WEIGHTS_BY_STEP,
  ENEMY_SWARM_BASE_PACK_SIZE,
  ENEMY_SWARM_FIRST_SPAWN_MS,
  ENEMY_SWARM_INTERVAL_MS,
  ENEMY_SWARM_MAX_PACK_SIZE,
  ENEMY_SWARM_OVERFLOW_HARD_CAP,
  ENEMY_SWARM_PACK_SIZE_PER_MINUTE,
  ENEMY_VELOCITY_RESPONSE,
  ENEMY_WRECKAGE_DEBRIS_CONTACT_DAMAGE,
  ENEMY_WRECKAGE_DEBRIS_COUNT_BY_ENEMY,
  ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE,
  ENEMY_WRECKAGE_DEBRIS_HIT_RADIUS,
  ENEMY_WRECKAGE_DEBRIS_HP,
  ENEMY_WRECKAGE_DEBRIS_INHERITED_VELOCITY,
  ENEMY_WRECKAGE_DEBRIS_LIFETIME_MS,
  ENEMY_WRECKAGE_DEBRIS_MASS_BY_ENEMY,
  ENEMY_WRECKAGE_DEBRIS_MAX_ACTIVE,
  ENEMY_WRECKAGE_DEBRIS_MAX_ROTATION_SPEED,
  ENEMY_WRECKAGE_DEBRIS_MAX_SPEED,
  ENEMY_WRECKAGE_DEBRIS_MIN_ROTATION_SPEED,
  ENEMY_WRECKAGE_DEBRIS_MIN_SPEED,
  ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY,
  FORWARD_THRUSTER_INTERVAL_MS,
  IMPACT_MASS_DAMAGE_SCALE_BY_SOURCE,
  IMPACT_MIN_DAMAGE_SPEED_BY_SOURCE,
  INITIAL_ASTEROID_TIERS,
  INITIAL_XP_THRESHOLD,
  PLAYER_CONTACT_IMPULSE_COOLDOWN_MS,
  PLAYER_CONTACT_MAX_IMPULSE,
  PLAYER_CONTACT_MAX_SEPARATION,
  PLAYER_CONTACT_MIN_IMPULSE,
  PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
  PLAYER_CONTACT_SEPARATION_PERCENT,
  PLAYER_DAMAGE_FLASH_MS,
  PLAYER_DAMAGE_INVULNERABILITY_MS,
  PLAYER_HIT_RADIUS,
  PLAYER_MASS,
  PLAYER_MAX_HULL,
  PLAYER_SHIP_DISPLAY_SIZE,
  PLAYER_SHIP_TEXTURE_KEY,
  PLAYER_SHIP_VISUAL_ROTATION,
  RAMMING_SHIELD_COLLIDER_DEPTH,
  RAMMING_SHIELD_DASH_BURST_DISTANCE,
  RAMMING_SHIELD_DASH_BURST_DURATION_SECONDS,
  RAMMING_SHIELD_IMPACT_MASS_DAMAGE_SCALE,
  RAMMING_SHIELD_TEXTURE_CROP,
  RAMMING_SHIELD_TEXTURE_KEY,
  SCRAP_PICKUP_COLLECT_RADIUS,
  SCRAP_PICKUP_DEBUG_VALUE,
  SCRAP_PICKUP_DISPLAY_SIZE,
  SCRAP_PICKUP_RADIUS,
  SCRAP_PICKUP_TEXTURE_KEY,
  SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER,
  SCRAP_PICKUP_VALUE_FROM_DEBRIS,
  SCRAP_TO_CREDIT_RATE,
  SECONDARY_THRUSTER_INTERVAL_MS,
  SHOOTER_ENEMY_COUNT,
  SHOOTER_ENEMY_DISPLAY_SIZE,
  SHOOTER_ENEMY_TEXTURE_KEY,
  SHOOTER_ENEMY_VISUAL_ROTATION,
  STAR_COLORS,
  STARFIELD_FAR_TEXTURE_KEY,
  STARFIELD_MID_TEXTURE_KEY,
  STARFIELD_NEAR_TEXTURE_KEY,
  STARFIELD_PARALLAX_MAX,
  STARFIELD_PARALLAX_MIN,
  STARFIELD_PARALLAX_STEP,
  TANK_ENEMY_COUNT,
  TANK_ENEMY_DISPLAY_SIZE,
  TANK_ENEMY_TEXTURE_KEY,
  TANK_ENEMY_VISUAL_ROTATION,
  THRUSTER_FADE_MS,
  UPGRADE_CRATE_PICKUP_TEXTURE_KEY,
  XP_THRESHOLD_GROWTH
} from './gameConstants';

type LiveGameEnemy = EnemyLabInstance;
type AnyGameEnemy = BasicEnemy | ShooterEnemy | TankEnemy | LiveGameEnemy;

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

const UPGRADE_OVERLAY_CHOICE_COUNT = 6;
const DEATH_SHARD_MAX_ACTIVE = 180;
const NORMAL_UPGRADE_DROP_CHANCE = 0.08;
const SPECIAL_UPGRADE_DROP_CHANCE = 0.025;
const PICKUP_MAGNET_RADIUS_MULTIPLIER = 4.2;

interface EnemyTimeScaling {
  elapsedMinutes: number;
  difficultyMinute: number;
  progress: number;
  hpMultiplier: number;
  damageMultiplier: number;
}

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private rammingShieldImage?: Phaser.GameObjects.Image;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private debugText!: Phaser.GameObjects.Text;
  private gameplayHud!: GameplayHudSystem;
  private upgradeButtonContainer!: Phaser.GameObjects.Container;
  private upgradeButtonGraphics!: Phaser.GameObjects.Graphics;
  private upgradeButtonText!: Phaser.GameObjects.Text;
  private resultsButtonContainer?: Phaser.GameObjects.Container;
  private resultsButtonGraphics?: Phaser.GameObjects.Graphics;
  private resultsButtonText?: Phaser.GameObjects.Text;
  private collisionDebugOverlay!: CollisionDebugOverlaySystem;
  private readonly performanceProfiler = new PerformanceProfilerSystem();
  private readonly autoRunDiagnostics = new AutoRunDiagnosticsSystem({
    getRunState: () => this.getAutoRunDiagnosticsState(),
    getProfiler: () => this.performanceProfiler,
    getTimeMs: () => this.time.now
  });
  private mainMenuScreen?: ScreenHandle;
  private shipSelectScreen?: ScreenHandle;
  private shopScreen?: ScreenHandle;
  private shopBackTarget: ShopBackTarget = 'mainMenu';
  private resultsScreen?: ScreenHandle;
  private pauseMenuScreen?: ScreenHandle;
  private pauseMenuTab: PauseMenuTab = 'pause';
  private starfield!: StarfieldSystem;
  private gameSettings: GameSettings = loadGameSettings();
  private controlKeys = new Map<string, Phaser.Input.Keyboard.Key>();
  private awaitingBinding?: { action: RunControlAction; slot: BindingSlot };
  private debugMenuKey!: Phaser.Input.Keyboard.Key;
  private escapeKey!: Phaser.Input.Keyboard.Key;
  private upgradeChoiceKeys!: Phaser.Input.Keyboard.Key[];
  private playerProjectiles: PlayerProjectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private basicEnemies: BasicEnemy[] = [];
  private shooterEnemies: ShooterEnemy[] = [];
  private tankEnemies: TankEnemy[] = [];
  private liveEnemies: LiveGameEnemy[] = [];
  private basicAsteroids: BasicAsteroid[] = [];
  private enemyWreckageDebris: EnemyWreckageDebris[] = [];
  private deathShards: DeathShard[] = [];
  private scrapPickups: ScrapPickup[] = [];
  private blackHole?: BlackHoleSystem;
  private gameFlowState: GameFlowState = 'mainMenu';
  private selectedShipId: ShipId = DEFAULT_SHIP_ID;
  private hangarPreviewShipId: ShipId = DEFAULT_SHIP_ID;
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
  private rammingShieldDashBurstRemaining = 0;
  private rammingShieldDashBurstSpeed = 0;
  private rammingShieldDashPendingImpulse = 0;
  private rammingShieldDashBurstDirection = new Phaser.Math.Vector2(0, 0);
  private isPlayerDead = false;
  private playerXp = 0;
  private nextXpThreshold = INITIAL_XP_THRESHOLD;
  private bankedUpgrades = 0;
  private asteroidCameraViewCount = 0;
  private asteroidWrappedViewCount = 0;
  private asteroidWrapMirrorCount = 0;
  private playerWeapons: PlayerWeaponRuntimeState = createPlayerWeaponRuntimeState(getShipDefinition(DEFAULT_SHIP_ID));
  private hasResolvedSecondaryWeaponChoice = false;
  private nextForwardThrusterAt = 0;
  private nextReverseThrusterAt = 0;
  private nextLeftStrafeThrusterAt = 0;
  private nextRightStrafeThrusterAt = 0;
  private nextDebugUpdateAt = 0;
  private nextPlayerContactImpulseAt = 0;
  private playerBodyImpactCooldowns = new WeakMap<object, number>();
  private asteroidCollisionCooldowns = new WeakMap<object, WeakMap<object, number>>();
  private pulseVolleyCount = 0;
  private isPulseEmergencyCharged = false;
  private pulseLifestealWindowStartedAt = 0;
  private pulseLifestealRestoredThisWindow = 0;
  private pulseIonizedTargets = new WeakMap<object, number>();
  private pulseCriticalTargets = new WeakMap<object, { stacks: number; expiresAt: number }>();
  private combatFeedback!: CombatFeedbackSystem;
  private nextBlackHolePlayerDamageAt = 0;
  private nextEnemySpawnAt = 0;
  private nextEnemySwarmAt = 0;
  private runStartedAt = 0;
  private readonly debugState = new DebugState();
  private runUpgradeLevels: RunUpgradeLevels = createInitialRunUpgradeLevels();
  private isUpgradeOverlayOpen = false;
  private isPauseMenuOpen = false;
  private pauseMenuOpenedAt = 0;
  private totalPauseMenuPauseMs = 0;
  private suppressPauseToggleUntil = 0;
  private upgradeOverlayOpenedAt = 0;
  private totalUpgradePauseMs = 0;
  private debugMenuHost?: DebugMenuHost;
  private blackHoleDebugControls!: BlackHoleDebugControls;
  private debugMenuOpenedAt = 0;
  private totalDebugPauseMs = 0;
  private permanentUpgradeLevels: Record<PermanentUpgradeId, number> = { ...INITIAL_PERMANENT_UPGRADE_LEVELS };
  private activePermanentUpgradeLevels: Record<PermanentUpgradeId, number> = { ...INITIAL_PERMANENT_UPGRADE_LEVELS };
  private upgradeOverlayGraphics!: Phaser.GameObjects.Graphics;
  private upgradeOverlayText!: Phaser.GameObjects.Text;
  private upgradeOverlayPromptText!: Phaser.GameObjects.Text;
  private upgradeOverlayChoiceTexts: Phaser.GameObjects.Text[] = [];
  private upgradeOverlayChoiceMetaTexts: Phaser.GameObjects.Text[] = [];
  private upgradeOverlayChoiceHitZones: Phaser.GameObjects.Zone[] = [];
  private normalUpgradeOverlayChoices: UpgradeOverlayChoice[] | null = null;
  private specialUpgradeOverlayChoices: UpgradeDefinition[] | null = null;
  private nextDebugMenuRefreshAt = 0;
  private isDebugMenuRefreshDirty = true;
  private minimap!: MinimapSystem;
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

    this.load.image(ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY, enemyWreckageDebrisUrl);
    this.load.image(SCRAP_PICKUP_TEXTURE_KEY, scrapPickupUrl);
    this.load.image(UPGRADE_CRATE_PICKUP_TEXTURE_KEY, upgradeCratePickupUrl);
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
    this.combatFeedback = new CombatFeedbackSystem({
      scene: this,
      debugState: this.debugState,
      getNearestWrappedRenderPosition: (x, y) => this.getNearestWrappedRenderPosition(x, y),
      getEnemyHitRadius: (enemy) => this.getEnemyHitRadius(enemy)
    });
    this.starfield = new StarfieldSystem({
      scene: this,
      getWrappedDirection: (fromX, fromY, toX, toY) => this.getWrappedDirection(fromX, fromY, toX, toY)
    });
    createEnemyLabVisualTextures(this, ENEMY_LAB_DEFINITIONS);
    this.minimap = new MinimapSystem(this);
    this.gameplayHud = new GameplayHudSystem(this, {
      assignWeaponSlot: (slot, weaponId) => this.assignWeaponHotbarSlot(slot, weaponId)
    });
    this.collisionDebugOverlay = new CollisionDebugOverlaySystem({
      scene: this,
      getNearestWrappedRenderCoordinate: (value, cameraCenter, arenaSize) =>
        this.getNearestWrappedRenderCoordinate(value, cameraCenter, arenaSize),
      getNearestWrappedRenderPosition: (x, y) => this.getNearestWrappedRenderPosition(x, y),
      isCircleInCameraView: (x, y, radius) => this.isCircleInCameraView(x, y, radius),
      getForwardDirection: (rotation) => this.getForwardDirection(rotation)
    });
    this.blackHoleDebugControls = new BlackHoleDebugControls({
      scene: this,
      getState: () => ({
        collisionDebugEnabled: this.debugState.collisionDebugEnabled,
        isUpgradeOverlayOpen: this.isUpgradeOverlayOpen,
        isDebugMenuOpen: this.debugMenuHost?.isOpen() ?? false,
        isPlayerDead: this.isPlayerDead,
        lensOrbitSpeedMultiplier: this.debugBlackHoleLensOrbitSpeedMultiplier,
        lensDensity: this.debugBlackHoleLensDensity,
        lensLengthMultiplier: this.debugBlackHoleLensLengthMultiplier,
        visualScale: this.debugBlackHoleVisualScale,
        projectionLensLayersEnabled: this.areDebugBlackHoleProjectionLensLayersEnabled
      }),
      setLensOrbitSpeedMultiplier: (value) => {
        this.debugBlackHoleLensOrbitSpeedMultiplier = value;
      },
      setLensDensity: (value) => {
        this.debugBlackHoleLensDensity = value;
      },
      setLensLengthMultiplier: (value) => {
        this.debugBlackHoleLensLengthMultiplier = value;
      },
      setVisualScale: (value) => {
        this.debugBlackHoleVisualScale = value;
      },
      toggleProjectionLensLayers: () => {
        this.areDebugBlackHoleProjectionLensLayersEnabled = !this.areDebugBlackHoleProjectionLensLayersEnabled;
      },
      onChanged: () => {
        this.nextDebugUpdateAt = 0;
      }
    });
    this.createInput();
    this.createBackgroundTextures();
    this.showMainMenu();
    this.installTestHarness();
    this.autoRunDiagnostics.installGlobalHandlers();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(time: number, delta: number): void {
    this.beginPerformanceFrame(time, delta);
    this.profileStep('debug-menu-input', () => this.updateDebugMenuInput(time));

    if (this.gameFlowState === 'mainMenu' || this.gameFlowState === 'shop' || this.gameFlowState === 'shipSelect') {
      this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
      this.endPerformanceFrame();
      return;
    }

    this.profileStep('upgrade-overlay-input', () => this.updateUpgradeOverlayInput(time));
    this.profileStep('pause-menu-input', () => this.updatePauseMenuInput(time));

    if (this.isUpgradeOverlayOpen) {
      this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
      this.profileStep('background', () => this.updateBackgroundTiles(time));
      this.profileStep('hud', () => this.updateGameplayHud(time));
      this.profileStep('minimap', () => this.updateMinimap());
      this.profileStep('debug-text', () => this.updateDebugText(time));
      this.endPerformanceFrame();
      return;
    }

    if (this.isPauseMenuOpen) {
      this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
      this.profileStep('background', () => this.updateBackgroundTiles(time));
      this.profileStep('hud', () => this.updateGameplayHud(time));
      this.profileStep('minimap', () => this.updateMinimap());
      this.profileStep('debug-text', () => this.updateDebugText(time));
      this.endPerformanceFrame();
      return;
    }

    const deltaSeconds = delta / 1000;

    if (this.debugState.debugGamePaused) {
      this.profileStep('black-hole', () => this.updateBlackHole(time, deltaSeconds, false));
    } else {
      this.profileStep('player-movement', () => this.updatePlayerMovement(time, this.isPlayerDead ? 0 : deltaSeconds));
      this.profileStep('enemy-spawn-director', () => this.updateEnemySpawnDirector(time));
      this.profileStep('live-enemies', () => this.updateLiveEnemies(time, deltaSeconds));
      this.profileStep('asteroids', () => this.updateBasicAsteroids(deltaSeconds));
      this.profileStep('black-hole', () => this.updateBlackHole(time, deltaSeconds, true));
      this.profileStep('debris', () => this.updateEnemyWreckageDebris(time, deltaSeconds));
      this.profileStep('death-shards', () => this.updateDeathShards(delta));
      this.profileStep('world-impacts', () => this.resolveWorldImpactCollisions(time));
      if (!this.isPlayerDead) {
        this.profileStep('player-wrap', () => this.wrapPlayer());
      }
      this.profileStep('scrap-pickups', () => this.updateScrapPickups(time, deltaSeconds));
      if (!this.isPlayerDead) {
        this.profileStep('black-hole-player-collision', () => this.updateBlackHolePlayerCollision());
        this.profileStep('player-contact', () => this.updatePlayerContactDamage(time));
        this.profileStep('ramming-shield', () => this.updateRammingShield(time, deltaSeconds));
        this.profileStep('active-main-weapon', () => this.updateActiveMainWeapon(time));
      }
      this.profileStep('player-projectiles', () => this.updatePlayerProjectiles(time, deltaSeconds));
      this.profileStep('enemy-projectiles', () => this.updateEnemyProjectiles(time, deltaSeconds));
      this.profileStep('player-damage-visuals', () => this.updatePlayerDamageVisuals(time));
    }

    this.profileStep('combat-feedback', () => this.combatFeedback.update(delta, this.getCombatFeedbackSnapshot()));
    this.profileStep('collision-overlay', () => this.updateCollisionDebugOverlay());
    this.profileStep('background', () => this.updateBackgroundTiles(time));
    this.profileStep('hud', () => this.updateGameplayHud(time));
    this.profileStep('minimap', () => this.updateMinimap());
    this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
    this.profileStep('debug-text', () => this.updateDebugText(time));
    this.endPerformanceFrame();
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for the STARVIVORS scaffold.');
    }

    this.input.mouse?.disableContextMenu();
    this.rebuildControlKeys();
    this.debugMenuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.upgradeChoiceKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX)
    ];
  }

  private rebuildControlKeys(): void {
    if (!this.input.keyboard) {
      return;
    }

    this.controlKeys.clear();
    for (const binding of Object.values(this.gameSettings.keyBindings)) {
      for (const code of [binding.primary, binding.secondary]) {
        const keyCode = this.getPhaserKeyCode(code);
        if (code && keyCode !== undefined && !this.controlKeys.has(code)) {
          this.controlKeys.set(code, this.input.keyboard.addKey(keyCode));
        }
      }
    }
  }

  private getPhaserKeyCode(code: string | undefined): number | undefined {
    if (!code) {
      return undefined;
    }

    if (code.startsWith('Key') && code.length === 4) {
      return Phaser.Input.Keyboard.KeyCodes[code.slice(3) as keyof typeof Phaser.Input.Keyboard.KeyCodes] as number | undefined;
    }

    if (code.startsWith('Digit') && code.length === 6) {
      return Phaser.Input.Keyboard.KeyCodes[code.slice(5) as keyof typeof Phaser.Input.Keyboard.KeyCodes] as number | undefined;
    }

    const specialCodes: Record<string, number> = {
      ArrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      ArrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      ArrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      ArrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      Escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      ShiftLeft: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      ShiftRight: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      ControlLeft: Phaser.Input.Keyboard.KeyCodes.CTRL,
      ControlRight: Phaser.Input.Keyboard.KeyCodes.CTRL,
      AltLeft: Phaser.Input.Keyboard.KeyCodes.ALT,
      AltRight: Phaser.Input.Keyboard.KeyCodes.ALT,
      Tab: Phaser.Input.Keyboard.KeyCodes.TAB,
      Enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      Backspace: Phaser.Input.Keyboard.KeyCodes.BACKSPACE
    };

    return specialCodes[code];
  }

  private isControlDown(action: RunControlAction): boolean {
    const binding = this.gameSettings.keyBindings[action];
    return [binding.primary, binding.secondary].some((code) => Boolean(code && this.controlKeys.get(code)?.isDown));
  }

  private isControlJustDown(action: RunControlAction): boolean {
    const binding = this.gameSettings.keyBindings[action];
    return [binding.primary, binding.secondary].some((code) => {
      const key = code ? this.controlKeys.get(code) : undefined;
      return Boolean(key && Phaser.Input.Keyboard.JustDown(key));
    });
  }

  private isPauseJustDown(): boolean {
    return this.isControlJustDown('pause') || Phaser.Input.Keyboard.JustDown(this.escapeKey);
  }

  private createDebugMenu(): void {
    this.debugMenuHost = new DebugMenuHost({
      scene: this,
      getValues: () => this.getDebugMenuValues(),
      callbacks: {
        close: () => this.closeDebugMenu(this.time.now),
        saveDebugPreset: () => this.runDebugMenuAction(() => this.saveDebugPreset()),
        loadDebugPreset: () => this.runDebugMenuAction(() => this.loadDebugPreset()),
        resetDebugTuning: () => this.runDebugMenuAction(() => this.resetDebugTuning()),
        toggleDebugPause: () => this.runDebugMenuAction(() => this.toggleDebugGamePause(this.time.now)),
        togglePerformanceProfiler: () => this.runDebugMenuAction(() => this.performanceProfiler.toggleEnabled()),
        startPerformanceCapture: () => this.runDebugMenuAction(() => this.performanceProfiler.startManualCapture()),
        stopPerformanceCapture: () => this.runDebugMenuAction(() => this.performanceProfiler.stopManualCapture()),
        exportPerformanceReport: () => this.runDebugMenuAction(() => this.exportPerformanceReport()),
        clearPerformanceProfiler: () => this.runDebugMenuAction(() => this.performanceProfiler.clear()),
        openReportsFolder: () => this.runDebugMenuAction(() => openDesktopDataFolder('reports')),
        openDataFolder: () => this.runDebugMenuAction(() => openDesktopDataFolder()),
        toggleAutoDiagnostics: () => this.runDebugMenuAction(() => this.autoRunDiagnostics.toggleEnabled()),
        writeAutoDiagnosticReportNow: () => this.runDebugMenuAction(() => this.autoRunDiagnostics.writeManualReport()),
        openCurrentRunDiagnosticsFolder: () =>
          this.runDebugMenuAction(() => openDesktopDataFolder('runs', this.autoRunDiagnostics.getCurrentRunId())),
        openRunsFolder: () => this.runDebugMenuAction(() => openDesktopDataFolder('runs')),
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
        adjustPlayerThrustScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerThrustScale(delta)),
        adjustPlayerBrakeScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerBrakeScale(delta)),
        adjustPlayerStrafeScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerStrafeScale(delta)),
        adjustPlayerInertiaScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerInertiaScale(delta)),
        adjustPlayerControlMassExponent: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustPlayerControlMassExponent(delta)),
        adjustEnemySpeedScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustEnemySpeedScale(delta)),
        adjustEnemyResponseScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustEnemyResponseScale(delta)),
        adjustEnemyMassExponent: (delta) => this.runDebugMenuAction(() => this.debugState.adjustEnemyMassExponent(delta)),
        adjustAsteroidCollisionDamageScale: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustAsteroidCollisionDamageScale(delta)),
        adjustAsteroidCollisionImpulseScale: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustAsteroidCollisionImpulseScale(delta)),
        adjustGlobalMaxSpeed: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustGlobalMaxSpeed(toRawDebugDelta('globalMaxSpeed', delta))),
        adjustGlobalImpactDamageCap: (delta) => this.runDebugMenuAction(() => this.debugState.adjustGlobalImpactDamageCap(delta)),
        adjustImpactDamageCap: (source, delta) => this.runDebugMenuAction(() => this.debugState.adjustImpactDamageCap(source, delta)),
        adjustImpactDamageScale: (source, delta) => this.runDebugMenuAction(() => this.debugState.adjustImpactDamageScale(source, delta)),
        setPhysicsTuning: (key, value) =>
          this.runDebugMenuAction(() =>
            this.debugState.setPhysicsTuning(key, key === 'globalMaxSpeed' ? toRawDebugValue('globalMaxSpeed', value) : value)
          ),
        resetPhysicsTuning: () => this.runDebugMenuAction(() => this.debugState.resetPhysicsTuning()),
        toggleHealthBars: () => this.runDebugMenuAction(() => {
          this.debugState.healthBarsEnabled = !this.debugState.healthBarsEnabled;
        }),
        togglePlayerHealthBar: () => this.runDebugMenuAction(() => {
          this.debugState.playerHealthBarEnabled = !this.debugState.playerHealthBarEnabled;
        }),
        toggleHealthBarRevealOnPlayerDamage: () => this.runDebugMenuAction(() => {
          this.debugState.healthBarRevealOnPlayerDamage = !this.debugState.healthBarRevealOnPlayerDamage;
        }),
        adjustHealthBarWidthScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustHealthBarWidthScale(delta)),
        adjustHealthBarHeight: (delta) => this.runDebugMenuAction(() => this.debugState.adjustHealthBarHeight(delta)),
        adjustHealthBarVerticalOffset: (delta) => this.runDebugMenuAction(() => this.debugState.adjustHealthBarVerticalOffset(delta)),
        adjustHealthBarAlpha: (delta) => this.runDebugMenuAction(() => this.debugState.adjustHealthBarAlpha(delta)),
        toggleDamageNumbers: () => this.runDebugMenuAction(() => {
          this.debugState.damageNumbersEnabled = !this.debugState.damageNumbersEnabled;
        }),
        toggleDamageNumberSourceColors: () => this.runDebugMenuAction(() => {
          this.debugState.damageNumberSourceColorsEnabled = !this.debugState.damageNumberSourceColorsEnabled;
        }),
        adjustDamageNumberFontSize: (delta) => this.runDebugMenuAction(() => this.debugState.adjustDamageNumberFontSize(delta)),
        adjustDamageNumberLifetimeMs: (delta) => this.runDebugMenuAction(() => this.debugState.adjustDamageNumberLifetimeMs(delta)),
        adjustDamageNumberRiseDistance: (delta) => this.runDebugMenuAction(() => this.debugState.adjustDamageNumberRiseDistance(delta)),
        adjustDamageNumberDrift: (delta) => this.runDebugMenuAction(() => this.debugState.adjustDamageNumberDrift(delta)),
        adjustDamageNumberScalePop: (delta) => this.runDebugMenuAction(() => this.debugState.adjustDamageNumberScalePop(delta)),
        adjustDamageNumberFadeStart: (delta) => this.runDebugMenuAction(() => this.debugState.adjustDamageNumberFadeStart(delta)),
        adjustDamageNumberAlpha: (delta) => this.runDebugMenuAction(() => this.debugState.adjustDamageNumberAlpha(delta)),
        resetCombatFeedbackTuning: () => this.runDebugMenuAction(() => this.debugState.resetCombatFeedbackTuning()),
        adjustCollisionShapeScale: (key, delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustCollisionShapeScale(key, delta)),
        setCollisionShapeScale: (key, value) =>
          this.runDebugMenuAction(() => this.debugState.setCollisionShapeScale(key, value)),
        resetCollisionShapeTuning: () => this.runDebugMenuAction(() => this.debugState.resetCollisionShapeTuning()),
        adjustDeathShardTuning: (style, key, delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustDeathShardTuning(style, key, delta)),
        setDeathShardTuning: (style, key, value) =>
          this.runDebugMenuAction(() => this.debugState.setDeathShardTuning(style, key, value)),
        resetDeathShardTuning: () => this.runDebugMenuAction(() => this.debugState.resetDeathShardTuning()),
        testDeathShardEffect: (style) => this.runDebugMenuAction(() => this.testDeathShardEffect(style)),
        adjustWeaponDamage: (delta) => this.runDebugMenuAction(() => this.debugState.adjustWeaponDamageMultiplier(delta)),
        adjustWeaponFireRate: (delta) => this.runDebugMenuAction(() => this.debugState.adjustWeaponFireRateMultiplier(delta)),
        adjustWeaponCooldownSeconds: (deltaSeconds) =>
          this.runDebugMenuAction(() =>
            this.debugState.adjustWeaponCooldownSeconds(
              this.getActiveAutoWeaponBaseCooldownMs() / 1000,
              this.getActiveAutoWeaponCooldownMs() / 1000,
              deltaSeconds
            )
          ),
        resetWeaponTuning: () => this.runDebugMenuAction(() => this.debugState.resetWeaponTuning()),
        adjustShipLoadoutStat: (shipId, stat, delta) =>
          this.runDebugMenuAction(() => this.adjustDebugShipLoadoutStat(shipId, stat, delta)),
        setShipLoadoutStat: (shipId, stat, value) =>
          this.runDebugMenuAction(() => this.setDebugShipLoadoutStat(shipId, stat, value)),
        resetShipLoadout: (shipId) => this.runDebugMenuAction(() => {
          this.debugState.resetShipTuning(shipId);
          if (shipId === this.selectedShipId) {
            this.playerHull = Math.min(this.playerHull, this.getPlayerMaxHull());
          }
        }),
        saveShipLoadout: (shipId) => this.runDebugMenuAction(() => this.saveDebugShipLoadout(shipId)),
        loadShipLoadout: (shipId) => this.runDebugMenuAction(() => this.loadDebugShipLoadout(shipId)),
        adjustWeaponLoadoutStat: (weaponId, stat, delta) =>
          this.runDebugMenuAction(() => this.adjustDebugWeaponLoadoutStat(weaponId, stat, delta)),
        setWeaponLoadoutStat: (weaponId, stat, value) =>
          this.runDebugMenuAction(() => this.setDebugWeaponLoadoutStat(weaponId, stat, value)),
        resetWeaponLoadout: (weaponId) => this.runDebugMenuAction(() => {
          this.debugState.resetWeaponLoadoutTuning(weaponId);
          this.syncRammingShieldDebugRuntime();
        }),
        saveWeaponLoadout: (weaponId) => this.runDebugMenuAction(() => this.saveDebugWeaponLoadout(weaponId)),
        loadWeaponLoadout: (weaponId) => this.runDebugMenuAction(() => this.loadDebugWeaponLoadout(weaponId)),
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
    this.debugMenuHost.create();
  }

  private runDebugMenuAction(action: () => void): void {
    action();
    this.isDebugMenuRefreshDirty = true;
    this.refreshDebugMenu(this.time.now, true);
    this.updateCollisionDebugOverlay();
  }

  private addDebugCredits(amount: number): void {
    const shouldReopenDebugMenu = this.debugMenuHost?.isOpen() ?? false;
    this.totalCredits = Math.max(0, this.totalCredits + amount);

    if (this.gameFlowState === 'mainMenu') {
      this.showMainMenu();
    } else if (this.gameFlowState === 'shipSelect') {
      this.showShipSelect();
    } else if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
    } else if (this.gameFlowState === 'results' && this.resultsScreen) {
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
    this.nextEnemySwarmAt += pauseDurationMs;
    this.debugMenuOpenedAt = 0;
  }

  private refreshDebugMenu(time = this.time.now, force = false): void {
    if (!this.debugMenuHost?.isOpen()) {
      this.isDebugMenuRefreshDirty = true;
      return;
    }

    if (!force && !this.isDebugMenuRefreshDirty && time < this.nextDebugMenuRefreshAt) {
      return;
    }

    this.debugMenuHost.refresh();
    this.isDebugMenuRefreshDirty = false;
    this.nextDebugMenuRefreshAt = time + DEBUG_UPDATE_INTERVAL_MS;
  }

  private beginPerformanceFrame(time: number, delta: number): void {
    this.performanceProfiler.beginFrame({
      timeMs: time,
      deltaMs: delta,
      fps: this.game.loop.actualFps,
      counts: this.getPerformanceProfilerCounts(),
      flags: this.getPerformanceProfilerFlags()
    });
  }

  private profileStep<T>(name: string, callback: () => T): T {
    return this.performanceProfiler.measure(name, callback);
  }

  private endPerformanceFrame(): void {
    this.performanceProfiler.endFrame(this.getPerformanceProfilerCounts());
    this.autoRunDiagnostics.update();
  }

  private getAutoRunDiagnosticsState(): AutoRunDiagnosticsRunState {
    return {
      selectedShipName: this.getSelectedShipDefinition().displayName,
      runTimeSeconds: this.getSurvivalElapsedMs(this.time.now) / 1000,
      playerHull: this.playerHull,
      playerMaxHull: this.getPlayerMaxHull(),
      playerXp: this.playerXp,
      bankedUpgrades: this.bankedUpgrades,
      runScrapTotal: this.runScrapTotal,
      totalCredits: this.totalCredits,
      activeWeaponName: this.getActivePrimaryWeaponDefinition()?.displayName ?? this.getEffectiveAutoWeaponDefinition()?.displayName ?? 'None',
      mainWeaponUpgradeSummary: this.getActiveAutoWeaponUpgradeHudSummary(),
      counts: this.getPerformanceProfilerCounts()
    };
  }

  private getPerformanceProfilerCounts(): PerformanceProfilerCounts {
    return {
      chasers: this.basicEnemies.length,
      shooters: this.shooterEnemies.length,
      tanks: this.tankEnemies.length,
      asteroids: this.basicAsteroids.length,
      debris: this.enemyWreckageDebris.length,
      scrap: this.scrapPickups.length,
      playerProjectiles: this.playerProjectiles.length,
      enemyProjectiles: this.enemyProjectiles.length,
      deathShards: this.deathShards.length
    };
  }

  private getPerformanceProfilerFlags(): PerformanceProfilerFlags {
    return {
      flowState: this.gameFlowState,
      debugMenuOpen: this.debugMenuHost?.isOpen() ?? false,
      debugPaused: this.debugState.debugGamePaused,
      upgradeOverlayOpen: this.isUpgradeOverlayOpen,
      collisionDebugEnabled: this.debugState.collisionDebugEnabled,
      blackHoleActive: Boolean(this.blackHole)
    };
  }

  private exportPerformanceReport(): void {
    const markdown = this.performanceProfiler.createMarkdownReport({
      savedAt: new Date(),
      selectedShipName: this.getSelectedShipDefinition().displayName,
      runTimeSeconds: this.getSurvivalElapsedMs(this.time.now) / 1000,
      playerHull: this.playerHull,
      playerMaxHull: this.getPlayerMaxHull()
    });

    downloadTextFile(`starvivors-lag-report-${getTimestampSlug()}.md`, markdown, 'text/markdown', 'reports');
  }

  private getDebugMenuValues() {
    const time = this.time.now;

    return this.debugState.createMenuValues({
      selectedShipName: this.getSelectedShipDefinition().displayName,
      weaponCooldownSeconds: this.getActiveAutoWeaponCooldownMs() / 1000,
      ...this.starfield.getDebugValues(),
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
      performanceProfilerEnabled: this.performanceProfiler.isEnabled(),
      performanceProfilerManualActive: this.performanceProfiler.isManualCaptureActive(),
      performanceProfilerSummary: this.performanceProfiler.getMenuSummary(),
      autoDiagnosticsEnabled: this.autoRunDiagnostics.isEnabled(),
      autoDiagnosticsActive: this.autoRunDiagnostics.isActive(),
      autoDiagnosticsSummary: this.autoRunDiagnostics.getMenuSummary(),
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
      playerMass: this.getPlayerMass(),
      playerSpeed: this.playerVelocity.length(),
      playerMaxSpeed: this.getPlayerMaxSpeed(),
      playerThrust: this.getPlayerThrustAcceleration(),
      playerBrake: this.getPlayerReverseThrustAcceleration(),
      playerStrafe: this.getPlayerStrafeThrustAcceleration(),
      rammingShieldHp: this.rammingShieldState.hp,
      rammingShieldMaxHp: this.getRammingShieldMaxHp(),
      rammingShieldDashCharges: this.rammingShieldState.dashCharges,
      rammingShieldDashMaxCharges: this.hasRammingShield() ? this.getRammingShieldStats().dashMaxCharges : 0,
      shipTuningSummaries: {
        interceptor: this.debugState.getShipTuningSummary(getShipDefinition('interceptor')),
        bulwark: this.debugState.getShipTuningSummary(getShipDefinition('bulwark'))
      },
      weaponTuningSummaries: {
        'pulse-cannon': this.debugState.getWeaponTuningSummary(getWeaponDefinition('pulse-cannon')),
        'ramming-shield': this.debugState.getWeaponTuningSummary(getWeaponDefinition('ramming-shield'))
      },
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
      purchasePermanentUpgrade: (upgradeId: PermanentUpgradeId) => {
        const upgrade = PERMANENT_UPGRADE_DEFINITIONS.find((candidate) => candidate.id === upgradeId);
        if (upgrade) {
          this.purchasePermanentUpgrade(upgrade);
        }

        return this.getTestHarnessState();
      },
      adjustActivePermanentUpgrade: (upgradeId: PermanentUpgradeId, delta: number) => {
        this.adjustActivePermanentUpgradeLevel(upgradeId, delta);
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
          this.destroyEnemyWithRewards(enemy, this.basicEnemies, 0, 'chaser');
        } else if (this.liveEnemies[0] && !this.isPlayerDead) {
          this.destroyLiveEnemyWithRewards(this.liveEnemies[0], 0);
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
      assignWeaponSlot: (slot: WeaponSlotType, weaponId: WeaponId) => {
        this.assignWeaponHotbarSlot(slot, weaponId);
        return this.getTestHarnessState();
      },
      clickUpgradeButton: () => {
        this.handleUpgradeButtonClick();
        return this.getTestHarnessState();
      },
      toggleMinimap: () => {
        this.minimap.toggle();
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

    if (query.get('testHarness') === 'weaponHotbar') {
      this.runTestHarnessWeaponHotbar();
    }

    if (query.get('testHarness') === 'worldImpactCleanup') {
      this.runTestHarnessWorldImpactCleanup();
    }

    if (query.get('testHarness') === 'velocityLimiter') {
      this.runTestHarnessVelocityLimiter();
    }

    if (query.get('testHarness') === 'enemyScaling') {
      this.startRun();
      this.runTestHarnessEnemyScaling();
    }

    if (query.get('testHarness') === 'combatScale') {
      this.startRun();
      this.runTestHarnessCombatScale();
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
      isResultsScreenOpen: Boolean(this.resultsScreen),
      isResultsButtonVisible: Boolean(this.resultsButtonContainer?.visible),
      autoWeaponId: this.playerWeapons.activeAutoWeaponId,
      primaryWeaponId: this.playerWeapons.activePrimaryWeaponId,
      secondaryWeaponId: this.playerWeapons.activeSecondaryWeaponId,
      ownedAutoWeaponIds: [...this.playerWeapons.ownedAutoWeaponIds],
      ownedManualWeaponIds: [...this.playerWeapons.ownedManualWeaponIds],
      pulseDamageLevel: this.getRunUpgradeLevelById('pulse_damage'),
      pulseFireRateLevel: this.getRunUpgradeLevelById('pulse_fire_rate'),
      pulseVelocityLevel: this.getRunUpgradeLevelById('pulse_velocity'),
      hullPlatingLevel: this.getRunUpgradeLevelById('hull-plating'),
      engineTuningLevel: this.getRunUpgradeLevelById('engine-tuning'),
      damageControlLevel: this.getRunUpgradeLevelById('damage-control'),
      velocityLimiterLevel: this.getPermanentUpgradeLevel('velocity-limiter'),
      velocityLimiterActiveLevel: this.getActivePermanentUpgradeLevel('velocity-limiter'),
      playerVelocityLimit: this.getPlayerVelocityLimit(),
      playerSpeed: this.playerVelocity.length(),
      weaponDamageMultiplier: this.getActiveAutoWeaponDamageMultiplier(),
      pulseCooldownMs: this.getPulseCannonCooldownMs(),
      pulseProjectileSpeed: this.getActiveAutoWeaponProjectileSpeed(),
      playerAccelerationMultiplier: this.getPlayerAccelerationMultiplier(),
      playerMaxSpeed: this.getPlayerMaxSpeed(),
      playerInvulnerabilityMs: this.getPlayerDamageInvulnerabilityMs(),
      isMinimapVisible: this.minimap.isVisible(),
      enemies: this.basicEnemies.length,
      shooterEnemies: this.shooterEnemies.length,
      tankEnemies: this.tankEnemies.length,
      liveEnemies: this.liveEnemies.length,
      activeEnemies: this.getActiveEnemyCount(),
      asteroids: this.basicAsteroids.length,
      scrapPickups: this.scrapPickups.length,
      projectiles: this.playerProjectiles.length,
      enemyProjectiles: this.enemyProjectiles.length
    };
  }

  private runTestHarnessCombatScale(): void {
    const pulseWeapon = getWeaponDefinition('pulse-cannon');
    const expectedBasePulseDamage = pulseWeapon.damage ?? 0;
    const basePulseDamage = this.getResolvedWeaponStats(pulseWeapon, 'primary').projectile?.damage ?? 0;
    this.runUpgradeLevels = {
      ...this.runUpgradeLevels,
      pulse_flat_damage_common: 1
    };
    const flatPulseDamage = this.getResolvedWeaponStats(pulseWeapon, 'primary').projectile?.damage ?? 0;
    const baselineChaser = this.createScaledEnemyStats('chaser', this.runStartedAt, { applyVariance: false });
    const varianceSamples = Array.from({ length: 24 }, () =>
      this.createScaledEnemyStats('chaser', this.runStartedAt, { applyVariance: true })
    );
    const minVarianceHp = Math.round(basicEnemy.stats.maxHull * (1 - COMBAT_VARIANCE));
    const maxVarianceHp = Math.round(basicEnemy.stats.maxHull * (1 + COMBAT_VARIANCE));
    const varianceWithinRange = varianceSamples.every(
      (sample) => sample.maxHull >= minVarianceHp && sample.maxHull <= maxVarianceHp
    );
    const varianceApplied = varianceSamples.some((sample) => sample.maxHull !== basicEnemy.stats.maxHull);
    const flatRewards =
      baselineChaser.xpValue === basicEnemy.stats.xpValue &&
      baselineChaser.scrapValue === basicEnemy.stats.scrapValue;
    const wholeNumbers =
      Number.isInteger(basePulseDamage) &&
      Number.isInteger(flatPulseDamage) &&
      Number.isInteger(baselineChaser.maxHull) &&
      Number.isInteger(this.getPlayerMaxHull());

    const pass =
      basePulseDamage === expectedBasePulseDamage &&
      flatPulseDamage === expectedBasePulseDamage + 5 &&
      baselineChaser.maxHull === 4 * COMBAT_NUMBER_SCALE &&
      this.getPlayerMaxHull() === 40 * COMBAT_NUMBER_SCALE &&
      varianceWithinRange &&
      varianceApplied &&
      flatRewards &&
      wholeNumbers;

    document.body.setAttribute('data-starvivors-combat-scale-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-combat-scale-harness-details',
      JSON.stringify({
        basePulseDamage,
        flatPulseDamage,
        expectedBasePulseDamage,
        baselineChaser,
        playerMaxHull: this.getPlayerMaxHull(),
        minVarianceHp,
        maxVarianceHp,
        varianceSamples: varianceSamples.map((sample) => ({
          maxHull: sample.maxHull,
          contactDamage: sample.contactDamage
        })),
        varianceWithinRange,
        varianceApplied,
        flatRewards,
        wholeNumbers
      })
    );
  }

  private runTestHarnessSmoke(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-harness', 'fail');
      document.body.setAttribute('data-starvivors-harness-details', 'Harness was not installed.');
      return;
    }

    const selectUpgradeById = (upgradeId: UpgradeId): StarvivorsTestHarnessState => {
      const upgrade = UPGRADE_CHOICES.find((candidate) => candidate.id === upgradeId);
      if (!upgrade) {
        return this.getTestHarnessState();
      }

      if (!this.isUpgradeOverlayOpen && this.bankedUpgrades > 0 && !this.isPlayerDead) {
        this.openUpgradeOverlay(this.time.now);
      }

      this.selectUpgrade(upgrade, this.time.now);
      return this.getTestHarnessState();
    };

    const initial = harness.getState();
    const primaryShotsBefore = this.playerProjectiles.length;
    const primaryWeapon = this.getActivePrimaryWeaponDefinition();
    if (primaryWeapon) {
      this.usePlayerWeapon(primaryWeapon, 'primary', this.time.now);
      this.playerWeapons.nextPrimaryWeaponFireAt = this.time.now + this.getWeaponSlotCooldownMs(primaryWeapon, 'primary');
    }
    const primaryShot = harness.getState();
    const enemyXp = harness.destroyFirstEnemy();
    const enemyRewardXp = Math.max(0, enemyXp.playerXp - initial.playerXp);
    const rolloverGrant = Math.max(0, INITIAL_XP_THRESHOLD - enemyXp.playerXp + 5);
    const rollover = harness.grantXp(rolloverGrant);
    const multi = harness.grantXp(250);
    const buttonOpened = harness.clickUpgradeButton();
    harness.closeUpgradeOverlay();
    const opened = harness.openUpgradeOverlay();
    const damageUpgrade = selectUpgradeById('pulse_damage');
    const fireRateUpgrade = selectUpgradeById('pulse_fire_rate');
    const rebanked = harness.grantXp(10);
    const velocityUpgrade = selectUpgradeById('pulse_velocity');
    const passiveBank = harness.grantXp(900);
    const hullUpgrade = selectUpgradeById('hull-plating');
    const engineUpgrade = selectUpgradeById('engine-tuning');
    const damageControlUpgrade = selectUpgradeById('damage-control');
    const minimapOff = harness.toggleMinimap();
    const minimapOn = harness.toggleMinimap();
    const dead = harness.killPlayer();
    const afterDeadXp = harness.grantXp(1000);
    const restarted = harness.restartRun();
    const pass =
      initial.playerXp === 0 &&
      initial.nextXpThreshold === INITIAL_XP_THRESHOLD &&
      initial.bankedUpgrades === 0 &&
      initial.primaryWeaponId === 'pulse-cannon' &&
      initial.liveEnemies === BASIC_ENEMY_COUNT &&
      initial.activeEnemies === BASIC_ENEMY_COUNT &&
      initial.shooterEnemies === SHOOTER_ENEMY_COUNT &&
      initial.tankEnemies === TANK_ENEMY_COUNT &&
      initial.enemyProjectiles === 0 &&
      primaryShot.projectiles === primaryShotsBefore + 1 &&
      enemyRewardXp > 0 &&
      enemyXp.activeEnemies === initial.activeEnemies - 1 &&
      rollover.playerXp === 5 &&
      rollover.nextXpThreshold === 120 &&
      rollover.bankedUpgrades === 1 &&
      multi.playerXp === 135 &&
      multi.nextXpThreshold === 144 &&
      multi.bankedUpgrades === 2 &&
      buttonOpened.isUpgradeOverlayOpen &&
      opened.isUpgradeOverlayOpen &&
      damageUpgrade.bankedUpgrades === 1 &&
      damageUpgrade.isUpgradeOverlayOpen &&
      damageUpgrade.pulseDamageLevel === 1 &&
      damageUpgrade.weaponDamageMultiplier === 1.25 &&
      fireRateUpgrade.bankedUpgrades === 0 &&
      !fireRateUpgrade.isUpgradeOverlayOpen &&
      fireRateUpgrade.pulseFireRateLevel === 1 &&
      fireRateUpgrade.pulseCooldownMs < damageUpgrade.pulseCooldownMs &&
      rebanked.bankedUpgrades === 1 &&
      velocityUpgrade.bankedUpgrades === 0 &&
      velocityUpgrade.pulseVelocityLevel === 1 &&
      velocityUpgrade.pulseProjectileSpeed > fireRateUpgrade.pulseProjectileSpeed &&
      passiveBank.bankedUpgrades === 3 &&
      hullUpgrade.bankedUpgrades === 2 &&
      hullUpgrade.isUpgradeOverlayOpen &&
      hullUpgrade.hullPlatingLevel === 1 &&
      hullUpgrade.maxHull === PLAYER_MAX_HULL + HULL_PLATING_MAX_HULL_BONUS &&
      hullUpgrade.hull === PLAYER_MAX_HULL + HULL_PLATING_REPAIR &&
      engineUpgrade.bankedUpgrades === 1 &&
      engineUpgrade.isUpgradeOverlayOpen &&
      engineUpgrade.engineTuningLevel === 1 &&
      engineUpgrade.playerAccelerationMultiplier === 1.08 &&
      engineUpgrade.playerMaxSpeed === Math.round(interceptorMovement.maxSpeed * 1.04) &&
      damageControlUpgrade.bankedUpgrades === 0 &&
      !damageControlUpgrade.isUpgradeOverlayOpen &&
      damageControlUpgrade.damageControlLevel === 1 &&
      damageControlUpgrade.playerInvulnerabilityMs === PLAYER_DAMAGE_INVULNERABILITY_MS + DAMAGE_CONTROL_INVULNERABILITY_BONUS_MS &&
      !minimapOff.isMinimapVisible &&
      minimapOn.isMinimapVisible &&
      dead.isPlayerDead &&
      dead.isResultsScreenOpen &&
      !dead.isResultsButtonVisible &&
      afterDeadXp.playerXp === damageControlUpgrade.playerXp &&
      afterDeadXp.bankedUpgrades === damageControlUpgrade.bankedUpgrades &&
      restarted.hull === PLAYER_MAX_HULL &&
      restarted.maxHull === PLAYER_MAX_HULL &&
      restarted.playerXp === 0 &&
      restarted.nextXpThreshold === INITIAL_XP_THRESHOLD &&
      restarted.bankedUpgrades === 0 &&
      restarted.primaryWeaponId === 'pulse-cannon' &&
      restarted.liveEnemies === BASIC_ENEMY_COUNT &&
      restarted.activeEnemies === BASIC_ENEMY_COUNT &&
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
        primaryShotsBefore,
        primaryShot,
        enemyXp,
        enemyRewardXp,
        rolloverGrant,
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

  private runTestHarnessEnemyScaling(): void {
    const samples = [0, 5, 10, 15].map((minutes) => ({
      minutes,
      scaling: this.getEnemyTimeScalingForElapsedMs(minutes * 60000),
      chaser: this.createScaledEnemyStats('chaser', this.runStartedAt + minutes * 60000, { applyVariance: false }),
      shooter: this.createScaledEnemyStats('shooter', this.runStartedAt + minutes * 60000, { applyVariance: false }),
      tank: this.createScaledEnemyStats('tank', this.runStartedAt + minutes * 60000, { applyVariance: false })
    }));
    const initial = samples[0];
    const target = samples[3];
    const clonedStats = initial.chaser !== basicEnemy.stats && target.shooter !== shooterEnemy.stats && target.tank !== tankEnemy.stats;
    const flatRewards =
      target.chaser.xpValue === basicEnemy.stats.xpValue &&
      target.chaser.scrapValue === basicEnemy.stats.scrapValue &&
      target.shooter.xpValue === shooterEnemy.stats.xpValue &&
      target.shooter.scrapValue === shooterEnemy.stats.scrapValue &&
      target.tank.xpValue === tankEnemy.stats.xpValue &&
      target.tank.scrapValue === tankEnemy.stats.scrapValue;
    const pass =
      initial.scaling.hpMultiplier === 1 &&
      initial.scaling.damageMultiplier === 1 &&
      Math.abs(target.scaling.hpMultiplier - ENEMY_SCALING_TARGET_HP_MULTIPLIER) < 0.001 &&
      Math.abs(target.scaling.damageMultiplier - ENEMY_SCALING_TARGET_DAMAGE_MULTIPLIER) < 0.001 &&
      target.chaser.maxHull === Math.round(basicEnemy.stats.maxHull * ENEMY_SCALING_TARGET_HP_MULTIPLIER) &&
      target.shooter.attackDamage === shooterEnemy.stats.attackDamage * ENEMY_SCALING_TARGET_DAMAGE_MULTIPLIER &&
      clonedStats &&
      flatRewards;

    document.body.setAttribute('data-starvivors-enemy-scaling-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-enemy-scaling-harness-details',
      JSON.stringify({
        samples: samples.map((sample) => ({
          minutes: sample.minutes,
          hpMultiplier: sample.scaling.hpMultiplier,
          damageMultiplier: sample.scaling.damageMultiplier,
          chaserHp: sample.chaser.maxHull,
          shooterDamage: sample.shooter.attackDamage,
          tankContactDamage: sample.tank.contactDamage,
          chaserXp: sample.chaser.xpValue,
          chaserScrap: sample.chaser.scrapValue
        })),
        clonedStats,
        flatRewards
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
      started.hull === 60 * COMBAT_NUMBER_SCALE &&
      started.maxHull === 60 * COMBAT_NUMBER_SCALE &&
      started.playerMaxSpeed === 425 &&
      started.playerAccelerationMultiplier === 1 &&
      started.rammingShieldDashMaxCharges === 6 &&
      afterXp.playerXp === BASIC_ENEMY_XP_REWARD &&
      afterScrap.runScrapTotal === 0 &&
      afterScrapGain.runScrapTotal === 10 &&
      restarted.selectedShipId === 'bulwark' &&
      restarted.hull === 60 * COMBAT_NUMBER_SCALE &&
      restarted.maxHull === 60 * COMBAT_NUMBER_SCALE &&
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

  private runTestHarnessVelocityLimiter(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-velocity-harness', 'fail');
      document.body.setAttribute('data-starvivors-velocity-harness-details', 'Harness was not installed.');
      return;
    }

    const initial = harness.getState();
    harness.addCredits(2000);
    const purchased = [
      harness.purchasePermanentUpgrade('velocity-limiter'),
      harness.purchasePermanentUpgrade('velocity-limiter'),
      harness.purchasePermanentUpgrade('velocity-limiter'),
      harness.purchasePermanentUpgrade('velocity-limiter'),
      harness.purchasePermanentUpgrade('velocity-limiter')
    ][4];
    harness.adjustActivePermanentUpgrade('velocity-limiter', -1);
    harness.adjustActivePermanentUpgrade('velocity-limiter', -1);
    harness.adjustActivePermanentUpgrade('velocity-limiter', -1);
    const reduced = harness.adjustActivePermanentUpgrade('velocity-limiter', -1);

    this.startRun();
    this.playerVelocity.set(1200, 0);
    this.applyPlayerOverspeedDamping(1);
    const interceptorDampedSpeed = this.playerVelocity.length();

    harness.addCredits(100);
    harness.unlockShip('bulwark');
    harness.selectShip('bulwark');
    this.startRun();
    this.playerVelocity.set(1200, 0);
    this.applyPlayerOverspeedDamping(1);
    const bulwarkDampedSpeed = this.playerVelocity.length();

    const pass =
      initial.playerVelocityLimit === VELOCITY_LIMITER_BASE_SPEED &&
      purchased.velocityLimiterLevel === 5 &&
      purchased.velocityLimiterActiveLevel === 5 &&
      purchased.playerVelocityLimit === VELOCITY_LIMITER_BASE_SPEED + VELOCITY_LIMITER_SPEED_BONUS * 5 &&
      reduced.velocityLimiterLevel === 5 &&
      reduced.velocityLimiterActiveLevel === 1 &&
      reduced.playerVelocityLimit === VELOCITY_LIMITER_BASE_SPEED + VELOCITY_LIMITER_SPEED_BONUS &&
      interceptorDampedSpeed < 1200 &&
      interceptorDampedSpeed > reduced.playerVelocityLimit &&
      bulwarkDampedSpeed > interceptorDampedSpeed;

    document.body.setAttribute('data-starvivors-velocity-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-velocity-harness-details',
      JSON.stringify({
        initial,
        purchased,
        reduced,
        interceptorDampedSpeed,
        bulwarkDampedSpeed
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
    this.useRammingShieldWeapon(this.getRammingShieldStats(), this.time.now);
    this.updateRammingShieldDashBurstMovement(RAMMING_SHIELD_DASH_BURST_DURATION_SECONDS);
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
      started.rammingShieldDashMaxCharges === 6 &&
      afterDash.rammingShieldDashCharges === this.getRammingShieldStats().dashMaxCharges - 1 &&
      dashVelocityAfter > dashVelocityBefore &&
      afterShieldHit.hull === started.hull &&
      afterBrokenHit.hull < afterShieldHit.hull &&
      afterRegen.rammingShieldHp === 10 + this.getRammingShieldStats().shieldRegenRatePerSecond;

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
    const interceptorRamming = harness.selectPulseUpgrade(1);
    const interceptorLaterChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);
    const interceptorRestarted = harness.restartRun();
    harness.grantXp(INITIAL_XP_THRESHOLD);
    const interceptorRestartChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);

    harness.selectShip('bulwark');
    this.startRun();
    harness.grantXp(INITIAL_XP_THRESHOLD);
    const bulwarkChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);
    const bulwarkPulseUpgradeAvailable = getAvailableRunUpgrades(
      this.runUpgradeLevels,
      this.getEquippedWeaponDefinitions()
    ).some((upgrade) => upgrade.id === 'pulse_damage');
    const bulwarkRammingUpgradeAvailable = getAvailableRunUpgrades(
      this.runUpgradeLevels,
      this.getEquippedWeaponDefinitions()
    ).some((upgrade) => upgrade.id === 'ram_damage');
    const shotsBefore = this.playerProjectiles.length;
    const effectiveAutoWeapon = this.getEffectiveAutoWeaponDefinition();
    if (effectiveAutoWeapon) {
      this.usePlayerWeapon(effectiveAutoWeapon, 'auto', this.time.now + 1000);
    }
    const shotsAfter = this.playerProjectiles.length;
    const pass =
      interceptorRestarted.autoWeaponId === null &&
      interceptorRestarted.primaryWeaponId === 'pulse-cannon' &&
      interceptorChoices.includes('ramming-shield') &&
      interceptorRamming.primaryWeaponId === 'pulse-cannon' &&
      interceptorRamming.secondaryWeaponId === 'ramming-shield' &&
      interceptorRamming.rammingShieldMaxHp === this.getRammingShieldStats().shieldMaxHp &&
      interceptorRamming.rammingShieldDashMaxCharges === 3 &&
      interceptorLaterChoices.length === 0 &&
      interceptorRestarted.rammingShieldMaxHp === 0 &&
      interceptorRestartChoices.includes('ramming-shield') &&
      bulwarkChoices.length === 0 &&
      this.playerWeapons.activeAutoWeaponId === null &&
      this.playerWeapons.activePrimaryWeaponId === 'ramming-shield' &&
      this.playerWeapons.activeSecondaryWeaponId === null &&
      !bulwarkPulseUpgradeAvailable &&
      bulwarkRammingUpgradeAvailable &&
      shotsAfter === shotsBefore;

    document.body.setAttribute('data-starvivors-secondary-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-secondary-harness-details',
      JSON.stringify({
        interceptorChoices,
        interceptorRamming,
        interceptorLaterChoices,
        interceptorRestarted,
        interceptorRestartChoices,
        bulwarkChoices,
        bulwarkPulseUpgradeAvailable,
        bulwarkRammingUpgradeAvailable,
        effectiveAutoWeaponId: effectiveAutoWeapon?.id ?? null,
        bulwarkWeaponState: this.playerWeapons,
        shotsBefore,
        shotsAfter
      })
    );
  }

  private runTestHarnessWeaponHotbar(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-hotbar-harness', 'fail');
      document.body.setAttribute('data-starvivors-hotbar-harness-details', 'Harness was not installed.');
      return;
    }

    harness.addCredits(100);
    harness.unlockShip('bulwark');
    harness.selectShip('interceptor');
    this.startRun();
    harness.grantXp(INITIAL_XP_THRESHOLD);
    const acquired = harness.selectPulseUpgrade(1);
    const blockedAutoAssign = harness.assignWeaponSlot('auto', 'ramming-shield');
    const movedToSecondary = harness.assignWeaponSlot('secondary', 'ramming-shield');
    const movedToPrimary = harness.assignWeaponSlot('primary', 'ramming-shield');
    const reassignedPulsePrimary = harness.assignWeaponSlot('primary', 'pulse-cannon');
    const slots = this.getWeaponHotbarSlots(this.time.now);
    const autoTooltip = slots.find((slot) => slot.slot === 'auto')?.tooltipLines ?? [];
    const primaryTooltip = slots.find((slot) => slot.slot === 'primary')?.tooltipLines ?? [];
    const secondaryTooltip = slots.find((slot) => slot.slot === 'secondary')?.tooltipLines ?? [];
    const pass =
      acquired.primaryWeaponId === 'pulse-cannon' &&
      acquired.secondaryWeaponId === 'ramming-shield' &&
      acquired.ownedManualWeaponIds.includes('ramming-shield') &&
      blockedAutoAssign.autoWeaponId === null &&
      movedToSecondary.primaryWeaponId === 'pulse-cannon' &&
      movedToSecondary.secondaryWeaponId === 'ramming-shield' &&
      movedToPrimary.primaryWeaponId === 'ramming-shield' &&
      movedToPrimary.secondaryWeaponId === null &&
      reassignedPulsePrimary.primaryWeaponId === 'pulse-cannon' &&
      reassignedPulsePrimary.secondaryWeaponId === 'ramming-shield' &&
      slots.length === 3 &&
      autoTooltip.some((line) => line.includes('Empty slot')) &&
      primaryTooltip.some((line) => line.includes('Damage:')) &&
      primaryTooltip.some((line) => line.includes('Left click')) &&
      secondaryTooltip.some((line) => line.includes('Shield')) &&
      secondaryTooltip.some((line) => line.includes('Ram damage levels'));

    document.body.setAttribute('data-starvivors-hotbar-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-hotbar-harness-details',
      JSON.stringify({
        acquired,
        blockedAutoAssign,
        movedToSecondary,
        movedToPrimary,
        reassignedPulsePrimary,
        slots
      })
    );
  }

  private runTestHarnessWorldImpactCleanup(): void {
    const staleBody = this.add.container(0, 0);
    const staleWrapMirrorBody = this.add.container(0, 0);
    const debrisBody = this.add.container(0, 0);
    const debrisWrapMirrorBody = this.add.container(0, 0);
    const staleEnemy = {
      body: staleBody,
      wrapMirrorBody: staleWrapMirrorBody,
      stats: basicEnemy.stats,
      velocity: new Phaser.Math.Vector2(),
      knockbackVelocity: new Phaser.Math.Vector2(),
      blackHoleVelocity: new Phaser.Math.Vector2(),
      hp: 0,
      nextBlackHoleDamageAt: 0
    } as BasicEnemy;
    const debris = {
      body: debrisBody,
      wrapMirrorBody: debrisWrapMirrorBody,
      velocity: new Phaser.Math.Vector2(),
      mass: 1,
      hp: 1,
      damage: 0,
      hitRadius: 8,
      rotationSpeed: 0,
      expiresAt: Number.MAX_SAFE_INTEGER
    } as EnemyWreckageDebris;
    let staleEnemyHitRadiusChecks = 0;
    let pass = false;
    let errorMessage = '';

    staleBody.destroy(true);
    staleWrapMirrorBody.destroy(true);

    try {
      resolveWorldImpactCollisionsSystem({
        arena: this.arena,
        enemies: [staleEnemy],
        asteroids: [],
        debris: [debris],
        time: this.time.now,
        getEnemyHitRadius: () => {
          staleEnemyHitRadiusChecks += 1;
          throw new Error('Stale enemy should be skipped before collision radius checks.');
        },
        getEnemyCollisionScale: () => 1,
        getAsteroidCollisionRadius: () => 0,
        getDebrisCollisionRadius: (candidate) => candidate.hitRadius,
        getEnemyTotalVelocity: () => new Phaser.Math.Vector2(),
        getAsteroidMass: () => 1,
        getGlobalMaxSpeed: () => 1,
        resolveBodyImpactCollision: () => undefined,
        damageEnemyFromAsteroid: () => undefined,
        damageEnemyFromDebris: () => undefined,
        damageAsteroidFromEnemy: () => undefined,
        damageAsteroidFromDebris: () => undefined,
        damageDebrisFromEnemy: () => undefined,
        damageDebrisFromAsteroid: () => undefined
      });
      pass = staleEnemyHitRadiusChecks === 0;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      debrisBody.destroy(true);
      debrisWrapMirrorBody.destroy(true);
    }

    document.body.setAttribute('data-starvivors-world-impact-cleanup-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-world-impact-cleanup-harness-details',
      JSON.stringify({
        staleEnemyHitRadiusChecks,
        errorMessage
      })
    );
  }

  private rebuildWorld(): void {
    this.gameFlowState = 'running';
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.debugMenuHost?.destroy();
    this.deathShards = clearDeathShardsSystem(this.deathShards);
    this.children.removeAll(true);
    this.combatFeedback.clear();
    this.debugMenuHost = undefined;
    this.mainMenuScreen = undefined;
    this.shipSelectScreen = undefined;
    this.shopScreen = undefined;
    this.playerWeapons = createPlayerWeaponRuntimeState(this.getSelectedShipDefinition());
    this.hasResolvedSecondaryWeaponChoice = false;
    this.rammingShieldImage = undefined;
    this.rammingShieldState = createRammingShieldRuntimeState(
      this.hasRammingShield(),
      this.hasRammingShield() ? this.getRammingShieldStats() : undefined
    );
    this.playerVelocity.set(0, 0);
    this.clearRammingShieldDashBurst();
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
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.basicEnemies = [];
    this.shooterEnemies = [];
    this.tankEnemies = [];
    this.liveEnemies = [];
    this.basicAsteroids = [];
    this.enemyWreckageDebris = [];
    this.deathShards = [];
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
    this.playerBodyImpactCooldowns = new WeakMap<object, number>();
    this.asteroidCollisionCooldowns = new WeakMap<object, WeakMap<object, number>>();
    this.pulseVolleyCount = 0;
    this.isPulseEmergencyCharged = false;
    this.pulseLifestealWindowStartedAt = 0;
    this.pulseLifestealRestoredThisWindow = 0;
    this.pulseIonizedTargets = new WeakMap<object, number>();
    this.pulseCriticalTargets = new WeakMap<object, { stacks: number; expiresAt: number }>();
    this.nextBlackHolePlayerDamageAt = 0;
    this.runStartedAt = this.time.now;
    this.nextEnemySpawnAt = this.runStartedAt + ENEMY_SPAWN_INITIAL_DELAY_MS;
    this.nextEnemySwarmAt = this.runStartedAt + ENEMY_SWARM_FIRST_SPAWN_MS;
    this.runUpgradeLevels = createInitialRunUpgradeLevels();
    this.playerHull = this.getPlayerMaxHull();
    this.isUpgradeOverlayOpen = false;
    this.isPauseMenuOpen = false;
    this.upgradeOverlayOpenedAt = 0;
    this.pauseMenuOpenedAt = 0;
    this.specialUpgradeOverlayChoices = null;
    this.totalUpgradePauseMs = 0;
    this.totalPauseMenuPauseMs = 0;
    this.debugMenuOpenedAt = 0;
    this.totalDebugPauseMs = 0;
    this.awaitingBinding = undefined;
    this.pauseMenuScreen = undefined;
    this.minimap.reset();
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
    this.starfield.resetState();

    this.createStarfield();
    this.player = this.createPlayerShip(center.x, center.y);
    this.createInitialLiveEnemies(center);
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

    this.gameplayHud.create();
    this.minimap.create();
    this.collisionDebugOverlay.create();

    this.createUpgradeButton();
    this.createResultsButton();
    this.createUpgradeOverlay();
    this.blackHoleDebugControls.create();
    this.createDebugMenu();
    this.updateGameplayHud(this.time.now);
    this.updateMinimap();
    this.updateDebugText(0);
  }

  private startRun(): void {
    if (this.autoRunDiagnostics.isActive()) {
      this.autoRunDiagnostics.endRun('restart');
    }

    const selectedShip = this.getSelectedShipDefinition();

    if (!this.canStartRunWithShip(selectedShip)) {
      this.selectedShipId = DEFAULT_SHIP_ID;
    }

    this.destroyMainMenuScreen();
    this.destroyShipSelectScreen();
    this.destroyShopScreen();
    this.destroyResultsScreen();
    this.pauseMenuScreen = destroyScreenHandle(this.pauseMenuScreen, { disableZones: true, resetCursor: () => this.resetUiCursor() });
    this.isPauseMenuOpen = false;
    this.rebuildWorld();
    this.autoRunDiagnostics.startRun(this.getSelectedShipDefinition().displayName);
  }

  private showMainMenu(): void {
    if (this.autoRunDiagnostics.isActive()) {
      this.autoRunDiagnostics.endRun('main-menu');
    }

    this.gameFlowState = 'mainMenu';
    this.deathShards = clearDeathShardsSystem(this.deathShards);
    this.children.removeAll(true);
    this.debugMenuHost = undefined;
    this.mainMenuScreen = undefined;
    this.shopScreen = undefined;
    this.shipSelectScreen = undefined;
    this.resultsScreen = undefined;
    this.pauseMenuScreen = undefined;
    this.isPauseMenuOpen = false;
    this.awaitingBinding = undefined;

    this.mainMenuScreen = createMainMenuScreen({
      scene: this,
      totalCredits: this.totalCredits,
      selectedShipDisplayName: this.getSelectedShipDefinition().displayName,
      isActionActive: () => this.gameFlowState === 'mainMenu',
      resetCursor: () => this.resetUiCursor(),
      onStartRun: () => this.startRun(),
      onShipSelect: () => this.showShipSelect(),
      onShop: () => this.showShop('mainMenu')
    });
    this.createDebugMenu();
  }

  private showShipSelect(): void {
    this.gameFlowState = 'shipSelect';
    this.destroyMainMenuScreen();
    this.destroyShipSelectScreen();

    this.shipSelectScreen = createShipSelectScreen({
      scene: this,
      totalCredits: this.totalCredits,
      selectedShipId: this.selectedShipId,
      hangarPreviewShipId: this.hangarPreviewShipId,
      unlockedShipIds: this.unlockedShipIds,
      isActionActive: () => this.gameFlowState === 'shipSelect',
      resetCursor: () => this.resetUiCursor(),
      onPreviewShip: (shipId) => {
        this.hangarPreviewShipId = shipId;
        this.showShipSelect();
      },
      onShipAction: (ship) => this.handleShipAction(ship),
      onBack: () => this.showMainMenu()
    });
    this.createDebugMenu();
  }

  private handleShipAction(ship: ShipRegistryEntry): void {
    if (!ship.selectable) {
      return;
    }

    if (!this.isShipUnlocked(ship.id)) {
      this.unlockShip(ship);
      return;
    }

    this.selectedShipId = ship.id;
    this.hangarPreviewShipId = ship.id;
    this.startRun();
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
    this.hangarPreviewShipId = ship.id;
    this.showShipSelect();
  }

  private getShipLockedLabel(ship: ShipRegistryEntry): string {
    if (!ship.selectable) {
      return 'Coming Soon';
    }

    return ship.unlockCostCredits === undefined ? 'Locked' : `Locked ${ship.unlockCostCredits} credits`;
  }

  private showShop(backTarget: ShopBackTarget): void {
    if (this.autoRunDiagnostics.isActive() && this.gameFlowState === 'running') {
      this.autoRunDiagnostics.endRun('shop');
    }

    this.shopBackTarget = backTarget;
    this.gameFlowState = 'shop';
    this.destroyShopScreen();
    this.destroyShipSelectScreen();

    if (backTarget === 'mainMenu') {
      this.destroyMainMenuScreen();
    } else {
      this.destroyResultsScreen();
    }

    this.shopScreen = createShopScreen({
      scene: this,
      backTarget,
      totalCredits: this.totalCredits,
      getPermanentUpgradeLevel: (id) => this.getPermanentUpgradeLevel(id),
      getActivePermanentUpgradeLevel: (id) => this.getActivePermanentUpgradeLevel(id),
      isPermanentUpgradeMaxed: (upgrade) => this.isPermanentUpgradeMaxed(upgrade),
      canPurchasePermanentUpgrade: (upgrade) => this.canPurchasePermanentUpgrade(upgrade),
      getPermanentUpgradeCost: (upgrade) => this.getPermanentUpgradeCost(upgrade),
      isActionActive: () => this.gameFlowState === 'shop',
      resetCursor: () => this.resetUiCursor(),
      onPurchasePermanentUpgrade: (upgrade) => this.purchasePermanentUpgrade(upgrade),
      onAdjustActivePermanentUpgradeLevel: (id, delta) => this.adjustActivePermanentUpgradeLevel(id, delta),
      onBack: () => this.handleShopBack()
    });
    this.createDebugMenu();
  }

  private getPermanentUpgradeLevel(id: PermanentUpgradeId): number {
    return this.permanentUpgradeLevels[id];
  }

  private getActivePermanentUpgradeLevel(id: PermanentUpgradeId): number {
    return Phaser.Math.Clamp(this.activePermanentUpgradeLevels[id], 0, this.getPermanentUpgradeLevel(id));
  }

  private getResolvedPermanentUpgradeLevels(): Record<PermanentUpgradeId, number> {
    const levels = { ...INITIAL_PERMANENT_UPGRADE_LEVELS };

    for (const upgrade of PERMANENT_UPGRADE_DEFINITIONS) {
      levels[upgrade.id] = this.getActivePermanentUpgradeLevel(upgrade.id);
    }

    return levels;
  }

  private getPermanentUpgradeCost(upgrade: PermanentUpgradeDefinition): number {
    return upgrade.baseCost * (this.getPermanentUpgradeLevel(upgrade.id) + 1);
  }

  private getSelectedShipDefinition(): ShipRegistryEntry {
    return getShipDefinition(this.selectedShipId);
  }

  private getResolvedPlayerStats(): PlayerStats {
    const selectedShip = this.getSelectedShipDefinition();

    return resolvePlayerStats({
      baseStats: this.debugState.getEffectiveShipBaseStats(selectedShip),
      passiveLevels: {
        hullPlating: this.getRunUpgradeLevelById('hull-plating'),
        engineTuning: this.getRunUpgradeLevelById('engine-tuning'),
        damageControl: this.getRunUpgradeLevelById('damage-control'),
        amount: this.getRunUpgradeLevelById('stat_amount'),
        magnet: this.getRunUpgradeLevelById('stat_magnet'),
        luck: this.getRunUpgradeLevelById('stat_luck'),
        growth: this.getRunUpgradeLevelById('stat_growth'),
        greed: this.getRunUpgradeLevelById('stat_greed')
      },
      permanentLevels: this.getResolvedPermanentUpgradeLevels()
    });
  }

  private hasRammingShield(): boolean {
    return (
      this.playerWeapons.activePrimaryWeaponId === 'ramming-shield' ||
      this.playerWeapons.activeSecondaryWeaponId === 'ramming-shield'
    );
  }

  private getRammingShieldMaxHp(): number {
    return this.hasRammingShield() ? this.getRammingShieldStats().shieldMaxHp : 0;
  }

  private getResolvedWeaponStats(weapon: WeaponRegistryEntry, slot: 'auto' | 'primary' | 'secondary'): ResolvedWeaponStats {
    return resolveWeaponStats({
      weapon: this.debugState.getEffectiveWeaponDefinition(weapon),
      slot,
      ship: this.getSelectedShipDefinition(),
      playerStats: this.getResolvedPlayerStats(),
      upgrades: this.getPlayerWeaponUpgradeState(),
      debugTuning: {
        damageMultiplier: this.getActiveDebugWeaponDamageMultiplier(),
        fireRateMultiplier: this.getActiveDebugWeaponFireRateMultiplier()
      }
    });
  }

  private getRammingShieldStats(): RammingShieldStats {
    const primaryWeapon = this.getActivePrimaryWeaponDefinition();
    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    const resolved =
      primaryWeapon?.id === 'ramming-shield'
        ? this.getResolvedWeaponStats(primaryWeapon, 'primary').rammingShield
        : secondaryWeapon?.id === 'ramming-shield'
          ? this.getResolvedWeaponStats(secondaryWeapon, 'secondary').rammingShield
          : undefined;

    if (!resolved) {
      throw new Error('Resolved Ramming Shield stats are required.');
    }

    return resolved;
  }

  private ensureRammingShieldRuntime(): void {
    if (!this.hasRammingShield()) {
      return;
    }

    ensureRammingShieldRuntime(this.rammingShieldState, this.getRammingShieldStats());

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
    return this.debugState.getEffectiveShipHitRadius(this.getSelectedShipDefinition());
  }

  private getPlayerCollisionRadius(): number {
    return scaleRadius(this.getPlayerHitRadius(), this.debugState.getCollisionShapeScale('player'));
  }

  private getAsteroidCollisionRadius(asteroid: BasicAsteroid): number {
    return scaleRadius(asteroid.hitRadius, this.debugState.getCollisionShapeScale('asteroid'));
  }

  private getDebrisCollisionRadius(debris: EnemyWreckageDebris): number {
    return scaleRadius(debris.hitRadius, this.debugState.getCollisionShapeScale('debris'));
  }

  private getEnemyCollisionHalfWidth(enemy: BasicEnemy | ShooterEnemy | TankEnemy): number {
    return scaleHalfExtent(enemy.stats.hitHalfWidth, this.debugState.getCollisionShapeScale('enemy'));
  }

  private getEnemyCollisionHalfLength(enemy: BasicEnemy | ShooterEnemy | TankEnemy): number {
    return scaleHalfExtent(enemy.stats.hitHalfLength, this.debugState.getCollisionShapeScale('enemy'));
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
    this.activePermanentUpgradeLevels[upgrade.id] = this.permanentUpgradeLevels[upgrade.id];
    if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
    }
  }

  private adjustActivePermanentUpgradeLevel(id: PermanentUpgradeId, delta: number): void {
    const purchasedLevel = this.getPermanentUpgradeLevel(id);
    const activeLevel = this.getActivePermanentUpgradeLevel(id);
    this.activePermanentUpgradeLevels[id] = Phaser.Math.Clamp(activeLevel + delta, 0, purchasedLevel);
    if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
    }
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
    this.mainMenuScreen = destroyScreenHandle(this.mainMenuScreen);
  }

  private destroyShipSelectScreen(): void {
    this.shipSelectScreen = destroyScreenHandle(this.shipSelectScreen, {
      disableZones: true,
      resetCursor: () => this.resetUiCursor()
    });
  }

  private resetUiCursor(): void {
    this.input.setDefaultCursor('default');
    this.input.manager.canvas.style.cursor = 'default';
  }

  private destroyShopScreen(): void {
    this.shopScreen = destroyScreenHandle(this.shopScreen);
  }

  private destroyResultsScreen(): void {
    this.resultsScreen = destroyScreenHandle(this.resultsScreen);
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
    this.starfield.createTextures();
  }

  private createStarfield(): void {
    this.starfield.create();
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

  private createInitialLiveEnemies(center: Phaser.Math.Vector2): void {
    const spawnDistance = Math.max(this.scale.width, this.scale.height) * 0.78;

    for (let index = 0; index < BASIC_ENEMY_COUNT; index += 1) {
      const angle = (Math.PI * 2 * index) / BASIC_ENEMY_COUNT + Math.PI / 8;
      const x = wrapCoordinate(center.x + Math.cos(angle) * spawnDistance, this.arena.width);
      const y = wrapCoordinate(center.y + Math.sin(angle) * spawnDistance, this.arena.height);
      this.spawnLiveEnemy('scout', x, y, this.time.now, 'chaser');
    }
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
    wrapMirrorBody: Phaser.GameObjects.Container,
    stats: EnemyStatProfile = this.createScaledEnemyStats('chaser', this.time.now)
  ): BasicEnemy {
    return {
      body,
      wrapMirrorBody,
      stats,
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
      hp: stats.maxHull,
      nextBlackHoleDamageAt: 0
    };
  }

  private createShooterEnemyInstance(
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    time: number,
    stats: EnemyStatProfile = this.createScaledEnemyStats('shooter', time)
  ): ShooterEnemy {
    return {
      body,
      wrapMirrorBody,
      stats,
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
      nextFireAt: time + Phaser.Math.Between(700, Math.round(stats.attackCooldown * 1000)),
      hp: stats.maxHull,
      nextBlackHoleDamageAt: 0
    };
  }

  private createTankEnemyInstance(
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    stats: EnemyStatProfile = this.createScaledEnemyStats('tank', this.time.now)
  ): TankEnemy {
    return {
      body,
      wrapMirrorBody,
      stats,
      velocity: new Phaser.Math.Vector2(0, 0),
      knockbackVelocity: new Phaser.Math.Vector2(0, 0),
      blackHoleVelocity: new Phaser.Math.Vector2(0, 0),
      hp: stats.maxHull,
      nextBlackHoleDamageAt: 0
    };
  }

  private createScaledEnemyStats(
    enemyType: EnemySpawnType,
    time: number,
    options: { applyVariance?: boolean } = {}
  ): EnemyStatProfile {
    const baseStats =
      enemyType === 'shooter' ? shooterEnemy.stats : enemyType === 'tank' ? tankEnemy.stats : basicEnemy.stats;
    const scaling = this.getEnemyTimeScaling(time);
    const hpVariance = options.applyVariance === false ? 1 : this.getCombatVarianceMultiplier();
    const damageVariance = options.applyVariance === false ? 1 : this.getCombatVarianceMultiplier();

    return {
      ...baseStats,
      maxHull: Math.max(1, Math.round(baseStats.maxHull * scaling.hpMultiplier * hpVariance)),
      contactDamage: Math.max(1, Math.round(baseStats.contactDamage * scaling.damageMultiplier * damageVariance)),
      attackDamage:
        baseStats.attackDamage > 0
          ? Math.max(1, Math.round(baseStats.attackDamage * scaling.damageMultiplier * damageVariance))
          : 0
    };
  }

  private getCombatVarianceMultiplier(): number {
    return Phaser.Math.FloatBetween(1 - COMBAT_VARIANCE, 1 + COMBAT_VARIANCE);
  }

  private rollPlayerDamage(damage: number): number {
    if (damage <= 0) {
      return 0;
    }

    return Math.max(1, Math.round(damage * this.getCombatVarianceMultiplier()));
  }

  private getEnemyTimeScaling(time: number): EnemyTimeScaling {
    return this.getEnemyTimeScalingForElapsedMs(this.getSurvivalElapsedMs(time));
  }

  private getEnemyTimeScalingForElapsedMs(elapsedMs: number): EnemyTimeScaling {
    const elapsedMinutes = Math.max(0, elapsedMs / 60000);
    const progress = Phaser.Math.Clamp(elapsedMinutes / ENEMY_SCALING_TARGET_RUN_MINUTES, 0, 1);

    return {
      elapsedMinutes,
      difficultyMinute: Math.floor(elapsedMinutes),
      progress,
      hpMultiplier: Phaser.Math.Linear(1, ENEMY_SCALING_TARGET_HP_MULTIPLIER, progress),
      damageMultiplier: Phaser.Math.Linear(1, ENEMY_SCALING_TARGET_DAMAGE_MULTIPLIER, progress)
    };
  }

  private updateEnemySpawnDirector(time: number): void {
    if (
      this.isUpgradeOverlayOpen ||
      this.debugMenuHost?.isOpen() ||
      !this.debugState.enemySpawningEnabled ||
      this.isPlayerDead
    ) {
      return;
    }

    this.updateEnemySwarmDirector(time);

    if (time < this.nextEnemySpawnAt) {
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

  private updateEnemySwarmDirector(time: number): void {
    if (time < this.nextEnemySwarmAt || this.getActiveEnemyCount() >= ENEMY_SWARM_OVERFLOW_HARD_CAP) {
      return;
    }

    const packSize = Math.min(
      ENEMY_SWARM_MAX_PACK_SIZE,
      ENEMY_SWARM_BASE_PACK_SIZE + Math.floor(this.getEnemyTimeScaling(time).elapsedMinutes * ENEMY_SWARM_PACK_SIZE_PER_MINUTE)
    );
    const spawnCount = Math.min(packSize, Math.max(0, ENEMY_SWARM_OVERFLOW_HARD_CAP - this.getActiveEnemyCount()));
    const center = this.getEnemyDirectorSpawnPosition();
    if (spawnCount >= 4) {
      this.spawnLiveEnemySquad('scout-pack', center.x, center.y, time);
      this.nextEnemySwarmAt = time + ENEMY_SWARM_INTERVAL_MS;
      return;
    }

    const approachOffset = this.getWrappedDirection(center.x, center.y, this.player.x, this.player.y);
    const approach = approachOffset.lengthSq() > 0 ? approachOffset.normalize() : new Phaser.Math.Vector2(0, 1);
    const lateral = new Phaser.Math.Vector2(-approach.y, approach.x);

    for (let i = 0; i < spawnCount; i += 1) {
      const row = Math.floor(i / 4);
      const column = i % 4;
      const lateralOffset = (column - 1.5) * Phaser.Math.FloatBetween(42, 76);
      const depthOffset = row * Phaser.Math.FloatBetween(54, 88);
      const x = wrapCoordinate(center.x + lateral.x * lateralOffset - approach.x * depthOffset, this.arena.width);
      const y = wrapCoordinate(center.y + lateral.y * lateralOffset - approach.y * depthOffset, this.arena.height);
      this.spawnDirectedEnemyAt(this.chooseSwarmEnemyType(time, i), time, x, y);
    }

    this.nextEnemySwarmAt = time + ENEMY_SWARM_INTERVAL_MS;
  }

  private spawnDirectedEnemy(enemyType: EnemySpawnType, time: number): void {
    const position = this.getEnemyDirectorSpawnPosition();
    this.spawnDirectedEnemyAt(enemyType, time, position.x, position.y);
  }

  private spawnDirectedEnemyAt(enemyType: EnemySpawnType, time: number, x: number, y: number): void {
    this.spawnLiveEnemy(this.getLiveEnemyDefinitionIdForSpawnType(enemyType), x, y, time, enemyType);
  }

  private spawnLiveEnemy(
    definitionId: string,
    x: number,
    y: number,
    time: number,
    legacySpawnType: EnemySpawnType = this.getLegacySpawnTypeForLiveDefinition(definitionId)
  ): LiveGameEnemy {
    const scaling = this.getEnemyTimeScaling(time);
    const hpVariance = this.getCombatVarianceMultiplier();
    const enemy = spawnLiveEnemySystem({
      scene: this,
      arena: this.arena,
      definitionId,
      x,
      y,
      time,
      hpMultiplier: scaling.hpMultiplier * hpVariance,
      showDebugLabel: false
    });

    enemy.damageMultiplier = scaling.damageMultiplier * this.getCombatVarianceMultiplier();
    enemy.stateData.legacySpawnType = legacySpawnType;
    this.liveEnemies.push(enemy);
    return enemy;
  }

  private spawnLiveEnemySquad(squadId: string, centerX: number, centerY: number, time: number): void {
    const scaling = this.getEnemyTimeScaling(time);
    const squad = ENEMY_LAB_SQUADS.find((candidate) => candidate.id === squadId);
    const spawned = spawnLiveEnemySquadSystem({
      scene: this,
      arena: this.arena,
      squadId,
      centerX,
      centerY,
      time,
      hpMultiplier: scaling.hpMultiplier,
      showDebugLabel: false
    });

    for (const enemy of spawned) {
      enemy.damageMultiplier = scaling.damageMultiplier * this.getCombatVarianceMultiplier();
      enemy.stateData.legacySpawnType = this.getLegacySpawnTypeForLiveDefinition(enemy.definitionId);
      enemy.stateData.squadId = squad?.id ?? squadId;
    }

    this.liveEnemies.push(...spawned);
  }

  private getLiveEnemyDefinitionIdForSpawnType(enemyType: EnemySpawnType): string {
    if (enemyType === 'shooter') {
      return 'diamond-gunner';
    }

    if (enemyType === 'tank') {
      return 'hex-tank';
    }

    return 'scout';
  }

  private getLegacySpawnTypeForLiveDefinition(definitionId: string): EnemySpawnType {
    if (definitionId === 'diamond-gunner' || definitionId === 'needle-sniper') {
      return 'shooter';
    }

    if (definitionId === 'hex-tank' || definitionId === 'carrier') {
      return 'tank';
    }

    return 'chaser';
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
    return this.rollEnemyType(weights);
  }

  private chooseSwarmEnemyType(time: number, index: number): EnemySpawnType {
    const minute = this.getEnemyTimeScaling(time).difficultyMinute;
    const weights =
      minute < 4
        ? { chaser: 100, shooter: 0, tank: 0 }
        : minute < 8
          ? { chaser: 82, shooter: 16, tank: 2 }
          : minute < 12
            ? { chaser: 68, shooter: 26, tank: 6 }
            : { chaser: 56, shooter: 34, tank: 10 };

    if (index === 0) {
      return 'chaser';
    }

    return this.rollEnemyType(weights);
  }

  private rollEnemyType(weights: Record<EnemySpawnType, number>): EnemySpawnType {
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
    return this.liveEnemies.length + this.basicEnemies.length + this.shooterEnemies.length + this.tankEnemies.length;
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

    this.liveEnemies = clearLiveEnemiesSystem(this.liveEnemies);
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
    if (!this.blackHole) {
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
      {
        ...playerWhirlpoolTuning,
        maxSpeed: this.getPlayerOverspeedSafetyLimit()
      },
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

      this.damagePlayer(damage, time, this.player.x, this.player.y, { source: 'blackHole' });
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
        maxSpeed: this.getGlobalMaxSpeed()
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
      this.damageAsteroid(asteroid, this.getBlackHoleTidalDamage(
        result.proximity,
        BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_BASE,
        BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_EXTRA,
        BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS
      ), 'blackHole', false);
      asteroid.nextBlackHoleDamageAt = time + BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS;

      if (asteroid.hp <= 0) {
        this.destroyBasicAsteroid(index, false, 'blackHoleAsteroid');
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

  private applyBlackHoleToLiveEnemy(enemy: LiveGameEnemy, index: number, deltaSeconds: number, time: number): boolean {
    if (!this.blackHole) {
      return false;
    }

    const tuning = this.getLiveEnemyBlackHoleTuning(enemy);
    const result = this.blackHole.applyWhirlpoolToVelocity(
      enemy.body.x,
      enemy.body.y,
      enemy.blackHoleVelocity,
      deltaSeconds,
      {
        ...tuning,
        mass: enemy.definition.stats.mass ?? tuning.mass,
        maxSpeed: this.getGlobalMaxSpeed()
      },
      this.arena,
      this.getActiveDebugBlackHoleFieldTuning()
    );

    enemy.blackHoleVelocity.scale(Math.pow(BLACK_HOLE_ENEMY_FIELD_DAMPING, deltaSeconds * 60));

    if (result.isInsideEventHorizon) {
      this.destroyLiveEnemyWithoutRewards(enemy);
      this.liveEnemies.splice(index, 1);
      return true;
    }

    if (
      this.debugState.blackHoleFieldDamageEnabled &&
      result.isInsideDamage &&
      time >= enemy.nextBlackHoleDamageAt
    ) {
      this.damageLiveEnemy(
        enemy,
        this.getBlackHoleTidalDamage(
          result.proximity,
          BLACK_HOLE_ENEMY_TIDAL_DAMAGE_BASE,
          BLACK_HOLE_ENEMY_TIDAL_DAMAGE_EXTRA,
          BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS
        ),
        'blackHole',
        false
      );
      enemy.nextBlackHoleDamageAt = time + BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS;

      if (enemy.hp <= 0) {
        this.destroyLiveEnemyWithoutRewards(enemy);
        this.liveEnemies.splice(index, 1);
        return true;
      }

      this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
    }

    return false;
  }

  private getLiveEnemyBlackHoleTuning(enemy: LiveGameEnemy): BlackHoleWhirlpoolTuning {
    const legacyType = this.getLiveEnemyLegacySpawnType(enemy);
    if (legacyType === 'shooter') {
      return BLACK_HOLE_SHOOTER_WHIRLPOOL_TUNING;
    }

    if (legacyType === 'tank') {
      return BLACK_HOLE_TANK_WHIRLPOOL_TUNING;
    }

    return BLACK_HOLE_CHASER_WHIRLPOOL_TUNING;
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
      {
        ...tuning,
        maxSpeed: this.getGlobalMaxSpeed()
      },
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
        ),
        'blackHole',
        false
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

  private updateDeathShards(deltaMs: number): void {
    if (this.deathShards.length <= 0) {
      return;
    }

    this.deathShards = updateDeathShardsSystem({
      shards: this.deathShards,
      deltaMs
    });
  }

  private emitDeathShards(
    textureKey: string,
    x: number,
    y: number,
    displaySize: number,
    rotation: number,
    inheritedVelocity: Phaser.Math.Vector2,
    style: DeathShardStyle
  ): void {
    emitDeathShardsSystem({
      scene: this,
      shards: this.deathShards,
      textureKey,
      x,
      y,
      displaySize,
      rotation,
      inheritedVelocity,
      style,
      tuning: this.debugState.deathShardTuning[style],
      maxActive: DEATH_SHARD_MAX_ACTIVE,
      getNearestWrappedRenderPosition: (worldX, worldY) => this.getNearestWrappedRenderPosition(worldX, worldY)
    });
  }

  private emitEnemyDeathShards(
    enemy: BasicEnemy | ShooterEnemy | TankEnemy,
    enemyType: EnemySpawnType,
    inheritedVelocity: Phaser.Math.Vector2,
    style: DeathShardStyle = 'ship'
  ): void {
    const visual = this.getEnemyDeathShardVisual(enemyType);

    this.emitDeathShards(
      visual.textureKey,
      enemy.body.x,
      enemy.body.y,
      visual.displaySize,
      enemy.body.rotation + visual.visualRotation,
      inheritedVelocity,
      style
    );
  }

  private testDeathShardEffect(style: DeathShardStyle): void {
    if (!this.isGameplayWorldActive() || !this.player) {
      return;
    }

    const forward = this.getForwardDirection(this.player.rotation);
    const x = wrapCoordinate(this.player.x + forward.x * 135, this.arena.width);
    const y = wrapCoordinate(this.player.y + forward.y * 135, this.arena.height);
    const inheritedVelocity = this.playerVelocity.clone().add(forward.scale(120));

    if (style === 'player') {
      const ship = this.getSelectedShipDefinition();
      this.emitDeathShards(ship.textureKey, x, y, ship.displaySize, this.player.rotation + ship.visualRotation, inheritedVelocity, style);
      return;
    }

    if (style === 'asteroid' || style === 'blackHoleAsteroid') {
      this.emitDeathShards('asteroid-variant-1', x, y, ASTEROID_TIER_CONFIG[3].displaySize, this.player.rotation, inheritedVelocity, style);
      return;
    }

    this.emitDeathShards(BASIC_ENEMY_TEXTURE_KEY, x, y, BASIC_ENEMY_DISPLAY_SIZE, this.player.rotation, inheritedVelocity, style);
  }

  private getEnemyDeathShardVisual(enemyType: EnemySpawnType): {
    textureKey: string;
    displaySize: number;
    visualRotation: number;
  } {
    switch (enemyType) {
      case 'shooter':
        return {
          textureKey: SHOOTER_ENEMY_TEXTURE_KEY,
          displaySize: SHOOTER_ENEMY_DISPLAY_SIZE,
          visualRotation: SHOOTER_ENEMY_VISUAL_ROTATION
        };
      case 'tank':
        return {
          textureKey: TANK_ENEMY_TEXTURE_KEY,
          displaySize: TANK_ENEMY_DISPLAY_SIZE,
          visualRotation: TANK_ENEMY_VISUAL_ROTATION
        };
      default:
        return {
          textureKey: BASIC_ENEMY_TEXTURE_KEY,
          displaySize: BASIC_ENEMY_DISPLAY_SIZE,
          visualRotation: BASIC_ENEMY_VISUAL_ROTATION
        };
    }
  }

  private destroyEnemyWithRewards<T extends BasicEnemy | ShooterEnemy | TankEnemy>(
    enemy: T,
    enemies: T[],
    index: number,
    enemyType: EnemySpawnType,
    inheritedVelocity = this.getEnemyTotalVelocity(enemy)
  ): void {
    const x = enemy.body.x;
    const y = enemy.body.y;

    this.emitEnemyDeathShards(enemy, enemyType, inheritedVelocity);
    this.spawnEnemyWreckageDebris(enemyType, x, y, inheritedVelocity);
    this.trySpawnEnemyRewardPickup(enemy.stats.scrapValue, x, y, inheritedVelocity, enemy.stats.scrapDropChance);
    enemy.body.destroy(true);
    enemy.wrapMirrorBody.destroy(true);
    enemies.splice(index, 1);
    this.grantXp(enemy.stats.xpValue);
  }

  private destroyLiveEnemyWithRewards(enemy: LiveGameEnemy, index: number, inheritedVelocity = this.getLiveEnemyTotalVelocity(enemy)): void {
    const x = enemy.body.x;
    const y = enemy.body.y;
    const legacyType = this.getLiveEnemyLegacySpawnType(enemy);

    this.emitLiveEnemyDeathShards(enemy, inheritedVelocity);
    this.spawnEnemyWreckageDebris(legacyType, x, y, inheritedVelocity);
    this.trySpawnEnemyRewardPickup(
      enemy.definition.rewards?.scrap ?? this.getLiveEnemyFallbackScrapValue(enemy),
      x,
      y,
      inheritedVelocity,
      1
    );
    destroyLiveEnemySystem(enemy);
    this.liveEnemies.splice(index, 1);
    this.grantXp(enemy.definition.rewards?.xp ?? this.getLiveEnemyFallbackXpValue(enemy));

    if (enemy.definition.behavior.id === 'splitterChase') {
      const childId = String(enemy.definition.behavior.params?.childId ?? 'shard-drone');
      const childCount = Number(enemy.definition.behavior.params?.childCount ?? 3);
      for (let i = 0; i < childCount; i += 1) {
        const angle = (Math.PI * 2 * i) / Math.max(1, childCount);
        this.spawnLiveEnemy(childId, x + Math.cos(angle) * 42, y + Math.sin(angle) * 42, this.time.now, 'chaser');
      }
    }
  }

  private destroyLiveEnemyWithoutRewards(enemy: LiveGameEnemy): void {
    this.emitLiveEnemyDeathShards(enemy, this.getLiveEnemyTotalVelocity(enemy), 'blackHoleShip');
    destroyLiveEnemySystem(enemy);
  }

  private emitLiveEnemyDeathShards(
    enemy: LiveGameEnemy,
    inheritedVelocity: Phaser.Math.Vector2,
    style: DeathShardStyle = 'ship'
  ): void {
    this.emitDeathShards(
      getEnemyLabTextureKey(enemy.definitionId),
      enemy.body.x,
      enemy.body.y,
      enemy.definition.visual.size,
      enemy.body.rotation,
      inheritedVelocity,
      style
    );
  }

  private getLiveEnemyLegacySpawnType(enemy: LiveGameEnemy): EnemySpawnType {
    const raw = enemy.stateData.legacySpawnType;
    return raw === 'shooter' || raw === 'tank' || raw === 'chaser'
      ? raw
      : this.getLegacySpawnTypeForLiveDefinition(enemy.definitionId);
  }

  private getLiveEnemyFallbackScrapValue(enemy: LiveGameEnemy): number {
    const legacyType = this.getLiveEnemyLegacySpawnType(enemy);
    return legacyType === 'tank' ? tankEnemy.stats.scrapValue : legacyType === 'shooter' ? shooterEnemy.stats.scrapValue : basicEnemy.stats.scrapValue;
  }

  private getLiveEnemyFallbackXpValue(enemy: LiveGameEnemy): number {
    const legacyType = this.getLiveEnemyLegacySpawnType(enemy);
    return legacyType === 'tank' ? tankEnemy.stats.xpValue : legacyType === 'shooter' ? shooterEnemy.stats.xpValue : basicEnemy.stats.xpValue;
  }

  private destroyEnemyWithoutRewards(enemy: BasicEnemy | ShooterEnemy | TankEnemy): void {
    this.emitEnemyDeathShards(enemy, this.getEnemySpawnType(enemy), this.getEnemyTotalVelocity(enemy), 'blackHoleShip');
    enemy.body.destroy(true);
    enemy.wrapMirrorBody.destroy(true);
  }

  private getEnemySpawnType(enemy: BasicEnemy | ShooterEnemy | TankEnemy): EnemySpawnType {
    if (this.shooterEnemies.includes(enemy as ShooterEnemy)) {
      return 'shooter';
    }

    if (this.tankEnemies.includes(enemy as TankEnemy)) {
      return 'tank';
    }

    return 'chaser';
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
        ).limit(this.getGlobalMaxSpeed()),
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
    this.enemyWreckageDebris = updateEnemyWreckageDebrisSystem({
      arena: this.arena,
      debris: this.enemyWreckageDebris,
      time,
      deltaSeconds,
      isPlayerDead: false,
      applyBlackHoleToDebris: (debris, blackHoleDeltaSeconds) =>
        this.applyBlackHoleToDebris(debris, blackHoleDeltaSeconds),
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius)
    });
  }

  private applyBlackHoleToDebris(debris: EnemyWreckageDebris, deltaSeconds: number): boolean {
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
        mass: debris.mass,
        maxSpeed: this.getGlobalMaxSpeed()
      },
      this.arena,
      this.getActiveDebugBlackHoleFieldTuning()
    );

    if (result.isInsideEventHorizon) {
      this.destroyEnemyWreckageDebris(debris);
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

    destroyEnemyWreckageDebrisSystem(debris);
  }

  private clearEnemyWreckageDebris(): void {
    this.enemyWreckageDebris = clearEnemyWreckageDebrisSystem(this.enemyWreckageDebris);
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

  private trySpawnScrapPickup(
    source: ScrapSourceType,
    value: number,
    x: number,
    y: number,
    inheritedVelocity: Phaser.Math.Vector2,
    baseDropChance = 1
  ): void {
    const dropChance = Phaser.Math.Clamp(baseDropChance * (1 + this.getResolvedPlayerStats().luck), 0, 1);
    if (Phaser.Math.FloatBetween(0, 1) > dropChance) {
      return;
    }

    this.spawnScrapPickup(source, value, x, y, inheritedVelocity);
  }

  private trySpawnEnemyRewardPickup(
    scrapValue: number,
    x: number,
    y: number,
    inheritedVelocity: Phaser.Math.Vector2,
    baseDropChance = 1
  ): void {
    const playerStats = this.getResolvedPlayerStats();
    const luckMultiplier = 1 + playerStats.luck;
    const specialDropChance = Phaser.Math.Clamp(SPECIAL_UPGRADE_DROP_CHANCE * luckMultiplier, 0, 0.35);
    const normalDropChance = Phaser.Math.Clamp(NORMAL_UPGRADE_DROP_CHANCE * luckMultiplier, 0, 0.55);
    const roll = Phaser.Math.FloatBetween(0, 1);

    if (roll < specialDropChance && this.getSpecialUpgradeDropChoices().length > 0) {
      this.spawnRewardPickup('special-upgrade', 'enemy', 0, x, y, inheritedVelocity);
      return;
    }

    if (roll < specialDropChance + normalDropChance) {
      this.spawnRewardPickup('banked-upgrade', 'enemy', 0, x, y, inheritedVelocity);
      return;
    }

    this.trySpawnScrapPickup('enemy', scrapValue, x, y, inheritedVelocity, baseDropChance);
  }

  private spawnScrapPickup(
    source: ScrapSourceType,
    value: number,
    x: number,
    y: number,
    inheritedVelocity: Phaser.Math.Vector2
  ): void {
    this.spawnRewardPickup('scrap', source, value, x, y, inheritedVelocity);
  }

  private spawnRewardPickup(
    kind: PlayerPickupKind,
    source: ScrapSourceType,
    value: number,
    x: number,
    y: number,
    inheritedVelocity: Phaser.Math.Vector2
  ): void {
    const collectRadius = SCRAP_PICKUP_COLLECT_RADIUS * this.getResolvedPlayerStats().magnet;
    this.scrapPickups = spawnScrapPickupSystem({
      arena: this.arena,
      pickups: this.scrapPickups,
      kind,
      source,
      value,
      x,
      y,
      inheritedVelocity,
      pickupRadius: collectRadius,
      magnetRadius: collectRadius * PICKUP_MAGNET_RADIUS_MULTIPLIER,
      time: this.time.now,
      createPickupBody: (spawnX, spawnY, pickupKind) => this.createPickupBody(spawnX, spawnY, pickupKind)
    });
  }

  private createPickupBody(x: number, y: number, kind: PlayerPickupKind): Phaser.GameObjects.Container {
    const isSpecialUpgrade = kind === 'special-upgrade';
    const isUpgradePickup = kind === 'banked-upgrade' || isSpecialUpgrade;
    const glowColor = isSpecialUpgrade ? 0xffc857 : isUpgradePickup ? 0x73f2ff : 0x73f2ff;
    const glowAlpha = isSpecialUpgrade ? 0.42 : isUpgradePickup ? 0.24 : 0.18;
    const glowScale = isSpecialUpgrade ? 2.2 : 1.65;
    const glow = this.add.ellipse(
      0,
      0,
      SCRAP_PICKUP_DISPLAY_SIZE * glowScale,
      SCRAP_PICKUP_DISPLAY_SIZE * glowScale,
      glowColor,
      glowAlpha
    );
    const visual = this.add.image(0, 0, isUpgradePickup ? UPGRADE_CRATE_PICKUP_TEXTURE_KEY : SCRAP_PICKUP_TEXTURE_KEY);

    visual.setOrigin(0.5, 0.5);
    visual.setDisplaySize(SCRAP_PICKUP_DISPLAY_SIZE, SCRAP_PICKUP_DISPLAY_SIZE);
    visual.setTint(isSpecialUpgrade ? 0xfff0a8 : 0xdaf8ff);

    const body = this.add.container(x, y, [glow, visual]);
    body.setSize(SCRAP_PICKUP_DISPLAY_SIZE, SCRAP_PICKUP_DISPLAY_SIZE);
    body.setDepth(7);
    body.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    return body;
  }

  private updateScrapPickups(time: number, deltaSeconds: number): void {
    this.scrapPickups = updateScrapPickupsSystem({
      arena: this.arena,
      pickups: this.scrapPickups,
      playerX: this.player.x,
      playerY: this.player.y,
      time,
      deltaSeconds,
      isPlayerDead: false,
      applyBlackHoleToPickup: (pickup, blackHoleDeltaSeconds) =>
        this.applyBlackHoleToScrap(pickup, blackHoleDeltaSeconds),
      collectPickup: (pickup) => this.collectScrapPickup(pickup),
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius)
    });
  }

  private applyBlackHoleToScrap(scrap: ScrapPickup, deltaSeconds: number): boolean {
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
      return true;
    }

    return false;
  }

  private collectScrapPickup(scrap: ScrapPickup): void {
    if (scrap.kind === 'banked-upgrade') {
      this.bankedUpgrades += 1;
      this.emitUpgradePickupFeedback(scrap.body.x, scrap.body.y, 'Upgrade banked', 0xffc857);
      this.destroyScrapPickup(scrap);
      this.updateGameplayHud(this.time.now);
      this.updateUpgradeButton();
      return;
    }

    if (scrap.kind === 'special-upgrade') {
      this.emitUpgradePickupFeedback(scrap.body.x, scrap.body.y, 'Rare upgrade', 0xb88cff);
      this.destroyScrapPickup(scrap);
      this.openSpecialUpgradeOverlay(this.time.now);
      return;
    }

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

    destroyScrapPickupSystem(scrap);
  }

  private clearScrapPickups(): void {
    this.scrapPickups = clearScrapPickupsSystem(this.scrapPickups);
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
      breakupProfile: createAsteroidBreakupProfileSystem(tier),
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

  private updatePlayerMovement(time: number, deltaSeconds: number): void {
    if (!this.player) {
      return;
    }

    if (this.isPlayerDead) {
      if (this.isControlJustDown('restart')) {
        this.startRun();
      }

      return;
    }

    this.updatePlayerFacing();

    const strafeLeft = this.isControlDown('moveLeft');
    const strafeRight = this.isControlDown('moveRight');
    const thrustForward = this.isControlDown('moveUp');
    const thrustReverse = this.isControlDown('moveDown');
    const shipForward = this.getForwardDirection(this.player.rotation);
    const shipRight = new Phaser.Math.Vector2(-shipForward.y, shipForward.x);
    const isWorldRelative = this.gameSettings.movementMode === 'worldRelative';
    const movementForward = isWorldRelative ? new Phaser.Math.Vector2(0, -1) : shipForward;
    const movementRight = isWorldRelative ? new Phaser.Math.Vector2(1, 0) : shipRight;

    const playerAcceleration = new Phaser.Math.Vector2(0, 0);

    if (thrustForward) {
      playerAcceleration.x += movementForward.x * this.getPlayerThrustAcceleration();
      playerAcceleration.y += movementForward.y * this.getPlayerThrustAcceleration();
    }

    if (thrustReverse) {
      playerAcceleration.x -= movementForward.x * this.getPlayerReverseThrustAcceleration();
      playerAcceleration.y -= movementForward.y * this.getPlayerReverseThrustAcceleration();
    }

    if (strafeLeft) {
      playerAcceleration.x -= movementRight.x * this.getPlayerStrafeThrustAcceleration();
      playerAcceleration.y -= movementRight.y * this.getPlayerStrafeThrustAcceleration();
    }

    if (strafeRight) {
      playerAcceleration.x += movementRight.x * this.getPlayerStrafeThrustAcceleration();
      playerAcceleration.y += movementRight.y * this.getPlayerStrafeThrustAcceleration();
    }

    if (playerAcceleration.lengthSq() > 0) {
      applyAccelerationWithMass({
        velocity: this.playerVelocity,
        acceleration: playerAcceleration,
        mass: this.getPlayerMass(),
        deltaSeconds,
        referenceMass: PLAYER_MASS,
        massExponent: this.debugState.playerControlMassExponent,
        accelerationScale: this.debugState.playerInertiaScale
      });
    }

    this.updateThrusterEffects(time, thrustForward, thrustReverse, strafeLeft, strafeRight, isWorldRelative);

    this.applyBlackHoleToPlayer(time, deltaSeconds);
    if (this.isPlayerDead) {
      return;
    }

    this.applyPlayerOverspeedDamping(deltaSeconds);

    this.player.x += this.playerVelocity.x * deltaSeconds;
    this.player.y += this.playerVelocity.y * deltaSeconds;
    this.updateRammingShieldDashBurstMovement(deltaSeconds);
  }

  private applyPlayerOverspeedDamping(deltaSeconds: number): void {
    const speed = this.playerVelocity.length();
    const velocityLimit = this.getPlayerVelocityLimit();

    if (speed <= velocityLimit || speed <= 0.0001 || deltaSeconds <= 0) {
      return;
    }

    const excessSpeed = speed - velocityLimit;
    const dampedExcessSpeed = excessSpeed * Math.exp(-this.getPlayerOverspeedDamping() * deltaSeconds);
    this.playerVelocity.setLength(velocityLimit + dampedExcessSpeed);
  }

  private updateDebugMenuInput(time: number): void {
    if (!this.debugMenuHost?.isCreated() || !this.isDebugMenuAvailable()) {
      return;
    }

    if (this.debugMenuHost.isOpen() && this.isPlayerDead && this.isControlJustDown('restart')) {
      this.startRun();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.debugMenuKey)) {
      if (this.isUpgradeOverlayOpen) {
        return;
      }

      if (this.debugMenuHost.isOpen()) {
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
    if (!this.debugMenuHost?.isCreated() || this.debugMenuHost.isOpen() || this.isUpgradeOverlayOpen) {
      return;
    }

    this.debugMenuHost.open();
    this.isDebugMenuRefreshDirty = true;
    this.refreshDebugMenu(time, true);
  }

  private closeDebugMenu(time: number): void {
    if (!this.debugMenuHost?.isOpen()) {
      return;
    }

    this.debugMenuHost.close();
    this.updateGameplayHud(time);
  }

  private updateUpgradeOverlayInput(time: number): void {
    if (this.isControlJustDown('minimap')) {
      this.minimap.toggle();
    }

    if (this.isPlayerDead) {
      if (this.isUpgradeOverlayOpen) {
        this.closeUpgradeOverlay(time);
      }

      return;
    }

    if (!this.isUpgradeOverlayOpen) {
      if (this.bankedUpgrades > 0 && this.isControlJustDown('upgrade')) {
        this.openUpgradeOverlay(time);
      }

      return;
    }

    if (this.isPauseJustDown()) {
      this.closeUpgradeOverlay(time);
      this.suppressPauseToggleUntil = time + 120;
      return;
    }

    for (let i = 0; i < this.upgradeChoiceKeys.length; i += 1) {
      if (Phaser.Input.Keyboard.JustDown(this.upgradeChoiceKeys[i])) {
        this.selectUpgradeOverlayChoiceAt(i, time);
        return;
      }
    }
  }

  private updatePauseMenuInput(time: number): void {
    if (this.isUpgradeOverlayOpen || this.gameFlowState !== 'running') {
      return;
    }

    if (this.awaitingBinding) {
      return;
    }

    if (time < this.suppressPauseToggleUntil) {
      return;
    }

    if (this.isPauseJustDown()) {
      if (this.isPauseMenuOpen) {
        if (this.pauseMenuTab === 'pause') {
          this.closePauseMenu(time);
        } else {
          this.pauseMenuTab = 'pause';
          this.refreshPauseMenu();
        }
      } else if (!this.isPlayerDead) {
        this.openPauseMenu(time, 'pause');
      }
    }
  }

  private openPauseMenu(time: number, tab: PauseMenuTab): void {
    if (this.isPauseMenuOpen || this.isUpgradeOverlayOpen || this.gameFlowState !== 'running') {
      return;
    }

    this.isPauseMenuOpen = true;
    this.pauseMenuTab = tab;
    this.pauseMenuOpenedAt = time;
    this.refreshPauseMenu();
  }

  private closePauseMenu(time: number): void {
    if (!this.isPauseMenuOpen) {
      return;
    }

    const pauseDurationMs = Math.max(0, time - this.pauseMenuOpenedAt);
    this.totalPauseMenuPauseMs += pauseDurationMs;
    this.nextEnemySpawnAt += pauseDurationMs;
    this.nextEnemySwarmAt += pauseDurationMs;
    this.pauseMenuOpenedAt = 0;
    this.pauseMenuTab = 'pause';
    this.awaitingBinding = undefined;
    this.pauseMenuScreen = destroyScreenHandle(this.pauseMenuScreen, {
      disableZones: true,
      resetCursor: () => this.resetUiCursor()
    });
    this.isPauseMenuOpen = false;
    this.updateGameplayHud(time);
  }

  private refreshPauseMenu(): void {
    if (!this.isPauseMenuOpen) {
      return;
    }

    this.pauseMenuScreen = destroyScreenHandle(this.pauseMenuScreen, {
      disableZones: true,
      resetCursor: () => this.resetUiCursor()
    });
    this.pauseMenuScreen = createPauseMenuScreen({
      scene: this,
      settings: cloneGameSettings(this.gameSettings),
      activeTab: this.pauseMenuTab,
      awaitingBinding: this.awaitingBinding,
      isActionActive: () => this.isPauseMenuOpen,
      resetCursor: () => this.resetUiCursor(),
      onResume: () => {
        if (this.pauseMenuTab === 'pause') {
          this.closePauseMenu(this.time.now);
        } else {
          this.pauseMenuTab = 'pause';
          this.refreshPauseMenu();
        }
      },
      onRestart: () => {
        this.closePauseMenu(this.time.now);
        this.startRun();
      },
      onMainMenu: () => {
        this.closePauseMenu(this.time.now);
        this.showMainMenu();
      },
      onSelectTab: (tab) => {
        this.pauseMenuTab = tab;
        this.awaitingBinding = undefined;
        this.refreshPauseMenu();
      },
      onSetMovementMode: (mode) => this.setMovementMode(mode),
      onCaptureBinding: (action, slot) => this.startBindingCapture(action, slot),
      onResetControls: () => {
        this.gameSettings = resetControlSettings(this.gameSettings);
        this.rebuildControlKeys();
        this.awaitingBinding = undefined;
        this.refreshPauseMenu();
      },
      onResetAll: () => {
        this.gameSettings = resetGameSettings();
        this.rebuildControlKeys();
        this.awaitingBinding = undefined;
        this.refreshPauseMenu();
      }
    });
  }

  private setMovementMode(mode: MovementMode): void {
    this.gameSettings = { ...this.gameSettings, movementMode: mode };
    saveGameSettings(this.gameSettings);
    this.refreshPauseMenu();
  }

  private startBindingCapture(action: RunControlAction, slot: BindingSlot): void {
    if (!this.input.keyboard) {
      return;
    }

    this.awaitingBinding = { action, slot };
    this.refreshPauseMenu();
    this.input.keyboard.once('keydown', (event: KeyboardEvent) => {
      if (!this.awaitingBinding) {
        return;
      }

      if (event.code !== 'Escape') {
        const keyBindings = cloneGameSettings(this.gameSettings).keyBindings;
        keyBindings[action] = { ...keyBindings[action], [slot]: event.code };
        this.gameSettings = { ...this.gameSettings, keyBindings };
        saveGameSettings(this.gameSettings);
        this.rebuildControlKeys();
      }

      this.awaitingBinding = undefined;
      this.refreshPauseMenu();
    });
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
    this.starfield.adjustParallax(layer, direction);
  }

  private resetStarfieldParallax(): void {
    this.starfield.resetParallax();
  }

  private toggleBackgroundStars(): void {
    this.starfield.toggleStars();
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
    this.upgradeOverlayPromptText.setVisible(true);
    this.updateUpgradeButton();
  }

  private openSpecialUpgradeOverlay(time: number): void {
    if (this.isUpgradeOverlayOpen || this.isPlayerDead) {
      return;
    }

    const choices = this.getSpecialUpgradeDropChoices();
    if (choices.length <= 0) {
      this.bankedUpgrades += 1;
      this.updateGameplayHud(time);
      this.updateUpgradeButton();
      return;
    }

    this.specialUpgradeOverlayChoices = choices;
    this.isUpgradeOverlayOpen = true;
    this.upgradeOverlayOpenedAt = time;
    this.refreshUpgradeOverlayText();
    this.upgradeOverlayGraphics.setVisible(true);
    this.upgradeOverlayText.setVisible(true);
    this.upgradeOverlayPromptText.setVisible(true);
    this.updateUpgradeButton();
  }

  private closeUpgradeOverlay(time: number): void {
    if (this.isUpgradeOverlayOpen) {
      const pauseDurationMs = Math.max(0, time - this.upgradeOverlayOpenedAt);
      this.totalUpgradePauseMs += pauseDurationMs;
      this.nextEnemySpawnAt += pauseDurationMs;
      this.nextEnemySwarmAt += pauseDurationMs;
    }

    this.isUpgradeOverlayOpen = false;
    this.upgradeOverlayOpenedAt = 0;
    this.normalUpgradeOverlayChoices = null;
    this.specialUpgradeOverlayChoices = null;
    this.upgradeOverlayGraphics.setVisible(false);
    this.upgradeOverlayText.setVisible(false);
    this.upgradeOverlayPromptText.setVisible(false);
    for (const text of [...this.upgradeOverlayChoiceTexts, ...this.upgradeOverlayChoiceMetaTexts]) {
      text.setVisible(false);
    }
    for (const hitZone of this.upgradeOverlayChoiceHitZones) {
      hitZone.setVisible(false).disableInteractive();
    }
    this.updateGameplayHud(time);
    this.updateUpgradeButton();
  }

  private getUpgradeOverlayChoices(): UpgradeOverlayChoice[] {
    if (this.specialUpgradeOverlayChoices) {
      return this.specialUpgradeOverlayChoices;
    }

    if (this.normalUpgradeOverlayChoices) {
      return this.normalUpgradeOverlayChoices;
    }

    const secondaryChoices = this.getSecondaryWeaponChoices();
    this.normalUpgradeOverlayChoices =
      secondaryChoices.length > 0
        ? secondaryChoices
        : Phaser.Utils.Array.Shuffle([
            ...getAvailableRunUpgrades(this.runUpgradeLevels, this.getEquippedWeaponDefinitions())
          ]).slice(0, UPGRADE_OVERLAY_CHOICE_COUNT);

    return this.normalUpgradeOverlayChoices;
  }

  private getSpecialUpgradeDropChoices(): UpgradeDefinition[] {
    const specialPool = UPGRADE_CHOICES.filter((upgrade) => upgrade.rarity === 'rare');
    const available = getAvailableRunUpgrades(this.runUpgradeLevels, this.getEquippedWeaponDefinitions(), specialPool);
    return Phaser.Utils.Array.Shuffle([...available]).slice(0, UPGRADE_OVERLAY_CHOICE_COUNT);
  }

  private getEquippedWeaponDefinitions(): WeaponRegistryEntry[] {
    const weaponIds = new Set<WeaponId>([
      ...this.playerWeapons.ownedAutoWeaponIds,
      ...this.playerWeapons.ownedManualWeaponIds
    ]);

    return [...weaponIds].map((weaponId) => getWeaponDefinition(weaponId));
  }

  private getSecondaryWeaponChoices(): SecondaryWeaponChoice[] {
    if (this.playerWeapons.ownedManualWeaponIds.length >= 3) {
      return [];
    }

    const ownedWeaponIds = new Set<WeaponId>([
      ...this.playerWeapons.ownedAutoWeaponIds,
      ...this.playerWeapons.ownedManualWeaponIds
    ]);
    const seenWeaponIds = new Set<WeaponId>();

    return shipRegistry
      .filter((ship) => this.isShipUnlocked(ship.id))
      .map((ship) => ship.startingPrimaryWeaponId)
      .filter((weaponId): weaponId is WeaponId => {
        if (!weaponId || ownedWeaponIds.has(weaponId)) {
          return false;
        }

        const weapon = getWeaponDefinition(weaponId);
        if (weapon.assignmentType !== 'manual' || !weapon.eligibleAsSecondary || seenWeaponIds.has(weaponId)) {
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

  private selectUpgradeOverlayChoiceAt(index: number, time: number): void {
    if (!this.isUpgradeOverlayOpen || this.isPlayerDead) {
      return;
    }

    const choice = this.getUpgradeOverlayChoices()[index];
    if (!choice) {
      return;
    }

    this.selectUpgradeOverlayChoice(choice, time);
  }

  private selectSecondaryWeapon(weaponId: WeaponId, time: number): void {
    const weapon = getWeaponDefinition(weaponId);
    if (
      this.bankedUpgrades <= 0 ||
      weapon.assignmentType !== 'manual' ||
      this.playerWeapons.ownedManualWeaponIds.includes(weaponId) ||
      this.playerWeapons.ownedManualWeaponIds.length >= 3
    ) {
      this.closeUpgradeOverlay(time);
      return;
    }

    this.playerWeapons.ownedManualWeaponIds.push(weaponId);
    if (!this.playerWeapons.activePrimaryWeaponId) {
      this.playerWeapons.activePrimaryWeaponId = weaponId;
      this.playerWeapons.nextPrimaryWeaponFireAt = 0;
    } else if (!this.playerWeapons.activeSecondaryWeaponId) {
      this.playerWeapons.activeSecondaryWeaponId = weaponId;
      this.playerWeapons.nextSecondaryWeaponFireAt = 0;
    }
    this.hasResolvedSecondaryWeaponChoice = true;
    this.ensureRammingShieldRuntime();
    this.bankedUpgrades -= 1;
    this.advanceOrCloseNormalUpgradeOverlay(time);
  }

  private selectUpgrade(upgrade: UpgradeDefinition, time: number): void {
    const isSpecialChoice = this.specialUpgradeOverlayChoices !== null;

    if (!isSpecialChoice && this.bankedUpgrades <= 0) {
      this.closeUpgradeOverlay(time);
      return;
    }

    if (this.isUpgradeAtMaxLevel(upgrade)) {
      this.refreshUpgradeOverlayText();
      return;
    }

    incrementRunUpgradeLevel(this.runUpgradeLevels, upgrade);

    if (this.isPassiveStatUpgradeId(upgrade.id)) {
      this.applyPassiveUpgrade(upgrade.id);
    }

    if (!isSpecialChoice) {
      this.bankedUpgrades -= 1;
    }

    if (isSpecialChoice) {
      this.closeUpgradeOverlay(time);
    } else {
      this.advanceOrCloseNormalUpgradeOverlay(time);
    }
  }

  private advanceOrCloseNormalUpgradeOverlay(time: number): void {
    this.normalUpgradeOverlayChoices = null;

    if (this.bankedUpgrades <= 0 || this.isPlayerDead) {
      this.closeUpgradeOverlay(time);
      return;
    }

    this.refreshUpgradeOverlayText();
    this.updateGameplayHud(time);
    this.updateUpgradeButton();
  }

  private applyPassiveUpgrade(upgradeId: PassiveUpgradeId): void {
    if (upgradeId === 'hull-plating') {
      this.playerHull = Math.min(this.getPlayerMaxHull(), this.playerHull + HULL_PLATING_REPAIR);
    } else if (upgradeId === 'damage-control') {
      this.playerHull = Math.min(this.getPlayerMaxHull(), this.playerHull + DAMAGE_CONTROL_REPAIR);
    }
  }

  private isPassiveStatUpgradeId(upgradeId: UpgradeId): upgradeId is PassiveUpgradeId {
    return (
      upgradeId === 'hull-plating' ||
      upgradeId === 'engine-tuning' ||
      upgradeId === 'damage-control' ||
      upgradeId === 'stat_amount' ||
      upgradeId === 'stat_magnet' ||
      upgradeId === 'stat_luck' ||
      upgradeId === 'stat_growth' ||
      upgradeId === 'stat_greed'
    );
  }

  private isUpgradeAtMaxLevel(upgrade: UpgradeDefinition): boolean {
    return isRunUpgradeAtMaxLevel(this.runUpgradeLevels, upgrade);
  }

  private getUpgradeLevel(upgrade: UpgradeDefinition): number {
    return getRunUpgradeLevel(this.runUpgradeLevels, upgrade);
  }

  private getRunUpgradeLevelById(upgradeId: UpgradeId): number {
    return this.runUpgradeLevels[upgradeId] ?? 0;
  }

  private getPlayerMaxHull(): number {
    return this.getResolvedPlayerStats().maxHull;
  }

  private getPlayerAccelerationMultiplier(): number {
    const baseThrust = this.getSelectedShipDefinition().baseStats.thrust;

    return baseThrust > 0 ? this.getResolvedPlayerStats().thrust / baseThrust : 1;
  }

  private getPlayerThrustAcceleration(): number {
    return this.getResolvedPlayerStats().thrust * this.debugState.playerThrustScale;
  }

  private getPlayerReverseThrustAcceleration(): number {
    return this.getResolvedPlayerStats().brake * this.debugState.playerBrakeScale;
  }

  private getPlayerStrafeThrustAcceleration(): number {
    return this.getResolvedPlayerStats().strafe * this.debugState.playerStrafeScale;
  }

  private getPlayerMaxSpeed(): number {
    return this.getResolvedPlayerStats().moveSpeed;
  }

  private getPlayerVelocityLimit(): number {
    return VELOCITY_LIMITER_BASE_SPEED + this.getActivePermanentUpgradeLevel('velocity-limiter') * VELOCITY_LIMITER_SPEED_BONUS;
  }

  private getPlayerOverspeedSafetyLimit(): number {
    return Math.max(this.getGlobalMaxSpeed(), this.getPlayerVelocityLimit() * 3);
  }

  private getPlayerOverspeedDamping(): number {
    const selectedShip = this.getSelectedShipDefinition();
    const massScale = Math.sqrt(PLAYER_MASS / Math.max(0.001, this.getPlayerMass()));
    return Math.max(0, selectedShip.movement.overspeedDamping * massScale);
  }

  private getGlobalMaxSpeed(): number {
    return this.debugState.globalMaxSpeed;
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
    return clampBlackHoleRadiusScaleDebug(value);
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
    return clampBlackHoleForceMultiplierDebug(value);
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

  private adjustDebugShipLoadoutStat(shipId: ShipId, stat: DebugShipStatKey, delta: number): void {
    this.debugState.adjustShipStat(getShipDefinition(shipId), stat, toRawDebugDelta(stat, delta));

    if (shipId === this.selectedShipId) {
      this.playerHull = Math.min(this.playerHull, this.getPlayerMaxHull());
    }
  }

  private setDebugShipLoadoutStat(shipId: ShipId, stat: DebugShipStatKey, value: number): void {
    this.debugState.setShipStat(getShipDefinition(shipId), stat, toRawDebugValue(stat, value));

    if (shipId === this.selectedShipId) {
      this.playerHull = Math.min(this.playerHull, this.getPlayerMaxHull());
    }
  }

  private adjustDebugWeaponLoadoutStat(weaponId: WeaponId, stat: DebugWeaponStatKey, delta: number): void {
    this.debugState.adjustWeaponStat(getWeaponDefinition(weaponId), stat, toRawDebugDelta(stat, delta));
    this.syncRammingShieldDebugRuntime();
  }

  private setDebugWeaponLoadoutStat(weaponId: WeaponId, stat: DebugWeaponStatKey, value: number): void {
    this.debugState.setWeaponStat(getWeaponDefinition(weaponId), stat, toRawDebugValue(stat, value));
    this.syncRammingShieldDebugRuntime();
  }

  private saveDebugShipLoadout(shipId: ShipId): void {
    const ship = getShipDefinition(shipId);
    const markdown = createDebugShipLoadoutMarkdown(this.debugState, ship);
    downloadTextFile(`ship-${ship.id}-debug-loadout-${getTimestampSlug()}.md`, markdown, 'text/markdown');
  }

  private loadDebugShipLoadout(shipId: ShipId): void {
    loadMarkdownFile((contents) => {
      this.applyDebugShipLoadoutMarkdown(shipId, contents);
      this.refreshDebugMenu(this.time.now, true);
    });
  }

  private saveDebugWeaponLoadout(weaponId: WeaponId): void {
    const weapon = getWeaponDefinition(weaponId);
    const markdown = createDebugWeaponLoadoutMarkdown(this.debugState, weapon);
    downloadTextFile(`weapon-${weapon.id}-debug-loadout-${getTimestampSlug()}.md`, markdown, 'text/markdown');
  }

  private loadDebugWeaponLoadout(weaponId: WeaponId): void {
    loadMarkdownFile((contents) => {
      this.applyDebugWeaponLoadoutMarkdown(weaponId, contents);
      this.refreshDebugMenu(this.time.now, true);
    });
  }

  private applyDebugShipLoadoutMarkdown(expectedShipId: ShipId, markdown: string): void {
    const overrides = parseDebugShipLoadoutMarkdown(expectedShipId, markdown);
    if (!overrides) {
      return;
    }

    this.debugState.setShipOverrides(expectedShipId, overrides);
    if (expectedShipId === this.selectedShipId) {
      this.playerHull = Math.min(this.playerHull, this.getPlayerMaxHull());
    }
  }

  private applyDebugWeaponLoadoutMarkdown(expectedWeaponId: WeaponId, markdown: string): void {
    const overrides = parseDebugWeaponLoadoutMarkdown(expectedWeaponId, markdown);
    if (!overrides) {
      return;
    }

    this.debugState.setWeaponOverrides(expectedWeaponId, overrides);
    this.syncRammingShieldDebugRuntime();
  }

  private saveDebugPreset(): void {
    const markdown = createDebugPresetMarkdown(this.createDebugPresetSetup());
    downloadTextFile(`starvivors-debug-preset-${getTimestampSlug()}.md`, markdown, 'text/markdown');
  }

  private loadDebugPreset(): void {
    loadMarkdownFile((contents) => {
      this.applyDebugPresetMarkdown(contents);
      this.refreshDebugMenu(this.time.now, true);
    });
  }

  private applyDebugPresetMarkdown(markdown: string): void {
    const setup = parseDebugPresetMarkdown(markdown);

    if (!setup) {
      return;
    }

    this.applyDebugPresetSetup(setup);
  }

  private createDebugPresetSetup(): Record<string, unknown> {
    return {
      debugState: this.debugState.createDebugPresetState(),
      starfield: this.starfield.getDebugValues(),
      blackHole: {
        lensOrbitSpeedMultiplier: this.debugBlackHoleLensOrbitSpeedMultiplier,
        lensDensity: this.debugBlackHoleLensDensity,
        lensLengthMultiplier: this.debugBlackHoleLensLengthMultiplier,
        influenceRadiusScale: this.debugBlackHoleInfluenceRadiusScale,
        damageRadiusScale: this.debugBlackHoleDamageRadiusScale,
        visualScale: this.debugBlackHoleVisualScale,
        coreScale: this.debugBlackHoleCoreScale,
        fieldTuning: { ...this.debugBlackHoleFieldTuning },
        projectionLensLayersEnabled: this.areDebugBlackHoleProjectionLensLayersEnabled,
        selectedPngLayerIndex: this.debugSelectedBlackHolePngLayerIndex,
        addPngTextureKey: this.debugAddBlackHolePngTextureKey,
        pngLayers: (this.blackHole?.getPngLayerSummaries() ?? []).map((layer) => ({
          image: layer.textureKey,
          speedRps: layer.speedRps,
          size: layer.sizeMultiplier,
          alpha: layer.alpha,
          enabled: layer.enabled,
          initialRotation: layer.initialRotation
        }))
      }
    };
  }

  private applyDebugPresetSetup(setup: Record<string, unknown>): void {
    this.debugState.applyDebugPresetState(setup.debugState);
    this.playerInvulnerableUntil = this.debugState.playerInvulnerable ? Number.MAX_SAFE_INTEGER : 0;
    this.playerHull = Math.min(this.playerHull, this.getPlayerMaxHull());
    this.syncRammingShieldDebugRuntime();

    const starfield = this.getRecord(setup.starfield);
    this.starfield.setDebugValues({
      backgroundStarsVisible: this.getBoolean(starfield.backgroundStarsVisible, this.starfield.getDebugValues().backgroundStarsVisible),
      starfieldFarParallax: this.getNumber(starfield.starfieldFarParallax, this.starfield.getDebugValues().starfieldFarParallax),
      starfieldMidParallax: this.getNumber(starfield.starfieldMidParallax, this.starfield.getDebugValues().starfieldMidParallax),
      starfieldNearParallax: this.getNumber(starfield.starfieldNearParallax, this.starfield.getDebugValues().starfieldNearParallax)
    });

    const blackHole = this.getRecord(setup.blackHole);
    this.debugBlackHoleLensOrbitSpeedMultiplier = this.clampBlackHoleForceMultiplier(
      this.getNumber(blackHole.lensOrbitSpeedMultiplier, this.debugBlackHoleLensOrbitSpeedMultiplier)
    );
    this.debugBlackHoleLensDensity = Math.round(this.getNumber(blackHole.lensDensity, this.debugBlackHoleLensDensity));
    this.debugBlackHoleLensLengthMultiplier = this.clampBlackHoleForceMultiplier(
      this.getNumber(blackHole.lensLengthMultiplier, this.debugBlackHoleLensLengthMultiplier)
    );
    this.debugBlackHoleInfluenceRadiusScale = this.clampBlackHoleRadiusScale(
      this.getNumber(blackHole.influenceRadiusScale, this.debugBlackHoleInfluenceRadiusScale)
    );
    this.debugBlackHoleDamageRadiusScale = this.clampBlackHoleRadiusScale(
      this.getNumber(blackHole.damageRadiusScale, this.debugBlackHoleDamageRadiusScale)
    );
    this.debugBlackHoleVisualScale = this.clampBlackHoleRadiusScale(
      this.getNumber(blackHole.visualScale, this.debugBlackHoleVisualScale)
    );
    this.debugBlackHoleCoreScale = this.clampBlackHoleRadiusScale(
      this.getNumber(blackHole.coreScale, this.debugBlackHoleCoreScale)
    );
    this.debugBlackHoleFieldTuning = normalizeBlackHoleFieldTuningDebug(
      this.getRecord(blackHole.fieldTuning),
      this.debugBlackHoleFieldTuning
    );
    this.areDebugBlackHoleProjectionLensLayersEnabled = this.getBoolean(
      blackHole.projectionLensLayersEnabled,
      this.areDebugBlackHoleProjectionLensLayersEnabled
    );
    if (isBlackHolePngTextureKeyDebug(blackHole.addPngTextureKey)) {
      this.debugAddBlackHolePngTextureKey = blackHole.addPngTextureKey;
    }

    const rawLayers = Array.isArray(blackHole.pngLayers) ? blackHole.pngLayers : undefined;
    const layers = normalizeBlackHolePngSetupLayersDebug(rawLayers);
    if (layers) {
      this.blackHole?.setPngLayers(layers);
    }
    const layerCount = this.blackHole?.getPngLayerCount() ?? 0;
    this.debugSelectedBlackHolePngLayerIndex = Phaser.Math.Clamp(
      Math.trunc(this.getNumber(blackHole.selectedPngLayerIndex, this.debugSelectedBlackHolePngLayerIndex)),
      0,
      Math.max(0, layerCount - 1)
    );
  }

  private resetDebugTuning(): void {
    this.debugState.resetAllDebugTuning();
    this.playerInvulnerableUntil = 0;
    this.playerHull = Math.min(this.playerHull, this.getPlayerMaxHull());
    this.syncRammingShieldDebugRuntime();
    this.starfield.setDebugValues({
      backgroundStarsVisible: true,
      starfieldFarParallax: DEFAULT_STARFIELD_FAR_PARALLAX,
      starfieldMidParallax: DEFAULT_STARFIELD_MID_PARALLAX,
      starfieldNearParallax: DEFAULT_STARFIELD_NEAR_PARALLAX
    });
    this.resetBlackHoleLensTuning();
  }

  private getRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private getNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private getBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }

  private syncRammingShieldDebugRuntime(): void {
    if (!this.hasRammingShield()) {
      return;
    }

    const stats = this.getRammingShieldStats();
    this.rammingShieldState.hp = Math.min(this.rammingShieldState.hp, stats.shieldMaxHp);
    this.rammingShieldState.dashCharges = Math.min(this.rammingShieldState.dashCharges, stats.dashMaxCharges);
  }

  private saveBlackHolePngSetup(): void {
    const markdown = this.createBlackHolePngSetupMarkdown();
    const filename = `blackhole-setup-${getTimestampSlug()}.md`;

    downloadTextFile(filename, markdown, 'text/markdown');
  }

  private loadBlackHolePngSetup(): void {
    loadMarkdownFile((contents) => {
      this.applyBlackHolePngSetupMarkdown(contents);
      this.refreshDebugMenu(this.time.now, true);
    });
  }

  private saveBlackHoleFieldTuning(): void {
    const markdown = this.createBlackHoleFieldTuningMarkdown();
    const filename = `blackhole-field-tuning-${getTimestampSlug()}.md`;

    downloadTextFile(filename, markdown, 'text/markdown');
  }

  private loadBlackHoleFieldTuning(): void {
    loadMarkdownFile((contents) => {
      this.applyBlackHoleFieldTuningMarkdown(contents);
      this.refreshDebugMenu(this.time.now, true);
    });
  }

  private applyBlackHoleFieldTuningMarkdown(markdown: string): void {
    const setup = parseBlackHoleFieldTuningMarkdown(markdown);

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

    this.debugBlackHoleFieldTuning = normalizeBlackHoleFieldTuningDebug(setup, this.debugBlackHoleFieldTuning);
  }

  private applyBlackHolePngSetupMarkdown(markdown: string): void {
    const setup = parseBlackHolePngSetupMarkdown(markdown);

    if (!setup) {
      return;
    }

    const layers = normalizeBlackHolePngSetupLayersDebug(setup.layers);

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

    if (isBlackHolePngTextureKeyDebug(setup.addImage)) {
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

  private createBlackHolePngSetupMarkdown(): string {
    return createBlackHolePngSetupMarkdownDebug(
      {
        visualScale: this.debugBlackHoleVisualScale,
        coreScale: this.debugBlackHoleCoreScale,
        allLayersEnabled: this.areDebugBlackHoleProjectionLensLayersEnabled,
        addTextureKey: this.debugAddBlackHolePngTextureKey,
        selectedLayerIndex: this.debugSelectedBlackHolePngLayerIndex
      },
      this.blackHole?.getPngLayerSummaries() ?? []
    );
  }

  private createBlackHoleFieldTuningMarkdown(): string {
    return createBlackHoleFieldTuningMarkdownDebug({
      influenceRadiusScale: this.debugBlackHoleInfluenceRadiusScale,
      damageRadiusScale: this.debugBlackHoleDamageRadiusScale,
      coreScale: this.debugBlackHoleCoreScale,
      tuning: this.debugBlackHoleFieldTuning
    });
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

  private createResultsButton(): void {
    this.resultsButtonGraphics = this.add.graphics();
    this.resultsButtonText = this.add
      .text(0, 0, 'See Results', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '15px',
        color: '#f2fbff'
      })
      .setOrigin(0.5);

    this.resultsButtonContainer = this.add
      .container(this.scale.width / 2, 54, [this.resultsButtonGraphics, this.resultsButtonText])
      .setScrollFactor(0)
      .setDepth(1003)
      .setSize(170, 34)
      .setInteractive({ useHandCursor: true });

    this.resultsButtonContainer.on('pointerdown', () => this.showResultsScreen());
    this.updateResultsButton();
  }

  private updateResultsButton(): void {
    if (!this.resultsButtonContainer || !this.resultsButtonGraphics || !this.resultsButtonText) {
      return;
    }

    const isVisible = this.isPlayerDead && !this.resultsScreen;
    this.resultsButtonContainer
      .setPosition(this.scale.width / 2, 54)
      .setVisible(isVisible)
      .disableInteractive();

    if (isVisible) {
      this.resultsButtonContainer.setInteractive({ useHandCursor: true });
    }

    this.resultsButtonGraphics.clear();
    this.resultsButtonGraphics.fillStyle(0x071018, 0.94);
    this.resultsButtonGraphics.fillRoundedRect(-85, -17, 170, 34, 6);
    this.resultsButtonGraphics.lineStyle(2, 0xffc857, 0.9);
    this.resultsButtonGraphics.strokeRoundedRect(-85, -17, 170, 34, 6);
  }

  private createUpgradeOverlay(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const panelWidth = Math.min(width - 48, 720);
    const panelHeight = Math.min(height - 48, 560);
    const panelX = centerX - panelWidth / 2;
    const panelY = Math.max(56, height / 2 - panelHeight / 2);
    const cardX = panelX + 28;
    const cardWidth = panelWidth - 56;
    const cardHeight = 54;

    this.upgradeOverlayGraphics = this.add.graphics().setScrollFactor(0).setDepth(1200);

    for (let i = 0; i < UPGRADE_OVERLAY_CHOICE_COUNT; i += 1) {
      const cardY = panelY + 118 + i * (cardHeight + 8);
      const choiceText = this.add
        .text(cardX + 16, cardY + 9, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '13px',
          color: '#f2fbff',
          fixedWidth: cardWidth - 258,
          wordWrap: { width: cardWidth - 258 },
          lineSpacing: 2
        })
        .setScrollFactor(0)
        .setDepth(1201);
      const metaText = this.add
        .text(cardX + cardWidth - 16, cardY + 8, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '11px',
          color: '#a8c7ff',
          align: 'right',
          fixedWidth: 210
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(1201);

      this.upgradeOverlayChoiceTexts.push(choiceText);
      this.upgradeOverlayChoiceMetaTexts.push(metaText);

      const hitZone = this.add
        .zone(cardX, cardY, cardWidth, cardHeight)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1202)
        .setVisible(false);

      hitZone.on('pointerdown', () => this.selectUpgradeOverlayChoiceAt(i, this.time.now));
      this.upgradeOverlayChoiceHitZones.push(hitZone);
    }

    this.upgradeOverlayText = this.add
      .text(centerX, panelY + 28, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        align: 'left',
        fixedWidth: panelWidth - 56,
        lineSpacing: 4,
        wordWrap: { width: panelWidth - 56 }
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1201);

    this.upgradeOverlayPromptText = this.add
      .text(cardX, panelY + panelHeight - 34, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        fixedWidth: cardWidth,
        wordWrap: { width: cardWidth }
      })
      .setScrollFactor(0)
      .setDepth(1201);

    this.upgradeOverlayGraphics.setVisible(false);
    this.upgradeOverlayText.setVisible(false);
    this.upgradeOverlayPromptText.setVisible(false);
    for (const text of [...this.upgradeOverlayChoiceTexts, ...this.upgradeOverlayChoiceMetaTexts]) {
      text.setVisible(false);
    }
    for (const hitZone of this.upgradeOverlayChoiceHitZones) {
      hitZone.disableInteractive();
    }
  }

  private refreshUpgradeOverlayText(): void {
    const activeWeapon = this.getActivePrimaryWeaponDefinition() ?? this.getEffectiveAutoWeaponDefinition() ?? getWeaponDefinition('pulse-cannon');
    const damageMultiplier = this.getActiveAutoWeaponDamageMultiplier();
    const resolvedActiveWeapon = this.getResolvedWeaponStats(activeWeapon, activeWeapon.id === this.playerWeapons.activePrimaryWeaponId ? 'primary' : 'auto');
    const activeDamage = Math.round(
      resolvedActiveWeapon.projectile?.damage ?? resolvedActiveWeapon.rammingShield?.baseDamage ?? 0
    );
    const cooldownSeconds = this.getPulseCannonCooldownMs() / 1000;
    const speed = Math.round(this.getActiveAutoWeaponProjectileSpeed());
    const choices = this.getUpgradeOverlayChoices();
    const choicePrompt =
      choices.length > 0 ? `Click a card or press 1-${choices.length} to choose.  Esc closes without spending.` : 'Esc closes.';

    this.drawUpgradeOverlayCards(choices);
    choices.forEach((choice, index) => {
      const text = this.upgradeOverlayChoiceTexts[index];
      const metaText = this.upgradeOverlayChoiceMetaTexts[index];
      if (choice.category === 'secondary-weapon') {
        text.setText(`${index + 1}. ${choice.name}\n${choice.description}`);
        metaText.setText('SECONDARY');
        return;
      }

      const level = this.getUpgradeLevel(choice);
      const maxLevel = choice.maxLevel ? `/${choice.maxLevel}` : '';
      const maxLabel = this.isUpgradeAtMaxLevel(choice) ? '  MAX' : '';
      text.setText(`${index + 1}. ${choice.name}\n${choice.description}`);
      metaText.setText(`${choice.rarity.toUpperCase()}  ${choice.category.toUpperCase()}\nLv ${level}${maxLevel}${maxLabel}`);
    });

    for (let i = choices.length; i < this.upgradeOverlayChoiceTexts.length; i += 1) {
      this.upgradeOverlayChoiceTexts[i].setText('');
      this.upgradeOverlayChoiceMetaTexts[i].setText('');
    }

    this.upgradeOverlayText.setText(
      `${this.specialUpgradeOverlayChoices ? 'SPECIAL UPGRADE CACHE' : 'UPGRADE SELECTION'}\n` +
        `Banked upgrades: ${this.bankedUpgrades}\n` +
        `${activeWeapon.displayName}: ${activeDamage} damage, x${damageMultiplier.toFixed(2)}, ${cooldownSeconds.toFixed(2)}s cooldown, ${speed} speed\n` +
        `Ship: ${this.playerHull}/${this.getPlayerMaxHull()} hull, x${this.getPlayerAccelerationMultiplier().toFixed(2)} accel, ${(this.getPlayerDamageInvulnerabilityMs() / 1000).toFixed(2)}s i-frames`
    );
    this.upgradeOverlayPromptText.setText(choicePrompt);
  }

  private drawUpgradeOverlayCards(choices: UpgradeOverlayChoice[]): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const panelWidth = Math.min(width - 48, 720);
    const panelHeight = Math.min(height - 48, 560);
    const panelX = centerX - panelWidth / 2;
    const panelY = Math.max(56, height / 2 - panelHeight / 2);
    const cardX = panelX + 28;
    const cardWidth = panelWidth - 56;
    const cardHeight = 54;

    this.upgradeOverlayGraphics.clear();
    this.upgradeOverlayGraphics.fillStyle(0x02040a, 0.76);
    this.upgradeOverlayGraphics.fillRect(0, 0, width, height);
    this.upgradeOverlayGraphics.fillStyle(0x071018, 0.95);
    this.upgradeOverlayGraphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    this.upgradeOverlayGraphics.lineStyle(2, 0x42f5d7, 0.75);
    this.upgradeOverlayGraphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    for (let i = 0; i < UPGRADE_OVERLAY_CHOICE_COUNT; i += 1) {
      const choice = choices[i];
      const cardY = panelY + 118 + i * (cardHeight + 8);
      const accentColor = choice && choice.category !== 'secondary-weapon' ? this.getUpgradeRarityColor(choice.rarity) : 0x42f5d7;
      const hitZone = this.upgradeOverlayChoiceHitZones[i];

      this.upgradeOverlayGraphics.fillStyle(0x111a24, choice ? 0.94 : 0.42);
      this.upgradeOverlayGraphics.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 6);
      this.upgradeOverlayGraphics.fillStyle(accentColor, choice ? 0.9 : 0.2);
      this.upgradeOverlayGraphics.fillRoundedRect(cardX, cardY, 5, cardHeight, 3);
      this.upgradeOverlayGraphics.lineStyle(1, choice ? accentColor : 0x52627f, choice ? 0.72 : 0.28);
      this.upgradeOverlayGraphics.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 6);

      hitZone.setPosition(cardX, cardY).setSize(cardWidth, cardHeight).setVisible(Boolean(choice));
      if (choice && this.isUpgradeOverlayOpen) {
        hitZone.setInteractive({ useHandCursor: true });
      } else {
        hitZone.disableInteractive();
      }
    }

    for (const text of [...this.upgradeOverlayChoiceTexts, ...this.upgradeOverlayChoiceMetaTexts, this.upgradeOverlayPromptText]) {
      text.setVisible(this.isUpgradeOverlayOpen);
    }
  }

  private getUpgradeRarityColor(rarity: UpgradeDefinition['rarity']): number {
    switch (rarity) {
      case 'common':
        return 0xa8c7ff;
      case 'uncommon':
        return 0x42f5d7;
      case 'rare':
        return 0xffc857;
      case 'epic':
        return 0xb88cff;
      default:
        return 0xf2fbff;
    }
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
    strafeRight: boolean,
    useWorldRelativeThrusters: boolean
  ): void {
    const shipForward = this.getForwardDirection(this.player.rotation);
    const shipRight = new Phaser.Math.Vector2(-shipForward.y, shipForward.x);
    const forward = useWorldRelativeThrusters ? new Phaser.Math.Vector2(0, -1) : shipForward;
    const right = useWorldRelativeThrusters ? new Phaser.Math.Vector2(1, 0) : shipRight;
    const visualScale = this.selectedShipId === 'bulwark' ? 0.52 : 1;

    if (thrustForward && time >= this.nextForwardThrusterAt) {
      this.emitThrusterParticle({ x: -13, y: 42 }, forward.clone().negate(), 1.45 * visualScale, forward, right);
      this.emitThrusterParticle({ x: 13, y: 42 }, forward.clone().negate(), 1.45 * visualScale, forward, right);
      this.nextForwardThrusterAt = time + FORWARD_THRUSTER_INTERVAL_MS;
    }

    if (thrustReverse && time >= this.nextReverseThrusterAt) {
      this.emitThrusterParticle({ x: -11, y: -37 }, forward, 0.95 * visualScale, forward, right);
      this.emitThrusterParticle({ x: 11, y: -37 }, forward, 0.95 * visualScale, forward, right);
      this.nextReverseThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeLeft && time >= this.nextLeftStrafeThrusterAt) {
      this.emitThrusterParticle({ x: 38, y: 2 }, right, 0.8 * visualScale, forward, right);
      this.nextLeftStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeRight && time >= this.nextRightStrafeThrusterAt) {
      this.emitThrusterParticle({ x: -38, y: 2 }, right.clone().negate(), 0.8 * visualScale, forward, right);
      this.nextRightStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }
  }

  private emitRammingShieldDashBurst(direction: Phaser.Math.Vector2, time: number): void {
    if (!this.player) {
      return;
    }

    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(-forward.y, forward.x);
    const exhaustDirection = direction.clone().negate();
    const rearOffset = this.selectedShipId === 'bulwark' ? 47 : 39;
    const burstCount = this.selectedShipId === 'bulwark' ? 18 : 10;
    const intensity = this.selectedShipId === 'bulwark' ? 1.55 : 1.05;

    for (let index = 0; index < burstCount; index += 1) {
      const localX = Phaser.Math.FloatBetween(-18, 18);
      const offset = this.getShipLocalOffset(localX, rearOffset, forward, right);
      const startX = this.player.x + offset.x;
      const startY = this.player.y + offset.y;
      const spread = right.clone().scale(Phaser.Math.FloatBetween(-18, 18));
      const travel = Phaser.Math.FloatBetween(36, 78) * intensity;
      const particle = this.add.circle(
        startX,
        startY,
        Phaser.Math.FloatBetween(3.2, 7.2) * intensity,
        index % 3 === 0 ? 0xf2fbff : 0x42f5d7,
        Phaser.Math.FloatBetween(0.58, 0.88)
      );

      particle.setDepth(9);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: particle,
        x: startX + exhaustDirection.x * travel + spread.x,
        y: startY + exhaustDirection.y * travel + spread.y,
        alpha: 0,
        scale: 0.12,
        duration: Phaser.Math.Between(170, 260),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    const noseOffset = this.getShipLocalOffset(0, -54, forward, right);
    const flash = this.add.circle(this.player.x + noseOffset.x, this.player.y + noseOffset.y, 22 * intensity, 0x73f2ff, 0.32);
    flash.setDepth(12);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.1,
      duration: Math.max(120, this.getRammingShieldStats().dashEmpoweredWindowSeconds * 70),
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });
  }

  private emitThrusterParticle(
    localOffset: { x: number; y: number },
    exhaustDirection: Phaser.Math.Vector2,
    intensity: number,
    forward: Phaser.Math.Vector2,
    right: Phaser.Math.Vector2
  ): void {
    const offset = this.getShipLocalOffset(localOffset.x, localOffset.y, forward, right);
    const jitter = Phaser.Math.FloatBetween(-4.4, 4.4) * intensity;
    const startX = this.player.x + offset.x + right.x * jitter;
    const startY = this.player.y + offset.y + right.y * jitter;
    const color = Phaser.Math.Between(0, 4) === 0 ? 0xf2fbff : Phaser.Math.Between(0, 1) === 0 ? 0x73f2ff : 0x42f5d7;
    const particle = this.add.circle(startX, startY, Phaser.Math.FloatBetween(3.6, 7.4) * intensity, color, 0.86);
    const spread = right.clone().scale(Phaser.Math.FloatBetween(-6, 6) * intensity);
    const travel = Phaser.Math.FloatBetween(24, 44) * intensity;

    particle.setDepth(7);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: particle,
      x: startX + exhaustDirection.x * travel + spread.x,
      y: startY + exhaustDirection.y * travel + spread.y,
      alpha: 0,
      scale: 0.14,
      duration: THRUSTER_FADE_MS + Phaser.Math.Between(45, 95),
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

  private startRammingShieldDashBurst(direction: Phaser.Math.Vector2, impulse: number): void {
    this.rammingShieldDashBurstDirection.copy(direction);
    this.rammingShieldDashBurstRemaining = RAMMING_SHIELD_DASH_BURST_DISTANCE;
    this.rammingShieldDashBurstSpeed = RAMMING_SHIELD_DASH_BURST_DISTANCE / RAMMING_SHIELD_DASH_BURST_DURATION_SECONDS;
    this.rammingShieldDashPendingImpulse = impulse;
  }

  private updateRammingShieldDashBurstMovement(deltaSeconds: number): void {
    if (this.rammingShieldDashBurstRemaining <= 0 || deltaSeconds <= 0) {
      return;
    }

    const travel = Math.min(this.rammingShieldDashBurstRemaining, this.rammingShieldDashBurstSpeed * deltaSeconds);
    this.player.x += this.rammingShieldDashBurstDirection.x * travel;
    this.player.y += this.rammingShieldDashBurstDirection.y * travel;
    this.rammingShieldDashBurstRemaining = Math.max(0, this.rammingShieldDashBurstRemaining - travel);

    if (this.rammingShieldDashBurstRemaining <= 0) {
      this.playerVelocity.x += this.rammingShieldDashBurstDirection.x * this.rammingShieldDashPendingImpulse;
      this.playerVelocity.y += this.rammingShieldDashBurstDirection.y * this.rammingShieldDashPendingImpulse;
      this.clearRammingShieldDashBurst();
    }
  }

  private clearRammingShieldDashBurst(): void {
    this.rammingShieldDashBurstRemaining = 0;
    this.rammingShieldDashBurstSpeed = 0;
    this.rammingShieldDashPendingImpulse = 0;
    this.rammingShieldDashBurstDirection.set(0, 0);
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

    updateRammingShieldRuntime(this.rammingShieldState, this.getRammingShieldStats(), time, deltaSeconds);
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
    const playerHitRadius = this.getPlayerCollisionRadius();
    for (const enemy of this.liveEnemies) {
      const shieldCollision = this.getRammingShieldCircleCollision(
        enemy.body.x,
        enemy.body.y,
        enemy.definition.stats.radius
      );
      if (shieldCollision) {
        return {
          enemy,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: enemy.definition.stats.contactDamage * enemy.damageMultiplier,
          mass: enemy.definition.stats.mass ?? 1,
          hitRammingShield: true
        };
      }

      const collision = getCircleCollision(
        this.arena,
        { x: enemy.body.x, y: enemy.body.y, radius: enemy.definition.stats.radius },
        { x: this.player.x, y: this.player.y, radius: playerHitRadius }
      );
      if (collision) {
        return {
          enemy,
          normal: collision.normal,
          penetration: collision.penetration,
          damage: enemy.definition.stats.contactDamage * enemy.damageMultiplier,
          mass: enemy.definition.stats.mass ?? 1
        };
      }
    }

    for (const enemy of this.basicEnemies) {
      const shieldCollision = this.getRammingShieldCircleCollision(
        enemy.body.x,
        enemy.body.y,
        Math.max(this.getEnemyCollisionHalfWidth(enemy), this.getEnemyCollisionHalfLength(enemy))
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

      const collision = this.getEnemyCapsulePlayerCollision(enemy, playerHitRadius);
      if (collision) {
        return {
          enemy,
          normal: collision.normal,
          penetration: collision.penetration,
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass
        };
      }
    }

    for (const enemy of this.shooterEnemies) {
      const shieldCollision = this.getRammingShieldCircleCollision(
        enemy.body.x,
        enemy.body.y,
        Math.max(this.getEnemyCollisionHalfWidth(enemy), this.getEnemyCollisionHalfLength(enemy))
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

      const collision = this.getEnemyCapsulePlayerCollision(enemy, playerHitRadius);
      if (collision) {
        return {
          enemy,
          normal: collision.normal,
          penetration: collision.penetration,
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass
        };
      }
    }

    for (const enemy of this.tankEnemies) {
      const shieldCollision = this.getRammingShieldCircleCollision(
        enemy.body.x,
        enemy.body.y,
        Math.max(this.getEnemyCollisionHalfWidth(enemy), this.getEnemyCollisionHalfLength(enemy))
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

      const collision = this.getEnemyCapsulePlayerCollision(enemy, playerHitRadius);
      if (collision) {
        return {
          enemy,
          normal: collision.normal,
          penetration: collision.penetration,
          damage: enemy.stats.contactDamage,
          mass: enemy.stats.mass
        };
      }
    }

    return undefined;
  }

  private getEnemyCapsulePlayerCollision(
    enemy: BasicEnemy | ShooterEnemy | TankEnemy,
    playerRadius: number
  ): { normal: Phaser.Math.Vector2; penetration: number } | undefined {
    const enemyForward = this.getForwardDirection(enemy.body.rotation);
    const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);
    const collision = getCapsuleCircleCollision(
      this.arena,
      {
        x: enemy.body.x,
        y: enemy.body.y,
        right: enemyRight,
        forward: enemyForward,
        halfWidth: this.getEnemyCollisionHalfWidth(enemy),
        halfLength: this.getEnemyCollisionHalfLength(enemy)
      },
      {
        x: this.player.x,
        y: this.player.y,
        radius: playerRadius
      }
    );

    if (!collision) {
      return undefined;
    }

    return {
      normal: collision.normal.clone().scale(-1),
      penetration: collision.penetration
    };
  }

  private getAsteroidContact(): PlayerAsteroidContact | undefined {
    const playerHitRadius = this.getPlayerCollisionRadius();

    for (const asteroid of this.basicAsteroids) {
      const asteroidRadius = this.getAsteroidCollisionRadius(asteroid);
      const shieldCollision = this.getRammingShieldCircleCollision(asteroid.body.x, asteroid.body.y, asteroidRadius);
      if (shieldCollision) {
        return {
          asteroid,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: ASTEROID_CONTACT_DAMAGE_BY_TIER[asteroid.tier],
          hitRammingShield: true
        };
      }

      const collision = getCircleCollision(
        this.arena,
        { x: this.player.x, y: this.player.y, radius: playerHitRadius },
        { x: asteroid.body.x, y: asteroid.body.y, radius: asteroidRadius }
      );
      if (collision) {
        return {
          asteroid,
          normal: collision.normal,
          penetration: collision.penetration,
          damage: ASTEROID_CONTACT_DAMAGE_BY_TIER[asteroid.tier]
        };
      }
    }

    return undefined;
  }

  private getDebrisContact(): PlayerDebrisContact | undefined {
    const playerHitRadius = this.getPlayerCollisionRadius();

    for (const debris of this.enemyWreckageDebris) {
      const debrisRadius = this.getDebrisCollisionRadius(debris);
      const shieldCollision = this.getRammingShieldCircleCollision(debris.body.x, debris.body.y, debrisRadius);
      if (shieldCollision) {
        return {
          debris,
          normal: shieldCollision.normal,
          penetration: shieldCollision.penetration,
          damage: debris.damage,
          hitRammingShield: true
        };
      }

      const collision = getCircleCollision(
        this.arena,
        { x: this.player.x, y: this.player.y, radius: playerHitRadius },
        { x: debris.body.x, y: debris.body.y, radius: debrisRadius }
      );
      if (collision) {
        return {
          debris,
          normal: collision.normal,
          penetration: collision.penetration,
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

    return getRammingShieldColliderData(
      {
        playerX: this.player.x,
        playerY: this.player.y,
        arenaWidth: this.arena.width,
        arenaHeight: this.arena.height,
        areaScale,
        colliderDepth: RAMMING_SHIELD_COLLIDER_DEPTH,
        forward,
        right
      },
      this.getRammingShieldStats()
    );
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
      arenaWidth: this.arena.width,
      arenaHeight: this.arena.height,
      targetX,
      targetY,
      targetRadius,
    });

    if (!collision) {
      return undefined;
    }

    return {
      normal: new Phaser.Math.Vector2(collision.normalX, collision.normalY),
      penetration: collision.penetration
    };
  }

  private resolvePlayerEnemyContact(contact: PlayerEnemyContact, time: number): void {
    const impactDamage = this.getPlayerEnemyImpactDamage(contact);
    this.applyPlayerEnemyKnockback(contact, time);
    if (contact.hitRammingShield) {
      this.applyRammingShieldImpact(contact.enemy.body, time, () => this.damageRammedEnemy(contact.enemy, time));
      this.blockDamageWithRammingShield(impactDamage, time, contact.enemy.body.x, contact.enemy.body.y);
      return;
    }

    this.applyPlayerBodyImpactDamageToEnemy(contact.enemy, contact.normal, time);

    if (impactDamage > 0 && time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitShipCollisionImpactExplosion(impact.x, impact.y);
      this.damagePlayer(impactDamage, time, impact.x, impact.y, { source: 'enemy' });
    }
  }

  private resolvePlayerAsteroidContact(contact: PlayerAsteroidContact, time: number): void {
    const impactDamage = this.getPlayerAsteroidImpactDamage(contact);
    this.applyPlayerAsteroidKnockback(contact, time);
    if (contact.hitRammingShield) {
      this.applyRammingShieldImpact(contact.asteroid.body, time, () => this.damageRammedAsteroid(contact.asteroid, time));
      this.blockDamageWithRammingShield(impactDamage, time, contact.asteroid.body.x, contact.asteroid.body.y);
      return;
    }

    this.applyPlayerBodyImpactDamageToAsteroid(contact.asteroid, contact.normal, time);

    if (impactDamage > 0 && time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitAsteroidImpactExplosion(impact.x, impact.y, contact.asteroid.tier);
      this.damagePlayer(impactDamage, time, impact.x, impact.y, { source: 'asteroid' });
    }
  }

  private resolvePlayerDebrisContact(contact: PlayerDebrisContact, time: number): void {
    const impactDamage = this.getPlayerDebrisImpactDamage(contact);
    this.applyPlayerDebrisKnockback(contact, time);
    if (contact.hitRammingShield) {
      this.applyRammingShieldImpact(contact.debris.body, time, () => this.damageRammedDebris(contact.debris, time));
      this.blockDamageWithRammingShield(impactDamage, time, contact.debris.body.x, contact.debris.body.y);
      return;
    }

    this.applyPlayerBodyImpactDamageToDebris(contact.debris, contact.normal, time);

    if (impactDamage > 0 && time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitShipCollisionImpactExplosion(impact.x, impact.y);
      this.damagePlayer(impactDamage, time, impact.x, impact.y, { source: 'debris' });
    }
  }

  private applyRammingShieldImpact(
    target: Phaser.GameObjects.GameObject,
    time: number,
    damageTarget: () => void
  ): void {
    if (this.hasRammingShield() && this.rammingShieldState.hp > 0 && canApplyRammingShieldDamage(this.rammingShieldState, target, time)) {
      damageTarget();
      markRammingShieldDamageApplied(this.rammingShieldState, this.getRammingShieldStats(), target, time);
    }
  }

  private getPlayerEnemyImpactDamage(contact: PlayerEnemyContact): number {
    return this.getPlayerContactImpactDamage(contact.damage, contact.mass, this.getEnemyContactVelocity(contact.enemy), contact.normal);
  }

  private getPlayerAsteroidImpactDamage(contact: PlayerAsteroidContact): number {
    return this.getPlayerContactImpactDamage(
      contact.damage,
      this.getAsteroidMass(contact.asteroid.tier),
      contact.asteroid.velocity,
      contact.normal
    );
  }

  private getPlayerDebrisImpactDamage(contact: PlayerDebrisContact): number {
    return this.getPlayerContactImpactDamage(contact.damage, contact.debris.mass, contact.debris.velocity, contact.normal);
  }

  private getPlayerContactImpactDamage(
    legacyDamage: number,
    targetMass: number,
    targetVelocity: Phaser.Math.Vector2,
    normal: Phaser.Math.Vector2
  ): number {
    const relativeVelocity = getRelativeVelocity(this.playerVelocity, targetVelocity);
    const closingSpeed = getClosingSpeed(relativeVelocity, normal);

    return this.calculatePhysicalImpactDamage({
      source: this.getImpactSourceFromLegacyDamage(legacyDamage),
      baseDamage: 0,
      attackerMass: targetMass,
      targetMass: this.getPlayerMass(),
      impactSpeed: closingSpeed
    });
  }

  private getImpactSourceFromLegacyDamage(legacyDamage: number): DebugImpactSourceType {
    if (legacyDamage === ENEMY_WRECKAGE_DEBRIS_CONTACT_DAMAGE) {
      return 'debris';
    }

    if (Object.values(ASTEROID_CONTACT_DAMAGE_BY_TIER).includes(legacyDamage)) {
      return 'asteroid';
    }

    return 'enemy';
  }

  private calculatePhysicalImpactDamage(input: {
    source: DebugImpactSourceType;
    baseDamage: number;
    attackerMass: number;
    targetMass: number;
    impactSpeed: number;
    fallbackMaxDamage?: number;
  }): number {
    return calculateImpactDamage({
      baseDamage: input.baseDamage,
      attackerMass: input.attackerMass,
      targetMass: input.targetMass,
      impactSpeed: input.impactSpeed,
      minImpactSpeed: IMPACT_MIN_DAMAGE_SPEED_BY_SOURCE[input.source],
      speedDamageScale: this.debugState.impactDamageScales[input.source],
      massDamageScale: IMPACT_MASS_DAMAGE_SCALE_BY_SOURCE[input.source],
      minDamage: 0,
      maxDamage: Math.min(
        this.debugState.globalImpactDamageCap,
        this.debugState.impactDamageCaps[input.source],
        input.fallbackMaxDamage ?? Number.MAX_SAFE_INTEGER
      )
    });
  }

  private getPlayerBodyImpactDamage(targetMass: number, targetVelocity: Phaser.Math.Vector2, normal: Phaser.Math.Vector2): number {
    const relativeVelocity = getRelativeVelocity(this.playerVelocity, targetVelocity);
    const closingSpeed = getClosingSpeed(relativeVelocity, normal);

    return this.calculatePhysicalImpactDamage({
      source: 'player',
      baseDamage: 0,
      attackerMass: this.getPlayerMass(),
      targetMass,
      impactSpeed: closingSpeed
    });
  }

  private canApplyPlayerBodyImpactDamage(target: object, time: number): boolean {
    return time >= (this.playerBodyImpactCooldowns.get(target) ?? 0);
  }

  private markPlayerBodyImpactDamageApplied(target: object, time: number): void {
    this.playerBodyImpactCooldowns.set(target, time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS);
  }

  private applyPlayerBodyImpactDamageToEnemy(enemy: AnyGameEnemy, normal: Phaser.Math.Vector2, time: number): void {
    if (!this.canApplyPlayerBodyImpactDamage(enemy.body, time)) {
      return;
    }

    const enemyMass = this.isLiveEnemy(enemy) ? enemy.definition.stats.mass ?? 1 : enemy.stats.mass;
    const damage = this.getPlayerBodyImpactDamage(enemyMass, this.getEnemyTotalVelocity(enemy), normal);
    this.markPlayerBodyImpactDamageApplied(enemy.body, time);
    if (damage <= 0) {
      return;
    }

    this.damageEnemy(enemy, damage, 'player', true);
    this.emitShipCollisionImpactExplosion(enemy.body.x, enemy.body.y);
    this.resolveEnemyDestroyedByPhysicalImpact(enemy);
  }

  private applyPlayerBodyImpactDamageToAsteroid(asteroid: BasicAsteroid, normal: Phaser.Math.Vector2, time: number): void {
    if (!this.canApplyPlayerBodyImpactDamage(asteroid.body, time)) {
      return;
    }

    const damage = this.getPlayerBodyImpactDamage(this.getAsteroidMass(asteroid.tier), asteroid.velocity, normal);
    this.markPlayerBodyImpactDamageApplied(asteroid.body, time);
    if (damage <= 0) {
      return;
    }

    this.damageAsteroid(asteroid, damage, 'player', true);
    this.emitAsteroidImpactExplosion(asteroid.body.x, asteroid.body.y, asteroid.tier);
    const index = this.basicAsteroids.indexOf(asteroid);
    if (asteroid.hp <= 0 && index >= 0) {
      this.destroyBasicAsteroid(index);
    } else {
      this.flashDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
    }
  }

  private applyPlayerBodyImpactDamageToDebris(debris: EnemyWreckageDebris, normal: Phaser.Math.Vector2, time: number): void {
    if (!this.canApplyPlayerBodyImpactDamage(debris.body, time)) {
      return;
    }

    const damage = this.getPlayerBodyImpactDamage(debris.mass, debris.velocity, normal);
    this.markPlayerBodyImpactDamageApplied(debris.body, time);
    if (damage <= 0) {
      return;
    }

    this.damageDebris(debris, damage, 'player', true);
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

  private damageAsteroidFromPhysicalImpact(
    asteroid: BasicAsteroid,
    damage: number,
    source: DamageFeedbackSource = 'environment'
  ): void {
    this.damageAsteroid(asteroid, damage, source, false);
    const index = this.basicAsteroids.indexOf(asteroid);
    if (asteroid.hp <= 0 && index >= 0) {
      this.destroyBasicAsteroid(index);
    } else if (index >= 0) {
      this.flashDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
    }
  }

  private damageDebrisFromPhysicalImpact(
    debris: EnemyWreckageDebris,
    damage: number,
    source: DamageFeedbackSource = 'environment'
  ): void {
    this.damageDebris(debris, damage, source, false);
    const index = this.enemyWreckageDebris.indexOf(debris);
    if (debris.hp <= 0 && index >= 0) {
      this.spawnScrapPickup('debris', SCRAP_PICKUP_VALUE_FROM_DEBRIS, debris.body.x, debris.body.y, debris.velocity);
      this.destroyEnemyWreckageDebris(debris, true);
      this.enemyWreckageDebris.splice(index, 1);
    } else if (index >= 0) {
      this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
    }
  }

  private getRammingShieldDamage(targetVelocity: Phaser.Math.Vector2, targetMass: number, time = this.time.now): number {
    const stats = this.getRammingShieldStats();
    const activeMultiplier = this.rammingShieldState.hp > 0 ? 1 : stats.brokenDamageMultiplier;
    const dashMultiplier = time < this.rammingShieldState.empoweredUntil ? stats.dashRamDamageMultiplier : 1;
    const playerStats = this.getResolvedPlayerStats();
    const impactDamage = calculateImpactDamage({
      baseDamage: stats.baseDamage,
      attackerMass: playerStats.mass,
      targetMass,
      impactSpeed: getRelativeSpeed(this.playerVelocity, targetVelocity),
      minImpactSpeed: stats.strongRamSpeed,
      speedDamageScale: stats.speedDamageMultiplier,
      massDamageScale: RAMMING_SHIELD_IMPACT_MASS_DAMAGE_SCALE,
      minDamage: 0,
      maxDamage: stats.maxDamage
    });

    return this.rollPlayerDamage(impactDamage * activeMultiplier * dashMultiplier * playerStats.damage);
  }

  private damageEnemy(
    enemy: AnyGameEnemy,
    damage: number,
    source: DamageFeedbackSource = 'environment',
    revealHealthBar = false
  ): number {
    if (this.isLiveEnemy(enemy)) {
      return this.damageLiveEnemy(enemy, damage, source, revealHealthBar);
    }

    if (damage <= 0) {
      return 0;
    }

    const appliedDamage = Math.max(1, Math.round(damage - enemy.stats.defense));
    enemy.hp -= appliedDamage;
    this.emitDamageFeedback(enemy, enemy.body, enemy.hp, enemy.stats.maxHull, this.getEnemyHitRadius(enemy), appliedDamage, source, revealHealthBar);
    return appliedDamage;
  }

  private damageLiveEnemy(
    enemy: LiveGameEnemy,
    damage: number,
    source: DamageFeedbackSource = 'environment',
    revealHealthBar = false
  ): number {
    if (damage <= 0) {
      return 0;
    }

    const appliedDamage = Math.max(1, Math.round(damage));
    enemy.hp -= appliedDamage;
    this.emitDamageFeedback(enemy, enemy.body, enemy.hp, enemy.maxHp, enemy.definition.stats.radius, appliedDamage, source, revealHealthBar);
    return appliedDamage;
  }

  private damageAsteroid(
    asteroid: BasicAsteroid,
    damage: number,
    source: DamageFeedbackSource = 'environment',
    revealHealthBar = false
  ): number {
    const appliedDamage = Math.max(0, Math.round(damage));
    asteroid.hp -= appliedDamage;
    this.emitDamageFeedback(
      asteroid,
      asteroid.body,
      asteroid.hp,
      ASTEROID_TIER_CONFIG[asteroid.tier].hp,
      asteroid.hitRadius,
      appliedDamage,
      source,
      revealHealthBar
    );
    return appliedDamage;
  }

  private damageDebris(
    debris: EnemyWreckageDebris,
    damage: number,
    source: DamageFeedbackSource = 'environment',
    revealHealthBar = false
  ): number {
    const appliedDamage = Math.max(0, Math.round(damage));
    debris.hp -= appliedDamage;
    this.emitDamageFeedback(debris, debris.body, debris.hp, ENEMY_WRECKAGE_DEBRIS_HP, debris.hitRadius, appliedDamage, source, revealHealthBar);
    return appliedDamage;
  }

  private getCombatFeedbackSnapshot(): CombatFeedbackSnapshot {
    return {
      player: this.player,
      isPlayerDead: this.isPlayerDead,
      playerHull: this.playerHull,
      playerMaxHull: this.getPlayerMaxHull(),
      playerHitRadius: this.getPlayerHitRadius(),
      enemies: this.getAllEnemies(),
      asteroids: this.basicAsteroids,
      debris: this.enemyWreckageDebris
    };
  }

  private emitDamageFeedback(
    owner: object,
    body: Phaser.GameObjects.Container,
    hp: number,
    maxHp: number,
    radius: number,
    damage: number,
    source: DamageFeedbackSource,
    revealHealthBar: boolean
  ): void {
    this.combatFeedback.emitDamageFeedback(owner, body, hp, maxHp, radius, damage, source, revealHealthBar);
  }

  private emitFloatingDamageNumber(x: number, y: number, damage: number, source: DamageFeedbackSource): void {
    this.combatFeedback.emitFloatingDamageNumber(x, y, damage, source);
  }

  private resolveEnemyDestroyedByPhysicalImpact(enemy: AnyGameEnemy): void {
    if (enemy.hp > 0) {
      this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
      return;
    }

    if (this.isLiveEnemy(enemy)) {
      const liveIndex = this.liveEnemies.indexOf(enemy);
      if (liveIndex >= 0) {
        this.destroyLiveEnemyWithRewards(enemy, liveIndex);
      }
      return;
    }

    const basicIndex = this.basicEnemies.indexOf(enemy as BasicEnemy);
    if (basicIndex >= 0) {
      this.destroyEnemyWithRewards(enemy as BasicEnemy, this.basicEnemies, basicIndex, 'chaser');
      return;
    }

    const tankIndex = this.tankEnemies.indexOf(enemy as TankEnemy);
    if (tankIndex >= 0) {
      this.destroyEnemyWithRewards(enemy as TankEnemy, this.tankEnemies, tankIndex, 'tank');
      return;
    }

    const shooterIndex = this.shooterEnemies.indexOf(enemy as ShooterEnemy);
    if (shooterIndex >= 0) {
      this.destroyEnemyWithRewards(enemy as ShooterEnemy, this.shooterEnemies, shooterIndex, 'shooter');
    }
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

    damageRammingShield(this.rammingShieldState, this.getRammingShieldStats(), damage, time);
    this.isPulseEmergencyCharged = this.getRunUpgradeLevelById('pulse_emergency_discharge') > 0;
    this.rammingShieldState.nextBlockDamageAt = time + this.getPlayerDamageInvulnerabilityMs();
    this.updateRammingShieldVisual(time);
    this.emitFloatingDamageNumber(impactX, impactY, damage, 'shield');
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

  private damageRammedEnemy(enemy: AnyGameEnemy, time: number): void {
    const enemyMass = this.isLiveEnemy(enemy) ? enemy.definition.stats.mass ?? 1 : enemy.stats.mass;
    const damage = this.getRammingShieldDamage(this.getEnemyTotalVelocity(enemy), enemyMass, time);
    if (damage <= 0) {
      return;
    }

    this.damageEnemy(enemy, damage, 'shield', true);
    this.emitShipCollisionImpactExplosion(enemy.body.x, enemy.body.y);

    if (this.isLiveEnemy(enemy)) {
      const liveIndex = this.liveEnemies.indexOf(enemy);
      if (enemy.hp <= 0 && liveIndex >= 0) {
        this.destroyLiveEnemyWithRewards(enemy, liveIndex);
      } else {
        this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
      }
      return;
    }

    const basicIndex = this.basicEnemies.indexOf(enemy as BasicEnemy);
    if (basicIndex >= 0) {
      if (enemy.hp <= 0) {
        this.destroyEnemyWithRewards(enemy as BasicEnemy, this.basicEnemies, basicIndex, 'chaser');
      } else {
        this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
      }

      return;
    }

    const tankIndex = this.tankEnemies.indexOf(enemy as TankEnemy);
    if (tankIndex >= 0) {
      const tank = enemy as TankEnemy;
      if (tank.hp <= 0) {
        this.destroyEnemyWithRewards(tank, this.tankEnemies, tankIndex, 'tank');
      } else {
        this.flashDamageSprites(tank.body, tank.wrapMirrorBody);
      }

      return;
    }

    const shooterIndex = this.shooterEnemies.indexOf(enemy as ShooterEnemy);
    if (shooterIndex >= 0) {
      const shooter = enemy as ShooterEnemy;
      if (shooter.hp <= 0) {
        this.destroyEnemyWithRewards(shooter, this.shooterEnemies, shooterIndex, 'shooter');
      } else {
        this.flashDamageSprites(shooter.body, shooter.wrapMirrorBody);
      }
    }
  }

  private damageRammedDebris(debris: EnemyWreckageDebris, time: number): void {
    const damage = this.getRammingShieldDamage(debris.velocity, debris.mass, time);
    if (damage <= 0) {
      return;
    }

    this.damageDebris(debris, damage, 'shield', true);
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
    const damage = this.getRammingShieldDamage(asteroid.velocity, this.getAsteroidMass(asteroid.tier), time);
    if (damage <= 0) {
      return;
    }

    this.damageAsteroid(asteroid, damage, 'shield', true);
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
    asteroid.velocity.limit(this.getGlobalMaxSpeed());
  }

  private getEnemyContactVelocity(enemy: AnyGameEnemy): Phaser.Math.Vector2 {
    return enemy.velocity.clone().add(enemy.knockbackVelocity);
  }

  private getEnemyTotalVelocity(enemy: AnyGameEnemy): Phaser.Math.Vector2 {
    return this.getEnemyContactVelocity(enemy).add(enemy.blackHoleVelocity);
  }

  private getLiveEnemyTotalVelocity(enemy: LiveGameEnemy): Phaser.Math.Vector2 {
    return enemy.velocity.clone().add(enemy.knockbackVelocity).add(enemy.blackHoleVelocity);
  }

  private applyPlayerEnemyKnockback(contact: PlayerEnemyContact, time: number): void {
    const normal = contact.normal;
    const playerMass = this.getPlayerMass();
    const playerShare = getMassResponseShare(contact.mass, playerMass);
    const enemyShare = getMassResponseShare(playerMass, contact.mass);
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * playerShare);
    this.nudgeWrappedObject(contact.enemy.body, normal, -separation * enemyShare);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    applyCollisionImpulse({
      normal,
      firstVelocity: this.playerVelocity,
      secondVelocity: contact.enemy.knockbackVelocity,
      firstMass: playerMass,
      secondMass: contact.mass,
      minImpulse: PLAYER_CONTACT_MIN_IMPULSE,
      maxImpulse: PLAYER_CONTACT_MAX_IMPULSE,
      relativeSpeedScale: PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
      secondMaxSpeed: this.getGlobalMaxSpeed(),
      restitution: ENEMY_CONTACT_RESTITUTION_SHARE,
      relativeVelocity: getRelativeVelocity(this.playerVelocity, this.getEnemyContactVelocity(contact.enemy))
    });
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private applyPlayerAsteroidKnockback(contact: PlayerAsteroidContact, time: number): void {
    const normal = contact.normal;
    const asteroidMass = this.getAsteroidMass(contact.asteroid.tier);
    const playerMass = this.getPlayerMass();
    const playerShare = getMassResponseShare(asteroidMass, playerMass);
    const asteroidShare = getMassResponseShare(playerMass, asteroidMass);
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * playerShare);
    this.nudgeWrappedObject(contact.asteroid.body, normal, -separation * asteroidShare);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    applyCollisionImpulse({
      normal,
      firstVelocity: this.playerVelocity,
      secondVelocity: contact.asteroid.velocity,
      firstMass: playerMass,
      secondMass: asteroidMass,
      minImpulse: PLAYER_CONTACT_MIN_IMPULSE,
      maxImpulse: PLAYER_CONTACT_MAX_IMPULSE,
      relativeSpeedScale: PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
      secondMaxSpeed: this.getGlobalMaxSpeed()
    });
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private applyPlayerDebrisKnockback(contact: PlayerDebrisContact, time: number): void {
    const normal = contact.normal;
    const playerMass = this.getPlayerMass();
    const playerShare = getMassResponseShare(contact.debris.mass, playerMass);
    const debrisShare = getMassResponseShare(playerMass, contact.debris.mass);
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * playerShare);
    this.nudgeWrappedObject(contact.debris.body, normal, -separation * debrisShare);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    applyCollisionImpulse({
      normal,
      firstVelocity: this.playerVelocity,
      secondVelocity: contact.debris.velocity,
      firstMass: playerMass,
      secondMass: contact.debris.mass,
      minImpulse: PLAYER_CONTACT_MIN_IMPULSE,
      maxImpulse: PLAYER_CONTACT_MAX_IMPULSE,
      relativeSpeedScale: PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
      secondMaxSpeed: this.getGlobalMaxSpeed()
    });
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private getAsteroidMass(tier: AsteroidTier): number {
    return ASTEROID_TIER_CONFIG[tier].massBudget;
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
    options: { bypassShield?: boolean; bypassDefense?: boolean; source?: DamageFeedbackSource } = {}
  ): void {
    if (this.debugState.playerInvulnerable) {
      this.playerInvulnerableUntil = Number.MAX_SAFE_INTEGER;
      return;
    }

    const hullDamage = options.bypassDefense
      ? Math.max(0, Math.round(damage))
      : Math.max(1, Math.round(damage - this.getResolvedPlayerStats().defense));
    this.playerInvulnerableUntil = time + this.getPlayerDamageInvulnerabilityMs();
    if (hullDamage <= 0) {
      this.updateGameplayHud(time);
      return;
    }

    this.playerHull = Math.max(0, this.playerHull - hullDamage);
    this.isPulseEmergencyCharged = this.getRunUpgradeLevelById('pulse_emergency_discharge') > 0;
    this.emitFloatingDamageNumber(impactX, impactY, hullDamage, options.source ?? 'enemy');
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

    this.playerXp += Math.max(1, Math.ceil(amount * this.getResolvedPlayerStats().growth));

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

  private emitPlayerDeathShards(): void {
    const ship = this.getSelectedShipDefinition();
    const position = this.getNearestWrappedRenderPosition(this.player.x, this.player.y);
    const flash = this.add.circle(position.x, position.y, 34, 0xfff2d2, 0.54);
    const ring = this.add.circle(position.x, position.y, 42, 0xffc857, 0);

    flash.setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
    ring.setStrokeStyle(3, 0xffc857, 0.85);
    ring.setDepth(13).setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.2,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 3.2,
      duration: 760,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    this.emitDeathShards(
      ship.textureKey,
      this.player.x,
      this.player.y,
      ship.displaySize,
      this.player.rotation + ship.visualRotation,
      this.playerVelocity,
      'player'
    );
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
    this.emitPlayerDeathShards();
    this.playerVelocity.set(0, 0);
    this.clearRammingShieldDashBurst();
    this.player.setVisible(false);
    this.playerSprite.setTint(0xff5964);
    this.playerSprite.setAlpha(0.62);
    if (this.isUpgradeOverlayOpen) {
      this.closeUpgradeOverlay(this.time.now);
    }
    if (this.isPauseMenuOpen) {
      this.closePauseMenu(this.time.now);
    }
    this.updateGameplayHud(this.time.now);
    this.showResultsScreen();
    this.autoRunDiagnostics.endRun('player-death');
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

    const elapsedSeconds = Math.max(0, Math.floor(this.lastRunSurvivalMs / 1000));

    this.resultsScreen = createResultsScreen({
      scene: this,
      survivalTimeLabel: this.formatSurvivalTime(elapsedSeconds),
      scrapCollected: this.lastRunScrapTotal,
      creditsEarned: this.lastRunCreditsEarned,
      totalCredits: this.totalCredits,
      scrapToCreditRate: SCRAP_TO_CREDIT_RATE,
      scrapCreditMultiplier: this.getScrapCreditMultiplier(),
      isActionActive: () => this.gameFlowState === 'results',
      resetCursor: () => this.resetUiCursor(),
      onRestartRun: () => this.startRun(),
      onMainMenu: () => this.showMainMenu(),
      onShop: () => this.showShop('results')
    });
    this.updateResultsButton();
    if (!this.debugMenuHost?.isCreated()) {
      this.createDebugMenu();
    }
  }

  private updateBasicEnemies(deltaSeconds: number): void {
    updateBasicEnemiesSystem({
      arena: this.arena,
      enemies: this.basicEnemies,
      playerX: this.player.x,
      playerY: this.player.y,
      time: this.time.now,
      deltaSeconds,
      getGlobalMaxSpeed: () => this.getGlobalMaxSpeed(),
      getEnemyMoveSpeed: (enemy) => this.getEnemyDebugMoveSpeed(enemy),
      steerEnemyVelocity: (enemy, targetVelocity, steerDeltaSeconds) =>
        this.steerEnemyVelocity(enemy, targetVelocity, steerDeltaSeconds),
      applyBlackHoleToEnemy: (enemy, index, blackHoleDeltaSeconds, time) =>
        this.applyBlackHoleToBasicEnemy(enemy, index, blackHoleDeltaSeconds, time),
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius)
    });
  }

  private updateLiveEnemies(time: number, deltaSeconds: number): void {
    updateLiveEnemyAiSystem({
      scene: this,
      arena: this.arena,
      enemies: this.liveEnemies,
      scrapPickups: this.getLiveEnemyScrapTargets(),
      playerX: this.player.x,
      playerY: this.player.y,
      playerVelocity: this.playerVelocity,
      time,
      deltaSeconds,
      isAiEnabled: !this.isPlayerDead,
      telegraphsEnabled: true,
      enemySpeedMultiplier: this.debugState.enemySpeedScale,
      enemyFireRateMultiplier: 1,
      enemyDeconflictionEnabled: true,
      enemyDeconflictionStrength: 1,
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius),
      applyWorldForcesToEnemy: (enemy, index, forceDeltaSeconds, forceTime) =>
        this.applyBlackHoleToLiveEnemy(enemy, index, forceDeltaSeconds, forceTime),
      fireEnemyProjectile: (request) => this.fireLiveEnemyProjectile(request),
      explodeAt: (x, y, radius, damage, sourceId) => this.explodeLiveEnemyAt(x, y, radius, damage, sourceId),
      spawnChild: (definitionId, x, y) => this.spawnLiveEnemy(definitionId, x, y, time),
      emitLabBurst: (x, y, color, count) => this.emitLiveEnemyBurst(x, y, color, count)
    });

    this.removeDeadLiveEnemies();
  }

  private removeDeadLiveEnemies(): void {
    for (let index = this.liveEnemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.liveEnemies[index];
      if (enemy.hp <= 0) {
        this.destroyLiveEnemyWithRewards(enemy, index);
      }
    }
  }

  private getLiveEnemyScrapTargets(): EnemyLabScrapTarget[] {
    return this.scrapPickups.map((pickup) => ({
      id: pickup.kind,
      x: pickup.body.x,
      y: pickup.body.y,
      collected: false
    }));
  }

  private fireLiveEnemyProjectile(request: EnemyLabProjectileRequest): void {
    const direction = request.direction.clone().normalize();
    const spawnX = wrapCoordinate(request.x, this.arena.width);
    const spawnY = wrapCoordinate(request.y, this.arena.height);
    const rotation = Math.atan2(direction.x, -direction.y);
    const body = this.createLiveEnemyProjectileBody(spawnX, spawnY, request.radius, request.color, rotation);
    const wrapMirrorBody = this.createLiveEnemyProjectileBody(spawnX, spawnY, request.radius, request.color, rotation);
    wrapMirrorBody.setVisible(false);

    this.enemyProjectiles.push({
      body,
      wrapMirrorBody,
      velocity: direction.scale(request.speed),
      speed: request.speed,
      damage: request.damage,
      hitRadius: request.radius,
      expiresAt: this.time.now + (request.range / Math.max(1, request.speed)) * 1000,
      distanceRemaining: request.range
    });
  }

  private createLiveEnemyProjectileBody(
    x: number,
    y: number,
    radius: number,
    color: number,
    rotation: number
  ): Phaser.GameObjects.Container {
    const glow = this.add.ellipse(0, 0, radius * 4.5, radius * 4.5, color, 0.24);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.ellipse(0, 0, radius * 1.1, radius * 2.2, color, 0.94);
    core.setStrokeStyle(1, 0xf2fbff, 0.75);
    const projectile = this.add.container(x, y, [glow, core]);
    projectile.setRotation(rotation);
    projectile.setDepth(8);
    return projectile;
  }

  private explodeLiveEnemyAt(x: number, y: number, radius: number, damage: number, sourceId: string): void {
    this.emitShipCollisionImpactExplosion(x, y);

    if (!this.isPlayerDead && this.getWrappedDirection(x, y, this.player.x, this.player.y).length() <= radius) {
      this.damagePlayer(damage, this.time.now, x, y, { source: 'enemy' });
    }

    for (const enemy of this.liveEnemies) {
      if (enemy.id === sourceId || enemy.hp <= 0) {
        continue;
      }

      if (this.getWrappedDirection(x, y, enemy.body.x, enemy.body.y).length() <= radius) {
        this.damageLiveEnemy(enemy, damage * 0.45, 'enemy', true);
      }
    }
  }

  private emitLiveEnemyBurst(x: number, y: number, color: number, count = 8): void {
    const position = this.getNearestWrappedRenderPosition(x, y);
    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(14, 46);
      const particle = this.add.circle(position.x, position.y, Phaser.Math.FloatBetween(2, 5), color, 0.72);
      particle.setDepth(12);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: particle,
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.16,
        duration: Phaser.Math.Between(170, 300),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private updateShooterEnemies(time: number, deltaSeconds: number): void {
    updateShooterEnemiesSystem({
      arena: this.arena,
      enemies: this.shooterEnemies,
      playerX: this.player.x,
      playerY: this.player.y,
      time,
      deltaSeconds,
      isPlayerDead: this.isPlayerDead,
      getGlobalMaxSpeed: () => this.getGlobalMaxSpeed(),
      getEnemyMoveSpeed: (enemy) => this.getEnemyDebugMoveSpeed(enemy),
      steerEnemyVelocity: (enemy, targetVelocity, steerDeltaSeconds) =>
        this.steerEnemyVelocity(enemy, targetVelocity, steerDeltaSeconds),
      applyBlackHoleToEnemy: (enemy, index, blackHoleDeltaSeconds, blackHoleTime) =>
        this.applyBlackHoleToShooterEnemy(enemy, index, blackHoleDeltaSeconds, blackHoleTime),
      fireShooterProjectile: (enemy, directionToPlayer, fireTime) =>
        this.fireShooterProjectile(enemy, directionToPlayer, fireTime),
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius)
    });
  }

  private updateTankEnemies(deltaSeconds: number): void {
    updateTankEnemiesSystem({
      arena: this.arena,
      enemies: this.tankEnemies,
      playerX: this.player.x,
      playerY: this.player.y,
      time: this.time.now,
      deltaSeconds,
      getGlobalMaxSpeed: () => this.getGlobalMaxSpeed(),
      getEnemyMoveSpeed: (enemy) => this.getEnemyDebugMoveSpeed(enemy),
      steerEnemyVelocity: (enemy, targetVelocity, steerDeltaSeconds) =>
        this.steerEnemyVelocity(enemy, targetVelocity, steerDeltaSeconds),
      applyBlackHoleToEnemy: (enemy, index, blackHoleDeltaSeconds, time) =>
        this.applyBlackHoleToTankEnemy(enemy, index, blackHoleDeltaSeconds, time),
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius)
    });
  }

  private steerEnemyVelocity(
    enemy: BasicEnemy | ShooterEnemy | TankEnemy,
    targetVelocity: Phaser.Math.Vector2,
    deltaSeconds: number
  ): void {
    steerVelocityToward({
      velocity: enemy.velocity,
      targetVelocity,
      response: ENEMY_VELOCITY_RESPONSE * this.debugState.enemyResponseScale,
      deltaSeconds,
      mass: enemy.stats.mass,
      referenceMass: basicEnemy.stats.mass,
      massExponent: this.debugState.enemyMassExponent,
      maxSpeed: this.getEnemyDebugMoveSpeed(enemy)
    });
  }

  private getEnemyDebugMoveSpeed(enemy: BasicEnemy | ShooterEnemy | TankEnemy): number {
    return enemy.stats.moveSpeed * this.debugState.enemySpeedScale;
  }

  private fireShooterProjectile(enemy: ShooterEnemy, direction: Phaser.Math.Vector2, time: number): void {
    this.enemyProjectiles.push(
      fireShooterProjectileSystem({
        scene: this,
        arena: this.arena,
        enemy,
        direction,
        time
      })
    );
  }

  private updateEnemyProjectiles(time: number, deltaSeconds: number): void {
    this.enemyProjectiles = updateEnemyProjectilesSystem({
      arena: this.arena,
      projectiles: this.enemyProjectiles,
      time,
      deltaSeconds,
      isPlayerDead: false,
      applyProjectileGravity: (projectile, gravityDeltaSeconds) =>
        this.applyProjectileGravity(projectile, gravityDeltaSeconds),
      updateCapturedProjectile: (projectile, capturedDeltaSeconds, mirrorViewRadius) =>
        this.updateCapturedProjectile(projectile, capturedDeltaSeconds, mirrorViewRadius),
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius),
      tryHitPlayer: (projectile) => this.tryHitPlayerWithEnemyProjectile(projectile, time)
    });
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
    const hitRadius = this.getPlayerCollisionRadius() + projectile.hitRadius;

    if (offset.lengthSq() > hitRadius * hitRadius) {
      return false;
    }

    if (time >= this.playerInvulnerableUntil) {
      this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
      this.damagePlayer(projectile.damage, time, projectile.body.x, projectile.body.y, { source: 'enemy' });
    }

    return true;
  }

  private updateBasicAsteroids(deltaSeconds: number): void {
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;

    updateBasicAsteroidRuntime({
      arena: this.arena,
      asteroids: this.basicAsteroids,
      deltaSeconds,
      time: this.time.now,
      validateAsteroidRenderState: (asteroid) => this.validateAsteroidRenderState(asteroid),
      applyBlackHoleToAsteroid: (asteroid, index, blackHoleDeltaSeconds, time) =>
        this.applyBlackHoleToAsteroid(asteroid, index, blackHoleDeltaSeconds, time),
      updateAsteroidWrapMirror: (asteroid) => this.updateAsteroidWrapMirror(asteroid)
    });

    this.resolveAsteroidCollisions(this.time.now);
  }

  private resolveAsteroidCollisions(time: number): void {
    resolveAsteroidCollisionsSystem({
      arena: this.arena,
      asteroids: this.basicAsteroids,
      time,
      asteroidCollisionImpulseScale: this.debugState.asteroidCollisionImpulseScale,
      getCollisionNormal: (offset) => this.getCollisionNormal(offset),
      getAsteroidMass: (tier) => this.getAsteroidMass(tier),
      getAsteroidCollisionRadius: (asteroid) => this.getAsteroidCollisionRadius(asteroid),
      getGlobalMaxSpeed: () => this.getGlobalMaxSpeed(),
      nudgeWrappedObject: (object, normal, distance) => this.nudgeWrappedObject(object, normal, distance),
      updateAsteroidWrapMirror: (asteroid) => this.updateAsteroidWrapMirror(asteroid),
      canApplyAsteroidCollisionDamage: (first, second, collisionTime) =>
        this.canApplyAsteroidCollisionDamage(first, second, collisionTime),
      markAsteroidCollisionDamageApplied: (first, second, collisionTime) =>
        this.markAsteroidCollisionDamageApplied(first, second, collisionTime),
      calculateAsteroidImpactDamage: (firstMass, secondMass, closingSpeed) =>
        this.calculatePhysicalImpactDamage({
          source: 'asteroid',
          baseDamage: 0,
          attackerMass: firstMass,
          targetMass: secondMass,
          impactSpeed: closingSpeed
        }),
      damageAsteroid: (asteroid, damage) => this.damageAsteroid(asteroid, damage, 'asteroid', false),
      emitAsteroidImpactExplosion: (x, y, tier) => this.emitAsteroidImpactExplosion(x, y, tier),
      flashDamageSprites: (...containers) => this.flashDamageSprites(...containers),
      destroyAsteroidsFromCollision: (destroyedAsteroids) => this.destroyAsteroidsFromCollision(destroyedAsteroids)
    });
  }

  private canApplyAsteroidCollisionDamage(first: BasicAsteroid, second: BasicAsteroid, time: number): boolean {
    return time >= (this.asteroidCollisionCooldowns.get(first.body)?.get(second.body) ?? 0);
  }

  private markAsteroidCollisionDamageApplied(first: BasicAsteroid, second: BasicAsteroid, time: number): void {
    let firstCooldowns = this.asteroidCollisionCooldowns.get(first.body);
    let secondCooldowns = this.asteroidCollisionCooldowns.get(second.body);

    if (!firstCooldowns) {
      firstCooldowns = new WeakMap<object, number>();
      this.asteroidCollisionCooldowns.set(first.body, firstCooldowns);
    }

    if (!secondCooldowns) {
      secondCooldowns = new WeakMap<object, number>();
      this.asteroidCollisionCooldowns.set(second.body, secondCooldowns);
    }

    const nextDamageAt = time + ASTEROID_COLLISION_COOLDOWN_MS;
    firstCooldowns.set(second.body, nextDamageAt);
    secondCooldowns.set(first.body, nextDamageAt);
  }

  private destroyAsteroidsFromCollision(destroyedAsteroids: Set<BasicAsteroid>): void {
    const indexes = Array.from(destroyedAsteroids)
      .map((asteroid) => this.basicAsteroids.indexOf(asteroid))
      .filter((index) => index >= 0)
      .sort((a, b) => b - a);

    for (const index of indexes) {
      this.destroyBasicAsteroid(index, false);
    }
  }

  private resolveWorldImpactCollisions(time: number): void {
    resolveWorldImpactCollisionsSystem({
      arena: this.arena,
      enemies: this.getAllEnemies(),
      asteroids: this.basicAsteroids,
      debris: this.enemyWreckageDebris,
      time,
      getEnemyHitRadius: (enemy) => this.getEnemyHitRadius(enemy),
      getEnemyCollisionScale: () => this.debugState.getCollisionShapeScale('enemy'),
      getAsteroidCollisionRadius: (asteroid) => this.getAsteroidCollisionRadius(asteroid),
      getDebrisCollisionRadius: (debris) => this.getDebrisCollisionRadius(debris),
      getEnemyTotalVelocity: (enemy) => this.getEnemyTotalVelocity(enemy),
      getAsteroidMass: (tier) => this.getAsteroidMass(tier),
      getGlobalMaxSpeed: () => this.getGlobalMaxSpeed(),
      resolveBodyImpactCollision: (impactInput) => this.resolveBodyImpactCollision(impactInput),
      damageEnemyFromAsteroid: (enemy, damage) => {
        this.damageEnemy(enemy, damage, 'asteroid', false);
        this.resolveEnemyDestroyedByPhysicalImpact(enemy);
      },
      damageEnemyFromDebris: (enemy, damage) => {
        this.damageEnemy(enemy, damage, 'debris', false);
        this.resolveEnemyDestroyedByPhysicalImpact(enemy);
      },
      damageAsteroidFromEnemy: (asteroid, damage) => this.damageAsteroidFromPhysicalImpact(asteroid, damage, 'enemy'),
      damageAsteroidFromDebris: (asteroid, damage) => this.damageAsteroidFromPhysicalImpact(asteroid, damage, 'debris'),
      damageDebrisFromEnemy: (debris, damage) => this.damageDebrisFromPhysicalImpact(debris, damage, 'enemy'),
      damageDebrisFromAsteroid: (debris, damage) => this.damageDebrisFromPhysicalImpact(debris, damage, 'asteroid')
    });
  }

  private getAllEnemies(): AnyGameEnemy[] {
    return [...this.liveEnemies, ...this.basicEnemies, ...this.shooterEnemies, ...this.tankEnemies];
  }

  private getEnemyHitRadius(enemy: AnyGameEnemy): number {
    if (this.isLiveEnemy(enemy)) {
      return enemy.definition.stats.radius;
    }

    if (this.tankEnemies.includes(enemy as TankEnemy)) {
      return Math.max(this.getEnemyCollisionHalfWidth(enemy), this.getEnemyCollisionHalfLength(enemy));
    }

    if (this.shooterEnemies.includes(enemy as ShooterEnemy)) {
      return Math.max(this.getEnemyCollisionHalfWidth(enemy), this.getEnemyCollisionHalfLength(enemy));
    }

    return Math.max(this.getEnemyCollisionHalfWidth(enemy), this.getEnemyCollisionHalfLength(enemy));
  }

  private isLiveEnemy(enemy: AnyGameEnemy): enemy is LiveGameEnemy {
    return this.liveEnemies.includes(enemy as LiveGameEnemy);
  }

  private resolveBodyImpactCollision(input: {
    firstBody: Phaser.GameObjects.Container;
    secondBody: Phaser.GameObjects.Container;
    firstVelocity: Phaser.Math.Vector2;
    secondVelocity: Phaser.Math.Vector2;
    firstTotalVelocity: Phaser.Math.Vector2;
    secondTotalVelocity: Phaser.Math.Vector2;
    firstMass: number;
    secondMass: number;
    firstRadius: number;
    secondRadius: number;
    firstSource: DebugImpactSourceType;
    secondSource: DebugImpactSourceType;
    firstMaxSpeed: number;
    secondMaxSpeed: number;
    time: number;
    damageFirst: (damage: number) => void;
    damageSecond: (damage: number) => void;
    collisionNormal?: Phaser.Math.Vector2;
    collisionPenetration?: number;
    collisionOffset?: Phaser.Math.Vector2;
  }): void {
    resolveBodyImpactCollisionSystem({
      arena: this.arena,
      ...input,
      asteroidCollisionImpulseScale: this.debugState.asteroidCollisionImpulseScale,
      canApplyWorldCollisionDamage: (first, second, time) => this.canApplyWorldCollisionDamage(first, second, time),
      markWorldCollisionDamageApplied: (first, second, time) => this.markWorldCollisionDamageApplied(first, second, time),
      getCollisionNormal: (offset) => this.getCollisionNormal(offset),
      nudgeWrappedObject: (object, normal, distance) => this.nudgeWrappedObject(object, normal, distance),
      calculatePhysicalImpactDamage: (impactInput) => this.calculatePhysicalImpactDamage(impactInput),
      emitImpactExplosion: (x, y) => this.emitShipCollisionImpactExplosion(x, y)
    });
  }

  private canApplyWorldCollisionDamage(first: object, second: object, time: number): boolean {
    return time >= (this.asteroidCollisionCooldowns.get(first)?.get(second) ?? 0);
  }

  private markWorldCollisionDamageApplied(first: object, second: object, time: number): void {
    let firstCooldowns = this.asteroidCollisionCooldowns.get(first);
    let secondCooldowns = this.asteroidCollisionCooldowns.get(second);

    if (!firstCooldowns) {
      firstCooldowns = new WeakMap<object, number>();
      this.asteroidCollisionCooldowns.set(first, firstCooldowns);
    }

    if (!secondCooldowns) {
      secondCooldowns = new WeakMap<object, number>();
      this.asteroidCollisionCooldowns.set(second, secondCooldowns);
    }

    const nextDamageAt = time + ASTEROID_COLLISION_COOLDOWN_MS;
    firstCooldowns.set(second, nextDamageAt);
    secondCooldowns.set(first, nextDamageAt);
  }

  private getActiveAutoWeaponDefinition(): WeaponRegistryEntry | undefined {
    return getActiveAutoWeaponDefinition(this.playerWeapons);
  }

  private getEffectiveAutoWeaponDefinition(): WeaponRegistryEntry | undefined {
    const weapon = this.getActiveAutoWeaponDefinition();
    return weapon && weapon.autoFire !== false ? weapon : undefined;
  }

  private getActivePrimaryWeaponDefinition(): WeaponRegistryEntry | undefined {
    return getActivePrimaryWeaponDefinition(this.playerWeapons);
  }

  private getActiveSecondaryWeaponDefinition(): WeaponRegistryEntry | undefined {
    return getActiveSecondaryWeaponDefinition(this.playerWeapons);
  }

  private getOwnedAutoWeaponDefinitions(): WeaponRegistryEntry[] {
    return getOwnedAutoWeaponDefinitions(this.playerWeapons);
  }

  private getOwnedManualWeaponDefinitions(): WeaponRegistryEntry[] {
    return getOwnedManualWeaponDefinitions(this.playerWeapons);
  }

  private assignWeaponHotbarSlot(slot: WeaponSlotType, weaponId: WeaponId): void {
    const weapon = getWeaponDefinition(weaponId);
    if (slot === 'auto') {
      if (!weapon.slotCompatibility.includes('auto') || !this.playerWeapons.ownedAutoWeaponIds.includes(weaponId)) {
        return;
      }

      this.playerWeapons.activeAutoWeaponId = weaponId;
      this.playerWeapons.nextAutoWeaponFireAt = 0;
      this.updateGameplayHud(this.time.now);
      return;
    }

    if (!this.canAssignManualWeaponToSlot(weaponId, slot)) {
      return;
    }

    if (slot === 'primary') {
      const previousPrimaryWeaponId = this.playerWeapons.activePrimaryWeaponId;
      if (this.playerWeapons.activeSecondaryWeaponId === weaponId) {
        this.playerWeapons.activeSecondaryWeaponId = this.canAssignManualWeaponToSlot(previousPrimaryWeaponId, 'secondary')
          ? previousPrimaryWeaponId
          : null;
      } else if (!this.playerWeapons.activeSecondaryWeaponId && this.canAssignManualWeaponToSlot(previousPrimaryWeaponId, 'secondary')) {
        this.playerWeapons.activeSecondaryWeaponId = previousPrimaryWeaponId;
      }
      this.playerWeapons.activePrimaryWeaponId = weaponId;
      this.playerWeapons.nextPrimaryWeaponFireAt = 0;
    } else if (slot === 'secondary') {
      const previousSecondaryWeaponId = this.playerWeapons.activeSecondaryWeaponId;
      if (this.playerWeapons.activePrimaryWeaponId === weaponId) {
        this.playerWeapons.activePrimaryWeaponId = this.canAssignManualWeaponToSlot(previousSecondaryWeaponId, 'primary')
          ? previousSecondaryWeaponId
          : null;
      } else if (!this.playerWeapons.activePrimaryWeaponId && this.canAssignManualWeaponToSlot(previousSecondaryWeaponId, 'primary')) {
        this.playerWeapons.activePrimaryWeaponId = previousSecondaryWeaponId;
      }
      this.playerWeapons.activeSecondaryWeaponId = weaponId;
      this.playerWeapons.nextSecondaryWeaponFireAt = 0;
    }

    this.ensureRammingShieldRuntime();
    this.updateGameplayHud(this.time.now);
  }

  private canAssignManualWeaponToSlot(weaponId: WeaponId | null, slot: Exclude<WeaponSlotType, 'auto'>): weaponId is WeaponId {
    if (!weaponId || !this.playerWeapons.ownedManualWeaponIds.includes(weaponId)) {
      return false;
    }

    return getWeaponDefinition(weaponId).slotCompatibility.includes(slot);
  }

  private getPlayerWeaponUpgradeState(): PlayerWeaponUpgradeState {
    return this.runUpgradeLevels;
  }

  private getActiveAutoWeaponDamageMultiplier(): number {
    return getWeaponDamageMultiplier(this.getPlayerWeaponUpgradeState(), getWeaponDefinition('pulse-cannon')) * this.getResolvedPlayerStats().damage;
  }

  private getActiveAutoWeaponCooldownMs(): number {
    const weapon = this.getEffectiveAutoWeaponDefinition();
    if (!weapon) {
      return 0;
    }

    const resolved = this.getResolvedWeaponStats(weapon, 'auto');
    return resolved.projectile?.cooldownMs ?? resolved.rammingShield?.contactCooldownMs ?? 0;
  }

  private getPulseCannonCooldownMs(): number {
    return this.getResolvedWeaponStats(getWeaponDefinition('pulse-cannon'), 'primary').projectile?.cooldownMs ?? 0;
  }

  private getActiveAutoWeaponBaseCooldownMs(): number {
    return this.getResolvedWeaponStats(getWeaponDefinition('pulse-cannon'), 'primary').projectile?.baseCooldownMs ?? 0;
  }

  private getActiveAutoWeaponProjectileSpeed(): number {
    return this.getResolvedWeaponStats(getWeaponDefinition('pulse-cannon'), 'primary').projectile?.projectileSpeed ?? 0;
  }

  private getActiveAutoWeaponUpgradeHudSummary(): string {
    const damageLevel = this.getRunUpgradeLevelById('pulse_damage');
    const flatDamageLevel =
      this.getRunUpgradeLevelById('pulse_flat_damage_common') +
      this.getRunUpgradeLevelById('pulse_flat_damage_uncommon') +
      this.getRunUpgradeLevelById('pulse_flat_damage_rare');
    const fireRateLevel = this.getRunUpgradeLevelById('pulse_fire_rate');
    const velocityLevel = this.getRunUpgradeLevelById('pulse_velocity');

    if (damageLevel + flatDamageLevel + fireRateLevel + velocityLevel === 0) {
      return 'Weapon upgrades none';
    }

    return `Weapon upgrades D${damageLevel} F${flatDamageLevel} R${fireRateLevel} V${velocityLevel}`;
  }

  private updateActiveMainWeapon(time: number): void {
    if (this.isPlayerDead || this.isUpgradeOverlayOpen) {
      return;
    }

    const pointer = this.input.activePointer;
    const isPointerBlockedByDebugMenu = this.debugMenuHost?.containsPointer(pointer) ?? false;
    const activeAutoWeapon = this.getEffectiveAutoWeaponDefinition();
    if (activeAutoWeapon && time >= this.playerWeapons.nextAutoWeaponFireAt) {
      const result = this.usePlayerWeapon(activeAutoWeapon, 'auto', time);
      this.playerWeapons.nextAutoWeaponFireAt = time + result.cooldownMs;
    }

    const primaryWeapon = this.getActivePrimaryWeaponDefinition();
    const isPrimaryFiring = this.isControlDown('fire') || (!isPointerBlockedByDebugMenu && pointer.leftButtonDown());
    if (primaryWeapon && isPrimaryFiring && time >= this.playerWeapons.nextPrimaryWeaponFireAt) {
      const result = this.usePlayerWeapon(primaryWeapon, 'primary', time);
      this.playerWeapons.nextPrimaryWeaponFireAt = time + result.cooldownMs;
    }

    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    if (
      secondaryWeapon &&
      !isPointerBlockedByDebugMenu &&
      pointer.rightButtonDown() &&
      time >= this.playerWeapons.nextSecondaryWeaponFireAt
    ) {
      const result = this.usePlayerWeapon(secondaryWeapon, 'secondary', time);
      this.playerWeapons.nextSecondaryWeaponFireAt = time + result.cooldownMs;
    }
  }

  private usePlayerWeapon(weapon: WeaponRegistryEntry, slot: 'auto' | 'primary' | 'secondary', time: number): { cooldownMs: number } {
    const resolved = this.getResolvedWeaponStats(weapon, slot);
    if (weapon.behaviorType === 'ramming-shield') {
      return { cooldownMs: this.useRammingShieldWeapon(resolved.rammingShield, time) ? (resolved.rammingShield?.contactCooldownMs ?? 0) : 0 };
    }

    return this.fireProjectileWeapon(resolved, time);
  }

  private useRammingShieldWeapon(stats: RammingShieldStats | undefined, time: number): boolean {
    if (!this.hasRammingShield() || !stats) {
      return false;
    }

    if (!activateRammingShieldDash(this.rammingShieldState, stats, time, this.getResolvedPlayerStats())) {
      return false;
    }

    const direction = this.getForwardDirection(this.player.rotation);
    this.startRammingShieldDashBurst(direction, stats.dashImpulse);
    this.emitRammingShieldDashBurst(direction, time);
    this.updateRammingShieldVisual(time);
    return true;
  }

  private fireProjectileWeapon(resolved: ResolvedWeaponStats, time: number): { cooldownMs: number } {
    const projectileStats = resolved.projectile;
    const effects = projectileStats?.effects;
    const isPulseCannon = resolved.weapon.id === 'pulse-cannon' && !!projectileStats;
    const isOverloaded =
      isPulseCannon && !!effects?.overloadEveryNShots && ++this.pulseVolleyCount % effects.overloadEveryNShots === 0;
    const isEmergencyEmpowered =
      isPulseCannon && this.isPulseEmergencyCharged && !!effects?.emergencyDamageMultiplier;
    const damageMultiplier =
      1 +
      (isOverloaded ? effects?.overloadDamageMultiplier ?? 0 : 0) +
      (isEmergencyEmpowered ? effects?.emergencyDamageMultiplier ?? 0 : 0);
    const areaMultiplier =
      1 +
      (isOverloaded ? effects?.overloadSizeMultiplier ?? 0 : 0) +
      (isEmergencyEmpowered ? effects?.emergencySizeMultiplier ?? 0 : 0);
    const burstCount = projectileStats?.pattern.burstCount ?? 1;
    const burstDelayMs = projectileStats?.pattern.burstDelayMs ?? 0;

    if (isEmergencyEmpowered) {
      this.isPulseEmergencyCharged = false;
    }

    const result = this.spawnProjectileVolley(resolved, time, {
      damageMultiplier,
      areaMultiplier,
      isOverloaded,
      isEmergencyEmpowered
    });

    for (let burstIndex = 1; burstIndex < burstCount; burstIndex += 1) {
      this.time.delayedCall(burstDelayMs * burstIndex, () => {
        if (this.isPlayerDead || this.isUpgradeOverlayOpen || this.isPauseMenuOpen) {
          return;
        }

        this.spawnProjectileVolley(resolved, this.time.now, {
          damageMultiplier,
          areaMultiplier,
          isOverloaded,
          isEmergencyEmpowered
        });
      });
    }

    return { cooldownMs: result.cooldownMs };
  }

  private spawnProjectileVolley(
    resolved: ResolvedWeaponStats,
    time: number,
    modifiers: {
      damageMultiplier: number;
      areaMultiplier: number;
      isOverloaded: boolean;
      isEmergencyEmpowered: boolean;
    }
  ): { cooldownMs: number } {
    const result = fireProjectileWeaponSystem({
      scene: this,
      resolved,
      time,
      playerX: this.player.x,
      playerY: this.player.y,
      playerRotation: this.player.rotation,
      getForwardDirection: (rotation) => this.getForwardDirection(rotation),
      ...modifiers
    });

    this.playerProjectiles.push(...result.projectiles);
    return { cooldownMs: result.cooldownMs };
  }

  private updatePlayerProjectiles(time: number, deltaSeconds: number): void {
    this.playerProjectiles = updatePlayerProjectilesSystem({
      scene: this,
      arena: this.arena,
      projectiles: this.playerProjectiles,
      time,
      deltaSeconds,
      isPlayerDead: false,
      applyProjectileGravity: (projectile, gravityDeltaSeconds) =>
        this.applyProjectileGravity(projectile, gravityDeltaSeconds),
      updateCapturedProjectile: (projectile, capturedDeltaSeconds, mirrorViewRadius) =>
        this.updateCapturedProjectile(projectile, capturedDeltaSeconds, mirrorViewRadius),
      updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
        this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius),
      steerProjectile: (projectile, homingDeltaSeconds) => this.steerPulseProjectile(projectile, homingDeltaSeconds),
      tryHitTarget: (projectile) =>
        this.tryHitLiveEnemy(projectile) ||
        this.tryHitBasicEnemy(projectile) ||
        this.tryHitShooterEnemy(projectile) ||
        this.tryHitTankEnemy(projectile) ||
        this.tryHitEnemyWreckageDebris(projectile) ||
        this.tryHitBasicAsteroid(projectile)
    });
  }

  private destroyPlayerProjectile(projectile: PlayerProjectile): void {
    destroyPlayerProjectileSystem(projectile);
  }

  private clearPlayerProjectiles(): void {
    this.playerProjectiles = clearPlayerProjectilesSystem(this.playerProjectiles);
  }

  private clearEnemyProjectiles(): void {
    this.enemyProjectiles = clearEnemyProjectilesSystem(this.enemyProjectiles);
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

  private emitAsteroidDeathShards(asteroid: BasicAsteroid, style: DeathShardStyle = 'asteroid'): void {
    this.emitDeathShards(
      asteroid.variant,
      asteroid.body.x,
      asteroid.body.y,
      ASTEROID_TIER_CONFIG[asteroid.tier].displaySize,
      asteroid.body.rotation,
      asteroid.velocity,
      style
    );
  }

  private steerPulseProjectile(projectile: PlayerProjectile, deltaSeconds: number): void {
    const { homingRange, homingStrength } = projectile.effects;
    if (homingRange <= 0 || homingStrength <= 0 || projectile.capturedByBlackHole) {
      return;
    }

    const target = this.findNearestPulseEnemyTarget(projectile.body.x, projectile.body.y, homingRange, projectile.piercedTargets);
    if (!target) {
      return;
    }

    const desiredDirection = this.getWrappedDirection(projectile.body.x, projectile.body.y, target.body.x, target.body.y).normalize();
    const currentDirection = projectile.velocity.clone().normalize();
    const turnAmount = Phaser.Math.Clamp(homingStrength * deltaSeconds, 0, 0.12);
    const steeredDirection = currentDirection.lerp(desiredDirection, turnAmount).normalize();

    projectile.velocity = steeredDirection.scale(projectile.speed);
    projectile.body.setRotation(Math.atan2(steeredDirection.x, -steeredDirection.y));
    projectile.wrapMirrorBody.setRotation(projectile.body.rotation);
  }

  private getPulseEnemyDamage(projectile: PlayerProjectile, enemy: AnyGameEnemy): number {
    let multiplier = 1;
    const ionizedUntil = this.pulseIonizedTargets.get(enemy.body) ?? 0;
    const critical = this.pulseCriticalTargets.get(enemy.body);

    if (this.time.now <= ionizedUntil) {
      multiplier += projectile.effects.ionizeDamageMultiplier;
    }

    if (critical && this.time.now <= critical.expiresAt) {
      multiplier += Math.min(projectile.effects.criticalMaxStacks, critical.stacks) * projectile.effects.criticalDamageBonusPerHit;
    }

    return projectile.damage * multiplier;
  }

  private applyPulseProjectileHitEffects(
    projectile: PlayerProjectile,
    targetKey: object,
    hitX: number,
    hitY: number,
    appliedDamage: number,
    killedTarget: boolean
  ): void {
    const effects = projectile.effects;

    if (effects.lifestealPercent > 0 && effects.lifestealCapPerSecond > 0) {
      this.restorePulseSapping(appliedDamage * effects.lifestealPercent, effects.lifestealCapPerSecond);
    }

    if (effects.ionizeDurationMs > 0) {
      this.pulseIonizedTargets.set(targetKey, this.time.now + effects.ionizeDurationMs);
    }

    if (effects.criticalDamageBonusPerHit > 0 && effects.criticalMaxStacks > 0 && effects.criticalDurationMs > 0) {
      const existing = this.pulseCriticalTargets.get(targetKey);
      const existingStacks = existing && this.time.now <= existing.expiresAt ? existing.stacks : 0;
      this.pulseCriticalTargets.set(targetKey, {
        stacks: Math.min(effects.criticalMaxStacks, existingStacks + 1),
        expiresAt: this.time.now + effects.criticalDurationMs
      });
    }

    if (effects.chainCount > 0 && effects.chainRange > 0 && effects.chainDamageMultiplier > 0) {
      this.applyPulseChainDischarge(projectile, targetKey, hitX, hitY);
    }

    if (effects.explosionRadius > 0 && effects.explosionDamageMultiplier > 0) {
      this.applyPulseExplosion(projectile, targetKey, hitX, hitY);
    }

    if (killedTarget) {
      this.applyPulseKillEffects(projectile);
    }

    if (projectile.pierceRemaining <= 0 && projectile.bouncesRemaining > 0) {
      this.redirectPulseProjectile(projectile);
    }
  }

  private restorePulseSapping(amount: number, capPerSecond: number): void {
    if (amount <= 0 || this.isPlayerDead) {
      return;
    }

    const time = this.time.now;
    if (time - this.pulseLifestealWindowStartedAt >= 1000) {
      this.pulseLifestealWindowStartedAt = time;
      this.pulseLifestealRestoredThisWindow = 0;
    }

    const cappedAmount = Math.round(Math.min(amount, Math.max(0, capPerSecond - this.pulseLifestealRestoredThisWindow)));
    if (cappedAmount <= 0) {
      return;
    }

    let remaining = cappedAmount;
    if (this.hasRammingShield()) {
      const shieldMax = this.getRammingShieldMaxHp();
      const shieldRestore = Math.min(remaining, Math.max(0, shieldMax - this.rammingShieldState.hp));
      this.rammingShieldState.hp += shieldRestore;
      remaining -= shieldRestore;
      if (shieldRestore > 0) {
        this.updateRammingShieldVisual(time);
      }
    }

    if (remaining > 0) {
      this.playerHull = Math.min(this.getPlayerMaxHull(), this.playerHull + remaining);
    }

    this.pulseLifestealRestoredThisWindow += cappedAmount - remaining + Math.max(0, remaining);
    this.updateGameplayHud(time);
  }

  private applyPulseChainDischarge(projectile: PlayerProjectile, sourceKey: object, sourceX: number, sourceY: number): void {
    let chainsRemaining = projectile.effects.chainCount;
    const chained = new WeakSet<object>();
    chained.add(sourceKey);

    while (chainsRemaining > 0) {
      const target = this.findNearestPulseEnemyTarget(sourceX, sourceY, projectile.effects.chainRange, chained);
      if (!target) {
        return;
      }

      chained.add(target.body);
      const damage = this.rollPlayerDamage(projectile.damage * projectile.effects.chainDamageMultiplier);
      this.damageEnemy(target, damage, 'player', true);
      this.emitPulseChainEffect(sourceX, sourceY, target.body.x, target.body.y);

      if (target.hp <= 0) {
        this.applyPulseKillEffects(projectile);
        this.destroyPulseEnemyTarget(target);
      } else {
        this.flashDamageSprites(target.body, target.wrapMirrorBody);
      }

      chainsRemaining -= 1;
    }
  }

  private applyPulseExplosion(projectile: PlayerProjectile, sourceKey: object, x: number, y: number): void {
    const radius = projectile.effects.explosionRadius;
    const baseDamage = projectile.damage * projectile.effects.explosionDamageMultiplier;
    const flash = this.add.circle(x, y, radius, 0x73f2ff, 0.16);

    flash.setDepth(9);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.35,
      duration: 170,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    for (const enemy of this.getAllEnemies()) {
      if (enemy.body === sourceKey || !enemy.body.scene || this.getWrappedDirection(x, y, enemy.body.x, enemy.body.y).lengthSq() > radius * radius) {
        continue;
      }

      this.damageEnemy(enemy, this.rollPlayerDamage(baseDamage), 'player', true);
      if (enemy.hp <= 0) {
        this.applyPulseKillEffects(projectile);
        this.destroyPulseEnemyTarget(enemy);
      } else {
        this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
      }
    }

    for (let i = this.basicAsteroids.length - 1; i >= 0; i -= 1) {
      const asteroid = this.basicAsteroids[i];
      if (asteroid.body === sourceKey || !asteroid.body.scene || this.getWrappedDirection(x, y, asteroid.body.x, asteroid.body.y).lengthSq() > radius * radius) {
        continue;
      }

      this.damageAsteroid(asteroid, this.rollPlayerDamage(baseDamage), 'player', true);
      if (asteroid.hp <= 0) {
        this.destroyBasicAsteroid(i);
      } else {
        this.flashDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
      }
    }

    for (let i = this.enemyWreckageDebris.length - 1; i >= 0; i -= 1) {
      const debris = this.enemyWreckageDebris[i];
      if (debris.body === sourceKey || !debris.body.scene || this.getWrappedDirection(x, y, debris.body.x, debris.body.y).lengthSq() > radius * radius) {
        continue;
      }

      this.damageDebris(debris, this.rollPlayerDamage(baseDamage), 'player', true);
      if (debris.hp <= 0) {
        this.spawnScrapPickup('debris', SCRAP_PICKUP_VALUE_FROM_DEBRIS, debris.body.x, debris.body.y, debris.velocity);
        this.destroyEnemyWreckageDebris(debris, true);
        this.enemyWreckageDebris.splice(i, 1);
      } else {
        this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
      }
    }
  }

  private applyPulseKillEffects(projectile: PlayerProjectile): void {
    const refundMultiplier = projectile.effects.feedbackCooldownRefundMultiplier;
    if (refundMultiplier <= 0) {
      return;
    }

    const refundMs = Math.min(
      projectile.effects.feedbackCooldownRefundCapMs,
      this.getActiveAutoWeaponBaseCooldownMs() * refundMultiplier
    );
    this.playerWeapons.nextAutoWeaponFireAt = Math.max(this.time.now, this.playerWeapons.nextAutoWeaponFireAt - refundMs);
  }

  private redirectPulseProjectile(projectile: PlayerProjectile): void {
    const target = this.findNearestPulseEnemyTarget(projectile.body.x, projectile.body.y, 520, projectile.piercedTargets);
    if (!target) {
      return;
    }

    const direction = this.getWrappedDirection(projectile.body.x, projectile.body.y, target.body.x, target.body.y).normalize();
    projectile.velocity = direction.scale(projectile.speed);
    projectile.body.setRotation(Math.atan2(direction.x, -direction.y));
    projectile.wrapMirrorBody.setRotation(projectile.body.rotation);
  }

  private findNearestPulseEnemyTarget(
    x: number,
    y: number,
    range: number,
    excluded: WeakSet<object>
  ): AnyGameEnemy | undefined {
    let nearest: AnyGameEnemy | undefined;
    let nearestDistanceSq = range * range;

    for (const enemy of this.getAllEnemies()) {
      if (!enemy.body.scene || excluded.has(enemy.body)) {
        continue;
      }

      const distanceSq = this.getWrappedDirection(x, y, enemy.body.x, enemy.body.y).lengthSq();
      if (distanceSq <= nearestDistanceSq) {
        nearest = enemy;
        nearestDistanceSq = distanceSq;
      }
    }

    return nearest;
  }

  private destroyPulseEnemyTarget(enemy: AnyGameEnemy): void {
    if (this.isLiveEnemy(enemy)) {
      this.destroyLivePulseEnemyTarget(enemy);
      return;
    }

    const basicIndex = this.basicEnemies.indexOf(enemy as BasicEnemy);
    if (basicIndex >= 0) {
      this.destroyEnemyWithRewards(enemy as BasicEnemy, this.basicEnemies, basicIndex, 'chaser');
      return;
    }

    const shooterIndex = this.shooterEnemies.indexOf(enemy as ShooterEnemy);
    if (shooterIndex >= 0) {
      this.destroyEnemyWithRewards(enemy as ShooterEnemy, this.shooterEnemies, shooterIndex, 'shooter');
      return;
    }

    const tankIndex = this.tankEnemies.indexOf(enemy as TankEnemy);
    if (tankIndex >= 0) {
      this.destroyEnemyWithRewards(enemy as TankEnemy, this.tankEnemies, tankIndex, 'tank');
    }
  }

  private destroyLivePulseEnemyTarget(enemy: LiveGameEnemy): void {
    const liveIndex = this.liveEnemies.indexOf(enemy);
    if (liveIndex >= 0) {
      this.destroyLiveEnemyWithRewards(enemy, liveIndex);
    }
  }

  private emitPulseChainEffect(fromX: number, fromY: number, toX: number, toY: number): void {
    const graphics = this.add.graphics().setDepth(10);
    graphics.lineStyle(2, 0x73f2ff, 0.84);
    graphics.beginPath();
    graphics.moveTo(fromX, fromY);
    graphics.lineTo(toX, toY);
    graphics.strokePath();
    graphics.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => graphics.destroy()
    });
  }

  private tryHitBasicEnemy(projectile: PlayerProjectile): boolean {
    return tryHitEllipseTargets({
      arena: this.arena,
      projectile,
      targets: this.basicEnemies,
      getForwardDirection: (rotation) => this.getForwardDirection(rotation),
      getTargetHitHalfWidth: (enemy) => this.getEnemyCollisionHalfWidth(enemy),
      getTargetHitHalfLength: (enemy) => this.getEnemyCollisionHalfLength(enemy),
      onHit: (enemy, i) => {
        const appliedDamage = this.damageEnemy(enemy, this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy)), 'player', true);
        const killedEnemy = enemy.hp <= 0;
        this.applyPulseProjectileHitEffects(projectile, enemy.body, projectile.body.x, projectile.body.y, appliedDamage, killedEnemy);

        if (killedEnemy) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          this.destroyEnemyWithRewards(enemy, this.basicEnemies, i, 'chaser');
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }
      }
    });
  }

  private tryHitLiveEnemy(projectile: PlayerProjectile): boolean {
    for (let i = this.liveEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.liveEnemies[i];
      if (projectile.piercedTargets.has(enemy.body)) {
        continue;
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
      const hitRadius = enemy.definition.stats.radius + projectile.hitRadius;

      if (offset.lengthSq() > hitRadius * hitRadius) {
        continue;
      }

      if (this.tryReflectLiveProjectile(projectile, enemy)) {
        return false;
      }

      projectile.piercedTargets.add(enemy.body);
      const appliedDamage = this.damageEnemy(enemy, this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy)), 'player', true);
      const killedEnemy = enemy.hp <= 0;
      this.applyPulseProjectileHitEffects(projectile, enemy.body, projectile.body.x, projectile.body.y, appliedDamage, killedEnemy);

      if (killedEnemy) {
        this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        this.destroyLiveEnemyWithRewards(enemy, i);
      } else {
        this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
        this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
      }

      return true;
    }

    return false;
  }

  private tryReflectLiveProjectile(projectile: PlayerProjectile, enemy: LiveGameEnemy): boolean {
    if (enemy.definition.behavior.id !== 'reflectorPulse' || enemy.stateData.reflecting !== true) {
      return false;
    }

    const frontArcDegrees = Number(enemy.definition.behavior.params?.frontArcDegrees ?? 92);
    const toProjectile = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
    if (toProjectile.lengthSq() <= 0) {
      return false;
    }

    const forward = this.getForwardDirection(enemy.body.rotation);
    if (forward.dot(toProjectile.normalize()) < Math.cos(Phaser.Math.DegToRad(frontArcDegrees * 0.5))) {
      return false;
    }

    projectile.velocity.scale(-1);
    projectile.body.rotation = Math.atan2(projectile.velocity.x, -projectile.velocity.y);
    projectile.wrapMirrorBody.rotation = projectile.body.rotation;
    this.emitLiveEnemyBurst(projectile.body.x, projectile.body.y, enemy.definition.visual.accentColor, 8);
    return true;
  }

  private emitUpgradePickupFeedback(x: number, y: number, label: string, color: number): void {
    const position = this.getNearestWrappedRenderPosition(x, y);
    const flash = this.add.rectangle(position.x, position.y, 28, 28, color, 0.34);

    flash.setDepth(14);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.2,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    const text = this.add
      .text(position.x, position.y - 22, label, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        stroke: '#02040a',
        strokeThickness: 4
      })
      .setOrigin(0.5, 0.5)
      .setDepth(22);

    this.tweens.add({
      targets: text,
      y: position.y - 48,
      alpha: 0,
      duration: 620,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private tryHitShooterEnemy(projectile: PlayerProjectile): boolean {
    return tryHitEllipseTargets({
      arena: this.arena,
      projectile,
      targets: this.shooterEnemies,
      getForwardDirection: (rotation) => this.getForwardDirection(rotation),
      getTargetHitHalfWidth: (enemy) => this.getEnemyCollisionHalfWidth(enemy),
      getTargetHitHalfLength: (enemy) => this.getEnemyCollisionHalfLength(enemy),
      onHit: (enemy, i) => {
        const appliedDamage = this.damageEnemy(enemy, this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy)), 'player', true);
        const killedEnemy = enemy.hp <= 0;
        this.applyPulseProjectileHitEffects(projectile, enemy.body, projectile.body.x, projectile.body.y, appliedDamage, killedEnemy);

        if (killedEnemy) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          this.destroyEnemyWithRewards(enemy, this.shooterEnemies, i, 'shooter');
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }
      }
    });
  }

  private tryHitTankEnemy(projectile: PlayerProjectile): boolean {
    return tryHitEllipseTargets({
      arena: this.arena,
      projectile,
      targets: this.tankEnemies,
      getForwardDirection: (rotation) => this.getForwardDirection(rotation),
      getTargetHitHalfWidth: (enemy) => this.getEnemyCollisionHalfWidth(enemy),
      getTargetHitHalfLength: (enemy) => this.getEnemyCollisionHalfLength(enemy),
      onHit: (enemy, i) => {
        const appliedDamage = this.damageEnemy(enemy, this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy)), 'player', true);
        const killedEnemy = enemy.hp <= 0;
        this.applyPulseProjectileHitEffects(projectile, enemy.body, projectile.body.x, projectile.body.y, appliedDamage, killedEnemy);

        if (killedEnemy) {
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
          this.destroyEnemyWithRewards(enemy, this.tankEnemies, i, 'tank');
        } else {
          this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }
      }
    });
  }

  private tryHitEnemyWreckageDebris(projectile: PlayerProjectile): boolean {
    return tryHitCircleTargets({
      arena: this.arena,
      projectile,
      targets: this.enemyWreckageDebris,
      getTargetHitRadius: (debris) => this.getDebrisCollisionRadius(debris),
      onHit: (debris, i) => {
        const appliedDamage = this.damageDebris(debris, this.rollPlayerDamage(projectile.damage), 'player', true);
        const destroyedDebris = debris.hp <= 0;
        this.applyPulseProjectileHitEffects(projectile, debris.body, debris.body.x, debris.body.y, appliedDamage, destroyedDebris);

        if (destroyedDebris) {
          this.spawnScrapPickup('debris', SCRAP_PICKUP_VALUE_FROM_DEBRIS, debris.body.x, debris.body.y, debris.velocity);
          this.destroyEnemyWreckageDebris(debris, true);
          this.enemyWreckageDebris.splice(i, 1);
        } else {
          this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }
      }
    });
  }

  private tryHitBasicAsteroid(projectile: PlayerProjectile): boolean {
    return tryHitCircleTargets({
      arena: this.arena,
      projectile,
      targets: this.basicAsteroids,
      getTargetHitRadius: (asteroid) => this.getAsteroidCollisionRadius(asteroid),
      onHit: (asteroid, i) => {
        const appliedDamage = this.damageAsteroid(asteroid, this.rollPlayerDamage(projectile.damage), 'player', true);
        const destroyedAsteroid = asteroid.hp <= 0;
        this.applyPulseProjectileHitEffects(projectile, asteroid.body, asteroid.body.x, asteroid.body.y, appliedDamage, destroyedAsteroid);

        if (destroyedAsteroid) {
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier);
          this.destroyBasicAsteroid(i);
        } else {
          this.flashDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier);
          this.applyAsteroidImpact(asteroid, projectile);
        }
      }
    });
  }

  private applyAsteroidImpact(asteroid: BasicAsteroid, projectile: PlayerProjectile): void {
    const impactDirection = projectile.velocity.clone().normalize();
    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];

    asteroid.velocity.x += impactDirection.x * tierConfig.impactImpulse;
    asteroid.velocity.y += impactDirection.y * tierConfig.impactImpulse;
    asteroid.velocity.limit(this.getGlobalMaxSpeed());
  }

  private destroyBasicAsteroid(index: number, grantReward = true, shardStyle: DeathShardStyle = 'asteroid'): void {
    const asteroid = this.basicAsteroids[index];
    const x = asteroid.body.x;
    const y = asteroid.body.y;
    const velocity = asteroid.velocity.clone();
    const fragmentTiers = createAsteroidFragmentTiersSystem(asteroid.tier, asteroid.breakupProfile);

    if (grantReward) {
      this.grantXp(ASTEROID_XP_REWARD_BY_TIER[asteroid.tier]);
      this.spawnScrapPickup('asteroid', SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER[asteroid.tier], x, y, velocity);
    }

    this.emitAsteroidBreakupFeedback(x, y, asteroid.tier);
    this.emitAsteroidDeathShards(asteroid, shardStyle);
    destroyAsteroidRenderObjects(asteroid);
    this.basicAsteroids.splice(index, 1);

    if (fragmentTiers.length > 0) {
      this.spawnAsteroidFragments(x, y, velocity, asteroid.breakupProfile, fragmentTiers);
    }
  }

  private consumeBasicAsteroid(index: number): void {
    const asteroid = this.basicAsteroids[index];

    this.emitAsteroidDeathShards(asteroid, 'blackHoleAsteroid');
    destroyAsteroidRenderObjects(asteroid);
    this.basicAsteroids.splice(index, 1);
  }

  private clearAsteroids(): void {
    this.basicAsteroids = clearBasicAsteroidsSystem(this.basicAsteroids);
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
    spawnAsteroidFragmentsSystem({
      arena: this.arena,
      asteroids: this.basicAsteroids,
      x,
      y,
      parentVelocity,
      breakupProfile,
      fragmentTiers,
      getGlobalMaxSpeed: () => this.getGlobalMaxSpeed(),
      createAsteroidInstance: (fragmentX, fragmentY, tier, velocity) =>
        this.createAsteroidInstance(fragmentX, fragmentY, tier, velocity)
    });
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
    this.starfield.resetPlayerTracking(this.player);
  }

  private updateBackgroundTiles(time: number): void {
    this.starfield.update(time, this.player);
  }

  private updateCollisionDebugOverlay(): void {
    this.updateBlackHoleDebugControls();
    this.collisionDebugOverlay.update(this.getCollisionDebugOverlaySnapshot());
  }

  private getCollisionDebugOverlaySnapshot(): CollisionDebugOverlaySnapshot {
    return {
      arena: this.arena,
      collisionDebugEnabled: this.debugState.collisionDebugEnabled,
      showBlackHoleRadii: this.debugState.showBlackHoleRadii,
      player: this.player,
      playerHitRadius: this.getPlayerHitRadius(),
      playerCollisionRadius: this.getPlayerCollisionRadius(),
      enemyCollisionScale: this.debugState.getCollisionShapeScale('enemy'),
      asteroidCollisionScale: this.debugState.getCollisionShapeScale('asteroid'),
      debrisCollisionScale: this.debugState.getCollisionShapeScale('debris'),
      shieldCollider: this.getRammingShieldCollider(),
      basicEnemies: this.basicEnemies,
      shooterEnemies: this.shooterEnemies,
      tankEnemies: this.tankEnemies,
      liveEnemies: this.liveEnemies,
      basicAsteroids: this.basicAsteroids,
      enemyWreckageDebris: this.enemyWreckageDebris,
      scrapPickups: this.scrapPickups,
      blackHole: this.blackHole,
      playerProjectiles: this.playerProjectiles,
      enemyProjectiles: this.enemyProjectiles
    };
  }

  private updateBlackHoleDebugControls(): void {
    this.blackHoleDebugControls.update();
  }

  private updateMinimap(): void {
    this.minimap.update(this.getMinimapSnapshot());
  }

  private getMinimapSnapshot(): MinimapSnapshot {
    return {
      arena: this.arena,
      player: this.player,
      isUpgradeOverlayOpen: this.isUpgradeOverlayOpen,
      basicAsteroids: this.basicAsteroids,
      basicEnemies: this.basicEnemies,
      shooterEnemies: this.shooterEnemies,
      tankEnemies: this.tankEnemies,
      liveEnemies: this.liveEnemies,
      scrapPickups: this.scrapPickups,
      blackHole: this.blackHole
    };
  }

  private updateGameplayHud(time: number): void {
    this.gameplayHud.update(this.getGameplayHudSnapshot(time));
    this.updateUpgradeButton();
    this.updateResultsButton();
  }

  private getGameplayHudSnapshot(time: number): GameplayHudSnapshot {
    const status = this.isPlayerDead
      ? 'CRITICAL'
      : this.debugState.playerInvulnerable
        ? 'DEBUG INVULN'
        : this.playerInvulnerableUntil > time
          ? 'HIT'
          : 'STABLE';
    const elapsedSeconds = Math.max(0, Math.floor(this.getSurvivalElapsedMs(time) / 1000));
    const maxHull = this.getPlayerMaxHull();
    const xpProgress = this.nextXpThreshold > 0 ? this.playerXp / this.nextXpThreshold : 0;
    const hullProgress = this.playerHull / maxHull;
    const activeWeapon = this.getEffectiveAutoWeaponDefinition();
    const primaryWeapon = this.getActivePrimaryWeaponDefinition();
    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    const weaponCooldownMs = this.getActiveAutoWeaponCooldownMs();
    const weaponRemainingMs = Math.max(0, this.playerWeapons.nextAutoWeaponFireAt - time);
    const weaponProgress = weaponCooldownMs > 0 ? 1 - weaponRemainingMs / weaponCooldownMs : 1;
    const weaponStatus = weaponRemainingMs <= 0 ? 'Ready' : `Cooling ${Math.ceil(weaponRemainingMs / 1000)}s`;

    return {
      timeSeconds: elapsedSeconds,
      playerHull: this.playerHull,
      maxHull,
      status,
      playerXp: this.playerXp,
      nextXpThreshold: this.nextXpThreshold,
      runScrapTotal: this.runScrapTotal,
      bankedUpgrades: this.bankedUpgrades,
      autoWeaponName: activeWeapon ? activeWeapon.displayName : 'Empty',
      primaryWeaponName: primaryWeapon ? primaryWeapon.displayName : 'Empty',
      weaponStatus,
      secondaryWeaponName: secondaryWeapon ? secondaryWeapon.displayName : 'Empty',
      mainWeaponUpgradeSummary: this.getActiveAutoWeaponUpgradeHudSummary(),
      hullProgress,
      xpProgress,
      weaponProgress,
      hasRammingShield: this.hasRammingShield(),
      rammingShieldHp: this.rammingShieldState.hp,
      rammingShieldMaxHp: this.getRammingShieldMaxHp(),
      rammingShieldDashCharges: this.rammingShieldState.dashCharges,
      rammingShieldDashMaxCharges: this.hasRammingShield() ? this.getRammingShieldStats().dashMaxCharges : 0,
      isRammingShieldEmpowered: time < this.rammingShieldState.empoweredUntil,
      weaponSlots: this.getWeaponHotbarSlots(time)
    };
  }

  private getWeaponHotbarSlots(time: number): WeaponHotbarSlotSnapshot[] {
    const autoWeapon = this.getEffectiveAutoWeaponDefinition();
    const primaryWeapon = this.getActivePrimaryWeaponDefinition();
    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    const autoCooldownMs = this.getActiveAutoWeaponCooldownMs();
    const autoRemainingMs = Math.max(0, this.playerWeapons.nextAutoWeaponFireAt - time);
    const primaryCooldownMs = this.getWeaponSlotCooldownMs(primaryWeapon, 'primary');
    const primaryRemainingMs = Math.max(0, this.playerWeapons.nextPrimaryWeaponFireAt - time);
    const secondaryCooldownMs = this.getWeaponSlotCooldownMs(secondaryWeapon, 'secondary');
    const secondaryRemainingMs = Math.max(0, this.playerWeapons.nextSecondaryWeaponFireAt - time);

    return [
      this.createWeaponHotbarSlot('auto', autoWeapon, 'AUTO', autoCooldownMs, autoRemainingMs, this.getOwnedAutoWeaponDefinitions()),
      this.createWeaponHotbarSlot('primary', primaryWeapon, 'LMB', primaryCooldownMs, primaryRemainingMs, this.getOwnedManualWeaponDefinitions()),
      this.createWeaponHotbarSlot('secondary', secondaryWeapon, 'RMB', secondaryCooldownMs, secondaryRemainingMs, this.getOwnedManualWeaponDefinitions())
    ];
  }

  private getWeaponSlotCooldownMs(
    weapon: WeaponRegistryEntry | undefined,
    slot: 'auto' | 'primary' | 'secondary'
  ): number {
    if (!weapon) {
      return 0;
    }

    const resolved = this.getResolvedWeaponStats(weapon, slot);
    return resolved.projectile?.cooldownMs ?? resolved.rammingShield?.contactCooldownMs ?? 0;
  }

  private createWeaponHotbarSlot(
    slot: 'auto' | 'primary' | 'secondary',
    weapon: WeaponRegistryEntry | undefined,
    controlLabel: string,
    cooldownMs: number,
    remainingMs: number,
    choices: WeaponRegistryEntry[]
  ): WeaponHotbarSlotSnapshot {
    const title = weapon?.displayName ?? 'Empty';
    const subtitle =
      slot === 'auto'
        ? 'Auto-fire weapon'
        : slot === 'primary'
          ? 'Primary weapon / left click'
          : 'Secondary weapon / right click';

    return {
      slot,
      weaponId: weapon?.id ?? null,
      title,
      subtitle,
      controlLabel,
      cooldownProgress: cooldownMs > 0 ? 1 - remainingMs / cooldownMs : 1,
      choices: choices.filter((choice) => choice.slotCompatibility.includes(slot)).map((choice) => ({
        weaponId: choice.id,
        name: choice.displayName.replace(' ', '\n')
      })),
      tooltipLines: this.getWeaponTooltipLines(slot, weapon)
    };
  }

  private getWeaponTooltipLines(slot: 'auto' | 'primary' | 'secondary', weapon: WeaponRegistryEntry | undefined): string[] {
    if (!weapon) {
      return [
        'Empty slot',
        slot === 'auto' ? 'No alternate auto-fire weapons owned.' : 'Acquire manual weapons during the run to assign this slot.'
      ];
    }

    const resolved = this.getResolvedWeaponStats(weapon, slot);
    const lines = [
      `Type: ${slot === 'auto' ? 'Auto-fire' : 'Manual'}`,
      `Control: ${slot === 'auto' ? 'Automatic' : slot === 'primary' ? 'Left click' : 'Right click'}`
    ];

    if (resolved.projectile) {
      const projectile = resolved.projectile;
      lines.push(
        '',
        'Offense',
        `Damage: ${Math.round(projectile.damage * (1 - COMBAT_VARIANCE))}-${Math.round(projectile.damage * (1 + COMBAT_VARIANCE))}`,
        `Cooldown: ${(projectile.cooldownMs / 1000).toFixed(2)}s`,
        `DPS est.: ${Math.round(projectile.damage / Math.max(0.01, projectile.cooldownMs / 1000))}`,
        `Projectiles: ${projectile.projectileCount}`,
        `Pierce: ${projectile.pierce}`,
        `Speed: ${Math.round(projectile.projectileSpeed)}`,
        `Range: ${Math.round(projectile.projectileRange)}`
      );

      const effects = projectile.effects;
      const activeEffects = [
        effects.chainCount > 0 ? `Chain x${effects.chainCount}` : '',
        effects.explosionRadius > 0 ? `Explosion ${Math.round(effects.explosionRadius)}` : '',
        effects.lifestealPercent > 0 ? `Sapping ${Math.round(effects.lifestealPercent * 100)}%` : '',
        effects.ionizeDamageMultiplier > 0 ? `Ionize +${Math.round(effects.ionizeDamageMultiplier * 100)}%` : '',
        effects.bounceCount > 0 ? `Bounce x${effects.bounceCount}` : ''
      ].filter(Boolean);
      if (activeEffects.length > 0) {
        lines.push('', 'Effects', ...activeEffects);
      }
    }

    if (resolved.rammingShield) {
      const shield = resolved.rammingShield;
      lines.push(
        '',
        'Shield',
        `HP: ${Math.round(this.rammingShieldState.hp)} / ${Math.round(shield.shieldMaxHp)}`,
        `Regen: ${Math.round(shield.shieldRegenRatePerSecond)}/s`,
        `Dash charges: ${this.rammingShieldState.dashCharges} / ${shield.dashMaxCharges}`,
        `Recharge: ${shield.dashChargeRechargeSeconds.toFixed(1)}s`,
        '',
        'Impact',
        `Damage: ${Math.round(shield.baseDamage)}-${Math.round(shield.maxDamage)}`,
        `Dash multiplier: x${shield.dashRamDamageMultiplier.toFixed(1)}`,
        `Cooldown: ${(shield.contactCooldownMs / 1000).toFixed(2)}s`
      );
    }

    const upgradeLines = this.getWeaponUpgradeTooltipLines(weapon);
    if (upgradeLines.length > 0) {
      lines.push('', 'Upgrades', ...upgradeLines);
    }

    return lines;
  }

  private getWeaponUpgradeTooltipLines(weapon: WeaponRegistryEntry): string[] {
    if (weapon.id === 'pulse-cannon') {
      return [
        `Flat damage: +${
          this.getRunUpgradeLevelById('pulse_flat_damage_common') * 5 +
          this.getRunUpgradeLevelById('pulse_flat_damage_uncommon') * 10 +
          this.getRunUpgradeLevelById('pulse_flat_damage_rare') * 15
        }`,
        `Damage multiplier: x${this.getActiveAutoWeaponDamageMultiplier().toFixed(2)}`,
        `Fire rate levels: ${this.getRunUpgradeLevelById('pulse_fire_rate')}`,
        `Velocity levels: ${this.getRunUpgradeLevelById('pulse_velocity')}`,
        `Size levels: ${this.getRunUpgradeLevelById('pulse_size')}`,
        `Pierce levels: ${this.getRunUpgradeLevelById('pulse_pierce')}`
      ];
    }

    if (weapon.id === 'ramming-shield') {
      return [
        `Ram damage levels: ${this.getRunUpgradeLevelById('ram_damage')}`,
        `Shield capacity levels: ${this.getRunUpgradeLevelById('shield_capacity')}`,
        `Shield recharge levels: ${this.getRunUpgradeLevelById('shield_recharge')}`,
        `Impact radius levels: ${this.getRunUpgradeLevelById('impact_radius')}`,
        `Dash recharge levels: ${this.getRunUpgradeLevelById('dash_recharge')}`
      ];
    }

    return [];
  }

  private formatSurvivalTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private getSurvivalElapsedMs(time: number): number {
    const activePauseMs = this.isUpgradeOverlayOpen ? Math.max(0, time - this.upgradeOverlayOpenedAt) : 0;
    const activeDebugPauseMs = this.debugState.debugGamePaused ? Math.max(0, time - this.debugMenuOpenedAt) : 0;
    const activePauseMenuMs = this.isPauseMenuOpen ? Math.max(0, time - this.pauseMenuOpenedAt) : 0;

    return Math.max(
      0,
      time -
        this.runStartedAt -
        this.totalUpgradePauseMs -
        this.totalDebugPauseMs -
        this.totalPauseMenuPauseMs -
        activePauseMs -
        activeDebugPauseMs -
        activePauseMenuMs
    );
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
    const enemyScaling = this.getEnemyTimeScaling(time);
    const spawnDirectorLine = this.debugState.collisionDebugEnabled
      ? `Spawn director: minute ${this.getEnemySpawnDifficultyStep(time)} / active ${this.getActiveEnemyCount()} of ${this.getEnemySpawnMaxActiveEnemies(time)} / next ${(Math.max(0, this.nextEnemySpawnAt - time) / 1000).toFixed(1)}s / swarm ${(Math.max(0, this.nextEnemySwarmAt - time) / 1000).toFixed(1)}s\n` +
        `Enemy scaling: HP x${enemyScaling.hpMultiplier.toFixed(2)} / damage x${enemyScaling.damageMultiplier.toFixed(2)}\n`
      : '';
    const debugWeapon = this.getActivePrimaryWeaponDefinition() ?? this.getEffectiveAutoWeaponDefinition() ?? getWeaponDefinition('pulse-cannon');
    const debugWeaponLine = this.debugState.collisionDebugEnabled
      ? `Debug weapon: ${debugWeapon.displayName} dmg x${this.debugState.weaponDamageMultiplier.toFixed(1)} / fire x${this.debugState.weaponFireRateMultiplier.toFixed(1)} / cooldown ${(this.getWeaponSlotCooldownMs(debugWeapon, debugWeapon.id === this.playerWeapons.activePrimaryWeaponId ? 'primary' : 'auto') / 1000).toFixed(2)}s\n` +
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
        `Upgrades: D${this.getRunUpgradeLevelById('pulse_damage')} F${
          this.getRunUpgradeLevelById('pulse_flat_damage_common') +
          this.getRunUpgradeLevelById('pulse_flat_damage_uncommon') +
          this.getRunUpgradeLevelById('pulse_flat_damage_rare')
        } R${this.getRunUpgradeLevelById('pulse_fire_rate')} V${this.getRunUpgradeLevelById('pulse_velocity')} H${this.getRunUpgradeLevelById('hull-plating')} E${this.getRunUpgradeLevelById('engine-tuning')} C${this.getRunUpgradeLevelById('damage-control')}${this.isUpgradeOverlayOpen ? ' (open)' : ''}\n` +
        `Velocity: ${formatIntegerDisplayUnits(this.playerVelocity.x)}, ${formatIntegerDisplayUnits(this.playerVelocity.y)}\n` +
        `Player shots: ${this.playerProjectiles.length} active, enemy shots: ${this.enemyProjectiles.length}\n` +
        `Debris: ${this.enemyWreckageDebris.length} active\n` +
        `Enemies: ${this.basicEnemies.length} chaser / ${this.shooterEnemies.length} shooter / ${this.tankEnemies.length} tank\n` +
        spawnDirectorLine +
        `Asteroids: ${this.basicAsteroids.length} active\n` +
        `Debug menu: Z ${this.debugMenuHost?.isOpen() ? 'open' : 'closed'} / pause ${this.debugState.debugGamePaused ? 'on' : 'off'} / enemy spawning ${this.debugState.enemySpawningEnabled ? 'on' : 'off'} / invuln ${this.debugState.playerInvulnerable ? 'on' : 'off'}\n` +
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
      if (this.resultsScreen) {
        this.showResultsScreen();
      } else {
        this.updateResultsButton();
      }
      return;
    }

    this.rebuildWorld();
  }
}

