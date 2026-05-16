import type { BlackHolePngLayerDebugSummary, BlackHolePngTextureKey } from '../blackHole';
import type { DebugMenuValues } from './debugTypes';

const DEBUG_WEAPON_DAMAGE_MULTIPLIER_MIN = 1;
const DEBUG_WEAPON_FIRE_RATE_MULTIPLIER_MIN = 0.1;
const DEBUG_WEAPON_COOLDOWN_MIN_SECONDS = 0.01;

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

  createMenuValues(snapshot: {
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
    nextEnemySpawnSeconds: number;
  }): DebugMenuValues {
    return {
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
      spawnDirectorSummary: `Spawner ${this.enemySpawningEnabled ? 'on' : 'off'} / next ${snapshot.nextEnemySpawnSeconds.toFixed(1)}s`
    };
  }
}
