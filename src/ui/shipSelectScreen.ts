import Phaser from 'phaser';
import { getShipDefinition, shipRegistry, type ShipId, type ShipRegistryEntry } from '../data/ships';
import { getWeaponDefinition, type WeaponRegistryEntry } from '../data/weapons';
import { formatIntegerDisplayUnits, toDisplayUnits } from '../systems/statUnits';
import type { HangarStatRow } from '../scenes/gameTypes';
import { addScreenButton, type ScreenHandle } from './screenUi';

export interface ShipSelectScreenConfig {
  scene: Phaser.Scene;
  totalCredits: number;
  selectedShipId: ShipId;
  hangarPreviewShipId: ShipId;
  unlockedShipIds: ReadonlySet<ShipId>;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onPreviewShip: (shipId: ShipId) => void;
  onShipAction: (ship: ShipRegistryEntry) => void;
  onBack: () => void;
}

export function createShipSelectScreen(config: ShipSelectScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const frameMargin = 3;
  const panelWidth = width - frameMargin * 2;
  const panelHeight = height - frameMargin * 2;
  const panelX = -width / 2 + frameMargin;
  const panelY = -height / 2 + frameMargin;
  const innerPadding = 24;
  const headerHeight = 66;
  const footerHeight = 54;
  const columnTop = panelY + headerHeight + 12;
  const columnHeight = panelHeight - headerHeight - footerHeight - 24;
  const columnGap = 16;
  const listWidth = Math.max(220, Math.min(280, panelWidth * 0.22));
  const rightWidth = Math.max(260, Math.min(330, panelWidth * 0.26));
  const middleWidth = panelWidth - innerPadding * 2 - listWidth - rightWidth - columnGap * 2;
  const listX = panelX + innerPadding;
  const middleX = listX + listWidth + columnGap;
  const rightX = middleX + middleWidth + columnGap;
  const selectedShip = getShipDefinition(config.hangarPreviewShipId);
  const actionZones: Phaser.GameObjects.Zone[] = [];

  const background = config.scene.add.graphics();
  background.fillStyle(0x02040a, 1);
  background.fillRect(-width / 2, -height / 2, width, height);
  background.lineStyle(4, 0x42f5d7, 0.9);
  background.strokeRect(panelX, panelY, panelWidth, panelHeight);
  background.lineStyle(2, 0x102633, 0.94);
  background.strokeRect(panelX + 7, panelY + 7, panelWidth - 14, panelHeight - 14);
  background.lineStyle(1, 0x52627f, 0.6);
  background.lineBetween(panelX + innerPadding, panelY + headerHeight, panelX + panelWidth - innerPadding, panelY + headerHeight);

  const title = config.scene.add
    .text(0, panelY + 22, 'SHIP HANGAR', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '22px',
      color: '#f2fbff',
      align: 'center',
      fixedWidth: panelWidth
    })
    .setOrigin(0.5, 0);
  const credits = config.scene.add
    .text(panelX + panelWidth - innerPadding, panelY + 25, `Credits ${config.totalCredits}`, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: '#c8f7ff'
    })
    .setOrigin(1, 0);

  const container = config.scene.add
    .container(centerX, centerY, [background, title, credits])
    .setScrollFactor(0)
    .setDepth(1300);

  drawHangarPanel(config.scene, container, background, listX, columnTop, listWidth, columnHeight, 'SHIP LIST');
  drawHangarPanel(config.scene, container, background, middleX, columnTop, middleWidth, columnHeight, 'SELECTED SHIP');
  drawHangarPanel(config.scene, container, background, rightX, columnTop, rightWidth, columnHeight, 'PRIMARY SYSTEM');
  renderShipListPanel(config, container, background, actionZones, listX, columnTop, listWidth);
  renderSelectedShipCard(config, container, background, selectedShip, middleX, columnTop, middleWidth, columnHeight);
  renderPrimarySystemPanel(config.scene, container, selectedShip, rightX, columnTop, rightWidth, columnHeight);

  const actionEnabled = isShipUnlocked(config, selectedShip.id) || canUnlockShip(config, selectedShip);
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: middleX + middleWidth / 2,
    y: panelY + panelHeight - footerHeight + 8,
    width: 190,
    height: 38,
    label: getShipActionLabel(config, selectedShip),
    callback: () => config.onShipAction(selectedShip),
    isEnabled: actionEnabled,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: panelX + panelWidth - innerPadding - 75,
    y: panelY + panelHeight - footerHeight + 8,
    width: 150,
    height: 38,
    label: 'Back',
    callback: config.onBack,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}

