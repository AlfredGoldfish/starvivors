import Phaser from 'phaser';
import type { UpgradeDefinition } from '../data/upgrades';
import type { WeaponRegistryEntry } from '../data/weapons';
import type { ResolvedWeaponStats } from '../systems/weaponStats';
import { drawCockpitCard } from './cockpitCard';

export const UPGRADE_OVERLAY_CHOICE_COUNT = 3;

const UPGRADE_OVERLAY_CARD_WIDTH = 300;
const UPGRADE_OVERLAY_CARD_HEIGHT = 224;
const UPGRADE_OVERLAY_CARD_GAP = 16;
const UPGRADE_BUTTON_WIDTH = 196;
const UPGRADE_BUTTON_HEIGHT = 44;

export type UpgradeOverlayMode = 'normal' | 'rare' | null;
type UpgradeButtonKind = 'normal' | 'rare';

interface UpgradeOverlayLayout {
  width: number;
  height: number;
  centerX: number;
  cardStartX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  cardGap: number;
  headerY: number;
  promptY: number;
}

interface UpgradeButtonObjects {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  kind: UpgradeButtonKind;
  hovered: boolean;
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
  pendingRareUpgrades: number;
  isPlayerDead: boolean;
  isOverlayOpen: boolean;
}

export interface UpgradeOverlayRenderState<TChoice extends UpgradeOverlayDisplayChoice> {
  choices: TChoice[];
  isOpen: boolean;
  isSpecialChoiceSet: boolean;
  mode: UpgradeOverlayMode;
  bankedUpgrades: number;
  pendingRareUpgrades: number;
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
  onNormalUpgradeButtonClick: () => void;
  onRareUpgradeButtonClick: () => void;
  onChoiceSelected: (index: number, time: number) => void;
}

export class UpgradeOverlayUiController<TChoice extends UpgradeOverlayDisplayChoice> {
  private readonly scene: Phaser.Scene;
  private readonly onNormalUpgradeButtonClick: () => void;
  private readonly onRareUpgradeButtonClick: () => void;
  private readonly onChoiceSelected: (index: number, time: number) => void;
  private normalUpgradeButton?: UpgradeButtonObjects;
  private rareUpgradeButton?: UpgradeButtonObjects;
  private upgradeOverlayBlocker?: Phaser.GameObjects.Zone;
  private upgradeOverlayGraphics?: Phaser.GameObjects.Graphics;
  private upgradeOverlayText?: Phaser.GameObjects.Text;
  private upgradeOverlayPromptText?: Phaser.GameObjects.Text;
  private readonly upgradeOverlayChoiceTexts: Phaser.GameObjects.Text[] = [];
  private readonly upgradeOverlayChoiceMetaTexts: Phaser.GameObjects.Text[] = [];
  private readonly upgradeOverlayChoiceHitZones: Phaser.GameObjects.Zone[] = [];

  constructor(config: UpgradeOverlayUiConfig) {
    this.scene = config.scene;
    this.onNormalUpgradeButtonClick = config.onNormalUpgradeButtonClick;
    this.onRareUpgradeButtonClick = config.onRareUpgradeButtonClick;
    this.onChoiceSelected = config.onChoiceSelected;
  }

  createButton(): void {
    this.normalUpgradeButton = this.createUpgradeButtonObjects('normal');
    this.rareUpgradeButton = this.createUpgradeButtonObjects('rare');
    this.updateButton({ bankedUpgrades: 0, pendingRareUpgrades: 0, isPlayerDead: false, isOverlayOpen: false });
  }

  updateButton(state: UpgradeOverlayButtonState): void {
    const normalVisible = state.bankedUpgrades > 0 && !state.isPlayerDead && !state.isOverlayOpen;
    const rareVisible = state.pendingRareUpgrades > 0 && !state.isPlayerDead && !state.isOverlayOpen;
    const y = this.scene.scale.height - 182;
    const centerX = this.scene.scale.width / 2;
    const normalX = normalVisible && rareVisible ? centerX - 112 : centerX;
    const rareX = normalVisible && rareVisible ? centerX + 112 : centerX;

    this.updateUpgradeButtonObjects(this.normalUpgradeButton, {
      visible: normalVisible,
      x: normalX,
      y,
      label: state.bankedUpgrades > 1 ? `UPGRADE x${state.bankedUpgrades}` : 'UPGRADE',
      accentColor: 0x52ff9a,
      fillColor: 0x07180f
    });
    this.updateUpgradeButtonObjects(this.rareUpgradeButton, {
      visible: rareVisible,
      x: rareX,
      y,
      label: state.pendingRareUpgrades > 1 ? `RARE x${state.pendingRareUpgrades}` : 'RARE UPGRADE',
      accentColor: 0xffc857,
      fillColor: 0x1f1608
    });
  }

