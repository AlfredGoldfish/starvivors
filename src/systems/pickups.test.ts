import { describe, expect, it, vi } from 'vitest';
import { updateScrapPickups } from './pickups';
import type { ScrapPickup } from '../scenes/gameTypes';

const phaserMock = vi.hoisted(() => {
  class Vector2 {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    length(): number {
      return Math.hypot(this.x, this.y);
    }

    lengthSq(): number {
      return this.x * this.x + this.y * this.y;
    }

    scale(value: number): this {
      this.x *= value;
      this.y *= value;
      return this;
    }
  }

  return {
    default: {
      Math: {
        Vector2,
        Clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
        Linear: (start: number, end: number, amount: number) => start + (end - start) * amount
      }
    }
  };
});

vi.mock('phaser', () => phaserMock);

describe('pickup updates', () => {
  it('expires non-magnetized pickups and destroys their bodies', () => {
    const pickup = createPickup({ expiresAt: 50 });

    const result = updateScrapPickups({
      arena: { width: 100, height: 100 },
      pickups: [pickup],
      playerX: 50,
      playerY: 50,
      time: 100,
      deltaSeconds: 0.1,
      isPlayerDead: false,
      applyBlackHoleToPickup: vi.fn(() => false),
      collectPickup: vi.fn(),
      updateToroidalRenderMirror: vi.fn()
    });

    expect(result).toEqual([]);
    expect(pickup.body.destroy).toHaveBeenCalledWith(true);
    expect(pickup.wrapMirrorBody.destroy).toHaveBeenCalledWith(true);
  });

  it('collects pickups that overlap the live player', () => {
    const pickup = createPickup({ x: 20, y: 20, pickupRadius: 8 });
    const collectPickup = vi.fn();

    const result = updateScrapPickups({
      arena: { width: 100, height: 100 },
      pickups: [pickup],
      playerX: 20,
      playerY: 20,
      time: 100,
      deltaSeconds: 0.1,
      isPlayerDead: false,
      applyBlackHoleToPickup: vi.fn(() => false),
      collectPickup,
      updateToroidalRenderMirror: vi.fn()
    });

    expect(result).toEqual([]);
    expect(collectPickup).toHaveBeenCalledWith(pickup);
  });

  it('magnetizes pickups using wrapped player direction', () => {
    const pickup = createPickup({ x: 95, y: 50, pickupRadius: 1, magnetRadius: 20 });

    const result = updateScrapPickups({
      arena: { width: 100, height: 100 },
      pickups: [pickup],
      playerX: 5,
      playerY: 50,
      time: 100,
      deltaSeconds: 0.1,
      isPlayerDead: false,
      applyBlackHoleToPickup: vi.fn(() => false),
      collectPickup: vi.fn(),
      updateToroidalRenderMirror: vi.fn()
    });

    expect(result).toEqual([pickup]);
    expect(pickup.isMagnetized).toBe(true);
    expect(pickup.velocity.x).toBeGreaterThan(0);
    expect(pickup.body.x).toBeLessThan(95);
  });

  it('lets black hole pickup handling remove consumed pickups first', () => {
    const pickup = createPickup();
    const collectPickup = vi.fn();

    const result = updateScrapPickups({
      arena: { width: 100, height: 100 },
      pickups: [pickup],
      playerX: 10,
      playerY: 10,
      time: 100,
      deltaSeconds: 0.1,
      isPlayerDead: false,
      applyBlackHoleToPickup: vi.fn(() => true),
      collectPickup,
      updateToroidalRenderMirror: vi.fn()
    });

    expect(result).toEqual([]);
    expect(collectPickup).not.toHaveBeenCalled();
  });
});

function createPickup(overrides: Partial<ScrapPickup> & { x?: number; y?: number } = {}): ScrapPickup {
  return {
    body: createBody(overrides.x ?? 10, overrides.y ?? 10),
    wrapMirrorBody: createBody(overrides.x ?? 10, overrides.y ?? 10),
    velocity: createVelocity(0, 0),
    kind: 'scrap',
    value: 1,
    source: 'enemy',
    pickupRadius: 6,
    magnetRadius: 40,
    isMagnetized: false,
    visualScale: 1,
    offscreenSince: null,
    expiresAt: 1000,
    rotationSpeed: 1,
    bobPhase: 0,
    ...overrides
  } as ScrapPickup;
}

function createBody(x: number, y: number): ScrapPickup['body'] {
  return {
    x,
    y,
    rotation: 0,
    destroy: vi.fn(),
    setScale: vi.fn()
  } as unknown as ScrapPickup['body'];
}

function createVelocity(x: number, y: number): ScrapPickup['velocity'] {
  return {
    x,
    y,
    limit(max: number) {
      const length = Math.hypot(this.x, this.y);
      if (length > max && length > 0) {
        this.x = (this.x / length) * max;
        this.y = (this.y / length) * max;
      }
      return this;
    }
  } as ScrapPickup['velocity'];
}
