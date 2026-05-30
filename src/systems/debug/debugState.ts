import type { ShipId, ShipRegistryEntry } from '../../data/ships';
import type { BeamWeaponStats, RammingShieldStats, WeaponId, WeaponRegistryEntry } from '../../data/weapons';
import type { DebugMenuValues } from './debugTypes';
import type {
  DebugCollisionShapeScaleKey,
  DebugCollisionShapeScales,
  DebugImpactSourceType,
  DebugPhysicsTuningKey,
  DebugShipStatKey,
  DebugWeaponStatKey
} from './debugSharedTypes';
import { formatDisplayUnits, formatIntegerDisplayUnits } from '../statUnits';
import {
  DEATH_SHARD_STYLES,
  DEFAULT_DEATH_SHARD_TUNING,
  type DeathShardStyle,
  type DeathShardStyleTuning,
  type DeathShardTuningKey,
  type DeathShardTuningMap
} from '../deathEffects';

const DEBUG_WEAPON_DAMAGE_MULTIPLIER_MIN = 1;
const DEBUG_WEAPON_FIRE_RATE_MULTIPLIER_MIN = 0.1;
const DEBUG_WEAPON_COOLDOWN_MIN_SECONDS = 0.01;
const DEBUG_PHYSICS_SCALE_MIN = 0.05;
const DEBUG_PHYSICS_SCALE_MAX = 3;
const DEFAULT_PLAYER_THRUST_SCALE = 0.82;
const DEFAULT_PLAYER_BRAKE_SCALE = 0.88;
const DEFAULT_PLAYER_STRAFE_SCALE = 0.88;
const DEFAULT_PLAYER_INERTIA_SCALE = 0.72;
const DEFAULT_ENEMY_SPEED_SCALE = 1.08;
const DEFAULT_ENEMY_RESPONSE_SCALE = 1.18;
const DEFAULT_ASTEROID_COLLISION_DAMAGE_SCALE = 1;
const DEFAULT_ASTEROID_COLLISION_IMPULSE_SCALE = 1;
const DEFAULT_GLOBAL_MAX_SPEED = 500;
const DEFAULT_GLOBAL_IMPACT_DAMAGE_CAP = 600;
const DEBUG_GLOBAL_MAX_SPEED_MIN = 1;
const DEBUG_GLOBAL_MAX_SPEED_MAX = 10000;
const DEBUG_IMPACT_CAP_MIN = 0;
const DEBUG_IMPACT_CAP_MAX = 10000;
const DEBUG_IMPACT_SCALE_MIN = 0;
const DEBUG_IMPACT_SCALE_MAX = 10;
const DEFAULT_HEALTH_BAR_WIDTH_SCALE = 1;
const DEFAULT_HEALTH_BAR_HEIGHT = 5;
const DEFAULT_HEALTH_BAR_VERTICAL_OFFSET = 34;
const DEFAULT_HEALTH_BAR_ALPHA = 0.95;
const DEFAULT_DAMAGE_NUMBER_FONT_SIZE = 15;
const DEFAULT_DAMAGE_NUMBER_LIFETIME_MS = 760;
const DEFAULT_DAMAGE_NUMBER_RISE_DISTANCE = 34;
const DEFAULT_DAMAGE_NUMBER_DRIFT = 18;
const DEFAULT_DAMAGE_NUMBER_SCALE_POP = 1.22;
const DEFAULT_DAMAGE_NUMBER_FADE_START = 0.45;
const DEFAULT_DAMAGE_NUMBER_ALPHA = 1;
const DEFAULT_COLLISION_SHAPE_SCALES: DebugCollisionShapeScales = {
  global: 0.9,
  player: 0.75,
  enemy: 0.82,
  asteroid: 0.8,
  debris: 0.85
};
const DEBUG_COLLISION_SHAPE_SCALE_MIN = 0.35;
const DEBUG_COLLISION_SHAPE_SCALE_MAX = 1.25;
const DEFAULT_ASTEROID_FRAGMENT_SOFT_CAP = 500;
const DEFAULT_ASTEROID_FRAGMENT_HARD_CAP = 500;
const DEFAULT_ASTEROID_FRAGMENT_BURST_LIMIT = 250;
const DEFAULT_DEBUG_ASTEROID_SPAWN_COUNT = 1;
const DEBUG_ASTEROID_FRAGMENT_CAP_MIN = 0;
const DEBUG_ASTEROID_FRAGMENT_CAP_MAX = 1000;
const DEBUG_ASTEROID_SPAWN_COUNT_MIN = 1;
const DEBUG_ASTEROID_SPAWN_COUNT_MAX = 1000;

export type DebugShipOverrides = Partial<Record<DebugShipStatKey, number>>;
export type DebugWeaponOverrides = Partial<Record<DebugWeaponStatKey, number>>;
export type DebugPresetState = ReturnType<DebugState['createDebugPresetState']>;

const SHIP_STAT_MIN: Record<DebugShipStatKey, number> = {
  maxHull: 1,
  moveSpeed: 1,
  thrust: 0,
  brake: 0,
  strafe: 0,
  hitRadius: 1
};

const WEAPON_STAT_MIN: Record<DebugWeaponStatKey, number> = {
  damage: 0,
  cooldownSeconds: 0.01,
  projectileSpeed: 0,
  projectileLifetimeSeconds: 0.01,
  projectileRange: 1,
  shieldMaxHp: 1,
  shieldRegenDelaySeconds: 0,
  shieldRegenRatePerSecond: 0,
  dashMaxCharges: 0,
  dashChargeRechargeSeconds: 0.01,
  dashDistance: 1,
  dashDurationSeconds: 0.01,
  range: 1,
  width: 1,
  guardDamage: 0,
  bashDamage: 0,
  knockback: 0,
  contactCooldownMs: 1,
  tickDamage: 0,
  tickRatePerSecond: 0.1,
  heatMax: 1,
  heatGainPerSecond: 0,
  coolingPerSecond: 0,
  overheatCoolingPerSecond: 0
};

const INTEGER_WEAPON_STATS = new Set<DebugWeaponStatKey>(['dashMaxCharges', 'contactCooldownMs']);

export class DebugState {
  collisionDebugEnabled = false;
  enemySpawningEnabled = true;
  asteroidSpawningEnabled = false;
  playerInvulnerable = false;
  showBlackHoleRadii = false;
  blackHoleFieldDamageEnabled = true;
  debugGamePaused = false;
  weaponDamageMultiplier = 1;
  weaponFireRateMultiplier = 1;
  playerThrustScale = DEFAULT_PLAYER_THRUST_SCALE;
  playerBrakeScale = DEFAULT_PLAYER_BRAKE_SCALE;
  playerStrafeScale = DEFAULT_PLAYER_STRAFE_SCALE;
  playerInertiaScale = DEFAULT_PLAYER_INERTIA_SCALE;
  enemySpeedScale = DEFAULT_ENEMY_SPEED_SCALE;
  enemyResponseScale = DEFAULT_ENEMY_RESPONSE_SCALE;
  asteroidCollisionDamageScale = DEFAULT_ASTEROID_COLLISION_DAMAGE_SCALE;
  asteroidCollisionImpulseScale = DEFAULT_ASTEROID_COLLISION_IMPULSE_SCALE;
  globalMaxSpeed = DEFAULT_GLOBAL_MAX_SPEED;
  globalImpactDamageCap = DEFAULT_GLOBAL_IMPACT_DAMAGE_CAP;
  impactDamageCaps: Record<DebugImpactSourceType, number> = {
    player: 350,
    enemy: 220,
    asteroid: 500,
    debris: 160
  };
  impactDamageScales: Record<DebugImpactSourceType, number> = {
    player: 0.2,
    enemy: 0.16,
    asteroid: 0.45,
    debris: 0.22
  };
  healthBarsEnabled = true;
  playerHealthBarEnabled = true;
  healthBarRevealOnPlayerDamage = true;
  healthBarWidthScale = DEFAULT_HEALTH_BAR_WIDTH_SCALE;
  healthBarHeight = DEFAULT_HEALTH_BAR_HEIGHT;
  healthBarVerticalOffset = DEFAULT_HEALTH_BAR_VERTICAL_OFFSET;
  healthBarAlpha = DEFAULT_HEALTH_BAR_ALPHA;
  damageNumbersEnabled = true;
  damageNumberSourceColorsEnabled = true;
  damageNumberFontSize = DEFAULT_DAMAGE_NUMBER_FONT_SIZE;
  damageNumberLifetimeMs = DEFAULT_DAMAGE_NUMBER_LIFETIME_MS;
  damageNumberRiseDistance = DEFAULT_DAMAGE_NUMBER_RISE_DISTANCE;
  damageNumberDrift = DEFAULT_DAMAGE_NUMBER_DRIFT;
  damageNumberScalePop = DEFAULT_DAMAGE_NUMBER_SCALE_POP;
  damageNumberFadeStart = DEFAULT_DAMAGE_NUMBER_FADE_START;
  damageNumberAlpha = DEFAULT_DAMAGE_NUMBER_ALPHA;
  asteroidDamageFlashEnabled = true;
  collisionShapeScales: DebugCollisionShapeScales = { ...DEFAULT_COLLISION_SHAPE_SCALES };
  deathShardTuning: DeathShardTuningMap = structuredClone(DEFAULT_DEATH_SHARD_TUNING);
  asteroidFragmentSoftCap = DEFAULT_ASTEROID_FRAGMENT_SOFT_CAP;
  asteroidFragmentHardCap = DEFAULT_ASTEROID_FRAGMENT_HARD_CAP;
  asteroidFragmentBurstLimit = DEFAULT_ASTEROID_FRAGMENT_BURST_LIMIT;
  debugAsteroidSpawnCount = DEFAULT_DEBUG_ASTEROID_SPAWN_COUNT;
  readonly shipOverrides: Partial<Record<ShipId, DebugShipOverrides>> = {};
  readonly weaponOverrides: Partial<Record<WeaponId, DebugWeaponOverrides>> = {};

