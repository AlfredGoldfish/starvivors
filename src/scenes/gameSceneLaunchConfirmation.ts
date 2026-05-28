export interface LaunchConfirmationFlowAdapter {
  canStartConfiguredRun: () => boolean;
  showShipSelect: () => void;
  openConfirmationScreen: () => void;
  closeConfirmationScreen: () => void;
  isConfirmationOpen: () => boolean;
  startRun: () => void;
  playBackCue: () => void;
}

export function requestLaunchConfirmation(adapter: LaunchConfirmationFlowAdapter): void {
  if (!adapter.canStartConfiguredRun()) {
    adapter.showShipSelect();
    return;
  }

  adapter.openConfirmationScreen();
}

export function confirmLaunch(adapter: LaunchConfirmationFlowAdapter): void {
  if (!adapter.isConfirmationOpen()) {
    return;
  }

  adapter.closeConfirmationScreen();
  adapter.startRun();
}

export function cancelLaunchConfirmation(adapter: LaunchConfirmationFlowAdapter): void {
  if (!adapter.isConfirmationOpen()) {
    return;
  }

  adapter.closeConfirmationScreen();
  adapter.playBackCue();
}
