import Phaser from 'phaser';
import type { ArenaSize } from '../core/arena';
import {
  PLAYER_PROJECTILE_HIT_RADIUS,
  PLAYER_PROJECTILE_MUZZLE_OFFSET,
  PLAYER_PROJECTILE_TRAIL_FADE_MS,
  PLAYER_PROJECTILE_TRAIL_INTERVAL_MS,
  PLAYER_PROJECTILE_TRAIL_OFFSET
} from '../scenes/gameConstants';
import type { PlayerProjectile } from '../scenes/gameTypes';
import type { ResolvedProjectilePatternStats, ResolvedWeaponStats } from './weaponStats';
import { isProjectileWeapon } from '../data/weapons';
import { getForgeAssetDefinition } from '../data/forgeAssetRegistry';
import { createForgeAssetTexture, getForgeTextureKey } from './assetForge';
import {
  clearRuntimeProjectiles,
  destroyRuntimeProjectile,
  updateProjectiles,
  type ProjectileStatusPayload
} from './projectiles';

export interface FireProjectileWeaponInput {
  scene: Phaser.Scene;
  resolved: ResolvedWeaponStats;
  time: number;
  playerX: number;
  playerY: number;
  playerRotation: number;
  getForwardDirection: (rotation: number) => Phaser.Math.Vector2;
  damageMultiplier?: number;
  areaMultiplier?: number;
  isOverloaded?: boolean;
  isEmergencyEmpowered?: boolean;
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
  steerProjectile?: (projectile: PlayerProjectile, deltaSeconds: number) => void;
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

  const damageMultiplier = input.damageMultiplier ?? 1;
  const areaMultiplier = input.areaMultiplier ?? 1;
  const projectileAreaScale = projectileConfig.projectileAreaScale * areaMultiplier;
  const projectileRotations = getProjectilePatternRotations(input.playerRotation, projectileConfig.projectileCount, projectileConfig.pattern);

  for (const projectileRotation of projectileRotations) {
    const projectileDirection = input.getForwardDirection(projectileRotation);
    const body = createPlayerProjectileBody(input.scene, spawnX, spawnY, projectileRotation, input.resolved, projectileAreaScale);
    const wrapMirrorBody = createPlayerProjectileBody(
      input.scene,
      spawnX,
      spawnY,
      projectileRotation,
      input.resolved,
      projectileAreaScale
    );
    wrapMirrorBody.setVisible(false);

    projectiles.push({
      body,
      wrapMirrorBody,
      velocity: projectileDirection.scale(projectileConfig.projectileSpeed),
      speed: projectileConfig.projectileSpeed,
      damage: projectileConfig.damage * damageMultiplier,
      damageVariance: projectileConfig.damageVariance,
      hitRadius: PLAYER_PROJECTILE_HIT_RADIUS * projectileAreaScale,
      owner: 'player',
      pierceRemaining: projectileConfig.pierce,
      knockback: 0,
      bouncesRemaining: projectileConfig.effects.bounceCount,
      piercedTargets: new WeakSet<object>(),
      expiresAt: input.time + projectileConfig.projectileLifetimeMs,
      distanceRemaining: projectileConfig.projectileRange,
      nextTrailAt: input.time,
      trailColor: weapon.projectileVisual.trailColor,
      effects: projectileConfig.effects,
      splash:
        projectileConfig.effects.explosionRadius > 0 && projectileConfig.effects.explosionDamageMultiplier > 0
          ? {
              radius: projectileConfig.effects.explosionRadius * projectileAreaScale,
              damageMultiplier: projectileConfig.effects.explosionDamageMultiplier
            }
          : undefined,
      statuses: resolveProjectileStatuses(projectileConfig.effects),
      isOverloaded: input.isOverloaded ?? false,
      isEmergencyEmpowered: input.isEmergencyEmpowered ?? false
    });
  }

  return { cooldownMs: projectileConfig.cooldownMs, projectiles };
}

export function updatePlayerProjectiles(input: UpdatePlayerProjectilesInput): PlayerProjectile[] {
  return updateProjectiles({
    arena: input.arena,
    projectiles: input.projectiles,
    time: input.time,
    deltaSeconds: input.deltaSeconds,
    isSimulationPaused: input.isPlayerDead,
    applyProjectileGravity: input.applyProjectileGravity,
    updateCapturedProjectile: input.updateCapturedProjectile,
    updateToroidalRenderMirror: input.updateToroidalRenderMirror,
    getMirrorViewRadius: () => PLAYER_PROJECTILE_MUZZLE_OFFSET,
    destroyProjectile: destroyPlayerProjectile,
    steerProjectile: input.steerProjectile,
    tryHitTarget: input.tryHitTarget,
    shouldDestroyAfterHit: shouldDestroyProjectileAfterHit,
    afterProjectileUpdate: (projectile) => {
      if (input.time >= projectile.nextTrailAt) {
        emitPlayerProjectileTrail(input.scene, projectile);
        projectile.nextTrailAt = input.time + PLAYER_PROJECTILE_TRAIL_INTERVAL_MS;
      }
    }
  });
}

