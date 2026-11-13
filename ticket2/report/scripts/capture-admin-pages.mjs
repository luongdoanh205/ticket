import fs from 'node:fs';
import { spawn } from 'node:child_process';

const email = process.env.REPORT_EMAIL;
const password = process.env.REPORT_PASSWORD;
const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!loginResponse.ok) throw new Error(`Admin login failed: ${loginResponse.status}`);
const login = await loginResponse.json();

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = `${process.env.TEMP}\\ticket2-report-admin-${Date.now()}`;
const browser = spawn(edgePath, [
  '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--disable-extensions',
  '--window-size=1440,1100', '--remote-debugging-port=9222', `--user-data-dir=${profile}`,
  'http://127.0.0.1:5173/',
], { windowsHide: true, stdio: 'ignore' });

try {
  let target;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const targets = await fetch('http://127.0.0.1:9222/json/list').then(response => response.json());
      target = targets.find(item => item.type === 'page');
      if (target) break;
    } catch { /* wait for Edge's remote debugging endpoint */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!target) throw new Error('Edge did not expose a page target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 0;
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
    }
  });
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false,
  });
  await call('Page.enable');
  await delay(1000);
  await call('Runtime.evaluate', {
    expression: `localStorage.setItem('token',${JSON.stringify(login.accessToken)});localStorage.setItem('user',${JSON.stringify(JSON.stringify(login.user))});`,
  });
  await call('Page.reload');
  await delay(5000);
  for (const [name, url] of [['admin_dashboard', '/admin'], ['admin_movies', '/admin/movies']]) {
    await call('Page.navigate', { url: `http://127.0.0.1:5173${url}` });
    await delay(5000);
    const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(`report/screenshots/${name}.png`, Buffer.from(shot.data, 'base64'));
    console.log(`${name} captured`);
  }
  ws.close();
} finally {
  browser.kill();
}
