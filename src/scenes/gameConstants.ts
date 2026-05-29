import { basicEnemy, shooterEnemy, tankEnemy } from '../data/enemies';
import type { BlackHoleWhirlpoolTuning } from '../systems/blackHole';
import type { DebugImpactSourceType } from '../systems/debug/debugSharedTypes';
import type { AsteroidTier, AsteroidTierConfig, EnemySpawnType } from './gameTypes';

export const STAR_COLORS = [0x52627f, 0x6f89b7, 0xa8c7ff, 0x42f5d7];
export const BASIC_ENEMY_TEXTURE_KEY = 'basic-enemy-spaceship-1';
export const SHOOTER_ENEMY_TEXTURE_KEY = 'shooter-enemy-spaceship';
export const TANK_ENEMY_TEXTURE_KEY = 'tank-enemy-spaceship';
export const ENEMY_WRECKAGE_DEBRIS_TEXTURE_KEY = 'enemy-wreckage-debris';
export const SCRAP_PICKUP_TEXTURE_KEY = 'scrap-pickup';
export const SCRAP_PICKUP_TIER_1_TEXTURE_KEY = 'scrap-pickup-tier-1';
export const SCRAP_PICKUP_TIER_2_TEXTURE_KEY = 'scrap-pickup-tier-2';
export const SCRAP_PICKUP_TIER_3_TEXTURE_KEY = 'scrap-pickup-tier-3';
export const SCRAP_PICKUP_TIER_4_TEXTURE_KEY = 'scrap-pickup-tier-4';
export const UPGRADE_CRATE_PICKUP_TEXTURE_KEY = 'upgrade-crate-pickup';
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
export const CAMERA_LEAD_MAX_DISTANCE = 48;
export const CAMERA_LEAD_MIN_SPEED = 140;
export const CAMERA_LEAD_LERP = 0.035;
export const PLAYER_PROJECTILE_MUZZLE_OFFSET = 36;
export const PLAYER_PROJECTILE_TRAIL_OFFSET = 11;
export const PLAYER_PROJECTILE_TRAIL_FADE_MS = 220;
export const PLAYER_PROJECTILE_TRAIL_INTERVAL_MS = 28;
export const PLAYER_SHIP_DISPLAY_SIZE = 118;
export const PLAYER_SHIP_VISUAL_ROTATION = Math.PI;
export const THRUSTER_FADE_MS = 170;
export const FORWARD_THRUSTER_INTERVAL_MS = 26;
export const SECONDARY_THRUSTER_INTERVAL_MS = 42;
export const RUN_FUEL_MAX = 58;
export const RUN_FUEL_MAX_STAT = 255;
export const RUN_FUEL_FULL_THRUST_SECONDS_AT_CAP = 35 * 60;
export const RUN_FUEL_MAIN_THRUST_DRAIN_PER_SECOND = RUN_FUEL_MAX_STAT / RUN_FUEL_FULL_THRUST_SECONDS_AT_CAP;
export const RUN_FUEL_SUPPORT_THRUST_DRAIN_PER_SECOND = RUN_FUEL_MAIN_THRUST_DRAIN_PER_SECOND * 0.5;
export const RUN_FUEL_EMERGENCY_THRUST_MULTIPLIER = 0.1;

