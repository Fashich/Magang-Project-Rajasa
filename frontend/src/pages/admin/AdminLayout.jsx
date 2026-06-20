/**
 * AdminLayout.jsx
 * Professional admin dashboard layout — SMK Rajasa Presensi
 * Branch: feature/admin-dashboard
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import './AdminLayout.css'

const THEME_KEY = 'presensi_lab_rajasa:theme'

// ─── Icons ──────────────────────────────────────────────────────────────────
const I = {
  menu:     <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
  dash:     <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>,
  users:    <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  sesi:     <svg viewBox="0 0 24 24"><path d="M19 3h-4.18A3 3 0 0 0 9.18 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 18H5V5h2v3h10V5h2v16z"/></svg>,
  chart:    <svg viewBox="0 0 24 24"><path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16 13h3v6h-3v-6z"/></svg>,
  alert:    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
  report:   <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>,
  izin:     <svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>,
  audit:    <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>,
  setting:  <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.01 7.01 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/></svg>,
  logout:   <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/></svg>,
  bell:     <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
  theme:    <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
  school:   <svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>,
}

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: I.dash },
      { id: 'analitik',  label: 'Analitik Kehadiran', icon: I.chart },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { id: 'sesi',      label: 'Sesi Presensi',  icon: I.sesi },
      { id: 'e-izin',    label: 'E-Izin',          icon: I.izin, badge: null },
      { id: 'peringatan',label: 'Early Warning',   icon: I.alert },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'users',     label: 'Pengguna',        icon: I.users },
      { id: 'laporan',   label: 'Laporan',          icon: I.report },
      { id: 'audit',     label: 'Audit Trail',      icon: I.audit },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { id: 'settings',  label: 'Pengaturan',      icon: I.setting },
    ],
  },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ collapsed, activePage, onPageChange, onLogout, user }) {
  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-icon">
          {window.__RAJASA_LOGO__
            ? <img src="/images/RajasaLogo.png" alt="Logo SMK Rajasa" />
            : I.school}
        </div>
        {!collapsed && (
          <div className="admin-sidebar-logo-text">
            <h1>Presensi Lab</h1>
            <p>SMK Rajasa Surabaya</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="admin-nav-section-label">{section.label}</div>
            )}
            {section.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onPageChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge != null && (
                  <span className="admin-nav-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <button type="button" className="admin-logout-btn" onClick={onLogout} title={collapsed ? 'Keluar' : undefined}>
          {I.logout}
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function AdminHeader({ onToggle, activePage, onToggleTheme, theme, user }) {
  const PAGE_TITLES = {
    dashboard: 'Dashboard', analitik: 'Analitik Kehadiran',
    sesi: 'Sesi Presensi', 'e-izin': 'Portal E-Izin',
    peringatan: 'Early Warning', users: 'Manajemen Pengguna',
    laporan: 'Laporan', audit: 'Audit Trail', settings: 'Pengaturan',
  }

  const initials = (user?.nama_lengkap || user?.username || 'A').charAt(0).toUpperCase()

  return (
    <header className="admin-header">
      <button type="button" className="admin-header-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        {I.menu}
      </button>

      <div>
        <div className="admin-header-title">{PAGE_TITLES[activePage] ?? 'Admin'}</div>
        <div className="admin-header-breadcrumb">
          Admin / {PAGE_TITLES[activePage] ?? activePage}
        </div>
      </div>

      <div className="admin-header-spacer" />

      <div className="admin-header-actions">
        <button type="button" className="admin-header-btn" onClick={onToggleTheme} aria-label="Toggle theme">
          {I.theme}
        </button>
        <button type="button" className="admin-header-btn" aria-label="Notifikasi">
          {I.bell}
          <span className="admin-notif-dot" aria-hidden="true" />
        </button>
        <div className="admin-header-user">
          <div className="admin-user-avatar">{initials}</div>
          <div>
            <div className="admin-user-name">{user?.nama_lengkap || user?.username || 'Admin'}</div>
            <div className="admin-user-role">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AdminLayout({ user, onLogout, renderPage }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [collapsed,  setCollapsed]  = useState(false)
  const [theme,      setTheme]      = useState(() => localStorage.getItem(THEME_KEY) || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const handleToggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), [])

  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem('presensi_lab_rajasa:auth_token')
        || localStorage.getItem('auth_token')
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
    } catch { /* ignore */ }
    localStorage.removeItem('presensi_lab_rajasa:auth_token')
    localStorage.removeItem('presensi_lab_rajasa:auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    if (typeof onLogout === 'function') onLogout()
  }, [onLogout])

  return (
    <div className={`admin-layout${collapsed ? ' collapsed' : ''}`}>
      <AdminSidebar
        collapsed={collapsed}
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={handleLogout}
        user={user}
      />
      <AdminHeader
        onToggle={() => setCollapsed(p => !p)}
        activePage={activePage}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        user={user}
      />
      <main className="admin-content">
        <div className="admin-page">
          {typeof renderPage === 'function' ? renderPage(activePage, setActivePage) : null}
        </div>
      </main>
    </div>
  )
}
