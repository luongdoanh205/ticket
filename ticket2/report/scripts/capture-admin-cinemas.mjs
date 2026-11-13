import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.join(process.env.TEMP, 'ticket2-playwright', 'package.json'));
const { chromium } = require('playwright-core');
const env = Object.fromEntries(
  fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).map((line) => line.match(/^([^#=]+)=(.*)$/)).filter(Boolean)
    .map(([, key, value]) => [key, value]),
);
const web = process.env.WEB_BASE ?? 'http://127.0.0.1:5173';
const screenshot = fileURLToPath(new URL('../screenshots/admin_cinemas.png', import.meta.url));
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Bangkok' });
  await page.goto(`${web}/login`);
  await page.locator('input[type=email]').fill(env.ADMIN_EMAIL);
  await page.locator('input[type=password]').fill(env.ADMIN_PASSWORD);
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(`${web}/`);
  await page.goto(`${web}/admin/cinemas`);
  await page.getByRole('heading', { name: 'Rạp Ánh Dương - Quận 3', exact: true }).waitFor({ timeout: 10000 });
  await page.getByText('Phòng chiếu 01').waitFor();
  await page.screenshot({ path: screenshot, fullPage: false });
  console.log(`Captured ${screenshot}`);
} finally {
  await browser.close();
}
