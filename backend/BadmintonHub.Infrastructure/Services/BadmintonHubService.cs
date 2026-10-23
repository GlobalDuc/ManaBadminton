using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BadmintonHub.Application.DTOs;
using BadmintonHub.Application.Interfaces;
using BadmintonHub.Domain.Entities;
using BadmintonHub.Domain.Enums;
using BadmintonHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BadmintonHub.Infrastructure.Services;

public class BadmintonHubService : IBadmintonHubService
{
    private readonly BadmintonHubDbContext _db;
    private readonly IConfiguration _config;

    public BadmintonHubService(BadmintonHubDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        var username = request.Username.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Username.ToLower() == username || u.Email.ToLower() == username,
            ct);

        if (user == null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        var token = GenerateJwtToken(user);

        return new AuthResponseDto(
            token,
            user.Username,
            user.FullName,
            user.Email,
            user.Role.ToString(),
            user.LinkedPlayerId
        );
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _config["Jwt:Key"] ?? "BadmintonHub_SuperSecretKey_2026_SqlServer2016_Enterprise!";
        var jwtIssuer = _config["Jwt:Issuer"] ?? "BadmintonHub.Api";
        var jwtAudience = _config["Jwt:Audience"] ?? "BadmintonHub.Client";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Username),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.Username),
            new("fullName", user.FullName),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.LinkedPlayerId.HasValue)
        {
            claims.Add(new Claim("playerId", user.LinkedPlayerId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void LogAudit(string action, string entityName, string entityId, string performedBy, string summary)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            PerformedBy = string.IsNullOrWhiteSpace(performedBy) ? "admin" : performedBy,
            Summary = summary,
            CreatedAtUtc = DateTime.UtcNow
        });
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var currentMonthStart = new DateTime(now.Year, now.Month, 1);

        var totalActivePlayers = await _db.Players.CountAsync(p => p.IsActive, ct);
        var upcomingSessionsCount = await _db.Sessions.CountAsync(
            s => s.Status == SessionStatus.Upcoming || s.Status == SessionStatus.Ongoing, ct);
        var completedThisMonth = await _db.Sessions.CountAsync(
            s => s.Status == SessionStatus.Completed && s.SessionDate >= currentMonthStart, ct);

        var allConfirmedPayments = await _db.PaymentTransactions
            .Where(p => p.Status == PaymentTransactionStatus.Confirmed)
            .ToListAsync(ct);

        var allExpenses = await _db.Expenses.ToListAsync(ct);

        var monthlyRevenue = allConfirmedPayments
            .Where(p => p.PaidAtUtc >= currentMonthStart)
            .Sum(p => p.Amount);

        var monthlyExpenses = allExpenses
            .Where(e => e.ExpenseDate >= currentMonthStart)
            .Sum(e => e.Amount);

        var totalRevenueAllTime = allConfirmedPayments.Sum(p => p.Amount);
        var totalExpensesAllTime = allExpenses.Sum(e => e.Amount);
        var clubFundBalance = totalRevenueAllTime - totalExpensesAllTime;

        var pendingCharges = await _db.SessionCharges
            .Include(c => c.Session)
            .Include(c => c.Player)
            .Where(c => c.PaymentStatus == ChargePaymentStatus.Unpaid || c.PaymentStatus == ChargePaymentStatus.PartiallyPaid)
            .OrderByDescending(c => c.TotalDue - c.AmountPaid)
            .ToListAsync(ct);

        var totalOutstandingDebt = pendingCharges.Sum(c => c.TotalDue - c.AmountPaid);
        var unpaidChargesCount = pendingCharges.Count;

        var upcomingSessionEntities = await _db.Sessions
            .Include(s => s.Venue)
            .Include(s => s.Registrations)
            .Include(s => s.Attendances)
            .Include(s => s.Charges)
            .Where(s => s.Status == SessionStatus.Upcoming || s.Status == SessionStatus.Ongoing)
            .OrderBy(s => s.SessionDate)
            .Take(5)
            .ToListAsync(ct);

        var upcomingDtos = upcomingSessionEntities.Select(MapSessionDto).ToList();
        var topPendingDtos = pendingCharges.Take(6).Select(MapChargeDto).ToList();

        var allSessions = await _db.Sessions.ToListAsync(ct);
        var monthlyTrends = new List<MonthlyFinancialPointDto>();

        for (var i = 5; i >= 0; i--)
        {
            var monthStart = currentMonthStart.AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);

            var rev = allConfirmedPayments
                .Where(p => p.PaidAtUtc >= monthStart && p.PaidAtUtc < monthEnd)
                .Sum(p => p.Amount);
            var exp = allExpenses
                .Where(e => e.ExpenseDate >= monthStart && e.ExpenseDate < monthEnd)
                .Sum(e => e.Amount);
            var sessCount = allSessions
                .Count(s => s.SessionDate >= monthStart && s.SessionDate < monthEnd);

            monthlyTrends.Add(new MonthlyFinancialPointDto(
                $"Tháng {monthStart.Month:00}/{monthStart.Year}",
                rev,
                exp,
                rev - exp,
                sessCount
            ));
        }

        var totalExpSum = allExpenses.Sum(e => e.Amount);
        var expenseBreakdown = allExpenses
            .GroupBy(e => e.Category)
            .Select(g =>
            {
                var amt = g.Sum(x => x.Amount);
                var pct = totalExpSum > 0 ? Math.Round((amt / totalExpSum) * 100m, 1) : 0m;
                return new CategoryBreakdownDto(GetExpenseCategoryNameVi(g.Key), amt, pct);
            })
            .OrderByDescending(x => x.Amount)
            .ToList();

        return new DashboardSummaryDto(
            totalActivePlayers,
            upcomingSessionsCount,
            completedThisMonth,
            monthlyRevenue,
            monthlyExpenses,
            clubFundBalance,
            totalOutstandingDebt,
            unpaidChargesCount,
            upcomingDtos,
            topPendingDtos,
            monthlyTrends,
            expenseBreakdown
        );
    }

    private static string GetExpenseCategoryNameVi(ExpenseCategory category) => category switch
    {
        ExpenseCategory.CourtRental => "Tiền thuê sân",
        ExpenseCategory.Shuttlecock => "Tiền cầu",
        ExpenseCategory.WaterAndRefreshment => "Nước uống & Giải khát",
        ExpenseCategory.TournamentAndEvent => "Giao lưu & Giải đấu",
        ExpenseCategory.Equipment => "Lưới cầu & Dụng cụ",
        _ => "Chi phí khác"
    };

    // Venues & Courts
    public async Task<IReadOnlyList<VenueDto>> GetVenuesAsync(CancellationToken ct = default)
    {
        var venues = await _db.Venues
            .Include(v => v.Courts)
            .OrderBy(v => v.Name)
            .ToListAsync(ct);

        return venues.Select(v => new VenueDto(
            v.Id,
            v.Name,
            v.Address,
            v.ContactPhone,
            v.DefaultHourlyRate,
            v.IsActive,
            v.Notes,
            v.Courts.Count
        )).ToList();
    }

    public async Task<VenueDto> CreateVenueAsync(SaveVenueDto dto, string performedBy, CancellationToken ct = default)
    {
        var entity = new Venue
        {
            Name = dto.Name.Trim(),
            Address = dto.Address.Trim(),
            ContactPhone = dto.ContactPhone.Trim(),
            DefaultHourlyRate = dto.DefaultHourlyRate,
            IsActive = dto.IsActive,
            Notes = dto.Notes
        };
        _db.Venues.Add(entity);
        LogAudit("CREATE_VENUE", "Venue", entity.Name, performedBy, $"Thêm cụm sân mới: {entity.Name}");
        await _db.SaveChangesAsync(ct);

        return new VenueDto(entity.Id, entity.Name, entity.Address, entity.ContactPhone, entity.DefaultHourlyRate, entity.IsActive, entity.Notes, 0);
    }

    public async Task<VenueDto> UpdateVenueAsync(int id, SaveVenueDto dto, string performedBy, CancellationToken ct = default)
    {
        var entity = await _db.Venues.Include(v => v.Courts).FirstOrDefaultAsync(v => v.Id == id, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy cụm sân.");

        entity.Name = dto.Name.Trim();
        entity.Address = dto.Address.Trim();
        entity.ContactPhone = dto.ContactPhone.Trim();
        entity.DefaultHourlyRate = dto.DefaultHourlyRate;
        entity.IsActive = dto.IsActive;
        entity.Notes = dto.Notes;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        LogAudit("UPDATE_VENUE", "Venue", entity.Id.ToString(), performedBy, $"Cập nhật cụm sân: {entity.Name}");
        await _db.SaveChangesAsync(ct);

        return new VenueDto(entity.Id, entity.Name, entity.Address, entity.ContactPhone, entity.DefaultHourlyRate, entity.IsActive, entity.Notes, entity.Courts.Count);
    }

    public async Task<IReadOnlyList<CourtDto>> GetCourtsAsync(int? venueId, CancellationToken ct = default)
    {
        var query = _db.Courts.Include(c => c.Venue).AsQueryable();
        if (venueId.HasValue)
        {
            query = query.Where(c => c.VenueId == venueId.Value);
        }

        var courts = await query.OrderBy(c => c.VenueId).ThenBy(c => c.CourtCode).ToListAsync(ct);
        return courts.Select(c => new CourtDto(
            c.Id,
            c.VenueId,
            c.Venue.Name,
            c.CourtName,
            c.CourtCode,
            c.SurfaceType,
            c.HourlyRate,
            c.IsActive
        )).ToList();
    }

    public async Task<CourtDto> CreateCourtAsync(SaveCourtDto dto, string performedBy, CancellationToken ct = default)
    {
        var venue = await _db.Venues.FindAsync(new object[] { dto.VenueId }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy cụm sân.");

        var duplicate = await _db.Courts.AnyAsync(c => c.VenueId == dto.VenueId && c.CourtCode == dto.CourtCode.Trim(), ct);
        if (duplicate)
        {
            throw new InvalidOperationException($"Mã sân '{dto.CourtCode}' đã tồn tại tại cụm sân này.");
        }

        var court = new Court
        {
            VenueId = dto.VenueId,
            CourtName = dto.CourtName.Trim(),
            CourtCode = dto.CourtCode.Trim(),
            SurfaceType = dto.SurfaceType.Trim(),
            HourlyRate = dto.HourlyRate,
            IsActive = dto.IsActive
        };

        _db.Courts.Add(court);
        LogAudit("CREATE_COURT", "Court", court.CourtCode, performedBy, $"Thêm sân {court.CourtName} ({venue.Name})");
        await _db.SaveChangesAsync(ct);

        return new CourtDto(court.Id, court.VenueId, venue.Name, court.CourtName, court.CourtCode, court.SurfaceType, court.HourlyRate, court.IsActive);
    }

    public async Task<CourtDto> UpdateCourtAsync(int id, SaveCourtDto dto, string performedBy, CancellationToken ct = default)
    {
        var court = await _db.Courts.Include(c => c.Venue).FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy sân cầu lông.");

        court.VenueId = dto.VenueId;
        court.CourtName = dto.CourtName.Trim();
        court.CourtCode = dto.CourtCode.Trim();
        court.SurfaceType = dto.SurfaceType.Trim();
        court.HourlyRate = dto.HourlyRate;
        court.IsActive = dto.IsActive;
        court.UpdatedAtUtc = DateTime.UtcNow;

        LogAudit("UPDATE_COURT", "Court", court.Id.ToString(), performedBy, $"Cập nhật sân {court.CourtName}");
        await _db.SaveChangesAsync(ct);

        var venue = await _db.Venues.FindAsync(new object[] { dto.VenueId }, ct);
        return new CourtDto(court.Id, court.VenueId, venue?.Name ?? court.Venue.Name, court.CourtName, court.CourtCode, court.SurfaceType, court.HourlyRate, court.IsActive);
    }

    // Players
    public async Task<PagedResultDto<PlayerDto>> GetPlayersAsync(
        string? search,
        SkillLevel? skillLevel,
        MembershipType? membershipType,
        bool? onlyActive,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 5, 100);

        var query = _db.Players
            .Include(p => p.Attendances)
            .Include(p => p.Charges)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var kw = search.Trim().ToLower();
            query = query.Where(p =>
                p.FullName.ToLower().Contains(kw) ||
                p.MemberCode.ToLower().Contains(kw) ||
                p.PhoneNumber.ToLower().Contains(kw));
        }

        if (skillLevel.HasValue)
            query = query.Where(p => p.SkillLevel == skillLevel.Value);

        if (membershipType.HasValue)
            query = query.Where(p => p.MembershipType == membershipType.Value);

        if (onlyActive == true)
            query = query.Where(p => p.IsActive);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderBy(p => p.MemberCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = items.Select(MapPlayerDto).ToList();
        return new PagedResultDto<PlayerDto>(dtos, totalCount, page, pageSize);
    }

    private static PlayerDto MapPlayerDto(Player p)
    {
        var attended = p.Attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
        var unpaid = p.Charges
            .Where(c => c.PaymentStatus == ChargePaymentStatus.Unpaid || c.PaymentStatus == ChargePaymentStatus.PartiallyPaid)
            .Sum(c => c.TotalDue - c.AmountPaid);

        return new PlayerDto(
            p.Id,
            p.MemberCode,
            p.FullName,
            p.PhoneNumber,
            p.Email,
            p.Gender,
            p.SkillLevel,
            p.MembershipType,
            p.Balance,
            p.IsActive,
            p.JoinedDate,
            p.Notes,
            attended,
            unpaid
        );
    }

    public async Task<PlayerDto> CreatePlayerAsync(SavePlayerDto dto, string performedBy, CancellationToken ct = default)
    {
        var count = await _db.Players.CountAsync(ct) + 1;
        var memberCode = $"TV{count:000}";
        while (await _db.Players.AnyAsync(p => p.MemberCode == memberCode, ct))
        {
            count++;
            memberCode = $"TV{count:000}";
        }

        var player = new Player
        {
            MemberCode = memberCode,
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Email = dto.Email?.Trim(),
            Gender = string.IsNullOrWhiteSpace(dto.Gender) ? "Nam" : dto.Gender.Trim(),
            SkillLevel = dto.SkillLevel,
            MembershipType = dto.MembershipType,
            IsActive = dto.IsActive,
            Notes = dto.Notes,
            JoinedDate = DateTime.UtcNow
        };

        _db.Players.Add(player);
        LogAudit("CREATE_PLAYER", "Player", player.MemberCode, performedBy, $"Thêm thành viên mới: {player.FullName} ({player.MemberCode})");
        await _db.SaveChangesAsync(ct);

        return MapPlayerDto(player);
    }

    public async Task<PlayerDto> UpdatePlayerAsync(int id, SavePlayerDto dto, string performedBy, CancellationToken ct = default)
    {
        var player = await _db.Players
            .Include(p => p.Attendances)
            .Include(p => p.Charges)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy thành viên.");

        player.FullName = dto.FullName.Trim();
        player.PhoneNumber = dto.PhoneNumber.Trim();
        player.Email = dto.Email?.Trim();
        player.Gender = dto.Gender.Trim();
        player.SkillLevel = dto.SkillLevel;
        player.MembershipType = dto.MembershipType;
        player.IsActive = dto.IsActive;
        player.Notes = dto.Notes;
        player.UpdatedAtUtc = DateTime.UtcNow;

        LogAudit("UPDATE_PLAYER", "Player", player.MemberCode, performedBy, $"Cập nhật thông tin thành viên: {player.FullName}");
        await _db.SaveChangesAsync(ct);

        return MapPlayerDto(player);
    }

    // Sessions & Registrations
    public async Task<PagedResultDto<SessionDto>> GetSessionsAsync(
        SessionStatus? status,
        int? venueId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 5, 100);

        var query = _db.Sessions
            .Include(s => s.Venue)
            .Include(s => s.Registrations)
            .Include(s => s.Attendances)
            .Include(s => s.Charges)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        if (venueId.HasValue)
            query = query.Where(s => s.VenueId == venueId.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(s => s.SessionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResultDto<SessionDto>(items.Select(MapSessionDto).ToList(), totalCount, page, pageSize);
    }

    public async Task<SessionDto> GetSessionByIdAsync(int id, CancellationToken ct = default)
    {
        var session = await _db.Sessions
            .Include(s => s.Venue)
            .Include(s => s.Registrations)
            .Include(s => s.Attendances)
            .Include(s => s.Charges)
            .FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy buổi sinh hoạt cầu lông.");

        return MapSessionDto(session);
    }

    private static SessionDto MapSessionDto(Session s)
    {
        var registeredCount = s.Registrations
            .Where(r => r.Status == RegistrationStatus.Registered)
            .Sum(r => 1 + r.GuestsBroughtCount);

        var attendedCount = s.Attendances
            .Where(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late)
            .Sum(a => 1 + a.ExtraGuestsCount);

        var totalSessionCost = s.CourtFeeTotal + (s.ShuttlecockCountUsed * s.ShuttlecockUnitPrice) + s.OtherFeeTotal;
        var totalBilled = s.Charges.Sum(c => c.TotalDue);
        var totalCollected = s.Charges.Sum(c => c.AmountPaid);

        return new SessionDto(
            s.Id,
            s.Title,
            s.SessionDate,
            s.StartTime.ToString(@"hh\:mm"),
            s.EndTime.ToString(@"hh\:mm"),
            s.VenueId,
            s.Venue?.Name ?? "Sân CLB",
            s.CourtsBookedText,
            s.MaxPlayers,
            registeredCount,
            attendedCount,
            s.Status,
            s.PricingMode,
            s.CourtFeeTotal,
            s.ShuttlecockCountUsed,
            s.ShuttlecockUnitPrice,
            s.OtherFeeTotal,
            s.FixedFeePerPlayer,
            s.GuestSurcharge,
            totalSessionCost,
            totalBilled,
            totalCollected,
            s.Notes
        );
    }

    public async Task<SessionDto> CreateSessionAsync(SaveSessionDto dto, string performedBy, CancellationToken ct = default)
    {
        if (!TimeSpan.TryParse(dto.StartTime, out var start)) start = new TimeSpan(19, 0, 0);
        if (!TimeSpan.TryParse(dto.EndTime, out var end)) end = new TimeSpan(21, 30, 0);

        var session = new Session
        {
            Title = dto.Title.Trim(),
            SessionDate = dto.SessionDate.Date,
            StartTime = start,
            EndTime = end,
            VenueId = dto.VenueId,
            CourtsBookedText = dto.CourtsBookedText.Trim(),
            MaxPlayers = dto.MaxPlayers,
            Status = dto.Status,
            PricingMode = dto.PricingMode,
            CourtFeeTotal = dto.CourtFeeTotal,
            ShuttlecockCountUsed = dto.ShuttlecockCountUsed,
            ShuttlecockUnitPrice = dto.ShuttlecockUnitPrice,
            OtherFeeTotal = dto.OtherFeeTotal,
            FixedFeePerPlayer = dto.FixedFeePerPlayer,
            GuestSurcharge = dto.GuestSurcharge,
            Notes = dto.Notes
        };

        _db.Sessions.Add(session);
        LogAudit("CREATE_SESSION", "Session", session.Title, performedBy, $"Tạo buổi sinh hoạt mới: {session.Title} ngày {session.SessionDate:dd/MM/yyyy}");
        await _db.SaveChangesAsync(ct);

        return await GetSessionByIdAsync(session.Id, ct);
    }

    public async Task<SessionDto> UpdateSessionAsync(int id, SaveSessionDto dto, string performedBy, CancellationToken ct = default)
    {
        var session = await _db.Sessions.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy buổi đánh.");

        if (!TimeSpan.TryParse(dto.StartTime, out var start)) start = session.StartTime;
        if (!TimeSpan.TryParse(dto.EndTime, out var end)) end = session.EndTime;

        session.Title = dto.Title.Trim();
        session.SessionDate = dto.SessionDate.Date;
        session.StartTime = start;
        session.EndTime = end;
        session.VenueId = dto.VenueId;
        session.CourtsBookedText = dto.CourtsBookedText.Trim();
        session.MaxPlayers = dto.MaxPlayers;
        session.Status = dto.Status;
        session.PricingMode = dto.PricingMode;
        session.CourtFeeTotal = dto.CourtFeeTotal;
        session.ShuttlecockCountUsed = dto.ShuttlecockCountUsed;
        session.ShuttlecockUnitPrice = dto.ShuttlecockUnitPrice;
        session.OtherFeeTotal = dto.OtherFeeTotal;
        session.FixedFeePerPlayer = dto.FixedFeePerPlayer;
        session.GuestSurcharge = dto.GuestSurcharge;
        session.Notes = dto.Notes;
        session.UpdatedAtUtc = DateTime.UtcNow;

        LogAudit("UPDATE_SESSION", "Session", session.Id.ToString(), performedBy, $"Cập nhật buổi sinh hoạt: {session.Title}");
        await _db.SaveChangesAsync(ct);

        return await GetSessionByIdAsync(session.Id, ct);
    }

    public async Task<IReadOnlyList<SessionRegistrationDto>> GetSessionRegistrationsAsync(int sessionId, CancellationToken ct = default)
    {
        var list = await _db.SessionRegistrations
            .Include(r => r.Player)
            .Where(r => r.SessionId == sessionId)
            .OrderBy(r => r.RegisteredAtUtc)
            .ToListAsync(ct);

        return list.Select(r => new SessionRegistrationDto(
            r.Id,
            r.SessionId,
            r.PlayerId,
            r.Player.MemberCode,
            r.Player.FullName,
            r.Player.PhoneNumber,
            r.Player.SkillLevel,
            r.IsGuest,
            r.GuestsBroughtCount,
            r.Status,
            r.RegisteredAtUtc,
            r.Note
        )).ToList();
    }

    public async Task<SessionRegistrationDto> RegisterPlayerToSessionAsync(
        int sessionId,
        RegisterSessionPlayerDto dto,
        string performedBy,
        CancellationToken ct = default)
    {
        var session = await _db.Sessions
            .Include(s => s.Registrations)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy buổi đánh.");

        var player = await _db.Players.FindAsync(new object[] { dto.PlayerId }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy thành viên.");

        var existing = await _db.SessionRegistrations
            .FirstOrDefaultAsync(r => r.SessionId == sessionId && r.PlayerId == dto.PlayerId, ct);

        if (existing != null && existing.Status != RegistrationStatus.Cancelled)
        {
            throw new InvalidOperationException($"Thành viên {player.FullName} đã đăng ký tham gia buổi đánh này.");
        }

        var currentSlots = session.Registrations
            .Where(r => r.Status == RegistrationStatus.Registered)
            .Sum(r => 1 + r.GuestsBroughtCount);

        var status = (currentSlots + 1 + dto.GuestsBroughtCount) <= session.MaxPlayers
            ? RegistrationStatus.Registered
            : RegistrationStatus.Waitlisted;

        if (existing != null)
        {
            existing.Status = status;
            existing.IsGuest = dto.IsGuest;
            existing.GuestsBroughtCount = dto.GuestsBroughtCount;
            existing.Note = dto.Note;
            existing.RegisteredAtUtc = DateTime.UtcNow;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            existing = new SessionRegistration
            {
                SessionId = sessionId,
                PlayerId = dto.PlayerId,
                IsGuest = dto.IsGuest,
                GuestsBroughtCount = dto.GuestsBroughtCount,
                Status = status,
                Note = dto.Note,
                RegisteredAtUtc = DateTime.UtcNow
            };
            _db.SessionRegistrations.Add(existing);
        }

        // Also ensure an AttendanceRecord exists so attendance check-in is ready
        var att = await _db.AttendanceRecords.FirstOrDefaultAsync(
            a => a.SessionId == sessionId && a.PlayerId == dto.PlayerId, ct);

        if (att == null)
        {
            _db.AttendanceRecords.Add(new AttendanceRecord
            {
                SessionId = sessionId,
                PlayerId = dto.PlayerId,
                Status = AttendanceStatus.Pending,
                IsGuest = dto.IsGuest || player.MembershipType == MembershipType.Guest,
                ExtraGuestsCount = dto.GuestsBroughtCount,
                Note = dto.Note
            });
        }

        LogAudit("REGISTER_SESSION", "SessionRegistration", $"{sessionId}-{dto.PlayerId}", performedBy,
            $"Đăng ký thành viên {player.FullName} vào buổi {session.Title}");

        await _db.SaveChangesAsync(ct);

        return new SessionRegistrationDto(
            existing.Id,
            existing.SessionId,
            existing.PlayerId,
            player.MemberCode,
            player.FullName,
            player.PhoneNumber,
            player.SkillLevel,
            existing.IsGuest,
            existing.GuestsBroughtCount,
            existing.Status,
            existing.RegisteredAtUtc,
            existing.Note
        );
    }

    public async Task CancelRegistrationAsync(int sessionId, int playerId, string performedBy, CancellationToken ct = default)
    {
        var reg = await _db.SessionRegistrations
            .Include(r => r.Player)
            .FirstOrDefaultAsync(r => r.SessionId == sessionId && r.PlayerId == playerId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy thông tin đăng ký.");

        reg.Status = RegistrationStatus.Cancelled;
        reg.UpdatedAtUtc = DateTime.UtcNow;

        LogAudit("CANCEL_REGISTRATION", "SessionRegistration", $"{sessionId}-{playerId}", performedBy,
            $"Hủy đăng ký của thành viên {reg.Player.FullName}");

        await _db.SaveChangesAsync(ct);
    }

    // Attendance
    public async Task<IReadOnlyList<AttendanceItemDto>> GetSessionAttendancesAsync(int sessionId, CancellationToken ct = default)
    {
        var session = await _db.Sessions.FindAsync(new object[] { sessionId }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy buổi đánh.");

        var records = await _db.AttendanceRecords
            .Include(a => a.Player)
            .Where(a => a.SessionId == sessionId)
            .OrderBy(a => a.Player.MemberCode)
            .ToListAsync(ct);

        var charges = await _db.SessionCharges
            .Where(c => c.SessionId == sessionId)
            .ToDictionaryAsync(c => c.PlayerId, ct);

        return records.Select(a =>
        {
            charges.TryGetValue(a.PlayerId, out var charge);
            var est = charge?.TotalDue ?? EstimateSinglePlayerFee(session, a);
            var payStatus = charge?.PaymentStatus ?? ChargePaymentStatus.Unpaid;

            return new AttendanceItemDto(
                a.Id,
                a.SessionId,
                session.Title,
                session.SessionDate,
                a.PlayerId,
                a.Player.MemberCode,
                a.Player.FullName,
                a.Player.SkillLevel,
                a.Player.MembershipType,
                a.Status,
                a.CheckInTimeUtc,
                a.IsGuest,
                a.ExtraGuestsCount,
                a.MatchesPlayedCount,
                a.Note,
                est,
                payStatus
            );
        }).ToList();
    }

    private static decimal EstimateSinglePlayerFee(Session session, AttendanceRecord att)
    {
        if (att.Status != AttendanceStatus.Present && att.Status != AttendanceStatus.Late && att.Status != AttendanceStatus.AbsentUnexcused)
            return 0m;

        var baseFee = session.FixedFeePerPlayer;
        if (att.IsGuest || att.Player?.MembershipType == MembershipType.Guest)
        {
            baseFee += session.GuestSurcharge;
        }
        var extraGuestsFee = att.ExtraGuestsCount * (session.FixedFeePerPlayer + session.GuestSurcharge);
        return baseFee + extraGuestsFee;
    }

    public async Task<AttendanceItemDto> UpsertAttendanceAsync(UpdateAttendanceDto dto, string performedBy, CancellationToken ct = default)
    {
        var session = await _db.Sessions.FindAsync(new object[] { dto.SessionId }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy buổi đánh.");

        var player = await _db.Players.FindAsync(new object[] { dto.PlayerId }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy thành viên.");

        var record = await _db.AttendanceRecords
            .FirstOrDefaultAsync(a => a.SessionId == dto.SessionId && a.PlayerId == dto.PlayerId, ct);

        if (record == null)
        {
            record = new AttendanceRecord
            {
                SessionId = dto.SessionId,
                PlayerId = dto.PlayerId,
                Status = dto.Status,
                CheckInTimeUtc = (dto.Status == AttendanceStatus.Present || dto.Status == AttendanceStatus.Late) ? DateTime.UtcNow : null,
                IsGuest = dto.IsGuest,
                ExtraGuestsCount = dto.ExtraGuestsCount,
                MatchesPlayedCount = dto.MatchesPlayedCount,
                Note = dto.Note
            };
            _db.AttendanceRecords.Add(record);
        }
        else
        {
            record.Status = dto.Status;
            if ((dto.Status == AttendanceStatus.Present || dto.Status == AttendanceStatus.Late) && !record.CheckInTimeUtc.HasValue)
            {
                record.CheckInTimeUtc = DateTime.UtcNow;
            }
            record.IsGuest = dto.IsGuest;
            record.ExtraGuestsCount = dto.ExtraGuestsCount;
            record.MatchesPlayedCount = dto.MatchesPlayedCount;
            record.Note = dto.Note;
            record.UpdatedAtUtc = DateTime.UtcNow;
        }

        var statusLabel = dto.Status switch
        {
            AttendanceStatus.Present => "Có mặt",
            AttendanceStatus.Late => "Đến muộn",
            AttendanceStatus.AbsentExcused => "Vắng có phép",
            AttendanceStatus.AbsentUnexcused => "Vắng không phép",
            _ => "Chờ điểm danh"
        };

        LogAudit("UPSERT_ATTENDANCE", "AttendanceRecord", $"{dto.SessionId}-{dto.PlayerId}", performedBy,
            $"Điểm danh người chơi {player.FullName}: {statusLabel}");

        await _db.SaveChangesAsync(ct);

        var charge = await _db.SessionCharges.FirstOrDefaultAsync(c => c.SessionId == dto.SessionId && c.PlayerId == dto.PlayerId, ct);
        record.Player = player;

        return new AttendanceItemDto(
            record.Id,
            record.SessionId,
            session.Title,
            session.SessionDate,
            record.PlayerId,
            player.MemberCode,
            player.FullName,
            player.SkillLevel,
            player.MembershipType,
            record.Status,
            record.CheckInTimeUtc,
            record.IsGuest,
            record.ExtraGuestsCount,
            record.MatchesPlayedCount,
            record.Note,
            charge?.TotalDue ?? EstimateSinglePlayerFee(session, record),
            charge?.PaymentStatus ?? ChargePaymentStatus.Unpaid
        );
    }

    public async Task<IReadOnlyList<AttendanceItemDto>> InitializeAttendanceFromRegistrationsAsync(int sessionId, string performedBy, CancellationToken ct = default)
    {
        var regs = await _db.SessionRegistrations
            .Include(r => r.Player)
            .Where(r => r.SessionId == sessionId && r.Status == RegistrationStatus.Registered)
            .ToListAsync(ct);

        var existingPlayerIds = await _db.AttendanceRecords
            .Where(a => a.SessionId == sessionId)
            .Select(a => a.PlayerId)
            .ToListAsync(ct);

        foreach (var reg in regs.Where(r => !existingPlayerIds.Contains(r.PlayerId)))
        {
            _db.AttendanceRecords.Add(new AttendanceRecord
            {
                SessionId = sessionId,
                PlayerId = reg.PlayerId,
                Status = AttendanceStatus.Present,
                CheckInTimeUtc = DateTime.UtcNow,
                IsGuest = reg.IsGuest || reg.Player.MembershipType == MembershipType.Guest,
                ExtraGuestsCount = reg.GuestsBroughtCount,
                MatchesPlayedCount = 2,
                Note = reg.Note
            });
        }

        await _db.SaveChangesAsync(ct);
        return await GetSessionAttendancesAsync(sessionId, ct);
    }

    // Pricing & Payments (with SQL Server Transaction support)
    public async Task<IReadOnlyList<SessionChargeDto>> GetSessionChargesAsync(
        int? sessionId,
        ChargePaymentStatus? status,
        int? playerId,
        CancellationToken ct = default)
    {
        var query = _db.SessionCharges
            .Include(c => c.Session)
            .Include(c => c.Player)
            .AsQueryable();

        if (sessionId.HasValue)
            query = query.Where(c => c.SessionId == sessionId.Value);

        if (status.HasValue)
            query = query.Where(c => c.PaymentStatus == status.Value);

        if (playerId.HasValue)
            query = query.Where(c => c.PlayerId == playerId.Value);

        var list = await query
            .OrderByDescending(c => c.Session.SessionDate)
            .ThenBy(c => c.Player.MemberCode)
            .ToListAsync(ct);

        return list.Select(MapChargeDto).ToList();
    }

    private static SessionChargeDto MapChargeDto(SessionCharge c)
    {
        var remaining = Math.Max(0m, c.TotalDue - c.AmountPaid);
        return new SessionChargeDto(
            c.Id,
            c.SessionId,
            c.Session?.Title ?? $"Buổi #{c.SessionId}",
            c.Session?.SessionDate ?? DateTime.UtcNow,
            c.PlayerId,
            c.Player?.MemberCode ?? "",
            c.Player?.FullName ?? "",
            c.Player?.PhoneNumber ?? "",
            c.BaseCourtShare,
            c.ShuttlecockShare,
            c.GuestFee,
            c.PenaltyOrDiscount,
            c.TotalDue,
            c.AmountPaid,
            remaining,
            c.PaymentStatus,
            c.Note
        );
    }

    public async Task<IReadOnlyList<SessionChargeDto>> CalculateSessionChargesAsync(
        CalculateSessionChargesDto dto,
        string performedBy,
        CancellationToken ct = default)
    {
        var isRelational = _db.Database.IsRelational();
        await using var tx = isRelational ? await _db.Database.BeginTransactionAsync(ct) : null;

        var session = await _db.Sessions
            .Include(s => s.Attendances).ThenInclude(a => a.Player)
            .Include(s => s.Charges)
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy buổi sinh hoạt để tính phí.");

        if (dto.ShuttlecockCountUsed.HasValue)
            session.ShuttlecockCountUsed = dto.ShuttlecockCountUsed.Value;

        if (dto.CourtFeeTotal.HasValue)
            session.CourtFeeTotal = dto.CourtFeeTotal.Value;

        if (dto.OtherFeeTotal.HasValue)
            session.OtherFeeTotal = dto.OtherFeeTotal.Value;

        var billableAttendances = session.Attendances
            .Where(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late || a.Status == AttendanceStatus.AbsentUnexcused)
            .ToList();

        if (billableAttendances.Count == 0)
        {
            throw new InvalidOperationException("Chưa có thành viên nào được điểm danh Có mặt / Đi muộn để chia tiền sân & cầu.");
        }

        var totalHeadcount = billableAttendances.Sum(a => 1 + a.ExtraGuestsCount);
        var shuttleTotalCost = (session.ShuttlecockCountUsed * session.ShuttlecockUnitPrice) + session.OtherFeeTotal;
        var shuttlePerPerson = totalHeadcount > 0 ? Math.Ceiling((shuttleTotalCost / totalHeadcount) / 1000m) * 1000m : 0m;
        var equalCourtPerPerson = totalHeadcount > 0 ? Math.Ceiling((session.CourtFeeTotal / totalHeadcount) / 1000m) * 1000m : 0m;

        foreach (var att in billableAttendances)
        {
            decimal baseCourt = 0m;
            decimal shuttleShare = 0m;
            decimal guestFee = 0m;
            decimal penalty = 0m;

            if (att.Status == AttendanceStatus.AbsentUnexcused)
            {
                penalty = 30000m;
            }
            else if (session.PricingMode == PricingSplitMode.EqualSplit)
            {
                baseCourt = equalCourtPerPerson;
                shuttleShare = shuttlePerPerson;
            }
            else if (session.PricingMode == PricingSplitMode.FixedPlusShuttlecock)
            {
                baseCourt = att.Player.MembershipType == MembershipType.FixedMonthly ? 35000m : session.FixedFeePerPlayer;
                shuttleShare = shuttlePerPerson;
            }
            else
            {
                baseCourt = session.FixedFeePerPlayer;
                shuttleShare = 15000m;
            }

            if (att.IsGuest || att.Player.MembershipType == MembershipType.Guest)
            {
                guestFee += session.GuestSurcharge;
            }

            if (att.ExtraGuestsCount > 0)
            {
                guestFee += att.ExtraGuestsCount * (session.FixedFeePerPlayer + session.GuestSurcharge);
            }

            var totalDue = Math.Max(0m, baseCourt + shuttleShare + guestFee + penalty);

            var existingCharge = session.Charges.FirstOrDefault(c => c.PlayerId == att.PlayerId);
            if (existingCharge == null)
            {
                var modeLabel = session.PricingMode switch
                {
                    PricingSplitMode.EqualSplit => "Chia đều tiền sân + tiền cầu",
                    PricingSplitMode.FixedPlusShuttlecock => "Tiền sân cố định + Chia tiền cầu",
                    _ => "Thu trọn gói cố định"
                };

                existingCharge = new SessionCharge
                {
                    SessionId = session.Id,
                    PlayerId = att.PlayerId,
                    BaseCourtShare = baseCourt,
                    ShuttlecockShare = shuttleShare,
                    GuestFee = guestFee,
                    PenaltyOrDiscount = penalty,
                    TotalDue = totalDue,
                    AmountPaid = 0m,
                    PaymentStatus = totalDue == 0m ? ChargePaymentStatus.Waived : ChargePaymentStatus.Unpaid,
                    Note = $"Tính tự động ({modeLabel})"
                };
                _db.SessionCharges.Add(existingCharge);
            }
            else
            {
                existingCharge.BaseCourtShare = baseCourt;
                existingCharge.ShuttlecockShare = shuttleShare;
                existingCharge.GuestFee = guestFee;
                existingCharge.PenaltyOrDiscount = penalty;
                existingCharge.TotalDue = totalDue;
                existingCharge.UpdatedAtUtc = DateTime.UtcNow;

                if (existingCharge.AmountPaid >= existingCharge.TotalDue && existingCharge.TotalDue > 0)
                    existingCharge.PaymentStatus = ChargePaymentStatus.Paid;
                else if (existingCharge.AmountPaid > 0)
                    existingCharge.PaymentStatus = ChargePaymentStatus.PartiallyPaid;
                else
                    existingCharge.PaymentStatus = ChargePaymentStatus.Unpaid;
            }
        }

        LogAudit("CALCULATE_CHARGES", "Session", session.Id.ToString(), performedBy,
            $"Chốt bảng kê chi phí buổi '{session.Title}' cho {billableAttendances.Count} thành viên.");

        await _db.SaveChangesAsync(ct);
        if (tx != null) await tx.CommitAsync(ct);

        return await GetSessionChargesAsync(session.Id, null, null, ct);
    }

    public async Task<PagedResultDto<PaymentTransactionDto>> GetPaymentsAsync(
        int? playerId,
        PaymentMethod? method,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 5, 100);

        var query = _db.PaymentTransactions
            .Include(p => p.Player)
            .Include(p => p.SessionCharge).ThenInclude(c => c!.Session)
            .AsQueryable();

        if (playerId.HasValue)
            query = query.Where(p => p.PlayerId == playerId.Value);

        if (method.HasValue)
            query = query.Where(p => p.PaymentMethod == method.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(p => p.PaidAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = items.Select(p => new PaymentTransactionDto(
            p.Id,
            p.TransactionCode,
            p.PlayerId,
            p.Player.MemberCode,
            p.Player.FullName,
            p.SessionChargeId,
            p.SessionCharge?.Session?.Title,
            p.Amount,
            p.PaymentMethod,
            p.Status,
            p.PaidAtUtc,
            p.ReferenceCode,
            p.ConfirmedByUsername,
            p.Note
        )).ToList();

        return new PagedResultDto<PaymentTransactionDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<PaymentTransactionDto> CreatePaymentAsync(
        CreatePaymentDto dto,
        string performedBy,
        CancellationToken ct = default)
    {
        var isRelational = _db.Database.IsRelational();
        await using var tx = isRelational ? await _db.Database.BeginTransactionAsync(ct) : null;

        var player = await _db.Players.FindAsync(new object[] { dto.PlayerId }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy thành viên thanh toán.");

        // Prevent duplicate accidental submission within 60 seconds with identical ReferenceCode or identical charge & amount
        if (!string.IsNullOrWhiteSpace(dto.ReferenceCode))
        {
            var dupRef = await _db.PaymentTransactions.AnyAsync(
                p => p.ReferenceCode == dto.ReferenceCode.Trim(), ct);
            if (dupRef)
            {
                throw new InvalidOperationException($"Mã tham chiếu giao dịch '{dto.ReferenceCode}' đã được ghi nhận trước đó.");
            }
        }

        SessionCharge? charge = null;
        if (dto.SessionChargeId.HasValue)
        {
            charge = await _db.SessionCharges
                .Include(c => c.Session)
                .FirstOrDefaultAsync(c => c.Id == dto.SessionChargeId.Value, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy khoản phí cần thanh toán.");

            if (charge.PaymentStatus == ChargePaymentStatus.Paid)
            {
                throw new InvalidOperationException("Khoản phí buổi đánh này đã được thanh toán đủ trước đó.");
            }

            charge.AmountPaid += dto.Amount;
            charge.PaymentStatus = charge.AmountPaid >= charge.TotalDue
                ? ChargePaymentStatus.Paid
                : ChargePaymentStatus.PartiallyPaid;
            charge.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            player.Balance += dto.Amount;
            player.UpdatedAtUtc = DateTime.UtcNow;
        }

        var txCode = $"PT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        var payment = new PaymentTransaction
        {
            TransactionCode = txCode,
            PlayerId = dto.PlayerId,
            SessionChargeId = dto.SessionChargeId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            Status = PaymentTransactionStatus.Confirmed,
            PaidAtUtc = DateTime.UtcNow,
            ReferenceCode = dto.ReferenceCode?.Trim(),
            ConfirmedByUsername = performedBy,
            Note = dto.Note
        };

        _db.PaymentTransactions.Add(payment);

        var methodLabel = dto.PaymentMethod switch
        {
            PaymentMethod.Cash => "Tiền mặt tại sân",
            PaymentMethod.BankTransfer => "Chuyển khoản ngân hàng",
            PaymentMethod.VietQR => "Quét mã QR ngân hàng",
            _ => "Ví điện tử"
        };

        _db.Notifications.Add(new NotificationItem
        {
            Title = "Đã ghi nhận khoản thu thành công",
            Message = $"Đã nhận {dto.Amount:N0} đ từ người chơi {player.FullName} ({player.MemberCode}) qua {methodLabel}.",
            Type = "Payment",
            CreatedAtUtc = DateTime.UtcNow,
            ActionUrl = "/payments"
        });

        LogAudit("CREATE_PAYMENT", "PaymentTransaction", txCode, performedBy,
            $"Thu {dto.Amount:N0} VNĐ từ {player.FullName} ({txCode})");

        await _db.SaveChangesAsync(ct);
        if (tx != null) await tx.CommitAsync(ct);

        return new PaymentTransactionDto(
            payment.Id,
            payment.TransactionCode,
            payment.PlayerId,
            player.MemberCode,
            player.FullName,
            payment.SessionChargeId,
            charge?.Session?.Title,
            payment.Amount,
            payment.PaymentMethod,
            payment.Status,
            payment.PaidAtUtc,
            payment.ReferenceCode,
            payment.ConfirmedByUsername,
            payment.Note
        );
    }

    // Expenses
    public async Task<PagedResultDto<ExpenseDto>> GetExpensesAsync(
        ExpenseCategory? category,
        int? sessionId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 5, 100);

        var query = _db.Expenses.Include(e => e.Session).AsQueryable();

        if (category.HasValue)
            query = query.Where(e => e.Category == category.Value);

        if (sessionId.HasValue)
            query = query.Where(e => e.SessionId == sessionId.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(e => e.ExpenseDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var dtos = items.Select(e => new ExpenseDto(
            e.Id,
            e.Title,
            e.Category,
            e.Amount,
            e.ExpenseDate,
            e.SessionId,
            e.Session?.Title,
            e.PaidBy,
            e.VendorName,
            e.ReceiptNote
        )).ToList();

        return new PagedResultDto<ExpenseDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<ExpenseDto> CreateExpenseAsync(SaveExpenseDto dto, string performedBy, CancellationToken ct = default)
    {
        var expense = new Expense
        {
            Title = dto.Title.Trim(),
            Category = dto.Category,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            SessionId = dto.SessionId,
            PaidBy = dto.PaidBy.Trim(),
            VendorName = dto.VendorName?.Trim(),
            ReceiptNote = dto.ReceiptNote
        };

        _db.Expenses.Add(expense);
        LogAudit("CREATE_EXPENSE", "Expense", expense.Title, performedBy,
            $"Chi quỹ CLB: {expense.Title} ({expense.Amount:N0} VNĐ)");

        await _db.SaveChangesAsync(ct);

        var session = dto.SessionId.HasValue ? await _db.Sessions.FindAsync(new object[] { dto.SessionId.Value }, ct) : null;

        return new ExpenseDto(
            expense.Id,
            expense.Title,
            expense.Category,
            expense.Amount,
            expense.ExpenseDate,
            expense.SessionId,
            session?.Title,
            expense.PaidBy,
            expense.VendorName,
            expense.ReceiptNote
        );
    }

    public async Task DeleteExpenseAsync(int id, string performedBy, CancellationToken ct = default)
    {
        var expense = await _db.Expenses.FindAsync(new object[] { id }, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy khoản chi.");

        _db.Expenses.Remove(expense);
        LogAudit("DELETE_EXPENSE", "Expense", id.ToString(), performedBy, $"Xóa khoản chi: {expense.Title}");
        await _db.SaveChangesAsync(ct);
    }

    // Court Assignments
    public async Task<IReadOnlyList<CourtAssignmentDto>> GetCourtAssignmentsAsync(int sessionId, CancellationToken ct = default)
    {
        var list = await _db.CourtAssignments
            .Include(ca => ca.Session)
            .Include(ca => ca.Court)
            .Where(ca => ca.SessionId == sessionId)
            .OrderBy(ca => ca.MatchOrder)
            .ToListAsync(ct);

        return list.Select(ca => new CourtAssignmentDto(
            ca.Id,
            ca.SessionId,
            ca.Session.Title,
            ca.CourtId,
            ca.Court.CourtName,
            ca.MatchOrder,
            ca.TeamAPlayerNames,
            ca.TeamBPlayerNames,
            ca.TeamAScore,
            ca.TeamBScore,
            ca.Status,
            ca.StartTimeUtc,
            ca.EndTimeUtc,
            ca.Notes
        )).ToList();
    }

    public async Task<CourtAssignmentDto> SaveCourtAssignmentAsync(
        int? id,
        SaveCourtAssignmentDto dto,
        string performedBy,
        CancellationToken ct = default)
    {
        CourtAssignment entity;
        if (id.HasValue && id.Value > 0)
        {
            entity = await _db.CourtAssignments.FindAsync(new object[] { id.Value }, ct)
                ?? throw new KeyNotFoundException("Không tìm thấy trận đấu phân sân.");

            entity.CourtId = dto.CourtId;
            entity.MatchOrder = dto.MatchOrder;
            entity.TeamAPlayerNames = dto.TeamAPlayerNames.Trim();
            entity.TeamBPlayerNames = dto.TeamBPlayerNames.Trim();
            entity.TeamAScore = dto.TeamAScore;
            entity.TeamBScore = dto.TeamBScore;
            entity.Status = dto.Status;
            entity.Notes = dto.Notes;
            entity.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            entity = new CourtAssignment
            {
                SessionId = dto.SessionId,
                CourtId = dto.CourtId,
                MatchOrder = dto.MatchOrder,
                TeamAPlayerNames = dto.TeamAPlayerNames.Trim(),
                TeamBPlayerNames = dto.TeamBPlayerNames.Trim(),
                TeamAScore = dto.TeamAScore,
                TeamBScore = dto.TeamBScore,
                Status = dto.Status,
                StartTimeUtc = DateTime.UtcNow,
                Notes = dto.Notes
            };
            _db.CourtAssignments.Add(entity);
        }

        await _db.SaveChangesAsync(ct);

        var loaded = await _db.CourtAssignments
            .Include(ca => ca.Session)
            .Include(ca => ca.Court)
            .FirstAsync(ca => ca.Id == entity.Id, ct);

        return new CourtAssignmentDto(
            loaded.Id,
            loaded.SessionId,
            loaded.Session.Title,
            loaded.CourtId,
            loaded.Court.CourtName,
            loaded.MatchOrder,
            loaded.TeamAPlayerNames,
            loaded.TeamBPlayerNames,
            loaded.TeamAScore,
            loaded.TeamBScore,
            loaded.Status,
            loaded.StartTimeUtc,
            loaded.EndTimeUtc,
            loaded.Notes
        );
    }

    public async Task<IReadOnlyList<CourtAssignmentDto>> AutoGenerateCourtAssignmentsAsync(
        int sessionId,
        string performedBy,
        CancellationToken ct = default)
    {
        var session = await _db.Sessions
            .Include(s => s.Attendances).ThenInclude(a => a.Player)
            .FirstOrDefaultAsync(s => s.Id == sessionId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy buổi đánh.");

        var courts = await _db.Courts.Where(c => c.VenueId == session.VenueId && c.IsActive).ToListAsync(ct);
        if (courts.Count == 0)
        {
            courts = await _db.Courts.Where(c => c.IsActive).ToListAsync(ct);
        }

        var players = session.Attendances
            .Where(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late)
            .OrderByDescending(a => a.Player.SkillLevel)
            .Select(a => a.Player.FullName)
            .ToList();

        if (players.Count < 4)
        {
            players = await _db.Players
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.SkillLevel)
                .Take(8)
                .Select(p => p.FullName)
                .ToListAsync(ct);
        }

        var existingCount = await _db.CourtAssignments.CountAsync(ca => ca.SessionId == sessionId, ct);
        var matchOrder = existingCount + 1;

        for (var i = 0; i + 3 < players.Count; i += 4)
        {
            var court = courts[(matchOrder - 1) % courts.Count];
            _db.CourtAssignments.Add(new CourtAssignment
            {
                SessionId = sessionId,
                CourtId = court.Id,
                MatchOrder = matchOrder++,
                TeamAPlayerNames = $"{players[i]} & {players[i + 3]}",
                TeamBPlayerNames = $"{players[i + 1]} & {players[i + 2]}",
                TeamAScore = 0,
                TeamBScore = 0,
                Status = MatchStatus.InProgress,
                StartTimeUtc = DateTime.UtcNow,
                Notes = "Ghép cặp cân bằng trình độ tự động"
            });
        }

        LogAudit("AUTO_ASSIGN_COURTS", "Session", sessionId.ToString(), performedBy,
            $"Xếp cặp thi đấu tự động cho buổi {session.Title}");

        await _db.SaveChangesAsync(ct);
        return await GetCourtAssignmentsAsync(sessionId, ct);
    }

    // Notifications, Settings, Audit Logs
    public async Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(CancellationToken ct = default)
    {
        var items = await _db.Notifications
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(30)
            .ToListAsync(ct);

        return items.Select(n => new NotificationDto(
            n.Id,
            n.Title,
            n.Message,
            n.Type,
            n.IsRead,
            n.CreatedAtUtc,
            n.ActionUrl
        )).ToList();
    }

    public async Task MarkNotificationReadAsync(int id, CancellationToken ct = default)
    {
        var item = await _db.Notifications.FindAsync(new object[] { id }, ct);
        if (item != null)
        {
            item.IsRead = true;
            item.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task MarkAllNotificationsReadAsync(CancellationToken ct = default)
    {
        var unread = await _db.Notifications.Where(n => !n.IsRead).ToListAsync(ct);
        foreach (var n in unread)
        {
            n.IsRead = true;
            n.UpdatedAtUtc = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ClubSettingDto> GetClubSettingAsync(CancellationToken ct = default)
    {
        var s = await _db.ClubSettings.FirstOrDefaultAsync(ct) ?? new ClubSetting();
        return new ClubSettingDto(
            s.Id,
            s.ClubName,
            s.ShortDescription,
            s.ContactPhone,
            s.ContactEmail,
            s.DefaultBankName,
            s.DefaultBankAccountNo,
            s.DefaultBankAccountName,
            s.DefaultShuttlecockPrice,
            s.DefaultFixedFeePerSession,
            s.DefaultGuestSurcharge,
            s.CancellationDeadlineHours,
            s.LateCancellationPenalty,
            s.AutoGenerateChargesOnAttendance
        );
    }

    public async Task<ClubSettingDto> UpdateClubSettingAsync(ClubSettingDto dto, string performedBy, CancellationToken ct = default)
    {
        var s = await _db.ClubSettings.FirstOrDefaultAsync(ct);
        if (s == null)
        {
            s = new ClubSetting();
            _db.ClubSettings.Add(s);
        }

        s.ClubName = dto.ClubName.Trim();
        s.ShortDescription = dto.ShortDescription.Trim();
        s.ContactPhone = dto.ContactPhone.Trim();
        s.ContactEmail = dto.ContactEmail.Trim();
        s.DefaultBankName = dto.DefaultBankName.Trim();
        s.DefaultBankAccountNo = dto.DefaultBankAccountNo.Trim();
        s.DefaultBankAccountName = dto.DefaultBankAccountName.Trim();
        s.DefaultShuttlecockPrice = dto.DefaultShuttlecockPrice;
        s.DefaultFixedFeePerSession = dto.DefaultFixedFeePerSession;
        s.DefaultGuestSurcharge = dto.DefaultGuestSurcharge;
        s.CancellationDeadlineHours = dto.CancellationDeadlineHours;
        s.LateCancellationPenalty = dto.LateCancellationPenalty;
        s.AutoGenerateChargesOnAttendance = dto.AutoGenerateChargesOnAttendance;
        s.UpdatedAtUtc = DateTime.UtcNow;

        LogAudit("UPDATE_SETTINGS", "ClubSetting", s.Id.ToString(), performedBy, "Cập nhật cấu hình hệ thống CLB.");
        await _db.SaveChangesAsync(ct);

        return await GetClubSettingAsync(ct);
    }

    public async Task<IReadOnlyList<AuditLogDto>> GetRecentAuditLogsAsync(int count, CancellationToken ct = default)
    {
        var logs = await _db.AuditLogs
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(Math.Clamp(count, 5, 100))
            .ToListAsync(ct);

        return logs.Select(a => new AuditLogDto(
            a.Id,
            a.Action,
            a.EntityName,
            a.EntityId,
            a.PerformedBy,
            a.Summary,
            a.CreatedAtUtc
        )).ToList();
    }
}
