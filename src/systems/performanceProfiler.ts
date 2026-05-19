import type { GameFlowState } from '../scenes/gameTypes';

export interface PerformanceProfilerCounts {
  chasers: number;
  shooters: number;
  tanks: number;
  asteroids: number;
  debris: number;
  scrap: number;
  playerProjectiles: number;
  enemyProjectiles: number;
  deathShards: number;
}

export interface PerformanceProfilerFlags {
  flowState: GameFlowState;
  debugMenuOpen: boolean;
  debugPaused: boolean;
  upgradeOverlayOpen: boolean;
  collisionDebugEnabled: boolean;
  blackHoleActive: boolean;
}

export interface PerformanceProfilerFrame {
  frameId: number;
  timeMs: number;
  deltaMs: number;
  fps: number;
  totalMs: number;
  phases: Record<string, number>;
  counts: PerformanceProfilerCounts;
  flags: PerformanceProfilerFlags;
}

export interface PerformanceProfilerSummary {
  frameCount: number;
  averageFrameMs: number;
  p95FrameMs: number;
  maxFrameMs: number;
  topPhases: Array<{
    name: string;
    totalMs: number;
    averageMs: number;
    maxMs: number;
  }>;
  maxCounts: PerformanceProfilerCounts;
}

interface ActiveProfilerFrame {
  frameId: number;
  timeMs: number;
  deltaMs: number;
  fps: number;
  startMs: number;
  phases: Record<string, number>;
  counts: PerformanceProfilerCounts;
  flags: PerformanceProfilerFlags;
}

const FIVE_MINUTES_AT_60_FPS = 60 * 60 * 5;
const ROLLING_FRAME_LIMIT = FIVE_MINUTES_AT_60_FPS;
const SESSION_FRAME_LIMIT = FIVE_MINUTES_AT_60_FPS;
const WORST_FRAME_LIMIT = 30;
const RAW_SAMPLE_LIMIT = 120;

export class PerformanceProfilerSystem {
  private enabled = false;
  private manualCaptureActive = false;
  private nextFrameId = 1;
  private activeFrame?: ActiveProfilerFrame;
  private rollingFrames: PerformanceProfilerFrame[] = [];
  private manualFrames: PerformanceProfilerFrame[] = [];
  private intervalFrames: PerformanceProfilerFrame[] = [];
  private worstFrames: PerformanceProfilerFrame[] = [];

  isEnabled(): boolean {
    return this.enabled;
  }

