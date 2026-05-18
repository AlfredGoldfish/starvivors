import Phaser from 'phaser';
import { type ArenaSize } from '../core/arena';
import { basicEnemy, shooterEnemy, tankEnemy } from '../data/enemies';
import {
  BASIC_ENEMY_DISPLAY_SIZE,
  DEBUG_ELLIPSE_SEGMENTS,
  DEBUG_GRID_MAJOR_SPACING,
  DEBUG_GRID_MINOR_SPACING,
  SCRAP_PICKUP_RADIUS,
  SHOOTER_ENEMY_DISPLAY_SIZE,
  TANK_ENEMY_DISPLAY_SIZE
} from '../scenes/gameConstants';
import type {
  BasicAsteroid,
  BasicEnemy,
  EnemyProjectile,
  EnemyWreckageDebris,
  PlayerProjectile,
  ScrapPickup,
  ShooterEnemy,
  TankEnemy
} from '../scenes/gameTypes';
import type { BlackHoleSystem } from './blackHole';
import type { RammingShieldCollider } from './rammingShield';

export interface CollisionDebugOverlaySnapshot {
  arena: ArenaSize;
  collisionDebugEnabled: boolean;
  showBlackHoleRadii: boolean;
  player?: Phaser.GameObjects.Container;
  playerHitRadius: number;
  shieldCollider?: RammingShieldCollider;
  basicEnemies: BasicEnemy[];
  shooterEnemies: ShooterEnemy[];
  tankEnemies: TankEnemy[];
  basicAsteroids: BasicAsteroid[];
  enemyWreckageDebris: EnemyWreckageDebris[];
  scrapPickups: ScrapPickup[];
  blackHole?: BlackHoleSystem;
  playerProjectiles: PlayerProjectile[];
  enemyProjectiles: EnemyProjectile[];
}

export interface CollisionDebugOverlayConfig {
  scene: Phaser.Scene;
  getNearestWrappedRenderCoordinate: (value: number, cameraCenter: number, arenaSize: number) => number;
  getNearestWrappedRenderPosition: (x: number, y: number) => Phaser.Math.Vector2;
  isCircleInCameraView: (x: number, y: number, radius: number) => boolean;
  getForwardDirection: (rotation: number) => Phaser.Math.Vector2;
}

export class CollisionDebugOverlaySystem {
  private readonly scene: Phaser.Scene;
  private readonly getNearestWrappedRenderCoordinate: (value: number, cameraCenter: number, arenaSize: number) => number;
  private readonly getNearestWrappedRenderPosition: (x: number, y: number) => Phaser.Math.Vector2;
  private readonly isCircleInCameraView: (x: number, y: number, radius: number) => boolean;
  private readonly getForwardDirection: (rotation: number) => Phaser.Math.Vector2;
  private graphics?: Phaser.GameObjects.Graphics;

  constructor(config: CollisionDebugOverlayConfig) {
    this.scene = config.scene;
    this.getNearestWrappedRenderCoordinate = config.getNearestWrappedRenderCoordinate;
    this.getNearestWrappedRenderPosition = config.getNearestWrappedRenderPosition;
    this.isCircleInCameraView = config.isCircleInCameraView;
    this.getForwardDirection = config.getForwardDirection;
  }

  create(): void {
    this.graphics = this.scene.add.graphics().setDepth(999);
  }

  update(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics) {
      return;
    }

    this.graphics.clear();
    const shouldShowBlackHoleRadii = snapshot.showBlackHoleRadii && Boolean(snapshot.blackHole);
    this.graphics.setVisible(snapshot.collisionDebugEnabled || shouldShowBlackHoleRadii);

    if (!snapshot.collisionDebugEnabled && !shouldShowBlackHoleRadii) {
      return;
    }

    if (snapshot.collisionDebugEnabled) {
      this.drawArenaGrid(snapshot);
      this.drawPlayerCollision(snapshot);
      this.drawEnemyCollision(snapshot);
      this.drawAsteroidCollision(snapshot);
      this.drawDebrisCollision(snapshot);
      this.drawScrapCollision(snapshot);
    }

