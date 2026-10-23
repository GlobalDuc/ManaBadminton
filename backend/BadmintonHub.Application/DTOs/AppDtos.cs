using BadmintonHub.Domain.Enums;

namespace BadmintonHub.Application.DTOs;

public record LoginRequestDto(string Username, string Password);

public record AuthResponseDto(
    string Token,
    string Username,
    string FullName,
    string Email,
    string Role,
    int? LinkedPlayerId
);

public record PagedResultDto<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize
);

public record VenueDto(
    int Id,
    string Name,
    string Address,
    string ContactPhone,
    decimal DefaultHourlyRate,
    bool IsActive,
    string? Notes,
    int CourtsCount
);

public record SaveVenueDto(
    string Name,
    string Address,
    string ContactPhone,
    decimal DefaultHourlyRate,
    bool IsActive,
    string? Notes
);

public record CourtDto(
    int Id,
    int VenueId,
    string VenueName,
    string CourtName,
    string CourtCode,
    string SurfaceType,
    decimal HourlyRate,
    bool IsActive
);

public record SaveCourtDto(
    int VenueId,
    string CourtName,
    string CourtCode,
    string SurfaceType,
    decimal HourlyRate,
    bool IsActive
);

public record PlayerDto(
    int Id,
    string MemberCode,
    string FullName,
    string PhoneNumber,
    string? Email,
    string Gender,
    SkillLevel SkillLevel,
    MembershipType MembershipType,
    decimal Balance,
    bool IsActive,
    DateTime JoinedDate,
    string? Notes,
    int TotalAttendedSessions,
    decimal UnpaidAmount
);

public record SavePlayerDto(
    string FullName,
    string PhoneNumber,
    string? Email,
    string Gender,
    SkillLevel SkillLevel,
    MembershipType MembershipType,
    bool IsActive,
    string? Notes
);

public record SessionDto(
    int Id,
    string Title,
    DateTime SessionDate,
    string StartTime,
    string EndTime,
    int VenueId,
    string VenueName,
    string CourtsBookedText,
    int MaxPlayers,
    int RegisteredCount,
    int AttendedCount,
    SessionStatus Status,
    PricingSplitMode PricingMode,
    decimal CourtFeeTotal,
    int ShuttlecockCountUsed,
    decimal ShuttlecockUnitPrice,
    decimal OtherFeeTotal,
    decimal FixedFeePerPlayer,
    decimal GuestSurcharge,
    decimal TotalSessionCost,
    decimal TotalBilledAmount,
    decimal TotalCollectedAmount,
    string? Notes
);

public record SaveSessionDto(
    string Title,
    DateTime SessionDate,
    string StartTime,
    string EndTime,
    int VenueId,
    string CourtsBookedText,
    int MaxPlayers,
    SessionStatus Status,
    PricingSplitMode PricingMode,
    decimal CourtFeeTotal,
    int ShuttlecockCountUsed,
    decimal ShuttlecockUnitPrice,
    decimal OtherFeeTotal,
    decimal FixedFeePerPlayer,
    decimal GuestSurcharge,
    string? Notes
);

public record RegisterSessionPlayerDto(
    int PlayerId,
    bool IsGuest,
    int GuestsBroughtCount,
    string? Note
);

public record SessionRegistrationDto(
    int Id,
    int SessionId,
    int PlayerId,
    string MemberCode,
    string PlayerName,
    string PhoneNumber,
    SkillLevel SkillLevel,
    bool IsGuest,
    int GuestsBroughtCount,
    RegistrationStatus Status,
    DateTime RegisteredAtUtc,
    string? Note
);

public record AttendanceItemDto(
    int Id,
    int SessionId,
    string SessionTitle,
    DateTime SessionDate,
    int PlayerId,
    string MemberCode,
    string PlayerName,
    SkillLevel SkillLevel,
    MembershipType MembershipType,
    AttendanceStatus Status,
    DateTime? CheckInTimeUtc,
    bool IsGuest,
    int ExtraGuestsCount,
    int MatchesPlayedCount,
    string? Note,
    decimal EstimatedOrActualCharge,
    ChargePaymentStatus ChargeStatus
);

public record UpdateAttendanceDto(
    int SessionId,
    int PlayerId,
    AttendanceStatus Status,
    bool IsGuest,
    int ExtraGuestsCount,
    int MatchesPlayedCount,
    string? Note
);

