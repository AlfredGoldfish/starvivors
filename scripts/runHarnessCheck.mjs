import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [url, attribute, expected = 'pass'] = process.argv.slice(2);

if (!url || !attribute) {
  console.error('Usage: node scripts/runHarnessCheck.mjs <url> <body-attribute> [expected]');
  process.exit(2);
}

const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9300 + Math.floor(Math.random() * 600);
const userDataDir = await mkdtemp(path.join(tmpdir(), 'starvivors-harness-'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
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
  const result = await waitForHarnessAttribute(client, attribute, expected, 20000);
  client.close();

  console.log(`${attribute}=${result.status}`);
  if (result.details && (result.status !== expected || process.env.STARVIVORS_HARNESS_DETAILS === '1')) {
    console.log(`${attribute}-details=${result.details}`);
  }

  if (result.status !== expected) {
    process.exitCode = 1;
  }
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
      const page = targets.find((target) => target.type === 'page' && target.url === targetUrl) ?? targets.find((target) => target.type === 'page');
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

async function waitForHarnessAttribute(client, attr, expectedValue, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let latest = { status: null, details: null, bodyAttributes: [], errorOverlay: '' };

  while (Date.now() < deadline) {
    latest = await readHarnessAttribute(client, attr);
    if (latest.status === expectedValue || latest.status === 'fail') {
      return latest;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${attr}=${expectedValue}. Latest body attributes: ${latest.bodyAttributes.join(', ') || '(none)'}`);
}

async function readHarnessAttribute(client, attr) {
  const detailsAttr = `${attr}-details`;
  const expression = `(() => {
    const attr = ${JSON.stringify(attr)};
    const detailsAttr = ${JSON.stringify(detailsAttr)};
    return {
      status: document.body.getAttribute(attr),
      details: document.body.getAttribute(detailsAttr),
      bodyAttributes: Array.from(document.body.attributes).map((item) => item.name + '=' + item.value),
      errorOverlay: document.querySelector('vite-error-overlay')?.textContent ?? ''
    };
  })()`;
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true
  });

  return result.result.value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
