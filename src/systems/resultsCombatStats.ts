import type { ResultsCombatStats } from '../ui/resultsScreen';

export interface RunCombatStats {
  damageDoneTotal: number;
  damageTakenTotal: number;
  healingDoneTotal: number;
  healingReceivedTotal: number;
  shieldDamageBlocked: number;
  highestHit: number;
  finalDamageSource: string;
  finalDamageAmount: number;
  damageDoneBySource: Record<string, number>;
  damageTakenBySource: Record<string, number>;
  healingBySource: Record<string, number>;
}

export function createInitialRunCombatStats(): RunCombatStats {
  return {
    damageDoneTotal: 0,
    damageTakenTotal: 0,
    healingDoneTotal: 0,
    healingReceivedTotal: 0,
    shieldDamageBlocked: 0,
    highestHit: 0,
    finalDamageSource: 'No fatal hit recorded',
    finalDamageAmount: 0,
    damageDoneBySource: {},
    damageTakenBySource: {},
    healingBySource: {}
  };
}

export function buildResultsCombatStats(stats: RunCombatStats): ResultsCombatStats {
  return {
    damageDoneTotal: stats.damageDoneTotal,
    damageTakenTotal: stats.damageTakenTotal,
    healingDoneTotal: stats.healingDoneTotal,
    healingReceivedTotal: stats.healingReceivedTotal,
    shieldDamageBlocked: stats.shieldDamageBlocked,
    highestHit: stats.highestHit,
    finalDamageSource: stats.finalDamageSource,
    finalDamageAmount: stats.finalDamageAmount,
    damageDoneBySource: getTopCombatEntries(stats.damageDoneBySource),
    damageTakenBySource: getTopCombatEntries(stats.damageTakenBySource),
    healingBySource: getTopCombatEntries(stats.healingBySource)
  };
}

export function addCombatEntry(source: Record<string, number>, label: string, amount: number): void {
  const rounded = Math.max(0, Math.round(amount));
  if (rounded <= 0) {
    return;
  }

  source[label] = (source[label] ?? 0) + rounded;
}

function getTopCombatEntries(source: Record<string, number>): Array<{ label: string; value: number }> {
  return Object.entries(source)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}
