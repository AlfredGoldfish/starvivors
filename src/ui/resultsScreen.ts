import Phaser from 'phaser';
import {
  addScreenButton,
  drawCockpitBackdrop,
  drawCockpitDivider,
  drawCockpitPanel,
  UI_COLORS,
  UI_FONT,
  type ScreenHandle
} from './screenUi';

export interface ResultsScreenSection {
  title: string;
  lines: string[];
}

export interface ResultsScreenConfig {
  scene: Phaser.Scene;
  outcomeTitle: string;
  survivalTimeLabel: string;
  scrapCollected: number;
  scrapSpent: number;
  scrapConverted: number;
  creditsEarned: number;
  totalCredits: number;
  unlockedRewards: string[];
  contractName: string;
  contractStatus: string;
  runEndReason: string;
  scrapToCreditRate: number;
  scrapCreditMultiplier: number;
  summarySections: ResultsScreenSection[];
  isActionActive: () => boolean;
  resetCursor: () => void;
  onRestartRun: () => void;
  onMainMenu: () => void;
  onShop: () => void;
}

export function createResultsScreen(config: ResultsScreenConfig): ScreenHandle {
  const width = config.scene.scale.width;
  const height = config.scene.scale.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const panelWidth = Math.min(width - 48, 760);
  const panelHeight = Math.min(height - 48, 540);
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const buttonWidth = panelWidth < 620 ? 200 : 178;
  const buttonHeight = 38;
  const buttonGap = panelWidth < 620 ? 10 : 14;
  const buttonLabels = ['Restart Run', 'Main Menu', 'Shop'];
  const buttonsAreStacked = panelWidth < 620;
  const buttonStackHeight = buttonsAreStacked
    ? buttonLabels.length * buttonHeight + (buttonLabels.length - 1) * buttonGap
    : buttonHeight;
  const buttonTop = panelY + panelHeight - 26 - buttonStackHeight;
  const textTop = panelY + 26;
  const detailsWidth = panelWidth - 56;
  const actionZones: Phaser.GameObjects.Zone[] = [];

  const background = config.scene.add.graphics();
  drawCockpitBackdrop(background, width, height, 0.78);
  drawCockpitPanel(background, {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    accentColor: UI_COLORS.cyan,
    headerHeight: 72
  });
  drawCockpitDivider(background, panelX + 24, buttonTop - 18, panelX + panelWidth - 24, UI_COLORS.steel, 0.55);

  const titleText = config.scene.add
    .text(
      panelX + 28,
      textTop,
      `RUN REPORT\n${config.outcomeTitle}`,
      {
        fontFamily: UI_FONT,
        fontSize: height < 560 ? '16px' : '18px',
        color: '#f2fbff',
        align: 'left',
        fixedWidth: detailsWidth,
        lineSpacing: 5
      }
    )
    .setOrigin(0, 0);

  const allSections = [
    {
      title: 'Outcome',
      lines: [
        `Time ${config.survivalTimeLabel}`,
        `Ended ${config.runEndReason}`,
        `Mission ${config.contractName}`,
        `Status ${config.contractStatus}`
      ]
    },
    {
      title: 'Rewards',
      lines: [
        `Scrap collected ${config.scrapCollected}`,
        `Scrap spent ${config.scrapSpent}`,
        `Scrap converted ${config.scrapConverted}`,
        `Credits earned ${config.creditsEarned}`,
        `Total credits ${config.totalCredits}`,
        `Conversion ${config.scrapToCreditRate}:1 x${config.scrapCreditMultiplier.toFixed(2)}`
      ]
    },
    ...config.summarySections,
    {
      title: 'Unlocks',
      lines: [config.unlockedRewards.length > 0 ? config.unlockedRewards.join(', ') : 'None']
    }
  ];
  const columnCount = panelWidth >= 560 ? 2 : 1;
  const columnGap = 24;
  const columnWidth = columnCount === 2 ? (detailsWidth - columnGap) / 2 : detailsWidth;
  const sectionTop = panelY + 92;
  const sectionTexts: Phaser.GameObjects.Text[] = [];
  const columnHeights = new Array(columnCount).fill(sectionTop);
  const displayedSections = columnCount === 1
    ? allSections.map((section) => ({
        ...section,
        lines: section.lines.slice(0, 4)
      }))
    : allSections;

  displayedSections.forEach((section, index) => {
    const column = columnCount === 1 ? 0 : index % columnCount;
    const x = panelX + 28 + column * (columnWidth + columnGap);
    const y = columnHeights[column];
    const sectionText = config.scene.add
      .text(x, y, `${section.title.toUpperCase()}\n${section.lines.join('\n')}`, {
        fontFamily: UI_FONT,
        fontSize: height < 560 ? '11px' : '12px',
        color: '#f2fbff',
        fixedWidth: columnWidth,
        lineSpacing: 3,
        wordWrap: { width: columnWidth, useAdvancedWrap: true }
      })
      .setOrigin(0, 0);
    sectionText.setTint(index % 2 === 0 ? 0xf2fbff : 0xa8c7ff);
    sectionTexts.push(sectionText);
    columnHeights[column] += sectionText.height + 16;
  });

  const shortcutText = config.scene.add
    .text(panelX + 28, buttonTop - 13, 'R restart    Shop converts future runs and upgrades scanner/loadout paths', {
      fontFamily: UI_FONT,
      fontSize: '10px',
      color: '#a8c7ff',
      fixedWidth: detailsWidth,
      wordWrap: { width: detailsWidth, useAdvancedWrap: true }
    })
    .setOrigin(0, 1);

  const container = config.scene.add
    .container(centerX, centerY, [background, titleText, ...sectionTexts, shortcutText])
    .setScrollFactor(0)
    .setDepth(1250);

  const buttonX = (index: number) => buttonsAreStacked
    ? 0
    : (index - 1) * (buttonWidth + buttonGap);
  const buttonY = (index: number) => buttonsAreStacked
    ? buttonTop + index * (buttonHeight + buttonGap)
    : buttonTop;

  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: buttonX(0),
    y: buttonY(0),
    width: buttonWidth,
    height: buttonHeight,
    label: 'Restart Run',
    callback: config.onRestartRun,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: buttonX(1),
    y: buttonY(1),
    width: buttonWidth,
    height: buttonHeight,
    label: 'Main Menu',
    callback: config.onMainMenu,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });
  addScreenButton({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX: centerX,
    screenCenterY: centerY,
    x: buttonX(2),
    y: buttonY(2),
    width: buttonWidth,
    height: buttonHeight,
    label: 'Shop',
    callback: config.onShop,
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor
  });

  return { container, actionZones };
}
