import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  CreditCard,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { badmintonApi } from '../../services/api';
import {
  formatDateVi,
  formatDecimalVi,
  formatShortVnd,
  formatTimeRangeVi,
  formatVnd,
  getPricingModeLabel,
} from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';
import { ChargeStatusBadge, SessionStatusBadge } from '../../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: badmintonApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="bh-card p-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <div className="fw-semibold">{VI_VN.actions.loading}</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bh-card p-4">
        <div className="text-danger fw-semibold mb-2">{VI_VN.messages.serverConnectionError}</div>
        <button className="btn btn-primary btn-sm" onClick={() => refetch()}>
          {VI_VN.actions.retry}
        </button>
      </div>
    );
  }

  const monthlyNetProfit = data.monthlyRevenue - data.monthlyExpenses;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Khung tiêu đề Tổng quan */}
      <div className="bh-navy-banner d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <span className="bh-badge bh-badge-blue mb-2">TỔNG QUAN QUẢN LÝ SÂN & BUỔI CẦU</span>
          <h4 className="fw-bold mb-1">{VI_VN.brand.clubDefaultName}</h4>
          <p className="mb-0 small opacity-75">
            Theo dõi lịch đánh cầu, điểm danh người chơi, thu tiền sân cầu, chi phí buổi cầu và đối soát dòng tiền thực tế.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/sessions" className="btn btn-primary d-inline-flex align-items-center gap-2">
            <CalendarDays size={17} />
            <span>Thêm buổi cầu mới</span>
          </Link>
          <Link to="/attendance" className="btn btn-soft-blue d-inline-flex align-items-center gap-2">
            <CheckSquare size={17} />
            <span>Điểm danh hôm nay</span>
          </Link>
        </div>
      </div>

      {/* 4 Thẻ chỉ số tài chính & vận hành tách bạch rõ ràng */}
      <div className="row g-3">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bh-card p-3 h-100 d-flex align-items-center gap-3">
            <div className="bh-kpi-icon">
              <Wallet size={22} />
            </div>
            <div>
              <div className="small text-muted fw-semibold">TIỀN THU THỰC TẾ (THÁNG NÀY)</div>
              <div className="fs-4 fw-bold" style={{ color: 'var(--color-primary)' }}>
                {formatVnd(data.monthlyRevenue)}
              </div>
              <div className="small text-muted">
                Lợi nhuận ròng tháng:{' '}
                <strong className={monthlyNetProfit >= 0 ? 'text-success' : 'text-danger'}>
                  {formatShortVnd(monthlyNetProfit)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bh-card p-3 h-100 d-flex align-items-center gap-3">
            <div className="bh-kpi-icon">
              <AlertTriangle size={22} style={{ color: 'var(--color-warning)' }} />
            </div>
            <div>
              <div className="small text-muted fw-semibold">CÒN PHẢI THU (CHƯA QUYẾT TOÁN)</div>
              <div className="fs-4 fw-bold" style={{ color: 'var(--color-warning)' }}>
                {formatVnd(data.totalOutstandingDebt)}
              </div>
              <div className="small text-muted">
                {data.unpaidChargesCount} khoản chưa thanh toán đủ
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bh-card p-3 h-100 d-flex align-items-center gap-3">
            <div className="bh-kpi-icon">
              <CalendarDays size={22} />
            </div>
            <div>
              <div className="small text-muted fw-semibold">BUỔI CẦU SẮP DIỄN RA / ĐANG ĐÁNH</div>
              <div className="fs-4 fw-bold">{data.upcomingSessionsCount} buổi cầu</div>
              <div className="small text-muted">
                Đã kết thúc trong tháng: <strong>{data.completedSessionsThisMonth} buổi</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="bh-card p-3 h-100 d-flex align-items-center gap-3">
            <div className="bh-kpi-icon">
              <Users size={22} />
            </div>
            <div>
              <div className="small text-muted fw-semibold">NGƯỜI CHƠI ĐANG THAM GIA</div>
              <div className="fs-4 fw-bold">{data.totalActivePlayers} người chơi</div>
              <div className="small text-muted">
                Tồn quỹ tích lũy: <strong>{formatShortVnd(data.clubFundBalance)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ Dòng tiền: Tiền thu vs Chi phí */}
      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="bh-card p-4 h-100">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>Biểu đồ Dòng tiền: Tiền thu & Chi phí 6 tháng gần nhất</span>
                </h6>
                <div className="small text-muted">
                  Màu Xanh (#2563EB): Tiền thu thực tế • Màu Vàng cam (#D97706): Chi phí thuê sân & tiền cầu
                </div>
              </div>
              <Link to="/reports" className="btn btn-soft-blue btn-sm">
                Xem Báo cáo & Đối soát
              </Link>
            </div>

            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="monthLabel" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => formatShortVnd(Number(v))}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(val: number) => formatVnd(val)}
                    contentStyle={{
                      borderRadius: 10,
                      borderColor: '#E2E8F0',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Tiền thu thực tế" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Chi phí (Tiền thuê sân & Tiền cầu)" fill="#D97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="bh-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold mb-1">Tỷ trọng Chi phí vận hành</h6>
              <p className="small text-muted mb-3">Phân bổ Tiền thuê sân, Tiền cầu và Nước uống</p>

              <div className="d-flex flex-column gap-3">
                {data.expenseBreakdown.map((item) => (
                  <div key={item.categoryName}>
                    <div className="d-flex justify-content-between small fw-semibold mb-1">
                      <span>{item.categoryName}</span>
                      <span style={{ color: 'var(--color-primary)' }}>
                        {formatVnd(item.amount)} ({formatDecimalVi(item.percentage)}%)
                      </span>
                    </div>
                    <div className="progress" style={{ height: 8, backgroundColor: 'var(--color-primary-light)' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${Math.min(100, item.percentage)}%`,
                          backgroundColor: 'var(--color-primary)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bh-info-panel mt-4">
              <div className="small fw-bold" style={{ color: 'var(--color-primary)' }}>
                Hướng dẫn đối soát buổi cầu
              </div>
              <div className="small text-muted mt-1">
                Sau mỗi buổi cầu, vào mục <strong>Thu tiền</strong> để chốt số quả cầu sử dụng, kiểm tra <strong>Tiền thu</strong> thực tế và các khoản <strong>Còn phải thu</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Lịch đánh cầu & Khoản còn phải thu */}
      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="bh-card overflow-hidden h-100">
            <div className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0">Lịch đánh cầu đang diễn ra & sắp tới</h6>
              <Link to="/sessions" className="btn btn-soft-blue btn-sm d-inline-flex align-items-center gap-1">
                <span>Xem tất cả buổi cầu</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table bh-table">
                <thead>
                  <tr>
                    <th>Buổi cầu</th>
                    <th>Ngày & Khung giờ</th>
                    <th>Người chơi</th>
                    <th>Cách tính tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingSessions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="fw-semibold">{s.title}</div>
                        <div className="small text-muted">
                          {s.venueName} ({s.courtsBookedText})
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{formatDateVi(s.sessionDate)}</div>
                        <div className="small text-muted">
                          {formatTimeRangeVi(s.startTime, s.endTime)}
                        </div>
                      </td>
                      <td>
                        <span className="bh-badge bh-badge-blue">
                          {s.registeredCount}/{s.maxPlayers} người
                        </span>
                      </td>
                      <td className="small">{getPricingModeLabel(s.pricingMode)}</td>
                      <td>
                        <SessionStatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="bh-card overflow-hidden h-100">
            <div className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0">Người chơi còn phải thu (Chưa quyết toán)</h6>
              <Link to="/payments" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1">
                <CreditCard size={14} />
                <span>Thu tiền</span>
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table bh-table">
                <thead>
                  <tr>
                    <th>Người chơi</th>
                    <th>Buổi cầu</th>
                    <th>Còn phải thu</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPendingDebts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        Tất cả người chơi đã quyết toán đầy đủ!
                      </td>
                    </tr>
                  ) : (
                    data.topPendingDebts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="fw-semibold">{c.playerName}</div>
                          <div className="small text-muted">Mã: {c.memberCode}</div>
                        </td>
                        <td className="small">
                          <div className="text-truncate" style={{ maxWidth: 150 }}>
                            {c.sessionTitle}
                          </div>
                          <div className="text-muted">{formatDateVi(c.sessionDate)}</div>
                        </td>
                        <td className="fw-bold" style={{ color: 'var(--color-danger)' }}>
                          {formatVnd(c.remainingAmount)}
                          <div className="small text-muted fw-normal">({formatShortVnd(c.remainingAmount)})</div>
                        </td>
                        <td>
                          <ChargeStatusBadge status={c.paymentStatus} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
