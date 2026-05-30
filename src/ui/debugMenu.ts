import Phaser from 'phaser';
import type { DebugAsteroidTier, DebugMenuCallbacks, DebugMenuValues } from '../systems/debug/debugTypes';
import { formatIntegerDisplayUnits, toDisplayUnits } from '../systems/statUnits';
import type { DeathShardStyle } from '../systems/deathEffects';
import { HUD_BUTTON_VARIANTS } from '../systems/hudButtonVariants';

export interface DebugMenuConfig {
  callbacks: DebugMenuCallbacks;
}

export interface DebugMenuController {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  containsPointer: (pointer: Phaser.Input.Pointer) => boolean;
  update: (values: DebugMenuValues) => void;
  destroy: () => void;
}

type DebugTabId = 'run' | 'player' | 'ship' | 'weapons' | 'physics' | 'collision' | 'spawns' | 'effects' | 'blackHole' | 'visuals';

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

interface DebugNumberInput {
  element: HTMLInputElement;
  tabId: DebugTabId;
  baseY: number;
  x: number;
  width: number;
  getValue: (values: DebugMenuValues) => number;
  setValue: (value: number) => void;
}

interface DebugNumberInputConfig {
  getValue: (values: DebugMenuValues) => number;
  setValue: (value: number) => void;
  step?: number;
}

const PANEL_WIDTH = 560;
const PANEL_PADDING = 14;
const COLUMN_WIDTH = 532;
const BUTTON_HEIGHT = 24;
const BUTTON_GAP = 6;
const ROW_GAP = 8;
const VALUE_LINE_HEIGHT = 15;
const SECTION_TITLE_HEIGHT = 20;
const TOOLTIP_WIDTH = 420;
const TOOLTIP_PADDING = 8;
const TOOLTIP_GAP = 10;
const TAB_HEIGHT = 22;
const TAB_GAP = 5;
const CONTENT_TOP = 102;
const TABS: DebugTab[] = [
  { id: 'run', label: 'Overview' },
  { id: 'player', label: 'Player' },
  { id: 'ship', label: 'Ship' },
  { id: 'weapons', label: 'Weapons' },
  { id: 'physics', label: 'Physics' },
  { id: 'collision', label: 'Hitboxes' },
  { id: 'spawns', label: 'Spawns' },
  { id: 'effects', label: 'Effects' },
  { id: 'blackHole', label: 'Black Hole' },
  { id: 'visuals', label: 'Visuals' }
];

