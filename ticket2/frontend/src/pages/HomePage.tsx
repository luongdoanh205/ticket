import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Calendar, Clock, Sparkles, ChevronRight, Search, Film } from 'lucide-react';
import { movieApi } from '../services/api';
import type { Movie, Genre } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const HomePage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeTab, setActiveTab] = useState<'NOW_SHOWING' | 'COMING_SOON'>('NOW_SHOWING');
  const [selectedGenre, setSelectedGenre] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [moviesRes, genresRes] = await Promise.all([
          movieApi.getMovies({ size: 50 }),
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
    fetchData();
  }, []);

  const filteredMovies = movies.filter((movie) => {
    const matchesTab = movie.status === activeTab;
    const matchesGenre =
      selectedGenre === 'ALL' || movie.genres?.some((g) => g.id === selectedGenre);
    const matchesSearch =
      searchQuery.trim() === '' ||
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.director && movie.director.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesGenre && matchesSearch;
  });

  const featuredMovie = movies.find((m) => m.status === 'NOW_SHOWING') || movies[0];

  if (isLoading) {
    return <LoadingSpinner message="Đang tải dữ liệu rạp phim..." size="lg" />;
  }

  return (
    <div className="space-y-12">
      {/* Hero Banner Section */}
      {featuredMovie && (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay filter blur-sm scale-105"
            style={{
              backgroundImage: `url(${featuredMovie.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

          <div className="relative max-w-5xl px-6 py-12 md:py-16 md:px-12 flex flex-col md:flex-row items-center gap-8">
            {/* Poster thumbnail */}
            <div className="w-52 md:w-60 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-rose-950/50 border-2 border-white/20 group">
              <img
                src={featuredMovie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                alt={featuredMovie.title}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>

            {/* Info */}
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Phim Nổi Bật Hôm Nay
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {featuredMovie.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-4 h-4 text-rose-400" />
                  {featuredMovie.duration} phút
                </span>
                {featuredMovie.releaseDate && (
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-4 h-4 text-rose-400" />
                    {new Date(featuredMovie.releaseDate).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {featuredMovie.genres && (
                  <div className="flex gap-1.5 flex-wrap">
                    {featuredMovie.genres.map((g) => (
                      <span key={g.id} className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-xs font-medium">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-slate-300 text-sm md:text-base line-clamp-3 max-w-2xl leading-relaxed">
                {featuredMovie.description || 'Trải nghiệm đỉnh cao công nghệ điện ảnh sống động ngay tại các cụm rạp CineTicket trên toàn quốc.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link
                  to={`/movies/${featuredMovie.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow-lg shadow-rose-600/30 hover:from-rose-500 hover:to-rose-400 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Đặt vé ngay
                </Link>
                <Link
                  to={`/movies/${featuredMovie.id}`}
                  className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold backdrop-blur-sm transition-colors border border-white/20"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('NOW_SHOWING')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'NOW_SHOWING'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phim đang chiếu
            </button>
            <button
              onClick={() => setActiveTab('COMING_SOON')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'COMING_SOON'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phim sắp chiếu
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm phim, đạo diễn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Genre Tags */}
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
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedGenre === genre.id
                  ? 'bg-rose-50 text-rose-600 border-rose-300'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Film className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy phim phù hợp</h3>
          <p className="text-sm text-slate-500 mt-1">Vui lòng thử tìm kiếm với từ khóa khác hoặc đổi thể loại.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => navigate(`/movies/${movie.id}`)}
              className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1.5"
            >
              {/* Poster container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100">
                <img
                  src={movie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
                  }}
                />

                {/* Status tag */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-md ${
                      movie.status === 'NOW_SHOWING'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}
                  </span>
                </div>

                {/* Duration */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-white">
                  {movie.duration}p
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Movie info */}
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
