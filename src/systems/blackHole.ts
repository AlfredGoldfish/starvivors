import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  DEFAULT_BLACK_HOLE_FIELD_TUNING,
  applyBlackHoleWhirlpoolForce,
  computeBlackHoleWhirlpoolForce,
  getWrappedDirection,
  sampleWorldForce,
  type BlackHoleFieldTuningConfig,
  type BlackHoleWhirlpoolResult,
  type BlackHoleWhirlpoolTuning,
  type WorldForceRadii,
  type WorldForceSource,
  type WorldForceSample
} from './worldForces';
import { steerVelocityToward } from './physics';

const BLACK_HOLE_DRIFT_SPEED = 24;
const BLACK_HOLE_DRIFT_ANGLE = Math.PI * 0.18;
const BLACK_HOLE_DRIFT_RESPONSE = 0.18;
const BLACK_HOLE_DRIFT_TURN_RATE = 0.055;
const BLACK_HOLE_CORE_RADIUS = 82;
export const BLACK_HOLE_INFLUENCE_RADIUS = 760;
export const BLACK_HOLE_DAMAGE_RADIUS = BLACK_HOLE_INFLUENCE_RADIUS;
export const BLACK_HOLE_CAPTURE_RADIUS = 250;
export const BLACK_HOLE_EVENT_HORIZON_RADIUS = BLACK_HOLE_CORE_RADIUS;
export const BLACK_HOLE_PROJECTILE_INFLUENCE_RADIUS = BLACK_HOLE_INFLUENCE_RADIUS;
export const BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS = BLACK_HOLE_CAPTURE_RADIUS;
export const BLACK_HOLE_PROJECTILE_CAPTURE_MIN_SCALE = 0.08;
export const BLACK_HOLE_PROJECTILE_CAPTURE_FADE_SECONDS = 1.65;
export const BLACK_HOLE_PROJECTILE_CAPTURE_CONSUME_RADIUS = BLACK_HOLE_EVENT_HORIZON_RADIUS;
const BLACK_HOLE_DEFAULT_OBJECT_PULL_STRENGTH = 520;
const BLACK_HOLE_DEFAULT_PLAYER_PULL_STRENGTH = 420;

export type {
  BlackHoleFieldTuningConfig,
  BlackHoleWhirlpoolResult,
  BlackHoleWhirlpoolTuning,
  WorldForceSample as BlackHoleWhirlpoolSample
} from './worldForces';

export interface BlackHoleState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  coreRadius: number;
  warningRadius: number;
}

export interface BlackHoleVacuumTuning {
  baseEventHorizonRadius: number;
  maxEventHorizonRadius: number;
  growthPerMinute: number;
  captureMargin: number;
  warningMargin: number;
  playerCaptureDurationMs: number;
  playerPullStrength: number;
  objectPullStrength: number;
}

export const DEFAULT_BLACK_HOLE_VACUUM_TUNING: BlackHoleVacuumTuning = {
  baseEventHorizonRadius: 90,
  maxEventHorizonRadius: 240,
  growthPerMinute: 4.4,
  captureMargin: 110,
  warningMargin: 220,
  playerCaptureDurationMs: 1600,
  playerPullStrength: BLACK_HOLE_DEFAULT_PLAYER_PULL_STRENGTH,
  objectPullStrength: BLACK_HOLE_DEFAULT_OBJECT_PULL_STRENGTH
};

export interface BlackHoleCapturedProjectileState {
  capturedByBlackHole?: boolean;
  captureStartScale?: number;
  captureAge?: number;
}

export interface BlackHoleCapturableProjectile extends BlackHoleCapturedProjectileState {
  body: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  speed: number;
}

export const BLACK_HOLE_PROJECTILE_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 190,
  radialExtraAcceleration: 1850,
  swirlBaseAcceleration: 130,
  swirlExtraAcceleration: 1250,
  maxSpeed: 1520
};

export class BlackHoleSystem {
  readonly body: Phaser.GameObjects.Container;
  readonly wrapMirrorBody: Phaser.GameObjects.Container;

