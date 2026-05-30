import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import type { EnemyDefinition } from '../data/enemyDefinitions';
import type { EnemyInstance } from './enemySpawner';
import { destroyTelegraphs, updateEnemyDebugLabel } from './enemySpawner';
import {
  createEffectLaneImage,
  createEffectRingImage,
  setEffectLaneSize,
  setEffectRingRadius
} from './effectTextures';
import { dampVelocityChannel, moveBodyWithVelocityChannels } from './physics';
import type { EnemyStatusEffect } from './playerStatusEffects';

export interface EnemyProjectileRequest {
  x: number;
  y: number;
  direction: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  range: number;
  radius: number;
  color: number;
  statuses?: EnemyStatusEffect[];
}

export interface EnemyScrapTarget {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  value?: number;
}

export interface UpdateEnemyAiInput {
  scene: Phaser.Scene;
  arena: ArenaSize;
  enemies: EnemyInstance[];
  scrapPickups: EnemyScrapTarget[];
  playerX: number;
  playerY: number;
  playerVelocity: Phaser.Math.Vector2;
  time: number;
  deltaSeconds: number;
  isAiEnabled: boolean;
  telegraphsEnabled: boolean;
  enemySpeedMultiplier: number;
  enemyFireRateMultiplier: number;
  enemyDeconflictionEnabled: boolean;
  enemyDeconflictionStrength: number;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
  applyWorldForcesToEnemy?: (enemy: EnemyInstance, index: number, deltaSeconds: number, time: number) => boolean;
  fireEnemyProjectile: (request: EnemyProjectileRequest) => void;
  explodeAt: (x: number, y: number, radius: number, damage: number, sourceId: string) => void;
  spawnChild: (definitionId: string, x: number, y: number) => void;
  stealScrap?: (target: EnemyScrapTarget, enemy: EnemyInstance) => number;
  emitEnemyBurst: (x: number, y: number, color: number, count?: number) => void;
}

const DEFAULT_ENEMY_RESPONSE = 4.2;
const PROJECTILE_RADIUS = 8;
const DECONFLICTION_BUFFER_PX = 14;
const DECONFLICTION_MAX_NUDGE_SPEED = 95;
const DECONFLICTION_POSITION_CORRECTION = 0.45;
const MIN_DECONFLICTION_DISTANCE = 0.001;
const CONTACT_RECOIL_DRIFT_DAMPING = 0.74;
export const ENEMY_TELEGRAPH_WARNING_COLOR = 0xff3030;
export const ENEMY_TELEGRAPH_WARNING_ALPHA = 0.34;
export const ENEMY_TELEGRAPH_WARNING_READY_ALPHA = 0.88;
export const ENEMY_TELEGRAPH_RANDOM_MIN_MULTIPLIER = 0.82;
export const ENEMY_TELEGRAPH_RANDOM_MAX_MULTIPLIER = 1.24;
const ENEMY_PROJECTILE_TELEGRAPH_MS = 360;
const ENEMY_TELEGRAPH_BRIGHTEN_START = 0.52;

export const HANDLED_ENEMY_BEHAVIOR_IDS = [
  'directChase',
  'ambushReveal',
  'berserkChase',
  'orbiterCage',
  'patrolAlert',
  'statusShooter',
  'summonerShooter',
  'scrapThief',
  'chargeDash',
  'rangeOrbitShooter',
  'heavyChase',
  'proximityDetonate',
  'splitterChase',
  'sniper',
  'carrierSpawner',
  'shieldSupport',
  'repairSupport',
  'commandBuff',
  'scrapScavenger',
  'flanker',
  'reflectorPulse',
  'phaseTeleport'
] as const satisfies readonly EnemyDefinition['behavior']['id'][];

export function updateEnemyAi(input: UpdateEnemyAiInput): void {
  resetTemporaryBuffs(input.enemies, input.time);

  if (input.isAiEnabled) {
    applySupportFields(input);
  }

  for (const enemy of input.enemies) {
    if (!input.isAiEnabled) {
      enemy.velocity.scale(Math.pow(0.92, input.deltaSeconds * 60));
      updateEnemyVisualPulse(enemy, input.time);
      continue;
    }

    if (updateContactRecoil(input, enemy)) {
      updateEnemyVisualPulse(enemy, input.time);
      updateEnemyDebugLabel(enemy);
      continue;
    }

    enemy.stateData.contactSuppressed = false;

    switch (enemy.definition.behavior.id) {
      case 'ambushReveal':
        updateAmbushReveal(input, enemy);
        break;
      case 'berserkChase':
        updateBerserkChase(input, enemy);
        break;
      case 'orbiterCage':
        updateOrbiterCage(input, enemy);
        break;
      case 'patrolAlert':
        updatePatrolAlert(input, enemy);
        break;
      case 'statusShooter':
        updateStatusShooter(input, enemy);
        break;
      case 'summonerShooter':
        updateSummonerShooter(input, enemy);
        break;
      case 'scrapThief':
        updateScrapThief(input, enemy);
        break;
      case 'chargeDash':
        updateChargeDash(input, enemy);
        break;
      case 'rangeOrbitShooter':
        updateRangeOrbitShooter(input, enemy);
        break;
      case 'heavyChase':
        updateChase(input, enemy, 0.72);
        break;
      case 'proximityDetonate':
        updateProximityDetonate(input, enemy);
        break;
      case 'splitterChase':
        updateChase(input, enemy, 0.88);
        break;
      case 'sniper':
        updateSniper(input, enemy);
        break;
      case 'carrierSpawner':
        updateCarrierSpawner(input, enemy);
        break;
      case 'shieldSupport':
      case 'repairSupport':
      case 'commandBuff':
        updateSupportShip(input, enemy);
        break;
      case 'scrapScavenger':
        updateScrapScavenger(input, enemy);
        break;
      case 'flanker':
        updateFlanker(input, enemy);
        break;
      case 'reflectorPulse':
        updateReflector(input, enemy);
        break;
      case 'phaseTeleport':
        updatePhaseTeleport(input, enemy);
        break;
      case 'directChase':
      default:
        updateChase(input, enemy, 1);
        break;
    }

    updateEnemyVisualPulse(enemy, input.time);
    updateEnemyDebugLabel(enemy);
  }

  applyEnemyDeconfliction(input);

  for (let index = input.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = input.enemies[index];
    if (input.applyWorldForcesToEnemy?.(enemy, index, input.deltaSeconds, input.time)) {
      continue;
    }

    moveEnemy(input, enemy);
    updateEnemyVisualPulse(enemy, input.time);
    updateEnemyDebugLabel(enemy);
  }
}

function updateContactRecoil(input: UpdateEnemyAiInput, enemy: EnemyInstance): boolean {
  const recoilUntil = getEnemyStateNumber(enemy, 'contactRecoilUntil');

  if (input.time >= recoilUntil) {
    if (enemy.state === 'contact-recoil') {
      const baseScaleX = getEnemyStateNumber(enemy, 'contactRecoilBaseScaleX') || 1;
      const baseScaleY = getEnemyStateNumber(enemy, 'contactRecoilBaseScaleY') || 1;
      const resumeState = typeof enemy.stateData.contactRecoilResumeState === 'string'
        ? enemy.stateData.contactRecoilResumeState
        : 'chase';
      const resumeStartedAt = getEnemyStateOptionalNumber(enemy, 'contactRecoilResumeStartedAt') ?? input.time;
      enemy.body.setScale(baseScaleX, baseScaleY);
      enemy.wrapMirrorBody.setScale(baseScaleX, baseScaleY);
      enemy.state = resumeState;
      enemy.stateStartedAt = resumeStartedAt;
      delete enemy.stateData.contactRecoilBaseScaleX;
      delete enemy.stateData.contactRecoilBaseScaleY;
      delete enemy.stateData.contactRecoilResumeState;
      delete enemy.stateData.contactRecoilResumeStartedAt;
    }

    return false;
  }

  enemy.state = 'contact-recoil';
  if (getEnemyStateNumber(enemy, 'contactRecoilBaseScaleX') <= 0) {
    enemy.stateData.contactRecoilBaseScaleX = enemy.body.scaleX || 1;
    enemy.stateData.contactRecoilBaseScaleY = enemy.body.scaleY || 1;
  }
  const recoilScaleX = (getEnemyStateNumber(enemy, 'contactRecoilBaseScaleX') || 1) * 1.08;
  const recoilScaleY = (getEnemyStateNumber(enemy, 'contactRecoilBaseScaleY') || 1) * 0.96;
  enemy.body.setScale(recoilScaleX, recoilScaleY);
  enemy.wrapMirrorBody.setScale(recoilScaleX, recoilScaleY);
  dampVelocityChannel(enemy.velocity, CONTACT_RECOIL_DRIFT_DAMPING, input.deltaSeconds);
  return true;
}

