import { COMBAT_NUMBER_SCALE } from './combatScale';

export const interceptorMovement = {
  thrustAcceleration: 560,
  reverseThrustAcceleration: 335,
  strafeThrustAcceleration: 225,
  rotationSpeed: 3.6,
  brakeDamping: 0.9,
  lowFrictionDamping: 0.992,
  overspeedDamping: 3.2,
  maxSpeed: 500
};

export const pulseCannonBalance = {
  damage: 9,
  cooldownSeconds: 0.18,
  projectileSpeed: 900,
  projectileLifetimeSeconds: 1.4,
  projectileRange: 1100
};

export const rammingShieldBalance = {
  shieldMaxHp: 180 * COMBAT_NUMBER_SCALE,
  shieldRegenDelaySeconds: 3,
  shieldRegenRatePerSecond: 10 * COMBAT_NUMBER_SCALE,
  dashMaxCharges: 3,
  dashChargeRechargeSeconds: 6,
  dashImpulse: 520,
  dashEmpoweredWindowSeconds: 1.5,
  dashRamDamageMultiplier: 3,
  dashRequiresShieldHp: true,
  frontArcDegrees: 108,
  range: 72,
  width: 184,
  baseDamage: 1.2 * COMBAT_NUMBER_SCALE,
  speedDamageMultiplier: 0.018 * COMBAT_NUMBER_SCALE,
  strongRamSpeed: 160,
  maxDamage: 6 * COMBAT_NUMBER_SCALE,
  contactCooldownMs: 450,
  brokenDamageMultiplier: 0.35
};

// Temporary durability for damage-feedback visibility; revisit during balance/polish.
export const basicEnemyBalance = {
  moveSpeed: 95,
  hp: 4 * COMBAT_NUMBER_SCALE,
  hitHalfWidth: 19,
  hitHalfLength: 25
};

export const shooterEnemyBalance = {
  moveSpeed: 72,
  hp: 5 * COMBAT_NUMBER_SCALE,
  preferredRange: 620,
  tooCloseRange: 360,
  fireCooldownSeconds: 2.35,
  projectileSpeed: 360,
  projectileDamage: 12 * COMBAT_NUMBER_SCALE,
  projectileLifetimeSeconds: 3.2,
  projectileRange: 1150,
  hitHalfWidth: 28,
  hitHalfLength: 22,
  xpReward: 18
};

export const tankEnemyBalance = {
  moveSpeed: 42,
  hp: 10 * COMBAT_NUMBER_SCALE,
  hitHalfWidth: 36,
  hitHalfLength: 42,
  contactDamage: 24 * COMBAT_NUMBER_SCALE,
  mass: 9,
  xpReward: 32
};
