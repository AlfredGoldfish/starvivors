import Phaser from 'phaser';
import {
  drawCockpitDivider,
  UI_COLORS,
  UI_FONT,
  type ScreenHandle
} from './screenUi';
import { drawCockpitCard } from './cockpitCard';
import { addPreRunNav, drawPreRunPanelWindow, getPreRunModuleLayout, type PreRunNavConfig } from './preRunHubScreen';

export interface ResultsScreenSection {
  title: string;
  lines: string[];
}

export interface ResultsBreakdownEntry {
  label: string;
  value: number;
}

export interface ResultsCombatStats {
  damageDoneTotal: number;
  damageTakenTotal: number;
  healingDoneTotal: number;
  healingReceivedTotal: number;
  shieldDamageBlocked: number;
  highestHit: number;
  finalDamageSource: string;
  finalDamageAmount: number;
  damageDoneBySource: ResultsBreakdownEntry[];
  damageTakenBySource: ResultsBreakdownEntry[];
  healingBySource: ResultsBreakdownEntry[];
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
  combatStats: ResultsCombatStats;
  isActionActive: () => boolean;
  resetCursor: () => void;
  onRestartRun: () => void;
  onMainMenu: () => void;
  onHangar: () => void;
  onShop: () => void;
  onSettings: () => void;
}

export interface StartResultsScreenConfig {
  scene: Phaser.Scene;
  nav: Omit<PreRunNavConfig, 'scene' | 'container' | 'actionZones' | 'activeTab'>;
}

interface LocalCard {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  accentColor: number;
}

interface RunClosureSummary {
  text: string;
  color: string;
}

interface ScrollableCardBodyConfig {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  actionZones: Phaser.GameObjects.Zone[];
  screenCenterX: number;
  screenCenterY: number;
  card: LocalCard;
  contentTop: number;
  paddingX: number;
  paddingBottom: number;
  accentColor: number;
  buildContent: (content: Phaser.GameObjects.Container, contentWidth: number) => number;
}

const SCROLLBAR_WIDTH = 5;
const SCROLLBAR_GUTTER = 11;
const SCROLL_WHEEL_SPEED = 0.62;

export function createStartResultsScreen(config: StartResultsScreenConfig): ScreenHandle {
  const { width, height, screenCenterX, screenCenterY, moduleCenterX, moduleCenterY } = getPreRunModuleLayout(config.scene);
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = config.scene.add.graphics();

  drawPreRunPanelWindow(background, width, height);

  const header = config.scene.add
    .text(-moduleCenterX + 42, -moduleCenterY + 24, 'START', {
      fontFamily: UI_FONT,
      fontSize: '24px',
      color: '#f2fbff',
      align: 'left'
    })
    .setOrigin(0, 0);

  const container = config.scene.add.container(screenCenterX, screenCenterY, [background, header]).setScrollFactor(0).setDepth(1300);
  const panelX = -moduleCenterX + 34;
  const panelY = -moduleCenterY + 88;
  const panelWidth = width - 68;
  const panelBottom = moduleCenterY - 98;
  const panelHeight = Math.max(260, panelBottom - panelY);

  drawCockpitCard(background, panelX, panelY, panelWidth, panelHeight, {
    accentColor: UI_COLORS.brass,
    glow: true
  });

  const title = config.scene.add
    .text(panelX + panelWidth / 2, panelY + panelHeight / 2, 'Starvivors', {
      fontFamily: UI_FONT,
      fontSize: width < 720 ? '40px' : '56px',
      color: '#f2fbff',
      align: 'center',
      fixedWidth: panelWidth - 44
    })
    .setOrigin(0.5);
  container.add(title);

  addPreRunNav({ ...config.nav, scene: config.scene, container, actionZones, activeTab: 'start' });

  return { container, actionZones };
}

