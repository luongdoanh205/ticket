# Ticket2 API Reference for Frontend

Tài liệu này được tổng hợp từ controller và DTO hiện có trong backend. Base path là `/api`; JSON là định dạng request/response. Ngày dùng `YYYY-MM-DD`; ngày giờ dùng ISO local datetime, ví dụ `2026-10-16T19:30:00`.

## Kết nối và xác thực

- Backend local mặc định: `http://localhost:8080`.
- FE chạy Vite có thể proxy `/api` đến `http://localhost:8080` (đã cấu hình trong `frontend/vite.config.ts`).
- Với endpoint cần đăng nhập gửi header `Authorization: Bearer <accessToken>`.
- Token JWT hết hạn sau 1 giờ. Đăng nhập lại khi API trả `401`.
- Đăng nhập và catalog công khai. `/api/admin/**` yêu cầu role quản trị phù hợp; bán vé quầy và soát vé cho phép `STAFF`, các thao tác quản trị khác giới hạn `MANAGER`/`ADMIN` hoặc `ADMIN`; `/api/me/**`, `/api/bookings/**`, `/api/tickets/**` yêu cầu tài khoản đã đăng nhập.
- User bị khóa (`LOCKED`) không thể đăng nhập; token của user không còn `ACTIVE` cũng không xác thực request.
- Lỗi nghiệp vụ thường có dạng `{ "code": "...", "message": "...", "timestamp": "..." }`. Lỗi xác thực/phân quyền do Spring Security có thể khác định dạng.
- Enum được gửi/nhận dưới dạng chuỗi viết hoa.

## Enum

| Nhóm | Giá trị |
|---|---|
| Movie status | `COMING_SOON`, `NOW_SHOWING`, `ENDED` |
| Showtime status | `AVAILABLE`, `FULL`, `CANCELLED` |
| Seat status (catalog response) | `AVAILABLE`, `HELD`, `SOLD`, `INACTIVE` |
| Account status | `ACTIVE`, `LOCKED` |
| Role | `CUSTOMER`, `ADMIN` |
| Cinema/room record status | `ACTIVE`, `INACTIVE` |
| Booking status | `PENDING`, `PAID`, `CANCELLED`, `EXPIRED` |
| Payment status | `PENDING`, `SUCCESS`, `FAILED` |
| Ticket status | `VALID`, `USED`, `CANCELLED` |
| Booking-seat hold status | `HELD`, `RELEASED`, `SOLD` |

## Auth — công khai

### `POST /auth/register`

Tạo tài khoản CUSTOMER. Body:

```json
{ "fullName": "Nguyễn An", "email": "an@example.com", "password": "password123", "phone": "0900000000" }
```

`phone` có thể null; `fullName`, email và password bắt buộc; password ít nhất 8 ký tự. Thành công `201`:

```json
{ "id": 12, "fullName": "Nguyễn An", "email": "an@example.com", "role": "CUSTOMER" }
```

Email đã tồn tại: `409 EMAIL_EXISTS`. **Hiện chưa có API xác thực email hoặc gửi lại email xác thực.**

### `POST /auth/login`

Body: `{ "email": "an@example.com", "password": "password123" }`.

Thành công `200`: `{ "accessToken": "<jwt>", "tokenType": "Bearer", "expiresIn": 3600, "user": { "id": 12, "fullName": "Nguyễn An", "email": "an@example.com", "role": "CUSTOMER" } }`.

Thông tin đăng nhập sai hoặc tài khoản bị khóa: `401 INVALID_CREDENTIALS`.

## Catalog — công khai

### `GET /movies`

Query tùy chọn: `q` (tìm theo tên), `status`, `genreId`, `page` (mặc định `0`), `size` (mặc định `20`, tối đa `100`). Response:

```json
{ "content": [{ "id": 1, "title": "Tên phim", "description": "...", "duration": 120, "releaseDate": "2026-10-16", "posterUrl": "https://...", "director": "...", "castNames": "...", "status": "NOW_SHOWING", "genres": [{ "id": 2, "name": "Hành động" }], "createdAt": "...", "updatedAt": "..." }], "page": 0, "size": 20, "totalElements": 1 }
```

Các trường có thể null tùy dữ liệu. `genres` là danh sách thể loại.

### `GET /movies/{id}`

