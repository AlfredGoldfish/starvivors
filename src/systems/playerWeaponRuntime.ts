import type Phaser from 'phaser';
import type { WeaponRegistryEntry } from '../data/weapons';
import type { PlayerWeaponRuntimeState } from './playerWeapons';
import type { ResolvedBeamWeaponStats } from './weaponStats';

export type PlayerWeaponRuntimeSlot = 'auto' | 'primary' | 'secondary';

export interface BeamSlotRuntimeState {
  graphics?: Phaser.GameObjects.Graphics;
  isActive: boolean;
  heat: number;
  overheated: boolean;
  activationStartedAt: number;
  nextTickAt: number;
  lastSparkAt: number;
  lastVentAt: number;
  visualLength: number;
  contactSparkBurstsEmitted: number;
}

export interface ActivePlayerWeaponRuntimeInput {
  state: PlayerWeaponRuntimeState;
  time: number;
  deltaSeconds: number;
  isPlayerDead: boolean;
  isUpgradeOverlayOpen: boolean;
  isPrimaryFiring: boolean;
  isSecondaryFiring: boolean;
  isSecondaryBlocked: boolean;
  getActiveAutoWeapon: () => WeaponRegistryEntry | undefined;
  getActivePrimaryWeapon: () => WeaponRegistryEntry | undefined;
  getActiveSecondaryWeapon: () => WeaponRegistryEntry | undefined;
  updateBeamSlotsInactive: (deltaSeconds: number) => void;
  updateBeamSlotInactive: (slot: PlayerWeaponRuntimeSlot, deltaSeconds: number) => void;
  updateBeamWeapon: (
    weapon: WeaponRegistryEntry,
    slot: PlayerWeaponRuntimeSlot,
    isFiring: boolean,
    time: number,
    deltaSeconds: number
  ) => void;
  useWeapon: (weapon: WeaponRegistryEntry, slot: PlayerWeaponRuntimeSlot, time: number) => { cooldownMs: number };
}

export interface BeamWeaponRuntimeInput {
  runtime: BeamSlotRuntimeState;
  beam: ResolvedBeamWeaponStats | undefined;
  isFiring: boolean;
  time: number;
  deltaSeconds: number;
  ignitionDurationMs: number;
  coolBeamSlot: (runtime: BeamSlotRuntimeState, beam: ResolvedBeamWeaponStats, deltaSeconds: number) => void;
  hideBeam: () => void;
  emitIgnitionBurst: (beam: ResolvedBeamWeaponStats) => void;
  drawBeam: (beam: ResolvedBeamWeaponStats, time: number) => void;
  applyBeamTick: (beam: ResolvedBeamWeaponStats, activeRange: number, time: number) => void;
  emitOverheatVent: () => void;
}

export function updateActivePlayerWeaponRuntime(input: ActivePlayerWeaponRuntimeInput): void {
  if (input.isPlayerDead || input.isUpgradeOverlayOpen) {
    input.updateBeamSlotsInactive(input.deltaSeconds);
    return;
  }

  const activeAutoWeapon = input.getActiveAutoWeapon();
  if (activeAutoWeapon?.behaviorType === 'beam') {
    input.updateBeamWeapon(activeAutoWeapon, 'auto', true, input.time, input.deltaSeconds);
  } else {
    input.updateBeamSlotInactive('auto', input.deltaSeconds);
  }
  if (activeAutoWeapon && activeAutoWeapon.behaviorType !== 'beam' && input.time >= input.state.nextAutoWeaponFireAt) {
    const result = input.useWeapon(activeAutoWeapon, 'auto', input.time);
    input.state.nextAutoWeaponFireAt = input.time + result.cooldownMs;
  }

  const primaryWeapon = input.getActivePrimaryWeapon();
  if (primaryWeapon?.behaviorType === 'beam') {
    input.updateBeamWeapon(primaryWeapon, 'primary', input.isPrimaryFiring, input.time, input.deltaSeconds);
  } else {
    input.updateBeamSlotInactive('primary', input.deltaSeconds);
  }
  if (
    primaryWeapon &&
    primaryWeapon.behaviorType !== 'beam' &&
    input.isPrimaryFiring &&
    input.time >= input.state.nextPrimaryWeaponFireAt
  ) {
    const result = input.useWeapon(primaryWeapon, 'primary', input.time);
    input.state.nextPrimaryWeaponFireAt = input.time + result.cooldownMs;
  }

  const secondaryWeapon = input.getActiveSecondaryWeapon();
  const isSecondaryFiring = Boolean(secondaryWeapon && !input.isSecondaryBlocked && input.isSecondaryFiring);
  if (secondaryWeapon?.behaviorType === 'beam') {
    input.updateBeamWeapon(secondaryWeapon, 'secondary', isSecondaryFiring, input.time, input.deltaSeconds);
  } else {
    input.updateBeamSlotInactive('secondary', input.deltaSeconds);
  }
  if (
    secondaryWeapon &&
    secondaryWeapon.behaviorType !== 'beam' &&
    isSecondaryFiring &&
    input.time >= input.state.nextSecondaryWeaponFireAt
  ) {
    const result = input.useWeapon(secondaryWeapon, 'secondary', input.time);
    input.state.nextSecondaryWeaponFireAt = input.time + result.cooldownMs;
  }
}

export function updateBeamWeaponRuntime(input: BeamWeaponRuntimeInput): void {
  const beam = input.beam;
  const runtime = input.runtime;

  if (!beam) {
    input.hideBeam();
    return;
  }

  if (!input.isFiring || runtime.overheated) {
    runtime.isActive = false;
    input.coolBeamSlot(runtime, beam, input.deltaSeconds);
    runtime.visualLength = Math.max(0, runtime.visualLength - beam.range * input.deltaSeconds * 8);
    input.hideBeam();
    return;
  }

  if (!runtime.isActive) {
    runtime.activationStartedAt = input.time;
    runtime.nextTickAt = input.time;
    input.emitIgnitionBurst(beam);
  }

  runtime.isActive = true;
  runtime.heat = Math.min(beam.heatMax, runtime.heat + beam.heatGainPerSecond * input.deltaSeconds);
  if (runtime.heat >= beam.heatMax) {
    runtime.overheated = true;
    runtime.isActive = false;
    runtime.lastVentAt = input.time;
    input.hideBeam();
    input.emitOverheatVent();
    return;
  }

  runtime.visualLength = getBeamVisualLength(runtime, beam, input.time, input.ignitionDurationMs);
  input.drawBeam(beam, input.time);
  while (input.time >= runtime.nextTickAt) {
    input.applyBeamTick(beam, runtime.visualLength, input.time);
    runtime.nextTickAt = Math.max(runtime.nextTickAt + beam.tickIntervalMs, input.time + beam.tickIntervalMs);
  }
}

export function coolBeamSlotRuntime(
  runtime: BeamSlotRuntimeState,
  beam: ResolvedBeamWeaponStats,
  deltaSeconds: number
): void {
  const cooling = runtime.overheated ? beam.overheatCoolingPerSecond : beam.coolingPerSecond;
  runtime.heat = Math.max(0, runtime.heat - cooling * deltaSeconds);
  if (runtime.heat <= 0) {
    runtime.overheated = false;
  }
}

export function getBeamVisualLength(
  runtime: BeamSlotRuntimeState,
  beam: ResolvedBeamWeaponStats,
  time: number,
  ignitionDurationMs: number
): number {
  const progress = Math.min(1, Math.max(0, (time - runtime.activationStartedAt) / ignitionDurationMs));
  const eased = 1 - Math.pow(1 - progress, 3);
  return beam.range * eased;
}
