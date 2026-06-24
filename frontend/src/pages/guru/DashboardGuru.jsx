/**
 * DashboardGuru.jsx
 * Main entry page untuk role guru/staff — SMK Rajasa Presensi
 *
 * Halaman yang tersedia:
 *   dashboard → Guru Dashboard (stat + sesi aktif + warning ringkasan)
 *   sesi      → Kelola Sesi Presensi (buat/pause/selesai + live scan log)
 *   rekap     → Rekap Kehadiran per Rombel + tanggal
 *   warning   → Early Warning (daftar siswa alpha tinggi)
 *   logbook   → Logbook PKL (review + approve entri siswa)
 *   izin      → E-Izin (review pengajuan izin/sakit siswa)
 *   akun      → Pengaturan Akun Guru
 *
 * @author development
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import GuruLayout from './GuruLayout'

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

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// ── PageSlot ──────────────────────────────────────────────────────────────────
function PageSlot({ id, active, children }) {
  return (
    <div style={{ display: active === id ? '' : 'none' }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: Dashboard
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
  return (
    <div class="guru-stat-card" style={{ '--accent': color }}>
      <div class="guru-stat-icon">{icon}</div>
      <div>
        <div class="guru-stat-value">{value ?? 0}</div>
        <div class="guru-stat-label">{label}</div>
      </div>
    </div>
  )
}

function PageDashboard({ onNav }) {
  const [stats,    setStats]    = useState(null)
  const [sesi,     setSesi]     = useState(null)
  const [warnings, setWarnings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [dashRes, sesiRes, warnRes] = await Promise.allSettled([
          apiFetch('/dashboard'),
          apiFetch('/presensi/sesi/aktif'),
          apiFetch('/early-warnings?limit=5'),
        ])
        if (!mounted) return
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data ?? dashRes.value)
        if (sesiRes.status === 'fulfilled') setSesi(sesiRes.value.data?.sesi ?? null)
        if (warnRes.status === 'fulfilled') setWarnings(warnRes.value.data?.warnings ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const totals = stats?.totals ?? {}
  const hasSesi = !!sesi

  if (loading) return <div class="guru-loading">Memuat dashboard…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Sesi aktif banner */}
      {hasSesi ? (
        <div class="guru-sesi-aktif">
          <div class="guru-sesi-aktif-info">
            <div class="guru-sesi-dot" />
            <div>
              <div class="guru-sesi-aktif-label">Sesi Presensi Sedang Berjalan</div>
              <div class="guru-sesi-aktif-sub">
                Dimulai {fmtTime(sesi.created_at)} · {sesi.total_scan ?? 0} siswa telah scan
              </div>
            </div>
          </div>
          <div class="guru-sesi-actions">
            <button class="guru-btn-ghost" onClick={() => onNav('sesi')}>Kelola Sesi</button>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--guru-surface)', border: '1px dashed var(--guru-border)',
          borderRadius: 'var(--guru-radius)', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ color: 'var(--guru-text-muted)', fontSize: '0.875rem' }}>
            Tidak ada sesi presensi aktif saat ini.
          </div>
          <button class="guru-btn-primary" onClick={() => onNav('sesi')}>
            ▶ Mulai Sesi Baru
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div class="guru-stats-grid">
        <StatCard label="Hadir Tepat Waktu" value={totals.tepat_waktu} icon="✅" color="#15803d" />
        <StatCard label="Terlambat"         value={totals.terlambat}   icon="⏰" color="#d97706" />
        <StatCard label="Alpha"             value={totals.alpha}       icon="❌" color="#dc2626" />
        <StatCard label="Sakit"             value={totals.sakit}       icon="🏥" color="#0284c7" />
        <StatCard label="Izin"              value={totals.izin}        icon="📋" color="#7c3aed" />
      </div>

      {/* 2-kolom: warning + rekap cepat */}
      <div class="guru-page-grid">
        {/* Early Warning ringkasan */}
        <div class="guru-card">
          <div class="guru-card-header">
            <h3 class="guru-card-title">⚠️ Early Warning</h3>
            <button class="guru-btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => onNav('warning')}>
              Lihat semua →
            </button>
          </div>
          <div class="guru-card-body" style={{ padding: '0.5rem 1.25rem' }}>
            {warnings.length === 0 ? (
              <div class="guru-empty">✅ Tidak ada siswa dengan alpha tinggi</div>
            ) : (
              warnings.slice(0, 5).map(w => (
                <div class="guru-warning-item" key={w.siswa_id}>
                  <div class="guru-warning-icon">
                    {w.severity === 'critical' ? '🔴' : w.severity === 'high' ? '🟠' : '🟡'}
                  </div>
                  <div>
                    <div class={`guru-warning-name guru-severity-${w.severity}`}>
                      {w.nama_lengkap}
                    </div>
                    <div class="guru-warning-meta">
                      {w.alpha_count}× alpha · {w.rombel_label ?? '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logbook pending review */}
        <LogbookPendingWidget onNav={onNav} />
      </div>
    </div>
  )
}

function LogbookPendingWidget({ onNav }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/logbook?status=menunggu_review&per_page=5')
      .then(r => setItems(r.data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div class="guru-card">
      <div class="guru-card-header">
        <h3 class="guru-card-title">📒 Logbook Menunggu Review</h3>
        <button class="guru-btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => onNav('logbook')}>
          Lihat semua →
        </button>
      </div>
      <div class="guru-card-body" style={{ padding: '0 0 0.5rem' }}>
        {loading ? (
          <div class="guru-loading">Memuat…</div>
        ) : items.length === 0 ? (
          <div class="guru-empty">✅ Tidak ada logbook yang perlu direview</div>
        ) : (
          <table class="guru-table">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.logbook_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.nama_siswa}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{item.nis}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(item.tanggal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: Sesi Presensi
// ─────────────────────────────────────────────────────────────────────────────

function PageSesi() {
  const [sesi,    setSesi]    = useState(null)
  const [log,     setLog]     = useState([])
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(false)
  const [err,     setErr]     = useState('')
  const pollRef = useRef(null)

  const loadSesi = useCallback(async () => {
    try {
      const res = await apiFetch('/presensi/sesi/aktif')
      setSesi(res.data?.sesi ?? null)
    } catch { setSesi(null) }
    finally { setLoading(false) }
  }, [])

  const loadLog = useCallback(async () => {
    try {
      const res = await apiFetch('/presensi/audit/latest')
      setLog(res.data?.records ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    loadSesi()
    loadLog()
    // Poll setiap 5 detik
    pollRef.current = setInterval(() => { loadSesi(); loadLog() }, 5000)
    return () => clearInterval(pollRef.current)
  }, [loadSesi, loadLog])

  async function handleMulai() {
    setErr(''); setActing(true)
    try {
      await apiFetch('/presensi/sesi', { method: 'POST', body: JSON.stringify({}) })
      await loadSesi()
      await loadLog()
    } catch (e) { setErr(e.message) }
    finally { setActing(false) }
  }

  async function handleAction(action) {
    if (!sesi) return
    setErr(''); setActing(true)
    try {
      const endpoint = action === 'finish'
        ? `/presensi/sesi/${sesi.sesi_id}/finish`
        : action === 'pause'
          ? `/presensi/sesi/${sesi.sesi_id}/pause`
          : `/presensi/sesi/${sesi.sesi_id}/resume`
      await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({}) })
      await loadSesi()
    } catch (e) { setErr(e.message) }
    finally { setActing(false) }
  }

  const STATUS_COLOR = { aktif: '#15803d', paused: '#d97706', selesai: '#64748b' }
  const STATUS_LABEL = { aktif: 'Berjalan', paused: 'Dijeda', selesai: 'Selesai' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {err && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', borderRadius: '10px',
          color: '#dc2626', fontSize: '0.875rem', border: '1px solid #fecaca' }}>
          {err}
        </div>
      )}

      {/* Panel sesi */}
      <div class="guru-card">
        <div class="guru-card-header">
          <h3 class="guru-card-title">▶ Kontrol Sesi Presensi</h3>
          {sesi && (
            <span class="guru-badge" style={{ background: STATUS_COLOR[sesi.status] }}>
              {STATUS_LABEL[sesi.status]}
            </span>
          )}
        </div>
        <div class="guru-card-body">
          {loading ? (
            <div class="guru-loading">Memuat status sesi…</div>
          ) : sesi ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <dl style={{
                display: 'grid', gridTemplateColumns: '140px 1fr',
                gap: '0.4rem 1rem', fontSize: '0.8125rem', margin: 0,
              }}>
                <dt style={{ color: 'var(--guru-text-muted)', fontWeight: 500 }}>Dimulai</dt>
                <dd style={{ margin: 0 }}>{fmtTime(sesi.created_at)}</dd>
                <dt style={{ color: 'var(--guru-text-muted)', fontWeight: 500 }}>Total Scan</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: 'var(--guru-primary)' }}>
                  {sesi.total_scan ?? 0} siswa
                </dd>
              </dl>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {sesi.status === 'aktif' && (
                  <button class="guru-btn-ghost" onClick={() => handleAction('pause')} disabled={acting}>
                    ⏸ Jeda
                  </button>
                )}
                {sesi.status === 'paused' && (
                  <button class="guru-btn-primary" onClick={() => handleAction('resume')} disabled={acting}>
                    ▶ Lanjutkan
                  </button>
                )}
                {['aktif', 'paused'].includes(sesi.status) && (
                  <button onClick={() => handleAction('finish')} disabled={acting} style={{
                    padding: '0.5rem 1rem', background: '#dc2626', color: '#fff',
                    border: 'none', borderRadius: '8px', fontFamily: 'var(--guru-font)',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    ⏹ Selesaikan Sesi
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: 'var(--guru-text-muted)', fontSize: '0.875rem' }}>
                Tidak ada sesi aktif. Mulai sesi untuk membuka QR scan siswa.
              </p>
              <button class="guru-btn-primary" onClick={handleMulai} disabled={acting}>
                {acting ? 'Memulai…' : '▶ Mulai Sesi Baru'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live scan log */}
      <div class="guru-card">
        <div class="guru-card-header">
          <h3 class="guru-card-title">📡 Log Scan Terbaru</h3>
          <button class="guru-btn-ghost" onClick={loadLog} style={{ fontSize: '0.75rem' }}>
            ↺ Refresh
          </button>
        </div>
        {log.length === 0 ? (
          <div class="guru-table-empty">Belum ada scan dalam sesi ini.</div>
        ) : (
          <table class="guru-table">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Rombel</th>
                <th>Status</th>
                <th>Waktu Scan</th>
              </tr>
            </thead>
            <tbody>
              {log.slice(0, 20).map((r, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.siswa?.nama_lengkap ?? '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>
                      {r.siswa?.nis ?? ''}
                    </div>
                  </td>
                  <td>{r.rombel?.label_rombel ?? '—'}</td>
                  <td>
                    <span class="guru-badge" style={{
                      background: {
                        hadir: '#15803d', terlambat: '#d97706', alpha: '#dc2626',
                      }[r.status] ?? '#64748b',
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {r.scan_at ? new Date(r.scan_at).toLocaleTimeString('id-ID') : '—'}
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3: Rekap Kehadiran
// ─────────────────────────────────────────────────────────────────────────────

function PageRekap() {
  const today = new Date().toISOString().slice(0, 10)
  const [tanggal,  setTanggal]  = useState(today)
  const [rombelId, setRombelId] = useState('')
  const [status,   setStatus]   = useState('')
  const [rombels,  setRombels]  = useState([])
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [summary,  setSummary]  = useState({})

  useEffect(() => {
    apiFetch('/rombel/options')
      .then(r => setRombels(r.data?.rombel ?? []))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tanggal, per_page: '100' })
      if (rombelId) params.set('rombel_id', rombelId)
      if (status)   params.set('status', status)
      const res = await apiFetch(`/presensi/jam-siswa?${params}`)
      setRows(res.data?.siswa ?? [])
      setSummary(res.data?.summary ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tanggal, rombelId, status])

  useEffect(() => { load() }, [load])

  const STATUS_CLR = { hadir: '#15803d', terlambat: '#d97706', alpha: '#dc2626', sakit: '#0284c7', izin: '#7c3aed' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Filter */}
      <div class="guru-card">
        <div class="guru-card-body" style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.875rem 1.25rem',
        }}>
          <input type="date" value={tanggal} max={today}
            onInput={e => setTanggal(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--guru-border)',
              borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem',
              color: 'var(--guru-text)', background: 'var(--guru-bg)' }}
          />
          <select value={rombelId} onChange={e => setRombelId(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--guru-border)',
              borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem',
              color: 'var(--guru-text)', background: 'var(--guru-bg)' }}>
            <option value="">Semua Rombel</option>
            {rombels.map(r => <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--guru-border)',
              borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem',
              color: 'var(--guru-text)', background: 'var(--guru-bg)' }}>
            <option value="">Semua Status</option>
            {['hadir','terlambat','alpha','sakit','izin'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button class="guru-btn-ghost" onClick={load}>↺ Refresh</button>
        </div>
      </div>

      {/* Summary pills */}
      {Object.keys(summary).length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(summary).map(([k, v]) => (
            <span key={k} style={{
              padding: '0.3rem 0.75rem', borderRadius: '999px',
              background: STATUS_CLR[k] ?? '#64748b', color: '#fff',
              fontSize: '0.75rem', fontWeight: 600,
            }}>
              {k.charAt(0).toUpperCase() + k.slice(1)}: {v}
            </span>
          ))}
        </div>
      )}

      {/* Tabel */}
      <div class="guru-card">
        {loading ? (
          <div class="guru-loading">Memuat rekap…</div>
        ) : rows.length === 0 ? (
          <div class="guru-table-empty">Tidak ada data presensi untuk filter ini.</div>
        ) : (
          <table class="guru-table">
            <thead>
              <tr>
                <th>Nama Siswa</th>
                <th>NIS</th>
                <th>Rombel</th>
                <th>Status</th>
                <th>Jam Scan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r.siswa?.nama_lengkap ?? '—'}</td>
                  <td style={{ color: 'var(--guru-text-muted)', fontSize: '0.75rem' }}>
                    {r.siswa?.nis ?? '—'}
                  </td>
                  <td>{r.rombel?.label_rombel ?? '—'}</td>
                  <td>
                    <span class="guru-badge" style={{ background: STATUS_CLR[r.status] ?? '#64748b' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {r.scan_at ? new Date(r.scan_at).toLocaleTimeString('id-ID') : '—'}
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4: Early Warning
// ─────────────────────────────────────────────────────────────────────────────

function PageWarning() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('14')
  const [minAlpha, setMinAlpha] = useState('3')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/early-warnings?periode=${periode}&min_alpha=${minAlpha}`)
      setItems(res.data?.warnings ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [periode, minAlpha])

  useEffect(() => { load() }, [load])

  const SEV_CLR = { critical: '#dc2626', high: '#ea580c', medium: '#d97706' }
  const SEV_ICN = { critical: '🔴', high: '🟠', medium: '🟡' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Filter */}
      <div class="guru-card">
        <div class="guru-card-body" style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.875rem 1.25rem',
        }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--guru-text-muted)' }}>Periode:</label>
          {['7','14','30'].map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              class={periode === p ? 'guru-btn-primary' : 'guru-btn-ghost'}
              style={{ padding: '0.35rem 0.875rem' }}>
              {p} hari
            </button>
          ))}
          <label style={{ fontSize: '0.8125rem', color: 'var(--guru-text-muted)', marginLeft: '0.5rem' }}>
            Min Alpha:
          </label>
          {['2','3','5'].map(m => (
            <button key={m} onClick={() => setMinAlpha(m)}
              class={minAlpha === m ? 'guru-btn-primary' : 'guru-btn-ghost'}
              style={{ padding: '0.35rem 0.875rem' }}>
              ≥{m}×
            </button>
          ))}
          <button class="guru-btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>↺ Refresh</button>
        </div>
      </div>

      <div class="guru-card">
        {loading ? (
          <div class="guru-loading">Memuat data early warning…</div>
        ) : items.length === 0 ? (
          <div class="guru-table-empty">✅ Tidak ada siswa dengan alpha tinggi dalam periode ini.</div>
        ) : (
          <table class="guru-table">
            <thead>
              <tr>
                <th>Tingkat</th>
                <th>Nama Siswa</th>
                <th>Rombel</th>
                <th>Alpha</th>
                <th>Rate Hadir</th>
              </tr>
            </thead>
            <tbody>
              {items.map(w => (
                <tr key={w.siswa_id}>
                  <td style={{ textAlign: 'center', fontSize: '1.125rem' }}>
                    {SEV_ICN[w.severity] ?? '⚪'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{w.nama_lengkap}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{w.nis}</div>
                  </td>
                  <td>{w.rombel_label ?? '—'}</td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: '0.875rem',
                      color: SEV_CLR[w.severity] ?? '#64748b',
                    }}>
                      {w.alpha_count}×
                    </span>
                  </td>
                  <td>
                    <div style={{
                      height: 6, background: 'var(--guru-border)', borderRadius: 999,
                      width: 80, overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        width: `${w.rate_hadir ?? 0}%`,
                        background: (w.rate_hadir ?? 0) < 50 ? '#dc2626' : (w.rate_hadir ?? 0) < 75 ? '#d97706' : '#15803d',
                      }} />
                    </div>
                    <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--guru-text-muted)' }}>
                      {w.rate_hadir ?? 0}%
                    </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5: Logbook PKL (guru review)
// ─────────────────────────────────────────────────────────────────────────────

function PageLogbook() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('menunggu_review')
  const [detail,  setDetail]  = useState(null)
  const [catatan, setCatatan] = useState('')
  const [acting,  setActing]  = useState(false)
  const [err,     setErr]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '50' })
      if (filter) params.set('status', filter)
      const res = await apiFetch(`/logbook?${params}`)
      setItems(res.data?.items ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleReview(action) {
    if (!detail) return
    if (action === 'reject' && !catatan.trim()) {
      setErr('Catatan wajib diisi saat mengembalikan logbook.'); return
    }
    setErr(''); setActing(true)
    try {
      await apiFetch(`/logbook/${detail.logbook_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, catatan_guru: catatan }),
      })
      setDetail(null); setCatatan(''); await load()
    } catch (e) { setErr(e.message) }
    finally { setActing(false) }
  }

  const STATUS_CLR = {
    draft: '#64748b', menunggu_review: '#d97706', disetujui: '#15803d', ditolak: '#dc2626',
  }
  const STATUS_LBL = {
    draft: 'Draft', menunggu_review: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Dikembalikan',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['menunggu_review', 'disetujui', 'ditolak', ''].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            class={filter === s ? 'guru-btn-primary' : 'guru-btn-ghost'}>
            {s === '' ? 'Semua' : STATUS_LBL[s]}
          </button>
        ))}
        <button class="guru-btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>↺ Refresh</button>
      </div>

      <div class="guru-card">
        {loading ? (
          <div class="guru-loading">Memuat logbook…</div>
        ) : items.length === 0 ? (
          <div class="guru-table-empty">
            {filter === 'menunggu_review' ? '✅ Tidak ada logbook yang menunggu review.' : 'Tidak ada data.'}
          </div>
        ) : (
          <table class="guru-table">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Tanggal</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.logbook_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.nama_siswa}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{item.nis}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(item.tanggal)}</td>
                  <td>{item.lokasi || <span style={{ color: 'var(--guru-text-muted)' }}>—</span>}</td>
                  <td>
                    <span class="guru-badge" style={{ background: STATUS_CLR[item.status] }}>
                      {STATUS_LBL[item.status]}
                    </span>
                  </td>
                  <td>
                    <button class="guru-btn-ghost" style={{ fontSize: '0.75rem' }}
                      onClick={() => { setDetail(item); setCatatan(''); setErr('') }}>
                      Lihat {item.status === 'menunggu_review' ? '⚡' : ''}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }} onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={{
            background: 'var(--guru-surface)', borderRadius: 'var(--guru-radius)',
            boxShadow: 'var(--guru-shadow-md)', width: '100%', maxWidth: 540,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--guru-border)',
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                📋 Logbook — {detail.nama_siswa}
              </h3>
              <button onClick={() => setDetail(null)} style={{
                background: 'none', border: 'none', fontSize: '1.25rem',
                cursor: 'pointer', color: 'var(--guru-text-muted)',
              }}>✕</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <dl style={{
                display: 'grid', gridTemplateColumns: '120px 1fr',
                gap: '0.4rem 1rem', fontSize: '0.8125rem', margin: 0,
              }}>
                <dt style={{ color: 'var(--guru-text-muted)' }}>Tanggal</dt>
                <dd style={{ margin: 0 }}>{fmtDate(detail.tanggal)}</dd>
                <dt style={{ color: 'var(--guru-text-muted)' }}>Waktu</dt>
                <dd style={{ margin: 0 }}>
                  {detail.jam_mulai && detail.jam_selesai
                    ? `${detail.jam_mulai} – ${detail.jam_selesai}`
                    : detail.jam_mulai || '—'}
                </dd>
                <dt style={{ color: 'var(--guru-text-muted)' }}>Lokasi</dt>
                <dd style={{ margin: 0 }}>{detail.lokasi || '—'}</dd>
                <dt style={{ color: 'var(--guru-text-muted)' }}>Status</dt>
                <dd style={{ margin: 0 }}>
                  <span class="guru-badge" style={{ background: STATUS_CLR[detail.status] }}>
                    {STATUS_LBL[detail.status]}
                  </span>
                </dd>
              </dl>

              <div>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Deskripsi Kegiatan
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7,
                  background: 'var(--guru-bg)', padding: '0.75rem', borderRadius: '8px',
                  whiteSpace: 'pre-wrap' }}>
                  {detail.deskripsi}
                </p>
              </div>

              {detail.catatan_guru && (
                <div>
                  <p style={{ margin: '0 0 0.4rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                    Catatan Sebelumnya
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--guru-text-muted)' }}>
                    {detail.catatan_guru}
                  </p>
                </div>
              )}

              {detail.status === 'menunggu_review' && (
                <div style={{
                  background: '#fffbeb', border: '1px solid #fcd34d',
                  borderRadius: '10px', padding: '1rem',
                }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#92400e' }}>
                    Review Logbook
                  </p>
                  <textarea
                    rows={3} placeholder="Catatan / saran (wajib diisi jika dikembalikan)..."
                    value={catatan} onInput={e => setCatatan(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px',
                      border: '1px solid #fcd34d', fontFamily: 'var(--guru-font)',
                      fontSize: '0.8125rem', resize: 'vertical', background: 'var(--guru-bg)',
                      color: 'var(--guru-text)', boxSizing: 'border-box' }}
                  />
                  {err && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{err}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleReview('approve')} disabled={acting}
                      style={{ flex: 1, padding: '0.5rem', background: '#15803d', color: '#fff',
                        border: 'none', borderRadius: '8px', fontFamily: 'var(--guru-font)',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                      {acting ? '…' : '✅ Setujui'}
                    </button>
                    <button onClick={() => handleReview('reject')} disabled={acting}
                      style={{ flex: 1, padding: '0.5rem', background: '#dc2626', color: '#fff',
                        border: 'none', borderRadius: '8px', fontFamily: 'var(--guru-font)',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                      {acting ? '…' : '↩ Kembalikan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid var(--guru-border)',
              display: 'flex', justifyContent: 'flex-end',
            }}>
              <button class="guru-btn-ghost" onClick={() => setDetail(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6: E-Izin
// ─────────────────────────────────────────────────────────────────────────────

function PageIzin() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('menunggu')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '50' })
      if (filter) params.set('status', filter)
      const res = await apiFetch(`/e-izin?${params}`)
      setItems(res.data?.items ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleApprove(id, action) {
    if (!confirm(`${action === 'approve' ? 'Setujui' : 'Tolak'} izin ini?`)) return
    try {
      await apiFetch(`/e-izin/${id}/approve`, {
        method: 'PATCH', body: JSON.stringify({ action }),
      })
      await load()
    } catch (e) { alert(e.message) }
  }

  const TYPE_LBL = { sakit: '🏥 Sakit', izin: '📋 Izin', alpha: '❌ Alpha' }
  const STATUS_CLR = { menunggu: '#d97706', disetujui: '#15803d', ditolak: '#dc2626' }
  const STATUS_LBL = { menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['menunggu', 'disetujui', 'ditolak', ''].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            class={filter === s ? 'guru-btn-primary' : 'guru-btn-ghost'}>
            {s === '' ? 'Semua' : STATUS_LBL[s] ?? s}
          </button>
        ))}
        <button class="guru-btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>↺ Refresh</button>
      </div>

      <div class="guru-card">
        {loading ? (
          <div class="guru-loading">Memuat data izin…</div>
        ) : items.length === 0 ? (
          <div class="guru-table-empty">
            {filter === 'menunggu' ? '✅ Tidak ada pengajuan izin yang menunggu.' : 'Tidak ada data.'}
          </div>
        ) : (
          <table class="guru-table">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Jenis</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Status</th>
                {filter === 'menunggu' && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.izin_id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.nama_siswa ?? '—'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{item.nis}</div>
                  </td>
                  <td>{TYPE_LBL[item.jenis_izin] ?? item.jenis_izin}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {fmtDate(item.tanggal_mulai)}
                    {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai
                      ? ` – ${fmtDate(item.tanggal_selesai)}` : ''}
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {item.keterangan || '—'}
                  </td>
                  <td>
                    <span class="guru-badge" style={{ background: STATUS_CLR[item.status] ?? '#64748b' }}>
                      {STATUS_LBL[item.status] ?? item.status}
                    </span>
                  </td>
                  {filter === 'menunggu' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => handleApprove(item.izin_id, 'approve')}
                          style={{ padding: '0.25rem 0.625rem', background: '#15803d', color: '#fff',
                            border: 'none', borderRadius: '6px', fontSize: '0.75rem',
                            cursor: 'pointer', fontFamily: 'var(--guru-font)' }}>
                          ✅
                        </button>
                        <button onClick={() => handleApprove(item.izin_id, 'reject')}
                          style={{ padding: '0.25rem 0.625rem', background: '#dc2626', color: '#fff',
                            border: 'none', borderRadius: '6px', fontSize: '0.75rem',
                            cursor: 'pointer', fontFamily: 'var(--guru-font)' }}>
                          ✕
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 7: Pengaturan Akun
// ─────────────────────────────────────────────────────────────────────────────

function PageAkun({ user }) {
  const [form, setForm] = useState({
    password_baru: '',
    konfirmasi:    '',
  })
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState('')
  const [err,     setErr]     = useState('')

  async function handleSave() {
    setMsg(''); setErr('')
    if (!form.password_baru) { setErr('Password baru wajib diisi.'); return }
    if (form.password_baru.length < 6) { setErr('Password minimal 6 karakter.'); return }
    if (form.password_baru !== form.konfirmasi) { setErr('Konfirmasi password tidak cocok.'); return }
    setLoading(true)
    try {
      await apiFetch(`/users/${user?.user_id}/reset-password`, {
        method: 'POST', body: JSON.stringify({ new_password: form.password_baru }),
      })
      setMsg('Password berhasil diperbarui.')
      setForm({ password_baru: '', konfirmasi: '' })
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div class="guru-card">
        <div class="guru-card-header">
          <h3 class="guru-card-title">⚙️ Pengaturan Akun</h3>
        </div>
        <div class="guru-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Info akun */}
          <dl style={{
            display: 'grid', gridTemplateColumns: '120px 1fr',
            gap: '0.4rem 1rem', fontSize: '0.8125rem', margin: 0,
            padding: '0.875rem', background: 'var(--guru-bg)',
            borderRadius: '8px', border: '1px solid var(--guru-border)',
          }}>
            <dt style={{ color: 'var(--guru-text-muted)' }}>Nama</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{user?.nama_lengkap || '—'}</dd>
            <dt style={{ color: 'var(--guru-text-muted)' }}>Username</dt>
            <dd style={{ margin: 0 }}>{user?.username || '—'}</dd>
            <dt style={{ color: 'var(--guru-text-muted)' }}>Email</dt>
            <dd style={{ margin: 0 }}>{user?.email || '—'}</dd>
            <dt style={{ color: 'var(--guru-text-muted)' }}>Role</dt>
            <dd style={{ margin: 0 }}>{user?.user_type || 'guru'}</dd>
          </dl>

          <hr style={{ border: 'none', borderTop: '1px solid var(--guru-border)', margin: 0 }} />
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Ganti Password</p>

          {msg && (
            <div style={{ padding: '0.625rem 0.875rem', background: '#f0fdf4',
              border: '1px solid #86efac', borderRadius: '8px',
              color: '#15803d', fontSize: '0.8125rem' }}>
              ✅ {msg}
            </div>
          )}
          {err && (
            <div style={{ padding: '0.625rem 0.875rem', background: '#fef2f2',
              border: '1px solid #fca5a5', borderRadius: '8px',
              color: '#dc2626', fontSize: '0.8125rem' }}>
              {err}
            </div>
          )}

          {[
            { key: 'password_baru', label: 'Password Baru', placeholder: 'Minimal 6 karakter' },
            { key: 'konfirmasi',    label: 'Konfirmasi',    placeholder: 'Ulangi password baru' },
          ].map(f => (
            <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--guru-text)' }}>
                {f.label}
              </label>
              <input type="password" placeholder={f.placeholder}
                value={form[f.key]}
                onInput={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ padding: '0.55rem 0.75rem', border: '1px solid var(--guru-border)',
                  borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.875rem',
                  color: 'var(--guru-text)', background: 'var(--guru-bg)' }}
              />
            </div>
          ))}

          <button class="guru-btn-primary" onClick={handleSave} disabled={loading}
            style={{ alignSelf: 'flex-start' }}>
            {loading ? 'Menyimpan…' : '💾 Simpan Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardGuru({ user, onLogout }) {
  return (
    <GuruLayout
      user={user}
      onLogout={onLogout}
      renderPage={(activePage, setActivePage) => (
        <>
          <PageSlot id="dashboard" active={activePage}>
            <PageDashboard onNav={setActivePage} />
          </PageSlot>
          <PageSlot id="sesi" active={activePage}>
            <PageSesi />
          </PageSlot>
          <PageSlot id="rekap" active={activePage}>
            <PageRekap />
          </PageSlot>
          <PageSlot id="warning" active={activePage}>
            <PageWarning />
          </PageSlot>
          <PageSlot id="logbook" active={activePage}>
            <PageLogbook />
          </PageSlot>
          <PageSlot id="izin" active={activePage}>
            <PageIzin />
          </PageSlot>
          <PageSlot id="akun" active={activePage}>
            <PageAkun user={user} />
          </PageSlot>
        </>
      )}
    />
  )
}
