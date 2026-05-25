import Phaser from 'phaser';
import type { BlackHoleFieldTuningConfig, BlackHoleVacuumTuning } from '../systems/blackHole';
import { createEncounterDirectorState, type EncounterDirectorState } from '../systems/encounterDirector';
import type { RewardHookId } from '../systems/progressionStorage';

export type GameSceneRunEndReason = 'none' | 'death' | 'eject' | 'mission';
export type GameSceneWeaponRuntimeSlot = 'auto' | 'primary' | 'secondary';

export interface GameSceneBeamSlotRuntime {
  heat: number;
  overheated: boolean;
  nextTickAt: number;
  graphics?: Phaser.GameObjects.Graphics;
  isActive: boolean;
  activationStartedAt: number;
  visualLength: number;
  lastSparkAt: number;
  contactSparkBurstsEmitted: number;
  lastVentAt: number;
}

export interface RunRewardResetState {
  runScrapTotal: number;
  runScrapSpent: number;
  lastRunCreditsEarned: number;
  lastRunScrapSpent: number;
  lastRunScrapConverted: number;
  lastRunUnlockedRewards: RewardHookId[];
  hasPaidRunCredits: boolean;
  lastRunSurvivalMs: number;
}

export interface RunProgressResetState {
  playerInvulnerableUntil: number;
  isPlayerDead: boolean;
  runEndReason: GameSceneRunEndReason;
  playerXp: number;
  nextXpThreshold: number;
  bankedUpgrades: number;
  pendingRareUpgrades: number;
  rerollsThisRun: number;
}

export interface RunCounterResetState {
  asteroidCameraViewCount: number;
  asteroidWrappedViewCount: number;
  asteroidWrapMirrorCount: number;
  nextForwardThrusterAt: number;
  nextReverseThrusterAt: number;
  nextLeftStrafeThrusterAt: number;
  nextRightStrafeThrusterAt: number;
  nextDebugUpdateAt: number;
  nextPlayerContactImpulseAt: number;
  playerBodyImpactCooldowns: WeakMap<object, number>;
  asteroidCollisionCooldowns: WeakMap<object, WeakMap<object, number>>;
}

export interface PulseRuntimeResetState {
  pulseVolleyCount: number;
  isPulseEmergencyCharged: boolean;
  pulseLifestealWindowStartedAt: number;
  pulseLifestealRestoredThisWindow: number;
  pulseIonizedTargets: WeakMap<object, number>;
  pulseCriticalTargets: WeakMap<object, { stacks: number; expiresAt: number }>;
}

export interface EncounterTimingResetState {
  runStartedAt: number;
  nextEnemySpawnAt: number;
  encounterDirectorState: EncounterDirectorState;
}

export interface OverlayPauseResetState {
  isUpgradeOverlayOpen: boolean;
  isPauseMenuOpen: boolean;
  upgradeOverlayOpenedAt: number;
  pauseMenuOpenedAt: number;
  totalUpgradePauseMs: number;
  totalPauseMenuPauseMs: number;
  debugMenuOpenedAt: number;
  totalDebugPauseMs: number;
}

export interface BlackHoleDebugResetState {
  influenceRadiusScale: number;
  damageRadiusScale: number;
  visualScale: number;
  coreScale: number;
  fieldTuning: BlackHoleFieldTuningConfig;
  vacuumTuning: BlackHoleVacuumTuning;
  playerCaptureEnabled: boolean;
  objectConsumptionEnabled: boolean;
  warningVisualsEnabled: boolean;
  playerCaptureStartedAt: number | null;
  consumedObjectsThisRun: number;
  growthOffsetMs: number;
}

export function createBeamSlotRuntime(): GameSceneBeamSlotRuntime {
  return {
    heat: 0,
    overheated: false,
    nextTickAt: 0,
    isActive: false,
    activationStartedAt: 0,
    visualLength: 0,
    lastSparkAt: 0,
    contactSparkBurstsEmitted: 0,
    lastVentAt: 0
  };
}

