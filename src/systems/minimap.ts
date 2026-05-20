import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import { MINIMAP_HEIGHT, MINIMAP_MARGIN, MINIMAP_PADDING, MINIMAP_WIDTH } from '../scenes/gameConstants';
import type { BasicAsteroid, BasicEnemy, ScrapPickup, ShooterEnemy, TankEnemy } from '../scenes/gameTypes';
import type { BlackHoleSystem } from './blackHole';
import type { EnemyLabInstance } from './enemyLabSpawner';

export interface MinimapSnapshot {
  arena: ArenaSize;
  player?: Phaser.GameObjects.Container;
  camera?: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
  };
  extraction?: {
    x: number;
    y: number;
    radius: number;
  };
  isUpgradeOverlayOpen: boolean;
  basicAsteroids: BasicAsteroid[];
  basicEnemies: BasicEnemy[];
  shooterEnemies: ShooterEnemy[];
  tankEnemies: TankEnemy[];
  liveEnemies?: EnemyLabInstance[];
  scrapPickups: ScrapPickup[];
  blackHole?: BlackHoleSystem;
}

export class MinimapSystem {
  private readonly scene: Phaser.Scene;
  private graphics?: Phaser.GameObjects.Graphics;
  private visible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.graphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
  }

  reset(): void {
    this.visible = true;
  }

  toggle(): boolean {
    this.visible = !this.visible;
    return this.visible;
  }

  isVisible(): boolean {
    return this.visible;
  }

  update(snapshot: MinimapSnapshot): void {
    if (!this.graphics || !snapshot.player) {
      return;
    }

    this.graphics.clear();
    this.graphics.setVisible(this.visible && !snapshot.isUpgradeOverlayOpen);

    if (!this.visible || snapshot.isUpgradeOverlayOpen) {
      return;
    }

    const mapX = MINIMAP_MARGIN;
    const mapY = this.scene.scale.height - MINIMAP_MARGIN - MINIMAP_HEIGHT;
    const innerX = mapX + MINIMAP_PADDING;
    const innerY = mapY + MINIMAP_PADDING;
    const innerWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
    const innerHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;

    this.graphics.fillStyle(0x02040a, 0.72);
    this.graphics.fillRoundedRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);
    this.graphics.lineStyle(1, 0x52627f, 0.86);
    this.graphics.strokeRoundedRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);
    this.graphics.lineStyle(1, 0x42f5d7, 0.42);
    this.graphics.strokeRect(innerX, innerY, innerWidth, innerHeight);

    if (snapshot.camera) {
      this.drawCameraViewport(snapshot.camera, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
    }

    if (snapshot.extraction) {
      const position = this.getPosition(snapshot.extraction.x, snapshot.extraction.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const markerRadius = Phaser.Math.Clamp((snapshot.extraction.radius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 3.5, 6.5);

      this.graphics.fillStyle(0x42f5d7, 0.24);
      this.graphics.fillCircle(position.x, position.y, markerRadius + 2);
      this.graphics.lineStyle(1, 0xffc857, 0.92);
      this.graphics.strokeCircle(position.x, position.y, markerRadius);
      this.graphics.fillStyle(0xf2fbff, 0.95);
      this.graphics.fillRect(position.x - 1.4, position.y - 1.4, 2.8, 2.8);
    }

    for (const asteroid of snapshot.basicAsteroids) {
      const position = this.getPosition(asteroid.body.x, asteroid.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const markerRadius = 1.3 + asteroid.tier * 0.55;

      this.graphics.fillStyle(0x9fd8ff, 0.68);
      this.graphics.fillCircle(position.x, position.y, markerRadius);
    }

    for (const enemy of snapshot.basicEnemies) {
      const position = this.getPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);

      this.graphics.fillStyle(0xffc857, 0.88);
      this.graphics.fillTriangle(
        position.x,
        position.y - 3.4,
        position.x - 3,
        position.y + 2.8,
        position.x + 3,
        position.y + 2.8
      );
    }

    for (const enemy of snapshot.shooterEnemies) {
      const position = this.getPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);

      this.graphics.fillStyle(0xff5964, 0.92);
      this.graphics.fillRect(position.x - 2.8, position.y - 2.8, 5.6, 5.6);
    }

    for (const enemy of snapshot.tankEnemies) {
      const position = this.getPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);

      this.graphics.fillStyle(0xb48cff, 0.94);
      this.graphics.fillCircle(position.x, position.y, 4.2);
      this.graphics.lineStyle(1, 0xf2fbff, 0.78);
      this.graphics.strokeCircle(position.x, position.y, 5.4);
    }

    for (const enemy of snapshot.liveEnemies ?? []) {
      const position = this.getPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const color = getLiveEnemyMinimapColor(enemy);

      this.graphics.fillStyle(color, 0.92);
      if (enemy.definition.role === 'tank' || enemy.definition.role === 'carrier') {
        this.graphics.fillCircle(position.x, position.y, 4.4);
        this.graphics.lineStyle(1, 0xf2fbff, 0.72);
        this.graphics.strokeCircle(position.x, position.y, 5.5);
      } else if (enemy.definition.role === 'ranged' || enemy.definition.role === 'sniper') {
        this.graphics.fillRect(position.x - 2.8, position.y - 2.8, 5.6, 5.6);
      } else {
        this.graphics.fillTriangle(
          position.x,
          position.y - 3.4,
          position.x - 3,
          position.y + 2.8,
          position.x + 3,
          position.y + 2.8
        );
      }
    }

    for (const scrap of snapshot.scrapPickups) {
      const position = this.getPosition(scrap.body.x, scrap.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);

      this.graphics.fillStyle(0x73f2ff, 0.86);
      this.graphics.fillCircle(position.x, position.y, 1.8);
    }

    if (snapshot.blackHole) {
      const position = this.getPosition(
        snapshot.blackHole.body.x,
        snapshot.blackHole.body.y,
        innerX,
        innerY,
        innerWidth,
        innerHeight,
        snapshot.arena
      );

      this.graphics.fillStyle(0x05030a, 0.96);
      this.graphics.fillCircle(position.x, position.y, 5.6);
      this.graphics.lineStyle(2, 0xf2fbff, 0.82);
      this.graphics.strokeCircle(position.x, position.y, 7.2);
    }

    const playerPosition = this.getPosition(snapshot.player.x, snapshot.player.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);

    this.graphics.fillStyle(0x42f5d7, 1);
    this.graphics.fillCircle(playerPosition.x, playerPosition.y, 4.2);
    this.graphics.lineStyle(1, 0xf2fbff, 0.95);
    this.graphics.strokeCircle(playerPosition.x, playerPosition.y, 5.6);
  }

  private getPosition(
    worldX: number,
    worldY: number,
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number,
    arena: ArenaSize
  ): { x: number; y: number } {
    const wrappedX = wrapCoordinate(worldX, arena.width);
    const wrappedY = wrapCoordinate(worldY, arena.height);

    return {
      x: mapX + (wrappedX / arena.width) * mapWidth,
      y: mapY + (wrappedY / arena.height) * mapHeight
    };
  }

  private drawCameraViewport(
    camera: { centerX: number; centerY: number; width: number; height: number },
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number,
    arena: ArenaSize
  ): void {
    const center = this.getPosition(camera.centerX, camera.centerY, mapX, mapY, mapWidth, mapHeight, arena);
    const viewportWidth = Phaser.Math.Clamp((camera.width / arena.width) * mapWidth, 8, mapWidth);
    const viewportHeight = Phaser.Math.Clamp((camera.height / arena.height) * mapHeight, 6, mapHeight);

    this.graphics?.lineStyle(1, 0xf2fbff, 0.34);
    this.graphics?.strokeRect(center.x - viewportWidth / 2, center.y - viewportHeight / 2, viewportWidth, viewportHeight);
  }
}

function getLiveEnemyMinimapColor(enemy: EnemyLabInstance): number {
  switch (enemy.definition.role) {
    case 'ranged':
    case 'sniper':
      return 0xff5964;
    case 'tank':
    case 'carrier':
      return 0xb48cff;
    case 'shield':
    case 'repair':
    case 'buffer':
      return 0x73f2ff;
    default:
      return enemy.definition.visual.accentColor;
  }
}
