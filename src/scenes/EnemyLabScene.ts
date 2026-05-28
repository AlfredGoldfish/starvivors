import Phaser from 'phaser';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { DEFAULT_SHIP_ID, getShipDefinition } from '../data/ships';
import { getForgeAssetDefinition } from '../data/forgeAssetRegistry';
import { VELOCITY_LIMITER_BASE_SPEED } from '../data/permanentUpgrades';
import {
  DEFAULT_ENEMY_VISUAL_SCALE,
  ENEMY_LAB_DEFINITIONS,
  resolveEnemyVisualScale,
  type EnemyLabDefinition
} from '../data/enemyLabDefinitions';
import {
  cloneAttackLoadoutSlots,
  createDefaultAttackLoadoutSlot,
  getDefaultEnemyAttackLoadout,
  getEnemyAttackDefinition,
  getEnemyAttackDefinitions,
  isEnemyAttackId,
  normalizeAttackLoadoutSlots,
  resolveAttackLoadoutSlotParams,
  type AttackLoadoutSlot,
  type AttackTargetKind,
  type EnemyAttackParamValue,
  type EnemyAttackId
} from '../data/enemyAttackDefinitions';
import {
  ASTEROID_TIERS,
  CAMERA_LEAD_LERP,
  CAMERA_LEAD_MAX_DISTANCE,
  CAMERA_LEAD_MIN_SPEED,
  FORWARD_THRUSTER_INTERVAL_MS,
  PLAYER_SHIP_VISUAL_ROTATION,
  SECONDARY_THRUSTER_INTERVAL_MS,
  THRUSTER_FADE_MS
} from './gameConstants';
import { StarfieldSystem } from '../systems/starfield';
import {
  applyPlayerFlightAcceleration,
  dampPlayerFlightVelocity,
  integratePlayerFlightPosition,
  resolvePlayerFlightControls,
  updatePlayerFacingFromPointer,
  updatePlayerFlightCameraLead,
  wrapPlayerFlightPosition,
  type PlayerFlightStats
} from '../systems/playerFlight';
import { createEnemyLabVisualContainer, createEnemyLabVisualTextures } from '../systems/enemyVisuals';
import {
  emitEffectLineSweep,
  emitEffectMuzzleFlash,
  emitEffectOutlineFlash,
  emitEffectRingPulse,
  emitEffectShardBurst,
  emitEffectSparkBurst,
  emitEffectSupportAura,
  emitEffectTrailTick,
  emitEffectWarningBeam,
  emitEffectWarningRadius,
  resolveEnemyLabEffectColor,
  type EnemyLabReadabilityMode
} from '../systems/enemyLabEffects';
import { normalizeEnemyEffectEntry } from '../systems/enemyVectorRecipes';
import {
  createPlayerShipMonochromeTextures,
  getPlayerShipMonochromeTextureKey,
  resolveShipObjectSizeProfile
} from '../systems/playerShipVisuals';
import {
  ASTEROID_VISUAL_FAMILIES,
  createMonochromeAsteroidTexture,
  getMonochromeAsteroidTextureKey,
  resolveAsteroidObjectSizeProfile
} from '../systems/asteroidVisuals';
import {
  getWrappedDirection,
  updateEnemyLabAi,
  type EnemyLabProjectileRequest,
  type EnemyLabScrapTarget
} from '../systems/enemyLabAi';
import {
  createAttackHostRuntime,
  getEnabledAttackSlotIndices,
  queueAttackSlot,
  replaceAttackHostRuntimeLoadout,
  resolveRuntimeEffectRecipe,
  resolveRuntimeTelegraphRecipe,
  updateAttackHostRuntime,
  type AttackAreaDamageRequest,
  type AttackBuffRequest,
  type AttackHealRequest,
  type AttackHostRuntime,
  type AttackProjectileRequest,
  type AttackScrapStealRequest,
  type AttackShieldRequest,
  type AttackStatusRequest,
  type AttackSummonRequest,
  type AttackTargetSnapshot,
  type AttackVisualRequest
} from '../systems/enemyAttackRuntime';
import {
  applyPlayerStatusEffects,
  createPlayerStatusEffectRuntime,
  getActivePlayerStatusKinds,
  resolvePlayerStatusMovementModifiers,
  updatePlayerStatusEffects,
  type EnemyStatusEffect,
  type PlayerStatusEffectRuntime
} from '../systems/playerStatusEffects';
import {
  clearEnemyLabEnemies,
  destroyEnemyLabEnemy,
  getEnemyLabDefinitions,
  getEnemyLabSquads,
  setEnemyLabDebugLabels,
  spawnEnemyLabEnemy,
  type EnemyLabInstance
} from '../systems/enemyLabSpawner';
import { downloadTextFile, getTimestampSlug, loadMarkdownFile, openDesktopDataFolder } from '../systems/debug/debugPersistence';
import { isDesktopRuntime } from '../systems/desktopBridge';
import {
  ENEMY_LAB_ASSET_STATUSES,
  ENEMY_LAB_QUICK_TAGS,
  applyVariantToDefinition,
  convertBuiltInSquadToPreset,
  createEmptySquadPreset,
  createEnemyLabAiBriefMarkdown,
  createEnemyLabPromotionMarkdown,
  createEnemySquadMarkdown,
  createEnemyVariantMarkdown,
  createInitialEnemyLabStorageState,
  createVariantFromDefinition,
  duplicateVariant,
  loadEnemyLabStorageState,
  parseEnemyLabPresetMarkdown,
  parseEnemySquadPresetMarkdown,
  parseEnemyVariantPresetMarkdown,
  saveEnemyLabStorageState,
  slugify,
  type EnemyLabAssetStatus,
  type EnemyLabSquadPreset,
  type EnemyLabSquadPresetEntry,
  type EnemyLabStorageState,
  type EnemyLabVariantPreset
} from '../systems/enemyLabPresets';
import {
  createEnemyLabAttackLoadoutMarkdown,
  createEnemyLabAttackLoadoutPreset,
  createEnemyLabAttackTestMarkdown,
  createEnemyLabAttackTestPreset,
  parseEnemyLabAttackLoadoutMarkdown,
  parseEnemyLabAttackTestMarkdown
} from '../systems/enemyLabAttackPresets';
import {
  FORGE_ASSET_STATUSES,
  FORGE_STYLE_GUIDE_VERSION,
  convertEnemyVisualDefinitionToForgeAsset,
  createForgeAiTask,
  createForgeAiBrief,
  createForgeAssetTexture,
  createForgeAssetFromTemplate,
  createForgeContactSheetData,
  createForgeRepairPrompt,
  createForgeProductionPromotionBundle,
  createForgeProductionPromotionMarkdown,
  createForgePromotionBundle,
  createForgePromotionMarkdown,
  createForgeVisualAssetId,
  getForgeAssetTemplates,
  getForgeTextureKey,
  getNeonForwardSalvagepunkStyleGuide,
  isForgeAssetApprovedForPromotion,
  loadAssetForgeStorageState,
  parseForgeAssetImport,
  parseForgeAiResponse,
  parseForgeAssetImports,
  renderForgeAssetToSvg,
  saveAssetForgeStorageState,
  validateForgeAssetForAi,
  type ForgeAsset,
  type ForgeAiTaskType,
  type ForgeAssetKind,
  type ForgeAssetTemplateId,
  type ForgePalette,
  type ForgeVectorLayer
} from '../systems/assetForge';

interface EnemyLabProjectile {
  id: string;
  owner: 'player' | 'enemy';
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  damage: number;
  radius: number;
  rangeRemaining: number;
  statuses?: EnemyStatusEffect[];
}

interface EnemyLabScrapProp extends EnemyLabScrapTarget {
  body: Phaser.GameObjects.Arc;
  value: number;
}

interface EnemyLabAttackTestTarget {
  id: string;
  kind: 'dummy' | 'enemy' | 'ally';
  body: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  radius: number;
  hp: number;
  maxHp: number;
}

interface EnemyLabDiagnosticsContext {
  frameId: number;
  timeMs: number;
  deltaMs: number;
  actualFps: number;
  startedAt: number;
  phases: Record<string, number>;
}

interface EnemyLabDiagnosticsFrame {
  frameId: number;
  timeMs: number;
  deltaMs: number;
  actualFps: number;
  totalMs: number;
  phases: Record<string, number>;
  counts: {
    enemies: number;
    projectiles: number;
    collisionDebugCircles: number;
  };
  resizeCount: number;
  lastResizeAgoMs: number | null;
  overlayCollapsed: boolean;
  simulationPaused: boolean;
  documentVisible: boolean;
  documentHasFocus: boolean;
  viewport: {
    scaleWidth: number;
    scaleHeight: number;
    windowWidth: number;
    windowHeight: number;
    canvasWidth: number;
    canvasHeight: number;
    devicePixelRatio: number;
  };
  player: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    speed: number;
  };
  camera: {
    scrollX: number;
    scrollY: number;
    width: number;
    height: number;
    followOffsetX: number;
    followOffsetY: number;
  };
  starfield: ReturnType<StarfieldSystem['getDiagnosticsSnapshot']>;
  selectedEnemy?: string;
  selectedVariant?: string;
}

interface EnemyLabOverlayRefs {
  root: HTMLDivElement;
  toggleOverlayButton: HTMLButtonElement;
  forgeAssetSelect: HTMLSelectElement;
  forgeAssetStatus: HTMLSelectElement;
  forgePreviewMode: HTMLSelectElement;
  forgePreview: HTMLDivElement;
  forgeLayerSelect: HTMLSelectElement;
  forgeLayerColor: HTMLSelectElement;
  forgeLayerStrokeColor: HTMLSelectElement;
  forgeLayerAlpha: HTMLInputElement;
  forgeLayerStrokeWidth: HTMLInputElement;
  forgeBatchCount: HTMLInputElement;
  forgeAiTaskType: HTMLSelectElement;
  forgeAiAssetKind: HTMLSelectElement;
  forgeAiTemplate: HTMLSelectElement;
  forgeAiRole: HTMLInputElement;
  forgeAiProductionTarget: HTMLInputElement;
  forgeImportReport: HTMLDivElement;
  forgePaletteInputs: Record<keyof ForgePalette, HTMLInputElement>;
  enemySelect: HTMLSelectElement;
  variantSelect: HTMLSelectElement;
  variantName: HTMLInputElement;
  variantStatus: HTMLSelectElement;
  variantNotes: HTMLTextAreaElement;
  variantTags: HTMLDivElement;
  visualScale: HTMLInputElement;
  scaleX: HTMLInputElement;
  scaleY: HTMLInputElement;
  rotationOffset: HTMLInputElement;
  glowScale: HTMLInputElement;
  statHp: HTMLInputElement;
  statSpeed: HTMLInputElement;
  statRadius: HTMLInputElement;
  statContactDamage: HTMLInputElement;
  behaviorParams: HTMLDivElement;
  attackLoadout: HTMLDivElement;
  attackTesterAttackSelect: HTMLSelectElement;
  attackTesterSlotList: HTMLDivElement;
  attackTesterParams: HTMLDivElement;
  squadSelect: HTMLSelectElement;
  customSquadSelect: HTMLSelectElement;
  squadName: HTMLInputElement;
  squadStatus: HTMLSelectElement;
  squadNotes: HTMLTextAreaElement;
  squadEntries: HTMLDivElement;
  spawnCount: HTMLInputElement;
  speedMultiplier: HTMLInputElement;
  hpMultiplier: HTMLInputElement;
  fireRateMultiplier: HTMLInputElement;
  deconflictionStrength: HTMLInputElement;
  fps: HTMLDivElement;
  status: HTMLDivElement;
}

const PLAYER_LAB_HULL = 100;
const PLAYER_LAB_HIT_RADIUS = 32;
const PLAYER_PROJECTILE_COOLDOWN_MS = 150;
const PLAYER_PROJECTILE_SPEED = 900;
const PLAYER_PROJECTILE_RANGE = 1100;
const PLAYER_PROJECTILE_DAMAGE = 18;
const LAB_PLAYER_SHIP = getShipDefinition(DEFAULT_SHIP_ID);
const LAB_DIAGNOSTICS_FRAME_LIMIT = 900;
const FORGE_PALETTE_KEYS: Array<keyof ForgePalette> = [
  'metalDark',
  'metalWarm',
  'neonPrimary',
  'neonSecondary',
  'warning',
  'outline',
  'white'
];
const FORGE_COLOR_OPTIONS: Array<keyof ForgePalette> = [...FORGE_PALETTE_KEYS];
const FORGE_ASSET_KIND_OPTIONS: ForgeAssetKind[] = ['enemy', 'ship', 'weapon', 'projectile', 'beam', 'effect', 'pickup', 'ui-icon', 'radar-icon', 'telegraph'];
const FORGE_AI_TASK_OPTIONS: ForgeAiTaskType[] = ['generate', 'batch', 'revise', 'repair', 'promotion-prep'];
const PROTOTYPE_ENEMY_SAMPLE_IDS = [
  'ambusher-mine',
  'berserker',
  'orbiter',
  'patrol-guard',
  'frost-gunner',
  'electric-leech',
  'combat-summoner',
  'scrap-thief',
  'impact-bomber',
  'spawner-nest'
];
type ForgePreviewMode = 'combat' | 'projectile-motion' | 'weapon-icon' | 'minimap' | 'silhouette' | 'starfield' | 'hit-radius';
type EnemyLabMode = 'basic' | 'squads' | 'attack-tester' | 'stress' | 'presets';
type AttackLoadoutEditorScope = 'basic' | 'attackTester' | 'squad';
type EnemyLabPresetFolderCategory = 'variants' | 'squads' | 'loadouts' | 'attack-tests';
type EnemyLabPreviewState = 'idle' | 'pursue' | 'telegraph' | 'attack' | 'hit' | 'death';
type EnemyLabClutterTest = 'single' | 'squad' | 'swarm' | 'bullets' | 'asteroids' | 'asteroidGallery' | 'debris' | 'stress';
type EnemyLabPhase6HarnessView = 'basic' | 'squads' | 'player-test' | 'stress-high-contrast';

const PHASE6_READY_ATTACK_BATCHES = new Set(['A', 'B', 'C']);
const PHASE6_DEFAULT_LOADOUT_HOSTS: Array<{
  definitionId: string;
  expectedAttackId: EnemyAttackId;
  batch: 'A' | 'B' | 'C';
}> = [
  { definitionId: 'needle-sniper', expectedAttackId: 'rail-line', batch: 'A' },
  { definitionId: 'carrier', expectedAttackId: 'summon-glyphs', batch: 'A' },
  { definitionId: 'shield-frigate', expectedAttackId: 'shield-wall', batch: 'B' },
  { definitionId: 'repair-skiff', expectedAttackId: 'healing-beam', batch: 'B' },
  { definitionId: 'ambusher-mine', expectedAttackId: 'mine-reveal', batch: 'C' },
  { definitionId: 'patrol-guard', expectedAttackId: 'alarm-ping', batch: 'C' },
  { definitionId: 'berserker', expectedAttackId: 'berserker-shockwave', batch: 'C' }
];

const PHASE6_HARNESS_QUERY_TO_VIEW: Record<string, EnemyLabPhase6HarnessView> = {
  enemyLabPhase6Basic: 'basic',
  enemyLabPhase6Squads: 'squads',
  enemyLabPhase6PlayerTest: 'player-test',
  enemyLabPhase6StressHighContrast: 'stress-high-contrast'
};

