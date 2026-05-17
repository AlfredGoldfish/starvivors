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

type DebugTabId = 'run' | 'ship' | 'weapons' | 'physics' | 'spawns' | 'blackHole' | 'visuals';

interface DebugTab {
  id: DebugTabId;
  label: string;
}

interface DebugButton {
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Zone;
  baseY: number;
  tabId?: DebugTabId;
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
const TOOLTIP_GAP = 10;
const TAB_HEIGHT = 22;
const TAB_GAP = 5;
const CONTENT_TOP = 102;
const TABS: DebugTab[] = [
  { id: 'run', label: 'Run' },
  { id: 'ship', label: 'Ship' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'physics', label: 'Physics' },
  { id: 'spawns', label: 'Spawns' },
  { id: 'blackHole', label: 'Black Hole' },
  { id: 'visuals', label: 'Visuals' }
];

const DEBUG_TOOLTIPS: Record<string, string> = {
  close: 'Close the debug panel. Current debug tuning values remain active.',
  'tab-run': 'Run controls for pause state, player hull, invulnerability, and economy.',
  'tab-ship': 'Ship readouts for current hull, movement stats, shields, and projectiles.',
  'tab-weapons': 'Weapon tuning controls for temporary damage, fire-rate, and cooldown testing.',
  'tab-physics': 'Physics tuning for player control, enemy movement, and asteroid collision feel.',
  'tab-spawns': 'Spawn and clear enemies, asteroids, debris, and scrap for encounter testing.',
  'tab-blackHole': 'Black hole debug controls for radii, field forces, damage, and PNG lens layers.',
  'tab-visuals': 'Background and parallax controls for visual testing.',
  'run-state': 'Shows whether the debug pause toggle is currently stopping game updates.',
  player: 'Shows player hull and debug invulnerability state.',
  scrap: 'Shows active scrap pickups, current run scrap, and total credits.',
  'debug-pause': 'Toggle debug pause. Use it to freeze gameplay while inspecting state.',
  'restore-hull': 'Restore the player hull to full for survival and collision testing.',
  'player-invuln': 'Toggle debug invulnerability. Useful for testing hazards without ending the run.',
  'kill-player': 'Immediately defeat the player to test death, results, and restart behavior.',
  'spawn-scrap': 'Spawn a scrap pickup near the player.',
  'clear-scrap': 'Remove active scrap pickups from the scene.',
  'add-scrap': 'Add 100 run scrap without spawning pickups.',
  'add-credits': 'Add 100 permanent credits for shop and economy testing.',
  'ship-stats': 'Live player ship stats after ship selection, upgrades, and debug physics tuning.',
  'shield-state': 'Shows Ramming Shield HP and dash charges when the shield is equipped.',
  projectiles: 'Shows active player and enemy projectile counts.',
  'clear-player-projectiles': 'Remove active player projectiles without changing enemies or rewards.',
  'clear-enemy-projectiles': 'Remove active enemy projectiles without changing enemies.',
  weapon: 'Current temporary weapon tuning multipliers.',
  'damage-down': 'Decrease weapon damage multiplier for debug testing.',
  'damage-up': 'Increase weapon damage multiplier for debug testing.',
  'fire-down': 'Decrease weapon fire-rate multiplier.',
  'fire-up': 'Increase weapon fire-rate multiplier.',
  'cooldown-down': 'Shorten the current weapon cooldown.',
  'cooldown-up': 'Lengthen the current weapon cooldown.',
  'weapon-reset': 'Reset temporary weapon damage and fire-rate tuning.',
  'physics-player': 'Live player movement values after ship stats and debug physics multipliers.',
  'player-thrust-down': 'Decrease forward thrust. Lower values make acceleration weaker.',
  'player-thrust-up': 'Increase forward thrust. Higher values make acceleration stronger.',
  'player-brake-down': 'Decrease reverse/brake thrust.',
  'player-brake-up': 'Increase reverse/brake thrust.',
  'player-strafe-down': 'Decrease side thrust.',
  'player-strafe-up': 'Increase side thrust.',
  'player-inertia-down': 'Decrease control inertia scaling. Lower values make control more sluggish.',
  'player-inertia-up': 'Increase control inertia scaling. Higher values make control more responsive.',
  'player-mass-exp-down': 'Decrease how strongly mass reduces player control.',
  'player-mass-exp-up': 'Increase how strongly mass reduces player control.',
  'physics-enemy': 'Current enemy movement tuning multipliers used by active enemy steering.',
  'enemy-speed-down': 'Decrease enemy target movement speed.',
  'enemy-speed-up': 'Increase enemy target movement speed.',
  'enemy-response-down': 'Decrease enemy steering response/thrust.',
  'enemy-response-up': 'Increase enemy steering response/thrust.',
  'enemy-mass-exp-down': 'Decrease how strongly mass slows enemy steering response.',
  'enemy-mass-exp-up': 'Increase how strongly mass slows enemy steering response.',
  'physics-asteroids': 'Current asteroid collision damage and impulse tuning.',
  'asteroid-damage-down': 'Decrease asteroid-vs-asteroid collision damage scaling.',
  'asteroid-damage-up': 'Increase asteroid-vs-asteroid collision damage scaling.',
  'asteroid-impulse-down': 'Decrease asteroid collision knockback impulse.',
  'asteroid-impulse-up': 'Increase asteroid collision knockback impulse.',
  'physics-reset': 'Reset player, enemy, and asteroid physics tuning to debug defaults.',
  'spawn-state': 'Shows spawn director timing and active enemy count.',
  'enemy-spawning': 'Toggle automatic enemy spawning.',
  'spawn-chaser': 'Spawn one Chaser enemy near the play area.',
  'spawn-shooter': 'Spawn one Shooter enemy near the play area.',
  'spawn-tank': 'Spawn one Tank enemy near the play area.',
  'clear-enemies': 'Remove active enemies without granting rewards.',
  'asteroid-state': 'Shows active asteroids and asteroid spawner state.',
  'asteroid-1': 'Spawn a tier 1 asteroid.',
  'asteroid-2': 'Spawn a tier 2 asteroid.',
  'asteroid-3': 'Spawn a tier 3 asteroid.',
  'asteroid-4': 'Spawn a tier 4 asteroid.',
  'asteroid-5': 'Spawn a tier 5 asteroid.',
  'clear-asteroids': 'Remove active asteroids.',
  debris: 'Shows active debris count.',
  'spawn-debris': 'Spawn debris for collision and cleanup testing.',
  'clear-debris': 'Remove active debris.',
  'black-hole': 'Shows black hole radii, field damage, and collision visualization state.',
  'black-hole-radii': 'Toggle black hole radius guide rendering.',
  'black-hole-field-damage': 'Toggle damage from the black hole field.',
  'collision-debug': 'Toggle collision debug visuals, including black hole collision guides.',
  'black-hole-field': 'Current black hole field force, radius, drag, and visual tuning.',
  'field-influence-down': 'Decrease black hole influence radius.',
  'field-influence-up': 'Increase black hole influence radius.',
  'field-damage-down': 'Decrease black hole damage radius.',
  'field-damage-up': 'Increase black hole damage radius.',
  'field-radial-down': 'Decrease inward radial pull strength.',
  'field-radial-up': 'Increase inward radial pull strength.',
  'field-radial-curve-down': 'Flatten radial pull falloff curve.',
  'field-radial-curve-up': 'Steepen radial pull falloff curve.',
  'field-swirl-down': 'Decrease tangential swirl force.',
  'field-swirl-up': 'Increase tangential swirl force.',
  'field-swirl-curve-down': 'Flatten swirl force falloff curve.',
  'field-swirl-curve-up': 'Steepen swirl force falloff curve.',
  'field-visc-down': 'Decrease viscosity force that drags objects with the field.',
  'field-visc-up': 'Increase viscosity force that drags objects with the field.',
  'field-visc-curve-down': 'Flatten viscosity falloff curve.',
  'field-visc-curve-up': 'Steepen viscosity falloff curve.',
  'field-drag-down': 'Decrease extra inner drag near the core.',
  'field-drag-up': 'Increase extra inner drag near the core.',
  'field-player-down': 'Decrease player resistance to black hole forces.',
  'field-player-up': 'Increase player resistance to black hole forces.',
  'field-mass-down': 'Decrease mass-based resistance to black hole forces.',
  'field-mass-up': 'Increase mass-based resistance to black hole forces.',
  'field-vel-down': 'Decrease black hole force velocity cap.',
  'field-vel-up': 'Increase black hole force velocity cap.',
  'field-visual-down': 'Decrease black hole visual radius scale.',
  'field-visual-up': 'Increase black hole visual radius scale.',
  'field-core-down': 'Decrease black hole core visual scale.',
  'field-core-up': 'Increase black hole core visual scale.',
  'field-save-tuning': 'Save current black hole field tuning.',
  'field-load-tuning': 'Load saved black hole field tuning.',
  'field-reset': 'Reset black hole field and visual tuning.',
  'black-hole-lenses': 'Current selected black hole PNG lens layer and add-layer image selection.',
  'png-layer-prev': 'Select previous black hole PNG layer.',
  'png-layer-next': 'Select next black hole PNG layer.',
  'png-image-prev': 'Cycle selected layer image backward.',
  'png-image-next': 'Cycle selected layer image forward.',
  'png-speed-down': 'Decrease selected PNG layer rotation speed.',
  'png-speed-up': 'Increase selected PNG layer rotation speed.',
  'png-size-down': 'Decrease selected PNG layer size.',
  'png-size-up': 'Increase selected PNG layer size.',
  'png-alpha-down': 'Decrease selected PNG layer opacity.',
  'png-alpha-up': 'Increase selected PNG layer opacity.',
  'png-toggle-layer': 'Toggle selected PNG layer visibility.',
  'projection-lenses': 'Toggle all black hole PNG projection lens layers.',
  'png-add-image-prev': 'Cycle new-layer image selection backward.',
  'png-add-image-next': 'Cycle new-layer image selection forward.',
  'png-add-layer': 'Add a new PNG lens layer using the selected add image.',
  'png-duplicate-layer': 'Duplicate the selected PNG lens layer.',
  'png-remove-layer': 'Remove the selected PNG lens layer.',
  'png-save-setup': 'Save current PNG lens layer setup to markdown.',
  'png-load-setup': 'Load PNG lens layer setup from markdown.',
  background: 'Current background star visibility and parallax values.',
  'background-stars': 'Toggle background star rendering.',
  'parallax-reset': 'Reset background parallax tuning.',
  'far-parallax-down': 'Decrease far starfield parallax.',
  'far-parallax-up': 'Increase far starfield parallax.',
  'mid-parallax-down': 'Decrease mid starfield parallax.',
  'mid-parallax-up': 'Increase mid starfield parallax.',
  'near-parallax-down': 'Decrease near starfield parallax.',
  'near-parallax-up': 'Increase near starfield parallax.'
};

export function createDebugMenu(scene: Phaser.Scene, config: DebugMenuConfig): DebugMenuController {
  const container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1400).setVisible(false);
  const valuesTextByKey = new Map<string, Phaser.GameObjects.Text>();
  const buttonsByKey = new Map<string, DebugButton>();
  const buttons: DebugButton[] = [];
  const buttonHitAreas: Phaser.GameObjects.Zone[] = [];
  const valueHitAreas: Phaser.GameObjects.Zone[] = [];
  const tabButtons: DebugButton[] = [];
  const contentButtons: DebugButton[] = [];
  const tabContents = new Map<DebugTabId, Phaser.GameObjects.Container>();
  const contentHeightByTab = new Map<DebugTabId, number>();
  let open = false;
  let activeTab: DebugTabId = 'run';
  let scrollOffset = 0;

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
  tooltipBackground.setDepth(1410).setScrollFactor(0);
  tooltipText.setDepth(1411).setScrollFactor(0);

