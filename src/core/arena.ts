export interface ViewportSize {
  width: number;
  height: number;
}

export interface ArenaSize {
  width: number;
  height: number;
}

export const ARENA_VIEWPORT_MULTIPLIER = 9;

export function createArenaSize(viewport: ViewportSize): ArenaSize {
  return {
    width: viewport.width * ARENA_VIEWPORT_MULTIPLIER,
    height: viewport.height * ARENA_VIEWPORT_MULTIPLIER
  };
}

export function getArenaCenter(arena: ArenaSize): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(arena.width / 2, arena.height / 2);
}

export function wrapCoordinate(value: number, max: number): number {
  return ((value % max) + max) % max;
}
