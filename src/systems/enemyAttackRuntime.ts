import {
  getEnemyAttackDefinition,
  normalizeAttackLoadoutSlots,
  resolveAttackLoadoutSlotParams,
  type AttackEffectRecipe,
  type AttackHostKind,
  type AttackLoadoutSlot,
  type AttackTargetKind,
  type AttackTelegraphRecipe,
  type EnemyAttackDefinition,
  type EnemyAttackId,
  type EnemyAttackParamValue
} from '../data/enemyAttackDefinitions';

export type AttackRuntimePhase = 'idle' | 'windup' | 'channel' | 'active' | 'recovery';
export type AttackRuntimeReadabilityMode = 'normal' | 'color-safe' | 'high-contrast';
export type AttackRuntimeBeat = 'tracking' | 'lock' | 'anticipation' | 'channel' | 'resolve' | 'impact';

export interface AttackVectorLike {
  x: number;
  y: number;
}

export interface AttackBodyLike {
  x: number;
  y: number;
  rotation?: number;
}

export interface AttackTargetSnapshot {
  id: string;
  kind: AttackTargetKind;
  x: number;
  y: number;
  radius: number;
  velocity?: AttackVectorLike;
  hp?: number;
  maxHp?: number;
  label?: string;
}

export interface AttackSlotRuntime {
  slot: AttackLoadoutSlot;
  definition: EnemyAttackDefinition;
  nextReadyAt: number;
  phase: AttackRuntimePhase;
  phaseStartedAt: number;
  target?: AttackTargetSnapshot;
  queuedAt?: number;
  executedInPhase: boolean;
  pendingImpacts: AttackPendingImpact[];
  lastTelegraphAt: number;
  lastTickAt: number;
  lastRetargetAt: number;
}

export interface AttackHostRuntime {
  hostKind: AttackHostKind;
  hostId: string;
  definitionId: string;
  body: AttackBodyLike;
  velocity: AttackVectorLike;
  attacks: AttackSlotRuntime[];
  manualTriggerOnly?: boolean;
}

export interface AttackProjectileRequest {
  sourceHostId: string;
  ownerKind: AttackHostKind;
  attackId: EnemyAttackId;
  x: number;
  y: number;
  direction: AttackVectorLike;
  speed: number;
  damage: number;
  range: number;
  radius: number;
  color: number;
  target?: AttackTargetSnapshot;
  statuses?: AttackStatusRequest[];
}

export interface AttackAreaDamageRequest {
  sourceHostId: string;
  ownerKind: AttackHostKind;
  attackId: EnemyAttackId;
  beat?: AttackRuntimeBeat;
  targetKind: AttackTargetKind;
  shape: 'circle' | 'line';
  x: number;
  y: number;
  radius?: number;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  width?: number;
  damage: number;
  statuses?: AttackStatusRequest[];
}

export interface AttackStatusRequest {
  kind: 'frost' | 'electric' | 'slow';
  durationMs: number;
  intensity?: number;
  knockback?: number;
  damagePerSecond?: number;
  tickMs?: number;
  accelerationDrag?: number;
}

export interface AttackSummonRequest {
  sourceHostId: string;
  ownerKind: AttackHostKind;
  attackId: EnemyAttackId;
  definitionId: string;
  count: number;
  x: number;
  y: number;
  radius: number;
}

export interface AttackHealRequest {
  sourceHostId: string;
  targetId: string;
  amount: number;
}

export interface AttackBuffRequest {
  sourceHostId: string;
  radius: number;
  speedMultiplier?: number;
  fireRateMultiplier?: number;
  damageMultiplier?: number;
  durationMs: number;
}

export interface AttackShieldRequest {
  sourceHostId: string;
  radius: number;
  reduction: number;
  durationMs: number;
  reflect: boolean;
  arcDegrees: number;
}

export interface AttackScrapStealRequest {
  sourceHostId: string;
  range: number;
  pickupRange: number;
  bonusScrap: number;
}

export interface AttackVisualRequest {
  sourceHostId: string;
  ownerKind: AttackHostKind;
  attackId: EnemyAttackId;
  phase: AttackRuntimePhase;
  beat?: AttackRuntimeBeat;
  x: number;
  y: number;
  direction: AttackVectorLike;
  target?: AttackTargetSnapshot;
  telegraph?: AttackTelegraphRecipe;
  effect?: AttackEffectRecipe;
  params?: Record<string, EnemyAttackParamValue>;
  progress: number;
  durationMs: number;
}

export type AttackRuntimeEvent =
  | { type: 'phase-start'; attackId: EnemyAttackId; slotIndex: number; phase: AttackRuntimePhase }
  | { type: 'execute'; attackId: EnemyAttackId; slotIndex: number }
  | { type: 'skip-no-target'; attackId: EnemyAttackId; slotIndex: number };

export interface UpdateAttackHostRuntimeInput {
  host: AttackHostRuntime;
  time: number;
  deltaSeconds: number;
  targets: AttackTargetSnapshot[];
  pointTarget?: AttackTargetSnapshot;
  targetKindMap?: (targetKind: AttackTargetKind, host: AttackHostRuntime, definition: EnemyAttackDefinition) => AttackTargetKind[];
  getWrappedDirection: (fromX: number, fromY: number, toX: number, toY: number) => AttackVectorLike;
  cooldownScale?: number;
  damageScale?: number;
  telegraphsEnabled?: boolean;
  reducedEffects?: boolean;
  readabilityMode?: AttackRuntimeReadabilityMode;
  callbacks: {
    spawnProjectile?: (request: AttackProjectileRequest) => void;
    areaDamage?: (request: AttackAreaDamageRequest) => void;
    applyStatus?: (target: AttackTargetSnapshot, statuses: AttackStatusRequest[], sourceHostId: string) => void;
    summon?: (request: AttackSummonRequest) => void;
    heal?: (request: AttackHealRequest) => void;
    buff?: (request: AttackBuffRequest) => void;
    shield?: (request: AttackShieldRequest) => void;
    stealScrap?: (request: AttackScrapStealRequest) => void;
    telegraph?: (request: AttackVisualRequest) => void;
    effect?: (request: AttackVisualRequest) => void;
    labEffect?: (request: AttackVisualRequest) => void;
  };
}

interface AttackTiming {
  initialDelayMs: number;
  cooldownMs: number;
  windupMs: number;
  channelMs: number;
  activeMs: number;
  recoveryMs: number;
}

