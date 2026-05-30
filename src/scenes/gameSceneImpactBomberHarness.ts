import { getArenaCenter, type ArenaSize } from '../core/arena';
import { ENEMY_DEFINITIONS } from '../data/enemyDefinitions';
import {
  ENEMY_TELEGRAPH_RANDOM_MAX_MULTIPLIER,
  ENEMY_TELEGRAPH_RANDOM_MIN_MULTIPLIER
} from '../systems/enemyAi';
import type { EnemyInstance } from '../systems/enemySpawner';
import {
  IMPACT_BOMBER_PHASE_MODE_LABEL,
  getImpactBomberPhaseMixCounts,
  getImpactBomberPhaseMixedSpawnPlan,
  getImpactBomberPhaseSoloSpawnPlan,
  isImpactBomberPhaseSolo,
  resolveImpactBomberPhaseEnemyDefinitionId
} from '../systems/impactBomberPhaseSpawning';
import { resolveReactorPhaseEnemyDefinitionId } from '../systems/reactorPhaseSpawning';
import type { PlayerEnemyContact, StarvivorsTestHarness } from './gameTypes';

export interface ImpactBomberBlastFeedbackLog {
  sourceId: string;
  sourceDefinitionId?: string;
  x: number;
  y: number;
  radius: number;
  damage: number;
  time: number;
  ringCreated: boolean;
  ringRadius?: number;
  ringColor?: number;
}

export interface GameSceneImpactBomberHarnessAdapter {
  getHarness: () => StarvivorsTestHarness | undefined;
  getArena: () => ArenaSize;
  getTimeNow: () => number;
  getActiveValidationEnemyDefinitionId: () => string;
  getActiveValidationEnemyModeLabel: () => string;
  setActiveValidationEnemyMode: (definitionId: string, modeLabel: string) => void;
  startRun: () => void;
  clearEnemies: () => void;
  clearScrapPickups: () => void;
  clearPlayerProjectiles: () => void;
  clearEnemyProjectiles: () => void;
  resetPlayerForImpactCheck: (x: number, y: number) => void;
  placePlayerForImpactCheck: (x: number, y: number) => void;
  getPlayerPosition: () => { x: number; y: number };
  getPlayerCollisionRadius: () => number;
  getPlayerHull: () => number;
  getPlayerXp: () => number;
  getRunScrapTotal: () => number;
  getLiveEnemies: () => EnemyInstance[];
  getScrapPickupCount: () => number;
  spawnValidationEnemy: (
    definitionId: string,
    x: number,
    y: number,
    time: number,
    spawnMode: string
  ) => EnemyInstance | undefined;
  updateLiveEnemies: (time: number, deltaSeconds: number) => void;
  getWrappedDistance: (fromX: number, fromY: number, toX: number, toY: number) => number;
  getEnemyContact: () => PlayerEnemyContact | undefined;
  resolvePlayerEnemyContact: (contact: PlayerEnemyContact, time: number) => void;
  clearBlastFeedbackLog: () => void;
  getLastImpactBlastFeedback: () => ImpactBomberBlastFeedbackLog | undefined;
}

