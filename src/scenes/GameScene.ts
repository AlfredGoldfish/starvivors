import Phaser from 'phaser';
import enemyShipUrl from '../../assets/spaceship_enemy_1.png';
import playerShipUrl from '../../assets/spaceship_1.png';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { basicEnemy } from '../data/enemies';
import { interceptorMovement } from '../data/balance';
import { pulseCannon } from '../data/weapons';

const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];
const BASIC_ENEMY_TEXTURE_KEY = 'basic-enemy-spaceship-1';
const PLAYER_SHIP_TEXTURE_KEY = 'player-ship-spaceship-1';
const STARFIELD_TEXTURE_KEY = 'starvivors-starfield-tile';
const GRID_TEXTURE_KEY = 'starvivors-grid-tile';
const BACKGROUND_TILE_SIZE = 1024;
const DEBUG_UPDATE_INTERVAL_MS = 150;
const PULSE_CANNON_MUZZLE_OFFSET = 36;
const PULSE_TRAIL_OFFSET = 11;
const PULSE_TRAIL_FADE_MS = 220;
const PULSE_TRAIL_INTERVAL_MS = 28;
const PLAYER_SHIP_DISPLAY_SIZE = 118;
const PLAYER_SHIP_VISUAL_ROTATION = Math.PI;
const BASIC_ENEMY_COUNT = 6;
const BASIC_ENEMY_DISPLAY_SIZE = 86;
const BASIC_ENEMY_VISUAL_ROTATION = Math.PI;
const PROJECTILE_HIT_RADIUS = 8;

interface PulseCannonProjectile {
  body: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  expiresAt: number;
  distanceRemaining: number;
  nextTrailAt: number;
}

