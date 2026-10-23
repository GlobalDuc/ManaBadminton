using System.ComponentModel.DataAnnotations;
using BadmintonHub.Domain.Enums;

namespace BadmintonHub.Domain.Entities;

public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}

public class User : BaseEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Member;
    public bool IsActive { get; set; } = true;
    public int? LinkedPlayerId { get; set; }
    public Player? LinkedPlayer { get; set; }
}

public class Player : BaseEntity
{
    public string MemberCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Gender { get; set; } = "Nam";
    public SkillLevel SkillLevel { get; set; } = SkillLevel.Intermediate;
    public MembershipType MembershipType { get; set; } = MembershipType.Flexible;
    public decimal Balance { get; set; } = 0m;
    public bool IsActive { get; set; } = true;
    public DateTime JoinedDate { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public string? AvatarUrl { get; set; }

    public ICollection<SessionRegistration> Registrations { get; set; } = new List<SessionRegistration>();
    public ICollection<AttendanceRecord> Attendances { get; set; } = new List<AttendanceRecord>();
    public ICollection<SessionCharge> Charges { get; set; } = new List<SessionCharge>();
    public ICollection<PaymentTransaction> Payments { get; set; } = new List<PaymentTransaction>();
}

public class Venue : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public decimal DefaultHourlyRate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public ICollection<Court> Courts { get; set; } = new List<Court>();
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}

public class Court : BaseEntity
{
    public int VenueId { get; set; }
    public Venue Venue { get; set; } = null!;
    public string CourtName { get; set; } = string.Empty;
    public string CourtCode { get; set; } = string.Empty;
    public string SurfaceType { get; set; } = "Thảm PVC tiêu chuẩn";
    public decimal HourlyRate { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<CourtAssignment> CourtAssignments { get; set; } = new List<CourtAssignment>();
}

public class Session : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public DateTime SessionDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int VenueId { get; set; }
    public Venue Venue { get; set; } = null!;
    public string CourtsBookedText { get; set; } = "Sân 1, Sân 2";
    public int MaxPlayers { get; set; } = 16;
    public SessionStatus Status { get; set; } = SessionStatus.Upcoming;
    public PricingSplitMode PricingMode { get; set; } = PricingSplitMode.FixedPlusShuttlecock;

    public decimal CourtFeeTotal { get; set; }
    public int ShuttlecockCountUsed { get; set; }
    public decimal ShuttlecockUnitPrice { get; set; } = 25000m;
    public decimal OtherFeeTotal { get; set; }
    public decimal FixedFeePerPlayer { get; set; } = 50000m;
    public decimal GuestSurcharge { get; set; } = 15000m;
    public string? Notes { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<SessionRegistration> Registrations { get; set; } = new List<SessionRegistration>();
    public ICollection<AttendanceRecord> Attendances { get; set; } = new List<AttendanceRecord>();
    public ICollection<SessionCharge> Charges { get; set; } = new List<SessionCharge>();
    public ICollection<CourtAssignment> CourtAssignments { get; set; } = new List<CourtAssignment>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}

public class SessionRegistration : BaseEntity
{
    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public bool IsGuest { get; set; }
    public int GuestsBroughtCount { get; set; }
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Registered;
    public DateTime RegisteredAtUtc { get; set; } = DateTime.UtcNow;
    public string? Note { get; set; }
}

public class AttendanceRecord : BaseEntity
{
    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Pending;
    public DateTime? CheckInTimeUtc { get; set; }
    public bool IsGuest { get; set; }
    public int ExtraGuestsCount { get; set; }
    public int MatchesPlayedCount { get; set; }
    public string? Note { get; set; }
}

public class SessionCharge : BaseEntity
{
    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public decimal BaseCourtShare { get; set; }
    public decimal ShuttlecockShare { get; set; }
    public decimal GuestFee { get; set; }
    public decimal PenaltyOrDiscount { get; set; }
    public decimal TotalDue { get; set; }
    public decimal AmountPaid { get; set; }
    public ChargePaymentStatus PaymentStatus { get; set; } = ChargePaymentStatus.Unpaid;
    public string? Note { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
}

public class PaymentTransaction : BaseEntity
{
    public string TransactionCode { get; set; } = string.Empty;
    public int PlayerId { get; set; }
    public Player Player { get; set; } = null!;
    public int? SessionChargeId { get; set; }
    public SessionCharge? SessionCharge { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.VietQR;
    public PaymentTransactionStatus Status { get; set; } = PaymentTransactionStatus.Confirmed;
    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;
    public string? ReferenceCode { get; set; }
    public string? ConfirmedByUsername { get; set; }
    public string? Note { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

public class Expense : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public ExpenseCategory Category { get; set; } = ExpenseCategory.Shuttlecock;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    public int? SessionId { get; set; }
    public Session? Session { get; set; }
    public string PaidBy { get; set; } = string.Empty;
    public string? VendorName { get; set; }
    public string? ReceiptNote { get; set; }
}

public class CourtAssignment : BaseEntity
{
    public int SessionId { get; set; }
    public Session Session { get; set; } = null!;
    public int CourtId { get; set; }
    public Court Court { get; set; } = null!;
    public int MatchOrder { get; set; }
    public string TeamAPlayerNames { get; set; } = string.Empty;
    public string TeamBPlayerNames { get; set; } = string.Empty;
    public int TeamAScore { get; set; }
    public int TeamBScore { get; set; }
    public MatchStatus Status { get; set; } = MatchStatus.Scheduled;
    public DateTime? StartTimeUtc { get; set; }
    public DateTime? EndTimeUtc { get; set; }
    public string? Notes { get; set; }
}

public class NotificationItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Info"; // Info, Payment, Session, System
    public string? TargetRole { get; set; }
    public int? TargetPlayerId { get; set; }
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }
}

public class ClubSetting : BaseEntity
{
    public string ClubName { get; set; } = "CLB Cầu Lông Blue Smash Sài Gòn";
    public string ShortDescription { get; set; } = "Hệ thống quản lý CLB cầu lông chuyên nghiệp chuẩn SaaS";
    public string ContactPhone { get; set; } = "0909 123 456";
    public string ContactEmail { get; set; } = "banquanly@bluesmash.vn";
    public string DefaultBankName { get; set; } = "Vietcombank";
    public string DefaultBankAccountNo { get; set; } = "1029384756";
    public string DefaultBankAccountName { get; set; } = "CLB CAU LONG BLUE SMASH";
    public decimal DefaultShuttlecockPrice { get; set; } = 25000m;
    public decimal DefaultFixedFeePerSession { get; set; } = 55000m;
    public decimal DefaultGuestSurcharge { get; set; } = 15000m;
    public int CancellationDeadlineHours { get; set; } = 6;
    public decimal LateCancellationPenalty { get; set; } = 30000m;
    public bool AutoGenerateChargesOnAttendance { get; set; } = true;
}

public class AuditLog : BaseEntity
{
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
}
