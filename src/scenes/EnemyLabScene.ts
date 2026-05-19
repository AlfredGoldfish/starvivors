import Phaser from 'phaser';
import playerShipUrl from '../../assets/ships/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { interceptorMovement } from '../data/balance';
import { ENEMY_LAB_DEFINITIONS } from '../data/enemyLabDefinitions';
import { PLAYER_SHIP_TEXTURE_KEY } from './gameConstants';
import { StarfieldSystem } from '../systems/starfield';
import { applyAccelerationWithMass } from '../systems/physics';
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
  spawnEnemyLabSquad,
  type EnemyLabInstance
} from '../systems/enemyLabSpawner';

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

interface EnemyLabOverlayRefs {
  root: HTMLDivElement;
  enemySelect: HTMLSelectElement;
  squadSelect: HTMLSelectElement;
  spawnCount: HTMLInputElement;
  speedMultiplier: HTMLInputElement;
  hpMultiplier: HTMLInputElement;
  fireRateMultiplier: HTMLInputElement;
  deconflictionStrength: HTMLInputElement;
  status: HTMLDivElement;
}

const PLAYER_LAB_HULL = 100;
const PLAYER_LAB_HIT_RADIUS = 32;
const PLAYER_LAB_MASS = 3;
const PLAYER_PROJECTILE_COOLDOWN_MS = 150;
const PLAYER_PROJECTILE_SPEED = 900;
const PLAYER_PROJECTILE_RANGE = 1100;
const PLAYER_PROJECTILE_DAMAGE = 18;

