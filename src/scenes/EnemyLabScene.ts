import Phaser from 'phaser';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { DEFAULT_SHIP_ID, getShipDefinition } from '../data/ships';
import { VELOCITY_LIMITER_BASE_SPEED } from '../data/permanentUpgrades';
import { ENEMY_LAB_DEFINITIONS } from '../data/enemyLabDefinitions';
import {
  CAMERA_LEAD_LERP,
  CAMERA_LEAD_MAX_DISTANCE,
  CAMERA_LEAD_MIN_SPEED,
  FORWARD_THRUSTER_INTERVAL_MS,
  PLAYER_MASS,
  PLAYER_SHIP_DISPLAY_SIZE,
  PLAYER_SHIP_TEXTURE_KEY,
  PLAYER_SHIP_VISUAL_ROTATION,
  SECONDARY_THRUSTER_INTERVAL_MS,
  THRUSTER_FADE_MS
} from './gameConstants';
import { StarfieldSystem } from '../systems/starfield';
import {
  applyPlayerFlightAcceleration,
  calculatePlayerOverspeedDamping,
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
  type EnemyLabProjectileRequest,
  type EnemyLabScrapTarget
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

interface EnemyLabScrapPickup extends EnemyLabScrapTarget {
  body: Phaser.GameObjects.Arc;
  wrapMirrorBody: Phaser.GameObjects.Arc;
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
    scrap: number;
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
  statMass: HTMLInputElement;
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
  private scrapPickups: EnemyLabScrapPickup[] = [];
  private overlay?: EnemyLabOverlayRefs;
  private presetState: EnemyLabStorageState = createInitialEnemyLabStorageState();
  private selectedEnemyIndex = 0;
  private selectedVariantId = '';
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
  private isSimulationPaused = false;
  private playerHull = PLAYER_LAB_HULL;
  private nextPlayerFireAt = 0;
  private nextForwardThrusterAt = 0;
  private nextReverseThrusterAt = 0;
  private nextLeftStrafeThrusterAt = 0;
  private nextRightStrafeThrusterAt = 0;
  private nextProjectileId = 1;
  private nextScrapId = 1;
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
          scrapPickups: this.scrapPickups,
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
      this.measureDiagnosticsPhase(diagnostics, 'scrap-cleanup', () => this.removeCollectedScrap());
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
      deltaSeconds,
      referenceMass: PLAYER_MASS
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

  private getPlayerMass(): number {
    return LAB_PLAYER_SHIP.baseStats.mass;
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
    return calculatePlayerOverspeedDamping({
      baselineMass: PLAYER_MASS,
      currentMass: this.getPlayerMass(),
      baseOverspeedDamping: LAB_PLAYER_SHIP.movement.overspeedDamping
    });
  }

  private getPlayerFlightStats(): PlayerFlightStats {
    return {
      mass: this.getPlayerMass(),
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
    updatePlayerFacingFromPointer({
      scene: this,
      player: this.player,
      getWrappedDirection: (fromX, fromY, toX, toY) => this.getWrappedDirection(fromX, fromY, toX, toY)
    });
  }

  private updatePlayerFiring(time: number): void {
    if (!this.input.activePointer.isDown || time < this.nextPlayerFireAt) {
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
    const body = this.createProjectileBody(input.x, input.y, input.radius, input.color, rotation);
    const wrapMirrorBody = this.createProjectileBody(input.x, input.y, input.radius, input.color, rotation);
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
    rotation: number
  ): Phaser.GameObjects.Container {
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
    this.spawnScrap(enemy.body.x, enemy.body.y, Math.max(1, enemy.definition.rewards?.scrap ?? 1));

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
    this.clearScrap();
  }

  private getSpawnPositionAroundPlayer(distance: number): Phaser.Math.Vector2 {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    return new Phaser.Math.Vector2(
      wrapCoordinate(this.player.x + Math.cos(angle) * distance, this.arena.width),
      wrapCoordinate(this.player.y + Math.sin(angle) * distance, this.arena.height)
    );
  }

  private spawnScrap(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const spread = Phaser.Math.FloatBetween(0, 34);
      const pickupX = wrapCoordinate(x + Math.cos(angle) * spread, this.arena.width);
      const pickupY = wrapCoordinate(y + Math.sin(angle) * spread, this.arena.height);
      const body = this.add.circle(pickupX, pickupY, 7, 0xffc857, 0.8).setDepth(6);
      body.setStrokeStyle(1, 0xf2fbff, 0.7);
      const wrapMirrorBody = this.add.circle(pickupX, pickupY, 7, 0xffc857, 0.8).setDepth(6);
      wrapMirrorBody.setStrokeStyle(1, 0xf2fbff, 0.7);
      wrapMirrorBody.setVisible(false);
      this.scrapPickups.push({
        id: `lab-scrap-${this.nextScrapId++}`,
        x: pickupX,
        y: pickupY,
        body,
        wrapMirrorBody,
        collected: false
      });
    }
  }

  private spawnTestScrap(): void {
    for (let i = 0; i < 8; i += 1) {
      const position = this.getSpawnPositionAroundPlayer(240 + i * 22);
      this.spawnScrap(position.x, position.y, 1);
    }
  }

  private clearScrap(): void {
    for (const scrap of this.scrapPickups) {
      scrap.body.destroy();
      scrap.wrapMirrorBody.destroy();
    }
    this.scrapPickups = [];
  }

  private removeCollectedScrap(): void {
    for (let i = this.scrapPickups.length - 1; i >= 0; i -= 1) {
      const scrap = this.scrapPickups[i];
      scrap.x = scrap.body.x;
      scrap.y = scrap.body.y;
      this.updateScrapMirror(scrap);
      if (scrap.collected) {
        scrap.body.destroy();
        scrap.wrapMirrorBody.destroy();
        this.scrapPickups.splice(i, 1);
      }
    }
  }

  private updateScrapMirror(scrap: EnemyLabScrapPickup): void {
    const camera = this.cameras.main;
    const cameraCenterX = camera.scrollX + camera.width / 2;
    const cameraCenterY = camera.scrollY + camera.height / 2;
    const mirrorX = this.getNearestWrappedRenderCoordinate(scrap.body.x, cameraCenterX, this.arena.width);
    const mirrorY = this.getNearestWrappedRenderCoordinate(scrap.body.y, cameraCenterY, this.arena.height);
    const visible = (mirrorX !== scrap.body.x || mirrorY !== scrap.body.y) && this.isCircleInCameraView(mirrorX, mirrorY, 20);
    scrap.wrapMirrorBody.setPosition(mirrorX, mirrorY);
    scrap.wrapMirrorBody.setVisible(visible);
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
        <div class="enemy-lab-title">Enemy Lab</div>
        <button data-action="toggleOverlay">Hide UI</button>
      </div>
      <section class="enemy-lab-panel">
        <label>Enemy <select data-field="enemy"></select></label>
        <label>Variant <select data-field="variant"></select></label>
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
          <label>Visual <input data-field="visualScale" type="number" min="0.25" max="3" step="0.05"></label>
          <label>Width <input data-field="scaleX" type="number" min="0.25" max="3" step="0.05"></label>
          <label>Length <input data-field="scaleY" type="number" min="0.25" max="3" step="0.05"></label>
          <label>Rotate <input data-field="rotationOffset" type="number" min="-180" max="180" step="5"></label>
          <label>Glow <input data-field="glowScale" type="number" min="0" max="3" step="0.05"></label>
          <label>Hit R <input data-field="statRadius" type="number" min="4" max="220" step="1"></label>
          <label>HP <input data-field="statHp" type="number" min="1" max="5000" step="1"></label>
          <label>Speed <input data-field="statSpeed" type="number" min="1" max="1200" step="1"></label>
          <label>Mass <input data-field="statMass" type="number" min="0.1" max="80" step="0.1"></label>
          <label>Contact <input data-field="statContactDamage" type="number" min="0" max="1000" step="1"></label>
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
        <label>Built-in <select data-field="squad"></select></label>
        <label>Custom <select data-field="customSquad"></select></label>
        <label>Squad name <input data-field="squadName" type="text" maxlength="48"></label>
        <label>Squad status <select data-field="squadStatus"></select></label>
        <div class="enemy-lab-row">
          <button data-action="newSquad">New Squad</button>
          <button data-action="copyBuiltInSquad">Copy Built-in</button>
          <button data-action="addSquadEntry">Add Enemy</button>
          <button data-action="spawnSquad">Test Squad</button>
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
        <label>Spawn count <input data-field="spawnCount" type="number" min="1" max="40" step="1" value="1"></label>
        <label>Lab speed <input data-field="speed" type="range" min="0.2" max="3" step="0.1" value="1"></label>
        <label>Lab HP <input data-field="hp" type="range" min="0.2" max="5" step="0.1" value="1"></label>
        <label>Fire rate <input data-field="fireRate" type="range" min="0.25" max="3" step="0.05" value="1"></label>
        <label>Nudge <input data-field="deconflict" type="range" min="0" max="3" step="0.05" value="1"></label>
        <div class="enemy-lab-row">
          <button data-action="spawn">Spawn</button>
          <button data-action="squad">Squad</button>
          <button data-action="clear">Clear</button>
          <button data-action="spawnScrap">Spawn Scrap</button>
          <button data-action="clearScrap">Clear Drops</button>
          <button data-action="ai">AI</button>
          <button data-action="invuln">Invuln</button>
          <button data-action="labels">Labels</button>
          <button data-action="telegraphs">Telegraphs</button>
          <button data-action="deconflict">Deconflict</button>
          <button data-action="collisionDebug">Hit Circles</button>
          <button data-action="pause">Pause</button>
          <button data-action="exportDiagnostics">Export Diagnostics</button>
        </div>
      </section>
      <div class="enemy-lab-help">1-0 select first 10, [/] cycle, Space spawn, Shift+Space squad, C clear, F squad, I AI, L labels, T telegraphs, P pause, U hide UI. Hold mouse to fire.</div>
      <div class="enemy-lab-fps" data-field="fps">FPS -- | avg --ms | worst --ms</div>
      <div class="enemy-lab-status" data-field="status"></div>
    `;
    document.body.appendChild(root);

    const toggleOverlayButton = root.querySelector<HTMLButtonElement>('[data-action="toggleOverlay"]');
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
    const statMass = root.querySelector<HTMLInputElement>('[data-field="statMass"]');
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
      !statMass ||
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

    this.overlay = {
      root,
      toggleOverlayButton,
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
      statMass,
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
      this.populateVariantSelect();
      this.syncVariantControlsFromState();
    });
    variantSelect.addEventListener('change', () => {
      this.selectedVariantId = variantSelect.value;
      this.syncVariantControlsFromState();
    });
    for (const input of [variantName, variantStatus, variantNotes, visualScale, scaleX, scaleY, rotationOffset, glowScale, statHp, statSpeed, statRadius, statMass, statContactDamage]) {
      input.addEventListener('input', () => this.persistVariantFromControls());
      input.addEventListener('change', () => this.persistVariantFromControls());
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
      this.spawnCount = Phaser.Math.Clamp(Number(spawnCount.value) || 1, 1, 40);
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
      if (action === 'spawnScrap') this.spawnTestScrap();
      if (action === 'clearScrap') this.clearScrap();
      if (action === 'newVariant') this.createVariantForSelectedEnemy();
      if (action === 'saveVariant') this.persistVariantFromControls();
      if (action === 'resetVariant') this.resetSelectedVariant();
      if (action === 'deleteVariant') this.deleteSelectedVariant();
      if (action === 'exportVariant') this.exportSelectedVariant();
      if (action === 'importPreset') this.importEnemyLabPreset();
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
        this.persistVariantFromControls();
      }
      if (target.dataset.entryField) {
        this.updateSquadEntryFromInput(target);
      }
    });

    this.populateVariantSelect();
    this.populateCustomSquadSelect();
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

  private syncVariantControlsFromState(): void {
    if (!this.overlay) {
      return;
    }

    const definition = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    const variant = this.getSelectedVariant();
    const hasVariant = Boolean(variant);
    this.overlay.variantSelect.value = this.selectedVariantId;
    this.overlay.variantName.value = variant?.displayName ?? `${definition.displayName} Variant`;
    this.overlay.variantName.disabled = !variant;
    this.overlay.variantStatus.value = variant?.status ?? 'Idea';
    this.overlay.variantStatus.disabled = !variant;
    this.overlay.variantNotes.value = variant?.notes ?? '';
    this.overlay.variantNotes.disabled = !variant;
    this.overlay.visualScale.value = String(variant?.visualOverrides.visualScale ?? 1);
    this.overlay.scaleX.value = String(variant?.visualOverrides.scaleX ?? 1);
    this.overlay.scaleY.value = String(variant?.visualOverrides.scaleY ?? 1);
    this.overlay.rotationOffset.value = String(variant?.visualOverrides.rotationOffsetDegrees ?? 0);
    this.overlay.glowScale.value = String(variant?.visualOverrides.glowScale ?? 1);
    this.overlay.statHp.value = String(variant?.statOverrides.hp ?? definition.stats.hp);
    this.overlay.statSpeed.value = String(variant?.statOverrides.speed ?? definition.stats.speed);
    this.overlay.statRadius.value = String(variant?.statOverrides.radius ?? definition.stats.radius);
    this.overlay.statMass.value = String(variant?.statOverrides.mass ?? definition.stats.mass ?? 1);
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
      this.overlay.statMass,
      this.overlay.statContactDamage
    ]) {
      input.disabled = !variant;
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
    this.overlay.squadName.disabled = !squad;
    this.overlay.squadStatus.value = squad?.status ?? 'Idea';
    this.overlay.squadStatus.disabled = !squad;
    this.overlay.squadNotes.value = squad?.notes ?? '';
    this.overlay.squadNotes.disabled = !squad;
    this.renderSquadEntries();
    this.setActionsEnabled(
      ['exportSquad', 'deleteSquad', 'rotateSquadLeft', 'rotateSquadRight', 'scaleSquadDown', 'scaleSquadUp', 'mirrorSquad', 'clearSquad'],
      hasSquad
    );
    this.setActionsEnabled(['exportAiBrief'], hasSquad || Boolean(this.getSelectedVariant()));
  }

  private persistVariantFromControls(): void {
    const variant = this.getSelectedVariant();
    if (!variant || !this.overlay) {
      return;
    }

    variant.displayName = this.overlay.variantName.value.trim() || variant.displayName;
    variant.status = this.overlay.variantStatus.value as EnemyLabAssetStatus;
    variant.notes = this.overlay.variantNotes.value;
    variant.visualOverrides = {
      visualScale: this.readNumberInput(this.overlay.visualScale, 1),
      scaleX: this.readNumberInput(this.overlay.scaleX, 1),
      scaleY: this.readNumberInput(this.overlay.scaleY, 1),
      rotationOffsetDegrees: this.readNumberInput(this.overlay.rotationOffset, 0),
      glowScale: this.readNumberInput(this.overlay.glowScale, 1)
    };
    variant.statOverrides = {
      hp: this.readNumberInput(this.overlay.statHp, variant.statOverrides.hp ?? 1),
      speed: this.readNumberInput(this.overlay.statSpeed, variant.statOverrides.speed ?? 1),
      radius: this.readNumberInput(this.overlay.statRadius, variant.statOverrides.radius ?? 1),
      mass: this.readNumberInput(this.overlay.statMass, variant.statOverrides.mass ?? 1),
      contactDamage: this.readNumberInput(this.overlay.statContactDamage, variant.statOverrides.contactDamage ?? 0)
    };
    const behaviorParamInputs = this.overlay.behaviorParams.querySelectorAll<HTMLInputElement>('[data-behavior-param]');
    for (const input of behaviorParamInputs) {
      const key = input.dataset.behaviorParam;
      if (!key) {
        continue;
      }
      variant.behaviorParamOverrides[key] = input.type === 'number' ? this.readNumberInput(input, 0) : input.value;
    }
    variant.savedAt = new Date().toISOString();
    this.savePresetState();
    this.populateVariantSelect();
  }

  private persistSquadFromControls(): void {
    const squad = this.getSelectedCustomSquad();
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
  }

  private readNumberInput(input: HTMLInputElement, fallback: number): number {
    const value = Number(input.value);
    const min = input.min === '' ? Number.NEGATIVE_INFINITY : Number(input.min);
    const max = input.max === '' ? Number.POSITIVE_INFINITY : Number(input.max);
    const clamped = Phaser.Math.Clamp(
      Number.isFinite(value) ? value : fallback,
      Number.isFinite(min) ? min : Number.NEGATIVE_INFINITY,
      Number.isFinite(max) ? max : Number.POSITIVE_INFINITY
    );

    input.value = String(clamped);
    return clamped;
  }

  private setActionsEnabled(actions: string[], enabled: boolean): void {
    if (!this.overlay) {
      return;
    }

    for (const action of actions) {
      const button = this.overlay.root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
      if (button) {
        button.disabled = !enabled;
      }
    }
  }

  private setActionState(action: string, active: boolean, activeLabel: string, inactiveLabel: string): void {
    if (!this.overlay) {
      return;
    }

    const button = this.overlay.root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
    if (!button) {
      return;
    }

    button.classList.toggle('is-active', active);
    button.textContent = active ? activeLabel : inactiveLabel;
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
        scrap: this.scrapPickups.length,
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
    this.syncVariantControlsFromState();
    this.syncSquadControlsFromState();
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
      `enemies ${this.enemies.length} | shots ${this.projectiles.length} | scrap ${this.scrapPickups.length} | ` +
      `AI ${this.isAiEnabled ? 'on' : 'off'} | invuln ${this.isPlayerInvulnerable ? 'on' : 'off'} | ` +
      `labels ${this.showDebugLabels ? 'on' : 'off'} | telegraphs ${this.showTelegraphs ? 'on' : 'off'} | ` +
      `deconflict ${this.enemyDeconflictionEnabled ? this.enemyDeconflictionStrength.toFixed(2) : 'off'} | circles ${this.enemyCollisionDebugEnabled ? 'on' : 'off'} | ` +
      `paused ${this.isSimulationPaused ? 'yes' : 'no'} | hull ${Math.ceil(this.playerHull)}/${PLAYER_LAB_HULL}` +
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
