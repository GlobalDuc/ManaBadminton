import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Grid, PlusCircle, X } from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import { formatVnd } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

export const CourtsPage: React.FC = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  const [venueFilter, setVenueFilter] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [venueId, setVenueId] = useState<number>(1);
  const [courtName, setCourtName] = useState('');
  const [courtCode, setCourtCode] = useState('');
  const [surfaceType, setSurfaceType] = useState('Thảm Yonex Pro');
  const [hourlyRate, setHourlyRate] = useState(135000);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: badmintonApi.getVenues,
  });

  const { data: courts = [] } = useQuery({
    queryKey: ['courts', venueFilter],
    queryFn: () => badmintonApi.getCourts(venueFilter > 0 ? venueFilter : undefined),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      badmintonApi.createCourt({
        venueId,
        courtName,
        courtCode,
        surfaceType,
        hourlyRate,
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setShowModal(false);
      setCourtName('');
      setCourtCode('');
      setFeedback('Đã thêm sân thi đấu mới thành công!');
    },
    onError: (err) => setFeedback(extractErrorMessage(err)),
  });

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Danh sách Sân Con Thi Đấu</h4>
          <div className="small text-muted">
            Quản lý từng mặt sân thảm, mã sân và đơn giá theo khung giờ tại các cụm sân.
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setVenueId(venues[0]?.id || 1);
              setShowModal(true);
            }}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <PlusCircle size={18} />
            <span>Thêm sân con mới</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="alert alert-info d-flex justify-content-between align-items-center py-2 mb-0">
          <span>{feedback}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      <div className="bh-card p-3 d-flex align-items-center gap-3">
        <Grid size={18} style={{ color: 'var(--color-primary)' }} />
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 320 }}
          value={venueFilter}
          onChange={(e) => setVenueFilter(Number(e.target.value))}
        >
          <option value={0}>-- Tất cả cụm sân --</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bh-card overflow-hidden">
        <div className="table-responsive">
          <table className="table bh-table">
            <thead>
              <tr>
                <th>Mã sân</th>
                <th>Tên sân</th>
                <th>Thuộc cụm sân</th>
                <th>Mặt thảm thi đấu</th>
                <th>Đơn giá / giờ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {courts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="bh-badge bh-badge-blue">{c.courtCode}</span>
                  </td>
                  <td className="fw-bold">{c.courtName}</td>
                  <td>{c.venueName}</td>
                  <td>{c.surfaceType}</td>
                  <td className="fw-bold" style={{ color: 'var(--color-primary)' }}>
                    {formatVnd(c.hourlyRate)}
                  </td>
                  <td>
                    <span className="bh-badge bh-badge-success">
                      <CheckCircle2 size={13} />
                      <span>Sẵn sàng</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>
                Thêm sân cầu lông mới
              </h5>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-semibold">Thuộc cụm sân</label>
                <select
                  className="form-select"
                  value={venueId}
                  onChange={(e) => setVenueId(Number(e.target.value))}
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Mã sân (VD: VT-S4)</label>
                <input
                  type="text"
                  className="form-control"
                  value={courtCode}
                  onChange={(e) => setCourtCode(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Tên sân</label>
                <input
                  type="text"
                  className="form-control"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Loại thảm</label>
                <input
                  type="text"
                  className="form-control"
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Đơn giá thuê / giờ (VNĐ)</label>
                <input
                  type="number"
                  step={5000}
                  className="form-control"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" className="btn btn-outline-primary" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button type="button" onClick={() => createMutation.mutate()} className="btn btn-primary">
                Lưu sân con
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
