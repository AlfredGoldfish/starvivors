import Phaser from 'phaser';
import type { RareEventDefinition, RareEventKind } from '../data/rareEvents';
import type { GeneratedRareEvent } from './rareEventGeneration';

export type RareEventStatus = 'active' | 'completed';

export interface RareEventInstance {
  id: string;
  definition: RareEventDefinition;
  x: number;
  y: number;
  regionId: string;
  source: GeneratedRareEvent['source'];
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  status: RareEventStatus;
  investigationProgressMs: number;
  activeEnemyIds: string[];
  squadSpawned: boolean;
  rewardDropped: boolean;
  unlockHooksResolved: boolean;
}

export interface RareEventMinimapMarker {
  x: number;
  y: number;
  signalRadius: number;
  dangerRadius: number;
  objectiveRadius: number;
  status: RareEventStatus;
  kind: RareEventKind;
  progress: number;
}

export function getRareEventProgress(event: RareEventInstance): number {
  if (event.status === 'completed') {
    return 1;
  }

  if (event.definition.investigationMs <= 0) {
    return event.squadSpawned ? 0.5 : 0;
  }

  return Phaser.Math.Clamp(event.investigationProgressMs / event.definition.investigationMs, 0, 1);
}

export function updateRareEventInvestigationProgress(
  event: RareEventInstance,
  playerDistance: number,
  deltaSeconds: number
): boolean {
  if (event.definition.completionType !== 'investigate') {
    return false;
  }

  if (playerDistance <= event.definition.objectiveRadius) {
    event.investigationProgressMs += deltaSeconds * 1000;
    return event.investigationProgressMs >= event.definition.investigationMs;
  }

  event.investigationProgressMs = Math.max(0, event.investigationProgressMs - deltaSeconds * 460);
  return false;
}

export function createRareEventMinimapMarkers(events: RareEventInstance[]): RareEventMinimapMarker[] {
  return events.map((event) => ({
    x: event.x,
    y: event.y,
    signalRadius: event.definition.signalRadius,
    dangerRadius: event.definition.dangerRadius,
    objectiveRadius: event.definition.objectiveRadius,
    status: event.status,
    kind: event.definition.kind,
    progress: getRareEventProgress(event)
  }));
}
