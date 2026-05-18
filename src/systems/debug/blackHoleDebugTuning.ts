import Phaser from 'phaser';
import {
  BLACK_HOLE_PNG_TEXTURE_KEYS,
  BLACK_HOLE_PNG_TEXTURE_LABELS,
  type BlackHoleFieldTuningConfig,
  type BlackHolePngLayerConfig,
  type BlackHolePngLayerDebugSummary,
  type BlackHolePngTextureKey
} from '../blackHole';
import type { SavedBlackHoleFieldTuningPreset, SavedBlackHolePngLayer, SavedBlackHolePngSetup } from '../../scenes/gameTypes';
import {
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX,
  DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN
} from '../../scenes/gameConstants';
import { DEFAULT_BLACK_HOLE_FIELD_TUNING } from '../worldForces';
import { parseJsonBlock } from './debugPersistence';

export interface BlackHolePngSetupDebugState {
  visualScale: number;
  coreScale: number;
  allLayersEnabled: boolean;
  addTextureKey: BlackHolePngTextureKey;
  selectedLayerIndex: number;
}

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

export function isBlackHolePngTextureKey(value: unknown): value is BlackHolePngTextureKey {
  return typeof value === 'string' && BLACK_HOLE_PNG_TEXTURE_KEYS.includes(value as BlackHolePngTextureKey);
}

export function parseBlackHoleFieldTuningMarkdown(markdown: string): SavedBlackHoleFieldTuningPreset | undefined {
  return parseJsonBlock<SavedBlackHoleFieldTuningPreset>(markdown);
}

export function parseBlackHolePngSetupMarkdown(markdown: string): SavedBlackHolePngSetup | undefined {
  return parseJsonBlock<SavedBlackHolePngSetup>(markdown);
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
    massResistanceMultiplier: clampBlackHoleForceMultiplier(
      getFiniteNumber(rawTuning.massResistanceMultiplier, fallback.massResistanceMultiplier)
    ),
    maxVelocityMultiplier: Number(getFiniteNumber(rawTuning.maxVelocityMultiplier, fallback.maxVelocityMultiplier).toFixed(1)),
    viscosityStrength: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.viscosityStrength, fallback.viscosityStrength)),
    viscosityCurve: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.viscosityCurve, fallback.viscosityCurve)),
    innerDrag: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.innerDrag, fallback.innerDrag)),
    playerResistance: clampBlackHoleForceMultiplier(getFiniteNumber(rawTuning.playerResistance, fallback.playerResistance))
  };
}

export function normalizeBlackHolePngSetupLayers(rawLayers: unknown): BlackHolePngLayerConfig[] | undefined {
  if (!Array.isArray(rawLayers)) {
    return undefined;
  }

  const layers: BlackHolePngLayerConfig[] = [];

  for (const rawLayer of rawLayers) {
    if (!rawLayer || typeof rawLayer !== 'object') {
      return undefined;
    }

    const layer = rawLayer as SavedBlackHolePngLayer;

    if (!isBlackHolePngTextureKey(layer.image)) {
      return undefined;
    }

    layers.push({
      textureKey: layer.image,
      speedRps: getFiniteNumber(layer.speedRps, 0.25),
      sizeMultiplier: getFiniteNumber(layer.size, 1),
      alpha: getFiniteNumber(layer.alpha, 1),
      enabled: typeof layer.enabled === 'boolean' ? layer.enabled : true,
      initialRotation: getFiniteNumber(layer.initialRotation, Phaser.Math.FloatBetween(0, Math.PI * 2))
    });
  }

  return layers;
}

export function createBlackHolePngSetupMarkdown(
  state: BlackHolePngSetupDebugState,
  layers: BlackHolePngLayerDebugSummary[]
): string {
  const setup = {
    visualScale: state.visualScale,
    coreScale: state.coreScale,
    allLayersEnabled: state.allLayersEnabled,
    addImage: state.addTextureKey,
    selectedLayerIndex: state.selectedLayerIndex,
    layers: layers.map((layer) => ({
      image: layer.textureKey,
      label: layer.textureLabel,
      speedRps: layer.speedRps,
      size: layer.sizeMultiplier,
      alpha: layer.alpha,
      enabled: layer.enabled,
      initialRotation: Number(layer.initialRotation.toFixed(4))
    }))
  };
  const layerRows = layers.length > 0
    ? layers
        .map(
          (layer) =>
            `| ${layer.index + 1} | ${layer.textureLabel} | ${layer.textureKey} | ${layer.speedRps.toFixed(2)} | ${layer.sizeMultiplier.toFixed(2)} | ${layer.alpha.toFixed(2)} | ${layer.enabled ? 'yes' : 'no'} |`
        )
        .join('\n')
    : '| none | | | | | | |';

  return [
    '# Black Hole PNG Setup',
    '',
    `Saved: ${new Date().toLocaleString()}`,
    '',
    '## Global Settings',
    '',
    `- Visual scale: ${state.visualScale.toFixed(1)}`,
    `- All PNG layers enabled: ${state.allLayersEnabled ? 'yes' : 'no'}`,
    `- Add image selector: ${BLACK_HOLE_PNG_TEXTURE_LABELS[state.addTextureKey]} (${state.addTextureKey})`,
    `- Selected layer index: ${state.selectedLayerIndex}`,
    '',
    '## Layers',
    '',
    '| # | Label | Texture key | Speed rps | Size | Alpha | Enabled |',
    '| - | - | - | -: | -: | -: | - |',
    layerRows,
    '',
    '## Machine Readable Setup',
    '',
    '```json',
    JSON.stringify(setup, null, 2),
    '```',
    ''
  ].join('\n');
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
    `- Mass resistance: ${tuning.massResistanceMultiplier.toFixed(1)}`,
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
