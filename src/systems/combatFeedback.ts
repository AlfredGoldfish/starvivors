import Phaser from 'phaser';
import { ASTEROID_TIER_CONFIG, ENEMY_WRECKAGE_DEBRIS_HP } from '../scenes/gameConstants';
import type {
  BasicAsteroid,
  BasicEnemy,
  DamageFeedbackSource,
  EnemyWreckageDebris,
  FloatingDamageText,
  HealthBarFeedback,
  ShooterEnemy,
  TankEnemy
} from '../scenes/gameTypes';
import type { DebugState } from './debug/debugState';

type CombatEnemy = BasicEnemy | ShooterEnemy | TankEnemy;

export interface CombatFeedbackSnapshot {
  player?: Phaser.GameObjects.Container;
  isPlayerDead: boolean;
  playerHull: number;
  playerMaxHull: number;
  playerHitRadius: number;
  enemies: CombatEnemy[];
  asteroids: BasicAsteroid[];
  debris: EnemyWreckageDebris[];
}

export interface CombatFeedbackSystemConfig {
  scene: Phaser.Scene;
  debugState: DebugState;
  getNearestWrappedRenderPosition: (x: number, y: number) => Phaser.Math.Vector2;
  getEnemyHitRadius: (enemy: CombatEnemy) => number;
}

export class CombatFeedbackSystem {
  private readonly scene: Phaser.Scene;
  private readonly debugState: DebugState;
  private readonly getNearestWrappedRenderPosition: (x: number, y: number) => Phaser.Math.Vector2;
  private readonly getEnemyHitRadius: (enemy: CombatEnemy) => number;
  private readonly healthBarFeedback = new Map<object, HealthBarFeedback>();
  private floatingDamageTexts: FloatingDamageText[] = [];

  constructor(config: CombatFeedbackSystemConfig) {
    this.scene = config.scene;
    this.debugState = config.debugState;
    this.getNearestWrappedRenderPosition = config.getNearestWrappedRenderPosition;
    this.getEnemyHitRadius = config.getEnemyHitRadius;
  }

  clear(): void {
    for (const bar of this.healthBarFeedback.values()) {
      bar.graphics.destroy();
    }
    this.healthBarFeedback.clear();

    for (const item of this.floatingDamageTexts) {
      item.text.destroy();
    }
    this.floatingDamageTexts = [];
  }

  emitDamageFeedback(
    owner: object,
    body: Phaser.GameObjects.Container,
    hp: number,
    maxHp: number,
    radius: number,
    damage: number,
    source: DamageFeedbackSource,
    revealHealthBar: boolean
  ): void {
    this.emitFloatingDamageNumber(body.x, body.y, damage, source);
    this.ensureHealthBar(owner, body, maxHp, radius, revealHealthBar);
    this.updateHealthBar(owner, hp, maxHp);
  }

  emitFloatingDamageNumber(x: number, y: number, damage: number, source: DamageFeedbackSource): void {
    if (!this.debugState.damageNumbersEnabled || damage <= 0) {
      return;
    }

    const position = this.getNearestWrappedRenderPosition(x, y);
    const displayDamage = Math.max(1, Math.round(damage));
    const text = this.scene.add
      .text(position.x, position.y, `${displayDamage}`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: `${this.debugState.damageNumberFontSize}px`,
        color: this.getDamageNumberColor(source),
        stroke: '#02040a',
        strokeThickness: 4
      })
      .setOrigin(0.5, 0.5)
      .setDepth(22)
      .setAlpha(this.debugState.damageNumberAlpha)
      .setScale(this.debugState.damageNumberScalePop);

