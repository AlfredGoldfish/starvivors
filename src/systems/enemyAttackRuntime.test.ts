import { describe, expect, it } from 'vitest';
import { createDefaultAttackLoadoutSlot, getEnemyAttackDefinition, type AttackLoadoutSlot } from '../data/enemyAttackDefinitions';
import {
  createAttackHostRuntime,
  queueAttackSlot,
  resolveRuntimeEffectRecipe,
  resolveRuntimeTelegraphRecipe,
  updateAttackHostRuntime,
  type AttackAreaDamageRequest,
  type AttackHealRequest,
  type AttackProjectileRequest,
  type AttackShieldRequest,
  type AttackSummonRequest,
  type AttackTargetSnapshot
} from './enemyAttackRuntime';

const playerTarget: AttackTargetSnapshot = {
  id: 'player',
  kind: 'player',
  x: 100,
  y: 0,
  radius: 24,
  velocity: { x: 0, y: 0 },
  hp: 80,
  maxHp: 100
};

const enemyTarget: AttackTargetSnapshot = {
  id: 'enemy-target',
  kind: 'enemy',
  x: 120,
  y: 0,
  radius: 24,
  velocity: { x: 0, y: 0 },
  hp: 80,
  maxHp: 100
};

const allyTarget: AttackTargetSnapshot = {
  id: 'ally',
  kind: 'ally',
  x: 90,
  y: 0,
  radius: 24,
  velocity: { x: 0, y: 0 },
  hp: 40,
  maxHp: 100
};

