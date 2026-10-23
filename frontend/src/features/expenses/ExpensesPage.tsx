import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Receipt, Trash2, X } from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import { ExpenseCategory, type Expense } from '../../types';
import {
  formatDateVi,
  formatShortVnd,
  formatVnd,
  getExpenseAllocationType,
  getExpenseCategoryLabel,
} from '../../utils/formatters';
import { VI_VN } from '../../utils/vi-VN';
import { useAuth } from '../../hooks/useAuth';

const expenseSchema = z.object({
  title: z.string().min(3, 'Vui lòng nhập nội dung chi phí tối thiểu 3 ký tự.'),
  category: z.coerce.number(),
  amount: z.coerce.number().min(1000, VI_VN.messages.invalidAmount),
  expenseDate: z.string().min(1, 'Vui lòng chọn ngày chi.'),
  sessionId: z.coerce.number().optional(),
  paidBy: z.string().min(2, 'Vui lòng nhập tên người thanh toán.'),
  allocationType: z.enum(['SHARED', 'PERSONAL']),
  vendorName: z.string().optional(),
  receiptNote: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const ExpensesPage: React.FC = () => {
  const { canManage } = useAuth();
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Expense | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', categoryFilter],
    queryFn: () =>
      badmintonApi.getExpenses({
        category: categoryFilter ? (Number(categoryFilter) as ExpenseCategory) : undefined,
        page: 1,
        pageSize: 40,
      }),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-for-expense'],
    queryFn: () => badmintonApi.getSessions({ page: 1, pageSize: 20 }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: 'Mua 5 ống cầu lông Hải Yến S70',
      category: ExpenseCategory.Shuttlecock,
      amount: 1350000,
      expenseDate: new Date().toISOString().slice(0, 10),
      sessionId: 0,
      paidBy: 'Trần Minh Hoàng',
      allocationType: 'SHARED',
      vendorName: 'Đại lý Thể Thao Minh Phú',
      receiptNote: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => {
      const prefix = values.allocationType === 'PERSONAL' ? '[Cá nhân] ' : '[Chi tiêu chung] ';
      const combinedNote = `${prefix}${values.receiptNote || ''}`.trim();
      return badmintonApi.createExpense({
        title: values.title,
        category: values.category as ExpenseCategory,
        amount: values.amount,
        expenseDate: values.expenseDate,
        sessionId: values.sessionId && values.sessionId > 0 ? values.sessionId : undefined,
        paidBy: values.paidBy,
        vendorName: values.vendorName,
        receiptNote: combinedNote,
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowModal(false);
      reset();
      setFeedback({
        type: 'success',
        text: `Đã lưu khoản chi "${created.title}" (${formatVnd(created.amount)}) thành công.`,
      });
    },
    onError: (err) => setFeedback({ type: 'danger', text: extractErrorMessage(err) }),
  });

  const deleteMutation = useMutation({
    mutationFn: badmintonApi.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setConfirmDeleteItem(null);
      setFeedback({ type: 'success', text: 'Đã xóa khoản chi thành công.' });
    },
  });

  const items = data?.items || [];
  const totalExpenseSum = items.reduce((sum, e) => sum + e.amount, 0);
  const sharedExpenseSum = items
    .filter((e) => getExpenseAllocationType(e.receiptNote).isShared)
    .reduce((sum, e) => sum + e.amount, 0);
  const personalExpenseSum = totalExpenseSum - sharedExpenseSum;

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h4 className="fw-bold mb-1">Quản lý Chi phí & Người thanh toán</h4>
          <div className="small text-muted">
            Ghi nhận Tiền thuê sân, Tiền cầu, phân loại Chi tiêu chung / Chi tiêu cá nhân và đối soát Người thanh toán.
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <PlusCircle size={18} />
            <span>Thêm khoản chi</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} d-flex justify-content-between align-items-center py-2 mb-0`}>
          <span>{feedback.text}</span>
          <button type="button" className="btn-close" onClick={() => setFeedback(null)} aria-label="Đóng" />
        </div>
      )}

      {/* 3 Thẻ Tổng hợp Chi phí: Tổng chi phí - Chi tiêu chung - Chi tiêu cá nhân */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="bh-card p-3">
            <div className="small text-muted fw-semibold">TỔNG CHI PHÍ GHI NHẬN</div>
            <div className="fs-4 fw-bold" style={{ color: 'var(--color-warning)' }}>
              {formatVnd(totalExpenseSum)}{' '}
              <span className="fs-6 text-muted fw-normal">({formatShortVnd(totalExpenseSum)})</span>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="bh-card p-3">
            <div className="small text-muted fw-semibold">CHI TIÊU CHUNG (CHIA SẺ THEO TỶ LỆ)</div>
            <div className="fs-4 fw-bold" style={{ color: 'var(--color-primary)' }}>
              {formatVnd(sharedExpenseSum)}{' '}
              <span className="fs-6 text-muted fw-normal">({formatShortVnd(sharedExpenseSum)})</span>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="bh-card p-3">
            <div className="small text-muted fw-semibold">CHI TIÊU CÁ NHÂN</div>
            <div className="fs-4 fw-bold">
              {formatVnd(personalExpenseSum)}{' '}
              <span className="fs-6 text-muted fw-normal">({formatShortVnd(personalExpenseSum)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Lọc Chi phí */}
      <div className="bh-card p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <Receipt size={18} style={{ color: 'var(--color-primary)' }} />
          <select
            className="form-select form-select-sm"
            style={{ minWidth: 260 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">-- Lọc theo tất cả hạng mục chi phí --</option>
            <option value={ExpenseCategory.CourtRental}>Tiền thuê sân</option>
            <option value={ExpenseCategory.Shuttlecock}>Tiền cầu</option>
            <option value={ExpenseCategory.WaterAndRefreshment}>Nước uống & Giải khát</option>
            <option value={ExpenseCategory.TournamentAndEvent}>Giao lưu & Giải đấu</option>
            <option value={ExpenseCategory.Equipment}>Lưới cầu & Dụng cụ</option>
            <option value={ExpenseCategory.Other}>Chi phí khác</option>
          </select>
        </div>

        <div className="small text-muted">
          Hiển thị <strong>{items.length}</strong> khoản chi
        </div>
      </div>

      {/* Bảng Chi phí */}
      <div className="bh-card overflow-hidden">
        <div className="table-responsive">
          <table className="table bh-table">
            <thead>
              <tr>
                <th>Ngày chi</th>
                <th>Nội dung khoản chi</th>
                <th>Hạng mục</th>
                <th>Phân loại chi tiêu</th>
                <th>Đơn vị nhận / Buổi cầu</th>
                <th>Người thanh toán</th>
                <th>Số tiền chi</th>
                {canManage && <th className="text-end">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4">
                    {VI_VN.actions.loading}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    {VI_VN.messages.noMatchingData}
                  </td>
                </tr>
              ) : (
                items.map((e) => {
                  const alloc = getExpenseAllocationType(e.receiptNote);
                  return (
                    <tr key={e.id}>
                      <td className="fw-semibold">{formatDateVi(e.expenseDate)}</td>
                      <td>
                        <div className="fw-bold">{e.title}</div>
                        {e.receiptNote && <div className="small text-muted">{e.receiptNote}</div>}
                      </td>
                      <td>
                        <span className="bh-badge bh-badge-blue">{getExpenseCategoryLabel(e.category)}</span>
                      </td>
                      <td>
                        <span className={`bh-badge ${alloc.isShared ? 'bh-badge-blue' : 'bh-badge-muted'}`}>
                          {alloc.typeLabel}
                        </span>
                      </td>
                      <td className="small">{e.vendorName || e.sessionTitle || 'Chi phí chung CLB'}</td>
                      <td className="small fw-semibold">{e.paidBy}</td>
                      <td className="fw-bold" style={{ color: 'var(--color-warning)' }}>
                        -{formatVnd(e.amount)} ({formatShortVnd(e.amount)})
                      </td>
                      {canManage && (
                        <td className="text-end">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteItem(e)}
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            title="Xóa khoản chi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hộp thoại xác nhận xóa khoản chi */}
      {confirmDeleteItem && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4" style={{ maxWidth: 450 }}>
            <h5 className="fw-bold mb-2" style={{ color: 'var(--color-primary)' }}>
              Xác nhận xóa khoản chi
            </h5>
            <p className="mb-2">{VI_VN.messages.confirmDeleteExpense}</p>
            <div className="bh-info-panel small mb-3">
              <div>
                Khoản chi: <strong>{confirmDeleteItem.title}</strong>
              </div>
              <div>
                Số tiền: <strong>{formatVnd(confirmDeleteItem.amount)}</strong> • Người thanh toán:{' '}
                <strong>{confirmDeleteItem.paidBy}</strong>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setConfirmDeleteItem(null)}
              >
                {VI_VN.actions.cancel}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => deleteMutation.mutate(confirmDeleteItem.id)}
              >
                {VI_VN.actions.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại Thêm Khoản Chi */}
      {showModal && (
        <div className="bh-modal-backdrop">
          <div className="bh-modal-dialog p-4">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>
                Thêm khoản chi mới
              </h5>
              <button type="button" className="btn btn-sm" onClick={() => setShowModal(false)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit((vals) => createMutation.mutate(vals))}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">
                    Nội dung khoản chi <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: Thanh toán tiền thuê sân tháng 10"
                    {...register('title')}
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Hạng mục chi phí <span className="text-danger">*</span>
                  </label>
                  <select className="form-select" {...register('category')}>
                    <option value={ExpenseCategory.Shuttlecock}>Tiền cầu</option>
                    <option value={ExpenseCategory.CourtRental}>Tiền thuê sân</option>
                    <option value={ExpenseCategory.WaterAndRefreshment}>Nước uống & Giải khát</option>
                    <option value={ExpenseCategory.TournamentAndEvent}>Giao lưu & Giải đấu</option>
                    <option value={ExpenseCategory.Equipment}>Lưới cầu & Dụng cụ</option>
                    <option value={ExpenseCategory.Other}>Chi phí khác</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Số tiền chi (VNĐ) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step={1000}
                    placeholder="Nhập số tiền, ví dụ: 270000"
                    className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                    {...register('amount')}
                  />
                  {errors.amount && <div className="invalid-feedback">{errors.amount.message}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Ngày chi <span className="text-danger">*</span>
                  </label>
                  <input type="date" className="form-control" {...register('expenseDate')} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Người thanh toán (Người thực tế chi trả) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.paidBy ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: Nguyễn Văn Đức"
                    {...register('paidBy')}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Phân loại chi tiêu</label>
                  <select className="form-select" {...register('allocationType')}>
                    <option value="SHARED">Chi tiêu chung (Cùng chịu theo tỷ lệ)</option>
                    <option value="PERSONAL">Chi tiêu cá nhân (Tính riêng 1 người)</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Tính vào Chi phí buổi cầu (Không bắt buộc)</label>
                  <select className="form-select" {...register('sessionId')}>
                    <option value={0}>-- Chi phí chung của cả CLB --</option>
                    {sessionsData?.items.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Nhà cung cấp / Chủ sân</label>
                  <input type="text" className="form-control" {...register('vendorName')} />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Ghi chú chứng từ</label>
                  <input type="text" className="form-control" {...register('receiptNote')} />
                </div>
              </div>

              <div className="small text-muted mt-2">{VI_VN.messages.requiredFieldHint}</div>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <button type="button" className="btn btn-outline-primary" onClick={() => setShowModal(false)}>
                  {VI_VN.actions.cancel}
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
                  {createMutation.isPending ? VI_VN.actions.loading : VI_VN.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
