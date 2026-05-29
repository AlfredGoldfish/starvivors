import type { AttackLoadoutSlot } from '../data/enemyAttackDefinitions';

export type EnemyLabPlayerAttackMode = 'pulse' | 'selected-attack';
export type EnemyLabPlayerAttackModeLabMode = 'basic' | 'squads' | 'attack-tester' | 'stress' | 'presets';

export type EnemyLabPlayerFireAction =
  | { type: 'pulse' }
  | { type: 'selected-attack'; slotIndex: number }
  | { type: 'none'; reason: 'disabled-slot' | 'runtime-busy' | 'missing-slot' };

const DEFAULT_PLAYER_ATTACK_MODES: Record<EnemyLabPlayerAttackModeLabMode, EnemyLabPlayerAttackMode> = {
  basic: 'pulse',
  squads: 'pulse',
  'attack-tester': 'selected-attack',
  stress: 'pulse',
  presets: 'pulse'
};

export function getDefaultEnemyLabPlayerAttackMode(mode: EnemyLabPlayerAttackModeLabMode): EnemyLabPlayerAttackMode {
  return DEFAULT_PLAYER_ATTACK_MODES[mode];
}

export function createDefaultEnemyLabPlayerAttackModes(): Record<EnemyLabPlayerAttackModeLabMode, EnemyLabPlayerAttackMode> {
  return { ...DEFAULT_PLAYER_ATTACK_MODES };
}

export function resolveEnemyLabPlayerFireAction(input: {
  playerAttackMode: EnemyLabPlayerAttackMode;
  selectedSlotIndex: number;
  slots: AttackLoadoutSlot[];
  isAttackRuntimeIdle: boolean;
}): EnemyLabPlayerFireAction {
  if (input.playerAttackMode === 'pulse') {
    return { type: 'pulse' };
  }

  const slot = input.slots[input.selectedSlotIndex];
  if (!slot) {
    return { type: 'none', reason: 'missing-slot' };
  }

  if (slot.enabled === false) {
    return { type: 'none', reason: 'disabled-slot' };
  }

  if (!input.isAttackRuntimeIdle) {
    return { type: 'none', reason: 'runtime-busy' };
  }

  return { type: 'selected-attack', slotIndex: input.selectedSlotIndex };
}
