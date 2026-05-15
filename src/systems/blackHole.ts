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
const BLACK_HOLE_HORIZON_RIM_RADIUS_OFFSET = BLACK_HOLE_LENS_FADE_BORDER_RADIUS_OFFSET + 8;
const BLACK_HOLE_VISUAL_HORIZON_SCALE = 1.5;
const BLACK_HOLE_VISUAL_PULSE_SPEED = 0.0026;
const BLACK_HOLE_VISUAL_TWIRL_SPEED = 0.48;
export const BLACK_HOLE_FULL_TEXTURE_KEY = 'black-hole-full-lines';
export const BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEY = 'black-hole-event-horizon-lines';
export const BLACK_HOLE_FULL_TEXTURE_KEYS = [
  'black-hole-full-lines-1',
  'black-hole-full-lines-2',
  BLACK_HOLE_FULL_TEXTURE_KEY,
  'black-hole-full-lines-4',
  'black-hole-full-lines-5'
] as const;
export const BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS = [
  'black-hole-event-horizon-lines-1',
  'black-hole-event-horizon-lines-2',
  BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEY
] as const;
export const BLACK_HOLE_PNG_TEXTURE_KEYS = [
  ...BLACK_HOLE_FULL_TEXTURE_KEYS,
  ...BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS
] as const;
export const BLACK_HOLE_PNG_TEXTURE_LABELS: Record<BlackHolePngTextureKey, string> = {
  [BLACK_HOLE_FULL_TEXTURE_KEYS[0]]: 'full1',
  [BLACK_HOLE_FULL_TEXTURE_KEYS[1]]: 'full2',
  [BLACK_HOLE_FULL_TEXTURE_KEYS[2]]: 'full3',
  [BLACK_HOLE_FULL_TEXTURE_KEYS[3]]: 'full4',
  [BLACK_HOLE_FULL_TEXTURE_KEYS[4]]: 'full5',
  [BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[0]]: 'horizon1',
  [BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[1]]: 'horizon2',
  [BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[2]]: 'horizon3'
};
export const BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT = 450;
export const BLACK_HOLE_LENSING_ARC_MAX_COUNT = 700;
export const BLACK_HOLE_INFLUENCE_RADIUS = 760;
export const BLACK_HOLE_DAMAGE_RADIUS = BLACK_HOLE_INFLUENCE_RADIUS;
export const BLACK_HOLE_CAPTURE_RADIUS = 250;
export const BLACK_HOLE_EVENT_HORIZON_RADIUS = BLACK_HOLE_CORE_RADIUS;
export const BLACK_HOLE_PROJECTILE_INFLUENCE_RADIUS = BLACK_HOLE_INFLUENCE_RADIUS;
export const BLACK_HOLE_PROJECTILE_CAPTURE_RADIUS = BLACK_HOLE_CAPTURE_RADIUS;
export const BLACK_HOLE_PROJECTILE_CAPTURE_MIN_SCALE = 0.08;
export const BLACK_HOLE_PROJECTILE_CAPTURE_FADE_SECONDS = 1.65;
export const BLACK_HOLE_PROJECTILE_CAPTURE_CONSUME_RADIUS = BLACK_HOLE_EVENT_HORIZON_RADIUS;
const BLACK_HOLE_LENSING_ARC_COLORS = [0xffffff] as const;
const BLACK_HOLE_LENS_TEXTURE_SIZE = 1024;
const BLACK_HOLE_LENS_TEXTURE_DISPLAY_SIZE = 720;
const BLACK_HOLE_FIELD_RADIUS_MULTIPLIER_MIN = 1;
const BLACK_HOLE_FIELD_RADIUS_MULTIPLIER_MAX = 20;
const BLACK_HOLE_CORE_GROWTH_PER_SCALE = 0.08;
const BLACK_HOLE_BASE_LENS_FIELD_RADIUS = BLACK_HOLE_LENS_TEXTURE_DISPLAY_SIZE * 0.5;

export interface BlackHoleWhirlpoolTuning {
  radialBaseAcceleration: number;
  radialExtraAcceleration: number;
  swirlBaseAcceleration: number;
  swirlExtraAcceleration: number;
  maxSpeed: number;
  mass: number;
  massResistance: number;
}

export interface BlackHoleWhirlpoolSample {
  distance: number;
  proximity: number;
  isInsideInfluence: boolean;
  isInsideDamage: boolean;
  isInsideCapture: boolean;
  isInsideEventHorizon: boolean;
}

export interface BlackHoleWhirlpoolResult extends BlackHoleWhirlpoolSample {
  acceleration: Phaser.Math.Vector2;
}

