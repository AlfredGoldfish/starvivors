import { wrapCoordinate, type ArenaSize } from '../core/arena';

export const TIME_SPAWN_DIRECTOR_MODE_LABEL = 'time-mixed-director';
export const TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS = 5000;
export const TIME_SPAWN_DIRECTOR_MIN_DELAY_MS = 10000;
export const TIME_SPAWN_DIRECTOR_MAX_DELAY_MS = 30000;
export const TIME_SPAWN_DIRECTOR_RETRY_DELAY_MS = 1000;
export const TIME_SPAWN_DIRECTOR_MAX_WAVE_SIZE = 50;
export const TIME_SPAWN_DIRECTOR_ACTIVE_ENEMY_CAP = 50;
export const TIME_SPAWN_DIRECTOR_FULL_RAMP_MS = 180000;
export const TIME_SPAWN_DIRECTOR_STAGGER_MIN_MS = 1000;
export const TIME_SPAWN_DIRECTOR_STAGGER_MAX_MS = 2000;
export const TIME_SPAWN_DIRECTOR_VIEWPORT_PADDING_PX = 96;
export const TIME_SPAWN_DIRECTOR_PREFERRED_MIN_OFFSCREEN_PX = 160;
export const TIME_SPAWN_DIRECTOR_PREFERRED_MAX_OFFSCREEN_PX = 320;
export const TIME_SPAWN_DIRECTOR_MIN_PLAYER_DISTANCE_PX = 360;

export const TIME_SPAWN_DIRECTOR_EARLY_POOL = ['scout', 'wedge-striker', 'diamond-gunner'] as const;

export const TIME_SPAWN_DIRECTOR_MID_UNLOCKS = [
  { id: 'reactor-drone', unlockElapsedMs: 30000 },
  { id: 'hex-tank', unlockElapsedMs: 45000 },
  { id: 'splitter', unlockElapsedMs: 60000 },
  { id: 'frost-gunner', unlockElapsedMs: 75000 },
  { id: 'poison-leech', unlockElapsedMs: 90000 },
  { id: 'flanker', unlockElapsedMs: 105000 }
] as const;

export const TIME_SPAWN_DIRECTOR_LATE_UNLOCKS = [
  { id: 'needle-sniper', unlockElapsedMs: 120000 },
  { id: 'shield-frigate', unlockElapsedMs: 130000 },
  { id: 'repair-skiff', unlockElapsedMs: 140000 },
  { id: 'command-relay', unlockElapsedMs: 145000 },
  { id: 'reflector', unlockElapsedMs: 150000 },
  { id: 'phase-skiff', unlockElapsedMs: 155000 },
  { id: 'ambusher-mine', unlockElapsedMs: 160000 },
  { id: 'orbiter', unlockElapsedMs: 165000 },
  { id: 'patrol-guard', unlockElapsedMs: 170000 },
  { id: 'combat-summoner', unlockElapsedMs: 174000 },
  { id: 'spawner-nest', unlockElapsedMs: 176000 },
  { id: 'scrap-thief', unlockElapsedMs: 178000 },
  { id: 'berserker', unlockElapsedMs: 179000 },
  { id: 'impact-bomber', unlockElapsedMs: 180000 }
] as const;

export type TimeSpawnEnemyDefinitionId =
  | (typeof TIME_SPAWN_DIRECTOR_EARLY_POOL)[number]
  | (typeof TIME_SPAWN_DIRECTOR_MID_UNLOCKS)[number]['id']
  | (typeof TIME_SPAWN_DIRECTOR_LATE_UNLOCKS)[number]['id'];

export interface TimeSpawnDirectorPendingSpawn {
  waveId: number;
  waveIndex: number;
  sequence: number;
  waveSize: number;
  spawnAt: number;
  definitionId: TimeSpawnEnemyDefinitionId;
}

export interface TimeSpawnDirectorState {
  nextWaveAt: number;
  waveIndex: number;
  nextWaveId: number;
  pendingSpawns: TimeSpawnDirectorPendingSpawn[];
  lastWaveAt: number;
  lastNextDelayMs: number;
  lastRequestedCount: number;
  lastAllowedCount: number;
  lastAvailableCapacity: number;
  lastActiveCap: number;
  lastMix: Record<string, number>;
  lastCapped: boolean;
}

