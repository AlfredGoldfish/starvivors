import type Phaser from 'phaser';
import {
  createForgeAssetTexture,
  FORGE_STYLE_GUIDE_VERSION,
  getForgeTextureKey,
  type ForgeAsset
} from '../systems/assetForge';

export interface ForgeAssetRegistryEntry {
  visualAssetId: string;
  asset: ForgeAsset;
  source: 'asset-forge';
  status: 'production-candidate' | 'implemented';
  notes?: string;
}

const FORGE_REGISTRY_SAVED_AT = '2026-05-23T00:00:00.000Z';

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
  savedAt: FORGE_REGISTRY_SAVED_AT
};

export const interceptorShipForgeAsset: ForgeAsset = {
  type: 'starvivors-forge-asset',
  version: 1,
  id: 'forge.ship.interceptor-01',
  kind: 'ship',
  displayName: 'Interceptor 01',
  status: 'Implemented',
  tags: ['ship', 'interceptor', 'player', 'neon-forward-salvagepunk'],
  notes: 'Built-in player ship recipe for the Interceptor. Neon cyan flight rails dominate over dark salvage armor and copper pressure ribs.',
  styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
  palette: {
    metalDark: 0x071018,
    metalWarm: 0xb0793f,
    neonPrimary: 0x42f5d7,
    neonSecondary: 0xff2fd6,
    warning: 0xffc857,
    outline: 0xf2fbff,
    white: 0xf2fbff
  },
  boundsRadius: 38,
  canvasSize: 96,
  layers: [
    { id: 'cyan-drive-aura', type: 'glow', x: 0, y: 8, radius: 35, color: 'neonPrimary', innerAlpha: 0.26, role: 'dominant neon engine aura' },
    { id: 'main-hull', type: 'polygon', points: [[0, -36], [20, 18], [0, 32], [-20, 18]], color: 'metalDark', strokeColor: 'outline', strokeWidth: 2.2, role: 'dark salvage interceptor hull' },
    { id: 'neon-flight-rail-left', type: 'line', from: [-13, -22], to: [-23, 16], strokeColor: 'neonPrimary', strokeWidth: 3.6, blend: 'lighter', role: 'left cyan flight rail' },
    { id: 'neon-flight-rail-right', type: 'line', from: [13, -22], to: [23, 16], strokeColor: 'neonPrimary', strokeWidth: 3.6, blend: 'lighter', role: 'right cyan flight rail' },
    { id: 'copper-pressure-rib-left', type: 'line', from: [-8, -10], to: [-15, 20], strokeColor: 'metalWarm', strokeWidth: 2.4, role: 'left salvage pressure rib' },
    { id: 'copper-pressure-rib-right', type: 'line', from: [8, -10], to: [15, 20], strokeColor: 'metalWarm', strokeWidth: 2.4, role: 'right salvage pressure rib' },
    { id: 'magenta-reactor-core', type: 'ellipse', x: 0, y: 4, radiusX: 7, radiusY: 12, color: 'neonSecondary', strokeColor: 'white', strokeWidth: 1.3, blend: 'lighter', role: 'bright reactor read' },
    { id: 'amber-nose-glyph', type: 'polygon', points: [[0, -31], [5, -20], [0, -23], [-5, -20]], color: 'warning', strokeColor: 'outline', strokeWidth: 1, role: 'forward warning glyph' }
  ],
  animation: { idlePulse: true, trail: 'ion' },
  gameplayHints: {
    assetRole: 'interceptor-player-ship',
    displayWidth: 118,
    displayHeight: 118,
    hitRadius: 32
  },
  savedAt: FORGE_REGISTRY_SAVED_AT
};

