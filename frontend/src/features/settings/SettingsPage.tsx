import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Shield, Sliders } from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import type { ClubSetting } from '../../types';
import { formatDateTimeVi } from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';
import { useAuth } from '../../hooks/useAuth';

const AUDIT_ACTION_LABELS: Record<string, string> = {
  SYSTEM_SEED: 'Khởi tạo dữ liệu hệ thống',
  CREATE_VENUE: 'Thêm cụm sân mới',
  UPDATE_VENUE: 'Cập nhật cụm sân',
  CREATE_COURT: 'Thêm sân cầu lông',
  UPDATE_COURT: 'Cập nhật sân cầu lông',
  CREATE_PLAYER: 'Thêm người chơi mới',
  UPDATE_PLAYER: 'Cập nhật người chơi',
  CREATE_SESSION: 'Thêm buổi cầu mới',
  UPDATE_SESSION: 'Cập nhật buổi cầu',
  REGISTER_SESSION: 'Đăng ký tham gia buổi cầu',
  CANCEL_REGISTRATION: 'Hủy đăng ký tham gia',
  UPSERT_ATTENDANCE: 'Cập nhật điểm danh',
  CALCULATE_CHARGES: 'Chốt bảng thu tiền buổi cầu',
  CREATE_PAYMENT: 'Xác nhận thu tiền',
  CREATE_EXPENSE: 'Thêm khoản chi',
  DELETE_EXPENSE: 'Xóa khoản chi',
  AUTO_ASSIGN_COURTS: 'Ghép cặp tự động vào sân',
  UPDATE_SETTINGS: 'Cập nhật cài đặt hệ thống',
};

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['club-settings'],
    queryFn: badmintonApi.getSettings,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => badmintonApi.getAuditLogs(25),
    enabled: user?.role === 'Admin' || user?.role === 'Treasurer',
  });

  const [formState, setFormState] = useState<ClubSetting | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setFormState(settings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (payload: ClubSetting) => badmintonApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-settings'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setFeedback(VI_VN.messages.dataUpdated);
    },
    onError: (err) => setFeedback(extractErrorMessage(err)),
  });

  if (!formState) {
    return <div className="bh-card p-5 text-center">{VI_VN.actions.loading}</div>;
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h4 className="fw-bold mb-1">Cài đặt Hệ thống & Nhật ký Hoạt động</h4>
        <div className="small text-muted">
          Thiết lập đơn giá cầu lông mặc định, thông tin ngân hàng nhận tiền và tra cứu lịch sử thao tác.
        </div>
      </div>

      {feedback && (
        <div className="alert alert-info d-flex justify-content-between align-items-center py-2 mb-0">
          <span>{feedback}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} aria-label="Đóng" />
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="bh-card p-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--color-primary)' }}>
              <Sliders size={18} />
              <span>Thông số Cài đặt Sân & Tài khoản Nhận tiền</span>
            </h6>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Tên Câu lạc bộ / Nhóm cầu lông <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.clubName}
                  onChange={(e) => setFormState({ ...formState, clubName: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">
                  Số điện thoại người quản lý <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.contactPhone}
                  onChange={(e) => setFormState({ ...formState, contactPhone: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Ngân hàng nhận tiền</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.defaultBankName}
                  onChange={(e) => setFormState({ ...formState, defaultBankName: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Số tài khoản nhận tiền</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.defaultBankAccountNo}
                  onChange={(e) => setFormState({ ...formState, defaultBankAccountNo: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Tên chủ tài khoản</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.defaultBankAccountName}
                  onChange={(e) => setFormState({ ...formState, defaultBankAccountName: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Đơn giá 1 quả cầu (VNĐ)</label>
                <input
                  type="number"
                  step={1000}
                  className="form-control"
                  value={formState.defaultShuttlecockPrice}
                  onChange={(e) =>
                    setFormState({ ...formState, defaultShuttlecockPrice: Number(e.target.value) })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Tiền sân mặc định / người chơi</label>
                <input
                  type="number"
                  step={1000}
                  className="form-control"
                  value={formState.defaultFixedFeePerSession}
                  onChange={(e) =>
                    setFormState({ ...formState, defaultFixedFeePerSession: Number(e.target.value) })
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Phụ thu khách vãng lai</label>
                <input
                  type="number"
                  step={1000}
                  className="form-control"
                  value={formState.defaultGuestSurcharge}
                  onChange={(e) =>
                    setFormState({ ...formState, defaultGuestSurcharge: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {user?.role === 'Admin' && (
              <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                <button
                  type="button"
                  onClick={() => updateMutation.mutate(formState)}
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                >
                  <Save size={17} />
                  <span>{VI_VN.actions.save} cài đặt</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="bh-card overflow-hidden h-100">
            <div className="p-3 px-4 border-bottom d-flex align-items-center gap-2">
              <Shield size={18} style={{ color: 'var(--color-primary)' }} />
              <h6 className="fw-bold mb-0">Nhật ký Đối soát & Hoạt động Hệ thống</h6>
            </div>
            <div className="table-responsive" style={{ maxHeight: 420 }}>
              <table className="table bh-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Nội dung thao tác</th>
                    <th>Người thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="small text-muted">{formatDateTimeVi(log.createdAtUtc)}</td>
                      <td>
                        <div className="small fw-bold" style={{ color: 'var(--color-primary)' }}>
                          {AUDIT_ACTION_LABELS[log.action] || 'Cập nhật dữ liệu hệ thống'}
                        </div>
                        <div className="small">{log.summary}</div>
                      </td>
                      <td>
                        <span className="bh-badge bh-badge-blue">
                          {log.performedBy === 'system'
                            ? 'Hệ thống'
                            : log.performedBy === 'admin'
                            ? 'Quản trị viên'
                            : log.performedBy === 'thuquy'
                            ? 'Thủ quỹ'
                            : log.performedBy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
