import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { QrCode, Search, CheckCircle2, XCircle } from 'lucide-react';

export const AdminCheckinPage: React.FC = () => {
  const [ticketCode, setTicketCode] = useState('');
  const [ticketInfo, setTicketInfo] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUsing, setIsUsing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await adminApi.getAdminTickets();
        setRecentTickets((data || []).slice(0, 10));
      } catch (err) {
        console.error('Lỗi tải danh sách vé admin:', err);
      }
    };
    fetchRecent();
  }, []);

  const handleValidate = async (e?: React.FormEvent, codeToUse?: string) => {
    if (e) e.preventDefault();
    const code = codeToUse || ticketCode.trim();
    if (!code) return;

    setStatusMsg(null);
    setTicketInfo(null);
    try {
      setIsValidating(true);
      const res = await adminApi.validateTicket(code);
      setTicketInfo(res);
      if (res.valid) {
        setStatusMsg({ type: 'success', text: 'Vé hợp lệ! Khách hàng có thể vào rạp.' });
      } else {
        setStatusMsg({
          type: 'error',
          text: `Vé không hợp lệ hoặc đã qua sử dụng! (Trạng thái: ${res.status})`,
        });
      }
    } catch (err: any) {
      console.error('Lỗi kiểm tra vé:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Không tìm thấy vé với mã này trong hệ thống.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseTicket = async () => {
    if (!ticketCode.trim()) return;

    try {
      setIsUsing(true);
      await adminApi.useTicket(ticketCode.trim());
      setStatusMsg({
        type: 'success',
        text: `Đã xác nhận soát vé thành công cho mã ${ticketCode}! Khách được phép vào xem.`,
      });
      setTicketInfo({ ...ticketInfo, status: 'USED', valid: false });
    } catch (err: any) {
      console.error('Lỗi sử dụng vé:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Không thể đánh dấu sử dụng vé.',
      });
    } finally {
      setIsUsing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-rose-500" />
          Soát Vé & Quét Mã Vào Rạp
        </h2>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Nhập mã vé hoặc quét mã barcode/QR từ vé điện tử của khách hàng
        </p>
      </div>

      {/* Input box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={(e) => handleValidate(e)} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập mã vé điện tử (ví dụ: TK-202610-ABCD)..."
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-900 font-mono text-base font-bold focus:outline-none focus:border-rose-500 shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isValidating || !ticketCode.trim()}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
          >
            {isValidating ? 'Đang kiểm tra...' : 'Kiểm tra vé'}
          </button>
        </form>

        {/* Validation Result Box */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="w-6 h-6 shrink-0 text-rose-600" />
              )}
              <span className="text-sm font-bold">{statusMsg.text}</span>
            </div>

            {ticketInfo?.valid && (
              <button
                onClick={handleUseTicket}
                disabled={isUsing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                {isUsing ? 'Đang xử lý...' : 'Xác nhận vào rạp'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent tickets list */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Các vé phát hành gần đây
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-3">Mã vé</th>
                <th className="py-2.5 px-3">Mã đơn</th>
                <th className="py-2.5 px-3">Suất chiếu ID</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.ticketCode}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-600">#{t.bookingId}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-600">#{t.showtimeId}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        t.status === 'VALID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setTicketCode(t.ticketCode);
                        handleValidate(undefined, t.ticketCode);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-rose-600 font-bold"
                    >
                      Kiểm tra
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