export interface TimeSpawnDirectorUpdateInput {
  state: TimeSpawnDirectorState;
  time: number;
  elapsedMs: number;
  activeEnemyCount: number;
  maxActiveEnemies?: number;
  random: () => number;
}

export interface TimeSpawnDirectorWavePlan {
  waveId: number;
  waveIndex: number;
  requestedCount: number;
  allowedCount: number;
  availableCapacity: number;
  activeCap: number;
  nextDelayMs: number;
  mix: Record<string, number>;
}

export interface TimeSpawnDirectorUpdateResult {
  state: TimeSpawnDirectorState;
  dueSpawns: TimeSpawnDirectorPendingSpawn[];
  wave?: TimeSpawnDirectorWavePlan;
}

export interface TimeSpawnCameraView {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TimeSpawnPoint {
  x: number;
  y: number;
}

export interface TimeSpawnPlacementInput {
  arena: ArenaSize;
  camera: TimeSpawnCameraView;
  player: TimeSpawnPoint;
  random: () => number;
  minViewportPadding?: number;
  preferredMinOffscreenDistance?: number;
  preferredMaxOffscreenDistance?: number;
  minPlayerDistance?: number;
}

export function createTimeSpawnDirectorState(runStartedAt = 0): TimeSpawnDirectorState {
  const safeRunStartedAt = Number.isFinite(runStartedAt) ? runStartedAt : 0;

  return {
    nextWaveAt: safeRunStartedAt + TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS,
    waveIndex: 0,
    nextWaveId: 1,
    pendingSpawns: [],
    lastWaveAt: 0,
    lastNextDelayMs: 0,
    lastRequestedCount: 0,
    lastAllowedCount: 0,
    lastAvailableCapacity: TIME_SPAWN_DIRECTOR_ACTIVE_ENEMY_CAP,
    lastActiveCap: TIME_SPAWN_DIRECTOR_ACTIVE_ENEMY_CAP,
    lastMix: {},
    lastCapped: false
  };
}

export function delayTimeSpawnDirectorState(
  state: TimeSpawnDirectorState,
  delayMs: number
): TimeSpawnDirectorState {
  const safeDelayMs = Math.max(0, Number.isFinite(delayMs) ? delayMs : 0);

  if (safeDelayMs <= 0) {
    return state;
  }

  return {
    ...state,
    nextWaveAt: state.nextWaveAt + safeDelayMs,
    pendingSpawns: state.pendingSpawns.map((spawn) => ({ ...spawn, spawnAt: spawn.spawnAt + safeDelayMs }))
  };
}

export function updateTimeSpawnDirector(input: TimeSpawnDirectorUpdateInput): TimeSpawnDirectorUpdateResult {
  const time = sanitizeNonNegative(input.time);
  const elapsedMs = sanitizeNonNegative(input.elapsedMs);
  const random = input.random;
  const activeCap = sanitizeActiveCap(input.maxActiveEnemies);
  const activeEnemyCount = sanitizeActiveEnemyCount(input.activeEnemyCount);
  let pendingSpawns = [...input.state.pendingSpawns];
  let state: TimeSpawnDirectorState = {
    ...input.state,
    lastActiveCap: activeCap
  };
  let wave: TimeSpawnDirectorWavePlan | undefined;

  if (time >= state.nextWaveAt) {
    const requestedCount = getTimeSpawnDirectorRequestedCount({
      elapsedMs,
      nextWaveIndex: state.waveIndex + 1,
      random
    });
    const availableCapacity = Math.max(0, activeCap - activeEnemyCount - pendingSpawns.length);
    const allowedCount = Math.min(requestedCount, availableCapacity, TIME_SPAWN_DIRECTOR_MAX_WAVE_SIZE);

    if (allowedCount <= 0) {
      state = {
        ...state,
        nextWaveAt: time + TIME_SPAWN_DIRECTOR_RETRY_DELAY_MS,
        lastRequestedCount: requestedCount,
        lastAllowedCount: 0,
        lastAvailableCapacity: availableCapacity,
        lastActiveCap: activeCap,
        lastCapped: requestedCount > 0
      };
    } else {
      const waveIndex = state.waveIndex + 1;
      const waveId = state.nextWaveId;
      const mix = getTimeSpawnDirectorMix({
        elapsedMs,
        count: allowedCount,
        random
      });
      const nextDelayMs = getTimeSpawnDirectorNextDelayMs(random);
      const scheduledSpawns = scheduleTimeSpawnDirectorWave({
        time,
        waveId,
        waveIndex,
        mix,
        random
      });

      pendingSpawns = [...pendingSpawns, ...scheduledSpawns];
      state = {
        ...state,
        nextWaveAt: time + nextDelayMs,
        waveIndex,
        nextWaveId: waveId + 1,
        pendingSpawns,
        lastWaveAt: time,
        lastNextDelayMs: nextDelayMs,
        lastRequestedCount: requestedCount,
        lastAllowedCount: allowedCount,
        lastAvailableCapacity: availableCapacity,
        lastActiveCap: activeCap,
        lastMix: mix,
        lastCapped: allowedCount < requestedCount
      };
      wave = {
        waveId,
        waveIndex,
        requestedCount,
        allowedCount,
        availableCapacity,
        activeCap,
        nextDelayMs,
        mix
      };
    }
  }

  const dueSpawns = state.pendingSpawns.filter((spawn) => spawn.spawnAt <= time);
  const remainingSpawns = state.pendingSpawns.filter((spawn) => spawn.spawnAt > time);

  return {
    state: {
      ...state,
      pendingSpawns: remainingSpawns
    },
    dueSpawns,
    wave
  };
}

export function getTimeSpawnDirectorRequestedCount(input: {
  elapsedMs: number;
  nextWaveIndex: number;
  random: () => number;
}): number {
  const elapsedMs = sanitizeNonNegative(input.elapsedMs);
  const nextWaveIndex = Math.max(1, Math.floor(input.nextWaveIndex));

  if (nextWaveIndex === 1) {
    return 3 + Math.floor(clampRandom(input.random()) * 3);
  }

  const rampDurationMs = TIME_SPAWN_DIRECTOR_FULL_RAMP_MS - TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS;
  const progress = clamp01((elapsedMs - TIME_SPAWN_DIRECTOR_FIRST_WAVE_MS) / rampDurationMs);
  const baseCount = 5 + progress * (TIME_SPAWN_DIRECTOR_MAX_WAVE_SIZE - 5);
  const variance = progress <= 0 ? 0 : Math.max(1, Math.round(2 + progress * 4));
  const randomVariance = Math.round((clampRandom(input.random()) * 2 - 1) * variance);

  return Math.min(TIME_SPAWN_DIRECTOR_MAX_WAVE_SIZE, Math.max(5, Math.round(baseCount) + randomVariance));
}

export function getTimeSpawnDirectorNextDelayMs(random: () => number): number {
  const span = TIME_SPAWN_DIRECTOR_MAX_DELAY_MS - TIME_SPAWN_DIRECTOR_MIN_DELAY_MS;
  return TIME_SPAWN_DIRECTOR_MIN_DELAY_MS + Math.round(clampRandom(random()) * span);
}

export function getTimeSpawnDirectorUnlockedEnemyPool(elapsedMs: number): TimeSpawnEnemyDefinitionId[] {
  const safeElapsedMs = sanitizeNonNegative(elapsedMs);
  const pool: TimeSpawnEnemyDefinitionId[] = [...TIME_SPAWN_DIRECTOR_EARLY_POOL];

  for (const unlock of TIME_SPAWN_DIRECTOR_MID_UNLOCKS) {
    if (safeElapsedMs >= unlock.unlockElapsedMs) {
      pool.push(unlock.id);
    }
  }

  for (const unlock of TIME_SPAWN_DIRECTOR_LATE_UNLOCKS) {
    if (safeElapsedMs >= unlock.unlockElapsedMs) {
      pool.push(unlock.id);
    }
  }

  return pool;
}

export function getTimeSpawnDirectorMix(input: {
  elapsedMs: number;
  count: number;
  random: () => number;
}): Record<TimeSpawnEnemyDefinitionId, number> {
  const count = Math.max(0, Math.floor(input.count));
  const unlockedPool = getTimeSpawnDirectorUnlockedEnemyPool(input.elapsedMs);
  const mix: Partial<Record<TimeSpawnEnemyDefinitionId, number>> = {};
  const sequence: TimeSpawnEnemyDefinitionId[] = [];
  let specialThreatCount = 0;
  const specialThreatLimit = getTimeSpawnDirectorSpecialThreatLimit(input.elapsedMs, count);

  for (let index = 0; index < count; index += 1) {
    const candidates =
      specialThreatCount >= specialThreatLimit
        ? unlockedPool.filter((definitionId) => !isTimeSpawnDirectorSpecialThreat(definitionId))
        : unlockedPool;
    const candidatePool = candidates.length > 0 ? candidates : unlockedPool;
    const definitionId = pickTimeSpawnDirectorEnemy(candidatePool, input.random);

    sequence.push(definitionId);
    mix[definitionId] = (mix[definitionId] ?? 0) + 1;
    if (isTimeSpawnDirectorSpecialThreat(definitionId)) {
      specialThreatCount += 1;
    }
  }

  if (count >= 4 && Object.keys(mix).length < 2 && unlockedPool.length >= 2) {
    const originalId = sequence[sequence.length - 1];
    const replacementPool = unlockedPool.filter((definitionId) => definitionId !== originalId);
    const replacementId = pickTimeSpawnDirectorEnemy(replacementPool, input.random);
    mix[originalId] = Math.max(0, (mix[originalId] ?? 0) - 1);
    if (mix[originalId] === 0) {
      delete mix[originalId];
    }
    mix[replacementId] = (mix[replacementId] ?? 0) + 1;
  }

  return normalizeMix(mix);
}

export function getTimeSpawnDirectorSpecialThreatLimit(elapsedMs: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  if (elapsedMs < TIME_SPAWN_DIRECTOR_FULL_RAMP_MS) {
    return 1;
  }

  if (count <= 35) {
    return 2;
  }

  return Math.max(3, Math.ceil(count / 10));
}

export function isTimeSpawnDirectorSpecialThreat(definitionId: string): boolean {
  return (
    definitionId === 'spawner-nest' ||
    definitionId === 'combat-summoner' ||
    definitionId === 'shield-frigate' ||
    definitionId === 'repair-skiff' ||
    definitionId === 'command-relay'
  );
}

export function scheduleTimeSpawnDirectorWave(input: {
  time: number;
  waveId: number;
  waveIndex: number;
  mix: Record<string, number>;
  random: () => number;
}): TimeSpawnDirectorPendingSpawn[] {
  const definitionIds = flattenMix(input.mix);
  const waveSize = definitionIds.length;

  if (waveSize <= 0) {
    return [];
  }

  const staggerDurationMs =
    waveSize <= 1
      ? 0
      : TIME_SPAWN_DIRECTOR_STAGGER_MIN_MS +
        Math.round(clampRandom(input.random()) * (TIME_SPAWN_DIRECTOR_STAGGER_MAX_MS - TIME_SPAWN_DIRECTOR_STAGGER_MIN_MS));
  const batchCount = Math.min(6, Math.max(1, Math.ceil(waveSize / 6)));
  const batchSize = Math.ceil(waveSize / batchCount);

  return definitionIds.map((definitionId, index) => {
    const batchIndex = Math.min(batchCount - 1, Math.floor(index / batchSize));
    const batchProgress = batchCount <= 1 ? 0 : batchIndex / (batchCount - 1);

    return {
      waveId: input.waveId,
      waveIndex: input.waveIndex,
      sequence: index,
      waveSize,
      spawnAt: input.time + Math.round(staggerDurationMs * batchProgress),
      definitionId: definitionId as TimeSpawnEnemyDefinitionId
    };
  });
}

export function getTimeSpawnDirectorMixSummary(mix: Record<string, number>): string {
  const entries = Object.entries(mix)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  if (entries.length <= 0) {
    return 'none';
  }

  return entries.map(([definitionId, count]) => `${definitionId} x${count}`).join(', ');
}

export function getNearestWrappedRenderCoordinate(value: number, cameraCenter: number, arenaSize: number): number {
  const delta = cameraCenter - value;

  if (delta > arenaSize / 2) {
    return value + arenaSize;
  }

  if (delta < -arenaSize / 2) {
    return value - arenaSize;
  }

  return value;
}

export function getNearestWrappedRenderPosition(input: {
  arena: ArenaSize;
  camera: TimeSpawnCameraView;
  point: TimeSpawnPoint;
}): TimeSpawnPoint {
  const cameraCenterX = input.camera.x + input.camera.width / 2;
  const cameraCenterY = input.camera.y + input.camera.height / 2;

  return {
    x: getNearestWrappedRenderCoordinate(input.point.x, cameraCenterX, input.arena.width),
    y: getNearestWrappedRenderCoordinate(input.point.y, cameraCenterY, input.arena.height)
  };
}

export function isPointInInflatedCameraViewport(
  point: TimeSpawnPoint,
  camera: TimeSpawnCameraView,
  padding = TIME_SPAWN_DIRECTOR_VIEWPORT_PADDING_PX
): boolean {
  return (
    point.x >= camera.x - padding &&
    point.x <= camera.x + camera.width + padding &&
    point.y >= camera.y - padding &&
    point.y <= camera.y + camera.height + padding
  );
}

export function getWrappedDistanceSq(arena: ArenaSize, first: TimeSpawnPoint, second: TimeSpawnPoint): number {
  let dx = second.x - first.x;
  let dy = second.y - first.y;

  if (Math.abs(dx) > arena.width / 2) {
    dx -= Math.sign(dx) * arena.width;
  }

  if (Math.abs(dy) > arena.height / 2) {
    dy -= Math.sign(dy) * arena.height;
  }

  return dx * dx + dy * dy;
}

export function isTimeSpawnDirectorPositionValid(
  input: Omit<TimeSpawnPlacementInput, 'random'> & { point: TimeSpawnPoint }
): boolean {
  const padding = input.minViewportPadding ?? TIME_SPAWN_DIRECTOR_VIEWPORT_PADDING_PX;
  const minPlayerDistance = input.minPlayerDistance ?? TIME_SPAWN_DIRECTOR_MIN_PLAYER_DISTANCE_PX;
  const renderPosition = getNearestWrappedRenderPosition({
    arena: input.arena,
    camera: input.camera,
    point: input.point
  });

  return (
    !isPointInInflatedCameraViewport(renderPosition, input.camera, padding) &&
    getWrappedDistanceSq(input.arena, input.player, input.point) >= minPlayerDistance * minPlayerDistance
  );
}

export function getTimeSpawnDirectorSpawnPosition(input: TimeSpawnPlacementInput): TimeSpawnPoint {
  const padding = input.minViewportPadding ?? TIME_SPAWN_DIRECTOR_VIEWPORT_PADDING_PX;
  const preferredMin = Math.max(
    padding,
    input.preferredMinOffscreenDistance ?? TIME_SPAWN_DIRECTOR_PREFERRED_MIN_OFFSCREEN_PX
  );
  const preferredMax = Math.max(
    preferredMin,
    input.preferredMaxOffscreenDistance ?? TIME_SPAWN_DIRECTOR_PREFERRED_MAX_OFFSCREEN_PX
  );

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const candidate = getSpawnPositionCandidate(input, preferredMin, preferredMax);

    if (isTimeSpawnDirectorPositionValid({ ...input, point: candidate })) {
      return candidate;
    }
  }

