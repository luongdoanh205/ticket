import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showtimeApi, cinemaApi } from '../services/api';
import type { Showtime, Cinema } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Calendar, MapPin, Clock } from 'lucide-react';

export const ShowtimesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // 7 days date selector
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `Th ${d.getDay() + 1 === 1 ? 'CN' : d.getDay() + 1}`;
    const dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;
    return { dateStr, dayName, dayMonth };
  });

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const data = await cinemaApi.getCinemas();
        setCinemas(data || []);
      } catch (err) {
        console.error('Lỗi tải rạp chiếu:', err);
      }
    };
    fetchCinemas();
  }, []);

  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        setIsLoading(true);
        const data = await showtimeApi.getShowtimes(
          selectedDate,
          undefined,
          selectedCinemaId === 'ALL' ? undefined : selectedCinemaId
        );
        setShowtimes(data || []);
      } catch (err) {
        console.error('Lỗi tải lịch chiếu:', err);
        setShowtimes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShowtimes();
  }, [selectedDate, selectedCinemaId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Group showtimes by Cinema, then by Movie
  const groupedData = showtimes.reduce((acc, st) => {
    if (selectedCinemaId !== 'ALL' && st.cinema?.id !== selectedCinemaId) return acc;

    const cinemaName = st.cinema?.name || 'Rạp CineTicket';
    const movieId = st.movie?.id || 0;

    if (!acc[cinemaName]) {
      acc[cinemaName] = {};
    }
    if (!acc[cinemaName][movieId]) {
      acc[cinemaName][movieId] = {
        movie: st.movie,
        slots: [],
      };
    }
    acc[cinemaName][movieId].slots.push(st);
    return acc;
  }, {} as Record<string, Record<number, { movie: any; slots: Showtime[] }>>);

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Calendar className="w-8 h-8 text-rose-500" />
          Lịch Chiếu Phim Toàn Quốc
        </h1>
        <p className="text-sm text-slate-500 mt-1">Chọn ngày và rạp để tìm suất chiếu thuận tiện nhất</p>
      </div>

      {/* Date selection bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {dateOptions.map((opt) => (
          <button
            key={opt.dateStr}
            onClick={() => setSelectedDate(opt.dateStr)}
            className={`flex flex-col items-center min-w-[95px] py-3 px-4 rounded-2xl border transition-all ${
              selectedDate === opt.dateStr
                ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/20 scale-105 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <span className="text-xs font-semibold">{opt.dayName}</span>
            <span className="text-lg font-extrabold mt-0.5">{opt.dayMonth}</span>
          </button>
        ))}
      </div>

      {/* Cinema Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCinemaId('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors shadow-xs ${
            selectedCinemaId === 'ALL'
              ? 'bg-rose-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Tất cả các rạp
        </button>
        {cinemas.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCinemaId(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors shadow-xs ${
              selectedCinemaId === c.id
                ? 'bg-rose-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Showtimes List */}
      {isLoading ? (
        <LoadingSpinner message="Đang tải danh sách suất chiếu..." size="md" />
      ) : Object.keys(groupedData).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <Clock className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy suất chiếu nào</h3>
          <p className="text-sm text-slate-500">Vui lòng chọn ngày khác hoặc chọn cụm rạp khác.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedData).map(([cinemaName, moviesObj]) => (
            <div
              key={cinemaName}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">
                <MapPin className="w-6 h-6 text-rose-500" />
                {cinemaName}
              </div>

              <div className="space-y-6 divide-y divide-slate-100">
                {Object.values(moviesObj).map(({ movie, slots }) => (
                  <div key={movie?.id} className="pt-6 first:pt-0 flex flex-col md:flex-row gap-6">
                    {/* Movie Thumb */}
                    <div className="w-24 h-36 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                      <img
                        src={movie?.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80'}
                        alt={movie?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Movie info & Slots */}
                    <div className="flex-1 space-y-3">
                      <h4 className="text-lg font-extrabold text-slate-900">{movie?.title}</h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                        {slots.map((st) => {
                          const timeStr = st.startAt?.split('T')[1]?.slice(0, 5) || '00:00';
                          return (
                            <button
                              key={st.id}
                              onClick={() => navigate(`/booking/${st.id}`)}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/60 transition-all text-center group shadow-xs"
                            >
                              <span className="text-base font-black text-slate-900 group-hover:text-rose-600 font-mono">
                                {timeStr}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                                {st.room?.name}
                              </span>
                              <span className="text-[11px] font-bold text-rose-600 block mt-0.5">
                                {formatPrice(st.basePrice)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
