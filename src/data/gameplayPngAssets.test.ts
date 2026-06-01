import { describe, expect, it } from 'vitest';
import { ENEMY_DEFINITIONS } from './enemyDefinitions';
import {
  ENEMY_VARIANT_ASSETS,
  PLAYER_SHIP_SKIN_ASSETS,
  getDefaultPlayerShipSkinAsset,
  getEnemyVariantAssets,
  getPlayerShipSkinAsset
} from './gameplayPngAssets';
import { shipRegistry, type ShipId } from './ships';

describe('gameplay PNG asset registry', () => {
  it('provides PNG defaults and valid skin ids for every player ship', () => {
    const expectedDefaults: Record<ShipId, string> = {
      interceptor: 'interceptor-cyan',
      bulwark: 'bulwark-teal',
      engineer: 'engineer-green'
    };

    for (const ship of shipRegistry) {
      const defaultAsset = getDefaultPlayerShipSkinAsset(ship.id);
      expect(defaultAsset?.skinId, ship.id).toBe(expectedDefaults[ship.id]);
      expect(defaultAsset?.textureKey, ship.id).toBe(`player-ship-${ship.id}-default`);

      for (const skin of ship.skins ?? []) {
        const asset = getPlayerShipSkinAsset(ship.id, skin.id);
        expect(asset?.skinId, `${ship.id}:${skin.id}`).toBe(skin.id);
        expect(asset?.textureKey, `${ship.id}:${skin.id}`).toBe(skin.textureKey);
      }
    }

    expect(PLAYER_SHIP_SKIN_ASSETS.some((asset) => asset.url.includes('interceptor_base'))).toBe(false);
  });

  it('registers exactly four primary PNG variants for each mapped enemy', () => {
    const enemyDefinitionIds = new Set(ENEMY_DEFINITIONS.map((definition) => definition.id));
    const mappedEnemyIds = [...new Set(ENEMY_VARIANT_ASSETS.map((asset) => asset.definitionId))];

    expect(mappedEnemyIds.length).toBeGreaterThan(0);

    for (const definitionId of mappedEnemyIds) {
      expect(enemyDefinitionIds.has(definitionId), definitionId).toBe(true);
      const variants = getEnemyVariantAssets(definitionId);
      expect(variants, definitionId).toHaveLength(4);
      expect(variants.map((asset) => asset.variantId), definitionId).toEqual([
        'variant-01',
        'variant-02',
        'variant-03',
        'variant-04'
      ]);
      expect(variants.every((asset) => !asset.sourcePath.includes('_v2')), definitionId).toBe(true);
    }
  });
});
