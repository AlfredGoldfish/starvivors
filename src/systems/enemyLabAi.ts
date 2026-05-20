import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import type { EnemyLabDefinition } from '../data/enemyLabDefinitions';
import type { EnemyLabInstance } from './enemyLabSpawner';
import { destroyTelegraphs, updateEnemyLabDebugLabel } from './enemyLabSpawner';
import { dampVelocityChannel, moveBodyWithVelocityChannels } from './physics';
import { ENEMY_CONTACT_RECOIL_SPEED } from '../scenes/gameConstants';

export interface EnemyLabProjectileRequest {
  x: number;
  y: number;
  direction: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  range: number;
  radius: number;
  color: number;
}

export interface EnemyLabScrapTarget {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface UpdateEnemyLabAiInput {
  scene: Phaser.Scene;
  arena: ArenaSize;
  enemies: EnemyLabInstance[];
  scrapPickups: EnemyLabScrapTarget[];
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
  applyWorldForcesToEnemy?: (enemy: EnemyLabInstance, index: number, deltaSeconds: number, time: number) => boolean;
  fireEnemyProjectile: (request: EnemyLabProjectileRequest) => void;
  explodeAt: (x: number, y: number, radius: number, damage: number, sourceId: string) => void;
  spawnChild: (definitionId: string, x: number, y: number) => void;
  emitLabBurst: (x: number, y: number, color: number, count?: number) => void;
}

const DEFAULT_ENEMY_RESPONSE = 4.2;
const PROJECTILE_RADIUS = 8;
const DECONFLICTION_BUFFER_PX = 14;
const DECONFLICTION_MAX_NUDGE_SPEED = 95;
const DECONFLICTION_POSITION_CORRECTION = 0.45;
const MIN_DECONFLICTION_DISTANCE = 0.001;

export function updateEnemyLabAi(input: UpdateEnemyLabAiInput): void {
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
      updateEnemyLabDebugLabel(enemy);
      continue;
    }

    switch (enemy.definition.behavior.id) {
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
    updateEnemyLabDebugLabel(enemy);
  }

  applyEnemyDeconfliction(input);

  for (let index = input.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = input.enemies[index];
    if (input.applyWorldForcesToEnemy?.(enemy, index, input.deltaSeconds, input.time)) {
      continue;
    }

    moveEnemy(input, enemy);
    updateEnemyVisualPulse(enemy, input.time);
    updateEnemyLabDebugLabel(enemy);
  }
}

function updateContactRecoil(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): boolean {
  const recoilUntil = getEnemyStateNumber(enemy, 'contactRecoilUntil');

  if (input.time >= recoilUntil) {
    return false;
  }

  const normalX = getEnemyStateNumber(enemy, 'contactRecoilNormalX');
  const normalY = getEnemyStateNumber(enemy, 'contactRecoilNormalY');
  const direction = new Phaser.Math.Vector2(-normalX, -normalY);

  if (direction.lengthSq() <= 0.0001) {
    direction.copy(getWrappedDirection(input.arena, input.playerX, input.playerY, enemy.body.x, enemy.body.y));
  }

  enemy.state = 'contact-recoil';
  steerToward(input, enemy, direction, ENEMY_CONTACT_RECOIL_SPEED * input.enemySpeedMultiplier);
  return true;
}

