import Phaser from 'phaser';
import { createArenaSize, getArenaCenter, type ArenaSize } from '../core/arena';
import { getViewportSize } from '../core/viewport';

const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];

export class GameScene extends Phaser.Scene {
  private arena!: ArenaSize;
  private player!: Phaser.GameObjects.Container;
  private debugText!: Phaser.GameObjects.Text;
  private starfield?: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.rebuildWorld();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  update(): void {
    this.updateDebugText();
  }

  private rebuildWorld(): void {
    const viewport = getViewportSize(this);
    this.arena = createArenaSize(viewport);
    const center = getArenaCenter(this.arena);

    this.children.removeAll(true);
    this.cameras.main.setBounds(0, 0, this.arena.width, this.arena.height);

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

    this.updateDebugText();
  }

  private createStarfield(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x02040a, 1);
    graphics.fillRect(0, 0, this.arena.width, this.arena.height);

    const random = new Phaser.Math.RandomDataGenerator(['starvivors-scaffold']);
    const starCount = Math.floor((this.arena.width * this.arena.height) / 22000);

    for (let i = 0; i < starCount; i += 1) {
      const x = random.between(0, this.arena.width);
      const y = random.between(0, this.arena.height);
      const radius = random.realInRange(0.6, 1.8);
      const alpha = random.realInRange(0.35, 0.95);
      const color = Phaser.Utils.Array.GetRandom(STAR_COLORS);

      graphics.fillStyle(color, alpha);
      graphics.fillCircle(x, y, radius);
    }

    this.drawTacticalGrid(graphics);
    this.starfield = graphics;
  }

  private drawTacticalGrid(graphics: Phaser.GameObjects.Graphics): void {
    const majorLine = 960;
    const minorLine = 240;

    graphics.lineStyle(1, 0x12324a, 0.12);
    for (let x = 0; x <= this.arena.width; x += minorLine) {
      graphics.lineBetween(x, 0, x, this.arena.height);
    }
    for (let y = 0; y <= this.arena.height; y += minorLine) {
      graphics.lineBetween(0, y, this.arena.width, y);
    }

    graphics.lineStyle(1, 0x1de0ff, 0.2);
    for (let x = 0; x <= this.arena.width; x += majorLine) {
      graphics.lineBetween(x, 0, x, this.arena.height);
    }
    for (let y = 0; y <= this.arena.height; y += majorLine) {
      graphics.lineBetween(0, y, this.arena.width, y);
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

  private updateDebugText(): void {
    if (!this.debugText || !this.player) {
      return;
    }

    const fps = Math.round(this.game.loop.actualFps);
    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;

    this.debugText.setText([
      `FPS: ${fps}`,
      `Viewport: ${viewportWidth} x ${viewportHeight}`,
      `Arena: ${this.arena.width} x ${this.arena.height}`,
      `Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`
    ]);
  }

  private handleResize(): void {
    this.starfield?.destroy();
    this.rebuildWorld();
  }
}
