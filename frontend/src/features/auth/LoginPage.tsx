import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, LogIn, ShieldCheck, UserCheck } from 'lucide-react';
import { badmintonApi, extractErrorMessage } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { VI_VN } from '../../utils/vi-VN';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc thư điện tử.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await badmintonApi.login(values.username, values.password);
      loginUser(res);
      navigate('/');
    } catch (err) {
      setErrorMsg(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (username: string) => {
    setValue('username', username);
    setValue('password', 'Admin@123');
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="bh-card p-4 p-md-5" style={{ maxWidth: 460, width: '100%' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="bh-brand-logo" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
            BH
          </div>
          <div>
            <h4 className="fw-bold mb-0" style={{ color: 'var(--color-text)' }}>
              {VI_VN.brand.name}
            </h4>
            <div className="small fw-semibold" style={{ color: 'var(--color-primary)' }}>
              QUẢN LÝ SÂN CẦU LÔNG & BUỔI CẦU VÃNG LAI
            </div>
          </div>
        </div>

        <div className="bh-navy-banner mb-4 p-3">
          <div className="d-flex align-items-center gap-2 fw-semibold mb-1">
            <ShieldCheck size={18} />
            <span>Đăng nhập Quản trị & Người chơi</span>
          </div>
          <div className="small opacity-75">
            Quản lý lịch đánh cầu, điểm danh, thu tiền sân cầu và đối soát chi phí minh bạch.
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-danger py-2 small" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-3">
            <label className="form-label fw-semibold small">
              Tên đăng nhập <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              placeholder="Ví dụ: admin, thuquy, thanhvien"
              {...register('username')}
            />
            {errors.username && (
              <div className="invalid-feedback">{errors.username.message}</div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold small">
              Mật khẩu <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="Nhập mật khẩu đăng nhập"
              {...register('password')}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password.message}</div>
            )}
          </div>

          <div className="small text-muted mb-3">{VI_VN.messages.requiredFieldHint}</div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
          >
            <LogIn size={18} />
            <span>{loading ? VI_VN.actions.loading : 'Đăng nhập vào hệ thống'}</span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
          <div className="small fw-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Chọn nhanh tài khoản mẫu để trải nghiệm:
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin')}
              className="btn btn-soft-blue btn-sm d-inline-flex align-items-center gap-1"
            >
              <UserCheck size={14} />
              <span>Quản trị viên (Nguyễn Văn Đức)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('thuquy')}
              className="btn btn-soft-blue btn-sm d-inline-flex align-items-center gap-1"
            >
              <Lock size={14} />
              <span>Thủ quỹ (Trần Minh Hoàng)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('thanhvien')}
              className="btn btn-soft-blue btn-sm d-inline-flex align-items-center gap-1"
            >
              <UserCheck size={14} />
              <span>Người chơi (Lê Thị Hồng Nhung)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
