# Chạy hệ thống bằng Docker

Docker Compose chạy ba dịch vụ riêng: React/Vite được build thành static site và phục vụ bởi Nginx, Spring Boot API, và MySQL 8.4. Dữ liệu MySQL được giữ trong volume `mysql_data`.

## Cấu hình

Giữ file `.env` ở thư mục gốc; file này không được đưa vào Docker image. Compose cần:

- `DB_PASSWORD`: mật khẩu khác rỗng cho user ứng dụng MySQL. Ở cấu hình local hiện tại, giá trị này cũng được dùng làm mật khẩu root của container MySQL.
- `JWT_SECRET`: tối thiểu 32 ký tự.
- `ADMIN_EMAIL` và `ADMIN_PASSWORD`: đặt nếu muốn bootstrap tài khoản quản trị.

Compose tự đổi `DB_URL` sang hostname `db` và dùng user ứng dụng `ticketapp`; không cần sửa URL `localhost` đang dùng khi chạy backend ngoài Docker.

## Chạy

```powershell
docker compose up --build -d
```

- Web: <http://localhost:8081>
- API Swagger: <http://localhost:8081/swagger-ui.html>

Xem log bằng `docker compose logs -f backend` hoặc `docker compose logs -f db`. Dừng các container bằng `docker compose down`; lệnh này giữ dữ liệu database. `docker compose down -v` xóa cả volume database.

Frontend và backend được đóng gói thành container riêng, nên có thể build/deploy độc lập sau này. Cấu hình hiện tại phù hợp chạy local hoặc demo; triển khai public cần HTTPS, quản lý secret riêng và thay thanh toán mô phỏng bằng cổng thanh toán thật.
