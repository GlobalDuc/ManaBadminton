import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Edit3,
  Phone,
  Search,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import { MembershipType, SkillLevel, type Player } from '../../types';
import {
  formatDateVi,
  formatShortVnd,
  formatVnd,
  getMembershipTypeLabel,
  getSkillLevelLabel,
} from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';
import { useAuth } from '../../hooks/useAuth';

const playerSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập họ và tên người chơi tối thiểu 2 ký tự.'),
  phoneNumber: z.string().min(8, 'Vui lòng nhập số điện thoại hợp lệ.'),
  email: z.string().optional(),
  gender: z.string().min(1),
  skillLevel: z.coerce.number(),
  membershipType: z.coerce.number(),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

export const PlayersPage: React.FC = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [membershipFilter, setMembershipFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['players', search, skillFilter, membershipFilter],
    queryFn: () =>
      badmintonApi.getPlayers({
        search: search || undefined,
        skillLevel: skillFilter ? (Number(skillFilter) as SkillLevel) : undefined,
        membershipType: membershipFilter ? (Number(membershipFilter) as MembershipType) : undefined,
        page: 1,
        pageSize: 50,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      email: '',
      gender: 'Nam',
      skillLevel: SkillLevel.Intermediate,
      membershipType: MembershipType.Flexible,
      isActive: true,
      notes: '',
    },
  });

  const savePlayerMutation = useMutation({
    mutationFn: async (values: PlayerFormValues) => {
      if (editingPlayer) {
        return badmintonApi.updatePlayer(editingPlayer.id, {
          ...values,
          skillLevel: values.skillLevel as SkillLevel,
          membershipType: values.membershipType as MembershipType,
        });
      }
      return badmintonApi.createPlayer({
        ...values,
        skillLevel: values.skillLevel as SkillLevel,
        membershipType: values.membershipType as MembershipType,
      });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowModal(false);
      setFeedback({
        type: 'success',
        text: `Đã lưu thông tin người chơi ${saved.fullName} (${saved.memberCode}) thành công.`,
      });
    },
    onError: (err) => {
      setFeedback({ type: 'danger', text: extractErrorMessage(err) });
    },
  });

  const openAddModal = () => {
    setEditingPlayer(null);
    reset({
      fullName: '',
      phoneNumber: '',
      email: '',
      gender: 'Nam',
      skillLevel: SkillLevel.Intermediate,
      membershipType: MembershipType.Flexible,
      isActive: true,
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (p: Player) => {
    setEditingPlayer(p);
    reset({
      fullName: p.fullName,
      phoneNumber: p.phoneNumber,
      email: p.email || '',
      gender: p.gender,
      skillLevel: p.skillLevel,
      membershipType: p.membershipType,
      isActive: p.isActive,
      notes: p.notes || '',
    });
    setShowModal(true);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Danh sách Người chơi</h4>
          <div className="small text-muted">
            Quản lý thông tin người chơi, trình độ đánh cầu, hình thức tham gia và theo dõi khoản Còn phải thu.
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <UserPlus size={18} />
            <span>Thêm người chơi</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} d-flex justify-content-between align-items-center py-2 mb-0`}>
          <span>{feedback.text}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} aria-label="Đóng" />
        </div>
      )}

      {/* Thanh Tìm kiếm & Lọc */}
      <div className="bh-card p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={16} style={{ color: 'var(--color-primary)' }} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm theo mã, họ tên có dấu (Nguyễn Văn Đức) hoặc số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            >
              <option value="">-- Lọc theo trình độ --</option>
              <option value={SkillLevel.Beginner}>Mới chơi (Cơ bản)</option>
              <option value={SkillLevel.Intermediate}>Trung bình - Khá</option>
              <option value={SkillLevel.Advanced}>Khá - Giỏi</option>
              <option value={SkillLevel.Pro}>Nâng cao / Phong trào A</option>
            </select>
          </div>
          <div className="col-6 col-md-4">
            <select
              className="form-select"
              value={membershipFilter}
              onChange={(e) => setMembershipFilter(e.target.value)}
            >
              <option value="">-- Lọc theo hình thức tham gia --</option>
              <option value={MembershipType.FixedMonthly}>Cố định theo tháng</option>
              <option value={MembershipType.Flexible}>Linh hoạt theo buổi</option>
              <option value={MembershipType.Guest}>Vãng lai theo buổi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng Người chơi */}
      <div className="bh-card overflow-hidden">
        <div className="table-responsive">
          <table className="table bh-table">
            <thead>
              <tr>
                <th>Mã số</th>
                <th>Họ và tên người chơi</th>
                <th>Điện thoại & Thư điện tử</th>
                <th>Trình độ</th>
                <th>Hình thức tham gia</th>
                <th>Số buổi đã chơi</th>
                <th>Còn phải thu</th>
                <th>Trạng thái</th>
                {canManage && <th className="text-end">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-5">
                    {VI_VN.actions.loading}
                  </td>
                </tr>
              ) : (data?.items.length || 0) === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    {VI_VN.messages.noMatchingData}
                  </td>
                </tr>
              ) : (
                data?.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="bh-badge bh-badge-blue">{p.memberCode}</span>
                    </td>
                    <td>
                      <div className="fw-bold">{p.fullName}</div>
                      <div className="small text-muted">
                        Giới tính: {p.gender} • Tham gia từ: {formatDateVi(p.joinedDate)}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 small fw-semibold">
                        <Phone size={13} style={{ color: 'var(--color-primary)' }} />
                        <span>{p.phoneNumber}</span>
                      </div>
                      <div className="small text-muted">{p.email || '—'}</div>
                    </td>
                    <td>
                      <span className="bh-badge bh-badge-blue">{getSkillLevelLabel(p.skillLevel)}</span>
                    </td>
                    <td className="small fw-semibold">{getMembershipTypeLabel(p.membershipType)}</td>
                    <td>
                      <strong>{p.totalAttendedSessions}</strong> buổi cầu
                    </td>
                    <td>
                      {p.unpaidAmount > 0 ? (
                        <div>
                          <span className="fw-bold" style={{ color: 'var(--color-danger)' }}>
                            {formatVnd(p.unpaidAmount)} ({formatShortVnd(p.unpaidAmount)})
                          </span>
                          <div className="small text-danger">{VI_VN.terms.unsettled}</div>
                        </div>
                      ) : (
                        <span className="text-success small fw-semibold">0 đ ({VI_VN.terms.settled})</span>
                      )}
                    </td>
                    <td>
                      {p.isActive ? (
                        <span className="bh-badge bh-badge-success">
                          <CheckCircle2 size={13} />
                          <span>Đang tham gia</span>
                        </span>
                      ) : (
                        <span className="bh-badge bh-badge-muted">
                          <XCircle size={13} />
                          <span>Tạm nghỉ</span>
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="text-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="btn btn-soft-blue btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <Edit3 size={14} />
                          <span>{VI_VN.actions.edit}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hộp thoại Thêm / Sửa Người chơi */}
      {showModal && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>
                {editingPlayer ? `Sửa thông tin người chơi (${editingPlayer.memberCode})` : 'Thêm người chơi mới'}
              </h5>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit((vals) => savePlayerMutation.mutate(vals))}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label small fw-semibold">
                    Họ và tên người chơi <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: Nguyễn Văn Đức"
                    {...register('fullName')}
                  />
                  {errors.fullName && <div className="invalid-feedback">{errors.fullName.message}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Giới tính</label>
                  <select className="form-select" {...register('gender')}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Số điện thoại liên hệ <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: 0909111222"
                    {...register('phoneNumber')}
                  />
                  {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber.message}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Thư điện tử (Không bắt buộc)</label>
                  <input type="email" className="form-control" placeholder="ten@tenmien.vn" {...register('email')} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Trình độ chơi cầu</label>
                  <select className="form-select" {...register('skillLevel')}>
                    <option value={SkillLevel.Beginner}>Mới chơi (Cơ bản)</option>
                    <option value={SkillLevel.Intermediate}>Trung bình - Khá</option>
                    <option value={SkillLevel.Advanced}>Khá - Giỏi</option>
                    <option value={SkillLevel.Pro}>Nâng cao / Phong trào A</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Hình thức tham gia</label>
                  <select className="form-select" {...register('membershipType')}>
                    <option value={MembershipType.FixedMonthly}>Cố định theo tháng</option>
                    <option value={MembershipType.Flexible}>Linh hoạt theo buổi</option>
                    <option value={MembershipType.Guest}>Vãng lai theo buổi</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold">Ghi chú người chơi</label>
                  <textarea rows={2} className="form-control" {...register('notes')} />
                </div>

                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="playerActiveCheck"
                      className="form-check-input"
                      {...register('isActive')}
                    />
                    <label htmlFor="playerActiveCheck" className="form-check-label small fw-semibold">
                      Người chơi đang hoạt động
                    </label>
                  </div>
                </div>
              </div>

              <div className="small text-muted mt-2">{VI_VN.messages.requiredFieldHint}</div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button type="button" className="btn btn-outline-primary" onClick={() => setShowModal(false)}>
                  {VI_VN.actions.cancel}
                </button>
                <button type="submit" disabled={savePlayerMutation.isPending} className="btn btn-primary">
                  {savePlayerMutation.isPending ? VI_VN.actions.loading : VI_VN.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
