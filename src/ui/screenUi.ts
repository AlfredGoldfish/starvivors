import Phaser from 'phaser';

export const UI_FONT = 'Consolas, "Courier New", monospace';

export const UI_COLORS = {
  void: 0x02040a,
  panel: 0x071018,
  panelRaised: 0x0a121d,
  plate: 0x111a24,
  plateHot: 0x102633,
  brass: 0xffc857,
  cyan: 0x42f5d7,
  plasma: 0x73f2ff,
  magenta: 0xff4fd8,
  warning: 0xff5964,
  steel: 0x52627f,
  disabled: 0x151922
} as const;

function mixUiColor(from: number, to: number, amount: number): number {
  const t = Phaser.Math.Clamp(amount, 0, 1);
  const fromR = (from >> 16) & 0xff;
  const fromG = (from >> 8) & 0xff;
  const fromB = from & 0xff;
  const toR = (to >> 16) & 0xff;
  const toG = (to >> 8) & 0xff;
  const toB = to & 0xff;
  const r = Math.round(fromR + (toR - fromR) * t);
  const g = Math.round(fromG + (toG - fromG) * t);
  const b = Math.round(fromB + (toB - fromB) * t);

  return (r << 16) | (g << 8) | b;
}

export interface ScreenHandle {
  container: Phaser.GameObjects.Container;
  actionZones: Phaser.GameObjects.Zone[];
}

export interface ScreenButtonConfig {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  actionZones: Phaser.GameObjects.Zone[];
  screenCenterX: number;
  screenCenterY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  callback: () => void;
  isEnabled?: boolean;
  isSelected?: boolean;
  fontSize?: string;
  fillColor?: number;
  strokeColor?: number;
  isActionActive: () => boolean;
  resetCursor: () => void;
}

export interface CockpitPanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha?: number;
  accentColor?: number;
  fillColor?: number;
  headerHeight?: number;
  title?: string;
  titleScene?: Phaser.Scene;
  titleContainer?: Phaser.GameObjects.Container;
}

export function drawCockpitBackdrop(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  alpha = 1
): void {
  graphics.fillStyle(UI_COLORS.void, alpha);
  graphics.fillRect(-width / 2, -height / 2, width, height);
}

export function drawCockpitPanel(graphics: Phaser.GameObjects.Graphics, config: CockpitPanelConfig): void {
  const accent = config.accentColor ?? UI_COLORS.cyan;
  const fill = config.fillColor ?? UI_COLORS.panel;
  const alpha = config.alpha ?? 0.96;

  graphics.fillStyle(fill, alpha);
  graphics.fillRoundedRect(config.x, config.y, config.width, config.height, 8);
  graphics.lineStyle(2, accent, 0.82);
  graphics.strokeRoundedRect(config.x, config.y, config.width, config.height, 8);
  graphics.lineStyle(1, UI_COLORS.steel, 0.42);
  graphics.strokeRoundedRect(config.x + 7, config.y + 7, config.width - 14, config.height - 14, 5);

  if (config.title && config.titleScene && config.titleContainer) {
    config.titleContainer.add(
      config.titleScene.add
        .text(config.x + 18, config.y + 11, config.title, {
          fontFamily: UI_FONT,
          fontSize: '13px',
          color: '#73f2ff'
        })
        .setOrigin(0, 0)
    );
  }
}

export function drawCockpitDivider(
  graphics: Phaser.GameObjects.Graphics,
  x1: number,
  y: number,
  x2: number,
  color = UI_COLORS.steel,
  alpha = 0.5
): void {
  graphics.lineStyle(1, color, alpha);
  graphics.lineBetween(x1, y, x2, y);
}

export function addScreenButton(config: ScreenButtonConfig): void {
  const isEnabled = config.isEnabled ?? true;
  const isSelected = Boolean(config.isSelected && isEnabled);
  const buttonBackground = config.scene.add.graphics();
  const fill = isEnabled ? config.fillColor ?? (isSelected ? UI_COLORS.plateHot : UI_COLORS.plate) : UI_COLORS.disabled;
  const stroke = isEnabled ? config.strokeColor ?? (isSelected ? UI_COLORS.brass : UI_COLORS.cyan) : UI_COLORS.steel;
  let isPressed = false;

  const drawButtonBackground = (offset: number): void => {
    const pressedFill = isEnabled && isPressed ? mixUiColor(fill, UI_COLORS.void, 0.26) : fill;
    const highlightAlpha = isEnabled ? (isPressed ? 0.06 : 0.12) : 0.05;
    const strokeAlpha = isEnabled ? (isPressed ? 0.68 : 0.88) : 0.6;
    const x = config.x - config.width / 2 + offset;
    const y = config.y + offset;

    buttonBackground.clear();
    buttonBackground.fillStyle(pressedFill, isEnabled && isPressed ? 0.94 : 0.98);
    buttonBackground.fillRoundedRect(x, y, config.width, config.height, 6);
    buttonBackground.lineStyle(2, stroke, strokeAlpha);
    buttonBackground.strokeRoundedRect(x, y, config.width, config.height, 6);
    buttonBackground.fillStyle(stroke, highlightAlpha);
    buttonBackground.fillRoundedRect(x + 5, y + 5, config.width - 10, Math.max(8, config.height * 0.28), 4);
  };

  const buttonText = config.scene.add
    .text(config.x, config.y + config.height / 2, config.label, {
      fontFamily: UI_FONT,
      fontSize: config.fontSize ?? '16px',
      color: isEnabled ? '#f2fbff' : '#8090a6',
      align: 'center',
      fixedWidth: config.width - 10
    })
    .setOrigin(0.5);

  const redrawButton = (): void => {
    const offset = isEnabled && isPressed ? 2 : 0;
    drawButtonBackground(offset);
    buttonText.setPosition(config.x + offset, config.y + config.height / 2 + offset);
  };
  const setPressed = (pressed: boolean): void => {
    const nextPressed = Boolean(pressed && isEnabled && config.isActionActive());
    if (isPressed === nextPressed) {
      return;
    }

    isPressed = nextPressed;
    redrawButton();
  };

  redrawButton();

  const zone = config.scene.add
    .zone(config.screenCenterX + config.x - config.width / 2, config.screenCenterY + config.y, config.width, config.height)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1301)
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      setPressed(true);
    })
    .on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      const shouldRun = isPressed && isEnabled && config.isActionActive();
      setPressed(false);
      if (shouldRun) {
        config.callback();
      }
    })
    .on('pointerout', () => {
      setPressed(false);
      config.resetCursor();
    })
    .on('pointerupoutside', () => setPressed(false));

  if (isEnabled) {
    zone.setInteractive({ useHandCursor: true });
  }

  config.container.add([buttonBackground, buttonText]);
  config.actionZones.push(zone);
}

export function destroyScreenHandle(
  handle: ScreenHandle | undefined,
  options: { disableZones?: boolean; resetCursor?: () => void } = {}
): undefined {
  if (!handle) {
    return undefined;
  }

  for (const zone of handle.actionZones) {
    if (options.disableZones) {
      zone.disableInteractive();
    }
    zone.destroy();
  }

  options.resetCursor?.();
  handle.container.destroy(true);
  return undefined;
}
