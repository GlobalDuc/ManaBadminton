using BadmintonHub.Application.DTOs;
using BadmintonHub.Domain.Enums;

namespace BadmintonHub.Application.Interfaces;

public interface IBadmintonHubService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct = default);

    // Venues & Courts
    Task<IReadOnlyList<VenueDto>> GetVenuesAsync(CancellationToken ct = default);
    Task<VenueDto> CreateVenueAsync(SaveVenueDto dto, string performedBy, CancellationToken ct = default);
    Task<VenueDto> UpdateVenueAsync(int id, SaveVenueDto dto, string performedBy, CancellationToken ct = default);
    Task<IReadOnlyList<CourtDto>> GetCourtsAsync(int? venueId, CancellationToken ct = default);
    Task<CourtDto> CreateCourtAsync(SaveCourtDto dto, string performedBy, CancellationToken ct = default);
    Task<CourtDto> UpdateCourtAsync(int id, SaveCourtDto dto, string performedBy, CancellationToken ct = default);

    // Players
    Task<PagedResultDto<PlayerDto>> GetPlayersAsync(string? search, SkillLevel? skillLevel, MembershipType? membershipType, bool? onlyActive, int page, int pageSize, CancellationToken ct = default);
    Task<PlayerDto> CreatePlayerAsync(SavePlayerDto dto, string performedBy, CancellationToken ct = default);
    Task<PlayerDto> UpdatePlayerAsync(int id, SavePlayerDto dto, string performedBy, CancellationToken ct = default);

    // Sessions & Registrations
    Task<PagedResultDto<SessionDto>> GetSessionsAsync(SessionStatus? status, int? venueId, int page, int pageSize, CancellationToken ct = default);
    Task<SessionDto> GetSessionByIdAsync(int id, CancellationToken ct = default);
    Task<SessionDto> CreateSessionAsync(SaveSessionDto dto, string performedBy, CancellationToken ct = default);
    Task<SessionDto> UpdateSessionAsync(int id, SaveSessionDto dto, string performedBy, CancellationToken ct = default);
    Task<IReadOnlyList<SessionRegistrationDto>> GetSessionRegistrationsAsync(int sessionId, CancellationToken ct = default);
    Task<SessionRegistrationDto> RegisterPlayerToSessionAsync(int sessionId, RegisterSessionPlayerDto dto, string performedBy, CancellationToken ct = default);
    Task CancelRegistrationAsync(int sessionId, int playerId, string performedBy, CancellationToken ct = default);

    // Attendance
    Task<IReadOnlyList<AttendanceItemDto>> GetSessionAttendancesAsync(int sessionId, CancellationToken ct = default);
    Task<AttendanceItemDto> UpsertAttendanceAsync(UpdateAttendanceDto dto, string performedBy, CancellationToken ct = default);
    Task<IReadOnlyList<AttendanceItemDto>> InitializeAttendanceFromRegistrationsAsync(int sessionId, string performedBy, CancellationToken ct = default);

    // Pricing & Payments
    Task<IReadOnlyList<SessionChargeDto>> GetSessionChargesAsync(int? sessionId, ChargePaymentStatus? status, int? playerId, CancellationToken ct = default);
    Task<IReadOnlyList<SessionChargeDto>> CalculateSessionChargesAsync(CalculateSessionChargesDto dto, string performedBy, CancellationToken ct = default);
    Task<PagedResultDto<PaymentTransactionDto>> GetPaymentsAsync(int? playerId, PaymentMethod? method, int page, int pageSize, CancellationToken ct = default);
    Task<PaymentTransactionDto> CreatePaymentAsync(CreatePaymentDto dto, string performedBy, CancellationToken ct = default);

    // Expenses
    Task<PagedResultDto<ExpenseDto>> GetExpensesAsync(ExpenseCategory? category, int? sessionId, int page, int pageSize, CancellationToken ct = default);
    Task<ExpenseDto> CreateExpenseAsync(SaveExpenseDto dto, string performedBy, CancellationToken ct = default);
    Task DeleteExpenseAsync(int id, string performedBy, CancellationToken ct = default);

    // Court Assignments
    Task<IReadOnlyList<CourtAssignmentDto>> GetCourtAssignmentsAsync(int sessionId, CancellationToken ct = default);
    Task<CourtAssignmentDto> SaveCourtAssignmentAsync(int? id, SaveCourtAssignmentDto dto, string performedBy, CancellationToken ct = default);
    Task<IReadOnlyList<CourtAssignmentDto>> AutoGenerateCourtAssignmentsAsync(int sessionId, string performedBy, CancellationToken ct = default);

    // Notifications, Settings, Audit Logs
    Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(CancellationToken ct = default);
    Task MarkNotificationReadAsync(int id, CancellationToken ct = default);
    Task MarkAllNotificationsReadAsync(CancellationToken ct = default);
    Task<ClubSettingDto> GetClubSettingAsync(CancellationToken ct = default);
    Task<ClubSettingDto> UpdateClubSettingAsync(ClubSettingDto dto, string performedBy, CancellationToken ct = default);
    Task<IReadOnlyList<AuditLogDto>> GetRecentAuditLogsAsync(int count, CancellationToken ct = default);
}
