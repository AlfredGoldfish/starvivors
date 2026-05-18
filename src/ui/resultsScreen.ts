import Phaser from 'phaser';
import { addScreenButton, type ScreenHandle } from './screenUi';

export interface ResultsScreenConfig {
  scene: Phaser.Scene;
  survivalTimeLabel: string;
  scrapCollected: number;
  creditsEarned: number;
  totalCredits: number;
  scrapToCreditRate: number;
  scrapCreditMultiplier: number;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onRestartRun: () => void;
  onMainMenu: () => void;
  onShop: () => void;
}

export function createResultsScreen(config: ResultsScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 520);
  const panelHeight = Math.min(height - 48, 430);
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
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
      0,
      panelY + 28,
      `RUN RESULTS\n\n` +
        `Survival time        ${config.survivalTimeLabel}\n` +
        `Scrap collected      ${config.scrapCollected}\n` +
        `Credits earned       ${config.creditsEarned}\n` +
        `Total credits        ${config.totalCredits}\n\n` +
        `Conversion: ${config.scrapToCreditRate} scrap = ${config.scrapToCreditRate} credit x${config.scrapCreditMultiplier.toFixed(2)}\n` +
        `Press R to restart`,
      {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '18px',
        color: '#f2fbff',
        align: 'left',
        fixedWidth: panelWidth - 64,
        lineSpacing: 5
      }
    )
    .setOrigin(0.5, 0);

  const container = config.scene.add
    .container(centerX, centerY, [background, text])
    .setScrollFactor(0)
    .setDepth(1250);

  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 0,
    y: panelY + panelHeight - 150,
    width: 220,
    height: 38,
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
    y: panelY + panelHeight - 104,
    width: 220,
    height: 38,
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
    y: panelY + panelHeight - 58,
    width: 220,
    height: 38,
    label: 'Shop',
    callback: config.onShop,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}