  isManualCaptureActive(): boolean {
    return this.manualCaptureActive;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.manualCaptureActive = false;
      this.activeFrame = undefined;
    }
  }

  toggleEnabled(): void {
    this.setEnabled(!this.enabled);
  }

  startManualCapture(): void {
    this.enabled = true;
    this.manualCaptureActive = true;
    this.manualFrames = [];
  }

  stopManualCapture(): void {
    this.manualCaptureActive = false;
  }

  clear(): void {
    this.activeFrame = undefined;
    this.rollingFrames = [];
    this.manualFrames = [];
    this.intervalFrames = [];
    this.worstFrames = [];
  }

  beginFrame(input: {
    timeMs: number;
    deltaMs: number;
    fps: number;
    counts: PerformanceProfilerCounts;
    flags: PerformanceProfilerFlags;
  }): void {
    if (!this.enabled) {
      this.activeFrame = undefined;
      return;
    }

    this.activeFrame = {
      frameId: this.nextFrameId,
      timeMs: input.timeMs,
      deltaMs: input.deltaMs,
      fps: input.fps,
      startMs: now(),
      phases: {},
      counts: { ...input.counts },
      flags: { ...input.flags }
    };
    this.nextFrameId += 1;
  }

  measure<T>(name: string, callback: () => T): T {
    if (!this.activeFrame) {
      return callback();
    }

    const startMs = now();
    try {
      return callback();
    } finally {
      const elapsedMs = now() - startMs;
      this.activeFrame.phases[name] = (this.activeFrame.phases[name] ?? 0) + elapsedMs;
    }
  }

  endFrame(counts: PerformanceProfilerCounts): void {
    if (!this.activeFrame) {
      return;
    }

    this.activeFrame.counts = { ...counts };
    const totalMs = now() - this.activeFrame.startMs;
    const measuredMs = Object.values(this.activeFrame.phases).reduce((sum, value) => sum + value, 0);
    this.activeFrame.phases['unmeasured-or-profiler-overhead'] = Math.max(0, totalMs - measuredMs);
    const frame: PerformanceProfilerFrame = {
      frameId: this.activeFrame.frameId,
      timeMs: this.activeFrame.timeMs,
      deltaMs: round(this.activeFrame.deltaMs, 3),
      fps: round(this.activeFrame.fps, 2),
      totalMs: round(totalMs, 3),
      phases: roundRecord(this.activeFrame.phases, 3),
      counts: { ...this.activeFrame.counts },
      flags: { ...this.activeFrame.flags }
    };

    this.activeFrame = undefined;
    this.pushLimited(this.rollingFrames, frame, ROLLING_FRAME_LIMIT);
    this.pushLimited(this.intervalFrames, frame, SESSION_FRAME_LIMIT);
    if (this.manualCaptureActive) {
      this.pushLimited(this.manualFrames, frame, SESSION_FRAME_LIMIT);
    }
    this.recordWorstFrame(frame);
  }

  getMenuSummary(): string {
    const frames = this.getPreferredFrames();
    const stats = summarizeFrames(frames);
    const worst = this.worstFrames[0];
    const topPhase = stats.topPhases[0];

    if (frames.length <= 0) {
      return `Profiler: ${this.enabled ? 'on' : 'off'} / manual ${this.manualCaptureActive ? 'recording' : 'idle'}\nNo frames captured`;
    }

    return [
      `Profiler: ${this.enabled ? 'on' : 'off'} / manual ${this.manualCaptureActive ? 'recording' : 'idle'}`,
      `Frames: ${frames.length} / avg ${stats.averageFrameMs.toFixed(2)}ms / p95 ${stats.p95FrameMs.toFixed(2)}ms`,
      `Worst: ${worst ? `${worst.totalMs.toFixed(2)}ms @ ${Math.round(worst.timeMs)}ms` : 'n/a'}`,
      `Top phase: ${topPhase ? `${topPhase.name} ${topPhase.averageMs.toFixed(2)}ms avg` : 'n/a'}`
    ].join('\n');
  }

  createMarkdownReport(input: {
    savedAt: Date;
    selectedShipName: string;
    runTimeSeconds: number;
    playerHull: number;
    playerMaxHull: number;
  }): string {
    const allFrames = this.rollingFrames;
    const manualFrames = this.manualFrames;
    const preferredFrames = this.getPreferredFrames();
    const rollingStats = summarizeFrames(allFrames);
    const manualStats = summarizeFrames(manualFrames);
    const preferredStats = summarizeFrames(preferredFrames);
    const sampledFrames = sampleFrames(preferredFrames, RAW_SAMPLE_LIMIT);
    const machineReadable = {
      type: 'starvivors-lag-report',
      schemaVersion: 1,
      savedAt: input.savedAt.toISOString(),
      profiler: {
        enabled: this.enabled,
        manualCaptureActive: this.manualCaptureActive,
        rollingFrameCount: allFrames.length,
        manualFrameCount: manualFrames.length
      },
      run: {
        selectedShipName: input.selectedShipName,
        runTimeSeconds: round(input.runTimeSeconds, 3),
        playerHull: round(input.playerHull, 3),
        playerMaxHull: round(input.playerMaxHull, 3)
      },
      rollingSummary: rollingStats,
      manualSummary: manualStats,
      preferredSummary: preferredStats,
      worstFrames: this.worstFrames,
      sampledFrames
    };

    return [
      '# Starvivors Lag Report',
      '',
      `Saved: ${input.savedAt.toLocaleString()}`,
      '',
      '## Summary',
      '',
      `- Profiler: ${this.enabled ? 'enabled' : 'disabled'}`,
      `- Manual capture: ${this.manualCaptureActive ? 'recording' : 'stopped'}`,
      `- Rolling frames: ${allFrames.length}`,
      `- Manual frames: ${manualFrames.length}`,
      `- Analyzed frames: ${preferredFrames.length}`,
      `- Average frame: ${preferredStats.averageFrameMs.toFixed(2)}ms`,
      `- P95 frame: ${preferredStats.p95FrameMs.toFixed(2)}ms`,
      `- Worst frame: ${preferredStats.maxFrameMs.toFixed(2)}ms`,
      '',
      '## Top Slow Phases',
      '',
      ...formatPhaseRows(preferredStats.topPhases),
      '',
      '## Worst Frames',
      '',
      ...formatWorstFrames(this.worstFrames.slice(0, 10)),
      '',
      '## Entity Count Peaks',
      '',
      ...formatCountPeaks(preferredStats.maxCounts),
      '',
      '## Machine Readable Report',
      '',
      '```json',
      JSON.stringify(machineReadable, null, 2),
      '```',
      ''
    ].join('\n');
  }

  createDiagnosticsSnapshot(resetIntervalFrames: boolean): {
    intervalSummary: PerformanceProfilerSummary;
    rollingSummary: PerformanceProfilerSummary;
    intervalWorstFrames: PerformanceProfilerFrame[];
    rollingWorstFrames: PerformanceProfilerFrame[];
    sampledIntervalFrames: PerformanceProfilerFrame[];
  } {
    const intervalFrames = [...this.intervalFrames];
    const rollingFrames = [...this.rollingFrames];
    const snapshot = {
      intervalSummary: summarizeFrames(intervalFrames),
      rollingSummary: summarizeFrames(rollingFrames),
      intervalWorstFrames: getWorstFrames(intervalFrames, 10),
      rollingWorstFrames: [...this.worstFrames],
      sampledIntervalFrames: sampleFrames(intervalFrames, RAW_SAMPLE_LIMIT)
    };

    if (resetIntervalFrames) {
      this.intervalFrames = [];
    }

    return snapshot;
  }

  private getPreferredFrames(): PerformanceProfilerFrame[] {
    return this.manualFrames.length > 0 ? this.manualFrames : this.rollingFrames;
  }

  private pushLimited(frames: PerformanceProfilerFrame[], frame: PerformanceProfilerFrame, limit: number): void {
    frames.push(frame);
    if (frames.length > limit) {
      frames.splice(0, frames.length - limit);
    }
  }

  private recordWorstFrame(frame: PerformanceProfilerFrame): void {
    this.worstFrames.push(frame);
    this.worstFrames.sort((a, b) => b.totalMs - a.totalMs);
    if (this.worstFrames.length > WORST_FRAME_LIMIT) {
      this.worstFrames.length = WORST_FRAME_LIMIT;
    }
  }
}