function getEnemyStateNumber(enemy: EnemyLabInstance, key: string): number {
  const value = enemy.stateData[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
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

function resetTemporaryBuffs(enemies: EnemyLabInstance[], time: number): void {
  for (const enemy of enemies) {
    if (time > enemy.shieldedUntil) {
      enemy.damageReduction = 0;
    }

    if (time > enemy.buffedUntil) {
      enemy.speedMultiplier = 1;
      enemy.fireRateMultiplier = 1;
      enemy.damageMultiplier = 1;
    }
  }
}

function applyEnemyDeconfliction(input: UpdateEnemyLabAiInput): void {
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

function getDeconflictionShare(self: EnemyLabInstance, other: EnemyLabInstance): number {
  const selfMass = Math.max(0.25, self.definition.stats.mass ?? 1);
  const otherMass = Math.max(0.25, other.definition.stats.mass ?? 1);
  return otherMass / (selfMass + otherMass);
}

function getEnemyDeconflictionMultiplier(enemy: EnemyLabInstance): number {
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

function applySupportFields(input: UpdateEnemyLabAiInput): void {
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

function updateChase(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance, speedScale: number): void {
  enemy.state = 'chase';
  const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
  steerToward(input, enemy, direction, getEnemySpeed(input, enemy) * speedScale);
}

function updateChargeDash(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
  const windupMs = getParam(enemy.definition, 'windupMs', 720);
  const dashMs = getParam(enemy.definition, 'dashMs', 560);
  const recoverMs = getParam(enemy.definition, 'recoverMs', 850);
  const dashSpeed = getParam(enemy.definition, 'dashSpeed', 520) * input.enemySpeedMultiplier * enemy.speedMultiplier;
  const elapsed = input.time - enemy.stateStartedAt;

  if (enemy.state === 'idle' || enemy.state === 'chase') {
    enemy.state = 'chase';
    const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
    steerToward(input, enemy, direction, getEnemySpeed(input, enemy) * 0.74);
    if (elapsed > 900 && direction.length() < 760) {
      enemy.state = 'windup';
      enemy.stateStartedAt = input.time;
      enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
      enemy.velocity.scale(0.35);
    }
  } else if (enemy.state === 'windup') {
    const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
    if (direction.lengthSq() > 0) {
      enemy.body.rotation = Math.atan2(direction.x, -direction.y);
    }
    enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
    enemy.velocity.scale(Math.pow(0.88, input.deltaSeconds * 60));
    updateChargeTelegraph(input, enemy, Math.min(1, elapsed / windupMs));
    if (elapsed >= windupMs) {
      const dashDirection = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, enemy.target.x, enemy.target.y).normalize();
      enemy.velocity.copy(dashDirection.scale(dashSpeed));
      enemy.state = 'charging';
      enemy.stateStartedAt = input.time;
    }
  } else if (enemy.state === 'charging') {
    destroyTelegraphs(enemy);
    enemy.velocity.scale(Math.pow(0.992, input.deltaSeconds * 60));
    if (enemy.velocity.lengthSq() > 0) {
      enemy.body.rotation = Math.atan2(enemy.velocity.x, -enemy.velocity.y);
    }
    if (elapsed >= dashMs) {
      enemy.state = 'recover';
      enemy.stateStartedAt = input.time;
    }
  } else if (enemy.state === 'recover') {
    enemy.velocity.scale(Math.pow(0.86, input.deltaSeconds * 60));
    if (elapsed >= recoverMs) {
      enemy.state = 'chase';
      enemy.stateStartedAt = input.time;
    }
  }
}

function updateRangeOrbitShooter(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
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

function updateProximityDetonate(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
  const triggerRange = getParam(enemy.definition, 'triggerRange', 120);
  const blastRadius = getParam(enemy.definition, 'blastRadius', 170);
  const countdownMs = getParam(enemy.definition, 'countdownMs', 1500);
  const blastDamage = getParam(enemy.definition, 'blastDamage', 35);
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);

  if (enemy.state !== 'detonating' && offset.length() <= triggerRange) {
    enemy.state = 'detonating';
    enemy.stateStartedAt = input.time;
    enemy.velocity.scale(0.2);
  }

  if (enemy.state === 'detonating') {
    const progress = Math.min(1, (input.time - enemy.stateStartedAt) / countdownMs);
    enemy.velocity.scale(Math.pow(0.9, input.deltaSeconds * 60));
    updateBlastTelegraph(input, enemy, blastRadius, progress);
    if (progress >= 1) {
      input.explodeAt(enemy.body.x, enemy.body.y, blastRadius, blastDamage, enemy.id);
      enemy.hp = 0;
    }
  } else {
    enemy.state = 'approach';
    steerToward(input, enemy, offset, getEnemySpeed(input, enemy));
  }
}

function updateSniper(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
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
    }
  }

  if (enemy.state === 'aiming') {
    if (distance > 0) {
      const direction = offset.clone().scale(1 / distance);
      enemy.body.rotation = Math.atan2(direction.x, -direction.y);
      enemy.target = new Phaser.Math.Vector2(input.playerX, input.playerY);
      updateSniperBeam(input, enemy, direction, Math.min(1, elapsed / aimMs), false);
    }
    enemy.velocity.scale(Math.pow(0.94, input.deltaSeconds * 60));
    if (elapsed >= aimMs) {
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
      input.emitLabBurst(target.x, target.y, 0xe96dff, 8);
      enemy.state = 'cooldown';
      enemy.stateStartedAt = input.time;
      enemy.nextFireAt = input.time + cooldownMs;
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

function updateCarrierSpawner(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
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
    input.emitLabBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, 8);
    enemy.childrenSpawned += 1;
    enemy.nextFireAt = input.time + spawnEveryMs;
  }
}

function updateSupportShip(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
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

function updateScrapScavenger(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
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
      nearestScrap.collected = true;
      enemy.carriedScrap += 1;
      input.emitLabBurst(nearestScrap.x, nearestScrap.y, enemy.definition.visual.accentColor, 8);
    }
  } else {
    enemy.state = 'skulk';
    const lateral = playerOffset.lengthSq() > 0 ? new Phaser.Math.Vector2(-playerOffset.y, playerOffset.x).normalize() : new Phaser.Math.Vector2(1, 0);
    steerVelocity(input, enemy, lateral.scale(getEnemySpeed(input, enemy) * 0.45));
  }
}

function updateFlanker(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
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

function updateReflector(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
  const shieldMs = getParam(enemy.definition, 'shieldMs', 1200);
  const cooldownMs = getParam(enemy.definition, 'cooldownMs', 2800);
  const elapsed = input.time - enemy.stateStartedAt;
  const offset = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);

  if (enemy.state !== 'shield' && input.time >= enemy.nextFireAt) {
    enemy.state = 'shield';
    enemy.stateStartedAt = input.time;
    enemy.stateData.reflecting = true;
  }

  if (enemy.state === 'shield') {
    enemy.stateData.reflecting = true;
    updateShieldArc(input, enemy);
    if (elapsed >= shieldMs) {
      enemy.state = 'chase';
      enemy.stateStartedAt = input.time;
      enemy.stateData.reflecting = false;
      enemy.nextFireAt = input.time + cooldownMs;
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

function updatePhaseTeleport(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
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
    input.emitLabBurst(oldX, oldY, enemy.definition.visual.glowColor, 10);
    input.emitLabBurst(enemy.body.x, enemy.body.y, enemy.definition.visual.accentColor, 10);
    updatePhaseRing(input, enemy);
    enemy.nextFireAt = input.time + teleportEveryMs;
  }

  updateChase(input, enemy, 0.8);
}

function maybeFireAtPlayer(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance, direction: Phaser.Math.Vector2): void {
  if (!enemy.definition.weapon || input.time < enemy.nextFireAt) {
    return;
  }

  fireEnemyShot(input, enemy, direction, enemy.definition.visual.accentColor, PROJECTILE_RADIUS);
  enemy.nextFireAt = input.time + enemy.definition.weapon.cooldownMs * input.enemyFireRateMultiplier * enemy.fireRateMultiplier;
}

function fireEnemyShot(
  input: UpdateEnemyLabAiInput,
  enemy: EnemyLabInstance,
  direction: Phaser.Math.Vector2,
  color: number,
  radius: number
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
    color
  });
}

function moveEnemy(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
  moveBodyWithVelocityChannels({
    arena: input.arena,
    body: enemy.body,
    channels: enemy,
    deltaSeconds: input.deltaSeconds
  });
  dampVelocityChannel(enemy.knockbackVelocity, 0.88, input.deltaSeconds);
  dampVelocityChannel(enemy.blackHoleVelocity, 0.988, input.deltaSeconds);
  input.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, enemy.definition.visual.size);
  updateEnemyLabDebugLabel(enemy);
}

function steerToward(
  input: UpdateEnemyLabAiInput,
  enemy: EnemyLabInstance,
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

function steerVelocity(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance, targetVelocity: Phaser.Math.Vector2): void {
  const acceleration = enemy.definition.stats.acceleration ?? DEFAULT_ENEMY_RESPONSE;
  const blend = 1 - Math.exp(-acceleration * input.deltaSeconds);
  enemy.velocity.x = Phaser.Math.Linear(enemy.velocity.x, targetVelocity.x, blend);
  enemy.velocity.y = Phaser.Math.Linear(enemy.velocity.y, targetVelocity.y, blend);
}

function getEnemySpeed(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): number {
  return enemy.definition.stats.speed * input.enemySpeedMultiplier * enemy.speedMultiplier;
}

function getParam(definition: EnemyLabDefinition, key: string, fallback: number): number {
  const raw = definition.behavior.params?.[key];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}

function findNearestAlly(
  input: UpdateEnemyLabAiInput,
  enemy: EnemyLabInstance,
  preferDamaged: boolean
): EnemyLabInstance | undefined {
  const allies = input.enemies.filter((candidate) => candidate.id !== enemy.id && candidate.hp > 0);
  const damaged = allies.filter((candidate) => candidate.hp < candidate.maxHp);
  const candidates = preferDamaged && damaged.length > 0 ? damaged : allies;

  return candidates.sort(
    (a, b) =>
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, a.body.x, a.body.y).lengthSq() -
      getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, b.body.x, b.body.y).lengthSq()
  )[0];
}

