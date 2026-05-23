import type { ArenaSize } from '../core/arena';
import type { WeaponRegistryEntry } from '../data/weapons';
import type { AutoRunDiagnosticsRunState } from './autoRunDiagnostics';
import type { BlackHoleSystem } from './blackHole';
import type { CollisionDebugOverlaySnapshot } from './collisionDebugOverlay';
import type { EnemyLabInstance } from './enemyLabSpawner';
import type { GameplayHudSnapshot, WeaponHotbarSlotSnapshot } from './gameplayHud';
import type { MinimapCapabilities, MinimapSnapshot } from './minimap';
import type { PerformanceProfilerCounts, PerformanceProfilerFlags } from './performanceProfiler';
import type { RammingShieldCollider } from './rammingShield';
import type { RareEventMinimapMarker } from './rareEventRuntime';
import type { SectorRegion } from './sectorGeneration';
import type { SectorScannerTarget } from './sectorScanner';
import type {
  BasicAsteroid,
  EnemyProjectile,
  EnemyWreckageDebris,
  GameFlowState,
  PlayerProjectile,
  ScrapPickup
} from '../scenes/gameTypes';

export interface PerformanceProfilerCountsInput {
  chasers: number;
  shooters: number;
  tanks: number;
  asteroidCount: number;
  debrisCount: number;
  scrapCount: number;
  playerProjectileCount: number;
  enemyProjectileCount: number;
  deathShardCount: number;
}

export interface PerformanceProfilerFlagsInput {
  flowState: GameFlowState;
  debugMenuOpen: boolean;
  debugPaused: boolean;
  upgradeOverlayOpen: boolean;
  collisionDebugEnabled: boolean;
  blackHoleActive: boolean;
}

export interface AutoRunDiagnosticsSnapshotInput {
  selectedShipName: string;
  runTimeSeconds: number;
  playerHull: number;
  playerMaxHull: number;
  playerXp: number;
  bankedUpgrades: number;
  runScrapTotal: number;
  totalCredits: number;
  activeWeaponName: string;
  mainWeaponUpgradeSummary: string;
  counts: PerformanceProfilerCounts;
}

export interface CollisionDebugOverlaySnapshotInput {
  arena: ArenaSize;
  collisionDebugEnabled: boolean;
  showBlackHoleRadii: boolean;
  player?: Phaser.GameObjects.Container;
  playerHitRadius: number;
  playerCollisionRadius: number;
  enemyCollisionScale: number;
  asteroidCollisionScale: number;
  debrisCollisionScale: number;
  shieldCollider?: RammingShieldCollider;
  liveEnemies: EnemyLabInstance[];
  basicAsteroids: BasicAsteroid[];
  enemyWreckageDebris: EnemyWreckageDebris[];
  scrapPickups: ScrapPickup[];
  blackHole?: BlackHoleSystem;
  playerProjectiles: PlayerProjectile[];
  enemyProjectiles: EnemyProjectile[];
}

export interface MinimapSnapshotInput {
  arena: ArenaSize;
  capabilities: MinimapCapabilities;
  player?: Phaser.GameObjects.Container;
  camera: MinimapSnapshot['camera'];
  missionObjective?: MinimapSnapshot['missionObjective'];
  worldEvents?: MinimapSnapshot['worldEvents'];
  rareEvents?: RareEventMinimapMarker[];
  scannerTarget?: SectorScannerTarget;
  isUpgradeOverlayOpen: boolean;
  basicAsteroids: BasicAsteroid[];
  liveEnemies: EnemyLabInstance[];
  scrapPickups: ScrapPickup[];
  blackHole?: BlackHoleSystem;
  sectorRegions?: SectorRegion[];
  sectorSignals?: MinimapSnapshot['sectorSignals'];
}