function drawHangarPanel(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string
): void {
  graphics.fillStyle(0x0a121d, 0.94);
  graphics.fillRoundedRect(x, y, width, height, 6);
  graphics.lineStyle(1, 0x52627f, 0.78);
  graphics.strokeRoundedRect(x, y, width, height, 6);
  graphics.fillStyle(0x102633, 0.75);
  graphics.fillRect(x + 1, y + 1, width - 2, 34);
  graphics.lineStyle(1, 0x42f5d7, 0.34);
  graphics.lineBetween(x + 12, y + 35, x + width - 12, y + 35);

  const label = scene.add
    .text(x + 14, y + 10, title, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: '#73f2ff'
    })
    .setOrigin(0, 0);
  container.add(label);
}

function renderShipListPanel(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  x: number,
  y: number,
  width: number
): void {
  const rowHeight = 86;
  const rowGap = 10;
  const rowX = x + 12;
  const rowWidth = width - 24;
  const rowTop = y + 52;

  for (let i = 0; i < shipRegistry.length; i += 1) {
    const ship = shipRegistry[i];
    const rowY = rowTop + i * (rowHeight + rowGap);
    const isPreviewed = ship.id === config.hangarPreviewShipId;
    const isSelected = ship.id === config.selectedShipId;
    const isUnlocked = isShipUnlocked(config, ship.id);
    const isAvailable = canStartRunWithShip(config, ship);
    const statusLabel = isAvailable ? (isSelected ? 'SELECTED' : 'READY') : getShipLockedLabel(ship).toUpperCase();
    const borderColor = isPreviewed ? 0x42f5d7 : isAvailable ? 0x52627f : 0xff5964;
    const textColor = isUnlocked ? '#f2fbff' : '#8090a6';

    graphics.fillStyle(isPreviewed ? 0x102633 : 0x111a24, 0.9);
    graphics.fillRoundedRect(rowX, rowY, rowWidth, rowHeight, 5);
    graphics.lineStyle(1, borderColor, isPreviewed ? 0.9 : 0.6);
    graphics.strokeRoundedRect(rowX, rowY, rowWidth, rowHeight, 5);

    const preview = config.scene.add
      .image(rowX + 31, rowY + rowHeight / 2, ship.textureKey)
      .setDisplaySize(48, 48)
      .setRotation(ship.visualRotation)
      .setAlpha(isUnlocked ? 1 : 0.56);
    const text = config.scene.add
      .text(rowX + 66, rowY + 12, `${ship.displayName}\n${ship.display.roleTitle}\nLv. 1  ${statusLabel}`, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '12px',
        color: textColor,
        fixedWidth: rowWidth - 76,
        lineSpacing: 2,
        wordWrap: { width: rowWidth - 76, useAdvancedWrap: true }
      })
      .setOrigin(0, 0);
    container.add([preview, text]);

    const zone = config.scene.add
      .zone(config.scene.scale.width / 2 + rowX, config.scene.scale.height / 2 + rowY, rowWidth, rowHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (ship.selectable) {
          config.onPreviewShip(ship.id);
        }
      })
      .on('pointerout', () => config.resetCursor());
    if (ship.selectable) {
      zone.setInteractive({ useHandCursor: true });
    }
    actionZones.push(zone);
  }
}

