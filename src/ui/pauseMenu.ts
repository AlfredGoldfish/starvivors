import Phaser from 'phaser';
import {
  formatKeyCode,
  getBindingConflicts,
  RUN_CONTROL_ACTIONS,
  RUN_CONTROL_LABELS,
  type BindingSlot,
  type GameSettings,
  type MovementMode,
  type RunControlAction
} from '../systems/gameSettings';
import {
  addScreenButton,
  drawCockpitBackdrop,
  drawCockpitDivider,
  drawCockpitPanel,
  UI_COLORS,
  UI_FONT,
  type ScreenHandle
} from './screenUi';

export type PauseMenuTab = 'pause' | 'graphics' | 'sound' | 'controls' | 'gameplay' | 'accessibility';

interface PauseMenuConfig {
  scene: Phaser.Scene;
  settings: GameSettings;
  activeTab: PauseMenuTab;
  awaitingBinding?: { action: RunControlAction; slot: BindingSlot };
  isActionActive: () => boolean;
  resetCursor: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onSelectTab: (tab: PauseMenuTab) => void;
  onSetMovementMode: (mode: MovementMode) => void;
  onCaptureBinding: (action: RunControlAction, slot: BindingSlot) => void;
  onResetControls: () => void;
  onResetAll: () => void;
}

const SETTINGS_TABS: PauseMenuTab[] = ['graphics', 'sound', 'controls', 'gameplay', 'accessibility'];
const TAB_LABELS: Record<PauseMenuTab, string> = {
  pause: 'Pause',
  graphics: 'Graphics',
  sound: 'Sound',
  controls: 'Controls',
  gameplay: 'Gameplay',
  accessibility: 'Access'
};