  const fallbackDistance = preferredMax;
  const fallbackCandidates = [
    { x: input.camera.x - fallbackDistance, y: input.camera.y + input.camera.height / 2 },
    { x: input.camera.x + input.camera.width + fallbackDistance, y: input.camera.y + input.camera.height / 2 },
    { x: input.camera.x + input.camera.width / 2, y: input.camera.y - fallbackDistance },
    { x: input.camera.x + input.camera.width / 2, y: input.camera.y + input.camera.height + fallbackDistance }
  ].map((point) => wrapSpawnPoint(input.arena, point));

  return (
    fallbackCandidates.find((point) => isTimeSpawnDirectorPositionValid({ ...input, point })) ??
    fallbackCandidates[0]
  );
}

export function getTimeSpawnDirectorSpawnPositions(
  input: TimeSpawnPlacementInput & { count: number }
): TimeSpawnPoint[] {
  const count = Math.max(0, Math.floor(input.count));
  return Array.from({ length: count }, () => getTimeSpawnDirectorSpawnPosition(input));
}

function getSpawnPositionCandidate(
  input: TimeSpawnPlacementInput,
  preferredMin: number,
  preferredMax: number
): TimeSpawnPoint {
  const side = Math.floor(clampRandom(input.random()) * 4);
  const distance = preferredMin + clampRandom(input.random()) * (preferredMax - preferredMin);
  const horizontalMin = input.camera.x - distance;
  const horizontalMax = input.camera.x + input.camera.width + distance;
  const verticalMin = input.camera.y - distance;
  const verticalMax = input.camera.y + input.camera.height + distance;

  switch (side) {
    case 0:
      return wrapSpawnPoint(input.arena, {
        x: horizontalMin + clampRandom(input.random()) * (horizontalMax - horizontalMin),
        y: input.camera.y - distance
      });
    case 1:
      return wrapSpawnPoint(input.arena, {
        x: input.camera.x + input.camera.width + distance,
        y: verticalMin + clampRandom(input.random()) * (verticalMax - verticalMin)
      });
    case 2:
      return wrapSpawnPoint(input.arena, {
        x: horizontalMin + clampRandom(input.random()) * (horizontalMax - horizontalMin),
        y: input.camera.y + input.camera.height + distance
      });
    default:
      return wrapSpawnPoint(input.arena, {
        x: input.camera.x - distance,
        y: verticalMin + clampRandom(input.random()) * (verticalMax - verticalMin)
      });
  }
}

