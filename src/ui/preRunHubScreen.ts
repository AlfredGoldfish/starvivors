import Phaser from 'phaser';
import { missionRegistry, type MissionDefinition, type MissionDefinitionId } from '../data/missions';
import {
  addScreenButton,
  UI_COLORS,
  UI_FONT,
  type ScreenHandle
} from './screenUi';
import { drawCockpitCard } from './cockpitCard';

export type PreRunHubTab = 'start' | 'command' | 'hangar' | 'shop' | 'settings' | 'debrief';

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

const FONT = UI_FONT;
export const PRE_RUN_HEADER_HEIGHT = 72;
export const PRE_RUN_MODULE_TARGET_WIDTH = 1040;
export const PRE_RUN_MODULE_TARGET_HEIGHT = 600;

export interface PreRunModuleLayout {
  width: number;
  height: number;
  screenCenterX: number;
  screenCenterY: number;
  moduleCenterX: number;
  moduleCenterY: number;
}

export function getPreRunModuleLayout(scene: Phaser.Scene): PreRunModuleLayout {
  const margin = scene.scale.width < 720 || scene.scale.height < 560 ? 16 : 24;
  const width = Math.min(PRE_RUN_MODULE_TARGET_WIDTH, Math.max(240, scene.scale.width - margin * 2));
  const height = Math.min(PRE_RUN_MODULE_TARGET_HEIGHT, Math.max(260, scene.scale.height - margin * 2));

  return {
    width,
    height,
    screenCenterX: scene.scale.width / 2,
    screenCenterY: scene.scale.height / 2,
    moduleCenterX: width / 2,
    moduleCenterY: height / 2
  };
}

export function drawPreRunCockpitFrame(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
  drawPreRunPanelWindow(graphics, width, height);
}

export function drawPreRunPanelWindow(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const x = -centerX;
  const y = -centerY;

  graphics.fillStyle(UI_COLORS.void, 1);
  graphics.fillRoundedRect(x, y, width, height, 6);
  graphics.fillStyle(UI_COLORS.panel, 1);
  graphics.fillRoundedRect(x + 6, y + 6, width - 12, height - 12, 4);

  graphics.lineStyle(2, UI_COLORS.cyan, 0.72);
  graphics.strokeRect(x + 3, y + 3, width - 6, height - 6);
  graphics.lineStyle(1, UI_COLORS.brass, 0.28);
  graphics.strokeRect(x + 10, y + 10, width - 20, height - 20);
  graphics.lineStyle(1, UI_COLORS.steel, 0.32);
  graphics.strokeRect(x + 16, y + 16, width - 32, height - 32);

  const bracket = 28;
  graphics.lineStyle(2, UI_COLORS.cyan, 0.55);
  graphics.lineBetween(x + 16, y + 16, x + 16 + bracket, y + 16);
  graphics.lineBetween(x + 16, y + 16, x + 16, y + 16 + bracket);
  graphics.lineBetween(x + width - 16 - bracket, y + 16, x + width - 16, y + 16);
  graphics.lineBetween(x + width - 16, y + 16, x + width - 16, y + 16 + bracket);
  graphics.lineBetween(x + 16, y + height - 16 - bracket, x + 16, y + height - 16);
  graphics.lineBetween(x + 16, y + height - 16, x + 16 + bracket, y + height - 16);
  graphics.lineBetween(x + width - 16 - bracket, y + height - 16, x + width - 16, y + height - 16);
  graphics.lineBetween(x + width - 16, y + height - 16 - bracket, x + width - 16, y + height - 16);
}

