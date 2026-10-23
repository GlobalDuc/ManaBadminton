import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, Edit3, MapPin, Phone, PlusCircle, X } from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import type { Venue } from '../../types';
import { formatVnd } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

export const VenuesPage: React.FC = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(130000);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: badmintonApi.getVenues,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        address,
        contactPhone,
        defaultHourlyRate,
        isActive: true,
        notes,
      };
      if (editingVenue) {
        return badmintonApi.updateVenue(editingVenue.id, payload);
      }
      return badmintonApi.createVenue(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setShowModal(false);
      setFeedback('Đã lưu thông tin cụm sân cầu lông thành công!');
    },
    onError: (err) => setFeedback(extractErrorMessage(err)),
  });

  const openCreate = () => {
    setEditingVenue(null);
    setName('');
    setAddress('');
    setContactPhone('');
    setDefaultHourlyRate(130000);
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (v: Venue) => {
    setEditingVenue(v);
    setName(v.name);
    setAddress(v.address);
    setContactPhone(v.contactPhone);
    setDefaultHourlyRate(v.defaultHourlyRate);
    setNotes(v.notes || '');
    setShowModal(true);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Cụm Sân Cầu Lông Liên Kết</h4>
          <div className="small text-muted">
            Quản lý địa chỉ nhà thi đấu, số điện thoại chủ sân và đơn giá thuê sân theo giờ.
          </div>
        </div>
        {canManage && (
          <button type="button" onClick={openCreate} className="btn btn-primary d-inline-flex align-items-center gap-2">
            <PlusCircle size={18} />
            <span>Thêm cụm sân mới</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="alert alert-info d-flex justify-content-between align-items-center py-2 mb-0">
          <span>{feedback}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} />
        </div>
      )}

      <div className="row g-4">
        {venues.map((v) => (
          <div key={v.id} className="col-12 col-md-6">
            <div className="bh-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bh-kpi-icon">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">{v.name}</h6>
                      <span className="bh-badge bh-badge-blue mt-1">{v.courtsCount} sân thi đấu</span>
                    </div>
                  </div>
                  <span className="bh-badge bh-badge-success">
                    <CheckCircle2 size={13} />
                    <span>Đang hoạt động</span>
                  </span>
                </div>

                <div className="small text-muted d-flex align-items-center gap-2 mt-3">
                  <MapPin size={15} style={{ color: 'var(--color-primary)' }} />
                  <span>{v.address}</span>
                </div>
                <div className="small text-muted d-flex align-items-center gap-2 mt-1">
                  <Phone size={15} style={{ color: 'var(--color-primary)' }} />
                  <span>Liên hệ đặt sân: {v.contactPhone}</span>
                </div>
                {v.notes && <div className="bh-info-panel mt-3 small">{v.notes}</div>}
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <div>
                  <span className="small text-muted">Đơn giá mặc định: </span>
                  <strong style={{ color: 'var(--color-primary)' }}>{formatVnd(v.defaultHourlyRate)} / giờ</strong>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openEdit(v)}
                    className="btn btn-soft-blue btn-sm d-inline-flex align-items-center gap-1"
                  >
                    <Edit3 size={14} />
                    <span>Chỉnh sửa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>
                {editingVenue ? 'Cập nhật cụm sân' : 'Thêm cụm sân cầu lông mới'}
              </h5>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-semibold">Tên cụm sân cầu lông</label>
                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Số điện thoại chủ sân</label>
                <input
                  type="text"
                  className="form-control"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Giá thuê mặc định / giờ (VNĐ)</label>
                <input
                  type="number"
                  step={5000}
                  className="form-control"
                  value={defaultHourlyRate}
                  onChange={(e) => setDefaultHourlyRate(Number(e.target.value))}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Ghi chú tiện ích sân</label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" className="btn btn-outline-primary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              <button type="button" onClick={() => saveMutation.mutate()} className="btn btn-primary">
                Lưu cụm sân
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