function updateEnemyVisualPulse(enemy: EnemyLabInstance, time: number): void {
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

function updateChargeTelegraph(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance, progress: number): void {
  if (!input.telegraphsEnabled || !enemy.target) {
    destroyTelegraphs(enemy);
    return;
  }

  const line = enemy.telegraphs.chargeLine ?? input.scene.add.line(0, 0, 0, 0, 0, 0, enemy.definition.visual.accentColor, 0.38).setOrigin(0, 0).setDepth(6);
  enemy.telegraphs.chargeLine = line;
  line.setTo(enemy.body.x, enemy.body.y, enemy.target.x, enemy.target.y);
  line.setStrokeStyle(1 + progress * 3, enemy.definition.visual.accentColor, 0.18 + progress * 0.54);
}

function updateBlastTelegraph(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance, radius: number, progress: number): void {
  if (!input.telegraphsEnabled) {
    destroyTelegraphs(enemy);
    return;
  }

  const circle = enemy.telegraphs.warningCircle ?? input.scene.add.circle(enemy.body.x, enemy.body.y, radius, enemy.definition.visual.accentColor, 0.05).setDepth(5);
  enemy.telegraphs.warningCircle = circle;
  circle.setPosition(enemy.body.x, enemy.body.y);
  circle.setRadius(radius * (0.88 + progress * 0.12));
  circle.setStrokeStyle(2 + progress * 3, enemy.definition.visual.accentColor, 0.35 + progress * 0.45);
  circle.setFillStyle(enemy.definition.visual.accentColor, 0.04 + progress * 0.1);
}

function updateSniperBeam(
  input: UpdateEnemyLabAiInput,
  enemy: EnemyLabInstance,
  direction: Phaser.Math.Vector2,
  progress: number,
  locked: boolean
): void {
  if (!input.telegraphsEnabled) {
    destroyTelegraphs(enemy);
    return;
  }

  const beam = enemy.telegraphs.beamLine ?? input.scene.add.line(0, 0, 0, 0, 0, 0, enemy.definition.visual.accentColor, 0.3).setOrigin(0, 0).setDepth(6);
  enemy.telegraphs.beamLine = beam;
  const range = enemy.definition.weapon?.range ?? 1400;
  beam.setTo(enemy.body.x, enemy.body.y, enemy.body.x + direction.x * range, enemy.body.y + direction.y * range);
  beam.setStrokeStyle(locked ? 3 : 1.5, locked ? 0xff5964 : enemy.definition.visual.accentColor, locked ? 0.82 : 0.12 + progress * 0.46);
}

function updateAura(
  input: UpdateEnemyLabAiInput,
  enemy: EnemyLabInstance,
  radius: number,
  color: number,
  alpha: number
): void {
  if (!input.telegraphsEnabled) {
    enemy.telegraphs.auraCircle?.destroy();
    enemy.telegraphs.auraCircle = undefined;
    return;
  }

  const aura = enemy.telegraphs.auraCircle ?? input.scene.add.circle(enemy.body.x, enemy.body.y, radius, color, 0.03).setDepth(4);
  enemy.telegraphs.auraCircle = aura;
  aura.setPosition(enemy.body.x, enemy.body.y);
  aura.setRadius(radius);
  aura.setStrokeStyle(2, color, alpha);
}

function updateBeam(
  input: UpdateEnemyLabAiInput,
  enemy: EnemyLabInstance,
  targetX: number,
  targetY: number,
  color: number,
  alpha: number
): void {
  if (!input.telegraphsEnabled) {
    enemy.telegraphs.beamLine?.destroy();
    enemy.telegraphs.beamLine = undefined;
    return;
  }

  const beam = enemy.telegraphs.beamLine ?? input.scene.add.line(0, 0, 0, 0, 0, 0, color, alpha).setOrigin(0, 0).setDepth(6);
  enemy.telegraphs.beamLine = beam;
  beam.setTo(enemy.body.x, enemy.body.y, targetX, targetY);
  beam.setStrokeStyle(2, color, alpha);
}

function updateShieldArc(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
  if (!input.telegraphsEnabled) {
    enemy.telegraphs.shieldArc?.destroy();
    enemy.telegraphs.shieldArc = undefined;
    return;
  }

  const radius = enemy.definition.visual.size * 0.72;
  const arc = enemy.telegraphs.shieldArc ?? input.scene.add.circle(enemy.body.x, enemy.body.y, radius, 0xa8c7ff, 0.04).setDepth(7);
  enemy.telegraphs.shieldArc = arc;
  arc.setPosition(enemy.body.x, enemy.body.y);
  arc.setRadius(radius);
  arc.setStrokeStyle(4, enemy.definition.visual.accentColor, 0.76);
}

function updatePhaseRing(input: UpdateEnemyLabAiInput, enemy: EnemyLabInstance): void {
  if (!input.telegraphsEnabled) {
    return;
  }

  const ring = input.scene.add.circle(enemy.body.x, enemy.body.y, enemy.definition.visual.size * 0.45, enemy.definition.visual.glowColor, 0.04);
  ring.setStrokeStyle(2, enemy.definition.visual.accentColor, 0.7);
  ring.setDepth(6);
  input.scene.tweens.add({
    targets: ring,
    alpha: 0,
    scale: 2.4,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy()
  });
}