export function createResultsScreen(config: ResultsScreenConfig): ScreenHandle {
  const { width, height, screenCenterX, screenCenterY, moduleCenterX, moduleCenterY } = getPreRunModuleLayout(config.scene);
  const panelWidth = width;
  const panelHeight = height;
  const panelX = -panelWidth / 2;
  const panelY = -panelHeight / 2;
  const panelPaddingX = 28;
  const contentX = panelX + panelPaddingX;
  const contentY = panelY + 20;
  const contentWidth = panelWidth - panelPaddingX * 2;
  const actionZones: Phaser.GameObjects.Zone[] = [];
  const background = config.scene.add.graphics();
  const container = config.scene.add.container(screenCenterX, screenCenterY).setScrollFactor(0).setDepth(1300);
  resetResultsScrollDebugState();

  drawPreRunPanelWindow(background, panelWidth, panelHeight);
  container.add(background);

  const closureSummary = getRunClosureSummary(config);
  const titleText = config.scene.add
    .text(contentX, contentY, `RUN DEBRIEF\n${config.outcomeTitle}`, {
      fontFamily: UI_FONT,
      fontSize: height < 600 ? '15px' : '17px',
      color: '#f2fbff',
      fixedWidth: contentWidth * 0.52,
      lineSpacing: 5
    })
    .setOrigin(0, 0);
  container.add(titleText);
  const causeText = config.scene.add
    .text(
      contentX + contentWidth * 0.55,
      contentY + 2,
      closureSummary.text,
      {
        fontFamily: UI_FONT,
        fontSize: '12px',
        color: closureSummary.color,
        align: 'right',
        fixedWidth: contentWidth * 0.45,
        lineSpacing: 3
      }
    )
    .setOrigin(0, 0);
  container.add(causeText);

  const gap = 16;
  const topY = panelY + 94;
  const gridBottom = panelY + panelHeight - 98;
  const cardSpaceHeight = Math.max(0, gridBottom - topY - gap * 2);
  const minimumCardSpaceHeight = 304;
  const heightScale = Math.min(1, cardSpaceHeight / 460);
  const compactScale = Math.min(1, cardSpaceHeight / minimumCardSpaceHeight);
  const cardHeightTop =
    cardSpaceHeight < minimumCardSpaceHeight ? 96 * compactScale : Phaser.Math.Clamp(136 * heightScale, 96, 136);
  const cardWidthHalf = (contentWidth - gap) / 2;
  const thirdWidth = (contentWidth - gap * 2) / 3;
  const middleY = topY + cardHeightTop + gap;
  const middleHeight =
    cardSpaceHeight < minimumCardSpaceHeight ? 116 * compactScale : Phaser.Math.Clamp(188 * heightScale, 116, 188);
  const bottomY = middleY + middleHeight + gap;
  const bottomHeight =
    cardSpaceHeight < minimumCardSpaceHeight ? Math.max(0, gridBottom - bottomY) : Math.max(92, gridBottom - bottomY);

  drawTextCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX,
    y: topY,
    width: cardWidthHalf,
    height: cardHeightTop,
    title: 'Summary',
    accentColor: UI_COLORS.cyan
  }, [
    `Survived ${config.survivalTimeLabel}`,
    `Ended ${config.runEndReason}`,
    `Mission ${config.contractName}`,
    `Status ${config.contractStatus}`,
    `Blocked ${formatInteger(config.combatStats.shieldDamageBlocked)} shield damage`
  ]);

  drawTextCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX + cardWidthHalf + gap,
    y: topY,
    width: cardWidthHalf,
    height: cardHeightTop,
    title: 'Rewards',
    accentColor: UI_COLORS.brass
  }, [
    `Scrap collected ${formatInteger(config.scrapCollected)}`,
    `Scrap spent ${formatInteger(config.scrapSpent)}`,
    `Converted ${formatInteger(config.scrapConverted)} at ${config.scrapToCreditRate}:1 x${config.scrapCreditMultiplier.toFixed(2)}`,
    `Credits earned ${formatInteger(config.creditsEarned)}`,
    `Total credits ${formatInteger(config.totalCredits)}`
  ]);

  drawBreakdownCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX,
    y: middleY,
    width: thirdWidth,
    height: middleHeight,
    title: 'Damage Done',
    accentColor: UI_COLORS.cyan
  }, config.combatStats.damageDoneTotal, config.combatStats.damageDoneBySource);

  drawBreakdownCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX + thirdWidth + gap,
    y: middleY,
    width: thirdWidth,
    height: middleHeight,
    title: 'Damage Taken',
    accentColor: UI_COLORS.warning
  }, config.combatStats.damageTakenTotal, config.combatStats.damageTakenBySource);

  drawBreakdownCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX + (thirdWidth + gap) * 2,
    y: middleY,
    width: thirdWidth,
    height: middleHeight,
    title: 'Healing',
    accentColor: 0x52ff9a
  }, Math.max(config.combatStats.healingDoneTotal, config.combatStats.healingReceivedTotal), config.combatStats.healingBySource);

  const build = config.summarySections.find((section) => section.title === 'Build')?.lines ?? [];
  const upgrades = config.summarySections.find((section) => section.title === 'Upgrades')?.lines ?? [];
  const sector = config.summarySections.find((section) => section.title === 'Sector')?.lines ?? [];
  drawTextCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX,
    y: bottomY,
    width: thirdWidth,
    height: bottomHeight,
    title: 'Build',
    accentColor: UI_COLORS.plasma
  }, build);
  drawTextCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX + thirdWidth + gap,
    y: bottomY,
    width: thirdWidth,
    height: bottomHeight,
    title: 'Upgrades',
    accentColor: UI_COLORS.magenta
  }, upgrades);
  drawTextCard(config, container, background, actionZones, screenCenterX, screenCenterY, {
    x: contentX + (thirdWidth + gap) * 2,
    y: bottomY,
    width: thirdWidth,
    height: bottomHeight,
    title: 'Sector / Unlocks',
    accentColor: UI_COLORS.steel
  }, [
    ...sector,
    `Unlocks ${config.unlockedRewards.length > 0 ? config.unlockedRewards.join(', ') : 'None'}`
  ]);

  drawCockpitDivider(background, contentX, panelY + panelHeight - 74, contentX + contentWidth, UI_COLORS.steel, 0.48);
  addPreRunNav({
    scene: config.scene,
    container,
    actionZones,
    activeTab: 'debrief',
    canPlay: true,
    playDisabledReason: 'LAUNCH',
    isActionActive: config.isActionActive,
    resetCursor: config.resetCursor,
    onPlay: config.onRestartRun,
    onShowCommand: config.onMainMenu,
    onShowHangar: config.onHangar,
    onShowShop: config.onShop,
    onShowSettings: config.onSettings
  });

  return { container, actionZones };
}

