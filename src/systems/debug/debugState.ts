import type { BlackHolePngLayerDebugSummary, BlackHolePngTextureKey } from '../blackHole';
import type { DebugMenuValues } from './debugTypes';

const DEBUG_PULSE_DAMAGE_MULTIPLIER_MIN = 1;
const DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MIN = 0.1;
const DEBUG_PULSE_COOLDOWN_MIN_SECONDS = 0.01;

export class DebugState {
  collisionDebugEnabled = false;
  enemySpawningEnabled = true;
  asteroidSpawningEnabled = false;
  playerInvulnerable = false;
  showBlackHoleRadii = false;
  blackHoleFieldDamageEnabled = true;
  debugGamePaused = false;
  pulseDamageMultiplier = 1;
  pulseFireRateMultiplier = 1;

  resetForRun(): void {
    this.enemySpawningEnabled = true;
    this.asteroidSpawningEnabled = false;
    this.playerInvulnerable = false;
    this.showBlackHoleRadii = false;
    this.blackHoleFieldDamageEnabled = true;
    this.debugGamePaused = false;
    this.pulseDamageMultiplier = 1;
    this.pulseFireRateMultiplier = 1;
  }

  adjustPulseDamageMultiplier(delta: number): void {
    this.pulseDamageMultiplier = Number(Math.max(DEBUG_PULSE_DAMAGE_MULTIPLIER_MIN, this.pulseDamageMultiplier + delta).toFixed(1));
  }

  adjustPulseFireRateMultiplier(delta: number): void {
    this.pulseFireRateMultiplier = Number(
      Math.max(DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MIN, this.pulseFireRateMultiplier + delta).toFixed(1)
    );
  }

  adjustPulseCooldownSeconds(baseCooldownSeconds: number, currentCooldownSeconds: number, deltaSeconds: number): void {
    const nextCooldownSeconds = Math.max(DEBUG_PULSE_COOLDOWN_MIN_SECONDS, currentCooldownSeconds + deltaSeconds);

    this.pulseFireRateMultiplier = Number(
      Math.max(DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MIN, baseCooldownSeconds / nextCooldownSeconds).toFixed(2)
    );
  }

  resetWeaponTuning(): void {
    this.pulseDamageMultiplier = 1;
    this.pulseFireRateMultiplier = 1;
  }

  createMenuValues(snapshot: {
    pulseCooldownSeconds: number;
    backgroundStarsVisible: boolean;
    starfieldFarParallax: number;
    starfieldMidParallax: number;
    starfieldNearParallax: number;
    blackHoleLensOrbitSpeedMultiplier: number;
    blackHoleLensDensity: number;
    blackHoleLensLengthMultiplier: number;
    blackHoleFieldScaleMultiplier: number;
    blackHoleRadialStrengthMultiplier: number;
    blackHoleSwirlStrengthMultiplier: number;
    blackHoleMassResistanceMultiplier: number;
    blackHoleMaxVelocityMultiplier: number;
    blackHoleProjectionLensLayersEnabled: boolean;
    blackHoleSelectedPngLayerIndex: number;
    blackHolePngLayerCount: number;
    blackHoleSelectedPngLayer?: BlackHolePngLayerDebugSummary;
    blackHoleAddPngTextureKey: BlackHolePngTextureKey;
    blackHoleAddPngTextureLabel: string;
    debugGamePaused: boolean;
    activeEnemies: number;
    activeAsteroids: number;
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
      pulseDamageMultiplier: this.pulseDamageMultiplier,
      pulseFireRateMultiplier: this.pulseFireRateMultiplier,
      pulseCooldownSeconds: snapshot.pulseCooldownSeconds,
      backgroundStarsVisible: snapshot.backgroundStarsVisible,
      starfieldFarParallax: snapshot.starfieldFarParallax,
      starfieldMidParallax: snapshot.starfieldMidParallax,
      starfieldNearParallax: snapshot.starfieldNearParallax,
      blackHoleLensOrbitSpeedMultiplier: snapshot.blackHoleLensOrbitSpeedMultiplier,
      blackHoleLensDensity: snapshot.blackHoleLensDensity,
      blackHoleLensLengthMultiplier: snapshot.blackHoleLensLengthMultiplier,
      blackHoleFieldScaleMultiplier: snapshot.blackHoleFieldScaleMultiplier,
      blackHoleRadialStrengthMultiplier: snapshot.blackHoleRadialStrengthMultiplier,
      blackHoleSwirlStrengthMultiplier: snapshot.blackHoleSwirlStrengthMultiplier,
      blackHoleMassResistanceMultiplier: snapshot.blackHoleMassResistanceMultiplier,
      blackHoleMaxVelocityMultiplier: snapshot.blackHoleMaxVelocityMultiplier,
      blackHoleProjectionLensLayersEnabled: snapshot.blackHoleProjectionLensLayersEnabled,
      blackHoleSelectedPngLayerIndex: snapshot.blackHoleSelectedPngLayerIndex,
      blackHolePngLayerCount: snapshot.blackHolePngLayerCount,
      blackHoleSelectedPngLayer: snapshot.blackHoleSelectedPngLayer,
      blackHoleAddPngTextureKey: snapshot.blackHoleAddPngTextureKey,
      blackHoleAddPngTextureLabel: snapshot.blackHoleAddPngTextureLabel,
      debugGamePaused: snapshot.debugGamePaused,
      activeEnemies: snapshot.activeEnemies,
      activeAsteroids: snapshot.activeAsteroids,
      playerProjectiles: snapshot.playerProjectiles,
      enemyProjectiles: snapshot.enemyProjectiles,
      playerHull: snapshot.playerHull,
      playerMaxHull: snapshot.playerMaxHull,
      spawnDirectorSummary: `Spawner ${this.enemySpawningEnabled ? 'on' : 'off'} / next ${snapshot.nextEnemySpawnSeconds.toFixed(1)}s`
    };
  }
}
