import Phaser from 'phaser';
import type { UpgradeDefinition } from '../data/upgrades';
import type { WeaponRegistryEntry } from '../data/weapons';
import type { ResolvedWeaponStats } from '../systems/weaponStats';

export const UPGRADE_OVERLAY_CHOICE_COUNT = 3;

const UPGRADE_OVERLAY_CARD_HEIGHT = 74;
const UPGRADE_OVERLAY_CARD_GAP = 10;

interface UpgradeOverlayLayout {
  width: number;
  height: number;
  centerX: number;
  panelWidth: number;
  panelHeight: number;
  panelX: number;
  panelY: number;
  cardX: number;
  cardWidth: number;
  cardHeight: number;
  cardGap: number;
}

export interface UpgradeOverlayDisplayChoice {
  category: string;
  name: string;
  description: string;
  rarity?: UpgradeDefinition['rarity'];
  maxLevel?: number;
}

export interface UpgradeOverlayButtonState {
  bankedUpgrades: number;
  isPlayerDead: boolean;
  isOverlayOpen: boolean;
}

export interface UpgradeOverlayRenderState<TChoice extends UpgradeOverlayDisplayChoice> {
  choices: TChoice[];
  isOpen: boolean;
  isSpecialChoiceSet: boolean;
  bankedUpgrades: number;
  runScrapTotal: number;
  rerollCost: number;
  weaponSummary: string;
  playerHull: number;
  playerMaxHull: number;
  playerAccelerationMultiplier: number;
  playerInvulnerabilityMs: number;
  getChoiceLevel: (choice: TChoice) => number;
  isChoiceAtMaxLevel: (choice: TChoice) => boolean;
}

export interface UpgradeOverlayChoiceDebugObjects {
  text: Phaser.GameObjects.Text;
  metaText: Phaser.GameObjects.Text;
  hitZone: Phaser.GameObjects.Zone;
}

export interface UpgradeOverlayUiConfig {
  scene: Phaser.Scene;
  onUpgradeButtonClick: () => void;
  onChoiceSelected: (index: number, time: number) => void;
}

export class UpgradeOverlayUiController<TChoice extends UpgradeOverlayDisplayChoice> {
  private readonly scene: Phaser.Scene;
  private readonly onUpgradeButtonClick: () => void;
  private readonly onChoiceSelected: (index: number, time: number) => void;
  private upgradeButtonContainer?: Phaser.GameObjects.Container;
  private upgradeButtonGraphics?: Phaser.GameObjects.Graphics;
  private upgradeButtonText?: Phaser.GameObjects.Text;
  private upgradeOverlayBlocker?: Phaser.GameObjects.Zone;
  private upgradeOverlayGraphics?: Phaser.GameObjects.Graphics;
  private upgradeOverlayText?: Phaser.GameObjects.Text;
  private upgradeOverlayPromptText?: Phaser.GameObjects.Text;
  private readonly upgradeOverlayChoiceTexts: Phaser.GameObjects.Text[] = [];
  private readonly upgradeOverlayChoiceMetaTexts: Phaser.GameObjects.Text[] = [];
  private readonly upgradeOverlayChoiceHitZones: Phaser.GameObjects.Zone[] = [];

  constructor(config: UpgradeOverlayUiConfig) {
    this.scene = config.scene;
    this.onUpgradeButtonClick = config.onUpgradeButtonClick;
    this.onChoiceSelected = config.onChoiceSelected;
  }

