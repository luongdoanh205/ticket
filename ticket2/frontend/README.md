# CineTicket Frontend — Hệ Thống Đặt Vé Xem Phim Trực Tuyến

Giao diện người dùng hiện đại, tốc độ cao được xây dựng đồng bộ với hệ thống Backend Spring Boot của dự án **ticket2**.

---

## 🚀 Công Nghệ Sử Dụng

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 (Modern Dark Cinema Theme)
- **Routing:** React Router DOM v7
- **Icons:** Lucide React
- **API Client:** Axios (Interceptor gắn JWT Bearer Token tự động, Proxy chuyển tiếp `/api` sang `http://localhost:8080`)

---

## 🎬 Các Chức Năng Đã Triển Khai

### 1. Phân Hệ Khách Hàng (Customer)
- **Trang chủ (`/`):**
  - Banner Hero nổi bật phim bom tấn hôm nay với hiệu ứng backdrop mờ.
  - Tabs chuyển đổi linh hoạt: *Phim đang chiếu* (`NOW_SHOWING`) và *Phim sắp chiếu* (`COMING_SOON`).
  - Thanh tìm kiếm phim nhanh theo tên/đạo diễn, bộ lọc thể loại (Action, Horror, Romance...).
- **Chi tiết phim & Lịch chiếu (`/movies/:id`):**
  - Thông tin đạo diễn, diễn viên, thời lượng, ngày khởi chiếu, nội dung phim.
  - Bộ chọn ngày chiếu (7 ngày tới), nhóm suất chiếu theo từng cụm rạp và phòng.
- **Sơ đồ chọn ghế trực quan (`/booking/:showtimeId`):**
  - Mô phỏng màn hình chiếu cong phát sáng.
  - Ma trận ghế theo hàng và số ghế (`A1`, `B5`, ...), phân loại ghế Thường (`STANDARD`), VIP, Đôi (`DOUBLE`).
  - Phản ánh trạng thái ghế thời gian thực: Ghế trống, Ghế đang chọn, Ghế đang giữ chỗ (`HELD`), Ghế đã bán (`SOLD`).
  - Thanh nổi bên dưới tóm tắt ghế đã chọn, tính tổng tiền và chuyển sang bước đặt chỗ.
- **Thanh toán đơn vé (`/payment/:bookingId`):**
  - Đồng hồ đếm ngược thời gian giữ chỗ 10 phút (`holdExpiresAt`) chuẩn nghiệp vụ.
  - Tích hợp cổng thanh toán mô phỏng (Sandbox mock payment).
  - Tùy chọn hủy đơn giải phóng ghế ngay lập tức.
- **Vé điện tử E-Ticket (`/tickets`):**
  - Hiển thị vé điện tử thiết kế rãnh xé vé thực tế, mã quét QR/Barcode.
  - Trạng thái vé rõ ràng: Hợp lệ (`VALID`), Đã soát vé (`USED`), Đã hủy (`CANCELLED`).
- **Lịch sử đặt vé (`/bookings`):**
  - Danh sách đơn hàng theo trạng thái `PAID`, `PENDING`, `CANCELLED`, `EXPIRED`.
- **Tài khoản cá nhân (`/profile`):**
  - Cập nhật họ tên, số điện thoại (`PUT /me`).
  - Đổi mật khẩu bảo mật (`POST /me/change-password`).
- **Xác thực (`/login`, `/register`):**
  - Đăng ký tài khoản khách hàng, đăng nhập nhận JWT Token, bảo lưu phiên đăng nhập.

---

### 2. Phân Hệ Quản Trị Viên (Admin Portal — `/admin`)
- **Dashboard Doanh Thu (`/admin`):**
  - Lọc theo khoảng ngày `from` - `to`.
  - Thống kê tổng doanh thu, số vé đã thanh toán, phân bổ đơn hàng theo trạng thái.
- **Quản lý phim (`/admin/movies`):**
  - Danh sách phim, modal thêm mới / chỉnh sửa phim đầy đủ thông tin (poster, thời lượng, thể loại).
  - Kết thúc chiếu chuyển trạng thái `ENDED` mà không làm hỏng dữ liệu liên kết.
- **Lập lịch suất chiếu (`/admin/showtimes`):**
  - Tạo lịch chiếu phim theo phòng, ngày giờ bắt đầu, kết thúc, giá vé gốc.
  - Kiểm tra xung đột lịch và hủy suất chiếu an toàn.
- **Soát vé tại rạp (`/admin/checkin`):**
  - Tra cứu và kiểm tra tính hợp lệ của vé theo mã vé/QR (`/admin/tickets/{code}/validate`).
  - Xác nhận check-in cho khách vào rạp (`/admin/tickets/{code}/use`).
- **Quản lý người dùng (`/admin/users`):**
  - Danh sách tài khoản, chuyển đổi vai trò (`CUSTOMER` <-> `ADMIN`), Khóa/Mở khóa tài khoản (`ACTIVE` / `LOCKED`).
- **Cụm rạp & Phòng chiếu (`/admin/cinemas`):**
  - Thêm cụm rạp mới.
  - Thêm phòng chiếu (2D, 3D, IMAX...) và tự động sinh ma trận ghế chuẩn.

---

## 🛠️ Hướng Dẫn Chạy

1. Mở terminal tại thư mục `frontend`:
   ```bash
   cd "C:\Users\ADMIN\OneDrive\Máy tính\ticket2\frontend"
   ```

2. Khởi chạy môi trường phát triển (Dev server):
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: **`http://localhost:5173`**

3. Build bản phát hành (Production build):
   ```bash
   npm run build
   ```