interface AttackPendingImpact {
  executeAt: number;
  target?: AttackTargetSnapshot;
  beat?: AttackRuntimeBeat;
  damageOverride?: number;
  radiusOverride?: number;
  clusterStage?: 'primary' | 'secondary';
}

export function createAttackHostRuntime(input: {
  hostKind: AttackHostKind;
  hostId: string;
  definitionId: string;
  body: AttackBodyLike;
  velocity: AttackVectorLike;
  loadout: AttackLoadoutSlot[];
  time: number;
  manualTriggerOnly?: boolean;
}): AttackHostRuntime {
  const slots = normalizeAttackLoadoutSlots(input.loadout);
  return {
    hostKind: input.hostKind,
    hostId: input.hostId,
    definitionId: input.definitionId,
    body: input.body,
    velocity: input.velocity,
    manualTriggerOnly: input.manualTriggerOnly,
    attacks: slots.map((slot, index) => {
      const definition = getEnemyAttackDefinition(slot.attackId);
      const timing = resolveAttackTiming(definition, slot);
      const offset = slot.cooldownOffsetMs ?? index * 180;
      return {
        slot,
        definition,
        nextReadyAt: input.time + timing.initialDelayMs + offset,
        phase: 'idle',
        phaseStartedAt: input.time,
        executedInPhase: false,
        pendingImpacts: [],
        lastTelegraphAt: input.time,
        lastTickAt: input.time,
        lastRetargetAt: input.time
      };
    })
  };
}

export function replaceAttackHostRuntimeLoadout(
  runtime: AttackHostRuntime,
  loadout: AttackLoadoutSlot[],
  time: number
): void {
  const next = createAttackHostRuntime({
    hostKind: runtime.hostKind,
    hostId: runtime.hostId,
    definitionId: runtime.definitionId,
    body: runtime.body,
    velocity: runtime.velocity,
    loadout,
    time,
    manualTriggerOnly: runtime.manualTriggerOnly
  });
  runtime.attacks = next.attacks;
}

export function queueAttackSlot(runtime: AttackHostRuntime, slotIndex: number, time: number): boolean {
  const slot = runtime.attacks[slotIndex];
  if (!slot || slot.slot.enabled === false) {
    return false;
  }

  slot.phase = 'idle';
  slot.nextReadyAt = time;
  slot.queuedAt = time;
  slot.executedInPhase = false;
  slot.pendingImpacts = [];
  slot.lastTelegraphAt = time;
  slot.lastTickAt = time;
  slot.lastRetargetAt = time;
  return true;
}

export function getEnabledAttackSlotIndices(runtime: AttackHostRuntime): number[] {
  return runtime.attacks
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.slot.enabled !== false)
    .map(({ index }) => index);
}

export function updateAttackHostRuntime(input: UpdateAttackHostRuntimeInput): AttackRuntimeEvent[] {
  const events: AttackRuntimeEvent[] = [];
  const host = input.host;

  host.attacks.forEach((slot, slotIndex) => {
    if (slot.slot.enabled === false) {
      return;
    }

    processPendingImpacts(input, slot, slotIndex, events);

    if (slot.phase === 'idle') {
      const canStart = input.time >= slot.nextReadyAt && (!host.manualTriggerOnly || slot.queuedAt !== undefined);
      if (!canStart) {
        return;
      }

      const target = selectAttackTarget(input, slot);
      if (!target) {
        slot.nextReadyAt = input.time + Math.min(350, resolveAttackTiming(slot.definition, slot.slot).cooldownMs);
        events.push({ type: 'skip-no-target', attackId: slot.definition.id, slotIndex });
        return;
      }

      slot.target = target;
      slot.queuedAt = undefined;
      startNextAvailablePhase(input, slot, slotIndex, events, 'idle');
      return;
    }

    const timing = resolveAttackTiming(slot.definition, slot.slot);
    const duration = getPhaseDuration(slot.phase, timing);
    const elapsed = input.time - slot.phaseStartedAt;
    if (slot.phase === 'windup' || slot.phase === 'channel') {
      refreshTrackingTarget(input, slot);
      refreshTelegraph(input, slot);
    }

    if (slot.phase === 'active') {
      executeActiveTick(input, slot, slotIndex, events);
    }

    if (elapsed < duration) {
      return;
    }

    if (slot.phase === 'windup') {
      startNextAvailablePhase(input, slot, slotIndex, events, 'windup');
    } else if (slot.phase === 'channel') {
      startNextAvailablePhase(input, slot, slotIndex, events, 'channel');
    } else if (slot.phase === 'active') {
      startRecoveryOrIdle(input, slot, slotIndex, events);
    } else if (slot.phase === 'recovery') {
      slot.phase = 'idle';
      slot.phaseStartedAt = input.time;
      slot.target = undefined;
      slot.executedInPhase = false;
    }
  });

  return events;
}

export function createAttackTargetSnapshot(input: AttackTargetSnapshot): AttackTargetSnapshot {
  return {
    ...input,
    velocity: input.velocity ? { ...input.velocity } : undefined
  };
}

export function resolveRuntimeTelegraphRecipe(
  definition: EnemyAttackDefinition,
  slot: AttackLoadoutSlot,
  options: { reducedEffects?: boolean; readabilityMode?: AttackRuntimeReadabilityMode } = {}
): AttackTelegraphRecipe {
  const params = resolveAttackLoadoutSlotParams(slot);
  const base = {
    ...definition.telegraph,
    ...pickRecipeOverrides(params, ['radiusPx', 'rangePx', 'durationMs']),
    ...pickRadiusAliasOverride(params),
    ...pickTelegraphDurationAliasOverride(definition, params)
  };
  const reduced = options.reducedEffects ? definition.reducedEffects ?? {} : {};
  const recipe = { ...base, ...reduced };
  return {
    ...recipe,
    color: resolveRuntimeColor(recipe.color, options.readabilityMode ?? 'normal'),
    accentColor: recipe.accentColor !== undefined
      ? resolveRuntimeColor(recipe.accentColor, options.readabilityMode ?? 'normal')
      : undefined,
    strokeWidthPx: Math.max(
      options.readabilityMode === 'high-contrast' ? 3 : 1,
      Number(recipe.strokeWidthPx ?? (options.reducedEffects ? 2.5 : 1.5))
    )
  };
}

