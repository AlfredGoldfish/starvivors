import { FORGE_STYLE_GUIDE_VERSION, type ForgeAsset } from '../systems/assetForge';

export interface ForgeAssetRegistryEntry {
  visualAssetId: string;
  asset: ForgeAsset;
  source: 'asset-forge';
  status: 'production-candidate' | 'implemented';
  notes?: string;
}

export const neonBoltProjectileForgeAsset: ForgeAsset = {
  type: 'starvivors-forge-asset',
  version: 1,
  id: 'forge.projectile.neon-bolt-01',
  kind: 'projectile',
  displayName: 'Neon Bolt 01',
  status: 'Implemented',
  tags: ['weapon', 'projectile', 'neon-bolt', 'fast-forward', 'neon-forward-salvagepunk'],
  notes: 'Built-in reusable projectile recipe. Cached at runtime as a Phaser texture; neon plasma read stays dominant over brass rails.',
  styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
  palette: {
    metalDark: 0x071018,
    metalWarm: 0xb0793f,
    neonPrimary: 0x42f5d7,
    neonSecondary: 0x73f2ff,
    warning: 0x42f5d7,
    outline: 0xf2fbff,
    white: 0xf2fbff
  },
  boundsRadius: 15,
  canvasSize: 52,
  layers: [
    { id: 'neon-flight-envelope', type: 'glow', x: 0, y: 0, radius: 17, color: 'neonPrimary', innerAlpha: 0.3, role: 'dominant projectile glow' },
    { id: 'plasma-spear-core', type: 'ellipse', x: 0, y: -0.5, radiusX: 3.8, radiusY: 10.5, color: 'neonSecondary', strokeColor: 'white', strokeWidth: 1, role: 'bright projectile core' },
    { id: 'copper-pressure-rail-left', type: 'line', from: [-7, 4], to: [-3, -8], strokeColor: 'metalWarm', strokeWidth: 2, role: 'salvage rail' },
    { id: 'copper-pressure-rail-right', type: 'line', from: [7, 4], to: [3, -8], strokeColor: 'metalWarm', strokeWidth: 2, role: 'mirrored salvage rail' },
    { id: 'hot-tail-glyph', type: 'polygon', points: [[0, 13], [4.5, 5], [0, 8], [-4.5, 5]], color: 'warning', strokeColor: 'outline', strokeWidth: 0.8, role: 'direction cue' }
  ],
  animation: {
    emissiveFlicker: true,
    trail: 'plasma'
  },
  gameplayHints: {
    assetRole: 'neon-bolt',
    motionProfile: 'fast-forward',
    displayWidth: 28,
    displayHeight: 36,
    hitRadius: 8
  },
  savedAt: '2026-05-23T00:00:00.000Z'
};

export const forgeAssetRegistry: ForgeAssetRegistryEntry[] = [
  {
    visualAssetId: 'forge.projectile.neon-bolt-01',
    asset: neonBoltProjectileForgeAsset,
    source: 'asset-forge',
    status: 'implemented',
    notes: 'Phase 16E built-in cached generic projectile texture; Pulse Cannon is the first runtime consumer.'
  }
];

export function getForgeAssetRegistryEntry(visualAssetId: string): ForgeAssetRegistryEntry | undefined {
  return forgeAssetRegistry.find((entry) => entry.visualAssetId === visualAssetId);
}

export function getForgeAssetDefinition(visualAssetId: string): ForgeAsset | undefined {
  return getForgeAssetRegistryEntry(visualAssetId)?.asset;
}
