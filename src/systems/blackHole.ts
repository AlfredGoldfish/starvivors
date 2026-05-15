import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';

const BLACK_HOLE_SPAWN_OFFSET_X = 700;
const BLACK_HOLE_SPAWN_OFFSET_Y = 120;
const BLACK_HOLE_SAFE_SPAWN_DISTANCE = 700;
const BLACK_HOLE_DRIFT_SPEED = 24;
const BLACK_HOLE_DRIFT_ANGLE = Math.PI * 0.18;
const BLACK_HOLE_CORE_RADIUS = 82;
const BLACK_HOLE_WARNING_RADIUS = 260;
const BLACK_HOLE_LENS_FADE_BORDER_RADIUS_OFFSET = 34;
const BLACK_HOLE_VISUAL_PULSE_SPEED = 0.0026;
const BLACK_HOLE_VISUAL_TWIRL_SPEED = 0.48;
export const BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT = 700;
export const BLACK_HOLE_LENSING_ARC_MAX_COUNT = 1000;
export const BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS = 260;
export const BLACK_HOLE_PROJECTILE_CAPTURE_INWARD_SPEED = 118;
export const BLACK_HOLE_PROJECTILE_CAPTURE_ANGULAR_SPEED = 3.2;
export const BLACK_HOLE_PROJECTILE_CAPTURE_MIN_SCALE = 0.08;
export const BLACK_HOLE_PROJECTILE_CAPTURE_FADE_SECONDS = 1.65;
export const BLACK_HOLE_PROJECTILE_CAPTURE_CONSUME_RADIUS = 70;
const BLACK_HOLE_LENSING_ARC_COLORS = [0xf2fbff, 0xa8c7ff, 0x42f5d7, 0x9fd8ff] as const;
const BLACK_HOLE_LENS_TEXTURE_SIZE = 1024;
const BLACK_HOLE_LENS_TEXTURE_DISPLAY_SIZE = 720;
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
    inwardSpeedMin: 6,
    inwardSpeedMax: 10,
    angularDriftMin: 0.16,
    angularDriftMax: 0.22,
    alpha: 0.16,
    thickness: [0.8, 1.4],
    arcLength: [0.06, 0.16],
    squash: [0.76, 0.9]
  },
  {
    minRadius: 206,
    maxRadius: 270,
    resetRadius: 168,
    inwardSpeedMin: 9,
    inwardSpeedMax: 15,
    angularDriftMin: 0.26,
    angularDriftMax: 0.36,
    alpha: 0.24,
    thickness: [1, 2],
    arcLength: [0.09, 0.24],
    squash: [0.7, 0.84]
  },
  {
    minRadius: 154,
    maxRadius: 222,
    resetRadius: 112,
    inwardSpeedMin: 13,
    inwardSpeedMax: 22,
    angularDriftMin: 0.42,
    angularDriftMax: 0.58,
    alpha: 0.14,
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

interface BlackHoleLensTextureLayer {
  key: string;
  isProjectionLayer: boolean;
  strokeCount: number;
  minRadius: number;
  maxRadius: number;
  squash: number;
  nodeAngle: number;
  alpha: number;
  mirrorAlpha: number;
  rotationSpeed: number;
  scalePulse: number;
  scalePulseSpeed: number;
}

const BLACK_HOLE_LENS_TEXTURE_LAYERS: BlackHoleLensTextureLayer[] = [
  {
    key: 'starvivors-black-hole-lens-field-outer',
    isProjectionLayer: false,
    strokeCount: 2600,
    minRadius: 280,
    maxRadius: 500,
    squash: 0.84,
    nodeAngle: 0,
    alpha: 0.52,
    mirrorAlpha: 0.28,
    rotationSpeed: 0.034,
    scalePulse: 0.012,
    scalePulseSpeed: 0.29
  },
  {
    key: 'starvivors-black-hole-lens-field-mid',
    isProjectionLayer: false,
    strokeCount: 3400,
    minRadius: 205,
    maxRadius: 420,
    squash: 0.72,
    nodeAngle: 0,
    alpha: 0.62,
    mirrorAlpha: 0.34,
    rotationSpeed: 0.058,
    scalePulse: 0.016,
    scalePulseSpeed: 0.37
  },
  {
    key: 'starvivors-black-hole-lens-field-inner',
    isProjectionLayer: false,
    strokeCount: 2400,
    minRadius: 142,
    maxRadius: 318,
    squash: 0.58,
    nodeAngle: 0,
    alpha: 0.46,
    mirrorAlpha: 0.25,
    rotationSpeed: 0.092,
    scalePulse: 0.018,
    scalePulseSpeed: 0.43
  },
  {
    key: 'starvivors-black-hole-lens-field-bright',
    isProjectionLayer: false,
    strokeCount: 1600,
    minRadius: 220,
    maxRadius: 455,
    squash: 0.78,
    nodeAngle: 0,
    alpha: 0.38,
    mirrorAlpha: 0.2,
    rotationSpeed: 0.071,
    scalePulse: 0.01,
    scalePulseSpeed: 0.33
  },
  {
    key: 'starvivors-black-hole-lens-projection-horizontal',
    isProjectionLayer: true,
    strokeCount: 1200,
    minRadius: 176,
    maxRadius: 438,
    squash: 0.34,
    nodeAngle: Math.PI * 0.02,
    alpha: 0.22,
    mirrorAlpha: 0.12,
    rotationSpeed: 0.042,
    scalePulse: 0.01,
    scalePulseSpeed: 0.26
  },
  {
    key: 'starvivors-black-hole-lens-projection-diagonal-a',
    isProjectionLayer: true,
    strokeCount: 1100,
    minRadius: 156,
    maxRadius: 406,
    squash: 0.46,
    nodeAngle: Math.PI * 0.24,
    alpha: 0.18,
    mirrorAlpha: 0.1,
    rotationSpeed: 0.052,
    scalePulse: 0.012,
    scalePulseSpeed: 0.31
  },
  {
    key: 'starvivors-black-hole-lens-projection-vertical',
    isProjectionLayer: true,
    strokeCount: 950,
    minRadius: 132,
    maxRadius: 382,
    squash: 0.28,
    nodeAngle: Math.PI * 0.48,
    alpha: 0.16,
    mirrorAlpha: 0.09,
    rotationSpeed: 0.066,
    scalePulse: 0.014,
    scalePulseSpeed: 0.36
  },
  {
    key: 'starvivors-black-hole-lens-projection-diagonal-b',
    isProjectionLayer: true,
    strokeCount: 1000,
    minRadius: 172,
    maxRadius: 462,
    squash: 0.52,
    nodeAngle: Math.PI * 0.72,
    alpha: 0.15,
    mirrorAlpha: 0.08,
    rotationSpeed: 0.035,
    scalePulse: 0.01,
    scalePulseSpeed: 0.28
  }
];

export interface BlackHoleState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  coreRadius: number;
  warningRadius: number;
}