function getEnemyStateNumber(enemy: EnemyInstance, key: string): number {
  const value = enemy.stateData[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getEnemyStateOptionalNumber(enemy: EnemyInstance, key: string): number | undefined {
  const value = enemy.stateData[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getRandomizedTelegraphDurationMs(enemy: EnemyInstance, key: string, baseDurationMs: number): number {
  const existing = getEnemyStateOptionalNumber(enemy, key);
  if (existing !== undefined) {
    return existing;
  }

  if (baseDurationMs <= 0) {
    enemy.stateData[key] = 0;
    return 0;
  }

  const duration = Math.max(
    80,
    Math.round(baseDurationMs * Phaser.Math.FloatBetween(
      ENEMY_TELEGRAPH_RANDOM_MIN_MULTIPLIER,
      ENEMY_TELEGRAPH_RANDOM_MAX_MULTIPLIER
    ))
  );
  enemy.stateData[key] = duration;
  return duration;
}

export function getEnemyTelegraphWarningAlpha(progress: number): number {
  const resolveProgress = Phaser.Math.Clamp(
    (Phaser.Math.Clamp(progress, 0, 1) - ENEMY_TELEGRAPH_BRIGHTEN_START) / (1 - ENEMY_TELEGRAPH_BRIGHTEN_START),
    0,
    1
  );
  const easedProgress = resolveProgress * resolveProgress;

  return Phaser.Math.Linear(ENEMY_TELEGRAPH_WARNING_ALPHA, ENEMY_TELEGRAPH_WARNING_READY_ALPHA, easedProgress);
}

export function getWrappedDirection(arena: ArenaSize, fromX: number, fromY: number, toX: number, toY: number): Phaser.Math.Vector2 {
  let x = toX - fromX;
  let y = toY - fromY;

  if (Math.abs(x) > arena.width / 2) {
    x -= Math.sign(x) * arena.width;
  }

  if (Math.abs(y) > arena.height / 2) {
    y -= Math.sign(y) * arena.height;
  }

  return new Phaser.Math.Vector2(x, y);
}

function resetTemporaryBuffs(enemies: EnemyInstance[], time: number): void {
  for (const enemy of enemies) {
    if (time > enemy.shieldedUntil) {
      enemy.damageReduction = 0;
    }

    if (time > enemy.buffedUntil) {
      enemy.speedMultiplier = 1;
      enemy.fireRateMultiplier = 1;
      enemy.damageMultiplier = 1;
    }

    const reflectingUntil = getEnemyStateNumber(enemy, 'reflectingUntil');
    if (reflectingUntil > 0 && time > reflectingUntil) {
      enemy.stateData.reflecting = false;
      enemy.stateData.reflectingUntil = 0;
    }
  }
}

function applyEnemyDeconfliction(input: UpdateEnemyAiInput): void {
  if (!input.enemyDeconflictionEnabled || input.enemyDeconflictionStrength <= 0 || input.enemies.length < 2) {
    return;
  }

  const clampedStrength = Phaser.Math.Clamp(input.enemyDeconflictionStrength, 0, 3);
  const maxNudgeSpeed = DECONFLICTION_MAX_NUDGE_SPEED * clampedStrength;
  const velocityNudges = new Map<string, Phaser.Math.Vector2>();

  for (let firstIndex = 0; firstIndex < input.enemies.length - 1; firstIndex += 1) {
    const first = input.enemies[firstIndex];
    if (first.hp <= 0) {
      continue;
    }

    for (let secondIndex = firstIndex + 1; secondIndex < input.enemies.length; secondIndex += 1) {
      const second = input.enemies[secondIndex];
      if (second.hp <= 0) {
        continue;
      }

      const offset = getWrappedDirection(input.arena, first.body.x, first.body.y, second.body.x, second.body.y);
      const distance = offset.length();
      const firstRadius = first.definition.stats.radius;
      const secondRadius = second.definition.stats.radius;
      const hardDistance = firstRadius + secondRadius;
      const reminderDistance = hardDistance + DECONFLICTION_BUFFER_PX;

      if (distance >= reminderDistance) {
        continue;
      }

      const normal = distance > MIN_DECONFLICTION_DISTANCE
        ? offset.clone().scale(1 / distance)
        : new Phaser.Math.Vector2(Math.cos(firstIndex + secondIndex), Math.sin(firstIndex + secondIndex)).normalize();
      const closeness = 1 - distance / reminderDistance;
      const overlap = Math.max(0, hardDistance - distance);
      const firstShare = getDeconflictionShare(first, second);
      const secondShare = getDeconflictionShare(second, first);
      const firstMultiplier = getEnemyDeconflictionMultiplier(first);
      const secondMultiplier = getEnemyDeconflictionMultiplier(second);
      const nudgeSpeed = maxNudgeSpeed * closeness * closeness;

      addVelocityNudge(velocityNudges, first.id, -normal.x * nudgeSpeed * firstShare * firstMultiplier, -normal.y * nudgeSpeed * firstShare * firstMultiplier);
      addVelocityNudge(velocityNudges, second.id, normal.x * nudgeSpeed * secondShare * secondMultiplier, normal.y * nudgeSpeed * secondShare * secondMultiplier);

      if (overlap > 0) {
        const correction = overlap * DECONFLICTION_POSITION_CORRECTION * clampedStrength;
        first.body.x = wrapCoordinate(first.body.x - normal.x * correction * firstShare * firstMultiplier, input.arena.width);
        first.body.y = wrapCoordinate(first.body.y - normal.y * correction * firstShare * firstMultiplier, input.arena.height);
        second.body.x = wrapCoordinate(second.body.x + normal.x * correction * secondShare * secondMultiplier, input.arena.width);
        second.body.y = wrapCoordinate(second.body.y + normal.y * correction * secondShare * secondMultiplier, input.arena.height);
      }
    }
  }

  for (const enemy of input.enemies) {
    const nudge = velocityNudges.get(enemy.id);
    if (!nudge) {
      continue;
    }

    nudge.limit(maxNudgeSpeed);
    enemy.velocity.add(nudge);
  }
}

function addVelocityNudge(nudges: Map<string, Phaser.Math.Vector2>, enemyId: string, x: number, y: number): void {
  const nudge = nudges.get(enemyId);
  if (nudge) {
    nudge.x += x;
    nudge.y += y;
  } else {
    nudges.set(enemyId, new Phaser.Math.Vector2(x, y));
  }
}

function getDeconflictionShare(self: EnemyInstance, other: EnemyInstance): number {
  return 0.5;
}

function getEnemyDeconflictionMultiplier(enemy: EnemyInstance): number {
  if (enemy.definition.behavior.id === 'ambushReveal' && enemy.state === 'hidden') {
    return 0.25;
  }

  if (enemy.definition.behavior.id === 'orbiterCage') {
    return 1.18;
  }

  if (enemy.definition.behavior.id === 'chargeDash' && enemy.state === 'charging') {
    return 0;
  }

  if (enemy.definition.behavior.id === 'proximityDetonate' && enemy.state === 'detonating') {
    return 0.35;
  }

  if (enemy.definition.behavior.id === 'sniper') {
    return 1.25;
  }

  if (enemy.definition.behavior.id === 'carrierSpawner') {
    return 0.7;
  }

  if (enemy.definition.behavior.id === 'heavyChase') {
    return 0.82;
  }

  return 1;
}

function applySupportFields(input: UpdateEnemyAiInput): void {
  for (const source of input.enemies) {
    if (source.hp <= 0) {
      continue;
    }

    const behavior = source.definition.behavior;
    if (behavior.id === 'shieldSupport') {
      const auraRadius = getParam(source.definition, 'auraRadius', 230);
      const reduction = getParam(source.definition, 'damageReduction', 0.45);
      for (const target of input.enemies) {
        if (target.id === source.id || target.hp <= 0) {
          continue;
        }

        if (getWrappedDirection(input.arena, source.body.x, source.body.y, target.body.x, target.body.y).length() <= auraRadius) {
          target.damageReduction = Math.max(target.damageReduction, reduction);
          target.shieldedUntil = input.time + 120;
        }
      }
      updateAura(input, source, auraRadius, 0x42a5f5, 0.18);
    } else if (behavior.id === 'commandBuff') {
      const auraRadius = getParam(source.definition, 'auraRadius', 270);
      const speedBonus = getParam(source.definition, 'speedBonus', 1.22);
      const fireRateBonus = getParam(source.definition, 'fireRateBonus', 0.78);
      for (const target of input.enemies) {
        if (target.id === source.id || target.hp <= 0) {
          continue;
        }

        if (getWrappedDirection(input.arena, source.body.x, source.body.y, target.body.x, target.body.y).length() <= auraRadius) {
          target.speedMultiplier = Math.max(target.speedMultiplier, speedBonus);
          target.fireRateMultiplier = Math.min(target.fireRateMultiplier, fireRateBonus);
          target.damageMultiplier = Math.max(target.damageMultiplier, 1.16);
          target.buffedUntil = input.time + 120;
        }
      }
      updateAura(input, source, auraRadius, 0xffd166, 0.15);
    }
  }
}

function updateAmbushReveal(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const revealRange = getParam(enemy.definition, 'revealRange', 220);
  const revealMs = getParam(enemy.definition, 'revealMs', 420);
  const strikeMs = getParam(enemy.definition, 'strikeMs', 360);
  const strikeSpeed = getParam(enemy.definition, 'strikeSpeed', 460) * input.enemySpeedMultiplier * enemy.speedMultiplier;
  const chaseScale = getParam(enemy.definition, 'chaseSpeedScale', 1.18);
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const elapsed = input.time - enemy.stateStartedAt;

  if (enemy.state === 'idle') {
    enemy.state = 'hidden';
    enemy.stateStartedAt = input.time;
    enemy.body.setAlpha(0.18);
    enemy.wrapMirrorBody.setAlpha(0.18);
  }

  if (enemy.state === 'hidden') {
    enemy.stateData.contactSuppressed = true;
    enemy.velocity.scale(Math.pow(0.8, input.deltaSeconds * 60));
    enemy.body.setAlpha(0.12 + Math.sin(input.time * 0.004 + enemy.id.length) * 0.04);
    enemy.wrapMirrorBody.setAlpha(enemy.body.alpha);
    if (offset.length() <= revealRange) {
      enemy.state = 'ambush-windup';
      enemy.stateStartedAt = input.time;
      enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
      input.emitEnemyBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, 9);
    }
    return;
  }

  enemy.body.setAlpha(1);
  enemy.wrapMirrorBody.setAlpha(1);

  if (enemy.state === 'ambush-windup') {
    enemy.stateData.contactSuppressed = true;
    enemy.velocity.scale(Math.pow(0.82, input.deltaSeconds * 60));
    enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
    updateChargeTelegraph(input, enemy, Math.min(1, elapsed / revealMs));
    if (elapsed >= revealMs) {
      const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, enemy.target.x, enemy.target.y).normalize();
      enemy.velocity.copy(direction.scale(strikeSpeed));
      enemy.state = 'ambush-strike';
      enemy.stateStartedAt = input.time;
      destroyTelegraphs(enemy);
    }
    return;
  }

  if (enemy.state === 'ambush-strike') {
    if (enemy.velocity.lengthSq() > 0) {
      enemy.body.rotation = Math.atan2(enemy.velocity.x, -enemy.velocity.y);
    }
    if (elapsed >= strikeMs) {
      enemy.state = 'chase';
      enemy.stateStartedAt = input.time;
    }
    return;
  }

  updateChase(input, enemy, chaseScale);
}

function updateBerserkChase(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const firstThreshold = getParam(enemy.definition, 'firstThreshold', 0.5);
  const secondThreshold = getParam(enemy.definition, 'secondThreshold', 0.25);
  const calmScale = getParam(enemy.definition, 'calmSpeedScale', 0.94);
  const firstScale = getParam(enemy.definition, 'firstSpeedScale', 1.34);
  const secondScale = getParam(enemy.definition, 'secondSpeedScale', 1.76);
  const visualScale = hpRatio <= secondThreshold ? 1.18 : hpRatio <= firstThreshold ? 1.09 : 1;
  const speedScale = hpRatio <= secondThreshold ? secondScale : hpRatio <= firstThreshold ? firstScale : calmScale;

  enemy.damageMultiplier = Math.max(enemy.damageMultiplier, hpRatio <= secondThreshold ? 1.28 : hpRatio <= firstThreshold ? 1.12 : 1);
  enemy.body.setScale(visualScale);
  enemy.wrapMirrorBody.setScale(visualScale);
  enemy.state = hpRatio <= secondThreshold ? 'berserk-2' : hpRatio <= firstThreshold ? 'berserk-1' : 'stalk';
  const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  steerToward(input, enemy, direction, getEnemySpeed(input, enemy) * speedScale);
  if (hpRatio <= firstThreshold && input.time % 300 < 16) {
    input.emitEnemyBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, hpRatio <= secondThreshold ? 3 : 2);
  }
}

function updateOrbiterCage(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const startRadius = getParam(enemy.definition, 'startRadius', 340);
  const minRadius = getParam(enemy.definition, 'minRadius', 190);
  const tightenMs = getParam(enemy.definition, 'tightenMs', 7000);
  const orbitSpeed = getParam(enemy.definition, 'orbitSpeed', 0.9);
  const radialResponse = getParam(enemy.definition, 'radialResponse', 1.55);
  const elapsed = Math.max(0, input.time - enemy.stateStartedAt);
  const progress = Phaser.Math.Clamp(elapsed / Math.max(1, tightenMs), 0, 1);
  const desiredRadius = Phaser.Math.Linear(startRadius, minRadius, progress);
  const offsetFromPlayer = getWrappedDirection(input.arena, input.playerX, input.playerY, enemy.body.x, enemy.body.y);
  const distance = Math.max(1, offsetFromPlayer.length());
  const outward = offsetFromPlayer.clone().scale(1 / distance);
  const sideSign = getEnemyStateNumber(enemy, 'orbitSide') || (enemy.id.length % 2 === 0 ? 1 : -1);
  const tangent = new Phaser.Math.Vector2(-outward.y, outward.x).scale(sideSign);
  const radialError = distance - desiredRadius;
  const targetVelocity = tangent
    .scale(getEnemySpeed(input, enemy) * orbitSpeed)
    .add(outward.scale(-radialError * radialResponse));

  enemy.stateData.orbitSide = sideSign;
  enemy.state = progress >= 1 ? 'cage-tight' : 'cage';
  enemy.body.rotation = Math.atan2(-outward.x, outward.y);
  steerVelocity(input, enemy, targetVelocity.limit(getEnemySpeed(input, enemy) * 1.45));
  updateAura(input, enemy, desiredRadius, enemy.definition.visual.accentColor, 0.08);
}

function updatePatrolAlert(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const detectRange = getParam(enemy.definition, 'detectRange', 360);
  const loseRange = getParam(enemy.definition, 'loseRange', 620);
  const patrolRadius = getParam(enemy.definition, 'patrolRadius', 260);
  const waypointTolerance = getParam(enemy.definition, 'waypointTolerance', 34);
  const playerOffset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);

  if (!Number.isFinite(getEnemyStateNumber(enemy, 'homeX')) || getEnemyStateNumber(enemy, 'homeX') === 0 && getEnemyStateNumber(enemy, 'homeY') === 0) {
    enemy.stateData.homeX = enemy.body.x;
    enemy.stateData.homeY = enemy.body.y;
    enemy.stateData.patrolIndex = enemy.id.length % 4;
  }

  if (enemy.state !== 'alert' && playerOffset.length() <= detectRange) {
    enemy.state = 'alert';
    enemy.stateStartedAt = input.time;
    input.emitEnemyBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, 6);
  }

  if (enemy.state === 'alert') {
    if (playerOffset.length() > loseRange) {
      enemy.state = 'return';
      enemy.stateStartedAt = input.time;
    } else {
      updateChase(input, enemy, 1.16);
      return;
    }
  }

  const homeX = getEnemyStateNumber(enemy, 'homeX') || enemy.body.x;
  const homeY = getEnemyStateNumber(enemy, 'homeY') || enemy.body.y;
  const patrolIndex = Math.max(0, Math.trunc(getEnemyStateNumber(enemy, 'patrolIndex'))) % 4;
  const waypoints = [
    new Phaser.Math.Vector2(wrapCoordinate(homeX - patrolRadius, input.arena.width), homeY),
    new Phaser.Math.Vector2(homeX, wrapCoordinate(homeY - patrolRadius * 0.62, input.arena.height)),
    new Phaser.Math.Vector2(wrapCoordinate(homeX + patrolRadius, input.arena.width), homeY),
    new Phaser.Math.Vector2(homeX, wrapCoordinate(homeY + patrolRadius * 0.62, input.arena.height))
  ];
  const waypoint = waypoints[patrolIndex];
  const toWaypoint = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, waypoint.x, waypoint.y);
  enemy.state = enemy.state === 'return' ? 'return' : 'patrol';
  steerToward(input, enemy, toWaypoint, getEnemySpeed(input, enemy) * 0.74);
  if (toWaypoint.length() <= waypointTolerance) {
    enemy.stateData.patrolIndex = (patrolIndex + 1) % waypoints.length;
    enemy.state = 'patrol';
  }
  updatePatrolPath(input, enemy, waypoints);
}

