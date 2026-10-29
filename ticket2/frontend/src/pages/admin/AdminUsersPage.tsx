import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import type { User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Users, Lock, Unlock, Shield, User as UserIcon } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái tài khoản ${user.email} sang ${newStatus}?`)) return;

    try {
      await adminApi.updateUser(user.id, { status: newStatus });
      fetchUsers();
    } catch (err: any) {
      console.error('Lỗi đổi trạng thái tài khoản:', err);
      alert('Không thể cập nhật trạng thái người dùng.');
    }
  };

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (!window.confirm(`Bạn có chắc muốn chuyển quyền tài khoản ${user.email} thành ${newRole}?`)) return;

    try {
      await adminApi.updateUser(user.id, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      console.error('Lỗi đổi vai trò:', err);
      alert('Không thể đổi quyền người dùng.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-rose-500" />
          Quản Lý Người Dùng & Phân Quyền
        </h2>
        <p className="text-xs font-medium text-slate-500 mt-0.5">Khóa/Mở khóa tài khoản và cấp quyền Quản trị viên</p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Đang tải danh sách người dùng..." size="md" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{u.email}</td>
                  <td className="py-3 px-4 text-slate-500">{u.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {u.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.status === 'LOCKED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {u.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleRole(u)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                      >
                        Đổi thành {u.role === 'ADMIN' ? 'Khách' : 'Admin'}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-xl text-xs font-bold transition-colors ${
                          u.status === 'LOCKED'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                        }`}
                        title={u.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {u.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
