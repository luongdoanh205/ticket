import React, { useState, useEffect } from 'react';
import { bookingApi } from '../services/api';
import type { Ticket } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Ticket as TicketIcon, Calendar, MapPin, QrCode, CheckCircle, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        const data = await bookingApi.getTickets();
        setTickets(data || []);
      } catch (err) {
        console.error('Lỗi tải danh sách vé:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 shadow-xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Hợp lệ (Chưa xem)
          </span>
        );
      case 'USED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
            Đã soát vé
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-800">
            <Ban className="w-3.5 h-3.5" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs bg-white/30 text-white font-bold">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách vé của bạn..." size="lg" />;
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <TicketIcon className="w-8 h-8 text-rose-500" />
            Vé Điện Tử Của Tôi
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Xuất trình mã vé này tại rạp chiếu phim để vào xem phim
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto">
          <TicketIcon className="w-16 h-16 text-slate-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Bạn chưa có vé xem phim nào</h2>
          <p className="text-sm text-slate-500">
            Hãy lựa chọn những bộ phim hấp dẫn nhất và trải nghiệm đặt vé ngay hôm nay!
          </p>
          <Link
            to="/movies"
            className="inline-block px-6 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-md transition-colors"
          >
            Khám phá phim đang chiếu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => {
            const movieTitle =
              typeof ticket.movie === 'object' && ticket.movie !== null
                ? ticket.movie.title
                : String(ticket.movie || 'Phim chiếu rạp');
            const cinemaName =
              typeof ticket.cinema === 'object' && ticket.cinema !== null
                ? ticket.cinema.name
                : String(ticket.cinema || 'CineTicket');
            const roomName =
              typeof ticket.room === 'object' && ticket.room !== null
                ? ticket.room.name
                : String(ticket.room || 'Phòng chiếu');

            return (
              <div
                key={ticket.id}
                className="relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
              >
                {/* Top strip banner */}
                <div className="bg-gradient-to-r from-rose-600 to-rose-500 p-5 flex items-start justify-between text-white">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-widest uppercase text-rose-100">
                      CineTicket E-Ticket
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">{movieTitle}</h3>
                  </div>
                  <div>{getStatusBadge(ticket.status)}</div>
                </div>

                {/* Body info */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        Rạp chiếu
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5">{cinemaName}</p>
                      <p className="text-xs text-slate-500 font-medium">{roomName}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        Thời gian
                      </span>
                      <p className="font-extrabold text-rose-600 font-mono mt-0.5">
                        {ticket.startAt?.replace('T', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Vị trí ghế</span>
                      <p className="text-2xl font-black text-slate-900 font-mono">
                        {ticket.rowLabel}{ticket.seatNumber}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400">Giá vé</span>
                      <p className="text-lg font-bold text-slate-700 font-mono mt-1">
                        {formatPrice(ticket.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Perforation line */}
                <div className="relative flex items-center justify-between px-2">
                  <div className="w-5 h-5 rounded-full bg-slate-50 -ml-3.5 border-r border-slate-200" />
                  <div className="flex-1 border-b-2 border-dashed border-slate-200 mx-2" />
                  <div className="w-5 h-5 rounded-full bg-slate-50 -mr-3.5 border-l border-slate-200" />
                </div>

                {/* Bottom barcode / ticket code */}
                <div className="p-5 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Mã soát vé
                    </span>
                    <span className="font-mono text-base font-extrabold text-slate-900 tracking-widest bg-white px-3 py-1 rounded-xl border border-slate-200 inline-block shadow-xs">
                      {ticket.ticketCode}
                    </span>
                  </div>

                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-center shadow-xs">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