  resetForRun(): void {
    this.enemySpawningEnabled = true;
    this.asteroidSpawningEnabled = false;
    this.playerInvulnerable = false;
    this.showBlackHoleRadii = false;
    this.blackHoleFieldDamageEnabled = true;
    this.debugGamePaused = false;
    this.weaponDamageMultiplier = 1;
    this.weaponFireRateMultiplier = 1;
  }

  adjustWeaponDamageMultiplier(delta: number): void {
    this.weaponDamageMultiplier = Number(Math.max(DEBUG_WEAPON_DAMAGE_MULTIPLIER_MIN, this.weaponDamageMultiplier + delta).toFixed(1));
  }

  adjustWeaponFireRateMultiplier(delta: number): void {
    this.weaponFireRateMultiplier = Number(
      Math.max(DEBUG_WEAPON_FIRE_RATE_MULTIPLIER_MIN, this.weaponFireRateMultiplier + delta).toFixed(1)
    );
  }

  adjustWeaponCooldownSeconds(baseCooldownSeconds: number, currentCooldownSeconds: number, deltaSeconds: number): void {
    const nextCooldownSeconds = Math.max(DEBUG_WEAPON_COOLDOWN_MIN_SECONDS, currentCooldownSeconds + deltaSeconds);

    this.weaponFireRateMultiplier = Number(
      Math.max(DEBUG_WEAPON_FIRE_RATE_MULTIPLIER_MIN, baseCooldownSeconds / nextCooldownSeconds).toFixed(2)
    );
  }

  resetWeaponTuning(): void {
    this.weaponDamageMultiplier = 1;
    this.weaponFireRateMultiplier = 1;
  }

  adjustPlayerThrustScale(delta: number): void {
    this.playerThrustScale = this.clampScale(this.playerThrustScale + delta);
  }

  adjustPlayerBrakeScale(delta: number): void {
    this.playerBrakeScale = this.clampScale(this.playerBrakeScale + delta);
  }

  adjustPlayerStrafeScale(delta: number): void {
    this.playerStrafeScale = this.clampScale(this.playerStrafeScale + delta);
  }

  adjustPlayerInertiaScale(delta: number): void {
    this.playerInertiaScale = this.clampScale(this.playerInertiaScale + delta);
  }

  adjustEnemySpeedScale(delta: number): void {
    this.enemySpeedScale = this.clampScale(this.enemySpeedScale + delta);
  }

  adjustEnemyResponseScale(delta: number): void {
    this.enemyResponseScale = this.clampScale(this.enemyResponseScale + delta);
  }

  adjustAsteroidCollisionDamageScale(delta: number): void {
    this.asteroidCollisionDamageScale = this.clampScale(this.asteroidCollisionDamageScale + delta);
  }

  adjustAsteroidCollisionImpulseScale(delta: number): void {
    this.asteroidCollisionImpulseScale = this.clampScale(this.asteroidCollisionImpulseScale + delta);
  }

  adjustGlobalMaxSpeed(delta: number): void {
    this.globalMaxSpeed = this.clampGlobalMaxSpeed(this.globalMaxSpeed + delta);
  }

  setGlobalMaxSpeed(value: number): void {
    this.globalMaxSpeed = this.clampGlobalMaxSpeed(value);
  }

  adjustGlobalImpactDamageCap(delta: number): void {
    this.globalImpactDamageCap = this.clampImpactCap(this.globalImpactDamageCap + delta);
  }

  setGlobalImpactDamageCap(value: number): void {
    this.globalImpactDamageCap = this.clampImpactCap(value);
  }

  adjustImpactDamageCap(source: DebugImpactSourceType, delta: number): void {
    this.impactDamageCaps[source] = this.clampImpactCap(this.impactDamageCaps[source] + delta);
  }

  setImpactDamageCap(source: DebugImpactSourceType, value: number): void {
    this.impactDamageCaps[source] = this.clampImpactCap(value);
  }

  adjustImpactDamageScale(source: DebugImpactSourceType, delta: number): void {
    this.impactDamageScales[source] = this.clampImpactScale(this.impactDamageScales[source] + delta);
  }

  setImpactDamageScale(source: DebugImpactSourceType, value: number): void {
    this.impactDamageScales[source] = this.clampImpactScale(value);
  }

  setPhysicsTuning(key: DebugPhysicsTuningKey, value: number): void {
    switch (key) {
      case 'globalMaxSpeed':
        this.setGlobalMaxSpeed(value);
        break;
      case 'globalImpactDamageCap':
        this.setGlobalImpactDamageCap(value);
        break;
      case 'playerImpactDamageCap':
      case 'enemyImpactDamageCap':
      case 'asteroidImpactDamageCap':
      case 'debrisImpactDamageCap':
        this.setImpactDamageCap(key.replace('ImpactDamageCap', '') as DebugImpactSourceType, value);
        break;
      case 'playerImpactDamageScale':
      case 'enemyImpactDamageScale':
      case 'asteroidImpactDamageScale':
      case 'debrisImpactDamageScale':
        this.setImpactDamageScale(key.replace('ImpactDamageScale', '') as DebugImpactSourceType, value);
        break;
      case 'playerThrustScale':
        this.playerThrustScale = this.clampScale(value);
        break;
      case 'playerBrakeScale':
        this.playerBrakeScale = this.clampScale(value);
        break;
      case 'playerStrafeScale':
        this.playerStrafeScale = this.clampScale(value);
        break;
      case 'playerInertiaScale':
        this.playerInertiaScale = this.clampScale(value);
        break;
      case 'enemySpeedScale':
        this.enemySpeedScale = this.clampScale(value);
        break;
      case 'enemyResponseScale':
        this.enemyResponseScale = this.clampScale(value);
        break;
      case 'asteroidCollisionDamageScale':
        this.asteroidCollisionDamageScale = this.clampScale(value);
        break;
      case 'asteroidCollisionImpulseScale':
        this.asteroidCollisionImpulseScale = this.clampScale(value);
        break;
    }
  }

