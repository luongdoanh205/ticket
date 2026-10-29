import React from 'react';
import { Film, Heart, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">CineTicket</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Hệ thống đặt vé xem phim trực tuyến hiện đại, nhanh chóng và tiện lợi. Trải nghiệm rạp chiếu phim đỉnh cao cùng gia đình và bạn bè.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-sm uppercase tracking-wider">Khám phá</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/movies" className="hover:text-rose-600 transition-colors">
                  Phim đang chiếu
                </Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-rose-600 transition-colors">
                  Phim sắp chiếu
                </Link>
              </li>
              <li>
                <Link to="/showtimes" className="hover:text-rose-600 transition-colors">
                  Lịch chiếu toàn quốc
                </Link>
              </li>
              <li>
                <Link to="/tickets" className="hover:text-rose-600 transition-colors">
                  Tra cứu vé đã mua
                </Link>
              </li>
            </ul>
          </div>

          {/* Policy & Terms */}
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-sm uppercase tracking-wider">Hỗ trợ & Chính sách</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li className="hover:text-rose-600 cursor-pointer">Quy chế hoạt động</li>
              <li className="hover:text-rose-600 cursor-pointer">Chính sách bảo mật</li>
              <li className="hover:text-rose-600 cursor-pointer">Chính sách hoàn tiền & hủy vé</li>
              <li className="hover:text-rose-600 cursor-pointer">Câu hỏi thường gặp (FAQ)</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-sm uppercase tracking-wider">Liên hệ</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500" />
                <span>Hotline: 1900 6868 (8:00 - 22:00)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" />
                <span>support@cineticket.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 mt-0.5" />
                <span>Hà Nội & TP. Hồ Chí Minh, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 CineTicket. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0 font-medium">
            Xây dựng với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> & Spring Boot + React
          </p>
        </div>
      </div>
    </footer>
  );
};
