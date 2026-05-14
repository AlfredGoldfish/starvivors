export const interceptorMovement = {
  thrustAcceleration: 560,
  reverseThrustAcceleration: 335,
  strafeThrustAcceleration: 225,
  rotationSpeed: 3.6,
  brakeDamping: 0.9,
  lowFrictionDamping: 0.995,
  maxSpeed: 500
};

export const pulseCannonBalance = {
  cooldownSeconds: 1.25,
  projectileSpeed: 980,
  projectileLifetimeSeconds: 1.4,
  projectileRange: 1300
};

export const basicEnemyBalance = {
  moveSpeed: 95,
  hitHalfWidth: 19,
  hitHalfLength: 25
};

export const shooterEnemyBalance = {
  moveSpeed: 72,
  preferredRange: 620,
  tooCloseRange: 360,
  fireCooldownSeconds: 2.35,
  projectileSpeed: 360,
  projectileDamage: 12,
  projectileLifetimeSeconds: 3.2,
  projectileRange: 1150,
  hitHalfWidth: 28,
  hitHalfLength: 22,
  xpReward: 18
};
