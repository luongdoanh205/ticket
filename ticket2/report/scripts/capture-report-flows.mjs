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
const api = process.env.API_BASE ?? 'http://127.0.0.1:8080/api';
const web = process.env.WEB_BASE ?? 'http://127.0.0.1:5173';
const screenshotDir = fileURLToPath(new URL('../screenshots/', import.meta.url));
const save = async (page, name) => {
  await page.screenshot({ path: path.join(screenshotDir, name), fullPage: false });
  console.log(`Captured ${name}`);
};
const waitForContent = async (page) => page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
const dateInBangkok = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const showDate = dateInBangkok(tomorrow);
const customer = { email: 'demo.customer1@example.com', password: 'DemoCustomer2026!' };
const staff = { email: 'soatve.anhduong@example.com', password: 'CinemaStaff2026!' };
const counterCustomer = { name: 'Nguyễn Văn Bình', phone: '0905550011', email: 'binh.quay@example.com' };

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${options?.method ?? 'GET'} ${url}: ${response.status} ${text}`);
  return data;
}

async function login(email, password) {
  return requestJson(`${api}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

const customerAuth = await login(customer.email, customer.password);
const showtimes = await requestJson(`${api}/showtimes?date=${showDate}`);
const showtime = showtimes.find((item) => item.status !== 'CANCELLED');
if (!showtime) throw new Error(`No showtime available on ${showDate} for the customer booking screenshots`);
const movieTitle = showtime.movie.title;
const movieId = showtime.movie.id;
const showtimeTime = showtime.startAt.slice(11, 16);
const seatRows = await requestJson(`${api}/rooms/${showtime.room.id}/seats?showtimeId=${showtime.id}`);
const customerSeat = seatRows.find((seat) => seat.active && seat.status === 'AVAILABLE');
if (!customerSeat) throw new Error(`No free seat remains for showtime ${showtime.id}`);
const customerSeatLabel = `${customerSeat.rowLabel}${customerSeat.seatNumber}`;

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox'],
});