function renderSelectedShipCard(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  ship: ShipRegistryEntry,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const contentX = x + 24;
  const contentWidth = width - 48;
  const imageY = y + 96;
  const identityY = y + 172;
  const descriptionY = identityY + 58;
  const tagY = descriptionY + 38;
  const masteryY = tagY + 32;
  const statsTitleY = masteryY + 38;
  const statStartY = statsTitleY + 26;
  const statRowHeight = 42;
  const maxStatRows = Math.max(3, Math.min(8, Math.floor((height - (statStartY - y) - 24) / statRowHeight)));
  const isUnlocked = isShipUnlocked(config, ship.id);

  const shipImage = config.scene.add
    .image(x + width / 2, imageY, ship.textureKey)
    .setDisplaySize(ship.displaySize * 0.98, ship.displaySize * 0.98)
    .setRotation(ship.visualRotation)
    .setAlpha(isUnlocked ? 1 : 0.54);
  container.add(shipImage);

  const nameText = config.scene.add
    .text(contentX, identityY, `${ship.displayName.toUpperCase()}\n${ship.display.roleTitle}`, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '19px',
      color: '#f2fbff',
      fixedWidth: contentWidth,
      lineSpacing: 4
    })
    .setOrigin(0, 0);
  const description = config.scene.add
    .text(contentX, descriptionY, ship.display.shortDescription, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '12px',
      color: '#c8f7ff',
      fixedWidth: contentWidth,
      wordWrap: { width: contentWidth, useAdvancedWrap: true }
    })
    .setOrigin(0, 0);
  const mastery = config.scene.add
    .text(contentX, masteryY, 'Level 1   Mastery Coming Soon', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: '#ffc857',
      fixedWidth: contentWidth
    })
    .setOrigin(0, 0);
  const statsTitle = config.scene.add
    .text(contentX, statsTitleY, 'CURRENT STATS', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: '#73f2ff'
    })
    .setOrigin(0, 0);
  container.add([nameText, description, mastery, statsTitle]);
  renderShipTags(config.scene, container, ship.display.tags, contentX, tagY, contentWidth);

  const statRows = getVisibleShipStatRows(ship).slice(0, maxStatRows);
  for (let i = 0; i < statRows.length; i += 1) {
    const stat = statRows[i];
    renderStatPips(config.scene, container, graphics, stat, contentX, statStartY + i * statRowHeight, contentWidth);
  }
}

function renderPrimarySystemPanel(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  ship: ShipRegistryEntry,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const contentX = x + 18;
  const contentWidth = width - 36;
  const weaponY = y + 58;
  const upgradeY = y + Math.max(180, Math.floor(height * 0.32));
  const masteryY = y + Math.max(330, Math.floor(height * 0.62));
  const primaryWeapon = getPrimaryWeaponDisplay(ship);
  const weaponType = primaryWeapon.behaviorType === 'projectile' ? 'Ranged Weapon' : 'Impact Shield';
  const upgradeList = ship.display.exampleUpgradeIds ?? [];
  const masteryList = ship.display.masteryPreview ?? [];

  const weaponText = scene.add
    .text(contentX, weaponY, `${primaryWeapon.displayName}\n${weaponType}\n\n${primaryWeapon.description}`, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: '#f2fbff',
      fixedWidth: contentWidth,
      lineSpacing: 4,
      wordWrap: { width: contentWidth, useAdvancedWrap: true }
    })
    .setOrigin(0, 0);
  const upgradeTitle = scene.add
    .text(contentX, upgradeY, 'UPGRADE PATH', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: '#73f2ff'
    })
    .setOrigin(0, 0);
  const upgrades = scene.add
    .text(contentX, upgradeY + 26, upgradeList.map((label) => `- ${label}`).join('\n'), {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: '#c8f7ff',
      fixedWidth: contentWidth,
      lineSpacing: 4,
      wordWrap: { width: contentWidth, useAdvancedWrap: true }
    })
    .setOrigin(0, 0);
  const masteryTitle = scene.add
    .text(contentX, masteryY, 'MASTERY PREVIEW', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: '#ffc857'
    })
    .setOrigin(0, 0);
  const mastery = scene.add
    .text(contentX, masteryY + 26, masteryList.map((item) => `Lv. ${item.level}: ${item.label}`).join('\n'), {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '12px',
      color: '#f2fbff',
      fixedWidth: contentWidth,
      lineSpacing: 4,
      wordWrap: { width: contentWidth, useAdvancedWrap: true }
    })
    .setOrigin(0, 0);

  container.add([weaponText, upgradeTitle, upgrades, masteryTitle, mastery]);
}

