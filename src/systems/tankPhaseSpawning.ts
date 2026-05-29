export const TANK_PHASE_ENEMY_DEFINITION_ID = 'hex-tank';
export const TANK_PHASE_MODE_LABEL = 'hex-tank-validation';
export const TANK_PHASE_SOLO_COUNT = 3;
export const TANK_PHASE_MIXED_SPAWN_PLAN = [
  'scout',
  'wedge-striker',
  'hex-tank',
  'scout',
  'wedge-striker',
  'hex-tank'
] as const;

export type TankPhaseEnemyDefinitionId =
  | typeof TANK_PHASE_ENEMY_DEFINITION_ID
  | 'scout'
  | 'wedge-striker';

export function resolveTankPhaseEnemyDefinitionId(): typeof TANK_PHASE_ENEMY_DEFINITION_ID {
  return TANK_PHASE_ENEMY_DEFINITION_ID;
}

export function getTankPhaseSoloSpawnPlan(count = TANK_PHASE_SOLO_COUNT): Array<typeof TANK_PHASE_ENEMY_DEFINITION_ID> {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => TANK_PHASE_ENEMY_DEFINITION_ID);
}

export function getTankPhaseMixedSpawnPlan(): TankPhaseEnemyDefinitionId[] {
  return [...TANK_PHASE_MIXED_SPAWN_PLAN];
}

export function isTankPhaseSolo(definitionIds: string[]): boolean {
  return definitionIds.length > 0 && definitionIds.every((definitionId) => definitionId === TANK_PHASE_ENEMY_DEFINITION_ID);
}

export function getTankPhaseMixCounts(definitionIds: string[]): Record<TankPhaseEnemyDefinitionId, number> {
  return {
    scout: definitionIds.filter((definitionId) => definitionId === 'scout').length,
    'wedge-striker': definitionIds.filter((definitionId) => definitionId === 'wedge-striker').length,
    'hex-tank': definitionIds.filter((definitionId) => definitionId === TANK_PHASE_ENEMY_DEFINITION_ID).length
  };
}
