import { describe, expect, it } from 'vitest';
import {
  REACTOR_PHASE_ENEMY_DEFINITION_ID,
  getReactorPhaseMixCounts,
  getReactorPhaseMixedSpawnPlan,
  getReactorPhaseSoloSpawnPlan,
  isReactorPhaseSolo,
  resolveReactorPhaseEnemyDefinitionId
} from './reactorPhaseSpawning';

describe('reactor phase spawning', () => {
  it('resolves the solo validation enemy to Reactor Drone', () => {
    expect(resolveReactorPhaseEnemyDefinitionId()).toBe(REACTOR_PHASE_ENEMY_DEFINITION_ID);
    expect(getReactorPhaseSoloSpawnPlan()).toEqual([
      'reactor-drone',
      'reactor-drone',
      'reactor-drone'
    ]);
  });

  it('recognizes a solo Reactor Drone phase', () => {
    expect(isReactorPhaseSolo(['reactor-drone', 'reactor-drone'])).toBe(true);
    expect(isReactorPhaseSolo(['reactor-drone', 'hex-tank'])).toBe(false);
    expect(isReactorPhaseSolo([])).toBe(false);
  });

  it('defines the controlled Scout, Wedge Striker, Hex Tank, and Reactor Drone mix', () => {
    const plan = getReactorPhaseMixedSpawnPlan();

    expect(plan).toEqual(['scout', 'wedge-striker', 'hex-tank', 'reactor-drone', 'scout', 'reactor-drone']);
    expect(getReactorPhaseMixCounts(plan)).toEqual({
      scout: 2,
      'wedge-striker': 1,
      'hex-tank': 1,
      'reactor-drone': 2
    });
  });
});
