import type { ForgeAsset } from '../systems/assetForge';

export interface ForgeAssetRegistryEntry {
  visualAssetId: string;
  asset: ForgeAsset;
  source: 'asset-forge';
  status: 'production-candidate' | 'implemented';
  notes?: string;
}

export const forgeAssetRegistry: ForgeAssetRegistryEntry[] = [];

export function getForgeAssetRegistryEntry(visualAssetId: string): ForgeAssetRegistryEntry | undefined {
  return forgeAssetRegistry.find((entry) => entry.visualAssetId === visualAssetId);
}

export function getForgeAssetDefinition(visualAssetId: string): ForgeAsset | undefined {
  return getForgeAssetRegistryEntry(visualAssetId)?.asset;
}