function summarizeFrames(frames: PerformanceProfilerFrame[]) {
  const sortedFrameTimes = frames.map((frame) => frame.totalMs).sort((a, b) => a - b);
  const phaseTotals: Record<string, number> = {};
  const phaseMax: Record<string, number> = {};
  const maxCounts: PerformanceProfilerCounts = {
    chasers: 0,
    shooters: 0,
    tanks: 0,
    asteroids: 0,
    debris: 0,
    scrap: 0,
    playerProjectiles: 0,
    enemyProjectiles: 0,
    deathShards: 0
  };

  for (const frame of frames) {
    for (const [name, value] of Object.entries(frame.phases)) {
      phaseTotals[name] = (phaseTotals[name] ?? 0) + value;
      phaseMax[name] = Math.max(phaseMax[name] ?? 0, value);
    }

    for (const key of Object.keys(maxCounts) as Array<keyof PerformanceProfilerCounts>) {
      maxCounts[key] = Math.max(maxCounts[key], frame.counts[key]);
    }
  }

  const topPhases = Object.entries(phaseTotals)
    .map(([name, totalMs]) => ({
      name,
      totalMs: round(totalMs, 3),
      averageMs: round(frames.length > 0 ? totalMs / frames.length : 0, 3),
      maxMs: round(phaseMax[name] ?? 0, 3)
    }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 12);

  return {
    frameCount: frames.length,
    averageFrameMs: round(average(sortedFrameTimes), 3),
    p95FrameMs: round(percentile(sortedFrameTimes, 0.95), 3),
    maxFrameMs: round(sortedFrameTimes[sortedFrameTimes.length - 1] ?? 0, 3),
    topPhases,
    maxCounts
  };
}

function getWorstFrames(frames: PerformanceProfilerFrame[], limit: number): PerformanceProfilerFrame[] {
  return [...frames].sort((a, b) => b.totalMs - a.totalMs).slice(0, limit);
}

function formatPhaseRows(phases: Array<{ name: string; totalMs: number; averageMs: number; maxMs: number }>): string[] {
  if (phases.length <= 0) {
    return ['No phase timings captured.'];
  }

  return [
    '| Phase | Total ms | Avg ms/frame | Max ms |',
    '| --- | ---: | ---: | ---: |',
    ...phases.map((phase) => `| ${phase.name} | ${phase.totalMs.toFixed(2)} | ${phase.averageMs.toFixed(3)} | ${phase.maxMs.toFixed(3)} |`)
  ];
}

function formatWorstFrames(frames: PerformanceProfilerFrame[]): string[] {
  if (frames.length <= 0) {
    return ['No spike frames captured.'];
  }

  return frames.map((frame, index) => {
    const topPhases = Object.entries(frame.phases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => `${name} ${value.toFixed(2)}ms`)
      .join(', ');
    const counts = frame.counts;

    return `${index + 1}. Frame ${frame.frameId}: ${frame.totalMs.toFixed(2)}ms, delta ${frame.deltaMs.toFixed(2)}ms, ${frame.fps.toFixed(1)} FPS, counts E/A/D/P ${counts.chasers + counts.shooters + counts.tanks}/${counts.asteroids}/${counts.debris}/${counts.playerProjectiles + counts.enemyProjectiles}. Top phases: ${topPhases || 'n/a'}.`;
  });
}

function formatCountPeaks(counts: PerformanceProfilerCounts): string[] {
  return [
    `- Chasers: ${counts.chasers}`,
    `- Shooters: ${counts.shooters}`,
    `- Tanks: ${counts.tanks}`,
    `- Asteroids: ${counts.asteroids}`,
    `- Debris: ${counts.debris}`,
    `- Scrap pickups: ${counts.scrap}`,
    `- Player projectiles: ${counts.playerProjectiles}`,
    `- Enemy projectiles: ${counts.enemyProjectiles}`,
    `- Death shards: ${counts.deathShards}`
  ];
}

function sampleFrames(frames: PerformanceProfilerFrame[], limit: number): PerformanceProfilerFrame[] {
  if (frames.length <= limit) {
    return frames;
  }

  const sampled: PerformanceProfilerFrame[] = [];
  const step = (frames.length - 1) / (limit - 1);
  for (let i = 0; i < limit; i += 1) {
    sampled.push(frames[Math.round(i * step)]);
  }
  return sampled;
}

function average(values: number[]): number {
  if (values.length <= 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length <= 0) {
    return 0;
  }

  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * percentileValue) - 1));
  return sortedValues[index];
}

function round(value: number, places: number): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

function roundRecord(record: Record<string, number>, places: number): Record<string, number> {
  const rounded: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    rounded[key] = round(value, places);
  }
  return rounded;
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
