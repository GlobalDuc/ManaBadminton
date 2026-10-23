import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarPlus,
  CheckCircle2,
  MapPin,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import { PricingSplitMode, SessionStatus, type Session } from '../../types';
import {
  formatShortVnd,
  formatTimeRangeVi,
  formatVnd,
  formatWeekdayDateVi,
  getPricingModeLabel,
  getSkillLevelLabel,
} from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';
import { SessionStatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';

const sessionSchema = z.object({
  title: z.string().min(3, 'Vui lòng nhập tên buổi cầu tối thiểu 3 ký tự.'),
  sessionDate: z.string().min(1, 'Vui lòng chọn ngày diễn ra buổi cầu.'),
  startTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu.'),
  endTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc.'),
  venueId: z.coerce.number().min(1, 'Vui lòng chọn cụm sân cầu lông.'),
  courtsBookedText: z.string().min(1, 'Vui lòng nhập tên các sân sử dụng.'),
  maxPlayers: z.coerce.number().min(2, 'Số người chơi tối thiểu là 2.').max(64, 'Số người chơi tối đa là 64.'),
  status: z.coerce.number(),
  pricingMode: z.coerce.number(),
  courtFeeTotal: z.coerce.number().min(0, VI_VN.messages.invalidAmount),
  shuttlecockCountUsed: z.coerce.number().min(0, 'Số quả cầu không hợp lệ.'),
  shuttlecockUnitPrice: z.coerce.number().min(0, VI_VN.messages.invalidAmount),
  otherFeeTotal: z.coerce.number().min(0, VI_VN.messages.invalidAmount),
  fixedFeePerPlayer: z.coerce.number().min(0, VI_VN.messages.invalidAmount),
  guestSurcharge: z.coerce.number().min(0, VI_VN.messages.invalidAmount),
  notes: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export const SessionsPage: React.FC = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [confirmCancelPlayer, setConfirmCancelPlayer] = useState<{ id: number; name: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [regPlayerId, setRegPlayerId] = useState<number>(0);
  const [regGuestsCount, setRegGuestsCount] = useState<number>(0);
  const [regNote, setRegNote] = useState<string>('');

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions', statusFilter],
    queryFn: () =>
      badmintonApi.getSessions({
        status: statusFilter ? (Number(statusFilter) as SessionStatus) : undefined,
        page: 1,
        pageSize: 30,
      }),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: badmintonApi.getVenues,
  });

  const { data: playersData } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => badmintonApi.getPlayers({ onlyActive: true, page: 1, pageSize: 100 }),
  });

  const activeSession = selectedSession || sessionsData?.items?.[0] || null;

  const { data: registrations = [] } = useQuery({
    queryKey: ['session-registrations', activeSession?.id],
    queryFn: () => badmintonApi.getSessionRegistrations(activeSession!.id),
    enabled: Boolean(activeSession?.id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: 'Buổi cầu tối Thứ Năm - Sân Viettel',
      sessionDate: new Date().toISOString().slice(0, 10),
      startTime: '20:00',
      endTime: '22:00',
      venueId: 1,
      courtsBookedText: 'Sân 01, Sân 02',
      maxPlayers: 16,
      status: SessionStatus.Upcoming,
      pricingMode: PricingSplitMode.FixedPlusShuttlecock,
      courtFeeTotal: 700000,
      shuttlecockCountUsed: 12,
      shuttlecockUnitPrice: 25000,
      otherFeeTotal: 50000,
      fixedFeePerPlayer: 55000,
      guestSurcharge: 15000,
      notes: '',
    },
  });

  const saveSessionMutation = useMutation({
    mutationFn: async (values: SessionFormValues) => {
      if (editingSession) {
        return badmintonApi.updateSession(editingSession.id, values);
      }
      return badmintonApi.createSession(values);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSelectedSession(saved);
      setShowFormModal(false);
      setFeedback({ type: 'success', text: VI_VN.messages.sessionSaved });
    },
    onError: (err) => {
      setFeedback({ type: 'danger', text: extractErrorMessage(err) });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession || !regPlayerId) throw new Error('Vui lòng chọn người chơi cần đăng ký.');
      return badmintonApi.registerSessionPlayer(activeSession.id, {
        playerId: regPlayerId,
        isGuest: false,
        guestsBroughtCount: regGuestsCount,
        note: regNote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-registrations', activeSession?.id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setRegNote('');
      setRegGuestsCount(0);
      setFeedback({ type: 'success', text: 'Đã đăng ký người chơi tham gia buổi cầu thành công.' });
    },
    onError: (err) => {
      setFeedback({ type: 'danger', text: extractErrorMessage(err) });
    },
  });

  const cancelRegMutation = useMutation({
    mutationFn: async (playerId: number) => {
      if (!activeSession) return;
      await badmintonApi.cancelRegistration(activeSession.id, playerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-registrations', activeSession?.id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setConfirmCancelPlayer(null);
      setFeedback({ type: 'success', text: 'Đã hủy đăng ký tham gia buổi cầu.' });
    },
  });

  const openCreateModal = () => {
    setEditingSession(null);
    reset({
      title: 'Buổi cầu giao lưu CLB Blue Smash',
      sessionDate: new Date().toISOString().slice(0, 10),
      startTime: '20:00',
      endTime: '22:00',
      venueId: venues[0]?.id || 1,
      courtsBookedText: 'Sân 01, Sân 02',
      maxPlayers: 16,
      status: SessionStatus.Upcoming,
      pricingMode: PricingSplitMode.FixedPlusShuttlecock,
      courtFeeTotal: 700000,
      shuttlecockCountUsed: 12,
      shuttlecockUnitPrice: 25000,
      otherFeeTotal: 50000,
      fixedFeePerPlayer: 55000,
      guestSurcharge: 15000,
      notes: '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (s: Session) => {
    setEditingSession(s);
    reset({
      title: s.title,
      sessionDate: s.sessionDate.slice(0, 10),
      startTime: s.startTime,
      endTime: s.endTime,
      venueId: s.venueId,
      courtsBookedText: s.courtsBookedText,
      maxPlayers: s.maxPlayers,
      status: s.status,
      pricingMode: s.pricingMode,
      courtFeeTotal: s.courtFeeTotal,
      shuttlecockCountUsed: s.shuttlecockCountUsed,
      shuttlecockUnitPrice: s.shuttlecockUnitPrice,
      otherFeeTotal: s.otherFeeTotal,
      fixedFeePerPlayer: s.fixedFeePerPlayer,
      guestSurcharge: s.guestSurcharge,
      notes: s.notes || '',
    });
    setShowFormModal(true);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Buổi cầu & Lịch đánh cầu</h4>
          <div className="small text-muted">
            Tạo lịch đánh cầu, thiết lập Tiền sân, Tiền cầu, theo dõi Lãi/lỗ buổi cầu và Đăng ký tham gia.
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <CalendarPlus size={18} />
            <span>Thêm buổi cầu</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} d-flex justify-content-between align-items-center py-2 mb-0`}>
          <span>{feedback.text}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} aria-label="Đóng" />
        </div>
      )}

      {/* Bộ lọc trạng thái buổi cầu */}
      <div className="bh-card p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex flex-wrap gap-2">
          {[
            { value: '', label: 'Tất cả buổi cầu' },
            { value: String(SessionStatus.Ongoing), label: VI_VN.statuses.ongoing },
            { value: String(SessionStatus.Upcoming), label: VI_VN.statuses.upcoming },
            { value: String(SessionStatus.Completed), label: VI_VN.statuses.completed },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`btn btn-sm ${
                statusFilter === tab.value ? 'btn-primary' : 'btn-soft-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="small text-muted">
          Tổng số: <strong>{sessionsData?.totalCount || 0}</strong> buổi cầu
        </div>
      </div>

      <div className="row g-4">
        {/* Danh sách các buổi cầu */}
        <div className="col-12 col-xl-7">
          <div className="d-flex flex-column gap-3">
            {isLoading ? (
              <div className="bh-card p-4 text-center">{VI_VN.actions.loading}</div>
            ) : (
              sessionsData?.items.map((s) => {
                const isSelected = activeSession?.id === s.id;
                const shuttleCost = s.shuttlecockCountUsed * s.shuttlecockUnitPrice;
                const sessionProfitLoss = s.totalCollectedAmount - s.totalSessionCost;
                const receivable = Math.max(0, s.totalBilledAmount - s.totalCollectedAmount);

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    style={{ cursor: 'pointer' }}
                    className={`bh-card p-3 p-md-4 ${isSelected ? 'bh-card-selected' : ''}`}
                  >
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <h6 className="fw-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                          {s.title}
                        </h6>
                        <div className="small text-muted d-flex align-items-center gap-1">
                          <MapPin size={14} />
                          <span>
                            {s.venueName} • <strong>{s.courtsBookedText}</strong>
                          </span>
                        </div>
                      </div>
                      <SessionStatusBadge status={s.status} />
                    </div>

                    <div className="row g-2 mt-2 pt-2 border-top small">
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Thứ, Ngày & Khung giờ</div>
                        <div className="fw-semibold">{formatWeekdayDateVi(s.sessionDate)}</div>
                        <div className="text-muted">{formatTimeRangeVi(s.startTime, s.endTime)}</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Chi phí buổi cầu</div>
                        <div>
                          Tiền sân: <strong>{formatShortVnd(s.courtFeeTotal)}</strong> • Tiền cầu ({s.shuttlecockCountUsed} quả):{' '}
                          <strong>{formatShortVnd(shuttleCost)}</strong>
                        </div>
                        <div className="fw-bold" style={{ color: 'var(--color-primary)' }}>
                          Tổng chi: {formatVnd(s.totalSessionCost)}
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="text-muted">Đối soát buổi cầu</div>
                        <div>
                          Tiền thu: <strong className="text-success">{formatShortVnd(s.totalCollectedAmount)}</strong> • Còn phải thu:{' '}
                          <strong className="text-danger">{formatShortVnd(receivable)}</strong>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mt-1">
                          <span className="small">
                            Lãi/lỗ:{' '}
                            <strong className={sessionProfitLoss >= 0 ? 'text-success' : 'text-danger'}>
                              {sessionProfitLoss >= 0 ? '+' : ''}
                              {formatShortVnd(sessionProfitLoss)}
                            </strong>
                          </span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(s);
                              }}
                              className="btn btn-outline-primary btn-sm py-0 px-2"
                            >
                              {VI_VN.actions.edit}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Khung Đăng ký tham gia buổi cầu */}
        <div className="col-12 col-xl-5">
          {activeSession && (
            <div className="bh-card p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span className="bh-badge bh-badge-blue mb-1">ĐĂNG KÝ THAM GIA BUỔI CẦU</span>
                  <h6 className="fw-bold mb-0">{activeSession.title}</h6>
                  <div className="small text-muted">
                    Cách tính phí: {getPricingModeLabel(activeSession.pricingMode)}
                  </div>
                </div>
                <span className="bh-badge bh-badge-navy">
                  <Users size={14} />
                  <span>
                    {activeSession.registeredCount}/{activeSession.maxPlayers} người chơi
                  </span>
                </span>
              </div>

              {/* Biểu mẫu đăng ký nhanh người chơi */}
              <div className="bh-info-panel mb-3">
                <div className="fw-semibold small mb-2 d-flex align-items-center gap-1">
                  <UserPlus size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Thêm người chơi vào danh sách đăng ký</span>
                </div>
                <div className="row g-2">
                  <div className="col-12 col-sm-7">
                    <select
                      className="form-select form-select-sm"
                      value={regPlayerId}
                      onChange={(e) => setRegPlayerId(Number(e.target.value))}
                    >
                      <option value={0}>-- Chọn người chơi --</option>
                      {playersData?.items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.memberCode} - {p.fullName} ({getSkillLevelLabel(p.skillLevel)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6 col-sm-5">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">Khách đi cùng</span>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        className="form-control"
                        value={regGuestsCount}
                        onChange={(e) => setRegGuestsCount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Ghi chú (Ví dụ: Đến lúc 20:15...)"
                      value={regNote}
                      onChange={(e) => setRegNote(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={registerMutation.isPending}
                      onClick={() => registerMutation.mutate()}
                      className="btn btn-primary btn-sm text-nowrap"
                    >
                      Đăng ký tham gia
                    </button>
                  </div>
                </div>
              </div>

              {/* Bảng người chơi đã đăng ký */}
              <div className="table-responsive">
                <table className="table bh-table">
                  <thead>
                    <tr>
                      <th>Người chơi</th>
                      <th>Khách đi cùng</th>
                      <th>Trạng thái</th>
                      <th className="text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          {VI_VN.messages.noRegistrationsYet}
                        </td>
                      </tr>
                    ) : (
                      registrations.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="fw-semibold">{r.playerName}</div>
                            <div className="small text-muted">
                              {r.memberCode} • {getSkillLevelLabel(r.skillLevel)}
                            </div>
                          </td>
                          <td>
                            {r.guestsBroughtCount > 0 ? (
                              <span className="bh-badge bh-badge-blue">+{r.guestsBroughtCount} khách</span>
                            ) : (
                              <span className="text-muted small">Không có</span>
                            )}
                          </td>
                          <td>
                            {r.status === 1 ? (
                              <span className="bh-badge bh-badge-success">
                                <CheckCircle2 size={13} />
                                <span>Đã đăng ký</span>
                              </span>
                            ) : r.status === 2 ? (
                              <span className="bh-badge bh-badge-warning">Danh sách chờ</span>
                            ) : (
                              <span className="bh-badge bh-badge-muted">Đã hủy</span>
                            )}
                          </td>
                          <td className="text-end">
                            {r.status !== 3 && (
                              <button
                                type="button"
                                onClick={() => setConfirmCancelPlayer({ id: r.playerId, name: r.playerName })}
                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                title="Hủy đăng ký"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hộp thoại xác nhận hủy đăng ký */}
      {confirmCancelPlayer && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4" style={{ maxWidth: 440 }}>
            <h5 className="fw-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              Xác nhận hủy đăng ký
            </h5>
            <p className="mb-3">
              Bạn có chắc chắn muốn hủy đăng ký tham gia buổi cầu của người chơi{' '}
              <strong>{confirmCancelPlayer.name}</strong> không?
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setConfirmCancelPlayer(null)}
              >
                {VI_VN.actions.cancel}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => cancelRegMutation.mutate(confirmCancelPlayer.id)}
              >
                {VI_VN.actions.confirm} hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại Thêm / Sửa Buổi cầu */}
      {showFormModal && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>
                {editingSession ? 'Sửa thông tin buổi cầu' : 'Thêm buổi cầu mới'}
              </h5>
              <button type="button" className="btn btn-sm" onClick={() => setShowFormModal(false)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit((vals) => saveSessionMutation.mutate(vals))}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">
                    Tên buổi cầu <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: Buổi cầu tối Thứ Ba - Sân Viettel"
                    {...register('title')}
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">
                    Ngày đánh cầu <span className="text-danger">*</span>
                  </label>
                  <input type="date" className="form-control" {...register('sessionDate')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">
                    Giờ bắt đầu (24h) <span className="text-danger">*</span>
                  </label>
                  <input type="time" className="form-control" {...register('startTime')} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">
                    Giờ kết thúc (24h) <span className="text-danger">*</span>
                  </label>
                  <input type="time" className="form-control" {...register('endTime')} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Cụm sân cầu lông <span className="text-danger">*</span>
                  </label>
                  <select className="form-select" {...register('venueId')}>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Các sân sử dụng <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Sân 01, Sân 02"
                    {...register('courtsBookedText')}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">
                    Số người chơi tối đa <span className="text-danger">*</span>
                  </label>
                  <input type="number" className="form-control" {...register('maxPlayers')} />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Trạng thái buổi cầu</label>
                  <select className="form-select" {...register('status')}>
                    <option value={SessionStatus.Upcoming}>{VI_VN.statuses.upcoming}</option>
                    <option value={SessionStatus.Ongoing}>{VI_VN.statuses.ongoing}</option>
                    <option value={SessionStatus.Completed}>{VI_VN.statuses.completed}</option>
                    <option value={SessionStatus.Cancelled}>{VI_VN.statuses.cancelled}</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Cách chia tiền buổi cầu</label>
                  <select className="form-select" {...register('pricingMode')}>
                    <option value={PricingSplitMode.FixedPlusShuttlecock}>Tiền sân cố định + Chia tiền cầu</option>
                    <option value={PricingSplitMode.EqualSplit}>Chia đều tiền sân + tiền cầu</option>
                    <option value={PricingSplitMode.FixedRatePerPlayer}>Thu trọn gói cố định / người chơi</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">
                    Tiền sân (VNĐ) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step={1000}
                    className="form-control"
                    placeholder="Nhập số tiền, ví dụ: 700000"
                    {...register('courtFeeTotal')}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Số quả cầu đã dùng</label>
                  <input type="number" className="form-control" {...register('shuttlecockCountUsed')} />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Đơn giá 1 quả cầu (VNĐ)</label>
                  <input type="number" step={1000} className="form-control" {...register('shuttlecockUnitPrice')} />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Mức thu cơ bản / người chơi</label>
                  <input type="number" step={1000} className="form-control" {...register('fixedFeePerPlayer')} />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Phụ thu khách vãng lai</label>
                  <input type="number" step={1000} className="form-control" {...register('guestSurcharge')} />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Chi phí nước uống / khác</label>
                  <input type="number" step={1000} className="form-control" {...register('otherFeeTotal')} />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Ghi chú buổi cầu</label>
                  <textarea rows={2} className="form-control" {...register('notes')} />
                </div>
              </div>

              <div className="small text-muted mt-2">{VI_VN.messages.requiredFieldHint}</div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setShowFormModal(false)}
                >
                  {VI_VN.actions.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saveSessionMutation.isPending}
                  className="btn btn-primary"
                >
                  {saveSessionMutation.isPending ? VI_VN.actions.loading : VI_VN.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