function updateStatusShooter(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const distance = offset.length();
  const preferredRange = getParam(enemy.definition, 'preferredRange', 540);
  const retreatRange = getParam(enemy.definition, 'retreatRange', 280);
  const orbitSpeed = getParam(enemy.definition, 'orbitSpeed', 0.42);
  const target = new Phaser.Math.Vector2(0, 0);

  enemy.state = getParamString(enemy.definition, 'statusKind', 'frost') === 'electric' ? 'arc-range' : 'frost-range';
  if (distance <= 0) {
    return;
  }

  const direction = offset.clone().scale(1 / distance);
  const lateral = new Phaser.Math.Vector2(-direction.y, direction.x).scale(enemy.id.length % 2 === 0 ? 1 : -1);
  if (distance > preferredRange) {
    target.add(direction.scale(getEnemySpeed(input, enemy) * 0.88));
  } else if (distance < retreatRange) {
    target.add(direction.scale(-getEnemySpeed(input, enemy) * 0.95));
  }
  target.add(lateral.scale(getEnemySpeed(input, enemy) * orbitSpeed));
  enemy.body.rotation = Math.atan2(offset.x, -offset.y);
  steerVelocity(input, enemy, target);
  maybeFireAtPlayer(input, enemy, offset.clone().normalize(), createProjectileStatuses(enemy));
}

