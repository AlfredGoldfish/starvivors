import { describe, expect, it } from 'vitest';
import { addCombatEntry, buildResultsCombatStats, createInitialRunCombatStats } from './resultsCombatStats';

describe('results combat stats', () => {
  it('creates a safe empty combat summary', () => {
    const stats = createInitialRunCombatStats();

    expect(buildResultsCombatStats(stats)).toMatchObject({
      damageDoneTotal: 0,
      damageTakenTotal: 0,
      finalDamageSource: 'No fatal hit recorded',
      damageDoneBySource: []
    });
  });

  it('rounds, accumulates, filters, and sorts combat entries', () => {
    const stats = createInitialRunCombatStats();
    addCombatEntry(stats.damageDoneBySource, 'Pulse Cannon', 10.4);
    addCombatEntry(stats.damageDoneBySource, 'Ramming Shield', 20.6);
    addCombatEntry(stats.damageDoneBySource, 'Pulse Cannon', 2.4);
    addCombatEntry(stats.damageDoneBySource, 'Ignored', 0);
    stats.damageDoneTotal = 33;

    expect(buildResultsCombatStats(stats).damageDoneBySource).toEqual([
      { label: 'Ramming Shield', value: 21 },
      { label: 'Pulse Cannon', value: 12 }
    ]);
  });
});
