import { describe, expect, it, vi } from 'vitest';
import {
  cancelLaunchConfirmation,
  confirmLaunch,
  requestLaunchConfirmation,
  type LaunchConfirmationFlowAdapter
} from './gameSceneLaunchConfirmation';

describe('launch confirmation flow', () => {
  it('opens launch confirmation instead of starting the run from hub launch', () => {
    const adapter = createAdapter();

    requestLaunchConfirmation(adapter);

    expect(adapter.openConfirmationScreen).toHaveBeenCalledTimes(1);
    expect(adapter.startRun).not.toHaveBeenCalled();
  });

  it('starts the run when the launch confirmation is confirmed', () => {
    const adapter = createAdapter({ isOpen: true });

    confirmLaunch(adapter);

    expect(adapter.closeConfirmationScreen).toHaveBeenCalledTimes(1);
    expect(adapter.startRun).toHaveBeenCalledTimes(1);
  });

  it('cancels launch confirmation without changing the current hub state', () => {
    const adapter = createAdapter({ isOpen: true });
    const currentHubState = 'command';

    cancelLaunchConfirmation(adapter);

    expect(adapter.closeConfirmationScreen).toHaveBeenCalledTimes(1);
    expect(adapter.playBackCue).toHaveBeenCalledTimes(1);
    expect(adapter.startRun).not.toHaveBeenCalled();
    expect(adapter.showShipSelect).not.toHaveBeenCalled();
    expect(currentHubState).toBe('command');
  });

  it('routes blocked launch attempts to ship select instead of opening confirmation', () => {
    const adapter = createAdapter({ canStart: false });

    requestLaunchConfirmation(adapter);

    expect(adapter.showShipSelect).toHaveBeenCalledTimes(1);
    expect(adapter.openConfirmationScreen).not.toHaveBeenCalled();
    expect(adapter.startRun).not.toHaveBeenCalled();
  });
});

function createAdapter(options: { canStart?: boolean; isOpen?: boolean } = {}): LaunchConfirmationFlowAdapter {
  return {
    canStartConfiguredRun: vi.fn(() => options.canStart ?? true),
    showShipSelect: vi.fn(),
    openConfirmationScreen: vi.fn(),
    closeConfirmationScreen: vi.fn(),
    isConfirmationOpen: vi.fn(() => options.isOpen ?? false),
    startRun: vi.fn(),
    playBackCue: vi.fn()
  };
}
