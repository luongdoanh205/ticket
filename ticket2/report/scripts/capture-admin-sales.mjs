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
const output = fileURLToPath(new URL('../screenshots/admin_sales.png', import.meta.url));
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
  await page.goto(`${web}/admin/sales`);
  await page.getByText('Nguyễn Minh Anh').first().waitFor({ timeout: 10000 });
  await page.screenshot({ path: output });
  await page.getByText('Đơn #5', { exact: true }).click();
  await page.getByText('Thông tin chi tiết').waitFor();
  await page.screenshot({ path: fileURLToPath(new URL('../screenshots/admin_booking_detail.png', import.meta.url)) });
  console.log('Captured admin sales list and booking detail.');
} finally {
  await browser.close();
}