export function createCommandScreen(config: CommandScreenConfig): ScreenHandle {
  const { width, height, screenCenterX, screenCenterY, moduleCenterX, moduleCenterY } = getPreRunModuleLayout(config.scene);
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = createHubBackground(config.scene, width, height);
  const header = createHeaderText(config.scene, width, height, 'COMMAND', `Credits ${config.totalCredits}   Ship ${config.selectedShipName}`);
  const container = config.scene.add.container(screenCenterX, screenCenterY, [background, ...header]).setScrollFactor(0).setDepth(1300);
  const panelX = -moduleCenterX + 34;
  const panelY = -moduleCenterY + 88;
  const panelWidth = width - 68;
  const panelBottom = moduleCenterY - 98;
  const panelHeight = Math.max(260, panelBottom - panelY);
  const gap = 12;
  const summaryWidth = Math.max(286, Math.min(430, panelWidth * 0.38));
  const listX = panelX + summaryWidth + gap;
  const listWidth = panelX + panelWidth - listX;

  drawCockpitCard(background, panelX, panelY, summaryWidth, panelHeight, {
    accentColor: UI_COLORS.brass,
    glow: true,
    dividerOffsets: [86, panelHeight - 74]
  });
  drawCockpitCard(background, listX, panelY, listWidth, panelHeight, {
    accentColor: UI_COLORS.cyan,
    glow: true,
    dividerOffsets: [42]
  });

  const selectedIsFreeRange = config.selectedMission.objectiveType === 'free-range';
  const selectedModeLabel = selectedIsFreeRange ? 'FREE RANGE' : 'CONTRACT READY';
  const selectedMeta = selectedIsFreeRange
    ? `Open sector\nEject from HUD to bank cargo\n${config.selectedMission.rewardPreview}`
    : `${config.selectedMission.difficulty} risk\nObjective: ${config.selectedMission.objectiveLabel}\n${config.selectedMission.rewardPreview}`;
  const summaryTitle = config.scene.add
    .text(panelX + 22, panelY + 18, selectedModeLabel, {
      fontFamily: FONT,
      fontSize: '13px',
      color: '#73f2ff',
      fixedWidth: summaryWidth - 44
    })
    .setOrigin(0, 0);
  const current = config.scene.add
    .text(panelX + 22, panelY + 46, `${config.selectedMission.displayName}\n${config.selectedMission.description}`, {
      fontFamily: FONT,
      fontSize: '18px',
      color: '#f2fbff',
      fixedWidth: summaryWidth - 44,
      lineSpacing: 6,
      wordWrap: { width: summaryWidth - 44, useAdvancedWrap: true }
    })
    .setOrigin(0, 0);
  const summaryMeta = config.scene.add
    .text(
      panelX + 22,
      panelY + panelHeight - 64,
      selectedMeta,
      {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#c8f7ff',
        fixedWidth: summaryWidth - 44,
        lineSpacing: 4,
        wordWrap: { width: summaryWidth - 44, useAdvancedWrap: true }
      }
    )
    .setOrigin(0, 0);
  container.add([summaryTitle, current, summaryMeta]);

  container.add(
    config.scene.add
      .text(listX + 18, panelY + 16, 'RUN OPTIONS', {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#f2fbff'
      })
      .setOrigin(0, 0)
  );

  const rowGap = 8;
  const rowTop = panelY + 56;
  const rowHeight = Math.max(42, Math.min(78, Math.floor((panelHeight - 70 - rowGap * (missionRegistry.length - 1)) / missionRegistry.length)));
  for (let index = 0; index < missionRegistry.length; index += 1) {
    const mission = missionRegistry[index];
    const y = rowTop + index * (rowHeight + rowGap);
    const selected = mission.id === config.selectedMissionId;
    const compactRow = rowHeight < 62;
    background.fillStyle(selected ? UI_COLORS.plateHot : UI_COLORS.plate, 0.94);
    background.fillRoundedRect(listX, y, listWidth, rowHeight, 6);
    background.lineStyle(1.5, selected ? UI_COLORS.cyan : UI_COLORS.steel, selected ? 0.94 : 0.66);
    background.strokeRoundedRect(listX, y, listWidth, rowHeight, 6);
    background.fillStyle(selected ? UI_COLORS.brass : UI_COLORS.steel, selected ? 0.68 : 0.24);
    background.fillRect(listX + 12, y + rowHeight - 5, listWidth - 24, 2);

    const text = config.scene.add
      .text(
        listX + 16,
        y + (compactRow ? 7 : 9),
        compactRow
          ? `${mission.displayName}   ${mission.objectiveType === 'free-range' ? 'Open sector' : `${mission.difficulty} risk`}\n${mission.rewardPreview}`
          : `${mission.displayName}   ${mission.objectiveType === 'free-range' ? 'Bank on eject' : `${mission.difficulty} risk`}\n${mission.objectiveLabel} - ${mission.rewardPreview}\n${mission.description}`,
        {
          fontFamily: FONT,
          fontSize: rowHeight >= 70 ? '13px' : rowHeight >= 52 ? '12px' : '11px',
          color: selected ? '#f2fbff' : '#c8f7ff',
          fixedWidth: listWidth - 32,
          lineSpacing: compactRow ? 1 : rowHeight >= 70 ? 2 : 1,
          wordWrap: { width: listWidth - 32, useAdvancedWrap: true }
        }
      )
      .setOrigin(0, 0);
    container.add(text);

    const zone = config.scene.add
      .zone(screenCenterX + listX, screenCenterY + y, listWidth, rowHeight)
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

export function addPreRunNav(config: PreRunNavConfig): void {
  const { screenCenterX, screenCenterY, moduleCenterY } = getPreRunModuleLayout(config.scene);
  const y = moduleCenterY - 52;
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
    screenCenterX,
    screenCenterY,
    x,
    y,
    width: 172,
    height: 38,
    label: config.canPlay ? 'LAUNCH' : config.playDisabledReason,
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
      screenCenterX,
      screenCenterY,
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
  const background = scene.add.graphics();
  drawPreRunPanelWindow(background, width, height);
  return background;
}

function createHeaderText(scene: Phaser.Scene, width: number, height: number, title: string, subtitle: string): Phaser.GameObjects.Text[] {
  const centerX = width / 2;
  const centerY = height / 2;
  return [
    scene.add
      .text(-centerX + 42, -centerY + 24, title, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#f2fbff',
        align: 'left'
      })
      .setOrigin(0, 0),
    scene.add
      .text(centerX - 42, -centerY + 24, subtitle, {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#c8f7ff',
        align: 'right'
      })
      .setOrigin(1, 0)
  ];
}
