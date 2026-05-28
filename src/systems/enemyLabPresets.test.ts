import { describe, expect, it, vi } from 'vitest';
import {
  parseEnemySquadPresetMarkdown,
  parseEnemyVariantPresetMarkdown
} from './enemyLabPresets';

vi.mock('./assetForge', () => ({
  FORGE_STYLE_GUIDE_VERSION: 'test-style',
  createForgeAiBrief: vi.fn(() => '# Forge Brief'),
  getNeonForwardSalvagepunkStyleGuide: vi.fn(() => ({
    displayName: 'Test Style',
    summary: 'Test style summary.',
    rules: []
  })),
  parseForgeAssetImport: vi.fn(() => undefined)
}));

describe('enemy lab presets', () => {
  it('normalizes v1 variant imports to v2 without an attack override', () => {
    const preset = parseEnemyVariantPresetMarkdown(markdown({
      type: 'starvivors-enemy-lab-variant',
      version: 1,
      id: 'scout-v1',
      baseDefinitionId: 'scout',
      displayName: 'Scout V1',
      status: 'Idea',
      tags: ['legacy'],
      notes: 'old preset',
      savedAt: '2026-05-28T00:00:00.000Z',
      visualOverrides: {},
      statOverrides: {},
      behaviorParamOverrides: {}
    }));

    expect(preset).toMatchObject({
      type: 'starvivors-enemy-lab-variant',
      version: 2,
      id: 'scout-v1',
      baseDefinitionId: 'scout',
      displayName: 'Scout V1'
    });
    expect(preset?.attackLoadoutOverride).toBeUndefined();
  });

  it('normalizes v1 squad entries without attack overrides', () => {
    const preset = parseEnemySquadPresetMarkdown(markdown({
      type: 'starvivors-enemy-lab-squad',
      version: 1,
      id: 'squad-v1',
      displayName: 'Squad V1',
      status: 'Idea',
      tags: [],
      notes: '',
      savedAt: '2026-05-28T00:00:00.000Z',
      entries: [
        { definitionId: 'scout', x: 10, y: 20 },
        { definitionId: 'diamond-gunner', x: -30, y: 40, spawnDelayMs: 250 }
      ]
    }));

    expect(preset?.version).toBe(2);
    expect(preset?.entries).toHaveLength(2);
    expect(preset?.entries[0].attackLoadoutOverride).toBeUndefined();
    expect(preset?.entries[1]).toMatchObject({ definitionId: 'diamond-gunner', spawnDelayMs: 250 });
  });

  it('preserves v2 variant attack overrides and defensively normalizes slot params', () => {
    const preset = parseEnemyVariantPresetMarkdown(markdown({
      type: 'starvivors-enemy-lab-variant',
      version: 2,
      id: 'summoner-v2',
      baseDefinitionId: 'combat-summoner',
      displayName: 'Summoner V2',
      status: 'Candidate',
      tags: [],
      notes: '',
      savedAt: '2026-05-28T00:00:00.000Z',
      visualOverrides: {},
      statOverrides: {},
      behaviorParamOverrides: {},
      attackLoadoutOverride: [
        {
          attackId: 'summon-glyphs',
          enabled: true,
          weight: -2,
          params: {
            count: 4,
            channelMs: 'bad-type',
            spawnId: 'shard-drone',
            nested: { bad: true }
          }
        }
      ]
    }));

    expect(preset?.attackLoadoutOverride?.[0]).toMatchObject({
      attackId: 'summon-glyphs',
      weight: 0,
      params: {
        channelMs: 900,
        count: 4,
        spawnId: 'shard-drone',
        glyphRadiusPx: 220
      }
    });
    expect(preset?.attackLoadoutOverride?.[0].params).not.toHaveProperty('nested');
  });

  it('preserves v2 squad entry attack overrides', () => {
    const preset = parseEnemySquadPresetMarkdown(markdown({
      type: 'starvivors-enemy-lab-squad',
      version: 2,
      id: 'squad-v2',
      displayName: 'Squad V2',
      status: 'Idea',
      tags: [],
      notes: '',
      savedAt: '2026-05-28T00:00:00.000Z',
      entries: [
        {
          definitionId: 'reflector',
          x: 0,
          y: 0,
          attackLoadoutOverride: [
            {
              attackId: 'shield-wall',
              enabled: true,
              params: { reflect: true, activeMs: 900 }
            }
          ]
        }
      ]
    }));

    expect(preset?.entries[0].attackLoadoutOverride?.[0]).toMatchObject({
      attackId: 'shield-wall',
      params: {
        reflect: true,
        activeMs: 900
      }
    });
  });

  it('rejects wrong preset types through type-specific parsers', () => {
    const variantMarkdown = markdown({
      type: 'starvivors-enemy-lab-variant',
      version: 2,
      id: 'variant',
      baseDefinitionId: 'scout',
      displayName: 'Variant',
      status: 'Idea',
      tags: [],
      notes: '',
      savedAt: '2026-05-28T00:00:00.000Z',
      visualOverrides: {},
      statOverrides: {},
      behaviorParamOverrides: {}
    });
    const squadMarkdown = markdown({
      type: 'starvivors-enemy-lab-squad',
      version: 2,
      id: 'squad',
      displayName: 'Squad',
      status: 'Idea',
      tags: [],
      notes: '',
      savedAt: '2026-05-28T00:00:00.000Z',
      entries: []
    });

    expect(parseEnemyVariantPresetMarkdown(squadMarkdown)).toBeUndefined();
    expect(parseEnemySquadPresetMarkdown(variantMarkdown)).toBeUndefined();
  });
});

function markdown(data: object): string {
  return [
    '# Preset',
    '',
    '```json',
    JSON.stringify(data, null, 2),
    '```',
    ''
  ].join('\n');
}
