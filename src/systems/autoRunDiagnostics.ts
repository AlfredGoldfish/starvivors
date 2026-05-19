import { getDesktopBridge, saveDesktopTextFile } from './desktopBridge';
import type {
  PerformanceProfilerCounts,
  PerformanceProfilerFrame,
  PerformanceProfilerSummary,
  PerformanceProfilerSystem
} from './performanceProfiler';

export interface AutoRunDiagnosticsRunState {
  selectedShipName: string;
  runTimeSeconds: number;
  playerHull: number;
  playerMaxHull: number;
  playerXp: number;
  bankedUpgrades: number;
  runScrapTotal: number;
  totalCredits: number;
  activeWeaponName: string;
  mainWeaponUpgradeSummary: string;
  counts: PerformanceProfilerCounts;
}

export interface AutoRunDiagnosticsConfig {
  getRunState: () => AutoRunDiagnosticsRunState;
  getProfiler: () => PerformanceProfilerSystem;
  getTimeMs: () => number;
}

interface DiagnosticsEvent {
  timeMs: number;
  type: string;
  message: string;
  data?: unknown;
}

interface DiagnosticsError {
  timeMs: number;
  source: string;
  message: string;
  stack?: string;
}

const AUTO_REPORT_INTERVAL_MS = 3 * 60 * 1000;

export class AutoRunDiagnosticsSystem {
  private readonly getRunState: () => AutoRunDiagnosticsRunState;
  private readonly getProfiler: () => PerformanceProfilerSystem;
  private readonly getTimeMs: () => number;
  private enabled = false;
  private active = false;
  private runId = '';
  private reportIndex = 0;
  private runStartedAt = 0;
  private nextReportAt = 0;
  private events: DiagnosticsEvent[] = [];
  private errors: DiagnosticsError[] = [];
  private installedGlobalHandlers = false;

  constructor(config: AutoRunDiagnosticsConfig) {
    this.getRunState = config.getRunState;
    this.getProfiler = config.getProfiler;
    this.getTimeMs = config.getTimeMs;
    this.enabled = Boolean(getDesktopBridge());
  }

