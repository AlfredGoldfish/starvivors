import Phaser from 'phaser';
import { type MissionDefinition } from '../data/missions';
import {
  getShipDefinition,
  getShipDisplayStats,
  SHIP_HULL_HP_CAP,
  SHIP_STAT_CAP,
  shipRegistry,
  type ShipId,
  type ShipRegistryEntry
} from '../data/ships';
import { getWeaponDefinition, type WeaponId, type WeaponRegistryEntry, type WeaponSlotType } from '../data/weapons';
import { type WeaponLoadoutState, type WeaponMkLevels } from '../systems/progressionStorage';
import { addPreRunNav, type PreRunNavConfig } from './preRunHubScreen';
import { addScreenButton, type ScreenHandle } from './screenUi';

export interface ShipSelectScreenConfig {
  scene: Phaser.Scene;
  totalCredits: number;
  selectedShipId: ShipId;
  hangarPreviewShipId: ShipId;
  unlockedShipIds: ReadonlySet<ShipId>;
  selectedSkinIds: Partial<Record<ShipId, string>>;
  selectedMission: MissionDefinition;
  weaponLoadout: WeaponLoadoutState;
  availableWeaponIds: WeaponId[];
  weaponMkLevels: WeaponMkLevels;
  selectedInventoryWeaponId: WeaponId | null;
  inventoryScrollIndex: number;
  nav: Omit<PreRunNavConfig, 'scene' | 'container' | 'actionZones' | 'activeTab'>;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onPreviewShip: (shipId: ShipId) => void;
  onShipAction: (ship: ShipRegistryEntry) => void;
  onSelectSkin: (shipId: ShipId, skinId: string) => void;
  onSelectInventoryWeapon: (weaponId: WeaponId) => void;
  onAssignWeapon: (slot: WeaponSlotType, slotIndex: number, weaponId: WeaponId) => void;
  onClearWeapon: (slot: WeaponSlotType, slotIndex: number) => void;
  onInventoryScroll: (delta: number) => void;
}

const FONT = 'Consolas, "Courier New", monospace';
const SLOT_TYPES: WeaponSlotType[] = ['primary', 'secondary', 'auto'];
const SLOT_LABELS: Record<WeaponSlotType, string> = {
  primary: 'LEFT CLICK',
  secondary: 'RIGHT CLICK',
  auto: 'AUTO'
};
const ACTIVE_SLOT_TYPES: WeaponSlotType[] = ['primary', 'secondary', 'auto'];
const MANUAL_SLOT_TYPES: WeaponSlotType[] = ['primary', 'secondary'];
const ACTIVE_ARMORY_DRAG_SCENES = new WeakSet<Phaser.Scene>();
const LAST_WEAPON_CLICK_AT = new WeakMap<Phaser.Scene, { weaponId: WeaponId; at: number }>();

export function createShipSelectScreen(config: ShipSelectScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const frameMargin = 3;
  const panelX = -width / 2 + frameMargin;
  const panelY = -height / 2 + frameMargin;
  const panelWidth = width - frameMargin * 2;
  const panelHeight = height - frameMargin * 2;
  const contentTop = panelY + 82;
  const contentBottom = panelY + panelHeight - 136;
  const contentHeight = contentBottom - contentTop;
  const gap = 12;
  const listWidth = Math.max(210, Math.min(250, panelWidth * 0.19));
  const outfittingWidth = Math.max(370, Math.min(440, panelWidth * 0.34));
  const hullWidth = panelWidth - 48 - listWidth - outfittingWidth - gap * 2;
  const listX = panelX + 24;
  const hullX = listX + listWidth + gap;
  const outfittingX = hullX + hullWidth + gap;
  const selectedShip = getShipDefinition(config.hangarPreviewShipId);
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const slotTargets: Array<{ slot: WeaponSlotType; index: number; bounds: Phaser.Geom.Rectangle }> = [];

  const background = config.scene.add.graphics();
  background.fillStyle(0x02040a, 1);
  background.fillRect(-width / 2, -height / 2, width, height);
  background.lineStyle(4, 0x42f5d7, 0.9);
  background.strokeRect(panelX, panelY, panelWidth, panelHeight);
  background.lineStyle(1, 0x52627f, 0.52);
  background.lineBetween(panelX + 34, panelY + 72, panelX + panelWidth - 34, panelY + 72);

  const title = config.scene.add
    .text(0, panelY + 24, 'HANGAR', {
      fontFamily: FONT,
      fontSize: '24px',
      color: '#f2fbff',
      align: 'center',
      fixedWidth: panelWidth
    })
    .setOrigin(0.5, 0);
  const credits = config.scene.add
    .text(panelX + panelWidth - 38, panelY + 30, `Credits ${config.totalCredits}`, {
      fontFamily: FONT,
      fontSize: '14px',
      color: '#c8f7ff',
      align: 'right'
    })
    .setOrigin(1, 0);

  const container = config.scene.add.container(centerX, centerY, [background, title, credits]).setScrollFactor(0).setDepth(1300);

  drawPanel(config.scene, container, background, listX, contentTop, listWidth, contentHeight, 'SHIP ROSTER');
  drawPanel(config.scene, container, background, hullX, contentTop, hullWidth, contentHeight, 'SHIP BAY');
  drawPanel(config.scene, container, background, outfittingX, contentTop, outfittingWidth, contentHeight, 'OUTFITTING');

  renderShipRoster(config, container, background, actionZones, listX, contentTop, listWidth);
  renderHullPanel(config, container, background, actionZones, selectedShip, hullX, contentTop, hullWidth, contentHeight);
  renderOutfittingPanel(config, container, background, actionZones, slotTargets, outfittingX, contentTop, outfittingWidth, contentHeight);
  renderReadinessStrip(config, container, background, selectedShip, panelX + 24, panelY + panelHeight - 126, panelWidth - 48, 36);

  addPreRunNav({ ...config.nav, scene: config.scene, container, actionZones, activeTab: 'hangar' });
  return { container, actionZones };
}

