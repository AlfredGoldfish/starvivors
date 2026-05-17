import type { BlackHolePngLayerDebugSummary, BlackHolePngTextureKey } from '../blackHole';
import type { ShipId, ShipRegistryEntry } from '../../data/ships';
import type { RammingShieldStats, WeaponId, WeaponRegistryEntry } from '../../data/weapons';
import type { DebugMenuValues } from './debugTypes';

const DEBUG_WEAPON_DAMAGE_MULTIPLIER_MIN = 1;
const DEBUG_WEAPON_FIRE_RATE_MULTIPLIER_MIN = 0.1;
const DEBUG_WEAPON_COOLDOWN_MIN_SECONDS = 0.01;
const DEBUG_PHYSICS_SCALE_MIN = 0.05;
const DEBUG_PHYSICS_SCALE_MAX = 3;
const DEBUG_PHYSICS_EXPONENT_MIN = 0;
const DEBUG_PHYSICS_EXPONENT_MAX = 1.5;
const DEFAULT_PLAYER_THRUST_SCALE = 0.82;
const DEFAULT_PLAYER_BRAKE_SCALE = 0.88;
const DEFAULT_PLAYER_STRAFE_SCALE = 0.88;
const DEFAULT_PLAYER_INERTIA_SCALE = 0.72;
const DEFAULT_PLAYER_CONTROL_MASS_EXPONENT = 0.45;
const DEFAULT_ENEMY_SPEED_SCALE = 1.08;
const DEFAULT_ENEMY_RESPONSE_SCALE = 1.18;
const DEFAULT_ENEMY_MASS_EXPONENT = 0.38;
const DEFAULT_ASTEROID_COLLISION_DAMAGE_SCALE = 1;
const DEFAULT_ASTEROID_COLLISION_IMPULSE_SCALE = 1;
const DEFAULT_GLOBAL_MAX_SPEED = 1000;
const DEFAULT_GLOBAL_IMPACT_DAMAGE_CAP = 600;
const DEBUG_GLOBAL_MAX_SPEED_MIN = 1;
const DEBUG_GLOBAL_MAX_SPEED_MAX = 10000;
const DEBUG_IMPACT_CAP_MIN = 0;
const DEBUG_IMPACT_CAP_MAX = 10000;
const DEBUG_IMPACT_SCALE_MIN = 0;
const DEBUG_IMPACT_SCALE_MAX = 10;

export type DebugImpactSourceType = 'player' | 'enemy' | 'asteroid' | 'debris';
export type DebugPhysicsTuningKey =
  | 'globalMaxSpeed'
  | 'globalImpactDamageCap'
  | 'playerImpactDamageCap'
  | 'enemyImpactDamageCap'
  | 'asteroidImpactDamageCap'
  | 'debrisImpactDamageCap'
  | 'playerImpactDamageScale'
  | 'enemyImpactDamageScale'
  | 'asteroidImpactDamageScale'
  | 'debrisImpactDamageScale'
  | 'playerThrustScale'
  | 'playerBrakeScale'
  | 'playerStrafeScale'
  | 'playerInertiaScale'
  | 'playerControlMassExponent'
  | 'enemySpeedScale'
  | 'enemyResponseScale'
  | 'enemyMassExponent'
  | 'asteroidCollisionDamageScale'
  | 'asteroidCollisionImpulseScale';

export type DebugShipStatKey = 'maxHull' | 'mass' | 'moveSpeed' | 'thrust' | 'brake' | 'strafe' | 'hitRadius';
export type DebugWeaponStatKey =
  | 'damage'
  | 'cooldownSeconds'
  | 'projectileSpeed'
  | 'projectileLifetimeSeconds'
  | 'projectileRange'
  | 'shieldMaxHp'
  | 'shieldRegenDelaySeconds'
  | 'shieldRegenRatePerSecond'
  | 'dashMaxCharges'
  | 'dashChargeRechargeSeconds'
  | 'dashImpulse'
  | 'dashEmpoweredWindowSeconds'
  | 'dashRamDamageMultiplier'
  | 'range'
  | 'width'
  | 'baseDamage'
  | 'speedDamageMultiplier'
  | 'strongRamSpeed'
  | 'maxDamage'
  | 'contactCooldownMs'
  | 'brokenDamageMultiplier';

