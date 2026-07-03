/**
 * DashboardGuru.jsx — lengkap dengan Communication Hub
 * 8 halaman: dashboard, sesi, rekap, warning, logbook, izin, communication, akun
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import GuruLayout from './GuruLayout'
import CommunicationHub from '../admin/CommunicationHub'
import GamifikasiPage from '../admin/GamifikasiPage'
import { T } from '../../utils/lang.js'

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

function PageSlot({ id, active, children }) {
  return <div style={{ display: active === id ? '' : 'none' }}>{children}</div>
}

// ── PAGE 1: Dashboard ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, containerStyle = {} }) {
  return (
    <div class="guru-stat-card" style={{ '--accent': color, minWidth: 0, overflow: 'hidden', width: '100%', ...containerStyle }}>
      <div class="guru-stat-icon" style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div class="guru-stat-value">{value ?? 0}</div>
        <div class="guru-stat-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  )
}

function PageDashboard({ onNav, t }) {
  const [stats, setStats] = useState(null)
  const [sesi, setSesi] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.allSettled([
      apiFetch('/presensi/jam-siswa?per_page=1'),
      apiFetch('/presensi/sesi/aktif'),
      apiFetch('/early-warnings?limit=5'),
    ]).then(([d, s, w]) => {
      if (!mounted) return
      if (d.status === 'fulfilled') {
        const sm = d.value.data?.summary ?? {}
        setStats({ totals: {
          tepat_waktu: sm.hadir ?? 0,
          terlambat:   sm.terlambat ?? 0,
          alpha:       sm.alpha ?? 0,
          sakit:       sm.sakit ?? 0,
          izin:        sm.izin ?? 0,
        }})
      }
      if (s.status === 'fulfilled') setSesi(s.value.data?.sesi ?? null)
      if (w.status === 'fulfilled') setWarnings(w.value.data?.warnings ?? [])
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const totals = stats?.totals ?? {}

  if (loading) return <div class="guru-loading">{t.gu_memuat_dashboard}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {sesi ? (
        <div class="guru-sesi-aktif">
          <div class="guru-sesi-aktif-info">
            <div class="guru-sesi-dot" />
            <div>
              <div class="guru-sesi-aktif-label">{t.gu_sesi_berjalan}</div>
              <div class="guru-sesi-aktif-sub">{t.gu_dimulai} {fmtTime(sesi.created_at)} · {sesi.total_scan ?? 0} {t.gu_siswa_scan}</div>
            </div>
          </div>
          <button class="guru-btn-ghost" onClick={() => onNav('sesi')}>{t.gu_kelola_sesi}</button>
        </div>
      ) : (
        <div style={{ background: 'var(--guru-surface)', border: '1px dashed var(--guru-border)',
          borderRadius: 'var(--guru-radius)', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--guru-text-muted)', fontSize: '0.875rem' }}>{t.gu_tidak_ada_sesi}</span>
          <button class="guru-btn-primary" onClick={() => onNav('sesi')}>{t.gu_mulai_sesi_baru}</button>
        </div>
      )}

      <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', width:'100%' }}>
        {[
          { label: t.sc_tepat_waktu, value: totals.tepat_waktu, icon:'✅', color:'#15803d' },
          { label: t.sc_terlambat,   value: totals.terlambat,   icon:'⏰', color:'#d97706' },
          { label: t.sc_alpha,       value: totals.alpha,        icon:'❌', color:'#dc2626' },
          { label: t.sc_sakit,       value: totals.sakit,        icon:'🏥', color:'#0284c7' },
          { label: t.sc_izin,        value: totals.izin,         icon:'📋', color:'#7c3aed' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ flex:'1 1 0', minWidth:0, width:'20%' }}>
            <StatCard label={label} value={value} icon={icon} color={color} />
          </div>
        ))}
      </div>

      <div class="guru-page-grid">
        <div class="guru-card">
          <div class="guru-card-header">
            <h3 class="guru-card-title">{t.gu_early_warning_judul}</h3>
            <button class="guru-btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => onNav('warning')}>
              {t.gu_lihat_semua}
            </button>
          </div>
          <div class="guru-card-body" style={{ padding: '0.5rem 1.25rem' }}>
            {warnings.length === 0 ? (
              <div class="guru-empty">{t.gu_tidak_ada_alpha}</div>
            ) : warnings.slice(0, 5).map(w => (
              <div class="guru-warning-item" key={w.siswa_id}>
                <div class="guru-warning-icon">{w.severity === 'critical' ? '🔴' : w.severity === 'high' ? '🟠' : '🟡'}</div>
                <div>
                  <div class={`guru-warning-name guru-severity-${w.severity}`}>{w.nama_lengkap}</div>
                  <div class="guru-warning-meta">{w.alpha_count}{t.gu_alpha_suffix} · {w.rombel_label ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div class="guru-card">
          <div class="guru-card-header">
            <h3 class="guru-card-title">{t.gu_logbook_pending_judul}</h3>
            <button class="guru-btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => onNav('logbook')}>
              {t.gu_lihat_semua}
            </button>
          </div>
          <LogbookPending t={t} />
        </div>
      </div>
    </div>
  )
}

function LogbookPending({ t }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    apiFetch('/logbook?status=menunggu_review&per_page=5')
      .then(r => setItems(r.data?.items ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [])
  return (
    <div class="guru-card-body" style={{ padding: '0 0 0.5rem' }}>
      {loading ? <div class="guru-loading">{t.gu_memuat}</div>
        : items.length === 0 ? <div class="guru-empty">{t.gu_tidak_ada_logbook_pend}</div>
        : <table class="guru-table">
            <thead><tr><th>{t.gm_col_siswa}</th><th>{t.lb_tanggal_label}</th></tr></thead>
            <tbody>{items.map(i => (
              <tr key={i.logbook_id}>
                <td><div style={{ fontWeight: 600 }}>{i.nama_siswa}</div><div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{i.nis}</div></td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(i.tanggal)}</td>
              </tr>
            ))}</tbody>
          </table>}
    </div>
  )
}

// ── PAGE 2: Sesi Presensi ─────────────────────────────────────────────────────

function PageSesi({ t }) {
  const [sesi, setSesi] = useState(null)
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [err, setErr] = useState('')
  const pollRef = useRef(null)

  const [showForm, setShowForm] = useState(false)
  const [rombels, setRombels] = useState([])
  const [jams, setJams] = useState([])
  const [formMode, setFormMode] = useState('rombel')
  const [formRombel, setFormRombel] = useState('')
  const [formJams, setFormJams] = useState([])

  useEffect(() => {
    apiFetch('/rombel/options').then(r => setRombels(r.data?.rombel ?? [])).catch(() => {})
    apiFetch('/jam-pembelajaran/options').then(r => setJams(r.data?.jams ?? [])).catch(() => {})
  }, [])

  const loadSesi = useCallback(async () => {
    try { const r = await apiFetch('/presensi/sesi/aktif'); setSesi(r.data?.sesi ?? null) }
    catch { setSesi(null) } finally { setLoading(false) }
  }, [])
  const loadLog = useCallback(async () => {
    try { const r = await apiFetch('/presensi/audit/latest'); setLog(r.data?.records ?? []) } catch {}
  }, [])

  useEffect(() => {
    loadSesi(); loadLog()
    pollRef.current = setInterval(() => { loadSesi(); loadLog() }, 5000)
    return () => clearInterval(pollRef.current)
  }, [loadSesi, loadLog])

  async function act(endpoint, body = {}) {
    setErr(''); setActing(true)
    try { await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }); await loadSesi() }
    catch (e) { setErr(e.message) } finally { setActing(false) }
  }

  async function buatSesi() {
    if (formJams.length === 0) { setErr(t.gu_pilih_jam_error); return }
    if (formMode === 'rombel' && !formRombel) { setErr(t.gu_pilih_rombel_error); return }
    const body = {
      mode_presensi: formMode,
      jam_ids: formJams.map(Number),
      ...(formMode === 'rombel' ? { rombel_id: Number(formRombel) } : {}),
    }
    setShowForm(false)
    await act('/presensi/sesi', body)
  }

  function toggleJam(jamId) {
    const id = Number(jamId)
    setFormJams(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id].sort((a,b)=>a-b))
  }

  const SC = { aktif: '#15803d', paused: '#d97706', selesai: '#64748b' }
  const SL = { aktif: t.gu_status_aktif, paused: t.gu_status_paused, selesai: t.gu_status_selesai }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {err && <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', borderRadius: '10px', color: '#dc2626', fontSize: '0.875rem' }}>{err}</div>}
      <div class="guru-card">
        <div class="guru-card-header">
          <h3 class="guru-card-title">{t.gu_kontrol_sesi}</h3>
          {sesi && <span class="guru-badge" style={{ background: SC[sesi.status] }}>{SL[sesi.status]}</span>}
        </div>
        <div class="guru-card-body">
          {loading ? <div class="guru-loading">{t.gu_memuat}</div>
          : sesi ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.4rem 1rem', fontSize: '0.8125rem', margin: 0 }}>
                <dt style={{ color: 'var(--guru-text-muted)' }}>{t.gu_dimulai}</dt><dd style={{ margin: 0 }}>{fmtTime(sesi.created_at)}</dd>
                <dt style={{ color: 'var(--guru-text-muted)' }}>{t.gu_total_scan}</dt><dd style={{ margin: 0, fontWeight: 700, color: 'var(--guru-primary)' }}>{sesi.total_scan ?? 0} {t.gu_siswa_scan}</dd>
              </dl>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {sesi.status === 'aktif' && <button class="guru-btn-ghost" onClick={() => act(`/presensi/sesi/${sesi.sesi_id}/pause`)} disabled={acting}>{t.gu_jeda}</button>}
                {sesi.status === 'paused' && <button class="guru-btn-primary" onClick={() => act(`/presensi/sesi/${sesi.sesi_id}/resume`)} disabled={acting}>{t.gu_lanjutkan}</button>}
                {['aktif','paused'].includes(sesi.status) && (
                  <button onClick={() => act(`/presensi/sesi/${sesi.sesi_id}/finish`)} disabled={acting}
                    style={{ padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                    {t.gu_selesaikan}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, color: 'var(--guru-text-muted)', fontSize: '0.875rem' }}>{t.gu_tidak_ada_sesi}</p>
              <button class="guru-btn-primary" onClick={() => { setErr(''); setShowForm(true) }} disabled={acting}>{t.gu_mulai_sesi_baru}</button>
              {showForm && (
                <div style={{ padding: '1rem', background: 'var(--guru-surface)', borderRadius: '10px', border: '1px solid var(--guru-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--guru-text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.gu_mode_presensi}</label>
                    <select value={formMode} onChange={e => setFormMode(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid var(--guru-border)', borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.875rem', background: 'var(--guru-bg)', color: 'var(--guru-text)' }}>
                      <option value="rombel">{t.gu_mode_rombel}</option>
                      <option value="piket">{t.gu_mode_piket}</option>
                    </select>
                  </div>
                  {formMode === 'rombel' && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--guru-text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.gm_col_rombel}</label>
                      <select value={formRombel} onChange={e => setFormRombel(e.target.value)} style={{ width: '100%', padding: '0.45rem 0.75rem', border: '1px solid var(--guru-border)', borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.875rem', background: 'var(--guru-bg)', color: 'var(--guru-text)' }}>
                        <option value="">{t.gu_pilih_rombel}</option>
                        {rombels.map(r => <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--guru-text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t.gu_jam_label}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {jams.length > 0 ? jams.map(j => (
                        <label key={j.jam_id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.8125rem', padding: '0.3rem 0.6rem', border: `1px solid ${formJams.includes(j.jam_id) ? 'var(--guru-primary)' : 'var(--guru-border)'}`, borderRadius: '6px', background: formJams.includes(j.jam_id) ? 'var(--guru-primary-light, #eff6ff)' : 'transparent' }}>
                          <input type="checkbox" checked={formJams.includes(j.jam_id)} onChange={() => toggleJam(j.jam_id)} style={{ margin: 0 }} />
                          {j.label ?? `${t.gu_jam_prefix} ${j.jam_ke}`}
                        </label>
                      )) : [1,2,3,4,5,6,7,8].map(n => (
                        <label key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.8125rem', padding: '0.3rem 0.6rem', border: `1px solid ${formJams.includes(n) ? 'var(--guru-primary)' : 'var(--guru-border)'}`, borderRadius: '6px', background: formJams.includes(n) ? 'var(--guru-primary-light, #eff6ff)' : 'transparent' }}>
                          <input type="checkbox" checked={formJams.includes(n)} onChange={() => toggleJam(n)} style={{ margin: 0 }} />
                          {t.gu_jam_prefix} {n}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button class="guru-btn-primary" onClick={buatSesi} disabled={acting}>{acting ? t.gu_memulai : t.gu_mulai_sesi_btn}</button>
                    <button class="guru-btn-ghost" onClick={() => setShowForm(false)} disabled={acting}>{t.gu_batal}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div class="guru-card">
        <div class="guru-card-header">
          <h3 class="guru-card-title">{t.gu_log_scan_judul}</h3>
          <button class="guru-btn-ghost" onClick={loadLog} style={{ fontSize: '0.75rem' }}>{t.ch_refresh}</button>
        </div>
        {log.length === 0 ? <div class="guru-table-empty">{t.gu_belum_ada_scan}</div> : (
          <table class="guru-table">
            <thead><tr><th>{t.gm_col_siswa}</th><th>{t.gm_col_rombel}</th><th>{t.ei_col_status}</th><th>{t.gu_col_jam_scan}</th></tr></thead>
            <tbody>{log.slice(0,20).map((r,i) => (
              <tr key={i}>
                <td><div style={{ fontWeight: 600 }}>{r.siswa?.nama_lengkap ?? '—'}</div><div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{r.siswa?.nis ?? ''}</div></td>
                <td>{r.rombel?.label_rombel ?? '—'}</td>
                <td><span class="guru-badge" style={{ background: { hadir:'#15803d',terlambat:'#d97706',alpha:'#dc2626' }[r.status] ?? '#64748b' }}>{r.status}</span></td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{r.scan_at ? new Date(r.scan_at).toLocaleTimeString('id-ID') : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── PAGE 3: Rekap Kehadiran ───────────────────────────────────────────────────

function PageRekap({ t }) {
  const today = new Date().toISOString().slice(0,10)
  const [tanggal, setTanggal] = useState(today)
  const [rombelId, setRombelId] = useState('')
  const [status, setStatus] = useState('')
  const [rombels, setRombels] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({})

  useEffect(() => { apiFetch('/rombel/options').then(r => setRombels(r.data?.rombel ?? [])).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ tanggal, per_page: '100' })
      if (rombelId) p.set('rombel_id', rombelId)
      if (status) p.set('status', status)
      const res = await apiFetch(`/presensi/jam-siswa?${p}`)
      setRows(res.data?.siswa ?? []); setSummary(res.data?.summary ?? {})
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [tanggal, rombelId, status])

  useEffect(() => { load() }, [load])

  const SC = { hadir:'#15803d', terlambat:'#d97706', alpha:'#dc2626', sakit:'#0284c7', izin:'#7c3aed' }
  const inp = { padding: '0.45rem 0.75rem', border: '1px solid var(--guru-border)', borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem', color: 'var(--guru-text)', background: 'var(--guru-bg)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div class="guru-card"><div class="guru-card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
        <input type="date" value={tanggal} max={today} onInput={e => setTanggal(e.target.value)} style={inp} />
        <select value={rombelId} onChange={e => setRombelId(e.target.value)} style={inp}>
          <option value="">{t.gu_semua_rombel}</option>
          {rombels.map(r => <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
          <option value="">{t.gu_semua_status}</option>
          {['hadir','terlambat','alpha','sakit','izin'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <button class="guru-btn-ghost" onClick={load}>{t.ch_refresh}</button>
      </div></div>

      {Object.keys(summary).length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(summary).map(([k,v]) => (
            <span key={k} style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', background: SC[k]??'#64748b', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
              {k.charAt(0).toUpperCase()+k.slice(1)}: {v}
            </span>
          ))}
        </div>
      )}

      <div class="guru-card">
        {loading ? <div class="guru-loading">{t.gu_memuat}</div>
        : rows.length === 0 ? <div class="guru-table-empty">{t.gu_tidak_ada_data}</div>
        : <table class="guru-table">
            <thead><tr><th>{t.gu_col_nama_siswa}</th><th>{t.gu_col_nis}</th><th>{t.gm_col_rombel}</th><th>{t.ei_col_status}</th><th>{t.gu_col_jam_scan}</th></tr></thead>
            <tbody>{rows.map((r,i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.siswa?.nama_lengkap ?? '—'}</td>
                <td style={{ color: 'var(--guru-text-muted)', fontSize: '0.75rem' }}>{r.siswa?.nis ?? '—'}</td>
                <td>{r.rombel?.label_rombel ?? '—'}</td>
                <td><span class="guru-badge" style={{ background: SC[r.status]??'#64748b' }}>{r.status}</span></td>
                <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{r.scan_at ? new Date(r.scan_at).toLocaleTimeString('id-ID') : '—'}</td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
    </div>
  )
}

// ── PAGE 4: Early Warning ─────────────────────────────────────────────────────

function PageWarning({ t }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('14')
  const [minAlpha, setMinAlpha] = useState('3')

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await apiFetch(`/early-warnings?periode=${periode}&min_alpha=${minAlpha}`); setItems(r.data?.warnings ?? []) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [periode, minAlpha])
  useEffect(() => { load() }, [load])

  const SC = { critical:'#dc2626', high:'#ea580c', medium:'#d97706' }
  const SI = { critical:'🔴', high:'🟠', medium:'🟡' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div class="guru-card"><div class="guru-card-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.875rem 1.25rem' }}>
        <label style={{ fontSize: '0.8125rem', color: 'var(--guru-text-muted)' }}>{t.gu_periode_label}</label>
        {['7','14','30'].map(p => <button key={p} onClick={() => setPeriode(p)} class={periode===p?'guru-btn-primary':'guru-btn-ghost'} style={{ padding: '0.35rem 0.875rem' }}>{p} {t.gu_hari_suffix}</button>)}
        <label style={{ fontSize: '0.8125rem', color: 'var(--guru-text-muted)', marginLeft: '0.5rem' }}>{t.gu_min_alpha}</label>
        {['2','3','5'].map(m => <button key={m} onClick={() => setMinAlpha(m)} class={minAlpha===m?'guru-btn-primary':'guru-btn-ghost'} style={{ padding: '0.35rem 0.875rem' }}>≥{m}×</button>)}
        <button class="guru-btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>{t.ch_refresh}</button>
      </div></div>
      <div class="guru-card">
        {loading ? <div class="guru-loading">{t.gu_memuat}</div>
        : items.length === 0 ? <div class="guru-table-empty">{t.gu_tidak_ada_alpha_high}</div>
        : <table class="guru-table">
            <thead><tr><th>{t.gu_col_tingkat}</th><th>{t.gu_col_nama_siswa}</th><th>{t.gm_col_rombel}</th><th>{t.gu_col_alpha}</th><th>{t.gu_col_rate_hadir}</th></tr></thead>
            <tbody>{items.map(w => (
              <tr key={w.siswa_id}>
                <td style={{ textAlign: 'center', fontSize: '1.125rem' }}>{SI[w.severity]??'⚪'}</td>
                <td><div style={{ fontWeight: 600 }}>{w.nama_lengkap}</div><div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{w.nis}</div></td>
                <td>{w.rombel_label??'—'}</td>
                <td style={{ color: SC[w.severity]??'#64748b', fontWeight: 700 }}>{w.alpha_count}×</td>
                <td>
                  <div style={{ height: 6, background: 'var(--guru-border)', borderRadius: 999, width: 80, overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${w.rate_hadir??0}%`, background: (w.rate_hadir??0)<50?'#dc2626':(w.rate_hadir??0)<75?'#d97706':'#15803d' }} />
                  </div>
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--guru-text-muted)' }}>{w.rate_hadir??0}%</span>
                </td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
    </div>
  )
}

// ── PAGE 5: Logbook PKL ───────────────────────────────────────────────────────

function PageLogbook({ t }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('menunggu_review')
  const [detail, setDetail] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [acting, setActing] = useState(false)
  const [err, setErr] = useState('')

  const SL = { draft: t.lb_status_draft, menunggu_review: t.lb_status_menunggu_review, disetujui: t.lb_status_disetujui, ditolak: t.lb_status_ditolak }
  const SC = { draft:'#64748b', menunggu_review:'#d97706', disetujui:'#15803d', ditolak:'#dc2626' }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ per_page: '50' })
      if (filter) p.set('status', filter)
      const r = await apiFetch(`/logbook?${p}`)
      setItems(r.data?.items ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [filter])
  useEffect(() => { load() }, [load])

  async function handleReview(action) {
    if (!detail) return
    if (action === 'reject' && !catatan.trim()) { setErr(t.gu_catatan_wajib); return }
    setErr(''); setActing(true)
    try {
      await apiFetch(`/logbook/${detail.logbook_id}`, { method: 'PATCH', body: JSON.stringify({ action, catatan_guru: catatan }) })
      setDetail(null); setCatatan(''); await load()
    } catch (e) { setErr(e.message) } finally { setActing(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['menunggu_review','disetujui','ditolak',''].map(s => (
          <button key={s} onClick={() => setFilter(s)} class={filter===s?'guru-btn-primary':'guru-btn-ghost'}>
            {s==='' ? t.gu_semua : SL[s]}
          </button>
        ))}
        <button class="guru-btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>{t.ch_refresh}</button>
      </div>
      <div class="guru-card">
        {loading ? <div class="guru-loading">{t.gu_memuat}</div>
        : items.length === 0 ? <div class="guru-table-empty">{filter==='menunggu_review' ? t.gu_tidak_ada_logbook_pend : t.gu_tidak_ada_data}</div>
        : <table class="guru-table">
            <thead><tr><th>{t.gm_col_siswa}</th><th>{t.lb_tanggal_label}</th><th>{t.lb_col_lokasi}</th><th>{t.ei_col_status}</th><th>{t.lb_col_aksi}</th></tr></thead>
            <tbody>{items.map(item => (
              <tr key={item.logbook_id}>
                <td><div style={{ fontWeight: 600 }}>{item.nama_siswa}</div><div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{item.nis}</div></td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(item.tanggal)}</td>
                <td>{item.lokasi || <span style={{ color: 'var(--guru-text-muted)' }}>—</span>}</td>
                <td><span class="guru-badge" style={{ background: SC[item.status] }}>{SL[item.status]}</span></td>
                <td><button class="guru-btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => { setDetail(item); setCatatan(''); setErr('') }}>{t.lb_lihat_btn} {item.status==='menunggu_review'?'⚡':''}</button></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={e => e.target===e.currentTarget && setDetail(null)}>
          <div style={{ background: 'var(--guru-surface)', borderRadius: 'var(--guru-radius)', boxShadow: 'var(--guru-shadow-md)', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--guru-border)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>📋 {detail.nama_siswa}</h3>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--guru-text-muted)' }}>✕</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.4rem 1rem', fontSize: '0.8125rem', margin: 0 }}>
                <dt style={{ color: 'var(--guru-text-muted)' }}>{t.lb_tanggal_label}</dt><dd style={{ margin: 0 }}>{fmtDate(detail.tanggal)}</dd>
                <dt style={{ color: 'var(--guru-text-muted)' }}>{t.lb_waktu_label}</dt><dd style={{ margin: 0 }}>{detail.jam_mulai&&detail.jam_selesai?`${detail.jam_mulai}–${detail.jam_selesai}`:detail.jam_mulai||'—'}</dd>
                <dt style={{ color: 'var(--guru-text-muted)' }}>{t.lb_col_lokasi}</dt><dd style={{ margin: 0 }}>{detail.lokasi||'—'}</dd>
              </dl>
              <div>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.8125rem', fontWeight: 600 }}>{t.gu_col_deskripsi}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, background: 'var(--guru-bg)', padding: '0.75rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>{detail.deskripsi}</p>
              </div>
              {detail.status === 'menunggu_review' && (
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#92400e' }}>{t.gu_review_label}</p>
                  <textarea rows={3} placeholder={t.gu_catatan_placeholder} value={catatan}
                    onInput={e => setCatatan(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fcd34d', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem', resize: 'vertical', background: 'var(--guru-bg)', color: 'var(--guru-text)', boxSizing: 'border-box' }} />
                  {err && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{err}</p>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleReview('approve')} disabled={acting} style={{ flex: 1, padding: '0.5rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>{acting?'…':t.gu_setujui}</button>
                    <button onClick={() => handleReview('reject')} disabled={acting} style={{ flex: 1, padding: '0.5rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>{acting?'…':t.gu_kembalikan}</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--guru-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button class="guru-btn-ghost" onClick={() => setDetail(null)}>{t.lb_tutup_simple}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PAGE 6: E-Izin ────────────────────────────────────────────────────────────

function PageIzin({ t }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('menunggu')

  const SC = { menunggu:'#d97706', disetujui:'#15803d', ditolak:'#dc2626' }
  const SL = { menunggu: t.ei_status_menunggu, disetujui: t.ei_status_disetujui, ditolak: t.ei_status_ditolak }
  const TL = { sakit: t.ei_opt_sakit, izin: t.ei_opt_izin, alpha: '❌ Alpha' }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ per_page: '50' })
      if (filter) p.set('status', filter)
      const r = await apiFetch(`/e-izin?${p}`)
      setItems(r.data?.data ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [filter])
  useEffect(() => { load() }, [load])

  async function approve(id, action) {
    if (!confirm(action==='approve' ? t.gu_confirm_approve : t.gu_confirm_reject)) return
    try { await apiFetch(`/e-izin/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ action }) }); await load() }
    catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['menunggu','disetujui','ditolak',''].map(s => (
          <button key={s} onClick={() => setFilter(s)} class={filter===s?'guru-btn-primary':'guru-btn-ghost'}>
            {s==='' ? t.gu_semua : SL[s] ?? s}
          </button>
        ))}
        <button class="guru-btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>{t.ch_refresh}</button>
      </div>
      <div class="guru-card">
        {loading ? <div class="guru-loading">{t.gu_memuat}</div>
        : items.length === 0 ? <div class="guru-table-empty">{filter==='menunggu' ? t.gu_tidak_ada_izin_pend : t.gu_tidak_ada_data}</div>
        : <table class="guru-table">
            <thead>
              <tr><th>{t.gm_col_siswa}</th><th>{t.ei_jenis_label}</th><th>{t.lb_tanggal_label}</th><th>{t.ei_keterangan_label}</th><th>{t.ei_col_status}</th>{filter==='menunggu'&&<th>{t.lb_col_aksi}</th>}</tr>
            </thead>
            <tbody>{items.map(item => (
              <tr key={item.izin_id}>
                <td><div style={{ fontWeight: 600 }}>{item.nama_siswa??'—'}</div><div style={{ fontSize: '0.7rem', color: 'var(--guru-text-muted)' }}>{item.nis}</div></td>
                <td>{TL[item.jenis]??item.jenis}</td>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(item.tanggal_mulai)}{item.tanggal_selesai&&item.tanggal_selesai!==item.tanggal_mulai?` – ${fmtDate(item.tanggal_selesai)}`:''}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{item.alasan||'—'}</td>
                <td><span class="guru-badge" style={{ background: SC[item.status]??'#64748b' }}>{SL[item.status]??item.status}</span></td>
                {filter==='menunggu'&&<td><div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => approve(item.izin_id,'approve')} style={{ padding: '0.25rem 0.625rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>✅</button>
                  <button onClick={() => approve(item.izin_id,'reject')} style={{ padding: '0.25rem 0.625rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>✕</button>
                </div></td>}
              </tr>
            ))}</tbody>
          </table>}
      </div>
    </div>
  )
}

function PageAkun({ user, t }) {
  const [form, setForm] = useState({ password_baru: '', konfirmasi: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function save() {
    setMsg(''); setErr('')
    if (!form.password_baru) { setErr(t.gu_password_wajib); return }
    if (form.password_baru.length < 6) { setErr(t.gu_password_min); return }
    if (form.password_baru !== form.konfirmasi) { setErr(t.gu_password_tidak_cocok); return }
    setLoading(true)
    try {
      await apiFetch(`/users/${user?.user_id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password: form.password_baru }) })
      setMsg(t.gu_password_sukses); setForm({ password_baru: '', konfirmasi: '' })
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  const inp = { padding: '0.55rem 0.75rem', border: '1px solid var(--guru-border)', borderRadius: '8px', fontFamily: 'var(--guru-font)', fontSize: '0.875rem', color: 'var(--guru-text)', background: 'var(--guru-bg)' }

  return (
    <div style={{ maxWidth: 480 }}>
      <div class="guru-card">
        <div class="guru-card-header"><h3 class="guru-card-title">{t.gu_akun_judul}</h3></div>
        <div class="guru-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.4rem 1rem', fontSize: '0.8125rem', margin: 0, padding: '0.875rem', background: 'var(--guru-bg)', borderRadius: '8px', border: '1px solid var(--guru-border)' }}>
            <dt style={{ color: 'var(--guru-text-muted)' }}>{t.gu_nama_label}</dt><dd style={{ margin: 0, fontWeight: 600 }}>{user?.nama_lengkap||'—'}</dd>
            <dt style={{ color: 'var(--guru-text-muted)' }}>{t.gu_username_label}</dt><dd style={{ margin: 0 }}>{user?.username||'—'}</dd>
            <dt style={{ color: 'var(--guru-text-muted)' }}>{t.gu_email_label}</dt><dd style={{ margin: 0 }}>{user?.email||'—'}</dd>
            <dt style={{ color: 'var(--guru-text-muted)' }}>{t.gu_role_label}</dt><dd style={{ margin: 0 }}>{user?.user_type||'guru'}</dd>
          </dl>
          <hr style={{ border: 'none', borderTop: '1px solid var(--guru-border)', margin: 0 }} />
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{t.gu_ganti_password}</p>
          {msg && <div style={{ padding: '0.625rem 0.875rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#15803d', fontSize: '0.8125rem' }}>✅ {msg}</div>}
          {err && <div style={{ padding: '0.625rem 0.875rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '0.8125rem' }}>{err}</div>}
          {[
            { k:'password_baru', l: t.gu_password_baru_label, p: t.gu_placeholder_password },
            { k:'konfirmasi',    l: t.gu_konfirmasi_label,    p: t.gu_placeholder_konfirmasi },
          ].map(f => (
            <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--guru-text)' }}>{f.l}</label>
              <input type="password" placeholder={f.p} value={form[f.k]} onInput={e => setForm(p => ({...p,[f.k]:e.target.value}))} style={inp} />
            </div>
          ))}
          <button class="guru-btn-primary" onClick={save} disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? t.gu_menyimpan : t.gu_simpan_password}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function DashboardGuru({ user, onLogout }) {
  return (
    <GuruLayout
      user={user}
      onLogout={onLogout}
      renderPage={(activePage, setActivePage, lang) => {
        const t = T[lang] || T.id
        return (
          <>
            <PageSlot id="dashboard"     active={activePage}><PageDashboard onNav={setActivePage} t={t} /></PageSlot>
            <PageSlot id="sesi"          active={activePage}><PageSesi t={t} /></PageSlot>
            <PageSlot id="rekap"         active={activePage}><PageRekap t={t} /></PageSlot>
            <PageSlot id="warning"       active={activePage}><PageWarning t={t} /></PageSlot>
            <PageSlot id="logbook"       active={activePage}><PageLogbook t={t} /></PageSlot>
            <PageSlot id="izin"          active={activePage}><PageIzin t={t} /></PageSlot>
            <PageSlot id="communication" active={activePage}><CommunicationHub lang={lang} /></PageSlot>
            <PageSlot id="gamifikasi"    active={activePage}><GamifikasiPage lang={lang} /></PageSlot>
            <PageSlot id="akun"          active={activePage}><PageAkun user={user} t={t} /></PageSlot>
          </>
        )
      }}
    />
  )
}
