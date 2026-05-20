import { ENCOUNTER_DEFINITIONS, type EncounterDefinition } from '../data/encounters';
import { ENEMY_LAB_SQUADS } from '../data/enemyLabDefinitions';

const ENCOUNTER_DIRECTOR_BASE_INTERVAL_MS = 18000;
const ENCOUNTER_DIRECTOR_MIN_INTERVAL_MS = 7600;
const ENCOUNTER_DIRECTOR_INTERVAL_STEP_MS = 1100;
const ENCOUNTER_DIRECTOR_RETRY_MS = 1800;

export interface EncounterDirectorState {
  nextEncounterAt: number;
  cooldownsByEncounterId: Record<string, number>;
  lastEncounterId?: string;
  encountersSpawned: number;
}

export interface EncounterDirectorInput {
  time: number;
  elapsedMs: number;
  activeEnemyCount: number;
  maxActiveEnemies: number;
  random: () => number;
}

export interface EncounterDirectorResult {
  encounter?: EncounterDefinition;
  spawnedEnemyCount: number;
  nextEncounterAt: number;
}

export function createEncounterDirectorState(nextEncounterAt = 0): EncounterDirectorState {
  return {
    nextEncounterAt,
    cooldownsByEncounterId: {},
    encountersSpawned: 0
  };
}

export function delayEncounterDirectorState(state: EncounterDirectorState, delayMs: number): void {
  state.nextEncounterAt += delayMs;

  for (const encounterId of Object.keys(state.cooldownsByEncounterId)) {
    state.cooldownsByEncounterId[encounterId] += delayMs;
  }
}

export function updateEncounterDirector(state: EncounterDirectorState, input: EncounterDirectorInput): EncounterDirectorResult {
  if (input.time < state.nextEncounterAt) {
    return {
      spawnedEnemyCount: 0,
      nextEncounterAt: state.nextEncounterAt
    };
  }

  const encounter = chooseEncounter(state, input);
  if (!encounter) {
    state.nextEncounterAt = input.time + ENCOUNTER_DIRECTOR_RETRY_MS;
    return {
      spawnedEnemyCount: 0,
      nextEncounterAt: state.nextEncounterAt
    };
  }

  state.lastEncounterId = encounter.id;
  state.encountersSpawned += 1;
  state.cooldownsByEncounterId[encounter.id] = input.time + encounter.cooldownMs;
  state.nextEncounterAt = input.time + getEncounterDirectorIntervalMs(input.elapsedMs);

  return {
    encounter,
    spawnedEnemyCount: getEncounterEnemyCount(encounter),
    nextEncounterAt: state.nextEncounterAt
  };
}

export function getEncounterEnemyCount(encounter: EncounterDefinition): number {
  const squad = ENEMY_LAB_SQUADS.find((candidate) => candidate.id === encounter.squadId);
  return squad?.entries.reduce((sum, entry) => sum + entry.count, 0) ?? 0;
}

export function getEncounterDirectorIntervalMs(elapsedMs: number): number {
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  return Math.max(
    ENCOUNTER_DIRECTOR_MIN_INTERVAL_MS,
    ENCOUNTER_DIRECTOR_BASE_INTERVAL_MS - elapsedMinutes * ENCOUNTER_DIRECTOR_INTERVAL_STEP_MS
  );
}

function chooseEncounter(state: EncounterDirectorState, input: EncounterDirectorInput): EncounterDefinition | undefined {
  const availableCapacity = Math.max(0, input.maxActiveEnemies - input.activeEnemyCount);
  const eligible = ENCOUNTER_DEFINITIONS.filter((encounter) => {
    if (input.elapsedMs < encounter.minElapsedMs) {
      return false;
    }

    if ((state.cooldownsByEncounterId[encounter.id] ?? 0) > input.time) {
      return false;
    }

    return getEncounterEnemyCount(encounter) <= availableCapacity;
  });

  if (eligible.length === 0) {
    return undefined;
  }

  const weighted = eligible.map((encounter) => ({
    encounter,
    weight: encounter.weight * (encounter.id === state.lastEncounterId ? 0.38 : 1)
  }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = input.random() * totalWeight;

  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.encounter;
    }
  }

  return weighted[weighted.length - 1]?.encounter;
}
