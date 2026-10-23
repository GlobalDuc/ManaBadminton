import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  CheckCircle2,
  CreditCard,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import {
  ChargePaymentStatus,
  PaymentMethod,
  type SessionCharge,
} from '../../types';
import {
  formatDateTimeVi,
  formatDateVi,
  formatShortVnd,
  formatVnd,
  getPaymentMethodLabel,
} from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';
import { ChargeStatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';

export const PaymentsPage: React.FC = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  const [sessionFilter, setSessionFilter] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedCharge, setSelectedCharge] = useState<SessionCharge | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.VietQR);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [refCode, setRefCode] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-list'],
    queryFn: () => badmintonApi.getSessions({ page: 1, pageSize: 30 }),
  });

  const { data: charges = [], isLoading: loadingCharges } = useQuery({
    queryKey: ['charges', sessionFilter, statusFilter],
    queryFn: () =>
      badmintonApi.getSessionCharges({
        sessionId: sessionFilter > 0 ? sessionFilter : undefined,
        status: statusFilter ? (Number(statusFilter) as ChargePaymentStatus) : undefined,
      }),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['payment-transactions'],
    queryFn: () => badmintonApi.getPaymentTransactions({ page: 1, pageSize: 25 }),
  });

  const { data: settings } = useQuery({
    queryKey: ['club-settings'],
    queryFn: badmintonApi.getSettings,
  });

  const calcMutation = useMutation({
    mutationFn: (sessionId: number) =>
      badmintonApi.calculateSessionCharges({ sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      setFeedback({ type: 'success', text: 'Đã tính lại bảng thu tiền sân và tiền cầu cho buổi cầu.' });
    },
    onError: (err) => setFeedback({ type: 'danger', text: extractErrorMessage(err) }),
  });

  const payMutation = useMutation({
    mutationFn: () => {
      if (!selectedCharge) throw new Error('Vui lòng chọn khoản thu cần xác nhận.');
      if (!payAmount || payAmount <= 0) throw new Error(VI_VN.messages.invalidAmount);
      return badmintonApi.createPaymentTransaction({
        playerId: selectedCharge.playerId,
        sessionChargeId: selectedCharge.id,
        amount: payAmount,
        paymentMethod: payMethod,
        referenceCode: refCode || undefined,
        note: payNote || `Thu tiền buổi cầu: ${selectedCharge.sessionTitle}`,
      });
    },
    onSuccess: (tx) => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setSelectedCharge(null);
      setFeedback({
        type: 'success',
        text: VI_VN.messages.paymentRecorded(formatVnd(tx.amount)),
      });
    },
    onError: (err) => setFeedback({ type: 'danger', text: extractErrorMessage(err) }),
  });

  const openPaymentModal = (c: SessionCharge) => {
    setSelectedCharge(c);
    setPayAmount(c.remainingAmount);
    setPayMethod(PaymentMethod.VietQR);
    setRefCode(`THU-${c.memberCode}-${Date.now().toString().slice(-4)}`);
    setPayNote(`Thu tiền buổi cầu ${c.sessionTitle}`);
  };

  const totalDueSum = charges.reduce((acc, c) => acc + c.totalDue, 0);
  const totalPaidSum = charges.reduce((acc, c) => acc + c.amountPaid, 0);
  const totalRemainingSum = charges.reduce((acc, c) => acc + c.remainingAmount, 0);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Thu tiền Buổi cầu & Đối soát Thanh toán</h4>
          <div className="small text-muted">
            Quản lý Tiền sân, Tiền cầu của từng người chơi, theo dõi Tiền thu thực tế và khoản Còn phải thu.
          </div>
        </div>
        {canManage && sessionFilter > 0 && (
          <button
            type="button"
            onClick={() => calcMutation.mutate(sessionFilter)}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <Calculator size={17} />
            <span>Tính lại tiền buổi cầu đang chọn</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} d-flex justify-content-between align-items-center py-2 mb-0`}>
          <span>{feedback.text}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} aria-label="Đóng" />
        </div>
      )}

      {/* 3 Thẻ đối soát: Tổng dự kiến - Tiền thu thực tế - Còn phải thu */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="bh-card p-3">
            <div className="small text-muted fw-semibold">DOANH THU DỰ KIẾN (TỔNG PHẢI THU)</div>
            <div className="fs-4 fw-bold" style={{ color: 'var(--color-primary)' }}>
              {formatVnd(totalDueSum)}{' '}
              <span className="fs-6 text-muted fw-normal">({formatShortVnd(totalDueSum)})</span>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="bh-card p-3">
            <div className="small text-muted fw-semibold">TIỀN THU THỰC TẾ (ĐÃ NHẬN)</div>
            <div className="fs-4 fw-bold text-success">
              {formatVnd(totalPaidSum)}{' '}
              <span className="fs-6 text-muted fw-normal">({formatShortVnd(totalPaidSum)})</span>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="bh-card p-3">
            <div className="small text-muted fw-semibold">CÒN PHẢI THU (CHƯA QUYẾT TOÁN)</div>
            <div className="fs-4 fw-bold" style={{ color: 'var(--color-danger)' }}>
              {formatVnd(totalRemainingSum)}{' '}
              <span className="fs-6 text-muted fw-normal">({formatShortVnd(totalRemainingSum)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc Buổi cầu & Trạng thái */}
      <div className="bh-card p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-7">
            <select
              className="form-select"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(Number(e.target.value))}
            >
              <option value={0}>-- Lọc theo tất cả buổi cầu --</option>
              {sessionsData?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  [{formatDateVi(s.sessionDate)}] {s.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-5">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">-- Lọc theo tất cả trạng thái thanh toán --</option>
              <option value={ChargePaymentStatus.Unpaid}>{VI_VN.statuses.unpaid}</option>
              <option value={ChargePaymentStatus.PartiallyPaid}>{VI_VN.statuses.partiallyPaid}</option>
              <option value={ChargePaymentStatus.Paid}>{VI_VN.statuses.paid}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết Tiền sân, Tiền cầu của từng người chơi */}
      <div className="bh-card overflow-hidden">
        <div className="p-3 px-4 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">Bảng chi tiết thu tiền theo người chơi ({charges.length} khoản)</h6>
        </div>
        <div className="table-responsive">
          <table className="table bh-table">
            <thead>
              <tr>
                <th>Người chơi</th>
                <th>Buổi cầu</th>
                <th>Tiền sân</th>
                <th>Tiền cầu</th>
                <th>Phụ thu khách</th>
                <th>Tổng phải thu</th>
                <th>Tiền thu</th>
                <th>Còn phải thu</th>
                <th>Trạng thái</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingCharges ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">
                    {VI_VN.actions.loading}
                  </td>
                </tr>
              ) : charges.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-muted">
                    {VI_VN.messages.noMatchingData}
                  </td>
                </tr>
              ) : (
                charges.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="fw-bold">{c.playerName}</div>
                      <div className="small text-muted">Mã: {c.memberCode}</div>
                    </td>
                    <td>
                      <div className="fw-semibold small">{c.sessionTitle}</div>
                      <div className="small text-muted">{formatDateVi(c.sessionDate)}</div>
                    </td>
                    <td>{formatShortVnd(c.baseCourtShare)}</td>
                    <td>{formatShortVnd(c.shuttlecockShare)}</td>
                    <td>{formatShortVnd(c.guestFee)}</td>
                    <td className="fw-bold" style={{ color: 'var(--color-primary)' }}>
                      {formatVnd(c.totalDue)}
                    </td>
                    <td className="fw-semibold text-success">{formatVnd(c.amountPaid)}</td>
                    <td
                      className="fw-bold"
                      style={{
                        color: c.remainingAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                      }}
                    >
                      {formatVnd(c.remainingAmount)}
                      {c.remainingAmount > 0 && (
                        <div className="small fw-normal text-danger">
                          {VI_VN.messages.playerUnpaidWarning}
                        </div>
                      )}
                    </td>
                    <td>
                      <ChargeStatusBadge status={c.paymentStatus} />
                    </td>
                    <td className="text-end">
                      {c.remainingAmount > 0 && canManage ? (
                        <button
                          type="button"
                          onClick={() => openPaymentModal(c)}
                          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <QrCode size={14} />
                          <span>Thu tiền</span>
                        </button>
                      ) : (
                        <span className="small text-success fw-semibold d-inline-flex align-items-center gap-1">
                          <CheckCircle2 size={14} />
                          <span>{VI_VN.terms.settled}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sổ nhật ký Tiền thu thực tế */}
      <div className="bh-card overflow-hidden">
        <div className="p-3 px-4 border-bottom">
          <h6 className="fw-bold mb-0">Lịch sử Tiền thu đã xác nhận</h6>
        </div>
        <div className="table-responsive">
          <table className="table bh-table">
            <thead>
              <tr>
                <th>Mã phiếu thu</th>
                <th>Người chơi</th>
                <th>Số tiền thu</th>
                <th>Hình thức thanh toán</th>
                <th>Mã đối chiếu</th>
                <th>Thời gian thu</th>
                <th>Người xác nhận</th>
              </tr>
            </thead>
            <tbody>
              {transactionsData?.items.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <span className="bh-badge bh-badge-blue">{tx.transactionCode}</span>
                  </td>
                  <td>
                    <div className="fw-semibold">{tx.playerName}</div>
                    <div className="small text-muted">{tx.sessionTitle || 'Đóng quỹ CLB'}</div>
                  </td>
                  <td className="fw-bold text-success">
                    +{formatVnd(tx.amount)} ({formatShortVnd(tx.amount)})
                  </td>
                  <td>{getPaymentMethodLabel(tx.paymentMethod)}</td>
                  <td>
                    <code>{tx.referenceCode || '—'}</code>
                  </td>
                  <td className="small">{formatDateTimeVi(tx.paidAtUtc)}</td>
                  <td className="small fw-semibold">{tx.confirmedByUsername || 'Thủ quỹ'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hộp thoại Xác nhận Thu tiền */}
      {selectedCharge && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                <CreditCard size={20} />
                <span>Xác nhận Thu tiền buổi cầu</span>
              </h5>
              <button type="button" className="btn btn-sm" onClick={() => setSelectedCharge(null)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="bh-info-panel mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="small text-muted">Người chơi thanh toán</div>
                  <div className="fw-bold fs-6">
                    {selectedCharge.playerName} ({selectedCharge.memberCode})
                  </div>
                  <div className="small text-muted">{selectedCharge.sessionTitle}</div>
                </div>
                <div className="text-end">
                  <div className="small text-muted">Số tiền còn phải thu</div>
                  <div className="fs-4 fw-bold" style={{ color: 'var(--color-primary)' }}>
                    {formatVnd(selectedCharge.remainingAmount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Hình thức thanh toán <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(Number(e.target.value) as PaymentMethod)}
                >
                  <option value={PaymentMethod.VietQR}>Quét mã QR ngân hàng</option>
                  <option value={PaymentMethod.BankTransfer}>Chuyển khoản ngân hàng</option>
                  <option value={PaymentMethod.Cash}>Tiền mặt tại sân</option>
                  <option value={PaymentMethod.EWallet}>Ví điện tử</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Số tiền thực thu (VNĐ) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step={1000}
                  className="form-control fw-bold"
                  placeholder="Nhập số tiền, ví dụ: 75000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Mã đối chiếu giao dịch</label>
                <input
                  type="text"
                  className="form-control"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Ghi chú khoản thu</label>
                <input
                  type="text"
                  className="form-control"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>

              {settings && (
                <div className="col-12">
                  <div className="p-3 rounded border" style={{ backgroundColor: 'var(--color-background)' }}>
                    <div className="small fw-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                      THÔNG TIN TÀI KHOẢN NHẬN TIỀN CỦA SÂN / CLB
                    </div>
                    <div className="small">
                      Ngân hàng: <strong>{settings.defaultBankName}</strong> • Số tài khoản:{' '}
                      <strong>{settings.defaultBankAccountNo}</strong> • Chủ tài khoản:{' '}
                      <strong>{settings.defaultBankAccountName}</strong>
                    </div>
                    <div className="small text-muted">
                      Nội dung chuyển khoản gợi ý: <code>{selectedCharge.memberCode} DONG TIEN CAU LONG</code>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setSelectedCharge(null)}
              >
                {VI_VN.actions.cancel}
              </button>
              <button
                type="button"
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate()}
                className="btn btn-primary d-inline-flex align-items-center gap-2"
              >
                <ShieldCheck size={17} />
                <span>{payMutation.isPending ? VI_VN.actions.loading : 'Xác nhận đã thu tiền'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
