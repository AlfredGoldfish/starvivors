import { describe, expect, it } from 'vitest';
import {
  DEATH_SEQUENCE_DEBRIEF_DELAY_MS,
  createDeathSequenceState,
  getDeathSequenceRemainingMs,
  resetDeathSequence,
  startDeathSequence,
  updateDeathSequence
} from './gameSceneDeathSequence';

describe('game scene death sequence state', () => {
  it('uses the five second death pause before debrief', () => {
    expect(DEATH_SEQUENCE_DEBRIEF_DELAY_MS).toBe(5000);
  });

  it('starts death with debrief unavailable and the full delay remaining', () => {
    const state = createDeathSequenceState();

    startDeathSequence(state, 1000);

    expect(state.isDebriefAvailable).toBe(false);
    expect(getDeathSequenceRemainingMs(state, 1000, true)).toBe(DEATH_SEQUENCE_DEBRIEF_DELAY_MS);
  });

  it('does not unlock debrief before the death delay expires', () => {
    const state = createDeathSequenceState();

    startDeathSequence(state, 2000);
    const changed = updateDeathSequence(state, 2000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS - 1, 'death', true);

    expect(changed).toBe(false);
    expect(state.isDebriefAvailable).toBe(false);
    expect(getDeathSequenceRemainingMs(state, 2000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS - 1, true)).toBe(1);
  });

  it('unlocks debrief exactly when the death delay expires', () => {
    const state = createDeathSequenceState();

    startDeathSequence(state, 3000);
    const changed = updateDeathSequence(state, 3000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS, 'death', true);

    expect(changed).toBe(true);
    expect(state.isDebriefAvailable).toBe(true);
    expect(getDeathSequenceRemainingMs(state, 3000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS, true)).toBe(0);
  });

  it('unlocks debrief when an eject sequence delay expires', () => {
    const state = createDeathSequenceState();

    startDeathSequence(state, 4000);
    const ejectChanged = updateDeathSequence(state, 4000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS, 'eject', true);

    expect(ejectChanged).toBe(true);
    expect(state.isDebriefAvailable).toBe(true);
  });

  it('does not unlock debrief for mission completion', () => {
    const state = createDeathSequenceState();

    startDeathSequence(state, 4500);
    const missionChanged = updateDeathSequence(state, 4500 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS, 'mission', true);

    expect(missionChanged).toBe(false);
    expect(state.isDebriefAvailable).toBe(false);
  });

  it('keeps updates idempotent once debrief is available', () => {
    const state = createDeathSequenceState();

    startDeathSequence(state, 5000);
    expect(updateDeathSequence(state, 5000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS, 'death', true)).toBe(true);
    expect(updateDeathSequence(state, 5000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS + 1000, 'death', true)).toBe(false);
    expect(state.isDebriefAvailable).toBe(true);
  });

  it('resets death sequence state', () => {
    const state = createDeathSequenceState();

    startDeathSequence(state, 6000);
    updateDeathSequence(state, 6000 + DEATH_SEQUENCE_DEBRIEF_DELAY_MS, 'death', true);
    resetDeathSequence(state);

    expect(state.isDebriefAvailable).toBe(false);
    expect(getDeathSequenceRemainingMs(state, 6000, true)).toBe(0);
  });
});