export function resolveRuntimeEffectRecipe(
  definition: EnemyAttackDefinition,
  slot: AttackLoadoutSlot,
  options: { reducedEffects?: boolean; readabilityMode?: AttackRuntimeReadabilityMode } = {}
): AttackEffectRecipe {
  const params = resolveAttackLoadoutSlotParams(slot);
  const base = {
    ...definition.activeEffect,
    ...pickRecipeOverrides(params, ['radiusPx', 'widthPx', 'durationMs']),
    ...pickRadiusAliasOverride(params),
    ...pickEffectDurationAliasOverride(definition, params)
  };
  const reduced = options.reducedEffects ? definition.reducedEffects ?? {} : {};
  const recipe = { ...base, ...reduced };
  return {
    ...recipe,
    color: resolveRuntimeColor(recipe.color, options.readabilityMode ?? 'normal'),
    accentColor: recipe.accentColor !== undefined
      ? resolveRuntimeColor(recipe.accentColor, options.readabilityMode ?? 'normal')
      : undefined,
    widthPx: Math.max(options.readabilityMode === 'high-contrast' ? 5 : 1, Number(recipe.widthPx ?? 2))
  };
}

function startNextAvailablePhase(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  slotIndex: number,
  events: AttackRuntimeEvent[],
  fromPhase: AttackRuntimePhase
): void {
  const timing = resolveAttackTiming(slot.definition, slot.slot);
  const nextPhase = fromPhase === 'idle'
    ? timing.windupMs > 0 ? 'windup' : timing.channelMs > 0 ? 'channel' : 'active'
    : fromPhase === 'windup'
      ? timing.channelMs > 0 ? 'channel' : 'active'
      : 'active';

  slot.phase = nextPhase;
  slot.phaseStartedAt = input.time;
  slot.executedInPhase = false;
  slot.lastTickAt = input.time;
  slot.lastRetargetAt = input.time;
  events.push({ type: 'phase-start', attackId: slot.definition.id, slotIndex, phase: nextPhase });

  if (nextPhase === 'windup' || nextPhase === 'channel') {
    requestTelegraph(input, slot, nextPhase);
  }

  if (nextPhase === 'active') {
    requestEffect(input, slot, 'active', 'resolve');
    if (isSustainedActiveAttack(slot)) {
      slot.lastTickAt = input.time - getSustainedTickMs(slot);
      executeSustainedActiveTick(input, slot, slotIndex, events, false);
      return;
    }
    executeOrScheduleActive(input, slot, slotIndex, events);
  }
}

function startRecoveryOrIdle(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  slotIndex: number,
  events: AttackRuntimeEvent[]
): void {
  const timing = resolveAttackTiming(slot.definition, slot.slot);
  const cooldown = timing.cooldownMs * Math.max(0.05, input.cooldownScale ?? 1);
  slot.nextReadyAt = input.time + cooldown;

  if (timing.recoveryMs <= 0) {
    slot.phase = 'idle';
    slot.phaseStartedAt = input.time;
    slot.target = undefined;
    slot.executedInPhase = false;
    return;
  }

  slot.phase = 'recovery';
  slot.phaseStartedAt = input.time;
  slot.executedInPhase = false;
  events.push({ type: 'phase-start', attackId: slot.definition.id, slotIndex, phase: 'recovery' });
}

function processPendingImpacts(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  slotIndex: number,
  events: AttackRuntimeEvent[]
): void {
  if (slot.pendingImpacts.length <= 0) {
    return;
  }

  const pending: AttackPendingImpact[] = [];
  for (const impact of slot.pendingImpacts) {
    if (input.time < impact.executeAt) {
      pending.push(impact);
      continue;
    }

    executeAttack(input, slot, {
      target: impact.target,
      beat: impact.beat ?? 'impact',
      damageOverride: impact.damageOverride,
      radiusOverride: impact.radiusOverride
    });
    events.push({ type: 'execute', attackId: slot.definition.id, slotIndex });
    if (impact.clusterStage === 'primary') {
      pending.push(...createClusterBombSecondaryImpacts(input, slot, impact.target));
    }
  }
  slot.pendingImpacts = pending;
}

function executeOrScheduleActive(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  slotIndex: number,
  events: AttackRuntimeEvent[]
): void {
  if (slot.definition.id === 'cluster-bomb') {
    scheduleClusterBombImpacts(input, slot);
    slot.executedInPhase = true;
    return;
  }

  if (shouldDelayActiveExecution(slot)) {
    const delayMs = getDelayedImpactMs(slot);
    if (delayMs > 0) {
      slot.pendingImpacts.push({
        executeAt: input.time + delayMs,
        target: slot.target ? createAttackTargetSnapshot(slot.target) : undefined,
        beat: 'impact'
      });
      slot.executedInPhase = true;
      return;
    }
  }

  executeAttack(input, slot, { beat: 'resolve' });
  slot.executedInPhase = true;
  events.push({ type: 'execute', attackId: slot.definition.id, slotIndex });
}

function shouldDelayActiveExecution(slot: AttackSlotRuntime): boolean {
  return slot.definition.id === 'mortar-lob';
}

function getDelayedImpactMs(slot: AttackSlotRuntime): number {
  const rawParams = slot.slot.params ?? {};
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const explicitImpactDelay = rawParams.impactDelayMs;
  const explicitTravel = rawParams.travelMs;
  const explicitActive = rawParams.activeMs;

  if (typeof explicitImpactDelay === 'number' && Number.isFinite(explicitImpactDelay)) {
    return Math.max(0, explicitImpactDelay);
  }
  if (typeof explicitTravel === 'number' && Number.isFinite(explicitTravel)) {
    return Math.max(0, explicitTravel);
  }
  if (typeof explicitActive === 'number' && Number.isFinite(explicitActive)) {
    return Math.max(0, explicitActive);
  }

  return Math.max(0, getNumberParam(params, 'travelMs', resolveAttackTiming(slot.definition, slot.slot).activeMs));
}

function scheduleClusterBombImpacts(input: UpdateAttackHostRuntimeInput, slot: AttackSlotRuntime): void {
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const travelMs = Math.max(0, getNumberParam(params, 'travelMs', resolveAttackTiming(slot.definition, slot.slot).activeMs));
  slot.pendingImpacts.push({
    executeAt: input.time + travelMs,
    target: slot.target ? createAttackTargetSnapshot(slot.target) : createSelfTargetSnapshot(input),
    beat: 'impact',
    clusterStage: 'primary'
  });
}

