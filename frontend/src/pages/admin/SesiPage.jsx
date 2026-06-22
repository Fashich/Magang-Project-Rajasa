/**
 * SesiPage.jsx
 * Halaman Monitor Sesi Presensi (admin)
 * Branch: feature/admin-dashboard
 *
 * Perubahan:
 * - Auto-refresh 1 detik (live update tanpa countdown)
 * - UI redesign: proper data density, live indicator, clean table
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import './SesiPage.css'

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

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(startedAt, endedAt) {
  if (!startedAt) return '—'
  const start = new Date(startedAt)
  const end   = endedAt ? new Date(endedAt) : new Date()
  const mins  = Math.floor((end - start) / 60000)
  if (mins < 1) return '< 1 mnt'
  if (mins < 60) return `${mins} mnt`
  return `${Math.floor(mins / 60)}j ${mins % 60}mnt`
}

function formatTanggal(str) {
  return new Date(str).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    aktif:     { label: 'Aktif',    cls: 'sp-badge sp-badge--aktif' },
    suspended: { label: 'Dijeda',   cls: 'sp-badge sp-badge--suspended' },
    selesai:   { label: 'Selesai',  cls: 'sp-badge sp-badge--selesai' },
    gagal:     { label: 'Gagal',    cls: 'sp-badge sp-badge--error' },
    expired:   { label: 'Expired',  cls: 'sp-badge sp-badge--error' },
    terputus:  { label: 'Terputus', cls: 'sp-badge sp-badge--error' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'sp-badge' }
  return <span class={cls}>{label}</span>
}

function ModeBadge({ mode }) {
  return (
    <span class={`sp-mode-badge sp-mode-badge--${mode}`}>
      {mode === 'rombel' ? 'Rombel' : 'Piket'}
    </span>
  )
}

// ── Live dot indicator ────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span class="sp-live">
      <span class="sp-live-dot" />
      Live
    </span>
  )
}

// ── Summary cards ─────────────────────────────────────────────────────────────

const CARD_DEFS = [
  { key: 'total',          label: 'Total Sesi',       mod: '',        icon: '≡' },
  { key: 'sedang_berjalan',label: 'Sedang Berjalan',  mod: '--green', icon: '▶' },
  { key: 'selesai',        label: 'Selesai',          mod: '--blue',  icon: '✓' },
  { key: 'bermasalah',     label: 'Bermasalah',       mod: '--red',   icon: '!' },
]

function SummaryCards({ summary, isToday }) {
  return (
    <div class="sp-stats">
      {CARD_DEFS.map(({ key, label, mod, icon }) => (
        <div key={key} class={`sp-stat${mod}`}>
          <div class="sp-stat-icon-wrap">
            <span class="sp-stat-icon">{icon}</span>
          </div>
          <div class="sp-stat-body">
            <div class="sp-stat-num">{summary[key] ?? 0}</div>
            <div class="sp-stat-lbl">{label}</div>
          </div>
          {key === 'sedang_berjalan' && (summary[key] ?? 0) > 0 && isToday && (
            <LiveDot />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ sesi, onConfirm, onCancel, loading }) {
  if (!sesi) return null
  return (
    <div class="sp-overlay" onClick={onCancel}>
      <div class="sp-modal" onClick={e => e.stopPropagation()}>
        <div class="sp-modal-header">
          <div class="sp-modal-icon">⏹</div>
          <div>
            <h3 class="sp-modal-title">Paksa Selesaikan Sesi</h3>
            <p class="sp-modal-sub">Tindakan ini tidak bisa dibatalkan</p>
          </div>
        </div>
        <div class="sp-modal-body">
          <div class="sp-modal-detail">
            <div class="sp-detail-row">
              <span class="sp-detail-key">Guru</span>
              <span class="sp-detail-val">{sesi.dibuka_oleh?.nama || sesi.dibuka_oleh?.username || '—'}</span>
            </div>
            <div class="sp-detail-row">
              <span class="sp-detail-key">Mode</span>
              <span class="sp-detail-val">
                {sesi.mode_presensi === 'rombel'
                  ? `Rombel — ${sesi.rombel?.label_rombel ?? '—'}`
                  : 'Piket'}
              </span>
            </div>
            <div class="sp-detail-row">
              <span class="sp-detail-key">Ruang</span>
              <span class="sp-detail-val">{sesi.ruang || '—'}</span>
            </div>
            <div class="sp-detail-row">
              <span class="sp-detail-key">Mulai</span>
              <span class="sp-detail-val">{formatTime(sesi.started_at)}</span>
            </div>
            <div class="sp-detail-row">
              <span class="sp-detail-key">Status</span>
              <span class="sp-detail-val"><StatusBadge status={sesi.status} /></span>
            </div>
          </div>
          <p class="sp-modal-warn">
            Guru atau staff tidak akan bisa melanjutkan sesi ini setelah diakhiri paksa.
          </p>
        </div>
        <div class="sp-modal-footer">
          <button class="sp-btn sp-btn--ghost" onClick={onCancel} disabled={loading}>
            Batal
          </button>
          <button class="sp-btn sp-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses…' : 'Akhiri Paksa'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div class={`sp-toast sp-toast--${toast.type}`}>
      <span class="sp-toast-icon">{toast.type === 'success' ? '✓' : '✗'}</span>
      {toast.msg}
    </div>
  )
}

// ── Empty / Error states ──────────────────────────────────────────────────────

function EmptyState({ tanggal }) {
  const isToday = tanggal === todayString()
  return (
    <tr>
      <td colSpan={10}>
        <div class="sp-empty">
          <div class="sp-empty-icon">📋</div>
          <p class="sp-empty-title">
            {isToday ? 'Belum ada sesi hari ini' : 'Tidak ada sesi pada tanggal ini'}
          </p>
          <p class="sp-empty-sub">
            {isToday
              ? 'Data akan muncul otomatis saat guru membuka sesi presensi.'
              : 'Coba pilih tanggal lain.'}
          </p>
        </div>
      </td>
    </tr>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SesiPage({ pageActive = true }) {
  const [tanggal, setTanggal]     = useState(todayString)
  const [statusFilter, setStatus] = useState('semua')
  const [modeFilter, setMode]     = useState('semua')
  const [page, setPage]           = useState(1)
  const [rows, setRows]           = useState([])
  const [meta, setMeta]           = useState({ total: 0, last_page: 1 })
  const [summary, setSummary]     = useState({ total: 0, sedang_berjalan: 0, selesai: 0, bermasalah: 0 })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [confirmSesi, setConfirm] = useState(null)
  const [finishing, setFinishing] = useState(false)
  const [toast, setToast]         = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef                  = useRef(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        tanggal, status: statusFilter, mode: modeFilter, page,
      })
      const res = await apiFetch(`/admin/sesi?${params}`)
      setRows(res.data?.data ?? [])
      setMeta(res.data?.meta ?? { total: 0, last_page: 1 })
      setSummary(res.data?.summary ?? { total: 0, sedang_berjalan: 0, selesai: 0, bermasalah: 0 })
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [tanggal, statusFilter, modeFilter, page])

  // ── Auto-refresh 1 detik (hanya saat tab aktif & melihat hari ini) ─────────
  useEffect(() => {
    fetchData(true)

    const isToday = tanggal === todayString()
    if (!isToday) return

    timerRef.current = setInterval(() => {
      // Hanya refresh jika tab tidak tersembunyi
      if (!document.hidden && pageActive) {
        fetchData(false)
      }
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
      showToast('Sesi berhasil diakhiri.')
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
    <div class="sp-page">

      {/* ── Header ── */}
      <div class="sp-header">
        <div class="sp-header-left">
          <h1 class="sp-title">Sesi Presensi</h1>
          <p class="sp-sub">{formatTanggal(tanggal)}</p>
        </div>
        <div class="sp-header-right">
          {isToday && lastUpdated && (
            <span class="sp-updated">
              Diperbarui {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {!isToday && (
            <button class="sp-btn sp-btn--outline" onClick={() => fetchData(true)} disabled={loading}>
              {loading ? '…' : '↻ Muat Ulang'}
            </button>
          )}
        </div>
      </div>

      {/* ── Summary cards ── */}
      <SummaryCards summary={summary} isToday={isToday} />

      {/* ── Filter bar ── */}
      <div class="sp-filter-bar">
        <input
          type="date"
          class="sp-input-date"
          value={tanggal}
          max={todayString()}
          onChange={e => setTanggal(e.target.value)}
        />
        <select class="sp-select" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="semua">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="suspended">Dijeda</option>
          <option value="selesai">Selesai</option>
          <option value="expired">Expired</option>
          <option value="terputus">Terputus</option>
          <option value="gagal">Gagal</option>
        </select>
        <select class="sp-select" value={modeFilter} onChange={e => setMode(e.target.value)}>
          <option value="semua">Semua Mode</option>
          <option value="rombel">Rombel</option>
          <option value="piket">Piket</option>
        </select>
        <span class="sp-total-pill">{meta.total} sesi</span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div class="sp-error-bar">
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── Tabel ── */}
      <div class="sp-card">
        <div class="sp-table-wrap">
          <table class="sp-table">
            <thead>
              <tr>
                <th class="sp-th-num">#</th>
                <th>Mode</th>
                <th>Guru / Staff</th>
                <th>Rombel</th>
                <th>Ruang</th>
                <th>Jam</th>
                <th>Mulai</th>
                <th>Durasi</th>
                <th class="sp-th-c">Hadir</th>
                <th class="sp-th-c">Status</th>
                <th class="sp-th-c">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr>
                  <td colSpan={11}>
                    <div class="sp-empty">
                      <div class="sp-spinner" />
                      <p class="sp-empty-title">Memuat data…</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <EmptyState tanggal={tanggal} />
              )}
              {rows.map((row, i) => {
                const isActive = ['aktif', 'suspended'].includes(row.status)
                const jamList  = row.jam_list ? String(row.jam_list).split(',') : []
                return (
                  <tr key={row.presensi_sesi_id} class={isActive ? 'sp-row-live' : ''}>
                    <td class="sp-td-num">{(page - 1) * 20 + i + 1}</td>
                    <td>
                      <ModeBadge mode={row.mode_presensi} />
                    </td>
                    <td class="sp-td-guru">
                      <span class="sp-guru-nama">{row.dibuka_oleh?.nama || '—'}</span>
                      <span class="sp-guru-user">@{row.dibuka_oleh?.username || '—'}</span>
                    </td>
                    <td class="sp-td-rombel">
                      {row.rombel?.label_rombel ?? <span class="sp-nil">—</span>}
                    </td>
                    <td class="sp-td-ruang">
                      {row.ruang || <span class="sp-nil">—</span>}
                    </td>
                    <td class="sp-td-jam">
                      {jamList.length > 0
                        ? jamList.map(j => <span key={j} class="sp-jam">J{j.trim()}</span>)
                        : <span class="sp-nil">—</span>}
                    </td>
                    <td class="sp-td-time">{formatTime(row.started_at)}</td>
                    <td class="sp-td-time">
                      {isActive
                        ? <span class="sp-duration-live">{formatDuration(row.started_at, null)}</span>
                        : formatDuration(row.started_at, row.ended_at)}
                    </td>
                    <td class="sp-td-c">
                      <span class="sp-hadir">{row.total_hadir ?? 0}</span>
                    </td>
                    <td class="sp-td-c">
                      <StatusBadge status={row.status} />
                    </td>
                    <td class="sp-td-c">
                      {isActive
                        ? (
                          <button
                            class="sp-stop-btn"
                            title="Akhiri sesi ini secara paksa"
                            onClick={() => setConfirm(row)}
                          >
                            ⏹ Akhiri
                          </button>
                        )
                        : <span class="sp-nil">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {meta.last_page > 1 && (
          <div class="sp-pagination">
            <button
              class="sp-pg-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            <span class="sp-pg-info">
              Halaman {page} / {meta.last_page}
            </span>
            <button
              class="sp-pg-btn"
              disabled={page >= meta.last_page}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <ConfirmModal
        sesi={confirmSesi}
        onConfirm={handleForceFinish}
        onCancel={() => setConfirm(null)}
        loading={finishing}
      />

      {/* ── Toast ── */}
      <Toast toast={toast} />
    </div>
  )
}
