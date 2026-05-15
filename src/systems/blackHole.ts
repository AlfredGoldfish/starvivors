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
const BLACK_HOLE_LENSING_ARC_COUNT = 56;
const BLACK_HOLE_LENSING_ARC_COLORS = [0xf2fbff, 0xa8c7ff, 0x42f5d7, 0x9fd8ff] as const;
const BLACK_HOLE_RING_SEGMENTS = 112;

interface BlackHoleLensingLayer {
  minRadius: number;
  maxRadius: number;
  resetRadius: number;
  inwardSpeedMin: number;
  inwardSpeedMax: number;
  angularDriftMin: number;
  angularDriftMax: number;
  alpha: number;
  thickness: [number, number];
  arcLength: [number, number];
  squash: [number, number];
}

const BLACK_HOLE_LENSING_LAYERS: BlackHoleLensingLayer[] = [
  {
    minRadius: 246,
    maxRadius: 318,
    resetRadius: 226,
    inwardSpeedMin: 9.5,
    inwardSpeedMax: 15,
    angularDriftMin: -0.034,
    angularDriftMax: 0.046,
    alpha: 0.28,
    thickness: [0.8, 1.4],
    arcLength: [0.06, 0.16],
    squash: [0.76, 0.9]
  },
  {
    minRadius: 206,
    maxRadius: 270,
    resetRadius: 168,
    inwardSpeedMin: 14,
    inwardSpeedMax: 22,
    angularDriftMin: -0.046,
    angularDriftMax: 0.064,
    alpha: 0.38,
    thickness: [1, 2],
    arcLength: [0.09, 0.24],
    squash: [0.7, 0.84]
  },
  {
    minRadius: 154,
    maxRadius: 222,
    resetRadius: 112,
    inwardSpeedMin: 20,
    inwardSpeedMax: 31,
    angularDriftMin: -0.064,
    angularDriftMax: 0.082,
    alpha: 0.22,
    thickness: [0.8, 1.5],
    arcLength: [0.05, 0.17],
    squash: [0.62, 0.76]
  }
];

export type BlackHoleRingDebugColorMode = 'normal' | 'red' | 'green' | 'cyan' | 'white';

interface BlackHoleLensingArc {
  layer: number;
  angle: number;
  radius: number;
  outerRadius: number;
  resetRadius: number;
  arcLength: number;
  baseArcLength: number;
  thickness: number;
  baseAlpha: number;
  alpha: number;
  color: number;
  inwardSpeed: number;
  angularDriftSpeed: number;
  pulsePhase: number;
  pulseAmount: number;
  squash: number;
  brokenness: number;
  foreground: boolean;
}

interface BlackHoleRingPlane {
  radius: number;
  tilt: number;
  nodeAngle: number;
  precessionSpeed: number;
  lineWidth: number;
  frontAlpha: number;
  backAlpha: number;
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
  private readonly lensingArcs: BlackHoleLensingArc[];
  private readonly ringPlanes: BlackHoleRingPlane[];
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
    this.lensingArcs = this.createLensingArcs();
    this.ringPlanes = this.createRingPlanes();
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
    this.updateLensingArcs(deltaSeconds);
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

  private createLensingArcs(): BlackHoleLensingArc[] {
    return Array.from({ length: BLACK_HOLE_LENSING_ARC_COUNT }, (_, index) =>
      this.createLensingArc(index % BLACK_HOLE_LENSING_LAYERS.length, index, false)
    );
  }

  private createLensingArc(layerIndex: number, index: number, startAtOuter: boolean): BlackHoleLensingArc {
    const layer = BLACK_HOLE_LENSING_LAYERS[layerIndex];
    const isDenseBandArc = index % 5 === 0;
    const clusterOffset = isDenseBandArc ? Phaser.Math.FloatBetween(-0.2, 0.2) : Phaser.Math.FloatBetween(-0.48, 0.48);
    const baseAngle =
      index < BLACK_HOLE_LENSING_ARC_COUNT * 0.42
        ? Math.PI * 0.08 + clusterOffset
        : (index / BLACK_HOLE_LENSING_ARC_COUNT) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.26, 0.26);
    const outerBias = Math.pow(Phaser.Math.FloatBetween(0, 1), 0.44);
    const radius = startAtOuter
      ? Phaser.Math.FloatBetween(layer.maxRadius - 12, layer.maxRadius + 12)
      : Phaser.Math.Linear(layer.minRadius, layer.maxRadius, outerBias);
    const baseArcLength = Phaser.Math.FloatBetween(layer.arcLength[0], isDenseBandArc ? layer.arcLength[1] * 1.28 : layer.arcLength[1]);
    const baseAlpha = layer.alpha * Phaser.Math.FloatBetween(0.7, isDenseBandArc ? 1.42 : 1.08);

