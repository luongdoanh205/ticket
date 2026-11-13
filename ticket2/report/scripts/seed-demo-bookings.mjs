import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.match(/^([^#=]+)=(.*)$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value]),
);
const base = process.env.API_BASE ?? 'http://127.0.0.1:8080/api';
const customerPassword = 'DemoCustomer2026!';

async function request(path, { method = 'GET', token, body, expected } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (expected !== undefined && response.status !== expected) {
    throw new Error(`${method} ${path}: expected ${expected}, got ${response.status}: ${text}`);
  }
  return { status: response.status, data };
}

const adminLogin = await request('/auth/login', {
  method: 'POST', body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }, expected: 200,
});
const adminToken = adminLogin.data.accessToken;

const genres = (await request('/genres', { expected: 200 })).data;
const sciFiGenre = genres.find((genre) => genre.id === 1);
if (sciFiGenre && sciFiGenre.name !== 'Khoa học viễn tưởng') {
  await request(`/admin/genres/${sciFiGenre.id}`, {
    method: 'PUT', token: adminToken,
    body: { name: 'Khoa học viễn tưởng', description: 'Phim về khoa học, công nghệ và những chuyến du hành tương lai.' },
    expected: 200,
  });
}

const movies = (await request('/movies?size=100', { expected: 200 })).data.content;
const localizedTitles = new Map([[1, 'Hành Trình Qua Ngân Hà'], [2, 'Thành Phố Tương Lai']]);
for (const movie of movies) {
  const title = localizedTitles.get(movie.id);
  if (title && movie.title !== title) {
    await request(`/admin/movies/${movie.id}`, {
      method: 'PUT', token: adminToken,
      body: {
        title, description: movie.description, duration: movie.duration, releaseDate: movie.releaseDate,
        posterUrl: movie.posterUrl, director: movie.director, castNames: movie.castNames,
        status: movie.status, genreIds: movie.genres.map((genre) => genre.id),
      },
      expected: 200,
    });
  }
}

const upcomingMovie = movies.find((movie) => movie.id === 2);
if (upcomingMovie) {
  const releaseDateShows = await request(`/showtimes?date=${upcomingMovie.releaseDate}`, { expected: 200 });
  const hasReleaseShowtime = releaseDateShows.data.some((showtime) => showtime.movie.id === upcomingMovie.id);
  if (!hasReleaseShowtime) {
    await request('/admin/showtimes', {
      method: 'POST', token: adminToken,
      body: {
        movieId: upcomingMovie.id, roomId: 1,
        startAt: `${upcomingMovie.releaseDate}T19:30:00`, endAt: `${upcomingMovie.releaseDate}T21:25:00`,
        basePrice: 90000, status: 'AVAILABLE',
      },
      expected: 201,
    });
  }
}

const cinemas = (await request('/cinemas', { expected: 200 })).data;
const mainCinema = cinemas.find((cinema) => cinema.id === 1);
if (mainCinema && mainCinema.name !== 'Rạp Ánh Dương - Quận 3') {
  await request('/admin/cinemas/1', {
    method: 'PUT', token: adminToken,
    body: {
      name: 'Rạp Ánh Dương - Quận 3', address: '123 Điện Biên Phủ, Quận 3, TP. Hồ Chí Minh',
      phone: mainCinema.phone, status: mainCinema.status,
    },
    expected: 200,
  });
}
const rooms = (await request('/cinemas/1/rooms', { expected: 200 })).data;
const mainRoom = rooms.find((room) => room.id === 1);
if (mainRoom && mainRoom.name !== 'Phòng chiếu 01') {
  await request('/admin/rooms/1', {
    method: 'PUT', token: adminToken,
    body: { cinemaId: 1, name: 'Phòng chiếu 01', roomType: mainRoom.roomType, status: mainRoom.status },
    expected: 200,
  });
}

const listedUsers = await request('/admin/users', { token: adminToken, expected: 200 });
const knownEmails = new Set(listedUsers.data.map((user) => user.email));
const employees = [
  { fullName: 'Võ Thanh Thảo', email: 'quanly.anhduong@example.com', phone: '0902468135', role: 'MANAGER', password: 'CinemaManager2026!' },
  { fullName: 'Đỗ Quốc Bảo', email: 'soatve.anhduong@example.com', phone: '0901357924', role: 'STAFF', password: 'CinemaStaff2026!' },
];
for (const employee of employees) {
  let user = listedUsers.data.find((candidate) => candidate.email === employee.email);
  if (!user) {
    user = (await request('/auth/register', {
      method: 'POST',
      body: {
        fullName: employee.fullName, email: employee.email,
        password: employee.password, phone: employee.phone,
      },
      expected: 201,
    })).data;
  }
  await request(`/admin/users/${user.id}`, {
    method: 'PATCH', token: adminToken, body: { role: employee.role, status: 'ACTIVE' }, expected: 200,
  });
  const employeeLogin = await request('/auth/login', {
    method: 'POST', body: { email: employee.email, password: employee.password }, expected: 200,
  });
  if (employeeLogin.data.user.role !== employee.role) {
    throw new Error(`${employee.email} should have role ${employee.role}`);
  }
  employee.token = employeeLogin.data.accessToken;
  await request('/me', {
    method: 'PUT', token: employee.token,
    body: { fullName: employee.fullName, phone: employee.phone }, expected: 200,
  });
  knownEmails.add(employee.email);
  console.log(`READY ${employee.role}: ${employee.fullName}; ${employee.email}`);
}

const customers = [
  { label: 'đơn đã thanh toán, 1 ghế', fullName: 'Nguyễn Minh Anh', email: 'demo.customer1@example.com', phone: '0901234567', seats: 1, paid: true },
  { label: 'đơn đã thanh toán, 2 ghế', fullName: 'Trần Gia Huy', email: 'demo.customer2@example.com', phone: '0912345678', seats: 2, paid: true },
  { label: 'đơn đã hủy', fullName: 'Lê Khánh Linh', email: 'demo.customer3@example.com', phone: '0987654321', seats: 1, paid: false },
];

for (const customer of customers) {
  if (!knownEmails.has(customer.email)) {
    await request('/auth/register', {
      method: 'POST',
      body: { fullName: customer.fullName, email: customer.email, password: customerPassword, phone: customer.phone },
      expected: 201,
    });
  }
  const login = await request('/auth/login', {
    method: 'POST', body: { email: customer.email, password: customerPassword }, expected: 200,
  });
  customer.token = login.data.accessToken;
  customer.userId = login.data.user.id;
  await request('/me', {
    method: 'PUT', token: customer.token,
    body: { fullName: customer.fullName, phone: customer.phone }, expected: 200,
  });
  const bookings = await request('/bookings', { token: customer.token, expected: 200 });
  customer.existing = bookings.data.find((booking) => booking.showtime?.id === 1);
}

const showtimeDateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
}).formatToParts(new Date());
const part = (type) => showtimeDateParts.find((item) => item.type === type).value;
const tomorrowDate = new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')) + 1));
const date = `${tomorrowDate.getUTCFullYear()}-${String(tomorrowDate.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getUTCDate()).padStart(2, '0')}`;
const shows = await request(`/showtimes?date=${date}`, { expected: 200 });
const showtime = shows.data.find((item) => item.id === 1);
if (!showtime) throw new Error(`Expected existing showtime #1 on ${date}; found ${shows.data.length} showtimes`);

