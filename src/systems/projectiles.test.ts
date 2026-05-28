import { describe, expect, it, vi } from 'vitest';
import { updateProjectiles, type RuntimeProjectile } from './projectiles';

describe('projectile updates', () => {
  it('moves projectiles through wrapped arena space and updates mirrors', () => {
    const projectile = createProjectile({ x: 95, y: 5, velocity: { x: 20, y: -10 }, speed: 20, distanceRemaining: 100 });
    const updateMirror = vi.fn();
    const afterUpdate = vi.fn();

    const result = updateProjectiles({
      arena: { width: 100, height: 100 },
      projectiles: [projectile],
      time: 100,
      deltaSeconds: 0.5,
      isSimulationPaused: false,
      applyProjectileGravity: vi.fn(),
      updateCapturedProjectile: vi.fn(() => false),
      updateToroidalRenderMirror: updateMirror,
      getMirrorViewRadius: () => 12,
      afterProjectileUpdate: afterUpdate
    });

    expect(result).toEqual([projectile]);
    expect(projectile.body.x).toBe(5);
    expect(projectile.body.y).toBe(0);
    expect(projectile.distanceRemaining).toBe(90);
    expect(updateMirror).toHaveBeenCalledWith(projectile.body, projectile.wrapMirrorBody, 12);
    expect(afterUpdate).toHaveBeenCalledWith(projectile);
  });

  it('does not mutate projectile state while simulation is paused', () => {
    const projectile = createProjectile({ x: 10, y: 10 });
    const projectiles = [projectile];
    const applyGravity = vi.fn();

    const result = updateProjectiles({
      arena: { width: 100, height: 100 },
      projectiles,
      time: 100,
      deltaSeconds: 1,
      isSimulationPaused: true,
      applyProjectileGravity: applyGravity,
      updateCapturedProjectile: vi.fn(() => false),
      updateToroidalRenderMirror: vi.fn(),
      getMirrorViewRadius: () => 12
    });

    expect(result).toBe(projectiles);
    expect(projectile.body.x).toBe(10);
    expect(applyGravity).not.toHaveBeenCalled();
  });

  it('destroys projectiles on target hits by default', () => {
    const projectile = createProjectile();
    const destroyProjectile = vi.fn();

    const result = updateProjectiles({
      arena: { width: 100, height: 100 },
      projectiles: [projectile],
      time: 100,
      deltaSeconds: 0.1,
      isSimulationPaused: false,
      applyProjectileGravity: vi.fn(),
      updateCapturedProjectile: vi.fn(() => false),
      updateToroidalRenderMirror: vi.fn(),
      getMirrorViewRadius: () => 12,
      destroyProjectile,
      tryHitTarget: vi.fn(() => true)
    });

    expect(result).toEqual([]);
    expect(destroyProjectile).toHaveBeenCalledWith(projectile);
  });

  it('removes captured projectiles when the black hole update consumes them', () => {
    const projectile = createProjectile({ capturedByBlackHole: true });
    const destroyProjectile = vi.fn();

    const result = updateProjectiles({
      arena: { width: 100, height: 100 },
      projectiles: [projectile],
      time: 100,
      deltaSeconds: 0.1,
      isSimulationPaused: false,
      applyProjectileGravity: vi.fn(),
      updateCapturedProjectile: vi.fn(() => true),
      updateToroidalRenderMirror: vi.fn(),
      getMirrorViewRadius: () => 12,
      destroyProjectile,
      tryHitTarget: vi.fn(() => true)
    });

    expect(result).toEqual([]);
    expect(destroyProjectile).toHaveBeenCalledWith(projectile);
  });
});

type ProjectileTestOverrides = Partial<Omit<RuntimeProjectile, 'velocity'>> & {
  x?: number;
  y?: number;
  velocity?: { x: number; y: number };
};

function createProjectile(overrides: ProjectileTestOverrides = {}): RuntimeProjectile {
  return {
    body: createBody(overrides.x ?? 10, overrides.y ?? 10),
    wrapMirrorBody: createBody(overrides.x ?? 10, overrides.y ?? 10),
    velocity: { x: 10, y: 0 },
    speed: 10,
    damage: 1,
    hitRadius: 4,
    owner: 'player',
    pierceRemaining: 0,
    knockback: 0,
    expiresAt: 1000,
    distanceRemaining: 100,
    capturedByBlackHole: false,
    blackHoleCaptureRadius: 0,
    blackHoleCaptureAngle: 0,
    blackHoleCaptureAngularVelocity: 0,
    blackHoleCaptureRadialVelocity: 0,
    ...overrides
  } as unknown as RuntimeProjectile;
}

function createBody(x: number, y: number): RuntimeProjectile['body'] {
  return {
    x,
    y,
    destroy: vi.fn()
  } as unknown as RuntimeProjectile['body'];
}
