import { describe, expect, it, vi } from 'vitest';
import { runVisualModuleHarness, type GameSceneVisualHarnessAdapter } from './gameSceneVisualHarness';

describe('visual module harness routing', () => {
  it('routes debrief module variants through staged debrief state', () => {
    const adapter = createAdapter();

    runVisualModuleHarness(adapter, 'debriefShop');

    expect(adapter.stageDebrief).toHaveBeenCalledTimes(1);
    expect(adapter.showResultsPanel).toHaveBeenCalledWith('shop');
  });

  it('routes start settings through the start screen before settings panel', () => {
    const adapter = createAdapter();

    runVisualModuleHarness(adapter, 'startSettings');

    expect(adapter.showStartScreen).toHaveBeenCalledTimes(1);
    expect(adapter.showResultsPanel).toHaveBeenCalledWith('settings');
  });

  it('routes pause settings through the pause settings hook', () => {
    const adapter = createAdapter();

    runVisualModuleHarness(adapter, 'pauseSettings');

    expect(adapter.openPauseSettings).toHaveBeenCalledTimes(1);
  });

  it('falls back to the start screen for unknown modules', () => {
    const adapter = createAdapter();

    runVisualModuleHarness(adapter, 'unknown');

    expect(adapter.showStartScreen).toHaveBeenCalledTimes(1);
  });
});

function createAdapter(): GameSceneVisualHarnessAdapter {
  return {
    showMainMenu: vi.fn(),
    showShipSelect: vi.fn(),
    showShopFromMainMenu: vi.fn(),
    showSettings: vi.fn(),
    showStartScreen: vi.fn(),
    showResultsPanel: vi.fn(),
    openPauseSettings: vi.fn(),
    stageDebrief: vi.fn()
  };
}
