import type { BlackHolePngLayerDebugSummary, BlackHolePngTextureKey } from '../blackHole';
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
      rammingShieldHp: snapshot.rammingShieldHp,
      rammingShieldMaxHp: snapshot.rammingShieldMaxHp,
      rammingShieldDashCharges: snapshot.rammingShieldDashCharges,
      rammingShieldDashMaxCharges: snapshot.rammingShieldDashMaxCharges,
      spawnDirectorSummary: `Spawner ${this.enemySpawningEnabled ? 'on' : 'off'} / next ${snapshot.nextEnemySpawnSeconds.toFixed(1)}s`
    };
  }

  private clampScale(value: number): number {
    return Number(Math.min(DEBUG_PHYSICS_SCALE_MAX, Math.max(DEBUG_PHYSICS_SCALE_MIN, value)).toFixed(2));
  }

  private clampExponent(value: number): number {
    return Number(Math.min(DEBUG_PHYSICS_EXPONENT_MAX, Math.max(DEBUG_PHYSICS_EXPONENT_MIN, value)).toFixed(2));
  }
}
