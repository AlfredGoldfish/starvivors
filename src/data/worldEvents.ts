import type { EncounterDefinitionId } from './encounters';
import type { SectorRegionType } from '../systems/sectorGeneration';
import type { RewardHookId } from '../systems/progressionStorage';

export type WorldEventDefinitionId = 'mothership-prototype';
export type WorldEventKind = 'mothership' | 'stronghold';

export interface WorldEventDefinition {
  id: WorldEventDefinitionId;
  displayName: string;
  shortName: string;
  kind: WorldEventKind;
  description: string;
  preferredRegionTypes: SectorRegionType[];
  hp: number;
  hitRadius: number;
  dangerRadius: number;
  rewardScrap: number;
  rewardUpgradeCrates: number;
  rewardUnlockHooks?: RewardHookId[];
  guardSquadIds: EncounterDefinitionId[];
}

export const worldEventRegistry: WorldEventDefinition[] = [
  {
    id: 'mothership-prototype',
    displayName: 'Prototype Mothership',
    shortName: 'Mothership',
    kind: 'mothership',
    description: 'A heavy command ship anchoring a dangerous sector event.',
    preferredRegionTypes: ['enemy-territory', 'anomaly-signal'],
    hp: 2600,
    hitRadius: 148,
    dangerRadius: 1180,
    rewardScrap: 120,
    rewardUpgradeCrates: 2,
    rewardUnlockHooks: ['world-event.mothership-prototype'],
    guardSquadIds: ['gunner-escort', 'strike-wing']
  }
];

export function getWorldEventDefinition(id: WorldEventDefinitionId): WorldEventDefinition {
  return worldEventRegistry.find((event) => event.id === id) ?? worldEventRegistry[0];
}