  installGlobalHandlers(): void {
    if (this.installedGlobalHandlers || typeof window === 'undefined') {
      return;
    }

    this.installedGlobalHandlers = true;
    window.addEventListener('error', (event) => {
      this.recordError('renderer-error', event.message, event.error instanceof Error ? event.error.stack : undefined);
    });
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.recordError(
        'unhandled-rejection',
        reason instanceof Error ? reason.message : String(reason),
        reason instanceof Error ? reason.stack : undefined
      );
    });
  }

  isDesktopAvailable(): boolean {
    return Boolean(getDesktopBridge());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isActive(): boolean {
    return this.active;
  }

  getCurrentRunId(): string {
    return this.runId;
  }

  setEnabled(enabled: boolean): void {
    const nextEnabled = enabled && this.isDesktopAvailable();

    if (!nextEnabled && this.active) {
      this.endRun('diagnostics-disabled');
    }

    this.enabled = nextEnabled;
  }

  toggleEnabled(): void {
    this.setEnabled(!this.enabled);
  }

  startRun(selectedShipName: string): void {
    this.active = this.enabled && this.isDesktopAvailable();
    this.runStartedAt = this.getTimeMs();
    this.nextReportAt = this.runStartedAt + AUTO_REPORT_INTERVAL_MS;
    this.reportIndex = 0;
    this.events = [];
    this.errors = [];
    this.runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${slugify(selectedShipName)}`;
    this.getProfiler().setEnabled(this.active || this.getProfiler().isEnabled());
    this.getProfiler().createDiagnosticsSnapshot(true);
    this.recordEvent('run-start', `Run started with ${selectedShipName}.`);
  }

  update(): void {
    if (!this.active || this.getTimeMs() < this.nextReportAt) {
      return;
    }

    this.writeIntervalReport('auto');
    this.nextReportAt += AUTO_REPORT_INTERVAL_MS;
  }

  writeManualReport(): void {
    if (!this.active) {
      return;
    }

    this.writeIntervalReport('manual');
  }

  endRun(outcome: string): void {
    if (!this.active) {
      return;
    }

    this.recordEvent('run-end', `Run ended: ${outcome}.`);
    this.writeIntervalReport('final-interval');
    this.writeRunSummary(outcome);
    this.writeEvents();
    this.writeErrors();
    this.active = false;
  }

  recordEvent(type: string, message: string, data?: unknown): void {
    if (!this.active && type !== 'run-start') {
      return;
    }

    this.events.push({
      timeMs: Math.round(this.getTimeMs()),
      type,
      message,
      data
    });
  }

  recordError(source: string, message: string, stack?: string): void {
    const error = {
      timeMs: Math.round(this.getTimeMs()),
      source,
      message,
      stack
    };

    this.errors.push(error);
    if (this.active) {
      this.recordEvent('error', `${source}: ${message}`);
      this.writeErrors();
    }
  }

  getMenuSummary(): string {
    if (!this.isDesktopAvailable()) {
      return 'Auto diagnostics: desktop only';
    }

    if (!this.enabled) {
      return 'Auto diagnostics: off';
    }

    if (!this.active) {
      return 'Auto diagnostics: on / waiting for run';
    }

    const nextSeconds = Math.max(0, Math.ceil((this.nextReportAt - this.getTimeMs()) / 1000));
    return `Auto diagnostics: on\nRun: ${this.runId}\nNext report: ${nextSeconds}s\nErrors: ${this.errors.length}`;
  }

  private writeIntervalReport(reason: string): void {
    this.reportIndex += 1;
    const state = this.getRunState();
    const snapshot = this.getProfiler().createDiagnosticsSnapshot(true);
    const filename = `${this.runId}/diagnostic-${String(this.reportIndex).padStart(4, '0')}.md`;
    const markdown = createDiagnosticMarkdown({
      runId: this.runId,
      reason,
      reportIndex: this.reportIndex,
      state,
      events: this.events.slice(-20),
      errors: this.errors.slice(-20),
      snapshot
    });

    this.recordEvent('report-written', `Wrote ${filename}.`, { reason });
    void saveDesktopTextFile('runs', filename, markdown).then((result) => {
      if (!result.ok) {
        this.recordError('diagnostics-write', result.error ?? `Unable to write ${filename}.`);
      }
    });
  }

  private writeRunSummary(outcome: string): void {
    const state = this.getRunState();
    const snapshot = this.getProfiler().createDiagnosticsSnapshot(false);
    const markdown = createRunSummaryMarkdown({
      runId: this.runId,
      outcome,
      state,
      events: this.events,
      errors: this.errors,
      snapshot
    });

    void saveDesktopTextFile('runs', `${this.runId}/run-summary.md`, markdown);
  }

  private writeEvents(): void {
    void saveDesktopTextFile(
      'runs',
      `${this.runId}/events.json`,
      JSON.stringify(
        {
          type: 'starvivors-run-diagnostics-events',
          schemaVersion: 1,
          runId: this.runId,
          events: this.events
        },
        null,
        2
      )
    );
  }

  private writeErrors(): void {
    const markdown = [
      '# Starvivors Run Errors',
      '',
      `Run: ${this.runId || 'none'}`,
      '',
      ...(
        this.errors.length > 0
          ? this.errors.map((error, index) => [
              `## ${index + 1}. ${error.source}`,
              '',
              `- Time: ${error.timeMs}ms`,
              `- Message: ${error.message}`,
              '',
              error.stack ? '```text\n' + error.stack + '\n```' : ''
            ].join('\n'))
          : ['No errors recorded.']
      ),
      ''
    ].join('\n');

    const filename = this.runId ? `${this.runId}/errors.md` : 'errors.md';
    void saveDesktopTextFile('runs', filename, markdown);
  }
}

function createDiagnosticMarkdown(input: {
  runId: string;
  reason: string;
  reportIndex: number;
  state: AutoRunDiagnosticsRunState;
  events: DiagnosticsEvent[];
  errors: DiagnosticsError[];
  snapshot: ReturnType<PerformanceProfilerSystem['createDiagnosticsSnapshot']>;
}): string {
  const labels = getFlavorLabels(input.state, input.snapshot.intervalSummary);
  const machineReadable = {
    type: 'starvivors-auto-diagnostic-report',
    schemaVersion: 1,
    runId: input.runId,
    reason: input.reason,
    reportIndex: input.reportIndex,
    savedAt: new Date().toISOString(),
    state: input.state,
    labels,
    intervalSummary: input.snapshot.intervalSummary,
    rollingSummary: input.snapshot.rollingSummary,
    intervalWorstFrames: input.snapshot.intervalWorstFrames,
    recentEvents: input.events,
    recentErrors: input.errors,
    sampledIntervalFrames: input.snapshot.sampledIntervalFrames
  };

  return [
    '# Starvivors Auto Diagnostic Report',
    '',
    `Run: ${input.runId}`,
    `Reason: ${input.reason}`,
    `Report: ${input.reportIndex}`,
    '',
    '## Status',
    '',
    `- Labels: ${labels.join(', ') || 'None'}`,
    `- Run time: ${input.state.runTimeSeconds.toFixed(1)}s`,
    `- Hull: ${input.state.playerHull.toFixed(1)} / ${input.state.playerMaxHull}`,
    `- XP: ${input.state.playerXp}`,
    `- Scrap: ${input.state.runScrapTotal}`,
    `- Active weapon: ${input.state.activeWeaponName}`,
    '',
    '## Performance',
    '',
    ...formatSummary(input.snapshot.intervalSummary),
    '',
    '## Worst Interval Frames',
    '',
    ...formatWorstFrames(input.snapshot.intervalWorstFrames),
    '',
    '## Recent Errors',
    '',
    ...(input.errors.length > 0 ? input.errors.map((error) => `- ${error.source}: ${error.message}`) : ['No recent errors.']),
    '',
    '## Machine Readable Report',
    '',
    '```json',
    JSON.stringify(machineReadable, null, 2),
    '```',
    ''
  ].join('\n');
}