  resetPhysicsTuning(): void {
    this.playerThrustScale = DEFAULT_PLAYER_THRUST_SCALE;
    this.playerBrakeScale = DEFAULT_PLAYER_BRAKE_SCALE;
    this.playerStrafeScale = DEFAULT_PLAYER_STRAFE_SCALE;
    this.playerInertiaScale = DEFAULT_PLAYER_INERTIA_SCALE;
    this.enemySpeedScale = DEFAULT_ENEMY_SPEED_SCALE;
    this.enemyResponseScale = DEFAULT_ENEMY_RESPONSE_SCALE;
    this.asteroidCollisionDamageScale = DEFAULT_ASTEROID_COLLISION_DAMAGE_SCALE;
    this.asteroidCollisionImpulseScale = DEFAULT_ASTEROID_COLLISION_IMPULSE_SCALE;
    this.globalMaxSpeed = DEFAULT_GLOBAL_MAX_SPEED;
    this.globalImpactDamageCap = DEFAULT_GLOBAL_IMPACT_DAMAGE_CAP;
    this.impactDamageCaps = {
      player: 350,
      enemy: 220,
      asteroid: 500,
      debris: 160
    };
    this.impactDamageScales = {
      player: 0.2,
      enemy: 0.16,
      asteroid: 0.45,
      debris: 0.22
    };
  }

  adjustHealthBarWidthScale(delta: number): void {
    this.healthBarWidthScale = Number(this.clampNumber(this.healthBarWidthScale + delta, 0.5, 2).toFixed(2));
  }

  adjustHealthBarHeight(delta: number): void {
    this.healthBarHeight = Math.round(this.clampNumber(this.healthBarHeight + delta, 2, 12));
  }

  adjustHealthBarVerticalOffset(delta: number): void {
    this.healthBarVerticalOffset = Math.round(this.clampNumber(this.healthBarVerticalOffset + delta, 12, 80));
  }

  adjustHealthBarAlpha(delta: number): void {
    this.healthBarAlpha = Number(this.clampNumber(this.healthBarAlpha + delta, 0.25, 1).toFixed(2));
  }

  adjustDamageNumberFontSize(delta: number): void {
    this.damageNumberFontSize = Math.round(this.clampNumber(this.damageNumberFontSize + delta, 8, 34));
  }

  adjustDamageNumberLifetimeMs(delta: number): void {
    this.damageNumberLifetimeMs = Math.round(this.clampNumber(this.damageNumberLifetimeMs + delta, 250, 2200));
  }

  adjustDamageNumberRiseDistance(delta: number): void {
    this.damageNumberRiseDistance = Math.round(this.clampNumber(this.damageNumberRiseDistance + delta, 8, 120));
  }

  adjustDamageNumberDrift(delta: number): void {
    this.damageNumberDrift = Math.round(this.clampNumber(this.damageNumberDrift + delta, 0, 80));
  }

  adjustDamageNumberScalePop(delta: number): void {
    this.damageNumberScalePop = Number(this.clampNumber(this.damageNumberScalePop + delta, 1, 2).toFixed(2));
  }

  adjustDamageNumberFadeStart(delta: number): void {
    this.damageNumberFadeStart = Number(this.clampNumber(this.damageNumberFadeStart + delta, 0, 0.9).toFixed(2));
  }

  adjustDamageNumberAlpha(delta: number): void {
    this.damageNumberAlpha = Number(this.clampNumber(this.damageNumberAlpha + delta, 0.25, 1).toFixed(2));
  }

  resetCombatFeedbackTuning(): void {
    this.healthBarsEnabled = true;
    this.playerHealthBarEnabled = true;
    this.healthBarRevealOnPlayerDamage = true;
    this.healthBarWidthScale = DEFAULT_HEALTH_BAR_WIDTH_SCALE;
    this.healthBarHeight = DEFAULT_HEALTH_BAR_HEIGHT;
    this.healthBarVerticalOffset = DEFAULT_HEALTH_BAR_VERTICAL_OFFSET;
    this.healthBarAlpha = DEFAULT_HEALTH_BAR_ALPHA;
    this.damageNumbersEnabled = true;
    this.damageNumberSourceColorsEnabled = true;
    this.damageNumberFontSize = DEFAULT_DAMAGE_NUMBER_FONT_SIZE;
    this.damageNumberLifetimeMs = DEFAULT_DAMAGE_NUMBER_LIFETIME_MS;
    this.damageNumberRiseDistance = DEFAULT_DAMAGE_NUMBER_RISE_DISTANCE;
    this.damageNumberDrift = DEFAULT_DAMAGE_NUMBER_DRIFT;
    this.damageNumberScalePop = DEFAULT_DAMAGE_NUMBER_SCALE_POP;
    this.damageNumberFadeStart = DEFAULT_DAMAGE_NUMBER_FADE_START;
    this.damageNumberAlpha = DEFAULT_DAMAGE_NUMBER_ALPHA;
    this.asteroidDamageFlashEnabled = true;
  }

  adjustCollisionShapeScale(key: DebugCollisionShapeScaleKey, delta: number): void {
    this.setCollisionShapeScale(key, this.collisionShapeScales[key] + delta);
  }

  setCollisionShapeScale(key: DebugCollisionShapeScaleKey, value: number): void {
    this.collisionShapeScales[key] = this.clampCollisionShapeScale(value);
  }

  getCollisionShapeScale(key: Exclude<DebugCollisionShapeScaleKey, 'global'>): number {
    return Number((this.collisionShapeScales.global * this.collisionShapeScales[key]).toFixed(4));
  }

  resetCollisionShapeTuning(): void {
    this.collisionShapeScales = { ...DEFAULT_COLLISION_SHAPE_SCALES };
  }

  adjustAsteroidFragmentSoftCap(delta: number): void {
    this.setAsteroidFragmentSoftCap(this.asteroidFragmentSoftCap + delta);
  }

  adjustAsteroidFragmentHardCap(delta: number): void {
    this.setAsteroidFragmentHardCap(this.asteroidFragmentHardCap + delta);
  }

  adjustAsteroidFragmentBurstLimit(delta: number): void {
    this.setAsteroidFragmentBurstLimit(this.asteroidFragmentBurstLimit + delta);
  }

  setAsteroidFragmentSoftCap(value: number): void {
    this.asteroidFragmentSoftCap = this.clampAsteroidFragmentCap(value);
  }

  setAsteroidFragmentHardCap(value: number): void {
    this.asteroidFragmentHardCap = this.clampAsteroidFragmentCap(value);
  }

  setAsteroidFragmentBurstLimit(value: number): void {
    this.asteroidFragmentBurstLimit = this.clampAsteroidFragmentCap(value);
  }

  adjustDebugAsteroidSpawnCount(delta: number): void {
    this.setDebugAsteroidSpawnCount(this.debugAsteroidSpawnCount + delta);
  }

  setDebugAsteroidSpawnCount(value: number): void {
    this.debugAsteroidSpawnCount = this.clampDebugAsteroidSpawnCount(value);
  }

  resetDebugAsteroidSpawnCount(): void {
    this.debugAsteroidSpawnCount = DEFAULT_DEBUG_ASTEROID_SPAWN_COUNT;
  }

  resetAsteroidFragmentTuning(): void {
    this.asteroidFragmentSoftCap = DEFAULT_ASTEROID_FRAGMENT_SOFT_CAP;
    this.asteroidFragmentHardCap = DEFAULT_ASTEROID_FRAGMENT_HARD_CAP;
    this.asteroidFragmentBurstLimit = DEFAULT_ASTEROID_FRAGMENT_BURST_LIMIT;
  }

  getCollisionShapeTuningSummary(): string {
    return `Global x${this.collisionShapeScales.global.toFixed(2)}\nPlayer x${this.collisionShapeScales.player.toFixed(2)}  Enemy x${this.collisionShapeScales.enemy.toFixed(2)}\nAsteroid x${this.collisionShapeScales.asteroid.toFixed(2)}  Debris x${this.collisionShapeScales.debris.toFixed(2)}`;
  }

  adjustDeathShardTuning(style: DeathShardStyle, key: DeathShardTuningKey, delta: number): void {
    this.setDeathShardTuning(style, key, this.deathShardTuning[style][key] + delta);
  }

  setDeathShardTuning(style: DeathShardStyle, key: DeathShardTuningKey, value: number): void {
    this.deathShardTuning[style] = {
      ...this.deathShardTuning[style],
      [key]: this.clampDeathShardTuning(key, value)
    };
  }

