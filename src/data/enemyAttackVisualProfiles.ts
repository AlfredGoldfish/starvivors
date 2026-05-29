import {
  ENEMY_ATTACK_DEFINITIONS,
  type EnemyAttackDefinition,
  type EnemyAttackId
} from './enemyAttackDefinitions';

export type AttackVisualFamily = 'line' | 'landing' | 'radial' | 'support' | 'summon';
export type AttackExplicitMarkerLevel = 'implicit' | 'supplemental' | 'critical';

export interface AttackVisualGrammarRule {
  family: AttackVisualFamily;
  rule: string;
  examples: string[];
}

export interface EnemyAttackVisualProfile {
  attackId: EnemyAttackId;
  visualFamily: AttackVisualFamily;
  tellShape: string;
  dangerShape: string;
  explicitMarkerLevel: AttackExplicitMarkerLevel;
  diegeticTell: string;
  markerPattern: string;
  beats: {
    anticipation: string;
    resolve: string;
    impact: string;
    recovery: string;
  };
  reducedFxFallback: string;
  highContrastFallback: string;
  nonColorCues: readonly [string, string, ...string[]];
  screenshotHarnessScenario: string;
  notes: string;
}

export interface EnemyAttackVisualAuditRow {
  attackId: EnemyAttackId;
  displayName: string;
  batch: EnemyAttackDefinition['lab']['batch'];
  status: EnemyAttackDefinition['lab']['status'];
  visualFamily: AttackVisualFamily;
  tellShape: string;
  dangerShape: string;
  explicitMarkerLevel: AttackExplicitMarkerLevel;
  reducedFxFallback: string;
  highContrastFallback: string;
  nonColorCues: readonly string[];
  screenshotHarnessScenario: string;
  beats: EnemyAttackVisualProfile['beats'];
}

export const ATTACK_VISUAL_GRAMMAR: Record<AttackVisualFamily, AttackVisualGrammarRule> = {
  line: {
    family: 'line',
    rule: 'Use a source-to-target lane, lock mark, projectile lead, or dash corridor before the hit resolves.',
    examples: ['rail lane', 'projectile lead dots', 'dash corridor', 'blink vector']
  },
  landing: {
    family: 'landing',
    rule: 'Use a reticle, shadow, countdown fill, or falling object so the final point is readable before impact.',
    examples: ['mortar circle', 'puddle reticle', 'cluster split sockets']
  },
  radial: {
    family: 'radial',
    rule: 'Use rings with segment breaks, countdown ticks, or jagged shock lines so radius danger is not color-only.',
    examples: ['EMP segments', 'shockwave spokes', 'self-destruct countdown', 'mine blast ring']
  },
  support: {
    family: 'support',
    rule: 'Use tethers, arcs, pulses, or tractor links that name the source and affected target.',
    examples: ['healing tether', 'shield arc', 'command rally pulse', 'scrap tractor']
  },
  summon: {
    family: 'summon',
    rule: 'Use glyph sockets, ownership links, and spawn-count previews before new units appear.',
    examples: ['summon glyph sockets', 'alarm call pulse', 'split shard sockets']
  }
};

