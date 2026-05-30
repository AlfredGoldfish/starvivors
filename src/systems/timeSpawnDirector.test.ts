import { describe, expect, it } from 'vitest';
import {
  TIME_SPAWN_DIRECTOR_ACTIVE_ENEMY_CAP,
  TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
  TIME_SPAWN_DIRECTOR_FULL_RAMP_MS,
  TIME_SPAWN_DIRECTOR_MAX_DELAY_MS,
  TIME_SPAWN_DIRECTOR_MAX_WAVE_SIZE,
  TIME_SPAWN_DIRECTOR_MIN_DELAY_MS,
  TIME_SPAWN_DIRECTOR_VIEWPORT_PADDING_PX,
  createTimeSpawnDirectorState,
  getNearestWrappedRenderPosition,
  getTimeSpawnDirectorMix,
  getTimeSpawnDirectorRequestedCount,
  getTimeSpawnDirectorSpawnPosition,
  getTimeSpawnDirectorSpawnPositions,
  getTimeSpawnDirectorUnlockedEnemyPool,
  isPointInInflatedCameraViewport,
  isTimeSpawnDirectorSpecialThreat,
  updateTimeSpawnDirector
} from './timeSpawnDirector';

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)] ?? 0;
    index += 1;
    return value;
  };
}

describe('time spawn director', () => {
  it('does not spawn before 5 seconds and fires the first 3-5 enemy wave at 5 seconds', () => {
    const state = createTimeSpawnDirectorState(0);
    const before = updateTimeSpawnDirector({
      state,
      time: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS - 1,
      elapsedMs: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS - 1,
      activeEnemyCount: 0,
      random: sequenceRandom([0.5])
    });

    expect(before.dueSpawns).toHaveLength(0);
    expect(before.state.waveIndex).toBe(0);

    const first = updateTimeSpawnDirector({
      state: before.state,
      time: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      elapsedMs: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      activeEnemyCount: 0,
      random: sequenceRandom([0, 0, 0.3, 0.6, 0.2, 0.5, 0.5])
    });

    expect(first.wave?.requestedCount).toBeGreaterThanOrEqual(3);
    expect(first.wave?.requestedCount).toBeLessThanOrEqual(5);
    expect(first.dueSpawns).toHaveLength(first.wave?.allowedCount ?? 0);
    expect(first.state.waveIndex).toBe(1);
  });

  it('schedules follow-up waves 10-30 seconds after a fired wave', () => {
    const result = updateTimeSpawnDirector({
      state: createTimeSpawnDirectorState(1000),
      time: 6000,
      elapsedMs: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      activeEnemyCount: 0,
      random: sequenceRandom([0.9, 0.1, 0.2, 0.7, 0.25, 0.8])
    });

    expect(result.wave?.nextDelayMs).toBeGreaterThanOrEqual(TIME_SPAWN_DIRECTOR_MIN_DELAY_MS);
    expect(result.wave?.nextDelayMs).toBeLessThanOrEqual(TIME_SPAWN_DIRECTOR_MAX_DELAY_MS);
    expect(result.state.nextWaveAt - 6000).toBe(result.wave?.nextDelayMs);
  });

  it('ramps requested counts to 50 by 3 minutes and never exceeds 50', () => {
    expect(
      getTimeSpawnDirectorRequestedCount({
        elapsedMs: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS + 1000,
        nextWaveIndex: 2,
        random: sequenceRandom([0])
      })
    ).toBe(5);

    expect(
      getTimeSpawnDirectorRequestedCount({
        elapsedMs: TIME_SPAWN_DIRECTOR_FULL_RAMP_MS,
        nextWaveIndex: 4,
        random: sequenceRandom([0.5])
      })
    ).toBe(TIME_SPAWN_DIRECTOR_MAX_WAVE_SIZE);

    expect(
      getTimeSpawnDirectorRequestedCount({
        elapsedMs: TIME_SPAWN_DIRECTOR_FULL_RAMP_MS + 60000,
        nextWaveIndex: 12,
        random: sequenceRandom([0.999])
      })
    ).toBe(TIME_SPAWN_DIRECTOR_MAX_WAVE_SIZE);
  });

  it('clamps allowed spawns to remaining active enemy capacity', () => {
    const result = updateTimeSpawnDirector({
      state: createTimeSpawnDirectorState(0),
      time: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      elapsedMs: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      activeEnemyCount: TIME_SPAWN_DIRECTOR_ACTIVE_ENEMY_CAP - 1,
      random: sequenceRandom([0.999, 0.5, 0.5, 0.5])
    });

    expect(result.wave?.requestedCount).toBe(5);
    expect(result.wave?.allowedCount).toBe(1);
    expect(result.dueSpawns).toHaveLength(1);
  });

  it('retries soon instead of consuming a wave when the active cap is full', () => {
    const state = createTimeSpawnDirectorState(0);
    const result = updateTimeSpawnDirector({
      state,
      time: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      elapsedMs: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      activeEnemyCount: TIME_SPAWN_DIRECTOR_ACTIVE_ENEMY_CAP,
      random: sequenceRandom([0.999])
    });

    expect(result.wave).toBeUndefined();
    expect(result.dueSpawns).toHaveLength(0);
    expect(result.state.waveIndex).toBe(0);
    expect(result.state.nextWaveAt).toBeGreaterThan(TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS);
    expect(result.state.nextWaveAt).toBeLessThan(TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS + TIME_SPAWN_DIRECTOR_MIN_DELAY_MS);
  });

  it('keeps count-eligible waves mixed across multiple enemy types', () => {
    const mix = getTimeSpawnDirectorMix({
      elapsedMs: TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
      count: 4,
      random: sequenceRandom([0, 0, 0, 0, 0])
    });

    expect(Object.keys(mix)).toHaveLength(2);
  });

  it('keeps late and special threats out of early waves', () => {
    const earlyPool = getTimeSpawnDirectorUnlockedEnemyPool(119999);
    expect(earlyPool).not.toContain('needle-sniper');
    expect(earlyPool).not.toContain('spawner-nest');

    const earlyMix = getTimeSpawnDirectorMix({
      elapsedMs: 119999,
      count: 30,
      random: sequenceRandom(Array.from({ length: 40 }, () => 0.999))
    });
    expect(Object.keys(earlyMix).some((definitionId) => definitionId === 'needle-sniper')).toBe(false);
  });

  it('caps special support, summoner, and spawner threats before 3 minutes', () => {
    const mix = getTimeSpawnDirectorMix({
      elapsedMs: TIME_SPAWN_DIRECTOR_FULL_RAMP_MS - 1,
      count: 30,
      random: sequenceRandom(Array.from({ length: 40 }, () => 0.7))
    });
    const specialCount = Object.entries(mix).reduce(
      (sum, [definitionId, count]) => sum + (isTimeSpawnDirectorSpecialThreat(definitionId) ? count : 0),
      0
    );

    expect(specialCount).toBeLessThanOrEqual(1);
  });
});