  resetDeathShardTuning(): void {
    this.deathShardTuning = structuredClone(DEFAULT_DEATH_SHARD_TUNING);
  }

  getDeathShardTuningSummary(style: DeathShardStyle): string {
    const tuning = this.deathShardTuning[style];

    return `${this.getDeathShardStyleLabel(style)}\nCount x${tuning.countScale.toFixed(2)}  Life x${tuning.lifetimeScale.toFixed(2)}  Size x${tuning.sizeScale.toFixed(2)}\nInherit x${tuning.inheritedVelocityScale.toFixed(2)}  Burst x${tuning.burstSpeedScale.toFixed(2)}\nAlpha x${tuning.alphaScale.toFixed(2)}  Dissolve ${(tuning.dissolveStart * 100).toFixed(0)}%`;
  }

  getDeathShardStyleLabel(style: DeathShardStyle): string {
    switch (style) {
      case 'player':
        return 'Player death';
      case 'asteroid':
        return 'Asteroid death';
      case 'blackHoleShip':
        return 'Black hole ship';
      case 'blackHoleAsteroid':
        return 'Black hole asteroid';
      default:
        return 'Enemy ship';
    }
  }

  adjustShipStat(ship: ShipRegistryEntry, key: DebugShipStatKey, delta: number): void {
    const overrides = this.shipOverrides[ship.id] ?? {};
    const current = overrides[key] ?? this.getBaseShipStat(ship, key);
    overrides[key] = this.clampShipStat(key, current + delta);
    this.shipOverrides[ship.id] = overrides;
  }

  setShipStat(ship: ShipRegistryEntry, key: DebugShipStatKey, value: number): void {
    const overrides = this.shipOverrides[ship.id] ?? {};
    overrides[key] = this.clampShipStat(key, value);
    this.shipOverrides[ship.id] = overrides;
  }

  resetShipTuning(shipId: ShipId): void {
    delete this.shipOverrides[shipId];
  }

  setShipOverrides(shipId: ShipId, overrides: DebugShipOverrides): void {
    this.shipOverrides[shipId] = { ...overrides };
  }

  getEffectiveShipBaseStats(ship: ShipRegistryEntry): ShipRegistryEntry['baseStats'] {
    const overrides = this.shipOverrides[ship.id];

    return {
      ...ship.baseStats,
      maxHull: overrides?.maxHull ?? ship.baseStats.maxHull,
      moveSpeed: overrides?.moveSpeed ?? ship.baseStats.moveSpeed,
      thrust: overrides?.thrust ?? ship.baseStats.thrust,
      brake: overrides?.brake ?? ship.baseStats.brake,
      strafe: overrides?.strafe ?? ship.baseStats.strafe
    };
  }

  getEffectiveShipHitRadius(ship: ShipRegistryEntry): number {
    return this.shipOverrides[ship.id]?.hitRadius ?? ship.hitRadius;
  }

  getShipTuningSummary(ship: ShipRegistryEntry): string {
    const stats = this.getEffectiveShipBaseStats(ship);
    const marker = this.shipOverrides[ship.id] ? ' *' : '';

    return `${ship.displayName}${marker}\nHull ${stats.maxHull}  Hit ${formatDisplayUnits(this.getEffectiveShipHitRadius(ship), 1)}\nVelocity ${formatIntegerDisplayUnits(stats.moveSpeed)}  Accel ${formatIntegerDisplayUnits(stats.thrust)}\nBrake ${formatIntegerDisplayUnits(stats.brake)}  Strafe ${formatIntegerDisplayUnits(stats.strafe)}`;
  }

  adjustWeaponStat(weapon: WeaponRegistryEntry, key: DebugWeaponStatKey, delta: number): void {
    const baseValue = this.getBaseWeaponStat(weapon, key);
    if (baseValue === undefined) {
      return;
    }

    const overrides = this.weaponOverrides[weapon.id] ?? {};
    const current = overrides[key] ?? baseValue;
    overrides[key] = this.clampWeaponStat(key, current + delta);
    this.weaponOverrides[weapon.id] = overrides;
  }

  setWeaponStat(weapon: WeaponRegistryEntry, key: DebugWeaponStatKey, value: number): void {
    const baseValue = this.getBaseWeaponStat(weapon, key);
    if (baseValue === undefined) {
      return;
    }

    const overrides = this.weaponOverrides[weapon.id] ?? {};
    overrides[key] = this.clampWeaponStat(key, value);
    this.weaponOverrides[weapon.id] = overrides;
  }

  resetWeaponLoadoutTuning(weaponId: WeaponId): void {
    delete this.weaponOverrides[weaponId];
  }

  setWeaponOverrides(weaponId: WeaponId, overrides: DebugWeaponOverrides): void {
    this.weaponOverrides[weaponId] = { ...overrides };
  }

  getEffectiveWeaponDefinition(weapon: WeaponRegistryEntry): WeaponRegistryEntry {
    const overrides = this.weaponOverrides[weapon.id];
    if (!overrides) {
      return weapon;
    }

    return {
      ...weapon,
      damage: overrides.damage ?? weapon.damage,
      cooldownSeconds: overrides.cooldownSeconds ?? weapon.cooldownSeconds,
      projectileSpeed: overrides.projectileSpeed ?? weapon.projectileSpeed,
      projectileLifetimeSeconds: overrides.projectileLifetimeSeconds ?? weapon.projectileLifetimeSeconds,
      projectileRange: overrides.projectileRange ?? weapon.projectileRange,
      rammingShield: weapon.rammingShield ? this.getEffectiveRammingShieldStats(weapon.rammingShield, overrides) : weapon.rammingShield,
      beam: weapon.beam ? this.getEffectiveBeamStats(weapon.beam, overrides) : weapon.beam
    };
  }

  getWeaponTuningSummary(weapon: WeaponRegistryEntry): string {
    const effective = this.getEffectiveWeaponDefinition(weapon);
    const marker = this.weaponOverrides[weapon.id] ? ' *' : '';

    if (effective.rammingShield) {
      const stats = effective.rammingShield;
      return `${weapon.displayName}${marker}\nShield ${stats.shieldMaxHp}  Regen ${stats.shieldRegenRatePerSecond}/s\nDash ${stats.dashMaxCharges} @ ${stats.dashChargeRechargeSeconds.toFixed(2)}s  Dist ${stats.dashDistance.toFixed(0)}\nGuard ${stats.guardDamage.toFixed(2)}  Bash ${stats.bashDamage.toFixed(2)}  Knock ${stats.knockback.toFixed(0)}\nRange ${formatIntegerDisplayUnits(stats.range)}  Width ${formatIntegerDisplayUnits(stats.width)}`;
    }

    if (effective.beam) {
      const stats = effective.beam;
      return `${weapon.displayName}${marker}\nTick ${stats.tickDamage.toFixed(2)} @ ${stats.tickRatePerSecond.toFixed(1)}/s\nRange ${formatIntegerDisplayUnits(stats.range)}  Width ${formatIntegerDisplayUnits(stats.width)}\nHeat ${stats.heatGainPerSecond.toFixed(1)}/s of ${stats.heatMax}\nCool ${stats.coolingPerSecond.toFixed(1)}/s  Vent ${stats.overheatCoolingPerSecond.toFixed(1)}/s`;
    }

    return `${weapon.displayName}${marker}\nDamage ${(effective.damage ?? 0).toFixed(2)}  Cooldown ${(effective.cooldownSeconds ?? 0).toFixed(2)}s\nSpeed ${formatIntegerDisplayUnits(effective.projectileSpeed ?? 0)}\nLifetime ${(effective.projectileLifetimeSeconds ?? 0).toFixed(2)}s  Range ${formatIntegerDisplayUnits(effective.projectileRange ?? 0)}`;
  }

