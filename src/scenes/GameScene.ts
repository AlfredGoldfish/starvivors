import Phaser from 'phaser';
import { createArenaSize, getArenaCenter, wrapCoordinate, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';
import { interceptorMovement } from '../data/balance';

const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];
const STARFIELD_TEXTURE_KEY = 'starvivors-starfield-tile';
const GRID_TEXTURE_KEY = 'starvivors-grid-tile';
const BACKGROUND_TILE_SIZE = 1024;
const DEBUG_UPDATE_INTERVAL_MS = 150;

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private player!: Phaser.GameObjects.Container;
  private playerVelocity = new Phaser.Math.Vector2(0, 0);
  private debugText!: Phaser.GameObjects.Text;
  private starfield!: Phaser.GameObjects.TileSprite;
  private grid!: Phaser.GameObjects.TileSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private nextDebugUpdateAt = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.createInput();
    this.createBackgroundTextures();
    this.rebuildWorld();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(time: number, delta: number): void {
    this.updatePlayerMovement(delta / 1000);
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
  }

  private rebuildWorld(): void {
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.children.removeAll(true);
    this.cameras.main.setBounds(0, 0, this.arena.width, this.arena.height);
    this.playerVelocity.set(0, 0);
    this.nextDebugUpdateAt = 0;

    this.createStarfield();
    this.player = this.createPlayerShip(center.x, center.y);
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
    const body = this.add.triangle(0, 0, 0, -28, 22, 24, 0, 14, 0x73f2ff, 1);
    body.setStrokeStyle(2, 0xf2fbff, 1);

    const leftWing = this.add.triangle(-14, 10, 0, -10, -24, 24, 2, 16, 0x2b8cff, 0.9);
    leftWing.setStrokeStyle(1, 0x9fd8ff, 0.9);

    const rightWing = this.add.triangle(14, 10, 0, -10, 24, 24, -2, 16, 0x2b8cff, 0.9);
    rightWing.setStrokeStyle(1, 0x9fd8ff, 0.9);

    const cockpit = this.add.circle(0, 2, 5, 0xffffff, 0.9);
    const ship = this.add.container(x, y, [leftWing, rightWing, body, cockpit]);
    ship.setDepth(10);

    return ship;
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
    this.player.setPosition(
      wrapCoordinate(this.player.x, this.arena.width),
      wrapCoordinate(this.player.y, this.arena.height)
    );
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
        `Velocity: ${Math.round(this.playerVelocity.x)}, ${Math.round(this.playerVelocity.y)}`
    );
  }

  private handleResize(): void {
    this.rebuildWorld();
  }
}