try {
  const customerPage = await browser.newPage({
    viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Bangkok',
  });
  customerPage.on('pageerror', (error) => console.error('Browser error:', error.message));
  await customerPage.goto(`${web}/login`);
  await waitForContent(customerPage);
  await save(customerPage, 'login.png');
  await customerPage.locator('input[type=email]').fill(customer.email);
  await customerPage.locator('input[type=password]').fill(customer.password);
  await customerPage.locator('form button[type=submit]').click();
  await customerPage.waitForURL(`${web}/`);
  await customerPage.getByText(movieTitle).first().waitFor({ timeout: 10000 });
  await save(customerPage, 'home.png');

  await customerPage.goto(`${web}/movies`);
  await customerPage.getByText(movieTitle).first().waitFor();
  await save(customerPage, 'movies.png');
  await customerPage.goto(`${web}/movies/${movieId}`);
  await customerPage.getByText(movieTitle).first().waitFor();
  await save(customerPage, 'movie_detail.png');

  await customerPage.goto(`${web}/showtimes`);
  await customerPage.getByRole('button', { name: /Ngày mai/ }).click();
  await customerPage.getByText(movieTitle).first().waitFor();
  await save(customerPage, 'showtimes.png');
  await customerPage.getByRole('button', { name: new RegExp(showtimeTime) }).first().click();
  await customerPage.waitForURL(new RegExp(`/booking/${showtime.id}$`));
  await customerPage.getByRole('button', { name: customerSeatLabel, exact: true }).waitFor({ state: 'visible' });
  await save(customerPage, 'booking_seats.png');
  await customerPage.getByRole('button', { name: customerSeatLabel, exact: true }).click();
  await save(customerPage, 'booking_seat_selected.png');
  await customerPage.getByRole('button', { name: /Tiếp tục thanh toán/ }).click();
  await customerPage.waitForURL(/\/payment\/\d+$/);
  await customerPage.getByText(movieTitle).first().waitFor();
  await save(customerPage, 'payment_pending.png');
  await customerPage.getByRole('button', { name: /Xác nhận thanh toán ngay/ }).click();
  await customerPage.getByText(/Thanh Toán Thành Công/i).waitFor({ timeout: 10000 });
  await save(customerPage, 'payment_success.png');

  await customerPage.getByRole('link', { name: /Xem vé xem phim của tôi/ }).click();
  await customerPage.getByText(movieTitle).first().waitFor();
  await save(customerPage, 'tickets.png');
  await customerPage.goto(`${web}/bookings`);
  await customerPage.getByText(movieTitle).first().waitFor();
  await save(customerPage, 'bookings.png');
  await customerPage.goto(`${web}/profile`);
  await customerPage.locator('input').first().waitFor();
  await save(customerPage, 'profile.png');

  const refreshedSeats = await requestJson(`${api}/rooms/${showtime.room.id}/seats?showtimeId=${showtime.id}`);
  const counterSeat = refreshedSeats.find((seat) => seat.active && seat.status === 'AVAILABLE');
  if (!counterSeat) throw new Error(`No free seat remains for the counter-sale screenshot on showtime ${showtime.id}`);
  const counterSeatLabel = `${counterSeat.rowLabel}${counterSeat.seatNumber}`;

  const staffPage = await browser.newPage({
    viewport: { width: 1440, height: 1100 }, timezoneId: 'Asia/Bangkok',
  });
  staffPage.on('pageerror', (error) => console.error('Browser error:', error.message));
  await staffPage.goto(`${web}/login`);
  await staffPage.locator('input[type=email]').fill(staff.email);
  await staffPage.locator('input[type=password]').fill(staff.password);
  await staffPage.locator('form button[type=submit]').click();
  await staffPage.waitForURL(`${web}/`);
  await staffPage.goto(`${web}/admin/counter`);
  await staffPage.locator('input[type=date]').fill(showDate);
  const showtimeCard = staffPage.getByRole('button').filter({ hasText: movieTitle }).filter({ hasText: showtimeTime }).first();
  await showtimeCard.waitFor({ timeout: 10000 });
  await showtimeCard.click();
  await staffPage.getByRole('button', { name: counterSeatLabel, exact: true }).waitFor({ state: 'visible' });
  await staffPage.getByRole('button', { name: counterSeatLabel, exact: true }).click();
  await staffPage.locator('input').nth(1).fill(counterCustomer.name);
  await staffPage.locator('input').nth(2).fill(counterCustomer.phone);
  await staffPage.locator('input[type=email]').fill(counterCustomer.email);
  await save(staffPage, 'counter_sale.png');
  await staffPage.getByRole('button', { name: 'Xác nhận đã thu tiền' }).click();
  await staffPage.getByText(/Đã bán vé/).waitFor({ timeout: 10000 });
  await save(staffPage, 'counter_sale_receipt.png');
  const receiptText = await staffPage.locator('section').filter({ hasText: 'Đã bán vé' }).first().innerText();
  console.log(`Counter sale captured for ${counterCustomer.name}, seat ${counterSeatLabel}. ${receiptText.split('\n')[0]}`);

  const adminLoginResponse = await fetch(`${api}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
  });
  if (!adminLoginResponse.ok) throw new Error(`Admin login failed: ${adminLoginResponse.status}`);
  const admin = await adminLoginResponse.json();
  const tickets = await requestJson(`${api}/admin/tickets`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  });
  const validTicket = tickets.find((ticket) => ticket.status === 'VALID');
  if (!validTicket) throw new Error('No VALID ticket available for the check-in screenshot');

  const adminPage = await browser.newPage({
    viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Bangkok',
  });
  await adminPage.goto(`${web}/login`);
  await adminPage.locator('input[type=email]').fill(env.ADMIN_EMAIL);
  await adminPage.locator('input[type=password]').fill(env.ADMIN_PASSWORD);
  await adminPage.locator('form button[type=submit]').click();
  await adminPage.waitForURL(`${web}/`);

  await adminPage.goto(`${web}/admin`);
  await adminPage.getByText('Doanh Thu', { exact: true }).waitFor({ timeout: 10000 });
  await save(adminPage, 'admin_dashboard.png');
  await adminPage.goto(`${web}/admin/movies`);
  await adminPage.getByText(movieTitle).first().waitFor();
  await save(adminPage, 'admin_movies.png');
  await adminPage.goto(`${web}/admin/showtimes`);
  await adminPage.getByText(movieTitle).first().waitFor();
  await save(adminPage, 'admin_showtimes.png');
  await adminPage.goto(`${web}/admin/users`);
  await adminPage.getByText(staff.email).waitFor();
  await save(adminPage, 'admin_users.png');
  await adminPage.goto(`${web}/admin/cinemas`);
  await adminPage.getByText(showtime.cinema.name).first().waitFor();
  await save(adminPage, 'admin_cinemas.png');
  await adminPage.goto(`${web}/admin/sales`);
  await adminPage.getByText(counterCustomer.name).first().waitFor({ timeout: 10000 });
  await save(adminPage, 'admin_sales.png');
  await adminPage.getByRole('row').filter({ hasText: counterCustomer.name }).first().click();
  await adminPage.getByText('Thông tin chi tiết').waitFor();
  await save(adminPage, 'admin_booking_detail.png');
  await adminPage.goto(`${web}/admin/checkin`);
  await adminPage.locator('input[type=text]').fill(validTicket.ticketCode);
  await adminPage.locator('form button[type=submit]').click();
  await adminPage.getByText('VALID', { exact: true }).first().waitFor();
  await save(adminPage, 'admin_checkin.png');

  console.log('Customer online booking, payment, tickets, account, counter sale, sales detail, and admin flows captured from the live app.');
} finally {
  await browser.close();
}
