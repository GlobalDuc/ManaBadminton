import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  CheckCircle2,
  Clock,
  RefreshCw,
  UserCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import { AttendanceStatus, type AttendanceItem } from '../../types';
import {
  formatDateVi,
  formatShortVnd,
  formatTimeRangeVi,
  formatVnd,
  getMembershipTypeLabel,
  getSkillLevelLabel,
} from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';
import { AttendanceStatusBadge, ChargeStatusBadge } from '../../components/StatusBadge';

export const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedSessionId, setSelectedSessionId] = useState<number>(0);
  const [quickPlayerId, setQuickPlayerId] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-for-attendance'],
    queryFn: () => badmintonApi.getSessions({ page: 1, pageSize: 30 }),
  });

  const sessions = sessionsData?.items || [];
  const activeSessionId = selectedSessionId || sessions.find((s) => s.status === 2)?.id || sessions[0]?.id || 0;
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const { data: attendances = [], isLoading } = useQuery({
    queryKey: ['attendances', activeSessionId],
    queryFn: () => badmintonApi.getSessionAttendances(activeSessionId),
    enabled: activeSessionId > 0,
  });

  const { data: playersData } = useQuery({
    queryKey: ['players-all'],
    queryFn: () => badmintonApi.getPlayers({ onlyActive: true, page: 1, pageSize: 100 }),
  });

  const upsertMutation = useMutation({
    mutationFn: badmintonApi.upsertAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => {
      setMessage({ type: 'danger', text: extractErrorMessage(err) });
    },
  });

  const initMutation = useMutation({
    mutationFn: () => badmintonApi.initializeAttendance(activeSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances', activeSessionId] });
      setMessage({ type: 'success', text: 'Đã lấy danh sách người chơi đăng ký sang bảng điểm danh.' });
    },
  });

  const calcChargesMutation = useMutation({
    mutationFn: () =>
      badmintonApi.calculateSessionCharges({
        sessionId: activeSessionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      setMessage({
        type: 'success',
        text: 'Đã chốt điểm danh và tự động tính bảng thu tiền sân + tiền cầu cho buổi cầu này.',
      });
    },
    onError: (err) => {
      setMessage({ type: 'danger', text: extractErrorMessage(err) });
    },
  });

  const handleQuickStatusChange = (item: AttendanceItem, newStatus: AttendanceStatus) => {
    upsertMutation.mutate({
      sessionId: item.sessionId,
      playerId: item.playerId,
      status: newStatus,
      isGuest: item.isGuest,
      extraGuestsCount: item.extraGuestsCount,
      matchesPlayedCount: item.matchesPlayedCount,
      note: item.note,
    });
  };

  const handleAddWalkInPlayer = () => {
    if (!quickPlayerId || !activeSessionId) return;
    upsertMutation.mutate(
      {
        sessionId: activeSessionId,
        playerId: quickPlayerId,
        status: AttendanceStatus.Present,
        isGuest: false,
        extraGuestsCount: 0,
        matchesPlayedCount: 1,
        note: 'Điểm danh bổ sung trực tiếp tại sân',
      },
      {
        onSuccess: () => {
          setQuickPlayerId(0);
          setMessage({ type: 'success', text: 'Đã thêm và xác nhận người chơi có mặt tại sân.' });
        },
      }
    );
  };

  const presentCount = attendances.filter(
    (a) => a.status === AttendanceStatus.Present || a.status === AttendanceStatus.Late
  ).length;

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Điểm danh Người chơi tại Sân</h4>
          <div className="small text-muted">
            Thao tác điểm danh nhanh 1 chạm trên điện thoại hoặc máy tính và tự động tính tiền buổi cầu.
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => initMutation.mutate()}
            disabled={!activeSessionId || initMutation.isPending}
            className="btn btn-soft-blue d-inline-flex align-items-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Đồng bộ từ Đăng ký tham gia</span>
          </button>
          <button
            type="button"
            onClick={() => calcChargesMutation.mutate()}
            disabled={!activeSessionId || calcChargesMutation.isPending}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <Calculator size={16} />
            <span>Chốt điểm danh & Tính tiền buổi cầu</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} d-flex justify-content-between align-items-center py-2 mb-0`}>
          <span>{message.text}</span>
          <div className="d-flex align-items-center gap-2">
            {message.type === 'success' && (
              <button
                type="button"
                className="btn btn-sm btn-primary py-0"
                onClick={() => navigate('/payments')}
              >
                Chuyển sang mục Thu tiền
              </button>
            )}
            <button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Đóng" />
          </div>
        </div>
      )}

      {/* Chọn buổi cầu & Thêm người chơi vãng lai */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="bh-card p-3 h-100">
            <label className="form-label small fw-bold" style={{ color: 'var(--color-primary)' }}>
              CHỌN BUỔI CẦU CẦN ĐIỂM DANH
            </label>
            <select
              className="form-select"
              value={activeSessionId}
              onChange={(e) => setSelectedSessionId(Number(e.target.value))}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  [{formatDateVi(s.sessionDate)}] {s.title} ({formatTimeRangeVi(s.startTime, s.endTime)})
                </option>
              ))}
            </select>
            {activeSession && (
              <div className="d-flex flex-wrap gap-3 mt-2 small text-muted">
                <span>
                  Cụm sân: <strong>{activeSession.venueName}</strong>
                </span>
                <span>
                  Có mặt: <strong style={{ color: 'var(--color-primary)' }}>{presentCount} người chơi</strong>
                </span>
                <span>
                  Chi phí buổi cầu: <strong>{formatVnd(activeSession.totalSessionCost)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="bh-card p-3 h-100">
            <label className="form-label small fw-bold" style={{ color: 'var(--color-primary)' }}>
              THÊM NGƯỜI CHƠI ĐẾN SÂN (CHƯA ĐĂNG KÝ TRƯỚC)
            </label>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                value={quickPlayerId}
                onChange={(e) => setQuickPlayerId(Number(e.target.value))}
              >
                <option value={0}>-- Chọn người chơi có mặt tại sân --</option>
                {playersData?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.memberCode} - {p.fullName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddWalkInPlayer}
                className="btn btn-primary text-nowrap d-inline-flex align-items-center gap-1"
              >
                <UserPlus size={16} />
                <span>Xác nhận có mặt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng danh sách điểm danh */}
      <div className="bh-card overflow-hidden">
        <div className="p-3 px-4 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h6 className="fw-bold mb-0">
            Danh sách điểm danh ({attendances.length} người chơi)
          </h6>
          <div className="small text-muted">
            Nhấn nút tương ứng để đổi trạng thái điểm danh ngay lập tức
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 text-center">{VI_VN.actions.loading}</div>
        ) : (
          <div className="table-responsive">
            <table className="table bh-table">
              <thead>
                <tr>
                  <th>Mã & Họ tên người chơi</th>
                  <th>Trình độ & Hình thức</th>
                  <th>Trạng thái điểm danh</th>
                  <th>Cập nhật nhanh tại sân</th>
                  <th>Khách đi cùng</th>
                  <th>Số tiền dự kiến / Trạng thái thu</th>
                </tr>
              </thead>
              <tbody>
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      Chưa có dữ liệu điểm danh. Hãy nhấn "Đồng bộ từ Đăng ký tham gia" hoặc thêm người chơi ở trên.
                    </td>
                  </tr>
                ) : (
                  attendances.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-bold">{item.playerName}</div>
                        <div className="small text-muted">Mã: {item.memberCode}</div>
                      </td>
                      <td>
                        <div className="small fw-semibold">{getSkillLevelLabel(item.skillLevel)}</div>
                        <div className="small text-muted">{getMembershipTypeLabel(item.membershipType)}</div>
                      </td>
                      <td>
                        <AttendanceStatusBadge status={item.status} />
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(item, AttendanceStatus.Present)}
                            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                              item.status === AttendanceStatus.Present ? 'btn-primary' : 'btn-outline-primary'
                            }`}
                          >
                            <CheckCircle2 size={14} />
                            <span>Có mặt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(item, AttendanceStatus.Late)}
                            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                              item.status === AttendanceStatus.Late ? 'btn-primary' : 'btn-soft-blue'
                            }`}
                          >
                            <Clock size={14} />
                            <span>Đến muộn</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(item, AttendanceStatus.AbsentExcused)}
                            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                              item.status === AttendanceStatus.AbsentExcused ? 'btn-primary' : 'btn-soft-blue'
                            }`}
                          >
                            <UserCheck size={14} />
                            <span>Có phép</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(item, AttendanceStatus.AbsentUnexcused)}
                            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                              item.status === AttendanceStatus.AbsentUnexcused
                                ? 'btn-danger'
                                : 'btn-outline-danger'
                            }`}
                          >
                            <XCircle size={14} />
                            <span>Vắng không phép</span>
                          </button>
                        </div>
                      </td>
                      <td style={{ width: 120 }}>
                        <select
                          className="form-select form-select-sm"
                          value={item.extraGuestsCount}
                          onChange={(e) =>
                            upsertMutation.mutate({
                              sessionId: item.sessionId,
                              playerId: item.playerId,
                              status: item.status,
                              isGuest: item.isGuest,
                              extraGuestsCount: Number(e.target.value),
                              matchesPlayedCount: item.matchesPlayedCount,
                              note: item.note,
                            })
                          }
                        >
                          <option value={0}>Không kèm</option>
                          <option value={1}>+1 khách</option>
                          <option value={2}>+2 khách</option>
                          <option value={3}>+3 khách</option>
                        </select>
                      </td>
                      <td>
                        <div className="fw-bold" style={{ color: 'var(--color-primary)' }}>
                          {formatVnd(item.estimatedOrActualCharge)}{' '}
                          <span className="small text-muted fw-normal">
                            ({formatShortVnd(item.estimatedOrActualCharge)})
                          </span>
                        </div>
                        <ChargeStatusBadge status={item.chargeStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
