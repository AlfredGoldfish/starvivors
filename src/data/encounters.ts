export type EncounterDefinitionId =
  | 'scout-pack'
  | 'gunner-escort'
  | 'strike-wing'
  | 'support-group'
  | 'sniper-screen'
  | 'carrier-group';

export interface EncounterDefinition {
  id: EncounterDefinitionId;
  displayName: string;
  squadId: string;
  minElapsedMs: number;
  threat: number;
  weight: number;
  cooldownMs: number;
}

export const ENCOUNTER_DEFINITIONS: EncounterDefinition[] = [
  {
    id: 'scout-pack',
    displayName: 'Scout Pack',
    squadId: 'scout-pack',
    minElapsedMs: 45000,
    threat: 1,
    weight: 64,
    cooldownMs: 24000
  },
  {
    id: 'gunner-escort',
    displayName: 'Gunner Escort',
    squadId: 'gunner-escort',
    minElapsedMs: 90000,
    threat: 2,
    weight: 42,
    cooldownMs: 32000
  },
  {
    id: 'strike-wing',
    displayName: 'Strike Wing',
    squadId: 'strike-wing',
    minElapsedMs: 150000,
    threat: 2,
    weight: 34,
    cooldownMs: 36000
  },
  {
    id: 'sniper-screen',
    displayName: 'Sniper Screen',
    squadId: 'sniper-screen',
    minElapsedMs: 270000,
    threat: 3,
    weight: 20,
    cooldownMs: 52000
  },
  {
    id: 'support-group',
    displayName: 'Support Group',
    squadId: 'support-group',
    minElapsedMs: 390000,
    threat: 4,
    weight: 14,
    cooldownMs: 65000
  },
  {
    id: 'carrier-group',
    displayName: 'Carrier Group',
    squadId: 'carrier-group',
    minElapsedMs: 540000,
    threat: 5,
    weight: 9,
    cooldownMs: 85000
  }
];

export function getEncounterDefinition(id: EncounterDefinitionId): EncounterDefinition {
  const encounter = ENCOUNTER_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!encounter) {
    throw new Error(`Unknown encounter definition: ${id}`);
  }

  return encounter;
}
