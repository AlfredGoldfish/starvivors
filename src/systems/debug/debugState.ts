import Phaser from 'phaser';
import type { BlackHoleRingDebugColorMode } from '../blackHole';
import type { DebugMenuValues } from './debugTypes';

const DEBUG_PULSE_DAMAGE_MULTIPLIER_MIN = 1;
const DEBUG_PULSE_DAMAGE_MULTIPLIER_MAX = 10;
const DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MIN = 1;
const DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MAX = 12.5;

export class DebugState {
  collisionDebugEnabled = false;
  enemySpawningEnabled = true;
  asteroidSpawningEnabled = false;
  playerInvulnerable = false;
  showBlackHoleRadii = false;
  pulseDamageMultiplier = 1;
  pulseFireRateMultiplier = 1;
  blackHoleRingDebugColorMode: BlackHoleRingDebugColorMode = 'normal';

  resetForRun(): void {
    this.enemySpawningEnabled = true;
    this.asteroidSpawningEnabled = false;
    this.playerInvulnerable = false;
    this.showBlackHoleRadii = false;
    this.pulseDamageMultiplier = 1;
    this.pulseFireRateMultiplier = 1;
    this.blackHoleRingDebugColorMode = 'normal';
  }

  adjustPulseDamageMultiplier(delta: number): void {
    this.pulseDamageMultiplier = Number(
      Phaser.Math.Clamp(
        this.pulseDamageMultiplier + delta,
        DEBUG_PULSE_DAMAGE_MULTIPLIER_MIN,
        DEBUG_PULSE_DAMAGE_MULTIPLIER_MAX
      ).toFixed(1)
    );
  }

  adjustPulseFireRateMultiplier(delta: number): void {
    this.pulseFireRateMultiplier = Number(
      Phaser.Math.Clamp(
        this.pulseFireRateMultiplier + delta,
        DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MIN,
        DEBUG_PULSE_FIRE_RATE_MULTIPLIER_MAX
      ).toFixed(1)
    );
  }

  resetWeaponTuning(): void {
    this.pulseDamageMultiplier = 1;
    this.pulseFireRateMultiplier = 1;
  }

  cycleBlackHoleRingDebugColorMode(): void {
    const modes: BlackHoleRingDebugColorMode[] = ['normal', 'red', 'green', 'cyan', 'white'];
    const currentIndex = modes.indexOf(this.blackHoleRingDebugColorMode);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % modes.length;

    this.blackHoleRingDebugColorMode = modes[nextIndex];
  }

  createMenuValues(snapshot: {
    pulseCooldownSeconds: number;
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
      blackHoleRingDebugColorMode: this.blackHoleRingDebugColorMode,
      pulseDamageMultiplier: this.pulseDamageMultiplier,
      pulseFireRateMultiplier: this.pulseFireRateMultiplier,
      pulseCooldownSeconds: snapshot.pulseCooldownSeconds,
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
