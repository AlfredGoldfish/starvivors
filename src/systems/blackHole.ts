import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';

const BLACK_HOLE_SPAWN_OFFSET_X = 700;
const BLACK_HOLE_SPAWN_OFFSET_Y = 120;
const BLACK_HOLE_SAFE_SPAWN_DISTANCE = 700;
const BLACK_HOLE_DRIFT_SPEED = 24;
const BLACK_HOLE_DRIFT_ANGLE = Math.PI * 0.18;
const BLACK_HOLE_CORE_RADIUS = 82;
const BLACK_HOLE_WARNING_RADIUS = 260;
const BLACK_HOLE_VISUAL_PULSE_SPEED = 0.0026;
const BLACK_HOLE_VISUAL_TWIRL_SPEED = 0.48;
const BLACK_HOLE_WARNING_STAR_COUNT = 42;
const BLACK_HOLE_WARNING_STAR_MIN_RADIUS = 176;
const BLACK_HOLE_WARNING_STAR_MAX_RADIUS = 256;
const BLACK_HOLE_WARNING_STAR_ORBIT_SPEED_MIN = 0.12;
const BLACK_HOLE_WARNING_STAR_ORBIT_SPEED_MAX = 0.34;
const BLACK_HOLE_WARNING_STAR_TRAIL_ANGLE = 0.085;
const BLACK_HOLE_WARNING_STAR_COLORS = [0xf2fbff, 0xa8c7ff, 0x42f5d7, 0x9fd8ff] as const;

export type BlackHoleRingDebugColorMode = 'normal' | 'red' | 'green' | 'cyan' | 'white';

interface BlackHoleWarningStar {
  angle: number;
  radius: number;
  radiusPulse: number;
  size: number;
  speed: number;
  alpha: number;
  color: number;
  trailLength: number;
  trailAlpha: number;
}

export interface BlackHoleState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  coreRadius: number;
  warningRadius: number;
}

export class BlackHoleSystem {
  readonly body: Phaser.GameObjects.Container;
  readonly wrapMirrorBody: Phaser.GameObjects.Container;
  readonly coreRadius = BLACK_HOLE_CORE_RADIUS;
  readonly warningRadius = BLACK_HOLE_WARNING_RADIUS;

  private readonly bodyGraphics: Phaser.GameObjects.Graphics;
  private readonly wrapMirrorGraphics: Phaser.GameObjects.Graphics;
  private readonly velocity: Phaser.Math.Vector2;
  private readonly warningStars: BlackHoleWarningStar[];
  private visualPhase: number;

  constructor(private readonly scene: Phaser.Scene, arena: ArenaSize, center: Phaser.Math.Vector2) {
    const position = this.getSpawnPosition(arena, center);

    this.bodyGraphics = scene.add.graphics();
    this.wrapMirrorGraphics = scene.add.graphics();
    this.body = scene.add.container(position.x, position.y, [this.bodyGraphics]).setDepth(6);
    this.wrapMirrorBody = scene.add.container(position.x, position.y, [this.wrapMirrorGraphics]).setDepth(6);
    this.velocity = new Phaser.Math.Vector2(
      Math.cos(BLACK_HOLE_DRIFT_ANGLE) * BLACK_HOLE_DRIFT_SPEED,
      Math.sin(BLACK_HOLE_DRIFT_ANGLE) * BLACK_HOLE_DRIFT_SPEED
    );
    this.warningStars = this.createWarningStars();
    this.visualPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    this.body.setSize(BLACK_HOLE_WARNING_RADIUS * 2, BLACK_HOLE_WARNING_RADIUS * 2);
    this.wrapMirrorBody.setSize(BLACK_HOLE_WARNING_RADIUS * 2, BLACK_HOLE_WARNING_RADIUS * 2);
    this.wrapMirrorBody.setVisible(false);
    this.draw(this.bodyGraphics, false, 'normal', false);
    this.draw(this.wrapMirrorGraphics, true, 'normal', false);
  }

  update(
    time: number,
    deltaSeconds: number,
    arena: ArenaSize,
    ringDebugColorMode: BlackHoleRingDebugColorMode,
    isDebugEnabled: boolean
  ): void {
    this.body.x = wrapCoordinate(this.body.x + this.velocity.x * deltaSeconds, arena.width);
    this.body.y = wrapCoordinate(this.body.y + this.velocity.y * deltaSeconds, arena.height);
    this.visualPhase += BLACK_HOLE_VISUAL_TWIRL_SPEED * deltaSeconds;
    this.draw(this.bodyGraphics, false, ringDebugColorMode, isDebugEnabled, time);
    this.draw(this.wrapMirrorGraphics, true, ringDebugColorMode, isDebugEnabled, time);
  }