Trả về object phim như một phần tử trong `content`; không tồn tại: `404 MOVIE_NOT_FOUND`.

### `GET /genres`

Trả danh sách `{ id, name, description, createdAt, updatedAt }`.

### `GET /cinemas`

Trả danh sách `{ id, name, address, phone, status, createdAt, updatedAt }`.

### `GET /cinemas/{id}/rooms`

Trả danh sách phòng của rạp, gồm `{ id, cinema, name, roomType, status, createdAt, updatedAt }`. `cinema` là object rạp.

### `GET /rooms/{id}/seats`

Query tùy chọn `showtimeId`. Trả danh sách `{ id, rowLabel, seatNumber, seatType, active, status }`. Truyền `showtimeId` để nhận trạng thái ghế theo suất. Không truyền thì trạng thái bận có thể không phản ánh suất cụ thể. Lỗi: `404 SHOWTIME_NOT_FOUND`, `400 SHOWTIME_ROOM_MISMATCH`.

### `GET /showtimes`

`date` là query bắt buộc (`YYYY-MM-DD`); `movieId`, `cinemaId` là tùy chọn. Mỗi phần tử:

```json
{ "id": 5, "movie": { "id": 1, "title": "Tên phim", "posterUrl": "https://..." }, "cinema": { "id": 2, "name": "Rạp trung tâm" }, "room": { "id": 3, "name": "Phòng 1" }, "startAt": "2026-10-16T19:30:00", "endAt": "2026-10-16T21:30:00", "basePrice": 90000, "status": "AVAILABLE" }
```

**Giới hạn hiện tại:** backend chỉ lọc theo phim và rạp khi có đồng thời `movieId` và `cinemaId`. Nếu gửi riêng một trong hai, response hiện là toàn bộ suất trong ngày; FE cần lọc bổ sung ở client hoặc backend cần được sửa.

## Tài khoản — cần đăng nhập

### `GET /me`

Trả `{ id, fullName, email, phone, role, status }` của user hiện tại.

### `PUT /me`

Body: `{ "fullName": "Tên mới", "phone": "0900000000" }`. `fullName` bắt buộc; `phone` có thể null. Trả profile mới.

### `POST /me/change-password`

Body: `{ "oldPassword": "password123", "newPassword": "newpassword123" }`. Mật khẩu mới ít nhất 8 ký tự. Thành công: `{ "status": "updated" }`; mật khẩu cũ sai: `400 INVALID_CURRENT_PASSWORD`.

## Đặt vé và thanh toán — cần đăng nhập

### `POST /bookings`

Giữ ghế trong 10 phút. Body: `{ "showtimeId": 5, "seatIds": [21, 22] }`. `seatIds` phải có ít nhất một ID. Thành công `201`:

```json
{ "id": 42, "status": "PENDING", "totalAmount": 180000, "holdExpiresAt": "2026-10-16T12:30:00", "seatIds": [21, 22] }
```

Các lỗi thường gặp: `404 SHOWTIME_NOT_FOUND`; `409 SHOWTIME_NOT_BOOKABLE`; `400 DUPLICATE_SEAT` hoặc `INVALID_SEAT`; `409 SEAT_UNAVAILABLE` (có thể kèm ID ghế trong code). Khi bị từ chối, tải lại sơ đồ ghế.

### `GET /bookings`

Danh sách đơn của user hiện tại, mới tạo trước. Mỗi phần tử có `{ id, status, totalAmount, holdExpiresAt, createdAt, showtime, seats, payments }`. `showtime` gồm `{ id, startAt, endAt, movie: { id, title, posterUrl }, cinema: { id, name }, room: { id, name } }`; mỗi phần tử `seats` gồm `{ seatId, rowLabel, seatNumber, unitPrice, holdStatus }`; mỗi phần tử `payments` gồm `{ id, method, amount, status, transactionRef, paidAt }`.

### `GET /bookings/{id}`

Chi tiết cùng cấu trúc như một phần tử của `GET /bookings`, chỉ chủ đơn mới xem được; không thấy hoặc không thuộc user hiện tại: `404 BOOKING_NOT_FOUND`.

### `POST /bookings/{id}/cancel`

Hủy đơn `PENDING` và nhả ghế. Thành công: `{ "id": 42, "status": "CANCELLED" }`. Đơn không còn `PENDING`: `409 BOOKING_NOT_CANCELLABLE`.

