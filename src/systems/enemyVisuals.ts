import Phaser from 'phaser';
import {
  resolveEnemyVisualScale,
  type EnemyDefinition,
  type EnemyVisualDefinition,
  type VectorShapeAttachment,
  type VectorShapeBase,
  type VectorShapeRecipe
} from '../data/enemyDefinitions';
import { convertEnemyVisualDefinitionToForgeAsset, createForgeAssetTexture } from './assetForge';
import { getForgeAssetDefinition } from '../data/forgeAssetRegistry';
import { getEnemyVisualStyle, normalizeVectorShapeRecipe, resolveEnemyDefinitionSize } from './enemyVectorRecipes';

export const ENEMY_TEXTURE_PREFIX = 'enemy-visual';

export function getEnemyTextureKey(definitionId: string): string {
  return `${ENEMY_TEXTURE_PREFIX}-${definitionId}`;
}

export function createEnemyVisualTextures(scene: Phaser.Scene, definitions: EnemyDefinition[]): void {
  for (const definition of definitions) {
    createEnemyVisualTexture(scene, definition);
  }
}

export function createEnemyVisualContainer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  definition: EnemyDefinition
): Phaser.GameObjects.Container {
  if (getEnemyVisualStyle(definition) === 'monochrome-outline' && definition.shapeRecipe) {
    return createMonochromeOutlineVisualContainer(scene, x, y, definition);
  }

  if (getEnemyVisualStyle(definition) === 'vector-outline' && definition.shapeRecipe) {
    return createVectorOutlineVisualContainer(scene, x, y, definition);
  }

  const { scaleX, scaleY } = resolveEnemyVisualScale(definition.visual);
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

  const image = scene.add.image(0, 0, getEnemyTextureKey(definition.id));
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

function createEnemyVisualTexture(scene: Phaser.Scene, definition: EnemyDefinition): void {
  const definitionId = definition.id;
  const visual = definition.visual;
  const textureKey = getEnemyTextureKey(definitionId);
  if (scene.textures.exists(textureKey)) {
    return;
  }

  if (getEnemyVisualStyle(definition) === 'monochrome-outline' && definition.shapeRecipe) {
    createVectorOutlineTexture(scene, definition, textureKey, true);
    return;
  }

  if (getEnemyVisualStyle(definition) === 'vector-outline' && definition.shapeRecipe) {
    createVectorOutlineTexture(scene, definition, textureKey, false);
    return;
  }

  const registeredAsset = definition.visualAssetId ? getForgeAssetDefinition(definition.visualAssetId) : undefined;
  createForgeAssetTexture(scene, registeredAsset ?? convertEnemyVisualDefinitionToForgeAsset(definition), textureKey);
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

function createMonochromeOutlineVisualContainer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  definition: EnemyDefinition
): Phaser.GameObjects.Container {
  const recipe = normalizeVectorShapeRecipe(definition.shapeRecipe);
  const size = resolveEnemyDefinitionSize(definition);
  const { scaleX, scaleY } = resolveEnemyVisualScale(definition.visual);
  const visualWidth = size.visualDiameterPx * scaleX;
  const visualHeight = size.visualDiameterPx * scaleY;

  const image = scene.add.image(0, 0, getEnemyTextureKey(definition.id));
  image.setOrigin(0.5);
  image.setDisplaySize(visualWidth, visualHeight);
  image.setRotation(definition.visual.rotationOffset ?? 0);

  const container = scene.add.container(x, y, [image]);
  container.setDepth(9);
  container.setSize(visualWidth, visualHeight);
  container.setData('visualImage', image);
  container.setData('vectorShapeRecipe', recipe);
  container.setData('objectSizeProfile', size);

  return container;
}

function createVectorOutlineVisualContainer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  definition: EnemyDefinition
): Phaser.GameObjects.Container {
  const recipe = normalizeVectorShapeRecipe(definition.shapeRecipe);
  const { scaleX, scaleY } = resolveEnemyVisualScale(definition.visual);
  const visualWidth = definition.visual.size * scaleX;
  const visualHeight = definition.visual.size * scaleY;
  const accentColor = recipe?.accentColor ?? definition.visual.accentColor;

  const glow = scene.add.ellipse(0, 0, visualWidth * 1.18, visualHeight * 1.18, accentColor, 0.045);
  glow.setBlendMode(Phaser.BlendModes.ADD);

  const image = scene.add.image(0, 0, getEnemyTextureKey(definition.id));
  image.setOrigin(0.5);
  image.setDisplaySize(visualWidth, visualHeight);
  image.setRotation(definition.visual.rotationOffset ?? 0);

  const core = recipe?.attachments?.includes('core-ring')
    ? scene.add.circle(0, 0, Math.max(4, Math.min(visualWidth, visualHeight) * 0.1), accentColor, 0.08)
    : undefined;

  if (core) {
    core.setStrokeStyle(1, accentColor, 0.52);
    core.setBlendMode(Phaser.BlendModes.ADD);
  }

  const container = scene.add.container(x, y, core ? [glow, image, core] : [glow, image]);
  container.setDepth(9);
  container.setSize(visualWidth, visualHeight);
  container.setData('visualImage', image);
  container.setData('visualGlow', glow);
  container.setData('vectorShapeRecipe', recipe);
  if (core) {
    container.setData('visualCore', core);
  }

  return container;
}

