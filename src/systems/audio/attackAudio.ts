import {
  ENEMY_ATTACK_DEFINITIONS,
  type EnemyAttackId
} from '../../data/enemyAttackDefinitions';

export type AttackAudioBeat = 'telegraph' | 'channel' | 'resolve' | 'impact' | 'tick';
type AttackAudioCuePattern = `attack-${EnemyAttackId}-${AttackAudioBeat}`;
type AttackAudioBeatMapShape = Record<EnemyAttackId, Partial<Record<AttackAudioBeat, AttackAudioCuePattern>>>;

const ATTACK_AUDIO_BEATS: AttackAudioBeat[] = ['telegraph', 'channel', 'resolve', 'impact', 'tick'];

function attackCueId<const TAttackId extends EnemyAttackId, const TBeat extends AttackAudioBeat>(
  attackId: TAttackId,
  beat: TBeat
): `attack-${TAttackId}-${TBeat}` {
  return `attack-${attackId}-${beat}`;
}

function createBeatMap<const TAttackId extends EnemyAttackId, const TBeats extends readonly AttackAudioBeat[]>(
  attackId: TAttackId,
  beats: TBeats
): { [TBeat in TBeats[number]]: `attack-${TAttackId}-${TBeat}` } {
  return Object.fromEntries(beats.map((beat) => [beat, attackCueId(attackId, beat)])) as {
    [TBeat in TBeats[number]]: `attack-${TAttackId}-${TBeat}`;
  };
}

export const ATTACK_AUDIO_BEAT_MAP = {
  'rail-line': createBeatMap('rail-line', ['telegraph', 'resolve', 'impact']),
  'mortar-lob': createBeatMap('mortar-lob', ['telegraph', 'resolve', 'impact']),
  'emp-nova': createBeatMap('emp-nova', ['telegraph', 'resolve', 'impact']),
  'summon-glyphs': createBeatMap('summon-glyphs', ['telegraph', 'channel', 'resolve', 'impact']),
  'sweep-laser': createBeatMap('sweep-laser', ['telegraph', 'resolve', 'tick']),
  'healing-beam': createBeatMap('healing-beam', ['telegraph', 'resolve', 'tick']),
  'shield-wall': createBeatMap('shield-wall', ['telegraph', 'resolve', 'impact']),
  'plasma-puddle': createBeatMap('plasma-puddle', ['telegraph', 'resolve', 'impact', 'tick']),
  'cluster-bomb': createBeatMap('cluster-bomb', ['telegraph', 'resolve', 'impact']),
  'alarm-ping': createBeatMap('alarm-ping', ['telegraph', 'channel', 'resolve', 'impact']),
  'berserker-shockwave': createBeatMap('berserker-shockwave', ['telegraph', 'resolve', 'impact']),
  'mine-reveal': createBeatMap('mine-reveal', ['telegraph', 'resolve', 'impact']),
  'contact-ram': createBeatMap('contact-ram', ['resolve', 'impact']),
  'simple-bolt': createBeatMap('simple-bolt', ['telegraph', 'resolve', 'impact']),
  'charge-strike': createBeatMap('charge-strike', ['telegraph', 'resolve', 'impact']),
  'self-destruct-radius': createBeatMap('self-destruct-radius', ['telegraph', 'resolve', 'impact']),
  'split-shards': createBeatMap('split-shards', ['resolve', 'impact']),
  'command-buff-pulse': createBeatMap('command-buff-pulse', ['telegraph', 'resolve', 'impact']),
  'scrap-steal': createBeatMap('scrap-steal', ['resolve', 'impact']),
  'phase-blink-strike': createBeatMap('phase-blink-strike', ['telegraph', 'resolve', 'impact'])
} as const satisfies AttackAudioBeatMapShape;

export type AttackAudioBeatMap = typeof ATTACK_AUDIO_BEAT_MAP;
export type AttackAudioCueId = {
  [TAttackId in keyof AttackAudioBeatMap]: AttackAudioBeatMap[TAttackId][keyof AttackAudioBeatMap[TAttackId]];
}[keyof AttackAudioBeatMap];

export function getAttackAudioCueId(attackId: EnemyAttackId, beat: AttackAudioBeat): AttackAudioCueId | undefined {
  return getAttackAudioBeatMap(attackId)[beat];
}

export function getRequiredAttackAudioCoverage() {
  const attackIds = ENEMY_ATTACK_DEFINITIONS.map((definition) => definition.id);
  const coveredAttackIds = attackIds.filter((attackId) => Boolean(getAttackAudioBeatMap(attackId).resolve));
  const missingAttackIds = attackIds.filter((attackId) => !ATTACK_AUDIO_BEAT_MAP[attackId]);
  const missingRequiredResolveCueAttackIds = attackIds.filter((attackId) => !getAttackAudioBeatMap(attackId).resolve);
  const missingTelegraphCueAttackIds = ENEMY_ATTACK_DEFINITIONS
    .filter((definition) => definition.telegraph.kind !== 'none')
    .filter((definition) => !getAttackAudioBeatMap(definition.id).telegraph && !getAttackAudioBeatMap(definition.id).channel)
    .map((definition) => definition.id);
  const sustainedAttackIds = ENEMY_ATTACK_DEFINITIONS
    .filter((definition) => ['sweep-laser', 'healing-beam', 'plasma-puddle'].includes(definition.id))
    .map((definition) => definition.id);
  const missingSustainedTickCueAttackIds = sustainedAttackIds.filter((attackId) => !getAttackAudioBeatMap(attackId).tick);
  const requiredCueIds = attackIds
    .flatMap((attackId) => Object.values(getAttackAudioBeatMap(attackId)))
    .filter((cueId): cueId is AttackAudioCueId => Boolean(cueId));
  const coveredBeats = ATTACK_AUDIO_BEATS.filter((beat) =>
    requiredCueIds.some((cueId) => cueId.endsWith(`-${beat}`))
  ).sort();

  return {
    attackIds,
    coveredAttackIds,
    missingAttackIds,
    coveredBeats,
    missingRequiredResolveCueAttackIds,
    missingTelegraphCueAttackIds,
    sustainedAttackIds,
    missingSustainedTickCueAttackIds,
    requiredCueIds
  };
}

function getAttackAudioBeatMap(attackId: EnemyAttackId): Partial<Record<AttackAudioBeat, AttackAudioCueId>> {
  return ATTACK_AUDIO_BEAT_MAP[attackId] as Partial<Record<AttackAudioBeat, AttackAudioCueId>>;
}
