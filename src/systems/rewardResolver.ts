import type { MissionDefinition } from '../data/missions';
import type { RareEventDefinition } from '../data/rareEvents';
import type { WorldEventDefinition } from '../data/worldEvents';
import type { ProgressionState, RewardHookId } from './progressionStorage';

export interface RewardResolution {
  hooks: RewardHookId[];
  newlyUnlockedHooks: RewardHookId[];
}

export function resolveMissionReward(state: ProgressionState, mission: MissionDefinition): RewardResolution {
  return resolveRewardHooks(state, mission.rewardUnlockHooks ?? []);
}

export function resolveWorldEventReward(state: ProgressionState, event: WorldEventDefinition): RewardResolution {
  return resolveRewardHooks(state, event.rewardUnlockHooks ?? []);
}

export function resolveRareEventReward(state: ProgressionState, event: RareEventDefinition): RewardResolution {
  return resolveRewardHooks(state, event.rewardUnlockHooks);
}

export function resolveRewardHooks(state: ProgressionState, hooks: RewardHookId[]): RewardResolution {
  const newlyUnlockedHooks: RewardHookId[] = [];

  for (const hook of hooks) {
    if (state.unlockedRewardHooks.includes(hook)) {
      continue;
    }

    state.unlockedRewardHooks.push(hook);
    newlyUnlockedHooks.push(hook);
  }

  return {
    hooks,
    newlyUnlockedHooks
  };
}
