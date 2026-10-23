import {
  AttendanceStatus,
  ChargePaymentStatus,
  ExpenseCategory,
  MatchStatus,
  MembershipType,
  PaymentMethod,
  PricingSplitMode,
  SessionStatus,
  SkillLevel,
} from '../types';
import { VI_VN } from './vi-VN';

const WEEKDAYS_VI = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

/**
 * Định dạng tiền tệ chuẩn Việt Nam: "75.000 đ", "1.250.000 đ"
 */
export function formatVnd(amount: number | undefined | null): string {
  const num = Math.round(Number(amount || 0));
  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(num);
  return `${formatted} đ`;
}

/**
 * Định dạng tiền tệ rút gọn bằng 'k' cho nghìn đồng khi phù hợp: "75k", "1.250k"
 */
export function formatShortVnd(amount: number | undefined | null): string {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return '0 đ';
  if (Math.abs(num) >= 1000 && num % 1000 === 0) {
    const kVal = num / 1000;
    return `${new Intl.NumberFormat('vi-VN').format(kVal)}k`;
  }
  return formatVnd(num);
}

/**
 * Định dạng số thập phân sử dụng dấu phẩy theo quy ước Việt Nam
 */
export function formatDecimalVi(value: number | undefined | null, decimals = 1): string {
  const num = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Định dạng ngày dd/MM/yyyy theo múi giờ Asia/Ho_Chi_Minh
 */
export function formatDateVi(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(d);
}

/**
 * Định dạng Thứ + ngày dd/MM/yyyy: "Thứ Ba, 22/10/2026"
 */
export function formatWeekdayDateVi(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekday = WEEKDAYS_VI[d.getDay()] || '';
  return `${weekday}, ${formatDateVi(dateStr)}`;
}

/**
 * Định dạng ngày giờ 24h: "22/10/2026 20:00"
 */
export function formatDateTimeVi(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(d);
}

/**
 * Định dạng khung giờ 24h chuẩn: "20:00 – 22:00"
 */
export function formatTimeRangeVi(startTime?: string, endTime?: string): string {
  const s = (startTime || '19:00').slice(0, 5);
  const e = (endTime || '21:30').slice(0, 5);
  return `${s} – ${e}`;
}

export function getRoleLabelVi(role?: string | null): string {
  switch (role) {
    case 'Admin':
      return VI_VN.roles.Admin;
    case 'Treasurer':
      return VI_VN.roles.Treasurer;
    case 'Member':
      return VI_VN.roles.Member;
    default:
      return VI_VN.roles.Admin;
  }
}

export function getSkillLevelLabel(level: SkillLevel): string {
  switch (level) {
    case SkillLevel.Beginner:
      return 'Mới chơi (Cơ bản)';
    case SkillLevel.Intermediate:
      return 'Trung bình - Khá';
    case SkillLevel.Advanced:
      return 'Khá - Giỏi';
    case SkillLevel.Pro:
      return 'Nâng cao / Phong trào A';
    default:
      return 'Trung bình';
  }
}

export function getMembershipTypeLabel(type: MembershipType): string {
  switch (type) {
    case MembershipType.FixedMonthly:
      return 'Cố định theo tháng';
    case MembershipType.Flexible:
      return 'Linh hoạt theo buổi';
    case MembershipType.Guest:
      return 'Vãng lai theo buổi';
    default:
      return 'Linh hoạt theo buổi';
  }
}

export function getSessionStatusMeta(status: SessionStatus): { label: string; badgeClass: string } {
  switch (status) {
    case SessionStatus.Upcoming:
      return { label: VI_VN.statuses.upcoming, badgeClass: 'bh-badge-blue' };
    case SessionStatus.Ongoing:
      return { label: VI_VN.statuses.ongoing, badgeClass: 'bh-badge-navy' };
    case SessionStatus.Completed:
      return { label: VI_VN.statuses.completed, badgeClass: 'bh-badge-success' };
    case SessionStatus.Cancelled:
      return { label: VI_VN.statuses.cancelled, badgeClass: 'bh-badge-danger' };
    default:
      return { label: VI_VN.statuses.upcoming, badgeClass: 'bh-badge-blue' };
  }
}

export function getPricingModeLabel(mode: PricingSplitMode): string {
  switch (mode) {
    case PricingSplitMode.EqualSplit:
      return 'Chia đều tiền sân + tiền cầu';
    case PricingSplitMode.FixedPlusShuttlecock:
      return 'Tiền sân cố định + Chia tiền cầu';
    case PricingSplitMode.FixedRatePerPlayer:
      return 'Thu trọn gói cố định / người chơi';
    default:
      return 'Tiền sân cố định + Chia tiền cầu';
  }
}

export function getAttendanceStatusMeta(status: AttendanceStatus): { label: string; badgeClass: string } {
  switch (status) {
    case AttendanceStatus.Present:
      return { label: VI_VN.statuses.present, badgeClass: 'bh-badge-success' };
    case AttendanceStatus.Late:
      return { label: VI_VN.statuses.late, badgeClass: 'bh-badge-warning' };
    case AttendanceStatus.AbsentExcused:
      return { label: VI_VN.statuses.absentExcused, badgeClass: 'bh-badge-muted' };
    case AttendanceStatus.AbsentUnexcused:
      return { label: VI_VN.statuses.absentUnexcused, badgeClass: 'bh-badge-danger' };
    default:
      return { label: VI_VN.statuses.pendingAttendance, badgeClass: 'bh-badge-blue' };
  }
}

export function getChargeStatusMeta(status: ChargePaymentStatus): { label: string; badgeClass: string } {
  switch (status) {
    case ChargePaymentStatus.Paid:
      return { label: VI_VN.statuses.paid, badgeClass: 'bh-badge-success' };
    case ChargePaymentStatus.PartiallyPaid:
      return { label: VI_VN.statuses.partiallyPaid, badgeClass: 'bh-badge-warning' };
    case ChargePaymentStatus.Waived:
      return { label: VI_VN.statuses.waived, badgeClass: 'bh-badge-muted' };
    default:
      return { label: VI_VN.statuses.unpaid, badgeClass: 'bh-badge-danger' };
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.Cash:
      return 'Tiền mặt tại sân';
    case PaymentMethod.BankTransfer:
      return 'Chuyển khoản ngân hàng';
    case PaymentMethod.VietQR:
      return 'Quét mã QR ngân hàng';
    case PaymentMethod.EWallet:
      return 'Ví điện tử';
    default:
      return 'Quét mã QR ngân hàng';
  }
}

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  switch (category) {
    case ExpenseCategory.CourtRental:
      return 'Tiền thuê sân';
    case ExpenseCategory.Shuttlecock:
      return 'Tiền cầu';
    case ExpenseCategory.WaterAndRefreshment:
      return 'Nước uống & Giải khát';
    case ExpenseCategory.TournamentAndEvent:
      return 'Giao lưu & Giải đấu';
    case ExpenseCategory.Equipment:
      return 'Lưới cầu & Dụng cụ';
    default:
      return 'Chi phí khác';
  }
}

export function getExpenseAllocationType(receiptNote?: string | null): {
  typeLabel: string;
  isShared: boolean;
} {
  if (receiptNote && receiptNote.includes('[Cá nhân]')) {
    return { typeLabel: VI_VN.terms.personalExpenses, isShared: false };
  }
  return { typeLabel: VI_VN.terms.sharedExpenses, isShared: true };
}

export function getMatchStatusMeta(status: MatchStatus): { label: string; badgeClass: string } {
  switch (status) {
    case MatchStatus.InProgress:
      return { label: 'Đang đánh trên sân', badgeClass: 'bh-badge-blue' };
    case MatchStatus.Completed:
      return { label: 'Đã kết thúc trận', badgeClass: 'bh-badge-success' };
    case MatchStatus.Cancelled:
      return { label: 'Đã hủy trận', badgeClass: 'bh-badge-danger' };
    default:
      return { label: 'Đang chờ vào sân', badgeClass: 'bh-badge-warning' };
  }
}
