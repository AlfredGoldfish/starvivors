import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import { SHOOTER_ENEMY_DISPLAY_SIZE, SHOOTER_PROJECTILE_HIT_RADIUS } from '../scenes/gameConstants';
import type { EnemyProjectile, ShooterEnemy } from '../scenes/gameTypes';
import { clearRuntimeProjectiles, destroyRuntimeProjectile, updateProjectiles } from './projectiles';

export interface FireShooterProjectileInput {
  scene: Phaser.Scene;
  arena: ArenaSize;
  enemy: ShooterEnemy;
  direction: Phaser.Math.Vector2;
  time: number;
}

export interface UpdateEnemyProjectilesInput {
  arena: ArenaSize;
  projectiles: EnemyProjectile[];
  time: number;
  deltaSeconds: number;
  isPlayerDead: boolean;
  applyProjectileGravity: (projectile: EnemyProjectile, deltaSeconds: number) => void;
  updateCapturedProjectile: (projectile: EnemyProjectile, deltaSeconds: number, mirrorViewRadius: number) => boolean;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
  tryHitPlayer: (projectile: EnemyProjectile) => boolean;
  tryHitObstruction?: (projectile: EnemyProjectile) => boolean;
}

export function fireShooterProjectile(input: FireShooterProjectileInput): EnemyProjectile {
  const spawnDistance = SHOOTER_ENEMY_DISPLAY_SIZE * 0.42;
  const spawnX = wrapCoordinate(input.enemy.body.x + input.direction.x * spawnDistance, input.arena.width);
  const spawnY = wrapCoordinate(input.enemy.body.y + input.direction.y * spawnDistance, input.arena.height);
  const rotation = Math.atan2(input.direction.x, -input.direction.y);
  const body = createEnemyProjectileBody(input.scene, spawnX, spawnY, rotation, input.enemy.stats.projectileSize);
  const wrapMirrorBody = createEnemyProjectileBody(input.scene, spawnX, spawnY, rotation, input.enemy.stats.projectileSize);
  wrapMirrorBody.setVisible(false);

  return {
    body,
    wrapMirrorBody,
    velocity: input.direction.clone().scale(input.enemy.stats.projectileSpeed),
    speed: input.enemy.stats.projectileSpeed,
    damage: input.enemy.stats.attackDamage,
    hitRadius: input.enemy.stats.projectileSize,
    owner: 'enemy',
    pierceRemaining: 0,
    knockback: 0,
    expiresAt: input.time + input.enemy.stats.projectileLifetimeSeconds * 1000,
    distanceRemaining: input.enemy.stats.projectileRange
  };
}

export function updateEnemyProjectiles(input: UpdateEnemyProjectilesInput): EnemyProjectile[] {
  return updateProjectiles({
    arena: input.arena,
    projectiles: input.projectiles,
    time: input.time,
    deltaSeconds: input.deltaSeconds,
    isSimulationPaused: input.isPlayerDead,
    applyProjectileGravity: input.applyProjectileGravity,
    updateCapturedProjectile: input.updateCapturedProjectile,
    updateToroidalRenderMirror: input.updateToroidalRenderMirror,
    getMirrorViewRadius: (projectile) => projectile.hitRadius,
    destroyProjectile: destroyEnemyProjectile,
    tryHitTarget: input.tryHitPlayer,
    tryHitObstruction: input.tryHitObstruction
  });
}

export function destroyEnemyProjectile(projectile: EnemyProjectile): void {
  destroyRuntimeProjectile(projectile);
}

export function clearEnemyProjectiles(projectiles: EnemyProjectile[]): EnemyProjectile[] {
  return clearRuntimeProjectiles(projectiles);
}

function createEnemyProjectileBody(
  scene: Phaser.Scene,
  x: number,
  y: number,
  rotation: number,
  hitRadius = SHOOTER_PROJECTILE_HIT_RADIUS
): Phaser.GameObjects.Container {
  const visualSize = hitRadius * 2.2;
  const glow = scene.add.ellipse(0, 0, visualSize, visualSize, 0xff5964, 0.28);
  const body = scene.add.ellipse(0, 0, hitRadius * 1.1, hitRadius * 1.78, 0xff8f4f, 0.94);
  body.setStrokeStyle(1, 0xfff0b8, 0.86);

  const projectile = scene.add.container(x, y, [glow, body]);

  projectile.setSize(visualSize, visualSize);
  projectile.setRotation(rotation);
  projectile.setDepth(8);

  return projectile;
}