function createClusterBombSecondaryImpacts(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  centerTarget: AttackTargetSnapshot | undefined
): AttackPendingImpact[] {
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const count = Math.max(1, Math.min(8, Math.trunc(getNumberParam(params, 'splitCount', 5))));
  const delayMs = Math.max(0, getNumberParam(params, 'delayMs', 420));
  const secondaryRadius = Math.max(12, getNumberParam(params, 'secondaryRadiusPx', slot.definition.activeEffect.radiusPx ?? 70));
  const primaryRadius = Math.max(secondaryRadius, getNumberParam(params, 'radiusPx', slot.definition.telegraph.radiusPx ?? 140));
  const splitDistance = Math.max(
    secondaryRadius * 1.35,
    getNumberParam(params, 'splitDistancePx', primaryRadius * 0.62)
  );
  const center = centerTarget ? createAttackTargetSnapshot(centerTarget) : createSelfTargetSnapshot(input);
  const impacts: AttackPendingImpact[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI * 0.5 + (Math.PI * 2 * index) / count;
    const target = createAttackTargetSnapshot({
      ...center,
      id: `${center.id}-cluster-${index + 1}`,
      x: center.x + Math.cos(angle) * splitDistance,
      y: center.y + Math.sin(angle) * splitDistance,
      radius: secondaryRadius,
      label: `${center.label ?? 'cluster'} split ${index + 1}`
    });
    requestClusterBombSecondaryTelegraph(input, slot, target, secondaryRadius, delayMs);
    impacts.push({
      executeAt: input.time + delayMs,
      target,
      beat: 'impact',
      radiusOverride: secondaryRadius,
      clusterStage: 'secondary'
    });
  }

  return impacts;
}

function requestClusterBombSecondaryTelegraph(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  target: AttackTargetSnapshot,
  radius: number,
  durationMs: number
): void {
  if (input.telegraphsEnabled === false) {
    return;
  }

  const telegraph = {
    ...resolveRuntimeTelegraphRecipe(slot.definition, slot.slot, input),
    kind: 'landing-circle' as const,
    radiusPx: radius,
    durationMs
  };
  input.callbacks.telegraph?.({
    sourceHostId: input.host.hostId,
    ownerKind: input.host.hostKind,
    attackId: slot.definition.id,
    phase: 'active',
    beat: 'anticipation',
    x: input.host.body.x,
    y: input.host.body.y,
    direction: getDirectionToTarget(input, slot, target),
    target,
    telegraph,
    params: resolveAttackLoadoutSlotParams(slot.slot),
    progress: 0,
    durationMs
  });
}

function createSelfTargetSnapshot(input: UpdateAttackHostRuntimeInput): AttackTargetSnapshot {
  return {
    id: input.host.hostId,
    kind: 'self',
    x: input.host.body.x,
    y: input.host.body.y,
    radius: 32,
    velocity: input.host.velocity,
    label: input.host.definitionId
  };
}

function refreshTrackingTarget(input: UpdateAttackHostRuntimeInput, slot: AttackSlotRuntime): void {
  if (slot.phase !== 'windup') {
    return;
  }

  const elapsed = input.time - slot.phaseStartedAt;
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const timing = resolveAttackTiming(slot.definition, slot.slot);
  const shouldTrack =
    (slot.definition.id === 'rail-line' && elapsed < getNumberParam(params, 'aimMs', timing.windupMs)) ||
    slot.definition.id === 'mortar-lob' ||
    slot.definition.id === 'cluster-bomb' ||
    slot.definition.id === 'sweep-laser' ||
    slot.definition.id === 'plasma-puddle' ||
    slot.definition.id === 'alarm-ping' ||
    slot.definition.id === 'mine-reveal';

  if (!shouldTrack) {
    return;
  }

  const target = selectAttackTarget(input, slot);
  if (target) {
    slot.target = target;
  }
}

function refreshTelegraph(input: UpdateAttackHostRuntimeInput, slot: AttackSlotRuntime): void {
  const refreshMs = getTelegraphRefreshMs(slot);
  if (refreshMs <= 0 || input.time - slot.lastTelegraphAt < refreshMs) {
    return;
  }

  requestTelegraph(input, slot, slot.phase);
}

function getTelegraphRefreshMs(slot: AttackSlotRuntime): number {
  if (slot.phase !== 'windup' && slot.phase !== 'channel') {
    return 0;
  }

  switch (slot.definition.id) {
    case 'rail-line':
      return 90;
    case 'mortar-lob':
    case 'cluster-bomb':
    case 'emp-nova':
    case 'berserker-shockwave':
    case 'mine-reveal':
      return 150;
    case 'summon-glyphs':
      return slot.phase === 'channel' ? 180 : 220;
    case 'alarm-ping':
      return slot.phase === 'channel' ? 180 : 100;
    case 'sweep-laser':
      return 110;
    case 'healing-beam':
      return 140;
    case 'plasma-puddle':
      return 150;
    default:
      return 0;
  }
}

