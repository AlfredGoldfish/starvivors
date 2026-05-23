import Phaser from 'phaser';
import type { EnemyLabDefinition, EnemyVisualDefinition } from '../data/enemyLabDefinitions';
import type { ProjectileVisualDefinition, WeaponRegistryEntry } from '../data/weapons';

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

export const FORGE_ASSET_STATUSES: ForgeAssetStatus[] = [
  'Generated',
  'Idea',
  'Visual Pass',
  'Behavior Pass',
  'Needs Tuning',
  'Playable Candidate',
  'Approved Visual',
  'Approved Gameplay',
  'Promoted',
  'Rejected',
  'Implemented'
];

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

export interface ForgeProductionPromotionHints {
  source?: string;
  sourceDefinitionId?: string;
  selectedVariantId?: string | null;
  targetDataFile?: string;
  registryFile?: string;
  notes?: string;
}

export interface ForgeProductionPromotionBundle {
  type: 'starvivors-forge-production-promotion';
  version: 1;
  styleGuideVersion: typeof FORGE_STYLE_GUIDE_VERSION;
  visualAssetId: string;
  asset: ForgeAsset;
  svg: string;
  productionHints: ForgeProductionPromotionHints & {
    targetDataFile: string;
    registryFile: string;
    definitionPatchHint: string;
    registryEntrySnippet: string;
  };
  savedAt: string;
}

export interface ForgeAssetBatch {
  type: 'starvivors-forge-asset-batch';
  version: 1;
  styleGuideVersion: typeof FORGE_STYLE_GUIDE_VERSION;
  displayName: string;
  assets: ForgeAsset[];
  savedAt: string;
}

export interface AssetForgeStorageState {
  assets: ForgeAsset[];
}

export interface ForgeAiBriefInput {
  targetLabel: string;
  targetKind: ForgeAssetKind;
  batchCount?: number;
  selectedAsset?: ForgeAsset;
  context?: string;
  requestedWork?: string;
  taskType?: ForgeAiTaskType;
  templateId?: ForgeAssetTemplateId;
  role?: string;
  productionTarget?: string;
}

export interface ForgeImportResult {
  assets: ForgeAsset[];
  rejectedCount: number;
  errors: string[];
  response?: ForgeAiResponse;
  validationReports: ForgeAiValidationReport[];
}

export type ForgeAssetTemplateId =
  | 'projectile.neon-bolt'
  | 'projectile.plasma-orb'
  | 'projectile.missile'
  | 'weapon.icon.cannon'
  | 'weapon.icon.beam'
  | 'weapon.icon.shield'
  | 'effect.shock-ring'
  | 'pickup.scrap-shard'
  | 'ui-icon.hologlyph';

export interface ForgeAssetTemplate {
  id: ForgeAssetTemplateId;
  displayName: string;
  kind: ForgeAssetKind;
  role: string;
  previewModes: string[];
  aiGuidance: string;
  asset: ForgeAsset;
}

export interface ForgeAssetTemplateOptions {
  id?: string;
  displayName?: string;
  status?: ForgeAssetStatus;
  tags?: string[];
  notes?: string;
  role?: string;
  palette?: Partial<ForgePalette>;
  sourceWeaponId?: string;
  productionTarget?: string;
  gameplayHints?: Record<string, unknown>;
}

export type ForgeAiTaskType = 'generate' | 'revise' | 'batch' | 'repair' | 'promotion-prep';

export interface ForgeAiSelfCheck {
  styleGuide: string;
  neonDominance: string;
  silhouetteReadability: string;
  combatScaleReadability: string;
  layerCount: string;
  boundsAndHitRadius: string;
  roleCue: string;
}

export interface ForgeAiTask {
  type: 'starvivors-forge-ai-task';
  version: 1;
  taskType: ForgeAiTaskType;
  styleGuideVersion: typeof FORGE_STYLE_GUIDE_VERSION;
  targetKind: ForgeAssetKind;
  targetLabel: string;
  templateId?: ForgeAssetTemplateId;
  batchCount: number;
  role?: string;
  productionTarget?: string;
  selectedAsset?: ForgeAsset;
  templates: ForgeAssetTemplate[];
  allowedLayerTypes: ForgeVectorLayer['type'][];
  paletteRoles: Array<keyof ForgePalette>;
  outputContract: string[];
  readabilityRequirements: string[];
  context?: string;
  savedAt: string;
}

export interface ForgeAiResponse {
  type: 'starvivors-forge-ai-response';
  version: 1;
  styleGuideVersion: typeof FORGE_STYLE_GUIDE_VERSION;
  taskId?: string;
  assets: ForgeAsset[];
  notes?: string;
  warnings?: string[];
  rejectedIdeas?: string[];
  revisionNotes?: string[];
  selfChecks?: Record<string, ForgeAiSelfCheck>;
  savedAt?: string;
}

export interface ForgeAiValidationReport {
  assetId?: string;
  assetName?: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  repairPrompt: string;
}

export type ForgeAiProviderStatus = 'manual' | 'unconfigured' | 'ready' | 'error';

