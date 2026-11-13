import React, { useState, useEffect } from 'react';
import { showtimeApi, adminApi, movieApi, cinemaApi } from '../../services/api';
import type { Showtime, Movie, Cinema, Room } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Calendar, Plus, Trash2, X, Clock } from 'lucide-react';
import { toLocalDateString } from '../../utils/date';

export const AdminShowtimesPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateString(new Date()));
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number>(0);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number>(0);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(0);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [basePrice, setBasePrice] = useState<number>(85000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchShowtimes = async () => {
    try {
      setIsLoading(true);
      const data = await showtimeApi.getShowtimes(selectedDate);
      setShowtimes(data || []);
    } catch (err) {
      console.error('Lỗi tải lịch chiếu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShowtimes();
  }, [selectedDate]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [movData, cinData] = await Promise.all([
          movieApi.getMovies({ size: 100 }),
          cinemaApi.getCinemas(),
        ]);
        setMovies(movData.content || []);
        setCinemas(cinData || []);
      } catch (err) {
        console.error('Lỗi tải thông tin phim/rạp:', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      if (selectedCinemaId) {
        try {
          const roomList = await cinemaApi.getCinemaRooms(selectedCinemaId);
          setRooms(roomList || []);
          if (roomList.length > 0) setSelectedRoomId(roomList[0].id);
        } catch (err) {
          console.error('Lỗi tải phòng chiếu:', err);
        }
      } else {
        setRooms([]);
      }
    };
    loadRooms();
  }, [selectedCinemaId]);

  const openCreateModal = () => {
    setErrorMsg(null);
    if (movies.length > 0) setSelectedMovieId(movies[0].id);
    if (cinemas.length > 0) setSelectedCinemaId(cinemas[0].id);

    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const startStr = now.toISOString().slice(0, 16);
    const later = new Date(now.getTime() + 120 * 60000);
    const endStr = later.toISOString().slice(0, 16);

    setStartAt(startStr);
    setEndAt(endStr);
    setBasePrice(85000);
    setIsModalOpen(true);
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedMovieId || !selectedRoomId || !startAt || !endAt) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.createShowtime({
        movieId: Number(selectedMovieId),
        roomId: Number(selectedRoomId),
        startAt: `${startAt}:00`,
        endAt: `${endAt}:00`,
        basePrice: Number(basePrice),
        status: 'AVAILABLE',
      });

      setIsModalOpen(false);
      fetchShowtimes();
    } catch (err: any) {
      console.error('Lỗi tạo suất chiếu:', err);
      setErrorMsg(
        err.response?.data?.message || 'Không thể tạo suất chiếu (có thể bị trùng lịch phòng).'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShowtime = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn hủy suất chiếu này? Các booking PENDING liên quan sẽ bị hủy.')) return;

    try {
      await adminApi.deleteShowtime(id);
      fetchShowtimes();
    } catch (err: any) {
      console.error('Lỗi hủy suất chiếu:', err);
      alert('Không thể hủy suất chiếu này.');
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            Lập Lịch Suất Chiếu
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Xếp lịch chiếu theo phòng, thời gian và giá vé</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs"
          />
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm suất chiếu
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Đang tải danh sách suất chiếu..." size="md" />
      ) : showtimes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Chưa có suất chiếu nào trong ngày {selectedDate}</h3>
          <p className="text-xs text-slate-500">Nhấn nút "Thêm suất chiếu" để bắt đầu xếp lịch.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Phim</th>
                <th className="py-3 px-4">Rạp & Phòng</th>
                <th className="py-3 px-4">Bắt đầu</th>
                <th className="py-3 px-4">Kết thúc</th>
                <th className="py-3 px-4">Giá vé gốc</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showtimes.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{st.movie?.title}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{st.cinema?.name}</span> • <span className="text-slate-500 font-medium">{st.room?.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-600">
                    {st.startAt?.replace('T', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                    {st.endAt?.replace('T', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatPrice(st.basePrice)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {st.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteShowtime(st.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Hủy suất chiếu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add Showtime */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Thêm Suất Chiếu Mới</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateShowtime} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Chọn phim *</label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rạp chiếu *</label>
                  <select
                    value={selectedCinemaId}
                    onChange={(e) => setSelectedCinemaId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                  >
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phòng chiếu *</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.roomType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Giá vé gốc (VND) *</label>
                <input
                  type="number"
                  required
                  step={1000}
                  min={1000}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-mono font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo suất chiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
