import Phaser from 'phaser';
import { PERMANENT_UPGRADE_DEFINITIONS, type PermanentUpgradeDefinition, type PermanentUpgradeId } from '../data/permanentUpgrades';
import {
  RUN_BOOSTS,
  RUN_PREP_UPGRADES,
  SHIP_SHOP_UPGRADES,
  SHOP_SECTIONS,
  WEAPON_SHOP_UPGRADES,
  getShopUpgradeCost,
  type PendingRunBoosts,
  type RunBoostId,
  type RunPrepUpgradeId,
  type RunPrepUpgradeLevels,
  type ShipShopUpgradeId,
  type ShipShopUpgradeLevels,
  type ShopSectionId,
  type WeaponShopUpgradeId,
  type WeaponShopUpgradeLevels
} from '../data/shopUpgrades';
import { shipRegistry, type ShipId } from '../data/ships';
import { weaponRegistry, type WeaponId } from '../data/weapons';
import { addPreRunNav, drawPreRunPanelWindow, getPreRunModuleLayout, type PreRunNavConfig } from './preRunHubScreen';
import { drawCockpitCard } from './cockpitCard';
import {
  addScreenButton,
  UI_COLORS,
  UI_FONT,
  type ScreenHandle
} from './screenUi';

export type ShopTerminalUpgradeId =
  | `ship:${ShipId}:${ShipShopUpgradeId}`
  | `weapon:${WeaponId}:${WeaponShopUpgradeId}`
  | `run-prep:${RunPrepUpgradeId}`
  | `boost:${RunBoostId}`
  | `system:permanent:${PermanentUpgradeId}`
  | 'system:radar'
  | 'system:scanner';

export interface ShopScreenConfig {
  scene: Phaser.Scene;
  totalCredits: number;
  selectedSection: ShopSectionId;
  selectedUpgradeId: ShopTerminalUpgradeId | null;
  listScrollIndex: number;
  selectedShipName: string;
  selectedMissionLabel: string;
  ownedShipIds: Set<ShipId>;
  ownedWeaponIds: Set<WeaponId>;
  shipUpgradeLevels: ShipShopUpgradeLevels;
  weaponUpgradeLevels: WeaponShopUpgradeLevels;
  runPrepUpgradeLevels: RunPrepUpgradeLevels;
  pendingRunBoosts: PendingRunBoosts;
  radarLevel: number;
  radarCost: number | null;
  isSectorScannerAvailable: boolean;
  sectorScannerLevel: number;
  sectorScannerCost: number | null;
  getPermanentUpgradeLevel: (id: PermanentUpgradeId) => number;
  getActivePermanentUpgradeLevel: (id: PermanentUpgradeId) => number;
  isPermanentUpgradeMaxed: (upgrade: PermanentUpgradeDefinition) => boolean;
  canPurchasePermanentUpgrade: (upgrade: PermanentUpgradeDefinition) => boolean;
  getPermanentUpgradeCost: (upgrade: PermanentUpgradeDefinition) => number;
  isActionActive: () => boolean;
  resetCursor: () => void;
  nav: Omit<PreRunNavConfig, 'scene' | 'container' | 'actionZones' | 'activeTab'>;
  onSelectSection: (section: ShopSectionId) => void;
  onSelectUpgrade: (id: ShopTerminalUpgradeId) => void;
  onScrollList: (delta: number) => void;
  onPurchaseSelected: (id: ShopTerminalUpgradeId) => void;
  onAdjustActivePermanentUpgradeLevel: (id: PermanentUpgradeId, delta: number) => void;
}

type ShopRowKind = 'ship' | 'weapon' | 'run-prep' | 'boost' | 'permanent' | 'radar' | 'scanner';

interface ShopRow {
  id: ShopTerminalUpgradeId;
  kind: ShopRowKind;
  name: string;
  label: string;
  targetLabel: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number | null;
  accentColor: number;
  locked: boolean;
  requirement: string;
  canPurchase: boolean;
  activeLevel?: number;
  permanentId?: PermanentUpgradeId;
}

const SCROLL_WHEEL_SPEED = 0.035;

