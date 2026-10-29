import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../services/api';
import type { Booking } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Clock, ArrowRight } from 'lucide-react';

export const BookingsHistoryPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const data = await bookingApi.getBookings();
        setBookings(data || []);
      } catch (err) {
        console.error('Lỗi lấy danh sách đơn đặt vé:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã thanh toán
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Chờ thanh toán
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Đã hủy
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Hết hạn
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Đang tải lịch sử đặt vé..." size="lg" />;
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Clock className="w-8 h-8 text-rose-500" />
          Lịch Sử Đặt Vé
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Danh sách tất cả các đơn đặt vé của bạn</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-lg mx-auto">
          <Clock className="w-16 h-16 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Chưa có đơn đặt vé nào</h2>
          <p className="text-sm text-slate-500 mt-1">Các đơn đặt chỗ của bạn sẽ hiển thị ở đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isPending = booking.status === 'PENDING';
            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 text-sm">#{booking.id}</span>
                    {getStatusBadge(booking.status)}
                    <span className="text-xs font-medium text-slate-400">
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN') : ''}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900">
                    {booking.showtime?.movie?.title || 'Vé xem phim'}
                  </h3>

                  <p className="text-sm font-semibold text-slate-600">
                    {booking.showtime?.cinema?.name} • {booking.showtime?.room?.name} •{' '}
                    <span className="text-rose-600 font-mono font-bold">
                      {booking.showtime?.startAt?.replace('T', ' ')}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>Ghế:</span>
                    <span className="font-bold text-slate-900">
                      {booking.seats?.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ') || 'Chưa rõ'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block">Tổng tiền</span>
                    <span className="text-xl font-black text-rose-600 font-mono">
                      {formatPrice(booking.totalAmount)}
                    </span>
                  </div>

                  {isPending && (
                    <Link
                      to={`/payment/${booking.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all hover:scale-105"
                    >
                      Tiếp tục thanh toán
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