function drawPanel(
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
  container.add(
    scene.add
      .text(x + 14, y + 10, title, {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#73f2ff'
      })
      .setOrigin(0, 0)
  );
}

function renderShipRoster(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  x: number,
  y: number,
  width: number
): void {
  const rowHeight = 82;
  const rowGap = 10;
  const rowX = x + 12;
  const rowWidth = width - 24;
  const rowTop = y + 50;

  for (let index = 0; index < shipRegistry.length; index += 1) {
    const ship = shipRegistry[index];
    const rowY = rowTop + index * (rowHeight + rowGap);
    const unlocked = config.unlockedShipIds.has(ship.id);
    const previewed = ship.id === config.hangarPreviewShipId;
    const selected = ship.id === config.selectedShipId;
    const borderColor = unlocked ? (previewed ? 0x42f5d7 : 0x52627f) : previewed ? 0xff8f95 : 0xff5964;
    const status = unlocked ? (selected ? 'EQUIPPED' : 'READY') : getShipLockedLabel(ship).toUpperCase();

    graphics.fillStyle(previewed ? (unlocked ? 0x102633 : 0x241018) : 0x111a24, 0.9);
    graphics.fillRoundedRect(rowX, rowY, rowWidth, rowHeight, 5);
    graphics.lineStyle(1, borderColor, previewed ? 0.95 : 0.64);
    graphics.strokeRoundedRect(rowX, rowY, rowWidth, rowHeight, 5);

    const skin = getSelectedSkin(config, ship);
    const preview = config.scene.add
      .image(rowX + 32, rowY + rowHeight / 2, ship.textureKey)
      .setDisplaySize(48, 48)
      .setRotation(ship.visualRotation)
      .setAlpha(unlocked ? 1 : 0.5);
    if (skin?.tint !== undefined) {
      preview.setTint(skin.tint);
    }

    const text = config.scene.add
      .text(rowX + 66, rowY + 11, `${ship.displayName}\n${ship.display.fantasy ?? ship.display.roleTitle}\n${status}`, {
        fontFamily: FONT,
        fontSize: '12px',
        color: unlocked ? '#f2fbff' : '#8090a6',
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
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (config.isActionActive()) {
          config.onPreviewShip(ship.id);
        }
      })
      .on('pointerout', () => config.resetCursor());
    actionZones.push(zone);
  }
}