export function createShopScreen(config: ShopScreenConfig): ScreenHandle {
  const { width, height, screenCenterX, screenCenterY, moduleCenterX, moduleCenterY } = getPreRunModuleLayout(config.scene);
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = config.scene.add.graphics();

  drawPreRunPanelWindow(background, width, height);

  const title = config.scene.add
    .text(-moduleCenterX + 42, -moduleCenterY + 24, 'SHOP TERMINAL', {
      fontFamily: UI_FONT,
      fontSize: '24px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  const status = config.scene.add
    .text(
      moduleCenterX - 42,
      -moduleCenterY + 24,
      `Credits ${config.totalCredits}   Ship ${config.selectedShipName}   ${config.selectedMissionLabel}`,
      {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#c8f7ff',
        align: 'right'
      }
    )
    .setOrigin(1, 0);

  const container = config.scene.add
    .container(screenCenterX, screenCenterY, [background, title, status])
    .setScrollFactor(0)
    .setDepth(1300);

  const panelGap = 12;
  const contentX = -moduleCenterX + 34;
  const contentY = -moduleCenterY + 88;
  const contentBottom = moduleCenterY - 98;
  const contentHeight = Math.max(320, contentBottom - contentY);
  const contentWidth = width - 68;
  const railWidth = width >= 900 ? 154 : 124;
  const detailWidth = width >= 1120 ? 354 : width >= 900 ? 306 : 260;
  const listWidth = Math.max(220, contentWidth - railWidth - detailWidth - panelGap * 2);
  const listX = contentX + railWidth + panelGap;
  const detailX = listX + listWidth + panelGap;

  drawCockpitCard(background, contentX, contentY, railWidth, contentHeight, { accentColor: UI_COLORS.brass, glow: true });
  drawCockpitCard(background, listX, contentY, listWidth, contentHeight, { accentColor: UI_COLORS.cyan, glow: true });
  drawCockpitCard(background, detailX, contentY, detailWidth, contentHeight, { accentColor: UI_COLORS.plasma, glow: true, dividerOffsets: [82, contentHeight - 72] });

  const rows = createRows(config);
  const selectedRow = rows.find((row) => row.id === config.selectedUpgradeId) ?? rows[0];
  drawSectionRail(config, container, actionZones, contentX, contentY, railWidth, contentHeight, screenCenterX, screenCenterY);
  drawList(config, container, actionZones, rows, selectedRow, listX, contentY, listWidth, contentHeight, screenCenterX, screenCenterY);
  drawDetail(config, container, actionZones, selectedRow, detailX, contentY, detailWidth, contentHeight, screenCenterX, screenCenterY);

  addPreRunNav({ ...config.nav, scene: config.scene, container, actionZones, activeTab: 'shop' });

  return { container, actionZones };
}

function drawSectionRail(
  config: ShopScreenConfig,
  container: Phaser.GameObjects.Container,
  actionZones: Phaser.GameObjects.Zone[],
  x: number,
  y: number,
  width: number,
  height: number,
  centerX: number,
  centerY: number
): void {
  const heading = config.scene.add
    .text(x + 18, y + 18, 'UPGRADE HUB', {
      fontFamily: UI_FONT,
      fontSize: '13px',
      color: '#73f2ff'
    })
    .setOrigin(0, 0);
  container.add(heading);

  const buttonHeight = Math.min(44, Math.max(34, (height - 72) / SHOP_SECTIONS.length - 8));
  for (let index = 0; index < SHOP_SECTIONS.length; index += 1) {
    const section = SHOP_SECTIONS[index];
    const rowY = y + 54 + index * (buttonHeight + 8);
    const selected = section.id === config.selectedSection;
    const plate = config.scene.add.graphics();
    plate.fillStyle(selected ? 0x102633 : 0x111a24, 0.96);
    plate.fillRoundedRect(x + 12, rowY, width - 24, buttonHeight, 6);
    plate.lineStyle(1.5, selected ? UI_COLORS.cyan : UI_COLORS.steel, selected ? 0.92 : 0.62);
    plate.strokeRoundedRect(x + 12, rowY, width - 24, buttonHeight, 6);
    plate.fillStyle(selected ? UI_COLORS.brass : UI_COLORS.steel, selected ? 0.72 : 0.34);
    plate.fillRect(x + 20, rowY + buttonHeight - 5, width - 40, 2);

    const text = config.scene.add
      .text(x + width / 2, rowY + buttonHeight / 2, selected ? `[${section.label}]` : section.label, {
        fontFamily: UI_FONT,
        fontSize: width >= 140 ? '15px' : '13px',
        color: selected ? '#f2fbff' : '#c8f7ff',
        align: 'center',
        fixedWidth: width - 28
      })
      .setOrigin(0.5);
    container.add([plate, text]);

    const zone = config.scene.add
      .zone(centerX + x + 12, centerY + rowY, width - 24, buttonHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (config.isActionActive()) {
          config.onSelectSection(section.id);
        }
      })
      .on('pointerout', () => config.resetCursor());
    actionZones.push(zone);
  }
}

function drawList(
  config: ShopScreenConfig,
  container: Phaser.GameObjects.Container,
  actionZones: Phaser.GameObjects.Zone[],
  rows: ShopRow[],
  selectedRow: ShopRow | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  centerX: number,
  centerY: number
): void {
  const heading = config.scene.add
    .text(x + 18, y + 16, getSectionLabel(config.selectedSection), {
      fontFamily: UI_FONT,
      fontSize: '15px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  container.add(heading);

  const rowHeight = width >= 380 ? 58 : 52;
  const rowGap = 8;
  const top = y + 48;
  const visibleCount = Math.max(1, Math.floor((height - 100) / (rowHeight + rowGap)));
  const maxScroll = Math.max(0, rows.length - visibleCount);
  const scrollIndex = Phaser.Math.Clamp(config.listScrollIndex, 0, maxScroll);
  const visibleRows = rows.slice(scrollIndex, scrollIndex + visibleCount);

  for (let index = 0; index < visibleRows.length; index += 1) {
    const row = visibleRows[index];
    const rowY = top + index * (rowHeight + rowGap);
    const selected = row.id === selectedRow?.id;
    const plate = config.scene.add.graphics();
    plate.fillStyle(selected ? 0x102633 : row.locked ? 0x151922 : 0x111a24, row.locked ? 0.72 : 0.96);
    plate.fillRoundedRect(x + 14, rowY, width - 28, rowHeight, 6);
    plate.lineStyle(1.5, selected ? row.accentColor : UI_COLORS.steel, selected ? 0.96 : 0.62);
    plate.strokeRoundedRect(x + 14, rowY, width - 28, rowHeight, 6);
    plate.fillStyle(row.accentColor, row.locked ? 0.12 : 0.22);
    plate.fillRoundedRect(x + 24, rowY + 11, 38, rowHeight - 22, 5);
    plate.lineStyle(1, row.accentColor, row.locked ? 0.32 : 0.76);
    plate.strokeRoundedRect(x + 24, rowY + 11, 38, rowHeight - 22, 5);

    const badge = config.scene.add
      .text(x + 43, rowY + rowHeight / 2, row.label, {
        fontFamily: UI_FONT,
        fontSize: '11px',
        color: row.locked ? '#8090a6' : '#f2fbff'
      })
      .setOrigin(0.5);
    const text = config.scene.add
      .text(
        x + 72,
        rowY + 8,
        `${row.name}  Lv ${row.level}/${row.maxLevel}\n${row.targetLabel}${row.locked ? `  ${row.requirement}` : ''}`,
        {
          fontFamily: UI_FONT,
          fontSize: width >= 380 ? '13px' : '11px',
          color: row.locked ? '#8090a6' : selected ? '#f2fbff' : '#c8f7ff',
          fixedWidth: width - 100,
          lineSpacing: 2,
          wordWrap: { width: width - 100, useAdvancedWrap: true }
        }
      )
      .setOrigin(0, 0);
    container.add([plate, badge, text]);

    const zone = config.scene.add
      .zone(centerX + x + 14, centerY + rowY, width - 28, rowHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (config.isActionActive()) {
          config.onSelectUpgrade(row.id);
        }
      })
      .on('pointerout', () => config.resetCursor());
    actionZones.push(zone);
  }

  if (rows.length <= visibleCount) {
    return;
  }

  const trackX = x + width - 18;
  const trackY = top;
  const trackHeight = Math.max(40, visibleCount * (rowHeight + rowGap) - rowGap);
  const thumbHeight = Phaser.Math.Clamp((visibleCount / rows.length) * trackHeight, 24, trackHeight);
  const thumbTravel = Math.max(1, trackHeight - thumbHeight);
  const thumbY = trackY + (scrollIndex / Math.max(1, maxScroll)) * thumbTravel;
  const scrollbar = config.scene.add.graphics();
  scrollbar.fillStyle(0x02040a, 0.68);
  scrollbar.fillRect(trackX, trackY, 6, trackHeight);
  scrollbar.lineStyle(1, UI_COLORS.brass, 0.38);
  scrollbar.strokeRect(trackX - 1, trackY, 8, trackHeight);
  scrollbar.fillStyle(UI_COLORS.cyan, 0.78);
  scrollbar.fillRect(trackX + 1, thumbY, 4, thumbHeight);
  scrollbar.fillStyle(UI_COLORS.brass, 0.74);
  scrollbar.fillRect(trackX, thumbY, 6, 2);
  scrollbar.fillRect(trackX, thumbY + thumbHeight - 2, 6, 2);
  container.add(scrollbar);

  let dragStartY = 0;
  let dragStartIndex = scrollIndex;
  const listZone = config.scene.add
    .zone(centerX + x + 8, centerY + top, width - 16, trackHeight)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1300)
    .setInteractive({ draggable: true })
    .on('wheel', (pointer: Phaser.Input.Pointer, _dx: number, _dy: number, _dz: number, event: WheelEvent) => {
      pointer.event?.stopPropagation();
      event.stopPropagation();
      if (config.isActionActive()) {
        config.onScrollList(Math.trunc(event.deltaY * SCROLL_WHEEL_SPEED) || Math.sign(event.deltaY));
      }
    })
    .on('dragstart', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      dragStartY = pointer.y;
      dragStartIndex = scrollIndex;
    })
    .on('drag', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      if (!config.isActionActive()) {
        return;
      }

      const rowDelta = Math.round((pointer.y - dragStartY) / Math.max(1, rowHeight + rowGap));
      const nextIndex = Phaser.Math.Clamp(dragStartIndex - rowDelta, 0, maxScroll);
      const delta = nextIndex - config.listScrollIndex;
      if (delta !== 0) {
        config.onScrollList(delta);
      }
    })
    .on('pointerout', () => config.resetCursor());
  config.scene.input.setDraggable(listZone);
  actionZones.push(listZone);
}

