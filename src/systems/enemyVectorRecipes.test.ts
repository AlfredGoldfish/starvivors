import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENEMY_VISUAL_SCALE,
  ENEMY_LAB_DEFINITIONS,
  ENEMY_LAB_BEHAVIOR_IDS,
  resolveEnemyVisualScale,
  type EnemyLabDefinition
} from '../data/enemyLabDefinitions';
import {
  MONOCHROME_OUTLINE_ACTIVE_IDS,
  VECTOR_OUTLINE_MIGRATION_IDS,
  getEnemyVisualStyle,
  normalizeEnemyEffectEntry,
  resolveEnemyDefinitionSize,
  validateMonochromeEnemyDefinition,
  validateVectorEnemyDefinition
} from './enemyVectorRecipes';

describe('enemy vector recipes', () => {
  it('validates every active enemy role as monochrome-outline', () => {
    const definitionsById = getDefinitionsById();

    expect(MONOCHROME_OUTLINE_ACTIVE_IDS).toHaveLength(ENEMY_LAB_DEFINITIONS.length);

    for (const id of MONOCHROME_OUTLINE_ACTIVE_IDS) {
      const definition = definitionsById.get(id);
      expect(definition, id).toBeDefined();
      expect(validateMonochromeEnemyDefinition(definition as EnemyLabDefinition), id).toMatchObject({
        valid: true,
        issues: []
      });
    }
  });

  it('keeps monochrome enemies wired to gameplay behavior, stats, weapons, and size profiles', () => {
    const definitionsById = getDefinitionsById();

    for (const id of MONOCHROME_OUTLINE_ACTIVE_IDS) {
      const definition = definitionsById.get(id) as EnemyLabDefinition;
      const size = resolveEnemyDefinitionSize(definition);
      const visualScale = resolveEnemyVisualScale(definition.visual);
      expect(definition.behavior.id.length, id).toBeGreaterThan(0);
      expect(definition.stats.hp, id).toBeGreaterThan(0);
      expect(definition.stats.speed, id).toBeGreaterThan(0);
      expect(definition.stats.radius, id).toBeGreaterThan(0);
      expect(visualScale.scaleX, id).toBe(DEFAULT_ENEMY_VISUAL_SCALE);
      expect(visualScale.scaleY, id).toBe(DEFAULT_ENEMY_VISUAL_SCALE);
      expect(size.sourceDiameterPx, id).toBe(320);
      expect(size.collisionRadiusPx, id).toBeCloseTo(definition.stats.radius, 4);
    }

    expect(definitionsById.get('diamond-gunner')?.weapon?.id).toBe('lab-bolt');
    expect(definitionsById.get('needle-sniper')?.weapon?.id).toBe('lab-rail');
  });

  it('covers every prototype enemy concept with handled portable behavior IDs', () => {
    const definitionsById = getDefinitionsById();
    const expectedPrototypeIds = [
      'wedge-striker',
      'reactor-drone',
      'impact-bomber',
      'flanker',
      'diamond-gunner',
      'needle-sniper',
      'splitter',
      'phase-skiff',
      'hex-tank',
      'repair-skiff',
      'shield-frigate',
      'command-relay',
      'reflector',
      'spawner-nest',
      'ambusher-mine',
      'berserker',
      'orbiter',
      'patrol-guard',
      'frost-gunner',
      'electric-leech',
      'combat-summoner',
      'scrap-thief'
    ];
    const handledBehaviorIds = new Set(ENEMY_LAB_BEHAVIOR_IDS);

    for (const id of expectedPrototypeIds) {
      const definition = definitionsById.get(id);
      expect(definition, id).toBeDefined();
      expect(handledBehaviorIds.has((definition as EnemyLabDefinition).behavior.id), id).toBe(true);
    }

    expect(definitionsById.get('frost-gunner')?.behavior.params?.statusKind).toBe('frost');
    expect(definitionsById.get('electric-leech')?.behavior.params?.statusKind).toBe('electric');
    expect(definitionsById.get('combat-summoner')?.behavior.id).toBe('summonerShooter');
    expect(definitionsById.get('scrap-thief')?.behavior.id).toBe('scrapThief');
  });

  it('clamps unsafe effect values and tightens output in reduced-effects mode', () => {
    const normal = normalizeEnemyEffectEntry({
      kind: 'warning-line',
      color: 0x123456,
      durationMs: 99999,
      radius: 99999,
      length: 99999,
      intensity: 99
    });
    const reduced = normalizeEnemyEffectEntry({
      kind: 'warning-line',
      color: 0x123456,
      durationMs: 99999,
      radius: 99999,
      length: 99999,
      intensity: 99
    }, true);

    expect(normal.durationMs).toBe(2000);
    expect(normal.radius).toBe(1600);
    expect(normal.length).toBe(2400);
    expect(normal.intensity).toBe(1.5);
    expect(reduced.durationMs).toBeLessThan(normal.durationMs);
    expect(reduced.radius).toBeLessThan(normal.radius);
    expect(reduced.length).toBeLessThan(normal.length);
    expect(reduced.intensity).toBeLessThan(normal.intensity);
  });

  it('parks legacy Forge and vector data without making it active by default', () => {
    const activeForgeDefinitions = ENEMY_LAB_DEFINITIONS.filter((definition) => getEnemyVisualStyle(definition) === 'forge-texture');
    const scout = getDefinitionsById().get('scout') as EnemyLabDefinition;
    const legacyVectorDefinition: EnemyLabDefinition = {
      ...scout,
      visualStyle: 'vector-outline',
      shapeRecipe: {
        basePolygon: 'arrow-diamond',
        strokeWidth: 2.2,
        outlineColor: 0xdce8f5,
        accentColor: 0xff5964,
        fillAlpha: 0.02,
        attachments: ['nose-line', 'rear-thrusters']
      }
    };

    expect(activeForgeDefinitions).toHaveLength(0);
    expect(scout.visualAssetId).toBe('forge.enemy.scout-01');
    expect(scout.visual.hullShape.length).toBeGreaterThan(0);
    expect(validateVectorEnemyDefinition(legacyVectorDefinition)).toMatchObject({ valid: true, issues: [] });
    expect(VECTOR_OUTLINE_MIGRATION_IDS).toContain('scout');
  });
});

function getDefinitionsById(): Map<string, EnemyLabDefinition> {
  return new Map(ENEMY_LAB_DEFINITIONS.map((definition) => [definition.id, definition]));
}