function updateSummonerShooter(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const distance = offset.length();
  const summonEveryMs = getParam(enemy.definition, 'summonEveryMs', 5200);
  const channelMs = getParam(enemy.definition, 'channelMs', 900);
  const summonCount = Math.max(1, Math.trunc(getParam(enemy.definition, 'summonCount', 3)));
  const summonId = getParamString(enemy.definition, 'summonId', 'scout');
  const preferredRange = getParam(enemy.definition, 'preferredRange', 620);
  const retreatRange = getParam(enemy.definition, 'retreatRange', 340);
  const elapsed = input.time - enemy.stateStartedAt;

  if (enemy.state !== 'channel' && input.time >= getEnemyStateNumber(enemy, 'nextSummonAt')) {
    enemy.state = 'channel';
    enemy.stateStartedAt = input.time;
    enemy.stateData.summonsReleased = 0;
    getRandomizedTelegraphDurationMs(enemy, 'summonChannelMs', channelMs);
    enemy.velocity.scale(0.35);
  }

  if (enemy.state === 'channel') {
    const randomizedChannelMs = getRandomizedTelegraphDurationMs(enemy, 'summonChannelMs', channelMs);
    enemy.velocity.scale(Math.pow(0.9, input.deltaSeconds * 60));
    updateAura(
      input,
      enemy,
      enemy.definition.visual.size * 1.15,
      enemy.definition.visual.accentColor,
      0.36,
      Math.min(1, elapsed / randomizedChannelMs)
    );
    if (elapsed >= randomizedChannelMs) {
      for (let index = 0; index < summonCount; index += 1) {
        const angle = (Math.PI * 2 * index) / summonCount + input.time * 0.0003;
        const spawnDistance = enemy.definition.visual.size * 0.72;
        input.spawnChild(summonId, enemy.body.x + Math.cos(angle) * spawnDistance, enemy.body.y + Math.sin(angle) * spawnDistance);
      }
      input.emitEnemyBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, 12);
      enemy.stateData.nextSummonAt = input.time + summonEveryMs;
      enemy.state = 'range';
      enemy.stateStartedAt = input.time;
      delete enemy.stateData.summonChannelMs;
      destroyTelegraphs(enemy);
    }
    return;
  }

  if (distance > 0) {
    const direction = offset.clone().scale(1 / distance);
    const desired = new Phaser.Math.Vector2(0, 0);
    if (distance > preferredRange) {
      desired.add(direction.clone().scale(getEnemySpeed(input, enemy) * 0.72));
    } else if (distance < retreatRange) {
      desired.add(direction.clone().scale(-getEnemySpeed(input, enemy)));
    }
    desired.add(new Phaser.Math.Vector2(-direction.y, direction.x).scale(getEnemySpeed(input, enemy) * 0.34));
    enemy.body.rotation = Math.atan2(direction.x, -direction.y);
    enemy.state = 'range';
    steerVelocity(input, enemy, desired);
    maybeFireAtPlayer(input, enemy, direction);
  }
}

function updateScrapThief(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const fleeDistance = getParam(enemy.definition, 'fleeDistance', 460);
  const pickupRange = getParam(enemy.definition, 'pickupRange', 48);
  const playerOffset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const nearestScrap = findNearestAvailableScrap(input, enemy);

  if (enemy.carriedScrap > 0) {
    enemy.state = 'escape';
    steerToward(input, enemy, playerOffset, -getEnemySpeed(input, enemy) * 1.12);
    return;
  }

  if (nearestScrap) {
    const scrapOffset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, nearestScrap.x, nearestScrap.y);
    enemy.state = 'steal';
    steerToward(input, enemy, scrapOffset, getEnemySpeed(input, enemy));
    if (scrapOffset.length() <= pickupRange) {
      const stolenValue = input.stealScrap?.(nearestScrap, enemy) ?? Math.max(1, nearestScrap.value ?? 1);
      nearestScrap.collected = true;
      enemy.carriedScrap += stolenValue;
      input.emitEnemyBurst(nearestScrap.x, nearestScrap.y, enemy.definition.visual.accentColor, 10);
    }
    return;
  }

  if (playerOffset.length() < fleeDistance) {
    enemy.state = 'bait';
    steerToward(input, enemy, playerOffset, -getEnemySpeed(input, enemy) * 0.78);
    return;
  }

  enemy.state = 'prowl';
  const lateral = playerOffset.lengthSq() > 0 ? new Phaser.Math.Vector2(-playerOffset.y, playerOffset.x).normalize() : new Phaser.Math.Vector2(1, 0);
  steerVelocity(input, enemy, lateral.scale(getEnemySpeed(input, enemy) * 0.45));
}

function updateChase(input: UpdateEnemyAiInput, enemy: EnemyInstance, speedScale: number): void {
  enemy.state = 'chase';
  const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  steerToward(input, enemy, direction, getEnemySpeed(input, enemy) * speedScale);
}

