using BadmintonHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BadmintonHub.Infrastructure.Persistence;

public class BadmintonHubDbContext : DbContext
{
    public BadmintonHubDbContext(DbContextOptions<BadmintonHubDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionRegistration> SessionRegistrations => Set<SessionRegistration>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<SessionCharge> SessionCharges => Set<SessionCharge>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<CourtAssignment> CourtAssignments => Set<CourtAssignment>();
    public DbSet<NotificationItem> Notifications => Set<NotificationItem>();
    public DbSet<ClubSetting> ClubSettings => Set<ClubSetting>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(b =>
        {
            b.ToTable("Users");
            b.HasKey(x => x.Id);
            b.Property(x => x.Username).HasMaxLength(64).IsRequired();
            b.Property(x => x.Email).HasMaxLength(150).IsRequired();
            b.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
            b.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            b.Property(x => x.PhoneNumber).HasMaxLength(25);
            b.HasIndex(x => x.Username).IsUnique();
            b.HasIndex(x => x.Email).IsUnique();
            b.HasOne(x => x.LinkedPlayer)
             .WithMany()
             .HasForeignKey(x => x.LinkedPlayerId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Player
        modelBuilder.Entity<Player>(b =>
        {
            b.ToTable("Players");
            b.HasKey(x => x.Id);
            b.Property(x => x.MemberCode).HasMaxLength(32).IsRequired();
            b.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            b.Property(x => x.PhoneNumber).HasMaxLength(25).IsRequired();
            b.Property(x => x.Email).HasMaxLength(150);
            b.Property(x => x.Gender).HasMaxLength(20);
            b.Property(x => x.Balance).HasColumnType("decimal(18,2)");
            b.Property(x => x.Notes).HasMaxLength(500);
            b.Property(x => x.AvatarUrl).HasMaxLength(300);
            b.HasIndex(x => x.MemberCode).IsUnique();
            b.HasIndex(x => x.PhoneNumber);
        });

        // Venue
        modelBuilder.Entity<Venue>(b =>
        {
            b.ToTable("Venues");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(150).IsRequired();
            b.Property(x => x.Address).HasMaxLength(300).IsRequired();
            b.Property(x => x.ContactPhone).HasMaxLength(30);
            b.Property(x => x.DefaultHourlyRate).HasColumnType("decimal(18,2)");
            b.Property(x => x.Notes).HasMaxLength(500);
        });

        // Court
        modelBuilder.Entity<Court>(b =>
        {
            b.ToTable("Courts");
            b.HasKey(x => x.Id);
            b.Property(x => x.CourtName).HasMaxLength(80).IsRequired();
            b.Property(x => x.CourtCode).HasMaxLength(30).IsRequired();
            b.Property(x => x.SurfaceType).HasMaxLength(100);
            b.Property(x => x.HourlyRate).HasColumnType("decimal(18,2)");
            b.HasIndex(x => new { x.VenueId, x.CourtCode }).IsUnique();
            b.HasOne(x => x.Venue)
             .WithMany(v => v.Courts)
             .HasForeignKey(x => x.VenueId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Session
        modelBuilder.Entity<Session>(b =>
        {
            b.ToTable("Sessions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(180).IsRequired();
            b.Property(x => x.CourtsBookedText).HasMaxLength(150);
            b.Property(x => x.CourtFeeTotal).HasColumnType("decimal(18,2)");
            b.Property(x => x.ShuttlecockUnitPrice).HasColumnType("decimal(18,2)");
            b.Property(x => x.OtherFeeTotal).HasColumnType("decimal(18,2)");
            b.Property(x => x.FixedFeePerPlayer).HasColumnType("decimal(18,2)");
            b.Property(x => x.GuestSurcharge).HasColumnType("decimal(18,2)");
            b.Property(x => x.Notes).HasMaxLength(600);
            b.Property(x => x.RowVersion).IsRowVersion();
            b.HasIndex(x => x.SessionDate);
            b.HasOne(x => x.Venue)
             .WithMany(v => v.Sessions)
             .HasForeignKey(x => x.VenueId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // SessionRegistration (Unique constraint on SessionId + PlayerId prevents duplicate registrations)
        modelBuilder.Entity<SessionRegistration>(b =>
        {
            b.ToTable("SessionRegistrations");
            b.HasKey(x => x.Id);
            b.Property(x => x.Note).HasMaxLength(300);
            b.HasIndex(x => new { x.SessionId, x.PlayerId }).IsUnique();
            b.HasOne(x => x.Session)
             .WithMany(s => s.Registrations)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Player)
             .WithMany(p => p.Registrations)
             .HasForeignKey(x => x.PlayerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // AttendanceRecord (Unique constraint on SessionId + PlayerId prevents duplicate attendance)
        modelBuilder.Entity<AttendanceRecord>(b =>
        {
            b.ToTable("AttendanceRecords");
            b.HasKey(x => x.Id);
            b.Property(x => x.Note).HasMaxLength(300);
            b.HasIndex(x => new { x.SessionId, x.PlayerId }).IsUnique();
            b.HasOne(x => x.Session)
             .WithMany(s => s.Attendances)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Player)
             .WithMany(p => p.Attendances)
             .HasForeignKey(x => x.PlayerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // SessionCharge (Unique constraint on SessionId + PlayerId prevents duplicate session charges)
        modelBuilder.Entity<SessionCharge>(b =>
        {
            b.ToTable("SessionCharges");
            b.HasKey(x => x.Id);
            b.Property(x => x.BaseCourtShare).HasColumnType("decimal(18,2)");
            b.Property(x => x.ShuttlecockShare).HasColumnType("decimal(18,2)");
            b.Property(x => x.GuestFee).HasColumnType("decimal(18,2)");
            b.Property(x => x.PenaltyOrDiscount).HasColumnType("decimal(18,2)");
            b.Property(x => x.TotalDue).HasColumnType("decimal(18,2)");
            b.Property(x => x.AmountPaid).HasColumnType("decimal(18,2)");
            b.Property(x => x.Note).HasMaxLength(300);
            b.Property(x => x.RowVersion).IsRowVersion();
            b.HasIndex(x => new { x.SessionId, x.PlayerId }).IsUnique();
            b.HasOne(x => x.Session)
             .WithMany(s => s.Charges)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Player)
             .WithMany(p => p.Charges)
             .HasForeignKey(x => x.PlayerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // PaymentTransaction
        modelBuilder.Entity<PaymentTransaction>(b =>
        {
            b.ToTable("PaymentTransactions");
            b.HasKey(x => x.Id);
            b.Property(x => x.TransactionCode).HasMaxLength(50).IsRequired();
            b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            b.Property(x => x.ReferenceCode).HasMaxLength(100);
            b.Property(x => x.ConfirmedByUsername).HasMaxLength(80);
            b.Property(x => x.Note).HasMaxLength(300);
            b.Property(x => x.RowVersion).IsRowVersion();
            b.HasIndex(x => x.TransactionCode).IsUnique();
            b.HasOne(x => x.Player)
             .WithMany(p => p.Payments)
             .HasForeignKey(x => x.PlayerId)
             .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.SessionCharge)
             .WithMany(c => c.PaymentTransactions)
             .HasForeignKey(x => x.SessionChargeId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // Expense
        modelBuilder.Entity<Expense>(b =>
        {
            b.ToTable("Expenses");
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(200).IsRequired();
            b.Property(x => x.Amount).HasColumnType("decimal(18,2)");
            b.Property(x => x.PaidBy).HasMaxLength(100).IsRequired();
            b.Property(x => x.VendorName).HasMaxLength(150);
            b.Property(x => x.ReceiptNote).HasMaxLength(400);
            b.HasIndex(x => x.ExpenseDate);
            b.HasOne(x => x.Session)
             .WithMany(s => s.Expenses)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // CourtAssignment
        modelBuilder.Entity<CourtAssignment>(b =>
        {
            b.ToTable("CourtAssignments");
            b.HasKey(x => x.Id);
            b.Property(x => x.TeamAPlayerNames).HasMaxLength(200).IsRequired();
            b.Property(x => x.TeamBPlayerNames).HasMaxLength(200).IsRequired();
            b.Property(x => x.Notes).HasMaxLength(300);
            b.HasOne(x => x.Session)
             .WithMany(s => s.CourtAssignments)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Court)
             .WithMany(c => c.CourtAssignments)
             .HasForeignKey(x => x.CourtId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // NotificationItem
        modelBuilder.Entity<NotificationItem>(b =>
        {
            b.ToTable("Notifications");
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(180).IsRequired();
            b.Property(x => x.Message).HasMaxLength(600).IsRequired();
            b.Property(x => x.Type).HasMaxLength(40);
            b.Property(x => x.TargetRole).HasMaxLength(40);
            b.Property(x => x.ActionUrl).HasMaxLength(200);
        });

        // ClubSetting
        modelBuilder.Entity<ClubSetting>(b =>
        {
            b.ToTable("ClubSettings");
            b.HasKey(x => x.Id);
            b.Property(x => x.ClubName).HasMaxLength(150).IsRequired();
            b.Property(x => x.ShortDescription).HasMaxLength(300);
            b.Property(x => x.ContactPhone).HasMaxLength(30);
            b.Property(x => x.ContactEmail).HasMaxLength(150);
            b.Property(x => x.DefaultBankName).HasMaxLength(80);
            b.Property(x => x.DefaultBankAccountNo).HasMaxLength(50);
            b.Property(x => x.DefaultBankAccountName).HasMaxLength(120);
            b.Property(x => x.DefaultShuttlecockPrice).HasColumnType("decimal(18,2)");
            b.Property(x => x.DefaultFixedFeePerSession).HasColumnType("decimal(18,2)");
            b.Property(x => x.DefaultGuestSurcharge).HasColumnType("decimal(18,2)");
            b.Property(x => x.LateCancellationPenalty).HasColumnType("decimal(18,2)");
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(b =>
        {
            b.ToTable("AuditLogs");
            b.HasKey(x => x.Id);
            b.Property(x => x.Action).HasMaxLength(80).IsRequired();
            b.Property(x => x.EntityName).HasMaxLength(80).IsRequired();
            b.Property(x => x.EntityId).HasMaxLength(50);
            b.Property(x => x.PerformedBy).HasMaxLength(80);
            b.Property(x => x.Summary).HasMaxLength(600);
            b.Property(x => x.IpAddress).HasMaxLength(50);
            b.HasIndex(x => x.CreatedAtUtc);
        });
    }
}