function renderShipTags(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  tags: string[],
  x: number,
  y: number,
  maxWidth: number
): void {
  let cursorX = x;
  let cursorY = y;

  for (const tag of tags) {
    const tagWidth = Math.min(150, Math.max(58, tag.length * 7 + 18));

    if (cursorX + tagWidth > x + maxWidth) {
      cursorX = x;
      cursorY += 22;
    }

    const tagGraphics = scene.add.graphics();
    tagGraphics.fillStyle(0x102633, 0.94);
    tagGraphics.fillRoundedRect(cursorX, cursorY, tagWidth, 18, 5);
    tagGraphics.lineStyle(1, 0x42f5d7, 0.64);
    tagGraphics.strokeRoundedRect(cursorX, cursorY, tagWidth, 18, 5);
    const tagText = scene.add
      .text(cursorX + tagWidth / 2, cursorY + 9, tag, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '10px',
        color: '#c8f7ff',
        align: 'center',
        fixedWidth: tagWidth - 6
      })
      .setOrigin(0.5);

    container.add([tagGraphics, tagText]);
    cursorX += tagWidth + 6;
  }
}

function renderStatPips(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  stat: HangarStatRow,
  x: number,
  y: number,
  width: number
): void {
  const labelWidth = 92;
  const valueWidth = 74;
  const pipColumns = 25;
  const pipRows = 4;
  const pipGap = 2;
  const gridValueGap = 12;
  const pipSize = Math.min(
    8,
    Math.max(5, Math.floor((width - labelWidth - valueWidth - gridValueGap - pipGap * (pipColumns - 1)) / pipColumns))
  );
  const gridWidth = pipColumns * pipSize + (pipColumns - 1) * pipGap;
  const gridHeight = pipRows * pipSize + (pipRows - 1) * pipGap;
  const pipsX = x + labelWidth;
  const pipsY = y + Math.floor((40 - gridHeight) / 2);
  const textY = y + 13;
  const filledPips = stat.unitsPerPip > 0 ? Phaser.Math.Clamp(stat.pipValue / stat.unitsPerPip, 0, 100) : 0;

  const labelText = scene.add
    .text(x, textY, stat.label, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '12px',
      color: '#f2fbff',
      fixedWidth: labelWidth - 8
    })
    .setOrigin(0, 0);
  const valueText = scene.add
    .text(pipsX + gridWidth + gridValueGap + valueWidth, textY, stat.valueLabel, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '12px',
      color: '#c8f7ff',
      align: 'right',
      fixedWidth: valueWidth
    })
    .setOrigin(1, 0);

  for (let i = 0; i < 100; i += 1) {
    const column = i % pipColumns;
    const row = Math.floor(i / pipColumns);
    const pipX = pipsX + column * (pipSize + pipGap);
    const pipY = pipsY + row * (pipSize + pipGap);
    const fillAmount = Phaser.Math.Clamp(filledPips - i, 0, 1);
    const isFilled = fillAmount > 0;
    graphics.fillStyle(0x0b1620, 0.96);
    graphics.fillRect(pipX, pipY, pipSize, pipSize);
    if (isFilled) {
      graphics.fillStyle(0x4ff5df, 0.94);
      graphics.fillRect(pipX, pipY, Math.max(1, pipSize * fillAmount), pipSize);
    }
    graphics.lineStyle(1, isFilled ? 0xa3fff4 : 0x33465f, isFilled ? 0.76 : 0.52);
    graphics.strokeRect(pipX, pipY, pipSize, pipSize);
  }

  container.add([labelText, valueText]);
}