export interface ForgeAiProviderRequest {
  providerStatus: ForgeAiProviderStatus;
  task: ForgeAiTask;
  prompt: string;
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

export function getForgeAssetTemplates(kind?: ForgeAssetKind): ForgeAssetTemplate[] {
  const templates = createForgeAssetTemplateCatalog();
  return kind ? templates.filter((template) => template.kind === kind) : templates;
}

export function createForgeAssetFromTemplate(templateId: ForgeAssetTemplateId, options: ForgeAssetTemplateOptions = {}): ForgeAsset {
  const template = getForgeAssetTemplates().find((candidate) => candidate.id === templateId) ?? getForgeAssetTemplates()[0];
  const asset = cloneForgeAsset(template.asset);
  const role = options.role ?? template.role;
  asset.id = options.id ?? `forge.${template.kind}.${normalizeForgeId(role)}.${Date.now()}`;
  asset.displayName = options.displayName ?? `${template.displayName} Draft`;
  asset.status = options.status ?? 'Visual Pass';
  asset.tags = Array.from(new Set([...asset.tags, template.kind, role, ...(options.tags ?? [])]));
  asset.notes = options.notes ?? `${template.aiGuidance} Created from generic Forge template ${template.id}.`;
  asset.palette = { ...asset.palette, ...options.palette };
  asset.gameplayHints = {
    ...asset.gameplayHints,
    assetRole: role,
    templateId,
    productionTarget: options.productionTarget,
    ...options.gameplayHints
  };
  if (options.sourceWeaponId) {
    asset.gameplayHints.sourceWeaponId = options.sourceWeaponId;
  }
  asset.savedAt = new Date().toISOString();
  return asset;
}

export function createForgeProjectileTemplate(options: ForgeAssetTemplateOptions = {}): ForgeAsset {
  return createForgeAssetFromTemplate('projectile.neon-bolt', options);
}

export function createForgeWeaponIconTemplate(options: ForgeAssetTemplateOptions = {}): ForgeAsset {
  return createForgeAssetFromTemplate('weapon.icon.cannon', options);
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
            .flatMap((candidate) => parseForgeAssetImports(JSON.stringify(candidate)).assets)
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
    const role = typeof asset.gameplayHints?.assetRole === 'string' ? asset.gameplayHints.assetRole : asset.kind;
    const selfCheck = typeof asset.gameplayHints?.aiSelfCheck === 'string' ? ` | ${asset.gameplayHints.aiSelfCheck}` : '';

    return [
      `<g transform="translate(${x + cell / 2} ${cell / 2 + 8}) scale(${scale})">`,
      assetSvg,
      `<circle cx="0" cy="0" r="${asset.boundsRadius}" fill="none" stroke="#ff5964" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.7" />`,
      '</g>',
      `<text x="${x + cell / 2}" y="${height - 28}" text-anchor="middle" fill="#f2fbff" font-family="monospace" font-size="11">${escapeXml(asset.displayName)}</text>`,
      `<text x="${x + cell / 2}" y="${height - 12}" text-anchor="middle" fill="#73f2ff" font-family="monospace" font-size="9">${asset.kind} | ${escapeXml(role)} | ${asset.status}${escapeXml(selfCheck)}</text>`
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

export function createForgeAiTask(input: ForgeAiBriefInput): ForgeAiTask {
  const batchCount = Math.max(1, Math.round(input.batchCount ?? 1));
  const taskType = input.taskType ?? (batchCount > 1 ? 'batch' : 'generate');
  const templates = getForgeAssetTemplates(input.targetKind);
  return {
    type: 'starvivors-forge-ai-task',
    version: 1,
    taskType,
    styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
    targetKind: input.targetKind,
    targetLabel: input.targetLabel,
    templateId: input.templateId,
    batchCount,
    role: input.role,
    productionTarget: input.productionTarget,
    selectedAsset: input.selectedAsset,
    templates,
    allowedLayerTypes: ['polygon', 'line', 'ellipse', 'ring', 'rect', 'glow', 'crescent', 'path'],
    paletteRoles: ['metalDark', 'metalWarm', 'neonPrimary', 'neonSecondary', 'warning', 'outline', 'white'],
    outputContract: [
      'Return JSON or markdown with one json block.',
      'Use type "starvivors-forge-ai-response" for AI envelopes, or "starvivors-forge-asset-batch" for plain batches.',
      'Every asset must use type "starvivors-forge-asset", version 1, and the requested styleGuideVersion.',
      'Assets should be reusable and should not require sourceWeaponId, visualAssetId, or projectileVisualAssetId unless explicitly requested.',
      'Include gameplayHints.assetRole and gameplayHints.motionProfile or gameplayHints.iconSize when relevant.',
      'Include selfChecks keyed by asset id when using the AI response envelope.'
    ],
    readabilityRequirements: [
      'One clear silhouette.',
      'One dominant neon signature.',
      'One readable role cue.',
      'Crisp emission edges instead of blurry haze.',
      'Readable over dark starfield and at tiny icon/radar size.',
      'Reasonable layer count for cached texture baking.'
    ],
    context: input.context,
    savedAt: new Date().toISOString()
  };
}

export function createForgeAiBrief(input: ForgeAiBriefInput): string {
  const styleGuide = getNeonForwardSalvagepunkStyleGuide();
  const task = createForgeAiTask(input);
  const batchCount = task.batchCount;
  const requestedWork =
    input.requestedWork ??
    (batchCount > 1
      ? `Create ${batchCount} ${input.targetKind} Forge assets as a single starvivors-forge-asset-batch JSON recipe bundle.`
      : `Create or revise ${input.targetKind} Forge assets as structured Starvivors Forge JSON recipes. Return valid JSON or markdown with a json block.`);

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
    '## Template Catalog',
    ...task.templates.map((template) => `- ${template.id}: ${template.displayName} (${template.kind}/${template.role}) - ${template.aiGuidance}`),
    '',
    '## Allowed Layer Types',
    `- ${task.allowedLayerTypes.join(', ')}`,
    '',
    '## Palette Roles',
    `- ${task.paletteRoles.join(', ')}`,
    '',
    '## Valid Asset Contract',
    ...task.outputContract.map((rule) => `- ${rule}`),
    ...task.readabilityRequirements.map((rule) => `- ${rule}`),
    batchCount > 1 ? `- Return exactly ${batchCount} distinct assets unless the developer asks for a different count.` : '',
    '',
    '## AI Task JSON',
    '```json',
    JSON.stringify(task, null, 2),
    '```',
    '',
    input.context ? `## Current Context\n${input.context}\n` : '',
    input.selectedAsset ? ['## Selected Asset', '```json', JSON.stringify(input.selectedAsset, null, 2), '```', ''].join('\n') : ''
  ].join('\n');
}

export function createForgeAiProviderRequest(task: ForgeAiTask): ForgeAiProviderRequest {
  return {
    providerStatus: 'manual',
    task,
    prompt: createForgeAiBrief({
      targetLabel: task.targetLabel,
      targetKind: task.targetKind,
      batchCount: task.batchCount,
      selectedAsset: task.selectedAsset,
      context: task.context,
      taskType: task.taskType,
      templateId: task.templateId,
      role: task.role,
      productionTarget: task.productionTarget
    })
  };
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
    `- Visual asset id: ${createForgeVisualAssetId(bundle.asset)}`,
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

export function isForgeAssetApprovedForPromotion(asset: ForgeAsset): boolean {
  return asset.status === 'Approved Visual' ||
    asset.status === 'Approved Gameplay' ||
    asset.status === 'Promoted' ||
    asset.status === 'Implemented';
}

export function createForgeVisualAssetId(asset: ForgeAsset): string {
  const normalizedId = normalizeForgeId(asset.id);
  if (normalizedId.startsWith('forge.')) {
    return normalizedId;
  }

  return `forge.${asset.kind}.${normalizeForgeId(asset.displayName || asset.id)}`;
}

export function createForgeProductionPromotionBundle(
  asset: ForgeAsset,
  hints: ForgeProductionPromotionHints = {}
): ForgeProductionPromotionBundle {
  const visualAssetId = createForgeVisualAssetId(asset);
  const registryFile = hints.registryFile ?? 'src/data/forgeAssetRegistry.ts';
  const targetDataFile = hints.targetDataFile ?? 'src/data/enemyLabDefinitions.ts';
  const registryEntrySnippet = createForgeRegistryEntrySnippet(visualAssetId, asset, hints.notes);
  const definitionPatchHint = createForgeDefinitionPatchHint(visualAssetId, hints.sourceDefinitionId);

  return {
    type: 'starvivors-forge-production-promotion',
    version: 1,
    styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
    visualAssetId,
    asset,
    svg: renderForgeAssetToSvg(asset, { includeMetadata: true }),
    productionHints: {
      ...hints,
      targetDataFile,
      registryFile,
      definitionPatchHint,
      registryEntrySnippet
    },
    savedAt: new Date().toISOString()
  };
}

export function createForgeProductionPromotionMarkdown(bundle: ForgeProductionPromotionBundle): string {
  return [
    `# Starvivors Forge Production Promotion: ${bundle.asset.displayName}`,
    '',
    `- Visual asset id: \`${bundle.visualAssetId}\``,
    `- Status: ${bundle.asset.status}`,
    `- Kind: ${bundle.asset.kind}`,
    `- Style guide: ${bundle.styleGuideVersion}`,
    `- Source definition: ${bundle.productionHints.sourceDefinitionId ?? 'n/a'}`,
    `- Selected variant: ${bundle.productionHints.selectedVariantId ?? 'n/a'}`,
    '',
    '## Promotion Rule',
    'Production promotion is allowed only for Forge assets marked `Approved Visual`, `Approved Gameplay`, `Promoted`, or `Implemented`.',
    'Keep the existing embedded enemy visual as a compatibility fallback until that enemy is fully migrated.',
    '',
    '## Registry Entry',
    `Add this entry to \`${bundle.productionHints.registryFile}\`:`,
    '',
    '```ts',
    bundle.productionHints.registryEntrySnippet,
    '```',
    '',
    '## Enemy Definition Hook',
    `Patch \`${bundle.productionHints.targetDataFile}\` near the target definition:`,
    '',
    '```ts',
    bundle.productionHints.definitionPatchHint,
    '```',
    '',
    '## Forge Recipe',
    '```json',
    JSON.stringify(bundle, null, 2),
    '```',
    ''
  ].join('\n');
}

export function parseForgeAssetImport(markdownOrJson: string): ForgeAsset | undefined {
  return parseForgeAssetImports(markdownOrJson).assets[0];
}

export function parseForgeAiResponse(markdownOrJson: string): ForgeImportResult {
  return parseForgeAssetImports(markdownOrJson);
}

export function parseForgeAssetImports(markdownOrJson: string): ForgeImportResult {
  const raw = extractJsonBlock(markdownOrJson);
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    const response = isForgeAiResponse(parsed) ? parsed : undefined;
    const candidates = collectForgeAssetCandidates(parsed);
    const assets: ForgeAsset[] = [];
    const validationReports: ForgeAiValidationReport[] = [];
    let rejectedCount = 0;

    candidates.forEach((candidate, index) => {
      const validation = validateForgeAssetForAi(candidate);
      validationReports.push(validation);
      if (validation.valid && isForgeAsset(candidate)) {
        assets.push(candidate);
      } else {
        rejectedCount += 1;
        errors.push(`Asset ${index + 1}: ${validation.errors.join('; ') || 'Invalid Forge asset.'}`);
      }
    });

    return { assets, rejectedCount, errors, response, validationReports };
  } catch {
    return {
      assets: [],
      rejectedCount: 1,
      errors: ['Input did not contain valid JSON or a markdown json block.'],
      validationReports: [{
        valid: false,
        errors: ['Input did not contain valid JSON or a markdown json block.'],
        warnings: [],
        repairPrompt: 'Return valid JSON or markdown with one ```json block containing a Forge asset, batch, or AI response envelope.'
      }]
    };
  }
}

export function validateForgeAssetForAi(value: unknown): ForgeAiValidationReport {
  const validation = validateForgeAsset(value);
  const candidate = value as Partial<ForgeAsset>;
  const warnings: string[] = [];
  if (validation.valid && isForgeAsset(value)) {
    const neonLayers = value.layers.filter((layer) => String(layer.role ?? layer.id).toLowerCase().includes('neon') || layer.color === 'neonPrimary' || layer.strokeColor === 'neonPrimary');
    if (neonLayers.length === 0) warnings.push('Asset has no obvious neonPrimary/neon role layer.');
    if (!value.gameplayHints?.assetRole) warnings.push('gameplayHints.assetRole is recommended for AI-created reusable assets.');
    if (value.layers.length > 40) warnings.push('Layer count is high for a cached runtime asset; simplify unless detail is needed.');
    if (value.boundsRadius > value.canvasSize * 0.48) warnings.push('boundsRadius nearly fills canvas; review clipping risk.');
  }

  return {
    assetId: typeof candidate.id === 'string' ? candidate.id : undefined,
    assetName: typeof candidate.displayName === 'string' ? candidate.displayName : undefined,
    valid: validation.valid,
    errors: validation.errors,
    warnings,
    repairPrompt: createForgeRepairPrompt({ valid: validation.valid, errors: validation.errors, warnings, repairPrompt: '' }, value)
  };
}

export function createForgeRepairPrompt(report: ForgeAiValidationReport, originalInput: unknown): string {
  return [
    '# Starvivors Asset Forge Repair Prompt',
    '',
    `Style guide version: ${FORGE_STYLE_GUIDE_VERSION}`,
    '',
    'Fix the Forge JSON so it imports cleanly. Preserve the intended reusable asset concept. Return only valid JSON or one markdown json block.',
    '',
    '## Errors',
    ...(report.errors.length > 0 ? report.errors.map((error) => `- ${error}`) : ['- None']),
    '',
    '## Warnings',
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning}`) : ['- None']),
    '',
    '## Required Contract',
    '- Use type "starvivors-forge-asset" for each asset.',
    '- Use version 1.',
    `- Use styleGuideVersion "${FORGE_STYLE_GUIDE_VERSION}".`,
    '- Use only known Forge layer types and palette roles.',
    '- Keep assets reusable; sourceWeaponId is optional metadata only.',
    '',
    '## Original Input',
    '```json',
    JSON.stringify(originalInput, null, 2),
    '```',
    ''
  ].join('\n');
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
    visualAssetId: createForgeVisualAssetId(asset),
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

function createForgeAssetTemplateCatalog(): ForgeAssetTemplate[] {
  return [
    createForgeTemplate('projectile.neon-bolt', 'Neon Bolt', 'projectile', 'neon-bolt', ['projectile-motion', 'combat', 'hit-radius'], 'Fast readable projectile with a sharp neon core, compact salvage rails, and a clear tail cue.', createTemplateAsset({
      id: 'template.projectile.neon-bolt',
      kind: 'projectile',
      displayName: 'Neon Bolt',
      role: 'neon-bolt',
      boundsRadius: 15,
      canvasSize: 52,
      palette: { metalDark: 0x071018, metalWarm: 0xb0793f, neonPrimary: 0x42f5d7, neonSecondary: 0x73f2ff, warning: 0xffc857, outline: 0xf2fbff, white: 0xf2fbff },
      layers: [
        { id: 'neon-flight-envelope', type: 'glow', x: 0, y: 0, radius: 17, color: 'neonPrimary', innerAlpha: 0.3, role: 'dominant projectile glow' },
        { id: 'plasma-spear-core', type: 'ellipse', x: 0, y: -0.5, radiusX: 3.8, radiusY: 10.5, color: 'neonSecondary', strokeColor: 'white', strokeWidth: 1, role: 'bright projectile core' },
        { id: 'copper-pressure-rail-left', type: 'line', from: [-7, 4], to: [-3, -8], strokeColor: 'metalWarm', strokeWidth: 2, role: 'salvage rail' },
        { id: 'copper-pressure-rail-right', type: 'line', from: [7, 4], to: [3, -8], strokeColor: 'metalWarm', strokeWidth: 2, role: 'mirrored salvage rail' },
        { id: 'hot-tail-glyph', type: 'polygon', points: [[0, 13], [4.5, 5], [0, 8], [-4.5, 5]], color: 'warning', strokeColor: 'outline', strokeWidth: 0.8, role: 'direction cue' }
      ],
      gameplayHints: { assetRole: 'neon-bolt', motionProfile: 'fast-forward', displayWidth: 28, displayHeight: 36, hitRadius: 8 },
      animation: { emissiveFlicker: true, trail: 'plasma' }
    })),
    createForgeTemplate('projectile.plasma-orb', 'Plasma Orb', 'projectile', 'plasma-orb', ['projectile-motion', 'combat', 'hit-radius'], 'Round energy projectile with a luminous core, ring read, and tiny mechanical braces.', createTemplateAsset({
      id: 'template.projectile.plasma-orb',
      kind: 'projectile',
      displayName: 'Plasma Orb',
      role: 'plasma-orb',
      boundsRadius: 18,
      canvasSize: 58,
      palette: { metalDark: 0x071018, metalWarm: 0xb0793f, neonPrimary: 0xff2fd6, neonSecondary: 0x42f5d7, warning: 0xffc857, outline: 0xf2fbff, white: 0xf2fbff },
      layers: [
        { id: 'orb-glow', type: 'glow', x: 0, y: 0, radius: 20, color: 'neonPrimary', innerAlpha: 0.32 },
        { id: 'orb-core', type: 'ellipse', x: 0, y: 0, radiusX: 8, radiusY: 8, color: 'neonPrimary', strokeColor: 'white', strokeWidth: 1 },
        { id: 'holo-ring', type: 'ring', x: 0, y: 0, radius: 13, strokeColor: 'neonSecondary', strokeWidth: 2, blend: 'lighter' },
        { id: 'brace-left', type: 'line', from: [-15, 0], to: [-8, 0], strokeColor: 'metalWarm', strokeWidth: 2 },
        { id: 'brace-right', type: 'line', from: [15, 0], to: [8, 0], strokeColor: 'metalWarm', strokeWidth: 2 }
      ],
      gameplayHints: { assetRole: 'plasma-orb', motionProfile: 'slow-floating', displayWidth: 34, displayHeight: 34, hitRadius: 10 },
      animation: { idlePulse: true, emissiveFlicker: true, trail: 'ion' }
    })),
    createForgeTemplate('projectile.missile', 'Riveted Missile', 'projectile', 'missile', ['projectile-motion', 'combat', 'hit-radius'], 'Directional missile silhouette with hot warning strips, dark shell, and neon exhaust.', createTemplateAsset({
      id: 'template.projectile.missile',
      kind: 'projectile',
      displayName: 'Riveted Missile',
      role: 'missile',
      boundsRadius: 20,
      canvasSize: 64,
      palette: { metalDark: 0x111a24, metalWarm: 0xb0793f, neonPrimary: 0x69f0ae, neonSecondary: 0x73f2ff, warning: 0xff5964, outline: 0xf2fbff, white: 0xf2fbff },
      layers: [
        { id: 'exhaust-glow', type: 'glow', x: 0, y: 12, radius: 16, color: 'neonPrimary', innerAlpha: 0.28 },
        { id: 'missile-body', type: 'polygon', points: [[0, -22], [9, -5], [7, 16], [0, 22], [-7, 16], [-9, -5]], color: 'metalDark', strokeColor: 'outline', strokeWidth: 1.2 },
        { id: 'warning-strip', type: 'line', from: [0, 14], to: [0, -12], strokeColor: 'warning', strokeWidth: 3, blend: 'lighter' },
        { id: 'fin-left', type: 'polygon', points: [[-7, 8], [-17, 18], [-6, 16]], color: 'metalWarm', strokeColor: 'outline', strokeWidth: 1 },
        { id: 'fin-right', type: 'polygon', points: [[7, 8], [17, 18], [6, 16]], color: 'metalWarm', strokeColor: 'outline', strokeWidth: 1 }
      ],
      gameplayHints: { assetRole: 'missile', motionProfile: 'guided-forward', displayWidth: 34, displayHeight: 44, hitRadius: 10 },
      animation: { emissiveFlicker: true, trail: 'spark' }
    })),
    createForgeTemplate('weapon.icon.cannon', 'Pressure Cannon Icon', 'weapon', 'weapon-icon-cannon', ['weapon-icon', 'combat'], 'Compact weapon icon with holographic cannon rails and brass instrument framing.', createWeaponIconTemplateAsset('template.weapon.icon.cannon', 'Pressure Cannon Icon', 'weapon-icon-cannon', 0x42f5d7, 0xff2fd6, 'cannon')),
    createForgeTemplate('weapon.icon.beam', 'Beam Cutter Icon', 'weapon', 'weapon-icon-beam', ['weapon-icon', 'combat'], 'Beam weapon icon with a bright cutter line and focusing coil.', createWeaponIconTemplateAsset('template.weapon.icon.beam', 'Beam Cutter Icon', 'weapon-icon-beam', 0x69f0ae, 0x73f2ff, 'beam')),
    createForgeTemplate('weapon.icon.shield', 'Shield Ram Icon', 'weapon', 'weapon-icon-shield', ['weapon-icon', 'combat'], 'Shield weapon icon with electric barrier arc and warning impact core.', createWeaponIconTemplateAsset('template.weapon.icon.shield', 'Shield Ram Icon', 'weapon-icon-shield', 0xffc857, 0xff5964, 'shield')),
    createForgeTemplate('effect.shock-ring', 'Ion Shock Ring', 'effect', 'shock-ring', ['combat', 'starfield'], 'Brief crisp neon shock ring with minimal haze and hot mechanical spark marks.', createTemplateAsset({
      id: 'template.effect.shock-ring',
      kind: 'effect',
      displayName: 'Ion Shock Ring',
      role: 'shock-ring',
      boundsRadius: 34,
      canvasSize: 92,
      palette: { metalDark: 0x071018, metalWarm: 0xb0793f, neonPrimary: 0x73f2ff, neonSecondary: 0xff2fd6, warning: 0xffc857, outline: 0xf2fbff, white: 0xf2fbff },
      layers: [
        { id: 'ring-glow', type: 'glow', x: 0, y: 0, radius: 34, color: 'neonPrimary', innerAlpha: 0.16 },
        { id: 'shock-ring', type: 'ring', x: 0, y: 0, radius: 27, strokeColor: 'neonPrimary', strokeWidth: 4, blend: 'lighter' },
        { id: 'magenta-break', type: 'path', d: 'M -24 -6 Q 0 -20 24 -6', fill: false, strokeColor: 'neonSecondary', strokeWidth: 2, blend: 'lighter' },
        { id: 'spark-a', type: 'line', from: [-12, 24], to: [-18, 32], strokeColor: 'warning', strokeWidth: 2 },
        { id: 'spark-b', type: 'line', from: [15, -24], to: [23, -31], strokeColor: 'warning', strokeWidth: 2 }
      ],
      gameplayHints: { assetRole: 'shock-ring', motionProfile: 'expanding-burst', displayWidth: 72, displayHeight: 72, hitRadius: 30 },
      animation: { idlePulse: true, emissiveFlicker: true, trail: 'none' }
    })),
    createForgeTemplate('pickup.scrap-shard', 'Neon Scrap Shard', 'pickup', 'scrap-shard', ['combat', 'minimap'], 'Pickup shard with neon value read and small salvage shard frame.', createTemplateAsset({
      id: 'template.pickup.scrap-shard',
      kind: 'pickup',
      displayName: 'Neon Scrap Shard',
      role: 'scrap-shard',
      boundsRadius: 18,
      canvasSize: 54,
      palette: { metalDark: 0x071018, metalWarm: 0xb0793f, neonPrimary: 0x69f0ae, neonSecondary: 0x42f5d7, warning: 0xffc857, outline: 0xf2fbff, white: 0xf2fbff },
      layers: [
        { id: 'value-glow', type: 'glow', x: 0, y: 0, radius: 18, color: 'neonPrimary', innerAlpha: 0.28 },
        { id: 'scrap-shard', type: 'polygon', points: [[0, -17], [12, -3], [6, 16], [-10, 11], [-14, -5]], color: 'metalWarm', strokeColor: 'outline', strokeWidth: 1.2 },
        { id: 'neon-cut', type: 'line', from: [-8, 7], to: [8, -8], strokeColor: 'neonPrimary', strokeWidth: 3, blend: 'lighter' }
      ],
      gameplayHints: { assetRole: 'scrap-shard', iconSize: 24, displayWidth: 30, displayHeight: 30 },
      animation: { idlePulse: true, emissiveFlicker: true, trail: 'spark' }
    })),
    createForgeTemplate('ui-icon.hologlyph', 'Hologlyph Icon', 'ui-icon', 'hologlyph', ['weapon-icon', 'minimap'], 'Readable holographic UI symbol first, brass frame second.', createTemplateAsset({
      id: 'template.ui-icon.hologlyph',
      kind: 'ui-icon',
      displayName: 'Hologlyph Icon',
      role: 'hologlyph',
      boundsRadius: 24,
      canvasSize: 64,
      palette: { metalDark: 0x071018, metalWarm: 0xb0793f, neonPrimary: 0x42f5d7, neonSecondary: 0xff2fd6, warning: 0xffc857, outline: 0xf2fbff, white: 0xf2fbff },
      layers: [
        { id: 'glyph-glow', type: 'glow', x: 0, y: 0, radius: 22, color: 'neonPrimary', innerAlpha: 0.2 },
        { id: 'instrument-frame', type: 'ring', x: 0, y: 0, radius: 21, strokeColor: 'metalWarm', strokeWidth: 2 },
        { id: 'holo-chevron', type: 'polygon', points: [[0, -16], [15, 0], [6, 0], [6, 15], [-6, 15], [-6, 0], [-15, 0]], color: 'neonPrimary', strokeColor: 'white', strokeWidth: 1, blend: 'lighter' }
      ],
      gameplayHints: { assetRole: 'hologlyph', iconSize: 32 },
      animation: { idlePulse: true, emissiveFlicker: true, trail: 'none' }
    }))
  ];
}

function createForgeTemplate(id: ForgeAssetTemplateId, displayName: string, kind: ForgeAssetKind, role: string, previewModes: string[], aiGuidance: string, asset: ForgeAsset): ForgeAssetTemplate {
  return { id, displayName, kind, role, previewModes, aiGuidance, asset };
}

function createTemplateAsset(input: {
  id: string;
  kind: ForgeAssetKind;
  displayName: string;
  role: string;
  boundsRadius: number;
  canvasSize: number;
  palette: ForgePalette;
  layers: ForgeVectorLayer[];
  gameplayHints: Record<string, unknown>;
  animation?: ForgeAnimationRecipe;
}): ForgeAsset {
  return {
    type: 'starvivors-forge-asset',
    version: 1,
    id: input.id,
    kind: input.kind,
    displayName: input.displayName,
    status: 'Idea',
    tags: [input.kind, input.role, 'template', 'neon-forward-salvagepunk'],
    notes: `Reusable ${input.kind} Forge template for ${input.role}.`,
    styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
    palette: input.palette,
    boundsRadius: input.boundsRadius,
    canvasSize: input.canvasSize,
    layers: input.layers,
    animation: input.animation,
    gameplayHints: {
      ...input.gameplayHints,
      assetRole: input.role
    },
    savedAt: new Date().toISOString()
  };
}

function createWeaponIconTemplateAsset(id: string, displayName: string, role: string, neonPrimary: number, neonSecondary: number, shape: 'cannon' | 'beam' | 'shield'): ForgeAsset {
  const radius = 34;
  const symbolLayers: ForgeVectorLayer[] = shape === 'shield'
    ? [
        { id: 'shield-neon-arc', type: 'path', d: `M ${-radius * 0.45} ${radius * 0.22} Q 0 ${-radius * 0.62} ${radius * 0.45} ${radius * 0.22}`, fill: false, strokeColor: 'neonPrimary', strokeWidth: 5, blend: 'lighter', role: 'shield arc' },
        { id: 'warning-impact-core', type: 'ellipse', x: 0, y: 4, radiusX: 7, radiusY: 12, color: 'warning', strokeColor: 'outline', strokeWidth: 1, role: 'impact core' }
      ]
    : shape === 'beam'
      ? [
          { id: 'beam-cutter-line', type: 'line', from: [0, radius * 0.52], to: [0, -radius * 0.58], strokeColor: 'neonPrimary', strokeWidth: 6, blend: 'lighter', role: 'beam cutter' },
          { id: 'salvage-focusing-coil', type: 'ring', x: 0, y: -radius * 0.16, radius: 12, strokeColor: 'metalWarm', strokeWidth: 3, role: 'focusing coil' }
        ]
      : [
          { id: 'pressure-cannon-barrel', type: 'rect', x: -5, y: -radius * 0.58, width: 10, height: radius * 1.05, color: 'metalWarm', strokeColor: 'outline', strokeWidth: 1, role: 'cannon barrel' },
          { id: 'cyan-energy-rail', type: 'line', from: [-12, radius * 0.42], to: [-12, -radius * 0.44], strokeColor: 'neonPrimary', strokeWidth: 3, blend: 'lighter', role: 'left energy rail' },
          { id: 'magenta-energy-rail', type: 'line', from: [12, radius * 0.42], to: [12, -radius * 0.44], strokeColor: 'neonSecondary', strokeWidth: 3, blend: 'lighter', role: 'right energy rail' }
        ];

  return createTemplateAsset({
    id,
    kind: 'weapon',
    displayName,
    role,
    boundsRadius: radius,
    canvasSize: 84,
    palette: { metalDark: 0x071018, metalWarm: 0xb0793f, neonPrimary, neonSecondary, warning: 0xffc857, outline: 0xf2fbff, white: 0xf2fbff },
    layers: [
      { id: 'holographic-icon-aura', type: 'glow', x: 0, y: 0, radius: radius * 0.9, color: 'neonPrimary', innerAlpha: 0.24, role: 'neon icon aura' },
      { id: 'brass-instrument-frame', type: 'ring', x: 0, y: 0, radius: radius * 0.72, strokeColor: 'metalWarm', strokeWidth: 3, role: 'salvage instrument frame' },
      { id: 'dark-mechanical-backplate', type: 'polygon', points: createRegularPolygon(6, radius * 0.62, Math.PI / 6), color: 'metalDark', strokeColor: 'outline', strokeWidth: 1.2, role: 'readable weapon silhouette' },
      ...symbolLayers
    ],
    gameplayHints: { assetRole: role, iconSize: 42, behaviorType: shape },
    animation: { idlePulse: true, emissiveFlicker: true, trail: 'none' }
  });
}

export function convertProjectileVisualDefinitionToForgeAsset(
  weapon: WeaponRegistryEntry,
  visual: ProjectileVisualDefinition = weapon.projectileVisual ?? {
    glowColor: 0x42f5d7,
    glowAlpha: 0.3,
    bodyColor: 0x73f2ff,
    bodyStrokeColor: 0xf2fbff,
    trailColor: 0x42f5d7,
    width: 18,
    height: 24
  }
): ForgeAsset {
  const width = Math.max(10, visual.width);
  const height = Math.max(14, visual.height);
  const radius = Math.max(width, height) * 0.62;
  const canvasSize = Math.ceil(Math.max(width, height) * 2.15);

  return {
    type: 'starvivors-forge-asset',
    version: 1,
    id: weapon.projectileVisualAssetId ?? `forge.projectile.${weapon.id}-bolt`,
    kind: 'projectile',
    displayName: `${weapon.displayName} Bolt`,
    status: weapon.projectileVisualAssetId ? 'Implemented' : 'Visual Pass',
    tags: ['weapon', 'projectile', weapon.id, 'neon-forward-salvagepunk', ...weapon.tags],
    notes: `Projectile recipe for ${weapon.displayName}. Neon reads first; salvage rails and hot warning strips support direction.`,
    styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
    palette: {
      metalDark: 0x071018,
      metalWarm: 0xb0793f,
      neonPrimary: visual.glowColor,
      neonSecondary: visual.bodyColor,
      warning: visual.trailColor,
      outline: visual.bodyStrokeColor,
      white: 0xf2fbff
    },
    boundsRadius: radius,
    canvasSize,
    layers: [
      { id: 'neon-flight-envelope', type: 'glow', x: 0, y: 0, radius: radius * 1.08, color: 'neonPrimary', innerAlpha: visual.glowAlpha, role: 'dominant projectile glow' },
      { id: 'plasma-spear-core', type: 'ellipse', x: 0, y: -height * 0.02, radiusX: width * 0.2, radiusY: height * 0.42, color: 'neonSecondary', strokeColor: 'white', strokeWidth: 1, role: 'bright projectile core' },
      { id: 'copper-pressure-rails', type: 'line', from: [-width * 0.38, height * 0.16], to: [-width * 0.16, -height * 0.32], color: 'metalWarm', strokeColor: 'metalWarm', strokeWidth: 2, role: 'salvage rail' },
      { id: 'copper-pressure-rails-mirror', type: 'line', from: [width * 0.38, height * 0.16], to: [width * 0.16, -height * 0.32], color: 'metalWarm', strokeColor: 'metalWarm', strokeWidth: 2, role: 'mirrored salvage rail' },
      { id: 'hot-tail-glyph', type: 'polygon', points: [[0, height * 0.55], [width * 0.24, height * 0.2], [0, height * 0.32], [-width * 0.24, height * 0.2]], color: 'warning', strokeColor: 'outline', strokeWidth: 0.8, role: 'direction cue' }
    ],
    animation: {
      emissiveFlicker: true,
      trail: 'plasma'
    },
    gameplayHints: {
      sourceWeaponId: weapon.id,
      displayWidth: Math.max(width * 1.55, radius * 1.55),
      displayHeight: Math.max(height * 1.55, radius * 2),
      hitRadius: Math.max(6, width * 0.45)
    },
    savedAt: new Date().toISOString()
  };
}

export function convertWeaponDefinitionToForgeAsset(weapon: WeaponRegistryEntry): ForgeAsset {
  const isBeam = weapon.behaviorType === 'beam';
  const isShield = weapon.behaviorType === 'ramming-shield';
  const neonPrimary = isBeam ? 0x69f0ae : isShield ? 0xffc857 : 0x42f5d7;
  const neonSecondary = isBeam ? 0x73f2ff : isShield ? 0xff5964 : 0xff2fd6;
  const radius = 34;

  return {
    type: 'starvivors-forge-asset',
    version: 1,
    id: weapon.visualAssetId ?? `forge.weapon.${weapon.id}`,
    kind: 'weapon',
    displayName: `${weapon.displayName} Icon`,
    status: weapon.visualAssetId ? 'Implemented' : 'Visual Pass',
    tags: ['weapon', weapon.id, weapon.behaviorType, 'neon-forward-salvagepunk', ...weapon.tags],
    notes: `Weapon icon recipe for ${weapon.displayName}. Holographic neon silhouette first, brass/salvage frame second.`,
    styleGuideVersion: FORGE_STYLE_GUIDE_VERSION,
    palette: {
      metalDark: 0x071018,
      metalWarm: 0xb0793f,
      neonPrimary,
      neonSecondary,
      warning: 0xffc857,
      outline: 0xf2fbff,
      white: 0xf2fbff
    },
    boundsRadius: radius,
    canvasSize: 84,
    layers: [
      { id: 'holographic-icon-aura', type: 'glow', x: 0, y: 0, radius: radius * 0.9, color: 'neonPrimary', innerAlpha: 0.24, role: 'neon icon aura' },
      { id: 'brass-instrument-frame', type: 'ring', x: 0, y: 0, radius: radius * 0.72, strokeColor: 'metalWarm', strokeWidth: 3, role: 'salvage instrument frame' },
      { id: 'dark-mechanical-backplate', type: 'polygon', points: createRegularPolygon(6, radius * 0.62, Math.PI / 6), color: 'metalDark', strokeColor: 'outline', strokeWidth: 1.2, role: 'readable weapon silhouette' },
      ...(isShield
        ? [
            { id: 'shield-neon-arc', type: 'path', d: `M ${-radius * 0.45} ${radius * 0.22} Q 0 ${-radius * 0.62} ${radius * 0.45} ${radius * 0.22}`, fill: false, strokeColor: 'neonPrimary', strokeWidth: 5, blend: 'lighter', role: 'shield arc' } as ForgeVectorLayer,
            { id: 'warning-impact-core', type: 'ellipse', x: 0, y: 4, radiusX: 7, radiusY: 12, color: 'warning', strokeColor: 'outline', strokeWidth: 1, role: 'impact core' } as ForgeVectorLayer
          ]
        : isBeam
          ? [
              { id: 'beam-cutter-line', type: 'line', from: [0, radius * 0.52], to: [0, -radius * 0.58], strokeColor: 'neonPrimary', strokeWidth: 6, blend: 'lighter', role: 'beam cutter' } as ForgeVectorLayer,
              { id: 'salvage-focusing-coil', type: 'ring', x: 0, y: -radius * 0.16, radius: 12, strokeColor: 'metalWarm', strokeWidth: 3, role: 'focusing coil' } as ForgeVectorLayer
            ]
          : [
              { id: 'pressure-cannon-barrel', type: 'rect', x: -5, y: -radius * 0.58, width: 10, height: radius * 1.05, color: 'metalWarm', strokeColor: 'outline', strokeWidth: 1, role: 'cannon barrel' } as ForgeVectorLayer,
              { id: 'cyan-energy-rail', type: 'line', from: [-12, radius * 0.42], to: [-12, -radius * 0.44], strokeColor: 'neonPrimary', strokeWidth: 3, blend: 'lighter', role: 'left energy rail' } as ForgeVectorLayer,
              { id: 'magenta-energy-rail', type: 'line', from: [12, radius * 0.42], to: [12, -radius * 0.44], strokeColor: 'neonSecondary', strokeWidth: 3, blend: 'lighter', role: 'right energy rail' } as ForgeVectorLayer
            ])
    ],
    animation: {
      idlePulse: true,
      emissiveFlicker: true,
      trail: 'none'
    },
    gameplayHints: {
      sourceWeaponId: weapon.id,
      behaviorType: weapon.behaviorType,
      iconSize: 42
    },
    savedAt: new Date().toISOString()
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

function normalizeForgeId(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '');

  return slug || 'asset';
}

function cloneForgeAsset(asset: ForgeAsset): ForgeAsset {
  return JSON.parse(JSON.stringify(asset)) as ForgeAsset;
}

function createForgeRegistryEntrySnippet(visualAssetId: string, asset: ForgeAsset, notes?: string): string {
  const registryEntry = {
    visualAssetId,
    source: 'asset-forge',
    status: asset.status === 'Implemented' ? 'implemented' : 'production-candidate',
    notes: notes ?? `Promoted from Asset Forge as ${asset.displayName}.`,
    asset
  };

  return JSON.stringify(registryEntry, null, 2);
}

function createForgeDefinitionPatchHint(visualAssetId: string, sourceDefinitionId?: string): string {
  return [
    sourceDefinitionId
      ? `// In the enemy definition with id "${sourceDefinitionId}", add the Forge visual id while keeping visual as fallback.`
      : '// Add the Forge visual id to the target enemy definition while keeping visual as fallback.',
    `visualAssetId: '${visualAssetId}',`,
    'visual: {',
    '  // existing embedded visual remains here as compatibility fallback',
    '}'
  ].join('\n');
}

function collectForgeAssetCandidates(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const candidate = value as {
    type?: string;
    assets?: unknown[];
    asset?: unknown;
  };
  if (candidate?.type === 'starvivors-forge-ai-response' && Array.isArray(candidate.assets)) {
    return candidate.assets;
  }
  if (candidate?.type === 'starvivors-forge-asset-batch' && Array.isArray(candidate.assets)) {
    return candidate.assets;
  }
  if (candidate?.type === 'starvivors-forge-promotion-bundle' && candidate.asset) {
    return [candidate.asset];
  }
  if (candidate?.type === 'starvivors-forge-production-promotion' && candidate.asset) {
    return [candidate.asset];
  }
  if (Array.isArray(candidate.assets)) {
    return candidate.assets;
  }

  return [value];
}

function validateForgeAsset(value: unknown): { valid: boolean; errors: string[] } {
  const candidate = value as Partial<ForgeAsset>;
  const errors: string[] = [];
  if (candidate?.type !== 'starvivors-forge-asset') errors.push('type must be starvivors-forge-asset');
  if (candidate.version !== 1) errors.push('version must be 1');
  if (candidate.styleGuideVersion !== FORGE_STYLE_GUIDE_VERSION) errors.push(`styleGuideVersion must be ${FORGE_STYLE_GUIDE_VERSION}`);
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) errors.push('id is required');
  if (typeof candidate.displayName !== 'string' || candidate.displayName.length === 0) errors.push('displayName is required');
  if (!isForgeAssetKind(candidate.kind)) errors.push('kind is invalid');
  if (!isForgeAssetStatus(candidate.status)) errors.push('status is invalid');
  if (!isForgePalette(candidate.palette)) errors.push('palette is invalid');
  if (!Number.isFinite(candidate.boundsRadius) || Number(candidate.boundsRadius) <= 0) errors.push('boundsRadius must be positive');
  if (!Number.isFinite(candidate.canvasSize) || Number(candidate.canvasSize) <= 0) errors.push('canvasSize must be positive');
  if (!Array.isArray(candidate.layers) || candidate.layers.length === 0) {
    errors.push('layers must contain at least one layer');
  } else {
    candidate.layers.forEach((layer, index) => {
      if (!isForgeLayer(layer)) {
        errors.push(`layer ${index + 1} is invalid`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function isForgeAsset(value: unknown): value is ForgeAsset {
  return validateForgeAsset(value).valid;
}

function isForgePromotionBundle(value: unknown): value is ForgePromotionBundle {
  const candidate = value as Partial<ForgePromotionBundle>;
  return candidate?.type === 'starvivors-forge-promotion-bundle' &&
    candidate.version === 1 &&
    candidate.styleGuideVersion === FORGE_STYLE_GUIDE_VERSION &&
    isForgeAsset(candidate.asset);
}

function isForgeAiResponse(value: unknown): value is ForgeAiResponse {
  const candidate = value as Partial<ForgeAiResponse>;
  return candidate?.type === 'starvivors-forge-ai-response' &&
    candidate.version === 1 &&
    candidate.styleGuideVersion === FORGE_STYLE_GUIDE_VERSION &&
    Array.isArray(candidate.assets);
}

function isForgeAssetKind(value: unknown): value is ForgeAssetKind {
  return value === 'enemy' ||
    value === 'ship' ||
    value === 'weapon' ||
    value === 'projectile' ||
    value === 'beam' ||
    value === 'effect' ||
    value === 'pickup' ||
    value === 'ui-icon' ||
    value === 'radar-icon' ||
    value === 'telegraph';
}

function isForgeAssetStatus(value: unknown): value is ForgeAssetStatus {
  return FORGE_ASSET_STATUSES.includes(value as ForgeAssetStatus);
}

function isForgePalette(value: unknown): value is ForgePalette {
  const candidate = value as Partial<ForgePalette>;
  return typeof candidate?.metalDark === 'number' &&
    typeof candidate.metalWarm === 'number' &&
    typeof candidate.neonPrimary === 'number' &&
    typeof candidate.neonSecondary === 'number' &&
    typeof candidate.warning === 'number' &&
    typeof candidate.outline === 'number' &&
    typeof candidate.white === 'number';
}

function isForgeLayer(value: unknown): value is ForgeVectorLayer {
  const layer = value as Partial<ForgeVectorLayer>;
  if (!layer || typeof layer.id !== 'string') return false;

  switch (layer.type) {
    case 'polygon':
      return Array.isArray(layer.points) && layer.points.every(isPoint);
    case 'line':
      return isPoint(layer.from) && isPoint(layer.to);
    case 'ellipse':
      return Number.isFinite(layer.x) && Number.isFinite(layer.y) && Number.isFinite(layer.radiusX) && Number.isFinite(layer.radiusY);
    case 'ring':
    case 'glow':
      return Number.isFinite(layer.x) && Number.isFinite(layer.y) && Number.isFinite(layer.radius);
    case 'rect':
      return Number.isFinite(layer.x) && Number.isFinite(layer.y) && Number.isFinite(layer.width) && Number.isFinite(layer.height);
    case 'crescent':
      return Number.isFinite(layer.radius);
    case 'path':
      return typeof layer.d === 'string' && layer.d.length > 0;
    default:
      return false;
  }
}

function isPoint(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]);
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