export function createBeamSlots(): Record<GameSceneWeaponRuntimeSlot, GameSceneBeamSlotRuntime> {
  return {
    auto: createBeamSlotRuntime(),
    primary: createBeamSlotRuntime(),
    secondary: createBeamSlotRuntime()
  };
}

export function createRunRewardResetState(): RunRewardResetState {
  return {
    runScrapTotal: 0,
    runScrapSpent: 0,
    lastRunCreditsEarned: 0,
    lastRunScrapSpent: 0,
    lastRunScrapConverted: 0,
    lastRunUnlockedRewards: [],
    hasPaidRunCredits: false,
    lastRunSurvivalMs: 0
  };
}

export function createRunProgressResetState(nextXpThreshold: number): RunProgressResetState {
  return {
    playerInvulnerableUntil: 0,
    isPlayerDead: false,
    runEndReason: 'none',
    playerXp: 0,
    nextXpThreshold,
    bankedUpgrades: 0,
    pendingRareUpgrades: 0,
    rerollsThisRun: 0
  };
}

export function createRunCounterResetState(): RunCounterResetState {
  return {
    asteroidCameraViewCount: 0,
    asteroidWrappedViewCount: 0,
    asteroidWrapMirrorCount: 0,
    nextForwardThrusterAt: 0,
    nextReverseThrusterAt: 0,
    nextLeftStrafeThrusterAt: 0,
    nextRightStrafeThrusterAt: 0,
    nextDebugUpdateAt: 0,
    nextPlayerContactImpulseAt: 0,
    playerBodyImpactCooldowns: new WeakMap<object, number>(),
    asteroidCollisionCooldowns: new WeakMap<object, WeakMap<object, number>>()
  };
}

export function createPulseRuntimeResetState(): PulseRuntimeResetState {
  return {
    pulseVolleyCount: 0,
    isPulseEmergencyCharged: false,
    pulseLifestealWindowStartedAt: 0,
    pulseLifestealRestoredThisWindow: 0,
    pulseIonizedTargets: new WeakMap<object, number>(),
    pulseCriticalTargets: new WeakMap<object, { stacks: number; expiresAt: number }>()
  };
}

export function createEncounterTimingResetState(input: {
  runStartedAt: number;
  enemySpawnInitialDelayMs: number;
  enemySwarmFirstSpawnMs: number;
}): EncounterTimingResetState {
  return {
    runStartedAt: input.runStartedAt,
    nextEnemySpawnAt: input.runStartedAt + input.enemySpawnInitialDelayMs,
    encounterDirectorState: createEncounterDirectorState(input.runStartedAt + input.enemySwarmFirstSpawnMs)
  };
}

export function createOverlayPauseResetState(): OverlayPauseResetState {
  return {
    isUpgradeOverlayOpen: false,
    isPauseMenuOpen: false,
    upgradeOverlayOpenedAt: 0,
    pauseMenuOpenedAt: 0,
    totalUpgradePauseMs: 0,
    totalPauseMenuPauseMs: 0,
    debugMenuOpenedAt: 0,
    totalDebugPauseMs: 0
  };
}

export function createBlackHoleDebugResetState(input: {
  radiusScaleDefault: number;
  fieldTuning: BlackHoleFieldTuningConfig;
  vacuumTuning: BlackHoleVacuumTuning;
}): BlackHoleDebugResetState {
  return {
    influenceRadiusScale: input.radiusScaleDefault,
    damageRadiusScale: input.radiusScaleDefault,
    visualScale: input.radiusScaleDefault,
    coreScale: input.radiusScaleDefault,
    fieldTuning: { ...input.fieldTuning },
    vacuumTuning: { ...input.vacuumTuning },
    playerCaptureEnabled: true,
    objectConsumptionEnabled: true,
    warningVisualsEnabled: true,
    playerCaptureStartedAt: null,
    consumedObjectsThisRun: 0,
    growthOffsetMs: 0
  };
}