  wouldConsumePlayer(playerX: number, playerY: number, arena: ArenaSize): boolean {
    const offset = this.getWrappedDirection(this.body.x, this.body.y, playerX, playerY, arena);

    return offset.lengthSq() <= this.coreRadius * this.coreRadius;
  }

  getState(): BlackHoleState {
    return {
      body: this.body,
      wrapMirrorBody: this.wrapMirrorBody,
      coreRadius: this.coreRadius,
      warningRadius: this.warningRadius
    };
  }

  private getSpawnPosition(arena: ArenaSize, center: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const fixedX = wrapCoordinate(center.x + BLACK_HOLE_SPAWN_OFFSET_X, arena.width);
    const fixedY = wrapCoordinate(center.y + BLACK_HOLE_SPAWN_OFFSET_Y, arena.height);
    const fixedOffset = this.getWrappedDirection(center.x, center.y, fixedX, fixedY, arena);

    if (fixedOffset.length() >= BLACK_HOLE_SAFE_SPAWN_DISTANCE) {
      return new Phaser.Math.Vector2(fixedX, fixedY);
    }

    for (let i = 0; i < 12; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(BLACK_HOLE_SAFE_SPAWN_DISTANCE, BLACK_HOLE_SAFE_SPAWN_DISTANCE * 1.45);
      const x = wrapCoordinate(center.x + Math.cos(angle) * distance, arena.width);
      const y = wrapCoordinate(center.y + Math.sin(angle) * distance, arena.height);
      const offset = this.getWrappedDirection(center.x, center.y, x, y, arena);

      if (offset.length() >= BLACK_HOLE_SAFE_SPAWN_DISTANCE) {
        return new Phaser.Math.Vector2(x, y);
      }
    }

    return new Phaser.Math.Vector2(wrapCoordinate(center.x + BLACK_HOLE_SAFE_SPAWN_DISTANCE, arena.width), center.y);
  }

  private getWrappedDirection(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    arena: ArenaSize
  ): Phaser.Math.Vector2 {
    let x = toX - fromX;
    let y = toY - fromY;

    if (Math.abs(x) > arena.width / 2) {
      x -= Math.sign(x) * arena.width;
    }

    if (Math.abs(y) > arena.height / 2) {
      y -= Math.sign(y) * arena.height;
    }

    return new Phaser.Math.Vector2(x, y);
  }

  private createWarningStars(): BlackHoleWarningStar[] {
    return Array.from({ length: BLACK_HOLE_WARNING_STAR_COUNT }, (_, index) => {
      const ringShare = index / BLACK_HOLE_WARNING_STAR_COUNT;
      const bandOffset = (index % 4) / 3;

      return {
        angle: ringShare * Math.PI * 2 + Phaser.Math.FloatBetween(-0.18, 0.18),
        radius: Phaser.Math.Linear(BLACK_HOLE_WARNING_STAR_MIN_RADIUS, BLACK_HOLE_WARNING_STAR_MAX_RADIUS, bandOffset),
        radiusPulse: Phaser.Math.FloatBetween(4, 18),
        size: Phaser.Math.FloatBetween(1.1, 2.7),
        speed: Phaser.Math.FloatBetween(BLACK_HOLE_WARNING_STAR_ORBIT_SPEED_MIN, BLACK_HOLE_WARNING_STAR_ORBIT_SPEED_MAX),
        alpha: Phaser.Math.FloatBetween(0.58, 0.95),
        color: BLACK_HOLE_WARNING_STAR_COLORS[Phaser.Math.Between(0, BLACK_HOLE_WARNING_STAR_COLORS.length - 1)],
        trailLength: Phaser.Math.FloatBetween(0.72, 1.28),
        trailAlpha: Phaser.Math.FloatBetween(0.18, 0.32)
      };
    });
  }

