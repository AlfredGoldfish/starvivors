import Phaser from 'phaser';
import type { EnemyEffectRecipeEntry } from '../data/enemyLabDefinitions';
import { normalizeEnemyEffectEntry, type NormalizedEnemyEffectRecipeEntry } from './enemyVectorRecipes';

export type EnemyLabReadabilityMode = 'normal' | 'color-safe' | 'high-contrast';

export interface EnemyLabEffectRuntimeOptions extends Partial<EnemyEffectRecipeEntry> {
  reducedEffects?: boolean;
  readabilityMode?: EnemyLabReadabilityMode;
  depth?: number;
}

export function resolveEnemyLabEffectColor(color: number, mode: EnemyLabReadabilityMode): number {
  if (mode === 'high-contrast') {
    return color === 0xffffff ? 0xffd166 : 0xffffff;
  }

  if (mode === 'color-safe') {
    const red = (color >> 16) & 255;
    const green = (color >> 8) & 255;
    const blue = color & 255;
    if (red > green + blue * 0.35) {
      return 0xffd166;
    }
    if (green > red && green > blue) {
      return 0x66e6a3;
    }
    return 0x73f2ff;
  }

  return color;
}

export function emitEffectRingPulse(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const ring = scene.add.circle(x, y, Math.max(4, effect.radius * 0.18), color, 0.03);
  ring.setStrokeStyle(Math.max(1, 2.2 * effect.intensity), color, 0.72);
  ring.setDepth(options.depth ?? 12);
  ring.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: ring,
    radius: effect.radius,
    alpha: 0,
    duration: effect.durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy()
  });
}

export function emitEffectLineSweep(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: Phaser.Math.Vector2,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const normalized = direction.lengthSq() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(0, -1);
  const right = new Phaser.Math.Vector2(-normalized.y, normalized.x);
  const halfLength = effect.length * 0.5;
  const line = scene.add.line(
    0,
    0,
    x - right.x * halfLength,
    y - right.y * halfLength,
    x + right.x * halfLength,
    y + right.y * halfLength,
    color,
    0.64
  );
  line.setOrigin(0, 0);
  line.setStrokeStyle(Math.max(1, 2 * effect.intensity), color, 0.64);
  line.setDepth(options.depth ?? 12);
  line.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: line,
    x: normalized.x * effect.length * 0.35,
    y: normalized.y * effect.length * 0.35,
    alpha: 0,
    duration: effect.durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => line.destroy()
  });
}

export function emitEffectWarningBeam(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: Phaser.Math.Vector2,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const normalized = direction.lengthSq() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(0, -1);
  const beam = scene.add.line(0, 0, x, y, x + normalized.x * effect.length, y + normalized.y * effect.length, color, 0.56);
  beam.setOrigin(0, 0);
  beam.setStrokeStyle(Math.max(1, 2.4 * effect.intensity), color, 0.6);
  beam.setDepth(options.depth ?? 11);
  beam.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: beam,
    alpha: 0.08,
    duration: effect.durationMs,
    yoyo: true,
    repeat: options.reducedEffects ? 0 : 1,
    ease: 'Sine.easeInOut',
    onComplete: () => beam.destroy()
  });
}

export function emitEffectWarningRadius(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const circle = scene.add.circle(x, y, effect.radius * 0.92, color, 0.035);
  circle.setStrokeStyle(Math.max(1.5, 3 * effect.intensity), color, 0.62);
  circle.setDepth(options.depth ?? 10);
  circle.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: circle,
    scale: 1.08,
    alpha: 0,
    duration: effect.durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => circle.destroy()
  });
}

export function emitEffectSupportAura(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const aura = scene.add.circle(x, y, effect.radius, color, 0.025);
  aura.setStrokeStyle(Math.max(1, 2 * effect.intensity), color, 0.42);
  aura.setDepth(options.depth ?? 9);
  aura.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: aura,
    alpha: 0,
    scale: 1.16,
    duration: effect.durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => aura.destroy()
  });
}