  createButton(): void {
    this.upgradeButtonGraphics = this.scene.add.graphics();
    this.upgradeButtonText = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#f2fbff'
      })
      .setOrigin(0.5);

    this.upgradeButtonContainer = this.scene.add
      .container(this.scene.scale.width / 2, this.scene.scale.height - 116, [this.upgradeButtonGraphics, this.upgradeButtonText])
      .setScrollFactor(0)
      .setDepth(1002)
      .setSize(190, 42)
      .setInteractive({ useHandCursor: true });

    this.upgradeButtonContainer.on('pointerdown', () => this.onUpgradeButtonClick());
    this.updateButton({ bankedUpgrades: 0, isPlayerDead: false, isOverlayOpen: false });
  }

  updateButton(state: UpgradeOverlayButtonState): void {
    if (!this.upgradeButtonContainer || !this.upgradeButtonGraphics || !this.upgradeButtonText) {
      return;
    }

    const isVisible = state.bankedUpgrades > 0 && !state.isPlayerDead && !state.isOverlayOpen;
    const label = state.bankedUpgrades > 1 ? `Upgrade (${state.bankedUpgrades})` : 'Upgrade';

    this.upgradeButtonContainer
      .setPosition(this.scene.scale.width / 2, this.scene.scale.height - 116)
      .setVisible(isVisible)
      .disableInteractive();

    if (isVisible) {
      this.upgradeButtonContainer.setInteractive({ useHandCursor: true });
    }

    this.upgradeButtonText.setText(label);
    this.upgradeButtonGraphics.clear();
    this.upgradeButtonGraphics.fillStyle(0x071018, 0.94);
    this.upgradeButtonGraphics.fillRoundedRect(-95, -21, 190, 42, 6);
    this.upgradeButtonGraphics.lineStyle(2, 0x42f5d7, 0.88);
    this.upgradeButtonGraphics.strokeRoundedRect(-95, -21, 190, 42, 6);
  }

  createOverlay(): void {
    const layout = this.getLayout();

    this.upgradeOverlayBlocker = this.scene.add
      .zone(0, 0, layout.width, layout.height)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1199)
      .setVisible(false)
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
      .on('pointerup', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation());
    this.upgradeOverlayGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(1200);

    for (let i = 0; i < UPGRADE_OVERLAY_CHOICE_COUNT; i += 1) {
      const cardY = this.getCardY(layout, i);
      const choiceText = this.scene.add
        .text(layout.cardX + 16, cardY + 10, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '13px',
          color: '#f2fbff',
          fixedWidth: layout.cardWidth - 258,
          wordWrap: { width: layout.cardWidth - 258 },
          lineSpacing: 2
        })
        .setScrollFactor(0)
        .setDepth(1209);
      const metaText = this.scene.add
        .text(layout.cardX + layout.cardWidth - 16, cardY + 10, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '11px',
          color: '#a8c7ff',
          align: 'right',
          fixedWidth: 210
        })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(1209);

      this.upgradeOverlayChoiceTexts.push(choiceText);
      this.upgradeOverlayChoiceMetaTexts.push(metaText);

      const hitZone = this.scene.add
        .zone(layout.cardX, cardY, layout.cardWidth, layout.cardHeight)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(1210)
        .setVisible(false);

      hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.onChoiceSelected(i, this.scene.time.now);
      });
      this.upgradeOverlayChoiceHitZones.push(hitZone);
    }

    this.upgradeOverlayText = this.scene.add
      .text(layout.centerX, layout.panelY + 28, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        align: 'left',
        fixedWidth: layout.panelWidth - 56,
        lineSpacing: 4,
        wordWrap: { width: layout.panelWidth - 56 }
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1201);

    this.upgradeOverlayPromptText = this.scene.add
      .text(layout.cardX, layout.panelY + layout.panelHeight - 34, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        fixedWidth: layout.cardWidth,
        wordWrap: { width: layout.cardWidth }
      })
      .setScrollFactor(0)
      .setDepth(1201);

    this.hideOverlay();
  }

  renderOverlay(state: UpgradeOverlayRenderState<TChoice>): void {
    const choicePrompt =
      state.choices.length > 0
        ? `Click a card or press 1-${state.choices.length} to choose.  R rerolls for ${state.rerollCost} scrap.  Esc closes.`
        : 'Esc closes.';

    this.drawCards(state.choices, state.isOpen);
    state.choices.forEach((choice, index) => {
      const text = this.upgradeOverlayChoiceTexts[index];
      const metaText = this.upgradeOverlayChoiceMetaTexts[index];
      if (!text || !metaText) {
        return;
      }

      text.setText(`${index + 1}. ${choice.name}\n${choice.description}`);
      if (choice.category === 'secondary-weapon') {
        metaText.setText('RIGHT CLICK');
        return;
      }

      const level = state.getChoiceLevel(choice);
      const maxLevel = choice.maxLevel ? `/${choice.maxLevel}` : '';
      const maxLabel = state.isChoiceAtMaxLevel(choice) ? '  MAX' : '';
      metaText.setText(`${(choice.rarity ?? 'common').toUpperCase()}  ${choice.category.toUpperCase()}\nLv ${level}${maxLevel}${maxLabel}`);
    });

    for (let i = state.choices.length; i < this.upgradeOverlayChoiceTexts.length; i += 1) {
      this.upgradeOverlayChoiceTexts[i].setText('');
      this.upgradeOverlayChoiceMetaTexts[i].setText('');
    }

    this.upgradeOverlayText?.setText(
      `${state.isSpecialChoiceSet ? 'SPECIAL UPGRADE CACHE' : 'UPGRADE SELECTION'}\n` +
        `Banked upgrades: ${state.bankedUpgrades}\n` +
        `Run scrap: ${state.runScrapTotal}  Reroll cost: ${state.rerollCost}\n` +
        state.weaponSummary +
        '\n' +
        `Ship: ${state.playerHull}/${state.playerMaxHull} hull, x${state.playerAccelerationMultiplier.toFixed(2)} accel, ${(state.playerInvulnerabilityMs / 1000).toFixed(2)}s i-frames`
    );
    this.upgradeOverlayPromptText?.setText(choicePrompt);
  }

  showOverlay(): void {
    this.upgradeOverlayGraphics?.setVisible(true);
    this.upgradeOverlayText?.setVisible(true);
    this.upgradeOverlayPromptText?.setVisible(true);
  }

  hideOverlay(): void {
    this.upgradeOverlayBlocker?.setVisible(false).disableInteractive();
    this.upgradeOverlayGraphics?.setVisible(false);
    this.upgradeOverlayText?.setVisible(false);
    this.upgradeOverlayPromptText?.setVisible(false);
    for (const text of [...this.upgradeOverlayChoiceTexts, ...this.upgradeOverlayChoiceMetaTexts]) {
      text.setVisible(false);
    }
    for (const hitZone of this.upgradeOverlayChoiceHitZones) {
      hitZone.setVisible(false).disableInteractive();
    }
  }

  getChoiceDebugObjects(index: number): UpgradeOverlayChoiceDebugObjects | undefined {
    const text = this.upgradeOverlayChoiceTexts[index];
    const metaText = this.upgradeOverlayChoiceMetaTexts[index];
    const hitZone = this.upgradeOverlayChoiceHitZones[index];

    if (!text || !metaText || !hitZone) {
      return undefined;
    }

    return { text, metaText, hitZone };
  }

  private drawCards(choices: TChoice[], isOpen: boolean): void {
    const layout = this.getLayout();

    this.upgradeOverlayBlocker
      ?.setPosition(0, 0)
      .setSize(layout.width, layout.height)
      .setVisible(isOpen);
    if (isOpen) {
      this.upgradeOverlayBlocker?.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, layout.width, layout.height),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains
      });
    } else {
      this.upgradeOverlayBlocker?.disableInteractive();
    }

    if (!this.upgradeOverlayGraphics) {
      return;
    }

    this.upgradeOverlayGraphics.clear();
    this.upgradeOverlayGraphics.fillStyle(0x02040a, 0.76);
    this.upgradeOverlayGraphics.fillRect(0, 0, layout.width, layout.height);
    this.upgradeOverlayGraphics.fillStyle(0x071018, 0.95);
    this.upgradeOverlayGraphics.fillRoundedRect(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 8);
    this.upgradeOverlayGraphics.lineStyle(2, 0x42f5d7, 0.75);
    this.upgradeOverlayGraphics.strokeRoundedRect(layout.panelX, layout.panelY, layout.panelWidth, layout.panelHeight, 8);

    this.upgradeOverlayText
      ?.setPosition(layout.centerX, layout.panelY + 28)
      .setStyle({ fixedWidth: layout.panelWidth - 56 })
      .setWordWrapWidth(layout.panelWidth - 56);
    this.upgradeOverlayPromptText
      ?.setPosition(layout.cardX, layout.panelY + layout.panelHeight - 34)
      .setStyle({ fixedWidth: layout.cardWidth })
      .setWordWrapWidth(layout.cardWidth);

    for (let i = 0; i < UPGRADE_OVERLAY_CHOICE_COUNT; i += 1) {
      const choice = choices[i];
      const cardY = this.getCardY(layout, i);
      const accentColor = choice && choice.category !== 'secondary-weapon' ? getUpgradeRarityColor(choice.rarity ?? 'common') : 0x42f5d7;
      const hitZone = this.upgradeOverlayChoiceHitZones[i];
      const text = this.upgradeOverlayChoiceTexts[i];
      const metaText = this.upgradeOverlayChoiceMetaTexts[i];

      this.upgradeOverlayGraphics.fillStyle(0x111a24, choice ? 0.94 : 0.42);
      this.upgradeOverlayGraphics.fillRoundedRect(layout.cardX, cardY, layout.cardWidth, layout.cardHeight, 6);
      this.upgradeOverlayGraphics.fillStyle(accentColor, choice ? 0.9 : 0.2);
      this.upgradeOverlayGraphics.fillRoundedRect(layout.cardX, cardY, 5, layout.cardHeight, 3);
      this.upgradeOverlayGraphics.lineStyle(1, choice ? accentColor : 0x52627f, choice ? 0.72 : 0.28);
      this.upgradeOverlayGraphics.strokeRoundedRect(layout.cardX, cardY, layout.cardWidth, layout.cardHeight, 6);

      text
        .setPosition(layout.cardX + 16, cardY + 10)
        .setStyle({ fixedWidth: layout.cardWidth - 258 })
        .setWordWrapWidth(layout.cardWidth - 258);
      metaText
        .setPosition(layout.cardX + layout.cardWidth - 16, cardY + 10)
        .setStyle({ fixedWidth: 210 });
      hitZone.setPosition(layout.cardX, cardY).setSize(layout.cardWidth, layout.cardHeight).setVisible(Boolean(choice));
      if (choice && isOpen) {
        hitZone.setInteractive({
          hitArea: new Phaser.Geom.Rectangle(0, 0, layout.cardWidth, layout.cardHeight),
          hitAreaCallback: Phaser.Geom.Rectangle.Contains,
          useHandCursor: true
        });
      } else {
        hitZone.disableInteractive();
      }
    }

    const visibleTexts = [
      ...this.upgradeOverlayChoiceTexts,
      ...this.upgradeOverlayChoiceMetaTexts,
      this.upgradeOverlayPromptText
    ].filter((text): text is Phaser.GameObjects.Text => Boolean(text));
    for (const text of visibleTexts) {
      text.setVisible(isOpen);
    }
    this.upgradeOverlayText?.setVisible(isOpen);
  }

  private getLayout(): UpgradeOverlayLayout {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const centerX = width / 2;
    const panelWidth = Math.min(width - 48, 760);
    const minCardStackHeight = 118 + UPGRADE_OVERLAY_CHOICE_COUNT * UPGRADE_OVERLAY_CARD_HEIGHT + (UPGRADE_OVERLAY_CHOICE_COUNT - 1) * UPGRADE_OVERLAY_CARD_GAP + 58;
    const panelHeight = Math.min(height - 48, Math.max(560, minCardStackHeight));
    const panelX = centerX - panelWidth / 2;
    const panelY = Math.max(24, height / 2 - panelHeight / 2);

    return {
      width,
      height,
      centerX,
      panelWidth,
      panelHeight,
      panelX,
      panelY,
      cardX: panelX + 28,
      cardWidth: panelWidth - 56,
      cardHeight: UPGRADE_OVERLAY_CARD_HEIGHT,
      cardGap: UPGRADE_OVERLAY_CARD_GAP
    };
  }

  private getCardY(layout: UpgradeOverlayLayout, index: number): number {
    return layout.panelY + 118 + index * (layout.cardHeight + layout.cardGap);
  }
}

