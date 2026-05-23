import Phaser from 'phaser';
import { missionRegistry, type MissionDefinition, type MissionDefinitionId } from '../data/missions';
import { formatKeyCode, RUN_CONTROL_ACTIONS, RUN_CONTROL_LABELS, type GameSettings } from '../systems/gameSettings';
import {
  addScreenButton,
  drawCockpitBackdrop,
  drawCockpitDivider,
  UI_COLORS,
  type ScreenHandle
} from './screenUi';

export type PreRunHubTab = 'command' | 'hangar' | 'shop' | 'settings';

export interface PreRunNavConfig {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  actionZones: Phaser.GameObjects.Zone[];
  activeTab: PreRunHubTab;
  canPlay: boolean;
  playDisabledReason: string;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onPlay: () => void;
  onShowCommand: () => void;
  onShowHangar: () => void;
  onShowShop: () => void;
  onShowSettings: () => void;
}

export interface SplashScreenConfig {
  scene: Phaser.Scene;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onContinue: () => void;
}

export interface CommandScreenConfig {
  scene: Phaser.Scene;
  totalCredits: number;
  selectedShipName: string;
  selectedMissionId: MissionDefinitionId;
  selectedMission: MissionDefinition;
  nav: Omit<PreRunNavConfig, 'scene' | 'container' | 'actionZones' | 'activeTab'>;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onSelectMission: (missionId: MissionDefinitionId) => void;
}

export interface SettingsHubScreenConfig {
  scene: Phaser.Scene;
  settings: GameSettings;
  nav: Omit<PreRunNavConfig, 'scene' | 'container' | 'actionZones' | 'activeTab'>;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onToggleMovementMode: () => void;
  onResetControls: () => void;
  onResetAll: () => void;
}

const FONT = 'Consolas, "Courier New", monospace';

export function createSplashScreen(config: SplashScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = config.scene.add.graphics();

  background.fillStyle(0x02040a, 1);
  background.fillRect(-centerX, -centerY, width, height);
  background.lineStyle(2, 0x42f5d7, 0.18);
  for (let radius = 54; radius <= 210; radius += 38) {
    background.strokeCircle(0, -18, radius);
  }
  background.lineStyle(5, 0x42f5d7, 0.45);
  background.strokeCircle(0, -18, 82);
  background.fillStyle(0x000000, 0.96);
  background.fillCircle(0, -18, 58);

  const title = config.scene.add
    .text(0, -8, 'STARVIVORS', {
      fontFamily: FONT,
      fontSize: '48px',
      color: '#f2fbff',
      align: 'center'
    })
    .setOrigin(0.5);
  const prompt = config.scene.add
    .text(0, 72, 'CLICK OR PRESS ANY KEY', {
      fontFamily: FONT,
      fontSize: '15px',
      color: '#c8f7ff',
      align: 'center'
    })
    .setOrigin(0.5);

  const container = config.scene.add.container(centerX, centerY, [background, title, prompt]).setScrollFactor(0).setDepth(1300);
  const zone = config.scene.add
    .zone(0, 0, width, height)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1301)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      if (config.isActionActive()) {
        config.onContinue();
      }
    })
    .on('pointerout', () => config.resetCursor());
  actionZones.push(zone);

  const keyHandler = () => {
    if (config.isActionActive()) {
      config.onContinue();
    }
  };
  config.scene.input.keyboard?.once('keydown', keyHandler);

  return { container, actionZones };
}

export function createCommandScreen(config: CommandScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = createHubBackground(config.scene, width, height);
  const header = createHeaderText(config.scene, width, height, 'COMMAND', `Credits ${config.totalCredits}   Ship ${config.selectedShipName}`);
  const container = config.scene.add.container(centerX, centerY, [background, ...header]).setScrollFactor(0).setDepth(1300);
  const panelX = -width / 2 + 40;
  const panelY = -height / 2 + 84;
  const panelWidth = width - 80;
  const rowHeight = 78;
  const gap = 10;

  const selectedModeLabel = config.selectedMission.objectiveType === 'free-range' ? 'RUN MODE' : 'ACTIVE CONTRACT';
  const current = config.scene.add
    .text(panelX, panelY, `ACTIVE CONTRACT\n${config.selectedMission.displayName}\n${config.selectedMission.description}`, {
      fontFamily: FONT,
      fontSize: '18px',
      color: '#f2fbff',
      fixedWidth: Math.min(420, panelWidth),
      lineSpacing: 6,
      wordWrap: { width: Math.min(420, panelWidth), useAdvancedWrap: true }
    })
    .setOrigin(0, 0);
  current.setText(`${selectedModeLabel}\n${config.selectedMission.displayName}\n${config.selectedMission.description}`);
  container.add(current);

  const listX = panelX + Math.min(460, panelWidth * 0.42);
  const listWidth = panelX + panelWidth - listX;
  for (let index = 0; index < missionRegistry.length; index += 1) {
    const mission = missionRegistry[index];
    const y = panelY + index * (rowHeight + gap);
    const selected = mission.id === config.selectedMissionId;
    background.fillStyle(selected ? 0x102633 : 0x111a24, 0.94);
    background.fillRoundedRect(listX, y, listWidth, rowHeight, 6);
    background.lineStyle(1, selected ? 0x42f5d7 : 0x52627f, selected ? 0.9 : 0.72);
    background.strokeRoundedRect(listX, y, listWidth, rowHeight, 6);

    const text = config.scene.add
      .text(
        listX + 16,
        y + 11,
        `${mission.displayName}   ${mission.objectiveType === 'free-range' ? 'Open sector' : `${mission.difficulty} risk`}\n${mission.rewardPreview}\n${mission.description}`,
        {
          fontFamily: FONT,
          fontSize: '13px',
          color: selected ? '#f2fbff' : '#c8f7ff',
          fixedWidth: listWidth - 32,
          lineSpacing: 2,
          wordWrap: { width: listWidth - 32, useAdvancedWrap: true }
        }
      )
      .setOrigin(0, 0);
    container.add(text);

    const zone = config.scene.add
      .zone(centerX + listX, centerY + y, listWidth, rowHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (config.isActionActive()) {
          config.onSelectMission(mission.id);
        }
      })
      .on('pointerout', () => config.resetCursor());
    actionZones.push(zone);
  }

  addPreRunNav({ ...config.nav, scene: config.scene, container, actionZones, activeTab: 'command' });
  return { container, actionZones };
}

