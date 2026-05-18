import { basicEnemy, shooterEnemy, tankEnemy } from '../data/enemies';
import {
  BLACK_HOLE_FULL_TEXTURE_KEY,
  type BlackHolePngTextureKey,
  type BlackHoleWhirlpoolTuning
} from '../systems/blackHole';
import type { DebugImpactSourceType } from '../systems/debug/debugState';
import type { AsteroidTier, AsteroidTierConfig, EnemySpawnType } from './gameTypes';

export const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];
export const BASIC_ENEMY_TEXTURE_KEY = 'basic-enemy-spaceship-1';
export const SHOOTER_ENEMY_TEXTURE_KEY = 'shooter-enemy-spaceship';
export const TANK_ENEMY_TEXTURE_KEY = 'tank-enemy-spaceship';
export const ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY = 'enemy-wreckage-debris';
export const SCRAP_PICKUP_TEXTURE_KEY = 'scrap-pickup';
export const PLAYER_SHIP_TEXTURE_KEY = 'player-ship-spaceship-1';
export const RAMMING_SHIELD_TEXTURE_KEY = 'ramming-shield';

export const STARFIELD_FAR_TEXTURE_KEY = 'starvivors-starfield-far-tile';
export const STARFIELD_MID_TEXTURE_KEY = 'starvivors-starfield-mid-tile';
export const STARFIELD_NEAR_TEXTURE_KEY = 'starvivors-starfield-near-tile';
export const BACKGROUND_TILE_SIZE = 1024;
export const DEFAULT_STARFIELD_FAR_PARALLAX = 0.25;
export const DEFAULT_STARFIELD_MID_PARALLAX = 0.52;
export const DEFAULT_STARFIELD_NEAR_PARALLAX = 0.82;
export const STARFIELD_PARALLAX_STEP = 0.05;
export const STARFIELD_PARALLAX_MIN = 0;
export const STARFIELD_PARALLAX_MAX = 2;

export const DEBUG_UPDATE_INTERVAL_MS = 150;
export const PLAYER_PROJECTILE_MUZZLE_OFFSET = 36;
export const PLAYER_PROJECTILE_TRAIL_OFFSET = 11;
export const PLAYER_PROJECTILE_TRAIL_FADE_MS = 220;
export const PLAYER_PROJECTILE_TRAIL_INTERVAL_MS = 28;
export const PLAYER_SHIP_DISPLAY_SIZE = 118;
export const PLAYER_SHIP_VISUAL_ROTATION = Math.PI;
export const THRUSTER_FADE_MS = 170;
export const FORWARD_THRUSTER_INTERVAL_MS = 26;
export const SECONDARY_THRUSTER_INTERVAL_MS = 42;

export const BASIC_ENEMY_COUNT = 2;
export const BASIC_ENEMY_DISPLAY_SIZE = 86;
export const BASIC_ENEMY_VISUAL_ROTATION = Math.PI;
export const SHOOTER_ENEMY_COUNT = 0;
export const SHOOTER_ENEMY_DISPLAY_SIZE = 92;
export const SHOOTER_ENEMY_VISUAL_ROTATION = Math.PI;
export const SHOOTER_PROJECTILE_HIT_RADIUS = 9;
export const TANK_ENEMY_COUNT = 0;
export const TANK_ENEMY_DISPLAY_SIZE = 126;
export const TANK_ENEMY_VISUAL_ROTATION = Math.PI;
export const ENEMY_SPAWN_INITIAL_DELAY_MS = 2500;
export const ENEMY_SPAWN_INTERVAL_MS = 5200;
export const ENEMY_SPAWN_MIN_INTERVAL_MS = 1800;
export const ENEMY_SPAWN_ESCALATION_INTERVAL_MS = 30000;
export const ENEMY_SPAWN_SAFE_DISTANCE = 620;
export const ENEMY_SPAWN_MAX_ACTIVE_INITIAL = 4;
export const ENEMY_SPAWN_MAX_ACTIVE_PER_STEP = 2;
export const ENEMY_SPAWN_MAX_ACTIVE_HARD_CAP = 18;
export const ENEMY_SPAWN_DOUBLE_SPAWN_STEP = 5;
export const ENEMY_SPAWN_WEIGHTS_BY_STEP: Array<Record<EnemySpawnType, number>> = [
  { chaser: 100, shooter: 0, tank: 0 },
  { chaser: 92, shooter: 8, tank: 0 },
  { chaser: 78, shooter: 22, tank: 0 },
  { chaser: 66, shooter: 28, tank: 6 },
  { chaser: 58, shooter: 34, tank: 8 },
  { chaser: 52, shooter: 38, tank: 10 }
];