function updateChargeDash(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const aimMs = getParam(enemy.definition, 'aimMs', 220);
  const windupMs = getParam(enemy.definition, 'windupMs', 720);
  const dashMs = getParam(enemy.definition, 'dashMs', 560);
  const recoverMs = getParam(enemy.definition, 'recoverMs', 850);
  const dashSpeed = getParam(enemy.definition, 'dashSpeed', 520) * input.enemySpeedMultiplier * enemy.speedMultiplier;
  const triggerRange = getParam(enemy.definition, 'triggerRange', 760);
  const reacquireMs = getParam(enemy.definition, 'reacquireMs', 900);
  const elapsed = input.time - enemy.stateStartedAt;

  if (enemy.state === 'idle' || enemy.state === 'chase') {
    enemy.state = 'chase';
    const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
    steerToward(input, enemy, direction, getEnemySpeed(input, enemy) * 0.68);
    if (elapsed > reacquireMs && direction.length() < triggerRange) {
      enemy.state = 'aim';
      enemy.stateStartedAt = input.time;
      enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
      enemy.velocity.scale(0.35);
      enemy.stateData.chargeTelegraphStartedAt = input.time;
    }
  } else if (enemy.state === 'aim') {
    enemy.stateData.contactSuppressed = true;
    const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
    if (direction.lengthSq() > 0) {
      enemy.body.rotation = Math.atan2(direction.x, -direction.y);
    }
    enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
    enemy.velocity.scale(Math.pow(0.9, input.deltaSeconds * 60));
    updateChargeTelegraph(input, enemy, Math.min(0.38, (elapsed / Math.max(1, aimMs)) * 0.38));
    if (elapsed >= aimMs) {
      enemy.state = 'windup';
      enemy.stateStartedAt = input.time;
      enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
      enemy.stateData.chargeLockedTargetX = enemy.target.x;
      enemy.stateData.chargeLockedTargetY = enemy.target.y;
      enemy.stateData.chargeTelegraphLockedAt = input.time;
      getRandomizedTelegraphDurationMs(enemy, 'chargeWindupMs', windupMs);
    }
  } else if (enemy.state === 'windup') {
    const randomizedWindupMs = getRandomizedTelegraphDurationMs(enemy, 'chargeWindupMs', windupMs);
    enemy.stateData.contactSuppressed = true;
    const target = enemy.target ?? new Phaser.Math.Vector2(input.playerX, input.playerY);
    const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, target.x, target.y);
    if (direction.lengthSq() > 0) {
      enemy.body.rotation = Math.atan2(direction.x, -direction.y);
    }
    enemy.velocity.scale(Math.pow(0.88, input.deltaSeconds * 60));
    updateChargeTelegraph(input, enemy, 0.38 + Math.min(1, elapsed / randomizedWindupMs) * 0.62);
    if (elapsed >= randomizedWindupMs) {
      const dashOffset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, target.x, target.y);
      const dashDirection = dashOffset.lengthSq() > 0
        ? dashOffset.normalize()
        : new Phaser.Math.Vector2(Math.sin(enemy.body.rotation), -Math.cos(enemy.body.rotation)).normalize();
      const chargeLaneLength = Math.max(
        enemy.definition.stats.radius * 3,
        getEnemyStateNumber(enemy, 'chargeLaneLength') || enemy.definition.effectRecipe?.telegraph.length || 620
      );
      const chargeDashSpeed = chargeLaneLength / Math.max(0.001, dashMs / 1000);
      enemy.velocity.copy(dashDirection.clone().scale(chargeDashSpeed));
      enemy.state = 'charging';
      enemy.stateStartedAt = input.time;
      enemy.stateData.chargeDamageWindowStartedAt = input.time;
      enemy.stateData.chargeCommittedDirectionX = dashDirection.x;
      enemy.stateData.chargeCommittedDirectionY = dashDirection.y;
      enemy.stateData.chargeStartedX = enemy.body.x;
      enemy.stateData.chargeStartedY = enemy.body.y;
      enemy.stateData.chargeEndX = wrapCoordinate(enemy.body.x + dashDirection.x * chargeLaneLength, input.arena.width);
      enemy.stateData.chargeEndY = wrapCoordinate(enemy.body.y + dashDirection.y * chargeLaneLength, input.arena.height);
      enemy.stateData.chargeDashSpeed = chargeDashSpeed;
    }
  } else if (enemy.state === 'charging') {
    const chargeEndX = getEnemyStateOptionalNumber(enemy, 'chargeEndX');
    const chargeEndY = getEnemyStateOptionalNumber(enemy, 'chargeEndY');
    const chargeDashSpeed = getEnemyStateNumber(enemy, 'chargeDashSpeed') || dashSpeed;

    if (chargeEndX !== undefined && chargeEndY !== undefined) {
      const remaining = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, chargeEndX, chargeEndY);
      const remainingDistance = remaining.length();
      const nextStepDistance = chargeDashSpeed * input.deltaSeconds;

      if (remainingDistance <= nextStepDistance || elapsed >= dashMs) {
        enemy.body.setPosition(chargeEndX, chargeEndY);
        enemy.wrapMirrorBody.setPosition(chargeEndX, chargeEndY);
        enemy.velocity.set(0, 0);
        enemy.state = 'recover';
        enemy.stateStartedAt = input.time;
        destroyTelegraphs(enemy);
        updateChargeRecoveryTelegraph(input, enemy, 0);
        return;
      }

      const chargeDirection = remaining.scale(1 / Math.max(0.001, remainingDistance));
      enemy.velocity.copy(chargeDirection.scale(chargeDashSpeed));
    } else {
      enemy.velocity.scale(Math.pow(0.992, input.deltaSeconds * 60));
    }

    if (enemy.velocity.lengthSq() > 0) {
      enemy.body.rotation = Math.atan2(enemy.velocity.x, -enemy.velocity.y);
    }
    if (elapsed >= dashMs) {
      enemy.state = 'recover';
      enemy.stateStartedAt = input.time;
      destroyTelegraphs(enemy);
      updateChargeRecoveryTelegraph(input, enemy, 0);
    }
  } else if (enemy.state === 'recover') {
    enemy.stateData.contactSuppressed = true;
    enemy.velocity.scale(Math.pow(0.86, input.deltaSeconds * 60));
    updateChargeRecoveryTelegraph(input, enemy, Math.min(1, elapsed / recoverMs));
    if (elapsed >= recoverMs) {
      enemy.state = 'chase';
      enemy.stateStartedAt = input.time;
      delete enemy.stateData.chargeWindupMs;
      destroyTelegraphs(enemy);
    }
  }
}

function updateRangeOrbitShooter(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const distance = offset.length();
  const preferredRange = getParam(enemy.definition, 'preferredRange', 560);
  const retreatRange = getParam(enemy.definition, 'retreatRange', 340);
  const orbitSpeed = getParam(enemy.definition, 'orbitSpeed', 0.56);
  const target = new Phaser.Math.Vector2(0, 0);

  enemy.state = 'range';
  if (distance > 0) {
    const direction = offset.clone().scale(1 / distance);
    const lateral = new Phaser.Math.Vector2(-direction.y, direction.x).scale(Math.sin(input.time * 0.001 + enemy.id.length) > 0 ? 1 : -1);
    enemy.body.rotation = Math.atan2(direction.x, -direction.y);

    if (distance > preferredRange) {
      target.add(direction.scale(getEnemySpeed(input, enemy)));
    } else if (distance < retreatRange) {
      target.add(direction.scale(-getEnemySpeed(input, enemy) * 0.82));
    }

    target.add(lateral.scale(getEnemySpeed(input, enemy) * orbitSpeed));
    steerVelocity(input, enemy, target);
    maybeFireAtPlayer(input, enemy, direction);
  }
}

function updateProximityDetonate(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const triggerRange = getParam(enemy.definition, 'triggerRange', 120);
  const blastRadius = getParam(enemy.definition, 'blastRadius', 170);
  const countdownMs = getParam(enemy.definition, 'countdownMs', 1500);
  const blastDamage = getParam(enemy.definition, 'blastDamage', 35);
  const resetCountdownOnExit = getParamBoolean(enemy.definition, 'resetCountdownOnExit', false);
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const distance = offset.length();

  if (enemy.state === 'detonating' && resetCountdownOnExit && distance > triggerRange) {
    enemy.state = 'approach';
    enemy.stateStartedAt = input.time;
    delete enemy.stateData.detonateCountdownMs;
    destroyTelegraphs(enemy);
  }

  if (enemy.state !== 'detonating' && distance <= triggerRange) {
    enemy.state = 'detonating';
    enemy.stateStartedAt = input.time;
    getRandomizedTelegraphDurationMs(enemy, 'detonateCountdownMs', countdownMs);
    enemy.velocity.scale(0.2);
  }

  if (enemy.state === 'detonating') {
    const randomizedCountdownMs = getRandomizedTelegraphDurationMs(enemy, 'detonateCountdownMs', countdownMs);
    if (randomizedCountdownMs <= 0) {
      input.explodeAt(enemy.body.x, enemy.body.y, blastRadius, blastDamage, enemy.id);
      enemy.stateData.lastDamageSource = 'enemy';
      enemy.stateData.selfDetonated = true;
      enemy.hp = 0;
      return;
    }

    const progress = Math.min(1, (input.time - enemy.stateStartedAt) / randomizedCountdownMs);
    enemy.velocity.scale(Math.pow(0.9, input.deltaSeconds * 60));
    updateBlastTelegraph(input, enemy, blastRadius, progress);
    if (progress >= 1) {
      input.explodeAt(enemy.body.x, enemy.body.y, blastRadius, blastDamage, enemy.id);
      enemy.stateData.lastDamageSource = 'enemy';
      enemy.stateData.selfDetonated = true;
      enemy.hp = 0;
    }
  } else {
    enemy.state = 'approach';
    steerToward(input, enemy, offset, getEnemySpeed(input, enemy));
  }
}

function updateSniper(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const distance = offset.length();
  const preferredRange = getParam(enemy.definition, 'preferredRange', 860);
  const aimMs = getParam(enemy.definition, 'aimMs', 1100);
  const lockMs = getParam(enemy.definition, 'lockMs', 380);
  const cooldownMs = getParam(enemy.definition, 'cooldownMs', 1800);
  const elapsed = input.time - enemy.stateStartedAt;

  if (enemy.state === 'idle' || enemy.state === 'cooldown') {
    enemy.state = input.time >= enemy.nextFireAt ? 'aiming' : 'cooldown';
    if (enemy.state === 'aiming') {
      enemy.stateStartedAt = input.time;
      getRandomizedTelegraphDurationMs(enemy, 'sniperAimMs', aimMs);
    }
  }

  if (enemy.state === 'aiming') {
    const randomizedAimMs = getRandomizedTelegraphDurationMs(enemy, 'sniperAimMs', aimMs);
    if (distance > 0) {
      const direction = offset.clone().scale(1 / distance);
      enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
      updateSniperBeam(input, enemy, direction, Math.min(1, elapsed / randomizedAimMs), false);
    }
    enemy.velocity.scale(Math.pow(0.94, input.deltaSeconds * 60));
    if (elapsed >= randomizedAimMs) {
      enemy.state = 'locked';
      enemy.stateStartedAt = input.time;
      enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
    }
  } else if (enemy.state === 'locked') {
    const target = enemy.target ?? new Phaser.Math.Vector2(input.playerX, input.playerY);
    const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, target.x, target.y).normalize();
    updateSniperBeam(input, enemy, direction, 1, true);
    enemy.velocity.scale(Math.pow(0.94, input.deltaSeconds * 60));
    if (elapsed >= lockMs) {
      fireEnemyShot(input, enemy, direction, 0xff5964, 9);
      input.emitEnemyBurst(target.x, target.y, 0xe96dff, 8);
      enemy.state = 'cooldown';
      enemy.stateStartedAt = input.time;
      enemy.nextFireAt = input.time + cooldownMs;
      delete enemy.stateData.sniperAimMs;
      destroyTelegraphs(enemy);
    }
  } else {
    const direction = distance > 0 ? offset.clone().scale(1 / distance) : new Phaser.Math.Vector2(0, 0);
    const desired = distance < preferredRange * 0.72
      ? direction.scale(-getEnemySpeed(input, enemy) * 0.55)
      : new Phaser.Math.Vector2(0, 0);
    steerVelocity(input, enemy, desired);
    destroyTelegraphs(enemy);
  }
}