export const scrapShardForgeAsset: ForgeAsset = {
  type: 'starvivors-forge-asset',
  version: 1,
  id: 'forge.pickup.scrap-shard-01',
  kind: 'pickup',
  displayName: 'Scrap Shard 01',
  status: 'Implemented',
  tags: ['pickup', 'scrap', 'tier-1', 'neon-forward-salvagepunk'],
  notes: 'Built-in tier-1 scrap pickup recipe. Bright cyan shard read with a small brass salvage bracket.',
  styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
  palette: {
    metalDark: 0x071018,
    metalWarm: 0xb0793f,
    neonPrimary: 0x73f2ff,
    neonSecondary: 0x42f5d7,
    warning: 0xffc857,
    outline: 0xf2fbff,
    white: 0xf2fbff
  },
  boundsRadius: 15,
  canvasSize: 44,
  layers: [
    { id: 'scrap-neon-aura', type: 'glow', x: 0, y: 0, radius: 17, color: 'neonPrimary', innerAlpha: 0.24, role: 'pickup glow read' },
    { id: 'cyan-shard', type: 'polygon', points: [[0, -13], [9, -2], [3, 13], [-8, 5], [-5, -7]], color: 'neonSecondary', strokeColor: 'white', strokeWidth: 1.4, blend: 'lighter', role: 'neon scrap shard' },
    { id: 'warm-salvage-clamp', type: 'line', from: [-10, 7], to: [7, -8], strokeColor: 'metalWarm', strokeWidth: 2.2, role: 'brass salvage clamp' },
    { id: 'dark-broken-plate', type: 'polygon', points: [[-5, -3], [2, -9], [6, -4], [-1, 2]], color: 'metalDark', strokeColor: 'outline', strokeWidth: 0.8, role: 'dark broken hull chip' }
  ],
  animation: { idlePulse: true, trail: 'scrap' },
  gameplayHints: {
    assetRole: 'tier-1-scrap',
    displayWidth: 30,
    displayHeight: 30,
    pickupTier: 1
  },
  savedAt: FORGE_REGISTRY_SAVED_AT
};

export const scoutEnemyForgeAsset: ForgeAsset = {
  type: 'starvivors-forge-asset',
  version: 1,
  id: 'forge.enemy.scout-01',
  kind: 'enemy',
  displayName: 'Scout 01',
  status: 'Implemented',
  tags: ['enemy', 'scout', 'chaser', 'neon-forward-salvagepunk'],
  notes: 'Built-in Scout enemy recipe promoted from the Forge path. Cyan neon nose and engine fins stay dominant at combat scale.',
  styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
  palette: {
    metalDark: 0x071018,
    metalWarm: 0xb0793f,
    neonPrimary: 0x42f5d7,
    neonSecondary: 0x73f2ff,
    warning: 0xffc857,
    outline: 0xa8fff2,
    white: 0xf2fbff
  },
  boundsRadius: 24,
  canvasSize: 72,
  layers: [
    { id: 'scout-cyan-aura', type: 'glow', x: 0, y: 0, radius: 28, color: 'neonPrimary', innerAlpha: 0.22, role: 'enemy neon signature' },
    { id: 'kite-hull', type: 'polygon', points: [[0, -24], [17, 8], [0, 23], [-17, 8]], color: 'metalDark', strokeColor: 'outline', strokeWidth: 2, role: 'kite salvage hull' },
    { id: 'cyan-nose-rail', type: 'line', from: [0, -23], to: [0, 16], strokeColor: 'neonPrimary', strokeWidth: 4, blend: 'lighter', role: 'dominant chaser cue' },
    { id: 'left-brass-fin', type: 'polygon', points: [[-14, 8], [-28, 17], [-12, 17]], color: 'metalWarm', strokeColor: 'outline', strokeWidth: 1.2, role: 'left salvage fin' },
    { id: 'right-brass-fin', type: 'polygon', points: [[14, 8], [28, 17], [12, 17]], color: 'metalWarm', strokeColor: 'outline', strokeWidth: 1.2, role: 'right salvage fin' },
    { id: 'engine-ion-left', type: 'line', from: [-8, 20], to: [-14, 30], strokeColor: 'neonSecondary', strokeWidth: 3, blend: 'lighter', role: 'left ion exhaust' },
    { id: 'engine-ion-right', type: 'line', from: [8, 20], to: [14, 30], strokeColor: 'neonSecondary', strokeWidth: 3, blend: 'lighter', role: 'right ion exhaust' }
  ],
  animation: { emissiveFlicker: true, trail: 'ion' },
  gameplayHints: {
    assetRole: 'enemy-scout',
    displayWidth: 42,
    displayHeight: 42,
    hitRadius: 20
  },
  savedAt: FORGE_REGISTRY_SAVED_AT
};

