import type { GameSceneRunEndReason } from './gameSceneRunState';

export const DEATH_SEQUENCE_DEBRIEF_DELAY_MS = 7600;

export interface GameSceneDeathSequenceState {
  isDebriefAvailable: boolean;
  endsAt: number;
}

export function createDeathSequenceState(): GameSceneDeathSequenceState {
  return {
    isDebriefAvailable: false,
    endsAt: 0
  };
}

export function startDeathSequence(state: GameSceneDeathSequenceState, time: number): void {
  state.isDebriefAvailable = false;
  state.endsAt = time + DEATH_SEQUENCE_DEBRIEF_DELAY_MS;
}

export function resetDeathSequence(state: GameSceneDeathSequenceState): void {
  state.isDebriefAvailable = false;
  state.endsAt = 0;
}

export function updateDeathSequence(
  state: GameSceneDeathSequenceState,
  time: number,
  runEndReason: GameSceneRunEndReason,
  isPlayerDead: boolean
): boolean {
  if (!isPlayerDead || runEndReason !== 'death' || state.isDebriefAvailable || state.endsAt <= 0) {
    return false;
  }

  if (time < state.endsAt) {
    return false;
  }

  state.isDebriefAvailable = true;
  return true;
}

export function getDeathSequenceRemainingMs(
  state: GameSceneDeathSequenceState,
  time: number,
  isPlayerDead: boolean
): number {
  if (!isPlayerDead || state.isDebriefAvailable || state.endsAt <= 0) {
    return 0;
  }

  return Math.max(0, Math.ceil(state.endsAt - time));
}
