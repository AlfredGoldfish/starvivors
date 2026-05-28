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
  x: number;
  y: number;
  direction: AttackVectorLike;
  target?: AttackTargetSnapshot;
  telegraph?: AttackTelegraphRecipe;
  effect?: AttackEffectRecipe;
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
        executedInPhase: false
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
    if (slot.phase === 'active') {
      executeActiveTick(input, slot);
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
    ...pickRecipeOverrides(params, ['radiusPx', 'rangePx', 'durationMs'])
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
    ...pickRecipeOverrides(params, ['radiusPx', 'widthPx', 'durationMs'])
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
  events.push({ type: 'phase-start', attackId: slot.definition.id, slotIndex, phase: nextPhase });

  if (nextPhase === 'windup' || nextPhase === 'channel') {
    requestTelegraph(input, slot, nextPhase);
  }

  if (nextPhase === 'active') {
    requestEffect(input, slot, 'active');
    executeAttack(input, slot);
    slot.executedInPhase = true;
    events.push({ type: 'execute', attackId: slot.definition.id, slotIndex });
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

function executeAttack(input: UpdateAttackHostRuntimeInput, slot: AttackSlotRuntime): void {
  const params = resolveAttackLoadoutSlotParams(slot.slot);
  const target = slot.target;
  const origin = { x: input.host.body.x, y: input.host.body.y };
  const direction = getDirectionToTarget(input, target);
  const damage = getNumberParam(params, 'damage', slot.definition.execution.damage ?? 0) * (input.damageScale ?? 1);
  const radius = getNumberParam(
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
        definitionId: String(params.spawnId ?? params.childId ?? 'scout'),
        count: Math.max(1, Math.trunc(getNumberParam(params, 'count', getNumberParam(params, 'childCount', 1)))),
        x: target?.x ?? origin.x,
        y: target?.y ?? origin.y,
        radius: getNumberParam(params, 'glyphRadiusPx', slot.definition.activeEffect.radiusPx ?? 160)
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

function executeActiveTick(input: UpdateAttackHostRuntimeInput, slot: AttackSlotRuntime): void {
  if (slot.executedInPhase) {
    return;
  }

  requestEffect(input, slot, 'active');
  executeAttack(input, slot);
  slot.executedInPhase = true;
}

function requestTelegraph(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase
): void {
  if (input.telegraphsEnabled === false || slot.definition.telegraph.kind === 'none') {
    return;
  }

  const durationMs = getPhaseDuration(phase, resolveAttackTiming(slot.definition, slot.slot));
  input.callbacks.telegraph?.({
    ...createVisualRequest(input, slot, phase, durationMs),
    telegraph: resolveRuntimeTelegraphRecipe(slot.definition, slot.slot, input)
  });
}

function requestEffect(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase
): void {
  const timing = resolveAttackTiming(slot.definition, slot.slot);
  input.callbacks.effect?.({
    ...createVisualRequest(input, slot, phase, getPhaseDuration('active', timing)),
    effect: resolveRuntimeEffectRecipe(slot.definition, slot.slot, input)
  });
  input.callbacks.labEffect?.({
    ...createVisualRequest(input, slot, phase, getPhaseDuration('active', timing)),
    effect: resolveRuntimeEffectRecipe(slot.definition, slot.slot, input)
  });
}

function createVisualRequest(
  input: UpdateAttackHostRuntimeInput,
  slot: AttackSlotRuntime,
  phase: AttackRuntimePhase,
  durationMs: number
): Omit<AttackVisualRequest, 'telegraph' | 'effect'> {
  const elapsed = Math.max(0, input.time - slot.phaseStartedAt);
  return {
    sourceHostId: input.host.hostId,
    ownerKind: input.host.hostKind,
    attackId: slot.definition.id,
    phase,
    x: input.host.body.x,
    y: input.host.body.y,
    direction: getDirectionToTarget(input, slot.target),
    target: slot.target,
    progress: durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1,
    durationMs
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

    return createAttackTargetSnapshot({
      id: input.host.hostId,
      kind: 'self',
      x: input.host.body.x,
      y: input.host.body.y,
      radius: 32,
      velocity: input.host.velocity,
      label: input.host.definitionId
    });
  }

  if (targetKind === 'point' && input.pointTarget) {
    return createAttackTargetSnapshot(input.pointTarget);
  }

  const allowedKinds = input.targetKindMap?.(targetKind, input.host, definition) ?? [targetKind];
  const candidates = input.targets.filter((target) => allowedKinds.includes(target.kind));
  if (targetKind === 'point' && candidates.length === 0 && input.pointTarget) {
    return createAttackTargetSnapshot(input.pointTarget);
  }

  const inRange = candidates
    .map((target) => ({
      target,
      distanceSq: lengthSq(input.getWrappedDirection(input.host.body.x, input.host.body.y, target.x, target.y))
    }))
    .filter(({ distanceSq }) => distanceSq <= definition.targeting.rangePx * definition.targeting.rangePx);

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

function getDirectionToTarget(input: UpdateAttackHostRuntimeInput, target: AttackTargetSnapshot | undefined): AttackVectorLike {
  if (!target) {
    const rotation = input.host.body.rotation ?? 0;
    return normalize({ x: Math.sin(rotation), y: -Math.cos(rotation) });
  }

  const offset = input.getWrappedDirection(input.host.body.x, input.host.body.y, target.x, target.y);
  if (!input.host.manualTriggerOnly && target.velocity && lengthSq(target.velocity) > 1 && lengthSq(offset) > 1) {
    const projectileSpeed = getNumberParam(
      resolveAttackLoadoutSlotParams(input.host.attacks[0]?.slot ?? { attackId: 'simple-bolt', enabled: true }),
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
  return {
    initialDelayMs: getNumberParam(params, 'initialDelayMs', definition.timing.initialDelayMs),
    cooldownMs: getNumberParam(params, 'cooldownMs', definition.timing.cooldownMs),
    windupMs: getNumberParam(params, 'windupMs', definition.timing.windupMs),
    channelMs: getNumberParam(params, 'channelMs', definition.timing.channelMs ?? 0),
    activeMs: getNumberParam(params, 'activeMs', definition.timing.activeMs ?? 100),
    recoveryMs: getNumberParam(params, 'recoveryMs', definition.timing.recoveryMs)
  };
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
    intensity: getNumberParam(params, 'statusIntensity', statusKind === 'slow' ? 0.65 : 1)
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