export function createPauseMenuScreen(config: PauseMenuConfig): ScreenHandle {
  const scene = config.scene;
  const width = scene.scale.width;
  const height = scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 780);
  const panelHeight = Math.min(height - 48, 620);
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = scene.add.graphics();
  const container = scene.add.container(centerX, centerY, [background]).setScrollFactor(0).setDepth(1250);

  drawCockpitBackdrop(background, width, height, 0.72);
  drawCockpitPanel(background, {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    accentColor: config.activeTab === 'pause' ? UI_COLORS.cyan : UI_COLORS.brass,
    headerHeight: 66
  });
  drawCockpitDivider(background, panelX + 24, panelY + 112, panelX + panelWidth - 24, UI_COLORS.steel, 0.42);

  const title = scene.add
    .text(panelX + 28, panelY + 24, config.activeTab === 'pause' ? 'PAUSED' : 'SETTINGS', {
      fontFamily: UI_FONT,
      fontSize: '28px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  container.add(title);

  addScreenButton({
    scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + panelWidth - 84,
    y: panelY + 22,
    width: 56,
    height: 30,
    label: 'ESC',
    callback: config.onResume,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  if (config.activeTab === 'pause') {
    addPauseActions(config, container, actionZones, centerX, centerY, panelX, panelY, panelWidth);
  } else {
    addSettingsContent(config, container, actionZones, centerX, centerY, panelX, panelY, panelWidth, panelHeight);
  }

  return { container, actionZones };
}

function addPauseActions(
  config: PauseMenuConfig,
  container: Phaser.GameObjects.Container,
  actionZones: Phaser.GameObjects.Zone[],
  centerX: number,
  centerY: number,
  panelX: number,
  panelY: number,
  panelWidth: number
): void {
  const scene = config.scene;
  const buttonWidth = Math.min(360, panelWidth - 96);
  const buttonX = 0;
  const startY = panelY + 118;
  const actions: Array<[string, () => void]> = [
    ['Resume', config.onResume],
    ['Settings', () => config.onSelectTab('controls')],
    ['Restart Run', config.onRestart],
    ['Main Menu', config.onMainMenu]
  ];

  for (let index = 0; index < actions.length; index += 1) {
    const [label, callback] = actions[index];
    addScreenButton({
      scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: buttonX,
      y: startY + index * 58,
      width: buttonWidth,
      height: 40,
      label,
      callback,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
  }
}

function addSettingsContent(
  config: PauseMenuConfig,
  container: Phaser.GameObjects.Container,
  actionZones: Phaser.GameObjects.Zone[],
  centerX: number,
  centerY: number,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number
): void {
  const scene = config.scene;
  const tabY = panelY + 76;
  const tabWidth = Math.max(88, Math.min(116, (panelWidth - 56) / SETTINGS_TABS.length - 6));
  const firstTabX = panelX + 28 + tabWidth / 2;

  for (let index = 0; index < SETTINGS_TABS.length; index += 1) {
    const tab = SETTINGS_TABS[index];
    addScreenButton({
      scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: firstTabX + index * (tabWidth + 6),
      y: tabY,
      width: tabWidth,
      height: 30,
      label: TAB_LABELS[tab],
      callback: () => config.onSelectTab(tab),
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
  }

  if (config.activeTab === 'controls') {
    addControlsTab(config, container, actionZones, centerX, centerY, panelX, panelY, panelWidth, panelHeight);
    return;
  }

  addPlaceholderTab(config, container, panelX, panelY, panelWidth);
}

function addPlaceholderTab(
  config: PauseMenuConfig,
  container: Phaser.GameObjects.Container,
  panelX: number,
  panelY: number,
  panelWidth: number
): void {
  const copy: Record<PauseMenuTab, string> = {
    pause: '',
    graphics: 'Display mode, resolution, quality, VFX density, screen shake, and brightness placeholders.',
    sound: 'Master volume, music, effects, UI volume, mute, and output placeholders.',
    controls: '',
    gameplay: 'Difficulty assists, camera behavior, pickup readability, and run preference placeholders.',
    accessibility: 'Color options, flash intensity, text scale, contrast, and input assist placeholders.'
  };

  const text = config.scene.add
    .text(panelX + 34, panelY + 138, copy[config.activeTab], {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '17px',
      color: '#c8f7ff',
      fixedWidth: panelWidth - 68,
      wordWrap: { width: panelWidth - 68 }
    })
    .setOrigin(0, 0);
  container.add(text);
}

function addControlsTab(
  config: PauseMenuConfig,
  container: Phaser.GameObjects.Container,
  actionZones: Phaser.GameObjects.Zone[],
  centerX: number,
  centerY: number,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number
): void {
  const scene = config.scene;
  const conflicts = getBindingConflicts(config.settings);
  const modeText = scene.add
    .text(panelX + 34, panelY + 126, 'Movement', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '18px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  container.add(modeText);

  addScreenButton({
    scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + 168,
    y: panelY + 122,
    width: 150,
    height: 30,
    label: config.settings.movementMode === 'shipRelative' ? 'Ship-relative' : 'World-relative',
    callback: () =>
      config.onSetMovementMode(config.settings.movementMode === 'shipRelative' ? 'worldRelative' : 'shipRelative'),
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  const header = scene.add
    .text(panelX + 34, panelY + 168, 'Action'.padEnd(28) + 'Primary'.padEnd(14) + 'Secondary', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: '#8090a6'
    })
    .setOrigin(0, 0);
  container.add(header);

  const visibleActions = RUN_CONTROL_ACTIONS;
  const rowHeight = 32;
  for (let index = 0; index < visibleActions.length; index += 1) {
    const action = visibleActions[index];
    const binding = config.settings.keyBindings[action];
    const y = panelY + 194 + index * rowHeight;
    const color = conflicts.has(action) ? '#ffb0b8' : '#f2fbff';
    const label = scene.add
      .text(panelX + 34, y + 6, RUN_CONTROL_LABELS[action], {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        color,
        fixedWidth: 250
      })
      .setOrigin(0, 0);
    container.add(label);

    addBindingButton(config, container, actionZones, centerX, centerY, action, 'primary', panelX + 352, y, binding.primary);
    addBindingButton(config, container, actionZones, centerX, centerY, action, 'secondary', panelX + 474, y, binding.secondary);
  }

  const hint = config.awaitingBinding
    ? `Press a key for ${RUN_CONTROL_LABELS[config.awaitingBinding.action]} (${config.awaitingBinding.slot}); ESC cancels.`
    : conflicts.size > 0
      ? 'Duplicate bindings are highlighted. The first matching action wins during play.'
      : 'Click a binding to remap it.';
  const hintText = scene.add
    .text(panelX + 34, panelY + panelHeight - 86, hint, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: conflicts.size > 0 ? '#ffb0b8' : '#c8f7ff',
      fixedWidth: panelWidth - 68,
      wordWrap: { width: panelWidth - 68 }
    })
    .setOrigin(0, 0);
  container.add(hintText);

  addScreenButton({
    scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + 126,
    y: panelY + panelHeight - 44,
    width: 180,
    height: 30,
    label: 'Reset controls',
    callback: config.onResetControls,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + 330,
    y: panelY + panelHeight - 44,
    width: 170,
    height: 30,
    label: 'Reset all',
    callback: config.onResetAll,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}

function addBindingButton(
  config: PauseMenuConfig,
  container: Phaser.GameObjects.Container,
  actionZones: Phaser.GameObjects.Zone[],
  centerX: number,
  centerY: number,
  action: RunControlAction,
  slot: BindingSlot,
  x: number,
  y: number,
  code: string | undefined
): void {
  const isWaiting = config.awaitingBinding?.action === action && config.awaitingBinding.slot === slot;
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x,
    y,
    width: 104,
    height: 26,
    label: isWaiting ? '...' : formatKeyCode(code),
    callback: () => config.onCaptureBinding(action, slot),
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}