export function destroyPlayerProjectile(projectile: PlayerProjectile): void {
  destroyRuntimeProjectile(projectile);
}

export function clearPlayerProjectiles(projectiles: PlayerProjectile[]): PlayerProjectile[] {
  return clearRuntimeProjectiles(projectiles);
}

function shouldDestroyProjectileAfterHit(projectile: PlayerProjectile): boolean {
  if (projectile.pierceRemaining <= 0) {
    if (projectile.bouncesRemaining <= 0) {
      return true;
    }

    projectile.bouncesRemaining -= 1;
    return false;
  }

  projectile.pierceRemaining -= 1;
  return false;
}

function getProjectilePatternRotations(
  baseRotation: number,
  projectileCount: number,
  pattern: ResolvedProjectilePatternStats
): number[] {
  const rotations: number[] = [];
  const forwardCount = projectileCount + pattern.forwardExtraCount;
  appendSpreadRotations(rotations, baseRotation, forwardCount, pattern.forwardExtraCount > 0 ? pattern.spreadRadians : 0.08);

  const rearCount = pattern.rearCount + (pattern.crossfire ? 1 : 0);
  if (rearCount > 0) {
    appendSpreadRotations(rotations, baseRotation + Math.PI, rearCount, 0.08);
  }

  const sideCount = pattern.sideCount + (pattern.crossfire ? 1 : 0);
  if (sideCount > 0) {
    appendSpreadRotations(rotations, baseRotation - Math.PI / 2, sideCount, 0.08);
    appendSpreadRotations(rotations, baseRotation + Math.PI / 2, sideCount, 0.08);
  }

  return rotations;
}

function appendSpreadRotations(rotations: number[], centerRotation: number, count: number, spreadRadians: number): void {
  for (let index = 0; index < count; index += 1) {
    const spreadOffset = index - (count - 1) / 2;
    rotations.push(centerRotation + spreadOffset * spreadRadians);
  }
}

function resolveProjectileStatuses(effects: PlayerProjectile['effects']): ProjectileStatusPayload[] | undefined {
  const statuses: ProjectileStatusPayload[] = [];

  if (effects.ionizeDurationMs > 0) {
    statuses.push({
      kind: 'ionize',
      durationMs: effects.ionizeDurationMs,
      damageMultiplier: effects.ionizeDamageMultiplier
    });
  }

  if (effects.plasmaWakeDurationMs > 0) {
    statuses.push({
      kind: 'plasma-wake',
      durationMs: effects.plasmaWakeDurationMs,
      damageMultiplier: effects.plasmaWakeDamageMultiplier
    });
  }

  if (effects.criticalDurationMs > 0) {
    statuses.push({
      kind: 'critical',
      durationMs: effects.criticalDurationMs,
      damageMultiplier: effects.criticalDamageBonusPerHit
    });
  }

  return statuses.length > 0 ? statuses : undefined;
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

  const forgeAsset = weapon.projectileVisualAssetId ? getForgeAssetDefinition(weapon.projectileVisualAssetId) : undefined;
  if (forgeAsset) {
    const textureKey = getForgeTextureKey(forgeAsset.id);
    createForgeAssetTexture(scene, forgeAsset, textureKey);

    const image = scene.add.image(0, 0, textureKey);
    image.setOrigin(0.5);
    image.setDisplaySize(
      readForgeDisplayHint(forgeAsset.gameplayHints?.displayWidth, visual.width * 1.55) * areaScale,
      readForgeDisplayHint(forgeAsset.gameplayHints?.displayHeight, visual.height * 1.55) * areaScale
    );
    image.setBlendMode(Phaser.BlendModes.ADD);

    const projectile = scene.add.container(x, y, [image]);
    projectile.setSize(image.displayWidth, image.displayHeight);
    projectile.setRotation(rotation);
    projectile.setDepth(8);
    projectile.setData('forgeAssetId', forgeAsset.id);
    return projectile;
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

function readForgeDisplayHint(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}