  createMenuValues(snapshot: {
    runTimeSeconds: number;
    selectedShipName: string;
    activeWeaponName: string;
    playerXp: number;
    nextXpThreshold: number;
    bankedUpgrades: number;
    weaponCooldownSeconds: number;
    backgroundStarsVisible: boolean;
    starfieldFarParallax: number;
    starfieldMidParallax: number;
    starfieldNearParallax: number;
    blackHoleInfluenceRadiusScale: number;
    blackHoleDamageRadiusScale: number;
    blackHoleVisualScale: number;
    blackHoleCoreScale: number;
    blackHoleRadialStrengthMultiplier: number;
    blackHoleRadialCurve: number;
    blackHoleSwirlStrengthMultiplier: number;
    blackHoleSwirlCurve: number;
    blackHoleMaxVelocityMultiplier: number;
    blackHoleViscosityStrength: number;
    blackHoleViscosityCurve: number;
    blackHoleInnerDrag: number;
    blackHolePlayerResistance: number;
    blackHoleActive: boolean;
    blackHoleX: number;
    blackHoleY: number;
    blackHoleRunAgeSeconds: number;
    blackHoleEventHorizonRadius: number;
    blackHoleCaptureRadius: number;
    blackHoleWarningRadius: number;
    blackHoleGrowthPercent: number;
    blackHolePlayerCaptured: boolean;
    blackHoleCaptureTimerRemainingMs: number;
    blackHoleConsumedObjects: number;
    blackHolePlayerCaptureEnabled: boolean;
    blackHoleObjectConsumptionEnabled: boolean;
    blackHoleWarningVisualsEnabled: boolean;
    blackHoleBaseEventHorizonRadius: number;
    blackHoleMaxEventHorizonRadius: number;
    blackHoleGrowthPerMinute: number;
    blackHoleCaptureMargin: number;
    blackHoleWarningMargin: number;
    blackHolePlayerCaptureDurationMs: number;
    blackHolePlayerPullStrength: number;
    blackHoleObjectPullStrength: number;
    debugGamePaused: boolean;
    performanceProfilerEnabled: boolean;
    performanceProfilerManualActive: boolean;
    performanceProfilerSummary: string;
    autoDiagnosticsEnabled: boolean;
    autoDiagnosticsActive: boolean;
    autoDiagnosticsSummary: string;
    activeEnemies: number;
    activeAsteroids: number;
    activeDebris: number;
    activeScrapPickups: number;
    runScrapTotal: number;
    runScrapSpent: number;
    totalCredits: number;
    nextRerollCost: number;
    debugRerollCostBase: number;
    playerProjectiles: number;
    enemyProjectiles: number;
    playerHull: number;
    playerMaxHull: number;
    playerAlive: boolean;
    playerX: number;
    playerY: number;
    playerVelocityX: number;
    playerVelocityY: number;
    playerCollisionDamageImmune: boolean;
    missionObjectiveDistance: number;
    secretControlUnlocked: boolean;
    fuel: number;
    fuelMax: number;
    fuelDrainEnabled: boolean;
    fuelDrainMode: string;
    playerSpeed: number;
    playerMaxSpeed: number;
    playerThrust: number;
    playerBrake: number;
    playerStrafe: number;
    rammingShieldHp: number;
    rammingShieldMaxHp: number;
    rammingShieldDashCharges: number;
    rammingShieldDashMaxCharges: number;
    nextEnemySpawnSeconds: number;
    spawnDirectorSummary: string;
    shipTuningSummaries: Record<ShipId, string>;
    weaponTuningSummaries: Record<WeaponId, string>;
    hudButtonVariant: DebugMenuValues['hudButtonVariant'];
    hudButtonVariantTitle: string;
    hudButtonVariantDesignTarget: string;
    hudButtonVariantResearchBasis: string;
  }): DebugMenuValues {
    return {
      runTimeSeconds: snapshot.runTimeSeconds,
      selectedShipName: snapshot.selectedShipName,
      activeWeaponName: snapshot.activeWeaponName,
      playerXp: snapshot.playerXp,
      nextXpThreshold: snapshot.nextXpThreshold,
      bankedUpgrades: snapshot.bankedUpgrades,
      enemySpawningEnabled: this.enemySpawningEnabled,
      asteroidSpawningAvailable: false,
      asteroidSpawningEnabled: this.asteroidSpawningEnabled,
      playerInvulnerable: this.playerInvulnerable,
      collisionDebugEnabled: this.collisionDebugEnabled,
      blackHoleRadiiVisible: this.showBlackHoleRadii || this.collisionDebugEnabled,
      blackHoleFieldDamageEnabled: this.blackHoleFieldDamageEnabled,
      weaponDamageMultiplier: this.weaponDamageMultiplier,
      weaponFireRateMultiplier: this.weaponFireRateMultiplier,
      weaponCooldownSeconds: snapshot.weaponCooldownSeconds,
      backgroundStarsVisible: snapshot.backgroundStarsVisible,
      starfieldFarParallax: snapshot.starfieldFarParallax,
      starfieldMidParallax: snapshot.starfieldMidParallax,
      starfieldNearParallax: snapshot.starfieldNearParallax,
      blackHoleInfluenceRadiusScale: snapshot.blackHoleInfluenceRadiusScale,
      blackHoleDamageRadiusScale: snapshot.blackHoleDamageRadiusScale,
      blackHoleVisualScale: snapshot.blackHoleVisualScale,
      blackHoleCoreScale: snapshot.blackHoleCoreScale,
      blackHoleRadialStrengthMultiplier: snapshot.blackHoleRadialStrengthMultiplier,
      blackHoleRadialCurve: snapshot.blackHoleRadialCurve,
      blackHoleSwirlStrengthMultiplier: snapshot.blackHoleSwirlStrengthMultiplier,
      blackHoleSwirlCurve: snapshot.blackHoleSwirlCurve,
      blackHoleMaxVelocityMultiplier: snapshot.blackHoleMaxVelocityMultiplier,
      blackHoleViscosityStrength: snapshot.blackHoleViscosityStrength,
      blackHoleViscosityCurve: snapshot.blackHoleViscosityCurve,
      blackHoleInnerDrag: snapshot.blackHoleInnerDrag,
      blackHolePlayerResistance: snapshot.blackHolePlayerResistance,
      blackHoleActive: snapshot.blackHoleActive,
      blackHoleX: snapshot.blackHoleX,
      blackHoleY: snapshot.blackHoleY,
      blackHoleRunAgeSeconds: snapshot.blackHoleRunAgeSeconds,
      blackHoleEventHorizonRadius: snapshot.blackHoleEventHorizonRadius,
      blackHoleCaptureRadius: snapshot.blackHoleCaptureRadius,
      blackHoleWarningRadius: snapshot.blackHoleWarningRadius,
      blackHoleGrowthPercent: snapshot.blackHoleGrowthPercent,
      blackHolePlayerCaptured: snapshot.blackHolePlayerCaptured,
      blackHoleCaptureTimerRemainingMs: snapshot.blackHoleCaptureTimerRemainingMs,
      blackHoleConsumedObjects: snapshot.blackHoleConsumedObjects,
      blackHolePlayerCaptureEnabled: snapshot.blackHolePlayerCaptureEnabled,
      blackHoleObjectConsumptionEnabled: snapshot.blackHoleObjectConsumptionEnabled,
      blackHoleWarningVisualsEnabled: snapshot.blackHoleWarningVisualsEnabled,
      blackHoleBaseEventHorizonRadius: snapshot.blackHoleBaseEventHorizonRadius,
      blackHoleMaxEventHorizonRadius: snapshot.blackHoleMaxEventHorizonRadius,
      blackHoleGrowthPerMinute: snapshot.blackHoleGrowthPerMinute,
      blackHoleCaptureMargin: snapshot.blackHoleCaptureMargin,
      blackHoleWarningMargin: snapshot.blackHoleWarningMargin,
      blackHolePlayerCaptureDurationMs: snapshot.blackHolePlayerCaptureDurationMs,
      blackHolePlayerPullStrength: snapshot.blackHolePlayerPullStrength,
      blackHoleObjectPullStrength: snapshot.blackHoleObjectPullStrength,
      debugGamePaused: snapshot.debugGamePaused,
      performanceProfilerEnabled: snapshot.performanceProfilerEnabled,
      performanceProfilerManualActive: snapshot.performanceProfilerManualActive,
      performanceProfilerSummary: snapshot.performanceProfilerSummary,
      autoDiagnosticsEnabled: snapshot.autoDiagnosticsEnabled,
      autoDiagnosticsActive: snapshot.autoDiagnosticsActive,
      autoDiagnosticsSummary: snapshot.autoDiagnosticsSummary,
      activeEnemies: snapshot.activeEnemies,
      activeAsteroids: snapshot.activeAsteroids,
      asteroidFragmentSoftCap: this.asteroidFragmentSoftCap,
      asteroidFragmentHardCap: this.asteroidFragmentHardCap,
      asteroidFragmentBurstLimit: this.asteroidFragmentBurstLimit,
      debugAsteroidSpawnCount: this.debugAsteroidSpawnCount,
      activeDebris: snapshot.activeDebris,
      activeScrapPickups: snapshot.activeScrapPickups,
      runScrapTotal: snapshot.runScrapTotal,
      runScrapSpent: snapshot.runScrapSpent,
      totalCredits: snapshot.totalCredits,
      nextRerollCost: snapshot.nextRerollCost,
      debugRerollCostBase: snapshot.debugRerollCostBase,
      playerProjectiles: snapshot.playerProjectiles,
      enemyProjectiles: snapshot.enemyProjectiles,
      playerHull: snapshot.playerHull,
      playerMaxHull: snapshot.playerMaxHull,
      playerAlive: snapshot.playerAlive,
      playerX: snapshot.playerX,
      playerY: snapshot.playerY,
      playerVelocityX: snapshot.playerVelocityX,
      playerVelocityY: snapshot.playerVelocityY,
      playerCollisionDamageImmune: snapshot.playerCollisionDamageImmune,
      missionObjectiveDistance: snapshot.missionObjectiveDistance,
      secretControlUnlocked: snapshot.secretControlUnlocked,
      fuel: snapshot.fuel,
      fuelMax: snapshot.fuelMax,
      fuelDrainEnabled: snapshot.fuelDrainEnabled,
      fuelDrainMode: snapshot.fuelDrainMode,
      playerSpeed: snapshot.playerSpeed,
      playerMaxSpeed: snapshot.playerMaxSpeed,
      playerThrust: snapshot.playerThrust,
      playerBrake: snapshot.playerBrake,
      playerStrafe: snapshot.playerStrafe,
      playerThrustScale: this.playerThrustScale,
      playerBrakeScale: this.playerBrakeScale,
      playerStrafeScale: this.playerStrafeScale,
      playerInertiaScale: this.playerInertiaScale,
      enemySpeedScale: this.enemySpeedScale,
      enemyResponseScale: this.enemyResponseScale,
      asteroidCollisionDamageScale: this.asteroidCollisionDamageScale,
      asteroidCollisionImpulseScale: this.asteroidCollisionImpulseScale,
      globalMaxSpeed: this.globalMaxSpeed,
      globalImpactDamageCap: this.globalImpactDamageCap,
      playerImpactDamageCap: this.impactDamageCaps.player,
      enemyImpactDamageCap: this.impactDamageCaps.enemy,
      asteroidImpactDamageCap: this.impactDamageCaps.asteroid,
      debrisImpactDamageCap: this.impactDamageCaps.debris,
      playerImpactDamageScale: this.impactDamageScales.player,
      enemyImpactDamageScale: this.impactDamageScales.enemy,
      asteroidImpactDamageScale: this.impactDamageScales.asteroid,
      debrisImpactDamageScale: this.impactDamageScales.debris,
      healthBarsEnabled: this.healthBarsEnabled,
      playerHealthBarEnabled: this.playerHealthBarEnabled,
      healthBarRevealOnPlayerDamage: this.healthBarRevealOnPlayerDamage,
      healthBarWidthScale: this.healthBarWidthScale,
      healthBarHeight: this.healthBarHeight,
      healthBarVerticalOffset: this.healthBarVerticalOffset,
      healthBarAlpha: this.healthBarAlpha,
      damageNumbersEnabled: this.damageNumbersEnabled,
      damageNumberSourceColorsEnabled: this.damageNumberSourceColorsEnabled,
      damageNumberFontSize: this.damageNumberFontSize,
      damageNumberLifetimeMs: this.damageNumberLifetimeMs,
      damageNumberRiseDistance: this.damageNumberRiseDistance,
      damageNumberDrift: this.damageNumberDrift,
      damageNumberScalePop: this.damageNumberScalePop,
      damageNumberFadeStart: this.damageNumberFadeStart,
      damageNumberAlpha: this.damageNumberAlpha,
      asteroidDamageFlashEnabled: this.asteroidDamageFlashEnabled,
      collisionShapeTuningSummary: this.getCollisionShapeTuningSummary(),
      rammingShieldHp: snapshot.rammingShieldHp,
      rammingShieldMaxHp: snapshot.rammingShieldMaxHp,
      rammingShieldDashCharges: snapshot.rammingShieldDashCharges,
      rammingShieldDashMaxCharges: snapshot.rammingShieldDashMaxCharges,
      shipTuningSummaries: snapshot.shipTuningSummaries,
      weaponTuningSummaries: snapshot.weaponTuningSummaries,
      deathShardTuningSummaries: {
        ship: this.getDeathShardTuningSummary('ship'),
        player: this.getDeathShardTuningSummary('player'),
        asteroid: this.getDeathShardTuningSummary('asteroid'),
        blackHoleShip: this.getDeathShardTuningSummary('blackHoleShip'),
        blackHoleAsteroid: this.getDeathShardTuningSummary('blackHoleAsteroid')
      },
      spawnDirectorSummary: snapshot.spawnDirectorSummary,
      hudButtonVariant: snapshot.hudButtonVariant,
      hudButtonVariantTitle: snapshot.hudButtonVariantTitle,
      hudButtonVariantDesignTarget: snapshot.hudButtonVariantDesignTarget,
      hudButtonVariantResearchBasis: snapshot.hudButtonVariantResearchBasis
    };
  }

