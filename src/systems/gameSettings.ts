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

export interface GameSettings {
  movementMode: MovementMode;
  keyBindings: Record<RunControlAction, KeyBinding>;
}

const STORAGE_KEY = 'starvivors.gameSettings.v1';

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
  movementMode: 'shipRelative',
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
    ...settings,
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

export function cloneGameSettings(settings: GameSettings): GameSettings {
  return {
    movementMode: settings.movementMode,
    keyBindings: Object.fromEntries(
      RUN_CONTROL_ACTIONS.map((action) => [action, { ...settings.keyBindings[action] }])
    ) as Record<RunControlAction, KeyBinding>
  };
}

function normalizeGameSettings(raw: unknown): GameSettings {
  const record = isRecord(raw) ? raw : {};
  const defaults = cloneGameSettings(DEFAULT_GAME_SETTINGS);
  const movementMode = record.movementMode === 'worldRelative' ? 'worldRelative' : defaults.movementMode;
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

  defaults.movementMode = movementMode;
  return defaults;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
