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
import { T } from '../../utils/lang.js'
import ProfileCard from '../../components/shared/ProfileCard.jsx'
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

// ── Theme icon: split background + bulan sabit perak (dark) + matahari kuning (light) ──
function SunMoonIcon({ theme }) {
  const dark = theme === 'dark'
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <defs>
        {/* Clip ke rounded rect agar sudut ikon rapi */}
        <clipPath id="__smicon_clip">
          <rect width="24" height="24" rx="5.3"/>
        </clipPath>
      </defs>
      <g clipPath="url(#__smicon_clip)">
        {/* ── Background split diagonal ── */}
        {/* Kiri-atas: sisi bulan */}
        <path d="M0,0 L24,0 L0,24 Z"
          fill={dark ? '#0A0F1E' : '#1E3A5F'}/>
        {/* Kanan-bawah: sisi matahari */}
        <path d="M24,0 L24,24 L0,24 Z"
          fill={dark ? '#1A2744' : '#7DD3FC'}/>

        {/* ── Bintang-bintang (hanya dark mode, area kiri-atas) ── */}
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

        {/* ── Bulan sabit KIRI-ATAS ── */}
        <g opacity={dark ? 1 : 0.18} style={{ transition: 'opacity 0.25s' }}>
          <g transform="scale(0.6)">
            <path d="M3 12.79A9 9 0 1 0 12.79 3 7 7 0 0 1 3 12.79z"
              fill={dark ? '#E2E8F0' : 'white'}/>
          </g>
        </g>

        {/* ── Matahari KANAN-BAWAH ── */}
        <g opacity={dark ? 0.18 : 1} style={{ transition: 'opacity 0.25s' }}>
          <circle cx="16" cy="16" r="3.5" fill={dark ? '#94A3B8' : '#FBBF24'}/>
          <line x1="16"    y1="20.5"  x2="16"    y2="23"    stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="20.5"  y1="16"    x2="23"    y2="16"    stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="19.47" y1="19.47" x2="21.19" y2="21.19" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="12.53" y1="19.47" x2="10.81" y2="21.19" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="19.47" y1="12.53" x2="21.19" y2="10.81" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
        </g>

        {/* ── Garis pemisah diagonal ── */}
        <line x1="0" y1="24" x2="24" y2="0"
          stroke="rgba(255,255,255,0.18)" strokeWidth="0.7"/>
      </g>
    </svg>
  )
}

// ── Language config ───────────────────────────────────────────────────────────
const LANG_KEY    = 'rajasa-lang'
const LANGS       = ['id', 'jw', 'md']
const LANG_LABELS = { id: 'ID', jw: 'JW', md: 'MD' }
const LANG_NAMES  = { id: 'Indonesia', jw: 'Basa Jawa', md: 'Basa Madura' }
const LANG_FLAGS  = { id: '🇮🇩', jw: '🏛️', md: '🏝️' }

function LangIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
      <path d="M4 17L7.5 8L11 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.4 14h4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="13.5" y1="5" x2="13.5" y2="19" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.28"/>
      <path d="M15.5 8.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M18 8.5v2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M15.5 13.5c1.2 1.8 2.5 2.7 2.5 2.7s1.3-0.9 2.5-2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16.3 17.5h3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

