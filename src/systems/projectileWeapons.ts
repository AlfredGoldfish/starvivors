import Phaser from 'phaser';
import { PLAYER_PROJECTILE_HIT_RADIUS, PLAYER_PROJECTILE_MUZZLE_OFFSET } from '../scenes/gameConstants';
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
