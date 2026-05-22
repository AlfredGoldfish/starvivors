import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  ASTEROID_SAFE_SPAWN_RADIUS,
  ASTEROID_TIER_CONFIG,
  BASIC_ASTEROID_COUNT
} from '../scenes/gameConstants';
import type {
  AsteroidBreakupProfile,
  AsteroidTier,
  BasicAsteroid,
  ScrapPickup
} from '../scenes/gameTypes';
import {
  getWrappedDistance,
  type SectorLayout,
  type SectorRegion
} from './sectorGeneration';

export interface SectorAsteroidSpawn {
  id: string;
  regionId: string;
  x: number;
  y: number;
  tier: AsteroidTier;
  hp: number;
  velocity: Phaser.Math.Vector2;
  breakupProfile?: AsteroidBreakupProfile;
  destroyed: boolean;
}

export interface SectorScrapSpawn {
  id: string;
  regionId: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
}

export interface SectorSignalSpawn {
  id: string;
  region: SectorRegion;
}

export interface CreateSectorAsteroidSpawnsInput {
  arena: ArenaSize;
  layout: SectorLayout;
  seed: string;
  center: Phaser.Math.Vector2;
}

export interface CreateSectorScrapSpawnsInput {
  arena: ArenaSize;
  layout: SectorLayout;
  seed: string;
}

export function createSectorAsteroidSpawns(input: CreateSectorAsteroidSpawnsInput): SectorAsteroidSpawn[] {
  const random = new Phaser.Math.RandomDataGenerator([`${input.seed}-asteroids`]);
  const spawns: SectorAsteroidSpawn[] = [];

  for (const region of input.layout.regions) {
    const count = getSectorAsteroidSpawnCount(region);

    for (let index = 0; index < count; index += 1) {
      const position = getRandomPointInSectorRegion(input.arena, region, random);
      if (getWrappedDistance(input.arena, input.center.x, input.center.y, position.x, position.y) < ASTEROID_SAFE_SPAWN_RADIUS) {
        continue;
      }

      spawns.push(createSectorAsteroidSpawn(region, position, getSectorAsteroidTier(region, random), random, spawns.length));
    }
  }

  while (spawns.length < BASIC_ASTEROID_COUNT) {
    const fallbackRegion = input.layout.regions.find((region) => region.type === 'asteroid-belt') ?? input.layout.regions[0];
    const position = getRandomPointInSectorRegion(input.arena, fallbackRegion, random);
    if (getWrappedDistance(input.arena, input.center.x, input.center.y, position.x, position.y) >= ASTEROID_SAFE_SPAWN_RADIUS) {
      spawns.push(createSectorAsteroidSpawn(fallbackRegion, position, getSectorAsteroidTier(fallbackRegion, random), random, spawns.length));
    }
  }

  return spawns;
}

export function createSectorScrapSpawns(input: CreateSectorScrapSpawnsInput): SectorScrapSpawn[] {
  const random = new Phaser.Math.RandomDataGenerator([`${input.seed}-scrap`]);
  const spawns: SectorScrapSpawn[] = [];

  for (const region of input.layout.regions) {
    const count = getSectorScrapSpawnCount(region);

    for (let index = 0; index < count; index += 1) {
      const position = getRandomPointInSectorRegion(input.arena, region, random);
      spawns.push({
        id: `${region.id}-scrap-${spawns.length}`,
        regionId: region.id,
        x: position.x,
        y: position.y,
        value: region.type === 'salvage-field' ? random.between(12, 22) : random.between(8, 16),
        collected: false
      });
    }
  }

  return spawns;
}

export function createSectorSignalSpawns(layout: SectorLayout): SectorSignalSpawn[] {
  return layout.regions
    .filter((region) => region.signalStrength >= 0.5)
    .map((region) => ({
      id: `${region.id}-signal`,
      region
    }));
}