function getRunClosureSummary(config: ResultsScreenConfig): RunClosureSummary {
  switch (config.runEndReason) {
    case 'Destroyed':
      return {
        text: `DESTROYED BY\n${config.combatStats.finalDamageSource}\nFinal hit ${formatInteger(config.combatStats.finalDamageAmount)} damage`,
        color: '#ffb0b8'
      };
    case 'Ejected':
      return {
        text: `EJECTION COMPLETE\nCargo converted at debrief\nContract ${config.contractStatus}`,
        color: '#fff0a0'
      };
    case 'Mission complete':
      return {
        text: 'CONTRACT COMPLETE\nObjective secured\nCargo converted at debrief',
        color: '#9dffc2'
      };
    default:
      return {
        text: `RUN OPEN\nContract ${config.contractStatus}\nCargo still aboard`,
        color: '#c8f7ff'
      };
  }
}

function drawTextCard(
  config: ResultsScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  screenCenterX: number,
  screenCenterY: number,
  card: LocalCard,
  lines: string[]
): void {
  drawCardBase(config, container, graphics, card);
  const safeLines = lines.length > 0 ? lines : ['None'];

  createScrollableCardBody({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX,
    screenCenterY,
    card,
    contentTop: 38,
    paddingX: 16,
    paddingBottom: 12,
    accentColor: card.accentColor,
    buildContent: (content, contentWidth) => {
      const text = config.scene.add
        .text(0, 0, safeLines.join('\n'), {
          fontFamily: UI_FONT,
          fontSize: config.scene.scale.height < 620 ? '10px' : '11px',
          color: '#f2fbff',
          fixedWidth: contentWidth,
          lineSpacing: 3,
          wordWrap: { width: contentWidth, useAdvancedWrap: true }
        })
        .setOrigin(0, 0);
      content.add(text);
      return text.height;
    }
  });
}

