export interface DamageVariance {
  min: number;
  max: number;
}

export const PLAYER_WEAPON_DAMAGE_VARIANCE: DamageVariance = { min: 0.9, max: 1.1 };
export const ENEMY_PROJECTILE_DAMAGE_VARIANCE: DamageVariance = { min: 0.92, max: 1.08 };
export const ENEMY_CONTACT_DAMAGE_VARIANCE: DamageVariance = { min: 0.95, max: 1.05 };
export const ASTEROID_IMPACT_DAMAGE_VARIANCE: DamageVariance = { min: 0.92, max: 1.08 };
export const BLACK_HOLE_DAMAGE_VARIANCE: DamageVariance = { min: 0.97, max: 1.03 };
export const DAMAGE_OVER_TIME_VARIANCE: DamageVariance = { min: 0.97, max: 1.03 };

export function rollDamage(
  baseDamage: number,
  variance: DamageVariance,
  random: () => number = Math.random
): number {
  if (baseDamage <= 0) {
    return 0;
  }

  const min = Math.min(variance.min, variance.max);
  const max = Math.max(variance.min, variance.max);
  return baseDamage * (min + (max - min) * random());
}
