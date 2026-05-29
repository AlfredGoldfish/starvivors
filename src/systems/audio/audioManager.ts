import { DEFAULT_GAME_SETTINGS, type SoundSettings } from '../gameSettings';
import {
  AUDIO_CUE_REGISTRY,
  getAudioCueDefinition,
  type AudioCategory,
  type AudioCueId,
  type AudioCueDefinition,
  type NoiseCueLayer,
  type OscillatorCueLayer
} from './cueRegistry';

const MIN_GAIN_VALUE = 0.0001;
const DEFAULT_HISTORY_LIMIT = 80;

export interface AudioManagerSnapshot {
  available: boolean;
  unlocked: boolean;
  muted: boolean;
  contextState: AudioContextState | 'unavailable';
  volumes: SoundSettings;
  effectiveGains: Record<AudioCategory, number>;
  recentCueIds: AudioCueId[];
}

export interface AudioManagerOptions {
  historyLimit?: number;
}

export function normalizeVolume(value: unknown, fallback = 1): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

export function normalizeSoundSettings(settings: SoundSettings): SoundSettings {
  const defaults = DEFAULT_GAME_SETTINGS.sound;

  return {
    masterVolume: normalizeVolume(settings.masterVolume, defaults.masterVolume),
    musicVolume: normalizeVolume(settings.musicVolume, defaults.musicVolume),
    sfxVolume: normalizeVolume(settings.sfxVolume, defaults.sfxVolume),
    uiVolume: normalizeVolume(settings.uiVolume, defaults.uiVolume),
    muted: settings.muted === true
  };
}

export function getEffectiveCategoryGain(settings: SoundSettings, category: AudioCategory): number {
  const normalized = normalizeSoundSettings(settings);
  if (normalized.muted) {
    return 0;
  }

  return normalized.masterVolume * getCategoryVolume(normalized, category);
}

export function getEffectiveAudioGains(settings: SoundSettings): Record<AudioCategory, number> {
  return {
    sfx: getEffectiveCategoryGain(settings, 'sfx'),
    ui: getEffectiveCategoryGain(settings, 'ui'),
    music: getEffectiveCategoryGain(settings, 'music')
  };
}

export class AudioManager {
  private settings: SoundSettings = normalizeSoundSettings(DEFAULT_GAME_SETTINGS.sound);
  private context?: AudioContext;
  private masterGain?: GainNode;
  private categoryGains?: Record<AudioCategory, GainNode>;
  private contextUnavailable = false;
  private unlocked = false;
  private readonly lastPlayedAt = new Map<AudioCueId, number>();
  private readonly recentCueIds: AudioCueId[] = [];
  private unlockDisposer?: () => void;
  private readonly historyLimit: number;

  constructor(options: AudioManagerOptions = {}) {
    this.historyLimit = Math.max(1, Math.round(options.historyLimit ?? DEFAULT_HISTORY_LIMIT));
  }

  applySettings(settings: SoundSettings): void {
    this.settings = normalizeSoundSettings(settings);
    this.updateGainNodes();
  }

  installUnlockListeners(target: EventTarget | undefined = getDefaultUnlockTarget()): void {
    if (!target || this.unlockDisposer) {
      return;
    }

    const unlockFromGesture = (): void => {
      void this.unlock();
      this.removeUnlockListeners();
    };
    const pointerOptions: AddEventListenerOptions = { capture: true, passive: true };
    const keyboardOptions: AddEventListenerOptions = { capture: true };

    target.addEventListener('pointerdown', unlockFromGesture, pointerOptions);
    target.addEventListener('touchstart', unlockFromGesture, pointerOptions);
    target.addEventListener('keydown', unlockFromGesture, keyboardOptions);
    this.unlockDisposer = () => {
      target.removeEventListener('pointerdown', unlockFromGesture, pointerOptions);
      target.removeEventListener('touchstart', unlockFromGesture, pointerOptions);
      target.removeEventListener('keydown', unlockFromGesture, keyboardOptions);
    };
  }

  removeUnlockListeners(): void {
    this.unlockDisposer?.();
    this.unlockDisposer = undefined;
  }

  async unlock(): Promise<boolean> {
    const context = this.ensureContext();
    if (!context) {
      return false;
    }

    try {
      if (context.state === 'suspended') {
        await context.resume();
      }
      this.unlocked = context.state === 'running';
    } catch {
      this.unlocked = false;
    }

    return this.unlocked;
  }

  playCue(cueId: AudioCueId, timeMs: number, options: { bypassCooldown?: boolean } = {}): boolean {
    const cue = getAudioCueDefinition(cueId);
    if (!options.bypassCooldown && !this.canPlayCue(cue, timeMs)) {
      return false;
    }

    this.lastPlayedAt.set(cueId, timeMs);
    this.recordCue(cueId);

    if (getEffectiveCategoryGain(this.settings, cue.category) <= 0) {
      return true;
    }

    const context = this.ensureContext();
    if (!context) {
      return true;
    }

    this.unlocked = context.state === 'running';
    if (!this.unlocked) {
      return true;
    }

    this.scheduleCue(context, cue);
    return true;
  }

  clearHistory(): void {
    this.recentCueIds.length = 0;
  }

  getSnapshot(): AudioManagerSnapshot {
    return {
      available: Boolean(this.context) || (!this.contextUnavailable && isBrowserAudioAvailable()),
      unlocked: this.unlocked,
      contextState: this.context?.state ?? 'unavailable',
      muted: this.settings.muted,
      volumes: { ...this.settings },
      effectiveGains: getEffectiveAudioGains(this.settings),
      recentCueIds: [...this.recentCueIds]
    };
  }

