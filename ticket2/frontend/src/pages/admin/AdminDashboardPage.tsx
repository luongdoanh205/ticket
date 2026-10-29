import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import type { AdminDashboardData } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DollarSign, Ticket, Clock, CheckCircle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [to, setTo] = useState<string>(today.toISOString().split('T')[0]);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getDashboard(from, to);
      setData(res);
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
            <h3 className="text-base font-bold text-slate-900">Phân Bổ Trạng Thái Đơn Hàng</h3>

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
        </div>
      ) : null}
    </div>
  );
};