function drawBreakdownCard(
  config: ResultsScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  actionZones: Phaser.GameObjects.Zone[],
  screenCenterX: number,
  screenCenterY: number,
  card: LocalCard,
  total: number,
  entries: ResultsBreakdownEntry[]
): void {
  drawCardBase(config, container, graphics, card);
  const contentX = card.x + 14;
  const barWidth = card.width - 28 - SCROLLBAR_GUTTER;
  const totalText = config.scene.add
    .text(contentX, card.y + 38, `Total ${formatInteger(total)}`, {
      fontFamily: UI_FONT,
      fontSize: '11px',
      color: '#c8f7ff',
      fixedWidth: barWidth
    })
    .setOrigin(0, 0);
  container.add(totalText);

  createScrollableCardBody({
    scene: config.scene,
    container,
    actionZones,
    screenCenterX,
    screenCenterY,
    card,
    contentTop: 60,
    paddingX: 14,
    paddingBottom: 12,
    accentColor: card.accentColor,
    buildContent: (content, contentWidth) => {
      const safeEntries = entries.length > 0 ? entries : [{ label: 'No data', value: 0 }];
      const contentGraphics = config.scene.add.graphics();
      const barHeight = 10;
      let y = 0;
      content.add(contentGraphics);

      for (const entry of safeEntries) {
        const percent = total > 0 ? Phaser.Math.Clamp(entry.value / total, 0, 1) : 0;
        contentGraphics.fillStyle(0x02040a, 0.74);
        contentGraphics.fillRect(0, y + 16, contentWidth, barHeight);
        contentGraphics.fillStyle(card.accentColor, entry.value > 0 ? 0.76 : 0.18);
        contentGraphics.fillRect(0, y + 16, contentWidth * percent, barHeight);
        contentGraphics.lineStyle(1, card.accentColor, 0.34);
        contentGraphics.strokeRect(0, y + 16, contentWidth, barHeight);

        const label =
          entry.label === 'No data'
            ? entry.label
            : `${entry.label} ${formatInteger(entry.value)} ${Math.round(percent * 100)}%`;
        const rowText = config.scene.add
          .text(0, y, label, {
            fontFamily: UI_FONT,
            fontSize: '10px',
            color: '#f2fbff',
            fixedWidth: contentWidth,
            wordWrap: { width: contentWidth, useAdvancedWrap: true }
          })
          .setOrigin(0, 0);
        content.add(rowText);
        y += Math.max(32, rowText.height + 18);
      }

      return y;
    }
  });
}

function drawCardBase(
  config: ResultsScreenConfig,
  container: Phaser.GameObjects.Container,
  graphics: Phaser.GameObjects.Graphics,
  card: LocalCard
): void {
  drawCockpitCard(graphics, card.x, card.y, card.width, card.height, {
    accentColor: card.accentColor,
    glow: false,
    dividerOffsets: [30]
  });
  graphics.fillStyle(card.accentColor, 0.16);
  graphics.fillRect(card.x + 10, card.y + 10, card.width - 20, 18);
  const title = config.scene.add
    .text(card.x + 16, card.y + 10, card.title.toUpperCase(), {
      fontFamily: UI_FONT,
      fontSize: '11px',
      color: '#73f2ff'
    })
    .setOrigin(0, 0);
  container.add(title);
}