function updateCarrierSpawner(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const spawnEveryMs = getParam(enemy.definition, 'spawnEveryMs', 3400);
  const maxChildren = getParam(enemy.definition, 'maxChildren', 8);
  const spawnId = String(enemy.definition.behavior.params?.spawnId ?? 'scout');
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  enemy.state = 'foundry';
  steerToward(input, enemy, offset, getEnemySpeed(input, enemy) * 0.45);

  if (input.time >= enemy.nextFireAt && enemy.childrenSpawned < maxChildren) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = enemy.definition.visual.size * 0.75;
    input.spawnChild(spawnId, enemy.body.x + Math.cos(angle) * distance, enemy.body.y + Math.sin(angle) * distance);
    input.emitEnemyBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, 8);
    enemy.childrenSpawned += 1;
    enemy.nextFireAt = input.time + spawnEveryMs;
  }
}

function updateSupportShip(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const ally = findNearestAlly(input, enemy, true);
  enemy.state = enemy.definition.behavior.id === 'repairSupport' ? 'repair' : 'support';

  if (enemy.definition.behavior.id === 'repairSupport' && ally) {
    const healRange = getParam(enemy.definition, 'healRange', 260);
    const healPerSecond = getParam(enemy.definition, 'healPerSecond', 13);
    const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, ally.body.x, ally.body.y);
    if (offset.length() > healRange * 0.7) {
      steerToward(input, enemy, offset, getEnemySpeed(input, enemy) * 0.82);
    } else {
      steerVelocity(input, enemy, new Phaser.Math.Vector2(0, 0));
      ally.hp = Math.min(ally.maxHp, ally.hp + healPerSecond * input.deltaSeconds);
      updateBeam(input, enemy, ally.body.x, ally.body.y, 0x66bb6a, 0.38);
    }
  } else {
    const offset = ally
      ? getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, ally.body.x, ally.body.y)
      : getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
    const desiredSpeed = ally && offset.length() < 180 ? getEnemySpeed(input, enemy) * -0.24 : getEnemySpeed(input, enemy) * 0.55;
    steerToward(input, enemy, offset, desiredSpeed);
  }
}

function updateScrapScavenger(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const fleeDistance = getParam(enemy.definition, 'fleeDistance', 360);
  const pickupRange = getParam(enemy.definition, 'pickupRange', 40);
  const playerOffset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const nearestScrap = input.scrapPickups
    .filter((scrap) => !scrap.collected)
    .sort((a, b) =>
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, a.x, a.y).lengthSq() -
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, b.x, b.y).lengthSq()
    )[0];

  if (enemy.carriedScrap > 0 || playerOffset.length() < fleeDistance) {
    enemy.state = 'flee';
    steerToward(input, enemy, playerOffset, -getEnemySpeed(input, enemy));
    return;
  }

  if (nearestScrap) {
    enemy.state = 'scavenge';
    const scrapOffset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, nearestScrap.x, nearestScrap.y);
    steerToward(input, enemy, scrapOffset, getEnemySpeed(input, enemy));
    if (scrapOffset.length() <= pickupRange) {
      const stolenValue = input.stealScrap?.(nearestScrap, enemy) ?? Math.max(1, nearestScrap.value ?? 1);
      nearestScrap.collected = true;
      enemy.carriedScrap += stolenValue;
      input.emitEnemyBurst(nearestScrap.x, nearestScrap.y, enemy.definition.visual.accentColor, 8);
    }
  } else {
    enemy.state = 'skulk';
    const lateral = playerOffset.lengthSq() > 0 ? new Phaser.Math.Vector2(-playerOffset.y, playerOffset.x).normalize() : new Phaser.Math.Vector2(1, 0);
    steerVelocity(input, enemy, lateral.scale(getEnemySpeed(input, enemy) * 0.45));
  }
}

function updateFlanker(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  const distance = offset.length();
  const flankDistance = getParam(enemy.definition, 'flankDistance', 300);
  const attackRange = getParam(enemy.definition, 'attackRange', 170);

  if (distance > 0) {
    const toPlayer = offset.clone().scale(1 / distance);
    const playerForward = input.playerVelocity.lengthSq() > 16
      ? input.playerVelocity.clone().normalize()
      : new Phaser.Math.Vector2(0, -1);
    const sideSign = enemy.id.length % 2 === 0 ? 1 : -1;
    const side = new Phaser.Math.Vector2(-playerForward.y, playerForward.x).scale(sideSign);
    const desiredOffset = playerForward.clone().scale(-flankDistance * 0.45).add(side.scale(flankDistance));
    const targetX = wrapCoordinate(input.playerX + desiredOffset.x, input.arena.width);
    const targetY = wrapCoordinate(input.playerY + desiredOffset.y, input.arena.height);
    const flankOffset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, targetX, targetY);

    enemy.state = distance <= attackRange ? 'attack' : 'flank';
    steerToward(input, enemy, enemy.state === 'attack' ? offset : flankOffset, getEnemySpeed(input, enemy));
    enemy.body.rotation = Math.atan2(toPlayer.x, -toPlayer.y);
  }
}

function updateReflector(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const shieldMs = getParam(enemy.definition, 'shieldMs', 1200);
  const cooldownMs = getParam(enemy.definition, 'cooldownMs', 2800);
  const elapsed = input.time - enemy.stateStartedAt;
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);

  if (enemy.state !== 'shield' && input.time >= enemy.nextFireAt) {
    enemy.state = 'shield';
    enemy.stateStartedAt = input.time;
    enemy.stateData.reflecting = true;
    getRandomizedTelegraphDurationMs(enemy, 'reflectorShieldMs', shieldMs);
  }

  if (enemy.state === 'shield') {
    const randomizedShieldMs = getRandomizedTelegraphDurationMs(enemy, 'reflectorShieldMs', shieldMs);
    enemy.stateData.reflecting = true;
    updateShieldArc(input, enemy, Math.min(1, elapsed / randomizedShieldMs));
    if (elapsed >= randomizedShieldMs) {
      enemy.state = 'chase';
      enemy.stateStartedAt = input.time;
      enemy.stateData.reflecting = false;
      enemy.nextFireAt = input.time + cooldownMs;
      delete enemy.stateData.reflectorShieldMs;
      destroyTelegraphs(enemy);
    }
  } else {
    enemy.stateData.reflecting = false;
    updateChase(input, enemy, 0.7);
  }

  if (offset.lengthSq() > 0) {
    enemy.body.rotation = Math.atan2(offset.x, -offset.y);
  }
}

function updatePhaseTeleport(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  const teleportEveryMs = getParam(enemy.definition, 'teleportEveryMs', 3200);
  const minRange = getParam(enemy.definition, 'minRange', 260);
  const maxRange = getParam(enemy.definition, 'maxRange', 520);

  if (input.time >= enemy.nextFireAt) {
    const oldX = enemy.body.x;
    const oldY = enemy.body.y;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.FloatBetween(minRange, maxRange);
    enemy.body.setPosition(
      wrapCoordinate(input.playerX + Math.cos(angle) * distance, input.arena.width),
      wrapCoordinate(input.playerY + Math.sin(angle) * distance, input.arena.height)
    );
    enemy.velocity.set(0, 0);
    input.emitEnemyBurst(oldX, oldY, enemy.definition.visual.glowColor, 10);
    input.emitEnemyBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, 10);
    updatePhaseRing(input, enemy);
    enemy.nextFireAt = input.time + teleportEveryMs;
  }

  updateChase(input, enemy, 0.8);
}

