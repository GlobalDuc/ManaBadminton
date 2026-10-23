# Badminton Hub — Hệ Thống Quản Lý CLB Cầu Lông Chuyên Nghiệp (Blue SaaS Edition)

Ứng dụng quản lý toàn diện cho Câu lạc bộ Cầu Lông được xây dựng theo kiến trúc **ASP.NET Core 8 Web API + Entity Framework Core 8 + Microsoft SQL Server 2016 (Compatibility Level 130)** và giao diện **ReactJS + TypeScript (Strict Mode) + Vite + Bootstrap 5 + PWA** với hệ màu thương hiệu **Primary Blue (`#2563EB`)**.

---

## 1. Kiến trúc Công nghệ Bắt buộc (Technology Stack)

### Backend (`backend/`)
- **Ngôn ngữ & Framework**: C# / ASP.NET Core 8 Web API (`net8.0`)
- **Kiến trúc 5 tầng (Layered Architecture)**:
  - `BadmintonHub.Domain`: Thực thể nghiệp vụ (`Player`, `Venue`, `Court`, `Session`, `SessionRegistration`, `AttendanceRecord`, `SessionCharge`, `PaymentTransaction`, `Expense`, `CourtAssignment`, `NotificationItem`, `ClubSetting`, `AuditLog`) và Enums.
  - `BadmintonHub.Application`: DTOs, FluentValidation Validators (tiếng Việt), Interfaces (`IBadmintonHubService`).
  - `BadmintonHub.Infrastructure`: `BadmintonHubDbContext`, cấu hình EF Core 8 tương thích SQL Server 2016 (`UseCompatibilityLevel(130)`), Migrations, `DatabaseSeeder`, và `BadmintonHubService`.
  - `BadmintonHub.Api`: REST Controllers, xác thực JWT Role-Based (`Admin`, `Treasurer`, `Member`), `GlobalExceptionMiddleware`, Swagger/OpenAPI, Health Checks (`/health`).
  - `BadmintonHub.Tests`: Bộ kiểm thử tự động xUnit (`BadmintonHubServiceTests`).