export const BASIC_ENEMY_COUNT = 0;
export const BASIC_ENEMY_DISPLAY_SIZE = 86;
export const BASIC_ENEMY_VISUAL_ROTATION = Math.PI;
export const SHOOTER_ENEMY_COUNT = 0;
export const SHOOTER_ENEMY_DISPLAY_SIZE = 92;
export const SHOOTER_ENEMY_VISUAL_ROTATION = Math.PI;
export const SHOOTER_PROJECTILE_HIT_RADIUS = 9;
export const TANK_ENEMY_COUNT = 0;
export const TANK_ENEMY_DISPLAY_SIZE = 126;
export const TANK_ENEMY_VISUAL_ROTATION = Math.PI;
export const ENEMY_SPAWN_INITIAL_DELAY_MS = 10000;
export const ENEMY_SPAWN_INTERVAL_MS = 10000;
export const ENEMY_SPAWN_MIN_INTERVAL_MS = 1800;
export const ENEMY_SPAWN_ESCALATION_INTERVAL_MS = 60000;
export const ENEMY_SPAWN_SAFE_DISTANCE = 620;
export const ENEMY_SPAWN_MAX_ACTIVE_INITIAL = 500;
export const ENEMY_SPAWN_MAX_ACTIVE_PER_STEP = 0;
export const ENEMY_SPAWN_MAX_ACTIVE_HARD_CAP = 500;
export const ENEMY_SPAWN_DOUBLE_SPAWN_STEP = 5;
export const ENEMY_SCALING_TARGET_RUN_MINUTES = 15;
export const ENEMY_SCALING_TARGET_HP_MULTIPLIER = 50;
export const ENEMY_SCALING_TARGET_DAMAGE_MULTIPLIER = 35;
export const ENEMY_SWARM_FIRST_SPAWN_MS = 60000;
export const ENEMY_SWARM_INTERVAL_MS = 60000;
export const ENEMY_SWARM_BASE_PACK_SIZE = 3;
export const ENEMY_SWARM_PACK_SIZE_PER_MINUTE = 0.6;
export const ENEMY_SWARM_MAX_PACK_SIZE = 12;
export const ENEMY_SWARM_OVERFLOW_HARD_CAP = 42;
export const ENEMY_SPAWN_WEIGHTS_BY_STEP: Array<Record<EnemySpawnType, number>> = [
  { chaser: 100, shooter: 0, tank: 0 },
  { chaser: 96, shooter: 4, tank: 0 },
  { chaser: 92, shooter: 8, tank: 0 },
  { chaser: 86, shooter: 14, tank: 0 },
  { chaser: 78, shooter: 20, tank: 2 },
  { chaser: 70, shooter: 25, tank: 5 },
  { chaser: 64, shooter: 30, tank: 6 },
  { chaser: 58, shooter: 34, tank: 8 },
  { chaser: 54, shooter: 36, tank: 10 },
  { chaser: 50, shooter: 38, tank: 12 },
  { chaser: 46, shooter: 40, tank: 14 },
  { chaser: 42, shooter: 42, tank: 16 },
  { chaser: 38, shooter: 44, tank: 18 },
  { chaser: 34, shooter: 46, tank: 20 },
  { chaser: 30, shooter: 48, tank: 22 },
  { chaser: 26, shooter: 50, tank: 24 }
];

