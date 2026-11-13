import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import type { AdminBooking, AdminDashboardData } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowRight, CalendarPlus, CheckCircle, Clock, DollarSign, ReceiptText, Ticket, UserRound } from 'lucide-react';
import { toLocalDateString } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom] = useState<string>(toLocalDateString(firstDayOfMonth));
  const [to, setTo] = useState<string>(toLocalDateString(today));
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [recentBookings, setRecentBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusLabel: Record<string, string> = { PAID: 'Đã thanh toán', PENDING: 'Chờ thanh toán', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn' };

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const [res, bookings] = await Promise.all([adminApi.getDashboard(from, to), adminApi.getAdminBookings()]);
      setData(res);
      setRecentBookings(bookings.slice(0, 5));
    } catch (err) {
      console.error('Lỗi tải báo cáo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [from, to]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="space-y-8">
      {/* Date filter bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">Thống Kê Doanh Thu & Đơn Hàng</h2>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Từ ngày:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Đến ngày:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-medium"
            />
          </div>

          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-xs"
          >
            Lọc số liệu
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Đang tính toán số liệu thống kê..." size="md" />
      ) : data ? (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Doanh Thu</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                {formatPrice(data.revenue || 0)}
              </p>
              <span className="text-[11px] font-medium text-slate-400 block">
                Từ {data.from} đến {data.to}
              </span>
            </div>

            {/* Paid Tickets */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Vé Đã Bán</span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Ticket className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {data.paidTickets || 0} vé
              </p>
              <span className="text-[11px] font-medium text-slate-400 block">Toàn hệ thống</span>
            </div>

            {/* Paid Bookings */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Đơn Hoàn Tất</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {data.bookingsByStatus?.PAID || 0} đơn
              </p>
              <span className="text-[11px] font-medium text-slate-400 block">Trạng thái PAID</span>
            </div>

            {/* Pending Bookings */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Đơn Chờ Giữ</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 font-mono">
                {data.bookingsByStatus?.PENDING || 0} đơn
              </p>
              <span className="text-[11px] font-medium text-slate-400 block">Đang trong thời gian giữ</span>
            </div>
          </div>

          {/* Breakdown by Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div><h3 className="text-base font-bold text-slate-900">Phân Bổ Trạng Thái Đơn Hàng</h3><p className="mt-1 text-xs text-slate-400">Các trạng thái đơn và số vé là toàn hệ thống; doanh thu ở trên theo khoảng ngày đã chọn.</p></div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs text-emerald-700 font-bold block">Đã thanh toán (PAID)</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {data.bookingsByStatus?.PAID || 0}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs text-amber-700 font-bold block">Chờ thanh toán (PENDING)</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {data.bookingsByStatus?.PENDING || 0}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs text-rose-700 font-bold block">Đã hủy (CANCELLED)</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {data.bookingsByStatus?.CANCELLED || 0}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-600 font-bold block">Hết hạn (EXPIRED)</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {data.bookingsByStatus?.EXPIRED || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div><h3 className="font-extrabold text-slate-900">Đơn đặt vé gần đây</h3><p className="mt-1 text-xs text-slate-400">Có tên khách, phim, ghế và tình trạng thanh toán</p></div>
                <Link to="/admin/sales" className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-600 hover:text-rose-700">Tất cả giao dịch <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentBookings.map((booking) => <Link to="/admin/sales" key={booking.id} className="grid gap-2 px-5 py-4 transition hover:bg-rose-50/40 sm:grid-cols-[1.2fr_1.6fr_auto] sm:items-center">
                  <div><p className="text-sm font-extrabold text-slate-900">{booking.customerName}</p><p className="text-xs text-slate-400">{booking.email} · Đơn #{booking.id}</p></div>
                  <div><p className="max-w-64 truncate text-sm font-bold text-slate-700">{booking.movieTitle}</p><p className="text-xs text-slate-400">Ghế {booking.seats.map((seat) => seat.label).join(', ') || '—'} · {booking.cinemaName}</p></div>
                  <div className="flex items-center justify-between gap-3 sm:block sm:text-right"><p className="text-sm font-extrabold text-slate-900">{formatPrice(booking.totalAmount)}</p><span className={`text-[10px] font-black ${booking.status === 'PAID' ? 'text-emerald-600' : booking.status === 'PENDING' ? 'text-amber-600' : 'text-slate-500'}`}>{statusLabel[booking.status] ?? booking.status}</span></div>
                </Link>)}
                {recentBookings.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Chưa có đơn hàng.</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="font-extrabold text-slate-900">Truy cập nhanh</h3><p className="mt-1 text-xs text-slate-400">Các tác vụ vận hành thường dùng</p>
              <div className="mt-4 grid gap-2">
                <Link to="/admin/sales" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-rose-200 hover:bg-rose-50"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><ReceiptText className="h-4 w-4" /></span><span className="flex-1"><b className="block text-sm text-slate-800">Đơn & giao dịch</b><small className="text-xs text-slate-400">Tra khách, ghế, thanh toán và vé</small></span><ArrowRight className="h-4 w-4 text-slate-400" /></Link>
                <Link to="/admin/showtimes" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-rose-200 hover:bg-rose-50"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><CalendarPlus className="h-4 w-4" /></span><span className="flex-1"><b className="block text-sm text-slate-800">Lịch chiếu</b><small className="text-xs text-slate-400">Tạo và quản lý các suất chiếu</small></span><ArrowRight className="h-4 w-4 text-slate-400" /></Link>
                {isAdmin && <Link to="/admin/users" className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-rose-200 hover:bg-rose-50"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><UserRound className="h-4 w-4" /></span><span className="flex-1"><b className="block text-sm text-slate-800">Người dùng & quyền</b><small className="text-xs text-slate-400">Tài khoản, vai trò và trạng thái</small></span><ArrowRight className="h-4 w-4 text-slate-400" /></Link>}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
};
