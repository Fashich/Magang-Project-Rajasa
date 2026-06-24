/**
 * SiswaLayout.jsx — revisi
 *
 * Upgrade dari arsitektur 2-level (header tab + sidebar) ke
 * sidebar tunggal seperti GuruLayout/AdminLayout.
 *
 * Menu:
 *   Overview  : Dashboard (PresensiCounter + ringkasan)
 *   Presensi  : Rekap Presensi (TablePresensi), Kalender Akademik
 *   Kegiatan  : E-Izin, Logbook PKL
 *
 * Komponen lama (PresensiCounter, KalenderAkademik, TablePresensi)
 * tetap dipakai tanpa perubahan.
 *
 * @author development
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { authApi } from '../../utils/api'
import './SiswaLayout.css'

const THEME_KEY = 'rajasa-presensi-theme'

// ── Icons ─────────────────────────────────────────────────────────────────────
const I = {
  menu:    <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>,
  dash:    <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>,
  rekap:   <svg viewBox="0 0 24 24"><path d="M19 3h-4.18A3 3 0 0 0 9.18 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 18H5V5h2v3h10V5h2v16z"/></svg>,
  kalender:<svg viewBox="0 0 24 24"><path d="M20 3h-1V1h-2v2H7V1H5v2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 18H4V8h16v13z"/></svg>,
  izin:    <svg viewBox="0 0 24 24"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>,
  logbook: <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>,
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
      { id: 'rekap',    label: 'Rekap Presensi',    icon: I.rekap },
      { id: 'kalender', label: 'Kalender Akademik', icon: I.kalender },
    ],
  },
  {
    label: 'Kegiatan',
    items: [
      { id: 'izin',    label: 'E-Izin',      icon: I.izin },
      { id: 'logbook', label: 'Logbook PKL', icon: I.logbook },
    ],
  },
]

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  rekap:     'Rekap Presensi',
  kalender:  'Kalender Akademik',
  izin:      'E-Izin',
  logbook:   'Logbook PKL',
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SiswaSidebar({ collapsed, activePage, onPageChange, onLogout }) {
  return (
    <aside className={`siswa-sidebar-new${collapsed ? ' collapsed' : ''}`}>
      <div className="siswa-brand">
        <div className="siswa-brand-icon">{I.school}</div>
        {!collapsed && (
          <div className="siswa-brand-text">
            <strong>Presensi Lab</strong>
            <span>SMK Rajasa Surabaya</span>
          </div>
        )}
      </div>

      <nav className="siswa-nav">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <div className="siswa-nav-section-label">{section.label}</div>
            )}
            {section.items.map(item => (
              <button
                key={item.id}
                type="button"
                className={`siswa-nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onPageChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="siswa-nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="siswa-sidebar-footer">
        <button type="button" className="siswa-logout-btn" onClick={onLogout}
          title={collapsed ? 'Keluar' : undefined}>
          <span className="siswa-nav-icon">{I.logout}</span>
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function SiswaHeader({ activePage, onToggle, onToggleTheme, user }) {
  const initials = (user?.nama_lengkap || user?.username || 'S').charAt(0).toUpperCase()

  return (
    <header className="siswa-header-new">
      <button type="button" className="siswa-header-toggle" onClick={onToggle}>
        {I.menu}
      </button>

      <div>
        <div className="siswa-header-title">{PAGE_TITLES[activePage] ?? 'Siswa'}</div>
        <div className="siswa-header-breadcrumb">
          Siswa / {PAGE_TITLES[activePage] ?? activePage}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="siswa-header-actions">
        <button type="button" className="siswa-header-btn" onClick={onToggleTheme}>
          {I.theme}
        </button>
        <button type="button" className="siswa-header-btn">
          {I.bell}
        </button>
        <div className="siswa-header-user">
          <div className="siswa-user-avatar">{initials}</div>
          <div>
            <div className="siswa-user-name">{user?.nama_lengkap || user?.username || 'Siswa'}</div>
            <div className="siswa-user-role">Siswa</div>
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
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Keluar dari sistem?
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Sesi aktif akan diakhiri.
                </p>
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
            padding: '2.25rem 1.5rem 1.75rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: 40, height: 40, border: '3px solid #e2e8f0',
              borderTopColor: '#0284c7', borderRadius: '50%',
              animation: 'sSpin 0.75s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              Sedang keluar…
            </p>
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
export default function SiswaLayout({ user, onLogout, renderPage }) {
  const [activePage,  setActivePage]  = useState('dashboard')
  const [collapsed,   setCollapsed]   = useState(false)
  const [theme,       setTheme]       = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [logoutState, setLogoutState] = useState('idle')
  const abortRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const handleToggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), [])

  const handleLogoutConfirm = useCallback(async () => {
    setLogoutState('loading')
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false
    try {
      await authApi.logout()
    } catch (err) {
      if (err?.name === 'AbortError') cancelled = true
    }
    if (cancelled) return
    setLogoutState('idle')
    if (typeof onLogout === 'function') onLogout()
  }, [onLogout])

  const handleLogoutCancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setLogoutState('idle')
  }, [])

  return (
    <div className={`siswa-layout-new${collapsed ? ' collapsed' : ''}`}>
      <SiswaSidebar
        collapsed={collapsed}
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={() => setLogoutState('confirming')}
      />
      <SiswaHeader
        activePage={activePage}
        onToggle={() => setCollapsed(p => !p)}
        onToggleTheme={handleToggleTheme}
        user={user}
      />
      <main className="siswa-content-new">
        {typeof renderPage === 'function' ? renderPage(activePage) : null}
      </main>
      <LogoutOverlay
        state={logoutState}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  )
}