export function runImpactBomberPhaseHarness(adapter: GameSceneImpactBomberHarnessAdapter): void {
  const harness = adapter.getHarness();
  const resultAttribute = 'data-starvivors-impact-bomber-phase-harness';
  const detailsAttribute = 'data-starvivors-impact-bomber-phase-harness-details';

  if (!harness) {
    setBodyAttribute(resultAttribute, 'fail');
    setBodyAttribute(detailsAttribute, 'Harness was not installed.');
    return;
  }

  const previousValidationDefinitionId = adapter.getActiveValidationEnemyDefinitionId();
  const previousValidationModeLabel = adapter.getActiveValidationEnemyModeLabel();
  const restoreValidationMode = (): void => {
    adapter.setActiveValidationEnemyMode(previousValidationDefinitionId, previousValidationModeLabel);
  };
  const setFailure = (message: string): void => {
    setBodyAttribute(resultAttribute, 'fail');
    setBodyAttribute(detailsAttribute, message);
    restoreValidationMode();
  };
  const syncEnemyPosition = (enemy: EnemyInstance): void => {
    enemy.previousX = enemy.body.x;
    enemy.previousY = enemy.body.y;
    enemy.wrapMirrorBody.setPosition(enemy.body.x, enemy.body.y);
  };
  const spawnValidationEnemy = (
    definitionId: string,
    x: number,
    y: number,
    time: number,
    spawnMode = IMPACT_BOMBER_PHASE_MODE_LABEL
  ): EnemyInstance | undefined => {
    const enemy = adapter.spawnValidationEnemy(definitionId, x, y, time, spawnMode);
    if (enemy) {
      syncEnemyPosition(enemy);
    }
    return enemy;
  };

  adapter.clearBlastFeedbackLog();
  adapter.setActiveValidationEnemyMode(resolveImpactBomberPhaseEnemyDefinitionId(), IMPACT_BOMBER_PHASE_MODE_LABEL);
  adapter.startRun();
  adapter.clearEnemies();
  adapter.clearScrapPickups();
  adapter.clearPlayerProjectiles();
  adapter.clearEnemyProjectiles();

  const center = getArenaCenter(adapter.getArena());
  const baseTime = adapter.getTimeNow() + 1000;
  const proximityFuseDistance = adapter.getPlayerCollisionRadius() + 50;
  adapter.resetPlayerForImpactCheck(center.x, center.y);

  const activeValidationDefinitionId = adapter.getActiveValidationEnemyDefinitionId();
  const activeValidationModeLabel = adapter.getActiveValidationEnemyModeLabel();
  const activeValidationPass =
    activeValidationDefinitionId === resolveImpactBomberPhaseEnemyDefinitionId() &&
    activeValidationModeLabel === IMPACT_BOMBER_PHASE_MODE_LABEL;

  const soloPlan = getImpactBomberPhaseSoloSpawnPlan();
  for (let index = 0; index < soloPlan.length; index += 1) {
    const angle = (Math.PI * 2 * index) / Math.max(1, soloPlan.length);
    spawnValidationEnemy(
      soloPlan[index],
      center.x + Math.cos(angle) * 460,
      center.y + Math.sin(angle) * 460,
      baseTime
    );
  }

  const soloDefinitionIds = adapter.getLiveEnemies().map((enemy) => enemy.definitionId);
  const soloSpawnModes = [...new Set(adapter.getLiveEnemies().map((enemy) => enemy.stateData.spawnMode))];
  const soloOnlyPass = isImpactBomberPhaseSolo(soloDefinitionIds);
  const soloModePass = soloSpawnModes.length === 1 && soloSpawnModes[0] === IMPACT_BOMBER_PHASE_MODE_LABEL;

  adapter.clearEnemies();
  const mixedPlan = getImpactBomberPhaseMixedSpawnPlan();
  for (let index = 0; index < mixedPlan.length; index += 1) {
    const angle = (Math.PI * 2 * index) / Math.max(1, mixedPlan.length);
    spawnValidationEnemy(
      mixedPlan[index],
      center.x + Math.cos(angle) * 520,
      center.y + Math.sin(angle) * 520,
      baseTime + 1000,
      `${IMPACT_BOMBER_PHASE_MODE_LABEL}-mixed`
    );
  }

  const mixedDefinitionIds = adapter.getLiveEnemies().map((enemy) => enemy.definitionId);
  const mixedCounts = getImpactBomberPhaseMixCounts(mixedDefinitionIds);
  const expectedMixedCounts = getImpactBomberPhaseMixCounts(mixedPlan);
  const mixedSequencePass =
    mixedDefinitionIds.length === mixedPlan.length &&
    mixedDefinitionIds.every((definitionId, index) => definitionId === mixedPlan[index]);
  const mixedPass =
    mixedSequencePass &&
    mixedCounts.scout === expectedMixedCounts.scout &&
    mixedCounts['wedge-striker'] === expectedMixedCounts['wedge-striker'] &&
    mixedCounts['hex-tank'] === expectedMixedCounts['hex-tank'] &&
    mixedCounts['reactor-drone'] === expectedMixedCounts['reactor-drone'] &&
    mixedCounts['impact-bomber'] === expectedMixedCounts['impact-bomber'];

  adapter.clearEnemies();
  adapter.resetPlayerForImpactCheck(center.x, center.y);
  const approachEnemy = spawnValidationEnemy(
    resolveImpactBomberPhaseEnemyDefinitionId(),
    center.x + 180,
    center.y,
    baseTime + 2000
  );

  if (!approachEnemy) {
    setFailure('No Impact Bomber spawned for approach validation.');
    return;
  }

  approachEnemy.velocity.set(0, 0);
  syncEnemyPosition(approachEnemy);
  const approachPlayerPositionBefore = adapter.getPlayerPosition();
  const approachDistanceBefore = adapter.getWrappedDistance(
    approachEnemy.body.x,
    approachEnemy.body.y,
    approachPlayerPositionBefore.x,
    approachPlayerPositionBefore.y
  );
  adapter.updateLiveEnemies(baseTime + 2016, 1 / 60);
  const approachState = approachEnemy.state;
  const approachPlayerPositionAfter = adapter.getPlayerPosition();
  const approachDistanceAfter = adapter.getWrappedDistance(
    approachEnemy.body.x,
    approachEnemy.body.y,
    approachPlayerPositionAfter.x,
    approachPlayerPositionAfter.y
  );
  const approachPass =
    approachState === 'approach' &&
    approachEnemy.hp > 0 &&
    approachDistanceAfter < approachDistanceBefore;

  adapter.clearEnemies();
  adapter.resetPlayerForImpactCheck(center.x, center.y);
  adapter.clearBlastFeedbackLog();
  const fuseEnemy = spawnValidationEnemy(
    resolveImpactBomberPhaseEnemyDefinitionId(),
    center.x + proximityFuseDistance,
    center.y,
    baseTime + 3000
  );

  if (!fuseEnemy) {
    setFailure('No Impact Bomber spawned for proximity-fuse validation.');
    return;
  }

  fuseEnemy.velocity.set(0, 0);
  syncEnemyPosition(fuseEnemy);
  const fuseLiveEnemiesBefore = adapter.getLiveEnemies().length;
  const fuseHullBeforeStart = adapter.getPlayerHull();
  const fuseContactAtStart = adapter.getEnemyContact();
  const fuseStartTime = baseTime + 3016;
  adapter.updateLiveEnemies(fuseStartTime, 1 / 60);
  const fuseHullAfterStart = adapter.getPlayerHull();
  const fuseStartState = fuseEnemy.state;
  const fuseWarningCircleVisible = Boolean(fuseEnemy.telegraphs.warningCircle?.scene);
  const firstCountdownMs = Number(fuseEnemy.stateData.detonateCountdownMs ?? Number.NaN);
  const expectedCountdownMs = Number(fuseEnemy.definition.behavior.params?.countdownMs ?? 650);
  const expectedTriggerRange = Number(fuseEnemy.definition.behavior.params?.triggerRange ?? 100);
  const contactDistance = adapter.getPlayerCollisionRadius() + fuseEnemy.definition.stats.radius;
  const triggerDistanceGap = expectedTriggerRange - contactDistance;
  const countdownRandomizedPass =
    Number.isFinite(firstCountdownMs) &&
    firstCountdownMs >= expectedCountdownMs * ENEMY_TELEGRAPH_RANDOM_MIN_MULTIPLIER &&
    firstCountdownMs <= expectedCountdownMs * ENEMY_TELEGRAPH_RANDOM_MAX_MULTIPLIER;
  const firstCountdownForTiming = Number.isFinite(firstCountdownMs) ? firstCountdownMs : expectedCountdownMs;
  const expectedBlastRadius = Number(fuseEnemy.definition.behavior.params?.blastRadius ?? 125);
  const fuseStartPass =
    adapter.getLiveEnemies().length === fuseLiveEnemiesBefore &&
    fuseEnemy.hp > 0 &&
    !fuseContactAtStart &&
    proximityFuseDistance > contactDistance &&
    proximityFuseDistance <= expectedTriggerRange &&
    triggerDistanceGap >= 32 &&
    fuseStartState === 'detonating' &&
    fuseWarningCircleVisible &&
    countdownRandomizedPass &&
    fuseHullAfterStart === fuseHullBeforeStart &&
    adapter.getLastImpactBlastFeedback() === undefined;

  adapter.placePlayerForImpactCheck(center.x + 420, center.y);
  const fuseCancelTime = fuseStartTime + Math.max(120, firstCountdownForTiming * 0.35);
  const fuseHullBeforeCancel = adapter.getPlayerHull();
  adapter.updateLiveEnemies(fuseCancelTime, 1 / 60);
  const fuseHullAfterCancel = adapter.getPlayerHull();
  const fuseCancelState = fuseEnemy.state;
  const fuseWarningCircleAfterCancel = Boolean(fuseEnemy.telegraphs.warningCircle?.scene);
  const countdownAfterCancel = fuseEnemy.stateData.detonateCountdownMs;
  const fuseResetPass =
    adapter.getLiveEnemies().length === fuseLiveEnemiesBefore &&
    fuseEnemy.hp > 0 &&
    fuseCancelState === 'approach' &&
    !fuseWarningCircleAfterCancel &&
    countdownAfterCancel === undefined &&
    fuseHullAfterCancel === fuseHullBeforeCancel &&
    adapter.getLastImpactBlastFeedback() === undefined;

  adapter.placePlayerForImpactCheck(fuseEnemy.body.x, fuseEnemy.body.y);
  const fuseRestartTime = fuseCancelTime + 180;
  const fuseHullBeforeRestart = adapter.getPlayerHull();
  adapter.updateLiveEnemies(fuseRestartTime, 1 / 60);
  const fuseHullAfterRestart = adapter.getPlayerHull();
  const fuseRestartState = fuseEnemy.state;
  const restartCountdownMs = Number(fuseEnemy.stateData.detonateCountdownMs ?? Number.NaN);
  const restartCountdownRandomizedPass =
    Number.isFinite(restartCountdownMs) &&
    restartCountdownMs >= expectedCountdownMs * ENEMY_TELEGRAPH_RANDOM_MIN_MULTIPLIER &&
    restartCountdownMs <= expectedCountdownMs * ENEMY_TELEGRAPH_RANDOM_MAX_MULTIPLIER;
  const restartCountdownForTiming = Number.isFinite(restartCountdownMs) ? restartCountdownMs : expectedCountdownMs;
  const fuseRestartPass =
    adapter.getLiveEnemies().length === fuseLiveEnemiesBefore &&
    fuseEnemy.hp > 0 &&
    fuseRestartState === 'detonating' &&
    fuseEnemy.stateStartedAt === fuseRestartTime &&
    Boolean(fuseEnemy.telegraphs.warningCircle?.scene) &&
    restartCountdownRandomizedPass &&
    fuseHullAfterRestart === fuseHullBeforeRestart &&
    adapter.getLastImpactBlastFeedback() === undefined;

  const fuseHullBeforeResolve = adapter.getPlayerHull();
  adapter.updateLiveEnemies(fuseRestartTime + restartCountdownForTiming + 32, 1 / 60);
  const fuseHullAfterResolve = adapter.getPlayerHull();
  const fuseLiveEnemiesAfterResolve = adapter.getLiveEnemies().length;
  const fuseBlastFeedback = adapter.getLastImpactBlastFeedback();
  const fuseResolvePass =
    fuseLiveEnemiesAfterResolve === fuseLiveEnemiesBefore - 1 &&
    fuseEnemy.hp <= 0;
  const blastFeedbackPass =
    Boolean(fuseBlastFeedback?.ringCreated) &&
    fuseBlastFeedback?.radius === expectedBlastRadius &&
    fuseBlastFeedback?.ringRadius === expectedBlastRadius;
  const insideBlastPass = fuseHullAfterResolve < fuseHullBeforeResolve;

  adapter.clearEnemies();
  adapter.resetPlayerForImpactCheck(center.x, center.y);
  adapter.clearBlastFeedbackLog();
  const escapeEnemy = spawnValidationEnemy(
    resolveImpactBomberPhaseEnemyDefinitionId(),
    center.x + proximityFuseDistance,
    center.y,
    baseTime + 5000
  );

  if (!escapeEnemy) {
    setFailure('No Impact Bomber spawned for escape-before-blast validation.');
    return;
  }

  escapeEnemy.velocity.set(0, 0);
  syncEnemyPosition(escapeEnemy);
  const escapeStartTime = baseTime + 5016;
  adapter.updateLiveEnemies(escapeStartTime, 1 / 60);
  const escapeCountdownMs = Number(escapeEnemy.stateData.detonateCountdownMs ?? expectedCountdownMs);
  const outsideHullBefore = adapter.getPlayerHull();
  adapter.placePlayerForImpactCheck(center.x + 420, center.y);
  adapter.updateLiveEnemies(escapeStartTime + escapeCountdownMs + 32, 1 / 60);
  const outsideHullAfter = adapter.getPlayerHull();
  const outsideBlastFeedback = adapter.getLastImpactBlastFeedback();
  const outsideBlastPass =
    outsideHullAfter === outsideHullBefore &&
    outsideBlastFeedback === undefined &&
    adapter.getLiveEnemies().includes(escapeEnemy) &&
    escapeEnemy.hp > 0 &&
    escapeEnemy.state === 'approach' &&
    escapeEnemy.stateData.detonateCountdownMs === undefined;

  adapter.clearEnemies();
  adapter.clearScrapPickups();
  adapter.resetPlayerForImpactCheck(center.x, center.y);
  const rewardEnemy = spawnValidationEnemy(
    resolveImpactBomberPhaseEnemyDefinitionId(),
    center.x + proximityFuseDistance,
    center.y,
    baseTime + 7000
  );

  if (!rewardEnemy) {
    setFailure('No Impact Bomber spawned for reward validation.');
    return;
  }

  rewardEnemy.velocity.set(0, 0);
  syncEnemyPosition(rewardEnemy);
  const rewardLiveEnemiesBefore = adapter.getLiveEnemies().length;
  const rewardScrapBefore = adapter.getScrapPickupCount();
  const rewardXpBefore = adapter.getPlayerXp();
  const rewardRunScrapBefore = adapter.getRunScrapTotal();
  const rewardStartTime = baseTime + 7016;
  adapter.updateLiveEnemies(rewardStartTime, 1 / 60);
  const rewardCountdownMs = Number(rewardEnemy.stateData.detonateCountdownMs ?? expectedCountdownMs);
  adapter.updateLiveEnemies(rewardStartTime + rewardCountdownMs + 32, 1 / 60);
  const rewardScrapAfterDeath = adapter.getScrapPickupCount();
  const rewardLiveEnemiesAfterDeath = adapter.getLiveEnemies().length;
  const collectedRewards = harness.collectAllScrap();
  const rewardDeathPathPass =
    rewardLiveEnemiesAfterDeath === rewardLiveEnemiesBefore - 1 &&
    rewardScrapAfterDeath > rewardScrapBefore &&
    collectedRewards.runScrapTotal > rewardRunScrapBefore &&
    collectedRewards.playerXp > rewardXpBefore;

  adapter.clearEnemies();
  adapter.resetPlayerForImpactCheck(center.x, center.y);
  const contactEnemy = spawnValidationEnemy(
    resolveImpactBomberPhaseEnemyDefinitionId(),
    center.x,
    center.y,
    baseTime + 9000
  );

  if (!contactEnemy) {
    setFailure('No Impact Bomber spawned for body-contact validation.');
    return;
  }

  contactEnemy.velocity.set(0, 0);
  syncEnemyPosition(contactEnemy);
  const contactHpBefore = contactEnemy.hp;
  const contact = adapter.getEnemyContact();
  if (contact) {
    adapter.resolvePlayerEnemyContact(contact, baseTime + 9016);
  }
  const contactHpAfter = contactEnemy.hp;
  const bodyContactHpPass = Boolean(contact) && contactHpAfter === contactHpBefore;

  const impactDefinition = ENEMY_DEFINITIONS.find((definition) => definition.id === resolveImpactBomberPhaseEnemyDefinitionId());
  const reactorDefinition = ENEMY_DEFINITIONS.find((definition) => definition.id === resolveReactorPhaseEnemyDefinitionId());
  const behaviorParams = impactDefinition?.behavior.params;
  const impactIdentityPass = Boolean(
    impactDefinition &&
    reactorDefinition &&
    impactDefinition.behavior.id === 'proximityDetonate' &&
    behaviorParams?.triggerRange === 100 &&
    behaviorParams?.blastRadius === 125 &&
    behaviorParams?.countdownMs === 650 &&
    behaviorParams?.resetCountdownOnExit === true &&
    behaviorParams?.blastDamage === 26 &&
    impactDefinition.stats.hp < reactorDefinition.stats.hp &&
    impactDefinition.stats.speed > reactorDefinition.stats.speed
  );
  const visualRecipePass = Boolean(
    impactDefinition?.shapeRecipe?.basePolygon === 'block-square' &&
    impactDefinition?.shapeRecipe?.attachments?.includes('danger-mark') &&
    !impactDefinition?.shapeRecipe?.attachments?.includes('core-ring') &&
    reactorDefinition?.shapeRecipe?.basePolygon === 'starburst' &&
    reactorDefinition?.shapeRecipe?.attachments?.includes('core-ring')
  );
  const effectIdentityPass = Boolean(
    impactDefinition?.effectRecipe?.spawn.color === 0xffc857 &&
    impactDefinition?.effectRecipe?.move.color === 0xff8f4f &&
    impactDefinition?.effectRecipe?.telegraph.radius === 125 &&
    impactDefinition?.effectRecipe?.death.kind === 'shard-burst'
  );

  const pass =
    activeValidationPass &&
    soloOnlyPass &&
    soloModePass &&
    mixedPass &&
    approachPass &&
    fuseStartPass &&
    fuseResetPass &&
    fuseRestartPass &&
    fuseResolvePass &&
    blastFeedbackPass &&
    insideBlastPass &&
    outsideBlastPass &&
    rewardDeathPathPass &&
    bodyContactHpPass &&
    impactIdentityPass &&
    visualRecipePass &&
    effectIdentityPass;

  setBodyAttribute(resultAttribute, pass ? 'pass' : 'fail');
  setBodyAttribute(
    detailsAttribute,
    JSON.stringify({
      mode: IMPACT_BOMBER_PHASE_MODE_LABEL,
      activeValidation: {
        definitionId: activeValidationDefinitionId,
        modeLabel: activeValidationModeLabel,
        pass: activeValidationPass
      },
      soloDefinitionIds,
      soloSpawnModes,
      soloOnlyPass,
      soloModePass,
      mixedDefinitionIds,
      mixedPlan,
      mixedCounts,
      expectedMixedCounts,
      mixedSequencePass,
      mixedPass,
      approach: {
        approachState,
        approachDistanceBefore,
        approachDistanceAfter,
        approachPass
      },
      proximityFuse: {
        fuseLiveEnemiesBefore,
        proximityFuseDistance,
        contactDistance,
        expectedTriggerRange,
        triggerDistanceGap,
        fuseContactAtStart: Boolean(fuseContactAtStart),
        fuseStartState,
        fuseWarningCircleVisible,
        firstCountdownMs,
        expectedCountdownMinMs: expectedCountdownMs * ENEMY_TELEGRAPH_RANDOM_MIN_MULTIPLIER,
        expectedCountdownMaxMs: expectedCountdownMs * ENEMY_TELEGRAPH_RANDOM_MAX_MULTIPLIER,
        countdownRandomizedPass,
        fuseHullBeforeStart,
        fuseHullAfterStart,
        fuseStartPass,
        fuseCancelState,
        fuseWarningCircleAfterCancel,
        countdownAfterCancel,
        fuseHullBeforeCancel,
        fuseHullAfterCancel,
        fuseResetPass,
        fuseRestartState,
        restartCountdownMs,
        restartCountdownRandomizedPass,
        fuseHullBeforeRestart,
        fuseHullAfterRestart,
        fuseRestartPass,
        fuseLiveEnemiesAfterResolve,
        fuseResolvePass
      },
      blastFeedback: {
        fuseBlastFeedback,
        outsideBlastFeedback,
        expectedBlastRadius,
        blastFeedbackPass
      },
      insideBlast: {
        insideHullBefore: fuseHullBeforeResolve,
        insideHullAfter: fuseHullAfterResolve,
        insideBlastPass
      },
      outsideBlast: {
        outsideHullBefore,
        outsideHullAfter,
        outsideBlastPass
      },
      rewards: {
        rewardDeathPathPass,
        rewardLiveEnemiesBefore,
        rewardLiveEnemiesAfterDeath,
        rewardScrapBefore,
        rewardScrapAfterDeath,
        rewardRunScrapBefore,
        rewardRunScrapAfterCollect: collectedRewards.runScrapTotal,
        rewardXpBefore,
        rewardXpAfterCollect: collectedRewards.playerXp
      },
      bodyContact: {
        contactDetected: Boolean(contact),
        contactHpBefore,
        contactHpAfter,
        bodyContactHpPass
      },
      impactIdentity: impactDefinition
        ? {
            behaviorId: impactDefinition.behavior.id,
            triggerRange: behaviorParams?.triggerRange,
            blastRadius: behaviorParams?.blastRadius,
            countdownMs: behaviorParams?.countdownMs,
            blastDamage: behaviorParams?.blastDamage,
            hp: impactDefinition.stats.hp,
            speed: impactDefinition.stats.speed,
            pass: impactIdentityPass
          }
        : null,
      visualRecipe: impactDefinition
        ? {
            basePolygon: impactDefinition.shapeRecipe?.basePolygon,
            attachments: impactDefinition.shapeRecipe?.attachments,
            reactorBasePolygon: reactorDefinition?.shapeRecipe?.basePolygon,
            reactorAttachments: reactorDefinition?.shapeRecipe?.attachments,
            visualRecipePass,
            effectIdentityPass
          }
        : null,
      pass
    })
  );
  restoreValidationMode();
}

function setBodyAttribute(name: string, value: string): void {
  if (typeof document !== 'undefined') {
    document.body.setAttribute(name, value);
  }
}
