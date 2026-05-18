import Phaser from 'phaser';

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
  isActionActive: () => boolean;
  resetCursor: () => void;
}

export function addScreenButton(config: ScreenButtonConfig): void {
  const isEnabled = config.isEnabled ?? true;
  const buttonBackground = config.scene.add.graphics();
  buttonBackground.fillStyle(isEnabled ? 0x111a24 : 0x151922, 0.98);
  buttonBackground.fillRoundedRect(config.x - config.width / 2, config.y, config.width, config.height, 6);
  buttonBackground.lineStyle(2, isEnabled ? 0x42f5d7 : 0x52627f, isEnabled ? 0.88 : 0.6);
  buttonBackground.strokeRoundedRect(config.x - config.width / 2, config.y, config.width, config.height, 6);

  const buttonText = config.scene.add
    .text(config.x, config.y + config.height / 2, config.label, {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '16px',
      color: isEnabled ? '#f2fbff' : '#8090a6',
      align: 'center',
      fixedWidth: config.width - 10
    })
    .setOrigin(0.5);

  const zone = config.scene.add
    .zone(config.screenCenterX + config.x - config.width / 2, config.screenCenterY + config.y, config.width, config.height)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1301)
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .on('pointerup', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      if (isEnabled && config.isActionActive()) {
        config.callback();
      }
    })
    .on('pointerout', () => config.resetCursor());

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
