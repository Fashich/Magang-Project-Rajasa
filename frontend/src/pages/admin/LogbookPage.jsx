/**
 * LogbookPage.jsx
 * Logbook Praktik PKL — siswa isi, guru review + nilai
 * Branch: feature/logbook-praktik
 *
 * 3 tab:
 *   - Daftar Logbook   : tabel + filter + detail modal
 *   - Buat / Edit      : form entri baru (siswa only)
 *   - Penilaian        : nilai per komponen + nilai akhir (guru input, semua lihat)
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import { T } from '../../utils/lang.js'
import './LogbookPage.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token')
      || ''
}

function getUser() {
  try {
    const raw = localStorage.getItem('presensi_lab_rajasa:auth_user')
             || localStorage.getItem('user_data')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
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

// ── Constants ─────────────────────────────────────────────────────────────────

function buildStatusLabel(t) {
  return {
    draft:           t.lb_status_draft,
    menunggu_review: t.lb_status_menunggu_review,
    disetujui:       t.lb_status_disetujui,
    ditolak:         t.lb_status_ditolak,
  }
}

const STATUS_COLOR = {
  draft:            'var(--lb-draft)',
  menunggu_review:  'var(--lb-menunggu)',
  disetujui:        'var(--lb-disetujui)',
  ditolak:          'var(--lb-ditolak)',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDatetime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
  return (
    <div class="lb-stat-card" style={{ '--accent': color }}>
      <div class="lb-stat-icon">{icon}</div>
      <div>
        <div class="lb-stat-value">{value ?? 0}</div>
        <div class="lb-stat-label">{label}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span class="lb-badge" style={{ background: STATUS_COLOR[status] ?? '#94a3b8' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ── Modal Detail Logbook ──────────────────────────────────────────────────────

function DetailModal({ item, userType, onClose, onReview, onEdit, onDelete }) {
  const [catatan, setCatatan] = useState('')
  const [loading, setLoading] = useState(false)
  const [reviewErr, setReviewErr] = useState('')

  const isGuru = ['guru', 'admin'].includes(userType)
  const isSiswa = userType === 'siswa'
  const canReview = isGuru && item.status === 'menunggu_review'
  const canEdit = isSiswa && ['draft', 'ditolak'].includes(item.status)
  const canDelete = (isSiswa && item.status === 'draft') || ['admin'].includes(userType)

  async function handleReview(action) {
    setReviewErr('')
    if (action === 'reject' && !catatan.trim()) {
      setReviewErr(t.ad_catatan_wajib_logbook)
      return
    }
    setLoading(true)
    try {
      await onReview(item.logbook_id, action, catatan)
      onClose()
    } catch (e) {
      setReviewErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="lb-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="lb-modal">
        <div class="lb-modal-header">
          <h3 class="lb-modal-title">📋 Detail Logbook</h3>
          <button class="lb-modal-close" onClick={onClose}>✕</button>
        </div>

        <div class="lb-modal-body">
          {/* Info utama */}
          <div class="lb-detail-section">
            <h4>Informasi Entri</h4>
            <dl class="lb-detail-grid">
              <dt>Tanggal</dt>
              <dd>{fmtDate(item.tanggal)}</dd>
              <dt>Waktu</dt>
              <dd>
                {item.jam_mulai && item.jam_selesai
                  ? `${item.jam_mulai} — ${item.jam_selesai}`
                  : item.jam_mulai || '—'}
              </dd>
              <dt>Lokasi</dt>
              <dd>{item.lokasi || '—'}</dd>
              <dt>Siswa</dt>
              <dd>{item.nama_siswa} {item.nis ? `(${item.nis})` : ''}</dd>
              <dt>Guru Pembimbing</dt>
              <dd>{item.nama_guru || '—'}</dd>
              <dt>Status</dt>
              <dd><StatusBadge status={item.status} /></dd>
            </dl>
          </div>

          {/* Deskripsi */}
          <div class="lb-detail-section">
            <h4>Deskripsi Kegiatan</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--admin-text)', whiteSpace: 'pre-wrap' }}>
              {item.deskripsi}
            </p>
          </div>

          {/* Foto */}
          {item.foto_path && (
            <div class="lb-detail-section">
              <h4>📷 Foto Dokumentasi</h4>
              <img
                class="lb-foto-preview"
                src={`/uploads/${item.foto_path}`}
                alt="Dokumentasi PKL"
              />
            </div>
          )}

          {/* Catatan guru (jika sudah direview) */}
          {item.catatan_guru && (
            <div class="lb-detail-section">
              <h4>💬 Catatan Guru Pembimbing</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-text)', lineHeight: 1.6 }}>
                {item.catatan_guru}
              </p>
              {item.reviewed_at && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                  Direview: {fmtDatetime(item.reviewed_at)}
                </p>
              )}
            </div>
          )}

          {/* Panel review untuk guru */}
          {canReview && (
            <div class="lb-review-panel">
              <h5>Review Logbook</h5>
              <textarea
                placeholder="Catatan / saran (wajib diisi jika dikembalikan)..."
                rows={3}
                value={catatan}
                onInput={e => setCatatan(e.target.value)}
                style={{ resize: 'vertical', width: '100%', padding: '0.5rem', borderRadius: '6px',
                  border: '1px solid #fcd34d', fontFamily: 'var(--admin-font)', fontSize: '0.8125rem',
                  background: 'var(--admin-bg)', color: 'var(--admin-text)' }}
              />
              {reviewErr && <p style={{ color: 'var(--admin-danger)', fontSize: '0.75rem', margin: 0 }}>{reviewErr}</p>}
              <div class="lb-review-actions">
                <button class="lb-btn-approve" onClick={() => handleReview('approve')} disabled={loading}>
                  {loading ? '…' : '✅ Setujui'}
                </button>
                <button class="lb-btn-reject" onClick={() => handleReview('reject')} disabled={loading}>
                  {loading ? '…' : '↩ Kembalikan'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div class="lb-modal-footer">
          {canDelete && (
            <button class="lb-action-btn danger" onClick={() => { onDelete(item.logbook_id); onClose() }}>
              🗑 Hapus
            </button>
          )}
          {canEdit && (
            <button class="lb-btn-ghost" onClick={() => { onEdit(item); onClose() }}>
              ✏️ Edit
            </button>
          )}
          <button class="lb-btn-ghost" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Form Entri (siswa) ──────────────────────────────────────────────────

function FormEntriModal({ editing, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    tanggal:    editing?.tanggal    ?? today,
    jam_mulai:  editing?.jam_mulai  ?? '',
    jam_selesai:editing?.jam_selesai ?? '',
    lokasi:     editing?.lokasi     ?? '',
    deskripsi:  editing?.deskripsi  ?? '',
    foto_path:  editing?.foto_path  ?? '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalErr, setGlobalErr] = useState('')

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave(submit = false) {
    setErrors({})
    setGlobalErr('')
    const errs = {}
    if (!form.tanggal) errs.tanggal = 'Tanggal wajib diisi.'
    if (!form.deskripsi || form.deskripsi.trim().length < 10) errs.deskripsi = 'Deskripsi minimal 10 karakter.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const body = { ...form, submit }
      let res
      if (editing) {
        res = await apiFetch(`/logbook/${editing.logbook_id}`, {
          method: 'PATCH', body: JSON.stringify(body),
        })
      } else {
        res = await apiFetch('/logbook', { method: 'POST', body: JSON.stringify(body) })
      }
      onSaved(res.data?.logbook ?? res.data, submit)
      onClose()
    } catch (e) {
      setGlobalErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="lb-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="lb-modal">
        <div class="lb-modal-header">
          <h3 class="lb-modal-title">{editing ? '✏️ Edit Logbook' : '📝 Entri Logbook Baru'}</h3>
          <button class="lb-modal-close" onClick={onClose}>✕</button>
        </div>

        <div class="lb-modal-body">
          {globalErr && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '8px',
              color: 'var(--admin-danger)', fontSize: '0.8125rem' }}>
              {globalErr}
            </div>
          )}

          <div class="lb-field">
            <label>Tanggal <span class="required">*</span></label>
            <input type="date" value={form.tanggal} max={today}
              onInput={e => setF('tanggal', e.target.value)} />
            {errors.tanggal && <span class="lb-err">{errors.tanggal}</span>}
          </div>

          <div class="lb-field-row">
            <div class="lb-field">
              <label>Jam Mulai</label>
              <input type="time" value={form.jam_mulai} onInput={e => setF('jam_mulai', e.target.value)} />
            </div>
            <div class="lb-field">
              <label>Jam Selesai</label>
              <input type="time" value={form.jam_selesai} onInput={e => setF('jam_selesai', e.target.value)} />
            </div>
          </div>

          <div class="lb-field">
            <label>Lokasi / Tempat PKL</label>
            <input type="text" placeholder="Contoh: Lab Komputer Gedung A" maxLength={200}
              value={form.lokasi} onInput={e => setF('lokasi', e.target.value)} />
          </div>

          <div class="lb-field">
            <label>Deskripsi Kegiatan <span class="required">*</span></label>
            <textarea rows={5} placeholder="Ceritakan secara detail kegiatan yang dilakukan hari ini..."
              value={form.deskripsi} onInput={e => setF('deskripsi', e.target.value)} />
            {errors.deskripsi && <span class="lb-err">{errors.deskripsi}</span>}
          </div>

          <div class="lb-field">
            <label>Path Foto Dokumentasi</label>
            <input type="text" placeholder="Contoh: pkl/2026/foto-hari1.jpg"
              value={form.foto_path} onInput={e => setF('foto_path', e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
              Isi path relatif setelah upload foto ke server
            </span>
          </div>
        </div>

        <div class="lb-modal-footer">
          <button class="lb-btn-ghost" onClick={onClose} disabled={loading}>Batal</button>
          <button class="lb-btn-ghost" onClick={() => handleSave(false)} disabled={loading}>
            💾 Simpan Draft
          </button>
          <button class="lb-btn-primary" onClick={() => handleSave(true)} disabled={loading}>
            {loading ? 'Menyimpan…' : '📤 Kirim ke Guru'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Form Penilaian (guru) ───────────────────────────────────────────────

function FormPenilaianModal({ siswaId, namaSiswa, existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    nilai_kedisiplinan: existing?.nilai_kedisiplinan ?? '',
    nilai_keterampilan: existing?.nilai_keterampilan ?? '',
    nilai_sikap:        existing?.nilai_sikap        ?? '',
    nilai_laporan:      existing?.nilai_laporan      ?? '',
    catatan_akhir:      existing?.catatan_akhir      ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    setErr('')
    setLoading(true)
    try {
      let res
      if (existing) {
        res = await apiFetch(`/logbook/penilaian/${existing.penilaian_id}`, {
          method: 'PATCH', body: JSON.stringify({ ...form, siswa_id: siswaId }),
        })
      } else {
        res = await apiFetch('/logbook/penilaian', {
          method: 'POST', body: JSON.stringify({ ...form, siswa_id: siswaId }),
        })
      }
      onSaved(res.data?.penilaian)
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const komponen = [
    { key: 'nilai_kedisiplinan', label: t.gm_nilai_kedisiplinan },
    { key: 'nilai_keterampilan', label: t.gm_nilai_keterampilan },
    { key: 'nilai_sikap',        label: t.gm_nilai_sikap },
    { key: 'nilai_laporan',      label: t.gm_nilai_laporan },
  ]

  // Preview nilai akhir
  const filled = komponen.map(k => parseFloat(form[k.key])).filter(v => !isNaN(v))
  const preview = filled.length ? (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(2) : null
  const predikat = preview >= 90 ? 'A' : preview >= 75 ? 'B' : preview >= 60 ? 'C' : preview ? 'D' : null

  return (
    <div class="lb-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="lb-modal">
        <div class="lb-modal-header">
          <h3 class="lb-modal-title">⭐ Penilaian — {namaSiswa}</h3>
          <button class="lb-modal-close" onClick={onClose}>✕</button>
        </div>

        <div class="lb-modal-body">
          {err && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '8px',
              color: 'var(--admin-danger)', fontSize: '0.8125rem' }}>
              {err}
            </div>
          )}

          <div class="lb-field-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {komponen.map(k => (
              <div class="lb-field" key={k.key}>
                <label>{k.label} (0–100)</label>
                <input type="number" min="0" max="100" placeholder="—"
                  value={form[k.key]}
                  onInput={e => setF(k.key, e.target.value)} />
              </div>
            ))}
          </div>

          {/* Preview nilai akhir */}
          {preview && (
            <div class="lb-nilai-akhir">
              <div class="lb-predikat-badge">{predikat}</div>
              <div>
                <div class="lb-nilai-akhir-num">{preview}</div>
                <div class="lb-nilai-akhir-label">Nilai Akhir (rata-rata)</div>
              </div>
            </div>
          )}

          <div class="lb-field">
            <label>Catatan / Rekomendasi Akhir</label>
            <textarea rows={4} placeholder="Tulis catatan atau rekomendasi untuk siswa..."
              value={form.catatan_akhir} onInput={e => setF('catatan_akhir', e.target.value)} />
          </div>
        </div>

        <div class="lb-modal-footer">
          <button class="lb-btn-ghost" onClick={onClose} disabled={loading}>Batal</button>
          <button class="lb-btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Menyimpan…' : '💾 Simpan Penilaian'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab Daftar Logbook ────────────────────────────────────────────────────────

function TabDaftar({ userType, summary, onSummaryChange }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [detail, setDetail]     = useState(null)
  const [editing, setEditing]   = useState(null)
  const [showForm, setShowForm] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBulan,  setFilterBulan]  = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })

  const isSiswa = userType === 'siswa'
  const isGuru  = ['guru'].includes(userType)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '50' })
      if (filterStatus) params.set('status', filterStatus)
      if (filterBulan)  params.set('bulan', filterBulan)
      const res = await apiFetch(`/logbook?${params}`)
      setItems(res.data?.items ?? [])
      onSummaryChange(res.data?.summary ?? {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterBulan])

  useEffect(() => { load() }, [load])

  async function handleReview(logbookId, action, catatan) {
    await apiFetch(`/logbook/${logbookId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, catatan_guru: catatan }),
    })
    await load()
  }

  async function handleDelete(logbookId) {
    if (!confirm('Yakin hapus entri logbook ini?')) return
    try {
      await apiFetch(`/logbook/${logbookId}`, { method: 'DELETE' })
      await load()
    } catch (e) { alert(e.message) }
  }

  function handleEdit(item) {
    setEditing(item)
    setShowForm(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter bar */}
      <div class="lb-filter-bar">
        <input type="month" value={filterBulan} onInput={e => setFilterBulan(e.target.value)} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="menunggu_review">Menunggu Review</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Dikembalikan</option>
        </select>
        <button class="lb-btn-ghost" onClick={load}>↺ Refresh</button>
        {isSiswa && (
          <button class="lb-btn-primary" style={{ marginLeft: 'auto' }}
            onClick={() => { setEditing(null); setShowForm(true) }}>
            + Tambah Entri
          </button>
        )}
      </div>

      {/* Tabel */}
      <div class="lb-table-wrap">
        {loading ? (
          <div class="lb-loading">Memuat logbook…</div>
        ) : items.length === 0 ? (
          <div class="lb-empty">
            <div class="lb-empty-icon">📒</div>
            <div class="lb-empty-text">Belum ada entri logbook untuk bulan ini.</div>
          </div>
        ) : (
          <table class="lb-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                {!isSiswa && <th>Siswa</th>}
                <th>Lokasi</th>
                <th>Deskripsi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.logbook_id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <strong>{fmtDate(item.tanggal)}</strong>
                    {item.jam_mulai && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                        {item.jam_mulai}–{item.jam_selesai || '?'}
                      </div>
                    )}
                  </td>
                  {!isSiswa && (
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nama_siswa}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{item.nis}</div>
                    </td>
                  )}
                  <td>{item.lokasi || <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}</td>
                  <td>
                    <div class="lb-desc-snippet">{item.deskripsi}</div>
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    <button class="lb-action-btn" onClick={() => setDetail(item)}>
                      Lihat {isGuru && item.status === 'menunggu_review' ? '⚡' : ''}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {detail && (
        <DetailModal
          item={detail}
          userType={userType}
          onClose={() => { setDetail(null); load() }}
          onReview={handleReview}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showForm && (
        <FormEntriModal
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}

// ── Tab Penilaian ─────────────────────────────────────────────────────────────

function TabPenilaian({ userType }) {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null) // { siswaId, namaSiswa, existing? }

  const isGuru = ['guru', 'admin'].includes(userType)
  const isSiswa = userType === 'siswa'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/logbook/penilaian')
      setItems(res.data?.items ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function predikatColor(p) {
    return { A: '#15803d', B: '#1e40af', C: '#d97706', D: '#dc2626' }[p] ?? '#64748b'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button class="lb-btn-ghost" onClick={load}>↺ Refresh</button>
      </div>

      {loading ? (
        <div class="lb-loading">Memuat penilaian…</div>
      ) : items.length === 0 ? (
        <div class="lb-empty">
          <div class="lb-empty-icon">⭐</div>
          <div class="lb-empty-text">
            {isSiswa ? t.lb_penilaian_kosong_judul : t.ad_belum_ada_penilaian2}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(p => (
            <div class="lb-penilaian-card" key={p.penilaian_id}>
              <h4>
                ⭐ Penilaian — {p.nama_siswa}
                {p.nis && <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}> ({p.nis})</span>}
                {isGuru && (
                  <button class="lb-action-btn" style={{ marginLeft: 'auto' }}
                    onClick={() => setModal({ siswaId: p.siswa_id, namaSiswa: p.nama_siswa, existing: p })}>
                    ✏️ Edit
                  </button>
                )}
              </h4>

              <div class="lb-nilai-grid">
                {[
                  { label: t.gm_nilai_kedisiplinan, val: p.nilai_kedisiplinan },
                  { label: t.gm_nilai_keterampilan, val: p.nilai_keterampilan },
                  { label: t.gm_nilai_sikap,        val: p.nilai_sikap },
                  { label: t.gm_nilai_laporan,      val: p.nilai_laporan },
                ].map(n => (
                  <div class="lb-nilai-item" key={n.label}>
                    <div class="nilai-angka">{n.val ?? '—'}</div>
                    <div class="nilai-label">{n.label}</div>
                  </div>
                ))}
              </div>

              {p.nilai_akhir && (
                <div class="lb-nilai-akhir">
                  <div class="lb-predikat-badge" style={{ background: predikatColor(p.predikat) }}>
                    {p.predikat}
                  </div>
                  <div>
                    <div class="lb-nilai-akhir-num">{p.nilai_akhir}</div>
                    <div class="lb-nilai-akhir-label">Nilai Akhir Logbook PKL</div>
                  </div>
                </div>
              )}

              {p.catatan_akhir && (
                <div style={{ marginTop: '0.875rem', padding: '0.875rem', background: 'var(--admin-bg)',
                  borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--admin-text-muted)',
                    fontWeight: 600, marginBottom: '0.3rem' }}>Catatan Guru:</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-text)', lineHeight: 1.6 }}>
                    {p.catatan_akhir}
                  </p>
                </div>
              )}

              <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                Dinilai oleh {p.nama_guru} · {fmtDatetime(p.dinilai_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tombol tambah penilaian untuk guru (jika belum ada) */}
      {isGuru && items.length === 0 && (
        <div style={{ textAlign: 'center' }}>
          <button class="lb-btn-primary"
            onClick={() => setModal({ siswaId: null, namaSiswa: '', existing: null })}>
            + Beri Penilaian
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.5rem' }}>
            Pilih siswa dan masukkan nilai per komponen
          </p>
        </div>
      )}

      {modal && (
        <FormPenilaianModal
          siswaId={modal.siswaId}
          namaSiswa={modal.namaSiswa}
          existing={modal.existing}
          onClose={() => setModal(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LogbookPage({ lang }) {
  const t = T[lang] || T.id
  const STATUS_LABEL = buildStatusLabel(t)
  const user     = getUser()
  const userType = user?.user_type ?? 'siswa'
  const isSiswa  = userType === 'siswa'

  const [tab, setTab]       = useState('daftar')
  const [summary, setSummary] = useState({})

  const tabs = [
    { key: 'daftar',    label: '📋 Daftar Logbook' },
    { key: 'penilaian', label: '⭐ Penilaian' },
  ]

  return (
    <div class="lb-page">
      {/* Header */}
      <div class="lb-page-header">
        <div>
          <h1 class="lb-page-title">Logbook Praktik (PKL)</h1>
          <p class="lb-page-sub">
            {isSiswa
              ? 'Catat kegiatan harian PKL dan kirim ke guru pembimbing untuk divalidasi'
              : 'Pantau, validasi, dan beri penilaian logbook PKL siswa bimbingan'}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div class="lb-stats-row">
        <StatCard label="Total Entri"      value={summary.total}     icon="📒" color="var(--admin-primary)" />
        <StatCard label="Draft"            value={summary.draft}     icon="✏️"  color="var(--lb-draft)" />
        <StatCard label="Menunggu Review"  value={summary.menunggu}  icon="⏳"  color="var(--lb-menunggu)" />
        <StatCard label="Disetujui"        value={summary.disetujui} icon="✅"  color="var(--lb-disetujui)" />
        <StatCard label="Dikembalikan"     value={summary.ditolak}   icon="↩"  color="var(--lb-ditolak)" />
      </div>

      {/* Tab bar */}
      <div class="lb-tab-bar">
        {tabs.map(t => (
          <button key={t.key} class={`lb-tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'daftar' && (
        <TabDaftar userType={userType} summary={summary} onSummaryChange={setSummary} />
      )}
      {tab === 'penilaian' && (
        <TabPenilaian userType={userType} />
      )}
    </div>
  )
}
