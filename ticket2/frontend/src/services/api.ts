import axios from 'axios';
import type {
  AuthResponse,
  User,
  Movie,
  Genre,
  Cinema,
  Room,
  Seat,
  Showtime,
  Booking,
  Ticket,
  AdminDashboardData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: { fullName: string; email: string; password: string; phone?: string | null }): Promise<User> => {
    const res = await api.post<User>('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/me');
    return res.data;
  },
  updateMe: async (data: { fullName: string; phone?: string | null }): Promise<User> => {
    const res = await api.put<User>('/me', data);
    return res.data;
  },
  changePassword: async (data: { oldPassword: string; newPassword: string }): Promise<{ status: string }> => {
    const res = await api.post<{ status: string }>('/me/change-password', data);
    return res.data;
  },
};

export const movieApi = {
  getMovies: async (params?: { q?: string; status?: string; genreId?: number; page?: number; size?: number }): Promise<{ content: Movie[]; totalElements: number; page: number; size: number }> => {
    const res = await api.get('/movies', { params });
    return res.data;
  },
  getMovieById: async (id: number): Promise<Movie> => {
    const res = await api.get<Movie>(`/movies/${id}`);
    return res.data;
  },
  getGenres: async (): Promise<Genre[]> => {
    const res = await api.get<Genre[]>('/genres');
    return res.data;
  },
};

export const cinemaApi = {
  getCinemas: async (): Promise<Cinema[]> => {
    const res = await api.get<Cinema[]>('/cinemas');
    return res.data;
  },
  getCinemaRooms: async (cinemaId: number): Promise<Room[]> => {
    const res = await api.get<Room[]>(`/cinemas/${cinemaId}/rooms`);
    return res.data;
  },
  getRoomSeats: async (roomId: number, showtimeId?: number): Promise<Seat[]> => {
    const res = await api.get<Seat[]>(`/rooms/${roomId}/seats`, {
      params: showtimeId ? { showtimeId } : undefined,
    });
    return res.data;
  },
};

export const showtimeApi = {
  getShowtimes: async (date: string, movieId?: number, cinemaId?: number): Promise<Showtime[]> => {
    const res = await api.get<Showtime[]>('/showtimes', {
      params: { date, movieId, cinemaId },
    });
    return res.data;
  },
};

export const bookingApi = {
  createBooking: async (data: { showtimeId: number; seatIds: number[] }): Promise<Booking> => {
    const res = await api.post<Booking>('/bookings', data);
    return res.data;
  },
  getBookings: async (): Promise<Booking[]> => {
    const res = await api.get<Booking[]>('/bookings');
    return res.data;
  },
  getBookingById: async (id: number): Promise<Booking> => {
    const res = await api.get<Booking>(`/bookings/${id}`);
    return res.data;
  },
  cancelBooking: async (id: number): Promise<{ id: number; status: string }> => {
    const res = await api.post<{ id: number; status: string }>(`/bookings/${id}/cancel`);
    return res.data;
  },
  createPayment: async (
    bookingId: number,
    data: { method: string; transactionRef: string; amount: number; success: boolean }
  ): Promise<{ paymentId: number; paymentStatus: string; bookingStatus: string }> => {
    const res = await api.post(`/bookings/${bookingId}/payments`, data);
    return res.data;
  },
  getTickets: async (): Promise<Ticket[]> => {
    const res = await api.get<Ticket[]>('/tickets');
    return res.data;
  },
};

