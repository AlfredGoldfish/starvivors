import Phaser from 'phaser';
import { DebugState } from './debugState';

export interface DebugHotkeyKeys {
  ringColor: Phaser.Input.Keyboard.Key;
  pulseDamageDecrease: Phaser.Input.Keyboard.Key;
  pulseDamageIncrease: Phaser.Input.Keyboard.Key;
  pulseFireRateDecrease: Phaser.Input.Keyboard.Key;
  pulseFireRateIncrease: Phaser.Input.Keyboard.Key;
  pulseReset: Phaser.Input.Keyboard.Key;
}

export function updateDebugWeaponHotkeys(
  debugState: DebugState,
  keys: DebugHotkeyKeys,
  damageStep: number,
  fireRateStep: number
): void {
  if (Phaser.Input.Keyboard.JustDown(keys.ringColor)) {
    debugState.cycleBlackHoleRingDebugColorMode();
    return;
  }

  if (Phaser.Input.Keyboard.JustDown(keys.pulseDamageDecrease)) {
    debugState.adjustPulseDamageMultiplier(-damageStep);
  } else if (Phaser.Input.Keyboard.JustDown(keys.pulseDamageIncrease)) {
    debugState.adjustPulseDamageMultiplier(damageStep);
  } else if (Phaser.Input.Keyboard.JustDown(keys.pulseFireRateDecrease)) {
    debugState.adjustPulseFireRateMultiplier(-fireRateStep);
  } else if (Phaser.Input.Keyboard.JustDown(keys.pulseFireRateIncrease)) {
    debugState.adjustPulseFireRateMultiplier(fireRateStep);
  } else if (Phaser.Input.Keyboard.JustDown(keys.pulseReset)) {
    debugState.resetWeaponTuning();
  }
}
