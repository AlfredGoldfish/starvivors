import Phaser from 'phaser';
import type { DebugAsteroidTier, DebugMenuCallbacks, DebugMenuValues } from '../systems/debug/debugTypes';

export interface DebugMenuConfig {
  callbacks: DebugMenuCallbacks;
}

export interface DebugMenuController {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  update: (values: DebugMenuValues) => void;
  destroy: () => void;
}

interface DebugButton {
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Zone;
  setLabel: (label: string) => void;
}

const PANEL_WIDTH = 920;
const PANEL_HEIGHT = 720;
const PANEL_PADDING = 20;
const COLUMN_WIDTH = 286;
const BUTTON_HEIGHT = 28;
const BUTTON_GAP = 8;
const ROW_GAP = 10;
const VALUE_LINE_HEIGHT = 18;
const SECTION_TITLE_HEIGHT = 24;

export function createDebugMenu(scene: Phaser.Scene, config: DebugMenuConfig): DebugMenuController {
  const container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1400).setVisible(false);
  const valuesTextByKey = new Map<string, Phaser.GameObjects.Text>();
  const buttonsByKey = new Map<string, DebugButton>();
  const buttons: DebugButton[] = [];
  const buttonHitAreas: Phaser.GameObjects.Zone[] = [];
  let open = false;

  const panelX = Math.max(12, (scene.scale.width - PANEL_WIDTH) / 2);
  const panelY = Math.max(12, (scene.scale.height - PANEL_HEIGHT) / 2);
  const blocker = scene.add
    .zone(0, 0, scene.scale.width, scene.scale.height)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1401)
    .setVisible(false)
    .setInteractive()
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .on('pointerup', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .disableInteractive();
  const background = scene.add.graphics();
  background.fillStyle(0x02040a, 0.9);
  background.fillRect(0, 0, scene.scale.width, scene.scale.height);
  background.fillStyle(0x071018, 0.98);
  background.fillRoundedRect(panelX, panelY, PANEL_WIDTH, PANEL_HEIGHT, 8);
  background.lineStyle(2, 0x42f5d7, 0.8);
  background.strokeRoundedRect(panelX, panelY, PANEL_WIDTH, PANEL_HEIGHT, 8);
  container.add(background);

  const title = scene.add
    .text(panelX + PANEL_PADDING, panelY + 14, 'DEBUG MENU', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '22px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  container.add(title);

  addButton('close', panelX + PANEL_WIDTH - 106, panelY + 14, 84, 'Close', config.callbacks.close);

  const columnXs = [
    panelX + PANEL_PADDING,
    panelX + PANEL_PADDING + COLUMN_WIDTH + 12,
    panelX + PANEL_PADDING + (COLUMN_WIDTH + 12) * 2
  ];
  let leftY = panelY + 58;
  let midY = panelY + 58;
  let rightY = panelY + 58;

  leftY = addSection(columnXs[0], leftY, 'Spawn Control');
  addValue('spawn-state', columnXs[0], leftY);
  leftY += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('enemy-spawning', columnXs[0], leftY, COLUMN_WIDTH, 'Enemy spawning', config.callbacks.toggleEnemySpawning);
  leftY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('spawn-chaser', columnXs[0], leftY, 88, 'Chaser', () => config.callbacks.spawnEnemy('chaser'));
  addButton('spawn-shooter', columnXs[0] + 98, leftY, 88, 'Shooter', () => config.callbacks.spawnEnemy('shooter'));
  addButton('spawn-tank', columnXs[0] + 196, leftY, 88, 'Tank', () => config.callbacks.spawnEnemy('tank'));
  leftY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('clear-enemies', columnXs[0], leftY, COLUMN_WIDTH, 'Clear enemies', config.callbacks.clearEnemies);
  leftY += BUTTON_HEIGHT + ROW_GAP;

  leftY = addSection(columnXs[0], leftY, 'Asteroid Testing');
  addValue('asteroid-state', columnXs[0], leftY);
  leftY += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('asteroid-spawning', columnXs[0], leftY, COLUMN_WIDTH, 'Asteroid spawning unavailable', config.callbacks.toggleAsteroidSpawning);
  leftY += BUTTON_HEIGHT + BUTTON_GAP;
  for (let tier = 1; tier <= 5; tier += 1) {
    addButton(`asteroid-${tier}`, columnXs[0] + (tier - 1) * 56, leftY, 48, `T${tier}`, () =>
      config.callbacks.spawnAsteroid(tier as DebugAsteroidTier)
    );
  }
  leftY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('clear-asteroids', columnXs[0], leftY, COLUMN_WIDTH, 'Clear asteroids', config.callbacks.clearAsteroids);

  midY = addSection(columnXs[1], midY, 'Projectile Cleanup');
  addValue('projectiles', columnXs[1], midY);
  midY += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('clear-player-projectiles', columnXs[1], midY, COLUMN_WIDTH, 'Clear player projectiles', config.callbacks.clearPlayerProjectiles);
  midY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('clear-enemy-projectiles', columnXs[1], midY, COLUMN_WIDTH, 'Clear enemy projectiles', config.callbacks.clearEnemyProjectiles);
  midY += BUTTON_HEIGHT + ROW_GAP;

  midY = addSection(columnXs[1], midY, 'Player Testing');
  addValue('player', columnXs[1], midY);
  midY += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('restore-hull', columnXs[1], midY, COLUMN_WIDTH, 'Restore hull', config.callbacks.restorePlayerHull);
  midY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('player-invuln', columnXs[1], midY, COLUMN_WIDTH, 'Debug invulnerability', config.callbacks.togglePlayerInvulnerability);
  midY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('kill-player', columnXs[1], midY, COLUMN_WIDTH, 'Kill player', config.callbacks.killPlayer);
  midY += BUTTON_HEIGHT + ROW_GAP;

  midY = addSection(columnXs[1], midY, 'Background Tuning');
  addValue('background', columnXs[1], midY);
  midY += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
  addButton('far-parallax-down', columnXs[1], midY, 64, 'Far -', () => config.callbacks.adjustStarfieldParallax('far', -1));
  addButton('far-parallax-up', columnXs[1] + 74, midY, 64, 'Far +', () => config.callbacks.adjustStarfieldParallax('far', 1));
  addButton('mid-parallax-down', columnXs[1] + 148, midY, 64, 'Mid -', () => config.callbacks.adjustStarfieldParallax('mid', -1));
  addButton('mid-parallax-up', columnXs[1] + 222, midY, 64, 'Mid +', () => config.callbacks.adjustStarfieldParallax('mid', 1));
  midY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('near-parallax-down', columnXs[1], midY, 138, 'Near -', () => config.callbacks.adjustStarfieldParallax('near', -1));
  addButton('near-parallax-up', columnXs[1] + 148, midY, 138, 'Near +', () => config.callbacks.adjustStarfieldParallax('near', 1));
  midY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('parallax-reset', columnXs[1], midY, COLUMN_WIDTH, 'Reset background tuning', config.callbacks.resetStarfieldParallax);

  rightY = addSection(columnXs[2], rightY, 'Weapon Testing');
  addValue('weapon', columnXs[2], rightY);
  rightY += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
  addButton('damage-down', columnXs[2], rightY, 64, 'Dmg -', () => config.callbacks.adjustPulseDamage(-0.5));
  addButton('damage-up', columnXs[2] + 74, rightY, 64, 'Dmg +', () => config.callbacks.adjustPulseDamage(0.5));
  addButton('fire-down', columnXs[2] + 148, rightY, 64, 'Fire -', () => config.callbacks.adjustPulseFireRate(-0.5));
  addButton('fire-up', columnXs[2] + 222, rightY, 64, 'Fire +', () => config.callbacks.adjustPulseFireRate(0.5));
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('cooldown-down', columnXs[2], rightY, 138, 'Cooldown -0.05s', () =>
    config.callbacks.adjustPulseCooldownSeconds(-0.05)
  );
  addButton('cooldown-up', columnXs[2] + 148, rightY, 138, 'Cooldown +0.05s', () =>
    config.callbacks.adjustPulseCooldownSeconds(0.05)
  );
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('weapon-reset', columnXs[2], rightY, COLUMN_WIDTH, 'Reset weapon tuning', config.callbacks.resetWeaponTuning);
  rightY += BUTTON_HEIGHT + ROW_GAP;

  rightY = addSection(columnXs[2], rightY, 'Black Hole Debug');
  addValue('black-hole', columnXs[2], rightY);
  rightY += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('ring-color', columnXs[2], rightY, COLUMN_WIDTH, 'Cycle ring color', config.callbacks.cycleBlackHoleRingDebugColor);
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('black-hole-radii', columnXs[2], rightY, COLUMN_WIDTH, 'Black hole radii', config.callbacks.toggleBlackHoleRadii);
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('black-hole-field-damage', columnXs[2], rightY, COLUMN_WIDTH, 'Field damage', config.callbacks.toggleBlackHoleFieldDamage);
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('collision-debug', columnXs[2], rightY, COLUMN_WIDTH, 'Collision visuals', config.callbacks.toggleCollisionDebug);
  rightY += BUTTON_HEIGHT + ROW_GAP;

  rightY = addSection(columnXs[2], rightY, 'Black Hole Lenses');
  addValue('black-hole-lenses', columnXs[2], rightY);
  rightY += VALUE_LINE_HEIGHT * 5 + BUTTON_GAP;
  addButton('lens-orbit-down', columnXs[2], rightY, 64, 'Orbit -', () => config.callbacks.adjustBlackHoleLensOrbit(-0.1));
  addButton('lens-orbit-up', columnXs[2] + 74, rightY, 64, 'Orbit +', () => config.callbacks.adjustBlackHoleLensOrbit(0.1));
  addButton('lens-density-down', columnXs[2] + 148, rightY, 64, 'Dens -', () => config.callbacks.adjustBlackHoleLensDensity(-1));
  addButton('lens-density-up', columnXs[2] + 222, rightY, 64, 'Dens +', () => config.callbacks.adjustBlackHoleLensDensity(1));
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('lens-length-down', columnXs[2], rightY, 138, 'Length -', () => config.callbacks.adjustBlackHoleLensLength(-0.1));
  addButton('lens-length-up', columnXs[2] + 148, rightY, 138, 'Length +', () => config.callbacks.adjustBlackHoleLensLength(0.1));
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-scale-down', columnXs[2], rightY, 138, 'Field -', () => config.callbacks.adjustBlackHoleFieldScale(-0.5));
  addButton('field-scale-up', columnXs[2] + 148, rightY, 138, 'Field +', () => config.callbacks.adjustBlackHoleFieldScale(0.5));
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('projection-lenses', columnXs[2], rightY, COLUMN_WIDTH, 'Projection lens layers', config.callbacks.toggleBlackHoleProjectionLenses);
  rightY += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('lens-reset', columnXs[2], rightY, COLUMN_WIDTH, 'Reset lens tuning', config.callbacks.resetBlackHoleLensTuning);

  function addSection(x: number, y: number, label: string): number {
    const text = scene.add
      .text(x, y, label, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#42f5d7'
      })
      .setOrigin(0, 0);
    container.add(text);
    return y + SECTION_TITLE_HEIGHT;
  }

  function addValue(key: string, x: number, y: number): void {
    const text = scene.add
      .text(x, y, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff',
        lineSpacing: 2
      })
      .setOrigin(0, 0);
    valuesTextByKey.set(key, text);
    container.add(text);
  }

  function addButton(key: string, x: number, y: number, width: number, label: string, callback: () => void): DebugButton {
    const background = scene.add
      .rectangle(x, y, width, BUTTON_HEIGHT, 0x111a24, 0.96)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x52627f, 0.9);

    const text = scene.add
      .text(x + width / 2, y + BUTTON_HEIGHT / 2, label, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '12px',
        color: '#f2fbff',
        align: 'center',
        fixedWidth: width - 10
      })
      .setOrigin(0.5, 0.5);

    background
      .on('pointerover', () => background.setFillStyle(0x182434, 0.98))
      .on('pointerout', () => background.setFillStyle(0x111a24, 0.96));

    const hitArea = scene.add
      .zone(x, y, width, BUTTON_HEIGHT)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1402)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (open) {
          background.setFillStyle(0x0a121c, 1);
          background.setStrokeStyle(1, 0x42f5d7, 1);
          text.setPosition(x + width / 2 + 1, y + BUTTON_HEIGHT / 2 + 1);
        }
      })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        if (!open) {
          return;
        }

        background.setFillStyle(0x182434, 0.98);
        background.setStrokeStyle(1, 0x42f5d7, 0.9);
        text.setPosition(x + width / 2, y + BUTTON_HEIGHT / 2);
        callback();
      })
      .on('pointerover', () => {
        if (!open) {
          return;
        }

        background.setFillStyle(0x182434, 0.98);
        background.setStrokeStyle(1, 0x42f5d7, 0.9);
      })
      .on('pointerout', () => {
        background.setFillStyle(0x111a24, 0.96);
        background.setStrokeStyle(1, 0x52627f, 0.9);
        text.setPosition(x + width / 2, y + BUTTON_HEIGHT / 2);
      });

    hitArea.disableInteractive();

    container.add([background, text]);
    buttonHitAreas.push(hitArea);

    const button = {
      background,
      text,
      hitArea,
      setLabel: (nextLabel: string) => text.setText(nextLabel)
    };
    buttonsByKey.set(key, button);
    buttons.push(button);

    return button;
  }

  function setValue(key: string, value: string): void {
    valuesTextByKey.get(key)?.setText(value);
  }

  function setButtonLabel(key: string, value: string): void {
    buttonsByKey.get(key)?.setLabel(value);
  }

  function setButtonInputEnabled(isEnabled: boolean): void {
    blocker.setVisible(isEnabled);

    if (isEnabled) {
      blocker.setInteractive();
    } else {
      blocker.disableInteractive();
    }

    for (const hitArea of buttonHitAreas) {
      hitArea.setVisible(isEnabled);

      if (isEnabled) {
        hitArea.setInteractive({ useHandCursor: true });
      } else {
        hitArea.disableInteractive();
      }
    }

    for (const button of buttons) {
      button.background.setFillStyle(0x111a24, 0.96);
      button.background.setStrokeStyle(1, 0x52627f, 0.9);
    }
  }

  setButtonInputEnabled(false);

  return {
    open: () => {
      open = true;
      container.setVisible(true);
      setButtonInputEnabled(true);
    },
    close: () => {
      open = false;
      container.setVisible(false);
      setButtonInputEnabled(false);
    },
    toggle: () => {
      open = !open;
      container.setVisible(open);
      setButtonInputEnabled(open);
    },
    isOpen: () => open,
    update: (values: DebugMenuValues) => {
      setValue('spawn-state', `${values.spawnDirectorSummary}\nEnemies active: ${values.activeEnemies}`);
      setValue(
        'asteroid-state',
        `Asteroids active: ${values.activeAsteroids}\nSpawner: ${
          values.asteroidSpawningAvailable ? (values.asteroidSpawningEnabled ? 'on' : 'off') : 'not implemented'
        }`
      );
      setValue('projectiles', `Player: ${values.playerProjectiles}\nEnemy: ${values.enemyProjectiles}`);
      setValue(
        'player',
        `Hull: ${Math.ceil(values.playerHull)} / ${Math.ceil(values.playerMaxHull)}\nInvulnerability: ${
          values.playerInvulnerable ? 'on' : 'off'
        }`
      );
      setValue(
        'weapon',
        `Damage x${values.pulseDamageMultiplier.toFixed(1)}\nFire x${values.pulseFireRateMultiplier.toFixed(1)}\nCooldown ${values.pulseCooldownSeconds.toFixed(2)}s`
      );
      setValue(
        'background',
        `Far ${values.starfieldFarParallax.toFixed(2)}\nMid ${values.starfieldMidParallax.toFixed(2)}\nNear ${values.starfieldNearParallax.toFixed(2)}`
      );
      setValue(
        'black-hole',
        `Ring color: ${values.blackHoleRingDebugColorMode}\nRadii: ${
          values.blackHoleRadiiVisible ? 'shown' : 'hidden'
        } / damage: ${values.blackHoleFieldDamageEnabled ? 'on' : 'off'} / collision: ${values.collisionDebugEnabled ? 'on' : 'off'}`
      );
      setValue(
        'black-hole-lenses',
        `Orbit x${values.blackHoleLensOrbitSpeedMultiplier.toFixed(1)}\nDensity ${values.blackHoleLensDensity}\nLength x${values.blackHoleLensLengthMultiplier.toFixed(1)}\nProjection ${
          values.blackHoleProjectionLensLayersEnabled ? 'on' : 'off'
        }\nField x${values.blackHoleFieldScaleMultiplier.toFixed(1)}`
      );
      setButtonLabel('enemy-spawning', `Enemy spawning: ${values.enemySpawningEnabled ? 'on' : 'off'}`);
      setButtonLabel(
        'asteroid-spawning',
        values.asteroidSpawningAvailable
          ? `Asteroid spawning: ${values.asteroidSpawningEnabled ? 'on' : 'off'}`
          : 'Asteroid spawning unavailable'
      );
      setButtonLabel('player-invuln', `Debug invulnerability: ${values.playerInvulnerable ? 'on' : 'off'}`);
      setButtonLabel('black-hole-radii', `Black hole radii: ${values.blackHoleRadiiVisible ? 'shown' : 'hidden'}`);
      setButtonLabel('black-hole-field-damage', `Field damage: ${values.blackHoleFieldDamageEnabled ? 'on' : 'off'}`);
      setButtonLabel('collision-debug', `Collision visuals: ${values.collisionDebugEnabled ? 'on' : 'off'}`);
      setButtonLabel('projection-lenses', `Projection lens layers: ${values.blackHoleProjectionLensLayersEnabled ? 'on' : 'off'}`);
    },
    destroy: () => {
      blocker.destroy();
      for (const hitArea of buttonHitAreas) {
        hitArea.destroy();
      }
      container.destroy(true);
    }
  };
}
