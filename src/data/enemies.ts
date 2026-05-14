import type { ContentRegistryEntry } from './contentStatus';
import { basicEnemyBalance, shooterEnemyBalance, tankEnemyBalance } from './balance';

export interface EnemyRegistryEntry extends ContentRegistryEntry {
  displayName: string;
  moveSpeed: number;
  hp: number;
  hitHalfWidth: number;
  hitHalfLength: number;
}

export const basicEnemy: EnemyRegistryEntry = {
  id: 'basic-enemy',
  displayName: 'Basic Enemy',
  status: 'Implemented',
  moveSpeed: basicEnemyBalance.moveSpeed,
  hp: basicEnemyBalance.hp,
  hitHalfWidth: basicEnemyBalance.hitHalfWidth,
  hitHalfLength: basicEnemyBalance.hitHalfLength
};

export const shooterEnemy: EnemyRegistryEntry = {
  id: 'shooter-enemy',
  displayName: 'Shooter Enemy',
  status: 'Implemented',
  moveSpeed: shooterEnemyBalance.moveSpeed,
  hp: shooterEnemyBalance.hp,
  hitHalfWidth: shooterEnemyBalance.hitHalfWidth,
  hitHalfLength: shooterEnemyBalance.hitHalfLength
};

export const tankEnemy: EnemyRegistryEntry = {
  id: 'tank-enemy',
  displayName: 'Tank Enemy',
  status: 'Implemented',
  moveSpeed: tankEnemyBalance.moveSpeed,
  hp: tankEnemyBalance.hp,
  hitHalfWidth: tankEnemyBalance.hitHalfWidth,
  hitHalfLength: tankEnemyBalance.hitHalfLength
};

export const enemyRegistry: EnemyRegistryEntry[] = [basicEnemy, shooterEnemy, tankEnemy];