export interface BlackHoleCapturedProjectileState {
  capturedByBlackHole?: boolean;
  captureAngle?: number;
  captureRadius?: number;
  captureAngularSpeed?: number;
  captureInwardSpeed?: number;
  captureStartScale?: number;
  captureAge?: number;
}

export interface BlackHoleCapturableProjectile extends BlackHoleCapturedProjectileState {
  body: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
}

export class BlackHoleSystem {
  readonly body: Phaser.GameObjects.Container;
  readonly wrapMirrorBody: Phaser.GameObjects.Container;
  readonly coreRadius = BLACK_HOLE_CORE_RADIUS;
  readonly warningRadius = BLACK_HOLE_WARNING_RADIUS;

  private readonly bodyGraphics: Phaser.GameObjects.Graphics;
  private readonly wrapMirrorGraphics: Phaser.GameObjects.Graphics;
  private readonly lensTextureImages: Phaser.GameObjects.Image[];
  private readonly wrapMirrorLensTextureImages: Phaser.GameObjects.Image[];
  private readonly velocity: Phaser.Math.Vector2;
  private readonly lensingArcs: BlackHoleLensingArc[];
  private readonly ringPlanes: BlackHoleRingPlane[];
  private activeLensingArcCount = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
  private lensLengthMultiplier = 1;
  private visualPhase: number;