function createScrollableCardBody(config: ScrollableCardBodyConfig): void {
  const viewportX = config.card.x + config.paddingX;
  const viewportY = config.card.y + config.contentTop;
  const viewportWidth = Math.max(24, config.card.width - config.paddingX * 2 - SCROLLBAR_GUTTER);
  const viewportHeight = Math.max(20, config.card.height - config.contentTop - config.paddingBottom);
  const content = config.scene.add.container(viewportX, viewportY);
  const maskShape = config.scene.add.graphics();
  const scrollbar = config.scene.add.graphics();

  maskShape.fillStyle(0xffffff, 1);
  maskShape.fillRect(
    config.screenCenterX + viewportX,
    config.screenCenterY + viewportY,
    viewportWidth + 2,
    viewportHeight
  );
  maskShape.setScrollFactor(0).setAlpha(0);
  config.container.add([content, scrollbar]);
  content.setMask(maskShape.createGeometryMask());
  config.container.once('destroy', () => maskShape.destroy());

  const contentHeight = Math.max(0, config.buildContent(content, viewportWidth));
  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  const hasOverflow = maxScroll > 1;
  const trackX = config.card.x + config.card.width - 14;
  const trackY = viewportY;
  const trackHeight = viewportHeight;
  const thumbHeight = hasOverflow
    ? Phaser.Math.Clamp((viewportHeight / Math.max(contentHeight, 1)) * trackHeight, 18, trackHeight)
    : trackHeight;
  const maxThumbTravel = Math.max(1, trackHeight - thumbHeight);
  const maxScrollScale = maxScroll / maxThumbTravel;
  let scrollY = 0;
  let draggingBody = false;
  let draggingThumb = false;
  let lastPointerY = 0;

  const setScroll = (nextScrollY: number): void => {
    scrollY = Phaser.Math.Clamp(nextScrollY, 0, maxScroll);
    content.y = viewportY - scrollY;
    renderScrollbar();
  };

  const renderScrollbar = (): void => {
    scrollbar.clear();
    if (!hasOverflow) {
      return;
    }

    const thumbY = trackY + (scrollY / Math.max(maxScroll, 1)) * maxThumbTravel;
    scrollbar.fillStyle(0x02040a, 0.68);
    scrollbar.fillRect(trackX, trackY, SCROLLBAR_WIDTH, trackHeight);
    scrollbar.lineStyle(1, UI_COLORS.brass, 0.36);
    scrollbar.strokeRect(trackX - 1, trackY, SCROLLBAR_WIDTH + 2, trackHeight);
    scrollbar.fillStyle(config.accentColor, 0.78);
    scrollbar.fillRect(trackX + 1, thumbY, SCROLLBAR_WIDTH - 2, thumbHeight);
    scrollbar.fillStyle(UI_COLORS.brass, 0.72);
    scrollbar.fillRect(trackX, thumbY, SCROLLBAR_WIDTH, 2);
    scrollbar.fillRect(trackX, thumbY + thumbHeight - 2, SCROLLBAR_WIDTH, 2);
  };

  const isPointerOverViewport = (pointer: Phaser.Input.Pointer): boolean => {
    const x = pointer.x - config.screenCenterX;
    const y = pointer.y - config.screenCenterY;
    return (
      x >= viewportX &&
      x <= config.card.x + config.card.width - 8 &&
      y >= viewportY &&
      y <= viewportY + viewportHeight
    );
  };

  const isPointerOverThumb = (pointer: Phaser.Input.Pointer): boolean => {
    if (!hasOverflow) {
      return false;
    }

    const x = pointer.x - config.screenCenterX;
    const y = pointer.y - config.screenCenterY;
    const thumbY = trackY + (scrollY / Math.max(maxScroll, 1)) * maxThumbTravel;
    return (
      x >= trackX - 5 &&
      x <= trackX + SCROLLBAR_WIDTH + 5 &&
      y >= thumbY - 3 &&
      y <= thumbY + thumbHeight + 3
    );
  };

  const onWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void => {
    if (!hasOverflow || !isPointerOverViewport(pointer)) {
      return;
    }

    pointer.event?.stopPropagation();
    setScroll(scrollY + deltaY * SCROLL_WHEEL_SPEED);
  };

  const onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!draggingBody && !draggingThumb) {
      return;
    }

    pointer.event?.stopPropagation();
    const deltaY = pointer.y - lastPointerY;
    lastPointerY = pointer.y;
    if (draggingThumb) {
      setScroll(scrollY + deltaY * maxScrollScale);
      return;
    }

    setScroll(scrollY - deltaY);
  };

  const onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!draggingBody && !draggingThumb) {
      return;
    }

    pointer.event?.stopPropagation();
    draggingBody = false;
    draggingThumb = false;
  };

  const zone = config.scene.add
    .zone(
      config.screenCenterX + viewportX,
      config.screenCenterY + viewportY,
      config.card.width - config.paddingX * 2,
      viewportHeight
    )
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(1300)
    .setInteractive()
    .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      if (!hasOverflow || !isPointerOverViewport(pointer)) {
        return;
      }

      lastPointerY = pointer.y;
      draggingThumb = isPointerOverThumb(pointer);
      draggingBody = !draggingThumb;
    })
    .on('pointerup', onPointerUp)
    .on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (!draggingBody && !draggingThumb) {
        return;
      }

      pointer.event?.stopPropagation();
    });

  config.scene.input.on('wheel', onWheel);
  config.scene.input.on('pointermove', onPointerMove);
  config.scene.input.on('pointerup', onPointerUp);
  zone.once('destroy', () => {
    config.scene.input.off('wheel', onWheel);
    config.scene.input.off('pointermove', onPointerMove);
    config.scene.input.off('pointerup', onPointerUp);
  });
  config.actionZones.push(zone);
  setScroll(0);
  recordResultsScrollDebugState(config.card.title, {
    contentHeight,
    viewportHeight,
    overflow: hasOverflow
  });
}

function resetResultsScrollDebugState(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.body.setAttribute('data-starvivors-results-scroll-state', '{}');
}

function recordResultsScrollDebugState(
  title: string,
  state: { contentHeight: number; viewportHeight: number; overflow: boolean }
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const attr = document.body.getAttribute('data-starvivors-results-scroll-state') ?? '{}';
  let parsed: Record<string, { contentHeight: number; viewportHeight: number; overflow: boolean }> = {};
  try {
    parsed = JSON.parse(attr) as Record<string, { contentHeight: number; viewportHeight: number; overflow: boolean }>;
  } catch {
    parsed = {};
  }
  parsed[title] = {
    contentHeight: Math.round(state.contentHeight),
    viewportHeight: Math.round(state.viewportHeight),
    overflow: state.overflow
  };
  document.body.setAttribute('data-starvivors-results-scroll-state', JSON.stringify(parsed));
}

function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}