/** Dropdown pemilih bahasa — klik icon → muncul pilihan 3 bahasa */
function LangDropdown({ lang, onChangeLang, theme, btnClass }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const dark = theme === 'dark'
  return (
    <div style={{ position:'relative' }} ref={ref}>
      <button type="button" class={btnClass} onClick={() => setOpen(o => !o)}
        title="Ganti bahasa" aria-label="Ganti bahasa"
        style={{ display:'flex', alignItems:'center', gap:'3px', width:'auto', paddingInline:'7px' }}
      >
        <LangIcon/>
        <span style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.05em', lineHeight:1 }}>
          {LANG_LABELS[lang]}
        </span>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0,
          background: dark ? '#1e293b' : '#ffffff',
          border: dark ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius:'12px', boxShadow:'0 10px 32px rgba(0,0,0,0.18)',
          overflow:'hidden', minWidth:'168px', zIndex:999,
        }}>
          {LANGS.map(l => (
            <button key={l} type="button"
              onClick={() => { onChangeLang(l); setOpen(false) }}
              style={{
                display:'flex', alignItems:'center', gap:'9px', width:'100%',
                padding:'10px 14px', border:'none', cursor:'pointer',
                fontFamily:'inherit', textAlign:'left',
                background: l === lang ? (dark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.08)') : 'transparent',
                fontSize:'0.83rem', fontWeight: l === lang ? 600 : 400,
                color: l === lang ? (dark ? '#818cf8' : '#4f46e5') : (dark ? '#cbd5e1' : '#475569'),
              }}
            >
              <span style={{ flex:1 }}>{LANG_NAMES[l]}</span>
              {l === lang && <span style={{ fontWeight:700, fontSize:'0.85rem' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Overview', tKey: 'nav_overview',
    items: [
      { id: 'dashboard', label: 'Dashboard',       tKey: 'dashboard',       icon: I.dash },
    ],
  },
  {
    label: 'Presensi', tKey: 'nav_presensi',
    items: [
      { id: 'sesi',  label: 'Sesi Presensi',   tKey: 'sesi_presensi',   icon: I.sesi },
      { id: 'rekap', label: 'Rekap Kehadiran', tKey: 'rekap_kehadiran', icon: I.rekap },
    ],
  },
  {
    label: 'Siswa', tKey: 'nav_siswa',
    items: [
      { id: 'warning',       label: 'Early Warning',    tKey: 'early_warning',    icon: I.alert },
      { id: 'logbook',       label: 'Logbook PKL',      tKey: 'logbook_pkl',      icon: I.logbook },
      { id: 'izin',          label: 'E-Izin',           tKey: 'e_izin',           icon: I.izin },
      { id: 'communication', label: 'Pusat Komunikasi', tKey: 'pusat_komunikasi', icon: I.chat },
      { id: 'gamifikasi',    label: 'Gamifikasi',       tKey: 'gamifikasi',       icon: I.game },
    ],
  },
  {
    label: 'Akun', tKey: 'nav_akun',
    items: [
      { id: 'akun', label: 'Pengaturan Akun', tKey: 'pengaturan_akun', icon: I.setting },
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
  communication: 'Pusat Komunikasi',
  gamifikasi:    'Gamifikasi',
  akun:      'Pengaturan Akun',
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function GuruSidebar({ collapsed, activePage, onPageChange, onLogout, lang }) {
  const t = T[lang] || T.id
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
              <div class="guru-nav-section-label">{t[section.tKey] ?? section.label}</div>
            )}
            {section.items.map(item => (
              <button
                key={item.id}
                type="button"
                class={`guru-nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onPageChange(item.id)}
                title={collapsed ? (t[item.tKey] ?? item.label) : undefined}
              >
                <span class="guru-nav-icon">{item.icon}</span>
                {!collapsed && <span>{t[item.tKey] ?? item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div class="guru-sidebar-footer">
        <button type="button" class="guru-logout-btn" onClick={onLogout}
          title={collapsed ? (t.keluar ?? 'Keluar') : undefined}>
          <span class="guru-nav-icon">{I.logout}</span>
          {!collapsed && <span>{t.keluar ?? 'Keluar'}</span>}
        </button>
      </div>
    </aside>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function GuruHeader({ onToggle, activePage, onToggleTheme, theme, onChangeLang, lang, user }) {
  const [profileOpen, setProfileOpen] = useState(false)
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
          <SunMoonIcon theme={theme} />
        </button>
        <LangDropdown lang={lang} onChangeLang={onChangeLang} theme={theme} btnClass="guru-header-btn"/>
        <NotifikasiBell
          btnClassName="guru-header-btn"
        />
        <div class="guru-header-user" style={{ position:'relative' }}>
          <button type="button"
            onClick={() => setProfileOpen(o => !o)}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', padding:0 }}
          >
            <div class="guru-user-avatar">{initials}</div>
            <div>
              <div class="guru-user-name">{user?.nama_lengkap || user?.username || 'Guru'}</div>
              <div class="guru-user-role">Guru Pembimbing</div>
            </div>
          </button>
          {profileOpen && (
            <ProfileCard
              onClose={() => setProfileOpen(false)}
              theme={theme}
              userType={user?.user_type ?? 'guru'}
            />
          )}
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
  const [collapsed,   setCollapsed]   = useState(() => {
    // Auto-collapse at tablet width on first render (no flash)
    if (typeof window === 'undefined') return false
    const w = window.innerWidth
    return w >= 768 && w < 1024
  })
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [theme,       setTheme]       = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [lang,        setLang]        = useState(() => localStorage.getItem(LANG_KEY) || 'id')
  const [logoutState, setLogoutState] = useState('idle')
  const abortRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
  }, [lang])

  useEffect(() => { setMobileOpen(false) }, [activePage])

  // Auto-adjust layout on window resize
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 768) {
        // Mobile: use drawer, reset collapsed so drawer shows full labels
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
  const handleChangeLang  = useCallback((l) => setLang(l), [])

  const handleToggle = useCallback(() => {
    // < 768px  → mobile drawer mode (toggle mobileOpen)
    // >= 768px → collapse/expand sidebar (toggle collapsed)
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
        lang={lang}
      />
      <GuruHeader
        onToggle={handleToggle}
        activePage={activePage}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        onChangeLang={handleChangeLang}
        lang={lang}
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