  private createUpgradeButtonObjects(kind: UpgradeButtonKind): UpgradeButtonObjects {
    const graphics = this.scene.add.graphics();
    const text = this.scene.add
      .text(0, 0, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: UPGRADE_BUTTON_WIDTH - 18,
        wordWrap: { width: UPGRADE_BUTTON_WIDTH - 22, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setShadow(1, 1, '#02040a', 3, true, true);
    const container = this.scene.add
      .container(0, 0, [graphics, text])
      .setScrollFactor(0)
      .setDepth(1002)
      .setSize(UPGRADE_BUTTON_WIDTH, UPGRADE_BUTTON_HEIGHT)
      .setVisible(false);
    const button: UpgradeButtonObjects = { container, graphics, text, kind, hovered: false };
    container.on('pointerover', () => {
      button.hovered = true;
      this.drawUpgradeHudButton(button);
    });
    container.on('pointerout', () => {
      button.hovered = false;
      this.drawUpgradeHudButton(button);
    });
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      if (kind === 'rare') {
        this.onRareUpgradeButtonClick();
      } else {
        this.onNormalUpgradeButtonClick();
      }
    });

    return button;
  }

  private updateUpgradeButtonObjects(
    button: UpgradeButtonObjects | undefined,
    state: { visible: boolean; x: number; y: number; label: string; accentColor: number; fillColor: number }
  ): void {
    if (!button) {
      return;
    }

    button.container
      .setPosition(state.x, state.y)
      .setVisible(state.visible)
      .disableInteractive();
    if (state.visible) {
      button.container.setInteractive({ useHandCursor: true });
    }

    button.text.setText(state.label).setVisible(state.visible);
    button.container.setData('accentColor', state.accentColor);
    button.container.setData('fillColor', state.fillColor);
    this.drawUpgradeHudButton(button);
  }

  private drawUpgradeHudButton(button: UpgradeButtonObjects): void {
    const accent = (button.container.getData('accentColor') as number | undefined) ?? 0x52ff9a;
    const fill = (button.container.getData('fillColor') as number | undefined) ?? 0x071018;
    const graphics = button.graphics;
    const width = UPGRADE_BUTTON_WIDTH;
    const height = UPGRADE_BUTTON_HEIGHT;
    const x = -width / 2;
    const y = -height / 2;
    const radius = 5;
    const hovered = button.hovered && button.container.visible;

    graphics.clear();
    if (!button.container.visible) {
      return;
    }

    if (hovered) {
      graphics.fillStyle(accent, 0.07);
      graphics.fillRoundedRect(x - 9, y - 8, width + 18, height + 16, radius + 8);
    }
    graphics.lineStyle(7, accent, hovered ? 0.16 : 0.08);
    graphics.strokeRoundedRect(x - 2, y - 2, width + 4, height + 4, radius + 2);
    graphics.fillStyle(0x02040a, 0.72);
    graphics.fillRoundedRect(x + 3, y + 4, width, height, radius);
    graphics.fillStyle(0x1b2634, hovered ? 0.98 : 0.92);
    graphics.fillRoundedRect(x, y, width, height, radius);
    graphics.fillStyle(0xf2fbff, hovered ? 0.16 : 0.08);
    graphics.fillRoundedRect(x + 4, y + 4, width - 8, Math.max(8, height * 0.28), radius);
    graphics.fillStyle(fill, 0.16);
    graphics.fillRoundedRect(x + 6, y + 10, width - 12, height - 18, Math.max(2, radius - 2));
    graphics.fillStyle(0xc89452, 0.48);
    graphics.fillRect(x + 8, y + 7, width - 16, 2);
    graphics.lineStyle(1, 0x02040a, 0.5);
    graphics.lineBetween(x + 7, y + height - 9, x + width - 7, y + height - 9);
    graphics.fillStyle(accent, hovered ? 0.3 : 0.2);
    graphics.fillRect(x + 10, y + height - 15, width - 20, 3);
    graphics.lineStyle(hovered ? 2.6 : 2.25, accent, hovered ? 0.98 : 0.68);
    graphics.strokeRoundedRect(x, y, width, height, radius);
    graphics.lineStyle(1, 0xf2fbff, hovered ? 0.24 : 0.13);
    graphics.strokeRoundedRect(x + 5, y + 5, width - 10, height - 10, Math.max(1, radius - 2));
    graphics.fillStyle(accent, hovered ? 0.9 : 0.68);
    graphics.fillRect(x + 10, y + height - 11, width - 20, 5);
    graphics.fillStyle(0xc89452, 0.72);
    graphics.fillCircle(x + 9, y + 9, 1.35);
    graphics.fillCircle(x + width - 9, y + 9, 1.35);
  }

