export type DesktopFileCategory = 'reports' | 'debug-presets' | 'logs' | 'runs';

export interface DesktopFileResult {
  ok: boolean;
  path?: string;
  contents?: string;
  error?: string;
}

export interface StarvivorsDesktopBridge {
  saveTextFile: (category: DesktopFileCategory, filename: string, contents: string) => Promise<DesktopFileResult>;
  readTextFile: (category: DesktopFileCategory, filename?: string) => Promise<DesktopFileResult>;
  openDataFolder: (category?: DesktopFileCategory, relativePath?: string) => Promise<DesktopFileResult>;
  getRuntimeInfo: () => Promise<{
    isDesktop: true;
    mode: 'dev' | 'packaged';
    dataRootLabel: string;
  }>;
}

declare global {
  interface Window {
    starvivorsDesktop?: StarvivorsDesktopBridge;
  }
}

export function getDesktopBridge(): StarvivorsDesktopBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.starvivorsDesktop;
}

export function isDesktopRuntime(): boolean {
  return Boolean(getDesktopBridge());
}

export async function saveDesktopTextFile(
  category: DesktopFileCategory,
  filename: string,
  contents: string
): Promise<DesktopFileResult> {
  const desktop = getDesktopBridge();
  if (!desktop) {
    return { ok: false, error: 'Desktop bridge is not available.' };
  }

  return desktop.saveTextFile(category, filename, contents);
}
