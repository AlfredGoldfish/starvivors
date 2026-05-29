import { describe, expect, it } from 'vitest';
import {
  ENEMY_ATTACK_DEFINITIONS,
  createDefaultAttackLoadoutSlot
} from './enemyAttackDefinitions';
import {
  ATTACK_VISUAL_GRAMMAR,
  createAttackVisualAuditRows,
  getAttackVisualProfile,
  getAttackVisualProfiles,
  validateAttackVisualProfiles
} from './enemyAttackVisualProfiles';
import {
  resolveRuntimeEffectRecipe,
  resolveRuntimeTelegraphRecipe
} from '../systems/enemyAttackRuntime';

describe('enemy attack visual profiles', () => {
  it('covers every registered attack with a valid visual profile', () => {
    const errors = validateAttackVisualProfiles(ENEMY_ATTACK_DEFINITIONS);
    const attackIds = ENEMY_ATTACK_DEFINITIONS.map((definition) => definition.id);
    const profileIds = getAttackVisualProfiles().map((profile) => profile.attackId);

    expect(errors).toEqual([]);
    expect(profileIds).toEqual(attackIds);
  });

  it('keeps every attack auditable across anticipation, resolve, impact, and recovery beats', () => {
    const rows = createAttackVisualAuditRows(ENEMY_ATTACK_DEFINITIONS);

    expect(rows).toHaveLength(ENEMY_ATTACK_DEFINITIONS.length);
    for (const row of rows) {
      expect(ATTACK_VISUAL_GRAMMAR[row.visualFamily]).toBeDefined();
      expect(row.tellShape.length).toBeGreaterThan(0);
      expect(row.dangerShape.length).toBeGreaterThan(0);
      expect(row.reducedFxFallback.length).toBeGreaterThan(0);
      expect(row.highContrastFallback.length).toBeGreaterThan(0);
      expect(row.nonColorCues.length).toBeGreaterThanOrEqual(2);
      expect(row.screenshotHarnessScenario).toContain(row.attackId);
      expect(row.beats.anticipation.length).toBeGreaterThan(0);
      expect(row.beats.resolve.length).toBeGreaterThan(0);
      expect(row.beats.impact.length).toBeGreaterThan(0);
      expect(row.beats.recovery.length).toBeGreaterThan(0);
    }
  });

  it('provides reduced-FX and high-contrast runtime recipes for every attack', () => {
    for (const definition of ENEMY_ATTACK_DEFINITIONS) {
      const slot = createDefaultAttackLoadoutSlot(definition.id);
      const profile = getAttackVisualProfile(definition.id);
      const reducedTelegraph = resolveRuntimeTelegraphRecipe(definition, slot, {
        reducedEffects: true,
        readabilityMode: 'normal'
      });
      const reducedEffect = resolveRuntimeEffectRecipe(definition, slot, {
        reducedEffects: true,
        readabilityMode: 'normal'
      });
      const highTelegraph = resolveRuntimeTelegraphRecipe(definition, slot, {
        reducedEffects: true,
        readabilityMode: 'high-contrast'
      });
      const highEffect = resolveRuntimeEffectRecipe(definition, slot, {
        reducedEffects: true,
        readabilityMode: 'high-contrast'
      });

      expect(definition.reducedEffects, definition.id).toBeDefined();
      expect(profile.reducedFxFallback.length, definition.id).toBeGreaterThan(0);
      expect(profile.highContrastFallback.length, definition.id).toBeGreaterThan(0);
      expect(reducedTelegraph.strokeWidthPx ?? 0, definition.id).toBeGreaterThan(0);
      expect(reducedEffect.widthPx ?? 0, definition.id).toBeGreaterThan(0);
      expect(highTelegraph.strokeWidthPx ?? 0, definition.id).toBeGreaterThanOrEqual(3);
      expect(highEffect.widthPx ?? 0, definition.id).toBeGreaterThanOrEqual(5);
      expect([0xffffff, 0xffd166], definition.id).toContain(highTelegraph.color);
      expect([0xffffff, 0xffd166], definition.id).toContain(highEffect.color);
      if (highTelegraph.accentColor !== undefined) {
        expect([0xffffff, 0xffd166], definition.id).toContain(highTelegraph.accentColor);
      }
      if (highEffect.accentColor !== undefined) {
        expect([0xffffff, 0xffd166], definition.id).toContain(highEffect.accentColor);
      }
    }
  });
});
