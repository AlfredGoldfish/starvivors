import Phaser from 'phaser';
import {
  cloneGameSettings,
  formatKeyCode,
  getBindingConflicts,
  RUN_CONTROL_ACTIONS,
  RUN_CONTROL_LABELS,
  type BindingSlot,
  type GameSettings,
  type RunControlAction
} from '../systems/gameSettings';
import {
  addScreenButton,
  drawCockpitDivider,
  UI_COLORS,
  UI_FONT,
  type ScreenHandle
} from './screenUi';
import {
  addPreRunNav,
  drawPreRunPanelWindow,
  getPreRunModuleLayout,
  type PreRunNavConfig
} from './preRunHubScreen';

export type SettingsScreenTab = 'graphics' | 'sound' | 'controls' | 'gameplay' | 'accessibility';

export interface SharedSettingsEditorConfig {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  actionZones: Phaser.GameObjects.Zone[];
  settings: GameSettings;
  activeTab: SettingsScreenTab;
  screenCenterX: number;
  screenCenterY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  awaitingBinding?: { action: RunControlAction; slot: BindingSlot };
  bindingError?: string;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onSelectTab: (tab: SettingsScreenTab) => void;
  onChangeSettings: (settings: GameSettings) => void;
  onCaptureBinding: (action: RunControlAction, slot: BindingSlot) => void;
  onResetControls: () => void;
  onResetAll: () => void;
}

export interface SettingsHubScreenConfig
  extends Omit<SharedSettingsEditorConfig, 'container' | 'actionZones' | 'screenCenterX' | 'screenCenterY' | 'x' | 'y' | 'width' | 'height'> {
  nav: Omit<PreRunNavConfig, 'scene' | 'container' | 'actionZones' | 'activeTab'>;
}

const SETTINGS_TABS: SettingsScreenTab[] = ['graphics', 'sound', 'controls', 'gameplay', 'accessibility'];
type SoundVolumeSettingKey = 'masterVolume' | 'musicVolume' | 'sfxVolume' | 'uiVolume';
const TAB_LABELS: Record<SettingsScreenTab, string> = {
  graphics: 'Graphics',
  sound: 'Sound',
  controls: 'Controls',
  gameplay: 'Gameplay',
  accessibility: 'Access'
};

export function createSettingsHubScreen(config: SettingsHubScreenConfig): ScreenHandle {
  const { width, height, screenCenterX, screenCenterY, moduleCenterX, moduleCenterY } = getPreRunModuleLayout(config.scene);
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = config.scene.add.graphics();
  const container = config.scene.add.container(screenCenterX, screenCenterY, [background]).setScrollFactor(0).setDepth(1300);
  const panelX = -moduleCenterX + 34;
  const panelY = -moduleCenterY + 88;
  const panelWidth = width - 68;
  const panelBottom = moduleCenterY - 98;
  const panelHeight = Math.max(260, panelBottom - panelY);

  drawPreRunPanelWindow(background, width, height);
  container.add(
    config.scene.add
      .text(-moduleCenterX + 42, -moduleCenterY + 24, 'SETTINGS', {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, 24),
        color: '#f2fbff',
        align: 'left'
      })
      .setOrigin(0, 0)
  );
  container.add(
    config.scene.add
      .text(moduleCenterX - 42, -moduleCenterY + 24, 'Shared run, audio, display, and access options', {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, 14),
        color: '#c8f7ff',
        align: 'right',
        fixedWidth: Math.max(220, width * 0.48),
        wordWrap: { width: Math.max(220, width * 0.48), useAdvancedWrap: true }
      })
      .setOrigin(1, 0)
  );

  addSettingsEditorContent({
    ...config,
    container,
    actionZones,
    screenCenterX,
    screenCenterY,
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight
  });
  addPreRunNav({ ...config.nav, scene: config.scene, container, actionZones, activeTab: 'settings' });

  return { container, actionZones };
}

export function addSettingsEditorContent(config: SharedSettingsEditorConfig): void {
  const background = config.scene.add.graphics();
  config.container.add(background);
  drawEditorShell(config, background);
  addSettingsTabs(config);

  switch (config.activeTab) {
    case 'graphics':
      addGraphicsTab(config);
      break;
    case 'sound':
      addSoundTab(config);
      break;
    case 'controls':
      addControlsTab(config);
      break;
    case 'gameplay':
      addGameplayTab(config);
      break;
    case 'accessibility':
      addAccessibilityTab(config);
      break;
  }
}