  private readonly bodyGraphics: Phaser.GameObjects.Graphics;
  private readonly wrapMirrorGraphics: Phaser.GameObjects.Graphics;
  private readonly velocity: Phaser.Math.Vector2;
  private influenceRadiusMultiplier = 1;
  private damageRadiusMultiplier = 1;
  private visualScaleMultiplier = 1;
  private coreScaleMultiplier = 1;
  private driftAngle = BLACK_HOLE_DRIFT_ANGLE;
  private runElapsedSeconds = 0;
  private vacuumTuning: BlackHoleVacuumTuning = { ...DEFAULT_BLACK_HOLE_VACUUM_TUNING };

  constructor(private readonly scene: Phaser.Scene, spawnPosition: Phaser.Math.Vector2) {
    this.bodyGraphics = scene.add.graphics();
    this.wrapMirrorGraphics = scene.add.graphics();
    this.body = scene.add
      .container(spawnPosition.x, spawnPosition.y, [
        this.bodyGraphics
      ])
      .setDepth(6);
    this.wrapMirrorBody = scene.add
      .container(spawnPosition.x, spawnPosition.y, [
        this.wrapMirrorGraphics
      ])
      .setDepth(6);
    this.velocity = new Phaser.Math.Vector2(
      Math.cos(BLACK_HOLE_DRIFT_ANGLE) * BLACK_HOLE_DRIFT_SPEED,
      Math.sin(BLACK_HOLE_DRIFT_ANGLE) * BLACK_HOLE_DRIFT_SPEED
    );

    this.body.setSize(this.warningRadius * 2, this.warningRadius * 2);
    this.wrapMirrorBody.setSize(this.warningRadius * 2, this.warningRadius * 2);
    this.wrapMirrorBody.setVisible(false);
    this.draw(this.bodyGraphics, false, false);
    this.draw(this.wrapMirrorGraphics, true, false);
  }

  update(
    time: number,
    deltaSeconds: number,
    arena: ArenaSize,
    isDebugEnabled: boolean,
    influenceRadiusMultiplier = 1,
    damageRadiusMultiplier = 1,
    visualScaleMultiplier = 1,
    coreScaleMultiplier = 1,
    shouldMove = true,
    runElapsedSeconds = this.runElapsedSeconds,
    vacuumTuning: BlackHoleVacuumTuning = this.vacuumTuning
  ): void {
    this.influenceRadiusMultiplier = Math.max(0, influenceRadiusMultiplier);
    this.damageRadiusMultiplier = Math.max(0, damageRadiusMultiplier);
    this.visualScaleMultiplier = Math.max(0, visualScaleMultiplier);
    this.coreScaleMultiplier = Math.max(0, coreScaleMultiplier);
    this.runElapsedSeconds = Math.max(0, runElapsedSeconds);
    this.vacuumTuning = this.normalizeVacuumTuning(vacuumTuning);
    if (shouldMove) {
      this.driftAngle += BLACK_HOLE_DRIFT_TURN_RATE * deltaSeconds;
      steerVelocityToward({
        velocity: this.velocity,
        targetVelocity: new Phaser.Math.Vector2(
          Math.cos(this.driftAngle) * BLACK_HOLE_DRIFT_SPEED,
          Math.sin(this.driftAngle) * BLACK_HOLE_DRIFT_SPEED
        ),
        response: BLACK_HOLE_DRIFT_RESPONSE,
        deltaSeconds,
        maxSpeed: BLACK_HOLE_DRIFT_SPEED
      });
      this.body.x = wrapCoordinate(this.body.x + this.velocity.x * deltaSeconds, arena.width);
      this.body.y = wrapCoordinate(this.body.y + this.velocity.y * deltaSeconds, arena.height);
    }
    this.body.setSize(this.warningRadius * 2, this.warningRadius * 2);
    this.wrapMirrorBody.setSize(this.warningRadius * 2, this.warningRadius * 2);
    this.draw(this.bodyGraphics, false, isDebugEnabled, time);
    this.draw(this.wrapMirrorGraphics, true, isDebugEnabled, time);
  }

  wouldConsumePlayer(playerX: number, playerY: number, arena: ArenaSize): boolean {
    const offset = this.getWrappedDirection(this.body.x, this.body.y, playerX, playerY, arena);

    return offset.lengthSq() <= this.eventHorizonRadius * this.eventHorizonRadius;
  }

