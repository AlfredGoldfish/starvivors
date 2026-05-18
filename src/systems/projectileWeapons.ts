import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import {
  PLAYER_PROJECTILE_HIT_RADIUS,
  PLAYER_PROJECTILE_MUZZLE_OFFSET,
  PLAYER_PROJECTILE_TRAIL_FADE_MS,
  PLAYER_PROJECTILE_TRAIL_INTERVAL_MS,
  PLAYER_PROJECTILE_TRAIL_OFFSET
} from '../scenes/gameConstants';
import type { PlayerProjectile } from '../scenes/gameTypes';
import type { ResolvedWeaponStats } from './weaponStats';
import { isProjectileWeapon } from '../data/weapons';

export interface FireProjectileWeaponInput {
  scene: Phaser.Scene;
  resolved: ResolvedWeaponStats;
  time: number;
  playerX: number;
  playerY: number;
  playerRotation: number;
  getForwardDirection: (rotation: number) => Phaser.Math.Vector2;
}

export interface FireProjectileWeaponResult {
  cooldownMs: number;
  projectiles: PlayerProjectile[];
}

export interface UpdatePlayerProjectilesInput {
  scene: Phaser.Scene;
  arena: ArenaSize;
  projectiles: PlayerProjectile[];
  time: number;
  deltaSeconds: number;
  isPlayerDead: boolean;
  applyProjectileGravity: (projectile: PlayerProjectile, deltaSeconds: number) => void;
  updateCapturedProjectile: (projectile: PlayerProjectile, deltaSeconds: number, mirrorViewRadius: number) => boolean;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
  tryHitTarget: (projectile: PlayerProjectile) => boolean;
}

export function fireProjectileWeapon(input: FireProjectileWeaponInput): FireProjectileWeaponResult {
  const weapon = input.resolved.weapon;
  if (!isProjectileWeapon(weapon) || !weapon.projectileVisual) {
    return { cooldownMs: 0, projectiles: [] };
  }

  const projectileConfig = input.resolved.projectile;
  if (!projectileConfig) {
    return { cooldownMs: 0, projectiles: [] };
  }

  const direction = input.getForwardDirection(input.playerRotation);
  const spawnX = input.playerX + direction.x * PLAYER_PROJECTILE_MUZZLE_OFFSET;
  const spawnY = input.playerY + direction.y * PLAYER_PROJECTILE_MUZZLE_OFFSET;
  const projectiles: PlayerProjectile[] = [];

  for (let index = 0; index < projectileConfig.projectileCount; index += 1) {
    const spreadOffset = index - (projectileConfig.projectileCount - 1) / 2;
    const projectileRotation = input.playerRotation + spreadOffset * 0.08;
    const projectileDirection = input.getForwardDirection(projectileRotation);
    const body = createPlayerProjectileBody(input.scene, spawnX, spawnY, projectileRotation, input.resolved, projectileConfig.projectileAreaScale);
    const wrapMirrorBody = createPlayerProjectileBody(
      input.scene,
      spawnX,
      spawnY,
      projectileRotation,
      input.resolved,
      projectileConfig.projectileAreaScale
    );
    wrapMirrorBody.setVisible(false);

    projectiles.push({
      body,
      wrapMirrorBody,
      velocity: projectileDirection.scale(projectileConfig.projectileSpeed),
      speed: projectileConfig.projectileSpeed,
      damage: projectileConfig.damage,
      hitRadius: PLAYER_PROJECTILE_HIT_RADIUS * projectileConfig.projectileAreaScale,
      pierceRemaining: projectileConfig.pierce,
      piercedTargets: new WeakSet<object>(),
      expiresAt: input.time + projectileConfig.projectileLifetimeMs,
      distanceRemaining: projectileConfig.projectileRange,
      nextTrailAt: input.time,
      trailColor: weapon.projectileVisual.trailColor
    });
  }

  return { cooldownMs: projectileConfig.cooldownMs, projectiles };
}

