import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  BASIC_ENEMY_DISPLAY_SIZE,
  ENEMY_KNOCKBACK_DAMPING,
  SHOOTER_ENEMY_DISPLAY_SIZE
} from '../scenes/gameConstants';
import type { BasicEnemy, ShooterEnemy } from '../scenes/gameTypes';

export interface UpdateBasicEnemiesInput {
  arena: ArenaSize;
  enemies: BasicEnemy[];
  playerX: number;
  playerY: number;
  time: number;
  deltaSeconds: number;
  getGlobalMaxSpeed: () => number;
  getEnemyMoveSpeed: (enemy: BasicEnemy) => number;
  steerEnemyVelocity: (
    enemy: BasicEnemy,
    targetVelocity: Phaser.Math.Vector2,
    deltaSeconds: number
  ) => void;
  applyBlackHoleToEnemy: (
    enemy: BasicEnemy,
    index: number,
    deltaSeconds: number,
    time: number
  ) => boolean;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
}

export interface UpdateShooterEnemiesInput {
  arena: ArenaSize;
  enemies: ShooterEnemy[];
  playerX: number;
  playerY: number;
  time: number;
  deltaSeconds: number;
  isPlayerDead: boolean;
  getGlobalMaxSpeed: () => number;
  getEnemyMoveSpeed: (enemy: ShooterEnemy) => number;
  steerEnemyVelocity: (
    enemy: ShooterEnemy,
    targetVelocity: Phaser.Math.Vector2,
    deltaSeconds: number
  ) => void;
  applyBlackHoleToEnemy: (
    enemy: ShooterEnemy,
    index: number,
    deltaSeconds: number,
    time: number
  ) => boolean;
  fireShooterProjectile: (enemy: ShooterEnemy, directionToPlayer: Phaser.Math.Vector2, time: number) => void;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
}

export function updateBasicEnemies(input: UpdateBasicEnemiesInput): void {
  for (let i = input.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = input.enemies[i];
    const direction = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
    const targetVelocity = new Phaser.Math.Vector2(0, 0);

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const enemyMoveSpeed = input.getEnemyMoveSpeed(enemy);
      targetVelocity.set(direction.x * enemyMoveSpeed, direction.y * enemyMoveSpeed);
      enemy.body.rotation = Math.atan2(direction.x, -direction.y);
    }

    input.steerEnemyVelocity(enemy, targetVelocity, input.deltaSeconds);

    if (input.applyBlackHoleToEnemy(enemy, i, input.deltaSeconds, input.time)) {
      continue;
    }

    const totalVelocity = enemy.velocity
      .clone()
      .add(enemy.knockbackVelocity)
      .add(enemy.blackHoleVelocity)
      .limit(input.getGlobalMaxSpeed());

    enemy.body.x = wrapCoordinate(enemy.body.x + totalVelocity.x * input.deltaSeconds, input.arena.width);
    enemy.body.y = wrapCoordinate(enemy.body.y + totalVelocity.y * input.deltaSeconds, input.arena.height);
    enemy.knockbackVelocity.scale(Math.pow(ENEMY_KNOCKBACK_DAMPING, input.deltaSeconds * 60));
    input.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, BASIC_ENEMY_DISPLAY_SIZE * 0.5);
  }
}

export function updateShooterEnemies(input: UpdateShooterEnemiesInput): void {
  for (let i = input.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = input.enemies[i];
    const offsetToPlayer = getWrappedDirection(input.arena, enemy.body.x, enemy.body.y, input.playerX, input.playerY);
    const distance = offsetToPlayer.length();
    const targetVelocity = new Phaser.Math.Vector2(0, 0);

    if (distance > 0) {
      const directionToPlayer = offsetToPlayer.clone().scale(1 / distance);
      const enemyMoveSpeed = input.getEnemyMoveSpeed(enemy);

      enemy.body.rotation = Math.atan2(directionToPlayer.x, -directionToPlayer.y);

      if (distance > enemy.stats.preferredRange) {
        targetVelocity.set(directionToPlayer.x * enemyMoveSpeed, directionToPlayer.y * enemyMoveSpeed);
      } else if (distance < enemy.stats.retreatThreshold) {
        targetVelocity.set(-directionToPlayer.x * enemyMoveSpeed * 0.72, -directionToPlayer.y * enemyMoveSpeed * 0.72);
      }

      if (!input.isPlayerDead && input.time >= enemy.nextFireAt) {
        input.fireShooterProjectile(enemy, directionToPlayer, input.time);
        enemy.nextFireAt = input.time + enemy.stats.attackCooldown * 1000;
      }
    }

    input.steerEnemyVelocity(enemy, targetVelocity, input.deltaSeconds);

    if (input.applyBlackHoleToEnemy(enemy, i, input.deltaSeconds, input.time)) {
      continue;
    }

    const totalVelocity = enemy.velocity
      .clone()
      .add(enemy.knockbackVelocity)
      .add(enemy.blackHoleVelocity)
      .limit(input.getGlobalMaxSpeed());

    enemy.body.x = wrapCoordinate(enemy.body.x + totalVelocity.x * input.deltaSeconds, input.arena.width);
    enemy.body.y = wrapCoordinate(enemy.body.y + totalVelocity.y * input.deltaSeconds, input.arena.height);
    enemy.knockbackVelocity.scale(Math.pow(ENEMY_KNOCKBACK_DAMPING, input.deltaSeconds * 60));
    input.updateToroidalRenderMirror(enemy.body, enemy.wrapMirrorBody, SHOOTER_ENEMY_DISPLAY_SIZE * 0.5);
  }
}

function getWrappedDirection(
  arena: ArenaSize,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Phaser.Math.Vector2 {
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
