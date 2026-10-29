import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingApi } from '../services/api';
import type { Booking } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { CreditCard, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const { bookingId: paramBookingId } = useParams<{ bookingId: string }>();
  const bookingId = paramBookingId ? parseInt(paramBookingId, 10) : 0;
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        const data = await bookingApi.getBookingById(bookingId);
        setBooking(data);
        if (data.status === 'PAID') {
          setPaymentSuccess(true);
        }
      } catch (err: any) {
        console.error('Lỗi tải thông tin đơn đặt vé:', err);
        setErrorMessage(err.response?.data?.message || 'Không thể tìm thấy thông tin đơn đặt vé này.');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleMockPayment = async () => {
    if (!booking) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const ref = `web-${booking.id}-${Date.now()}`;
      await bookingApi.createPayment(booking.id, {
        method: 'MOCK',
        transactionRef: ref,
        amount: booking.totalAmount,
        success: true,
      });

      setPaymentSuccess(true);
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err);
      setErrorMessage(
        err.response?.data?.message || 'Thanh toán thất bại hoặc đơn đặt vé đã hết thời gian giữ chỗ.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này và giải phóng ghế đã chọn?')) return;

    try {
      setIsProcessing(true);
      await bookingApi.cancelBooking(booking.id);
      navigate('/');
    } catch (err: any) {
      console.error('Lỗi hủy đơn:', err);
      alert('Không thể hủy đơn đặt vé này.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (isLoading) {
    return <LoadingSpinner message="Đang tải thông tin đơn thanh toán..." size="lg" />;
  }

  if (errorMessage && !booking) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{errorMessage}</h2>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
        >
          Trở về trang chủ
        </button>
      </div>
    );
  }

  // Success view
  if (paymentSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in duration-300">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Thanh Toán Thành Công!</h2>
          <p className="text-slate-500">
            Vé xem phim điện tử của bạn đã được khởi tạo và lưu trữ trong hệ thống.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-slate-800">#{booking?.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Phim:</span>
            <span className="font-bold text-slate-900">{booking?.showtime?.movie?.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Rạp & Suất chiếu:</span>
            <span className="text-slate-700 font-semibold">
              {booking?.showtime?.cinema?.name} ({booking?.showtime?.startAt?.replace('T', ' ')})
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Ghế:</span>
            <span className="font-bold text-rose-600">
              {booking?.seats?.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ') }
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-bold">
            <span className="text-slate-900">Tổng tiền đã thanh toán:</span>
            <span className="text-emerald-600 font-mono text-lg">{formatPrice(booking?.totalAmount || 0)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/tickets"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow-lg shadow-rose-500/20 hover:scale-105 transition-all"
          >
            <Ticket className="w-5 h-5" />
            Xem vé xem phim của tôi
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title & Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Thanh Toán Đơn Đặt Vé</h1>
          <p className="text-sm font-medium text-slate-500">Mã đơn: #{booking?.id}</p>
        </div>

        {booking?.holdExpiresAt && (
          <CountdownTimer
            expiresAt={booking.holdExpiresAt}
            onExpire={() => {
              setErrorMessage('Hết thời gian giữ chỗ! Đơn hàng đã bị tự động hủy.');
            }}
          />
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Booking Summary Box */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Thông tin đơn hàng
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Phim</span>
              <p className="text-base font-extrabold text-slate-900">{booking?.showtime?.movie?.title}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Rạp & Phòng</span>
              <p className="font-semibold text-slate-700">
                {booking?.showtime?.cinema?.name} • {booking?.showtime?.room?.name}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Thời gian chiếu</span>
              <p className="font-bold text-rose-600 font-mono">
                {booking?.showtime?.startAt?.replace('T', ' ')}
              </p>
            </div>
          </div>

          <div className="space-y-3 md:border-l md:border-slate-100 md:pl-6">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Danh sách ghế ({booking?.seats?.length} ghế)</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {booking?.seats?.map((seat) => (
                  <span
                    key={seat.seatId}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 text-xs"
                  >
                    {seat.rowLabel}{seat.seatNumber}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Tổng số tiền cần thanh toán</span>
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {formatPrice(booking?.totalAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Phương thức thanh toán
          </h4>

          <div className="p-4 rounded-2xl bg-rose-50/50 border-2 border-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 text-sm">Cổng thanh toán Mô Phỏng (Sandbox)</h5>
                <p className="text-xs text-slate-500">
                  Hệ thống thử nghiệm tự động xác nhận thanh toán an toàn
                </p>
              </div>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={handleCancelBooking}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors"
          >
            Hủy đơn hàng
          </button>
          <button
            onClick={handleMockPayment}
            disabled={isProcessing}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold shadow-lg shadow-rose-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Đang xử lý giao dịch...' : 'Xác nhận thanh toán ngay'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
