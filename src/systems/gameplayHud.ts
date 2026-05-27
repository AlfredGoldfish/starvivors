import Phaser from 'phaser';
import { HUD_MARGIN } from '../scenes/gameConstants';
import type { WeaponId, WeaponSlotType } from '../data/weapons';
import {
  DEFAULT_HUD_BUTTON_VARIANT,
  clampHudButtonVariant,
  type HudButtonVariant
} from './hudButtonVariants';
import { drawCockpitCard } from '../ui/cockpitCard';

export type WeaponHotbarSlotType = 'auto' | 'primary' | 'secondary';

export interface WeaponHotbarChoiceSnapshot {
  weaponId: WeaponId;
  name: string;
}

export interface WeaponHotbarSlotSnapshot {
  slot: WeaponHotbarSlotType;
  weaponId: WeaponId | null;
  title: string;
  subtitle: string;
  controlLabel: string;
  cooldownProgress: number;
  choices: WeaponHotbarChoiceSnapshot[];
  tooltipLines: string[];
}

export interface GameplayHudSnapshot {
  timeSeconds: number;
  playerHull: number;
  maxHull: number;
  status: string;
  playerXp: number;
  nextXpThreshold: number;
  fuel: number;
  maxFuel: number;
  fuelProgress: number;
  isFuelEmergency: boolean;
  missionName: string;
  missionStatus: string;
  missionObjectiveDistance: number;
  missionObjectiveRadius: number;
  missionDisplayName: string;
  missionObjectiveLabel: string;
  missionDescription: string;
  missionDifficulty: string;
  missionRewardPreview: string;
  runScrapTotal: number;
  scrapSpentThisRun: number;
  nextRerollCost: number;
  bankedUpgrades: number;
  radarStatus: string;
  radarLevel: number;
  sectorScannerStatus: string;
  sectorScannerCompleted: boolean;
  contractStatusLine: string;
  autoWeaponName: string;
  primaryWeaponName: string;
  weaponStatus: string;
  secondaryWeaponName: string;
  mainWeaponUpgradeSummary: string;
  hullProgress: number;
  xpProgress: number;
  weaponProgress: number;
  isHullCritical: boolean;
  isUpgradeReady: boolean;
  isMissionDanger: boolean;
  hasRammingShield: boolean;
  rammingShieldHp: number;
  rammingShieldMaxHp: number;
  rammingShieldDashCharges: number;
  rammingShieldDashMaxCharges: number;
  isRammingShieldEmpowered: boolean;
  weaponSlots: WeaponHotbarSlotSnapshot[];
}

export interface GameplayHudCallbacks {
  assignWeaponSlot: (slot: WeaponSlotType, weaponId: WeaponId) => void;
  requestEject: () => void;
}

export interface GameplayHudOptions {
  hudButtonVariant?: HudButtonVariant;
}

interface HudControlRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DashboardButtonRects {
  weapons: Record<WeaponHotbarSlotType, HudControlRect>;
  mission: HudControlRect;
  eject: HudControlRect;
}

interface DashboardButtonChrome {
  accentColor: number;
  fillColor?: number;
  active?: boolean;
  hovered?: boolean;
  danger?: boolean;
  disabled?: boolean;
  progress?: number;
  kind: 'weapon' | 'mission' | 'eject' | 'picker';
  segmentIndex?: number;
  segmentCount?: number;
}

export class GameplayHudSystem {
  private readonly scene: Phaser.Scene;
  private readonly callbacks: GameplayHudCallbacks;
  private buttonVariant: HudButtonVariant;
  private hudGraphics?: Phaser.GameObjects.Graphics;
  private hudText?: Phaser.GameObjects.Text;
  private xpTimerText?: Phaser.GameObjects.Text;
  private upgradeChipText?: Phaser.GameObjects.Text;
  private warningText?: Phaser.GameObjects.Text;
  private dashboardTexts: Phaser.GameObjects.Text[] = [];
  private missionButtonText?: Phaser.GameObjects.Text;
  private missionButtonZone?: Phaser.GameObjects.Zone;
  private missionLogGraphics?: Phaser.GameObjects.Graphics;
  private missionLogTexts: Phaser.GameObjects.Text[] = [];
  private hotbarGraphics?: Phaser.GameObjects.Graphics;
  private hotbarTexts: Partial<Record<WeaponHotbarSlotType, Phaser.GameObjects.Text>> = {};
  private hotbarZones: Partial<Record<WeaponHotbarSlotType, Phaser.GameObjects.Zone>> = {};
  private pickerGraphics?: Phaser.GameObjects.Graphics;
  private pickerTexts: Phaser.GameObjects.Text[] = [];
  private pickerZones: Phaser.GameObjects.Zone[] = [];
  private ejectText?: Phaser.GameObjects.Text;
  private ejectZone?: Phaser.GameObjects.Zone;
  private tooltipGraphics?: Phaser.GameObjects.Graphics;
  private tooltipText?: Phaser.GameObjects.Text;
  private latestSnapshot?: GameplayHudSnapshot;
  private openPickerSlot: WeaponHotbarSlotType | null = null;
  private hoveredSlot: WeaponHotbarSlotType | null = null;
  private isMissionButtonHovered = false;
  private isMissionLogOpen = false;
  private missionLogBounds?: Phaser.Geom.Rectangle;
  private isEjectHovered = false;

