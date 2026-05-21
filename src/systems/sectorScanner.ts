import Phaser from 'phaser';
import { getWrappedDistance } from './sectorGeneration';
import type { ArenaSize } from '../core/arena';
import type { RareEventMinimapMarker } from './rareEventRuntime';
import type { SectorScannerLevel } from './progressionStorage';

export const SECTOR_SCANNER_SCAN_MS = 5 * 60 * 1000;

export interface SectorScannerTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: 'world-event' | 'rare-event';
  status: string;
  minimapMarker?: RareEventMinimapMarker;
}

export interface SectorScannerRuntime {
  scanElapsedMs: number;
  targetId: string | null;
  targetLabel: string | null;
  completed: boolean;
}

export interface SectorScannerSnapshot {
  level: SectorScannerLevel;
  available: boolean;
  scanElapsedMs: number;
  scanProgress: number;
  completed: boolean;
  targetLabel: string | null;
  showArrow: boolean;
  showMinimap: boolean;
}

export function createSectorScannerRuntime(): SectorScannerRuntime {
  return {
    scanElapsedMs: 0,
    targetId: null,
    targetLabel: null,
    completed: false
  };
}

export function updateSectorScannerRuntime(
  runtime: SectorScannerRuntime,
  level: SectorScannerLevel,
  deltaSeconds: number,
  targets: SectorScannerTarget[],
  playerX: number,
  playerY: number,
  arena: ArenaSize
): void {
  if (level <= 0 || runtime.completed || deltaSeconds <= 0 || targets.length <= 0) {
    return;
  }

  runtime.scanElapsedMs = Math.min(SECTOR_SCANNER_SCAN_MS, runtime.scanElapsedMs + deltaSeconds * 1000);
  if (runtime.scanElapsedMs < SECTOR_SCANNER_SCAN_MS) {
    return;
  }

  const target = chooseNearestScannerTarget(targets, playerX, playerY, arena);
  runtime.completed = true;
  runtime.targetId = target?.id ?? null;
  runtime.targetLabel = target?.label ?? null;
}

export function getSectorScannerSnapshot(
  runtime: SectorScannerRuntime,
  level: SectorScannerLevel,
  available: boolean
): SectorScannerSnapshot {
  const completed = level > 0 && runtime.completed;

  return {
    level,
    available,
    scanElapsedMs: runtime.scanElapsedMs,
    scanProgress: Phaser.Math.Clamp(runtime.scanElapsedMs / SECTOR_SCANNER_SCAN_MS, 0, 1),
    completed,
    targetLabel: runtime.targetLabel,
    showArrow: completed && level >= 2,
    showMinimap: completed && level >= 3
  };
}

export function getSectorScannerTarget(
  runtime: SectorScannerRuntime,
  targets: SectorScannerTarget[]
): SectorScannerTarget | undefined {
  if (!runtime.targetId) {
    return undefined;
  }

  return targets.find((target) => target.id === runtime.targetId);
}

function chooseNearestScannerTarget(
  targets: SectorScannerTarget[],
  playerX: number,
  playerY: number,
  arena: ArenaSize
): SectorScannerTarget | undefined {
  return [...targets].sort(
    (first, second) =>
      getWrappedDistance(arena, playerX, playerY, first.x, first.y) -
      getWrappedDistance(arena, playerX, playerY, second.x, second.y)
  )[0];
}
