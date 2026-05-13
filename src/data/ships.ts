import type { ContentRegistryEntry } from './contentStatus';

export interface ShipRegistryEntry extends ContentRegistryEntry {
  displayName: string;
}

export const shipRegistry: ShipRegistryEntry[] = [];