  constructor(scene: Phaser.Scene, callbacks: GameplayHudCallbacks, options: GameplayHudOptions = {}) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.buttonVariant = options.hudButtonVariant ?? this.getHudButtonVariantFromQuery();
  }

  create(): void {
    this.dashboardTexts = [];
    this.hotbarTexts = {};
    this.hotbarZones = {};
    this.pickerTexts = [];
    this.pickerZones = [];
    this.missionLogTexts = [];
    this.openPickerSlot = null;
    this.hoveredSlot = null;
    this.isMissionButtonHovered = false;
    this.isMissionLogOpen =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('testHarness') === 'hudMissionLog';
    this.missionLogBounds = undefined;
    this.isEjectHovered = false;

    this.hudGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.hudText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f2fbff',
        fixedWidth: 360,
        lineSpacing: 3
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1002)
      .setShadow(0, 0, '#42f5d7', 3, false, true);
    this.xpTimerText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: 260
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1002)
      .setShadow(0, 0, '#42f5d7', 3, false, true);
    this.upgradeChipText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#02040a',
        align: 'center',
        fixedWidth: 190
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1003)
      .setVisible(false)
      .setShadow(0, 0, '#fff0a0', 2, false, true);
    this.warningText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '12px',
        color: '#02040a',
        align: 'center',
        fixedWidth: 620
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1002);
    for (let i = 0; i < 4; i += 1) {
      const text = this.scene.add
        .text(0, 0, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#f2fbff',
          align: 'center',
          fixedWidth: 152,
          lineSpacing: 2,
          wordWrap: { width: 144, useAdvancedWrap: true }
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1010)
        .setShadow(1, 1, '#02040a', 3, true, true);
      this.dashboardTexts.push(text);
    }
    this.hotbarGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1002);
    this.pickerGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1003);
    this.tooltipGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1005).setVisible(false);
    this.tooltipText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '12px',
        color: '#f2fbff',
        lineSpacing: 3,
        wordWrap: { width: 300 }
      })
      .setScrollFactor(0)
      .setDepth(1006)
      .setVisible(false);

    for (const slot of ['auto', 'primary', 'secondary'] as WeaponHotbarSlotType[]) {
      const text = this.scene.add
        .text(0, 0, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '12px',
          color: '#f2fbff',
          align: 'center',
          fixedWidth: 132,
          wordWrap: { width: 124, useAdvancedWrap: true }
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1004)
        .setShadow(1, 1, '#02040a', 3, true, true);
      const zone = this.scene.add.zone(0, 0, 132, 64).setScrollFactor(0).setDepth(1007).setInteractive({ useHandCursor: true });

      zone.on('pointerover', () => {
        this.hoveredSlot = slot;
        this.updateTooltip();
      });
      zone.on('pointerout', () => {
        this.hoveredSlot = null;
        this.updateTooltip();
      });
      zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.openPickerSlot = this.openPickerSlot === slot ? null : slot;
        this.drawHotbar();
      });

      this.hotbarTexts[slot] = text;
      this.hotbarZones[slot] = zone;
    }

    this.missionButtonText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: 126,
        lineSpacing: 2,
        wordWrap: { width: 118, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004)
      .setShadow(1, 1, '#02040a', 3, true, true);

    this.missionButtonZone = this.scene.add
      .zone(0, 0, 150, 66)
      .setScrollFactor(0)
      .setDepth(1007)
      .setInteractive({ useHandCursor: true });
    this.missionButtonZone.on('pointerover', () => {
      this.isMissionButtonHovered = true;
      this.drawHotbar();
    });
    this.missionButtonZone.on('pointerout', () => {
      this.isMissionButtonHovered = false;
      this.drawHotbar();
    });
    this.missionButtonZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation());
    this.missionButtonZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.toggleMissionLog();
    });

    this.ejectText = this.scene.add
      .text(0, 0, 'EJECT', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#ffb3b8',
        align: 'center',
        fixedWidth: 90
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004)
      .setShadow(1, 1, '#02040a', 3, true, true);

    this.ejectZone = this.scene.add
      .zone(0, 0, 90, 48)
      .setScrollFactor(0)
      .setDepth(1007)
      .setInteractive({ useHandCursor: true });
    this.ejectZone.on('pointerover', () => {
      this.isEjectHovered = true;
      this.drawHotbar();
    });
    this.ejectZone.on('pointerout', () => {
      this.isEjectHovered = false;
      this.drawHotbar();
    });
    this.ejectZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation());
    this.ejectZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.callbacks.requestEject();
    });

    this.missionLogGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1008).setVisible(false);
    for (let i = 0; i < 6; i += 1) {
      const text = this.scene.add
        .text(0, 0, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: i === 0 ? '14px' : '12px',
          fontStyle: i === 0 ? 'bold' : '',
          color: '#f2fbff',
          lineSpacing: 3,
          wordWrap: { width: 320, useAdvancedWrap: true }
        })
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1009)
        .setVisible(false);
      this.missionLogTexts.push(text);
    }
  }

  update(snapshot: GameplayHudSnapshot): void {
    if (!this.hudText || !this.hudGraphics || !this.xpTimerText || !this.upgradeChipText || !this.warningText) {
      return;
    }

    this.latestSnapshot = snapshot;
    const topLayout = this.getTopHudLayout();

    this.hudText
      .setPosition(topLayout.x + 22, topLayout.y + 12)
      .setText(`XP ${snapshot.playerXp}/${snapshot.nextXpThreshold}`);
    this.xpTimerText
      .setPosition(topLayout.x + topLayout.width / 2, topLayout.y + 12)
      .setText(`RUN ${this.formatSurvivalTime(snapshot.timeSeconds)}`);
    this.upgradeChipText
      .setPosition(topLayout.x + topLayout.width - 114, topLayout.y + 11)
      .setText(snapshot.isUpgradeReady ? `UPGRADE x${snapshot.bankedUpgrades}` : '')
      .setVisible(snapshot.isUpgradeReady);
    this.updateDashboardTexts(snapshot);
    this.updateWarningText(snapshot);

    this.drawBars(snapshot);
    this.drawHotbar();
  }

  private drawBars(snapshot: GameplayHudSnapshot): void {
    if (!this.hudGraphics) {
      return;
    }

    const topLayout = this.getTopHudLayout();
    const xpBarY = topLayout.y + 42;

    this.hudGraphics.clear();
    this.drawCockpitPanel(this.hudGraphics, topLayout.x, topLayout.y, topLayout.width, topLayout.height, 0x42f5d7, true);
    this.drawSegmentedBar(
      topLayout.x + 18,
      xpBarY,
      topLayout.width - 36,
      22,
      Phaser.Math.Clamp(snapshot.xpProgress, 0, 1),
      0x42f5d7
    );
    if (snapshot.isUpgradeReady) {
      const chipX = topLayout.x + topLayout.width - 210;
      const pulse = this.getSlowPulse(0.18);
      this.hudGraphics.fillStyle(0xffc857, 0.78 + pulse);
      this.hudGraphics.fillRoundedRect(chipX, topLayout.y + 9, 190, 24, 6);
      this.hudGraphics.lineStyle(2, 0xfff0a0, 0.72 + pulse);
      this.hudGraphics.strokeRoundedRect(chipX, topLayout.y + 9, 190, 24, 6);
    }
    this.drawWarningChips(snapshot);
  }

  private updateDashboardTexts(snapshot: GameplayHudSnapshot): void {
    if (this.dashboardTexts.length < 3) {
      return;
    }

    const layout = this.getDashboardLayout();
    const positions = this.getDashboardInfoPositions();
    const scrapTicker = this.getScrapTickerPosition();

    const lines = [
      `HULL ${Math.round(snapshot.playerHull)}/${Math.round(snapshot.maxHull)}`,
      `FUEL ${Math.ceil(snapshot.fuel)}/${snapshot.maxFuel}`,
      `SCRAP: ${snapshot.runScrapTotal}`
    ];

    this.dashboardTexts.forEach((text, index) => {
      if (index >= lines.length) {
        text.setVisible(false);
        return;
      }

      if (index === 2) {
        text
          .setOrigin(0.5, 0.5)
          .setAlign('center')
          .setFixedSize(150, 0)
          .setWordWrapWidth(150, false)
          .setFontSize('12px')
          .setVisible(true)
          .setDepth(1010)
          .setPosition(scrapTicker.x, scrapTicker.y)
          .setText(lines[index]);
        this.scene.children.bringToTop(text);
        return;
      }

      text
        .setOrigin(0.5, 0.5)
        .setAlign('center')
        .setFixedSize(Math.max(132, layout.infoBayWidth - 14), 0)
        .setWordWrapWidth(Math.max(126, layout.infoBayWidth - 20), false)
        .setFontSize('12px')
        .setVisible(true)
        .setDepth(1010)
        .setPosition(positions[index].x, positions[index].y)
        .setText(lines[index] ?? '');
      this.scene.children.bringToTop(text);
    });
  }

  private updateWarningText(snapshot: GameplayHudSnapshot): void {
    if (!this.warningText) {
      return;
    }

    const warnings = this.getWarningLabels(snapshot);
    this.warningText
      .setPosition(this.scene.scale.width / 2, this.getTopHudLayout().y + this.getTopHudLayout().height + 10)
      .setText(warnings.join('   '))
      .setVisible(warnings.length > 0);
  }

  private drawWarningChips(snapshot: GameplayHudSnapshot): void {
    if (!this.hudGraphics) {
      return;
    }

    const warnings = this.getWarningLabels(snapshot);
    if (warnings.length <= 0) {
      return;
    }

    const totalWidth = Math.min(680, 108 + warnings.join('').length * 8);
    const x = this.scene.scale.width / 2 - totalWidth / 2;
    const topLayout = this.getTopHudLayout();
    const y = topLayout.y + topLayout.height + 6;
    const isDanger = snapshot.isFuelEmergency || snapshot.isHullCritical || snapshot.isMissionDanger;
    const pulse = this.getSlowPulse(0.1);
    this.hudGraphics.fillStyle(isDanger ? 0xff5964 : 0xffc857, isDanger ? 0.82 + pulse : 0.88);
    this.hudGraphics.fillRoundedRect(x, y, totalWidth, 24, 6);
    this.hudGraphics.lineStyle(1, 0xf2fbff, 0.42);
    this.hudGraphics.strokeRoundedRect(x, y, totalWidth, 24, 6);
  }

  private getWarningLabels(snapshot: GameplayHudSnapshot): string[] {
    return [
      snapshot.isFuelEmergency ? 'FUEL EMERGENCY' : '',
      snapshot.isHullCritical ? 'LOW HULL' : '',
      snapshot.isUpgradeReady ? `UPGRADE x${snapshot.bankedUpgrades}` : '',
      snapshot.isMissionDanger ? 'MISSION DANGER' : '',
      snapshot.sectorScannerCompleted ? 'SCAN COMPLETE' : ''
    ].filter(Boolean);
  }

  private drawDashboardMeters(snapshot: GameplayHudSnapshot): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const layout = this.getDashboardLayout();
    const positions = this.getDashboardInfoPositions();
    this.drawInfoBayMeter(
      positions[0].x - layout.infoBayWidth / 2,
      positions[0].y - layout.infoBayHeight / 2,
      layout.infoBayWidth,
      layout.infoBayHeight,
      Phaser.Math.Clamp(snapshot.hullProgress, 0, 1),
      snapshot.isHullCritical ? 0xff5964 : 0x52ff9a,
      snapshot.isHullCritical
    );
    this.drawInfoBayMeter(
      positions[1].x - layout.infoBayWidth / 2,
      positions[1].y - layout.infoBayHeight / 2,
      layout.infoBayWidth,
      layout.infoBayHeight,
      Phaser.Math.Clamp(snapshot.fuelProgress, 0, 1),
      snapshot.isFuelEmergency ? 0xff5964 : 0xffc857,
      snapshot.isFuelEmergency
    );
    if (snapshot.hasRammingShield) {
      const shieldProgress = snapshot.rammingShieldMaxHp > 0 ? snapshot.rammingShieldHp / snapshot.rammingShieldMaxHp : 0;
      this.drawShieldRail(
        positions[0].x - layout.infoBayWidth / 2,
        positions[0].y - layout.infoBayHeight / 2,
        layout.infoBayWidth,
        layout.infoBayHeight,
        Phaser.Math.Clamp(shieldProgress, 0, 1)
      );
    }
  }

  private drawSegmentedBar(x: number, y: number, width: number, height: number, progress: number, color: number): void {
    if (!this.hudGraphics) {
      return;
    }

    this.hudGraphics.fillStyle(0x02040a, 0.76);
    this.hudGraphics.fillRoundedRect(x - 3, y - 3, width + 6, height + 6, 5);
    this.hudGraphics.lineStyle(2, 0xc89452, 0.78);
    this.hudGraphics.strokeRoundedRect(x - 3, y - 3, width + 6, height + 6, 5);
    this.hudGraphics.fillStyle(0x111a24, 0.92);
    this.hudGraphics.fillRect(x, y, width, height);
    this.hudGraphics.fillStyle(color, 0.06);
    this.hudGraphics.fillRect(x, y, width, height);
    this.hudGraphics.fillStyle(color, 0.88);
    this.hudGraphics.fillRect(x, y, width * progress, height);
    this.hudGraphics.fillStyle(0xf2fbff, 0.18);
    this.hudGraphics.fillRect(x, y, width * progress, Math.max(3, height * 0.22));
    this.hudGraphics.lineStyle(1, 0x02040a, 0.44);
    for (let index = 1; index < 12; index += 1) {
      const tickX = x + (width * index) / 12;
      this.hudGraphics.lineBetween(tickX, y, tickX, y + height);
    }
  }

  private drawHotbar(): void {
    if (!this.hotbarGraphics || !this.latestSnapshot) {
      return;
    }

    const slots = this.latestSnapshot.weaponSlots;
    const buttons = this.getDashboardButtonRects();

    this.hotbarGraphics.clear();
    this.drawDashboardShell();
    this.drawDashboardMeters(this.latestSnapshot);

    for (const slotSnapshot of slots) {
      const rect = buttons.weapons[slotSnapshot.slot];
      const text = this.hotbarTexts[slotSnapshot.slot];
      const zone = this.hotbarZones[slotSnapshot.slot];
      if (!text || !zone) {
        continue;
      }

      const isOpen = this.openPickerSlot === slotSnapshot.slot;
      const isHovered = this.hoveredSlot === slotSnapshot.slot;
      const fillColor = slotSnapshot.weaponId ? 0x071018 : 0x111a24;
      const strokeColor = slotSnapshot.slot === 'auto' ? 0x42f5d7 : slotSnapshot.slot === 'primary' ? 0xffc857 : 0xa8c7ff;

      this.drawDashboardButton(rect, {
        accentColor: strokeColor,
        fillColor,
        active: isOpen,
        hovered: isHovered,
        disabled: !slotSnapshot.weaponId,
        progress: slotSnapshot.cooldownProgress,
        kind: 'weapon',
        segmentIndex: slotSnapshot.slot === 'primary' ? 0 : slotSnapshot.slot === 'auto' ? 1 : 2,
        segmentCount: 3
      });

      const textConfig = this.getWeaponButtonTextConfig(slotSnapshot);
      text
        .setFixedSize(Math.max(76, rect.width - 14), 0)
        .setWordWrapWidth(Math.max(70, rect.width - 18), true)
        .setFontSize(textConfig.fontSize)
        .setColor(textConfig.color)
        .setPosition(rect.x, rect.y + textConfig.yOffset)
        .setText(textConfig.text);
      this.resizeZone(zone, rect);
    }

    this.drawEjectButton();
    this.drawMissionButton(this.latestSnapshot);
    this.drawMissionLog(this.latestSnapshot);

    this.drawPicker();
    this.updateTooltip();
  }

  private drawDashboardShell(): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const layout = this.getDashboardLayout();
    const utilityLayout = this.getUtilityDashboardLayout();
    const graphics = this.hotbarGraphics;
    const buttonRects = this.getDashboardButtonRects();

    this.drawCockpitPanel(graphics, layout.x, layout.y, layout.width, layout.height, 0x42f5d7, true, true);
    this.drawCockpitPanel(graphics, utilityLayout.x, utilityLayout.y, utilityLayout.width, utilityLayout.height, 0xffc857, true, true);

    if ([2, 6, 9, 10].includes(this.buttonVariant)) {
      const first = buttonRects.weapons.primary;
      const last = buttonRects.weapons.secondary;
      const bayX = first.x - first.width / 2 - 10;
      const bayY = Math.min(first.y - first.height / 2, last.y - last.height / 2) - 10;
      const bayWidth = last.x + last.width / 2 - bayX + 10;
      const bayHeight = Math.max(first.height, last.height) + 20;
      graphics.fillStyle(0x02040a, this.buttonVariant === 9 ? 0.7 : 0.55);
      graphics.fillRoundedRect(bayX, bayY, bayWidth, bayHeight, this.buttonVariant === 2 ? 3 : 8);
      graphics.lineStyle(1, this.buttonVariant === 8 ? 0xffc857 : 0x42f5d7, 0.32);
      graphics.strokeRoundedRect(bayX, bayY, bayWidth, bayHeight, this.buttonVariant === 2 ? 3 : 8);
      graphics.lineStyle(1, 0xff4fd8, 0.18);
      graphics.lineBetween(bayX + 12, bayY + 7, bayX + bayWidth - 12, bayY + 7);
    }

    this.getDashboardInfoPositions().forEach((position, index) => {
      const accent = index === 0 ? 0x52ff9a : 0xffc857;
      graphics.fillStyle(0x071018, 0.88);
      graphics.fillRoundedRect(position.x - layout.infoBayWidth / 2, position.y - layout.infoBayHeight / 2, layout.infoBayWidth, layout.infoBayHeight, 6);
      graphics.lineStyle(1, accent, 0.58);
      graphics.strokeRoundedRect(position.x - layout.infoBayWidth / 2, position.y - layout.infoBayHeight / 2, layout.infoBayWidth, layout.infoBayHeight, 6);
    });

    const scrapTicker = this.getScrapTickerPosition();
    graphics.lineStyle(1, 0xff4fd8, 0.44);
    graphics.lineBetween(scrapTicker.x - 52, scrapTicker.y + 12, scrapTicker.x + 52, scrapTicker.y + 12);
  }

  private drawEjectButton(): void {
    if (!this.hotbarGraphics || !this.ejectText || !this.ejectZone) {
      return;
    }

    const rect = this.getDashboardButtonRects().eject;
    const ejectWarning = (this.latestSnapshot?.hullProgress ?? 1) < 0.35;
    this.drawDashboardButton(rect, {
      accentColor: 0xff5964,
      fillColor: ejectWarning ? 0x241018 : 0x111a24,
      hovered: this.isEjectHovered,
      danger: ejectWarning,
      progress: 1,
      kind: 'eject'
    });
    this.ejectText
      .setFixedSize(Math.max(58, rect.width - 12), 0)
      .setFontSize('11px')
      .setLineSpacing(1)
      .setPosition(rect.x, rect.y)
      .setText(this.getEjectButtonLabel(this.latestSnapshot))
      .setVisible(true);
    this.resizeZone(this.ejectZone, rect);
  }

  private drawMissionButton(snapshot: GameplayHudSnapshot): void {
    if (!this.hotbarGraphics || !this.missionButtonText || !this.missionButtonZone) {
      return;
    }

    const rect = this.getDashboardButtonRects().mission;
    const missionComplete = this.isMissionCompleteStatus(snapshot.missionStatus);
    const accent = snapshot.isMissionDanger
      ? 0xff5964
      : snapshot.missionStatus === 'FAILED'
        ? 0xff5964
      : missionComplete
        ? 0x52ff9a
        : 0xffc857;
    this.drawDashboardButton(rect, {
      accentColor: accent,
      fillColor: this.buttonVariant === 8 ? 0x1f1608 : 0x071018,
      active: this.isMissionLogOpen,
      hovered: this.isMissionButtonHovered,
      danger: snapshot.isMissionDanger,
      progress: missionComplete ? 1 : 0.58,
      kind: 'mission'
    });

    this.missionButtonText
      .setFixedSize(Math.max(58, rect.width - 14), 0)
      .setWordWrapWidth(Math.max(56, rect.width - 18), true)
      .setFontSize('11px')
      .setLineSpacing(1)
      .setPosition(rect.x, rect.y)
      .setText(this.getMissionButtonLabel(snapshot))
      .setVisible(true);
    this.resizeZone(this.missionButtonZone, rect);
  }

  private drawMissionLog(snapshot: GameplayHudSnapshot): void {
    if (!this.hotbarGraphics || this.missionLogTexts.length < 6) {
      return;
    }

    this.missionLogGraphics?.clear();
    if (!this.isMissionLogOpen) {
      this.missionLogGraphics?.setVisible(false);
      this.missionLogTexts.forEach((text) => text.setVisible(false));
      this.missionLogBounds = undefined;
      return;
    }

    const dashboard = this.getDashboardLayout();
    const width = Phaser.Math.Clamp(this.scene.scale.width * 0.28, 318, 372);
    const height = 248;
    const x = this.scene.scale.width - width - HUD_MARGIN - 4;
    const y = Math.max(this.getTopHudLayout().y + this.getTopHudLayout().height + 40, dashboard.y - height - 12);
    const innerX = x + 18;
    const contentWidth = width - 36;
    const distance = this.formatMissionDistance(snapshot);
    const statusLabel = this.formatMissionStatusLabel(snapshot);
    const statusLine = this.formatContractStatusForLog(snapshot);
    const statusColor = snapshot.isMissionDanger || snapshot.missionStatus === 'FAILED'
      ? '#ff8b94'
      : this.isMissionCompleteStatus(snapshot.missionStatus)
        ? '#9dffc2'
        : '#fff0a0';

    this.missionLogBounds = new Phaser.Geom.Rectangle(x, y, width, height);
    this.missionLogGraphics?.setVisible(false);
    const rewardDividerY = y + 180;
    const rewardRowY = y + 190;
    drawCockpitCard(this.hotbarGraphics, x, y, width, height, {
      accentColor: snapshot.isMissionDanger ? 0xff5964 : 0xffc857,
      glow: true,
      dividerOffsets: [54, rewardDividerY - y]
    });

    const rows = [
      ['MISSION LOG', '#73f2ff', y + 14, '14px'],
      [`${snapshot.missionDisplayName}\n${statusLabel}`, statusColor, y + 36, '12px'],
      [`OBJECTIVE\n${snapshot.missionObjectiveLabel}\n${snapshot.missionDescription}`, '#f2fbff', y + 68, '12px'],
      [`RUN STATE\n${statusLine}\nRANGE ${distance} / RISK ${snapshot.missionDifficulty}`, '#c8f7ff', y + 132, '12px'],
      [`REWARD\n${snapshot.missionRewardPreview}`, '#fff0a0', rewardRowY, '12px'],
      ['CLICK MISSION / ESC TO CLOSE', '#8090a6', y + 224, '10px']
    ] as const;

    rows.forEach(([label, color, rowY, fontSize], index) => {
      const text = this.missionLogTexts[index];
      text
        .setPosition(innerX, rowY)
        .setColor(color)
        .setFontSize(fontSize)
        .setWordWrapWidth(contentWidth, true)
        .setText(label)
        .setVisible(true);
    });
  }

  private drawPicker(): void {
    if (!this.pickerGraphics || !this.latestSnapshot) {
      return;
    }

    for (const text of this.pickerTexts) {
      text.destroy();
    }
    for (const zone of this.pickerZones) {
      zone.destroy();
    }
    this.pickerTexts = [];
    this.pickerZones = [];
    this.pickerGraphics.clear();

    if (!this.openPickerSlot) {
      return;
    }

    const slot = this.latestSnapshot.weaponSlots.find((candidate) => candidate.slot === this.openPickerSlot);
    if (!slot || slot.choices.length <= 0) {
      return;
    }

    const base = this.getHotbarPositions()[slot.slot];
    const isAuto = slot.slot === 'auto';
    const startX = isAuto ? base.x : base.x - (slot.choices.length - 1) * 46;
    const startY = isAuto ? base.y - 86 : base.y - 68;

    slot.choices.forEach((choice, index) => {
      const x = isAuto ? startX : startX + index * 92;
      const y = isAuto ? startY - index * 58 : startY;
      this.pickerGraphics?.fillStyle(0x02040a, 0.94);
      this.pickerGraphics?.fillRoundedRect(x - 42, y - 20, 84, 40, 6);
      this.pickerGraphics?.lineStyle(1, 0x6f89b7, 0.9);
      this.pickerGraphics?.strokeRoundedRect(x - 42, y - 20, 84, 40, 6);

      const text = this.scene.add
        .text(x, y, choice.name, {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '10px',
          color: '#f2fbff',
          align: 'center',
          fixedWidth: 76,
          wordWrap: { width: 76 }
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1004);
      const zone = this.scene.add.zone(x, y, 84, 40).setScrollFactor(0).setDepth(1008).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.callbacks.assignWeaponSlot(slot.slot, choice.weaponId);
        this.openPickerSlot = null;
      });
      this.pickerTexts.push(text);
      this.pickerZones.push(zone);
    });
  }

  private updateTooltip(): void {
    if (!this.tooltipGraphics || !this.tooltipText || !this.latestSnapshot || !this.hoveredSlot) {
      this.tooltipGraphics?.setVisible(false);
      this.tooltipText?.setVisible(false);
      return;
    }

    const slot = this.latestSnapshot.weaponSlots.find((candidate) => candidate.slot === this.hoveredSlot);
    if (!slot) {
      this.tooltipGraphics.setVisible(false);
      this.tooltipText.setVisible(false);
      return;
    }

    const text = [`${slot.title}`, slot.subtitle, '', ...slot.tooltipLines].join('\n');
    const position = this.getHotbarPositions()[slot.slot];
    const width = 320;
    this.tooltipText.setText(text).setWordWrapWidth(width - 20, true);
    const height = Math.min(360, this.tooltipText.height + 18);
    const x = Phaser.Math.Clamp(position.x - width / 2, 12, this.scene.scale.width - width - 12);
    const y = Phaser.Math.Clamp(position.y - height - 40, 12, this.scene.scale.height - height - 12);

    this.tooltipGraphics.clear();
    this.tooltipGraphics.fillStyle(0x02040a, 0.98);
    this.tooltipGraphics.fillRoundedRect(x, y, width, height, 6);
    this.tooltipGraphics.lineStyle(1, 0x42f5d7, 0.9);
    this.tooltipGraphics.strokeRoundedRect(x, y, width, height, 6);
    this.tooltipGraphics.setVisible(true);
    this.tooltipText.setPosition(x + 10, y + 9).setVisible(true);
  }

  closeMissionLog(): boolean {
    if (!this.isMissionLogOpen) {
      return false;
    }

    this.isMissionLogOpen = false;
    this.drawHotbar();
    return true;
  }

  openMissionLog(): void {
    this.isMissionLogOpen = true;
    this.openPickerSlot = null;
    this.drawHotbar();
  }

  containsPointer(pointer: Phaser.Input.Pointer): boolean {
    const zones = [
      this.missionButtonZone,
      this.ejectZone,
      ...Object.values(this.hotbarZones),
      ...this.pickerZones
    ].filter((zone): zone is Phaser.GameObjects.Zone => Boolean(zone?.visible && zone.active));

    if (zones.some((zone) => {
      const bounds = zone.getBounds();
      return Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y);
    })) {
      return true;
    }

    return Boolean(this.missionLogBounds && Phaser.Geom.Rectangle.Contains(this.missionLogBounds, pointer.x, pointer.y));
  }

  private toggleMissionLog(): void {
    this.isMissionLogOpen = !this.isMissionLogOpen;
    this.openPickerSlot = null;
    this.drawHotbar();
  }

  private isMissionCompleteStatus(status: string): boolean {
    return status === 'DONE' || status === 'COMPLETE';
  }

  private getEjectButtonLabel(snapshot?: GameplayHudSnapshot): string {
    return (snapshot?.runScrapTotal ?? 0) > 0 ? 'EJECT\nBANK' : 'EJECT\nEND';
  }

  private getMissionButtonLabel(snapshot: GameplayHudSnapshot): string {
    if (snapshot.missionObjectiveRadius <= 0) {
      return 'FREE\nRANGE';
    }

    if (snapshot.missionStatus === 'FAILED') {
      return 'FAILED\nLOG';
    }

    if (this.isMissionCompleteStatus(snapshot.missionStatus)) {
      return 'DONE\nLOG';
    }

    if (snapshot.isMissionDanger) {
      return 'DANGER\nLOG';
    }

    return `MISSION\n${this.formatMissionDistance(snapshot)}`;
  }

  private formatMissionStatusLabel(snapshot: GameplayHudSnapshot): string {
    if (snapshot.missionObjectiveRadius <= 0) {
      return 'FREE RANGE';
    }

    if (snapshot.missionStatus === 'FAILED') {
      return 'OBJECTIVE FAILED';
    }

    if (this.isMissionCompleteStatus(snapshot.missionStatus)) {
      return 'OBJECTIVE COMPLETE';
    }

    if (snapshot.isMissionDanger) {
      return 'OBJECTIVE DANGER';
    }

    if (snapshot.missionStatus === 'ACTIVE') {
      return 'OBJECTIVE ACTIVE';
    }

    return 'OBJECTIVE READY';
  }

  private formatContractStatusForLog(snapshot: GameplayHudSnapshot): string {
    const statusLine = snapshot.contractStatusLine.replace(/^Contract\s+/, '').trim();

    if (statusLine.length > 0 && statusLine !== 'None') {
      return statusLine;
    }

    return snapshot.missionObjectiveRadius <= 0 ? 'Free Range open - eject when ready' : 'No contract launched';
  }

  private formatMissionDistance(snapshot: GameplayHudSnapshot): string {
    if (snapshot.missionObjectiveRadius <= 0) {
      return 'OPEN SECTOR';
    }

    const distance = Math.max(0, Math.round(snapshot.missionObjectiveDistance - snapshot.missionObjectiveRadius));
    return `${distance}m`;
  }

  private getHudButtonVariantFromQuery(): HudButtonVariant {
    if (typeof window === 'undefined') {
      return DEFAULT_HUD_BUTTON_VARIANT;
    }

    const query = new URLSearchParams(window.location.search);
    if (query.get('devHudVariants') !== '1' && query.get('debugHudVariants') !== '1') {
      return DEFAULT_HUD_BUTTON_VARIANT;
    }

    const requested = Number(query.get('hudButtonVariant'));
    return clampHudButtonVariant(requested);
  }

  setHudButtonVariant(variant: HudButtonVariant): void {
    this.buttonVariant = variant;
    this.drawHotbar();
  }

  getHudButtonVariant(): HudButtonVariant {
    return this.buttonVariant;
  }

  private getDashboardButtonRects(): DashboardButtonRects {
    const layout = this.getDashboardLayout();
    const utilityLayout = this.getUtilityDashboardLayout();
    const rowY = layout.y + layout.height - 35;
    const utilityWidth = this.scene.scale.width < 900 ? 68 : 78;
    const utilityHeight = 42;
    const utilityGap = 8;
    const ejectX = utilityLayout.x + utilityLayout.width / 2 + utilityWidth / 2 + utilityGap / 2;
    const missionX = ejectX - utilityWidth - utilityGap;
    const weaponsLeft = layout.x + 28;
    const weaponsRight = layout.x + layout.width - 28;
    const weaponGap = this.scene.scale.width < 900 ? 8 : 14;
    const targetWeaponWidth = this.scene.scale.width < 900 ? 146 : 190;
    const availableWeaponWidth = Math.max(76, (weaponsRight - weaponsLeft - weaponGap * 2) / 3);
    const weaponWidth = Phaser.Math.Clamp(Math.min(targetWeaponWidth, availableWeaponWidth), 76, targetWeaponWidth);
    const weaponHeight = 44;
    const weaponCenter = (weaponsLeft + weaponsRight) / 2;
    const weaponStep = weaponWidth + weaponGap;

    return {
      weapons: {
        primary: { x: weaponCenter - weaponStep, y: rowY, width: weaponWidth, height: weaponHeight },
        auto: { x: weaponCenter, y: rowY, width: weaponWidth, height: weaponHeight },
        secondary: { x: weaponCenter + weaponStep, y: rowY, width: weaponWidth, height: weaponHeight }
      },
      mission: { x: missionX, y: utilityLayout.y + 82, width: utilityWidth, height: utilityHeight },
      eject: { x: ejectX, y: utilityLayout.y + 82, width: utilityWidth, height: utilityHeight }
    };
  }

  private getWeaponButtonTextConfig(slot: WeaponHotbarSlotSnapshot): {
    text: string;
    fontSize: string;
    yOffset: number;
    color: string;
  } {
    const text = slot.weaponId ? this.compactLabel(slot.title, 18) : 'EMPTY';

    return {
      text,
      fontSize: text.length > 15 ? '11px' : '12px',
      yOffset: 0,
      color: slot.weaponId ? '#f2fbff' : '#c8d3e5'
    };
  }

  private compactLabel(label: string, maxLength: number): string {
    const clean = label.replace(/\s+/g, ' ').trim().toUpperCase();
    return clean.length > maxLength ? `${clean.slice(0, Math.max(1, maxLength - 1))}.` : clean;
  }

  private drawDashboardButton(rect: HudControlRect, chrome: DashboardButtonChrome): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const graphics = this.hotbarGraphics;
    const x = rect.x - rect.width / 2;
    const y = rect.y - rect.height / 2;
    const accent = chrome.accentColor;
    const active = Boolean(chrome.active);
    const hovered = Boolean(chrome.hovered && !chrome.disabled);
    const highlighted = active || hovered;
    const dangerPulse = chrome.danger ? this.getSlowPulse(0.18) : 0;
    const hoverPulse = hovered ? 0.08 : 0;
    const alpha = chrome.disabled ? 0.58 : hovered ? 0.98 : 0.92;
    const fill = chrome.fillColor ?? 0x071018;
    const radius = this.getButtonCornerRadius(chrome.kind);
    const raisedSwitchChrome = this.usesRaisedSwitchChrome();
    const strokeWidth = active || chrome.danger ? 3 : raisedSwitchChrome ? 2.25 : this.buttonVariant === 1 ? 2.5 : 2;
    const softGlowAlpha = (hovered ? 0.07 : 0) + (active ? 0.06 : 0) + (chrome.danger ? 0.06 + dangerPulse * 0.35 : 0);
    const usesOuterStroke = this.buttonVariant !== 1 && (raisedSwitchChrome || this.buttonVariant === 10 || active || chrome.danger);

    if (softGlowAlpha > 0) {
      graphics.fillStyle(accent, softGlowAlpha);
      graphics.fillRoundedRect(x - 5, y - 5, rect.width + 10, rect.height + 10, radius + 5);
      graphics.fillStyle(accent, Math.max(0.03, softGlowAlpha * 0.55));
      graphics.fillRoundedRect(x - 9, y - 8, rect.width + 18, rect.height + 16, radius + 8);
    }

    if (usesOuterStroke) {
      graphics.lineStyle(7, accent, active || chrome.danger ? 0.12 + dangerPulse : 0.07);
      graphics.strokeRoundedRect(x - 2, y - 2, rect.width + 4, rect.height + 4, radius + 2);
    }

    if (raisedSwitchChrome) {
      graphics.fillStyle(0x02040a, 0.72);
      graphics.fillRoundedRect(x + 3, y + 4, rect.width, rect.height, radius);
      graphics.fillStyle(chrome.danger ? 0x2a1117 : 0x1b2634, alpha);
      graphics.fillRoundedRect(x, y, rect.width, rect.height, radius);
      graphics.fillStyle(0xf2fbff, highlighted ? 0.16 : 0.08);
      graphics.fillRoundedRect(x + 4, y + 4, rect.width - 8, Math.max(8, rect.height * 0.28), radius);
      graphics.fillStyle(fill, chrome.danger ? 0.22 : 0.16);
      graphics.fillRoundedRect(x + 6, y + 10, rect.width - 12, rect.height - 18, Math.max(2, radius - 2));
    } else {
      graphics.fillStyle(fill, alpha);
      graphics.fillRoundedRect(x, y, rect.width, rect.height, radius);
    }

    this.drawButtonVariantDetails(rect, chrome);

    graphics.lineStyle(strokeWidth, accent, highlighted || chrome.danger ? 0.92 + hoverPulse + dangerPulse : 0.68);
    graphics.strokeRoundedRect(x, y, rect.width, rect.height, radius);
    graphics.lineStyle(1, 0xf2fbff, highlighted ? 0.24 : 0.13);
    graphics.strokeRoundedRect(x + 5, y + 5, rect.width - 10, rect.height - 10, Math.max(1, radius - 2));

    const progress = Phaser.Math.Clamp(chrome.progress ?? 1, 0, 1);
    const meterHeight = this.buttonVariant === 9 ? 6 : raisedSwitchChrome ? 5 : 4;
    const meterInset = this.buttonVariant === 2 ? 0 : 10;
    const meterY = y + rect.height - meterHeight - (this.buttonVariant === 2 ? 0 : 6);
    graphics.fillStyle(0x02040a, 0.72);
    graphics.fillRect(x + meterInset, meterY, rect.width - meterInset * 2, meterHeight);
    graphics.fillStyle(accent, chrome.disabled ? 0.36 : highlighted ? 0.9 : 0.68);
    graphics.fillRect(x + meterInset, meterY, (rect.width - meterInset * 2) * progress, meterHeight);

    if (this.buttonVariant === 1 || this.buttonVariant === 10) {
      graphics.fillStyle(0xc89452, 0.78);
      graphics.fillCircle(x + 7, y + 7, 1.5);
      graphics.fillCircle(x + rect.width - 7, y + 7, 1.5);
      graphics.fillCircle(x + 7, y + rect.height - 7, 1.5);
      graphics.fillCircle(x + rect.width - 7, y + rect.height - 7, 1.5);
    }
  }

  private drawButtonVariantDetails(rect: HudControlRect, chrome: DashboardButtonChrome): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const graphics = this.hotbarGraphics;
    const x = rect.x - rect.width / 2;
    const y = rect.y - rect.height / 2;
    const accent = chrome.accentColor;

    if (this.usesRaisedSwitchChrome()) {
      graphics.fillStyle(0xc89452, chrome.disabled ? 0.22 : 0.48);
      graphics.fillRect(x + 8, y + 7, rect.width - 16, 2);
      graphics.lineStyle(1, 0x02040a, 0.5);
      graphics.lineBetween(x + 7, y + rect.height - 9, x + rect.width - 7, y + rect.height - 9);
      graphics.fillStyle(accent, chrome.disabled ? 0.18 : chrome.hovered || chrome.active ? 0.3 : 0.2);
      graphics.fillRect(x + 10, y + rect.height - 15, rect.width - 20, 3);
      graphics.fillStyle(0xf2fbff, chrome.hovered || chrome.active ? 0.18 : 0.09);
      graphics.fillCircle(x + 9, y + 9, 1.35);
      graphics.fillCircle(x + rect.width - 9, y + 9, 1.35);
      return;
    }

    switch (this.buttonVariant) {
      case 1:
        graphics.fillStyle(0xc89452, 0.16);
        graphics.fillRect(x + 5, y + 5, rect.width - 10, 7);
        graphics.lineStyle(1, 0xc89452, 0.42);
        graphics.lineBetween(x + 10, y + rect.height - 13, x + rect.width - 10, y + rect.height - 13);
        break;
      case 2:
        graphics.fillStyle(accent, 0.16);
        graphics.fillRect(x, y, rect.width, 8);
        graphics.lineStyle(1, 0xc89452, 0.34);
        graphics.lineBetween(x + 1, y + rect.height - 1, x + rect.width - 1, y + rect.height - 1);
        break;
      case 3:
        graphics.fillStyle(accent, 0.2);
        graphics.fillCircle(x + 18, y + 17, 11);
        graphics.lineStyle(1, accent, 0.46);
        graphics.strokeCircle(x + 18, y + 17, 11);
        break;
      case 4:
        graphics.lineStyle(1, 0x02040a, 0.42);
        graphics.lineBetween(x + 6, y + rect.height - 8, x + rect.width - 6, y + rect.height - 8);
        break;
      case 5:
        graphics.fillStyle(accent, 0.82);
        graphics.fillRect(x, y + 6, 4, rect.height - 12);
        graphics.fillStyle(0xff4fd8, 0.18);
        graphics.fillRect(x + rect.width - 5, y + 8, 3, rect.height - 16);
        break;
      case 6:
        if (typeof chrome.segmentIndex === 'number' && typeof chrome.segmentCount === 'number') {
          if (chrome.segmentIndex > 0) {
            graphics.lineStyle(1, 0x02040a, 0.7);
            graphics.lineBetween(x, y + 6, x, y + rect.height - 6);
          }
          if (chrome.segmentIndex < chrome.segmentCount - 1) {
            graphics.lineStyle(1, 0x52627f, 0.36);
            graphics.lineBetween(x + rect.width, y + 6, x + rect.width, y + rect.height - 6);
          }
        }
        graphics.fillStyle(accent, 0.18);
        graphics.fillRect(x + 8, y + 7, rect.width - 16, 4);
        break;
      case 7:
        graphics.fillStyle(accent, 0.18);
        graphics.fillRoundedRect(x + 6, y + 6, rect.width - 12, rect.height - 12, 4);
        break;
      case 8:
        if (chrome.kind === 'mission') {
          graphics.fillStyle(0xffc857, 0.22);
          graphics.fillRect(x + 10, y + 8, rect.width - 20, 8);
          graphics.lineStyle(1, 0xffc857, 0.42);
          graphics.lineBetween(x + 16, y + 23, x + rect.width - 16, y + 23);
        } else {
          graphics.fillStyle(accent, 0.14);
          graphics.fillRect(x + 7, y + 7, rect.width - 14, 5);
        }
        break;
      case 9:
        graphics.fillStyle(0x02040a, 0.42);
        graphics.fillRect(x + 6, y + 6, rect.width - 12, rect.height - 12);
        graphics.lineStyle(1, accent, 0.26);
        for (let index = 1; index < 4; index += 1) {
          const tickX = x + (rect.width * index) / 4;
          graphics.lineBetween(tickX, y + rect.height - 14, tickX, y + rect.height - 8);
        }
        break;
      case 10:
        graphics.fillStyle(accent, 0.16);
        graphics.fillRect(x + 8, y + 6, rect.width - 16, 5);
        graphics.fillStyle(0xff4fd8, chrome.kind === 'eject' ? 0.08 : 0.16);
        graphics.fillRect(x + rect.width - 7, y + 9, 3, rect.height - 18);
        graphics.lineStyle(1, 0xc89452, 0.38);
        graphics.lineBetween(x + 10, y + rect.height - 12, x + rect.width - 10, y + rect.height - 12);
        break;
      default:
        break;
    }
  }

  private getButtonCornerRadius(kind: DashboardButtonChrome['kind']): number {
    if (this.usesRaisedSwitchChrome()) {
      return 5;
    }

    if (this.buttonVariant === 1 || this.buttonVariant === 2 || this.buttonVariant === 9) {
      return 3;
    }

    if (this.buttonVariant === 4) {
      return 5;
    }

    if (kind === 'eject') {
      return 6;
    }

    return 7;
  }

  private usesRaisedSwitchChrome(): boolean {
    return true;
  }

  private resizeZone(zone: Phaser.GameObjects.Zone, rect: HudControlRect): void {
    zone.setPosition(rect.x, rect.y).setSize(rect.width, rect.height).setVisible(true);
  }

  private getHotbarPositions(): Record<WeaponHotbarSlotType, { x: number; y: number }> {
    const buttons = this.getDashboardButtonRects();

    return {
      primary: { x: buttons.weapons.primary.x, y: buttons.weapons.primary.y },
      auto: { x: buttons.weapons.auto.x, y: buttons.weapons.auto.y },
      secondary: { x: buttons.weapons.secondary.x, y: buttons.weapons.secondary.y }
    };
  }

  private getDashboardInfoPositions(): Array<{ x: number; y: number }> {
    const layout = this.getDashboardLayout();
    const y = layout.y + 34;
    const totalWidth = layout.infoBayWidth * 2 + layout.infoBayGap;
    const leftStart = layout.x + layout.width / 2 - totalWidth / 2 + layout.infoBayWidth / 2;
    const step = layout.infoBayWidth + layout.infoBayGap;

    return [
      { x: leftStart, y },
      { x: leftStart + step, y }
    ];
  }

  private getScrapTickerPosition(): { x: number; y: number } {
    const layout = this.getUtilityDashboardLayout();

    return {
      x: layout.x + layout.width / 2,
      y: layout.y + 32
    };
  }

  private getTopHudLayout(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const x = HUD_MARGIN + 8;
    const height = 78;
    const width = Math.max(420, this.scene.scale.width - x * 2);

    return {
      x,
      y: HUD_MARGIN + 2,
      width,
      height
    };
  }

  private getDashboardLayout(): {
    x: number;
    y: number;
    width: number;
    height: number;
    infoBayWidth: number;
    infoBayHeight: number;
    infoBayGap: number;
  } {
    const width = Math.min(this.scene.scale.width < 900 ? 520 : 660, Math.max(430, this.scene.scale.width - 28));
    const height = 126;
    const x = this.scene.scale.width / 2 - width / 2;
    const y = this.scene.scale.height - height - 14;
    const infoBayGap = 14;
    const infoBayWidth = Math.max(150, (width - 64 - infoBayGap) / 2);
    const infoBayHeight = 44;

    return { x, y, width, height, infoBayWidth, infoBayHeight, infoBayGap };
  }

  private getUtilityDashboardLayout(): { x: number; y: number; width: number; height: number } {
    const mainLayout = this.getDashboardLayout();
    const width = this.scene.scale.width < 900 ? 176 : 196;
    const height = 118;
    const preferredX = mainLayout.x + mainLayout.width + 16;
    const x = Math.min(this.scene.scale.width - width - 14, preferredX);
    const y = mainLayout.y + mainLayout.height - height;

    return { x, y, width, height };
  }

  private drawCockpitPanel(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    accentColor: number,
    glow = false,
    compact = false,
    showInnerTrim = true
  ): void {
    if (glow) {
      graphics.lineStyle(5, accentColor, 0.1);
      graphics.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, 8);
      graphics.lineStyle(3, accentColor, 0.16);
      graphics.strokeRoundedRect(x + 2, y + 2, width - 4, height - 4, 6);
    }
    graphics.fillStyle(0x02040a, 0.82);
    graphics.fillRoundedRect(x, y, width, height, 7);
    graphics.fillStyle(0x111a24, 0.88);
    graphics.fillRoundedRect(x + 4, y + 4, width - 8, height - 8, 5);
    graphics.lineStyle(2, 0x2a3444, 0.9);
    graphics.strokeRoundedRect(x, y, width, height, 7);
    if (showInnerTrim) {
      graphics.lineStyle(1, 0xc89452, 0.58);
      graphics.strokeRoundedRect(x + 5, y + 5, width - 10, height - 10, 5);
    }
    if (!compact) {
      graphics.lineStyle(1, accentColor, 0.68);
      graphics.lineBetween(x + 14, y + height - 8, x + width - 14, y + height - 8);
      graphics.lineStyle(1, 0xff4fd8, glow ? 0.28 : 0.16);
      graphics.lineBetween(x + 18, y + 9, x + Math.min(x + width - 18, x + 180), y + 9);
    }
    graphics.fillStyle(0xc89452, 0.72);
    graphics.fillCircle(x + 11, y + 11, 1.8);
    graphics.fillCircle(x + width - 11, y + 11, 1.8);
    graphics.fillCircle(x + 11, y + height - 11, 1.8);
    graphics.fillCircle(x + width - 11, y + height - 11, 1.8);
  }

  private drawInfoBayMeter(
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    color: number,
    isWarning: boolean
  ): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const inset = 6;
    const innerX = x + inset;
    const innerY = y + inset;
    const innerWidth = width - inset * 2;
    const innerHeight = height - inset * 2;
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    const fillWidth = innerWidth * clampedProgress;
    const pulse = isWarning ? this.getSlowPulse(0.14) : 0;

    this.hotbarGraphics.fillStyle(0x02040a, 0.62);
    this.hotbarGraphics.fillRoundedRect(innerX, innerY, innerWidth, innerHeight, 4);
    this.hotbarGraphics.fillStyle(color, 0.1 + pulse * 0.35);
    this.hotbarGraphics.fillRoundedRect(innerX, innerY, innerWidth, innerHeight, 4);

    if (fillWidth > 0) {
      this.hotbarGraphics.fillStyle(color, isWarning ? 0.62 + pulse : 0.48);
      this.hotbarGraphics.fillRoundedRect(innerX, innerY, fillWidth, innerHeight, Math.min(4, fillWidth / 2));
      this.hotbarGraphics.fillStyle(0xf2fbff, isWarning ? 0.16 : 0.12);
      this.hotbarGraphics.fillRect(innerX, innerY, fillWidth, Math.max(4, innerHeight * 0.18));
    }

    this.hotbarGraphics.lineStyle(1, color, isWarning ? 0.46 + pulse : 0.3);
    this.hotbarGraphics.strokeRoundedRect(innerX, innerY, innerWidth, innerHeight, 4);
    this.hotbarGraphics.lineStyle(1, 0x02040a, 0.32);
    for (let index = 1; index < 4; index += 1) {
      const tickX = innerX + (innerWidth * index) / 4;
      this.hotbarGraphics.lineBetween(tickX, innerY + 4, tickX, innerY + innerHeight - 4);
    }
  }

  private drawShieldRail(x: number, y: number, width: number, height: number, progress: number): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const railX = x + 14;
    const railY = y + height - 10;
    const railWidth = width - 28;
    const railHeight = 3;

    this.hotbarGraphics.fillStyle(0x02040a, 0.72);
    this.hotbarGraphics.fillRect(railX, railY, railWidth, railHeight);
    this.hotbarGraphics.fillStyle(0x42f5d7, 0.86);
    this.hotbarGraphics.fillRect(railX, railY, railWidth * progress, railHeight);
  }

  private getSlowPulse(amount: number): number {
    return ((Math.sin(this.scene.time.now / 520) + 1) / 2) * amount;
  }

  private formatSurvivalTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
