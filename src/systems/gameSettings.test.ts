import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_GAME_SETTINGS,
  cloneGameSettings,
  formatKeyCode,
  getBindingConflicts,
  getBindingConflictLabel,
  isPrimaryFireInputActive,
  loadGameSettings,
  resetControlSettings,
  resetGameSettings,
  saveGameSettings,
  setKeyBindingIfAvailable,
  type GameSettings
} from './gameSettings';

const STORAGE_KEY = 'starvivors.gameSettings.v1';

describe('game settings', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a clone of defaults when browser storage is unavailable', () => {
    const settings = loadGameSettings();

    expect(settings).toEqual(DEFAULT_GAME_SETTINGS);
    expect(settings).not.toBe(DEFAULT_GAME_SETTINGS);

    settings.keyBindings.moveUp.primary = 'KeyI';
    expect(DEFAULT_GAME_SETTINGS.keyBindings.moveUp.primary).toBe('KeyW');
  });

  it('defaults death debrief to auto-open after the death sequence', () => {
    expect(DEFAULT_GAME_SETTINGS.autoOpenDebriefOnDeath).toBe(true);
  });

  it('normalizes stored settings and falls back per binding slot', () => {
    const storage = createLocalStorage({
      [STORAGE_KEY]: JSON.stringify({
        movementMode: 'worldRelative',
        autoOpenDebriefOnDeath: false,
        keyBindings: {
          moveUp: { primary: 'KeyI', secondary: '' },
          fire: { primary: '' },
          restart: 'not-a-binding'
        }
      })
    });
    vi.stubGlobal('window', { localStorage: storage });

    const settings = loadGameSettings();

    expect(settings.settingsVersion).toBe(2);
    expect(settings.movementMode).toBe('worldRelative');
    expect(settings.autoOpenDebriefOnDeath).toBe(false);
    expect(settings.graphics.vfxDensity).toBe(DEFAULT_GAME_SETTINGS.graphics.vfxDensity);
    expect(settings.sound.masterVolume).toBe(DEFAULT_GAME_SETTINGS.sound.masterVolume);
    expect(settings.accessibility.textScale).toBe(DEFAULT_GAME_SETTINGS.accessibility.textScale);
    expect(settings.keyBindings.moveUp).toEqual({ primary: 'KeyI', secondary: 'ArrowUp' });
    expect(settings.keyBindings.fire.primary).toBe('Space');
    expect(settings.keyBindings.restart.primary).toBe('KeyR');
  });

  it('saves normalized settings to storage', () => {
    const storage = createLocalStorage();
    vi.stubGlobal('window', { localStorage: storage });

    const settings: GameSettings = cloneGameSettings(DEFAULT_GAME_SETTINGS);
    settings.movementMode = 'worldRelative';
    settings.graphics.vfxDensity = 0.25;
    settings.graphics.screenShakeAmount = 2;
    settings.sound.masterVolume = 0.35;
    settings.sound.musicVolume = 0.45;
    settings.sound.sfxVolume = 0.55;
    settings.sound.uiVolume = 0.65;
    settings.sound.muted = true;
    settings.accessibility.reducedFlash = true;
    settings.accessibility.textScale = 1.25;
    settings.keyBindings.pause.primary = '';
    saveGameSettings(settings);

    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as GameSettings;
    expect(saved.settingsVersion).toBe(2);
    expect(saved.movementMode).toBe('worldRelative');
    expect(saved.graphics.vfxDensity).toBe(0.25);
    expect(saved.graphics.screenShakeAmount).toBe(1);
    expect(saved.sound.masterVolume).toBe(0.35);
    expect(saved.sound.musicVolume).toBe(0.45);
    expect(saved.sound.sfxVolume).toBe(0.55);
    expect(saved.sound.uiVolume).toBe(0.65);
    expect(saved.sound.muted).toBe(true);
    expect(saved.accessibility.reducedFlash).toBe(true);
    expect(saved.accessibility.textScale).toBe(1.25);
    expect(saved.keyBindings.pause.primary).toBe('Escape');
  });

  it('resets controls without dropping other settings', () => {
    const storage = createLocalStorage();
    vi.stubGlobal('window', { localStorage: storage });
    const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS);
    settings.movementMode = 'worldRelative';
    settings.graphics.brightness = 1.2;
    settings.accessibility.autoFirePrimary = true;
    settings.keyBindings.fire.primary = 'KeyF';

    const reset = resetControlSettings(settings);

    expect(reset.movementMode).toBe('worldRelative');
    expect(reset.graphics.brightness).toBe(1.2);
    expect(reset.accessibility.autoFirePrimary).toBe(true);
    expect(reset.keyBindings.fire.primary).toBe(DEFAULT_GAME_SETTINGS.keyBindings.fire.primary);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}').keyBindings.fire.primary).toBe('Space');
  });

  it('resets all settings to defaults', () => {
    const storage = createLocalStorage();
    vi.stubGlobal('window', { localStorage: storage });
    const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS);
    settings.movementMode = 'worldRelative';
    settings.graphics.brightness = 1.2;
    settings.sound.muted = true;
    settings.accessibility.autoFirePrimary = true;
    saveGameSettings(settings);

    const reset = resetGameSettings();

    expect(reset).toEqual(DEFAULT_GAME_SETTINGS);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toEqual(DEFAULT_GAME_SETTINGS);
  });

  it('formats key codes, reports duplicate bindings, and blocks duplicate rebinding', () => {
    const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS);
    settings.keyBindings.pause.primary = 'Space';
    settings.keyBindings.minimap.secondary = 'Digit1';

    expect(formatKeyCode('KeyZ')).toBe('Z');
    expect(formatKeyCode('Digit1')).toBe('1');
    expect(formatKeyCode('ArrowLeft')).toBe('Left');
    expect(formatKeyCode('Escape')).toBe('Esc');
    expect(getBindingConflicts(settings)).toEqual(new Set(['fire', 'pause']));
    expect(getBindingConflictLabel(settings, 'Space', 'moveUp', 'primary')).toBe('Fire primary');

    const blocked = setKeyBindingIfAvailable(settings, 'moveUp', 'primary', 'Space');
    expect(blocked.conflictLabel).toBe('Fire primary');
    expect(blocked.settings.keyBindings.moveUp.primary).toBe('KeyW');

    const updated = setKeyBindingIfAvailable(settings, 'moveUp', 'primary', 'KeyI');
    expect(updated.conflictLabel).toBeUndefined();
    expect(updated.settings.keyBindings.moveUp.primary).toBe('KeyI');
  });

  it('treats primary auto-fire assist as primary fire only', () => {
    const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS);

    expect(isPrimaryFireInputActive(settings, false)).toBe(false);
    expect(isPrimaryFireInputActive(settings, true)).toBe(true);

    settings.accessibility.autoFirePrimary = true;
    expect(isPrimaryFireInputActive(settings, false)).toBe(true);
  });
});

function createLocalStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial));
  return {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    })
  };
}