export const BASIC_ASTEROID_COUNT = 9;
export const ASTEROID_MIN_ROTATION_SPEED = 0.08;
export const ASTEROID_MAX_ROTATION_SPEED = 0.26;
export const ASTEROID_SAFE_SPAWN_RADIUS = 520;
export const ASTEROID_COLLISION_COOLDOWN_MS = 260;
export const ASTEROID_COLLISION_MIN_DAMAGE_SPEED = 55;
export const ASTEROID_COLLISION_SPEED_DAMAGE_SCALE = 0.011;
export const ASTEROID_COLLISION_MASS_DAMAGE_SCALE = 0.035;
export const ASTEROID_COLLISION_MAX_DAMAGE = 3.5;
export const ASTEROID_COLLISION_MIN_IMPULSE = 18;
export const ASTEROID_COLLISION_MAX_IMPULSE = 210;
export const ASTEROID_COLLISION_IMPULSE_SPEED_SCALE = 0.26;
export const ASTEROID_COLLISION_RESTITUTION = 0.58;
export const ASTEROID_COLLISION_SEPARATION_PERCENT = 0.48;
export const ASTEROID_COLLISION_MAX_SEPARATION = 22;
export const ASTEROID_PARENT_VELOCITY_INHERITANCE = 0.62;
export const ASTEROID_FRAGMENT_BURST_MIN_SPEED = 36;
export const ASTEROID_FRAGMENT_BURST_MAX_SPEED = 128;
export const ASTEROID_CONTACT_DAMAGE_BY_TIER: Record<AsteroidTier, number> = {
  1: 8,
  2: 12,
  3: 16,
  4: 22,
  5: 28
};
export const ASTEROID_XP_REWARD_BY_TIER: Record<AsteroidTier, number> = {
  1: 4,
  2: 8,
  3: 14,
  4: 24,
  5: 40
};
export const ASTEROID_TIERS: AsteroidTier[] = [1, 2, 3, 4, 5];
export const INITIAL_ASTEROID_TIERS: AsteroidTier[] = [5, 5, 4, 4, 4, 3, 3, 2, 2, 1];

export const DAMAGE_FLASH_MS = 90;
export const ENEMY_IMPACT_EXPLOSION_MS = 150;
export const ASTEROID_IMPACT_EXPLOSION_MS = 180;
export const ASTEROID_BREAKUP_FEEDBACK_MS = 360;
export const PLAYER_PROJECTILE_HIT_RADIUS = 8;
export const PLAYER_MAX_HULL = 100;
export const PLAYER_HIT_RADIUS = 32;
export const PLAYER_DAMAGE_INVULNERABILITY_MS = 1000;
export const PLAYER_DAMAGE_FLASH_MS = 130;
export const ENEMY_CONTACT_DAMAGE = basicEnemy.stats.contactDamage;
export const BASIC_ENEMY_XP_REWARD = basicEnemy.stats.xpValue;
export const INITIAL_XP_THRESHOLD = 100;
export const XP_THRESHOLD_GROWTH = 1.2;
export const GAMEPLAY_MAX_VELOCITY = 1000;
export const PLAYER_MASS = 3;
export const PLAYER_CONTACT_IMPULSE_COOLDOWN_MS = 140;
export const PLAYER_CONTACT_MIN_IMPULSE = 120;
export const PLAYER_CONTACT_MAX_IMPULSE = 460;
export const PLAYER_CONTACT_RELATIVE_SPEED_SCALE = 0.42;
export const PLAYER_CONTACT_SEPARATION_PERCENT = 0.42;
export const PLAYER_CONTACT_MAX_SEPARATION = 18;
export const CONTACT_IMPACT_MIN_DAMAGE_SPEED = 90;
export const CONTACT_IMPACT_SPEED_DAMAGE_SCALE = 0.018;
export const CONTACT_IMPACT_MASS_DAMAGE_SCALE = 0.08;
export const CONTACT_IMPACT_MAX_DAMAGE_MULTIPLIER = 1.35;
export const RAMMING_SHIELD_IMPACT_MASS_DAMAGE_SCALE = 0.08;
export const IMPACT_MASS_DAMAGE_SCALE_BY_SOURCE: Record<DebugImpactSourceType, number> = {
  player: 0.08,
  enemy: 0.08,
  asteroid: 0.2,
  debris: 0.1
};
export const IMPACT_MIN_DAMAGE_SPEED_BY_SOURCE: Record<DebugImpactSourceType, number> = {
  player: 90,
  enemy: 90,
  asteroid: 75,
  debris: 85
};
export const ENEMY_VELOCITY_RESPONSE = 3.6;
export const ENEMY_CONTACT_RESTITUTION_SHARE = 0.65;
export const ENEMY_KNOCKBACK_DAMPING = 0.88;
export const RAMMING_SHIELD_TEXTURE_CROP = { x: 208, y: 250, width: 295, height: 73 };
export const RAMMING_SHIELD_COLLIDER_DEPTH = 84;
export const RAMMING_SHIELD_DASH_BURST_DISTANCE = 96;
export const RAMMING_SHIELD_DASH_BURST_DURATION_SECONDS = 0.12;

