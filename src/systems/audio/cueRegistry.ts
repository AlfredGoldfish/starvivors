export type AudioCategory = 'sfx' | 'ui' | 'music';

export type AudioCueId =
  | 'player-fire'
  | 'player-burst-fire'
  | 'enemy-fire'
  | 'projectile-hit'
  | 'asteroid-impact'
  | 'debris-impact'
  | 'world-impact'
  | 'shield-block'
  | 'hull-damage'
  | 'player-death'
  | 'eject-confirmed'
  | 'scrap-pickup'
  | 'upgrade-pickup'
  | 'rare-upgrade-pickup'
  | 'upgrade-selected'
  | 'low-fuel-warning'
  | 'mission-complete'
  | 'black-hole-warning'
  | 'ui-confirm'
  | 'ui-back'
  | 'ui-tab'
  | 'ui-error';

export interface OscillatorCueLayer {
  type: 'oscillator';
  waveform: OscillatorType;
  gain: number;
  frequencyStartHz: number;
  frequencyEndHz?: number;
  durationMs: number;
  delayMs?: number;
  attackMs?: number;
}

export interface NoiseCueLayer {
  type: 'noise';
  gain: number;
  durationMs: number;
  delayMs?: number;
  attackMs?: number;
  filterType?: BiquadFilterType;
  filterStartHz?: number;
  filterEndHz?: number;
}

export type ProceduralCueLayer = OscillatorCueLayer | NoiseCueLayer;

export interface AudioCueDefinition {
  id: AudioCueId;
  category: AudioCategory;
  cooldownMs: number;
  layers: ProceduralCueLayer[];
}

export const REQUIRED_FIRST_PASS_AUDIO_CUES: AudioCueId[] = [
  'player-fire',
  'player-burst-fire',
  'enemy-fire',
  'projectile-hit',
  'asteroid-impact',
  'debris-impact',
  'world-impact',
  'shield-block',
  'hull-damage',
  'player-death',
  'eject-confirmed',
  'scrap-pickup',
  'upgrade-pickup',
  'rare-upgrade-pickup',
  'upgrade-selected',
  'low-fuel-warning',
  'mission-complete',
  'black-hole-warning',
  'ui-confirm',
  'ui-back',
  'ui-tab'
];

