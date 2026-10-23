import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, CheckCircle2 } from 'lucide-react';
import { badmintonApi } from '../../services/api';
import { formatDateTimeVi } from '../../utils/formatters';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: badmintonApi.getNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: badmintonApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: badmintonApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Trung tâm Thông báo CLB</h4>
          <div className="small text-muted">
            Cập nhật thông báo lịch đánh, nhắc đóng phí VietQR và biến động quỹ CLB.
          </div>
        </div>
        <button
          type="button"
          onClick={() => markAllMutation.mutate()}
          className="btn btn-soft-blue d-inline-flex align-items-center gap-2"
        >
          <CheckCheck size={17} />
          <span>Đánh dấu đã đọc tất cả</span>
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {isLoading ? (
          <div className="bh-card p-4 text-center">Đang tải thông báo...</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`bh-card p-3 p-md-4 d-flex flex-wrap align-items-center justify-content-between gap-3 ${
                !n.isRead ? 'bh-card-selected' : ''
              }`}
            >
              <div className="d-flex align-items-start gap-3">
                <div className="bh-kpi-icon">
                  <Bell size={20} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold">{n.title}</span>
                    {!n.isRead && <span className="bh-badge bh-badge-blue">Mới</span>}
                  </div>
                  <div className="small text-muted mb-1">{n.message}</div>
                  <div className="small text-muted">{formatDateTimeVi(n.createdAtUtc)}</div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {n.actionUrl && (
                  <Link to={n.actionUrl} className="btn btn-primary btn-sm">
                    Xem chi tiết
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  >
                    <CheckCircle2 size={14} />
                    <span>Đã đọc</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
