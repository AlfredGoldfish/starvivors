import Phaser from 'phaser';
import type { ShipRegistryEntry } from '../data/ships';
import {
  createObjectSizeProfileFromCollisionRadius,
  resolveObjectSizeProfile,
  type ResolvedObjectSizeProfile
} from '../data/objectSizeProfile';

const PLAYER_SHIP_MONOCHROME_TEXTURE_PREFIX = 'monochrome-player-ship';
const WHITE = 0xffffff;
const BLACK = 0x000000;

export function getPlayerShipMonochromeTextureKey(ship: ShipRegistryEntry): string {
  return `${PLAYER_SHIP_MONOCHROME_TEXTURE_PREFIX}-${ship.id}`;
}

export function resolveShipObjectSizeProfile(ship: ShipRegistryEntry): ResolvedObjectSizeProfile {
  return resolveObjectSizeProfile(
    ship.sizeProfile ??
      createObjectSizeProfileFromCollisionRadius({
        kind: 'player-ship',
        id: ship.id,
        collisionRadiusPx: ship.hitRadius,
        strokeWidthPx: 3.2
      })
  );
}

export function createPlayerShipMonochromeTextures(scene: Phaser.Scene, ships: ShipRegistryEntry[]): void {
  for (const ship of ships) {
    createPlayerShipMonochromeTexture(scene, ship);
  }
}

function createPlayerShipMonochromeTexture(scene: Phaser.Scene, ship: ShipRegistryEntry): void {
  const textureKey = getPlayerShipMonochromeTextureKey(ship);
  if (scene.textures.exists(textureKey)) {
    return;
  }

  const size = resolveShipObjectSizeProfile(ship);
  const canvasSize = size.sourceDiameterPx;
  const texture = scene.textures.createCanvas(textureKey, canvasSize, canvasSize);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  const center = canvasSize / 2;
  const radius = canvasSize * 0.44;
  const strokeWidth = Math.max(1, (size.strokeWidthPx ?? 3.2) / Math.max(0.01, size.runtimeScale));

  context.clearRect(0, 0, canvasSize, canvasSize);
  context.save();
  context.translate(center, center);
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.fillStyle = colorToHex(BLACK);
  context.strokeStyle = colorToHex(WHITE);
  context.lineWidth = strokeWidth;

  drawAsteroidsStyleShip(context, radius, ship.id);

  context.restore();
  texture.refresh();
}

function drawAsteroidsStyleShip(context: CanvasRenderingContext2D, radius: number, shipId: ShipRegistryEntry['id']): void {
  const width = shipId === 'bulwark' ? 0.78 : shipId === 'engineer' ? 0.64 : 0.58;
  const tailY = shipId === 'bulwark' ? -0.42 : -0.48;
  const notchY = shipId === 'bulwark' ? -0.08 : -0.18;
  const noseY = shipId === 'bulwark' ? 0.96 : 1.08;

  drawPolygon(context, [
    [0, radius * noseY],
    [radius * width, radius * tailY],
    [0, radius * notchY],
    [-radius * width, radius * tailY]
  ]);
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

function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
