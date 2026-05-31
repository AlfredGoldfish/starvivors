import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sceneSource = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'GameScene.ts'), 'utf8');

function getPrivateMethodBody(methodName: string): string {
  const marker = `private ${methodName}(`;
  const methodStart = sceneSource.indexOf(marker);
  expect(methodStart).toBeGreaterThanOrEqual(0);
  const bodyStart = sceneSource.indexOf('{', methodStart);
  expect(bodyStart).toBeGreaterThanOrEqual(methodStart);

  let depth = 0;
  for (let index = bodyStart; index < sceneSource.length; index += 1) {
    const char = sceneSource[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return sceneSource.slice(bodyStart + 1, index);
      }
    }
  }

  throw new Error(`Could not read ${methodName} body.`);
}

describe('GameScene death debrief gate', () => {
  it('makes the debrief button available without opening results automatically', () => {
    const body = getPrivateMethodBody('updateDeathDebriefGate');

    expect(body).toContain('this.isDebriefAvailable = true');
    expect(body).toContain('this.updateResultsButton()');
    expect(body).not.toContain('autoOpenDebriefOnDeath');
    expect(body).not.toContain('showResultsScreen');
  });
});
