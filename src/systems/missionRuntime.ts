import type { WorldEventDefinitionId } from '../data/worldEvents';
import type { RareEventDefinitionId } from '../data/rareEvents';
import type { MissionDefinition } from '../data/missions';
import type { ArenaSize } from '../core/arena';
import type { SectorLayout } from './sectorGeneration';
import { generateMissionObjective, type MissionObjective } from './missionGeneration';

export type MissionStatus = 'active' | 'completed' | 'failed';
export type MissionFailureReason = 'player-death' | 'run-ended';

export interface MissionRuntimeState {
  definition: MissionDefinition;
  objective: MissionObjective;
  status: MissionStatus;
  completedAt: number | null;
  failedAt: number | null;
  failureReason: MissionFailureReason | null;
  targetWorldEventId: string | null;
  targetRareEventId: string | null;
}

export interface MissionRuntimeWorldEventTarget {
  id: string;
  definition: {
    id: WorldEventDefinitionId;
    shortName: string;
    hitRadius: number;
  };
  x: number;
  y: number;
  regionId: string;
}

export interface MissionRuntimeRareEventTarget {
  id: string;
  definition: {
    id: RareEventDefinitionId;
    shortName: string;
    objectiveRadius: number;
  };
  x: number;
  y: number;
  regionId: string;
}

export interface CreateMissionRuntimeInput {
  definition: MissionDefinition;
  arena: ArenaSize;
  sector: SectorLayout;
  seed: string;
  startX: number;
  startY: number;
  worldEvents: MissionRuntimeWorldEventTarget[];
  rareEvents: MissionRuntimeRareEventTarget[];
}

export function createMissionRuntime(input: CreateMissionRuntimeInput): MissionRuntimeState | undefined {
  const definition = input.definition;
  if (definition.objectiveType === 'free-range') {
    return undefined;
  }

  const targetWorldEvent = definition.guaranteedWorldEventId
    ? input.worldEvents.find((event) => event.definition.id === definition.guaranteedWorldEventId)
    : undefined;
  const targetRareEvent = definition.guaranteedRareEventId
    ? input.rareEvents.find((event) => event.definition.id === definition.guaranteedRareEventId)
    : undefined;
  const objective = targetWorldEvent
    ? {
        id: `${targetWorldEvent.id}-objective`,
        label: targetWorldEvent.definition.shortName,
        x: targetWorldEvent.x,
        y: targetWorldEvent.y,
        radius: targetWorldEvent.definition.hitRadius + 58,
        regionId: targetWorldEvent.regionId
      }
    : targetRareEvent
      ? {
          id: `${targetRareEvent.id}-objective`,
          label: targetRareEvent.definition.shortName,
          x: targetRareEvent.x,
          y: targetRareEvent.y,
          radius: targetRareEvent.definition.objectiveRadius,
          regionId: targetRareEvent.regionId
        }
      : generateMissionObjective({
          arena: input.arena,
          sector: input.sector,
          mission: definition,
          seed: input.seed,
          startX: input.startX,
          startY: input.startY
        });

  return {
    definition,
    objective,
    status: 'active',
    completedAt: null,
    failedAt: null,
    failureReason: null,
    targetWorldEventId: targetWorldEvent?.id ?? null,
    targetRareEventId: targetRareEvent?.id ?? null
  };
}