function drawEditorShell(config: SharedSettingsEditorConfig, graphics: Phaser.GameObjects.Graphics): void {
  graphics.fillStyle(0x02040a, 0.52);
  graphics.fillRoundedRect(config.x, config.y, config.width, config.height, 6);
  graphics.fillStyle(0x071018, 0.92);
  graphics.fillRoundedRect(config.x + 4, config.y + 4, config.width - 8, config.height - 8, 5);
  graphics.lineStyle(1.5, UI_COLORS.cyan, config.settings.accessibility.highContrast ? 0.94 : 0.58);
  graphics.strokeRoundedRect(config.x, config.y, config.width, config.height, 6);
  drawCockpitDivider(graphics, config.x + 16, config.y + 48, config.x + config.width - 16, UI_COLORS.steel, 0.44);
}

function addSettingsTabs(config: SharedSettingsEditorConfig): void {
  const gap = config.width < 560 ? 5 : 8;
  const tabWidth = Math.max(58, (config.width - 24 - gap * (SETTINGS_TABS.length - 1)) / SETTINGS_TABS.length);
  const tabY = config.y + 10;
  let tabX = config.x + 12 + tabWidth / 2;

  for (const tab of SETTINGS_TABS) {
    addScreenButton({
      scene: config.scene,
      container: config.container,
      actionZones: config.actionZones,
      screenCenterX: config.screenCenterX,
      screenCenterY: config.screenCenterY,
      x: tabX,
      y: tabY,
      width: tabWidth,
      height: 30,
      label: TAB_LABELS[tab],
      callback: () => config.onSelectTab(tab),
      isSelected: config.activeTab === tab,
      fontSize: tabWidth < 78 ? '11px' : tabWidth < 96 ? '12px' : '14px',
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
    tabX += tabWidth + gap;
  }
}

function addGraphicsTab(config: SharedSettingsEditorConfig): void {
  let y = tabContentY(config);
  addBodyText(config, y, 'Tune display feedback that is already active in the run renderer.');
  y += rowStep(config) * 1.18;
  addStepperSetting(config, y, 'VFX density', `${Math.round(config.settings.graphics.vfxDensity * 100)}%`, () =>
    updateSettings(config, {
      graphics: {
        ...config.settings.graphics,
        vfxDensity: stepNumber(config.settings.graphics.vfxDensity, -0.25, 0.25, 1)
      }
    }), () =>
    updateSettings(config, {
      graphics: {
        ...config.settings.graphics,
        vfxDensity: stepNumber(config.settings.graphics.vfxDensity, 0.25, 0.25, 1)
      }
    }));
  y += rowStep(config);
  addStepperSetting(config, y, 'Screen shake', `${Math.round(config.settings.graphics.screenShakeAmount * 100)}%`, () =>
    updateSettings(config, {
      graphics: {
        ...config.settings.graphics,
        screenShakeAmount: stepNumber(config.settings.graphics.screenShakeAmount, -0.25, 0, 1)
      }
    }), () =>
    updateSettings(config, {
      graphics: {
        ...config.settings.graphics,
        screenShakeAmount: stepNumber(config.settings.graphics.screenShakeAmount, 0.25, 0, 1)
      }
    }));
  y += rowStep(config);
  addStepperSetting(config, y, 'Brightness', `${Math.round(config.settings.graphics.brightness * 100)}%`, () =>
    updateSettings(config, {
      graphics: {
        ...config.settings.graphics,
        brightness: stepNumber(config.settings.graphics.brightness, -0.05, 0.75, 1.25)
      }
    }), () =>
    updateSettings(config, {
      graphics: {
        ...config.settings.graphics,
        brightness: stepNumber(config.settings.graphics.brightness, 0.05, 0.75, 1.25)
      }
    }));
}

function addSoundTab(config: SharedSettingsEditorConfig): void {
  let y = tabContentY(config);
  addBodyText(
    config,
    y,
    'Master, SFX, and UI now drive procedural effects. Music is saved for the later music/ambience pass.'
  );
  y += rowStep(config) * 1.38;
  addToggleSetting(config, y, 'Mute audio', config.settings.sound.muted, () =>
    updateSettings(config, { sound: { ...config.settings.sound, muted: !config.settings.sound.muted } }));
  y += rowStep(config);
  addVolumeSetting(config, y, 'Master', 'masterVolume');
  y += rowStep(config);
  addVolumeSetting(config, y, 'Music (reserved)', 'musicVolume');
  y += rowStep(config);
  addVolumeSetting(config, y, 'SFX', 'sfxVolume');
  y += rowStep(config);
  addVolumeSetting(config, y, 'UI', 'uiVolume');
}

function addVolumeSetting(config: SharedSettingsEditorConfig, y: number, label: string, key: SoundVolumeSettingKey): void {
  const value = config.settings.sound[key];

  addStepperSetting(config, y, label, `${Math.round(value * 100)}%`, () =>
    updateSettings(config, {
      sound: {
        ...config.settings.sound,
        [key]: stepNumber(value, -0.1, 0, 1)
      }
    }), () =>
    updateSettings(config, {
      sound: {
        ...config.settings.sound,
        [key]: stepNumber(value, 0.1, 0, 1)
      }
    }));
}

function addControlsTab(config: SharedSettingsEditorConfig): void {
  const conflicts = getBindingConflicts(config.settings);
  const contentY = tabContentY(config);
  const compact = config.width < 620;
  const rowHeight = compact ? 28 : 31;
  const labelWidth = compact ? Math.max(116, config.width - 242) : Math.min(270, config.width - 330);
  const primaryX = config.x + 22 + labelWidth + 50;
  const secondaryX = primaryX + (compact ? 82 : 104);
  const buttonWidth = compact ? 72 : 92;

  config.container.add(
    config.scene.add
      .text(config.x + 22, contentY, 'Action', {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, compact ? 11 : 12),
        color: '#8090a6'
      })
      .setOrigin(0, 0)
  );
  config.container.add(
    config.scene.add
      .text(primaryX, contentY, 'Primary', {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, compact ? 11 : 12),
        color: '#8090a6',
        align: 'center',
        fixedWidth: buttonWidth
      })
      .setOrigin(0.5, 0)
  );
  config.container.add(
    config.scene.add
      .text(secondaryX, contentY, 'Secondary', {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, compact ? 11 : 12),
        color: '#8090a6',
        align: 'center',
        fixedWidth: buttonWidth
      })
      .setOrigin(0.5, 0)
  );

  for (let index = 0; index < RUN_CONTROL_ACTIONS.length; index += 1) {
    const action = RUN_CONTROL_ACTIONS[index];
    const binding = config.settings.keyBindings[action];
    const y = contentY + 22 + index * rowHeight;
    const color = conflicts.has(action) ? '#ffb0b8' : '#f2fbff';
    const label = config.scene.add
      .text(config.x + 22, y + 6, RUN_CONTROL_LABELS[action], {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, compact ? 11 : 12),
        color,
        fixedWidth: labelWidth,
        wordWrap: { width: labelWidth, useAdvancedWrap: true }
      })
      .setOrigin(0, 0);
    config.container.add(label);

    addBindingButton(config, action, 'primary', primaryX, y, buttonWidth, binding.primary);
    addBindingButton(config, action, 'secondary', secondaryX, y, buttonWidth, binding.secondary);
  }

  const hint =
    config.bindingError ??
    (config.awaitingBinding
      ? `Press a key for ${RUN_CONTROL_LABELS[config.awaitingBinding.action]}; Esc cancels.`
      : conflicts.size > 0
        ? 'Resolve duplicate bindings before relying on those actions.'
        : 'Click a binding to remap it. Duplicate keys are blocked.');
  const hintY = Math.min(config.y + config.height - 78, contentY + 28 + RUN_CONTROL_ACTIONS.length * rowHeight);
  addBodyText(config, hintY, hint, config.bindingError || conflicts.size > 0 ? '#ffb0b8' : '#c8f7ff');

  const resetY = config.y + config.height - 39;
  addScreenButton({
    scene: config.scene,
    container: config.container,
    actionZones: config.actionZones,
    screenCenterX: config.screenCenterX,
    screenCenterY: config.screenCenterY,
    x: config.x + Math.min(116, config.width * 0.28),
    y: resetY,
    width: compact ? 136 : 168,
    height: 28,
    label: 'Reset controls',
    callback: config.onResetControls,
    fontSize: compact ? '12px' : '14px',
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container: config.container,
    actionZones: config.actionZones,
    screenCenterX: config.screenCenterX,
    screenCenterY: config.screenCenterY,
    x: config.x + Math.min(286, config.width * 0.64),
    y: resetY,
    width: compact ? 118 : 146,
    height: 28,
    label: 'Reset all',
    callback: config.onResetAll,
    fontSize: compact ? '12px' : '14px',
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}

function addGameplayTab(config: SharedSettingsEditorConfig): void {
  let y = tabContentY(config);
  addBodyText(config, y, 'Run preferences that already affect launch, movement, and debrief flow.');
  y += rowStep(config) * 1.18;
  addToggleSetting(
    config,
    y,
    'Movement mode',
    config.settings.movementMode === 'worldRelative',
    () =>
      updateSettings(config, {
        movementMode: config.settings.movementMode === 'shipRelative' ? 'worldRelative' : 'shipRelative'
    }),
    config.settings.movementMode === 'shipRelative' ? 'Ship-relative' : 'World-relative'
  );
  y += rowStep(config);
  addToggleSetting(
    config,
    y,
    'Auto-open debrief',
    config.settings.autoOpenDebriefOnDeath,
    () => updateSettings(config, { autoOpenDebriefOnDeath: !config.settings.autoOpenDebriefOnDeath }),
    config.settings.autoOpenDebriefOnDeath ? 'After 5s' : 'Manual'
  );
}

function addAccessibilityTab(config: SharedSettingsEditorConfig): void {
  let y = tabContentY(config);
  addBodyText(config, y, 'Reduce intense feedback and improve combat readability without changing balance.');
  y += rowStep(config) * 1.18;
  addToggleSetting(config, y, 'Reduced shake', config.settings.accessibility.reducedShake, () =>
    updateSettings(config, {
      accessibility: {
        ...config.settings.accessibility,
        reducedShake: !config.settings.accessibility.reducedShake
      }
    }));
  y += rowStep(config);
  addToggleSetting(config, y, 'Reduced flash', config.settings.accessibility.reducedFlash, () =>
    updateSettings(config, {
      accessibility: {
        ...config.settings.accessibility,
        reducedFlash: !config.settings.accessibility.reducedFlash
      }
    }));
  y += rowStep(config);
  addToggleSetting(config, y, 'High contrast', config.settings.accessibility.highContrast, () =>
    updateSettings(config, {
      accessibility: {
        ...config.settings.accessibility,
        highContrast: !config.settings.accessibility.highContrast
      }
    }));
  y += rowStep(config);
  addStepperSetting(config, y, 'Text scale', `${Math.round(config.settings.accessibility.textScale * 100)}%`, () =>
    updateSettings(config, {
      accessibility: {
        ...config.settings.accessibility,
        textScale: stepNumber(config.settings.accessibility.textScale, -0.05, 0.9, 1.25)
      }
    }), () =>
    updateSettings(config, {
      accessibility: {
        ...config.settings.accessibility,
        textScale: stepNumber(config.settings.accessibility.textScale, 0.05, 0.9, 1.25)
      }
    }));
  y += rowStep(config);
  addToggleSetting(config, y, 'Color-safe shots', config.settings.accessibility.colorSafeShots, () =>
    updateSettings(config, {
      accessibility: {
        ...config.settings.accessibility,
        colorSafeShots: !config.settings.accessibility.colorSafeShots
      }
    }));
  y += rowStep(config);
  addToggleSetting(config, y, 'Input assist', config.settings.accessibility.autoFirePrimary, () =>
    updateSettings(config, {
      accessibility: {
        ...config.settings.accessibility,
        autoFirePrimary: !config.settings.accessibility.autoFirePrimary
      }
    }), config.settings.accessibility.autoFirePrimary ? 'Primary auto-fire' : 'Manual primary');
}

function addStepperSetting(
  config: SharedSettingsEditorConfig,
  y: number,
  label: string,
  value: string,
  onDecrease: () => void,
  onIncrease: () => void
): void {
  const compact = config.width < 560;
  const labelWidth = Math.max(118, config.width - (compact ? 210 : 276));
  addSettingLabel(config, y, label, labelWidth);

  const valueWidth = compact ? 70 : 88;
  const buttonWidth = 30;
  const plusX = config.x + config.width - 26 - buttonWidth / 2;
  const valueX = plusX - buttonWidth / 2 - valueWidth / 2 - 8;
  const minusX = valueX - valueWidth / 2 - buttonWidth / 2 - 8;
  addSmallButton(config, minusX, y, buttonWidth, '-', onDecrease);
  config.container.add(
    config.scene.add
      .text(valueX, y + 14, value, {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, compact ? 12 : 13),
        color: '#f2fbff',
        align: 'center',
        fixedWidth: valueWidth
      })
      .setOrigin(0.5)
  );
  addSmallButton(config, plusX, y, buttonWidth, '+', onIncrease);
}

