import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  AttendanceStatus,
  ChargePaymentStatus,
  MatchStatus,
  SessionStatus,
} from '../types';
import {
  getAttendanceStatusMeta,
  getChargeStatusMeta,
  getMatchStatusMeta,
  getSessionStatusMeta,
} from '../utils/formatters';

export const SessionStatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const meta = getSessionStatusMeta(status);
  const Icon =
    status === SessionStatus.Completed
      ? CheckCircle2
      : status === SessionStatus.Cancelled
      ? XCircle
      : Clock;

  return (
    <span className={`bh-badge ${meta.badgeClass}`}>
      <Icon size={14} />
      <span>{meta.label}</span>
    </span>
  );
};

export const AttendanceStatusBadge: React.FC<{ status: AttendanceStatus }> = ({ status }) => {
  const meta = getAttendanceStatusMeta(status);
  const Icon =
    status === AttendanceStatus.Present
      ? CheckCircle2
      : status === AttendanceStatus.Late
      ? Clock
      : status === AttendanceStatus.AbsentUnexcused
      ? AlertCircle
      : HelpCircle;

  return (
    <span className={`bh-badge ${meta.badgeClass}`}>
      <Icon size={14} />
      <span>{meta.label}</span>
    </span>
  );
};

export const ChargeStatusBadge: React.FC<{ status: ChargePaymentStatus }> = ({ status }) => {
  const meta = getChargeStatusMeta(status);
  const Icon =
    status === ChargePaymentStatus.Paid
      ? ShieldCheck
      : status === ChargePaymentStatus.PartiallyPaid
      ? Clock
      : status === ChargePaymentStatus.Waived
      ? CheckCircle2
      : AlertCircle;

  return (
    <span className={`bh-badge ${meta.badgeClass}`}>
      <Icon size={14} />
      <span>{meta.label}</span>
    </span>
  );
};

export const MatchStatusBadge: React.FC<{ status: MatchStatus }> = ({ status }) => {
  const meta = getMatchStatusMeta(status);
  const Icon =
    status === MatchStatus.Completed
      ? CheckCircle2
      : status === MatchStatus.InProgress
      ? Clock
      : AlertCircle;

  return (
    <span className={`bh-badge ${meta.badgeClass}`}>
      <Icon size={14} />
      <span>{meta.label}</span>
    </span>
  );
};