const DEBUG_TOOLTIPS: Record<string, string> = {
  close: 'Close the debug panel. Current debug tuning values remain active.',
  'tab-run': 'Live run overview, diagnostics, economy, and tuning reset tools.',
  'tab-player': 'Direct player controls for hull, fuel, movement, teleports, progression, and secret-control testing.',
  'tab-ship': 'Ship readouts for current hull, movement stats, shields, and projectiles.',
  'tab-weapons': 'Weapon tuning controls for temporary damage, fire-rate, and cooldown testing.',
  'tab-physics': 'Physics tuning for player control, enemy movement, and asteroid collision feel.',
  'tab-collision': 'Simple gameplay hitbox scales for player, enemies, asteroids, and debris.',
  'tab-spawns': 'Spawn and clear enemies, asteroids, debris, and scrap for encounter testing.',
  'tab-effects': 'Death shard effect tuning and quick effect tests.',
  'tab-blackHole': 'Black hole death-vacuum controls for growth, capture, consumption, and radius diagnostics.',
  'tab-visuals': 'Combat feedback, background, and parallax controls for visual testing.',
  'run-overview': 'Current run summary: ship, weapon, hull, fuel, XP, entities, projectiles, and time.',
  'run-state': 'Shows whether the debug pause toggle is currently stopping game updates.',
  player: 'Shows player hull and debug invulnerability state.',
  'player-state': 'Full player state: hull, position, velocity, mission distance, debug immunity, and secret-control unlock state.',
  scrap: 'Shows active scrap pickups, current run scrap, and total credits.',
  'debug-pause': 'Toggle debug pause. Use it to freeze gameplay while inspecting state.',
  'restore-hull': 'Restore the player hull to full for survival and collision testing.',
  'heal-player-small': 'Add a small hull repair without exceeding maximum hull.',
  'damage-player-small': 'Apply a small debug damage hit that bypasses defense.',
  'damage-player-large': 'Apply a larger debug damage hit that bypasses defense.',
  'player-invuln': 'Toggle debug invulnerability. Useful for testing hazards without ending the run.',
  'player-collision-immune': 'Toggle contact damage immunity while keeping collision movement and knockback active.',
  'kill-player': 'Immediately defeat the player to test death, results, and restart behavior.',
  'player-stop': 'Set player velocity to zero and cancel active dash burst movement.',
  'teleport-center': 'Teleport the player to arena center.',
  'teleport-mission': 'Teleport the player to the active mission objective.',
  'teleport-black-hole': 'Teleport the player near the black hole capture radius.',
  'nudge-up': 'Move the player upward without changing velocity.',
  'nudge-down': 'Move the player downward without changing velocity.',
  'nudge-left': 'Move the player left without changing velocity.',
  'nudge-right': 'Move the player right without changing velocity.',
  'add-xp-small': 'Grant a small amount of run XP.',
  'add-xp-large': 'Grant enough XP to quickly test upgrades.',
  'add-banked-upgrade': 'Add one banked upgrade choice to the current run.',
  'clear-banked-upgrades': 'Remove all banked upgrade choices from the current run.',
  'reset-weapon-cooldowns': 'Make auto, left-click, and right-click weapon slots ready immediately.',
  'refill-ramming-shield': 'Restore Ramming Shield HP and dash charges when the shield is equipped.',
  'secret-controls-unlock': 'Unlock the late-game secret controls overlay in local progression for testing.',
  fuel: 'Shows current run fuel and debug drain settings. Fuel drains only from thrust usage.',
  'fuel-refill': 'Refill fuel to maximum for route and emergency-thrust testing.',
  'fuel-empty': 'Set fuel to zero to test emergency thrust behavior.',
  'fuel-drain-toggle': 'Pause or resume fuel drain without changing current fuel.',
  'fuel-mode-toggle': 'Fuel drain mode is locked to thrust-only for current 2.0 tuning.',
  'preset-reset': 'Reset all debug tuning settings to source defaults.',
  profiler: 'Tracks frame time, subsystem timings, entity counts, and spike samples for lag diagnosis.',
  'profiler-toggle': 'Enable or disable rolling lag profiling.',
  'profiler-start': 'Start a focused manual profiling capture.',
  'profiler-stop': 'Stop the focused manual profiling capture.',
  'profiler-export': 'Download a markdown lag report with summary data and machine-readable JSON.',
  'profiler-clear': 'Clear captured profiler frames and spike samples.',
  'open-reports-folder': 'Open the desktop reports folder when running in Electron.',
  'open-data-folder': 'Open the desktop data folder when running in Electron.',
  diagnostics: 'Automatically writes local run diagnostic reports while a run is active.',
  'diagnostics-toggle': 'Turn automatic run diagnostics on or off.',
  'diagnostics-write-now': 'Write an immediate diagnostic report for the current run.',
  'diagnostics-open-current': 'Open the current run diagnostics folder.',
  'diagnostics-open-runs': 'Open the folder that stores all run diagnostics.',
  'spawn-scrap': 'Spawn a scrap pickup near the player.',
  'clear-scrap': 'Remove active scrap pickups from the scene.',
  'add-scrap': 'Add 100 run scrap without spawning pickups.',
  'add-credits': 'Add 100 permanent credits for shop and economy testing.',
  'player-add-scrap': 'Add 100 run scrap from the player controls tab.',
  'player-add-credits': 'Add 100 permanent credits from the player controls tab.',
  'ship-stats': 'Live player ship stats after ship selection, upgrades, and debug physics tuning.',
  'ship-loadout-interceptor': 'Editable Interceptor defaults for live movement and hull tuning.',
  'ship-loadout-bulwark': 'Editable Bulwark defaults for live movement, hull, and hit-radius tuning.',
  'interceptor-hull-down': 'Decrease Interceptor base hull for loadout testing.',
  'interceptor-hull-up': 'Increase Interceptor base hull for loadout testing.',
  'interceptor-speed-down': 'Decrease Interceptor max movement speed.',
  'interceptor-speed-up': 'Increase Interceptor max movement speed.',
  'interceptor-thrust-down': 'Decrease Interceptor forward thrust acceleration.',
  'interceptor-thrust-up': 'Increase Interceptor forward thrust acceleration.',
  'interceptor-brake-down': 'Decrease Interceptor reverse/brake acceleration.',
  'interceptor-brake-up': 'Increase Interceptor reverse/brake acceleration.',
  'interceptor-strafe-down': 'Decrease Interceptor side-thrust acceleration.',
  'interceptor-strafe-up': 'Increase Interceptor side-thrust acceleration.',
  'interceptor-hit-down': 'Decrease Interceptor collision radius.',
  'interceptor-hit-up': 'Increase Interceptor collision radius.',
  'interceptor-reset': 'Clear Interceptor debug loadout overrides.',
  'bulwark-hull-down': 'Decrease Bulwark base hull for loadout testing.',
  'bulwark-hull-up': 'Increase Bulwark base hull for loadout testing.',
  'bulwark-speed-down': 'Decrease Bulwark max movement speed.',
  'bulwark-speed-up': 'Increase Bulwark max movement speed.',
  'bulwark-thrust-down': 'Decrease Bulwark forward thruster output.',
  'bulwark-thrust-up': 'Increase Bulwark forward thruster output.',
  'bulwark-brake-down': 'Decrease Bulwark reverse/brake thruster output.',
  'bulwark-brake-up': 'Increase Bulwark reverse/brake thruster output.',
  'bulwark-strafe-down': 'Decrease Bulwark side-thruster output.',
  'bulwark-strafe-up': 'Increase Bulwark side-thruster output.',
  'bulwark-hit-down': 'Decrease Bulwark collision radius.',
  'bulwark-hit-up': 'Increase Bulwark collision radius.',
  'bulwark-reset': 'Clear Bulwark debug loadout overrides.',
  'shield-state': 'Shows Ramming Shield HP and dash charges when the shield is equipped.',
  projectiles: 'Shows active player and enemy projectile counts.',
  'clear-player-projectiles': 'Remove active player projectiles without changing enemies or rewards.',
  'clear-enemy-projectiles': 'Remove active enemy projectiles without changing enemies.',
  'player-clear-player-projectiles': 'Remove active player projectiles from the player controls tab.',
  'player-clear-enemy-projectiles': 'Remove active enemy projectiles from the player controls tab.',
  weapon: 'Current temporary weapon tuning multipliers.',
  'damage-down': 'Decrease weapon damage multiplier for debug testing.',
  'damage-up': 'Increase weapon damage multiplier for debug testing.',
  'fire-down': 'Decrease weapon fire-rate multiplier.',
  'fire-up': 'Increase weapon fire-rate multiplier.',
  'cooldown-down': 'Shorten the current weapon cooldown.',
  'cooldown-up': 'Lengthen the current weapon cooldown.',
  'weapon-reset': 'Reset temporary weapon damage and fire-rate tuning.',
  'weapon-loadout-pulse-cannon': 'Editable Pulse Cannon weapon defaults for live projectile tuning.',
  'pulse-damage-down': 'Decrease Pulse Cannon base projectile damage.',
  'pulse-damage-up': 'Increase Pulse Cannon base projectile damage.',
  'pulse-cooldown-down': 'Shorten Pulse Cannon base cooldown.',
  'pulse-cooldown-up': 'Lengthen Pulse Cannon base cooldown.',
  'pulse-speed-down': 'Decrease Pulse Cannon projectile speed.',
  'pulse-speed-up': 'Increase Pulse Cannon projectile speed.',
  'pulse-life-down': 'Decrease Pulse Cannon projectile lifetime.',
  'pulse-life-up': 'Increase Pulse Cannon projectile lifetime.',
  'pulse-range-down': 'Decrease Pulse Cannon projectile range.',
  'pulse-range-up': 'Increase Pulse Cannon projectile range.',
  'pulse-reset': 'Clear Pulse Cannon debug loadout overrides.',
  'weapon-loadout-ramming-shield': 'Editable Ramming Shield weapon defaults for live shield, dash, guard, and bash tuning.',
  'shield-hp-down': 'Decrease Ramming Shield maximum shield HP.',
  'shield-hp-up': 'Increase Ramming Shield maximum shield HP.',
  'shield-regen-down': 'Decrease Ramming Shield HP regeneration rate.',
  'shield-regen-up': 'Increase Ramming Shield HP regeneration rate.',
  'shield-charges-down': 'Decrease Ramming Shield dash charge count.',
  'shield-charges-up': 'Increase Ramming Shield dash charge count.',
  'shield-recharge-down': 'Shorten Ramming Shield dash recharge time.',
  'shield-recharge-up': 'Lengthen Ramming Shield dash recharge time.',
  'shield-distance-down': 'Decrease Ramming Shield bash dash distance.',
  'shield-distance-up': 'Increase Ramming Shield bash dash distance.',
  'shield-guard-down': 'Decrease Ramming Shield guard contact damage.',
  'shield-guard-up': 'Increase Ramming Shield guard contact damage.',
  'shield-bash-down': 'Decrease Ramming Shield bash damage.',
  'shield-bash-up': 'Increase Ramming Shield bash damage.',
  'shield-knock-down': 'Decrease Ramming Shield knockback impulse.',
  'shield-knock-up': 'Increase Ramming Shield knockback impulse.',
  'shield-size-down': 'Decrease Ramming Shield collider width.',
  'shield-size-up': 'Increase Ramming Shield collider width.',
  'shield-reset': 'Clear Ramming Shield debug loadout overrides.',
  'physics-player': 'Live player movement values after ship stats and debug physics multipliers.',
  'physics-global': 'Global physical speed and impact-damage caps. These are safety limits for chaotic momentum testing.',
  'global-speed-down': 'Decrease the maximum speed allowed for physical bodies.',
  'global-speed-up': 'Increase the maximum speed allowed for physical bodies.',
  'global-impact-cap-down': 'Decrease the emergency global cap for one impact damage event.',
  'global-impact-cap-up': 'Increase the emergency global cap for one impact damage event.',
  'player-impact-cap-down': 'Decrease max impact damage caused by the player body.',
  'player-impact-cap-up': 'Increase max impact damage caused by the player body.',
  'enemy-impact-cap-down': 'Decrease max impact damage caused by enemy ships.',
  'enemy-impact-cap-up': 'Increase max impact damage caused by enemy ships.',
  'asteroid-impact-cap-down': 'Decrease max impact damage caused by asteroids.',
  'asteroid-impact-cap-up': 'Increase max impact damage caused by asteroids.',
  'debris-impact-cap-down': 'Decrease max impact damage caused by debris.',
  'debris-impact-cap-up': 'Increase max impact damage caused by debris.',
  'player-impact-scale-down': 'Decrease how much player impact damage scales with speed.',
  'player-impact-scale-up': 'Increase how much player impact damage scales with speed.',
  'enemy-impact-scale-down': 'Decrease how much enemy impact damage scales with speed.',
  'enemy-impact-scale-up': 'Increase how much enemy impact damage scales with speed.',
  'asteroid-impact-scale-down': 'Decrease how much asteroid impact damage scales with speed.',
  'asteroid-impact-scale-up': 'Increase how much asteroid impact damage scales with speed.',
  'debris-impact-scale-down': 'Decrease how much debris impact damage scales with speed.',
  'debris-impact-scale-up': 'Increase how much debris impact damage scales with speed.',
  'player-thrust-down': 'Decrease forward thrust. Lower values make acceleration weaker.',
  'player-thrust-up': 'Increase forward thrust. Higher values make acceleration stronger.',
  'player-brake-down': 'Decrease reverse/brake thrust.',
  'player-brake-up': 'Increase reverse/brake thrust.',
  'player-strafe-down': 'Decrease side thrust.',
  'player-strafe-up': 'Increase side thrust.',
  'player-inertia-down': 'Decrease control inertia scaling. Lower values make control more sluggish.',
  'player-inertia-up': 'Increase control inertia scaling. Higher values make control more responsive.',
  'physics-enemy': 'Current enemy movement tuning multipliers used by active enemy steering.',
  'enemy-speed-down': 'Decrease enemy target movement speed.',
  'enemy-speed-up': 'Increase enemy target movement speed.',
  'enemy-response-down': 'Decrease enemy steering response/thrust.',
  'enemy-response-up': 'Increase enemy steering response/thrust.',
  'physics-asteroids': 'Current asteroid collision damage and impulse tuning.',
  'asteroid-damage-down': 'Decrease asteroid-vs-asteroid collision damage scaling.',
  'asteroid-damage-up': 'Increase asteroid-vs-asteroid collision damage scaling.',
  'asteroid-impulse-down': 'Decrease asteroid collision knockback impulse.',
  'asteroid-impulse-up': 'Increase asteroid collision knockback impulse.',
  'physics-reset': 'Reset player, enemy, and asteroid physics tuning to debug defaults.',
  'collision-shapes': 'Scales simple gameplay collision bounds. These shrink the tested pills and circles without changing art size.',
  'collision-global-down': 'Decrease every gameplay collision shape.',
  'collision-global-up': 'Increase every gameplay collision shape.',
  'collision-player-down': 'Decrease the player ship collision circle.',
  'collision-player-up': 'Increase the player ship collision circle.',
  'collision-enemy-down': 'Decrease enemy ship collision capsules.',
  'collision-enemy-up': 'Increase enemy ship collision capsules.',
  'collision-asteroid-down': 'Decrease asteroid collision circles.',
  'collision-asteroid-up': 'Increase asteroid collision circles.',
  'collision-debris-down': 'Decrease debris collision circles.',
  'collision-debris-up': 'Increase debris collision circles.',
  'collision-reset': 'Reset collision shape scales to source defaults.',
  'spawn-state': 'Shows spawn director timing and active enemy count.',
  'enemy-spawning': 'Toggle automatic enemy spawning.',
  'spawn-chaser': 'Spawn one Chaser enemy near the play area.',
  'spawn-shooter': 'Spawn one Shooter enemy near the play area.',
  'spawn-tank': 'Spawn one Tank enemy near the play area.',
  'spawn-scout-pack': 'Spawn a Scout Pack encounter near the play area.',
  'spawn-gunner-escort': 'Spawn a Gunner Escort encounter near the play area.',
  'spawn-strike-wing': 'Spawn a Strike Wing encounter near the play area.',
  'spawn-support-group': 'Spawn a Support Group encounter near the play area.',
  'spawn-sniper-screen': 'Spawn a Sniper Screen encounter near the play area.',
  'spawn-carrier-group': 'Spawn a Carrier Group encounter near the play area.',
  'clear-enemies': 'Remove active enemies without granting rewards.',
  'asteroid-state': 'Shows active asteroids and asteroid spawner state.',
  'asteroid-breakup': 'Controls when destroyed asteroids stop making smaller asteroids and convert excess fragment value into scrap instead.',
  'asteroid-soft-cap-down': 'Decrease the active asteroid count where breakup starts reducing fragments.',
  'asteroid-soft-cap-up': 'Increase the active asteroid count where breakup starts reducing fragments.',
  'asteroid-hard-cap-down': 'Decrease the active asteroid count where breakup stops adding fragments.',
  'asteroid-hard-cap-up': 'Increase the active asteroid count where breakup stops adding fragments.',
  'asteroid-burst-limit-down': 'Decrease how many asteroid destructions can happen in 500ms before burst protection reduces fragments.',
  'asteroid-burst-limit-up': 'Increase how many asteroid destructions can happen in 500ms before burst protection reduces fragments.',
  'debug-asteroid-spawn-count-down': 'Decrease how many asteroids each tier button spawns per click.',
  'debug-asteroid-spawn-count-up': 'Increase how many asteroids each tier button spawns per click.',
  'asteroid-breakup-reset': 'Reset asteroid breakup caps and burst protection to Phase 10.6 defaults.',
  'debug-asteroid-spawn-count-reset': 'Reset asteroid spawn amount to one asteroid per click.',
  'asteroid-1': 'Spawn a tier 1 asteroid.',
  'asteroid-2': 'Spawn a tier 2 asteroid.',
  'asteroid-3': 'Spawn a tier 3 asteroid.',
  'asteroid-4': 'Spawn a tier 4 asteroid.',
  'asteroid-5': 'Spawn a tier 5 asteroid.',
  'clear-asteroids': 'Remove active asteroids.',
  debris: 'Shows active debris count.',
  'spawn-debris': 'Spawn debris for collision and cleanup testing.',
  'clear-debris': 'Remove active debris.',
  'black-hole': 'Shows the current death-vacuum state, growth, capture timer, and consumption count.',
  'black-hole-radii': 'Toggle black hole radius guide rendering.',
  'black-hole-field-damage': 'Legacy field damage toggle. The death-vacuum model no longer uses tidal field damage.',
  'collision-debug': 'Toggle collision debug visuals, including black hole collision guides.',
  'black-hole-field': 'Current black hole vacuum radius, growth, capture, and pull tuning.',
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
  'field-vel-down': 'Decrease black hole force velocity cap.',
  'field-vel-up': 'Increase black hole force velocity cap.',
  'field-visual-down': 'Decrease black hole visual radius scale.',
  'field-visual-up': 'Increase black hole visual radius scale.',
  'field-core-down': 'Decrease black hole core visual scale.',
  'field-core-up': 'Increase black hole core visual scale.',
  'field-reset': 'Reset black hole field and visual tuning.',
  background: 'Current background star visibility and parallax values.',
  'hud-button-variants': 'Live Phase 17H dashboard button variants. Each option is research-backed and can be compared without restarting the run.',
  'hud-button-prev': 'Switch to the previous dashboard button variant.',
  'hud-button-next': 'Switch to the next dashboard button variant.',
  'health-bars': 'Small world-space health bars. Player bar can always show; other bars reveal after player damage.',
  'health-bars-toggle': 'Toggle all world-space health bars.',
  'player-health-bar': 'Toggle the player ship health bar.',
  'health-reveal': 'When on, enemy and asteroid bars first appear only after player-caused damage.',
  'health-width-down': 'Make health bars narrower.',
  'health-width-up': 'Make health bars wider.',
  'health-height-down': 'Make health bars thinner.',
  'health-height-up': 'Make health bars thicker.',
  'health-offset-down': 'Move health bars closer to their object.',
  'health-offset-up': 'Move health bars farther above their object.',
  'health-alpha-down': 'Make health bars more transparent.',
  'health-alpha-up': 'Make health bars more opaque.',
  'damage-numbers': 'Floating damage number defaults for all damage sources.',
  'damage-numbers-toggle': 'Toggle floating damage numbers.',
  'damage-number-colors': 'Toggle source-colored damage text.',
  'asteroid-damage-flash': 'Toggle the quick tint flash on damaged asteroids. Impact movement and collision response still run.',
  'damage-font-down': 'Decrease damage number text size.',
  'damage-font-up': 'Increase damage number text size.',
  'damage-life-down': 'Shorten damage number lifetime.',
  'damage-life-up': 'Lengthen damage number lifetime.',
  'damage-rise-down': 'Reduce upward float distance.',
  'damage-rise-up': 'Increase upward float distance.',
  'damage-drift-down': 'Reduce random sideways drift.',
  'damage-drift-up': 'Increase random sideways drift.',
  'damage-pop-down': 'Reduce initial pop scale.',
  'damage-pop-up': 'Increase initial pop scale.',
  'damage-fade-down': 'Start fading sooner.',
  'damage-fade-up': 'Start fading later.',
  'damage-alpha-down': 'Make damage numbers more transparent.',
  'damage-alpha-up': 'Make damage numbers more opaque.',
  'feedback-reset': 'Reset health bar and damage number settings.',
  'death-ship': 'Enemy ship death shard tuning.',
  'death-player': 'Player death shard tuning.',
  'death-asteroid': 'Asteroid death shard tuning.',
  'death-blackHoleShip': 'Black hole ship death shard tuning.',
  'death-blackHoleAsteroid': 'Black hole asteroid death shard tuning.',
  'death-reset': 'Reset death shard tuning.',
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
  const numberInputs: DebugNumberInput[] = [];
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
    .on('pointermove', (pointer: Phaser.Input.Pointer) => pointer.event?.stopPropagation())
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
  buildPlayerTab();
  buildShipTab();
  buildWeaponsTab();
  buildPhysicsTab();
  buildCollisionTab();
  buildSpawnsTab();
  buildEffectsTab();
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
    const widths = [72, 62, 45, 76, 67, 72, 62, 66, 91, 62];
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
    y = addSection('run', y, 'Overview');
    addValue('run-overview', 'run', y, VALUE_LINE_HEIGHT * 7);
    y += VALUE_LINE_HEIGHT * 7 + ROW_GAP;

    y = addSection('run', y, 'Run Controls');
    addValue('run-state', 'run', y, VALUE_LINE_HEIGHT);
    y += VALUE_LINE_HEIGHT + BUTTON_GAP;
    addButton('run', 'debug-pause', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Pause game', config.callbacks.toggleDebugPause);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('run', y, 'Lag Profiler');
    addValue('profiler', 'run', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButton('run', 'profiler-toggle', panelX + PANEL_PADDING, y, 154, 'Profiler', config.callbacks.togglePerformanceProfiler);
    addButton('run', 'profiler-export', panelX + PANEL_PADDING + 162, y, 154, 'Export report', config.callbacks.exportPerformanceReport);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('run', 'profiler-start', panelX + PANEL_PADDING, y, 101, 'Start', config.callbacks.startPerformanceCapture);
    addButton('run', 'profiler-stop', panelX + PANEL_PADDING + 108, y, 101, 'Stop', config.callbacks.stopPerformanceCapture);
    addButton('run', 'profiler-clear', panelX + PANEL_PADDING + 216, y, 100, 'Clear', config.callbacks.clearPerformanceProfiler);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('run', 'open-reports-folder', panelX + PANEL_PADDING, y, 154, 'Open reports', config.callbacks.openReportsFolder);
    addButton('run', 'open-data-folder', panelX + PANEL_PADDING + 162, y, 154, 'Open data', config.callbacks.openDataFolder);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('run', y, 'Auto Diagnostics');
    addValue('diagnostics', 'run', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButton('run', 'diagnostics-toggle', panelX + PANEL_PADDING, y, 154, 'Diagnostics', config.callbacks.toggleAutoDiagnostics);
    addButton('run', 'diagnostics-write-now', panelX + PANEL_PADDING + 162, y, 154, 'Write now', config.callbacks.writeAutoDiagnosticReportNow);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('run', 'diagnostics-open-current', panelX + PANEL_PADDING, y, 154, 'Open run', config.callbacks.openCurrentRunDiagnosticsFolder);
    addButton('run', 'diagnostics-open-runs', panelX + PANEL_PADDING + 162, y, 154, 'Open runs', config.callbacks.openRunsFolder);
    y += BUTTON_HEIGHT + ROW_GAP;
    addButton('run', 'preset-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset all debug tuning', config.callbacks.resetDebugTuning);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('run', y, 'Economy');
    addValue('scrap', 'run', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
    addButton('run', 'spawn-scrap', panelX + PANEL_PADDING, y, 154, 'Spawn scrap', config.callbacks.spawnScrap);
    addButton('run', 'clear-scrap', panelX + PANEL_PADDING + 162, y, 154, 'Clear scrap', config.callbacks.clearScrap);
    addButton('run', 'add-scrap', panelX + PANEL_PADDING + 324, y, 154, 'Add 100 scrap', () => config.callbacks.addScrap(100));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('run', 'add-credits', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Add 100 credits', () => config.callbacks.addCredits(100));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('run', 'reroll-cost-mode', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reroll cost mode', config.callbacks.toggleRerollDebugCost);
    setTabContentHeight('run', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildPlayerTab(): void {
    let y = CONTENT_TOP;
    y = addSection('player', y, 'Player State');
    addValue('player-state', 'player', y, VALUE_LINE_HEIGHT * 8);
    y += VALUE_LINE_HEIGHT * 8 + ROW_GAP;

    y = addSection('player', y, 'Survival');
    addButton('player', 'restore-hull', panelX + PANEL_PADDING, y, 101, 'Restore hull', config.callbacks.restorePlayerHull);
    addButton('player', 'heal-player-small', panelX + PANEL_PADDING + 108, y, 101, 'Heal +10', () => config.callbacks.healPlayer(10));
    addButton('player', 'kill-player', panelX + PANEL_PADDING + 216, y, 100, 'Kill player', config.callbacks.killPlayer);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'damage-player-small', panelX + PANEL_PADDING, y, 101, 'Damage 5', () => config.callbacks.damagePlayerForDebug(5));
    addButton('player', 'damage-player-large', panelX + PANEL_PADDING + 108, y, 101, 'Damage 25', () => config.callbacks.damagePlayerForDebug(25));
    addButton('player', 'player-invuln', panelX + PANEL_PADDING + 216, y, 100, 'Invulnerable', config.callbacks.togglePlayerInvulnerability);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'player-collision-immune', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Contact damage immunity', config.callbacks.togglePlayerCollisionDamageImmunity);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('player', y, 'Movement And Teleport');
    addButton('player', 'player-stop', panelX + PANEL_PADDING, y, 101, 'Stop speed', config.callbacks.stopPlayerVelocity);
    addButton('player', 'teleport-center', panelX + PANEL_PADDING + 108, y, 101, 'Center arena', () => config.callbacks.teleportPlayer('center'));
    addButton('player', 'teleport-black-hole', panelX + PANEL_PADDING + 216, y, 100, 'Black hole', () => config.callbacks.teleportPlayer('blackHole'));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'teleport-mission', panelX + PANEL_PADDING, y, 154, 'Mission objective', () => config.callbacks.teleportPlayer('mission'));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'nudge-left', panelX + PANEL_PADDING, y, 126, 'Nudge left', () => config.callbacks.nudgePlayer(-180, 0));
    addButton('player', 'nudge-right', panelX + PANEL_PADDING + 134, y, 126, 'Nudge right', () => config.callbacks.nudgePlayer(180, 0));
    addButton('player', 'nudge-up', panelX + PANEL_PADDING + 272, y, 126, 'Nudge up', () => config.callbacks.nudgePlayer(0, -180));
    addButton('player', 'nudge-down', panelX + PANEL_PADDING + 406, y, 126, 'Nudge down', () => config.callbacks.nudgePlayer(0, 180));
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('player', y, 'Fuel And Weapons');
    addValue('fuel', 'player', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
    addButton('player', 'fuel-refill', panelX + PANEL_PADDING, y, 126, 'Refill fuel', config.callbacks.refillFuel);
    addButton('player', 'fuel-empty', panelX + PANEL_PADDING + 134, y, 126, 'Empty fuel', config.callbacks.emptyFuel);
    addButton('player', 'fuel-drain-toggle', panelX + PANEL_PADDING + 272, y, 126, 'Fuel drain', config.callbacks.toggleFuelDrain);
    addButton('player', 'fuel-mode-toggle', panelX + PANEL_PADDING + 406, y, 126, 'Fuel mode', config.callbacks.toggleFuelDrainMode);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'player-clear-player-projectiles', panelX + PANEL_PADDING, y, 154, 'Clear player shots', config.callbacks.clearPlayerProjectiles);
    addButton('player', 'player-clear-enemy-projectiles', panelX + PANEL_PADDING + 162, y, 154, 'Clear enemy shots', config.callbacks.clearEnemyProjectiles);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'reset-weapon-cooldowns', panelX + PANEL_PADDING, y, 154, 'Ready weapons', config.callbacks.resetWeaponCooldowns);
    addButton('player', 'refill-ramming-shield', panelX + PANEL_PADDING + 162, y, 154, 'Refill shield', config.callbacks.refillRammingShield);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('player', y, 'Progression');
    addButton('player', 'add-xp-small', panelX + PANEL_PADDING, y, 154, 'Add 25 experience', () => config.callbacks.addPlayerXp(25));
    addButton('player', 'add-xp-large', panelX + PANEL_PADDING + 162, y, 154, 'Add 250 experience', () => config.callbacks.addPlayerXp(250));
    addButton('player', 'add-banked-upgrade', panelX + PANEL_PADDING + 324, y, 154, 'Add upgrade', () => config.callbacks.addBankedUpgrade(1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'clear-banked-upgrades', panelX + PANEL_PADDING, y, 154, 'Clear upgrades', config.callbacks.clearBankedUpgrades);
    addButton('player', 'player-add-scrap', panelX + PANEL_PADDING + 162, y, 154, 'Add 100 scrap', () => config.callbacks.addScrap(100));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('player', 'player-add-credits', panelX + PANEL_PADDING, y, 154, 'Add 100 credits', () => config.callbacks.addCredits(100));
    addButton('player', 'secret-controls-unlock', panelX + PANEL_PADDING + 162, y, 154, 'Unlock controls', config.callbacks.unlockSecretControls);
    setTabContentHeight('player', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildShipTab(): void {
    let y = CONTENT_TOP;
    y = addSection('ship', y, 'Active Ship');
    addValue('ship-stats', 'ship', y, VALUE_LINE_HEIGHT * 8);
    y += VALUE_LINE_HEIGHT * 8 + ROW_GAP;
    y = addShipLoadoutControls(y, 'interceptor', 'Interceptor');
    y = addShipLoadoutControls(y, 'bulwark', 'Bulwark');
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
    y = addSection('weapons', y, 'Global Weapon Multipliers');
    addValue('weapon', 'weapons', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
    addButton('weapons', 'damage-down', panelX + PANEL_PADDING, y, 126, 'Damage down', () => config.callbacks.adjustWeaponDamage(-0.5));
    addButton('weapons', 'damage-up', panelX + PANEL_PADDING + 134, y, 126, 'Damage up', () => config.callbacks.adjustWeaponDamage(0.5));
    addButton('weapons', 'fire-down', panelX + PANEL_PADDING + 272, y, 126, 'Fire rate down', () => config.callbacks.adjustWeaponFireRate(-0.5));
    addButton('weapons', 'fire-up', panelX + PANEL_PADDING + 406, y, 126, 'Fire rate up', () => config.callbacks.adjustWeaponFireRate(0.5));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('weapons', 'cooldown-down', panelX + PANEL_PADDING, y, 154, 'Cooldown down', () => config.callbacks.adjustWeaponCooldownSeconds(-0.05));
    addButton('weapons', 'cooldown-up', panelX + PANEL_PADDING + 162, y, 154, 'Cooldown up', () => config.callbacks.adjustWeaponCooldownSeconds(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('weapons', 'weapon-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset weapon tuning', config.callbacks.resetWeaponTuning);
    y += BUTTON_HEIGHT + ROW_GAP;
    y = addProjectileWeaponLoadoutControls(y);
    y = addRammingShieldLoadoutControls(y);
    setTabContentHeight('weapons', y + PANEL_PADDING);
  }

  function addShipLoadoutControls(y: number, shipId: 'interceptor' | 'bulwark', label: string): number {
    y = addSection('ship', y, `${label} Loadout`);
    addValue(`ship-loadout-${shipId}`, 'ship', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButtonPair('ship', `${shipId}-hull`, y, 'Hull', () => config.callbacks.adjustShipLoadoutStat(shipId, 'maxHull', -5), () => config.callbacks.adjustShipLoadoutStat(shipId, 'maxHull', 5), {
      getValue: (values) => parseSummaryValue(values.shipTuningSummaries[shipId], /Hull ([\d.]+)/),
      setValue: (value) => config.callbacks.setShipLoadoutStat(shipId, 'maxHull', value),
      step: 5
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('ship', `${shipId}-speed`, y, 'Velocity', () => config.callbacks.adjustShipLoadoutStat(shipId, 'moveSpeed', -1), () => config.callbacks.adjustShipLoadoutStat(shipId, 'moveSpeed', 1), {
      getValue: (values) => parseSummaryValue(values.shipTuningSummaries[shipId], /Velocity ([\d.]+)/),
      setValue: (value) => config.callbacks.setShipLoadoutStat(shipId, 'moveSpeed', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('ship', `${shipId}-thrust`, y, 'Acceleration', () => config.callbacks.adjustShipLoadoutStat(shipId, 'thrust', -1), () => config.callbacks.adjustShipLoadoutStat(shipId, 'thrust', 1), {
      getValue: (values) => parseSummaryValue(values.shipTuningSummaries[shipId], /Accel ([\d.]+)/),
      setValue: (value) => config.callbacks.setShipLoadoutStat(shipId, 'thrust', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('ship', `${shipId}-brake`, y, 'Brake', () => config.callbacks.adjustShipLoadoutStat(shipId, 'brake', -1), () => config.callbacks.adjustShipLoadoutStat(shipId, 'brake', 1), {
      getValue: (values) => parseSummaryValue(values.shipTuningSummaries[shipId], /Brake ([\d.]+)/),
      setValue: (value) => config.callbacks.setShipLoadoutStat(shipId, 'brake', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('ship', `${shipId}-strafe`, y, 'Strafe', () => config.callbacks.adjustShipLoadoutStat(shipId, 'strafe', -1), () => config.callbacks.adjustShipLoadoutStat(shipId, 'strafe', 1), {
      getValue: (values) => parseSummaryValue(values.shipTuningSummaries[shipId], /Strafe ([\d.]+)/),
      setValue: (value) => config.callbacks.setShipLoadoutStat(shipId, 'strafe', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('ship', `${shipId}-hit`, y, 'Hit radius', () => config.callbacks.adjustShipLoadoutStat(shipId, 'hitRadius', -0.1), () => config.callbacks.adjustShipLoadoutStat(shipId, 'hitRadius', 0.1), {
      getValue: (values) => parseSummaryValue(values.shipTuningSummaries[shipId], /Hit ([\d.]+)/),
      setValue: (value) => config.callbacks.setShipLoadoutStat(shipId, 'hitRadius', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('ship', `${shipId}-reset`, panelX + PANEL_PADDING, y, COLUMN_WIDTH, `Reset ${label}`, () => config.callbacks.resetShipLoadout(shipId));
    return y + BUTTON_HEIGHT + ROW_GAP;
  }

  function addProjectileWeaponLoadoutControls(y: number): number {
    y = addSection('weapons', y, 'Pulse Cannon Loadout');
    addValue('weapon-loadout-pulse-cannon', 'weapons', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButtonPair('weapons', 'pulse-damage', y, 'Damage', () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'damage', -0.1), () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'damage', 0.1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['pulse-cannon'], /Damage ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('pulse-cannon', 'damage', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'pulse-cooldown', y, 'Cooldown', () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'cooldownSeconds', -0.05), () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'cooldownSeconds', 0.05), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['pulse-cannon'], /Cooldown ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('pulse-cannon', 'cooldownSeconds', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'pulse-speed', y, 'Speed', () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'projectileSpeed', -1), () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'projectileSpeed', 1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['pulse-cannon'], /Speed ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('pulse-cannon', 'projectileSpeed', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'pulse-life', y, 'Lifetime', () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'projectileLifetimeSeconds', -0.1), () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'projectileLifetimeSeconds', 0.1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['pulse-cannon'], /Lifetime ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('pulse-cannon', 'projectileLifetimeSeconds', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'pulse-range', y, 'Range', () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'projectileRange', -1), () => config.callbacks.adjustWeaponLoadoutStat('pulse-cannon', 'projectileRange', 1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['pulse-cannon'], /Range ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('pulse-cannon', 'projectileRange', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('weapons', 'pulse-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset Pulse Cannon', () => config.callbacks.resetWeaponLoadout('pulse-cannon'));
    return y + BUTTON_HEIGHT + ROW_GAP;
  }

  function addRammingShieldLoadoutControls(y: number): number {
    y = addSection('weapons', y, 'Ramming Shield Loadout');
    addValue('weapon-loadout-ramming-shield', 'weapons', y, VALUE_LINE_HEIGHT * 5);
    y += VALUE_LINE_HEIGHT * 5 + BUTTON_GAP;
    addButtonPair('weapons', 'shield-hp', y, 'Shield health', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'shieldMaxHp', -10), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'shieldMaxHp', 10), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Shield ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'shieldMaxHp', value),
      step: 10
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-regen', y, 'Regeneration', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'shieldRegenRatePerSecond', -1), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'shieldRegenRatePerSecond', 1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Regen ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'shieldRegenRatePerSecond', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-charges', y, 'Charges', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'dashMaxCharges', -1), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'dashMaxCharges', 1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Dash ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'dashMaxCharges', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-recharge', y, 'Recharge', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'dashChargeRechargeSeconds', -0.25), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'dashChargeRechargeSeconds', 0.25), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /@ ([\d.]+)s/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'dashChargeRechargeSeconds', value),
      step: 0.25
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-distance', y, 'Dash distance', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'dashDistance', -8), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'dashDistance', 8), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Dist ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'dashDistance', value),
      step: 8
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-guard', y, 'Guard damage', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'guardDamage', -1), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'guardDamage', 1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Guard ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'guardDamage', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-bash', y, 'Bash damage', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'bashDamage', -1), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'bashDamage', 1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Bash ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'bashDamage', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-knock', y, 'Knockback', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'knockback', -10), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'knockback', 10), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Knock ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'knockback', value),
      step: 10
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('weapons', 'shield-size', y, 'Width', () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'width', -1), () => config.callbacks.adjustWeaponLoadoutStat('ramming-shield', 'width', 1), {
      getValue: (values) => parseSummaryValue(values.weaponTuningSummaries['ramming-shield'], /Width ([\d.]+)/),
      setValue: (value) => config.callbacks.setWeaponLoadoutStat('ramming-shield', 'width', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('weapons', 'shield-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset Ramming Shield', () => config.callbacks.resetWeaponLoadout('ramming-shield'));
    return y + BUTTON_HEIGHT + ROW_GAP;
  }

  function buildPhysicsTab(): void {
    let y = CONTENT_TOP;
    y = addSection('physics', y, 'Global Physics');
    addValue('physics-global', 'physics', y, VALUE_LINE_HEIGHT * 7);
    y += VALUE_LINE_HEIGHT * 7 + BUTTON_GAP;
    addButtonPair('physics', 'global-speed', y, 'Max speed', () => config.callbacks.adjustGlobalMaxSpeed(-1), () => config.callbacks.adjustGlobalMaxSpeed(1), {
      getValue: (values) => toDisplayUnits(values.globalMaxSpeed),
      setValue: (value) => config.callbacks.setPhysicsTuning('globalMaxSpeed', value),
      step: 1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'global-impact-cap', y, 'Global cap', () => config.callbacks.adjustGlobalImpactDamageCap(-50), () => config.callbacks.adjustGlobalImpactDamageCap(50), {
      getValue: (values) => values.globalImpactDamageCap,
      setValue: (value) => config.callbacks.setPhysicsTuning('globalImpactDamageCap', value),
      step: 50
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-impact-cap', y, 'Player cap', () => config.callbacks.adjustImpactDamageCap('player', -25), () => config.callbacks.adjustImpactDamageCap('player', 25), {
      getValue: (values) => values.playerImpactDamageCap,
      setValue: (value) => config.callbacks.setPhysicsTuning('playerImpactDamageCap', value),
      step: 25
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'enemy-impact-cap', y, 'Enemy cap', () => config.callbacks.adjustImpactDamageCap('enemy', -25), () => config.callbacks.adjustImpactDamageCap('enemy', 25), {
      getValue: (values) => values.enemyImpactDamageCap,
      setValue: (value) => config.callbacks.setPhysicsTuning('enemyImpactDamageCap', value),
      step: 25
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'asteroid-impact-cap', y, 'Asteroid cap', () => config.callbacks.adjustImpactDamageCap('asteroid', -25), () => config.callbacks.adjustImpactDamageCap('asteroid', 25), {
      getValue: (values) => values.asteroidImpactDamageCap,
      setValue: (value) => config.callbacks.setPhysicsTuning('asteroidImpactDamageCap', value),
      step: 25
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'debris-impact-cap', y, 'Debris cap', () => config.callbacks.adjustImpactDamageCap('debris', -25), () => config.callbacks.adjustImpactDamageCap('debris', 25), {
      getValue: (values) => values.debrisImpactDamageCap,
      setValue: (value) => config.callbacks.setPhysicsTuning('debrisImpactDamageCap', value),
      step: 25
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-impact-scale', y, 'Player scale', () => config.callbacks.adjustImpactDamageScale('player', -0.01), () => config.callbacks.adjustImpactDamageScale('player', 0.01), {
      getValue: (values) => values.playerImpactDamageScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('playerImpactDamageScale', value),
      step: 0.01
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'enemy-impact-scale', y, 'Enemy scale', () => config.callbacks.adjustImpactDamageScale('enemy', -0.01), () => config.callbacks.adjustImpactDamageScale('enemy', 0.01), {
      getValue: (values) => values.enemyImpactDamageScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('enemyImpactDamageScale', value),
      step: 0.01
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'asteroid-impact-scale', y, 'Asteroid scale', () => config.callbacks.adjustImpactDamageScale('asteroid', -0.01), () => config.callbacks.adjustImpactDamageScale('asteroid', 0.01), {
      getValue: (values) => values.asteroidImpactDamageScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('asteroidImpactDamageScale', value),
      step: 0.01
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'debris-impact-scale', y, 'Debris scale', () => config.callbacks.adjustImpactDamageScale('debris', -0.01), () => config.callbacks.adjustImpactDamageScale('debris', 0.01), {
      getValue: (values) => values.debrisImpactDamageScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('debrisImpactDamageScale', value),
      step: 0.01
    });
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('physics', y, 'Player Physics');
    addValue('physics-player', 'physics', y, VALUE_LINE_HEIGHT * 7);
    y += VALUE_LINE_HEIGHT * 7 + BUTTON_GAP;
    addButtonPair('physics', 'player-thrust', y, 'Thrust', () => config.callbacks.adjustPlayerThrustScale(-0.05), () => config.callbacks.adjustPlayerThrustScale(0.05), {
      getValue: (values) => values.playerThrustScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('playerThrustScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-brake', y, 'Brake', () => config.callbacks.adjustPlayerBrakeScale(-0.05), () => config.callbacks.adjustPlayerBrakeScale(0.05), {
      getValue: (values) => values.playerBrakeScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('playerBrakeScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-strafe', y, 'Strafe', () => config.callbacks.adjustPlayerStrafeScale(-0.05), () => config.callbacks.adjustPlayerStrafeScale(0.05), {
      getValue: (values) => values.playerStrafeScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('playerStrafeScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'player-inertia', y, 'Inertia', () => config.callbacks.adjustPlayerInertiaScale(-0.05), () => config.callbacks.adjustPlayerInertiaScale(0.05), {
      getValue: (values) => values.playerInertiaScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('playerInertiaScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    y += ROW_GAP;

    y = addSection('physics', y, 'Enemy Physics');
    addValue('physics-enemy', 'physics', y, VALUE_LINE_HEIGHT * 3);
    y += VALUE_LINE_HEIGHT * 3 + BUTTON_GAP;
    addButtonPair('physics', 'enemy-speed', y, 'Speed', () => config.callbacks.adjustEnemySpeedScale(-0.05), () => config.callbacks.adjustEnemySpeedScale(0.05), {
      getValue: (values) => values.enemySpeedScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('enemySpeedScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'enemy-response', y, 'Thrust', () => config.callbacks.adjustEnemyResponseScale(-0.05), () => config.callbacks.adjustEnemyResponseScale(0.05), {
      getValue: (values) => values.enemyResponseScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('enemyResponseScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    y += ROW_GAP;

    y = addSection('physics', y, 'Asteroid Collisions');
    addValue('physics-asteroids', 'physics', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    addButtonPair('physics', 'asteroid-damage', y, 'Damage', () => config.callbacks.adjustAsteroidCollisionDamageScale(-0.05), () => config.callbacks.adjustAsteroidCollisionDamageScale(0.05), {
      getValue: (values) => values.asteroidCollisionDamageScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('asteroidCollisionDamageScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('physics', 'asteroid-impulse', y, 'Impulse', () => config.callbacks.adjustAsteroidCollisionImpulseScale(-0.05), () => config.callbacks.adjustAsteroidCollisionImpulseScale(0.05), {
      getValue: (values) => values.asteroidCollisionImpulseScale,
      setValue: (value) => config.callbacks.setPhysicsTuning('asteroidCollisionImpulseScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('physics', 'physics-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset physics tuning', config.callbacks.resetPhysicsTuning);
    setTabContentHeight('physics', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildCollisionTab(): void {
    let y = CONTENT_TOP;
    y = addSection('collision', y, 'Simple Hitboxes');
    addValue('collision-shapes', 'collision', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButtonPair('collision', 'collision-global', y, 'Global', () => config.callbacks.adjustCollisionShapeScale('global', -0.05), () => config.callbacks.adjustCollisionShapeScale('global', 0.05), {
      getValue: (values) => parseSummaryValue(values.collisionShapeTuningSummary, /Global x([\d.]+)/),
      setValue: (value) => config.callbacks.setCollisionShapeScale('global', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('collision', 'collision-player', y, 'Player', () => config.callbacks.adjustCollisionShapeScale('player', -0.05), () => config.callbacks.adjustCollisionShapeScale('player', 0.05), {
      getValue: (values) => parseSummaryValue(values.collisionShapeTuningSummary, /Player x([\d.]+)/),
      setValue: (value) => config.callbacks.setCollisionShapeScale('player', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('collision', 'collision-enemy', y, 'Enemy', () => config.callbacks.adjustCollisionShapeScale('enemy', -0.05), () => config.callbacks.adjustCollisionShapeScale('enemy', 0.05), {
      getValue: (values) => parseSummaryValue(values.collisionShapeTuningSummary, /Enemy x([\d.]+)/),
      setValue: (value) => config.callbacks.setCollisionShapeScale('enemy', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('collision', 'collision-asteroid', y, 'Asteroid', () => config.callbacks.adjustCollisionShapeScale('asteroid', -0.05), () => config.callbacks.adjustCollisionShapeScale('asteroid', 0.05), {
      getValue: (values) => parseSummaryValue(values.collisionShapeTuningSummary, /Asteroid x([\d.]+)/),
      setValue: (value) => config.callbacks.setCollisionShapeScale('asteroid', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('collision', 'collision-debris', y, 'Debris', () => config.callbacks.adjustCollisionShapeScale('debris', -0.05), () => config.callbacks.adjustCollisionShapeScale('debris', 0.05), {
      getValue: (values) => parseSummaryValue(values.collisionShapeTuningSummary, /Debris x([\d.]+)/),
      setValue: (value) => config.callbacks.setCollisionShapeScale('debris', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('collision', 'collision-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset hitboxes', config.callbacks.resetCollisionShapeTuning);
    setTabContentHeight('collision', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildSpawnsTab(): void {
    let y = CONTENT_TOP;
    y = addSection('spawns', y, 'Enemy Spawns');
    addValue('spawn-state', 'spawns', y, VALUE_LINE_HEIGHT * 5);
    y += VALUE_LINE_HEIGHT * 5 + BUTTON_GAP;
    addButton('spawns', 'enemy-spawning', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Enemy spawning', config.callbacks.toggleEnemySpawning);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'spawn-chaser', panelX + PANEL_PADDING, y, 98, 'Chaser', () => config.callbacks.spawnEnemy('chaser'));
    addButton('spawns', 'spawn-shooter', panelX + PANEL_PADDING + 109, y, 98, 'Shooter', () => config.callbacks.spawnEnemy('shooter'));
    addButton('spawns', 'spawn-tank', panelX + PANEL_PADDING + 218, y, 98, 'Tank', () => config.callbacks.spawnEnemy('tank'));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'spawn-scout-pack', panelX + PANEL_PADDING, y, 154, 'Scout pack', () => config.callbacks.spawnEncounter('scout-pack'));
    addButton('spawns', 'spawn-gunner-escort', panelX + PANEL_PADDING + 162, y, 154, 'Gunner escort', () => config.callbacks.spawnEncounter('gunner-escort'));
    addButton('spawns', 'spawn-strike-wing', panelX + PANEL_PADDING + 324, y, 154, 'Strike wing', () => config.callbacks.spawnEncounter('strike-wing'));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'spawn-support-group', panelX + PANEL_PADDING, y, 154, 'Support group', () => config.callbacks.spawnEncounter('support-group'));
    addButton('spawns', 'spawn-sniper-screen', panelX + PANEL_PADDING + 162, y, 154, 'Sniper screen', () => config.callbacks.spawnEncounter('sniper-screen'));
    addButton('spawns', 'spawn-carrier-group', panelX + PANEL_PADDING + 324, y, 154, 'Carrier group', () => config.callbacks.spawnEncounter('carrier-group'));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'clear-enemies', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Clear enemies', config.callbacks.clearEnemies);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('spawns', y, 'Asteroids');
    addValue('asteroid-state', 'spawns', y, VALUE_LINE_HEIGHT * 2);
    y += VALUE_LINE_HEIGHT * 2 + BUTTON_GAP;
    addValue('asteroid-breakup', 'spawns', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButtonPair(
      'spawns',
      'asteroid-soft-cap',
      y,
      'Soft cap',
      () => config.callbacks.adjustAsteroidFragmentSoftCap(-10),
      () => config.callbacks.adjustAsteroidFragmentSoftCap(10),
      {
        getValue: (values) => values.asteroidFragmentSoftCap,
        setValue: (value) => config.callbacks.setAsteroidFragmentSoftCap(value),
        step: 1
      }
    );
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair(
      'spawns',
      'asteroid-hard-cap',
      y,
      'Hard cap',
      () => config.callbacks.adjustAsteroidFragmentHardCap(-10),
      () => config.callbacks.adjustAsteroidFragmentHardCap(10),
      {
        getValue: (values) => values.asteroidFragmentHardCap,
        setValue: (value) => config.callbacks.setAsteroidFragmentHardCap(value),
        step: 1
      }
    );
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair(
      'spawns',
      'asteroid-burst-limit',
      y,
      'Burst limit',
      () => config.callbacks.adjustAsteroidFragmentBurstLimit(-10),
      () => config.callbacks.adjustAsteroidFragmentBurstLimit(10),
      {
        getValue: (values) => values.asteroidFragmentBurstLimit,
        setValue: (value) => config.callbacks.setAsteroidFragmentBurstLimit(value),
        step: 1
      }
    );
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'asteroid-breakup-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset breakup caps', config.callbacks.resetAsteroidFragmentTuning);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair(
      'spawns',
      'debug-asteroid-spawn-count',
      y,
      'Spawn count',
      () => config.callbacks.adjustDebugAsteroidSpawnCount(-10),
      () => config.callbacks.adjustDebugAsteroidSpawnCount(10),
      {
        getValue: (values) => values.debugAsteroidSpawnCount,
        setValue: (value) => config.callbacks.setDebugAsteroidSpawnCount(value),
        step: 1
      }
    );
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('spawns', 'debug-asteroid-spawn-count-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset spawn count', config.callbacks.resetDebugAsteroidSpawnCount);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    for (let tier = 1; tier <= 5; tier += 1) {
      addButton(`spawns`, `asteroid-${tier}`, panelX + PANEL_PADDING + (tier - 1) * 109, y, 98, `Tier ${tier}`, () =>
        config.callbacks.spawnAsteroid(tier as DebugAsteroidTier)
      );
    }
    y += BUTTON_HEIGHT + BUTTON_GAP;
    for (let tier = 6; tier <= 10; tier += 1) {
      addButton(`spawns`, `asteroid-${tier}`, panelX + PANEL_PADDING + (tier - 6) * 109, y, 98, `Tier ${tier}`, () =>
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
    y = addSection('blackHole', y, 'Death Vacuum');
    addValue('black-hole', 'blackHole', y, VALUE_LINE_HEIGHT * 8);
    y += VALUE_LINE_HEIGHT * 8 + BUTTON_GAP;
    addBlackHoleStateButtons('blackHole', y);
    y += (BUTTON_HEIGHT + BUTTON_GAP) * 4 + ROW_GAP;

    y = addSection('blackHole', y, 'Vacuum Tuning');
    addValue('black-hole-field', 'blackHole', y, VALUE_LINE_HEIGHT * 8);
    y += VALUE_LINE_HEIGHT * 8 + BUTTON_GAP;
    addBlackHoleVacuumButtons('blackHole', y);
    y += (BUTTON_HEIGHT + BUTTON_GAP) * 8 + ROW_GAP;

    y = addSection('blackHole', y, 'Debug Visuals');
    addButton('blackHole', 'black-hole-radii', panelX + PANEL_PADDING, y, 260, 'Show black hole radii', config.callbacks.toggleBlackHoleRadii);
    addButton('blackHole', 'collision-debug', panelX + PANEL_PADDING + 272, y, 260, 'Show all collision visuals', config.callbacks.toggleCollisionDebug);
    setTabContentHeight('blackHole', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function buildEffectsTab(): void {
    let y = CONTENT_TOP;
    y = addDeathShardControls(y, 'ship', 'Enemy Ship');
    y = addDeathShardControls(y, 'player', 'Player');
    y = addDeathShardControls(y, 'asteroid', 'Asteroid');
    y = addDeathShardControls(y, 'blackHoleShip', 'Black Hole Ship');
    y = addDeathShardControls(y, 'blackHoleAsteroid', 'Black Hole Asteroid');
    addButton('effects', 'death-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset death effects', config.callbacks.resetDeathShardTuning);
    setTabContentHeight('effects', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function addDeathShardControls(y: number, style: DeathShardStyle, label: string): number {
    const key = `death-${style}`;
    y = addSection('effects', y, label);
    addValue(key, 'effects', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButton('effects', `${key}-test`, panelX + PANEL_PADDING, y, COLUMN_WIDTH, `Test ${label}`, () => config.callbacks.testDeathShardEffect(style));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('effects', `${key}-count`, y, 'Count', () => config.callbacks.adjustDeathShardTuning(style, 'countScale', -0.1), () => config.callbacks.adjustDeathShardTuning(style, 'countScale', 0.1), {
      getValue: (values) => parseSummaryValue(values.deathShardTuningSummaries[style], /Count x([\d.]+)/),
      setValue: (value) => config.callbacks.setDeathShardTuning(style, 'countScale', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('effects', `${key}-life`, y, 'Lifetime', () => config.callbacks.adjustDeathShardTuning(style, 'lifetimeScale', -0.1), () => config.callbacks.adjustDeathShardTuning(style, 'lifetimeScale', 0.1), {
      getValue: (values) => parseSummaryValue(values.deathShardTuningSummaries[style], /Life x([\d.]+)/),
      setValue: (value) => config.callbacks.setDeathShardTuning(style, 'lifetimeScale', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('effects', `${key}-size`, y, 'Size', () => config.callbacks.adjustDeathShardTuning(style, 'sizeScale', -0.1), () => config.callbacks.adjustDeathShardTuning(style, 'sizeScale', 0.1), {
      getValue: (values) => parseSummaryValue(values.deathShardTuningSummaries[style], /Size x([\d.]+)/),
      setValue: (value) => config.callbacks.setDeathShardTuning(style, 'sizeScale', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('effects', `${key}-burst`, y, 'Burst speed', () => config.callbacks.adjustDeathShardTuning(style, 'burstSpeedScale', -0.1), () => config.callbacks.adjustDeathShardTuning(style, 'burstSpeedScale', 0.1), {
      getValue: (values) => parseSummaryValue(values.deathShardTuningSummaries[style], /Burst x([\d.]+)/),
      setValue: (value) => config.callbacks.setDeathShardTuning(style, 'burstSpeedScale', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('effects', `${key}-inherit`, y, 'Inherit velocity', () => config.callbacks.adjustDeathShardTuning(style, 'inheritedVelocityScale', -0.1), () => config.callbacks.adjustDeathShardTuning(style, 'inheritedVelocityScale', 0.1), {
      getValue: (values) => parseSummaryValue(values.deathShardTuningSummaries[style], /Inherit x([\d.]+)/),
      setValue: (value) => config.callbacks.setDeathShardTuning(style, 'inheritedVelocityScale', value),
      step: 0.1
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('effects', `${key}-alpha`, y, 'Alpha', () => config.callbacks.adjustDeathShardTuning(style, 'alphaScale', -0.05), () => config.callbacks.adjustDeathShardTuning(style, 'alphaScale', 0.05), {
      getValue: (values) => parseSummaryValue(values.deathShardTuningSummaries[style], /Alpha x([\d.]+)/),
      setValue: (value) => config.callbacks.setDeathShardTuning(style, 'alphaScale', value),
      step: 0.05
    });
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('effects', `${key}-dissolve`, y, 'Dissolve', () => config.callbacks.adjustDeathShardTuning(style, 'dissolveStart', -0.05), () => config.callbacks.adjustDeathShardTuning(style, 'dissolveStart', 0.05), {
      getValue: (values) => parseSummaryValue(values.deathShardTuningSummaries[style], /Dissolve ([\d.]+)%/) / 100,
      setValue: (value) => config.callbacks.setDeathShardTuning(style, 'dissolveStart', value),
      step: 0.05
    });

    return y + BUTTON_HEIGHT + ROW_GAP;
  }

  function buildVisualsTab(): void {
    let y = CONTENT_TOP;
    y = addSection('visuals', y, 'HUD Dashboard Variants');
    addValue('hud-button-variants', 'visuals', y, VALUE_LINE_HEIGHT * 7);
    y += VALUE_LINE_HEIGHT * 7 + BUTTON_GAP;
    addButton('visuals', 'hud-button-prev', panelX + PANEL_PADDING, y, 154, 'Previous HUD', () => config.callbacks.cycleHudButtonVariant(-1));
    addButton('visuals', 'hud-button-next', panelX + PANEL_PADDING + 162, y, 154, 'Next HUD', () => config.callbacks.cycleHudButtonVariant(1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    for (let index = 0; index < 5; index += 1) {
      const variant = HUD_BUTTON_VARIANTS[index];
      addButton('visuals', `hud-button-${variant.id}`, panelX + PANEL_PADDING + index * 104, y, 98, `${variant.id} ${variant.shortLabel}`, () =>
        config.callbacks.setHudButtonVariant(variant.id)
      );
    }
    y += BUTTON_HEIGHT + BUTTON_GAP;
    for (let index = 5; index < HUD_BUTTON_VARIANTS.length; index += 1) {
      const variant = HUD_BUTTON_VARIANTS[index];
      addButton('visuals', `hud-button-${variant.id}`, panelX + PANEL_PADDING + (index - 5) * 104, y, 98, `${variant.id} ${variant.shortLabel}`, () =>
        config.callbacks.setHudButtonVariant(variant.id)
      );
    }
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('visuals', y, 'Health Bars');
    addValue('health-bars', 'visuals', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButton('visuals', 'health-bars-toggle', panelX + PANEL_PADDING, y, 154, 'Health bars', config.callbacks.toggleHealthBars);
    addButton('visuals', 'player-health-bar', panelX + PANEL_PADDING + 162, y, 154, 'Player bar', config.callbacks.togglePlayerHealthBar);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('visuals', 'health-reveal', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reveal on player damage', config.callbacks.toggleHealthBarRevealOnPlayerDamage);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'health-width', y, 'Width', () => config.callbacks.adjustHealthBarWidthScale(-0.1), () => config.callbacks.adjustHealthBarWidthScale(0.1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'health-height', y, 'Height', () => config.callbacks.adjustHealthBarHeight(-1), () => config.callbacks.adjustHealthBarHeight(1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'health-offset', y, 'Offset', () => config.callbacks.adjustHealthBarVerticalOffset(-4), () => config.callbacks.adjustHealthBarVerticalOffset(4));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'health-alpha', y, 'Alpha', () => config.callbacks.adjustHealthBarAlpha(-0.05), () => config.callbacks.adjustHealthBarAlpha(0.05));
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('visuals', y, 'Damage Numbers');
    addValue('damage-numbers', 'visuals', y, VALUE_LINE_HEIGHT * 6);
    y += VALUE_LINE_HEIGHT * 6 + BUTTON_GAP;
    addButton('visuals', 'damage-numbers-toggle', panelX + PANEL_PADDING, y, 154, 'Damage text', config.callbacks.toggleDamageNumbers);
    addButton('visuals', 'damage-number-colors', panelX + PANEL_PADDING + 162, y, 154, 'Source colors', config.callbacks.toggleDamageNumberSourceColors);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('visuals', 'asteroid-damage-flash', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Asteroid flash', config.callbacks.toggleAsteroidDamageFlash);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'damage-font', y, 'Font', () => config.callbacks.adjustDamageNumberFontSize(-1), () => config.callbacks.adjustDamageNumberFontSize(1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'damage-life', y, 'Life', () => config.callbacks.adjustDamageNumberLifetimeMs(-100), () => config.callbacks.adjustDamageNumberLifetimeMs(100));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'damage-rise', y, 'Rise', () => config.callbacks.adjustDamageNumberRiseDistance(-4), () => config.callbacks.adjustDamageNumberRiseDistance(4));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'damage-drift', y, 'Drift', () => config.callbacks.adjustDamageNumberDrift(-4), () => config.callbacks.adjustDamageNumberDrift(4));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'damage-pop', y, 'Pop', () => config.callbacks.adjustDamageNumberScalePop(-0.05), () => config.callbacks.adjustDamageNumberScalePop(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'damage-fade', y, 'Fade', () => config.callbacks.adjustDamageNumberFadeStart(-0.05), () => config.callbacks.adjustDamageNumberFadeStart(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButtonPair('visuals', 'damage-alpha', y, 'Alpha', () => config.callbacks.adjustDamageNumberAlpha(-0.05), () => config.callbacks.adjustDamageNumberAlpha(0.05));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('visuals', 'feedback-reset', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Reset combat feedback', config.callbacks.resetCombatFeedbackTuning);
    y += BUTTON_HEIGHT + ROW_GAP;

    y = addSection('visuals', y, 'Background');
    addValue('background', 'visuals', y, VALUE_LINE_HEIGHT * 4);
    y += VALUE_LINE_HEIGHT * 4 + BUTTON_GAP;
    addButton('visuals', 'background-stars', panelX + PANEL_PADDING, y, 154, 'Toggle stars', config.callbacks.toggleBackgroundStars);
    addButton('visuals', 'parallax-reset', panelX + PANEL_PADDING + 162, y, 154, 'Reset background', config.callbacks.resetStarfieldParallax);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('visuals', 'far-parallax-down', panelX + PANEL_PADDING, y, 126, 'Far layer down', () => config.callbacks.adjustStarfieldParallax('far', -1));
    addButton('visuals', 'far-parallax-up', panelX + PANEL_PADDING + 134, y, 126, 'Far layer up', () => config.callbacks.adjustStarfieldParallax('far', 1));
    addButton('visuals', 'mid-parallax-down', panelX + PANEL_PADDING + 272, y, 126, 'Middle down', () => config.callbacks.adjustStarfieldParallax('mid', -1));
    addButton('visuals', 'mid-parallax-up', panelX + PANEL_PADDING + 406, y, 126, 'Middle up', () => config.callbacks.adjustStarfieldParallax('mid', 1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton('visuals', 'near-parallax-down', panelX + PANEL_PADDING, y, 154, 'Near layer down', () => config.callbacks.adjustStarfieldParallax('near', -1));
    addButton('visuals', 'near-parallax-up', panelX + PANEL_PADDING + 162, y, 154, 'Near layer up', () => config.callbacks.adjustStarfieldParallax('near', 1));
    setTabContentHeight('visuals', y + BUTTON_HEIGHT + PANEL_PADDING);
  }

  function addBlackHoleStateButtons(tabId: DebugTabId, y: number): void {
    addButton(tabId, 'black-hole-player-capture', panelX + PANEL_PADDING, y, 260, 'Player capture: on', config.callbacks.toggleBlackHolePlayerCapture);
    addButton(tabId, 'black-hole-object-consume', panelX + PANEL_PADDING + 272, y, 260, 'Object consume: on', config.callbacks.toggleBlackHoleObjectConsumption);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'black-hole-warning-visuals', panelX + PANEL_PADDING, y, 260, 'Warning visuals: on', config.callbacks.toggleBlackHoleWarningVisuals);
    addButton(tabId, 'black-hole-growth-plus', panelX + PANEL_PADDING + 272, y, 260, 'Add 5 minutes growth', () => config.callbacks.addBlackHoleGrowthMinutes(5));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'black-hole-move-player', panelX + PANEL_PADDING, y, 260, 'Move to player', config.callbacks.moveBlackHoleToPlayer);
    addButton(tabId, 'black-hole-move-away', panelX + PANEL_PADDING + 272, y, 260, 'Move away from player', config.callbacks.moveBlackHoleAwayFromPlayer);
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'black-hole-capture-test', panelX + PANEL_PADDING, y, 260, 'Force capture test', config.callbacks.forceBlackHoleCaptureTest);
    addButton(tabId, 'black-hole-reset-growth', panelX + PANEL_PADDING + 272, y, 260, 'Reset growth', config.callbacks.resetBlackHoleGrowth);
  }

  function addBlackHoleVacuumButtons(tabId: DebugTabId, y: number): void {
    addButton(tabId, 'vacuum-base-down', panelX + PANEL_PADDING, y, 126, 'Base horizon -', () => config.callbacks.adjustBlackHoleVacuumTuning('baseEventHorizonRadius', -10));
    addButton(tabId, 'vacuum-base-up', panelX + PANEL_PADDING + 134, y, 126, 'Base horizon +', () => config.callbacks.adjustBlackHoleVacuumTuning('baseEventHorizonRadius', 10));
    addButton(tabId, 'vacuum-max-down', panelX + PANEL_PADDING + 272, y, 126, 'Max horizon -', () => config.callbacks.adjustBlackHoleVacuumTuning('maxEventHorizonRadius', -10));
    addButton(tabId, 'vacuum-max-up', panelX + PANEL_PADDING + 406, y, 126, 'Max horizon +', () => config.callbacks.adjustBlackHoleVacuumTuning('maxEventHorizonRadius', 10));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'vacuum-growth-down', panelX + PANEL_PADDING, y, 126, 'Growth rate -', () => config.callbacks.adjustBlackHoleVacuumTuning('growthPerMinute', -0.5));
    addButton(tabId, 'vacuum-growth-up', panelX + PANEL_PADDING + 134, y, 126, 'Growth rate +', () => config.callbacks.adjustBlackHoleVacuumTuning('growthPerMinute', 0.5));
    addButton(tabId, 'vacuum-capture-duration-down', panelX + PANEL_PADDING + 272, y, 126, 'Capture time -', () => config.callbacks.adjustBlackHoleVacuumTuning('playerCaptureDurationMs', -100));
    addButton(tabId, 'vacuum-capture-duration-up', panelX + PANEL_PADDING + 406, y, 126, 'Capture time +', () => config.callbacks.adjustBlackHoleVacuumTuning('playerCaptureDurationMs', 100));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'vacuum-capture-margin-down', panelX + PANEL_PADDING, y, 126, 'Capture size -', () => config.callbacks.adjustBlackHoleVacuumTuning('captureMargin', -10));
    addButton(tabId, 'vacuum-capture-margin-up', panelX + PANEL_PADDING + 134, y, 126, 'Capture size +', () => config.callbacks.adjustBlackHoleVacuumTuning('captureMargin', 10));
    addButton(tabId, 'vacuum-warning-margin-down', panelX + PANEL_PADDING + 272, y, 126, 'Warning size -', () => config.callbacks.adjustBlackHoleVacuumTuning('warningMargin', -10));
    addButton(tabId, 'vacuum-warning-margin-up', panelX + PANEL_PADDING + 406, y, 126, 'Warning size +', () => config.callbacks.adjustBlackHoleVacuumTuning('warningMargin', 10));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'vacuum-player-pull-down', panelX + PANEL_PADDING, y, 126, 'Player pull -', () => config.callbacks.adjustBlackHoleVacuumTuning('playerPullStrength', -25));
    addButton(tabId, 'vacuum-player-pull-up', panelX + PANEL_PADDING + 134, y, 126, 'Player pull +', () => config.callbacks.adjustBlackHoleVacuumTuning('playerPullStrength', 25));
    addButton(tabId, 'vacuum-object-pull-down', panelX + PANEL_PADDING + 272, y, 126, 'Object pull -', () => config.callbacks.adjustBlackHoleVacuumTuning('objectPullStrength', -25));
    addButton(tabId, 'vacuum-object-pull-up', panelX + PANEL_PADDING + 406, y, 126, 'Object pull +', () => config.callbacks.adjustBlackHoleVacuumTuning('objectPullStrength', 25));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'black-hole-escape-test', panelX + PANEL_PADDING, y, COLUMN_WIDTH, 'Force escape test', config.callbacks.forceBlackHoleEscapeTest);
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
    addButton(tabId, 'field-vel-down', panelX + PANEL_PADDING, y, 154, 'Vel -', () => config.callbacks.adjustBlackHoleMaxVelocity(-0.1));
    addButton(tabId, 'field-vel-up', panelX + PANEL_PADDING + 162, y, 154, 'Vel +', () => config.callbacks.adjustBlackHoleMaxVelocity(0.1));
    y += BUTTON_HEIGHT + BUTTON_GAP;
    addButton(tabId, 'field-visual-down', panelX + PANEL_PADDING, y, 74, 'Vis -', () => config.callbacks.adjustBlackHoleVisualScale(-0.5));
    addButton(tabId, 'field-visual-up', panelX + PANEL_PADDING + 80, y, 74, 'Vis +', () => config.callbacks.adjustBlackHoleVisualScale(0.5));
    addButton(tabId, 'field-core-down', panelX + PANEL_PADDING + 162, y, 74, 'Core -', () => config.callbacks.adjustBlackHoleCoreScale(-0.1));
    addButton(tabId, 'field-core-up', panelX + PANEL_PADDING + 242, y, 74, 'Core +', () => config.callbacks.adjustBlackHoleCoreScale(0.1));
  }

  function addButtonPair(
    tabId: DebugTabId,
    keyPrefix: string,
    y: number,
    label: string,
    downCallback: () => void,
    upCallback: () => void,
    numberInput?: DebugNumberInputConfig
  ): void {
    if (!numberInput) {
      addButton(tabId, `${keyPrefix}-down`, panelX + PANEL_PADDING, y, 154, `${label} -`, downCallback);
      addButton(tabId, `${keyPrefix}-up`, panelX + PANEL_PADDING + 162, y, 154, `${label} +`, upCallback);
      return;
    }

    addButton(tabId, `${keyPrefix}-down`, panelX + PANEL_PADDING, y, 154, `${label} down`, downCallback);
    addNumberInput(tabId, keyPrefix, panelX + PANEL_PADDING + 162, y, 154, numberInput);
    addButton(tabId, `${keyPrefix}-up`, panelX + PANEL_PADDING + 324, y, 154, `${label} up`, upCallback);
  }

  function addNumberInput(
    tabId: DebugTabId,
    key: string,
    x: number,
    y: number,
    width: number,
    inputConfig: DebugNumberInputConfig
  ): void {
    if (typeof document === 'undefined') {
      return;
    }

    const element = document.createElement('input');
    element.type = 'number';
    element.step = `${inputConfig.step ?? 0.01}`;
    element.dataset.debugKey = key;
    Object.assign(element.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1500',
      boxSizing: 'border-box',
      height: `${BUTTON_HEIGHT}px`,
      background: '#071018',
      border: '1px solid #52627f',
      color: '#f2fbff',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: '12px',
      textAlign: 'center',
      outline: 'none',
      padding: '0 4px'
    });

    const applyValue = () => {
      const value = Number(element.value);
      if (Number.isFinite(value)) {
        inputConfig.setValue(value);
      }
    };

    const stopDomEvent = (event: Event) => event.stopPropagation();

    element.addEventListener('pointerdown', stopDomEvent);
    element.addEventListener('pointerup', stopDomEvent);
    element.addEventListener('click', stopDomEvent);
    element.addEventListener('wheel', stopDomEvent);
    element.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        applyValue();
        element.blur();
      }
      if (event.key === 'Escape') {
        element.blur();
      }
    });
    element.addEventListener('blur', applyValue);
    document.body.appendChild(element);
    numberInputs.push({
      element,
      tabId,
      baseY: y,
      x,
      width,
      getValue: inputConfig.getValue,
      setValue: inputConfig.setValue
    });
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

    refreshNumberInputPositions();
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

    refreshNumberInputVisibility();
  }

  function refreshNumberInputPositions(): void {
    const rect = scene.game.canvas.getBoundingClientRect();
    const scaleX = rect.width / scene.scale.width;
    const scaleY = rect.height / scene.scale.height;

    for (const input of numberInputs) {
      input.element.style.left = `${rect.left + input.x * scaleX}px`;
      input.element.style.top = `${rect.top + (input.baseY + (input.tabId === activeTab ? scrollOffset : 0)) * scaleY}px`;
      input.element.style.width = `${input.width * scaleX}px`;
      input.element.style.height = `${BUTTON_HEIGHT * scaleY}px`;
    }
  }

  function refreshNumberInputVisibility(): void {
    const visibleTop = CONTENT_TOP;
    const visibleBottom = scene.scale.height - PANEL_PADDING;

    for (const input of numberInputs) {
      const y = input.baseY + (input.tabId === activeTab ? scrollOffset : 0);
      const isVisible = open && input.tabId === activeTab && y >= visibleTop - BUTTON_HEIGHT && y <= visibleBottom;
      input.element.style.display = isVisible ? 'block' : 'none';
      input.element.disabled = !isVisible;
    }
  }

  function hideNumberInputs(): void {
    for (const input of numberInputs) {
      input.element.blur();
      input.element.style.display = 'none';
      input.element.disabled = true;
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
    const text = valuesTextByKey.get(key);
    if (text && text.text !== value) {
      text.setText(value);
    }
  }

  function setButtonLabel(key: string, value: string): void {
    const button = buttonsByKey.get(key);
    if (button && button.text.text !== value) {
      button.setLabel(value);
    }
  }

  function formatRunTime(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function parseSummaryValue(summary: string, pattern: RegExp): number {
    const match = summary.match(pattern);
    const value = Number(match?.[1]);
    return Number.isFinite(value) ? value : 0;
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
      hideNumberInputs();
      refreshButtonInputs();
    },
    toggle: () => {
      open = !open;
      container.setVisible(open);
      if (!open) {
        hideNumberInputs();
      }
      refreshButtonInputs();
    },
    isOpen: () => open,
    containsPointer: (pointer: Phaser.Input.Pointer) =>
      open &&
      pointer.x >= panelX &&
      pointer.x <= panelX + PANEL_WIDTH &&
      pointer.y >= panelY &&
      pointer.y <= panelY + panelHeight,
    update: (values: DebugMenuValues) => {
      for (const input of numberInputs) {
        if (input.tabId === activeTab && typeof document !== 'undefined' && document.activeElement !== input.element) {
          const value = input.getValue(values);
          input.element.value = Number.isFinite(value) ? `${value}` : '';
        }
      }
      refreshNumberInputPositions();
      refreshNumberInputVisibility();
      if (activeTab === 'run') {
        setValue(
          'run-overview',
          `Time ${formatRunTime(values.runTimeSeconds)} / ${values.debugGamePaused ? 'paused' : 'running'}\n` +
            `Ship ${values.selectedShipName} / weapon ${values.activeWeaponName}\n` +
            `Hull ${Math.ceil(values.playerHull)} / ${Math.ceil(values.playerMaxHull)} / fuel ${Math.ceil(values.fuel)} / ${values.fuelMax}\n` +
            `XP ${values.playerXp} / ${values.nextXpThreshold} / banked ${values.bankedUpgrades}\n` +
            `Entities E/A/D/S ${values.activeEnemies}/${values.activeAsteroids}/${values.activeDebris}/${values.activeScrapPickups}\n` +
            `Projectiles P/E ${values.playerProjectiles}/${values.enemyProjectiles}\n` +
            `Scrap ${values.runScrapTotal} / credits ${values.totalCredits}`
        );
        setValue('run-state', `Game: ${values.debugGamePaused ? 'paused' : 'running'}`);
        setValue('profiler', values.performanceProfilerSummary);
        setValue('diagnostics', values.autoDiagnosticsSummary);
        setValue('scrap', `Pickups: ${values.activeScrapPickups}\nRun scrap: ${values.runScrapTotal} / spent ${values.runScrapSpent}\nCredits: ${values.totalCredits}\nReroll next: ${values.nextRerollCost}`);
        setButtonLabel('debug-pause', `Pause game: ${values.debugGamePaused ? 'on' : 'off'}`);
        setButtonLabel('profiler-toggle', `Profiler: ${values.performanceProfilerEnabled ? 'on' : 'off'}`);
        setButtonLabel('profiler-start', values.performanceProfilerManualActive ? 'Recording' : 'Start');
        setButtonLabel('diagnostics-toggle', `Diagnostics: ${values.autoDiagnosticsEnabled ? 'on' : 'off'}`);
        setButtonLabel('reroll-cost-mode', values.debugRerollCostBase === 5 ? 'Reroll: 5 scale' : 'Reroll: 10 scale');
      } else if (activeTab === 'player') {
        setValue(
          'player-state',
          `State: ${values.playerAlive ? 'alive' : 'dead'} / hull ${Math.ceil(values.playerHull)} of ${Math.ceil(values.playerMaxHull)}\n` +
            `Position: ${values.playerX.toFixed(0)}, ${values.playerY.toFixed(0)}\n` +
            `Velocity: ${formatIntegerDisplayUnits(values.playerVelocityX)}, ${formatIntegerDisplayUnits(values.playerVelocityY)} / speed ${formatIntegerDisplayUnits(values.playerSpeed)}\n` +
            `Mission distance: ${Math.round(values.missionObjectiveDistance)}\n` +
            `XP: ${values.playerXp} / ${values.nextXpThreshold} / banked ${values.bankedUpgrades}\n` +
            `Projectiles: player ${values.playerProjectiles} / enemy ${values.enemyProjectiles}\n` +
            `Invulnerability: ${values.playerInvulnerable ? 'on' : 'off'} / contact damage: ${values.playerCollisionDamageImmune ? 'blocked' : 'normal'}\n` +
            `Secret controls: ${values.secretControlUnlocked ? 'unlocked' : 'locked'}`
        );
        setValue(
          'fuel',
          `Fuel: ${Math.ceil(values.fuel)} / ${values.fuelMax}\nDrain: ${
            values.fuelDrainEnabled ? 'on' : 'paused'
          }\nMode: thrust-only`
        );
        setButtonLabel('player-invuln', `Debug invulnerability: ${values.playerInvulnerable ? 'on' : 'off'}`);
        setButtonLabel('player-collision-immune', `Contact damage: ${values.playerCollisionDamageImmune ? 'blocked' : 'normal'}`);
        setButtonLabel('fuel-drain-toggle', `Drain: ${values.fuelDrainEnabled ? 'on' : 'paused'}`);
        setButtonLabel('fuel-mode-toggle', 'Thrust only');
        setButtonLabel('secret-controls-unlock', values.secretControlUnlocked ? 'Controls unlocked' : 'Unlock controls');
      } else if (activeTab === 'ship') {
        setValue(
          'ship-stats',
          `Ship: ${values.selectedShipName}\nHull: ${Math.ceil(values.playerHull)} / ${Math.ceil(values.playerMaxHull)}\nVelocity ${formatIntegerDisplayUnits(values.playerSpeed)} / ${formatIntegerDisplayUnits(values.playerMaxSpeed)}\nAcceleration ${formatIntegerDisplayUnits(values.playerThrust)}\nBrake ${formatIntegerDisplayUnits(values.playerBrake)}\nStrafe ${formatIntegerDisplayUnits(values.playerStrafe)}`
        );
        setValue('ship-loadout-interceptor', values.shipTuningSummaries.interceptor);
        setValue('ship-loadout-bulwark', values.shipTuningSummaries.bulwark);
        setValue(
          'shield-state',
          values.rammingShieldMaxHp > 0
            ? `HP ${Math.ceil(values.rammingShieldHp)} / ${values.rammingShieldMaxHp}\nDash ${values.rammingShieldDashCharges} / ${values.rammingShieldDashMaxCharges}`
            : 'Not equipped'
        );
        setValue('projectiles', `Player: ${values.playerProjectiles}\nEnemy: ${values.enemyProjectiles}`);
      } else if (activeTab === 'weapons') {
        setValue(
          'weapon',
          `Damage x${values.weaponDamageMultiplier.toFixed(1)}\nFire x${values.weaponFireRateMultiplier.toFixed(1)}\nCooldown ${values.weaponCooldownSeconds.toFixed(2)}s`
        );
        setValue('weapon-loadout-pulse-cannon', values.weaponTuningSummaries['pulse-cannon']);
        setValue('weapon-loadout-ramming-shield', values.weaponTuningSummaries['ramming-shield']);
      } else if (activeTab === 'physics') {
        setValue(
          'physics-global',
          `Global max ${formatIntegerDisplayUnits(values.globalMaxSpeed)}\nImpact cap ${values.globalImpactDamageCap.toFixed(1)}\n` +
            `Caps P/E/A/D ${values.playerImpactDamageCap.toFixed(0)}/${values.enemyImpactDamageCap.toFixed(0)}/${values.asteroidImpactDamageCap.toFixed(0)}/${values.debrisImpactDamageCap.toFixed(0)}\n` +
            `Scale P/E/A/D ${values.playerImpactDamageScale.toFixed(3)}/${values.enemyImpactDamageScale.toFixed(3)}/${values.asteroidImpactDamageScale.toFixed(3)}/${values.debrisImpactDamageScale.toFixed(3)}`
        );
        setValue(
          'physics-player',
          `Velocity ${formatIntegerDisplayUnits(values.playerSpeed)} / ${formatIntegerDisplayUnits(values.playerMaxSpeed)}\nAcceleration x${values.playerThrustScale.toFixed(2)} = ${formatIntegerDisplayUnits(values.playerThrust)}\nBrake x${values.playerBrakeScale.toFixed(2)} = ${formatIntegerDisplayUnits(values.playerBrake)}\nStrafe x${values.playerStrafeScale.toFixed(2)} = ${formatIntegerDisplayUnits(values.playerStrafe)}\nInertia x${values.playerInertiaScale.toFixed(2)}`
        );
        setValue(
          'physics-enemy',
          `Speed x${values.enemySpeedScale.toFixed(2)}\nThrust/response x${values.enemyResponseScale.toFixed(2)}`
        );
        setValue(
          'physics-asteroids',
          `Collision damage x${values.asteroidCollisionDamageScale.toFixed(2)}\nCollision impulse x${values.asteroidCollisionImpulseScale.toFixed(2)}`
        );
      } else if (activeTab === 'collision') {
        setValue('collision-shapes', values.collisionShapeTuningSummary);
      } else if (activeTab === 'spawns') {
        setValue('spawn-state', values.spawnDirectorSummary);
        setValue(
          'asteroid-state',
          `Asteroids active: ${values.activeAsteroids}\nSpawner: ${
            values.asteroidSpawningAvailable ? (values.asteroidSpawningEnabled ? 'on' : 'off') : 'not implemented'
          }`
        );
        setValue(
          'asteroid-breakup',
          `Breakup soft: ${values.asteroidFragmentSoftCap}\nBreakup hard: ${values.asteroidFragmentHardCap}\nBurst limit: ${values.asteroidFragmentBurstLimit} / 500ms\nSpawn/click: ${values.debugAsteroidSpawnCount}`
        );
        setValue('debris', `Active: ${values.activeDebris}`);
        setButtonLabel('enemy-spawning', `Enemy spawning: ${values.enemySpawningEnabled ? 'on' : 'off'}`);
      } else if (activeTab === 'effects') {
        setValue('death-ship', values.deathShardTuningSummaries.ship);
        setValue('death-player', values.deathShardTuningSummaries.player);
        setValue('death-asteroid', values.deathShardTuningSummaries.asteroid);
        setValue('death-blackHoleShip', values.deathShardTuningSummaries.blackHoleShip);
        setValue('death-blackHoleAsteroid', values.deathShardTuningSummaries.blackHoleAsteroid);
        setValue(
          'health-bars',
          `Bars: ${values.healthBarsEnabled ? 'on' : 'off'} / player ${values.playerHealthBarEnabled ? 'on' : 'off'}\nReveal: ${
            values.healthBarRevealOnPlayerDamage ? 'player damage' : 'always'
          }\nSize x${values.healthBarWidthScale.toFixed(2)} / ${values.healthBarHeight}px\nOffset ${values.healthBarVerticalOffset}px / alpha ${values.healthBarAlpha.toFixed(2)}`
        );
        setValue(
          'damage-numbers',
          `Text: ${values.damageNumbersEnabled ? 'on' : 'off'} / colors ${
            values.damageNumberSourceColorsEnabled ? 'source' : 'single'
          }\nAsteroid flash: ${values.asteroidDamageFlashEnabled ? 'on' : 'off'}\nFont ${values.damageNumberFontSize}px / life ${values.damageNumberLifetimeMs}ms\nRise ${values.damageNumberRiseDistance}px / drift ${values.damageNumberDrift}px\nPop x${values.damageNumberScalePop.toFixed(2)} / fade ${(values.damageNumberFadeStart * 100).toFixed(0)}%\nAlpha ${values.damageNumberAlpha.toFixed(2)}`
        );
        setButtonLabel('health-bars-toggle', `Health bars: ${values.healthBarsEnabled ? 'on' : 'off'}`);
        setButtonLabel('player-health-bar', `Player bar: ${values.playerHealthBarEnabled ? 'on' : 'off'}`);
        setButtonLabel('health-reveal', `Reveal: ${values.healthBarRevealOnPlayerDamage ? 'player damage' : 'always'}`);
        setButtonLabel('damage-numbers-toggle', `Damage text: ${values.damageNumbersEnabled ? 'on' : 'off'}`);
        setButtonLabel('damage-number-colors', `Colors: ${values.damageNumberSourceColorsEnabled ? 'source' : 'single'}`);
        setButtonLabel('asteroid-damage-flash', `Asteroid flash: ${values.asteroidDamageFlashEnabled ? 'on' : 'off'}`);
      } else if (activeTab === 'blackHole') {
        setValue(
          'black-hole',
          `Active: ${values.blackHoleActive ? 'yes' : 'no'} / position ${values.blackHoleX.toFixed(0)}, ${values.blackHoleY.toFixed(0)}\n` +
            `Run age: ${formatRunTime(values.blackHoleRunAgeSeconds)} / growth ${(values.blackHoleGrowthPercent * 100).toFixed(0)}%\n` +
            `Event horizon: ${values.blackHoleEventHorizonRadius.toFixed(0)}\n` +
            `Capture radius: ${values.blackHoleCaptureRadius.toFixed(0)} / warning radius: ${values.blackHoleWarningRadius.toFixed(0)}\n` +
            `Player capture: ${values.blackHolePlayerCaptureEnabled ? 'on' : 'off'} / ${
              values.blackHolePlayerCaptured ? `${(values.blackHoleCaptureTimerRemainingMs / 1000).toFixed(1)}s left` : 'clear'
            }\n` +
            `Object consume: ${values.blackHoleObjectConsumptionEnabled ? 'on' : 'off'} / consumed ${values.blackHoleConsumedObjects}\n` +
            `Warning visuals: ${values.blackHoleWarningVisualsEnabled ? 'on' : 'off'}\n` +
            `Radii overlay: ${values.blackHoleRadiiVisible ? 'shown' : 'hidden'} / collision: ${values.collisionDebugEnabled ? 'shown' : 'hidden'}`
        );
        setValue(
          'black-hole-field',
          `Base horizon: ${values.blackHoleBaseEventHorizonRadius.toFixed(0)} / max ${values.blackHoleMaxEventHorizonRadius.toFixed(0)}\n` +
            `Growth: ${values.blackHoleGrowthPerMinute.toFixed(1)} radius/min\n` +
            `Capture margin: ${values.blackHoleCaptureMargin.toFixed(0)} / warning margin: ${values.blackHoleWarningMargin.toFixed(0)}\n` +
            `Capture time: ${(values.blackHolePlayerCaptureDurationMs / 1000).toFixed(1)}s\n` +
            `Player pull: ${values.blackHolePlayerPullStrength.toFixed(0)}\n` +
            `Object pull: ${values.blackHoleObjectPullStrength.toFixed(0)}\n` +
            `Visual scale: ${values.blackHoleVisualScale.toFixed(1)} / core scale: ${values.blackHoleCoreScale.toFixed(1)}\n` +
            `Old force damage: removed`
        );
        setButtonLabel('black-hole-radii', `Black hole radii: ${values.blackHoleRadiiVisible ? 'shown' : 'hidden'}`);
        setButtonLabel('collision-debug', `Collision visuals: ${values.collisionDebugEnabled ? 'on' : 'off'}`);
        setButtonLabel('black-hole-player-capture', `Player capture: ${values.blackHolePlayerCaptureEnabled ? 'on' : 'off'}`);
        setButtonLabel('black-hole-object-consume', `Object consume: ${values.blackHoleObjectConsumptionEnabled ? 'on' : 'off'}`);
        setButtonLabel('black-hole-warning-visuals', `Warning visuals: ${values.blackHoleWarningVisualsEnabled ? 'on' : 'off'}`);
      } else if (activeTab === 'visuals') {
        setValue(
          'hud-button-variants',
          `Variant ${values.hudButtonVariant}: ${values.hudButtonVariantTitle}\n` +
            `Target: ${values.hudButtonVariantDesignTarget}\n` +
            `Research: ${values.hudButtonVariantResearchBasis}\n` +
            `Dev query: ?devHudVariants=1&hudButtonVariant=${values.hudButtonVariant}`
        );
        setValue(
          'health-bars',
          `Bars: ${values.healthBarsEnabled ? 'on' : 'off'} / player ${values.playerHealthBarEnabled ? 'on' : 'off'}\nReveal: ${
            values.healthBarRevealOnPlayerDamage ? 'player damage' : 'always'
          }\nSize x${values.healthBarWidthScale.toFixed(2)} / ${values.healthBarHeight}px\nOffset ${values.healthBarVerticalOffset}px / alpha ${values.healthBarAlpha.toFixed(2)}`
        );
        setValue(
          'damage-numbers',
          `Text: ${values.damageNumbersEnabled ? 'on' : 'off'} / colors ${
            values.damageNumberSourceColorsEnabled ? 'source' : 'single'
          }\nAsteroid flash: ${values.asteroidDamageFlashEnabled ? 'on' : 'off'}\nFont ${values.damageNumberFontSize}px / life ${values.damageNumberLifetimeMs}ms\nRise ${values.damageNumberRiseDistance}px / drift ${values.damageNumberDrift}px\nPop x${values.damageNumberScalePop.toFixed(2)} / fade ${(values.damageNumberFadeStart * 100).toFixed(0)}%\nAlpha ${values.damageNumberAlpha.toFixed(2)}`
        );
        setValue(
          'background',
          `Stars: ${values.backgroundStarsVisible ? 'on' : 'off'}\nFar ${values.starfieldFarParallax.toFixed(2)}\nMid ${values.starfieldMidParallax.toFixed(2)}\nNear ${values.starfieldNearParallax.toFixed(2)}`
        );
        setButtonLabel('health-bars-toggle', `Health bars: ${values.healthBarsEnabled ? 'on' : 'off'}`);
        setButtonLabel('player-health-bar', `Player bar: ${values.playerHealthBarEnabled ? 'on' : 'off'}`);
        setButtonLabel('health-reveal', `Reveal: ${values.healthBarRevealOnPlayerDamage ? 'player damage' : 'always'}`);
        setButtonLabel('damage-numbers-toggle', `Damage text: ${values.damageNumbersEnabled ? 'on' : 'off'}`);
        setButtonLabel('damage-number-colors', `Colors: ${values.damageNumberSourceColorsEnabled ? 'source' : 'single'}`);
        setButtonLabel('asteroid-damage-flash', `Asteroid flash: ${values.asteroidDamageFlashEnabled ? 'on' : 'off'}`);
        setButtonLabel('background-stars', `Background stars: ${values.backgroundStarsVisible ? 'on' : 'off'}`);
        setButtonLabel('hud-button-prev', `Previous: ${values.hudButtonVariant === 1 ? 10 : values.hudButtonVariant - 1}`);
        setButtonLabel('hud-button-next', `Next: ${values.hudButtonVariant === 10 ? 1 : values.hudButtonVariant + 1}`);
        for (const variant of HUD_BUTTON_VARIANTS) {
          setButtonLabel(
            `hud-button-${variant.id}`,
            `${values.hudButtonVariant === variant.id ? '*' : ''}${variant.id} ${variant.shortLabel}`
          );
        }
      }
    },
    destroy: () => {
      panelBlocker.destroy();
      for (const hitArea of buttonHitAreas) {
        hitArea.destroy();
      }
      for (const hitArea of valueHitAreas) {
        hitArea.destroy();
      }
      for (const input of numberInputs) {
        input.element.remove();
      }
      tooltipBackground.destroy();
      tooltipText.destroy();
      container.destroy(true);
    }
  };
}
