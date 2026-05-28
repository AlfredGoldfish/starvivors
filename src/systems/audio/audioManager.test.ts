import { describe, expect, it } from 'vitest';
import { DEFAULT_GAME_SETTINGS, cloneGameSettings } from '../gameSettings';
import {
  AudioManager,
  getEffectiveAudioGains,
  getEffectiveCategoryGain,
  normalizeSoundSettings,
  normalizeVolume
} from './audioManager';
import {
  AUDIO_CUE_IDS,
  AUDIO_CUE_REGISTRY,
  REQUIRED_FIRST_PASS_AUDIO_CUES,
  type AudioCueId
} from './cueRegistry';

describe('audio manager', () => {
  it('normalizes volumes and computes effective gains from master and category volume', () => {
    const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS).sound;
    settings.masterVolume = 1.4;
    settings.sfxVolume = 0.5;
    settings.uiVolume = 0.25;
    settings.musicVolume = -2;

    expect(normalizeVolume(Number.NaN, 0.7)).toBe(0.7);
    expect(normalizeSoundSettings(settings)).toMatchObject({
      masterVolume: 1,
      sfxVolume: 0.5,
      uiVolume: 0.25,
      musicVolume: 0
    });
    expect(getEffectiveCategoryGain(settings, 'sfx')).toBe(0.5);
    expect(getEffectiveAudioGains(settings)).toEqual({
      sfx: 0.5,
      ui: 0.25,
      music: 0
    });
  });

  it('mutes every effective category gain without dropping saved volume fields', () => {
    const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS).sound;
    settings.masterVolume = 0.75;
    settings.sfxVolume = 0.6;
    settings.uiVolume = 0.4;
    settings.musicVolume = 0.2;
    settings.muted = true;

    expect(getEffectiveAudioGains(settings)).toEqual({
      sfx: 0,
      ui: 0,
      music: 0
    });
    expect(normalizeSoundSettings(settings)).toMatchObject({
      masterVolume: 0.75,
      sfxVolume: 0.6,
      uiVolume: 0.4,
      musicVolume: 0.2,
      muted: true
    });
  });

  it('applies settings and records accepted cues without requiring browser audio', () => {
    const manager = new AudioManager({ historyLimit: 4 });
    const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS).sound;
    settings.masterVolume = 0.5;
    settings.sfxVolume = 0.4;
    settings.uiVolume = 0.3;
    settings.musicVolume = 0.2;

    manager.applySettings(settings);
    expect(manager.getSnapshot()).toMatchObject({
      contextState: 'unavailable',
      muted: false,
      volumes: settings,
      effectiveGains: {
        sfx: 0.2,
        ui: 0.15,
        music: 0.1
      }
    });

    expect(manager.playCue('player-fire', 1000)).toBe(true);
    expect(manager.playCue('player-fire', 1030)).toBe(false);
    expect(manager.playCue('player-fire', 1055)).toBe(true);
    expect(manager.getSnapshot().recentCueIds).toEqual(['player-fire', 'player-fire']);

    manager.dispose();
  });

  it('covers every required first-pass cue with procedural layers and cooldowns', () => {
    const registryIds = new Set<AudioCueId>(AUDIO_CUE_IDS);

    for (const cueId of REQUIRED_FIRST_PASS_AUDIO_CUES) {
      const definition = AUDIO_CUE_REGISTRY[cueId];
      expect(registryIds.has(cueId)).toBe(true);
      expect(definition.id).toBe(cueId);
      expect(definition.cooldownMs).toBeGreaterThanOrEqual(0);
      expect(definition.layers.length).toBeGreaterThan(0);
      expect(definition.layers.every((layer) => layer.durationMs > 0 && layer.gain > 0)).toBe(true);
    }
  });

  it('keeps player shooting cues present with softened high-frequency content', () => {
    const playerFire = AUDIO_CUE_REGISTRY['player-fire'];
    const playerBurstFire = AUDIO_CUE_REGISTRY['player-burst-fire'];

    expect(playerFire.layers.length).toBeGreaterThan(0);
    expect(playerBurstFire.layers.length).toBeGreaterThan(0);
    expect(getCuePeakFrequency(playerFire)).toBeLessThanOrEqual(1180);
    expect(getCueTotalGain(playerFire)).toBeLessThanOrEqual(0.09);
    expect(getCueOscillatorWaveforms(playerFire)).not.toContain('square');
    expect(getCuePeakFrequency(playerBurstFire)).toBeLessThanOrEqual(1450);
    expect(getCueTotalGain(playerBurstFire)).toBeLessThanOrEqual(0.07);
    expect(getCueOscillatorWaveforms(playerBurstFire)).not.toContain('sawtooth');
  });
});

function getCuePeakFrequency(definition: (typeof AUDIO_CUE_REGISTRY)[AudioCueId]): number {
  return Math.max(
    ...definition.layers.flatMap((layer) => {
      if (layer.type === 'oscillator') {
        return [layer.frequencyStartHz, layer.frequencyEndHz ?? layer.frequencyStartHz];
      }

      return [layer.filterStartHz ?? 0, layer.filterEndHz ?? layer.filterStartHz ?? 0];
    })
  );
}

function getCueTotalGain(definition: (typeof AUDIO_CUE_REGISTRY)[AudioCueId]): number {
  return definition.layers.reduce((total, layer) => total + layer.gain, 0);
}

function getCueOscillatorWaveforms(definition: (typeof AUDIO_CUE_REGISTRY)[AudioCueId]): OscillatorType[] {
  return definition.layers.flatMap((layer) => (layer.type === 'oscillator' ? [layer.waveform] : []));
}
