import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import { getWorldEventDefinition, type WorldEventDefinitionId } from '../data/worldEvents';
import { getWrappedDistance, type SectorLayout, type SectorRegion } from './sectorGeneration';

export interface GeneratedWorldEvent {
  id: string;
  definitionId: WorldEventDefinitionId;
  x: number;
  y: number;
  regionId: string;
  source: 'ambient' | 'contract';
}

export interface GenerateWorldEventsInput {
  arena: ArenaSize;
  sector: SectorLayout;
  seed: string;
  startX: number;
  startY: number;
  guaranteedEventIds: WorldEventDefinitionId[];
}

export function generateWorldEvents(input: GenerateWorldEventsInput): GeneratedWorldEvent[] {
  const random = new Phaser.Math.RandomDataGenerator([`${input.seed}-world-events`]);
  const events: GeneratedWorldEvent[] = [];

  for (let index = 0; index < input.guaranteedEventIds.length; index += 1) {
    const definition = getWorldEventDefinition(input.guaranteedEventIds[index]);
    const region = chooseWorldEventRegion(input.sector, definition.preferredRegionTypes, random);
    const position = chooseWorldEventPosition(input, region, random);

    events.push({
      id: `${definition.id}-${index + 1}`,
      definitionId: definition.id,
      x: position.x,
      y: position.y,
      regionId: region.id,
      source: 'contract'
    });
  }

  if (events.length === 0) {
    const definition = getWorldEventDefinition('mothership-prototype');
    const region = chooseWorldEventRegion(input.sector, definition.preferredRegionTypes, random);
    const position = chooseWorldEventPosition(input, region, random);

    events.push({
      id: `${definition.id}-ambient-1`,
      definitionId: definition.id,
      x: position.x,
      y: position.y,
      regionId: region.id,
      source: 'ambient'
    });
  }

  return events;
}

function chooseWorldEventRegion(
  sector: SectorLayout,
  preferredRegionTypes: SectorRegion['type'][],
  random: Phaser.Math.RandomDataGenerator
): SectorRegion {
  const preferred = sector.regions.filter((region) => preferredRegionTypes.includes(region.type));
  const candidates = preferred.length > 0 ? preferred : sector.regions.filter((region) => region.type !== 'safe-drift');

  return candidates[random.integerInRange(0, candidates.length - 1)] ?? sector.regions[0];
}

function chooseWorldEventPosition(
  input: GenerateWorldEventsInput,
  region: SectorRegion,
  random: Phaser.Math.RandomDataGenerator
): { x: number; y: number } {
  const minStartDistance = Math.min(input.arena.width, input.arena.height) * 0.26;
  let x = region.x;
  let y = region.y;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    const angle = random.realInRange(0, Math.PI * 2);
    const distance = random.realInRange(region.radius * 0.18, region.radius * 0.62);
    x = wrapCoordinate(region.x + Math.cos(angle) * distance, input.arena.width);
    y = wrapCoordinate(region.y + Math.sin(angle) * distance, input.arena.height);

    if (getWrappedDistance(input.arena, input.startX, input.startY, x, y) >= minStartDistance) {
      return { x, y };
    }
  }

  return { x, y };
}
