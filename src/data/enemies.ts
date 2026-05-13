import type { ContentRegistryEntry } from './contentStatus';
import { basicEnemyBalance } from './balance';

export interface EnemyRegistryEntry extends ContentRegistryEntry {
  displayName: string;
  moveSpeed: number;
  hitRadius: number;
}

export const basicEnemy: EnemyRegistryEntry = {
  id: 'basic-enemy',
  displayName: 'Basic Enemy',
  status: 'Implemented',
  moveSpeed: basicEnemyBalance.moveSpeed,
  hitRadius: basicEnemyBalance.hitRadius
};

export const enemyRegistry: EnemyRegistryEntry[] = [basicEnemy];