export const ENEMY_ATTACK_VISUAL_PROFILES: EnemyAttackVisualProfile[] = [
  {
    attackId: 'rail-line',
    visualFamily: 'line',
    tellShape: 'tracking lane that snaps into a lock crosshair',
    dangerShape: 'thin full-range beam lane',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'sniper hull points and holds the barrel line before firing',
    markerPattern: 'solid lock line plus crosshair endpoint',
    beats: {
      anticipation: 'aim line tracks the target',
      resolve: 'line changes to a locked, high-contrast stroke',
      impact: 'beam core flashes through the lane',
      recovery: 'endpoint lock fades after the beam'
    },
    reducedFxFallback: 'single thick lock line and endpoint crosshair',
    highContrastFallback: 'white lane with yellow lock accent and crosshair',
    nonColorCues: ['long narrow silhouette', 'endpoint crosshair', 'width change'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:rail-line',
    notes: 'Borrowed from MMO line AoE clarity: final danger shape matches the eventual beam lane.'
  },
  {
    attackId: 'mortar-lob',
    visualFamily: 'landing',
    tellShape: 'landing reticle with descending shell marker',
    dangerShape: 'circular splash radius',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'lob projectile arcs toward a visible shadow',
    markerPattern: 'circle reticle, center cross, and falling dot',
    beats: {
      anticipation: 'reticle appears at the predicted landing point',
      resolve: 'shell travels on an arc toward the marked point',
      impact: 'splash ring and sparks burst from the reticle',
      recovery: 'shadow and reticle fade out'
    },
    reducedFxFallback: 'reticle, shadow, and one shell marker',
    highContrastFallback: 'white/yellow reticle with center cross',
    nonColorCues: ['circle silhouette', 'center cross', 'falling marker'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:mortar-lob',
    notes: 'The shadow makes travel time legible without relying on projectile color.'
  },
  {
    attackId: 'emp-nova',
    visualFamily: 'radial',
    tellShape: 'segmented expanding EMP ring',
    dangerShape: 'self-centered circular status radius',
    explicitMarkerLevel: 'supplemental',
    diegeticTell: 'electric host charges a broken ring around itself',
    markerPattern: 'alternating ring segments and small spark ticks',
    beats: {
      anticipation: 'segments expand from the host',
      resolve: 'segments reach the final radius',
      impact: 'electric burst applies drag/slow',
      recovery: 'broken sparks dissipate'
    },
    reducedFxFallback: 'fewer but thicker EMP ring segments',
    highContrastFallback: 'white segmented ring with yellow alternating arcs',
    nonColorCues: ['broken ring pattern', 'expanding motion', 'radial symmetry'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:emp-nova',
    notes: 'Segment gaps separate EMP from simple explosion rings.'
  },
  {
    attackId: 'summon-glyphs',
    visualFamily: 'summon',
    tellShape: 'glyph sockets around the future spawn point',
    dangerShape: 'spawn cluster ownership zone',
    explicitMarkerLevel: 'supplemental',
    diegeticTell: 'summoner links itself to the glyph field during channel',
    markerPattern: 'rotating socket rings and source tether',
    beats: {
      anticipation: 'glyph sockets open around the target point',
      resolve: 'ownership tether holds through the channel',
      impact: 'summoned units appear from sockets',
      recovery: 'tether collapses back to the source'
    },
    reducedFxFallback: 'two sockets plus one ownership tether',
    highContrastFallback: 'white sockets with yellow source link',
    nonColorCues: ['socket count', 'ownership tether', 'spawn cluster shape'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:summon-glyphs',
    notes: 'Spawn ownership stays visible so adds do not feel arbitrary.'
  },
  {
    attackId: 'sweep-laser',
    visualFamily: 'line',
    tellShape: 'wide sweep lane with arc endpoints',
    dangerShape: 'rotating beam lane through an authored arc',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'host pivots into the sweep direction',
    markerPattern: 'arc boundary, center line, and endpoint pips',
    beats: {
      anticipation: 'arc lane previews the sweep bounds',
      resolve: 'beam core begins moving through the lane',
      impact: 'repeated tick flashes follow the sweeping core',
      recovery: 'endpoints fade after the sweep'
    },
    reducedFxFallback: 'arc boundaries and one center sweep line',
    highContrastFallback: 'white sweep core with yellow endpoint pips',
    nonColorCues: ['arc boundary', 'endpoint pips', 'moving line'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:sweep-laser',
    notes: 'The lane shows both where the beam starts and how far it will rotate.'
  },
  {
    attackId: 'healing-beam',
    visualFamily: 'support',
    tellShape: 'support tether to damaged ally',
    dangerShape: 'single target beneficial link',
    explicitMarkerLevel: 'implicit',
    diegeticTell: 'repair skiff points a tether at the priority ally',
    markerPattern: 'thin link plus target pulse',
    beats: {
      anticipation: 'tether chooses the ally before healing starts',
      resolve: 'support line brightens on the selected target',
      impact: 'heal pulse crosses the target marker',
      recovery: 'tether fades when retargeting or ending'
    },
    reducedFxFallback: 'single tether and one target pulse',
    highContrastFallback: 'white tether with yellow target cross',
    nonColorCues: ['source-target line', 'target cross pulse', 'ally selection'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:healing-beam',
    notes: 'The target pulse makes priority retargeting readable in clutter.'
  },
  {
    attackId: 'shield-wall',
    visualFamily: 'support',
    tellShape: 'front-facing shield arc',
    dangerShape: 'directional blocked/reflecting arc',
    explicitMarkerLevel: 'supplemental',
    diegeticTell: 'shield host braces toward the protected angle',
    markerPattern: 'arc boundary, side spokes, and reflect ribs',
    beats: {
      anticipation: 'thin arc opens in front of the host',
      resolve: 'arc thickens into an active wall',
      impact: 'blocked or reflected shots spark on the arc',
      recovery: 'arc ribs collapse after the window'
    },
    reducedFxFallback: 'thick arc with side spokes',
    highContrastFallback: 'white arc with yellow reflect ribs',
    nonColorCues: ['arc silhouette', 'front-facing spokes', 'reflect ribs'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:shield-wall',
    notes: 'Reflect mode changes the pattern, not only the color.'
  },
  {
    attackId: 'plasma-puddle',
    visualFamily: 'landing',
    tellShape: 'landing reticle with liquid hazard preview',
    dangerShape: 'lingering circular puddle zone',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'status shot seeds a marked impact point',
    markerPattern: 'reticle plus wavy internal strokes',
    beats: {
      anticipation: 'circle reticle marks the future puddle',
      resolve: 'zone fills with inner wavy strokes',
      impact: 'tick pulse flashes from inside the puddle',
      recovery: 'inner strokes fade as the hazard expires'
    },
    reducedFxFallback: 'outer reticle and a small set of thick inner strokes',
    highContrastFallback: 'white circle with yellow wavy strokes',
    nonColorCues: ['circle boundary', 'wavy texture', 'tick pulse'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:plasma-puddle',
    notes: 'The inner texture differentiates puddles from one-shot blast circles.'
  },
  {
    attackId: 'cluster-bomb',
    visualFamily: 'landing',
    tellShape: 'primary reticle with secondary split sockets',
    dangerShape: 'primary circle followed by smaller secondary circles',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'bomb arcs to the primary marker before splitting',
    markerPattern: 'spokes from the primary circle to secondary sockets',
    beats: {
      anticipation: 'primary landing circle appears',
      resolve: 'split spokes preview the secondary impacts',
      impact: 'primary burst seeds delayed secondary rings',
      recovery: 'secondary circles pop and fade independently'
    },
    reducedFxFallback: 'primary ring, fewer spokes, and secondary sockets',
    highContrastFallback: 'white primary ring with yellow split sockets',
    nonColorCues: ['spoke topology', 'primary/secondary size contrast', 'delayed sockets'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:cluster-bomb',
    notes: 'The split topology makes the follow-up pattern readable before the second hits.'
  },
  {
    attackId: 'alarm-ping',
    visualFamily: 'summon',
    tellShape: 'detection beam with alarm marker',
    dangerShape: 'call pulse and incoming squad spawn zone',
    explicitMarkerLevel: 'supplemental',
    diegeticTell: 'patrol source keeps a line on the marked target',
    markerPattern: 'exclamation marker, source link, and call ring',
    beats: {
      anticipation: 'beam marks the detected target',
      resolve: 'alarm icon and call pulse expand',
      impact: 'called squad spawns from the resolved pulse',
      recovery: 'source link fades after the call'
    },
    reducedFxFallback: 'detection line, alarm marker, and one call ring',
    highContrastFallback: 'white detection line with yellow alarm marker',
    nonColorCues: ['exclamation silhouette', 'source link', 'call ring'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:alarm-ping',
    notes: 'The call marker separates detection from direct damage.'
  },
  {
    attackId: 'berserker-shockwave',
    visualFamily: 'radial',
    tellShape: 'jagged state pulse around the host',
    dangerShape: 'self-centered knockback/slow shockwave radius',
    explicitMarkerLevel: 'supplemental',
    diegeticTell: 'berserker state ring pulses before the roar',
    markerPattern: 'inner/outer rings joined by jagged spokes',
    beats: {
      anticipation: 'state ring tightens around the host',
      resolve: 'spokes reach the final shockwave radius',
      impact: 'ring pulse and sparks imply knockback',
      recovery: 'spokes fade after the roar'
    },
    reducedFxFallback: 'two thick rings with six spokes',
    highContrastFallback: 'white rings with yellow spoke accents',
    nonColorCues: ['jagged spokes', 'two-ring state cue', 'outward pulse'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:berserker-shockwave',
    notes: 'The jagged profile distinguishes shockwave from EMP or self-destruct.'
  },
  {
    attackId: 'mine-reveal',
    visualFamily: 'radial',
    tellShape: 'mine reveal ring with charge line',
    dangerShape: 'delayed blast circle',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'hidden mine source flares before the blast resolves',
    markerPattern: 'source ring, charge line, and blast reticle',
    beats: {
      anticipation: 'source reveal ring and charge line appear',
      resolve: 'blast circle locks at the target point',
      impact: 'blast radius pops with sparks',
      recovery: 'source ring collapses after detonation'
    },
    reducedFxFallback: 'source ring, charge line, and one blast circle',
    highContrastFallback: 'white blast ring with yellow source flare',
    nonColorCues: ['source ring', 'charge line', 'blast circle'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:mine-reveal',
    notes: 'The reveal beat keeps hidden mine hits fair at gameplay scale.'
  },
  {
    attackId: 'contact-ram',
    visualFamily: 'line',
    tellShape: 'host body pressure and short forward lane',
    dangerShape: 'contact corridor at the nose of the host',
    explicitMarkerLevel: 'implicit',
    diegeticTell: 'enemy movement and hull collision are the warning',
    markerPattern: 'short dash corridor and nose spark in player-host tests',
    beats: {
      anticipation: 'host closes distance with its body pointed at the target',
      resolve: 'short contact lane resolves from the host nose',
      impact: 'nose spark marks collision pressure',
      recovery: 'brief streak fades immediately after contact'
    },
    reducedFxFallback: 'single short contact lane and nose spark',
    highContrastFallback: 'white contact lane with yellow impact spark',
    nonColorCues: ['ship silhouette', 'short corridor', 'nose spark'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:contact-ram',
    notes: 'This remains the implicit baseline attack; Attack Tester makes its hit lane explicit.'
  },
  {
    attackId: 'simple-bolt',
    visualFamily: 'line',
    tellShape: 'thin aim line with projectile lead dots',
    dangerShape: 'single projectile path',
    explicitMarkerLevel: 'supplemental',
    diegeticTell: 'gunner points a muzzle flash down the shot path',
    markerPattern: 'lead dots and muzzle flash',
    beats: {
      anticipation: 'thin line and lead dots show the shot path',
      resolve: 'muzzle flash fires along the path',
      impact: 'projectile hit flash or target damage pulse resolves',
      recovery: 'lead dots shrink out'
    },
    reducedFxFallback: 'three lead dots and one muzzle flash',
    highContrastFallback: 'white path dots with yellow muzzle flash',
    nonColorCues: ['lead dot spacing', 'muzzle flash triangle', 'straight path'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:simple-bolt',
    notes: 'Lead dots differentiate bolts from rail locks.'
  },
  {
    attackId: 'charge-strike',
    visualFamily: 'line',
    tellShape: 'dash corridor with triangular nose marker',
    dangerShape: 'wide forward dash lane',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'wedge striker commits its facing before the dash',
    markerPattern: 'parallel corridor rails and a nose triangle',
    beats: {
      anticipation: 'corridor rails draw the dash path',
      resolve: 'nose triangle reaches the end of the lane',
      impact: 'wide streak and sparks mark the strike',
      recovery: 'lane fades as the host exits dash recovery'
    },
    reducedFxFallback: 'two corridor rails and one nose triangle',
    highContrastFallback: 'white rails with yellow nose marker',
    nonColorCues: ['parallel rails', 'triangle nose', 'wide lane'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:charge-strike',
    notes: 'The corridor makes the charger readable even when hosted by another hull.'
  },
  {
    attackId: 'self-destruct-radius',
    visualFamily: 'radial',
    tellShape: 'countdown ring with radial tick marks',
    dangerShape: 'large self-centered blast circle',
    explicitMarkerLevel: 'critical',
    diegeticTell: 'reactor drone charges from its center before exploding',
    markerPattern: 'outer danger ring, inner countdown, radial ticks',
    beats: {
      anticipation: 'countdown ticks appear around the final radius',
      resolve: 'inner ring tightens before detonation',
      impact: 'blast radius and sparks pop outward',
      recovery: 'remaining ticks disappear after the blast'
    },
    reducedFxFallback: 'thick outer ring and fewer countdown ticks',
    highContrastFallback: 'white blast ring with yellow countdown ticks',
    nonColorCues: ['countdown ticks', 'outer radius', 'inner charge ring'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:self-destruct-radius',
    notes: 'The countdown pattern separates fatal blast reads from status novas.'
  },
  {
    attackId: 'split-shards',
    visualFamily: 'summon',
    tellShape: 'fracture triangles around the source',
    dangerShape: 'child shard spawn sockets',
    explicitMarkerLevel: 'implicit',
    diegeticTell: 'splitter body fractures before children appear',
    markerPattern: 'three triangular shard sockets',
    beats: {
      anticipation: 'fracture triangles imply imminent split',
      resolve: 'source burst opens shard sockets',
      impact: 'child shards spawn from the sockets',
      recovery: 'fracture lines shrink away'
    },
    reducedFxFallback: 'three shard sockets and one source burst',
    highContrastFallback: 'white shard sockets with yellow fracture lines',
    nonColorCues: ['triangle sockets', 'source burst', 'three-way layout'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:split-shards',
    notes: 'The socket layout makes the spawn count visible without text.'
  },
  {
    attackId: 'command-buff-pulse',
    visualFamily: 'support',
    tellShape: 'rally tether and chevron target marker',
    dangerShape: 'support aura pulse around allies',
    explicitMarkerLevel: 'implicit',
    diegeticTell: 'command relay broadcasts from its hull',
    markerPattern: 'radial chevrons and target bracket',
    beats: {
      anticipation: 'tether points at an ally before the buff pulse',
      resolve: 'chevrons expand from the source',
      impact: 'buff pulse reaches allies in range',
      recovery: 'chevrons fade outward'
    },
    reducedFxFallback: 'four large chevrons and one target bracket',
    highContrastFallback: 'white aura with yellow chevrons',
    nonColorCues: ['chevron ring', 'support tether', 'target bracket'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:command-buff-pulse',
    notes: 'Chevron direction reads as rally/support instead of explosion danger.'
  },
  {
    attackId: 'scrap-steal',
    visualFamily: 'support',
    tellShape: 'tractor scan ring or scrap link',
    dangerShape: 'source-to-scrap theft line',
    explicitMarkerLevel: 'implicit',
    diegeticTell: 'scavenger projects a tractor line toward scrap',
    markerPattern: 'scan ring, diamond scrap node, and pull line',
    beats: {
      anticipation: 'scan ring searches around the source',
      resolve: 'tractor line locks onto scrap',
      impact: 'scrap node travels toward the source',
      recovery: 'pull line fades after collection'
    },
    reducedFxFallback: 'scan ring and one tractor line',
    highContrastFallback: 'white tractor line with yellow scrap diamond',
    nonColorCues: ['scan ring', 'diamond node', 'pull line'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:scrap-steal',
    notes: 'The diamond node prevents theft from reading as a hostile beam.'
  },
  {
    attackId: 'phase-blink-strike',
    visualFamily: 'line',
    tellShape: 'blink vector and destination lock',
    dangerShape: 'destination strike circle',
    explicitMarkerLevel: 'supplemental',
    diegeticTell: 'phase skiff flickers along its intended blink path',
    markerPattern: 'source ring, blink link, and destination crosshair',
    beats: {
      anticipation: 'source ring and blink vector mark the destination',
      resolve: 'destination lock flashes before arrival',
      impact: 'strike ring bursts at the destination',
      recovery: 'blink link collapses behind the host'
    },
    reducedFxFallback: 'source ring, link, and destination crosshair',
    highContrastFallback: 'white blink link with yellow destination lock',
    nonColorCues: ['source ring', 'destination lock', 'blink vector'],
    screenshotHarnessScenario: 'enemyLabAttackVisuals:phase-blink-strike',
    notes: 'The attack now has a real lab execution path and is auditable like the core attacks.'
  }
];

const PROFILE_BY_ATTACK_ID = new Map(ENEMY_ATTACK_VISUAL_PROFILES.map((profile) => [profile.attackId, profile]));

export function getAttackVisualProfiles(): EnemyAttackVisualProfile[] {
  return ENEMY_ATTACK_VISUAL_PROFILES;
}

export function getAttackVisualProfile(attackId: EnemyAttackId): EnemyAttackVisualProfile {
  const profile = PROFILE_BY_ATTACK_ID.get(attackId);
  if (!profile) {
    throw new Error(`Missing visual profile for enemy attack ${attackId}.`);
  }
  return profile;
}

export function createAttackVisualAuditRows(
  definitions: EnemyAttackDefinition[] = ENEMY_ATTACK_DEFINITIONS
): EnemyAttackVisualAuditRow[] {
  return definitions.map((definition) => {
    const profile = getAttackVisualProfile(definition.id);
    return {
      attackId: definition.id,
      displayName: definition.displayName,
      batch: definition.lab.batch,
      status: definition.lab.status,
      visualFamily: profile.visualFamily,
      tellShape: profile.tellShape,
      dangerShape: profile.dangerShape,
      explicitMarkerLevel: profile.explicitMarkerLevel,
      reducedFxFallback: profile.reducedFxFallback,
      highContrastFallback: profile.highContrastFallback,
      nonColorCues: profile.nonColorCues,
      screenshotHarnessScenario: profile.screenshotHarnessScenario,
      beats: profile.beats
    };
  });
}

export function validateAttackVisualProfiles(
  definitions: EnemyAttackDefinition[] = ENEMY_ATTACK_DEFINITIONS
): string[] {
  const errors: string[] = [];
  const attackIds = definitions.map((definition) => definition.id);
  const attackIdSet = new Set(attackIds);
  const profileIds = ENEMY_ATTACK_VISUAL_PROFILES.map((profile) => profile.attackId);
  const profileIdSet = new Set(profileIds);

  if (profileIdSet.size !== profileIds.length) {
    errors.push('Enemy attack visual profile ids must be unique.');
  }

  for (const attackId of attackIds) {
    if (!profileIdSet.has(attackId)) {
      errors.push(`Missing visual profile for ${attackId}.`);
    }
  }

  for (const attackId of profileIds) {
    if (!attackIdSet.has(attackId)) {
      errors.push(`Visual profile references unknown attack ${attackId}.`);
    }
  }

  for (const profile of ENEMY_ATTACK_VISUAL_PROFILES) {
    const definition = definitions.find((candidate) => candidate.id === profile.attackId);
    if (!ATTACK_VISUAL_GRAMMAR[profile.visualFamily]) {
      errors.push(`${profile.attackId} uses unknown visual family ${profile.visualFamily}.`);
    }
    if (definition?.tags.includes('readability-critical') && profile.explicitMarkerLevel !== 'critical') {
      errors.push(`${profile.attackId} is readability-critical but does not use a critical marker level.`);
    }
    if (profile.nonColorCues.length < 2) {
      errors.push(`${profile.attackId} needs at least two non-color cues.`);
    }
    if (!profile.reducedFxFallback.trim()) {
      errors.push(`${profile.attackId} is missing a reduced-FX fallback.`);
    }
    if (!profile.highContrastFallback.trim()) {
      errors.push(`${profile.attackId} is missing a high-contrast fallback.`);
    }
    for (const [beat, description] of Object.entries(profile.beats)) {
      if (!description.trim()) {
        errors.push(`${profile.attackId} is missing ${beat} visual beat coverage.`);
      }
    }
    if (!profile.tellShape.trim() || !profile.dangerShape.trim() || !profile.markerPattern.trim()) {
      errors.push(`${profile.attackId} needs tell, danger, and marker pattern descriptions.`);
    }
  }

  return errors;
}
