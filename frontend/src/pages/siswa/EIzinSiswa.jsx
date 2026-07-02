/**
 * EIzinSiswa.jsx
 * Halaman E-Izin untuk role siswa:
 *   - Lihat riwayat izin + status
 *   - Ajukan izin/sakit baru
 *
 * @author development
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import { authApi } from '../../utils/api'

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

// ── Styles inline (mengikuti --clr-* dari SiswaLayout.css) ───────────────────

const s = {
  card: {
    background: 'var(--clr-white)',
    border: '1px solid var(--clr-border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    marginBottom: '1.25rem',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.25rem', borderBottom: '1px solid var(--clr-border)',
  },
  cardTitle: {
    margin: 0, fontSize: '0.9rem', fontWeight: 700,
    color: 'var(--clr-text-base)', display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  cardBody: { padding: '1.25rem' },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1rem', background: 'var(--clr-primary)', color: '#fff',
    border: 'none', borderRadius: '8px', fontFamily: 'var(--font-main)',
    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.45rem 0.875rem', background: 'transparent',
    color: 'var(--clr-text-muted)', border: '1px solid var(--clr-border)',
    borderRadius: '8px', fontFamily: 'var(--font-main)',
    fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--clr-text-base)' },
  input: {
    padding: '0.55rem 0.75rem', border: '1px solid var(--clr-border)',
    borderRadius: '8px', fontFamily: 'var(--font-main)', fontSize: '0.875rem',
    color: 'var(--clr-text-base)', background: 'var(--clr-bg)',
  },
}

const STATUS_CLR = {
  menunggu_ortu:  '#7c3aed',
  pending:        '#d97706',
  disetujui_wali: '#0284c7',
  ditolak_wali:   '#dc2626',
  disetujui:      '#15803d',
  ditolak:        '#dc2626',
  // backward compat
  menunggu:       '#d97706',
}
const STATUS_LBL = {
  menunggu_ortu:  '⏳ Menunggu Ortu',
  pending:        '⏳ Menunggu Wali Kelas',
  disetujui_wali: '🔄 Menunggu Admin',
  ditolak_wali:   '❌ Ditolak Wali',
  disetujui:      '✅ Disetujui',
  ditolak:        '❌ Ditolak',
  menunggu:       '⏳ Menunggu',
}
const TYPE_LBL   = { sakit: '🏥 Sakit', izin: '📋 Izin' }

// ── Main Component ────────────────────────────────────────────────────────────

export default function EIzinSiswa() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [globalErr,   setGlobalErr]   = useState('')
  const [successMsg,  setSuccessMsg]  = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    jenis:          'sakit',
    tanggal_mulai:  today,
    tanggal_selesai: today,
    alasan:         '',
  })

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/e-izin?per_page=50')
      setItems(res.data?.items ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit() {
    setGlobalErr('')
    if (!form.alasan.trim()) {
      setGlobalErr('Keterangan wajib diisi.'); return
    }
    setSubmitting(true)
    try {
      await apiFetch('/e-izin', { method: 'POST', body: JSON.stringify(form) })
      setSuccessMsg('Pengajuan izin berhasil dikirim.')
      setShowForm(false)
      setForm({ jenis: 'sakit', tanggal_mulai: today, tanggal_selesai: today, alasan: '' })
      await load()
    } catch (e) {
      setGlobalErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap',
        gap: '1rem', marginBottom: '1.25rem',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--clr-text-base)' }}>
            Portal E-Izin
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--clr-text-muted)' }}>
            Ajukan izin atau sakit dan pantau status persetujuannya
          </p>
        </div>
        <button style={s.btnPrimary} onClick={() => { setShowForm(true); setGlobalErr(''); setSuccessMsg('') }}>
          + Ajukan Izin
        </button>
      </div>

      {/* Success msg */}
      {successMsg && (
        <div style={{
          padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: '10px', color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem',
        }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Form ajukan izin */}
      {showForm && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>📝 Ajukan Izin / Sakit</h3>
            <button style={s.btnGhost} onClick={() => setShowForm(false)}>✕ Tutup</button>
          </div>
          <div style={{ ...s.cardBody, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {globalErr && (
              <div style={{
                padding: '0.625rem 0.875rem', background: '#fef2f2',
                border: '1px solid #fca5a5', borderRadius: '8px',
                color: '#dc2626', fontSize: '0.8125rem',
              }}>
                {globalErr}
              </div>
            )}

            <div style={s.field}>
              <label style={s.label}>Jenis</label>
              <select value={form.jenis} onChange={e => setF('jenis', e.target.value)}
                style={s.input}>
                <option value="sakit">🏥 Sakit</option>
                <option value="izin">📋 Izin</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={s.field}>
                <label style={s.label}>Tanggal Mulai</label>
                <input type="date" value={form.tanggal_mulai}
                  max={today} style={s.input}
                  onInput={e => setF('tanggal_mulai', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Tanggal Selesai</label>
                <input type="date" value={form.tanggal_selesai}
                  min={form.tanggal_mulai} max={today} style={s.input}
                  onInput={e => setF('tanggal_selesai', e.target.value)} />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Keterangan <span style={{ color: '#dc2626' }}>*</span></label>
              <textarea rows={4} placeholder="Jelaskan alasan izin/sakit..."
                value={form.alasan}
                onInput={e => setF('alasan', e.target.value)}
                style={{ ...s.input, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={s.btnGhost} onClick={() => setShowForm(false)} disabled={submitting}>
                Batal
              </button>
              <button style={s.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Mengirim…' : '📤 Kirim Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h3 style={s.cardTitle}>📋 Riwayat Izin</h3>
          <button style={s.btnGhost} onClick={load} style={{ ...s.btnGhost, fontSize: '0.75rem' }}>
            ↺ Refresh
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--clr-text-muted)' }}>
            Memuat riwayat…
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--clr-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            Belum ada pengajuan izin.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                {['Jenis','Tanggal','Keterangan','Status','Catatan Guru'].map(h => (
                  <th key={h} style={{
                    padding: '0.625rem 1rem', textAlign: 'left',
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--clr-text-muted)',
                    background: 'var(--clr-bg)', borderBottom: '1px solid var(--clr-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.izin_id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {TYPE_LBL[item.jenis] ?? item.jenis}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    {fmtDate(item.tanggal_mulai)}
                    {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai
                      ? ` – ${fmtDate(item.tanggal_selesai)}` : ''}
                  </td>
                  <td style={{
                    padding: '0.75rem 1rem', maxWidth: 200,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.alasan || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.625rem',
                      borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, color: '#fff',
                      background: STATUS_CLR[item.status] ?? '#64748b',
                    }}>
                      {STATUS_LBL[item.status] ?? item.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
                    {item.catatan_reviewer || '—'}
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
