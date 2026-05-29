import { describe, expect, it } from 'vitest';
import {
  WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID,
  getWedgeStrikerPhaseMixCounts,
  getWedgeStrikerPhaseMixedSpawnPlan,
  getWedgeStrikerPhaseSoloSpawnPlan,
  isWedgeStrikerPhaseSolo,
  resolveWedgeStrikerPhaseEnemyDefinitionId
} from './wedgeStrikerPhaseSpawning';

describe('wedge striker phase spawning', () => {
  it('resolves the solo validation enemy to Wedge Striker', () => {
    expect(resolveWedgeStrikerPhaseEnemyDefinitionId()).toBe(WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID);
    expect(getWedgeStrikerPhaseSoloSpawnPlan()).toEqual([
      'wedge-striker',
      'wedge-striker',
      'wedge-striker'
    ]);
  });

  it('recognizes a solo Wedge Striker phase', () => {
    expect(isWedgeStrikerPhaseSolo(['wedge-striker', 'wedge-striker'])).toBe(true);
    expect(isWedgeStrikerPhaseSolo(['wedge-striker', 'scout'])).toBe(false);
    expect(isWedgeStrikerPhaseSolo([])).toBe(false);
  });

  it('defines a controlled Scout and Wedge Striker mix after solo validation', () => {
    const plan = getWedgeStrikerPhaseMixedSpawnPlan();

    expect(plan).toEqual(['scout', 'wedge-striker', 'scout', 'wedge-striker', 'scout']);
    expect(getWedgeStrikerPhaseMixCounts(plan)).toEqual({
      scout: 3,
      'wedge-striker': 2
    });
  });
});