    this.floatingDamageTexts.push({
      text,
      originX: position.x,
      originY: position.y,
      ageMs: 0,
      lifetimeMs: this.debugState.damageNumberLifetimeMs,
      riseDistance: this.debugState.damageNumberRiseDistance,
      driftX: Phaser.Math.FloatBetween(-this.debugState.damageNumberDrift, this.debugState.damageNumberDrift),
      startScale: this.debugState.damageNumberScalePop
    });
  }

  update(deltaMs: number, snapshot: CombatFeedbackSnapshot): void {
    this.updatePlayerHealthBarFeedback(snapshot);
    if (!this.debugState.healthBarRevealOnPlayerDamage) {
      this.ensureAllCombatHealthBars(snapshot);
    }
    for (const [owner] of this.healthBarFeedback) {
      if (owner === snapshot.player) {
        continue;
      }
      this.updateHealthBarFromOwner(owner, snapshot);
    }
    this.updateFloatingDamageTexts(deltaMs);
  }

  private ensureHealthBar(
    owner: object,
    body: Phaser.GameObjects.Container,
    maxHp: number,
    radius: number,
    revealHealthBar: boolean
  ): void {
    const existing = this.healthBarFeedback.get(owner);
    if (existing) {
      existing.revealed ||= revealHealthBar;
      existing.maxHp = maxHp;
      existing.radius = radius;
      return;
    }

    if (this.debugState.healthBarRevealOnPlayerDamage && !revealHealthBar) {
      return;
    }

    const graphics = this.scene.add.graphics().setDepth(21);
    this.healthBarFeedback.set(owner, {
      body,
      graphics,
      maxHp,
      radius,
      revealed: true
    });
  }

  private updateHealthBar(owner: object, hp: number, maxHp: number): void {
    const bar = this.healthBarFeedback.get(owner);
    if (!bar) {
      return;
    }

    const progress = Phaser.Math.Clamp(hp / Math.max(1, maxHp), 0, 1);
    const position = this.getNearestWrappedRenderPosition(bar.body.x, bar.body.y);
    const width = Phaser.Math.Clamp(bar.radius * 1.45, 28, 76) * this.debugState.healthBarWidthScale;
    const height = this.debugState.healthBarHeight;
    const x = position.x - width / 2;
    const y = position.y - this.debugState.healthBarVerticalOffset;
    const fillColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(255, 71, 86),
      new Phaser.Display.Color(77, 255, 145),
      100,
      Math.round(progress * 100)
    );
    const fill = Phaser.Display.Color.GetColor(fillColor.r, fillColor.g, fillColor.b);

    bar.graphics.clear();
    bar.graphics.setVisible(this.debugState.healthBarsEnabled && bar.revealed);
    if (!this.debugState.healthBarsEnabled || !bar.revealed) {
      return;
    }

    bar.graphics.fillStyle(0x5d1018, this.debugState.healthBarAlpha * 0.86);
    bar.graphics.fillRoundedRect(x, y, width, height, Math.min(3, height / 2));
    bar.graphics.fillStyle(fill, this.debugState.healthBarAlpha);
    bar.graphics.fillRoundedRect(x, y, width * progress, height, Math.min(3, height / 2));
    bar.graphics.lineStyle(1, 0x02040a, this.debugState.healthBarAlpha);
    bar.graphics.strokeRoundedRect(x, y, width, height, Math.min(3, height / 2));
  }

  private removeHealthBar(owner: object): void {
    const bar = this.healthBarFeedback.get(owner);
    if (!bar) {
      return;
    }

    bar.graphics.destroy();
    this.healthBarFeedback.delete(owner);
  }

  private getDamageNumberColor(source: DamageFeedbackSource): string {
    if (!this.debugState.damageNumberSourceColorsEnabled) {
      return '#f2fbff';
    }

    switch (source) {
      case 'player':
        return '#f2fbff';
      case 'shield':
        return '#42f5d7';
      case 'enemy':
        return '#ff5964';
      case 'asteroid':
      case 'debris':
        return '#ffc857';
      case 'blackHole':
        return '#b88cff';
      default:
        return '#f2fbff';
    }
  }

  private ensureAllCombatHealthBars(snapshot: CombatFeedbackSnapshot): void {
    for (const enemy of snapshot.enemies) {
      this.ensureHealthBar(enemy, enemy.body, enemy.stats.maxHull, this.getEnemyHitRadius(enemy), true);
    }

    for (const asteroid of snapshot.asteroids) {
      this.ensureHealthBar(asteroid, asteroid.body, ASTEROID_TIER_CONFIG[asteroid.tier].hp, asteroid.hitRadius, true);
    }

    for (const debris of snapshot.debris) {
      this.ensureHealthBar(debris, debris.body, ENEMY_WRECKAGE_DEBRIS_HP, debris.hitRadius, true);
    }
  }

  private updatePlayerHealthBarFeedback(snapshot: CombatFeedbackSnapshot): void {
    if (!snapshot.player || snapshot.isPlayerDead || !this.debugState.playerHealthBarEnabled) {
      if (snapshot.player) {
        this.removeHealthBar(snapshot.player);
      }
      return;
    }

    this.ensureHealthBar(snapshot.player, snapshot.player, snapshot.playerMaxHull, snapshot.playerHitRadius, true);
    this.updateHealthBar(snapshot.player, snapshot.playerHull, snapshot.playerMaxHull);
  }

  private updateHealthBarFromOwner(owner: object, snapshot: CombatFeedbackSnapshot): void {
    const enemy = snapshot.enemies.find((candidate) => candidate === owner);
    if (enemy) {
      this.updateHealthBar(owner, enemy.hp, enemy.stats.maxHull);
      return;
    }

    const asteroid = snapshot.asteroids.find((candidate) => candidate === owner);
    if (asteroid) {
      this.updateHealthBar(owner, asteroid.hp, ASTEROID_TIER_CONFIG[asteroid.tier].hp);
      return;
    }

    const debris = snapshot.debris.find((candidate) => candidate === owner);
    if (debris) {
      this.updateHealthBar(owner, debris.hp, ENEMY_WRECKAGE_DEBRIS_HP);
      return;
    }

    this.removeHealthBar(owner);
  }

  private updateFloatingDamageTexts(deltaMs: number): void {
    for (let i = this.floatingDamageTexts.length - 1; i >= 0; i -= 1) {
      const item = this.floatingDamageTexts[i];
      item.ageMs += deltaMs;
      const progress = Phaser.Math.Clamp(item.ageMs / Math.max(1, item.lifetimeMs), 0, 1);
      const eased = Phaser.Math.Easing.Quadratic.Out(progress);
      const fadeStart = this.debugState.damageNumberFadeStart;
      const fadeProgress = progress <= fadeStart ? 0 : (progress - fadeStart) / Math.max(0.01, 1 - fadeStart);

      item.text.setPosition(item.originX + item.driftX * eased, item.originY - item.riseDistance * eased);
      item.text.setScale(Phaser.Math.Linear(item.startScale, 1, eased));
      item.text.setAlpha(this.debugState.damageNumberAlpha * (1 - Phaser.Math.Clamp(fadeProgress, 0, 1)));

      if (progress >= 1) {
        item.text.destroy();
        this.floatingDamageTexts.splice(i, 1);
      }
    }
  }
}
