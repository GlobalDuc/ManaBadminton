import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="bh-card p-5 text-center mx-auto my-5" style={{ maxWidth: 500 }}>
      <h2 className="fw-bold" style={{ color: 'var(--color-primary)' }}>
        404
      </h2>
      <h5 className="fw-bold mb-2">Không tìm thấy trang yêu cầu</h5>
      <p className="text-muted small mb-4">
        Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển trong hệ thống Badminton Hub.
      </p>
      <Link to="/" className="btn btn-primary d-inline-flex align-items-center gap-2">
        <ArrowLeft size={16} />
        <span>Quay lại Bảng điều khiển</span>
      </Link>
    </div>
  );
};