export interface GameplayHudSnapshotInput {
  timeSeconds: number;
  runEndReason: string;
  isPlayerDead: boolean;
  fuel: number;
  maxFuel: number;
  debugPlayerInvulnerable: boolean;
  playerInvulnerable: boolean;
  playerHull: number;
  maxHull: number;
  playerXp: number;
  nextXpThreshold: number;
  missionName: string;
  missionStatus: string;
  missionObjectiveDistance: number;
  missionObjectiveRadius: number;
  missionDisplayName: string;
  missionObjectiveLabel: string;
  missionDescription: string;
  missionDifficulty: string;
  missionRewardPreview: string;
  runScrapTotal: number;
  scrapSpentThisRun: number;
  nextRerollCost: number;
  bankedUpgrades: number;
  radarStatus: string;
  radarLevel: number;
  sectorScannerStatus: string;
  sectorScannerCompleted: boolean;
  contractStatusLine: string;
  activeWeapon?: WeaponRegistryEntry;
  primaryWeapon?: WeaponRegistryEntry;
  secondaryWeapon?: WeaponRegistryEntry;
  weaponCooldownMs: number;
  weaponRemainingMs: number;
  mainWeaponUpgradeSummary: string;
  hasRammingShield: boolean;
  rammingShieldHp: number;
  rammingShieldMaxHp: number;
  rammingShieldDashCharges: number;
  rammingShieldDashMaxCharges: number;
  isRammingShieldEmpowered: boolean;
  weaponSlots: WeaponHotbarSlotSnapshot[];
}

export function buildPerformanceProfilerCounts(input: PerformanceProfilerCountsInput): PerformanceProfilerCounts {
  return {
    chasers: input.chasers,
    shooters: input.shooters,
    tanks: input.tanks,
    asteroids: input.asteroidCount,
    debris: input.debrisCount,
    scrap: input.scrapCount,
    playerProjectiles: input.playerProjectileCount,
    enemyProjectiles: input.enemyProjectileCount,
    deathShards: input.deathShardCount
  };
}

export function buildPerformanceProfilerFlags(input: PerformanceProfilerFlagsInput): PerformanceProfilerFlags {
  return {
    flowState: input.flowState,
    debugMenuOpen: input.debugMenuOpen,
    debugPaused: input.debugPaused,
    upgradeOverlayOpen: input.upgradeOverlayOpen,
    collisionDebugEnabled: input.collisionDebugEnabled,
    blackHoleActive: input.blackHoleActive
  };
}

export function buildAutoRunDiagnosticsState(input: AutoRunDiagnosticsSnapshotInput): AutoRunDiagnosticsRunState {
  return {
    selectedShipName: input.selectedShipName,
    runTimeSeconds: input.runTimeSeconds,
    playerHull: input.playerHull,
    playerMaxHull: input.playerMaxHull,
    playerXp: input.playerXp,
    bankedUpgrades: input.bankedUpgrades,
    runScrapTotal: input.runScrapTotal,
    totalCredits: input.totalCredits,
    activeWeaponName: input.activeWeaponName,
    mainWeaponUpgradeSummary: input.mainWeaponUpgradeSummary,
    counts: input.counts
  };
}

export function buildCollisionDebugOverlaySnapshot(
  input: CollisionDebugOverlaySnapshotInput
): CollisionDebugOverlaySnapshot {
  return {
    arena: input.arena,
    collisionDebugEnabled: input.collisionDebugEnabled,
    showBlackHoleRadii: input.showBlackHoleRadii,
    player: input.player,
    playerHitRadius: input.playerHitRadius,
    playerCollisionRadius: input.playerCollisionRadius,
    enemyCollisionScale: input.enemyCollisionScale,
    asteroidCollisionScale: input.asteroidCollisionScale,
    debrisCollisionScale: input.debrisCollisionScale,
    shieldCollider: input.shieldCollider,
    basicEnemies: [],
    shooterEnemies: [],
    tankEnemies: [],
    liveEnemies: input.liveEnemies,
    basicAsteroids: input.basicAsteroids,
    enemyWreckageDebris: input.enemyWreckageDebris,
    scrapPickups: input.scrapPickups,
    blackHole: input.blackHole,
    playerProjectiles: input.playerProjectiles,
    enemyProjectiles: input.enemyProjectiles
  };
}

