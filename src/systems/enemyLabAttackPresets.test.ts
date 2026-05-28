import { describe, expect, it } from 'vitest';
import { DEFAULT_SHIP_ID } from '../data/ships';
import { createDefaultAttackLoadoutSlot } from '../data/enemyAttackDefinitions';
import {
  createEnemyLabAttackLoadoutMarkdown,
  createEnemyLabAttackLoadoutPreset,
  createEnemyLabAttackTestMarkdown,
  createEnemyLabAttackTestPreset,
  parseEnemyLabAttackLoadoutMarkdown,
  parseEnemyLabAttackTestMarkdown
} from './enemyLabAttackPresets';

describe('enemy lab attack presets', () => {
  it('round-trips attack loadout preset slots, labels, params, enabled state, host kind, and host definition id', () => {
    const slot = createDefaultAttackLoadoutSlot('summon-glyphs');
    slot.label = 'Custom Summon Stack';
    slot.cooldownOffsetMs = 450;
    slot.params = { count: 5, spawnId: 'shard-drone' };
    const disabledRail = createDefaultAttackLoadoutSlot('rail-line');
    disabledRail.enabled = false;
    disabledRail.label = 'Disabled Rail Check';

    const preset = createEnemyLabAttackLoadoutPreset({
      id: 'loadout-test',
      displayName: 'Summoner Loadout',
      hostKind: 'enemy',
      hostDefinitionId: 'combat-summoner',
      slots: [slot, disabledRail]
    });
    const parsed = parseEnemyLabAttackLoadoutMarkdown(createEnemyLabAttackLoadoutMarkdown(preset));

    expect(parsed).toMatchObject({
      type: 'starvivors-enemy-lab-attack-loadout',
      version: 1,
      hostKind: 'enemy',
      hostDefinitionId: 'combat-summoner',
      displayName: 'Summoner Loadout'
    });
    expect(parsed?.slots[0]).toMatchObject({
      attackId: 'summon-glyphs',
      enabled: true,
      label: 'Custom Summon Stack',
      cooldownOffsetMs: 450,
      params: {
        channelMs: 900,
        count: 5,
        spawnId: 'shard-drone',
        glyphRadiusPx: 220
      }
    });
    expect(parsed?.slots[1]).toMatchObject({
      attackId: 'rail-line',
      enabled: false,
      label: 'Disabled Rail Check',
      params: {
        aimMs: 900,
        lockMs: 320,
        damage: 30,
        rangePx: 1550
      }
    });
  });

  it('round-trips attack test preset stack, readability, reduced FX, host ship, and target setup', () => {
    const rail = createDefaultAttackLoadoutSlot('rail-line');
    const emp = createDefaultAttackLoadoutSlot('emp-nova');
    emp.enabled = false;

    const preset = createEnemyLabAttackTestPreset({
      id: 'attack-test',
      displayName: 'Rail EMP Stack',
      hostShipId: DEFAULT_SHIP_ID,
      targetSetup: 'dummy',
      readabilityMode: 'high-contrast',
      reducedEffects: true,
      slots: [rail, emp]
    });
    const parsed = parseEnemyLabAttackTestMarkdown(createEnemyLabAttackTestMarkdown(preset));

    expect(parsed).toMatchObject({
      type: 'starvivors-enemy-lab-attack-test',
      version: 1,
      hostKind: 'player-test',
      hostShipId: DEFAULT_SHIP_ID,
      targetSetup: 'dummy',
      readabilityMode: 'high-contrast',
      reducedEffects: true
    });
    expect(parsed?.slots.map((slot) => slot.attackId)).toEqual(['rail-line', 'emp-nova']);
    expect(parsed?.slots[0].params).toMatchObject({ aimMs: 900, lockMs: 320 });
    expect(parsed?.slots[1].enabled).toBe(false);
  });

  it('rejects wrong preset types through type-specific parsers', () => {
    const loadout = createEnemyLabAttackLoadoutPreset({
      id: 'loadout-test',
      displayName: 'Loadout',
      hostKind: 'enemy',
      hostDefinitionId: 'scout',
      slots: [createDefaultAttackLoadoutSlot('contact-ram')]
    });
    const attackTest = createEnemyLabAttackTestPreset({
      id: 'attack-test',
      displayName: 'Attack Test',
      readabilityMode: 'normal',
      reducedEffects: false,
      slots: [createDefaultAttackLoadoutSlot('rail-line')]
    });

    expect(parseEnemyLabAttackLoadoutMarkdown(createEnemyLabAttackTestMarkdown(attackTest))).toBeUndefined();
    expect(parseEnemyLabAttackTestMarkdown(createEnemyLabAttackLoadoutMarkdown(loadout))).toBeUndefined();
  });
});