  constructor(private readonly scene: Phaser.Scene, arena: ArenaSize, center: Phaser.Math.Vector2) {
    const position = this.getSpawnPosition(arena, center);

    this.ensureLensTextureLayers();
    this.lensTextureImages = this.createLensTextureImages(false);
    this.wrapMirrorLensTextureImages = this.createLensTextureImages(true);
    this.bodyGraphics = scene.add.graphics();
    this.wrapMirrorGraphics = scene.add.graphics();
    this.body = scene.add.container(position.x, position.y, [...this.lensTextureImages, this.bodyGraphics]).setDepth(6);
    this.wrapMirrorBody = scene.add
      .container(position.x, position.y, [...this.wrapMirrorLensTextureImages, this.wrapMirrorGraphics])
      .setDepth(6);
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
    isDebugEnabled: boolean,
    lensOrbitSpeedMultiplier = 1,
    activeLensingArcCount = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT,
    lensLengthMultiplier = 1,
    areProjectionLensLayersEnabled = true
  ): void {
    this.activeLensingArcCount = Phaser.Math.Clamp(
      Math.round(activeLensingArcCount),
      0,
      BLACK_HOLE_LENSING_ARC_MAX_COUNT
    );
    this.setLensLengthMultiplier(lensLengthMultiplier);
    this.body.x = wrapCoordinate(this.body.x + this.velocity.x * deltaSeconds, arena.width);
    this.body.y = wrapCoordinate(this.body.y + this.velocity.y * deltaSeconds, arena.height);
    this.visualPhase += BLACK_HOLE_VISUAL_TWIRL_SPEED * deltaSeconds;
    this.updateLensingArcs(deltaSeconds, lensOrbitSpeedMultiplier);
    this.updateLensTextureImages(time, false, lensOrbitSpeedMultiplier, areProjectionLensLayersEnabled);
    this.updateLensTextureImages(time, true, lensOrbitSpeedMultiplier, areProjectionLensLayersEnabled);
    this.draw(this.bodyGraphics, false, ringDebugColorMode, isDebugEnabled, time);
    this.draw(this.wrapMirrorGraphics, true, ringDebugColorMode, isDebugEnabled, time);
  }

  wouldConsumePlayer(playerX: number, playerY: number, arena: ArenaSize): boolean {
    const offset = this.getWrappedDirection(this.body.x, this.body.y, playerX, playerY, arena);

    return offset.lengthSq() <= this.coreRadius * this.coreRadius;
  }

  tryCaptureProjectile(projectile: BlackHoleCapturableProjectile, arena: ArenaSize): boolean {
    if (projectile.capturedByBlackHole) {
      return true;
    }

    const offset = this.getWrappedDirection(this.body.x, this.body.y, projectile.body.x, projectile.body.y, arena);

    if (offset.lengthSq() > BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS * BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS) {
      return false;
    }

    const radius = Math.max(offset.length(), BLACK_HOLE_PROJECTILE_CAPTURE_CONSUME_RADIUS + 1);
    const angle = Math.atan2(offset.y, offset.x);
    const tangentialDirection = new Phaser.Math.Vector2(-Math.sin(angle), Math.cos(angle));
    const orbitSign = projectile.velocity.dot(tangentialDirection) < 0 ? -1 : 1;

    projectile.capturedByBlackHole = true;
    projectile.captureAngle = angle;
    projectile.captureRadius = radius;
    projectile.captureAngularSpeed = BLACK_HOLE_PROJECTILE_CAPTURE_ANGULAR_SPEED * orbitSign;
    projectile.captureInwardSpeed = BLACK_HOLE_PROJECTILE_CAPTURE_INWARD_SPEED;
    projectile.captureStartScale = Math.max(projectile.body.scaleX, projectile.body.scaleY, 1);
    projectile.captureAge = 0;
    projectile.body.setAlpha(1);

    return true;
  }

