type HarnessRunner = () => void;

export interface GameSceneHarnessAdapter {
  setCollisionDebugEnabled: (enabled: boolean) => void;
  startRun: () => void;
  runSmoke: HarnessRunner;
}

export function installGameSceneHarness(adapter: GameSceneHarnessAdapter): void {
  if (typeof window === 'undefined') {
    return;
  }

  const query = new URLSearchParams(window.location.search);
  adapter.setCollisionDebugEnabled(query.get('collisionDebug') === '1');

  if (query.get('testHarness') !== 'smoke') {
    return;
  }

  adapter.startRun();
  adapter.runSmoke();
}