function renderHullPanel(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  ship: ShipRegistryEntry,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const unlocked = config.unlockedShipIds.has(ship.id);
  const skin = getSelectedSkin(config, ship);
  const imageY = y + 102;
  const contentX = x + 20;
  const contentWidth = width - 40;
  const image = config.scene.add
    .image(x + width / 2, imageY, ship.textureKey)
    .setDisplaySize(ship.displaySize * 0.92, ship.displaySize * 0.92)
    .setRotation(ship.visualRotation)
    .setAlpha(unlocked ? 1 : 0.5);
  if (skin?.tint !== undefined) {
    image.setTint(skin.tint);
  }
  container.add(image);

  const skinY = y + 178;
  renderSkinWheel(config, container, graphics, actionZones, ship, contentX, skinY, contentWidth);

  const descriptionY = skinY + 46;
  const copy = [
    ship.display.fantasy ?? ship.display.roleTitle,
    ship.display.passiveTitle ? `Passive: ${ship.display.passiveTitle}` : null,
    ship.display.passiveDescription ?? ship.display.shortDescription,
    `Strong: ${(ship.display.strengths ?? ['Flexible']).slice(0, 2).join(', ')}`,
    `Weak: ${(ship.display.weaknesses ?? ['None listed']).slice(0, 2).join(', ')}`
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
  container.add(
    config.scene.add
      .text(contentX, descriptionY, copy, {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#f2fbff',
        fixedWidth: contentWidth,
        lineSpacing: 3,
        wordWrap: { width: contentWidth, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
  );
  renderShipStatBars(config, container, graphics, ship, contentX, descriptionY + 112, contentWidth);

  const buttonLabel = !ship.selectable
    ? 'Unavailable'
    : unlocked
      ? ship.id === config.selectedShipId
        ? 'Equipped'
        : 'Equip Hull'
      : canUnlockShip(config, ship)
        ? `Repair ${ship.unlockCostCredits} Credits`
        : `Need ${ship.unlockCostCredits ?? 0} Credits`;
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: config.scene.scale.width / 2,
    screenCenterY: config.scene.scale.height / 2,
    x: x + width / 2,
    y: y + height - 44,
    width: Math.min(220, width - 42),
    height: 36,
    label: buttonLabel,
    callback: () => config.onShipAction(ship),
    isEnabled: ship.selectable && (unlocked ? ship.id !== config.selectedShipId : canUnlockShip(config, ship)),
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
}

function renderShipStatBars(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  ship: ShipRegistryEntry,
  x: number,
  y: number,
  width: number
): void {
  const displayStats = getShipDisplayStats(ship);
  const stats = [
    { label: 'Hull HP', value: displayStats.hull ?? 0, cap: SHIP_HULL_HP_CAP },
    { label: 'Velocity', value: displayStats.velocity ?? 0, cap: SHIP_STAT_CAP },
    { label: 'Acceleration', value: displayStats.acceleration ?? 0, cap: SHIP_STAT_CAP },
    { label: 'Control', value: displayStats.control ?? 0, cap: SHIP_STAT_CAP },
    { label: 'Tractor Field', value: displayStats.tractorField ?? 0, cap: SHIP_STAT_CAP },
    { label: 'Fuel', value: displayStats.fuel ?? 0, cap: SHIP_STAT_CAP }
  ];
  const columnGap = 16;
  const rowGap = 19;
  const columnWidth = Math.floor((width - columnGap) / 2);
  const labelWidth = 78;
  const valueWidth = 58;
  const barWidth = Math.max(36, columnWidth - labelWidth - valueWidth - 12);

  for (let index = 0; index < stats.length; index += 1) {
    const stat = stats[index];
    const column = index % 2;
    const row = Math.floor(index / 2);
    const statX = x + column * (columnWidth + columnGap);
    const statY = y + row * rowGap;
    const clamped = Phaser.Math.Clamp(stat.value, 0, stat.cap);
    const progress = clamped / stat.cap;
    container.add(
      config.scene.add
          .text(statX, statY, stat.label, {
          fontFamily: FONT,
          fontSize: '10px',
          color: '#8090a6',
          fixedWidth: labelWidth
        })
        .setOrigin(0, 0)
    );
    graphics.fillStyle(0x111a24, 0.98);
    graphics.fillRoundedRect(statX + labelWidth, statY + 2, barWidth, 8, 3);
    graphics.fillStyle(progress >= 0.66 ? 0x42f5d7 : progress >= 0.33 ? 0xffc857 : 0xff5964, 0.86);
    graphics.fillRoundedRect(statX + labelWidth, statY + 2, barWidth * progress, 8, 3);
    container.add(
      config.scene.add
        .text(statX + labelWidth + barWidth + 4, statY - 1, `${Math.round(clamped)}/${stat.cap}`, {
          fontFamily: FONT,
          fontSize: '9px',
          color: '#c9d6e4',
          fixedWidth: valueWidth
        })
        .setOrigin(0, 0)
    );
  }
}

function renderSkinWheel(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  ship: ShipRegistryEntry,
  x: number,
  y: number,
  width: number
): void {
  const skins = ship.skins ?? [];
  const selectedSkin = getSelectedSkin(config, ship)?.id;
  const label = config.scene.add
    .text(x, y - 18, 'SKINS', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#73f2ff'
    })
    .setOrigin(0, 0);
  container.add(label);

  let cursorX = x;
  for (const skin of skins) {
    const skinWidth = Math.max(64, Math.min(92, skin.displayName.length * 8 + 18));
    const selected = skin.id === selectedSkin;
    graphics.fillStyle(selected ? 0x102633 : 0x111a24, 0.94);
    graphics.fillRoundedRect(cursorX, y, skinWidth, 24, 5);
    graphics.lineStyle(1, selected ? 0x42f5d7 : 0x52627f, selected ? 0.9 : 0.62);
    graphics.strokeRoundedRect(cursorX, y, skinWidth, 24, 5);
    if (skin.tint !== undefined) {
      graphics.fillStyle(skin.tint, 0.95);
      graphics.fillCircle(cursorX + 12, y + 12, 5);
    }
    container.add(
      config.scene.add
        .text(cursorX + skinWidth / 2, y + 12, skin.displayName, {
          fontFamily: FONT,
          fontSize: '10px',
          color: skin.unlockedByDefault ? '#f2fbff' : '#8090a6',
          align: 'center',
          fixedWidth: skinWidth - 6
        })
        .setOrigin(0.5)
    );
    const zone = config.scene.add
      .zone(config.scene.scale.width / 2 + cursorX, config.scene.scale.height / 2 + y, skinWidth, 24)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (config.isActionActive() && skin.unlockedByDefault) {
          config.onSelectSkin(ship.id, skin.id);
        }
      })
      .on('pointerout', () => config.resetCursor());
    actionZones.push(zone);
    cursorX += skinWidth + 6;
    if (cursorX > x + width - 64) {
      break;
    }
  }
}

function renderReadinessStrip(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  ship: ShipRegistryEntry,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const shipUnlocked = config.unlockedShipIds.has(ship.id);
  const hasLeftWeapon = Boolean(config.weaponLoadout.primary[0]);
  const status = shipUnlocked ? (hasLeftWeapon ? 'READY' : 'NO LEFT WEAPON') : 'SHIP LOCKED';
  const statusColor = status === 'READY' ? '#73f2ff' : '#ff8f95';
  const suggestions = getMissionSuggestedTraits(config.selectedMission.difficulty);
  const text = `${ship.displayName}  |  ${config.selectedMission.displayName} (${config.selectedMission.difficulty})  |  Suggested: ${suggestions}  |  Loadout: ${status}`;

  graphics.fillStyle(0x071018, 0.96);
  graphics.fillRoundedRect(x, y, width, height, 6);
  graphics.lineStyle(1, status === 'READY' ? 0x42f5d7 : 0xff5964, 0.76);
  graphics.strokeRoundedRect(x, y, width, height, 6);
  container.add(
    config.scene.add
      .text(x + 14, y + height / 2, text, {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#c8f7ff',
        fixedWidth: width - 168
      })
      .setOrigin(0, 0.5)
  );
  container.add(
    config.scene.add
      .text(x + width - 18, y + height / 2, status, {
        fontFamily: FONT,
        fontSize: '12px',
        color: statusColor,
        align: 'right',
        fixedWidth: 130
      })
      .setOrigin(1, 0.5)
  );
}

function getMissionSuggestedTraits(difficulty: MissionDefinition['difficulty']): string {
  if (difficulty === 'High') {
    return 'Range, escape, durability';
  }

  if (difficulty === 'Medium') {
    return 'Speed, cleanup, reserves';
  }

  return 'Flexible loadout';
}

function renderOutfittingPanel(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  slotTargets: Array<{ slot: WeaponSlotType; index: number; bounds: Phaser.Geom.Rectangle }>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const contentX = x + 18;
  const contentWidth = width - 36;
  const selectedWeapon = getSelectedInventoryWeapon(config);

  container.add(
    config.scene.add
      .text(contentX, y + 42, 'ACTIVE BINDINGS', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#73f2ff'
      })
      .setOrigin(0, 0)
  );

  const activeGap = 8;
  const activeY = y + 62;
  const activeSlotWidth = Math.floor((contentWidth - activeGap * 2) / 3);
  for (let index = 0; index < ACTIVE_SLOT_TYPES.length; index += 1) {
    const slot = ACTIVE_SLOT_TYPES[index];
    renderWeaponSlot(config, container, graphics, actionZones, slotTargets, {
      slot,
      index: 0,
      x: contentX + index * (activeSlotWidth + activeGap),
      y: activeY,
      width: activeSlotWidth,
      height: 54,
      label: SLOT_LABELS[slot],
      selectedWeapon,
      active: true
    });
  }

  const reserveY = activeY + 76;
  container.add(
    config.scene.add
      .text(contentX, reserveY - 18, 'RESERVE RACK', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#73f2ff'
      })
      .setOrigin(0, 0)
  );

  const reserveGap = 6;
  const manualReserveWidth = Math.floor((contentWidth - reserveGap * 3) / 4);
  const autoReserveWidth = Math.floor((contentWidth - reserveGap) / 2);
  const manualReserveSlots: Array<{ slot: WeaponSlotType; index: number; label: string }> = [
    { slot: 'primary', index: 1, label: 'L2' },
    { slot: 'primary', index: 2, label: 'L3' },
    { slot: 'secondary', index: 1, label: 'R2' },
    { slot: 'secondary', index: 2, label: 'R3' }
  ];
  for (let index = 0; index < manualReserveSlots.length; index += 1) {
    const reserve = manualReserveSlots[index];
    renderWeaponSlot(config, container, graphics, actionZones, slotTargets, {
      slot: reserve.slot,
      index: reserve.index,
      x: contentX + index * (manualReserveWidth + reserveGap),
      y: reserveY,
      width: manualReserveWidth,
      height: 34,
      label: reserve.label,
      selectedWeapon,
      active: false
    });
  }

  const autoReserveY = reserveY + 42;
  for (let index = 1; index <= 2; index += 1) {
    renderWeaponSlot(config, container, graphics, actionZones, slotTargets, {
      slot: 'auto',
      index,
      x: contentX + (index - 1) * (autoReserveWidth + reserveGap),
      y: autoReserveY,
      width: autoReserveWidth,
      height: 34,
      label: `AUTO ${index + 1}`,
      selectedWeapon,
      active: false
    });
  }

  const detailY = autoReserveY + 48;
  renderSelectedWeaponDetails(config, container, graphics, selectedWeapon, contentX, detailY, contentWidth);
  renderCompactArmory(config, container, graphics, actionZones, slotTargets, contentX, detailY + 96, contentWidth, y + height - 52);
}