function createVectorOutlineTexture(scene: Phaser.Scene, definition: EnemyDefinition, textureKey: string, monochrome: boolean): void {
  const recipe = normalizeVectorShapeRecipe(definition.shapeRecipe);
  if (!recipe) {
    return;
  }

  const resolvedSize = monochrome ? resolveEnemyDefinitionSize(definition) : undefined;
  const canvasSize = monochrome ? resolvedSize?.sourceDiameterPx ?? 320 : Math.ceil(definition.visual.size * 2.2);
  const texture = scene.textures.createCanvas(textureKey, canvasSize, canvasSize);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  const center = canvasSize / 2;
  const radius = definition.visual.size * 0.45;

  context.clearRect(0, 0, canvasSize, canvasSize);
  context.save();
  context.translate(center, center);
  context.lineJoin = 'miter';
  context.lineCap = 'square';
  context.strokeStyle = colorToRgba(recipe.outlineColor, 0.94);
  context.fillStyle = colorToRgba(
    monochrome ? recipe.fillColor ?? 0x000000 : recipe.fillColor ?? recipe.outlineColor,
    monochrome ? 1 : recipe.fillAlpha ?? 0.02
  );
  context.lineWidth = monochrome
    ? Math.max(1, (resolvedSize?.strokeWidthPx ?? recipe.strokeWidth) / Math.max(0.01, resolvedSize?.runtimeScale ?? 1))
    : recipe.strokeWidth;

  drawVectorBaseShape(context, recipe.basePolygon, radius, monochrome || (recipe.fillAlpha ?? 0) > 0);
  drawVectorAttachments(context, recipe, radius);

  context.restore();
  texture.refresh();
}

function drawVectorBaseShape(
  context: CanvasRenderingContext2D,
  basePolygon: VectorShapeBase,
  radius: number,
  fill: boolean
): void {
  switch (basePolygon) {
    case 'arrow-diamond':
      drawPolygon(context, [
        [0, -radius],
        [radius * 0.68, radius * 0.22],
        [radius * 0.2, radius * 0.12],
        [0, radius * 0.84],
        [-radius * 0.2, radius * 0.12],
        [-radius * 0.68, radius * 0.22]
      ], fill);
      break;
    case 'block-square':
      drawPolygon(context, [
        [-radius * 0.76, -radius * 0.76],
        [radius * 0.76, -radius * 0.76],
        [radius * 0.76, radius * 0.76],
        [-radius * 0.76, radius * 0.76]
      ], fill);
      break;
    case 'chevron':
      drawPolygon(context, [
        [0, -radius],
        [radius * 0.82, -radius * 0.22],
        [radius * 0.44, radius * 0.78],
        [0, radius * 0.34],
        [-radius * 0.44, radius * 0.78],
        [-radius * 0.82, -radius * 0.22]
      ], fill);
      break;
    case 'circle':
      context.beginPath();
      context.arc(0, 0, radius * 0.86, 0, Math.PI * 2);
      if (fill) {
        context.fill();
      }
      context.stroke();
      break;
    case 'hex':
      drawPolygon(context, createRegularPolygon(6, radius * 0.92, -Math.PI / 6), fill);
      break;
    case 'wedge':
      drawPolygon(context, [[0, -radius * 1.42], [radius * 0.78, radius * 0.96], [-radius * 0.78, radius * 0.96]], fill);
      break;
    case 'needle':
      drawPolygon(context, [
        [0, -radius * 1.26],
        [radius * 0.18, radius * 0.08],
        [radius * 0.11, radius],
        [0, radius * 0.66],
        [-radius * 0.11, radius],
        [-radius * 0.18, radius * 0.08]
      ], fill);
      break;
    case 'starburst':
      drawPolygon(context, createStarburstPolygon(10, radius * 0.96, radius * 0.58, -Math.PI / 2), fill);
      break;
    case 'support-core':
      drawPolygon(context, createRegularPolygon(8, radius * 0.82, Math.PI / 8), fill);
      break;
    case 'carrier-frame':
      drawPolygon(context, [
        [-radius * 0.88, -radius * 0.66],
        [radius * 0.88, -radius * 0.66],
        [radius, -radius * 0.08],
        [radius * 0.64, radius * 0.82],
        [-radius * 0.64, radius * 0.82],
        [-radius, -radius * 0.08]
      ], fill);
      break;
  }
}

