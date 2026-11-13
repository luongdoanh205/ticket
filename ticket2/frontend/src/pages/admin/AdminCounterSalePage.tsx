import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Armchair, CalendarDays, CheckCircle2, CircleDollarSign, Printer, RefreshCw, ShoppingBag, TicketCheck } from 'lucide-react';
import { adminApi, cinemaApi, showtimeApi } from '../../services/api';
import type { Seat, Showtime } from '../../types';
import { toLocalDateString } from '../../utils/date';

type SaleReceipt = Awaited<ReturnType<typeof adminApi.createCounterSale>>;

const priceForSeat = (base: number, seat: Seat) => {
  if (seat.seatType === 'VIP') return base * 1.2;
  if (seat.seatType === 'DOUBLE') return base * 1.8;
  return base;
};

const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value);

export const AdminCounterSalePage: React.FC = () => {
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoadingShowtimes(true);
    setSelectedShowtime(null);
    setSeats([]);
    setSelectedSeatIds([]);
    setReceipt(null);
    setError('');
    showtimeApi.getShowtimes(date)
      .then((items) => { if (!cancelled) setShowtimes(items); })
      .catch(() => { if (!cancelled) setError('Không tải được suất chiếu. Hãy kiểm tra kết nối rồi thử lại.'); })
      .finally(() => { if (!cancelled) setIsLoadingShowtimes(false); });
    return () => { cancelled = true; };
  }, [date]);

  const selectedSeats = useMemo(() => seats.filter((seat) => selectedSeatIds.includes(seat.id)), [seats, selectedSeatIds]);
  const totalAmount = selectedShowtime
    ? selectedSeats.reduce((sum, seat) => sum + priceForSeat(selectedShowtime.basePrice, seat), 0)
    : 0;
  const rows = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    for (const seat of seats) (grouped[seat.rowLabel] ??= []).push(seat);
    for (const row of Object.values(grouped)) row.sort((a, b) => a.seatNumber - b.seatNumber);
    return grouped;
  }, [seats]);

  const selectShowtime = async (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setSeats([]);
    setSelectedSeatIds([]);
    setReceipt(null);
    setError('');
    setIsLoadingSeats(true);
    try {
      setSeats(await cinemaApi.getRoomSeats(showtime.room.id, showtime.id));
    } catch {
      setError('Không tải được sơ đồ ghế cho suất chiếu này.');
    } finally {
      setIsLoadingSeats(false);
    }
  };

  const toggleSeat = (seat: Seat) => {
    if (!seat.active || seat.status !== 'AVAILABLE') return;
    setReceipt(null);
    setSelectedSeatIds((current) => {
      if (current.includes(seat.id)) return current.filter((id) => id !== seat.id);
      if (current.length >= 8) {
        setError('Mỗi giao dịch tại quầy được chọn tối đa 8 ghế.');
        return current;
      }
      setError('');
      return [...current, seat.id];
    });
  };

  const submitSale = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedShowtime || !selectedSeatIds.length) return;
    setIsSubmitting(true);
    setError('');
    try {
      const sale = await adminApi.createCounterSale({
        showtimeId: selectedShowtime.id,
        seatIds: selectedSeatIds,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentMethod,
      });
      setReceipt(sale);
      setSelectedSeatIds([]);
      setSeats(await cinemaApi.getRoomSeats(selectedShowtime.room.id, selectedShowtime.id));
    } catch (err: any) {
      const code = err.response?.data?.message || err.response?.data?.code || '';
      setError(code.includes('SEAT_UNAVAILABLE')
        ? 'Ghế vừa được người khác giữ hoặc bán. Hãy tải lại sơ đồ ghế.'
        : code.includes('SHOWTIME_NOT_BOOKABLE')
          ? 'Suất chiếu này không còn nhận bán vé.'
          : 'Không thể hoàn tất giao dịch. Hãy tải lại ghế và thử lại.');
      try {
        setSeats(await cinemaApi.getRoomSeats(selectedShowtime.room.id, selectedShowtime.id));
      } catch { /* Preserve the original sale error. */ }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><ShoppingBag className="h-6 w-6" /></span>
          <div><h2 className="text-2xl font-black">Bán vé tại quầy</h2><p className="mt-1 text-sm text-slate-300">Chọn suất, ghế, ghi nhận tiền khách trả và xuất vé QR.</p></div>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div>}

      {receipt ? (
        <section className="space-y-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-emerald-600" /><div><h3 className="text-xl font-black text-emerald-950">Đã bán vé · đơn #{receipt.bookingId}</h3><p className="text-sm text-emerald-800">Khách: {receipt.customerName} · {receipt.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Thẻ tại quầy'}</p></div></div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"><Printer className="h-4 w-4" /> In vé</button>
          </div>
          <p className="font-bold text-emerald-900">Tổng thu: {formatPrice(receipt.totalAmount)} · Nhân viên: {receipt.soldBy}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {receipt.tickets.map((ticket) => (
              <article key={ticket.ticketId} className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-white p-4">
                <QRCodeSVG value={ticket.ticketCode} size={104} level="M" />
                <div><p className="text-xs font-bold uppercase text-slate-400">Ghế {ticket.seatLabel}</p><p className="mt-1 break-all font-mono text-sm font-black text-slate-900">{ticket.ticketCode}</p><p className="mt-1 text-sm font-bold text-rose-600">{formatPrice(ticket.price)}</p></div>
              </article>
            ))}
          </div>
          <button onClick={() => setReceipt(null)} className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-100">Bán đơn tiếp theo</button>
        </section>
      ) : (
        <form onSubmit={submitSale} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <label className="mb-4 flex max-w-xs items-center gap-2 text-sm font-bold text-slate-700"><CalendarDays className="h-4 w-4 text-rose-500" /> Ngày chiếu
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="ml-auto rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              {isLoadingShowtimes ? <p className="py-8 text-center text-sm text-slate-500">Đang tải suất chiếu…</p> : showtimes.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Không có suất chiếu trong ngày này.</p> : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {showtimes.map((showtime) => (
                    <button type="button" key={showtime.id} onClick={() => void selectShowtime(showtime)} className={`rounded-2xl border p-4 text-left transition ${selectedShowtime?.id === showtime.id ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 hover:border-rose-300'}`}>
                      <p className="font-extrabold text-slate-900">{showtime.movie.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{showtime.cinema.name} · {showtime.room.name}</p>
                      <p className="mt-2 font-mono text-sm font-bold text-rose-600">{showtime.startAt.replace('T', ' ').slice(0, 16)}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {selectedShowtime && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-5 flex items-center justify-between"><h3 className="font-extrabold text-slate-900">Sơ đồ ghế · {selectedShowtime.movie.title}</h3><button type="button" onClick={() => void selectShowtime(selectedShowtime)} disabled={isLoadingSeats} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"><RefreshCw className={`h-3.5 w-3.5 ${isLoadingSeats ? 'animate-spin' : ''}`} /> Tải ghế</button></div>
              {isLoadingSeats ? <p className="py-8 text-center text-sm text-slate-500">Đang tải sơ đồ ghế…</p> : <>
                <div className="mx-auto mb-8 h-2 max-w-xl rounded-full bg-gradient-to-r from-transparent via-rose-400 to-transparent" /><p className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Màn hình</p>
                <div className="space-y-2 overflow-x-auto pb-3">
                  {Object.entries(rows).map(([rowLabel, rowSeats]) => <div key={rowLabel} className="flex min-w-max items-center justify-center gap-2"><span className="w-5 text-center text-xs font-bold text-slate-400">{rowLabel}</span>{rowSeats.map((seat) => {
                    const selected = selectedSeatIds.includes(seat.id);
                    const available = seat.active && seat.status === 'AVAILABLE';
                    return <button type="button" key={seat.id} disabled={!available} onClick={() => toggleSeat(seat)} title={`${seat.rowLabel}${seat.seatNumber} · ${formatPrice(priceForSeat(selectedShowtime.basePrice, seat))}`} className={`h-9 min-w-9 rounded-lg border px-1 text-[11px] font-bold ${selected ? 'border-rose-600 bg-rose-600 text-white' : !available ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through' : seat.seatType === 'VIP' ? 'border-purple-200 bg-purple-50 text-purple-700' : seat.seatType === 'DOUBLE' ? 'border-pink-200 bg-pink-50 text-pink-700' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-400'}`}>{seat.rowLabel}{seat.seatNumber}</button>;
                  })}<span className="w-5 text-center text-xs font-bold text-slate-400">{rowLabel}</span></div>)}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-500"><span><i className="mr-1 inline-block h-3 w-3 rounded bg-white ring-1 ring-slate-300" />Trống</span><span><i className="mr-1 inline-block h-3 w-3 rounded bg-rose-600" />Đang chọn</span><span><i className="mr-1 inline-block h-3 w-3 rounded bg-slate-200" />Đã giữ/đã bán</span></div>
              </>}
            </section>}
          </div>

          <aside className="h-fit space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs xl:sticky xl:top-24">
            <div><h3 className="flex items-center gap-2 font-extrabold text-slate-900"><Armchair className="h-4 w-4 text-rose-500" /> Khách và thanh toán</h3><p className="mt-1 text-xs text-slate-500">Thông tin này được lưu trên đơn bán tại quầy.</p></div>
            <label className="block text-xs font-bold text-slate-600">Tên khách *<input required maxLength={120} value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-rose-400" /></label>
            <label className="block text-xs font-bold text-slate-600">Số điện thoại<input maxLength={32} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-rose-400" /></label>
            <label className="block text-xs font-bold text-slate-600">Email (không bắt buộc)<input type="email" maxLength={254} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-rose-400" /></label>
            <label className="block text-xs font-bold text-slate-600">Khách trả bằng<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as 'CASH' | 'CARD')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold"><option value="CASH">Tiền mặt</option><option value="CARD">Thẻ tại quầy</option></select></label>
            <div className="space-y-2 border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ghế đã chọn</p><p className="min-h-5 text-sm font-bold text-slate-800">{selectedSeats.length ? selectedSeats.map((seat) => `${seat.rowLabel}${seat.seatNumber}`).join(', ') : 'Chưa chọn ghế'}</p><div className="flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-bold text-slate-600">Tổng tiền</span><span className="font-mono text-lg font-black text-rose-600">{formatPrice(totalAmount)}</span></div></div>
            <button type="submit" disabled={!selectedShowtime || !selectedSeatIds.length || !customerName.trim() || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-bold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"><CircleDollarSign className="h-4 w-4" />{isSubmitting ? 'Đang ghi nhận giao dịch…' : 'Xác nhận đã thu tiền'}</button>
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400"><TicketCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Xác nhận sẽ ghi nhận thanh toán thành công, khóa ghế và phát hành vé ngay.</p>
          </aside>
        </form>
      )}
    </div>
  );
};
