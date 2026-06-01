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

describe('GameScene run-end debrief gate', () => {
  it('makes the debrief button available and auto-opens only when the setting allows it', () => {
    const body = getPrivateMethodBody('updateDeathDebriefGate');

    expect(body).toContain('updateDeathSequence');
    expect(body).toContain('this.updateResultsButton()');
    expect(body).toContain('this.gameSettings.autoOpenDebriefOnDeath');
    expect(body).toContain('this.showResultsScreen()');
  });

  it('does not open debrief from the immediate player death path', () => {
    const killPlayerBody = getPrivateMethodBody('killPlayer');

    expect(killPlayerBody).toContain('startDeathSequence');
    expect(killPlayerBody).not.toContain('showResultsScreen');
  });

  it('delays eject debrief and schedules the run-end shockwave', () => {
    const completeEjectRunBody = getPrivateMethodBody('completeEjectRun');

    expect(completeEjectRunBody).toContain('startDeathSequence');
    expect(completeEjectRunBody).toContain('schedulePlayerDeathShockwave');
    expect(completeEjectRunBody).not.toContain("this.gameFlowState = 'results'");
    expect(completeEjectRunBody).not.toContain('showResultsScreen');
  });

  it('does not install browser query test harnesses in the game scene', () => {
    expect(sceneSource).not.toContain('installGameSceneHarness');
    expect(sceneSource).not.toContain('installTestHarness');
    expect(sceneSource).not.toContain('runTestHarnessSmoke');
    expect(sceneSource).not.toContain('data-starvivors-harness');
  });

  it('lets testShip select a ship without forcing the smoke harness', () => {
    const body = getPrivateMethodBody('applyConfiguredTestShipOverride');

    expect(body).toContain("query.get('testShip')");
    expect(body).not.toContain("query.get('testHarness')");
  });
});
