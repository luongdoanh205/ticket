import React, { useState, useEffect } from 'react';
import { movieApi, adminApi } from '../../services/api';
import type { Movie, Genre } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Film, Plus, Edit2, Trash2, X } from 'lucide-react';
import { toLocalDateString } from '../../utils/date';

export const AdminMoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number>(120);
  const [releaseDate, setReleaseDate] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [director, setDirector] = useState('');
  const [castNames, setCastNames] = useState('');
  const [status, setStatus] = useState<'NOW_SHOWING' | 'COMING_SOON' | 'ENDED'>('NOW_SHOWING');
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMoviesAndGenres = async () => {
    try {
      setIsLoading(true);
      const [moviesRes, genresRes] = await Promise.all([
        movieApi.getMovies({ size: 100 }),
        movieApi.getGenres(),
      ]);
      setMovies(moviesRes.content || []);
      setGenres(genresRes || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu phim:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoviesAndGenres();
  }, []);

  const openCreateModal = () => {
    setEditingMovie(null);
    setTitle('');
    setDescription('');
    setDuration(120);
    setReleaseDate(toLocalDateString(new Date()));
    setPosterUrl('');
    setDirector('');
    setCastNames('');
    setStatus('NOW_SHOWING');
    setSelectedGenreIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Movie) => {
    setEditingMovie(m);
    setTitle(m.title);
    setDescription(m.description || '');
    setDuration(m.duration);
    setReleaseDate(m.releaseDate || '');
    setPosterUrl(m.posterUrl || '');
    setDirector(m.director || '');
    setCastNames(m.castNames || '');
    setStatus(m.status);
    setSelectedGenreIds(m.genres?.map((g) => g.id) || []);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      setIsSaving(true);
      const payload = {
        title,
        description,
        duration: Number(duration),
        releaseDate: releaseDate || undefined,
        posterUrl,
        director,
        castNames,
        status,
        genreIds: selectedGenreIds,
      };

      if (editingMovie) {
        await adminApi.updateMovie(editingMovie.id, payload);
      } else {
        await adminApi.createMovie(payload);
      }

      setIsModalOpen(false);
      fetchMoviesAndGenres();
    } catch (err: any) {
      console.error('Lỗi lưu phim:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu phim.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn kết thúc chiếu (trạng thái ENDED) cho phim này?')) return;
    try {
      await adminApi.deleteMovie(id);
      fetchMoviesAndGenres();
    } catch (err) {
      console.error('Lỗi kết thúc phim:', err);
      alert('Không thể cập nhật trạng thái phim.');
    }
  };

  const toggleGenre = (genreId: number) => {
    if (selectedGenreIds.includes(genreId)) {
      setSelectedGenreIds(selectedGenreIds.filter((id) => id !== genreId));
    } else {
      setSelectedGenreIds([...selectedGenreIds, genreId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            Danh Sách Phim Chiếu
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Thêm mới, chỉnh sửa và quản lý trạng thái phát hành</p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm phim mới
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Đang tải danh sách phim..." size="md" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Poster & Phim</th>
                  <th className="py-3 px-4">Thời lượng</th>
                  <th className="py-3 px-4">Thể loại</th>
                  <th className="py-3 px-4">Khởi chiếu</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movies.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=150&q=80'}
                        alt={m.title}
                        className="w-10 h-14 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{m.title}</span>
                        <span className="text-xs text-slate-500 block line-clamp-1">{m.director}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{m.duration} phút</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {m.genres?.map((g) => (
                          <span key={g.id} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {m.releaseDate ? new Date(m.releaseDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          m.status === 'NOW_SHOWING'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : m.status === 'COMING_SOON'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Sửa phim"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {m.status !== 'ENDED' && (
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Kết thúc chiếu (ENDED)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Movie */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-slate-900">
                {editingMovie ? 'Chỉnh Sửa Phim' : 'Thêm Phim Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên phim *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thời lượng (phút) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái phát hành *</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors font-medium"
                  >
                    <option value="NOW_SHOWING">NOW_SHOWING (Đang chiếu)</option>
                    <option value="COMING_SOON">COMING_SOON (Sắp chiếu)</option>
                    <option value="ENDED">ENDED (Đã kết thúc)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ngày khởi chiếu</label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Đạo diễn</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">URL Poster Ảnh</label>
                <input
                  type="url"
                  placeholder="https://example.com/poster.jpg"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Diễn viên</label>
                <input
                  type="text"
                  placeholder="Tom Cruise, Margot Robbie, ..."
                  value={castNames}
                  onChange={(e) => setCastNames(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nội dung tóm tắt</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Genres Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Thể loại</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => {
                    const isSelected = selectedGenreIds.includes(g.id);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => toggleGenre(g.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
