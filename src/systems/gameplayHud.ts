import Phaser from 'phaser';
import { HUD_BAR_HEIGHT, HUD_BAR_WIDTH, HUD_MARGIN, HUD_RIGHT_BAR_Y } from '../scenes/gameConstants';

export interface GameplayHudSnapshot {
  timeSeconds: number;
  playerHull: number;
  maxHull: number;
  status: string;
  playerXp: number;
  nextXpThreshold: number;
  runScrapTotal: number;
  bankedUpgrades: number;
  activeWeaponName: string;
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
}

export class GameplayHudSystem {
  private readonly scene: Phaser.Scene;
  private hudGraphics?: Phaser.GameObjects.Graphics;
  private hudText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
  }

  update(snapshot: GameplayHudSnapshot): void {
    if (!this.hudText || !this.hudGraphics) {
      return;
    }

    const upgradeStatus =
      snapshot.bankedUpgrades > 0 ? `Upgrade available x${snapshot.bankedUpgrades}  Press U` : 'No upgrade banked';
    const shieldStatus = snapshot.hasRammingShield
      ? `Shield ${Math.ceil(snapshot.rammingShieldHp)} / ${snapshot.rammingShieldMaxHp}${snapshot.rammingShieldHp <= 0 ? '  BROKEN' : ''}\n` +
        `Shield dash ${snapshot.rammingShieldDashCharges} / ${snapshot.rammingShieldDashMaxCharges}${snapshot.isRammingShieldEmpowered ? '  EMPOWERED' : ''}\n`
      : '';

    this.hudText
      .setPosition(this.scene.scale.width - HUD_MARGIN, HUD_MARGIN)
      .setText(
        `Time ${this.formatSurvivalTime(snapshot.timeSeconds)}\n` +
          `Hull ${snapshot.playerHull} / ${snapshot.maxHull}  ${snapshot.status}\n` +
          shieldStatus +
          `XP ${snapshot.playerXp} / ${snapshot.nextXpThreshold}\n` +
          `Scrap ${snapshot.runScrapTotal}\n` +
          `Banked upgrades ${snapshot.bankedUpgrades}\n` +
          `${upgradeStatus}\n` +
          `Primary ${snapshot.activeWeaponName} ${snapshot.weaponStatus}\n` +
          `Secondary ${snapshot.secondaryWeaponName}\n` +
          `${snapshot.mainWeaponUpgradeSummary}`
      );

    this.drawBars(snapshot);
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

    this.hudGraphics.clear();
    this.drawBar(xpX, xpY, Phaser.Math.Clamp(snapshot.xpProgress, 0, 1), 0x42f5d7);
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

  private formatSurvivalTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
