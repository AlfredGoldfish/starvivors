import Phaser from 'phaser';
import {
  ASTEROID_TIER_CONFIG,
  ASTEROID_TIERS
} from '../scenes/gameConstants';
import type { AsteroidTier } from '../scenes/gameTypes';
import {
  OBJECT_SOURCE_DIAMETER_PX,
  createObjectSizeProfileFromCollisionRadius,
  resolveObjectSizeProfile,
  type ObjectSizeProfile,
  type ResolvedObjectSizeProfile
} from '../data/objectSizeProfile';

const ASTEROID_TEXTURE_PREFIX = 'monochrome-asteroid';
export const ASTEROID_FAMILY_COUNT = 12;
export const ASTEROID_VISUAL_FAMILIES = Array.from({ length: ASTEROID_FAMILY_COUNT }, (_, family) => family);
const WHITE = 0xffffff;
const BLACK = 0x000000;

export interface AsteroidVisualCrack {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface AsteroidVisualRecipe {
  tier: AsteroidTier;
  family: number;
  points: Array<[number, number]>;
  cracks: AsteroidVisualCrack[];
  baseRadius: number;
  strokeWidth: number;
}

export function createAsteroidSizeProfile(tier: AsteroidTier, id = `asteroid-tier-${tier}`): ObjectSizeProfile {
  return createObjectSizeProfileFromCollisionRadius({
    kind: 'asteroid',
    id,
    collisionRadiusPx: ASTEROID_TIER_CONFIG[tier].hitRadius,
    strokeWidthPx: getAsteroidStrokeWidth(tier)
  });
}

export function resolveAsteroidObjectSizeProfile(tier: AsteroidTier, id = `asteroid-tier-${tier}`): ResolvedObjectSizeProfile {
  return resolveObjectSizeProfile(createAsteroidSizeProfile(tier, id));
}

export function getMonochromeAsteroidTextureKey(tier: AsteroidTier, family: number): string {
  return `${ASTEROID_TEXTURE_PREFIX}-tier-${tier}-family-${normalizeAsteroidFamily(family)}`;
}

export function getAsteroidFamilyForSpawn(tier: AsteroidTier, x: number, y: number): number {
  const hash = Math.abs(hashString(`${tier}:${Math.round(x)}:${Math.round(y)}`));
  return hash % ASTEROID_FAMILY_COUNT;
}

export function createMonochromeAsteroidTextures(scene: Phaser.Scene): void {
  for (const tier of ASTEROID_TIERS) {
    for (const family of ASTEROID_VISUAL_FAMILIES) {
      createMonochromeAsteroidTexture(scene, tier, family);
    }
  }
}

export function createMonochromeAsteroidTexture(scene: Phaser.Scene, tier: AsteroidTier, family: number): void {
  const textureKey = getMonochromeAsteroidTextureKey(tier, family);
  if (scene.textures.exists(textureKey)) {
    return;
  }

  const size = resolveAsteroidObjectSizeProfile(tier);
  const canvasSize = size.sourceDiameterPx;
  const texture = scene.textures.createCanvas(textureKey, canvasSize, canvasSize);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  const center = canvasSize / 2;
  const recipe = createAsteroidVisualRecipe(tier, family, canvasSize, size.runtimeScale, size.strokeWidthPx ?? getAsteroidStrokeWidth(tier));

  context.clearRect(0, 0, canvasSize, canvasSize);
  context.save();
  context.translate(center, center);
  context.lineJoin = 'miter';
  context.lineCap = 'square';
  context.miterLimit = 2.8;
  context.fillStyle = colorToHex(BLACK);
  context.strokeStyle = colorToHex(WHITE);
  context.lineWidth = recipe.strokeWidth;
  drawPolygon(context, recipe.points);

  context.lineWidth = Math.max(1, recipe.strokeWidth * 0.56);
  for (const crack of recipe.cracks) {
    drawLine(context, crack.fromX, crack.fromY, crack.toX, crack.toY);
  }

  context.restore();
  texture.refresh();
}

export function createAsteroidVisualRecipe(
  tier: AsteroidTier,
  family: number,
  canvasSize = OBJECT_SOURCE_DIAMETER_PX,
  runtimeScale = 1,
  strokeWidthPx = getAsteroidStrokeWidth(tier)
): AsteroidVisualRecipe {
  const normalizedFamily = normalizeAsteroidFamily(family);
  const random = createSeededRandom(hashString(`asteroid:${tier}:${normalizedFamily}`));
  const baseRadius = canvasSize * randomRange(random, 0.37, 0.45);
  const vertexCount = randomInt(random, 8, 15);
  const strokeWidth = Math.max(1, strokeWidthPx / Math.max(0.01, runtimeScale));
  const points: Array<[number, number]> = [];

  for (let index = 0; index < vertexCount; index += 1) {
    const angle = (Math.PI * 2 * index) / vertexCount + randomRange(random, -0.11, 0.11);
    const radius = baseRadius * randomRange(random, 0.7, 1.1);
    points.push([roundRecipeNumber(Math.cos(angle) * radius), roundRecipeNumber(Math.sin(angle) * radius)]);
  }

  const crackCount = randomInt(random, 2, 5);
  const cracks: AsteroidVisualCrack[] = [];
  for (let index = 0; index < crackCount; index += 1) {
    const angle = randomRange(random, 0, Math.PI * 2);
    const startRadius = baseRadius * randomRange(random, 0.08, 0.34);
    const endRadius = baseRadius * randomRange(random, 0.42, 0.76);
    const forkAngle = angle + randomRange(random, -0.34, 0.34);
    cracks.push({
      fromX: roundRecipeNumber(Math.cos(angle) * startRadius),
      fromY: roundRecipeNumber(Math.sin(angle) * startRadius),
      toX: roundRecipeNumber(Math.cos(forkAngle) * endRadius),
      toY: roundRecipeNumber(Math.sin(forkAngle) * endRadius)
    });
  }

  return {
    tier,
    family: normalizedFamily,
    points,
    cracks,
    baseRadius: roundRecipeNumber(baseRadius),
    strokeWidth: roundRecipeNumber(strokeWidth)
  };
}

export function normalizeAsteroidFamily(family: number): number {
  return Math.abs(Math.trunc(family)) % ASTEROID_FAMILY_COUNT;
}

function getAsteroidStrokeWidth(tier: AsteroidTier): number {
  return tier >= 7 ? 2.6 : tier >= 4 ? 2.2 : 1.8;
}

function drawPolygon(context: CanvasRenderingContext2D, points: Array<[number, number]>): void {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index][0], points[index][1]);
  }
  context.closePath();
  context.fill();
  context.stroke();
}

function drawLine(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number): void {
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function createSeededRandom(seed: number): () => number {
  let state = Math.abs(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomRange(random: () => number, min: number, max: number): number {
  return min + (max - min) * random();
}

function randomInt(random: () => number, minInclusive: number, maxExclusive: number): number {
  return Math.floor(randomRange(random, minInclusive, maxExclusive));
}

function roundRecipeNumber(value: number): number {
  return Math.round(value * 1000) / 1000;
}
