/**
 * EarlyWarningPage.jsx
 * Halaman Early Warning System (admin)
 * Branch: feature/early-warning
 *
 * Fitur:
 * - Daftar siswa dengan pola alpha mengkhawatirkan
 * - Filter: periode (7/14/30 hari), min alpha, rombel
 * - Severity badge: Critical / High / Medium
 * - Rate kehadiran per siswa dengan bar visual
 * - Tombol "Kirim Notifikasi ke Wali Kelas"
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import { T } from '../../utils/lang.js'
import './EarlyWarningPage.css'

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

function pctColor(rate) {
  if (rate >= 85) return '#10b981'
  if (rate >= 70) return '#f59e0b'
  return '#ef4444'
}

// ── Severity ──────────────────────────────────────────────────────────────────

function buildSeverity(t) {
  return {
    critical: { label: t.ad_kritis, cls: 'ew-badge--critical', icon: '🔴' },
    high:     { label: t.ad_tinggi, cls: 'ew-badge--high',     icon: '🟠' },
    medium:   { label: t.ad_sedang, cls: 'ew-badge--medium',   icon: '🟡' },
  }
}

function SeverityBadge({ sev }) {
  const { label, cls, icon } = SEVERITY[sev] || SEVERITY.medium
  return <span class={`ew-badge ${cls}`}>{icon} {label}</span>
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ summary, warnings }) {
  const critical = warnings.filter(w => w.severity === 'critical').length
  const high     = warnings.filter(w => w.severity === 'high').length

  return (
    <div class="ew-cards">
      <div class="ew-card">
        <div class="ew-card-strip" style="background:#ef4444" />
        <div class="ew-card-body">
          <span class="ew-card-icon" style="background:#fef2f2;color:#ef4444">⚠️</span>
          <div>
            <div class="ew-card-num">{summary.total_siswa_bermasalah ?? warnings.length}</div>
            <div class="ew-card-lbl">Siswa Bermasalah</div>
          </div>
        </div>
      </div>
      <div class="ew-card">
        <div class="ew-card-strip" style="background:#dc2626" />
        <div class="ew-card-body">
          <span class="ew-card-icon" style="background:#fef2f2;color:#dc2626">🔴</span>
          <div>
            <div class="ew-card-num">{critical}</div>
            <div class="ew-card-lbl">Level Kritis</div>
          </div>
        </div>
      </div>
      <div class="ew-card">
        <div class="ew-card-strip" style="background:#f59e0b" />
        <div class="ew-card-body">
          <span class="ew-card-icon" style="background:#fffbeb;color:#f59e0b">🟠</span>
          <div>
            <div class="ew-card-num">{high}</div>
            <div class="ew-card-lbl">Level Tinggi</div>
          </div>
        </div>
      </div>
      <div class="ew-card">
        <div class="ew-card-strip" style="background:#4f46e5" />
        <div class="ew-card-body">
          <span class="ew-card-icon" style="background:#eef2ff;color:#4f46e5">📊</span>
          <div>
            <div class="ew-card-num">{summary.rate_hadir_global ?? '—'}%</div>
            <div class="ew-card-lbl">Rate Hadir Global</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Rate Bar ──────────────────────────────────────────────────────────────────

function RateBar({ rate }) {
  const color = pctColor(rate)
  return (
    <div class="ew-rate-wrap">
      <div class="ew-rate-bar">
        <div class="ew-rate-fill" style={{ width: `${Math.min(rate, 100)}%`, background: color }} />
      </div>
      <span class="ew-rate-num" style={{ color }}>{rate}%</span>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div class={`ew-toast ew-toast--${toast.type}`}>
      {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EarlyWarningPage({ lang }) {
  const t = T[lang] || T.id
  const SEVERITY = buildSeverity(t)
  const [warnings,    setWarnings]  = useState([])
  const [summary,     setSummary]   = useState({})
  const [rombelList,  setRombel]    = useState([])
  const [loading,     setLoading]   = useState(false)
  const [notifying,   setNotifying] = useState(false)
  const [error,       setError]     = useState(null)
  const [toast,       setToast]     = useState(null)

  // Filter state
  const [days,        setDays]      = useState(14)
  const [minAlpha,    setMinAlpha]  = useState(3)
  const [rombelId,    setRombelId]  = useState('')
  const [sevFilter,   setSevFilter] = useState('semua')
  const [search,      setSearch]    = useState('')

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Load daftar rombel untuk filter dropdown
  useEffect(() => {
    apiFetch('/rombel/options')
      .then(res => setRombel(res.data?.rombel ?? []))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p = new URLSearchParams({
        days,
        min_absences: minAlpha,
        with_summary: '1',
        ...(rombelId ? { rombel_id: rombelId } : {}),
      })
      const res = await apiFetch(`/early-warnings?${p}`)
      setWarnings(res.data?.warnings ?? [])
      setSummary(res.data?.summary   ?? {})
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [days, minAlpha, rombelId])

  useEffect(() => { load() }, [load])

  async function handleNotify() {
    if (!confirm(`Kirim notifikasi ke wali kelas untuk semua siswa bermasalah dalam ${days} hari terakhir?`)) return
    setNotifying(true)
    try {
      const p   = new URLSearchParams({ days })
      const res = await apiFetch(`/early-warnings/notify?${p}`, { method: 'POST' })
      showToast(res.message ?? t.ad_notif_sukses)
    } catch (e) { showToast(e.message, 'error') }
    finally { setNotifying(false) }
  }

  // Filter lokal
  const filtered = warnings.filter(w => {
    if (sevFilter !== 'semua' && w.severity !== sevFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!w.nama_lengkap.toLowerCase().includes(q) &&
          !(w.label_rombel ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const critical = warnings.filter(w => w.severity === 'critical').length

  return (
    <div class="ew-page">
      <Toast toast={toast} />

      {/* Header */}
      <div class="ew-header">
        <div>
          <h1 class="ew-title">Early Warning System</h1>
          <p class="ew-sub">
            Siswa dengan pola alpha mengkhawatirkan · {days} hari terakhir
          </p>
        </div>
        <div class="ew-header-actions">
          <button class="ew-btn ew-btn--outline" onClick={load} disabled={loading}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            {loading ? t.ad_memuat : t.ad_refresh}
          </button>
          <button
            class="ew-btn ew-btn--warn"
            onClick={handleNotify}
            disabled={notifying || warnings.length === 0}
            title="Kirim notifikasi ke wali kelas"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            {notifying ? t.ad_mengirim : t.ad_notif_wali}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && warnings.length > 0 && (
        <SummaryCards summary={summary} warnings={warnings} />
      )}

      {/* Banner critical */}
      {!loading && critical > 0 && (
        <div class="ew-critical-banner">
          <span class="ew-critical-icon">🚨</span>
          <div>
            <strong>{critical} siswa level KRITIS</strong> — alpha ≥50% dari total jam dalam {days} hari.
            Perlu penanganan segera.
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div class="ew-filter-bar">
        <div class="ew-filter-group">
          <label class="ew-filter-label">Periode</label>
          <div class="ew-filter-chips">
            {[7, 14, 30].map(d => (
              <button key={d}
                class={`ew-chip${days === d ? ' ew-chip--active' : ''}`}
                onClick={() => setDays(d)}
              >{d} hari</button>
            ))}
          </div>
        </div>

        <div class="ew-filter-group">
          <label class="ew-filter-label">Min Alpha</label>
          <div class="ew-filter-chips">
            {[2, 3, 5].map(n => (
              <button key={n}
                class={`ew-chip${minAlpha === n ? ' ew-chip--active' : ''}`}
                onClick={() => setMinAlpha(n)}
              >≥{n}x</button>
            ))}
          </div>
        </div>

        <div class="ew-filter-group">
          <label class="ew-filter-label">Rombel</label>
          <select class="ew-select" value={rombelId} onChange={e => setRombelId(e.target.value)}>
            <option value="">Semua Rombel</option>
            {rombelList.map(r => (
              <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>
            ))}
          </select>
        </div>

        <div class="ew-filter-group">
          <label class="ew-filter-label">Level</label>
          <select class="ew-select" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
            <option value="semua">Semua Level</option>
            <option value="critical">🔴 Kritis</option>
            <option value="high">🟠 Tinggi</option>
            <option value="medium">🟡 Sedang</option>
          </select>
        </div>

        <input
          class="ew-search"
          type="text"
          placeholder="Cari nama / rombel…"
          value={search}
          onInput={e => setSearch(e.target.value)}
        />

        <span class="ew-count-pill">{filtered.length} siswa</span>
      </div>

      {/* Error */}
      {error && (
        <div class="ew-error-bar"><span>⚠</span> {error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div class="ew-skeleton-wrap">
          <div class="ew-skeleton" />
          <div class="ew-skeleton ew-skeleton--sm" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div class="ew-empty">
          <div class="ew-empty-icon">✅</div>
          <p class="ew-empty-title">
            {warnings.length === 0
              ? `Tidak ada siswa dengan alpha ≥${minAlpha}x dalam ${days} hari terakhir`
              : t.ad_tidak_ada_hasil}
          </p>
          <p class="ew-empty-sub">
            {warnings.length === 0
              ? t.ad_hadir_baik
              : t.ad_coba_ubah_filter}
          </p>
        </div>
      )}

      {/* Tabel */}
      {!loading && filtered.length > 0 && (
        <div class="ew-table-card">
          <div class="ew-table-wrap">
            <table class="ew-table">
              <thead>
                <tr>
                  <th class="ew-th-num">#</th>
                  <th>Nama Siswa</th>
                  <th>Rombel</th>
                  <th>Level</th>
                  <th class="ew-th-r">Alpha</th>
                  <th class="ew-th-r">Terlambat</th>
                  <th class="ew-th-r">Hadir</th>
                  <th style="min-width:140px">Rate Hadir</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => (
                  <tr key={w.siswa_id} class={`ew-row ew-row--${w.severity}`}>
                    <td class="ew-td-num">{i + 1}</td>
                    <td>
                      <span class="ew-siswa-name">{w.nama_lengkap}</span>
                    </td>
                    <td>
                      <span class="ew-rombel-chip">{w.label_rombel}</span>
                    </td>
                    <td><SeverityBadge sev={w.severity} /></td>
                    <td class="ew-td-r ew-num-alpha">{w.alpha_count}</td>
                    <td class="ew-td-r ew-num-terlambat">{w.terlambat_count}</td>
                    <td class="ew-td-r ew-num-hadir">{w.hadir_count}</td>
                    <td><RateBar rate={w.rate_hadir} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div class="ew-table-footer">
            <span class="ew-count-label">
              {filtered.length} siswa{search || sevFilter !== 'semua'
                ? ` (filter dari ${warnings.length})` : ''}
              · periode {days} hari · min alpha {minAlpha}x
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
