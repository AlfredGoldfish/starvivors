export interface ViewportSize {
  width: number;
  height: number;
}

export interface ArenaSize {
  width: number;
  height: number;
}

export const BASE_ARENA_VIEWPORT_MULTIPLIER = 9;
export const DEFAULT_SECTOR_SCALE = 2;
export const SECTOR_SCALE_OPTIONS = [1, 2, 3, 5] as const;

export type SectorScale = (typeof SECTOR_SCALE_OPTIONS)[number];

export function createArenaSize(viewport: ViewportSize, sectorScale = DEFAULT_SECTOR_SCALE): ArenaSize {
  const scale = normalizeSectorScale(sectorScale);

  return {
    width: Math.round(viewport.width * BASE_ARENA_VIEWPORT_MULTIPLIER * scale),
    height: Math.round(viewport.height * BASE_ARENA_VIEWPORT_MULTIPLIER * scale)
  };
}

export function normalizeSectorScale(value: number): SectorScale {
  return SECTOR_SCALE_OPTIONS.includes(value as SectorScale) ? (value as SectorScale) : DEFAULT_SECTOR_SCALE;
}

export function getArenaCenter(arena: ArenaSize): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(arena.width / 2, arena.height / 2);
}

export function wrapCoordinate(value: number, max: number): number {
  return ((value % max) + max) % max;
}
