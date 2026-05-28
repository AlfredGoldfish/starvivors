import { describe, expect, it } from 'vitest';
import { buildSpatialHash, querySpatialHash } from './spatialHash';

describe('spatial hash', () => {
  it('queries neighboring wrapped cells around an origin point', () => {
    const grid = buildSpatialHash(
      { width: 100, height: 100 },
      [
        { target: 'near-origin', x: 5, y: 5 },
        { target: 'wrapped-left', x: 95, y: 5 },
        { target: 'far', x: 55, y: 55 }
      ],
      10
    );

    const results = querySpatialHash(grid, 2, 5, 10);
    expect(results).toHaveLength(2);
    expect(results).toEqual(expect.arrayContaining(['near-origin', 'wrapped-left']));
  });

  it('dedupes targets that appear in multiple nearby cells', () => {
    const shared = { id: 'shared' };
    const grid = buildSpatialHash(
      { width: 100, height: 100 },
      [
        { target: shared, x: 5, y: 5 },
        { target: shared, x: 15, y: 5 }
      ],
      10
    );

    expect(querySpatialHash(grid, 10, 5, 10)).toEqual([shared]);
  });

  it('returns every unique target for arena-wide queries', () => {
    const shared = { id: 'shared' };
    const grid = buildSpatialHash(
      { width: 80, height: 120 },
      [
        { target: shared, x: 5, y: 5 },
        { target: shared, x: 25, y: 5 },
        { target: { id: 'other' }, x: 60, y: 100 }
      ],
      20
    );

    expect(querySpatialHash(grid, 0, 0, 120)).toHaveLength(2);
    expect(querySpatialHash(grid, 0, 0, 120)).toContain(shared);
  });
});
