import { describe, expect, it } from 'vitest';
import { ENEMY_LAB_DEFINITIONS } from './enemyLabDefinitions';
import {
  ENEMY_ATTACK_DEFINITIONS,
  createDefaultAttackLoadoutSlot,
  getDefaultEnemyAttackLoadout,
  normalizeAttackLoadoutSlots,
  resolveAttackLoadoutSlotParams,
  validateAttackLoadoutSlots,
  validateEnemyAttackRegistry
} from './enemyAttackDefinitions';

describe('enemy attack definitions', () => {
  it('has a valid default loadout for every Enemy Lab definition', () => {
    const errors = validateEnemyAttackRegistry(ENEMY_LAB_DEFINITIONS.map((definition) => definition.id));

    expect(errors).toEqual([]);
  });

  it('keeps attack ids unique', () => {
    const ids = ENEMY_ATTACK_DEFINITIONS.map((definition) => definition.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('merges slot params over attack defaults without mutating registry defaults', () => {
    const loadout = getDefaultEnemyAttackLoadout('reflector');
    const params = resolveAttackLoadoutSlotParams(loadout[0]);

    expect(params.reflect).toBe(true);
    expect(ENEMY_ATTACK_DEFINITIONS.find((definition) => definition.id === 'shield-wall')?.defaultParams.reflect).toBe(false);
  });

  it('returns defensive copies of default loadouts', () => {
    const loadout = getDefaultEnemyAttackLoadout('combat-summoner');
    loadout[1].params = { count: 99 };

    expect(getDefaultEnemyAttackLoadout('combat-summoner')[1].params?.count).toBe(3);
  });

  it('normalizes loadout slots by merging attack defaults with slot params', () => {
    const slot = createDefaultAttackLoadoutSlot('summon-glyphs');
    slot.params = { count: 5 };
    slot.weight = -3;

    const [normalized] = normalizeAttackLoadoutSlots([slot]);

    expect(normalized.params).toMatchObject({
      channelMs: 900,
      count: 5,
      spawnId: 'scout',
      glyphRadiusPx: 220
    });
    expect(normalized.weight).toBe(0);
  });

  it('marks Batch A attacks ready with final default slot params', () => {
    const batchA = ENEMY_ATTACK_DEFINITIONS.filter((definition) => definition.lab.batch === 'A');

    expect(batchA.map((definition) => definition.id)).toEqual([
      'rail-line',
      'mortar-lob',
      'emp-nova',
      'summon-glyphs'
    ]);
    expect(batchA.every((definition) => definition.lab.status === 'ready')).toBe(true);
    expect(createDefaultAttackLoadoutSlot('rail-line').params).toMatchObject({ aimMs: 900, lockMs: 320, rangePx: 1550 });
    expect(createDefaultAttackLoadoutSlot('mortar-lob').params).toMatchObject({ windupMs: 650, travelMs: 850, splashRadiusPx: 150 });
    expect(createDefaultAttackLoadoutSlot('emp-nova').params).toMatchObject({ radiusPx: 230, slowMs: 2400, drag: 0.2 });
    expect(createDefaultAttackLoadoutSlot('summon-glyphs').params).toMatchObject({ channelMs: 900, count: 3, glyphRadiusPx: 220 });
  });

  it('initializes Batch A defaults through enemy loadouts where assigned', () => {
    expect(getDefaultEnemyAttackLoadout('needle-sniper')[0].attackId).toBe('rail-line');
    expect(getDefaultEnemyAttackLoadout('electric-leech')[0].attackId).toBe('emp-nova');
    expect(getDefaultEnemyAttackLoadout('carrier')[0].attackId).toBe('summon-glyphs');
    expect(getDefaultEnemyAttackLoadout('spawner-nest')[0].params).toMatchObject({ spawnId: 'shard-drone', glyphRadiusPx: 180 });
  });

  it('marks Batch B attacks ready with final default slot params', () => {
    const batchB = ENEMY_ATTACK_DEFINITIONS.filter((definition) => definition.lab.batch === 'B');

    expect(batchB.map((definition) => definition.id)).toEqual([
      'sweep-laser',
      'healing-beam',
      'shield-wall',
      'plasma-puddle'
    ]);
    expect(batchB.every((definition) => definition.lab.status === 'ready')).toBe(true);
    expect(createDefaultAttackLoadoutSlot('sweep-laser').params).toMatchObject({ sweepMs: 1300, arcDegrees: 80, damagePerSecond: 28 });
    expect(createDefaultAttackLoadoutSlot('healing-beam').params).toMatchObject({ rangePx: 280, healPerSecond: 13, retargetMs: 250 });
    expect(createDefaultAttackLoadoutSlot('shield-wall').params).toMatchObject({ activeMs: 1200, arcDegrees: 95, reflect: false });
    expect(createDefaultAttackLoadoutSlot('plasma-puddle').params).toMatchObject({ landingMs: 650, durationMs: 3600, tickDamage: 4, slow: 0.25 });
  });

  it('initializes Batch B defaults through enemy loadouts where assigned', () => {
    expect(getDefaultEnemyAttackLoadout('shield-frigate')[0].attackId).toBe('shield-wall');
    expect(getDefaultEnemyAttackLoadout('repair-skiff')[0].attackId).toBe('healing-beam');
    expect(getDefaultEnemyAttackLoadout('reflector')[0].params).toMatchObject({ reflect: true });
    expect(getDefaultEnemyAttackLoadout('frost-gunner')[0].params).toMatchObject({ statusKind: 'frost', slow: 0.25 });
  });

  it('marks Batch C attacks ready with final default slot params', () => {
    const batchC = ENEMY_ATTACK_DEFINITIONS.filter((definition) => definition.lab.batch === 'C');

    expect(batchC.map((definition) => definition.id)).toEqual([
      'cluster-bomb',
      'alarm-ping',
      'berserker-shockwave',
      'mine-reveal'
    ]);
    expect(batchC.every((definition) => definition.lab.status === 'ready')).toBe(true);
    expect(createDefaultAttackLoadoutSlot('cluster-bomb').params).toMatchObject({ travelMs: 800, splitCount: 5, secondaryRadiusPx: 70, delayMs: 420 });
    expect(createDefaultAttackLoadoutSlot('alarm-ping').params).toMatchObject({ detectMs: 700, callDelayMs: 900, squadId: 'scout-pack' });
    expect(createDefaultAttackLoadoutSlot('berserker-shockwave').params).toMatchObject({ radiusPx: 180, knockback: 240, slowMs: 700 });
    expect(createDefaultAttackLoadoutSlot('mine-reveal').params).toMatchObject({ chargeMs: 420, blastRadiusPx: 125, damage: 26 });
  });

  it('initializes Batch C defaults through enemy loadouts where assigned', () => {
    expect(getDefaultEnemyAttackLoadout('ambusher-mine')[0].attackId).toBe('mine-reveal');
    expect(getDefaultEnemyAttackLoadout('berserker')[0].attackId).toBe('berserker-shockwave');
    expect(getDefaultEnemyAttackLoadout('patrol-guard')[0].attackId).toBe('alarm-ping');
    expect(createDefaultAttackLoadoutSlot('cluster-bomb').params).toMatchObject({ radiusPx: 140, secondaryRadiusPx: 70 });
  });

  it('surfaces invalid attack ids through loadout validation', () => {
    const errors = validateAttackLoadoutSlots([
      { attackId: 'unknown-attack' as never, enabled: true }
    ], 'Test loadout');

    expect(errors).toEqual(['Test loadout slot 1 references unknown attack unknown-attack.']);
  });
});