function renderWeaponSlot(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  slotTargets: Array<{ slot: WeaponSlotType; index: number; bounds: Phaser.Geom.Rectangle }>,
  options: {
    slot: WeaponSlotType;
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    selectedWeapon: WeaponRegistryEntry | null;
    active: boolean;
  }
): void {
  const weaponId = config.weaponLoadout[options.slot][options.index];
  const weapon = weaponId ? getWeaponDefinition(weaponId) : null;
  const canAssignSelected = options.selectedWeapon !== null && options.selectedWeapon.slotCompatibility.includes(options.slot);
  const borderColor = canAssignSelected ? 0xffc857 : options.active ? 0x42f5d7 : 0x52627f;

  graphics.fillStyle(options.active ? 0x102633 : 0x111a24, 0.94);
  graphics.fillRoundedRect(options.x, options.y, options.width, options.height, 5);
  graphics.lineStyle(1, borderColor, canAssignSelected || options.active ? 0.86 : 0.58);
  graphics.strokeRoundedRect(options.x, options.y, options.width, options.height, 5);

  container.add(
    config.scene.add
      .text(options.x + 7, options.y + 5, options.label, {
        fontFamily: FONT,
        fontSize: options.active ? '10px' : '9px',
        color: options.active ? '#c8f7ff' : '#8090a6',
        fixedWidth: options.width - (weapon ? 24 : 14)
      })
      .setOrigin(0, 0)
  );
  container.add(
    config.scene.add
      .text(options.x + options.width / 2, options.y + (options.active ? 34 : 23), weapon ? getCompactWeaponName(weapon) : 'Empty', {
        fontFamily: FONT,
        fontSize: options.active ? '12px' : '10px',
        color: weapon ? '#f2fbff' : '#8090a6',
        align: 'center',
        fixedWidth: options.width - 10
      })
      .setOrigin(0.5)
  );

  const bounds = new Phaser.Geom.Rectangle(
    config.scene.scale.width / 2 + options.x,
    config.scene.scale.height / 2 + options.y,
    options.width,
    options.height
  );
  slotTargets.push({ slot: options.slot, index: options.index, bounds });

  const zone = config.scene.add
    .zone(bounds.x, bounds.y, bounds.width, bounds.height)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1301)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      if (config.isActionActive() && weapon) {
        startWeaponDrag(config, slotTargets, weapon, pointer);
      }
    })
    .on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      if (config.isActionActive() && options.selectedWeapon && !ACTIVE_ARMORY_DRAG_SCENES.has(config.scene)) {
        config.onAssignWeapon(options.slot, options.index, options.selectedWeapon.id);
      }
    })
    .on('pointerout', () => config.resetCursor());
  actionZones.push(zone);

  if (!weapon) {
    return;
  }

  const clearSize = 16;
  const clearX = options.x + options.width - clearSize - 4;
  const clearY = options.y + 4;
  graphics.fillStyle(0x2b1118, 0.94);
  graphics.fillRoundedRect(clearX, clearY, clearSize, clearSize, 4);
  graphics.lineStyle(1, 0xff5964, 0.75);
  graphics.strokeRoundedRect(clearX, clearY, clearSize, clearSize, 4);
  container.add(
    config.scene.add
      .text(clearX + clearSize / 2, clearY + clearSize / 2, 'X', {
        fontFamily: FONT,
        fontSize: '10px',
        color: '#ff8f95',
        align: 'center'
      })
      .setOrigin(0.5)
  );

  const clearZone = config.scene.add
    .zone(config.scene.scale.width / 2 + clearX, config.scene.scale.height / 2 + clearY, clearSize, clearSize)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1302)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      if (config.isActionActive()) {
        config.onClearWeapon(options.slot, options.index);
      }
    })
    .on('pointerout', () => config.resetCursor());
  actionZones.push(clearZone);
}

