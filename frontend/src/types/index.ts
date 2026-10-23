export enum SkillLevel {
  Beginner = 1,
  Intermediate = 2,
  Advanced = 3,
  Pro = 4,
}

export enum MembershipType {
  FixedMonthly = 1,
  Flexible = 2,
  Guest = 3,
}

export enum SessionStatus {
  Upcoming = 1,
  Ongoing = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum PricingSplitMode {
  EqualSplit = 1,
  FixedPlusShuttlecock = 2,
  FixedRatePerPlayer = 3,
}

export enum RegistrationStatus {
  Registered = 1,
  Waitlisted = 2,
  Cancelled = 3,
}

export enum AttendanceStatus {
  Pending = 1,
  Present = 2,
  Late = 3,
  AbsentExcused = 4,
  AbsentUnexcused = 5,
}

export enum ChargePaymentStatus {
  Unpaid = 1,
  PartiallyPaid = 2,
  Paid = 3,
  Waived = 4,
}

export enum PaymentMethod {
  Cash = 1,
  BankTransfer = 2,
  VietQR = 3,
  EWallet = 4,
}

export enum PaymentTransactionStatus {
  PendingConfirmation = 1,
  Confirmed = 2,
  Rejected = 3,
}

export enum ExpenseCategory {
  CourtRental = 1,
  Shuttlecock = 2,
  WaterAndRefreshment = 3,
  TournamentAndEvent = 4,
  Equipment = 5,
  Other = 6,
}

export enum MatchStatus {
  Scheduled = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  linkedPlayerId?: number | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  contactPhone: string;
  defaultHourlyRate: number;
  isActive: boolean;
  notes?: string;
  courtsCount: number;
}

export interface Court {
  id: number;
  venueId: number;
  venueName: string;
  courtName: string;
  courtCode: string;
  surfaceType: string;
  hourlyRate: number;
  isActive: boolean;
}

export interface Player {
  id: number;
  memberCode: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  gender: string;
  skillLevel: SkillLevel;
  membershipType: MembershipType;
  balance: number;
  isActive: boolean;
  joinedDate: string;
  notes?: string;
  totalAttendedSessions: number;
  unpaidAmount: number;
}

export interface Session {
  id: number;
  title: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  venueId: number;
  venueName: string;
  courtsBookedText: string;
  maxPlayers: number;
  registeredCount: number;
  attendedCount: number;
  status: SessionStatus;
  pricingMode: PricingSplitMode;
  courtFeeTotal: number;
  shuttlecockCountUsed: number;
  shuttlecockUnitPrice: number;
  otherFeeTotal: number;
  fixedFeePerPlayer: number;
  guestSurcharge: number;
  totalSessionCost: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
  notes?: string;
}

export interface SessionRegistration {
  id: number;
  sessionId: number;
  playerId: number;
  memberCode: string;
  playerName: string;
  phoneNumber: string;
  skillLevel: SkillLevel;
  isGuest: boolean;
  guestsBroughtCount: number;
  status: RegistrationStatus;
  registeredAtUtc: string;
  note?: string;
}

export interface AttendanceItem {
  id: number;
  sessionId: number;
  sessionTitle: string;
  sessionDate: string;
  playerId: number;
  memberCode: string;
  playerName: string;
  skillLevel: SkillLevel;
  membershipType: MembershipType;
  status: AttendanceStatus;
  checkInTimeUtc?: string;
  isGuest: boolean;
  extraGuestsCount: number;
  matchesPlayedCount: number;
  note?: string;
  estimatedOrActualCharge: number;
  chargeStatus: ChargePaymentStatus;
}

export interface SessionCharge {
  id: number;
  sessionId: number;
  sessionTitle: string;
  sessionDate: string;
  playerId: number;
  memberCode: string;
  playerName: string;
  phoneNumber: string;
  baseCourtShare: number;
  shuttlecockShare: number;
  guestFee: number;
  penaltyOrDiscount: number;
  totalDue: number;
  amountPaid: number;
  remainingAmount: number;
  paymentStatus: ChargePaymentStatus;
  note?: string;
}

export interface PaymentTransaction {
  id: number;
  transactionCode: string;
  playerId: number;
  memberCode: string;
  playerName: string;
  sessionChargeId?: number;
  sessionTitle?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentTransactionStatus;
  paidAtUtc: string;
  referenceCode?: string;
  confirmedByUsername?: string;
  note?: string;
}

export interface Expense {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  sessionId?: number;
  sessionTitle?: string;
  paidBy: string;
  vendorName?: string;
  receiptNote?: string;
}

export interface CourtAssignment {
  id: number;
  sessionId: number;
  sessionTitle: string;
  courtId: number;
  courtName: string;
  matchOrder: number;
  teamAPlayerNames: string;
  teamBPlayerNames: string;
  teamAScore: number;
  teamBScore: number;
  status: MatchStatus;
  startTimeUtc?: string;
  endTimeUtc?: string;
  notes?: string;
}

export interface MonthlyFinancialPoint {
  monthLabel: string;
  revenue: number;
  expense: number;
  netBalance: number;
  sessionsCount: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface DashboardSummary {
  totalActivePlayers: number;
  upcomingSessionsCount: number;
  completedSessionsThisMonth: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  clubFundBalance: number;
  totalOutstandingDebt: number;
  unpaidChargesCount: number;
  upcomingSessions: Session[];
  topPendingDebts: SessionCharge[];
  monthlyTrends: MonthlyFinancialPoint[];
  expenseBreakdown: CategoryBreakdown[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAtUtc: string;
  actionUrl?: string;
}

export interface ClubSetting {
  id: number;
  clubName: string;
  shortDescription: string;
  contactPhone: string;
  contactEmail: string;
  defaultBankName: string;
  defaultBankAccountNo: string;
  defaultBankAccountName: string;
  defaultShuttlecockPrice: number;
  defaultFixedFeePerSession: number;
  defaultGuestSurcharge: number;
  cancellationDeadlineHours: number;
  lateCancellationPenalty: number;
  autoGenerateChargesOnAttendance: boolean;
}

export interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId: string;
  performedBy: string;
  summary: string;
  createdAtUtc: string;
}
