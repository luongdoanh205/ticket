import React, { useState, useEffect } from 'react';
import { cinemaApi, adminApi } from '../../services/api';
import type { Cinema, Room } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MapPin, Plus, Home, Armchair, X } from 'lucide-react';

export const AdminCinemasPage: React.FC = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCinemaModalOpen, setIsCinemaModalOpen] = useState(false);
  const [cinemaName, setCinemaName] = useState('');
  const [cinemaAddress, setCinemaAddress] = useState('');
  const [cinemaPhone, setCinemaPhone] = useState('');

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('2D');

  const fetchCinemas = async () => {
    try {
      setIsLoading(true);
      const data = await cinemaApi.getCinemas();
      setCinemas(data || []);
      if (data.length > 0 && !selectedCinema) {
        setSelectedCinema(data[0]);
      }
    } catch (err) {
      console.error('Lỗi tải rạp chiếu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (selectedCinema) {
        try {
          const r = await cinemaApi.getCinemaRooms(selectedCinema.id);
          setRooms(r || []);
        } catch (err) {
          console.error('Lỗi tải danh sách phòng:', err);
        }
      }
    };
    fetchRooms();
  }, [selectedCinema]);

  const handleCreateCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cinemaName) return;

    try {
      await adminApi.createCinema({
        name: cinemaName,
        address: cinemaAddress,
        phone: cinemaPhone,
        status: 'ACTIVE',
      });
      setIsCinemaModalOpen(false);
      setCinemaName('');
      setCinemaAddress('');
      setCinemaPhone('');
      fetchCinemas();
    } catch (err: any) {
      console.error('Lỗi tạo rạp:', err);
      alert('Không thể tạo rạp mới.');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCinema || !roomName) return;

    try {
      const newRoom = await adminApi.createRoom({
        cinemaId: selectedCinema.id,
        name: roomName,
        roomType: roomType,
        status: 'ACTIVE',
      });

      const rows = ['A', 'B', 'C', 'D', 'E'];
      for (const row of rows) {
        for (let num = 1; num <= 8; num++) {
          const type = row === 'C' || row === 'D' ? 'VIP' : 'STANDARD';
          await adminApi.createSeat({
            roomId: newRoom.id,
            rowLabel: row,
            seatNumber: num,
            seatType: type,
            active: true,
          });
        }
      }

      setIsRoomModalOpen(false);
      setRoomName('');
      const r = await cinemaApi.getCinemaRooms(selectedCinema.id);
      setRooms(r || []);
      alert(`Đã tạo phòng ${newRoom.name} và tự động khởi tạo ma trận ghế chuẩn!`);
    } catch (err: any) {
      console.error('Lỗi tạo phòng:', err);
      alert('Không thể tạo phòng chiếu.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-500" />
            Quản Lý Cụm Rạp & Phòng Chiếu
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Cấu hình rạp chiếu, sơ đồ phòng và phân bố ghế</p>
        </div>

        <button
          onClick={() => setIsCinemaModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm rạp mới
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Đang tải dữ liệu rạp..." size="md" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cinemas List Column */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Danh sách rạp ({cinemas.length})
            </h3>

            <div className="space-y-2">
              {cinemas.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCinema(c)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                    selectedCinema?.id === c.id
                      ? 'bg-rose-50/70 border-rose-400 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-base">{c.name}</h4>
                    <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.address || 'Chưa cập nhật địa chỉ'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms in Selected Cinema */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Phòng chiếu tại: <span className="text-rose-600 font-extrabold">{selectedCinema?.name}</span>
              </h3>

              {selectedCinema && (
                <button
                  onClick={() => setIsRoomModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm phòng
                </button>
              )}
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
                <Home className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Rạp này chưa có phòng chiếu nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-900">{r.name}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {r.roomType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 font-medium">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Armchair className="w-4 h-4 text-rose-500" />
                        Đã khởi tạo ghế
                      </span>
                      <span className="text-emerald-700 font-bold">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Add Cinema */}
      {isCinemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Thêm Cụm Rạp Mới</h3>
              <button onClick={() => setIsCinemaModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCinema} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên rạp chiếu *</label>
                <input
                  type="text"
                  required
                  placeholder="CineTicket Metropolis Liễu Giai"
                  value={cinemaName}
                  onChange={(e) => setCinemaName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Địa chỉ</label>
                <input
                  type="text"
                  placeholder="29 Liễu Giai, Ba Đình, Hà Nội"
                  value={cinemaAddress}
                  onChange={(e) => setCinemaAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  placeholder="024 3888 9999"
                  value={cinemaPhone}
                  onChange={(e) => setCinemaPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCinemaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
                >
                  Tạo rạp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Room */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Thêm Phòng Chiếu</h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên phòng *</label>
                <input
                  type="text"
                  required
                  placeholder="Phòng chiếu 01 (Cinema 1)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Định dạng phòng *</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                >
                  <option value="2D">2D Digital</option>
                  <option value="3D">3D Digital</option>
                  <option value="IMAX">IMAX Laser</option>
                  <option value="4DX">4DX Motion</option>
                  <option value="GOLD_CLASS">Gold Class VIP</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-medium">
                💡 Hệ thống sẽ tự động tạo sơ đồ ghế chuẩn 40 ghế (Hàng A - E, mỗi hàng 8 ghế gồm cả ghế Standard và ghế VIP).
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
                >
                  Tạo phòng & Ghế
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
