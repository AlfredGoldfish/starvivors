import type { StarvivorsTestHarness } from './gameTypes';

type HarnessRunner = () => void;

export interface GameSceneHarnessAdapter {
  createHarness: () => StarvivorsTestHarness;
  setCollisionDebugEnabled: (enabled: boolean) => void;
  startRun: () => void;
  runHarnessSmoke: HarnessRunner;
  runHarnessBulwark: HarnessRunner;
  runHarnessRammingShield: HarnessRunner;
  runHarnessSecondaryWeapons: HarnessRunner;
  runHarnessWeaponHotbar: HarnessRunner;
  runHarnessPhase7: HarnessRunner;
  runHarnessPhase8: HarnessRunner;
  runHarnessPhase9: HarnessRunner;
  runHarnessPhase10: HarnessRunner;
  runHarnessPhase10_5: HarnessRunner;
  runHarnessPhase10_6: HarnessRunner;
  runHarnessPhase11: HarnessRunner;
  runHarnessPhase12: HarnessRunner;
  runHarnessPhase13: HarnessRunner;
  runHarnessPhase14: HarnessRunner;
  runHarnessPhase15A: HarnessRunner;
  runHarnessPhase15B: HarnessRunner;
  runHarnessPhase15_5: HarnessRunner;
  runHarnessUpgradeOverlayUi: HarnessRunner;
  runHarnessUpgradeOverlayNormalScreenshot: HarnessRunner;
  runHarnessUpgradeOverlayRareScreenshot: HarnessRunner;
  runHarnessBeamVisual: HarnessRunner;
  runHarnessBeamTipScreenshot: HarnessRunner;
  runHarnessResultsContinueFuel: HarnessRunner;
  runHarnessDebriefFlow: HarnessRunner;
  runHarnessAsteroidStaleDestroy: HarnessRunner;
  runHarnessEnemyContactBalance: HarnessRunner;
  runHarnessWorldImpactCleanup: HarnessRunner;
  runHarnessVelocityLimiter: HarnessRunner;
  runHarnessEnemyScaling: HarnessRunner;
  runHarnessDirectCombatNumbers: HarnessRunner;
  runHarnessHudMissionLog: HarnessRunner;
  runHarnessDebugMenuHangar: HarnessRunner;
  runHarnessShopTerminal: HarnessRunner;
  runHarnessStartupNavigation: HarnessRunner;
  runHarnessVisualModule: (moduleId: string | null) => void;
}

type HarnessId =
  | 'smoke'
  | 'bulwark'
  | 'rammingShield'
  | 'secondaryWeapons'
  | 'weaponHotbar'
  | 'phase7'
  | 'phase8'
  | 'phase9'
  | 'phase10'
  | 'phase10_5'
  | 'phase10_6'
  | 'phase11'
  | 'phase12'
  | 'phase13'
  | 'phase14'
  | 'phase15A'
  | 'phase15B'
  | 'phase15_5'
  | 'upgradeOverlayUi'
  | 'upgradeOverlayNormalScreenshot'
  | 'upgradeOverlayRareScreenshot'
  | 'beamVisual'
  | 'beamTipScreenshot'
  | 'resultsContinueFuel'
  | 'debriefFlow'
  | 'asteroidStaleDestroy'
  | 'enemyContactBalance'
  | 'worldImpactCleanup'
  | 'velocityLimiter'
  | 'enemyScaling'
  | 'directCombatNumbers'
  | 'hudMissionLog'
  | 'debugMenuHangar'
  | 'shopTerminal'
  | 'startupNavigation'
  | 'visualModule';

const HARNESS_RUNNERS: Record<HarnessId, (adapter: GameSceneHarnessAdapter) => void> = {
  smoke: (adapter) => {
    adapter.startRun();
    adapter.runHarnessSmoke();
  },
  bulwark: (adapter) => adapter.runHarnessBulwark(),
  rammingShield: (adapter) => adapter.runHarnessRammingShield(),
  secondaryWeapons: (adapter) => adapter.runHarnessSecondaryWeapons(),
  weaponHotbar: (adapter) => adapter.runHarnessWeaponHotbar(),
  phase7: (adapter) => adapter.runHarnessPhase7(),
  phase8: (adapter) => adapter.runHarnessPhase8(),
  phase9: (adapter) => adapter.runHarnessPhase9(),
  phase10: (adapter) => adapter.runHarnessPhase10(),
  phase10_5: (adapter) => adapter.runHarnessPhase10_5(),
  phase10_6: (adapter) => adapter.runHarnessPhase10_6(),
  phase11: (adapter) => adapter.runHarnessPhase11(),
  phase12: (adapter) => adapter.runHarnessPhase12(),
  phase13: (adapter) => adapter.runHarnessPhase13(),
  phase14: (adapter) => adapter.runHarnessPhase14(),
  phase15A: (adapter) => adapter.runHarnessPhase15A(),
  phase15B: (adapter) => adapter.runHarnessPhase15B(),
  phase15_5: (adapter) => adapter.runHarnessPhase15_5(),
  upgradeOverlayUi: (adapter) => adapter.runHarnessUpgradeOverlayUi(),
  upgradeOverlayNormalScreenshot: (adapter) => adapter.runHarnessUpgradeOverlayNormalScreenshot(),
  upgradeOverlayRareScreenshot: (adapter) => adapter.runHarnessUpgradeOverlayRareScreenshot(),
  beamVisual: (adapter) => adapter.runHarnessBeamVisual(),
  beamTipScreenshot: (adapter) => adapter.runHarnessBeamTipScreenshot(),
  resultsContinueFuel: (adapter) => adapter.runHarnessResultsContinueFuel(),
  debriefFlow: (adapter) => adapter.runHarnessDebriefFlow(),
  asteroidStaleDestroy: (adapter) => adapter.runHarnessAsteroidStaleDestroy(),
  enemyContactBalance: (adapter) => adapter.runHarnessEnemyContactBalance(),
  worldImpactCleanup: (adapter) => adapter.runHarnessWorldImpactCleanup(),
  velocityLimiter: (adapter) => adapter.runHarnessVelocityLimiter(),
  enemyScaling: (adapter) => {
    adapter.startRun();
    adapter.runHarnessEnemyScaling();
  },
  directCombatNumbers: (adapter) => {
    adapter.startRun();
    adapter.runHarnessDirectCombatNumbers();
  },
  hudMissionLog: (adapter) => {
    adapter.startRun();
    adapter.runHarnessHudMissionLog();
  },
  debugMenuHangar: (adapter) => adapter.runHarnessDebugMenuHangar(),
  shopTerminal: (adapter) => adapter.runHarnessShopTerminal(),
  startupNavigation: (adapter) => adapter.runHarnessStartupNavigation(),
  visualModule: (adapter) => {
    const query = new URLSearchParams(window.location.search);
    adapter.runHarnessVisualModule(query.get('module'));
  }
};

export function installGameSceneHarness(adapter: GameSceneHarnessAdapter): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.starvivorsTestHarness = adapter.createHarness();

  const query = new URLSearchParams(window.location.search);
  adapter.setCollisionDebugEnabled(query.get('collisionDebug') === '1');

  const harnessId = query.get('testHarness');
  if (!isHarnessId(harnessId)) {
    return;
  }

  HARNESS_RUNNERS[harnessId](adapter);
}

function isHarnessId(value: string | null): value is HarnessId {
  return Boolean(value && value in HARNESS_RUNNERS);
}
