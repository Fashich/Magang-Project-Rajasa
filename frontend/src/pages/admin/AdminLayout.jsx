/**
 * AdminLayout.jsx
 * Professional admin dashboard layout — SMK Rajasa Presensi
 * Branch: feature/admin-dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import TwoFactorSetup from './TwoFactorSetup.jsx'
import NotifikasiBell from '../../components/shared/NotifikasiBell.jsx'
import './AdminLayout.css'

const THEME_KEY = 'presensi_lab_rajasa:theme'

// ─── Icons ──────────────────────────────────────────────────────────────────
const I = {
  menu:     <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
  dash:     <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>,
  users:    <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  sesi:     <svg viewBox="0 0 24 24"><path d="M19 3h-4.18A3 3 0 0 0 9.18 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 18H5V5h2v3h10V5h2v16z"/></svg>,
  chart:    <svg viewBox="0 0 24 24"><path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16 13h3v6h-3v-6z"/></svg>,
  chartpie: <svg viewBox="0 0 24 24"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/></svg>,
  alert:    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
  report:   <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>,
  izin:     <svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>,
  audit:    <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>,
  setting:  <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.01 7.01 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/></svg>,
  lock:    <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>,
  logout:   <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/></svg>,
  bell:     <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
  theme:    <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
  school:   <svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>,
  logbook:  <svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>,
  chat:     <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>,
  game:     <svg viewBox="0 0 24 24"><path d="M20.5 3H3.5C2.1 3 1 4.1 1 5.5v13C1 19.9 2.1 21 3.5 21h17c1.4 0 2.5-1.1 2.5-2.5v-13C23 4.1 21.9 3 20.5 3zM11 14H9v2H7v-2H5v-2h2v-2h2v2h2v2zm4-1c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3 3c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/></svg>,
}

// ── Theme icon: split background + bulan sabit perak (dark) + matahari kuning (light) ──
function SunMoonIcon({ theme }) {
  const dark = theme === 'dark'
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <defs>
        <clipPath id="__smicon_clip">
          <rect width="24" height="24" rx="5.3"/>
        </clipPath>
      </defs>
      <g clipPath="url(#__smicon_clip)">
        <path d="M0,0 L24,0 L0,24 Z" fill={dark ? '#0A0F1E' : '#1E3A5F'}/>
        <path d="M24,0 L24,24 L0,24 Z" fill={dark ? '#1A2744' : '#7DD3FC'}/>
        {dark && (
          <g fill="white">
            <circle cx="3.5"  cy="2.5"  r="0.5"  opacity="0.92"/>
            <circle cx="11"   cy="2.5"  r="0.38" opacity="0.80"/>
            <circle cx="9"    cy="5.5"  r="0.32" opacity="0.70"/>
            <circle cx="2"    cy="9"    r="0.28" opacity="0.85"/>
            <circle cx="6.5"  cy="11"   r="0.22" opacity="0.60"/>
            <circle cx="4"    cy="15"   r="0.22" opacity="0.55"/>
            <circle cx="1.5"  cy="17.5" r="0.28" opacity="0.65"/>
            <circle cx="8"    cy="8"    r="0.18" opacity="0.72"/>
            <circle cx="0.8"  cy="5"    r="0.18" opacity="0.50"/>
          </g>
        )}
        <g opacity={dark ? 1 : 0.18} style={{ transition: 'opacity 0.25s' }}>
          <g transform="scale(0.6)">
            <path d="M3 12.79A9 9 0 1 0 12.79 3 7 7 0 0 1 3 12.79z"
              fill={dark ? '#E2E8F0' : 'white'}/>
          </g>
        </g>
        <g opacity={dark ? 0.18 : 1} style={{ transition: 'opacity 0.25s' }}>
          <circle cx="16" cy="16" r="3.5" fill={dark ? '#94A3B8' : '#FBBF24'}/>
          <line x1="16"    y1="20.5"  x2="16"    y2="23"    stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="20.5"  y1="16"    x2="23"    y2="16"    stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="19.47" y1="19.47" x2="21.19" y2="21.19" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="12.53" y1="19.47" x2="10.81" y2="21.19" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="19.47" y1="12.53" x2="21.19" y2="10.81" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
        </g>
        <line x1="0" y1="24" x2="24" y2="0" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7"/>
      </g>
    </svg>
  )
}

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard',         label: 'Dashboard',           icon: I.dash },
      { id: 'analitik',          label: 'Analitik Kehadiran',  icon: I.chart },
      { id: 'analitik-prestasi', label: 'Analitik Prestasi',   icon: I.chartpie },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { id: 'sesi',      label: 'Sesi Presensi',   icon: I.sesi },
      { id: 'e-izin',    label: 'E-Izin',           icon: I.izin, badge: null },
      { id: 'peringatan',label: 'Early Warning',    icon: I.alert },
      { id: 'logbook',       label: 'Logbook Praktik',    icon: I.logbook },
      { id: 'communication', label: 'Pusat Komunikasi',  icon: I.chat },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'gamifikasi',label: 'Gamifikasi',        icon: I.game },
      { id: 'users',     label: 'Pengguna',         icon: I.users },
      { id: 'laporan',   label: 'Laporan',           icon: I.report },
      { id: 'audit',     label: 'Audit Trail',       icon: I.audit },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { id: 'settings',  label: 'Pengaturan',       icon: I.setting },
      { id: '2fa',       label: 'Keamanan 2FA',      icon: I.lock ?? '🔐' },
    ],
  },
]

// ─── Logout Overlay ───────────────────────────────────────────────────────────

function LogoutOverlay({ state, onConfirm, onCancel }) {
  if (state === 'idle') return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
        backdropFilter: 'blur(3px)',
        fontFamily: "'Poppins', sans-serif",
      }}
      onClick={state === 'confirming' ? onCancel : undefined}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: '360px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {state === 'confirming' && (
          <>
            <div style={{ padding: '1.5rem 1.5rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: '#dc2626' }}>
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                  Keluar dari sistem?
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Sesi aktif akan diakhiri.
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
              padding: '0.875rem 1.5rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
            }}>
              <button type="button" onClick={onCancel} style={{
                padding: '0.45rem 1rem', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #e2e8f0', background: 'transparent',
                fontFamily: "'Poppins', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#475569',
              }}>Batal</button>
              <button type="button" onClick={onConfirm} style={{
                padding: '0.45rem 1.125rem', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #dc2626', background: '#dc2626',
                fontFamily: "'Poppins', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#fff',
              }}>Ya, Keluar</button>
            </div>
          </>
        )}

        {state === 'loading' && (
          <div style={{
            padding: '2.25rem 1.5rem 1.75rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: 40, height: 40,
              border: '3px solid #e2e8f0',
              borderTopColor: '#dc2626',
              borderRadius: '50%',
              animation: 'adminSpin 0.75s linear infinite',
            }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                Sedang keluar…
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Menghapus sesi, harap tunggu.
              </p>
            </div>
            <button type="button" onClick={onCancel} style={{
              marginTop: '0.25rem',
              padding: '0.4rem 1.25rem', borderRadius: 8, cursor: 'pointer',
              border: '1px solid #e2e8f0', background: 'transparent',
              fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem', fontWeight: 600, color: '#64748b',
            }}>Batalkan</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ collapsed, activePage, onPageChange, onLogout, user }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-icon">
          {window.__RAJASA_LOGO__
            ? <img src="/images/logo/Rajasa-Logo.png" alt="Logo SMK Rajasa" />
            : I.school}
        </div>
        {!collapsed && (
          <div className="admin-sidebar-logo-text">
            <h1>Presensi Lab</h1>
            <p>SMK Rajasa Surabaya</p>
          </div>
        )}
      </div>

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
    dashboard:           'Dashboard',
    analitik:            'Analitik Kehadiran',
    'analitik-prestasi': 'Analitik Prestasi',
    sesi:                'Sesi Presensi',
    'e-izin':            'Portal E-Izin',
    peringatan:          'Early Warning',
    logbook:             'Logbook Praktik',
    communication:       'Pusat Komunikasi',
    users:               'Manajemen Pengguna',
    laporan:             'Laporan',
    audit:               'Audit Trail',
    settings:            'Pengaturan',
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
          <SunMoonIcon theme={theme} />
        </button>
        <NotifikasiBell
          btnClassName="admin-header-btn"
        />
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
  const [activePage,  setActivePage]  = useState('dashboard')
  const [collapsed,   setCollapsed]   = useState(false)
  const [theme,       setTheme]       = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [logoutState, setLogoutState] = useState('idle')
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => { setMobileOpen(false) }, [activePage])

  const handleToggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), [])

  const handleToggle = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileOpen(o => !o)
    } else {
      setCollapsed(o => !o)
    }
  }, [])

  const handleLogoutClick = useCallback(() => {
    setLogoutState('confirming')
  }, [])

  const handleLogoutConfirm = useCallback(async () => {
    setLogoutState('loading')
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false
    try {
      const token = localStorage.getItem('presensi_lab_rajasa:auth_token')
        || localStorage.getItem('auth_token')
      await fetch('/api/auth/logout', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    } catch (err) {
      if (err && err.name === 'AbortError') cancelled = true
    }
    if (cancelled) return
    localStorage.removeItem('presensi_lab_rajasa:auth_token')
    localStorage.removeItem('presensi_lab_rajasa:auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setLogoutState('idle')
    if (typeof onLogout === 'function') onLogout()
  }, [onLogout])

  const handleLogoutCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setLogoutState('idle')
  }, [])

  return (
    <div className={`admin-layout${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {mobileOpen && (
        <div className="admin-mobile-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <AdminSidebar
        collapsed={collapsed}
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={handleLogoutClick}
        user={user}
      />
      <AdminHeader
        onToggle={handleToggle}
        activePage={activePage}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        user={user}
      />
      <main className="admin-content">
        <div className="admin-page">
          {activePage === '2fa'
            ? <TwoFactorSetup />
            : typeof renderPage === 'function' ? renderPage(activePage, setActivePage) : null}
        </div>
      </main>
      <LogoutOverlay
        state={logoutState}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  )
}