export function getRandomPointInSectorRegion(
  arena: ArenaSize,
  region: SectorRegion,
  random: Phaser.Math.RandomDataGenerator
): Phaser.Math.Vector2 {
  const angle = random.realInRange(0, Math.PI * 2);
  const distance = region.radius * Math.sqrt(random.realInRange(0.08, 0.92));

  return new Phaser.Math.Vector2(
    wrapCoordinate(region.x + Math.cos(angle) * distance, arena.width),
    wrapCoordinate(region.y + Math.sin(angle) * distance, arena.height)
  );
}

export function markSectorAsteroidSpawnDestroyed(
  spawns: SectorAsteroidSpawn[],
  activeAsteroids: Map<string, BasicAsteroid>,
  asteroidIds: WeakMap<BasicAsteroid, string>,
  asteroid: BasicAsteroid
): void {
  const id = asteroidIds.get(asteroid);
  if (!id) {
    return;
  }

  const spawn = spawns.find((candidate) => candidate.id === id);
  if (spawn) {
    spawn.destroyed = true;
  }

  activeAsteroids.delete(id);
}

export function markSectorScrapSpawnCollected(
  spawns: SectorScrapSpawn[],
  activeScrapPickups: Map<string, ScrapPickup>,
  scrapIds: WeakMap<ScrapPickup, string>,
  scrap: ScrapPickup
): void {
  const id = scrapIds.get(scrap);
  if (!id) {
    return;
  }

  const spawn = spawns.find((candidate) => candidate.id === id);
  if (spawn) {
    spawn.collected = true;
  }

  activeScrapPickups.delete(id);
}

function createSectorAsteroidSpawn(
  region: SectorRegion,
  position: Phaser.Math.Vector2,
  tier: AsteroidTier,
  random: Phaser.Math.RandomDataGenerator,
  index: number
): SectorAsteroidSpawn {
  return {
    id: `${region.id}-asteroid-${index}`,
    regionId: region.id,
    x: position.x,
    y: position.y,
    tier,
    hp: ASTEROID_TIER_CONFIG[tier].hp,
    velocity: createSectorAsteroidVelocity(tier, random),
    destroyed: false
  };
}

function createSectorAsteroidVelocity(tier: AsteroidTier, random: Phaser.Math.RandomDataGenerator): Phaser.Math.Vector2 {
  const tierConfig = ASTEROID_TIER_CONFIG[tier];
  const driftAngle = random.realInRange(0, Math.PI * 2);
  const driftSpeed = random.realInRange(tierConfig.minSpeed, tierConfig.maxSpeed);

  return new Phaser.Math.Vector2(Math.cos(driftAngle) * driftSpeed, Math.sin(driftAngle) * driftSpeed);
}

function getSectorAsteroidSpawnCount(region: SectorRegion): number {
  if (region.type === 'asteroid-belt') {
    return 5;
  }

  if (region.type === 'anomaly-signal') {
    return 3;
  }

  if (region.type === 'salvage-field' || region.type === 'enemy-territory') {
    return 2;
  }

  return 0;
}

function getSectorScrapSpawnCount(region: SectorRegion): number {
  if (region.type === 'salvage-field') {
    return 5;
  }

  if (region.type === 'anomaly-signal') {
    return 3;
  }

  if (region.type === 'enemy-territory') {
    return 2;
  }

  return 0;
}

function getSectorAsteroidTier(region: SectorRegion, random: Phaser.Math.RandomDataGenerator): AsteroidTier {
  if (region.type === 'asteroid-belt') {
    return ([2, 3, 3, 4, 4, 5] as AsteroidTier[])[random.between(0, 5)];
  }

  if (region.type === 'anomaly-signal' || region.type === 'enemy-territory') {
    return ([2, 3, 4, 4] as AsteroidTier[])[random.between(0, 3)];
  }

  return ([1, 2, 2, 3] as AsteroidTier[])[random.between(0, 3)];
}