function renderSelectedWeaponDetails(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  weapon: WeaponRegistryEntry | null,
  x: number,
  y: number,
  width: number
): void {
  graphics.fillStyle(0x111a24, 0.94);
  graphics.fillRoundedRect(x, y, width, 82, 5);
  graphics.lineStyle(1, 0x52627f, 0.64);
  graphics.strokeRoundedRect(x, y, width, 82, 5);

  const copy = weapon
    ? `${weapon.displayName}   ${formatWeaponMk(config.weaponMkLevels[weapon.id] ?? 1)}\n${getWeaponUseLabel(weapon)}\n${getWeaponStartingStats(weapon)}`
    : 'Select a weapon from Armory to inspect or assign it.';
  container.add(
    config.scene.add
      .text(x + 12, y + 10, copy, {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#f2fbff',
        fixedWidth: width - 24,
        lineSpacing: 4,
        wordWrap: { width: width - 24, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
  );
}

function renderCompactArmory(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  slotTargets: Array<{ slot: WeaponSlotType; index: number; bounds: Phaser.Geom.Rectangle }>,
  x: number,
  y: number,
  width: number,
  bottomY: number
): void {
  container.add(
    config.scene.add
      .text(x, y, 'ARMORY', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#73f2ff'
      })
      .setOrigin(0, 0)
  );

  const rowHeight = 32;
  const rowGap = 6;
  const listTop = y + 22;
  const maxRows = Math.max(1, Math.floor((bottomY - listTop) / (rowHeight + rowGap)));
  const weaponIds = config.availableWeaponIds.slice(config.inventoryScrollIndex, config.inventoryScrollIndex + maxRows);

  for (let index = 0; index < weaponIds.length; index += 1) {
    const weapon = getWeaponDefinition(weaponIds[index]);
    const rowY = listTop + index * (rowHeight + rowGap);
    const selected = weapon.id === config.selectedInventoryWeaponId;
    const equippedLabel = getEquippedWeaponLabel(config.weaponLoadout, weapon.id);
    const armoryLabel = weapon.slotCompatibility.includes('auto')
      ? `${weapon.displayName}   ${formatWeaponMk(config.weaponMkLevels[weapon.id] ?? 1)}   AUTO${equippedLabel}`
      : `${weapon.displayName}   ${formatWeaponMk(config.weaponMkLevels[weapon.id] ?? 1)}${equippedLabel}`;
    graphics.fillStyle(selected ? 0x102633 : 0x111a24, 0.94);
    graphics.fillRoundedRect(x, rowY, width, rowHeight, 5);
    graphics.lineStyle(1, selected ? 0xffc857 : 0x52627f, selected ? 0.9 : 0.58);
    graphics.strokeRoundedRect(x, rowY, width, rowHeight, 5);
    container.add(
      config.scene.add
        .text(
          x + 10,
          rowY + 8,
          armoryLabel,
          {
          fontFamily: FONT,
          fontSize: '11px',
          color: '#f2fbff',
          fixedWidth: width - 20
          }
        )
        .setOrigin(0, 0)
    );

    const zone = config.scene.add
      .zone(config.scene.scale.width / 2 + x, config.scene.scale.height / 2 + rowY, width, rowHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (config.isActionActive()) {
          startWeaponDrag(config, slotTargets, weapon, pointer);
        }
      })
      .on('pointerout', () => config.resetCursor());
    actionZones.push(zone);
  }

  if (config.availableWeaponIds.length > maxRows) {
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: config.scene.scale.width / 2,
      screenCenterY: config.scene.scale.height / 2,
      x: x + width - 92,
      y: bottomY + 8,
      width: 84,
      height: 26,
      label: 'UP',
      callback: () => config.onInventoryScroll(-1),
      isEnabled: config.inventoryScrollIndex > 0,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: config.scene.scale.width / 2,
      screenCenterY: config.scene.scale.height / 2,
      x: x + width - 2,
      y: bottomY + 8,
      width: 84,
      height: 26,
      label: 'DOWN',
      callback: () => config.onInventoryScroll(1),
      isEnabled: config.inventoryScrollIndex + maxRows < config.availableWeaponIds.length,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
  }
}

function renderLoadoutPanel(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  slotTargets: Array<{ slot: WeaponSlotType; index: number; bounds: Phaser.Geom.Rectangle }>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const contentX = x + 18;
  const contentWidth = width - 36;
  const categoryHeight = Math.floor((height - 72) / 3);
  const slotHeight = 25;
  const slotStep = 29;
  for (let categoryIndex = 0; categoryIndex < SLOT_TYPES.length; categoryIndex += 1) {
    const slot = SLOT_TYPES[categoryIndex];
    const top = y + 52 + categoryIndex * categoryHeight;
    container.add(
      config.scene.add
        .text(contentX, top, `${SLOT_LABELS[slot]} WEAPONS`, {
          fontFamily: FONT,
          fontSize: '13px',
          color: '#73f2ff'
        })
        .setOrigin(0, 0)
    );

    for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
      const slotY = top + 22 + slotIndex * slotStep;
      const weaponId = config.weaponLoadout[slot][slotIndex];
      const weapon = weaponId ? getWeaponDefinition(weaponId) : null;
      const active = slotIndex === 0;
      const canAssignSelected =
        config.selectedInventoryWeaponId !== null &&
        getWeaponDefinition(config.selectedInventoryWeaponId).slotCompatibility.includes(slot);
      graphics.fillStyle(active ? 0x102633 : 0x111a24, 0.94);
      graphics.fillRoundedRect(contentX, slotY, contentWidth, slotHeight, 5);
      graphics.lineStyle(1, canAssignSelected ? 0xffc857 : active ? 0x42f5d7 : 0x52627f, canAssignSelected ? 0.9 : 0.64);
      graphics.strokeRoundedRect(contentX, slotY, contentWidth, slotHeight, 5);
      container.add(
        config.scene.add
          .text(contentX + 10, slotY + 6, `${active ? 'ACTIVE' : 'RESERVE'} ${slotIndex + 1}: ${weapon ? weapon.displayName : 'Empty'}`, {
            fontFamily: FONT,
            fontSize: '12px',
            color: weapon ? '#f2fbff' : '#8090a6',
            fixedWidth: contentWidth - 20
          })
          .setOrigin(0, 0)
      );
      const bounds = new Phaser.Geom.Rectangle(
        config.scene.scale.width / 2 + contentX,
        config.scene.scale.height / 2 + slotY,
        contentWidth,
        slotHeight
      );
      slotTargets.push({ slot, index: slotIndex, bounds });
      const zone = config.scene.add
        .zone(bounds.x, bounds.y, bounds.width, bounds.height)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1301)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', (pointer: Phaser.Input.Pointer) => {
          pointer.event?.stopPropagation();
          if (config.isActionActive() && config.selectedInventoryWeaponId) {
            config.onAssignWeapon(slot, slotIndex, config.selectedInventoryWeaponId);
          }
        })
        .on('pointerout', () => config.resetCursor());
      actionZones.push(zone);
    }
  }
}