function executeAttack(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  options: { target?: AttackTargetSnapshot; beat?: AttackRuntimeBeat; damageOverride?: number; radiusOverride?: number } = {}
): void {
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const target = options.target ?? slot.target;
  const origin = { x: input.host.body.x, y: input.host.body.y };
  const direction = getDirectionToTarget(input, slot, target);
  const damage = (options.damageOverride ?? getNumberParam(params, 'damage', slot.definition.execution.damage ?? 0)) * (input.damageScale ?? 1);
  const radius = options.radiusOverride ?? getNumberParam(
    params,
    'radiusPx',
    getNumberParam(params, 'blastRadiusPx', getNumberParam(params, 'splashRadiusPx', slot.definition.activeEffect.radiusPx ?? slot.definition.targeting.rangePx))
  );
  const statuses = createAttackStatuses(slot.definition, params);

  switch (slot.definition.execution.kind) {
    case 'simple-bolt':
    case 'phase-blink-strike':
      input.callbacks.spawnProjectile?.({
        sourceHostId: input.host.hostId,
        ownerKind: input.host.hostKind,
        attackId: slot.definition.id,
        x: origin.x + direction.x * 42,
        y: origin.y + direction.y * 42,
        direction,
        speed: getNumberParam(params, 'projectileSpeed', slot.definition.execution.projectileSpeedPx ?? 430),
        damage: Math.max(0, damage),
        range: getNumberParam(params, 'rangePx', slot.definition.targeting.rangePx),
        radius: slot.definition.activeEffect.radiusPx ?? 7,
        color: resolveRuntimeEffectRecipe(slot.definition, slot.slot, input).color,
        target,
        statuses
      });
      break;
    case 'rail-line':
    case 'sweep-laser':
      input.callbacks.areaDamage?.({
        sourceHostId: input.host.hostId,
        ownerKind: input.host.hostKind,
        attackId: slot.definition.id,
        beat: options.beat ?? 'resolve',
        targetKind: slot.definition.targeting.targetKind,
        shape: 'line',
        x: origin.x,
        y: origin.y,
        fromX: origin.x,
        fromY: origin.y,
        toX: origin.x + direction.x * getNumberParam(params, 'rangePx', slot.definition.targeting.rangePx),
        toY: origin.y + direction.y * getNumberParam(params, 'rangePx', slot.definition.targeting.rangePx),
        width: slot.definition.activeEffect.widthPx ?? 8,
        damage: Math.max(0, damage),
        statuses
      });
      break;
    case 'mortar-lob':
    case 'plasma-puddle':
    case 'cluster-bomb':
    case 'emp-nova':
    case 'berserker-shockwave':
    case 'mine-reveal':
    case 'self-destruct-radius':
    case 'contact-ram':
    case 'charge-strike':
      input.callbacks.areaDamage?.({
        sourceHostId: input.host.hostId,
        ownerKind: input.host.hostKind,
        attackId: slot.definition.id,
        beat: options.beat ?? 'resolve',
        targetKind: slot.definition.targeting.targetKind,
        shape: 'circle',
        x: slot.definition.targeting.targetKind === 'self' || !target ? origin.x : target.x,
        y: slot.definition.targeting.targetKind === 'self' || !target ? origin.y : target.y,
        radius,
        damage: Math.max(0, damage || getNumberParam(params, 'tickDamage', 0)),
        statuses
      });
      break;
    case 'summon-glyphs':
    case 'split-shards':
    case 'alarm-ping':
      input.callbacks.summon?.({
        sourceHostId: input.host.hostId,
        ownerKind: input.host.hostKind,
        attackId: slot.definition.id,
        definitionId: String(params.squadId ?? params.spawnId ?? params.childId ?? 'scout'),
        count: Math.max(1, Math.trunc(getNumberParam(params, 'count', getNumberParam(params, 'childCount', 1)))),
        x: target?.x ?? origin.x,
        y: target?.y ?? origin.y,
        radius: getNumberParam(params, 'glyphRadiusPx', getNumberParam(params, 'radiusPx', slot.definition.activeEffect.radiusPx ?? 160))
      });
      break;
    case 'healing-beam':
      if (target) {
        input.callbacks.heal?.({
          sourceHostId: input.host.hostId,
          targetId: target.id,
          amount: getNumberParam(params, 'healPerSecond', 12)
        });
      }
      break;
    case 'shield-wall':
      input.callbacks.shield?.({
        sourceHostId: input.host.hostId,
        radius: getNumberParam(params, 'radiusPx', slot.definition.activeEffect.radiusPx ?? 110),
        reduction: getNumberParam(params, 'damageReduction', 0.48),
        durationMs: getNumberParam(params, 'activeMs', slot.definition.timing.activeMs ?? 1200),
        reflect: params.reflect === true || slot.definition.execution.reflect === true,
        arcDegrees: getNumberParam(params, 'arcDegrees', 95)
      });
      break;
    case 'command-buff-pulse':
      input.callbacks.buff?.({
        sourceHostId: input.host.hostId,
        radius: getNumberParam(params, 'auraRadiusPx', getNumberParam(params, 'auraRadius', 270)),
        speedMultiplier: getNumberParam(params, 'speedBonus', 1.22),
        fireRateMultiplier: getNumberParam(params, 'fireRateBonus', 0.78),
        damageMultiplier: getNumberParam(params, 'damageBonus', 1.16),
        durationMs: slot.definition.timing.activeMs ?? 900
      });
      break;
    case 'scrap-steal':
      input.callbacks.stealScrap?.({
        sourceHostId: input.host.hostId,
        range: slot.definition.targeting.rangePx,
        pickupRange: getNumberParam(params, 'pickupRangePx', getNumberParam(params, 'pickupRange', 46)),
        bonusScrap: getNumberParam(params, 'bonusScrap', 0)
      });
      break;
  }

  if (target && statuses.length > 0 && slot.definition.execution.kind !== 'simple-bolt') {
    input.callbacks.applyStatus?.(target, statuses, input.host.hostId);
  }
}

function executeActiveTick(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  slotIndex: number,
  events: AttackRuntimeEvent[]
): void {
  if (isSustainedActiveAttack(slot)) {
    executeSustainedActiveTick(input, slot, slotIndex, events, true);
    return;
  }

  if (slot.executedInPhase) {
    return;
  }

  requestEffect(input, slot, 'active', 'resolve');
  executeOrScheduleActive(input, slot, slotIndex, events);
}

function executeSustainedActiveTick(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  slotIndex: number,
  events: AttackRuntimeEvent[],
  renderEffect: boolean
): void {
  const tickMs = getSustainedTickMs(slot);
  if (tickMs <= 0 || input.time - slot.lastTickAt < tickMs) {
    return;
  }

  if (slot.definition.id === 'healing-beam') {
    refreshSustainedHealTarget(input, slot);
  }

  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const tickSeconds = tickMs / 1000;
  const beat: AttackRuntimeBeat = slot.definition.id === 'plasma-puddle' ? 'impact' : 'channel';

  if (renderEffect && slot.definition.id !== 'plasma-puddle') {
    requestEffect(input, slot, 'active', beat);
  }

  if (slot.definition.id === 'healing-beam') {
    const target = slot.target;
    if (target) {
      input.callbacks.heal?.({
        sourceHostId: input.host.hostId,
        targetId: target.id,
        amount: getNumberParam(params, 'healPerSecond', 12) * tickSeconds
      });
      events.push({ type: 'execute', attackId: slot.definition.id, slotIndex });
    }
  } else if (slot.definition.id === 'sweep-laser') {
    executeAttack(input, slot, {
      beat,
      damageOverride: getNumberParam(params, 'damagePerSecond', slot.definition.execution.damage ?? 0) * tickSeconds
    });
    events.push({ type: 'execute', attackId: slot.definition.id, slotIndex });
  } else if (slot.definition.id === 'plasma-puddle') {
    executeAttack(input, slot, {
      beat,
      damageOverride: getNumberParam(params, 'tickDamage', slot.definition.execution.damage ?? 0)
    });
    events.push({ type: 'execute', attackId: slot.definition.id, slotIndex });
  }

  slot.lastTickAt = input.time;
}

