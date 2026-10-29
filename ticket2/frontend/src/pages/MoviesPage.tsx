import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieApi } from '../services/api';
import type { Movie, Genre } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Film, Search, ChevronRight } from 'lucide-react';

export const MoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeStatus, setActiveStatus] = useState<'ALL' | 'NOW_SHOWING' | 'COMING_SOON'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [moviesRes, genresRes] = await Promise.all([
          movieApi.getMovies({ size: 100 }),
          movieApi.getGenres(),
        ]);
        setMovies(moviesRes.content || []);
        setGenres(genresRes || []);
      } catch (err) {
        console.error('Lỗi tải danh sách phim:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMovies = movies.filter((movie) => {
    const matchStatus = activeStatus === 'ALL' || movie.status === activeStatus;
    const matchGenre =
      selectedGenre === 'ALL' || movie.genres?.some((g) => g.id === selectedGenre);
    const matchSearch =
      searchQuery.trim() === '' ||
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.director && movie.director.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchGenre && matchSearch;
  });

  if (isLoading) {
    return <LoadingSpinner message="Đang tải danh sách phim..." size="lg" />;
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Film className="w-8 h-8 text-rose-500" />
          Danh Mục Phim Chiếu Rạp
        </h1>
        <p className="text-sm text-slate-500 mt-1">Các tác phẩm điện ảnh bom tấn hot nhất</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveStatus('ALL')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveStatus('NOW_SHOWING')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeStatus === 'NOW_SHOWING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang chiếu
          </button>
          <button
            onClick={() => setActiveStatus('COMING_SOON')}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeStatus === 'COMING_SOON' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sắp chiếu
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên phim, diễn viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-xs transition-colors"
          />
        </div>
      </div>

      {/* Genre Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedGenre('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
            selectedGenre === 'ALL'
              ? 'bg-rose-50 text-rose-600 border-rose-300'
              : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-xs'
          }`}
        >
          Tất cả thể loại
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGenre(g.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              selectedGenre === g.id
                ? 'bg-rose-50 text-rose-600 border-rose-300'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-xs'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Film className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy phim phù hợp</h3>
          <p className="text-sm text-slate-500 mt-1">Vui lòng thay đổi tiêu chí tìm kiếm hoặc thể loại.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => navigate(`/movies/${movie.id}`)}
              className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1.5"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100">
                <img
                  src={movie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-md ${
                      movie.status === 'NOW_SHOWING' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}
                  </span>
                </div>
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-white">
                  {movie.duration}p
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-600 transition-colors line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {movie.genres?.map((g) => g.name).join(', ') || 'Nhiều thể loại'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Sắp ra mắt'}</span>
                  <span className="text-rose-600 font-bold group-hover:translate-x-1 transition-transform flex items-center">
                    Đặt vé <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