function renderInventoryPanel(
  config: ShipSelectScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  slotTargets: Array<{ slot: WeaponSlotType; index: number; bounds: Phaser.Geom.Rectangle }>,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const rowHeight = 76;
  const rowGap = 8;
  const contentX = x + 14;
  const contentWidth = width - 28;
  const listTop = y + 52;
  const maxRows = Math.max(1, Math.floor((height - 104) / (rowHeight + rowGap)));
  const weaponIds = config.availableWeaponIds.slice(config.inventoryScrollIndex, config.inventoryScrollIndex + maxRows);

  for (let index = 0; index < weaponIds.length; index += 1) {
    const weapon = getWeaponDefinition(weaponIds[index]);
    const rowY = listTop + index * (rowHeight + rowGap);
    const selected = weapon.id === config.selectedInventoryWeaponId;
    graphics.fillStyle(selected ? 0x102633 : 0x111a24, 0.94);
    graphics.fillRoundedRect(contentX, rowY, contentWidth, rowHeight, 5);
    graphics.lineStyle(1, selected ? 0xffc857 : 0x52627f, selected ? 0.9 : 0.62);
    graphics.strokeRoundedRect(contentX, rowY, contentWidth, rowHeight, 5);

    const text = config.scene.add
      .text(contentX + 12, rowY + 9, `${weapon.displayName}   ${formatWeaponMk(config.weaponMkLevels[weapon.id] ?? 1)}\n${getWeaponUseLabel(weapon)}\n${getWeaponStartingStats(weapon)}`, {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#f2fbff',
        fixedWidth: contentWidth - 24,
        lineSpacing: 2,
        wordWrap: { width: contentWidth - 24, useAdvancedWrap: true }
      })
      .setOrigin(0, 0);
    container.add(text);

    const zone = config.scene.add
      .zone(config.scene.scale.width / 2 + contentX, config.scene.scale.height / 2 + rowY, contentWidth, rowHeight)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1301)
      .setInteractive({ useHandCursor: true, draggable: true })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (config.isActionActive()) {
          config.onSelectInventoryWeapon(weapon.id);
        }
      })
      .on('dragend', (pointer: Phaser.Input.Pointer) => {
        if (!config.isActionActive()) {
          return;
        }

        const target = slotTargets.find((candidate) => candidate.bounds.contains(pointer.x, pointer.y));
        if (target && weapon.slotCompatibility.includes(target.slot)) {
          config.onAssignWeapon(target.slot, target.index, weapon.id);
        }
      })
      .on('pointerout', () => config.resetCursor());
    config.scene.input.setDraggable(zone);
    actionZones.push(zone);
  }

  if (config.availableWeaponIds.length > maxRows) {
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: config.scene.scale.width / 2,
      screenCenterY: config.scene.scale.height / 2,
      x: x + width / 2 - 46,
      y: y + height - 42,
      width: 84,
      height: 28,
      label: 'UP',
      callback: () => config.onInventoryScroll(-1),
      isEnabled: config.inventoryScrollIndex > 0,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
    addScreenButton({
      scene: config.scene,
      container,
      actionZones,
      screenCenterX: config.scene.scale.width / 2,
      screenCenterY: config.scene.scale.height / 2,
      x: x + width / 2 + 46,
      y: y + height - 42,
      width: 84,
      height: 28,
      label: 'DOWN',
      callback: () => config.onInventoryScroll(1),
      isEnabled: config.inventoryScrollIndex + maxRows < config.availableWeaponIds.length,
      isActionActive: config.isActionActive,
      resetCursor: config.resetCursor
    });
  }
}

