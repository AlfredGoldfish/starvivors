export const WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID = 'wedge-striker';
export const WEDGE_STRIKER_PHASE_MODE_LABEL = 'wedge-striker-validation';
export const WEDGE_STRIKER_PHASE_SOLO_COUNT = 3;
export const WEDGE_STRIKER_PHASE_MIXED_SPAWN_PLAN = [
  'scout',
  'wedge-striker',
  'scout',
  'wedge-striker',
  'scout'
] as const;

export type WedgeStrikerPhaseEnemyDefinitionId =
  | typeof WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID
  | 'scout';

export function resolveWedgeStrikerPhaseEnemyDefinitionId(): typeof WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID {
  return WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID;
}

export function getWedgeStrikerPhaseSoloSpawnPlan(count = WEDGE_STRIKER_PHASE_SOLO_COUNT): Array<typeof WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID> {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID);
}

export function getWedgeStrikerPhaseMixedSpawnPlan(): WedgeStrikerPhaseEnemyDefinitionId[] {
  return [...WEDGE_STRIKER_PHASE_MIXED_SPAWN_PLAN];
}

export function isWedgeStrikerPhaseSolo(definitionIds: string[]): boolean {
  return definitionIds.length > 0 && definitionIds.every((definitionId) => definitionId === WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID);
}

export function getWedgeStrikerPhaseMixCounts(definitionIds: string[]): Record<WedgeStrikerPhaseEnemyDefinitionId, number> {
  return {
    scout: definitionIds.filter((definitionId) => definitionId === 'scout').length,
    'wedge-striker': definitionIds.filter((definitionId) => definitionId === WEDGE_STRIKER_PHASE_ENEMY_DEFINITION_ID).length
  };
}