  getWhirlpoolSample(x: number, y: number, arena: ArenaSize): WorldForceSample {
    return sampleWorldForce(this.getForceSource(), x, y, arena);
  }

  getVacuumSample(x: number, y: number, arena: ArenaSize): WorldForceSample {
    return sampleWorldForce(this.getForceSource(), x, y, arena);
  }

  applyVacuumToVelocity(
    x: number,
    y: number,
    velocity: Phaser.Math.Vector2,
    deltaSeconds: number,
    arena: ArenaSize,
    strength = this.vacuumTuning.objectPullStrength
  ): WorldForceSample {
    const sample = this.getVacuumSample(x, y, arena);

    if (sample.isInsideCapture && !sample.isInsideEventHorizon && deltaSeconds > 0) {
      const pullDirection = sample.direction.lengthSq() > 0
        ? sample.direction.clone().normalize()
        : new Phaser.Math.Vector2();
      const captureProgress = Phaser.Math.Clamp(
        (this.captureRadius - sample.distance) / Math.max(1, this.captureRadius - this.eventHorizonRadius),
        0,
        1
      );
      const acceleration = Math.max(0, strength) * Phaser.Math.Linear(0.45, 1.35, captureProgress);
      velocity.x += pullDirection.x * acceleration * deltaSeconds;
      velocity.y += pullDirection.y * acceleration * deltaSeconds;
    }

    return sample;
  }

  computeWhirlpoolAcceleration(
    x: number,
    y: number,
    velocity: Phaser.Math.Vector2,
    tuning: BlackHoleWhirlpoolTuning,
    arena: ArenaSize,
    fieldTuning: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
  ): BlackHoleWhirlpoolResult {
    return computeBlackHoleWhirlpoolForce(this.getForceSource(), x, y, velocity, tuning, arena, fieldTuning);
  }

  applyWhirlpoolToVelocity(
    x: number,
    y: number,
    velocity: Phaser.Math.Vector2,
    deltaSeconds: number,
    tuning: BlackHoleWhirlpoolTuning,
    arena: ArenaSize,
    fieldTuning: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
  ): BlackHoleWhirlpoolResult {
    return applyBlackHoleWhirlpoolForce(this.getForceSource(), x, y, velocity, deltaSeconds, tuning, arena, fieldTuning);
  }

  applyProjectileGravity(
    projectile: BlackHoleCapturableProjectile,
    deltaSeconds: number,
    arena: ArenaSize,
    fieldTuning: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
  ): boolean {
    void fieldTuning;
    const result = this.applyVacuumToVelocity(
      projectile.body.x,
      projectile.body.y,
      projectile.velocity,
      deltaSeconds,
      arena,
      this.vacuumTuning.objectPullStrength
    );

    if (result.isInsideCapture && !projectile.capturedByBlackHole) {
      projectile.capturedByBlackHole = true;
      projectile.captureStartScale = Math.max(projectile.body.scaleX, projectile.body.scaleY, 1);
      projectile.captureAge = 0;
      projectile.body.setAlpha(1);
    }

    return Boolean(projectile.capturedByBlackHole);
  }

  updateCapturedProjectile(
    projectile: BlackHoleCapturableProjectile,
    deltaSeconds: number,
    arena: ArenaSize
  ): boolean {
    if (!projectile.capturedByBlackHole) {
      return false;
    }

    const offset = this.getWrappedDirection(this.body.x, this.body.y, projectile.body.x, projectile.body.y, arena);
    const distance = offset.length();
    const captureRadius = this.captureRadius;
    const consumeRadius = this.eventHorizonRadius;
    const radialCompletion = Phaser.Math.Clamp(
      (captureRadius - distance) / Math.max(1, captureRadius - consumeRadius),
      0,
      1
    );
    const visualCompletion = radialCompletion;
    const scale = Phaser.Math.Linear(
      projectile.captureStartScale ?? 1,
      BLACK_HOLE_PROJECTILE_CAPTURE_MIN_SCALE,
      visualCompletion
    );

    projectile.captureAge = (projectile.captureAge ?? 0) + deltaSeconds;
    if (projectile.velocity.lengthSq() > 0) {
      projectile.body.rotation = Math.atan2(projectile.velocity.x, -projectile.velocity.y);
    }
    projectile.body.setScale(scale);
    projectile.body.setAlpha(1 - visualCompletion * 0.9);

    return distance <= consumeRadius;
  }

