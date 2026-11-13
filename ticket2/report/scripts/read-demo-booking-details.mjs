import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).map((line) => line.match(/^([^#=]+)=(.*)$/)).filter(Boolean)
    .map(([, key, value]) => [key, value]),
);
const base = process.env.API_BASE ?? 'http://127.0.0.1:8080/api';
const customers = [
  { name: 'Nguyễn Minh Anh', email: 'demo.customer1@example.com' },
  { name: 'Trần Gia Huy', email: 'demo.customer2@example.com' },
  { name: 'Lê Khánh Linh', email: 'demo.customer3@example.com' },
];

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${text}`);
  return data;
}

const rows = [];
for (const customer of customers) {
  const login = await request('/auth/login', {
    method: 'POST', body: { email: customer.email, password: 'DemoCustomer2026!' },
  });
  const [bookings, tickets] = await Promise.all([
    request('/bookings', { token: login.accessToken }),
    request('/tickets', { token: login.accessToken }),
  ]);
  for (const booking of bookings) {
    rows.push({
      customer: customer.name,
      email: customer.email,
      bookingId: booking.id,
      status: booking.status,
      movie: booking.showtime?.movie?.title,
      cinema: booking.showtime?.cinema?.name,
      room: booking.showtime?.room?.name,
      startAt: booking.showtime?.startAt,
      seats: (booking.seats ?? []).map((seat) => `${seat.rowLabel}${seat.seatNumber} (${seat.holdStatus})`),
      totalAmount: booking.totalAmount,
      payments: (booking.payments ?? []).map((payment) => ({ id: payment.id, status: payment.status, amount: payment.amount, method: payment.method })),
      tickets: tickets.filter((ticket) => ticket.bookingId === booking.id).map((ticket) => ({ id: ticket.id, status: ticket.status, seat: `${ticket.rowLabel}${ticket.seatNumber}` })),
    });
  }
}

console.log(JSON.stringify(rows, null, 2));