public record SessionChargeDto(
    int Id,
    int SessionId,
    string SessionTitle,
    DateTime SessionDate,
    int PlayerId,
    string MemberCode,
    string PlayerName,
    string PhoneNumber,
    decimal BaseCourtShare,
    decimal ShuttlecockShare,
    decimal GuestFee,
    decimal PenaltyOrDiscount,
    decimal TotalDue,
    decimal AmountPaid,
    decimal RemainingAmount,
    ChargePaymentStatus PaymentStatus,
    string? Note
);

public record CalculateSessionChargesDto(
    int SessionId,
    int? ShuttlecockCountUsed,
    decimal? CourtFeeTotal,
    decimal? OtherFeeTotal
);

public record PaymentTransactionDto(
    int Id,
    string TransactionCode,
    int PlayerId,
    string MemberCode,
    string PlayerName,
    int? SessionChargeId,
    string? SessionTitle,
    decimal Amount,
    PaymentMethod PaymentMethod,
    PaymentTransactionStatus Status,
    DateTime PaidAtUtc,
    string? ReferenceCode,
    string? ConfirmedByUsername,
    string? Note
);

public record CreatePaymentDto(
    int PlayerId,
    int? SessionChargeId,
    decimal Amount,
    PaymentMethod PaymentMethod,
    string? ReferenceCode,
    string? Note
);

public record ExpenseDto(
    int Id,
    string Title,
    ExpenseCategory Category,
    decimal Amount,
    DateTime ExpenseDate,
    int? SessionId,
    string? SessionTitle,
    string PaidBy,
    string? VendorName,
    string? ReceiptNote
);

public record SaveExpenseDto(
    string Title,
    ExpenseCategory Category,
    decimal Amount,
    DateTime ExpenseDate,
    int? SessionId,
    string PaidBy,
    string? VendorName,
    string? ReceiptNote
);

public record CourtAssignmentDto(
    int Id,
    int SessionId,
    string SessionTitle,
    int CourtId,
    string CourtName,
    int MatchOrder,
    string TeamAPlayerNames,
    string TeamBPlayerNames,
    int TeamAScore,
    int TeamBScore,
    MatchStatus Status,
    DateTime? StartTimeUtc,
    DateTime? EndTimeUtc,
    string? Notes
);

public record SaveCourtAssignmentDto(
    int SessionId,
    int CourtId,
    int MatchOrder,
    string TeamAPlayerNames,
    string TeamBPlayerNames,
    int TeamAScore,
    int TeamBScore,
    MatchStatus Status,
    string? Notes
);

public record MonthlyFinancialPointDto(
    string MonthLabel,
    decimal Revenue,
    decimal Expense,
    decimal NetBalance,
    int SessionsCount
);

public record CategoryBreakdownDto(
    string CategoryName,
    decimal Amount,
    decimal Percentage
);

public record DashboardSummaryDto(
    int TotalActivePlayers,
    int UpcomingSessionsCount,
    int CompletedSessionsThisMonth,
    decimal MonthlyRevenue,
    decimal MonthlyExpenses,
    decimal ClubFundBalance,
    decimal TotalOutstandingDebt,
    int UnpaidChargesCount,
    IReadOnlyList<SessionDto> UpcomingSessions,
    IReadOnlyList<SessionChargeDto> TopPendingDebts,
    IReadOnlyList<MonthlyFinancialPointDto> MonthlyTrends,
    IReadOnlyList<CategoryBreakdownDto> ExpenseBreakdown
);

public record NotificationDto(
    int Id,
    string Title,
    string Message,
    string Type,
    bool IsRead,
    DateTime CreatedAtUtc,
    string? ActionUrl
);

public record ClubSettingDto(
    int Id,
    string ClubName,
    string ShortDescription,
    string ContactPhone,
    string ContactEmail,
    string DefaultBankName,
    string DefaultBankAccountNo,
    string DefaultBankAccountName,
    decimal DefaultShuttlecockPrice,
    decimal DefaultFixedFeePerSession,
    decimal DefaultGuestSurcharge,
    int CancellationDeadlineHours,
    decimal LateCancellationPenalty,
    bool AutoGenerateChargesOnAttendance
);

public record AuditLogDto(
    int Id,
    string Action,
    string EntityName,
    string EntityId,
    string PerformedBy,
    string Summary,
    DateTime CreatedAtUtc
);
