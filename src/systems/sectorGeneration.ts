import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';

export type SectorRegionType =
  | 'safe-drift'
  | 'salvage-field'
  | 'asteroid-belt'
  | 'enemy-territory'
  | 'anomaly-signal';

export interface SectorRegion {
  id: string;
  type: SectorRegionType;
  label: string;
  x: number;
  y: number;
  radius: number;
  danger: number;
  resource: number;
  signalStrength: number;
}

export interface SectorLayout {
  seed: string;
  regions: SectorRegion[];
}

export interface GenerateSectorLayoutInput {
  arena: ArenaSize;
  seed: string;
  startX: number;
  startY: number;
}

const REGION_SEQUENCE: Array<Omit<SectorRegion, 'id' | 'x' | 'y' | 'radius'>> = [
  {
    type: 'safe-drift',
    label: 'Quiet Drift',
    danger: 0.08,
    resource: 0.16,
    signalStrength: 0.28
  },
  {
    type: 'salvage-field',
    label: 'Salvage Field',
    danger: 0.28,
    resource: 0.86,
    signalStrength: 0.62
  },
  {
    type: 'asteroid-belt',
    label: 'Asteroid Belt',
    danger: 0.48,
    resource: 0.58,
    signalStrength: 0.46
  },
  {
    type: 'enemy-territory',
    label: 'Enemy Territory',
    danger: 0.82,
    resource: 0.44,
    signalStrength: 0.72
  },
  {
    type: 'anomaly-signal',
    label: 'Anomaly Signal',
    danger: 0.62,
    resource: 0.68,
    signalStrength: 1
  },
  {
    type: 'salvage-field',
    label: 'Wreckage Pocket',
    danger: 0.36,
    resource: 0.74,
    signalStrength: 0.54
  },
  {
    type: 'asteroid-belt',
    label: 'Outer Stones',
    danger: 0.52,
    resource: 0.5,
    signalStrength: 0.42
  }
];

export function generateSectorLayout(input: GenerateSectorLayoutInput): SectorLayout {
  const random = new Phaser.Math.RandomDataGenerator([input.seed]);
  const minDimension = Math.min(input.arena.width, input.arena.height);
  const quietRadius = Phaser.Math.Clamp(minDimension * 0.07, 480, 980);
  const regions: SectorRegion[] = [
    {
      ...REGION_SEQUENCE[0],
      id: 'safe-drift-1',
      x: input.startX,
      y: input.startY,
      radius: quietRadius
    }
  ];

  for (let index = 1; index < REGION_SEQUENCE.length; index += 1) {
    const template = REGION_SEQUENCE[index];
    const angle = (Math.PI * 2 * (index - 1)) / (REGION_SEQUENCE.length - 1) + random.realInRange(-0.26, 0.26);
    const ringDistance = minDimension * random.realInRange(0.24, 0.43);
    const radius = Phaser.Math.Clamp(minDimension * random.realInRange(0.055, 0.092), 440, 1040);
    let x = wrapCoordinate(input.startX + Math.cos(angle) * ringDistance, input.arena.width);
    let y = wrapCoordinate(input.startY + Math.sin(angle) * ringDistance, input.arena.height);

    if (getWrappedDistance(input.arena, input.startX, input.startY, x, y) < quietRadius + radius + 220) {
      x = wrapCoordinate(input.startX + Math.cos(angle) * (quietRadius + radius + 260), input.arena.width);
      y = wrapCoordinate(input.startY + Math.sin(angle) * (quietRadius + radius + 260), input.arena.height);
    }

    regions.push({
      ...template,
      id: `${template.type}-${index}`,
      x,
      y,
      radius
    });
  }

  return { seed: input.seed, regions };
}

export function getSectorRegionColor(type: SectorRegionType): number {
  switch (type) {
    case 'safe-drift':
      return 0x73f2ff;
    case 'salvage-field':
      return 0xffc857;
    case 'asteroid-belt':
      return 0x9fd8ff;
    case 'enemy-territory':
      return 0xff5964;
    case 'anomaly-signal':
      return 0xb48cff;
  }
}

export function getWrappedDistance(arena: ArenaSize, fromX: number, fromY: number, toX: number, toY: number): number {
  let x = toX - fromX;
  let y = toY - fromY;

  if (Math.abs(x) > arena.width / 2) {
    x -= Math.sign(x) * arena.width;
  }

  if (Math.abs(y) > arena.height / 2) {
    y -= Math.sign(y) * arena.height;
  }

  return Math.hypot(x, y);
}
