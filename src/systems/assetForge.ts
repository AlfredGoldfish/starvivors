import Phaser from 'phaser';
import type { EnemyLabDefinition, EnemyVisualDefinition } from '../data/enemyLabDefinitions';

export const FORGE_STYLE_GUIDE_VERSION = 'neon-forward-salvagepunk-v1';
export const ASSET_FORGE_STORAGE_KEY = 'starvivors.assetForge.v1';
export const FORGE_TEXTURE_PREFIX = 'asset-forge';

export type ForgeAssetKind =
  | 'enemy'
  | 'ship'
  | 'weapon'
  | 'projectile'
  | 'beam'
  | 'effect'
  | 'pickup'
  | 'ui-icon'
  | 'radar-icon'
  | 'telegraph';

export type ForgeAssetStatus =
  | 'Generated'
  | 'Idea'
  | 'Visual Pass'
  | 'Behavior Pass'
  | 'Needs Tuning'
  | 'Playable Candidate'
  | 'Approved Visual'
  | 'Approved Gameplay'
  | 'Promoted'
  | 'Rejected'
  | 'Implemented';

export interface ForgeStyleGuide {
  id: typeof FORGE_STYLE_GUIDE_VERSION;
  displayName: string;
  summary: string;
  paletteRatio: string;
  rules: string[];
  avoid: string[];
  examples: Record<string, string[]>;
}

export interface ForgePalette {
  metalDark: number;
  metalWarm: number;
  neonPrimary: number;
  neonSecondary: number;
  warning: number;
  outline: number;
  white: number;
}

interface ForgeBaseLayer {
  id: string;
  role?: string;
  color?: keyof ForgePalette | number;
  alpha?: number;
  strokeColor?: keyof ForgePalette | number;
  strokeAlpha?: number;
  strokeWidth?: number;
  blend?: 'source-over' | 'lighter';
}

export interface ForgePolygonLayer extends ForgeBaseLayer {
  type: 'polygon';
  points: Array<[number, number]>;
  fill?: boolean;
}

export interface ForgeLineLayer extends ForgeBaseLayer {
  type: 'line';
  from: [number, number];
  to: [number, number];
}

export interface ForgeEllipseLayer extends ForgeBaseLayer {
  type: 'ellipse';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation?: number;
  fill?: boolean;
}

export interface ForgeRingLayer extends ForgeBaseLayer {
  type: 'ring';
  x: number;
  y: number;
  radius: number;
}

