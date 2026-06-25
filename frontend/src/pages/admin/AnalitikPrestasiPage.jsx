/**
 * AnalitikPrestasiPage.jsx
 * Halaman Analitik Prestasi — korelasi kehadiran vs nilai
 *
 * 4 Tab:
 *   Korelasi      → scatter plot kehadiran vs nilai + kuadran
 *   Ringkasan     → tabel rapor ringkas per siswa
 *   Ranking Mapel → bar chart rata-rata nilai per mapel
 *   Siswa Risiko  → daftar siswa dengan hadir/nilai rendah
 *
 * Input Nilai:
 *   Admin/Guru bisa input/edit nilai dari halaman ini langsung
 *
 * @author feature/analitik-prestasi
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import './AnalitikPrestasiPage.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '/api'

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

function getUser() {
  try {
    const raw = localStorage.getItem('presensi_lab_rajasa:auth_user')
             || localStorage.getItem('user_data')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div class="ap-stat-card" style={{ '--accent': color }}>
      <div class="ap-stat-icon">{icon}</div>
      <div>
        <div class="ap-stat-value">{value ?? 0}</div>
        <div class="ap-stat-label">{label}</div>
        {sub && <div class="ap-stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

// ── Filter bar ─────────────────────────────────────────────────────────────────

function FilterBar({ filter, setFilter, tahunAjaranList, rombelList, onRefresh }) {
  return (
    <div class="ap-filter-bar">
      <select value={filter.tahun_ajaran_id}
        onChange={e => setFilter(f => ({ ...f, tahun_ajaran_id: e.target.value }))}>
        <option value="">-- Tahun Ajaran --</option>
        {tahunAjaranList.map(t => (
          <option key={t.tahun_ajaran_id} value={t.tahun_ajaran_id}>
            {t.nama_tahun_ajaran} {t.is_aktif ? '(Aktif)' : ''}
          </option>
        ))}
      </select>

      <select value={filter.semester}
        onChange={e => setFilter(f => ({ ...f, semester: e.target.value }))}>
        <option value="ganjil">Semester Ganjil</option>
        <option value="genap">Semester Genap</option>
        <option value="pendek">Semester Pendek</option>
      </select>

      <select value={filter.rombel_id}
        onChange={e => setFilter(f => ({ ...f, rombel_id: e.target.value }))}>
        <option value="">Semua Rombel</option>
        {rombelList.map(r => (
          <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>
        ))}
      </select>

      <button class="ap-btn-ghost" onClick={onRefresh}>↺ Refresh</button>
    </div>
  )
}

// ── Tab: Korelasi ─────────────────────────────────────────────────────────────

function TabKorelasi({ filter }) {
  const [data,    setData]    = useState([])
  const [meta,    setMeta]    = useState({})
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  const load = useCallback(async () => {
    if (!filter.tahun_ajaran_id) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        jenis: 'korelasi',
        tahun_ajaran_id: filter.tahun_ajaran_id,
        semester: filter.semester,
      })
      if (filter.rombel_id) params.set('rombel_id', filter.rombel_id)
      const res = await apiFetch(`/analitik/prestasi?${params}`)
      setData(res.data?.data ?? [])
      setMeta(res.data?.meta ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  // Render scatter chart
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return
    const colors = {
      bintang: '#15803d', perhatian: '#d97706',
      potensi: '#0284c7', risiko: '#dc2626',
    }
    const datasets = ['bintang','perhatian','potensi','risiko'].map(k => ({
      label: { bintang:'⭐ Bintang', perhatian:'⚠️ Perhatian', potensi:'💡 Potensi', risiko:'🔴 Risiko' }[k],
      data: data.filter(d => d.kuadran === k).map(d => ({ x: d.rate_hadir, y: d.avg_nilai, nama: d.nama_siswa })),
      backgroundColor: colors[k] + 'cc',
      pointRadius: 6,
      pointHoverRadius: 8,
    }))

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)
      if (chartRef.current) chartRef.current.destroy()
      chartRef.current = new Chart(canvasRef.current, {
        type: 'scatter',
        data: { datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const d = ctx.raw
                  return `${d.nama}: Hadir ${d.x}% | Nilai ${d.y}`
                }
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Rate Kehadiran (%)' }, min: 0, max: 100 },
            y: { title: { display: true, text: 'Rata-rata Nilai Akhir' }, min: 0, max: 100 },
          },
        },
      })
    })
  }, [data])

  const kuadranInfo = [
    { key: 'bintang',   icon: '⭐', label: 'Bintang',   desc: 'Hadir & nilai tinggi',   color: '#15803d' },
    { key: 'perhatian', icon: '⚠️', label: 'Perhatian', desc: 'Hadir tinggi, nilai rendah', color: '#d97706' },
    { key: 'potensi',   icon: '💡', label: 'Potensi',   desc: 'Nilai tinggi, hadir kurang', color: '#0284c7' },
    { key: 'risiko',    icon: '🔴', label: 'Risiko',    desc: 'Hadir & nilai rendah',   color: '#dc2626' },
  ]

  return (
    <div class="ap-tab-content">
      {!filter.tahun_ajaran_id ? (
        <div class="ap-empty">Pilih tahun ajaran untuk menampilkan analitik.</div>
      ) : loading ? (
        <div class="ap-loading">Menghitung korelasi…</div>
      ) : data.length === 0 ? (
        <div class="ap-empty">
          <div class="ap-empty-icon">📊</div>
          Belum ada data nilai atau kehadiran untuk periode ini.
        </div>
      ) : (
        <>
          {/* Meta info */}
          <div class="ap-meta-row">
            <div class="ap-meta-item">
              <div class="ap-meta-value">{meta.total_siswa}</div>
              <div class="ap-meta-label">Siswa</div>
            </div>
            <div class="ap-meta-item">
              <div class="ap-meta-value">{meta.avg_rate_hadir}%</div>
              <div class="ap-meta-label">Rata-rata Hadir</div>
            </div>
            <div class="ap-meta-item">
              <div class="ap-meta-value">{meta.avg_nilai}</div>
              <div class="ap-meta-label">Rata-rata Nilai</div>
            </div>
            <div class="ap-meta-item" title={meta.keterangan_r}>
              <div class="ap-meta-value" style={{
                color: Math.abs(meta.korelasi_r ?? 0) >= 0.6 ? '#15803d' : '#d97706'
              }}>
                r = {meta.korelasi_r}
              </div>
              <div class="ap-meta-label">{meta.keterangan_r}</div>
            </div>
          </div>

          {/* Kuadran summary */}
          <div class="ap-kuadran-row">
            {kuadranInfo.map(k => (
              <div key={k.key} class="ap-kuadran-card" style={{ '--kclr': k.color }}>
                <div class="ap-kuadran-icon">{k.icon}</div>
                <div class="ap-kuadran-count">{meta.kuadran?.[k.key] ?? 0}</div>
                <div class="ap-kuadran-label">{k.label}</div>
                <div class="ap-kuadran-desc">{k.desc}</div>
              </div>
            ))}
          </div>

          {/* Scatter plot */}
          <div class="ap-card">
            <div class="ap-card-header">
              <h3 class="ap-card-title">📈 Scatter Plot Kehadiran vs Nilai</h3>
            </div>
            <div class="ap-card-body" style={{ height: 380, position: 'relative' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Tabel data */}
          <div class="ap-card">
            <div class="ap-card-header">
              <h3 class="ap-card-title">📋 Detail per Siswa</h3>
            </div>
            <table class="ap-table">
              <thead>
                <tr>
                  <th>Siswa</th>
                  <th>Rate Hadir</th>
                  <th>Alpha</th>
                  <th>Rata-rata Nilai</th>
                  <th>Mapel Lulus</th>
                  <th>Kuadran</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => {
                  const kInfo = kuadranInfo.find(k => k.key === d.kuadran)
                  return (
                    <tr key={d.siswa_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{d.nama_siswa}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{d.nis}</div>
                      </td>
                      <td>
                        <div class="ap-progress-wrap">
                          <div class="ap-progress-bar" style={{
                            width: `${d.rate_hadir}%`,
                            background: d.rate_hadir >= 75 ? '#15803d' : d.rate_hadir >= 60 ? '#d97706' : '#dc2626',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem' }}>{d.rate_hadir}%</span>
                      </td>
                      <td style={{ color: d.alpha > 5 ? '#dc2626' : 'inherit' }}>
                        {d.alpha}×
                      </td>
                      <td style={{ fontWeight: 700, color: d.avg_nilai >= 75 ? '#15803d' : '#dc2626' }}>
                        {d.avg_nilai}
                      </td>
                      <td>{d.lulus_mapel}/{d.jumlah_mapel}</td>
                      <td>
                        <span class="ap-badge" style={{ background: kInfo?.color }}>
                          {kInfo?.icon} {kInfo?.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── Tab: Ringkasan Siswa ──────────────────────────────────────────────────────

function TabRingkasan({ filter, userType }) {
  const [data,    setData]    = useState([])
  const [meta,    setMeta]    = useState({})
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    if (!filter.tahun_ajaran_id) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        jenis: 'ringkasan_siswa',
        tahun_ajaran_id: filter.tahun_ajaran_id,
        semester: filter.semester,
      })
      if (filter.rombel_id) params.set('rombel_id', filter.rombel_id)
      const res = await apiFetch(`/analitik/prestasi?${params}`)
      setData(res.data?.data ?? [])
      setMeta(res.data?.meta ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const filtered = data.filter(d =>
    !search || d.nama_siswa.toLowerCase().includes(search.toLowerCase()) || d.nis?.includes(search)
  )

  const predikatColor = { A: '#15803d', B: '#0284c7', C: '#d97706', D: '#dc2626', E: '#7f1d1d' }

  return (
    <div class="ap-tab-content">
      {!filter.tahun_ajaran_id ? (
        <div class="ap-empty">Pilih tahun ajaran terlebih dahulu.</div>
      ) : loading ? (
        <div class="ap-loading">Memuat ringkasan…</div>
      ) : (
        <>
          <div class="ap-filter-bar">
            <input placeholder="Cari nama / NIS…" value={search}
              onInput={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200 }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
              {filtered.length} siswa · rata-rata global: <strong>{meta.avg_global}</strong>
            </span>
          </div>

          <div class="ap-card">
            {filtered.length === 0 ? (
              <div class="ap-empty">Tidak ada data nilai.</div>
            ) : (
              <table class="ap-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Siswa</th>
                    <th>Rombel</th>
                    <th>Rata-rata</th>
                    <th>Mapel Lulus</th>
                    <th>Grade A</th>
                    <th>Grade B</th>
                    <th>Grade C</th>
                    <th>Perlu Perhatian</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={d.siswa_id}>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{d.nama_siswa}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{d.nis}</div>
                      </td>
                      <td>{d.label_rombel}</td>
                      <td>
                        <span style={{
                          fontWeight: 700, fontSize: '1rem',
                          color: d.avg_nilai >= 80 ? '#15803d' : d.avg_nilai >= 70 ? '#d97706' : '#dc2626',
                        }}>
                          {d.avg_nilai}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: d.mapel_tidak_lulus > 0 ? '#dc2626' : '#15803d' }}>
                          {d.mapel_lulus}/{d.jumlah_mapel}
                        </span>
                      </td>
                      <td style={{ color: predikatColor.A }}>{d.grade_a}</td>
                      <td style={{ color: predikatColor.B }}>{d.grade_b}</td>
                      <td style={{ color: predikatColor.C }}>{d.grade_c}</td>
                      <td>
                        {d.grade_de > 0 ? (
                          <span class="ap-badge" style={{ background: '#dc2626' }}>
                            {d.grade_de} mapel
                          </span>
                        ) : (
                          <span style={{ color: '#15803d', fontSize: '0.75rem' }}>✅ Aman</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Tab: Ranking Mapel ────────────────────────────────────────────────────────

function TabRankingMapel({ filter }) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  const load = useCallback(async () => {
    if (!filter.tahun_ajaran_id) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        jenis: 'ranking_mapel',
        tahun_ajaran_id: filter.tahun_ajaran_id,
        semester: filter.semester,
      })
      if (filter.rombel_id) params.set('rombel_id', filter.rombel_id)
      const res = await apiFetch(`/analitik/prestasi?${params}`)
      setData(res.data?.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables)
      if (chartRef.current) chartRef.current.destroy()
      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.kode_mapel),
          datasets: [
            {
              label: 'Rata-rata Nilai',
              data: data.map(d => d.avg_nilai),
              backgroundColor: data.map(d => d.avg_nilai >= 75 ? '#15803d99' : '#dc262699'),
              borderColor:     data.map(d => d.avg_nilai >= 75 ? '#15803d' : '#dc2626'),
              borderWidth: 2,
            },
            {
              label: '% Lulus KKM',
              data: data.map(d => d.pct_lulus),
              backgroundColor: '#0284c755',
              borderColor: '#0284c7',
              borderWidth: 2,
              type: 'line',
              yAxisID: 'y1',
              tension: 0.3,
            }
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y:  { title: { display: true, text: 'Nilai (0-100)' }, min: 0, max: 100 },
            y1: { position: 'right', title: { display: true, text: '% Lulus' }, min: 0, max: 100,
                  grid: { drawOnChartArea: false } },
          },
        },
      })
    })
  }, [data])

  const kelompokColor = {
    normatif: '#7c3aed', adaptif: '#0284c7', produktif: '#15803d',
    muatan_lokal: '#d97706', pengembangan_diri: '#64748b',
  }

  return (
    <div class="ap-tab-content">
      {!filter.tahun_ajaran_id ? (
        <div class="ap-empty">Pilih tahun ajaran terlebih dahulu.</div>
      ) : loading ? (
        <div class="ap-loading">Memuat ranking mapel…</div>
      ) : data.length === 0 ? (
        <div class="ap-empty">
          <div class="ap-empty-icon">📚</div>
          Belum ada data nilai mata pelajaran.
        </div>
      ) : (
        <>
          <div class="ap-card">
            <div class="ap-card-header">
              <h3 class="ap-card-title">📊 Rata-rata Nilai per Mata Pelajaran</h3>
            </div>
            <div class="ap-card-body" style={{ height: 320, position: 'relative' }}>
              <canvas ref={canvasRef} />
            </div>
          </div>

          <div class="ap-card">
            <table class="ap-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mata Pelajaran</th>
                  <th>Kelompok</th>
                  <th>KKM</th>
                  <th>Siswa</th>
                  <th>Rata-rata</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>% Lulus</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={d.mapel_id}>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.nama_mapel}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{d.kode_mapel}</div>
                    </td>
                    <td>
                      <span class="ap-badge" style={{ background: kelompokColor[d.kelompok] ?? '#64748b' }}>
                        {d.kelompok}
                      </span>
                    </td>
                    <td>{d.kkm}</td>
                    <td>{d.jumlah_siswa}</td>
                    <td style={{
                      fontWeight: 700,
                      color: d.avg_nilai >= 75 ? '#15803d' : '#dc2626',
                    }}>
                      {d.avg_nilai}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{d.min_nilai ?? '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{d.max_nilai ?? '—'}</td>
                    <td>
                      <div class="ap-progress-wrap">
                        <div class="ap-progress-bar" style={{
                          width: `${d.pct_lulus}%`,
                          background: d.pct_lulus >= 75 ? '#15803d' : '#dc2626',
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>{d.pct_lulus}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── Tab: Siswa Risiko ─────────────────────────────────────────────────────────

function TabRisiko({ filter }) {
  const [data,    setData]    = useState([])
  const [meta,    setMeta]    = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!filter.tahun_ajaran_id) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        jenis: 'risiko',
        tahun_ajaran_id: filter.tahun_ajaran_id,
        semester: filter.semester,
      })
      if (filter.rombel_id) params.set('rombel_id', filter.rombel_id)
      const res = await apiFetch(`/analitik/prestasi?${params}`)
      setData(res.data?.data ?? [])
      setMeta(res.data?.meta ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const levelInfo = {
    kritis: { label: 'Kritis', color: '#7f1d1d', bg: '#fee2e2', icon: '🔴' },
    tinggi: { label: 'Tinggi', color: '#dc2626', bg: '#fef2f2', icon: '🟠' },
    sedang: { label: 'Sedang', color: '#d97706', bg: '#fffbeb', icon: '🟡' },
  }

  return (
    <div class="ap-tab-content">
      {!filter.tahun_ajaran_id ? (
        <div class="ap-empty">Pilih tahun ajaran terlebih dahulu.</div>
      ) : loading ? (
        <div class="ap-loading">Mengidentifikasi siswa risiko…</div>
      ) : (
        <>
          {/* Summary pills */}
          <div class="ap-stats-row">
            <StatCard label="Total Risiko" value={meta.total}   icon="⚠️" color="#dc2626" />
            <StatCard label="Kritis"       value={meta.kritis}  icon="🔴" color="#7f1d1d" />
            <StatCard label="Tinggi"       value={meta.tinggi}  icon="🟠" color="#dc2626" />
            <StatCard label="Sedang"       value={meta.sedang}  icon="🟡" color="#d97706" />
          </div>

          {data.length === 0 ? (
            <div class="ap-card">
              <div class="ap-empty">
                <div class="ap-empty-icon">✅</div>
                Tidak ada siswa berisiko untuk periode ini.
              </div>
            </div>
          ) : (
            <div class="ap-card">
              <table class="ap-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Siswa</th>
                    <th>Rate Hadir</th>
                    <th>Alpha</th>
                    <th>Rata-rata Nilai</th>
                    <th>Mapel Merah</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => {
                    const info = levelInfo[d.level_risiko] ?? levelInfo.sedang
                    return (
                      <tr key={d.siswa_id} style={{ background: info.bg + '44' }}>
                        <td>
                          <span class="ap-badge" style={{ background: info.color }}>
                            {info.icon} {info.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.nama_siswa}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{d.nis}</div>
                        </td>
                        <td>
                          <div class="ap-progress-wrap">
                            <div class="ap-progress-bar" style={{
                              width: `${d.rate_hadir}%`,
                              background: d.rate_hadir < 60 ? '#7f1d1d' : '#dc2626',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                            {d.rate_hadir}%
                          </span>
                        </td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>{d.alpha}×</td>
                        <td style={{ color: d.avg_nilai === null ? '#94a3b8' : d.avg_nilai < 65 ? '#dc2626' : '#d97706' }}>
                          {d.avg_nilai ?? '—'}
                        </td>
                        <td>
                          {d.mapel_merah > 0 ? (
                            <span class="ap-badge" style={{ background: '#dc2626' }}>{d.mapel_merah} mapel</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Modal Input Nilai ─────────────────────────────────────────────────────────

function ModalInputNilai({ onClose, onSaved }) {
  const [mapelList,  setMapelList]  = useState([])
  const [tahunList,  setTahunList]  = useState([])
  const [rombelList, setRombelList] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [err,        setErr]        = useState('')

  const [form, setForm] = useState({
    siswa_nis:       '',
    mapel_id:        '',
    tahun_ajaran_id: '',
    semester:        'ganjil',
    rombel_id:       '',
    nilai_harian:    '',
    nilai_uts:       '',
    nilai_uas:       '',
    catatan:         '',
  })

  useEffect(() => {
    Promise.all([
      apiFetch('/nilai/mapel'),
      apiFetch('/rombel/options'),
      apiFetch('/admin/pengaturan'),
    ]).then(([m, r, p]) => {
      setMapelList(m.data?.mapel ?? [])
      setRombelList(r.data?.rombel ?? [])
      // Extract tahun ajaran dari pengaturan
      const ta = p.data?.tahun_ajaran ?? []
      setTahunList(Array.isArray(ta) ? ta : [ta])
    }).catch(console.error)
  }, [])

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setErr('')
    if (!form.siswa_nis) { setErr('NIS siswa wajib diisi.'); return }
    if (!form.mapel_id)  { setErr('Mata pelajaran wajib dipilih.'); return }
    if (!form.tahun_ajaran_id) { setErr('Tahun ajaran wajib dipilih.'); return }

    setLoading(true)
    try {
      // Cari siswa_id dari NIS
      const cari = await apiFetch(`/users?search=${form.siswa_nis}&user_type=siswa`)
      const siswa = cari.data?.items?.[0]
      if (!siswa?.siswa_id) throw new Error(`Siswa dengan NIS ${form.siswa_nis} tidak ditemukan.`)

      await apiFetch('/nilai', {
        method: 'POST',
        body: JSON.stringify({
          siswa_id:        siswa.siswa_id,
          mapel_id:        parseInt(form.mapel_id),
          tahun_ajaran_id: parseInt(form.tahun_ajaran_id),
          semester:        form.semester,
          rombel_id:       form.rombel_id ? parseInt(form.rombel_id) : undefined,
          nilai_harian:    form.nilai_harian !== '' ? parseFloat(form.nilai_harian) : undefined,
          nilai_uts:       form.nilai_uts    !== '' ? parseFloat(form.nilai_uts)    : undefined,
          nilai_uas:       form.nilai_uas    !== '' ? parseFloat(form.nilai_uas)    : undefined,
          catatan:         form.catatan,
        }),
      })
      onSaved()
      onClose()
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div class="ap-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="ap-modal">
        <div class="ap-modal-header">
          <h3 class="ap-modal-title">📝 Input Nilai Akademik</h3>
          <button class="ap-modal-close" onClick={onClose}>✕</button>
        </div>
        <div class="ap-modal-body">
          {err && (
            <div style={{
              padding: '0.625rem 0.875rem', background: '#fef2f2',
              border: '1px solid #fca5a5', borderRadius: '8px',
              color: '#dc2626', fontSize: '0.8125rem',
            }}>{err}</div>
          )}

          <div class="ap-field">
            <label>NIS Siswa <span class="ap-req">*</span></label>
            <input type="text" placeholder="Masukkan NIS siswa" value={form.siswa_nis}
              onInput={e => setF('siswa_nis', e.target.value)} />
          </div>

          <div class="ap-field-row">
            <div class="ap-field">
              <label>Mata Pelajaran <span class="ap-req">*</span></label>
              <select value={form.mapel_id} onChange={e => setF('mapel_id', e.target.value)}>
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map(m => (
                  <option key={m.mapel_id} value={m.mapel_id}>
                    {m.kode_mapel} — {m.nama_mapel}
                  </option>
                ))}
              </select>
            </div>
            <div class="ap-field">
              <label>Rombel</label>
              <select value={form.rombel_id} onChange={e => setF('rombel_id', e.target.value)}>
                <option value="">-- Pilih Rombel --</option>
                {rombelList.map(r => (
                  <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div class="ap-field-row">
            <div class="ap-field">
              <label>Tahun Ajaran <span class="ap-req">*</span></label>
              <select value={form.tahun_ajaran_id} onChange={e => setF('tahun_ajaran_id', e.target.value)}>
                <option value="">-- Pilih Tahun --</option>
                {tahunList.map(t => (
                  <option key={t.tahun_ajaran_id} value={t.tahun_ajaran_id}>
                    {t.nama_tahun_ajaran}
                  </option>
                ))}
              </select>
            </div>
            <div class="ap-field">
              <label>Semester</label>
              <select value={form.semester} onChange={e => setF('semester', e.target.value)}>
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
                <option value="pendek">Pendek</option>
              </select>
            </div>
          </div>

          <div class="ap-field-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { key: 'nilai_harian', label: 'Nilai Harian (40%)' },
              { key: 'nilai_uts',    label: 'Nilai UTS (30%)' },
              { key: 'nilai_uas',    label: 'Nilai UAS (30%)' },
            ].map(f => (
              <div class="ap-field" key={f.key}>
                <label>{f.label}</label>
                <input type="number" min="0" max="100" placeholder="0–100"
                  value={form[f.key]} onInput={e => setF(f.key, e.target.value)} />
              </div>
            ))}
          </div>

          <div class="ap-field">
            <label>Catatan</label>
            <textarea rows={2} placeholder="Catatan opsional..."
              value={form.catatan} onInput={e => setF('catatan', e.target.value)} />
          </div>
        </div>
        <div class="ap-modal-footer">
          <button class="ap-btn-ghost" onClick={onClose} disabled={loading}>Batal</button>
          <button class="ap-btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Menyimpan…' : '💾 Simpan Nilai'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AnalitikPrestasiPage() {
  const user     = getUser()
  const userType = user?.user_type ?? 'admin'
  const canInput = ['admin', 'guru'].includes(userType)

  const [tab,           setTab]           = useState('korelasi')
  const [showInputNilai, setShowInputNilai] = useState(false)
  const [refreshKey,    setRefreshKey]    = useState(0)

  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [rombelList,      setRombelList]      = useState([])
  const [filter, setFilter] = useState({
    tahun_ajaran_id: '',
    semester:        'ganjil',
    rombel_id:       '',
  })

  useEffect(() => {
    Promise.all([
      apiFetch('/admin/pengaturan'),
      apiFetch('/rombel/options'),
    ]).then(([p, r]) => {
      const ta = p.data?.tahun_ajaran ?? []
      const taList = Array.isArray(ta) ? ta : [ta]
      setTahunAjaranList(taList)
      // Default ke tahun aktif
      const aktif = taList.find(t => t.is_aktif)
      if (aktif) setFilter(f => ({ ...f, tahun_ajaran_id: String(aktif.tahun_ajaran_id) }))
      setRombelList(r.data?.rombel ?? [])
    }).catch(console.error)
  }, [])

  const tabs = [
    { key: 'korelasi',  label: '📈 Korelasi' },
    { key: 'ringkasan', label: '📋 Ringkasan Siswa' },
    { key: 'mapel',     label: '📚 Ranking Mapel' },
    { key: 'risiko',    label: '⚠️ Siswa Risiko' },
  ]

  const filterWithKey = { ...filter, _key: refreshKey }

  return (
    <div class="ap-page">
      {/* Header */}
      <div class="ap-page-header">
        <div>
          <h1 class="ap-page-title">Analitik Prestasi</h1>
          <p class="ap-page-sub">Korelasi kehadiran vs nilai akademik · identifikasi siswa berisiko</p>
        </div>
        {canInput && (
          <button class="ap-btn-primary" onClick={() => setShowInputNilai(true)}>
            + Input Nilai
          </button>
        )}
      </div>

      {/* Filter global */}
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        tahunAjaranList={tahunAjaranList}
        rombelList={rombelList}
        onRefresh={() => setRefreshKey(k => k + 1)}
      />

      {/* Tab bar */}
      <div class="ap-tab-bar">
        {tabs.map(t => (
          <button key={t.key}
            class={`ap-tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'korelasi'  && <TabKorelasi    filter={filterWithKey} />}
      {tab === 'ringkasan' && <TabRingkasan   filter={filterWithKey} userType={userType} />}
      {tab === 'mapel'     && <TabRankingMapel filter={filterWithKey} />}
      {tab === 'risiko'    && <TabRisiko      filter={filterWithKey} />}

      {/* Modal input nilai */}
      {showInputNilai && (
        <ModalInputNilai
          onClose={() => setShowInputNilai(false)}
          onSaved={() => { setShowInputNilai(false); setRefreshKey(k => k + 1) }}
        />
      )}
    </div>
  )
}
