import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import { MINIMAP_HEIGHT, MINIMAP_MARGIN, MINIMAP_PADDING, MINIMAP_WIDTH } from '../scenes/gameConstants';
import type { BasicAsteroid, BasicEnemy, ScrapPickup, ShooterEnemy, TankEnemy } from '../scenes/gameTypes';
import type { BlackHoleSystem } from './blackHole';
import type { EnemyLabInstance } from './enemyLabSpawner';
import { getSectorRegionColor, type SectorRegion } from './sectorGeneration';

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
  missionObjective?: {
    x: number;
    y: number;
    radius: number;
    status: 'active' | 'completed' | 'failed';
  };
  worldEvents?: Array<{
    x: number;
    y: number;
    radius: number;
    dangerRadius: number;
    status: 'active' | 'destroyed';
  }>;
  isUpgradeOverlayOpen: boolean;
  basicAsteroids: BasicAsteroid[];
  basicEnemies: BasicEnemy[];
  shooterEnemies: ShooterEnemy[];
  tankEnemies: TankEnemy[];
  liveEnemies?: EnemyLabInstance[];
  scrapPickups: ScrapPickup[];
  blackHole?: BlackHoleSystem;
  sectorRegions?: SectorRegion[];
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

    if (snapshot.missionObjective) {
      const position = this.getPosition(snapshot.missionObjective.x, snapshot.missionObjective.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const markerRadius = Phaser.Math.Clamp((snapshot.missionObjective.radius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 3.5, 6.8);
      const color = snapshot.missionObjective.status === 'completed'
        ? 0x52ff9a
        : snapshot.missionObjective.status === 'failed'
          ? 0x52627f
          : 0xffc857;

      this.graphics.fillStyle(color, snapshot.missionObjective.status === 'failed' ? 0.14 : 0.24);
      this.graphics.fillCircle(position.x, position.y, markerRadius + 2);
      this.graphics.lineStyle(1, color, snapshot.missionObjective.status === 'failed' ? 0.42 : 0.92);
      this.graphics.strokeCircle(position.x, position.y, markerRadius);
      this.graphics.fillStyle(color, 0.96);
      this.graphics.fillTriangle(position.x, position.y - 5, position.x - 4.6, position.y + 4, position.x + 4.6, position.y + 4);
    }

    for (const event of snapshot.worldEvents ?? []) {
      const position = this.getPosition(event.x, event.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const dangerRadius = Phaser.Math.Clamp((event.dangerRadius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 7, 18);
      const markerRadius = Phaser.Math.Clamp((event.radius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 4.5, 8);
      const alpha = event.status === 'destroyed' ? 0.3 : 0.84;

      this.graphics.fillStyle(0xff5964, event.status === 'destroyed' ? 0.06 : 0.1);
      this.graphics.fillCircle(position.x, position.y, dangerRadius);
      this.graphics.lineStyle(1, 0xff5964, alpha);
      this.graphics.strokeCircle(position.x, position.y, markerRadius);
      this.graphics.fillStyle(0xffc857, alpha);
      this.graphics.fillRect(position.x - 3.4, position.y - 3.4, 6.8, 6.8);
    }

    for (const region of snapshot.sectorRegions ?? []) {
      const position = this.getPosition(region.x, region.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const radius = Phaser.Math.Clamp((region.radius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 5, 13);
      const color = getSectorRegionColor(region.type);

      this.graphics.fillStyle(color, region.type === 'safe-drift' ? 0.08 : 0.14);
      this.graphics.fillCircle(position.x, position.y, radius);
      this.graphics.lineStyle(1, color, region.type === 'enemy-territory' ? 0.82 : 0.58);
      this.graphics.strokeCircle(position.x, position.y, radius);

      if (region.signalStrength >= 0.7) {
        this.graphics.fillStyle(color, 0.96);
        this.graphics.fillTriangle(position.x, position.y - 5.2, position.x - 4.5, position.y + 3.8, position.x + 4.5, position.y + 3.8);
      }
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
      const color = scrap.value >= 76 ? 0xff6f3c : scrap.value >= 26 ? 0xffc857 : scrap.value >= 5 ? 0x52ff9a : 0x73f2ff;
      const radius = scrap.value >= 26 ? 2.4 : scrap.value >= 5 ? 2.1 : 1.8;

      this.graphics.fillStyle(color, 0.86);
      this.graphics.fillCircle(position.x, position.y, radius);
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
