import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { ShowtimesPage } from './pages/ShowtimesPage';
import { BookingSeatPage } from './pages/BookingSeatPage';
import { PaymentPage } from './pages/PaymentPage';
import { TicketsPage } from './pages/TicketsPage';
import { BookingsHistoryPage } from './pages/BookingsHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMoviesPage } from './pages/admin/AdminMoviesPage';
import { AdminShowtimesPage } from './pages/admin/AdminShowtimesPage';
import { AdminCheckinPage } from './pages/admin/AdminCheckinPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCinemasPage } from './pages/admin/AdminCinemasPage';
import { AdminSalesPage } from './pages/admin/AdminSalesPage';
import { AdminCounterSalePage } from './pages/admin/AdminCounterSalePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Website Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movies/:id" element={<MovieDetailsPage />} />
            <Route path="/showtimes" element={<ShowtimesPage />} />
            <Route path="/booking/:showtimeId" element={<BookingSeatPage />} />
            <Route path="/payment/:bookingId" element={<PaymentPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/bookings" element={<BookingsHistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<AuthPage initialMode="login" />} />
            <Route path="/register" element={<AuthPage initialMode="register" />} />

            {/* Admin Portal Nested Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="movies" element={<AdminMoviesPage />} />
              <Route path="showtimes" element={<AdminShowtimesPage />} />
              <Route path="sales" element={<AdminSalesPage />} />
              <Route path="checkin" element={<AdminCheckinPage />} />
              <Route path="counter" element={<AdminCounterSalePage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="cinemas" element={<AdminCinemasPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
