import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckSquare,
  CreditCard,
  Grid,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { badmintonApi } from '../services/api';
import { VI_VN } from '../utils/vi-VN';
import { getRoleLabelVi } from '../utils/formatters';

const navSections = [
  {
    title: VI_VN.nav.sectionCore,
    items: [
      { to: '/', label: VI_VN.nav.dashboard, icon: LayoutDashboard, end: true },
      { to: '/sessions', label: `${VI_VN.nav.sessions} (${VI_VN.nav.schedule})`, icon: CalendarDays },
      { to: '/attendance', label: VI_VN.nav.attendance, icon: CheckSquare },
      { to: '/court-assignments', label: VI_VN.nav.courtAssignments, icon: Activity },
    ],
  },
  {
    title: VI_VN.nav.sectionDirectory,
    items: [
      { to: '/players', label: VI_VN.nav.players, icon: Users },
      { to: '/venues', label: VI_VN.nav.venues, icon: Building2 },
      { to: '/courts', label: VI_VN.nav.courts, icon: Grid },
    ],
  },
  {
    title: VI_VN.nav.sectionFinance,
    items: [
      { to: '/payments', label: VI_VN.nav.payments, icon: CreditCard },
      { to: '/expenses', label: VI_VN.nav.expenses, icon: Receipt },
      { to: '/reports', label: VI_VN.nav.reports, icon: BarChart3 },
      { to: '/notifications', label: VI_VN.nav.notifications, icon: Bell },
      { to: '/settings', label: VI_VN.nav.settings, icon: Settings },
    ],
  },
];

export const MainLayout: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: badmintonApi.getNotifications,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="bh-app-wrapper">
      {/* Thanh điều hướng bên trái (Màu trắng, trạng thái đang chọn màu xanh) */}
      <aside className={`bh-sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div className="bh-sidebar-brand justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="bh-brand-logo">BH</div>
            <div>
              <div className="fw-bold" style={{ color: 'var(--color-text)', fontSize: '1.02rem' }}>
                {VI_VN.brand.name}
              </div>
              <div style={{ color: 'var(--color-primary)', fontSize: '0.73rem', fontWeight: 600 }}>
                QUẢN LÝ SÂN CẦU LÔNG
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm d-lg-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng trình đơn"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="bh-nav-list">
          {navSections.map((sec) => (
            <div key={sec.title} className="mb-2">
              <div className="bh-nav-section-label">{sec.title}</div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'end' in item ? item.end : false}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `bh-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span className="flex-grow-1">{item.label}</span>
                    {item.to === '/notifications' && unreadCount > 0 && (
                      <span className="bh-badge bh-badge-blue py-0 px-2">{unreadCount}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
          <div className="bh-info-panel p-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <Shield size={16} style={{ color: 'var(--color-primary)' }} />
              <div className="small fw-semibold text-truncate">{user?.fullName || 'Quản trị viên'}</div>
            </div>
            <div className="text-muted" style={{ fontSize: '0.74rem' }}>
              Vai trò: <strong style={{ color: 'var(--color-primary)' }}>{getRoleLabelVi(user?.role)}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline-primary w-100 btn-sm d-flex align-items-center justify-content-center gap-2"
          >
            <LogOut size={15} />
            <span>{VI_VN.actions.logout}</span>
          </button>
        </div>
      </aside>

      {/* Khu vực nội dung chính */}
      <div className="bh-main-area">
        <header className="bh-topbar">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-soft-blue btn-sm d-lg-none"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở trình đơn"
            >
              <Menu size={20} />
            </button>
            <div>
              <span className="fw-bold d-none d-md-inline" style={{ color: 'var(--color-text)' }}>
                {VI_VN.brand.clubDefaultName}
              </span>
              <span className="bh-badge bh-badge-blue ms-md-2">
                Đang hoạt động trực tuyến
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <NavLink to="/notifications" className="btn btn-soft-blue btn-sm position-relative" title="Thông báo">
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {unreadCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/attendance" className="btn btn-primary btn-sm d-none d-sm-inline-flex align-items-center gap-1">
              <CheckSquare size={16} />
              <span>{VI_VN.nav.attendance}</span>
            </NavLink>
          </div>
        </header>

        <main className="bh-content">
          <Outlet />
        </main>
      </div>

      {/* Thanh điều hướng dưới cùng trên điện thoại Android & iPhone */}
      <nav className="bh-mobile-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `bh-mobile-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>{VI_VN.nav.dashboard}</span>
        </NavLink>
        <NavLink to="/sessions" className={({ isActive }) => `bh-mobile-nav-item ${isActive ? 'active' : ''}`}>
          <CalendarDays size={18} />
          <span>{VI_VN.nav.sessions}</span>
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `bh-mobile-nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={18} />
          <span>{VI_VN.nav.attendance}</span>
        </NavLink>
        <NavLink to="/payments" className={({ isActive }) => `bh-mobile-nav-item ${isActive ? 'active' : ''}`}>
          <CreditCard size={18} />
          <span>{VI_VN.nav.payments}</span>
        </NavLink>
        <NavLink to="/players" className={({ isActive }) => `bh-mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>{VI_VN.nav.players}</span>
        </NavLink>
      </nav>
    </div>
  );
};