export const hudStatusIconForgeAsset: ForgeAsset = {
  type: 'starvivors-forge-asset',
  version: 1,
  id: 'forge.ui-icon.hud-status-01',
  kind: 'ui-icon',
  displayName: 'HUD Status Icon 01',
  status: 'Implemented',
  tags: ['ui-icon', 'hud', 'status', 'neon-forward-salvagepunk'],
  notes: 'Built-in compact HUD icon recipe. Holographic cyan status glyph first, brass instrument frame second.',
  styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
  palette: {
    metalDark: 0x071018,
    metalWarm: 0xb0793f,
    neonPrimary: 0x42f5d7,
    neonSecondary: 0xff2fd6,
    warning: 0xffc857,
    outline: 0xf2fbff,
    white: 0xf2fbff
  },
  boundsRadius: 18,
  canvasSize: 48,
  layers: [
    { id: 'hud-icon-aura', type: 'glow', x: 0, y: 0, radius: 20, color: 'neonPrimary', innerAlpha: 0.22, role: 'holographic UI glow' },
    { id: 'brass-frame', type: 'ring', x: 0, y: 0, radius: 15, strokeColor: 'metalWarm', strokeWidth: 2.4, role: 'instrument frame' },
    { id: 'cyan-status-ring', type: 'ring', x: 0, y: 0, radius: 10, strokeColor: 'neonPrimary', strokeWidth: 2.6, blend: 'lighter', role: 'status ring' },
    { id: 'magenta-signal-bar', type: 'line', from: [-6, 5], to: [6, -7], strokeColor: 'neonSecondary', strokeWidth: 3.2, blend: 'lighter', role: 'status pulse' },
    { id: 'amber-warning-notch', type: 'polygon', points: [[0, -18], [4, -12], [-4, -12]], color: 'warning', strokeColor: 'outline', strokeWidth: 0.8, role: 'warning notch' }
  ],
  animation: { idlePulse: true },
  gameplayHints: {
    assetRole: 'hud-status',
    iconSize: 28
  },
  savedAt: FORGE_REGISTRY_SAVED_AT
};

export const forgeAssetRegistry: ForgeAssetRegistryEntry[] = [
  {
    visualAssetId: 'forge.ship.interceptor-01',
    asset: interceptorShipForgeAsset,
    source: 'asset-forge',
    status: 'implemented',
    notes: 'Phase 16F built-in cached player ship texture for Interceptor.'
  },
  {
    visualAssetId: 'forge.pickup.scrap-shard-01',
    asset: scrapShardForgeAsset,
    source: 'asset-forge',
    status: 'implemented',
    notes: 'Phase 16F built-in cached tier-1 scrap pickup texture.'
  },
  {
    visualAssetId: 'forge.enemy.scout-01',
    asset: scoutEnemyForgeAsset,
    source: 'asset-forge',
    status: 'implemented',
    notes: 'Phase 16F built-in cached Scout enemy texture.'
  },
  {
    visualAssetId: 'forge.projectile.neon-bolt-01',
    asset: neonBoltProjectileForgeAsset,
    source: 'asset-forge',
    status: 'implemented',
    notes: 'Phase 16E built-in cached generic projectile texture; Pulse Cannon is the first runtime consumer.'
  },
  {
    visualAssetId: 'forge.ui-icon.hud-status-01',
    asset: hudStatusIconForgeAsset,
    source: 'asset-forge',
    status: 'implemented',
    notes: 'Phase 16F built-in cached HUD status icon texture.'
  }
];

export function getForgeAssetRegistryEntry(visualAssetId: string): ForgeAssetRegistryEntry | undefined {
  return forgeAssetRegistry.find((entry) => entry.visualAssetId === visualAssetId);
}

export function getForgeAssetDefinition(visualAssetId: string): ForgeAsset | undefined {
  return getForgeAssetRegistryEntry(visualAssetId)?.asset;
}

export function createForgeRegistryTextures(scene: Phaser.Scene): void {
  for (const entry of forgeAssetRegistry) {
    createForgeAssetTexture(scene, entry.asset, getForgeTextureKey(entry.asset.id));
  }
}

export function resolveForgeTextureKey(scene: Phaser.Scene, visualAssetId: string | undefined, fallbackTextureKey: string): string {
  if (!visualAssetId) {
    return fallbackTextureKey;
  }

  const asset = getForgeAssetDefinition(visualAssetId);
  if (!asset) {
    return fallbackTextureKey;
  }

  const textureKey = getForgeTextureKey(asset.id);
  if (!scene.textures.exists(textureKey)) {
    createForgeAssetTexture(scene, asset, textureKey);
  }

  return scene.textures.exists(textureKey) ? textureKey : fallbackTextureKey;
}