export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/admin/users');
    return res.data;
  },
  updateUser: async (id: number, data: { status?: string; role?: string }): Promise<User> => {
    const res = await api.patch<User>(`/admin/users/${id}`, data);
    return res.data;
  },
  createMovie: async (movie: Partial<Movie> & { genreIds?: number[] }): Promise<Movie> => {
    const res = await api.post<Movie>('/admin/movies', movie);
    return res.data;
  },
  updateMovie: async (id: number, movie: Partial<Movie> & { genreIds?: number[] }): Promise<Movie> => {
    const res = await api.put<Movie>(`/admin/movies/${id}`, movie);
    return res.data;
  },
  deleteMovie: async (id: number): Promise<void> => {
    await api.delete(`/admin/movies/${id}`);
  },
  createGenre: async (genre: { name: string; description?: string }): Promise<Genre> => {
    const res = await api.post<Genre>('/admin/genres', genre);
    return res.data;
  },
  updateGenre: async (id: number, genre: { name: string; description?: string }): Promise<Genre> => {
    const res = await api.put<Genre>(`/admin/genres/${id}`, genre);
    return res.data;
  },
  deleteGenre: async (id: number): Promise<void> => {
    await api.delete(`/admin/genres/${id}`);
  },
  createCinema: async (cinema: Partial<Cinema>): Promise<Cinema> => {
    const res = await api.post<Cinema>('/admin/cinemas', cinema);
    return res.data;
  },
  updateCinema: async (id: number, cinema: Partial<Cinema>): Promise<Cinema> => {
    const res = await api.put<Cinema>(`/admin/cinemas/${id}`, cinema);
    return res.data;
  },
  createRoom: async (room: { cinemaId: number; name: string; roomType: string; status?: string }): Promise<Room> => {
    const res = await api.post<Room>('/admin/rooms', room);
    return res.data;
  },
  updateRoom: async (id: number, room: { cinemaId?: number; name?: string; roomType?: string; status?: string }): Promise<Room> => {
    const res = await api.put<Room>(`/admin/rooms/${id}`, room);
    return res.data;
  },
  createSeat: async (seat: { roomId: number; rowLabel: string; seatNumber: number; seatType: string; active?: boolean }): Promise<Seat> => {
    const res = await api.post<Seat>('/admin/seats', seat);
    return res.data;
  },
  updateSeat: async (id: number, seat: Partial<Seat>): Promise<Seat> => {
    const res = await api.put<Seat>(`/admin/seats/${id}`, seat);
    return res.data;
  },
  createShowtime: async (data: {
    movieId: number;
    roomId: number;
    startAt: string;
    endAt: string;
    basePrice: number;
    status: string;
  }): Promise<Showtime> => {
    const res = await api.post<Showtime>('/admin/showtimes', data);
    return res.data;
  },
  updateShowtime: async (
    id: number,
    data: {
      movieId?: number;
      roomId?: number;
      startAt?: string;
      endAt?: string;
      basePrice?: number;
      status?: string;
    }
  ): Promise<Showtime> => {
    const res = await api.put<Showtime>(`/admin/showtimes/${id}`, data);
    return res.data;
  },
  deleteShowtime: async (id: number): Promise<void> => {
    await api.delete(`/admin/showtimes/${id}`);
  },
  getAdminBookings: async (): Promise<any[]> => {
    const res = await api.get('/admin/bookings');
    return res.data;
  },
  getAdminPayments: async (): Promise<any[]> => {
    const res = await api.get('/admin/payments');
    return res.data;
  },
  getAdminTickets: async (): Promise<any[]> => {
    const res = await api.get('/admin/tickets');
    return res.data;
  },
  validateTicket: async (code: string): Promise<{ valid: boolean; status: string; showtimeId: number; seatId: number }> => {
    const res = await api.get(`/admin/tickets/${encodeURIComponent(code)}/validate`);
    return res.data;
  },
  useTicket: async (code: string): Promise<{ ticketCode: string; status: string }> => {
    const res = await api.post(`/admin/tickets/${encodeURIComponent(code)}/use`);
    return res.data;
  },
  getDashboard: async (from: string, to: string): Promise<AdminDashboardData> => {
    const res = await api.get<AdminDashboardData>('/admin/dashboard', {
      params: { from, to },
    });
    return res.data;
  },
};

export default api;