export function emitEffectTrailTick(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: Phaser.Math.Vector2,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const normalized = direction.lengthSq() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(0, 1);
  const length = effect.length * effect.intensity;
  const line = scene.add.line(0, 0, x, y, x - normalized.x * length, y - normalized.y * length, color, 0.5);
  line.setOrigin(0, 0);
  line.setStrokeStyle(Math.max(1, 1.6 * effect.intensity), color, 0.48);
  line.setDepth(options.depth ?? 7);
  line.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: line,
    alpha: 0,
    duration: effect.durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => line.destroy()
  });
}

export function emitEffectSparkBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const count = Math.max(2, Math.round((options.reducedEffects ? 4 : 7) * effect.intensity));

  for (let index = 0; index < count; index += 1) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.FloatBetween(effect.radius * 0.24, effect.radius);
    const spark = scene.add.line(0, 0, x, y, x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, color, 0.76);
    spark.setOrigin(0, 0);
    spark.setStrokeStyle(Math.max(1, 1.5 * effect.intensity), color, 0.76);
    spark.setDepth(options.depth ?? 12);
    spark.setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: spark,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      alpha: 0,
      duration: effect.durationMs,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy()
    });
  }
}

export function emitEffectShardBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const count = Math.max(3, Math.round((options.reducedEffects ? 5 : 10) * effect.intensity));
  emitEffectRingPulse(scene, x, y, { ...options, color, radius: effect.radius * 0.68, durationMs: effect.durationMs });

  for (let index = 0; index < count; index += 1) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.FloatBetween(effect.radius * 0.34, effect.radius);
    const shard = scene.add.triangle(
      x,
      y,
      0,
      -5,
      4,
      5,
      -4,
      5,
      color,
      0.08
    );
    shard.setStrokeStyle(1, color, 0.7);
    shard.setDepth(options.depth ?? 12);
    shard.setBlendMode(Phaser.BlendModes.ADD);
    shard.setRotation(angle);
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0.35,
      duration: effect.durationMs,
      ease: 'Quad.easeOut',
      onComplete: () => shard.destroy()
    });
  }
}

export function emitEffectMuzzleFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: Phaser.Math.Vector2,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const normalized = direction.lengthSq() > 0 ? direction.clone().normalize() : new Phaser.Math.Vector2(0, -1);
  const flash = scene.add.triangle(
    x,
    y,
    0,
    -effect.radius,
    effect.radius * 0.55,
    effect.radius * 0.45,
    -effect.radius * 0.55,
    effect.radius * 0.45,
    color,
    0.12
  );
  flash.setStrokeStyle(Math.max(1, 1.4 * effect.intensity), color, 0.78);
  flash.setRotation(Math.atan2(normalized.x, -normalized.y));
  flash.setDepth(options.depth ?? 12);
  flash.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scale: 1.4,
    duration: effect.durationMs,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy()
  });
}

export function emitEffectOutlineFlash(
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Container,
  options: EnemyLabEffectRuntimeOptions = {}
): void {
  const effect = normalizeEffect(options);
  const color = resolveEnemyLabEffectColor(effect.color, options.readabilityMode ?? 'normal');
  const image = body.getData('visualImage') as Phaser.GameObjects.Image | undefined;

  if (!image) {
    return;
  }

  image.setTint(color);
  image.setAlpha(1);
  scene.time.delayedCall(effect.durationMs, () => {
    if (!image.scene) {
      return;
    }
    image.clearTint();
  });
}

function normalizeEffect(options: EnemyLabEffectRuntimeOptions): NormalizedEnemyEffectRecipeEntry {
  return normalizeEnemyEffectEntry({
    kind: options.kind ?? 'spark-burst',
    color: options.color,
    durationMs: options.durationMs,
    radius: options.radius,
    length: options.length,
    intensity: options.intensity
  }, options.reducedEffects);
}
