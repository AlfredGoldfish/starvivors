import { describe, expect, it } from 'vitest';
import { shipRegistry } from './ships';
import {
  ASTEROID_COLLISION_RADIUS_RATIO,
  OBJECT_SOURCE_DIAMETER_PX,
  SHIP_ENEMY_COLLISION_RADIUS_RATIO,
  createObjectSizeProfileFromCollisionRadius,
  resolveObjectSizeProfile
} from './objectSizeProfile';
import { ASTEROID_TIER_CONFIG, ASTEROID_TIERS } from '../scenes/gameConstants';

describe('object size profiles', () => {
  it('resolves runtimeScale 1 to a 320px visual diameter', () => {
    const size = resolveObjectSizeProfile({
      kind: 'enemy',
      id: 'test-enemy',
      runtimeScale: 1
    });

    expect(size.sourceDiameterPx).toBe(OBJECT_SOURCE_DIAMETER_PX);
    expect(size.visualDiameterPx).toBe(320);
    expect(size.collisionRadiusRatio).toBe(SHIP_ENEMY_COLLISION_RADIUS_RATIO);
    expect(size.collisionRadiusPx).toBeCloseTo(99.2, 4);
  });

  it('derives player ship collision radius from the shared profile', () => {
    for (const ship of shipRegistry) {
      const size = resolveObjectSizeProfile(ship.sizeProfile!);

      expect(size.kind, ship.id).toBe('player-ship');
      expect(size.sourceDiameterPx, ship.id).toBe(320);
      expect(size.collisionRadiusRatio, ship.id).toBe(SHIP_ENEMY_COLLISION_RADIUS_RATIO);
      expect(size.collisionRadiusPx, ship.id).toBeCloseTo(ship.hitRadius, 4);
    }
  });

  it('derives asteroid tier collision radius from runtime scale', () => {
    for (const tier of ASTEROID_TIERS) {
      const tierConfig = ASTEROID_TIER_CONFIG[tier];
      const size = resolveObjectSizeProfile(
        createObjectSizeProfileFromCollisionRadius({
          kind: 'asteroid',
          id: `asteroid-tier-${tier}`,
          collisionRadiusPx: tierConfig.hitRadius
        })
      );

      expect(size.kind, `tier ${tier}`).toBe('asteroid');
      expect(size.sourceDiameterPx, `tier ${tier}`).toBe(320);
      expect(size.collisionRadiusRatio, `tier ${tier}`).toBe(ASTEROID_COLLISION_RADIUS_RATIO);
      expect(size.collisionRadiusPx, `tier ${tier}`).toBeCloseTo(tierConfig.hitRadius, 4);
      expect(size.visualDiameterPx, `tier ${tier}`).toBeCloseTo((tierConfig.hitRadius * 2) / ASTEROID_COLLISION_RADIUS_RATIO, 4);
    }
  });
});
