import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  getRareEventDefinition,
  rareEventRegistry,
  type RareEventDefinition,
  type RareEventDefinitionId
} from '../data/rareEvents';
import { getWrappedDistance, type SectorLayout, type SectorRegion } from './sectorGeneration';

export interface GeneratedRareEvent {
  id: string;
  definitionId: RareEventDefinitionId;
  x: number;
  y: number;
  regionId: string;
  source: 'ambient' | 'contract' | 'debug';
}

export interface GenerateRareEventsInput {
  arena: ArenaSize;
  sector: SectorLayout;
  seed: string;
  startX: number;
  startY: number;
  guaranteedEventIds: RareEventDefinitionId[];
  forcedEventIds: RareEventDefinitionId[];
}

export function generateRareEvents(input: GenerateRareEventsInput): GeneratedRareEvent[] {
  const random = new Phaser.Math.RandomDataGenerator([`${input.seed}-rare-events`]);
  const events: GeneratedRareEvent[] = [];
  const selectedIds = new Set<RareEventDefinitionId>();

  for (const definitionId of input.guaranteedEventIds) {
    selectedIds.add(definitionId);
    events.push(createGeneratedRareEvent(input, getRareEventDefinition(definitionId), events.length, 'contract', random));
  }

  for (const definitionId of input.forcedEventIds) {
    if (selectedIds.has(definitionId)) {
      continue;
    }
    selectedIds.add(definitionId);
    events.push(createGeneratedRareEvent(input, getRareEventDefinition(definitionId), events.length, 'debug', random));
  }

  if (events.length <= 0) {
    const ambient = rollAmbientRareEvent(random);
    if (ambient) {
      selectedIds.add(ambient.id);
      events.push(createGeneratedRareEvent(input, ambient, events.length, 'ambient', random));
    }
  }

  return events;
}

function rollAmbientRareEvent(random: Phaser.Math.RandomDataGenerator): RareEventDefinition | undefined {
  const candidates = rareEventRegistry.filter((event) => random.frac() <= event.ambientSpawnChance);
  if (candidates.length <= 0) {
    return undefined;
  }

  const totalWeight = candidates.reduce((sum, event) => sum + event.rarityWeight, 0);
  let roll = random.frac() * totalWeight;
  for (const event of candidates) {
    roll -= event.rarityWeight;
    if (roll <= 0) {
      return event;
    }
  }

  return candidates[candidates.length - 1];
}

function createGeneratedRareEvent(
  input: GenerateRareEventsInput,
  definition: RareEventDefinition,
  index: number,
  source: GeneratedRareEvent['source'],
  random: Phaser.Math.RandomDataGenerator
): GeneratedRareEvent {
  const region = chooseRareEventRegion(input.sector, definition.preferredRegionTypes, random);
  const position = chooseRareEventPosition(input, region, definition, random);

  return {
    id: `${definition.id}-${source}-${index + 1}`,
    definitionId: definition.id,
    x: position.x,
    y: position.y,
    regionId: region.id,
    source
  };
}

function chooseRareEventRegion(
  sector: SectorLayout,
  preferredRegionTypes: SectorRegion['type'][],
  random: Phaser.Math.RandomDataGenerator
): SectorRegion {
  const preferred = sector.regions.filter((region) => preferredRegionTypes.includes(region.type));
  const candidates = preferred.length > 0 ? preferred : sector.regions.filter((region) => region.type !== 'safe-drift');

  return candidates[random.integerInRange(0, candidates.length - 1)] ?? sector.regions[0];
}

function chooseRareEventPosition(
  input: GenerateRareEventsInput,
  region: SectorRegion,
  definition: RareEventDefinition,
  random: Phaser.Math.RandomDataGenerator
): { x: number; y: number } {
  const minStartDistance = Math.min(input.arena.width, input.arena.height) * 0.3;
  let x = region.x;
  let y = region.y;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const angle = random.realInRange(0, Math.PI * 2);
    const distance = random.realInRange(region.radius * 0.22, region.radius * 0.72);
    x = wrapCoordinate(region.x + Math.cos(angle) * distance, input.arena.width);
    y = wrapCoordinate(region.y + Math.sin(angle) * distance, input.arena.height);

    if (
      getWrappedDistance(input.arena, input.startX, input.startY, x, y) >=
      Math.max(minStartDistance, definition.dangerRadius * 0.88)
    ) {
      return { x, y };
    }
  }

  return { x, y };
}
