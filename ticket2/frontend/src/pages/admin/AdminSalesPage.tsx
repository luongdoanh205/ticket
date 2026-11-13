import React, { useEffect, useMemo, useState } from 'react';
import {
  Armchair,
  CalendarDays,
  Check,
  CircleDollarSign,
  CreditCard,
  Film,
  MapPin,
  ReceiptText,
  RefreshCw,
  Search,
  TicketCheck,
  UserRound,
  X,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import type { AdminBooking, AdminPayment, AdminTicket } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

type View = 'bookings' | 'payments' | 'tickets';
type RecordItem = AdminBooking | AdminPayment | AdminTicket;

const money = (amount: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(amount || 0);

const dateTime = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

const statusStyle: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  VALID: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  USED: 'bg-slate-100 text-slate-700 ring-slate-200',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 ring-rose-200',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
  EXPIRED: 'bg-slate-100 text-slate-600 ring-slate-200',
};
const statusLabel: Record<string, string> = {
  PAID: 'Đã thanh toán', SUCCESS: 'Thành công', VALID: 'Còn hiệu lực', USED: 'Đã soát vé',
  PENDING: 'Chờ thanh toán', FAILED: 'Thất bại', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn',
};

const StatusPill = ({ value }: { value: string }) => (
  <span title={value} className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${statusStyle[value] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
    {statusLabel[value] ?? value}
  </span>
);

const SeatList = ({ seats }: { seats: { label: string; seatType: string; unitPrice: number; holdStatus: string }[] }) => (
  <div className="flex flex-wrap gap-2">
    {seats.length ? seats.map((seat, index) => (
      <span key={`${seat.label}-${index}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700">
        <Armchair className="h-3.5 w-3.5 text-rose-500" />
        {seat.label}
        <span className="font-medium text-slate-400">{seat.seatType === 'VIP' ? 'VIP' : ''}</span>
      </span>
    )) : <span className="text-sm text-slate-400">Chưa có thông tin ghế</span>}
  </div>
);

export const AdminSalesPage: React.FC = () => {
  const [view, setView] = useState<View>('bookings');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [bookingRows, paymentRows, ticketRows] = await Promise.all([
        adminApi.getAdminBookings(), adminApi.getAdminPayments(), adminApi.getAdminTickets(),
      ]);
      setBookings(bookingRows);
      setPayments(paymentRows);
      setTickets(ticketRows);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được dữ liệu giao dịch. Hãy kiểm tra quyền tài khoản và thử tải lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi');
    const rows: RecordItem[] = view === 'bookings' ? bookings : view === 'payments' ? payments : tickets;
    return rows.filter((row) => {
      const status = row.status;
      if (statusFilter !== 'ALL' && status !== statusFilter) return false;
      if (!term) return true;
      const common = [row.customerName, row.email, 'soldByName' in row ? row.soldByName : '', row.movieTitle, row.cinemaName, row.roomName, String(row.id)];
      if ('seats' in row) common.push(...row.seats.map((seat) => seat.label));
      if ('ticketCode' in row) common.push(row.ticketCode, row.seatLabel, String(row.bookingId));
      if ('bookingId' in row) common.push(String(row.bookingId));
      if ('transactionRef' in row) common.push(row.transactionRef);
      return common.some((value) => String(value ?? '').toLocaleLowerCase('vi').includes(term));
    });
  }, [bookings, payments, tickets, query, statusFilter, view]);

  const successfulRevenue = payments.filter((payment) => payment.status === 'SUCCESS')
    .reduce((total, payment) => total + payment.amount, 0);
  const tabs = [
    { id: 'bookings' as const, label: 'Đơn đặt vé', icon: ReceiptText, count: bookings.length },
    { id: 'payments' as const, label: 'Thanh toán', icon: CreditCard, count: payments.length },
    { id: 'tickets' as const, label: 'Vé đã phát hành', icon: TicketCheck, count: tickets.length },
  ];
  const currentStatuses = [...new Set((view === 'bookings' ? bookings : view === 'payments' ? payments : tickets).map((row) => row.status))];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 p-6 text-white lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-200">Vận hành rạp</p>
            <h2 className="mt-2 text-2xl font-black">Đơn hàng & giao dịch</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">Theo dõi khách đặt vé, ghế, thanh toán và trạng thái vé trên cùng một màn hình.</p>
          </div>
          <button onClick={() => void load()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/15 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Tải lại dữ liệu
          </button>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><ReceiptText className="h-5 w-5" /></span>
            <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng đơn</p><p className="mt-1 text-xl font-black text-slate-900">{bookings.length}</p></div>
          </div>
          <div className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CircleDollarSign className="h-5 w-5" /></span>
            <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Thanh toán thành công</p><p className="mt-1 text-xl font-black text-slate-900">{money(successfulRevenue)}</p></div>
          </div>
          <div className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><TicketCheck className="h-5 w-5" /></span>
            <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Vé phát hành</p><p className="mt-1 text-xl font-black text-slate-900">{tickets.length}</p></div>
          </div>
        </div>
      </section>

      {error && <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800"><span>{error}</span><button onClick={() => void load()} className="shrink-0 underline">Thử lại</button></div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => { setView(id); setStatusFilter('ALL'); setSelected(null); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === id ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Icon className="h-4 w-4" /> {label}<span className={`rounded-full px-2 py-0.5 text-[11px] ${view === id ? 'bg-white/20' : 'bg-white'}`}>{count}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-64 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm khách, email, mã đơn, phim, ghế..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-rose-400 focus:bg-white" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-rose-400">
              <option value="ALL">Tất cả trạng thái</option>
              {currentStatuses.map((status) => <option key={status} value={status}>{statusLabel[status] ?? status}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? <div className="py-16"><LoadingSpinner message="Đang tải đơn hàng, thanh toán và vé..." size="md" /></div> : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100">
            {view === 'bookings' && <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Đơn / khách hàng</th><th className="px-4 py-3">Phim / suất chiếu</th><th className="px-4 py-3">Ghế</th><th className="px-4 py-3">Tổng tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-slate-100">{(filtered as AdminBooking[]).map((booking) => <tr key={booking.id} onClick={() => setSelected(booking)} className={`cursor-pointer transition hover:bg-rose-50/40 ${selected === booking ? 'bg-rose-50/60' : ''}`}>
                <td className="px-4 py-3"><p className="font-extrabold text-slate-900">Đơn #{booking.id}</p><p className="mt-1 font-semibold text-slate-700">{booking.customerName}</p><p className="text-xs text-slate-400">{booking.email || 'Khách mua tại quầy'}</p><p className="mt-1 text-[10px] font-bold text-slate-500">{booking.saleChannel === 'COUNTER' ? `Tại quầy · ${booking.soldByName || 'Nhân viên'}` : 'Trực tuyến'}</p></td>
                <td className="px-4 py-3"><p className="max-w-56 truncate font-bold text-slate-800">{booking.movieTitle}</p><p className="mt-1 text-xs text-slate-500">{dateTime(booking.startAt)}</p><p className="text-xs text-slate-400">{booking.cinemaName} · {booking.roomName}</p></td>
                <td className="px-4 py-3"><p className="font-bold text-slate-800">{booking.seats.map((seat) => seat.label).join(', ') || '—'}</p><p className="mt-1 text-xs text-slate-400">{booking.seats.length} ghế</p></td>
                <td className="px-4 py-3 font-extrabold text-slate-900">{money(booking.totalAmount)}</td><td className="px-4 py-3"><StatusPill value={booking.status} /></td>
                <td className="px-4 py-3 text-right text-xs font-bold text-rose-600">Chi tiết →</td>
              </tr>)}</tbody>
            </table>}
            {view === 'payments' && <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Thanh toán / đơn</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Phim / ghế</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Kết quả</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-slate-100">{(filtered as AdminPayment[]).map((payment) => <tr key={payment.id} onClick={() => setSelected(payment)} className="cursor-pointer transition hover:bg-rose-50/40">
                <td className="px-4 py-3"><p className="font-extrabold text-slate-900">Giao dịch #{payment.id}</p><p className="mt-1 text-xs text-slate-500">Đơn #{payment.bookingId} · {payment.method || '—'}</p><p className="max-w-48 truncate text-[11px] text-slate-400">{payment.transactionRef || 'Không có mã tham chiếu'}</p></td>
                <td className="px-4 py-3"><p className="font-bold text-slate-800">{payment.customerName}</p><p className="text-xs text-slate-400">{payment.email || 'Khách mua tại quầy'}</p></td>
                <td className="px-4 py-3"><p className="max-w-52 truncate font-semibold text-slate-800">{payment.movieTitle}</p><p className="text-xs text-slate-500">Ghế {payment.seats.map((seat) => seat.label).join(', ') || '—'}</p></td>
                <td className="px-4 py-3 font-extrabold text-slate-900">{money(payment.amount)}</td><td className="px-4 py-3"><StatusPill value={payment.status} /><p className="mt-1 text-[11px] text-slate-400">Đơn {payment.bookingStatus}</p></td>
                <td className="px-4 py-3 text-right text-xs font-bold text-rose-600">Chi tiết →</td>
              </tr>)}</tbody>
            </table>}
            {view === 'tickets' && <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Mã vé / đơn</th><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Phim / suất</th><th className="px-4 py-3">Ghế / giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead>
              <tbody className="divide-y divide-slate-100">{(filtered as AdminTicket[]).map((ticket) => <tr key={ticket.id} onClick={() => setSelected(ticket)} className="cursor-pointer transition hover:bg-rose-50/40">
                <td className="px-4 py-3"><p className="font-mono font-extrabold text-slate-900">{ticket.ticketCode}</p><p className="mt-1 text-xs text-slate-500">Vé #{ticket.id} · đơn #{ticket.bookingId}</p></td>
                <td className="px-4 py-3"><p className="font-bold text-slate-800">{ticket.customerName}</p><p className="text-xs text-slate-400">{ticket.email || 'Khách mua tại quầy'}</p></td>
                <td className="px-4 py-3"><p className="max-w-52 truncate font-semibold text-slate-800">{ticket.movieTitle}</p><p className="text-xs text-slate-500">{dateTime(ticket.startAt)}</p></td>
                <td className="px-4 py-3"><p className="font-extrabold text-slate-800">{ticket.seatLabel}</p><p className="text-xs text-slate-500">{money(ticket.price)}</p></td><td className="px-4 py-3"><StatusPill value={ticket.status} /></td>
                <td className="px-4 py-3 text-right text-xs font-bold text-rose-600">Chi tiết →</td>
              </tr>)}</tbody>
            </table>}
            {filtered.length === 0 && <div className="px-6 py-14 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-bold text-slate-700">Không tìm thấy dữ liệu phù hợp</p><p className="mt-1 text-sm text-slate-400">Thử từ khóa hoặc trạng thái khác.</p></div>}
          </div>
        )}
        {!isLoading && <p className="mt-3 text-xs text-slate-400">Đang hiển thị {filtered.length} / {view === 'bookings' ? bookings.length : view === 'payments' ? payments.length : tickets.length} bản ghi. Chọn một dòng để xem thông tin đầy đủ.</p>}
      </section>

      {selected && <DetailPanel item={selected} payments={payments} onClose={() => setSelected(null)} />}
    </div>
  );
};

function DetailPanel({ item, payments, onClose }: { item: RecordItem; payments: AdminPayment[]; onClose: () => void }) {
  const booking = 'totalAmount' in item ? item : null;
  const payment = 'transactionRef' in item ? item : null;
  const ticket = 'ticketCode' in item ? item : null;
  const details = booking ?? payment ?? ticket!;
  const saleChannel = 'saleChannel' in details ? details.saleChannel : undefined;
  const soldByName = 'soldByName' in details ? details.soldByName : undefined;
  const seats = 'seats' in details ? details.seats : [];
  const amount = booking?.totalAmount ?? payment?.amount ?? ticket?.price ?? 0;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">
          <div><p className="text-xs font-bold uppercase tracking-widest text-rose-600">Thông tin chi tiết</p><h3 className="mt-1 text-xl font-black text-slate-900">{booking ? `Đơn đặt vé #${booking.id}` : payment ? `Thanh toán #${payment.id}` : `Vé ${ticket?.ticketCode}`}</h3></div>
          <button onClick={onClose} aria-label="Đóng chi tiết" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400"><UserRound className="h-4 w-4" /> Khách hàng</p>
            <p className="text-lg font-black text-slate-900">{details.customerName}</p><p className="mt-1 text-sm text-slate-600">{details.email || 'Không cung cấp email'}</p>
            {booking?.phone && <p className="mt-1 text-sm text-slate-500">{booking.phone}</p>}
            <p className="mt-2 text-xs text-slate-400">Mã khách: #{booking?.userId ?? '—'}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">Kênh bán: {saleChannel === 'COUNTER' ? 'Tại quầy' : 'Trực tuyến'}{soldByName ? ` · Nhân viên: ${soldByName}` : ''}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400"><Film className="h-4 w-4" /> Suất chiếu</p>
            <p className="font-black text-slate-900">{details.movieTitle}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4 text-rose-500" /> {dateTime(details.startAt)}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-rose-500" /> {details.cinemaName} · {details.roomName}</p>
            <div className="mt-4 border-t border-slate-100 pt-4"><SeatList seats={seats} /></div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400"><CircleDollarSign className="h-4 w-4" /> Trạng thái & số tiền</p>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-500">{booking ? 'Trạng thái đơn' : payment ? 'Trạng thái thanh toán' : 'Trạng thái vé'}</span><StatusPill value={details.status} /></div>
            {'bookingStatus' in details && <div className="mt-3 flex items-center justify-between"><span className="text-sm text-slate-500">Trạng thái đơn</span><StatusPill value={details.bookingStatus} /></div>}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-bold text-slate-600">Số tiền</span><span className="text-xl font-black text-slate-900">{money(amount)}</span></div>
            {booking && <div className="mt-2 flex justify-between text-xs text-slate-400"><span>Thời điểm đặt</span><span>{dateTime(booking.createdAt)}</span></div>}
            {booking && booking.status === 'PENDING' && <div className="mt-2 flex justify-between text-xs text-amber-700"><span>Hạn giữ ghế</span><span>{dateTime(booking.holdExpiresAt)}</span></div>}
            {payment && <><div className="mt-2 flex justify-between text-xs text-slate-500"><span>Phương thức</span><span>{payment.method || '—'}</span></div><div className="mt-2 flex justify-between gap-4 text-xs text-slate-500"><span>Mã giao dịch</span><span className="break-all text-right font-mono">{payment.transactionRef || '—'}</span></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>Thời gian</span><span>{dateTime(payment.paidAt)}</span></div></>}
            {ticket && <><div className="mt-2 flex justify-between text-xs text-slate-500"><span>Phát hành</span><span>{dateTime(ticket.issuedAt)}</span></div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>Đã sử dụng</span><span>{dateTime(ticket.usedAt)}</span></div></>}
          </section>
          {booking && <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400"><CreditCard className="h-4 w-4" /> Lịch sử thanh toán</p>
            {payments.filter((payment) => payment.bookingId === booking.id).length ? (
              <div className="space-y-2">{payments.filter((payment) => payment.bookingId === booking.id).map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div><p className="text-sm font-bold text-slate-800">Giao dịch #{payment.id} · {payment.method || '—'}</p><p className="mt-1 text-xs text-slate-400">{payment.transactionRef || 'Không có mã tham chiếu'} · {dateTime(payment.paidAt)}</p></div>
                <div className="text-right"><p className="text-sm font-extrabold text-slate-900">{money(payment.amount)}</p><StatusPill value={payment.status} /></div>
              </div>)}</div>
            ) : <p className="text-sm text-slate-500">Đơn này chưa có giao dịch thanh toán.</p>}
          </section>}
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800"><Check className="mt-0.5 h-4 w-4 shrink-0" /> Thông tin lấy trực tiếp từ đơn, thanh toán và vé đã lưu trong hệ thống.</div>
        </div>
      </aside>
    </div>
  );
}
