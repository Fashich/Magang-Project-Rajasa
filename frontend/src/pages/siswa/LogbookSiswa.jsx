/**
 * LogbookSiswa.jsx
 * Halaman Logbook PKL untuk role siswa:
 *   - Stat cards ringkasan
 *   - Daftar entri + status approval
 *   - Form buat/edit entri
 *   - Lihat penilaian akhir dari guru
 *
 * @author development
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import { T } from '../../utils/lang.js'

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

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  card: {
    background: 'var(--clr-white)', border: '1px solid var(--clr-border)',
    borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
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
  draft: '#64748b', menunggu_review: '#d97706', disetujui: '#15803d', ditolak: '#dc2626',
}
function buildStatusLbl(t) {
  return {
    draft: t.lb_status_draft, menunggu_review: t.lb_status_menunggu_review,
    disetujui: t.lb_status_disetujui, ditolak: t.lb_status_ditolak,
  }
}

// ── Form Entri ────────────────────────────────────────────────────────────────

function FormEntri({ editing, onClose, onSaved, t }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    tanggal:     editing?.tanggal     ?? today,
    jam_mulai:   editing?.jam_mulai   ?? '',
    jam_selesai: editing?.jam_selesai ?? '',
    lokasi:      editing?.lokasi      ?? '',
    deskripsi:   editing?.deskripsi   ?? '',
    foto_path:   editing?.foto_path   ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(submit = false) {
    setErr('')
    if (!form.tanggal) { setErr(t.lb_tanggal_wajib); return }
    if (form.deskripsi.trim().length < 10) { setErr(t.lb_deskripsi_min); return }
    setLoading(true)
    try {
      if (editing) {
        await apiFetch(`/logbook/${editing.logbook_id}`, {
          method: 'PATCH', body: JSON.stringify({ ...form, submit }),
        })
      } else {
        await apiFetch('/logbook', {
          method: 'POST', body: JSON.stringify({ ...form, submit }),
        })
      }
      onSaved()
      onClose()
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <h3 style={s.cardTitle}>{editing ? t.lb_edit_judul : t.lb_baru_judul}</h3>
        <button style={s.btnGhost} onClick={onClose}>{t.lb_tutup_x}</button>
      </div>
      <div style={{ ...s.cardBody, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {err && (
          <div style={{
            padding: '0.625rem 0.875rem', background: '#fef2f2',
            border: '1px solid #fca5a5', borderRadius: '8px',
            color: '#dc2626', fontSize: '0.8125rem',
          }}>{err}</div>
        )}

        <div style={s.field}>
          <label style={s.label}>{t.lb_tanggal_label} <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="date" value={form.tanggal} max={today} style={s.input}
            onInput={e => setF('tanggal', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={s.field}>
            <label style={s.label}>{t.lb_jam_mulai}</label>
            <input type="time" value={form.jam_mulai} style={s.input}
              onInput={e => setF('jam_mulai', e.target.value)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>{t.lb_jam_selesai}</label>
            <input type="time" value={form.jam_selesai} style={s.input}
              onInput={e => setF('jam_selesai', e.target.value)} />
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>{t.lb_lokasi_label}</label>
          <input type="text" placeholder={t.lb_placeholder_lokasi} maxLength={200}
            value={form.lokasi} style={s.input}
            onInput={e => setF('lokasi', e.target.value)} />
        </div>

        <div style={s.field}>
          <label style={s.label}>{t.lb_deskripsi_label} <span style={{ color: '#dc2626' }}>*</span></label>
          <textarea rows={5} placeholder={t.lb_placeholder_deskripsi}
            value={form.deskripsi} style={{ ...s.input, resize: 'vertical' }}
            onInput={e => setF('deskripsi', e.target.value)} />
        </div>

        <div style={s.field}>
          <label style={s.label}>{t.lb_foto_label}</label>
          <input type="text" placeholder={t.lb_placeholder_foto}
            value={form.foto_path} style={s.input}
            onInput={e => setF('foto_path', e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button style={s.btnGhost} onClick={onClose} disabled={loading}>{t.lb_batal}</button>
          <button style={s.btnGhost} onClick={() => handleSave(false)} disabled={loading}>
            {t.lb_simpan_draft}
          </button>
          <button style={s.btnPrimary} onClick={() => handleSave(true)} disabled={loading}>
            {loading ? t.lb_menyimpan : t.lb_kirim_guru}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LogbookSiswa({ lang }) {
  const t = T[lang] || T.id
  const STATUS_LBL = buildStatusLbl(t)

  const [items,   setItems]   = useState([])
  const [summary, setSummary] = useState({})
  const [penilaian, setPenilaian] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('daftar') // 'daftar' | 'penilaian'
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [detail,   setDetail]   = useState(null)

  const today = new Date()
  const defaultBulan = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`
  const [filterBulan,  setFilterBulan]  = useState(defaultBulan)
  const [filterStatus, setFilterStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '50' })
      if (filterBulan)  params.set('bulan', filterBulan)
      if (filterStatus) params.set('status', filterStatus)
      const res = await apiFetch(`/logbook?${params}`)
      setItems(res.data?.items ?? [])
      setSummary(res.data?.summary ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterBulan, filterStatus])

  const loadPenilaian = useCallback(async () => {
    try {
      const res = await apiFetch('/logbook/penilaian')
      const items = res.data?.items ?? []
      setPenilaian(items.length > 0 ? items[0] : null)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadPenilaian() }, [loadPenilaian])

  async function handleDelete(id) {
    if (!confirm(t.lb_confirm_hapus)) return
    try {
      await apiFetch(`/logbook/${id}`, { method: 'DELETE' })
      await load()
    } catch (e) { alert(e.message) }
  }

  const StatPill = ({ label, value, color }) => (
    <div style={{
      background: 'var(--clr-white)', border: `1px solid var(--clr-border)`,
      borderLeft: `3px solid ${color}`, borderRadius: '10px',
      padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-text-base)', lineHeight: 1 }}>
          {value ?? 0}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '0.2rem' }}>
          {label}
        </div>
      </div>
    </div>
  )

  const predikatClr = { A: '#15803d', B: '#1e40af', C: '#d97706', D: '#dc2626' }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--clr-text-base)' }}>
            {t.lb_judul}
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--clr-text-muted)' }}>
            {t.lb_subtitle}
          </p>
        </div>
        <button style={s.btnPrimary} onClick={() => { setEditing(null); setShowForm(true) }}>
          {t.lb_tambah_btn}
        </button>
      </div>

      {/* Stat pills */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.875rem', marginBottom: '1.25rem',
      }}>
        <StatPill label={t.lb_stat_total}    value={summary.total}     color="var(--clr-primary)" />
        <StatPill label={t.lb_status_draft}  value={summary.draft}     color="#64748b" />
        <StatPill label={t.lb_stat_menunggu} value={summary.menunggu}  color="#d97706" />
        <StatPill label={t.lb_status_disetujui} value={summary.disetujui} color="#15803d" />
        <StatPill label={t.lb_status_ditolak}   value={summary.ditolak}   color="#dc2626" />
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        borderBottom: '2px solid var(--clr-border)', marginBottom: '1.25rem',
      }}>
        {[
          { key: 'daftar',    label: t.lb_tab_daftar },
          { key: 'penilaian', label: t.lb_tab_penilaian },
        ].map(tabItem => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)} style={{
            padding: '0.5rem 1.25rem', border: 'none', background: 'transparent',
            fontFamily: 'var(--font-main)', fontSize: '0.875rem', fontWeight: tab === tabItem.key ? 600 : 500,
            color: tab === tabItem.key ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
            cursor: 'pointer', borderBottom: `2px solid ${tab === tabItem.key ? 'var(--clr-primary)' : 'transparent'}`,
            marginBottom: '-2px', transition: 'color 0.15s, border-color 0.15s',
          }}>
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Form entri */}
      {showForm && (
        <FormEntri
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={load}
          t={t}
        />
      )}

      {/* Tab: Daftar */}
      {tab === 'daftar' && (
        <div>
          {/* Filter */}
          <div style={{
            ...s.card, padding: '0.875rem 1.25rem',
            display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
          }}>
            <input type="month" value={filterBulan}
              onInput={e => setFilterBulan(e.target.value)} style={s.input} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={s.input}>
              <option value="">{t.lb_semua_status}</option>
              {Object.entries(STATUS_LBL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button style={s.btnGhost} onClick={load}>{t.lb_refresh}</button>
          </div>

          <div style={s.card}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--clr-text-muted)' }}>
                {t.lb_memuat}
              </div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--clr-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📒</div>
                {t.lb_kosong}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    {[t.lb_tanggal_label, t.lb_col_lokasi, t.lb_col_status, t.lb_col_catatan, t.lb_col_aksi].map(h => (
                      <th key={h} style={{
                        padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.7rem',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: 'var(--clr-text-muted)', background: 'var(--clr-bg)',
                        borderBottom: '1px solid var(--clr-border)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.logbook_id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{fmtDate(item.tanggal)}</div>
                        {item.jam_mulai && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>
                            {item.jam_mulai}–{item.jam_selesai || '?'}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {item.lokasi || <span style={{ color: 'var(--clr-text-muted)' }}>—</span>}
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
                      <td style={{
                        padding: '0.75rem 1rem', maxWidth: 200,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: 'var(--clr-text-muted)', fontSize: '0.8rem',
                      }}>
                        {item.catatan_guru || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button onClick={() => setDetail(item)} style={{
                            padding: '0.25rem 0.625rem', borderRadius: '6px',
                            border: '1px solid var(--clr-border)', background: 'transparent',
                            fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-main)',
                          }}>{t.lb_lihat_btn}</button>
                          {['draft','ditolak'].includes(item.status) && (
                            <button onClick={() => { setEditing(item); setShowForm(true) }} style={{
                              padding: '0.25rem 0.625rem', borderRadius: '6px',
                              border: '1px solid var(--clr-border)', background: 'transparent',
                              fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-main)',
                            }}>✏️</button>
                          )}
                          {item.status === 'draft' && (
                            <button onClick={() => handleDelete(item.logbook_id)} style={{
                              padding: '0.25rem 0.625rem', borderRadius: '6px',
                              border: '1px solid #fca5a5', background: 'transparent',
                              fontSize: '0.75rem', cursor: 'pointer', color: '#dc2626',
                              fontFamily: 'var(--font-main)',
                            }}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Penilaian */}
      {tab === 'penilaian' && (
        <div>
          {!penilaian ? (
            <div style={{ ...s.card }}>
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⭐</div>
                <p style={{ margin: 0, fontWeight: 600 }}>{t.lb_penilaian_kosong_judul}</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem' }}>
                  {t.lb_penilaian_kosong_desc}
                </p>
              </div>
            </div>
          ) : (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>{t.lb_penilaian_akhir_dari} {penilaian.nama_guru}</h3>
              </div>
              <div style={s.cardBody}>
                {/* 4 komponen nilai */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem', marginBottom: '1.25rem',
                }}>
                  {[
                    { label: t.lb_nilai_kedisiplinan, val: penilaian.nilai_kedisiplinan },
                    { label: t.lb_nilai_keterampilan, val: penilaian.nilai_keterampilan },
                    { label: t.lb_nilai_sikap,        val: penilaian.nilai_sikap },
                    { label: t.lb_nilai_laporan,      val: penilaian.nilai_laporan },
                  ].map(n => (
                    <div key={n.label} style={{
                      background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
                      borderRadius: '10px', padding: '0.875rem', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--clr-primary)' }}>
                        {n.val ?? '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '0.2rem' }}>
                        {n.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nilai akhir */}
                {penilaian.nilai_akhir && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem',
                    background: 'var(--clr-primary-light)', borderRadius: '12px',
                    border: '1px solid var(--clr-primary)', marginBottom: '1rem',
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: predikatClr[penilaian.predikat] ?? 'var(--clr-primary)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {penilaian.predikat}
                    </div>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--clr-primary)', lineHeight: 1 }}>
                        {penilaian.nilai_akhir}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '0.2rem' }}>
                        {t.lb_nilai_akhir_label}
                      </div>
                    </div>
                  </div>
                )}

                {/* Catatan guru */}
                {penilaian.catatan_akhir && (
                  <div style={{
                    padding: '0.875rem', background: 'var(--clr-bg)',
                    border: '1px solid var(--clr-border)', borderRadius: '10px',
                  }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                      {t.lb_catatan_dari_guru}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--clr-text-base)' }}>
                      {penilaian.catatan_akhir}
                    </p>
                  </div>
                )}

                <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                  {t.lb_dinilai} {fmtDate(penilaian.dinilai_at)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }} onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div style={{
            background: 'var(--clr-white)', borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--clr-border)',
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{t.lb_detail_judul}</h3>
              <button onClick={() => setDetail(null)} style={{
                background: 'none', border: 'none', fontSize: '1.25rem',
                cursor: 'pointer', color: 'var(--clr-text-muted)',
              }}>✕</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <dl style={{
                display: 'grid', gridTemplateColumns: '120px 1fr',
                gap: '0.4rem 1rem', fontSize: '0.8125rem', margin: 0,
              }}>
                <dt style={{ color: 'var(--clr-text-muted)' }}>{t.lb_tanggal_label}</dt>
                <dd style={{ margin: 0, fontWeight: 600 }}>{fmtDate(detail.tanggal)}</dd>
                <dt style={{ color: 'var(--clr-text-muted)' }}>{t.lb_waktu_label}</dt>
                <dd style={{ margin: 0 }}>
                  {detail.jam_mulai && detail.jam_selesai
                    ? `${detail.jam_mulai} – ${detail.jam_selesai}`
                    : detail.jam_mulai || '—'}
                </dd>
                <dt style={{ color: 'var(--clr-text-muted)' }}>{t.lb_col_lokasi}</dt>
                <dd style={{ margin: 0 }}>{detail.lokasi || '—'}</dd>
                <dt style={{ color: 'var(--clr-text-muted)' }}>{t.lb_col_status}</dt>
                <dd style={{ margin: 0 }}>
                  <span style={{
                    display: 'inline-block', padding: '0.2rem 0.625rem',
                    borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, color: '#fff',
                    background: STATUS_CLR[detail.status] ?? '#64748b',
                  }}>
                    {STATUS_LBL[detail.status] ?? detail.status}
                  </span>
                </dd>
              </dl>

              <div>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {t.lb_deskripsi_label}
                </p>
                <p style={{
                  margin: 0, fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  background: 'var(--clr-bg)', padding: '0.75rem', borderRadius: '8px',
                }}>
                  {detail.deskripsi}
                </p>
              </div>

              {detail.catatan_guru && (
                <div style={{
                  padding: '0.875rem', background: '#fffbeb',
                  border: '1px solid #fcd34d', borderRadius: '10px',
                }}>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.8125rem', fontWeight: 700, color: '#92400e' }}>
                    {t.lb_catatan_dari_guru}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--clr-text-base)', lineHeight: 1.6 }}>
                    {detail.catatan_guru}
                  </p>
                </div>
              )}
            </div>
            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid var(--clr-border)',
              display: 'flex', justifyContent: 'flex-end',
            }}>
              <button style={s.btnGhost} onClick={() => setDetail(null)}>{t.lb_tutup_simple}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