function maybeFireAtPlayer(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  direction: Phaser.Math.Vector2,
  statuses?: EnemyStatusEffect[]
): void {
  if (!enemy.definition.weapon || direction.lengthSq() <= 0) {
    return;
  }

  const telegraphStartedAt = getEnemyStateOptionalNumber(enemy, 'shotTelegraphStartedAt');
  if (telegraphStartedAt === undefined && input.time < enemy.nextFireAt) {
    return;
  }

  if (telegraphStartedAt === undefined) {
    const normalized = direction.clone().normalize();
    enemy.stateData.shotTelegraphStartedAt = input.time;
    enemy.stateData.shotTelegraphDirectionX = normalized.x;
    enemy.stateData.shotTelegraphDirectionY = normalized.y;
    getRandomizedTelegraphDurationMs(
      enemy,
      'shotTelegraphMs',
      getParam(enemy.definition, 'shotTelegraphMs', enemy.definition.effectRecipe?.telegraph.durationMs ?? ENEMY_PROJECTILE_TELEGRAPH_MS)
    );
    updateProjectileShotTelegraph(input, enemy, normalized, 0);
    return;
  }

  const telegraphMs = getRandomizedTelegraphDurationMs(
    enemy,
    'shotTelegraphMs',
    getParam(enemy.definition, 'shotTelegraphMs', enemy.definition.effectRecipe?.telegraph.durationMs ?? ENEMY_PROJECTILE_TELEGRAPH_MS)
  );
  const progress = Math.min(1, (input.time - telegraphStartedAt) / telegraphMs);
  const committedDirection = new Phaser.Math.Vector2(
    getEnemyStateNumber(enemy, 'shotTelegraphDirectionX'),
    getEnemyStateNumber(enemy, 'shotTelegraphDirectionY')
  );
  const shotDirection = committedDirection.lengthSq() > 0 ? committedDirection.normalize() : direction.clone().normalize();
  updateProjectileShotTelegraph(input, enemy, shotDirection, progress);

  if (progress < 1) {
    return;
  }

  fireEnemyShot(input, enemy, shotDirection, enemy.definition.visual.accentColor, PROJECTILE_RADIUS, statuses);
  enemy.nextFireAt = input.time + enemy.definition.weapon.cooldownMs * input.enemyFireRateMultiplier * enemy.fireRateMultiplier;
  clearProjectileShotTelegraph(enemy);
}

function fireEnemyShot(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  direction: Phaser.Math.Vector2,
  color: number,
  radius: number,
  statuses?: EnemyStatusEffect[]
): void {
  const weapon = enemy.definition.weapon;
  if (!weapon || direction.lengthSq() <= 0) {
    return;
  }

  const normalized = direction.clone().normalize();
  const spawnDistance = enemy.definition.stats.radius + 12;
  input.fireEnemyProjectile({
    x: enemy.body.x + normalized.x * spawnDistance,
    y: enemy.body.y + normalized.y * spawnDistance,
    direction: normalized,
    speed: weapon.projectileSpeed,
    damage: weapon.damage * enemy.damageMultiplier,
    range: weapon.range ?? 1000,
    radius,
    color,
    statuses
  });
}

function updateProjectileShotTelegraph(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  direction: Phaser.Math.Vector2,
  progress: number
): void {
  const weaponRange = enemy.definition.weapon?.range ?? 1000;
  updateBeam(
    input,
    enemy,
    enemy.body.x + direction.x * weaponRange,
    enemy.body.y + direction.y * weaponRange,
    ENEMY_TELEGRAPH_WARNING_COLOR,
    ENEMY_TELEGRAPH_WARNING_ALPHA,
    progress
  );
}

function clearProjectileShotTelegraph(enemy: EnemyInstance): void {
  delete enemy.stateData.shotTelegraphStartedAt;
  delete enemy.stateData.shotTelegraphMs;
  delete enemy.stateData.shotTelegraphDirectionX;
  delete enemy.stateData.shotTelegraphDirectionY;
  enemy.telegraphs.beamLine?.destroy();
  enemy.telegraphs.beamLine = undefined;
}

function moveEnemy(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  moveBodyWithVelocityChannels({
    arena: input.arena,
    body: enemy.body,
    channels: enemy,
    deltaSeconds: input.deltaSeconds
  });
  dampVelocityChannel(enemy.knockbackVelocity, 0.88, input.deltaSeconds);
  dampVelocityChannel(enemy.blackHoleVelocity, 0.988, input.deltaSeconds);
  input.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, enemy.definition.visual.size);
  updateEnemyDebugLabel(enemy);
}

function steerToward(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  direction: Phaser.Math.Vector2,
  speed: number
): void {
  const targetVelocity = new Phaser.Math.Vector2(0, 0);

  if (direction.lengthSq() > 0) {
    const normalized = direction.clone().normalize();
    targetVelocity.set(normalized.x * speed, normalized.y * speed);
    enemy.body.rotation = Math.atan2(normalized.x, -normalized.y);
  }

  steerVelocity(input, enemy, targetVelocity);
}

function steerVelocity(input: UpdateEnemyAiInput, enemy: EnemyInstance, targetVelocity: Phaser.Math.Vector2): void {
  const acceleration = enemy.definition.stats.acceleration ?? DEFAULT_ENEMY_RESPONSE;
  const blend = 1 - Math.exp(-acceleration * input.deltaSeconds);
  enemy.velocity.x = Phaser.Math.Linear(enemy.velocity.x, targetVelocity.x, blend);
  enemy.velocity.y = Phaser.Math.Linear(enemy.velocity.y, targetVelocity.y, blend);
}

function getEnemySpeed(input: UpdateEnemyAiInput, enemy: EnemyInstance): number {
  return enemy.definition.stats.speed * input.enemySpeedMultiplier * enemy.speedMultiplier;
}

function getParam(definition: EnemyDefinition, key: string, fallback: number): number {
  const raw = definition.behavior.params?.[key];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}

function getParamBoolean(definition: EnemyDefinition, key: string, fallback: boolean): boolean {
  const raw = definition.behavior.params?.[key];
  return typeof raw === 'boolean' ? raw : fallback;
}

function getParamString(definition: EnemyDefinition, key: string, fallback: string): string {
  const raw = definition.behavior.params?.[key];
  return typeof raw === 'string' && raw.length > 0 ? raw : fallback;
}

function createProjectileStatuses(enemy: EnemyInstance): EnemyStatusEffect[] | undefined {
  const statusKind = getParamString(enemy.definition, 'statusKind', '');
  if (statusKind !== 'frost' && statusKind !== 'electric') {
    return undefined;
  }

  const status: EnemyStatusEffect = {
    kind: statusKind,
    durationMs: getParam(enemy.definition, 'statusDurationMs', statusKind === 'frost' ? 2100 : 3000),
    intensity: getParam(enemy.definition, 'statusIntensity', 1)
  };

  if (statusKind === 'electric') {
    status.damagePerSecond = getParam(enemy.definition, 'statusDamagePerSecond', 5);
    status.tickMs = getParam(enemy.definition, 'statusTickMs', 500);
    status.accelerationDrag = getParam(enemy.definition, 'statusAccelerationDrag', 0.18);
  }

  return [status];
}

function findNearestAvailableScrap(input: UpdateEnemyAiInput, enemy: EnemyInstance): EnemyScrapTarget | undefined {
  return input.scrapPickups
    .filter((scrap) => !scrap.collected)
    .sort((a, b) =>
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, a.x, a.y).lengthSq() -
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, b.x, b.y).lengthSq()
    )[0];
}

function findNearestAlly(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  preferDamaged: boolean
): EnemyInstance | undefined {
  const allies = input.enemies.filter((candidate) => candidate.id !== enemy.id && candidate.hp > 0);
  const damaged = allies.filter((candidate) => candidate.hp < candidate.maxHp);
  const candidates = preferDamaged && damaged.length > 0 ? damaged : allies;

  return candidates.sort(
    (a, b) =>
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, a.body.x, a.body.y).lengthSq() -
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, b.body.x, b.body.y).lengthSq()
  )[0];
}

function updatePatrolPath(input: UpdateEnemyAiInput, enemy: EnemyInstance, waypoints: Phaser.Math.Vector2[]): void {
  if (!input.telegraphsEnabled) {
    enemy.telegraphs.patrolPath?.destroy();
    enemy.telegraphs.patrolPath = undefined;
    return;
  }

  const line = enemy.telegraphs.patrolPath ?? input.scene.add.graphics().setDepth(4);
  enemy.telegraphs.patrolPath = line;
  line.clear();
  line.lineStyle(1, ENEMY_TELEGRAPH_WARNING_COLOR, ENEMY_TELEGRAPH_WARNING_ALPHA);
  for (let index = 0; index < waypoints.length; index += 1) {
    const from = waypoints[index];
    const to = waypoints[(index + 1) % waypoints.length];
    line.lineBetween(from.x, from.y, to.x, to.y);
  }
}

