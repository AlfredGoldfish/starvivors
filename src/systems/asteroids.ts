import { wrapCoordinate, type ArenaSize } from '../core/arena';
import type { BasicAsteroid } from '../scenes/gameTypes';

export interface UpdateBasicAsteroidsInput {
  arena: ArenaSize;
  asteroids: BasicAsteroid[];
  deltaSeconds: number;
  time: number;
  validateAsteroidRenderState: (asteroid: BasicAsteroid) => void;
  applyBlackHoleToAsteroid: (
    asteroid: BasicAsteroid,
    index: number,
    deltaSeconds: number,
    time: number
  ) => boolean;
  updateAsteroidWrapMirror: (asteroid: BasicAsteroid) => void;
}

export function updateBasicAsteroidRuntime(input: UpdateBasicAsteroidsInput): void {
  for (let i = input.asteroids.length - 1; i >= 0; i -= 1) {
    const asteroid = input.asteroids[i];
    input.validateAsteroidRenderState(asteroid);

    if (input.applyBlackHoleToAsteroid(asteroid, i, input.deltaSeconds, input.time)) {
      continue;
    }

    asteroid.body.x = wrapCoordinate(asteroid.body.x + asteroid.velocity.x * input.deltaSeconds, input.arena.width);
    asteroid.body.y = wrapCoordinate(asteroid.body.y + asteroid.velocity.y * input.deltaSeconds, input.arena.height);
    asteroid.body.rotation += asteroid.rotationSpeed * input.deltaSeconds;
    input.updateAsteroidWrapMirror(asteroid);
  }
}
