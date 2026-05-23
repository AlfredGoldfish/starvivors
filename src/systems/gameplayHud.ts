import Phaser from 'phaser';
import { HUD_BAR_HEIGHT, HUD_BAR_WIDTH, HUD_MARGIN, HUD_RIGHT_BAR_Y } from '../scenes/gameConstants';
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
  sectorScannerStatus: string;
  contractStatusLine: string;
  autoWeaponName: string;
  primaryWeaponName: string;
  weaponStatus: string;
  secondaryWeaponName: string;
  mainWeaponUpgradeSummary: string;
  hullProgress: number;
  xpProgress: number;
  weaponProgress: number;
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
    this.hudGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);
    this.hudText = this.scene.add
      .text(this.scene.scale.width - HUD_MARGIN, HUD_MARGIN, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#f2fbff',
        backgroundColor: 'rgba(2, 4, 10, 0.72)',
        padding: { x: 10, y: 7 }
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);
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
          fontSize: '11px',
          color: '#f2fbff',
          align: 'center',
          fixedWidth: 92
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1004);
      const zone = this.scene.add.zone(0, 0, 96, 52).setScrollFactor(0).setDepth(1007).setInteractive({ useHandCursor: true });

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
        fontSize: '12px',
        color: '#ffb3b8',
        align: 'center',
        fixedWidth: 64
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1004);

    this.ejectZone = this.scene.add
      .zone(0, 0, 68, 40)
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
    if (!this.hudText || !this.hudGraphics) {
      return;
    }

    this.latestSnapshot = snapshot;
    const upgradeStatus =
      snapshot.bankedUpgrades > 0 ? `Upgrade available x${snapshot.bankedUpgrades}  Press U` : 'No upgrade banked';
    const shieldStatus = snapshot.hasRammingShield
      ? `Shield ${Math.ceil(snapshot.rammingShieldHp)} / ${Math.round(snapshot.rammingShieldMaxHp)}${snapshot.rammingShieldHp <= 0 ? '  BROKEN' : ''}\n` +
        `Shield dash ${snapshot.rammingShieldDashCharges} / ${snapshot.rammingShieldDashMaxCharges}${snapshot.isRammingShieldEmpowered ? '  EMPOWERED' : ''}\n`
      : '';

    this.hudText
      .setPosition(this.scene.scale.width - HUD_MARGIN, HUD_MARGIN)
      .setText(
        `Time ${this.formatSurvivalTime(snapshot.timeSeconds)}\n` +
          `Hull ${Math.round(snapshot.playerHull)} / ${Math.round(snapshot.maxHull)}  ${snapshot.status}\n` +
          shieldStatus +
          `Fuel ${Math.ceil(snapshot.fuel)} / ${snapshot.maxFuel}${snapshot.isFuelEmergency ? '  EMERGENCY' : ''}\n` +
          `${snapshot.contractStatusLine}\n` +
          `XP ${snapshot.playerXp} / ${snapshot.nextXpThreshold}\n` +
          `Scrap ${snapshot.runScrapTotal}  Spent ${snapshot.scrapSpentThisRun}  Reroll ${snapshot.nextRerollCost}\n` +
          `Scanner ${snapshot.sectorScannerStatus}\n` +
          `Banked upgrades ${snapshot.bankedUpgrades}\n` +
          `${upgradeStatus}\n` +
          `Auto ${snapshot.autoWeaponName} ${snapshot.weaponStatus}\n` +
          `Primary ${snapshot.primaryWeaponName}\n` +
          `Secondary ${snapshot.secondaryWeaponName}\n` +
          `${snapshot.mainWeaponUpgradeSummary}`
      );
    this.statusIcon
      ?.setPosition(this.scene.scale.width - HUD_MARGIN - 324, HUD_MARGIN + 28)
      .setVisible(true);

    this.drawBars(snapshot);
    this.drawHotbar();
  }

  private drawBars(snapshot: GameplayHudSnapshot): void {
    if (!this.hudGraphics) {
      return;
    }

    const centerX = this.scene.scale.width / 2;
    const xpX = centerX - HUD_BAR_WIDTH / 2;
    const xpY = HUD_MARGIN;
    const hullX = this.scene.scale.width - HUD_MARGIN - HUD_BAR_WIDTH;
    const hullY = HUD_RIGHT_BAR_Y;
    const pulseY = hullY + 26;
    const shieldY = pulseY + 26;
    const fuelY = xpY + 26;

    this.hudGraphics.clear();
    this.drawBar(xpX, xpY, Phaser.Math.Clamp(snapshot.xpProgress, 0, 1), 0x42f5d7);
    this.drawBar(xpX, fuelY, Phaser.Math.Clamp(snapshot.fuelProgress, 0, 1), snapshot.isFuelEmergency ? 0xff5964 : 0xffc857);
    this.drawBar(hullX, hullY, Phaser.Math.Clamp(snapshot.hullProgress, 0, 1), 0xff5964);
    this.drawBar(hullX, pulseY, Phaser.Math.Clamp(snapshot.weaponProgress, 0, 1), 0xffc857);

    if (snapshot.hasRammingShield) {
      const shieldProgress = snapshot.rammingShieldMaxHp > 0 ? snapshot.rammingShieldHp / snapshot.rammingShieldMaxHp : 0;
      this.drawBar(hullX, shieldY, Phaser.Math.Clamp(shieldProgress, 0, 1), 0x42f5d7);
    }
  }

  private drawBar(x: number, y: number, progress: number, color: number): void {
    if (!this.hudGraphics) {
      return;
    }

    this.hudGraphics.fillStyle(0x02040a, 0.76);
    this.hudGraphics.fillRoundedRect(x - 2, y - 2, HUD_BAR_WIDTH + 4, HUD_BAR_HEIGHT + 4, 4);
    this.hudGraphics.lineStyle(1, 0x52627f, 0.78);
    this.hudGraphics.strokeRoundedRect(x - 2, y - 2, HUD_BAR_WIDTH + 4, HUD_BAR_HEIGHT + 4, 4);
    this.hudGraphics.fillStyle(0x111a24, 0.92);
    this.hudGraphics.fillRect(x, y, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);
    this.hudGraphics.fillStyle(color, 0.88);
    this.hudGraphics.fillRect(x, y, HUD_BAR_WIDTH * progress, HUD_BAR_HEIGHT);
  }

  private drawHotbar(): void {
    if (!this.hotbarGraphics || !this.latestSnapshot) {
      return;
    }

    const slots = this.latestSnapshot.weaponSlots;
    const positions = this.getHotbarPositions();

    this.hotbarGraphics.clear();
    this.drawDashboardShell();

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
      this.hotbarGraphics.fillRoundedRect(position.x - 48, position.y - 26, 96, 52, 7);
      this.hotbarGraphics.lineStyle(isOpen ? 3 : 2, strokeColor, isOpen ? 1 : 0.78);
      this.hotbarGraphics.strokeRoundedRect(position.x - 48, position.y - 26, 96, 52, 7);
      this.hotbarGraphics.fillStyle(strokeColor, 0.7);
      this.hotbarGraphics.fillRect(position.x - 46, position.y + 22, 92 * Phaser.Math.Clamp(slotSnapshot.cooldownProgress, 0, 1), 2);

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

    const centerX = this.scene.scale.width / 2;
    const bottomY = this.scene.scale.height - 16;
    const width = 660;
    const height = 138;

    this.hotbarGraphics.fillStyle(0x02040a, 0.8);
    this.hotbarGraphics.fillEllipse(centerX, bottomY, width, height);
    this.hotbarGraphics.fillStyle(0x071018, 0.9);
    this.hotbarGraphics.fillEllipse(centerX, bottomY + 8, width - 18, height - 20);
    this.hotbarGraphics.lineStyle(2, 0x42f5d7, 0.84);
    this.hotbarGraphics.strokeEllipse(centerX, bottomY, width, height);
    this.hotbarGraphics.lineStyle(1, 0xffc857, 0.34);
    this.hotbarGraphics.strokeEllipse(centerX, bottomY + 8, width - 42, height - 42);
  }

  private drawEjectButton(): void {
    if (!this.hotbarGraphics || !this.ejectText || !this.ejectZone) {
      return;
    }

    const x = this.scene.scale.width / 2 + 252;
    const y = this.scene.scale.height - 74;

    this.hotbarGraphics.fillStyle(0x241018, 0.96);
    this.hotbarGraphics.fillRoundedRect(x - 34, y - 20, 68, 40, 7);
    this.hotbarGraphics.lineStyle(2, 0xff5964, 0.9);
    this.hotbarGraphics.strokeRoundedRect(x - 34, y - 20, 68, 40, 7);
    this.hotbarGraphics.fillStyle(0xff5964, 0.28);
    this.hotbarGraphics.fillRect(x - 26, y + 13, 52, 2);
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
    const baseY = this.scene.scale.height - 74;

    return {
      primary: { x: centerX - 128, y: baseY },
      auto: { x: centerX, y: baseY },
      secondary: { x: centerX + 128, y: baseY }
    };
  }

  private formatSurvivalTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
