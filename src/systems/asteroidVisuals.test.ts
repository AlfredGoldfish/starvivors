import { describe, expect, it } from 'vitest';
import { ASTEROID_TIERS } from '../scenes/gameConstants';
import {
  ASTEROID_FAMILY_COUNT,
  ASTEROID_VISUAL_FAMILIES,
  createAsteroidVisualRecipe,
  getAsteroidFamilyForSpawn,
  normalizeAsteroidFamily
} from './asteroidVisuals';

describe('asteroid visuals', () => {
  it('exposes twelve deterministic visual families', () => {
    expect(ASTEROID_FAMILY_COUNT).toBe(12);
    expect(ASTEROID_VISUAL_FAMILIES).toEqual(Array.from({ length: 12 }, (_, index) => index));

    const first = createAsteroidVisualRecipe(4, 7);
    const second = createAsteroidVisualRecipe(4, 7);
    expect(second).toEqual(first);
    expect(first.points.length).toBeGreaterThanOrEqual(8);
    expect(first.cracks.length).toBeGreaterThanOrEqual(2);
  });

  it('normalizes family selection and supports every tier', () => {
    expect(normalizeAsteroidFamily(13)).toBe(1);
    expect(normalizeAsteroidFamily(-13)).toBe(1);

    for (const tier of ASTEROID_TIERS) {
      const family = getAsteroidFamilyForSpawn(tier, 123.4, -567.8);
      const recipe = createAsteroidVisualRecipe(tier, family);
      expect(family, `tier ${tier}`).toBeGreaterThanOrEqual(0);
      expect(family, `tier ${tier}`).toBeLessThan(ASTEROID_FAMILY_COUNT);
      expect(recipe.tier, `tier ${tier}`).toBe(tier);
      expect(recipe.family, `tier ${tier}`).toBe(family);
      expect(recipe.strokeWidth, `tier ${tier}`).toBeGreaterThan(0);
    }
  });
});