  createDebugPresetState() {
    return {
      schemaVersion: 1,
      toggles: {
        collisionDebugEnabled: this.collisionDebugEnabled,
        enemySpawningEnabled: this.enemySpawningEnabled,
        asteroidSpawningEnabled: this.asteroidSpawningEnabled,
        playerInvulnerable: this.playerInvulnerable,
        showBlackHoleRadii: this.showBlackHoleRadii,
        blackHoleFieldDamageEnabled: this.blackHoleFieldDamageEnabled
      },
      weaponMultipliers: {
        weaponDamageMultiplier: this.weaponDamageMultiplier,
        weaponFireRateMultiplier: this.weaponFireRateMultiplier
      },
      physics: {
        playerThrustScale: this.playerThrustScale,
        playerBrakeScale: this.playerBrakeScale,
        playerStrafeScale: this.playerStrafeScale,
        playerInertiaScale: this.playerInertiaScale,
        enemySpeedScale: this.enemySpeedScale,
        enemyResponseScale: this.enemyResponseScale,
        asteroidCollisionDamageScale: this.asteroidCollisionDamageScale,
        asteroidCollisionImpulseScale: this.asteroidCollisionImpulseScale,
        globalMaxSpeed: this.globalMaxSpeed,
        globalImpactDamageCap: this.globalImpactDamageCap,
        impactDamageCaps: { ...this.impactDamageCaps },
        impactDamageScales: { ...this.impactDamageScales }
      },
      combatFeedback: {
        healthBarsEnabled: this.healthBarsEnabled,
        playerHealthBarEnabled: this.playerHealthBarEnabled,
        healthBarRevealOnPlayerDamage: this.healthBarRevealOnPlayerDamage,
        healthBarWidthScale: this.healthBarWidthScale,
        healthBarHeight: this.healthBarHeight,
        healthBarVerticalOffset: this.healthBarVerticalOffset,
        healthBarAlpha: this.healthBarAlpha,
        damageNumbersEnabled: this.damageNumbersEnabled,
        damageNumberSourceColorsEnabled: this.damageNumberSourceColorsEnabled,
        damageNumberFontSize: this.damageNumberFontSize,
        damageNumberLifetimeMs: this.damageNumberLifetimeMs,
        damageNumberRiseDistance: this.damageNumberRiseDistance,
        damageNumberDrift: this.damageNumberDrift,
        damageNumberScalePop: this.damageNumberScalePop,
        damageNumberFadeStart: this.damageNumberFadeStart,
        damageNumberAlpha: this.damageNumberAlpha,
        asteroidDamageFlashEnabled: this.asteroidDamageFlashEnabled
      },
      collisionShapes: { ...this.collisionShapeScales },
      asteroidFragmentTuning: {
        softCap: this.asteroidFragmentSoftCap,
        hardCap: this.asteroidFragmentHardCap,
        burstLimit: this.asteroidFragmentBurstLimit,
        spawnCount: this.debugAsteroidSpawnCount
      },
      deathShardTuning: structuredClone(this.deathShardTuning),
      shipOverrides: structuredClone(this.shipOverrides),
      weaponOverrides: structuredClone(this.weaponOverrides)
    };
  }