export interface ForgeRectLayer extends ForgeBaseLayer {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ForgeGlowLayer extends ForgeBaseLayer {
  type: 'glow';
  x: number;
  y: number;
  radius: number;
  innerAlpha?: number;
}

export interface ForgeCrescentLayer extends ForgeBaseLayer {
  type: 'crescent';
  radius: number;
}

export interface ForgePathLayer extends ForgeBaseLayer {
  type: 'path';
  d: string;
  fill?: boolean;
}

export type ForgeVectorLayer =
  | ForgePolygonLayer
  | ForgeLineLayer
  | ForgeEllipseLayer
  | ForgeRingLayer
  | ForgeRectLayer
  | ForgeGlowLayer
  | ForgeCrescentLayer
  | ForgePathLayer;

export interface ForgeAnimationRecipe {
  idlePulse?: boolean;
  emissiveFlicker?: boolean;
  trail?: 'none' | 'spark' | 'ion' | 'plasma' | 'scrap';
}

export interface ForgeAsset {
  type: 'starvivors-forge-asset';
  version: 1;
  id: string;
  kind: ForgeAssetKind;
  displayName: string;
  status: ForgeAssetStatus;
  tags: string[];
  notes: string;
  styleGuideVersion: typeof FORGE_STYLE_GUIDE_VERSION;
  palette: ForgePalette;
  boundsRadius: number;
  canvasSize: number;
  layers: ForgeVectorLayer[];
  animation?: ForgeAnimationRecipe;
  gameplayHints?: Record<string, unknown>;
  savedAt: string;
}

export interface ForgePromotionBundle {
  type: 'starvivors-forge-promotion-bundle';
  version: 1;
  styleGuideVersion: typeof FORGE_STYLE_GUIDE_VERSION;
  asset: ForgeAsset;
  svg: string;
  productionHints: Record<string, unknown>;
  savedAt: string;
}

export interface AssetForgeStorageState {
  assets: ForgeAsset[];
}

export interface ForgeAiBriefInput {
  targetLabel: string;
  targetKind: ForgeAssetKind;
  selectedAsset?: ForgeAsset;
  context?: string;
  requestedWork?: string;
}

export function getNeonForwardSalvagepunkStyleGuide(): ForgeStyleGuide {
  return {
    id: FORGE_STYLE_GUIDE_VERSION,
    displayName: 'Neon-Forward Salvagepunk',
    summary:
      'Cyberpunk neon energy dominates the first read, while repaired salvage and space-steampunk machinery provide structure, texture, and silhouette.',
    paletteRatio: '45% dark metal, 15% warm industrial metal, 30% neon energy, 10% bright warning/highlight.',
    rules: [
      'Assets should read first as neon energy objects, second as rugged salvage machinery.',
      'Every major asset needs a clear luminous identity: bright core, glowing trim, plasma edge, holographic ring, energy rail, warning glyph, shield arc, or emissive trail.',
      'Use dark gunmetal, blackened steel, oxidized brass, worn copper, riveted armor, pipes, coils, vents, pressure rings, bolted plates, exposed frames, heat sinks, and boiler-like housings.',
      'Use cyan plasma, magenta neon, acid green reactor glow, electric blue arcs, violet ion halos, amber hazard light, and hot red warning cores.',
      'Keep neon crisp and intentional: bright edges, cores, rings, circuit strips, arcs, and trails over large blurry haze.',
      'At small sizes, preserve one clear silhouette, one dominant neon signature, and one readable role cue.',
      'Runtime gameplay must use cached textures, not live high-detail SVG/vector redraws.'
    ],
    avoid: [
      'Generic smooth sci-fi.',
      'Pure brown steampunk or dull metal-first assets.',
      'Muddy low-contrast palettes.',
      'Pure purple/blue monotone cyberpunk.',
      'Soft stock-like glow haze.',
      'Overly ornate silhouettes that fail at combat zoom.'
    ],
    examples: {
      enemies: [
        'Boiler drones with cyan plasma cores.',
        'Copper-ribbed snipers with magenta laser optics.',
        'Shield frigates with brass emitters and electric-blue barrier arcs.',
        'Reactor drones with acid-green pressure rings and red warning pulses.'
      ],
      weapons: [
        'Neon pressure cannons.',
        'Tesla forks.',
        'Coil barrels with cyan rails.',
        'Magenta plasma lances.',
        'Riveted missile pods with hot-red targeting strips.'
      ],
      effects: [
        'Ion arcs.',
        'Neon shock rings.',
        'Electric shield ripples.',
        'Acid-green reactor flares.',
        'Magenta targeting cones.',
        'Hot metal sparks lit by colored plasma.'
      ],
      ui: [
        'Holographic symbols first, brass instrument-frame details second.',
        'Cyan/magenta status edges.',
        'Amber warning marks.',
        'Electric-blue selection frames.'
      ]
    }
  };
}

export function getForgeTextureKey(assetId: string): string {
  return `${FORGE_TEXTURE_PREFIX}-${assetId}`;
}

export function loadAssetForgeStorageState(): AssetForgeStorageState {
  if (typeof window === 'undefined') {
    return { assets: [] };
  }

  try {
    const raw = window.localStorage.getItem(ASSET_FORGE_STORAGE_KEY);
    if (!raw) {
      return { assets: [] };
    }
    const parsed = JSON.parse(raw) as Partial<AssetForgeStorageState>;
    return {
      assets: Array.isArray(parsed.assets)
        ? parsed.assets
            .map((candidate) => parseForgeAssetImport(JSON.stringify(candidate)))
            .filter((candidate): candidate is ForgeAsset => Boolean(candidate))
        : []
    };
  } catch {
    return { assets: [] };
  }
}

export function saveAssetForgeStorageState(state: AssetForgeStorageState): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ASSET_FORGE_STORAGE_KEY, JSON.stringify(state));
}

export function createForgeAssetTexture(
  scene: Phaser.Scene,
  asset: ForgeAsset,
  textureKey = getForgeTextureKey(asset.id),
  replaceExisting = false
): void {
  if (scene.textures.exists(textureKey)) {
    if (!replaceExisting) {
      return;
    }
    scene.textures.remove(textureKey);
  }

  const texture = scene.textures.createCanvas(textureKey, asset.canvasSize, asset.canvasSize);
  if (!texture) {
    return;
  }

  const context = texture.getContext();
  context.clearRect(0, 0, asset.canvasSize, asset.canvasSize);
  context.save();
  context.translate(asset.canvasSize / 2, asset.canvasSize / 2);
  context.lineJoin = 'round';
  context.lineCap = 'round';

  for (const layer of asset.layers) {
    drawForgeLayer(context, asset, layer);
  }

  context.restore();
  texture.refresh();
}

