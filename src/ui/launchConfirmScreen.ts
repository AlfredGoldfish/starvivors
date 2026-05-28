import Phaser from 'phaser';
import { addScreenButton, drawCockpitBackdrop, drawCockpitPanel, UI_COLORS, UI_FONT, type ScreenHandle } from './screenUi';

export interface LaunchConfirmScreenConfig {
  scene: Phaser.Scene;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function createLaunchConfirmScreen(config: LaunchConfirmScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 390);
  const panelHeight = 188;
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const backdrop = config.scene.add.graphics();
  const panel = config.scene.add.graphics();
  const container = config.scene.add.container(centerX, centerY).setScrollFactor(0).setDepth(1320);
  const blocker = config.scene.add
    .zone(centerX, centerY, width, height)
    .setScrollFactor(0)
    .setDepth(1301)
    .setInteractive({ useHandCursor: false })
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .on('pointerup', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation());

  drawCockpitBackdrop(backdrop, width, height, 0.58);
  drawCockpitPanel(panel, {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    accentColor: UI_COLORS.brass,
    fillColor: 0x050812
  });

  const title = config.scene.add
    .text(0, panelY + 32, 'Confirm Launch', {
      fontFamily: UI_FONT,
      fontSize: '22px',
      color: '#fff0a0',
      align: 'center',
      fixedWidth: panelWidth - 48
    })
    .setOrigin(0.5, 0);
  const body = config.scene.add
    .text(0, panelY + 78, 'Start this run now?', {
      fontFamily: UI_FONT,
      fontSize: '15px',
      color: '#d8e8ff',
      align: 'center',
      fixedWidth: panelWidth - 64,
      wordWrap: { width: panelWidth - 64, useAdvancedWrap: true }
    })
    .setOrigin(0.5, 0);

  container.add([backdrop, panel, title, body]);
  actionZones.push(blocker);

  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: -84,
    y: panelY + 128,
    width: 138,
    height: 40,
    label: 'Launch',
    callback: config.onConfirm,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: 84,
    y: panelY + 128,
    width: 138,
    height: 40,
    label: 'Stay',
    callback: config.onCancel,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}
