import { describe, expect, it } from 'vitest';
import {
  SCOUT_PHASE_MAX_ACTIVE_ENEMIES,
  getNextScoutPhaseSpawnAt,
  getScoutPhaseSpawnRamp,
  getScoutPhaseWaveIndex
} from './scoutPhaseSpawning';

describe('scout phase spawning', () => {
  it('does not request spawns before the first 10 second wave', () => {
    expect(getScoutPhaseWaveIndex(0)).toBe(0);
    expect(getScoutPhaseWaveIndex(9999)).toBe(0);
    expect(getScoutPhaseSpawnRamp({ elapsedMs: 9999, activeEnemyCount: 0 })).toMatchObject({
      requestedSpawnCount: 0,
      allowedSpawnCount: 0
    });
  });

  it('ramps requested Scout wave counts every 10 seconds', () => {
    for (let seconds = 10; seconds <= 60; seconds += 10) {
      const expected = seconds / 10;
      expect(getScoutPhaseSpawnRamp({ elapsedMs: seconds * 1000, activeEnemyCount: 0 }).requestedSpawnCount).toBe(expected);
      expect(getScoutPhaseSpawnRamp({ elapsedMs: seconds * 1000, activeEnemyCount: 0 }).allowedSpawnCount).toBe(expected);
    }
  });

  it('keeps wave size tied to elapsed run time instead of kill count', () => {
    const beforeKills = getScoutPhaseSpawnRamp({ elapsedMs: 40000, activeEnemyCount: 8 });
    const afterKills = getScoutPhaseSpawnRamp({ elapsedMs: 40000, activeEnemyCount: 3 });

    expect(beforeKills.requestedSpawnCount).toBe(4);
    expect(afterKills.requestedSpawnCount).toBe(4);
  });

  it('caps allowed spawns at 500 active live enemies', () => {
    expect(
      getScoutPhaseSpawnRamp({
        elapsedMs: 60000,
        activeEnemyCount: SCOUT_PHASE_MAX_ACTIVE_ENEMIES - 1
      }).allowedSpawnCount
    ).toBe(1);
    expect(
      getScoutPhaseSpawnRamp({
        elapsedMs: 60000,
        activeEnemyCount: SCOUT_PHASE_MAX_ACTIVE_ENEMIES
      }).allowedSpawnCount
    ).toBe(0);
  });

  it('schedules the next wave from elapsed run time', () => {
    expect(getNextScoutPhaseSpawnAt(1000, 1000)).toBe(11000);
    expect(getNextScoutPhaseSpawnAt(1000, 11000)).toBe(21000);
    expect(getNextScoutPhaseSpawnAt(1000, 61500)).toBe(71000);
  });
});
