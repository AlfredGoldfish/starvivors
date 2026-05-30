export const IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID = 'impact-bomber';
export const IMPACT_BOMBER_PHASE_MODE_LABEL = 'impact-bomber-validation';
export const IMPACT_BOMBER_PHASE_SOLO_COUNT = 3;
export const IMPACT_BOMBER_PHASE_MIXED_SPAWN_PLAN = [
  'scout',
  'wedge-striker',
  'hex-tank',
  'reactor-drone',
  'impact-bomber',
  'scout',
  'impact-bomber'
] as const;

export type ImpactBomberPhaseEnemyDefinitionId =
  | typeof IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID
  | 'scout'
  | 'wedge-striker'
  | 'hex-tank'
  | 'reactor-drone';

export function resolveImpactBomberPhaseEnemyDefinitionId(): typeof IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID {
  return IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID;
}

export function getImpactBomberPhaseSoloSpawnPlan(
  count = IMPACT_BOMBER_PHASE_SOLO_COUNT
): Array<typeof IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID> {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID);
}

export function getImpactBomberPhaseMixedSpawnPlan(): ImpactBomberPhaseEnemyDefinitionId[] {
  return [...IMPACT_BOMBER_PHASE_MIXED_SPAWN_PLAN];
}

export function isImpactBomberPhaseSolo(definitionIds: string[]): boolean {
  return definitionIds.length > 0 && definitionIds.every((definitionId) => definitionId === IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID);
}

export function getImpactBomberPhaseMixCounts(
  definitionIds: string[]
): Record<ImpactBomberPhaseEnemyDefinitionId, number> {
  return {
    scout: definitionIds.filter((definitionId) => definitionId === 'scout').length,
    'wedge-striker': definitionIds.filter((definitionId) => definitionId === 'wedge-striker').length,
    'hex-tank': definitionIds.filter((definitionId) => definitionId === 'hex-tank').length,
    'reactor-drone': definitionIds.filter((definitionId) => definitionId === 'reactor-drone').length,
    'impact-bomber': definitionIds.filter((definitionId) => definitionId === IMPACT_BOMBER_PHASE_ENEMY_DEFINITION_ID).length
  };
}
