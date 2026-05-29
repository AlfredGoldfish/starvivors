import { describe, expect, it } from 'vitest';
import { createDefaultAttackLoadoutSlot } from '../data/enemyAttackDefinitions';
import {
  createDefaultEnemyLabPlayerAttackModes,
  getDefaultEnemyLabPlayerAttackMode,
  resolveEnemyLabPlayerFireAction
} from './enemyLabPlayerAttackMode';

describe('enemy lab player attack mode', () => {
  it('defaults Attack Tester to selected attacks and other lab modes to pulse fire', () => {
    expect(getDefaultEnemyLabPlayerAttackMode('basic')).toBe('pulse');
    expect(getDefaultEnemyLabPlayerAttackMode('squads')).toBe('pulse');
    expect(getDefaultEnemyLabPlayerAttackMode('stress')).toBe('pulse');
    expect(getDefaultEnemyLabPlayerAttackMode('attack-tester')).toBe('selected-attack');
    expect(createDefaultEnemyLabPlayerAttackModes()).toMatchObject({
      basic: 'pulse',
      squads: 'pulse',
      'attack-tester': 'selected-attack',
      stress: 'pulse',
      presets: 'pulse'
    });
  });

  it('chooses pulse fire in pulse mode and a selected modular slot in selected-attack mode', () => {
    const slots = [createDefaultAttackLoadoutSlot('rail-line'), createDefaultAttackLoadoutSlot('emp-nova')];

    expect(resolveEnemyLabPlayerFireAction({
      playerAttackMode: 'pulse',
      selectedSlotIndex: 1,
      slots,
      isAttackRuntimeIdle: true
    })).toEqual({ type: 'pulse' });

    expect(resolveEnemyLabPlayerFireAction({
      playerAttackMode: 'selected-attack',
      selectedSlotIndex: 1,
      slots,
      isAttackRuntimeIdle: true
    })).toEqual({ type: 'selected-attack', slotIndex: 1 });
  });

  it('does not queue disabled, missing, or already-running selected attacks', () => {
    const disabled = createDefaultAttackLoadoutSlot('rail-line');
    disabled.enabled = false;
    const slots = [disabled];

    expect(resolveEnemyLabPlayerFireAction({
      playerAttackMode: 'selected-attack',
      selectedSlotIndex: 0,
      slots,
      isAttackRuntimeIdle: true
    })).toEqual({ type: 'none', reason: 'disabled-slot' });

    expect(resolveEnemyLabPlayerFireAction({
      playerAttackMode: 'selected-attack',
      selectedSlotIndex: 1,
      slots,
      isAttackRuntimeIdle: true
    })).toEqual({ type: 'none', reason: 'missing-slot' });

    expect(resolveEnemyLabPlayerFireAction({
      playerAttackMode: 'selected-attack',
      selectedSlotIndex: 0,
      slots: [createDefaultAttackLoadoutSlot('emp-nova')],
      isAttackRuntimeIdle: false
    })).toEqual({ type: 'none', reason: 'runtime-busy' });
  });
});