function refreshSustainedHealTarget(input: UpdateAttackHostRuntimeInput, slot: AttackSlotRuntime): void {
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const retargetMs = Math.max(50, getNumberParam(params, 'retargetMs', 250));
  if (input.time - slot.lastRetargetAt < retargetMs) {
    return;
  }

  const target = selectAttackTarget(input, slot);
  if (target) {
    slot.target = target;
  }
  slot.lastRetargetAt = input.time;
}

function isSustainedActiveAttack(slot: AttackSlotRuntime): boolean {
  return slot.definition.id === 'sweep-laser' ||
    slot.definition.id === 'healing-beam' ||
    slot.definition.id === 'plasma-puddle';
}

function getSustainedTickMs(slot: AttackSlotRuntime): number {
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  if (slot.definition.id === 'healing-beam') {
    return Math.max(50, getNumberParam(params, 'tickMs', getNumberParam(params, 'retargetMs', 250)));
  }
  if (slot.definition.id === 'plasma-puddle') {
    return Math.max(80, getNumberParam(params, 'tickMs', 500));
  }
  if (slot.definition.id === 'sweep-laser') {
    return Math.max(60, getNumberParam(params, 'tickMs', 180));
  }
  return 0;
}

function requestTelegraph(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase
): void {
  if (input.telegraphsEnabled === false || slot.definition.telegraph.kind === 'none') {
    return;
  }

  const timing = resolveAttackTiming(slot.definition, slot.slot);
  const durationMs = resolveTelegraphRequestDuration(slot, phase, timing);
  slot.lastTelegraphAt = input.time;
  input.callbacks.telegraph?.({
    ...createVisualRequest(input, slot, phase, durationMs, resolveVisualBeat(input, slot, phase)),
    telegraph: resolveRuntimeTelegraphRecipe(slot.definition, slot.slot, input)
  });
}

function requestEffect(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase,
  beat?: AttackRuntimeBeat
): void {
  const timing = resolveAttackTiming(slot.definition, slot.slot);
  input.callbacks.effect?.({
    ...createVisualRequest(input, slot, phase, getPhaseDuration('active', timing), beat),
    effect: resolveRuntimeEffectRecipe(slot.definition, slot.slot, input)
  });
  input.callbacks.labEffect?.({
    ...createVisualRequest(input, slot, phase, getPhaseDuration('active', timing), beat),
    effect: resolveRuntimeEffectRecipe(slot.definition, slot.slot, input)
  });
}

function createVisualRequest(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase,
  durationMs: number,
  beat?: AttackRuntimeBeat
): Omit<AttackVisualRequest, 'telegraph' | 'effect'> {
  const elapsed = Math.max(0, input.time - slot.phaseStartedAt);
  return {
    sourceHostId: input.host.hostId,
    ownerKind: input.host.hostKind,
    attackId: slot.definition.id,
    phase,
    beat,
    x: input.host.body.x,
    y: input.host.body.y,
    direction: getDirectionToTarget(input, slot, slot.target),
    target: slot.target,
    params: resolveAttackLoadoutSlotParams(slot.slot),
    progress: durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1,
    durationMs
  };
}

function resolveTelegraphRequestDuration(
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase,
  timing: AttackTiming
): number {
  const duration = getPhaseDuration(phase, timing);
  if (slot.definition.id === 'rail-line') {
    const params = resolveAttackLoadoutSlotParams(slot.slot);
    return Math.max(120, Math.min(260, getNumberParam(params, 'lockMs', 180)));
  }
  if (slot.definition.id === 'mortar-lob' || slot.definition.id === 'emp-nova') {
    return Math.max(180, Math.min(320, duration));
  }
  if (slot.definition.id === 'sweep-laser') {
    return Math.max(160, Math.min(300, duration));
  }
  if (slot.definition.id === 'plasma-puddle') {
    return Math.max(220, Math.min(420, duration));
  }
  if (slot.definition.id === 'healing-beam') {
    return Math.max(140, Math.min(260, duration));
  }
  if (slot.definition.id === 'summon-glyphs') {
    return phase === 'channel'
      ? Math.max(240, Math.min(420, duration))
      : Math.max(180, Math.min(280, duration));
  }
  return duration;
}

function resolveVisualBeat(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase
): AttackRuntimeBeat | undefined {
  if (phase === 'active') {
    return 'resolve';
  }
  if (phase === 'channel') {
    return 'channel';
  }
  if (phase !== 'windup') {
    return undefined;
  }

  if (slot.definition.id === 'rail-line') {
    const params = resolveAttackLoadoutSlotParams(slot.slot);
    const elapsed = input.time - slot.phaseStartedAt;
    return elapsed < getNumberParam(params, 'aimMs', resolveAttackTiming(slot.definition, slot.slot).windupMs)
      ? 'tracking'
      : 'lock';
  }

  return 'anticipation';
}

function createPointTargetSnapshot(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  pointTarget: AttackTargetSnapshot
): AttackTargetSnapshot {
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const timing = resolveAttackTiming(slot.definition, slot.slot);
  const target = createAttackTargetSnapshot(pointTarget);
  const leadMs = slot.definition.targeting.leadTarget && target.velocity
    ? Math.min(1800, timing.windupMs + getNumberParam(params, 'travelMs', timing.activeMs))
    : 0;

  let x = target.x + (target.velocity?.x ?? 0) * (leadMs / 1000);
  let y = target.y + (target.velocity?.y ?? 0) * (leadMs / 1000);
  const rangePx = getNumberParam(params, 'rangePx', slot.definition.targeting.rangePx);
  const offset = input.getWrappedDirection(input.host.body.x, input.host.body.y, x, y);
  const distance = Math.sqrt(lengthSq(offset));
  if (distance > rangePx && distance > 0.0001) {
    x = input.host.body.x + (offset.x / distance) * rangePx;
    y = input.host.body.y + (offset.y / distance) * rangePx;
  }

  return {
    ...target,
    x,
    y
  };
}

