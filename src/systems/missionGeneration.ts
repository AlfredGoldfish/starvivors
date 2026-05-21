import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import type { MissionDefinition } from '../data/missions';
import { getWrappedDistance, type SectorLayout, type SectorRegion } from './sectorGeneration';

export interface MissionObjective {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  regionId: string;
}

export interface GenerateMissionObjectiveInput {
  arena: ArenaSize;
  sector: SectorLayout;
  mission: MissionDefinition;
  seed: string;
  startX: number;
  startY: number;
}

export function generateMissionObjective(input: GenerateMissionObjectiveInput): MissionObjective {
  const random = new Phaser.Math.RandomDataGenerator([`${input.seed}-${input.mission.id}-mission`]);
  const region = chooseMissionRegion(input, random);
  const minStartDistance = Math.min(input.arena.width, input.arena.height) * 0.18;
  const maxDistanceFromCenter = region.radius * 0.68;
  let x = region.x;
  let y = region.y;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const angle = random.realInRange(0, Math.PI * 2);
    const distance = random.realInRange(region.radius * 0.18, maxDistanceFromCenter);
    const candidateX = wrapCoordinate(region.x + Math.cos(angle) * distance, input.arena.width);
    const candidateY = wrapCoordinate(region.y + Math.sin(angle) * distance, input.arena.height);

    x = candidateX;
    y = candidateY;

    if (getWrappedDistance(input.arena, input.startX, input.startY, x, y) >= minStartDistance) {
      break;
    }
  }

  return {
    id: `${input.mission.id}-objective`,
    label: input.mission.objectiveLabel,
    x,
    y,
    radius: input.mission.objectiveRadius,
    regionId: region.id
  };
}

function chooseMissionRegion(input: GenerateMissionObjectiveInput, random: Phaser.Math.RandomDataGenerator): SectorRegion {
  const preferredRegions = input.sector.regions.filter((region) => input.mission.preferredRegionTypes.includes(region.type));
  const candidateRegions = preferredRegions.length > 0
    ? preferredRegions
    : input.sector.regions.filter((region) => region.type !== 'safe-drift');

  if (candidateRegions.length === 0) {
    return input.sector.regions[0] ?? {
      id: 'mission-fallback-region',
      type: 'safe-drift',
      label: 'Mission Fallback',
      x: input.startX,
      y: input.startY,
      radius: Math.min(input.arena.width, input.arena.height) * 0.2,
      danger: 0,
      resource: 0,
      signalStrength: 0
    };
  }

  return candidateRegions[random.integerInRange(0, candidateRegions.length - 1)];
}
