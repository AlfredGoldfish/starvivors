import { app, BrowserWindow, ipcMain, dialog, shell, type OpenDialogOptions } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type DesktopFileCategory = 'reports' | 'debug-presets' | 'logs' | 'runs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.argv.includes('--dev') || process.env.STARVIVORS_DESKTOP_DEV === '1';
const categoryFolders: Record<DesktopFileCategory, string> = {
  reports: 'reports',
  'debug-presets': 'debug-presets',
  logs: 'logs',
  runs: 'runs'
};

let mainWindow: BrowserWindow | undefined;
let enemyLabWindow: BrowserWindow | undefined;
const pendingMainProcessErrors: string[] = [];

installMainProcessDiagnostics();

function createDesktopWindow(input: {
  title: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  x?: number;
  y?: number;
}): BrowserWindow {
  return new BrowserWindow({
    title: input.title,
    width: input.width,
    height: input.height,
    minWidth: input.minWidth,
    minHeight: input.minHeight,
    x: input.x,
    y: input.y,
    backgroundColor: '#02040a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });
}

async function createMainWindow(): Promise<void> {
  mainWindow = createDesktopWindow({
    title: 'Starvivors',
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540
  });
  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });

  if (isDev) {
    await mainWindow.loadURL('http://127.0.0.1:5173');
    if (process.env.STARVIVORS_OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

async function createEnemyLabWindow(): Promise<void> {
  enemyLabWindow = createDesktopWindow({
    title: 'Starvivors Enemy Lab',
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    x: 80,
    y: 80
  });
  enemyLabWindow.on('closed', () => {
    enemyLabWindow = undefined;
  });

  if (isDev) {
    await enemyLabWindow.loadURL('http://127.0.0.1:5173/enemy-lab.html');
    if (process.env.STARVIVORS_OPEN_DEVTOOLS === '1') {
      enemyLabWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  await enemyLabWindow.loadFile(path.join(__dirname, '../dist/enemy-lab.html'));
}

async function createWindows(): Promise<void> {
  await createMainWindow();
  await createEnemyLabWindow();
}

app.whenReady().then(async () => {
  registerFileIpc();
  await flushPendingMainProcessErrors();
  await createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindows();
    }
  });
});

function installMainProcessDiagnostics(): void {
  process.on('uncaughtException', (error) => {
    void appendMainProcessError('uncaughtException', error);
  });
  process.on('unhandledRejection', (reason) => {
    void appendMainProcessError('unhandledRejection', reason);
  });
}

async function appendMainProcessError(source: string, error: unknown): Promise<void> {
  const entry = [
    `## ${new Date().toISOString()} ${source}`,
    '',
    '```text',
    formatErrorForLog(error),
    '```',
    ''
  ].join('\n');

  if (!app.isReady()) {
    pendingMainProcessErrors.push(entry);
    return;
  }

  try {
    const folder = await ensureCategoryFolder('logs');
    await fs.appendFile(path.join(folder, 'main-errors.md'), entry, 'utf8');
  } catch {
    pendingMainProcessErrors.push(entry);
  }
}

async function flushPendingMainProcessErrors(): Promise<void> {
  if (pendingMainProcessErrors.length <= 0) {
    return;
  }

  const entries = pendingMainProcessErrors.splice(0);
  try {
    const folder = await ensureCategoryFolder('logs');
    await fs.appendFile(path.join(folder, 'main-errors.md'), entries.join('\n'), 'utf8');
  } catch {
    pendingMainProcessErrors.unshift(...entries);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerFileIpc(): void {
  ipcMain.handle('starvivors:saveTextFile', async (_event, input: {
    category: DesktopFileCategory;
    filename: string;
    contents: string;
  }) => {
    try {
      const folder = await ensureCategoryFolder(input.category);
      const filePath = path.join(folder, sanitizeRelativePath(input.filename));

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, input.contents, 'utf8');
      return { ok: true, path: filePath };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('starvivors:readTextFile', async (_event, input: {
    category: DesktopFileCategory;
    filename?: string;
  }) => {
    try {
      const folder = await ensureCategoryFolder(input.category);
      const filePath = input.filename
        ? path.join(folder, sanitizeFilename(input.filename))
        : await pickMarkdownFile(folder);

      if (!filePath) {
        return { ok: false, error: 'No file selected.' };
      }

      const contents = await fs.readFile(filePath, 'utf8');
      return { ok: true, contents, path: filePath };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('starvivors:openDataFolder', async (_event, input?: {
    category?: DesktopFileCategory;
    relativePath?: string;
  }) => {
    try {
      const baseFolder = input?.category ? await ensureCategoryFolder(input.category) : await ensureDataRoot();
      const folder = input?.relativePath ? path.join(baseFolder, sanitizeRelativePath(input.relativePath)) : baseFolder;
      await fs.mkdir(folder, { recursive: true });
      const result = await shell.openPath(folder);

      return result ? { ok: false, error: result } : { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('starvivors:getRuntimeInfo', async () => ({
    isDesktop: true,
    mode: isDev ? 'dev' : 'packaged',
    dataRootLabel: await ensureDataRoot()
  }));
}

async function pickMarkdownFile(defaultPath: string): Promise<string | undefined> {
  const options = {
    defaultPath,
    properties: ['openFile'],
    filters: [
      { name: 'Markdown/Text', extensions: ['md', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  } satisfies OpenDialogOptions;
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);

  return result.canceled ? undefined : result.filePaths[0];
}

async function ensureCategoryFolder(category: DesktopFileCategory): Promise<string> {
  const folderName = categoryFolders[category];
  if (!folderName) {
    throw new Error(`Unsupported desktop file category: ${category}`);
  }

  const folder = path.join(await ensureDataRoot(), folderName);
  await fs.mkdir(folder, { recursive: true });
  return folder;
}

async function ensureDataRoot(): Promise<string> {
  const root = isDev ? path.join(process.cwd(), 'runtime-data') : app.getPath('userData');

  await fs.mkdir(root, { recursive: true });
  return root;
}

function sanitizeFilename(filename: string): string {
  const sanitized = path.basename(filename).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();

  return sanitized || `starvivors-file-${Date.now()}.txt`;
}

function sanitizeRelativePath(relativePath: string): string {
  return relativePath
    .split(/[\\/]+/)
    .filter((part) => part && part !== '.' && part !== '..')
    .map(sanitizeFilename)
    .join(path.sep);
}

function formatErrorForLog(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
