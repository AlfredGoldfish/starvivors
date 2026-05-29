import { app, BrowserWindow, ipcMain, dialog, shell, type OpenDialogOptions } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type DesktopFileCategory = 'reports' | 'debug-presets' | 'logs' | 'runs';
interface SaveTextFileInput {
  category: DesktopFileCategory;
  filename: string;
  contents: string;
}

interface ReadTextFileInput {
  category: DesktopFileCategory;
  filename?: string;
}

interface OpenDataFolderInput {
  category?: DesktopFileCategory;
  relativePath?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.argv.includes('--dev') || process.env.STARVIVORS_DESKTOP_DEV === '1';
const devServerUrl = getDevServerUrl();
const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 160;
const MAX_RELATIVE_PATH_LENGTH = 260;
const categoryFolders: Record<DesktopFileCategory, string> = {
  reports: 'reports',
  'debug-presets': 'debug-presets',
  logs: 'logs',
  runs: 'runs'
};

let mainWindow: BrowserWindow | undefined;
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
      sandbox: true,
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
    await mainWindow.loadURL(devServerUrl);
    if (process.env.STARVIVORS_OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

async function createWindows(): Promise<void> {
  await createMainWindow();
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

function getDevServerUrl(): string {
  const argPrefix = '--dev-server-url=';
  const argValue = process.argv.find((arg) => arg.startsWith(argPrefix))?.slice(argPrefix.length);
  const rawUrl = argValue || process.env.STARVIVORS_DEV_SERVER_URL || 'http://127.0.0.1:5174';

  try {
    return new URL(rawUrl).toString().replace(/\/$/, '');
  } catch {
    return 'http://127.0.0.1:5174';
  }
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
  ipcMain.handle('starvivors:saveTextFile', async (_event, input: unknown) => {
    try {
      const request = parseSaveTextFileInput(input);
      const folder = await ensureCategoryFolder(request.category);
      const relativePath = sanitizeRelativePath(request.filename);
      if (!relativePath) {
        throw new Error('A filename is required.');
      }
      const filePath = resolveInside(folder, relativePath);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, request.contents, 'utf8');
      return { ok: true, path: filePath };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('starvivors:readTextFile', async (_event, input: unknown) => {
    try {
      const request = parseReadTextFileInput(input);
      const folder = await ensureCategoryFolder(request.category);
      const filePath = request.filename
        ? resolveInside(folder, sanitizeFilename(request.filename))
        : await pickMarkdownFile(folder);

      if (!filePath) {
        return { ok: false, error: 'No file selected.' };
      }

      await assertReadableTextFileSize(filePath);
      const contents = await fs.readFile(filePath, 'utf8');
      return { ok: true, contents, path: filePath };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle('starvivors:openDataFolder', async (_event, input?: unknown) => {
    try {
      const request = parseOpenDataFolderInput(input);
      const baseFolder = request.category ? await ensureCategoryFolder(request.category) : await ensureDataRoot();
      const folder = request.relativePath ? resolveInside(baseFolder, sanitizeRelativePath(request.relativePath)) : baseFolder;
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

function parseSaveTextFileInput(input: unknown): SaveTextFileInput {
  const record = requireRecord(input);
  const category = requireCategory(record.category);
  const filename = requireLimitedString(record.filename, 'filename', MAX_RELATIVE_PATH_LENGTH);
  const contents = requireLimitedString(record.contents, 'contents', MAX_TEXT_FILE_BYTES, true, true);

  return { category, filename, contents };
}

function parseReadTextFileInput(input: unknown): ReadTextFileInput {
  const record = requireRecord(input);
  const category = requireCategory(record.category);
  const filename = optionalLimitedString(record.filename, 'filename', MAX_FILENAME_LENGTH);

  return filename ? { category, filename } : { category };
}

function parseOpenDataFolderInput(input: unknown): OpenDataFolderInput {
  if (input === undefined) {
    return {};
  }

  const record = requireRecord(input);
  const category = record.category === undefined ? undefined : requireCategory(record.category);
  const relativePath = optionalLimitedString(record.relativePath, 'relativePath', MAX_RELATIVE_PATH_LENGTH);

  return {
    ...(category ? { category } : {}),
    ...(relativePath ? { relativePath } : {})
  };
}

function requireRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Invalid IPC payload.');
  }

  return input as Record<string, unknown>;
}

function requireCategory(value: unknown): DesktopFileCategory {
  if (typeof value !== 'string' || !(value in categoryFolders)) {
    throw new Error('Unsupported desktop file category.');
  }

  return value as DesktopFileCategory;
}

function requireLimitedString(
  value: unknown,
  label: string,
  maxLengthOrBytes: number,
  measureBytes = false,
  allowEmpty = false
): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}.`);
  }

  const size = measureBytes ? Buffer.byteLength(value, 'utf8') : value.length;
  if ((!allowEmpty && size <= 0) || size > maxLengthOrBytes) {
    throw new Error(`${label} exceeds the allowed size.`);
  }

  return value;
}

function optionalLimitedString(value: unknown, label: string, maxLength: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireLimitedString(value, label, maxLength);
}

async function assertReadableTextFileSize(filePath: string): Promise<void> {
  const stats = await fs.stat(filePath);
  if (stats.size > MAX_TEXT_FILE_BYTES) {
    throw new Error('Text file exceeds the allowed size.');
  }
}

function resolveInside(baseFolder: string, relativePath: string): string {
  const base = path.resolve(baseFolder);
  const resolved = path.resolve(base, relativePath);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error('Resolved path escaped the desktop data folder.');
  }

  return resolved;
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