  applyDebugPresetState(state: unknown): void {
    if (!state || typeof state !== 'object') {
      return;
    }

    const preset = state as Record<string, unknown>;
    const toggles = this.getRecord(preset.toggles);
    this.collisionDebugEnabled = this.getBoolean(toggles.collisionDebugEnabled, this.collisionDebugEnabled);
    this.enemySpawningEnabled = this.getBoolean(toggles.enemySpawningEnabled, this.enemySpawningEnabled);
    this.asteroidSpawningEnabled = this.getBoolean(toggles.asteroidSpawningEnabled, this.asteroidSpawningEnabled);
    this.playerInvulnerable = this.getBoolean(toggles.playerInvulnerable, this.playerInvulnerable);
    this.showBlackHoleRadii = this.getBoolean(toggles.showBlackHoleRadii, this.showBlackHoleRadii);
    this.blackHoleFieldDamageEnabled = this.getBoolean(toggles.blackHoleFieldDamageEnabled, this.blackHoleFieldDamageEnabled);

    const weaponMultipliers = this.getRecord(preset.weaponMultipliers);
    this.weaponDamageMultiplier = Number(Math.max(DEBUG_WEAPON_DAMAGE_MULTIPLIER_MIN, this.getNumber(weaponMultipliers.weaponDamageMultiplier, this.weaponDamageMultiplier)).toFixed(1));
    this.weaponFireRateMultiplier = Number(Math.max(DEBUG_WEAPON_FIRE_RATE_MULTIPLIER_MIN, this.getNumber(weaponMultipliers.weaponFireRateMultiplier, this.weaponFireRateMultiplier)).toFixed(1));

    const physics = this.getRecord(preset.physics);
    for (const key of [
      'playerThrustScale',
      'playerBrakeScale',
      'playerStrafeScale',
      'playerInertiaScale',
      'enemySpeedScale',
      'enemyResponseScale',
      'asteroidCollisionDamageScale',
      'asteroidCollisionImpulseScale',
      'globalMaxSpeed',
      'globalImpactDamageCap'
    ] as const) {
      this.setPhysicsTuning(key, this.getNumber(physics[key], this[key]));
    }

    const impactDamageCaps = this.getRecord(physics.impactDamageCaps);
    const impactDamageScales = this.getRecord(physics.impactDamageScales);
    for (const source of ['player', 'enemy', 'asteroid', 'debris'] as const) {
      this.setImpactDamageCap(source, this.getNumber(impactDamageCaps[source], this.impactDamageCaps[source]));
      this.setImpactDamageScale(source, this.getNumber(impactDamageScales[source], this.impactDamageScales[source]));
    }

    const combatFeedback = this.getRecord(preset.combatFeedback);
    this.healthBarsEnabled = this.getBoolean(combatFeedback.healthBarsEnabled, this.healthBarsEnabled);
    this.playerHealthBarEnabled = this.getBoolean(combatFeedback.playerHealthBarEnabled, this.playerHealthBarEnabled);
    this.healthBarRevealOnPlayerDamage = this.getBoolean(combatFeedback.healthBarRevealOnPlayerDamage, this.healthBarRevealOnPlayerDamage);
    this.healthBarWidthScale = Number(this.clampNumber(this.getNumber(combatFeedback.healthBarWidthScale, this.healthBarWidthScale), 0.5, 2).toFixed(2));
    this.healthBarHeight = Math.round(this.clampNumber(this.getNumber(combatFeedback.healthBarHeight, this.healthBarHeight), 2, 12));
    this.healthBarVerticalOffset = Math.round(this.clampNumber(this.getNumber(combatFeedback.healthBarVerticalOffset, this.healthBarVerticalOffset), 12, 80));
    this.healthBarAlpha = Number(this.clampNumber(this.getNumber(combatFeedback.healthBarAlpha, this.healthBarAlpha), 0.25, 1).toFixed(2));
    this.damageNumbersEnabled = this.getBoolean(combatFeedback.damageNumbersEnabled, this.damageNumbersEnabled);
    this.damageNumberSourceColorsEnabled = this.getBoolean(combatFeedback.damageNumberSourceColorsEnabled, this.damageNumberSourceColorsEnabled);
    this.damageNumberFontSize = Math.round(this.clampNumber(this.getNumber(combatFeedback.damageNumberFontSize, this.damageNumberFontSize), 8, 34));
    this.damageNumberLifetimeMs = Math.round(this.clampNumber(this.getNumber(combatFeedback.damageNumberLifetimeMs, this.damageNumberLifetimeMs), 250, 2200));
    this.damageNumberRiseDistance = Math.round(this.clampNumber(this.getNumber(combatFeedback.damageNumberRiseDistance, this.damageNumberRiseDistance), 8, 120));
    this.damageNumberDrift = Math.round(this.clampNumber(this.getNumber(combatFeedback.damageNumberDrift, this.damageNumberDrift), 0, 80));
    this.damageNumberScalePop = Number(this.clampNumber(this.getNumber(combatFeedback.damageNumberScalePop, this.damageNumberScalePop), 1, 2).toFixed(2));
    this.damageNumberFadeStart = Number(this.clampNumber(this.getNumber(combatFeedback.damageNumberFadeStart, this.damageNumberFadeStart), 0, 0.9).toFixed(2));
    this.damageNumberAlpha = Number(this.clampNumber(this.getNumber(combatFeedback.damageNumberAlpha, this.damageNumberAlpha), 0.25, 1).toFixed(2));
    this.asteroidDamageFlashEnabled = this.getBoolean(combatFeedback.asteroidDamageFlashEnabled, this.asteroidDamageFlashEnabled);

    this.applyDeathShardPreset(preset.deathShardTuning);
    this.applyCollisionShapePreset(preset.collisionShapes);
    this.applyAsteroidFragmentPreset(preset.asteroidFragmentTuning);
    this.applyShipOverridePreset(preset.shipOverrides);
    this.applyWeaponOverridePreset(preset.weaponOverrides);
  }

  resetAllDebugTuning(): void {
    this.collisionDebugEnabled = false;
    this.enemySpawningEnabled = true;
    this.asteroidSpawningEnabled = false;
    this.playerInvulnerable = false;
    this.showBlackHoleRadii = false;
    this.blackHoleFieldDamageEnabled = true;
    this.resetWeaponTuning();
    this.resetPhysicsTuning();
    this.resetCombatFeedbackTuning();
    this.resetCollisionShapeTuning();
    this.resetAsteroidFragmentTuning();
    this.resetDebugAsteroidSpawnCount();
    this.resetDeathShardTuning();
    for (const key of Object.keys(this.shipOverrides)) {
      delete this.shipOverrides[key as ShipId];
    }
    for (const key of Object.keys(this.weaponOverrides)) {
      delete this.weaponOverrides[key as WeaponId];
    }
  }

  private getBaseShipStat(ship: ShipRegistryEntry, key: DebugShipStatKey): number {
    return key === 'hitRadius' ? ship.hitRadius : ship.baseStats[key];
  }