  dispose(): void {
    this.removeUnlockListeners();
    this.masterGain?.disconnect();
    if (this.categoryGains) {
      for (const gain of Object.values(this.categoryGains)) {
        gain.disconnect();
      }
    }
    this.masterGain = undefined;
    this.categoryGains = undefined;
    this.context = undefined;
    this.contextUnavailable = false;
    this.unlocked = false;
    this.lastPlayedAt.clear();
    this.recentCueIds.length = 0;
  }

  private canPlayCue(cue: AudioCueDefinition<AudioCueId>, timeMs: number): boolean {
    const previousTime = this.lastPlayedAt.get(cue.id);
    return previousTime === undefined || timeMs - previousTime >= cue.cooldownMs;
  }

  private recordCue(cueId: AudioCueId): void {
    this.recentCueIds.push(cueId);
    if (this.recentCueIds.length > this.historyLimit) {
      this.recentCueIds.splice(0, this.recentCueIds.length - this.historyLimit);
    }
  }

  private ensureContext(): AudioContext | undefined {
    if (this.context) {
      return this.context;
    }

    if (this.contextUnavailable || typeof window === 'undefined') {
      this.contextUnavailable = true;
      return undefined;
    }

    const AudioContextConstructor = window.AudioContext ?? getLegacyAudioContextConstructor();
    if (!AudioContextConstructor) {
      this.contextUnavailable = true;
      return undefined;
    }

    try {
      this.context = new AudioContextConstructor();
      this.masterGain = this.context.createGain();
      this.categoryGains = {
        sfx: this.context.createGain(),
        ui: this.context.createGain(),
        music: this.context.createGain()
      };
      for (const gain of Object.values(this.categoryGains)) {
        gain.connect(this.masterGain);
      }
      this.masterGain.connect(this.context.destination);
      this.updateGainNodes();
      this.unlocked = this.context.state === 'running';
    } catch {
      this.context = undefined;
      this.masterGain = undefined;
      this.categoryGains = undefined;
      this.contextUnavailable = true;
    }

    return this.context;
  }

  private updateGainNodes(): void {
    if (!this.context || !this.masterGain || !this.categoryGains) {
      return;
    }

    const now = this.context.currentTime;
    const masterValue = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(masterValue, now, 0.012);

    for (const category of Object.keys(this.categoryGains) as AudioCategory[]) {
      this.categoryGains[category].gain.setTargetAtTime(getCategoryVolume(this.settings, category), now, 0.012);
    }
  }

  private scheduleCue(context: AudioContext, cue: AudioCueDefinition): void {
    const output = this.categoryGains?.[cue.category];
    if (!output) {
      return;
    }

    for (const layer of cue.layers) {
      if (layer.type === 'oscillator') {
        this.scheduleOscillatorLayer(context, output, layer);
      } else {
        this.scheduleNoiseLayer(context, output, layer);
      }
    }
  }

  private scheduleOscillatorLayer(context: AudioContext, output: AudioNode, layer: OscillatorCueLayer): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime + (layer.delayMs ?? 0) / 1000;
    const endAt = startAt + layer.durationMs / 1000;

    oscillator.type = layer.waveform;
    oscillator.frequency.setValueAtTime(Math.max(1, layer.frequencyStartHz), startAt);
    if (layer.frequencyEndHz !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, layer.frequencyEndHz), endAt);
    }

    this.applyEnvelope(gain, startAt, endAt, layer.gain, layer.attackMs ?? 4);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.025);
  }

  private scheduleNoiseLayer(context: AudioContext, output: AudioNode, layer: NoiseCueLayer): void {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const startAt = context.currentTime + (layer.delayMs ?? 0) / 1000;
    const endAt = startAt + layer.durationMs / 1000;

    source.buffer = createNoiseBuffer(context, layer.durationMs / 1000);
    filter.type = layer.filterType ?? 'bandpass';
    filter.frequency.setValueAtTime(Math.max(10, layer.filterStartHz ?? 900), startAt);
    if (layer.filterEndHz !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(10, layer.filterEndHz), endAt);
    }

    this.applyEnvelope(gain, startAt, endAt, layer.gain, layer.attackMs ?? 3);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.start(startAt);
    source.stop(endAt + 0.025);
  }

  private applyEnvelope(gain: GainNode, startAt: number, endAt: number, peakGain: number, attackMs: number): void {
    const attackEnd = Math.min(endAt, startAt + Math.max(1, attackMs) / 1000);
    gain.gain.setValueAtTime(MIN_GAIN_VALUE, startAt);
    gain.gain.linearRampToValueAtTime(Math.max(MIN_GAIN_VALUE, peakGain), attackEnd);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN_VALUE, endAt);
  }
}

function createNoiseBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const frameCount = Math.max(1, Math.ceil(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function getDefaultUnlockTarget(): EventTarget | undefined {
  return typeof window === 'undefined' ? undefined : window;
}

function getCategoryVolume(settings: SoundSettings, category: AudioCategory): number {
  switch (category) {
    case 'sfx':
      return settings.sfxVolume;
    case 'ui':
      return settings.uiVolume;
    case 'music':
      return settings.musicVolume;
  }
}

function isBrowserAudioAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.AudioContext ?? getLegacyAudioContextConstructor());
}

function getLegacyAudioContextConstructor(): typeof AudioContext | undefined {
  return (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

export { AUDIO_CUE_REGISTRY };
export type { AudioCueId, AudioCategory };