export type DebugShipOverrides = Partial<Record<DebugShipStatKey, number>>;
export type DebugWeaponOverrides = Partial<Record<DebugWeaponStatKey, number>>;

const SHIP_STAT_MIN: Record<DebugShipStatKey, number> = {
  maxHull: 1,
  mass: 0.1,
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
  dashImpulse: 0,
  dashEmpoweredWindowSeconds: 0,
  dashRamDamageMultiplier: 0,
  range: 1,
  width: 1,
  baseDamage: 0,
  speedDamageMultiplier: 0,
  strongRamSpeed: 0,
  maxDamage: 0,
  contactCooldownMs: 1,
  brokenDamageMultiplier: 0
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
  playerControlMassExponent = DEFAULT_PLAYER_CONTROL_MASS_EXPONENT;
  enemySpeedScale = DEFAULT_ENEMY_SPEED_SCALE;
  enemyResponseScale = DEFAULT_ENEMY_RESPONSE_SCALE;
  enemyMassExponent = DEFAULT_ENEMY_MASS_EXPONENT;
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

  adjustPlayerControlMassExponent(delta: number): void {
    this.playerControlMassExponent = this.clampExponent(this.playerControlMassExponent + delta);
  }

  adjustEnemySpeedScale(delta: number): void {
    this.enemySpeedScale = this.clampScale(this.enemySpeedScale + delta);
  }

  adjustEnemyResponseScale(delta: number): void {
    this.enemyResponseScale = this.clampScale(this.enemyResponseScale + delta);
  }

  adjustEnemyMassExponent(delta: number): void {
    this.enemyMassExponent = this.clampExponent(this.enemyMassExponent + delta);
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
      case 'playerControlMassExponent':
        this.playerControlMassExponent = this.clampExponent(value);
        break;
      case 'enemySpeedScale':
        this.enemySpeedScale = this.clampScale(value);
        break;
      case 'enemyResponseScale':
        this.enemyResponseScale = this.clampScale(value);
        break;
      case 'enemyMassExponent':
        this.enemyMassExponent = this.clampExponent(value);
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
    this.playerControlMassExponent = DEFAULT_PLAYER_CONTROL_MASS_EXPONENT;
    this.enemySpeedScale = DEFAULT_ENEMY_SPEED_SCALE;
    this.enemyResponseScale = DEFAULT_ENEMY_RESPONSE_SCALE;
    this.enemyMassExponent = DEFAULT_ENEMY_MASS_EXPONENT;
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
      mass: overrides?.mass ?? ship.baseStats.mass,
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

    return `${ship.displayName}${marker}\nHull ${stats.maxHull}  Mass ${stats.mass.toFixed(2)}  Hit ${this.getEffectiveShipHitRadius(ship).toFixed(1)}\nSpeed ${stats.moveSpeed}  Thrust ${stats.thrust.toFixed(1)}\nBrake ${stats.brake.toFixed(1)}  Strafe ${stats.strafe.toFixed(1)}`;
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
      rammingShield: weapon.rammingShield ? this.getEffectiveRammingShieldStats(weapon.rammingShield, overrides) : weapon.rammingShield
    };
  }

  getWeaponTuningSummary(weapon: WeaponRegistryEntry): string {
    const effective = this.getEffectiveWeaponDefinition(weapon);
    const marker = this.weaponOverrides[weapon.id] ? ' *' : '';

    if (effective.rammingShield) {
      const stats = effective.rammingShield;
      return `${weapon.displayName}${marker}\nShield ${stats.shieldMaxHp}  Regen ${stats.shieldRegenRatePerSecond}/s\nDash ${stats.dashMaxCharges} @ ${stats.dashChargeRechargeSeconds.toFixed(2)}s  Imp ${stats.dashImpulse.toFixed(1)}\nRam x${stats.dashRamDamageMultiplier.toFixed(2)}  Dmg ${stats.baseDamage.toFixed(2)}-${stats.maxDamage.toFixed(2)}\nRange ${stats.range.toFixed(1)}  Width ${stats.width.toFixed(1)}`;
    }

    return `${weapon.displayName}${marker}\nDamage ${(effective.damage ?? 0).toFixed(2)}  Cooldown ${(effective.cooldownSeconds ?? 0).toFixed(2)}s\nSpeed ${(effective.projectileSpeed ?? 0).toFixed(1)}\nLifetime ${(effective.projectileLifetimeSeconds ?? 0).toFixed(2)}s  Range ${(effective.projectileRange ?? 0).toFixed(1)}`;
  }

  createMenuValues(snapshot: {
    selectedShipName: string;
    weaponCooldownSeconds: number;
    backgroundStarsVisible: boolean;
    starfieldFarParallax: number;
    starfieldMidParallax: number;
    starfieldNearParallax: number;
    blackHoleLensOrbitSpeedMultiplier: number;
    blackHoleLensDensity: number;
    blackHoleLensLengthMultiplier: number;
    blackHoleInfluenceRadiusScale: number;
    blackHoleDamageRadiusScale: number;
    blackHoleVisualScale: number;
    blackHoleCoreScale: number;
    blackHoleRadialStrengthMultiplier: number;
    blackHoleRadialCurve: number;
    blackHoleSwirlStrengthMultiplier: number;
    blackHoleSwirlCurve: number;
    blackHoleMassResistanceMultiplier: number;
    blackHoleMaxVelocityMultiplier: number;
    blackHoleViscosityStrength: number;
    blackHoleViscosityCurve: number;
    blackHoleInnerDrag: number;
    blackHolePlayerResistance: number;
    blackHoleProjectionLensLayersEnabled: boolean;
    blackHoleSelectedPngLayerIndex: number;
    blackHolePngLayerCount: number;
    blackHoleSelectedPngLayer?: BlackHolePngLayerDebugSummary;
    blackHoleAddPngTextureKey: BlackHolePngTextureKey;
    blackHoleAddPngTextureLabel: string;
    debugGamePaused: boolean;
    activeEnemies: number;
    activeAsteroids: number;
    activeDebris: number;
    activeScrapPickups: number;
    runScrapTotal: number;
    totalCredits: number;
    playerProjectiles: number;
    enemyProjectiles: number;
    playerHull: number;
    playerMaxHull: number;
    playerMass: number;
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
    shipTuningSummaries: Record<ShipId, string>;
    weaponTuningSummaries: Record<WeaponId, string>;
  }): DebugMenuValues {
    return {
      selectedShipName: snapshot.selectedShipName,
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
      blackHoleLensOrbitSpeedMultiplier: snapshot.blackHoleLensOrbitSpeedMultiplier,
      blackHoleLensDensity: snapshot.blackHoleLensDensity,
      blackHoleLensLengthMultiplier: snapshot.blackHoleLensLengthMultiplier,
      blackHoleInfluenceRadiusScale: snapshot.blackHoleInfluenceRadiusScale,
      blackHoleDamageRadiusScale: snapshot.blackHoleDamageRadiusScale,
      blackHoleVisualScale: snapshot.blackHoleVisualScale,
      blackHoleCoreScale: snapshot.blackHoleCoreScale,
      blackHoleRadialStrengthMultiplier: snapshot.blackHoleRadialStrengthMultiplier,
      blackHoleRadialCurve: snapshot.blackHoleRadialCurve,
      blackHoleSwirlStrengthMultiplier: snapshot.blackHoleSwirlStrengthMultiplier,
      blackHoleSwirlCurve: snapshot.blackHoleSwirlCurve,
      blackHoleMassResistanceMultiplier: snapshot.blackHoleMassResistanceMultiplier,
      blackHoleMaxVelocityMultiplier: snapshot.blackHoleMaxVelocityMultiplier,
      blackHoleViscosityStrength: snapshot.blackHoleViscosityStrength,
      blackHoleViscosityCurve: snapshot.blackHoleViscosityCurve,
      blackHoleInnerDrag: snapshot.blackHoleInnerDrag,
      blackHolePlayerResistance: snapshot.blackHolePlayerResistance,
      blackHoleProjectionLensLayersEnabled: snapshot.blackHoleProjectionLensLayersEnabled,
      blackHoleSelectedPngLayerIndex: snapshot.blackHoleSelectedPngLayerIndex,
      blackHolePngLayerCount: snapshot.blackHolePngLayerCount,
      blackHoleSelectedPngLayer: snapshot.blackHoleSelectedPngLayer,
      blackHoleAddPngTextureKey: snapshot.blackHoleAddPngTextureKey,
      blackHoleAddPngTextureLabel: snapshot.blackHoleAddPngTextureLabel,
      debugGamePaused: snapshot.debugGamePaused,
      activeEnemies: snapshot.activeEnemies,
      activeAsteroids: snapshot.activeAsteroids,
      activeDebris: snapshot.activeDebris,
      activeScrapPickups: snapshot.activeScrapPickups,
      runScrapTotal: snapshot.runScrapTotal,
      totalCredits: snapshot.totalCredits,
      playerProjectiles: snapshot.playerProjectiles,
      enemyProjectiles: snapshot.enemyProjectiles,
      playerHull: snapshot.playerHull,
      playerMaxHull: snapshot.playerMaxHull,
      playerMass: snapshot.playerMass,
      playerSpeed: snapshot.playerSpeed,
      playerMaxSpeed: snapshot.playerMaxSpeed,
      playerThrust: snapshot.playerThrust,
      playerBrake: snapshot.playerBrake,
      playerStrafe: snapshot.playerStrafe,
      playerThrustScale: this.playerThrustScale,
      playerBrakeScale: this.playerBrakeScale,
      playerStrafeScale: this.playerStrafeScale,
      playerInertiaScale: this.playerInertiaScale,
      playerControlMassExponent: this.playerControlMassExponent,
      enemySpeedScale: this.enemySpeedScale,
      enemyResponseScale: this.enemyResponseScale,
      enemyMassExponent: this.enemyMassExponent,
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
      rammingShieldHp: snapshot.rammingShieldHp,
      rammingShieldMaxHp: snapshot.rammingShieldMaxHp,
      rammingShieldDashCharges: snapshot.rammingShieldDashCharges,
      rammingShieldDashMaxCharges: snapshot.rammingShieldDashMaxCharges,
      shipTuningSummaries: snapshot.shipTuningSummaries,
      weaponTuningSummaries: snapshot.weaponTuningSummaries,
      spawnDirectorSummary: `Spawner ${this.enemySpawningEnabled ? 'on' : 'off'} / next ${snapshot.nextEnemySpawnSeconds.toFixed(1)}s`
    };
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
    if (!shield || !(key in shield)) {
      return undefined;
    }

    const value = shield[key as keyof RammingShieldStats];
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
      dashImpulse: overrides.dashImpulse ?? base.dashImpulse,
      dashEmpoweredWindowSeconds: overrides.dashEmpoweredWindowSeconds ?? base.dashEmpoweredWindowSeconds,
      dashRamDamageMultiplier: overrides.dashRamDamageMultiplier ?? base.dashRamDamageMultiplier,
      range: overrides.range ?? base.range,
      width: overrides.width ?? base.width,
      baseDamage: overrides.baseDamage ?? base.baseDamage,
      speedDamageMultiplier: overrides.speedDamageMultiplier ?? base.speedDamageMultiplier,
      strongRamSpeed: overrides.strongRamSpeed ?? base.strongRamSpeed,
      maxDamage: overrides.maxDamage ?? base.maxDamage,
      contactCooldownMs: overrides.contactCooldownMs ?? base.contactCooldownMs,
      brokenDamageMultiplier: overrides.brokenDamageMultiplier ?? base.brokenDamageMultiplier
    };
  }

  private clampShipStat(key: DebugShipStatKey, value: number): number {
    return Number(Math.max(SHIP_STAT_MIN[key], value).toFixed(key === 'mass' || key === 'hitRadius' ? 2 : 1));
  }

  private clampWeaponStat(key: DebugWeaponStatKey, value: number): number {
    const clamped = Math.max(WEAPON_STAT_MIN[key], value);
    return INTEGER_WEAPON_STATS.has(key) ? Math.round(clamped) : Number(clamped.toFixed(2));
  }

  private clampScale(value: number): number {
    return Number(Math.min(DEBUG_PHYSICS_SCALE_MAX, Math.max(DEBUG_PHYSICS_SCALE_MIN, value)).toFixed(2));
  }

  private clampExponent(value: number): number {
    return Number(Math.min(DEBUG_PHYSICS_EXPONENT_MAX, Math.max(DEBUG_PHYSICS_EXPONENT_MIN, value)).toFixed(2));
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
}