export const DEBUG_ELLIPSE_SEGMENTS = 28;
export const DEBUG_GRID_MINOR_SPACING = 240;
export const DEBUG_GRID_MAJOR_SPACING = 480;
export const HUD_BAR_WIDTH = 360;
export const HUD_BAR_HEIGHT = 12;
export const HUD_MARGIN = 16;
export const HUD_RIGHT_BAR_Y = 174;
export const MINIMAP_WIDTH = 220;
export const MINIMAP_HEIGHT = 140;
export const MINIMAP_MARGIN = 16;
export const MINIMAP_PADDING = 8;

export const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_DEFAULT = 1;
export const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MIN = 0;
export const DEBUG_BLACK_HOLE_LENS_ORBIT_SPEED_MAX = 4;
export const DEBUG_BLACK_HOLE_LENS_DENSITY_MIN = 0;
export const DEBUG_BLACK_HOLE_LENS_LENGTH_DEFAULT = 1;
export const DEBUG_BLACK_HOLE_LENS_LENGTH_MIN = 0.5;
export const DEBUG_BLACK_HOLE_LENS_LENGTH_MAX = 2;
export const DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT = 1;
export const DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN = 0;
export const DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX = 20;
export const DEBUG_BLACK_HOLE_SELECTED_PNG_LAYER_DEFAULT = 32;
export const DEBUG_BLACK_HOLE_ADD_PNG_TEXTURE_DEFAULT: BlackHolePngTextureKey = BLACK_HOLE_FULL_TEXTURE_KEY;
export const DEBUG_BLACK_HOLE_LENS_SLIDER_WIDTH = 220;
export const DEBUG_BLACK_HOLE_LENS_SLIDER_HEIGHT = 54;
export const DEBUG_BLACK_HOLE_LENS_SLIDER_TRACK_WIDTH = 176;
export const DEBUG_BLACK_HOLE_LENS_SLIDER_GAP = 62;
export const BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS = 650;
export const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_INTERVAL_MS = 900;
export const BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_BASE = 0.8;
export const BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_EXTRA = 2.2;
export const BLACK_HOLE_ENEMY_TIDAL_DAMAGE_BASE = 0.75;
export const BLACK_HOLE_ENEMY_TIDAL_DAMAGE_EXTRA = 1.7;
export const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_BASE = 0.5;
export const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_EXTRA = 5;
export const BLACK_HOLE_ENEMY_FIELD_DAMPING = 0.988;
export const BLACK_HOLE_PLAYER_FIELD_MASS = 4.8;
export const BLACK_HOLE_ZONE_CENTER_EXCLUSION_RATIO = 0.16;
export const BLACK_HOLE_ASTEROID_FIELD_MASS_BY_TIER: Record<number, number> = {
  1: 1,
  2: 2.6,
  3: 4.8,
  4: 8.4,
  5: 13
};
export const BLACK_HOLE_ASTEROID_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 110,
  radialExtraAcceleration: 1160,
  swirlBaseAcceleration: 95,
  swirlExtraAcceleration: 1020,
  maxSpeed: 620,
  mass: 1,
  massResistance: 0.42
};
export const BLACK_HOLE_CHASER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 125,
  radialExtraAcceleration: 1220,
  swirlBaseAcceleration: 105,
  swirlExtraAcceleration: 1080,
  maxSpeed: basicEnemy.stats.blackHoleMaxSpeed,
  mass: basicEnemy.stats.mass,
  massResistance: basicEnemy.stats.blackHoleResistance
};
export const BLACK_HOLE_SHOOTER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 115,
  radialExtraAcceleration: 1040,
  swirlBaseAcceleration: 95,
  swirlExtraAcceleration: 920,
  maxSpeed: shooterEnemy.stats.blackHoleMaxSpeed,
  mass: shooterEnemy.stats.mass,
  massResistance: shooterEnemy.stats.blackHoleResistance
};
export const BLACK_HOLE_TANK_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 95,
  radialExtraAcceleration: 880,
  swirlBaseAcceleration: 76,
  swirlExtraAcceleration: 720,
  maxSpeed: tankEnemy.stats.blackHoleMaxSpeed,
  mass: tankEnemy.stats.mass,
  massResistance: tankEnemy.stats.blackHoleResistance
};
export const BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 72,
  radialExtraAcceleration: 720,
  swirlBaseAcceleration: 64,
  swirlExtraAcceleration: 650,
  maxSpeed: 640,
  mass: BLACK_HOLE_PLAYER_FIELD_MASS,
  massResistance: 0.42
};
export const BLACK_HOLE_DEBRIS_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 130,
  radialExtraAcceleration: 1240,
  swirlBaseAcceleration: 112,
  swirlExtraAcceleration: 1120,
  maxSpeed: 620,
  mass: 1,
  massResistance: 0.34
};
export const BLACK_HOLE_SCRAP_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 150,
  radialExtraAcceleration: 1380,
  swirlBaseAcceleration: 132,
  swirlExtraAcceleration: 1280,
  maxSpeed: 680,
  mass: 0.55,
  massResistance: 0.28
};

