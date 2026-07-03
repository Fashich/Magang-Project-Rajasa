/**
 * AdminDashboardPage.jsx
 * Main overview page for admin dashboard
 * Shows: stat cards, attendance trend chart, rombel breakdown, recent sessions
 * Branch: feature/admin-dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { T } from '../../utils/lang.js'

// ─── API Base URL ──────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || '/api'

// ─── Auth helper ─────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
    || localStorage.getItem('auth_token')
    || null
}

function authHeaders() {
  const t = getToken()
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}

// ─── Status colors ────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  hadir:     '#10b981',
  terlambat: '#f59e0b',
  alpha:     '#ef4444',
  sakit:     '#3b82f6',
  izin:      '#8b5cf6',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, colorClass, change, changeDir }) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${colorClass}`}>{icon}</div>
      <div className="admin-stat-info">
        <p className="admin-stat-label">{label}</p>
        <p className="admin-stat-value">{value ?? '—'}</p>
        {change != null && (
          <span className={`admin-stat-change ${changeDir}`}>
            {changeDir === 'up' ? '↑' : changeDir === 'down' ? '↓' : '●'} {change}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Trend Chart (Canvas) ─────────────────────────────────────────────────────
function TrendChart({ trend, t }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!trend || trend.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)
      if (chartRef.current) chartRef.current.destroy()

      const labels    = trend.map(d => d.date)
      const hadir     = trend.map(d => d.statuses?.hadir ?? 0)
      const terlambat = trend.map(d => d.statuses?.terlambat ?? 0)
      const alpha     = trend.map(d => d.statuses?.alpha ?? 0)

      chartRef.current = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: t.sc_tepat_waktu, data: hadir,     borderColor: STATUS_COLOR.hadir,     backgroundColor: STATUS_COLOR.hadir + '20', fill: true, tension: 0.4, pointRadius: 4 },
            { label: t.sc_terlambat,   data: terlambat, borderColor: STATUS_COLOR.terlambat, backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
            { label: t.sc_alpha,       data: alpha,     borderColor: STATUS_COLOR.alpha,     backgroundColor: 'transparent', tension: 0.4, pointRadius: 3 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { font: { family: 'Poppins' }, boxWidth: 12, padding: 16 } },
            tooltip: { mode: 'index', intersect: false },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: 11 }, maxRotation: 45 } },
            y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Poppins', size: 11 }, precision: 0 } },
          },
          interaction: { mode: 'nearest', axis: 'x', intersect: false },
        },
      })
    }).catch(console.error)

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [trend, t])

  return (
    <div className="admin-chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ totals }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!totals) return
    const canvas = canvasRef.current
    if (!canvas) return

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)
      if (chartRef.current) chartRef.current.destroy()

      const labels = Object.keys(totals).filter(k => k !== 'total')
      const data   = labels.map(k => totals[k] ?? 0)
      const colors = labels.map(k => STATUS_COLOR[k] ?? '#94a3b8')

      chartRef.current = new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: 'Poppins' }, boxWidth: 12, padding: 12 } },
          },
          cutout: '65%',
        },
      })
    }).catch(console.error)

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [totals])

  return (
    <div className="admin-chart-wrap" style={{ height: 220 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

// ─── Rombel Breakdown ─────────────────────────────────────────────────────────
function RombelBreakdown({ breakdown, t }) {
  if (!breakdown || breakdown.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>{t.ad_tidak_ada_rombel}</p>
  }

  const max = Math.max(...breakdown.map(r => r.attendance_rate ?? 0), 1)

  return (
    <div className="admin-rombel-list">
      {breakdown.slice(0, 8).map((r) => (
        <div key={r.rombel_id} className="admin-rombel-item">
          <span className="admin-rombel-label" title={r.label}>{r.label}</span>
          <div className="admin-rombel-bar-wrap">
            <div
              className="admin-rombel-bar"
              style={{ width: `${((r.attendance_rate ?? 0) / max) * 100}%` }}
            />
          </div>
          <span className="admin-rombel-rate">{Math.round(r.attendance_rate ?? 0)}%</span>
        </div>
      ))}
    </div>
  )
}

// ─── Recent Sessions ──────────────────────────────────────────────────────────
function RecentSessions({ t }) {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/presensi/sesi/aktif`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setSessions(d.data?.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="admin-state-box"><div className="admin-state-spinner" /></div>

  if (sessions.length === 0) {
    return (
      <div className="admin-state-box">
        <p className="admin-state-title">{t.ad_tidak_ada_sesi_aktif}</p>
        <p className="admin-state-desc">{t.ad_sesi_semua_selesai}</p>
      </div>
    )
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t.ad_col_mode}</th>
            <th>{t.ei_col_status}</th>
            <th>{t.gu_jam_prefix}</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => (
            <tr key={s.presensi_sesi_id}>
              <td style={{ fontWeight: 600, color: '#1e293b' }}>#{s.presensi_sesi_id}</td>
              <td>
                <span className={`admin-badge ${s.mode_presensi === 'rombel' ? 'blue' : 'amber'}`}>
                  {s.mode_presensi}
                </span>
              </td>
              <td>
                <span className={`admin-badge ${s.status === 'aktif' ? 'green' : s.status === 'suspended' ? 'amber' : 'gray'}`}>
                  <span className="admin-badge-dot" />
                  {s.status === 'aktif' ? t.ad_status_aktif : s.status === 'suspended' ? t.ad_status_paused : s.status}
                </span>
              </td>
              <td>{(s.jam_ids ?? []).map(j => `${t.gu_jam_prefix} ${j}`).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({ onNav, t }) {
  const actions = [
    { id: 'sesi',    label: t.ad_qa_sesi_label,    desc: t.ad_qa_sesi_desc,    icon: '📋', bg: '#dbeafe', color: '#1d4ed8' },
    { id: 'users',   label: t.ad_qa_users_label,   desc: t.ad_qa_users_desc,   icon: '👥', bg: '#dcfce7', color: '#15803d' },
    { id: 'laporan', label: t.ad_qa_laporan_label, desc: t.ad_qa_laporan_desc, icon: '📊', bg: '#fef3c7', color: '#b45309' },
    { id: 'e-izin',  label: t.ad_qa_izin_label,   desc: t.ad_qa_izin_desc,    icon: '📅', bg: '#ede9fe', color: '#6d28d9' },
  ]

  return (
    <div className="admin-quick-actions">
      {actions.map(a => (
        <button key={a.id} type="button" className="admin-quick-btn" onClick={() => onNav(a.id)}>
          <div className="admin-quick-btn-icon" style={{ background: a.bg, color: a.color }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
          </div>
          <span className="admin-quick-btn-label">{a.label}</span>
          <span className="admin-quick-btn-desc">{a.desc}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage({ onNav, lang }) {
  const t = T[lang] || T.id
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`${API_BASE}/dashboard`, { headers: authHeaders() })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || t.ad_gagal_memuat_msg)
      setData(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading) {
    return (
      <div className="admin-state-box" style={{ minHeight: '60vh' }}>
        <div className="admin-state-spinner" />
        <p className="admin-state-desc">{t.ad_memuat_dashboard}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-state-box" style={{ minHeight: '60vh' }}>
        <p className="admin-state-title">{t.ad_gagal_memuat}</p>
        <p className="admin-state-desc">{error}</p>
        <button type="button" onClick={fetchDashboard} style={{ marginTop: '0.5rem', padding: '0.5rem 1.25rem', border: 'none', borderRadius: 8, background: '#1e40af', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 500, cursor: 'pointer' }}>
          {t.sc_coba_lagi}
        </button>
      </div>
    )
  }

  const totals  = data?.totals  ?? {}
  const summary = data?.summary ?? {}
  const trend   = data?.trend   ?? []
  const rombel  = data?.rombel_breakdown ?? []

  const hadirRate = summary.total_presensi > 0
    ? Math.round(((totals.hadir ?? 0) / summary.total_presensi) * 100)
    : 0

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t.ad_dashboard_judul}</h1>
        <p className="admin-page-subtitle">
          {t.ad_ringkasan} — {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="admin-stats-grid">
        <StatCard label={t.ad_stat_siswa_aktif} value={summary.total_siswa?.toLocaleString('id-ID') ?? '—'}
          icon={<svg viewBox="0 0 24 24"><path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm-7.1 8.4h14.2c.8 0 1.4-.6 1.3-1.4-.4-3.3-3.1-5.6-8.4-5.6s-8 2.3-8.4 5.6c-.1.8.5 1.4 1.3 1.4Z"/></svg>}
          colorClass="blue" change={t.ad_stat_aktif_terdaftar} changeDir="neutral" />
        <StatCard label={t.ad_stat_total_rombel} value={summary.total_rombel}
          icon={<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>}
          colorClass="green" change={t.ad_stat_kelas_aktif} changeDir="neutral" />
        <StatCard label={t.ad_stat_sesi_aktif} value={summary.sesi_aktif}
          icon={<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>}
          colorClass="amber"
          change={summary.sesi_aktif > 0 ? t.ad_stat_berlangsung : t.ad_stat_tidak_ada_sesi}
          changeDir={summary.sesi_aktif > 0 ? 'up' : 'neutral'} />
        <StatCard label={t.ad_stat_tingkat_hadir} value={`${hadirRate}%`}
          icon={<svg viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
          colorClass="teal"
          change={hadirRate >= 80 ? t.ad_stat_baik : hadirRate >= 60 ? t.ad_stat_cukup : t.ad_stat_perlu_perhatian}
          changeDir={hadirRate >= 80 ? 'up' : hadirRate >= 60 ? 'neutral' : 'down'} />
      </div>

      {/* ── Charts Row ── */}
      <div className="admin-grid-3" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">{t.ad_tren_judul}</h3>
            <button type="button" onClick={fetchDashboard} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'Poppins, sans-serif' }}>
              {t.ad_refresh}
            </button>
          </div>
          <div className="admin-card-body">
            {trend.length > 0
              ? <TrendChart trend={trend} t={t} />
              : <div className="admin-state-box" style={{ padding: '2rem' }}><p className="admin-state-desc">{t.ad_belum_ada_tren}</p></div>
            }
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">{t.ad_distribusi_status}</h3>
            </div>
            <div className="admin-card-body">
              <DonutChart totals={totals} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">{t.ad_kehadiran_rombel}</h3>
          </div>
          <div className="admin-card-body">
            <RombelBreakdown breakdown={rombel} t={t} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">{t.ad_aksi_cepat}</h3>
            </div>
            <div className="admin-card-body">
              <QuickActions onNav={onNav} t={t} />
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">{t.ad_sesi_aktif_sekarang}</h3>
            </div>
            <RecentSessions t={t} />
          </div>
        </div>
      </div>
    </>
  )
}
