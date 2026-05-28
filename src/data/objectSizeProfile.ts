export type ObjectSizeKind = 'player-ship' | 'enemy' | 'asteroid';

export interface ObjectSizeProfile {
  kind: ObjectSizeKind;
  id: string;
  sourceDiameterPx?: number;
  runtimeScale: number;
  collisionRadiusRatio?: number;
  strokeWidthPx?: number;
}

export interface ResolvedObjectSizeProfile {
  kind: ObjectSizeKind;
  id: string;
  sourceDiameterPx: number;
  runtimeScale: number;
  visualDiameterPx: number;
  collisionRadiusRatio: number;
  collisionRadiusPx: number;
  strokeWidthPx?: number;
}

export const OBJECT_SOURCE_DIAMETER_PX = 320;
export const SHIP_ENEMY_COLLISION_RADIUS_RATIO = 0.62;
export const ASTEROID_COLLISION_RADIUS_RATIO = 0.72;

export const DEFAULT_COLLISION_RADIUS_RATIO_BY_KIND: Record<ObjectSizeKind, number> = {
  'player-ship': SHIP_ENEMY_COLLISION_RADIUS_RATIO,
  enemy: SHIP_ENEMY_COLLISION_RADIUS_RATIO,
  asteroid: ASTEROID_COLLISION_RADIUS_RATIO
};

export function resolveObjectSizeProfile(profile: ObjectSizeProfile): ResolvedObjectSizeProfile {
  const sourceDiameterPx = clampFinite(profile.sourceDiameterPx, OBJECT_SOURCE_DIAMETER_PX, 1, 9999);
  const runtimeScale = clampFinite(profile.runtimeScale, 1, 0.01, 999);
  const collisionRadiusRatio = clampFinite(
    profile.collisionRadiusRatio,
    DEFAULT_COLLISION_RADIUS_RATIO_BY_KIND[profile.kind],
    0.01,
    4
  );
  const visualDiameterPx = sourceDiameterPx * runtimeScale;

  return {
    kind: profile.kind,
    id: profile.id,
    sourceDiameterPx,
    runtimeScale,
    visualDiameterPx,
    collisionRadiusRatio,
    collisionRadiusPx: visualDiameterPx * collisionRadiusRatio * 0.5,
    strokeWidthPx: profile.strokeWidthPx
  };
}

export function createObjectSizeProfileFromCollisionRadius(input: {
  kind: ObjectSizeKind;
  id: string;
  collisionRadiusPx: number;
  collisionRadiusRatio?: number;
  sourceDiameterPx?: number;
  strokeWidthPx?: number;
}): ObjectSizeProfile {
  const sourceDiameterPx = clampFinite(input.sourceDiameterPx, OBJECT_SOURCE_DIAMETER_PX, 1, 9999);
  const collisionRadiusRatio = clampFinite(
    input.collisionRadiusRatio,
    DEFAULT_COLLISION_RADIUS_RATIO_BY_KIND[input.kind],
    0.01,
    4
  );
  const collisionDiameterPx = Math.max(1, input.collisionRadiusPx * 2);

  return {
    kind: input.kind,
    id: input.id,
    sourceDiameterPx,
    runtimeScale: collisionDiameterPx / (sourceDiameterPx * collisionRadiusRatio),
    collisionRadiusRatio,
    strokeWidthPx: input.strokeWidthPx
  };
}

export function createObjectSizeProfileFromVisualDiameter(input: {
  kind: ObjectSizeKind;
  id: string;
  visualDiameterPx: number;
  collisionRadiusRatio?: number;
  sourceDiameterPx?: number;
  strokeWidthPx?: number;
}): ObjectSizeProfile {
  const sourceDiameterPx = clampFinite(input.sourceDiameterPx, OBJECT_SOURCE_DIAMETER_PX, 1, 9999);

  return {
    kind: input.kind,
    id: input.id,
    sourceDiameterPx,
    runtimeScale: Math.max(1, input.visualDiameterPx) / sourceDiameterPx,
    collisionRadiusRatio: clampFinite(
      input.collisionRadiusRatio,
      DEFAULT_COLLISION_RADIUS_RATIO_BY_KIND[input.kind],
      0.01,
      4
    ),
    strokeWidthPx: input.strokeWidthPx
  };
}

function clampFinite(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numberValue));
}
