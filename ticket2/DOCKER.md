# Chạy hệ thống bằng Docker

Docker Compose chạy React/Vite dưới dạng static site với Nginx, Spring Boot API và MySQL 8.4 cục bộ. Dữ liệu MySQL được giữ trong volume `mysql_data`.

## Cấu hình

Giữ file `.env` ở thư mục gốc; file này không được đưa vào Docker image. Compose cần:

- `DB_PASSWORD`: mật khẩu khác rỗng cho user ứng dụng MySQL. Ở cấu hình local hiện tại, giá trị này cũng được dùng làm mật khẩu root của container MySQL.
- `JWT_SECRET`: tối thiểu 32 ký tự.
- `ADMIN_EMAIL` và `ADMIN_PASSWORD`: đặt nếu muốn bootstrap tài khoản quản trị.

Compose tự đổi `DB_URL` sang hostname `db` và dùng user ứng dụng `ticketapp`; không cần sửa URL `localhost` đang dùng khi chạy backend ngoài Docker.

## Triển khai dùng TiDB Cloud

Nếu chưa có `.env`, tạo file này từ `.env.example`. Nếu đã có `.env`, chỉ cập nhật `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` và `JWT_SECRET`, giữ lại các cấu hình khác. Điền mật khẩu TiDB thật và một `JWT_SECRET` riêng; không commit hoặc gửi file `.env`. URL JDBC phải bắt đầu bằng `jdbc:mysql://` (không dùng trực tiếp dạng `mysql://`) và bật TLS. Tài khoản TiDB Cloud Starter/Essential cần TLS; `sslMode=VERIFY_IDENTITY` bật TLS và xác minh chứng chỉ máy chủ.

Ví dụ bạn gửi dùng schema `sys`, nhưng TiDB dành schema đó cho các view thông tin hệ thống. Hãy tạo schema riêng cho app trước khi triển khai (`CREATE DATABASE ticket2;`) và dùng đường dẫn `/ticket2` trong `DB_URL`, như mẫu `.env.example`.

Chạy cấu hình này để dùng TiDB Cloud mà không khởi động MySQL cục bộ:

```powershell
docker compose -f compose.tidb.yaml up --build -d
```

Web và API được phục vụ qua port `8081`. Backend đọc `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` và `JWT_SECRET` từ `.env`; trên nền tảng triển khai khác, đặt các giá trị đó trong phần environment/secrets của dịch vụ backend. Nếu nhà cung cấp database yêu cầu IP allowlist, cho phép IP outbound của backend triển khai.

`TokenService.java` quản lý JWT, không phải kết nối MySQL. Cấu hình database nằm trong `application.properties` và được cấp qua các biến môi trường trên.

## Chạy

```powershell
docker compose up --build -d
```

- Web: <http://localhost:8081>
- API Swagger: <http://localhost:8081/swagger-ui.html>

Xem log bằng `docker compose logs -f backend` hoặc `docker compose logs -f db`. Dừng các container bằng `docker compose down`; lệnh này giữ dữ liệu database. `docker compose down -v` xóa cả volume database.

Frontend và backend được đóng gói thành container riêng, nên có thể build/deploy độc lập sau này. Cấu hình hiện tại phù hợp chạy local hoặc demo; triển khai public cần HTTPS, quản lý secret riêng và thay thanh toán mô phỏng bằng cổng thanh toán thật.
