/**
 * GuruLayout.jsx
 * Root layout untuk role guru — SMK Rajasa Presensi
 * Mengikuti pola AdminLayout/SiswaLayout: sidebar + header fixed + content slot
 *
 * Menu sidebar:
 *   Overview  : Dashboard
 *   Presensi  : Sesi Aktif, Rekap Kehadiran
 *   Siswa     : Early Warning, Logbook PKL, E-Izin
 *   Sistem    : Pengaturan Akun
 *
 * @author development
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import NotifikasiBell from '../../components/shared/NotifikasiBell.jsx'
import './GuruLayout.css'

const THEME_KEY = 'rajasa-presensi-theme'

// ── Icons ─────────────────────────────────────────────────────────────────────
const I = {
  menu:    <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
  dash:    <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>,
  sesi:    <svg viewBox="0 0 24 24"><path d="M19 3h-4.18A3 3 0 0 0 9.18 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 18H5V5h2v3h10V5h2v16z"/></svg>,
  rekap:   <svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>,
  alert:   <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>,
  logbook: <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>,
  chat:    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>,
  game:    <svg viewBox="0 0 24 24"><path d="M20.5 3H3.5C2.1 3 1 4.1 1 5.5v13C1 19.9 2.1 21 3.5 21h17c1.4 0 2.5-1.1 2.5-2.5v-13C23 4.1 21.9 3 20.5 3zM11 14H9v2H7v-2H5v-2h2v-2h2v2h2v2zm4-1c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3 3c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/></svg>,
  izin:    <svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>,
  setting: <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.01 7.01 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z"/></svg>,
  logout:  <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/></svg>,
  bell:    <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
  theme:   <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
  school:  <svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>,
}

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: I.dash },
    ],
  },
  {
    label: 'Presensi',
    items: [
      { id: 'sesi',  label: 'Sesi Presensi', icon: I.sesi },
      { id: 'rekap', label: 'Rekap Kehadiran', icon: I.rekap },
    ],
  },
  {
    label: 'Siswa',
    items: [
      { id: 'warning', label: 'Early Warning', icon: I.alert },
      { id: 'logbook', label: 'Logbook PKL',   icon: I.logbook },
      { id: 'izin',          label: 'E-Izin',            icon: I.izin },
      { id: 'communication', label: 'Communication Hub', icon: I.chat },
      { id: 'gamifikasi',    label: 'Gamifikasi',         icon: I.game },
    ],
  },
  {
    label: 'Akun',
    items: [
      { id: 'akun', label: 'Pengaturan Akun', icon: I.setting },
    ],
  },
]

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  sesi:      'Sesi Presensi',
  rekap:     'Rekap Kehadiran',
  warning:   'Early Warning',
  logbook:   'Logbook PKL',
  izin:          'E-Izin',
  communication: 'Communication Hub',
  gamifikasi:    'Gamifikasi',
  akun:      'Pengaturan Akun',
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function GuruSidebar({ collapsed, activePage, onPageChange, onLogout }) {
  return (
    <aside class="guru-sidebar">
      <div class="guru-sidebar-brand">
        <img
          src="/images/logo/Rajasa-Logo.png"
          alt="SMK Rajasa"
          class="guru-sidebar-brand-img"
        />
        {!collapsed && (
          <div class="guru-sidebar-brand-text">
            <h1>Presensi Lab</h1>
            <p>SMK Rajasa Surabaya</p>
          </div>
        )}
      </div>

      <nav class="guru-sidebar-nav">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <div class="guru-nav-section-label">{section.label}</div>
            )}
            {section.items.map(item => (
              <button
                key={item.id}
                type="button"
                class={`guru-nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onPageChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span class="guru-nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div class="guru-sidebar-footer">
        <button type="button" class="guru-logout-btn" onClick={onLogout}
          title={collapsed ? 'Keluar' : undefined}>
          <span class="guru-nav-icon">{I.logout}</span>
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function GuruHeader({ onToggle, activePage, onToggleTheme, user }) {
  const initials = (user?.nama_lengkap || user?.username || 'G').charAt(0).toUpperCase()

  return (
    <header class="guru-header">
      <button type="button" class="guru-header-toggle" onClick={onToggle}>
        {I.menu}
      </button>

      <div>
        <div class="guru-header-title">{PAGE_TITLES[activePage] ?? 'Guru'}</div>
        <div class="guru-header-breadcrumb">
          Guru / {PAGE_TITLES[activePage] ?? activePage}
        </div>
      </div>

      <div class="guru-header-spacer" />

      <div class="guru-header-actions">
        <button type="button" class="guru-header-btn" onClick={onToggleTheme}>
          {I.theme}
        </button>
        <NotifikasiBell
          btnClassName="guru-header-btn"
        />
        <div class="guru-header-user">
          <div class="guru-user-avatar">{initials}</div>
          <div>
            <div class="guru-user-name">{user?.nama_lengkap || user?.username || 'Guru'}</div>
            <div class="guru-user-role">Guru Pembimbing</div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ── Logout Overlay ────────────────────────────────────────────────────────────
function LogoutOverlay({ state, onConfirm, onCancel }) {
  if (state === 'idle') return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem', backdropFilter: 'blur(3px)',
      fontFamily: "'Poppins', sans-serif",
    }} onClick={state === 'confirming' ? onCancel : undefined}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        width: '100%', maxWidth: '360px', overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>

        {state === 'confirming' && (
          <>
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: '#dc2626' }}>
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Keluar dari sistem?</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Sesi aktif akan diakhiri.</p>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
              padding: '0.875rem 1.5rem 1.25rem', borderTop: '1px solid #e2e8f0',
            }}>
              <button onClick={onCancel} style={{
                padding: '0.45rem 1rem', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #e2e8f0', background: 'transparent',
                fontFamily: "'Poppins', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#475569',
              }}>Batal</button>
              <button onClick={onConfirm} style={{
                padding: '0.45rem 1.125rem', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #dc2626', background: '#dc2626',
                fontFamily: "'Poppins', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: '#fff',
              }}>Ya, Keluar</button>
            </div>
          </>
        )}

        {state === 'loading' && (
          <div style={{
            padding: '2.25rem 1.5rem 1.75rem', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: 40, height: 40, border: '3px solid #e2e8f0',
              borderTopColor: '#0f766e', borderRadius: '50%',
              animation: 'guruSpin 0.75s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Sedang keluar…</p>
            <button onClick={onCancel} style={{
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

// ── Main Export ───────────────────────────────────────────────────────────────
export default function GuruLayout({ user, onLogout, renderPage }) {
  const [activePage,  setActivePage]  = useState('dashboard')
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [theme,       setTheme]       = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [logoutState, setLogoutState] = useState('idle')
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

  const handleLogoutConfirm = useCallback(async () => {
    setLogoutState('loading')
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false
    try {
      const token = localStorage.getItem('presensi_lab_rajasa:auth_token') || localStorage.getItem('auth_token')
      await fetch('/api/auth/logout', {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
    } catch (err) {
      if (err?.name === 'AbortError') cancelled = true
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
    abortRef.current?.abort()
    abortRef.current = null
    setLogoutState('idle')
  }, [])

  return (
    <div class={`guru-layout${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {mobileOpen && (
        <div class="guru-mobile-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <GuruSidebar
        collapsed={collapsed}
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={() => setLogoutState('confirming')}
      />
      <GuruHeader
        onToggle={handleToggle}
        activePage={activePage}
        onToggleTheme={handleToggleTheme}
        user={user}
      />
      <main class="guru-content">
        {typeof renderPage === 'function' ? renderPage(activePage, setActivePage) : null}
      </main>
      <LogoutOverlay
        state={logoutState}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  )
}
