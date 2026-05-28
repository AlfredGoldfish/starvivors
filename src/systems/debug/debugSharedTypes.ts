export type DebugImpactSourceType = 'player' | 'enemy' | 'asteroid' | 'debris';

export type DebugCollisionShapeScaleKey = 'global' | 'player' | 'enemy' | 'asteroid' | 'debris';
export type DebugCollisionShapeScales = Record<DebugCollisionShapeScaleKey, number>;

export type DebugPhysicsTuningKey =
  | 'globalMaxSpeed'
  | 'globalImpactDamageCap'
  | 'playerImpactDamageCap'
  | 'enemyImpactDamageCap'
  | 'asteroidImpactDamageCap'
  | 'debrisImpactDamageCap'
  | 'playerImpactDamageScale'
  | 'enemyImpactDamageScale'
  | 'asteroidImpactDamageScale'
  | 'debrisImpactDamageScale'
  | 'playerThrustScale'
  | 'playerBrakeScale'
  | 'playerStrafeScale'
  | 'playerInertiaScale'
  | 'enemySpeedScale'
  | 'enemyResponseScale'
  | 'asteroidCollisionDamageScale'
  | 'asteroidCollisionImpulseScale';

export type DebugShipStatKey = 'maxHull' | 'moveSpeed' | 'thrust' | 'brake' | 'strafe' | 'hitRadius';

export type DebugWeaponStatKey =
  | 'damage'
  | 'cooldownSeconds'
  | 'projectileSpeed'
  | 'projectileLifetimeSeconds'
  | 'projectileRange'
  | 'shieldMaxHp'
  | 'shieldRegenDelaySeconds'
  | 'shieldRegenRatePerSecond'
  | 'dashMaxCharges'
  | 'dashChargeRechargeSeconds'
  | 'dashDistance'
  | 'dashDurationSeconds'
  | 'range'
  | 'width'
  | 'guardDamage'
  | 'bashDamage'
  | 'knockback'
  | 'contactCooldownMs'
  | 'tickDamage'
  | 'tickRatePerSecond'
  | 'heatMax'
  | 'heatGainPerSecond'
  | 'coolingPerSecond'
  | 'overheatCoolingPerSecond';