export function updatePlayerProjectiles(input: UpdatePlayerProjectilesInput): PlayerProjectile[] {
  if (input.isPlayerDead) {
    return input.projectiles;
  }

  const projectiles = [...input.projectiles];

  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    input.applyProjectileGravity(projectile, input.deltaSeconds);
    const travelDistance = projectile.speed * input.deltaSeconds;

    projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * input.deltaSeconds, input.arena.width);
    projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * input.deltaSeconds, input.arena.height);
    projectile.distanceRemaining -= travelDistance;
    input.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, PLAYER_PROJECTILE_MUZZLE_OFFSET);

    if (projectile.capturedByBlackHole) {
      if (input.updateCapturedProjectile(projectile, input.deltaSeconds, PLAYER_PROJECTILE_MUZZLE_OFFSET)) {
        destroyPlayerProjectile(projectile);
        projectiles.splice(i, 1);
      }

      continue;
    }

    const didHitTarget = !input.isPlayerDead && input.tryHitTarget(projectile);

    if (didHitTarget && shouldDestroyProjectileAfterHit(projectile)) {
      destroyPlayerProjectile(projectile);
      projectiles.splice(i, 1);
    } else if (input.time >= projectile.expiresAt || projectile.distanceRemaining <= 0) {
      destroyPlayerProjectile(projectile);
      projectiles.splice(i, 1);
    } else if (input.time >= projectile.nextTrailAt) {
      emitPlayerProjectileTrail(input.scene, projectile);
      projectile.nextTrailAt = input.time + PLAYER_PROJECTILE_TRAIL_INTERVAL_MS;
    }
  }

  return projectiles;
}

export function destroyPlayerProjectile(projectile: PlayerProjectile): void {
  projectile.body.destroy(true);
  projectile.wrapMirrorBody.destroy(true);
}

export function clearPlayerProjectiles(projectiles: PlayerProjectile[]): PlayerProjectile[] {
  for (const projectile of projectiles) {
    destroyPlayerProjectile(projectile);
  }

  return [];
}

function shouldDestroyProjectileAfterHit(projectile: PlayerProjectile): boolean {
  if (projectile.pierceRemaining <= 0) {
    return true;
  }

  projectile.pierceRemaining -= 1;
  return false;
}

function emitPlayerProjectileTrail(scene: Phaser.Scene, projectile: PlayerProjectile): void {
  const movementDirection = projectile.velocity.clone().normalize();
  const trailDirection = movementDirection.clone().negate();
  const sideDirection = new Phaser.Math.Vector2(-movementDirection.y, movementDirection.x);
  const jitter = Phaser.Math.FloatBetween(-2.4, 2.4);
  const x = projectile.body.x + trailDirection.x * PLAYER_PROJECTILE_TRAIL_OFFSET + sideDirection.x * jitter;
  const y = projectile.body.y + trailDirection.y * PLAYER_PROJECTILE_TRAIL_OFFSET + sideDirection.y * jitter;
  const particle = scene.add.circle(x, y, Phaser.Math.FloatBetween(2.2, 4.2), projectile.trailColor, 0.7);

  particle.setDepth(7);
  particle.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: particle,
    x: x + trailDirection.x * 12,
    y: y + trailDirection.y * 12,
    alpha: 0,
    scale: 0.18,
    duration: PLAYER_PROJECTILE_TRAIL_FADE_MS,
    ease: 'Quad.easeOut',
    onComplete: () => particle.destroy()
  });
}

function createPlayerProjectileBody(
  scene: Phaser.Scene,
  x: number,
  y: number,
  rotation: number,
  resolved: ResolvedWeaponStats,
  areaScale = 1
): Phaser.GameObjects.Container {
  const weapon = resolved.weapon;
  const visual = weapon.projectileVisual;
  if (!visual) {
    throw new Error(`${weapon.displayName} does not define projectile visuals.`);
  }

  const glow = scene.add.ellipse(0, 0, visual.width * areaScale, visual.height * areaScale, visual.glowColor, visual.glowAlpha);
  const body = scene.add.ellipse(0, 0, visual.width * 0.44 * areaScale, visual.height * 0.63 * areaScale, visual.bodyColor, 1);
  body.setStrokeStyle(1, visual.bodyStrokeColor, 0.95);

  const projectile = scene.add.container(x, y, [glow, body]);

  projectile.setSize(visual.width * areaScale, visual.height * areaScale);
  projectile.setRotation(rotation);
  projectile.setDepth(8);

  return projectile;
}