let seats = await request(`/rooms/${showtime.room.id}/seats?showtimeId=${showtime.id}`, { expected: 200 });
const available = seats.data
  .filter((seat) => seat.active && seat.status === 'AVAILABLE' && seat.seatType === 'STANDARD')
  .sort((a, b) => a.rowLabel.localeCompare(b.rowLabel) || a.seatNumber - b.seatNumber);
const required = customers.filter((customer) => !customer.existing).reduce((sum, customer) => sum + customer.seats, 0);
if (available.length < required) throw new Error(`Need ${required} free standard seats; only ${available.length} are available`);
let cursor = 0;

for (const customer of customers) {
  let booking = customer.existing;
  if (!booking) {
    const selectedSeats = available.slice(cursor, cursor + customer.seats);
    cursor += customer.seats;
    booking = (await request('/bookings', {
      method: 'POST', token: customer.token,
      body: { showtimeId: showtime.id, seatIds: selectedSeats.map((seat) => seat.id) }, expected: 201,
    })).data;
    if (customer.paid) {
      await request(`/bookings/${booking.id}/payments`, {
        method: 'POST', token: customer.token,
        body: {
          method: 'MOCK', transactionRef: `demo-seed-${booking.id}`,
          amount: booking.totalAmount, success: true,
        }, expected: 200,
      });
    } else {
      booking = (await request(`/bookings/${booking.id}/cancel`, {
        method: 'POST', token: customer.token, expected: 200,
      })).data;
    }
  }
  const confirmed = await request(`/bookings/${booking.id}`, { token: customer.token, expected: 200 });
  console.log(`READY ${customer.label}: ${customer.email}; booking #${booking.id}; status ${confirmed.data.status}`);
}

