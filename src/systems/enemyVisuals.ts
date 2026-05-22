import Phaser from 'phaser';
import type { EnemyLabDefinition, EnemyVisualDefinition } from '../data/enemyLabDefinitions';
import { convertEnemyVisualDefinitionToForgeAsset, createForgeAssetTexture } from './assetForge';

export const ENEMY_LAB_TEXTURE_PREFIX = 'enemy-lab-visual';

export function getEnemyLabTextureKey(definitionId: string): string {
  return `${ENEMY_LAB_TEXTURE_PREFIX}-${definitionId}`;
}

export function createEnemyLabVisualTextures(scene: Phaser.Scene, definitions: EnemyLabDefinition[]): void {
  for (const definition of definitions) {
    createEnemyLabVisualTexture(scene, definition);
  }
}

export function createEnemyLabVisualContainer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  definition: EnemyLabDefinition
): Phaser.GameObjects.Container {
  const scaleX = definition.visual.scaleX ?? 1;
  const scaleY = definition.visual.scaleY ?? 1;
  const glowScale = definition.visual.glowScale ?? 1;
  const visualWidth = definition.visual.size * scaleX;
  const visualHeight = definition.visual.size * scaleY;
  const glow = scene.add.ellipse(
    0,
    0,
    visualWidth * 1.55 * glowScale,
    visualHeight * 1.55 * glowScale,
    definition.visual.glowColor,
    0.18
  );
  glow.setBlendMode(Phaser.BlendModes.ADD);

  const image = scene.add.image(0, 0, getEnemyLabTextureKey(definition.id));
  image.setOrigin(0.5);
  image.setDisplaySize(visualWidth, visualHeight);
  image.setRotation(definition.visual.rotationOffset ?? 0);

  const core = definition.visual.hasCore
    ? scene.add.ellipse(0, 0, visualWidth * 0.22, visualHeight * 0.22, definition.visual.accentColor, 0.82)
    : undefined;

  const container = scene.add.container(x, y, core ? [glow, image, core] : [glow, image]);
  container.setDepth(9);
  container.setSize(visualWidth, visualHeight);
  container.setData('visualImage', image);
  container.setData('visualGlow', glow);
  if (core) {
    core.setBlendMode(Phaser.BlendModes.ADD);
    container.setData('visualCore', core);
  }

  return container;
}

function createEnemyLabVisualTexture(scene: Phaser.Scene, definition: EnemyLabDefinition): void {
  const definitionId = definition.id;
  const visual = definition.visual;
  const textureKey = getEnemyLabTextureKey(definitionId);
  if (scene.textures.exists(textureKey)) {
    return;
  }

  createForgeAssetTexture(scene, convertEnemyVisualDefinitionToForgeAsset(definition), textureKey);
  if (scene.textures.exists(textureKey)) {
    return;
  }

  const canvasSize = Math.ceil(visual.size * 2.2);
  const texture = scene.textures.createCanvas(textureKey, canvasSize, canvasSize);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  const center = canvasSize / 2;
  const radius = visual.size * 0.46;

  context.clearRect(0, 0, canvasSize, canvasSize);
  context.save();
  context.translate(center, center);
  context.lineJoin = 'round';
  context.lineCap = 'round';

  drawGlow(context, visual, radius);
  drawHull(context, visual, radius);
  drawAccents(context, visual, radius);

  context.restore();
  texture.refresh();
}

function drawGlow(context: CanvasRenderingContext2D, visual: EnemyVisualDefinition, radius: number): void {
  const gradient = context.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.25);
  gradient.addColorStop(0, colorToRgba(visual.glowColor, 0.24));
  gradient.addColorStop(1, colorToRgba(visual.glowColor, 0));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
  context.fill();
}

function drawHull(context: CanvasRenderingContext2D, visual: EnemyVisualDefinition, radius: number): void {
  context.fillStyle = colorToHex(visual.primaryColor);
  context.strokeStyle = colorToHex(visual.outlineColor);
  context.lineWidth = Math.max(2, radius * 0.075);

  switch (visual.hullShape) {
    case 'kite':
      drawPolygon(context, [[0, -radius], [radius * 0.62, radius * 0.34], [0, radius * 0.78], [-radius * 0.62, radius * 0.34]], true);
      break;
    case 'wedge':
      drawPolygon(context, [[0, -radius * 1.2], [radius * 0.58, radius * 0.82], [0, radius * 0.5], [-radius * 0.58, radius * 0.82]], true);
      break;
    case 'diamond':
      drawPolygon(context, [[0, -radius], [radius * 0.86, 0], [0, radius * 0.88], [-radius * 0.86, 0]], true);
      break;
    case 'hex':
      drawPolygon(context, createRegularPolygon(6, radius * 0.92, -Math.PI / 6), true);
      break;
    case 'reactor':
      drawPolygon(context, createRegularPolygon(8, radius * 0.86, Math.PI / 8), true);
      break;
    case 'crystal':
      drawPolygon(context, [[0, -radius], [radius * 0.72, -radius * 0.18], [radius * 0.48, radius * 0.72], [0, radius], [-radius * 0.64, radius * 0.16], [-radius * 0.42, -radius * 0.72]], true);
      break;
    case 'needle':
      drawPolygon(context, [[0, -radius * 1.22], [radius * 0.24, -radius * 0.12], [radius * 0.18, radius], [0, radius * 0.62], [-radius * 0.18, radius], [-radius * 0.24, -radius * 0.12]], true);
      break;
    case 'carrier':
      drawPolygon(context, [[-radius * 0.78, -radius * 0.7], [radius * 0.78, -radius * 0.7], [radius, 0], [radius * 0.58, radius * 0.82], [-radius * 0.58, radius * 0.82], [-radius, 0]], true);
      break;
    case 'crescent':
      drawCrescent(context, visual, radius);
      break;
    case 'cross':
      drawPolygon(context, [[-radius * 0.22, -radius], [radius * 0.22, -radius], [radius * 0.22, -radius * 0.28], [radius, -radius * 0.28], [radius, radius * 0.24], [radius * 0.22, radius * 0.24], [radius * 0.22, radius], [-radius * 0.22, radius], [-radius * 0.22, radius * 0.24], [-radius, radius * 0.24], [-radius, -radius * 0.28], [-radius * 0.22, -radius * 0.28]], true);
      break;
    case 'command':
      drawPolygon(context, [[0, -radius], [radius * 0.86, -radius * 0.2], [radius * 0.52, radius * 0.78], [0, radius * 0.48], [-radius * 0.52, radius * 0.78], [-radius * 0.86, -radius * 0.2]], true);
      break;
    case 'boomerang':
      drawPolygon(context, [[0, -radius], [radius, radius * 0.3], [radius * 0.34, radius * 0.08], [0, radius * 0.82], [-radius * 0.34, radius * 0.08], [-radius, radius * 0.3]], true);
      break;
    case 'reflector':
      drawPolygon(context, [[0, -radius], [radius * 0.82, -radius * 0.12], [radius * 0.54, radius * 0.82], [0, radius * 0.56], [-radius * 0.54, radius * 0.82], [-radius * 0.82, -radius * 0.12]], true);
      break;
    case 'phase':
      drawPolygon(context, [[0, -radius], [radius * 0.68, -radius * 0.18], [radius * 0.36, radius * 0.82], [0, radius * 0.48], [-radius * 0.36, radius * 0.82], [-radius * 0.68, -radius * 0.18]], true);
      break;
  }
}