function selectAttackTarget(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime
): AttackTargetSnapshot | undefined {
  const definition = slot.definition;
  const targetKind = definition.targeting.targetKind;
  if (targetKind === 'self') {
    if (definition.id === 'self-destruct-radius') {
      const params = resolveAttackLoadoutSlotParams(slot.slot);
      const triggerRange = getNumberParam(params, 'triggerRangePx', definition.targeting.rangePx);
      const targetKinds = input.targetKindMap?.('player', input.host, definition) ?? ['player'];
      const triggerTarget = input.targets.find((target) => targetKinds.includes(target.kind) &&
        lengthSq(input.getWrappedDirection(input.host.body.x, input.host.body.y, target.x, target.y)) <= triggerRange * triggerRange
      );
      if (!triggerTarget) {
        return undefined;
      }
    }

    return createAttackTargetSnapshot(createSelfTargetSnapshot(input));
  }

  if (targetKind === 'point' && input.pointTarget) {
    return createPointTargetSnapshot(input, slot, input.pointTarget);
  }

  const allowedKinds = input.targetKindMap?.(targetKind, input.host, definition) ?? [targetKind];
  if (input.pointTarget && allowedKinds[0] === 'point') {
    return createPointTargetSnapshot(input, slot, input.pointTarget);
  }

  const candidates = input.targets.filter((target) => allowedKinds.includes(target.kind));
  if (input.pointTarget && allowedKinds.includes('point') && candidates.length === 0) {
    return createPointTargetSnapshot(input, slot, input.pointTarget);
  }

  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const rangePx = getNumberParam(params, 'rangePx', definition.targeting.rangePx);
  const inRange = candidates
    .map((target) => ({
      target,
      distanceSq: lengthSq(input.getWrappedDirection(input.host.body.x, input.host.body.y, target.x, target.y))
    }))
    .filter(({ distanceSq }) => distanceSq <= rangePx * rangePx);

  if (definition.targeting.preferDamagedAlly) {
    const damaged = inRange.filter(({ target }) =>
      target.hp !== undefined && target.maxHp !== undefined && target.hp < target.maxHp
    );
    if (damaged.length > 0) {
      damaged.sort((a, b) => healthRatio(a.target) - healthRatio(b.target) || a.distanceSq - b.distanceSq);
      return createAttackTargetSnapshot(damaged[0].target);
    }
  }

  inRange.sort((a, b) => a.distanceSq - b.distanceSq);
  const selected = inRange[0]?.target ?? candidates[0];
  return selected ? createAttackTargetSnapshot(selected) : undefined;
}

function getDirectionToTarget(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  target: AttackTargetSnapshot | undefined
): AttackVectorLike {
  const baseDirection = getBaseDirectionToTarget(input, slot, target);
  if (slot.definition.id === 'sweep-laser' && slot.phase === 'active') {
    const params = resolveAttackLoadoutSlotParams(slot.slot);
    const timing = resolveAttackTiming(slot.definition, slot.slot);
    const activeMs = Math.max(1, timing.activeMs);
    const progress = clamp01((input.time - slot.phaseStartedAt) / activeMs);
    const arcRadians = degreesToRadians(getNumberParam(params, 'arcDegrees', 80));
    return rotateVector(baseDirection, -arcRadians * 0.5 + arcRadians * progress);
  }

  return baseDirection;
}

function getBaseDirectionToTarget(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  target: AttackTargetSnapshot | undefined
): AttackVectorLike {
  if (!target) {
    const rotation = input.host.body.rotation ?? 0;
    return normalize({ x: Math.sin(rotation), y: -Math.cos(rotation) });
  }

  const offset = input.getWrappedDirection(input.host.body.x, input.host.body.y, target.x, target.y);
  if (lengthSq(offset) <= 0.0001) {
    const rotation = input.host.body.rotation ?? 0;
    return normalize({ x: Math.sin(rotation), y: -Math.cos(rotation) });
  }

  if (
    slot.definition.targeting.leadTarget &&
    !input.host.manualTriggerOnly &&
    target.velocity &&
    lengthSq(target.velocity) > 1 &&
    lengthSq(offset) > 1
  ) {
    const projectileSpeed = getNumberParam(
      resolveAttackLoadoutSlotParams(slot.slot),
      'projectileSpeed',
      430
    );
    const leadSeconds = Math.min(0.9, Math.sqrt(lengthSq(offset)) / Math.max(120, projectileSpeed));
    return normalize({
      x: offset.x + target.velocity.x * leadSeconds,
      y: offset.y + target.velocity.y * leadSeconds
    });
  }

  return normalize(offset);
}

function resolveAttackTiming(definition: EnemyAttackDefinition, slot: AttackLoadoutSlot): AttackTiming {
  const params = resolveAttackLoadoutSlotParams(slot);
  const hasWindupOverride = typeof params.windupMs === 'number' && Number.isFinite(params.windupMs);
  const hasActiveOverride = typeof params.activeMs === 'number' && Number.isFinite(params.activeMs);
  const railAimMs = getNumberParam(params, 'aimMs', 0);
  const railLockMs = getNumberParam(params, 'lockMs', 0);
  const defaultWindupMs = definition.id === 'rail-line' && !hasWindupOverride && railAimMs > 0 && railLockMs > 0
    ? railAimMs + railLockMs
    : definition.id === 'alarm-ping' && !hasWindupOverride
      ? getNumberParam(params, 'detectMs', definition.timing.windupMs)
    : definition.id === 'plasma-puddle' && !hasWindupOverride
      ? getNumberParam(params, 'landingMs', definition.timing.windupMs)
      : definition.id === 'mine-reveal' && !hasWindupOverride
        ? getNumberParam(params, 'chargeMs', definition.timing.windupMs)
      : definition.timing.windupMs;
  const defaultActiveMs = resolveDefaultActiveMs(definition, params, hasActiveOverride);

  return {
    initialDelayMs: getNumberParam(params, 'initialDelayMs', definition.timing.initialDelayMs),
    cooldownMs: getNumberParam(params, 'cooldownMs', definition.timing.cooldownMs),
    windupMs: getNumberParam(params, 'windupMs', defaultWindupMs),
    channelMs: getNumberParam(
      params,
      'channelMs',
      definition.id === 'alarm-ping'
        ? getNumberParam(params, 'callDelayMs', definition.timing.channelMs ?? 0)
        : definition.timing.channelMs ?? 0
    ),
    activeMs: getNumberParam(params, 'activeMs', defaultActiveMs),
    recoveryMs: getNumberParam(params, 'recoveryMs', definition.timing.recoveryMs)
  };
}

function resolveDefaultActiveMs(
  definition: EnemyAttackDefinition,
  params: Record<string, EnemyAttackParamValue>,
  hasActiveOverride: boolean
): number {
  if (definition.id === 'mortar-lob' && !hasActiveOverride) {
    return getNumberParam(params, 'travelMs', definition.timing.activeMs ?? 100);
  }
  if (definition.id === 'cluster-bomb' && !hasActiveOverride) {
    return getNumberParam(params, 'travelMs', 800) + getNumberParam(params, 'delayMs', 420);
  }
  if (definition.id === 'sweep-laser' && !hasActiveOverride) {
    return getNumberParam(params, 'sweepMs', definition.timing.activeMs ?? 100);
  }
  if (definition.id === 'plasma-puddle' && !hasActiveOverride) {
    return getNumberParam(params, 'durationMs', definition.timing.activeMs ?? 100);
  }

  return definition.timing.activeMs ?? 100;
}

