import { describe, expect, it } from 'vitest';
import {
  TANK_PHASE_ENEMY_DEFINITION_ID,
  getTankPhaseMixCounts,
  getTankPhaseMixedSpawnPlan,
  getTankPhaseSoloSpawnPlan,
  isTankPhaseSolo,
  resolveTankPhaseEnemyDefinitionId
} from './tankPhaseSpawning';

describe('tank phase spawning', () => {
  it('resolves the solo validation enemy to Hex Tank', () => {
    expect(resolveTankPhaseEnemyDefinitionId()).toBe(TANK_PHASE_ENEMY_DEFINITION_ID);
    expect(getTankPhaseSoloSpawnPlan()).toEqual([
      'hex-tank',
      'hex-tank',
      'hex-tank'
    ]);
  });

  it('recognizes a solo Hex Tank phase', () => {
    expect(isTankPhaseSolo(['hex-tank', 'hex-tank'])).toBe(true);
    expect(isTankPhaseSolo(['hex-tank', 'wedge-striker'])).toBe(false);
    expect(isTankPhaseSolo([])).toBe(false);
  });

  it('defines a controlled Scout, Wedge Striker, and Hex Tank mix after solo validation', () => {
    const plan = getTankPhaseMixedSpawnPlan();

    expect(plan).toEqual(['scout', 'wedge-striker', 'hex-tank', 'scout', 'wedge-striker', 'hex-tank']);
    expect(getTankPhaseMixCounts(plan)).toEqual({
      scout: 2,
      'wedge-striker': 2,
      'hex-tank': 2
    });
  });
});
