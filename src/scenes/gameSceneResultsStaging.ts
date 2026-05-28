import { createInitialRunCombatStats, type RunCombatStats } from '../systems/resultsCombatStats';

export interface StagedDebriefHarnessState {
  runEndReason: 'death';
  isPlayerDead: true;
  isDebriefAvailable: true;
  playerHull: 0;
  lastRunSurvivalMs: number;
  lastRunScrapTotal: number;
  lastRunScrapSpent: number;
  lastRunScrapConverted: number;
  lastRunCreditsEarned: number;
  combatStats: RunCombatStats;
}

export function createStagedDebriefHarnessState(): StagedDebriefHarnessState {
  return {
    runEndReason: 'death',
    isPlayerDead: true,
    isDebriefAvailable: true,
    playerHull: 0,
    lastRunSurvivalMs: 94000,
    lastRunScrapTotal: 42,
    lastRunScrapSpent: 8,
    lastRunScrapConverted: 34,
    lastRunCreditsEarned: 34,
    combatStats: {
      ...createInitialRunCombatStats(),
      damageDoneTotal: 1240,
      damageTakenTotal: 68,
      healingDoneTotal: 12,
      healingReceivedTotal: 12,
      shieldDamageBlocked: 30,
      highestHit: 84,
      finalDamageSource: 'Enemy Contact / Projectile',
      finalDamageAmount: 40,
      damageDoneBySource: { 'Pulse Cannon': 1240 },
      damageTakenBySource: { 'Enemy Contact / Projectile': 68 },
      healingBySource: { 'Hull Plating': 12 }
    }
  };
}