export function formatUpgradeOverlayWeaponSummary(
  activeWeapon: WeaponRegistryEntry,
  resolvedActiveWeapon: ResolvedWeaponStats,
  damageMultiplier: number
): string {
  if (resolvedActiveWeapon.beam) {
    const beam = resolvedActiveWeapon.beam;
    return `${activeWeapon.displayName}: ${Math.round(beam.tickDamage * beam.tickRatePerSecond)} DPS, ${beam.tickRatePerSecond.toFixed(1)}/s, heat ${Math.round(beam.heatGainPerSecond)}/s, cool ${Math.round(beam.coolingPerSecond)}/s, range ${Math.round(beam.range)}`;
  }

  if (resolvedActiveWeapon.rammingShield) {
    const shield = resolvedActiveWeapon.rammingShield;
    return `${activeWeapon.displayName}: ${Math.round(shield.bashDamage)} bash, ${Math.round(shield.guardDamage)} guard, ${shield.dashMaxCharges} charges, ${shield.dashChargeRechargeSeconds.toFixed(1)}s recharge`;
  }

  const projectile = resolvedActiveWeapon.projectile;
  const activeDamage = Math.round(projectile?.damage ?? 0);
  const cooldownSeconds = (projectile?.cooldownMs ?? 0) / 1000;
  const speed = Math.round(projectile?.projectileSpeed ?? 0);
  return `${activeWeapon.displayName}: ${activeDamage} damage, x${damageMultiplier.toFixed(2)}, ${cooldownSeconds.toFixed(2)}s cooldown, ${speed} speed`;
}

function getUpgradeRarityColor(rarity: UpgradeDefinition['rarity']): number {
  switch (rarity) {
    case 'common':
      return 0xa8c7ff;
    case 'uncommon':
      return 0x42f5d7;
    case 'rare':
      return 0xffc857;
    case 'epic':
      return 0xb88cff;
    default:
      return 0xf2fbff;
  }
}