  createOverlay(): void {
    this.destroyOverlayObjects();
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
      const cardX = this.getCardX(layout, i);
      const choiceText = this.scene.add
        .text(cardX + 18, layout.cardY + 18, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '12px',
          color: '#f2fbff',
          fixedWidth: layout.cardWidth - 36,
          wordWrap: { width: layout.cardWidth - 36, useAdvancedWrap: true },
          lineSpacing: 2
        })
        .setScrollFactor(0)
        .setDepth(1209);
      const metaText = this.scene.add
        .text(cardX + 18, layout.cardY + layout.cardHeight - 58, '', {
          fontFamily: 'Consolas, "Courier New", monospace',
          fontSize: '11px',
          color: '#a8c7ff',
          align: 'left',
          fixedWidth: layout.cardWidth - 36,
          wordWrap: { width: layout.cardWidth - 36, useAdvancedWrap: true }
        })
        .setScrollFactor(0)
        .setDepth(1209);

      this.upgradeOverlayChoiceTexts.push(choiceText);
      this.upgradeOverlayChoiceMetaTexts.push(metaText);

      const hitZone = this.scene.add
        .zone(cardX, layout.cardY, layout.cardWidth, layout.cardHeight)
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
      .text(layout.centerX, layout.headerY, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: Math.min(layout.width - 48, 940),
        lineSpacing: 4,
        wordWrap: { width: Math.min(layout.width - 48, 940), useAdvancedWrap: true }
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1201);

    this.upgradeOverlayPromptText = this.scene.add
      .text(layout.centerX, layout.promptY, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: Math.min(layout.width - 48, 940),
        wordWrap: { width: Math.min(layout.width - 48, 940), useAdvancedWrap: true }
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1201);