function addToggleSetting(
  config: SharedSettingsEditorConfig,
  y: number,
  label: string,
  value: boolean,
  onToggle: () => void,
  valueLabel?: string
): void {
  const compact = config.width < 560;
  const buttonWidth = compact ? 124 : 158;
  const labelWidth = Math.max(118, config.width - buttonWidth - 50);
  addSettingLabel(config, y, label, labelWidth);
  addScreenButton({
    scene: config.scene,
    container: config.container,
    actionZones: config.actionZones,
    screenCenterX: config.screenCenterX,
    screenCenterY: config.screenCenterY,
    x: config.x + config.width - 26 - buttonWidth / 2,
    y,
    width: buttonWidth,
    height: 28,
    label: valueLabel ?? (value ? 'On' : 'Off'),
    callback: onToggle,
    isSelected: value,
    fontSize: compact ? '12px' : '13px',
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}

function addBindingButton(
  config: SharedSettingsEditorConfig,
  action: RunControlAction,
  slot: BindingSlot,
  x: number,
  y: number,
  width: number,
  code: string | undefined
): void {
  const isWaiting = config.awaitingBinding?.action === action && config.awaitingBinding.slot === slot;
  addScreenButton({
    scene: config.scene,
    container: config.container,
    actionZones: config.actionZones,
    screenCenterX: config.screenCenterX,
    screenCenterY: config.screenCenterY,
    x,
    y,
    width,
    height: 24,
    label: isWaiting ? '...' : formatKeyCode(code),
    callback: () => config.onCaptureBinding(action, slot),
    isSelected: isWaiting,
    fontSize: width < 80 ? '11px' : '12px',
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}

function addSmallButton(
  config: SharedSettingsEditorConfig,
  x: number,
  y: number,
  width: number,
  label: string,
  callback: () => void
): void {
  addScreenButton({
    scene: config.scene,
    container: config.container,
    actionZones: config.actionZones,
    screenCenterX: config.screenCenterX,
    screenCenterY: config.screenCenterY,
    x,
    y,
    width,
    height: 28,
    label,
    callback,
    fontSize: '16px',
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}

function addSettingLabel(config: SharedSettingsEditorConfig, y: number, label: string, width: number): void {
  config.container.add(
    config.scene.add
      .text(config.x + 22, y + 5, label, {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, config.width < 560 ? 12 : 14),
        color: '#f2fbff',
        fixedWidth: width,
        wordWrap: { width, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
  );
}

function addBodyText(config: SharedSettingsEditorConfig, y: number, text: string, color = '#c8f7ff'): void {
  const width = config.width - 44;
  config.container.add(
    config.scene.add
      .text(config.x + 22, y, text, {
        fontFamily: UI_FONT,
        fontSize: scaledFont(config.settings, config.width < 560 ? 12 : 14),
        color,
        fixedWidth: width,
        lineSpacing: 4,
        wordWrap: { width, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
  );
}

function updateSettings(config: SharedSettingsEditorConfig, partial: Partial<GameSettings>): void {
  config.onChangeSettings({
    ...cloneGameSettings(config.settings),
    ...partial
  });
}

function tabContentY(config: SharedSettingsEditorConfig): number {
  return config.y + 62;
}

function rowStep(config: SharedSettingsEditorConfig): number {
  return Math.round((config.width < 560 ? 35 : 38) * config.settings.accessibility.textScale);
}

function scaledFont(settings: GameSettings, base: number): string {
  return `${Math.round(base * settings.accessibility.textScale)}px`;
}

function stepNumber(value: number, step: number, min: number, max: number): number {
  return Math.round(Phaser.Math.Clamp(value + step, min, max) * 100) / 100;
}