### `POST /bookings/{id}/payments`

Thanh toán mô phỏng. Body:

```json
{ "method": "MOCK", "transactionRef": "web-42-unique-value", "amount": 180000, "success": true }
```

`method`, `transactionRef`, `amount` bắt buộc. Thành công thường trả `{ "paymentId": 8, "paymentStatus": "SUCCESS", "bookingStatus": "PAID" }`; cùng `transactionRef` cho cùng đơn trả kết quả cũ. `success:false` tạo payment `FAILED` nhưng không phát hành vé. Lỗi: `404 BOOKING_NOT_FOUND`; `409 BOOKING_EXPIRED`, `BOOKING_ALREADY_PAID`, `PAYMENT_AMOUNT_MISMATCH`, `TRANSACTION_REF_CONFLICT`.

Thanh toán này **chỉ mô phỏng**, không kết nối cổng thanh toán thật.

### `GET /tickets`

Danh sách vé của user hiện tại. Mỗi vé: `{ id, ticketCode, status, issuedAt, usedAt, bookingId, movie, cinema, room, startAt, rowLabel, seatNumber, price }`.

## Quản trị — yêu cầu role ADMIN

### Users

- `GET /admin/users`: danh sách `{ id, fullName, email, phone, status, role }`.
- `PATCH /admin/users/{id}`: cập nhật một hoặc cả hai trường `status`, `role`. Ví dụ `{ "status": "LOCKED", "role": "CUSTOMER" }`. Trường null được bỏ qua. Lỗi `404 USER_NOT_FOUND`.

### Movies và genres

- `POST /admin/movies`: tạo phim; `PUT /admin/movies/{id}`: cập nhật phim; `DELETE /admin/movies/{id}`: **ẩn phim bằng cách đặt status `ENDED`**, không xóa record.
- Movie body: `{ "title": "Tên phim", "description": "...", "duration": 120, "releaseDate": "2026-10-16", "posterUrl": "https://...", "director": "...", "castNames": "...", "status": "NOW_SHOWING", "genreIds": [1, 2] }`. `title` bắt buộc; `duration` nếu gửi phải từ 1; `genreIds` có thể bỏ qua hoặc là danh sách ID. Khi truyền danh sách, thay toàn bộ thể loại phim.
- `POST /admin/genres`: tạo; `PUT /admin/genres/{id}`: cập nhật; `DELETE /admin/genres/{id}`: xóa. Body `{ "name": "Hành động", "description": "..." }`; `name` bắt buộc.
- Lỗi phim/thể loại: `404 MOVIE_NOT_FOUND`, `GENRE_NOT_FOUND`; tên genre trùng có thể trả `409 CONFLICT`.

### Cinemas, rooms, seats

- `POST /admin/cinemas`, `PUT /admin/cinemas/{id}`. Body `{ "name": "Rạp trung tâm", "address": "...", "phone": "...", "status": "ACTIVE" }`; chỉ `name` bắt buộc.
- `POST /admin/rooms`, `PUT /admin/rooms/{id}`. Body `{ "cinemaId": 2, "name": "Phòng 1", "roomType": "2D", "status": "ACTIVE" }`; `cinemaId`, `name` bắt buộc.
- `POST /admin/seats`, `PUT /admin/seats/{id}`. Body `{ "roomId": 3, "rowLabel": "A", "seatNumber": 1, "seatType": "STANDARD", "active": true }`; `roomId`, `rowLabel`, `seatNumber` bắt buộc; seat number >= 1. Nếu `active` bị bỏ qua, backend đặt true.
- Các endpoint trả entity tương ứng, thường gồm ID/timestamp và object quan hệ (`cinema` hoặc `room`). Không có endpoint DELETE cinema/room/seat hiện tại.

### Showtimes

- `POST /admin/showtimes`: tạo; `PUT /admin/showtimes/{id}`: cập nhật; `DELETE /admin/showtimes/{id}`: hủy suất và hủy các booking `PENDING` của suất đó.
- Body: `{ "movieId": 1, "roomId": 3, "startAt": "2026-10-16T19:30:00", "endAt": "2026-10-16T21:30:00", "basePrice": 90000, "status": "AVAILABLE" }`.
- Thời gian kết thúc phải sau bắt đầu, suất phải bắt đầu trong tương lai, giá >= `0.01`; phòng không được có suất khác chồng lấn.
- Lỗi: `404 MOVIE_NOT_FOUND` / `ROOM_NOT_FOUND` / `SHOWTIME_NOT_FOUND`; `400 INVALID_SHOWTIME_TIME`; `409 SHOWTIME_OVERLAP`.

