import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, CheckCircle2, Clock, Download, FileSpreadsheet, Scale } from 'lucide-react';
import { badmintonApi } from '../../services/api';
import { formatDateVi, formatShortVnd, formatVnd } from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';

export const ReportsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: badmintonApi.getDashboard,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-for-reports'],
    queryFn: () => badmintonApi.getSessions({ page: 1, pageSize: 20 }),
  });

  const exportCsvReport = () => {
    if (!data) return;
    const header = 'KyBaoCao,SoBuoiCau,TienThuThucTeVND,TongChiPhiVND,LoiNhuanRongVND\n';
    const rows = data.monthlyTrends
      .map((m) => `"${m.monthLabel}",${m.sessionsCount},${m.revenue},${m.expense},${m.netBalance}`)
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCaoDoiSoat_BadmintonHub_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return <div className="bh-card p-5 text-center">{VI_VN.actions.loading}</div>;
  }

  const sessions = sessionsData?.items || [];

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Báo cáo Tài chính & Đối soát Buổi cầu</h4>
          <div className="small text-muted">
            Phân biệt rõ Doanh thu dự kiến, Tiền thu thực tế, Còn phải thu, Chi phí buổi cầu và Lợi nhuận thực tế.
          </div>
        </div>
        <button
          type="button"
          onClick={exportCsvReport}
          className="btn btn-primary d-inline-flex align-items-center gap-2"
        >
          <Download size={17} />
          <span>{VI_VN.actions.exportData} (Bảng tính CSV)</span>
        </button>
      </div>

      {/* Biểu đồ Dòng tiền */}
      <div className="bh-card p-4">
        <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
          <span>Biểu đồ Dòng tiền: Tiền thu thực tế & Chi phí theo tháng</span>
        </h6>
        <p className="small text-muted mb-3">
          Đối soát chênh lệch giữa Tiền thu từ người chơi và tổng Chi phí (Tiền thuê sân + Tiền cầu + Chi phí khác)
        </p>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="monthLabel" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => formatShortVnd(Number(v))}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <Tooltip formatter={(val: number) => formatVnd(val)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Tiền thu thực tế"
                stroke="#2563EB"
                fill="#EFF6FF"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Chi phí (Tiền thuê sân & Tiền cầu)"
                stroke="#D97706"
                fill="#FEF3C7"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bảng Đối soát Lãi/lỗ từng Buổi cầu */}
      <div className="bh-card overflow-hidden">
        <div className="p-3 px-4 border-bottom d-flex align-items-center gap-2">
          <Scale size={18} style={{ color: 'var(--color-primary)' }} />
          <h6 className="fw-bold mb-0">Bảng Đối soát Tài chính theo từng Buổi cầu</h6>
        </div>
        <div className="table-responsive">
          <table className="table bh-table">
            <thead>
              <tr>
                <th>Buổi cầu & Ngày đánh</th>
                <th>Chi phí buổi cầu (Tiền sân + Tiền cầu)</th>
                <th>Doanh thu dự kiến</th>
                <th>Tiền thu thực tế</th>
                <th>Còn phải thu</th>
                <th>Lãi/lỗ buổi cầu (Thực thu - Chi phí)</th>
                <th>Trạng thái quyết toán</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const receivable = Math.max(0, s.totalBilledAmount - s.totalCollectedAmount);
                const actualProfitLoss = s.totalCollectedAmount - s.totalSessionCost;
                const isSettled = s.totalBilledAmount > 0 && receivable === 0;

                return (
                  <tr key={s.id}>
                    <td>
                      <div className="fw-bold">{s.title}</div>
                      <div className="small text-muted">{formatDateVi(s.sessionDate)}</div>
                    </td>
                    <td>
                      <div className="fw-semibold" style={{ color: 'var(--color-warning)' }}>
                        {formatVnd(s.totalSessionCost)}
                      </div>
                      <div className="small text-muted">
                        Sân: {formatShortVnd(s.courtFeeTotal)} • Cầu: {formatShortVnd(s.shuttlecockCountUsed * s.shuttlecockUnitPrice)}
                      </div>
                    </td>
                    <td className="fw-semibold">{formatVnd(s.totalBilledAmount)}</td>
                    <td className="fw-bold text-success">{formatVnd(s.totalCollectedAmount)}</td>
                    <td className="fw-bold" style={{ color: receivable > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                      {formatVnd(receivable)}
                    </td>
                    <td
                      className="fw-bold"
                      style={{ color: actualProfitLoss >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}
                    >
                      {actualProfitLoss >= 0 ? '+' : ''}
                      {formatVnd(actualProfitLoss)}
                    </td>
                    <td>
                      {isSettled ? (
                        <span className="bh-badge bh-badge-success">
                          <CheckCircle2 size={13} />
                          <span>{VI_VN.terms.settled}</span>
                        </span>
                      ) : (
                        <span className="bh-badge bh-badge-warning">
                          <Clock size={13} />
                          <span>{VI_VN.terms.unsettled}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bảng Dòng tiền & Lợi nhuận theo tháng */}
      <div className="bh-card overflow-hidden">
        <div className="p-3 px-4 border-bottom d-flex align-items-center gap-2">
          <FileSpreadsheet size={18} style={{ color: 'var(--color-primary)' }} />
          <h6 className="fw-bold mb-0">Bảng tổng hợp Doanh thu, Chi phí & Lợi nhuận theo tháng</h6>
        </div>
        <div className="table-responsive">
          <table className="table bh-table">
            <thead>
              <tr>
                <th>Kỳ báo cáo</th>
                <th>Số buổi cầu</th>
                <th>Tiền thu thực tế</th>
                <th>Tổng chi phí</th>
                <th>Lợi nhuận thực tế (Dòng tiền ròng)</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyTrends.map((m) => (
                <tr key={m.monthLabel}>
                  <td className="fw-bold">{m.monthLabel}</td>
                  <td>
                    <span className="bh-badge bh-badge-blue">{m.sessionsCount} buổi cầu</span>
                  </td>
                  <td className="fw-bold" style={{ color: 'var(--color-primary)' }}>
                    {formatVnd(m.revenue)} ({formatShortVnd(m.revenue)})
                  </td>
                  <td className="fw-semibold" style={{ color: 'var(--color-warning)' }}>
                    {formatVnd(m.expense)} ({formatShortVnd(m.expense)})
                  </td>
                  <td
                    className="fw-bold"
                    style={{ color: m.netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                  >
                    {m.netBalance >= 0 ? '+' : ''}
                    {formatVnd(m.netBalance)} ({formatShortVnd(m.netBalance)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
