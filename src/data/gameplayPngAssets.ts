import type { ShipId } from './ships';

export interface RuntimePngAsset {
  textureKey: string;
  url: string;
}

export interface PlayerShipSkinAsset extends RuntimePngAsset {
  shipId: ShipId;
  skinId: string;
  displayName: string;
  unlockedByDefault: boolean;
  isDefault: boolean;
}

export interface EnemyVariantAsset extends RuntimePngAsset {
  definitionId: string;
  variantId: string;
  sourcePath: string;
}

const runtimeAssetUrls = import.meta.glob<string>('../assets/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

export const PLAYER_SHIP_SKIN_ASSETS = [
  createPlayerSkin('interceptor', 'interceptor-cyan', 'Cyan', true, true, 'interceptor_default.png', 'default'),
  createPlayerSkin('interceptor', 'interceptor-amber', 'Amber', true, false, 'interceptor_skin_02.png', 'skin-02'),
  createPlayerSkin('interceptor', 'interceptor-ghost', 'Ghost', false, false, 'interceptor_skin_03.png', 'skin-03'),

  createPlayerSkin('bulwark', 'bulwark-teal', 'Teal', true, true, 'bulwark_default.png', 'default'),
  createPlayerSkin('bulwark', 'bulwark-red', 'Redline', true, false, 'bulwark_skin_02.png', 'skin-02'),
  createPlayerSkin('bulwark', 'bulwark-gold', 'Gold', false, false, 'bulwark_skin_03.png', 'skin-03'),

  createPlayerSkin('engineer', 'engineer-green', 'Green', true, true, 'engineer_default.png', 'default'),
  createPlayerSkin('engineer', 'engineer-yellow', 'Yellow', true, false, 'engineer_skin_02.png', 'skin-02'),
  createPlayerSkin('engineer', 'engineer-white', 'White', false, false, 'engineer_skin_03.png', 'skin-03')
] as const satisfies readonly PlayerShipSkinAsset[];

export const ENEMY_VARIANT_ASSETS = [
  ...createEnemyVariants('combat-summoner'),
  ...createEnemyVariants('command-relay'),
  ...createEnemyVariants('diamond-gunner'),
  ...createEnemyVariants('frost-gunner'),
  ...createEnemyVariants('hex-tank'),
  ...createEnemyVariants('impact-bomber'),
  ...createEnemyVariants('needle-sniper'),
  ...createEnemyVariants('phase-skiff'),
  ...createEnemyVariants('poison-leech'),
  ...createEnemyVariants('reactor-drone'),
  ...createEnemyVariants('repair-skiff'),
  ...createEnemyVariants('scout'),
  ...createEnemyVariants('shield-frigate'),
  ...createEnemyVariants('spawner-nest'),
  ...createEnemyVariants('splitter'),
  ...createEnemyVariants('wedge-striker')
] as const satisfies readonly EnemyVariantAsset[];

export function getRuntimePngAssets(): RuntimePngAsset[] {
  return [...PLAYER_SHIP_SKIN_ASSETS, ...ENEMY_VARIANT_ASSETS];
}

export function getPlayerShipSkinAssets(shipId: ShipId): readonly PlayerShipSkinAsset[] {
  return PLAYER_SHIP_SKIN_ASSETS.filter((asset) => asset.shipId === shipId);
}

export function getDefaultPlayerShipSkinAsset(shipId: ShipId): PlayerShipSkinAsset | undefined {
  return getPlayerShipSkinAssets(shipId).find((asset) => asset.isDefault);
}

export function getPlayerShipSkinAsset(shipId: ShipId, skinId?: string): PlayerShipSkinAsset | undefined {
  const shipAssets = getPlayerShipSkinAssets(shipId);
  return (
    shipAssets.find((asset) => asset.skinId === skinId) ??
    shipAssets.find((asset) => asset.isDefault) ??
    shipAssets[0]
  );
}

export function getEnemyVariantAssets(definitionId: string): readonly EnemyVariantAsset[] {
  return ENEMY_VARIANT_ASSETS.filter((asset) => asset.definitionId === definitionId);
}

export function getEnemyVariantAsset(definitionId: string, variantId?: string): EnemyVariantAsset | undefined {
  const variants = getEnemyVariantAssets(definitionId);
  return variants.find((asset) => asset.variantId === variantId);
}

export function getRandomEnemyVariantAsset(
  definitionId: string,
  random: () => number = Math.random
): EnemyVariantAsset | undefined {
  const variants = getEnemyVariantAssets(definitionId);
  if (variants.length <= 0) {
    return undefined;
  }

  const rawRoll = random();
  const roll = Number.isFinite(rawRoll) ? rawRoll : 0;
  const index = Math.min(variants.length - 1, Math.max(0, Math.floor(roll * variants.length)));
  return variants[index];
}

function createPlayerSkin(
  shipId: ShipId,
  skinId: string,
  displayName: string,
  unlockedByDefault: boolean,
  isDefault: boolean,
  fileName: string,
  textureSuffix: string
): PlayerShipSkinAsset {
  const path = `../assets/ships/player/${shipId}/${fileName}`;

  return {
    shipId,
    skinId,
    displayName,
    unlockedByDefault,
    isDefault,
    textureKey: `player-ship-${shipId}-${textureSuffix}`,
    url: resolveRuntimeAssetUrl(path)
  };
}

function createEnemyVariants(definitionId: string): EnemyVariantAsset[] {
  return [1, 2, 3, 4].map((variantNumber) => {
    const variantId = `variant-${String(variantNumber).padStart(2, '0')}`;
    const fileVariant = String(variantNumber).padStart(2, '0');
    const path = `../assets/ships/enemies/${definitionId}/${definitionId}_variant_${fileVariant}.png`;

    return {
      definitionId,
      variantId,
      textureKey: `enemy-ship-${definitionId}-${variantId}`,
      url: resolveRuntimeAssetUrl(path),
      sourcePath: path
    };
  });
}

function resolveRuntimeAssetUrl(path: string): string {
  const url = runtimeAssetUrls[path];
  if (!url) {
    throw new Error(`Missing runtime PNG asset: ${path}`);
  }

  return url;
}
