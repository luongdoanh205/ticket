export type Role = 'CUSTOMER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'LOCKED';
export type MovieStatus = 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';
export type ShowtimeStatus = 'AVAILABLE' | 'FULL' | 'CANCELLED';
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD' | 'INACTIVE';
export type BookingStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';
export type SeatType = 'STANDARD' | 'VIP' | 'DOUBLE' | string;

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  status?: AccountStatus;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Genre {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Movie {
  id: number;
  title: string;
  description?: string;
  duration: number; // in minutes
  releaseDate?: string;
  posterUrl?: string;
  director?: string;
  castNames?: string;
  status: MovieStatus;
  genres: Genre[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Cinema {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  id: number;
  cinema?: Cinema;
  cinemaId?: number;
  name: string;
  roomType: string; // 2D, 3D, IMAX, etc.
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Seat {
  id: number;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
  active: boolean;
  status?: SeatStatus; // when queried with showtimeId
}

export interface Showtime {
  id: number;
  movie: {
    id: number;
    title: string;
    posterUrl?: string;
    duration?: number;
  };
  cinema: {
    id: number;
    name: string;
  };
  room: {
    id: number;
    name: string;
    roomType?: string;
  };
  startAt: string; // ISO local datetime
  endAt: string;
  basePrice: number;
  status: ShowtimeStatus;
}

export interface BookingSeat {
  seatId: number;
  rowLabel: string;
  seatNumber: number;
  unitPrice: number;
  holdStatus: 'HELD' | 'RELEASED' | 'SOLD';
}

export interface Payment {
  id: number;
  method: string;
  amount: number;
  status: PaymentStatus;
  transactionRef: string;
  paidAt?: string;
}

export interface Booking {
  id: number;
  status: BookingStatus;
  totalAmount: number;
  holdExpiresAt: string;
  createdAt?: string;
  showtime?: Showtime;
  seats?: BookingSeat[];
  payments?: Payment[];
  seatIds?: number[];
}

export interface Ticket {
  id: number;
  ticketCode: string;
  status: TicketStatus;
  issuedAt?: string;
  usedAt?: string;
  bookingId: number;
  movie: string | { id: number; title: string };
  cinema: string | { id: number; name: string };
  room: string | { id: number; name: string };
  startAt: string;
  rowLabel: string;
  seatNumber: number;
  price: number;
}

export interface AdminDashboardData {
  paidTickets: number;
  bookingsByStatus: {
    PENDING: number;
    PAID: number;
    CANCELLED: number;
    EXPIRED: number;
  };
  revenue: number;
  from: string;
  to: string;
}