### Frontend (`frontend/`)
- **React 18 + TypeScript (Strict Mode) + Vite**
- **Bootstrap 5 + CSS Variables (Blue Design Tokens)** tại [`src/assets/theme.css`](file:///d:/Websites/ManagerBadminton/frontend/src/assets/theme.css)
- **TanStack Query v5** quản lý trạng thái bất đồng bộ, bộ nhớ đệm và tự động làm mới dữ liệu.
- **React Hook Form + Zod** kiểm tra biểu mẫu phía client bằng tiếng Việt.
- **Recharts** hiển thị biểu đồ tài chính tông Xanh (`#2563EB`) và màu ngữ nghĩa (`#D97706`, `#16A34A`, `#DC2626`).
- **PWA (Progressive Web App)**: Tích hợp `manifest.webmanifest` và Service Worker (`sw.js`) hỗ trợ cài đặt lên màn hình chính Android & iPhone.

---

## 2. Tương thích Microsoft SQL Server 2016 (Compatibility Level 130)

1. Trong [`Program.cs`](file:///d:/Websites/ManagerBadminton/backend/BadmintonHub.Api/Program.cs), `UseSqlServer` được cấu hình tường minh:
   ```csharp
   options.UseSqlServer(connectionString, sqlOptions =>
   {
       sqlOptions.UseCompatibilityLevel(130); // SQL Server 2016
   });
   ```
   Cấu hình này ngăn EF Core 8 sinh cú pháp `OPENJSON ... WITH` cho tập tham số `IN (...)` hoặc các hàm chỉ có trên SQL Server 2019/2022 (`GREATEST`, `LEAST`, `STRING_AGG` phức tạp).
2. Mọi trường tiền tệ (`Balance`, `CourtFeeTotal`, `ShuttlecockUnitPrice`, `TotalDue`, `AmountPaid`, `Amount`, `DefaultHourlyRate`, v.v.) đều sử dụng kiểu `DECIMAL(18,2)`.
3. Các bảng quan trọng (`Sessions`, `SessionCharges`, `PaymentTransactions`) đều có cột chống ghi đè đồng thời `[Timestamp] byte[] RowVersion` (`rowversion` trong T-SQL) và giao dịch `BeginTransactionAsync`.
4. Ràng buộc duy nhất (`UNIQUE INDEX`) được thiết lập trên:
   - `SessionRegistrations(SessionId, PlayerId)` — Chống đăng ký trùng.
   - `AttendanceRecords(SessionId, PlayerId)` — Chống điểm danh trùng.
   - `SessionCharges(SessionId, PlayerId)` — Chống tạo trùng phiếu thu buổi đánh.
   - `PaymentTransactions(TransactionCode)` — Chống trùng mã giao dịch.

---

## 3. Hướng dẫn Chạy Ứng dụng Tại Máy Cục bộ (Local Setup)

### Bước 1: Chuẩn bị SQL Server 2016 (hoặc mới hơn ở chế độ Compatibility 130)
Kiểm tra chuỗi kết nối trong [`backend/BadmintonHub.Api/appsettings.json`](file:///d:/Websites/ManagerBadminton/backend/BadmintonHub.Api/appsettings.json):
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=BadmintonHubDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
}
```

### Bước 2: Chạy EF Core Migration & Khởi động Backend API
```powershell
cd backend
dotnet ef database update --project BadmintonHub.Infrastructure --startup-project BadmintonHub.Api
dotnet run --project BadmintonHub.Api
```
- API lắng nghe tại: `http://localhost:5188`
- Tài liệu Swagger UI: `http://localhost:5188/swagger`
- Health Check: `http://localhost:5188/health`
- Khi khởi động lần đầu, `DatabaseSeeder` tự động khởi tạo dữ liệu mẫu tiếng Việt và 3 tài khoản mẫu (Mật khẩu chung: `Admin@123`):
  - Chủ nhiệm CLB (`Admin`): `admin` / `Admin@123`
  - Thủ quỹ (`Treasurer`): `thuquy` / `Admin@123`
  - Hội viên (`Member`): `thanhvien` / `Admin@123`

### Bước 3: Khởi động Frontend React + TypeScript
```powershell
cd frontend
cp .env.example .env
npm install
npm run dev
```
- Truy cập giao diện tại: `http://localhost:5173`

---

## 4. Hướng dẫn Sao lưu & Phục hồi Cơ sở dữ liệu SQL Server 2016

### Sao lưu (Backup Database)
```sql
BACKUP DATABASE [BadmintonHubDb]
TO DISK = N'C:\Backup\BadmintonHubDb_Full.bak'
WITH NOFORMAT, NOINIT, NAME = N'BadmintonHubDb-Full Database Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10;
GO
```

### Phục hồi (Restore Database)
```sql
USE [master];
ALTER DATABASE [BadmintonHubDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [BadmintonHubDb]
FROM DISK = N'C:\Backup\BadmintonHubDb_Full.bak'
WITH FILE = 1, NOUNLOAD, REPLACE, STATS = 5;
ALTER DATABASE [BadmintonHubDb] SET MULTI_USER;
GO
```

---

## 5. Hướng dẫn Triển khai Production (Deployment)

1. **Yêu cầu Hosting**:
   - Đảm bảo gói hosting hỗ trợ **.NET 8 Runtime (IIS Hosting Bundle hoặc Linux Kestrel Reverse Proxy)** và kết nối tới **Microsoft SQL Server 2016+**.
2. **Biến môi trường Backend (Production)**:
   - `ConnectionStrings__DefaultConnection`: Chuỗi kết nối SQL Server thực tế.
   - `Jwt__Key`: Khóa bí mật độ dài tối thiểu 32 ký tự.
   - `Cors__AllowedOrigins__0`: Tên miền HTTPS của ứng dụng Frontend.
3. **Biến môi trường Frontend (`.env.production`)**:
   - `VITE_API_BASE_URL=https://api.ten-mien-clb.vn/api`
   - Chạy `npm run build` để xuất gói tĩnh trong `frontend/dist/`.