  addButton(undefined, 'close', panelX + PANEL_WIDTH - 78, panelY + 10, 64, 'Close', config.callbacks.close);

  for (const tab of TABS) {
    const content = scene.add.container(0, 0).setVisible(tab.id === activeTab);
    tabContents.set(tab.id, content);
    container.add(content);
  }

  createTabButtons();
  buildRunTab();
  buildShipTab();
  buildWeaponsTab();
  buildPhysicsTab();
  buildSpawnsTab();
  buildBlackHoleTab();
  buildVisualsTab();
  selectTab(activeTab);

  scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
    if (!open) {
      return;
    }

    const maxScroll = Math.max(0, (contentHeightByTab.get(activeTab) ?? 0) - scene.scale.height);
    const nextOffset = Phaser.Math.Clamp(scrollOffset - Math.sign(deltaY) * 36, -maxScroll, 0);

    if (nextOffset !== scrollOffset) {
      scrollOffset = nextOffset;
      applyActiveTabScroll();
    }
  });

  function createTabButtons(): void {
    const tabX = panelX + PANEL_PADDING;
    const tabY = panelY + 42;
    const widths = [45, 45, 76, 67, 62, 91, 62];
    let x = tabX;
    let y = tabY;

    for (let i = 0; i < TABS.length; i += 1) {
      const tab = TABS[i];
      const width = widths[i];
      if (x + width > panelX + PANEL_WIDTH - PANEL_PADDING) {
        x = tabX;
        y += TAB_HEIGHT + TAB_GAP;
      }

      const button = addButton(undefined, `tab-${tab.id}`, x, y, width, tab.label, () => selectTab(tab.id));
      tabButtons.push(button);
      x += width + TAB_GAP;
    }
  }

  function buildRunTab(): void {
    let y = CONTENT_TOP;
    y = addSection('run', y, 'Run');
    addValue('run-state', 'run', y, VALUE_LINE_HEIGHT);
    y += VALUE_LINE_HEIGHT + BUTTON_GAP;
    addButton('run', 'debug-pause', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Pause game', config.callbacks.toggleDebugPause);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('run', y, 'Player');
    addValue('player', 'run', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    addButton('run', 'restore-hull', panelX + PANEL_PADDING, y, 101, 'Restore', config.callbacks.restorePlayerHull);
    addButton('run', 'player-invuln', panelX + PANEL_PADDING + 108, y, 101, 'Invuln', config.callbacks.togglePlayerInvulnerability);
    addButton('run', 'kill-player', panelX + PANEL_PADDING + 216, y, 100, 'Kill', config.callbacks.killPlayer);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('run', y, 'Economy');
    addValue('scrap', 'run', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
    addButton('run', 'spawn-scrap', panelX + PANEL_PADDING, y, 101, 'Spawn', config.callbacks.spawnScrap);
    addButton('run', 'clear-scrap', panelX + PANEL_PADDING + 108, y, 101, 'Clear', config.callbacks.clearScrap);
    addButton('run', 'add-scrap', panelX + PANEL_PADDING + 216, y, 100, '+100', () => config.callbacks.addScrap(100));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('run', 'add-credits', panelX + PANEL_PADDING, y, COLUMN_WIDTH, '+100 credits', () => config.callbacks.addCredits(100));
    setTabContentHeight('run', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildShipTab(): void {
    let y = CONTENT_TOP;
    y = addSection('ship', y, 'Ship Stats');
    addValue('ship-stats', 'ship', y, VALUE_LINE_HEIGHT * 8);
    y += VALUE_LINE_HEIGHT * 8 + ROW_GAP;
    y = addSection('ship', y, 'Ramming Shield');
    addValue('shield-state', 'ship', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + ROW_GAP;
    y = addSection('ship', y, 'Projectiles');
    addValue('projectiles', 'ship', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    addButton('ship', 'clear-player-projectiles', panelX + PANEL_PADDING, y, 154, 'Clear player shots', config.callbacks.clearPlayerProjectiles);
    addButton('ship', 'clear-enemy-projectiles', panelX + PANEL_PADDING + 162, y, 154, 'Clear enemy shots', config.callbacks.clearEnemyProjectiles);
    setTabContentHeight('ship', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildWeaponsTab(): void {
    let y = CONTENT_TOP;
    y = addSection('weapons', y, 'Weapon Tuning');
    addValue('weapon', 'weapons', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
    addButton('weapons', 'damage-down', panelX + PANEL_PADDING, y, 74, 'Dmg -', () => config.callbacks.adjustWeaponDamage(-0.5));
    addButton('weapons', 'damage-up', panelX + PANEL_PADDING + 80, y, 74, 'Dmg +', () => config.callbacks.adjustWeaponDamage(0.5));
    addButton('weapons', 'fire-down', panelX + PANEL_PADDING + 162, y, 74, 'Fire -', () => config.callbacks.adjustWeaponFireRate(-0.5));
    addButton('weapons', 'fire-up', panelX + PANEL_PADDING + 242, y, 74, 'Fire +', () => config.callbacks.adjustWeaponFireRate(0.5));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('weapons', 'cooldown-down', panelX + PANEL_PADDING, y, 154, 'Cooldown -', () => config.callbacks.adjustWeaponCooldownSeconds(-0.05));
    addButton('weapons', 'cooldown-up', panelX + PANEL_PADDING + 162, y, 154, 'Cooldown +', () => config.callbacks.adjustWeaponCooldownSeconds(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('weapons', 'weapon-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset weapon tuning', config.callbacks.resetWeaponTuning);
    setTabContentHeight('weapons', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildPhysicsTab(): void {
    let y = CONTENT_TOP;
    y = addSection('physics', y, 'Player Physics');
    addValue('physics-player', 'physics', y, VALUE_LINE_HEIGHT * 7);
    y += VALUE_LINE_HEIGHT * 7 + BUTTON_GAP;
    addButtonPair('physics', 'player-thrust', y, 'Thrust', () => config.callbacks.adjustPlayerThrustScale(-0.05), () => config.callbacks.adjustPlayerThrustScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-brake', y, 'Brake', () => config.callbacks.adjustPlayerBrakeScale(-0.05), () => config.callbacks.adjustPlayerBrakeScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-strafe', y, 'Strafe', () => config.callbacks.adjustPlayerStrafeScale(-0.05), () => config.callbacks.adjustPlayerStrafeScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-inertia', y, 'Inertia', () => config.callbacks.adjustPlayerInertiaScale(-0.05), () => config.callbacks.adjustPlayerInertiaScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-mass-exp', y, 'MassExp', () => config.callbacks.adjustPlayerControlMassExponent(-0.05), () => config.callbacks.adjustPlayerControlMassExponent(0.05));
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('physics', y, 'Enemy Physics');
    addValue('physics-enemy', 'physics', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
    addButtonPair('physics', 'enemy-speed', y, 'Speed', () => config.callbacks.adjustEnemySpeedScale(-0.05), () => config.callbacks.adjustEnemySpeedScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'enemy-response', y, 'Thrust', () => config.callbacks.adjustEnemyResponseScale(-0.05), () => config.callbacks.adjustEnemyResponseScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'enemy-mass-exp', y, 'MassExp', () => config.callbacks.adjustEnemyMassExponent(-0.05), () => config.callbacks.adjustEnemyMassExponent(0.05));
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('physics', y, 'Asteroid Collisions');
    addValue('physics-asteroids', 'physics', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    addButtonPair('physics', 'asteroid-damage', y, 'Damage', () => config.callbacks.adjustAsteroidCollisionDamageScale(-0.05), () => config.callbacks.adjustAsteroidCollisionDamageScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'asteroid-impulse', y, 'Impulse', () => config.callbacks.adjustAsteroidCollisionImpulseScale(-0.05), () => config.callbacks.adjustAsteroidCollisionImpulseScale(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('physics', 'physics-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset physics tuning', config.callbacks.resetPhysicsTuning);
    setTabContentHeight('physics', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildSpawnsTab(): void {
    let y = CONTENT_TOP;
    y = addSection('spawns', y, 'Enemy Spawns');
    addValue('spawn-state', 'spawns', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    addButton('spawns', 'enemy-spawning', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Enemy spawning', config.callbacks.toggleEnemySpawning);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'spawn-chaser', panelX + PANEL_PADDING, y, 98, 'Chaser', () => config.callbacks.spawnEnemy('chaser'));
    addButton('spawns', 'spawn-shooter', panelX + PANEL_PADDING + 109, y, 98, 'Shooter', () => config.callbacks.spawnEnemy('shooter'));
    addButton('spawns', 'spawn-tank', panelX + PANEL_PADDING + 218, y, 98, 'Tank', () => config.callbacks.spawnEnemy('tank'));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'clear-enemies', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Clear enemies', config.callbacks.clearEnemies);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('spawns', y, 'Asteroids');
    addValue('asteroid-state', 'spawns', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    for (let tier = 1; tier <= 5; tier += 1) {
      addButton(`spawns`, `asteroid-${tier}`, panelX + PANEL_PADDING + (tier - 1) * 63, y, 55, `T${tier}`, () =>
        config.callbacks.spawnAsteroid(tier as DebugAsteroidTier)
      );
    }
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'clear-asteroids', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Clear asteroids', config.callbacks.clearAsteroids);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('spawns', y, 'Debris');
    addValue('debris', 'spawns', y, VALUE_LINE_HEIGHT);
    y += VALUE_LINE_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'spawn-debris', panelX + PANEL_PADDING, y, 154, 'Spawn debris', config.callbacks.spawnDebris);
    addButton('spawns', 'clear-debris', panelX + PANEL_PADDING + 162, y, 154, 'Clear debris', config.callbacks.clearDebris);
    setTabContentHeight('spawns', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildBlackHoleTab(): void {
    let y = CONTENT_TOP;
    y = addSection('blackHole', y, 'Black Hole');
    addValue('black-hole', 'blackHole', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    addButton('blackHole', 'black-hole-radii', panelX + PANEL_PADDING, y, 154, 'Radii', config.callbacks.toggleBlackHoleRadii);
    addButton('blackHole', 'black-hole-field-damage', panelX + PANEL_PADDING + 162, y, 154, 'Field damage', config.callbacks.toggleBlackHoleFieldDamage);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('blackHole', 'collision-debug', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Collision visuals', config.callbacks.toggleCollisionDebug);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('blackHole', y, 'Field');
    addValue('black-hole-field', 'blackHole', y, VALUE_LINE_HEIGHT * 10);
    y += VALUE_LINE_HEIGHT * 10 + BUTTON_GAP;
    addBlackHoleFieldButtons('blackHole', y);
    y += (BUTTON_HEIGHT + BUTTON_GAP) * 7;
    addButton('blackHole', 'field-save-tuning', panelX + PANEL_PADDING, y, 154, 'Save field', config.callbacks.saveBlackHoleFieldTuning);
    addButton('blackHole', 'field-load-tuning', panelX + PANEL_PADDING + 162, y, 154, 'Load field', config.callbacks.loadBlackHoleFieldTuning);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('blackHole', 'field-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset field and visuals', config.callbacks.resetBlackHoleLensTuning);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('blackHole', y, 'PNG Layers');
    addValue('black-hole-lenses', 'blackHole', y, VALUE_LINE_HEIGHT * 6);
    y += VALUE_LINE_HEIGHT * 6 + BUTTON_GAP;
    addBlackHoleLayerButtons('blackHole', y);
    setTabContentHeight('blackHole', y + (BUTTON_HEIGHT + BUTTON_GAP) * 6 + PANEL_PADDING);
  }

  function buildVisualsTab(): void {
    let y = CONTENT_TOP;
    y = addSection('visuals', y, 'Background');
    addValue('background', 'visuals', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButton('visuals', 'background-stars', panelX + PANEL_PADDING, y, 154, 'Stars', config.callbacks.toggleBackgroundStars);
    addButton('visuals', 'parallax-reset', panelX + PANEL_PADDING + 162, y, 154, 'Reset bg', config.callbacks.resetStarfieldParallax);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('visuals', 'far-parallax-down', panelX + PANEL_PADDING, y, 74, 'Far -', () => config.callbacks.adjustStarfieldParallax('far', -1));
    addButton('visuals', 'far-parallax-up', panelX + PANEL_PADDING + 80, y, 74, 'Far +', () => config.callbacks.adjustStarfieldParallax('far', 1));
    addButton('visuals', 'mid-parallax-down', panelX + PANEL_PADDING + 162, y, 74, 'Mid -', () => config.callbacks.adjustStarfieldParallax('mid', -1));
    addButton('visuals', 'mid-parallax-up', panelX + PANEL_PADDING + 242, y, 74, 'Mid +', () => config.callbacks.adjustStarfieldParallax('mid', 1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('visuals', 'near-parallax-down', panelX + PANEL_PADDING, y, 154, 'Near -', () => config.callbacks.adjustStarfieldParallax('near', -1));
    addButton('visuals', 'near-parallax-up', panelX + PANEL_PADDING + 162, y, 154, 'Near +', () => config.callbacks.adjustStarfieldParallax('near', 1));
    setTabContentHeight('visuals', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function addBlackHoleFieldButtons(tabId: DebugTabId, y: number): void {
    addButton(tabId, 'field-influence-down', panelX + PANEL_PADDING, y, 74, 'Inf -', () => config.callbacks.adjustBlackHoleInfluenceRadius(-0.5));
    addButton(tabId, 'field-influence-up', panelX + PANEL_PADDING + 80, y, 74, 'Inf +', () => config.callbacks.adjustBlackHoleInfluenceRadius(0.5));
    addButton(tabId, 'field-damage-down', panelX + PANEL_PADDING + 162, y, 74, 'DmgR -', () => config.callbacks.adjustBlackHoleDamageRadius(-0.5));
    addButton(tabId, 'field-damage-up', panelX + PANEL_PADDING + 242, y, 74, 'DmgR +', () => config.callbacks.adjustBlackHoleDamageRadius(0.5));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'field-radial-down', panelX + PANEL_PADDING, y, 74, 'Rad -', () => config.callbacks.adjustBlackHoleRadialStrength(-0.1));
    addButton(tabId, 'field-radial-up', panelX + PANEL_PADDING + 80, y, 74, 'Rad +', () => config.callbacks.adjustBlackHoleRadialStrength(0.1));
    addButton(tabId, 'field-radial-curve-down', panelX + PANEL_PADDING + 162, y, 74, 'RCrv -', () => config.callbacks.adjustBlackHoleRadialCurve(-0.1));
    addButton(tabId, 'field-radial-curve-up', panelX + PANEL_PADDING + 242, y, 74, 'RCrv +', () => config.callbacks.adjustBlackHoleRadialCurve(0.1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'field-swirl-down', panelX + PANEL_PADDING, y, 74, 'Swirl -', () => config.callbacks.adjustBlackHoleSwirlStrength(-0.1));
    addButton(tabId, 'field-swirl-up', panelX + PANEL_PADDING + 80, y, 74, 'Swirl +', () => config.callbacks.adjustBlackHoleSwirlStrength(0.1));
    addButton(tabId, 'field-swirl-curve-down', panelX + PANEL_PADDING + 162, y, 74, 'SCrv -', () => config.callbacks.adjustBlackHoleSwirlCurve(-0.1));
    addButton(tabId, 'field-swirl-curve-up', panelX + PANEL_PADDING + 242, y, 74, 'SCrv +', () => config.callbacks.adjustBlackHoleSwirlCurve(0.1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'field-visc-down', panelX + PANEL_PADDING, y, 74, 'Visc -', () => config.callbacks.adjustBlackHoleViscosityStrength(-0.1));
    addButton(tabId, 'field-visc-up', panelX + PANEL_PADDING + 80, y, 74, 'Visc +', () => config.callbacks.adjustBlackHoleViscosityStrength(0.1));
    addButton(tabId, 'field-visc-curve-down', panelX + PANEL_PADDING + 162, y, 74, 'VCrv -', () => config.callbacks.adjustBlackHoleViscosityCurve(-0.1));
    addButton(tabId, 'field-visc-curve-up', panelX + PANEL_PADDING + 242, y, 74, 'VCrv +', () => config.callbacks.adjustBlackHoleViscosityCurve(0.1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'field-drag-down', panelX + PANEL_PADDING, y, 74, 'Drag -', () => config.callbacks.adjustBlackHoleInnerDrag(-0.1));
    addButton(tabId, 'field-drag-up', panelX + PANEL_PADDING + 80, y, 74, 'Drag +', () => config.callbacks.adjustBlackHoleInnerDrag(0.1));
    addButton(tabId, 'field-player-down', panelX + PANEL_PADDING + 162, y, 74, 'PRes -', () => config.callbacks.adjustBlackHolePlayerResistance(-0.1));
    addButton(tabId, 'field-player-up', panelX + PANEL_PADDING + 242, y, 74, 'PRes +', () => config.callbacks.adjustBlackHolePlayerResistance(0.1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'field-mass-down', panelX + PANEL_PADDING, y, 74, 'Mass -', () => config.callbacks.adjustBlackHoleMassResistance(-0.1));
    addButton(tabId, 'field-mass-up', panelX + PANEL_PADDING + 80, y, 74, 'Mass +', () => config.callbacks.adjustBlackHoleMassResistance(0.1));
    addButton(tabId, 'field-vel-down', panelX + PANEL_PADDING + 162, y, 74, 'Vel -', () => config.callbacks.adjustBlackHoleMaxVelocity(-0.1));
    addButton(tabId, 'field-vel-up', panelX + PANEL_PADDING + 242, y, 74, 'Vel +', () => config.callbacks.adjustBlackHoleMaxVelocity(0.1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'field-visual-down', panelX + PANEL_PADDING, y, 74, 'Vis -', () => config.callbacks.adjustBlackHoleVisualScale(-0.5));
    addButton(tabId, 'field-visual-up', panelX + PANEL_PADDING + 80, y, 74, 'Vis +', () => config.callbacks.adjustBlackHoleVisualScale(0.5));
    addButton(tabId, 'field-core-down', panelX + PANEL_PADDING + 162, y, 74, 'Core -', () => config.callbacks.adjustBlackHoleCoreScale(-0.1));
    addButton(tabId, 'field-core-up', panelX + PANEL_PADDING + 242, y, 74, 'Core +', () => config.callbacks.adjustBlackHoleCoreScale(0.1));
  }

  function addBlackHoleLayerButtons(tabId: DebugTabId, y: number): void {
    addButton(tabId, 'png-layer-prev', panelX + PANEL_PADDING, y, 74, 'Layer -', config.callbacks.selectPreviousBlackHolePngLayer);
    addButton(tabId, 'png-layer-next', panelX + PANEL_PADDING + 80, y, 74, 'Layer +', config.callbacks.selectNextBlackHolePngLayer);
    addButton(tabId, 'png-image-prev', panelX + PANEL_PADDING + 162, y, 74, 'Image -', () => config.callbacks.cycleBlackHolePngLayerImage(-1));
    addButton(tabId, 'png-image-next', panelX + PANEL_PADDING + 242, y, 74, 'Image +', () => config.callbacks.cycleBlackHolePngLayerImage(1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'png-speed-down', panelX + PANEL_PADDING, y, 74, 'Speed -', () => config.callbacks.adjustBlackHolePngLayerSpeed(-0.05));
    addButton(tabId, 'png-speed-up', panelX + PANEL_PADDING + 80, y, 74, 'Speed +', () => config.callbacks.adjustBlackHolePngLayerSpeed(0.05));
    addButton(tabId, 'png-size-down', panelX + PANEL_PADDING + 162, y, 74, 'Size -', () => config.callbacks.adjustBlackHolePngLayerSize(-0.05));
    addButton(tabId, 'png-size-up', panelX + PANEL_PADDING + 242, y, 74, 'Size +', () => config.callbacks.adjustBlackHolePngLayerSize(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'png-alpha-down', panelX + PANEL_PADDING, y, 74, 'Alpha -', () => config.callbacks.adjustBlackHolePngLayerAlpha(-0.05));
    addButton(tabId, 'png-alpha-up', panelX + PANEL_PADDING + 80, y, 74, 'Alpha +', () => config.callbacks.adjustBlackHolePngLayerAlpha(0.05));
    addButton(tabId, 'png-toggle-layer', panelX + PANEL_PADDING + 162, y, 74, 'Toggle', config.callbacks.toggleBlackHolePngLayer);
    addButton(tabId, 'projection-lenses', panelX + PANEL_PADDING + 242, y, 74, 'All', config.callbacks.toggleBlackHoleProjectionLenses);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'png-add-image-prev', panelX + PANEL_PADDING, y, 101, 'Add img -', () => config.callbacks.cycleBlackHoleAddPngLayerImage(-1));
    addButton(tabId, 'png-add-image-next', panelX + PANEL_PADDING + 108, y, 101, 'Add img +', () => config.callbacks.cycleBlackHoleAddPngLayerImage(1));
    addButton(tabId, 'png-add-layer', panelX + PANEL_PADDING + 216, y, 100, 'Add +', config.callbacks.addBlackHolePngLayer);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'png-duplicate-layer', panelX + PANEL_PADDING, y, 154, 'Duplicate', config.callbacks.duplicateBlackHolePngLayer);
    addButton(tabId, 'png-remove-layer', panelX + PANEL_PADDING + 162, y, 154, 'Remove -', config.callbacks.removeBlackHolePngLayer);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'png-save-setup', panelX + PANEL_PADDING, y, 154, 'Save .md', config.callbacks.saveBlackHolePngSetup);
    addButton(tabId, 'png-load-setup', panelX + PANEL_PADDING + 162, y, 154, 'Load .md', config.callbacks.loadBlackHolePngSetup);
  }

  function addButtonPair(
    tabId: DebugTabId,
    keyPrefix: string,
    y: number,
    label: string,
    downCallback: () => void,
    upCallback: () => void
  ): void {
    addButton(tabId, `${keyPrefix}-down`, panelX + PANEL_PADDING, y, 154, `${label} -`, downCallback);
    addButton(tabId, `${keyPrefix}-up`, panelX + PANEL_PADDING + 162, y, 154, `${label} +`, upCallback);
  }

  function addSection(tabId: DebugTabId, y: number, label: string): number {
    const text = scene.add
      .text(panelX + PANEL_PADDING, y, label, {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '16px',
        color: '#42f5d7'
      })
      .setOrigin(0, 0);
    tabContents.get(tabId)?.add(text);
    return y + SECTION_TITLE_HEIGHT;
  }

  function addValue(key: string, tabId: DebugTabId, y: number, height: number): void {
    const text = scene.add
      .text(panelX + PANEL_PADDING, y, '', {
        fontFamily: 'Consolas, "Courier New", monospace',
        fontSize: '13px',
        color: '#c8f7ff',
        lineSpacing: 2
      })
      .setOrigin(0, 0);
    valuesTextByKey.set(key, text);
    tabContents.get(tabId)?.add(text);

    const tooltip = DEBUG_TOOLTIPS[key];
    if (!tooltip) {
      return;
    }

    const hitArea = scene.add
      .zone(panelX + PANEL_PADDING, y, COLUMN_WIDTH, height)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1402)
      .setVisible(false)
      .setInteractive()
      .on('pointerover', () => {
        if (open) {
          showTooltip(tooltip);
        }
      })
      .on('pointerout', hideTooltip);
    hitArea.setData('baseY', y);
    hitArea.setData('tabId', tabId);
    hitArea.disableInteractive();
    valueHitAreas.push(hitArea);
  }

  function addButton(
    tabId: DebugTabId | undefined,
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
        const message = tooltip ?? DEBUG_TOOLTIPS[key];
        if (message) {
          showTooltip(message);
        }
      })
      .on('pointerout', () => {
        applyButtonStyle(button);
        text.setPosition(x + width / 2, y + BUTTON_HEIGHT / 2);
        hideTooltip();
      });

    hitArea.disableInteractive();

    const parent = tabId ? tabContents.get(tabId) : container;
    parent?.add([background, text]);
    buttonHitAreas.push(hitArea);

    const button: DebugButton = {
      background,
      text,
      hitArea,
      baseY: y,
      tabId,
      setLabel: (nextLabel: string) => text.setText(nextLabel)
    };
    buttonsByKey.set(key, button);
    buttons.push(button);

    if (tabId) {
      contentButtons.push(button);
    }

    return button;
  }

  function setTabContentHeight(tabId: DebugTabId, height: number): void {
    contentHeightByTab.set(tabId, height);
  }

  function selectTab(tabId: DebugTabId): void {
    activeTab = tabId;
    scrollOffset = 0;
    hideTooltip();

    for (const tab of TABS) {
      tabContents.get(tab.id)?.setVisible(tab.id === activeTab);
    }

    applyActiveTabScroll();
    refreshButtonInputs();
  }

  function applyActiveTabScroll(): void {
    for (const tab of TABS) {
      tabContents.get(tab.id)?.setY(tab.id === activeTab ? scrollOffset : 0);
    }

    for (const button of contentButtons) {
      button.hitArea.setY(button.baseY + (button.tabId === activeTab ? scrollOffset : 0));
    }

    for (const hitArea of valueHitAreas) {
      const baseY = Number(hitArea.getData('baseY') ?? hitArea.y);
      const tabId = hitArea.getData('tabId') as DebugTabId | undefined;
      hitArea.setY(baseY + (tabId === activeTab ? scrollOffset : 0));
    }
  }

  function refreshButtonInputs(): void {
    panelBlocker.setVisible(open);
    if (open) {
      panelBlocker.setInteractive();
    } else {
      panelBlocker.disableInteractive();
    }

    for (const button of buttons) {
      const isEnabled = open && (!button.tabId || button.tabId === activeTab);
      button.hitArea.setVisible(isEnabled);

      if (isEnabled) {
        button.hitArea.setInteractive({ useHandCursor: true });
      } else {
        button.hitArea.disableInteractive();
      }

      applyButtonStyle(button);
    }

    for (const hitArea of valueHitAreas) {
      const tabId = hitArea.getData('tabId') as DebugTabId | undefined;
      const isEnabled = open && tabId === activeTab;
      hitArea.setVisible(isEnabled);

      if (isEnabled) {
        hitArea.setInteractive();
      } else {
        hitArea.disableInteractive();
      }
    }

    if (!open) {
      hideTooltip();
    }
  }

  function applyButtonStyle(button: DebugButton): void {
    const tabButton = tabButtons.includes(button);
    const isActiveTabButton = tabButton && button === buttonsByKey.get(`tab-${activeTab}`);
    button.background.setFillStyle(isActiveTabButton ? 0x163446 : 0x111a24, 0.96);
    button.background.setStrokeStyle(1, isActiveTabButton ? 0x42f5d7 : 0x52627f, isActiveTabButton ? 1 : 0.9);
  }

  function showTooltip(message: string): void {
    tooltipText.setText(message);
    const availableLeftWidth = Math.max(120, panelX - TOOLTIP_GAP * 2);
    const tooltipWidth = Math.min(TOOLTIP_WIDTH, availableLeftWidth);
    tooltipText.setFixedSize(tooltipWidth - TOOLTIP_PADDING * 2, 0);
    tooltipText.setWordWrapWidth(tooltipWidth - TOOLTIP_PADDING * 2, true);
    const tooltipHeight = tooltipText.height + TOOLTIP_PADDING * 2;
    const tooltipX = Phaser.Math.Clamp(panelX - tooltipWidth - TOOLTIP_GAP, TOOLTIP_GAP, Math.max(TOOLTIP_GAP, scene.scale.width - tooltipWidth - TOOLTIP_GAP));
    const tooltipY = Phaser.Math.Clamp(panelY + 8, TOOLTIP_GAP, Math.max(TOOLTIP_GAP, scene.scale.height - tooltipHeight - TOOLTIP_GAP));

    tooltipBackground.clear();
    tooltipBackground.fillStyle(0x02040a, 0.98);
    tooltipBackground.fillRoundedRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
    tooltipBackground.lineStyle(1, 0x42f5d7, 0.85);
    tooltipBackground.strokeRoundedRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
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

  return {
    open: () => {
      open = true;
      selectTab(activeTab);
      container.setVisible(true);
      refreshButtonInputs();
    },
    close: () => {
      open = false;
      container.setVisible(false);
      refreshButtonInputs();
    },
    toggle: () => {
      open = !open;
      container.setVisible(open);
      refreshButtonInputs();
    },
    isOpen: () => open,
    update: (values: DebugMenuValues) => {
      setValue('run-state', `Game: ${values.debugGamePaused ? 'paused' : 'running'}`);
      setValue(
        'player',
        `Hull: ${Math.ceil(values.playerHull)} / ${Math.ceil(values.playerMaxHull)}\nInvulnerability: ${
          values.playerInvulnerable ? 'on' : 'off'
        }`
      );
      setValue('scrap', `Pickups: ${values.activeScrapPickups}\nRun scrap: ${values.runScrapTotal}\nCredits: ${values.totalCredits}`);
      setValue(
        'ship-stats',
        `Ship: ${values.selectedShipName}\nHull: ${Math.ceil(values.playerHull)} / ${Math.ceil(values.playerMaxHull)}\nMass ${values.playerMass.toFixed(2)}\nSpeed ${values.playerSpeed.toFixed(1)} / ${values.playerMaxSpeed.toFixed(1)}\nThrust ${values.playerThrust.toFixed(1)}\nBrake ${values.playerBrake.toFixed(1)}\nStrafe ${values.playerStrafe.toFixed(1)}`
      );
      setValue(
        'shield-state',
        values.rammingShieldMaxHp > 0
          ? `HP ${Math.ceil(values.rammingShieldHp)} / ${values.rammingShieldMaxHp}\nDash ${values.rammingShieldDashCharges} / ${values.rammingShieldDashMaxCharges}`
          : 'Not equipped'
      );
      setValue('projectiles', `Player: ${values.playerProjectiles}\nEnemy: ${values.enemyProjectiles}`);
      setValue(
        'weapon',
        `Damage x${values.weaponDamageMultiplier.toFixed(1)}\nFire x${values.weaponFireRateMultiplier.toFixed(1)}\nCooldown ${values.weaponCooldownSeconds.toFixed(2)}s`
      );
      setValue(
        'physics-player',
        `Speed ${values.playerSpeed.toFixed(1)} / ${values.playerMaxSpeed.toFixed(1)}\nMass ${values.playerMass.toFixed(2)}\nThrust x${values.playerThrustScale.toFixed(2)} = ${values.playerThrust.toFixed(1)}\nBrake x${values.playerBrakeScale.toFixed(2)} = ${values.playerBrake.toFixed(1)}\nStrafe x${values.playerStrafeScale.toFixed(2)} = ${values.playerStrafe.toFixed(1)}\nInertia x${values.playerInertiaScale.toFixed(2)}\nMass exponent ${values.playerControlMassExponent.toFixed(2)}`
      );
      setValue(
        'physics-enemy',
        `Speed x${values.enemySpeedScale.toFixed(2)}\nThrust/response x${values.enemyResponseScale.toFixed(2)}\nMass exponent ${values.enemyMassExponent.toFixed(2)}`
      );
      setValue(
        'physics-asteroids',
        `Collision damage x${values.asteroidCollisionDamageScale.toFixed(2)}\nCollision impulse x${values.asteroidCollisionImpulseScale.toFixed(2)}`
      );
      setValue('spawn-state', `${values.spawnDirectorSummary}\nEnemies active: ${values.activeEnemies}`);
      setValue(
        'asteroid-state',
        `Asteroids active: ${values.activeAsteroids}\nSpawner: ${
          values.asteroidSpawningAvailable ? (values.asteroidSpawningEnabled ? 'on' : 'off') : 'not implemented'
        }`
      );
      setValue('debris', `Active: ${values.activeDebris}`);
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
      setValue(
        'background',
        `Stars: ${values.backgroundStarsVisible ? 'on' : 'off'}\nFar ${values.starfieldFarParallax.toFixed(2)}\nMid ${values.starfieldMidParallax.toFixed(2)}\nNear ${values.starfieldNearParallax.toFixed(2)}`
      );
      setButtonLabel('debug-pause', `Pause game: ${values.debugGamePaused ? 'on' : 'off'}`);
      setButtonLabel('enemy-spawning', `Enemy spawning: ${values.enemySpawningEnabled ? 'on' : 'off'}`);
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
      for (const hitArea of valueHitAreas) {
        hitArea.destroy();
      }
      tooltipBackground.destroy();
      tooltipText.destroy();
      container.destroy(true);
    }
  };
}
