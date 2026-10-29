import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cinemaApi, bookingApi, showtimeApi } from '../services/api';
import type { Seat, Showtime, Booking } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, AlertCircle } from 'lucide-react';

export const BookingSeatPage: React.FC = () => {
  const { showtimeId: paramShowtimeId } = useParams<{ showtimeId: string }>();
  const showtimeId = paramShowtimeId ? parseInt(paramShowtimeId, 10) : 0;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch showtime and seats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const todayStr = new Date().toISOString().split('T')[0];
        let foundShowtime: Showtime | null = null;

        const todayShowtimes = await showtimeApi.getShowtimes(todayStr);
        foundShowtime = todayShowtimes.find((s) => s.id === showtimeId) || null;

        if (!foundShowtime) {
          for (let i = 1; i <= 7; i++) {
            const nextD = new Date();
            nextD.setDate(nextD.getDate() + i);
            const dateStr = nextD.toISOString().split('T')[0];
            const futureShowtimes = await showtimeApi.getShowtimes(dateStr);
            const match = futureShowtimes.find((s) => s.id === showtimeId);
            if (match) {
              foundShowtime = match;
              break;
            }
          }
        }

        if (foundShowtime) {
          setShowtime(foundShowtime);
          const roomId = foundShowtime.room.id;
          const seatData = await cinemaApi.getRoomSeats(roomId, showtimeId);
          setSeats(seatData);
        } else {
          setErrorMessage('Không tìm thấy thông tin suất chiếu.');
        }
      } catch (err: any) {
        console.error('Lỗi tải dữ liệu phòng và ghế:', err);
        setErrorMessage(err.response?.data?.message || 'Không thể tải sơ đồ ghế cho suất chiếu này.');
      } finally {
        setIsLoading(false);
      }
    };

    if (showtimeId) {
      fetchData();
    }
  }, [showtimeId]);

  const toggleSelectSeat = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE' || !seat.active) return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        alert('Mỗi lần đặt tối đa 8 ghế.');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.id]);
    }
  };

  const getSeatPrice = (seat: Seat) => {
    const base = showtime?.basePrice || 80000;
    if (seat.seatType === 'VIP') return base * 1.2;
    if (seat.seatType === 'DOUBLE') return base * 1.8;
    return base;
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
  const totalAmount = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Group seats by rowLabel
  const rows = seats.reduce((acc, seat) => {
    const row = seat.rowLabel || 'A';
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  const sortedRowKeys = Object.keys(rows).sort();
  sortedRowKeys.forEach((key) => {
    rows[key].sort((a, b) => a.seatNumber - b.seatNumber);
  });

  const handleBooking = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/booking/${showtimeId}`));
      return;
    }

    if (selectedSeatIds.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const booking: Booking = await bookingApi.createBooking({
        showtimeId,
        seatIds: selectedSeatIds,
      });

      navigate(`/payment/${booking.id}`);
    } catch (err: any) {
      console.error('Lỗi đặt ghế:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 409
          ? 'Ghế bạn chọn hiện đang được người khác giữ hoặc đã bán. Vui lòng tải lại sơ đồ ghế.'
          : 'Có lỗi xảy ra khi giữ ghế. Vui lòng thử lại.');
      setErrorMessage(msg);

      if (showtime) {
        const refreshed = await cinemaApi.getRoomSeats(showtime.room.id, showtimeId);
        setSeats(refreshed);
        setSelectedSeatIds([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Đang tải sơ đồ phòng chiếu..." size="lg" />;
  }

  if (errorMessage && !showtime) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{errorMessage}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              {showtime?.movie?.title}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {showtime?.cinema?.name} • {showtime?.room?.name} • {showtime?.startAt?.replace('T', ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400">Giá cơ bản:</span>
          <span className="text-rose-600 font-extrabold font-mono text-lg">
            {formatPrice(showtime?.basePrice || 0)}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Screen Graphic */}
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-3 text-center">
          <div className="w-4/5 h-2.5 mx-auto bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Màn hình chiếu</p>
        </div>

        {/* Seat Matrix */}
        <div className="overflow-x-auto pb-6">
          <div className="min-w-[600px] flex flex-col items-center gap-3">
            {sortedRowKeys.map((rowKey) => (
              <div key={rowKey} className="flex items-center gap-2">
                <span className="w-6 text-center font-bold text-xs text-slate-400">{rowKey}</span>

                <div className="flex items-center gap-2">
                  {rows[rowKey].map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isSold = seat.status === 'SOLD';
                    const isHeld = seat.status === 'HELD';
                    const isAvailable = seat.status === 'AVAILABLE' && seat.active;
                    const isVIP = seat.seatType === 'VIP';
                    const isDouble = seat.seatType === 'DOUBLE';

                    let seatClasses = 'bg-white text-slate-700 border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 shadow-xs';
                    if (isSold) {
                      seatClasses = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50';
                    } else if (isHeld) {
                      seatClasses = 'bg-amber-100 border-amber-300 text-amber-800 cursor-not-allowed';
                    } else if (isSelected) {
                      seatClasses = 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/30 scale-105';
                    } else if (isVIP) {
                      seatClasses = 'bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-400';
                    } else if (isDouble) {
                      seatClasses = 'bg-pink-50 border-pink-200 text-pink-700 hover:border-pink-400 w-16';
                    }

                    return (
                      <button
                        key={seat.id}
                        onClick={() => toggleSelectSeat(seat)}
                        disabled={!isAvailable}
                        title={`Ghế ${seat.rowLabel}${seat.seatNumber} (${seat.seatType}) - ${formatPrice(getSeatPrice(seat))}`}
                        className={`h-9 min-w-9 px-1 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${seatClasses}`}
                      >
                        {seat.rowLabel}{seat.seatNumber}
                      </button>
                    );
                  })}
                </div>

                <span className="w-6 text-center font-bold text-xs text-slate-400">{rowKey}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-4 px-6 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-white border border-slate-300 shadow-xs" />
            <span className="text-slate-600">Ghế thường</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-purple-50 border border-purple-300" />
            <span className="text-purple-700">Ghế VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-rose-600 border border-rose-600 shadow-xs" />
            <span className="text-rose-600 font-bold">Đang chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-amber-100 border border-amber-300" />
            <span className="text-amber-700">Đang giữ chỗ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-slate-100 border border-slate-200 opacity-60" />
            <span className="text-slate-400">Đã bán</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-4 px-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Ghế đã chọn:</span>
              <span className="font-extrabold text-slate-900">
                {selectedSeats.length > 0
                  ? selectedSeats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')
                  : 'Chưa chọn ghế nào'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Tổng tiền:</span>
              <span className="text-2xl font-black text-rose-600 font-mono">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleBooking}
              disabled={selectedSeatIds.length === 0 || isSubmitting}
              className="flex-1 sm:flex-initial px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-rose-500/20 transition-all hover:scale-105"
            >
              {isSubmitting ? 'Đang giữ ghế...' : 'Tiếp tục thanh toán'}
            </button>
          </div>
        </div>
      </div>

      {/* Spacing for floating bar */}
      <div className="h-16" />
    </div>
  );
};
