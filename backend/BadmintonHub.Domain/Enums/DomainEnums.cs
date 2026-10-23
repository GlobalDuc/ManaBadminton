namespace BadmintonHub.Domain.Enums;

public enum UserRole
{
    Admin = 1,
    Treasurer = 2,
    Member = 3
}

public enum SkillLevel
{
    Beginner = 1,
    Intermediate = 2,
    Advanced = 3,
    Pro = 4
}

public enum MembershipType
{
    FixedMonthly = 1,
    Flexible = 2,
    Guest = 3
}

public enum SessionStatus
{
    Upcoming = 1,
    Ongoing = 2,
    Completed = 3,
    Cancelled = 4
}

public enum PricingSplitMode
{
    EqualSplit = 1,
    FixedPlusShuttlecock = 2,
    FixedRatePerPlayer = 3
}

public enum RegistrationStatus
{
    Registered = 1,
    Waitlisted = 2,
    Cancelled = 3
}

public enum AttendanceStatus
{
    Pending = 1,
    Present = 2,
    Late = 3,
    AbsentExcused = 4,
    AbsentUnexcused = 5
}

public enum ChargePaymentStatus
{
    Unpaid = 1,
    PartiallyPaid = 2,
    Paid = 3,
    Waived = 4
}

public enum PaymentMethod
{
    Cash = 1,
    BankTransfer = 2,
    VietQR = 3,
    EWallet = 4
}

public enum PaymentTransactionStatus
{
    PendingConfirmation = 1,
    Confirmed = 2,
    Rejected = 3
}

public enum ExpenseCategory
{
    CourtRental = 1,
    Shuttlecock = 2,
    WaterAndRefreshment = 3,
    TournamentAndEvent = 4,
    Equipment = 5,
    Other = 6
}

public enum MatchStatus
{
    Scheduled = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4
}
