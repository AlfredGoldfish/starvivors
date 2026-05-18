import Phaser from 'phaser';
import { PERMANENT_UPGRADE_DEFINITIONS, type PermanentUpgradeDefinition, type PermanentUpgradeId } from '../data/permanentUpgrades';
import type { ShopBackTarget } from '../scenes/gameTypes';
import { addScreenButton, type ScreenHandle } from './screenUi';

export interface ShopScreenConfig {
  scene: Phaser.Scene;
  backTarget: ShopBackTarget;
  totalCredits: number;
  getPermanentUpgradeLevel: (id: PermanentUpgradeId) => number;
  getActivePermanentUpgradeLevel: (id: PermanentUpgradeId) => number;
  isPermanentUpgradeMaxed: (upgrade: PermanentUpgradeDefinition) => boolean;
  canPurchasePermanentUpgrade: (upgrade: PermanentUpgradeDefinition) => boolean;
  getPermanentUpgradeCost: (upgrade: PermanentUpgradeDefinition) => number;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onPurchasePermanentUpgrade: (upgrade: PermanentUpgradeDefinition) => void;
  onAdjustActivePermanentUpgradeLevel: (id: PermanentUpgradeId, delta: number) => void;
  onBack: () => void;
}

export function createShopScreen(config: ShopScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 920);
  const panelHeight = Math.min(height - 48, 640);
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const gridX = panelX + 32;
  const gridWidth = panelWidth - 64;
  const columnGap = 14;
  const columnCount = panelWidth >= 720 ? 2 : 1;
  const cardWidth = (gridWidth - columnGap * (columnCount - 1)) / columnCount;
  const cardHeight = columnCount === 2 ? 64 : 48;
  const gridTop = panelY + 92;
  const rowGap = 8;
  const buttonWidth = columnCount === 2 ? 70 : 88;
  const buttonHeight = 26;
  const stepButtonSize = 26;
  const badgeSize = columnCount === 2 ? 32 : 28;
  const textInset = badgeSize + 20;
  const controlsWidth = buttonWidth + stepButtonSize * 2 + 18;
  const textWidth = cardWidth - textInset - controlsWidth - 26;
  const actionZones: Phaser.GameObjects.Zone[] = [];

  const background = config.scene.add.graphics();
  background.fillStyle(0x02040a, config.backTarget === 'results' ? 0.82 : 1);
  background.fillRect(-width / 2, -height / 2, width, height);
  background.fillStyle(0x071018, 0.96);
  background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
  background.lineStyle(2, 0x42f5d7, 0.82);
  background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

  const title = config.scene.add
    .text(panelX + 32, panelY + 28, 'SHOP', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '18px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  const credits = config.scene.add
    .text(panelX + 32, panelY + 52, `Credits ${config.totalCredits}`, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '16px',
      color: '#c8f7ff'
    })
    .setOrigin(0, 0);

  const container = config.scene.add
    .container(centerX, centerY, [background, title, credits])
    .setScrollFactor(0)
    .setDepth(1300);

  for (let i = 0; i < PERMANENT_UPGRADE_DEFINITIONS.length; i += 1) {
    const column = i % columnCount;
    const row = Math.floor(i / columnCount);
    const rowX = gridX + column * (cardWidth + columnGap);
    const rowY = gridTop + row * (cardHeight + rowGap);
    const upgrade = PERMANENT_UPGRADE_DEFINITIONS[i];
    const level = config.getPermanentUpgradeLevel(upgrade.id);
    const activeLevel = config.getActivePermanentUpgradeLevel(upgrade.id);
    const isMaxed = config.isPermanentUpgradeMaxed(upgrade);
    const canPurchase = config.canPurchasePermanentUpgrade(upgrade);
    const label = isMaxed ? 'Maxed' : canPurchase ? 'Buy' : 'Need';
    const costLabel = isMaxed ? 'Maxed' : `Cost ${config.getPermanentUpgradeCost(upgrade)}`;
    const canDecreaseActive = activeLevel > 0;
    const canIncreaseActive = activeLevel < level;

    background.fillStyle(0x111a24, 0.94);
    background.fillRoundedRect(rowX, rowY, cardWidth, cardHeight, 6);
    background.lineStyle(1, 0x52627f, 0.82);
    background.strokeRoundedRect(rowX, rowY, cardWidth, cardHeight, 6);
    background.fillStyle(upgrade.accentColor, 0.18);
    background.fillRoundedRect(rowX + 9, rowY + (cardHeight - badgeSize) / 2, badgeSize, badgeSize, 5);
    background.lineStyle(1, upgrade.accentColor, 0.8);
    background.strokeRoundedRect(rowX + 9, rowY + (cardHeight - badgeSize) / 2, badgeSize, badgeSize, 5);

    const badgeText = config.scene.add
      .text(rowX + 9 + badgeSize / 2, rowY + cardHeight / 2, upgrade.statLabel, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: columnCount === 2 ? '11px' : '10px',
        color: '#f2fbff'
      })
      .setOrigin(0.5, 0.5);
    container.add(badgeText);

    const rowText = config.scene.add
      .text(
        rowX + textInset,
        rowY + (columnCount === 2 ? 7 : 5),
        `${upgrade.name}  Lv ${level}/${upgrade.maxLevel}  Active ${activeLevel}/${level}\n${upgrade.description}  ${costLabel}`,
        {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: columnCount === 2 ? '12px' : '11px',
          color: '#f2fbff',
          fixedWidth: textWidth,
          lineSpacing: 1,
          wordWrap: { width: textWidth, useAdvancedWrap: true }
        }
      )
      .setOrigin(0, 0);
    container.add(rowText);

    const controlsX = rowX + cardWidth - controlsWidth - 12;
    const controlsY = rowY + (cardHeight - buttonHeight) / 2;

    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: controlsX + buttonWidth / 2,
      y: controlsY,
      width: buttonWidth,
      height: buttonHeight,
      label,
      callback: () => config.onPurchasePermanentUpgrade(upgrade),
      isEnabled: canPurchase,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: controlsX + buttonWidth + 8 + stepButtonSize / 2,
      y: controlsY,
      width: stepButtonSize,
      height: buttonHeight,
      label: '-',
      callback: () => config.onAdjustActivePermanentUpgradeLevel(upgrade.id, -1),
      isEnabled: canDecreaseActive,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: controlsX + buttonWidth + 12 + stepButtonSize + stepButtonSize / 2,
      y: controlsY,
      width: stepButtonSize,
      height: buttonHeight,
      label: '+',
      callback: () => config.onAdjustActivePermanentUpgradeLevel(upgrade.id, 1),
      isEnabled: canIncreaseActive,
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
    y: panelY + panelHeight - 58,
    width: 180,
    height: 38,
    label: 'Back',
    callback: config.onBack,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}