export const AUDIO_CUE_REGISTRY: Record<AudioCueId, AudioCueDefinition> = {
  'player-fire': {
    id: 'player-fire',
    category: 'sfx',
    cooldownMs: 55,
    layers: [
      { type: 'oscillator', waveform: 'square', gain: 0.08, frequencyStartHz: 740, frequencyEndHz: 260, durationMs: 72, attackMs: 4 },
      { type: 'noise', gain: 0.035, durationMs: 58, filterType: 'highpass', filterStartHz: 1400, filterEndHz: 2600 }
    ]
  },
  'player-burst-fire': {
    id: 'player-burst-fire',
    category: 'sfx',
    cooldownMs: 42,
    layers: [
      { type: 'oscillator', waveform: 'sawtooth', gain: 0.055, frequencyStartHz: 520, frequencyEndHz: 820, durationMs: 62, attackMs: 3 },
      { type: 'noise', gain: 0.024, durationMs: 42, filterType: 'bandpass', filterStartHz: 1900, filterEndHz: 2800 }
    ]
  },
  'enemy-fire': {
    id: 'enemy-fire',
    category: 'sfx',
    cooldownMs: 90,
    layers: [
      { type: 'oscillator', waveform: 'sawtooth', gain: 0.065, frequencyStartHz: 310, frequencyEndHz: 155, durationMs: 95, attackMs: 5 },
      { type: 'noise', gain: 0.03, durationMs: 68, filterType: 'bandpass', filterStartHz: 900, filterEndHz: 520 }
    ]
  },
  'projectile-hit': {
    id: 'projectile-hit',
    category: 'sfx',
    cooldownMs: 38,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.065, frequencyStartHz: 480, frequencyEndHz: 120, durationMs: 88, attackMs: 2 },
      { type: 'noise', gain: 0.055, durationMs: 92, filterType: 'highpass', filterStartHz: 1300, filterEndHz: 520 }
    ]
  },
  'asteroid-impact': {
    id: 'asteroid-impact',
    category: 'sfx',
    cooldownMs: 85,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.08, frequencyStartHz: 160, frequencyEndHz: 75, durationMs: 150, attackMs: 5 },
      { type: 'noise', gain: 0.07, durationMs: 155, filterType: 'lowpass', filterStartHz: 1200, filterEndHz: 260 }
    ]
  },
  'debris-impact': {
    id: 'debris-impact',
    category: 'sfx',
    cooldownMs: 75,
    layers: [
      { type: 'oscillator', waveform: 'square', gain: 0.045, frequencyStartHz: 210, frequencyEndHz: 90, durationMs: 105, attackMs: 3 },
      { type: 'noise', gain: 0.052, durationMs: 105, filterType: 'bandpass', filterStartHz: 1150, filterEndHz: 380 }
    ]
  },
  'world-impact': {
    id: 'world-impact',
    category: 'sfx',
    cooldownMs: 120,
    layers: [
      { type: 'oscillator', waveform: 'sawtooth', gain: 0.085, frequencyStartHz: 190, frequencyEndHz: 70, durationMs: 210, attackMs: 6 },
      { type: 'noise', gain: 0.06, durationMs: 185, filterType: 'lowpass', filterStartHz: 900, filterEndHz: 180 }
    ]
  },
  'shield-block': {
    id: 'shield-block',
    category: 'sfx',
    cooldownMs: 80,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.09, frequencyStartHz: 360, frequencyEndHz: 680, durationMs: 92, attackMs: 4 },
      { type: 'oscillator', waveform: 'sine', gain: 0.035, frequencyStartHz: 920, frequencyEndHz: 520, durationMs: 120, delayMs: 18, attackMs: 4 }
    ]
  },
  'hull-damage': {
    id: 'hull-damage',
    category: 'sfx',
    cooldownMs: 120,
    layers: [
      { type: 'oscillator', waveform: 'sawtooth', gain: 0.095, frequencyStartHz: 145, frequencyEndHz: 64, durationMs: 165, attackMs: 3 },
      { type: 'noise', gain: 0.06, durationMs: 140, filterType: 'lowpass', filterStartHz: 620, filterEndHz: 210 }
    ]
  },
  'player-death': {
    id: 'player-death',
    category: 'sfx',
    cooldownMs: 800,
    layers: [
      { type: 'oscillator', waveform: 'sawtooth', gain: 0.12, frequencyStartHz: 240, frequencyEndHz: 38, durationMs: 640, attackMs: 10 },
      { type: 'noise', gain: 0.09, durationMs: 360, delayMs: 55, filterType: 'lowpass', filterStartHz: 900, filterEndHz: 110 }
    ]
  },
  'eject-confirmed': {
    id: 'eject-confirmed',
    category: 'sfx',
    cooldownMs: 500,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.09, frequencyStartHz: 320, frequencyEndHz: 960, durationMs: 220, attackMs: 6 },
      { type: 'noise', gain: 0.04, durationMs: 130, delayMs: 40, filterType: 'highpass', filterStartHz: 900, filterEndHz: 1800 }
    ]
  },
  'scrap-pickup': {
    id: 'scrap-pickup',
    category: 'sfx',
    cooldownMs: 28,
    layers: [
      { type: 'oscillator', waveform: 'sine', gain: 0.055, frequencyStartHz: 860, frequencyEndHz: 1180, durationMs: 70, attackMs: 2 },
      { type: 'oscillator', waveform: 'triangle', gain: 0.032, frequencyStartHz: 1290, frequencyEndHz: 1720, durationMs: 70, delayMs: 25, attackMs: 2 }
    ]
  },
  'upgrade-pickup': {
    id: 'upgrade-pickup',
    category: 'sfx',
    cooldownMs: 120,
    layers: [
      { type: 'oscillator', waveform: 'sine', gain: 0.075, frequencyStartHz: 520, frequencyEndHz: 980, durationMs: 120, attackMs: 4 },
      { type: 'oscillator', waveform: 'triangle', gain: 0.052, frequencyStartHz: 980, frequencyEndHz: 1480, durationMs: 160, delayMs: 62, attackMs: 5 }
    ]
  },
  'rare-upgrade-pickup': {
    id: 'rare-upgrade-pickup',
    category: 'sfx',
    cooldownMs: 180,
    layers: [
      { type: 'oscillator', waveform: 'sine', gain: 0.085, frequencyStartHz: 440, frequencyEndHz: 1320, durationMs: 190, attackMs: 6 },
      { type: 'oscillator', waveform: 'triangle', gain: 0.055, frequencyStartHz: 660, frequencyEndHz: 1760, durationMs: 240, delayMs: 82, attackMs: 6 }
    ]
  },
  'upgrade-selected': {
    id: 'upgrade-selected',
    category: 'ui',
    cooldownMs: 90,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.07, frequencyStartHz: 620, frequencyEndHz: 1240, durationMs: 105, attackMs: 3 },
      { type: 'oscillator', waveform: 'sine', gain: 0.04, frequencyStartHz: 1240, frequencyEndHz: 1860, durationMs: 130, delayMs: 70, attackMs: 4 }
    ]
  },
  'low-fuel-warning': {
    id: 'low-fuel-warning',
    category: 'sfx',
    cooldownMs: 2600,
    layers: [
      { type: 'oscillator', waveform: 'square', gain: 0.07, frequencyStartHz: 520, frequencyEndHz: 390, durationMs: 160, attackMs: 5 },
      { type: 'oscillator', waveform: 'square', gain: 0.07, frequencyStartHz: 520, frequencyEndHz: 390, durationMs: 160, delayMs: 230, attackMs: 5 }
    ]
  },
  'mission-complete': {
    id: 'mission-complete',
    category: 'sfx',
    cooldownMs: 900,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.082, frequencyStartHz: 392, frequencyEndHz: 784, durationMs: 180, attackMs: 5 },
      { type: 'oscillator', waveform: 'triangle', gain: 0.07, frequencyStartHz: 587, frequencyEndHz: 1174, durationMs: 220, delayMs: 150, attackMs: 5 },
      { type: 'oscillator', waveform: 'sine', gain: 0.055, frequencyStartHz: 784, frequencyEndHz: 1568, durationMs: 260, delayMs: 310, attackMs: 6 }
    ]
  },
  'black-hole-warning': {
    id: 'black-hole-warning',
    category: 'sfx',
    cooldownMs: 1700,
    layers: [
      { type: 'oscillator', waveform: 'sawtooth', gain: 0.075, frequencyStartHz: 88, frequencyEndHz: 52, durationMs: 420, attackMs: 18 },
      { type: 'oscillator', waveform: 'sine', gain: 0.04, frequencyStartHz: 176, frequencyEndHz: 132, durationMs: 420, attackMs: 18 }
    ]
  },
  'ui-confirm': {
    id: 'ui-confirm',
    category: 'ui',
    cooldownMs: 24,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.052, frequencyStartHz: 620, frequencyEndHz: 980, durationMs: 66, attackMs: 2 }
    ]
  },
  'ui-back': {
    id: 'ui-back',
    category: 'ui',
    cooldownMs: 38,
    layers: [
      { type: 'oscillator', waveform: 'triangle', gain: 0.052, frequencyStartHz: 460, frequencyEndHz: 240, durationMs: 78, attackMs: 2 }
    ]
  },
  'ui-tab': {
    id: 'ui-tab',
    category: 'ui',
    cooldownMs: 30,
    layers: [
      { type: 'oscillator', waveform: 'sine', gain: 0.042, frequencyStartHz: 520, frequencyEndHz: 640, durationMs: 48, attackMs: 2 }
    ]
  },
  'ui-error': {
    id: 'ui-error',
    category: 'ui',
    cooldownMs: 160,
    layers: [
      { type: 'oscillator', waveform: 'square', gain: 0.05, frequencyStartHz: 180, frequencyEndHz: 150, durationMs: 130, attackMs: 4 },
      { type: 'oscillator', waveform: 'square', gain: 0.035, frequencyStartHz: 150, frequencyEndHz: 120, durationMs: 130, delayMs: 140, attackMs: 4 }
    ]
  }
};

export const AUDIO_CUE_IDS = Object.keys(AUDIO_CUE_REGISTRY) as AudioCueId[];

export function getAudioCueDefinition(cueId: AudioCueId): AudioCueDefinition {
  return AUDIO_CUE_REGISTRY[cueId];
}