function wrapSpawnPoint(arena: ArenaSize, point: TimeSpawnPoint): TimeSpawnPoint {
  return {
    x: wrapCoordinate(point.x, arena.width),
    y: wrapCoordinate(point.y, arena.height)
  };
}

function pickTimeSpawnDirectorEnemy(
  pool: readonly TimeSpawnEnemyDefinitionId[],
  random: () => number
): TimeSpawnEnemyDefinitionId {
  return pool[Math.min(pool.length - 1, Math.floor(clampRandom(random()) * pool.length))] ?? 'scout';
}

function flattenMix(mix: Record<string, number>): string[] {
  const definitionIds: string[] = [];

  for (const [definitionId, count] of Object.entries(mix)) {
    for (let index = 0; index < Math.max(0, Math.floor(count)); index += 1) {
      definitionIds.push(definitionId);
    }
  }

  return definitionIds;
}

function normalizeMix(mix: Partial<Record<TimeSpawnEnemyDefinitionId, number>>): Record<TimeSpawnEnemyDefinitionId, number> {
  const normalized: Partial<Record<TimeSpawnEnemyDefinitionId, number>> = {};

  for (const [definitionId, count] of Object.entries(mix)) {
    if ((count ?? 0) > 0) {
      normalized[definitionId as TimeSpawnEnemyDefinitionId] = count;
    }
  }

  return normalized as Record<TimeSpawnEnemyDefinitionId, number>;
}

function sanitizeActiveCap(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return TIME_SPAWN_DIRECTOR_ACTIVE_ENEMY_CAP;
  }

  return Math.max(0, Math.floor(value as number));
}

function sanitizeActiveEnemyCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function sanitizeNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function clampRandom(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(0.999999, Math.max(0, value));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}