export const BASIC_ASTEROID_COUNT = 9;
export const ASTEROID_MIN_ROTATION_SPEED = 0.08;
export const ASTEROID_MAX_ROTATION_SPEED = 0.26;
export const ASTEROID_SAFE_SPAWN_RADIUS = 520;
export const ASTEROID_COLLISION_COOLDOWN_MS = 260;
export const ASTEROID_COLLISION_MIN_IMPULSE = 18;
export const ASTEROID_COLLISION_MAX_IMPULSE = 210;
export const ASTEROID_COLLISION_IMPULSE_SPEED_SCALE = 0.26;
export const ASTEROID_COLLISION_RESTITUTION = 0.58;
export const ASTEROID_COLLISION_SEPARATION_PERCENT = 0.48;
export const ASTEROID_COLLISION_MAX_SEPARATION = 22;
export const ASTEROID_FRAGMENT_COLLISION_GRACE_MS = 700;
export const ASTEROID_COLLISION_WEIGHT_EXPONENT = 2;
export const ASTEROID_PARENT_VELOCITY_INHERITANCE = 0.76;
export const ASTEROID_FRAGMENT_BURST_MIN_SPEED = 18;
export const ASTEROID_FRAGMENT_BURST_MAX_SPEED = 88;
export const ASTEROID_CONTACT_DAMAGE_BY_TIER: Record<AsteroidTier, number> = {
  1: 4,
  2: 6,
  3: 8,
  4: 11,
  5: 14,
  6: 18,
  7: 23,
  8: 28,
  9: 34,
  10: 41
};
export const ASTEROID_COLLISION_DAMAGE_BY_TIER: Record<AsteroidTier, { min: number; max: number }> = {
  1: { min: 1, max: 2 },
  2: { min: 2, max: 3 },
  3: { min: 3, max: 5 },
  4: { min: 4, max: 7 },
  5: { min: 6, max: 10 },
  6: { min: 8, max: 14 },
  7: { min: 11, max: 19 },
  8: { min: 16, max: 27 },
  9: { min: 23, max: 40 },
  10: { min: 33, max: 57 }
};
export const ASTEROID_XP_REWARD_BY_TIER: Record<AsteroidTier, number> = {
  1: 4,
  2: 8,
  3: 14,
  4: 24,
  5: 40,
  6: 64,
  7: 96,
  8: 138,
  9: 188,
  10: 250
};
export const ASTEROID_TIERS: AsteroidTier[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const INITIAL_ASTEROID_TIERS: AsteroidTier[] = [5, 5, 4, 4, 4, 3, 3, 2, 2, 1];

export const DAMAGE_FLASH_MS = 90;
export const ENEMY_IMPACT_EXPLOSION_MS = 150;
export const ASTEROID_IMPACT_EXPLOSION_MS = 180;
export const ASTEROID_BREAKUP_FEEDBACK_MS = 360;
export const ASTEROID_BREAKUP_GHOST_MS = 280;
export const ASTEROID_FRAGMENT_GROW_IN_MS = 240;
export const ASTEROID_LARGE_BREAKUP_VISUAL_MIN_TIER: AsteroidTier = 5;
export const PLAYER_PROJECTILE_HIT_RADIUS = 8;
export const PLAYER_MAX_HULL = 40;
export const PLAYER_HIT_RADIUS = 32;
export const PLAYER_DAMAGE_INVULNERABILITY_MS = 1000;
export const PLAYER_DAMAGE_FLASH_MS = 130;
export const ENEMY_CONTACT_DAMAGE = basicEnemy.stats.contactDamage;
export const BASIC_ENEMY_XP_REWARD = basicEnemy.stats.xpValue;
export const INITIAL_XP_THRESHOLD = 100;
export const XP_THRESHOLD_GROWTH = 1.2;
export const GAMEPLAY_MAX_VELOCITY = 1000;
export const PLAYER_CONTACT_IMPULSE_COOLDOWN_MS = 140;
export const PLAYER_CONTACT_MIN_IMPULSE = 120;
export const PLAYER_CONTACT_MAX_IMPULSE = 460;
export const PLAYER_CONTACT_RELATIVE_SPEED_SCALE = 0.42;
export const PLAYER_CONTACT_SEPARATION_PERCENT = 0.42;
export const PLAYER_CONTACT_MAX_SEPARATION = 18;
export const PLAYER_ENEMY_CONTACT_IMPULSE_COOLDOWN_MS = 220;
export const PLAYER_ENEMY_CONTACT_MIN_IMPULSE = 48;
export const PLAYER_ENEMY_CONTACT_MAX_IMPULSE = 280;
export const PLAYER_ENEMY_CONTACT_RELATIVE_SPEED_SCALE = 0.22;
export const PLAYER_ENEMY_CONTACT_SEPARATION_PERCENT = 1.05;
export const PLAYER_ENEMY_CONTACT_MAX_SEPARATION = 46;
export const CONTACT_IMPACT_MIN_DAMAGE_SPEED = 90;
export const CONTACT_IMPACT_SPEED_DAMAGE_SCALE = 0.018;
export const CONTACT_IMPACT_MAX_DAMAGE_MULTIPLIER = 1.35;
export const IMPACT_MIN_DAMAGE_SPEED_BY_SOURCE: Record<DebugImpactSourceType, number> = {
  player: 90,
  enemy: 90,
  asteroid: 75,
  debris: 85
};
export const ENEMY_VELOCITY_RESPONSE = 3.6;
export const ENEMY_CONTACT_RESTITUTION_SHARE = 0.65;
export const ENEMY_CONTACT_RECOIL_MS = 340;
export const ENEMY_KNOCKBACK_DAMPING = 0.88;
export const RAMMING_SHIELD_TEXTURE_CROP = { x: 208, y: 250, width: 295, height: 73 };
export const RAMMING_SHIELD_COLLIDER_DEPTH = 84;

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

export const DEBUG_BLACK_HOLE_RADIUS_SCALE_DEFAULT = 1;
export const DEBUG_BLACK_HOLE_RADIUS_SCALE_MIN = 0;
export const DEBUG_BLACK_HOLE_RADIUS_SCALE_MAX = 20;
export const BLACK_HOLE_TIDAL_DAMAGE_INTERVAL_MS = 650;
export const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_INTERVAL_MS = 900;
export const BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_BASE = 1;
export const BLACK_HOLE_ASTEROID_TIDAL_DAMAGE_EXTRA = 3;
export const BLACK_HOLE_ENEMY_TIDAL_DAMAGE_BASE = 1;
export const BLACK_HOLE_ENEMY_TIDAL_DAMAGE_EXTRA = 2;
export const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_BASE = 1;
export const BLACK_HOLE_PLAYER_TIDAL_DAMAGE_EXTRA = 4;
export const BLACK_HOLE_ENEMY_FIELD_DAMPING = 0.988;
export const BLACK_HOLE_ZONE_CENTER_EXCLUSION_RATIO = 0.16;
export const BLACK_HOLE_ASTEROID_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 110,
  radialExtraAcceleration: 1160,
  swirlBaseAcceleration: 95,
  swirlExtraAcceleration: 1020,
  maxSpeed: 620
};
export const BLACK_HOLE_CHASER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 125,
  radialExtraAcceleration: 1220,
  swirlBaseAcceleration: 105,
  swirlExtraAcceleration: 1080,
  maxSpeed: basicEnemy.stats.blackHoleMaxSpeed
};
export const BLACK_HOLE_SHOOTER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 115,
  radialExtraAcceleration: 1040,
  swirlBaseAcceleration: 95,
  swirlExtraAcceleration: 920,
  maxSpeed: shooterEnemy.stats.blackHoleMaxSpeed
};
export const BLACK_HOLE_TANK_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 95,
  radialExtraAcceleration: 880,
  swirlBaseAcceleration: 76,
  swirlExtraAcceleration: 720,
  maxSpeed: tankEnemy.stats.blackHoleMaxSpeed
};
export const BLACK_HOLE_PLAYER_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 72,
  radialExtraAcceleration: 720,
  swirlBaseAcceleration: 64,
  swirlExtraAcceleration: 650,
  maxSpeed: 640
};
export const BLACK_HOLE_DEBRIS_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 130,
  radialExtraAcceleration: 1240,
  swirlBaseAcceleration: 112,
  swirlExtraAcceleration: 1120,
  maxSpeed: 620
};
export const BLACK_HOLE_SCRAP_WHIRLPOOL_TUNING: BlackHoleWhirlpoolTuning = {
  radialBaseAcceleration: 150,
  radialExtraAcceleration: 1380,
  swirlBaseAcceleration: 132,
  swirlExtraAcceleration: 1280,
  maxSpeed: 680
};