const BLACK_HOLE_LENS_ARC_INNER_RADIUS = 0.025;
const BLACK_HOLE_LENS_ARC_OUTER_RADIUS = 1;
const BLACK_HOLE_LENS_ARC_RESET_RADIUS = 0.035;
const BLACK_HOLE_LENS_ARC_INNER_EDGE_COUNT = 18;
const BLACK_HOLE_LENS_ARC_INNER_EDGE_RADIUS_MIN = 0.07;
const BLACK_HOLE_LENS_ARC_INNER_EDGE_RADIUS_MAX = 0.22;
const BLACK_HOLE_LENS_ARC_SPAWN_RADIUS_MIN = 0.84;
const BLACK_HOLE_LENS_ARC_SPAWN_RADIUS_MAX = 0.985;
const BLACK_HOLE_LENS_ARC_INWARD_SPEED_MIN = 0.004;
const BLACK_HOLE_LENS_ARC_INWARD_SPEED_MAX = 0.014;
const BLACK_HOLE_LENS_ARC_ANGULAR_SPEED_MIN = 0.42;
const BLACK_HOLE_LENS_ARC_ANGULAR_SPEED_MAX = 1.35;
const BLACK_HOLE_LENS_ARC_LIFETIME_MIN = 86;
const BLACK_HOLE_LENS_ARC_LIFETIME_MAX = 160;
const BLACK_HOLE_LENS_ARC_ALPHA = 0.72;
const BLACK_HOLE_LENS_ARC_THICKNESS = 1.35;
const BLACK_HOLE_LENS_ARC_LENGTH = 0.18;
const BLACK_HOLE_LENS_ARC_SQUASH_MIN = 0.96;
const BLACK_HOLE_LENS_ARC_SQUASH_MAX = 1;

export type BlackHolePngTextureKey = (typeof BLACK_HOLE_PNG_TEXTURE_KEYS)[number];

interface BlackHoleLensingArc {
  angle: number;
  radius: number;
  arcLength: number;
  baseArcLength: number;
  thickness: number;
  baseAlpha: number;
  alpha: number;
  color: number;
  inwardSpeed: number;
  angularDriftSpeed: number;
  age: number;
  lifetime: number;
  pulsePhase: number;
  squash: number;
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
  scalePulse: number;
  scalePulseSpeed: number;
}

export interface BlackHolePngLayerConfig {
  textureKey: BlackHolePngTextureKey;
  speedRps: number;
  sizeMultiplier: number;
  alpha: number;
  enabled: boolean;
  initialRotation: number;
}

export interface BlackHolePngLayerDebugSummary extends BlackHolePngLayerConfig {
  index: number;
  textureLabel: string;
}

const BLACK_HOLE_LENS_TEXTURE_LAYERS: BlackHoleLensTextureLayer[] = [];
const BLACK_HOLE_DEFAULT_PNG_LAYERS: BlackHolePngLayerConfig[] = [
  { textureKey: BLACK_HOLE_FULL_TEXTURE_KEYS[0], speedRps: 0.18, alpha: 1, initialRotation: 0, sizeMultiplier: 0.96, enabled: true },
  { textureKey: BLACK_HOLE_FULL_TEXTURE_KEYS[1], speedRps: 0.24, alpha: 1, initialRotation: Math.PI * 0.18, sizeMultiplier: 1.03, enabled: true },
  { textureKey: BLACK_HOLE_FULL_TEXTURE_KEYS[2], speedRps: 0.31, alpha: 1, initialRotation: Math.PI * 0.37, sizeMultiplier: 1, enabled: true },
  { textureKey: BLACK_HOLE_FULL_TEXTURE_KEYS[3], speedRps: 0.38, alpha: 1, initialRotation: Math.PI * 0.53, sizeMultiplier: 1.07, enabled: true },
  { textureKey: BLACK_HOLE_FULL_TEXTURE_KEYS[4], speedRps: 0.46, alpha: 1, initialRotation: Math.PI * 0.71, sizeMultiplier: 0.91, enabled: true },
  { textureKey: BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[0], speedRps: 0.55, alpha: 1, initialRotation: Math.PI * 0.08, sizeMultiplier: 0.39, enabled: true },
  { textureKey: BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[1], speedRps: 0.72, alpha: 1, initialRotation: Math.PI * 0.34, sizeMultiplier: 0.43, enabled: true },
  { textureKey: BLACK_HOLE_EVENT_HORIZON_TEXTURE_KEYS[2], speedRps: 0.9, alpha: 1, initialRotation: Math.PI * 0.62, sizeMultiplier: 0.41, enabled: true }
];

export interface BlackHoleState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  coreRadius: number;
  warningRadius: number;
}

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
  maxSpeed: 1520,
  mass: 0.6,
  massResistance: 0.42
};