  updateCapturedProjectile(
    projectile: BlackHoleCapturableProjectile,
    deltaSeconds: number,
    arena: ArenaSize
  ): boolean {
    if (!projectile.capturedByBlackHole) {
      return false;
    }

    const captureAge = (projectile.captureAge ?? 0) + deltaSeconds;
    const captureRadius = Math.max(
      0,
      (projectile.captureRadius ?? BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS) -
        (projectile.captureInwardSpeed ?? BLACK_HOLE_PROJECTILE_CAPTURE_INWARD_SPEED) * deltaSeconds
    );
    const captureAngle =
      (projectile.captureAngle ?? 0) +
      (projectile.captureAngularSpeed ?? BLACK_HOLE_PROJECTILE_CAPTURE_ANGULAR_SPEED) *
        (1 + (1 - captureRadius / BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS) * 0.65) *
        deltaSeconds;
    const completion = Phaser.Math.Clamp(captureAge / BLACK_HOLE_PROJECTILE_CAPTURE_FADE_SECONDS, 0, 1);
    const radialCompletion = Phaser.Math.Clamp(
      (BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS - captureRadius) /
        Math.max(1, BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS - BLACK_HOLE_PROJECTILE_CAPTURE_CONSUME_RADIUS),
      0,
      1
    );
    const visualCompletion = Math.max(completion, radialCompletion);
    const scale = Phaser.Math.Linear(
      projectile.captureStartScale ?? 1,
      BLACK_HOLE_PROJECTILE_CAPTURE_MIN_SCALE,
      visualCompletion
    );

    projectile.captureAge = captureAge;
    projectile.captureRadius = captureRadius;
    projectile.captureAngle = captureAngle;
    projectile.body.x = wrapCoordinate(this.body.x + Math.cos(captureAngle) * captureRadius, arena.width);
    projectile.body.y = wrapCoordinate(this.body.y + Math.sin(captureAngle) * captureRadius, arena.height);
    projectile.body.rotation = captureAngle + Math.sign(projectile.captureAngularSpeed ?? 1) * Math.PI * 0.5;
    projectile.body.setScale(scale);
    projectile.body.setAlpha(1 - visualCompletion * 0.9);

    return (
      captureRadius <= BLACK_HOLE_PROJECTILE_CAPTURE_CONSUME_RADIUS ||
      captureAge >= BLACK_HOLE_PROJECTILE_CAPTURE_FADE_SECONDS
    );
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

  private ensureLensTextureLayers(): void {
    for (const layer of BLACK_HOLE_LENS_TEXTURE_LAYERS) {
      if (!this.scene.textures.exists(layer.key)) {
        this.scene.textures.createCanvas(
          layer.key,
          BLACK_HOLE_LENS_TEXTURE_SIZE,
          BLACK_HOLE_LENS_TEXTURE_SIZE
        );
      }
    }

    this.redrawLensTextureLayers();
  }

  private redrawLensTextureLayers(): void {
    for (const layer of BLACK_HOLE_LENS_TEXTURE_LAYERS) {
      const texture = this.scene.textures.get(layer.key) as Phaser.Textures.CanvasTexture;

      if (!texture || typeof texture.getContext !== 'function') {
        continue;
      }

      const context = texture.getContext();
      this.drawLensTextureLayer(context, layer);
      texture.refresh();
    }
  }

  private drawLensTextureLayer(context: CanvasRenderingContext2D, layer: BlackHoleLensTextureLayer): void {
    const center = BLACK_HOLE_LENS_TEXTURE_SIZE / 2;
    const random = new Phaser.Math.RandomDataGenerator([layer.key]);

    context.clearRect(0, 0, BLACK_HOLE_LENS_TEXTURE_SIZE, BLACK_HOLE_LENS_TEXTURE_SIZE);
    context.lineCap = 'round';

    for (let i = 0; i < layer.strokeCount; i += 1) {
      const band = i % 7 === 0 ? 0.68 : i % 5 === 0 ? 0.44 : random.frac();
      const radius = Phaser.Math.Linear(layer.minRadius, layer.maxRadius, Math.pow(random.frac() * 0.68 + band * 0.32, 0.86));
      const angle = random.frac() * Math.PI * 2;
      const length = Phaser.Math.Linear(5, i % 11 === 0 ? 34 : 22, random.frac()) * this.lensLengthMultiplier;
      const thickness = Phaser.Math.Linear(0.45, i % 13 === 0 ? 1.35 : 0.9, random.frac());
      const radialProgress = Phaser.Math.Clamp(
        (radius - layer.minRadius) / Math.max(1, layer.maxRadius - layer.minRadius),
        0,
        1
      );
      const innerFade = Phaser.Math.Clamp((radius - layer.minRadius) / 54, 0, 1);
      const outerFade = Phaser.Math.Clamp((layer.maxRadius - radius) / 74, 0, 1);
      const alpha = Phaser.Math.Linear(0.08, i % 17 === 0 ? 0.58 : 0.28, random.frac()) * innerFade * outerFade;
      const color = BLACK_HOLE_LENSING_ARC_COLORS[random.integerInRange(0, BLACK_HOLE_LENSING_ARC_COLORS.length - 1)];
      const localX = Math.cos(angle) * radius;
      const localY = Math.sin(angle) * radius * layer.squash;
      const x = center + localX * Math.cos(layer.nodeAngle) - localY * Math.sin(layer.nodeAngle);
      const y = center + localX * Math.sin(layer.nodeAngle) + localY * Math.cos(layer.nodeAngle);
      const tangentX = -Math.sin(angle);
      const tangentY = Math.cos(angle) * layer.squash;
      const tangentLength = Math.max(0.001, Math.hypot(tangentX, tangentY));
      const rotatedTangentX = tangentX * Math.cos(layer.nodeAngle) - tangentY * Math.sin(layer.nodeAngle);
      const rotatedTangentY = tangentX * Math.sin(layer.nodeAngle) + tangentY * Math.cos(layer.nodeAngle);
      const halfLength = length * (0.72 + radialProgress * 0.42) * 0.5;

      context.globalAlpha = alpha;
      context.strokeStyle = this.toRgba(color, 1);
      context.lineWidth = thickness;
      context.beginPath();
      context.moveTo(x - (rotatedTangentX / tangentLength) * halfLength, y - (rotatedTangentY / tangentLength) * halfLength);
      context.lineTo(x + (rotatedTangentX / tangentLength) * halfLength, y + (rotatedTangentY / tangentLength) * halfLength);
      context.stroke();
    }

    context.globalAlpha = 1;
  }

  private toRgba(color: number, alpha: number): string {
    const red = (color >> 16) & 0xff;
    const green = (color >> 8) & 0xff;
    const blue = color & 0xff;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  private createLensTextureImages(isMirror: boolean): Phaser.GameObjects.Image[] {
    return BLACK_HOLE_LENS_TEXTURE_LAYERS.map((layer) =>
      this.scene.add
        .image(0, 0, layer.key)
        .setOrigin(0.5)
        .setDisplaySize(BLACK_HOLE_LENS_TEXTURE_DISPLAY_SIZE, BLACK_HOLE_LENS_TEXTURE_DISPLAY_SIZE)
        .setAlpha(isMirror ? layer.mirrorAlpha : layer.alpha)
    );
  }

  private updateLensTextureImages(
    time: number,
    isMirror: boolean,
    lensOrbitSpeedMultiplier: number,
    areProjectionLensLayersEnabled: boolean
  ): void {
    const images = isMirror ? this.wrapMirrorLensTextureImages : this.lensTextureImages;
    const orbitMultiplier = Math.max(0, lensOrbitSpeedMultiplier);

    for (let i = 0; i < images.length; i += 1) {
      const image = images[i];
      const layer = BLACK_HOLE_LENS_TEXTURE_LAYERS[i];
      const scalePulse = 1 + Math.sin(time * 0.001 * layer.scalePulseSpeed + i * 1.7) * layer.scalePulse;
      const isVisible = !layer.isProjectionLayer || areProjectionLensLayersEnabled;

      image.setRotation(time * 0.001 * layer.rotationSpeed * orbitMultiplier);
      image.setScale((BLACK_HOLE_LENS_TEXTURE_DISPLAY_SIZE / BLACK_HOLE_LENS_TEXTURE_SIZE) * scalePulse);
      image.setVisible(isVisible);
      image.setAlpha(isVisible ? (isMirror ? layer.mirrorAlpha : layer.alpha) : 0);
    }
  }

  private setLensLengthMultiplier(lensLengthMultiplier: number): void {
    const nextMultiplier = Number(Phaser.Math.Clamp(lensLengthMultiplier, 0.25, 4).toFixed(1));

    if (nextMultiplier === this.lensLengthMultiplier) {
      return;
    }

    this.lensLengthMultiplier = nextMultiplier;
    this.redrawLensTextureLayers();
  }

  private createLensingArcs(): BlackHoleLensingArc[] {
    return Array.from({ length: BLACK_HOLE_LENSING_ARC_MAX_COUNT }, (_, index) =>
      this.createLensingArc(index % BLACK_HOLE_LENSING_LAYERS.length, index, false)
    );
  }

  private createLensingArc(layerIndex: number, index: number, startAtOuter: boolean): BlackHoleLensingArc {
    const layer = BLACK_HOLE_LENSING_LAYERS[layerIndex];
    const isDenseBandArc = index % 5 === 0;
    const clusterOffset = isDenseBandArc ? Phaser.Math.FloatBetween(-0.2, 0.2) : Phaser.Math.FloatBetween(-0.48, 0.48);
    const baseAngle = isDenseBandArc
      ? Math.PI * 0.08 + clusterOffset
      : index * 2.399963229728653 + Phaser.Math.FloatBetween(-0.26, 0.26);
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
      angularDriftSpeed: Math.abs(Phaser.Math.FloatBetween(layer.angularDriftMin, layer.angularDriftMax)),
      pulsePhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      pulseAmount: Phaser.Math.FloatBetween(0.06, 0.18),
      squash: Phaser.Math.FloatBetween(layer.squash[0], layer.squash[1]),
      brokenness: Phaser.Math.FloatBetween(0.2, 0.44),
      foreground: layerIndex === 1 && index % 7 === 0
    };
  }

  private updateLensingArcs(deltaSeconds: number, lensOrbitSpeedMultiplier: number): void {
    const orbitMultiplier = Math.max(0, lensOrbitSpeedMultiplier);

    for (let i = 0; i < this.activeLensingArcCount; i += 1) {
      const arc = this.lensingArcs[i];
      arc.radius -= arc.inwardSpeed * deltaSeconds;
      arc.angle += arc.angularDriftSpeed * orbitMultiplier * deltaSeconds;

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
    graphics.lineStyle(5, 0x000000, isMirror ? 0.44 : 0.72);
    graphics.strokeCircle(0, 0, this.coreRadius + BLACK_HOLE_LENS_FADE_BORDER_RADIUS_OFFSET);
    graphics.lineStyle(1, 0x1b2436, isMirror ? 0.16 : 0.28);
    graphics.strokeCircle(0, 0, this.coreRadius + BLACK_HOLE_LENS_FADE_BORDER_RADIUS_OFFSET + 2);
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

    for (let i = 0; i < this.activeLensingArcCount; i += 1) {
      const arc = this.lensingArcs[i];

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
      const stretch = 1 + inwardProgress * (arc.layer === 2 ? 1.1 : 0.7);
      const driftedAngle = arc.angle + Math.sin(time * 0.00023 + arc.pulsePhase) * 0.012;
      const radius = arc.radius + Math.sin(time * 0.00031 + arc.pulsePhase) * (1.5 + inwardProgress * 2.2);
      const brightness = 1 + Math.sin(time * BLACK_HOLE_VISUAL_PULSE_SPEED * 0.36 + arc.pulsePhase) * arc.pulseAmount;
      const alpha = arc.baseAlpha * fadeIn * fadeOut * mirrorAlpha * brightness * (foreground ? 0.76 : 1);
      const arcLength = arc.baseArcLength * stretch * this.lensLengthMultiplier;
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
