import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Film,
  Calendar,
  QrCode,
  Users,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500 font-semibold">Đang xác thực quyền Admin...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/movies', label: 'Quản lý Phim', icon: Film },
    { to: '/admin/showtimes', label: 'Lịch chiếu', icon: Calendar },
    { to: '/admin/checkin', label: 'Soát vé tại rạp', icon: QrCode },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
    { to: '/admin/cinemas', label: 'Rạp & Phòng chiếu', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Top Admin Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Hệ Thống Quản Trị CineTicket
            </h1>
            <p className="text-xs font-medium text-slate-500">Dành cho Quản trị viên ({user.email})</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Outlet */}
      <Outlet />
    </div>
  );
};