  private draw(
    graphics: Phaser.GameObjects.Graphics,
    isMirror: boolean,
    ringDebugColorMode: BlackHoleRingDebugColorMode,
    isDebugEnabled: boolean,
    time = this.scene.time.now
  ): void {
    const pulse = 0.5 + Math.sin(time * BLACK_HOLE_VISUAL_PULSE_SPEED + this.visualPhase) * 0.5;
    const mirrorAlpha = isMirror ? 0.62 : 1;
    const bodyAlpha = isMirror ? 0.56 : 0.82;
    const ringAlpha = isMirror ? 0.52 : 0.86;
    const ringColor = this.getRingColor(ringDebugColorMode, isDebugEnabled);
    const coreAlpha = isMirror ? 0.84 : 1;

    graphics.clear();
    graphics.fillStyle(0x000006, isMirror ? 0.11 : 0.18);
    graphics.fillCircle(0, 0, this.warningRadius);
    graphics.fillStyle(0x000003, bodyAlpha);
    graphics.fillCircle(0, 0, this.coreRadius + 36 + pulse * 6);
    graphics.fillStyle(0x030307, isMirror ? 0.48 : 0.74);
    graphics.fillCircle(0, 0, this.coreRadius + 16);

    this.drawOrbitRing(graphics, this.coreRadius + 116, this.coreRadius + 34, this.visualPhase * 0.62, ringAlpha * 0.72, 3, ringColor);
    this.drawOrbitRing(graphics, this.coreRadius + 138, this.coreRadius + 48, -this.visualPhase * 0.44 + Math.PI * 0.34, ringAlpha * 0.58, 2, ringColor);
    this.drawOrbitRing(graphics, this.coreRadius + 104, this.coreRadius + 72, this.visualPhase * 0.28 + Math.PI * 0.68, ringAlpha * 0.52, 2, ringColor);
    this.drawOrbitRing(graphics, this.coreRadius + 156, this.coreRadius + 26, -this.visualPhase * 0.2 + Math.PI * 0.92, ringAlpha * 0.44, 1, ringColor);

    for (const star of this.warningStars) {
      const starAngle = star.angle + time * 0.001 * star.speed + this.visualPhase * 0.12;
      const starRadius = star.radius + Math.sin(time * BLACK_HOLE_VISUAL_PULSE_SPEED * 0.82 + star.angle) * star.radiusPulse;
      const x = Math.cos(starAngle) * starRadius;
      const y = Math.sin(starAngle) * starRadius * 0.74;
      const trailAngle = starAngle - BLACK_HOLE_WARNING_STAR_TRAIL_ANGLE * star.trailLength;
      const trailX = Math.cos(trailAngle) * starRadius;
      const trailY = Math.sin(trailAngle) * starRadius * 0.74;
      const midTrailAngle = starAngle - BLACK_HOLE_WARNING_STAR_TRAIL_ANGLE * star.trailLength * 0.52;
      const midTrailX = Math.cos(midTrailAngle) * starRadius;
      const midTrailY = Math.sin(midTrailAngle) * starRadius * 0.74;
      const alpha = star.alpha * mirrorAlpha * (0.68 + pulse * 0.32);

      graphics.lineStyle(Math.max(1, star.size * 0.72), star.color, alpha * star.trailAlpha);
      graphics.lineBetween(trailX, trailY, x, y);
      graphics.fillStyle(star.color, alpha * star.trailAlpha * 0.72);
      graphics.fillCircle(trailX, trailY, star.size * 0.4);
      graphics.fillStyle(star.color, alpha * star.trailAlpha);
      graphics.fillCircle(midTrailX, midTrailY, star.size * 0.58);
      graphics.fillStyle(star.color, alpha);
      graphics.fillCircle(x, y, star.size);
      graphics.fillStyle(0xf2fbff, alpha * 0.42);
      graphics.fillCircle(
        x + Math.cos(starAngle + Math.PI * 0.5) * 2.2,
        y + Math.sin(starAngle + Math.PI * 0.5) * 1.4,
        star.size * 0.45
      );
    }

    graphics.fillStyle(0x010107, coreAlpha);
    graphics.fillCircle(0, 0, this.coreRadius);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(0, 0, this.coreRadius * 0.72);
  }

  private drawOrbitRing(
    graphics: Phaser.GameObjects.Graphics,
    halfWidth: number,
    halfHeight: number,
    rotation: number,
    alpha: number,
    lineWidth: number,
    color = 0x000000
  ): void {
    const segments = 96;
    let previousX = Math.cos(rotation) * halfWidth;
    let previousY = Math.sin(rotation) * halfWidth;

    graphics.lineStyle(lineWidth, color, alpha);

    for (let i = 1; i <= segments; i += 1) {
      const angle = (Math.PI * 2 * i) / segments;
      const localX = Math.cos(angle) * halfWidth;
      const localY = Math.sin(angle) * halfHeight;
      const x = localX * Math.cos(rotation) - localY * Math.sin(rotation);
      const y = localX * Math.sin(rotation) + localY * Math.cos(rotation);

      graphics.lineBetween(previousX, previousY, x, y);
      previousX = x;
      previousY = y;
    }
  }

  private getRingColor(ringDebugColorMode: BlackHoleRingDebugColorMode, isDebugEnabled: boolean): number {
    if (!isDebugEnabled) {
      return 0x000000;
    }

    switch (ringDebugColorMode) {
      case 'red':
        return 0xff5964;
      case 'green':
        return 0x7cff6b;
      case 'cyan':
        return 0x42f5d7;
      case 'white':
        return 0xf2fbff;
      case 'normal':
      default:
        return 0x000000;
    }
  }
}