  private getBaseWeaponStat(weapon: WeaponRegistryEntry, key: DebugWeaponStatKey): number | undefined {
    if (key in weapon) {
      const value = weapon[key as keyof WeaponRegistryEntry];
      return typeof value === 'number' ? value : undefined;
    }

    const shield = weapon.rammingShield;
    if (shield && key in shield) {
      const value = shield[key as keyof RammingShieldStats];
      return typeof value === 'number' ? value : undefined;
    }

    const beam = weapon.beam;
    if (!beam || !(key in beam)) {
      return undefined;
    }

    const value = beam[key as keyof BeamWeaponStats];
    return typeof value === 'number' ? value : undefined;
  }

  private getEffectiveRammingShieldStats(base: RammingShieldStats, overrides: DebugWeaponOverrides): RammingShieldStats {
    return {
      ...base,
      shieldMaxHp: overrides.shieldMaxHp ?? base.shieldMaxHp,
      shieldRegenDelaySeconds: overrides.shieldRegenDelaySeconds ?? base.shieldRegenDelaySeconds,
      shieldRegenRatePerSecond: overrides.shieldRegenRatePerSecond ?? base.shieldRegenRatePerSecond,
      dashMaxCharges: overrides.dashMaxCharges ?? base.dashMaxCharges,
      dashChargeRechargeSeconds: overrides.dashChargeRechargeSeconds ?? base.dashChargeRechargeSeconds,
      dashDistance: overrides.dashDistance ?? base.dashDistance,
      dashDurationSeconds: overrides.dashDurationSeconds ?? base.dashDurationSeconds,
      range: overrides.range ?? base.range,
      width: overrides.width ?? base.width,
      guardDamage: overrides.guardDamage ?? base.guardDamage,
      bashDamage: overrides.bashDamage ?? base.bashDamage,
      knockback: overrides.knockback ?? base.knockback,
      contactCooldownMs: overrides.contactCooldownMs ?? base.contactCooldownMs
    };
  }

  private getEffectiveBeamStats(base: BeamWeaponStats, overrides: DebugWeaponOverrides): BeamWeaponStats {
    return {
      ...base,
      tickDamage: overrides.tickDamage ?? base.tickDamage,
      tickRatePerSecond: overrides.tickRatePerSecond ?? base.tickRatePerSecond,
      range: overrides.range ?? base.range,
      width: overrides.width ?? base.width,
      heatMax: overrides.heatMax ?? base.heatMax,
      heatGainPerSecond: overrides.heatGainPerSecond ?? base.heatGainPerSecond,
      coolingPerSecond: overrides.coolingPerSecond ?? base.coolingPerSecond,
      overheatCoolingPerSecond: overrides.overheatCoolingPerSecond ?? base.overheatCoolingPerSecond
    };
  }

  private clampShipStat(key: DebugShipStatKey, value: number): number {
    return Number(Math.max(SHIP_STAT_MIN[key], value).toFixed(key === 'hitRadius' ? 2 : 1));
  }

  private clampWeaponStat(key: DebugWeaponStatKey, value: number): number {
    const clamped = Math.max(WEAPON_STAT_MIN[key], value);
    return INTEGER_WEAPON_STATS.has(key) ? Math.round(clamped) : Number(clamped.toFixed(2));
  }

  private clampScale(value: number): number {
    return Number(Math.min(DEBUG_PHYSICS_SCALE_MAX, Math.max(DEBUG_PHYSICS_SCALE_MIN, value)).toFixed(2));
  }

  private clampGlobalMaxSpeed(value: number): number {
    return Number(Math.min(DEBUG_GLOBAL_MAX_SPEED_MAX, Math.max(DEBUG_GLOBAL_MAX_SPEED_MIN, value)).toFixed(1));
  }

  private clampImpactCap(value: number): number {
    return Number(Math.min(DEBUG_IMPACT_CAP_MAX, Math.max(DEBUG_IMPACT_CAP_MIN, value)).toFixed(1));
  }

  private clampImpactScale(value: number): number {
    return Number(Math.min(DEBUG_IMPACT_SCALE_MAX, Math.max(DEBUG_IMPACT_SCALE_MIN, value)).toFixed(3));
  }

  private clampCollisionShapeScale(value: number): number {
    return Number(Math.min(DEBUG_COLLISION_SHAPE_SCALE_MAX, Math.max(DEBUG_COLLISION_SHAPE_SCALE_MIN, value)).toFixed(2));
  }

  private clampAsteroidFragmentCap(value: number): number {
    return Math.round(this.clampNumber(value, DEBUG_ASTEROID_FRAGMENT_CAP_MIN, DEBUG_ASTEROID_FRAGMENT_CAP_MAX));
  }

  private clampDebugAsteroidSpawnCount(value: number): number {
    return Math.round(this.clampNumber(value, DEBUG_ASTEROID_SPAWN_COUNT_MIN, DEBUG_ASTEROID_SPAWN_COUNT_MAX));
  }

  private clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private clampDeathShardTuning(key: DeathShardTuningKey, value: number): number {
    const [min, max] = key === 'dissolveStart' ? [0, 0.9] : key === 'alphaScale' ? [0.1, 1.4] : [0.1, 4];
    return Number(this.clampNumber(value, min, max).toFixed(2));
  }

  private applyDeathShardPreset(raw: unknown): void {
    const record = this.getRecord(raw);
    for (const style of DEATH_SHARD_STYLES) {
      const rawStyle = this.getRecord(record[style]);
      for (const key of Object.keys(DEFAULT_DEATH_SHARD_TUNING[style]) as DeathShardTuningKey[]) {
        this.setDeathShardTuning(style, key, this.getNumber(rawStyle[key], this.deathShardTuning[style][key]));
      }
    }
  }

  private applyCollisionShapePreset(raw: unknown): void {
    const record = this.getRecord(raw);
    for (const key of Object.keys(DEFAULT_COLLISION_SHAPE_SCALES) as DebugCollisionShapeScaleKey[]) {
      this.setCollisionShapeScale(key, this.getNumber(record[key], this.collisionShapeScales[key]));
    }
  }

  private applyAsteroidFragmentPreset(raw: unknown): void {
    const record = this.getRecord(raw);
    this.setAsteroidFragmentSoftCap(this.getNumber(record.softCap, this.asteroidFragmentSoftCap));
    this.setAsteroidFragmentHardCap(this.getNumber(record.hardCap, this.asteroidFragmentHardCap));
    this.setAsteroidFragmentBurstLimit(this.getNumber(record.burstLimit, this.asteroidFragmentBurstLimit));
    this.setDebugAsteroidSpawnCount(this.getNumber(record.spawnCount, this.debugAsteroidSpawnCount));
  }

  private applyShipOverridePreset(raw: unknown): void {
    const record = this.getRecord(raw);
    for (const key of Object.keys(this.shipOverrides)) {
      delete this.shipOverrides[key as ShipId];
    }
    for (const [shipId, rawOverrides] of Object.entries(record)) {
      const overrides = this.getRecord(rawOverrides);
      const next: DebugShipOverrides = {};
      for (const stat of ['maxHull', 'moveSpeed', 'thrust', 'brake', 'strafe', 'hitRadius'] as DebugShipStatKey[]) {
        if (typeof overrides[stat] === 'number' && Number.isFinite(overrides[stat])) {
          next[stat] = this.clampShipStat(stat, overrides[stat]);
        }
      }
      this.shipOverrides[shipId as ShipId] = next;
    }
  }

  private applyWeaponOverridePreset(raw: unknown): void {
    const record = this.getRecord(raw);
    for (const key of Object.keys(this.weaponOverrides)) {
      delete this.weaponOverrides[key as WeaponId];
    }
    for (const [weaponId, rawOverrides] of Object.entries(record)) {
      const overrides = this.getRecord(rawOverrides);
      const next: DebugWeaponOverrides = {};
      for (const stat of Object.keys(WEAPON_STAT_MIN) as DebugWeaponStatKey[]) {
        if (typeof overrides[stat] === 'number' && Number.isFinite(overrides[stat])) {
          next[stat] = this.clampWeaponStat(stat, overrides[stat]);
        }
      }
      this.weaponOverrides[weaponId as WeaponId] = next;
    }
  }

  private getRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private getNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private getBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }
}