export class BlackHoleSystem {
  readonly body: Phaser.GameObjects.Container;
  readonly wrapMirrorBody: Phaser.GameObjects.Container;

  private readonly bodyGraphics: Phaser.GameObjects.Graphics;
  private readonly wrapMirrorGraphics: Phaser.GameObjects.Graphics;
  private readonly pngLayerImages: Phaser.GameObjects.Image[] = [];
  private readonly wrapMirrorPngLayerImages: Phaser.GameObjects.Image[] = [];
  private readonly lensTextureImages: Phaser.GameObjects.Image[];
  private readonly wrapMirrorLensTextureImages: Phaser.GameObjects.Image[];
  private readonly velocity: Phaser.Math.Vector2;
  private readonly lensingArcs: BlackHoleLensingArc[];
  private readonly pngLayers: BlackHolePngLayerConfig[];
  private activeLensingArcCount = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT;
  private lensLengthMultiplier = 1;
  private fieldRadiusMultiplier = 1;
  private visualPhase: number;

  constructor(private readonly scene: Phaser.Scene, arena: ArenaSize, center: Phaser.Math.Vector2) {
    const position = this.getSpawnPosition(arena, center);

    this.ensureLensTextureLayers();
    this.lensTextureImages = this.createLensTextureImages(false);
    this.wrapMirrorLensTextureImages = this.createLensTextureImages(true);
    this.pngLayers = BLACK_HOLE_DEFAULT_PNG_LAYERS.map((layer) => ({ ...layer }));
    this.bodyGraphics = scene.add.graphics();
    this.wrapMirrorGraphics = scene.add.graphics();
    this.body = scene.add
      .container(position.x, position.y, [
        ...this.lensTextureImages,
        this.bodyGraphics
      ])
      .setDepth(6);
    this.wrapMirrorBody = scene.add
      .container(position.x, position.y, [
        ...this.wrapMirrorLensTextureImages,
        this.wrapMirrorGraphics
      ])
      .setDepth(6);
    this.velocity = new Phaser.Math.Vector2(
      Math.cos(BLACK_HOLE_DRIFT_ANGLE) * BLACK_HOLE_DRIFT_SPEED,
      Math.sin(BLACK_HOLE_DRIFT_ANGLE) * BLACK_HOLE_DRIFT_SPEED
    );
    this.lensingArcs = this.createLensingArcs();
    this.visualPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.syncPngLayerImages();

    this.body.setSize(BLACK_HOLE_WARNING_RADIUS * 2, BLACK_HOLE_WARNING_RADIUS * 2);
    this.wrapMirrorBody.setSize(BLACK_HOLE_WARNING_RADIUS * 2, BLACK_HOLE_WARNING_RADIUS * 2);
    this.wrapMirrorBody.setVisible(false);
    this.draw(this.bodyGraphics, false, false);
    this.draw(this.wrapMirrorGraphics, true, false);
  }

  update(
    time: number,
    deltaSeconds: number,
    arena: ArenaSize,
    isDebugEnabled: boolean,
    lensOrbitSpeedMultiplier = 1,
    activeLensingArcCount = BLACK_HOLE_LENSING_ARC_DEFAULT_COUNT,
    lensLengthMultiplier = 1,
    areProjectionLensLayersEnabled = true,
    fieldRadiusMultiplier = 1,
    shouldMove = true
  ): void {
    this.activeLensingArcCount = Phaser.Math.Clamp(
      Math.round(activeLensingArcCount),
      0,
      BLACK_HOLE_LENSING_ARC_MAX_COUNT
    );
    this.fieldRadiusMultiplier = Phaser.Math.Clamp(
      fieldRadiusMultiplier,
      BLACK_HOLE_FIELD_RADIUS_MULTIPLIER_MIN,
      BLACK_HOLE_FIELD_RADIUS_MULTIPLIER_MAX
    );
    this.setLensLengthMultiplier(lensLengthMultiplier);
    if (shouldMove) {
      this.body.x = wrapCoordinate(this.body.x + this.velocity.x * deltaSeconds, arena.width);
      this.body.y = wrapCoordinate(this.body.y + this.velocity.y * deltaSeconds, arena.height);
    }
    this.body.setSize(this.warningRadius * 2, this.warningRadius * 2);
    this.wrapMirrorBody.setSize(this.warningRadius * 2, this.warningRadius * 2);
    this.visualPhase += BLACK_HOLE_VISUAL_TWIRL_SPEED * deltaSeconds;
    this.updateLensTextureImages(time, false, lensOrbitSpeedMultiplier, areProjectionLensLayersEnabled);
    this.updateLensTextureImages(time, true, lensOrbitSpeedMultiplier, areProjectionLensLayersEnabled);
    this.updateWhirlpoolImages(deltaSeconds, lensOrbitSpeedMultiplier, areProjectionLensLayersEnabled);
    this.draw(this.bodyGraphics, false, isDebugEnabled, time);
    this.draw(this.wrapMirrorGraphics, true, isDebugEnabled, time);
  }

