import { describe, expect, it, vi } from 'vitest';
import { runStartupNavigationHarness, type GameScenePreRunHarnessAdapter } from './gameScenePreRunHarness';
import type { GameFlowState, StarvivorsTestHarnessState } from './gameTypes';

describe('pre-run harness routing', () => {
  it('keeps startup navigation harness launches on direct startRun calls', () => {
    let flowState: GameFlowState = 'results';
    let harnessState = createHarnessState({
      resultsPanelTab: 'start',
      shopFlowState: 'results',
      activeEnemies: 4,
      arenaWidth: 640,
      fuel: 100,
      maxFuel: 100,
      runScrapTotal: 0
    });
    const startRun = vi.fn(() => {
      flowState = 'running';
      harnessState = createHarnessState({
        arenaWidth: 640,
        maxFuel: 100,
        isResultsScreenOpen: false
      });
    });
    const adapter: GameScenePreRunHarnessAdapter = {
      getGameFlowState: () => flowState,
      getHarnessState: () => harnessState,
      getOpenModuleCount: () => (flowState === 'running' ? 0 : 1),
      getTimeNow: () => 0,
      getDebugMenuOpenState: () => false,
      isShopOnlyModuleOpen: () => flowState === 'shop',
      isPlayerSceneActive: () => true,
      showStartScreen: () => {
        flowState = 'results';
        harnessState = createHarnessState({
          resultsPanelTab: 'start',
          shopFlowState: 'results',
          activeEnemies: 4,
          arenaWidth: 640,
          fuel: 100,
          maxFuel: 100,
          runScrapTotal: 0
        });
      },
      showShipSelect: () => {
        flowState = 'shipSelect';
        harnessState = createHarnessState({
          activeEnemies: 0,
          fuel: 100,
          maxFuel: 100,
          runScrapTotal: 0
        });
      },
      showShopFromMainMenu: () => {
        flowState = 'shop';
        harnessState = createHarnessState({ shopFlowState: 'shop' });
      },
      startRun,
      openDebugMenu: vi.fn(),
      closeDebugMenu: vi.fn()
    };

    runStartupNavigationHarness(adapter);

    expect(startRun).toHaveBeenCalledTimes(2);
  });
});

function createHarnessState(overrides: Partial<StarvivorsTestHarnessState>): StarvivorsTestHarnessState {
  return {
    resultsPanelTab: 'start',
    shopFlowState: 'results',
    activeEnemies: 0,
    arenaWidth: 0,
    fuel: 0,
    maxFuel: 0,
    runScrapTotal: 0,
    isResultsScreenOpen: false,
    ...overrides
  } as StarvivorsTestHarnessState;
}