function drawVectorAttachments(context: CanvasRenderingContext2D, recipe: VectorShapeRecipe, radius: number): void {
  const attachments = recipe.attachments ?? [];
  context.strokeStyle = colorToRgba(recipe.accentColor, 0.96);
  context.fillStyle = colorToRgba(recipe.accentColor, 0.08);
  context.lineWidth = Math.max(1.2, recipe.strokeWidth * 0.72);

  for (const attachment of attachments) {
    drawVectorAttachment(context, attachment, radius, recipe);
  }

  drawVectorRecipeText(context, recipe, radius);
}

function drawVectorRecipeText(context: CanvasRenderingContext2D, recipe: VectorShapeRecipe, radius: number): void {
  if (recipe.symbol) {
    context.fillStyle = colorToRgba(recipe.symbolColor ?? recipe.accentColor, 0.9);
    context.font = `800 ${Math.max(7, radius * (recipe.symbol.length > 1 ? 0.38 : 0.62))}px "IBM Plex Mono", "Consolas", monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(recipe.symbol, 0, radius * 0.02);
  }

  if (recipe.label) {
    context.fillStyle = colorToRgba(recipe.labelColor ?? recipe.accentColor, 0.7);
    context.font = `700 ${Math.max(5, radius * 0.18)}px "IBM Plex Mono", "Consolas", monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(recipe.label, 0, radius * 1.18);
  }
}

function drawVectorAttachment(
  context: CanvasRenderingContext2D,
  attachment: VectorShapeAttachment,
  radius: number,
  recipe: VectorShapeRecipe
): void {
  switch (attachment) {
    case 'nose-line':
      drawLine(context, 0, -radius * 0.78, 0, radius * 0.42);
      break;
    case 'barrel-notch':
      drawLine(context, -radius * 0.13, -radius * 0.88, 0, -radius * 1.16);
      drawLine(context, radius * 0.13, -radius * 0.88, 0, -radius * 1.16);
      break;
    case 'danger-mark':
      context.fillStyle = colorToRgba(recipe.accentColor, 0.42);
      context.font = `700 ${Math.max(7, radius * 0.82)}px "IBM Plex Mono", "Consolas", monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('!', 0, radius * 0.06);
      context.strokeStyle = colorToRgba(recipe.accentColor, 0.96);
      context.fillStyle = colorToRgba(recipe.accentColor, 0.08);
      break;
    case 'rear-thrusters':
      drawLine(context, -radius * 0.22, radius * 0.62, -radius * 0.32, radius * 0.96);
      drawLine(context, radius * 0.22, radius * 0.62, radius * 0.32, radius * 0.96);
      break;
    case 'aim-line':
      drawLine(context, 0, -radius * 0.92, 0, -radius * 1.28);
      drawLine(context, -radius * 0.12, -radius * 1.1, radius * 0.12, -radius * 1.1);
      break;
    case 'core-ring':
      context.beginPath();
      context.arc(0, 0, radius * 0.34, 0, Math.PI * 2);
      context.stroke();
      break;
    case 'shield-brackets':
      drawBracket(context, -radius * 0.76, 0, -1, radius);
      drawBracket(context, radius * 0.76, 0, 1, radius);
      break;
    case 'bay-notches':
      for (let index = -2; index <= 2; index += 1) {
        drawLine(context, index * radius * 0.2, radius * 0.58, index * radius * 0.2, radius * 0.84);
      }
      break;
    case 'crossbars':
      context.strokeStyle = colorToRgba(recipe.accentColor, 0.72);
      drawLine(context, -radius * 0.54, -radius * 0.08, radius * 0.54, -radius * 0.08);
      drawLine(context, -radius * 0.38, radius * 0.28, radius * 0.38, radius * 0.28);
      context.strokeStyle = colorToRgba(recipe.accentColor, 0.96);
      break;
  }
}

function drawBracket(context: CanvasRenderingContext2D, x: number, y: number, side: -1 | 1, radius: number): void {
  context.beginPath();
  context.moveTo(x, y - radius * 0.34);
  context.lineTo(x + side * radius * 0.12, y - radius * 0.34);
  context.moveTo(x, y - radius * 0.34);
  context.lineTo(x, y + radius * 0.34);
  context.moveTo(x, y + radius * 0.34);
  context.lineTo(x + side * radius * 0.12, y + radius * 0.34);
  context.stroke();
}

function createStarburstPolygon(points: number, outerRadius: number, innerRadius: number, rotation = 0): Array<[number, number]> {
  const polygon: Array<[number, number]> = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (Math.PI * index) / points;
    polygon.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }

  return polygon;
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
      drawPolygon(context, [[0, -radius * 1.42], [radius * 0.78, radius * 0.96], [-radius * 0.78, radius * 0.96]], true);
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
