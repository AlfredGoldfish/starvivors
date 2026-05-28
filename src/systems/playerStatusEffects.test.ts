import { describe, expect, it, vi } from 'vitest';
import {
  applyPlayerStatusEffects,
  createPlayerStatusEffectRuntime,
  getActivePlayerStatusKinds,
  resolvePlayerStatusMovementModifiers,
  updatePlayerStatusEffects
} from './playerStatusEffects';

describe('player status effects', () => {
  it('refreshes frost by extending duration and keeping the strongest intensity', () => {
    const runtime = createPlayerStatusEffectRuntime();

    applyPlayerStatusEffects(runtime, [{ kind: 'frost', durationMs: 1200, intensity: 0.6 }], 100);
    applyPlayerStatusEffects(runtime, [{ kind: 'frost', durationMs: 900, intensity: 1.2 }], 600);

    expect(runtime.frostUntil).toBe(1500);
    expect(runtime.frostIntensity).toBe(1.2);
    expect(getActivePlayerStatusKinds(runtime, 1200)).toContain('frost');
    expect(resolvePlayerStatusMovementModifiers(runtime, 1200).accelerationScale).toBeLessThan(1);

    updatePlayerStatusEffects({ runtime, time: 1601 });
    expect(getActivePlayerStatusKinds(runtime, 1601)).not.toContain('frost');
  });

  it('applies electric damage on fixed ticks and resets after expiry', () => {
    const runtime = createPlayerStatusEffectRuntime();
    const applyDamage = vi.fn();

    applyPlayerStatusEffects(
      runtime,
      [{ kind: 'electric', durationMs: 1600, intensity: 1.5, damagePerSecond: 6, tickMs: 400 }],
      100
    );

    expect(updatePlayerStatusEffects({ runtime, time: 499, applyDamage })).toBe(0);
    expect(updatePlayerStatusEffects({ runtime, time: 500, applyDamage })).toBeCloseTo(3.6);
    expect(applyDamage.mock.calls[0][0]).toBeCloseTo(3.6);
    expect(updatePlayerStatusEffects({ runtime, time: 1300, applyDamage })).toBeCloseTo(7.2);

    updatePlayerStatusEffects({ runtime, time: 1801, applyDamage });
    expect(runtime.electricDamagePerSecond).toBe(0);
    expect(getActivePlayerStatusKinds(runtime, 1801)).not.toContain('electric');
  });
});
