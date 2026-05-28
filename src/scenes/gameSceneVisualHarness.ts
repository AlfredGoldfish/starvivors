import type { ResultsPanelTab } from './gameTypes';

export interface GameSceneVisualHarnessAdapter {
  showMainMenu: () => void;
  showShipSelect: () => void;
  showShopFromMainMenu: () => void;
  showSettings: () => void;
  showSoundSettings: () => void;
  showStartScreen: () => void;
  showResultsPanel: (tab: ResultsPanelTab) => void;
  openPauseSettings: () => void;
  openPauseSoundSettings: () => void;
  stageDebrief: () => void;
}

export function runVisualModuleHarness(adapter: GameSceneVisualHarnessAdapter, moduleId: string | null): void {
  switch (moduleId) {
    case 'command':
      adapter.showMainMenu();
      break;
    case 'hangar':
      adapter.showShipSelect();
      break;
    case 'shop':
      adapter.showShopFromMainMenu();
      break;
    case 'settings':
      adapter.showSettings();
      break;
    case 'settingsSound':
      adapter.showSoundSettings();
      break;
    case 'debrief':
      adapter.stageDebrief();
      adapter.showResultsPanel('debrief');
      break;
    case 'debriefShop':
      adapter.stageDebrief();
      adapter.showResultsPanel('shop');
      break;
    case 'debriefHangar':
      adapter.stageDebrief();
      adapter.showResultsPanel('hangar');
      break;
    case 'debriefCommand':
      adapter.stageDebrief();
      adapter.showResultsPanel('command');
      break;
    case 'debriefSettings':
      adapter.stageDebrief();
      adapter.showResultsPanel('settings');
      break;
    case 'startSettings':
      adapter.showStartScreen();
      adapter.showResultsPanel('settings');
      break;
    case 'pauseSettings':
      adapter.openPauseSettings();
      break;
    case 'pauseSoundSettings':
      adapter.openPauseSoundSettings();
      break;
    case 'start':
    default:
      adapter.showStartScreen();
      break;
  }
}
