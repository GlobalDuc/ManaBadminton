using BadmintonHub.Domain.Entities;
using BadmintonHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BadmintonHub.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(BadmintonHubDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;

        // 1. Club Settings
        var setting = new ClubSetting
        {
            ClubName = "CLB Cầu Lông Blue Smash Sài Gòn",
            ShortDescription = "Hệ thống quản lý CLB cầu lông chuẩn SaaS - Minh bạch tài chính & Điểm danh nhanh",
            ContactPhone = "0909 688 999",
            ContactEmail = "banquanly@bluesmash.vn",
            DefaultBankName = "Vietcombank",
            DefaultBankAccountNo = "1029384756",
            DefaultBankAccountName = "CLB CAU LONG BLUE SMASH",
            DefaultShuttlecockPrice = 25000m,
            DefaultFixedFeePerSession = 55000m,
            DefaultGuestSurcharge = 15000m,
            CancellationDeadlineHours = 6,
            LateCancellationPenalty = 30000m,
            AutoGenerateChargesOnAttendance = true
        };
        db.ClubSettings.Add(setting);

        // 2. Venues & Courts
        var venue1 = new Venue
        {
            Name = "Cụm Sân Cầu Lông Viettel Quận 10",
            Address = "285 Cách Mạng Tháng Tám, Phường 12, Quận 10, TP.HCM",
            ContactPhone = "028 3868 1234",
            DefaultHourlyRate = 130000m,
            IsActive = true,
            Notes = "Sân thảm Yonex chuẩn thi đấu, trần cao 11m, đèn LED chống chói."
        };

        var venue2 = new Venue
        {
            Name = "Sân Cầu Lông Phú Thọ Arena",
            Address = "219 Lý Thường Kiệt, Phường 15, Quận 11, TP.HCM",
            ContactPhone = "028 3865 5678",
            DefaultHourlyRate = 120000m,
            IsActive = true,
            Notes = "Khu vực gửi xe rộng, có quầy nước điện giải và căng vợt tại sân."
        };

        db.Venues.AddRange(venue1, venue2);
        await db.SaveChangesAsync();

        var courts = new List<Court>
        {
            new() { VenueId = venue1.Id, CourtName = "Sân VIP 01", CourtCode = "VT-S1", SurfaceType = "Thảm Yonex Pro", HourlyRate = 140000m, IsActive = true },
            new() { VenueId = venue1.Id, CourtName = "Sân VIP 02", CourtCode = "VT-S2", SurfaceType = "Thảm Yonex Pro", HourlyRate = 140000m, IsActive = true },
            new() { VenueId = venue1.Id, CourtName = "Sân Tiêu Chuẩn 03", CourtCode = "VT-S3", SurfaceType = "Thảm PVC Xanh", HourlyRate = 125000m, IsActive = true },
            new() { VenueId = venue2.Id, CourtName = "Sân Trung Tâm A1", CourtCode = "PT-A1", SurfaceType = "Thảm Lining", HourlyRate = 120000m, IsActive = true },
            new() { VenueId = venue2.Id, CourtName = "Sân Trung Tâm A2", CourtCode = "PT-A2", SurfaceType = "Thảm Lining", HourlyRate = 120000m, IsActive = true }
        };
        db.Courts.AddRange(courts);
        await db.SaveChangesAsync();

        // 3. Players
        var players = new List<Player>
        {
            new() { MemberCode = "TV001", FullName = "Nguyễn Văn Đức", PhoneNumber = "0909111222", Email = "vanduc@bluesmash.vn", Gender = "Nam", SkillLevel = SkillLevel.Advanced, MembershipType = MembershipType.FixedMonthly, Balance = 250000m, JoinedDate = DateTime.UtcNow.AddMonths(-14), Notes = "Chủ nhiệm CLB - Đánh đôi nam công mạnh" },
            new() { MemberCode = "TV002", FullName = "Trần Minh Hoàng", PhoneNumber = "0909222333", Email = "minhhoang@bluesmash.vn", Gender = "Nam", SkillLevel = SkillLevel.Advanced, MembershipType = MembershipType.FixedMonthly, Balance = 150000m, JoinedDate = DateTime.UtcNow.AddMonths(-12), Notes = "Thủ quỹ CLB - Chuyên điều cầu trên lưới" },
            new() { MemberCode = "TV003", FullName = "Lê Thị Hồng Nhung", PhoneNumber = "0909333444", Email = "hongnhung@bluesmash.vn", Gender = "Nữ", SkillLevel = SkillLevel.Intermediate, MembershipType = MembershipType.FixedMonthly, Balance = 100000m, JoinedDate = DateTime.UtcNow.AddMonths(-10), Notes = "Đôi nam nữ cố định tối 2-4-6" },
            new() { MemberCode = "TV004", FullName = "Phạm Quốc Khánh", PhoneNumber = "0909444555", Email = "quockhanh@bluesmash.vn", Gender = "Nam", SkillLevel = SkillLevel.Pro, MembershipType = MembershipType.FixedMonthly, Balance = 0m, JoinedDate = DateTime.UtcNow.AddMonths(-9), Notes = "VĐV phong trào hạng A" },
            new() { MemberCode = "TV005", FullName = "Võ Thanh Tùng", PhoneNumber = "0909555666", Email = "thanhtung@bluesmash.vn", Gender = "Nam", SkillLevel = SkillLevel.Intermediate, MembershipType = MembershipType.Flexible, Balance = 0m, JoinedDate = DateTime.UtcNow.AddMonths(-7), Notes = "Tham gia linh hoạt tối Thứ 4 và Thứ 7" },
            new() { MemberCode = "TV006", FullName = "Đặng Ngọc Mai", PhoneNumber = "0909666777", Email = "ngocmai@bluesmash.vn", Gender = "Nữ", SkillLevel = SkillLevel.Intermediate, MembershipType = MembershipType.Flexible, Balance = 50000m, JoinedDate = DateTime.UtcNow.AddMonths(-6), Notes = "Thủ cầu bền bỉ" },
            new() { MemberCode = "TV007", FullName = "Hoàng Gia Bảo", PhoneNumber = "0909777888", Email = "giabao@bluesmash.vn", Gender = "Nam", SkillLevel = SkillLevel.Beginner, MembershipType = MembershipType.Flexible, Balance = 0m, JoinedDate = DateTime.UtcNow.AddMonths(-4), Notes = "Thành viên mới cần ghép cặp hướng dẫn" },
            new() { MemberCode = "TV008", FullName = "Bùi Tuấn Kiệt", PhoneNumber = "0909888999", Email = "tuankiet@bluesmash.vn", Gender = "Nam", SkillLevel = SkillLevel.Advanced, MembershipType = MembershipType.FixedMonthly, Balance = 120000m, JoinedDate = DateTime.UtcNow.AddMonths(-8), Notes = "Chuyên đập cầu cuối sân" },
            new() { MemberCode = "TV009", FullName = "Ngô Phương Thảo", PhoneNumber = "0918111222", Email = "phuongthao@bluesmash.vn", Gender = "Nữ", SkillLevel = SkillLevel.Beginner, MembershipType = MembershipType.Guest, Balance = 0m, JoinedDate = DateTime.UtcNow.AddMonths(-2), Notes = "Khách vãng lai cuối tuần" },
            new() { MemberCode = "TV010", FullName = "Đỗ Hải Nam", PhoneNumber = "0918333444", Email = "hainam@bluesmash.vn", Gender = "Nam", SkillLevel = SkillLevel.Intermediate, MembershipType = MembershipType.Flexible, Balance = 0m, JoinedDate = DateTime.UtcNow.AddMonths(-5), Notes = "Hay dẫn thêm 1 bạn khách giao lưu" }
        };
        db.Players.AddRange(players);
        await db.SaveChangesAsync();

        // 4. Users (Admin, Treasurer, Member)
        var users = new List<User>
        {
            new()
            {
                Username = "admin",
                Email = "admin@bluesmash.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName = "Nguyễn Văn Đức (Chủ nhiệm)",
                PhoneNumber = "0909111222",
                Role = UserRole.Admin,
                IsActive = true,
                LinkedPlayerId = players[0].Id
            },
            new()
            {
                Username = "thuquy",
                Email = "thuquy@bluesmash.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName = "Trần Minh Hoàng (Thủ quỹ)",
                PhoneNumber = "0909222333",
                Role = UserRole.Treasurer,
                IsActive = true,
                LinkedPlayerId = players[1].Id
            },
            new()
            {
                Username = "thanhvien",
                Email = "hongnhung@bluesmash.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName = "Lê Thị Hồng Nhung",
                PhoneNumber = "0909333444",
                Role = UserRole.Member,
                IsActive = true,
                LinkedPlayerId = players[2].Id
            }
        };
        db.Users.AddRange(users);
        await db.SaveChangesAsync();

        // 5. Sessions (Past Completed, Ongoing Today, Upcoming)
        var today = DateTime.UtcNow.Date;
        var s1 = new Session
        {
            Title = "Giao lưu cố định Tối Thứ Ba - Sân Viettel",
            SessionDate = today.AddDays(-2),
            StartTime = new TimeSpan(19, 0, 0),
            EndTime = new TimeSpan(21, 30, 0),
            VenueId = venue1.Id,
            CourtsBookedText = "Sân VIP 01, Sân VIP 02",
            MaxPlayers = 16,
            Status = SessionStatus.Completed,
            PricingMode = PricingSplitMode.FixedPlusShuttlecock,
            CourtFeeTotal = 700000m,
            ShuttlecockCountUsed = 14,
            ShuttlecockUnitPrice = 25000m,
            OtherFeeTotal = 50000m,
            FixedFeePerPlayer = 55000m,
            GuestSurcharge = 15000m,
            Notes = "Đã chốt sổ cầu Hải Yến S70 (14 quả) và nước suối ướp lạnh."
        };

        var s2 = new Session
        {
            Title = "Buổi Đánh Hôm Nay - Kèo Đôi Nam Nữ & Đôi Nam",
            SessionDate = today,
            StartTime = new TimeSpan(19, 0, 0),
            EndTime = new TimeSpan(21, 30, 0),
            VenueId = venue1.Id,
            CourtsBookedText = "Sân VIP 01, Sân VIP 02, Sân Tiêu Chuẩn 03",
            MaxPlayers = 18,
            Status = SessionStatus.Ongoing,
            PricingMode = PricingSplitMode.FixedPlusShuttlecock,
            CourtFeeTotal = 850000m,
            ShuttlecockCountUsed = 16,
            ShuttlecockUnitPrice = 25000m,
            OtherFeeTotal = 60000m,
            FixedFeePerPlayer = 55000m,
            GuestSurcharge = 15000m,
            Notes = "Đang diễn ra sôi nổi tại sân Viettel Quận 10."
        };

        var s3 = new Session
        {
            Title = "Lịch Cuối Tuần Thứ Bảy - Giao Lưu Mở Rộng Phú Thọ",
            SessionDate = today.AddDays(2),
            StartTime = new TimeSpan(14, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            VenueId = venue2.Id,
            CourtsBookedText = "Sân Trung Tâm A1, Sân Trung Tâm A2",
            MaxPlayers = 16,
            Status = SessionStatus.Upcoming,
            PricingMode = PricingSplitMode.EqualSplit,
            CourtFeeTotal = 720000m,
            ShuttlecockCountUsed = 18,
            ShuttlecockUnitPrice = 25000m,
            OtherFeeTotal = 80000m,
            FixedFeePerPlayer = 60000m,
            GuestSurcharge = 20000m,
            Notes = "Mở đăng ký sớm cho hội viên và khách vãng lai."
        };

        db.Sessions.AddRange(s1, s2, s3);
        await db.SaveChangesAsync();

        // 6. Registrations & Attendances for s1 & s2 & s3
        for (int i = 0; i < 8; i++)
        {
            var p = players[i];
            db.SessionRegistrations.Add(new SessionRegistration
            {
                SessionId = s1.Id,
                PlayerId = p.Id,
                IsGuest = p.MembershipType == MembershipType.Guest,
                GuestsBroughtCount = i == 4 ? 1 : 0,
                Status = RegistrationStatus.Registered,
                RegisteredAtUtc = today.AddDays(-4)
            });

            db.AttendanceRecords.Add(new AttendanceRecord
            {
                SessionId = s1.Id,
                PlayerId = p.Id,
                Status = i == 6 ? AttendanceStatus.Late : AttendanceStatus.Present,
                CheckInTimeUtc = today.AddDays(-2).AddHours(19),
                IsGuest = p.MembershipType == MembershipType.Guest,
                ExtraGuestsCount = i == 4 ? 1 : 0,
                MatchesPlayedCount = 4,
                Note = i == 6 ? "Đến trễ 20 phút do kẹt xe" : "Tham gia đầy đủ"
            });

            var totalDue = p.MembershipType == MembershipType.FixedMonthly ? 80000m : 100000m;
            if (i == 4) totalDue += 70000m;
            var isPaid = i < 6;

            var charge = new SessionCharge
            {
                SessionId = s1.Id,
                PlayerId = p.Id,
                BaseCourtShare = p.MembershipType == MembershipType.FixedMonthly ? 35000m : 55000m,
                ShuttlecockShare = 45000m,
                GuestFee = i == 4 ? 70000m : 0m,
                PenaltyOrDiscount = 0m,
                TotalDue = totalDue,
                AmountPaid = isPaid ? totalDue : 0m,
                PaymentStatus = isPaid ? ChargePaymentStatus.Paid : ChargePaymentStatus.Unpaid,
                Note = isPaid ? "Đã thanh toán VietQR" : "Chưa đóng phí buổi Thứ Ba"
            };
            db.SessionCharges.Add(charge);
            await db.SaveChangesAsync();

            if (isPaid)
            {
                db.PaymentTransactions.Add(new PaymentTransaction
                {
                    TransactionCode = $"PT-{today.AddDays(-2):yyyyMMdd}-00{i + 1}",
                    PlayerId = p.Id,
                    SessionChargeId = charge.Id,
                    Amount = totalDue,
                    PaymentMethod = i % 2 == 0 ? PaymentMethod.VietQR : PaymentMethod.BankTransfer,
                    Status = PaymentTransactionStatus.Confirmed,
                    PaidAtUtc = today.AddDays(-2).AddHours(21),
                    ReferenceCode = $"VCB99887{i}",
                    ConfirmedByUsername = "thuquy",
                    Note = $"Thu phí buổi {s1.Title}"
                });
            }
        }

        // Ongoing Session (s2) registrations & attendances
        for (int i = 0; i < 9; i++)
        {
            var p = players[i];
            db.SessionRegistrations.Add(new SessionRegistration
            {
                SessionId = s2.Id,
                PlayerId = p.Id,
                IsGuest = p.MembershipType == MembershipType.Guest,
                GuestsBroughtCount = i == 9 ? 1 : 0,
                Status = RegistrationStatus.Registered,
                RegisteredAtUtc = today.AddDays(-1)
            });

            db.AttendanceRecords.Add(new AttendanceRecord
            {
                SessionId = s2.Id,
                PlayerId = p.Id,
                Status = i < 7 ? AttendanceStatus.Present : AttendanceStatus.Pending,
                CheckInTimeUtc = i < 7 ? DateTime.UtcNow.AddMinutes(-35) : null,
                IsGuest = p.MembershipType == MembershipType.Guest,
                ExtraGuestsCount = 0,
                MatchesPlayedCount = i < 7 ? 2 : 0,
                Note = i < 7 ? "Đã check-in tại sân" : "Đang trên đường tới sân"
            });
        }

        // Upcoming Session (s3) registrations
        for (int i = 0; i < 6; i++)
        {
            var p = players[i];
            db.SessionRegistrations.Add(new SessionRegistration
            {
                SessionId = s3.Id,
                PlayerId = p.Id,
                IsGuest = false,
                GuestsBroughtCount = 0,
                Status = RegistrationStatus.Registered,
                RegisteredAtUtc = DateTime.UtcNow.AddHours(-5),
                Note = "Đăng ký giữ chỗ sớm"
            });
        }

        // Historical payments & expenses across the last 4 months for rich dashboard charts
        for (int m = 1; m <= 4; m++)
        {
            var mDate = today.AddMonths(-m);
            db.PaymentTransactions.Add(new PaymentTransaction
            {
                TransactionCode = $"PT-HIST-{m}01",
                PlayerId = players[0].Id,
                Amount = 4200000m + (m * 350000m),
                PaymentMethod = PaymentMethod.BankTransfer,
                Status = PaymentTransactionStatus.Confirmed,
                PaidAtUtc = mDate.AddDays(5),
                ReferenceCode = $"QUYTHANG-{m}",
                ConfirmedByUsername = "thuquy",
                Note = $"Tổng thu quỹ hội viên cố định tháng {mDate:MM/yyyy}"
            });

            db.Expenses.Add(new Expense
            {
                Title = $"Thanh toán tiền thuê sân cố định tháng {mDate:MM/yyyy}",
                Category = ExpenseCategory.CourtRental,
                Amount = 2600000m + (m * 150000m),
                ExpenseDate = mDate.AddDays(6),
                PaidBy = "Trần Minh Hoàng",
                VendorName = "Cụm Sân Viettel Q10",
                ReceiptNote = "Hóa đơn chuyển khoản Vietcombank"
            });

            db.Expenses.Add(new Expense
            {
                Title = $"Mua 5 ống cầu lông Hải Yến S70 tháng {mDate:MM/yyyy}",
                Category = ExpenseCategory.Shuttlecock,
                Amount = 1350000m,
                ExpenseDate = mDate.AddDays(10),
                PaidBy = "Nguyễn Văn Đức",
                VendorName = "Đại lý Thể Thao Minh Phú",
                ReceiptNote = "270.000đ / ống x 5 ống"
            });
        }

        // Current month expenses
        db.Expenses.AddRange(
            new Expense
            {
                Title = "Đặt cọc tiền sân Viettel Quận 10 (Tháng hiện tại)",
                Category = ExpenseCategory.CourtRental,
                Amount = 2400000m,
                ExpenseDate = today.AddDays(-5),
                SessionId = s1.Id,
                PaidBy = "Trần Minh Hoàng",
                VendorName = "Sân Cầu Lông Viettel Q10",
                ReceiptNote = "Chuyển khoản cọc sân tháng"
            },
            new Expense
            {
                Title = "Mua thùng 10 ống cầu lông Hải Yến S70",
                Category = ExpenseCategory.Shuttlecock,
                Amount = 2650000m,
                ExpenseDate = today.AddDays(-3),
                SessionId = s1.Id,
                PaidBy = "Nguyễn Văn Đức",
                VendorName = "Shop Cầu Lông VNB Quận 10",
                ReceiptNote = "Giá sỉ CLB cầu lông"
            },
            new Expense
            {
                Title = "Thùng nước khoáng LaVie & Pocari Sweat tại sân",
                Category = ExpenseCategory.WaterAndRefreshment,
                Amount = 320000m,
                ExpenseDate = today.AddDays(-1),
                SessionId = s2.Id,
                PaidBy = "Lê Thị Hồng Nhung",
                VendorName = "Bách Hóa Xanh",
                ReceiptNote = "Phục vụ buổi đánh tuần này"
            }
        );

        // Court assignments for ongoing session s2
        db.CourtAssignments.AddRange(
            new CourtAssignment
            {
                SessionId = s2.Id,
                CourtId = courts[0].Id,
                MatchOrder = 1,
                TeamAPlayerNames = "Nguyễn Văn Đức & Phạm Quốc Khánh",
                TeamBPlayerNames = "Trần Minh Hoàng & Bùi Tuấn Kiệt",
                TeamAScore = 21,
                TeamBScore = 18,
                Status = MatchStatus.Completed,
                StartTimeUtc = DateTime.UtcNow.AddMinutes(-45),
                EndTimeUtc = DateTime.UtcNow.AddMinutes(-20),
                Notes = "Kèo đôi nam trình độ Nâng cao"
            },
            new CourtAssignment
            {
                SessionId = s2.Id,
                CourtId = courts[1].Id,
                MatchOrder = 2,
                TeamAPlayerNames = "Nguyễn Văn Đức & Lê Thị Hồng Nhung",
                TeamBPlayerNames = "Võ Thanh Tùng & Đặng Ngọc Mai",
                TeamAScore = 15,
                TeamBScore = 14,
                Status = MatchStatus.InProgress,
                StartTimeUtc = DateTime.UtcNow.AddMinutes(-15),
                Notes = "Đang thi đấu hiệp 1 trên Sân VIP 02"
            },
            new CourtAssignment
            {
                SessionId = s2.Id,
                CourtId = courts[2].Id,
                MatchOrder = 3,
                TeamAPlayerNames = "Hoàng Gia Bảo & Đỗ Hải Nam",
                TeamBPlayerNames = "Trần Minh Hoàng & Ngô Phương Thảo",
                TeamAScore = 0,
                TeamBScore = 0,
                Status = MatchStatus.Scheduled,
                Notes = "Chờ vào sân ngay sau lượt 2"
            }
        );

        // Notifications
        db.Notifications.AddRange(
            new NotificationItem
            {
                Title = "Buổi đánh hôm nay đang diễn ra tại Sân Viettel Q10",
                Message = "Đã có 7/9 thành viên check-in có mặt. Nhấn để điểm danh và phân sân trực tiếp.",
                Type = "Session",
                IsRead = false,
                CreatedAtUtc = DateTime.UtcNow.AddMinutes(-30),
                ActionUrl = "/attendance"
            },
            new NotificationItem
            {
                Title = "Còn 2 thành viên chưa thanh toán phí buổi Thứ Ba",
                Message = "Hoàng Gia Bảo và Bùi Tuấn Kiệt còn khoản phí chờ xác nhận VietQR.",
                Type = "Payment",
                IsRead = false,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-3),
                ActionUrl = "/payments"
            },
            new NotificationItem
            {
                Title = "Đã mở đăng ký buổi giao lưu Thứ Bảy tuần này",
                Message = "Cụm sân Phú Thọ Arena (14:00 - 17:00), hiện đã có 6/16 chỗ đăng ký.",
                Type = "Info",
                IsRead = true,
                CreatedAtUtc = DateTime.UtcNow.AddHours(-10),
                ActionUrl = "/sessions"
            }
        );

        // Initial AuditLog
        db.AuditLogs.Add(new AuditLog
        {
            Action = "SYSTEM_SEED",
            EntityName = "Database",
            EntityId = "SQL2016",
            PerformedBy = "system",
            Summary = "Khởi tạo dữ liệu mẫu CLB Cầu Lông Blue Smash trên SQL Server (Compatibility Level 130).",
            CreatedAtUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }
}
