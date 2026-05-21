import type { EncounterDefinitionId } from './encounters';
import type { SectorRegionType } from '../systems/sectorGeneration';

export type RareEventDefinitionId = 'unstable-black-hole-cache' | 'hunter-swarm';
export type RareEventKind = 'black-hole' | 'swarm';
export type RareEventCompletionType = 'investigate' | 'defeat-squad';

export interface RareEventDefinition {
  id: RareEventDefinitionId;
  displayName: string;
  shortName: string;
  kind: RareEventKind;
  description: string;
  preferredRegionTypes: SectorRegionType[];
  rarityWeight: number;
  ambientSpawnChance: number;
  signalRadius: number;
  dangerRadius: number;
  objectiveRadius: number;
  completionType: RareEventCompletionType;
  investigationMs: number;
  rewardScrap: number;
  rewardUpgradeCrates: number;
  rewardUnlockHooks: string[];
  squadIds: EncounterDefinitionId[];
}

export const rareEventRegistry: RareEventDefinition[] = [
  {
    id: 'unstable-black-hole-cache',
    displayName: 'Unstable Black-Hole Cache',
    shortName: 'Rift Cache',
    kind: 'black-hole',
    description: 'A dangerous salvage cache caught in the wake of a black-hole anomaly.',
    preferredRegionTypes: ['anomaly-signal', 'salvage-field'],
    rarityWeight: 42,
    ambientSpawnChance: 0.28,
    signalRadius: 1650,
    dangerRadius: 980,
    objectiveRadius: 360,
    completionType: 'investigate',
    investigationMs: 5200,
    rewardScrap: 96,
    rewardUpgradeCrates: 1,
    rewardUnlockHooks: ['sector-scanner.black-hole-cache'],
    squadIds: ['sniper-screen']
  },
  {
    id: 'hunter-swarm',
    displayName: 'Hunter Swarm',
    shortName: 'Hunters',
    kind: 'swarm',
    description: 'A rare themed strike group guarding a high-value route marker.',
    preferredRegionTypes: ['enemy-territory', 'anomaly-signal'],
    rarityWeight: 58,
    ambientSpawnChance: 0.2,
    signalRadius: 1480,
    dangerRadius: 1120,
    objectiveRadius: 520,
    completionType: 'defeat-squad',
    investigationMs: 0,
    rewardScrap: 72,
    rewardUpgradeCrates: 1,
    rewardUnlockHooks: ['sector-scanner.hunter-swarm'],
    squadIds: ['strike-wing', 'gunner-escort']
  }
];

export function getRareEventDefinition(id: RareEventDefinitionId): RareEventDefinition {
  return rareEventRegistry.find((event) => event.id === id) ?? rareEventRegistry[0];
}

export function isRareEventDefinitionId(value: string): value is RareEventDefinitionId {
  return rareEventRegistry.some((event) => event.id === value);
}