function drawDetail(
  config: ShopScreenConfig,
  container: Phaser.GameObjects.Container,
  actionZones: Phaser.GameObjects.Zone[],
  row: ShopRow | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  centerX: number,
  centerY: number
): void {
  if (!row) {
    return;
  }

  const title = config.scene.add
    .text(x + 22, y + 18, row.name, {
      fontFamily: UI_FONT,
      fontSize: '17px',
      color: '#f2fbff',
      fixedWidth: width - 44,
      wordWrap: { width: width - 44, useAdvancedWrap: true }
    })
    .setOrigin(0, 0);
  const target = config.scene.add
    .text(x + 22, y + 48, row.targetLabel, {
      fontFamily: UI_FONT,
      fontSize: '13px',
      color: row.locked ? '#8090a6' : '#73f2ff',
      fixedWidth: width - 44
    })
    .setOrigin(0, 0);
  const body = config.scene.add
    .text(
      x + 22,
      y + 96,
      `${row.description}\n\nCurrent: ${formatCurrent(row)}\nNext: ${formatNext(row)}\n\n${formatRequirement(row)}`,
      {
        fontFamily: UI_FONT,
        fontSize: '13px',
        color: '#c8f7ff',
        fixedWidth: width - 44,
        lineSpacing: 5,
        wordWrap: { width: width - 44, useAdvancedWrap: true }
      }
    )
    .setOrigin(0, 0);
  container.add([title, target, body]);

  if (row.kind === 'permanent' && row.permanentId) {
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: x + 54,
      y: y + height - 56,
      width: 44,
      height: 32,
      label: '-',
      callback: () => config.onAdjustActivePermanentUpgradeLevel(row.permanentId!, -1),
      isEnabled: (row.activeLevel ?? 0) > 0,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: centerX,
      screenCenterY: centerY,
      x: x + 108,
      y: y + height - 56,
      width: 44,
      height: 32,
      label: '+',
      callback: () => config.onAdjustActivePermanentUpgradeLevel(row.permanentId!, 1),
      isEnabled: (row.activeLevel ?? 0) < row.level,
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
    x: x + width - 92,
    y: y + height - 56,
    width: 132,
    height: 32,
    label: row.level >= row.maxLevel ? 'MAXED' : row.locked ? 'LOCKED' : row.canPurchase ? 'PURCHASE' : 'NEED CR',
    callback: () => config.onPurchaseSelected(row.id),
    isEnabled: row.canPurchase,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}

function createRows(config: ShopScreenConfig): ShopRow[] {
  switch (config.selectedSection) {
    case 'ships':
      return createShipRows(config);
    case 'weapons':
      return createWeaponRows(config);
    case 'systems':
      return createSystemRows(config);
    case 'run-prep':
      return createRunPrepRows(config);
    case 'boosts':
      return createBoostRows(config);
  }
}

function createShipRows(config: ShopScreenConfig): ShopRow[] {
  return shipRegistry.flatMap((ship) =>
    SHIP_SHOP_UPGRADES.map((upgrade) => {
      const level = config.shipUpgradeLevels[ship.id]?.[upgrade.id] ?? 0;
      const locked = !config.ownedShipIds.has(ship.id);
      const cost = level >= upgrade.maxLevel ? null : getShopUpgradeCost(upgrade, level);
      return {
        id: `ship:${ship.id}:${upgrade.id}` as ShopTerminalUpgradeId,
        kind: 'ship',
        name: upgrade.name,
        label: upgrade.label,
        targetLabel: ship.displayName,
        description: upgrade.description,
        level,
        maxLevel: upgrade.maxLevel,
        cost,
        accentColor: upgrade.accentColor,
        locked,
        requirement: locked ? getShipRequirement(ship.id) : '',
        canPurchase: !locked && cost !== null && config.totalCredits >= cost
      };
    })
  );
}

function createWeaponRows(config: ShopScreenConfig): ShopRow[] {
  return weaponRegistry.flatMap((weapon) =>
    WEAPON_SHOP_UPGRADES.filter((upgrade) => !upgrade.weaponId || upgrade.weaponId === weapon.id).map((upgrade) => {
      const level = config.weaponUpgradeLevels[weapon.id]?.[upgrade.id] ?? 0;
      const locked = !config.ownedWeaponIds.has(weapon.id);
      const cost = level >= upgrade.maxLevel ? null : getShopUpgradeCost(upgrade, level);
      return {
        id: `weapon:${weapon.id}:${upgrade.id}` as ShopTerminalUpgradeId,
        kind: 'weapon',
        name: upgrade.name,
        label: upgrade.label,
        targetLabel: weapon.displayName,
        description: upgrade.description,
        level,
        maxLevel: upgrade.maxLevel,
        cost,
        accentColor: upgrade.accentColor,
        locked,
        requirement: locked ? `Unlock via ${getShipRequirement(weapon.startingShipId as ShipId)}` : '',
        canPurchase: !locked && cost !== null && config.totalCredits >= cost
      };
    })
  );
}

function createSystemRows(config: ShopScreenConfig): ShopRow[] {
  const permanentRows = PERMANENT_UPGRADE_DEFINITIONS.map((upgrade) => {
    const level = config.getPermanentUpgradeLevel(upgrade.id);
    const cost = config.isPermanentUpgradeMaxed(upgrade) ? null : config.getPermanentUpgradeCost(upgrade);
    return {
      id: `system:permanent:${upgrade.id}` as ShopTerminalUpgradeId,
      kind: 'permanent' as const,
      name: upgrade.name,
      label: upgrade.statLabel,
      targetLabel: `Permanent system  Active ${config.getActivePermanentUpgradeLevel(upgrade.id)}/${level}`,
      description: upgrade.description,
      level,
      maxLevel: upgrade.maxLevel,
      cost,
      accentColor: upgrade.accentColor,
      locked: false,
      requirement: '',
      canPurchase: config.canPurchasePermanentUpgrade(upgrade),
      activeLevel: config.getActivePermanentUpgradeLevel(upgrade.id),
      permanentId: upgrade.id
    };
  });

  return [
    ...permanentRows,
    {
      id: 'system:radar',
      kind: 'radar',
      name: getRadarName(config.radarLevel),
      label: 'RAD',
      targetLabel: 'Cockpit minimap array',
      description: getRadarDescription(config.radarLevel),
      level: config.radarLevel,
      maxLevel: 4,
      cost: config.radarCost,
      accentColor: 0x42f5d7,
      locked: false,
      requirement: '',
      canPurchase: config.radarCost !== null && config.totalCredits >= config.radarCost
    },
    {
      id: 'system:scanner',
      kind: 'scanner',
      name: getScannerName(config.sectorScannerLevel),
      label: 'SCN',
      targetLabel: 'Sector event scanner',
      description: getScannerDescription(config.sectorScannerLevel),
      level: config.sectorScannerLevel,
      maxLevel: 3,
      cost: config.sectorScannerCost,
      accentColor: 0xb88cff,
      locked: !config.isSectorScannerAvailable,
      requirement: config.isSectorScannerAvailable ? '' : 'Find scanner intel from contracts or events.',
      canPurchase: config.isSectorScannerAvailable && config.sectorScannerCost !== null && config.totalCredits >= config.sectorScannerCost
    }
  ];
}

function createRunPrepRows(config: ShopScreenConfig): ShopRow[] {
  return RUN_PREP_UPGRADES.map((upgrade) => {
    const level = config.runPrepUpgradeLevels[upgrade.id] ?? 0;
    const cost = level >= upgrade.maxLevel ? null : getShopUpgradeCost(upgrade, level);
    return {
      id: `run-prep:${upgrade.id}` as ShopTerminalUpgradeId,
      kind: 'run-prep',
      name: upgrade.name,
      label: upgrade.label,
      targetLabel: 'All future launches',
      description: upgrade.description,
      level,
      maxLevel: upgrade.maxLevel,
      cost,
      accentColor: upgrade.accentColor,
      locked: false,
      requirement: '',
      canPurchase: cost !== null && config.totalCredits >= cost
    };
  });
}

function createBoostRows(config: ShopScreenConfig): ShopRow[] {
  return RUN_BOOSTS.map((boost) => {
    const level = config.pendingRunBoosts[boost.id] ?? 0;
    const cost = level >= boost.maxLevel ? null : getShopUpgradeCost(boost, level);
    return {
      id: `boost:${boost.id}` as ShopTerminalUpgradeId,
      kind: 'boost',
      name: boost.name,
      label: boost.label,
      targetLabel: level > 0 ? 'Armed for next run' : 'One-run launch boost',
      description: boost.description,
      level,
      maxLevel: boost.maxLevel,
      cost,
      accentColor: boost.accentColor,
      locked: false,
      requirement: '',
      canPurchase: cost !== null && config.totalCredits >= cost
    };
  });
}

function formatCurrent(row: ShopRow): string {
  if (row.kind === 'permanent') {
    return `Level ${row.level}, active ${row.activeLevel ?? 0}.`;
  }
  if (row.kind === 'boost') {
    return row.level > 0 ? 'Boost armed for next launch.' : 'No boost armed.';
  }
  return `Level ${row.level} of ${row.maxLevel}.`;
}

function formatNext(row: ShopRow): string {
  if (row.level >= row.maxLevel) {
    return 'Max level reached.';
  }

  return row.cost === null ? 'Unavailable.' : `Level ${row.level + 1} costs ${row.cost} credits.`;
}

function formatRequirement(row: ShopRow): string {
  if (row.locked) {
    return `Requirement: ${row.requirement}`;
  }
  if (row.cost === null) {
    return 'Status: Maxed.';
  }
  return `Requirement: ${row.cost} credits.`;
}

function getSectionLabel(section: ShopSectionId): string {
  return SHOP_SECTIONS.find((candidate) => candidate.id === section)?.label ?? 'SHOP';
}

function getShipRequirement(shipId: ShipId): string {
  return shipRegistry.find((ship) => ship.id === shipId)?.displayName ?? 'Hangar unlock';
}

function getRadarName(level: number): string {
  return level <= 0
    ? 'Radar Array'
    : level === 1
      ? 'Salvaged Scope'
      : level === 2
        ? 'Signal Decoder'
        : level === 3
          ? 'Resource Sweep'
          : 'Threat Feed';
}

function getRadarDescription(level: number): string {
  return level <= 0
    ? 'Unlocks the cockpit minimap frame.'
    : level === 1
      ? 'Adds sector signal decoding.'
      : level === 2
        ? 'Adds scrap and resource pips.'
        : level === 3
          ? 'Adds threats, events, and anomalies.'
          : 'All radar layers online.';
}

function getScannerName(level: number): string {
  return level <= 0 ? 'Sector Scanner' : level === 1 ? 'Arrow Guidance' : 'Minimap Feed';
}

function getScannerDescription(level: number): string {
  return level <= 0
    ? 'Unlocks a timed sector event scan.'
    : level === 1
      ? 'Adds an edge arrow after scans finish.'
      : 'Shows scanned events on the minimap.';
}