export function buildMinimapSnapshot(input: MinimapSnapshotInput): MinimapSnapshot {
  return {
    arena: input.arena,
    capabilities: input.capabilities,
    player: input.player,
    camera: input.camera,
    missionObjective: input.missionObjective,
    worldEvents: input.worldEvents,
    rareEvents: input.rareEvents,
    scannerTarget: input.scannerTarget,
    isUpgradeOverlayOpen: input.isUpgradeOverlayOpen,
    basicAsteroids: input.basicAsteroids,
    basicEnemies: [],
    shooterEnemies: [],
    tankEnemies: [],
    liveEnemies: input.liveEnemies,
    scrapPickups: input.scrapPickups,
    blackHole: input.blackHole,
    sectorRegions: input.sectorRegions,
    sectorSignals: input.sectorSignals
  };
}

export function buildGameplayHudSnapshot(input: GameplayHudSnapshotInput): GameplayHudSnapshot {
  const status = input.runEndReason === 'eject'
    ? 'EJECTED'
    : input.isPlayerDead
      ? 'CRITICAL'
      : input.fuel <= 0
        ? 'FUEL EMPTY'
        : input.debugPlayerInvulnerable
          ? 'DEBUG INVULN'
          : input.playerInvulnerable
            ? 'HIT'
            : 'STABLE';
  const hullProgress = input.playerHull / input.maxHull;
  const xpProgress = input.nextXpThreshold > 0 ? input.playerXp / input.nextXpThreshold : 0;
  const weaponProgress = input.weaponCooldownMs > 0 ? 1 - input.weaponRemainingMs / input.weaponCooldownMs : 1;
  const weaponStatus = input.weaponRemainingMs <= 0 ? 'Ready' : `Cooling ${Math.ceil(input.weaponRemainingMs / 1000)}s`;
  const missionDanger =
    input.missionStatus === 'ACTIVE' &&
    input.missionObjectiveRadius > 0 &&
    input.missionObjectiveDistance <= input.missionObjectiveRadius * 2.5;

  return {
    timeSeconds: input.timeSeconds,
    playerHull: input.playerHull,
    maxHull: input.maxHull,
    status,
    playerXp: input.playerXp,
    nextXpThreshold: input.nextXpThreshold,
    fuel: input.fuel,
    maxFuel: input.maxFuel,
    fuelProgress: input.fuel / input.maxFuel,
    isFuelEmergency: input.fuel <= 0,
    missionName: input.missionName,
    missionStatus: input.missionStatus,
    missionObjectiveDistance: input.missionObjectiveDistance,
    missionObjectiveRadius: input.missionObjectiveRadius,
    missionDisplayName: input.missionDisplayName,
    missionObjectiveLabel: input.missionObjectiveLabel,
    missionDescription: input.missionDescription,
    missionDifficulty: input.missionDifficulty,
    missionRewardPreview: input.missionRewardPreview,
    runScrapTotal: input.runScrapTotal,
    scrapSpentThisRun: input.scrapSpentThisRun,
    nextRerollCost: input.nextRerollCost,
    bankedUpgrades: input.bankedUpgrades,
    radarStatus: input.radarStatus,
    radarLevel: input.radarLevel,
    sectorScannerStatus: input.sectorScannerStatus,
    sectorScannerCompleted: input.sectorScannerCompleted,
    contractStatusLine: input.contractStatusLine,
    autoWeaponName: input.activeWeapon ? input.activeWeapon.displayName : 'Empty',
    primaryWeaponName: input.primaryWeapon ? input.primaryWeapon.displayName : 'Empty',
    weaponStatus,
    secondaryWeaponName: input.secondaryWeapon ? input.secondaryWeapon.displayName : 'Empty',
    mainWeaponUpgradeSummary: input.mainWeaponUpgradeSummary,
    hullProgress,
    xpProgress,
    weaponProgress,
    isHullCritical: hullProgress <= 0.32,
    isUpgradeReady: input.bankedUpgrades > 0,
    isMissionDanger: missionDanger,
    hasRammingShield: input.hasRammingShield,
    rammingShieldHp: input.rammingShieldHp,
    rammingShieldMaxHp: input.rammingShieldMaxHp,
    rammingShieldDashCharges: input.rammingShieldDashCharges,
    rammingShieldDashMaxCharges: input.rammingShieldDashMaxCharges,
    isRammingShieldEmpowered: input.isRammingShieldEmpowered,
    weaponSlots: input.weaponSlots
  };
}