function getSelectedInventoryWeapon(config: ShipSelectScreenConfig): WeaponRegistryEntry | null {
  const selectedWeaponId = config.selectedInventoryWeaponId ?? config.availableWeaponIds[0] ?? null;
  return selectedWeaponId ? getWeaponDefinition(selectedWeaponId) : null;
}

function getCompactWeaponName(weapon: WeaponRegistryEntry): string {
  if (weapon.displayName.length <= 12) {
    return weapon.displayName;
  }

  return weapon.displayName
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 8)
    .toUpperCase();
}

function getSelectedSkin(config: ShipSelectScreenConfig, ship: ShipRegistryEntry): NonNullable<ShipRegistryEntry['skins']>[number] | undefined {
  const selectedSkinId = config.selectedSkinIds[ship.id] ?? ship.skins?.find((skin) => skin.unlockedByDefault)?.id;
  return ship.skins?.find((skin) => skin.id === selectedSkinId) ?? ship.skins?.[0];
}

function getShipLockedLabel(ship: ShipRegistryEntry): string {
  if (!ship.selectable) {
    return 'Hidden';
  }

  return ship.unlockCostCredits === undefined ? 'Locked' : `Repair ${ship.unlockCostCredits}`;
}

function canUnlockShip(config: ShipSelectScreenConfig, ship: ShipRegistryEntry): boolean {
  return ship.selectable && !config.unlockedShipIds.has(ship.id) && ship.unlockCostCredits !== undefined && config.totalCredits >= ship.unlockCostCredits;
}

