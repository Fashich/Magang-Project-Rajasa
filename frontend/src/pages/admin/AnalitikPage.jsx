import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { T } from '../../utils/lang.js'
import './AnalitikPage.css'

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

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}

function formatDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
}

function pctColor(rate) {
  if (rate >= 85) return '#10b981'
  if (rate >= 70) return '#f59e0b'
  return '#ef4444'
}

const STATUS_COLOR = {
  hadir:     '#10b981',
  terlambat: '#f59e0b',
  alpha:     '#ef4444',
  sakit:     '#3b82f6',
  izin:      '#8b5cf6',
}

// ── Chart hook ────────────────────────────────────────────────────────────────

function useChart(canvasRef, buildConfig, deps) {
  const chartRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
      const cfg = buildConfig()
      if (!cfg) return
      chartRef.current = new Chart(canvas, cfg)
    })

    return () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────

function Panel({ title, sub, children, loading, error }) {
  return (
    <div class="an-panel">
      <div class="an-panel-header">
        <div>
          <h3 class="an-panel-title">{title}</h3>
          {sub && <p class="an-panel-sub">{sub}</p>}
        </div>
      </div>
      {loading && (
        <div class="an-panel-body an-panel-loading">
          <div class="an-skeleton" />
        </div>
      )}
      {error && !loading && (
        <div class="an-panel-body">
          <div class="an-error-bar"><span>⚠</span> {error}</div>
        </div>
      )}
      {!loading && !error && (
        <div class="an-panel-body">{children}</div>
      )}
    </div>
  )
}

// ── 1. Tren Line Chart ────────────────────────────────────────────────────────

