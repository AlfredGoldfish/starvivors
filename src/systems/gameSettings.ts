export type MovementMode = 'shipRelative' | 'worldRelative';

export type RunControlAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'fire'
  | 'upgrade'
  | 'minimap'
  | 'pause'
  | 'restart';

export type BindingSlot = 'primary' | 'secondary';

export interface KeyBinding {
  primary: string;
  secondary?: string;
}

export interface GraphicsSettings {
  vfxDensity: number;
  screenShakeAmount: number;
  brightness: number;
}

export interface SoundSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  uiVolume: number;
  muted: boolean;
}

export interface AccessibilitySettings {
  reducedShake: boolean;
  reducedFlash: boolean;
  highContrast: boolean;
  textScale: number;
  colorSafeShots: boolean;
  autoFirePrimary: boolean;
}

export interface GameSettings {
  settingsVersion: number;
  movementMode: MovementMode;
  autoOpenDebriefOnDeath: boolean;
  graphics: GraphicsSettings;
  sound: SoundSettings;
  accessibility: AccessibilitySettings;
  keyBindings: Record<RunControlAction, KeyBinding>;
}

const STORAGE_KEY = 'starvivors.gameSettings.v1';
const CURRENT_SETTINGS_VERSION = 2;

export const RUN_CONTROL_LABELS: Record<RunControlAction, string> = {
  moveUp: 'Move up / thrust',
  moveDown: 'Move down / reverse',
  moveLeft: 'Move left / strafe',
  moveRight: 'Move right / strafe',
  fire: 'Fire primary',
  upgrade: 'Open upgrade',
  minimap: 'Toggle minimap',
  pause: 'Pause',
  restart: 'Restart'
};

export const RUN_CONTROL_ACTIONS: RunControlAction[] = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'fire',
  'upgrade',
  'minimap',
  'pause',
  'restart'
];

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  settingsVersion: CURRENT_SETTINGS_VERSION,
  movementMode: 'shipRelative',
  autoOpenDebriefOnDeath: false,
  graphics: {
    vfxDensity: 1,
    screenShakeAmount: 0.7,
    brightness: 1
  },
  sound: {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    uiVolume: 0.8,
    muted: false
  },
  accessibility: {
    reducedShake: false,
    reducedFlash: false,
    highContrast: false,
    textScale: 1,
    colorSafeShots: false,
    autoFirePrimary: false
  },
  keyBindings: {
    moveUp: { primary: 'KeyW', secondary: 'ArrowUp' },
    moveDown: { primary: 'KeyS', secondary: 'ArrowDown' },
    moveLeft: { primary: 'KeyA', secondary: 'ArrowLeft' },
    moveRight: { primary: 'KeyD', secondary: 'ArrowRight' },
    fire: { primary: 'Space' },
    upgrade: { primary: 'KeyU' },
    minimap: { primary: 'KeyM' },
    pause: { primary: 'Escape' },
    restart: { primary: 'KeyR' }
  }
};

export function loadGameSettings(): GameSettings {
  if (typeof window === 'undefined') {
    return cloneGameSettings(DEFAULT_GAME_SETTINGS);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeGameSettings(raw ? JSON.parse(raw) : undefined);
  } catch {
    return cloneGameSettings(DEFAULT_GAME_SETTINGS);
  }
}

export function saveGameSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeGameSettings(settings)));
}

export function resetGameSettings(): GameSettings {
  const settings = cloneGameSettings(DEFAULT_GAME_SETTINGS);
  saveGameSettings(settings);
  return settings;
}

export function resetControlSettings(settings: GameSettings): GameSettings {
  const next = {
    ...cloneGameSettings(settings),
    keyBindings: cloneGameSettings(DEFAULT_GAME_SETTINGS).keyBindings
  };
  saveGameSettings(next);
  return next;
}

export function formatKeyCode(code: string | undefined): string {
  if (!code) {
    return '-';
  }

  if (code.startsWith('Key')) {
    return code.slice(3);
  }

  if (code.startsWith('Digit')) {
    return code.slice(5);
  }

  if (code.startsWith('Arrow')) {
    return code.replace('Arrow', '');
  }

  return code.replace('Space', 'Space').replace('Escape', 'Esc');
}

export function getBindingConflicts(settings: GameSettings): Set<string> {
  const seen = new Map<string, string>();
  const conflicts = new Set<string>();

  for (const action of RUN_CONTROL_ACTIONS) {
    const binding = settings.keyBindings[action];
    for (const code of [binding.primary, binding.secondary]) {
      if (!code) {
        continue;
      }

      const previous = seen.get(code);
      if (previous) {
        conflicts.add(previous);
        conflicts.add(action);
      } else {
        seen.set(code, action);
      }
    }
  }

  return conflicts;
}

export function getBindingConflictLabel(
  settings: GameSettings,
  code: string,
  targetAction: RunControlAction,
  targetSlot: BindingSlot
): string | undefined {
  if (!code) {
    return undefined;
  }

  for (const action of RUN_CONTROL_ACTIONS) {
    const binding = settings.keyBindings[action];
    for (const slot of ['primary', 'secondary'] as BindingSlot[]) {
      if (action === targetAction && slot === targetSlot) {
        continue;
      }

      if (binding[slot] === code) {
        return RUN_CONTROL_LABELS[action];
      }
    }
  }

  return undefined;
}

