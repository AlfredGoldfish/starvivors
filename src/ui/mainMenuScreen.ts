import Phaser from 'phaser';
import { addScreenButton, drawCockpitBackdrop, drawCockpitPanel, UI_COLORS, UI_FONT, type ScreenHandle } from './screenUi';

export interface MainMenuScreenConfig {
  scene: Phaser.Scene;
  totalCredits: number;
  selectedShipDisplayName: string;
  selectedMissionDisplayName: string;
  selectedMissionDescription: string;
  selectedMissionDifficulty: string;
  selectedMissionRewardPreview: string;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onStartRun: () => void;
  onCycleMission: () => void;
  onShipSelect: () => void;
  onShop: () => void;
}

export function createMainMenuScreen(config: MainMenuScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 520);
  const panelHeight = Math.min(height - 28, 466);
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const buttonStartY = panelY + panelHeight - 192;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = config.scene.add.graphics();
  drawCockpitBackdrop(background, width, height, 1);
  drawCockpitPanel(background, {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    accentColor: UI_COLORS.cyan,
    headerHeight: 90
  });

  const title = config.scene.add
    .text(0, panelY + 38, 'STARVIVORS', {
      fontFamily: UI_FONT,
      fontSize: '38px',
      color: '#f2fbff',
      align: 'center'
    })
    .setOrigin(0.5, 0);
  const credits = config.scene.add
    .text(0, panelY + 104, `Credits ${config.totalCredits}`, {
      fontFamily: UI_FONT,
      fontSize: '20px',
      color: '#c8f7ff',
      align: 'center'
    })
    .setOrigin(0.5, 0);
  const selectedShip = config.scene.add
    .text(0, panelY + 132, `Ship ${config.selectedShipDisplayName}`, {
      fontFamily: UI_FONT,
      fontSize: '16px',
      color: '#9fb5d1',
      align: 'center'
    })
    .setOrigin(0.5, 0);
  const selectedMission = config.scene.add
    .text(
      0,
      panelY + 162,
      `Contract ${config.selectedMissionDisplayName}\n` +
        `${config.selectedMissionDifficulty} risk  ${config.selectedMissionRewardPreview}\n` +
        config.selectedMissionDescription,
      {
        fontFamily: UI_FONT,
        fontSize: '13px',
        color: '#c8f7ff',
        align: 'center',
        fixedWidth: panelWidth - 64,
        lineSpacing: 4,
        wordWrap: { width: panelWidth - 64, useAdvancedWrap: true }
      }
    )
    .setOrigin(0.5, 0);

  const container = config.scene.add
    .container(centerX, centerY, [background, title, credits, selectedShip, selectedMission])
    .setScrollFactor(0)
    .setDepth(1300);

  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 0,
    y: buttonStartY,
    width: 240,
    height: 42,
    label: 'Start Run',
    callback: config.onStartRun,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 0,
    y: buttonStartY + 50,
    width: 240,
    height: 42,
    label: 'Change Contract',
    callback: config.onCycleMission,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 0,
    y: buttonStartY + 100,
    width: 240,
    height: 42,
    label: 'Ship Select',
    callback: config.onShipSelect,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 0,
    y: buttonStartY + 150,
    width: 240,
    height: 42,
    label: 'Shop',
    callback: config.onShop,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}
