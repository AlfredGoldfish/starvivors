import Phaser from 'phaser';
import { addScreenButton, type ScreenHandle } from './screenUi';

export interface MainMenuScreenConfig {
  scene: Phaser.Scene;
  totalCredits: number;
  selectedShipDisplayName: string;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onStartRun: () => void;
  onShipSelect: () => void;
  onShop: () => void;
}

export function createMainMenuScreen(config: MainMenuScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 520);
  const panelHeight = 374;
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = config.scene.add.graphics();
  background.fillStyle(0x02040a, 1);
  background.fillRect(-width / 2, -height / 2, width, height);
  background.fillStyle(0x071018, 0.96);
  background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
  background.lineStyle(2, 0x42f5d7, 0.82);
  background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

  const title = config.scene.add
    .text(0, panelY + 38, 'STARVIVORS', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '38px',
      color: '#f2fbff',
      align: 'center'
    })
    .setOrigin(0.5, 0);
  const credits = config.scene.add
    .text(0, panelY + 104, `Credits ${config.totalCredits}`, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '20px',
      color: '#c8f7ff',
      align: 'center'
    })
    .setOrigin(0.5, 0);
  const selectedShip = config.scene.add
    .text(0, panelY + 132, `Ship ${config.selectedShipDisplayName}`, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '16px',
      color: '#9fb5d1',
      align: 'center'
    })
    .setOrigin(0.5, 0);

  const container = config.scene.add
    .container(centerX, centerY, [background, title, credits, selectedShip])
    .setScrollFactor(0)
    .setDepth(1300);

  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 0,
    y: panelY + 184,
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
    y: panelY + 238,
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
    y: panelY + 292,
    width: 240,
    height: 42,
    label: 'Shop',
    callback: config.onShop,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}