export class EnemyLabScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private starfield!: StarfieldSystem;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private playerStatusRuntime: PlayerStatusEffectRuntime = createPlayerStatusEffectRuntime();
  private playerStatusOverlay?: Phaser.GameObjects.Graphics;
  private cameraLead = new Phaser.Math.Vector2(0, 0);
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies: EnemyLabInstance[] = [];
  private projectiles: EnemyLabProjectile[] = [];
  private previewBodies: Phaser.GameObjects.Container[] = [];
  private testProps: Phaser.GameObjects.GameObject[] = [];
  private attackTestTargets: EnemyLabAttackTestTarget[] = [];
  private labScrapProps: EnemyLabScrapProp[] = [];
  private overlay?: EnemyLabOverlayRefs;
  private presetState: EnemyLabStorageState = createInitialEnemyLabStorageState();
  private labMode: EnemyLabMode = 'basic';
  private readabilityMode: EnemyLabReadabilityMode = 'normal';
  private reducedEffects = false;
  private selectedEnemyIndex = 0;
  private selectedVariantId = '';
  private selectedForgeAssetId = '';
  private selectedForgeLayerIndex = 0;
  private selectedAttackTestId: EnemyAttackId = 'rail-line';
  private basicLoadoutDraftsByEnemyId: Record<string, AttackLoadoutSlot[]> = {};
  private selectedBasicLoadoutSlotIndex = 0;
  private attackTesterSlots: AttackLoadoutSlot[] = [createDefaultAttackLoadoutSlot('rail-line')];
  private attackTesterRuntime?: AttackHostRuntime;
  private attackTesterRuntimeSignature = '';
  private attackTesterAutoCycleEnabled = false;
  private nextAttackTesterAutoCycleAt = 0;
  private selectedAttackTesterSlotIndex = 0;
  private selectedSquadLoadoutSlotIndex = 0;
  private forgePreviewMode: ForgePreviewMode = 'combat';
  private forgeBatchCount = 8;
  private forgeAiTaskType: ForgeAiTaskType = 'batch';
  private forgeAiAssetKind: ForgeAssetKind = 'projectile';
  private forgeAiTemplateId: ForgeAssetTemplateId = 'projectile.neon-bolt';
  private forgeAiRole = 'neon-bolt';
  private forgeAiProductionTarget = '';
  private lastForgeValidationReport = 'No AI validation report yet.';
  private lastForgeRepairPrompt = '';
  private selectedSquadIndex = 0;
  private selectedCustomSquadId = '';
  private selectedSquadEntryIndex = -1;
  private spawnCount = 1;
  private enemySpeedMultiplier = 1;
  private enemyHpMultiplier = 1;
  private enemyFireRateMultiplier = 1;
  private enemyDeconflictionEnabled = true;
  private enemyDeconflictionStrength = 1;
  private enemyCollisionDebugEnabled = false;
  private isAiEnabled = true;
  private isPlayerInvulnerable = true;
  private showDebugLabels = true;
  private showTelegraphs = true;
  private isOverlayCollapsed = false;
  private isPointerOverControlPanel = false;
  private isSimulationPaused = false;
  private playerHull = PLAYER_LAB_HULL;
  private nextPlayerFireAt = 0;
  private nextAttackTestTargetId = 1;
  private nextForwardThrusterAt = 0;
  private nextReverseThrusterAt = 0;
  private nextLeftStrafeThrusterAt = 0;
  private nextRightStrafeThrusterAt = 0;
  private nextProjectileId = 1;
  private nextOverlayStatusUpdateAt = 0;
  private lastOverlayStatusText = '';
  private nextFpsMeterUpdateAt = 0;
  private fpsFrameCount = 0;
  private fpsDeltaTotal = 0;
  private fpsWorstDelta = 0;
  private fpsSampleStartedAt = 0;
  private delayedSquadSpawns: Phaser.Time.TimerEvent[] = [];
  private diagnosticsFrameId = 1;
  private diagnosticsFrames: EnemyLabDiagnosticsFrame[] = [];
  private resizeEventCount = 0;
  private lastResizeAt = 0;
  private lastDiagnosticsExportPath = '';
  private collisionDebugCircles = new Map<string, Phaser.GameObjects.Arc>();

  constructor() {
    super('EnemyLabScene');
  }

  preload(): void {}

  create(): void {
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.starfield = new StarfieldSystem({
      scene: this,
      getWrappedDirection: (fromX, fromY, toX, toY) => this.getWrappedDirection(fromX, fromY, toX, toY)
    });
    this.starfield.createTextures();
    this.starfield.create();
    createPlayerShipMonochromeTextures(this, [LAB_PLAYER_SHIP]);
    createEnemyLabVisualTextures(this, ENEMY_LAB_DEFINITIONS);

    this.player = this.createPlayerShip(center.x, center.y);
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setFollowOffset(0, 0);
    this.cameras.main.centerOn(center.x, center.y);
    this.resetBackgroundPlayerTracking();

    this.presetState = loadEnemyLabStorageState();
    this.presetState.forgeAssets = [
      ...this.presetState.forgeAssets,
      ...loadAssetForgeStorageState().assets.filter(
        (asset) => !this.presetState.forgeAssets.some((candidate) => candidate.id === asset.id)
      )
    ];
    this.createInput();
    this.createOverlay();
    this.runEnemyLabSmokeHarnessIfRequested();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      for (const delayedSpawn of this.delayedSquadSpawns) {
        delayedSpawn.remove(false);
      }
      this.delayedSquadSpawns = [];
      this.clearPreviewBodies();
      this.clearAttackTests();
      this.clearEnemyCollisionDebug();
      this.overlay?.root.remove();
      this.overlay = undefined;
    });
  }

  update(time: number, delta: number): void {
    const diagnostics = this.beginDiagnosticsFrame(time, delta);
    const deltaSeconds = Math.min(delta / 1000, 0.05);

    try {
      this.measureDiagnosticsPhase(diagnostics, 'shortcuts', () => this.handleShortcuts());
      this.measureDiagnosticsPhase(diagnostics, 'fps-meter', () => this.updateFpsMeter(time, delta));
      this.measureDiagnosticsPhase(diagnostics, 'overlay-status', () => this.updateOverlayStatus(time));

      if (this.isSimulationPaused) {
        return;
      }

      this.measureDiagnosticsPhase(diagnostics, 'player-status', () => this.updatePlayerStatuses(time));
      this.measureDiagnosticsPhase(diagnostics, 'player-movement', () => this.updatePlayerMovement(time, deltaSeconds));
      this.measureDiagnosticsPhase(diagnostics, 'player-wrap', () => this.wrapPlayer());
      this.measureDiagnosticsPhase(diagnostics, 'camera-lead', () => this.updateCameraLead());
      this.measureDiagnosticsPhase(diagnostics, 'player-firing', () => this.updatePlayerFiring(time));
      this.measureDiagnosticsPhase(diagnostics, 'projectiles', () => this.updateProjectiles(time, deltaSeconds));
      this.measureDiagnosticsPhase(diagnostics, 'attack-tester', () => this.updateAttackTesterRuntime(time, deltaSeconds));

      this.measureDiagnosticsPhase(diagnostics, 'enemy-ai', () =>
        updateEnemyLabAi({
          scene: this,
          arena: this.arena,
          enemies: this.enemies,
          scrapPickups: this.labScrapProps,
          playerX: this.player.x,
          playerY: this.player.y,
          playerVelocity: this.playerVelocity,
          time,
          deltaSeconds,
          isAiEnabled: this.isAiEnabled,
          telegraphsEnabled: this.showTelegraphs,
          enemySpeedMultiplier: this.enemySpeedMultiplier,
          enemyFireRateMultiplier: this.enemyFireRateMultiplier,
          enemyDeconflictionEnabled: this.enemyDeconflictionEnabled,
          enemyDeconflictionStrength: this.enemyDeconflictionStrength,
          updateToroidalRenderMirror: (body, wrapMirrorBody, viewRadius) =>
            this.updateToroidalRenderMirror(body, wrapMirrorBody, viewRadius),
          fireEnemyProjectile: (request) => this.fireEnemyProjectile(request),
          explodeAt: (x, y, radius, damage, sourceId) => this.explodeAt(x, y, radius, damage, sourceId),
          spawnChild: (definitionId, x, y) => this.spawnEnemy(definitionId, x, y),
          stealScrap: (target) => this.stealLabScrap(target),
          emitLabBurst: (x, y, color, count) => this.emitLabBurst(x, y, color, count)
        })
      );
      this.measureDiagnosticsPhase(diagnostics, 'enemy-attacks', () => this.updateEnemyAttackRuntimes(time, deltaSeconds));

      this.measureDiagnosticsPhase(diagnostics, 'enemy-contacts', () => this.updateEnemyContacts(time));
      this.measureDiagnosticsPhase(diagnostics, 'enemy-cleanup', () => this.removeDeadEnemies());
      this.measureDiagnosticsPhase(diagnostics, 'enemy-effects', () => this.updateEnemyMovementEffects(time));
      this.measureDiagnosticsPhase(diagnostics, 'status-vfx', () => this.updatePlayerStatusOverlay(time));
      this.measureDiagnosticsPhase(diagnostics, 'collision-debug', () => this.updateEnemyCollisionDebug());
      this.measureDiagnosticsPhase(diagnostics, 'starfield', () => this.updateBackgroundTiles(time));
    } finally {
      this.endDiagnosticsFrame(diagnostics);
    }
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for EnemyLabScene.');
    }

    this.input.mouse?.disableContextMenu();
    this.input.keyboard.addCapture('SPACE');
    this.keys = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      upAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      downAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      leftAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      rightAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      clear: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      formation: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
      ai: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      labels: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      telegraphs: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      pause: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      overlay: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
      prev: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET),
      next: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET)
    };

    for (let index = 0; index < 10; index += 1) {
      this.keys[`digit${index}`] = this.input.keyboard.addKey(
        index === 0 ? Phaser.Input.Keyboard.KeyCodes.ZERO : Phaser.Input.Keyboard.KeyCodes.ONE + index - 1
      );
    }
  }

  private runEnemyLabSmokeHarnessIfRequested(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const harness = new URLSearchParams(window.location.search).get('testHarness');
    const phase6HarnessView = harness ? PHASE6_HARNESS_QUERY_TO_VIEW[harness] : undefined;
    if (
      harness !== 'enemyLabMonochrome' &&
      harness !== 'enemyLabVector' &&
      harness !== 'enemyLabPrototype' &&
      harness !== 'enemyLabAttacks' &&
      harness !== 'smoke' &&
      !phase6HarnessView
    ) {
      return;
    }

    if (phase6HarnessView) {
      this.runEnemyLabPhase6ScreenshotHarness(phase6HarnessView);
      return;
    }

    if (harness === 'enemyLabAttacks') {
      this.runEnemyLabAttackSmokeHarness();
      return;
    }

    this.setLabMode('stress');
    this.spawnClutterTest('asteroidGallery');
    this.spawnProjectileClutter(8);
    if (harness === 'enemyLabPrototype') {
      this.spawnPrototypeHarnessSamples();
      this.spawnLabScrapProps(8);
    } else {
      this.previewEnemyState('idle');
      this.previewEnemyState('telegraph');
    }
    this.syncOverlayFromState();
    if (harness === 'enemyLabPrototype') {
      this.setOverlayCollapsed(true);
    }
    const scaleX = this.overlay?.scaleX.value ?? '';
    const scaleY = this.overlay?.scaleY.value ?? '';
    const scalePass = scaleX === String(DEFAULT_ENEMY_VISUAL_SCALE) && scaleY === String(DEFAULT_ENEMY_VISUAL_SCALE);
    document.body.setAttribute('data-starvivors-enemy-lab-harness-details', JSON.stringify({
      scaleX,
      scaleY,
      sampleIds: harness === 'enemyLabPrototype' ? PROTOTYPE_ENEMY_SAMPLE_IDS : undefined,
      asteroidFamilies: harness === 'enemyLabPrototype' ? ASTEROID_VISUAL_FAMILIES.length : undefined
    }));
    document.body.setAttribute('data-starvivors-enemy-lab-harness', scalePass ? 'monochrome-ready' : 'fail');
  }

  private runEnemyLabAttackSmokeHarness(): void {
    const details = this.runPhase6AttackHarnessScenario({
      labMode: 'attack-tester',
      includeMixedSquad: true,
      clearExistingAttackTests: true
    });

    document.body.setAttribute('data-starvivors-enemy-lab-attack-harness', details.pass ? 'ready' : 'fail');
    document.body.setAttribute('data-starvivors-enemy-lab-attack-harness-details', JSON.stringify(details));
  }

  private runEnemyLabPhase6ScreenshotHarness(view: EnemyLabPhase6HarnessView): void {
    const details =
      view === 'basic'
        ? this.runPhase6BasicHarnessView()
        : view === 'squads'
          ? this.runPhase6SquadsHarnessView()
          : view === 'player-test'
            ? { view, ...this.runPhase6AttackHarnessScenario({ labMode: 'attack-tester', includeMixedSquad: false, clearExistingAttackTests: true }) }
            : this.runPhase6StressHighContrastHarnessView();

    document.body.setAttribute('data-starvivors-enemy-lab-phase6-harness', details.pass ? 'ready' : 'fail');
    document.body.setAttribute('data-starvivors-enemy-lab-phase6-harness-details', JSON.stringify(details));
  }

  private runPhase6BasicHarnessView() {
    this.clearEnemies();
    const selectedIndex = getEnemyLabDefinitions().findIndex((definition) => definition.id === 'needle-sniper');
    this.selectedEnemyIndex = Math.max(0, selectedIndex);
    this.selectedVariantId = '';
    this.selectedBasicLoadoutSlotIndex = 0;
    this.setLabMode('basic');

    const center = this.getPreviewPosition();
    PHASE6_DEFAULT_LOADOUT_HOSTS.forEach((host, index) => {
      const angle = (Math.PI * 2 * index) / PHASE6_DEFAULT_LOADOUT_HOSTS.length;
      this.spawnEnemy(
        host.definitionId,
        wrapCoordinate(center.x + Math.cos(angle) * 330, this.arena.width),
        wrapCoordinate(center.y + Math.sin(angle) * 250, this.arena.height)
      );
    });

    this.syncOverlayFromState();
    const defaultLoadout = this.verifyPhase6DefaultLoadouts();

    return {
      view: 'basic' as const,
      pass: defaultLoadout.pass,
      defaultLoadoutPass: defaultLoadout.pass,
      defaultLoadout,
      spawnedRepresentativeHosts: this.enemies.map((enemy) => ({
        definitionId: enemy.definitionId,
        slots: enemy.attackLoadoutSnapshot?.map((slot) => slot.attackId) ?? []
      }))
    };
  }

  private runPhase6SquadsHarnessView() {
    this.clearEnemies();
    const squad = this.createPhase6MixedSquadPreset();
    this.upsertSquadPreset(squad);
    this.selectedCustomSquadId = squad.id;
    this.selectedSquadEntryIndex = 1;
    this.selectedSquadLoadoutSlotIndex = 0;
    this.setLabMode('squads');
    const mixedSquad = this.runPhase6MixedSquadHarness(squad);
    this.syncOverlayFromState();

    return {
      view: 'squads' as const,
      pass: mixedSquad.pass,
      mixedSquadPass: mixedSquad.pass,
      mixedSquad
    };
  }

  private runPhase6StressHighContrastHarnessView() {
    this.clearEnemies();
    this.readabilityMode = 'high-contrast';
    this.reducedEffects = true;
    this.setLabMode('stress');
    this.spawnClutterTest('stress');
    const details = this.runPhase6AttackHarnessScenario({
      labMode: 'stress',
      includeMixedSquad: false,
      clearExistingAttackTests: false
    });
    this.readabilityMode = 'high-contrast';
    this.reducedEffects = true;
    this.setLabMode('stress');
    this.syncOverlayFromState();

    return {
      view: 'stress-high-contrast' as const,
      ...details,
      pass: details.pass && details.reducedFxPass && details.highContrastPass,
      clutter: {
        enemies: this.enemies.length,
        projectiles: this.projectiles.length,
        transientProps: this.testProps.length
      }
    };
  }

  private runPhase6AttackHarnessScenario(options: {
    labMode: EnemyLabMode;
    includeMixedSquad: boolean;
    clearExistingAttackTests: boolean;
  }) {
    if (options.clearExistingAttackTests) {
      this.clearAttackTests();
    }

    this.setLabMode(options.labMode);
    const center = this.getPreviewPosition();
    this.spawnAttackTestTarget('dummy', center.x, center.y);
    const enemyTarget = this.spawnAttackTestTarget('enemy', wrapCoordinate(center.x + 130, this.arena.width), center.y);
    const allyTarget = this.spawnAttackTestTarget('ally', wrapCoordinate(center.x - 130, this.arena.width), center.y);
    enemyTarget.hp = 70;
    allyTarget.hp = 45;
    this.updateAttackTestTargetLabel(enemyTarget);
    this.updateAttackTestTargetLabel(allyTarget);
    const targetCountBeforeQueue = this.attackTestTargets.length;
    const transientPropsBeforeQueue = this.testProps.length;
    const projectilesBeforeQueue = this.projectiles.length;
    const enemyHpBeforeQueue = enemyTarget.hp;
    const allyHpBeforeQueue = allyTarget.hp;

    this.attackTesterSlots = this.createPhase6AttackHarnessSlots();
    this.attackTesterRuntime = undefined;
    this.attackTesterRuntimeSignature = '';
    this.selectedAttackTesterSlotIndex = 0;
    this.selectedAttackTestId = 'rail-line';
    this.syncOverlayFromState();
    const runtime = this.ensureAttackTesterRuntime(this.time.now);

    if (runtime) {
      this.runPhase6AttackTesterQueue(runtime, this.time.now);
    }

    const slots = this.attackTesterSlots.map((slot) => slot.attackId);
    const readyBatchSlots = this.getPhase6ReadyAttackIds();
    const missingReadyBatchSlots = readyBatchSlots.filter((attackId) => !slots.includes(attackId));
    const targetCoverage = this.verifyPhase6AttackTesterTargetCoverage({
      targetCountBeforeQueue,
      transientPropsBeforeQueue,
      projectilesBeforeQueue,
      enemyHpBeforeQueue,
      allyHpBeforeQueue,
      enemyTarget,
      allyTarget
    });
    const defaultLoadout = this.verifyPhase6DefaultLoadouts();
    const mixedSquad = options.includeMixedSquad
      ? this.runPhase6MixedSquadHarness()
      : { pass: true, skipped: true, entries: [] };
    const recipeCoverage = this.verifyPhase6RecipeCoverage();
    const pass =
      missingReadyBatchSlots.length === 0 &&
      targetCoverage.pass &&
      defaultLoadout.pass &&
      mixedSquad.pass &&
      recipeCoverage.reducedFxPass &&
      recipeCoverage.highContrastPass;

    return {
      pass,
      targets: this.attackTestTargets.length,
      projectiles: this.projectiles.length,
      transientProps: this.testProps.length,
      slots,
      readyBatchSlots,
      missingReadyBatchSlots,
      batchASlots: slots.filter((attackId) => getEnemyAttackDefinition(attackId).lab.batch === 'A'),
      batchBSlots: slots.filter((attackId) => getEnemyAttackDefinition(attackId).lab.batch === 'B'),
      batchCSlots: slots.filter((attackId) => getEnemyAttackDefinition(attackId).lab.batch === 'C'),
      defaultLoadoutPass: defaultLoadout.pass,
      mixedSquadPass: mixedSquad.pass,
      reducedFxPass: recipeCoverage.reducedFxPass,
      highContrastPass: recipeCoverage.highContrastPass,
      attackTesterTargetCoverage: targetCoverage,
      defaultLoadout,
      mixedSquad,
      recipeCoverage
    };
  }

  private createHarnessAttackSlot(attackId: EnemyAttackId, params: Record<string, EnemyAttackParamValue>): AttackLoadoutSlot {
    const slot = createDefaultAttackLoadoutSlot(attackId);
    slot.params = {
      ...(slot.params ?? {}),
      ...params
    };
    return slot;
  }

  private createPhase6AttackHarnessSlots(): AttackLoadoutSlot[] {
    const harnessParams: Partial<Record<EnemyAttackId, Record<string, EnemyAttackParamValue>>> = {
      'rail-line': { initialDelayMs: 0, aimMs: 30, lockMs: 30, windupMs: 60, activeMs: 120 },
      'mortar-lob': { initialDelayMs: 0, windupMs: 40, travelMs: 120, activeMs: 120 },
      'emp-nova': { initialDelayMs: 0, windupMs: 40, activeMs: 120 },
      'summon-glyphs': { initialDelayMs: 0, windupMs: 40, channelMs: 60, activeMs: 120, count: 2 },
      'sweep-laser': { initialDelayMs: 0, windupMs: 40, sweepMs: 260, tickMs: 80, activeMs: 260 },
      'healing-beam': { initialDelayMs: 0, windupMs: 30, activeMs: 260, tickMs: 80, retargetMs: 80 },
      'shield-wall': { initialDelayMs: 0, windupMs: 30, activeMs: 220, arcDegrees: 105, reflect: true },
      'plasma-puddle': { initialDelayMs: 0, landingMs: 50, durationMs: 260, tickMs: 80 },
      'cluster-bomb': { initialDelayMs: 0, windupMs: 40, travelMs: 90, delayMs: 110, splitCount: 4, activeMs: 200 },
      'alarm-ping': { initialDelayMs: 0, detectMs: 40, callDelayMs: 70, channelMs: 70, activeMs: 120, squadId: 'scout-pack' },
      'berserker-shockwave': { initialDelayMs: 0, windupMs: 40, activeMs: 120, radiusPx: 170, slowMs: 500, knockback: 220 },
      'mine-reveal': { initialDelayMs: 0, chargeMs: 50, activeMs: 120, blastRadiusPx: 125 }
    };

    return this.getPhase6ReadyAttackIds().map((attackId) => this.createHarnessAttackSlot(attackId, harnessParams[attackId] ?? { initialDelayMs: 0 }));
  }

  private runPhase6AttackTesterQueue(runtime: AttackHostRuntime, baseTime: number): void {
    this.attackTesterSlots.forEach((slot, index) => {
      const queuedAt = baseTime + index * 260;
      this.selectedAttackTesterSlotIndex = index;
      this.selectedAttackTestId = slot.attackId;
      queueAttackSlot(runtime, index, queuedAt);
      for (const offset of [0, 80, 180, 320, 500]) {
        this.updateAttackTesterRuntime(queuedAt + offset, 0.016);
      }
    });
  }

  private getPhase6ReadyAttackIds(): EnemyAttackId[] {
    return getEnemyAttackDefinitions()
      .filter((definition) => PHASE6_READY_ATTACK_BATCHES.has(definition.lab.batch) && definition.lab.status === 'ready')
      .map((definition) => definition.id);
  }

  private verifyPhase6AttackTesterTargetCoverage(input: {
    targetCountBeforeQueue: number;
    transientPropsBeforeQueue: number;
    projectilesBeforeQueue: number;
    enemyHpBeforeQueue: number;
    allyHpBeforeQueue: number;
    enemyTarget: EnemyLabAttackTestTarget;
    allyTarget: EnemyLabAttackTestTarget;
  }) {
    const targetKinds = Array.from(new Set(this.attackTesterSlots.map((slot) => getEnemyAttackDefinition(slot.attackId).targeting.targetKind)));
    const hasSummonSlot = this.attackTesterSlots.some((slot) => getEnemyAttackDefinition(slot.attackId).tags.includes('summon'));
    const enemyExecuted = targetKinds.includes('player') && input.enemyTarget.hp < input.enemyHpBeforeQueue;
    const allyExecuted = targetKinds.includes('ally') && input.allyTarget.hp > input.allyHpBeforeQueue;
    const pointExecuted = targetKinds.includes('point') && this.testProps.length > input.transientPropsBeforeQueue;
    const selfExecuted = targetKinds.includes('self') && this.testProps.length > input.transientPropsBeforeQueue;
    const summonExecuted = hasSummonSlot && this.attackTestTargets.length > input.targetCountBeforeQueue;
    const pass = pointExecuted && enemyExecuted && allyExecuted && selfExecuted && summonExecuted;

    return {
      pass,
      targetKinds,
      point: pointExecuted ? 'pass' : 'fail',
      enemy: enemyExecuted ? 'pass' : 'fail',
      ally: allyExecuted ? 'pass' : 'fail',
      self: selfExecuted ? 'pass' : 'fail',
      summon: summonExecuted ? 'pass' : 'fail',
      enemyHpBefore: input.enemyHpBeforeQueue,
      enemyHpAfter: input.enemyTarget.hp,
      allyHpBefore: input.allyHpBeforeQueue,
      allyHpAfter: input.allyTarget.hp,
      targetsAdded: this.attackTestTargets.length - input.targetCountBeforeQueue,
      transientPropsAdded: this.testProps.length - input.transientPropsBeforeQueue,
      projectilesAdded: this.projectiles.length - input.projectilesBeforeQueue
    };
  }

  private verifyPhase6DefaultLoadouts() {
    const allEnemyLoadouts = getEnemyLabDefinitions().map((definition) => ({
      definitionId: definition.id,
      slotCount: getDefaultEnemyAttackLoadout(definition.id).length
    }));
    const hosts = PHASE6_DEFAULT_LOADOUT_HOSTS.map((host) => {
      const loadout = getDefaultEnemyAttackLoadout(host.definitionId);
      const enabledAttackIds = loadout.filter((slot) => slot.enabled !== false).map((slot) => slot.attackId);
      return {
        ...host,
        slotCount: loadout.length,
        enabledAttackIds,
        pass: loadout.length > 0 && enabledAttackIds.includes(host.expectedAttackId)
      };
    });

    return {
      pass: allEnemyLoadouts.every((entry) => entry.slotCount > 0) && hosts.every((host) => host.pass),
      enemyCount: allEnemyLoadouts.length,
      emptyDefaultLoadouts: allEnemyLoadouts.filter((entry) => entry.slotCount <= 0).map((entry) => entry.definitionId),
      hosts
    };
  }

  private createPhase6MixedSquadPreset(): EnemyLabSquadPreset {
    const overrideRail = this.createHarnessAttackSlot('rail-line', {
      initialDelayMs: 0,
      aimMs: 120,
      lockMs: 60,
      windupMs: 180,
      activeMs: 120,
      rangePx: 900
    });
    overrideRail.label = 'Phase 6 Override Rail';
    const disabledShield = this.createHarnessAttackSlot('shield-wall', {
      activeMs: 450,
      arcDegrees: 115,
      reflect: true
    });
    disabledShield.enabled = false;
    disabledShield.label = 'Disabled Reflect Check';

    return {
      type: 'starvivors-enemy-lab-squad',
      version: 2,
      id: 'phase6-mixed-loadout-squad',
      displayName: 'Phase 6 Mixed Loadouts',
      status: 'Candidate',
      tags: ['phase6', 'harness'],
      notes: 'Harness-only squad with one default entry and one non-native overridden attack stack.',
      savedAt: '2026-05-28T00:00:00.000Z',
      entries: [
        { definitionId: 'scout', x: -150, y: 0 },
        {
          definitionId: 'reflector',
          x: 20,
          y: 0,
          attackLoadoutOverride: [overrideRail, disabledShield]
        },
        { definitionId: 'repair-skiff', x: 170, y: 0 }
      ]
    };
  }

  private runPhase6MixedSquadHarness(squad = this.createPhase6MixedSquadPreset()) {
    const beforeCount = this.enemies.length;
    const center = this.getPreviewPosition();
    this.spawnCustomSquad(squad, center.x, wrapCoordinate(center.y + 320, this.arena.height));
    const spawned = this.enemies.slice(beforeCount);
    const entries = squad.entries.map((entry, index) => {
      const enemy = spawned[index];
      const snapshot = enemy?.attackLoadoutSnapshot ?? [];
      const expected = normalizeAttackLoadoutSlots(entry.attackLoadoutOverride ?? getDefaultEnemyAttackLoadout(entry.definitionId));
      const exactSnapshotPass =
        snapshot.length === expected.length &&
        expected.every((slot, slotIndex) => {
          const actual = snapshot[slotIndex];
          return Boolean(actual) && actual.attackId === slot.attackId && actual.enabled === slot.enabled && actual.label === slot.label;
        });

      return {
        definitionId: entry.definitionId,
        hasOverride: Boolean(entry.attackLoadoutOverride),
        expectedSlots: expected.map((slot) => ({
          attackId: slot.attackId,
          enabled: slot.enabled,
          label: slot.label
        })),
        spawnedSlots: snapshot.map((slot) => ({
          attackId: slot.attackId,
          enabled: slot.enabled,
          label: slot.label
        })),
        pass: exactSnapshotPass
      };
    });
    const defaultEntryPass = entries.some((entry) => !entry.hasOverride && entry.definitionId === 'scout' && entry.spawnedSlots[0]?.attackId === 'contact-ram');
    const overrideEntryPass = entries.some((entry) =>
      entry.hasOverride &&
      entry.definitionId === 'reflector' &&
      entry.spawnedSlots[0]?.attackId === 'rail-line' &&
      entry.spawnedSlots[0]?.label === 'Phase 6 Override Rail' &&
      entry.spawnedSlots.some((slot) => slot.attackId === 'shield-wall' && slot.enabled === false)
    );

    return {
      pass: spawned.length === squad.entries.length && entries.every((entry) => entry.pass) && defaultEntryPass && overrideEntryPass,
      spawnedCount: spawned.length,
      entries,
      defaultEntryPass,
      overrideEntryPass
    };
  }

  private verifyPhase6RecipeCoverage() {
    const attacks = this.getPhase6ReadyAttackIds().map((attackId) => {
      const definition = getEnemyAttackDefinition(attackId);
      const slot = createDefaultAttackLoadoutSlot(attackId);
      const reducedTelegraph = resolveRuntimeTelegraphRecipe(definition, slot, { reducedEffects: true, readabilityMode: 'normal' });
      const reducedEffect = resolveRuntimeEffectRecipe(definition, slot, { reducedEffects: true, readabilityMode: 'normal' });
      const highTelegraph = resolveRuntimeTelegraphRecipe(definition, slot, { reducedEffects: true, readabilityMode: 'high-contrast' });
      const highEffect = resolveRuntimeEffectRecipe(definition, slot, { reducedEffects: true, readabilityMode: 'high-contrast' });
      const reducedPass =
        Number.isFinite(reducedTelegraph.strokeWidthPx ?? 0) &&
        Number.isFinite(reducedEffect.widthPx ?? 0) &&
        Number.isFinite(reducedTelegraph.durationMs ?? definition.timing.windupMs) &&
        Number.isFinite(reducedEffect.durationMs ?? definition.timing.activeMs ?? definition.timing.channelMs ?? 0);
      const highContrastPass =
        this.isPhase6HighContrastColor(highTelegraph.color) &&
        this.isPhase6HighContrastColor(highTelegraph.accentColor) &&
        this.isPhase6HighContrastColor(highEffect.color) &&
        this.isPhase6HighContrastColor(highEffect.accentColor) &&
        (highTelegraph.strokeWidthPx ?? 0) >= 3 &&
        (highEffect.widthPx ?? 0) >= 5;

      return {
        attackId,
        batch: definition.lab.batch,
        reducedPass,
        highContrastPass,
        telegraph: {
          kind: highTelegraph.kind,
          strokeWidthPx: highTelegraph.strokeWidthPx,
          color: highTelegraph.color,
          accentColor: highTelegraph.accentColor
        },
        effect: {
          kind: highEffect.kind,
          widthPx: highEffect.widthPx,
          color: highEffect.color,
          accentColor: highEffect.accentColor
        }
      };
    });

    return {
      reducedFxPass: attacks.every((attack) => attack.reducedPass),
      highContrastPass: attacks.every((attack) => attack.highContrastPass),
      attacks
    };
  }

  private isPhase6HighContrastColor(color: number | undefined): boolean {
    return color === undefined || color === 0xffffff || color === 0xffd166;
  }

  private spawnPrototypeHarnessSamples(): void {
    const center = this.getPreviewPosition();
    const radius = 320;
    PROTOTYPE_ENEMY_SAMPLE_IDS.forEach((definitionId, index) => {
      const angle = (Math.PI * 2 * index) / PROTOTYPE_ENEMY_SAMPLE_IDS.length;
      this.spawnEnemy(
        definitionId,
        wrapCoordinate(center.x + Math.cos(angle) * radius, this.arena.width),
        wrapCoordinate(center.y + Math.sin(angle) * radius, this.arena.height)
      );
    });
  }

  private createPlayerShip(x: number, y: number): Phaser.GameObjects.Container {
    const size = resolveShipObjectSizeProfile(LAB_PLAYER_SHIP);
    const sprite = this.add.image(0, 0, getPlayerShipMonochromeTextureKey(LAB_PLAYER_SHIP));
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(size.visualDiameterPx, size.visualDiameterPx);
    sprite.setRotation(LAB_PLAYER_SHIP.visualRotation ?? PLAYER_SHIP_VISUAL_ROTATION);
    this.playerSprite = sprite;

    const ship = this.add.container(x, y, [sprite]);
    ship.setDepth(10);
    return ship;
  }

  private updatePlayerMovement(time: number, deltaSeconds: number): void {
    this.updatePlayerFacing();

    const controls = resolvePlayerFlightControls({
      strafeLeft: this.keys.left.isDown || this.keys.leftAlt.isDown,
      strafeRight: this.keys.right.isDown || this.keys.rightAlt.isDown,
      thrustForward: this.keys.up.isDown || this.keys.upAlt.isDown,
      thrustReverse: this.keys.down.isDown || this.keys.downAlt.isDown
    });
    const flightStats = this.getPlayerFlightStats();
    const statusModifiers = resolvePlayerStatusMovementModifiers(this.playerStatusRuntime, time);

    applyPlayerFlightAcceleration({
      player: this.player,
      velocity: this.playerVelocity,
      controls,
      stats: flightStats,
      deltaSeconds,
      accelerationScale: statusModifiers.accelerationScale
    });

    this.updateThrusterEffects(time, controls.thrustForward, controls.thrustReverse, controls.strafeLeft, controls.strafeRight);
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
  }

  private getPlayerThrustAcceleration(): number {
    return LAB_PLAYER_SHIP.baseStats.thrust;
  }

  private getPlayerReverseThrustAcceleration(): number {
    return LAB_PLAYER_SHIP.baseStats.brake;
  }

  private getPlayerStrafeThrustAcceleration(): number {
    return LAB_PLAYER_SHIP.baseStats.strafe;
  }

  private getPlayerMaxSpeed(): number {
    return LAB_PLAYER_SHIP.baseStats.moveSpeed;
  }

  private getPlayerVelocityLimit(): number {
    return VELOCITY_LIMITER_BASE_SPEED;
  }

  private getPlayerOverspeedDamping(): number {
    return LAB_PLAYER_SHIP.movement.overspeedDamping;
  }

  private getPlayerFlightStats(): PlayerFlightStats {
    const statusModifiers = resolvePlayerStatusMovementModifiers(this.playerStatusRuntime, this.time.now);
    return {
      thrust: this.getPlayerThrustAcceleration(),
      brake: this.getPlayerReverseThrustAcceleration(),
      strafe: this.getPlayerStrafeThrustAcceleration(),
      moveSpeed: this.getPlayerMaxSpeed() * statusModifiers.velocityLimitScale,
      velocityLimit: this.getPlayerVelocityLimit() * statusModifiers.velocityLimitScale,
      lowFrictionDamping: LAB_PLAYER_SHIP.movement.lowFrictionDamping,
      overspeedDamping: this.getPlayerOverspeedDamping()
    };
  }

  private updatePlayerFacing(): void {
    if (this.isPointerOverControlPanel) {
      return;
    }

    const statusModifiers = resolvePlayerStatusMovementModifiers(this.playerStatusRuntime, this.time.now);
    if (statusModifiers.turnScale < 0.98) {
      const pointer = this.input.activePointer;
      const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const direction = this.getWrappedDirection(this.player.x, this.player.y, pointerWorld.x, pointerWorld.y);
      if (direction.lengthSq() > 0) {
        const targetRotation = Math.atan2(direction.x, -direction.y);
        this.player.rotation = Phaser.Math.Angle.RotateTo(this.player.rotation, targetRotation, 0.09 * statusModifiers.turnScale);
      }
      return;
    }

    updatePlayerFacingFromPointer({
      scene: this,
      player: this.player,
      getWrappedDirection: (fromX, fromY, toX, toY) => this.getWrappedDirection(fromX, fromY, toX, toY)
    });
  }

  private updatePlayerFiring(time: number): void {
    if (this.isPointerOverControlPanel || !this.input.activePointer.isDown || time < this.nextPlayerFireAt) {
      return;
    }

    const direction = this.getForwardDirection(this.player.rotation);
    this.createProjectile({
      owner: 'player',
      x: this.player.x + direction.x * 54,
      y: this.player.y + direction.y * 54,
      direction,
      speed: PLAYER_PROJECTILE_SPEED,
      damage: PLAYER_PROJECTILE_DAMAGE,
      range: PLAYER_PROJECTILE_RANGE,
      radius: 8,
      color: 0x42f5d7
    });
    this.nextPlayerFireAt = time + PLAYER_PROJECTILE_COOLDOWN_MS;
  }

  private fireEnemyProjectile(request: EnemyLabProjectileRequest): void {
    const color = resolveEnemyLabEffectColor(request.color, this.readabilityMode);
    emitEffectMuzzleFlash(this, request.x, request.y, request.direction, {
      kind: 'muzzle-flash',
      color,
      radius: request.radius * 2.2,
      durationMs: 130,
      intensity: 0.75,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    });
    this.createProjectile({
      owner: 'enemy',
      x: request.x,
      y: request.y,
      direction: request.direction,
      speed: request.speed,
      damage: request.damage,
      range: request.range,
      radius: request.radius,
      color,
      statuses: request.statuses
    });
  }

  private createProjectile(input: {
    owner: 'player' | 'enemy';
    x: number;
    y: number;
    direction: Phaser.Math.Vector2;
    speed: number;
    damage: number;
    range: number;
    radius: number;
    color: number;
    statuses?: EnemyStatusEffect[];
  }): void {
    const rotation = Math.atan2(input.direction.x, -input.direction.y);
    const body = this.createProjectileBody(input.x, input.y, input.radius, input.color, rotation, input.owner);
    const wrapMirrorBody = this.createProjectileBody(input.x, input.y, input.radius, input.color, rotation, input.owner);
    wrapMirrorBody.setVisible(false);
    this.projectiles.push({
      id: `lab-projectile-${this.nextProjectileId++}`,
      owner: input.owner,
      body,
      wrapMirrorBody,
      velocity: input.direction.clone().normalize().scale(input.speed),
      damage: input.damage,
      radius: input.radius,
      rangeRemaining: input.range,
      statuses: input.statuses
    });
  }

  private createProjectileBody(
    x: number,
    y: number,
    radius: number,
    color: number,
    rotation: number,
    owner: 'player' | 'enemy'
  ): Phaser.GameObjects.Container {
    const forgeAsset = owner === 'player' ? getForgeAssetDefinition('forge.projectile.neon-bolt-01') : undefined;
    if (forgeAsset) {
      const textureKey = getForgeTextureKey(forgeAsset.id);
      createForgeAssetTexture(this, forgeAsset, textureKey);
      const image = this.add.image(0, 0, textureKey);
      image.setOrigin(0.5);
      image.setDisplaySize(
        this.readForgeGameplayHint(forgeAsset.gameplayHints?.displayWidth, radius * 3.5),
        this.readForgeGameplayHint(forgeAsset.gameplayHints?.displayHeight, radius * 4.5)
      );
      image.setBlendMode(Phaser.BlendModes.ADD);
      const projectile = this.add.container(wrapCoordinate(x, this.arena.width), wrapCoordinate(y, this.arena.height), [image]);
      projectile.setRotation(rotation);
      projectile.setDepth(8);
      projectile.setData('forgeAssetId', forgeAsset.id);
      return projectile;
    }

    const glow = this.add.ellipse(0, 0, radius * 4.5, radius * 4.5, color, 0.24);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.ellipse(0, 0, radius * 1.05, radius * 2.2, color, 0.94);
    core.setStrokeStyle(1, 0xf2fbff, 0.75);
    const projectile = this.add.container(wrapCoordinate(x, this.arena.width), wrapCoordinate(y, this.arena.height), [glow, core]);
    projectile.setRotation(rotation);
    projectile.setDepth(8);
    return projectile;
  }

  private updateProjectiles(_time: number, deltaSeconds: number): void {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      const travel = projectile.velocity.length() * deltaSeconds;
      projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * deltaSeconds, this.arena.width);
      projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * deltaSeconds, this.arena.height);
      projectile.body.rotation = Math.atan2(projectile.velocity.x, -projectile.velocity.y);
      projectile.rangeRemaining -= travel;
      this.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, projectile.radius * 3);

      if (projectile.owner === 'player' && this.tryProjectileHitEnemy(projectile)) {
        this.destroyProjectileAt(index);
      } else if (projectile.owner === 'enemy' && this.tryProjectileHitPlayer(projectile)) {
        this.destroyProjectileAt(index);
      } else if (projectile.rangeRemaining <= 0) {
        this.destroyProjectileAt(index);
      }
    }
  }

  private updateAttackTesterRuntime(time: number, deltaSeconds: number): void {
    const runtime = this.ensureAttackTesterRuntime(time);
    if (!runtime) {
      return;
    }

    if (this.attackTesterAutoCycleEnabled && time >= this.nextAttackTesterAutoCycleAt && this.isAttackRuntimeIdle(runtime)) {
      const enabledSlots = getEnabledAttackSlotIndices(runtime);
      if (enabledSlots.length > 0) {
        const selected = enabledSlots.includes(this.selectedAttackTesterSlotIndex)
          ? this.selectedAttackTesterSlotIndex
          : enabledSlots[0];
        queueAttackSlot(runtime, selected, time);
        const nextEnabled = enabledSlots[(enabledSlots.indexOf(selected) + 1) % enabledSlots.length];
        this.selectedAttackTesterSlotIndex = nextEnabled;
        this.selectedAttackTestId = runtime.attacks[nextEnabled]?.slot.attackId ?? this.selectedAttackTestId;
        this.nextAttackTesterAutoCycleAt = time + 850;
        this.renderAttackTesterControls();
      }
    }

    updateAttackHostRuntime({
      host: runtime,
      time,
      deltaSeconds,
      targets: this.createAttackTesterTargetSnapshots(),
      pointTarget: this.createAttackTesterPointTarget(),
      targetKindMap: (targetKind, host, definition) => this.mapAttackRuntimeTargetKind(targetKind, host, definition.targeting.targetKind),
      getWrappedDirection: (fromX, fromY, toX, toY) => this.getWrappedDirection(fromX, fromY, toX, toY),
      cooldownScale: 1,
      damageScale: 1,
      telegraphsEnabled: this.showTelegraphs,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode,
      callbacks: this.createAttackRuntimeCallbacks()
    });
  }

  private updateEnemyAttackRuntimes(time: number, deltaSeconds: number): void {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || !enemy.attackRuntime) {
        continue;
      }

      updateAttackHostRuntime({
        host: enemy.attackRuntime,
        time,
        deltaSeconds,
        targets: this.createEnemyAttackTargetSnapshots(enemy),
        pointTarget: this.createEnemyAttackPointTarget(),
        targetKindMap: (targetKind, host, definition) => this.mapAttackRuntimeTargetKind(targetKind, host, definition.targeting.targetKind),
        getWrappedDirection: (fromX, fromY, toX, toY) => this.getWrappedDirection(fromX, fromY, toX, toY),
        cooldownScale: this.enemyFireRateMultiplier * enemy.fireRateMultiplier,
        damageScale: enemy.damageMultiplier,
        telegraphsEnabled: this.showTelegraphs,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        callbacks: this.createAttackRuntimeCallbacks()
      });
    }
  }

  private ensureAttackTesterRuntime(time: number): AttackHostRuntime | undefined {
    const signature = JSON.stringify(normalizeAttackLoadoutSlots(this.attackTesterSlots));
    if (!this.attackTesterRuntime) {
      this.attackTesterRuntime = createAttackHostRuntime({
        hostKind: 'player-test',
        hostId: 'enemy-lab-player-test',
        definitionId: DEFAULT_SHIP_ID,
        body: this.player,
        velocity: this.playerVelocity,
        loadout: this.attackTesterSlots,
        time,
        manualTriggerOnly: true
      });
      this.attackTesterRuntimeSignature = signature;
      return this.attackTesterRuntime;
    }

    this.attackTesterRuntime.body = this.player;
    this.attackTesterRuntime.velocity = this.playerVelocity;
    if (signature !== this.attackTesterRuntimeSignature) {
      replaceAttackHostRuntimeLoadout(this.attackTesterRuntime, this.attackTesterSlots, time);
      this.attackTesterRuntimeSignature = signature;
    }

    return this.attackTesterRuntime;
  }

  private isAttackRuntimeIdle(runtime: AttackHostRuntime): boolean {
    return runtime.attacks.every((slot) => slot.phase === 'idle');
  }

  private createAttackRuntimeCallbacks(): Parameters<typeof updateAttackHostRuntime>[0]['callbacks'] {
    return {
      spawnProjectile: (request) => this.fireAttackRuntimeProjectile(request),
      areaDamage: (request) => this.applyAttackRuntimeAreaDamage(request),
      applyStatus: (target, statuses) => this.applyAttackRuntimeStatus(target, statuses),
      summon: (request) => this.summonFromAttackRuntime(request),
      heal: (request) => this.applyAttackRuntimeHeal(request),
      buff: (request) => this.applyAttackRuntimeBuff(request),
      shield: (request) => this.applyAttackRuntimeShield(request),
      stealScrap: (request) => this.applyAttackRuntimeScrapSteal(request),
      telegraph: (request) => this.renderAttackRuntimeTelegraph(request),
      effect: (request) => this.renderAttackRuntimeEffect(request),
      labEffect: (request) => this.renderAttackRuntimeLabEffect(request)
    };
  }

  private createEnemyAttackTargetSnapshots(source: EnemyLabInstance): AttackTargetSnapshot[] {
    return [
      {
        id: 'player',
        kind: 'player',
        x: this.player.x,
        y: this.player.y,
        radius: PLAYER_LAB_HIT_RADIUS,
        velocity: this.playerVelocity,
        hp: this.playerHull,
        maxHp: PLAYER_LAB_HULL,
        label: 'Player'
      },
      ...this.enemies
        .filter((enemy) => enemy.id !== source.id && enemy.hp > 0)
        .map((enemy) => ({
          id: enemy.id,
          kind: 'ally' as const,
          x: enemy.body.x,
          y: enemy.body.y,
          radius: enemy.definition.stats.radius,
          velocity: enemy.velocity,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          label: enemy.definition.displayName
        }))
    ];
  }

  private createEnemyAttackPointTarget(): AttackTargetSnapshot {
    return {
      id: 'player-point',
      kind: 'point',
      x: this.player.x,
      y: this.player.y,
      radius: PLAYER_LAB_HIT_RADIUS,
      velocity: this.playerVelocity,
      label: 'Player point'
    };
  }

  private createAttackTesterTargetSnapshots(): AttackTargetSnapshot[] {
    return this.attackTestTargets.map((target) => ({
      id: target.id,
      kind: target.kind === 'ally' ? 'ally' : 'enemy',
      x: target.body.x,
      y: target.body.y,
      radius: target.radius,
      velocity: { x: 0, y: 0 },
      hp: target.hp,
      maxHp: target.maxHp,
      label: target.kind
    }));
  }

  private createAttackTesterPointTarget(): AttackTargetSnapshot {
    const pointer = this.input.activePointer;
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const fallbackDirection = this.getForwardDirection(this.player.rotation);
    const hasPointer = !this.isPointerOverControlPanel && Number.isFinite(world.x) && Number.isFinite(world.y);
    return {
      id: 'attack-test-point',
      kind: 'point',
      x: hasPointer ? wrapCoordinate(world.x, this.arena.width) : wrapCoordinate(this.player.x + fallbackDirection.x * 360, this.arena.width),
      y: hasPointer ? wrapCoordinate(world.y, this.arena.height) : wrapCoordinate(this.player.y + fallbackDirection.y * 360, this.arena.height),
      radius: 18,
      label: 'Aim point'
    };
  }

  private mapAttackRuntimeTargetKind(
    targetKind: AttackTargetKind,
    host: AttackHostRuntime,
    _definitionTargetKind: AttackTargetKind
  ): AttackTargetKind[] {
    if (host.hostKind === 'player-test') {
      if (targetKind === 'ally') return ['ally'];
      if (targetKind === 'self') return ['self'];
      if (targetKind === 'point') return ['point', 'enemy'];
      return ['enemy', 'point'];
    }

    if (targetKind === 'enemy') {
      return ['player'];
    }
    return [targetKind];
  }

  private fireAttackRuntimeProjectile(request: AttackProjectileRequest): void {
    const direction = new Phaser.Math.Vector2(request.direction.x, request.direction.y);
    const statuses = this.convertAttackStatuses(request.statuses);
    const owner = request.ownerKind === 'enemy' ? 'enemy' : 'player';
    const color = resolveEnemyLabEffectColor(request.color, this.readabilityMode);
    emitEffectMuzzleFlash(this, request.x, request.y, direction, {
      kind: 'muzzle-flash',
      color,
      radius: request.radius * 2.2,
      durationMs: 130,
      intensity: 0.75,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    });
    this.createProjectile({
      owner,
      x: request.x,
      y: request.y,
      direction,
      speed: request.speed,
      damage: request.damage,
      range: request.range,
      radius: request.radius,
      color,
      statuses
    });
  }

  private applyAttackRuntimeAreaDamage(request: AttackAreaDamageRequest): void {
    const statuses = this.convertAttackStatuses(request.statuses);
    this.renderAttackRuntimeImpactFeedback(request);

    if (request.ownerKind === 'enemy') {
      if (this.isPointInAttackArea(this.player.x, this.player.y, PLAYER_LAB_HIT_RADIUS, request)) {
        this.damagePlayer(request.damage);
        applyPlayerStatusEffects(this.playerStatusRuntime, statuses, this.time.now);
        if (statuses?.length) {
          this.emitLabBurst(this.player.x, this.player.y, statuses.some((status) => status.kind === 'frost') ? 0x8eeaff : 0xb3f7ff, 8);
        }
      }

      if (request.shape === 'circle' && request.damage > 0) {
        for (const enemy of this.enemies) {
          if (enemy.id === request.sourceHostId || enemy.hp <= 0) {
            continue;
          }
          if (this.isPointInAttackArea(enemy.body.x, enemy.body.y, enemy.definition.stats.radius, request)) {
            enemy.hp -= request.damage * 0.35;
            this.flashEnemy(enemy);
          }
        }
      }
      return;
    }

    for (const target of this.attackTestTargets) {
      if (target.kind === 'ally' || !this.isPointInAttackArea(target.body.x, target.body.y, target.radius, request)) {
        continue;
      }
      this.damageAttackTestTarget(target, request.damage);
      if (statuses?.length) {
        this.emitLabBurst(target.body.x, target.body.y, statuses.some((status) => status.kind === 'frost') ? 0x8eeaff : 0xb3f7ff, 8);
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || !this.isPointInAttackArea(enemy.body.x, enemy.body.y, enemy.definition.stats.radius, request)) {
        continue;
      }
      enemy.hp -= request.damage;
      this.flashEnemy(enemy);
    }
  }

  private applyAttackRuntimeStatus(target: AttackTargetSnapshot, statuses: AttackStatusRequest[]): void {
    const effects = this.convertAttackStatuses(statuses);
    if (!effects || effects.length <= 0) {
      return;
    }

    if (target.id === 'player') {
      applyPlayerStatusEffects(this.playerStatusRuntime, effects, this.time.now);
      return;
    }

    const testTarget = this.attackTestTargets.find((candidate) => candidate.id === target.id);
    if (testTarget) {
      this.emitLabBurst(testTarget.body.x, testTarget.body.y, effects.some((effect) => effect.kind === 'frost') ? 0x8eeaff : 0xb3f7ff, 6);
    }
  }

  private summonFromAttackRuntime(request: AttackSummonRequest): void {
    const count = Math.max(1, Math.min(8, request.count));
    const source = request.ownerKind === 'player-test'
      ? { x: this.player.x, y: this.player.y }
      : this.enemies.find((enemy) => enemy.id === request.sourceHostId)?.body;
    if (source) {
      this.drawSummonOwnershipLink(source.x, source.y, request.x, request.y, 0x73f2ff, 520);
    }

    if (request.ownerKind === 'player-test') {
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + this.time.now * 0.0004;
        this.spawnAttackTestTarget(
          'ally',
          wrapCoordinate(request.x + Math.cos(angle) * request.radius * 0.42, this.arena.width),
          wrapCoordinate(request.y + Math.sin(angle) * request.radius * 0.42, this.arena.height)
        );
      }
      this.emitLabBurst(request.x, request.y, 0x73f2ff, 10);
      return;
    }

    const squad = getEnemyLabSquads().find((candidate) => candidate.id === request.definitionId);
    if (squad) {
      const preset = convertBuiltInSquadToPreset(squad);
      this.spawnCustomSquad(preset, request.x, request.y);
      this.emitLabBurst(request.x, request.y, 0x73f2ff, 10);
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + this.time.now * 0.0004;
      this.spawnEnemy(
        request.definitionId,
        wrapCoordinate(request.x + Math.cos(angle) * request.radius * 0.36, this.arena.width),
        wrapCoordinate(request.y + Math.sin(angle) * request.radius * 0.36, this.arena.height)
      );
    }
  }

  private applyAttackRuntimeHeal(request: AttackHealRequest): void {
    const enemy = this.enemies.find((candidate) => candidate.id === request.targetId);
    if (enemy) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + request.amount);
      this.drawAttackHealPulse(enemy.body.x, enemy.body.y, 0x66bb6a, 180);
      this.emitLabBurst(enemy.body.x, enemy.body.y, 0x66bb6a, 4);
      return;
    }

    const target = this.attackTestTargets.find((candidate) => candidate.id === request.targetId);
    if (target) {
      target.hp = Math.min(target.maxHp, target.hp + request.amount);
      this.updateAttackTestTargetLabel(target);
      this.drawAttackHealPulse(target.body.x, target.body.y, 0x66bb6a, 180);
      this.emitLabBurst(target.body.x, target.body.y, 0x66bb6a, 4);
    }
  }

  private applyAttackRuntimeBuff(request: AttackBuffRequest): void {
    const source = this.enemies.find((enemy) => enemy.id === request.sourceHostId);
    if (!source) {
      this.emitLabBurst(this.player.x, this.player.y, 0xffd166, 6);
      return;
    }

    for (const enemy of this.enemies) {
      if (enemy.id === source.id || enemy.hp <= 0) {
        continue;
      }
      if (this.getWrappedDirection(source.body.x, source.body.y, enemy.body.x, enemy.body.y).length() > request.radius) {
        continue;
      }
      enemy.speedMultiplier = Math.max(enemy.speedMultiplier, request.speedMultiplier ?? 1);
      enemy.fireRateMultiplier = Math.min(enemy.fireRateMultiplier, request.fireRateMultiplier ?? 1);
      enemy.damageMultiplier = Math.max(enemy.damageMultiplier, request.damageMultiplier ?? 1);
      enemy.buffedUntil = this.time.now + request.durationMs;
    }
    this.emitLabBurst(source.body.x, source.body.y, 0xffd166, 6);
  }

  private applyAttackRuntimeShield(request: AttackShieldRequest): void {
    const enemy = this.enemies.find((candidate) => candidate.id === request.sourceHostId);
    if (!enemy) {
      this.emitLabBurst(this.player.x, this.player.y, 0x73f2ff, 6);
      return;
    }

    enemy.damageReduction = Math.max(enemy.damageReduction, request.reduction);
    enemy.shieldedUntil = this.time.now + request.durationMs;
    enemy.stateData.reflecting = request.reflect;
    enemy.stateData.reflectingUntil = request.reflect ? this.time.now + request.durationMs : 0;
    enemy.stateData.reflectArcDegrees = request.arcDegrees;
    this.emitLabBurst(enemy.body.x, enemy.body.y, request.reflect ? 0xffffff : 0x73f2ff, 6);
  }

  private applyAttackRuntimeScrapSteal(request: AttackScrapStealRequest): void {
    const enemy = this.enemies.find((candidate) => candidate.id === request.sourceHostId);
    if (!enemy) {
      return;
    }

    const nearest = this.labScrapProps
      .filter((scrap) => !scrap.collected)
      .map((scrap) => ({
        scrap,
        distance: this.getWrappedDirection(enemy.body.x, enemy.body.y, scrap.x, scrap.y).length()
      }))
      .filter(({ distance }) => distance <= Math.max(request.pickupRange, request.range))
      .sort((a, b) => a.distance - b.distance)[0];

    if (!nearest || nearest.distance > request.pickupRange) {
      return;
    }

    const stolen = this.stealLabScrap(nearest.scrap);
    enemy.carriedScrap += stolen + request.bonusScrap;
    this.emitLabBurst(nearest.scrap.x, nearest.scrap.y, enemy.definition.visual.accentColor, 8);
  }

  private renderAttackRuntimeTelegraph(request: AttackVisualRequest): void {
    const recipe = request.telegraph;
    if (!recipe || recipe.kind === 'none') {
      return;
    }

    const color = resolveEnemyLabEffectColor(recipe.color, this.readabilityMode);
    const accentColor = resolveEnemyLabEffectColor(recipe.accentColor ?? 0xffffff, this.readabilityMode);
    const duration = Math.max(120, request.durationMs || recipe.durationMs || 240);
    const target = request.target;

    if (recipe.kind === 'sweep-lane') {
      this.drawAttackSweepLane(
        request.x,
        request.y,
        directionFromAttackRequest(request.direction),
        readAttackNumberParam(request.params, 'rangePx', recipe.rangePx ?? 720),
        readAttackNumberParam(request.params, 'arcDegrees', 80),
        color,
        accentColor,
        duration
      );
      return;
    }

    if (recipe.kind === 'line-lock' || recipe.kind === 'detect-beam') {
      const range = recipe.rangePx ?? 720;
      const endX = target?.x ?? request.x + request.direction.x * range;
      const endY = target?.y ?? request.y + request.direction.y * range;
      const isLock = request.beat === 'lock';
      const line = this.add.line(
        0,
        0,
        request.x,
        request.y,
        endX,
        endY,
        color,
        isLock ? 0.78 : 0.28
      );
      line.setOrigin(0, 0);
      line.setStrokeStyle((recipe.strokeWidthPx ?? 2) + (isLock ? 1.8 : 0), isLock ? accentColor : color, this.readabilityMode === 'high-contrast' ? 0.92 : isLock ? 0.82 : 0.52);
      line.setDepth(14);
      line.setBlendMode(Phaser.BlendModes.ADD);
      this.trackTransientLabProp(line, duration, { alpha: 0.03 });
      if (isLock && request.attackId === 'rail-line') {
        this.drawAttackLockMarker(endX, endY, accentColor, duration);
      }
      if (request.attackId === 'alarm-ping') {
        this.drawAttackAlarmMarker(endX, endY, accentColor, duration);
      }
      return;
    }

    if (recipe.kind === 'landing-circle' && (request.attackId === 'mortar-lob' || request.attackId === 'plasma-puddle' || request.attackId === 'cluster-bomb')) {
      this.drawAttackLandingReticle(target?.x ?? request.x, target?.y ?? request.y, recipe.radiusPx ?? 120, color, accentColor, duration);
      return;
    }

    if (recipe.kind === 'hidden-reveal' && request.attackId === 'mine-reveal') {
      this.drawAttackMineReveal(
        request.x,
        request.y,
        target?.x ?? request.x,
        target?.y ?? request.y,
        readAttackNumberParam(request.params, 'blastRadiusPx', recipe.radiusPx ?? 120),
        color,
        accentColor,
        duration
      );
      return;
    }

    if (recipe.kind === 'landing-circle' || recipe.kind === 'expanding-ring' || recipe.kind === 'hidden-reveal') {
      const x = recipe.kind === 'expanding-ring' ? request.x : target?.x ?? request.x;
      const y = recipe.kind === 'expanding-ring' ? request.y : target?.y ?? request.y;
      const radius = recipe.radiusPx ?? 120;
      const circle = this.add.circle(x, y, Math.max(8, radius * 0.22), color, 0.035);
      circle.setStrokeStyle(recipe.strokeWidthPx ?? 2, color, this.readabilityMode === 'high-contrast' ? 0.86 : 0.62);
      circle.setDepth(13);
      this.trackTransientLabProp(circle, duration, { radius, alpha: 0.08 });
      if (request.attackId === 'berserker-shockwave') {
        this.drawAttackBerserkerStatePulse(request.x, request.y, radius, color, accentColor, duration);
      }
      return;
    }

    if (recipe.kind === 'glyphs') {
      this.drawAttackGlyphs(target?.x ?? request.x, target?.y ?? request.y, recipe.radiusPx ?? 180, color, duration);
      return;
    }

    if (recipe.kind === 'tether') {
      this.drawAttackSupportTether(
        request.x,
        request.y,
        target?.x ?? request.x,
        target?.y ?? request.y,
        color,
        accentColor,
        duration,
        recipe.strokeWidthPx ?? 2,
        true
      );
      return;
    }

    if (recipe.kind === 'shield-arc') {
      this.drawAttackShieldArc(
        request.x,
        request.y,
        directionFromAttackRequest(request.direction),
        recipe.radiusPx ?? 90,
        readAttackNumberParam(request.params, 'arcDegrees', 95),
        color,
        accentColor,
        duration,
        request.params?.reflect === true,
        false
      );
    }
  }

  private renderAttackRuntimeEffect(request: AttackVisualRequest): void {
    const effect = request.effect;
    if (!effect) {
      return;
    }

    const color = resolveEnemyLabEffectColor(effect.color, this.readabilityMode);
    const accentColor = resolveEnemyLabEffectColor(effect.accentColor ?? 0xffffff, this.readabilityMode);
    const direction = new Phaser.Math.Vector2(request.direction.x, request.direction.y);
    const target = request.target;
    const duration = Math.max(90, request.durationMs || effect.durationMs || 180);

    if (effect.kind === 'projectile') {
      emitEffectMuzzleFlash(this, request.x, request.y, direction, {
        kind: 'muzzle-flash',
        color,
        radius: effect.radiusPx ?? 10,
        durationMs: duration,
        intensity: 0.8,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode
      });
      return;
    }

    if (effect.kind === 'beam' || effect.kind === 'sweep-beam') {
      const range = readAttackNumberParam(request.params, 'rangePx', 1100);
      const endX = effect.kind === 'sweep-beam' ? request.x + request.direction.x * range : target?.x ?? request.x + request.direction.x * range;
      const endY = effect.kind === 'sweep-beam' ? request.y + request.direction.y * range : target?.y ?? request.y + request.direction.y * range;
      const glow = this.add.line(0, 0, request.x, request.y, endX, endY, color, 0.22);
      glow.setOrigin(0, 0);
      glow.setStrokeStyle((effect.widthPx ?? 5) * 2.4, color, 0.24);
      glow.setDepth(15);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      this.trackTransientLabProp(glow, duration, { alpha: 0 });
      const line = this.add.line(
        0,
        0,
        request.x,
        request.y,
        endX,
        endY,
        accentColor,
        0.92
      );
      line.setOrigin(0, 0);
      line.setStrokeStyle(effect.widthPx ?? 5, accentColor, 0.92);
      line.setDepth(16);
      line.setBlendMode(Phaser.BlendModes.ADD);
      this.trackTransientLabProp(line, duration, { alpha: 0 });
      if (request.attackId === 'rail-line') {
        this.drawAttackLockMarker(endX, endY, accentColor, Math.max(120, duration));
      } else if (request.attackId === 'sweep-laser') {
        this.drawAttackSweepEndpoint(endX, endY, accentColor, Math.max(120, Math.min(220, duration)));
      }
      return;
    }

    if (effect.kind === 'lob-projectile') {
      this.launchAttackMortarProjectile(request.x, request.y, target?.x ?? request.x + request.direction.x * 240, target?.y ?? request.y + request.direction.y * 240, color, accentColor, duration);
      return;
    }

    if (effect.kind === 'cluster-split') {
      const targetX = target?.x ?? request.x + request.direction.x * 260;
      const targetY = target?.y ?? request.y + request.direction.y * 260;
      const travelMs = Math.max(80, readAttackNumberParam(request.params, 'travelMs', Math.min(duration, 800)));
      this.launchAttackMortarProjectile(request.x, request.y, targetX, targetY, color, accentColor, travelMs);
      this.drawAttackClusterSplitSpokes(
        targetX,
        targetY,
        readAttackNumberParam(request.params, 'radiusPx', 140),
        readAttackNumberParam(request.params, 'secondaryRadiusPx', effect.radiusPx ?? 70),
        Math.max(1, Math.trunc(readAttackNumberParam(request.params, 'splitCount', 5))),
        color,
        accentColor,
        duration
      );
      return;
    }

    if (effect.kind === 'alarm-ping') {
      this.drawAttackAlarmPing(
        request.x,
        request.y,
        target?.x ?? request.x,
        target?.y ?? request.y,
        effect.radiusPx ?? 220,
        color,
        accentColor,
        duration
      );
      return;
    }

    if (effect.kind === 'blast-radius' && request.attackId === 'mine-reveal') {
      const blastX = target?.x ?? request.x;
      const blastY = target?.y ?? request.y;
      emitEffectWarningRadius(this, blastX, blastY, {
        kind: 'warning-radius',
        color,
        radius: effect.radiusPx ?? readAttackNumberParam(request.params, 'blastRadiusPx', 125),
        durationMs: duration,
        intensity: 1.1,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode
      });
      return;
    }

    if (
      effect.kind === 'nova-ring' ||
      effect.kind === 'shockwave' ||
      effect.kind === 'blast-radius' ||
      effect.kind === 'puddle-zone' ||
      effect.kind === 'buff-pulse' ||
      effect.kind === 'shards'
    ) {
      const radius = effect.radiusPx ?? 140;
      const x = effect.kind === 'puddle-zone' ? target?.x ?? request.x : request.x;
      const y = effect.kind === 'puddle-zone' ? target?.y ?? request.y : request.y;
      emitEffectWarningRadius(this, x, y, {
        kind: 'warning-radius',
        color,
        radius,
        durationMs: duration,
        intensity: effect.kind === 'puddle-zone' ? 0.72 : 1,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode
      });
      return;
    }

    if (effect.kind === 'support-tether' || effect.kind === 'scrap-link') {
      this.drawAttackSupportTether(
        request.x,
        request.y,
        target?.x ?? request.x,
        target?.y ?? request.y,
        color,
        accentColor,
        duration,
        effect.widthPx ?? 2,
        effect.kind === 'support-tether'
      );
      return;
    }

    if (effect.kind === 'shield-arc') {
      this.drawAttackShieldArc(
        request.x,
        request.y,
        directionFromAttackRequest(request.direction),
        effect.radiusPx ?? 95,
        readAttackNumberParam(request.params, 'arcDegrees', 95),
        color,
        accentColor,
        duration,
        request.params?.reflect === true,
        true
      );
      return;
    }

    emitEffectRingPulse(this, request.x, request.y, {
      kind: 'blink-ring',
      color,
      radius: effect.radiusPx ?? 80,
      durationMs: duration,
      intensity: 0.9,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    });
  }

  private renderAttackRuntimeLabEffect(request: AttackVisualRequest): void {
    if (request.effect?.kind === 'summon-glyphs') {
      const x = request.target?.x ?? request.x;
      const y = request.target?.y ?? request.y;
      this.drawAttackGlyphs(x, y, request.effect.radiusPx ?? 180, request.effect.color, request.durationMs);
      this.drawSummonOwnershipLink(request.x, request.y, x, y, request.effect.color, Math.max(260, request.durationMs));
    }
  }

  private renderAttackRuntimeImpactFeedback(request: AttackAreaDamageRequest): void {
    if (request.shape !== 'circle') {
      return;
    }

    const definition = getEnemyAttackDefinition(request.attackId);
    const color = resolveEnemyLabEffectColor(definition.activeEffect.color, this.readabilityMode);
    if (request.attackId === 'mortar-lob' || request.attackId === 'cluster-bomb') {
      emitEffectWarningRadius(this, request.x, request.y, {
        kind: 'warning-radius',
        color,
        radius: request.radius ?? definition.activeEffect.radiusPx ?? 140,
        durationMs: 260,
        intensity: request.attackId === 'cluster-bomb' ? 1.04 : 1.12,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        depth: 16
      });
      emitEffectSparkBurst(this, request.x, request.y, {
        kind: 'spark-burst',
        color,
        radius: Math.min(request.attackId === 'cluster-bomb' ? 76 : 90, request.radius ?? 80),
        durationMs: 260,
        intensity: request.attackId === 'cluster-bomb' ? 0.88 : 1,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        depth: 17
      });
      return;
    }

    if (request.attackId === 'emp-nova') {
      emitEffectSparkBurst(this, request.x, request.y, {
        kind: 'spark-burst',
        color,
        radius: request.radius ?? definition.activeEffect.radiusPx ?? 160,
        durationMs: 220,
        intensity: this.reducedEffects ? 0.72 : 0.95,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        depth: 16
      });
      return;
    }

    if (request.attackId === 'plasma-puddle') {
      this.drawAttackPuddleTick(request.x, request.y, request.radius ?? definition.activeEffect.radiusPx ?? 125, color, 180);
      return;
    }

    if (request.attackId === 'berserker-shockwave') {
      emitEffectRingPulse(this, request.x, request.y, {
        kind: 'blink-ring',
        color,
        radius: request.radius ?? definition.activeEffect.radiusPx ?? 180,
        durationMs: 240,
        intensity: 1,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        depth: 16
      });
      emitEffectSparkBurst(this, request.x, request.y, {
        kind: 'spark-burst',
        color,
        radius: Math.min(120, request.radius ?? 100),
        durationMs: 220,
        intensity: this.reducedEffects ? 0.55 : 0.82,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        depth: 17
      });
      return;
    }

    if (request.attackId === 'mine-reveal') {
      emitEffectWarningRadius(this, request.x, request.y, {
        kind: 'warning-radius',
        color,
        radius: request.radius ?? definition.activeEffect.radiusPx ?? 125,
        durationMs: 220,
        intensity: 1.1,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        depth: 16
      });
      emitEffectSparkBurst(this, request.x, request.y, {
        kind: 'spark-burst',
        color,
        radius: Math.min(82, request.radius ?? 70),
        durationMs: 220,
        intensity: this.reducedEffects ? 0.62 : 0.92,
        reducedEffects: this.reducedEffects,
        readabilityMode: this.readabilityMode,
        depth: 17
      });
    }
  }

  private drawAttackLockMarker(x: number, y: number, color: number, duration: number): void {
    const ring = this.add.circle(x, y, 10, color, 0.03);
    ring.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3.5 : 2.4, color, 0.86);
    ring.setDepth(17);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(ring, duration, { scale: 1.85, alpha: 0 });

    const size = this.readabilityMode === 'high-contrast' ? 18 : 14;
    const horizontal = this.add.line(0, 0, x - size, y, x + size, y, color, 0.8);
    horizontal.setOrigin(0, 0);
    horizontal.setStrokeStyle(2, color, 0.8);
    horizontal.setDepth(17);
    horizontal.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(horizontal, duration, { alpha: 0 });

    const vertical = this.add.line(0, 0, x, y - size, x, y + size, color, 0.8);
    vertical.setOrigin(0, 0);
    vertical.setStrokeStyle(2, color, 0.8);
    vertical.setDepth(17);
    vertical.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(vertical, duration, { alpha: 0 });
  }

  private drawAttackLandingReticle(
    x: number,
    y: number,
    radius: number,
    color: number,
    accentColor: number,
    duration: number
  ): void {
    const circle = this.add.circle(x, y, radius, color, 0.026);
    circle.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 4 : 2.6, color, 0.78);
    circle.setDepth(13);
    circle.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(circle, duration, { scale: 1.04, alpha: 0.02 });

    const inner = this.add.circle(x, y, Math.max(10, radius * 0.18), accentColor, 0.02);
    inner.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 1.8, accentColor, 0.72);
    inner.setDepth(14);
    inner.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(inner, duration, { scale: 1.35, alpha: 0 });

    const crossSize = radius * 0.38;
    const horizontal = this.add.line(0, 0, x - crossSize, y, x + crossSize, y, accentColor, 0.52);
    horizontal.setOrigin(0, 0);
    horizontal.setStrokeStyle(1.4, accentColor, 0.52);
    horizontal.setDepth(14);
    horizontal.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(horizontal, duration, { alpha: 0.04 });

    const vertical = this.add.line(0, 0, x, y - crossSize, x, y + crossSize, accentColor, 0.52);
    vertical.setOrigin(0, 0);
    vertical.setStrokeStyle(1.4, accentColor, 0.52);
    vertical.setDepth(14);
    vertical.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(vertical, duration, { alpha: 0.04 });
  }

  private drawAttackClusterSplitSpokes(
    x: number,
    y: number,
    primaryRadius: number,
    secondaryRadius: number,
    splitCount: number,
    color: number,
    accentColor: number,
    duration: number
  ): void {
    const count = Math.max(1, Math.min(8, splitCount));
    const splitDistance = Math.max(secondaryRadius * 1.35, primaryRadius * 0.62);
    const graphics = this.add.graphics({ x, y });
    graphics.lineStyle(this.readabilityMode === 'high-contrast' ? 2.6 : 1.6, accentColor, this.reducedEffects ? 0.32 : 0.48);
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI * 0.5 + (Math.PI * 2 * index) / count;
      const endX = Math.cos(angle) * splitDistance;
      const endY = Math.sin(angle) * splitDistance;
      graphics.lineBetween(0, 0, endX, endY);
      graphics.strokeCircle(endX, endY, Math.max(10, secondaryRadius * 0.24));
    }
    graphics.lineStyle(this.readabilityMode === 'high-contrast' ? 3 : 2, color, 0.56);
    graphics.strokeCircle(0, 0, Math.max(16, primaryRadius * 0.22));
    graphics.setDepth(15);
    graphics.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(graphics, duration, { alpha: 0.03 });
  }

  private drawAttackAlarmMarker(x: number, y: number, color: number, duration: number): void {
    const ring = this.add.circle(x, y, 13, color, 0.025);
    ring.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3.2 : 2.2, color, 0.82);
    ring.setDepth(17);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(ring, duration, { scale: 1.55, alpha: 0 });

    const stem = this.add.line(0, 0, x, y - 9, x, y + 4, color, 0.78);
    stem.setOrigin(0, 0);
    stem.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 2, color, 0.8);
    stem.setDepth(17);
    stem.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(stem, duration, { alpha: 0.04 });

    const dot = this.add.circle(x, y + 10, 2.8, color, 0.78);
    dot.setDepth(17);
    dot.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(dot, duration, { alpha: 0.04 });
  }

  private drawAttackAlarmPing(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    radius: number,
    color: number,
    accentColor: number,
    duration: number
  ): void {
    this.drawSummonOwnershipLink(sourceX, sourceY, targetX, targetY, color, Math.max(260, duration));
    this.drawAttackAlarmMarker(targetX, targetY, accentColor, Math.max(180, duration));

    const pulse = this.add.circle(targetX, targetY, Math.max(18, radius * 0.22), color, 0.035);
    pulse.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 4 : 2.6, color, 0.74);
    pulse.setDepth(16);
    pulse.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(pulse, duration, { radius, alpha: 0.02 });
  }

  private drawAttackMineReveal(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    radius: number,
    color: number,
    accentColor: number,
    duration: number
  ): void {
    const sourceRing = this.add.circle(sourceX, sourceY, 14, accentColor, 0.02);
    sourceRing.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 2, accentColor, 0.72);
    sourceRing.setDepth(15);
    sourceRing.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(sourceRing, duration, { scale: 1.85, alpha: 0.02 });

    const chargeLine = this.add.line(0, 0, sourceX, sourceY, targetX, targetY, accentColor, 0.58);
    chargeLine.setOrigin(0, 0);
    chargeLine.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 1.8, accentColor, 0.62);
    chargeLine.setDepth(14);
    chargeLine.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(chargeLine, duration, { alpha: 0.03 });

    this.drawAttackLandingReticle(targetX, targetY, radius, color, accentColor, duration);
  }

  private drawAttackBerserkerStatePulse(
    x: number,
    y: number,
    radius: number,
    color: number,
    accentColor: number,
    duration: number
  ): void {
    const graphics = this.add.graphics({ x, y });
    graphics.lineStyle(this.readabilityMode === 'high-contrast' ? 3.2 : 2.2, accentColor, 0.66);
    graphics.strokeCircle(0, 0, Math.max(18, radius * 0.28));
    graphics.lineStyle(this.readabilityMode === 'high-contrast' ? 2.4 : 1.6, color, 0.58);
    graphics.strokeCircle(0, 0, Math.max(24, radius * 0.42));
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const inner = radius * 0.28;
      const outer = radius * 0.42;
      graphics.lineBetween(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer);
    }
    graphics.setDepth(16);
    graphics.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(graphics, duration, { alpha: 0.03 });
  }

  private drawAttackSweepLane(
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    range: number,
    arcDegrees: number,
    color: number,
    accentColor: number,
    duration: number
  ): void {
    const normalized = direction.lengthSq() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(0, -1);
    const halfArc = Phaser.Math.DegToRad(Math.max(8, arcDegrees) * 0.5);
    const startDirection = rotateSceneDirection(normalized, -halfArc);
    const endDirection = rotateSceneDirection(normalized, halfArc);
    const centerEndX = x + normalized.x * range;
    const centerEndY = y + normalized.y * range;
    const startEndX = x + startDirection.x * range;
    const startEndY = y + startDirection.y * range;
    const endEndX = x + endDirection.x * range;
    const endEndY = y + endDirection.y * range;

    const graphics = this.add.graphics({ x, y });
    graphics.lineStyle(this.readabilityMode === 'high-contrast' ? 3.2 : 2.2, color, 0.54);
    graphics.beginPath();
    graphics.arc(0, 0, range, Math.atan2(startDirection.y, startDirection.x), Math.atan2(endDirection.y, endDirection.x), false);
    graphics.strokePath();
    graphics.lineStyle(this.readabilityMode === 'high-contrast' ? 3 : 1.8, color, 0.48);
    graphics.lineBetween(0, 0, startDirection.x * range, startDirection.y * range);
    graphics.lineBetween(0, 0, endDirection.x * range, endDirection.y * range);
    graphics.lineStyle(this.readabilityMode === 'high-contrast' ? 2.4 : 1.4, accentColor, 0.42);
    graphics.lineBetween(0, 0, normalized.x * range, normalized.y * range);
    graphics.setDepth(14);
    graphics.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(graphics, duration, { alpha: 0.08 });

    const centerLine = this.add.line(0, 0, x, y, centerEndX, centerEndY, accentColor, 0.36);
    centerLine.setOrigin(0, 0);
    centerLine.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 2.4 : 1.4, accentColor, 0.4);
    centerLine.setDepth(14);
    centerLine.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(centerLine, duration, { alpha: 0.04 });

    this.drawAttackSweepEndpoint(startEndX, startEndY, color, duration);
    this.drawAttackSweepEndpoint(endEndX, endEndY, color, duration);
  }

  private drawAttackSweepEndpoint(x: number, y: number, color: number, duration: number): void {
    const marker = this.add.circle(x, y, this.readabilityMode === 'high-contrast' ? 7 : 5, color, 0.08);
    marker.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 2.6 : 1.6, color, 0.74);
    marker.setDepth(17);
    marker.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(marker, duration, { scale: 1.55, alpha: 0 });
  }

  private drawAttackSupportTether(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    color: number,
    accentColor: number,
    duration: number,
    width: number,
    highlightTarget: boolean
  ): void {
    const glow = this.add.line(0, 0, sourceX, sourceY, targetX, targetY, color, 0.22);
    glow.setOrigin(0, 0);
    glow.setStrokeStyle(Math.max(4, width * 3), color, this.reducedEffects ? 0.12 : 0.2);
    glow.setDepth(14);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(glow, duration, { alpha: 0.02 });

    const line = this.add.line(0, 0, sourceX, sourceY, targetX, targetY, accentColor, 0.68);
    line.setOrigin(0, 0);
    line.setStrokeStyle(this.readabilityMode === 'high-contrast' ? Math.max(3, width) : width, accentColor, 0.72);
    line.setDepth(15);
    line.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(line, duration, { alpha: 0.04 });

    if (highlightTarget) {
      this.drawAttackHealPulse(targetX, targetY, color, Math.max(140, Math.min(260, duration)));
    }
  }

  private drawAttackShieldArc(
    x: number,
    y: number,
    direction: Phaser.Math.Vector2,
    radius: number,
    arcDegrees: number,
    color: number,
    accentColor: number,
    duration: number,
    reflect: boolean,
    active: boolean
  ): void {
    const normalized = direction.lengthSq() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(0, -1);
    const halfArc = Phaser.Math.DegToRad(Math.max(12, arcDegrees) * 0.5);
    const startDirection = rotateSceneDirection(normalized, -halfArc);
    const endDirection = rotateSceneDirection(normalized, halfArc);
    const startAngle = Math.atan2(startDirection.y, startDirection.x);
    const endAngle = Math.atan2(endDirection.y, endDirection.x);
    const shieldColor = reflect ? accentColor : color;
    const graphics = this.add.graphics({ x, y });
    graphics.lineStyle(active ? 5 : 3, shieldColor, active ? 0.88 : 0.62);
    graphics.beginPath();
    graphics.arc(0, 0, radius, startAngle, endAngle, false);
    graphics.strokePath();
    graphics.lineStyle(active ? 2.2 : 1.4, shieldColor, reflect ? 0.72 : 0.46);
    graphics.lineBetween(0, 0, startDirection.x * radius, startDirection.y * radius);
    graphics.lineBetween(0, 0, endDirection.x * radius, endDirection.y * radius);
    if (reflect) {
      graphics.lineStyle(1.6, color, 0.86);
      graphics.beginPath();
      graphics.arc(0, 0, radius * 0.72, startAngle, endAngle, false);
      graphics.strokePath();
      for (let index = 0; index < 3; index += 1) {
        const lerp = (index + 1) / 4;
        const spokeDirection = rotateSceneDirection(startDirection, halfArc * 2 * lerp);
        graphics.lineBetween(spokeDirection.x * radius * 0.74, spokeDirection.y * radius * 0.74, spokeDirection.x * radius, spokeDirection.y * radius);
      }
    }
    graphics.setDepth(active ? 16 : 14);
    graphics.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(graphics, duration, { alpha: active ? 0.1 : 0.04 });
  }

  private drawAttackHealPulse(x: number, y: number, color: number, duration: number): void {
    const ring = this.add.circle(x, y, 12, color, 0.035);
    ring.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 2, color, 0.72);
    ring.setDepth(17);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(ring, duration, { scale: 1.8, alpha: 0 });

    const size = this.readabilityMode === 'high-contrast' ? 11 : 8;
    const horizontal = this.add.line(0, 0, x - size, y, x + size, y, color, 0.72);
    horizontal.setOrigin(0, 0);
    horizontal.setStrokeStyle(2, color, 0.72);
    horizontal.setDepth(17);
    horizontal.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(horizontal, duration, { alpha: 0 });

    const vertical = this.add.line(0, 0, x, y - size, x, y + size, color, 0.72);
    vertical.setOrigin(0, 0);
    vertical.setStrokeStyle(2, color, 0.72);
    vertical.setDepth(17);
    vertical.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(vertical, duration, { alpha: 0 });
  }

  private drawAttackPuddleTick(x: number, y: number, radius: number, color: number, duration: number): void {
    const tick = this.add.circle(x, y, Math.max(10, radius * 0.24), color, 0.04);
    tick.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 1.8, color, 0.72);
    tick.setDepth(17);
    tick.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(tick, duration, { scale: 1.5, alpha: 0 });

    emitEffectSparkBurst(this, x, y, {
      kind: 'spark-burst',
      color,
      radius: Math.min(70, radius * 0.58),
      durationMs: duration,
      intensity: this.reducedEffects ? 0.45 : 0.68,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode,
      depth: 17
    });
  }

  private launchAttackMortarProjectile(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: number,
    accentColor: number,
    duration: number
  ): void {
    const projectile = this.add.circle(startX, startY, 6, color, 0.9);
    projectile.setStrokeStyle(1.5, accentColor, 0.9);
    projectile.setDepth(18);
    projectile.setBlendMode(Phaser.BlendModes.ADD);

    const shadow = this.add.circle(endX, endY, 10, color, 0.08);
    shadow.setStrokeStyle(1.5, color, 0.3);
    shadow.setDepth(12);
    shadow.setBlendMode(Phaser.BlendModes.ADD);

    this.testProps.push(projectile, shadow);
    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    const arcHeight = Math.min(180, Math.max(56, distance * 0.22));
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const progress = Number(tween.getValue() ?? 0);
        projectile.setPosition(
          Phaser.Math.Linear(startX, endX, progress),
          Phaser.Math.Linear(startY, endY, progress) - Math.sin(progress * Math.PI) * arcHeight
        );
        projectile.setScale(1 + Math.sin(progress * Math.PI) * 0.85);
        shadow.setScale(0.62 + progress * 0.55);
        shadow.setAlpha(0.05 + progress * 0.14);
      },
      onComplete: () => {
        projectile.destroy();
        shadow.destroy();
        this.testProps = this.testProps.filter((candidate) => candidate !== projectile && candidate !== shadow);
      }
    });
  }

  private drawSummonOwnershipLink(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    color: number,
    duration: number
  ): void {
    const resolvedColor = resolveEnemyLabEffectColor(color, this.readabilityMode);
    const line = this.add.line(0, 0, sourceX, sourceY, targetX, targetY, resolvedColor, 0.44);
    line.setOrigin(0, 0);
    line.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 1.8, resolvedColor, 0.5);
    line.setDepth(14);
    line.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(line, duration, { alpha: 0.02 });

    const sourceRing = this.add.circle(sourceX, sourceY, 12, resolvedColor, 0.025);
    sourceRing.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 2, resolvedColor, 0.62);
    sourceRing.setDepth(14);
    sourceRing.setBlendMode(Phaser.BlendModes.ADD);
    this.trackTransientLabProp(sourceRing, duration, { scale: 1.5, alpha: 0 });
  }

  private drawAttackGlyphs(x: number, y: number, radius: number, color: number, duration: number): void {
    const glyphCount = this.reducedEffects ? 2 : 4;
    for (let index = 0; index < glyphCount; index += 1) {
      const angle = (Math.PI * 2 * index) / glyphCount + this.time.now * 0.0005;
      const circle = this.add.circle(
        wrapCoordinate(x + Math.cos(angle) * radius * 0.35, this.arena.width),
        wrapCoordinate(y + Math.sin(angle) * radius * 0.35, this.arena.height),
        16,
        color,
        0.04
      );
      circle.setStrokeStyle(this.readabilityMode === 'high-contrast' ? 3 : 2, color, 0.74);
      circle.setDepth(14);
      this.trackTransientLabProp(circle, Math.max(160, duration), { scale: 1.8, alpha: 0.02 });
    }
  }

  private trackTransientLabProp(
    prop: Phaser.GameObjects.GameObject,
    duration: number,
    tween: Record<string, number>
  ): void {
    this.testProps.push(prop);
    this.tweens.add({
      targets: prop,
      ...tween,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        prop.destroy();
        this.testProps = this.testProps.filter((candidate) => candidate !== prop);
      }
    });
  }

  private convertAttackStatuses(statuses: AttackStatusRequest[] | undefined): EnemyStatusEffect[] | undefined {
    if (!statuses || statuses.length <= 0) {
      return undefined;
    }

    return statuses.map((status) => ({
      kind: status.kind === 'electric' ? 'electric' : 'frost',
      durationMs: status.durationMs,
      intensity: status.intensity,
      damagePerSecond: status.kind === 'electric' ? status.damagePerSecond : undefined,
      tickMs: status.kind === 'electric' ? status.tickMs : undefined,
      accelerationDrag: status.kind === 'electric' ? status.accelerationDrag : undefined
    }));
  }

  private isPointInAttackArea(x: number, y: number, radius: number, request: AttackAreaDamageRequest): boolean {
    if (request.shape === 'circle') {
      const offset = this.getWrappedDirection(request.x, request.y, x, y);
      return offset.length() <= (request.radius ?? 0) + radius;
    }

    const fromX = request.fromX ?? request.x;
    const fromY = request.fromY ?? request.y;
    const toX = request.toX ?? request.x;
    const toY = request.toY ?? request.y;
    return distanceToSegment(x, y, fromX, fromY, toX, toY) <= (request.width ?? 8) + radius;
  }

  private damageAttackTestTarget(target: EnemyLabAttackTestTarget, damage: number): void {
    target.hp = Math.max(0, target.hp - damage);
    this.updateAttackTestTargetLabel(target);
    this.emitLabBurst(target.body.x, target.body.y, target.kind === 'ally' ? 0x66bb6a : 0xffd166, 5);
    if (target.hp <= 0) {
      target.hp = target.maxHp;
      this.updateAttackTestTargetLabel(target);
      target.body.setScale(1.18);
      this.tweens.add({
        targets: target.body,
        scale: 1,
        duration: 220,
        ease: 'Quad.easeOut'
      });
    }
  }

  private tryProjectileHitEnemy(projectile: EnemyLabProjectile): boolean {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) {
        continue;
      }

      const offset = this.getWrappedDirection(projectile.body.x, projectile.body.y, enemy.body.x, enemy.body.y);
      if (offset.length() > projectile.radius + enemy.definition.stats.radius) {
        continue;
      }

      if (this.tryReflectProjectile(projectile, enemy)) {
        return false;
      }

      const damage = projectile.damage * Math.max(0.1, 1 - enemy.damageReduction);
      enemy.hp -= damage;
      this.flashEnemy(enemy);
      this.emitEnemyRecipeEffect(enemy.definition, 'hit', projectile.body.x, projectile.body.y, projectile.velocity.clone().normalize());
      return true;
    }

    return false;
  }

  private tryProjectileHitPlayer(projectile: EnemyLabProjectile): boolean {
    const offset = this.getWrappedDirection(projectile.body.x, projectile.body.y, this.player.x, this.player.y);
    if (offset.length() > projectile.radius + PLAYER_LAB_HIT_RADIUS) {
      return false;
    }

    this.damagePlayer(projectile.damage);
    applyPlayerStatusEffects(this.playerStatusRuntime, projectile.statuses, this.time.now);
    if (projectile.statuses?.length) {
      this.emitLabBurst(this.player.x, this.player.y, projectile.statuses.some((status) => status.kind === 'frost') ? 0x8eeaff : 0xb3f7ff, 8);
    }
    return true;
  }

  private tryReflectProjectile(projectile: EnemyLabProjectile, enemy: EnemyLabInstance): boolean {
    if (enemy.stateData.reflecting !== true) {
      return false;
    }

    const frontArcDegrees = Number(enemy.stateData.reflectArcDegrees ?? enemy.definition.behavior.params?.frontArcDegrees ?? 92);
    const toProjectile = this.getWrappedDirection(enemy.body.x, enemy.body.y, projectile.body.x, projectile.body.y);
    if (toProjectile.lengthSq() <= 0) {
      return false;
    }

    const forward = this.getForwardDirection(enemy.body.rotation);
    const dot = forward.dot(toProjectile.normalize());
    if (dot < Math.cos(Phaser.Math.DegToRad(frontArcDegrees * 0.5))) {
      return false;
    }

    projectile.owner = 'enemy';
    projectile.velocity.scale(-1);
    projectile.damage *= 0.7;
    this.emitEnemyRecipeEffect(enemy.definition, 'status', projectile.body.x, projectile.body.y, projectile.velocity.clone().normalize());
    return true;
  }

  private destroyProjectileAt(index: number): void {
    const projectile = this.projectiles[index];
    projectile.body.destroy(true);
    projectile.wrapMirrorBody.destroy(true);
    this.projectiles.splice(index, 1);
  }

  private updateEnemyContacts(time: number): void {
    if (this.isPlayerInvulnerable) {
      return;
    }

    for (const enemy of this.enemies) {
      if (enemy.stateData.contactSuppressed === true) {
        continue;
      }

      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      if (offset.length() <= enemy.definition.stats.radius + PLAYER_LAB_HIT_RADIUS) {
        this.damagePlayer(enemy.definition.stats.contactDamage * 0.03);
        this.applyEnemyContactStatus(enemy);
        if (time % 180 < 16) {
          this.emitLabBurst(this.player.x, this.player.y, enemy.definition.visual.accentColor, 3);
        }
      }
    }
  }

  private applyEnemyContactStatus(enemy: EnemyLabInstance): void {
    const statusKind = enemy.definition.behavior.params?.contactStatusKind;
    if (statusKind !== 'frost' && statusKind !== 'electric') {
      return;
    }

    const durationMs = Number(enemy.definition.behavior.params?.contactStatusDurationMs ?? (statusKind === 'frost' ? 1800 : 2800));
    const intensity = Number(enemy.definition.behavior.params?.contactStatusIntensity ?? 1);
    applyPlayerStatusEffects(this.playerStatusRuntime, [{ kind: statusKind, durationMs, intensity }], this.time.now);
  }

  private updatePlayerStatuses(time: number): void {
    updatePlayerStatusEffects({
      runtime: this.playerStatusRuntime,
      time,
      applyDamage: (damage) => this.damagePlayer(damage)
    });
  }

  private updatePlayerStatusOverlay(time: number): void {
    const activeStatuses = getActivePlayerStatusKinds(this.playerStatusRuntime, time);
    if (activeStatuses.length === 0) {
      this.playerStatusOverlay?.clear();
      return;
    }

    const overlay = this.playerStatusOverlay ?? this.add.graphics();
    if (!this.playerStatusOverlay) {
      this.playerStatusOverlay = overlay;
      this.player.add(overlay);
    }

    overlay.clear();
    if (activeStatuses.includes('frost')) {
      this.drawFrostStatusOverlay(overlay, time);
    }

    if (activeStatuses.includes('electric')) {
      this.drawElectricStatusOverlay(overlay, time);
    }
  }

  private drawFrostStatusOverlay(graphics: Phaser.GameObjects.Graphics, time: number): void {
    const alpha = 0.52 + Math.sin(time * 0.014) * 0.14;
    graphics.lineStyle(1.5, 0x8eeaff, alpha);
    graphics.fillStyle(0x40c4ff, 0.08);
    const shards: Array<Array<[number, number]>> = [
      [[-8, -28], [0, -47], [8, -28]],
      [[-34, -8], [-52, -2], [-34, 8]],
      [[34, -8], [52, -2], [34, 8]],
      [[-10, 28], [0, 44], [10, 28]]
    ];

    for (const shard of shards) {
      graphics.beginPath();
      graphics.moveTo(shard[0][0], shard[0][1]);
      graphics.lineTo(shard[1][0], shard[1][1]);
      graphics.lineTo(shard[2][0], shard[2][1]);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
    }
  }

  private drawElectricStatusOverlay(graphics: Phaser.GameObjects.Graphics, time: number): void {
    graphics.lineStyle(1.3, 0xb3f7ff, 0.78);
    const phase = time * 0.018;
    for (let index = 0; index < 4; index += 1) {
      const angle = phase + index * Math.PI * 0.5;
      const radius = 39 + Math.sin(phase + index) * 5;
      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + 0.34) * (radius + 8);
      const y2 = Math.sin(angle + 0.34) * (radius + 8);
      const midX = (x1 + x2) * 0.5 + Math.cos(angle + 1.7) * 8;
      const midY = (y1 + y2) * 0.5 + Math.sin(angle + 1.7) * 8;
      graphics.beginPath();
      graphics.moveTo(x1, y1);
      graphics.lineTo(midX, midY);
      graphics.lineTo(x2, y2);
      graphics.strokePath();
    }
  }

  private damagePlayer(damage: number): void {
    if (this.isPlayerInvulnerable) {
      return;
    }

    this.playerHull = Math.max(0, this.playerHull - damage);
    this.playerSprite.setTint(0xff5964);
    this.time.delayedCall(90, () => this.playerSprite.clearTint());
    if (this.playerHull <= 0) {
      this.playerHull = PLAYER_LAB_HULL;
      this.player.setPosition(getArenaCenter(this.arena).x, getArenaCenter(this.arena).y);
      this.playerVelocity.set(0, 0);
      this.playerStatusRuntime = createPlayerStatusEffectRuntime();
      this.playerStatusOverlay?.clear();
    }
  }

  private explodeAt(x: number, y: number, radius: number, damage: number, sourceId: string): void {
    this.emitExplosion(x, y, radius, 0xffc857);
    const playerOffset = this.getWrappedDirection(x, y, this.player.x, this.player.y);
    if (playerOffset.length() <= radius) {
      this.damagePlayer(damage);
    }

    for (const enemy of this.enemies) {
      if (enemy.id === sourceId || enemy.hp <= 0) {
        continue;
      }

      if (this.getWrappedDirection(x, y, enemy.body.x, enemy.body.y).length() <= radius) {
        enemy.hp -= damage * 0.45;
      }
    }
  }

  private removeDeadEnemies(): void {
    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      if (enemy.hp > 0) {
        continue;
      }

      this.handleEnemyDeath(enemy);
      destroyEnemyLabEnemy(enemy);
      this.enemies.splice(index, 1);
    }
  }

  private handleEnemyDeath(enemy: EnemyLabInstance): void {
    this.emitEnemyRecipeEffect(enemy.definition, 'death', enemy.body.x, enemy.body.y);
    if (enemy.carriedScrap > 0) {
      const bonus = enemy.definition.behavior.id === 'scrapThief' ? Number(enemy.definition.behavior.params?.bonusScrap ?? 0) : 0;
      this.dropLabScrap(enemy.body.x, enemy.body.y, Math.min(10, enemy.carriedScrap + bonus));
    }

    const splitSlot = enemy.attackLoadoutSnapshot
      ?.find((slot) => slot.enabled !== false && slot.attackId === 'split-shards');
    if (splitSlot || enemy.definition.behavior.id === 'splitterChase') {
      const params = splitSlot ? resolveAttackLoadoutSlotParams(splitSlot) : undefined;
      const childId = String(params?.childId ?? enemy.definition.behavior.params?.childId ?? 'shard-drone');
      const childCount = Number(params?.childCount ?? enemy.definition.behavior.params?.childCount ?? 3);
      for (let i = 0; i < childCount; i += 1) {
        const angle = (Math.PI * 2 * i) / childCount + Phaser.Math.FloatBetween(-0.25, 0.25);
        this.spawnEnemy(childId, enemy.body.x + Math.cos(angle) * 42, enemy.body.y + Math.sin(angle) * 42);
      }
    }
  }

  private spawnEnemy(
    definitionId: string,
    x: number,
    y: number,
    variantId?: string,
    attackLoadoutSnapshot?: AttackLoadoutSlot[]
  ): void {
    const baseDefinition = getEnemyLabDefinitions().find((definition) => definition.id === definitionId);
    if (!baseDefinition) {
      return;
    }

    const variant = variantId ? this.presetState.variants.find((candidate) => candidate.id === variantId) : undefined;
    const effectiveDefinition = applyVariantToDefinition(baseDefinition, variant);
    const enemy = spawnEnemyLabEnemy({
      scene: this,
      arena: this.arena,
      definitionId,
      definitionOverride: effectiveDefinition,
      variantId: variant?.id,
      x,
      y,
      time: this.time.now,
      hpMultiplier: this.enemyHpMultiplier,
      showDebugLabel: this.showDebugLabels,
      attackLoadoutSnapshot: this.createEnemyLoadoutSnapshot(definitionId, attackLoadoutSnapshot)
    });
    this.enemies.push(enemy);
    this.emitEnemyRecipeEffect(enemy.definition, 'spawn', enemy.body.x, enemy.body.y);
  }

  private spawnSelectedEnemy(): void {
    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    if (definition.behavior.id === 'scrapThief' && this.labScrapProps.length === 0) {
      this.spawnLabScrapProps(8);
    }

    for (let i = 0; i < this.spawnCount; i += 1) {
      const position = this.getSpawnPositionAroundPlayer(420 + i * 16);
      this.spawnEnemy(definition.id, position.x, position.y, this.getSelectedVariant()?.id, this.getBasicLoadoutDraft(definition.id));
    }
  }

  private fireSelectedAttackTesterSlot(): void {
    const runtime = this.ensureAttackTesterRuntime(this.time.now);
    if (!runtime) {
      return;
    }

    const selectedSlot = this.attackTesterSlots[this.selectedAttackTesterSlotIndex];
    if (!selectedSlot || selectedSlot.enabled === false) {
      this.setPresetStatus('Attack Tester slot is disabled.', true);
      return;
    }

    if (this.attackTestTargets.length === 0 && getEnemyAttackDefinition(selectedSlot.attackId).targeting.targetKind !== 'self') {
      const position = this.getSpawnPositionAroundPlayer(340);
      this.spawnAttackTestTarget('dummy', position.x, position.y);
    }

    queueAttackSlot(runtime, this.selectedAttackTesterSlotIndex, this.time.now);
    this.setPresetStatus(`Queued Attack Tester slot ${this.selectedAttackTesterSlotIndex + 1}: ${getEnemyAttackDefinition(selectedSlot.attackId).displayName}`);
  }

  private toggleAttackTesterAutoCycle(): void {
    this.attackTesterAutoCycleEnabled = !this.attackTesterAutoCycleEnabled;
    this.nextAttackTesterAutoCycleAt = 0;
    this.syncOverlayFromState();
  }

  private spawnAttackTestTarget(
    kind: EnemyLabAttackTestTarget['kind'],
    x?: number,
    y?: number
  ): EnemyLabAttackTestTarget {
    const position = x !== undefined && y !== undefined ? new Phaser.Math.Vector2(x, y) : this.getSpawnPositionAroundPlayer(kind === 'ally' ? 250 : 380);
    const color = kind === 'ally' ? 0x66bb6a : kind === 'enemy' ? 0xff5964 : 0xffd166;
    const radius = kind === 'dummy' ? 28 : 32;
    const shell = this.add.circle(0, 0, radius, 0x000000, 1);
    shell.setStrokeStyle(kind === 'dummy' ? 2 : 2.5, resolveEnemyLabEffectColor(color, this.readabilityMode), 0.92);
    const cross = this.add.line(0, 0, -radius * 0.55, 0, radius * 0.55, 0, 0xffffff, 0.82);
    cross.setOrigin(0, 0);
    cross.setStrokeStyle(1.3, 0xffffff, 0.82);
    const vertical = this.add.line(0, 0, 0, -radius * 0.55, 0, radius * 0.55, 0xffffff, 0.82);
    vertical.setOrigin(0, 0);
    vertical.setStrokeStyle(1.3, 0xffffff, 0.82);
    const body = this.add.container(wrapCoordinate(position.x, this.arena.width), wrapCoordinate(position.y, this.arena.height), [shell, cross, vertical]);
    body.setDepth(11);
    const label = this.add.text(body.x, body.y - radius - 8, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#f2fbff',
      align: 'center',
      stroke: '#02040a',
      strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(30);
    const target: EnemyLabAttackTestTarget = {
      id: `attack-test-target-${this.nextAttackTestTargetId++}`,
      kind,
      body,
      label,
      radius,
      hp: kind === 'dummy' ? 80 : 120,
      maxHp: kind === 'dummy' ? 80 : 120
    };
    this.attackTestTargets.push(target);
    this.updateAttackTestTargetLabel(target);
    return target;
  }

  private updateAttackTestTargetLabel(target: EnemyLabAttackTestTarget): void {
    target.label.setPosition(target.body.x, target.body.y - target.radius - 8);
    target.label.setText(`${target.kind}\n${Math.ceil(target.hp)}/${target.maxHp}`);
  }

  private clearAttackTests(): void {
    for (const target of this.attackTestTargets) {
      target.body.destroy(true);
      target.label.destroy();
    }
    this.attackTestTargets = [];
    this.clearTestProps();
    for (const projectile of this.projectiles) {
      projectile.body.destroy(true);
      projectile.wrapMirrorBody.destroy(true);
    }
    this.projectiles = [];
    this.attackTesterRuntime = undefined;
    this.attackTesterRuntimeSignature = '';
  }

  private dropLabScrap(x: number, y: number, value: number): void {
    const pieces = Math.max(1, Math.min(8, Math.ceil(value / 2)));
    for (let index = 0; index < pieces; index += 1) {
      const angle = (Math.PI * 2 * index) / pieces;
      const distance = 26 + index * 3;
      const body = this.add.circle(
        wrapCoordinate(x + Math.cos(angle) * distance, this.arena.width),
        wrapCoordinate(y + Math.sin(angle) * distance, this.arena.height),
        7,
        0x000000,
        1
      );
      body.setStrokeStyle(1.4, 0xffffff, 0.9);
      body.setDepth(4);
      this.labScrapProps.push({
        id: `lab-drop-${this.time.now}-${index}`,
        x: body.x,
        y: body.y,
        value: Math.max(1, Math.ceil(value / pieces)),
        collected: false,
        body
      });
    }
  }

  private spawnSelectedSquad(): void {
    const position = this.getSpawnPositionAroundPlayer(620);
    const customSquad = this.getSelectedCustomSquad();
    if (customSquad) {
      this.spawnCustomSquad(customSquad, position.x, position.y);
      return;
    }

    const squad = getEnemyLabSquads()[this.selectedSquadIndex];
    const preset = convertBuiltInSquadToPreset(squad);
    this.spawnCustomSquad(preset, position.x, position.y);
  }

  private spawnCustomSquad(squad: EnemyLabSquadPreset, centerX: number, centerY: number): void {
    for (const [index, entry] of squad.entries.entries()) {
      const entryLoadout = this.getSquadEntryLoadoutSnapshot(squad, index);
      const spawn = () => this.spawnEnemy(entry.definitionId, centerX + entry.x, centerY + entry.y, entry.variantId, entryLoadout);
      const delay = Math.max(0, Number(entry.spawnDelayMs) || 0);

      if (delay > 0) {
        const event = this.time.delayedCall(delay, () => {
          this.delayedSquadSpawns = this.delayedSquadSpawns.filter((candidate) => candidate !== event);
          spawn();
        });
        this.delayedSquadSpawns.push(event);
      } else {
        spawn();
      }
    }
  }

  private clearEnemies(): void {
    for (const delayedSpawn of this.delayedSquadSpawns) {
      delayedSpawn.remove(false);
    }
    this.delayedSquadSpawns = [];
    this.enemies = clearEnemyLabEnemies(this.enemies);
    this.clearEnemyCollisionDebug();
    for (const projectile of this.projectiles) {
      projectile.body.destroy(true);
      projectile.wrapMirrorBody.destroy(true);
    }
    this.projectiles = [];
    this.clearPreviewBodies();
    this.clearTestProps();
  }

  private getSpawnPositionAroundPlayer(distance: number): Phaser.Math.Vector2 {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    return new Phaser.Math.Vector2(
      wrapCoordinate(this.player.x + Math.cos(angle) * distance, this.arena.width),
      wrapCoordinate(this.player.y + Math.sin(angle) * distance, this.arena.height)
    );
  }

  private updateEnemyCollisionDebug(): void {
    if (!this.enemyCollisionDebugEnabled) {
      this.clearEnemyCollisionDebug();
      return;
    }

    const activeIds = new Set<string>();
    for (const enemy of this.enemies) {
      activeIds.add(enemy.id);
      const circle = this.collisionDebugCircles.get(enemy.id) ?? this.createEnemyCollisionDebugCircle(enemy);
      circle.setPosition(enemy.body.x, enemy.body.y);
      circle.setRadius(enemy.definition.stats.radius);
      circle.setStrokeStyle(1, this.enemyDeconflictionEnabled ? 0x73f2ff : 0xff5964, 0.72);
      circle.setVisible(true);
    }

    for (const [enemyId, circle] of this.collisionDebugCircles) {
      if (!activeIds.has(enemyId)) {
        circle.destroy();
        this.collisionDebugCircles.delete(enemyId);
      }
    }
  }

  private createEnemyCollisionDebugCircle(enemy: EnemyLabInstance): Phaser.GameObjects.Arc {
    const circle = this.add.circle(enemy.body.x, enemy.body.y, enemy.definition.stats.radius, 0x73f2ff, 0.03);
    circle.setStrokeStyle(1, 0x73f2ff, 0.72);
    circle.setDepth(31);
    this.collisionDebugCircles.set(enemy.id, circle);
    return circle;
  }

  private clearEnemyCollisionDebug(): void {
    for (const circle of this.collisionDebugCircles.values()) {
      circle.destroy();
    }
    this.collisionDebugCircles.clear();
  }

  private handleShortcuts(): void {
    if (this.isControlPanelEditingText()) {
      return;
    }

    const definitions = getEnemyLabDefinitions();
    for (let i = 0; i < Math.min(10, definitions.length); i += 1) {
      const key = this.keys[`digit${i === 9 ? 0 : i + 1}`];
      if (key && Phaser.Input.Keyboard.JustDown(key)) {
        this.selectedEnemyIndex = i;
        this.syncOverlayFromState();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.prev)) {
      this.selectedEnemyIndex = (this.selectedEnemyIndex - 1 + definitions.length) % definitions.length;
      this.syncOverlayFromState();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.next)) {
      this.selectedEnemyIndex = (this.selectedEnemyIndex + 1) % definitions.length;
      this.syncOverlayFromState();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      if (this.keys.shift.isDown) {
        this.spawnSelectedSquad();
      } else {
        this.spawnSelectedEnemy();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.clear)) {
      this.clearEnemies();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.formation)) {
      this.selectedSquadIndex = (this.selectedSquadIndex + 1) % getEnemyLabSquads().length;
      this.spawnSelectedSquad();
      this.syncOverlayFromState();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ai)) {
      this.isAiEnabled = !this.isAiEnabled;
      this.syncOverlayFromState();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.labels)) {
      this.showDebugLabels = !this.showDebugLabels;
      setEnemyLabDebugLabels(this, this.enemies, this.showDebugLabels);
      this.syncOverlayFromState();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.telegraphs)) {
      this.showTelegraphs = !this.showTelegraphs;
      this.syncOverlayFromState();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) {
      this.isSimulationPaused = !this.isSimulationPaused;
      this.syncOverlayFromState();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.overlay)) {
      this.setOverlayCollapsed(!this.isOverlayCollapsed);
    }
  }

  private createOverlay(): void {
    const root = document.createElement('div');
    root.className = `enemy-lab-overlay is-mode-${this.labMode}`;
    root.innerHTML = `
      <div class="enemy-lab-header">
        <div class="enemy-lab-title">Monochrome Combat Lab</div>
        <button data-action="toggleOverlay">Hide UI</button>
      </div>
      <section class="enemy-lab-panel">
        <div class="enemy-lab-panel-title">Workflow</div>
        <div class="enemy-lab-mode-row">
          <button data-lab-mode="basic">Basic</button>
          <button data-lab-mode="squads">Squads</button>
          <button data-lab-mode="attack-tester">Attack Tester</button>
          <button data-lab-mode="stress">Stress/Readability</button>
          <button data-lab-mode="presets">Presets</button>
        </div>
        <div class="enemy-lab-style-guide">
          Black field, white enclosed silhouettes, shape-matched fills, and restrained internal marks. Active enemy, ship, and asteroid art uses the shared 320px source scale.
        </div>
      </section>
      <details class="enemy-lab-panel enemy-lab-advanced-panel">
        <summary>Advanced Forge / Import</summary>
        <div class="enemy-lab-style-guide">
          Legacy Forge workflows remain available for export, import, AI briefs, and promotion bundles, but monochrome-outline recipes are the active readability direction.
        </div>
        <div class="enemy-lab-row">
          <button data-action="exportForgeSvg">Export SVG</button>
          <button data-action="exportForgeJson">Forge JSON</button>
          <button data-action="exportContactSheet">Contact Sheet</button>
          <button data-action="importForgeAsset">Import Forge</button>
          <button data-action="exportForgePromotion">Forge Promotion</button>
          <button data-action="promoteForgeAsset">Promote Approved</button>
        </div>
        <div class="enemy-lab-subtitle">AI Workbench</div>
        <div class="enemy-lab-grid">
          <label>Task <select data-field="forgeAiTaskType"></select></label>
          <label>Kind <select data-field="forgeAiAssetKind"></select></label>
          <label>Template <select data-field="forgeAiTemplate"></select></label>
          <label>Batch <input data-field="forgeBatchCount" type="number" min="1" max="40" step="1" value="8"></label>
        </div>
        <label>Role <input data-field="forgeAiRole" type="text" maxlength="48" value="neon-bolt"></label>
        <label>Target <input data-field="forgeAiProductionTarget" type="text" maxlength="72" placeholder="optional production attachment"></label>
        <div class="enemy-lab-row">
          <button data-action="exportForgeAiTask">Export AI Task</button>
          <button data-action="importForgeAiResponse">Import AI Response</button>
          <button data-action="validateForgeAsset">Validate Selected</button>
          <button data-action="exportForgeRepairPrompt">Export Repair Prompt</button>
        </div>
        <div class="enemy-lab-import-report" data-field="forgeImportReport">No AI validation report yet.</div>
      </details>
      <details class="enemy-lab-panel enemy-lab-advanced-panel">
        <summary>Advanced Forge Editor</summary>
        <div class="enemy-lab-panel-title">Forge Editor</div>
        <label>Forge Asset <select data-field="forgeAsset"></select></label>
        <label>Status <select data-field="forgeAssetStatus"></select></label>
        <label>Preview <select data-field="forgePreviewMode">
          <option value="combat">Combat</option>
          <option value="projectile-motion">Projectile Motion</option>
          <option value="weapon-icon">Weapon Icon</option>
          <option value="minimap">Minimap</option>
          <option value="silhouette">Silhouette</option>
          <option value="starfield">Starfield</option>
          <option value="hit-radius">Hit Radius</option>
        </select></label>
        <div class="enemy-lab-forge-preview" data-field="forgePreview"></div>
        <div class="enemy-lab-row">
          <button data-action="createForgeDraft">Create Draft</button>
          <button data-action="createProjectileForgeDraft">New Projectile</button>
          <button data-action="createWeaponForgeDraft">New Weapon Icon</button>
          <button data-action="saveForgeAsset">Save Forge</button>
          <button data-action="deleteForgeAsset" class="enemy-lab-danger-button">Delete Forge</button>
        </div>
        <div class="enemy-lab-subtitle">Palette</div>
        <div class="enemy-lab-palette-grid">
          <label>Metal dark <input data-palette="metalDark" type="color"></label>
          <label>Warm metal <input data-palette="metalWarm" type="color"></label>
          <label>Neon main <input data-palette="neonPrimary" type="color"></label>
          <label>Neon alt <input data-palette="neonSecondary" type="color"></label>
          <label>Warning <input data-palette="warning" type="color"></label>
          <label>Outline <input data-palette="outline" type="color"></label>
          <label>White <input data-palette="white" type="color"></label>
        </div>
        <div class="enemy-lab-subtitle">Layer</div>
        <label>Layer <select data-field="forgeLayer"></select></label>
        <div class="enemy-lab-grid">
          <label>Fill <select data-field="forgeLayerColor"></select></label>
          <label>Stroke <select data-field="forgeLayerStrokeColor"></select></label>
          <label>Alpha <input data-field="forgeLayerAlpha" type="number" min="0" max="1" step="0.05"></label>
          <label>Stroke W <input data-field="forgeLayerStrokeWidth" type="number" min="0" max="99" step="0.5"></label>
        </div>
        <div class="enemy-lab-row">
          <button data-action="forgeMoveLeft">Left</button>
          <button data-action="forgeMoveRight">Right</button>
          <button data-action="forgeMoveUp">Up</button>
          <button data-action="forgeMoveDown">Down</button>
          <button data-action="forgeScaleDown">Smaller</button>
          <button data-action="forgeScaleUp">Larger</button>
          <button data-action="forgeMirrorX">Mirror X</button>
        </div>
        <div class="enemy-lab-row">
          <button data-action="forgeAddGlow">Add Glow</button>
          <button data-action="forgeAddRing">Add Ring</button>
          <button data-action="forgeAddCore">Add Core</button>
          <button data-action="forgeAddPlate">Add Plate</button>
          <button data-action="forgeDuplicateLayer">Duplicate</button>
          <button data-action="forgeDeleteLayer" class="enemy-lab-danger-button">Delete Layer</button>
        </div>
      </details>
      <section class="enemy-lab-panel" data-lab-panel="basic presets stress">
        <div class="enemy-lab-panel-title">Enemy Basic</div>
        <label>Enemy <select data-field="enemy"></select></label>
        <label>Variant <select data-field="variant"></select></label>
        <label>Spawn count <input data-field="spawnCount" type="number" min="1" max="9999" step="1" value="1"></label>
        <div class="enemy-lab-row enemy-lab-primary-row">
          <button data-action="spawn">Spawn Enemy</button>
          <button data-action="clear">Clear Enemies</button>
        </div>
        <div class="enemy-lab-subtitle">Testing Toggles</div>
        <div class="enemy-lab-row">
          <button data-action="ai">AI</button>
          <button data-action="invuln">Invuln</button>
          <button data-action="labels">Labels</button>
          <button data-action="telegraphs">Telegraphs</button>
          <button data-action="pause">Pause</button>
          <button class="enemy-lab-danger-button" data-action="deleteVariant">Delete Variant</button>
        </div>
      </section>
      <section class="enemy-lab-panel" data-lab-panel="basic">
        <div class="enemy-lab-panel-title">Attack Loadout Draft</div>
        <div class="enemy-lab-attack-loadout" data-field="attackLoadout"></div>
        <div class="enemy-lab-row">
          <button data-loadout-scope="basic" data-loadout-action="add">+ Attack Slot</button>
          <button data-loadout-scope="basic" data-loadout-action="remove">- Attack Slot</button>
          <button data-loadout-scope="basic" data-loadout-action="reset">Reset Defaults</button>
        </div>
        <div class="enemy-lab-row">
          <button data-action="saveAttackLoadout">Save Loadout</button>
          <button data-action="loadAttackLoadout">Load Loadout</button>
          <button data-action="openLoadoutFolder">Loadout Folder</button>
        </div>
      </section>
      <section class="enemy-lab-panel" data-lab-panel="attack-tester">
        <div class="enemy-lab-panel-title">Attack Tester</div>
        <label>Host <select disabled><option>Default Player Ship</option></select></label>
        <label>Attack <select data-field="attackTesterAttack"></select></label>
        <div class="enemy-lab-attack-loadout" data-field="attackTesterSlotList"></div>
        <div class="enemy-lab-row">
          <button data-loadout-scope="attackTester" data-loadout-action="add">+ Attack Slot</button>
          <button data-loadout-scope="attackTester" data-loadout-action="remove">- Attack Slot</button>
          <button data-loadout-scope="attackTester" data-loadout-action="reset">Reset Stack</button>
        </div>
        <div class="enemy-lab-empty" data-field="attackTesterParams">Use the player ship as a lab-only attack host. Spawn targets, then fire or auto-cycle the selected slot stack.</div>
        <div class="enemy-lab-row enemy-lab-primary-row">
          <button data-action="attackTesterFireOnce">Fire Once</button>
          <button data-action="attackTesterAutoCycle">Auto-Cycle</button>
        </div>
        <div class="enemy-lab-row">
          <button data-action="attackTesterSpawnDummy">Spawn Dummy</button>
          <button data-action="attackTesterSpawnEnemy">Enemy Target</button>
          <button data-action="attackTesterSpawnAlly">Ally Target</button>
          <button data-action="attackTesterClear">Clear Tests</button>
        </div>
        <div class="enemy-lab-row">
          <button data-action="saveAttackTest">Save Attack Test</button>
          <button data-action="loadAttackTest">Load Attack Test</button>
          <button data-action="openAttackTestFolder">Attack Test Folder</button>
        </div>
      </section>
      <section class="enemy-lab-panel" data-lab-panel="stress">
        <div class="enemy-lab-panel-title">Special Effects</div>
        <div class="enemy-lab-row enemy-lab-preview-row">
          <button data-preview-state="idle">Idle</button>
          <button data-preview-state="pursue">Pursue</button>
          <button data-preview-state="telegraph">Telegraph</button>
          <button data-preview-state="attack">Attack</button>
          <button data-preview-state="hit">Hit</button>
          <button data-preview-state="death">Death</button>
        </div>
        <div class="enemy-lab-subtitle">Readability</div>
        <div class="enemy-lab-row">
          <button data-readability-mode="normal">Normal</button>
          <button data-readability-mode="color-safe">Color-Safe</button>
          <button data-readability-mode="high-contrast">High Contrast</button>
          <button data-action="reducedEffects">Reduced FX</button>
        </div>
        <div class="enemy-lab-subtitle">Attack Stress</div>
        <div class="enemy-lab-row">
          <button disabled>Selected Attack (Phase 4)</button>
          <button disabled>Mixed Attacks (Phase 4)</button>
          <button disabled>Reduced FX Compare (Phase 4)</button>
          <button disabled>High Contrast Compare (Phase 4)</button>
        </div>
      </section>
      <section class="enemy-lab-panel" data-lab-panel="presets">
        <div class="enemy-lab-panel-title">Behavior / Variant Editor</div>
        <label>Name <input data-field="variantName" type="text" maxlength="48"></label>
        <label>Status <select data-field="variantStatus"></select></label>
        <div class="enemy-lab-row">
          <button data-action="newVariant">Duplicate</button>
          <button data-action="saveVariant">Save Draft</button>
          <button data-action="resetVariant">Reset</button>
          <button data-action="deleteVariant">Delete Draft</button>
          <button data-action="exportVariant">Save Variant</button>
          <button data-action="loadVariant">Load Variant</button>
          <button data-action="openVariantFolder">Variant Folder</button>
          <button data-action="importPreset">Load Any</button>
        </div>
        <div class="enemy-lab-grid">
          <label>Visual <input data-field="visualScale" type="number" min="0.25" max="9999" step="0.05"></label>
          <label>Width <input data-field="scaleX" type="number" min="0.25" max="9999" step="0.05"></label>
          <label>Height <input data-field="scaleY" type="number" min="0.25" max="9999" step="0.05"></label>
          <label>Rotate <input data-field="rotationOffset" type="number" min="-9999" max="9999" step="5"></label>
          <label>Glow <input data-field="glowScale" type="number" min="0" max="9999" step="0.05"></label>
          <label>Hit R <input data-field="statRadius" type="number" min="4" max="9999" step="1"></label>
          <label>HP <input data-field="statHp" type="number" min="1" max="9999" step="1"></label>
          <label>Speed <input data-field="statSpeed" type="number" min="1" max="9999" step="1"></label>
          <label>Contact <input data-field="statContactDamage" type="number" min="0" max="9999" step="1"></label>
        </div>
        <div class="enemy-lab-row enemy-lab-primary-row">
          <button data-action="spawn">Spawn Enemy</button>
          <button data-action="clear">Clear Enemies</button>
        </div>
        <div class="enemy-lab-subtitle">Behavior Params</div>
        <div class="enemy-lab-param-grid" data-field="behaviorParams"></div>
        <textarea data-field="variantNotes" rows="4" placeholder="Write dev feedback while testing."></textarea>
        <div class="enemy-lab-tags" data-field="variantTags"></div>
        <div class="enemy-lab-row">
          <button data-action="exportAiBrief">AI Brief</button>
          <button data-action="exportPromotion">Promotion</button>
        </div>
        <div class="enemy-lab-subtitle">Attack Presets</div>
        <div class="enemy-lab-row">
          <button data-action="saveAttackLoadout">Save Loadout</button>
          <button data-action="loadAttackLoadout">Load Loadout</button>
          <button data-action="saveAttackTest">Save Attack Test</button>
          <button data-action="loadAttackTest">Load Attack Test</button>
        </div>
        <div class="enemy-lab-subtitle">Squad Presets</div>
        <div class="enemy-lab-row">
          <button data-action="exportSquad">Save Squad</button>
          <button data-action="loadSquad">Load Squad</button>
          <button data-action="openSquadFolder">Squad Folder</button>
        </div>
      </section>
      <section class="enemy-lab-panel" data-lab-panel="squads stress">
        <div class="enemy-lab-panel-title">Squad Builder</div>
        <label>Built-in <select data-field="squad"></select></label>
        <label>Custom <select data-field="customSquad"></select></label>
        <div class="enemy-lab-row enemy-lab-primary-row">
          <button data-action="spawnSquad">Test Squad</button>
          <button data-action="addSquadEntry">Add Selected Enemy</button>
        </div>
        <label>Squad name <input data-field="squadName" type="text" maxlength="48"></label>
        <label>Squad status <select data-field="squadStatus"></select></label>
        <div class="enemy-lab-row">
          <button data-action="newSquad">New Squad</button>
          <button data-action="copyBuiltInSquad">Copy Built-in</button>
          <button data-action="exportSquad">Save Squad</button>
          <button data-action="loadSquad">Load Squad</button>
          <button data-action="openSquadFolder">Squad Folder</button>
          <button data-action="deleteSquad">Delete Squad</button>
        </div>
        <textarea data-field="squadNotes" rows="3" placeholder="Squad formation notes."></textarea>
        <div class="enemy-lab-row">
          <button data-action="rotateSquadLeft">Rotate -15</button>
          <button data-action="rotateSquadRight">Rotate +15</button>
          <button data-action="scaleSquadDown">Tighter</button>
          <button data-action="scaleSquadUp">Wider</button>
          <button data-action="mirrorSquad">Mirror</button>
          <button data-action="clearSquad">Clear Squad</button>
        </div>
        <div class="enemy-lab-squad-entries" data-field="squadEntries"></div>
      </section>
      <section class="enemy-lab-panel" data-lab-panel="basic squads attack-tester stress">
        <div class="enemy-lab-panel-title">Test Conditions</div>
        <label>Lab speed <input data-field="speed" type="range" min="0.2" max="3" step="0.1" value="1"></label>
        <label>Lab HP <input data-field="hp" type="range" min="0.2" max="5" step="0.1" value="1"></label>
        <label>Fire rate <input data-field="fireRate" type="range" min="0.25" max="3" step="0.05" value="1"></label>
        <label>Nudge <input data-field="deconflict" type="range" min="0" max="3" step="0.05" value="1"></label>
        <div class="enemy-lab-row">
          <button data-action="deconflict">Deconflict</button>
          <button data-action="collisionDebug">Hit Circles</button>
          <button data-action="exportDiagnostics">Export Diagnostics</button>
        </div>
        <div class="enemy-lab-subtitle">Clutter Test</div>
        <div class="enemy-lab-row">
          <button data-clutter-test="single">Single</button>
          <button data-clutter-test="squad">Squad</button>
          <button data-clutter-test="swarm">Swarm 50</button>
          <button data-clutter-test="bullets">Bullets</button>
          <button data-clutter-test="asteroids">Asteroids</button>
          <button data-clutter-test="asteroidGallery">Asteroid Gallery</button>
          <button data-clutter-test="debris">Debris</button>
          <button data-clutter-test="stress">Full Stress</button>
          <button data-action="clearProps">Clear Props</button>
        </div>
      </section>
      <div class="enemy-lab-help">1-0 select first 10, [/] cycle, Space spawn, Shift+Space squad, C clear, F squad, I AI, L labels, T telegraphs, P pause, U hide UI. Hold mouse to fire.</div>
      <div class="enemy-lab-fps" data-field="fps">FPS -- | avg --ms | worst --ms</div>
      <div class="enemy-lab-status" data-field="status"></div>
    `;
    document.body.appendChild(root);

    const toggleOverlayButton = root.querySelector<HTMLButtonElement>('[data-action="toggleOverlay"]');
    const forgeAssetSelect = root.querySelector<HTMLSelectElement>('[data-field="forgeAsset"]');
    const forgeAssetStatus = root.querySelector<HTMLSelectElement>('[data-field="forgeAssetStatus"]');
    const forgePreviewMode = root.querySelector<HTMLSelectElement>('[data-field="forgePreviewMode"]');
    const forgePreview = root.querySelector<HTMLDivElement>('[data-field="forgePreview"]');
    const forgeLayerSelect = root.querySelector<HTMLSelectElement>('[data-field="forgeLayer"]');
    const forgeLayerColor = root.querySelector<HTMLSelectElement>('[data-field="forgeLayerColor"]');
    const forgeLayerStrokeColor = root.querySelector<HTMLSelectElement>('[data-field="forgeLayerStrokeColor"]');
    const forgeLayerAlpha = root.querySelector<HTMLInputElement>('[data-field="forgeLayerAlpha"]');
    const forgeLayerStrokeWidth = root.querySelector<HTMLInputElement>('[data-field="forgeLayerStrokeWidth"]');
    const forgeBatchCount = root.querySelector<HTMLInputElement>('[data-field="forgeBatchCount"]');
    const forgeAiTaskType = root.querySelector<HTMLSelectElement>('[data-field="forgeAiTaskType"]');
    const forgeAiAssetKind = root.querySelector<HTMLSelectElement>('[data-field="forgeAiAssetKind"]');
    const forgeAiTemplate = root.querySelector<HTMLSelectElement>('[data-field="forgeAiTemplate"]');
    const forgeAiRole = root.querySelector<HTMLInputElement>('[data-field="forgeAiRole"]');
    const forgeAiProductionTarget = root.querySelector<HTMLInputElement>('[data-field="forgeAiProductionTarget"]');
    const forgeImportReport = root.querySelector<HTMLDivElement>('[data-field="forgeImportReport"]');
    const forgePaletteInputs = Object.fromEntries(
      FORGE_PALETTE_KEYS.map((key) => [key, root.querySelector<HTMLInputElement>(`[data-palette="${key}"]`)])
    ) as Record<keyof ForgePalette, HTMLInputElement | null>;
    const enemySelect = root.querySelector<HTMLSelectElement>('[data-field="enemy"]');
    const variantSelect = root.querySelector<HTMLSelectElement>('[data-field="variant"]');
    const variantName = root.querySelector<HTMLInputElement>('[data-field="variantName"]');
    const variantStatus = root.querySelector<HTMLSelectElement>('[data-field="variantStatus"]');
    const variantNotes = root.querySelector<HTMLTextAreaElement>('[data-field="variantNotes"]');
    const variantTags = root.querySelector<HTMLDivElement>('[data-field="variantTags"]');
    const visualScale = root.querySelector<HTMLInputElement>('[data-field="visualScale"]');
    const scaleX = root.querySelector<HTMLInputElement>('[data-field="scaleX"]');
    const scaleY = root.querySelector<HTMLInputElement>('[data-field="scaleY"]');
    const rotationOffset = root.querySelector<HTMLInputElement>('[data-field="rotationOffset"]');
    const glowScale = root.querySelector<HTMLInputElement>('[data-field="glowScale"]');
    const statHp = root.querySelector<HTMLInputElement>('[data-field="statHp"]');
    const statSpeed = root.querySelector<HTMLInputElement>('[data-field="statSpeed"]');
    const statRadius = root.querySelector<HTMLInputElement>('[data-field="statRadius"]');
    const statContactDamage = root.querySelector<HTMLInputElement>('[data-field="statContactDamage"]');
    const behaviorParams = root.querySelector<HTMLDivElement>('[data-field="behaviorParams"]');
    const attackLoadout = root.querySelector<HTMLDivElement>('[data-field="attackLoadout"]');
    const attackTesterAttackSelect = root.querySelector<HTMLSelectElement>('[data-field="attackTesterAttack"]');
    const attackTesterSlotList = root.querySelector<HTMLDivElement>('[data-field="attackTesterSlotList"]');
    const attackTesterParams = root.querySelector<HTMLDivElement>('[data-field="attackTesterParams"]');
    const squadSelect = root.querySelector<HTMLSelectElement>('[data-field="squad"]');
    const customSquadSelect = root.querySelector<HTMLSelectElement>('[data-field="customSquad"]');
    const squadName = root.querySelector<HTMLInputElement>('[data-field="squadName"]');
    const squadStatus = root.querySelector<HTMLSelectElement>('[data-field="squadStatus"]');
    const squadNotes = root.querySelector<HTMLTextAreaElement>('[data-field="squadNotes"]');
    const squadEntries = root.querySelector<HTMLDivElement>('[data-field="squadEntries"]');
    const spawnCount = root.querySelector<HTMLInputElement>('[data-field="spawnCount"]');
    const speedMultiplier = root.querySelector<HTMLInputElement>('[data-field="speed"]');
    const hpMultiplier = root.querySelector<HTMLInputElement>('[data-field="hp"]');
    const fireRateMultiplier = root.querySelector<HTMLInputElement>('[data-field="fireRate"]');
    const deconflictionStrength = root.querySelector<HTMLInputElement>('[data-field="deconflict"]');
    const fps = root.querySelector<HTMLDivElement>('[data-field="fps"]');
    const status = root.querySelector<HTMLDivElement>('[data-field="status"]');

    if (
      !enemySelect ||
      !toggleOverlayButton ||
      !forgeAssetSelect ||
      !forgeAssetStatus ||
      !forgePreviewMode ||
      !forgePreview ||
      !forgeLayerSelect ||
      !forgeLayerColor ||
      !forgeLayerStrokeColor ||
      !forgeLayerAlpha ||
      !forgeLayerStrokeWidth ||
      !forgeBatchCount ||
      !forgeAiTaskType ||
      !forgeAiAssetKind ||
      !forgeAiTemplate ||
      !forgeAiRole ||
      !forgeAiProductionTarget ||
      !forgeImportReport ||
      Object.values(forgePaletteInputs).some((input) => !input) ||
      !variantSelect ||
      !variantName ||
      !variantStatus ||
      !variantNotes ||
      !variantTags ||
      !visualScale ||
      !scaleX ||
      !scaleY ||
      !rotationOffset ||
      !glowScale ||
      !statHp ||
      !statSpeed ||
      !statRadius ||
      !statContactDamage ||
      !behaviorParams ||
      !attackLoadout ||
      !attackTesterAttackSelect ||
      !attackTesterSlotList ||
      !attackTesterParams ||
      !squadSelect ||
      !customSquadSelect ||
      !squadName ||
      !squadStatus ||
      !squadNotes ||
      !squadEntries ||
      !spawnCount ||
      !speedMultiplier ||
      !hpMultiplier ||
      !fireRateMultiplier ||
      !deconflictionStrength ||
      !fps ||
      !status
    ) {
      throw new Error('Enemy lab overlay failed to initialize.');
    }

    for (const definition of getEnemyLabDefinitions()) {
      enemySelect.add(new Option(definition.displayName, definition.id));
    }
    for (const squad of getEnemyLabSquads()) {
      squadSelect.add(new Option(squad.displayName, squad.id));
    }
    for (const status of ENEMY_LAB_ASSET_STATUSES) {
      variantStatus.add(new Option(status, status));
      squadStatus.add(new Option(status, status));
    }
    for (const attack of getEnemyAttackDefinitions()) {
      attackTesterAttackSelect.add(new Option(`${attack.displayName} (${attack.id})`, attack.id));
    }
    this.populateForgeColorSelect(forgeLayerColor);
    this.populateForgeColorSelect(forgeLayerStrokeColor);
    for (const status of FORGE_ASSET_STATUSES) {
      forgeAssetStatus.add(new Option(status, status));
    }
    for (const taskType of FORGE_AI_TASK_OPTIONS) {
      forgeAiTaskType.add(new Option(taskType, taskType));
    }
    for (const kind of FORGE_ASSET_KIND_OPTIONS) {
      forgeAiAssetKind.add(new Option(kind, kind));
    }
    this.populateForgeTemplateSelect(forgeAiTemplate, this.forgeAiAssetKind);

    this.overlay = {
      root,
      toggleOverlayButton,
      forgeAssetSelect,
      forgeAssetStatus,
      forgePreviewMode,
      forgePreview,
      forgeLayerSelect,
      forgeLayerColor,
      forgeLayerStrokeColor,
      forgeLayerAlpha,
      forgeLayerStrokeWidth,
      forgeBatchCount,
      forgeAiTaskType,
      forgeAiAssetKind,
      forgeAiTemplate,
      forgeAiRole,
      forgeAiProductionTarget,
      forgeImportReport,
      forgePaletteInputs: forgePaletteInputs as Record<keyof ForgePalette, HTMLInputElement>,
      enemySelect,
      variantSelect,
      variantName,
      variantStatus,
      variantNotes,
      variantTags,
      visualScale,
      scaleX,
      scaleY,
      rotationOffset,
      glowScale,
      statHp,
      statSpeed,
      statRadius,
      statContactDamage,
      behaviorParams,
      attackLoadout,
      attackTesterAttackSelect,
      attackTesterSlotList,
      attackTesterParams,
      squadSelect,
      customSquadSelect,
      squadName,
      squadStatus,
      squadNotes,
      squadEntries,
      spawnCount,
      speedMultiplier,
      hpMultiplier,
      fireRateMultiplier,
      deconflictionStrength,
      fps,
      status
    };

    enemySelect.addEventListener('change', () => {
      this.selectedEnemyIndex = Math.max(0, getEnemyLabDefinitions().findIndex((definition) => definition.id === enemySelect.value));
      this.selectedVariantId = '';
      this.selectedForgeAssetId = '';
      this.selectedForgeLayerIndex = 0;
      this.populateVariantSelect();
      this.syncVariantControlsFromState();
      this.syncForgeControlsFromState();
      this.renderAttackWorkflowControls();
    });
    forgeAssetSelect.addEventListener('change', () => {
      this.selectedForgeAssetId = forgeAssetSelect.value;
      this.selectedForgeLayerIndex = 0;
      this.syncForgeControlsFromState();
    });
    forgeAssetStatus.addEventListener('change', () => {
      this.persistForgeStatusFromControls();
    });
    forgePreviewMode.addEventListener('change', () => {
      this.forgePreviewMode = this.normalizeForgePreviewMode(forgePreviewMode.value);
      this.renderForgePreview();
    });
    forgeLayerSelect.addEventListener('change', () => {
      this.selectedForgeLayerIndex = Math.max(0, Number(forgeLayerSelect.value) || 0);
      this.syncForgeLayerControlsFromState();
      this.renderForgePreview();
    });
    for (const input of Object.values(forgePaletteInputs)) {
      input?.addEventListener('input', () => this.persistForgePaletteFromControls());
      input?.addEventListener('change', () => this.persistForgePaletteFromControls());
    }
    for (const input of [forgeLayerColor, forgeLayerStrokeColor, forgeLayerAlpha, forgeLayerStrokeWidth]) {
      input.addEventListener('input', () => this.persistForgeLayerFromControls());
      input.addEventListener('change', () => this.persistForgeLayerFromControls());
    }
    forgeBatchCount.addEventListener('input', () => {
      this.forgeBatchCount = Phaser.Math.Clamp(Math.round(Number(forgeBatchCount.value) || 8), 1, 40);
    });
    forgeAiTaskType.addEventListener('change', () => {
      this.forgeAiTaskType = this.normalizeForgeAiTaskType(forgeAiTaskType.value);
      this.syncAiWorkbenchControlsFromState();
    });
    forgeAiAssetKind.addEventListener('change', () => {
      this.forgeAiAssetKind = this.normalizeForgeAssetKind(forgeAiAssetKind.value);
      const template = getForgeAssetTemplates(this.forgeAiAssetKind)[0];
      if (template) {
        this.forgeAiTemplateId = template.id;
        this.forgeAiRole = template.role;
      }
      this.syncAiWorkbenchControlsFromState();
    });
    forgeAiTemplate.addEventListener('change', () => {
      this.forgeAiTemplateId = this.normalizeForgeTemplateId(forgeAiTemplate.value);
      const template = getForgeAssetTemplates().find((candidate) => candidate.id === this.forgeAiTemplateId);
      if (template) {
        this.forgeAiAssetKind = template.kind;
        this.forgeAiRole = template.role;
      }
      this.syncAiWorkbenchControlsFromState();
    });
    forgeAiRole.addEventListener('input', () => {
      this.forgeAiRole = forgeAiRole.value.trim() || this.forgeAiRole;
    });
    forgeAiProductionTarget.addEventListener('input', () => {
      this.forgeAiProductionTarget = forgeAiProductionTarget.value.trim();
    });
    variantSelect.addEventListener('change', () => {
      this.selectedVariantId = variantSelect.value;
      this.hydrateBasicLoadoutDraftFromSelectedVariant();
      this.syncVariantControlsFromState();
      this.syncForgeControlsFromState();
      this.renderAttackWorkflowControls();
    });
    for (const input of [variantName, variantStatus, variantNotes, visualScale, scaleX, scaleY, rotationOffset, glowScale, statHp, statSpeed, statRadius, statContactDamage]) {
      input.addEventListener('input', () => this.persistVariantFromControls(false));
      input.addEventListener('change', () => this.persistVariantFromControls(true));
    }
    attackTesterAttackSelect.addEventListener('change', () => {
      this.selectedAttackTestId = this.normalizeAttackId(attackTesterAttackSelect.value);
      this.setLoadoutSlotAttack('attackTester', this.selectedAttackTesterSlotIndex, this.selectedAttackTestId);
      this.renderAttackWorkflowControls();
    });
    squadSelect.addEventListener('change', () => {
      this.selectedSquadIndex = Math.max(0, getEnemyLabSquads().findIndex((squad) => squad.id === squadSelect.value));
      this.selectedCustomSquadId = '';
      this.selectedSquadEntryIndex = -1;
      this.selectedSquadLoadoutSlotIndex = 0;
      this.syncSquadControlsFromState();
    });
    customSquadSelect.addEventListener('change', () => {
      this.selectedCustomSquadId = customSquadSelect.value;
      this.selectedSquadEntryIndex = -1;
      this.selectedSquadLoadoutSlotIndex = 0;
      this.syncSquadControlsFromState();
    });
    for (const input of [squadName, squadStatus, squadNotes]) {
      input.addEventListener('input', () => this.persistSquadFromControls());
      input.addEventListener('change', () => this.persistSquadFromControls());
    }
    spawnCount.addEventListener('input', () => {
      this.spawnCount = Phaser.Math.Clamp(Number(spawnCount.value) || 1, 1, 9999);
    });
    speedMultiplier.addEventListener('input', () => {
      this.enemySpeedMultiplier = Number(speedMultiplier.value) || 1;
    });
    hpMultiplier.addEventListener('input', () => {
      this.enemyHpMultiplier = Number(hpMultiplier.value) || 1;
    });
    fireRateMultiplier.addEventListener('input', () => {
      this.enemyFireRateMultiplier = Number(fireRateMultiplier.value) || 1;
    });
    deconflictionStrength.addEventListener('input', () => {
      this.enemyDeconflictionStrength = Number(deconflictionStrength.value) || 0;
    });

    root.addEventListener('keydown', (event) => {
      if (this.isEditablePanelTarget(event.target)) {
        event.stopPropagation();
      }
    });
    root.addEventListener('keyup', (event) => {
      if (this.isEditablePanelTarget(event.target)) {
        event.stopPropagation();
      }
    });
    root.addEventListener('keypress', (event) => {
      if (this.isEditablePanelTarget(event.target)) {
        event.stopPropagation();
      }
    });
    root.addEventListener('pointerenter', () => {
      this.isPointerOverControlPanel = true;
    });
    root.addEventListener('pointerleave', () => {
      this.isPointerOverControlPanel = false;
    });
    root.addEventListener('pointerdown', (event) => {
      this.isPointerOverControlPanel = true;
      event.stopPropagation();
    });
    root.addEventListener('pointerup', (event) => {
      event.stopPropagation();
    });

    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const labMode = target.dataset.labMode as EnemyLabMode | undefined;
      if (labMode) {
        this.setLabMode(labMode);
        return;
      }

      const previewState = target.dataset.previewState as EnemyLabPreviewState | undefined;
      if (previewState) {
        this.previewEnemyState(previewState);
        this.syncOverlayFromState();
        return;
      }

      const readabilityMode = target.dataset.readabilityMode as EnemyLabReadabilityMode | undefined;
      if (readabilityMode) {
        this.setReadabilityMode(readabilityMode);
        return;
      }

      const clutterTest = target.dataset.clutterTest as EnemyLabClutterTest | undefined;
      if (clutterTest) {
        this.spawnClutterTest(clutterTest);
        this.syncOverlayFromState();
        return;
      }

      const tag = target.dataset.tag;
      if (tag) {
        this.toggleSelectedVariantTag(tag);
        return;
      }

      const entryAction = target.dataset.entryAction;
      if (entryAction) {
        this.handleSquadEntryAction(entryAction, Number(target.dataset.entryIndex));
        return;
      }

      const loadoutAction = target.dataset.loadoutAction;
      if (loadoutAction) {
        this.handleLoadoutAction(target.dataset.loadoutScope as AttackLoadoutEditorScope | undefined, loadoutAction, Number(target.dataset.loadoutIndex));
        return;
      }

      const action = target.dataset.action;
      if (!action) {
        return;
      }

      if (action === 'spawn') this.spawnSelectedEnemy();
      if (action === 'toggleOverlay') this.setOverlayCollapsed(!this.isOverlayCollapsed);
      if (action === 'squad') this.spawnSelectedSquad();
      if (action === 'clear') this.clearEnemies();
      if (action === 'newVariant') this.createVariantForSelectedEnemy();
      if (action === 'saveVariant') this.persistVariantFromControls(true);
      if (action === 'resetVariant') this.resetSelectedVariant();
      if (action === 'deleteVariant') this.deleteSelectedVariant();
      if (action === 'exportVariant') this.exportSelectedVariant();
      if (action === 'loadVariant') this.loadEnemyVariantPreset();
      if (action === 'importPreset') this.importEnemyLabPreset();
      if (action === 'saveAttackLoadout') this.saveSelectedAttackLoadoutPreset();
      if (action === 'loadAttackLoadout') this.loadAttackLoadoutPreset();
      if (action === 'saveAttackTest') this.saveAttackTestPreset();
      if (action === 'loadAttackTest') this.loadAttackTestPreset();
      if (action === 'attackTesterFireOnce') this.fireSelectedAttackTesterSlot();
      if (action === 'attackTesterAutoCycle') this.toggleAttackTesterAutoCycle();
      if (action === 'attackTesterSpawnDummy') this.spawnAttackTestTarget('dummy');
      if (action === 'attackTesterSpawnEnemy') this.spawnAttackTestTarget('enemy');
      if (action === 'attackTesterSpawnAlly') this.spawnAttackTestTarget('ally');
      if (action === 'attackTesterClear') this.clearAttackTests();
      if (action === 'openVariantFolder') this.openEnemyLabPresetFolder('variants');
      if (action === 'openSquadFolder') this.openEnemyLabPresetFolder('squads');
      if (action === 'openLoadoutFolder') this.openEnemyLabPresetFolder('loadouts');
      if (action === 'openAttackTestFolder') this.openEnemyLabPresetFolder('attack-tests');
      if (action === 'exportForgeSvg') this.exportSelectedForgeSvg();
      if (action === 'exportForgeJson') this.exportSelectedForgeJson();
      if (action === 'exportContactSheet') this.exportForgeContactSheet();
      if (action === 'importForgeAsset') this.importForgeAsset();
      if (action === 'exportForgeAiTask') this.exportForgeAiTask();
      if (action === 'importForgeAiResponse') this.importForgeAiResponse();
      if (action === 'validateForgeAsset') this.validateSelectedForgeAsset();
      if (action === 'exportForgeRepairPrompt') this.exportForgeRepairPrompt();
      if (action === 'exportForgePromotion') this.exportForgePromotionBundle();
      if (action === 'promoteForgeAsset') this.promoteSelectedForgeAsset();
      if (action === 'exportForgeBatchBrief') this.exportForgeBatchAiBrief();
      if (action === 'importForgeBatch') this.importForgeAsset();
      if (action === 'createForgeDraft') this.createForgeDraftForSelectedEnemy();
      if (action === 'createProjectileForgeDraft') this.createProjectileForgeDraft();
      if (action === 'createWeaponForgeDraft') this.createWeaponForgeDraft();
      if (action === 'saveForgeAsset') this.saveSelectedForgeAsset();
      if (action === 'deleteForgeAsset') this.deleteSelectedForgeAsset();
      if (action === 'forgeMoveLeft') this.transformSelectedForgeLayer((layer) => this.translateForgeLayer(layer, -5, 0));
      if (action === 'forgeMoveRight') this.transformSelectedForgeLayer((layer) => this.translateForgeLayer(layer, 5, 0));
      if (action === 'forgeMoveUp') this.transformSelectedForgeLayer((layer) => this.translateForgeLayer(layer, 0, -5));
      if (action === 'forgeMoveDown') this.transformSelectedForgeLayer((layer) => this.translateForgeLayer(layer, 0, 5));
      if (action === 'forgeScaleDown') this.transformSelectedForgeLayer((layer) => this.scaleForgeLayer(layer, 0.92));
      if (action === 'forgeScaleUp') this.transformSelectedForgeLayer((layer) => this.scaleForgeLayer(layer, 1.08));
      if (action === 'forgeMirrorX') this.transformSelectedForgeLayer((layer) => this.mirrorForgeLayerX(layer));
      if (action === 'forgeAddGlow') this.addForgeLayer('glow');
      if (action === 'forgeAddRing') this.addForgeLayer('ring');
      if (action === 'forgeAddCore') this.addForgeLayer('core');
      if (action === 'forgeAddPlate') this.addForgeLayer('plate');
      if (action === 'forgeDuplicateLayer') this.duplicateSelectedForgeLayer();
      if (action === 'forgeDeleteLayer') this.deleteSelectedForgeLayer();
      if (action === 'exportAiBrief') this.exportAiBrief();
      if (action === 'exportPromotion') this.exportPromotionReport();
      if (action === 'newSquad') this.createNewCustomSquad();
      if (action === 'copyBuiltInSquad') this.copyBuiltInSquad();
      if (action === 'addSquadEntry') this.addSelectedEnemyToSquad();
      if (action === 'spawnSquad') this.spawnSelectedSquad();
      if (action === 'exportSquad') this.exportSelectedSquad();
      if (action === 'loadSquad') this.loadEnemySquadPreset();
      if (action === 'deleteSquad') this.deleteSelectedSquad();
      if (action === 'rotateSquadLeft') this.transformSelectedSquad((entry) => this.rotateSquadEntry(entry, -15));
      if (action === 'rotateSquadRight') this.transformSelectedSquad((entry) => this.rotateSquadEntry(entry, 15));
      if (action === 'scaleSquadDown') this.transformSelectedSquad((entry) => ({ ...entry, x: Math.round(entry.x * 0.86), y: Math.round(entry.y * 0.86) }));
      if (action === 'scaleSquadUp') this.transformSelectedSquad((entry) => ({ ...entry, x: Math.round(entry.x * 1.16), y: Math.round(entry.y * 1.16) }));
      if (action === 'mirrorSquad') this.transformSelectedSquad((entry) => ({ ...entry, x: -entry.x }));
      if (action === 'clearSquad') this.clearSelectedSquad();
      if (action === 'ai') this.isAiEnabled = !this.isAiEnabled;
      if (action === 'invuln') this.isPlayerInvulnerable = !this.isPlayerInvulnerable;
      if (action === 'labels') {
        this.showDebugLabels = !this.showDebugLabels;
        setEnemyLabDebugLabels(this, this.enemies, this.showDebugLabels);
      }
      if (action === 'telegraphs') this.showTelegraphs = !this.showTelegraphs;
      if (action === 'deconflict') this.enemyDeconflictionEnabled = !this.enemyDeconflictionEnabled;
      if (action === 'collisionDebug') {
        this.enemyCollisionDebugEnabled = !this.enemyCollisionDebugEnabled;
        if (!this.enemyCollisionDebugEnabled) {
          this.clearEnemyCollisionDebug();
        }
      }
      if (action === 'reducedEffects') this.reducedEffects = !this.reducedEffects;
      if (action === 'clearProps') {
        this.clearPreviewBodies();
        this.clearTestProps();
      }
      if (action === 'exportDiagnostics') this.exportDiagnosticsReport();
      if (action === 'pause') this.isSimulationPaused = !this.isSimulationPaused;
      this.syncOverlayFromState();
    });

    root.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target.dataset.loadoutField || target.dataset.loadoutParam) {
        this.updateLoadoutSlotFromInput(target);
      }
      if (target.dataset.behaviorParam) {
        this.persistVariantFromControls(false);
      }
      if (target.dataset.entryField) {
        this.updateSquadEntryFromInput(target);
      }
    });
    root.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target.dataset.loadoutField || target.dataset.loadoutParam) {
        this.updateLoadoutSlotFromInput(target);
      }
    });

    this.populateVariantSelect();
    this.populateCustomSquadSelect();
    this.populateForgeAssetSelect();
    this.renderQuickTags();
    this.renderBehaviorParamControls();
    this.renderSquadEntries();
    this.syncOverlayFromState();
  }

  private populateVariantSelect(): void {
    if (!this.overlay) {
      return;
    }

    const selectedDefinition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const variants = this.presetState.variants.filter((variant) => variant.baseDefinitionId === selectedDefinition.id);
    this.overlay.variantSelect.replaceChildren(new Option('Base definition', ''));
    for (const variant of variants) {
      this.overlay.variantSelect.add(new Option(variant.displayName, variant.id));
    }

    if (this.selectedVariantId && !variants.some((variant) => variant.id === this.selectedVariantId)) {
      this.selectedVariantId = '';
    }
    this.overlay.variantSelect.value = this.selectedVariantId;
  }

  private populateCustomSquadSelect(): void {
    if (!this.overlay) {
      return;
    }

    this.overlay.customSquadSelect.replaceChildren(new Option('None', ''));
    for (const squad of this.presetState.squads) {
      this.overlay.customSquadSelect.add(new Option(squad.displayName, squad.id));
    }
    if (this.selectedCustomSquadId && !this.presetState.squads.some((squad) => squad.id === this.selectedCustomSquadId)) {
      this.selectedCustomSquadId = '';
    }
    this.overlay.customSquadSelect.value = this.selectedCustomSquadId;
  }

  private populateForgeAssetSelect(): void {
    if (!this.overlay) {
      return;
    }

    const baseAsset = this.getBaseForgeAsset();
    this.overlay.forgeAssetSelect.replaceChildren(new Option(`${baseAsset.displayName} (live source)`, ''));
    for (const asset of this.presetState.forgeAssets) {
      this.overlay.forgeAssetSelect.add(new Option(`${asset.displayName} (${asset.status})`, asset.id));
    }
    if (this.selectedForgeAssetId && !this.presetState.forgeAssets.some((asset) => asset.id === this.selectedForgeAssetId)) {
      this.selectedForgeAssetId = '';
    }
    this.overlay.forgeAssetSelect.value = this.selectedForgeAssetId;
  }

  private syncForgeControlsFromState(): void {
    if (!this.overlay) {
      return;
    }

    this.populateForgeAssetSelect();
    const asset = this.getSelectedForgeAsset();
    this.overlay.forgeAssetStatus.value = asset.status;
    this.overlay.forgeAssetStatus.disabled = !this.selectedForgeAssetId;
    this.overlay.forgePreviewMode.value = this.forgePreviewMode;
    for (const key of FORGE_PALETTE_KEYS) {
      this.overlay.forgePaletteInputs[key].value = this.colorNumberToInput(asset.palette[key]);
    }
    this.renderForgeLayerSelect();
    this.syncForgeLayerControlsFromState();
    this.renderForgePreview();
  }

  private renderForgeLayerSelect(): void {
    if (!this.overlay) {
      return;
    }

    const asset = this.getSelectedForgeAsset();
    this.overlay.forgeLayerSelect.replaceChildren();
    asset.layers.forEach((layer, index) => {
      this.overlay?.forgeLayerSelect.add(new Option(`${index + 1}. ${layer.id} (${layer.type})`, String(index)));
    });
    this.selectedForgeLayerIndex = Phaser.Math.Clamp(this.selectedForgeLayerIndex, 0, Math.max(0, asset.layers.length - 1));
    this.overlay.forgeLayerSelect.value = String(this.selectedForgeLayerIndex);
  }

  private syncForgeLayerControlsFromState(): void {
    if (!this.overlay) {
      return;
    }

    const layer = this.getSelectedForgeLayer();
    const editable = Boolean(layer);
    this.overlay.forgeLayerColor.value = this.getForgeColorControlValue(layer?.color);
    this.overlay.forgeLayerStrokeColor.value = this.getForgeColorControlValue(layer?.strokeColor);
    this.overlay.forgeLayerAlpha.value = String(layer?.alpha ?? 1);
    this.overlay.forgeLayerStrokeWidth.value = String(layer?.strokeWidth ?? 2);
    this.overlay.forgeLayerColor.disabled = !editable;
    this.overlay.forgeLayerStrokeColor.disabled = !editable;
    this.overlay.forgeLayerAlpha.disabled = !editable;
    this.overlay.forgeLayerStrokeWidth.disabled = !editable;
  }

  private populateForgeColorSelect(select: HTMLSelectElement): void {
    select.replaceChildren(new Option('None', ''));
    for (const key of FORGE_COLOR_OPTIONS) {
      select.add(new Option(key, key));
    }
  }

  private populateForgeTemplateSelect(select: HTMLSelectElement, kind: ForgeAssetKind): void {
    select.replaceChildren();
    const templates = getForgeAssetTemplates(kind);
    for (const template of templates) {
      select.add(new Option(`${template.displayName} (${template.id})`, template.id));
    }
  }

  private persistForgePaletteFromControls(): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset || !this.overlay) {
      return;
    }

    for (const key of FORGE_PALETTE_KEYS) {
      asset.palette[key] = this.colorInputToNumber(this.overlay.forgePaletteInputs[key].value, asset.palette[key]);
    }
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.renderForgePreview();
  }

  private persistForgeStatusFromControls(): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset || !this.overlay) {
      return;
    }

    const selectedStatus = this.overlay.forgeAssetStatus.value;
    if (!FORGE_ASSET_STATUSES.includes(selectedStatus as ForgeAsset['status'])) {
      return;
    }

    asset.status = selectedStatus as ForgeAsset['status'];
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private persistForgeLayerFromControls(): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset || !this.overlay) {
      return;
    }

    const layer = asset.layers[this.selectedForgeLayerIndex];
    if (!layer) {
      return;
    }

    layer.color = this.readForgeColorControl(this.overlay.forgeLayerColor.value, layer.color);
    layer.strokeColor = this.readForgeColorControl(this.overlay.forgeLayerStrokeColor.value, layer.strokeColor);
    layer.alpha = this.readNumberInput(this.overlay.forgeLayerAlpha, layer.alpha ?? 1, true);
    layer.strokeWidth = this.readNumberInput(this.overlay.forgeLayerStrokeWidth, layer.strokeWidth ?? 2, true);
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.renderForgePreview();
  }

  private createForgeDraftForSelectedEnemy(): void {
    const source = this.getSelectedForgeAsset();
    const draft = this.cloneForgeAsset(source);
    draft.id = `forge.${slugify(draft.displayName)}.${Date.now()}`;
    draft.displayName = `${draft.displayName} Draft`;
    draft.status = 'Visual Pass';
    draft.savedAt = new Date().toISOString();
    this.presetState.forgeAssets.push(draft);
    this.selectedForgeAssetId = draft.id;
    this.selectedForgeLayerIndex = 0;
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private createProjectileForgeDraft(): void {
    const draft = createForgeAssetFromTemplate('projectile.neon-bolt', {
      displayName: 'New Projectile Draft',
      role: 'neon-bolt',
      productionTarget: this.forgeAiProductionTarget || undefined
    });
    this.presetState.forgeAssets.push(draft);
    this.selectedForgeAssetId = draft.id;
    this.selectedForgeLayerIndex = 0;
    this.forgePreviewMode = 'projectile-motion';
    this.forgeAiAssetKind = 'projectile';
    this.forgeAiTemplateId = 'projectile.neon-bolt';
    this.forgeAiRole = 'neon-bolt';
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private createWeaponForgeDraft(): void {
    const draft = createForgeAssetFromTemplate('weapon.icon.cannon', {
      displayName: 'New Weapon Icon Draft',
      role: 'weapon-icon-cannon',
      productionTarget: this.forgeAiProductionTarget || undefined
    });
    this.presetState.forgeAssets.push(draft);
    this.selectedForgeAssetId = draft.id;
    this.selectedForgeLayerIndex = 0;
    this.forgePreviewMode = 'weapon-icon';
    this.forgeAiAssetKind = 'weapon';
    this.forgeAiTemplateId = 'weapon.icon.cannon';
    this.forgeAiRole = 'weapon-icon-cannon';
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private createImportedForgeDraft(asset: ForgeAsset, index: number): ForgeAsset {
    const imported = this.cloneForgeAsset(asset);
    imported.id = `${asset.id}.${Date.now()}.${index + 1}`;
    imported.status = asset.status === 'Promoted' || asset.status === 'Implemented' ? 'Generated' : asset.status;
    imported.tags = Array.from(new Set([...imported.tags, 'ai-batch-import']));
    imported.savedAt = new Date().toISOString();
    return imported;
  }

  private saveSelectedForgeAsset(): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset) {
      return;
    }

    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private deleteSelectedForgeAsset(): void {
    if (!this.selectedForgeAssetId) {
      return;
    }
    const asset = this.presetState.forgeAssets.find((candidate) => candidate.id === this.selectedForgeAssetId);
    if (!asset || !window.confirm(`Delete Forge asset "${asset.displayName}"?`)) {
      return;
    }

    this.presetState.forgeAssets = this.presetState.forgeAssets.filter((candidate) => candidate.id !== asset.id);
    this.selectedForgeAssetId = '';
    this.selectedForgeLayerIndex = 0;
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private transformSelectedForgeLayer(transform: (layer: ForgeVectorLayer) => ForgeVectorLayer): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset) {
      return;
    }
    const layer = asset.layers[this.selectedForgeLayerIndex];
    if (!layer) {
      return;
    }

    asset.layers[this.selectedForgeLayerIndex] = transform(this.cloneForgeLayer(layer));
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private addForgeLayer(kind: 'glow' | 'ring' | 'core' | 'plate'): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset) {
      return;
    }
    const radius = Math.max(8, asset.boundsRadius * 0.42);
    const id = `${kind}-${asset.layers.length + 1}`;
    const layer: ForgeVectorLayer =
      kind === 'glow'
        ? { id, type: 'glow', x: 0, y: 0, radius: asset.boundsRadius * 0.9, color: 'neonPrimary', innerAlpha: 0.28, role: 'crisp neon glow' }
        : kind === 'ring'
          ? { id, type: 'ring', x: 0, y: 0, radius, strokeColor: 'neonPrimary', strokeAlpha: 0.86, strokeWidth: 2.5, role: 'holographic ring' }
          : kind === 'core'
            ? { id, type: 'ellipse', x: 0, y: 0, radiusX: radius * 0.35, radiusY: radius * 0.35, color: 'neonSecondary', alpha: 0.9, fill: true, blend: 'lighter', role: 'dominant neon core' }
            : { id, type: 'rect', x: -radius * 0.55, y: -radius * 0.16, width: radius * 1.1, height: radius * 0.32, color: 'metalWarm', alpha: 0.88, strokeColor: 'outline', strokeWidth: 1.5, role: 'riveted salvage plate' };

    asset.layers.push(layer);
    this.selectedForgeLayerIndex = asset.layers.length - 1;
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private duplicateSelectedForgeLayer(): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset) {
      return;
    }
    const layer = asset.layers[this.selectedForgeLayerIndex];
    if (!layer) {
      return;
    }

    const duplicate = this.translateForgeLayer(this.cloneForgeLayer(layer), 6, 6);
    duplicate.id = `${layer.id}-copy-${Date.now().toString().slice(-4)}`;
    asset.layers.splice(this.selectedForgeLayerIndex + 1, 0, duplicate);
    this.selectedForgeLayerIndex += 1;
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private deleteSelectedForgeLayer(): void {
    const asset = this.ensureForgeDraftForEditing();
    if (!asset || asset.layers.length <= 1) {
      return;
    }
    asset.layers.splice(this.selectedForgeLayerIndex, 1);
    this.selectedForgeLayerIndex = Phaser.Math.Clamp(this.selectedForgeLayerIndex, 0, asset.layers.length - 1);
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private syncVariantControlsFromState(): void {
    if (!this.overlay) {
      return;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const variant = this.getSelectedVariant();
    const defaultVisualScale = resolveEnemyVisualScale(definition.visual);
    const hasVariant = Boolean(variant);
    this.overlay.variantSelect.value = this.selectedVariantId;
    this.overlay.variantName.value = variant?.displayName ?? `${definition.displayName} Variant`;
    this.overlay.variantName.disabled = false;
    this.overlay.variantStatus.value = variant?.status ?? 'Idea';
    this.overlay.variantStatus.disabled = false;
    this.overlay.variantNotes.value = variant?.notes ?? '';
    this.overlay.variantNotes.disabled = false;
    this.overlay.visualScale.value = String(variant?.visualOverrides.visualScale ?? 1);
    this.overlay.scaleX.value = String(variant?.visualOverrides.scaleX ?? defaultVisualScale.scaleX);
    this.overlay.scaleY.value = String(variant?.visualOverrides.scaleY ?? defaultVisualScale.scaleY);
    this.overlay.rotationOffset.value = String(variant?.visualOverrides.rotationOffsetDegrees ?? 0);
    this.overlay.glowScale.value = String(variant?.visualOverrides.glowScale ?? 1);
    this.overlay.statHp.value = String(variant?.statOverrides.hp ?? definition.stats.hp);
    this.overlay.statSpeed.value = String(variant?.statOverrides.speed ?? definition.stats.speed);
    this.overlay.statRadius.value = String(variant?.statOverrides.radius ?? definition.stats.radius);
    this.overlay.statContactDamage.value = String(variant?.statOverrides.contactDamage ?? definition.stats.contactDamage);
    for (const input of [
      this.overlay.visualScale,
      this.overlay.scaleX,
      this.overlay.scaleY,
      this.overlay.rotationOffset,
      this.overlay.glowScale,
      this.overlay.statHp,
      this.overlay.statSpeed,
      this.overlay.statRadius,
      this.overlay.statContactDamage
    ]) {
      input.disabled = false;
    }
    this.renderQuickTags();
    this.renderBehaviorParamControls();
    this.setActionsEnabled(['saveVariant', 'resetVariant', 'deleteVariant', 'exportVariant', 'exportPromotion'], hasVariant);
    this.setActionsEnabled(['exportAiBrief'], hasVariant || Boolean(this.getSelectedCustomSquad()));
  }

  private syncSquadControlsFromState(): void {
    if (!this.overlay) {
      return;
    }

    const squad = this.getSelectedCustomSquad();
    const hasSquad = Boolean(squad);
    this.overlay.customSquadSelect.value = this.selectedCustomSquadId;
    this.overlay.squadName.value = squad?.displayName ?? 'Custom Squad';
    this.overlay.squadName.disabled = false;
    this.overlay.squadStatus.value = squad?.status ?? 'Idea';
    this.overlay.squadStatus.disabled = false;
    this.overlay.squadNotes.value = squad?.notes ?? '';
    this.overlay.squadNotes.disabled = false;
    this.renderSquadEntries();
    this.setActionsEnabled(
      ['exportSquad', 'deleteSquad', 'rotateSquadLeft', 'rotateSquadRight', 'scaleSquadDown', 'scaleSquadUp', 'mirrorSquad', 'clearSquad'],
      hasSquad
    );
    this.setActionsEnabled(['exportAiBrief'], hasSquad || Boolean(this.getSelectedVariant()));
  }

  private persistVariantFromControls(clampNumbers = true): void {
    const variant = this.ensureVariantDraftForEditing();
    if (!variant || !this.overlay) {
      return;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const defaultVisualScale = resolveEnemyVisualScale(definition.visual);
    variant.displayName = this.overlay.variantName.value.trim() || variant.displayName;
    variant.status = this.overlay.variantStatus.value as EnemyLabAssetStatus;
    variant.notes = this.overlay.variantNotes.value;
    variant.visualOverrides = {
      visualScale: this.readNumberInput(this.overlay.visualScale, 1, clampNumbers),
      scaleX: this.readNumberInput(this.overlay.scaleX, defaultVisualScale.scaleX, clampNumbers),
      scaleY: this.readNumberInput(this.overlay.scaleY, defaultVisualScale.scaleY, clampNumbers),
      rotationOffsetDegrees: this.readNumberInput(this.overlay.rotationOffset, 0, clampNumbers),
      glowScale: this.readNumberInput(this.overlay.glowScale, 1, clampNumbers)
    };
    variant.statOverrides = {
      hp: this.readNumberInput(this.overlay.statHp, variant.statOverrides.hp ?? 1, clampNumbers),
      speed: this.readNumberInput(this.overlay.statSpeed, variant.statOverrides.speed ?? 1, clampNumbers),
      radius: this.readNumberInput(this.overlay.statRadius, variant.statOverrides.radius ?? 1, clampNumbers),
      contactDamage: this.readNumberInput(this.overlay.statContactDamage, variant.statOverrides.contactDamage ?? 0, clampNumbers)
    };
    const behaviorParamInputs = this.overlay.behaviorParams.querySelectorAll<HTMLInputElement>('[data-behavior-param]');
    for (const input of behaviorParamInputs) {
      const key = input.dataset.behaviorParam;
      if (!key) {
        continue;
      }
      variant.behaviorParamOverrides[key] = input.type === 'number' ? this.readNumberInput(input, 0, clampNumbers) : input.value;
    }
    variant.attackLoadoutOverride = normalizeAttackLoadoutSlots(this.getBasicLoadoutDraft(definition.id));
    variant.savedAt = new Date().toISOString();
    this.savePresetState();
    this.populateVariantSelect();
  }

  private persistSquadFromControls(): void {
    const squad = this.ensureCustomSquadForEditing();
    if (!squad || !this.overlay) {
      return;
    }

    squad.displayName = this.overlay.squadName.value.trim() || squad.displayName;
    squad.status = this.overlay.squadStatus.value as EnemyLabAssetStatus;
    squad.notes = this.overlay.squadNotes.value;
    squad.savedAt = new Date().toISOString();
    this.savePresetState();
    this.populateCustomSquadSelect();
  }

  private createVariantForSelectedEnemy(): void {
    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const current = this.getSelectedVariant();
    const variant = current ? duplicateVariant(current) : createVariantFromDefinition(definition);
    this.presetState.variants.push(variant);
    this.selectedVariantId = variant.id;
    this.hydrateBasicLoadoutDraftFromSelectedVariant();
    this.savePresetState();
    this.populateVariantSelect();
    this.syncVariantControlsFromState();
  }

  private ensureVariantDraftForEditing(): EnemyLabVariantPreset | undefined {
    const existing = this.getSelectedVariant();
    if (existing) {
      return existing;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    if (!definition) {
      return undefined;
    }

    const variant = createVariantFromDefinition(definition);
    this.presetState.variants.push(variant);
    this.selectedVariantId = variant.id;
    this.populateVariantSelect();
    this.setActionsEnabled(['saveVariant', 'resetVariant', 'deleteVariant', 'exportVariant', 'exportPromotion'], true);
    this.setActionsEnabled(['exportAiBrief'], true);
    return variant;
  }

  private resetSelectedVariant(): void {
    const variant = this.getSelectedVariant();
    if (!variant) {
      return;
    }

    const definition = getEnemyLabDefinitions().find((candidate) => candidate.id === variant.baseDefinitionId);
    if (!definition) {
      return;
    }

    const reset = createVariantFromDefinition(definition);
    variant.visualOverrides = reset.visualOverrides;
    variant.statOverrides = reset.statOverrides;
    variant.behaviorParamOverrides = reset.behaviorParamOverrides;
    variant.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncVariantControlsFromState();
  }

  private exportSelectedVariant(): void {
    const variant = this.getSelectedVariant();
    if (!variant) {
      return;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    if (variant.baseDefinitionId === definition.id) {
      variant.attackLoadoutOverride = normalizeAttackLoadoutSlots(this.getBasicLoadoutDraft(definition.id));
      variant.savedAt = new Date().toISOString();
      this.savePresetState();
    }

    this.saveEnemyLabPresetMarkdown(
      'variants',
      this.createPresetFilename('enemy', variant.displayName),
      createEnemyVariantMarkdown(variant),
      `Saved variant preset: ${variant.displayName}`
    );
  }

  private loadEnemyVariantPreset(): void {
    loadMarkdownFile((contents) => {
      const preset = parseEnemyVariantPresetMarkdown(contents);
      if (!preset) {
        this.setPresetStatus('Load rejected: expected an Enemy Lab variant preset.', true);
        return;
      }

      this.importVariantPresetFromFile(preset);
    });
  }

  private exportSelectedForgeSvg(): void {
    const asset = this.getSelectedForgeAsset();
    downloadTextFile(
      `forge-${slugify(asset.displayName)}-${this.time.now.toFixed(0)}.svg`,
      renderForgeAssetToSvg(asset, { includeMetadata: true }),
      'image/svg+xml',
      'debug-presets'
    );
  }

  private exportSelectedForgeJson(): void {
    const asset = this.getSelectedForgeAsset();
    downloadTextFile(
      `forge-${slugify(asset.displayName)}-${this.time.now.toFixed(0)}.md`,
      this.createForgeAssetMarkdown(asset),
      'text/markdown'
    );
  }

  private exportForgeContactSheet(): void {
    const assets = this.getForgeContactSheetAssets();
    downloadTextFile(
      `forge-contact-sheet-${getTimestampSlug()}.svg`,
      createForgeContactSheetData(assets),
      'image/svg+xml',
      'reports'
    );
  }

  private importForgeAsset(): void {
    loadMarkdownFile((contents) => {
      const result = parseForgeAssetImports(contents);
      this.applyForgeImportResult(result, 'Forge import');
    });
  }

  private importForgeAiResponse(): void {
    loadMarkdownFile((contents) => {
      const result = parseForgeAiResponse(contents);
      this.applyForgeImportResult(result, 'AI response import');
    });
  }

  private applyForgeImportResult(result: ReturnType<typeof parseForgeAssetImports>, label: string): void {
    if (result.assets.length === 0) {
      this.setForgeImportReport(`${label} failed.\n${result.errors.join('\n') || `Expected styleGuideVersion ${FORGE_STYLE_GUIDE_VERSION}.`}`);
      console.warn(`Unable to import Forge assets. Expected styleGuideVersion ${FORGE_STYLE_GUIDE_VERSION}.`, result.errors);
      return;
    }

    const importedAssets = result.assets.map((asset, index) => {
      const imported = this.createImportedForgeDraft(asset, index);
      const selfCheck = result.response?.selfChecks?.[asset.id];
      if (selfCheck) {
        imported.gameplayHints = {
          ...imported.gameplayHints,
          aiSelfCheck: selfCheck.roleCue
        };
      }
      return imported;
    });
    this.presetState.forgeAssets = [...this.presetState.forgeAssets, ...importedAssets];
    this.selectedForgeAssetId = importedAssets[0]?.id ?? this.selectedForgeAssetId;
    this.lastForgeRepairPrompt = result.validationReports
      .filter((report) => !report.valid || report.warnings.length > 0)
      .map((report) => report.repairPrompt)
      .join('\n\n');
    this.setForgeImportReport(this.formatForgeImportReport(label, result.assets.length, result.rejectedCount, result.validationReports));
    this.savePresetState();
    this.syncOverlayFromState();
    if (result.rejectedCount > 0) {
      console.warn(`Imported ${importedAssets.length} Forge assets; rejected ${result.rejectedCount}.`, result.errors);
    }
  }

  private exportForgeBatchAiBrief(): void {
    const asset = this.getSelectedForgeAsset();
    downloadTextFile(
      `forge-batch-ai-brief-${slugify(asset.displayName)}-${this.time.now.toFixed(0)}.md`,
      createForgeAiBrief({
        targetLabel: `${asset.displayName} Batch`,
        targetKind: asset.kind,
        batchCount: this.forgeBatchCount,
        selectedAsset: asset,
        context: [
          `Selected enemy: ${this.getSelectedEffectiveDefinition().displayName}`,
          `Selected Forge layers: ${asset.layers.length}`,
          `Preview mode: ${this.forgePreviewMode}`,
          `Existing stored Forge drafts: ${this.presetState.forgeAssets.length}`,
          '',
          'Generate distinct enemy asset variations that can be imported directly into the Asset Forge draft list.'
        ].join('\n')
      }),
      'text/markdown'
    );
  }

  private exportForgeAiTask(): void {
    const selectedAsset = this.getSelectedForgeAsset();
    const task = createForgeAiTask({
      targetLabel: `${this.forgeAiRole || this.forgeAiAssetKind} Asset Forge Task`,
      targetKind: this.forgeAiAssetKind,
      taskType: this.forgeAiTaskType,
      templateId: this.forgeAiTemplateId,
      batchCount: this.forgeBatchCount,
      role: this.forgeAiRole,
      productionTarget: this.forgeAiProductionTarget || undefined,
      selectedAsset,
      context: [
        `Selected Forge asset: ${selectedAsset.displayName}`,
        `Selected preview mode: ${this.forgePreviewMode}`,
        `Existing stored Forge drafts: ${this.presetState.forgeAssets.length}`,
        'Manual import/export mode is active; no in-app AI provider is configured.'
      ].join('\n')
    });

    downloadTextFile(
      `forge-ai-task-${slugify(task.targetLabel)}-${this.time.now.toFixed(0)}.md`,
      createForgeAiBrief({
        targetLabel: task.targetLabel,
        targetKind: task.targetKind,
        taskType: task.taskType,
        templateId: task.templateId,
        batchCount: task.batchCount,
        role: task.role,
        productionTarget: task.productionTarget,
        selectedAsset: task.selectedAsset,
        context: task.context
      }),
      'text/markdown'
    );
  }

  private validateSelectedForgeAsset(): void {
    const report = validateForgeAssetForAi(this.getSelectedForgeAsset());
    this.lastForgeRepairPrompt = report.repairPrompt;
    this.setForgeImportReport(this.formatForgeValidationReport('Selected asset validation', report));
  }

  private exportForgeRepairPrompt(): void {
    const asset = this.getSelectedForgeAsset();
    const report = validateForgeAssetForAi(asset);
    const prompt = this.lastForgeRepairPrompt || createForgeRepairPrompt(report, asset);
    downloadTextFile(
      `forge-repair-prompt-${slugify(asset.displayName)}-${this.time.now.toFixed(0)}.md`,
      prompt,
      'text/markdown'
    );
  }

  private exportForgePromotionBundle(): void {
    const asset = this.getSelectedForgeAsset();
    const bundle = createForgePromotionBundle(asset, {
      source: 'enemy-lab',
      sourceDefinitionId: this.getSelectedEffectiveDefinition().id,
      selectedVariantId: this.getSelectedVariant()?.id ?? null,
      promoteWhenStatus: ['Approved Visual', 'Approved Gameplay']
    });

    downloadTextFile(
      `forge-promotion-${slugify(asset.displayName)}-${this.time.now.toFixed(0)}.md`,
      createForgePromotionMarkdown(bundle),
      'text/markdown'
    );
  }

  private promoteSelectedForgeAsset(): void {
    const asset = this.getSelectedStoredForgeAsset();
    if (!asset) {
      console.warn('Forge promotion requires a saved draft. Create Draft first, then mark it Approved Visual or Approved Gameplay.');
      return;
    }

    if (!isForgeAssetApprovedForPromotion(asset)) {
      console.warn(
        `Forge promotion blocked for "${asset.displayName}". Set status to Approved Visual or Approved Gameplay before promotion.`
      );
      return;
    }

    if (asset.status === 'Approved Visual' || asset.status === 'Approved Gameplay') {
      asset.status = 'Promoted';
    }
    asset.tags = Array.from(new Set([...asset.tags, 'promotion-candidate', createForgeVisualAssetId(asset)]));
    asset.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncForgeControlsFromState();

    const bundle = createForgeProductionPromotionBundle(asset, {
      source: 'enemy-lab',
      sourceDefinitionId: this.getSelectedEffectiveDefinition().id,
      selectedVariantId: this.getSelectedVariant()?.id ?? null,
      notes: asset.notes || `Promoted from Asset Forge for ${this.getSelectedEffectiveDefinition().displayName}.`
    });

    downloadTextFile(
      `forge-production-${slugify(asset.displayName)}-${this.time.now.toFixed(0)}.md`,
      createForgeProductionPromotionMarkdown(bundle),
      'text/markdown'
    );
  }

  private exportAiBrief(): void {
    const variant = this.getSelectedVariant();
    const squad = this.getSelectedCustomSquad();
    const target = variant ?? squad;
    if (!target) {
      return;
    }

    downloadTextFile(
      `ai-brief-${slugify(target.displayName)}-${this.time.now.toFixed(0)}.md`,
      createEnemyLabAiBriefMarkdown({
        targetLabel: target.displayName,
        targetData: target,
        context: this.createContextSnapshot()
      }),
      'text/markdown'
    );
  }

  private exportPromotionReport(): void {
    const variant = this.getSelectedVariant();
    if (!variant) {
      return;
    }

    downloadTextFile(
      `promotion-${slugify(variant.displayName)}-${this.time.now.toFixed(0)}.md`,
      createEnemyLabPromotionMarkdown({ variant, context: this.createContextSnapshot() }),
      'text/markdown'
    );
  }

  private importEnemyLabPreset(): void {
    loadMarkdownFile((contents) => {
      const forgeAsset = parseForgeAssetImport(contents);
      if (forgeAsset) {
        const imported: ForgeAsset = {
          ...forgeAsset,
          id: `${forgeAsset.id}.${Date.now()}`,
          savedAt: new Date().toISOString()
        };
        this.presetState.forgeAssets = [...this.presetState.forgeAssets, imported];
        this.savePresetState();
        this.syncOverlayFromState();
        return;
      }

      const preset = parseEnemyLabPresetMarkdown(contents);
      if (!preset) {
        console.warn('Unable to import enemy lab preset.');
        this.setPresetStatus('Load rejected: expected an Enemy Lab, Forge, variant, or squad preset.', true);
        return;
      }

      if (preset.type === 'starvivors-enemy-lab-variant') {
        this.importVariantPresetFromFile(preset);
      } else {
        this.importSquadPresetFromFile(preset);
      }
    });
  }

  private importVariantPresetFromFile(preset: EnemyLabVariantPreset): void {
    const id = `${preset.id}-${Date.now()}`;
    this.upsertVariantPreset({ ...preset, id, savedAt: new Date().toISOString() });
    this.selectedEnemyIndex = Math.max(0, getEnemyLabDefinitions().findIndex((definition) => definition.id === preset.baseDefinitionId));
    this.selectedVariantId = id;
    this.hydrateBasicLoadoutDraftFromSelectedVariant();
    this.savePresetState();
    this.populateVariantSelect();
    this.syncOverlayFromState();
    this.setPresetStatus(`Loaded variant preset: ${preset.displayName}`);
  }

  private importSquadPresetFromFile(preset: EnemyLabSquadPreset): void {
    const id = `${preset.id}-${Date.now()}`;
    this.upsertSquadPreset({ ...preset, id, savedAt: new Date().toISOString() });
    this.selectedCustomSquadId = id;
    this.selectedSquadEntryIndex = -1;
    this.selectedSquadLoadoutSlotIndex = 0;
    this.savePresetState();
    this.populateCustomSquadSelect();
    this.syncOverlayFromState();
    this.setPresetStatus(`Loaded squad preset: ${preset.displayName}`);
  }

  private createNewCustomSquad(): void {
    const squad = createEmptySquadPreset();
    this.presetState.squads.push(squad);
    this.selectedCustomSquadId = squad.id;
    this.savePresetState();
    this.populateCustomSquadSelect();
    this.syncSquadControlsFromState();
  }

  private ensureCustomSquadForEditing(): EnemyLabSquadPreset | undefined {
    const existing = this.getSelectedCustomSquad();
    if (existing) {
      return existing;
    }

    const squad = createEmptySquadPreset();
    this.presetState.squads.push(squad);
    this.selectedCustomSquadId = squad.id;
    this.selectedSquadEntryIndex = -1;
    this.populateCustomSquadSelect();
    this.setActionsEnabled(
      ['exportSquad', 'deleteSquad', 'rotateSquadLeft', 'rotateSquadRight', 'scaleSquadDown', 'scaleSquadUp', 'mirrorSquad', 'clearSquad'],
      true
    );
    this.setActionsEnabled(['exportAiBrief'], true);
    return squad;
  }

  private copyBuiltInSquad(): void {
    const builtIn = getEnemyLabSquads()[this.selectedSquadIndex];
    const squad = convertBuiltInSquadToPreset(builtIn);
    this.presetState.squads.push(squad);
    this.selectedCustomSquadId = squad.id;
    this.savePresetState();
    this.populateCustomSquadSelect();
    this.syncSquadControlsFromState();
  }

  private addSelectedEnemyToSquad(): void {
    let squad = this.getSelectedCustomSquad();
    if (!squad) {
      this.createNewCustomSquad();
      squad = this.getSelectedCustomSquad();
    }
    if (!squad) {
      return;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const angle = (Math.PI * 2 * squad.entries.length) / Math.max(1, squad.entries.length + 1);
    squad.entries.push({
      definitionId: definition.id,
      variantId: this.getSelectedVariant()?.id,
      x: Math.round(Math.cos(angle) * 150),
      y: Math.round(Math.sin(angle) * 150)
    });
    this.selectedSquadEntryIndex = squad.entries.length - 1;
    squad.savedAt = new Date().toISOString();
    this.savePresetState();
    this.renderSquadEntries();
  }

  private exportSelectedSquad(): void {
    const squad = this.getSelectedCustomSquad();
    if (!squad) {
      return;
    }

    this.saveEnemyLabPresetMarkdown(
      'squads',
      this.createPresetFilename('squad', squad.displayName),
      createEnemySquadMarkdown(squad),
      `Saved squad preset: ${squad.displayName}`
    );
  }

  private loadEnemySquadPreset(): void {
    loadMarkdownFile((contents) => {
      const preset = parseEnemySquadPresetMarkdown(contents);
      if (!preset) {
        this.setPresetStatus('Load rejected: expected an Enemy Lab squad preset.', true);
        return;
      }

      this.importSquadPresetFromFile(preset);
    });
  }

  private saveSelectedAttackLoadoutPreset(): void {
    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const preset = createEnemyLabAttackLoadoutPreset({
      id: `loadout-${slugify(definition.id)}-${Date.now()}`,
      displayName: `${definition.displayName} Basic Loadout`,
      hostKind: 'enemy',
      hostDefinitionId: definition.id,
      slots: this.getBasicLoadoutDraft(definition.id),
      notes: this.getSelectedVariant()?.notes
    });

    this.saveEnemyLabPresetMarkdown(
      'loadouts',
      this.createPresetFilename('loadout', definition.displayName),
      createEnemyLabAttackLoadoutMarkdown(preset),
      `Saved attack loadout: ${definition.displayName}`
    );
  }

  private loadAttackLoadoutPreset(): void {
    loadMarkdownFile((contents) => {
      const preset = parseEnemyLabAttackLoadoutMarkdown(contents);
      if (!preset) {
        this.setPresetStatus('Load rejected: expected an Enemy Lab attack loadout preset.', true);
        return;
      }

      const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
      this.basicLoadoutDraftsByEnemyId[definition.id] = cloneAttackLoadoutSlots(preset.slots);
      this.selectedBasicLoadoutSlotIndex = 0;
      this.renderAttackWorkflowControls();
      this.setPresetStatus(`Loaded attack loadout onto ${definition.displayName}: ${preset.displayName}`);
    });
  }

  private saveAttackTestPreset(): void {
    const selectedAttack = getEnemyAttackDefinition(this.selectedAttackTestId);
    const preset = createEnemyLabAttackTestPreset({
      id: `attack-test-${slugify(selectedAttack.id)}-${Date.now()}`,
      displayName: `${selectedAttack.displayName} Attack Test`,
      hostShipId: DEFAULT_SHIP_ID,
      targetSetup: 'dummy',
      readabilityMode: this.readabilityMode,
      reducedEffects: this.reducedEffects,
      slots: this.attackTesterSlots
    });

    this.saveEnemyLabPresetMarkdown(
      'attack-tests',
      this.createPresetFilename('attack-test', selectedAttack.displayName),
      createEnemyLabAttackTestMarkdown(preset),
      `Saved attack test: ${selectedAttack.displayName}`
    );
  }

  private loadAttackTestPreset(): void {
    loadMarkdownFile((contents) => {
      const preset = parseEnemyLabAttackTestMarkdown(contents);
      if (!preset) {
        this.setPresetStatus('Load rejected: expected an Enemy Lab attack test preset.', true);
        return;
      }

      this.attackTesterSlots = cloneAttackLoadoutSlots(preset.slots);
      this.selectedAttackTesterSlotIndex = 0;
      this.selectedAttackTestId = this.attackTesterSlots[0]?.attackId ?? this.selectedAttackTestId;
      this.readabilityMode = preset.readabilityMode;
      this.reducedEffects = preset.reducedEffects;
      this.clearTestProps();
      this.syncOverlayFromState();
      this.setPresetStatus(`Loaded attack test: ${preset.displayName}`);
    });
  }

  private clearSelectedSquad(): void {
    const squad = this.getSelectedCustomSquad();
    if (!squad) {
      return;
    }

    squad.entries = [];
    this.selectedSquadEntryIndex = -1;
    this.selectedSquadLoadoutSlotIndex = 0;
    squad.savedAt = new Date().toISOString();
    this.savePresetState();
    this.renderSquadEntries();
  }

  private deleteSelectedVariant(): void {
    const variant = this.getSelectedVariant();
    if (!variant) {
      return;
    }

    const shouldDelete = window.confirm(`Delete enemy variant "${variant.displayName}"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    this.presetState.variants = this.presetState.variants.filter((candidate) => candidate.id !== variant.id);
    for (const squad of this.presetState.squads) {
      for (const entry of squad.entries) {
        if (entry.variantId === variant.id) {
          entry.variantId = undefined;
        }
      }
    }
    this.selectedVariantId = '';
    this.savePresetState();
    this.syncOverlayFromState();
  }

  private deleteSelectedSquad(): void {
    const squad = this.getSelectedCustomSquad();
    if (!squad) {
      return;
    }

    this.presetState.squads = this.presetState.squads.filter((candidate) => candidate.id !== squad.id);
    this.selectedCustomSquadId = '';
    this.selectedSquadEntryIndex = -1;
    this.selectedSquadLoadoutSlotIndex = 0;
    this.savePresetState();
    this.syncOverlayFromState();
  }

  private transformSelectedSquad(transform: (entry: EnemyLabSquadPresetEntry) => EnemyLabSquadPresetEntry): void {
    const squad = this.getSelectedCustomSquad();
    if (!squad) {
      return;
    }

    squad.entries = squad.entries.map(transform);
    squad.savedAt = new Date().toISOString();
    this.savePresetState();
    this.renderSquadEntries();
  }

  private rotateSquadEntry(entry: EnemyLabSquadPresetEntry, degrees: number): EnemyLabSquadPresetEntry {
    const radians = Phaser.Math.DegToRad(degrees);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      ...entry,
      x: Math.round(entry.x * cos - entry.y * sin),
      y: Math.round(entry.x * sin + entry.y * cos)
    };
  }

  private renderQuickTags(): void {
    if (!this.overlay) {
      return;
    }

    const variant = this.getSelectedVariant();
    this.overlay.variantTags.replaceChildren();
    for (const tag of ENEMY_LAB_QUICK_TAGS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.tag = tag;
      button.textContent = tag;
      button.className = variant?.tags.includes(tag) ? 'is-active' : '';
      button.disabled = !variant;
      this.overlay.variantTags.appendChild(button);
    }
  }

  private renderBehaviorParamControls(): void {
    if (!this.overlay) {
      return;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const variant = this.getSelectedVariant();
    const params = { ...(definition.behavior.params ?? {}), ...(variant?.behaviorParamOverrides ?? {}) };
    this.overlay.behaviorParams.replaceChildren();
    for (const [key, value] of Object.entries(params)) {
      const label = document.createElement('label');
      label.textContent = key;
      const input = document.createElement('input');
      input.dataset.behaviorParam = key;
      input.type = typeof value === 'number' ? 'number' : 'text';
      input.step = typeof value === 'number' && Math.abs(value) < 10 ? '0.05' : '1';
      input.value = String(value);
      input.disabled = !variant;
      label.appendChild(input);
      this.overlay.behaviorParams.appendChild(label);
    }
  }

  private renderAttackWorkflowControls(): void {
    if (!this.overlay) {
      return;
    }

    this.renderDefaultAttackLoadout();
    this.renderAttackTesterControls();
  }

  private renderDefaultAttackLoadout(): void {
    if (!this.overlay) {
      return;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const loadout = this.getBasicLoadoutDraft(definition.id);
    this.selectedBasicLoadoutSlotIndex = this.clampLoadoutSlotIndex(this.selectedBasicLoadoutSlotIndex, loadout);
    this.overlay.attackLoadout.replaceChildren();

    const intro = document.createElement('div');
    intro.className = 'enemy-lab-empty';
    intro.textContent = 'Draft loadout for this enemy. Spawned lab enemies keep a cloned snapshot for inspection; combat AI is unchanged.';
    this.overlay.attackLoadout.appendChild(intro);
    this.renderLoadoutEditor(this.overlay.attackLoadout, 'basic', loadout, this.selectedBasicLoadoutSlotIndex);
  }

  private renderAttackTesterControls(): void {
    if (!this.overlay) {
      return;
    }

    this.selectedAttackTesterSlotIndex = this.clampLoadoutSlotIndex(this.selectedAttackTesterSlotIndex, this.attackTesterSlots);
    const selectedSlot = this.attackTesterSlots[this.selectedAttackTesterSlotIndex];
    const selectedAttack = selectedSlot
      ? getEnemyAttackDefinition(selectedSlot.attackId)
      : getEnemyAttackDefinition(this.selectedAttackTestId);
    this.selectedAttackTestId = selectedAttack.id;
    this.overlay.attackTesterAttackSelect.value = this.selectedAttackTestId;
    this.overlay.attackTesterSlotList.replaceChildren();

    const intro = document.createElement('div');
    intro.className = 'enemy-lab-empty';
    intro.textContent = 'Slot stack for the player-test host. Fire Once queues the selected slot; Auto-Cycle walks enabled slots.';
    this.overlay.attackTesterSlotList.appendChild(intro);
    this.renderLoadoutEditor(this.overlay.attackTesterSlotList, 'attackTester', this.attackTesterSlots, this.selectedAttackTesterSlotIndex);
    this.overlay.attackTesterParams.textContent = [
      `Selected stack: ${this.attackTesterSlots.length} slot${this.attackTesterSlots.length === 1 ? '' : 's'}`,
      `current attack target ${selectedAttack.targeting.targetKind}`,
      `range ${selectedAttack.targeting.rangePx}`,
      `test targets ${this.attackTestTargets.length}`,
      `auto-cycle ${this.attackTesterAutoCycleEnabled ? 'on' : 'off'}`
    ].join(' | ');
  }

  private renderLoadoutEditor(
    container: HTMLElement,
    scope: AttackLoadoutEditorScope,
    loadout: AttackLoadoutSlot[],
    selectedIndex: number
  ): void {
    if (loadout.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'enemy-lab-empty';
      empty.textContent = 'No attack slots. Use + Attack Slot to start a draft.';
      container.appendChild(empty);
      return;
    }

    for (const [index, slot] of loadout.entries()) {
      if (!isEnemyAttackId(slot.attackId)) {
        continue;
      }

      const attack = getEnemyAttackDefinition(slot.attackId);
      const row = document.createElement('div');
      row.className = index === selectedIndex ? 'enemy-lab-attack-slot is-active' : 'enemy-lab-attack-slot';

      const header = document.createElement('div');
      header.className = 'enemy-lab-attack-slot-header';
      const selectButton = document.createElement('button');
      selectButton.type = 'button';
      selectButton.dataset.loadoutScope = scope;
      selectButton.dataset.loadoutAction = 'select';
      selectButton.dataset.loadoutIndex = String(index);
      selectButton.textContent = `Slot ${index + 1}`;
      const title = document.createElement('div');
      title.className = 'enemy-lab-attack-slot-title';
      title.textContent = slot.label?.trim() || attack.displayName;
      header.append(selectButton, title);
      row.appendChild(header);

      const meta = document.createElement('div');
      meta.className = 'enemy-lab-attack-slot-meta';
      meta.textContent = [
        attack.id,
        slot.enabled ? 'enabled' : 'disabled',
        `batch ${attack.lab.batch}`,
        `target ${attack.targeting.targetKind}`,
        `range ${attack.targeting.rangePx}`,
        attack.tags.join(', ')
      ].join(' | ');
      row.appendChild(meta);

      const fieldGrid = document.createElement('div');
      fieldGrid.className = 'enemy-lab-loadout-grid';
      fieldGrid.appendChild(this.createLoadoutEnabledControl(scope, index, slot.enabled));
      fieldGrid.appendChild(this.createLoadoutAttackControl(scope, index, slot.attackId));
      fieldGrid.appendChild(this.createLoadoutTextControl(scope, index, 'label', 'Label', slot.label ?? ''));
      fieldGrid.appendChild(this.createLoadoutNumberControl(scope, index, 'cooldownOffsetMs', 'Offset', slot.cooldownOffsetMs ?? 0, 50, undefined));
      fieldGrid.appendChild(this.createLoadoutNumberControl(scope, index, 'weight', 'Weight', slot.weight ?? 1, 0.1, 0));
      row.appendChild(fieldGrid);

      const params = resolveAttackLoadoutSlotParams(slot);
      const paramsGrid = document.createElement('div');
      paramsGrid.className = 'enemy-lab-param-grid enemy-lab-slot-param-grid';
      for (const [key, value] of Object.entries(params)) {
        paramsGrid.appendChild(this.createLoadoutParamControl(scope, index, key, value));
      }
      row.appendChild(paramsGrid);

      const paramSummary = document.createElement('div');
      paramSummary.className = 'enemy-lab-attack-slot-meta';
      paramSummary.textContent = this.formatAttackParams(params);
      row.appendChild(paramSummary);

      container.appendChild(row);
    }
  }

  private createLoadoutEnabledControl(scope: AttackLoadoutEditorScope, index: number, enabled: boolean): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = 'Enabled';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = enabled;
    this.assignLoadoutFieldDataset(input, scope, index, 'enabled');
    label.appendChild(input);
    return label;
  }

  private createLoadoutAttackControl(scope: AttackLoadoutEditorScope, index: number, attackId: EnemyAttackId): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = 'Attack';
    const select = document.createElement('select');
    for (const attack of getEnemyAttackDefinitions()) {
      select.add(new Option(attack.displayName, attack.id));
    }
    select.value = attackId;
    this.assignLoadoutFieldDataset(select, scope, index, 'attackId');
    label.appendChild(select);
    return label;
  }

  private createLoadoutTextControl(
    scope: AttackLoadoutEditorScope,
    index: number,
    field: keyof Pick<AttackLoadoutSlot, 'label'>,
    labelText: string,
    value: string
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 48;
    input.value = value;
    this.assignLoadoutFieldDataset(input, scope, index, field);
    label.appendChild(input);
    return label;
  }

  private createLoadoutNumberControl(
    scope: AttackLoadoutEditorScope,
    index: number,
    field: keyof Pick<AttackLoadoutSlot, 'cooldownOffsetMs' | 'weight'>,
    labelText: string,
    value: number,
    step: number,
    min: number | undefined
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = String(step);
    if (min !== undefined) {
      input.min = String(min);
    }
    input.value = String(value);
    this.assignLoadoutFieldDataset(input, scope, index, field);
    label.appendChild(input);
    return label;
  }

  private createLoadoutParamControl(
    scope: AttackLoadoutEditorScope,
    index: number,
    key: string,
    value: EnemyAttackParamValue
  ): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = key;
    const input = typeof value === 'boolean'
      ? document.createElement('select')
      : document.createElement('input');

    if (input instanceof HTMLSelectElement) {
      input.add(new Option('true', 'true'));
      input.add(new Option('false', 'false'));
      input.value = String(value);
    } else {
      input.type = typeof value === 'number' ? 'number' : 'text';
      input.step = typeof value === 'number' && Math.abs(value) < 10 ? '0.05' : '1';
      input.value = String(value);
    }

    input.dataset.loadoutScope = scope;
    input.dataset.loadoutIndex = String(index);
    input.dataset.loadoutParam = key;
    label.appendChild(input);
    return label;
  }

  private assignLoadoutFieldDataset(
    input: HTMLInputElement | HTMLSelectElement,
    scope: AttackLoadoutEditorScope,
    index: number,
    field: keyof AttackLoadoutSlot
  ): void {
    input.dataset.loadoutScope = scope;
    input.dataset.loadoutIndex = String(index);
    input.dataset.loadoutField = field;
  }

  private formatAttackParams(params: Record<string, EnemyAttackParamValue>): string {
    const entries = Object.entries(params);
    if (entries.length === 0) {
      return 'params: none';
    }

    return `params: ${entries.map(([key, value]) => `${key}=${String(value)}`).join(', ')}`;
  }

  private normalizeAttackId(value: string): EnemyAttackId {
    return isEnemyAttackId(value) ? value : getEnemyAttackDefinitions()[0].id;
  }

  private clampLoadoutSlotIndex(index: number, loadout: AttackLoadoutSlot[]): number {
    if (loadout.length === 0) {
      return 0;
    }

    return Phaser.Math.Clamp(Math.round(index), 0, loadout.length - 1);
  }

  private getBasicLoadoutDraft(definitionId: string): AttackLoadoutSlot[] {
    if (!this.basicLoadoutDraftsByEnemyId[definitionId]) {
      this.basicLoadoutDraftsByEnemyId[definitionId] = getDefaultEnemyAttackLoadout(definitionId);
    }

    return this.basicLoadoutDraftsByEnemyId[definitionId];
  }

  private hydrateBasicLoadoutDraftFromSelectedVariant(): void {
    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const variant = this.getSelectedVariant();
    if (!definition || !variant?.attackLoadoutOverride) {
      return;
    }

    this.basicLoadoutDraftsByEnemyId[definition.id] = cloneAttackLoadoutSlots(variant.attackLoadoutOverride);
    this.selectedBasicLoadoutSlotIndex = 0;
  }

  private createEnemyLoadoutSnapshot(definitionId: string, source?: AttackLoadoutSlot[]): AttackLoadoutSlot[] {
    return normalizeAttackLoadoutSlots(source ?? getDefaultEnemyAttackLoadout(definitionId));
  }

  private getDefaultAttackIdForEnemy(definitionId: string): EnemyAttackId {
    return getDefaultEnemyAttackLoadout(definitionId)[0]?.attackId ?? 'contact-ram';
  }

  private getLoadoutForScope(scope: AttackLoadoutEditorScope | undefined, createSquadDraft = false): AttackLoadoutSlot[] | undefined {
    if (scope === 'basic') {
      return this.getBasicLoadoutDraft(getEnemyLabDefinitions()[this.selectedEnemyIndex].id);
    }
    if (scope === 'attackTester') {
      return this.attackTesterSlots;
    }
    if (scope === 'squad') {
      const context = this.getSelectedSquadEntryContext();
      if (!context) {
        return undefined;
      }
      if (!context.entry.attackLoadoutOverride && createSquadDraft) {
        context.entry.attackLoadoutOverride = getDefaultEnemyAttackLoadout(context.entry.definitionId);
      }
      return context.entry.attackLoadoutOverride;
    }

    return undefined;
  }

  private setSelectedLoadoutSlotIndex(scope: AttackLoadoutEditorScope, index: number): void {
    const loadout = this.getLoadoutForScope(scope);
    const clampedIndex = this.clampLoadoutSlotIndex(index, loadout ?? []);
    if (scope === 'basic') {
      this.selectedBasicLoadoutSlotIndex = clampedIndex;
    } else if (scope === 'attackTester') {
      this.selectedAttackTesterSlotIndex = clampedIndex;
      const slot = this.attackTesterSlots[this.selectedAttackTesterSlotIndex];
      if (slot) {
        this.selectedAttackTestId = slot.attackId;
      }
    } else {
      this.selectedSquadLoadoutSlotIndex = clampedIndex;
    }
  }

  private getSelectedLoadoutSlotIndex(scope: AttackLoadoutEditorScope): number {
    if (scope === 'basic') {
      return this.selectedBasicLoadoutSlotIndex;
    }
    if (scope === 'attackTester') {
      return this.selectedAttackTesterSlotIndex;
    }
    return this.selectedSquadLoadoutSlotIndex;
  }

  private getAttackIdForNewSlot(scope: AttackLoadoutEditorScope): EnemyAttackId {
    if (scope === 'attackTester') {
      return this.selectedAttackTestId;
    }
    if (scope === 'squad') {
      const context = this.getSelectedSquadEntryContext();
      return context ? this.getDefaultAttackIdForEnemy(context.entry.definitionId) : 'contact-ram';
    }

    return this.getDefaultAttackIdForEnemy(getEnemyLabDefinitions()[this.selectedEnemyIndex].id);
  }

  private handleLoadoutAction(scope: AttackLoadoutEditorScope | undefined, action: string, index: number): void {
    const normalizedScope = scope === 'basic' || scope === 'attackTester' || scope === 'squad' ? scope : undefined;
    if (!normalizedScope) {
      return;
    }

    if (action === 'reset') {
      this.resetLoadoutScope(normalizedScope);
      this.renderAfterLoadoutChange(normalizedScope);
      return;
    }

    const loadout = this.getLoadoutForScope(normalizedScope, true);
    if (!loadout) {
      return;
    }

    if (action === 'select') {
      this.setSelectedLoadoutSlotIndex(normalizedScope, index);
    } else if (action === 'add') {
      const slot = createDefaultAttackLoadoutSlot(this.getAttackIdForNewSlot(normalizedScope));
      loadout.push(slot);
      this.setSelectedLoadoutSlotIndex(normalizedScope, loadout.length - 1);
      if (normalizedScope === 'attackTester') {
        this.selectedAttackTestId = slot.attackId;
      }
    } else if (action === 'remove') {
      const removeIndex = this.clampLoadoutSlotIndex(Number.isFinite(index) ? index : this.getSelectedLoadoutSlotIndex(normalizedScope), loadout);
      if (loadout.length > 0) {
        loadout.splice(removeIndex, 1);
      }
      this.setSelectedLoadoutSlotIndex(normalizedScope, removeIndex);
    }

    this.renderAfterLoadoutChange(normalizedScope);
  }

  private resetLoadoutScope(scope: AttackLoadoutEditorScope): void {
    if (scope === 'basic') {
      const definitionId = getEnemyLabDefinitions()[this.selectedEnemyIndex].id;
      this.basicLoadoutDraftsByEnemyId[definitionId] = getDefaultEnemyAttackLoadout(definitionId);
      this.selectedBasicLoadoutSlotIndex = 0;
      return;
    }

    if (scope === 'attackTester') {
      this.attackTesterSlots = [createDefaultAttackLoadoutSlot(this.selectedAttackTestId)];
      this.selectedAttackTesterSlotIndex = 0;
      return;
    }

    const context = this.getSelectedSquadEntryContext();
    if (!context) {
      return;
    }

    context.entry.attackLoadoutOverride = getDefaultEnemyAttackLoadout(context.entry.definitionId);
    this.selectedSquadLoadoutSlotIndex = 0;
  }

  private renderAfterLoadoutChange(scope: AttackLoadoutEditorScope): void {
    this.renderAttackWorkflowControls();
    if (scope === 'squad') {
      const squad = this.getSelectedCustomSquad();
      if (squad) {
        squad.savedAt = new Date().toISOString();
        this.savePresetState();
      }
      this.renderSquadEntries();
    }
  }

  private setLoadoutSlotAttack(scope: AttackLoadoutEditorScope, index: number, attackId: EnemyAttackId): void {
    const loadout = this.getLoadoutForScope(scope, true);
    if (!loadout) {
      return;
    }

    if (loadout.length === 0) {
      loadout.push(createDefaultAttackLoadoutSlot(attackId));
    }

    const clampedIndex = this.clampLoadoutSlotIndex(index, loadout);
    const previous = loadout[clampedIndex];
    const next = createDefaultAttackLoadoutSlot(attackId);
    next.enabled = previous?.enabled ?? true;
    next.cooldownOffsetMs = previous?.cooldownOffsetMs ?? next.cooldownOffsetMs;
    next.weight = previous?.weight ?? next.weight;
    loadout[clampedIndex] = next;
    this.setSelectedLoadoutSlotIndex(scope, clampedIndex);
  }

  private updateLoadoutSlotFromInput(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
    const scope = input.dataset.loadoutScope as AttackLoadoutEditorScope | undefined;
    const loadout = this.getLoadoutForScope(scope);
    const index = Number(input.dataset.loadoutIndex);
    if (!scope || !loadout || !Number.isInteger(index) || !loadout[index]) {
      return;
    }

    const slot = loadout[index];
    const field = input.dataset.loadoutField as keyof AttackLoadoutSlot | undefined;
    if (field === 'attackId') {
      this.setLoadoutSlotAttack(scope, index, this.normalizeAttackId(input.value));
      this.renderAfterLoadoutChange(scope);
      return;
    }
    if (field === 'enabled' && input instanceof HTMLInputElement) {
      slot.enabled = input.checked;
    }
    if (field === 'label') {
      slot.label = input.value.trim() || undefined;
    }
    if (field === 'cooldownOffsetMs' && input instanceof HTMLInputElement) {
      const value = Number(input.value);
      slot.cooldownOffsetMs = Number.isFinite(value) ? Math.round(value) : undefined;
    }
    if (field === 'weight' && input instanceof HTMLInputElement) {
      const value = Number(input.value);
      slot.weight = Number.isFinite(value) ? Math.max(0, value) : undefined;
    }

    const paramKey = input.dataset.loadoutParam;
    if (paramKey) {
      const resolvedParams = resolveAttackLoadoutSlotParams(slot);
      const currentValue = resolvedParams[paramKey];
      slot.params = { ...(slot.params ?? {}) };
      if (typeof currentValue === 'number') {
        const value = Number(input.value);
        slot.params[paramKey] = Number.isFinite(value) ? value : currentValue;
      } else if (typeof currentValue === 'boolean') {
        slot.params[paramKey] = input.value === 'true';
      } else {
        slot.params[paramKey] = input.value;
      }
    }

    this.setSelectedLoadoutSlotIndex(scope, index);
    if (scope === 'squad') {
      const context = this.getSelectedSquadEntryContext();
      if (context) {
        context.squad.savedAt = new Date().toISOString();
        this.savePresetState();
      }
    }
    if (scope === 'attackTester') {
      const selectedSlot = this.attackTesterSlots[this.selectedAttackTesterSlotIndex];
      if (selectedSlot) {
        this.selectedAttackTestId = selectedSlot.attackId;
        if (this.overlay) {
          this.overlay.attackTesterAttackSelect.value = selectedSlot.attackId;
        }
      }
    }
  }

  private renderSquadEntries(): void {
    if (!this.overlay) {
      return;
    }

    const squad = this.getSelectedCustomSquad();
    this.overlay.squadEntries.replaceChildren();
    if (!squad) {
      const empty = document.createElement('div');
      empty.className = 'enemy-lab-empty';
      empty.textContent = 'Create or copy a squad to edit placed formations.';
      this.overlay.squadEntries.appendChild(empty);
      return;
    }

    for (const [index, entry] of squad.entries.entries()) {
      const row = document.createElement('div');
      row.className = index === this.selectedSquadEntryIndex ? 'enemy-lab-entry is-active' : 'enemy-lab-entry';
      const title = document.createElement('button');
      title.type = 'button';
      title.dataset.entryAction = 'select';
      title.dataset.entryIndex = String(index);
      title.textContent = this.getEntryLabel(entry);
      row.appendChild(title);
      row.appendChild(this.createSquadEntryInput(index, 'x', entry.x));
      row.appendChild(this.createSquadEntryInput(index, 'y', entry.y));
      row.appendChild(this.createSquadEntryInput(index, 'spawnDelayMs', entry.spawnDelayMs ?? 0));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.entryAction = 'remove';
      remove.dataset.entryIndex = String(index);
      remove.textContent = 'Remove';
      row.appendChild(remove);
      row.appendChild(this.createSquadEntryLoadoutControls(squad, index));
      this.overlay.squadEntries.appendChild(row);
    }

    this.renderSelectedSquadEntryLoadoutEditor(squad);
  }

  private createSquadEntryInput(index: number, field: 'x' | 'y' | 'spawnDelayMs', value: number): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = field === 'spawnDelayMs' ? 'Delay' : field.toUpperCase();
    const input = document.createElement('input');
    input.type = 'number';
    input.step = field === 'spawnDelayMs' ? '100' : '10';
    input.value = String(value);
    input.dataset.entryIndex = String(index);
    input.dataset.entryField = field;
    label.appendChild(input);
    return label;
  }

  private createSquadEntryLoadoutControls(squad: EnemyLabSquadPreset, index: number): HTMLDivElement {
    const controls = document.createElement('div');
    controls.className = 'enemy-lab-entry-loadout';
    const hasCustomLoadout = Boolean(squad.entries[index]?.attackLoadoutOverride);
    const label = document.createElement('span');
    label.textContent = `Attack override: ${hasCustomLoadout ? 'Saved custom' : 'Default loadout'}`;
    controls.appendChild(label);

    for (const [action, text] of [
      ['loadoutDefault', 'Default'],
      ['loadoutCustom', 'Custom'],
      ['loadoutReset', 'Reset']
    ] as const) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.entryAction = action;
      button.dataset.entryIndex = String(index);
      button.textContent = text;
      button.className = action === 'loadoutCustom' && hasCustomLoadout ? 'is-active' : '';
      button.disabled = action === 'loadoutReset' && !hasCustomLoadout;
      controls.appendChild(button);
    }

    return controls;
  }

  private renderSelectedSquadEntryLoadoutEditor(squad: EnemyLabSquadPreset): void {
    if (!this.overlay || this.selectedSquadEntryIndex < 0 || !squad.entries[this.selectedSquadEntryIndex]) {
      return;
    }

    const loadout = squad.entries[this.selectedSquadEntryIndex].attackLoadoutOverride;
    if (!loadout) {
      return;
    }

    this.selectedSquadLoadoutSlotIndex = this.clampLoadoutSlotIndex(this.selectedSquadLoadoutSlotIndex, loadout);
    const editor = document.createElement('div');
    editor.className = 'enemy-lab-squad-loadout-editor';
    const title = document.createElement('div');
    title.className = 'enemy-lab-subtitle';
    title.textContent = `Session Attack Override: ${this.getEntryLabel(squad.entries[this.selectedSquadEntryIndex])}`;
    editor.appendChild(title);
    const note = document.createElement('div');
    note.className = 'enemy-lab-empty';
    note.textContent = 'Saved with the squad preset. Spawned lab enemies keep a cloned snapshot for inspection.';
    editor.appendChild(note);
    this.renderLoadoutEditor(editor, 'squad', loadout, this.selectedSquadLoadoutSlotIndex);
    const actions = document.createElement('div');
    actions.className = 'enemy-lab-row';
    for (const [action, text] of [
      ['add', '+ Attack Slot'],
      ['remove', '- Attack Slot'],
      ['reset', 'Reset Defaults']
    ] as const) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.loadoutScope = 'squad';
      button.dataset.loadoutAction = action;
      button.textContent = text;
      actions.appendChild(button);
    }
    editor.appendChild(actions);
    this.overlay.squadEntries.appendChild(editor);
  }

  private handleSquadEntryAction(action: string, index: number): void {
    const squad = this.getSelectedCustomSquad();
    if (!squad || !Number.isInteger(index) || !squad.entries[index]) {
      return;
    }

    if (action === 'select') {
      this.selectedSquadEntryIndex = index;
      this.selectedSquadLoadoutSlotIndex = 0;
    }
    if (action === 'remove') {
      squad.entries.splice(index, 1);
      this.selectedSquadEntryIndex = Math.min(this.selectedSquadEntryIndex, squad.entries.length - 1);
      squad.savedAt = new Date().toISOString();
      this.savePresetState();
    }
    if (action === 'loadoutDefault') {
      delete squad.entries[index].attackLoadoutOverride;
      this.selectedSquadEntryIndex = index;
      this.selectedSquadLoadoutSlotIndex = 0;
      squad.savedAt = new Date().toISOString();
      this.savePresetState();
    }
    if (action === 'loadoutCustom') {
      squad.entries[index].attackLoadoutOverride = squad.entries[index].attackLoadoutOverride ?? getDefaultEnemyAttackLoadout(squad.entries[index].definitionId);
      this.selectedSquadEntryIndex = index;
      this.selectedSquadLoadoutSlotIndex = this.clampLoadoutSlotIndex(this.selectedSquadLoadoutSlotIndex, squad.entries[index].attackLoadoutOverride ?? []);
      squad.savedAt = new Date().toISOString();
      this.savePresetState();
    }
    if (action === 'loadoutReset') {
      squad.entries[index].attackLoadoutOverride = getDefaultEnemyAttackLoadout(squad.entries[index].definitionId);
      this.selectedSquadEntryIndex = index;
      this.selectedSquadLoadoutSlotIndex = 0;
      squad.savedAt = new Date().toISOString();
      this.savePresetState();
    }
    this.renderSquadEntries();
  }

  private updateSquadEntryFromInput(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
    const squad = this.getSelectedCustomSquad();
    const index = Number(input.dataset.entryIndex);
    const field = input.dataset.entryField as keyof EnemyLabSquadPresetEntry | undefined;
    if (!squad || !Number.isInteger(index) || !field || !squad.entries[index]) {
      return;
    }

    if (field === 'x' || field === 'y' || field === 'spawnDelayMs') {
      squad.entries[index][field] = Number(input.value) || 0;
    }
    squad.savedAt = new Date().toISOString();
    this.savePresetState();
  }

  private toggleSelectedVariantTag(tag: string): void {
    const variant = this.getSelectedVariant();
    if (!variant) {
      return;
    }

    variant.tags = variant.tags.includes(tag) ? variant.tags.filter((candidate) => candidate !== tag) : [...variant.tags, tag];
    if (tag === 'Candidate') {
      variant.status = 'Candidate';
    }
    variant.savedAt = new Date().toISOString();
    this.savePresetState();
    this.syncVariantControlsFromState();
  }

  private getSelectedVariant(): EnemyLabVariantPreset | undefined {
    return this.selectedVariantId ? this.presetState.variants.find((variant) => variant.id === this.selectedVariantId) : undefined;
  }

  private getSelectedCustomSquad(): EnemyLabSquadPreset | undefined {
    return this.selectedCustomSquadId ? this.presetState.squads.find((squad) => squad.id === this.selectedCustomSquadId) : undefined;
  }

  private getSelectedSquadEntryContext(): {
    squad: EnemyLabSquadPreset;
    entry: EnemyLabSquadPresetEntry;
    index: number;
  } | undefined {
    const squad = this.getSelectedCustomSquad();
    const entry = squad?.entries[this.selectedSquadEntryIndex];
    if (!squad || !entry) {
      return undefined;
    }

    return {
      squad,
      entry,
      index: this.selectedSquadEntryIndex
    };
  }

  private getSquadEntryLoadoutSnapshot(squad: EnemyLabSquadPreset, index: number): AttackLoadoutSlot[] {
    const entry = squad.entries[index];
    if (!entry) {
      return [];
    }

    return cloneAttackLoadoutSlots(entry.attackLoadoutOverride ?? getDefaultEnemyAttackLoadout(entry.definitionId));
  }

  private upsertVariantPreset(variant: EnemyLabVariantPreset): void {
    this.presetState.variants = this.presetState.variants.filter((candidate) => candidate.id !== variant.id);
    this.presetState.variants.push(variant);
  }

  private upsertSquadPreset(squad: EnemyLabSquadPreset): void {
    this.presetState.squads = this.presetState.squads.filter((candidate) => candidate.id !== squad.id);
    this.presetState.squads.push(squad);
  }

  private createContextSnapshot() {
    const selectedDefinition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    return {
      selectedEnemyName: selectedDefinition.displayName,
      selectedVariantName: this.getSelectedVariant()?.displayName,
      selectedSquadName: this.getSelectedCustomSquad()?.displayName ?? getEnemyLabSquads()[this.selectedSquadIndex]?.displayName,
      enemyCount: this.enemies.length,
      projectileCount: this.projectiles.length,
      speedMultiplier: this.enemySpeedMultiplier,
      hpMultiplier: this.enemyHpMultiplier,
      fireRateMultiplier: this.enemyFireRateMultiplier,
      deconfliction: this.enemyDeconflictionEnabled ? this.enemyDeconflictionStrength.toFixed(2) : 'off',
      notes: this.getSelectedVariant()?.notes ?? this.getSelectedCustomSquad()?.notes ?? ''
    };
  }

  private getEntryLabel(entry: EnemyLabSquadPresetEntry): string {
    const variant = entry.variantId ? this.presetState.variants.find((candidate) => candidate.id === entry.variantId) : undefined;
    const definition = getEnemyLabDefinitions().find((candidate) => candidate.id === entry.definitionId);
    return variant?.displayName ?? definition?.displayName ?? entry.definitionId;
  }

  private savePresetState(): void {
    saveEnemyLabStorageState(this.presetState);
    saveAssetForgeStorageState({ assets: this.presetState.forgeAssets });
  }

  private saveEnemyLabPresetMarkdown(
    folder: EnemyLabPresetFolderCategory,
    filename: string,
    contents: string,
    statusMessage: string
  ): void {
    const safeFilename = this.sanitizePresetFilename(filename);
    const outputFilename = isDesktopRuntime()
      ? `enemy-lab/${folder}/${safeFilename}`
      : safeFilename;

    downloadTextFile(outputFilename, contents, 'text/markdown', 'debug-presets');
    this.setPresetStatus(statusMessage);
  }

  private openEnemyLabPresetFolder(folder: EnemyLabPresetFolderCategory): void {
    if (!isDesktopRuntime()) {
      this.setPresetStatus('Preset folders are available in the desktop build only.', true);
      return;
    }

    openDesktopDataFolder('debug-presets', `enemy-lab/${folder}`);
    this.setPresetStatus(`Opened enemy-lab/${folder}.`);
  }

  private createPresetFilename(prefix: string, label: string): string {
    return `${prefix}-${slugify(label)}-${getTimestampSlug()}.md`;
  }

  private sanitizePresetFilename(filename: string): string {
    const safeName = filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();

    return safeName.toLowerCase().endsWith('.md') ? safeName : `${safeName || 'enemy-lab-preset'}.md`;
  }

  private setPresetStatus(message: string, warn = false): void {
    if (warn) {
      console.warn(message);
    }

    if (!this.overlay) {
      return;
    }

    this.overlay.status.textContent = message;
    this.lastOverlayStatusText = message;
    this.nextOverlayStatusUpdateAt = this.time.now + 1750;
  }

  private setForgeImportReport(report: string): void {
    this.lastForgeValidationReport = report;
    if (this.overlay) {
      this.overlay.forgeImportReport.textContent = report;
    }
  }

  private formatForgeImportReport(label: string, importedCount: number, rejectedCount: number, reports: Array<ReturnType<typeof validateForgeAssetForAi>>): string {
    const warnings = reports.flatMap((report) => report.warnings.map((warning) => `${report.assetName ?? report.assetId ?? 'Asset'}: ${warning}`));
    const errors = reports.flatMap((report) => report.errors.map((error) => `${report.assetName ?? report.assetId ?? 'Asset'}: ${error}`));
    return [
      `${label}: imported ${importedCount}, rejected ${rejectedCount}.`,
      errors.length > 0 ? `Errors:\n${errors.join('\n')}` : 'Errors: none.',
      warnings.length > 0 ? `Warnings:\n${warnings.join('\n')}` : 'Warnings: none.'
    ].join('\n');
  }

  private formatForgeValidationReport(label: string, report: ReturnType<typeof validateForgeAssetForAi>): string {
    return [
      `${label}: ${report.valid ? 'valid' : 'invalid'} (${report.assetName ?? report.assetId ?? 'selected asset'}).`,
      report.errors.length > 0 ? `Errors:\n${report.errors.join('\n')}` : 'Errors: none.',
      report.warnings.length > 0 ? `Warnings:\n${report.warnings.join('\n')}` : 'Warnings: none.'
    ].join('\n');
  }

  private readNumberInput(input: HTMLInputElement, fallback: number, clampValue = true): number {
    const value = Number(input.value);
    const min = input.min === '' ? Number.NEGATIVE_INFINITY : Number(input.min);
    const max = input.max === '' ? Number.POSITIVE_INFINITY : Number(input.max);
    if (!Number.isFinite(value)) {
      return fallback;
    }

    const clamped = Phaser.Math.Clamp(
      value,
      Number.isFinite(min) ? min : Number.NEGATIVE_INFINITY,
      Number.isFinite(max) ? max : Number.POSITIVE_INFINITY
    );

    if (clampValue) {
      input.value = String(clamped);
    }
    return clamped;
  }

  private readForgeGameplayHint(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private isControlPanelEditingText(): boolean {
    if (!this.overlay) {
      return false;
    }

    return this.isEditablePanelTarget(document.activeElement);
  }

  private isEditablePanelTarget(target: EventTarget | Element | null): boolean {
    if (!this.overlay || !(target instanceof HTMLElement) || !this.overlay.root.contains(target)) {
      return false;
    }

    return target.matches('input, textarea, select, [contenteditable="true"]');
  }

  private setActionsEnabled(actions: string[], enabled: boolean): void {
    if (!this.overlay) {
      return;
    }

    for (const action of actions) {
      const buttons = this.overlay.root.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`);
      for (const button of buttons) {
        button.disabled = !enabled;
      }
    }
  }

  private setActionState(action: string, active: boolean, activeLabel: string, inactiveLabel: string): void {
    if (!this.overlay) {
      return;
    }

    const buttons = this.overlay.root.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`);
    for (const button of buttons) {
      button.classList.toggle('is-active', active);
      button.textContent = active ? activeLabel : inactiveLabel;
    }
  }

  private syncDesktopPresetButtons(): void {
    if (!this.overlay) {
      return;
    }

    const desktop = isDesktopRuntime();
    const folderActions: Array<[string, string]> = [
      ['openVariantFolder', 'Variant Folder'],
      ['openSquadFolder', 'Squad Folder'],
      ['openLoadoutFolder', 'Loadout Folder'],
      ['openAttackTestFolder', 'Attack Test Folder']
    ];

    for (const [action, label] of folderActions) {
      for (const button of this.overlay.root.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`)) {
        button.disabled = !desktop;
        button.textContent = desktop ? label : `${label} (Desktop)`;
      }
    }
  }

  private syncActionButtonStates(): void {
    this.setActionState('ai', this.isAiEnabled, 'AI On', 'AI Off');
    this.setActionState('invuln', this.isPlayerInvulnerable, 'Invuln On', 'Invuln Off');
    this.setActionState('labels', this.showDebugLabels, 'Labels On', 'Labels Off');
    this.setActionState('telegraphs', this.showTelegraphs, 'Telegraphs On', 'Telegraphs Off');
    this.setActionState('deconflict', this.enemyDeconflictionEnabled, 'Deconflict On', 'Deconflict Off');
    this.setActionState('collisionDebug', this.enemyCollisionDebugEnabled, 'Hit Circles On', 'Hit Circles Off');
    this.setActionState('reducedEffects', this.reducedEffects, 'Reduced FX On', 'Reduced FX Off');
    this.setActionState('pause', this.isSimulationPaused, 'Paused', 'Pause');
    this.setActionState('attackTesterAutoCycle', this.attackTesterAutoCycleEnabled, 'Auto-Cycle On', 'Auto-Cycle');

    if (!this.overlay) {
      return;
    }

    for (const button of this.overlay.root.querySelectorAll<HTMLButtonElement>('[data-lab-mode]')) {
      button.classList.toggle('is-active', button.dataset.labMode === this.labMode);
    }

    for (const button of this.overlay.root.querySelectorAll<HTMLButtonElement>('[data-readability-mode]')) {
      button.classList.toggle('is-active', button.dataset.readabilityMode === this.readabilityMode);
    }

    this.syncDesktopPresetButtons();
  }

  private setLabMode(mode: EnemyLabMode): void {
    if (!['basic', 'squads', 'attack-tester', 'stress', 'presets'].includes(mode)) {
      return;
    }

    this.labMode = mode;
    if (this.overlay) {
      this.overlay.root.classList.remove('is-mode-basic', 'is-mode-squads', 'is-mode-attack-tester', 'is-mode-stress', 'is-mode-presets');
      this.overlay.root.classList.add(`is-mode-${mode}`);
    }
    this.syncOverlayFromState();
  }

  private setReadabilityMode(mode: EnemyLabReadabilityMode): void {
    if (!['normal', 'color-safe', 'high-contrast'].includes(mode)) {
      return;
    }

    this.readabilityMode = mode;
    this.clearTestProps();
    this.syncOverlayFromState();
  }

  private setOverlayCollapsed(collapsed: boolean): void {
    if (!this.overlay) {
      return;
    }

    this.isOverlayCollapsed = collapsed;
    this.overlay.root.classList.toggle('is-collapsed', collapsed);
    this.overlay.toggleOverlayButton.textContent = collapsed ? 'Show UI' : 'Hide UI';
  }

  private updateFpsMeter(time: number, delta: number): void {
    if (!this.overlay) {
      return;
    }

    if (this.fpsSampleStartedAt <= 0) {
      this.fpsSampleStartedAt = time;
    }

    this.fpsFrameCount += 1;
    this.fpsDeltaTotal += delta;
    this.fpsWorstDelta = Math.max(this.fpsWorstDelta, delta);

    if (time < this.nextFpsMeterUpdateAt) {
      return;
    }

    const elapsed = Math.max(1, time - this.fpsSampleStartedAt);
    const fps = (this.fpsFrameCount * 1000) / elapsed;
    const averageFrameMs = this.fpsDeltaTotal / Math.max(1, this.fpsFrameCount);
    this.overlay.fps.textContent = `FPS ${fps.toFixed(0)} | avg ${averageFrameMs.toFixed(1)}ms | worst ${this.fpsWorstDelta.toFixed(1)}ms`;
    this.nextFpsMeterUpdateAt = time + 500;
    this.fpsSampleStartedAt = time;
    this.fpsFrameCount = 0;
    this.fpsDeltaTotal = 0;
    this.fpsWorstDelta = 0;
  }

  private beginDiagnosticsFrame(time: number, delta: number): EnemyLabDiagnosticsContext {
    return {
      frameId: this.diagnosticsFrameId,
      timeMs: time,
      deltaMs: delta,
      actualFps: this.game.loop.actualFps,
      startedAt: performance.now(),
      phases: {}
    };
  }

  private measureDiagnosticsPhase<T>(frame: EnemyLabDiagnosticsContext, name: string, callback: () => T): T {
    const startedAt = performance.now();
    try {
      return callback();
    } finally {
      frame.phases[name] = roundDiagnosticsNumber((frame.phases[name] ?? 0) + performance.now() - startedAt);
    }
  }

  private endDiagnosticsFrame(context: EnemyLabDiagnosticsContext): void {
    const totalMs = performance.now() - context.startedAt;
    const measuredMs = Object.values(context.phases).reduce((sum, value) => sum + value, 0);
    context.phases['unmeasured-render-browser'] = roundDiagnosticsNumber(Math.max(0, totalMs - measuredMs));
    const camera = this.cameras.main;
    const canvas = this.game.canvas;
    const selected = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const variant = this.getSelectedVariant();
    const frame: EnemyLabDiagnosticsFrame = {
      frameId: context.frameId,
      timeMs: roundDiagnosticsNumber(context.timeMs),
      deltaMs: roundDiagnosticsNumber(context.deltaMs),
      actualFps: roundDiagnosticsNumber(context.actualFps),
      totalMs: roundDiagnosticsNumber(totalMs),
      phases: context.phases,
      counts: {
        enemies: this.enemies.length,
        projectiles: this.projectiles.length,
        collisionDebugCircles: this.collisionDebugCircles.size
      },
      resizeCount: this.resizeEventCount,
      lastResizeAgoMs: this.lastResizeAt > 0 ? roundDiagnosticsNumber(context.timeMs - this.lastResizeAt) : null,
      overlayCollapsed: this.isOverlayCollapsed,
      simulationPaused: this.isSimulationPaused,
      documentVisible: document.visibilityState === 'visible',
      documentHasFocus: document.hasFocus(),
      viewport: {
        scaleWidth: this.scale.width,
        scaleHeight: this.scale.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        devicePixelRatio: window.devicePixelRatio
      },
      player: {
        x: roundDiagnosticsNumber(this.player.x),
        y: roundDiagnosticsNumber(this.player.y),
        velocityX: roundDiagnosticsNumber(this.playerVelocity.x),
        velocityY: roundDiagnosticsNumber(this.playerVelocity.y),
        speed: roundDiagnosticsNumber(this.playerVelocity.length())
      },
      camera: {
        scrollX: roundDiagnosticsNumber(camera.scrollX),
        scrollY: roundDiagnosticsNumber(camera.scrollY),
        width: camera.width,
        height: camera.height,
        followOffsetX: roundDiagnosticsNumber(this.cameraLead.x),
        followOffsetY: roundDiagnosticsNumber(this.cameraLead.y)
      },
      starfield: this.starfield.getDiagnosticsSnapshot(),
      selectedEnemy: selected?.id,
      selectedVariant: variant?.id
    };

    this.diagnosticsFrameId += 1;
    this.diagnosticsFrames.push(frame);
    if (this.diagnosticsFrames.length > LAB_DIAGNOSTICS_FRAME_LIMIT) {
      this.diagnosticsFrames.splice(0, this.diagnosticsFrames.length - LAB_DIAGNOSTICS_FRAME_LIMIT);
    }
  }

  private exportDiagnosticsReport(): void {
    const filename = `enemy-lab-diagnostics-${getTimestampSlug()}.md`;
    const report = this.createDiagnosticsMarkdown();

    downloadTextFile(filename, report, 'text/markdown', 'reports');
    this.lastDiagnosticsExportPath = filename;
    this.nextOverlayStatusUpdateAt = 0;
  }

  private createDiagnosticsMarkdown(): string {
    const frames = this.diagnosticsFrames;
    const stats = summarizeEnemyLabDiagnostics(frames);
    const latest = frames[frames.length - 1];
    const worstFrames = [...frames].sort((a, b) => b.deltaMs - a.deltaMs).slice(0, 12);
    const sampledFrames = sampleEnemyLabDiagnostics(frames, 120);
    const machineReadable = {
      type: 'starvivors-enemy-lab-diagnostics',
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      summary: stats,
      latest,
      worstFrames,
      sampledFrames
    };

    return [
      '# Starvivors Enemy Lab Diagnostics',
      '',
      `Saved: ${new Date().toLocaleString()}`,
      '',
      '## Summary',
      '',
      `- Frames captured: ${frames.length}`,
      `- Average delta: ${stats.averageDeltaMs.toFixed(2)}ms`,
      `- P95 delta: ${stats.p95DeltaMs.toFixed(2)}ms`,
      `- Worst delta: ${stats.maxDeltaMs.toFixed(2)}ms`,
      `- Average measured update: ${stats.averageMeasuredMs.toFixed(2)}ms`,
      `- Resize events: ${latest?.resizeCount ?? 0}`,
      `- Latest visibility/focus: ${latest?.documentVisible ? 'visible' : 'hidden'} / ${latest?.documentHasFocus ? 'focused' : 'blurred'}`,
      `- Latest canvas: ${latest ? `${latest.viewport.canvasWidth}x${latest.viewport.canvasHeight}` : 'n/a'}`,
      `- Latest Phaser scale: ${latest ? `${latest.viewport.scaleWidth}x${latest.viewport.scaleHeight}` : 'n/a'}`,
      `- Last export: ${this.lastDiagnosticsExportPath || 'n/a'}`,
      '',
      '## Top Phases',
      '',
      ...formatEnemyLabPhaseRows(stats.topPhases),
      '',
      '## Worst Frames',
      '',
      ...formatEnemyLabWorstFrames(worstFrames),
      '',
      '## Machine Readable Report',
      '',
      '```json',
      JSON.stringify(machineReadable, null, 2),
      '```',
      ''
    ].join('\n');
  }

  private getSelectedEffectiveDefinition(): EnemyLabDefinition {
    const baseDefinition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    return applyVariantToDefinition(baseDefinition, this.getSelectedVariant());
  }

  private getBaseForgeAsset(): ForgeAsset {
    return convertEnemyVisualDefinitionToForgeAsset(this.getSelectedEffectiveDefinition());
  }

  private getSelectedForgeAsset(): ForgeAsset {
    return this.presetState.forgeAssets.find((asset) => asset.id === this.selectedForgeAssetId) ?? this.getBaseForgeAsset();
  }

  private getSelectedStoredForgeAsset(): ForgeAsset | undefined {
    if (!this.selectedForgeAssetId) {
      return undefined;
    }

    return this.presetState.forgeAssets.find((asset) => asset.id === this.selectedForgeAssetId);
  }

  private getSelectedForgeLayer(): ForgeVectorLayer | undefined {
    return this.getSelectedForgeAsset().layers[this.selectedForgeLayerIndex];
  }

  private ensureForgeDraftForEditing(): ForgeAsset | undefined {
    if (this.selectedForgeAssetId) {
      return this.presetState.forgeAssets.find((asset) => asset.id === this.selectedForgeAssetId);
    }

    this.createForgeDraftForSelectedEnemy();
    return this.presetState.forgeAssets.find((asset) => asset.id === this.selectedForgeAssetId);
  }

  private getForgeContactSheetAssets(): ForgeAsset[] {
    const selected = this.getSelectedForgeAsset();
    const imported = this.presetState.forgeAssets.filter((asset) => asset.id !== selected.id).slice(-5);
    return [selected, ...imported];
  }

  private renderForgePreview(): void {
    if (!this.overlay) {
      return;
    }

    const asset = this.getSelectedForgeAsset();
    const mode = this.forgePreviewMode;
    const scale = mode === 'minimap' ? 0.32 : mode === 'projectile-motion' ? 0.54 : mode === 'weapon-icon' ? 0.68 : mode === 'combat' ? 0.92 : 0.76;
    const svg = renderForgeAssetToSvg(asset, { includeMetadata: false });
    const rawRadius = Number(asset.gameplayHints?.hitRadius ?? asset.boundsRadius);
    const radius = Number.isFinite(rawRadius) ? rawRadius : asset.boundsRadius;
    const stage = document.createElement('div');
    stage.className = 'enemy-lab-forge-preview-stage';

    if (mode === 'projectile-motion') {
      const lane = document.createElement('div');
      lane.className = 'enemy-lab-forge-motion-lane';
      lane.append(
        this.createForgePreviewSvgContainer(svg, 'enemy-lab-forge-motion-ghost is-far'),
        this.createForgePreviewSvgContainer(svg, 'enemy-lab-forge-motion-ghost is-mid'),
        this.createForgePreviewSvgContainer(svg, 'enemy-lab-forge-motion-asset', scale)
      );
      stage.append(lane);
    } else {
      stage.append(
        this.createForgePreviewSvgContainer(
          svg,
          'enemy-lab-forge-preview-asset',
          scale,
          mode === 'hit-radius' ? this.createForgeRadiusOverlay(asset.canvasSize, radius) : null
        )
      );
    }

    const caption = document.createElement('div');
    caption.className = 'enemy-lab-forge-preview-caption';
    caption.textContent = `${asset.displayName} | ${asset.layers.length} layers | ${asset.status} | ${createForgeVisualAssetId(asset)}`;

    this.overlay.forgePreview.className = `enemy-lab-forge-preview is-${mode}`;
    this.overlay.forgePreview.replaceChildren(stage, caption);
  }

  private createForgePreviewSvgContainer(svg: string, className: string, scale?: number, overlay?: SVGElement | null): HTMLDivElement {
    const container = document.createElement('div');
    container.className = className;
    if (scale !== undefined) {
      container.style.transform = `scale(${scale})`;
    }
    container.append(this.parseForgePreviewSvg(svg));
    if (overlay) {
      container.append(overlay);
    }
    return container;
  }

  private parseForgePreviewSvg(svg: string): SVGElement {
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = parsed.documentElement;
    if (root.nodeName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) {
      return document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    }

    return document.importNode(root, true) as unknown as SVGElement;
  }

  private createForgeRadiusOverlay(canvasSize: number, radius: number): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('enemy-lab-forge-radius');
    svg.setAttribute('viewBox', `${-canvasSize / 2} ${-canvasSize / 2} ${canvasSize} ${canvasSize}`);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(radius));
    svg.append(circle);
    return svg;
  }

  private createForgeAssetMarkdown(asset: ForgeAsset): string {
    const styleGuide = getNeonForwardSalvagepunkStyleGuide();
    return [
      `# Starvivors Forge Asset: ${asset.displayName}`,
      '',
      `- Kind: ${asset.kind}`,
      `- Status: ${asset.status}`,
      `- Visual asset id: ${createForgeVisualAssetId(asset)}`,
      `- Style guide: ${styleGuide.displayName} (${styleGuide.id})`,
      `- Tags: ${asset.tags.join(', ') || 'None'}`,
      '',
      '## Art Theme',
      styleGuide.summary,
      '',
      '## Forge Asset',
      '```json',
      JSON.stringify(asset, null, 2),
      '```',
      ''
    ].join('\n');
  }

  private translateForgeLayer(layer: ForgeVectorLayer, dx: number, dy: number): ForgeVectorLayer {
    return this.mapForgeLayerPoints(layer, (x, y) => [x + dx, y + dy]);
  }

  private scaleForgeLayer(layer: ForgeVectorLayer, scale: number): ForgeVectorLayer {
    return this.mapForgeLayerPoints(layer, (x, y) => [x * scale, y * scale], scale);
  }

  private mirrorForgeLayerX(layer: ForgeVectorLayer): ForgeVectorLayer {
    return this.mapForgeLayerPoints(layer, (x, y) => [-x, y]);
  }

  private mapForgeLayerPoints(
    layer: ForgeVectorLayer,
    mapPoint: (x: number, y: number) => [number, number],
    sizeScale = 1
  ): ForgeVectorLayer {
    switch (layer.type) {
      case 'polygon':
        return { ...layer, points: layer.points.map(([x, y]) => mapPoint(x, y)) };
      case 'line': {
        const from = mapPoint(layer.from[0], layer.from[1]);
        const to = mapPoint(layer.to[0], layer.to[1]);
        return { ...layer, from, to };
      }
      case 'ellipse': {
        const [x, y] = mapPoint(layer.x, layer.y);
        return { ...layer, x, y, radiusX: layer.radiusX * sizeScale, radiusY: layer.radiusY * sizeScale };
      }
      case 'ring':
      case 'glow': {
        const [x, y] = mapPoint(layer.x, layer.y);
        return { ...layer, x, y, radius: layer.radius * sizeScale };
      }
      case 'rect': {
        const [x, y] = mapPoint(layer.x, layer.y);
        return { ...layer, x, y, width: layer.width * sizeScale, height: layer.height * sizeScale };
      }
      case 'crescent':
        return { ...layer, radius: layer.radius * sizeScale };
      case 'path':
        return layer;
    }
  }

  private cloneForgeAsset(asset: ForgeAsset): ForgeAsset {
    return JSON.parse(JSON.stringify(asset)) as ForgeAsset;
  }

  private cloneForgeLayer(layer: ForgeVectorLayer): ForgeVectorLayer {
    return JSON.parse(JSON.stringify(layer)) as ForgeVectorLayer;
  }

  private normalizeForgePreviewMode(value: string): ForgePreviewMode {
    return value === 'minimap' ||
      value === 'projectile-motion' ||
      value === 'weapon-icon' ||
      value === 'silhouette' ||
      value === 'starfield' ||
      value === 'hit-radius'
      ? value
      : 'combat';
  }

  private normalizeForgeAiTaskType(value: string): ForgeAiTaskType {
    return FORGE_AI_TASK_OPTIONS.includes(value as ForgeAiTaskType) ? value as ForgeAiTaskType : 'batch';
  }

  private normalizeForgeAssetKind(value: string): ForgeAssetKind {
    return FORGE_ASSET_KIND_OPTIONS.includes(value as ForgeAssetKind) ? value as ForgeAssetKind : 'projectile';
  }

  private normalizeForgeTemplateId(value: string): ForgeAssetTemplateId {
    return getForgeAssetTemplates().some((template) => template.id === value)
      ? value as ForgeAssetTemplateId
      : 'projectile.neon-bolt';
  }

  private getForgeColorControlValue(color: ForgeVectorLayer['color']): string {
    return typeof color === 'string' && FORGE_COLOR_OPTIONS.includes(color) ? color : '';
  }

  private readForgeColorControl(value: string, fallback: ForgeVectorLayer['color']): ForgeVectorLayer['color'] {
    return FORGE_COLOR_OPTIONS.includes(value as keyof ForgePalette) ? (value as keyof ForgePalette) : fallback;
  }

  private colorNumberToInput(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  private colorInputToNumber(value: string, fallback: number): number {
    if (!/^#[0-9a-f]{6}$/i.test(value)) {
      return fallback;
    }
    return Number.parseInt(value.slice(1), 16);
  }

  private syncOverlayFromState(): void {
    if (!this.overlay) {
      return;
    }

    this.populateVariantSelect();
    this.populateCustomSquadSelect();
    this.overlay.enemySelect.selectedIndex = this.selectedEnemyIndex;
    this.overlay.squadSelect.selectedIndex = this.selectedSquadIndex;
    this.overlay.spawnCount.value = String(this.spawnCount);
    this.overlay.speedMultiplier.value = String(this.enemySpeedMultiplier);
    this.overlay.hpMultiplier.value = String(this.enemyHpMultiplier);
    this.overlay.fireRateMultiplier.value = String(this.enemyFireRateMultiplier);
    this.overlay.deconflictionStrength.value = String(this.enemyDeconflictionStrength);
    this.overlay.forgeBatchCount.value = String(this.forgeBatchCount);
    this.syncAiWorkbenchControlsFromState();
    this.syncVariantControlsFromState();
    this.syncSquadControlsFromState();
    this.renderAttackWorkflowControls();
    this.syncForgeControlsFromState();
    this.syncActionButtonStates();
  }

  private syncAiWorkbenchControlsFromState(): void {
    if (!this.overlay) {
      return;
    }

    this.populateForgeTemplateSelect(this.overlay.forgeAiTemplate, this.forgeAiAssetKind);
    if (!getForgeAssetTemplates(this.forgeAiAssetKind).some((template) => template.id === this.forgeAiTemplateId)) {
      this.forgeAiTemplateId = getForgeAssetTemplates(this.forgeAiAssetKind)[0]?.id ?? 'projectile.neon-bolt';
    }
    this.overlay.forgeAiTaskType.value = this.forgeAiTaskType;
    this.overlay.forgeAiAssetKind.value = this.forgeAiAssetKind;
    this.overlay.forgeAiTemplate.value = this.forgeAiTemplateId;
    this.overlay.forgeAiRole.value = this.forgeAiRole;
    this.overlay.forgeAiProductionTarget.value = this.forgeAiProductionTarget;
    this.overlay.forgeBatchCount.value = String(this.forgeBatchCount);
    this.overlay.forgeImportReport.textContent = this.lastForgeValidationReport;
  }

  private updateOverlayStatus(time: number): void {
    if (!this.overlay) {
      return;
    }
    if (time < this.nextOverlayStatusUpdateAt) {
      return;
    }

    const selected = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const variant = this.getSelectedVariant();
    const customSquad = this.getSelectedCustomSquad();
    const statusText =
      `${variant?.displayName ?? selected.displayName} | custom squad ${customSquad?.displayName ?? 'none'} | ` +
      `enemies ${this.enemies.length} | shots ${this.projectiles.length} | ` +
      `AI ${this.isAiEnabled ? 'on' : 'off'} | invuln ${this.isPlayerInvulnerable ? 'on' : 'off'} | ` +
      `labels ${this.showDebugLabels ? 'on' : 'off'} | telegraphs ${this.showTelegraphs ? 'on' : 'off'} | ` +
      `deconflict ${this.enemyDeconflictionEnabled ? this.enemyDeconflictionStrength.toFixed(2) : 'off'} | circles ${this.enemyCollisionDebugEnabled ? 'on' : 'off'} | ` +
      `paused ${this.isSimulationPaused ? 'yes' : 'no'} | hull ${Math.ceil(this.playerHull)}/${PLAYER_LAB_HULL} | ` +
      `mode ${this.labMode} | readability ${this.readabilityMode}${this.reducedEffects ? ' reduced-fx' : ''} | ` +
      `visual ${selected.visualStyle ?? 'forge-texture'} | forge ${this.presetState.forgeAssets.length} | style ${FORGE_STYLE_GUIDE_VERSION}` +
      `${this.lastDiagnosticsExportPath ? ` | report ${this.lastDiagnosticsExportPath}` : ''}`;
    if (statusText !== this.lastOverlayStatusText) {
      this.overlay.status.textContent = statusText;
      this.lastOverlayStatusText = statusText;
    }
    this.nextOverlayStatusUpdateAt = time + 250;
  }

  private updateThrusterEffects(
    time: number,
    thrustForward: boolean,
    thrustReverse: boolean,
    strafeLeft: boolean,
    strafeRight: boolean
  ): void {
    const shipForward = this.getForwardDirection(this.player.rotation);
    const shipRight = new Phaser.Math.Vector2(-shipForward.y, shipForward.x);

    if (thrustForward && time >= this.nextForwardThrusterAt) {
      this.emitThrusterParticle({ x: -13, y: 42 }, shipForward.clone().negate(), 1.45, shipForward, shipRight);
      this.emitThrusterParticle({ x: 13, y: 42 }, shipForward.clone().negate(), 1.45, shipForward, shipRight);
      this.nextForwardThrusterAt = time + FORWARD_THRUSTER_INTERVAL_MS;
    }

    if (thrustReverse && time >= this.nextReverseThrusterAt) {
      this.emitThrusterParticle({ x: -11, y: -37 }, shipForward, 0.95, shipForward, shipRight);
      this.emitThrusterParticle({ x: 11, y: -37 }, shipForward, 0.95, shipForward, shipRight);
      this.nextReverseThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeLeft && time >= this.nextLeftStrafeThrusterAt) {
      this.emitThrusterParticle({ x: 38, y: 2 }, shipRight, 0.8, shipForward, shipRight);
      this.nextLeftStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }

    if (strafeRight && time >= this.nextRightStrafeThrusterAt) {
      this.emitThrusterParticle({ x: -38, y: 2 }, shipRight.clone().negate(), 0.8, shipForward, shipRight);
      this.nextRightStrafeThrusterAt = time + SECONDARY_THRUSTER_INTERVAL_MS;
    }
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

  private emitLabBurst(x: number, y: number, color: number, count = 8): void {
    emitEffectSparkBurst(this, x, y, {
      kind: 'spark-burst',
      color,
      radius: Math.max(28, count * 5),
      durationMs: 260,
      intensity: Phaser.Math.Clamp(count / 8, 0.35, 1.4),
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    });
  }

  private emitExplosion(x: number, y: number, radius: number, color: number): void {
    emitEffectWarningRadius(this, x, y, {
      kind: 'warning-radius',
      color,
      radius,
      durationMs: 260,
      intensity: 1,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    });
    emitEffectShardBurst(this, x, y, {
      kind: 'shard-burst',
      color,
      radius: radius * 0.72,
      durationMs: 360,
      intensity: 1,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    });
  }

  private flashEnemy(enemy: EnemyLabInstance): void {
    emitEffectOutlineFlash(this, enemy.body, {
      kind: 'outline-flash',
      color: enemy.definition.effectRecipe?.hit.color ?? 0xffffff,
      durationMs: enemy.definition.effectRecipe?.hit.durationMs ?? 70,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    });
  }

  private updateEnemyMovementEffects(time: number): void {
    if (this.reducedEffects && this.enemies.length > 24) {
      return;
    }

    for (const enemy of this.enemies) {
      if (!enemy.definition.effectRecipe || enemy.velocity.lengthSq() < 1200) {
        continue;
      }

      const nextTrailAt = typeof enemy.stateData.nextTrailAt === 'number' ? enemy.stateData.nextTrailAt : 0;
      if (time < nextTrailAt) {
        continue;
      }

      const direction = enemy.velocity.clone().normalize();
      this.emitEnemyRecipeEffect(enemy.definition, 'move', enemy.body.x, enemy.body.y, direction);
      enemy.stateData.nextTrailAt = time + (this.reducedEffects ? 260 : 135);
    }
  }

  private emitEnemyRecipeEffect(
    definition: EnemyLabDefinition,
    slot: keyof NonNullable<EnemyLabDefinition['effectRecipe']>,
    x: number,
    y: number,
    direction = new Phaser.Math.Vector2(0, -1)
  ): void {
    const recipe = definition.effectRecipe?.[slot];
    if (!recipe) {
      if (slot === 'hit') {
        emitEffectSparkBurst(this, x, y, {
          kind: 'spark-burst',
          color: definition.visual.accentColor,
          radius: 34,
          durationMs: 220,
          intensity: 0.65,
          reducedEffects: this.reducedEffects,
          readabilityMode: this.readabilityMode
        });
      }
      return;
    }

    const effect = normalizeEnemyEffectEntry(recipe, this.reducedEffects);
    const options = {
      ...effect,
      reducedEffects: this.reducedEffects,
      readabilityMode: this.readabilityMode
    };

    switch (effect.kind) {
      case 'blink-ring':
      case 'bracket-pulse':
        emitEffectRingPulse(this, x, y, options);
        break;
      case 'line-sweep':
        emitEffectLineSweep(this, x, y, direction, options);
        break;
      case 'warning-line':
      case 'projectile-trail':
        emitEffectWarningBeam(this, x, y, direction, options);
        break;
      case 'warning-radius':
        emitEffectWarningRadius(this, x, y, options);
        break;
      case 'support-aura':
        emitEffectSupportAura(this, x, y, options);
        break;
      case 'spark-trail':
        emitEffectTrailTick(this, x, y, direction, options);
        break;
      case 'muzzle-flash':
        emitEffectMuzzleFlash(this, x, y, direction, options);
        break;
      case 'outline-flash':
        emitEffectSparkBurst(this, x, y, options);
        break;
      case 'spark-burst':
        emitEffectSparkBurst(this, x, y, options);
        break;
      case 'shard-burst':
        emitEffectShardBurst(this, x, y, options);
        break;
    }
  }

  private previewEnemyState(state: EnemyLabPreviewState): void {
    const definition = this.getSelectedEffectiveDefinition();
    const position = this.getPreviewPosition();
    const body = createEnemyLabVisualContainer(this, position.x, position.y, definition);
    const toPlayer = this.getWrappedDirection(position.x, position.y, this.player.x, this.player.y);
    const direction = toPlayer.lengthSq() > 0 ? toPlayer.normalize() : new Phaser.Math.Vector2(0, -1);
    body.setRotation(Math.atan2(direction.x, -direction.y));
    body.setDepth(16);
    this.previewBodies.push(body);

    if (state === 'idle') {
      this.emitEnemyRecipeEffect(definition, 'spawn', body.x, body.y, direction);
    } else if (state === 'pursue') {
      this.emitEnemyRecipeEffect(definition, 'move', body.x, body.y, direction);
      this.tweens.add({
        targets: body,
        x: body.x + direction.x * 92,
        y: body.y + direction.y * 92,
        duration: this.reducedEffects ? 420 : 680,
        ease: 'Sine.easeInOut'
      });
    } else if (state === 'telegraph') {
      this.emitEnemyRecipeEffect(definition, 'telegraph', body.x, body.y, direction);
    } else if (state === 'attack') {
      const muzzleX = body.x + direction.x * (definition.stats.radius + 14);
      const muzzleY = body.y + direction.y * (definition.stats.radius + 14);
      this.emitEnemyRecipeEffect(definition, 'fire', muzzleX, muzzleY, direction);
      this.previewProjectileTrace(muzzleX, muzzleY, direction, definition.effectRecipe?.fire.color ?? definition.visual.accentColor);
    } else if (state === 'hit') {
      this.flashEnemy({ body, definition } as EnemyLabInstance);
      this.emitEnemyRecipeEffect(definition, 'hit', body.x, body.y, direction);
    } else if (state === 'death') {
      this.emitEnemyRecipeEffect(definition, 'death', body.x, body.y, direction);
      this.time.delayedCall(90, () => {
        this.destroyPreviewBody(body);
      });
      return;
    }

    this.time.delayedCall(this.reducedEffects ? 820 : 1350, () => {
      this.destroyPreviewBody(body);
    });
  }

  private previewProjectileTrace(x: number, y: number, direction: Phaser.Math.Vector2, color: number): void {
    const readableColor = resolveEnemyLabEffectColor(color, this.readabilityMode);
    const normalized = direction.lengthSq() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(0, -1);
    const dot = this.add.circle(x, y, 4, readableColor, 0.18);
    dot.setStrokeStyle(1.2, readableColor, 0.86);
    dot.setDepth(13);
    dot.setBlendMode(Phaser.BlendModes.ADD);
    this.testProps.push(dot);

    this.tweens.add({
      targets: dot,
      x: x + normalized.x * (this.reducedEffects ? 120 : 210),
      y: y + normalized.y * (this.reducedEffects ? 120 : 210),
      alpha: 0,
      duration: this.reducedEffects ? 260 : 420,
      ease: 'Quad.easeOut',
      onComplete: () => {
        dot.destroy();
        this.testProps = this.testProps.filter((candidate) => candidate !== dot);
      }
    });
  }

  private getPreviewPosition(): Phaser.Math.Vector2 {
    const camera = this.cameras.main;
    return new Phaser.Math.Vector2(
      wrapCoordinate(camera.scrollX + camera.width * 0.66, this.arena.width),
      wrapCoordinate(camera.scrollY + camera.height * 0.46, this.arena.height)
    );
  }

  private destroyPreviewBody(body: Phaser.GameObjects.Container): void {
    body.destroy(true);
    this.previewBodies = this.previewBodies.filter((candidate) => candidate !== body);
  }

  private clearPreviewBodies(): void {
    for (const body of this.previewBodies) {
      body.destroy(true);
    }
    this.previewBodies = [];
  }

  private spawnClutterTest(test: EnemyLabClutterTest): void {
    if (test === 'single') {
      this.clearEnemies();
      this.spawnSelectedEnemy();
      return;
    }

    if (test === 'squad') {
      this.clearEnemies();
      this.spawnSelectedSquad();
      return;
    }

    if (test === 'swarm') {
      this.clearEnemies();
      this.spawnEnemySwarm(50);
      return;
    }

    if (test === 'bullets') {
      this.spawnProjectileClutter(28);
      return;
    }

    if (test === 'asteroids') {
      this.spawnAsteroidProps(14);
      return;
    }

    if (test === 'asteroidGallery') {
      this.spawnAsteroidGallery();
      return;
    }

    if (test === 'debris') {
      this.spawnDebrisProps(24);
      return;
    }

    this.clearEnemies();
    this.spawnEnemySwarm(50);
    this.spawnProjectileClutter(32);
    this.spawnAsteroidProps(16);
    this.spawnDebrisProps(28);
  }

  private spawnEnemySwarm(count: number): void {
    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    for (let index = 0; index < count; index += 1) {
      const distance = Phaser.Math.FloatBetween(360, 980);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.spawnEnemy(
        definition.id,
        wrapCoordinate(this.player.x + Math.cos(angle) * distance, this.arena.width),
        wrapCoordinate(this.player.y + Math.sin(angle) * distance, this.arena.height),
        this.getSelectedVariant()?.id
      );
    }
  }

  private spawnProjectileClutter(count: number): void {
    const center = this.getPreviewPosition();
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.18, 0.18);
      const startDistance = Phaser.Math.FloatBetween(220, 520);
      const x = wrapCoordinate(center.x + Math.cos(angle) * startDistance, this.arena.width);
      const y = wrapCoordinate(center.y + Math.sin(angle) * startDistance, this.arena.height);
      const direction = this.getWrappedDirection(x, y, center.x, center.y).normalize();
      this.createProjectile({
        owner: 'enemy',
        x,
        y,
        direction,
        speed: Phaser.Math.FloatBetween(260, 560),
        damage: 0,
        range: 900,
        radius: 5,
        color: 0xffffff
      });
    }
  }

  private spawnLabScrapProps(count: number): void {
    for (const scrap of this.labScrapProps) {
      scrap.body.destroy();
    }
    this.labScrapProps = [];

    for (let index = 0; index < count; index += 1) {
      const position = this.getPropPosition(index, count, 180, 520);
      const body = this.add.circle(position.x, position.y, 7, 0x000000, 1);
      body.setStrokeStyle(1.4, 0xffffff, 0.88);
      body.setDepth(4);
      this.labScrapProps.push({
        id: `lab-scrap-${index}`,
        x: position.x,
        y: position.y,
        value: index % 3 === 0 ? 3 : 1,
        collected: false,
        body
      });
    }
  }

  private stealLabScrap(target: EnemyLabScrapTarget): number {
    const scrap = this.labScrapProps.find((candidate) => candidate.id === target.id && !candidate.collected);
    if (!scrap) {
      return 0;
    }

    scrap.collected = true;
    scrap.body.destroy();
    this.labScrapProps = this.labScrapProps.filter((candidate) => candidate !== scrap);
    return scrap.value;
  }

  private spawnAsteroidProps(count: number): void {
    this.clearTestProps();
    for (let index = 0; index < count; index += 1) {
      const position = this.getPropPosition(index, count, 260, 880);
      const tier = ASTEROID_TIERS[index % ASTEROID_TIERS.length];
      const family = ASTEROID_VISUAL_FAMILIES[index % ASTEROID_VISUAL_FAMILIES.length];
      this.testProps.push(this.createAsteroidProp(position.x, position.y, tier, family, false));
    }
  }

  private spawnAsteroidGallery(): void {
    this.clearTestProps();
    const center = this.getPreviewPosition();
    const columns = 4;
    const spacingX = 360;
    const spacingY = 350;
    const samples = ASTEROID_VISUAL_FAMILIES.slice(0, 12);

    for (let index = 0; index < samples.length; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const tier = ASTEROID_TIERS[(index * 3) % ASTEROID_TIERS.length];
      const x = wrapCoordinate(center.x + (column - (columns - 1) / 2) * spacingX, this.arena.width);
      const y = wrapCoordinate(center.y + (row - 1) * spacingY, this.arena.height);
      this.testProps.push(this.createAsteroidProp(x, y, tier, samples[index], true));
    }
  }

  private spawnDebrisProps(count: number): void {
    for (let index = 0; index < count; index += 1) {
      const position = this.getPropPosition(index, count, 190, 760);
      this.testProps.push(this.createOutlineDebris(position.x, position.y, Phaser.Math.FloatBetween(14, 42)));
    }
  }

  private getPropPosition(index: number, total: number, minDistance: number, maxDistance: number): Phaser.Math.Vector2 {
    const angle = (Math.PI * 2 * index) / Math.max(1, total) + Phaser.Math.FloatBetween(-0.24, 0.24);
    const distance = Phaser.Math.FloatBetween(minDistance, maxDistance);
    return new Phaser.Math.Vector2(
      wrapCoordinate(this.player.x + Math.cos(angle) * distance, this.arena.width),
      wrapCoordinate(this.player.y + Math.sin(angle) * distance, this.arena.height)
    );
  }

  private createAsteroidProp(
    x: number,
    y: number,
    tier: (typeof ASTEROID_TIERS)[number],
    family: number,
    sourceScale: boolean
  ): Phaser.GameObjects.Image {
    const textureKey = getMonochromeAsteroidTextureKey(tier, family);
    const size = resolveAsteroidObjectSizeProfile(tier, `enemy-lab-asteroid-tier-${tier}-family-${family}`);
    createMonochromeAsteroidTexture(this, tier, family);
    const image = this.add.image(x, y, textureKey);
    const displaySize = sourceScale ? size.sourceDiameterPx : size.visualDiameterPx;
    image.setOrigin(0.5, 0.5);
    image.setDisplaySize(displaySize, displaySize);
    image.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    image.setDepth(3);
    return image;
  }

  private createOutlineDebris(x: number, y: number, radius: number): Phaser.GameObjects.Graphics {
    const color = 0xffffff;
    const graphics = this.add.graphics({ x, y });
    graphics.lineStyle(1.2, color, 0.8);
    graphics.fillStyle(0x000000, 1);
    graphics.beginPath();
    graphics.moveTo(-radius * 0.5, -radius * 0.2);
    graphics.lineTo(radius * 0.45, -radius * 0.38);
    graphics.lineTo(radius * 0.16, radius * 0.42);
    graphics.lineTo(-radius * 0.54, radius * 0.28);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.lineBetween(-radius * 0.18, -radius * 0.18, radius * 0.24, radius * 0.2);
    graphics.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    graphics.setDepth(3);
    return graphics;
  }

  private clearTestProps(): void {
    for (const prop of this.testProps) {
      prop.destroy();
    }
    this.testProps = [];
    for (const scrap of this.labScrapProps) {
      scrap.body.destroy();
    }
    this.labScrapProps = [];
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

  private updateToroidalRenderMirror(
    source: Phaser.GameObjects.Container,
    mirror: Phaser.GameObjects.Container,
    viewRadius: number
  ): void {
    const camera = this.cameras.main;
    const cameraCenterX = camera.scrollX + camera.width / 2;
    const cameraCenterY = camera.scrollY + camera.height / 2;
    const mirrorX = this.getNearestWrappedRenderCoordinate(source.x, cameraCenterX, this.arena.width);
    const mirrorY = this.getNearestWrappedRenderCoordinate(source.y, cameraCenterY, this.arena.height);
    const showMirror = source.visible && (mirrorX !== source.x || mirrorY !== source.y) && this.isCircleInCameraView(mirrorX, mirrorY, viewRadius);

    mirror.setPosition(mirrorX, mirrorY);
    mirror.setRotation(source.rotation);
    mirror.setScale(source.scaleX, source.scaleY);
    mirror.setAlpha(source.alpha);
    mirror.setVisible(showMirror);
  }

  private getNearestWrappedRenderCoordinate(value: number, cameraCenter: number, arenaSize: number): number {
    const delta = cameraCenter - value;
    if (delta > arenaSize / 2) return value + arenaSize;
    if (delta < -arenaSize / 2) return value - arenaSize;
    return value;
  }

  private isCircleInCameraView(x: number, y: number, radius: number): boolean {
    const camera = this.cameras.main;
    return x + radius >= camera.scrollX &&
      x - radius <= camera.scrollX + camera.width &&
      y + radius >= camera.scrollY &&
      y - radius <= camera.scrollY + camera.height;
  }

  private getWrappedDirection(fromX: number, fromY: number, toX: number, toY: number): Phaser.Math.Vector2 {
    return getWrappedDirection(this.arena, fromX, fromY, toX, toY);
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

  private handleResize(): void {
    this.resizeEventCount += 1;
    this.lastResizeAt = this.time.now;
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    this.starfield.resize(viewport.width, viewport.height);
    this.player.setPosition(wrapCoordinate(this.player.x, this.arena.width), wrapCoordinate(this.player.y, this.arena.height));
    this.cameras.main.setFollowOffset(-this.cameraLead.x, -this.cameraLead.y);
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.resetBackgroundPlayerTracking();
    this.clearEnemyCollisionDebug();
  }
}

function readAttackNumberParam(
  params: Record<string, EnemyAttackParamValue> | undefined,
  key: string,
  fallback: number
): number {
  const value = params?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function directionFromAttackRequest(direction: { x: number; y: number }): Phaser.Math.Vector2 {
  const vector = new Phaser.Math.Vector2(direction.x, direction.y);
  if (vector.lengthSq() <= 0.0001) {
    return new Phaser.Math.Vector2(0, -1);
  }
  return vector.normalize();
}

function rotateSceneDirection(direction: Phaser.Math.Vector2, radians: number): Phaser.Math.Vector2 {
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  return new Phaser.Math.Vector2(
    direction.x * cos - direction.y * sin,
    direction.x * sin + direction.y * cos
  ).normalize();
}

function summarizeEnemyLabDiagnostics(frames: EnemyLabDiagnosticsFrame[]) {
  const deltas = frames.map((frame) => frame.deltaMs).sort((a, b) => a - b);
  const measuredTotals = frames.map((frame) => frame.totalMs);
  const phaseTotals: Record<string, number> = {};
  const phaseMax: Record<string, number> = {};

  for (const frame of frames) {
    for (const [name, value] of Object.entries(frame.phases)) {
      phaseTotals[name] = (phaseTotals[name] ?? 0) + value;
      phaseMax[name] = Math.max(phaseMax[name] ?? 0, value);
    }
  }

  const topPhases = Object.entries(phaseTotals)
    .map(([name, totalMs]) => ({
      name,
      totalMs: roundDiagnosticsNumber(totalMs),
      averageMs: roundDiagnosticsNumber(frames.length > 0 ? totalMs / frames.length : 0),
      maxMs: roundDiagnosticsNumber(phaseMax[name] ?? 0)
    }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 12);

  return {
    averageDeltaMs: roundDiagnosticsNumber(averageDiagnosticsValue(deltas)),
    p95DeltaMs: roundDiagnosticsNumber(percentileDiagnosticsValue(deltas, 0.95)),
    maxDeltaMs: roundDiagnosticsNumber(deltas[deltas.length - 1] ?? 0),
    averageMeasuredMs: roundDiagnosticsNumber(averageDiagnosticsValue(measuredTotals)),
    topPhases
  };
}

function formatEnemyLabPhaseRows(phases: Array<{ name: string; totalMs: number; averageMs: number; maxMs: number }>): string[] {
  if (phases.length <= 0) {
    return ['No phase timings captured.'];
  }

  return [
    '| Phase | Total ms | Avg ms/frame | Max ms |',
    '| --- | ---: | ---: | ---: |',
    ...phases.map((phase) => `| ${phase.name} | ${phase.totalMs.toFixed(2)} | ${phase.averageMs.toFixed(3)} | ${phase.maxMs.toFixed(3)} |`)
  ];
}

function formatEnemyLabWorstFrames(frames: EnemyLabDiagnosticsFrame[]): string[] {
  if (frames.length <= 0) {
    return ['No frames captured.'];
  }

  return frames.map((frame, index) => {
    const topPhases = Object.entries(frame.phases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => `${name} ${value.toFixed(2)}ms`)
      .join(', ');

    return `${index + 1}. Frame ${frame.frameId}: delta ${frame.deltaMs.toFixed(2)}ms, measured ${frame.totalMs.toFixed(2)}ms, actual ${frame.actualFps.toFixed(1)} FPS, resize count ${frame.resizeCount}, player speed ${frame.player.speed.toFixed(1)}, star near ${frame.starfield.nearTileX ?? 'n/a'}/${frame.starfield.nearTileY ?? 'n/a'}. Top phases: ${topPhases || 'n/a'}.`;
  });
}

function sampleEnemyLabDiagnostics(frames: EnemyLabDiagnosticsFrame[], limit: number): EnemyLabDiagnosticsFrame[] {
  if (frames.length <= limit) {
    return frames;
  }

  const sampled: EnemyLabDiagnosticsFrame[] = [];
  const step = (frames.length - 1) / (limit - 1);
  for (let index = 0; index < limit; index += 1) {
    sampled.push(frames[Math.round(index * step)]);
  }
  return sampled;
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abX = bx - ax;
  const abY = by - ay;
  const lengthSq = abX * abX + abY * abY;
  if (lengthSq <= 0.0001) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * abX + (py - ay) * abY) / lengthSq));
  const closestX = ax + abX * t;
  const closestY = ay + abY * t;
  return Math.hypot(px - closestX, py - closestY);
}

function averageDiagnosticsValue(values: number[]): number {
  if (values.length <= 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentileDiagnosticsValue(sortedValues: number[], percentile: number): number {
  if (sortedValues.length <= 0) {
    return 0;
  }

  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * percentile) - 1));
  return sortedValues[index];
}

function roundDiagnosticsNumber(value: number): number {
  return Number(value.toFixed(3));
}
