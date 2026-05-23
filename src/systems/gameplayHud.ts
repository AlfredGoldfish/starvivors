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
  private missionText?: Phaser.GameObjects.Text;
  private warningText?: Phaser.GameObjects.Text;
  private dashboardTexts: Phaser.GameObjects.Text[] = [];
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
    this.openPickerSlot = null;
    this.hoveredSlot = null;

    this.hudGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.hudText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '14px',
        color: '#f2fbff',
        fixedWidth: 380,
        lineSpacing: 3,
        wordWrap: { width: 368, useAdvancedWrap: true }
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1002);
    this.xpTimerText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: 560
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1002);
    this.missionText = this.hudText;
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
          color: '#f2fbff',
          align: 'center',
          fixedWidth: 152,
          lineSpacing: 2,
          wordWrap: { width: 144, useAdvancedWrap: true }
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1010);
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
        .setDepth(1004);
      const zone = this.scene.add.zone(0, 0, 112, 58).setScrollFactor(0).setDepth(1007).setInteractive({ useHandCursor: true });

      zone.on('pointerover', () => {
        this.hoveredSlot = slot;
        this.updateTooltip();
      });
      zone.on('pointerout', () => {
        this.hoveredSlot = null;
        this.updateTooltip();
      });
      zone.on('pointerdown', () => {
        this.openPickerSlot = this.openPickerSlot === slot ? null : slot;
        this.drawHotbar();
      });

      this.hotbarTexts[slot] = text;
      this.hotbarZones[slot] = zone;
    }

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
      .setDepth(1004);

    this.ejectZone = this.scene.add
      .zone(0, 0, 78, 44)
      .setScrollFactor(0)
      .setDepth(1007)
      .setInteractive({ useHandCursor: true });
    this.ejectZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation());
    this.ejectZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.callbacks.requestEject();
    });
  }

  update(snapshot: GameplayHudSnapshot): void {
    if (!this.hudText || !this.hudGraphics || !this.xpTimerText || !this.missionText || !this.warningText) {
      return;
    }

    this.latestSnapshot = snapshot;
    const topLayout = this.getTopHudLayout();
    const distance = Math.max(0, Math.round(snapshot.missionObjectiveDistance - snapshot.missionObjectiveRadius));

    this.xpTimerText
      .setPosition(topLayout.xpX + topLayout.xpWidth / 2, topLayout.y + 12)
      .setText(`XP ${snapshot.playerXp}/${snapshot.nextXpThreshold}     RUN ${this.formatSurvivalTime(snapshot.timeSeconds)}`);
    this.missionText
      .setPosition(topLayout.missionX + 18, topLayout.y + 12)
      .setText(
        `${snapshot.missionName}  ${snapshot.missionStatus}\n` +
          `${snapshot.contractStatusLine.replace(/^Contract /, '')}\n` +
          `RANGE ${distance}m`
      );
    this.statusIcon
      ?.setPosition(Math.max(28, topLayout.missionX - 22), topLayout.y + 39)
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

    const centerX = this.scene.scale.width / 2;
    const topLayout = this.getTopHudLayout();
    const xpBarY = topLayout.y + 47;

    this.hudGraphics.clear();
    this.drawCockpitPanel(this.hudGraphics, topLayout.xpX, topLayout.y, topLayout.xpWidth, topLayout.height, 0x42f5d7);
    this.drawSegmentedBar(
      topLayout.xpX + 16,
      xpBarY,
      topLayout.xpWidth - 32,
      18,
      Phaser.Math.Clamp(snapshot.xpProgress, 0, 1),
      0x42f5d7
    );

    this.drawCockpitPanel(
      this.hudGraphics,
      topLayout.missionX,
      topLayout.y,
      topLayout.missionWidth,
      topLayout.height,
      snapshot.isMissionDanger ? 0xff5964 : 0xffc857
    );
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
    this.hudGraphics.fillStyle(snapshot.isFuelEmergency || snapshot.isHullCritical ? 0xff5964 : 0xffc857, 0.88);
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
    this.hudGraphics.fillRoundedRect(x - 2, y - 2, width + 4, height + 4, 4);
    this.hudGraphics.lineStyle(1, 0xc89452, 0.72);
    this.hudGraphics.strokeRoundedRect(x - 2, y - 2, width + 4, height + 4, 4);
    this.hudGraphics.fillStyle(0x111a24, 0.92);
    this.hudGraphics.fillRect(x, y, width, height);
    this.hudGraphics.fillStyle(color, 0.88);
    this.hudGraphics.fillRect(x, y, width * progress, height);
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
      const fillColor = slotSnapshot.weaponId ? 0x071018 : 0x111a24;
      const strokeColor = slotSnapshot.slot === 'auto' ? 0x42f5d7 : slotSnapshot.slot === 'primary' ? 0xffc857 : 0xa8c7ff;

      this.hotbarGraphics.fillStyle(fillColor, 0.9);
      this.hotbarGraphics.fillRoundedRect(position.x - 56, position.y - 29, 112, 58, 7);
      this.hotbarGraphics.lineStyle(isOpen ? 3 : 2, strokeColor, isOpen ? 1 : 0.78);
      this.hotbarGraphics.strokeRoundedRect(position.x - 56, position.y - 29, 112, 58, 7);
      this.hotbarGraphics.fillStyle(strokeColor, 0.7);
      this.hotbarGraphics.fillRect(position.x - 52, position.y + 24, 104 * Phaser.Math.Clamp(slotSnapshot.cooldownProgress, 0, 1), 3);

      text.setPosition(position.x, position.y).setText(`${slotSnapshot.controlLabel}\n${slotSnapshot.title}`);
      zone.setPosition(position.x, position.y);
    }

    this.drawEjectButton();

    this.drawPicker();
    this.updateTooltip();
  }

  private drawDashboardShell(): void {
    if (!this.hotbarGraphics) {
      return;
    }

    const layout = this.getDashboardLayout();

    this.drawCockpitPanel(this.hotbarGraphics, layout.x, layout.y, layout.width, layout.height, 0x42f5d7);
    this.hotbarGraphics.lineStyle(1, 0xffc857, 0.28);
    this.hotbarGraphics.lineBetween(layout.x + 20, layout.y + 70, layout.x + layout.width - 20, layout.y + 70);

    for (const position of this.getDashboardInfoPositions()) {
      this.hotbarGraphics.fillStyle(0x071018, 0.88);
      this.hotbarGraphics.fillRoundedRect(position.x - layout.infoBayWidth / 2, position.y - 31, layout.infoBayWidth, 62, 6);
      this.hotbarGraphics.lineStyle(1, 0xc89452, 0.48);
      this.hotbarGraphics.strokeRoundedRect(position.x - layout.infoBayWidth / 2, position.y - 31, layout.infoBayWidth, 62, 6);
    }

    this.hotbarGraphics.lineStyle(1, 0xc89452, 0.28);
    this.hotbarGraphics.lineBetween(layout.x + layout.width * 0.32, layout.y + 82, layout.x + layout.width * 0.32, layout.y + layout.height - 14);
    this.hotbarGraphics.lineBetween(layout.x + layout.width * 0.68, layout.y + 82, layout.x + layout.width * 0.68, layout.y + layout.height - 14);
  }

  private drawEjectButton(): void {
    if (!this.hotbarGraphics || !this.ejectText || !this.ejectZone) {
      return;
    }

    const layout = this.getDashboardLayout();
    const x = layout.x + layout.width - 78;
    const y = layout.y + layout.height - 42;

    this.hotbarGraphics.fillStyle(0x241018, 0.96);
    this.hotbarGraphics.fillRoundedRect(x - 39, y - 22, 78, 44, 7);
    this.hotbarGraphics.lineStyle(2, 0xff5964, 0.9);
    this.hotbarGraphics.strokeRoundedRect(x - 39, y - 22, 78, 44, 7);
    this.hotbarGraphics.fillStyle(0xff5964, 0.28);
    this.hotbarGraphics.fillRect(x - 29, y + 15, 58, 3);
    this.ejectText.setPosition(x, y).setVisible(true);
    this.ejectZone.setPosition(x, y).setVisible(true);
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
      zone.on('pointerdown', () => {
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
    const startX = layout.x + 18 + layout.infoBayWidth / 2;
    const step = layout.infoBayWidth + layout.infoBayGap;

    return [
      { x: startX, y },
      { x: startX + step, y },
      { x: startX + step * 2, y },
      { x: startX + step * 3, y }
    ];
  }

  private getTopHudLayout(): {
    x: number;
    y: number;
    xpX: number;
    xpWidth: number;
    missionX: number;
    missionWidth: number;
    height: number;
  } {
    const margin = HUD_MARGIN + 2;
    const gap = 14;
    const height = 82;
    const missionWidth = Phaser.Math.Clamp(this.scene.scale.width * 0.42, 330, 410);
    const availableWidth = this.scene.scale.width - margin * 2 - gap - missionWidth;
    const xpWidth = Phaser.Math.Clamp(availableWidth, 330, 640);
    const groupWidth = xpWidth + gap + missionWidth;
    const x = Math.max(margin, (this.scene.scale.width - groupWidth) / 2);

    return {
      x,
      y: HUD_MARGIN + 2,
      xpX: x,
      xpWidth,
      missionX: x + xpWidth + gap,
      missionWidth,
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
    const height = 166;
    const x = this.scene.scale.width / 2 - width / 2;
    const y = this.scene.scale.height - height - 14;
    const infoBayGap = 10;
    const infoBayWidth = Math.min(172, (width - 36 - infoBayGap * 3) / 4);

    return { x, y, width, height, infoBayWidth, infoBayGap };
  }

  private drawCockpitPanel(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    accentColor: number
  ): void {
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

  private formatSurvivalTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