function TrenPanel({ dari, sampai }) {
  const [data, setData]     = useState([])
  const [meta, setMeta]     = useState({})
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState(null)
  const canvasRef           = useRef(null)

  const load = useCallback(async () => {
    setLoad(true); setError(null)
    try {
      const p   = new URLSearchParams({ jenis: 'tren', tanggal_dari: dari, tanggal_sampai: sampai })
      const res = await apiFetch(`/admin/analitik?${p}`)
      setData(res.data?.data ?? [])
      setMeta(res.data?.meta ?? {})
    } catch (e) { setError(e.message) }
    finally { setLoad(false) }
  }, [dari, sampai])

  useEffect(() => { load() }, [load])

  useChart(canvasRef, () => {
    if (!data.length) return null
    const labels    = data.map(d => {
      const dt = new Date(d.tanggal)
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`
    })
    const rates     = data.map(d => d.rate)
    const alphas    = data.map(d => d.alpha)
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Rate Kehadiran (%)',
            data: rates,
            borderColor: '#4f46e5',
            backgroundColor: '#4f46e520',
            tension: 0.35,
            fill: true,
            pointRadius: data.length > 30 ? 0 : 3,
            pointHoverRadius: 5,
            yAxisID: 'y',
          },
          {
            label: 'Alpha',
            data: alphas,
            borderColor: '#ef4444',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderDash: [4, 3],
            pointRadius: 0,
            pointHoverRadius: 4,
            yAxisID: 'y2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Poppins', size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => ctx.datasetIndex === 0
                ? ` Rate: ${ctx.parsed.y}%`
                : ` Alpha: ${ctx.parsed.y} rekord`,
            },
          },
        },
        scales: {
          x: { ticks: { font: { family: 'Poppins', size: 10 }, maxRotation: 45 }, grid: { color: '#e2e8f0' } },
          y: {
            min: 0, max: 100,
            ticks: { font: { family: 'Poppins', size: 10 }, callback: v => `${v}%` },
            grid: { color: '#e2e8f0' },
            title: { display: true, text: 'Rate (%)', font: { family: 'Poppins', size: 10 } },
          },
          y2: {
            position: 'right',
            ticks: { font: { family: 'Poppins', size: 10 } },
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Alpha', font: { family: 'Poppins', size: 10 } },
          },
        },
      },
    }
  }, [data])

  const avgColor = pctColor(meta.avg_rate_periode ?? 0)

  return (
    <Panel
      title="Tren Rate Kehadiran"
      sub={`${formatDate(dari)} – ${formatDate(sampai)}`}
      loading={loading}
      error={error}
    >
      {data.length > 0 && (
        <>
          <div class="an-meta-row">
            <div class="an-meta-chip">
              <span class="an-meta-val" style={{ color: avgColor }}>{meta.avg_rate_periode}%</span>
              <span class="an-meta-lbl">Rata-rata periode</span>
            </div>
            <div class="an-meta-chip">
              <span class="an-meta-val" style={{ color: pctColor(meta.avg_rate_7d ?? 0) }}>{meta.avg_rate_7d}%</span>
              <span class="an-meta-lbl">Rata-rata 7 hari</span>
            </div>
            <div class="an-meta-chip">
              <span class="an-meta-val">{meta.total_hari}</span>
              <span class="an-meta-lbl">Hari data</span>
            </div>
          </div>
          <div class="an-chart-wrap an-chart-tall">
            <canvas ref={canvasRef} />
          </div>
        </>
      )}
      {data.length === 0 && <EmptyChart />}
    </Panel>
  )
}

// ── 2. Distribusi Donut ───────────────────────────────────────────────────────

function DistribusiPanel({ dari, sampai }) {
  const [dist,        setDist]    = useState([])
  const [perTingkatan, setTkt]    = useState([])
  const [total,       setTotal]   = useState(0)
  const [loading,     setLoad]    = useState(false)
  const [error,       setError]   = useState(null)
  const donutRef  = useRef(null)
  const barRef    = useRef(null)

  const load = useCallback(async () => {
    setLoad(true); setError(null)
    try {
      const p   = new URLSearchParams({ jenis: 'distribusi', tanggal_dari: dari, tanggal_sampai: sampai })
      const res = await apiFetch(`/admin/analitik?${p}`)
      setDist(res.data?.distribusi     ?? [])
      setTkt(res.data?.per_tingkatan   ?? [])
      setTotal(res.data?.total         ?? 0)
    } catch (e) { setError(e.message) }
    finally { setLoad(false) }
  }, [dari, sampai])

  useEffect(() => { load() }, [load])

  // Donut
  useChart(donutRef, () => {
    if (!dist.length) return null
    return {
      type: 'doughnut',
      data: {
        labels: dist.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
        datasets: [{
          data: dist.map(d => d.jumlah),
          backgroundColor: dist.map(d => d.color),
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { family: 'Poppins', size: 11 }, padding: 12 } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const d = dist[ctx.dataIndex]
                return ` ${d.jumlah.toLocaleString('id')} (${d.pct}%)`
              },
            },
          },
        },
      },
    }
  }, [dist])

  // Bar per tingkatan
  useChart(barRef, () => {
    if (!perTingkatan.length) return null
    return {
      type: 'bar',
      data: {
        labels: perTingkatan.map(t => `Kelas ${t.tingkatan}`),
        datasets: [
          {
            label: 'Hadir',
            data: perTingkatan.map(t => t.hadir),
            backgroundColor: '#10b98180',
            borderColor: '#10b981',
            borderWidth: 1,
          },
          {
            label: 'Alpha',
            data: perTingkatan.map(t => t.alpha),
            backgroundColor: '#ef444480',
            borderColor: '#ef4444',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Poppins', size: 11 } } },
        },
        scales: {
          x: { ticks: { font: { family: 'Poppins', size: 11 } }, grid: { color: '#e2e8f0' } },
          y: { ticks: { font: { family: 'Poppins', size: 10 } }, grid: { color: '#e2e8f0' } },
        },
      },
    }
  }, [perTingkatan])

  return (
    <Panel
      title="Distribusi Status Kehadiran"
      sub={`Total ${total.toLocaleString('id')} rekord`}
      loading={loading}
      error={error}
    >
      {dist.length > 0 && (
        <div class="an-distribusi-grid">
          <div>
            <p class="an-chart-label">Proporsi global</p>
            <div class="an-chart-wrap an-chart-donut">
              <canvas ref={donutRef} />
            </div>
            <div class="an-dist-pills">
              {dist.map(d => (
                <div key={d.status} class="an-dist-pill">
                  <span class="an-dist-dot" style={{ background: d.color }} />
                  <span class="an-dist-status">{d.status}</span>
                  <span class="an-dist-pct">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p class="an-chart-label">Per tingkatan kelas</p>
            <div class="an-chart-wrap an-chart-bar-sm">
              <canvas ref={barRef} />
            </div>
          </div>
        </div>
      )}
      {dist.length === 0 && <EmptyChart />}
    </Panel>
  )
}

// ── 3. Ranking Rombel ─────────────────────────────────────────────────────────

function RombelRankingPanel({ dari, sampai }) {
  const [data,    setData]   = useState([])
  const [loading, setLoad]   = useState(false)
  const [error,   setError]  = useState(null)
  const canvasRef            = useRef(null)

  const load = useCallback(async () => {
    setLoad(true); setError(null)
    try {
      const p   = new URLSearchParams({ jenis: 'rombel_ranking', tanggal_dari: dari, tanggal_sampai: sampai })
      const res = await apiFetch(`/admin/analitik?${p}`)
      setData(res.data?.data ?? [])
    } catch (e) { setError(e.message) }
    finally { setLoad(false) }
  }, [dari, sampai])

  useEffect(() => { load() }, [load])

  useChart(canvasRef, () => {
    if (!data.length) return null
    const sorted = [...data].sort((a, b) => a.rate - b.rate)
    return {
      type: 'bar',
      data: {
        labels: sorted.map(r => r.label_rombel),
        datasets: [{
          label: 'Rate Kehadiran (%)',
          data: sorted.map(r => r.rate),
          backgroundColor: sorted.map(r => pctColor(r.rate) + 'cc'),
          borderColor: sorted.map(r => pctColor(r.rate)),
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const r = sorted[ctx.dataIndex]
                return ` ${r.rate}%  (${r.hadir}/${r.total} hadir)`
              },
            },
          },
        },
        scales: {
          x: {
            min: 0, max: 100,
            ticks: { font: { family: 'Poppins', size: 10 }, callback: v => `${v}%` },
            grid: { color: '#e2e8f0' },
          },
          y: {
            ticks: { font: { family: 'Poppins', size: 10 } },
            grid: { display: false },
          },
        },
      },
    }
  }, [data])

  const best  = data[0]
  const worst = data[data.length - 1]

  return (
    <Panel
      title="Ranking Rombel by Rate Kehadiran"
      sub={`${data.length} rombel aktif`}
      loading={loading}
      error={error}
    >
      {data.length > 0 && (
        <>
          {best && worst && best.rombel_id !== worst.rombel_id && (
            <div class="an-rank-highlight">
              <div class="an-rank-card an-rank-card--best">
                <span class="an-rank-badge">🥇 Terbaik</span>
                <span class="an-rank-name">{best.label_rombel}</span>
                <span class="an-rank-rate" style={{ color: pctColor(best.rate) }}>{best.rate}%</span>
              </div>
              <div class="an-rank-card an-rank-card--worst">
                <span class="an-rank-badge">⚠ Perlu Perhatian</span>
                <span class="an-rank-name">{worst.label_rombel}</span>
                <span class="an-rank-rate" style={{ color: pctColor(worst.rate) }}>{worst.rate}%</span>
              </div>
            </div>
          )}
          <div class="an-chart-wrap" style={{ height: `${Math.max(200, data.length * 32)}px` }}>
            <canvas ref={canvasRef} />
          </div>
        </>
      )}
      {data.length === 0 && <EmptyChart />}
    </Panel>
  )
}

// ── 4. Heatmap per Jam ────────────────────────────────────────────────────────

function JamHeatmapPanel({ dari, sampai }) {
  const [data,    setData]   = useState([])
  const [loading, setLoad]   = useState(false)
  const [error,   setError]  = useState(null)
  const canvasRef            = useRef(null)

  const load = useCallback(async () => {
    setLoad(true); setError(null)
    try {
      const p   = new URLSearchParams({ jenis: 'jam_heatmap', tanggal_dari: dari, tanggal_sampai: sampai })
      const res = await apiFetch(`/admin/analitik?${p}`)
      setData(res.data?.data ?? [])
    } catch (e) { setError(e.message) }
    finally { setLoad(false) }
  }, [dari, sampai])

  useEffect(() => { load() }, [load])

  useChart(canvasRef, () => {
    if (!data.length) return null
    return {
      type: 'bar',
      data: {
        labels: data.map(j => `Jam ${j.jam_ke}${j.waktu_mulai ? ` (${j.waktu_mulai.slice(0,5)})` : ''}`),
        datasets: [
          {
            label: 'Hadir',
            data: data.map(j => j.hadir),
            backgroundColor: '#10b98180',
            borderColor: '#10b981',
            borderWidth: 1,
            stack: 'total',
          },
          {
            label: 'Terlambat',
            data: data.map(j => j.terlambat),
            backgroundColor: '#f59e0b80',
            borderColor: '#f59e0b',
            borderWidth: 1,
            stack: 'total',
          },
          {
            label: 'Alpha',
            data: data.map(j => j.alpha),
            backgroundColor: '#ef444480',
            borderColor: '#ef4444',
            borderWidth: 1,
            stack: 'total',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Poppins', size: 11 } } },
          tooltip: {
            callbacks: {
              footer: items => {
                const jam = data[items[0].dataIndex]
                return `Rate: ${jam.rate}%`
              },
            },
          },
        },
        scales: {
          x: { stacked: true, ticks: { font: { family: 'Poppins', size: 10 } }, grid: { color: '#e2e8f0' } },
          y: { stacked: true, ticks: { font: { family: 'Poppins', size: 10 } }, grid: { color: '#e2e8f0' } },
        },
      },
    }
  }, [data])

  const worstJam = data.length ? [...data].sort((a, b) => a.rate - b.rate)[0] : null

  return (
    <Panel
      title="Distribusi Kehadiran per Jam Pelajaran"
      sub="Stacked: hadir + terlambat + alpha"
      loading={loading}
      error={error}
    >
      {data.length > 0 && (
        <>
          {worstJam && (
            <div class="an-jam-info">
              <span class="an-jam-badge">⏰ Jam paling banyak alpha</span>
              <strong>Jam {worstJam.jam_ke}</strong>
              {worstJam.waktu_mulai && <span class="an-jam-time">{worstJam.waktu_mulai.slice(0,5)}</span>}
              <span style={{ color: pctColor(worstJam.rate), fontWeight: 600 }}>{worstJam.rate}%</span>
            </div>
          )}
          <div class="an-chart-wrap an-chart-tall">
            <canvas ref={canvasRef} />
          </div>
          {/* Rate per jam — chip list */}
          <div class="an-jam-chips">
            {data.map(j => (
              <div key={j.jam_id} class="an-jam-chip">
                <span class="an-jam-chip-label">Jam {j.jam_ke}</span>
                <span class="an-jam-chip-rate" style={{ color: pctColor(j.rate) }}>{j.rate}%</span>
              </div>
            ))}
          </div>
        </>
      )}
      {data.length === 0 && <EmptyChart />}
    </Panel>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div class="an-empty">
      <div class="an-empty-icon">📈</div>
      <p class="an-empty-title">Tidak ada data pada rentang ini</p>
      <p class="an-empty-sub">Coba perluas rentang tanggal.</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalitikPage({ lang }) {
  const t = T[lang] || T.id
  const [dari,   setDari]   = useState(daysAgo(29))
  const [sampai, setSampai] = useState(todayString)

  const rangeLabel = `${formatDate(dari)} – ${formatDate(sampai)}`

  const shortcuts = [
    { label: t.ad_7_hari,    d: daysAgo(6),     s: todayString() },
    { label: t.ad_30_hari,   d: daysAgo(29),    s: todayString() },
    { label: t.ad_bulan_ini, d: startOfMonth(), s: todayString() },
  ]

  return (
    <div class="an-page">

      {/* ── Header ── */}
      <div class="an-header">
        <div>
          <h1 class="an-title">Analitik Kehadiran</h1>
          <p class="an-sub">{rangeLabel}</p>
        </div>
      </div>

      {/* ── Date filter ── */}
      <div class="an-date-bar">
        <div class="an-filter-group">
          <label class="an-filter-label">Dari</label>
          <input type="date" class="an-input-date" value={dari}
            max={sampai} onChange={e => setDari(e.target.value)} />
        </div>
        <div class="an-filter-group">
          <label class="an-filter-label">Sampai</label>
          <input type="date" class="an-input-date" value={sampai}
            max={todayString()} onChange={e => setSampai(e.target.value)} />
        </div>
        <div class="an-shortcuts">
          {shortcuts.map(({ label, d, s }) => (
            <button
              key={label}
              class={`an-shortcut${dari === d && sampai === s ? ' an-shortcut--active' : ''}`}
              onClick={() => { setDari(d); setSampai(s) }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── Grid 2×2 ── */}
      <div class="an-grid">
        <TrenPanel         dari={dari} sampai={sampai} />
        <DistribusiPanel   dari={dari} sampai={sampai} />
        <RombelRankingPanel dari={dari} sampai={sampai} />
        <JamHeatmapPanel   dari={dari} sampai={sampai} />
      </div>
    </div>
  )
}
