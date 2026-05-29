import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENEMY_VISUAL_SCALE,
  ENEMY_DEFINITIONS,
  ENEMY_BEHAVIOR_IDS,
  resolveEnemyContactKnockbackMultiplier,
  resolveEnemyContactSelfImpulseMultiplier,
  resolveEnemyVisualScale,
  type EnemyDefinition
} from '../data/enemyDefinitions';
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

    expect(MONOCHROME_OUTLINE_ACTIVE_IDS).toHaveLength(ENEMY_DEFINITIONS.length);

    for (const id of MONOCHROME_OUTLINE_ACTIVE_IDS) {
      const definition = definitionsById.get(id);
      expect(definition, id).toBeDefined();
      expect(validateMonochromeEnemyDefinition(definition as EnemyDefinition), id).toMatchObject({
        valid: true,
        issues: []
      });
    }
  });

  it('keeps monochrome enemies wired to gameplay behavior, stats, weapons, and size profiles', () => {
    const definitionsById = getDefinitionsById();

    for (const id of MONOCHROME_OUTLINE_ACTIVE_IDS) {
      const definition = definitionsById.get(id) as EnemyDefinition;
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

    expect(definitionsById.get('diamond-gunner')?.weapon?.id).toBe('enemy-bolt');
    expect(definitionsById.get('needle-sniper')?.weapon?.id).toBe('enemy-rail');
  });

  it('keeps live validation enemies on thin outlines without changing their collision radii', () => {
    const definitionsById = getDefinitionsById();

    for (const id of ['scout', 'wedge-striker', 'hex-tank']) {
      const definition = definitionsById.get(id) as EnemyDefinition;
      const size = resolveEnemyDefinitionSize(definition);

      expect(definition.sizeProfile?.strokeWidthPx, id).toBe(1);
      expect(definition.shapeRecipe?.strokeWidth, id).toBe(1);
      expect(size.collisionRadiusPx, id).toBeCloseTo(definition.stats.radius, 4);
    }
  });

  it('gives Hex Tank stronger player knockback and reduced self impulse while preserving contact damage rules', () => {
    const definitionsById = getDefinitionsById();
    const scout = definitionsById.get('scout') as EnemyDefinition;
    const tank = definitionsById.get('hex-tank') as EnemyDefinition;

    expect(resolveEnemyContactKnockbackMultiplier(scout)).toBe(1);
    expect(resolveEnemyContactSelfImpulseMultiplier(scout)).toBe(1);
    expect(resolveEnemyContactKnockbackMultiplier(tank)).toBeGreaterThan(resolveEnemyContactKnockbackMultiplier(scout));
    expect(resolveEnemyContactKnockbackMultiplier(tank)).toBe(4);
    expect(resolveEnemyContactSelfImpulseMultiplier(tank)).toBeLessThan(resolveEnemyContactSelfImpulseMultiplier(scout));
    expect(resolveEnemyContactSelfImpulseMultiplier(tank)).toBe(0.45);
    expect(tank.stats.hp).toBe(150);
    expect(tank.stats.contactDamage).toBe(26);
    expect(tank.behavior.id).toBe('heavyChase');
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
    const handledBehaviorIds = new Set(ENEMY_BEHAVIOR_IDS);

    for (const id of expectedPrototypeIds) {
      const definition = definitionsById.get(id);
      expect(definition, id).toBeDefined();
      expect(handledBehaviorIds.has((definition as EnemyDefinition).behavior.id), id).toBe(true);
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
    const activeForgeDefinitions = ENEMY_DEFINITIONS.filter((definition) => getEnemyVisualStyle(definition) === 'forge-texture');
    const scout = getDefinitionsById().get('scout') as EnemyDefinition;
    const legacyVectorDefinition: EnemyDefinition = {
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

function getDefinitionsById(): Map<string, EnemyDefinition> {
  return new Map(ENEMY_DEFINITIONS.map((definition) => [definition.id, definition]));
}
