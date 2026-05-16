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
  baseY: number;
  setLabel: (label: string) => void;
}

const PANEL_WIDTH = 344;
const PANEL_PADDING = 14;
const COLUMN_WIDTH = 316;
const BUTTON_HEIGHT = 24;
const BUTTON_GAP = 6;
const ROW_GAP = 8;
const VALUE_LINE_HEIGHT = 15;
const SECTION_TITLE_HEIGHT = 20;
const TOOLTIP_WIDTH = 304;
const TOOLTIP_PADDING = 8;

export function createDebugMenu(scene: Phaser.Scene, config: DebugMenuConfig): DebugMenuController {
  const container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1400).setVisible(false);
  const valuesTextByKey = new Map<string, Phaser.GameObjects.Text>();
  const buttonsByKey = new Map<string, DebugButton>();
  const buttons: DebugButton[] = [];
  const buttonHitAreas: Phaser.GameObjects.Zone[] = [];
  const scrollButtons: DebugButton[] = [];
  let open = false;
  let scrollOffset = 0;
  let contentHeight = 0;

  const panelX = Math.max(0, scene.scale.width - PANEL_WIDTH);
  const panelY = 0;
  const panelHeight = scene.scale.height;
  const panelBlocker = scene.add
    .zone(panelX, panelY, PANEL_WIDTH, panelHeight)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1401)
    .setVisible(false)
    .setInteractive()
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .on('pointerup', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
    .disableInteractive();
  const background = scene.add.graphics();
  background.fillStyle(0x071018, 0.96);
  background.fillRect(panelX, panelY, PANEL_WIDTH, panelHeight);
  background.lineStyle(2, 0x42f5d7, 0.8);
  background.lineBetween(panelX, panelY, panelX, panelY + panelHeight);
  container.add(background);
  const content = scene.add.container(0, 0);
  container.add(content);

  const title = scene.add
    .text(panelX + PANEL_PADDING, panelY + 10, 'DEBUG', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '20px',
      color: '#f2fbff'
    })
    .setOrigin(0, 0);
  container.add(title);

  const tooltipBackground = scene.add.graphics().setVisible(false);
  const tooltipText = scene.add
    .text(0, 0, '', {
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '12px',
      color: '#f2fbff',
      fixedWidth: TOOLTIP_WIDTH - TOOLTIP_PADDING * 2,
      lineSpacing: 2,
      wordWrap: { width: TOOLTIP_WIDTH - TOOLTIP_PADDING * 2, useAdvancedWrap: true }
    })
    .setOrigin(0, 0)
    .setVisible(false);
  container.add([tooltipBackground, tooltipText]);

  addButton('close', panelX + PANEL_WIDTH - 78, panelY + 10, 64, 'Close', config.callbacks.close);

  const columnX = panelX + PANEL_PADDING;
  let y = panelY + 42;

  y = addSection(columnX, y, 'Run');
  addValue('run-state', columnX, y);
  y += VALUE_LINE_HEIGHT + BUTTON_GAP;
  addButton('debug-pause', columnX, y, COLUMN_WIDTH, 'Pause game', config.callbacks.toggleDebugPause);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Spawn Control');
  addValue('spawn-state', columnX, y);
  y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('enemy-spawning', columnX, y, COLUMN_WIDTH, 'Enemy spawning', config.callbacks.toggleEnemySpawning);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('spawn-chaser', columnX, y, 98, 'Chaser', () => config.callbacks.spawnEnemy('chaser'));
  addButton('spawn-shooter', columnX + 109, y, 98, 'Shooter', () => config.callbacks.spawnEnemy('shooter'));
  addButton('spawn-tank', columnX + 218, y, 98, 'Tank', () => config.callbacks.spawnEnemy('tank'));
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('clear-enemies', columnX, y, 154, 'Clear enemies', config.callbacks.clearEnemies);
  addButton('clear-asteroids', columnX + 162, y, 154, 'Clear asteroids', config.callbacks.clearAsteroids);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Asteroids');
  addValue('asteroid-state', columnX, y);
  y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  for (let tier = 1; tier <= 5; tier += 1) {
    addButton(`asteroid-${tier}`, columnX + (tier - 1) * 63, y, 55, `T${tier}`, () =>
      config.callbacks.spawnAsteroid(tier as DebugAsteroidTier)
    );
  }
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Player');
  addValue('player', columnX, y);
  y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('restore-hull', columnX, y, 101, 'Restore', config.callbacks.restorePlayerHull);
  addButton('player-invuln', columnX + 108, y, 101, 'Invuln', config.callbacks.togglePlayerInvulnerability);
  addButton('kill-player', columnX + 216, y, 100, 'Kill', config.callbacks.killPlayer);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Projectiles');
  addValue('projectiles', columnX, y);
  y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('clear-player-projectiles', columnX, y, 154, 'Clear player shots', config.callbacks.clearPlayerProjectiles);
  addButton('clear-enemy-projectiles', columnX + 162, y, 154, 'Clear enemy shots', config.callbacks.clearEnemyProjectiles);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Debris');
  addValue('debris', columnX, y);
  y += VALUE_LINE_HEIGHT + BUTTON_GAP;
  addButton('spawn-debris', columnX, y, 154, 'Spawn debris', config.callbacks.spawnDebris);
  addButton('clear-debris', columnX + 162, y, 154, 'Clear debris', config.callbacks.clearDebris);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Scrap');
  addValue('scrap', columnX, y);
  y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
  addButton('spawn-scrap', columnX, y, 101, 'Spawn', config.callbacks.spawnScrap);
  addButton('clear-scrap', columnX + 108, y, 101, 'Clear', config.callbacks.clearScrap);
  addButton('add-scrap', columnX + 216, y, 100, '+100', () => config.callbacks.addScrap(100));
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Credits');
  addValue('credits', columnX, y);
  y += VALUE_LINE_HEIGHT + BUTTON_GAP;
  addButton('add-credits', columnX, y, COLUMN_WIDTH, '+100 credits', () => config.callbacks.addCredits(100));
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Black Hole');
  addValue('black-hole', columnX, y);
  y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
  addButton('black-hole-radii', columnX, y, 154, 'Radii', config.callbacks.toggleBlackHoleRadii);
  addButton('black-hole-field-damage', columnX + 162, y, 154, 'Field damage', config.callbacks.toggleBlackHoleFieldDamage);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('collision-debug', columnX, y, COLUMN_WIDTH, 'Collision visuals', config.callbacks.toggleCollisionDebug);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Black Hole Field');
  addValue('black-hole-field', columnX, y);
  y += VALUE_LINE_HEIGHT * 10 + BUTTON_GAP;
  addButton('field-influence-down', columnX, y, 74, 'Inf -', () => config.callbacks.adjustBlackHoleInfluenceRadius(-0.5), 'Influence radius: how far black hole force reaches. Higher values can pull objects from farther away.');
  addButton('field-influence-up', columnX + 80, y, 74, 'Inf +', () => config.callbacks.adjustBlackHoleInfluenceRadius(0.5), 'Influence radius: how far black hole force reaches. Higher values can pull objects from farther away.');
  addButton('field-damage-down', columnX + 162, y, 74, 'DmgR -', () => config.callbacks.adjustBlackHoleDamageRadius(-0.5), 'Damage radius: where tidal damage starts. This does not change gravity range or visual size.');
  addButton('field-damage-up', columnX + 242, y, 74, 'DmgR +', () => config.callbacks.adjustBlackHoleDamageRadius(0.5), 'Damage radius: where tidal damage starts. This does not change gravity range or visual size.');
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-radial-down', columnX, y, 74, 'Rad -', () => config.callbacks.adjustBlackHoleRadialStrength(-0.1), 'Radial strength: direct inward pull toward the center.');
  addButton('field-radial-up', columnX + 80, y, 74, 'Rad +', () => config.callbacks.adjustBlackHoleRadialStrength(0.1), 'Radial strength: direct inward pull toward the center.');
  addButton('field-radial-curve-down', columnX + 162, y, 74, 'RCrv -', () => config.callbacks.adjustBlackHoleRadialCurve(-0.1), 'Radial curve: how sharply inward pull ramps near the center. Higher means weaker outside, stronger close in.');
  addButton('field-radial-curve-up', columnX + 242, y, 74, 'RCrv +', () => config.callbacks.adjustBlackHoleRadialCurve(0.1), 'Radial curve: how sharply inward pull ramps near the center. Higher means weaker outside, stronger close in.');
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-swirl-down', columnX, y, 74, 'Swirl -', () => config.callbacks.adjustBlackHoleSwirlStrength(-0.1), 'Swirl strength: sideways/orbital force. Higher values make objects whirlpool more.');
  addButton('field-swirl-up', columnX + 80, y, 74, 'Swirl +', () => config.callbacks.adjustBlackHoleSwirlStrength(0.1), 'Swirl strength: sideways/orbital force. Higher values make objects whirlpool more.');
  addButton('field-swirl-curve-down', columnX + 162, y, 74, 'SCrv -', () => config.callbacks.adjustBlackHoleSwirlCurve(-0.1), 'Swirl curve: how sharply swirl increases near the center. Higher values focus swirl close to the core.');
  addButton('field-swirl-curve-up', columnX + 242, y, 74, 'SCrv +', () => config.callbacks.adjustBlackHoleSwirlCurve(0.1), 'Swirl curve: how sharply swirl increases near the center. Higher values focus swirl close to the core.');
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-visc-down', columnX, y, 74, 'Visc -', () => config.callbacks.adjustBlackHoleViscosityStrength(-0.1), 'Viscosity: thick-liquid slowdown inside the field. Higher values make escape feel heavier.');
  addButton('field-visc-up', columnX + 80, y, 74, 'Visc +', () => config.callbacks.adjustBlackHoleViscosityStrength(0.1), 'Viscosity: thick-liquid slowdown inside the field. Higher values make escape feel heavier.');
  addButton('field-visc-curve-down', columnX + 162, y, 74, 'VCrv -', () => config.callbacks.adjustBlackHoleViscosityCurve(-0.1), 'Viscosity curve: how much slowdown concentrates near the center.');
  addButton('field-visc-curve-up', columnX + 242, y, 74, 'VCrv +', () => config.callbacks.adjustBlackHoleViscosityCurve(0.1), 'Viscosity curve: how much slowdown concentrates near the center.');
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-drag-down', columnX, y, 74, 'Drag -', () => config.callbacks.adjustBlackHoleInnerDrag(-0.1), 'Inner drag: velocity kept near the core. Lower values slow objects more at the center.');
  addButton('field-drag-up', columnX + 80, y, 74, 'Drag +', () => config.callbacks.adjustBlackHoleInnerDrag(0.1), 'Inner drag: velocity kept near the core. Lower values slow objects more at the center.');
  addButton('field-player-down', columnX + 162, y, 74, 'PRes -', () => config.callbacks.adjustBlackHolePlayerResistance(-0.1), 'Player resistance: reduces black hole pull, swirl, and viscosity on the player only.');
  addButton('field-player-up', columnX + 242, y, 74, 'PRes +', () => config.callbacks.adjustBlackHolePlayerResistance(0.1), 'Player resistance: reduces black hole pull, swirl, and viscosity on the player only.');
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-mass-down', columnX, y, 74, 'Mass -', () => config.callbacks.adjustBlackHoleMassResistance(-0.1), 'Mass resistance: makes heavier objects resist the black hole more.');
  addButton('field-mass-up', columnX + 80, y, 74, 'Mass +', () => config.callbacks.adjustBlackHoleMassResistance(0.1), 'Mass resistance: makes heavier objects resist the black hole more.');
  addButton('field-vel-down', columnX + 162, y, 74, 'Vel -', () => config.callbacks.adjustBlackHoleMaxVelocity(-0.1), 'Max velocity: caps speed after black hole force is applied.');
  addButton('field-vel-up', columnX + 242, y, 74, 'Vel +', () => config.callbacks.adjustBlackHoleMaxVelocity(0.1), 'Max velocity: caps speed after black hole force is applied.');
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-visual-down', columnX, y, 74, 'Vis -', () => config.callbacks.adjustBlackHoleVisualScale(-0.5), 'Visual scale: changes only the visible field/PNG size, not physics range.');
  addButton('field-visual-up', columnX + 80, y, 74, 'Vis +', () => config.callbacks.adjustBlackHoleVisualScale(0.5), 'Visual scale: changes only the visible field/PNG size, not physics range.');
  addButton('field-core-down', columnX + 162, y, 74, 'Core -', () => config.callbacks.adjustBlackHoleCoreScale(-0.1), 'Core size: changes the black center circle and event horizon consume radius.');
  addButton('field-core-up', columnX + 242, y, 74, 'Core +', () => config.callbacks.adjustBlackHoleCoreScale(0.1), 'Core size: changes the black center circle and event horizon consume radius.');
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-save-tuning', columnX, y, 154, 'Save field', config.callbacks.saveBlackHoleFieldTuning);
  addButton('field-load-tuning', columnX + 162, y, 154, 'Load field', config.callbacks.loadBlackHoleFieldTuning);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('field-reset', columnX, y, COLUMN_WIDTH, 'Reset field and visuals', config.callbacks.resetBlackHoleLensTuning);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Black Hole PNG Layers');
  addValue('black-hole-lenses', columnX, y);
  y += VALUE_LINE_HEIGHT * 6 + BUTTON_GAP;
  addButton('png-layer-prev', columnX, y, 74, 'Layer -', config.callbacks.selectPreviousBlackHolePngLayer);
  addButton('png-layer-next', columnX + 80, y, 74, 'Layer +', config.callbacks.selectNextBlackHolePngLayer);
  addButton('png-image-prev', columnX + 162, y, 74, 'Image -', () => config.callbacks.cycleBlackHolePngLayerImage(-1));
  addButton('png-image-next', columnX + 242, y, 74, 'Image +', () => config.callbacks.cycleBlackHolePngLayerImage(1));
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('png-speed-down', columnX, y, 74, 'Speed -', () => config.callbacks.adjustBlackHolePngLayerSpeed(-0.05));
  addButton('png-speed-up', columnX + 80, y, 74, 'Speed +', () => config.callbacks.adjustBlackHolePngLayerSpeed(0.05));
  addButton('png-size-down', columnX + 162, y, 74, 'Size -', () => config.callbacks.adjustBlackHolePngLayerSize(-0.05));
  addButton('png-size-up', columnX + 242, y, 74, 'Size +', () => config.callbacks.adjustBlackHolePngLayerSize(0.05));
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('png-alpha-down', columnX, y, 74, 'Alpha -', () => config.callbacks.adjustBlackHolePngLayerAlpha(-0.05));
  addButton('png-alpha-up', columnX + 80, y, 74, 'Alpha +', () => config.callbacks.adjustBlackHolePngLayerAlpha(0.05));
  addButton('png-toggle-layer', columnX + 162, y, 74, 'Toggle', config.callbacks.toggleBlackHolePngLayer);
  addButton('projection-lenses', columnX + 242, y, 74, 'All', config.callbacks.toggleBlackHoleProjectionLenses);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('png-add-image-prev', columnX, y, 101, 'Add img -', () => config.callbacks.cycleBlackHoleAddPngLayerImage(-1));
  addButton('png-add-image-next', columnX + 108, y, 101, 'Add img +', () => config.callbacks.cycleBlackHoleAddPngLayerImage(1));
  addButton('png-add-layer', columnX + 216, y, 100, 'Add +', config.callbacks.addBlackHolePngLayer);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('png-duplicate-layer', columnX, y, 154, 'Duplicate', config.callbacks.duplicateBlackHolePngLayer);
  addButton('png-remove-layer', columnX + 162, y, 154, 'Remove -', config.callbacks.removeBlackHolePngLayer);
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('png-save-setup', columnX, y, 154, 'Save .md', config.callbacks.saveBlackHolePngSetup);
  addButton('png-load-setup', columnX + 162, y, 154, 'Load .md', config.callbacks.loadBlackHolePngSetup);
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Weapon');
  addValue('weapon', columnX, y);
  y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
  addButton('damage-down', columnX, y, 74, 'Dmg -', () => config.callbacks.adjustPulseDamage(-0.5));
  addButton('damage-up', columnX + 80, y, 74, 'Dmg +', () => config.callbacks.adjustPulseDamage(0.5));
  addButton('fire-down', columnX + 162, y, 74, 'Fire -', () => config.callbacks.adjustPulseFireRate(-0.5));
  addButton('fire-up', columnX + 242, y, 74, 'Fire +', () => config.callbacks.adjustPulseFireRate(0.5));
  y += BUTTON_HEIGHT + BUTTON_GAP;
  addButton('cooldown-down', columnX, y, 154, 'Cooldown -', () => config.callbacks.adjustPulseCooldownSeconds(-0.05));
  addButton('cooldown-up', columnX + 162, y, 154, 'Cooldown +', () => config.callbacks.adjustPulseCooldownSeconds(0.05));
  y += BUTTON_HEIGHT + ROW_GAP;

  y = addSection(columnX, y, 'Background');
  addValue('background', columnX, y);
  y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
  addButton('background-stars', columnX, y, 154, 'Stars', config.callbacks.toggleBackgroundStars);
  addButton('parallax-reset', columnX + 162, y, 154, 'Reset bg', config.callbacks.resetStarfieldParallax);
  contentHeight = y + BUTTON_HEIGHT + PANEL_PADDING;

  scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
    if (!open) {
      return;
    }

    const maxScroll = Math.max(0, contentHeight - scene.scale.height);
    const nextOffset = Phaser.Math.Clamp(scrollOffset - Math.sign(deltaY) * 36, -maxScroll, 0);

    if (nextOffset !== scrollOffset) {
      scrollOffset = nextOffset;
      content.setY(scrollOffset);
      for (const button of scrollButtons) {
        button.hitArea.setY(button.baseY + scrollOffset);
      }
    }
  });

  function addSection(x: number, y: number, label: string): number {
    const text = scene.add
      .text(x, y, label, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#42f5d7'
      })
      .setOrigin(0, 0);
    content.add(text);
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
    content.add(text);
  }

  function addButton(
    key: string,
    x: number,
    y: number,
    width: number,
    label: string,
    callback: () => void,
    tooltip?: string
  ): DebugButton {
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
        if (tooltip) {
          showTooltip(tooltip, hitArea.y + BUTTON_HEIGHT + 5);
        }
      })
      .on('pointerout', () => {
        background.setFillStyle(0x111a24, 0.96);
        background.setStrokeStyle(1, 0x52627f, 0.9);
        text.setPosition(x + width / 2, y + BUTTON_HEIGHT / 2);
        hideTooltip();
      });

    hitArea.disableInteractive();

    content.add([background, text]);
    buttonHitAreas.push(hitArea);

    const button = {
      background,
      text,
      hitArea,
      baseY: y,
      setLabel: (nextLabel: string) => text.setText(nextLabel)
    };
    buttonsByKey.set(key, button);
    buttons.push(button);
    scrollButtons.push(button);

    return button;
  }

  function showTooltip(message: string, y: number): void {
    tooltipText.setText(message);
    const tooltipHeight = tooltipText.height + TOOLTIP_PADDING * 2;
    const tooltipX = panelX + PANEL_PADDING;
    const tooltipY = Phaser.Math.Clamp(y, panelY + 42, panelY + panelHeight - tooltipHeight - PANEL_PADDING);

    tooltipBackground.clear();
    tooltipBackground.fillStyle(0x02040a, 0.98);
    tooltipBackground.fillRoundedRect(tooltipX, tooltipY, TOOLTIP_WIDTH, tooltipHeight, 5);
    tooltipBackground.lineStyle(1, 0x42f5d7, 0.85);
    tooltipBackground.strokeRoundedRect(tooltipX, tooltipY, TOOLTIP_WIDTH, tooltipHeight, 5);
    tooltipBackground.setVisible(true);
    tooltipText
      .setPosition(tooltipX + TOOLTIP_PADDING, tooltipY + TOOLTIP_PADDING)
      .setVisible(true);
  }

  function hideTooltip(): void {
    tooltipBackground.setVisible(false);
    tooltipText.setVisible(false);
  }

  function setValue(key: string, value: string): void {
    valuesTextByKey.get(key)?.setText(value);
  }

  function setButtonLabel(key: string, value: string): void {
    buttonsByKey.get(key)?.setLabel(value);
  }

  function setButtonInputEnabled(isEnabled: boolean): void {
    panelBlocker.setVisible(isEnabled);
    if (isEnabled) {
      panelBlocker.setInteractive();
    } else {
      panelBlocker.disableInteractive();
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

    if (!isEnabled) {
      hideTooltip();
    }
  }

  setButtonInputEnabled(false);

  return {
    open: () => {
      open = true;
      scrollOffset = 0;
      content.setY(scrollOffset);
      for (const button of scrollButtons) {
        button.hitArea.setY(button.baseY);
      }
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
      setValue('run-state', `Game: ${values.debugGamePaused ? 'paused' : 'running'}`);
      setValue('spawn-state', `${values.spawnDirectorSummary}\nEnemies active: ${values.activeEnemies}`);
      setValue(
        'asteroid-state',
        `Asteroids active: ${values.activeAsteroids}\nSpawner: ${
          values.asteroidSpawningAvailable ? (values.asteroidSpawningEnabled ? 'on' : 'off') : 'not implemented'
        }`
      );
      setValue('projectiles', `Player: ${values.playerProjectiles}\nEnemy: ${values.enemyProjectiles}`);
      setValue('debris', `Active: ${values.activeDebris}`);
      setValue('scrap', `Pickups: ${values.activeScrapPickups}\nRun scrap: ${values.runScrapTotal}\nCredits: ${values.totalCredits}`);
      setValue('credits', `Banked: ${values.totalCredits}`);
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
        `Stars: ${values.backgroundStarsVisible ? 'on' : 'off'}\nFar ${values.starfieldFarParallax.toFixed(2)}\nMid ${values.starfieldMidParallax.toFixed(2)}\nNear ${values.starfieldNearParallax.toFixed(2)}`
      );
      setValue(
        'black-hole',
        `Radii: ${values.blackHoleRadiiVisible ? 'shown' : 'hidden'}\nDamage: ${
          values.blackHoleFieldDamageEnabled ? 'on' : 'off'
        } / collision: ${values.collisionDebugEnabled ? 'on' : 'off'}`
      );
      setValue(
        'black-hole-field',
        `Influence x${values.blackHoleInfluenceRadiusScale.toFixed(1)} / damage x${values.blackHoleDamageRadiusScale.toFixed(1)}\nVisual x${values.blackHoleVisualScale.toFixed(1)} / core x${values.blackHoleCoreScale.toFixed(1)}\nRadial x${values.blackHoleRadialStrengthMultiplier.toFixed(1)} / curve ${values.blackHoleRadialCurve.toFixed(1)}\nSwirl x${values.blackHoleSwirlStrengthMultiplier.toFixed(1)} / curve ${values.blackHoleSwirlCurve.toFixed(1)}\nVisc x${values.blackHoleViscosityStrength.toFixed(1)} / curve ${values.blackHoleViscosityCurve.toFixed(1)}\nInner drag ${values.blackHoleInnerDrag.toFixed(1)} / player resist x${values.blackHolePlayerResistance.toFixed(1)}\nMass resist x${values.blackHoleMassResistanceMultiplier.toFixed(1)} / max velocity x${values.blackHoleMaxVelocityMultiplier.toFixed(1)}`
      );
      const pngLayer = values.blackHoleSelectedPngLayer;
      setValue(
        'black-hole-lenses',
        pngLayer
          ? `Layer ${pngLayer.index + 1}/${values.blackHolePngLayerCount} ${pngLayer.enabled ? 'on' : 'off'} / all ${
              values.blackHoleProjectionLensLayersEnabled ? 'on' : 'off'
            }\nImage ${pngLayer.textureLabel}\nSpeed ${pngLayer.speedRps.toFixed(2)} rps / size ${pngLayer.sizeMultiplier.toFixed(2)}\nAlpha ${pngLayer.alpha.toFixed(2)} / add ${values.blackHoleAddPngTextureLabel}`
          : `No PNG layer selected\nAll layers ${values.blackHoleProjectionLensLayersEnabled ? 'on' : 'off'}\nAdd image ${values.blackHoleAddPngTextureLabel}`
      );
      setButtonLabel('debug-pause', `Pause game: ${values.debugGamePaused ? 'on' : 'off'}`);
      setButtonLabel('enemy-spawning', `Enemy spawning: ${values.enemySpawningEnabled ? 'on' : 'off'}`);
      setButtonLabel(
        'asteroid-spawning',
        values.asteroidSpawningAvailable
          ? `Asteroid spawning: ${values.asteroidSpawningEnabled ? 'on' : 'off'}`
          : 'Asteroid spawning unavailable'
      );
      setButtonLabel('player-invuln', `Debug invulnerability: ${values.playerInvulnerable ? 'on' : 'off'}`);
      setButtonLabel('background-stars', `Background stars: ${values.backgroundStarsVisible ? 'on' : 'off'}`);
      setButtonLabel('black-hole-radii', `Black hole radii: ${values.blackHoleRadiiVisible ? 'shown' : 'hidden'}`);
      setButtonLabel('black-hole-field-damage', `Field damage: ${values.blackHoleFieldDamageEnabled ? 'on' : 'off'}`);
      setButtonLabel('collision-debug', `Collision visuals: ${values.collisionDebugEnabled ? 'on' : 'off'}`);
      setButtonLabel('projection-lenses', `All: ${values.blackHoleProjectionLensLayersEnabled ? 'on' : 'off'}`);
      setButtonLabel('png-toggle-layer', `Layer: ${pngLayer?.enabled ? 'on' : 'off'}`);
    },
    destroy: () => {
      panelBlocker.destroy();
      for (const hitArea of buttonHitAreas) {
        hitArea.destroy();
      }
      container.destroy(true);
    }
  };
}
