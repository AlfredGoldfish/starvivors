import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  GAMEPLAY_MAX_VELOCITY,
  SCRAP_PICKUP_INHERITED_VELOCITY,
  SCRAP_PICKUP_LIFETIME_MS,
  SCRAP_PICKUP_MASS,
  SCRAP_PICKUP_MAX_ACTIVE,
  SCRAP_PICKUP_MAX_SPEED,
  SCRAP_PICKUP_MIN_SPEED,
  SCRAP_PICKUP_RADIUS
} from '../scenes/gameConstants';
import type { ScrapPickup, ScrapSourceType } from '../scenes/gameTypes';

export interface SpawnScrapPickupInput {
  arena: ArenaSize;
  pickups: ScrapPickup[];
  source: ScrapSourceType;
  value: number;
  x: number;
  y: number;
  inheritedVelocity: Phaser.Math.Vector2;
  pickupRadius: number;
  time: number;
  createPickupBody: (x: number, y: number) => Phaser.GameObjects.Container;
}

export interface UpdateScrapPickupsInput {
  arena: ArenaSize;
  pickups: ScrapPickup[];
  playerX: number;
  playerY: number;
  time: number;
  deltaSeconds: number;
  isPlayerDead: boolean;
  applyBlackHoleToPickup: (pickup: ScrapPickup, deltaSeconds: number) => boolean;
  collectPickup: (pickup: ScrapPickup) => void;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
}

export function spawnScrapPickup(input: SpawnScrapPickupInput): ScrapPickup[] {
  if (input.value <= 0) {
    return input.pickups;
  }

  const pickups = [...input.pickups];

  if (pickups.length >= SCRAP_PICKUP_MAX_ACTIVE) {
    destroyScrapPickup(pickups.shift());
  }

  const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  const speed = Phaser.Math.FloatBetween(SCRAP_PICKUP_MIN_SPEED, SCRAP_PICKUP_MAX_SPEED);
  const spread = Phaser.Math.FloatBetween(0, SCRAP_PICKUP_RADIUS * 1.6);
  const spawnX = wrapCoordinate(input.x + Math.cos(angle) * spread, input.arena.width);
  const spawnY = wrapCoordinate(input.y + Math.sin(angle) * spread, input.arena.height);
  const body = input.createPickupBody(spawnX, spawnY);
  const wrapMirrorBody = input.createPickupBody(spawnX, spawnY);
  wrapMirrorBody.setVisible(false);

  pickups.push({
    body,
    wrapMirrorBody,
    velocity: new Phaser.Math.Vector2(
      input.inheritedVelocity.x * SCRAP_PICKUP_INHERITED_VELOCITY + Math.cos(angle) * speed,
      input.inheritedVelocity.y * SCRAP_PICKUP_INHERITED_VELOCITY + Math.sin(angle) * speed
    ).limit(GAMEPLAY_MAX_VELOCITY),
    value: input.value,
    mass: SCRAP_PICKUP_MASS,
    source: input.source,
    pickupRadius: input.pickupRadius,
    expiresAt: input.time + SCRAP_PICKUP_LIFETIME_MS,
    rotationSpeed: Phaser.Math.FloatBetween(0.9, 2.2) * (Phaser.Math.Between(0, 1) === 0 ? -1 : 1),
    bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2)
  });

  return pickups;
}

export function updateScrapPickups(input: UpdateScrapPickupsInput): ScrapPickup[] {
  if (input.isPlayerDead) {
    return input.pickups;
  }

  const pickups = [...input.pickups];

  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const pickup = pickups[i];

    if (input.applyBlackHoleToPickup(pickup, input.deltaSeconds)) {
      pickups.splice(i, 1);
      continue;
    }

    if (input.time >= pickup.expiresAt) {
      destroyScrapPickup(pickup);
      pickups.splice(i, 1);
      continue;
    }

    pickup.body.x = wrapCoordinate(pickup.body.x + pickup.velocity.x * input.deltaSeconds, input.arena.width);
    pickup.body.y = wrapCoordinate(pickup.body.y + pickup.velocity.y * input.deltaSeconds, input.arena.height);
    pickup.body.rotation += pickup.rotationSpeed * input.deltaSeconds;
    pickup.body.setScale(1 + Math.sin(input.time * 0.005 + pickup.bobPhase) * 0.08);
    input.updateToroidalRenderMirror(pickup.body, pickup.wrapMirrorBody, SCRAP_PICKUP_RADIUS);

    const offsetToPlayer = getWrappedDirection(input.arena, pickup.body.x, pickup.body.y, input.playerX, input.playerY);

    if (offsetToPlayer.lengthSq() <= pickup.pickupRadius * pickup.pickupRadius) {
      input.collectPickup(pickup);
      pickups.splice(i, 1);
    }
  }

  return pickups;
}

export function destroyScrapPickup(pickup: ScrapPickup | undefined): void {
  if (!pickup) {
    return;
  }

  pickup.body.destroy(true);
  pickup.wrapMirrorBody.destroy(true);
}

export function clearScrapPickups(pickups: ScrapPickup[]): ScrapPickup[] {
  for (const pickup of pickups) {
    destroyScrapPickup(pickup);
  }

  return [];
}

function getWrappedDirection(
  arena: ArenaSize,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
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
