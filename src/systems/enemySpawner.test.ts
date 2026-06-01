import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';

const phaserMock = vi.hoisted(() => {
  class Vector2 {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  }

  return {
    default: {
      BlendModes: {
        ADD: 'ADD'
      },
      Math: {
        Between: (min: number, max: number) => Math.floor((min + max) / 2),
        Vector2
      }
    }
  };
});

vi.mock('phaser', () => phaserMock);

import { spawnEnemy } from './enemySpawner';

describe('enemy spawning', () => {
  it('assigns one stable PNG variant to both wrapped enemy bodies', () => {
    const scene = createScene();

    const enemy = spawnEnemy({
      scene,
      arena: { width: 1000, height: 1000 },
      definitionId: 'scout',
      x: 120,
      y: 180,
      time: 500,
      hpMultiplier: 1,
      showDebugLabel: false,
      random: () => 0.51
    });

    expect(enemy.variantId).toBe('variant-03');
    expect(enemy.body.getData('visualTextureKey')).toBe('enemy-ship-scout-variant-03');
    expect(enemy.wrapMirrorBody.getData('visualTextureKey')).toBe('enemy-ship-scout-variant-03');
    expect(enemy.body.getData('visualImage').texture.key).toBe(enemy.wrapMirrorBody.getData('visualImage').texture.key);
  });
});

function createScene(): Phaser.Scene {
  return {
    textures: {
      exists: (key: string) => key.startsWith('enemy-ship-scout-variant-')
    },
    add: {
      ellipse: vi.fn(() => createDisplayObject()),
      image: vi.fn((_x: number, _y: number, textureKey: string) => createImage(textureKey)),
      container: vi.fn((x: number, y: number, children: unknown[]) => createContainer(x, y, children))
    }
  } as unknown as Phaser.Scene;
}

function createDisplayObject(): Phaser.GameObjects.GameObject {
  return {
    setBlendMode: vi.fn().mockReturnThis()
  } as unknown as Phaser.GameObjects.GameObject;
}

function createImage(textureKey: string): Phaser.GameObjects.Image {
  const image = {
    texture: { key: textureKey },
    displayWidth: 0,
    displayHeight: 0,
    setOrigin: vi.fn().mockReturnThis(),
    setDisplaySize(width: number, height: number) {
      image.displayWidth = width;
      image.displayHeight = height;
      return image;
    },
    setRotation: vi.fn().mockReturnThis()
  };

  return image as unknown as Phaser.GameObjects.Image;
}

function createContainer(x: number, y: number, children: unknown[]): Phaser.GameObjects.Container {
  const data = new Map<string, unknown>();
  return {
    x,
    y,
    children,
    setDepth: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setData(key: string, value: unknown) {
      data.set(key, value);
      return this;
    },
    getData(key: string) {
      return data.get(key);
    },
    destroy: vi.fn()
  } as unknown as Phaser.GameObjects.Container;
}
