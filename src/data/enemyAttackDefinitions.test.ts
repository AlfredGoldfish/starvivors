import { describe, expect, it } from 'vitest';
import { ENEMY_LAB_DEFINITIONS } from './enemyLabDefinitions';
import {
  ENEMY_ATTACK_DEFINITIONS,
  getDefaultEnemyAttackLoadout,
  resolveAttackLoadoutSlotParams,
  validateEnemyAttackRegistry
} from './enemyAttackDefinitions';

describe('enemy attack definitions', () => {
  it('has a valid default loadout for every Enemy Lab definition', () => {
    const errors = validateEnemyAttackRegistry(ENEMY_LAB_DEFINITIONS.map((definition) => definition.id));

    expect(errors).toEqual([]);
  });

  it('keeps attack ids unique', () => {
    const ids = ENEMY_ATTACK_DEFINITIONS.map((definition) => definition.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('merges slot params over attack defaults without mutating registry defaults', () => {
    const loadout = getDefaultEnemyAttackLoadout('reflector');
    const params = resolveAttackLoadoutSlotParams(loadout[0]);

    expect(params.reflect).toBe(true);
    expect(ENEMY_ATTACK_DEFINITIONS.find((definition) => definition.id === 'shield-wall')?.defaultParams.reflect).toBe(false);
  });

  it('returns defensive copies of default loadouts', () => {
    const loadout = getDefaultEnemyAttackLoadout('combat-summoner');
    loadout[1].params = { count: 99 };

    expect(getDefaultEnemyAttackLoadout('combat-summoner')[1].params?.count).toBe(3);
  });
});
