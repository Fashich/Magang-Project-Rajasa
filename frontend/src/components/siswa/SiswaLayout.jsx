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
import NotifikasiBell from '../shared/NotifikasiBell.jsx'
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
  chat:    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>,
  game:    <svg viewBox="0 0 24 24"><path d="M20.5 3H3.5C2.1 3 1 4.1 1 5.5v13C1 19.9 2.1 21 3.5 21h17c1.4 0 2.5-1.1 2.5-2.5v-13C23 4.1 21.9 3 20.5 3zM11 14H9v2H7v-2H5v-2h2v-2h2v2h2v2zm4-1c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3 3c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/></svg>,
  logout:  <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z"/></svg>,
  bell:    <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
  theme:   <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
  school:  <svg viewBox="0 0 24 24"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>,
}

// ── Theme icon: bulan sabit (dark) + matahari (light) diagonal split ──────────
function SunMoonIcon({ theme }) {
  const dark = theme === 'dark'
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: '100%', height: '100%' }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="5.36" y1="18.64" x2="18.64" y2="5.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Bulan sabit — nyala penuh saat dark mode, redup saat light */}
      <g opacity={dark ? 1 : 0.28} style={{ transition: 'opacity 0.25s' }}>
        <g transform="scale(0.33) translate(9,12)">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
        </g>
      </g>
      {/* Matahari — nyala penuh saat light mode, redup saat dark */}
      <g opacity={dark ? 0.28 : 1} style={{ transition: 'opacity 0.25s' }}>
        <circle cx="16.5" cy="16" r="2" fill="currentColor"/>
        <line x1="16.5" y1="19.3" x2="16.5" y2="20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="19.7" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18.6" y1="18.1" x2="19.7" y2="19.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="14.4" y1="18.1" x2="13.3" y2="19.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18.6" y1="13.9" x2="19.7" y2="12.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  )
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
      { id: 'logbook',       label: 'Logbook PKL',         icon: I.logbook },
      { id: 'communication', label: 'Pusat Komunikasi', icon: I.chat },
      { id: 'gamifikasi',    label: 'Gamifikasi',         icon: I.game },
    ],
  },
]

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  rekap:     'Rekap Presensi',
  kalender:  'Kalender Akademik',
  izin:      'E-Izin',
  logbook:   'Logbook PKL',
  communication: 'Pusat Komunikasi',
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SiswaSidebar({ collapsed, activePage, onPageChange, onLogout }) {
  return (
    <aside className={`siswa-sidebar-new${collapsed ? ' collapsed' : ''}`}>
      <div className="siswa-brand">
        <img
          src="/images/logo/Rajasa-Logo.png"
          alt="SMK Rajasa"
          className="siswa-brand-img"
        />
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
function SiswaHeader({ activePage, onToggle, onToggleTheme, theme, user }) {
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
          <SunMoonIcon theme={theme} />
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
  const [collapsed,   setCollapsed]   = useState(() => {
    // Auto-collapse at tablet width on first render (no flash)
    if (typeof window === 'undefined') return false
    const w = window.innerWidth
    return w >= 768 && w < 1024
  })
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [theme,       setTheme]       = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [logoutState, setLogoutState] = useState('idle')
  const abortRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => { setMobileOpen(false) }, [activePage])

  // Auto-adjust layout on window resize
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 768) {
        // Mobile: drawer mode, reset collapsed so labels render correctly
        setCollapsed(false)
      } else if (w < 1024) {
        // Tablet: auto-collapse sidebar, close any open drawer
        setCollapsed(true)
        setMobileOpen(false)
      } else {
        // Desktop: close mobile drawer if somehow open
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    <div className={`siswa-layout-new${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {mobileOpen && (
        <div className="siswa-mobile-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <SiswaSidebar
        collapsed={collapsed}
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={() => setLogoutState('confirming')}
      />
      <SiswaHeader
        activePage={activePage}
        onToggle={handleToggle}
        onToggleTheme={handleToggleTheme}
        theme={theme}
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