const failedPaymentCustomer = customers[2];
const failedFlowBookings = await request('/bookings', { token: failedPaymentCustomer.token, expected: 200 });
const hasFailedPayment = failedFlowBookings.data.some((booking) =>
  booking.payments.some((payment) => payment.status === 'FAILED'),
);
if (!hasFailedPayment) {
  seats = await request(`/rooms/${showtime.room.id}/seats?showtimeId=${showtime.id}`, { expected: 200 });
  const freeSeat = seats.data.find((seat) => seat.active && seat.status === 'AVAILABLE' && seat.seatType === 'STANDARD');
  if (!freeSeat) throw new Error('Need one free standard seat to seed a failed payment flow');
  const failedBooking = (await request('/bookings', {
    method: 'POST', token: failedPaymentCustomer.token,
    body: { showtimeId: showtime.id, seatIds: [freeSeat.id] }, expected: 201,
  })).data;
  await request(`/bookings/${failedBooking.id}/payments`, {
    method: 'POST', token: failedPaymentCustomer.token,
    body: {
      method: 'MOCK', transactionRef: `demo-seed-failed-${failedBooking.id}`,
      amount: failedBooking.totalAmount, success: false,
    }, expected: 200,
  });
  await request(`/bookings/${failedBooking.id}/cancel`, {
    method: 'POST', token: failedPaymentCustomer.token, expected: 200,
  });
  console.log(`READY failed-payment flow: ${failedPaymentCustomer.email}; booking #${failedBooking.id}; payment FAILED; seat released`);
}

const adminBookings = await request('/admin/bookings', { token: adminToken, expected: 200 });
const adminPayments = await request('/admin/payments', { token: adminToken, expected: 200 });
let adminTickets = await request('/admin/tickets', { token: adminToken, expected: 200 });
const ticketToCheckIn = adminTickets.data.some((ticket) => ticket.status === 'USED')
  ? undefined
  : adminTickets.data.find((ticket) => ticket.status === 'VALID');
if (ticketToCheckIn) {
  await request(`/admin/tickets/${ticketToCheckIn.ticketCode}/use`, {
    method: 'POST', token: adminToken, expected: 200,
  });
  console.log(`READY checked-in ticket: ticket #${ticketToCheckIn.id}; status USED`);
}
adminTickets = await request('/admin/tickets', { token: adminToken, expected: 200 });
const firstTicket = adminTickets.data[0];
const today = part('day') ? `${part('year')}-${part('month')}-${part('day')}` : date;
const dashboardPath = `/admin/dashboard?from=${today}&to=${date}`;
await request(dashboardPath, { token: adminToken, expected: 200 });
await request('/admin/users', { token: employees[0].token, expected: 403 });
await request(dashboardPath, { token: employees[1].token, expected: 403 });
await request(`/admin/tickets/${firstTicket.ticketCode}/validate`, { token: employees[1].token, expected: 200 });
await request('/admin/bookings', { token: employees[0].token, expected: 200 });
await request('/admin/bookings', { token: employees[1].token, expected: 403 });
await request('/admin/dashboard?from=2026-01-01&to=2026-12-31', { token: customers[0].token, expected: 403 });
const finalUsers = (await request('/admin/users', { token: adminToken, expected: 200 })).data;
const roleCounts = finalUsers.reduce((counts, user) => {
  counts[user.role] = (counts[user.role] ?? 0) + 1;
  return counts;
}, {});
console.log(`SUMMARY roles=${JSON.stringify(roleCounts)} bookings=${adminBookings.data.length} payments=${adminPayments.data.length} tickets=${adminTickets.data.length}; payment statuses=${adminPayments.data.map((payment) => payment.status).join(',')}; ticket statuses=${adminTickets.data.map((ticket) => ticket.status).join(',')}`);
console.log(`SHOWTIME ${showtime.movie.title} — ${showtime.cinema.name}, ${date} ${showtime.startAt.slice(11, 16)}`);
console.log(`DEMO_PASSWORD ${customerPassword}`);
