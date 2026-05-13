export type ContentStatus = 'Implemented' | 'MVP' | 'WIP' | 'Future' | 'Disabled' | 'Locked';

export interface ContentRegistryEntry {
  id: string;
  status: ContentStatus;
}

export const contentRegistry: ContentRegistryEntry[] = [];
