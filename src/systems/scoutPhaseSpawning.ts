export const SCOUT_PHASE_ENEMY_DEFINITION_ID = 'scout';
export const SCOUT_PHASE_SPAWN_INTERVAL_MS = 10000;
export const SCOUT_PHASE_MAX_ACTIVE_ENEMIES = 500;
export const SCOUT_PHASE_MODE_LABEL = 'scout-only-validation';

export interface ScoutPhaseSpawnRampInput {
  elapsedMs: number;
  activeEnemyCount: number;
  maxActiveEnemies?: number;
}

export interface ScoutPhaseSpawnRampResult {
  waveIndex: number;
  requestedSpawnCount: number;
  availableCapacity: number;
  allowedSpawnCount: number;
  capped: boolean;
}

export function getScoutPhaseWaveIndex(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < SCOUT_PHASE_SPAWN_INTERVAL_MS) {
    return 0;
  }

  return Math.floor(elapsedMs / SCOUT_PHASE_SPAWN_INTERVAL_MS);
}

export function getScoutPhaseSpawnRamp(input: ScoutPhaseSpawnRampInput): ScoutPhaseSpawnRampResult {
  const maxActiveEnemies = sanitizeMaxActiveEnemies(input.maxActiveEnemies);
  const activeEnemyCount = sanitizeActiveEnemyCount(input.activeEnemyCount);
  const waveIndex = getScoutPhaseWaveIndex(input.elapsedMs);
  const availableCapacity = Math.max(0, maxActiveEnemies - activeEnemyCount);
  const requestedSpawnCount = waveIndex;
  const allowedSpawnCount = Math.min(requestedSpawnCount, availableCapacity);

  return {
    waveIndex,
    requestedSpawnCount,
    availableCapacity,
    allowedSpawnCount,
    capped: allowedSpawnCount < requestedSpawnCount
  };
}

export function getNextScoutPhaseSpawnAt(runStartedAt: number, time: number): number {
  const safeRunStartedAt = Number.isFinite(runStartedAt) ? runStartedAt : 0;
  const elapsedMs = Math.max(0, (Number.isFinite(time) ? time : safeRunStartedAt) - safeRunStartedAt);
  return safeRunStartedAt + (getScoutPhaseWaveIndex(elapsedMs) + 1) * SCOUT_PHASE_SPAWN_INTERVAL_MS;
}

export function resolveScoutPhaseEnemyDefinitionId(): typeof SCOUT_PHASE_ENEMY_DEFINITION_ID {
  return SCOUT_PHASE_ENEMY_DEFINITION_ID;
}

function sanitizeMaxActiveEnemies(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return SCOUT_PHASE_MAX_ACTIVE_ENEMIES;
  }

  return Math.max(0, Math.floor(value as number));
}

function sanitizeActiveEnemyCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}
