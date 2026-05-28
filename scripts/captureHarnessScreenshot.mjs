import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [
  url,
  outputPath,
  readyAttribute,
  expectedValue = 'pass',
  settleMsArg = '500',
  viewportArg = '1280x720'
] = process.argv.slice(2);

if (!url || !outputPath) {
  console.error(
    'Usage: node scripts/captureHarnessScreenshot.mjs <url> <outputPath> [readyAttribute] [expectedValue] [settleMs] [viewport]'
  );
  process.exit(2);
}

const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9400 + Math.floor(Math.random() * 500);
const userDataDir = await mkdtemp(path.join(tmpdir(), 'starvivors-screenshot-'));
const viewport = parseViewport(viewportArg);
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    url
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);

let stderr = '';
chrome.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

try {
  const webSocketDebuggerUrl = await waitForPageWebSocket(port, url);
  const client = await connectDevTools(webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  if (readyAttribute) {
    await waitForAttribute(client, readyAttribute, expectedValue, 20000);
  } else {
    await delay(1000);
  }

  await client.send('Runtime.evaluate', {
    expression: 'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
    awaitPromise: true
  });
  await delay(Math.max(0, Number(settleMsArg) || 0));

  const screenshot = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const resolvedOutputPath = path.resolve(outputPath);
  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, Buffer.from(screenshot.data, 'base64'));
  client.close();
  console.log(`wrote ${resolvedOutputPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (stderr.trim()) {
    console.error(stderr.trim().split('\n').slice(-8).join('\n'));
  }
  process.exitCode = 1;
} finally {
  chrome.kill();
  await waitForProcessExit(chrome, 3000);
  try {
    await rm(userDataDir, { recursive: true, force: true });
  } catch {
    // Chrome can briefly hold profile files on Windows after exit; temp cleanup is best-effort.
  }
}

async function waitForPageWebSocket(debugPort, targetUrl) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json`);
      const targets = await response.json();
      const page =
        targets.find((target) => target.type === 'page' && target.url === targetUrl) ??
        targets.find((target) => target.type === 'page');
      if (page?.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome is still starting.
    }

    await delay(100);
  }

  throw new Error('Timed out waiting for Chrome DevTools target.');
}

function connectDevTools(webSocketDebuggerUrl) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketDebuggerUrl);
    let nextId = 1;
    const pending = new Map();

    socket.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const id = nextId++;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((innerResolve, innerReject) => {
            pending.set(id, { resolve: innerResolve, reject: innerReject });
          });
        },
        close() {
          socket.close();
        }
      });
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) {
        return;
      }

      const handlers = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        handlers.reject(new Error(message.error.message));
      } else {
        handlers.resolve(message.result);
      }
    });

    socket.addEventListener('error', () => reject(new Error('Chrome DevTools WebSocket failed.')));
  });
}

async function waitForAttribute(client, attr, expectedValue, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let latest = null;
  while (Date.now() < deadline) {
    latest = await readAttribute(client, attr);
    if (latest?.status === expectedValue) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${attr}=${expectedValue}; latest=${latest?.status ?? '(missing)'}`);
}

async function readAttribute(client, attr) {
  const expression = `(() => ({ status: document.body.getAttribute(${JSON.stringify(attr)}) }))()`;
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true
  });

  return result.result.value ?? { status: null };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/i.exec(value);
  if (!match) {
    return { width: 1280, height: 720 };
  }

  return {
    width: Math.max(320, Number(match[1])),
    height: Math.max(320, Number(match[2]))
  };
}

function waitForProcessExit(process, timeoutMs) {
  if (process.exitCode !== null || process.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    process.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