export function createForgeAssetContainer(
  scene: Phaser.Scene,
  asset: ForgeAsset,
  x: number,
  y: number,
  textureKey = getForgeTextureKey(asset.id)
): Phaser.GameObjects.Container {
  createForgeAssetTexture(scene, asset, textureKey);

  const glow = scene.add.ellipse(0, 0, asset.boundsRadius * 2.35, asset.boundsRadius * 2.35, asset.palette.neonPrimary, 0.16);
  glow.setBlendMode(Phaser.BlendModes.ADD);

  const image = scene.add.image(0, 0, textureKey);
  image.setOrigin(0.5);
  image.setDisplaySize(asset.boundsRadius * 2, asset.boundsRadius * 2);

  const container = scene.add.container(x, y, [glow, image]);
  container.setDepth(9);
  container.setSize(asset.boundsRadius * 2, asset.boundsRadius * 2);
  container.setData('visualImage', image);
  container.setData('visualGlow', glow);
  container.setData('forgeAssetId', asset.id);

  return container;
}

export function renderForgeAssetToSvg(asset: ForgeAsset, options: { includeMetadata?: boolean } = {}): string {
  const metadata = options.includeMetadata
    ? [
        '  <metadata>',
        escapeXml(JSON.stringify({ styleGuideVersion: asset.styleGuideVersion, kind: asset.kind, status: asset.status })),
        '  </metadata>'
      ]
    : [];
  const body = asset.layers.map((layer) => renderSvgLayer(asset, layer)).join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-asset.canvasSize / 2} ${-asset.canvasSize / 2} ${asset.canvasSize} ${asset.canvasSize}" width="${asset.canvasSize}" height="${asset.canvasSize}" role="img" aria-label="${escapeXml(asset.displayName)}">`,
    ...metadata,
    `  <title>${escapeXml(asset.displayName)}</title>`,
    body,
    '</svg>',
    ''
  ].join('\n');
}

