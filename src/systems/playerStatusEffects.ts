export type PlayerStatusEffectKind = 'frost' | 'electric';

export interface EnemyStatusEffect {
  kind: PlayerStatusEffectKind;
  durationMs: number;
  intensity?: number;
  damagePerSecond?: number;
  tickMs?: number;
  accelerationDrag?: number;
}

export interface PlayerStatusEffectRuntime {
  frostUntil: number;
  frostIntensity: number;
  electricUntil: number;
  electricIntensity: number;
  electricDamagePerSecond: number;
  electricTickMs: number;
  nextElectricTickAt: number;
  electricAccelerationDrag: number;
}

export interface PlayerStatusMovementModifiers {
  accelerationScale: number;
  turnScale: number;
  velocityLimitScale: number;
}

const DEFAULT_ELECTRIC_TICK_MS = 500;
const DEFAULT_ELECTRIC_DAMAGE_PER_SECOND = 4;
const DEFAULT_ELECTRIC_ACCELERATION_DRAG = 0.16;
const MAX_STATUS_INTENSITY = 2;

export function createPlayerStatusEffectRuntime(): PlayerStatusEffectRuntime {
  return {
    frostUntil: 0,
    frostIntensity: 0,
    electricUntil: 0,
    electricIntensity: 0,
    electricDamagePerSecond: 0,
    electricTickMs: DEFAULT_ELECTRIC_TICK_MS,
    nextElectricTickAt: 0,
    electricAccelerationDrag: DEFAULT_ELECTRIC_ACCELERATION_DRAG
  };
}

export function applyPlayerStatusEffects(
  runtime: PlayerStatusEffectRuntime,
  effects: readonly EnemyStatusEffect[] | undefined,
  time: number
): void {
  if (!effects || effects.length === 0) {
    return;
  }

  for (const effect of effects) {
    const durationMs = Math.max(0, effect.durationMs);
    if (durationMs <= 0) {
      continue;
    }

    const intensity = normalizeStatusIntensity(effect.intensity);
    const expiresAt = time + durationMs;

    if (effect.kind === 'frost') {
      runtime.frostUntil = Math.max(runtime.frostUntil, expiresAt);
      runtime.frostIntensity = Math.max(runtime.frostIntensity, intensity);
      continue;
    }

    runtime.electricUntil = Math.max(runtime.electricUntil, expiresAt);
    runtime.electricIntensity = Math.max(runtime.electricIntensity, intensity);
    runtime.electricDamagePerSecond = Math.max(
      runtime.electricDamagePerSecond,
      effect.damagePerSecond ?? DEFAULT_ELECTRIC_DAMAGE_PER_SECOND
    );
    runtime.electricTickMs = clampFinite(effect.tickMs, runtime.electricTickMs, 120, 2000);
    runtime.electricAccelerationDrag = clampFinite(
      effect.accelerationDrag,
      runtime.electricAccelerationDrag,
      0,
      0.6
    );

    if (runtime.nextElectricTickAt <= time || runtime.nextElectricTickAt > runtime.electricUntil) {
      runtime.nextElectricTickAt = time + runtime.electricTickMs;
    }
  }
}

export function updatePlayerStatusEffects(input: {
  runtime: PlayerStatusEffectRuntime;
  time: number;
  applyDamage?: (damage: number) => void;
  maxElectricTicks?: number;
}): number {
  const runtime = input.runtime;
  if (input.time > runtime.frostUntil) {
    runtime.frostIntensity = 0;
  }

  if (input.time > runtime.electricUntil) {
    runtime.electricIntensity = 0;
    runtime.electricDamagePerSecond = 0;
    runtime.nextElectricTickAt = 0;
    runtime.electricTickMs = DEFAULT_ELECTRIC_TICK_MS;
    runtime.electricAccelerationDrag = DEFAULT_ELECTRIC_ACCELERATION_DRAG;
    return 0;
  }

  if (runtime.electricIntensity <= 0 || runtime.electricDamagePerSecond <= 0 || runtime.nextElectricTickAt <= 0) {
    return 0;
  }

  let appliedDamage = 0;
  let ticks = 0;
  const maxTicks = Math.max(1, input.maxElectricTicks ?? 6);
  while (input.time >= runtime.nextElectricTickAt && runtime.nextElectricTickAt <= runtime.electricUntil && ticks < maxTicks) {
    const damage = runtime.electricDamagePerSecond * runtime.electricIntensity * (runtime.electricTickMs / 1000);
    appliedDamage += damage;
    input.applyDamage?.(damage);
    runtime.nextElectricTickAt += runtime.electricTickMs;
    ticks += 1;
  }

  return appliedDamage;
}

export function resolvePlayerStatusMovementModifiers(
  runtime: PlayerStatusEffectRuntime,
  time: number
): PlayerStatusMovementModifiers {
  const frostIntensity = time <= runtime.frostUntil ? runtime.frostIntensity : 0;
  const electricIntensity = time <= runtime.electricUntil ? runtime.electricIntensity : 0;
  const frostSlow = PhaserMathClamp(0.46 * frostIntensity, 0, 0.68);
  const electricDrag = PhaserMathClamp(runtime.electricAccelerationDrag * electricIntensity, 0, 0.6);

  return {
    accelerationScale: Math.max(0.22, (1 - frostSlow) * (1 - electricDrag)),
    turnScale: Math.max(0.3, 1 - frostSlow * 0.72),
    velocityLimitScale: Math.max(0.35, 1 - frostSlow * 0.5)
  };
}

export function getActivePlayerStatusKinds(
  runtime: PlayerStatusEffectRuntime,
  time: number
): PlayerStatusEffectKind[] {
  const active: PlayerStatusEffectKind[] = [];
  if (time <= runtime.frostUntil && runtime.frostIntensity > 0) {
    active.push('frost');
  }

  if (time <= runtime.electricUntil && runtime.electricIntensity > 0) {
    active.push('electric');
  }

  return active;
}

function normalizeStatusIntensity(value: unknown): number {
  return clampFinite(value, 1, 0.05, MAX_STATUS_INTENSITY);
}

function clampFinite(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numberValue));
}

function PhaserMathClamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
