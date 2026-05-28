import { describe, expect, it } from 'vitest';
import { createDefaultAttackLoadoutSlot, getEnemyAttackDefinition, type AttackLoadoutSlot } from '../data/enemyAttackDefinitions';
import {
  createAttackHostRuntime,
  queueAttackSlot,
  resolveRuntimeTelegraphRecipe,
  updateAttackHostRuntime,
  type AttackAreaDamageRequest,
  type AttackProjectileRequest,
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

  it('queues only the selected manual Attack Tester slot', () => {
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
        { ...createDefaultAttackLoadoutSlot('simple-bolt'), params: { windupMs: 5, initialDelayMs: 0 } }
      ]
    });
    const projectiles: AttackProjectileRequest[] = [];

    queueAttackSlot(runtime, 1, 0);
    updateAttackHostRuntime({
      host: runtime,
      time: 0,
      deltaSeconds: 0.016,
      targets: [enemyTarget],
      targetKindMap: (targetKind) => targetKind === 'player' ? ['enemy'] : [targetKind],
      getWrappedDirection: createDirection,
      callbacks: { spawnProjectile: (request) => projectiles.push(request) }
    });
    updateAttackHostRuntime({
      host: runtime,
      time: 6,
      deltaSeconds: 0.016,
      targets: [enemyTarget],
      targetKindMap: (targetKind) => targetKind === 'player' ? ['enemy'] : [targetKind],
      getWrappedDirection: createDirection,
      callbacks: { spawnProjectile: (request) => projectiles.push(request) }
    });

    expect(projectiles.map((request) => request.attackId)).toEqual(['simple-bolt']);
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
        { attackId: 'mortar-lob', enabled: true, params: { initialDelayMs: 0, windupMs: 0 }, cooldownOffsetMs: 0 },
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

  it('normalizes reduced and high-contrast telegraph recipes', () => {
    const slot = createDefaultAttackLoadoutSlot('rail-line');
    const recipe = resolveRuntimeTelegraphRecipe(
      getEnemyAttackDefinition('rail-line'),
      slot,
      { reducedEffects: true, readabilityMode: 'high-contrast' }
    );

    expect(recipe.color).toBe(0xffffff);
    expect(recipe.strokeWidthPx).toBeGreaterThanOrEqual(3);
  });
});

function createDirection(fromX: number, fromY: number, toX: number, toY: number) {
  return {
    x: toX - fromX,
    y: toY - fromY
  };
}