export const ENEMY_WRECKAGE_DEBRIS_DISPLAY_SIZE = 34;
export const ENEMY_WRECKAGE_DEBRIS_HIT_RADIUS = 15;
export const ENEMY_WRECKAGE_DEBRIS_LIFETIME_MS = 45000;
export const ENEMY_WRECKAGE_DEBRIS_MAX_ACTIVE = 90;
export const ENEMY_WRECKAGE_DEBRIS_HP = 6;
export const ENEMY_WRECKAGE_DEBRIS_CONTACT_DAMAGE = 5;
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
export const SCRAP_PICKUP_DISPLAY_SIZE = 24;
export const SCRAP_PICKUP_RADIUS = 18;
export const SCRAP_PICKUP_COLLECT_RADIUS = 46;
export const SCRAP_PICKUP_LIFETIME_MS = 60000;
export const SCRAP_PICKUP_MAX_ACTIVE = 160;
export const SCRAP_PICKUP_MIN_SPEED = 24;
export const SCRAP_PICKUP_MAX_SPEED = 100;
export const SCRAP_PICKUP_INHERITED_VELOCITY = 0.25;
export const SCRAP_PICKUP_DEBUG_VALUE = 10;
export const SCRAP_XP_VALUE_MULTIPLIER = 3;
export const SCRAP_TO_CREDIT_RATE = 1;
export const SCRAP_PICKUP_VALUE_BY_ASTEROID_TIER: Record<AsteroidTier, number> = {
  1: 1,
  2: 3,
  3: 6,
  4: 10,
  5: 16,
  6: 25,
  7: 38,
  8: 55,
  9: 76,
  10: 100
};
export const SCRAP_PICKUP_VALUE_FROM_DEBRIS = 2;

export const ASTEROID_TIER_CONFIG: Record<AsteroidTier, AsteroidTierConfig> = {
  1: {
    displaySize: 52,
    hitRadius: 18,
    hp: 8,
    minSpeed: 92,
    maxSpeed: 160,
    impactImpulse: 12,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  2: {
    displaySize: 76,
    hitRadius: 26,
    hp: 14,
    minSpeed: 76,
    maxSpeed: 138,
    impactImpulse: 10,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  3: {
    displaySize: 108,
    hitRadius: 37,
    hp: 22,
    minSpeed: 54,
    maxSpeed: 112,
    impactImpulse: 8,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  4: {
    displaySize: 154,
    hitRadius: 52,
    hp: 34,
    minSpeed: 34,
    maxSpeed: 78,
    impactImpulse: 6,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  5: {
    displaySize: 196,
    hitRadius: 66,
    hp: 50,
    minSpeed: 22,
    maxSpeed: 56,
    impactImpulse: 5,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  6: {
    displaySize: 268,
    hitRadius: 90,
    hp: 75,
    minSpeed: 18,
    maxSpeed: 48,
    impactImpulse: 4,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  7: {
    displaySize: 336,
    hitRadius: 114,
    hp: 110,
    minSpeed: 15,
    maxSpeed: 42,
    impactImpulse: 3,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  8: {
    displaySize: 420,
    hitRadius: 142,
    hp: 160,
    minSpeed: 12,
    maxSpeed: 36,
    impactImpulse: 2,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  9: {
    displaySize: 560,
    hitRadius: 188,
    hp: 230,
    minSpeed: 10,
    maxSpeed: 30,
    impactImpulse: 1,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  },
  10: {
    displaySize: 992,
    hitRadius: 332,
    hp: 330,
    minSpeed: 8,
    maxSpeed: 24,
    impactImpulse: 0,
    maxVelocity: GAMEPLAY_MAX_VELOCITY
  }
};
