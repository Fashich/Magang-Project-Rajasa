/**
 * SesiPage.jsx
 * Halaman Monitor Sesi Presensi (admin)
 * Branch: feature/admin-dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import './SesiPage.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

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

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(startedAt, endedAt) {
  if (!startedAt) return '—'
  const start = new Date(startedAt)
  const end   = endedAt ? new Date(endedAt) : new Date()
  const mins  = Math.floor((end - start) / 60000)
  if (mins < 60) return `${mins} mnt`
  return `${Math.floor(mins / 60)}j ${mins % 60}mnt`
}

// ── Badge komponen ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    aktif:     { label: 'Aktif',     cls: 'sesi-badge sesi-badge--aktif' },
    suspended: { label: 'Dijeda',    cls: 'sesi-badge sesi-badge--suspended' },
    selesai:   { label: 'Selesai',   cls: 'sesi-badge sesi-badge--selesai' },
    gagal:     { label: 'Gagal',     cls: 'sesi-badge sesi-badge--error' },
    expired:   { label: 'Expired',   cls: 'sesi-badge sesi-badge--error' },
    terputus:  { label: 'Terputus',  cls: 'sesi-badge sesi-badge--error' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'sesi-badge' }
  return <span class={cls}>{label}</span>
}

function ModeBadge({ mode }) {
  return (
    <span class={`sesi-badge sesi-badge--mode-${mode}`}>
      {mode === 'rombel' ? '📚 Rombel' : '🏫 Piket'}
    </span>
  )
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCards({ summary }) {
  return (
    <div class="sesi-summary-row">
      <div class="sesi-summary-card">
        <div class="sesi-summary-num">{summary.total}</div>
        <div class="sesi-summary-lbl">Total Sesi</div>
      </div>
      <div class="sesi-summary-card sesi-summary-card--active">
        <div class="sesi-summary-num">{summary.sedang_berjalan}</div>
        <div class="sesi-summary-lbl">Sedang Berjalan</div>
      </div>
      <div class="sesi-summary-card sesi-summary-card--done">
        <div class="sesi-summary-num">{summary.selesai}</div>
        <div class="sesi-summary-lbl">Selesai</div>
      </div>
      <div class="sesi-summary-card sesi-summary-card--error">
        <div class="sesi-summary-num">{summary.bermasalah}</div>
        <div class="sesi-summary-lbl">Bermasalah</div>
      </div>
    </div>
  )
}

// ── Konfirmasi force-finish ────────────────────────────────────────────────────

function ConfirmModal({ sesi, onConfirm, onCancel, loading }) {
  if (!sesi) return null
  return (
    <div class="sesi-modal-overlay" onClick={onCancel}>
      <div class="sesi-modal" onClick={e => e.stopPropagation()}>
        <div class="sesi-modal-header">
          <h3 class="sesi-modal-title">⚠️ Paksa Selesaikan Sesi</h3>
        </div>
        <div class="sesi-modal-body">
          <p>Kamu akan memaksa menyelesaikan sesi berikut:</p>
          <div class="sesi-modal-info">
            <div><strong>Guru:</strong> {sesi.dibuka_oleh?.nama || sesi.dibuka_oleh?.username}</div>
            <div><strong>Mode:</strong> {sesi.mode_presensi === 'rombel' ? `Rombel — ${sesi.rombel?.label_rombel}` : 'Piket'}</div>
            <div><strong>Ruang:</strong> {sesi.ruang}</div>
            <div><strong>Dimulai:</strong> {formatTime(sesi.started_at)}</div>
            <div><strong>Status:</strong> <StatusBadge status={sesi.status} /></div>
          </div>
          <p class="sesi-modal-warning">
            Tindakan ini tidak bisa dibatalkan. Guru/staff tidak akan bisa melanjutkan sesi ini.
          </p>
        </div>
        <div class="sesi-modal-footer">
          <button class="admin-btn admin-btn--ghost" onClick={onCancel} disabled={loading}>
            Batal
          </button>
          <button class="admin-btn admin-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses…' : 'Ya, Selesaikan Paksa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SesiPage() {
  const [tanggal, setTanggal]       = useState(todayString())
  const [statusFilter, setStatus]   = useState('semua')
  const [modeFilter, setMode]       = useState('semua')
  const [page, setPage]             = useState(1)
  const [rows, setRows]             = useState([])
  const [meta, setMeta]             = useState({ total: 0, last_page: 1 })
  const [summary, setSummary]       = useState({ total: 0, sedang_berjalan: 0, selesai: 0, bermasalah: 0 })
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [confirmSesi, setConfirm]   = useState(null)
  const [finishing, setFinishing]   = useState(false)
  const [toast, setToast]           = useState(null)
  const [countdown, setCountdown]   = useState(30)
  const timerRef                    = useRef(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ tanggal, status: statusFilter, mode: modeFilter, page })
      const res = await apiFetch(`/admin/sesi?${params}`)
      setRows(res.data?.data ?? [])
      setMeta(res.data?.meta ?? { total: 0, last_page: 1 })
      setSummary(res.data?.summary ?? { total: 0, sedang_berjalan: 0, selesai: 0, bermasalah: 0 })
      setCountdown(30)
    } catch (e) {
      setError(e.message)
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [tanggal, statusFilter, modeFilter, page])

  // Auto-refresh setiap 30 detik
  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          fetchData(false)
          return 30
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [fetchData])

  // Reset page saat filter berubah
  useEffect(() => { setPage(1) }, [tanggal, statusFilter, modeFilter])

  async function handleForceFinish() {
    if (!confirmSesi) return
    setFinishing(true)
    try {
      await apiFetch(`/admin/sesi/${confirmSesi.presensi_sesi_id}/force-finish`, { method: 'POST' })
      showToast('Sesi berhasil diselesaikan paksa.')
      setConfirm(null)
      fetchData(false)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setFinishing(false)
    }
  }

  const isToday = tanggal === todayString()

  return (
    <div class="sesi-page">

      {/* Header */}
      <div class="sesi-page-header">
        <div>
          <h1 class="sesi-page-title">Sesi Presensi</h1>
          <p class="sesi-page-sub">Monitor semua sesi presensi — {new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div class="sesi-header-actions">
          {isToday && (
            <span class="sesi-refresh-info">
              Refresh otomatis dalam <strong>{countdown}s</strong>
            </span>
          )}
          <button class="admin-btn admin-btn--outline" onClick={() => fetchData(true)} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards summary={summary} />

      {/* Filter bar */}
      <div class="admin-filter-bar">
        <input
          type="date"
          class="sesi-date-input"
          value={tanggal}
          max={todayString()}
          onChange={e => setTanggal(e.target.value)}
        />
        <select class="admin-filter-select" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="semua">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="suspended">Dijeda</option>
          <option value="selesai">Selesai</option>
          <option value="expired">Expired</option>
          <option value="terputus">Terputus</option>
          <option value="gagal">Gagal</option>
        </select>
        <select class="admin-filter-select" value={modeFilter} onChange={e => setMode(e.target.value)}>
          <option value="semua">Semua Mode</option>
          <option value="rombel">Rombel</option>
          <option value="piket">Piket</option>
        </select>
      </div>

      {/* Error */}
      {error && <div class="admin-state-box admin-state-box--error">⚠️ {error}</div>}

      {/* Tabel */}
      <div class="admin-card">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Mode / Ruang</th>
                <th>Guru / Staff</th>
                <th>Rombel</th>
                <th>Jam</th>
                <th>Mulai</th>
                <th>Durasi</th>
                <th>Hadir</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} class="admin-state-box">Memuat data…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={10} class="admin-state-box">
                    {tanggal === todayString()
                      ? 'Belum ada sesi hari ini.'
                      : 'Tidak ada sesi pada tanggal tersebut.'}
                  </td>
                </tr>
              )}
              {!loading && rows.map((row, i) => {
                const isActive = ['aktif', 'suspended'].includes(row.status)
                return (
                  <tr key={row.presensi_sesi_id} class={isActive ? 'sesi-row--active' : ''}>
                    <td class="admin-table-num">{(page - 1) * 20 + i + 1}</td>
                    <td>
                      <ModeBadge mode={row.mode_presensi} />
                      <div class="sesi-ruang">{row.ruang}</div>
                    </td>
                    <td>
                      <div class="sesi-guru-nama">{row.dibuka_oleh?.nama || '—'}</div>
                      <div class="sesi-guru-user">@{row.dibuka_oleh?.username || '—'}</div>
                    </td>
                    <td>{row.rombel?.label_rombel ?? <span class="sesi-dash">—</span>}</td>
                    <td>
                      {row.jam_list
                        ? row.jam_list.split(',').map(j => (
                            <span key={j} class="sesi-jam-chip">J{j}</span>
                          ))
                        : <span class="sesi-dash">—</span>}
                    </td>
                    <td class="sesi-time">{formatTime(row.started_at)}</td>
                    <td class="sesi-time">{formatDuration(row.started_at, row.ended_at)}</td>
                    <td class="sesi-hadir">
                      <span class="sesi-hadir-num">{row.total_hadir}</span>
                      <span class="sesi-hadir-lbl"> siswa</span>
                    </td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>
                      <div class="admin-row-actions">
                        {isActive && (
                          <button
                            class="admin-action-btn admin-action-btn--danger"
                            title="Paksa selesaikan sesi ini"
                            onClick={() => setConfirm(row)}
                          >
                            ⏹
                          </button>
                        )}
                        {!isActive && <span class="sesi-dash">—</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div class="admin-pagination">
            <button
              class="admin-pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            <span class="admin-pagination-info">
              Hal {page} / {meta.last_page} · {meta.total} sesi
            </span>
            <button
              class="admin-pagination-btn"
              disabled={page >= meta.last_page}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Modal konfirmasi force finish */}
      <ConfirmModal
        sesi={confirmSesi}
        onConfirm={handleForceFinish}
        onCancel={() => setConfirm(null)}
        loading={finishing}
      />

      {/* Toast */}
      {toast && (
        <div class={`admin-toast admin-toast--${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  )
}
