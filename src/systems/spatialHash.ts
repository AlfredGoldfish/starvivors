import type { ArenaSize } from '../core/arena';

export interface SpatialHashItem<T> {
  target: T;
  x: number;
  y: number;
}

export interface SpatialHashGrid<T> {
  arena: ArenaSize;
  cellSize: number;
  columns: number;
  rows: number;
  cells: Map<string, SpatialHashItem<T>[]>;
}

export function buildSpatialHash<T>(
  arena: ArenaSize,
  items: SpatialHashItem<T>[],
  cellSize: number
): SpatialHashGrid<T> {
  const resolvedCellSize = Math.max(1, cellSize);
  const columns = Math.max(1, Math.ceil(arena.width / resolvedCellSize));
  const rows = Math.max(1, Math.ceil(arena.height / resolvedCellSize));
  const grid: SpatialHashGrid<T> = {
    arena,
    cellSize: resolvedCellSize,
    columns,
    rows,
    cells: new Map()
  };

  for (const item of items) {
    const key = getSpatialHashCellKey(grid, positionToCell(item.x, resolvedCellSize), positionToCell(item.y, resolvedCellSize));
    const cell = grid.cells.get(key);

    if (cell) {
      cell.push(item);
    } else {
      grid.cells.set(key, [item]);
    }
  }

  return grid;
}

export function querySpatialHash<T>(
  grid: SpatialHashGrid<T>,
  x: number,
  y: number,
  radius: number
): T[] {
  if (radius >= Math.max(grid.arena.width, grid.arena.height)) {
    return [...new Set(Array.from(grid.cells.values()).flat().map((item) => item.target))];
  }

  const results: T[] = [];
  const seen = new Set<T>();
  const cellRadius = Math.ceil(Math.max(0, radius) / grid.cellSize);
  const centerCellX = positionToCell(x, grid.cellSize);
  const centerCellY = positionToCell(y, grid.cellSize);

  for (let yOffset = -cellRadius; yOffset <= cellRadius; yOffset += 1) {
    for (let xOffset = -cellRadius; xOffset <= cellRadius; xOffset += 1) {
      const cell = grid.cells.get(getSpatialHashCellKey(grid, centerCellX + xOffset, centerCellY + yOffset));

      if (!cell) {
        continue;
      }

      for (const item of cell) {
        if (seen.has(item.target)) {
          continue;
        }

        seen.add(item.target);
        results.push(item.target);
      }
    }
  }

  return results;
}

function positionToCell(position: number, cellSize: number): number {
  return Math.floor(position / cellSize);
}

function getSpatialHashCellKey<T>(grid: SpatialHashGrid<T>, cellX: number, cellY: number): string {
  const wrappedX = wrapCell(cellX, grid.columns);
  const wrappedY = wrapCell(cellY, grid.rows);

  return `${wrappedX},${wrappedY}`;
}

function wrapCell(value: number, size: number): number {
  return ((value % size) + size) % size;
}
