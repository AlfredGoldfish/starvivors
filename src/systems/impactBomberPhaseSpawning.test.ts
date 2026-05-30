import { describe, expect, it } from 'vitest';
import {
  IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID,
  getImpactBomberPhaseMixCounts,
  getImpactBomberPhaseMixedSpawnPlan,
  getImpactBomberPhaseSoloSpawnPlan,
  isImpactBomberPhaseSolo,
  resolveImpactBomberPhaseEnemyDefinitionId
} from './impactBomberPhaseSpawning';

describe('impact bomber phase spawning', () => {
  it('resolves the solo validation enemy to Impact Bomber', () => {
    expect(resolveImpactBomberPhaseEnemyDefinitionId()).toBe(IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID);
    expect(getImpactBomberPhaseSoloSpawnPlan()).toEqual([
      'impact-bomber',
      'impact-bomber',
      'impact-bomber'
    ]);
  });

  it('recognizes a solo Impact Bomber phase', () => {
    expect(isImpactBomberPhaseSolo(['impact-bomber', 'impact-bomber'])).toBe(true);
    expect(isImpactBomberPhaseSolo(['impact-bomber', 'reactor-drone'])).toBe(false);
    expect(isImpactBomberPhaseSolo([])).toBe(false);
  });

  it('defines the controlled Scout, Wedge Striker, Hex Tank, Reactor Drone, and Impact Bomber mix', () => {
    const plan = getImpactBomberPhaseMixedSpawnPlan();

    expect(plan).toEqual([
      'scout',
      'wedge-striker',
      'hex-tank',
      'reactor-drone',
      'impact-bomber',
      'scout',
      'impact-bomber'
    ]);
    expect(getImpactBomberPhaseMixCounts(plan)).toEqual({
      scout: 2,
      'wedge-striker': 1,
      'hex-tank': 1,
      'reactor-drone': 1,
      'impact-bomber': 2
    });
  });
});
