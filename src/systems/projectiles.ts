import Phaser from 'phaser';
import { wrapCoordinate, type ArenaSize } from '../core/arena';
import type { DamageVariance } from '../data/damageVariance';
import type { BlackHoleCapturedProjectileState } from './blackHole';

export type ProjectileOwner = 'player' | 'enemy' | 'world';

export interface ProjectileSplashPayload {
  radius: number;
  damageMultiplier: number;
}

export type ProjectileStatusKind = 'ionize' | 'plasma-wake' | 'critical';

export interface ProjectileStatusPayload {
  kind: ProjectileStatusKind;
  durationMs: number;
  damageMultiplier?: number;
}

export interface RuntimeProjectile extends BlackHoleCapturedProjectileState {
  body: Phaser.GameObjects.Container;
  wrapMirrorBody: Phaser.GameObjects.Container;
  velocity: Phaser.Math.Vector2;
  speed: number;
  damage: number;
  damageVariance?: DamageVariance;
  hitRadius: number;
  owner: ProjectileOwner;
  pierceRemaining: number;
  knockback: number;
  expiresAt: number;
  distanceRemaining: number;
  piercedTargets?: WeakSet<object>;
  splash?: ProjectileSplashPayload;
  statuses?: ProjectileStatusPayload[];
}

export interface UpdateProjectilesInput<TProjectile extends RuntimeProjectile> {
  arena: ArenaSize;
  projectiles: TProjectile[];
  time: number;
  deltaSeconds: number;
  isSimulationPaused: boolean;
  applyProjectileGravity: (projectile: TProjectile, deltaSeconds: number) => void;
  updateCapturedProjectile: (projectile: TProjectile, deltaSeconds: number, mirrorViewRadius: number) => boolean;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
  getMirrorViewRadius: (projectile: TProjectile) => number;
  destroyProjectile?: (projectile: TProjectile) => void;
  steerProjectile?: (projectile: TProjectile, deltaSeconds: number) => void;
  tryHitTarget?: (projectile: TProjectile) => boolean;
  tryHitObstruction?: (projectile: TProjectile) => boolean;
  shouldDestroyAfterHit?: (projectile: TProjectile) => boolean;
  afterProjectileUpdate?: (projectile: TProjectile) => void;
}

export function updateProjectiles<TProjectile extends RuntimeProjectile>(
  input: UpdateProjectilesInput<TProjectile>
): TProjectile[] {
  if (input.isSimulationPaused) {
    return input.projectiles;
  }

  const projectiles = [...input.projectiles];
  const destroyProjectile = input.destroyProjectile ?? destroyRuntimeProjectile;

  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    input.steerProjectile?.(projectile, input.deltaSeconds);
    input.applyProjectileGravity(projectile, input.deltaSeconds);

    const travelDistance = projectile.speed * input.deltaSeconds;
    projectile.body.x = wrapCoordinate(projectile.body.x + projectile.velocity.x * input.deltaSeconds, input.arena.width);
    projectile.body.y = wrapCoordinate(projectile.body.y + projectile.velocity.y * input.deltaSeconds, input.arena.height);
    projectile.distanceRemaining -= travelDistance;

    const mirrorViewRadius = input.getMirrorViewRadius(projectile);
    input.updateToroidalRenderMirror(projectile.body, projectile.wrapMirrorBody, mirrorViewRadius);

    if (projectile.capturedByBlackHole) {
      if (input.updateCapturedProjectile(projectile, input.deltaSeconds, mirrorViewRadius)) {
        destroyProjectile(projectile);
        projectiles.splice(i, 1);
      }

      continue;
    }

    const didHitTarget = input.tryHitTarget?.(projectile) ?? false;
    const didHitObstruction = !didHitTarget && (input.tryHitObstruction?.(projectile) ?? false);

    if ((didHitTarget || didHitObstruction) && (input.shouldDestroyAfterHit?.(projectile) ?? true)) {
      destroyProjectile(projectile);
      projectiles.splice(i, 1);
    } else if (input.time >= projectile.expiresAt || projectile.distanceRemaining <= 0) {
      destroyProjectile(projectile);
      projectiles.splice(i, 1);
    } else {
      input.afterProjectileUpdate?.(projectile);
    }
  }

  return projectiles;
}

export function destroyRuntimeProjectile(projectile: RuntimeProjectile): void {
  projectile.body.destroy(true);
  projectile.wrapMirrorBody.destroy(true);
}

export function clearRuntimeProjectiles<TProjectile extends RuntimeProjectile>(projectiles: TProjectile[]): TProjectile[] {
  for (const projectile of projectiles) {
    destroyRuntimeProjectile(projectile);
  }

  return [];
}
