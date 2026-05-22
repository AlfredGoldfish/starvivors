import Phaser from 'phaser';
import asteroidVariant1Url from '../../assets/asteroids/astroid_1.png';
import asteroidVariant2Url from '../../assets/asteroids/astroid_2.png';
import asteroidVariant3Url from '../../assets/asteroids/astroid_3.png';
import asteroidVariant4Url from '../../assets/asteroids/astroid_4.png';
import enemyWreckageDebrisUrl from '../../assets/scraps_debri/debri.png';
import scrapTier1CyanShardUrl from '../../assets/scraps_debri/scrap_tier_1_cyan_shard.png';
import scrapTier2GreenClusterUrl from '../../assets/scraps_debri/scrap_tier_2_green_cluster.png';
import scrapTier3GoldClusterUrl from '../../assets/scraps_debri/scrap_tier_3_gold_cluster.png';
import scrapTier4RedClusterUrl from '../../assets/scraps_debri/scrap_tier_4_red_cluster.png';
import upgradeCratePickupUrl from '../../assets/upgrade_create.png';
import bulwarkShipUrl from '../../assets/ships/bulwark.png';
import rammingShieldUrl from '../../assets/ships/ramming shield.png';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import {
  createArenaSize,
  DEFAULT_SECTOR_SCALE,
  getArenaCenter,
  normalizeSectorScale,
  wrapCoordinate,
  type ArenaSize,
  type SectorScale,
  type ViewportSize
} from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { basicEnemy, shooterEnemy, tankEnemy, type EnemyStatProfile } from '../data/enemies';
import { interceptorMovement } from '../data/balance';
import {
  ASTEROID_IMPACT_DAMAGE_VARIANCE,
  BLACK_HOLE_DAMAGE_VARIANCE,
  ENEMY_PROJECTILE_DAMAGE_VARIANCE,
  PLAYER_WEAPON_DAMAGE_VARIANCE,
  rollDamage,
  type DamageVariance
} from '../data/damageVariance';
import { getEncounterDefinition, type EncounterDefinitionId } from '../data/encounters';
import {
  DEFAULT_MISSION_ID,
  getMissionDefinition,
  isMissionDefinitionId,
  missionRegistry,
  type MissionDefinition,
  type MissionDefinitionId
} from '../data/missions';
import { getRareEventDefinition, isRareEventDefinitionId, type RareEventDefinitionId } from '../data/rareEvents';
import { getWorldEventDefinition, type WorldEventDefinition, type WorldEventDefinitionId } from '../data/worldEvents';
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
  selectWeightedRunUpgrades,
  type RunUpgradeLevels
} from '../systems/runUpgrades';
import { getWeaponDamageMultiplier, resolveWeaponStats, type ResolvedBeamWeaponStats, type ResolvedWeaponStats } from '../systems/weaponStats';
import {
  formatIntegerDisplayUnits,
  toDisplayUnits
} from '../systems/statUnits';
import {
  addDirectionalImpulse,
  applyCollisionImpulse,
  calculateImpactDamage,
  dampVelocityChannel,
  getClosingSpeed,
  getCollisionNormalFromOffset,
  getRelativeVelocity,
  getTotalVelocity,
  steerVelocityToward
} from '../systems/physics';
import {
  applyPlayerFlightAcceleration,
  applyPlayerFlightCoastDamping,
  applyPlayerFlightOverspeedDamping,
  dampPlayerFlightVelocity,
  integratePlayerFlightPosition,
  resolvePlayerFlightControls,
  updatePlayerFacingFromPointer,
  updatePlayerFlightCameraLead,
  wrapPlayerFlightPosition,
  type PlayerFlightControls,
  type PlayerFlightStats
} from '../systems/playerFlight';
import {
  DEFAULT_BLACK_HOLE_VACUUM_TUNING,
  BlackHoleSystem,
  type BlackHoleFieldTuningConfig,
  type BlackHoleVacuumTuning,
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
  normalizeBlackHoleFieldTuning as normalizeBlackHoleFieldTuningDebug,
  parseBlackHoleFieldTuningMarkdown
} from '../systems/debug/blackHoleDebugTuning';
import type { DebugAsteroidTier, DebugEnemyType, DebugPlayerTeleportTarget } from '../systems/debug/debugTypes';
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
  createEncounterDirectorState,
  delayEncounterDirectorState,
  updateEncounterDirector,
  type EncounterDirectorState
} from '../systems/encounterDirector';
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
import { createCommandScreen, createSettingsHubScreen, createSplashScreen } from '../ui/preRunHubScreen';
import { createResultsScreen } from '../ui/resultsScreen';
import { createShipSelectScreen } from '../ui/shipSelectScreen';
import { createShopScreen } from '../ui/shopScreen';
import { createPauseMenuScreen, type PauseMenuTab } from '../ui/pauseMenu';
import { addScreenButton, destroyScreenHandle, type ScreenHandle } from '../ui/screenUi';
import { createSecretControlOverlay, type SecretControlOverlayController, type SecretControlOverlayValues } from '../ui/secretControlOverlay';
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
  createCircleCollisionShape,
  createOrientedCapsuleCollisionShape,
  getCapsuleCircleCollision,
  getCircleCollision,
  scaleHalfExtent,
  scaleRadius
} from '../systems/collisionShapes';
import { GameplayHudSystem, type GameplayHudSnapshot, type WeaponHotbarSlotSnapshot } from '../systems/gameplayHud';
import { MinimapSystem, type MinimapSnapshot } from '../systems/minimap';
import {
  generateSectorLayout,
  getSectorRegionColor,
  getWrappedDistance,
  type SectorLayout,
  type SectorRegion
} from '../systems/sectorGeneration';
import { generateMissionObjective, type MissionObjective } from '../systems/missionGeneration';
import { generateRareEvents, type GeneratedRareEvent } from '../systems/rareEventGeneration';
import {
  createRareEventMinimapMarkers,
  getRareEventProgress,
  updateRareEventInvestigationProgress,
  type RareEventInstance
} from '../systems/rareEventRuntime';
import { createRareEventBody as createRareEventBodySystem } from '../systems/rareEventVisuals';
import {
  getNextSectorScannerLevel,
  getSectorScannerCost,
  isSectorScannerAvailable,
  loadProgressionState,
  saveProgressionState,
  resetProgressionState,
  createDefaultWeaponLoadout,
  type ProgressionState,
  type RewardHookId,
  type WeaponLoadoutState,
  type WeaponMkLevels
} from '../systems/progressionStorage';
import { runProgressionLoadoutMigrationHarness } from '../systems/progressionLoadoutHarness';
import {
  createSectorScannerRuntime,
  getSectorScannerSnapshot,
  getSectorScannerTarget,
  updateSectorScannerRuntime,
  type SectorScannerRuntime,
  type SectorScannerTarget
} from '../systems/sectorScanner';
import { resolveMissionReward, resolveRareEventReward, resolveWorldEventReward } from '../systems/rewardResolver';
import { generateWorldEvents, type GeneratedWorldEvent } from '../systems/worldEventGeneration';
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
  ASTEROID_BREAKUP_GHOST_MS,
  ASTEROID_COLLISION_COOLDOWN_MS,
  ASTEROID_COLLISION_DAMAGE_BY_TIER,
  ASTEROID_COLLISION_IMPULSE_SPEED_SCALE,
  ASTEROID_COLLISION_MAX_IMPULSE,
  ASTEROID_COLLISION_MAX_SEPARATION,
  ASTEROID_COLLISION_MIN_IMPULSE,
  ASTEROID_COLLISION_RESTITUTION,
  ASTEROID_COLLISION_SEPARATION_PERCENT,
  ASTEROID_CONTACT_DAMAGE_BY_TIER,
  ASTEROID_FRAGMENT_COLLISION_GRACE_MS,
  ASTEROID_FRAGMENT_GROW_IN_MS,
  ASTEROID_IMPACT_EXPLOSION_MS,
  ASTEROID_LARGE_BREAKUP_VISUAL_MIN_TIER,
  ASTEROID_MAX_ROTATION_SPEED,
  ASTEROID_MIN_ROTATION_SPEED,
  ASTEROID_SAFE_SPAWN_RADIUS,
  ASTEROID_TIER_CONFIG,
  ASTEROID_TIERS,
  BACKGROUND_TILE_SIZE,
  BASIC_ASTEROID_COUNT,
  BASIC_ENEMY_COUNT,
  BASIC_ENEMY_DISPLAY_SIZE,
  BASIC_ENEMY_TEXTURE_KEY,
  BASIC_ENEMY_VISUAL_ROTATION,
  BASIC_ENEMY_XP_REWARD,
  BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_BASE,
  BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_EXTRA,
  BLACK_HOLE_ASTEROID_WHIRLPOOL_TUNING,
  BLACK_HOLE_CHASER_WHIRLPOOL_TUNING,
  BLACK_HOLE_DEBRIS_WHIRLPOOL_TUNING,
  BLACK_HOLE_ENEMY_FIELD_DAMPING,
  BLACK_HOLE_ENEMY_TIDAL_DAMAGE_BASE,
  BLACK_HOLE_ENEMY_TIDAL_DAMAGE_EXTRA,
  BLACK_HOLE_PLAYER_TIDAL_DAMAGE_BASE,
  BLACK_HOLE_PLAYER_TIDAL_DAMAGE_EXTRA,
  BLACK_HOLE_PLAYER_TIDAL_DAMAGE_INTERVAL_MS,
  BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING,
  BLACK_HOLE_SCRAP_WHIRLPOOL_TUNING,
  BLACK_HOLE_SHOOTER_WHIRLPOOL_TUNING,
  BLACK_HOLE_TANK_WHIRLPOOL_TUNING,
  BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS,
  BLACK_HOLE_ZONE_CENTER_EXCLUSION_RATIO,
  CAMERA_LEAD_LERP,
  CAMERA_LEAD_MAX_DISTANCE,
  CAMERA_LEAD_MIN_SPEED,
  CONTACT_IMPACT_MAX_DAMAGE_MULTIPLIER,
  CONTACT_IMPACT_MIN_DAMAGE_SPEED,
  CONTACT_IMPACT_SPEED_DAMAGE_SCALE,
  DAMAGE_FLASH_MS,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN,
  DEBUG_UPDATE_INTERVAL_MS,
  DEFAULT_STARFIELD_FAR_PARALLAX,
  DEFAULT_STARFIELD_MID_PARALLAX,
  DEFAULT_STARFIELD_NEAR_PARALLAX,
  ENEMY_CONTACT_DAMAGE,
  ENEMY_CONTACT_RECOIL_MS,
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
  ENEMY_SWARM_FIRST_SPAWN_MS,
  ENEMY_SWARM_OVERFLOW_HARD_CAP,
  ENEMY_VELOCITY_RESPONSE,
  ENEMY_WRECKAGE_DEBRIS_CONTACT_DAMAGE,
  ENEMY_WRECKAGE_DEBRIS_COUNT_BY_ENEMY,
  ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE,
  ENEMY_WRECKAGE_DEBRIS_HIT_RADIUS,
  ENEMY_WRECKAGE_DEBRIS_HP,
  ENEMY_WRECKAGE_DEBRIS_INHERITED_VELOCITY,
  ENEMY_WRECKAGE_DEBRIS_LIFETIME_MS,
  ENEMY_WRECKAGE_DEBRIS_MAX_ACTIVE,
  ENEMY_WRECKAGE_DEBRIS_MAX_ROTATION_SPEED,
  ENEMY_WRECKAGE_DEBRIS_MAX_SPEED,
  ENEMY_WRECKAGE_DEBRIS_MIN_ROTATION_SPEED,
  ENEMY_WRECKAGE_DEBRIS_MIN_SPEED,
  ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY,
  FORWARD_THRUSTER_INTERVAL_MS,
  IMPACT_MIN_DAMAGE_SPEED_BY_SOURCE,
  INITIAL_ASTEROID_TIERS,
  INITIAL_XP_THRESHOLD,
  PLAYER_CONTACT_IMPULSE_COOLDOWN_MS,
  PLAYER_CONTACT_MAX_IMPULSE,
  PLAYER_CONTACT_MAX_SEPARATION,
  PLAYER_CONTACT_MIN_IMPULSE,
  PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
  PLAYER_CONTACT_SEPARATION_PERCENT,
  PLAYER_ENEMY_CONTACT_IMPULSE_COOLDOWN_MS,
  PLAYER_ENEMY_CONTACT_MAX_IMPULSE,
  PLAYER_ENEMY_CONTACT_MAX_SEPARATION,
  PLAYER_ENEMY_CONTACT_MIN_IMPULSE,
  PLAYER_ENEMY_CONTACT_RELATIVE_SPEED_SCALE,
  PLAYER_ENEMY_CONTACT_SEPARATION_PERCENT,
  PLAYER_DAMAGE_FLASH_MS,
  PLAYER_DAMAGE_INVULNERABILITY_MS,
  PLAYER_HIT_RADIUS,
  PLAYER_MAX_HULL,
  PLAYER_PROJECTILE_HIT_RADIUS,
  PLAYER_SHIP_DISPLAY_SIZE,
  PLAYER_SHIP_TEXTURE_KEY,
  PLAYER_SHIP_VISUAL_ROTATION,
  RAMMING_SHIELD_COLLIDER_DEPTH,
  RAMMING_SHIELD_TEXTURE_CROP,
  RAMMING_SHIELD_TEXTURE_KEY,
  RUN_FUEL_EMERGENCY_THRUST_MULTIPLIER,
  RUN_FUEL_MAX,
  RUN_FUEL_MAIN_THRUST_DRAIN_PER_SECOND,
  RUN_FUEL_SUPPORT_THRUST_DRAIN_PER_SECOND,
  SCRAP_PICKUP_COLLECT_RADIUS,
  SCRAP_PICKUP_DEBUG_VALUE,
  SCRAP_PICKUP_DISPLAY_SIZE,
  SCRAP_PICKUP_RADIUS,
  SCRAP_PICKUP_TEXTURE_KEY,
  SCRAP_PICKUP_TIER_1_TEXTURE_KEY,
  SCRAP_PICKUP_TIER_2_TEXTURE_KEY,
  SCRAP_PICKUP_TIER_3_TEXTURE_KEY,
  SCRAP_PICKUP_TIER_4_TEXTURE_KEY,
  SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER,
  SCRAP_PICKUP_VALUE_FROM_DEBRIS,
  SCRAP_XP_VALUE_MULTIPLIER,
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

const UPGRADE_OVERLAY_CHOICE_COUNT = 3;
const REROLL_BASE_COST = 5;
const REROLL_DEBUG_BASE_COST = 10;
const DEATH_SHARD_MAX_ACTIVE = 180;
const ASTEROID_DEATH_SHARD_BURST_LIMIT = 24;
const NORMAL_UPGRADE_DROP_CHANCE = 0.08;
const SPECIAL_UPGRADE_DROP_CHANCE = 0.025;
const PICKUP_MAGNET_RADIUS_MULTIPLIER = 4.2;
const SECTOR_STREAM_ACTIVATION_PADDING = 920;
const SECTOR_STREAM_DEACTIVATION_PADDING = 1320;
const WORLD_SQUAD_COUNT = 6;
const WORLD_SQUAD_ACTIVATION_RANGE = 1280;
const WORLD_SQUAD_DISENGAGE_RANGE = 2550;
const WORLD_SQUAD_INACTIVE_UPDATE_MS = 850;
const WORLD_SQUAD_ROAM_SPEED = 34;
const WORLD_SQUAD_PATROL_SPEED = 46;
const SCRAP_ROLLUP_SOFT_LIMIT = 110;
const SCRAP_ROLLUP_HARD_LIMIT = 155;
const SCRAP_ROLLUP_TARGET_LIMIT = 92;
const SCRAP_ROLLUP_INTERVAL_MS = 750;
const SCRAP_ROLLUP_NORMAL_OFFSCREEN_MS = 5000;
const SCRAP_ROLLUP_EMERGENCY_OFFSCREEN_MS = 1500;
const SCRAP_ROLLUP_NEAR_RADIUS = 180;
const SCRAP_ROLLUP_FALLBACK_RADIUS = 620;
const ASTEROID_FRAGMENT_BURST_WINDOW_MS = 500;
const ASTEROID_FRAGMENT_PRESSURE_MAX_SPAWNS = 2;
const ASTEROID_COALESCE_RECIPE_COUNT = 10;
const ASTEROID_COALESCE_SOFT_LIMIT = 650;
const ASTEROID_COALESCE_HARD_LIMIT = 900;
const ASTEROID_COALESCE_TARGET_LIMIT = 560;
const ASTEROID_COALESCE_INTERVAL_MS = 950;
const ASTEROID_COALESCE_NORMAL_OFFSCREEN_MS = 6000;
const ASTEROID_COALESCE_EMERGENCY_OFFSCREEN_MS = 1200;
const ASTEROID_COALESCE_MAX_TIER_NORMAL: AsteroidTier = 3;
const ASTEROID_COALESCE_MAX_TIER_EMERGENCY: AsteroidTier = 4;
const ASTEROID_COALESCE_NEAR_RADIUS = 420;
const BEAM_IGNITION_MS = 140;
const BEAM_SPARK_INTERVAL_MS = 55;
const BEAM_CONTACT_SPARK_MAX_PER_TICK = 4;
const BEAM_RENDER_DEPTH = 9.5;
const UPGRADE_OVERLAY_CARD_HEIGHT = 74;
const UPGRADE_OVERLAY_CARD_GAP = 10;

interface EnemyTimeScaling {
  elapsedMinutes: number;
  difficultyMinute: number;
  progress: number;
  hpMultiplier: number;
  damageMultiplier: number;
}

interface SectorSignalBeacon {
  region: SectorRegion;
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Arc;
  wrapMirrorRing: Phaser.GameObjects.Arc;
}

interface SectorAsteroidSpawn {
  id: string;
  regionId: string;
  x: number;
  y: number;
  tier: AsteroidTier;
  hp: number;
  velocity: Phaser.Math.Vector2;
  breakupProfile?: AsteroidBreakupProfile;
  destroyed: boolean;
}

interface SectorScrapSpawn {
  id: string;
  regionId: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
}

interface SectorSignalSpawn {
  id: string;
  region: SectorRegion;
}

type MissionStatus = 'active' | 'completed' | 'failed';
type MissionFailureReason = 'player-death' | 'run-ended';
type DebugFuelDrainMode = 'thrust-only';
type RunEndReason = 'none' | 'death' | 'eject' | 'mission';
type WeaponRuntimeSlot = 'auto' | 'primary' | 'secondary';

interface BeamSlotRuntime {
  heat: number;
  overheated: boolean;
  nextTickAt: number;
  graphics?: Phaser.GameObjects.Graphics;
  isActive: boolean;
  activationStartedAt: number;
  visualLength: number;
  lastSparkAt: number;
  contactSparkBurstsEmitted: number;
  lastVentAt: number;
}

interface UpgradeOverlayLayout {
  width: number;
  height: number;
  centerX: number;
  panelWidth: number;
  panelHeight: number;
  panelX: number;
  panelY: number;
  cardX: number;
  cardWidth: number;
  cardHeight: number;
  cardGap: number;
}

interface MissionRuntimeState {
  definition: MissionDefinition;
  objective: MissionObjective;
  status: MissionStatus;
  completedAt: number | null;
  failedAt: number | null;
  failureReason: MissionFailureReason | null;
  targetWorldEventId: string | null;
  targetRareEventId: string | null;
}

type WorldEventStatus = 'active' | 'destroyed';

interface WorldEventInstance {
  id: string;
  definition: WorldEventDefinition;
  x: number;
  y: number;
  regionId: string;
  source: GeneratedWorldEvent['source'];
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  hp: number;
  maxHp: number;
  status: WorldEventStatus;
  guardSquadsSpawned: boolean;
  rewardDropped: boolean;
}

type WorldSquadState = 'roam' | 'patrol' | 'guard' | 'pursue' | 'disengage' | 'defeated';

interface WorldSquadInstance {
  id: string;
  squadId: EncounterDefinitionId;
  displayName: string;
  regionId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  patrolX: number;
  patrolY: number;
  heading: number;
  state: WorldSquadState;
  nextUpdateAt: number;
  stateUntil: number;
  activeEnemyIds: string[];
}

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private sectorScale: SectorScale = DEFAULT_SECTOR_SCALE;
  private sectorSeed = '';
  private sectorLayout: SectorLayout = { seed: '', regions: [] };
  private sectorAsteroidSpawns: SectorAsteroidSpawn[] = [];
  private sectorScrapSpawns: SectorScrapSpawn[] = [];
  private sectorSignalSpawns: SectorSignalSpawn[] = [];
  private activeSectorAsteroids = new Map<string, BasicAsteroid>();
  private activeSectorScrapPickups = new Map<string, ScrapPickup>();
  private activeSectorSignals = new Map<string, SectorSignalBeacon>();
  private sectorAsteroidIds = new WeakMap<BasicAsteroid, string>();
  private sectorScrapIds = new WeakMap<ScrapPickup, string>();
  private sectorSignalBeacons: SectorSignalBeacon[] = [];
  private worldSquads: WorldSquadInstance[] = [];
  private selectedMissionId: MissionDefinitionId = DEFAULT_MISSION_ID;
  private missionRuntime?: MissionRuntimeState;
  private missionObjectiveBeacon?: Phaser.GameObjects.Container;
  private missionObjectiveBeaconRing?: Phaser.GameObjects.Arc;
  private missionObjectiveBeaconCore?: Phaser.GameObjects.Arc;
  private worldEvents: WorldEventInstance[] = [];
  private rareEvents: RareEventInstance[] = [];
  private nextScrapRollupAt = 0;
  private nextAsteroidCoalesceAt = 0;
  private asteroidDestructionHistory: number[] = [];
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private rammingShieldImage?: Phaser.GameObjects.Image;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private cameraLead = new Phaser.Math.Vector2(0, 0);
  private fuel = RUN_FUEL_MAX;
  private debugFuelDrainEnabled = true;
  private debugFuelDrainMode: DebugFuelDrainMode = 'thrust-only';
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
  private ejectConfirmScreen?: ScreenHandle;
  private pauseMenuTab: PauseMenuTab = 'pause';
  private starfield!: StarfieldSystem;
  private gameSettings: GameSettings = loadGameSettings();
  private controlKeys = new Map<string, Phaser.Input.Keyboard.Key>();
  private awaitingBinding?: { action: RunControlAction; slot: BindingSlot };
  private debugMenuKey!: Phaser.Input.Keyboard.Key;
  private secretControlKey!: Phaser.Input.Keyboard.Key;
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
  private gameFlowState: GameFlowState = 'splash';
  private selectedShipId: ShipId = DEFAULT_SHIP_ID;
  private hangarPreviewShipId: ShipId = DEFAULT_SHIP_ID;
  private unlockedShipIds = new Set<ShipId>([DEFAULT_SHIP_ID]);
  private selectedSkinIds: Partial<Record<ShipId, string>> = {};
  private weaponLoadout: WeaponLoadoutState = createDefaultWeaponLoadout();
  private weaponMkLevels: WeaponMkLevels = {};
  private selectedHangarWeaponId: WeaponId | null = 'pulse-cannon';
  private hangarInventoryScrollIndex = 0;
  private progressionState: ProgressionState = loadProgressionState();
  private playerHull = PLAYER_MAX_HULL;
  private rammingShieldState: RammingShieldRuntimeState = createRammingShieldRuntimeState(false);
  private runScrapTotal = 0;
  private runScrapSpent = 0;
  private lastRunScrapTotal = 0;
  private totalCredits = 0;
  private lastRunCreditsEarned = 0;
  private lastRunScrapSpent = 0;
  private lastRunScrapConverted = 0;
  private lastRunUnlockedRewards: RewardHookId[] = [];
  private hasPaidRunCredits = false;
  private lastRunSurvivalMs = 0;
  private playerInvulnerableUntil = 0;
  private debugPlayerCollisionDamageImmune = false;
  private rammingShieldDashBurstRemaining = 0;
  private rammingShieldDashBurstSpeed = 0;
  private rammingShieldDashBurstDirection = new Phaser.Math.Vector2(0, 0);
  private rammingShieldLastBashEffectsUntil = 0;
  private emergencyBracingUntil = 0;
  private nextEmergencyBracingAt = 0;
  private beamSlots: Record<WeaponRuntimeSlot, BeamSlotRuntime> = {
    auto: { heat: 0, overheated: false, nextTickAt: 0, isActive: false, activationStartedAt: 0, visualLength: 0, lastSparkAt: 0, contactSparkBurstsEmitted: 0, lastVentAt: 0 },
    primary: { heat: 0, overheated: false, nextTickAt: 0, isActive: false, activationStartedAt: 0, visualLength: 0, lastSparkAt: 0, contactSparkBurstsEmitted: 0, lastVentAt: 0 },
    secondary: { heat: 0, overheated: false, nextTickAt: 0, isActive: false, activationStartedAt: 0, visualLength: 0, lastSparkAt: 0, contactSparkBurstsEmitted: 0, lastVentAt: 0 }
  };
  private isPlayerDead = false;
  private runEndReason: RunEndReason = 'none';
  private playerXp = 0;
  private nextXpThreshold = INITIAL_XP_THRESHOLD;
  private bankedUpgrades = 0;
  private rerollsThisRun = 0;
  private debugRerollCostBase = REROLL_BASE_COST;
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
  private encounterDirectorState: EncounterDirectorState = createEncounterDirectorState();
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
  private secretControlOverlay?: SecretControlOverlayController;
  private debugMenuOpenedAt = 0;
  private totalDebugPauseMs = 0;
  private permanentUpgradeLevels: Record<PermanentUpgradeId, number> = { ...this.progressionState.permanentUpgradeLevels };
  private activePermanentUpgradeLevels: Record<PermanentUpgradeId, number> = { ...this.progressionState.activePermanentUpgradeLevels };
  private sectorScannerRuntime: SectorScannerRuntime = createSectorScannerRuntime();
  private upgradeOverlayBlocker!: Phaser.GameObjects.Zone;
  private upgradeOverlayGraphics!: Phaser.GameObjects.Graphics;
  private upgradeOverlayText!: Phaser.GameObjects.Text;
  private upgradeOverlayPromptText!: Phaser.GameObjects.Text;
  private upgradeOverlayChoiceTexts: Phaser.GameObjects.Text[] = [];
  private upgradeOverlayChoiceMetaTexts: Phaser.GameObjects.Text[] = [];
  private upgradeOverlayChoiceHitZones: Phaser.GameObjects.Zone[] = [];
  private normalUpgradeOverlayChoices: UpgradeOverlayChoice[] | null = null;
  private specialUpgradeOverlayChoices: UpgradeDefinition[] | null = null;
  private sectorScannerArrow?: Phaser.GameObjects.Graphics;
  private nextDebugMenuRefreshAt = 0;
  private isDebugMenuRefreshDirty = true;
  private minimap!: MinimapSystem;
  private debugBlackHoleInfluenceRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleDamageRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleVisualScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleCoreScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
  private debugBlackHoleFieldTuning: BlackHoleFieldTuningConfig = { ...DEFAULT_BLACK_HOLE_FIELD_TUNING };
  private debugBlackHoleVacuumTuning: BlackHoleVacuumTuning = { ...DEFAULT_BLACK_HOLE_VACUUM_TUNING };
  private isBlackHolePlayerCaptureEnabled = true;
  private isBlackHoleObjectConsumptionEnabled = true;
  private areBlackHoleWarningVisualsEnabled = true;
  private blackHolePlayerCaptureStartedAt: number | null = null;
  private blackHoleConsumedObjectsThisRun = 0;
  private debugBlackHoleGrowthOffsetMs = 0;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    for (const asteroidTexture of ASTEROID_TEXTURES) {
      this.load.image(asteroidTexture.key, asteroidTexture.url);
    }

    this.load.image(ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY, enemyWreckageDebrisUrl);
    this.load.image(SCRAP_PICKUP_TEXTURE_KEY, scrapTier1CyanShardUrl);
    this.load.image(SCRAP_PICKUP_TIER_1_TEXTURE_KEY, scrapTier1CyanShardUrl);
    this.load.image(SCRAP_PICKUP_TIER_2_TEXTURE_KEY, scrapTier2GreenClusterUrl);
    this.load.image(SCRAP_PICKUP_TIER_3_TEXTURE_KEY, scrapTier3GoldClusterUrl);
    this.load.image(SCRAP_PICKUP_TIER_4_TEXTURE_KEY, scrapTier4RedClusterUrl);
    this.load.image(UPGRADE_CRATE_PICKUP_TEXTURE_KEY, upgradeCratePickupUrl);
    this.load.image(PLAYER_SHIP_TEXTURE_KEY, playerShipUrl);
    this.load.image('player-ship-bulwark', bulwarkShipUrl);
    this.load.image(RAMMING_SHIELD_TEXTURE_KEY, rammingShieldUrl);
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
      assignWeaponSlot: (slot, weaponId) => this.assignWeaponHotbarSlot(slot, weaponId),
      requestEject: () => this.openEjectConfirmation()
    });
    this.collisionDebugOverlay = new CollisionDebugOverlaySystem({
      scene: this,
      getNearestWrappedRenderCoordinate: (value, cameraCenter, arenaSize) =>
        this.getNearestWrappedRenderCoordinate(value, cameraCenter, arenaSize),
      getNearestWrappedRenderPosition: (x, y) => this.getNearestWrappedRenderPosition(x, y),
      isCircleInCameraView: (x, y, radius) => this.isCircleInCameraView(x, y, radius),
      getForwardDirection: (rotation) => this.getForwardDirection(rotation)
    });
    this.createInput();
    this.createBackgroundTextures();
    this.applyProgressionState(loadProgressionState());
    this.showSplashScreen();
    this.installTestHarness();
    this.autoRunDiagnostics.installGlobalHandlers();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(time: number, delta: number): void {
    this.beginPerformanceFrame(time, delta);
    this.profileStep('debug-menu-input', () => this.updateDebugMenuInput(time));
    this.profileStep('secret-control-input', () => this.updateSecretControlInput(time));

    if (this.isPreRunFlowState()) {
      this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
      this.profileStep('secret-control-refresh', () => this.refreshSecretControlOverlay());
      this.endPerformanceFrame();
      return;
    }

    this.profileStep('upgrade-overlay-input', () => this.updateUpgradeOverlayInput(time));
    this.profileStep('pause-menu-input', () => this.updatePauseMenuInput(time));

    if (this.isUpgradeOverlayOpen) {
      this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
      this.profileStep('secret-control-refresh', () => this.refreshSecretControlOverlay());
      this.profileStep('background', () => this.updateBackgroundTiles(time));
      this.profileStep('hud', () => this.updateGameplayHud(time));
      this.profileStep('minimap', () => this.updateMinimap());
      this.profileStep('debug-text', () => this.updateDebugText(time));
      this.endPerformanceFrame();
      return;
    }

    if (this.isPauseMenuOpen) {
      this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
      this.profileStep('secret-control-refresh', () => this.refreshSecretControlOverlay());
      this.profileStep('background', () => this.updateBackgroundTiles(time));
      this.profileStep('hud', () => this.updateGameplayHud(time));
      this.profileStep('minimap', () => this.updateMinimap());
      this.profileStep('debug-text', () => this.updateDebugText(time));
      this.endPerformanceFrame();
      return;
    }

    if (this.gameFlowState === 'results') {
      this.profileStep('debug-menu-refresh', () => this.refreshDebugMenu(time));
      this.profileStep('secret-control-refresh', () => this.refreshSecretControlOverlay());
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
      this.profileStep('world-squads', () => this.updateWorldSquads(time, deltaSeconds));
      this.profileStep('world-events', () => this.updateWorldEvents(time));
      this.profileStep('rare-events', () => this.updateRareEvents(time, deltaSeconds));
      this.profileStep('sector-scanner', () => this.updateSectorScanner(deltaSeconds));
      this.profileStep('live-enemies', () => this.updateLiveEnemies(time, deltaSeconds));
      this.profileStep('sector-streaming', () => this.updateSectorStreaming());
      this.profileStep('asteroids', () => this.updateBasicAsteroids(deltaSeconds));
      this.profileStep('sector-signals', () => this.updateSectorSignalBeacons(time));
      this.profileStep('black-hole', () => this.updateBlackHole(time, deltaSeconds, true));
      this.profileStep('debris', () => this.updateEnemyWreckageDebris(time, deltaSeconds));
      this.profileStep('death-shards', () => this.updateDeathShards(delta));
      this.profileStep('world-impacts', () => this.resolveWorldImpactCollisions(time));
      if (!this.isPlayerDead) {
        this.profileStep('player-wrap', () => this.wrapPlayer());
        this.profileStep('camera-lead', () => this.updateCameraLead());
        this.profileStep('mission', () => this.updateMission(time));
      }
      this.profileStep('scrap-pickups', () => this.updateScrapPickups(time, deltaSeconds));
      if (!this.isPlayerDead) {
        this.profileStep('black-hole-player-collision', () => this.updateBlackHolePlayerCollision());
        this.profileStep('player-contact', () => this.updatePlayerContactDamage(time));
        this.profileStep('ramming-shield', () => this.updateRammingShield(time, deltaSeconds));
        this.profileStep('active-main-weapon', () => this.updateActiveMainWeapon(time, deltaSeconds));
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
    this.profileStep('secret-control-refresh', () => this.refreshSecretControlOverlay());
    this.profileStep('debug-text', () => this.updateDebugText(time));
    this.endPerformanceFrame();
  }

  private isPreRunFlowState(): boolean {
    return (
      this.gameFlowState === 'splash' ||
      this.gameFlowState === 'command' ||
      this.gameFlowState === 'shipSelect' ||
      this.gameFlowState === 'shop' ||
      this.gameFlowState === 'settings'
    );
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for the STARVIVORS scaffold.');
    }

    this.input.mouse?.disableContextMenu();
    this.rebuildControlKeys();
    this.debugMenuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.secretControlKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F10);
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
        spawnEncounter: (id) => this.runDebugMenuAction(() => this.spawnDebugEncounter(id)),
        clearEnemies: () => this.runDebugMenuAction(() => this.clearEnemies()),
        toggleAsteroidSpawning: () => this.runDebugMenuAction(() => {
          this.debugState.asteroidSpawningEnabled = false;
        }),
        spawnAsteroid: (tier) => this.runDebugMenuAction(() => this.spawnDebugAsteroid(tier)),
        clearAsteroids: () => this.runDebugMenuAction(() => this.clearAsteroids()),
        adjustAsteroidFragmentSoftCap: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustAsteroidFragmentSoftCap(delta)),
        adjustAsteroidFragmentHardCap: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustAsteroidFragmentHardCap(delta)),
        adjustAsteroidFragmentBurstLimit: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustAsteroidFragmentBurstLimit(delta)),
        setAsteroidFragmentSoftCap: (value) =>
          this.runDebugMenuAction(() => this.debugState.setAsteroidFragmentSoftCap(value)),
        setAsteroidFragmentHardCap: (value) =>
          this.runDebugMenuAction(() => this.debugState.setAsteroidFragmentHardCap(value)),
        setAsteroidFragmentBurstLimit: (value) =>
          this.runDebugMenuAction(() => this.debugState.setAsteroidFragmentBurstLimit(value)),
        adjustDebugAsteroidSpawnCount: (delta) =>
          this.runDebugMenuAction(() => this.debugState.adjustDebugAsteroidSpawnCount(delta)),
        setDebugAsteroidSpawnCount: (value) =>
          this.runDebugMenuAction(() => this.debugState.setDebugAsteroidSpawnCount(value)),
        resetDebugAsteroidSpawnCount: () =>
          this.runDebugMenuAction(() => this.debugState.resetDebugAsteroidSpawnCount()),
        resetAsteroidFragmentTuning: () =>
          this.runDebugMenuAction(() => this.debugState.resetAsteroidFragmentTuning()),
        spawnDebris: () => this.runDebugMenuAction(() => this.spawnDebugEnemyWreckageDebris()),
        clearDebris: () => this.runDebugMenuAction(() => this.clearEnemyWreckageDebris()),
        spawnScrap: () => this.runDebugMenuAction(() => this.spawnDebugScrapPickup()),
        clearScrap: () => this.runDebugMenuAction(() => this.clearScrapPickups()),
        addScrap: (amount) => this.runDebugMenuAction(() => this.addRunScrap(amount)),
        addCredits: (amount) => this.runDebugMenuAction(() => this.addDebugCredits(amount)),
        toggleRerollDebugCost: () => this.runDebugMenuAction(() => {
          this.debugRerollCostBase = this.debugRerollCostBase === REROLL_BASE_COST ? REROLL_DEBUG_BASE_COST : REROLL_BASE_COST;
        }),
        clearPlayerProjectiles: () => this.runDebugMenuAction(() => this.clearPlayerProjectiles()),
        clearEnemyProjectiles: () => this.runDebugMenuAction(() => this.clearEnemyProjectiles()),
        restorePlayerHull: () => this.runDebugMenuAction(() => this.restorePlayerHull()),
        healPlayer: (amount) => this.runDebugMenuAction(() => this.debugHealPlayer(amount)),
        damagePlayerForDebug: (amount) => this.runDebugMenuAction(() => this.debugDamagePlayer(amount)),
        togglePlayerInvulnerability: () => this.runDebugMenuAction(() => {
          this.debugState.playerInvulnerable = !this.debugState.playerInvulnerable;
          if (this.debugState.playerInvulnerable) {
            this.playerInvulnerableUntil = Number.MAX_SAFE_INTEGER;
          } else {
            this.playerInvulnerableUntil = 0;
          }
        }),
        togglePlayerCollisionDamageImmunity: () => this.runDebugMenuAction(() => {
          this.debugPlayerCollisionDamageImmune = !this.debugPlayerCollisionDamageImmune;
        }),
        killPlayer: () => this.runDebugMenuAction(() => this.killPlayer()),
        stopPlayerVelocity: () => this.runDebugMenuAction(() => this.debugStopPlayerVelocity()),
        teleportPlayer: (target) => this.runDebugMenuAction(() => this.debugTeleportPlayer(target)),
        nudgePlayer: (dx, dy) => this.runDebugMenuAction(() => this.debugNudgePlayer(dx, dy)),
        addPlayerXp: (amount) => this.runDebugMenuAction(() => this.grantXp(amount)),
        addBankedUpgrade: (amount) => this.runDebugMenuAction(() => this.debugAddBankedUpgrade(amount)),
        clearBankedUpgrades: () => this.runDebugMenuAction(() => {
          this.bankedUpgrades = 0;
          this.updateGameplayHud(this.time.now);
          this.updateUpgradeButton();
        }),
        resetWeaponCooldowns: () => this.runDebugMenuAction(() => this.debugResetWeaponCooldowns()),
        refillRammingShield: () => this.runDebugMenuAction(() => this.debugRefillRammingShield()),
        unlockSecretControls: () => this.runDebugMenuAction(() => this.unlockSecretControls()),
        refillFuel: () => this.runDebugMenuAction(() => this.refillFuel()),
        emptyFuel: () => this.runDebugMenuAction(() => this.emptyFuel()),
        toggleFuelDrain: () => this.runDebugMenuAction(() => {
          this.debugFuelDrainEnabled = !this.debugFuelDrainEnabled;
        }),
        toggleFuelDrainMode: () => this.runDebugMenuAction(() => {
          this.debugFuelDrainMode = 'thrust-only';
        }),
        adjustPlayerThrustScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerThrustScale(delta)),
        adjustPlayerBrakeScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerBrakeScale(delta)),
        adjustPlayerStrafeScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerStrafeScale(delta)),
        adjustPlayerInertiaScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustPlayerInertiaScale(delta)),
        adjustEnemySpeedScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustEnemySpeedScale(delta)),
        adjustEnemyResponseScale: (delta) => this.runDebugMenuAction(() => this.debugState.adjustEnemyResponseScale(delta)),
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
        toggleAsteroidDamageFlash: () => this.runDebugMenuAction(() => {
          this.debugState.asteroidDamageFlashEnabled = !this.debugState.asteroidDamageFlashEnabled;
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
        toggleBlackHolePlayerCapture: () => this.runDebugMenuAction(() => {
          this.isBlackHolePlayerCaptureEnabled = !this.isBlackHolePlayerCaptureEnabled;
          if (!this.isBlackHolePlayerCaptureEnabled) {
            this.blackHolePlayerCaptureStartedAt = null;
          }
        }),
        toggleBlackHoleObjectConsumption: () => this.runDebugMenuAction(() => {
          this.isBlackHoleObjectConsumptionEnabled = !this.isBlackHoleObjectConsumptionEnabled;
        }),
        toggleBlackHoleWarningVisuals: () => this.runDebugMenuAction(() => {
          this.areBlackHoleWarningVisualsEnabled = !this.areBlackHoleWarningVisualsEnabled;
        }),
        moveBlackHoleToPlayer: () => this.runDebugMenuAction(() => this.moveBlackHoleNearPlayer(0)),
        moveBlackHoleAwayFromPlayer: () => this.runDebugMenuAction(() => this.moveBlackHoleNearPlayer(720)),
        resetBlackHoleGrowth: () => this.runDebugMenuAction(() => {
          this.debugBlackHoleGrowthOffsetMs = -this.getSurvivalElapsedMs(this.time.now);
        }),
        addBlackHoleGrowthMinutes: (minutes) => this.runDebugMenuAction(() => {
          this.debugBlackHoleGrowthOffsetMs += minutes * 60 * 1000;
        }),
        forceBlackHoleCaptureTest: () => this.runDebugMenuAction(() => {
          this.moveBlackHoleNearPlayer(this.blackHole?.captureRadius ? this.blackHole.captureRadius - 18 : 150);
          this.blackHolePlayerCaptureStartedAt = this.time.now;
        }),
        forceBlackHoleEscapeTest: () => this.runDebugMenuAction(() => {
          this.blackHolePlayerCaptureStartedAt = null;
          this.moveBlackHoleNearPlayer((this.blackHole?.captureRadius ?? 200) + 80);
        }),
        adjustBlackHoleVacuumTuning: (key, delta) => this.runDebugMenuAction(() => this.adjustBlackHoleVacuumTuning(key, delta)),
        adjustBlackHoleInfluenceRadius: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleInfluenceRadius(delta)),
        adjustBlackHoleDamageRadius: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleDamageRadius(delta)),
        adjustBlackHoleVisualScale: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleVisualScale(delta)),
        adjustBlackHoleCoreScale: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleCoreScale(delta)),
        adjustBlackHoleRadialStrength: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleRadialStrength(delta)),
        adjustBlackHoleRadialCurve: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleRadialCurve(delta)),
        adjustBlackHoleSwirlStrength: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleSwirlStrength(delta)),
        adjustBlackHoleSwirlCurve: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleSwirlCurve(delta)),
        adjustBlackHoleMaxVelocity: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleMaxVelocity(delta)),
        adjustBlackHoleViscosityStrength: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleViscosityStrength(delta)),
        adjustBlackHoleViscosityCurve: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleViscosityCurve(delta)),
        adjustBlackHoleInnerDrag: (delta) => this.runDebugMenuAction(() => this.adjustBlackHoleInnerDrag(delta)),
        adjustBlackHolePlayerResistance: (delta) => this.runDebugMenuAction(() => this.adjustBlackHolePlayerResistance(delta)),
        saveBlackHoleFieldTuning: () => this.runDebugMenuAction(() => this.saveBlackHoleFieldTuning()),
        loadBlackHoleFieldTuning: () => this.runDebugMenuAction(() => this.loadBlackHoleFieldTuning()),
        resetBlackHoleTuning: () => this.runDebugMenuAction(() => this.resetBlackHoleTuning())
      }
    });
    this.debugMenuHost.create();
  }

  private runDebugMenuAction(action: () => void): void {
    action();
    this.isDebugMenuRefreshDirty = true;
    this.refreshDebugMenu(this.time.now, true);
    this.refreshSecretControlOverlay();
    this.updateCollisionDebugOverlay();
  }

  private addDebugCredits(amount: number): void {
    const shouldReopenDebugMenu = this.debugMenuHost?.isOpen() ?? false;
    this.totalCredits = Math.max(0, this.totalCredits + amount);
    this.saveProgression();

    if (this.gameFlowState === 'command' || this.gameFlowState === 'splash' || this.gameFlowState === 'settings') {
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
    delayEncounterDirectorState(this.encounterDirectorState, pauseDurationMs);
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
      chasers: this.getLiveEnemyLegacyCount('chaser'),
      shooters: this.getLiveEnemyLegacyCount('shooter'),
      tanks: this.getLiveEnemyLegacyCount('tank'),
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
      runTimeSeconds: this.getSurvivalElapsedMs(time) / 1000,
      selectedShipName: this.getSelectedShipDefinition().displayName,
      activeWeaponName: this.getActivePrimaryWeaponDefinition()?.displayName ?? this.getEffectiveAutoWeaponDefinition()?.displayName ?? 'None',
      playerXp: this.playerXp,
      nextXpThreshold: this.nextXpThreshold,
      bankedUpgrades: this.bankedUpgrades,
      weaponCooldownSeconds: this.getActiveAutoWeaponCooldownMs() / 1000,
      ...this.starfield.getDebugValues(),
      blackHoleInfluenceRadiusScale: this.debugBlackHoleInfluenceRadiusScale,
      blackHoleDamageRadiusScale: this.debugBlackHoleDamageRadiusScale,
      blackHoleVisualScale: this.debugBlackHoleVisualScale,
      blackHoleCoreScale: this.debugBlackHoleCoreScale,
      blackHoleRadialStrengthMultiplier: this.debugBlackHoleFieldTuning.radialStrengthMultiplier,
      blackHoleRadialCurve: this.debugBlackHoleFieldTuning.radialCurve,
      blackHoleSwirlStrengthMultiplier: this.debugBlackHoleFieldTuning.swirlStrengthMultiplier,
      blackHoleSwirlCurve: this.debugBlackHoleFieldTuning.swirlCurve,
      blackHoleMaxVelocityMultiplier: this.debugBlackHoleFieldTuning.maxVelocityMultiplier,
      blackHoleViscosityStrength: this.debugBlackHoleFieldTuning.viscosityStrength,
      blackHoleViscosityCurve: this.debugBlackHoleFieldTuning.viscosityCurve,
      blackHoleInnerDrag: this.debugBlackHoleFieldTuning.innerDrag,
      blackHolePlayerResistance: this.debugBlackHoleFieldTuning.playerResistance,
      blackHoleActive: Boolean(this.blackHole),
      blackHoleX: this.blackHole?.body.x ?? 0,
      blackHoleY: this.blackHole?.body.y ?? 0,
      blackHoleRunAgeSeconds: this.getBlackHoleGrowthElapsedSeconds(time),
      blackHoleEventHorizonRadius: this.blackHole?.eventHorizonRadius ?? this.debugBlackHoleVacuumTuning.baseEventHorizonRadius,
      blackHoleCaptureRadius: this.blackHole?.captureRadius ?? this.debugBlackHoleVacuumTuning.baseEventHorizonRadius + this.debugBlackHoleVacuumTuning.captureMargin,
      blackHoleWarningRadius: this.blackHole?.warningRadius ?? this.debugBlackHoleVacuumTuning.baseEventHorizonRadius + this.debugBlackHoleVacuumTuning.captureMargin + this.debugBlackHoleVacuumTuning.warningMargin,
      blackHoleGrowthPercent: this.blackHole?.growthPercent ?? 0,
      blackHolePlayerCaptured: this.blackHolePlayerCaptureStartedAt !== null,
      blackHoleCaptureTimerRemainingMs: this.getBlackHoleCaptureTimerRemainingMs(time),
      blackHoleConsumedObjects: this.blackHoleConsumedObjectsThisRun,
      blackHolePlayerCaptureEnabled: this.isBlackHolePlayerCaptureEnabled,
      blackHoleObjectConsumptionEnabled: this.isBlackHoleObjectConsumptionEnabled,
      blackHoleWarningVisualsEnabled: this.areBlackHoleWarningVisualsEnabled,
      blackHoleBaseEventHorizonRadius: this.debugBlackHoleVacuumTuning.baseEventHorizonRadius,
      blackHoleMaxEventHorizonRadius: this.debugBlackHoleVacuumTuning.maxEventHorizonRadius,
      blackHoleGrowthPerMinute: this.debugBlackHoleVacuumTuning.growthPerMinute,
      blackHoleCaptureMargin: this.debugBlackHoleVacuumTuning.captureMargin,
      blackHoleWarningMargin: this.debugBlackHoleVacuumTuning.warningMargin,
      blackHolePlayerCaptureDurationMs: this.debugBlackHoleVacuumTuning.playerCaptureDurationMs,
      blackHolePlayerPullStrength: this.debugBlackHoleVacuumTuning.playerPullStrength,
      blackHoleObjectPullStrength: this.debugBlackHoleVacuumTuning.objectPullStrength,
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
      runScrapSpent: this.runScrapSpent,
      totalCredits: this.totalCredits,
      nextRerollCost: this.getNextRerollCost(),
      debugRerollCostBase: this.debugRerollCostBase,
      playerProjectiles: this.playerProjectiles.length,
      enemyProjectiles: this.enemyProjectiles.length,
      playerHull: this.playerHull,
      playerMaxHull: this.getPlayerMaxHull(),
      playerAlive: !this.isPlayerDead,
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      playerVelocityX: this.playerVelocity.x,
      playerVelocityY: this.playerVelocity.y,
      playerCollisionDamageImmune: this.debugPlayerCollisionDamageImmune,
      missionObjectiveDistance: this.getMissionObjectiveDistance(),
      secretControlUnlocked: this.progressionState.secretControlUnlocked,
      fuel: this.fuel,
      fuelMax: RUN_FUEL_MAX,
      fuelDrainEnabled: this.debugFuelDrainEnabled,
      fuelDrainMode: this.debugFuelDrainMode,
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
        bulwark: this.debugState.getShipTuningSummary(getShipDefinition('bulwark')),
        engineer: this.debugState.getShipTuningSummary(getShipDefinition('engineer'))
      },
      weaponTuningSummaries: {
        'pulse-cannon': this.debugState.getWeaponTuningSummary(getWeaponDefinition('pulse-cannon')),
        'ramming-shield': this.debugState.getWeaponTuningSummary(getWeaponDefinition('ramming-shield')),
        'salvage-beam': this.debugState.getWeaponTuningSummary(getWeaponDefinition('salvage-beam'))
      },
      nextEnemySpawnSeconds: Math.max(0, Math.min(this.nextEnemySpawnAt, this.encounterDirectorState.nextEncounterAt) - time) / 1000
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
        this.saveProgression();
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
          this.hangarPreviewShipId = ship.id;
          this.ensureSelectedShipStartingWeaponAvailable(ship);
        }

        return this.getTestHarnessState();
      },
      selectMission: (missionId: MissionDefinitionId) => {
        if (isMissionDefinitionId(missionId)) {
          this.selectedMissionId = missionId;
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
        const enemy = this.liveEnemies[0];

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
        const enemy = this.liveEnemies[0];

        if (enemy && !this.isPlayerDead) {
          this.destroyLiveEnemyWithRewards(enemy, 0);
        }

        return this.getTestHarnessState();
      },
      destroyFirstAsteroid: () => {
        if (this.basicAsteroids.length > 0 && !this.isPlayerDead) {
          this.destroyBasicAsteroid(0);
        }

        return this.getTestHarnessState();
      },
      destroyFirstWorldEvent: () => {
        const event = this.worldEvents.find((candidate) => candidate.status === 'active');
        if (event && !this.isPlayerDead) {
          this.destroyWorldEvent(event);
          this.updateMission(this.time.now + 1);
        }

        return this.getTestHarnessState();
      },
      collectAllScrap: () => {
        for (const scrap of [...this.scrapPickups]) {
          if (scrap.kind !== 'scrap') {
            continue;
          }

          this.collectScrapPickup(scrap);
          const index = this.scrapPickups.indexOf(scrap);
          if (index >= 0) {
            this.scrapPickups.splice(index, 1);
          }
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
      requestEject: () => {
        this.openEjectConfirmation();
        return this.getTestHarnessState();
      },
      cancelEject: () => {
        this.closeEjectConfirmation();
        return this.getTestHarnessState();
      },
      confirmEject: () => {
        this.confirmEject();
        return this.getTestHarnessState();
      },
      continueRun: () => {
        this.continueCurrentRun();
        return this.getTestHarnessState();
      },
      refillFuel: () => {
        this.refillFuel();
        return this.getTestHarnessState();
      },
      emptyFuel: () => {
        this.emptyFuel();
        return this.getTestHarnessState();
      },
      toggleFuelDrain: () => {
        this.debugFuelDrainEnabled = !this.debugFuelDrainEnabled;
        return this.getTestHarnessState();
      },
      toggleFuelDrainMode: () => {
        this.debugFuelDrainMode = 'thrust-only';
        return this.getTestHarnessState();
      },
      resetProgression: () => {
        this.applyProgressionState(resetProgressionState());
        return this.getTestHarnessState();
      },
      unlockRewardHook: (hook: string) => {
        this.recordUnlockedRewards([hook as RewardHookId]);
        return this.getTestHarnessState();
      },
      purchaseSectorScanner: () => {
        this.purchaseSectorScanner();
        return this.getTestHarnessState();
      },
      fastForwardScanner: () => {
        this.updateSectorScanner(5 * 60);
        this.updateMinimap();
        this.updateGameplayHud(this.time.now);
        return this.getTestHarnessState();
      },
      addRunScrap: (amount: number) => {
        this.addRunScrap(amount);
        return this.getTestHarnessState();
      },
      rerollUpgrades: () => {
        this.rerollUpgradeOverlayChoices();
        return this.getTestHarnessState();
      },
      toggleRerollDebugCost: () => {
        this.debugRerollCostBase = this.debugRerollCostBase === REROLL_BASE_COST ? REROLL_DEBUG_BASE_COST : REROLL_BASE_COST;
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

    if (query.get('testHarness') === 'phase7') {
      this.runTestHarnessPhase7();
    }

    if (query.get('testHarness') === 'phase8') {
      this.runTestHarnessPhase8();
    }

    if (query.get('testHarness') === 'phase9') {
      this.runTestHarnessPhase9();
    }

    if (query.get('testHarness') === 'phase10') {
      this.runTestHarnessPhase10();
    }

    if (query.get('testHarness') === 'phase10_5') {
      this.runTestHarnessPhase10_5();
    }

    if (query.get('testHarness') === 'phase10_6') {
      this.runTestHarnessPhase10_6();
    }

    if (query.get('testHarness') === 'phase11') {
      this.runTestHarnessPhase11();
    }

    if (query.get('testHarness') === 'phase12') {
      this.runTestHarnessPhase12();
    }

    if (query.get('testHarness') === 'phase13') {
      this.runTestHarnessPhase13();
    }

    if (query.get('testHarness') === 'phase14') {
      this.runTestHarnessPhase14();
    }

    if (query.get('testHarness') === 'phase15A') {
      this.runTestHarnessPhase15A();
    }

    if (query.get('testHarness') === 'phase15B') {
      this.runTestHarnessPhase15B();
    }

    if (query.get('testHarness') === 'phase15_5') {
      this.runTestHarnessPhase15_5();
    }

    if (query.get('testHarness') === 'upgradeOverlayUi') {
      this.runTestHarnessUpgradeOverlayUi();
    }

    if (query.get('testHarness') === 'beamVisual') {
      this.runTestHarnessBeamVisual();
    }

    if (query.get('testHarness') === 'beamTipScreenshot') {
      this.runTestHarnessBeamTipScreenshot();
    }

    if (query.get('testHarness') === 'resultsContinueFuel') {
      this.runTestHarnessResultsContinueFuel();
    }

    if (query.get('testHarness') === 'asteroidStaleDestroy') {
      this.runTestHarnessAsteroidStaleDestroy();
    }

    if (query.get('testHarness') === 'enemyContactBalance') {
      this.runTestHarnessEnemyContactBalance();
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

    if (query.get('testHarness') === 'directCombatNumbers') {
      this.startRun();
      this.runTestHarnessDirectCombatNumbers();
    }
  }

  private getTestHarnessState(): StarvivorsTestHarnessState {
    const selectedShip = this.getSelectedShipDefinition();
    const firstWorldEvent = this.worldEvents[0];
    const firstRareEvent = this.rareEvents[0];
    const scannerSnapshot = getSectorScannerSnapshot(
      this.sectorScannerRuntime,
      this.progressionState.sectorScannerLevel,
      isSectorScannerAvailable(this.progressionState)
    );

    return {
      selectedShipId: selectedShip.id,
      selectedShipName: selectedShip.displayName,
      selectedMissionId: this.selectedMissionId,
      selectedMissionName: this.missionRuntime?.definition.displayName ?? this.getSelectedMissionDefinition().displayName,
      missionStatus: this.missionRuntime?.status ?? (this.getSelectedMissionDefinition().objectiveType === 'free-range' ? 'open' : 'ready'),
      missionObjectiveDistance: this.getMissionObjectiveDistance(),
      missionObjectiveRadius: this.missionRuntime?.objective.radius ?? 0,
      missionObjectiveRegionId: this.missionRuntime?.objective.regionId ?? null,
      worldEventCount: this.worldEvents.length,
      activeWorldEventCount: this.worldEvents.filter((event) => event.status === 'active').length,
      destroyedWorldEventCount: this.worldEvents.filter((event) => event.status === 'destroyed').length,
      firstWorldEventName: firstWorldEvent?.definition.displayName ?? null,
      firstWorldEventHp: firstWorldEvent?.hp ?? 0,
      firstWorldEventMaxHp: firstWorldEvent?.maxHp ?? 0,
      rareEventCount: this.rareEvents.length,
      activeRareEventCount: this.rareEvents.filter((event) => event.status === 'active').length,
      completedRareEventCount: this.rareEvents.filter((event) => event.status === 'completed').length,
      firstRareEventName: firstRareEvent?.definition.displayName ?? null,
      firstRareEventStatus: firstRareEvent?.status ?? null,
      firstRareEventProgress: firstRareEvent ? getRareEventProgress(firstRareEvent) : 0,
      unlockedShipIds: [...this.unlockedShipIds],
      rammingShieldHp: this.rammingShieldState.hp,
      rammingShieldMaxHp: this.getRammingShieldMaxHp(),
      rammingShieldDashCharges: this.rammingShieldState.dashCharges,
      rammingShieldDashMaxCharges: this.hasRammingShield() ? this.getRammingShieldStats().dashMaxCharges : 0,
      hull: this.playerHull,
      maxHull: this.getPlayerMaxHull(),
      isPlayerDead: this.isPlayerDead,
      runEndReason: this.runEndReason,
      canContinueRun: false,
      isEjectConfirmOpen: Boolean(this.ejectConfirmScreen),
      sectorScale: this.sectorScale,
      sectorSeed: this.sectorSeed,
      sectorRegionCount: this.sectorLayout.regions.length,
      sectorSignalCount: this.sectorSignalSpawns.length,
      generatedSectorAsteroidCount: this.sectorAsteroidSpawns.filter((spawn) => !spawn.destroyed).length,
      generatedSectorScrapCount: this.sectorScrapSpawns.filter((spawn) => !spawn.collected).length,
      activeSectorAsteroidCount: this.activeSectorAsteroids.size,
      activeSectorScrapCount: this.activeSectorScrapPickups.size,
      activeSectorSignalCount: this.activeSectorSignals.size,
      worldSquadCount: this.worldSquads.length,
      activeWorldSquadCount: this.worldSquads.filter((squad) => squad.state === 'pursue').length,
      defeatedWorldSquadCount: this.worldSquads.filter((squad) => squad.state === 'defeated').length,
      arenaWidth: this.arena?.width ?? 0,
      arenaHeight: this.arena?.height ?? 0,
      cameraFollowOffsetX: -this.cameraLead.x,
      cameraFollowOffsetY: -this.cameraLead.y,
      fuel: this.fuel,
      maxFuel: RUN_FUEL_MAX,
      fuelDrainEnabled: this.debugFuelDrainEnabled,
      fuelDrainMode: this.debugFuelDrainMode,
      playerXp: this.playerXp,
      runScrapTotal: this.runScrapTotal,
      runScrapSpent: this.runScrapSpent,
      lastRunScrapTotal: this.lastRunScrapTotal,
      lastRunScrapSpent: this.lastRunScrapSpent,
      lastRunScrapConverted: this.lastRunScrapConverted,
      totalCredits: this.totalCredits,
      lastRunCreditsEarned: this.lastRunCreditsEarned,
      hasPaidRunCredits: this.hasPaidRunCredits,
      unlockedRewardHooks: [...this.progressionState.unlockedRewardHooks],
      lastRunUnlockedRewards: [...this.lastRunUnlockedRewards],
      sectorScannerAvailable: scannerSnapshot.available,
      sectorScannerLevel: scannerSnapshot.level,
      sectorScannerProgress: scannerSnapshot.scanProgress,
      sectorScannerTargetLabel: scannerSnapshot.targetLabel,
      sectorScannerShowsArrow: scannerSnapshot.showArrow,
      sectorScannerShowsMinimap: scannerSnapshot.showMinimap,
      rerollsThisRun: this.rerollsThisRun,
      nextRerollCost: this.getNextRerollCost(),
      debugRerollCostBase: this.debugRerollCostBase,
      upgradeChoiceCount: this.isUpgradeOverlayOpen ? this.getUpgradeOverlayChoices().length : UPGRADE_OVERLAY_CHOICE_COUNT,
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
      beamHeat: this.beamSlots.primary.heat,
      beamOverheated: this.beamSlots.primary.overheated,
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
      enemies: this.getLiveEnemyLegacyCount('chaser'),
      shooterEnemies: this.getLiveEnemyLegacyCount('shooter'),
      tankEnemies: this.getLiveEnemyLegacyCount('tank'),
      liveEnemies: this.liveEnemies.length,
      activeEnemies: this.getActiveEnemyCount(),
      asteroids: this.basicAsteroids.length,
      scrapPickups: this.scrapPickups.length,
      projectiles: this.playerProjectiles.length,
      enemyProjectiles: this.enemyProjectiles.length
    };
  }

  private runTestHarnessDirectCombatNumbers(): void {
    const pulseWeapon = getWeaponDefinition('pulse-cannon');
    const expectedBasePulseDamage = pulseWeapon.damage ?? 0;
    const basePulseDamage = this.getResolvedWeaponStats(pulseWeapon, 'primary').projectile?.damage ?? 0;
    this.runUpgradeLevels = {
      ...this.runUpgradeLevels,
      pulse_flat_damage_common: 1
    };
    const flatPulseDamage = this.getResolvedWeaponStats(pulseWeapon, 'primary').projectile?.damage ?? 0;
    const baselineChaser = this.createScaledEnemyStats('chaser', this.runStartedAt);
    const damageSamples = Array.from({ length: 80 }, () => this.rollPlayerDamage(basePulseDamage));
    const minDamage = Math.floor(basePulseDamage * PLAYER_WEAPON_DAMAGE_VARIANCE.min);
    const maxDamage = Math.ceil(basePulseDamage * PLAYER_WEAPON_DAMAGE_VARIANCE.max);
    const varianceWithinRange = damageSamples.every((sample) => sample >= minDamage && sample <= maxDamage);
    const varianceApplied = damageSamples.some((sample) => sample !== basePulseDamage);
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
      baselineChaser.maxHull === basicEnemy.stats.maxHull &&
      this.getPlayerMaxHull() === 40 &&
      varianceWithinRange &&
      varianceApplied &&
      flatRewards &&
      wholeNumbers;

    document.body.setAttribute('data-starvivors-direct-combat-numbers-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-direct-combat-numbers-harness-details',
      JSON.stringify({
        basePulseDamage,
        flatPulseDamage,
        expectedBasePulseDamage,
        baselineChaser,
        playerMaxHull: this.getPlayerMaxHull(),
        minDamage,
        maxDamage,
        damageSamples,
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
    const enemyAfterKill = harness.destroyFirstEnemy();
    this.spawnScrapPickup('enemy', 5, this.player.x, this.player.y, new Phaser.Math.Vector2(0, 0));
    const enemyXp = harness.collectAllScrap();
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
        enemyAfterKill,
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
      chaser: this.createScaledEnemyStats('chaser', this.runStartedAt + minutes * 60000),
      shooter: this.createScaledEnemyStats('shooter', this.runStartedAt + minutes * 60000),
      tank: this.createScaledEnemyStats('tank', this.runStartedAt + minutes * 60000)
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
      started.hull === 95 &&
      started.maxHull === 95 &&
      started.playerMaxSpeed === 425 &&
      started.playerAccelerationMultiplier === 1 &&
      started.rammingShieldDashMaxCharges === 6 &&
      afterXp.playerXp === BASIC_ENEMY_XP_REWARD &&
      afterScrap.runScrapTotal === 0 &&
      afterScrapGain.runScrapTotal === 10 &&
      restarted.selectedShipId === 'bulwark' &&
      restarted.hull === 95 &&
      restarted.maxHull === 95 &&
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
    const dashXBefore = this.player.x;
    const dashYBefore = this.player.y;
    this.useRammingShieldWeapon(this.getRammingShieldStats(), this.time.now);
    this.updateRammingShieldDashBurstMovement(this.getRammingShieldStats().dashDurationSeconds);
    const afterDash = harness.getState();
    const dashDistance = Phaser.Math.Distance.Between(dashXBefore, dashYBefore, this.player.x, this.player.y);
    const enemy = this.liveEnemies[0];
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
      dashDistance >= this.getRammingShieldStats().dashDistance - 1 &&
      afterShieldHit.hull === started.hull &&
      afterBrokenHit.hull < afterShieldHit.hull &&
      afterRegen.rammingShieldHp === 10 + this.getRammingShieldStats().shieldRegenRatePerSecond;

    document.body.setAttribute('data-starvivors-shield-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-shield-harness-details',
      JSON.stringify({
        started,
        afterDash,
        dashDistance,
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
    const bulwarkPulse = harness.selectPulseUpgrade(1);
    const bulwarkLaterChoices = this.getSecondaryWeaponChoices().map((choice) => choice.weaponId);
    const bulwarkPulseUpgradeAvailableAfterEquip = getAvailableRunUpgrades(
      this.runUpgradeLevels,
      this.getEquippedWeaponDefinitions()
    ).some((upgrade) => upgrade.id === 'pulse_damage');
    const shotsBefore = this.playerProjectiles.length;
    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    if (secondaryWeapon) {
      this.usePlayerWeapon(secondaryWeapon, 'secondary', this.time.now + 1000);
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
      bulwarkChoices.includes('pulse-cannon') &&
      bulwarkLaterChoices.length === 0 &&
      this.playerWeapons.activeAutoWeaponId === null &&
      this.playerWeapons.activePrimaryWeaponId === 'ramming-shield' &&
      this.playerWeapons.activeSecondaryWeaponId === 'pulse-cannon' &&
      !bulwarkPulseUpgradeAvailable &&
      bulwarkPulseUpgradeAvailableAfterEquip &&
      bulwarkRammingUpgradeAvailable &&
      shotsAfter === shotsBefore + 1;

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
        bulwarkPulse,
        bulwarkLaterChoices,
        bulwarkPulseUpgradeAvailable,
        bulwarkPulseUpgradeAvailableAfterEquip,
        bulwarkRammingUpgradeAvailable,
        secondaryWeaponId: secondaryWeapon?.id ?? null,
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
      movedToPrimary.secondaryWeaponId === 'pulse-cannon' &&
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

  private runTestHarnessPhase7(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase7-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase7-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    const initial = harness.getState();
    this.playerVelocity.set(500, 0);
    this.applyPlayerCoastDamping(1);
    const interceptorDampedSpeed = this.playerVelocity.length();
    this.updateFuel(10, {
      thrustForward: true,
      thrustReverse: false,
      strafeLeft: false,
      strafeRight: false,
      isThrusting: true,
      isWorldRelative: false
    });
    const afterFuelDrain = harness.getState();
    this.fuel = 0;
    const emergencyThrustMultiplier = this.getFuelThrustMultiplier();
    this.completeEjectRun();
    const ejected = harness.getState();

    harness.addCredits(100);
    harness.unlockShip('bulwark');
    harness.selectShip('bulwark');
    this.startRun();
    this.playerVelocity.set(500, 0);
    this.applyPlayerCoastDamping(1);
    const bulwarkDampedSpeed = this.playerVelocity.length();

    const pass =
      initial.fuel === RUN_FUEL_MAX &&
      afterFuelDrain.fuel < initial.fuel &&
      Math.abs(emergencyThrustMultiplier - RUN_FUEL_EMERGENCY_THRUST_MULTIPLIER) < 0.001 &&
      interceptorDampedSpeed > 275 &&
      interceptorDampedSpeed < 380 &&
      bulwarkDampedSpeed > interceptorDampedSpeed &&
      ejected.runEndReason === 'eject' &&
      ejected.isResultsScreenOpen &&
      ejected.hasPaidRunCredits;

    document.body.setAttribute('data-starvivors-phase7-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase7-harness-details',
      JSON.stringify({
        initial,
        afterFuelDrain,
        emergencyThrustMultiplier,
        ejected,
        interceptorDampedSpeed,
        bulwarkDampedSpeed
      })
    );
  }

  private runTestHarnessPhase8(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase8-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase8-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    const viewport = getViewportSize(this);
    const initial = harness.getState();
    const scaleSamples = [2, 3, 5].map((scale) => ({
      scale,
      arena: createArenaSize(viewport, scale)
    }));
    const expectedArena = createArenaSize(viewport, this.sectorScale);
    this.player.setPosition(this.arena.width + 42, -37);
    this.wrapPlayer();
    const wrapped = harness.getState();
    const wrapPass = wrapped.arenaWidth === expectedArena.width && this.player.x === 42 && this.player.y === this.arena.height - 37;

    const nearbyEnemy = this.liveEnemies[0];
    let mirrorState: { baseVisible: boolean; mirrorVisible: boolean; showMirror: boolean } | undefined;
    if (nearbyEnemy) {
      nearbyEnemy.body.setPosition(this.arena.width - 24, this.player.y);
      nearbyEnemy.wrapMirrorBody.setPosition(nearbyEnemy.body.x, nearbyEnemy.body.y);
      mirrorState = this.updateToroidalRenderMirror(nearbyEnemy.body, nearbyEnemy.wrapMirrorBody, nearbyEnemy.definition.visual.size);
    }

    this.playerVelocity.set(720, 0);
    for (let index = 0; index < 24; index += 1) {
      this.updateCameraLead();
    }
    const cameraAhead = harness.getState();
    this.playerVelocity.set(0, 0);
    for (let index = 0; index < 24; index += 1) {
      this.updateCameraLead();
    }
    const cameraSettled = harness.getState();

    const minimapBefore = harness.getState();
    const minimapOff = harness.toggleMinimap();
    const minimapOn = harness.toggleMinimap();
    const configuredScalePass = initial.sectorScale === this.sectorScale && initial.arenaWidth === expectedArena.width && initial.arenaHeight === expectedArena.height;
    const scaleSamplesPass = scaleSamples.every(
      (sample) =>
        sample.arena.width === Math.round(viewport.width * 9 * sample.scale) &&
        sample.arena.height === Math.round(viewport.height * 9 * sample.scale)
    );
    const cameraPass =
      cameraAhead.cameraFollowOffsetX < -18 &&
      cameraAhead.cameraFollowOffsetX > -42 &&
      Math.abs(cameraAhead.cameraFollowOffsetY) < 1 &&
      Math.abs(cameraSettled.cameraFollowOffsetX) < Math.abs(cameraAhead.cameraFollowOffsetX);
    const minimapPass = minimapBefore.isMinimapVisible && !minimapOff.isMinimapVisible && minimapOn.isMinimapVisible;

    const pass =
      configuredScalePass &&
      scaleSamplesPass &&
      wrapPass &&
      Boolean(mirrorState?.showMirror) &&
      cameraPass &&
      minimapPass;

    document.body.setAttribute('data-starvivors-phase8-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase8-harness-details',
      JSON.stringify({
        initial,
        viewport,
        sectorScale: this.sectorScale,
        expectedArena,
        scaleSamples,
        wrapped,
        wrapPass,
        mirrorState,
        cameraAhead,
        cameraSettled,
        minimapBefore,
        minimapOff,
        minimapOn,
        configuredScalePass,
        scaleSamplesPass,
        cameraPass,
        minimapPass
      })
    );
  }

  private runTestHarnessPhase9(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase9-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase9-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    const state = harness.getState();
    const regionTypes = new Set(this.sectorLayout.regions.map((region) => region.type));
    const repeated = generateSectorLayout({
      arena: this.arena,
      seed: this.sectorSeed,
      startX: this.arena.width / 2,
      startY: this.arena.height / 2
    });
    const deterministic = repeated.regions.every((region, index) => {
      const original = this.sectorLayout.regions[index];
      return (
        original &&
        original.type === region.type &&
        Math.abs(original.x - region.x) < 0.001 &&
        Math.abs(original.y - region.y) < 0.001 &&
        Math.abs(original.radius - region.radius) < 0.001
      );
    });
    const safeRegion = this.sectorLayout.regions.find((region) => region.type === 'safe-drift');
    const safeStartPass = Boolean(
      safeRegion &&
        getWrappedDistance(this.arena, this.player.x, this.player.y, safeRegion.x, safeRegion.y) <= safeRegion.radius * 0.2
    );
    const regionMixPass =
      regionTypes.has('safe-drift') &&
      regionTypes.has('salvage-field') &&
      regionTypes.has('asteroid-belt') &&
      regionTypes.has('enemy-territory') &&
      regionTypes.has('anomaly-signal');
    const streamedRegion = this.sectorLayout.regions.find((region) => region.signalStrength >= 0.5);
    if (streamedRegion) {
      this.player.setPosition(streamedRegion.x, streamedRegion.y);
      this.updateSectorStreaming();
    }
    const activationPass =
      Boolean(streamedRegion) &&
      this.activeSectorSignals.size >= 1 &&
      this.activeSectorScrapPickups.size >= 1;
    const generatedAsteroidCount = this.sectorAsteroidSpawns.filter((spawn) => !spawn.destroyed).length;
    const generatedScrapCount = this.sectorScrapSpawns.filter((spawn) => !spawn.collected).length;
    const placementPass =
      generatedAsteroidCount >= BASIC_ASTEROID_COUNT &&
      generatedScrapCount >= 8 &&
      this.sectorSignalSpawns.length >= 4;
    const streamingPass =
      this.activeSectorAsteroids.size <= generatedAsteroidCount &&
      this.activeSectorScrapPickups.size <= generatedScrapCount &&
      this.activeSectorSignals.size <= this.sectorSignalSpawns.length;
    const boundsPass = this.sectorLayout.regions.every(
      (region) =>
        region.x >= 0 &&
        region.x < this.arena.width &&
        region.y >= 0 &&
        region.y < this.arena.height &&
        region.radius > 0
    );

    const pass =
      state.sectorRegionCount >= 6 &&
      state.sectorSignalCount >= 4 &&
      state.sectorSeed === this.sectorSeed &&
      deterministic &&
      safeStartPass &&
      regionMixPass &&
      activationPass &&
      placementPass &&
      streamingPass &&
      boundsPass;

    document.body.setAttribute('data-starvivors-phase9-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase9-harness-details',
      JSON.stringify({
        state,
        sectorSeed: this.sectorSeed,
        regions: this.sectorLayout.regions.map((region) => ({
          id: region.id,
          type: region.type,
          x: Math.round(region.x),
          y: Math.round(region.y),
          radius: Math.round(region.radius),
          danger: region.danger,
          resource: region.resource
        })),
        generatedAsteroidCount,
        generatedScrapCount,
        signalCount: this.sectorSignalSpawns.length,
        activeAsteroidCount: this.activeSectorAsteroids.size,
        activeScrapPickupCount: this.activeSectorScrapPickups.size,
        activeSignalCount: this.activeSectorSignals.size,
        deterministic,
        safeStartPass,
        regionMixPass,
        activationPass,
        placementPass,
        streamingPass,
        boundsPass
      })
    );
  }

  private runTestHarnessPhase10(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase10-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase10-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    const initial = harness.getState();
    const targetSquad = this.worldSquads.find((squad) => squad.state !== 'defeated');
    const initialLiveEnemies = this.liveEnemies.length;
    const initialInactiveSquads = this.worldSquads.filter((squad) => squad.state !== 'pursue' && squad.state !== 'defeated').length;

    if (targetSquad) {
      this.player.setPosition(targetSquad.x, targetSquad.y);
      this.updateWorldSquads(this.time.now + WORLD_SQUAD_INACTIVE_UPDATE_MS + 1, 1);
    }

    const activated = harness.getState();
    const activatedSquad = targetSquad ? this.worldSquads.find((squad) => squad.id === targetSquad.id) : undefined;
    const activatedSquadState = activatedSquad?.state ?? null;
    const activatedSquadEnemyCount = activatedSquad?.activeEnemyIds.length ?? 0;

    if (targetSquad) {
      this.player.setPosition(wrapCoordinate(targetSquad.homeX + this.arena.width * 0.38, this.arena.width), targetSquad.homeY);
      this.updateWorldSquads(this.time.now + WORLD_SQUAD_INACTIVE_UPDATE_MS * 2 + 1, 1);
    }

    const disengaged = harness.getState();
    const disengagedSquad = targetSquad ? this.worldSquads.find((squad) => squad.id === targetSquad.id) : undefined;
    const stateMix = new Set(this.worldSquads.map((squad) => squad.state));
    const pass =
      initial.worldSquadCount >= WORLD_SQUAD_COUNT &&
      initialInactiveSquads >= 1 &&
      Boolean(targetSquad) &&
      activatedSquadState === 'pursue' &&
      activatedSquadEnemyCount > 0 &&
      activated.activeWorldSquadCount >= 1 &&
      activated.liveEnemies > initialLiveEnemies &&
      Boolean(disengagedSquad && disengagedSquad.state === 'disengage') &&
      disengaged.activeWorldSquadCount === 0 &&
      stateMix.has('roam') &&
      stateMix.has('patrol') &&
      stateMix.has('guard');

    document.body.setAttribute('data-starvivors-phase10-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase10-harness-details',
      JSON.stringify({
        initial,
        activated,
        disengaged,
        targetSquad: targetSquad
          ? {
              id: targetSquad.id,
              squadId: targetSquad.squadId,
              state: targetSquad.state,
              activeEnemyIds: targetSquad.activeEnemyIds
            }
          : null,
        activatedSquadState,
        activatedSquadEnemyCount,
        disengagedState: disengagedSquad?.state ?? null,
        stateMix: [...stateMix]
      })
    );
  }

  private runTestHarnessPhase10_5(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase10-5-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase10-5-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    const initial = harness.getState();
    this.spawnScrapPickup('enemy', 5, this.player.x, this.player.y, new Phaser.Math.Vector2(0, 0));
    const collected = harness.collectAllScrap();
    const xpFromScrapPass = collected.runScrapTotal === initial.runScrapTotal + 5 && collected.playerXp === initial.playerXp + 15;

    this.clearScrapPickups();
    const rollupX = wrapCoordinate(this.player.x + this.arena.width * 0.34, this.arena.width);
    const rollupY = wrapCoordinate(this.player.y + this.arena.height * 0.34, this.arena.height);
    for (let i = 0; i < 130; i += 1) {
      this.spawnScrapPickup('enemy', 1, rollupX + (i % 13) * 7, rollupY + Math.floor(i / 13) * 7, new Phaser.Math.Vector2(0, 0));
    }

    const beforeRollupCount = this.scrapPickups.length;
    const beforeRollupValue = this.scrapPickups.reduce((sum, pickup) => sum + (pickup.kind === 'scrap' ? pickup.value : 0), 0);
    for (const pickup of this.scrapPickups) {
      pickup.offscreenSince = this.time.now - SCRAP_ROLLUP_NORMAL_OFFSCREEN_MS - 100;
    }
    this.nextScrapRollupAt = 0;
    this.rollupOffscreenScrap(this.time.now + SCRAP_ROLLUP_INTERVAL_MS + 1);
    const afterRollupCount = this.scrapPickups.length;
    const afterRollupValue = this.scrapPickups.reduce((sum, pickup) => sum + (pickup.kind === 'scrap' ? pickup.value : 0), 0);
    const tierTwoOrBetterCount = this.scrapPickups.filter((pickup) => pickup.kind === 'scrap' && pickup.value >= 5).length;
    const rollupPass =
      beforeRollupCount > SCRAP_ROLLUP_SOFT_LIMIT &&
      afterRollupCount < beforeRollupCount &&
      afterRollupValue === beforeRollupValue &&
      tierTwoOrBetterCount > 0;
    const pass = xpFromScrapPass && rollupPass;

    document.body.setAttribute('data-starvivors-phase10-5-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase10-5-harness-details',
      JSON.stringify({
        initial,
        collected,
        xpFromScrapPass,
        beforeRollupCount,
        afterRollupCount,
        beforeRollupValue,
        afterRollupValue,
        tierTwoOrBetterCount,
        rollupPass
      })
    );
  }

  private runTestHarnessPhase10_6(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase10-6-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase10-6-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    this.clearAsteroids();
    this.clearEnemyWreckageDebris();
    this.clearScrapPickups();

    const defaultTuningPass =
      this.debugState.asteroidFragmentSoftCap === 500 &&
      this.debugState.asteroidFragmentHardCap === 500 &&
      this.debugState.asteroidFragmentBurstLimit === 250;
    this.debugState.setAsteroidFragmentSoftCap(45);
    this.debugState.setAsteroidFragmentHardCap(70);
    this.debugState.setAsteroidFragmentBurstLimit(6);

    const enemy = this.spawnLiveEnemy('scout', this.player.x + 180, this.player.y, this.time.now, 'chaser');
    const enemyIndex = this.liveEnemies.indexOf(enemy);
    this.destroyLiveEnemyWithRewards(enemy, enemyIndex);
    const enemyDeathDebrisPass = this.enemyWreckageDebris.length === 0;

    const stressAsteroids: BasicAsteroid[] = [];
    for (let i = 0; i < 50; i += 1) {
      const angle = (Math.PI * 2 * i) / 50;
      const ring = 820 + (i % 5) * 38;
      const asteroid = this.createAsteroidInstance(
        wrapCoordinate(this.player.x + Math.cos(angle) * ring, this.arena.width),
        wrapCoordinate(this.player.y + Math.sin(angle) * ring, this.arena.height),
        5,
        new Phaser.Math.Vector2(0, 0)
      );
      stressAsteroids.push(asteroid);
      this.basicAsteroids.push(asteroid);
    }

    for (const asteroid of stressAsteroids) {
      const index = this.basicAsteroids.indexOf(asteroid);

      if (index >= 0) {
        this.destroyBasicAsteroid(index);
      }
    }

    const scrapValue = this.scrapPickups.reduce((total, pickup) => total + (pickup.kind === 'scrap' ? pickup.value : 0), 0);
    const asteroidCapPass = this.basicAsteroids.length <= this.debugState.asteroidFragmentHardCap;
    const directScrapOnlyPass = scrapValue >= 50 * SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER[5];
    const pass = defaultTuningPass && enemyDeathDebrisPass && asteroidCapPass && directScrapOnlyPass;

    document.body.setAttribute('data-starvivors-phase10-6-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase10-6-harness-details',
      JSON.stringify({
        enemyDeathDebrisPass,
        defaultTuningPass,
        asteroidCapPass,
        directScrapOnlyPass,
        activeAsteroids: this.basicAsteroids.length,
        scrapPickupCount: this.scrapPickups.length,
        scrapValue,
        hardCap: this.debugState.asteroidFragmentHardCap
      })
    );
  }

  private runTestHarnessPhase11(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase11-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase11-harness-details', 'Harness was not installed.');
      return;
    }

    harness.selectMission('survey-signal');
    this.startRun();
    const initial = harness.getState();
    const objectiveExistsPass =
      initial.selectedMissionId === 'survey-signal' &&
      initial.missionStatus === 'active' &&
      initial.missionObjectiveRadius > 0 &&
      initial.missionObjectiveRegionId !== null;

    if (this.missionRuntime) {
      this.player.setPosition(this.missionRuntime.objective.x, this.missionRuntime.objective.y);
      this.playerVelocity.set(0, 0);
      this.updateMission(this.time.now + 1000);
    }

    const completed = harness.getState();
    const completionPass = completed.missionStatus === 'completed' && completed.missionObjectiveDistance <= completed.missionObjectiveRadius;
    const pass = objectiveExistsPass && completionPass;

    document.body.setAttribute('data-starvivors-phase11-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase11-harness-details',
      JSON.stringify({
        initial,
        completed,
        objectiveExistsPass,
        completionPass
      })
    );
  }

  private runTestHarnessPhase12(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase12-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase12-harness-details', 'Harness was not installed.');
      return;
    }

    harness.selectMission('mothership-contract');
    this.startRun();
    const initial = harness.getState();
    const event = this.worldEvents[0];

    if (event) {
      this.player.setPosition(event.x, event.y);
      this.playerVelocity.set(0, 0);
      this.updateWorldEvents(this.time.now + 1000);
    }

    const afterApproach = harness.getState();
    const destroyed = harness.destroyFirstWorldEvent();
    const rewardsDropped = this.scrapPickups.some((pickup) => pickup.kind === 'scrap' && pickup.value >= 100) &&
      this.scrapPickups.some((pickup) => pickup.kind === 'banked-upgrade');
    const worldEventPass =
      initial.selectedMissionId === 'mothership-contract' &&
      initial.worldEventCount >= 1 &&
      initial.firstWorldEventName === 'Prototype Mothership' &&
      initial.firstWorldEventHp === initial.firstWorldEventMaxHp &&
      afterApproach.liveEnemies > initial.liveEnemies &&
      destroyed.destroyedWorldEventCount >= 1 &&
      destroyed.missionStatus === 'completed';
    const pass = worldEventPass && rewardsDropped;

    document.body.setAttribute('data-starvivors-phase12-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase12-harness-details',
      JSON.stringify({
        initial,
        afterApproach,
        destroyed,
        rewardsDropped,
        worldEventPass
      })
    );
  }

  private runTestHarnessPhase13(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase13-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase13-harness-details', 'Harness was not installed.');
      return;
    }

    harness.selectMission('rift-cache-contract');
    this.startRun();
    const initial = harness.getState();
    const blackHoleEvent = this.rareEvents.find((event) => event.definition.id === 'unstable-black-hole-cache');

    if (blackHoleEvent) {
      this.player.setPosition(
        wrapCoordinate(blackHoleEvent.x + blackHoleEvent.definition.objectiveRadius * 0.82, this.arena.width),
        blackHoleEvent.y
      );
      this.playerVelocity.set(0, 0);

      for (let i = 0; i < 6; i += 1) {
        this.updateRareEvents(this.time.now + i * 1000, 1);
      }
    }

    const afterBlackHole = harness.getState();
    const continued = harness.continueRun();
    const hunterEvent = this.createRareEventInstance({
      id: 'hunter-swarm-debug-harness',
      definitionId: 'hunter-swarm',
      x: wrapCoordinate(this.player.x + 820, this.arena.width),
      y: wrapCoordinate(this.player.y + 360, this.arena.height),
      regionId: this.sectorLayout.regions[0]?.id ?? 'debug',
      source: 'debug'
    });
    this.rareEvents.push(hunterEvent);
    this.player.setPosition(
      wrapCoordinate(hunterEvent.x + hunterEvent.definition.objectiveRadius * 0.35, this.arena.width),
      hunterEvent.y
    );
    this.playerVelocity.set(0, 0);
    this.updateRareEvents(this.time.now + 7000, 1);
    const hunterSpawnedEnemyIds = [...hunterEvent.activeEnemyIds];

    for (const enemyId of hunterSpawnedEnemyIds) {
      const enemy = this.liveEnemies.find((candidate) => candidate.id === enemyId);
      const enemyIndex = enemy ? this.liveEnemies.indexOf(enemy) : -1;
      if (enemy && enemyIndex >= 0) {
        this.destroyLiveEnemyWithRewards(enemy, enemyIndex);
      }
    }

    this.updateRareEvents(this.time.now + 8000, 1);
    const afterHunter = harness.getState();
    const rewardsDropped =
      this.scrapPickups.some((pickup) => pickup.kind === 'scrap' && pickup.value >= 96) &&
      this.scrapPickups.some((pickup) => pickup.kind === 'banked-upgrade');
    const contractPass =
      initial.selectedMissionId === 'rift-cache-contract' &&
      initial.rareEventCount >= 1 &&
      initial.firstRareEventName === 'Unstable Black-Hole Cache' &&
      afterBlackHole.completedRareEventCount >= 1 &&
      afterBlackHole.missionStatus === 'completed' &&
      afterBlackHole.runEndReason === 'none' &&
      !afterBlackHole.isResultsScreenOpen &&
      continued.runEndReason === 'none' &&
      !continued.isResultsScreenOpen;
    const hunterPass =
      hunterSpawnedEnemyIds.length > 0 &&
      hunterEvent.status === 'completed' &&
      afterHunter.completedRareEventCount >= 2 &&
      afterHunter.firstRareEventProgress === 1;
    const pass = contractPass && hunterPass && rewardsDropped;

    document.body.setAttribute('data-starvivors-phase13-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase13-harness-details',
      JSON.stringify({
        initial,
        afterBlackHole,
        continued,
        afterHunter,
        hunterSpawnedEnemyIds,
        rewardsDropped,
        contractPass,
        hunterPass
      })
    );
  }

  private runTestHarnessPhase14(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase14-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase14-harness-details', 'Harness was not installed.');
      return;
    }

    harness.resetProgression();
    harness.selectMission('rift-cache-contract');
    this.startRun();
    const initial = harness.getState();
    const blackHoleEvent = this.rareEvents.find((event) => event.definition.id === 'unstable-black-hole-cache');

    if (blackHoleEvent) {
      this.player.setPosition(
        wrapCoordinate(blackHoleEvent.x + blackHoleEvent.definition.objectiveRadius * 0.82, this.arena.width),
        blackHoleEvent.y
      );
      this.playerVelocity.set(0, 0);

      for (let i = 0; i < 6; i += 1) {
        this.updateRareEvents(this.time.now + i * 1000, 1);
      }
    }

    const afterContract = harness.getState();
    harness.addCredits(500);
    const scannerLevel1 = harness.purchaseSectorScanner();
    harness.restartRun();
    const scannerRunInitial = harness.getState();
    const scannerLevel1Complete = harness.fastForwardScanner();
    const scannerLevel2 = harness.purchaseSectorScanner();
    const scannerLevel2Visible = harness.getState();
    const scannerLevel3 = harness.purchaseSectorScanner();
    const scannerLevel3Visible = harness.getState();

    harness.grantXp(1000);
    harness.openUpgradeOverlay();
    harness.addRunScrap(20);
    const beforeReroll = harness.getState();
    const afterReroll = harness.rerollUpgrades();
    const debugMode = harness.toggleRerollDebugCost();

    this.completeEjectRun();
    const afterResults = harness.getState();
    const persisted = loadProgressionState();
    const rewardPass =
      initial.sectorScannerLevel === 0 &&
      afterContract.missionStatus === 'completed' &&
      afterContract.sectorScannerAvailable &&
      afterContract.unlockedRewardHooks.includes('sector-scanner.black-hole-cache') &&
      afterContract.lastRunUnlockedRewards.includes('sector-scanner.black-hole-cache');
    const scannerPass =
      scannerLevel1.sectorScannerLevel === 1 &&
      scannerRunInitial.sectorScannerProgress === 0 &&
      scannerLevel1Complete.sectorScannerProgress === 1 &&
      scannerLevel1Complete.sectorScannerTargetLabel !== null &&
      !scannerLevel1Complete.sectorScannerShowsArrow &&
      !scannerLevel1Complete.sectorScannerShowsMinimap &&
      scannerLevel2.sectorScannerLevel === 2 &&
      scannerLevel2Visible.sectorScannerShowsArrow &&
      scannerLevel3.sectorScannerLevel === 3 &&
      scannerLevel3Visible.sectorScannerShowsMinimap;
    const rerollPass =
      beforeReroll.upgradeChoiceCount === 3 &&
      beforeReroll.nextRerollCost === 5 &&
      afterReroll.rerollsThisRun === 1 &&
      afterReroll.runScrapTotal === beforeReroll.runScrapTotal - 5 &&
      afterReroll.runScrapSpent === beforeReroll.runScrapSpent + 5 &&
      afterReroll.nextRerollCost === 10 &&
      debugMode.debugRerollCostBase === 10 &&
      debugMode.nextRerollCost === 20;
    const resultsPass =
      afterResults.isResultsScreenOpen &&
      afterResults.lastRunScrapSpent >= 5 &&
      afterResults.lastRunScrapConverted === afterResults.runScrapTotal &&
      persisted.sectorScannerLevel === 3;
    const pass = rewardPass && scannerPass && rerollPass && resultsPass;

    document.body.setAttribute('data-starvivors-phase14-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase14-harness-details',
      JSON.stringify({
        initial,
        afterContract,
        scannerLevel1,
        scannerRunInitial,
        scannerLevel1Complete,
        scannerLevel2,
        scannerLevel2Visible,
        scannerLevel3,
        scannerLevel3Visible,
        beforeReroll,
        afterReroll,
        debugMode,
        afterResults,
        persisted,
        rewardPass,
        scannerPass,
        rerollPass,
        resultsPass
      })
    );
  }

  private runTestHarnessPhase15A(): void {
    const result = runProgressionLoadoutMigrationHarness();

    document.body.setAttribute('data-starvivors-phase15a-harness', result.pass ? 'pass' : 'fail');
    document.body.setAttribute('data-starvivors-phase15a-harness-details', JSON.stringify(result));
  }

  private runTestHarnessPhase15B(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase15b-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase15b-harness-details', 'Harness was not installed.');
      return;
    }

    harness.resetProgression();
    harness.addCredits(250);
    const unlocked = harness.unlockShip('engineer');
    const selected = harness.selectShip('engineer');
    this.startRun();
    const started = harness.getState();
    const availableUpgradeIds = getAvailableRunUpgrades(this.runUpgradeLevels, this.getEquippedWeaponDefinitions()).map((upgrade) => upgrade.id);

    this.player.setPosition(this.arena.width * 0.5, this.arena.height * 0.5);
    this.player.setRotation(0);
    this.playerVelocity.set(0, 0);
    this.basicAsteroids = this.basicAsteroids.filter((asteroid) => {
      destroyAsteroidRenderObjects(asteroid);
      return false;
    });
    const firstAsteroid = this.createAsteroidInstance(this.player.x, this.player.y - 120, 1, new Phaser.Math.Vector2(0, 0));
    const secondAsteroid = this.createAsteroidInstance(this.player.x, this.player.y - 220, 1, new Phaser.Math.Vector2(0, 0));
    firstAsteroid.hp = 1000;
    secondAsteroid.hp = 1000;
    this.basicAsteroids.push(firstAsteroid, secondAsteroid);
    const firstAsteroidHpBefore = firstAsteroid.hp;
    const secondAsteroidHpBefore = secondAsteroid.hp;
    this.beamSlots.primary.nextTickAt = 0;
    this.updateBeamWeapon(getWeaponDefinition('salvage-beam'), 'primary', true, this.time.now + 1000, 1 / 60);
    this.updateBeamWeapon(getWeaponDefinition('salvage-beam'), 'primary', true, this.time.now + 1200, 0.2);
    const beamPiercePass =
      firstAsteroid.hp < firstAsteroidHpBefore &&
      secondAsteroid.hp < secondAsteroidHpBefore &&
      firstAsteroid.hp > 0 &&
      secondAsteroid.hp > 0;

    this.beamSlots.primary = this.createBeamSlotRuntime();
    this.beamSlots.primary.nextTickAt = Number.POSITIVE_INFINITY;
    for (let i = 0; i < 50; i += 1) {
      this.updateBeamWeapon(getWeaponDefinition('salvage-beam'), 'primary', true, this.time.now + 1200 + i * 100, 0.1);
    }
    const overheated = harness.getState();
    for (let i = 0; i < 35; i += 1) {
      this.updateBeamWeapon(getWeaponDefinition('salvage-beam'), 'primary', false, this.time.now + 7000 + i * 100, 0.1);
    }
    const cooled = harness.getState();

    const scrapBefore = harness.getState();
    this.spawnScrapPickup('enemy', 4, this.player.x, this.player.y, new Phaser.Math.Vector2(0, 0));
    const scrapAfter = harness.collectAllScrap();
    const pass =
      unlocked.unlockedShipIds.includes('engineer') &&
      selected.selectedShipId === 'engineer' &&
      started.selectedShipId === 'engineer' &&
      started.primaryWeaponId === 'salvage-beam' &&
      started.ownedManualWeaponIds.includes('salvage-beam') &&
      availableUpgradeIds.includes('beam_focus') &&
      availableUpgradeIds.includes('beam_extended_capacitors') &&
      beamPiercePass &&
      overheated.beamOverheated &&
      cooled.beamHeat === 0 &&
      !cooled.beamOverheated &&
      scrapAfter.runScrapTotal === scrapBefore.runScrapTotal + 5 &&
      scrapAfter.playerXp > scrapBefore.playerXp;

    document.body.setAttribute('data-starvivors-phase15b-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase15b-harness-details',
      JSON.stringify({
        unlocked,
        selected,
        started,
        availableUpgradeIds,
        firstAsteroidHpBefore,
        firstAsteroidHpAfter: firstAsteroid.hp,
        secondAsteroidHpBefore,
        secondAsteroidHpAfter: secondAsteroid.hp,
        overheated,
        cooled,
        scrapBefore,
        scrapAfter,
        beamPiercePass,
        pass
      })
    );
  }

  private runTestHarnessPhase15_5(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-phase15-5-harness', 'fail');
      document.body.setAttribute('data-starvivors-phase15-5-harness-details', 'Harness was not installed.');
      return;
    }

    harness.resetProgression();
    this.startRun();
    const freeRange = harness.getState();

    this.updateFuel(10, {
      thrustForward: false,
      thrustReverse: false,
      strafeLeft: false,
      strafeRight: false,
      isThrusting: false,
      isWorldRelative: false
    });
    const afterNoThrust = harness.getState();

    this.updateFuel(10, {
      thrustForward: true,
      thrustReverse: false,
      strafeLeft: false,
      strafeRight: false,
      isThrusting: true,
      isWorldRelative: false
    });
    const afterThrust = harness.getState();

    harness.selectMission('survey-signal');
    this.startRun();
    const missionInitial = harness.getState();
    if (this.missionRuntime) {
      this.player.setPosition(this.missionRuntime.objective.x, this.missionRuntime.objective.y);
      this.playerVelocity.set(0, 0);
      this.updateMission(this.time.now + 1000);
    }
    const missionComplete = harness.getState();

    const ejectPrompt = harness.requestEject();
    const ejectCancelled = harness.cancelEject();
    harness.requestEject();
    const ejected = harness.confirmEject();

    const freeRangePass =
      freeRange.selectedMissionId === 'free-range' &&
      freeRange.missionStatus === 'open' &&
      freeRange.missionObjectiveRadius === 0 &&
      freeRange.runEndReason === 'none';
    const fuelPass =
      afterNoThrust.fuel === freeRange.fuel &&
      afterThrust.fuel < afterNoThrust.fuel &&
      afterThrust.fuelDrainMode === 'thrust-only';
    const missionPass =
      missionInitial.selectedMissionId === 'survey-signal' &&
      missionInitial.missionStatus === 'active' &&
      missionComplete.missionStatus === 'completed' &&
      missionComplete.runEndReason === 'none' &&
      !missionComplete.isResultsScreenOpen;
    const ejectPass =
      ejectPrompt.isEjectConfirmOpen &&
      !ejectCancelled.isEjectConfirmOpen &&
      ejectCancelled.runEndReason === 'none' &&
      ejected.runEndReason === 'eject' &&
      !ejected.canContinueRun &&
      ejected.isResultsScreenOpen &&
      ejected.missionStatus === 'completed';
    const pass = freeRangePass && fuelPass && missionPass && ejectPass;

    document.body.setAttribute('data-starvivors-phase15-5-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-phase15-5-harness-details',
      JSON.stringify({
        freeRange,
        afterNoThrust,
        afterThrust,
        missionInitial,
        missionComplete,
        ejectPrompt,
        ejectCancelled,
        ejected,
        freeRangePass,
        fuelPass,
        missionPass,
        ejectPass
      })
    );
  }

  private runTestHarnessUpgradeOverlayUi(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-upgrade-overlay-ui-harness', 'fail');
      document.body.setAttribute('data-starvivors-upgrade-overlay-ui-harness-details', 'Harness was not installed.');
      return;
    }

    harness.resetProgression();
    this.startRun();
    harness.grantXp(1000);
    const opened = harness.openUpgradeOverlay();
    const choices = this.getUpgradeOverlayChoices();
    const firstChoice = choices[0];
    const firstText = this.upgradeOverlayChoiceTexts[0];
    const firstMeta = this.upgradeOverlayChoiceMetaTexts[0];
    const firstHitZone = this.upgradeOverlayChoiceHitZones[0];
    const firstTextBefore = firstText.text;
    const firstMetaBefore = firstMeta.text;
    const firstChoiceLevelBefore =
      firstChoice && firstChoice.category !== 'secondary-weapon' ? this.getUpgradeLevel(firstChoice) : 0;
    const textPass =
      this.isUpgradeOverlayOpen &&
      firstText.visible &&
      firstMeta.visible &&
      firstText.text.trim().length > 0 &&
      firstMeta.text.trim().length > 0;
    const clickTargetPass =
      firstHitZone.visible &&
      Boolean(firstHitZone.input?.enabled) &&
      firstHitZone.depth > firstText.depth &&
      firstHitZone.width > 0 &&
      firstHitZone.height > 0;

    firstHitZone.emit('pointerdown', {
      event: {
        stopPropagation: () => undefined
      }
    } as Phaser.Input.Pointer);

    const afterClick = harness.getState();
    const firstChoiceLevelAfter =
      firstChoice && firstChoice.category !== 'secondary-weapon' ? this.getUpgradeLevel(firstChoice) : 0;
    const selectionPass =
      firstChoice !== undefined &&
      afterClick.bankedUpgrades === opened.bankedUpgrades - 1 &&
      (firstChoice.category === 'secondary-weapon' || firstChoiceLevelAfter === firstChoiceLevelBefore + 1);
    const pass = textPass && clickTargetPass && selectionPass;

    document.body.setAttribute('data-starvivors-upgrade-overlay-ui-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-upgrade-overlay-ui-harness-details',
      JSON.stringify({
        opened,
        firstChoice,
        firstText: firstTextBefore,
        firstMeta: firstMetaBefore,
        firstTextVisible: firstText.visible,
        firstMetaVisible: firstMeta.visible,
        firstHitZoneVisible: firstHitZone.visible,
        firstHitZoneInputEnabled: Boolean(firstHitZone.input?.enabled),
        firstHitZoneDepth: firstHitZone.depth,
        firstTextDepth: firstText.depth,
        firstChoiceLevelBefore,
        firstChoiceLevelAfter,
        afterClick,
        textPass,
        clickTargetPass,
        selectionPass,
        pass
      })
    );
  }

  private runTestHarnessBeamVisual(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-beam-visual-harness', 'fail');
      document.body.setAttribute('data-starvivors-beam-visual-harness-details', 'Harness was not installed.');
      return;
    }

    harness.resetProgression();
    harness.addCredits(250);
    harness.unlockShip('engineer');
    harness.selectShip('engineer');
    this.startRun();
    this.player.setRotation(0);
    const beamWeapon = getWeaponDefinition('salvage-beam');
    const beam = this.getResolvedWeaponStats(beamWeapon, 'primary').beam;
    const runtime = this.beamSlots.primary;
    this.updateBeamWeapon(beamWeapon, 'primary', true, this.time.now + 1000, 0.016);
    const initialLength = runtime.visualLength;
    this.updateBeamWeapon(beamWeapon, 'primary', true, this.time.now + 1070, 0.07);
    const midLength = runtime.visualLength;
    this.updateBeamWeapon(beamWeapon, 'primary', true, this.time.now + 1160, 0.09);
    const finalLength = runtime.visualLength;
    const graphicsDepth = runtime.graphics?.depth ?? Number.POSITIVE_INFINITY;
    const pass =
      Boolean(beam) &&
      Boolean(runtime.graphics) &&
      graphicsDepth < this.player.depth &&
      graphicsDepth > 9 &&
      initialLength <= midLength &&
      midLength < finalLength &&
      finalLength > (beam?.range ?? 0) * 0.9;

    document.body.setAttribute('data-starvivors-beam-visual-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-beam-visual-harness-details',
      JSON.stringify({
        selectedShip: harness.getState().selectedShipId,
        beamRange: beam?.range ?? 0,
        initialLength,
        midLength,
        finalLength,
        graphicsDepth,
        playerDepth: this.player.depth,
        hasGraphics: Boolean(runtime.graphics),
        pass
      })
    );
  }

  private runTestHarnessBeamTipScreenshot(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-beam-tip-screenshot-harness', 'fail');
      document.body.setAttribute('data-starvivors-beam-tip-screenshot-harness-details', 'Harness was not installed.');
      return;
    }

    harness.resetProgression();
    harness.addCredits(250);
    harness.unlockShip('engineer');
    harness.selectShip('engineer');
    this.startRun();

    for (let i = this.liveEnemies.length - 1; i >= 0; i -= 1) {
      this.destroyLiveEnemyWithoutRewards(this.liveEnemies[i]);
      this.liveEnemies.splice(i, 1);
    }

    this.player.setPosition(this.arena.width * 0.5 - 260, this.arena.height * 0.5);
    this.player.setRotation(Math.PI / 2);
    this.playerVelocity.set(0, 0);
    this.cameras.main.centerOn(this.player.x + 260, this.player.y);

    const beamWeapon = getWeaponDefinition('salvage-beam');
    const beam = this.getResolvedWeaponStats(beamWeapon, 'primary').beam;
    const runtime = this.beamSlots.primary;
    const target = this.spawnLiveEnemy('scout', this.player.x + 410, this.player.y, this.time.now, 'chaser');
    target.hp = 9999;
    target.body.setDepth(9);

    this.updateBeamWeapon(beamWeapon, 'primary', true, this.time.now + 1000, 0.016);
    this.updateBeamWeapon(beamWeapon, 'primary', true, this.time.now + 1160, 0.16);
    this.updateBeamWeapon(beamWeapon, 'primary', true, this.time.now + 1260, 0.1);
    this.drawBeamTipScreenshotFrame(beam, target.body, this.time.now + 1260);
    const contactSparkBursts = runtime.contactSparkBurstsEmitted;
    const graphicsDepth = runtime.graphics?.depth ?? Number.POSITIVE_INFINITY;
    const pass =
      Boolean(beam) &&
      Boolean(runtime.graphics) &&
      runtime.visualLength > (beam?.range ?? 0) * 0.9 &&
      contactSparkBursts > 0 &&
      graphicsDepth < this.player.depth &&
      graphicsDepth > 9;

    const keepBeamVisible = (): void => {
      if (!beam || !runtime.graphics?.scene || !target.body.scene) {
        return;
      }

      runtime.overheated = false;
      runtime.heat = Math.min(runtime.heat, beam.heatMax * 0.35);
      runtime.isActive = true;
      runtime.activationStartedAt = this.time.now - BEAM_IGNITION_MS;
      runtime.nextTickAt = Number.POSITIVE_INFINITY;
      this.updateBeamWeapon(beamWeapon, 'primary', true, this.time.now, 0.016);
      runtime.nextTickAt = Number.POSITIVE_INFINITY;
    };

    this.events.on(Phaser.Scenes.Events.POST_UPDATE, keepBeamVisible);
    this.time.delayedCall(8000, () => this.events.off(Phaser.Scenes.Events.POST_UPDATE, keepBeamVisible));

    document.body.setAttribute('data-starvivors-beam-tip-screenshot-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-beam-tip-screenshot-harness-details',
      JSON.stringify({
        selectedShip: harness.getState().selectedShipId,
        beamRange: beam?.range ?? 0,
        visualLength: runtime.visualLength,
        graphicsDepth,
        playerDepth: this.player.depth,
        contactSparkBursts,
        targetHp: target.hp,
        pass
      })
    );
  }

  private drawBeamTipScreenshotFrame(
    beam: ResolvedBeamWeaponStats | undefined,
    target: Phaser.GameObjects.Container,
    time: number
  ): void {
    if (!beam) {
      return;
    }

    const forward = this.getForwardDirection(this.player.rotation);
    const emitterOffset = this.getBeamEmitterOffset();
    const start = new Phaser.Math.Vector2(
      this.player.x + forward.x * emitterOffset,
      this.player.y + forward.y * emitterOffset
    );
    const visualLength = beam.range;
    const heatProgress = this.beamSlots.primary.heat / Math.max(1, beam.heatMax);
    const pulse = 0.5 + Math.sin(time * 0.028) * 0.5;
    const outerWidth = Math.max(5, beam.width * (1.15 + pulse * 0.08 + heatProgress * 0.12));
    const coreWidth = Math.max(2, outerWidth * 0.28);
    const end = new Phaser.Math.Vector2(start.x + forward.x * visualLength, start.y + forward.y * visualLength);
    const graphics = this.add.graphics().setDepth(BEAM_RENDER_DEPTH + 0.01).setBlendMode(Phaser.BlendModes.ADD);

    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, outerWidth * 2.1, 0x2fffb4, 0.08 + heatProgress * 0.06);
    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, outerWidth * 1.35, 0x20d8aa, 0.2 + pulse * 0.05);
    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, outerWidth, 0x69f0ae, 0.34);
    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, coreWidth, 0xf2fbff, 0.9);
    graphics.fillStyle(0xf2fbff, 0.68);
    graphics.fillCircle(end.x + forward.x * coreWidth * 0.16, end.y + forward.y * coreWidth * 0.16, Math.max(2, coreWidth * 0.58));
    graphics.fillStyle(0x69f0ae, 0.28);
    graphics.fillCircle(end.x, end.y, outerWidth * 0.31);

    const targetOffset = this.getWrappedDirection(this.player.x, this.player.y, target.x, target.y);
    const targetProjection = Phaser.Math.Clamp(targetOffset.dot(forward) - emitterOffset, 0, visualLength);
    const contact = new Phaser.Math.Vector2(
      start.x + forward.x * targetProjection,
      start.y + forward.y * targetProjection
    );
    for (let i = 0; i < 10; i += 1) {
      const right = new Phaser.Math.Vector2(forward.y, -forward.x);
      const spark = this.add.circle(
        contact.x - forward.x * Phaser.Math.FloatBetween(0, 12) + right.x * Phaser.Math.FloatBetween(-16, 16),
        contact.y - forward.y * Phaser.Math.FloatBetween(0, 12) + right.y * Phaser.Math.FloatBetween(-16, 16),
        Phaser.Math.FloatBetween(1.3, 2.8),
        Phaser.Utils.Array.GetRandom([0xf2fbff, 0x9fffe0, 0xffd166]),
        0.86
      );
      spark.setDepth(BEAM_RENDER_DEPTH + 0.25).setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private runTestHarnessResultsContinueFuel(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-results-continue-fuel-harness', 'fail');
      document.body.setAttribute('data-starvivors-results-continue-fuel-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    const initial = harness.getState();
    const emptyFuel = harness.emptyFuel();
    const refilledFuel = harness.refillFuel();
    const drainToggled = harness.toggleFuelDrain();
    const modeToggled = harness.toggleFuelDrainMode();
    const dead = harness.killPlayer();
    const deathContinueBlocked = harness.continueRun();

    harness.restartRun();
    const ejectPrompt = harness.requestEject();
    const ejectCancelled = harness.cancelEject();
    harness.requestEject();
    const ejected = harness.confirmEject();
    const ejectionContinueBlocked = harness.continueRun();

    harness.restartRun();
    harness.selectMission('survey-signal');
    this.startRun();
    if (this.missionRuntime) {
      this.player.setPosition(this.missionRuntime.objective.x, this.missionRuntime.objective.y);
      this.playerVelocity.set(0, 0);
      this.updateMission(this.time.now + 1000);
    }
    const missionComplete = harness.getState();
    const continued = harness.continueRun();
    const fuelControlsPass =
      emptyFuel.fuel === 0 &&
      refilledFuel.fuel === refilledFuel.maxFuel &&
      drainToggled.fuelDrainEnabled === !initial.fuelDrainEnabled &&
      modeToggled.fuelDrainMode === 'thrust-only';
    const continuePass =
      dead.isPlayerDead &&
      dead.isResultsScreenOpen &&
      deathContinueBlocked.isPlayerDead &&
      deathContinueBlocked.isResultsScreenOpen &&
      !deathContinueBlocked.canContinueRun &&
      ejectPrompt.isEjectConfirmOpen &&
      !ejectCancelled.isEjectConfirmOpen &&
      ejected.runEndReason === 'eject' &&
      ejected.isResultsScreenOpen &&
      !ejected.canContinueRun &&
      ejectionContinueBlocked.runEndReason === 'eject' &&
      ejectionContinueBlocked.isResultsScreenOpen &&
      missionComplete.runEndReason === 'none' &&
      !missionComplete.isResultsScreenOpen &&
      !missionComplete.canContinueRun &&
      !continued.isPlayerDead &&
      !continued.isResultsScreenOpen &&
      continued.runEndReason === 'none' &&
      continued.missionStatus === 'completed';
    const pass = fuelControlsPass && continuePass;

    document.body.setAttribute('data-starvivors-results-continue-fuel-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-results-continue-fuel-harness-details',
      JSON.stringify({
        initial,
        emptyFuel,
        refilledFuel,
        drainToggled,
        modeToggled,
        dead,
        deathContinueBlocked,
        ejectPrompt,
        ejectCancelled,
        ejected,
        ejectionContinueBlocked,
        missionComplete,
        continued,
        fuelControlsPass,
        continuePass
      })
    );
  }

  private runTestHarnessAsteroidStaleDestroy(): void {
    this.startRun();
    this.clearAsteroids();
    this.clearScrapPickups();

    const center = getArenaCenter(this.arena);
    const nearbyAsteroids = [
      this.createAsteroidInstance(center.x + 36, center.y, 1, new Phaser.Math.Vector2(0, 0)),
      this.createAsteroidInstance(center.x - 36, center.y, 1, new Phaser.Math.Vector2(0, 0)),
      this.createAsteroidInstance(center.x, center.y + 36, 1, new Phaser.Math.Vector2(0, 0))
    ];
    const source = this.createAsteroidInstance(center.x, center.y, 1, new Phaser.Math.Vector2(0, 0));

    this.basicAsteroids.push(...nearbyAsteroids, source);
    const staleSourceIndex = this.basicAsteroids.indexOf(source);
    let staleIndexNoop = false;
    let sourceDestroyed = false;
    let errorMessage = '';

    try {
      this.applyPulseExplosion(
        {
          damage: ASTEROID_TIER_CONFIG[1].hp,
          effects: {
            explosionRadius: 160,
            explosionDamageMultiplier: 1
          }
        } as PlayerProjectile,
        source.body,
        source.body.x,
        source.body.y
      );
      staleIndexNoop = !this.destroyBasicAsteroid(staleSourceIndex);
      sourceDestroyed = this.destroyBasicAsteroidInstance(source);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    const pass =
      errorMessage === '' &&
      staleIndexNoop &&
      sourceDestroyed &&
      !this.basicAsteroids.includes(source);

    document.body.setAttribute('data-starvivors-asteroid-stale-destroy-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-asteroid-stale-destroy-harness-details',
      JSON.stringify({
        staleSourceIndex,
        staleIndexNoop,
        sourceDestroyed,
        activeAsteroids: this.basicAsteroids.length,
        errorMessage
      })
    );
  }

  private runTestHarnessEnemyContactBalance(): void {
    const harness = window.starvivorsTestHarness;

    if (!harness) {
      document.body.setAttribute('data-starvivors-enemy-contact-harness', 'fail');
      document.body.setAttribute('data-starvivors-enemy-contact-harness-details', 'Harness was not installed.');
      return;
    }

    this.startRun();
    const enemy = this.liveEnemies[0];

    if (!enemy) {
      document.body.setAttribute('data-starvivors-enemy-contact-harness', 'fail');
      document.body.setAttribute('data-starvivors-enemy-contact-harness-details', 'No live enemy spawned.');
      return;
    }

    const testTime = this.time.now + 1000;
    const playerStartX = this.arena.width / 2;
    const playerStartY = this.arena.height / 2;
    this.player.setPosition(playerStartX, playerStartY);
    this.playerVelocity.set(0, 0);
    enemy.body.setPosition(playerStartX + 30, playerStartY);
    enemy.wrapMirrorBody.setPosition(enemy.body.x, enemy.body.y);
    enemy.velocity.set(0, 0);
    enemy.knockbackVelocity.set(0, 0);
    enemy.blackHoleVelocity.set(0, 0);
    this.nextPlayerContactImpulseAt = 0;

    const contact = this.getEnemyContact();
    const playerXBefore = this.player.x;
    const enemyXBefore = enemy.body.x;

    if (contact) {
      this.resolvePlayerEnemyContact(contact, testTime);
    }

    const scoutDefinition = ENEMY_LAB_DEFINITIONS.find((definition) => definition.id === 'scout');
    const recoilUntil = typeof enemy.stateData.contactRecoilUntil === 'number' ? enemy.stateData.contactRecoilUntil : 0;
    const pass =
      Boolean(contact) &&
      (contact?.normal.x ?? 0) < -0.9 &&
      this.player.x < playerXBefore &&
      enemy.body.x > enemyXBefore &&
      this.playerVelocity.x < 0 &&
      enemy.knockbackVelocity.x > 0 &&
      recoilUntil > testTime &&
      scoutDefinition?.stats.speed === 122;

    document.body.setAttribute('data-starvivors-enemy-contact-harness', pass ? 'pass' : 'fail');
    document.body.setAttribute(
      'data-starvivors-enemy-contact-harness-details',
      JSON.stringify({
        contactNormalX: contact?.normal.x ?? null,
        playerXBefore,
        playerXAfter: this.player.x,
        enemyXBefore,
        enemyXAfter: enemy.body.x,
        playerVelocityX: this.playerVelocity.x,
        enemyKnockbackVelocityX: enemy.knockbackVelocity.x,
        recoilUntil,
        scoutSpeed: scoutDefinition?.stats.speed ?? null
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
    this.sectorScale = this.getConfiguredSectorScale();
    this.arena = createArenaSize(viewport, this.sectorScale);
    const center = getArenaCenter(this.arena);

    this.debugMenuHost?.destroy();
    this.secretControlOverlay?.destroy();
    this.deathShards = clearDeathShardsSystem(this.deathShards);
    this.children.removeAll(true);
    this.combatFeedback.clear();
    this.debugMenuHost = undefined;
    this.secretControlOverlay = undefined;
    this.mainMenuScreen = undefined;
    this.shipSelectScreen = undefined;
    this.shopScreen = undefined;
    this.ejectConfirmScreen = undefined;
    this.ensureSelectedShipStartingWeaponAvailable(this.getSelectedShipDefinition());
    this.playerWeapons = createPlayerWeaponRuntimeState(this.getSelectedShipDefinition(), this.weaponLoadout);
    this.hasResolvedSecondaryWeaponChoice = false;
    this.rammingShieldImage = undefined;
    this.rammingShieldState = createRammingShieldRuntimeState(
      this.hasRammingShield(),
      this.hasRammingShield() ? this.getRammingShieldStats() : undefined
    );
    this.playerVelocity.set(0, 0);
    this.cameraLead.set(0, 0);
    this.fuel = RUN_FUEL_MAX;
    this.missionRuntime = undefined;
    this.missionObjectiveBeacon = undefined;
    this.missionObjectiveBeaconRing = undefined;
    this.missionObjectiveBeaconCore = undefined;
    this.worldEvents = [];
    this.rareEvents = [];
    this.clearRammingShieldDashBurst();
    this.runScrapTotal = 0;
    this.runScrapSpent = 0;
    this.lastRunCreditsEarned = 0;
    this.lastRunScrapSpent = 0;
    this.lastRunScrapConverted = 0;
    this.lastRunUnlockedRewards = [];
    this.hasPaidRunCredits = false;
    this.lastRunSurvivalMs = 0;
    this.playerInvulnerableUntil = 0;
    this.isPlayerDead = false;
    this.runEndReason = 'none';
    this.playerXp = 0;
    this.nextXpThreshold = INITIAL_XP_THRESHOLD;
    this.bankedUpgrades = 0;
    this.rerollsThisRun = 0;
    this.resultsScreen = undefined;
    this.ejectConfirmScreen = undefined;
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.resetBeamRuntime();
    this.basicEnemies = [];
    this.shooterEnemies = [];
    this.tankEnemies = [];
    this.liveEnemies = [];
    this.basicAsteroids = [];
    this.enemyWreckageDebris = [];
    this.deathShards = [];
    this.scrapPickups = [];
    this.sectorAsteroidSpawns = [];
    this.sectorScrapSpawns = [];
    this.sectorSignalSpawns = [];
    this.activeSectorAsteroids.clear();
    this.activeSectorScrapPickups.clear();
    this.activeSectorSignals.clear();
    this.sectorAsteroidIds = new WeakMap<BasicAsteroid, string>();
    this.sectorScrapIds = new WeakMap<ScrapPickup, string>();
    this.sectorSignalBeacons = [];
    this.worldSquads = [];
    this.nextScrapRollupAt = 0;
    this.nextAsteroidCoalesceAt = 0;
    this.asteroidDestructionHistory = [];
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
    this.encounterDirectorState = createEncounterDirectorState(this.runStartedAt + ENEMY_SWARM_FIRST_SPAWN_MS);
    this.runUpgradeLevels = createInitialRunUpgradeLevels();
    this.playerHull = this.getPlayerMaxHull();
    this.isUpgradeOverlayOpen = false;
    this.isPauseMenuOpen = false;
    this.upgradeOverlayOpenedAt = 0;
    this.pauseMenuOpenedAt = 0;
    this.specialUpgradeOverlayChoices = null;
    this.sectorScannerRuntime = createSectorScannerRuntime();
    this.totalUpgradePauseMs = 0;
    this.totalPauseMenuPauseMs = 0;
    this.debugMenuOpenedAt = 0;
    this.totalDebugPauseMs = 0;
    this.awaitingBinding = undefined;
    this.pauseMenuScreen = undefined;
    this.minimap.reset();
    this.debugState.resetForRun();
    this.debugBlackHoleInfluenceRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleDamageRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleVisualScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleCoreScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleFieldTuning = { ...DEFAULT_BLACK_HOLE_FIELD_TUNING };
    this.debugBlackHoleVacuumTuning = { ...DEFAULT_BLACK_HOLE_VACUUM_TUNING };
    this.isBlackHolePlayerCaptureEnabled = true;
    this.isBlackHoleObjectConsumptionEnabled = true;
    this.areBlackHoleWarningVisualsEnabled = true;
    this.blackHolePlayerCaptureStartedAt = null;
    this.blackHoleConsumedObjectsThisRun = 0;
    this.debugBlackHoleGrowthOffsetMs = 0;
    this.starfield.resetState();

    this.createStarfield();
    this.player = this.createPlayerShip(center.x, center.y);
    this.sectorSeed = this.getConfiguredSectorSeed();
    this.sectorLayout = generateSectorLayout({
      arena: this.arena,
      seed: this.sectorSeed,
      startX: center.x,
      startY: center.y
    });
    this.createWorldEvents(center);
    this.createRareEvents(center);
    this.createMissionRuntime(center);
    this.createMissionObjectiveBeacon();
    this.createInitialLiveEnemies(center);
    this.createSectorAsteroidSpawns(center);
    this.createSectorScrapSpawns();
    this.createSectorSignalSpawns();
    this.createWorldSquads(center);
    this.updateSectorStreaming();
    this.blackHole = new BlackHoleSystem(this, this.getBlackHoleSpawnPosition(viewport, center));
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setFollowOffset(0, 0);
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
    this.createDebugMenu();
    this.createSecretControlOverlay();
    this.updateGameplayHud(this.time.now);
    this.updateMinimap();
    this.updateDebugText(0);
  }

  private getConfiguredSectorScale(): SectorScale {
    const query = new URLSearchParams(window.location.search);
    const requestedScale = Number(query.get('sectorScale') ?? query.get('sector'));

    return normalizeSectorScale(requestedScale);
  }

  private getConfiguredSectorSeed(): string {
    const query = new URLSearchParams(window.location.search);
    const requestedSeed = query.get('sectorSeed');

    return requestedSeed && requestedSeed.trim().length > 0
      ? requestedSeed.trim()
      : `sector-${Math.round(this.runStartedAt)}-${this.sectorScale}`;
  }

  private getConfiguredMissionId(): MissionDefinitionId {
    const query = new URLSearchParams(window.location.search);
    const requestedMissionId = query.get('missionId');

    return requestedMissionId && isMissionDefinitionId(requestedMissionId)
      ? requestedMissionId
      : this.selectedMissionId;
  }

  private applyProgressionState(state: ProgressionState): void {
    this.progressionState = state;
    this.totalCredits = state.totalCredits;
    this.selectedShipId = state.selectedShipId;
    this.selectedSkinIds = { ...state.selectedSkinIds };
    this.weaponLoadout = cloneWeaponLoadout(state.weaponLoadout);
    this.weaponMkLevels = { ...state.weaponMkLevels };
    this.unlockedShipIds = new Set<ShipId>(state.unlockedShipIds);
    this.permanentUpgradeLevels = { ...state.permanentUpgradeLevels };
    this.activePermanentUpgradeLevels = { ...state.activePermanentUpgradeLevels };

    if (!this.unlockedShipIds.has(this.selectedShipId)) {
      this.selectedShipId = DEFAULT_SHIP_ID;
    }

    if (!this.unlockedShipIds.has(this.hangarPreviewShipId)) {
      this.hangarPreviewShipId = this.selectedShipId;
    }
  }

  private saveProgression(): void {
    this.progressionState.totalCredits = this.totalCredits;
    this.progressionState.selectedShipId = this.selectedShipId;
    this.progressionState.selectedSkinIds = { ...this.selectedSkinIds };
    this.progressionState.unlockedShipIds = [...this.unlockedShipIds];
    this.progressionState.weaponLoadout = cloneWeaponLoadout(this.weaponLoadout);
    this.progressionState.weaponMkLevels = { ...this.weaponMkLevels };
    this.progressionState.permanentUpgradeLevels = { ...this.permanentUpgradeLevels };
    this.progressionState.activePermanentUpgradeLevels = { ...this.activePermanentUpgradeLevels };
    this.progressionState.secretControlUnlocked = this.progressionState.secretControlUnlocked === true;
    saveProgressionState(this.progressionState);
  }

  private recordUnlockedRewards(hooks: RewardHookId[]): void {
    if (hooks.length <= 0) {
      return;
    }

    this.lastRunUnlockedRewards.push(...hooks.filter((hook) => !this.lastRunUnlockedRewards.includes(hook)));
    this.saveProgression();
    if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
    }
  }

  private startRun(): void {
    if (this.autoRunDiagnostics.isActive()) {
      this.autoRunDiagnostics.endRun('restart');
    }

    const selectedShip = this.getSelectedShipDefinition();

    if (!this.canStartRunWithShip(selectedShip)) {
      this.selectedShipId = DEFAULT_SHIP_ID;
    }

    if (!this.canStartConfiguredRun()) {
      this.showShipSelect();
      return;
    }

    this.selectedMissionId = this.getConfiguredMissionId();
    this.destroyMainMenuScreen();
    this.destroyShipSelectScreen();
    this.destroyShopScreen();
    this.destroyResultsScreen();
    this.pauseMenuScreen = destroyScreenHandle(this.pauseMenuScreen, { disableZones: true, resetCursor: () => this.resetUiCursor() });
    this.isPauseMenuOpen = false;
    this.rebuildWorld();
    this.autoRunDiagnostics.startRun(this.getSelectedShipDefinition().displayName);
  }

  private showSplashScreen(): void {
    this.gameFlowState = 'splash';
    this.secretControlOverlay?.destroy();
    this.children.removeAll(true);
    this.debugMenuHost = undefined;
    this.secretControlOverlay = undefined;
    this.mainMenuScreen = undefined;
    this.shopScreen = undefined;
    this.shipSelectScreen = undefined;
    this.resultsScreen = undefined;
    this.pauseMenuScreen = undefined;
    this.ejectConfirmScreen = undefined;
    this.isPauseMenuOpen = false;
    this.awaitingBinding = undefined;

    this.mainMenuScreen = createSplashScreen({
      scene: this,
      isActionActive: () => this.gameFlowState === 'splash',
      resetCursor: () => this.resetUiCursor(),
      onContinue: () => this.showShipSelect()
    });
    this.createDebugMenu();
  }

  private createSecretControlOverlay(): void {
    this.secretControlOverlay?.destroy();
    this.secretControlOverlay = createSecretControlOverlay(this, {
      close: () => this.closeSecretControlOverlay(),
      restoreHull: () => this.restorePlayerHull(),
      refillFuel: () => this.refillFuel(),
      emergencyTeleport: () => this.debugEmergencyTeleportSafe(),
      spawnScrapBurst: () => this.debugSpawnSecretScrapBurst(),
      toggleTrainingInvulnerability: () => this.toggleSecretTrainingInvulnerability(),
      spawnEnemyWave: () => this.debugSpawnSecretEnemyWave(),
      moveBlackHoleNear: () => this.moveBlackHoleNearPlayer((this.blackHole?.captureRadius ?? 200) + 80),
      moveBlackHoleFar: () => this.moveBlackHoleNearPlayer(720)
    });
  }

  private showMainMenu(): void {
    if (this.autoRunDiagnostics.isActive()) {
      this.autoRunDiagnostics.endRun('main-menu');
    }

    this.gameFlowState = 'command';
    this.deathShards = clearDeathShardsSystem(this.deathShards);
    this.secretControlOverlay?.destroy();
    this.children.removeAll(true);
    this.debugMenuHost = undefined;
    this.secretControlOverlay = undefined;
    this.mainMenuScreen = undefined;
    this.shopScreen = undefined;
    this.shipSelectScreen = undefined;
    this.resultsScreen = undefined;
    this.pauseMenuScreen = undefined;
    this.isPauseMenuOpen = false;
    this.awaitingBinding = undefined;

    this.mainMenuScreen = createCommandScreen({
      scene: this,
      totalCredits: this.totalCredits,
      selectedShipName: this.getSelectedShipDefinition().displayName,
      selectedMissionId: this.selectedMissionId,
      selectedMission: this.getSelectedMissionDefinition(),
      nav: this.getPreRunNavConfig(),
      isActionActive: () => this.gameFlowState === 'command',
      resetCursor: () => this.resetUiCursor(),
      onSelectMission: (missionId) => {
        this.selectedMissionId = missionId;
        this.showMainMenu();
      }
    });
    this.createDebugMenu();
  }

  private getSelectedMissionDefinition(): MissionDefinition {
    return getMissionDefinition(this.selectedMissionId);
  }

  private cycleSelectedMission(): void {
    const currentIndex = missionRegistry.findIndex((mission) => mission.id === this.selectedMissionId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % missionRegistry.length : 0;

    this.selectedMissionId = missionRegistry[nextIndex].id;
    this.showMainMenu();
  }

  private showSettings(): void {
    this.gameFlowState = 'settings';
    this.destroyMainMenuScreen();
    this.destroyShipSelectScreen();
    this.destroyShopScreen();

    this.mainMenuScreen = createSettingsHubScreen({
      scene: this,
      settings: cloneGameSettings(this.gameSettings),
      nav: this.getPreRunNavConfig(),
      isActionActive: () => this.gameFlowState === 'settings',
      resetCursor: () => this.resetUiCursor(),
      onToggleMovementMode: () => {
        this.gameSettings = {
          ...this.gameSettings,
          movementMode: this.gameSettings.movementMode === 'shipRelative' ? 'worldRelative' : 'shipRelative'
        };
        saveGameSettings(this.gameSettings);
        this.showSettings();
      },
      onResetControls: () => {
        this.gameSettings = resetControlSettings(this.gameSettings);
        this.showSettings();
      },
      onResetAll: () => {
        this.gameSettings = resetGameSettings();
        this.showSettings();
      }
    });
    this.createDebugMenu();
  }

  private getPreRunNavConfig(): {
    canPlay: boolean;
    playDisabledReason: string;
    isActionActive: () => boolean;
    resetCursor: () => void;
    onPlay: () => void;
    onShowCommand: () => void;
    onShowHangar: () => void;
    onShowShop: () => void;
    onShowSettings: () => void;
  } {
    return {
      canPlay: this.canStartConfiguredRun(),
      playDisabledReason: this.getPlayDisabledReason(),
      isActionActive: () => this.isPreRunFlowState(),
      resetCursor: () => this.resetUiCursor(),
      onPlay: () => this.startRun(),
      onShowCommand: () => this.showMainMenu(),
      onShowHangar: () => this.showShipSelect(),
      onShowShop: () => this.showShop('mainMenu'),
      onShowSettings: () => this.showSettings()
    };
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
      selectedSkinIds: this.selectedSkinIds,
      selectedMission: this.getSelectedMissionDefinition(),
      weaponLoadout: this.weaponLoadout,
      availableWeaponIds: this.getAvailableHangarWeaponIds(),
      weaponMkLevels: this.weaponMkLevels,
      selectedInventoryWeaponId: this.selectedHangarWeaponId,
      inventoryScrollIndex: this.hangarInventoryScrollIndex,
      nav: this.getPreRunNavConfig(),
      isActionActive: () => this.gameFlowState === 'shipSelect',
      resetCursor: () => this.resetUiCursor(),
      onPreviewShip: (shipId) => {
        this.hangarPreviewShipId = shipId;
        this.showShipSelect();
      },
      onShipAction: (ship) => this.handleShipAction(ship),
      onSelectSkin: (shipId, skinId) => {
        this.selectedSkinIds[shipId] = skinId;
        this.saveProgression();
        this.showShipSelect();
      },
      onSelectInventoryWeapon: (weaponId) => {
        this.selectedHangarWeaponId = weaponId;
        this.showShipSelect();
      },
      onAssignWeapon: (slot, slotIndex, weaponId) => this.assignPreRunWeaponLoadout(slot, slotIndex, weaponId),
      onClearWeapon: (slot, slotIndex) => this.clearPreRunWeaponLoadout(slot, slotIndex),
      onInventoryScroll: (delta) => {
        const maxIndex = Math.max(0, this.getAvailableHangarWeaponIds().length - 1);
        this.hangarInventoryScrollIndex = Phaser.Math.Clamp(this.hangarInventoryScrollIndex + delta, 0, maxIndex);
        this.showShipSelect();
      }
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
    this.ensureSelectedShipStartingWeaponAvailable(ship);
    this.saveProgression();
    this.showShipSelect();
  }

  private isShipUnlocked(shipId: ShipId): boolean {
    return this.unlockedShipIds.has(shipId);
  }

  private canStartRunWithShip(ship: ShipRegistryEntry): boolean {
    return ship.selectable && this.isShipUnlocked(ship.id);
  }

  private canStartConfiguredRun(): boolean {
    return this.canStartRunWithShip(this.getSelectedShipDefinition()) && this.getFirstLoadoutWeaponId('primary') !== null;
  }

  private getPlayDisabledReason(): string {
    if (!this.canStartRunWithShip(this.getSelectedShipDefinition())) {
      return 'LOCKED';
    }

    if (!this.getFirstLoadoutWeaponId('primary')) {
      return 'NO LEFT WEAPON';
    }

    return 'PLAY';
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
    this.ensureSelectedShipStartingWeaponAvailable(ship);
    this.saveProgression();
    this.showShipSelect();
  }

  private assignPreRunWeaponLoadout(slot: WeaponSlotType, slotIndex: number, weaponId: WeaponId): void {
    const weapon = getWeaponDefinition(weaponId);
    if (!weapon.slotCompatibility.includes(slot) || !this.getAvailableHangarWeaponIds().includes(weaponId)) {
      return;
    }

    this.weaponLoadout = cloneWeaponLoadout(this.weaponLoadout);
    removeWeaponFromLoadout(this.weaponLoadout, weaponId);
    this.weaponLoadout[slot][Phaser.Math.Clamp(slotIndex, 0, 2)] = weaponId;
    this.selectedHangarWeaponId = weaponId;
    this.saveProgression();
    this.showShipSelect();
  }

  private clearPreRunWeaponLoadout(slot: WeaponSlotType, slotIndex: number): void {
    this.weaponLoadout = cloneWeaponLoadout(this.weaponLoadout);
    this.weaponLoadout[slot][Phaser.Math.Clamp(slotIndex, 0, 2)] = null;
    this.saveProgression();
    this.showShipSelect();
  }

  private ensureSelectedShipStartingWeaponAvailable(ship: ShipRegistryEntry): void {
    if (!ship.startingPrimaryWeaponId && !ship.startingSecondaryWeaponId) {
      return;
    }

    const weaponIds = new Set(this.progressionState.unlockedWeaponIds);
    if (ship.startingPrimaryWeaponId) {
      weaponIds.add(ship.startingPrimaryWeaponId);
    }
    if (ship.startingSecondaryWeaponId) {
      weaponIds.add(ship.startingSecondaryWeaponId);
    }
    this.progressionState.unlockedWeaponIds = [...weaponIds];
    const primaryWeapon = ship.startingPrimaryWeaponId ? getWeaponDefinition(ship.startingPrimaryWeaponId) : null;
    const currentPrimaryWeaponId = this.getFirstLoadoutWeaponId('primary');
    const shouldUseStartingPrimary =
      !currentPrimaryWeaponId ||
      (currentPrimaryWeaponId !== ship.startingPrimaryWeaponId && this.isOtherShipStartingWeapon(currentPrimaryWeaponId, ship.id));
    if (ship.startingPrimaryWeaponId && shouldUseStartingPrimary && primaryWeapon?.slotCompatibility.includes('primary')) {
      this.weaponLoadout = cloneWeaponLoadout(this.weaponLoadout);
      this.weaponLoadout.primary[0] = ship.startingPrimaryWeaponId;
    }
    const secondaryWeapon = ship.startingSecondaryWeaponId ? getWeaponDefinition(ship.startingSecondaryWeaponId) : null;
    if (
      ship.startingSecondaryWeaponId &&
      !this.getFirstLoadoutWeaponId('secondary') &&
      secondaryWeapon?.slotCompatibility.includes('secondary')
    ) {
      this.weaponLoadout = cloneWeaponLoadout(this.weaponLoadout);
      this.weaponLoadout.secondary[0] = ship.startingSecondaryWeaponId;
    }
  }

  private isOtherShipStartingWeapon(weaponId: WeaponId | null, selectedShipId: ShipId): boolean {
    if (!weaponId) {
      return false;
    }

    return shipRegistry.some(
      (ship) => ship.id !== selectedShipId && (ship.startingPrimaryWeaponId === weaponId || ship.startingSecondaryWeaponId === weaponId)
    );
  }

  private getAvailableHangarWeaponIds(): WeaponId[] {
    const weaponIds = new Set<WeaponId>(['pulse-cannon', ...this.progressionState.unlockedWeaponIds]);
    for (const ship of shipRegistry) {
      if (this.isShipUnlocked(ship.id) && ship.startingPrimaryWeaponId) {
        weaponIds.add(ship.startingPrimaryWeaponId);
      }
      if (this.isShipUnlocked(ship.id) && ship.startingSecondaryWeaponId) {
        weaponIds.add(ship.startingSecondaryWeaponId);
      }
    }

    return [...weaponIds];
  }

  private getFirstLoadoutWeaponId(slot: WeaponSlotType): WeaponId | null {
    return this.weaponLoadout[slot].find((weaponId) => weaponId !== null && getWeaponDefinition(weaponId).slotCompatibility.includes(slot)) ?? null;
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
      isSectorScannerAvailable: isSectorScannerAvailable(this.progressionState),
      sectorScannerLevel: this.progressionState.sectorScannerLevel,
      sectorScannerCost: getSectorScannerCost(this.progressionState),
      getPermanentUpgradeLevel: (id) => this.getPermanentUpgradeLevel(id),
      getActivePermanentUpgradeLevel: (id) => this.getActivePermanentUpgradeLevel(id),
      isPermanentUpgradeMaxed: (upgrade) => this.isPermanentUpgradeMaxed(upgrade),
      canPurchasePermanentUpgrade: (upgrade) => this.canPurchasePermanentUpgrade(upgrade),
      getPermanentUpgradeCost: (upgrade) => this.getPermanentUpgradeCost(upgrade),
      isActionActive: () => this.gameFlowState === 'shop',
      resetCursor: () => this.resetUiCursor(),
      nav: backTarget === 'mainMenu' ? this.getPreRunNavConfig() : undefined,
      onPurchasePermanentUpgrade: (upgrade) => this.purchasePermanentUpgrade(upgrade),
      onAdjustActivePermanentUpgradeLevel: (id, delta) => this.adjustActivePermanentUpgradeLevel(id, delta),
      onPurchaseSectorScanner: () => this.purchaseSectorScanner(),
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
    return BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING;
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
    this.saveProgression();
    if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
    }
  }

  private adjustActivePermanentUpgradeLevel(id: PermanentUpgradeId, delta: number): void {
    const purchasedLevel = this.getPermanentUpgradeLevel(id);
    const activeLevel = this.getActivePermanentUpgradeLevel(id);
    this.activePermanentUpgradeLevels[id] = Phaser.Math.Clamp(activeLevel + delta, 0, purchasedLevel);
    this.saveProgression();
    if (this.gameFlowState === 'shop') {
      this.showShop(this.shopBackTarget);
    }
  }

  private purchaseSectorScanner(): void {
    const nextLevel = getNextSectorScannerLevel(this.progressionState);
    const cost = getSectorScannerCost(this.progressionState);

    if (!nextLevel || cost === null || this.totalCredits < cost) {
      return;
    }

    this.totalCredits -= cost;
    this.progressionState.sectorScannerLevel = nextLevel;
    this.saveProgression();
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

  private getBlackHoleSpawnPosition(viewport: ViewportSize, playerStart: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const blackHoleRareEvent = this.rareEvents.find(
      (event) => event.status === 'active' && event.definition.kind === 'black-hole'
    );

    if (blackHoleRareEvent) {
      return new Phaser.Math.Vector2(blackHoleRareEvent.x, blackHoleRareEvent.y);
    }

    return this.getRandomBlackHoleZoneSpawnPosition(viewport, playerStart);
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

  private createWorldEvents(center: Phaser.Math.Vector2): void {
    const generatedEvents = generateWorldEvents({
      arena: this.arena,
      sector: this.sectorLayout,
      seed: this.sectorSeed,
      startX: center.x,
      startY: center.y,
      guaranteedEventIds: this.getGuaranteedWorldEventIds()
    });

    this.worldEvents = generatedEvents.map((event) => this.createWorldEventInstance(event));
  }

  private createRareEvents(center: Phaser.Math.Vector2): void {
    const generatedEvents = generateRareEvents({
      arena: this.arena,
      sector: this.sectorLayout,
      seed: this.sectorSeed,
      startX: center.x,
      startY: center.y,
      guaranteedEventIds: this.getGuaranteedRareEventIds(),
      forcedEventIds: this.getForcedRareEventIds()
    });

    this.rareEvents = generatedEvents.map((event) => this.createRareEventInstance(event));
  }

  private getGuaranteedWorldEventIds(): WorldEventDefinitionId[] {
    const mission = this.getSelectedMissionDefinition();

    return mission.guaranteedWorldEventId ? [mission.guaranteedWorldEventId] : [];
  }

  private getGuaranteedRareEventIds(): RareEventDefinitionId[] {
    const mission = this.getSelectedMissionDefinition();

    return mission.guaranteedRareEventId ? [mission.guaranteedRareEventId] : [];
  }

  private getForcedRareEventIds(): RareEventDefinitionId[] {
    const forced = new URLSearchParams(window.location.search).get('forceRareEvent');
    if (!forced) {
      return [];
    }

    return forced
      .split(',')
      .map((value) => value.trim())
      .filter(isRareEventDefinitionId);
  }

  private createRareEventInstance(event: GeneratedRareEvent): RareEventInstance {
    const definition = getRareEventDefinition(event.definitionId);
    const body = createRareEventBodySystem(this, event.x, event.y, definition, false);
    const wrapMirrorBody = createRareEventBodySystem(this, event.x, event.y, definition, true);
    wrapMirrorBody.setVisible(false);

    return {
      id: event.id,
      definition,
      x: event.x,
      y: event.y,
      regionId: event.regionId,
      source: event.source,
      body,
      wrapMirrorBody,
      status: 'active',
      investigationProgressMs: 0,
      activeEnemyIds: [],
      squadSpawned: false,
      rewardDropped: false,
      unlockHooksResolved: false
    };
  }

  private createWorldEventInstance(event: GeneratedWorldEvent): WorldEventInstance {
    const definition = getWorldEventDefinition(event.definitionId);
    const body = this.createWorldEventBody(event.x, event.y, definition, false);
    const wrapMirrorBody = this.createWorldEventBody(event.x, event.y, definition, true);
    wrapMirrorBody.setVisible(false);

    return {
      id: event.id,
      definition,
      x: event.x,
      y: event.y,
      regionId: event.regionId,
      source: event.source,
      body,
      wrapMirrorBody,
      hp: definition.hp,
      maxHp: definition.hp,
      status: 'active',
      guardSquadsSpawned: false,
      rewardDropped: false
    };
  }

  private createWorldEventBody(
    x: number,
    y: number,
    definition: WorldEventDefinition,
    isMirror: boolean
  ): Phaser.GameObjects.Container {
    const dangerRing = this.add.circle(0, 0, definition.dangerRadius, 0xff5964, isMirror ? 0 : 0.025);
    dangerRing.setStrokeStyle(2, 0xff5964, isMirror ? 0.18 : 0.22);
    const hullGlow = this.add.ellipse(0, 0, definition.hitRadius * 2.6, definition.hitRadius * 1.44, 0xff5964, 0.12);
    const hull = this.add.ellipse(0, 0, definition.hitRadius * 2.1, definition.hitRadius * 1.08, 0x182436, 0.96);
    hull.setStrokeStyle(3, 0xffc857, 0.86);
    const core = this.add.circle(0, 0, definition.hitRadius * 0.34, 0xffc857, 0.72);
    const bayLeft = this.add.rectangle(-definition.hitRadius * 0.58, 0, definition.hitRadius * 0.34, definition.hitRadius * 0.42, 0x25354d, 0.95);
    const bayRight = this.add.rectangle(definition.hitRadius * 0.58, 0, definition.hitRadius * 0.34, definition.hitRadius * 0.42, 0x25354d, 0.95);
    bayLeft.setStrokeStyle(1, 0x73f2ff, 0.48);
    bayRight.setStrokeStyle(1, 0x73f2ff, 0.48);
    const label = this.add
      .text(0, -definition.hitRadius - 38, definition.shortName.toUpperCase(), {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        color: '#ffc857',
        align: 'center'
      })
      .setOrigin(0.5);

    const body = this.add.container(x, y, [dangerRing, hullGlow, hull, bayLeft, bayRight, core, label]);
    body.setDepth(isMirror ? 5 : 6);
    body.setSize(definition.hitRadius * 2, definition.hitRadius * 2);
    return body;
  }

  private createMissionRuntime(center: Phaser.Math.Vector2): void {
    const definition = this.getSelectedMissionDefinition();
    if (definition.objectiveType === 'free-range') {
      this.missionRuntime = undefined;
      return;
    }

    const targetWorldEvent = definition.guaranteedWorldEventId
      ? this.worldEvents.find((event) => event.definition.id === definition.guaranteedWorldEventId)
      : undefined;
    const targetRareEvent = definition.guaranteedRareEventId
      ? this.rareEvents.find((event) => event.definition.id === definition.guaranteedRareEventId)
      : undefined;
    const objective = targetWorldEvent
      ? {
          id: `${targetWorldEvent.id}-objective`,
          label: targetWorldEvent.definition.shortName,
          x: targetWorldEvent.x,
          y: targetWorldEvent.y,
          radius: targetWorldEvent.definition.hitRadius + 58,
          regionId: targetWorldEvent.regionId
        }
      : targetRareEvent
        ? {
            id: `${targetRareEvent.id}-objective`,
            label: targetRareEvent.definition.shortName,
            x: targetRareEvent.x,
            y: targetRareEvent.y,
            radius: targetRareEvent.definition.objectiveRadius,
            regionId: targetRareEvent.regionId
          }
      : generateMissionObjective({
          arena: this.arena,
          sector: this.sectorLayout,
          mission: definition,
          seed: this.sectorSeed,
          startX: center.x,
          startY: center.y
        });

    this.missionRuntime = {
      definition,
      objective,
      status: 'active',
      completedAt: null,
      failedAt: null,
      failureReason: null,
      targetWorldEventId: targetWorldEvent?.id ?? null,
      targetRareEventId: targetRareEvent?.id ?? null
    };
  }

  private createMissionObjectiveBeacon(): void {
    if (!this.missionRuntime) {
      return;
    }

    const objective = this.missionRuntime.objective;
    const outer = this.add.circle(0, 0, objective.radius, 0xffc857, 0.05);
    outer.setStrokeStyle(2, 0xffc857, 0.62);
    const ring = this.add.circle(0, 0, objective.radius * 0.54, 0x000000, 0);
    ring.setStrokeStyle(2, 0xf2fbff, 0.84);
    const core = this.add.circle(0, 0, 7, 0xffc857, 0.9);
    const label = this.add
      .text(0, -objective.radius - 28, this.missionRuntime.definition.shortName.toUpperCase(), {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#ffc857',
        align: 'center'
      })
      .setOrigin(0.5);

    this.missionObjectiveBeacon = this.add.container(objective.x, objective.y, [outer, ring, core, label]);
    this.missionObjectiveBeacon.setDepth(8);
    this.missionObjectiveBeaconRing = ring;
    this.missionObjectiveBeaconCore = core;
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

  private createWorldSquads(center: Phaser.Math.Vector2): void {
    const random = new Phaser.Math.RandomDataGenerator([`${this.sectorSeed}-world-squads`]);
    const candidateRegions = this.sectorLayout.regions.filter((region) => region.type !== 'safe-drift');
    const squadIds: EncounterDefinitionId[] = [
      'scout-pack',
      'gunner-escort',
      'strike-wing',
      'sniper-screen',
      'support-group',
      'carrier-group'
    ];
    const states: WorldSquadState[] = ['guard', 'patrol', 'roam', 'patrol', 'guard', 'roam'];

    this.worldSquads = [];

    for (let index = 0; index < WORLD_SQUAD_COUNT; index += 1) {
      const region = candidateRegions[index % Math.max(1, candidateRegions.length)] ?? this.sectorLayout.regions[0];
      const position = this.getRandomPointInSectorRegion(region, random);
      if (getWrappedDistance(this.arena, center.x, center.y, position.x, position.y) < ASTEROID_SAFE_SPAWN_RADIUS * 1.6) {
        position.x = wrapCoordinate(region.x, this.arena.width);
        position.y = wrapCoordinate(region.y, this.arena.height);
      }

      const patrolAngle = random.realInRange(0, Math.PI * 2);
      const patrolDistance = region.radius * random.realInRange(0.42, 0.76);
      const squadId = squadIds[index % squadIds.length];
      const encounter = getEncounterDefinition(squadId);

      this.worldSquads.push({
        id: `world-squad-${index + 1}`,
        squadId,
        displayName: encounter.displayName,
        regionId: region.id,
        x: position.x,
        y: position.y,
        homeX: position.x,
        homeY: position.y,
        patrolX: wrapCoordinate(position.x + Math.cos(patrolAngle) * patrolDistance, this.arena.width),
        patrolY: wrapCoordinate(position.y + Math.sin(patrolAngle) * patrolDistance, this.arena.height),
        heading: random.realInRange(0, Math.PI * 2),
        state: states[index % states.length],
        nextUpdateAt: this.time.now + random.between(0, WORLD_SQUAD_INACTIVE_UPDATE_MS),
        stateUntil: 0,
        activeEnemyIds: []
      });
    }
  }

  private updateWorldSquads(time: number, deltaSeconds: number): void {
    for (const squad of this.worldSquads) {
      this.pruneWorldSquadActiveEnemies(squad);

      if (squad.state === 'defeated') {
        continue;
      }

      if (squad.state === 'pursue') {
        if (squad.activeEnemyIds.length === 0) {
          squad.state = 'defeated';
          squad.stateUntil = 0;
          continue;
        }

        const center = this.getWorldSquadActiveCenter(squad);
        if (center) {
          squad.x = center.x;
          squad.y = center.y;
        }

        if (getWrappedDistance(this.arena, this.player.x, this.player.y, squad.homeX, squad.homeY) > WORLD_SQUAD_DISENGAGE_RANGE) {
          this.disengageWorldSquad(squad, time);
        }

        continue;
      }

      if (squad.state === 'disengage' && time >= squad.stateUntil) {
        squad.state = 'patrol';
        squad.activeEnemyIds = [];
      }

      if (time >= squad.nextUpdateAt) {
        this.updateInactiveWorldSquad(squad, Math.max(deltaSeconds, WORLD_SQUAD_INACTIVE_UPDATE_MS / 1000));
        squad.nextUpdateAt = time + WORLD_SQUAD_INACTIVE_UPDATE_MS;
      }

      if (this.getDistanceFromPlayer(squad.x, squad.y) <= WORLD_SQUAD_ACTIVATION_RANGE) {
        this.activateWorldSquad(squad, time);
      }
    }
  }

  private updateWorldEvents(time: number): void {
    for (const event of this.worldEvents) {
      if (event.status === 'destroyed') {
        event.body.setAlpha(0.42);
        event.wrapMirrorBody.setAlpha(0.28);
        continue;
      }

      const pulse = 0.5 + Math.sin(time * 0.0026 + event.x * 0.01) * 0.5;
      event.body.setRotation(Math.sin(time * 0.00025 + event.y * 0.002) * 0.04);
      event.wrapMirrorBody.setRotation(event.body.rotation);
      event.body.setScale(1 + pulse * 0.012);
      event.wrapMirrorBody.setScale(event.body.scaleX, event.body.scaleY);
      this.updateToroidalRenderMirror(event.body, event.wrapMirrorBody, event.definition.hitRadius + event.definition.dangerRadius);

      if (!event.guardSquadsSpawned && this.getDistanceFromPlayer(event.x, event.y) <= event.definition.dangerRadius) {
        this.spawnWorldEventGuards(event, time);
      }
    }
  }

  private updateRareEvents(time: number, deltaSeconds: number): void {
    for (const event of this.rareEvents) {
      const completed = event.status === 'completed';
      const pulse = 0.5 + Math.sin(time * 0.0034 + event.x * 0.006) * 0.5;
      event.body.setAlpha(completed ? 0.48 : 0.9);
      event.wrapMirrorBody.setAlpha(completed ? 0.28 : 0.76);
      event.body.setRotation(event.definition.kind === 'black-hole' ? time * 0.00022 : Math.sin(time * 0.0018) * 0.08);
      event.wrapMirrorBody.setRotation(event.body.rotation);
      event.body.setScale(completed ? 0.96 : 1 + pulse * 0.018);
      event.wrapMirrorBody.setScale(event.body.scaleX, event.body.scaleY);
      this.updateToroidalRenderMirror(event.body, event.wrapMirrorBody, event.definition.signalRadius);

      if (completed || this.isPlayerDead) {
        continue;
      }

      const playerDistance = this.getDistanceFromPlayer(event.x, event.y);
      if (playerDistance <= event.definition.dangerRadius && !event.squadSpawned) {
        this.spawnRareEventSquads(event, time);
      }

      if (event.definition.completionType === 'investigate') {
        if (updateRareEventInvestigationProgress(event, playerDistance, deltaSeconds)) {
          this.completeRareEvent(event);
        }
        continue;
      }

      if (event.definition.completionType === 'defeat-squad' && event.squadSpawned) {
        this.pruneRareEventActiveEnemies(event);
        if (event.activeEnemyIds.length === 0) {
          this.completeRareEvent(event);
        }
      }
    }
  }

  private spawnRareEventSquads(event: RareEventInstance, time: number): void {
    event.squadSpawned = true;

    for (let index = 0; index < event.definition.squadIds.length; index += 1) {
      const angle = (Math.PI * 2 * index) / Math.max(1, event.definition.squadIds.length) + Math.PI / 7;
      const distance = event.definition.objectiveRadius + 220 + index * 100;
      const x = wrapCoordinate(event.x + Math.cos(angle) * distance, this.arena.width);
      const y = wrapCoordinate(event.y + Math.sin(angle) * distance, this.arena.height);
      const spawned = this.spawnLiveEnemySquad(event.definition.squadIds[index], x, y, time, event.id);
      event.activeEnemyIds.push(...spawned.map((enemy) => enemy.id));
    }
  }

  private pruneRareEventActiveEnemies(event: RareEventInstance): void {
    if (event.activeEnemyIds.length <= 0) {
      return;
    }

    const liveIds = new Set(this.liveEnemies.map((enemy) => enemy.id));
    event.activeEnemyIds = event.activeEnemyIds.filter((id) => liveIds.has(id));
  }

  private completeRareEvent(event: RareEventInstance): void {
    if (event.status === 'completed') {
      return;
    }

    event.status = 'completed';
    event.investigationProgressMs = event.definition.investigationMs;
    this.emitRareEventCompleteFeedback(event);
    this.dropRareEventRewards(event);
    this.resolveRareEventUnlockHooks(event);
    this.updateMission(this.time.now);
    this.updateGameplayHud(this.time.now);
  }

  private emitRareEventCompleteFeedback(event: RareEventInstance): void {
    const color = event.definition.kind === 'black-hole' ? 0xb88cff : 0xffc857;
    this.emitLiveEnemyBurst(event.x, event.y, color, 24);
    const position = this.getNearestWrappedRenderPosition(event.x, event.y - event.definition.objectiveRadius * 0.35);
    const text = this.add
      .text(position.x, position.y, `${event.definition.shortName} secured`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: event.definition.kind === 'black-hole' ? '#b88cff' : '#ffc857',
        stroke: '#02040a',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(24);

    this.tweens.add({
      targets: text,
      y: position.y - 54,
      alpha: 0,
      duration: 950,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private dropRareEventRewards(event: RareEventInstance): void {
    if (event.rewardDropped) {
      return;
    }

    event.rewardDropped = true;
    const baseVelocity = new Phaser.Math.Vector2(0, 0);
    this.spawnScrapPickup('enemy', event.definition.rewardScrap, event.x, event.y, baseVelocity);

    for (let i = 0; i < event.definition.rewardUpgradeCrates; i += 1) {
      const angle = (Math.PI * 2 * i) / Math.max(1, event.definition.rewardUpgradeCrates);
      const x = wrapCoordinate(event.x + Math.cos(angle) * 76, this.arena.width);
      const y = wrapCoordinate(event.y + Math.sin(angle) * 76, this.arena.height);
      this.spawnRewardPickup('banked-upgrade', 'enemy', 0, x, y, baseVelocity);
    }
  }

  private resolveRareEventUnlockHooks(event: RareEventInstance): void {
    if (event.unlockHooksResolved) {
      return;
    }

    event.unlockHooksResolved = true;
    const resolution = resolveRareEventReward(this.progressionState, event.definition);
    this.recordUnlockedRewards(resolution.newlyUnlockedHooks);
  }

  private updateSectorScanner(deltaSeconds: number): void {
    const available = isSectorScannerAvailable(this.progressionState);
    const level = this.progressionState.sectorScannerLevel;
    const targets = this.getSectorScannerTargets();

    updateSectorScannerRuntime(
      this.sectorScannerRuntime,
      level,
      deltaSeconds,
      targets,
      this.player.x,
      this.player.y,
      this.arena
    );

    const snapshot = getSectorScannerSnapshot(this.sectorScannerRuntime, level, available);
    const target = getSectorScannerTarget(this.sectorScannerRuntime, targets);
    this.updateSectorScannerArrow(snapshot.showArrow ? target : undefined);
  }

  private getSectorScannerTargets(): SectorScannerTarget[] {
    const rareMarkers = createRareEventMinimapMarkers(this.rareEvents);
    const targets: SectorScannerTarget[] = [];

    for (const event of this.worldEvents) {
      if (event.status !== 'active') {
        continue;
      }

      targets.push({
        id: event.id,
        label: event.definition.shortName,
        x: event.x,
        y: event.y,
        kind: 'world-event',
        status: event.status
      });
    }

    for (let i = 0; i < this.rareEvents.length; i += 1) {
      const event = this.rareEvents[i];
      if (event.status !== 'active') {
        continue;
      }

      targets.push({
        id: event.id,
        label: event.definition.shortName,
        x: event.x,
        y: event.y,
        kind: 'rare-event',
        status: event.status,
        minimapMarker: rareMarkers[i]
      });
    }

    return targets;
  }

  private updateSectorScannerArrow(target: SectorScannerTarget | undefined): void {
    if (!target || this.gameFlowState !== 'running' || this.isPlayerDead) {
      this.sectorScannerArrow?.setVisible(false);
      return;
    }

    if (!this.sectorScannerArrow) {
      this.sectorScannerArrow = this.add.graphics().setScrollFactor(0).setDepth(1100);
    }

    const direction = this.getWrappedDirection(this.player.x, this.player.y, target.x, target.y).normalize();
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const edgePadding = 28;
    const edgeX = Phaser.Math.Clamp(centerX + direction.x * centerX, edgePadding, this.scale.width - edgePadding);
    const edgeY = Phaser.Math.Clamp(centerY + direction.y * centerY, edgePadding, this.scale.height - edgePadding);
    const rotation = Math.atan2(direction.y, direction.x);

    this.sectorScannerArrow.clear();
    this.sectorScannerArrow.setVisible(true);
    this.sectorScannerArrow.fillStyle(0xb88cff, 0.92);
    this.sectorScannerArrow.lineStyle(2, 0xf2fbff, 0.9);
    const points = [
      new Phaser.Math.Vector2(14, 0).rotate(rotation).add(new Phaser.Math.Vector2(edgeX, edgeY)),
      new Phaser.Math.Vector2(-8, -9).rotate(rotation).add(new Phaser.Math.Vector2(edgeX, edgeY)),
      new Phaser.Math.Vector2(-4, 0).rotate(rotation).add(new Phaser.Math.Vector2(edgeX, edgeY)),
      new Phaser.Math.Vector2(-8, 9).rotate(rotation).add(new Phaser.Math.Vector2(edgeX, edgeY))
    ];
    this.sectorScannerArrow.fillPoints(points, true);
    this.sectorScannerArrow.strokePoints(points, true);
  }

  private spawnWorldEventGuards(event: WorldEventInstance, time: number): void {
    event.guardSquadsSpawned = true;

    for (let index = 0; index < event.definition.guardSquadIds.length; index += 1) {
      const angle = (Math.PI * 2 * index) / Math.max(1, event.definition.guardSquadIds.length) + Math.PI / 5;
      const distance = event.definition.hitRadius + 260 + index * 90;
      const x = wrapCoordinate(event.x + Math.cos(angle) * distance, this.arena.width);
      const y = wrapCoordinate(event.y + Math.sin(angle) * distance, this.arena.height);

      this.spawnLiveEnemySquad(event.definition.guardSquadIds[index], x, y, time);
    }
  }

  private updateInactiveWorldSquad(squad: WorldSquadInstance, deltaSeconds: number): void {
    if (squad.state === 'guard' || squad.state === 'disengage') {
      return;
    }

    if (squad.state === 'roam') {
      squad.heading += Math.sin(this.time.now * 0.0007 + squad.homeX * 0.01) * 0.18;
      squad.x = wrapCoordinate(squad.x + Math.cos(squad.heading) * WORLD_SQUAD_ROAM_SPEED * deltaSeconds, this.arena.width);
      squad.y = wrapCoordinate(squad.y + Math.sin(squad.heading) * WORLD_SQUAD_ROAM_SPEED * deltaSeconds, this.arena.height);
      return;
    }

    const offset = this.getWrappedDirection(squad.x, squad.y, squad.patrolX, squad.patrolY);
    if (offset.length() < 80) {
      const oldPatrolX = squad.patrolX;
      const oldPatrolY = squad.patrolY;
      squad.patrolX = squad.homeX;
      squad.patrolY = squad.homeY;
      squad.homeX = oldPatrolX;
      squad.homeY = oldPatrolY;
      return;
    }

    offset.normalize();
    squad.x = wrapCoordinate(squad.x + offset.x * WORLD_SQUAD_PATROL_SPEED * deltaSeconds, this.arena.width);
    squad.y = wrapCoordinate(squad.y + offset.y * WORLD_SQUAD_PATROL_SPEED * deltaSeconds, this.arena.height);
  }

  private activateWorldSquad(squad: WorldSquadInstance, time: number): void {
    if (squad.state === 'pursue' || squad.state === 'defeated') {
      return;
    }

    const beforeIds = new Set(this.liveEnemies.map((enemy) => enemy.id));
    this.spawnLiveEnemySquad(squad.squadId, squad.x, squad.y, time, squad.id);
    squad.activeEnemyIds = this.liveEnemies.filter((enemy) => !beforeIds.has(enemy.id)).map((enemy) => enemy.id);
    squad.state = 'pursue';
    squad.stateUntil = 0;
  }

  private disengageWorldSquad(squad: WorldSquadInstance, time: number): void {
    for (const enemyId of squad.activeEnemyIds) {
      const index = this.liveEnemies.findIndex((enemy) => enemy.id === enemyId);
      if (index < 0) {
        continue;
      }

      const enemy = this.liveEnemies[index];
      squad.x = wrapCoordinate(enemy.body.x, this.arena.width);
      squad.y = wrapCoordinate(enemy.body.y, this.arena.height);
      destroyLiveEnemySystem(enemy);
      this.liveEnemies.splice(index, 1);
    }

    squad.activeEnemyIds = [];
    squad.state = 'disengage';
    squad.stateUntil = time + 4500;
    squad.nextUpdateAt = time + WORLD_SQUAD_INACTIVE_UPDATE_MS;
  }

  private pruneWorldSquadActiveEnemies(squad: WorldSquadInstance): void {
    if (squad.activeEnemyIds.length === 0) {
      return;
    }

    const liveIds = new Set(this.liveEnemies.map((enemy) => enemy.id));
    squad.activeEnemyIds = squad.activeEnemyIds.filter((id) => liveIds.has(id));
  }

  private getWorldSquadActiveCenter(squad: WorldSquadInstance): Phaser.Math.Vector2 | undefined {
    const members = this.liveEnemies.filter((enemy) => squad.activeEnemyIds.includes(enemy.id));
    if (members.length === 0) {
      return undefined;
    }

    const first = members[0].body;
    let offsetX = 0;
    let offsetY = 0;

    for (const enemy of members) {
      const offset = this.getWrappedDirection(first.x, first.y, enemy.body.x, enemy.body.y);
      offsetX += offset.x;
      offsetY += offset.y;
    }

    return new Phaser.Math.Vector2(
      wrapCoordinate(first.x + offsetX / members.length, this.arena.width),
      wrapCoordinate(first.y + offsetY / members.length, this.arena.height)
    );
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
    time: number
  ): EnemyStatProfile {
    const baseStats =
      enemyType === 'shooter' ? shooterEnemy.stats : enemyType === 'tank' ? tankEnemy.stats : basicEnemy.stats;
    const scaling = this.getEnemyTimeScaling(time);

    return {
      ...baseStats,
      maxHull: Math.max(1, Math.round(baseStats.maxHull * scaling.hpMultiplier)),
      contactDamage: Math.max(1, Math.round(baseStats.contactDamage * scaling.damageMultiplier)),
      attackDamage:
        baseStats.attackDamage > 0
          ? Math.max(1, Math.round(baseStats.attackDamage * scaling.damageMultiplier))
          : 0
    };
  }

  private rollDamage(baseDamage: number, variance: DamageVariance): number {
    return rollDamage(baseDamage, variance, () => Math.random());
  }

  private rollSourceDamage(damage: number, variance: DamageVariance): number {
    if (damage <= 0) {
      return 0;
    }

    const rolled = this.rollDamage(damage, variance);
    const roundedDown = Math.floor(rolled);
    const fraction = rolled - roundedDown;
    return Math.max(1, roundedDown + (Math.random() < fraction ? 1 : 0));
  }

  private rollPlayerDamage(damage: number, variance: DamageVariance = PLAYER_WEAPON_DAMAGE_VARIANCE): number {
    return this.rollSourceDamage(damage, variance);
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

    this.updateEnemyEncounterDirector(time);

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

  private updateEnemyEncounterDirector(time: number): void {
    const result = updateEncounterDirector(this.encounterDirectorState, {
      time,
      elapsedMs: this.getSurvivalElapsedMs(time),
      activeEnemyCount: this.getActiveEnemyCount(),
      maxActiveEnemies: this.getEnemyEncounterMaxActiveEnemies(time),
      random: () => Phaser.Math.FloatBetween(0, 1)
    });

    if (!result.encounter) {
      return;
    }

    const center = this.getEnemyDirectorSpawnPosition();
    this.spawnLiveEnemySquad(result.encounter.squadId, center.x, center.y, time);
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
    const enemy = spawnLiveEnemySystem({
      scene: this,
      arena: this.arena,
      definitionId,
      x,
      y,
      time,
      hpMultiplier: scaling.hpMultiplier,
      showDebugLabel: false
    });

    enemy.damageMultiplier = scaling.damageMultiplier;
    enemy.stateData.legacySpawnType = legacySpawnType;
    this.liveEnemies.push(enemy);
    return enemy;
  }

  private spawnLiveEnemySquad(
    squadId: string,
    centerX: number,
    centerY: number,
    time: number,
    worldSquadId?: string
  ): LiveGameEnemy[] {
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
      enemy.damageMultiplier = scaling.damageMultiplier;
      enemy.stateData.legacySpawnType = this.getLegacySpawnTypeForLiveDefinition(enemy.definitionId);
      enemy.stateData.squadId = squad?.id ?? squadId;
      if (worldSquadId) {
        enemy.stateData.worldSquadId = worldSquadId;
      }
    }

    this.liveEnemies.push(...spawned);
    return spawned;
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

  private getEnemyEncounterMaxActiveEnemies(time: number): number {
    return Math.min(
      ENEMY_SWARM_OVERFLOW_HARD_CAP,
      Math.max(this.getEnemySpawnMaxActiveEnemies(time), 10 + this.getEnemySpawnDifficultyStep(time) * 2)
    );
  }

  private getActiveEnemyCount(): number {
    return this.liveEnemies.length;
  }

  private spawnDebugEnemy(enemyType: DebugEnemyType): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead) {
      return;
    }

    this.spawnDirectedEnemy(enemyType, this.time.now);
  }

  private spawnDebugEncounter(id: EncounterDefinitionId): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead) {
      return;
    }

    const encounter = getEncounterDefinition(id);
    const position = this.getEnemyDirectorSpawnPosition();
    this.spawnLiveEnemySquad(encounter.squadId, position.x, position.y, this.time.now);
  }

  private clearEnemies(): void {
    this.liveEnemies = clearLiveEnemiesSystem(this.liveEnemies);

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

    const spawnCount = Math.max(1, Math.round(this.debugState.debugAsteroidSpawnCount));
    for (let index = 0; index < spawnCount; index += 1) {
      const position = this.getDebugSpawnPosition(ASTEROID_SAFE_SPAWN_RADIUS);
      this.basicAsteroids.push(this.createAsteroidInstance(position.x, position.y, tier));
    }
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

  private createSectorAsteroidSpawns(center: Phaser.Math.Vector2): void {
    const random = new Phaser.Math.RandomDataGenerator([`${this.sectorSeed}-asteroids`]);

    for (const region of this.sectorLayout.regions) {
      const count =
        region.type === 'asteroid-belt'
          ? 5
          : region.type === 'anomaly-signal'
            ? 3
            : region.type === 'salvage-field'
              ? 2
              : region.type === 'enemy-territory'
                ? 2
                : 0;

      for (let index = 0; index < count; index += 1) {
        const position = this.getRandomPointInSectorRegion(region, random);
        if (getWrappedDistance(this.arena, center.x, center.y, position.x, position.y) < ASTEROID_SAFE_SPAWN_RADIUS) {
          continue;
        }

        this.sectorAsteroidSpawns.push(
          this.createSectorAsteroidSpawn(region, position, this.getSectorAsteroidTier(region, random), random)
        );
      }
    }

    while (this.sectorAsteroidSpawns.length < BASIC_ASTEROID_COUNT) {
      const fallbackRegion = this.sectorLayout.regions.find((region) => region.type === 'asteroid-belt') ?? this.sectorLayout.regions[0];
      const position = this.getRandomPointInSectorRegion(fallbackRegion, random);
      if (getWrappedDistance(this.arena, center.x, center.y, position.x, position.y) >= ASTEROID_SAFE_SPAWN_RADIUS) {
        this.sectorAsteroidSpawns.push(
          this.createSectorAsteroidSpawn(fallbackRegion, position, this.getSectorAsteroidTier(fallbackRegion, random), random)
        );
      }
    }
  }

  private createSectorAsteroidSpawn(
    region: SectorRegion,
    position: Phaser.Math.Vector2,
    tier: AsteroidTier,
    random: Phaser.Math.RandomDataGenerator
  ): SectorAsteroidSpawn {
    return {
      id: `${region.id}-asteroid-${this.sectorAsteroidSpawns.length}`,
      regionId: region.id,
      x: position.x,
      y: position.y,
      tier,
      hp: ASTEROID_TIER_CONFIG[tier].hp,
      velocity: this.createSectorAsteroidVelocity(tier, random),
      destroyed: false
    };
  }

  private createSectorAsteroidVelocity(
    tier: AsteroidTier,
    random: Phaser.Math.RandomDataGenerator
  ): Phaser.Math.Vector2 {
    const tierConfig = ASTEROID_TIER_CONFIG[tier];
    const driftAngle = random.realInRange(0, Math.PI * 2);
    const driftSpeed = random.realInRange(tierConfig.minSpeed, tierConfig.maxSpeed);

    return new Phaser.Math.Vector2(Math.cos(driftAngle) * driftSpeed, Math.sin(driftAngle) * driftSpeed);
  }

  private createSectorScrapSpawns(): void {
    const random = new Phaser.Math.RandomDataGenerator([`${this.sectorSeed}-scrap`]);

    for (const region of this.sectorLayout.regions) {
      const count =
        region.type === 'salvage-field'
          ? 5
          : region.type === 'anomaly-signal'
            ? 3
            : region.type === 'enemy-territory'
              ? 2
              : 0;

      for (let index = 0; index < count; index += 1) {
        const position = this.getRandomPointInSectorRegion(region, random);
        this.sectorScrapSpawns.push({
          id: `${region.id}-scrap-${this.sectorScrapSpawns.length}`,
          regionId: region.id,
          x: position.x,
          y: position.y,
          value: region.type === 'salvage-field' ? random.between(12, 22) : random.between(8, 16),
          collected: false
        });
      }
    }
  }

  private createSectorSignalSpawns(): void {
    for (const region of this.sectorLayout.regions.filter((candidate) => candidate.signalStrength >= 0.5)) {
      this.sectorSignalSpawns.push({
        id: `${region.id}-signal`,
        region
      });
    }
  }

  private createSectorSignalBeacon(region: SectorRegion): SectorSignalBeacon {
    const beacon = this.createSectorSignalBeaconBody(region, false);
    const mirror = this.createSectorSignalBeaconBody(region, true);
    mirror.body.setVisible(false);

    return {
      region,
      body: beacon.body,
      wrapMirrorBody: mirror.body,
      ring: beacon.ring,
      wrapMirrorRing: mirror.ring
    };
  }

  private updateSectorStreaming(): void {
    if (!this.player) {
      return;
    }

    const activationRadius = this.getSectorStreamRadius(SECTOR_STREAM_ACTIVATION_PADDING);
    const deactivationRadius = this.getSectorStreamRadius(SECTOR_STREAM_DEACTIVATION_PADDING);

    this.deactivateDistantSectorAsteroids(deactivationRadius);
    this.deactivateDistantSectorScrap(deactivationRadius);
    this.deactivateDistantSectorSignals(deactivationRadius);

    for (const spawn of this.sectorAsteroidSpawns) {
      if (spawn.destroyed || this.activeSectorAsteroids.has(spawn.id)) {
        continue;
      }

      if (this.getDistanceFromPlayer(spawn.x, spawn.y) <= activationRadius) {
        this.activateSectorAsteroid(spawn);
      }
    }

    for (const spawn of this.sectorScrapSpawns) {
      if (spawn.collected || this.activeSectorScrapPickups.has(spawn.id)) {
        continue;
      }

      if (this.getDistanceFromPlayer(spawn.x, spawn.y) <= activationRadius) {
        this.activateSectorScrap(spawn);
      }
    }

    for (const spawn of this.sectorSignalSpawns) {
      if (this.activeSectorSignals.has(spawn.id)) {
        continue;
      }

      if (this.getDistanceFromPlayer(spawn.region.x, spawn.region.y) <= activationRadius) {
        this.activateSectorSignal(spawn);
      }
    }

    this.ensureMinimumActiveSectorAsteroids();
  }

  private getSectorStreamRadius(padding: number): number {
    const camera = this.cameras.main;
    return Math.hypot(camera.width, camera.height) * 0.5 + padding;
  }

  private getDistanceFromPlayer(x: number, y: number): number {
    return getWrappedDistance(this.arena, this.player.x, this.player.y, x, y);
  }

  private activateSectorAsteroid(spawn: SectorAsteroidSpawn): void {
    const asteroid = this.createAsteroidInstance(spawn.x, spawn.y, spawn.tier, spawn.velocity.clone());
    asteroid.hp = spawn.hp;
    if (spawn.breakupProfile) {
      asteroid.breakupProfile = spawn.breakupProfile;
    }

    this.basicAsteroids.push(asteroid);
    this.activeSectorAsteroids.set(spawn.id, asteroid);
    this.sectorAsteroidIds.set(asteroid, spawn.id);
  }

  private ensureMinimumActiveSectorAsteroids(): void {
    if (this.activeSectorAsteroids.size >= BASIC_ASTEROID_COUNT) {
      return;
    }

    const inactiveSpawns = this.sectorAsteroidSpawns
      .filter((spawn) => !spawn.destroyed && !this.activeSectorAsteroids.has(spawn.id))
      .sort((first, second) => this.getDistanceFromPlayer(first.x, first.y) - this.getDistanceFromPlayer(second.x, second.y));

    for (const spawn of inactiveSpawns) {
      this.activateSectorAsteroid(spawn);

      if (this.activeSectorAsteroids.size >= BASIC_ASTEROID_COUNT) {
        return;
      }
    }
  }

  private deactivateDistantSectorAsteroids(deactivationRadius: number): void {
    if (this.activeSectorAsteroids.size <= BASIC_ASTEROID_COUNT) {
      return;
    }

    for (const [id, asteroid] of [...this.activeSectorAsteroids]) {
      if (this.activeSectorAsteroids.size <= BASIC_ASTEROID_COUNT) {
        return;
      }

      if (this.getDistanceFromPlayer(asteroid.body.x, asteroid.body.y) <= deactivationRadius) {
        continue;
      }

      const spawn = this.sectorAsteroidSpawns.find((candidate) => candidate.id === id);
      if (spawn) {
        spawn.x = wrapCoordinate(asteroid.body.x, this.arena.width);
        spawn.y = wrapCoordinate(asteroid.body.y, this.arena.height);
        spawn.hp = asteroid.hp;
        spawn.velocity = asteroid.velocity.clone();
        spawn.breakupProfile = asteroid.breakupProfile;
      }

      const index = this.basicAsteroids.indexOf(asteroid);
      if (index >= 0) {
        this.basicAsteroids.splice(index, 1);
      }

      destroyAsteroidRenderObjects(asteroid);
      this.activeSectorAsteroids.delete(id);
    }
  }

  private activateSectorScrap(spawn: SectorScrapSpawn): void {
    const body = this.createPickupBody(spawn.x, spawn.y, 'scrap');
    const wrapMirrorBody = this.createPickupBody(spawn.x, spawn.y, 'scrap');
    wrapMirrorBody.setVisible(false);

    const pickup: ScrapPickup = {
      body,
      wrapMirrorBody,
      velocity: new Phaser.Math.Vector2(0, 0),
      kind: 'scrap',
      value: spawn.value,
      source: 'debris',
      pickupRadius: SCRAP_PICKUP_COLLECT_RADIUS * this.getResolvedPlayerStats().magnet,
      magnetRadius: SCRAP_PICKUP_COLLECT_RADIUS * this.getResolvedPlayerStats().magnet * PICKUP_MAGNET_RADIUS_MULTIPLIER,
      isMagnetized: false,
      visualScale: this.getScrapPickupVisualScale(spawn.value),
      offscreenSince: null,
      expiresAt: Number.POSITIVE_INFINITY,
      rotationSpeed: 0.65,
      bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2)
    };

    this.updatePickupVisualTier(pickup);
    this.scrapPickups.push(pickup);
    this.activeSectorScrapPickups.set(spawn.id, pickup);
    this.sectorScrapIds.set(pickup, spawn.id);
  }

  private deactivateDistantSectorScrap(deactivationRadius: number): void {
    for (const [id, pickup] of [...this.activeSectorScrapPickups]) {
      if (this.getDistanceFromPlayer(pickup.body.x, pickup.body.y) <= deactivationRadius) {
        continue;
      }

      const spawn = this.sectorScrapSpawns.find((candidate) => candidate.id === id);
      if (spawn) {
        spawn.x = wrapCoordinate(pickup.body.x, this.arena.width);
        spawn.y = wrapCoordinate(pickup.body.y, this.arena.height);
      }

      const index = this.scrapPickups.indexOf(pickup);
      if (index >= 0) {
        this.scrapPickups.splice(index, 1);
      }

      destroyScrapPickupSystem(pickup);
      this.activeSectorScrapPickups.delete(id);
    }
  }

  private activateSectorSignal(spawn: SectorSignalSpawn): void {
    const beacon = this.createSectorSignalBeacon(spawn.region);

    this.sectorSignalBeacons.push(beacon);
    this.activeSectorSignals.set(spawn.id, beacon);
  }

  private deactivateDistantSectorSignals(deactivationRadius: number): void {
    for (const [id, beacon] of [...this.activeSectorSignals]) {
      if (this.getDistanceFromPlayer(beacon.body.x, beacon.body.y) <= deactivationRadius) {
        continue;
      }

      const index = this.sectorSignalBeacons.indexOf(beacon);
      if (index >= 0) {
        this.sectorSignalBeacons.splice(index, 1);
      }

      beacon.body.destroy(true);
      beacon.wrapMirrorBody.destroy(true);
      this.activeSectorSignals.delete(id);
    }
  }

  private markSectorAsteroidDestroyed(asteroid: BasicAsteroid): void {
    const id = this.sectorAsteroidIds.get(asteroid);
    if (!id) {
      return;
    }

    const spawn = this.sectorAsteroidSpawns.find((candidate) => candidate.id === id);
    if (spawn) {
      spawn.destroyed = true;
    }

    this.activeSectorAsteroids.delete(id);
  }

  private markSectorScrapCollected(scrap: ScrapPickup): void {
    const id = this.sectorScrapIds.get(scrap);
    if (!id) {
      return;
    }

    const spawn = this.sectorScrapSpawns.find((candidate) => candidate.id === id);
    if (spawn) {
      spawn.collected = true;
    }

    this.activeSectorScrapPickups.delete(id);
  }

  private createSectorSignalBeaconBody(
    region: SectorRegion,
    isMirror: boolean
  ): { body: Phaser.GameObjects.Container; ring: Phaser.GameObjects.Arc } {
    const color = getSectorRegionColor(region.type);
    const range = Phaser.Math.Clamp(region.radius * 0.18, 42, 86);
    const outer = this.add.circle(0, 0, range, color, isMirror ? 0.035 : 0.055);
    outer.setStrokeStyle(2, color, isMirror ? 0.36 : 0.58);
    const ring = this.add.circle(0, 0, range * 0.55, 0x000000, 0);
    ring.setStrokeStyle(2, region.type === 'enemy-territory' ? 0xff5964 : 0xf2fbff, isMirror ? 0.48 : 0.78);
    const core = this.add.circle(0, 0, 6, color, isMirror ? 0.56 : 0.9);
    const body = this.add.container(region.x, region.y, [outer, ring, core]);
    body.setDepth(6);

    return { body, ring };
  }

  private updateSectorSignalBeacons(time: number): void {
    for (const beacon of this.sectorSignalBeacons) {
      const pulse = 1 + Math.sin(time * 0.0024 + beacon.region.signalStrength * Math.PI) * 0.12;
      beacon.ring.setScale(pulse);
      beacon.wrapMirrorRing.setScale(pulse);
      this.updateToroidalRenderMirror(beacon.body, beacon.wrapMirrorBody, beacon.region.radius * 0.22);
    }
  }

  private getRandomPointInSectorRegion(
    region: SectorRegion,
    random: Phaser.Math.RandomDataGenerator
  ): Phaser.Math.Vector2 {
    const angle = random.realInRange(0, Math.PI * 2);
    const distance = region.radius * Math.sqrt(random.realInRange(0.08, 0.92));

    return new Phaser.Math.Vector2(
      wrapCoordinate(region.x + Math.cos(angle) * distance, this.arena.width),
      wrapCoordinate(region.y + Math.sin(angle) * distance, this.arena.height)
    );
  }

  private getSectorAsteroidTier(region: SectorRegion, random: Phaser.Math.RandomDataGenerator): AsteroidTier {
    if (region.type === 'asteroid-belt') {
      return ([2, 3, 3, 4, 4, 5] as AsteroidTier[])[random.between(0, 5)];
    }

    if (region.type === 'anomaly-signal' || region.type === 'enemy-territory') {
      return ([2, 3, 4, 4] as AsteroidTier[])[random.between(0, 3)];
    }

    return ([1, 2, 2, 3] as AsteroidTier[])[random.between(0, 3)];
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
      this.debugBlackHoleInfluenceRadiusScale,
      this.debugBlackHoleDamageRadiusScale,
      this.debugBlackHoleVisualScale,
      this.debugBlackHoleCoreScale,
      shouldMove,
      this.getBlackHoleGrowthElapsedSeconds(time),
      this.getActiveBlackHoleVacuumTuning()
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

    const result = this.blackHole.applyVacuumToVelocity(
      this.player.x,
      this.player.y,
      this.playerVelocity,
      deltaSeconds,
      this.arena,
      this.debugBlackHoleVacuumTuning.playerPullStrength
    );

    if (result.isInsideEventHorizon) {
      this.blackHolePlayerCaptureStartedAt = null;
      this.killPlayer();
      return;
    }

    if (!this.isBlackHolePlayerCaptureEnabled) {
      this.blackHolePlayerCaptureStartedAt = null;
      return;
    }

    const escapeRadius = this.blackHole.captureRadius + 30;
    if (this.blackHolePlayerCaptureStartedAt !== null && result.distance > escapeRadius) {
      this.blackHolePlayerCaptureStartedAt = null;
      return;
    }

    if (!result.isInsideCapture) {
      return;
    }

    this.blackHolePlayerCaptureStartedAt ??= time;
    const captureAge = time - this.blackHolePlayerCaptureStartedAt;
    const captureProgress = Phaser.Math.Clamp(
      captureAge / this.debugBlackHoleVacuumTuning.playerCaptureDurationMs,
      0,
      1
    );
    const brake = Phaser.Math.Linear(0.96, 0.78, captureProgress);
    this.playerVelocity.scale(brake);

    if (captureAge >= this.debugBlackHoleVacuumTuning.playerCaptureDurationMs) {
      this.blackHolePlayerCaptureStartedAt = null;
      this.killPlayer();
    }
  }

  private applyBlackHoleToAsteroid(asteroid: BasicAsteroid, index: number, deltaSeconds: number, time: number): boolean {
    if (!this.blackHole) {
      return false;
    }

    void time;
    if (!this.isBlackHoleObjectConsumptionEnabled) {
      return false;
    }

    const result = this.blackHole.applyVacuumToVelocity(
      asteroid.body.x,
      asteroid.body.y,
      asteroid.velocity,
      deltaSeconds,
      this.arena,
      this.debugBlackHoleVacuumTuning.objectPullStrength
    );

    if (result.isInsideEventHorizon) {
      this.consumeBasicAsteroid(index);
      this.blackHoleConsumedObjectsThisRun += 1;
      return true;
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

    void time;
    if (!this.isBlackHoleObjectConsumptionEnabled) {
      return false;
    }

    const result = this.blackHole.applyVacuumToVelocity(
      enemy.body.x,
      enemy.body.y,
      enemy.blackHoleVelocity,
      deltaSeconds,
      this.arena,
      this.debugBlackHoleVacuumTuning.objectPullStrength
    );

    dampVelocityChannel(enemy.blackHoleVelocity, BLACK_HOLE_ENEMY_FIELD_DAMPING, deltaSeconds);

    if (result.isInsideEventHorizon) {
      this.destroyLiveEnemyWithoutRewards(enemy);
      this.liveEnemies.splice(index, 1);
      this.blackHoleConsumedObjectsThisRun += 1;
      return true;
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

    void time;
    void tuning;
    if (!this.isBlackHoleObjectConsumptionEnabled) {
      return false;
    }

    const result = this.blackHole.applyVacuumToVelocity(
      enemy.body.x,
      enemy.body.y,
      enemy.blackHoleVelocity,
      deltaSeconds,
      this.arena,
      this.debugBlackHoleVacuumTuning.objectPullStrength
    );

    dampVelocityChannel(enemy.blackHoleVelocity, BLACK_HOLE_ENEMY_FIELD_DAMPING, deltaSeconds);

    if (result.isInsideEventHorizon) {
      this.destroyEnemyWithoutRewards(enemy);
      enemies.splice(index, 1);
      this.blackHoleConsumedObjectsThisRun += 1;
      return true;
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

    return this.rollSourceDamage(damagePerSecond * (intervalMs / 1000), BLACK_HOLE_DAMAGE_VARIANCE);
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
    this.trySpawnEnemyRewardPickup(enemy.stats.scrapValue, x, y, inheritedVelocity, enemy.stats.scrapDropChance);
    enemy.body.destroy(true);
    enemy.wrapMirrorBody.destroy(true);
    enemies.splice(index, 1);
  }

  private destroyLiveEnemyWithRewards(enemy: LiveGameEnemy, index: number, inheritedVelocity = this.getLiveEnemyTotalVelocity(enemy)): void {
    const x = enemy.body.x;
    const y = enemy.body.y;

    this.emitLiveEnemyDeathShards(enemy, inheritedVelocity);
    this.trySpawnEnemyRewardPickup(
      enemy.definition.rewards?.scrap ?? this.getLiveEnemyFallbackScrapValue(enemy),
      x,
      y,
      inheritedVelocity,
      1
    );
    destroyLiveEnemySystem(enemy);
    this.liveEnemies.splice(index, 1);

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

  private getLiveEnemyLegacyCount(enemyType: EnemySpawnType): number {
    return this.liveEnemies.filter((enemy) => this.getLiveEnemyLegacySpawnType(enemy) === enemyType).length;
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

    if (!this.isBlackHoleObjectConsumptionEnabled) {
      return false;
    }

    const result = this.blackHole.applyVacuumToVelocity(
      debris.body.x,
      debris.body.y,
      debris.velocity,
      deltaSeconds,
      this.arena,
      this.debugBlackHoleVacuumTuning.objectPullStrength
    );

    if (result.isInsideEventHorizon) {
      this.destroyEnemyWreckageDebris(debris);
      this.blackHoleConsumedObjectsThisRun += 1;
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
    } else if (roll < specialDropChance + normalDropChance) {
      this.spawnRewardPickup('banked-upgrade', 'enemy', 0, x, y, inheritedVelocity);
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
    const previousPickups = this.scrapPickups;
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

    for (const pickup of this.scrapPickups) {
      if (!previousPickups.includes(pickup)) {
        pickup.visualScale = this.getScrapPickupVisualScale(pickup.value);
        this.updatePickupVisualTier(pickup);
      }
    }
  }

  private createPickupBody(x: number, y: number, kind: PlayerPickupKind): Phaser.GameObjects.Container {
    const isSpecialUpgrade = kind === 'special-upgrade';
    const isUpgradePickup = kind === 'banked-upgrade' || isSpecialUpgrade;
    const children: Phaser.GameObjects.GameObject[] = [];
    if (isUpgradePickup) {
      const glow = this.add.ellipse(
        0,
        0,
        SCRAP_PICKUP_DISPLAY_SIZE * (isSpecialUpgrade ? 2.2 : 1.65),
        SCRAP_PICKUP_DISPLAY_SIZE * (isSpecialUpgrade ? 2.2 : 1.65),
        isSpecialUpgrade ? 0xffc857 : 0x73f2ff,
        isSpecialUpgrade ? 0.42 : 0.24
      );
      children.push(glow);
    }

    const visual = this.add.image(0, 0, isUpgradePickup ? UPGRADE_CRATE_PICKUP_TEXTURE_KEY : SCRAP_PICKUP_TIER_1_TEXTURE_KEY);

    visual.setOrigin(0.5, 0.5);
    visual.setDisplaySize(SCRAP_PICKUP_DISPLAY_SIZE, SCRAP_PICKUP_DISPLAY_SIZE);
    visual.setTint(isSpecialUpgrade ? 0xfff0a8 : 0xffffff);
    children.push(visual);

    const body = this.add.container(x, y, children);
    body.setSize(SCRAP_PICKUP_DISPLAY_SIZE, SCRAP_PICKUP_DISPLAY_SIZE);
    body.setDepth(7);
    body.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

    return body;
  }

  private getScrapPickupTextureKey(value: number): string {
    if (value >= 76) {
      return SCRAP_PICKUP_TIER_4_TEXTURE_KEY;
    }

    if (value >= 26) {
      return SCRAP_PICKUP_TIER_3_TEXTURE_KEY;
    }

    if (value >= 5) {
      return SCRAP_PICKUP_TIER_2_TEXTURE_KEY;
    }

    return SCRAP_PICKUP_TIER_1_TEXTURE_KEY;
  }

  private getScrapPickupVisualScale(value: number): number {
    if (value >= 76) {
      return 1.22;
    }

    if (value >= 26) {
      return 1.14;
    }

    if (value >= 5) {
      return 1.06;
    }

    return 1;
  }

  private updatePickupVisualTier(pickup: ScrapPickup): void {
    if (pickup.kind !== 'scrap') {
      return;
    }

    const textureKey = this.getScrapPickupTextureKey(pickup.value);
    pickup.visualScale = this.getScrapPickupVisualScale(pickup.value);
    this.setPickupBodyTexture(pickup.body, textureKey);
    this.setPickupBodyTexture(pickup.wrapMirrorBody, textureKey);
  }

  private setPickupBodyTexture(body: Phaser.GameObjects.Container, textureKey: string): void {
    const visual = body.list.find((child): child is Phaser.GameObjects.Image => child instanceof Phaser.GameObjects.Image);
    if (!visual) {
      return;
    }

    visual.setTexture(textureKey);
    visual.setDisplaySize(SCRAP_PICKUP_DISPLAY_SIZE, SCRAP_PICKUP_DISPLAY_SIZE);
    visual.setTint(0xffffff);
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
    this.updateScrapOffscreenAges(time);
    this.rollupOffscreenScrap(time);
  }

  private updateScrapOffscreenAges(time: number): void {
    for (const pickup of this.scrapPickups) {
      if (pickup.kind !== 'scrap' || this.sectorScrapIds.has(pickup)) {
        pickup.offscreenSince = null;
        continue;
      }

      if (pickup.isMagnetized || this.isScrapPickupInCameraView(pickup)) {
        pickup.offscreenSince = null;
        continue;
      }

      pickup.offscreenSince ??= time;
    }
  }

  private rollupOffscreenScrap(time: number): void {
    if (time < this.nextScrapRollupAt || this.scrapPickups.length <= SCRAP_ROLLUP_SOFT_LIMIT) {
      return;
    }

    this.nextScrapRollupAt = time + SCRAP_ROLLUP_INTERVAL_MS;

    const emergency = this.scrapPickups.length >= SCRAP_ROLLUP_HARD_LIMIT;
    const minimumOffscreenMs = emergency ? SCRAP_ROLLUP_EMERGENCY_OFFSCREEN_MS : SCRAP_ROLLUP_NORMAL_OFFSCREEN_MS;
    const targetLimit = emergency ? SCRAP_ROLLUP_TARGET_LIMIT : SCRAP_ROLLUP_SOFT_LIMIT;
    const candidates = this.scrapPickups
      .filter((pickup) => this.canRollupScrapPickup(pickup, time, minimumOffscreenMs))
      .sort((first, second) => {
        const firstAge = first.offscreenSince === null ? 0 : time - first.offscreenSince;
        const secondAge = second.offscreenSince === null ? 0 : time - second.offscreenSince;
        return secondAge - firstAge || first.value - second.value;
      });

    for (const source of candidates) {
      if (this.scrapPickups.length <= targetLimit || !this.scrapPickups.includes(source)) {
        continue;
      }

      const target = this.findScrapRollupTarget(source, emergency);
      if (!target) {
        continue;
      }

      this.mergeScrapPickupInto(source, target);
    }
  }

  private canRollupScrapPickup(pickup: ScrapPickup, time: number, minimumOffscreenMs: number): boolean {
    return (
      pickup.kind === 'scrap' &&
      !pickup.isMagnetized &&
      !this.sectorScrapIds.has(pickup) &&
      pickup.offscreenSince !== null &&
      time - pickup.offscreenSince >= minimumOffscreenMs
    );
  }

  private findScrapRollupTarget(source: ScrapPickup, emergency: boolean): ScrapPickup | undefined {
    const offscreenTargets = this.scrapPickups.filter(
      (candidate) =>
        candidate !== source &&
        candidate.kind === 'scrap' &&
        !candidate.isMagnetized &&
        !this.sectorScrapIds.has(candidate) &&
        candidate.offscreenSince !== null
    );

    const nearbyTarget = this.findNearestScrapRollupTarget(source, offscreenTargets, SCRAP_ROLLUP_NEAR_RADIUS);
    if (nearbyTarget || !emergency) {
      return nearbyTarget;
    }

    return (
      this.findNearestScrapRollupTarget(source, offscreenTargets, SCRAP_ROLLUP_FALLBACK_RADIUS) ??
      this.findNearestScrapRollupTarget(source, offscreenTargets, Number.POSITIVE_INFINITY)
    );
  }

  private findNearestScrapRollupTarget(source: ScrapPickup, targets: ScrapPickup[], radius: number): ScrapPickup | undefined {
    let bestTarget: ScrapPickup | undefined;
    let bestDistanceSq = radius * radius;

    for (const target of targets) {
      const distanceSq = this.getWrappedDirection(source.body.x, source.body.y, target.body.x, target.body.y).lengthSq();
      if (distanceSq >= bestDistanceSq) {
        continue;
      }

      bestDistanceSq = distanceSq;
      bestTarget = target;
    }

    return bestTarget;
  }

  private mergeScrapPickupInto(source: ScrapPickup, target: ScrapPickup): void {
    const sourceIndex = this.scrapPickups.indexOf(source);
    if (sourceIndex < 0) {
      return;
    }

    target.value += source.value;
    target.velocity.x = Phaser.Math.Linear(target.velocity.x, source.velocity.x, 0.18);
    target.velocity.y = Phaser.Math.Linear(target.velocity.y, source.velocity.y, 0.18);
    target.expiresAt = Math.max(target.expiresAt, source.expiresAt);
    target.offscreenSince = source.offscreenSince ?? target.offscreenSince;
    this.updatePickupVisualTier(target);

    this.scrapPickups.splice(sourceIndex, 1);
    destroyScrapPickupSystem(source);
  }

  private isScrapPickupInCameraView(pickup: ScrapPickup): boolean {
    const position = this.getNearestWrappedRenderPosition(pickup.body.x, pickup.body.y);
    return this.isCircleInCameraView(position.x, position.y, SCRAP_PICKUP_RADIUS * pickup.visualScale);
  }

  private applyBlackHoleToScrap(scrap: ScrapPickup, deltaSeconds: number): boolean {
    if (!this.blackHole) {
      return false;
    }

    if (!this.isBlackHoleObjectConsumptionEnabled) {
      return false;
    }

    const result = this.blackHole.applyVacuumToVelocity(
      scrap.body.x,
      scrap.body.y,
      scrap.velocity,
      deltaSeconds,
      this.arena,
      this.debugBlackHoleVacuumTuning.objectPullStrength
    );

    if (result.isInsideEventHorizon) {
      this.destroyScrapPickup(scrap);
      this.blackHoleConsumedObjectsThisRun += 1;
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

    const scrapValue = this.getCollectedScrapValue(scrap.value);
    this.addRunScrap(scrapValue);
    this.grantXp(this.getScrapXpValue(scrapValue));
    this.emitScrapPickupFeedback(scrap.body.x, scrap.body.y, scrapValue);
    this.destroyScrapPickup(scrap);
  }

  private getCollectedScrapValue(baseValue: number): number {
    const multiplier = this.getSelectedShipDefinition().scrapValueMultiplier ?? 1;
    return Math.max(1, Math.round(baseValue * multiplier));
  }

  private getScrapXpValue(scrapValue: number): number {
    return Math.max(1, Math.ceil(scrapValue * SCRAP_XP_VALUE_MULTIPLIER));
  }

  private addRunScrap(amount: number): void {
    if (amount <= 0) {
      return;
    }

    this.runScrapTotal += amount;
    this.updateGameplayHud(this.time.now);
  }

  private spendRunScrap(amount: number): boolean {
    if (amount <= 0 || this.runScrapTotal < amount) {
      return false;
    }

    this.runScrapTotal -= amount;
    this.runScrapSpent += amount;
    this.updateGameplayHud(this.time.now);
    return true;
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

    this.markSectorScrapCollected(scrap);
    destroyScrapPickupSystem(scrap);
  }

  private clearScrapPickups(): void {
    for (const scrap of this.scrapPickups) {
      this.markSectorScrapCollected(scrap);
    }

    this.scrapPickups = clearScrapPickupsSystem(this.scrapPickups);
    this.activeSectorScrapPickups.clear();
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
      offscreenSince: null,
      collisionInvulnerableUntil: 0,
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

    const controls = resolvePlayerFlightControls({
      strafeLeft: this.isControlDown('moveLeft'),
      strafeRight: this.isControlDown('moveRight'),
      thrustForward: this.isControlDown('moveUp'),
      thrustReverse: this.isControlDown('moveDown'),
      isWorldRelative: this.gameSettings.movementMode === 'worldRelative'
    });
    const flightStats = this.getPlayerFlightStats();

    applyPlayerFlightAcceleration({
      player: this.player,
      velocity: this.playerVelocity,
      controls,
      stats: flightStats,
      deltaSeconds,
      accelerationScale: this.debugState.playerInertiaScale * this.getFuelThrustMultiplier()
    });

    this.updateThrusterEffects(
      time,
      controls.thrustForward,
      controls.thrustReverse,
      controls.strafeLeft,
      controls.strafeRight,
      controls.isWorldRelative
    );

    this.applyBlackHoleToPlayer(time, deltaSeconds);
    if (this.isPlayerDead) {
      return;
    }

    this.updateFuel(deltaSeconds, controls);
    dampPlayerFlightVelocity({
      velocity: this.playerVelocity,
      stats: flightStats,
      deltaSeconds,
      isThrusting: controls.isThrusting
    });

    integratePlayerFlightPosition({
      player: this.player,
      velocity: this.playerVelocity,
      deltaSeconds
    });
    this.updateRammingShieldDashBurstMovement(deltaSeconds);
  }

  private updateFuel(deltaSeconds: number, controls: PlayerFlightControls): void {
    if (this.isPlayerDead || deltaSeconds <= 0 || !this.debugFuelDrainEnabled) {
      return;
    }

    const mainDrain = controls.thrustForward ? RUN_FUEL_MAIN_THRUST_DRAIN_PER_SECOND : 0;
    const supportDrain =
      controls.thrustReverse || controls.strafeLeft || controls.strafeRight
        ? RUN_FUEL_SUPPORT_THRUST_DRAIN_PER_SECOND
        : 0;
    const drain = Math.max(mainDrain, supportDrain);
    this.fuel = Math.max(0, this.fuel - drain * deltaSeconds);
  }

  private refillFuel(): void {
    this.fuel = RUN_FUEL_MAX;
    this.updateGameplayHud(this.time.now);
  }

  private emptyFuel(): void {
    this.fuel = 0;
    this.updateGameplayHud(this.time.now);
  }

  private getFuelThrustMultiplier(): number {
    return this.fuel > 0 ? 1 : RUN_FUEL_EMERGENCY_THRUST_MULTIPLIER;
  }

  private applyPlayerCoastDamping(deltaSeconds: number): void {
    applyPlayerFlightCoastDamping(this.playerVelocity, this.getSelectedShipDefinition().movement.lowFrictionDamping, deltaSeconds);
  }

  private applyPlayerOverspeedDamping(deltaSeconds: number): void {
    applyPlayerFlightOverspeedDamping(
      this.playerVelocity,
      this.getPlayerVelocityLimit(),
      this.getPlayerOverspeedDamping(),
      deltaSeconds
    );
  }

  private updateMission(time: number): void {
    this.updateMissionObjectiveBeaconVisual(time);

    if (!this.missionRuntime || this.missionRuntime.status !== 'active') {
      return;
    }

    if (this.missionRuntime.definition.objectiveType === 'destroy-world-event') {
      const target = this.getMissionTargetWorldEvent();
      if (target?.status === 'destroyed') {
        this.completeMission(time);
      }
      return;
    }

    if (this.missionRuntime.definition.objectiveType === 'complete-rare-event') {
      const target = this.getMissionTargetRareEvent();
      if (target?.status === 'completed') {
        this.completeMission(time);
      }
      return;
    }

    if (this.getMissionObjectiveDistance() <= this.missionRuntime.objective.radius) {
      this.completeMission(time);
    }
  }

  private updateMissionObjectiveBeaconVisual(time: number): void {
    if (!this.missionObjectiveBeacon || !this.missionObjectiveBeaconRing || !this.missionObjectiveBeaconCore || !this.missionRuntime) {
      return;
    }

    const pulse = 0.5 + Math.sin(time * 0.0052) * 0.5;
    const isComplete = this.missionRuntime.status === 'completed';
    const isFailed = this.missionRuntime.status === 'failed';
    this.missionObjectiveBeacon.setAlpha(isFailed ? 0.38 : 1);
    this.missionObjectiveBeaconRing.setScale(1 + pulse * (isComplete ? 0.05 : 0.16));
    this.missionObjectiveBeaconRing.setAlpha(isComplete ? 0.42 : 0.62 + pulse * 0.28);
    this.missionObjectiveBeaconCore.setFillStyle(isComplete ? 0x52ff9a : isFailed ? 0x52627f : 0xffc857, isFailed ? 0.56 : 0.9);
  }

  private getMissionObjectiveDistance(): number {
    if (!this.player || !this.missionRuntime) {
      return 0;
    }

    const target = this.getMissionTargetWorldEvent();
    if (target) {
      return this.getWrappedDirection(this.player.x, this.player.y, target.x, target.y).length();
    }

    return this.getWrappedDirection(
      this.player.x,
      this.player.y,
      this.missionRuntime.objective.x,
      this.missionRuntime.objective.y
    ).length();
  }

  private getMissionTargetWorldEvent(): WorldEventInstance | undefined {
    if (!this.missionRuntime?.targetWorldEventId) {
      return undefined;
    }

    return this.worldEvents.find((event) => event.id === this.missionRuntime?.targetWorldEventId);
  }

  private getMissionTargetRareEvent(): RareEventInstance | undefined {
    if (!this.missionRuntime?.targetRareEventId) {
      return undefined;
    }

    return this.rareEvents.find((event) => event.id === this.missionRuntime?.targetRareEventId);
  }

  private completeMission(time: number): void {
    if (!this.missionRuntime || this.missionRuntime.status !== 'active') {
      return;
    }

    this.missionRuntime.status = 'completed';
    this.missionRuntime.completedAt = time;
    this.missionRuntime.failedAt = null;
    this.missionRuntime.failureReason = null;
    const resolution = resolveMissionReward(this.progressionState, this.missionRuntime.definition);
    this.recordUnlockedRewards(resolution.newlyUnlockedHooks);
    this.updateGameplayHud(time);
  }

  private completeMissionRun(time: number): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead) {
      return;
    }

    this.isPlayerDead = true;
    this.runEndReason = 'mission';
    this.gameFlowState = 'results';
    this.captureRunResults(time);
    this.payRunCredits();
    this.playerVelocity.set(0, 0);
    this.clearRammingShieldDashBurst();
    if (this.isUpgradeOverlayOpen) {
      this.closeUpgradeOverlay(time);
    }
    if (this.isPauseMenuOpen) {
      this.closePauseMenu(time);
    }
    this.closeEjectConfirmation();
    this.updateGameplayHud(time);
    this.showResultsScreen();
    this.autoRunDiagnostics.endRun('mission-complete');
  }

  private failMission(reason: MissionFailureReason, time: number): void {
    if (!this.missionRuntime || this.missionRuntime.status !== 'active') {
      return;
    }

    this.missionRuntime.status = 'failed';
    this.missionRuntime.failedAt = time;
    this.missionRuntime.failureReason = reason;
  }

  private getMissionHudStatus(): string {
    if (!this.missionRuntime) {
      return this.getSelectedMissionDefinition().objectiveType === 'free-range' ? 'OPEN' : 'READY';
    }

    switch (this.missionRuntime.status) {
      case 'completed':
        return 'DONE';
      case 'failed':
        return 'FAILED';
      case 'active':
        return 'ACTIVE';
    }
  }

  private getContractStatusLine(): string {
    if (!this.missionRuntime) {
      return 'Contract None';
    }

    const name = this.missionRuntime.definition.shortName;

    switch (this.missionRuntime.status) {
      case 'completed':
        return `Contract ${name} COMPLETE`;
      case 'failed':
        return `Contract ${name} INCOMPLETE`;
      case 'active': {
        const distance = Math.max(0, Math.round(this.getMissionObjectiveDistance() - this.missionRuntime.objective.radius));
        return `Contract ${name} ACTIVE ${distance}m`;
      }
    }
  }

  private getMissionResultStatus(): string {
    if (!this.missionRuntime) {
      return this.getSelectedMissionDefinition().objectiveType === 'free-range' ? 'none selected' : 'not started';
    }

    if (this.missionRuntime.status === 'completed') {
      return 'completed';
    }

    if (this.missionRuntime.failureReason === 'player-death') {
      return 'failed';
    }

    if (this.missionRuntime.failureReason === 'run-ended') {
      return 'incomplete';
    }

    return this.missionRuntime.status;
  }

  private getRunEndResultStatus(): string {
    switch (this.runEndReason) {
      case 'death':
        return 'Destroyed';
      case 'eject':
        return 'Ejected';
      case 'mission':
        return 'Mission complete';
      case 'none':
        return 'In progress';
    }
  }

  private getSectorScannerHudStatus(): string {
    const snapshot = getSectorScannerSnapshot(
      this.sectorScannerRuntime,
      this.progressionState.sectorScannerLevel,
      isSectorScannerAvailable(this.progressionState)
    );

    if (!snapshot.available) {
      return 'LOCKED';
    }

    if (snapshot.level <= 0) {
      return 'AVAILABLE IN SHOP';
    }

    if (snapshot.completed) {
      return `${snapshot.targetLabel ?? 'SIGNAL'} FOUND`;
    }

    return `${Math.floor(snapshot.scanProgress * 100)}%`;
  }

  private openEjectConfirmation(): void {
    if (
      !this.isGameplayWorldActive() ||
      this.isPlayerDead ||
      this.isUpgradeOverlayOpen ||
      this.isPauseMenuOpen ||
      this.ejectConfirmScreen
    ) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(width - 48, 430);
    const panelHeight = 216;
    const panelX = -panelWidth / 2;
    const panelY = -panelHeight / 2;
    const actionZones: Phaser.GameObjects.Zone[] = [];
    const container = this.add.container(centerX, centerY).setScrollFactor(0).setDepth(1260);
    const blocker = this.add
      .zone(centerX, centerY, width, height)
      .setScrollFactor(0)
      .setDepth(1259)
      .setInteractive({ useHandCursor: false })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
      .on('pointerup', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation());
    const panel = this.add.graphics();

    panel.fillStyle(0x050812, 0.96);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    panel.lineStyle(2, 0xff5964, 0.9);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    panel.lineStyle(1, 0x42f5d7, 0.42);
    panel.strokeRoundedRect(panelX + 7, panelY + 7, panelWidth - 14, panelHeight - 14, 5);

    const title = this.add
      .text(0, panelY + 32, 'Confirm Eject', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '22px',
        color: '#ffb3b8',
        align: 'center',
        fixedWidth: panelWidth - 48
      })
      .setOrigin(0.5, 0);
    const body = this.add
      .text(0, panelY + 76, 'End the run and convert carried scrap to credits?', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '15px',
        color: '#d8e8ff',
        align: 'center',
        wordWrap: { width: panelWidth - 64 }
      })
      .setOrigin(0.5, 0);

    container.add([panel, title, body]);
    actionZones.push(blocker);

    addScreenButton({
      scene: this,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: -88,
      y: panelY + 144,
      width: 150,
      height: 40,
      label: 'Confirm',
      callback: () => this.confirmEject(),
      isActionActive: () => Boolean(this.ejectConfirmScreen) && this.gameFlowState === 'running',
      resetCursor: () => this.resetUiCursor()
    });
    addScreenButton({
      scene: this,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: 88,
      y: panelY + 144,
      width: 150,
      height: 40,
      label: 'Cancel',
      callback: () => this.closeEjectConfirmation(),
      isActionActive: () => Boolean(this.ejectConfirmScreen) && this.gameFlowState === 'running',
      resetCursor: () => this.resetUiCursor()
    });

    this.ejectConfirmScreen = { container, actionZones };
  }

  private closeEjectConfirmation(): void {
    this.ejectConfirmScreen = destroyScreenHandle(this.ejectConfirmScreen, {
      disableZones: true,
      resetCursor: () => this.resetUiCursor()
    });
  }

  private confirmEject(): void {
    if (!this.ejectConfirmScreen) {
      return;
    }

    this.closeEjectConfirmation();
    this.completeEjectRun();
  }

  private completeEjectRun(): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead) {
      return;
    }

    this.isPlayerDead = true;
    this.runEndReason = 'eject';
    this.gameFlowState = 'results';
    this.failMission('run-ended', this.time.now);
    this.captureRunResults(this.time.now);
    this.payRunCredits();
    this.emitPlayerDeathShards();
    this.playerVelocity.set(0, 0);
    this.clearRammingShieldDashBurst();
    this.player.setVisible(false);
    this.playerSprite.setTint(0xffc857);
    this.playerSprite.setAlpha(0.66);
    if (this.isUpgradeOverlayOpen) {
      this.closeUpgradeOverlay(this.time.now);
    }
    if (this.isPauseMenuOpen) {
      this.closePauseMenu(this.time.now);
    }
    this.closeEjectConfirmation();
    this.updateGameplayHud(this.time.now);
    this.showResultsScreen();
    this.autoRunDiagnostics.endRun('ejected');
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

  private updateSecretControlInput(_time: number): void {
    if (!this.secretControlOverlay || !this.progressionState.secretControlUnlocked) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.secretControlKey)) {
      if (!this.isSecretControlOverlayAvailable()) {
        this.closeSecretControlOverlay();
        return;
      }

      this.secretControlOverlay.toggle();
      this.refreshSecretControlOverlay();
    }

    if (this.secretControlOverlay.isOpen() && !this.isSecretControlOverlayAvailable()) {
      this.closeSecretControlOverlay();
    }
  }

  private isDebugMenuAvailable(): boolean {
    return import.meta.env.DEV || this.debugState.collisionDebugEnabled;
  }

  private isGameplayWorldActive(): boolean {
    return this.gameFlowState === 'running' || this.gameFlowState === 'results';
  }

  private isSecretControlOverlayAvailable(): boolean {
    return (
      this.gameFlowState === 'running' &&
      !this.isUpgradeOverlayOpen &&
      !this.isPauseMenuOpen &&
      !(this.debugMenuHost?.isOpen() ?? false) &&
      !this.isPlayerDead &&
      Boolean(this.player)
    );
  }

  private closeSecretControlOverlay(): void {
    this.secretControlOverlay?.close();
  }

  private refreshSecretControlOverlay(): void {
    if (!this.secretControlOverlay?.isOpen()) {
      return;
    }

    this.secretControlOverlay.update(this.getSecretControlOverlayValues());
  }

  private openDebugMenu(time: number): void {
    if (!this.debugMenuHost?.isCreated() || this.debugMenuHost.isOpen() || this.isUpgradeOverlayOpen) {
      return;
    }

    this.closeSecretControlOverlay();
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

    if (this.isControlJustDown('restart')) {
      this.rerollUpgradeOverlayChoices();
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
    delayEncounterDirectorState(this.encounterDirectorState, pauseDurationMs);
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

  private getBlackHoleGrowthElapsedSeconds(time = this.time.now): number {
    return Math.max(0, this.getSurvivalElapsedMs(time) + this.debugBlackHoleGrowthOffsetMs) / 1000;
  }

  private getActiveBlackHoleVacuumTuning(): BlackHoleVacuumTuning {
    return {
      ...this.debugBlackHoleVacuumTuning,
      warningMargin: this.areBlackHoleWarningVisualsEnabled ? this.debugBlackHoleVacuumTuning.warningMargin : 0
    };
  }

  private getBlackHoleCaptureTimerRemainingMs(time = this.time.now): number {
    if (this.blackHolePlayerCaptureStartedAt === null) {
      return 0;
    }

    return Math.max(0, this.debugBlackHoleVacuumTuning.playerCaptureDurationMs - (time - this.blackHolePlayerCaptureStartedAt));
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
      delayEncounterDirectorState(this.encounterDirectorState, pauseDurationMs);
    }

    this.isUpgradeOverlayOpen = false;
    this.upgradeOverlayOpenedAt = 0;
    this.normalUpgradeOverlayChoices = null;
    this.specialUpgradeOverlayChoices = null;
    this.upgradeOverlayBlocker.setVisible(false).disableInteractive();
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
        : selectWeightedRunUpgrades(
            getAvailableRunUpgrades(this.runUpgradeLevels, this.getEquippedWeaponDefinitions()),
            UPGRADE_OVERLAY_CHOICE_COUNT,
            () => Phaser.Math.FloatBetween(0, 1)
          );

    return this.normalUpgradeOverlayChoices;
  }

  private getNextRerollCost(): number {
    return this.debugRerollCostBase * (this.rerollsThisRun + 1);
  }

  private canRerollUpgradeOverlay(): boolean {
    return (
      this.isUpgradeOverlayOpen &&
      this.specialUpgradeOverlayChoices === null &&
      this.getSecondaryWeaponChoices().length <= 0 &&
      this.runScrapTotal >= this.getNextRerollCost()
    );
  }

  private rerollUpgradeOverlayChoices(): void {
    if (!this.canRerollUpgradeOverlay()) {
      return;
    }

    const previousChoices = new Set(this.getUpgradeOverlayChoices().map((choice) => choice.category === 'secondary-weapon' ? choice.weaponId : choice.id));
    const cost = this.getNextRerollCost();
    if (!this.spendRunScrap(cost)) {
      return;
    }

    this.rerollsThisRun += 1;
    const available = getAvailableRunUpgrades(this.runUpgradeLevels, this.getEquippedWeaponDefinitions());
    const fresh = available.filter((choice) => !previousChoices.has(choice.id));
    this.normalUpgradeOverlayChoices = selectWeightedRunUpgrades(
      fresh.length >= UPGRADE_OVERLAY_CHOICE_COUNT ? fresh : available,
      UPGRADE_OVERLAY_CHOICE_COUNT,
      () => Phaser.Math.FloatBetween(0, 1)
    );
    this.refreshUpgradeOverlayText();
  }

  private getSpecialUpgradeDropChoices(): UpgradeDefinition[] {
    const specialPool = UPGRADE_CHOICES.filter((upgrade) => upgrade.rarity === 'rare' || upgrade.rarity === 'epic');
    const available = getAvailableRunUpgrades(this.runUpgradeLevels, this.getEquippedWeaponDefinitions(), specialPool);
    return selectWeightedRunUpgrades(available, UPGRADE_OVERLAY_CHOICE_COUNT, () => Phaser.Math.FloatBetween(0, 1));
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
          name: `Equip Right Click: ${weapon.displayName}`,
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
      !weapon.eligibleAsSecondary ||
      !weapon.slotCompatibility.includes('secondary') ||
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
    return selectedShip.movement.overspeedDamping;
  }

  private getPlayerFlightStats(): PlayerFlightStats {
    const selectedShip = this.getSelectedShipDefinition();

    return {
      thrust: this.getPlayerThrustAcceleration(),
      brake: this.getPlayerReverseThrustAcceleration(),
      strafe: this.getPlayerStrafeThrustAcceleration(),
      moveSpeed: this.getPlayerMaxSpeed(),
      velocityLimit: this.getPlayerVelocityLimit(),
      lowFrictionDamping: selectedShip.movement.lowFrictionDamping,
      overspeedDamping: this.getPlayerOverspeedDamping()
    };
  }

  private getGlobalMaxSpeed(): number {
    return this.debugState.globalMaxSpeed;
  }

  private getPlayerDamageInvulnerabilityMs(): number {
    return PLAYER_DAMAGE_INVULNERABILITY_MS + this.getResolvedPlayerStats().recovery;
  }

  private moveBlackHoleNearPlayer(distance: number): void {
    if (!this.blackHole || !this.player) {
      return;
    }

    const angle = this.player.rotation - Math.PI / 2;
    this.blackHole.body.x = wrapCoordinate(this.player.x + Math.cos(angle) * distance, this.arena.width);
    this.blackHole.body.y = wrapCoordinate(this.player.y + Math.sin(angle) * distance, this.arena.height);
  }

  private adjustBlackHoleVacuumTuning(key: keyof BlackHoleVacuumTuning, delta: number): void {
    const current = this.debugBlackHoleVacuumTuning[key];
    const next = current + delta;
    const minimums: Record<keyof BlackHoleVacuumTuning, number> = {
      baseEventHorizonRadius: 1,
      maxEventHorizonRadius: 1,
      growthPerMinute: 0,
      captureMargin: 0,
      warningMargin: 0,
      playerCaptureDurationMs: 250,
      playerPullStrength: 0,
      objectPullStrength: 0
    };
    const value = Math.max(minimums[key], next);

    this.debugBlackHoleVacuumTuning = {
      ...this.debugBlackHoleVacuumTuning,
      [key]: Number(value.toFixed(key.endsWith('Ms') ? 0 : 1))
    };

    if (this.debugBlackHoleVacuumTuning.maxEventHorizonRadius < this.debugBlackHoleVacuumTuning.baseEventHorizonRadius) {
      this.debugBlackHoleVacuumTuning.maxEventHorizonRadius = this.debugBlackHoleVacuumTuning.baseEventHorizonRadius;
    }
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
        influenceRadiusScale: this.debugBlackHoleInfluenceRadiusScale,
        damageRadiusScale: this.debugBlackHoleDamageRadiusScale,
        visualScale: this.debugBlackHoleVisualScale,
        coreScale: this.debugBlackHoleCoreScale,
        fieldTuning: { ...this.debugBlackHoleFieldTuning }
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
    this.resetBlackHoleTuning();
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

  private createBlackHoleFieldTuningMarkdown(): string {
    return createBlackHoleFieldTuningMarkdownDebug({
      influenceRadiusScale: this.debugBlackHoleInfluenceRadiusScale,
      damageRadiusScale: this.debugBlackHoleDamageRadiusScale,
      coreScale: this.debugBlackHoleCoreScale,
      tuning: this.debugBlackHoleFieldTuning
    });
  }

  private resetBlackHoleTuning(): void {
    this.debugBlackHoleInfluenceRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleDamageRadiusScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleVisualScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleCoreScale = DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT;
    this.debugBlackHoleFieldTuning = { ...DEFAULT_BLACK_HOLE_FIELD_TUNING };
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
      .container(this.scale.width / 2, this.scale.height - 116, [this.upgradeButtonGraphics, this.upgradeButtonText])
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
      .setPosition(this.scale.width / 2, this.scale.height - 116)
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
    const layout = this.getUpgradeOverlayLayout();

    this.upgradeOverlayBlocker = this.add
      .zone(0, 0, layout.width, layout.height)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1199)
      .setVisible(false)
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
      .on('pointerup', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation());
    this.upgradeOverlayGraphics = this.add.graphics().setScrollFactor(0).setDepth(1200);

    for (let i = 0; i < UPGRADE_OVERLAY_CHOICE_COUNT; i += 1) {
      const cardY = this.getUpgradeOverlayCardY(layout, i);
      const choiceText = this.add
        .text(layout.cardX + 16, cardY + 10, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '13px',
          color: '#f2fbff',
          fixedWidth: layout.cardWidth - 258,
          wordWrap: { width: layout.cardWidth - 258 },
          lineSpacing: 2
        })
        .setScrollFactor(0)
        .setDepth(1209);
      const metaText = this.add
        .text(layout.cardX + layout.cardWidth - 16, cardY + 10, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '11px',
          color: '#a8c7ff',
          align: 'right',
          fixedWidth: 210
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(1209);

      this.upgradeOverlayChoiceTexts.push(choiceText);
      this.upgradeOverlayChoiceMetaTexts.push(metaText);

      const hitZone = this.add
        .zone(layout.cardX, cardY, layout.cardWidth, layout.cardHeight)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1210)
        .setVisible(false);

      hitZone
        .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          this.selectUpgradeOverlayChoiceAt(i, this.time.now);
        });
      this.upgradeOverlayChoiceHitZones.push(hitZone);
    }

    this.upgradeOverlayText = this.add
      .text(layout.centerX, layout.panelY + 28, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        align: 'left',
        fixedWidth: layout.panelWidth - 56,
        lineSpacing: 4,
        wordWrap: { width: layout.panelWidth - 56 }
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1201);

    this.upgradeOverlayPromptText = this.add
      .text(layout.cardX, layout.panelY + layout.panelHeight - 34, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        fixedWidth: layout.cardWidth,
        wordWrap: { width: layout.cardWidth }
      })
      .setScrollFactor(0)
      .setDepth(1201);

    this.upgradeOverlayGraphics.setVisible(false);
    this.upgradeOverlayBlocker.disableInteractive();
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
    const weaponSummary = this.getUpgradeOverlayWeaponSummary(activeWeapon, resolvedActiveWeapon, damageMultiplier);
    const choices = this.getUpgradeOverlayChoices();
    const rerollCost = this.getNextRerollCost();
    const choicePrompt =
      choices.length > 0
        ? `Click a card or press 1-${choices.length} to choose.  R rerolls for ${rerollCost} scrap.  Esc closes.`
        : 'Esc closes.';

    this.drawUpgradeOverlayCards(choices);
    choices.forEach((choice, index) => {
      const text = this.upgradeOverlayChoiceTexts[index];
      const metaText = this.upgradeOverlayChoiceMetaTexts[index];
      if (choice.category === 'secondary-weapon') {
        text.setText(`${index + 1}. ${choice.name}\n${choice.description}`);
        metaText.setText('RIGHT CLICK');
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
        `Run scrap: ${this.runScrapTotal}  Reroll cost: ${rerollCost}\n` +
        weaponSummary +
        '\n' +
        `Ship: ${this.playerHull}/${this.getPlayerMaxHull()} hull, x${this.getPlayerAccelerationMultiplier().toFixed(2)} accel, ${(this.getPlayerDamageInvulnerabilityMs() / 1000).toFixed(2)}s i-frames`
    );
    this.upgradeOverlayPromptText.setText(choicePrompt);
  }

  private drawUpgradeOverlayCards(choices: UpgradeOverlayChoice[]): void {
    const layout = this.getUpgradeOverlayLayout();

    this.upgradeOverlayBlocker
      .setPosition(0, 0)
      .setSize(layout.width, layout.height)
      .setVisible(this.isUpgradeOverlayOpen);
    if (this.isUpgradeOverlayOpen) {
      this.upgradeOverlayBlocker.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, layout.width, layout.height),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains
      });
    } else {
      this.upgradeOverlayBlocker.disableInteractive();
    }

    this.upgradeOverlayGraphics.clear();
    this.upgradeOverlayGraphics.fillStyle(0x02040a, 0.76);
    this.upgradeOverlayGraphics.fillRect(0, 0, layout.width, layout.height);
    this.upgradeOverlayGraphics.fillStyle(0x071018, 0.95);
    this.upgradeOverlayGraphics.fillRoundedRect(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 8);
    this.upgradeOverlayGraphics.lineStyle(2, 0x42f5d7, 0.75);
    this.upgradeOverlayGraphics.strokeRoundedRect(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 8);

    this.upgradeOverlayText
      .setPosition(layout.centerX, layout.panelY + 28)
      .setStyle({ fixedWidth: layout.panelWidth - 56 })
      .setWordWrapWidth(layout.panelWidth - 56);
    this.upgradeOverlayPromptText
      .setPosition(layout.cardX, layout.panelY + layout.panelHeight - 34)
      .setStyle({ fixedWidth: layout.cardWidth })
      .setWordWrapWidth(layout.cardWidth);

    for (let i = 0; i < UPGRADE_OVERLAY_CHOICE_COUNT; i += 1) {
      const choice = choices[i];
      const cardY = this.getUpgradeOverlayCardY(layout, i);
      const accentColor = choice && choice.category !== 'secondary-weapon' ? this.getUpgradeRarityColor(choice.rarity) : 0x42f5d7;
      const hitZone = this.upgradeOverlayChoiceHitZones[i];
      const text = this.upgradeOverlayChoiceTexts[i];
      const metaText = this.upgradeOverlayChoiceMetaTexts[i];

      this.upgradeOverlayGraphics.fillStyle(0x111a24, choice ? 0.94 : 0.42);
      this.upgradeOverlayGraphics.fillRoundedRect(layout.cardX, cardY, layout.cardWidth, layout.cardHeight, 6);
      this.upgradeOverlayGraphics.fillStyle(accentColor, choice ? 0.9 : 0.2);
      this.upgradeOverlayGraphics.fillRoundedRect(layout.cardX, cardY, 5, layout.cardHeight, 3);
      this.upgradeOverlayGraphics.lineStyle(1, choice ? accentColor : 0x52627f, choice ? 0.72 : 0.28);
      this.upgradeOverlayGraphics.strokeRoundedRect(layout.cardX, cardY, layout.cardWidth, layout.cardHeight, 6);

      text
        .setPosition(layout.cardX + 16, cardY + 10)
        .setStyle({ fixedWidth: layout.cardWidth - 258 })
        .setWordWrapWidth(layout.cardWidth - 258);
      metaText
        .setPosition(layout.cardX + layout.cardWidth - 16, cardY + 10)
        .setStyle({ fixedWidth: 210 });
      hitZone.setPosition(layout.cardX, cardY).setSize(layout.cardWidth, layout.cardHeight).setVisible(Boolean(choice));
      if (choice && this.isUpgradeOverlayOpen) {
        hitZone.setInteractive({
          hitArea: new Phaser.Geom.Rectangle(0, 0, layout.cardWidth, layout.cardHeight),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true
        });
      } else {
        hitZone.disableInteractive();
      }
    }

    for (const text of [...this.upgradeOverlayChoiceTexts, ...this.upgradeOverlayChoiceMetaTexts, this.upgradeOverlayPromptText]) {
      text.setVisible(this.isUpgradeOverlayOpen);
    }
    this.upgradeOverlayText.setVisible(this.isUpgradeOverlayOpen);
  }

  private getUpgradeOverlayLayout(): UpgradeOverlayLayout {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const panelWidth = Math.min(width - 48, 760);
    const minCardStackHeight = 118 + UPGRADE_OVERLAY_CHOICE_COUNT * UPGRADE_OVERLAY_CARD_HEIGHT + (UPGRADE_OVERLAY_CHOICE_COUNT - 1) * UPGRADE_OVERLAY_CARD_GAP + 58;
    const panelHeight = Math.min(height - 48, Math.max(560, minCardStackHeight));
    const panelX = centerX - panelWidth / 2;
    const panelY = Math.max(24, height / 2 - panelHeight / 2);

    return {
      width,
      height,
      centerX,
      panelWidth,
      panelHeight,
      panelX,
      panelY,
      cardX: panelX + 28,
      cardWidth: panelWidth - 56,
      cardHeight: UPGRADE_OVERLAY_CARD_HEIGHT,
      cardGap: UPGRADE_OVERLAY_CARD_GAP
    };
  }

  private getUpgradeOverlayCardY(layout: UpgradeOverlayLayout, index: number): number {
    return layout.panelY + 118 + index * (layout.cardHeight + layout.cardGap);
  }

  private getUpgradeOverlayWeaponSummary(
    activeWeapon: WeaponRegistryEntry,
    resolvedActiveWeapon: ResolvedWeaponStats,
    damageMultiplier: number
  ): string {
    if (resolvedActiveWeapon.beam) {
      const beam = resolvedActiveWeapon.beam;
      return `${activeWeapon.displayName}: ${Math.round(beam.tickDamage * beam.tickRatePerSecond)} DPS, ${beam.tickRatePerSecond.toFixed(1)}/s, heat ${Math.round(beam.heatGainPerSecond)}/s, cool ${Math.round(beam.coolingPerSecond)}/s, range ${Math.round(beam.range)}`;
    }

    if (resolvedActiveWeapon.rammingShield) {
      const shield = resolvedActiveWeapon.rammingShield;
      return `${activeWeapon.displayName}: ${Math.round(shield.bashDamage)} bash, ${Math.round(shield.guardDamage)} guard, ${shield.dashMaxCharges} charges, ${shield.dashChargeRechargeSeconds.toFixed(1)}s recharge`;
    }

    const projectile = resolvedActiveWeapon.projectile;
    const activeDamage = Math.round(projectile?.damage ?? 0);
    const cooldownSeconds = (projectile?.cooldownMs ?? 0) / 1000;
    const speed = Math.round(projectile?.projectileSpeed ?? 0);
    return `${activeWeapon.displayName}: ${activeDamage} damage, x${damageMultiplier.toFixed(2)}, ${cooldownSeconds.toFixed(2)}s cooldown, ${speed} speed`;
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
    updatePlayerFacingFromPointer({
      scene: this,
      player: this.player,
      getWrappedDirection: (fromX, fromY, toX, toY) => this.getWrappedDirection(fromX, fromY, toX, toY)
    });
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
      duration: Math.max(120, this.getRammingShieldStats().dashDurationSeconds * 1000),
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
    wrapPlayerFlightPosition({
      player: this.player,
      arena: this.arena,
      camera: this.cameras.main
    });
  }

  private updateCameraLead(): void {
    updatePlayerFlightCameraLead({
      camera: this.cameras.main,
      cameraLead: this.cameraLead,
      velocity: this.playerVelocity,
      maxSpeed: this.getPlayerMaxSpeed(),
      minSpeed: CAMERA_LEAD_MIN_SPEED,
      maxDistance: CAMERA_LEAD_MAX_DISTANCE,
      lerp: CAMERA_LEAD_LERP
    });
  }

  private startRammingShieldDashBurst(direction: Phaser.Math.Vector2, stats: RammingShieldStats): void {
    this.rammingShieldDashBurstDirection.copy(direction);
    this.rammingShieldDashBurstRemaining = stats.dashDistance;
    this.rammingShieldDashBurstSpeed = stats.dashDistance / Math.max(0.01, stats.dashDurationSeconds);
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
      this.clearRammingShieldDashBurst();
    }
  }

  private clearRammingShieldDashBurst(): void {
    this.rammingShieldDashBurstRemaining = 0;
    this.rammingShieldDashBurstSpeed = 0;
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
          hitRammingShield: true
        };
      }

      const collision = getCircleCollision(
        this.arena,
        createCircleCollisionShape(this.player, playerHitRadius),
        createCircleCollisionShape(enemy.body, enemy.definition.stats.radius)
      );
      if (collision) {
        return {
          enemy,
          normal: collision.normal,
          penetration: collision.penetration,
          damage: enemy.definition.stats.contactDamage * enemy.damageMultiplier
        };
      }
    }

    return undefined;
  }

  private getEnemyCapsulePlayerCollision(
    enemy: BasicEnemy | ShooterEnemy | TankEnemy,
    playerRadius: number
  ): { normal: Phaser.Math.Vector2; penetration: number } | undefined {
    const collision = getCapsuleCircleCollision(
      this.arena,
      createOrientedCapsuleCollisionShape({
        body: enemy.body,
        forward: this.getForwardDirection(enemy.body.rotation),
        halfWidth: this.getEnemyCollisionHalfWidth(enemy),
        halfLength: this.getEnemyCollisionHalfLength(enemy)
      }),
      createCircleCollisionShape(this.player, playerRadius)
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
        createCircleCollisionShape(this.player, playerHitRadius),
        createCircleCollisionShape(asteroid.body, asteroidRadius)
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
        createCircleCollisionShape(this.player, playerHitRadius),
        createCircleCollisionShape(debris.body, debrisRadius)
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

    if (!this.debugPlayerCollisionDamageImmune && impactDamage > 0 && time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitShipCollisionImpactExplosion(impact.x, impact.y);
      this.damagePlayer(impactDamage, time, impact.x, impact.y, { source: 'enemy' });
    }
  }

  private resolvePlayerAsteroidContact(contact: PlayerAsteroidContact, time: number): void {
    const contactDamage = this.getPlayerAsteroidContactDamage(contact);
    this.applyPlayerAsteroidKnockback(contact, time);
    if (contact.hitRammingShield) {
      this.applyRammingShieldImpact(contact.asteroid.body, time, () => this.damageRammedAsteroid(contact.asteroid, time));
      this.blockDamageWithRammingShield(contactDamage, time, contact.asteroid.body.x, contact.asteroid.body.y);
      return;
    }

    if (!this.debugPlayerCollisionDamageImmune && contactDamage > 0 && time >= this.playerInvulnerableUntil) {
      const impact = this.getPlayerContactImpactPoint(contact.normal);
      this.emitAsteroidImpactExplosion(impact.x, impact.y, contact.asteroid.tier);
      this.damagePlayer(contactDamage, time, impact.x, impact.y, { source: 'asteroid' });
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

    if (!this.debugPlayerCollisionDamageImmune && impactDamage > 0 && time >= this.playerInvulnerableUntil) {
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
    return this.getPlayerContactImpactDamage('enemy', this.getEnemyContactVelocity(contact.enemy), contact.normal);
  }

  private getPlayerAsteroidContactDamage(contact: PlayerAsteroidContact): number {
    return this.rollSourceDamage(contact.damage, ASTEROID_IMPACT_DAMAGE_VARIANCE);
  }

  private getPlayerDebrisImpactDamage(contact: PlayerDebrisContact): number {
    return this.getPlayerContactImpactDamage('debris', contact.debris.velocity, contact.normal);
  }

  private getPlayerContactImpactDamage(
    source: DebugImpactSourceType,
    targetVelocity: Phaser.Math.Vector2,
    normal: Phaser.Math.Vector2
  ): number {
    const relativeVelocity = getRelativeVelocity(this.playerVelocity, targetVelocity);
    const closingSpeed = getClosingSpeed(relativeVelocity, normal);

    return this.calculatePhysicalImpactDamage({
      source,
      baseDamage: 0,
      impactSpeed: closingSpeed
    });
  }

  private calculatePhysicalImpactDamage(input: {
    source: DebugImpactSourceType;
    baseDamage: number;
    impactSpeed: number;
    fallbackMaxDamage?: number;
  }): number {
    const damage = calculateImpactDamage({
      baseDamage: input.baseDamage,
      impactSpeed: input.impactSpeed,
      minImpactSpeed: IMPACT_MIN_DAMAGE_SPEED_BY_SOURCE[input.source],
      speedDamageScale: this.debugState.impactDamageScales[input.source],
      minDamage: 0,
      maxDamage: Math.min(
        this.debugState.globalImpactDamageCap,
        this.debugState.impactDamageCaps[input.source],
        input.fallbackMaxDamage ?? Number.MAX_SAFE_INTEGER
      )
    });

    return this.rollSourceDamage(damage, ASTEROID_IMPACT_DAMAGE_VARIANCE);
  }

  private getPlayerBodyImpactDamage(targetVelocity: Phaser.Math.Vector2, normal: Phaser.Math.Vector2): number {
    const relativeVelocity = getRelativeVelocity(this.playerVelocity, targetVelocity);
    const closingSpeed = getClosingSpeed(relativeVelocity, normal);

    return this.calculatePhysicalImpactDamage({
      source: 'player',
      baseDamage: 0,
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

    const damage = this.getPlayerBodyImpactDamage(this.getEnemyTotalVelocity(enemy), normal);
    this.markPlayerBodyImpactDamageApplied(enemy.body, time);
    if (damage <= 0) {
      return;
    }

    this.damageEnemy(enemy, damage, 'player', true);
    this.emitShipCollisionImpactExplosion(enemy.body.x, enemy.body.y);
    this.resolveEnemyDestroyedByPhysicalImpact(enemy);
  }

  private applyPlayerBodyImpactDamageToDebris(debris: EnemyWreckageDebris, normal: Phaser.Math.Vector2, time: number): void {
    if (!this.canApplyPlayerBodyImpactDamage(debris.body, time)) {
      return;
    }

    const damage = this.getPlayerBodyImpactDamage(debris.velocity, normal);
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
    if (asteroid.hp <= 0) {
      this.destroyBasicAsteroidInstance(asteroid);
    } else if (index >= 0) {
      this.flashAsteroidDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
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

  private getRammingShieldDamage(
    target: AnyGameEnemy | BasicAsteroid | EnemyWreckageDebris,
    time = this.time.now,
    damageMultiplier = 1
  ): number {
    const stats = this.getRammingShieldStats();
    if (this.rammingShieldState.hp <= 0) {
      return 0;
    }

    const isBashing = this.isRammingShieldBashing(time);
    const breachLevel = this.getRunUpgradeLevelById('ram_breach_protocol');
    const breachMultiplier = isBashing && breachLevel > 0 && this.isLargeRammingShieldTarget(target) ? 1 + breachLevel * 0.25 : 1;
    const baseDamage = (isBashing ? stats.bashDamage : stats.guardDamage) * damageMultiplier * breachMultiplier;

    return this.rollSourceDamage(baseDamage * this.getResolvedPlayerStats().damage, stats.damageVariance);
  }

  private isRammingShieldBashing(time = this.time.now): boolean {
    return time < this.rammingShieldState.empoweredUntil && this.rammingShieldDashBurstRemaining > 0;
  }

  private isLargeRammingShieldTarget(target: AnyGameEnemy | BasicAsteroid | EnemyWreckageDebris): boolean {
    if ('tier' in target) {
      return target.tier >= 5;
    }

    if ('definition' in target) {
      return target.definition.stats.radius >= 34;
    }

    return this.tankEnemies.includes(target as TankEnemy);
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

    const shieldHpBefore = this.rammingShieldState.hp;
    damageRammingShield(this.rammingShieldState, this.getRammingShieldStats(), damage, time);
    if (shieldHpBefore > 0 && this.rammingShieldState.hp <= 0) {
      this.applyRammingShieldBreakEffects(time, impactX, impactY);
    }
    this.isPulseEmergencyCharged = this.getRunUpgradeLevelById('pulse_emergency_discharge') > 0;
    this.rammingShieldState.nextBlockDamageAt = time + this.getPlayerDamageInvulnerabilityMs();
    this.updateRammingShieldVisual(time);
    this.emitFloatingDamageNumber(impactX, impactY, damage, 'shield');
    this.emitRammingShieldDamageFeedback(impactX, impactY);
    this.updateGameplayHud(time);

    return true;
  }

  private applyRammingShieldBreakEffects(time: number, impactX: number, impactY: number): void {
    const bracingLevel = this.getRunUpgradeLevelById('ram_emergency_bracing');
    if (bracingLevel > 0 && time >= this.nextEmergencyBracingAt) {
      this.emergencyBracingUntil = time + 1000;
      this.nextEmergencyBracingAt = time + 12000;
    }

    if (this.getRunUpgradeLevelById('ram_bulwark_nova') > 0) {
      const stats = this.getRammingShieldStats();
      this.emitShipCollisionImpactExplosion(impactX, impactY);
      this.applyRammingShieldAreaDamage({
        originX: impactX,
        originY: impactY,
        radius: 150,
        dotMinimum: -1,
        damageMultiplier: 2,
        baseDamage: stats.guardDamage,
        maxTargets: Number.POSITIVE_INFINITY
      });
    }
  }

  private fireMirrorShieldBolt(x: number, y: number): void {
    const target = this.findNearestPulseEnemyTarget(x, y, 520, new WeakSet<object>());
    if (!target) {
      return;
    }

    const damage = this.rollSourceDamage(3 * this.getResolvedPlayerStats().damage, PLAYER_WEAPON_DAMAGE_VARIANCE);
    this.emitPulseChainEffect(x, y, target.body.x, target.body.y);
    this.damageEnemy(target, damage, 'shield', true);
    if (target.hp <= 0) {
      this.destroyPulseEnemyTarget(target);
    } else {
      this.flashDamageSprites(target.body, target.wrapMirrorBody);
    }
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
    const damage = this.getRammingShieldDamage(enemy, time);
    if (damage <= 0) {
      return;
    }

    this.damageEnemy(enemy, damage, 'shield', true);
    this.applyRammingShieldKnockback(enemy, time);
    this.applyRammingShieldStagger(enemy, time);
    this.emitShipCollisionImpactExplosion(enemy.body.x, enemy.body.y);
    this.applyRammingShieldSuccessfulHitEffects(enemy.body, time, enemy.body.x, enemy.body.y);

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
    const damage = this.getRammingShieldDamage(debris, time);
    if (damage <= 0) {
      return;
    }

    this.damageDebris(debris, damage, 'shield', true);
    this.applyRammingShieldKnockback(debris, time);
    this.emitShipCollisionImpactExplosion(debris.body.x, debris.body.y);
    this.applyRammingShieldSuccessfulHitEffects(debris.body, time, debris.body.x, debris.body.y);

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
    const damage = this.getRammingShieldDamage(asteroid, time);
    if (damage <= 0) {
      return;
    }

    this.damageAsteroid(asteroid, damage, 'shield', true);
    this.applyRammingShieldKnockback(asteroid, time);
    this.emitAsteroidImpactExplosion(asteroid.body.x, asteroid.body.y, asteroid.tier);
    this.applyRammingShieldSuccessfulHitEffects(asteroid.body, time, asteroid.body.x, asteroid.body.y);

    if (asteroid.hp <= 0) {
      this.destroyBasicAsteroidInstance(asteroid);
    } else {
      this.flashAsteroidDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
      this.applyRammingShieldAsteroidImpulse(asteroid);
    }
  }

  private applyRammingShieldAsteroidImpulse(asteroid: BasicAsteroid): void {
    const impactDirection = this.getWrappedDirection(this.player.x, this.player.y, asteroid.body.x, asteroid.body.y);

    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];
    addDirectionalImpulse(asteroid.velocity, impactDirection, tierConfig.impactImpulse, this.getGlobalMaxSpeed());
  }

  private applyRammingShieldKnockback(target: AnyGameEnemy | BasicAsteroid | EnemyWreckageDebris, _time: number): void {
    const stats = this.getRammingShieldStats();
    const direction = this.getWrappedDirection(this.player.x, this.player.y, target.body.x, target.body.y);

    if ('tier' in target || 'damage' in target) {
      addDirectionalImpulse(target.velocity, direction, stats.knockback, this.getGlobalMaxSpeed());
      return;
    }

    addDirectionalImpulse(target.knockbackVelocity, direction, stats.knockback, this.getGlobalMaxSpeed());
  }

  private applyRammingShieldStagger(enemy: AnyGameEnemy, time: number): void {
    const level = this.getRunUpgradeLevelById('ram_stagger_lock');
    if (level <= 0 || !this.isLiveEnemy(enemy) || !this.isRammingShieldBashing(time)) {
      return;
    }

    const forward = this.getForwardDirection(this.player.rotation);
    enemy.stateData.contactRecoilUntil = Math.max(
      typeof enemy.stateData.contactRecoilUntil === 'number' ? enemy.stateData.contactRecoilUntil : 0,
      time + 1500
    );
    enemy.stateData.contactRecoilNormalX = forward.x;
    enemy.stateData.contactRecoilNormalY = forward.y;
    enemy.state = 'contact-recoil';
    enemy.stateStartedAt = time;
  }

  private applyRammingShieldSuccessfulHitEffects(targetKey: object, time: number, hitX: number, hitY: number): void {
    if (!this.isRammingShieldBashing(time)) {
      return;
    }

    this.applyRammingShieldHardReset(time);
    if (this.rammingShieldLastBashEffectsUntil === this.rammingShieldState.empoweredUntil) {
      return;
    }

    this.rammingShieldLastBashEffectsUntil = this.rammingShieldState.empoweredUntil;

    const stats = this.getRammingShieldStats();
    if (this.getRunUpgradeLevelById('ram_follow_through') > 0) {
      this.applyRammingShieldAreaDamage({
        originX: hitX,
        originY: hitY,
        radius: stats.range + 140,
        dotMinimum: 0.35,
        damageMultiplier: 0.5,
        baseDamage: stats.bashDamage,
        maxTargets: this.getRunUpgradeLevelById('ram_follow_through'),
        exclude: new Set([targetKey])
      });
    }

    if (this.getRunUpgradeLevelById('ram_shock_front') > 0) {
      this.applyRammingShieldAreaDamage({
        originX: this.player.x,
        originY: this.player.y,
        radius: 210,
        dotMinimum: 0.45,
        damageMultiplier: 0.5 * this.getRunUpgradeLevelById('ram_shock_front'),
        baseDamage: stats.bashDamage,
        maxTargets: Number.POSITIVE_INFINITY,
        exclude: new Set([targetKey])
      });
    }

    if (this.getRunUpgradeLevelById('ram_aegis_drive') > 0) {
      this.applyRammingShieldAreaDamage({
        originX: this.player.x,
        originY: this.player.y,
        radius: 150,
        dotMinimum: -0.35,
        damageMultiplier: 0.35,
        baseDamage: stats.bashDamage,
        maxTargets: Number.POSITIVE_INFINITY,
        exclude: new Set([targetKey])
      });
    }
  }

  private applyRammingShieldHardReset(time: number): void {
    const level = this.getRunUpgradeLevelById('ram_hard_reset');
    if (level <= 0 || this.rammingShieldState.hp >= this.getRammingShieldMaxHp()) {
      return;
    }

    const delayMultiplier = Math.max(0.25, 1 - level * 0.2);
    this.rammingShieldState.nextRegenAt = Math.min(
      this.rammingShieldState.nextRegenAt,
      time + this.getRammingShieldStats().shieldRegenDelaySeconds * 1000 * delayMultiplier
    );
  }

  private applyRammingShieldAreaDamage(input: {
    originX: number;
    originY: number;
    radius: number;
    dotMinimum: number;
    damageMultiplier: number;
    baseDamage: number;
    maxTargets: number;
    exclude?: Set<object>;
  }): void {
    const forward = this.getForwardDirection(this.player.rotation);
    let hits = 0;
    const tryApply = (body: Phaser.GameObjects.Container, apply: () => void): void => {
      if (hits >= input.maxTargets || input.exclude?.has(body)) {
        return;
      }

      const offset = this.getWrappedDirection(input.originX, input.originY, body.x, body.y);
      if (offset.lengthSq() > input.radius * input.radius) {
        return;
      }

      const direction = offset.lengthSq() > 0.0001 ? offset.clone().normalize() : forward;
      if (direction.dot(forward) < input.dotMinimum) {
        return;
      }

      apply();
      hits += 1;
    };

    const damage = () =>
      this.rollSourceDamage(
        input.baseDamage * input.damageMultiplier * this.getResolvedPlayerStats().damage,
        this.getRammingShieldStats().damageVariance
      );

    for (const enemy of this.getAllEnemies()) {
      tryApply(enemy.body, () => {
        this.damageEnemy(enemy, damage(), 'shield', true);
        this.resolveEnemyDestroyedByPhysicalImpact(enemy);
      });
    }

    for (let index = this.basicAsteroids.length - 1; index >= 0; index -= 1) {
      const asteroid = this.basicAsteroids[index];
      tryApply(asteroid.body, () => {
        this.damageAsteroid(asteroid, damage(), 'shield', true);
        if (asteroid.hp <= 0) {
          this.destroyBasicAsteroidInstance(asteroid);
        } else {
          this.flashAsteroidDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
        }
      });
    }

    for (let index = this.enemyWreckageDebris.length - 1; index >= 0; index -= 1) {
      const debris = this.enemyWreckageDebris[index];
      tryApply(debris.body, () => {
        this.damageDebris(debris, damage(), 'shield', true);
        if (debris.hp <= 0) {
          this.spawnScrapPickup('debris', SCRAP_PICKUP_VALUE_FROM_DEBRIS, debris.body.x, debris.body.y, debris.velocity);
          this.destroyEnemyWreckageDebris(debris, true);
          this.enemyWreckageDebris.splice(index, 1);
        } else {
          this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
        }
      });
    }
  }

  private getEnemyContactVelocity(enemy: AnyGameEnemy): Phaser.Math.Vector2 {
    return getTotalVelocity({
      velocity: enemy.velocity,
      knockbackVelocity: enemy.knockbackVelocity
    });
  }

  private getEnemyTotalVelocity(enemy: AnyGameEnemy): Phaser.Math.Vector2 {
    return getTotalVelocity(enemy);
  }

  private getLiveEnemyTotalVelocity(enemy: LiveGameEnemy): Phaser.Math.Vector2 {
    return getTotalVelocity(enemy);
  }

  private applyPlayerEnemyKnockback(contact: PlayerEnemyContact, time: number): void {
    const normal = contact.normal;
    const separation = Math.min(
      contact.penetration * PLAYER_ENEMY_CONTACT_SEPARATION_PERCENT,
      PLAYER_ENEMY_CONTACT_MAX_SEPARATION
    );

    this.nudgeWrappedObject(this.player, normal, separation * 0.5);
    this.nudgeWrappedObject(contact.enemy.body, normal, -separation * 0.5);
    this.markEnemyContactRecoil(contact.enemy, normal, time);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    applyCollisionImpulse({
      normal,
      firstVelocity: this.playerVelocity,
      secondVelocity: contact.enemy.knockbackVelocity,
      minImpulse: PLAYER_ENEMY_CONTACT_MIN_IMPULSE,
      maxImpulse: PLAYER_ENEMY_CONTACT_MAX_IMPULSE,
      relativeSpeedScale: PLAYER_ENEMY_CONTACT_RELATIVE_SPEED_SCALE,
      secondMaxSpeed: this.getGlobalMaxSpeed(),
      restitution: ENEMY_CONTACT_RESTITUTION_SHARE,
      relativeVelocity: getRelativeVelocity(this.playerVelocity, this.getEnemyContactVelocity(contact.enemy))
    });
    this.nextPlayerContactImpulseAt = time + PLAYER_ENEMY_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private markEnemyContactRecoil(enemy: AnyGameEnemy, normal: Phaser.Math.Vector2, time: number): void {
    if (!this.isLiveEnemy(enemy)) {
      return;
    }

    enemy.stateData.contactRecoilUntil = Math.max(
      typeof enemy.stateData.contactRecoilUntil === 'number' ? enemy.stateData.contactRecoilUntil : 0,
      time + ENEMY_CONTACT_RECOIL_MS
    );
    enemy.stateData.contactRecoilNormalX = normal.x;
    enemy.stateData.contactRecoilNormalY = normal.y;
    enemy.state = 'contact-recoil';
    enemy.stateStartedAt = time;
  }

  private applyPlayerAsteroidKnockback(contact: PlayerAsteroidContact, time: number): void {
    const normal = contact.normal;
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * 0.5);
    this.nudgeWrappedObject(contact.asteroid.body, normal, -separation * 0.5);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    applyCollisionImpulse({
      normal,
      firstVelocity: this.playerVelocity,
      secondVelocity: contact.asteroid.velocity,
      minImpulse: PLAYER_CONTACT_MIN_IMPULSE,
      maxImpulse: PLAYER_CONTACT_MAX_IMPULSE,
      relativeSpeedScale: PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
      secondMaxSpeed: this.getGlobalMaxSpeed()
    });
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private applyPlayerDebrisKnockback(contact: PlayerDebrisContact, time: number): void {
    const normal = contact.normal;
    const separation = Math.min(contact.penetration * PLAYER_CONTACT_SEPARATION_PERCENT, PLAYER_CONTACT_MAX_SEPARATION);

    this.nudgeWrappedObject(this.player, normal, separation * 0.5);
    this.nudgeWrappedObject(contact.debris.body, normal, -separation * 0.5);

    if (time < this.nextPlayerContactImpulseAt) {
      return;
    }

    applyCollisionImpulse({
      normal,
      firstVelocity: this.playerVelocity,
      secondVelocity: contact.debris.velocity,
      minImpulse: PLAYER_CONTACT_MIN_IMPULSE,
      maxImpulse: PLAYER_CONTACT_MAX_IMPULSE,
      relativeSpeedScale: PLAYER_CONTACT_RELATIVE_SPEED_SCALE,
      secondMaxSpeed: this.getGlobalMaxSpeed()
    });
    this.nextPlayerContactImpulseAt = time + PLAYER_CONTACT_IMPULSE_COOLDOWN_MS;
  }

  private getCollisionNormal(offset: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    return getCollisionNormalFromOffset(offset, this.playerVelocity);
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

    const bracingMultiplier = time < this.emergencyBracingUntil ? 0.5 : 1;
    const adjustedDamage = damage * bracingMultiplier;
    const hullDamage = options.bypassDefense
      ? Math.max(0, Math.round(adjustedDamage))
      : Math.max(1, Math.round(adjustedDamage - this.getResolvedPlayerStats().defense));
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
    this.runEndReason = 'death';
    this.gameFlowState = 'results';
    this.failMission('player-death', this.time.now);
    this.playerHull = 0;
    this.captureRunResults(this.time.now);
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
    this.closeEjectConfirmation();
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
    this.runEndReason = 'none';
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

  private debugHealPlayer(amount: number): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead || amount <= 0) {
      return;
    }

    this.playerHull = Math.min(this.getPlayerMaxHull(), this.playerHull + amount);
    this.updateGameplayHud(this.time.now);
  }

  private debugDamagePlayer(amount: number): void {
    if (!this.isGameplayWorldActive() || this.isPlayerDead || amount <= 0) {
      return;
    }

    const previousDebugInvulnerable = this.debugState.playerInvulnerable;
    const previousInvulnerableUntil = this.playerInvulnerableUntil;
    this.debugState.playerInvulnerable = false;
    this.playerInvulnerableUntil = 0;
    this.damagePlayer(amount, this.time.now, this.player.x, this.player.y, {
      bypassShield: true,
      bypassDefense: true,
      source: 'enemy'
    });
    this.debugState.playerInvulnerable = previousDebugInvulnerable;
    this.playerInvulnerableUntil = previousDebugInvulnerable ? Number.MAX_SAFE_INTEGER : previousInvulnerableUntil;
  }

  private debugStopPlayerVelocity(): void {
    this.playerVelocity.set(0, 0);
    this.clearRammingShieldDashBurst();
    this.updateGameplayHud(this.time.now);
  }

  private debugTeleportPlayer(target: DebugPlayerTeleportTarget): void {
    if (!this.player) {
      return;
    }

    if (target === 'mission' && this.missionRuntime) {
      this.debugTeleportPlayerTo(this.missionRuntime.objective.x, this.missionRuntime.objective.y);
      return;
    }

    if (target === 'blackHole' && this.blackHole) {
      const distance = (this.blackHole.captureRadius || this.blackHole.eventHorizonRadius) + 80;
      this.debugTeleportPlayerTo(this.blackHole.body.x + distance, this.blackHole.body.y);
      return;
    }

    const center = getArenaCenter(this.arena);
    this.debugTeleportPlayerTo(center.x, center.y);
  }

  private debugNudgePlayer(dx: number, dy: number): void {
    if (!this.player) {
      return;
    }

    this.debugTeleportPlayerTo(this.player.x + dx, this.player.y + dy, false);
  }

  private debugTeleportPlayerTo(x: number, y: number, stopVelocity = true): void {
    if (!this.player) {
      return;
    }

    this.player.setPosition(wrapCoordinate(x, this.arena.width), wrapCoordinate(y, this.arena.height));
    if (stopVelocity) {
      this.debugStopPlayerVelocity();
    }
    this.resetBackgroundPlayerTracking();
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.updateGameplayHud(this.time.now);
    this.updateMinimap();
  }

  private debugAddBankedUpgrade(amount: number): void {
    if (amount <= 0) {
      return;
    }

    this.bankedUpgrades += Math.floor(amount);
    this.updateGameplayHud(this.time.now);
    this.updateUpgradeButton();
  }

  private debugResetWeaponCooldowns(): void {
    this.playerWeapons.nextAutoWeaponFireAt = 0;
    this.playerWeapons.nextPrimaryWeaponFireAt = 0;
    this.playerWeapons.nextSecondaryWeaponFireAt = 0;
  }

  private debugRefillRammingShield(): void {
    if (!this.hasRammingShield()) {
      return;
    }

    this.ensureRammingShieldRuntime();
    this.rammingShieldState.hp = this.getRammingShieldMaxHp();
    this.rammingShieldState.dashCharges = this.getRammingShieldStats().dashMaxCharges;
    this.rammingShieldState.nextDashChargeAt = 0;
    this.updateGameplayHud(this.time.now);
  }

  private unlockSecretControls(): void {
    if (this.progressionState.secretControlUnlocked) {
      return;
    }

    this.progressionState.secretControlUnlocked = true;
    this.saveProgression();
  }

  private toggleSecretTrainingInvulnerability(): void {
    this.debugState.playerInvulnerable = !this.debugState.playerInvulnerable;
    this.playerInvulnerableUntil = this.debugState.playerInvulnerable ? Number.MAX_SAFE_INTEGER : 0;
    this.refreshSecretControlOverlay();
    this.updateGameplayHud(this.time.now);
  }

  private debugEmergencyTeleportSafe(): void {
    this.debugTeleportPlayer('center');
  }

  private debugSpawnSecretScrapBurst(): void {
    this.addRunScrap(100);
    for (let i = 0; i < 4; i += 1) {
      this.spawnDebugScrapPickup();
    }
  }

  private debugSpawnSecretEnemyWave(): void {
    this.spawnDebugEncounter('strike-wing');
  }

  private getSecretControlOverlayValues(): SecretControlOverlayValues {
    return {
      hull: this.playerHull,
      maxHull: this.getPlayerMaxHull(),
      fuel: this.fuel,
      maxFuel: RUN_FUEL_MAX,
      runScrapTotal: this.runScrapTotal,
      trainingInvulnerable: this.debugState.playerInvulnerable,
      blackHoleActive: Boolean(this.blackHole)
    };
  }

  private payRunCredits(): void {
    if (this.hasPaidRunCredits) {
      return;
    }

    this.lastRunCreditsEarned = Math.floor(
      this.lastRunScrapConverted * SCRAP_TO_CREDIT_RATE * this.getScrapCreditMultiplier()
    );
    this.totalCredits += this.lastRunCreditsEarned;
    this.hasPaidRunCredits = true;
    this.saveProgression();
  }

  private captureRunResults(time: number): void {
    this.lastRunScrapTotal = this.runScrapTotal + this.runScrapSpent;
    this.lastRunScrapSpent = this.runScrapSpent;
    this.lastRunScrapConverted = this.runScrapTotal;
    this.lastRunSurvivalMs = this.getSurvivalElapsedMs(time);
  }

  private getScrapCreditMultiplier(): number {
    return this.getResolvedPlayerStats().greed;
  }

  private showResultsScreen(): void {
    this.gameFlowState = 'results';
    this.sectorScannerArrow?.setVisible(false);
    this.destroyResultsScreen();

    const elapsedSeconds = Math.max(0, Math.floor(this.lastRunSurvivalMs / 1000));

    this.resultsScreen = createResultsScreen({
      scene: this,
      survivalTimeLabel: this.formatSurvivalTime(elapsedSeconds),
      scrapCollected: this.lastRunScrapTotal,
      scrapSpent: this.lastRunScrapSpent,
      scrapConverted: this.lastRunScrapConverted,
      creditsEarned: this.lastRunCreditsEarned,
      totalCredits: this.totalCredits,
      unlockedRewards: this.lastRunUnlockedRewards,
      contractName: this.missionRuntime?.definition.displayName ?? this.getSelectedMissionDefinition().displayName,
      contractStatus: this.getMissionResultStatus(),
      runEndReason: this.getRunEndResultStatus(),
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

  private continueCurrentRun(): void {
    if (!this.player || this.runEndReason !== 'mission') {
      return;
    }

    this.destroyResultsScreen();
    this.gameFlowState = 'running';
    this.isPlayerDead = false;
    this.runEndReason = 'none';
    this.playerHull = Math.max(this.playerHull, this.getPlayerMaxHull());
    this.player.setVisible(true);
    this.playerSprite.clearTint();
    this.playerSprite.setAlpha(1);
    this.playerVelocity.set(0, 0);
    this.clearRammingShieldDashBurst();
    this.playerInvulnerableUntil = this.time.now + this.getPlayerDamageInvulnerabilityMs();
    this.reactivateFailedMissionForContinue();
    this.updateGameplayHud(this.time.now);
    this.updateResultsButton();
    this.autoRunDiagnostics.startRun(`${this.getSelectedShipDefinition().displayName} continued`);
  }

  private reactivateFailedMissionForContinue(): void {
    if (!this.missionRuntime || this.missionRuntime.status !== 'failed') {
      return;
    }

    this.missionRuntime.status = 'active';
    this.missionRuntime.failedAt = null;
    this.missionRuntime.failureReason = null;
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
      damageVariance: ENEMY_PROJECTILE_DAMAGE_VARIANCE,
      hitRadius: request.radius,
      owner: 'enemy',
      pierceRemaining: 0,
      knockback: 0,
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
      this.damagePlayer(this.rollSourceDamage(damage, ENEMY_PROJECTILE_DAMAGE_VARIANCE), this.time.now, x, y, { source: 'enemy' });
    }

    for (const enemy of this.liveEnemies) {
      if (enemy.id === sourceId || enemy.hp <= 0) {
        continue;
      }

      if (this.getWrappedDirection(x, y, enemy.body.x, enemy.body.y).length() <= radius) {
        this.damageLiveEnemy(enemy, this.rollSourceDamage(damage * 0.45, ENEMY_PROJECTILE_DAMAGE_VARIANCE), 'enemy', true);
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
      tryHitPlayer: (projectile) => this.tryHitPlayerWithEnemyProjectile(projectile, time),
      tryHitObstruction: (projectile) => this.tryHitEnemyProjectileObstruction(projectile)
    });
  }

  private tryHitPlayerWithEnemyProjectile(projectile: EnemyProjectile, time: number): boolean {
    if (this.isPlayerDead) {
      return false;
    }

    const projectileDamage = this.rollSourceDamage(
      projectile.damage,
      projectile.damageVariance ?? ENEMY_PROJECTILE_DAMAGE_VARIANCE
    );
    const shieldCollision = this.getRammingShieldCircleCollision(
      projectile.body.x,
      projectile.body.y,
      projectile.hitRadius
    );
    if (shieldCollision) {
      if (this.getRunUpgradeLevelById('ram_deflector_field') > 0) {
        this.emitRammingShieldDamageFeedback(projectile.body.x, projectile.body.y);
        if (this.getRunUpgradeLevelById('ram_mirror_shield') > 0) {
          this.fireMirrorShieldBolt(projectile.body.x, projectile.body.y);
        }
      } else {
        this.blockDamageWithRammingShield(projectileDamage, time, projectile.body.x, projectile.body.y);
      }
      return true;
    }

    const offset = this.getWrappedDirection(projectile.body.x, projectile.body.y, this.player.x, this.player.y);
    const hitRadius = this.getPlayerCollisionRadius() + projectile.hitRadius;

    if (offset.lengthSq() > hitRadius * hitRadius) {
      return false;
    }

    if (time >= this.playerInvulnerableUntil) {
      this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
      this.damagePlayer(projectileDamage, time, projectile.body.x, projectile.body.y, { source: 'enemy' });
    }

    return true;
  }

  private tryHitEnemyProjectileObstruction(projectile: EnemyProjectile): boolean {
    return this.tryHitEnemyProjectileDebris(projectile) || this.tryHitEnemyProjectileAsteroid(projectile);
  }

  private tryHitEnemyProjectileDebris(projectile: EnemyProjectile): boolean {
    return tryHitCircleTargets({
      arena: this.arena,
      projectile,
      targets: this.enemyWreckageDebris,
      getTargetHitRadius: (debris) => this.getDebrisCollisionRadius(debris),
      onHit: (debris, i) => {
        this.damageDebris(
          debris,
          this.rollSourceDamage(projectile.damage, projectile.damageVariance ?? ENEMY_PROJECTILE_DAMAGE_VARIANCE),
          'enemy',
          true
        );

        if (debris.hp <= 0) {
          this.destroyEnemyWreckageDebris(debris, true);
          this.enemyWreckageDebris.splice(i, 1);
        } else {
          this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
          this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
        }
      }
    });
  }

  private tryHitEnemyProjectileAsteroid(projectile: EnemyProjectile): boolean {
    return tryHitCircleTargets({
      arena: this.arena,
      projectile,
      targets: this.basicAsteroids,
      getTargetHitRadius: (asteroid) => this.getAsteroidCollisionRadius(asteroid),
      onHit: (asteroid) => {
        this.damageAsteroid(
          asteroid,
          this.rollSourceDamage(projectile.damage, projectile.damageVariance ?? ENEMY_PROJECTILE_DAMAGE_VARIANCE),
          'enemy',
          true
        );

        if (asteroid.hp <= 0) {
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier, projectile.hitRadius);
          this.destroyBasicAsteroidInstance(asteroid, false);
        } else {
          this.flashAsteroidDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier, projectile.hitRadius);
          this.applyAsteroidImpactFromProjectile(asteroid, projectile);
        }
      }
    });
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
    this.updateAsteroidOffscreenAges(this.time.now);
    this.coalesceOffscreenAsteroids(this.time.now);
  }

  private updateAsteroidOffscreenAges(time: number): void {
    for (const asteroid of this.basicAsteroids) {
      if (this.sectorAsteroidIds.has(asteroid) || this.isAsteroidInCameraView(asteroid)) {
        asteroid.offscreenSince = null;
        continue;
      }

      asteroid.offscreenSince ??= time;
    }
  }

  private coalesceOffscreenAsteroids(time: number): void {
    if (time < this.nextAsteroidCoalesceAt || this.basicAsteroids.length <= ASTEROID_COALESCE_SOFT_LIMIT) {
      return;
    }

    this.nextAsteroidCoalesceAt = time + ASTEROID_COALESCE_INTERVAL_MS;

    const emergency = this.basicAsteroids.length >= ASTEROID_COALESCE_HARD_LIMIT;
    const minimumOffscreenMs = emergency ? ASTEROID_COALESCE_EMERGENCY_OFFSCREEN_MS : ASTEROID_COALESCE_NORMAL_OFFSCREEN_MS;
    const targetLimit = emergency ? ASTEROID_COALESCE_TARGET_LIMIT : ASTEROID_COALESCE_SOFT_LIMIT;
    const maxTier = emergency ? ASTEROID_COALESCE_MAX_TIER_EMERGENCY : ASTEROID_COALESCE_MAX_TIER_NORMAL;
    const candidates = this.basicAsteroids
      .filter((asteroid) => this.canCoalesceAsteroid(asteroid, time, minimumOffscreenMs, maxTier))
      .sort((first, second) => {
        const firstAge = first.offscreenSince === null ? 0 : time - first.offscreenSince;
        const secondAge = second.offscreenSince === null ? 0 : time - second.offscreenSince;
        return secondAge - firstAge || first.tier - second.tier;
      });

    for (const source of candidates) {
      if (this.basicAsteroids.length <= targetLimit || !this.basicAsteroids.includes(source)) {
        continue;
      }

      const group = this.findAsteroidCoalesceGroup(source, candidates, emergency);
      if (group.length < ASTEROID_COALESCE_RECIPE_COUNT) {
        continue;
      }

      this.mergeAsteroidCoalesceGroup(group);
    }
  }

  private canCoalesceAsteroid(
    asteroid: BasicAsteroid,
    time: number,
    minimumOffscreenMs: number,
    maxTier: AsteroidTier
  ): boolean {
    return (
      asteroid.tier < 10 &&
      asteroid.tier <= maxTier &&
      !this.sectorAsteroidIds.has(asteroid) &&
      asteroid.offscreenSince !== null &&
      time - asteroid.offscreenSince >= minimumOffscreenMs
    );
  }

  private findAsteroidCoalesceGroup(source: BasicAsteroid, candidates: BasicAsteroid[], emergency: boolean): BasicAsteroid[] {
    const group = [source];
    const radiusSq = emergency ? Number.POSITIVE_INFINITY : ASTEROID_COALESCE_NEAR_RADIUS * ASTEROID_COALESCE_NEAR_RADIUS;

    for (const candidate of candidates) {
      if (candidate === source || candidate.tier !== source.tier || !this.basicAsteroids.includes(candidate)) {
        continue;
      }

      const distanceSq = this.getWrappedDirection(source.body.x, source.body.y, candidate.body.x, candidate.body.y).lengthSq();
      if (distanceSq > radiusSq) {
        continue;
      }

      group.push(candidate);

      if (group.length >= ASTEROID_COALESCE_RECIPE_COUNT) {
        break;
      }
    }

    return group;
  }

  private mergeAsteroidCoalesceGroup(group: BasicAsteroid[]): void {
    const source = group[0];
    const nextTier = this.getNextAsteroidTier(source.tier);
    const position = this.getAsteroidCoalescePosition(group);
    const velocity = new Phaser.Math.Vector2(0, 0);

    for (const asteroid of group) {
      velocity.add(asteroid.velocity);
    }
    velocity.scale(1 / group.length);

    const mergedAsteroid = this.createAsteroidInstance(position.x, position.y, nextTier, velocity);
    mergedAsteroid.offscreenSince = source.offscreenSince;

    for (const asteroid of group) {
      const index = this.basicAsteroids.indexOf(asteroid);
      if (index >= 0) {
        this.basicAsteroids.splice(index, 1);
      }
      destroyAsteroidRenderObjects(asteroid);
    }

    this.basicAsteroids.push(mergedAsteroid);
  }

  private getNextAsteroidTier(tier: AsteroidTier): AsteroidTier {
    return ASTEROID_TIERS[Math.min(ASTEROID_TIERS.indexOf(tier) + 1, ASTEROID_TIERS.length - 1)];
  }

  private getAsteroidCoalescePosition(group: BasicAsteroid[]): Phaser.Math.Vector2 {
    const anchor = group[0];
    let totalX = anchor.body.x;
    let totalY = anchor.body.y;

    for (let index = 1; index < group.length; index += 1) {
      const offset = this.getWrappedDirection(anchor.body.x, anchor.body.y, group[index].body.x, group[index].body.y);
      totalX += anchor.body.x + offset.x;
      totalY += anchor.body.y + offset.y;
    }

    return new Phaser.Math.Vector2(
      wrapCoordinate(totalX / group.length, this.arena.width),
      wrapCoordinate(totalY / group.length, this.arena.height)
    );
  }

  private isAsteroidInCameraView(asteroid: BasicAsteroid): boolean {
    const position = this.getNearestWrappedRenderPosition(asteroid.body.x, asteroid.body.y);
    return this.isCircleInCameraView(position.x, position.y, this.getAsteroidCollisionRadius(asteroid));
  }

  private resolveAsteroidCollisions(time: number): void {
    resolveAsteroidCollisionsSystem({
      arena: this.arena,
      asteroids: this.basicAsteroids,
      time,
      asteroidCollisionImpulseScale: this.debugState.asteroidCollisionImpulseScale,
      getCollisionNormal: (offset) => this.getCollisionNormal(offset),
      getAsteroidCollisionRadius: (asteroid) => this.getAsteroidCollisionRadius(asteroid),
      getGlobalMaxSpeed: () => this.getGlobalMaxSpeed(),
      nudgeWrappedObject: (object, normal, distance) => this.nudgeWrappedObject(object, normal, distance),
      updateAsteroidWrapMirror: (asteroid) => this.updateAsteroidWrapMirror(asteroid),
      canApplyAsteroidCollisionDamage: (first, second, collisionTime) =>
        this.canApplyAsteroidCollisionDamage(first, second, collisionTime),
      markAsteroidCollisionDamageApplied: (first, second, collisionTime) =>
        this.markAsteroidCollisionDamageApplied(first, second, collisionTime),
      rollAsteroidCollisionDamage: (tier) => this.rollAsteroidCollisionDamage(tier),
      damageAsteroid: (asteroid, damage) => this.damageAsteroid(asteroid, damage, 'asteroid', false),
      emitAsteroidImpactExplosion: (x, y, tier) => this.emitAsteroidImpactExplosion(x, y, tier),
      flashDamageSprites: (...containers) => this.flashAsteroidDamageSprites(...containers),
      destroyAsteroidsFromCollision: (destroyedAsteroids) => this.destroyAsteroidsFromCollision(destroyedAsteroids)
    });
  }

  private rollAsteroidCollisionDamage(tier: AsteroidTier): number {
    const damage = ASTEROID_COLLISION_DAMAGE_BY_TIER[tier];
    return this.rollSourceDamage(Phaser.Math.FloatBetween(damage.min, damage.max), ASTEROID_IMPACT_DAMAGE_VARIANCE);
  }

  private canApplyAsteroidCollisionDamage(first: BasicAsteroid, second: BasicAsteroid, time: number): boolean {
    return (
      time >= first.collisionInvulnerableUntil &&
      time >= second.collisionInvulnerableUntil &&
      time >= (this.asteroidCollisionCooldowns.get(first.body)?.get(second.body) ?? 0)
    );
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
    return [...this.liveEnemies];
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
    const primaryWeapon = this.getActivePrimaryWeaponDefinition();

    if (primaryWeapon?.id === 'salvage-beam') {
      const focusLevel = this.getRunUpgradeLevelById('beam_focus');
      const capacitorLevel = this.getRunUpgradeLevelById('beam_extended_capacitors');
      const coolingLevel = this.getRunUpgradeLevelById('beam_heat_sinks');
      const ventLevel = this.getRunUpgradeLevelById('beam_vent_cycle');
      const lensLevel = this.getRunUpgradeLevelById('beam_long_lens');

      if (focusLevel + capacitorLevel + coolingLevel + ventLevel + lensLevel === 0) {
        return 'Weapon upgrades none';
      }

      return `Weapon upgrades F${focusLevel} C${capacitorLevel} H${coolingLevel} V${ventLevel} L${lensLevel}`;
    }

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

  private updateActiveMainWeapon(time: number, deltaSeconds: number): void {
    if (this.isPlayerDead || this.isUpgradeOverlayOpen) {
      this.updateBeamSlotsInactive(deltaSeconds);
      return;
    }

    const pointer = this.input.activePointer;
    const isPointerBlockedByDebugMenu =
      (this.debugMenuHost?.containsPointer(pointer) ?? false) ||
      (this.secretControlOverlay?.containsPointer(pointer) ?? false);
    const activeAutoWeapon = this.getEffectiveAutoWeaponDefinition();
    if (activeAutoWeapon?.behaviorType === 'beam') {
      this.updateBeamWeapon(activeAutoWeapon, 'auto', true, time, deltaSeconds);
    } else {
      this.updateBeamSlotInactive('auto', deltaSeconds);
    }
    if (activeAutoWeapon && activeAutoWeapon.behaviorType !== 'beam' && time >= this.playerWeapons.nextAutoWeaponFireAt) {
      const result = this.usePlayerWeapon(activeAutoWeapon, 'auto', time);
      this.playerWeapons.nextAutoWeaponFireAt = time + result.cooldownMs;
    }

    const primaryWeapon = this.getActivePrimaryWeaponDefinition();
    const isPrimaryFiring = this.isControlDown('fire') || (!isPointerBlockedByDebugMenu && pointer.leftButtonDown());
    if (primaryWeapon?.behaviorType === 'beam') {
      this.updateBeamWeapon(primaryWeapon, 'primary', isPrimaryFiring, time, deltaSeconds);
    } else {
      this.updateBeamSlotInactive('primary', deltaSeconds);
    }
    if (primaryWeapon && primaryWeapon.behaviorType !== 'beam' && isPrimaryFiring && time >= this.playerWeapons.nextPrimaryWeaponFireAt) {
      const result = this.usePlayerWeapon(primaryWeapon, 'primary', time);
      this.playerWeapons.nextPrimaryWeaponFireAt = time + result.cooldownMs;
    }

    const secondaryWeapon = this.getActiveSecondaryWeaponDefinition();
    const isSecondaryFiring = Boolean(secondaryWeapon && !isPointerBlockedByDebugMenu && pointer.rightButtonDown());
    if (secondaryWeapon?.behaviorType === 'beam') {
      this.updateBeamWeapon(secondaryWeapon, 'secondary', isSecondaryFiring, time, deltaSeconds);
    } else {
      this.updateBeamSlotInactive('secondary', deltaSeconds);
    }
    if (
      secondaryWeapon &&
      secondaryWeapon.behaviorType !== 'beam' &&
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
    if (weapon.behaviorType === 'beam') {
      return { cooldownMs: 0 };
    }

    if (weapon.behaviorType === 'ramming-shield') {
      return { cooldownMs: this.useRammingShieldWeapon(resolved.rammingShield, time) ? (resolved.rammingShield?.contactCooldownMs ?? 0) : 0 };
    }

    return this.fireProjectileWeapon(resolved, time);
  }

  private useRammingShieldWeapon(stats: RammingShieldStats | undefined, time: number): boolean {
    if (!this.hasRammingShield() || !stats) {
      return false;
    }

    if (!activateRammingShieldDash(this.rammingShieldState, stats, time)) {
      return false;
    }

    const direction = this.getForwardDirection(this.player.rotation);
    this.rammingShieldLastBashEffectsUntil = 0;
    this.startRammingShieldDashBurst(direction, stats);
    this.emitRammingShieldDashBurst(direction, time);
    this.updateRammingShieldVisual(time);
    return true;
  }

  private updateBeamSlotsInactive(deltaSeconds: number): void {
    this.updateBeamSlotInactive('auto', deltaSeconds);
    this.updateBeamSlotInactive('primary', deltaSeconds);
    this.updateBeamSlotInactive('secondary', deltaSeconds);
  }

  private updateBeamSlotInactive(slot: WeaponRuntimeSlot, deltaSeconds: number): void {
    const runtime = this.beamSlots[slot];
    const weapon = this.getBeamSlotWeapon(slot);
    if (weapon) {
      const beam = this.getResolvedWeaponStats(weapon, slot).beam;
      if (beam) {
        this.coolBeamSlot(runtime, beam, deltaSeconds);
      }
    }

    runtime.isActive = false;
    this.hideBeam(slot);
  }

  private updateBeamWeapon(
    weapon: WeaponRegistryEntry,
    slot: WeaponRuntimeSlot,
    isFiring: boolean,
    time: number,
    deltaSeconds: number
  ): void {
    const resolved = this.getResolvedWeaponStats(weapon, slot);
    const beam = resolved.beam;
    const runtime = this.beamSlots[slot];

    if (!beam) {
      this.updateBeamSlotInactive(slot, deltaSeconds);
      return;
    }

    if (!isFiring || runtime.overheated) {
      runtime.isActive = false;
      this.coolBeamSlot(runtime, beam, deltaSeconds);
      runtime.visualLength = Math.max(0, runtime.visualLength - beam.range * deltaSeconds * 8);
      this.hideBeam(slot);
      return;
    }

    if (!runtime.isActive) {
      runtime.activationStartedAt = time;
      runtime.nextTickAt = time;
      this.emitBeamIgnitionBurst(beam);
    }

    runtime.isActive = true;
    runtime.heat = Math.min(beam.heatMax, runtime.heat + beam.heatGainPerSecond * deltaSeconds);
    if (runtime.heat >= beam.heatMax) {
      runtime.overheated = true;
      runtime.isActive = false;
      runtime.lastVentAt = time;
      this.hideBeam(slot);
      this.emitBeamOverheatVent();
      return;
    }

    runtime.visualLength = this.getBeamVisualLength(runtime, beam, time);
    this.drawBeam(slot, beam, time);
    while (time >= runtime.nextTickAt) {
      this.applyBeamTick(beam, runtime.visualLength, slot, time);
      runtime.nextTickAt = Math.max(runtime.nextTickAt + beam.tickIntervalMs, time + beam.tickIntervalMs);
    }
  }

  private coolBeamSlot(runtime: BeamSlotRuntime, beam: ResolvedBeamWeaponStats, deltaSeconds: number): void {
    const cooling = runtime.overheated ? beam.overheatCoolingPerSecond : beam.coolingPerSecond;
    runtime.heat = Math.max(0, runtime.heat - cooling * deltaSeconds);
    if (runtime.heat <= 0) {
      runtime.overheated = false;
    }
  }

  private applyBeamTick(beam: ResolvedBeamWeaponStats, activeRange: number, slot: WeaponRuntimeSlot, time: number): void {
    const damageVariance = beam.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE;
    const rollBeamDamage = () => this.rollPlayerDamage(beam.tickDamage, damageVariance);
    const runtime = this.beamSlots[slot];
    const heatProgress = runtime.heat / Math.max(1, beam.heatMax);
    let contactBurstsThisTick = 0;
    const emitContactSpark = (body: Phaser.GameObjects.Container, radius: number): void => {
      if (contactBurstsThisTick >= BEAM_CONTACT_SPARK_MAX_PER_TICK) {
        return;
      }

      contactBurstsThisTick += 1;
      runtime.contactSparkBurstsEmitted += 1;
      this.emitBeamContactSpark(body, radius, beam, activeRange, heatProgress, time);
    };

    for (let i = this.liveEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.liveEnemies[i];
      if (!enemy?.body.scene || !this.isBeamBodyHit(enemy.body, enemy.definition.stats.radius, beam, activeRange)) {
        continue;
      }

      emitContactSpark(enemy.body, enemy.definition.stats.radius);
      this.damageEnemy(enemy, rollBeamDamage(), 'player', true);
      if (enemy.hp <= 0) {
        this.destroyLiveEnemyWithRewards(enemy, i);
      } else {
        this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
      }
    }

    this.applyBeamToLegacyEnemies(this.basicEnemies, 'chaser', beam, activeRange, rollBeamDamage, emitContactSpark);
    this.applyBeamToLegacyEnemies(this.shooterEnemies, 'shooter', beam, activeRange, rollBeamDamage, emitContactSpark);
    this.applyBeamToLegacyEnemies(this.tankEnemies, 'tank', beam, activeRange, rollBeamDamage, emitContactSpark);

    for (let i = this.basicAsteroids.length - 1; i >= 0; i -= 1) {
      const asteroid = this.basicAsteroids[i];
      if (!asteroid?.body.scene || !this.isBeamBodyHit(asteroid.body, asteroid.hitRadius, beam, activeRange)) {
        continue;
      }

      emitContactSpark(asteroid.body, asteroid.hitRadius);
      this.damageAsteroid(asteroid, rollBeamDamage(), 'player', true);
      if (asteroid.hp <= 0) {
        this.destroyBasicAsteroidInstance(asteroid);
      } else {
        this.flashAsteroidDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
      }
    }

    for (let i = this.enemyWreckageDebris.length - 1; i >= 0; i -= 1) {
      const debris = this.enemyWreckageDebris[i];
      if (!debris?.body.scene || !this.isBeamBodyHit(debris.body, debris.hitRadius, beam, activeRange)) {
        continue;
      }

      emitContactSpark(debris.body, debris.hitRadius);
      this.damageDebris(debris, rollBeamDamage(), 'player', true);
      if (debris.hp <= 0) {
        this.spawnScrapPickup('debris', SCRAP_PICKUP_VALUE_FROM_DEBRIS, debris.body.x, debris.body.y, debris.velocity);
        this.destroyEnemyWreckageDebris(debris, true);
        this.enemyWreckageDebris.splice(i, 1);
      } else {
        this.flashDamageSprites(debris.body, debris.wrapMirrorBody);
      }
    }

    for (const event of this.worldEvents) {
      if (event.status !== 'active' || !this.isBeamBodyHit(event.body, event.definition.hitRadius, beam, activeRange)) {
        continue;
      }

      emitContactSpark(event.body, event.definition.hitRadius);
      const wasDestroyed = this.damageWorldEvent(event, rollBeamDamage()) > 0 && event.hp <= 0;
      if (!wasDestroyed) {
        this.flashDamageSprites(event.body, event.wrapMirrorBody);
      }
    }
  }

  private applyBeamToLegacyEnemies<T extends BasicEnemy | ShooterEnemy | TankEnemy>(
    enemies: T[],
    enemyType: EnemySpawnType,
    beam: ResolvedBeamWeaponStats,
    activeRange: number,
    rollBeamDamage: () => number,
    emitContactSpark: (body: Phaser.GameObjects.Container, radius: number) => void
  ): void {
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const enemy = enemies[i];
      if (!enemy?.body.scene || !this.isBeamBodyHit(enemy.body, this.getEnemyHitRadius(enemy), beam, activeRange)) {
        continue;
      }

      emitContactSpark(enemy.body, this.getEnemyHitRadius(enemy));
      this.damageEnemy(enemy, rollBeamDamage(), 'player', true);
      if (enemy.hp <= 0) {
        this.destroyEnemyWithRewards(enemy, enemies, i, enemyType);
      } else {
        this.flashDamageSprites(enemy.body, enemy.wrapMirrorBody);
      }
    }
  }

  private isBeamBodyHit(body: Phaser.GameObjects.Container, radius: number, beam: ResolvedBeamWeaponStats, activeRange = beam.range): boolean {
    const forward = this.getForwardDirection(this.player.rotation);
    const offset = this.getWrappedDirection(this.player.x, this.player.y, body.x, body.y);
    const projection = offset.dot(forward);
    if (projection < -radius || projection > activeRange + radius) {
      return false;
    }

    const perpendicularSq = Math.max(0, offset.lengthSq() - projection * projection);
    const hitWidth = beam.width * 0.5 + radius;
    return perpendicularSq <= hitWidth * hitWidth;
  }

  private drawBeam(slot: WeaponRuntimeSlot, beam: ResolvedBeamWeaponStats, time: number): void {
    const runtime = this.beamSlots[slot];
    const graphics = runtime.graphics ?? this.add.graphics().setDepth(BEAM_RENDER_DEPTH).setBlendMode(Phaser.BlendModes.ADD);
    runtime.graphics = graphics;
    graphics.clear();

    const forward = this.getForwardDirection(this.player.rotation);
    const start = this.getBeamEmitterPosition(forward);
    const visualLength = Phaser.Math.Clamp(runtime.visualLength, 0, beam.range);
    if (visualLength <= 1) {
      return;
    }

    const heatProgress = runtime.heat / Math.max(1, beam.heatMax);
    const pulse = 0.5 + Math.sin(time * 0.028) * 0.5;
    const endX = start.x + forward.x * visualLength;
    const endY = start.y + forward.y * visualLength;
    const outerWidth = Math.max(5, beam.width * (1.15 + pulse * 0.08 + heatProgress * 0.12));
    const coreWidth = Math.max(2, outerWidth * 0.28);
    const capRadius = outerWidth * 0.5;

    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, outerWidth * 2.1, 0x2fffb4, 0.08 + heatProgress * 0.06);
    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, outerWidth * 1.35, 0x20d8aa, 0.2 + pulse * 0.05);
    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, outerWidth, 0x69f0ae, 0.34);
    this.drawRoundedBeamLayer(graphics, start, forward, visualLength, coreWidth, 0xf2fbff, 0.9);

    graphics.fillStyle(0xf2fbff, 0.52);
    graphics.fillCircle(start.x, start.y, Math.max(3, coreWidth * 1.2));
    graphics.fillStyle(0xf2fbff, 0.68);
    graphics.fillCircle(endX + forward.x * coreWidth * 0.16, endY + forward.y * coreWidth * 0.16, Math.max(2, coreWidth * 0.58));
    graphics.fillStyle(0x69f0ae, 0.2 + heatProgress * 0.08);
    graphics.fillCircle(endX, endY, capRadius * 0.62);

    if (visualLength >= beam.range * 0.2 && time >= runtime.lastSparkAt + BEAM_SPARK_INTERVAL_MS) {
      runtime.lastSparkAt = time;
      this.emitBeamTipSpark(endX, endY, forward, heatProgress);
    }
  }

  private drawRoundedBeamLayer(
    graphics: Phaser.GameObjects.Graphics,
    start: Phaser.Math.Vector2,
    forward: Phaser.Math.Vector2,
    length: number,
    width: number,
    color: number,
    alpha: number
  ): void {
    const halfWidth = width * 0.5;
    const right = new Phaser.Math.Vector2(forward.y, -forward.x);
    const end = new Phaser.Math.Vector2(start.x + forward.x * length, start.y + forward.y * length);

    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(start.x + right.x * halfWidth, start.y + right.y * halfWidth);
    graphics.lineTo(end.x + right.x * halfWidth, end.y + right.y * halfWidth);
    graphics.lineTo(end.x - right.x * halfWidth, end.y - right.y * halfWidth);
    graphics.lineTo(start.x - right.x * halfWidth, start.y - right.y * halfWidth);
    graphics.closePath();
    graphics.fillPath();
    graphics.fillCircle(start.x, start.y, halfWidth);
    graphics.fillCircle(end.x, end.y, halfWidth);
  }

  private hideBeam(slot: WeaponRuntimeSlot): void {
    this.beamSlots[slot].graphics?.clear();
  }

  private resetBeamRuntime(): void {
    for (const slot of ['auto', 'primary', 'secondary'] as WeaponRuntimeSlot[]) {
      this.beamSlots[slot].graphics?.destroy();
      this.beamSlots[slot] = this.createBeamSlotRuntime();
    }
  }

  private createBeamSlotRuntime(): BeamSlotRuntime {
    return {
      heat: 0,
      overheated: false,
      nextTickAt: 0,
      isActive: false,
      activationStartedAt: 0,
      visualLength: 0,
      lastSparkAt: 0,
      contactSparkBurstsEmitted: 0,
      lastVentAt: 0
    };
  }

  private getBeamVisualLength(runtime: BeamSlotRuntime, beam: ResolvedBeamWeaponStats, time: number): number {
    const progress = Phaser.Math.Clamp((time - runtime.activationStartedAt) / BEAM_IGNITION_MS, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    return beam.range * eased;
  }

  private getBeamEmitterPosition(forward: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const emitterOffset = this.getBeamEmitterOffset();
    const base = this.getNearestWrappedRenderPosition(this.player.x, this.player.y);
    return new Phaser.Math.Vector2(base.x + forward.x * emitterOffset, base.y + forward.y * emitterOffset);
  }

  private getBeamEmitterOffset(): number {
    const ship = this.getSelectedShipDefinition();
    return Math.min(44, ship.displaySize * 0.28);
  }

  private emitBeamIgnitionBurst(beam: ResolvedBeamWeaponStats): void {
    const forward = this.getForwardDirection(this.player.rotation);
    const position = this.getBeamEmitterPosition(forward);
    const flash = this.add.circle(position.x, position.y, Math.max(8, beam.width * 0.85), 0x69f0ae, 0.36);

    flash.setDepth(BEAM_RENDER_DEPTH + 0.1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: 140,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });
  }

  private emitBeamTipSpark(x: number, y: number, forward: Phaser.Math.Vector2, heatProgress: number): void {
    const sparkCount = Phaser.Math.Between(1, heatProgress > 0.65 ? 2 : 1);
    const right = new Phaser.Math.Vector2(forward.y, -forward.x);

    for (let i = 0; i < sparkCount; i += 1) {
      const lateral = Phaser.Math.FloatBetween(-14, 14);
      const retreat = Phaser.Math.FloatBetween(6, 22);
      const spark = this.add.circle(x + right.x * lateral, y + right.y * lateral, Phaser.Math.FloatBetween(1.2, 2.6), 0xf2fbff, 0.76);

      spark.setDepth(BEAM_RENDER_DEPTH + 0.15).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: spark.x - forward.x * retreat + right.x * Phaser.Math.FloatBetween(-10, 10),
        y: spark.y - forward.y * retreat + right.y * Phaser.Math.FloatBetween(-10, 10),
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(90, 150),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private emitBeamContactSpark(
    body: Phaser.GameObjects.Container,
    radius: number,
    beam: ResolvedBeamWeaponStats,
    activeRange: number,
    heatProgress: number,
    time: number
  ): void {
    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(forward.y, -forward.x);
    const contact = this.getBeamContactPoint(body, radius, activeRange);
    const flashRadius = Math.max(3, Math.min(11, beam.width * 0.42 + radius * 0.08));
    const flash = this.add.circle(contact.x, contact.y, flashRadius, 0xf2fbff, 0.62);
    const sparkCount = Phaser.Math.Between(3, heatProgress > 0.65 ? 6 : 5);

    flash.setDepth(BEAM_RENDER_DEPTH + 0.18).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.7,
      duration: 90,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    for (let i = 0; i < sparkCount; i += 1) {
      const retreat = Phaser.Math.FloatBetween(10, 30);
      const lateral = Phaser.Math.FloatBetween(-22, 22);
      const outward = Phaser.Math.FloatBetween(-5, 10);
      const spark = this.add.circle(
        contact.x + right.x * Phaser.Math.FloatBetween(-3, 3),
        contact.y + right.y * Phaser.Math.FloatBetween(-3, 3),
        Phaser.Math.FloatBetween(1.1, 2.7),
        Phaser.Utils.Array.GetRandom([0xf2fbff, 0x9fffe0, 0xffd166]),
        0.84
      );

      spark.setDepth(BEAM_RENDER_DEPTH + 0.2).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: spark.x - forward.x * retreat + right.x * lateral,
        y: spark.y - forward.y * retreat + right.y * lateral + outward,
        alpha: 0,
        scale: 0.18,
        duration: Phaser.Math.Between(95, 170) + Math.round(heatProgress * 35) + Math.round(time % 19),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private getBeamContactPoint(body: Phaser.GameObjects.Container, radius: number, activeRange: number): Phaser.Math.Vector2 {
    const forward = this.getForwardDirection(this.player.rotation);
    const offset = this.getWrappedDirection(this.player.x, this.player.y, body.x, body.y);
    const projection = Phaser.Math.Clamp(offset.dot(forward), 0, activeRange);
    const perpendicular = offset.clone().subtract(forward.clone().scale(projection));
    const emitterProjection = Phaser.Math.Clamp(projection - this.getBeamEmitterOffset(), 0, activeRange);
    const emitter = this.getBeamEmitterPosition(forward);
    const contact = new Phaser.Math.Vector2(
      emitter.x + forward.x * emitterProjection,
      emitter.y + forward.y * emitterProjection
    );

    if (perpendicular.lengthSq() > 0.01) {
      const lateralDistance = perpendicular.length();
      perpendicular.normalize().scale(Math.min(radius * 0.55, lateralDistance));
      contact.add(perpendicular);
    }

    return contact;
  }

  private emitBeamOverheatVent(): void {
    const position = this.getNearestWrappedRenderPosition(this.player.x, this.player.y);

    for (let i = 0; i < 16; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(22, 58);
      const spark = this.add.circle(position.x, position.y, Phaser.Math.FloatBetween(1.8, 3.6), Phaser.Utils.Array.GetRandom([0xffc857, 0xff8f4f, 0x69f0ae]), 0.82);

      spark.setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(150, 260),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private getBeamSlotWeapon(slot: WeaponRuntimeSlot): WeaponRegistryEntry | undefined {
    if (slot === 'auto') {
      return this.getActiveAutoWeaponDefinition();
    }

    return slot === 'primary' ? this.getActivePrimaryWeaponDefinition() : this.getActiveSecondaryWeaponDefinition();
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
        this.tryHitWorldEvent(projectile) ||
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
    if (!this.blackHole || !this.isBlackHoleObjectConsumptionEnabled) {
      return;
    }

    this.blackHole.applyProjectileGravity(projectile, deltaSeconds, this.arena, this.getActiveDebugBlackHoleFieldTuning());
  }

  private updateCapturedProjectile(
    projectile: PlayerProjectile | EnemyProjectile,
    deltaSeconds: number,
    mirrorViewRadius: number
  ): boolean {
    if (!this.blackHole || !this.isBlackHoleObjectConsumptionEnabled) {
      return false;
    }

    const isConsumed = this.blackHole.updateCapturedProjectile(projectile, deltaSeconds, this.arena);
    if (isConsumed) {
      this.blackHoleConsumedObjectsThisRun += 1;
    }
    this.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, mirrorViewRadius);

    return isConsumed;
  }

  private flashDamageSprites(...containers: Phaser.GameObjects.Container[]): void {
    this.flashDamageSpritesWithTint(0xffffff, true, ...containers);
  }

  private flashAsteroidDamageSprites(...containers: Phaser.GameObjects.Container[]): void {
    if (!this.debugState.asteroidDamageFlashEnabled) {
      return;
    }

    this.flashDamageSpritesWithTint(0x9aa1a8, false, ...containers);
  }

  private flashDamageSpritesWithTint(tint: number, fill: boolean, ...containers: Phaser.GameObjects.Container[]): void {
    for (const container of containers) {
      if (!container.scene) {
        continue;
      }

      for (const child of container.list) {
        if (child instanceof Phaser.GameObjects.Image) {
          if (fill) {
            child.setTintFill(tint);
          } else {
            child.setTint(tint);
          }

          this.tweens.add({
            targets: child,
            alpha: fill ? 0.9 : 0.82,
            yoyo: true,
            duration: fill ? DAMAGE_FLASH_MS * 0.5 : DAMAGE_FLASH_MS * 0.38,
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

  private emitAsteroidImpactExplosion(
    x: number,
    y: number,
    _tier: AsteroidTier,
    projectileHitRadius = PLAYER_PROJECTILE_HIT_RADIUS
  ): void {
    const effectPosition = this.getNearestWrappedRenderPosition(x, y);
    x = effectPosition.x;
    y = effectPosition.y;
    const impactScale = Phaser.Math.Clamp(projectileHitRadius / PLAYER_PROJECTILE_HIT_RADIUS, 0.75, 2.2);
    const particleCount = Math.round(Phaser.Math.Clamp(8 * impactScale, 7, 16));
    const flashRadius = 14 * impactScale;
    const flash = this.add.circle(x, y, flashRadius, 0xf2fbff, 0.18);
    const ring = this.add.circle(x, y, flashRadius * 0.78, 0xf2fbff, 0);
    const dust = this.add.circle(x, y, 16 * impactScale, 0xc2ad8f, 0.34);

    flash.setDepth(12);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    ring.setStrokeStyle(2, 0xf2fbff, 0.62);
    ring.setDepth(12);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    dust.setDepth(11);

    for (let i = 0; i < particleCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(14, 34) * impactScale;
      const particle = this.add.circle(
        x,
        y,
        Phaser.Math.FloatBetween(2.2, 4.8) * impactScale,
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

  private emitLargeAsteroidBreakupGhost(asteroid: BasicAsteroid, recentDestructionCount: number): void {
    if (
      asteroid.tier < ASTEROID_LARGE_BREAKUP_VISUAL_MIN_TIER ||
      recentDestructionCount > Math.max(2, this.debugState.asteroidFragmentBurstLimit * 2)
    ) {
      return;
    }

    const tierConfig = ASTEROID_TIER_CONFIG[asteroid.tier];
    const position = this.getNearestWrappedRenderPosition(asteroid.body.x, asteroid.body.y);
    const driftSeconds = ASTEROID_BREAKUP_GHOST_MS / 1000;
    const ghost = this.add.image(position.x, position.y, asteroid.variant);

    ghost.setOrigin(0.5, 0.5);
    ghost.setDisplaySize(tierConfig.displaySize, tierConfig.displaySize);
    ghost.setRotation(asteroid.body.rotation);
    ghost.setTint(0x9aa1a8);
    ghost.setAlpha(0.42);
    ghost.setDepth(5.25);

    this.tweens.add({
      targets: ghost,
      x: position.x + asteroid.velocity.x * driftSeconds * 0.38,
      y: position.y + asteroid.velocity.y * driftSeconds * 0.38,
      alpha: 0,
      scaleX: ghost.scaleX * 1.08,
      scaleY: ghost.scaleY * 1.08,
      duration: ASTEROID_BREAKUP_GHOST_MS,
      ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy()
    });
  }

  private animateLargeAsteroidFragmentSpawn(asteroid: BasicAsteroid, parentTier: AsteroidTier): void {
    if (parentTier < ASTEROID_LARGE_BREAKUP_VISUAL_MIN_TIER) {
      return;
    }

    const startScale = parentTier >= 8 ? 0.58 : 0.68;
    const duration = ASTEROID_FRAGMENT_GROW_IN_MS + Math.max(0, parentTier - ASTEROID_LARGE_BREAKUP_VISUAL_MIN_TIER) * 18;

    for (const body of [asteroid.body, asteroid.wrapMirrorBody]) {
      body.setAlpha(0.35);
      body.setScale(startScale);

      this.tweens.add({
        targets: body,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration,
        ease: 'Cubic.easeOut'
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
      const damage = this.rollPlayerDamage(
        projectile.damage * projectile.effects.chainDamageMultiplier,
        projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE
      );
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

      this.damageEnemy(enemy, this.rollPlayerDamage(baseDamage, projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE), 'player', true);
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

      this.damageAsteroid(asteroid, this.rollPlayerDamage(baseDamage, projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE), 'player', true);
      if (asteroid.hp <= 0) {
        this.destroyBasicAsteroidInstance(asteroid);
      } else {
        this.flashAsteroidDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
      }
    }

    for (let i = this.enemyWreckageDebris.length - 1; i >= 0; i -= 1) {
      const debris = this.enemyWreckageDebris[i];
      if (debris.body === sourceKey || !debris.body.scene || this.getWrappedDirection(x, y, debris.body.x, debris.body.y).lengthSq() > radius * radius) {
        continue;
      }

      this.damageDebris(debris, this.rollPlayerDamage(baseDamage, projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE), 'player', true);
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
        const appliedDamage = this.damageEnemy(
          enemy,
          this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy), projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE),
          'player',
          true
        );
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
      const appliedDamage = this.damageEnemy(
        enemy,
        this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy), projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE),
        'player',
        true
      );
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

  private tryHitWorldEvent(projectile: PlayerProjectile): boolean {
    for (const event of this.worldEvents) {
      if (event.status !== 'active' || projectile.piercedTargets.has(event.body)) {
        continue;
      }

      const offset = this.getWrappedDirection(event.body.x, event.body.y, projectile.body.x, projectile.body.y);
      const hitRadius = event.definition.hitRadius + projectile.hitRadius;
      if (offset.lengthSq() > hitRadius * hitRadius) {
        continue;
      }

      projectile.piercedTargets.add(event.body);
      const appliedDamage = this.damageWorldEvent(
        event,
        this.rollPlayerDamage(projectile.damage, projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE)
      );
      const destroyed = event.hp <= 0;
      this.applyPulseProjectileHitEffects(projectile, event.body, projectile.body.x, projectile.body.y, appliedDamage, destroyed);

      if (destroyed) {
        this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
      } else {
        this.flashDamageSprites(event.body, event.wrapMirrorBody);
        this.emitShipBulletImpactExplosion(projectile.body.x, projectile.body.y);
      }

      return true;
    }

    return false;
  }

  private damageWorldEvent(event: WorldEventInstance, damage: number): number {
    if (event.status !== 'active') {
      return 0;
    }

    const appliedDamage = Math.max(1, Math.round(damage));
    event.hp = Math.max(0, event.hp - appliedDamage);
    this.emitFloatingDamageNumber(event.body.x, event.body.y, appliedDamage, 'player');

    if (event.hp <= 0) {
      this.destroyWorldEvent(event);
    }

    return appliedDamage;
  }

  private destroyWorldEvent(event: WorldEventInstance): void {
    if (event.status === 'destroyed') {
      return;
    }

    event.status = 'destroyed';
    event.hp = 0;
    event.body.setAlpha(0.42);
    event.wrapMirrorBody.setAlpha(0.28);
    this.emitWorldEventDestroyedFeedback(event);
    this.dropWorldEventRewards(event);
    const resolution = resolveWorldEventReward(this.progressionState, event.definition);
    this.recordUnlockedRewards(resolution.newlyUnlockedHooks);
    this.updateGameplayHud(this.time.now);
  }

  private emitWorldEventDestroyedFeedback(event: WorldEventInstance): void {
    this.emitLiveEnemyBurst(event.x, event.y, 0xffc857, 28);
    this.emitShipBulletImpactExplosion(event.x, event.y);
    const position = this.getNearestWrappedRenderPosition(event.x, event.y - event.definition.hitRadius);
    const text = this.add
      .text(position.x, position.y, `${event.definition.shortName} destroyed`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#ffc857',
        stroke: '#02040a',
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setDepth(24);

    this.tweens.add({
      targets: text,
      y: position.y - 54,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private dropWorldEventRewards(event: WorldEventInstance): void {
    if (event.rewardDropped) {
      return;
    }

    event.rewardDropped = true;
    const baseVelocity = new Phaser.Math.Vector2(0, 0);
    this.spawnScrapPickup('enemy', event.definition.rewardScrap, event.x, event.y, baseVelocity);

    for (let i = 0; i < event.definition.rewardUpgradeCrates; i += 1) {
      const angle = (Math.PI * 2 * i) / Math.max(1, event.definition.rewardUpgradeCrates);
      const x = wrapCoordinate(event.x + Math.cos(angle) * 84, this.arena.width);
      const y = wrapCoordinate(event.y + Math.sin(angle) * 84, this.arena.height);
      this.spawnRewardPickup('banked-upgrade', 'enemy', 0, x, y, baseVelocity);
    }
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
        const appliedDamage = this.damageEnemy(
          enemy,
          this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy), projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE),
          'player',
          true
        );
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
        const appliedDamage = this.damageEnemy(
          enemy,
          this.rollPlayerDamage(this.getPulseEnemyDamage(projectile, enemy), projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE),
          'player',
          true
        );
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
        const appliedDamage = this.damageDebris(
          debris,
          this.rollPlayerDamage(projectile.damage, projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE),
          'player',
          true
        );
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
      onHit: (asteroid) => {
        const appliedDamage = this.damageAsteroid(
          asteroid,
          this.rollPlayerDamage(projectile.damage, projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE),
          'player',
          true
        );
        const destroyedAsteroid = asteroid.hp <= 0;
        this.applyPulseProjectileHitEffects(projectile, asteroid.body, asteroid.body.x, asteroid.body.y, appliedDamage, destroyedAsteroid);

        if (destroyedAsteroid) {
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier, projectile.hitRadius);
          this.destroyBasicAsteroidInstance(asteroid);
        } else {
          this.flashAsteroidDamageSprites(asteroid.body, asteroid.wrapMirrorBody);
          this.emitAsteroidImpactExplosion(projectile.body.x, projectile.body.y, asteroid.tier, projectile.hitRadius);
          this.applyAsteroidImpact(asteroid, projectile);
        }
      }
    });
  }

  private applyAsteroidImpact(asteroid: BasicAsteroid, projectile: PlayerProjectile): void {
    this.applyAsteroidImpactFromProjectile(asteroid, projectile);
  }

  private applyAsteroidImpactFromProjectile(_asteroid: BasicAsteroid, _projectile: PlayerProjectile | EnemyProjectile): void {}

  private destroyBasicAsteroid(index: number, grantReward = true, shardStyle: DeathShardStyle = 'asteroid'): boolean {
    const asteroid = this.basicAsteroids[index];
    if (!asteroid) {
      return false;
    }

    return this.destroyBasicAsteroidInstance(asteroid, grantReward, shardStyle);
  }

  private destroyBasicAsteroidInstance(
    asteroid: BasicAsteroid,
    grantReward = true,
    shardStyle: DeathShardStyle = 'asteroid'
  ): boolean {
    const index = this.basicAsteroids.indexOf(asteroid);
    if (index < 0 || !asteroid.body.scene) {
      return false;
    }

    const x = asteroid.body.x;
    const y = asteroid.body.y;
    const velocity = asteroid.velocity.clone();
    const destructionCount = this.recordAsteroidDestruction(this.time.now);
    const fragmentTiers = createAsteroidFragmentTiersSystem(asteroid.tier, asteroid.breakupProfile);
    const breakupPlan = this.createAsteroidBreakupPlan(fragmentTiers, destructionCount);

    if (grantReward) {
      this.spawnScrapPickup('asteroid', SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER[asteroid.tier], x, y, velocity);
    }

    this.emitAsteroidBreakupFeedback(x, y, asteroid.tier);
    this.emitLargeAsteroidBreakupGhost(asteroid, destructionCount);
    if (this.shouldEmitAsteroidDeathShards(destructionCount)) {
      this.emitAsteroidDeathShards(asteroid, shardStyle);
    }
    this.markSectorAsteroidDestroyed(asteroid);
    destroyAsteroidRenderObjects(asteroid);
    this.basicAsteroids.splice(index, 1);

    if (breakupPlan.fragmentTiers.length > 0) {
      this.spawnAsteroidFragments(x, y, velocity, asteroid.breakupProfile, breakupPlan.fragmentTiers, asteroid.tier);
    }

    return true;
  }

  private recordAsteroidDestruction(time: number): number {
    const windowStart = time - ASTEROID_FRAGMENT_BURST_WINDOW_MS;
    this.asteroidDestructionHistory = this.asteroidDestructionHistory.filter((destroyedAt) => destroyedAt >= windowStart);
    this.asteroidDestructionHistory.push(time);

    return this.asteroidDestructionHistory.length;
  }

  private createAsteroidBreakupPlan(
    fragmentTiers: AsteroidTier[],
    recentDestructionCount: number
  ): { fragmentTiers: AsteroidTier[] } {
    if (fragmentTiers.length === 0) {
      return { fragmentTiers };
    }

    const activeAfterParent = Math.max(0, this.basicAsteroids.length - 1);
    const hardCap = Math.max(0, this.debugState.asteroidFragmentHardCap);
    const softCap = Math.min(this.debugState.asteroidFragmentSoftCap, hardCap);
    const burstLimit = this.debugState.asteroidFragmentBurstLimit;
    const availableHardSlots = Math.max(0, hardCap - activeAfterParent);
    const isUnderPressure =
      activeAfterParent >= softCap ||
      recentDestructionCount > burstLimit ||
      activeAfterParent + fragmentTiers.length > hardCap;
    const maxSpawnedFragments = isUnderPressure
      ? Math.min(availableHardSlots, ASTEROID_FRAGMENT_PRESSURE_MAX_SPAWNS)
      : Math.min(availableHardSlots, fragmentTiers.length);
    const spawnedFragmentTiers = [...fragmentTiers].sort((a, b) => b - a).slice(0, maxSpawnedFragments);

    return {
      fragmentTiers: spawnedFragmentTiers
    };
  }

  private shouldEmitAsteroidDeathShards(recentDestructionCount: number): boolean {
    return (
      recentDestructionCount <= ASTEROID_DEATH_SHARD_BURST_LIMIT &&
      this.basicAsteroids.length < Math.min(this.debugState.asteroidFragmentSoftCap, this.debugState.asteroidFragmentHardCap) &&
      this.deathShards.length < DEATH_SHARD_MAX_ACTIVE * 0.75
    );
  }

  private consumeBasicAsteroid(index: number): void {
    const asteroid = this.basicAsteroids[index];

    this.emitAsteroidDeathShards(asteroid, 'blackHoleAsteroid');
    this.markSectorAsteroidDestroyed(asteroid);
    destroyAsteroidRenderObjects(asteroid);
    this.basicAsteroids.splice(index, 1);
  }

  private clearAsteroids(): void {
    for (const asteroid of this.basicAsteroids) {
      this.markSectorAsteroidDestroyed(asteroid);
    }

    this.basicAsteroids = clearBasicAsteroidsSystem(this.basicAsteroids);
    this.activeSectorAsteroids.clear();
    this.asteroidCameraViewCount = 0;
    this.asteroidWrappedViewCount = 0;
    this.asteroidWrapMirrorCount = 0;
    this.asteroidDestructionHistory = [];
    this.nextAsteroidCoalesceAt = 0;
  }

  private spawnAsteroidFragments(
    x: number,
    y: number,
    parentVelocity: Phaser.Math.Vector2,
    breakupProfile: AsteroidBreakupProfile,
    fragmentTiers: AsteroidTier[],
    parentTier: AsteroidTier
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
      createAsteroidInstance: (fragmentX, fragmentY, tier, velocity) => {
        const fragment = this.createAsteroidInstance(fragmentX, fragmentY, tier, velocity);
        fragment.collisionInvulnerableUntil = this.time.now + ASTEROID_FRAGMENT_COLLISION_GRACE_MS;
        this.animateLargeAsteroidFragmentSpawn(fragment, parentTier);
        return fragment;
      }
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
      basicEnemies: [],
      shooterEnemies: [],
      tankEnemies: [],
      liveEnemies: this.liveEnemies,
      basicAsteroids: this.basicAsteroids,
      enemyWreckageDebris: this.enemyWreckageDebris,
      scrapPickups: this.scrapPickups,
      blackHole: this.blackHole,
      playerProjectiles: this.playerProjectiles,
      enemyProjectiles: this.enemyProjectiles
    };
  }

  private updateMinimap(): void {
    this.minimap.update(this.getMinimapSnapshot());
  }

  private getMinimapSnapshot(): MinimapSnapshot {
    const camera = this.cameras.main;
    const scannerSnapshot = getSectorScannerSnapshot(
      this.sectorScannerRuntime,
      this.progressionState.sectorScannerLevel,
      isSectorScannerAvailable(this.progressionState)
    );
    const scannerTarget = scannerSnapshot.showMinimap
      ? getSectorScannerTarget(this.sectorScannerRuntime, this.getSectorScannerTargets())
      : undefined;

    return {
      arena: this.arena,
      player: this.player,
      camera: {
        centerX: camera.scrollX + camera.width / 2,
        centerY: camera.scrollY + camera.height / 2,
        width: camera.width,
        height: camera.height
      },
      missionObjective: this.missionRuntime
        ? {
            x: this.missionRuntime.objective.x,
            y: this.missionRuntime.objective.y,
            radius: this.missionRuntime.objective.radius,
            status: this.missionRuntime.status
          }
        : undefined,
      worldEvents: this.worldEvents.map((event) => ({
        x: event.x,
        y: event.y,
        radius: event.definition.hitRadius,
        dangerRadius: event.definition.dangerRadius,
        status: event.status
      })),
      rareEvents: createRareEventMinimapMarkers(this.rareEvents),
      scannerTarget,
      isUpgradeOverlayOpen: this.isUpgradeOverlayOpen,
      basicAsteroids: this.basicAsteroids,
      basicEnemies: [],
      shooterEnemies: [],
      tankEnemies: [],
      liveEnemies: this.liveEnemies,
      scrapPickups: this.scrapPickups,
      blackHole: this.blackHole,
      sectorRegions: this.sectorLayout.regions
    };
  }

  private updateGameplayHud(time: number): void {
    this.gameplayHud.update(this.getGameplayHudSnapshot(time));
    this.updateUpgradeButton();
    this.updateResultsButton();
  }

  private getGameplayHudSnapshot(time: number): GameplayHudSnapshot {
    const status = this.runEndReason === 'eject'
      ? 'EJECTED'
      : this.isPlayerDead
        ? 'CRITICAL'
        : this.fuel <= 0
          ? 'FUEL EMPTY'
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
      fuel: this.fuel,
      maxFuel: RUN_FUEL_MAX,
      fuelProgress: this.fuel / RUN_FUEL_MAX,
      isFuelEmergency: this.fuel <= 0,
      missionName: this.missionRuntime?.definition.shortName ?? this.getSelectedMissionDefinition().shortName,
      missionStatus: this.getMissionHudStatus(),
      missionObjectiveDistance: this.getMissionObjectiveDistance(),
      missionObjectiveRadius: this.missionRuntime?.objective.radius ?? 0,
      runScrapTotal: this.runScrapTotal,
      scrapSpentThisRun: this.runScrapSpent,
      nextRerollCost: this.getNextRerollCost(),
      bankedUpgrades: this.bankedUpgrades,
      sectorScannerStatus: this.getSectorScannerHudStatus(),
      contractStatusLine: this.getContractStatusLine(),
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
          ? 'Left click weapon'
          : 'Right click weapon';

    const resolved = weapon ? this.getResolvedWeaponStats(weapon, slot) : undefined;
    const beamRuntime = weapon?.behaviorType === 'beam' ? this.beamSlots[slot] : undefined;
    const cooldownProgress =
      resolved?.beam && beamRuntime
        ? 1 - beamRuntime.heat / Math.max(1, resolved.beam.heatMax)
        : cooldownMs > 0
          ? 1 - remainingMs / cooldownMs
          : 1;

    return {
      slot,
      weaponId: weapon?.id ?? null,
      title,
      subtitle,
      controlLabel,
      cooldownProgress: Phaser.Math.Clamp(cooldownProgress, 0, 1),
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
      const variance = projectile.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE;
      lines.push(
        '',
        'Offense',
        `Damage: ${Math.floor(projectile.damage * variance.min)}-${Math.ceil(projectile.damage * variance.max)}`,
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
        `Guard: ${Math.round(shield.guardDamage)}  Bash: ${Math.round(shield.bashDamage)}`,
        `Knockback: ${Math.round(shield.knockback)}`,
        `Dash: ${Math.round(shield.dashDistance)} in ${shield.dashDurationSeconds.toFixed(2)}s`,
        `Cooldown: ${(shield.contactCooldownMs / 1000).toFixed(2)}s`
      );
    }

    if (resolved.beam) {
      const beam = resolved.beam;
      const runtime = this.beamSlots[slot];
      const variance = beam.damageVariance ?? PLAYER_WEAPON_DAMAGE_VARIANCE;
      lines.push(
        '',
        'Beam',
        `Damage/tick: ${Math.floor(beam.tickDamage * variance.min)}-${Math.ceil(beam.tickDamage * variance.max)}`,
        `Tick rate: ${beam.tickRatePerSecond.toFixed(1)}/s`,
        `DPS est.: ${Math.round(beam.tickDamage * beam.tickRatePerSecond)}`,
        `Range: ${Math.round(beam.range)}`,
        `Width: ${Math.round(beam.width)}`,
        `Heat: ${Math.round(runtime.heat)} / ${Math.round(beam.heatMax)}${runtime.overheated ? ' OVERHEATED' : ''}`,
        `Cooling: ${Math.round(beam.coolingPerSecond)}/s`,
        `Overheat vent: ${Math.round(beam.overheatCoolingPerSecond)}/s`
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

    if (weapon.id === 'salvage-beam') {
      return [
        `Beam focus levels: ${this.getRunUpgradeLevelById('beam_focus')}`,
        `Capacitor levels: ${this.getRunUpgradeLevelById('beam_extended_capacitors')}`,
        `Heat sink levels: ${this.getRunUpgradeLevelById('beam_heat_sinks')}`,
        `Vent cycle levels: ${this.getRunUpgradeLevelById('beam_vent_cycle')}`,
        `Lens levels: ${this.getRunUpgradeLevelById('beam_long_lens')}`
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
      ? `Spawn director: minute ${this.getEnemySpawnDifficultyStep(time)} / active ${this.getActiveEnemyCount()} of ${this.getEnemySpawnMaxActiveEnemies(time)} / next ${(Math.max(0, this.nextEnemySpawnAt - time) / 1000).toFixed(1)}s / encounter ${(Math.max(0, this.encounterDirectorState.nextEncounterAt - time) / 1000).toFixed(1)}s\n` +
        `Enemy scaling: HP x${enemyScaling.hpMultiplier.toFixed(2)} / damage x${enemyScaling.damageMultiplier.toFixed(2)}\n`
      : '';
    const debugWeapon = this.getActivePrimaryWeaponDefinition() ?? this.getEffectiveAutoWeaponDefinition() ?? getWeaponDefinition('pulse-cannon');
    const debugWeaponLine = this.debugState.collisionDebugEnabled
      ? `Debug weapon: ${debugWeapon.displayName} dmg x${this.debugState.weaponDamageMultiplier.toFixed(1)} / fire x${this.debugState.weaponFireRateMultiplier.toFixed(1)} / cooldown ${(this.getWeaponSlotCooldownMs(debugWeapon, debugWeapon.id === this.playerWeapons.activePrimaryWeaponId ? 'primary' : 'auto') / 1000).toFixed(2)}s\n` +
        `Debug weapon tuning: Z menu\n`
      : '';
    const blackHoleDebugLine = this.debugState.collisionDebugEnabled
      ? `Black hole: visual x${this.debugBlackHoleVisualScale.toFixed(1)} / core x${this.debugBlackHoleCoreScale.toFixed(1)} / field x${this.debugBlackHoleInfluenceRadiusScale.toFixed(1)}\n`
      : '';

    this.debugText.setText(
      `FPS: ${fps}\n` +
        `Viewport: ${viewportWidth} x ${viewportHeight}\n` +
        `Arena: ${this.arena.width} x ${this.arena.height} / sector ${this.sectorScale}x\n` +
        `Sector: ${this.sectorSeed} / regions ${this.sectorLayout.regions.length} / active ${this.activeSectorAsteroids.size}/${this.sectorAsteroidSpawns.length} asteroids, ${this.activeSectorScrapPickups.size}/${this.sectorScrapSpawns.length} scrap, ${this.activeSectorSignals.size}/${this.sectorSignalSpawns.length} signals\n` +
        `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)} (wrapped)\n` +
        `Hull: ${this.playerHull} / ${this.getPlayerMaxHull()}${this.isPlayerDead ? ' (dead)' : ''}\n` +
        `Fuel: ${Math.ceil(this.fuel)} / ${RUN_FUEL_MAX}, drain ${this.debugFuelDrainEnabled ? this.debugFuelDrainMode : 'paused'}\n` +
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
        `Enemies: ${this.liveEnemies.length} live (${this.getLiveEnemyLegacyCount('chaser')} chaser / ${this.getLiveEnemyLegacyCount('shooter')} shooter / ${this.getLiveEnemyLegacyCount('tank')} tank)\n` +
        `World squads: ${this.worldSquads.filter((squad) => squad.state === 'pursue').length}/${this.worldSquads.length} active, ${this.worldSquads.filter((squad) => squad.state === 'defeated').length} defeated\n` +
        `World events: ${this.worldEvents.filter((event) => event.status === 'active').length}/${this.worldEvents.length} active\n` +
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
    if (this.gameFlowState === 'splash') {
      this.showSplashScreen();
      return;
    }

    if (this.gameFlowState === 'command') {
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

    if (this.gameFlowState === 'settings') {
      this.showSettings();
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

function cloneWeaponLoadout(loadout: WeaponLoadoutState): WeaponLoadoutState {
  return {
    primary: [...loadout.primary],
    secondary: [...loadout.secondary],
    auto: [...loadout.auto]
  };
}

function removeWeaponFromLoadout(loadout: WeaponLoadoutState, weaponId: WeaponId): void {
  for (const slot of ['primary', 'secondary', 'auto'] as WeaponSlotType[]) {
    for (let index = 0; index < loadout[slot].length; index += 1) {
      if (loadout[slot][index] === weaponId) {
        loadout[slot][index] = null;
      }
    }
  }
}

