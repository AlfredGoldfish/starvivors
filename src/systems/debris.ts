import { wrapCoordinate, type ArenaSize } from '../core/arena';
import type { EnemyWreckageDebris } from '../scenes/gameTypes';

export interface UpdateEnemyWreckageDebrisInput {
  arena: ArenaSize;
  debris: EnemyWreckageDebris[];
  time: number;
  deltaSeconds: number;
  isPlayerDead: boolean;
  applyBlackHoleToDebris: (
    debris: EnemyWreckageDebris,
    deltaSeconds: number
  ) => boolean;
  updateToroidalRenderMirror: (
    body: Phaser.GameObjects.Container,
    wrapMirrorBody: Phaser.GameObjects.Container,
    viewRadius: number
  ) => void;
}

export function updateEnemyWreckageDebris(input: UpdateEnemyWreckageDebrisInput): EnemyWreckageDebris[] {
  if (input.isPlayerDead) {
    return input.debris;
  }

  const debris = [...input.debris];

  for (let i = debris.length - 1; i >= 0; i -= 1) {
    const piece = debris[i];

    if (input.applyBlackHoleToDebris(piece, input.deltaSeconds)) {
      debris.splice(i, 1);
      continue;
    }

    if (input.time >= piece.expiresAt) {
      destroyEnemyWreckageDebris(piece);
      debris.splice(i, 1);
      continue;
    }

    piece.body.x = wrapCoordinate(piece.body.x + piece.velocity.x * input.deltaSeconds, input.arena.width);
    piece.body.y = wrapCoordinate(piece.body.y + piece.velocity.y * input.deltaSeconds, input.arena.height);
    piece.body.rotation += piece.rotationSpeed * input.deltaSeconds;
    input.updateToroidalRenderMirror(piece.body, piece.wrapMirrorBody, piece.hitRadius);
  }

  return debris;
}

export function destroyEnemyWreckageDebris(debris: EnemyWreckageDebris | undefined): void {
  if (!debris) {
    return;
  }

  debris.body.destroy(true);
  debris.wrapMirrorBody.destroy(true);
}

export function clearEnemyWreckageDebris(debris: EnemyWreckageDebris[]): EnemyWreckageDebris[] {
  for (const piece of debris) {
    destroyEnemyWreckageDebris(piece);
  }

  return [];
}
