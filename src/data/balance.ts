import { PLAYER_WEAPON_DAMAGE_VARIANCE } from './damageVariance';

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
  damage: 4,
  cooldownSeconds: 0.18,
  projectileSpeed: 900,
  projectileLifetimeSeconds: 1.4,
  projectileRange: 1100
};

export const rammingShieldBalance = {
  shieldMaxHp: 35,
  shieldRegenDelaySeconds: 2.5,
  shieldRegenRatePerSecond: 3,
  dashMaxCharges: 3,
  dashChargeRechargeSeconds: 6,
  dashDistance: 96,
  dashDurationSeconds: 0.12,
  dashRequiresShieldHp: true,
  frontArcDegrees: 108,
  range: 72,
  width: 184,
  guardDamage: 2,
  bashDamage: 8,
  damageVariance: PLAYER_WEAPON_DAMAGE_VARIANCE,
  knockback: 140,
  contactCooldownMs: 450,
  behaviorFlags: [] as string[]
};

export const basicEnemyBalance = {
  moveSpeed: 95,
  hp: 12,
  hitHalfWidth: 19,
  hitHalfLength: 25
};

export const shooterEnemyBalance = {
  moveSpeed: 72,
  hp: 18,
  preferredRange: 620,
  tooCloseRange: 360,
  fireCooldownSeconds: 2.35,
  projectileSpeed: 360,
  projectileDamage: 8,
  projectileLifetimeSeconds: 3.2,
  projectileRange: 1150,
  hitHalfWidth: 28,
  hitHalfLength: 22,
  xpReward: 18
};

export const tankEnemyBalance = {
  moveSpeed: 42,
  hp: 45,
  hitHalfWidth: 36,
  hitHalfLength: 42,
  contactDamage: 15,
  xpReward: 32
};
