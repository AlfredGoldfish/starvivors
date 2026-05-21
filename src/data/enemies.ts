import type { ContentRegistryEntry } from './contentStatus';
import { basicEnemyBalance, shooterEnemyBalance, tankEnemyBalance } from './balance';
import {
  ENEMY_CONTACT_DAMAGE_VARIANCE,
  ENEMY_PROJECTILE_DAMAGE_VARIANCE,
  type DamageVariance
} from './damageVariance';

export type EnemyId = 'basic-enemy' | 'shooter-enemy' | 'tank-enemy';

export interface EnemyStatProfile {
  maxHull: number;
  defense: number;
  moveSpeed: number;
  acceleration: number;
  turnRate: number;
  blackHoleResistance: number;
  blackHoleMaxSpeed: number;
  contactDamage: number;
  contactDamageVariance?: DamageVariance;
  collisionKnockback: number;
  attackDamage: number;
  attackDamageVariance?: DamageVariance;
  attackCooldown: number;
  projectileSpeed: number;
  projectileSize: number;
  projectileLifetimeSeconds: number;
  projectileRange: number;
  attackRange: number;
  preferredRange: number;
  retreatThreshold: number;
  aggression: number;
  strafeBias: number;
  orbitBias: number;
  burstCount: number;
  spread: number;
  xpValue: number;
  scrapDropChance: number;
  scrapValue: number;
  hitHalfWidth: number;
  hitHalfLength: number;
}

export interface EnemyRegistryEntry extends ContentRegistryEntry {
  id: EnemyId;
  displayName: string;
  stats: EnemyStatProfile;
}

export const basicEnemy: EnemyRegistryEntry = {
  id: 'basic-enemy',
  displayName: 'Basic Enemy',
  status: 'Implemented',
  stats: {
    maxHull: basicEnemyBalance.hp,
    defense: 0,
    moveSpeed: basicEnemyBalance.moveSpeed,
    acceleration: basicEnemyBalance.moveSpeed,
    turnRate: 4.4,
    blackHoleResistance: 0.34,
    blackHoleMaxSpeed: 440,
    contactDamage: 6,
    contactDamageVariance: ENEMY_CONTACT_DAMAGE_VARIANCE,
    collisionKnockback: 1,
    attackDamage: 0,
    attackCooldown: 0,
    projectileSpeed: 0,
    projectileSize: 0,
    projectileLifetimeSeconds: 0,
    projectileRange: 0,
    attackRange: 0,
    preferredRange: 0,
    retreatThreshold: 0,
    aggression: 1,
    strafeBias: 0,
    orbitBias: 0,
    burstCount: 0,
    spread: 0,
    xpValue: 10,
    scrapDropChance: 1,
    scrapValue: 3,
    hitHalfWidth: basicEnemyBalance.hitHalfWidth,
    hitHalfLength: basicEnemyBalance.hitHalfLength
  }
};

export const shooterEnemy: EnemyRegistryEntry = {
  id: 'shooter-enemy',
  displayName: 'Shooter Enemy',
  status: 'Implemented',
  stats: {
    maxHull: shooterEnemyBalance.hp,
    defense: 0,
    moveSpeed: shooterEnemyBalance.moveSpeed,
    acceleration: shooterEnemyBalance.moveSpeed,
    turnRate: 3.2,
    blackHoleResistance: 0.38,
    blackHoleMaxSpeed: 380,
    contactDamage: 5,
    contactDamageVariance: ENEMY_CONTACT_DAMAGE_VARIANCE,
    collisionKnockback: 0.85,
    attackDamage: shooterEnemyBalance.projectileDamage,
    attackDamageVariance: ENEMY_PROJECTILE_DAMAGE_VARIANCE,
    attackCooldown: shooterEnemyBalance.fireCooldownSeconds,
    projectileSpeed: shooterEnemyBalance.projectileSpeed,
    projectileSize: 9,
    projectileLifetimeSeconds: shooterEnemyBalance.projectileLifetimeSeconds,
    projectileRange: shooterEnemyBalance.projectileRange,
    attackRange: shooterEnemyBalance.projectileRange,
    preferredRange: shooterEnemyBalance.preferredRange,
    retreatThreshold: shooterEnemyBalance.tooCloseRange,
    aggression: 0.72,
    strafeBias: 0,
    orbitBias: 0,
    burstCount: 1,
    spread: 0,
    xpValue: shooterEnemyBalance.xpReward,
    scrapDropChance: 1,
    scrapValue: 6,
    hitHalfWidth: shooterEnemyBalance.hitHalfWidth,
    hitHalfLength: shooterEnemyBalance.hitHalfLength
  }
};

export const tankEnemy: EnemyRegistryEntry = {
  id: 'tank-enemy',
  displayName: 'Tank Enemy',
  status: 'Implemented',
  stats: {
    maxHull: tankEnemyBalance.hp,
    defense: 0,
    moveSpeed: tankEnemyBalance.moveSpeed,
    acceleration: tankEnemyBalance.moveSpeed,
    turnRate: 2.1,
    blackHoleResistance: 0.44,
    blackHoleMaxSpeed: 320,
    contactDamage: tankEnemyBalance.contactDamage,
    contactDamageVariance: ENEMY_CONTACT_DAMAGE_VARIANCE,
    collisionKnockback: 1.25,
    attackDamage: 0,
    attackCooldown: 0,
    projectileSpeed: 0,
    projectileSize: 0,
    projectileLifetimeSeconds: 0,
    projectileRange: 0,
    attackRange: 0,
    preferredRange: 0,
    retreatThreshold: 0,
    aggression: 0.9,
    strafeBias: 0,
    orbitBias: 0,
    burstCount: 0,
    spread: 0,
    xpValue: tankEnemyBalance.xpReward,
    scrapDropChance: 1,
    scrapValue: 14,
    hitHalfWidth: tankEnemyBalance.hitHalfWidth,
    hitHalfLength: tankEnemyBalance.hitHalfLength
  }
};

export const enemyRegistry: EnemyRegistryEntry[] = [basicEnemy, shooterEnemy, tankEnemy];
