/**
 * LaporanPage.jsx
 * Halaman Laporan & Export (admin)
 * Branch: feature/admin-dashboard
 *
 * Tiga tab:
 *   - Rekap per Rombel  : summary kehadiran tiap kelas + bar rate
 *   - Rekap per Siswa   : daftar detail per siswa (filter rombel)
 *   - Rekap Harian      : tren kehadiran per hari + sparkline sederhana
 *
 * Export: CSV (Blob download) + Print PDF (window.print)
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import './LaporanPage.css'

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

function todayString() { return new Date().toISOString().slice(0, 10) }
function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateShort(s) {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
}

function pctColor(rate) {
  if (rate >= 85) return '#10b981'
  if (rate >= 70) return '#f59e0b'
  return '#ef4444'
}


// ── File Export (Excel / PDF dari server) ────────────────────────────────────
async function downloadFile(params, filename) {
  try {
    const token = localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token') || ''
    const res = await fetch(`/api/admin/laporan/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { alert('Export gagal. Coba lagi.'); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  } catch (e) { alert('Export error: ' + e.message) }
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function downloadCSV(rows, headers, filename) {
  const escape = v => {
    const s = String(v ?? '').replace(/"/g, '""')
    return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s
  }
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Rate Bar ─────────────────────────────────────────────────────────────────

function RateBar({ rate }) {
  const color = pctColor(rate)
  return (
    <div class="lp-rate-wrap">
      <div class="lp-rate-bar">
        <div class="lp-rate-fill" style={{ width: `${Math.min(rate, 100)}%`, background: color }} />
      </div>
      <span class="lp-rate-num" style={{ color }}>{rate}%</span>
    </div>
  )
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

function SummaryCards({ summary, jenis }) {
  const rombelCards = [
    { key: 'rate_global',   label: 'Rate Kehadiran',  icon: '📊', fmt: v => `${v}%`, accent: '--lp-green'  },
    { key: 'total_hadir',   label: 'Total Hadir',     icon: '✅', fmt: v => v,        accent: '--lp-blue'   },
    { key: 'total_alpha',   label: 'Total Alpha',     icon: '❌', fmt: v => v,        accent: '--lp-red'    },
    { key: 'total_records', label: 'Total Record',    icon: '📋', fmt: v => v,        accent: '--lp-indigo' },
  ]
  const harianCards = [
    { key: 'rate_global',   label: 'Rate Kehadiran',  icon: '📊', fmt: v => `${v}%`, accent: '--lp-green'  },
    { key: 'hadir',         label: 'Total Hadir',     icon: '✅', fmt: v => v,        accent: '--lp-blue'   },
    { key: 'alpha',         label: 'Total Alpha',     icon: '❌', fmt: v => v,        accent: '--lp-red'    },
    { key: 'total',         label: 'Total Record',    icon: '📋', fmt: v => v,        accent: '--lp-indigo' },
  ]
  const cards = jenis === 'rekap_harian' ? harianCards : rombelCards
  return (
    <div class="lp-cards">
      {cards.map(({ key, label, icon, fmt, accent }) => (
        <div key={key} class="lp-card">
          <div class="lp-card-strip" style={{ background: `var(${accent})` }} />
          <div class="lp-card-body">
            <span class="lp-card-icon" style={{ background: `var(${accent})1a`, color: `var(${accent})` }}>
              {icon}
            </span>
            <div>
              <div class="lp-card-num">{fmt(summary[key] ?? 0)}</div>
              <div class="lp-card-lbl">{label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Rekap per Rombel ─────────────────────────────────────────────────────

function RekapRombelTab({ dari, sampai }) {
  const [data,    setData]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p   = new URLSearchParams({ jenis: 'rekap_rombel', tanggal_dari: dari, tanggal_sampai: sampai })
      const res = await apiFetch(`/admin/laporan?${p}`)
      setData(res.data?.data       ?? [])
      setSummary(res.data?.summary ?? {})
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [dari, sampai])

  useEffect(() => { load() }, [load])

  function handleExportCSV() {
    const rows = data.map(r => ({
      Rombel: r.label_rombel, Tingkatan: r.tingkatan,
      'Total Siswa': r.total_siswa, Hadir: r.hadir, Terlambat: r.terlambat,
      Alpha: r.alpha, Sakit: r.sakit, Izin: r.izin,
      'Total Record': r.total, 'Rate (%)': r.rate,
    }))
    downloadCSV(rows, ['Rombel','Tingkatan','Total Siswa','Hadir','Terlambat','Alpha','Sakit','Izin','Total Record','Rate (%)'],
      `rekap-rombel_${dari}_sd_${sampai}.csv`)
  }

  return (
    <div class="lp-tab-content">
      {error && <div class="lp-error-bar"><span>⚠</span> {error}</div>}
      {!loading && data.length > 0 && (
        <>
          <SummaryCards summary={summary} jenis="rekap_rombel" />
          <div class="lp-toolbar">
            <span class="lp-toolbar-info">{data.length} rombel aktif</span>
            <div class="lp-toolbar-right">
              <button class="lp-btn lp-btn--outline" onClick={() => {
                const p = new URLSearchParams({ format:'pdf', jenis:'rekap_rombel', tanggal_dari:dari, tanggal_sampai:sampai })
                downloadFile(p, `rekap-rombel_${dari}_sd_${sampai}.pdf`)
              }}>
                📄 Export PDF
              </button>
              <button class="lp-btn lp-btn--primary" onClick={() => {
                const p = new URLSearchParams({ format:'excel', jenis:'rekap_rombel', tanggal_dari:dari, tanggal_sampai:sampai })
                downloadFile(p, `rekap-rombel_${dari}_sd_${sampai}.xlsx`)
              }}>
                📊 Export Excel
              </button>
            </div>
          </div>
          <div class="lp-table-card lp-printable">
            <div class="lp-print-header">
              <h2>Rekap Kehadiran per Rombel</h2>
              <p>Periode: {formatDate(dari)} – {formatDate(sampai)}</p>
              <p>Rate Kehadiran Global: <strong>{summary.rate_global}%</strong></p>
            </div>
            <div class="lp-table-wrap">
              <table class="lp-table">
                <thead>
                  <tr>
                    <th class="lp-th-num">#</th>
                    <th>Rombel</th>
                    <th class="lp-th-r">Siswa</th>
                    <th class="lp-th-r">Hadir</th>
                    <th class="lp-th-r">Terlambat</th>
                    <th class="lp-th-r">Alpha</th>
                    <th class="lp-th-r">Sakit</th>
                    <th class="lp-th-r">Izin</th>
                    <th style="min-width:140px">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={r.rombel_id}>
                      <td class="lp-td-num">{i + 1}</td>
                      <td>
                        <span class="lp-rombel-label">{r.label_rombel}</span>
                        <span class="lp-tingkatan-chip">{r.tingkatan}</span>
                      </td>
                      <td class="lp-td-r">{r.total_siswa}</td>
                      <td class="lp-td-r lp-num-hadir">{r.hadir}</td>
                      <td class="lp-td-r lp-num-terlambat">{r.terlambat}</td>
                      <td class="lp-td-r lp-num-alpha">{r.alpha}</td>
                      <td class="lp-td-r lp-num-sakit">{r.sakit}</td>
                      <td class="lp-td-r lp-num-izin">{r.izin}</td>
                      <td><RateBar rate={r.rate} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr class="lp-tfoot-row">
                    <td colSpan={2}><strong>Total Global</strong></td>
                    <td class="lp-td-r">—</td>
                    <td class="lp-td-r lp-num-hadir"><strong>{summary.total_hadir}</strong></td>
                    <td class="lp-td-r">—</td>
                    <td class="lp-td-r lp-num-alpha"><strong>{summary.total_alpha}</strong></td>
                    <td class="lp-td-r lp-num-sakit"><strong>{summary.total_sakit}</strong></td>
                    <td class="lp-td-r lp-num-izin"><strong>{summary.total_izin}</strong></td>
                    <td>
                      <span class="lp-rate-global" style={{ color: pctColor(summary.rate_global ?? 0) }}>
                        {summary.rate_global}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
      {loading && <div class="lp-skeleton-wrap"><div class="lp-skeleton" /><div class="lp-skeleton lp-skeleton--sm" /></div>}
      {!loading && data.length === 0 && !error && <EmptyState />}
    </div>
  )
}

// ── Tab: Rekap per Siswa ──────────────────────────────────────────────────────

function RekapSiswaTab({ dari, sampai }) {
  const [data,       setData]       = useState([])
  const [rombelList, setRombelList] = useState([])
  const [rombelId,   setRombelId]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p = new URLSearchParams({ jenis: 'rekap_siswa', tanggal_dari: dari, tanggal_sampai: sampai })
      if (rombelId) p.set('rombel_id', rombelId)
      const res = await apiFetch(`/admin/laporan?${p}`)
      setData(res.data?.data          ?? [])
      setRombelList(res.data?.rombel_list ?? [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [dari, sampai, rombelId])

  useEffect(() => { load() }, [load])

  const filtered = search.trim()
    ? data.filter(s =>
        s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
        (s.nisn ?? '').includes(search) ||
        (s.nis  ?? '').includes(search)
      )
    : data

  function handleExportCSV() {
    const rows = filtered.map(s => ({
      NIS: s.nis ?? '', NISN: s.nisn, Nama: s.nama_lengkap, Rombel: s.label_rombel,
      Hadir: s.hadir, Terlambat: s.terlambat, Alpha: s.alpha, Sakit: s.sakit, Izin: s.izin,
      Total: s.total, 'Rate (%)': s.rate,
    }))
    downloadCSV(rows, ['NIS','NISN','Nama','Rombel','Hadir','Terlambat','Alpha','Sakit','Izin','Total','Rate (%)'],
      `rekap-siswa_${dari}_sd_${sampai}.csv`)
  }

  return (
    <div class="lp-tab-content">
      {error && <div class="lp-error-bar"><span>⚠</span> {error}</div>}
      <div class="lp-filter-row">
        <select
          class="lp-select"
          value={rombelId}
          onChange={e => setRombelId(e.target.value)}
        >
          <option value="">Semua Rombel</option>
          {rombelList.map(r => (
            <option key={r.rombel_id} value={r.rombel_id}>{r.label_rombel}</option>
          ))}
        </select>
        <input
          type="text"
          class="lp-search"
          placeholder="Cari nama / NIS / NISN…"
          value={search}
          onInput={e => setSearch(e.target.value)}
        />
        <div class="lp-toolbar-right">
          <button class="lp-btn lp-btn--outline" onClick={window.print}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            Print PDF
          </button>
          <button class="lp-btn lp-btn--primary" onClick={handleExportCSV} disabled={filtered.length === 0}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <div class="lp-table-card lp-printable">
          <div class="lp-print-header">
            <h2>Rekap Kehadiran per Siswa</h2>
            <p>Periode: {formatDate(dari)} – {formatDate(sampai)}</p>
            {rombelId && rombelList.find(r => String(r.rombel_id) === rombelId) && (
              <p>Rombel: <strong>{rombelList.find(r => String(r.rombel_id) === rombelId)?.label_rombel}</strong></p>
            )}
          </div>
          <div class="lp-table-wrap">
            <table class="lp-table">
              <thead>
                <tr>
                  <th class="lp-th-num">#</th>
                  <th>Nama Siswa</th>
                  <th>Rombel</th>
                  <th class="lp-th-r">Hadir</th>
                  <th class="lp-th-r">Terlambat</th>
                  <th class="lp-th-r">Alpha</th>
                  <th class="lp-th-r">Sakit</th>
                  <th class="lp-th-r">Izin</th>
                  <th style="min-width:120px">Rate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.siswa_id} class={s.rate < 70 ? 'lp-row-danger' : s.rate < 85 ? 'lp-row-warn' : ''}>
                    <td class="lp-td-num">{i + 1}</td>
                    <td>
                      <div class="lp-siswa-name">{s.nama_lengkap}</div>
                      <div class="lp-siswa-nis">{s.nis || s.nisn}</div>
                    </td>
                    <td><span class="lp-rombel-chip">{s.label_rombel}</span></td>
                    <td class="lp-td-r lp-num-hadir">{s.hadir}</td>
                    <td class="lp-td-r lp-num-terlambat">{s.terlambat}</td>
                    <td class="lp-td-r lp-num-alpha">{s.alpha}</td>
                    <td class="lp-td-r lp-num-sakit">{s.sakit}</td>
                    <td class="lp-td-r lp-num-izin">{s.izin}</td>
                    <td><RateBar rate={s.rate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div class="lp-table-footer">
            <span class="lp-count-label">
              {filtered.length} siswa{search ? ` (filter dari ${data.length})` : ''}
            </span>
          </div>
        </div>
      )}
      {loading && <div class="lp-skeleton-wrap"><div class="lp-skeleton" /><div class="lp-skeleton lp-skeleton--sm" /></div>}
      {!loading && filtered.length === 0 && !error && <EmptyState />}
    </div>
  )
}

// ── Tab: Rekap Harian ─────────────────────────────────────────────────────────

function RekapHarianTab({ dari, sampai }) {
  const [data,    setData]    = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const p   = new URLSearchParams({ jenis: 'rekap_harian', tanggal_dari: dari, tanggal_sampai: sampai })
      const res = await apiFetch(`/admin/laporan?${p}`)
      setData(res.data?.data       ?? [])
      setSummary(res.data?.summary ?? {})
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [dari, sampai])

  useEffect(() => { load() }, [load])

  // Sparkline sederhana — SVG inline
  function Sparkline({ rows }) {
    if (rows.length < 2) return null
    const rates  = rows.map(r => r.rate)
    const maxV   = Math.max(...rates, 1)
    const W = 320, H = 60, pad = 4
    const pts = rates.map((v, i) => {
      const x = pad + (i / (rates.length - 1)) * (W - pad * 2)
      const y = pad + (1 - v / maxV) * (H - pad * 2)
      return `${x},${y}`
    }).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} class="lp-sparkline" preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke="var(--lp-indigo)" stroke-width="2" stroke-linejoin="round" />
        {rates.map((v, i) => {
          const x = pad + (i / (rates.length - 1)) * (W - pad * 2)
          const y = pad + (1 - v / maxV) * (H - pad * 2)
          return <circle key={i} cx={x} cy={y} r="3" fill={pctColor(v)} />
        })}
      </svg>
    )
  }

  function handleExportCSV() {
    const rows = data.map(r => ({
      Tanggal: r.tanggal, Hadir: r.hadir, Terlambat: r.terlambat,
      Alpha: r.alpha, Sakit: r.sakit, Izin: r.izin,
      Total: r.total, 'Rate (%)': r.rate,
    }))
    downloadCSV(rows, ['Tanggal','Hadir','Terlambat','Alpha','Sakit','Izin','Total','Rate (%)'],
      `rekap-harian_${dari}_sd_${sampai}.csv`)
  }

  return (
    <div class="lp-tab-content">
      {error && <div class="lp-error-bar"><span>⚠</span> {error}</div>}
      {!loading && data.length > 0 && (
        <>
          <SummaryCards summary={summary} jenis="rekap_harian" />

          {/* Mini sparkline chart */}
          <div class="lp-chart-card">
            <div class="lp-chart-header">
              <span class="lp-chart-title">Tren Rate Kehadiran</span>
              <span class="lp-chart-legend">
                <span class="lp-legend-dot" style="background:var(--lp-green)" /> ≥85%
                <span class="lp-legend-dot" style="background:var(--lp-amber)" /> 70–84%
                <span class="lp-legend-dot" style="background:var(--lp-red)"   /> &lt;70%
              </span>
            </div>
            <Sparkline rows={data} />
          </div>

          <div class="lp-toolbar">
            <span class="lp-toolbar-info">{data.length} hari data</span>
            <div class="lp-toolbar-right">
              <button class="lp-btn lp-btn--outline" onClick={() => {
                const p = new URLSearchParams({ format:'pdf', jenis:'rekap_rombel', tanggal_dari:dari, tanggal_sampai:sampai })
                downloadFile(p, `rekap-rombel_${dari}_sd_${sampai}.pdf`)
              }}>
                📄 Export PDF
              </button>
              <button class="lp-btn lp-btn--primary" onClick={() => {
                const p = new URLSearchParams({ format:'excel', jenis:'rekap_rombel', tanggal_dari:dari, tanggal_sampai:sampai })
                downloadFile(p, `rekap-rombel_${dari}_sd_${sampai}.xlsx`)
              }}>
                📊 Export Excel
              </button>
            </div>
          </div>

          <div class="lp-table-card lp-printable">
            <div class="lp-print-header">
              <h2>Rekap Kehadiran Harian</h2>
              <p>Periode: {formatDate(dari)} – {formatDate(sampai)}</p>
            </div>
            <div class="lp-table-wrap">
              <table class="lp-table">
                <thead>
                  <tr>
                    <th class="lp-th-num">#</th>
                    <th>Tanggal</th>
                    <th class="lp-th-r">Hadir</th>
                    <th class="lp-th-r">Terlambat</th>
                    <th class="lp-th-r">Alpha</th>
                    <th class="lp-th-r">Sakit</th>
                    <th class="lp-th-r">Izin</th>
                    <th class="lp-th-r">Total</th>
                    <th style="min-width:130px">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={r.tanggal}>
                      <td class="lp-td-num">{i + 1}</td>
                      <td class="lp-td-date">
                        {new Date(r.tanggal).toLocaleDateString('id-ID', {
                          weekday: 'short', day: '2-digit', month: 'short'
                        })}
                      </td>
                      <td class="lp-td-r lp-num-hadir">{r.hadir}</td>
                      <td class="lp-td-r lp-num-terlambat">{r.terlambat}</td>
                      <td class="lp-td-r lp-num-alpha">{r.alpha}</td>
                      <td class="lp-td-r lp-num-sakit">{r.sakit}</td>
                      <td class="lp-td-r lp-num-izin">{r.izin}</td>
                      <td class="lp-td-r">{r.total}</td>
                      <td><RateBar rate={r.rate} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {loading && <div class="lp-skeleton-wrap"><div class="lp-skeleton" /><div class="lp-skeleton lp-skeleton--sm" /></div>}
      {!loading && data.length === 0 && !error && <EmptyState />}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div class="lp-empty">
      <div class="lp-empty-icon">📊</div>
      <p class="lp-empty-title">Tidak ada data pada rentang ini</p>
      <p class="lp-empty-sub">Coba ubah filter tanggal atau pilih rombel lain.</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const [tab,    setTab]    = useState('rekap_rombel')
  const [dari,   setDari]   = useState(startOfMonth)
  const [sampai, setSampai] = useState(todayString)

  const rangeLabel = dari === sampai
    ? formatDate(dari)
    : `${formatDate(dari)} – ${formatDate(sampai)}`

  const tabs = [
    { id: 'rekap_rombel', label: 'Per Rombel',  icon: '🏫' },
    { id: 'rekap_siswa',  label: 'Per Siswa',   icon: '👤' },
    { id: 'rekap_harian', label: 'Per Hari',    icon: '📅' },
  ]

  return (
    <div class="lp-page">

      {/* ── Header ── */}
      <div class="lp-header">
        <div>
          <h1 class="lp-title">Laporan & Export</h1>
          <p class="lp-sub">{rangeLabel}</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div class="lp-tabs">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            class={`lp-tab${tab === id ? ' lp-tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* ── Global filter: tanggal ── */}
      <div class="lp-date-bar">
        <div class="lp-filter-group">
          <label class="lp-filter-label">Dari</label>
          <input type="date" class="lp-input-date" value={dari}
            max={sampai} onChange={e => setDari(e.target.value)} />
        </div>
        <div class="lp-filter-group">
          <label class="lp-filter-label">Sampai</label>
          <input type="date" class="lp-input-date" value={sampai}
            max={todayString()} onChange={e => setSampai(e.target.value)} />
        </div>
        <div class="lp-date-shortcuts">
          {[
            { label: 'Bulan ini',  dari: startOfMonth(), sampai: todayString() },
            { label: '7 hari',     dari: (() => { const d = new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10) })(), sampai: todayString() },
            { label: 'Bulan lalu', dari: (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,10) })(),
                                   sampai: (() => { const d = new Date(); d.setDate(0); return d.toISOString().slice(0,10) })() },
          ].map(({ label, dari: d, sampai: s }) => {
            const active = dari === d && sampai === s
            return (
              <button key={label}
                class={`lp-shortcut${active ? ' lp-shortcut--active' : ''}`}
                onClick={() => { setDari(d); setSampai(s) }}
              >{label}</button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      {tab === 'rekap_rombel' && <RekapRombelTab dari={dari} sampai={sampai} />}
      {tab === 'rekap_siswa'  && <RekapSiswaTab  dari={dari} sampai={sampai} />}
      {tab === 'rekap_harian' && <RekapHarianTab dari={dari} sampai={sampai} />}
    </div>
  )
}