function updateEnemyVisualPulse(enemy: EnemyInstance, time: number): void {
  const core = enemy.body.getData('visualCore') as Phaser.GameObjects.Ellipse | undefined;
  const glow = enemy.body.getData('visualGlow') as Phaser.GameObjects.Ellipse | undefined;
  const pulse = 0.78 + Math.sin(time * 0.006 + enemy.id.length) * 0.18;

  core?.setScale(pulse);
  glow?.setAlpha(0.14 + pulse * 0.08);

  const mirrorCore = enemy.wrapMirrorBody.getData('visualCore') as Phaser.GameObjects.Ellipse | undefined;
  const mirrorGlow = enemy.wrapMirrorBody.getData('visualGlow') as Phaser.GameObjects.Ellipse | undefined;
  mirrorCore?.setScale(pulse);
  mirrorGlow?.setAlpha(0.14 + pulse * 0.08);
}

function updateChargeTelegraph(input: UpdateEnemyAiInput, enemy: EnemyInstance, progress: number): void {
  if (!input.telegraphsEnabled || !enemy.target) {
    destroyTelegraphs(enemy);
    return;
  }

  const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, enemy.target.x, enemy.target.y);
  const distance = Math.max(enemy.definition.stats.radius * 3, direction.length());
  const rotation = Math.atan2(direction.y, direction.x);
  const recipeLength = enemy.definition.effectRecipe?.telegraph.length ?? 620;
  const laneLength = Math.max(distance + enemy.definition.stats.radius * 5, recipeLength);
  const laneWidth = enemy.definition.stats.radius * (1.25 + progress * 0.7);
  const alpha = getEnemyTelegraphWarningAlpha(progress);

  const lane = enemy.telegraphs.chargeLane ?? createEffectLaneImage({
    scene: input.scene,
    x: enemy.body.x,
    y: enemy.body.y,
    length: laneLength,
    width: laneWidth,
    color: ENEMY_TELEGRAPH_WARNING_COLOR,
    alpha,
    depth: 6,
    rotation
  });
  enemy.telegraphs.chargeLane = lane;
  lane.setPosition(enemy.body.x, enemy.body.y);
  lane.setRotation(rotation);
  lane.setTint(ENEMY_TELEGRAPH_WARNING_COLOR);
  lane.setAlpha(alpha);
  setEffectLaneSize(lane, laneLength, laneWidth);
  enemy.stateData.chargeLaneLength = laneLength;
  enemy.stateData.chargeLaneWidth = laneWidth;
}

function updateChargeRecoveryTelegraph(input: UpdateEnemyAiInput, enemy: EnemyInstance, progress: number): void {
  if (!input.telegraphsEnabled) {
    destroyTelegraphs(enemy);
    return;
  }

  const radius = enemy.definition.stats.radius * (1.15 + progress * 0.55);
  const alpha = getEnemyTelegraphWarningAlpha(0);
  const ring = enemy.telegraphs.warningCircle ?? createEffectRingImage({
    scene: input.scene,
    x: enemy.body.x,
    y: enemy.body.y,
    radius,
    color: ENEMY_TELEGRAPH_WARNING_COLOR,
    alpha,
    depth: 6
  });
  enemy.telegraphs.warningCircle = ring;
  ring.setPosition(enemy.body.x, enemy.body.y);
  ring.setTint(ENEMY_TELEGRAPH_WARNING_COLOR);
  ring.setAlpha(alpha);
  setEffectRingRadius(ring, radius);
}

function updateBlastTelegraph(input: UpdateEnemyAiInput, enemy: EnemyInstance, radius: number, progress: number): void {
  if (!input.telegraphsEnabled) {
    destroyTelegraphs(enemy);
    return;
  }

  const alpha = getEnemyTelegraphWarningAlpha(progress);
  const circle = enemy.telegraphs.warningCircle ?? createEffectRingImage({
    scene: input.scene,
    x: enemy.body.x,
    y: enemy.body.y,
    radius,
    color: ENEMY_TELEGRAPH_WARNING_COLOR,
    alpha,
    depth: 5
  });
  enemy.telegraphs.warningCircle = circle;
  circle.setPosition(enemy.body.x, enemy.body.y);
  circle.setTint(ENEMY_TELEGRAPH_WARNING_COLOR);
  circle.setAlpha(alpha);
  setEffectRingRadius(circle, radius * (0.88 + progress * 0.12));
}

function updateSniperBeam(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  direction: Phaser.Math.Vector2,
  progress: number,
  locked: boolean
): void {
  if (!input.telegraphsEnabled) {
    destroyTelegraphs(enemy);
    return;
  }

  const alpha = getEnemyTelegraphWarningAlpha(locked ? 1 : progress);
  const beam = enemy.telegraphs.beamLine ?? input.scene.add.line(0, 0, 0, 0, 0, 0, ENEMY_TELEGRAPH_WARNING_COLOR, alpha).setOrigin(0, 0).setDepth(6);
  enemy.telegraphs.beamLine = beam;
  const range = enemy.definition.weapon?.range ?? 1400;
  beam.setTo(enemy.body.x, enemy.body.y, enemy.body.x + direction.x * range, enemy.body.y + direction.y * range);
  beam.setStrokeStyle(locked ? 3 : 1.5 + progress, ENEMY_TELEGRAPH_WARNING_COLOR, alpha);
  beam.setAlpha(alpha);
}

function updateAura(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  radius: number,
  _color: number,
  _alpha: number,
  progress = 0
): void {
  if (!input.telegraphsEnabled) {
    enemy.telegraphs.auraCircle?.destroy();
    enemy.telegraphs.auraCircle = undefined;
    return;
  }

  const alpha = getEnemyTelegraphWarningAlpha(progress);
  const aura = enemy.telegraphs.auraCircle ?? createEffectRingImage({
    scene: input.scene,
    x: enemy.body.x,
    y: enemy.body.y,
    radius,
    color: ENEMY_TELEGRAPH_WARNING_COLOR,
    alpha,
    depth: 4
  });
  enemy.telegraphs.auraCircle = aura;
  aura.setPosition(enemy.body.x, enemy.body.y);
  aura.setTint(ENEMY_TELEGRAPH_WARNING_COLOR);
  aura.setAlpha(alpha);
  setEffectRingRadius(aura, radius);
}

function updateBeam(
  input: UpdateEnemyAiInput,
  enemy: EnemyInstance,
  targetX: number,
  targetY: number,
  _color: number,
  _alpha: number,
  progress = 0
): void {
  if (!input.telegraphsEnabled) {
    enemy.telegraphs.beamLine?.destroy();
    enemy.telegraphs.beamLine = undefined;
    return;
  }

  const alpha = getEnemyTelegraphWarningAlpha(progress);
  const beam = enemy.telegraphs.beamLine ?? input.scene.add.line(0, 0, 0, 0, 0, 0, ENEMY_TELEGRAPH_WARNING_COLOR, alpha).setOrigin(0, 0).setDepth(6);
  enemy.telegraphs.beamLine = beam;
  beam.setTo(enemy.body.x, enemy.body.y, targetX, targetY);
  beam.setStrokeStyle(1.5 + progress, ENEMY_TELEGRAPH_WARNING_COLOR, alpha);
  beam.setAlpha(alpha);
}

function updateShieldArc(input: UpdateEnemyAiInput, enemy: EnemyInstance, progress = 0): void {
  if (!input.telegraphsEnabled) {
    enemy.telegraphs.shieldArc?.destroy();
    enemy.telegraphs.shieldArc = undefined;
    return;
  }

  const radius = enemy.definition.visual.size * 0.72;
  const alpha = getEnemyTelegraphWarningAlpha(progress);
  const arc = enemy.telegraphs.shieldArc ?? createEffectRingImage({
    scene: input.scene,
    x: enemy.body.x,
    y: enemy.body.y,
    radius,
    color: ENEMY_TELEGRAPH_WARNING_COLOR,
    alpha,
    depth: 7
  });
  enemy.telegraphs.shieldArc = arc;
  arc.setPosition(enemy.body.x, enemy.body.y);
  arc.setTint(ENEMY_TELEGRAPH_WARNING_COLOR);
  arc.setAlpha(alpha);
  setEffectRingRadius(arc, radius);
}

function updatePhaseRing(input: UpdateEnemyAiInput, enemy: EnemyInstance): void {
  if (!input.telegraphsEnabled) {
    return;
  }

  const ring = createEffectRingImage({
    scene: input.scene,
    x: enemy.body.x,
    y: enemy.body.y,
    radius: enemy.definition.visual.size * 0.45,
    color: ENEMY_TELEGRAPH_WARNING_COLOR,
    alpha: ENEMY_TELEGRAPH_WARNING_ALPHA,
    depth: 6
  });
  input.scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 2.4,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy()
  });
}