interface BasicEnemy {
  body: Phaser.GameObjects.Container;
}

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private player!: Phaser.GameObjects.Container;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private debugText!: Phaser.GameObjects.Text;
  private starfield!: Phaser.GameObjects.TileSprite;
  private grid!: Phaser.GameObjects.TileSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private pulseCannonProjectiles: PulseCannonProjectile[] = [];
  private basicEnemies: BasicEnemy[] = [];
  private nextPulseCannonFireAt = 0;
  private nextDebugUpdateAt = 0;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    this.load.image(BASIC_ENEMY_TEXTURE_KEY, enemyShipUrl);
    this.load.image(PLAYER_SHIP_TEXTURE_KEY, playerShipUrl);
  }

  create(): void {
    this.createInput();
    this.createBackgroundTextures();
    this.rebuildWorld();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(time: number, delta: number): void {
    this.updatePlayerMovement(delta / 1000);
    this.updateBasicEnemies(delta / 1000);
    this.updatePulseCannon(time);
    this.updatePulseCannonProjectiles(time, delta / 1000);
    this.wrapPlayer();
    this.updateBackgroundTiles();
    this.updateDebugText(time);
  }

  private createInput(): void {
    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for the STARVIVORS scaffold.');
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as Record<
      'W' | 'A' | 'S' | 'D',
      Phaser.Input.Keyboard.Key
    >;
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private rebuildWorld(): void {
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.children.removeAll(true);
    this.playerVelocity.set(0, 0);
    this.pulseCannonProjectiles = [];
    this.basicEnemies = [];
    this.nextPulseCannonFireAt = 0;
    this.nextDebugUpdateAt = 0;

    this.createStarfield();
    this.player = this.createPlayerShip(center.x, center.y);
    this.createBasicEnemies(center);
    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.centerOn(center.x, center.y);

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

    this.updateDebugText(0);
  }

  private createBackgroundTextures(): void {
    if (!this.textures.exists(STARFIELD_TEXTURE_KEY)) {
      const starTexture = this.textures.createCanvas(
        STARFIELD_TEXTURE_KEY,
        BACKGROUND_TILE_SIZE,
        BACKGROUND_TILE_SIZE
      );

      if (starTexture) {
        const context = starTexture.getContext();
        const random = new Phaser.Math.RandomDataGenerator(['starvivors-starfield-tile']);

        context.fillStyle = '#02040a';
        context.fillRect(0, 0, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

        for (let i = 0; i < 220; i += 1) {
          const x = random.between(0, BACKGROUND_TILE_SIZE);
          const y = random.between(0, BACKGROUND_TILE_SIZE);
          const radius = random.realInRange(0.5, 1.7);
          const alpha = random.realInRange(0.35, 0.95);
          const color = Phaser.Display.Color.IntegerToColor(Phaser.Utils.Array.GetRandom(STAR_COLORS));

          context.globalAlpha = alpha;
          context.fillStyle = color.rgba;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }

        context.globalAlpha = 1;
        starTexture.refresh();
      }
    }

    if (!this.textures.exists(GRID_TEXTURE_KEY)) {
      const gridTexture = this.textures.createCanvas(GRID_TEXTURE_KEY, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);

      if (gridTexture) {
        const context = gridTexture.getContext();
        this.drawTacticalGridTexture(context);
        gridTexture.refresh();
      }
    }
  }

  private createStarfield(): void {
    this.starfield = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, STARFIELD_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20);

    this.grid = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, GRID_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    this.updateBackgroundTiles();
  }

  private drawTacticalGridTexture(context: CanvasRenderingContext2D): void {
    const majorLine = 480;
    const minorLine = 240;

    context.clearRect(0, 0, BACKGROUND_TILE_SIZE, BACKGROUND_TILE_SIZE);
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(18, 50, 74, 0.28)';

    for (let x = 0; x <= BACKGROUND_TILE_SIZE; x += minorLine) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, BACKGROUND_TILE_SIZE);
      context.stroke();
    }

    for (let y = 0; y <= BACKGROUND_TILE_SIZE; y += minorLine) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(BACKGROUND_TILE_SIZE, y);
      context.stroke();
    }

    context.strokeStyle = 'rgba(29, 224, 255, 0.34)';
    for (let x = 0; x <= BACKGROUND_TILE_SIZE; x += majorLine) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, BACKGROUND_TILE_SIZE);
      context.stroke();
    }

    for (let y = 0; y <= BACKGROUND_TILE_SIZE; y += majorLine) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(BACKGROUND_TILE_SIZE, y);
      context.stroke();
    }
  }

  private createPlayerShip(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, PLAYER_SHIP_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(PLAYER_SHIP_DISPLAY_SIZE, PLAYER_SHIP_DISPLAY_SIZE);
    sprite.setRotation(PLAYER_SHIP_VISUAL_ROTATION);

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

      this.basicEnemies.push({
        body: this.createBasicEnemy(x, y)
      });
    }
  }

  private createBasicEnemy(x: number, y: number): Phaser.GameObjects.Container {
    const sprite = this.add.image(0, 0, BASIC_ENEMY_TEXTURE_KEY);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(BASIC_ENEMY_DISPLAY_SIZE, BASIC_ENEMY_DISPLAY_SIZE);
    sprite.setRotation(BASIC_ENEMY_VISUAL_ROTATION);

    const enemy = this.add.container(x, y, [sprite]);
    enemy.setDepth(9);

    return enemy;
  }

  private updatePlayerMovement(deltaSeconds: number): void {
    if (!this.player) {
      return;
    }

    const rotateLeft = this.wasdKeys.A.isDown || this.cursors.left.isDown;
    const rotateRight = this.wasdKeys.D.isDown || this.cursors.right.isDown;
    const thrustForward = this.wasdKeys.W.isDown || this.cursors.up.isDown;
    const braking = this.wasdKeys.S.isDown || this.cursors.down.isDown;

    if (rotateLeft) {
      this.player.rotation -= interceptorMovement.rotationSpeed * deltaSeconds;
    }

    if (rotateRight) {
      this.player.rotation += interceptorMovement.rotationSpeed * deltaSeconds;
    }

    if (thrustForward) {
      this.playerVelocity.x += Math.sin(this.player.rotation) * interceptorMovement.thrustAcceleration * deltaSeconds;
      this.playerVelocity.y -= Math.cos(this.player.rotation) * interceptorMovement.thrustAcceleration * deltaSeconds;
    }

    const damping = braking ? interceptorMovement.brakeDamping : interceptorMovement.lowFrictionDamping;
    this.playerVelocity.scale(Math.pow(damping, deltaSeconds * 60));
    this.playerVelocity.limit(interceptorMovement.maxSpeed);

    this.player.x += this.playerVelocity.x * deltaSeconds;
    this.player.y += this.playerVelocity.y * deltaSeconds;
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

  private updateBasicEnemies(deltaSeconds: number): void {
    for (const enemy of this.basicEnemies) {
      const direction = this.getWrappedDirection(enemy.body.x, enemy.body.y, this.player.x, this.player.y);

      if (direction.lengthSq() > 0) {
        direction.normalize();
        enemy.body.x = wrapCoordinate(enemy.body.x + direction.x * basicEnemy.moveSpeed * deltaSeconds, this.arena.width);
        enemy.body.y = wrapCoordinate(enemy.body.y + direction.y * basicEnemy.moveSpeed * deltaSeconds, this.arena.height);
        enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      }
    }
  }

  private updatePulseCannon(time: number): void {
    const isFiring = this.fireKey.isDown || this.input.activePointer.leftButtonDown();

    if (!isFiring || time < this.nextPulseCannonFireAt) {
      return;
    }

    this.firePulseCannon(time);
    this.nextPulseCannonFireAt = time + pulseCannon.cooldownSeconds * 1000;
  }

  private firePulseCannon(time: number): void {
    const direction = new Phaser.Math.Vector2(Math.sin(this.player.rotation), -Math.cos(this.player.rotation));
    const spawnX = this.player.x + direction.x * PULSE_CANNON_MUZZLE_OFFSET;
    const spawnY = this.player.y + direction.y * PULSE_CANNON_MUZZLE_OFFSET;
    const body = this.createPulseCannonProjectile(spawnX, spawnY, this.player.rotation);

    this.pulseCannonProjectiles.push({
      body,
      velocity: direction.scale(pulseCannon.projectileSpeed),
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

    projectile.setRotation(rotation);
    projectile.setDepth(8);

    return projectile;
  }

  private updatePulseCannonProjectiles(time: number, deltaSeconds: number): void {
    for (let i = this.pulseCannonProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.pulseCannonProjectiles[i];
      const travelDistance = pulseCannon.projectileSpeed * deltaSeconds;

      projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * deltaSeconds, this.arena.width);
      projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * deltaSeconds, this.arena.height);
      projectile.distanceRemaining -= travelDistance;

      if (this.tryHitBasicEnemy(projectile)) {
        projectile.body.destroy(true);
        this.pulseCannonProjectiles.splice(i, 1);
      } else if (time >= projectile.expiresAt || projectile.distanceRemaining <= 0) {
        projectile.body.destroy(true);
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

  private tryHitBasicEnemy(projectile: PulseCannonProjectile): boolean {
    const hitRadius = basicEnemy.hitRadius + PROJECTILE_HIT_RADIUS;
    const hitRadiusSq = hitRadius * hitRadius;

    for (let i = this.basicEnemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.basicEnemies[i];
      const offset = this.getWrappedDirection(projectile.body.x, projectile.body.y, enemy.body.x, enemy.body.y);

      if (offset.lengthSq() <= hitRadiusSq) {
        enemy.body.destroy(true);
        this.basicEnemies.splice(i, 1);
        return true;
      }
    }

    return false;
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

  private updateBackgroundTiles(): void {
    if (!this.starfield || !this.grid) {
      return;
    }

    // Tile sprites replace the old full-arena live Graphics object, avoiding thousands of vector draws each frame.
    this.starfield.tilePositionX = this.cameras.main.scrollX * 0.45;
    this.starfield.tilePositionY = this.cameras.main.scrollY * 0.45;
    this.grid.tilePositionX = this.cameras.main.scrollX;
    this.grid.tilePositionY = this.cameras.main.scrollY;
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

    this.debugText.setText(
      `FPS: ${fps}\n` +
        `Viewport: ${viewportWidth} x ${viewportHeight}\n` +
        `Arena: ${this.arena.width} x ${this.arena.height}\n` +
        `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)} (wrapped)\n` +
        `Velocity: ${Math.round(this.playerVelocity.x)}, ${Math.round(this.playerVelocity.y)}\n` +
        `Pulse: ${this.pulseCannonProjectiles.length} active\n` +
        `Enemies: ${this.basicEnemies.length} active`
    );
  }

  private handleResize(): void {
    this.rebuildWorld();
  }
}
