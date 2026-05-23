import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import { MINIMAP_HEIGHT, MINIMAP_MARGIN, MINIMAP_PADDING, MINIMAP_WIDTH } from '../scenes/gameConstants';
import type { BasicAsteroid, BasicEnemy, ScrapPickup, ShooterEnemy, TankEnemy } from '../scenes/gameTypes';
import type { BlackHoleSystem } from './blackHole';
import type { EnemyLabInstance } from './enemyLabSpawner';
import type { RadarLevel } from './progressionStorage';
import type { RareEventMinimapMarker } from './rareEventRuntime';
import type { SectorScannerSnapshot, SectorScannerTarget } from './sectorScanner';
import { getSectorRegionColor, type SectorRegion, type SectorRegionType } from './sectorGeneration';

export interface MinimapCapabilities {
  radarLevel: RadarLevel;
  radarOnline: boolean;
  showFrame: boolean;
  showPlayer: boolean;
  showCameraBounds: boolean;
  showMissionObjective: boolean;
  showSectorSignals: boolean;
  showResourcePips: boolean;
  showResourceRegions: boolean;
  showThreatPips: boolean;
  showDangerRegions: boolean;
  showWorldEvents: boolean;
  showRareEvents: boolean;
  showBlackHoleAnomalies: boolean;
  showScannerTarget: boolean;
}

export function getMinimapCapabilities(
  radarLevel: RadarLevel,
  sectorScannerSnapshot: SectorScannerSnapshot
): MinimapCapabilities {
  const radarOnline = radarLevel >= 1;
  const showThreatFeed = radarLevel >= 4;

  return {
    radarLevel,
    radarOnline,
    showFrame: radarOnline,
    showPlayer: radarOnline,
    showCameraBounds: radarOnline,
    showMissionObjective: radarOnline,
    showSectorSignals: radarLevel >= 2,
    showResourcePips: radarLevel >= 3,
    showResourceRegions: radarLevel >= 3,
    showThreatPips: showThreatFeed,
    showDangerRegions: showThreatFeed,
    showWorldEvents: showThreatFeed,
    showRareEvents: showThreatFeed,
    showBlackHoleAnomalies: showThreatFeed,
    showScannerTarget: showThreatFeed && sectorScannerSnapshot.showMinimap
  };
}

export interface SectorSignalRadarMarker {
  id: string;
  label: string;
  type: SectorRegionType;
  x: number;
  y: number;
  signalStrength: number;
  danger: number;
  resource: number;
  active: boolean;
  distance: number;
}

export interface MinimapSnapshot {
  arena: ArenaSize;
  capabilities: MinimapCapabilities;
  player?: Phaser.GameObjects.Container;
  camera?: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
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
  rareEvents?: RareEventMinimapMarker[];
  scannerTarget?: SectorScannerTarget;
  isUpgradeOverlayOpen: boolean;
  basicAsteroids: BasicAsteroid[];
  basicEnemies: BasicEnemy[];
  shooterEnemies: ShooterEnemy[];
  tankEnemies: TankEnemy[];
  liveEnemies?: EnemyLabInstance[];
  scrapPickups: ScrapPickup[];
  blackHole?: BlackHoleSystem;
  sectorRegions?: SectorRegion[];
  sectorSignals?: SectorSignalRadarMarker[];
}

