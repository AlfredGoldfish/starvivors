import { contextBridge, ipcRenderer } from 'electron';

type DesktopFileCategory = 'reports' | 'debug-presets' | 'logs' | 'runs';

const desktopApi = {
  saveTextFile: (category: DesktopFileCategory, filename: string, contents: string) =>
    ipcRenderer.invoke('starvivors:saveTextFile', { category, filename, contents }) as Promise<{
      ok: boolean;
      path?: string;
      error?: string;
    }>,
  readTextFile: (category: DesktopFileCategory, filename?: string) =>
    ipcRenderer.invoke('starvivors:readTextFile', { category, filename }) as Promise<{
      ok: boolean;
      contents?: string;
      path?: string;
      error?: string;
    }>,
  openDataFolder: (category?: DesktopFileCategory, relativePath?: string) =>
    ipcRenderer.invoke('starvivors:openDataFolder', { category, relativePath }) as Promise<{
      ok: boolean;
      error?: string;
    }>,
  getRuntimeInfo: () =>
    ipcRenderer.invoke('starvivors:getRuntimeInfo') as Promise<{
      isDesktop: true;
      mode: 'dev' | 'packaged';
      dataRootLabel: string;
    }>
};

contextBridge.exposeInMainWorld('starvivorsDesktop', desktopApi);
