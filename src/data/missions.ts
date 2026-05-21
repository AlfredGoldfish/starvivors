import type { SectorRegionType } from '../systems/sectorGeneration';
import type { WorldEventDefinitionId } from './worldEvents';

export type MissionDefinitionId = 'survey-signal' | 'salvage-cache' | 'enemy-probe' | 'mothership-contract';
export type MissionDifficulty = 'Low' | 'Medium' | 'High';
export type MissionObjectiveType = 'reach-location' | 'destroy-world-event';

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
}

export const DEFAULT_MISSION_ID: MissionDefinitionId = 'survey-signal';

export const missionRegistry: MissionDefinition[] = [
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
    objectiveRadius: 118
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
    objectiveRadius: 108
  },
  {
    id: 'enemy-probe',
    displayName: 'Enemy Probe',
    shortName: 'Probe',
    description: 'Reach an enemy-territory probe before extracting.',
    objectiveType: 'reach-location',
    objectiveLabel: 'Probe marker',
    difficulty: 'High',
    rewardPreview: 'Credits + threat intel',
    preferredRegionTypes: ['enemy-territory', 'anomaly-signal'],
    objectiveRadius: 104
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
    guaranteedWorldEventId: 'mothership-prototype'
  }
];

export function getMissionDefinition(id: MissionDefinitionId): MissionDefinition {
  return missionRegistry.find((mission) => mission.id === id) ?? missionRegistry[0];
}

export function isMissionDefinitionId(value: string): value is MissionDefinitionId {
  return missionRegistry.some((mission) => mission.id === value);
}