export class MinimapSystem {
  private readonly scene: Phaser.Scene;
  private graphics?: Phaser.GameObjects.Graphics;
  private headerText?: Phaser.GameObjects.Text;
  private signalText?: Phaser.GameObjects.Text;
  private visible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.graphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.headerText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '10px',
        color: '#f2fbff'
      })
      .setScrollFactor(0)
      .setDepth(1001);
    this.signalText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '10px',
        color: '#a8c7ff',
        align: 'right'
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1001);
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
    if (!this.graphics) {
      return;
    }

    this.graphics.clear();
    if (!snapshot.player) {
      this.headerText?.setVisible(false);
      this.signalText?.setVisible(false);
      return;
    }

    const shouldShow = snapshot.capabilities.showFrame && this.visible && !snapshot.isUpgradeOverlayOpen;
    this.graphics.setVisible(shouldShow);
    this.headerText?.setVisible(shouldShow);
    this.signalText?.setVisible(shouldShow);

    if (!shouldShow) {
      return;
    }

    const mapX = MINIMAP_MARGIN;
    const mapY = this.scene.scale.height - MINIMAP_MARGIN - MINIMAP_HEIGHT;
    const innerX = mapX + MINIMAP_PADDING;
    const innerY = mapY + MINIMAP_PADDING;
    const innerWidth = MINIMAP_WIDTH - MINIMAP_PADDING * 2;
    const innerHeight = MINIMAP_HEIGHT - MINIMAP_PADDING * 2;

    this.graphics.fillStyle(0x02040a, 0.78);
    this.graphics.fillRoundedRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);
    this.graphics.lineStyle(1, 0x52627f, 0.9);
    this.graphics.strokeRoundedRect(mapX, mapY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);
    this.graphics.lineStyle(1, 0x42f5d7, 0.46);
    this.graphics.strokeRect(innerX, innerY, innerWidth, innerHeight);
    this.drawRadarGrid(innerX, innerY, innerWidth, innerHeight);
    this.drawSectorRegions(snapshot, innerX, innerY, innerWidth, innerHeight);
    if (snapshot.capabilities.showSectorSignals) {
      this.drawSectorSignals(snapshot, innerX, innerY, innerWidth, innerHeight);
    }

    if (snapshot.camera && snapshot.capabilities.showCameraBounds) {
      this.drawCameraViewport(snapshot.camera, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
    }

    if (snapshot.missionObjective && snapshot.capabilities.showMissionObjective) {
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

    if (snapshot.capabilities.showWorldEvents) for (const event of snapshot.worldEvents ?? []) {
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

    if (snapshot.capabilities.showRareEvents) for (const event of snapshot.rareEvents ?? []) {
      const position = this.getPosition(event.x, event.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const dangerRadius = Phaser.Math.Clamp((event.dangerRadius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 8, 20);
      const objectiveRadius = Phaser.Math.Clamp((event.objectiveRadius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 4.8, 8.8);
      const signalRadius = Phaser.Math.Clamp((event.signalRadius / Math.min(snapshot.arena.width, snapshot.arena.height)) * innerWidth, 11, 24);
      const color = event.kind === 'black-hole' ? 0xb88cff : 0xff5964;
      const accent = event.kind === 'black-hole' ? 0x73f2ff : 0xffc857;
      const alpha = event.status === 'completed' ? 0.32 : 0.88;

      this.graphics.lineStyle(1, color, event.status === 'completed' ? 0.18 : 0.28);
      this.graphics.strokeCircle(position.x, position.y, signalRadius);
      this.graphics.fillStyle(color, event.status === 'completed' ? 0.05 : 0.1);
      this.graphics.fillCircle(position.x, position.y, dangerRadius);
      this.graphics.lineStyle(1, accent, alpha);
      this.graphics.strokeCircle(position.x, position.y, objectiveRadius);

      if (event.kind === 'black-hole') {
        this.graphics.fillStyle(0x05030a, 0.94);
        this.graphics.fillCircle(position.x, position.y, 4.8);
        this.graphics.lineStyle(1, accent, alpha);
        this.graphics.strokeCircle(position.x, position.y, 6);
      } else {
        this.graphics.fillStyle(accent, alpha);
        this.graphics.fillTriangle(
          position.x,
          position.y - 5.2,
          position.x - 5,
          position.y + 4.2,
          position.x + 5,
          position.y + 4.2
        );
      }
    }

    if (snapshot.scannerTarget && snapshot.capabilities.showScannerTarget) {
      const position = this.getPosition(snapshot.scannerTarget.x, snapshot.scannerTarget.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      this.graphics.lineStyle(2, 0xb88cff, 0.94);
      this.graphics.strokeCircle(position.x, position.y, 9);
      this.graphics.lineStyle(1, 0xf2fbff, 0.88);
      this.graphics.strokeCircle(position.x, position.y, 12);
      this.graphics.fillStyle(0xb88cff, 0.95);
      this.graphics.fillTriangle(position.x, position.y - 7, position.x - 6, position.y + 5, position.x + 6, position.y + 5);
    }

    if (snapshot.capabilities.showResourcePips) for (const asteroid of snapshot.basicAsteroids) {
      const position = this.getPosition(asteroid.body.x, asteroid.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const markerRadius = 1.3 + asteroid.tier * 0.55;

      this.graphics.fillStyle(0x9fd8ff, 0.68);
      this.graphics.fillCircle(position.x, position.y, markerRadius);
    }

    if (snapshot.capabilities.showThreatPips) for (const enemy of snapshot.basicEnemies) {
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

    if (snapshot.capabilities.showThreatPips) for (const enemy of snapshot.shooterEnemies) {
      const position = this.getPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);

      this.graphics.fillStyle(0xff5964, 0.92);
      this.graphics.fillRect(position.x - 2.8, position.y - 2.8, 5.6, 5.6);
    }

    if (snapshot.capabilities.showThreatPips) for (const enemy of snapshot.tankEnemies) {
      const position = this.getPosition(enemy.body.x, enemy.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);

      this.graphics.fillStyle(0xb48cff, 0.94);
      this.graphics.fillCircle(position.x, position.y, 4.2);
      this.graphics.lineStyle(1, 0xf2fbff, 0.78);
      this.graphics.strokeCircle(position.x, position.y, 5.4);
    }

    if (snapshot.capabilities.showThreatPips) for (const enemy of snapshot.liveEnemies ?? []) {
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

    if (snapshot.capabilities.showResourcePips) for (const scrap of snapshot.scrapPickups) {
      const position = this.getPosition(scrap.body.x, scrap.body.y, innerX, innerY, innerWidth, innerHeight, snapshot.arena);
      const color = scrap.value >= 76 ? 0xff6f3c : scrap.value >= 26 ? 0xffc857 : scrap.value >= 5 ? 0x52ff9a : 0x73f2ff;
      const radius = scrap.value >= 26 ? 2.4 : scrap.value >= 5 ? 2.1 : 1.8;

      this.graphics.fillStyle(color, 0.86);
      this.graphics.fillCircle(position.x, position.y, radius);
    }

    if (snapshot.blackHole && snapshot.capabilities.showBlackHoleAnomalies) {
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

    if (snapshot.capabilities.showPlayer) {
      this.graphics.fillStyle(0x42f5d7, 1);
      this.graphics.fillCircle(playerPosition.x, playerPosition.y, 4.2);
      this.graphics.lineStyle(1, 0xf2fbff, 0.95);
      this.graphics.strokeCircle(playerPosition.x, playerPosition.y, 5.6);
    }
    this.updateRadarLabels(snapshot, mapX, mapY);
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

  private drawRadarGrid(mapX: number, mapY: number, mapWidth: number, mapHeight: number): void {
    if (!this.graphics) {
      return;
    }

    this.graphics.lineStyle(1, 0x52627f, 0.16);
    for (let index = 1; index < 4; index += 1) {
      const x = mapX + (mapWidth * index) / 4;
      const y = mapY + (mapHeight * index) / 4;
      this.graphics.lineBetween(x, mapY, x, mapY + mapHeight);
      this.graphics.lineBetween(mapX, y, mapX + mapWidth, y);
    }

    this.graphics.lineStyle(1, 0x42f5d7, 0.18);
    this.graphics.lineBetween(mapX + mapWidth / 2, mapY, mapX + mapWidth / 2, mapY + mapHeight);
    this.graphics.lineBetween(mapX, mapY + mapHeight / 2, mapX + mapWidth, mapY + mapHeight / 2);
  }

  private drawSectorRegions(
    snapshot: MinimapSnapshot,
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ): void {
    if (!this.graphics) {
      return;
    }

    for (const region of snapshot.sectorRegions ?? []) {
      const isResourceRegion = region.type === 'salvage-field' || region.type === 'asteroid-belt';
      const isDangerRegion = region.type === 'enemy-territory' || region.type === 'anomaly-signal';
      if (
        (isResourceRegion && !snapshot.capabilities.showResourceRegions) ||
        (isDangerRegion && !snapshot.capabilities.showDangerRegions) ||
        (!isResourceRegion && !isDangerRegion)
      ) {
        continue;
      }

      const position = this.getPosition(region.x, region.y, mapX, mapY, mapWidth, mapHeight, snapshot.arena);
      const radius = Phaser.Math.Clamp((region.radius / Math.min(snapshot.arena.width, snapshot.arena.height)) * mapWidth, 5, 14);
      const color = getSectorRegionColor(region.type);
      const alpha = region.type === 'safe-drift' ? 0.06 : 0.11 + region.signalStrength * 0.04;

      this.graphics.fillStyle(color, alpha);
      this.graphics.fillCircle(position.x, position.y, radius);
      this.graphics.lineStyle(1, color, region.type === 'enemy-territory' ? 0.48 : 0.32);
      this.graphics.strokeCircle(position.x, position.y, radius);
    }
  }

  private drawSectorSignals(
    snapshot: MinimapSnapshot,
    mapX: number,
    mapY: number,
    mapWidth: number,
    mapHeight: number
  ): void {
    if (!this.graphics) {
      return;
    }

    for (const signal of snapshot.sectorSignals ?? []) {
      const position = this.getPosition(signal.x, signal.y, mapX, mapY, mapWidth, mapHeight, snapshot.arena);
      const color = getSectorRegionColor(signal.type);
      const radius = Phaser.Math.Clamp(3.4 + signal.signalStrength * 3.2, 4, 7.2);
      const alpha = signal.active ? 0.98 : 0.58;

      this.graphics.lineStyle(1, color, alpha * 0.7);
      this.graphics.strokeCircle(position.x, position.y, radius + 4);
      this.graphics.fillStyle(color, alpha);
      this.graphics.fillTriangle(
        position.x,
        position.y - radius,
        position.x - radius * 0.86,
        position.y + radius * 0.72,
        position.x + radius * 0.86,
        position.y + radius * 0.72
      );

      if (signal.danger >= 0.7) {
        this.graphics.lineStyle(1, 0xff5964, alpha * 0.78);
        this.graphics.strokeCircle(position.x, position.y, radius + 7);
      } else if (signal.resource >= 0.7) {
        this.graphics.lineStyle(1, 0xffc857, alpha * 0.72);
        this.graphics.lineBetween(position.x - radius - 4, position.y, position.x + radius + 4, position.y);
      }
    }
  }

  private updateRadarLabels(snapshot: MinimapSnapshot, mapX: number, mapY: number): void {
    const signals = snapshot.capabilities.showSectorSignals ? snapshot.sectorSignals ?? [] : [];
    const nearest = [...signals].sort((first, second) => first.distance - second.distance)[0];
    const highSignalCount = signals.filter((signal) => signal.signalStrength >= 0.7).length;

    this.headerText
      ?.setPosition(mapX + 8, mapY + 6)
      .setText(
        snapshot.capabilities.showSectorSignals
          ? `RADAR L${snapshot.capabilities.radarLevel}  SIG ${signals.length}${highSignalCount > 0 ? `/${highSignalCount}` : ''}`
          : `RADAR L${snapshot.capabilities.radarLevel}  SCOPE`
      );

    this.signalText
      ?.setPosition(mapX + MINIMAP_WIDTH - 8, mapY + 6)
      .setText(
        snapshot.capabilities.showSectorSignals
          ? nearest ? `${getSignalShortLabel(nearest.type)} ${formatRadarDistance(nearest.distance)}` : 'NO SIGNAL'
          : 'BASIC FEED'
      );
  }
}

function getSignalShortLabel(type: SectorRegionType): string {
  switch (type) {
    case 'safe-drift':
      return 'SAFE';
    case 'salvage-field':
      return 'SCRAP';
    case 'asteroid-belt':
      return 'ROCK';
    case 'enemy-territory':
      return 'HOSTILE';
    case 'anomaly-signal':
      return 'ANOM';
  }
}

function formatRadarDistance(distance: number): string {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}k`;
  }

  return `${Math.round(distance)}`;
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