  wouldConsumePlayer(playerX: number, playerY: number, arena: ArenaSize): boolean {
    const offset = this.getWrappedDirection(this.body.x, this.body.y, playerX, playerY, arena);

    return offset.lengthSq() <= this.eventHorizonRadius * this.eventHorizonRadius;
  }

  getWhirlpoolSample(x: number, y: number, arena: ArenaSize): BlackHoleWhirlpoolSample {
    const offset = this.getWrappedDirection(x, y, this.body.x, this.body.y, arena);
    const distance = offset.length();
    const influenceRadius = this.influenceRadius;
    const eventHorizonRadius = this.eventHorizonRadius;
    const proximity = Phaser.Math.Clamp(
      (influenceRadius - distance) / Math.max(1, influenceRadius - eventHorizonRadius),
      0,
      1
    );

    return {
      distance,
      proximity,
      isInsideInfluence: distance < influenceRadius,
      isInsideDamage: distance < this.damageRadius,
      isInsideCapture: distance <= this.captureRadius,
      isInsideEventHorizon: distance <= eventHorizonRadius
    };
  }

  computeWhirlpoolAcceleration(
    x: number,
    y: number,
    velocity: Phaser.Math.Vector2,
    tuning: BlackHoleWhirlpoolTuning,
    arena: ArenaSize
  ): BlackHoleWhirlpoolResult {
    const offset = this.getWrappedDirection(x, y, this.body.x, this.body.y, arena);
    const distance = offset.length();
    const sample = this.getWhirlpoolSample(x, y, arena);
    const acceleration = new Phaser.Math.Vector2(0, 0);

    if (distance <= 0 || !sample.isInsideInfluence) {
      return { ...sample, acceleration };
    }

    const inward = offset.scale(1 / distance);
    const tangent = new Phaser.Math.Vector2(-inward.y, inward.x);
    const orbitSign = velocity.lengthSq() > 0 && velocity.dot(tangent) < 0 ? -1 : 1;
    const curve = sample.proximity * sample.proximity;
    const massDivisor = 1 + Math.max(0, tuning.mass - 1) * tuning.massResistance;
    const radialAcceleration = (tuning.radialBaseAcceleration + curve * tuning.radialExtraAcceleration) / massDivisor;
    const tangentialAcceleration = (tuning.swirlBaseAcceleration + curve * tuning.swirlExtraAcceleration) / massDivisor;

    acceleration.set(
      inward.x * radialAcceleration + tangent.x * tangentialAcceleration * orbitSign,
      inward.y * radialAcceleration + tangent.y * tangentialAcceleration * orbitSign
    );

    return { ...sample, acceleration };
  }

  applyWhirlpoolToVelocity(
    x: number,
    y: number,
    velocity: Phaser.Math.Vector2,
    deltaSeconds: number,
    tuning: BlackHoleWhirlpoolTuning,
    arena: ArenaSize
  ): BlackHoleWhirlpoolResult {
    const result = this.computeWhirlpoolAcceleration(x, y, velocity, tuning, arena);

    if (result.acceleration.lengthSq() > 0) {
      velocity.x += result.acceleration.x * deltaSeconds;
      velocity.y += result.acceleration.y * deltaSeconds;
      velocity.limit(tuning.maxSpeed);
    }

    return result;
  }