function getPhaseDuration(phase: AttackRuntimePhase, timing: AttackTiming): number {
  if (phase === 'windup') return timing.windupMs;
  if (phase === 'channel') return timing.channelMs;
  if (phase === 'active') return timing.activeMs;
  if (phase === 'recovery') return timing.recoveryMs;
  return 0;
}

function createAttackStatuses(
  definition: EnemyAttackDefinition,
  params: Record<string, EnemyAttackParamValue>
): AttackStatusRequest[] {
  const statusKind = params.statusKind ?? definition.execution.statusKind;
  if (statusKind !== 'frost' && statusKind !== 'electric' && statusKind !== 'slow') {
    return [];
  }

  const durationMs = getNumberParam(
    params,
    'statusDurationMs',
    getNumberParam(params, 'slowMs', statusKind === 'electric' ? 2400 : 1600)
  );
  const status: AttackStatusRequest = {
    kind: statusKind,
    durationMs,
    intensity: getNumberParam(params, 'statusIntensity', getNumberParam(params, 'slow', statusKind === 'slow' ? 0.65 : 1)),
    knockback: getNumberParam(params, 'knockback', 0)
  };

  if (statusKind === 'electric') {
    status.damagePerSecond = getNumberParam(params, 'statusDamagePerSecond', 5);
    status.tickMs = getNumberParam(params, 'statusTickMs', 500);
    status.accelerationDrag = getNumberParam(params, 'drag', getNumberParam(params, 'statusAccelerationDrag', 0.18));
  }

  return [status];
}

function resolveRuntimeColor(color: number, mode: AttackRuntimeReadabilityMode): number {
  if (mode === 'high-contrast') {
    return color === 0xffffff ? 0xffd166 : 0xffffff;
  }

  if (mode === 'color-safe') {
    const red = (color >> 16) & 255;
    const green = (color >> 8) & 255;
    const blue = color & 255;
    if (red > green + blue * 0.35) return 0xffd166;
    if (green > red && green > blue) return 0x66e6a3;
    return 0x73f2ff;
  }

  return color;
}

function pickRecipeOverrides(
  params: Record<string, EnemyAttackParamValue>,
  keys: string[]
): Partial<AttackTelegraphRecipe & AttackEffectRecipe> {
  const overrides: Record<string, number> = {};
  for (const key of keys) {
    const value = params[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      overrides[key] = value;
    }
  }
  return overrides;
}

function pickRadiusAliasOverride(
  params: Record<string, EnemyAttackParamValue>
): Partial<AttackTelegraphRecipe & AttackEffectRecipe> {
  const radiusPx = getFirstNumberParam(params, ['radiusPx', 'splashRadiusPx', 'blastRadiusPx', 'glyphRadiusPx', 'auraRadiusPx']);
  return radiusPx === undefined ? {} : { radiusPx };
}

function pickTelegraphDurationAliasOverride(
  definition: EnemyAttackDefinition,
  params: Record<string, EnemyAttackParamValue>
): Partial<AttackTelegraphRecipe> {
  const durationMs =
    definition.id === 'rail-line'
      ? getNumberParam(params, 'windupMs', getNumberParam(params, 'aimMs', definition.telegraph.durationMs ?? definition.timing.windupMs))
      : definition.id === 'mortar-lob' || definition.id === 'cluster-bomb' || definition.id === 'sweep-laser'
        ? getNumberParam(params, 'windupMs', definition.telegraph.durationMs ?? definition.timing.windupMs)
        : definition.id === 'alarm-ping'
          ? getNumberParam(params, 'detectMs', definition.telegraph.durationMs ?? definition.timing.windupMs)
        : definition.id === 'plasma-puddle'
          ? getNumberParam(params, 'landingMs', definition.telegraph.durationMs ?? definition.timing.windupMs)
          : definition.id === 'mine-reveal'
            ? getNumberParam(params, 'chargeMs', definition.telegraph.durationMs ?? definition.timing.windupMs)
            : undefined;

  return durationMs === undefined ? {} : { durationMs };
}

function pickEffectDurationAliasOverride(
  definition: EnemyAttackDefinition,
  params: Record<string, EnemyAttackParamValue>
): Partial<AttackEffectRecipe> {
  const durationMs =
    definition.id === 'mortar-lob'
      ? getNumberParam(params, 'travelMs', definition.activeEffect.durationMs ?? definition.timing.activeMs ?? 100)
      : definition.id === 'cluster-bomb'
        ? getNumberParam(params, 'travelMs', 800) + getNumberParam(params, 'delayMs', 420)
        : definition.id === 'sweep-laser'
          ? getNumberParam(params, 'sweepMs', definition.activeEffect.durationMs ?? definition.timing.activeMs ?? 100)
          : definition.id === 'alarm-ping'
            ? getNumberParam(params, 'callDelayMs', definition.activeEffect.durationMs ?? definition.timing.channelMs ?? 100)
            : definition.id === 'healing-beam' || definition.id === 'shield-wall'
              ? getNumberParam(params, 'activeMs', definition.activeEffect.durationMs ?? definition.timing.activeMs ?? 100)
              : definition.id === 'plasma-puddle'
                ? getNumberParam(params, 'durationMs', definition.activeEffect.durationMs ?? definition.timing.activeMs ?? 100)
                : undefined;

  return durationMs === undefined ? {} : { durationMs };
}

function getFirstNumberParam(
  params: Record<string, EnemyAttackParamValue>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function getNumberParam(params: Record<string, EnemyAttackParamValue>, key: string, fallback: number): number {
  const value = params[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function healthRatio(target: AttackTargetSnapshot): number {
  return target.maxHp && target.maxHp > 0 && target.hp !== undefined ? target.hp / target.maxHp : 1;
}

function lengthSq(vector: AttackVectorLike): number {
  return vector.x * vector.x + vector.y * vector.y;
}

function normalize(vector: AttackVectorLike): AttackVectorLike {
  const length = Math.sqrt(lengthSq(vector));
  if (length <= 0.0001) {
    return { x: 0, y: -1 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function rotateVector(vector: AttackVectorLike, radians: number): AttackVectorLike {
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  return normalize({
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos
  });
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
