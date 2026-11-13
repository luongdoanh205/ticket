import assert from 'node:assert/strict';

const base = process.env.FLOW_TEST_API ?? 'http://localhost:8081/api';
const adminEmail = process.env.FLOW_TEST_ADMIN_EMAIL;
const adminPassword = process.env.FLOW_TEST_ADMIN_PASSWORD;
const suffix = Date.now();
const genreName = `Flow Science ${suffix}`;
const movieTitle = `Flow Test Feature ${suffix}`;
const cinemaName = `Flow Test Cinema ${suffix}`;
const roomName = `Flow Screen ${suffix}`;
let checks = 0;

async function call(path, { method = 'GET', token, body, expected } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (expected !== undefined) assert.equal(response.status, expected, `${method} ${path}: ${text}`);
  return { status: response.status, data };
}

function pass(label) {
  checks += 1;
  console.log(`PASS ${label}`);
}

const adminLogin = await call('/auth/login', {
  method: 'POST', body: { email: adminEmail, password: adminPassword }, expected: 200,
});
const adminToken = adminLogin.data.accessToken;
assert.equal(adminLogin.data.user.role, 'ADMIN');
pass('admin login issues ADMIN token');

await call('/admin/users', { token: adminToken, expected: 200 });
pass('admin can list users');
await call('/admin/users', { expected: 401 });
pass('protected admin API rejects anonymous request');

const genre = (await call('/admin/genres', {
  method: 'POST', token: adminToken,
  body: { name: genreName, description: 'Isolated end-to-end flow fixture' }, expected: 201,
})).data;
const movie = (await call('/admin/movies', {
  method: 'POST', token: adminToken,
  body: {
    title: movieTitle, description: 'Flow verification movie', duration: 110,
    releaseDate: '2026-11-01', posterUrl: '', director: 'Test Director', castNames: 'Test Cast',
    status: 'NOW_SHOWING', genreIds: [genre.id],
  }, expected: 201,
})).data;
const cinema = (await call('/admin/cinemas', {
  method: 'POST', token: adminToken,
  body: { name: cinemaName, address: 'Test address', phone: '0200000000', status: 'ACTIVE' }, expected: 201,
})).data;
const room = (await call('/admin/rooms', {
  method: 'POST', token: adminToken,
  body: { cinemaId: cinema.id, name: roomName, roomType: '2D', status: 'ACTIVE' }, expected: 201,
})).data;
const seats = [];
for (const number of [1, 2, 3]) {
  seats.push((await call('/admin/seats', {
    method: 'POST', token: adminToken,
    body: { roomId: room.id, rowLabel: 'A', seatNumber: number, seatType: 'STANDARD', active: true },
    expected: 201,
  })).data);
}
pass('admin creates genre, movie, cinema, room, and seats');

const nowParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
}).formatToParts(new Date());
const part = type => nowParts.find(item => item.type === type).value;
const tomorrow = new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')) + 1));
const date = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrow.getUTCDate()).padStart(2, '0')}`;
const startAt = `${date}T19:30:00`;
const endAt = `${date}T21:30:00`;
await call('/admin/showtimes', {
  method: 'POST', token: adminToken,
  body: { movieId: movie.id, roomId: room.id, startAt, endAt, basePrice: 90000, status: 'AVAILABLE' },
  expected: 201,
});
const catalog = await call(`/movies?q=${encodeURIComponent(movieTitle)}&size=20`, { expected: 200 });
assert.equal(catalog.data.totalElements, 1);
assert.equal(catalog.data.content[0].genres[0].id, genre.id);
const shows = await call(`/showtimes?date=${date}`, { expected: 200 });
const showtime = shows.data.find(item => item.movie.id === movie.id);
assert.ok(showtime, 'new showtime should be visible in the public catalog');
const rooms = await call(`/cinemas/${cinema.id}/rooms`, { expected: 200 });
assert.equal(rooms.data[0].id, room.id);
pass('public catalog exposes movie, genre, cinema, room and showtime');

const customer = {
  fullName: 'Flow Customer', email: `flow.customer.${suffix}@example.com`, password: 'FlowCustomer2026!', phone: '0900000000',
};
await call('/auth/register', { method: 'POST', body: customer, expected: 201 });
const invalidLogin = await call('/auth/login', {
  method: 'POST', body: { email: customer.email, password: 'wrong-password' }, expected: 401,
});
assert.equal(invalidLogin.data.code, 'INVALID_CREDENTIALS');
const customerLogin = await call('/auth/login', {
  method: 'POST', body: { email: customer.email, password: customer.password }, expected: 200,
});
const customerToken = customerLogin.data.accessToken;
await call('/bookings', { token: customerToken, expected: 200 });
const me = await call('/me', { token: customerToken, expected: 200 });
assert.equal(me.data.email, customer.email);
await call('/me', {
  method: 'PUT', token: customerToken,
  body: { fullName: 'Flow Customer Updated', phone: '0911111111' }, expected: 200,
});
await call('/admin/users', { token: customerToken, expected: 403 });
pass('customer register, invalid/valid login, profile update, and role restriction');

const noAuthBookings = await call('/bookings', { expected: 401 });
assert.equal(noAuthBookings.status, 401);
const canceledBooking = (await call('/bookings', {
  method: 'POST', token: customerToken, body: { showtimeId: showtime.id, seatIds: [seats[0].id] }, expected: 201,
})).data;
assert.equal(canceledBooking.status, 'PENDING');
const conflict = await call('/bookings', {
  method: 'POST', token: customerToken, body: { showtimeId: showtime.id, seatIds: [seats[0].id] }, expected: 409,
});
assert.match(conflict.data.message, /SEAT_UNAVAILABLE/);
await call(`/bookings/${canceledBooking.id}/cancel`, { method: 'POST', token: customerToken, expected: 200 });
const seatsAfterCancel = await call(`/rooms/${room.id}/seats?showtimeId=${showtime.id}`, { expected: 200 });
assert.equal(seatsAfterCancel.data.find(seat => seat.id === seats[0].id).status, 'AVAILABLE');
pass('seat hold, duplicate hold conflict, cancellation and seat release');

const paidBooking = (await call('/bookings', {
  method: 'POST', token: customerToken,
  body: { showtimeId: showtime.id, seatIds: [seats[0].id, seats[1].id] }, expected: 201,
})).data;
const amountMismatch = await call(`/bookings/${paidBooking.id}/payments`, {
  method: 'POST', token: customerToken,
  body: { method: 'MOCK', transactionRef: `mismatch-${suffix}`, amount: 1, success: true }, expected: 409,
});
assert.equal(amountMismatch.data.code, 'PAYMENT_AMOUNT_MISMATCH');
await call(`/bookings/${paidBooking.id}/payments`, {
  method: 'POST', token: customerToken,
  body: { method: 'MOCK', transactionRef: `success-${suffix}`, amount: paidBooking.totalAmount, success: true }, expected: 200,
});
const bookingAfterPay = await call(`/bookings/${paidBooking.id}`, { token: customerToken, expected: 200 });
assert.equal(bookingAfterPay.data.status, 'PAID');
const tickets = await call('/tickets', { token: customerToken, expected: 200 });
const issued = tickets.data.filter(ticket => ticket.bookingId === paidBooking.id);
assert.equal(issued.length, 2);
const checkin = await call(`/admin/tickets/${issued[0].ticketCode}/validate`, { token: adminToken, expected: 200 });
assert.equal(checkin.data.status, 'VALID');
await call(`/admin/tickets/${issued[0].ticketCode}/use`, { method: 'POST', token: adminToken, expected: 200 });
const ticketsAfterCheckin = await call('/tickets', { token: customerToken, expected: 200 });
assert.equal(ticketsAfterCheckin.data.find(ticket => ticket.ticketCode === issued[0].ticketCode).status, 'USED');
const paidCancel = await call(`/bookings/${paidBooking.id}/cancel`, { method: 'POST', token: customerToken, expected: 409 });
assert.match(paidCancel.data.message, /BOOKING_NOT_CANCELLABLE/);
pass('payment mismatch rejection, successful payment, ticket issue, check-in, and paid-order cancellation guard');

const from = `${part('year')}-${part('month')}-${part('day')}`;
const dashboard = await call(`/admin/dashboard?from=${from}&to=${date}`, { token: adminToken, expected: 200 });
assert.equal(dashboard.data.revenue, 180000);
assert.equal(dashboard.data.paidTickets, 2);
assert.equal(dashboard.data.bookingsByStatus.CANCELLED, 1);
pass('admin revenue dashboard reflects paid flow');

const passwordChange = await call('/me/change-password', {
  method: 'POST', token: customerToken,
  body: { oldPassword: customer.password, newPassword: 'FlowCustomerChanged2026!' }, expected: 200,
});
assert.equal(passwordChange.data.status, 'updated');
await call('/auth/login', {
  method: 'POST', body: { email: customer.email, password: 'FlowCustomerChanged2026!' }, expected: 200,
});
pass('password change and relogin');

console.log(`ALL ${checks} FLOW GROUPS PASSED`);