function drawAccents(context: CanvasRenderingContext2D, visual: EnemyVisualDefinition, radius: number): void {
  context.strokeStyle = colorToRgba(visual.secondaryColor, 0.92);
  context.lineWidth = Math.max(2, radius * 0.055);

  if (visual.hasFins) {
    drawLine(context, -radius * 0.42, radius * 0.24, -radius * 0.82, radius * 0.58);
    drawLine(context, radius * 0.42, radius * 0.24, radius * 0.82, radius * 0.58);
  }

  if (visual.hasRing) {
    context.strokeStyle = colorToRgba(visual.accentColor, 0.66);
    context.lineWidth = Math.max(1.5, radius * 0.045);
    context.beginPath();
    context.arc(0, 0, radius * 0.64, 0, Math.PI * 2);
    context.stroke();
  }

  context.strokeStyle = colorToRgba(visual.accentColor, 0.92);
  context.lineWidth = Math.max(1.5, radius * 0.045);
  drawLine(context, 0, -radius * 0.55, 0, radius * 0.45);

  context.fillStyle = colorToHex(visual.engineColor);
  context.beginPath();
  context.ellipse(-radius * 0.22, radius * 0.76, radius * 0.1, radius * 0.2, 0, 0, Math.PI * 2);
  context.ellipse(radius * 0.22, radius * 0.76, radius * 0.1, radius * 0.2, 0, 0, Math.PI * 2);
  context.fill();

  if (visual.hullShape === 'carrier') {
    context.fillStyle = colorToRgba(visual.secondaryColor, 0.9);
    context.fillRect(-radius * 0.55, -radius * 0.24, radius * 1.1, radius * 0.28);
    context.strokeRect(-radius * 0.55, -radius * 0.24, radius * 1.1, radius * 0.28);
  }

  if (visual.hullShape === 'crystal') {
    context.strokeStyle = colorToRgba(visual.outlineColor, 0.7);
    drawLine(context, -radius * 0.48, radius * 0.12, radius * 0.48, -radius * 0.08);
    drawLine(context, -radius * 0.24, -radius * 0.62, radius * 0.24, radius * 0.62);
  }

  if (visual.hullShape === 'reflector') {
    context.strokeStyle = colorToRgba(visual.accentColor, 0.9);
    context.lineWidth = Math.max(3, radius * 0.08);
    drawLine(context, -radius * 0.48, -radius * 0.48, radius * 0.48, -radius * 0.48);
  }
}

function drawCrescent(context: CanvasRenderingContext2D, visual: EnemyVisualDefinition, radius: number): void {
  context.save();
  context.fillStyle = colorToHex(visual.primaryColor);
  context.strokeStyle = colorToHex(visual.outlineColor);
  context.lineWidth = Math.max(2, radius * 0.075);
  context.beginPath();
  context.arc(0, 0, radius, Math.PI * 0.18, Math.PI * 1.82);
  context.quadraticCurveTo(-radius * 0.25, radius * 0.28, 0, radius * 0.48);
  context.quadraticCurveTo(radius * 0.44, 0, 0, -radius * 0.48);
  context.quadraticCurveTo(-radius * 0.25, -radius * 0.28, radius * Math.cos(Math.PI * 0.18), radius * Math.sin(Math.PI * 0.18));
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawPolygon(context: CanvasRenderingContext2D, points: Array<[number, number]>, fill: boolean): void {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    context.lineTo(points[i][0], points[i][1]);
  }
  context.closePath();
  if (fill) {
    context.fill();
  }
  context.stroke();
}

function createRegularPolygon(sides: number, radius: number, rotation = 0): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (Math.PI * 2 * i) / sides;
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }

  return points;
}

function drawLine(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number): void {
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
}

function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function colorToRgba(color: number, alpha: number): string {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