export function createSettingsHubScreen(config: SettingsHubScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = createHubBackground(config.scene, width, height);
  const header = createHeaderText(config.scene, width, height, 'SETTINGS', 'Run controls and preferences');
  const container = config.scene.add.container(centerX, centerY, [background, ...header]).setScrollFactor(0).setDepth(1300);
  const panelX = -width / 2 + 48;
  const panelY = -height / 2 + 94;

  const movement = config.scene.add
    .text(panelX, panelY, `Movement Mode\n${config.settings.movementMode === 'shipRelative' ? 'Ship-relative' : 'World-relative'}`, {
      fontFamily: FONT,
      fontSize: '18px',
      color: '#f2fbff',
      lineSpacing: 8
    })
    .setOrigin(0, 0);
  container.add(movement);

  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + 110,
    y: panelY + 78,
    width: 220,
    height: 36,
    label: 'Toggle Movement',
    callback: config.onToggleMovementMode,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + 110,
    y: panelY + 124,
    width: 220,
    height: 36,
    label: 'Reset Controls',
    callback: config.onResetControls,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + 110,
    y: panelY + 170,
    width: 220,
    height: 36,
    label: 'Reset All',
    callback: config.onResetAll,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  const controls = RUN_CONTROL_ACTIONS.map((action) => {
    const binding = config.settings.keyBindings[action];
    return `${RUN_CONTROL_LABELS[action]}: ${formatKeyCode(binding.primary)}${binding.secondary ? ` / ${formatKeyCode(binding.secondary)}` : ''}`;
  }).join('\n');
  const text = config.scene.add
    .text(panelX + 360, panelY, controls, {
      fontFamily: FONT,
      fontSize: '14px',
      color: '#c8f7ff',
      fixedWidth: width - 460,
      lineSpacing: 6
    })
    .setOrigin(0, 0);
  container.add(text);

  addPreRunNav({ ...config.nav, scene: config.scene, container, actionZones, activeTab: 'settings' });
  return { container, actionZones };
}

export function addPreRunNav(config: PreRunNavConfig): void {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const y = height / 2 - 52;
  const buttonWidth = 126;
  const gap = 10;
  const labels: Array<[string, PreRunHubTab, () => void]> = [
    ['HANGAR', 'hangar', config.onShowHangar],
    ['COMMAND', 'command', config.onShowCommand],
    ['SHOP', 'shop', config.onShowShop],
    ['SETTINGS', 'settings', config.onShowSettings]
  ];
  const totalWidth = 172 + gap + labels.length * buttonWidth + (labels.length - 1) * gap;
  let x = -totalWidth / 2 + 86;

  addScreenButton({
    scene: config.scene,
    container: config.container,
    actionZones: config.actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x,
    y,
    width: 172,
    height: 38,
    label: config.canPlay ? 'PLAY' : config.playDisabledReason,
    callback: config.onPlay,
    isEnabled: config.canPlay,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  x += 86 + gap + buttonWidth / 2;
  for (const [label, tab, callback] of labels) {
    addScreenButton({
      scene: config.scene,
      container: config.container,
      actionZones: config.actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x,
      y,
      width: buttonWidth,
      height: 38,
      label: tab === config.activeTab ? `[${label}]` : label,
      callback,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
    x += buttonWidth + gap;
  }
}

function createHubBackground(scene: Phaser.Scene, width: number, height: number): Phaser.GameObjects.Graphics {
  const centerX = width / 2;
  const centerY = height / 2;
  const background = scene.add.graphics();
  drawCockpitBackdrop(background, width, height, 1);
  background.lineStyle(3, UI_COLORS.cyan, 0.86);
  background.strokeRect(-centerX + 3, -centerY + 3, width - 6, height - 6);
  background.lineStyle(1, UI_COLORS.brass, 0.34);
  background.strokeRect(-centerX + 10, -centerY + 10, width - 20, height - 20);
  drawCockpitDivider(background, -centerX + 34, -centerY + 72, centerX - 34, UI_COLORS.steel, 0.5);
  return background;
}

function createHeaderText(scene: Phaser.Scene, width: number, height: number, title: string, subtitle: string): Phaser.GameObjects.Text[] {
  const centerX = width / 2;
  const centerY = height / 2;
  return [
    scene.add
      .text(0, -centerY + 24, title, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: width
      })
      .setOrigin(0.5, 0),
    scene.add
      .text(centerX - 42, -centerY + 30, subtitle, {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#c8f7ff',
        align: 'right'
      })
      .setOrigin(1, 0)
  ];
}