describe('enemy attack runtime', () => {
  it('initializes normalized slots and skips disabled slots during updates', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'host',
      definitionId: 'scout',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [
        { attackId: 'simple-bolt', enabled: false },
        { attackId: 'unknown' as never, enabled: true },
        { attackId: 'emp-nova', enabled: true, params: { radiusPx: 210, initialDelayMs: 0, windupMs: 0 } }
      ]
    });
    const areaRequests: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 1000,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areaRequests.push(request) }
    });

    expect(runtime.attacks.map((slot) => slot.slot.attackId)).toEqual(['simple-bolt', 'emp-nova']);
    expect(areaRequests).toHaveLength(1);
    expect(areaRequests[0].attackId).toBe('emp-nova');
  });

  it('progresses through windup, active, recovery, and cooldown', () => {
    const slot: AttackLoadoutSlot = {
      attackId: 'simple-bolt',
      enabled: true,
      params: { initialDelayMs: 0, windupMs: 10, activeMs: 15, recoveryMs: 5, cooldownMs: 50 }
    };
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'host',
      definitionId: 'diamond-gunner',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [slot]
    });
    const projectiles: AttackProjectileRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { spawnProjectile: (request) => projectiles.push(request) }
    });
    expect(runtime.attacks[0].phase).toBe('windup');

    updateAttackHostRuntime({
      host: runtime,
      time: 11,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { spawnProjectile: (request) => projectiles.push(request) }
    });
    expect(runtime.attacks[0].phase).toBe('active');
    expect(projectiles).toHaveLength(1);

    updateAttackHostRuntime({
      host: runtime,
      time: 27,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: {}
    });
    expect(runtime.attacks[0].phase).toBe('recovery');

    updateAttackHostRuntime({
      host: runtime,
      time: 33,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: {}
    });
    expect(runtime.attacks[0].phase).toBe('idle');
    expect(runtime.attacks[0].nextReadyAt).toBe(77);
  });

  it('queues only the selected manual Batch A Attack Tester slot', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'player-test',
      hostId: 'player-test',
      definitionId: 'interceptor',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      manualTriggerOnly: true,
      loadout: [
        createDefaultAttackLoadoutSlot('rail-line'),
        { ...createDefaultAttackLoadoutSlot('emp-nova'), params: { windupMs: 5, initialDelayMs: 0 } }
      ]
    });
    const areas: AttackAreaDamageRequest[] = [];

    queueAttackSlot(runtime, 1, 0);
    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [enemyTarget],
      targetKindMap: (targetKind) => targetKind === 'player' ? ['enemy'] : [targetKind],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    updateAttackHostRuntime({
      host: runtime,
      time: 6,
      deltaSeconds: 0.016,
      targets: [enemyTarget],
      targetKindMap: (targetKind) => targetKind === 'player' ? ['enemy'] : [targetKind],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });

    expect(areas.map((request) => request.attackId)).toEqual(['emp-nova']);
    expect(runtime.attacks[0].phase).toBe('idle');
  });

  it('selects player, enemy, ally, point, and self target kinds', () => {
    const pointTarget: AttackTargetSnapshot = { id: 'point', kind: 'point', x: 140, y: 40, radius: 12 };
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'host',
      definitionId: 'mixed-host',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [
        { attackId: 'simple-bolt', enabled: true, params: { initialDelayMs: 0, windupMs: 0 } },
        { attackId: 'healing-beam', enabled: true, params: { initialDelayMs: 0, windupMs: 0, channelMs: 0 }, cooldownOffsetMs: 0 },
        { attackId: 'mortar-lob', enabled: true, params: { initialDelayMs: 0, windupMs: 0, travelMs: 0 }, cooldownOffsetMs: 0 },
        { attackId: 'emp-nova', enabled: true, params: { initialDelayMs: 0, windupMs: 0 }, cooldownOffsetMs: 0 }
      ]
    });
    const projectiles: AttackProjectileRequest[] = [];
    const heals: string[] = [];
    const areas: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [playerTarget, allyTarget],
      pointTarget,
      getWrappedDirection: createDirection,
      callbacks: {
        spawnProjectile: (request) => projectiles.push(request),
        heal: (request) => heals.push(request.targetId),
        areaDamage: (request) => areas.push(request)
      }
    });

    expect(projectiles[0].target?.kind).toBe('player');
    expect(heals).toEqual(['ally']);
    expect(areas.some((request) => request.attackId === 'mortar-lob' && request.x === pointTarget.x && request.y === pointTarget.y)).toBe(true);
    expect(areas.some((request) => request.attackId === 'emp-nova' && request.x === 0 && request.y === 0)).toBe(true);
  });

  it('runs a non-native attack on an enemy host without movement state', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'scout-host',
      definitionId: 'scout',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{ attackId: 'rail-line', enabled: true, params: { initialDelayMs: 0, windupMs: 0 } }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });

    expect(areas).toHaveLength(1);
    expect(areas[0].attackId).toBe('rail-line');
    expect(runtime.definitionId).toBe('scout');
  });

  it('delays mortar lob impact until the projectile travel completes', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'mortar-host',
      definitionId: 'impact-bomber',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{ attackId: 'mortar-lob', enabled: true, params: { initialDelayMs: 0, windupMs: 5, travelMs: 30, activeMs: 30, recoveryMs: 5 } }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      pointTarget: { id: 'point', kind: 'point', x: 160, y: 0, radius: 12 },
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    updateAttackHostRuntime({
      host: runtime,
      time: 6,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      pointTarget: { id: 'point', kind: 'point', x: 160, y: 0, radius: 12 },
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    expect(runtime.attacks[0].phase).toBe('active');
    expect(areas).toHaveLength(0);

    updateAttackHostRuntime({
      host: runtime,
      time: 35,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      pointTarget: { id: 'point', kind: 'point', x: 160, y: 0, radius: 12 },
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    expect(areas).toHaveLength(0);

    updateAttackHostRuntime({
      host: runtime,
      time: 36,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      pointTarget: { id: 'point', kind: 'point', x: 160, y: 0, radius: 12 },
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });

    expect(areas).toHaveLength(1);
    expect(areas[0]).toMatchObject({ attackId: 'mortar-lob', beat: 'impact', x: 160, y: 0 });
    expect(runtime.attacks[0].phase).toBe('recovery');
  });

  it('tracks rail targets during aim and keeps the locked target for resolve', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'sniper-host',
      definitionId: 'needle-sniper',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{ attackId: 'rail-line', enabled: true, params: { initialDelayMs: 0, aimMs: 20, lockMs: 10, activeMs: 5 } }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [{ ...playerTarget, x: 100 }],
      getWrappedDirection: createDirection,
      callbacks: {}
    });
    updateAttackHostRuntime({
      host: runtime,
      time: 10,
      deltaSeconds: 0.016,
      targets: [{ ...playerTarget, x: 200 }],
      getWrappedDirection: createDirection,
      callbacks: {}
    });
    expect(runtime.attacks[0].target?.x).toBe(200);

    updateAttackHostRuntime({
      host: runtime,
      time: 25,
      deltaSeconds: 0.016,
      targets: [{ ...playerTarget, x: 300 }],
      getWrappedDirection: createDirection,
      callbacks: {}
    });
    expect(runtime.attacks[0].target?.x).toBe(200);

    updateAttackHostRuntime({
      host: runtime,
      time: 31,
      deltaSeconds: 0.016,
      targets: [{ ...playerTarget, x: 300 }],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });

    expect(areas).toHaveLength(1);
    expect(areas[0].toX).toBeGreaterThan(0);
  });

  it('healing-beam chooses damaged allies first and retargets on cadence', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'repair-host',
      definitionId: 'repair-skiff',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{
        attackId: 'healing-beam',
        enabled: true,
        params: { initialDelayMs: 0, windupMs: 0, activeMs: 400, tickMs: 100, retargetMs: 100, healPerSecond: 10, rangePx: 300 }
      }]
    });
    const heals: AttackHealRequest[] = [];
    const lowAlly: AttackTargetSnapshot = { ...allyTarget, id: 'ally-low', hp: 20, maxHp: 100 };
    const otherAlly: AttackTargetSnapshot = { ...allyTarget, id: 'ally-other', x: 130, hp: 70, maxHp: 100 };

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [otherAlly, lowAlly],
      getWrappedDirection: createDirection,
      callbacks: { heal: (request) => heals.push(request) }
    });
    updateAttackHostRuntime({
      host: runtime,
      time: 100,
      deltaSeconds: 0.016,
      targets: [{ ...lowAlly, hp: 100 }, { ...otherAlly, hp: 40 }],
      getWrappedDirection: createDirection,
      callbacks: { heal: (request) => heals.push(request) }
    });

    expect(heals.map((request) => request.targetId)).toEqual(['ally-low', 'ally-other']);
    expect(heals[0].amount).toBeCloseTo(1);
  });

  it('sweep-laser produces repeated line damage ticks during sweep timing', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'sweep-host',
      definitionId: 'needle-sniper',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{
        attackId: 'sweep-laser',
        enabled: true,
        params: { initialDelayMs: 0, windupMs: 0, sweepMs: 400, tickMs: 100, damagePerSecond: 20, rangePx: 400, arcDegrees: 60 }
      }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    for (const time of [0, 50, 100, 200]) {
      updateAttackHostRuntime({
        host: runtime,
        time,
        deltaSeconds: 0.016,
        targets: [playerTarget],
        getWrappedDirection: createDirection,
        callbacks: { areaDamage: (request) => areas.push(request) }
      });
    }

    expect(areas).toHaveLength(3);
    expect(areas.every((request) => request.attackId === 'sweep-laser' && request.shape === 'line')).toBe(true);
    expect(areas.map((request) => request.damage)).toEqual([2, 2, 2]);
    expect(areas[0].toY).not.toBe(areas[2].toY);
  });

  it('shield-wall emits shield requests with normal and reflect mode params', () => {
    const normal = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'shield-host',
      definitionId: 'shield-frigate',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{ attackId: 'shield-wall', enabled: true, params: { initialDelayMs: 0, windupMs: 0, activeMs: 800, arcDegrees: 100 } }]
    });
    const reflect = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'reflect-host',
      definitionId: 'reflector',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{ attackId: 'shield-wall', enabled: true, params: { initialDelayMs: 0, windupMs: 0, activeMs: 700, arcDegrees: 120, reflect: true } }]
    });
    const shields: AttackShieldRequest[] = [];

    for (const host of [normal, reflect]) {
      updateAttackHostRuntime({
        host,
        time: 0,
        deltaSeconds: 0.016,
        targets: [playerTarget],
        getWrappedDirection: createDirection,
        callbacks: { shield: (request) => shields.push(request) }
      });
    }

    expect(shields).toMatchObject([
      { sourceHostId: 'shield-host', reflect: false, arcDegrees: 100, durationMs: 800 },
      { sourceHostId: 'reflect-host', reflect: true, arcDegrees: 120, durationMs: 700 }
    ]);
  });

  it('plasma-puddle delays landing, then emits lingering tick damage and status requests', () => {
    const pointTarget: AttackTargetSnapshot = { id: 'point', kind: 'point', x: 160, y: 0, radius: 12 };
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'puddle-host',
      definitionId: 'frost-gunner',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{
        attackId: 'plasma-puddle',
        enabled: true,
        params: { initialDelayMs: 0, landingMs: 50, durationMs: 300, tickMs: 100, tickDamage: 4, slow: 0.25 }
      }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      pointTarget,
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    expect(areas).toHaveLength(0);

    for (const time of [51, 120, 151]) {
      updateAttackHostRuntime({
        host: runtime,
        time,
        deltaSeconds: 0.016,
        targets: [playerTarget],
        pointTarget,
        getWrappedDirection: createDirection,
        callbacks: { areaDamage: (request) => areas.push(request) }
      });
    }

    expect(areas).toHaveLength(2);
    expect(areas[0]).toMatchObject({ attackId: 'plasma-puddle', beat: 'impact', shape: 'circle', x: 160, y: 0, damage: 4 });
    expect(areas[0].statuses?.[0]).toMatchObject({ kind: 'frost', intensity: 0.25 });
  });

  it('cluster-bomb schedules primary impact and delayed secondary split impacts', () => {
    const pointTarget: AttackTargetSnapshot = { id: 'point', kind: 'point', x: 160, y: 0, radius: 12 };
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'cluster-host',
      definitionId: 'impact-bomber',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{
        attackId: 'cluster-bomb',
        enabled: true,
        params: { initialDelayMs: 0, windupMs: 5, travelMs: 30, delayMs: 20, splitCount: 3, secondaryRadiusPx: 44, activeMs: 50 }
      }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    for (const time of [0, 6, 35]) {
      updateAttackHostRuntime({
        host: runtime,
        time,
        deltaSeconds: 0.016,
        targets: [playerTarget],
        pointTarget,
        getWrappedDirection: createDirection,
        callbacks: { areaDamage: (request) => areas.push(request) }
      });
    }
    expect(areas).toHaveLength(0);

    updateAttackHostRuntime({
      host: runtime,
      time: 36,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      pointTarget,
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    expect(areas).toHaveLength(1);
    expect(areas[0]).toMatchObject({ attackId: 'cluster-bomb', beat: 'impact', x: 160, y: 0 });

    updateAttackHostRuntime({
      host: runtime,
      time: 56,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      pointTarget,
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });

    expect(areas).toHaveLength(4);
    expect(areas.slice(1).every((request) => request.attackId === 'cluster-bomb' && request.radius === 44)).toBe(true);
    expect(new Set(areas.slice(1).map((request) => `${request.x},${request.y}`)).size).toBe(3);
  });

  it('alarm-ping waits through detect and call timing before summoning the configured squad id', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'alarm-host',
      definitionId: 'patrol-guard',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{
        attackId: 'alarm-ping',
        enabled: true,
        params: { initialDelayMs: 0, detectMs: 20, callDelayMs: 30, squadId: 'scout-pack', count: 2, radiusPx: 180 }
      }]
    });
    const summons: AttackSummonRequest[] = [];

    for (const time of [0, 21, 49]) {
      updateAttackHostRuntime({
        host: runtime,
        time,
        deltaSeconds: 0.016,
        targets: [playerTarget],
        getWrappedDirection: createDirection,
        callbacks: { summon: (request) => summons.push(request) }
      });
    }
    expect(summons).toHaveLength(0);

    updateAttackHostRuntime({
      host: runtime,
      time: 51,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { summon: (request) => summons.push(request) }
    });

    expect(summons).toMatchObject([
      { attackId: 'alarm-ping', definitionId: 'scout-pack', count: 2, radius: 180 }
    ]);
  });

  it('berserker-shockwave emits self-centered area status with slow and knockback params preserved', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'berserker-host',
      definitionId: 'berserker',
      body: { x: 14, y: 8, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{
        attackId: 'berserker-shockwave',
        enabled: true,
        params: { initialDelayMs: 0, windupMs: 0, radiusPx: 190, knockback: 260, slowMs: 640, slow: 0.5 }
      }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });

    expect(areas).toHaveLength(1);
    expect(areas[0]).toMatchObject({ attackId: 'berserker-shockwave', targetKind: 'self', x: 14, y: 8, radius: 190 });
    expect(areas[0].statuses?.[0]).toMatchObject({ kind: 'slow', durationMs: 640, intensity: 0.5, knockback: 260 });
  });

  it('mine-reveal respects chargeMs and blastRadiusPx before delayed blast damage', () => {
    const runtime = createAttackHostRuntime({
      hostKind: 'enemy',
      hostId: 'mine-host',
      definitionId: 'ambusher-mine',
      body: { x: 0, y: 0, rotation: 0 },
      velocity: { x: 0, y: 0 },
      time: 0,
      loadout: [{
        attackId: 'mine-reveal',
        enabled: true,
        params: { initialDelayMs: 0, chargeMs: 35, blastRadiusPx: 155, damage: 30 }
      }]
    });
    const areas: AttackAreaDamageRequest[] = [];

    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    updateAttackHostRuntime({
      host: runtime,
      time: 34,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });
    expect(areas).toHaveLength(0);

    updateAttackHostRuntime({
      host: runtime,
      time: 36,
      deltaSeconds: 0.016,
      targets: [playerTarget],
      getWrappedDirection: createDirection,
      callbacks: { areaDamage: (request) => areas.push(request) }
    });

    expect(areas).toMatchObject([
      { attackId: 'mine-reveal', shape: 'circle', x: 100, y: 0, radius: 155, damage: 30 }
    ]);
  });

  it('normalizes reduced and high-contrast Batch A telegraph and effect recipes', () => {
    const slot = createDefaultAttackLoadoutSlot('rail-line');
    const recipe = resolveRuntimeTelegraphRecipe(
      getEnemyAttackDefinition('rail-line'),
      slot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );

    expect(recipe.color).toBe(0xffffff);
    expect(recipe.strokeWidthPx).toBeGreaterThanOrEqual(3);

    const mortarSlot = createDefaultAttackLoadoutSlot('mortar-lob');
    mortarSlot.params = { ...(mortarSlot.params ?? {}), splashRadiusPx: 190 };
    const effect = resolveRuntimeEffectRecipe(
      getEnemyAttackDefinition('mortar-lob'),
      mortarSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );
    expect(effect.radiusPx).toBe(190);
    expect(effect.widthPx).toBeGreaterThanOrEqual(5);
  });

  it('normalizes reduced and high-contrast Batch B telegraph and effect recipes', () => {
    const sweepSlot = createDefaultAttackLoadoutSlot('sweep-laser');
    sweepSlot.params = { ...(sweepSlot.params ?? {}), sweepMs: 900, arcDegrees: 70 };
    const sweepTelegraph = resolveRuntimeTelegraphRecipe(
      getEnemyAttackDefinition('sweep-laser'),
      sweepSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );
    const sweepEffect = resolveRuntimeEffectRecipe(
      getEnemyAttackDefinition('sweep-laser'),
      sweepSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );

    expect(sweepTelegraph.strokeWidthPx).toBeGreaterThanOrEqual(4);
    expect(sweepEffect.durationMs).toBe(900);
    expect(sweepEffect.widthPx).toBeGreaterThanOrEqual(7);

    const puddleSlot = createDefaultAttackLoadoutSlot('plasma-puddle');
    puddleSlot.params = { ...(puddleSlot.params ?? {}), landingMs: 400, durationMs: 1200, radiusPx: 160 };
    const puddleTelegraph = resolveRuntimeTelegraphRecipe(
      getEnemyAttackDefinition('plasma-puddle'),
      puddleSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );
    const puddleEffect = resolveRuntimeEffectRecipe(
      getEnemyAttackDefinition('plasma-puddle'),
      puddleSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );

    expect(puddleTelegraph.durationMs).toBe(400);
    expect(puddleEffect.durationMs).toBe(1200);
    expect(puddleEffect.radiusPx).toBe(160);
  });

  it('normalizes reduced and high-contrast Batch C telegraph and effect recipes', () => {
    const clusterSlot = createDefaultAttackLoadoutSlot('cluster-bomb');
    clusterSlot.params = { ...(clusterSlot.params ?? {}), travelMs: 300, delayMs: 160, secondaryRadiusPx: 82 };
    const clusterTelegraph = resolveRuntimeTelegraphRecipe(
      getEnemyAttackDefinition('cluster-bomb'),
      clusterSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );
    const clusterEffect = resolveRuntimeEffectRecipe(
      getEnemyAttackDefinition('cluster-bomb'),
      clusterSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );

    expect(clusterTelegraph.strokeWidthPx).toBeGreaterThanOrEqual(3);
    expect(clusterEffect.durationMs).toBe(460);
    expect(clusterEffect.widthPx).toBeGreaterThanOrEqual(5);

    const alarmSlot = createDefaultAttackLoadoutSlot('alarm-ping');
    alarmSlot.params = { ...(alarmSlot.params ?? {}), detectMs: 260, callDelayMs: 520 };
    const alarmTelegraph = resolveRuntimeTelegraphRecipe(
      getEnemyAttackDefinition('alarm-ping'),
      alarmSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );
    expect(alarmTelegraph.durationMs).toBe(260);
    expect(alarmTelegraph.strokeWidthPx).toBeGreaterThanOrEqual(3);

    const mineSlot = createDefaultAttackLoadoutSlot('mine-reveal');
    mineSlot.params = { ...(mineSlot.params ?? {}), chargeMs: 310, blastRadiusPx: 150 };
    const mineTelegraph = resolveRuntimeTelegraphRecipe(
      getEnemyAttackDefinition('mine-reveal'),
      mineSlot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );
    expect(mineTelegraph.durationMs).toBe(310);
    expect(mineTelegraph.radiusPx).toBe(150);
    expect(mineTelegraph.strokeWidthPx).toBeGreaterThanOrEqual(4);
  });
});

function createDirection(fromX: number, fromY: number, toX: number, toY: number) {
  return {
    x: toX - fromX,
    y: toY - fromY
  };
}
