import Phaser from 'phaser';
import {
  type BindingSlot,
  type GameSettings,
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
import { addSettingsEditorContent, type SettingsScreenTab } from './settingsScreen';

export type PauseMenuTab = 'pause' | SettingsScreenTab;

interface PauseMenuConfig {
  scene: Phaser.Scene;
  settings: GameSettings;
  activeTab: PauseMenuTab;
  awaitingBinding?: { action: RunControlAction; slot: BindingSlot };
  bindingError?: string;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onSelectTab: (tab: PauseMenuTab) => void;
  onChangeSettings: (settings: GameSettings) => void;
  onCaptureBinding: (action: RunControlAction, slot: BindingSlot) => void;
  onResetControls: () => void;
  onResetAll: () => void;
}

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
      fontSize: scaledFont(config.settings, 28),
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
    fontSize: scaledFont(config.settings, 14),
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
    ['Settings', () => config.onSelectTab('graphics')],
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
      fontSize: scaledFont(config.settings, 16),
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
  if (config.activeTab === 'pause') {
    return;
  }

  addSettingsEditorContent({
    scene: config.scene,
    container,
    actionZones,
    settings: config.settings,
    activeTab: config.activeTab,
    awaitingBinding: config.awaitingBinding,
    bindingError: config.bindingError,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + 24,
    y: panelY + 72,
    width: panelWidth - 48,
    height: panelHeight - 102,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor,
    onSelectTab: config.onSelectTab,
    onChangeSettings: config.onChangeSettings,
    onCaptureBinding: config.onCaptureBinding,
    onResetControls: config.onResetControls,
    onResetAll: config.onResetAll
  });
}

function scaledFont(settings: GameSettings, basePx: number): string {
  return `${Math.round(basePx * settings.accessibility.textScale)}px`;
}
