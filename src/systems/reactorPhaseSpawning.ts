export const REACTOR_PHASE_ENEMY_DEFINITION_ID = 'reactor-drone';
export const REACTOR_PHASE_MODE_LABEL = 'reactor-drone-validation';
export const REACTOR_PHASE_SOLO_COUNT = 3;
export const REACTOR_PHASE_MIXED_SPAWN_PLAN = [
  'scout',
  'wedge-striker',
  'hex-tank',
  'reactor-drone',
  'scout',
  'reactor-drone'
] as const;

export type ReactorPhaseEnemyDefinitionId =
  | typeof REACTOR_PHASE_ENEMY_DEFINITION_ID
  | 'scout'
  | 'wedge-striker'
  | 'hex-tank';

export function resolveReactorPhaseEnemyDefinitionId(): typeof REACTOR_PHASE_ENEMY_DEFINITION_ID {
  return REACTOR_PHASE_ENEMY_DEFINITION_ID;
}

export function getReactorPhaseSoloSpawnPlan(count = REACTOR_PHASE_SOLO_COUNT): Array<typeof REACTOR_PHASE_ENEMY_DEFINITION_ID> {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => REACTOR_PHASE_ENEMY_DEFINITION_ID);
}

export function getReactorPhaseMixedSpawnPlan(): ReactorPhaseEnemyDefinitionId[] {
  return [...REACTOR_PHASE_MIXED_SPAWN_PLAN];
}

export function isReactorPhaseSolo(definitionIds: string[]): boolean {
  return definitionIds.length > 0 && definitionIds.every((definitionId) => definitionId === REACTOR_PHASE_ENEMY_DEFINITION_ID);
}

export function getReactorPhaseMixCounts(definitionIds: string[]): Record<ReactorPhaseEnemyDefinitionId, number> {
  return {
    scout: definitionIds.filter((definitionId) => definitionId === 'scout').length,
    'wedge-striker': definitionIds.filter((definitionId) => definitionId === 'wedge-striker').length,
    'hex-tank': definitionIds.filter((definitionId) => definitionId === 'hex-tank').length,
    'reactor-drone': definitionIds.filter((definitionId) => definitionId === REACTOR_PHASE_ENEMY_DEFINITION_ID).length
  };
}
