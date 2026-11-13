import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Film,
  Calendar,
  QrCode,
  Users,
  MapPin,
  ShieldCheck,
  ReceiptText,
  ShoppingBag,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isManager, isStaff, canAccessAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500 font-semibold">Đang xác thực quyền truy cập...</div>;
  }

  if (!user || !canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  // Nếu là STAFF truy cập vào root /admin, tự động chuyển đến trang soát vé
  if (isStaff && location.pathname === '/admin') {
    return <Navigate to="/admin/checkin" replace />;
  }

  // Danh sách các menu theo phân quyền
  const allNavItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, allowed: isAdmin || isManager },
    { to: '/admin/movies', label: 'Quản lý Phim', icon: Film, allowed: isAdmin || isManager },
    { to: '/admin/showtimes', label: 'Lịch chiếu', icon: Calendar, allowed: isAdmin || isManager },
    { to: '/admin/sales', label: 'Đơn & giao dịch', icon: ReceiptText, allowed: isAdmin || isManager },
    { to: '/admin/checkin', label: 'Soát vé tại rạp', icon: QrCode, allowed: true }, // Admin, Manager, Staff
    { to: '/admin/counter', label: 'Bán vé tại quầy', icon: ShoppingBag, allowed: true },
    { to: '/admin/users', label: 'Người dùng & Quyền', icon: Users, allowed: isAdmin }, // Chỉ Super Admin
    { to: '/admin/cinemas', label: 'Rạp & Phòng chiếu', icon: MapPin, allowed: isAdmin || isManager },
  ];

  const navItems = allNavItems.filter((item) => item.allowed);

  // Bảo vệ route /admin/users nếu không phải Admin
  if (location.pathname.startsWith('/admin/users') && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Bảo vệ các route quản lý khác nếu là Staff
  if (isStaff && !['/admin/checkin', '/admin/counter'].includes(location.pathname)) {
    return <Navigate to="/admin/checkin" replace />;
  }

  const roleLabel = isAdmin ? 'Quản trị viên (Admin)' : isManager ? 'Quản lý rạp (Manager)' : 'Nhân viên soát vé (Staff)';

  return (
    <div className="space-y-6">
      {/* Top Admin Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Hệ Thống Vận Hành CineTicket
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Vai trò: <span className="font-bold text-slate-700">{roleLabel}</span> ({user.email})
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
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