function getVisibleShipStatRows(ship: ShipRegistryEntry): HangarStatRow[] {
  const primaryWeapon = getPrimaryWeaponDisplay(ship);
  const shield = primaryWeapon.rammingShield;
  const rows: HangarStatRow[] = [
    createHealthHangarStatRow('Hull', ship.baseStats.maxHull),
    createScaledHangarStatRow('Speed', ship.movement.maxSpeed, 'spd'),
    createScaledHangarStatRow('Thrust', ship.movement.thrustAcceleration, 'thr'),
    createHangarStatRow('Turn', ship.movement.rotationSpeed, 1, '/s', 1),
    createHangarStatRow('Mass', ship.baseStats.mass, 1, 'mass', 1)
  ];

  if (shield) {
    rows.splice(1, 0, createHealthHangarStatRow('Shield', shield.shieldMaxHp));
    rows.push(
      createHangarStatRow('Ram Damage', shield.maxDamage * shield.dashRamDamageMultiplier, 1, 'dmg', 1),
      createHangarStatRow('Shield Regen', shield.shieldRegenRatePerSecond, 1, '/s', 1),
      createHangarStatRow('Dash Charges', shield.dashMaxCharges, 1, 'chg')
    );
  } else {
    rows.push(
      createHangarStatRow('Damage', primaryWeapon.damage ?? 0, 1, 'dmg'),
      createHangarStatRow(
        'Fire Rate',
        primaryWeapon.cooldownSeconds && primaryWeapon.cooldownSeconds > 0 ? 1 / primaryWeapon.cooldownSeconds : 0,
        1,
        '/s',
        2
      ),
      createScaledHangarStatRow('Proj Speed', primaryWeapon.projectileSpeed ?? 0, 'spd')
    );
  }

  return rows.filter((row) => row.pipValue > 0).slice(0, 8);
}

function createHangarStatRow(
  label: string,
  rawValue: number | undefined,
  unitsPerPip: number,
  unitLabel: string,
  decimals = 0
): HangarStatRow {
  const safeValue = rawValue ?? 0;
  const valueLabel = `${formatHangarStatValue(safeValue, decimals)} ${unitLabel}`;
  return {
    label,
    pipValue: safeValue,
    valueLabel,
    unitsPerPip
  };
}

function createHealthHangarStatRow(label: string, hpValue: number | undefined): HangarStatRow {
  const safeValue = hpValue ?? 0;
  return {
    label,
    pipValue: toDisplayUnits(safeValue),
    valueLabel: `${Math.round(safeValue)} HP`,
    unitsPerPip: 1
  };
}

function createScaledHangarStatRow(label: string, rawValue: number | undefined, unitLabel: string): HangarStatRow {
  const safeValue = rawValue ?? 0;
  return {
    label,
    pipValue: toDisplayUnits(safeValue),
    valueLabel: `${formatIntegerDisplayUnits(safeValue)} ${unitLabel}`,
    unitsPerPip: 1
  };
}

function formatHangarStatValue(value: number, decimals: number): string {
  if (decimals <= 0) {
    return `${Math.round(value)}`;
  }

  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

function getPrimaryWeaponDisplay(ship: ShipRegistryEntry): WeaponRegistryEntry {
  return getWeaponDefinition(ship.startingMainWeaponId);
}

function getShipActionLabel(config: ShipSelectScreenConfig, ship: ShipRegistryEntry): string {
  if (!ship.selectable) {
    return 'Locked';
  }

  if (!isShipUnlocked(config, ship.id)) {
    return canUnlockShip(config, ship) ? `Buy ${ship.unlockCostCredits} Credits` : `Need ${ship.unlockCostCredits} Credits`;
  }

  return 'Start Run';
}

function isShipUnlocked(config: ShipSelectScreenConfig, shipId: ShipId): boolean {
  return config.unlockedShipIds.has(shipId);
}

function canStartRunWithShip(config: ShipSelectScreenConfig, ship: ShipRegistryEntry): boolean {
  return ship.selectable && isShipUnlocked(config, ship.id);
}

function canUnlockShip(config: ShipSelectScreenConfig, ship: ShipRegistryEntry): boolean {
  return ship.selectable && !isShipUnlocked(config, ship.id) && ship.unlockCostCredits !== undefined && config.totalCredits >= ship.unlockCostCredits;
}

function getShipLockedLabel(ship: ShipRegistryEntry): string {
  if (!ship.selectable) {
    return 'Coming Soon';
  }

  return ship.unlockCostCredits === undefined ? 'Locked' : `Locked ${ship.unlockCostCredits} credits`;
}