  getState(): BlackHoleState {
    return {
      body: this.body,
      wrapMirrorBody: this.wrapMirrorBody,
      coreRadius: this.coreRadius,
      warningRadius: this.warningRadius
    };
  }

  get coreRadius(): number {
    return this.eventHorizonRadius * this.coreScaleMultiplier;
  }

  get warningRadius(): number {
    return (this.eventHorizonRadius + this.vacuumTuning.captureMargin + this.vacuumTuning.warningMargin) * this.visualScaleMultiplier;
  }

  get influenceRadius(): number {
    return this.warningRadius * this.influenceRadiusMultiplier;
  }

  get damageRadius(): number {
    return this.captureRadius * this.damageRadiusMultiplier;
  }

  get captureRadius(): number {
    return this.eventHorizonRadius + this.vacuumTuning.captureMargin;
  }

  get eventHorizonRadius(): number {
    const grownRadius = this.vacuumTuning.baseEventHorizonRadius +
      (this.runElapsedSeconds / 60) * this.vacuumTuning.growthPerMinute;

    return Phaser.Math.Clamp(grownRadius, 1, this.vacuumTuning.maxEventHorizonRadius);
  }

  get growthPercent(): number {
    const range = Math.max(1, this.vacuumTuning.maxEventHorizonRadius - this.vacuumTuning.baseEventHorizonRadius);

    return Phaser.Math.Clamp((this.eventHorizonRadius - this.vacuumTuning.baseEventHorizonRadius) / range, 0, 1);
  }

  get vacuumConfig(): BlackHoleVacuumTuning {
    return { ...this.vacuumTuning };
  }

  private get lensFieldScale(): number {
    return this.visualScaleMultiplier;
  }

  private getWrappedDirection(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    arena: ArenaSize
  ): Phaser.Math.Vector2 {
    return getWrappedDirection(fromX, fromY, toX, toY, arena);
  }

  private normalizeVacuumTuning(tuning: BlackHoleVacuumTuning): BlackHoleVacuumTuning {
    const baseEventHorizonRadius = Math.max(1, tuning.baseEventHorizonRadius);
    const maxEventHorizonRadius = Math.max(baseEventHorizonRadius, tuning.maxEventHorizonRadius);

    return {
      baseEventHorizonRadius,
      maxEventHorizonRadius,
      growthPerMinute: Math.max(0, tuning.growthPerMinute),
      captureMargin: Math.max(0, tuning.captureMargin),
      warningMargin: Math.max(0, tuning.warningMargin),
      playerCaptureDurationMs: Math.max(250, tuning.playerCaptureDurationMs),
      playerPullStrength: Math.max(0, tuning.playerPullStrength),
      objectPullStrength: Math.max(0, tuning.objectPullStrength)
    };
  }

  private getForceSource(): WorldForceSource & WorldForceRadii {
    return {
      x: this.body.x,
      y: this.body.y,
      influenceRadius: this.influenceRadius,
      damageRadius: this.damageRadius,
      captureRadius: this.captureRadius,
      eventHorizonRadius: this.eventHorizonRadius
    };
  }

  private draw(
    graphics: Phaser.GameObjects.Graphics,
    isMirror: boolean,
    isDebugEnabled: boolean,
    _time = this.scene.time.now
  ): void {
    const mirrorAlpha = isMirror ? 0.55 : 1;
    const eventRadius = this.eventHorizonRadius;
    const captureRadius = this.captureRadius;
    const warningRadius = this.warningRadius;

    graphics.clear();

    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(0, 0, eventRadius);

    if (isDebugEnabled) {
      graphics.lineStyle(1, 0x9fd8ff, 0.3 * mirrorAlpha);
      graphics.strokeCircle(0, 0, warningRadius);
      graphics.lineStyle(1, 0x42f5d7, 0.5 * mirrorAlpha);
      graphics.strokeCircle(0, 0, captureRadius);
      graphics.lineStyle(2, 0xff5964, 0.8 * mirrorAlpha);
      graphics.strokeCircle(0, 0, eventRadius);
    }
  }
}
