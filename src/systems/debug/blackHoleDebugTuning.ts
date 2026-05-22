import Phaser from 'phaser';
import type { BlackHoleFieldTuningConfig } from '../blackHole';
import type { SavedBlackHoleFieldTuningPreset } from '../../scenes/gameTypes';
import {
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN
} from '../../scenes/gameConstants';
import { DEFAULT_BLACK_HOLE_FIELD_TUNING } from '../worldForces';
import { parseJsonBlock } from './debugPersistence';

export interface BlackHoleFieldTuningDebugState {
  influenceRadiusScale: number;
  damageRadiusScale: number;
  coreScale: number;
  tuning: BlackHoleFieldTuningConfig;
}

export function clampBlackHoleRadiusScale(value: number): number {
  return Phaser.Math.Clamp(Number(value.toFixed(1)), DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN, DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX);
}

export function clampBlackHoleForceMultiplier(value: number): number {
  return Phaser.Math.Clamp(Number(value.toFixed(1)), 0, 10);
}

export function parseBlackHoleFieldTuningMarkdown(markdown: string): SavedBlackHoleFieldTuningPreset | undefined {
  return parseJsonBlock<SavedBlackHoleFieldTuningPreset>(markdown);
}

export function normalizeBlackHoleFieldTuning(
  rawTuning: SavedBlackHoleFieldTuningPreset,
  fallback: BlackHoleFieldTuningConfig = DEFAULT_BLACK_HOLE_FIELD_TUNING
): BlackHoleFieldTuningConfig {
  return {
    radialStrengthMultiplier: clampBlackHoleForceMultiplier(
      getFiniteNumber(rawTuning.radialStrengthMultiplier, fallback.radialStrengthMultiplier)
    ),
    radialCurve: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.radialCurve, fallback.radialCurve)),
    swirlStrengthMultiplier: clampBlackHoleForceMultiplier(
      getFiniteNumber(rawTuning.swirlStrengthMultiplier, fallback.swirlStrengthMultiplier)
    ),
    swirlCurve: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.swirlCurve, fallback.swirlCurve)),
    maxVelocityMultiplier: Number(getFiniteNumber(rawTuning.maxVelocityMultiplier, fallback.maxVelocityMultiplier).toFixed(1)),
    viscosityStrength: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.viscosityStrength, fallback.viscosityStrength)),
    viscosityCurve: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.viscosityCurve, fallback.viscosityCurve)),
    innerDrag: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.innerDrag, fallback.innerDrag)),
    playerResistance: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.playerResistance, fallback.playerResistance))
  };
}

export function createBlackHoleFieldTuningMarkdown(state: BlackHoleFieldTuningDebugState): string {
  const tuning = state.tuning;
  const setup = {
    influenceRadiusScale: state.influenceRadiusScale,
    damageRadiusScale: state.damageRadiusScale,
    coreScale: state.coreScale,
    ...tuning
  };

  return [
    '# Black Hole Field Tuning',
    '',
    `Saved: ${new Date().toLocaleString()}`,
    '',
    '## Settings',
    '',
    `- Influence radius: ${state.influenceRadiusScale.toFixed(1)}`,
    `- Damage radius: ${state.damageRadiusScale.toFixed(1)}`,
    `- Core/event horizon: ${state.coreScale.toFixed(1)}`,
    `- Radial strength: ${tuning.radialStrengthMultiplier.toFixed(1)}`,
    `- Radial curve: ${tuning.radialCurve.toFixed(1)}`,
    `- Swirl strength: ${tuning.swirlStrengthMultiplier.toFixed(1)}`,
    `- Swirl curve: ${tuning.swirlCurve.toFixed(1)}`,
    `- Max velocity: ${tuning.maxVelocityMultiplier.toFixed(1)}`,
    `- Viscosity strength: ${tuning.viscosityStrength.toFixed(1)}`,
    `- Viscosity curve: ${tuning.viscosityCurve.toFixed(1)}`,
    `- Inner drag: ${tuning.innerDrag.toFixed(1)}`,
    `- Player resistance: ${tuning.playerResistance.toFixed(1)}`,
    '',
    '## Machine Readable Setup',
    '',
    '```json',
    JSON.stringify(setup, null, 2),
    '```',
    ''
  ].join('\n');
}

function getFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