export class EnemyLabScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private starfield!: StarfieldSystem;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies: EnemyLabInstance[] = [];
  private projectiles: EnemyLabProjectile[] = [];
  private scrapPickups: EnemyLabScrapPickup[] = [];
  private overlay?: EnemyLabOverlayRefs;
  private selectedEnemyIndex = 0;
  private selectedSquadIndex = 0;
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
  private isSimulationPaused = false;
  private playerHull = PLAYER_LAB_HULL;
  private nextPlayerFireAt = 0;
  private nextProjectileId = 1;
  private nextScrapId = 1;
  private collisionDebugCircles = new Map<string, Phaser.GameObjects.Arc>();

  constructor() {
    super('EnemyLabScene');
  }

  preload(): void {
    this.load.image(PLAYER_SHIP_TEXTURE_KEY, playerShipUrl);
  }

  create(): void {
    const viewport = { width: this.scale.width, height: this.scale.height };
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
    this.starfield.resetPlayerTracking(this.player);
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.centerOn(center.x, center.y);

    this.createInput();
    this.createOverlay();
    this.spawnInitialScrap();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearEnemyCollisionDebug();
      this.overlay?.root.remove();
      this.overlay = undefined;
    });
  }

  update(time: number, delta: number): void {
    const deltaSeconds = Math.min(delta / 1000, 0.05);

    this.handleShortcuts();
    this.updateOverlayStatus();

    if (this.isSimulationPaused) {
      return;
    }

    this.updatePlayerMovement(time, deltaSeconds);
    this.wrapPlayer();
    this.starfield.update(time, this.player);
    this.updatePlayerFiring(time);
    this.updateProjectiles(time, deltaSeconds);

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
    });

    this.updateEnemyContacts(time);
    this.removeCollectedScrap();
    this.removeDeadEnemies();
    this.updateEnemyCollisionDebug();
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
    sprite.setOrigin(0.5);
    sprite.setDisplaySize(118, 118);
    sprite.setRotation(Math.PI);
    this.playerSprite = sprite;

    const ship = this.add.container(x, y, [sprite]);
    ship.setDepth(10);
    return ship;
  }

  private updatePlayerMovement(time: number, deltaSeconds: number): void {
    this.updatePlayerFacing();

    const thrustForward = this.keys.up.isDown || this.keys.upAlt.isDown;
    const thrustReverse = this.keys.down.isDown || this.keys.downAlt.isDown;
    const strafeLeft = this.keys.left.isDown || this.keys.leftAlt.isDown;
    const strafeRight = this.keys.right.isDown || this.keys.rightAlt.isDown;
    const forward = this.getForwardDirection(this.player.rotation);
    const right = new Phaser.Math.Vector2(-forward.y, forward.x);
    const acceleration = new Phaser.Math.Vector2(0, 0);

    // Lab-only copy of GameScene-style Interceptor thrust so enemy behavior can be tested without refactoring the live scene.
    if (thrustForward) {
      acceleration.x += forward.x * interceptorMovement.thrustAcceleration;
      acceleration.y += forward.y * interceptorMovement.thrustAcceleration;
    }
    if (thrustReverse) {
      acceleration.x -= forward.x * interceptorMovement.reverseThrustAcceleration;
      acceleration.y -= forward.y * interceptorMovement.reverseThrustAcceleration;
    }
    if (strafeLeft) {
      acceleration.x -= right.x * interceptorMovement.strafeThrustAcceleration;
      acceleration.y -= right.y * interceptorMovement.strafeThrustAcceleration;
    }
    if (strafeRight) {
      acceleration.x += right.x * interceptorMovement.strafeThrustAcceleration;
      acceleration.y += right.y * interceptorMovement.strafeThrustAcceleration;
    }

    if (acceleration.lengthSq() > 0) {
      applyAccelerationWithMass({
        velocity: this.playerVelocity,
        acceleration,
        mass: PLAYER_LAB_MASS,
        referenceMass: PLAYER_LAB_MASS,
        deltaSeconds,
        maxSpeed: interceptorMovement.maxSpeed
      });
      this.emitPlayerThruster(time, forward);
    } else {
      this.playerVelocity.scale(Math.pow(interceptorMovement.lowFrictionDamping, deltaSeconds * 60));
    }

    this.player.x += this.playerVelocity.x * deltaSeconds;
    this.player.y += this.playerVelocity.y * deltaSeconds;
  }

  private updatePlayerFacing(): void {
    const pointer = this.input.activePointer;
    const pointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const direction = this.getWrappedDirection(this.player.x, this.player.y, pointerWorld.x, pointerWorld.y);

    if (direction.lengthSq() > 0) {
      this.player.rotation = Math.atan2(direction.x, -direction.y);
    }
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

  private spawnEnemy(definitionId: string, x: number, y: number): void {
    this.enemies.push(
      spawnEnemyLabEnemy({
        scene: this,
        arena: this.arena,
        definitionId,
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
      this.spawnEnemy(definition.id, position.x, position.y);
    }
  }

  private spawnSelectedSquad(): void {
    const squad = getEnemyLabSquads()[this.selectedSquadIndex];
    const position = this.getSpawnPositionAroundPlayer(620);
    this.enemies.push(
      ...spawnEnemyLabSquad({
        scene: this,
        arena: this.arena,
        squadId: squad.id,
        centerX: position.x,
        centerY: position.y,
        time: this.time.now,
        hpMultiplier: this.enemyHpMultiplier,
        showDebugLabel: this.showDebugLabels
      })
    );
  }

  private clearEnemies(): void {
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

  private spawnInitialScrap(): void {
    for (let i = 0; i < 10; i += 1) {
      const position = this.getSpawnPositionAroundPlayer(240 + i * 30);
      this.spawnScrap(position.x, position.y, 1);
    }
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
  }

  private createOverlay(): void {
    const root = document.createElement('div');
    root.className = 'enemy-lab-overlay';
    root.innerHTML = `
      <div class="enemy-lab-title">Enemy Lab</div>
      <label>Enemy <select data-field="enemy"></select></label>
      <label>Squad <select data-field="squad"></select></label>
      <div class="enemy-lab-row">
        <button data-action="spawn">Spawn</button>
        <button data-action="squad">Squad</button>
        <button data-action="clear">Clear</button>
      </div>
      <label>Spawn count <input data-field="spawnCount" type="number" min="1" max="40" step="1" value="1"></label>
      <label>Speed <input data-field="speed" type="range" min="0.2" max="3" step="0.1" value="1"></label>
      <label>HP <input data-field="hp" type="range" min="0.2" max="5" step="0.1" value="1"></label>
      <label>Fire rate <input data-field="fireRate" type="range" min="0.25" max="3" step="0.05" value="1"></label>
      <label>Nudge <input data-field="deconflict" type="range" min="0" max="3" step="0.05" value="1"></label>
      <div class="enemy-lab-row">
        <button data-action="ai">AI</button>
        <button data-action="invuln">Invuln</button>
        <button data-action="labels">Labels</button>
        <button data-action="telegraphs">Telegraphs</button>
        <button data-action="deconflict">Deconflict</button>
        <button data-action="collisionDebug">Hit Circles</button>
        <button data-action="pause">Pause</button>
      </div>
      <div class="enemy-lab-help">1-0 select first 10, [/] cycle, Space spawn, Shift+Space squad, C clear, F squad, I AI, L labels, T telegraphs, P pause. Hold mouse to fire.</div>
      <div class="enemy-lab-status" data-field="status"></div>
    `;
    document.body.appendChild(root);

    const enemySelect = root.querySelector<HTMLSelectElement>('[data-field="enemy"]');
    const squadSelect = root.querySelector<HTMLSelectElement>('[data-field="squad"]');
    const spawnCount = root.querySelector<HTMLInputElement>('[data-field="spawnCount"]');
    const speedMultiplier = root.querySelector<HTMLInputElement>('[data-field="speed"]');
    const hpMultiplier = root.querySelector<HTMLInputElement>('[data-field="hp"]');
    const fireRateMultiplier = root.querySelector<HTMLInputElement>('[data-field="fireRate"]');
    const deconflictionStrength = root.querySelector<HTMLInputElement>('[data-field="deconflict"]');
    const status = root.querySelector<HTMLDivElement>('[data-field="status"]');

    if (
      !enemySelect ||
      !squadSelect ||
      !spawnCount ||
      !speedMultiplier ||
      !hpMultiplier ||
      !fireRateMultiplier ||
      !deconflictionStrength ||
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

    this.overlay = {
      root,
      enemySelect,
      squadSelect,
      spawnCount,
      speedMultiplier,
      hpMultiplier,
      fireRateMultiplier,
      deconflictionStrength,
      status
    };

    enemySelect.addEventListener('change', () => {
      this.selectedEnemyIndex = Math.max(0, getEnemyLabDefinitions().findIndex((definition) => definition.id === enemySelect.value));
    });
    squadSelect.addEventListener('change', () => {
      this.selectedSquadIndex = Math.max(0, getEnemyLabSquads().findIndex((squad) => squad.id === squadSelect.value));
    });
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
      const action = (event.target as HTMLElement).dataset.action;
      if (!action) {
        return;
      }

      if (action === 'spawn') this.spawnSelectedEnemy();
      if (action === 'squad') this.spawnSelectedSquad();
      if (action === 'clear') this.clearEnemies();
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
      if (action === 'pause') this.isSimulationPaused = !this.isSimulationPaused;
      this.syncOverlayFromState();
    });

    this.syncOverlayFromState();
  }

  private syncOverlayFromState(): void {
    if (!this.overlay) {
      return;
    }

    this.overlay.enemySelect.selectedIndex = this.selectedEnemyIndex;
    this.overlay.squadSelect.selectedIndex = this.selectedSquadIndex;
    this.overlay.spawnCount.value = String(this.spawnCount);
    this.overlay.speedMultiplier.value = String(this.enemySpeedMultiplier);
    this.overlay.hpMultiplier.value = String(this.enemyHpMultiplier);
    this.overlay.fireRateMultiplier.value = String(this.enemyFireRateMultiplier);
    this.overlay.deconflictionStrength.value = String(this.enemyDeconflictionStrength);
  }

  private updateOverlayStatus(): void {
    if (!this.overlay) {
      return;
    }

    const selected = getEnemyLabDefinitions()[this.selectedEnemyIndex];
    this.overlay.status.textContent =
      `${selected.displayName} | enemies ${this.enemies.length} | shots ${this.projectiles.length} | scrap ${this.scrapPickups.length} | ` +
      `AI ${this.isAiEnabled ? 'on' : 'off'} | invuln ${this.isPlayerInvulnerable ? 'on' : 'off'} | ` +
      `labels ${this.showDebugLabels ? 'on' : 'off'} | telegraphs ${this.showTelegraphs ? 'on' : 'off'} | ` +
      `deconflict ${this.enemyDeconflictionEnabled ? this.enemyDeconflictionStrength.toFixed(2) : 'off'} | circles ${this.enemyCollisionDebugEnabled ? 'on' : 'off'} | ` +
      `paused ${this.isSimulationPaused ? 'yes' : 'no'} | hull ${Math.ceil(this.playerHull)}/${PLAYER_LAB_HULL}`;
  }

  private emitPlayerThruster(time: number, forward: Phaser.Math.Vector2): void {
    if (time % 24 > 16) {
      return;
    }

    const exhaust = forward.clone().negate();
    const particle = this.add.circle(this.player.x + exhaust.x * 38, this.player.y + exhaust.y * 38, 4, 0x73f2ff, 0.8);
    particle.setDepth(7);
    particle.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: particle,
      x: particle.x + exhaust.x * 34,
      y: particle.y + exhaust.y * 34,
      alpha: 0,
      scale: 0.18,
      duration: 180,
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
    const wrappedX = wrapCoordinate(this.player.x, this.arena.width);
    const wrappedY = wrapCoordinate(this.player.y, this.arena.height);
    const didWrap = wrappedX !== this.player.x || wrappedY !== this.player.y;
    this.player.setPosition(wrappedX, wrappedY);
    if (didWrap) {
      this.cameras.main.centerOn(wrappedX, wrappedY);
      this.starfield.resetPlayerTracking(this.player);
    }
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
}
