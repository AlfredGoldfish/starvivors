import type { GameFlowState, StarvivorsTestHarnessState } from './gameTypes';

export interface GameScenePreRunHarnessAdapter {
  getGameFlowState: () => GameFlowState;
  getHarnessState: () => StarvivorsTestHarnessState;
  getOpenModuleCount: () => number;
  getTimeNow: () => number;
  getDebugMenuOpenState: () => boolean | null;
  isShopOnlyModuleOpen: () => boolean;
  isPlayerSceneActive: () => boolean;
  showStartScreen: () => void;
  showShipSelect: () => void;
  showShopFromMainMenu: () => void;
  startRun: () => void;
  openDebugMenu: (now: number) => void;
  closeDebugMenu: (now: number) => void;
}

export function runDebugMenuHangarHarness(adapter: GameScenePreRunHarnessAdapter): void {
  const initialInputCount = getDebugNumberInputCount();

  adapter.showShipSelect();
  adapter.openDebugMenu(adapter.getTimeNow());
  const opened = adapter.getDebugMenuOpenState() ?? false;
  adapter.closeDebugMenu(adapter.getTimeNow());
  const closed = !(adapter.getDebugMenuOpenState() ?? true);

  adapter.openDebugMenu(adapter.getTimeNow());
  const openedBeforeRebuild = adapter.getDebugMenuOpenState() ?? false;
  const inputCountBeforeRebuild = getDebugNumberInputCount();
  adapter.showShipSelect();
  const closedAfterRebuild = !(adapter.getDebugMenuOpenState() ?? true);
  const inputCountAfterRebuild = getDebugNumberInputCount();

  adapter.openDebugMenu(adapter.getTimeNow());
  const reopened = adapter.getDebugMenuOpenState() ?? false;
  adapter.closeDebugMenu(adapter.getTimeNow());
  const closedAfterReopen = !(adapter.getDebugMenuOpenState() ?? true);
  const finalInputCount = getDebugNumberInputCount();

  const inputCountStable =
    initialInputCount > 0 &&
    inputCountBeforeRebuild === initialInputCount &&
    inputCountAfterRebuild === initialInputCount &&
    finalInputCount === initialInputCount;
  const pass = opened && closed && openedBeforeRebuild && closedAfterRebuild && reopened && closedAfterReopen && inputCountStable;

  setBodyAttribute('data-starvivors-debug-menu-hangar-harness', pass ? 'pass' : 'fail');
  setBodyAttribute(
    'data-starvivors-debug-menu-hangar-harness-details',
    JSON.stringify({
      opened,
      closed,
      openedBeforeRebuild,
      closedAfterRebuild,
      reopened,
      closedAfterReopen,
      initialInputCount,
      inputCountBeforeRebuild,
      inputCountAfterRebuild,
      finalInputCount,
      inputCountStable
    })
  );
}

export function runStartupNavigationHarness(adapter: GameScenePreRunHarnessAdapter): void {
  adapter.showStartScreen();
  const startState = adapter.getGameFlowState();
  const startHarnessState = adapter.getHarnessState();
  const startModuleCount = adapter.getOpenModuleCount();
  const startHasRunBackdrop =
    adapter.isPlayerSceneActive() &&
    startHarnessState.resultsPanelTab === 'start' &&
    startHarnessState.shopFlowState === 'results' &&
    startHarnessState.activeEnemies > 0 &&
    startHarnessState.arenaWidth > 0 &&
    startHarnessState.fuel === startHarnessState.maxFuel &&
    startHarnessState.runScrapTotal === 0;

  adapter.showShipSelect();
  const hangarState = adapter.getHarnessState();
  const hangarModuleCount = adapter.getOpenModuleCount();
  const hangarStaged =
    adapter.getGameFlowState() === 'shipSelect' &&
    adapter.isPlayerSceneActive() &&
    hangarState.activeEnemies === 0 &&
    hangarState.fuel === hangarState.maxFuel &&
    hangarState.runScrapTotal === 0;

  adapter.showShopFromMainMenu();
  const shopState = adapter.getHarnessState();
  const shopModuleCount = adapter.getOpenModuleCount();
  const shopReplacedHangar = adapter.getGameFlowState() === 'shop' && adapter.isShopOnlyModuleOpen();

  adapter.startRun();
  const moduleLaunchState = adapter.getHarnessState();
  const moduleLaunchStarted =
    adapter.getGameFlowState() === 'running' &&
    moduleLaunchState.arenaWidth > 0 &&
    moduleLaunchState.maxFuel > 0 &&
    !moduleLaunchState.isResultsScreenOpen;

  adapter.showStartScreen();
  adapter.startRun();
  const startLaunchState = adapter.getHarnessState();
  const startLaunchStarted = adapter.getGameFlowState() === 'running' && startLaunchState.arenaWidth > 0;

  const pass =
    startState === 'results' &&
    startHasRunBackdrop &&
    startModuleCount === 1 &&
    hangarStaged &&
    hangarModuleCount === 1 &&
    shopState.shopFlowState === 'shop' &&
    shopModuleCount === 1 &&
    shopReplacedHangar &&
    moduleLaunchStarted &&
    startLaunchStarted;

  setBodyAttribute('data-starvivors-startup-navigation-harness', pass ? 'pass' : 'fail');
  setBodyAttribute(
    'data-starvivors-startup-navigation-harness-details',
    JSON.stringify({
      startState,
      startHasRunBackdrop,
      startModuleCount,
      hangarStaged,
      hangarModuleCount,
      shopFlowState: shopState.shopFlowState,
      shopModuleCount,
      shopReplacedHangar,
      moduleLaunchStarted,
      startLaunchStarted
    })
  );
}

function getDebugNumberInputCount(): number {
  return typeof document === 'undefined' ? 0 : document.querySelectorAll('input[data-debug-key]').length;
}

function setBodyAttribute(name: string, value: string): void {
  if (typeof document !== 'undefined') {
    document.body.setAttribute(name, value);
  }
}
