import Phaser from 'phaser';

export const EFFECT_RING_TEXTURE_KEY = 'starvivors-effect-ring-soft';
export const EFFECT_DISC_TEXTURE_KEY = 'starvivors-effect-disc-soft';
export const EFFECT_LANE_TEXTURE_KEY = 'starvivors-effect-lane-soft';

const EFFECT_TEXTURE_SIZE = 256;
const EFFECT_RING_RADIUS = 108;
const EFFECT_RING_RADIUS_RATIO = EFFECT_RING_RADIUS / EFFECT_TEXTURE_SIZE;
const EFFECT_LANE_TEXTURE_WIDTH = 256;
const EFFECT_LANE_TEXTURE_HEIGHT = 64;

export function createEffectTextures(scene: Phaser.Scene): void {
  createRingTexture(scene);
  createDiscTexture(scene);
  createLaneTexture(scene);
}

export function createEffectRingImage(input: {
  scene: Phaser.Scene;
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
  depth: number;
  additive?: boolean;
}): Phaser.GameObjects.Image {
  createRingTexture(input.scene);
  const image = input.scene.add.image(input.x, input.y, EFFECT_RING_TEXTURE_KEY);
  image.setOrigin(0.5, 0.5);
  image.setTint(input.color);
  image.setAlpha(input.alpha);
  image.setDepth(input.depth);
  setEffectRingRadius(image, input.radius);

  if (input.additive ?? true) {
    image.setBlendMode(Phaser.BlendModes.ADD);
  }

  return image;
}

export function setEffectRingRadius(image: Phaser.GameObjects.Image, radius: number): void {
  const displaySize = Math.max(1, radius / EFFECT_RING_RADIUS_RATIO);
  image.setDisplaySize(displaySize, displaySize);
}

export function createEffectDiscImage(input: {
  scene: Phaser.Scene;
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
  depth: number;
  additive?: boolean;
}): Phaser.GameObjects.Image {
  createDiscTexture(input.scene);
  const image = input.scene.add.image(input.x, input.y, EFFECT_DISC_TEXTURE_KEY);
  image.setOrigin(0.5, 0.5);
  image.setTint(input.color);
  image.setAlpha(input.alpha);
  image.setDepth(input.depth);
  image.setDisplaySize(Math.max(1, input.radius * 2), Math.max(1, input.radius * 2));

  if (input.additive ?? true) {
    image.setBlendMode(Phaser.BlendModes.ADD);
  }

  return image;
}

export function createEffectLaneImage(input: {
  scene: Phaser.Scene;
  x: number;
  y: number;
  length: number;
  width: number;
  color: number;
  alpha: number;
  depth: number;
  rotation: number;
  additive?: boolean;
}): Phaser.GameObjects.Image {
  createLaneTexture(input.scene);
  const image = input.scene.add.image(input.x, input.y, EFFECT_LANE_TEXTURE_KEY);
  image.setOrigin(0, 0.5);
  image.setTint(input.color);
  image.setAlpha(input.alpha);
  image.setDepth(input.depth);
  image.setRotation(input.rotation);
  setEffectLaneSize(image, input.length, input.width);

  if (input.additive ?? true) {
    image.setBlendMode(Phaser.BlendModes.ADD);
  }

  return image;
}

export function setEffectLaneSize(image: Phaser.GameObjects.Image, length: number, width: number): void {
  image.setDisplaySize(Math.max(1, length), Math.max(1, width));
}

function createRingTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(EFFECT_RING_TEXTURE_KEY)) {
    return;
  }

  const texture = scene.textures.createCanvas(EFFECT_RING_TEXTURE_KEY, EFFECT_TEXTURE_SIZE, EFFECT_TEXTURE_SIZE);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  const center = EFFECT_TEXTURE_SIZE / 2;
  context.clearRect(0, 0, EFFECT_TEXTURE_SIZE, EFFECT_TEXTURE_SIZE);
  context.save();
  context.translate(center, center);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  drawRingStroke(context, EFFECT_RING_RADIUS, 28, 0.1);
  drawRingStroke(context, EFFECT_RING_RADIUS, 18, 0.22);
  drawRingStroke(context, EFFECT_RING_RADIUS, 10, 0.48);
  drawRingStroke(context, EFFECT_RING_RADIUS, 4, 1);

  context.restore();
  texture.refresh();
}

function createDiscTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(EFFECT_DISC_TEXTURE_KEY)) {
    return;
  }

  const texture = scene.textures.createCanvas(EFFECT_DISC_TEXTURE_KEY, EFFECT_TEXTURE_SIZE, EFFECT_TEXTURE_SIZE);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  const center = EFFECT_TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.32, 'rgba(255, 255, 255, 0.56)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.16)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  context.clearRect(0, 0, EFFECT_TEXTURE_SIZE, EFFECT_TEXTURE_SIZE);
  context.fillStyle = gradient;
  context.fillRect(0, 0, EFFECT_TEXTURE_SIZE, EFFECT_TEXTURE_SIZE);
  texture.refresh();
}

function createLaneTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(EFFECT_LANE_TEXTURE_KEY)) {
    return;
  }

  const texture = scene.textures.createCanvas(EFFECT_LANE_TEXTURE_KEY, EFFECT_LANE_TEXTURE_WIDTH, EFFECT_LANE_TEXTURE_HEIGHT);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  const centerY = EFFECT_LANE_TEXTURE_HEIGHT / 2;
  const edgeGradient = context.createLinearGradient(0, 0, 0, EFFECT_LANE_TEXTURE_HEIGHT);
  edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  edgeGradient.addColorStop(0.36, 'rgba(255, 255, 255, 0.12)');
  edgeGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.34)');
  edgeGradient.addColorStop(0.64, 'rgba(255, 255, 255, 0.12)');
  edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  context.clearRect(0, 0, EFFECT_LANE_TEXTURE_WIDTH, EFFECT_LANE_TEXTURE_HEIGHT);
  context.fillStyle = edgeGradient;
  context.fillRect(0, 0, EFFECT_LANE_TEXTURE_WIDTH, EFFECT_LANE_TEXTURE_HEIGHT);

  context.strokeStyle = 'rgba(255, 255, 255, 0.78)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, centerY);
  context.lineTo(EFFECT_LANE_TEXTURE_WIDTH, centerY);
  context.stroke();

  context.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  context.lineWidth = 1;
  context.setLineDash([12, 10]);
  context.beginPath();
  context.moveTo(0, centerY - 16);
  context.lineTo(EFFECT_LANE_TEXTURE_WIDTH, centerY - 16);
  context.moveTo(0, centerY + 16);
  context.lineTo(EFFECT_LANE_TEXTURE_WIDTH, centerY + 16);
  context.stroke();
  context.setLineDash([]);

  texture.refresh();
}

function drawRingStroke(
  context: CanvasRenderingContext2D,
  radius: number,
  lineWidth: number,
  alpha: number
): void {
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  context.lineWidth = lineWidth;
  context.stroke();
}