    this.hideOverlay();
  }

  private destroyOverlayObjects(): void {
    this.upgradeOverlayBlocker?.destroy();
    this.upgradeOverlayGraphics?.destroy();
    this.upgradeOverlayText?.destroy();
    this.upgradeOverlayPromptText?.destroy();

    for (const text of this.upgradeOverlayChoiceTexts) {
      text.destroy();
    }
    for (const text of this.upgradeOverlayChoiceMetaTexts) {
      text.destroy();
    }
    for (const hitZone of this.upgradeOverlayChoiceHitZones) {
      hitZone.destroy();
    }

    this.upgradeOverlayBlocker = undefined;
    this.upgradeOverlayGraphics = undefined;
    this.upgradeOverlayText = undefined;
    this.upgradeOverlayPromptText = undefined;
    this.upgradeOverlayChoiceTexts.length = 0;
    this.upgradeOverlayChoiceMetaTexts.length = 0;
    this.upgradeOverlayChoiceHitZones.length = 0;
  }

  renderOverlay(state: UpgradeOverlayRenderState<TChoice>): void {
    const canReroll = state.mode === 'normal';
    const choicePrompt =
      state.choices.length > 0
        ? canReroll
          ? `Click a card or press 1-${state.choices.length} to choose.  R rerolls for ${state.rerollCost} scrap.  Esc closes.`
          : `Click a card or press 1-${state.choices.length} to choose.  Esc closes.`
        : 'Esc closes.';

    this.drawCards(state.choices, state.isOpen);
    state.choices.forEach((choice, index) => {
      const text = this.upgradeOverlayChoiceTexts[index];
      const metaText = this.upgradeOverlayChoiceMetaTexts[index];
      if (!text || !metaText) {
        return;
      }

      text.setText(`${index + 1}. ${choice.name}\n\n${choice.description}`);
      if (choice.category === 'secondary-weapon') {
        metaText.setText('SECONDARY WEAPON\nRIGHT CLICK SLOT');
        return;
      }

      const level = state.getChoiceLevel(choice);
      const maxLevel = choice.maxLevel ? `/${choice.maxLevel}` : '';
      const maxLabel = state.isChoiceAtMaxLevel(choice) ? '  MAX' : '';
      metaText.setText(`${(choice.rarity ?? 'common').toUpperCase()}  ${choice.category.toUpperCase()}\nLEVEL ${level}${maxLevel}${maxLabel}`);
    });

    for (let i = state.choices.length; i < this.upgradeOverlayChoiceTexts.length; i += 1) {
      this.upgradeOverlayChoiceTexts[i].setText('');
      this.upgradeOverlayChoiceMetaTexts[i].setText('');
    }

    this.upgradeOverlayText?.setText(
      `${state.mode === 'rare' || state.isSpecialChoiceSet ? 'RARE UPGRADE CACHE' : 'UPGRADE SELECTION'}\n` +
        `Banked upgrades: ${state.bankedUpgrades}  Rare pending: ${state.pendingRareUpgrades}  Run scrap: ${state.runScrapTotal}\n` +
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

    this.upgradeOverlayText
      ?.setPosition(layout.centerX, layout.headerY)
      .setStyle({ fixedWidth: Math.min(layout.width - 48, 940) })
      .setWordWrapWidth(Math.min(layout.width - 48, 940), true);
    this.upgradeOverlayPromptText
      ?.setPosition(layout.centerX, layout.promptY)
      .setStyle({ fixedWidth: Math.min(layout.width - 48, 940) })
      .setWordWrapWidth(Math.min(layout.width - 48, 940), true);

    for (let i = 0; i < UPGRADE_OVERLAY_CHOICE_COUNT; i += 1) {
      const choice = choices[i];
      const cardX = this.getCardX(layout, i);
      const accentColor = choice && choice.category !== 'secondary-weapon' ? getUpgradeRarityColor(choice.rarity ?? 'common') : 0x42f5d7;
      const hitZone = this.upgradeOverlayChoiceHitZones[i];
      const text = this.upgradeOverlayChoiceTexts[i];
      const metaText = this.upgradeOverlayChoiceMetaTexts[i];

      drawCockpitCard(this.upgradeOverlayGraphics, cardX, layout.cardY, layout.cardWidth, layout.cardHeight, {
        accentColor: choice ? accentColor : 0x52627f,
        glow: Boolean(choice),
        dividerOffsets: [38, layout.cardHeight - 68]
      });
      this.upgradeOverlayGraphics.fillStyle(accentColor, choice ? 0.82 : 0.18);
      this.upgradeOverlayGraphics.fillRect(cardX + 18, layout.cardY + 38, layout.cardWidth - 36, 2);
      this.upgradeOverlayGraphics.fillStyle(accentColor, choice ? 0.18 : 0.06);
      this.upgradeOverlayGraphics.fillRoundedRect(cardX + 10, layout.cardY + 10, layout.cardWidth - 20, layout.cardHeight - 20, 4);

      text
        .setPosition(cardX + 18, layout.cardY + 18)
        .setStyle({ fixedWidth: layout.cardWidth - 36 })
        .setWordWrapWidth(layout.cardWidth - 36, true);
      metaText
        .setPosition(cardX + 18, layout.cardY + layout.cardHeight - 58)
        .setStyle({ fixedWidth: layout.cardWidth - 36 })
        .setWordWrapWidth(layout.cardWidth - 36, true);
      hitZone.setPosition(cardX, layout.cardY).setSize(layout.cardWidth, layout.cardHeight).setVisible(Boolean(choice));
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
    const availableWidth = Math.max(360, width - 96);
    const cardWidth = Math.min(
      UPGRADE_OVERLAY_CARD_WIDTH,
      (availableWidth - UPGRADE_OVERLAY_CARD_GAP * (UPGRADE_OVERLAY_CHOICE_COUNT - 1)) / UPGRADE_OVERLAY_CHOICE_COUNT
    );
    const cardHeight = Math.min(UPGRADE_OVERLAY_CARD_HEIGHT, Math.max(196, height - 276));
    const rowWidth = UPGRADE_OVERLAY_CHOICE_COUNT * cardWidth + (UPGRADE_OVERLAY_CHOICE_COUNT - 1) * UPGRADE_OVERLAY_CARD_GAP;
    const cardY = Phaser.Math.Clamp(height / 2 - cardHeight / 2 + 18, 150, Math.max(150, height - cardHeight - 118));

    return {
      width,
      height,
      centerX,
      cardStartX: centerX - rowWidth / 2,
      cardY,
      cardWidth,
      cardHeight,
      cardGap: UPGRADE_OVERLAY_CARD_GAP,
      headerY: Math.max(24, cardY - 88),
      promptY: Math.min(height - 72, cardY + cardHeight + 16)
    };
  }

  private getCardX(layout: UpgradeOverlayLayout, index: number): number {
    return layout.cardStartX + index * (layout.cardWidth + layout.cardGap);
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
