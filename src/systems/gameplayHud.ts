import Phaser from 'phaser';
import { HUD_MARGIN } from '../scenes/gameConstants';
import type { WeaponId, WeaponSlotType } from '../data/weapons';

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
  statusIconTextureKey?: string;
}

export class GameplayHudSystem {
  private readonly scene: Phaser.Scene;
  private readonly callbacks: GameplayHudCallbacks;
  private readonly options: GameplayHudOptions;
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
  private statusIcon?: Phaser.GameObjects.Image;
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
    this.options = options;
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
        .setShadow(0, 0, '#42f5d7', 2, false, true);
      this.dashboardTexts.push(text);
    }
    if (this.options.statusIconTextureKey && this.scene.textures.exists(this.options.statusIconTextureKey)) {
      this.statusIcon = this.scene.add
        .image(0, 0, this.options.statusIconTextureKey)
        .setDisplaySize(28, 28)
        .setScrollFactor(0)
        .setDepth(1001);
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
          fixedWidth: 108
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1004)
        .setShadow(0, 0, '#42f5d7', 2, false, true);
      const zone = this.scene.add.zone(0, 0, 112, 58).setScrollFactor(0).setDepth(1007).setInteractive({ useHandCursor: true });

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
      .setShadow(0, 0, '#ffc857', 2, false, true);

    this.missionButtonZone = this.scene.add
      .zone(0, 0, 132, 62)
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
        fixedWidth: 74
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004)
      .setShadow(0, 0, '#ff5964', 2, false, true);

    this.ejectZone = this.scene.add
      .zone(0, 0, 78, 44)
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
    this.statusIcon
      ?.setPosition(topLayout.x + topLayout.width - 20, topLayout.y + 40)
      .setVisible(true);
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
    if (this.dashboardTexts.length < 4) {
      return;
    }

    const shieldLine = snapshot.hasRammingShield
      ? `SHD ${Math.ceil(snapshot.rammingShieldHp)}/${Math.round(snapshot.rammingShieldMaxHp)} D${snapshot.rammingShieldDashCharges}/${snapshot.rammingShieldDashMaxCharges}`
      : snapshot.status;
    const upgradeLine = snapshot.bankedUpgrades > 0 ? `BANK ${snapshot.bankedUpgrades} READY` : `REROLL ${snapshot.nextRerollCost}`;
    const positions = this.getDashboardInfoPositions();

    const lines = [
      `HULL ${Math.round(snapshot.playerHull)}/${Math.round(snapshot.maxHull)}\n${shieldLine}`,
      `FUEL ${Math.ceil(snapshot.fuel)}/${snapshot.maxFuel}\n${snapshot.isFuelEmergency ? 'EMERGENCY' : 'THRUST READY'}`,
      `SCRAP ${snapshot.runScrapTotal}\n${upgradeLine}`,
      `RAD L${snapshot.radarLevel} ${snapshot.radarStatus}\nSCN ${snapshot.sectorScannerStatus}`
    ];

    this.dashboardTexts.forEach((text, index) => {
      text
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
    const meterWidth = layout.infoBayWidth - 24;
    this.drawMiniMeter(
      positions[0].x - meterWidth / 2,
      positions[0].y + 27,
      Phaser.Math.Clamp(snapshot.hullProgress, 0, 1),
      snapshot.isHullCritical ? 0xff5964 : 0x52ff9a,
      meterWidth
    );
    this.drawMiniMeter(
      positions[1].x - meterWidth / 2,
      positions[1].y + 27,
      Phaser.Math.Clamp(snapshot.fuelProgress, 0, 1),
      snapshot.isFuelEmergency ? 0xff5964 : 0xffc857,
      meterWidth
    );
    if (snapshot.hasRammingShield) {
      const shieldProgress = snapshot.rammingShieldMaxHp > 0 ? snapshot.rammingShieldHp / snapshot.rammingShieldMaxHp : 0;
      this.drawMiniMeter(positions[0].x - meterWidth / 2, positions[0].y + 34, Phaser.Math.Clamp(shieldProgress, 0, 1), 0x42f5d7, meterWidth);
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
    const positions = this.getHotbarPositions();

    this.hotbarGraphics.clear();
    this.drawDashboardShell();
    this.drawDashboardMeters(this.latestSnapshot);

    for (const slotSnapshot of slots) {
      const position = positions[slotSnapshot.slot];
      const text = this.hotbarTexts[slotSnapshot.slot];
      const zone = this.hotbarZones[slotSnapshot.slot];
      if (!text || !zone) {
        continue;
      }

      const isOpen = this.openPickerSlot === slotSnapshot.slot;
      const isHovered = this.hoveredSlot === slotSnapshot.slot;
      const fillColor = slotSnapshot.weaponId ? 0x071018 : 0x111a24;
      const strokeColor = slotSnapshot.slot === 'auto' ? 0x42f5d7 : slotSnapshot.slot === 'primary' ? 0xffc857 : 0xa8c7ff;

      this.hotbarGraphics.fillStyle(fillColor, 0.9);
      this.hotbarGraphics.fillRoundedRect(position.x - 56, position.y - 29, 112, 58, 7);
      this.hotbarGraphics.lineStyle(isOpen || isHovered ? 3 : 2, strokeColor, isOpen || isHovered ? 1 : 0.78);
      this.hotbarGraphics.strokeRoundedRect(position.x - 56, position.y - 29, 112, 58, 7);
      if (isOpen || isHovered) {
        this.hotbarGraphics.lineStyle(1, 0xf2fbff, 0.32);
        this.hotbarGraphics.strokeRoundedRect(position.x - 50, position.y - 23, 100, 46, 5);
      }
      this.hotbarGraphics.fillStyle(strokeColor, 0.7);
      this.hotbarGraphics.fillRect(position.x - 52, position.y + 24, 104 * Phaser.Math.Clamp(slotSnapshot.cooldownProgress, 0, 1), 3);

      text.setPosition(position.x, position.y).setText(`${slotSnapshot.controlLabel}\n${slotSnapshot.title}`);
      zone.setPosition(position.x, position.y);
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
    const graphics = this.hotbarGraphics;

    this.drawCockpitPanel(graphics, layout.x, layout.y, layout.width, layout.height, 0x42f5d7, true);
    graphics.lineStyle(1, 0xffc857, 0.28);
    graphics.lineBetween(layout.x + 20, layout.y + 72, layout.x + layout.width - 20, layout.y + 72);

    this.getDashboardInfoPositions().forEach((position, index) => {
      const accent = index === 0 ? 0x52ff9a : index === 1 ? 0xffc857 : index === 2 ? 0xff4fd8 : 0x42f5d7;
      graphics.fillStyle(0x071018, 0.88);
      graphics.fillRoundedRect(position.x - layout.infoBayWidth / 2, position.y - 31, layout.infoBayWidth, 62, 6);
      graphics.lineStyle(1, accent, 0.58);
      graphics.strokeRoundedRect(position.x - layout.infoBayWidth / 2, position.y - 31, layout.infoBayWidth, 62, 6);
      graphics.lineStyle(1, 0xc89452, 0.28);
      graphics.lineBetween(position.x - layout.infoBayWidth / 2 + 9, position.y + 25, position.x + layout.infoBayWidth / 2 - 9, position.y + 25);
    });

    graphics.lineStyle(1, 0xc89452, 0.28);
    graphics.lineBetween(layout.x + layout.width * 0.37, layout.y + 82, layout.x + layout.width * 0.37, layout.y + layout.height - 14);
    graphics.lineBetween(layout.x + layout.width * 0.74, layout.y + 82, layout.x + layout.width * 0.74, layout.y + layout.height - 14);
  }

  private drawEjectButton(): void {
    if (!this.hotbarGraphics || !this.ejectText || !this.ejectZone) {
      return;
    }

    const layout = this.getDashboardLayout();
    const x = layout.x + layout.width - 78;
    const y = layout.y + layout.height - 42;
    const pulse = this.isEjectHovered ? 0.16 : 0;

    this.hotbarGraphics.fillStyle(0x241018, 0.96);
    this.hotbarGraphics.fillRoundedRect(x - 39, y - 22, 78, 44, 7);
    this.hotbarGraphics.lineStyle(this.isEjectHovered ? 3 : 2, 0xff5964, 0.9 + pulse);
    this.hotbarGraphics.strokeRoundedRect(x - 39, y - 22, 78, 44, 7);
    this.hotbarGraphics.fillStyle(0xff5964, this.isEjectHovered ? 0.42 : 0.28);
    this.hotbarGraphics.fillRect(x - 29, y + 15, 58, 3);
    this.ejectText.setPosition(x, y).setVisible(true);
    this.ejectZone.setPosition(x, y).setVisible(true);
  }

  private drawMissionButton(snapshot: GameplayHudSnapshot): void {
    if (!this.hotbarGraphics || !this.missionButtonText || !this.missionButtonZone) {
      return;
    }

    const layout = this.getDashboardLayout();
    const distance = this.formatMissionDistance(snapshot);
    const x = layout.x + layout.width - 170;
    const y = layout.y + 44;
    const accent = snapshot.isMissionDanger
      ? 0xff5964
      : snapshot.missionStatus === 'FAILED'
        ? 0xff5964
      : snapshot.missionStatus === 'DONE' || snapshot.missionStatus === 'COMPLETE'
        ? 0x52ff9a
        : 0xffc857;
    const glow = this.isMissionButtonHovered || this.isMissionLogOpen || snapshot.isMissionDanger;
    const pulse = snapshot.isMissionDanger ? this.getSlowPulse(0.18) : 0;

    this.hotbarGraphics.fillStyle(0x071018, 0.94);
    this.hotbarGraphics.fillRoundedRect(x - 66, y - 31, 132, 62, 7);
    this.hotbarGraphics.lineStyle(glow ? 3 : 2, accent, glow ? 0.88 + pulse : 0.72);
    this.hotbarGraphics.strokeRoundedRect(x - 66, y - 31, 132, 62, 7);
    this.hotbarGraphics.lineStyle(1, 0xf2fbff, glow ? 0.28 : 0.16);
    this.hotbarGraphics.strokeRoundedRect(x - 60, y - 25, 120, 50, 5);
    this.hotbarGraphics.fillStyle(accent, glow ? 0.34 + pulse : 0.24);
    this.hotbarGraphics.fillRect(x - 52, y + 24, 104, 3);

    this.missionButtonText
      .setPosition(x, y - 1)
      .setText(`MISSION\n${snapshot.missionName} ${snapshot.missionStatus}\n${distance}`)
      .setVisible(true);
    this.missionButtonZone.setPosition(x, y).setVisible(true);
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
    const statusColor = snapshot.isMissionDanger || snapshot.missionStatus === 'FAILED'
      ? '#ff8b94'
      : snapshot.missionStatus === 'DONE'
        ? '#9dffc2'
        : '#fff0a0';

    this.missionLogBounds = new Phaser.Geom.Rectangle(x, y, width, height);
    this.missionLogGraphics?.setVisible(false);
    this.drawCockpitPanel(this.hotbarGraphics, x, y, width, height, snapshot.isMissionDanger ? 0xff5964 : 0xffc857, true);
    this.hotbarGraphics.lineStyle(1, 0x42f5d7, 0.32);
    this.hotbarGraphics.lineBetween(x + 18, y + 54, x + width - 18, y + 54);
    this.hotbarGraphics.lineBetween(x + 18, y + 168, x + width - 18, y + 168);

    const rows = [
      ['MISSION LOG', '#73f2ff', y + 14, '14px'],
      [`${snapshot.missionDisplayName}  ${snapshot.missionStatus}`, statusColor, y + 38, '12px'],
      [`OBJECTIVE\n${snapshot.missionObjectiveLabel}\n${snapshot.missionDescription}`, '#f2fbff', y + 68, '12px'],
      [`STATUS ${snapshot.contractStatusLine.replace(/^Contract /, '')}\nRANGE ${distance}\nDIFFICULTY ${snapshot.missionDifficulty}`, '#c8f7ff', y + 132, '12px'],
      [`REWARD\n${snapshot.missionRewardPreview}`, '#fff0a0', y + 178, '12px'],
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

  private formatMissionDistance(snapshot: GameplayHudSnapshot): string {
    if (snapshot.missionObjectiveRadius <= 0) {
      return 'OPEN SECTOR';
    }

    const distance = Math.max(0, Math.round(snapshot.missionObjectiveDistance - snapshot.missionObjectiveRadius));
    return `${distance}m`;
  }

  private getHotbarPositions(): Record<WeaponHotbarSlotType, { x: number; y: number }> {
    const centerX = this.scene.scale.width / 2;
    const layout = this.getDashboardLayout();
    const baseY = layout.y + layout.height - 42;

    return {
      primary: { x: centerX - 136, y: baseY },
      auto: { x: centerX, y: baseY },
      secondary: { x: centerX + 136, y: baseY }
    };
  }

  private getDashboardInfoPositions(): Array<{ x: number; y: number }> {
    const layout = this.getDashboardLayout();
    const y = layout.y + 44;
    const leftStart = layout.x + 18 + layout.infoBayWidth / 2;
    const step = layout.infoBayWidth + layout.infoBayGap;

    return [
      { x: leftStart, y },
      { x: leftStart + step, y },
      { x: leftStart + step * 2, y },
      { x: layout.x + layout.width - 326, y }
    ];
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
    infoBayGap: number;
  } {
    const width = Math.min(1040, this.scene.scale.width - 28);
    const height = 172;
    const x = this.scene.scale.width / 2 - width / 2;
    const y = this.scene.scale.height - height - 14;
    const infoBayGap = 10;
    const infoBayWidth = Math.min(156, (width - 36 - infoBayGap * 4 - 132 - 82) / 4);

    return { x, y, width, height, infoBayWidth, infoBayGap };
  }

  private drawCockpitPanel(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    accentColor: number,
    glow = false
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
    graphics.lineStyle(1, 0xc89452, 0.58);
    graphics.strokeRoundedRect(x + 5, y + 5, width - 10, height - 10, 5);
    graphics.lineStyle(1, accentColor, 0.68);
    graphics.lineBetween(x + 14, y + height - 8, x + width - 14, y + height - 8);
    graphics.lineStyle(1, 0xff4fd8, glow ? 0.28 : 0.16);
    graphics.lineBetween(x + 18, y + 9, x + Math.min(x + width - 18, x + 180), y + 9);
    graphics.fillStyle(0xc89452, 0.72);
    graphics.fillCircle(x + 11, y + 11, 1.8);
    graphics.fillCircle(x + width - 11, y + 11, 1.8);
    graphics.fillCircle(x + 11, y + height - 11, 1.8);
    graphics.fillCircle(x + width - 11, y + height - 11, 1.8);
  }

  private drawMiniMeter(x: number, y: number, progress: number, color: number, width = 104): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const height = 4;
    this.hotbarGraphics.fillStyle(0x02040a, 0.78);
    this.hotbarGraphics.fillRect(x, y, width, height);
    this.hotbarGraphics.fillStyle(color, 0.9);
    this.hotbarGraphics.fillRect(x, y, width * progress, height);
    this.hotbarGraphics.lineStyle(1, 0x52627f, 0.48);
    this.hotbarGraphics.strokeRect(x, y, width, height);
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