### Bán vé, thanh toán, quét vé

- `GET /admin/bookings`: danh sách mới nhất trước; gồm ID, userId, họ tên/email/điện thoại khách, phim, rạp, phòng, giờ chiếu, trạng thái, tổng tiền, hạn giữ ghế, thời điểm tạo và từng ghế `{ seatId, label, rowLabel, seatNumber, seatType, unitPrice, holdStatus }`.
- `GET /admin/payments`: gồm ID giao dịch, mã đơn, tên/email khách, phim, rạp, phòng, giờ chiếu, ghế, trạng thái đơn, số tiền, phương thức, trạng thái giao dịch, mã tham chiếu và thời điểm thanh toán.
- `GET /admin/tickets`: gồm mã vé, trạng thái, đơn, ghế, khách/email, phim, rạp, phòng, giờ chiếu, giá, thời điểm phát hành/sử dụng.
- `POST /admin/counter-sales` (ADMIN, MANAGER, STAFF): bán vé trực tiếp tại quầy. Body `{ "showtimeId": 1, "seatIds": [21], "customerName": "Nguyễn Văn A", "customerPhone": "090...", "customerEmail": "a@example.com", "paymentMethod": "CASH" }`; email và điện thoại có thể bỏ trống, tối đa 8 ghế. Nhân viên xác nhận đã thu tiền bằng `CASH` hoặc `CARD`; API tạo đơn `PAID`, payment `SUCCESS`, khóa ghế, phát vé và trả mã QR/ticket code cùng nhân viên bán. Đây là thao tác ghi nhận tiền đã thu tại quầy, không xử lý thẻ qua cổng ngân hàng.
  Cơ sở dữ liệu hiện có cần áp dụng `database/migrations/20261113_counter_sales.sql` một lần để cho phép booking khách vãng lai không có `user_id`.
- `GET /admin/tickets/{code}/validate`: trả thông tin vé và khách kèm `valid`, trạng thái, suất và ghế. Vé không có: `404 TICKET_NOT_FOUND`. `valid` chỉ true khi vé `VALID` và booking `PAID`.
- `POST /admin/tickets/{code}/use`: đánh dấu vé đã sử dụng; thành công `{ "ticketCode": "...", "status": "USED" }`. Vé không hợp lệ hoặc suất đã kết thúc: `409 TICKET_NOT_VALID`.

### Dashboard

`GET /admin/dashboard?from=2026-10-01&to=2026-10-31` (cả hai ngày bắt buộc) trả:

```json
{ "paidTickets": 10, "bookingsByStatus": { "PENDING": 2, "PAID": 8, "CANCELLED": 1, "EXPIRED": 0 }, "revenue": 720000, "from": "2026-10-01", "to": "2026-10-31" }
```

`revenue` được tính trong khoảng ngày đã chọn. Hiện `paidTickets` và `bookingsByStatus` là số liệu toàn hệ thống, không giới hạn theo `from`/`to`.

## Các luồng FE thường dùng

1. Mở trang: `GET /movies`, `GET /genres`, `GET /cinemas`.
2. Chi tiết phim: `GET /movies/{id}`, sau đó `GET /showtimes?date=...` (lọc thêm ở client theo giới hạn đã nêu).
3. Chọn ghế: `GET /rooms/{roomId}/seats?showtimeId=...`.
4. Đặt chỗ: đăng nhập nếu cần, `POST /bookings`, rồi mở màn hình xác nhận/thanh toán.
5. Thanh toán: `POST /bookings/{id}/payments`; sau thành công tải lại `GET /tickets` hoặc `GET /bookings`.
6. Trang tài khoản: `GET /me`, `GET /bookings`, `GET /tickets`.
7. Ghế giữ tối đa 10 phút; backend tự giải phóng booking hết hạn theo lịch chạy nền khoảng 30 giây.

## Swagger

Khi backend chạy, mở `http://localhost:8080/swagger-ui.html` để xem OpenAPI và gọi thử endpoint. Tài liệu OpenAPI có scheme Bearer JWT.