    return {
      layer: layerIndex,
      angle: baseAngle,
      radius,
      outerRadius: layer.maxRadius,
      resetRadius: layer.resetRadius,
      arcLength: baseArcLength,
      baseArcLength,
      thickness: Phaser.Math.FloatBetween(layer.thickness[0], isDenseBandArc ? layer.thickness[1] * 1.22 : layer.thickness[1]),
      baseAlpha,
      alpha: baseAlpha,
      color: BLACK_HOLE_LENSING_ARC_COLORS[Phaser.Math.Between(0, BLACK_HOLE_LENSING_ARC_COLORS.length - 1)],
      inwardSpeed: Phaser.Math.FloatBetween(layer.inwardSpeedMin, layer.inwardSpeedMax),
      angularDriftSpeed: Phaser.Math.FloatBetween(layer.angularDriftMin, layer.angularDriftMax),
      pulsePhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      pulseAmount: Phaser.Math.FloatBetween(0.06, 0.18),
      squash: Phaser.Math.FloatBetween(layer.squash[0], layer.squash[1]),
      brokenness: Phaser.Math.FloatBetween(0.2, 0.44),
      foreground: layerIndex === 1 && index % 7 === 0
    };
  }

  private updateLensingArcs(deltaSeconds: number): void {
    for (let i = 0; i < this.lensingArcs.length; i += 1) {
      const arc = this.lensingArcs[i];
      arc.radius -= arc.inwardSpeed * deltaSeconds;
      arc.angle += arc.angularDriftSpeed * deltaSeconds;

      if (arc.radius <= arc.resetRadius) {
        this.lensingArcs[i] = this.createLensingArc(arc.layer, i, true);
      }
    }
  }

  private createRingPlanes(): BlackHoleRingPlane[] {
    return [
      {
        radius: this.coreRadius + 120,
        tilt: 1.18,
        nodeAngle: Math.PI * 0.02,
        precessionSpeed: 0.08,
        lineWidth: 3,
        frontAlpha: 0.9,
        backAlpha: 0.28
      },
      {
        radius: this.coreRadius + 136,
        tilt: 0.72,
        nodeAngle: Math.PI * 0.32,
        precessionSpeed: -0.055,
        lineWidth: 2,
        frontAlpha: 0.74,
        backAlpha: 0.22
      },
      {
        radius: this.coreRadius + 108,
        tilt: 1.42,
        nodeAngle: Math.PI * 0.62,
        precessionSpeed: 0.038,
        lineWidth: 2,
        frontAlpha: 0.68,
        backAlpha: 0.18
      },
      {
        radius: this.coreRadius + 154,
        tilt: 0.94,
        nodeAngle: Math.PI * 0.86,
        precessionSpeed: -0.03,
        lineWidth: 1,
        frontAlpha: 0.52,
        backAlpha: 0.16
      }
    ];
  }

  private draw(
    graphics: Phaser.GameObjects.Graphics,
    isMirror: boolean,
    ringDebugColorMode: BlackHoleRingDebugColorMode,
    isDebugEnabled: boolean,
    time = this.scene.time.now
  ): void {
    const pulse = 0.5 + Math.sin(time * BLACK_HOLE_VISUAL_PULSE_SPEED + this.visualPhase) * 0.5;
    const bodyAlpha = isMirror ? 0.56 : 0.82;
    const ringColor = this.getRingColor(ringDebugColorMode, isDebugEnabled);
    const coreAlpha = isMirror ? 0.84 : 1;

    graphics.clear();
    graphics.fillStyle(0x000006, isMirror ? 0.11 : 0.18);
    graphics.fillCircle(0, 0, this.warningRadius);

    this.drawLensingArcs(graphics, isMirror, time, false);
    this.drawProjectedRings(graphics, isMirror, ringColor, false, isDebugEnabled);

    graphics.fillStyle(0x000003, bodyAlpha);
    graphics.fillCircle(0, 0, this.coreRadius + 36 + pulse * 6);
    graphics.fillStyle(0x030307, isMirror ? 0.48 : 0.74);
    graphics.fillCircle(0, 0, this.coreRadius + 16);
    graphics.fillStyle(0x010107, coreAlpha);
    graphics.fillCircle(0, 0, this.coreRadius);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(0, 0, this.coreRadius * 0.72);

    this.drawProjectedRings(graphics, isMirror, ringColor, true, isDebugEnabled);
    this.drawLensingArcs(graphics, isMirror, time, true);
  }

  private drawLensingArcs(
    graphics: Phaser.GameObjects.Graphics,
    isMirror: boolean,
    time: number,
    foreground: boolean
  ): void {
    const mirrorAlpha = isMirror ? 0.58 : 1;

    for (const arc of this.lensingArcs) {
      if (arc.foreground !== foreground) {
        continue;
      }

      const inwardProgress = Phaser.Math.Clamp(
        (arc.outerRadius - arc.radius) / Math.max(1, arc.outerRadius - arc.resetRadius),
        0,
        1
      );
      const fadeIn = Phaser.Math.Clamp((arc.outerRadius - arc.radius) / 24, 0, 1);
      const fadeOut = Phaser.Math.Clamp((arc.radius - arc.resetRadius) / 42, 0, 1);
      const stretch = 1 + inwardProgress * (arc.layer === 2 ? 0.52 : 0.34);
      const driftedAngle = arc.angle + Math.sin(time * 0.00023 + arc.pulsePhase) * 0.012;
      const radius = arc.radius + Math.sin(time * 0.00031 + arc.pulsePhase) * (1.5 + inwardProgress * 2.2);
      const brightness = 1 + Math.sin(time * BLACK_HOLE_VISUAL_PULSE_SPEED * 0.36 + arc.pulsePhase) * arc.pulseAmount;
      const alpha = arc.baseAlpha * fadeIn * fadeOut * mirrorAlpha * brightness * (foreground ? 0.76 : 1);
      const arcLength = arc.baseArcLength * stretch;
      const firstLength = arcLength * (0.52 - arc.brokenness * 0.22);
      const secondLength = arcLength * (0.28 + arc.brokenness * 0.18);
      const gap = arcLength * (0.18 + arc.brokenness * 0.22);

      arc.alpha = alpha;
      arc.arcLength = arcLength;

      this.drawLensingArcSegment(graphics, arc, driftedAngle - arcLength * 0.5, firstLength, radius, alpha);
      this.drawLensingArcSegment(graphics, arc, driftedAngle - arcLength * 0.5 + firstLength + gap, secondLength, radius, alpha * 0.72);
    }
  }

  private drawLensingArcSegment(
    graphics: Phaser.GameObjects.Graphics,
    arc: BlackHoleLensingArc,
    startAngle: number,
    arcLength: number,
    radius: number,
    alpha: number
  ): void {
    const segments = 8;
    let previous = this.getLensingArcPoint(startAngle, radius, arc.squash);

    graphics.lineStyle(arc.thickness, arc.color, alpha);

    for (let i = 1; i <= segments; i += 1) {
      const angle = startAngle + (arcLength * i) / segments;
      const point = this.getLensingArcPoint(angle, radius, arc.squash);

      graphics.lineBetween(previous.x, previous.y, point.x, point.y);
      previous = point;
    }
  }

  private getLensingArcPoint(angle: number, radius: number, squash: number): { x: number; y: number } {
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * squash
    };
  }

  private drawProjectedRings(
    graphics: Phaser.GameObjects.Graphics,
    isMirror: boolean,
    color: number,
    frontPass: boolean,
    isDebugEnabled: boolean
  ): void {
    for (const ring of this.ringPlanes) {
      this.drawProjectedRingPass(graphics, ring, isMirror, color, frontPass, isDebugEnabled);
    }
  }

  private drawProjectedRingPass(
    graphics: Phaser.GameObjects.Graphics,
    ring: BlackHoleRingPlane,
    isMirror: boolean,
    color: number,
    frontPass: boolean,
    isDebugEnabled: boolean
  ): void {
    const nodeAngle = ring.nodeAngle + this.visualPhase * ring.precessionSpeed;
    const alphaBase = frontPass ? ring.frontAlpha : ring.backAlpha;
    const alpha = alphaBase * (isMirror ? 0.56 : 1) * (isDebugEnabled && color !== 0x000000 ? 1 : 0.82);

    for (let i = 0; i < BLACK_HOLE_RING_SEGMENTS; i += 1) {
      const startAngle = (Math.PI * 2 * i) / BLACK_HOLE_RING_SEGMENTS;
      const endAngle = (Math.PI * 2 * (i + 1)) / BLACK_HOLE_RING_SEGMENTS;
      const midAngle = (startAngle + endAngle) * 0.5;
      const midDepth = Math.sin(midAngle) * Math.sin(ring.tilt);
      const isFrontSegment = midDepth >= 0;

      if (isFrontSegment !== frontPass) {
        continue;
      }

      const start = this.projectRingPoint(startAngle, ring.radius, ring.tilt, nodeAngle);
      const end = this.projectRingPoint(endAngle, ring.radius, ring.tilt, nodeAngle);

      graphics.lineStyle(ring.lineWidth, color, alpha);
      graphics.lineBetween(start.x, start.y, end.x, end.y);
    }
  }

  private projectRingPoint(angle: number, radius: number, tilt: number, nodeAngle: number): { x: number; y: number } {
    const localX = Math.cos(angle) * radius;
    const localY = Math.sin(angle) * radius * Math.cos(tilt);

    return {
      x: localX * Math.cos(nodeAngle) - localY * Math.sin(nodeAngle),
      y: localX * Math.sin(nodeAngle) + localY * Math.cos(nodeAngle)
    };
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
