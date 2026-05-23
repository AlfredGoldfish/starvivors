import Phaser from 'phaser';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { DEFAULT_SHIP_ID, getShipDefinition } from '../data/ships';
import { getWeaponDefinition } from '../data/weapons';
import { getForgeAssetDefinition } from '../data/forgeAssetRegistry';
import { VELOCITY_LIMITER_BASE_SPEED } from '../data/permanentUpgrades';
import { ENEMY_LAB_DEFINITIONS, type EnemyLabDefinition } from '../data/enemyLabDefinitions';
import {
  CAMERA_LEAD_LERP,
  CAMERA_LEAD_MAX_DISTANCE,
  CAMERA_LEAD_MIN_SPEED,
  FORWARD_THRUSTER_INTERVAL_MS,
  PLAYER_SHIP_DISPLAY_SIZE,
  PLAYER_SHIP_TEXTURE_KEY,
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
import { createEnemyLabVisualTextures } from '../systems/enemyVisuals';
import {
  getWrappedDirection,
  updateEnemyLabAi,
  type EnemyLabProjectileRequest
} from '../systems/enemyLabAi';
import {
  clearEnemyLabEnemies,
  destroyEnemyLabEnemy,
  getEnemyLabDefinitions,
  getEnemyLabSquads,
  setEnemyLabDebugLabels,
  spawnEnemyLabEnemy,
  type EnemyLabInstance
} from '../systems/enemyLabSpawner';
import { downloadTextFile, getTimestampSlug, loadMarkdownFile } from '../systems/debug/debugPersistence';
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
  saveEnemyLabStorageState,
  slugify,
  type EnemyLabAssetStatus,
  type EnemyLabSquadPreset,
  type EnemyLabSquadPresetEntry,
  type EnemyLabStorageState,
  type EnemyLabVariantPreset
} from '../systems/enemyLabPresets';
import {
  FORGE_ASSET_STATUSES,
  FORGE_STYLE_GUIDE_VERSION,
  convertEnemyVisualDefinitionToForgeAsset,
  convertProjectileVisualDefinitionToForgeAsset,
  convertWeaponDefinitionToForgeAsset,
  createForgeAiBrief,
  createForgeAssetTexture,
  createForgeContactSheetData,
  createForgeProductionPromotionBundle,
  createForgeProductionPromotionMarkdown,
  createForgePromotionBundle,
  createForgePromotionMarkdown,
  createForgeVisualAssetId,
  getForgeTextureKey,
  getNeonForwardSalvagepunkStyleGuide,
  isForgeAssetApprovedForPromotion,
  loadAssetForgeStorageState,
  parseForgeAssetImport,
  parseForgeAssetImports,
  renderForgeAssetToSvg,
  saveAssetForgeStorageState,
  type ForgeAsset,
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
type ForgePreviewMode = 'combat' | 'projectile-motion' | 'weapon-icon' | 'minimap' | 'silhouette' | 'starfield' | 'hit-radius';

export class EnemyLabScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private starfield!: StarfieldSystem;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private cameraLead = new Phaser.Math.Vector2(0, 0);
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies: EnemyLabInstance[] = [];
  private projectiles: EnemyLabProjectile[] = [];
  private overlay?: EnemyLabOverlayRefs;
  private presetState: EnemyLabStorageState = createInitialEnemyLabStorageState();
  private selectedEnemyIndex = 0;
  private selectedVariantId = '';
  private selectedForgeAssetId = '';
  private selectedForgeLayerIndex = 0;
  private forgePreviewMode: ForgePreviewMode = 'combat';
  private forgeBatchCount = 8;
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

  preload(): void {
    this.load.image(PLAYER_SHIP_TEXTURE_KEY, playerShipUrl);
  }

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
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      for (const delayedSpawn of this.delayedSquadSpawns) {
        delayedSpawn.remove(false);
      }
      this.delayedSquadSpawns = [];
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

      this.measureDiagnosticsPhase(diagnostics, 'player-movement', () => this.updatePlayerMovement(time, deltaSeconds));
      this.measureDiagnosticsPhase(diagnostics, 'player-wrap', () => this.wrapPlayer());
      this.measureDiagnosticsPhase(diagnostics, 'camera-lead', () => this.updateCameraLead());
      this.measureDiagnosticsPhase(diagnostics, 'player-firing', () => this.updatePlayerFiring(time));
      this.measureDiagnosticsPhase(diagnostics, 'projectiles', () => this.updateProjectiles(time, deltaSeconds));

      this.measureDiagnosticsPhase(diagnostics, 'enemy-ai', () =>
        updateEnemyLabAi({
          scene: this,
          arena: this.arena,
          enemies: this.enemies,
          scrapPickups: [],
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
          emitLabBurst: (x, y, color, count) => this.emitLabBurst(x, y, color, count)
        })
      );

      this.measureDiagnosticsPhase(diagnostics, 'enemy-contacts', () => this.updateEnemyContacts(time));
      this.measureDiagnosticsPhase(diagnostics, 'enemy-cleanup', () => this.removeDeadEnemies());
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

  private createPlayerShip(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, PLAYER_SHIP_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(LAB_PLAYER_SHIP.displaySize ?? PLAYER_SHIP_DISPLAY_SIZE, LAB_PLAYER_SHIP.displaySize ?? PLAYER_SHIP_DISPLAY_SIZE);
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

    applyPlayerFlightAcceleration({
      player: this.player,
      velocity: this.playerVelocity,
      controls,
      stats: flightStats,
      deltaSeconds
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
    return {
      thrust: this.getPlayerThrustAcceleration(),
      brake: this.getPlayerReverseThrustAcceleration(),
      strafe: this.getPlayerStrafeThrustAcceleration(),
      moveSpeed: this.getPlayerMaxSpeed(),
      velocityLimit: this.getPlayerVelocityLimit(),
      lowFrictionDamping: LAB_PLAYER_SHIP.movement.lowFrictionDamping,
      overspeedDamping: this.getPlayerOverspeedDamping()
    };
  }

  private updatePlayerFacing(): void {
    if (this.isPointerOverControlPanel) {
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
    this.createProjectile({
      owner: 'enemy',
      x: request.x,
      y: request.y,
      direction: request.direction,
      speed: request.speed,
      damage: request.damage,
      range: request.range,
      radius: request.radius,
      color: request.color
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
      rangeRemaining: input.range
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
    const forgeAsset = owner === 'player' ? getForgeAssetDefinition('forge.projectile.pulse-cannon-bolt') : undefined;
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
      this.emitLabBurst(projectile.body.x, projectile.body.y, enemy.definition.visual.accentColor, 4);
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
    return true;
  }

  private tryReflectProjectile(projectile: EnemyLabProjectile, enemy: EnemyLabInstance): boolean {
    if (enemy.definition.behavior.id !== 'reflectorPulse' || enemy.stateData.reflecting !== true) {
      return false;
    }

    const frontArcDegrees = Number(enemy.definition.behavior.params?.frontArcDegrees ?? 92);
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
    this.emitLabBurst(projectile.body.x, projectile.body.y, enemy.definition.visual.accentColor, 8);
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
      const offset = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);
      if (offset.length() <= enemy.definition.stats.radius + PLAYER_LAB_HIT_RADIUS) {
        this.damagePlayer(enemy.definition.stats.contactDamage * 0.03);
        if (time % 180 < 16) {
          this.emitLabBurst(this.player.x, this.player.y, enemy.definition.visual.accentColor, 3);
        }
      }
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
    this.emitLabBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.glowColor, 14);

    if (enemy.definition.behavior.id === 'splitterChase') {
      const childId = String(enemy.definition.behavior.params?.childId ?? 'shard-drone');
      const childCount = Number(enemy.definition.behavior.params?.childCount ?? 3);
      for (let i = 0; i < childCount; i += 1) {
        const angle = (Math.PI * 2 * i) / childCount + Phaser.Math.FloatBetween(-0.25, 0.25);
        this.spawnEnemy(childId, enemy.body.x + Math.cos(angle) * 42, enemy.body.y + Math.sin(angle) * 42);
      }
    }
  }

  private spawnEnemy(definitionId: string, x: number, y: number, variantId?: string): void {
    const baseDefinition = getEnemyLabDefinitions().find((definition) => definition.id === definitionId);
    if (!baseDefinition) {
      return;
    }

    const variant = variantId ? this.presetState.variants.find((candidate) => candidate.id === variantId) : undefined;
    const effectiveDefinition = applyVariantToDefinition(baseDefinition, variant);
    this.enemies.push(
      spawnEnemyLabEnemy({
        scene: this,
        arena: this.arena,
        definitionId,
        definitionOverride: effectiveDefinition,
        variantId: variant?.id,
        x,
        y,
        time: this.time.now,
        hpMultiplier: this.enemyHpMultiplier,
        showDebugLabel: this.showDebugLabels
      })
    );
  }

  private spawnSelectedEnemy(): void {
    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    for (let i = 0; i < this.spawnCount; i += 1) {
      const position = this.getSpawnPositionAroundPlayer(420 + i * 16);
      this.spawnEnemy(definition.id, position.x, position.y, this.getSelectedVariant()?.id);
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
    for (const entry of squad.entries) {
      const spawn = () => this.spawnEnemy(entry.definitionId, centerX + entry.x, centerY + entry.y, entry.variantId);
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
    root.className = 'enemy-lab-overlay';
    root.innerHTML = `
      <div class="enemy-lab-header">
        <div class="enemy-lab-title">Asset Forge / Enemy Lab</div>
        <button data-action="toggleOverlay">Hide UI</button>
      </div>
      <section class="enemy-lab-panel">
        <div class="enemy-lab-panel-title">Neon-Forward Salvagepunk</div>
        <div class="enemy-lab-style-guide">
          Neon first, salvage machinery second. Use crisp luminous cores, trim, rails, rings, arcs, glyphs, and trails over dark gunmetal, oxidized brass, copper, rivets, pipes, vents, and bolted plates. Palette target: 45% dark metal, 15% warm industrial metal, 30% neon energy, 10% warning/highlight.
        </div>
        <div class="enemy-lab-row">
          <button data-action="exportForgeSvg">Export SVG</button>
          <button data-action="exportForgeJson">Forge JSON</button>
          <button data-action="exportContactSheet">Contact Sheet</button>
          <button data-action="importForgeAsset">Import Forge</button>
          <button data-action="exportForgePromotion">Forge Promotion</button>
          <button data-action="promoteForgeAsset">Promote Approved</button>
        </div>
        <div class="enemy-lab-subtitle">AI Batch</div>
        <label>Batch size <input data-field="forgeBatchCount" type="number" min="1" max="40" step="1" value="8"></label>
        <div class="enemy-lab-row">
          <button data-action="exportForgeBatchBrief">Batch AI Brief</button>
          <button data-action="importForgeBatch">Import Batch</button>
        </div>
      </section>
      <section class="enemy-lab-panel">
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
          <button data-action="createProjectileForgeDraft">Pulse Projectile</button>
          <button data-action="createWeaponForgeDraft">Pulse Weapon</button>
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
      </section>
      <section class="enemy-lab-panel">
        <div class="enemy-lab-panel-title">Test Enemy</div>
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
      <section class="enemy-lab-panel">
        <div class="enemy-lab-panel-title">Variant Editor</div>
        <label>Name <input data-field="variantName" type="text" maxlength="48"></label>
        <label>Status <select data-field="variantStatus"></select></label>
        <div class="enemy-lab-row">
          <button data-action="newVariant">Duplicate</button>
          <button data-action="saveVariant">Save Draft</button>
          <button data-action="resetVariant">Reset</button>
          <button data-action="deleteVariant">Delete Draft</button>
          <button data-action="exportVariant">Export</button>
          <button data-action="importPreset">Import</button>
        </div>
        <div class="enemy-lab-grid">
          <label>Visual <input data-field="visualScale" type="number" min="0.25" max="9999" step="0.05"></label>
          <label>Width <input data-field="scaleX" type="number" min="0.25" max="9999" step="0.05"></label>
          <label>Length <input data-field="scaleY" type="number" min="0.25" max="9999" step="0.05"></label>
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
      </section>
      <section class="enemy-lab-panel">
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
          <button data-action="exportSquad">Export Squad</button>
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
      <section class="enemy-lab-panel">
        <div class="enemy-lab-panel-title">Lab Settings</div>
        <label>Lab speed <input data-field="speed" type="range" min="0.2" max="3" step="0.1" value="1"></label>
        <label>Lab HP <input data-field="hp" type="range" min="0.2" max="5" step="0.1" value="1"></label>
        <label>Fire rate <input data-field="fireRate" type="range" min="0.25" max="3" step="0.05" value="1"></label>
        <label>Nudge <input data-field="deconflict" type="range" min="0" max="3" step="0.05" value="1"></label>
        <div class="enemy-lab-row">
          <button data-action="deconflict">Deconflict</button>
          <button data-action="collisionDebug">Hit Circles</button>
          <button data-action="exportDiagnostics">Export Diagnostics</button>
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
    this.populateForgeColorSelect(forgeLayerColor);
    this.populateForgeColorSelect(forgeLayerStrokeColor);
    for (const status of FORGE_ASSET_STATUSES) {
      forgeAssetStatus.add(new Option(status, status));
    }

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
    variantSelect.addEventListener('change', () => {
      this.selectedVariantId = variantSelect.value;
      this.syncVariantControlsFromState();
      this.syncForgeControlsFromState();
    });
    for (const input of [variantName, variantStatus, variantNotes, visualScale, scaleX, scaleY, rotationOffset, glowScale, statHp, statSpeed, statRadius, statContactDamage]) {
      input.addEventListener('input', () => this.persistVariantFromControls(false));
      input.addEventListener('change', () => this.persistVariantFromControls(true));
    }
    squadSelect.addEventListener('change', () => {
      this.selectedSquadIndex = Math.max(0, getEnemyLabSquads().findIndex((squad) => squad.id === squadSelect.value));
      this.selectedCustomSquadId = '';
      this.selectedSquadEntryIndex = -1;
      this.syncSquadControlsFromState();
    });
    customSquadSelect.addEventListener('change', () => {
      this.selectedCustomSquadId = customSquadSelect.value;
      this.selectedSquadEntryIndex = -1;
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
      if (action === 'importPreset') this.importEnemyLabPreset();
      if (action === 'exportForgeSvg') this.exportSelectedForgeSvg();
      if (action === 'exportForgeJson') this.exportSelectedForgeJson();
      if (action === 'exportContactSheet') this.exportForgeContactSheet();
      if (action === 'importForgeAsset') this.importForgeAsset();
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
      if (action === 'exportDiagnostics') this.exportDiagnosticsReport();
      if (action === 'pause') this.isSimulationPaused = !this.isSimulationPaused;
      this.syncOverlayFromState();
    });

    root.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target.dataset.behaviorParam) {
        this.persistVariantFromControls(false);
      }
      if (target.dataset.entryField) {
        this.updateSquadEntryFromInput(target);
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
    const weapon = getWeaponDefinition('pulse-cannon');
    const draft = this.cloneForgeAsset(convertProjectileVisualDefinitionToForgeAsset(weapon));
    draft.id = `forge.projectile.${slugify(weapon.displayName)}.${Date.now()}`;
    draft.displayName = `${weapon.displayName} Projectile Draft`;
    draft.status = 'Visual Pass';
    draft.savedAt = new Date().toISOString();
    this.presetState.forgeAssets.push(draft);
    this.selectedForgeAssetId = draft.id;
    this.selectedForgeLayerIndex = 0;
    this.forgePreviewMode = 'projectile-motion';
    this.savePresetState();
    this.syncForgeControlsFromState();
  }

  private createWeaponForgeDraft(): void {
    const weapon = getWeaponDefinition('pulse-cannon');
    const draft = this.cloneForgeAsset(convertWeaponDefinitionToForgeAsset(weapon));
    draft.id = `forge.weapon.${slugify(weapon.displayName)}.${Date.now()}`;
    draft.displayName = `${weapon.displayName} Weapon Draft`;
    draft.status = 'Visual Pass';
    draft.savedAt = new Date().toISOString();
    this.presetState.forgeAssets.push(draft);
    this.selectedForgeAssetId = draft.id;
    this.selectedForgeLayerIndex = 0;
    this.forgePreviewMode = 'weapon-icon';
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
    const hasVariant = Boolean(variant);
    this.overlay.variantSelect.value = this.selectedVariantId;
    this.overlay.variantName.value = variant?.displayName ?? `${definition.displayName} Variant`;
    this.overlay.variantName.disabled = false;
    this.overlay.variantStatus.value = variant?.status ?? 'Idea';
    this.overlay.variantStatus.disabled = false;
    this.overlay.variantNotes.value = variant?.notes ?? '';
    this.overlay.variantNotes.disabled = false;
    this.overlay.visualScale.value = String(variant?.visualOverrides.visualScale ?? 1);
    this.overlay.scaleX.value = String(variant?.visualOverrides.scaleX ?? 1);
    this.overlay.scaleY.value = String(variant?.visualOverrides.scaleY ?? 1);
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

    variant.displayName = this.overlay.variantName.value.trim() || variant.displayName;
    variant.status = this.overlay.variantStatus.value as EnemyLabAssetStatus;
    variant.notes = this.overlay.variantNotes.value;
    variant.visualOverrides = {
      visualScale: this.readNumberInput(this.overlay.visualScale, 1, clampNumbers),
      scaleX: this.readNumberInput(this.overlay.scaleX, 1, clampNumbers),
      scaleY: this.readNumberInput(this.overlay.scaleY, 1, clampNumbers),
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

    downloadTextFile(
      `enemy-${slugify(variant.displayName)}-${this.time.now.toFixed(0)}.md`,
      createEnemyVariantMarkdown(variant),
      'text/markdown'
    );
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
      if (result.assets.length === 0) {
        console.warn(`Unable to import Forge asset batch. Expected styleGuideVersion ${FORGE_STYLE_GUIDE_VERSION}.`, result.errors);
        return;
      }

      const importedAssets = result.assets.map((asset, index) => this.createImportedForgeDraft(asset, index));
      this.presetState.forgeAssets = [...this.presetState.forgeAssets, ...importedAssets];
      this.selectedForgeAssetId = importedAssets[0]?.id ?? this.selectedForgeAssetId;
      this.savePresetState();
      this.syncOverlayFromState();
      if (result.rejectedCount > 0) {
        console.warn(`Imported ${importedAssets.length} Forge assets; rejected ${result.rejectedCount}.`, result.errors);
      }
    });
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
        return;
      }

      if (preset.type === 'starvivors-enemy-lab-variant') {
        const id = `${preset.id}-${Date.now()}`;
        this.upsertVariantPreset({ ...preset, id });
        this.selectedEnemyIndex = Math.max(0, getEnemyLabDefinitions().findIndex((definition) => definition.id === preset.baseDefinitionId));
        this.selectedVariantId = id;
      } else {
        const id = `${preset.id}-${Date.now()}`;
        this.upsertSquadPreset({ ...preset, id });
        this.selectedCustomSquadId = id;
      }
      this.savePresetState();
      this.populateVariantSelect();
      this.populateCustomSquadSelect();
      this.syncOverlayFromState();
    });
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

    downloadTextFile(
      `squad-${slugify(squad.displayName)}-${this.time.now.toFixed(0)}.md`,
      createEnemySquadMarkdown(squad),
      'text/markdown'
    );
  }

  private clearSelectedSquad(): void {
    const squad = this.getSelectedCustomSquad();
    if (!squad) {
      return;
    }

    squad.entries = [];
    this.selectedSquadEntryIndex = -1;
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
      this.overlay.squadEntries.appendChild(row);
    }
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

  private handleSquadEntryAction(action: string, index: number): void {
    const squad = this.getSelectedCustomSquad();
    if (!squad || !Number.isInteger(index) || !squad.entries[index]) {
      return;
    }

    if (action === 'select') {
      this.selectedSquadEntryIndex = index;
    }
    if (action === 'remove') {
      squad.entries.splice(index, 1);
      this.selectedSquadEntryIndex = Math.min(this.selectedSquadEntryIndex, squad.entries.length - 1);
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

  private syncActionButtonStates(): void {
    this.setActionState('ai', this.isAiEnabled, 'AI On', 'AI Off');
    this.setActionState('invuln', this.isPlayerInvulnerable, 'Invuln On', 'Invuln Off');
    this.setActionState('labels', this.showDebugLabels, 'Labels On', 'Labels Off');
    this.setActionState('telegraphs', this.showTelegraphs, 'Telegraphs On', 'Telegraphs Off');
    this.setActionState('deconflict', this.enemyDeconflictionEnabled, 'Deconflict On', 'Deconflict Off');
    this.setActionState('collisionDebug', this.enemyCollisionDebugEnabled, 'Hit Circles On', 'Hit Circles Off');
    this.setActionState('pause', this.isSimulationPaused, 'Paused', 'Pause');
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
    const radius = Number(asset.gameplayHints?.hitRadius ?? asset.boundsRadius);
    const radiusMarkup = mode === 'hit-radius'
      ? `<svg class="enemy-lab-forge-radius" viewBox="${-asset.canvasSize / 2} ${-asset.canvasSize / 2} ${asset.canvasSize} ${asset.canvasSize}"><circle cx="0" cy="0" r="${radius}" /></svg>`
      : '';
    const motionMarkup = mode === 'projectile-motion'
      ? [
          '<div class="enemy-lab-forge-motion-lane">',
          `<div class="enemy-lab-forge-motion-ghost is-far">${svg}</div>`,
          `<div class="enemy-lab-forge-motion-ghost is-mid">${svg}</div>`,
          `<div class="enemy-lab-forge-motion-asset" style="transform: scale(${scale});">${svg}${radiusMarkup}</div>`,
          '</div>'
        ].join('')
      : `<div class="enemy-lab-forge-preview-asset" style="transform: scale(${scale});">${svg}${radiusMarkup}</div>`;
    this.overlay.forgePreview.className = `enemy-lab-forge-preview is-${mode}`;
    this.overlay.forgePreview.innerHTML = [
      '<div class="enemy-lab-forge-preview-stage">',
      motionMarkup,
      '</div>',
      `<div class="enemy-lab-forge-preview-caption">${asset.displayName} | ${asset.layers.length} layers | ${asset.status} | ${createForgeVisualAssetId(asset)}</div>`
    ].join('');
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
    this.syncVariantControlsFromState();
    this.syncSquadControlsFromState();
    this.syncForgeControlsFromState();
    this.syncActionButtonStates();
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
      `forge ${this.presetState.forgeAssets.length} | style ${FORGE_STYLE_GUIDE_VERSION}` +
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
    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(18, 58);
      const particle = this.add.circle(x, y, Phaser.Math.FloatBetween(2, 5), color, 0.74);
      particle.setDepth(12);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.12,
        duration: Phaser.Math.Between(180, 330),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private emitExplosion(x: number, y: number, radius: number, color: number): void {
    const ring = this.add.circle(x, y, radius * 0.2, color, 0.12);
    ring.setStrokeStyle(3, color, 0.8);
    ring.setDepth(12);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      radius,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
    this.emitLabBurst(x, y, color, 18);
  }

  private flashEnemy(enemy: EnemyLabInstance): void {
    const image = enemy.body.getData('visualImage') as Phaser.GameObjects.Image | undefined;
    image?.setTint(0xffffff);
    this.time.delayedCall(70, () => image?.clearTint());
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
