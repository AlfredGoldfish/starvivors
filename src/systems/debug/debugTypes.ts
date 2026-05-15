import type { BlackHoleRingDebugColorMode } from '../blackHole';

export type DebugEnemyType = 'chaser' | 'shooter' | 'tank';
export type DebugAsteroidTier = 1 | 2 | 3 | 4 | 5;

export interface DebugMenuValues {
  enemySpawningEnabled: boolean;
  asteroidSpawningAvailable: boolean;
  asteroidSpawningEnabled: boolean;
  playerInvulnerable: boolean;
  collisionDebugEnabled: boolean;
  blackHoleRadiiVisible: boolean;
  blackHoleRingDebugColorMode: BlackHoleRingDebugColorMode;
  pulseDamageMultiplier: number;
  pulseFireRateMultiplier: number;
  pulseCooldownSeconds: number;
  starfieldFarParallax: number;
  starfieldMidParallax: number;
  starfieldNearParallax: number;
  blackHoleLensOrbitSpeedMultiplier: number;
  blackHoleLensDensity: number;
  blackHoleLensLengthMultiplier: number;
  blackHoleFieldScaleMultiplier: number;
  blackHoleProjectionLensLayersEnabled: boolean;
  activeEnemies: number;
  activeAsteroids: number;
  playerProjectiles: number;
  enemyProjectiles: number;
  playerHull: number;
  playerMaxHull: number;
  spawnDirectorSummary: string;
}

export interface DebugMenuCallbacks {
  close: () => void;
  toggleEnemySpawning: () => void;
  spawnEnemy: (type: DebugEnemyType) => void;
  clearEnemies: () => void;
  toggleAsteroidSpawning: () => void;
  spawnAsteroid: (tier: DebugAsteroidTier) => void;
  clearAsteroids: () => void;
  clearPlayerProjectiles: () => void;
  clearEnemyProjectiles: () => void;
  restorePlayerHull: () => void;
  togglePlayerInvulnerability: () => void;
  killPlayer: () => void;
  adjustPulseDamage: (delta: number) => void;
  adjustPulseFireRate: (delta: number) => void;
  adjustPulseCooldownSeconds: (deltaSeconds: number) => void;
  resetWeaponTuning: () => void;
  adjustStarfieldParallax: (layer: 'far' | 'mid' | 'near', direction: number) => void;
  resetStarfieldParallax: () => void;
  cycleBlackHoleRingDebugColor: () => void;
  toggleBlackHoleRadii: () => void;
  toggleCollisionDebug: () => void;
  adjustBlackHoleLensOrbit: (delta: number) => void;
  adjustBlackHoleLensDensity: (delta: number) => void;
  adjustBlackHoleLensLength: (delta: number) => void;
  adjustBlackHoleFieldScale: (delta: number) => void;
  toggleBlackHoleProjectionLenses: () => void;
  resetBlackHoleLensTuning: () => void;
}