function createRunSummaryMarkdown(input: {
  runId: string;
  outcome: string;
  state: AutoRunDiagnosticsRunState;
  events: DiagnosticsEvent[];
  errors: DiagnosticsError[];
  snapshot: ReturnType<PerformanceProfilerSystem['createDiagnosticsSnapshot']>;
}): string {
  const labels = getFlavorLabels(input.state, input.snapshot.rollingSummary);
  return [
    '# Starvivors Run Summary',
    '',
    `Run: ${input.runId}`,
    `Outcome: ${input.outcome}`,
    '',
    '## Final State',
    '',
    `- Labels: ${labels.join(', ') || 'None'}`,
    `- Run time: ${input.state.runTimeSeconds.toFixed(1)}s`,
    `- Ship: ${input.state.selectedShipName}`,
    `- Hull: ${input.state.playerHull.toFixed(1)} / ${input.state.playerMaxHull}`,
    `- XP: ${input.state.playerXp}`,
    `- Scrap: ${input.state.runScrapTotal}`,
    `- Credits: ${input.state.totalCredits}`,
    '',
    '## Run Performance',
    '',
    ...formatSummary(input.snapshot.rollingSummary),
    '',
    '## Errors',
    '',
    ...(input.errors.length > 0 ? input.errors.map((error) => `- ${error.source}: ${error.message}`) : ['No errors recorded.']),
    '',
    '## Events',
    '',
    ...input.events.slice(-40).map((event) => `- ${event.timeMs}ms ${event.type}: ${event.message}`),
    ''
  ].join('\n');
}

function formatSummary(summary: PerformanceProfilerSummary): string[] {
  return [
    `- Frames: ${summary.frameCount}`,
    `- Average frame: ${summary.averageFrameMs.toFixed(2)}ms`,
    `- P95 frame: ${summary.p95FrameMs.toFixed(2)}ms`,
    `- Worst frame: ${summary.maxFrameMs.toFixed(2)}ms`,
    '',
    '| Phase | Avg ms/frame | Max ms |',
    '| --- | ---: | ---: |',
    ...summary.topPhases.slice(0, 8).map((phase) => `| ${phase.name} | ${phase.averageMs.toFixed(3)} | ${phase.maxMs.toFixed(3)} |`)
  ];
}

function formatWorstFrames(frames: PerformanceProfilerFrame[]): string[] {
  if (frames.length <= 0) {
    return ['No spike frames captured.'];
  }

  return frames.slice(0, 8).map((frame, index) => {
    const topPhase = Object.entries(frame.phases).sort((a, b) => b[1] - a[1])[0];
    return `${index + 1}. Frame ${frame.frameId}: ${frame.totalMs.toFixed(2)}ms, ${frame.fps.toFixed(1)} FPS, top ${topPhase ? `${topPhase[0]} ${topPhase[1].toFixed(2)}ms` : 'n/a'}.`;
  });
}

function getFlavorLabels(state: AutoRunDiagnosticsRunState, summary: PerformanceProfilerSummary): string[] {
  const labels: string[] = [];
  const totalProjectiles = state.counts.playerProjectiles + state.counts.enemyProjectiles;
  const enemies = state.counts.chasers + state.counts.shooters + state.counts.tanks;
  const topPhase = summary.topPhases[0]?.name;

  labels.push(summary.p95FrameMs >= 24 ? 'Critical' : summary.p95FrameMs >= 18 ? 'Hot' : summary.p95FrameMs >= 14 ? 'Watch' : 'Stable Flight');
  if (totalProjectiles >= 200) {
    labels.push('Projectile Soup');
  }
  if (enemies + state.counts.asteroids + state.counts.debris >= 100) {
    labels.push('Collision Party');
  }
  if (topPhase === 'black-hole') {
    labels.push('Black Hole Weather');
  }
  if (topPhase === 'debug-menu-refresh') {
    labels.push('Debug Menu Tax');
  }

  return labels;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'run';
}