    this.drawBlackHoleCollision(snapshot);

    if (snapshot.collisionDebugEnabled) {
      this.drawProjectileCollision(snapshot);
    }
  }

  private drawArenaGrid(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics) {
      return;
    }

    const camera = this.scene.cameras.main;
    const left = camera.scrollX;
    const right = camera.scrollX + camera.width;
    const top = camera.scrollY;
    const bottom = camera.scrollY + camera.height;
    const cameraCenterX = left + camera.width / 2;
    const cameraCenterY = top + camera.height / 2;

    this.drawGridLines(left, right, top, bottom);

    const seamX = this.getNearestWrappedRenderCoordinate(0, cameraCenterX, snapshot.arena.width);
    const seamY = this.getNearestWrappedRenderCoordinate(0, cameraCenterY, snapshot.arena.height);

    this.graphics.lineStyle(2, 0x42f5d7, 0.62);

    if (seamX >= left && seamX <= right) {
      this.graphics.lineBetween(seamX, top, seamX, bottom);
    }

    if (seamY >= top && seamY <= bottom) {
      this.graphics.lineBetween(left, seamY, right, seamY);
    }
  }

  private drawGridLines(left: number, right: number, top: number, bottom: number): void {
    if (!this.graphics) {
      return;
    }

    const firstMinorX = Math.floor(left / DEBUG_GRID_MINOR_SPACING) * DEBUG_GRID_MINOR_SPACING;
    const firstMinorY = Math.floor(top / DEBUG_GRID_MINOR_SPACING) * DEBUG_GRID_MINOR_SPACING;

    for (let x = firstMinorX; x <= right; x += DEBUG_GRID_MINOR_SPACING) {
      const isMajor = Math.abs(x % DEBUG_GRID_MAJOR_SPACING) < 0.001;
      this.graphics.lineStyle(1, isMajor ? 0x52627f : 0x24384f, isMajor ? 0.42 : 0.22);
      this.graphics.lineBetween(x, top, x, bottom);
    }

    for (let y = firstMinorY; y <= bottom; y += DEBUG_GRID_MINOR_SPACING) {
      const isMajor = Math.abs(y % DEBUG_GRID_MAJOR_SPACING) < 0.001;
      this.graphics.lineStyle(1, isMajor ? 0x52627f : 0x24384f, isMajor ? 0.42 : 0.22);
      this.graphics.lineBetween(left, y, right, y);
    }
  }

  private drawPlayerCollision(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics || !snapshot.player) {
      return;
    }

    const playerPosition = this.getNearestWrappedRenderPosition(snapshot.player.x, snapshot.player.y);

    this.graphics.lineStyle(2, 0x73f2ff, 0.82);
    this.graphics.strokeCircle(playerPosition.x, playerPosition.y, snapshot.playerHitRadius);

    if (snapshot.shieldCollider) {
      const shieldPosition = this.getNearestWrappedRenderPosition(snapshot.shieldCollider.centerX, snapshot.shieldCollider.centerY);
      this.strokeOrientedEllipse(
        shieldPosition,
        new Phaser.Math.Vector2(snapshot.shieldCollider.rightX, snapshot.shieldCollider.rightY),
        new Phaser.Math.Vector2(snapshot.shieldCollider.forwardX, snapshot.shieldCollider.forwardY),
        snapshot.shieldCollider.halfWidth,
        snapshot.shieldCollider.halfDepth,
        0x42f5d7,
        0.78
      );
    }
  }

  private drawEnemyCollision(snapshot: CollisionDebugOverlaySnapshot): void {
    const playerHitRadius = snapshot.playerHitRadius;

    for (const enemy of snapshot.basicEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, BASIC_ENEMY_DISPLAY_SIZE * 0.5 + playerHitRadius)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(enemyPosition, enemyRight, enemyForward, basicEnemy.stats.hitHalfWidth, basicEnemy.stats.hitHalfLength, 0xffc857, 0.8);
      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        basicEnemy.stats.hitHalfWidth + playerHitRadius,
        basicEnemy.stats.hitHalfLength + playerHitRadius,
        0xff5964,
        0.42
      );
    }

    for (const enemy of snapshot.shooterEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, SHOOTER_ENEMY_DISPLAY_SIZE * 0.5 + playerHitRadius)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(enemyPosition, enemyRight, enemyForward, shooterEnemy.stats.hitHalfWidth, shooterEnemy.stats.hitHalfLength, 0xff5964, 0.8);
    }

    for (const enemy of snapshot.tankEnemies) {
      const enemyPosition = this.getNearestWrappedRenderPosition(enemy.body.x, enemy.body.y);

      if (!this.isCircleInCameraView(enemyPosition.x, enemyPosition.y, TANK_ENEMY_DISPLAY_SIZE * 0.5 + playerHitRadius)) {
        continue;
      }

      const enemyForward = this.getForwardDirection(enemy.body.rotation);
      const enemyRight = new Phaser.Math.Vector2(-enemyForward.y, enemyForward.x);

      this.strokeOrientedEllipse(enemyPosition, enemyRight, enemyForward, tankEnemy.stats.hitHalfWidth, tankEnemy.stats.hitHalfLength, 0xb48cff, 0.84);
      this.strokeOrientedEllipse(
        enemyPosition,
        enemyRight,
        enemyForward,
        tankEnemy.stats.hitHalfWidth + playerHitRadius,
        tankEnemy.stats.hitHalfLength + playerHitRadius,
        0xff5964,
        0.38
      );
    }
  }

  private drawAsteroidCollision(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics) {
      return;
    }

    const playerHitRadius = snapshot.playerHitRadius;

    for (const asteroid of snapshot.basicAsteroids) {
      const asteroidPosition = this.getNearestWrappedRenderPosition(asteroid.body.x, asteroid.body.y);

      if (!this.isCircleInCameraView(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius + playerHitRadius)) {
        continue;
      }

      this.graphics.lineStyle(2, 0x9fd8ff, 0.78);
      this.graphics.strokeCircle(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius);
      this.graphics.lineStyle(1, 0xff5964, 0.38);
      this.graphics.strokeCircle(asteroidPosition.x, asteroidPosition.y, asteroid.hitRadius + playerHitRadius);
    }
  }

  private drawDebrisCollision(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics) {
      return;
    }

    const playerHitRadius = snapshot.playerHitRadius;

    for (const debris of snapshot.enemyWreckageDebris) {
      const debrisPosition = this.getNearestWrappedRenderPosition(debris.body.x, debris.body.y);

      if (!this.isCircleInCameraView(debrisPosition.x, debrisPosition.y, debris.hitRadius + playerHitRadius)) {
        continue;
      }

      this.graphics.lineStyle(1, 0xc7d4dc, 0.74);
      this.graphics.strokeCircle(debrisPosition.x, debrisPosition.y, debris.hitRadius);
      this.graphics.lineStyle(1, 0xff5964, 0.32);
      this.graphics.strokeCircle(debrisPosition.x, debrisPosition.y, debris.hitRadius + playerHitRadius);
    }
  }

  private drawScrapCollision(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics) {
      return;
    }

    for (const scrap of snapshot.scrapPickups) {
      const scrapPosition = this.getNearestWrappedRenderPosition(scrap.body.x, scrap.body.y);

      if (!this.isCircleInCameraView(scrapPosition.x, scrapPosition.y, scrap.pickupRadius)) {
        continue;
      }

      this.graphics.lineStyle(1, 0x73f2ff, 0.74);
      this.graphics.strokeCircle(scrapPosition.x, scrapPosition.y, SCRAP_PICKUP_RADIUS);
      this.graphics.lineStyle(1, 0xdaf8ff, 0.28);
      this.graphics.strokeCircle(scrapPosition.x, scrapPosition.y, scrap.pickupRadius);
    }
  }

  private drawBlackHoleCollision(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics || !snapshot.blackHole) {
      return;
    }

    const blackHolePosition = this.getNearestWrappedRenderPosition(snapshot.blackHole.body.x, snapshot.blackHole.body.y);

    if (!this.isCircleInCameraView(blackHolePosition.x, blackHolePosition.y, snapshot.blackHole.influenceRadius)) {
      return;
    }

    this.graphics.lineStyle(2, 0xff5964, 0.9);
    this.graphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, snapshot.blackHole.eventHorizonRadius);
    this.graphics.lineStyle(1, 0xffc857, 0.44);
    this.graphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, snapshot.blackHole.damageRadius);
    this.graphics.lineStyle(1, 0x42f5d7, 0.42);
    this.graphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, snapshot.blackHole.captureRadius);
    this.graphics.lineStyle(1, 0x9fd8ff, 0.22);
    this.graphics.strokeCircle(blackHolePosition.x, blackHolePosition.y, snapshot.blackHole.influenceRadius);
  }

  private drawProjectileCollision(snapshot: CollisionDebugOverlaySnapshot): void {
    if (!this.graphics) {
      return;
    }

    for (const projectile of snapshot.playerProjectiles) {
      const projectilePosition = this.getNearestWrappedRenderPosition(projectile.body.x, projectile.body.y);

      if (!this.isCircleInCameraView(projectilePosition.x, projectilePosition.y, projectile.hitRadius)) {
        continue;
      }

      this.graphics.lineStyle(1, 0x42f5d7, projectile.capturedByBlackHole ? 0.22 : 0.55);
      this.graphics.strokeCircle(projectilePosition.x, projectilePosition.y, projectile.hitRadius);
    }

    for (const projectile of snapshot.enemyProjectiles) {
      const projectilePosition = this.getNearestWrappedRenderPosition(projectile.body.x, projectile.body.y);

      if (!this.isCircleInCameraView(projectilePosition.x, projectilePosition.y, projectile.hitRadius)) {
        continue;
      }

      this.graphics.lineStyle(1, 0xff5964, projectile.capturedByBlackHole ? 0.22 : 0.62);
      this.graphics.strokeCircle(projectilePosition.x, projectilePosition.y, projectile.hitRadius);
    }

    for (const debris of snapshot.enemyWreckageDebris) {
      const debrisPosition = this.getNearestWrappedRenderPosition(debris.body.x, debris.body.y);

      if (!this.isCircleInCameraView(debrisPosition.x, debrisPosition.y, debris.hitRadius)) {
        continue;
      }

      this.graphics.lineStyle(1, 0xc7d4dc, 0.52);
      this.graphics.strokeCircle(debrisPosition.x, debrisPosition.y, debris.hitRadius);
    }
  }

  private strokeOrientedEllipse(
    center: Phaser.Math.Vector2,
    right: Phaser.Math.Vector2,
    forward: Phaser.Math.Vector2,
    halfWidth: number,
    halfLength: number,
    color: number,
    alpha: number
  ): void {
    if (!this.graphics) {
      return;
    }

    this.graphics.lineStyle(1, color, alpha);

    let previousX = center.x + right.x * halfWidth;
    let previousY = center.y + right.y * halfWidth;

    for (let i = 1; i <= DEBUG_ELLIPSE_SEGMENTS; i += 1) {
      const angle = (Math.PI * 2 * i) / DEBUG_ELLIPSE_SEGMENTS;
      const x = center.x + right.x * Math.cos(angle) * halfWidth + forward.x * Math.sin(angle) * halfLength;
      const y = center.y + right.y * Math.cos(angle) * halfWidth + forward.y * Math.sin(angle) * halfLength;

      this.graphics.lineBetween(previousX, previousY, x, y);
      previousX = x;
      previousY = y;
    }
  }
}
