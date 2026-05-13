import type { ContentRegistryEntry } from './contentStatus';
import { basicEnemyBalance } from './balance';

export interface EnemyRegistryEntry extends ContentRegistryEntry {
  displayName: string;
  moveSpeed: number;
  hitHalfWidth: number;
  hitHalfLength: number;
}

export const basicEnemy: EnemyRegistryEntry = {
  id: 'basic-enemy',
  displayName: 'Basic Enemy',
  status: 'Implemented',
  moveSpeed: basicEnemyBalance.moveSpeed,
  hitHalfWidth: basicEnemyBalance.hitHalfWidth,
  hitHalfLength: basicEnemyBalance.hitHalfLength
};

export const enemyRegistry: EnemyRegistryEntry[] = [basicEnemy];