export function setKeyBindingIfAvailable(
  settings: GameSettings,
  action: RunControlAction,
  slot: BindingSlot,
  code: string
): { settings: GameSettings; conflictLabel?: string } {
  const normalized = normalizeGameSettings(settings);
  const conflictLabel = getBindingConflictLabel(normalized, code, action, slot);
  if (conflictLabel) {
    return { settings: normalized, conflictLabel };
  }

  const keyBindings = cloneGameSettings(normalized).keyBindings;
  keyBindings[action] = { ...keyBindings[action], [slot]: code };
  return {
    settings: normalizeGameSettings({
      ...normalized,
      keyBindings
    })
  };
}

export function isPrimaryFireInputActive(settings: GameSettings, manualFireActive: boolean): boolean {
  return manualFireActive || settings.accessibility.autoFirePrimary;
}

export function cloneGameSettings(settings: GameSettings): GameSettings {
  return {
    settingsVersion: CURRENT_SETTINGS_VERSION,
    movementMode: settings.movementMode,
    autoOpenDebriefOnDeath: settings.autoOpenDebriefOnDeath,
    graphics: { ...settings.graphics },
    sound: { ...settings.sound },
    accessibility: { ...settings.accessibility },
    keyBindings: Object.fromEntries(
      RUN_CONTROL_ACTIONS.map((action) => [action, { ...settings.keyBindings[action] }])
    ) as Record<RunControlAction, KeyBinding>
  };
}

function normalizeGameSettings(raw: unknown): GameSettings {
  const record = isRecord(raw) ? raw : {};
  const defaults = cloneGameSettings(DEFAULT_GAME_SETTINGS);
  const movementMode = record.movementMode === 'worldRelative' ? 'worldRelative' : defaults.movementMode;
  const autoOpenDebriefOnDeath =
    typeof record.autoOpenDebriefOnDeath === 'boolean'
      ? record.autoOpenDebriefOnDeath
      : defaults.autoOpenDebriefOnDeath;
  const graphicsRecord = isRecord(record.graphics) ? record.graphics : {};
  const soundRecord = isRecord(record.sound) ? record.sound : {};
  const accessibilityRecord = isRecord(record.accessibility) ? record.accessibility : {};
  const rawBindings = isRecord(record.keyBindings) ? record.keyBindings : {};

  for (const action of RUN_CONTROL_ACTIONS) {
    const rawBinding = isRecord(rawBindings[action]) ? rawBindings[action] : {};
    const primary = typeof rawBinding.primary === 'string' && rawBinding.primary ? rawBinding.primary : defaults.keyBindings[action].primary;
    const secondary =
      typeof rawBinding.secondary === 'string' && rawBinding.secondary
        ? rawBinding.secondary
        : defaults.keyBindings[action].secondary;
    defaults.keyBindings[action] = { primary, secondary };
  }

  defaults.settingsVersion = CURRENT_SETTINGS_VERSION;
  defaults.movementMode = movementMode;
  defaults.autoOpenDebriefOnDeath = autoOpenDebriefOnDeath;
  defaults.graphics = {
    vfxDensity: normalizeRange(graphicsRecord.vfxDensity, defaults.graphics.vfxDensity, 0.25, 1),
    screenShakeAmount: normalizeRange(graphicsRecord.screenShakeAmount, defaults.graphics.screenShakeAmount, 0, 1),
    brightness: normalizeRange(graphicsRecord.brightness, defaults.graphics.brightness, 0.75, 1.25)
  };
  defaults.sound = {
    masterVolume: normalizeRange(soundRecord.masterVolume, defaults.sound.masterVolume, 0, 1),
    musicVolume: normalizeRange(soundRecord.musicVolume, defaults.sound.musicVolume, 0, 1),
    sfxVolume: normalizeRange(soundRecord.sfxVolume, defaults.sound.sfxVolume, 0, 1),
    uiVolume: normalizeRange(soundRecord.uiVolume, defaults.sound.uiVolume, 0, 1),
    muted: typeof soundRecord.muted === 'boolean' ? soundRecord.muted : defaults.sound.muted
  };
  defaults.accessibility = {
    reducedShake:
      typeof accessibilityRecord.reducedShake === 'boolean'
        ? accessibilityRecord.reducedShake
        : defaults.accessibility.reducedShake,
    reducedFlash:
      typeof accessibilityRecord.reducedFlash === 'boolean'
        ? accessibilityRecord.reducedFlash
        : defaults.accessibility.reducedFlash,
    highContrast:
      typeof accessibilityRecord.highContrast === 'boolean'
        ? accessibilityRecord.highContrast
        : defaults.accessibility.highContrast,
    textScale: normalizeRange(accessibilityRecord.textScale, defaults.accessibility.textScale, 0.9, 1.25),
    colorSafeShots:
      typeof accessibilityRecord.colorSafeShots === 'boolean'
        ? accessibilityRecord.colorSafeShots
        : defaults.accessibility.colorSafeShots,
    autoFirePrimary:
      typeof accessibilityRecord.autoFirePrimary === 'boolean'
        ? accessibilityRecord.autoFirePrimary
        : defaults.accessibility.autoFirePrimary
  };

  return defaults;
}

function normalizeRange(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