function getWeaponUseLabel(weapon: WeaponRegistryEntry): string {
  return weapon.slotCompatibility.includes('auto') ? 'Auto weapon' : 'Fits left or right click';
}

function getWeaponStartingStats(weapon: WeaponRegistryEntry): string {
  if (weapon.rammingShield) {
    return `Shield ${Math.round(weapon.rammingShield.shieldMaxHp)}  Charges ${weapon.rammingShield.dashMaxCharges}  Bash ${Math.round(weapon.rammingShield.bashDamage)}`;
  }

  return `Damage ${Math.round(weapon.damage ?? 0)}  Fire ${(weapon.cooldownSeconds ? 1 / weapon.cooldownSeconds : 0).toFixed(2)}/s  Speed ${Math.round(weapon.projectileSpeed ?? 0)}`;
}

function getEquippedWeaponLabel(loadout: WeaponLoadoutState, weaponId: WeaponId): string {
  for (const slot of SLOT_TYPES) {
    const index = loadout[slot].findIndex((candidate) => candidate === weaponId);
    if (index >= 0) {
      return `   IN ${SLOT_LABELS[slot]} ${index + 1}`;
    }
  }

  return '';
}

function startWeaponDrag(
  config: ShipSelectScreenConfig,
  slotTargets: Array<{ slot: WeaponSlotType; index: number; bounds: Phaser.Geom.Rectangle }>,
  weapon: WeaponRegistryEntry,
  pointer: Phaser.Input.Pointer
): void {
  const startX = pointer.x;
  const startY = pointer.y;
  let moved = false;
  ACTIVE_ARMORY_DRAG_SCENES.add(config.scene);
  const ghost = config.scene.add
    .text(pointer.x + 12, pointer.y + 12, weapon.displayName, {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#f2fbff',
      backgroundColor: '#102633',
      padding: { x: 8, y: 5 }
    })
    .setDepth(1500)
    .setAlpha(0.9);

  const move = (movePointer: Phaser.Input.Pointer): void => {
    const distance = Phaser.Math.Distance.Between(startX, startY, movePointer.x, movePointer.y);
    moved = moved || distance > 8;
    const target = slotTargets.find((candidate) => candidate.bounds.contains(movePointer.x, movePointer.y));
    if (target) {
      ghost.setBackgroundColor(weapon.slotCompatibility.includes(target.slot) ? '#12392f' : '#3a1218');
    } else {
      ghost.setBackgroundColor('#102633');
    }
    ghost.setPosition(movePointer.x + 12, movePointer.y + 12);
  };

  const release = (releasePointer: Phaser.Input.Pointer): void => {
    config.scene.input.off('pointermove', move);
    config.scene.time.delayedCall(0, () => ACTIVE_ARMORY_DRAG_SCENES.delete(config.scene));
    ghost.destroy();

    if (!config.isActionActive()) {
      return;
    }

    if (!moved) {
      const now = config.scene.time.now;
      const lastClick = LAST_WEAPON_CLICK_AT.get(config.scene);
      LAST_WEAPON_CLICK_AT.set(config.scene, { weaponId: weapon.id, at: now });
      if (lastClick?.weaponId === weapon.id && now - lastClick.at <= 360) {
        const target = getAutoPlaceTarget(config.weaponLoadout, weapon);
        if (target) {
          config.onAssignWeapon(target.slot, target.index, weapon.id);
          return;
        }
      }
      config.onSelectInventoryWeapon(weapon.id);
      return;
    }

    const target = slotTargets.find((candidate) => candidate.bounds.contains(releasePointer.x, releasePointer.y));
    if (target && weapon.slotCompatibility.includes(target.slot)) {
      config.onAssignWeapon(target.slot, target.index, weapon.id);
    }
  };

  config.scene.input.on('pointermove', move);
  config.scene.input.once('pointerup', release);
}

function getAutoPlaceTarget(loadout: WeaponLoadoutState, weapon: WeaponRegistryEntry): { slot: WeaponSlotType; index: number } | null {
  const slots = weapon.slotCompatibility.includes('auto') ? (['auto'] as WeaponSlotType[]) : MANUAL_SLOT_TYPES;

  for (const slot of slots) {
    for (let index = 0; index < loadout[slot].length; index += 1) {
      if (!loadout[slot][index]) {
        return { slot, index };
      }
    }
  }

  return null;
}

function formatWeaponMk(level: number): string {
  return `MK. ${toRoman(Math.max(1, Math.floor(level)))}`;
}

function toRoman(value: number): string {
  const numerals: Array<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ];
  let remaining = value;
  let result = '';
  for (const [amount, numeral] of numerals) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}
