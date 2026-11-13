import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieApi, showtimeApi } from '../services/api';
import type { Movie, Showtime } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Clock, Calendar, Film, User, ChevronLeft, MapPin } from 'lucide-react';
import { toLocalDateString } from '../utils/date';

export const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = id ? parseInt(id, 10) : 0;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateString(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  // Generate next 7 dates
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateString(d);
    const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `Th ${d.getDay() + 1 === 1 ? 'CN' : d.getDay() + 1}`;
    const dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;
    return { dateStr, dayName, dayMonth };
  });

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setIsLoading(true);
        const data = await movieApi.getMovieById(movieId);
        setMovie(data);
      } catch (err) {
        console.error('Lỗi lấy chi tiết phim:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  useEffect(() => {
    const fetchShowtimes = async () => {
      if (!movieId) return;
      try {
        setLoadingShowtimes(true);
        const data = await showtimeApi.getShowtimes(selectedDate, movieId);
        // Ensure client-side filtering by movieId as documented in API.md
        const filtered = data.filter((st) => st.movie?.id === movieId && st.status === 'AVAILABLE');
        setShowtimes(filtered);
      } catch (err) {
        console.error('Lỗi lấy danh sách suất chiếu:', err);
        setShowtimes([]);
      } finally {
        setLoadingShowtimes(false);
      }
    };
    fetchShowtimes();
  }, [movieId, selectedDate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Group showtimes by cinema
  const groupedByCinema = showtimes.reduce((acc, st) => {
    const cinemaName = st.cinema?.name || 'Rạp CineTicket';
    if (!acc[cinemaName]) {
      acc[cinemaName] = [];
    }
    acc[cinemaName].push(st);
    return acc;
  }, {} as Record<string, Showtime[]>);

  if (isLoading) {
    return <LoadingSpinner message="Đang tải thông tin phim..." size="lg" />;
  }

  if (!movie) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy thông tin phim</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-sm transition-colors"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      {/* Hero Movie Details Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        {/* Poster */}
        <div className="md:col-span-1 flex justify-center">
          <div className="w-full max-w-[280px] aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <img
              src={movie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                movie.status === 'NOW_SHOWING' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}
            </span>

            {movie.genres?.map((g) => (
              <span key={g.id} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {g.name}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {movie.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Thời lượng</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-rose-500" />
                {movie.duration} phút
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Khởi chiếu</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-4 h-4 text-rose-500" />
                {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Đạo diễn</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-rose-500" />
                {movie.director || 'Đang cập nhật'}
              </span>
            </div>
          </div>

          {movie.castNames && (
            <div className="pt-2">
              <span className="text-xs text-slate-400 block font-medium">Diễn viên</span>
              <p className="text-sm text-slate-800 font-semibold mt-0.5">{movie.castNames}</p>
            </div>
          )}

          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-1 font-medium">Nội dung phim</span>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {movie.description || 'Chưa có tóm tắt chi tiết cho bộ phim này.'}
            </p>
          </div>
        </div>
      </div>

      {/* Showtime Schedule Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Film className="w-6 h-6 text-rose-500" />
            Lịch chiếu phim
          </h2>
        </div>

        {/* Date Selector */}
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

        {/* Showtimes by Cinema */}
        {loadingShowtimes ? (
          <LoadingSpinner message="Đang tìm lịch chiếu..." size="sm" />
        ) : Object.keys(groupedByCinema).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700 font-bold">Không có suất chiếu nào trong ngày đã chọn</p>
            <p className="text-xs text-slate-500 mt-1">Vui lòng chọn ngày khác để xem lịch chiếu.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByCinema).map(([cinemaName, list]) => (
              <div
                key={cinemaName}
                className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg border-b border-slate-100 pb-3">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  {cinemaName}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                  {list.map((st) => {
                    const timeOnly = st.startAt ? st.startAt.split('T')[1]?.slice(0, 5) : '00:00';
                    return (
                      <button
                        key={st.id}
                        onClick={() => navigate(`/booking/${st.id}`)}
                        className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/60 transition-all text-center shadow-xs"
                      >
                        <span className="text-lg font-black text-slate-900 group-hover:text-rose-600 font-mono">
                          {timeOnly}
                        </span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5">
                          {st.room?.name || 'Phòng chiếu'}
                        </span>
                        <span className="text-[11px] font-bold text-rose-600 mt-1">
                          {formatPrice(st.basePrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