export const ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE = 34;
export const ENEMY_WRECKAGE_DEBRIS_HIT_RADIUS = 15;
export const ENEMY_WRECKAGE_DEBRIS_LIFETIME_MS = 45000;
export const ENEMY_WRECKAGE_DEBRIS_MAX_ACTIVE = 90;
export const ENEMY_WRECKAGE_DEBRIS_HP = 2;
export const ENEMY_WRECKAGE_DEBRIS_CONTACT_DAMAGE = 8;
export const ENEMY_WRECKAGE_DEBRIS_MIN_SPEED = 42;
export const ENEMY_WRECKAGE_DEBRIS_MAX_SPEED = 156;
export const ENEMY_WRECKAGE_DEBRIS_INHERITED_VELOCITY = 0.38;
export const ENEMY_WRECKAGE_DEBRIS_MIN_ROTATION_SPEED = 0.7;
export const ENEMY_WRECKAGE_DEBRIS_MAX_ROTATION_SPEED = 2.5;
export const ENEMY_WRECKAGE_DEBRIS_COUNT_BY_ENEMY: Record<EnemySpawnType, number> = {
  chaser: 2,
  shooter: 3,
  tank: 6
};
export const ENEMY_WRECKAGE_DEBRIS_MASS_BY_ENEMY: Record<EnemySpawnType, number> = {
  chaser: 0.75,
  shooter: 1.05,
  tank: 1.75
};
export const SCRAP_PICKUP_DISPLAY_SIZE = 24;
export const SCRAP_PICKUP_RADIUS = 18;
export const SCRAP_PICKUP_COLLECT_RADIUS = 46;
export const SCRAP_PICKUP_LIFETIME_MS = 60000;
export const SCRAP_PICKUP_MAX_ACTIVE = 160;
export const SCRAP_PICKUP_MASS = 0.55;
export const SCRAP_PICKUP_MIN_SPEED = 24;
export const SCRAP_PICKUP_MAX_SPEED = 100;
export const SCRAP_PICKUP_INHERITED_VELOCITY = 0.25;
export const SCRAP_PICKUP_DEBUG_VALUE = 10;
export const SCRAP_TO_CREDIT_RATE = 1;
export const SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER: Record<AsteroidTier, number> = {
  1: 1,
  2: 3,
  3: 6,
  4: 10,
  5: 16
};
export const SCRAP_PICKUP_VALUE_FROM_DEBRIS = 2;

export const ASTEROID_TIER_CONFIG: Record<AsteroidTier, AsteroidTierConfig> = {
  1: {
    displaySize: 52,
    hitRadius: 20,
    hp: 2,
    massBudget: 1,
    minSpeed: 92,
    maxSpeed: 160,
    impactImpulse: 94,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  2: {
    displaySize: 76,
    hitRadius: 30,
    hp: 4,
    massBudget: 4,
    minSpeed: 76,
    maxSpeed: 138,
    impactImpulse: 78,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  3: {
    displaySize: 108,
    hitRadius: 42,
    hp: 6,
    massBudget: 8,
    minSpeed: 54,
    maxSpeed: 112,
    impactImpulse: 58,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  4: {
    displaySize: 154,
    hitRadius: 58,
    hp: 9,
    massBudget: 16,
    minSpeed: 34,
    maxSpeed: 78,
    impactImpulse: 36,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  5: {
    displaySize: 196,
    hitRadius: 74,
    hp: 13,
    massBudget: 32,
    minSpeed: 22,
    maxSpeed: 56,
    impactImpulse: 24,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  }
};