  applyProjectileGravity(
    projectile: BlackHoleCapturableProjectile,
    deltaSeconds: number,
    arena: ArenaSize
  ): boolean {
    const tuning = {
      ...BLACK_HOLE_PROJECTILE_WHIRLPOOL_TUNING,
      maxSpeed: projectile.speed * 1.65
    };
    const result = this.applyWhirlpoolToVelocity(
      projectile.body.x,
      projectile.body.y,
      projectile.velocity,
      deltaSeconds,
      tuning,
      arena
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
    return BLACK_HOLE_CORE_RADIUS * this.coreVisualScale;
  }

  get warningRadius(): number {
    return BLACK_HOLE_WARNING_RADIUS * this.lensFieldScale;
  }

  get influenceRadius(): number {
    return BLACK_HOLE_INFLUENCE_RADIUS * this.fieldRadiusMultiplier;
  }

  get damageRadius(): number {
    return BLACK_HOLE_DAMAGE_RADIUS * this.fieldRadiusMultiplier;
  }

  get captureRadius(): number {
    return BLACK_HOLE_CAPTURE_RADIUS * (1 + (this.fieldRadiusMultiplier - 1) * 0.18);
  }

  get eventHorizonRadius(): number {
    return BLACK_HOLE_EVENT_HORIZON_RADIUS * this.coreVisualScale;
  }

  private get coreVisualScale(): number {
    return 1 + (Math.sqrt(this.fieldRadiusMultiplier) - 1) * BLACK_HOLE_CORE_GROWTH_PER_SCALE;
  }

  private get lensFieldScale(): number {
    return this.influenceRadius / BLACK_HOLE_BASE_LENS_FIELD_RADIUS;
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
      const denseBand = i % 7 === 0 ? 0.42 : i % 5 === 0 ? 0.26 : random.frac();
      const biasedProgress = Math.pow(random.frac() * 0.74 + denseBand * 0.26, 1.75);
      const radius = Phaser.Math.Linear(layer.minRadius, layer.maxRadius, biasedProgress);
      const angle = random.frac() * Math.PI * 2;
      const radialProgress = Phaser.Math.Clamp(
        (radius - layer.minRadius) / Math.max(1, layer.maxRadius - layer.minRadius),
        0,
        1
      );
      const innerDensity = Math.pow(1 - radialProgress, 1.45);
      const length = Phaser.Math.Linear(4, i % 11 === 0 ? 36 : 20, random.frac()) *
        Phaser.Math.Linear(0.42, 1.22, innerDensity) *
        this.lensLengthMultiplier;
      const thickness = Phaser.Math.Linear(0.35, i % 13 === 0 ? 1.45 : 0.9, random.frac()) *
        Phaser.Math.Linear(0.58, 1.18, innerDensity);
      const innerFade = Phaser.Math.Clamp((radius - layer.minRadius) / 54, 0, 1);
      const outerFade = Phaser.Math.Clamp((layer.maxRadius - radius) / 74, 0, 1);
      const alpha = Phaser.Math.Linear(0.035, i % 17 === 0 ? 0.62 : 0.24, random.frac()) *
        Phaser.Math.Linear(0.35, 1.2, innerDensity) *
        innerFade *
        outerFade;
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
      const halfLength = length * (1.08 - radialProgress * 0.34) * 0.5;

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

  getPngLayerCount(): number {
    return this.pngLayers.length;
  }

  getPngLayerSummary(index: number): BlackHolePngLayerDebugSummary | undefined {
    const layer = this.pngLayers[index];

    if (!layer) {
      return undefined;
    }

    return {
      ...layer,
      index,
      textureLabel: BLACK_HOLE_PNG_TEXTURE_LABELS[layer.textureKey]
    };
  }

  getPngLayerSummaries(): BlackHolePngLayerDebugSummary[] {
    return this.pngLayers.map((_, index) => this.getPngLayerSummary(index)).filter((layer): layer is BlackHolePngLayerDebugSummary => Boolean(layer));
  }

  adjustPngLayerSpeed(index: number, deltaRps: number): void {
    const layer = this.pngLayers[index];

    if (!layer) {
      return;
    }

    layer.speedRps = Number(Phaser.Math.Clamp(layer.speedRps + deltaRps, 0, 5).toFixed(2));
  }

  adjustPngLayerSize(index: number, delta: number): void {
    const layer = this.pngLayers[index];

    if (!layer) {
      return;
    }

    layer.sizeMultiplier = Number(Phaser.Math.Clamp(layer.sizeMultiplier + delta, 0.05, 3).toFixed(2));
  }

  adjustPngLayerAlpha(index: number, delta: number): void {
    const layer = this.pngLayers[index];

    if (!layer) {
      return;
    }

    layer.alpha = Number(Phaser.Math.Clamp(layer.alpha + delta, 0, 1).toFixed(2));
  }

  cyclePngLayerTexture(index: number, direction: number): void {
    const layer = this.pngLayers[index];

    if (!layer) {
      return;
    }

    const textureIndex = BLACK_HOLE_PNG_TEXTURE_KEYS.indexOf(layer.textureKey);
    const nextIndex = Phaser.Math.Wrap(textureIndex + direction, 0, BLACK_HOLE_PNG_TEXTURE_KEYS.length);
    layer.textureKey = BLACK_HOLE_PNG_TEXTURE_KEYS[nextIndex];
    this.replacePngLayerImage(index, false);
    this.replacePngLayerImage(index, true);
  }

  togglePngLayer(index: number): void {
    const layer = this.pngLayers[index];

    if (layer) {
      layer.enabled = !layer.enabled;
    }
  }

  addPngLayer(textureKey: BlackHolePngTextureKey = BLACK_HOLE_PNG_TEXTURE_KEYS[0]): number {
    this.pngLayers.push({
      textureKey,
      speedRps: 0.25,
      sizeMultiplier: 1,
      alpha: 1,
      enabled: true,
      initialRotation: Phaser.Math.FloatBetween(0, Math.PI * 2)
    });
    this.syncPngLayerImages();

    return this.pngLayers.length - 1;
  }

  duplicatePngLayer(index: number): number {
    const layer = this.pngLayers[index];

    if (!layer) {
      return this.addPngLayer();
    }

    this.pngLayers.splice(index + 1, 0, {
      ...layer,
      initialRotation: layer.initialRotation + Math.PI * 0.13
    });
    this.syncPngLayerImages();

    return index + 1;
  }

  removePngLayer(index: number): number {
    if (!this.pngLayers[index]) {
      return Phaser.Math.Clamp(index, 0, Math.max(0, this.pngLayers.length - 1));
    }

    this.pngLayers.splice(index, 1);
    this.syncPngLayerImages();

    return Phaser.Math.Clamp(index, 0, this.pngLayers.length - 1);
  }

  resetPngLayers(): void {
    this.pngLayers.splice(0, this.pngLayers.length, ...BLACK_HOLE_DEFAULT_PNG_LAYERS.map((layer) => ({ ...layer })));
    this.syncPngLayerImages();
  }

  private syncPngLayerImages(): void {
    this.syncPngLayerImageGroup(false);
    this.syncPngLayerImageGroup(true);
  }

  private syncPngLayerImageGroup(isMirror: boolean): void {
    const images = isMirror ? this.wrapMirrorPngLayerImages : this.pngLayerImages;
    const container = isMirror ? this.wrapMirrorBody : this.body;
    const graphics = isMirror ? this.wrapMirrorGraphics : this.bodyGraphics;

    while (images.length > this.pngLayers.length) {
      images.pop()?.destroy();
    }

    while (images.length < this.pngLayers.length) {
      const layer = this.pngLayers[images.length];
      const image = this.createPngLayerImage(layer, isMirror);
      const graphicsIndex = container.getIndex(graphics);

      images.push(image);
      container.addAt(image, Math.max(0, graphicsIndex));
    }

    for (let i = 0; i < images.length; i += 1) {
      const layer = this.pngLayers[i];
      const image = images[i];

      if (image.texture.key !== layer.textureKey) {
        image.setTexture(layer.textureKey);
      }

      image
        .setRotation(layer.initialRotation)
        .setAlpha(layer.alpha * (isMirror ? 0.56 : 1))
        .setVisible(layer.enabled);
    }
  }

  private replacePngLayerImage(index: number, isMirror: boolean): void {
    const images = isMirror ? this.wrapMirrorPngLayerImages : this.pngLayerImages;
    const layer = this.pngLayers[index];
    const image = images[index];

    if (layer && image) {
      image.setTexture(layer.textureKey);
    }
  }

  private createPngLayerImage(layer: BlackHolePngLayerConfig, isMirror: boolean): Phaser.GameObjects.Image {
    return this.scene.add
      .image(0, 0, layer.textureKey)
      .setOrigin(0.5)
      .setRotation(layer.initialRotation)
      .setAlpha(layer.alpha * (isMirror ? 0.56 : 1))
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  private updateWhirlpoolImages(
    deltaSeconds: number,
    lensOrbitSpeedMultiplier: number,
    areLayersEnabled: boolean
  ): void {
    const fullDisplaySize = this.influenceRadius * 2 * this.lensLengthMultiplier;

    this.updateWhirlpoolImageGroup(this.pngLayerImages, fullDisplaySize, deltaSeconds, lensOrbitSpeedMultiplier, areLayersEnabled, false);
    this.updateWhirlpoolImageGroup(this.wrapMirrorPngLayerImages, fullDisplaySize, deltaSeconds, lensOrbitSpeedMultiplier, areLayersEnabled, true);
  }

  private updateWhirlpoolImageGroup(
    images: Phaser.GameObjects.Image[],
    displaySize: number,
    deltaSeconds: number,
    lensOrbitSpeedMultiplier: number,
    areLayersEnabled: boolean,
    isMirror: boolean
  ): void {
    for (let i = 0; i < images.length; i += 1) {
      const image = images[i];
      const layer = this.pngLayers[i];
      const rotation = Math.PI * 2 * layer.speedRps * lensOrbitSpeedMultiplier * deltaSeconds;
      const layerDisplaySize = displaySize * layer.sizeMultiplier;

      image
        .setDisplaySize(layerDisplaySize, layerDisplaySize)
        .setRotation(image.rotation + rotation)
        .setAlpha(layer.alpha * (isMirror ? 0.56 : 1))
        .setVisible(areLayersEnabled && layer.enabled);
    }
  }

  private updateLensTextureImages(
    time: number,
    isMirror: boolean,
    _lensOrbitSpeedMultiplier: number,
    areProjectionLensLayersEnabled: boolean
  ): void {
    const images = isMirror ? this.wrapMirrorLensTextureImages : this.lensTextureImages;

    for (let i = 0; i < images.length; i += 1) {
      const image = images[i];
      const layer = BLACK_HOLE_LENS_TEXTURE_LAYERS[i];
      const scalePulse = 1 + Math.sin(time * 0.001 * layer.scalePulseSpeed + i * 1.7) * layer.scalePulse;
      const isVisible = !layer.isProjectionLayer || areProjectionLensLayersEnabled;

      image.setRotation(0);
      image.setScale((BLACK_HOLE_LENS_TEXTURE_DISPLAY_SIZE / BLACK_HOLE_LENS_TEXTURE_SIZE) * scalePulse * this.lensFieldScale);
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
      this.createLensingArc(index, false)
    );
  }

  private createLensingArc(index: number, startAtOuter: boolean): BlackHoleLensingArc {
    const isDenseBandArc = index % 5 === 0;
    const isInnerEdgeArc = index < BLACK_HOLE_LENS_ARC_INNER_EDGE_COUNT;
    const clusterOffset = isDenseBandArc ? Phaser.Math.FloatBetween(-0.16, 0.16) : Phaser.Math.FloatBetween(-0.32, 0.32);
    const baseAngle = isDenseBandArc
      ? Math.PI * 0.08 + clusterOffset
      : index * 2.399963229728653 + Phaser.Math.FloatBetween(-0.26, 0.26);
    const radius = isInnerEdgeArc
      ? Phaser.Math.FloatBetween(BLACK_HOLE_LENS_ARC_INNER_EDGE_RADIUS_MIN, BLACK_HOLE_LENS_ARC_INNER_EDGE_RADIUS_MAX)
      : startAtOuter
        ? Phaser.Math.FloatBetween(BLACK_HOLE_LENS_ARC_SPAWN_RADIUS_MIN, BLACK_HOLE_LENS_ARC_SPAWN_RADIUS_MAX)
        : Phaser.Math.Linear(
            BLACK_HOLE_LENS_ARC_INNER_RADIUS,
            BLACK_HOLE_LENS_ARC_OUTER_RADIUS,
            Math.pow(Phaser.Math.FloatBetween(0, 1), 2.15)
          );
    const proximity = 1 - radius;
    const baseAlpha = BLACK_HOLE_LENS_ARC_ALPHA;

    return {
      angle: baseAngle,
      radius,
      arcLength: BLACK_HOLE_LENS_ARC_LENGTH,
      baseArcLength: BLACK_HOLE_LENS_ARC_LENGTH,
      thickness: BLACK_HOLE_LENS_ARC_THICKNESS,
      baseAlpha,
      alpha: baseAlpha,
      color: BLACK_HOLE_LENSING_ARC_COLORS[Phaser.Math.Between(0, BLACK_HOLE_LENSING_ARC_COLORS.length - 1)],
      inwardSpeed: Phaser.Math.Linear(
        BLACK_HOLE_LENS_ARC_INWARD_SPEED_MIN,
        BLACK_HOLE_LENS_ARC_INWARD_SPEED_MAX,
        Phaser.Math.Clamp(radius, 0, 1)
      ) * Phaser.Math.FloatBetween(0.94, 1.06),
      angularDriftSpeed: Phaser.Math.Linear(
        BLACK_HOLE_LENS_ARC_ANGULAR_SPEED_MIN,
        BLACK_HOLE_LENS_ARC_ANGULAR_SPEED_MAX,
        Math.pow(proximity, 0.82)
      ) * Phaser.Math.FloatBetween(0.94, 1.06),
      age: startAtOuter ? 0 : Phaser.Math.FloatBetween(0, BLACK_HOLE_LENS_ARC_LIFETIME_MAX * 0.7),
      lifetime: Phaser.Math.FloatBetween(BLACK_HOLE_LENS_ARC_LIFETIME_MIN, BLACK_HOLE_LENS_ARC_LIFETIME_MAX),
      pulsePhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      squash: Phaser.Math.Linear(
        BLACK_HOLE_LENS_ARC_SQUASH_MIN,
        BLACK_HOLE_LENS_ARC_SQUASH_MAX,
        Phaser.Math.FloatBetween(0, 1)
      )
    };
  }

  private updateLensingArcs(deltaSeconds: number, lensOrbitSpeedMultiplier: number): void {
    const orbitMultiplier = Math.max(0, lensOrbitSpeedMultiplier);

    for (let i = 0; i < this.activeLensingArcCount; i += 1) {
      const arc = this.lensingArcs[i];
      const isInnerEdgeArc = i < BLACK_HOLE_LENS_ARC_INNER_EDGE_COUNT;
      const proximity = Phaser.Math.Clamp(1 - arc.radius, 0, 1);

      arc.age += deltaSeconds;
      arc.angle += arc.angularDriftSpeed * (0.92 + proximity * 1.28) * orbitMultiplier * deltaSeconds;

      if (isInnerEdgeArc) {
        arc.radius = Phaser.Math.Clamp(
          arc.radius,
          BLACK_HOLE_LENS_ARC_INNER_EDGE_RADIUS_MIN,
          BLACK_HOLE_LENS_ARC_INNER_EDGE_RADIUS_MAX
        );
        continue;
      }

      arc.radius -= arc.inwardSpeed * Phaser.Math.Linear(1, 0.18, Math.pow(proximity, 1.15)) * deltaSeconds;

      if (arc.radius <= BLACK_HOLE_LENS_ARC_RESET_RADIUS) {
        this.lensingArcs[i] = this.createLensingArc(i, true);
      }
    }
  }

  private draw(
    graphics: Phaser.GameObjects.Graphics,
    isMirror: boolean,
    isDebugEnabled: boolean,
    time = this.scene.time.now
  ): void {
    const pulse = 0.5 + Math.sin(time * BLACK_HOLE_VISUAL_PULSE_SPEED + this.visualPhase) * 0.5;
    const bodyAlpha = isMirror ? 0.56 : 0.82;
    const coreAlpha = isMirror ? 0.84 : 1;

    graphics.clear();
    graphics.fillStyle(0x000006, isMirror ? 0.11 : 0.18);
    graphics.fillCircle(0, 0, this.warningRadius);

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

    this.drawEventHorizonMask(graphics, isMirror);
  }

  private drawEventHorizonMask(graphics: Phaser.GameObjects.Graphics, isMirror: boolean): void {
    const radius = (this.coreRadius + BLACK_HOLE_HORIZON_RIM_RADIUS_OFFSET) * BLACK_HOLE_VISUAL_HORIZON_SCALE;

    graphics.fillStyle(0x000000, isMirror ? 0.86 : 1);
    graphics.fillCircle(0, 0, radius);
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
      const fadeIn = Phaser.Math.Clamp((arc.radius - BLACK_HOLE_LENS_ARC_INNER_RADIUS) / 0.035, 0, 1);
      const edgeFade = Phaser.Math.Clamp((BLACK_HOLE_LENS_ARC_OUTER_RADIUS - arc.radius) / 0.045, 0, 1);
      const driftedAngle = arc.angle + Math.sin(time * 0.00023 + arc.pulsePhase) * 0.012;
      const alpha = arc.baseAlpha * fadeIn * edgeFade * mirrorAlpha * (foreground ? 0.9 : 1);
      const radius = this.getLensingRenderRadius(
        arc.radius + (Math.sin(time * 0.00031 + arc.pulsePhase) * 0.7) / BLACK_HOLE_BASE_LENS_FIELD_RADIUS
      );
      const arcLength = arc.baseArcLength * Math.sqrt(this.lensLengthMultiplier);

      arc.alpha = alpha;
      arc.arcLength = arcLength;

      this.drawLensingOrbitArc(graphics, arc, driftedAngle, arcLength, radius, alpha, foreground);
    }
  }

  private drawLensingOrbitArc(
    graphics: Phaser.GameObjects.Graphics,
    arc: BlackHoleLensingArc,
    centerAngle: number,
    arcLength: number,
    radius: number,
    alpha: number,
    foreground: boolean
  ): void {
    const segments = 6;
    const startAngle = centerAngle - arcLength * 0.5;
    let previous = this.getLensingArcPoint(startAngle, radius, arc.squash);

    for (let i = 1; i <= segments; i += 1) {
      const segmentProgress = i / segments;
      const angle = startAngle + arcLength * segmentProgress;
      const point = this.getLensingArcPoint(angle, radius, arc.squash);
      const midY = (previous.y + point.y) * 0.5;
      const isFrontSegment = midY >= -this.coreRadius * 0.08;

      if (isFrontSegment === foreground) {
        graphics.lineStyle(arc.thickness, arc.color, alpha);
        graphics.lineBetween(previous.x, previous.y, point.x, point.y);
      }

      previous = point;
    }
  }

  private getLensingArcPoint(angle: number, radius: number, squash: number): { x: number; y: number } {
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * squash
    };
  }

  private getLensingRenderRadius(normalizedRadius: number): number {
    return Phaser.Math.Linear(this.coreRadius + 28, this.influenceRadius, Phaser.Math.Clamp(normalizedRadius, 0, 1));
  }

}
