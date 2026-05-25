import Phaser from 'phaser';

export interface CockpitCardOptions {
  accentColor?: number;
  glow?: boolean;
  dividerOffsets?: number[];
}

// Cockpit Card: compact dark cockpit panel with brass corner dots and optional cyan dividers.
export function drawCockpitCard(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  options: CockpitCardOptions = {}
): void {
  const accentColor = options.accentColor ?? 0x42f5d7;

  if (options.glow) {
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

  for (const offset of options.dividerOffsets ?? []) {
    const dividerY = y + offset;
    graphics.lineStyle(1, 0x42f5d7, 0.32);
    graphics.lineBetween(x + 18, dividerY, x + width - 18, dividerY);
  }

  graphics.fillStyle(0xc89452, 0.72);
  graphics.fillCircle(x + 11, y + 11, 1.8);
  graphics.fillCircle(x + width - 11, y + 11, 1.8);
  graphics.fillCircle(x + 11, y + height - 11, 1.8);
  graphics.fillCircle(x + width - 11, y + height - 11, 1.8);
}
