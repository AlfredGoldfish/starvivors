import Phaser from 'phaser';

export interface SecretControlOverlayValues {
  hull: number;
  maxHull: number;
  fuel: number;
  maxFuel: number;
  runScrapTotal: number;
  trainingInvulnerable: boolean;
  blackHoleActive: boolean;
}

export interface SecretControlOverlayCallbacks {
  close: () => void;
  restoreHull: () => void;
  refillFuel: () => void;
  emergencyTeleport: () => void;
  spawnScrapBurst: () => void;
  toggleTrainingInvulnerability: () => void;
  spawnEnemyWave: () => void;
  moveBlackHoleNear: () => void;
  moveBlackHoleFar: () => void;
}

export interface SecretControlOverlayController {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  containsPointer: (pointer: Phaser.Input.Pointer) => boolean;
  update: (values: SecretControlOverlayValues) => void;
  destroy: () => void;
}

const PANEL_WIDTH = 360;
const PANEL_PADDING = 16;
const BUTTON_HEIGHT = 30;
const BUTTON_GAP = 8;
const DEPTH = 1375;

export function createSecretControlOverlay(
  scene: Phaser.Scene,
  callbacks: SecretControlOverlayCallbacks
): SecretControlOverlayController {
  const panelX = Math.max(12, scene.scale.width - PANEL_WIDTH - 18);
  const panelY = 82;
  const panelHeight = 386;
  let open = false;
  const hitAreas: Phaser.GameObjects.Zone[] = [];

  const container = scene.add.container(0, 0).setScrollFactor(0).setDepth(DEPTH).setVisible(false);
  const blocker = scene.add
    .zone(panelX, panelY, PANEL_WIDTH, panelHeight)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(DEPTH + 1)
    .setVisible(false)
    .setInteractive()
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .on('pointermove', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .on('pointerup', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .disableInteractive();

  const background = scene.add.graphics();
  background.fillStyle(0x071018, 0.94);
  background.fillRoundedRect(panelX, panelY, PANEL_WIDTH, panelHeight, 6);
  background.lineStyle(2, 0xffc857, 0.9);
  background.strokeRoundedRect(panelX, panelY, PANEL_WIDTH, panelHeight, 6);
  container.add(background);

  const title = scene.add
    .text(panelX + PANEL_PADDING, panelY + 12, 'COMMAND OVERRIDE', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '18px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  container.add(title);

  const status = scene.add
    .text(panelX + PANEL_PADDING, panelY + 44, '', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '13px',
      color: '#c8f7ff',
      lineSpacing: 3
    })
    .setOrigin(0, 0);
  container.add(status);

  let y = panelY + 92;
  addButton('Restore hull', panelX + PANEL_PADDING, y, 154, callbacks.restoreHull);
  addButton('Refill fuel', panelX + PANEL_PADDING + 162, y, 154, callbacks.refillFuel);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('Safe teleport', panelX + PANEL_PADDING, y, 154, callbacks.emergencyTeleport);
  addButton('Scrap burst', panelX + PANEL_PADDING + 162, y, 154, callbacks.spawnScrapBurst);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  const invulnerableButton = addButton('Training invulnerability', panelX + PANEL_PADDING, y, 316, callbacks.toggleTrainingInvulnerability);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('Enemy wave', panelX + PANEL_PADDING, y, 154, callbacks.spawnEnemyWave);
  addButton('Black hole near', panelX + PANEL_PADDING + 162, y, 154, callbacks.moveBlackHoleNear);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('Black hole away', panelX + PANEL_PADDING, y, 154, callbacks.moveBlackHoleFar);
  addButton('Close', panelX + PANEL_PADDING + 162, y, 154, callbacks.close);

  function addButton(
    label: string,
    x: number,
    buttonY: number,
    width: number,
    onClick: () => void
  ): { setLabel: (nextLabel: string) => void } {
    const background = scene.add.rectangle(x, buttonY, width, BUTTON_HEIGHT, 0x111a24, 0.98).setOrigin(0, 0);
    background.setStrokeStyle(1, 0xffc857, 0.72);
    const text = scene.add
      .text(x + width / 2, buttonY + BUTTON_HEIGHT / 2, label, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '12px',
        color: '#f2fbff'
      })
      .setOrigin(0.5);
    const hitArea = scene.add
      .zone(x, buttonY, width, BUTTON_HEIGHT)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 2)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        onClick();
      })
      .on('pointerover', () => background.setFillStyle(0x1e3344, 1))
      .on('pointerout', () => background.setFillStyle(0x111a24, 0.98))
      .disableInteractive();

    container.add([background, text]);
    hitAreas.push(hitArea);

    return {
      setLabel: (nextLabel: string) => {
        text.setText(nextLabel);
      }
    };
  }

  function setVisible(nextOpen: boolean): void {
    open = nextOpen;
    container.setVisible(open);
    blocker.setVisible(open);
    if (open) {
      blocker.setInteractive();
      for (const hitArea of hitAreas) {
        hitArea.setInteractive({ useHandCursor: true });
      }
    } else {
      blocker.disableInteractive();
      for (const hitArea of hitAreas) {
        hitArea.disableInteractive();
      }
    }
  }

  return {
    open: () => setVisible(true),
    close: () => setVisible(false),
    toggle: () => setVisible(!open),
    isOpen: () => open,
    containsPointer: (pointer: Phaser.Input.Pointer) =>
      open &&
      pointer.x >= panelX &&
      pointer.x <= panelX + PANEL_WIDTH &&
      pointer.y >= panelY &&
      pointer.y <= panelY + panelHeight,
    update: (values: SecretControlOverlayValues) => {
      status.setText(
        `Hull ${Math.ceil(values.hull)} / ${Math.ceil(values.maxHull)}\n` +
          `Fuel ${Math.ceil(values.fuel)} / ${Math.ceil(values.maxFuel)}\n` +
          `Scrap ${values.runScrapTotal} / black hole ${values.blackHoleActive ? 'active' : 'inactive'}`
      );
      invulnerableButton.setLabel(`Training invulnerability: ${values.trainingInvulnerable ? 'on' : 'off'}`);
    },
    destroy: () => {
      blocker.destroy();
      for (const hitArea of hitAreas) {
        hitArea.destroy();
      }
      container.destroy(true);
    }
  };
}
