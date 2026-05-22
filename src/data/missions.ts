import type { SectorRegionType } from '../systems/sectorGeneration';
import type { RareEventDefinitionId } from './rareEvents';
import type { WorldEventDefinitionId } from './worldEvents';
import type { RewardHookId } from '../systems/progressionStorage';

export type MissionDefinitionId =
  | 'free-range'
  | 'survey-signal'
  | 'salvage-cache'
  | 'enemy-probe'
  | 'mothership-contract'
  | 'rift-cache-contract';
export type MissionDifficulty = 'Low' | 'Medium' | 'High';
export type MissionObjectiveType = 'free-range' | 'reach-location' | 'destroy-world-event' | 'complete-rare-event';

export interface MissionDefinition {
  id: MissionDefinitionId;
  displayName: string;
  shortName: string;
  description: string;
  objectiveType: MissionObjectiveType;
  objectiveLabel: string;
  difficulty: MissionDifficulty;
  rewardPreview: string;
  preferredRegionTypes: SectorRegionType[];
  objectiveRadius: number;
  guaranteedWorldEventId?: WorldEventDefinitionId;
  guaranteedRareEventId?: RareEventDefinitionId;
  rewardUnlockHooks?: RewardHookId[];
}

export const DEFAULT_MISSION_ID: MissionDefinitionId = 'free-range';

export const missionRegistry: MissionDefinition[] = [
  {
    id: 'free-range',
    displayName: 'Free Range',
    shortName: 'Free',
    description: 'Enter the sector, choose your own route, and eject when satisfied.',
    objectiveType: 'free-range',
    objectiveLabel: 'Open sector',
    difficulty: 'Low',
    rewardPreview: 'Keep what you bring home',
    preferredRegionTypes: [],
    objectiveRadius: 0
  },
  {
    id: 'survey-signal',
    displayName: 'Survey Signal',
    shortName: 'Survey',
    description: 'Locate and scan a high-signal sector marker.',
    objectiveType: 'reach-location',
    objectiveLabel: 'Survey point',
    difficulty: 'Low',
    rewardPreview: 'Credits + route data',
    preferredRegionTypes: ['anomaly-signal', 'salvage-field'],
    objectiveRadius: 118,
    rewardUnlockHooks: ['mission.survey-signal']
  },
  {
    id: 'salvage-cache',
    displayName: 'Salvage Cache',
    shortName: 'Salvage',
    description: 'Find a marked cache inside a resource-rich region.',
    objectiveType: 'reach-location',
    objectiveLabel: 'Cache marker',
    difficulty: 'Medium',
    rewardPreview: 'Scrap + upgrade lead',
    preferredRegionTypes: ['salvage-field', 'asteroid-belt'],
    objectiveRadius: 108,
    rewardUnlockHooks: ['mission.salvage-cache']
  },
  {
    id: 'enemy-probe',
    displayName: 'Enemy Probe',
    shortName: 'Probe',
    description: 'Reach an enemy-territory probe before ending the run.',
    objectiveType: 'reach-location',
    objectiveLabel: 'Probe marker',
    difficulty: 'High',
    rewardPreview: 'Credits + threat intel',
    preferredRegionTypes: ['enemy-territory', 'anomaly-signal'],
    objectiveRadius: 104,
    rewardUnlockHooks: ['mission.enemy-probe']
  },
  {
    id: 'mothership-contract',
    displayName: 'Mothership Contract',
    shortName: 'Mothership',
    description: 'Destroy a prototype mothership generated with the sector.',
    objectiveType: 'destroy-world-event',
    objectiveLabel: 'Mothership',
    difficulty: 'High',
    rewardPreview: 'Scrap + weapon lead',
    preferredRegionTypes: ['enemy-territory', 'anomaly-signal'],
    objectiveRadius: 180,
    guaranteedWorldEventId: 'mothership-prototype',
    rewardUnlockHooks: ['mission.mothership-contract']
  },
  {
    id: 'rift-cache-contract',
    displayName: 'Rift Cache Contract',
    shortName: 'Rift Cache',
    description: 'Investigate a rare black-hole cache generated with the sector.',
    objectiveType: 'complete-rare-event',
    objectiveLabel: 'Rift cache',
    difficulty: 'High',
    rewardPreview: 'Scrap + scanner lead',
    preferredRegionTypes: ['anomaly-signal', 'salvage-field'],
    objectiveRadius: 360,
    guaranteedRareEventId: 'unstable-black-hole-cache',
    rewardUnlockHooks: ['mission.rift-cache-contract', 'sector-scanner.black-hole-cache']
  }
];

export function getMissionDefinition(id: MissionDefinitionId): MissionDefinition {
  return missionRegistry.find((mission) => mission.id === id) ?? missionRegistry[0];
}

export function isMissionDefinitionId(value: string): value is MissionDefinitionId {
  return missionRegistry.some((mission) => mission.id === value);
}
