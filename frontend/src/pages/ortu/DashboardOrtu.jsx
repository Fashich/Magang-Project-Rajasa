/**
 * DashboardOrtu.jsx
 * Dashboard untuk role ortu/wali_murid
 *
 * Karena tidak ada relasi ortu↔siswa di database,
 * orang tua input NIS anak untuk memantau kehadiran.
 *
 * Fitur:
 *   - Input NIS anak → simpan di localStorage
 *   - Ringkasan kehadiran anak
 *   - Riwayat presensi 30 hari terakhir
 *   - Status logbook PKL anak
 *   - Communication Hub (bisa kirim tiket ke guru/admin)
 *
 * @author development
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import CommunicationHub from '../admin/CommunicationHub'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '/api'
const NIS_KEY = 'rajasa_ortu_nis'
const THEME_KEY = 'presensi_lab_rajasa:theme'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token') || ''
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Styles inline ─────────────────────────────────────────────────────────────
const colors = {
  primary:  '#0284c7',
  pLight:   '#e0f2fe',
  success:  '#15803d',
  warning:  '#d97706',
  danger:   '#dc2626',
  muted:    '#64748b',
  surface:  '#ffffff',
  bg:       '#f0f9ff',
  border:   '#e2e8f0',
  text:     '#0f172a',
}

const STATUS_CLR = {
  hadir:    colors.success,
  terlambat:colors.warning,
  alpha:    colors.danger,
  sakit:    '#0284c7',
  izin:     '#7c3aed',
}

const STATUS_LBL = {
  hadir: 'Hadir', terlambat: 'Terlambat', alpha: 'Alpha', sakit: 'Sakit', izin: 'Izin',
}

// ── Layout Shell ──────────────────────────────────────────────────────────────

function OrtuLayout({ user, onLogout, children, activePage, setActivePage }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const initials = (user?.nama_lengkap || user?.username || 'O').charAt(0).toUpperCase()

  const navItems = [
    { id: 'dashboard',     label: 'Dashboard',         icon: '🏠' },
    { id: 'presensi',      label: 'Riwayat Presensi',  icon: '📅' },
    { id: 'logbook',       label: 'Logbook PKL',       icon: '📒' },
    { id: 'communication', label: 'Communication Hub', icon: '💬' },
  ]

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: colors.bg, fontFamily: "'Poppins', sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: collapsed ? 72 : 240,
        background: colors.surface, borderRight: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column', zIndex: 100,
        transition: 'width 0.2s ease', overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0 1rem', height: 64, borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '1.125rem',
          }}>🏫</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: colors.text, whiteSpace: 'nowrap' }}>
                Presensi Lab
              </div>
              <div style={{ fontSize: '0.7rem', color: colors.muted, whiteSpace: 'nowrap' }}>
                Portal Orang Tua
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', padding: '0.625rem 1rem', border: 'none',
                background: activePage === item.id ? colors.pLight : 'transparent',
                color: activePage === item.id ? colors.primary : colors.muted,
                fontFamily: "'Poppins', sans-serif", fontSize: '0.8125rem',
                fontWeight: activePage === item.id ? 600 : 500,
                cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
                borderLeft: activePage === item.id ? `3px solid ${colors.primary}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0.75rem', borderTop: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <button onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              width: '100%', padding: '0.625rem 0.75rem', border: 'none',
              background: 'transparent', fontFamily: "'Poppins', sans-serif",
              fontSize: '0.8125rem', fontWeight: 500, color: colors.muted,
              cursor: 'pointer', borderRadius: 8, transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = colors.danger }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.muted }}>
            <span style={{ flexShrink: 0 }}>🚪</span>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: collapsed ? 72 : 240, right: 0,
        height: 64, background: colors.surface, borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.5rem 0 1rem',
        zIndex: 90, transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        <button onClick={() => setCollapsed(p => !p)} style={{
          width: 36, height: 36, border: 'none', background: 'transparent',
          borderRadius: 8, cursor: 'pointer', fontSize: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>☰</button>

        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: colors.text }}>
            {{ dashboard: 'Dashboard', presensi: 'Riwayat Presensi',
               logbook: 'Logbook PKL', communication: 'Communication Hub' }[activePage]}
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.muted }}>
            Orang Tua / {{ dashboard: 'Dashboard', presensi: 'Riwayat Presensi',
               logbook: 'Logbook PKL', communication: 'Communication Hub' }[activePage]}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: colors.primary,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text, whiteSpace: 'nowrap' }}>
              {user?.nama_lengkap || user?.username || 'Orang Tua'}
            </div>
            <div style={{ fontSize: '0.7rem', color: colors.muted }}>Orang Tua / Wali</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{
        marginLeft: collapsed ? 72 : 240, marginTop: 64,
        minHeight: 'calc(100vh - 64px)', padding: '1.5rem',
        transition: 'margin-left 0.2s ease',
      }}>
        {children}
      </main>
    </div>
  )
}

// ── NIS Input Card ────────────────────────────────────────────────────────────

function NisInputCard({ savedNis, onSave }) {
  const [input, setInput] = useState(savedNis || '')
  const [err,   setErr]   = useState('')

  function handleSave() {
    if (!input.trim()) { setErr('NIS tidak boleh kosong.'); return }
    onSave(input.trim())
    setErr('')
  }

  return (
    <div style={{
      background: colors.pLight, border: `1px solid ${colors.primary}`,
      borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem',
    }}>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: colors.primary }}>
        👦 Masukkan NIS Anak untuk Memantau Kehadiran
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Contoh: 12345"
          value={input} onInput={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={{
            padding: '0.55rem 0.75rem', border: `1px solid ${colors.border}`,
            borderRadius: 8, fontFamily: "'Poppins', sans-serif", fontSize: '0.875rem',
            color: colors.text, background: '#fff', flex: 1, minWidth: 160,
          }} />
        <button onClick={handleSave} style={{
          padding: '0.55rem 1rem', background: colors.primary, color: '#fff',
          border: 'none', borderRadius: 8, fontFamily: "'Poppins', sans-serif",
          fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
        }}>🔍 Cari</button>
      </div>
      {err && <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: colors.danger }}>{err}</p>}
      {savedNis && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: colors.muted }}>
          Saat ini memantau NIS: <strong>{savedNis}</strong>
          <button onClick={() => onSave('')}
            style={{ marginLeft: '0.5rem', background: 'none', border: 'none',
              color: colors.danger, cursor: 'pointer', fontSize: '0.75rem' }}>
            (Ganti)
          </button>
        </p>
      )}
    </div>
  )
}

// ── Page: Dashboard ───────────────────────────────────────────────────────────

function PageDashboard({ nis, onSetPage }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const load = useCallback(async () => {
    if (!nis) return
    setLoading(true); setErr('')
    try {
      const res = await apiFetch(`/siswa/dashboard?nis=${encodeURIComponent(nis)}`)
      setData(res.data ?? res)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }, [nis])

  useEffect(() => { load() }, [load])

  const card = (label, value, icon, color) => (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.border}`,
      borderLeft: `3px solid ${color}`, borderRadius: 12, padding: '1rem 1.25rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text, lineHeight: 1 }}>
          {value ?? 0}
        </div>
        <div style={{ fontSize: '0.75rem', color: colors.muted, marginTop: '0.2rem' }}>{label}</div>
      </div>
    </div>
  )

  if (!nis) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: colors.muted }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👦</div>
      <p style={{ fontWeight: 600 }}>Masukkan NIS anak di atas untuk melihat data kehadiran.</p>
    </div>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: colors.muted }}>Memuat data…</div>
  if (err) return (
    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5',
      borderRadius: 10, color: colors.danger, fontSize: '0.875rem' }}>
      {err} — Pastikan NIS yang dimasukkan benar.
    </div>
  )
  if (!data) return null

  const totals = data.totals ?? {}
  const siswa  = data.siswa ?? {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Info siswa */}
      <div style={{
        background: colors.pLight, border: `1px solid ${colors.primary}`,
        borderRadius: 12, padding: '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: colors.primary,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', fontWeight: 700, flexShrink: 0,
        }}>
          {(siswa.nama_lengkap || '?').charAt(0)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: colors.text }}>
            {siswa.nama_lengkap || '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: colors.muted }}>
            NIS: {siswa.nis || nis} · {siswa.kelas_aktif || siswa.rombel || '—'}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem' }}>
        {card('Hadir Tepat Waktu', totals.tepat_waktu, '✅', colors.success)}
        {card('Terlambat',         totals.terlambat,   '⏰', colors.warning)}
        {card('Alpha',             totals.alpha,       '❌', colors.danger)}
        {card('Sakit',             totals.sakit,       '🏥', '#0284c7')}
        {card('Izin',              totals.izin,        '📋', '#7c3aed')}
      </div>

      {/* Tingkat kehadiran */}
      {totals.rate_hadir !== undefined && (
        <div style={{
          background: colors.surface, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tingkat Kehadiran</span>
            <span style={{
              fontWeight: 700, fontSize: '1.125rem',
              color: totals.rate_hadir >= 75 ? colors.success : colors.danger,
            }}>
              {totals.rate_hadir}%
            </span>
          </div>
          <div style={{ height: 8, background: colors.border, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, transition: 'width 0.5s',
              width: `${totals.rate_hadir ?? 0}%`,
              background: totals.rate_hadir >= 75 ? colors.success : colors.danger,
            }} />
          </div>
          {totals.rate_hadir < 75 && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: colors.danger }}>
              ⚠️ Tingkat kehadiran di bawah 75%. Harap perhatikan kehadiran anak.
            </p>
          )}
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        {[
          { icon: '📅', label: 'Lihat Riwayat Presensi', page: 'presensi', color: colors.primary },
          { icon: '📒', label: 'Lihat Logbook PKL', page: 'logbook', color: '#7c3aed' },
          { icon: '💬', label: 'Hubungi Guru/Admin', page: 'communication', color: '#0891b2' },
        ].map(item => (
          <button key={item.page} onClick={() => onSetPage(item.page)} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '1rem', background: colors.surface, border: `1px solid ${colors.border}`,
            borderRadius: 12, cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
            fontSize: '0.875rem', fontWeight: 600, color: item.color,
            boxShadow: '0 1px 3px rgba(0,0,0,.06)', transition: 'box-shadow 0.15s',
          }}>
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page: Presensi ────────────────────────────────────────────────────────────

function PagePresensi({ nis }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(false)
  const [filter,  setFilter]  = useState('semua')

  const load = useCallback(async () => {
    if (!nis) return
    setLoading(true)
    try {
      const res = await apiFetch(`/siswa/presensi?filter=${filter}&page=1&per_page=30&nis=${encodeURIComponent(nis)}`)
      setRows(res.data?.presensi ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [nis, filter])

  useEffect(() => { load() }, [load])

  if (!nis) return <div style={{ textAlign: 'center', padding: '3rem', color: colors.muted }}>
    Masukkan NIS anak di atas terlebih dahulu.
  </div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 12, padding: '0.875rem 1.25rem',
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        {['semua','hadir','terlambat','alpha','sakit','izin'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.35rem 0.875rem', border: `1px solid ${filter === f ? colors.primary : colors.border}`,
            borderRadius: 999, background: filter === f ? colors.primary : 'transparent',
            color: filter === f ? '#fff' : colors.muted, fontFamily: "'Poppins', sans-serif",
            fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {f === 'semua' ? 'Semua' : STATUS_LBL[f] ?? f}
          </button>
        ))}
        <button onClick={load} style={{
          marginLeft: 'auto', padding: '0.35rem 0.875rem',
          border: `1px solid ${colors.border}`, borderRadius: 8,
          background: 'transparent', color: colors.muted, fontFamily: "'Poppins', sans-serif",
          fontSize: '0.8rem', cursor: 'pointer',
        }}>↺ Refresh</button>
      </div>

      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: colors.muted }}>Memuat…</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: colors.muted }}>
            Tidak ada data presensi.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                {['Tanggal','Ruangan','Jam Masuk','Status','Keterangan'].map(h => (
                  <th key={h} style={{
                    padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.7rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: colors.muted, background: colors.bg, borderBottom: `1px solid ${colors.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{fmtDate(r.tanggal)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{r.ruangan || r.ruangan_nama || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                    {r.jam_scan ? new Date(r.jam_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.625rem',
                      borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, color: '#fff',
                      background: STATUS_CLR[r.status] ?? '#64748b',
                    }}>
                      {STATUS_LBL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: colors.muted, fontSize: '0.8rem' }}>
                    {r.keterangan || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Page: Logbook ─────────────────────────────────────────────────────────────

function PageLogbook({ nis }) {
  const [items,   setItems]   = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!nis) return
    setLoading(true)
    try {
      // Cari siswa_id dari NIS dulu
      const cari = await apiFetch(`/users?search=${encodeURIComponent(nis)}&user_type=siswa`)
      const siswaId = cari.data?.items?.[0]?.siswa_id
      if (!siswaId) throw new Error('Siswa tidak ditemukan')
      const res = await apiFetch(`/logbook?siswa_id=${siswaId}&per_page=20`)
      setItems(res.data?.items ?? [])
      setSummary(res.data?.summary ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [nis])

  useEffect(() => { load() }, [load])

  const STATUS_CLR_LB = { draft:'#64748b', menunggu_review:'#d97706', disetujui:'#15803d', ditolak:'#dc2626' }
  const STATUS_LBL_LB = { draft:'Draft', menunggu_review:'Menunggu', disetujui:'Disetujui', ditolak:'Dikembalikan' }

  if (!nis) return <div style={{ textAlign: 'center', padding: '3rem', color: colors.muted }}>
    Masukkan NIS anak di atas terlebih dahulu.
  </div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.875rem' }}>
        {[
          { label: 'Total',       value: summary.total,     color: colors.primary },
          { label: 'Disetujui',   value: summary.disetujui, color: colors.success },
          { label: 'Menunggu',    value: summary.menunggu,  color: colors.warning },
          { label: 'Dikembalikan',value: summary.ditolak,   color: colors.danger },
        ].map(s => (
          <div key={s.label} style={{
            background: colors.surface, border: `1px solid ${colors.border}`,
            borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '1rem',
            textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value ?? 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.muted, marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabel */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: colors.muted }}>Memuat logbook…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: colors.muted }}>
            Belum ada entri logbook.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                {['Tanggal','Lokasi','Status','Catatan Guru'].map(h => (
                  <th key={h} style={{
                    padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.7rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: colors.muted, background: colors.bg, borderBottom: `1px solid ${colors.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.logbook_id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{fmtDate(item.tanggal)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{item.lokasi || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.625rem',
                      borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, color: '#fff',
                      background: STATUS_CLR_LB[item.status] ?? '#64748b',
                    }}>
                      {STATUS_LBL_LB[item.status] ?? item.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: colors.muted, fontSize: '0.8rem',
                    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.catatan_guru || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function DashboardOrtu({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [nis,        setNis]        = useState(() => localStorage.getItem(NIS_KEY) || '')

  function handleSetNis(val) {
    setNis(val)
    if (val) localStorage.setItem(NIS_KEY, val)
    else localStorage.removeItem(NIS_KEY)
  }

  return (
    <OrtuLayout
      user={user}
      onLogout={onLogout}
      activePage={activePage}
      setActivePage={setActivePage}
    >
      {/* NIS input — tampil di semua halaman kecuali communication */}
      {activePage !== 'communication' && (
        <NisInputCard savedNis={nis} onSave={handleSetNis} />
      )}

      {activePage === 'dashboard'     && <PageDashboard  nis={nis} onSetPage={setActivePage} />}
      {activePage === 'presensi'      && <PagePresensi   nis={nis} />}
      {activePage === 'logbook'       && <PageLogbook    nis={nis} />}
      {activePage === 'communication' && <CommunicationHub />}
    </OrtuLayout>
  )
}
