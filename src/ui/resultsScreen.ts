import Phaser from 'phaser';
import { addScreenButton, type ScreenHandle } from './screenUi';

export interface ResultsScreenConfig {
  scene: Phaser.Scene;
  survivalTimeLabel: string;
  scrapCollected: number;
  creditsEarned: number;
  totalCredits: number;
  missionName: string;
  missionStatus: string;
  scrapToCreditRate: number;
  scrapCreditMultiplier: number;
  canContinueRun: boolean;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onContinueRun: () => void;
  onRestartRun: () => void;
  onMainMenu: () => void;
  onShop: () => void;
}

export function createResultsScreen(config: ResultsScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 560);
  const panelHeight = Math.min(height - 48, config.canContinueRun ? 520 : 474);
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const buttonWidth = 220;
  const buttonHeight = 38;
  const buttonGap = 10;
  const buttonLabels = config.canContinueRun
    ? ['Continue Run', 'Restart Run', 'Main Menu', 'Shop']
    : ['Restart Run', 'Main Menu', 'Shop'];
  const buttonStackHeight = buttonLabels.length * buttonHeight + (buttonLabels.length - 1) * buttonGap;
  const buttonTop = panelY + panelHeight - 28 - buttonStackHeight;
  const textTop = panelY + 30;
  const detailsWidth = panelWidth - 64;
  const actionZones: Phaser.GameObjects.Zone[] = [];

  const background = config.scene.add.graphics();
  background.fillStyle(0x02040a, 0.78);
  background.fillRect(-width / 2, -height / 2, width, height);
  background.fillStyle(0x071018, 0.96);
  background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
  background.lineStyle(2, 0x42f5d7, 0.82);
  background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

  const text = config.scene.add
    .text(
      panelX + 32,
      textTop,
      `RUN RESULTS\n` +
        `Survival time        ${config.survivalTimeLabel}\n` +
        `Scrap collected      ${config.scrapCollected}\n` +
        `Credits earned       ${config.creditsEarned}\n` +
        `Total credits        ${config.totalCredits}\n` +
        `Mission              ${config.missionName} ${config.missionStatus}\n` +
        `Conversion: ${config.scrapToCreditRate} scrap = ${config.scrapToCreditRate} credit x${config.scrapCreditMultiplier.toFixed(2)}\n` +
        `Shortcut: R restarts the run`,
      {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: height < 560 ? '16px' : '18px',
        color: '#f2fbff',
        align: 'left',
        fixedWidth: detailsWidth,
        lineSpacing: height < 560 ? 3 : 5
      }
    )
    .setOrigin(0, 0);

  const container = config.scene.add
    .container(centerX, centerY, [background, text])
    .setScrollFactor(0)
    .setDepth(1250);

  if (config.canContinueRun) {
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: 0,
      y: buttonTop,
      width: buttonWidth,
      height: buttonHeight,
      label: 'Continue Run',
      callback: config.onContinueRun,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
  }
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 0,
    y: buttonTop + (config.canContinueRun ? buttonHeight + buttonGap : 0),
    width: buttonWidth,
    height: buttonHeight,
    label: 'Restart Run',
    callback: config.onRestartRun,
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
    y: buttonTop + (config.canContinueRun ? 2 : 1) * (buttonHeight + buttonGap),
    width: buttonWidth,
    height: buttonHeight,
    label: 'Main Menu',
    callback: config.onMainMenu,
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
    y: buttonTop + (config.canContinueRun ? 3 : 2) * (buttonHeight + buttonGap),
    width: buttonWidth,
    height: buttonHeight,
    label: 'Shop',
    callback: config.onShop,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}