export function createForgeContactSheetData(assets: ForgeAsset[]): string {
  const cell = 190;
  const labelHeight = 34;
  const width = Math.max(cell, assets.length * cell);
  const height = cell + labelHeight + 24;
  const cells = assets.map((asset, index) => {
    const x = index * cell;
    const scale = 92 / Math.max(1, asset.boundsRadius);
    const assetSvg = asset.layers.map((layer) => renderSvgLayer(asset, layer)).join('\n');

    return [
      `<g transform="translate(${x + cell / 2} ${cell / 2 + 8}) scale(${scale})">`,
      assetSvg,
      `<circle cx="0" cy="0" r="${asset.boundsRadius}" fill="none" stroke="#ff5964" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.7" />`,
      '</g>',
      `<text x="${x + cell / 2}" y="${height - 28}" text-anchor="middle" fill="#f2fbff" font-family="monospace" font-size="11">${escapeXml(asset.displayName)}</text>`,
      `<text x="${x + cell / 2}" y="${height - 12}" text-anchor="middle" fill="#73f2ff" font-family="monospace" font-size="9">${asset.kind} | ${asset.status}</text>`
    ].join('\n');
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    '<rect width="100%" height="100%" fill="#050912" />',
    '<text x="12" y="18" fill="#ffc857" font-family="monospace" font-size="11">Starvivors Asset Forge Contact Sheet | Neon-Forward Salvagepunk</text>',
    ...cells,
    '</svg>',
    ''
  ].join('\n');
}

export function createForgeAiBrief(input: ForgeAiBriefInput): string {
  const styleGuide = getNeonForwardSalvagepunkStyleGuide();
  const requestedWork =
    input.requestedWork ??
    `Create or revise ${input.targetKind} Forge assets as structured Starvivors Forge JSON recipes. Return valid JSON or markdown with a json block.`;

  return [
    `# Starvivors Asset Forge AI Brief: ${input.targetLabel}`,
    '',
    '## Requested Work',
    requestedWork,
    '',
    '## Locked Art Theme',
    `- Style guide: ${styleGuide.displayName}`,
    `- Version: ${styleGuide.id}`,
    `- Summary: ${styleGuide.summary}`,
    `- Palette ratio: ${styleGuide.paletteRatio}`,
    '',
    '## Required Style Rules',
    ...styleGuide.rules.map((rule) => `- ${rule}`),
    '',
    '## Avoid',
    ...styleGuide.avoid.map((rule) => `- ${rule}`),
    '',
    '## Examples',
    ...Object.entries(styleGuide.examples).flatMap(([key, values]) => [`### ${key}`, ...values.map((value) => `- ${value}`), '']),
    '## Valid Asset Contract',
    '- Use `type: "starvivors-forge-asset"`.',
    '- Use `version: 1`.',
    `- Use \`styleGuideVersion: "${FORGE_STYLE_GUIDE_VERSION}"\`.`,
    '- Use only Forge vector layers and color roles.',
    '- Make neon energy visually dominant over salvage machinery.',
    '- Preserve readability at combat zoom and tiny radar/icon sizes.',
    '',
    input.context ? `## Current Context\n${input.context}\n` : '',
    input.selectedAsset ? ['## Selected Asset', '```json', JSON.stringify(input.selectedAsset, null, 2), '```', ''].join('\n') : ''
  ].join('\n');
}

export function createForgePromotionBundle(asset: ForgeAsset, productionHints: Record<string, unknown> = {}): ForgePromotionBundle {
  return {
    type: 'starvivors-forge-promotion-bundle',
    version: 1,
    styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
    asset,
    svg: renderForgeAssetToSvg(asset, { includeMetadata: true }),
    productionHints,
    savedAt: new Date().toISOString()
  };
}

export function createForgePromotionMarkdown(bundle: ForgePromotionBundle): string {
  return [
    `# Starvivors Forge Promotion Bundle: ${bundle.asset.displayName}`,
    '',
    `- Status: ${bundle.asset.status}`,
    `- Kind: ${bundle.asset.kind}`,
    `- Style guide: ${bundle.styleGuideVersion}`,
    `- Tags: ${bundle.asset.tags.join(', ') || 'None'}`,
    '',
    '## Promotion Rule',
    'Promote only assets marked Approved Visual or Approved Gameplay unless explicitly overridden by the developer.',
    '',
    '## Forge Bundle',
    '```json',
    JSON.stringify(bundle, null, 2),
    '```',
    ''
  ].join('\n');
}

export function parseForgeAssetImport(markdownOrJson: string): ForgeAsset | undefined {
  const raw = extractJsonBlock(markdownOrJson);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isForgeAsset(parsed)) {
      return parsed;
    }
    if (isForgePromotionBundle(parsed)) {
      return parsed.asset;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function convertEnemyVisualDefinitionToForgeAsset(definition: EnemyLabDefinition): ForgeAsset {
  const visual = definition.visual;
  const radius = visual.size * 0.46;
  const palette: ForgePalette = {
    metalDark: visual.primaryColor,
    metalWarm: visual.secondaryColor,
    neonPrimary: visual.glowColor,
    neonSecondary: visual.accentColor,
    warning: visual.engineColor,
    outline: visual.outlineColor,
    white: 0xf2fbff
  };
  const layers: ForgeVectorLayer[] = [
    { id: 'neon-glow', type: 'glow', x: 0, y: 0, radius: radius * 1.38, color: 'neonPrimary', innerAlpha: 0.34, role: 'dominant neon aura' },
    createHullLayer(visual, radius),
    ...createAccentLayers(visual, radius)
  ];

  return {
    type: 'starvivors-forge-asset',
    version: 1,
    id: `enemy.${definition.id}.forge`,
    kind: 'enemy',
    displayName: definition.displayName,
    status: definition.id === 'scout' ? 'Visual Pass' : 'Generated',
    tags: ['enemy-lab', definition.role, `tier-${definition.tier}`, 'neon-forward-salvagepunk'],
    notes: 'Converted from the existing Enemy Lab visual definition as an Asset Forge compatibility recipe.',
    styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
    palette,
    boundsRadius: Math.max(visual.size * 0.58, definition.stats.radius),
    canvasSize: Math.ceil(visual.size * 2.2),
    layers,
    animation: {
      idlePulse: Boolean(visual.hasCore || visual.hasRing),
      emissiveFlicker: true,
      trail: visual.trailType
    },
    gameplayHints: {
      sourceDefinitionId: definition.id,
      role: definition.role,
      hitRadius: definition.stats.radius,
      telegraphType: visual.telegraphType
    },
    savedAt: new Date().toISOString()
  };
}

export function applyForgeAssetToEnemyDefinition(definition: EnemyLabDefinition, asset: ForgeAsset): EnemyLabDefinition {
  return {
    ...definition,
    displayName: asset.displayName,
    visual: {
      ...definition.visual,
      size: Math.max(12, asset.boundsRadius * 1.72),
      primaryColor: asset.palette.metalDark,
      secondaryColor: asset.palette.metalWarm,
      accentColor: asset.palette.neonSecondary,
      glowColor: asset.palette.neonPrimary,
      outlineColor: asset.palette.outline,
      engineColor: asset.palette.warning
    }
  };
}

function createHullLayer(visual: EnemyVisualDefinition, radius: number): ForgeVectorLayer {
  const base = {
    id: `hull-${visual.hullShape}`,
    color: 'metalDark' as const,
    strokeColor: 'outline' as const,
    strokeWidth: Math.max(2, radius * 0.075),
    role: 'salvage hull'
  };

  switch (visual.hullShape) {
    case 'kite':
      return { ...base, type: 'polygon', points: [[0, -radius], [radius * 0.62, radius * 0.34], [0, radius * 0.78], [-radius * 0.62, radius * 0.34]], fill: true };
    case 'wedge':
      return { ...base, type: 'polygon', points: [[0, -radius * 1.2], [radius * 0.58, radius * 0.82], [0, radius * 0.5], [-radius * 0.58, radius * 0.82]], fill: true };
    case 'diamond':
      return { ...base, type: 'polygon', points: [[0, -radius], [radius * 0.86, 0], [0, radius * 0.88], [-radius * 0.86, 0]], fill: true };
    case 'hex':
      return { ...base, type: 'polygon', points: createRegularPolygon(6, radius * 0.92, -Math.PI / 6), fill: true };
    case 'reactor':
      return { ...base, type: 'polygon', points: createRegularPolygon(8, radius * 0.86, Math.PI / 8), fill: true };
    case 'crystal':
      return { ...base, type: 'polygon', points: [[0, -radius], [radius * 0.72, -radius * 0.18], [radius * 0.48, radius * 0.72], [0, radius], [-radius * 0.64, radius * 0.16], [-radius * 0.42, -radius * 0.72]], fill: true };
    case 'needle':
      return { ...base, type: 'polygon', points: [[0, -radius * 1.22], [radius * 0.24, -radius * 0.12], [radius * 0.18, radius], [0, radius * 0.62], [-radius * 0.18, radius], [-radius * 0.24, -radius * 0.12]], fill: true };
    case 'carrier':
      return { ...base, type: 'polygon', points: [[-radius * 0.78, -radius * 0.7], [radius * 0.78, -radius * 0.7], [radius, 0], [radius * 0.58, radius * 0.82], [-radius * 0.58, radius * 0.82], [-radius, 0]], fill: true };
    case 'crescent':
      return { ...base, type: 'crescent', radius };
    case 'cross':
      return { ...base, type: 'polygon', points: [[-radius * 0.22, -radius], [radius * 0.22, -radius], [radius * 0.22, -radius * 0.28], [radius, -radius * 0.28], [radius, radius * 0.24], [radius * 0.22, radius * 0.24], [radius * 0.22, radius], [-radius * 0.22, radius], [-radius * 0.22, radius * 0.24], [-radius, radius * 0.24], [-radius, -radius * 0.28], [-radius * 0.22, -radius * 0.28]], fill: true };
    case 'command':
      return { ...base, type: 'polygon', points: [[0, -radius], [radius * 0.86, -radius * 0.2], [radius * 0.52, radius * 0.78], [0, radius * 0.48], [-radius * 0.52, radius * 0.78], [-radius * 0.86, -radius * 0.2]], fill: true };
    case 'boomerang':
      return { ...base, type: 'polygon', points: [[0, -radius], [radius, radius * 0.3], [radius * 0.34, radius * 0.08], [0, radius * 0.82], [-radius * 0.34, radius * 0.08], [-radius, radius * 0.3]], fill: true };
    case 'reflector':
      return { ...base, type: 'polygon', points: [[0, -radius], [radius * 0.82, -radius * 0.12], [radius * 0.54, radius * 0.82], [0, radius * 0.56], [-radius * 0.54, radius * 0.82], [-radius * 0.82, -radius * 0.12]], fill: true };
    case 'phase':
      return { ...base, type: 'polygon', points: [[0, -radius], [radius * 0.68, -radius * 0.18], [radius * 0.36, radius * 0.82], [0, radius * 0.48], [-radius * 0.36, radius * 0.82], [-radius * 0.68, -radius * 0.18]], fill: true };
  }
}

function createAccentLayers(visual: EnemyVisualDefinition, radius: number): ForgeVectorLayer[] {
  const layers: ForgeVectorLayer[] = [];
  if (visual.hasFins) {
    layers.push(
      { id: 'left-fin-rail', type: 'line', from: [-radius * 0.42, radius * 0.24], to: [-radius * 0.82, radius * 0.58], strokeColor: 'metalWarm', strokeAlpha: 0.92, strokeWidth: Math.max(2, radius * 0.055), role: 'salvage fin' },
      { id: 'right-fin-rail', type: 'line', from: [radius * 0.42, radius * 0.24], to: [radius * 0.82, radius * 0.58], strokeColor: 'metalWarm', strokeAlpha: 0.92, strokeWidth: Math.max(2, radius * 0.055), role: 'salvage fin' }
    );
  }
  if (visual.hasRing) {
    layers.push({ id: 'neon-pressure-ring', type: 'ring', x: 0, y: 0, radius: radius * 0.64, strokeColor: 'neonSecondary', strokeAlpha: 0.72, strokeWidth: Math.max(1.5, radius * 0.045), role: 'dominant neon ring' });
  }

  layers.push(
    { id: 'neon-spine', type: 'line', from: [0, -radius * 0.55], to: [0, radius * 0.45], strokeColor: 'neonSecondary', strokeAlpha: 0.96, strokeWidth: Math.max(1.5, radius * 0.045), role: 'neon role cue' },
    { id: 'left-engine', type: 'ellipse', x: -radius * 0.22, y: radius * 0.76, radiusX: radius * 0.1, radiusY: radius * 0.2, color: 'warning', alpha: 1, fill: true, role: 'neon engine' },
    { id: 'right-engine', type: 'ellipse', x: radius * 0.22, y: radius * 0.76, radiusX: radius * 0.1, radiusY: radius * 0.2, color: 'warning', alpha: 1, fill: true, role: 'neon engine' }
  );

  if (visual.hasCore) {
    layers.push({ id: 'neon-core', type: 'ellipse', x: 0, y: 0, radiusX: radius * 0.22, radiusY: radius * 0.22, color: 'neonSecondary', alpha: 0.86, fill: true, blend: 'lighter', role: 'dominant neon core' });
  }
  if (visual.hullShape === 'carrier') {
    layers.push({ id: 'carrier-bay', type: 'rect', x: -radius * 0.55, y: -radius * 0.24, width: radius * 1.1, height: radius * 0.28, color: 'metalWarm', alpha: 0.92, strokeColor: 'outline', strokeWidth: Math.max(1, radius * 0.035), role: 'salvage bay' });
  }
  if (visual.hullShape === 'crystal') {
    layers.push(
      { id: 'crystal-rib-a', type: 'line', from: [-radius * 0.48, radius * 0.12], to: [radius * 0.48, -radius * 0.08], strokeColor: 'outline', strokeAlpha: 0.7, strokeWidth: Math.max(1.5, radius * 0.045), role: 'crystal rib' },
      { id: 'crystal-rib-b', type: 'line', from: [-radius * 0.24, -radius * 0.62], to: [radius * 0.24, radius * 0.62], strokeColor: 'outline', strokeAlpha: 0.7, strokeWidth: Math.max(1.5, radius * 0.045), role: 'crystal rib' }
    );
  }
  if (visual.hullShape === 'reflector') {
    layers.push({ id: 'reflector-neon-plate', type: 'line', from: [-radius * 0.48, -radius * 0.48], to: [radius * 0.48, -radius * 0.48], strokeColor: 'neonSecondary', strokeAlpha: 0.95, strokeWidth: Math.max(3, radius * 0.08), role: 'neon reflector plate' });
  }

  return layers;
}

function drawForgeLayer(context: CanvasRenderingContext2D, asset: ForgeAsset, layer: ForgeVectorLayer): void {
  context.save();
  context.globalAlpha = layer.alpha ?? 1;
  context.globalCompositeOperation = layer.blend ?? 'source-over';
  context.fillStyle = colorToCss(resolveLayerColor(asset, layer.color, 'neonPrimary'), layer.alpha ?? 1);
  context.strokeStyle = colorToCss(resolveLayerColor(asset, layer.strokeColor ?? layer.color, 'outline'), layer.strokeAlpha ?? layer.alpha ?? 1);
  context.lineWidth = layer.strokeWidth ?? 2;

  switch (layer.type) {
    case 'glow':
      drawCanvasGlow(context, asset, layer);
      break;
    case 'polygon':
      drawCanvasPolygon(context, layer.points, layer.fill ?? true);
      break;
    case 'line':
      context.beginPath();
      context.moveTo(layer.from[0], layer.from[1]);
      context.lineTo(layer.to[0], layer.to[1]);
      context.stroke();
      break;
    case 'ellipse':
      context.beginPath();
      context.ellipse(layer.x, layer.y, layer.radiusX, layer.radiusY, layer.rotation ?? 0, 0, Math.PI * 2);
      if (layer.fill ?? true) context.fill();
      context.stroke();
      break;
    case 'ring':
      context.beginPath();
      context.arc(layer.x, layer.y, layer.radius, 0, Math.PI * 2);
      context.stroke();
      break;
    case 'rect':
      if (layer.color) context.fillRect(layer.x, layer.y, layer.width, layer.height);
      context.strokeRect(layer.x, layer.y, layer.width, layer.height);
      break;
    case 'crescent':
      drawCanvasCrescent(context, layer.radius);
      break;
    case 'path':
      drawApproximatePath(context, layer.d, layer.fill ?? true);
      break;
  }

  context.restore();
}

function drawCanvasGlow(context: CanvasRenderingContext2D, asset: ForgeAsset, layer: ForgeGlowLayer): void {
  const color = resolveLayerColor(asset, layer.color, 'neonPrimary');
  const gradient = context.createRadialGradient(layer.x, layer.y, layer.radius * 0.16, layer.x, layer.y, layer.radius);
  gradient.addColorStop(0, colorToCss(color, layer.innerAlpha ?? 0.34));
  gradient.addColorStop(1, colorToCss(color, 0));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(layer.x, layer.y, layer.radius, 0, Math.PI * 2);
  context.fill();
}

function drawCanvasPolygon(context: CanvasRenderingContext2D, points: Array<[number, number]>, fill: boolean): void {
  if (points.length === 0) return;
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    context.lineTo(points[i][0], points[i][1]);
  }
  context.closePath();
  if (fill) context.fill();
  context.stroke();
}

function drawCanvasCrescent(context: CanvasRenderingContext2D, radius: number): void {
  context.beginPath();
  context.arc(0, 0, radius, Math.PI * 0.18, Math.PI * 1.82);
  context.quadraticCurveTo(-radius * 0.25, radius * 0.28, 0, radius * 0.48);
  context.quadraticCurveTo(radius * 0.44, 0, 0, -radius * 0.48);
  context.quadraticCurveTo(-radius * 0.25, -radius * 0.28, radius * Math.cos(Math.PI * 0.18), radius * Math.sin(Math.PI * 0.18));
  context.closePath();
  context.fill();
  context.stroke();
}

function drawApproximatePath(context: CanvasRenderingContext2D, path: string, fill: boolean): void {
  const path2d = new Path2D(path);
  if (fill) context.fill(path2d);
  context.stroke(path2d);
}

function renderSvgLayer(asset: ForgeAsset, layer: ForgeVectorLayer): string {
  const fill = layer.color ? `fill="${colorToHex(resolveLayerColor(asset, layer.color, 'neonPrimary'))}"` : 'fill="none"';
  const opacity = layer.alpha === undefined ? '' : ` opacity="${layer.alpha}"`;
  const stroke = layer.strokeColor ?? layer.color
    ? `stroke="${colorToHex(resolveLayerColor(asset, layer.strokeColor ?? layer.color, 'outline'))}" stroke-width="${layer.strokeWidth ?? 2}" stroke-linecap="round" stroke-linejoin="round"`
    : '';
  const blend = layer.blend === 'lighter' ? ' style="mix-blend-mode:screen"' : '';

  switch (layer.type) {
    case 'glow':
      return [
        `  <defs><radialGradient id="${asset.id}-${layer.id}"><stop offset="0%" stop-color="${colorToHex(resolveLayerColor(asset, layer.color, 'neonPrimary'))}" stop-opacity="${layer.innerAlpha ?? 0.34}" /><stop offset="100%" stop-color="${colorToHex(resolveLayerColor(asset, layer.color, 'neonPrimary'))}" stop-opacity="0" /></radialGradient></defs>`,
        `  <circle cx="${layer.x}" cy="${layer.y}" r="${layer.radius}" fill="url(#${asset.id}-${layer.id})" />`
      ].join('\n');
    case 'polygon':
      return `  <polygon points="${layer.points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')}" ${layer.fill === false ? 'fill="none"' : fill} ${stroke}${opacity}${blend} />`;
    case 'line':
      return `  <line x1="${round(layer.from[0])}" y1="${round(layer.from[1])}" x2="${round(layer.to[0])}" y2="${round(layer.to[1])}" ${stroke}${opacity}${blend} />`;
    case 'ellipse':
      return `  <ellipse cx="${round(layer.x)}" cy="${round(layer.y)}" rx="${round(layer.radiusX)}" ry="${round(layer.radiusY)}" transform="rotate(${round(radToDeg(layer.rotation ?? 0))} ${round(layer.x)} ${round(layer.y)})" ${layer.fill === false ? 'fill="none"' : fill} ${stroke}${opacity}${blend} />`;
    case 'ring':
      return `  <circle cx="${round(layer.x)}" cy="${round(layer.y)}" r="${round(layer.radius)}" fill="none" ${stroke}${opacity}${blend} />`;
    case 'rect':
      return `  <rect x="${round(layer.x)}" y="${round(layer.y)}" width="${round(layer.width)}" height="${round(layer.height)}" ${fill} ${stroke}${opacity}${blend} />`;
    case 'crescent':
      return `  <path d="${crescentPath(layer.radius)}" ${fill} ${stroke}${opacity}${blend} />`;
    case 'path':
      return `  <path d="${escapeXml(layer.d)}" ${layer.fill === false ? 'fill="none"' : fill} ${stroke}${opacity}${blend} />`;
  }
}

function resolveLayerColor(asset: ForgeAsset, color: keyof ForgePalette | number | undefined, fallback: keyof ForgePalette): number {
  if (typeof color === 'number') {
    return color;
  }
  return asset.palette[color ?? fallback];
}

function createRegularPolygon(sides: number, radius: number, rotation = 0): Array<[number, number]> {
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function colorToCss(color: number, alpha = 1): string {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function crescentPath(radius: number): string {
  const startX = radius * Math.cos(Math.PI * 0.18);
  const startY = radius * Math.sin(Math.PI * 0.18);
  return [
    `M ${round(startX)} ${round(startY)}`,
    `A ${round(radius)} ${round(radius)} 0 1 1 ${round(startX)} ${round(-startY)}`,
    `Q ${round(-radius * 0.25)} ${round(-radius * 0.28)} 0 ${round(-radius * 0.48)}`,
    `Q ${round(radius * 0.44)} 0 0 ${round(radius * 0.48)}`,
    `Q ${round(-radius * 0.25)} ${round(radius * 0.28)} ${round(startX)} ${round(startY)}`,
    'Z'
  ].join(' ');
}

function extractJsonBlock(markdownOrJson: string): string {
  const jsonBlockMatch = markdownOrJson.match(/```json\s*([\s\S]*?)```/i);
  return jsonBlockMatch ? jsonBlockMatch[1] : markdownOrJson;
}

function isForgeAsset(value: unknown): value is ForgeAsset {
  const candidate = value as Partial<ForgeAsset>;
  return candidate?.type === 'starvivors-forge-asset' &&
    candidate.version === 1 &&
    typeof candidate.id === 'string' &&
    typeof candidate.displayName === 'string' &&
    candidate.styleGuideVersion === FORGE_STYLE_GUIDE_VERSION &&
    Array.isArray(candidate.layers);
}

function isForgePromotionBundle(value: unknown): value is ForgePromotionBundle {
  const candidate = value as Partial<ForgePromotionBundle>;
  return candidate?.type === 'starvivors-forge-promotion-bundle' &&
    candidate.version === 1 &&
    candidate.styleGuideVersion === FORGE_STYLE_GUIDE_VERSION &&
    isForgeAsset(candidate.asset);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function radToDeg(value: number): number {
  return (value * 180) / Math.PI;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