describe('time spawn director placement', () => {
  it('plans spawn positions outside the inflated camera viewport', () => {
    const arena = { width: 10000, height: 8000 };
    const camera = { x: 4000, y: 3000, width: 1280, height: 720 };
    const player = { x: 4640, y: 3360 };
    const random = sequenceRandom([0, 0.25, 0.2, 0.3, 0.35, 0.7, 0.65, 0.95, 0.15, 0.45, 0.85, 0.1]);
    const positions = getTimeSpawnDirectorSpawnPositions({
      arena,
      camera,
      player,
      count: 8,
      random
    });

    expect(positions).toHaveLength(8);
    for (const position of positions) {
      const renderPosition = getNearestWrappedRenderPosition({ arena, camera, point: position });
      expect(isPointInInflatedCameraViewport(renderPosition, camera, TIME_SPAWN_DIRECTOR_VIEWPORT_PADDING_PX)).toBe(
        false
      );
    }
  });

  it('keeps wrapped edge spawns offscreen after nearest-render wrapping', () => {
    const arena = { width: 2400, height: 1600 };
    const camera = { x: -520, y: 340, width: 1280, height: 720 };
    const player = { x: 120, y: 700 };
    const position = getTimeSpawnDirectorSpawnPosition({
      arena,
      camera,
      player,
      random: sequenceRandom([0.95, 0.95, 0.5])
    });
    const renderPosition = getNearestWrappedRenderPosition({ arena, camera, point: position });

    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.x).toBeLessThan(arena.width);
    expect(position.y).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeLessThan(arena.height);
    expect(isPointInInflatedCameraViewport(renderPosition, camera, TIME_SPAWN_DIRECTOR_VIEWPORT_PADDING_PX)).toBe(false);
  });
});
