/**
 * AuditPage.jsx
 * Halaman Audit Trail (admin)
 * Branch: feature/admin-dashboard
 *
 * Dua tab:
 *   - Sesi Login  : riwayat login/logout semua user + status online
 *   - Aktivitas   : log user_activities (CRUD, export, dsb)
 *
 * Filter: rentang tanggal + user_id opsional
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import './AuditPage.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token')
      || ''
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().slice(0, 10)
}

function formatDt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatDurasi(menit) {
  if (menit < 1)   return '< 1 menit'
  if (menit < 60)  return `${menit} mnt`
  const jam = Math.floor(menit / 60)
  const sisa = menit % 60
  return sisa > 0 ? `${jam}j ${sisa}m` : `${jam} jam`
}

function userTypeBadge(type) {
  const map = {
    admin:      { label: 'Admin',    cls: 'at-badge at-badge--admin'  },
    guru:       { label: 'Guru',     cls: 'at-badge at-badge--guru'   },
    staff:      { label: 'Staff',    cls: 'at-badge at-badge--staff'  },
    siswa:      { label: 'Siswa',    cls: 'at-badge at-badge--siswa'  },
    intern:     { label: 'Intern',   cls: 'at-badge at-badge--intern' },
  }
  const { label, cls } = map[type] || { label: type, cls: 'at-badge' }
  return <span class={cls}>{label}</span>
}

function activityIcon(type) {
  const map = {
    login:          '🔑',
    logout:         '🚪',
    create:         '➕',
    update:         '✏️',
    delete:         '🗑️',
    reset_password: '🔒',
    export:         '📤',
    import:         '📥',
    force_finish:   '⛔',
    view:           '👁️',
  }
  return map[type?.toLowerCase()] || '📋'
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ summary, tab }) {
  const sessionCards = [
    { key: 'sedang_online',  label: 'Sedang Online',    icon: '🟢', accent: '--at-green'  },
    { key: 'login_hari_ini', label: 'Login Hari Ini',   icon: '📅', accent: '--at-blue'   },
    { key: 'total_session',  label: 'Total Sesi',        icon: '🔐', accent: '--at-indigo' },
    { key: 'unique_users',   label: 'Pengguna Aktif',   icon: '👥', accent: '--at-purple' },
  ]
  const activityCards = [
    { key: 'aktivitas_hari_ini', label: 'Aktivitas Hari Ini', icon: '⚡', accent: '--at-orange' },
    { key: 'total_aktivitas',    label: 'Total Log',           icon: '📋', accent: '--at-indigo' },
    { key: 'unique_users',       label: 'Pengguna Terlibat',  icon: '👥', accent: '--at-blue'   },
    { key: 'module_count',       label: 'Modul Berbeda',       icon: '🧩', accent: '--at-purple' },
  ]
  const cards = tab === 'sessions' ? sessionCards : activityCards

  return (
    <div class="at-cards">
      {cards.map(({ key, label, icon, accent }) => (
        <div key={key} class="at-card">
          <div class="at-card-strip" style={{ background: `var(${accent})` }} />
          <div class="at-card-body">
            <span class="at-card-icon" style={{ background: `var(${accent})1a`, color: `var(${accent})` }}>
              {icon}
            </span>
            <div class="at-card-info">
              <div class="at-card-num">{summary[key] ?? 0}</div>
              <div class="at-card-lbl">{label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, lastPage, onPage }) {
  if (lastPage <= 1) return null
  return (
    <div class="at-pagination">
      <button
        class="at-page-btn"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >‹ Prev</button>
      <span class="at-page-info">{page} / {lastPage}</span>
      <button
        class="at-page-btn"
        disabled={page >= lastPage}
        onClick={() => onPage(page + 1)}
      >Next ›</button>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ tab }) {
  return (
    <tr>
      <td colSpan={tab === 'sessions' ? 8 : 7}>
        <div class="at-empty">
          <div class="at-empty-icon">{tab === 'sessions' ? '🔐' : '📋'}</div>
          <p class="at-empty-title">Tidak ada data pada rentang ini</p>
          <p class="at-empty-sub">Coba ubah filter tanggal atau pilih pengguna lain.</p>
        </div>
      </td>
    </tr>
  )
}

// ── Sessions Table ────────────────────────────────────────────────────────────

function SessionsTable({ rows, page, perPage }) {
  return (
    <table class="at-table">
      <thead>
        <tr>
          <th class="at-th-num">#</th>
          <th>Pengguna</th>
          <th>Peran</th>
          <th>IP Address</th>
          <th>Perangkat</th>
          <th>Login</th>
          <th>Durasi</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <EmptyState tab="sessions" />
          : rows.map((row, i) => (
            <tr key={row.session_id}>
              <td class="at-td-num">{(page - 1) * perPage + i + 1}</td>
              <td>
                <span class="at-username">{row.username}</span>
              </td>
              <td>{userTypeBadge(row.user_type)}</td>
              <td><code class="at-ip">{row.ip_address}</code></td>
              <td>
                <span class={`at-device at-device--${row.device?.toLowerCase()}`}>
                  {row.device === 'Mobile' ? '📱' : row.device === 'Tablet' ? '📟' : '🖥️'}
                  {' '}{row.device}
                </span>
              </td>
              <td class="at-td-mono">{formatDt(row.logged_in_at)}</td>
              <td class="at-td-mono">{formatDurasi(row.durasi_menit)}</td>
              <td>
                {row.is_online
                  ? <span class="at-online"><span class="at-dot" />Online</span>
                  : <span class="at-offline">Keluar {formatDt(row.logout_at)}</span>
                }
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  )
}

// ── Activities Table ──────────────────────────────────────────────────────────

function ActivitiesTable({ rows, page, perPage }) {
  return (
    <table class="at-table">
      <thead>
        <tr>
          <th class="at-th-num">#</th>
          <th>Waktu</th>
          <th>Pengguna</th>
          <th>Tipe</th>
          <th>Modul</th>
          <th>Keterangan</th>
          <th>IP</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <EmptyState tab="activities" />
          : rows.map((row, i) => (
            <tr key={row.activity_id}>
              <td class="at-td-num">{(page - 1) * perPage + i + 1}</td>
              <td class="at-td-mono at-td-nowrap">{formatDt(row.created_at)}</td>
              <td>
                <div class="at-user-cell">
                  <span class="at-username">{row.username}</span>
                  {userTypeBadge(row.user_type)}
                </div>
              </td>
              <td>
                <span class="at-activity-type">
                  {activityIcon(row.activity_type)}
                  {' '}
                  <span class={`at-act-label at-act--${row.activity_type?.toLowerCase()}`}>
                    {row.activity_type}
                  </span>
                </span>
              </td>
              <td>
                {row.module_name
                  ? <span class="at-module-chip">{row.module_name}</span>
                  : <span class="at-dash">—</span>
                }
              </td>
              <td class="at-td-desc">
                {row.activity_description
                  ? <span title={row.activity_description}>
                      {row.activity_description.length > 60
                        ? row.activity_description.slice(0, 60) + '…'
                        : row.activity_description}
                    </span>
                  : <span class="at-dash">—</span>
                }
              </td>
              <td><code class="at-ip">{row.ip_address}</code></td>
            </tr>
          ))
        }
      </tbody>
    </table>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [tab,           setTab]     = useState('sessions')
  const [tanggalDari,   setDari]    = useState(sevenDaysAgo)
  const [tanggalSampai, setSampai]  = useState(todayString)
  const [page,          setPage]    = useState(1)

  const [rows,    setRows]    = useState([])
  const [meta,    setMeta]    = useState({ total: 0, last_page: 1 })
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        tab,
        tanggal_dari:   tanggalDari,
        tanggal_sampai: tanggalSampai,
        page,
      })
      const res = await apiFetch(`/admin/audit?${params}`)
      setRows(res.data?.data       ?? [])
      setMeta(res.data?.meta       ?? { total: 0, last_page: 1 })
      setSummary(res.data?.summary ?? {})
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tab, tanggalDari, tanggalSampai, page])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => { setPage(1) }, [tab, tanggalDari, tanggalSampai])

  // Label rentang tanggal
  const rangeLabel = tanggalDari === tanggalSampai
    ? formatDate(tanggalDari)
    : `${formatDate(tanggalDari)} – ${formatDate(tanggalSampai)}`

  return (
    <div class="at-page">

      {/* ── Header ── */}
      <div class="at-header">
        <div class="at-header-left">
          <h1 class="at-title">Audit Trail</h1>
          <p class="at-sub">{rangeLabel} · {meta.total} entri</p>
        </div>
        <div class="at-header-right">
          <button
            class="at-btn at-btn--outline"
            onClick={fetchData}
            disabled={loading}
            title="Muat ulang data"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            {loading ? 'Memuat…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div class="at-tabs">
        <button
          class={`at-tab${tab === 'sessions' ? ' at-tab--active' : ''}`}
          onClick={() => setTab('sessions')}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 14c-2.67 0-5.02-1.33-6.45-3.35C6.92 14.17 9.36 13.5 12 13.5s5.08.67 6.45 1.65C17.02 17.17 14.67 19 12 19z"/>
          </svg>
          Sesi Login
        </button>
        <button
          class={`at-tab${tab === 'activities' ? ' at-tab--active' : ''}`}
          onClick={() => setTab('activities')}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
          </svg>
          Log Aktivitas
        </button>
      </div>

      {/* ── Summary cards ── */}
      <SummaryCards summary={summary} tab={tab} />

      {/* ── Filter bar ── */}
      <div class="at-filter-bar">
        <div class="at-filter-group">
          <label class="at-filter-label">Dari</label>
          <input
            type="date"
            class="at-input-date"
            value={tanggalDari}
            max={tanggalSampai}
            onChange={e => setDari(e.target.value)}
          />
        </div>
        <div class="at-filter-group">
          <label class="at-filter-label">Sampai</label>
          <input
            type="date"
            class="at-input-date"
            value={tanggalSampai}
            max={todayString()}
            onChange={e => setSampai(e.target.value)}
          />
        </div>
        <div class="at-filter-shortcuts">
          {[
            { label: 'Hari ini',   dari: todayString(),   sampai: todayString()   },
            { label: '7 hari',     dari: sevenDaysAgo(),  sampai: todayString()   },
            { label: '30 hari',    dari: (() => { const d = new Date(); d.setDate(d.getDate()-29); return d.toISOString().slice(0,10) })(), sampai: todayString() },
          ].map(({ label, dari, sampai }) => {
            const active = tanggalDari === dari && tanggalSampai === sampai
            return (
              <button
                key={label}
                class={`at-shortcut${active ? ' at-shortcut--active' : ''}`}
                onClick={() => { setDari(dari); setSampai(sampai) }}
              >{label}</button>
            )
          })}
        </div>
        <span class="at-total-pill">{meta.total} entri</span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div class="at-error-bar">
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── Tabel ── */}
      <div class="at-table-card">
        {loading && (
          <div class="at-loading-bar">
            <div class="at-loading-inner" />
          </div>
        )}
        <div class="at-table-wrap">
          {tab === 'sessions'
            ? <SessionsTable rows={rows} page={page} perPage={25} />
            : <ActivitiesTable rows={rows} page={page} perPage={25} />
          }
        </div>
        <div class="at-table-footer">
          <span class="at-count-label">
            {rows.length > 0
              ? `Menampilkan ${(page-1)*25+1}–${(page-1)*25+rows.length} dari ${meta.total}`
              : 'Tidak ada data'
            }
          </span>
          <Pagination page={page} lastPage={meta.last_page} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}
