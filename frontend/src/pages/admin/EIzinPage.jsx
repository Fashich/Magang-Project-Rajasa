/**
 * EIzinPage.jsx
 * Portal E-Izin — approval berjenjang izin/sakit siswa
 * Branch: feature/e-izin
 *
 * Dua tab:
 *   - Daftar Pengajuan : filter status/jenis + tabel + modal approve/reject
 *   - Ajukan Izin      : form dengan autocomplete siswa
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { bukaWA, pesanIzinDisetujui, pesanIzinDitolak } from '../../utils/waLink.jsx'
import { emailIzinDisetujui, emailIzinDitolak } from '../../services/emailService.js'
import './EIzinPage.css'

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

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  menunggu_ortu:   'Menunggu Ortu',
  pending:         'Menunggu Wali',
  disetujui_wali:  'Menunggu Admin',
  ditolak_wali:    'Ditolak Wali',
  disetujui:       'Disetujui',
  ditolak:         'Ditolak',
}

const STATUS_COLOR = {
  menunggu_ortu:   '#7c3aed',
  pending:         'var(--eizin-badge-pending)',
  disetujui_wali:  'var(--eizin-badge-wali)',
  ditolak_wali:    'var(--eizin-badge-ditolak)',
  disetujui:       'var(--eizin-badge-disetujui)',
  ditolak:         'var(--eizin-badge-ditolak)',
}

const JENIS_LABEL = { sakit: 'Sakit', izin: 'Izin', dispensasi: 'Dispensasi' }
const JENIS_ICON  = { sakit: '🤒', izin: '📋', dispensasi: '🎓' }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }) {
  return (
    <div class="eizin-stat-card" style={{ '--accent': color }}>
      <div class="eizin-stat-icon">{icon}</div>
      <div class="eizin-stat-body">
        <div class="eizin-stat-value">{value ?? '—'}</div>
        <div class="eizin-stat-label">{label}</div>
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span class="eizin-badge" style={{ background: STATUS_COLOR[status] ?? '#999' }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ── Approve / Reject Modal ────────────────────────────────────────────────────

function ApproveModal({ izin, onClose, onDone }) {
  const [action,   setAction]  = useState('approve')
  const [catatan,  setCatatan] = useState('')
  const [loading,  setLoading] = useState(false)
  const [error,    setError]   = useState('')
  const [done,     setDone]    = useState(false)   // tampilkan panel WA/Email setelah berhasil

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      await apiFetch(`/e-izin/${izin.izin_id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ action, catatan }),
      })
      // Kirim email otomatis via EmailJS (silent — tidak block UI)
      const emailParams = {
        toEmail:  izin.ortu_email ?? izin.email ?? '',
        siswa:    izin.nama_lengkap,
        jenis:    izin.jenis,
        dari:     izin.tanggal_mulai,
        sampai:   izin.tanggal_selesai,
        catatan,
      }
      if (action === 'approve') emailIzinDisetujui(emailParams)
      else                      emailIzinDitolak(emailParams)

      setDone(true)   // tampilkan panel WA
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Pesan WA yang sudah disiapkan
  const waMsg = done
    ? (action === 'approve'
        ? pesanIzinDisetujui({ siswa: izin.nama_lengkap, jenis: izin.jenis,
            dari: izin.tanggal_mulai, sampai: izin.tanggal_selesai })
        : pesanIzinDitolak({ siswa: izin.nama_lengkap, jenis: izin.jenis,
            dari: izin.tanggal_mulai, sampai: izin.tanggal_selesai, catatan }))
    : ''

  return (
    <div class="eizin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="eizin-modal">
        <div class="eizin-modal-header">
          <h3>Tindak Lanjut Pengajuan</h3>
          <button class="eizin-modal-close" onClick={onClose}>✕</button>
        </div>

        <div class="eizin-modal-info">
          <div class="eizin-modal-info-row">
            <span>Siswa</span>
            <strong>{izin.nama_lengkap}</strong>
          </div>
          <div class="eizin-modal-info-row">
            <span>Rombel</span>
            <strong>{izin.label_rombel ?? '—'}</strong>
          </div>
          <div class="eizin-modal-info-row">
            <span>Jenis</span>
            <strong>{JENIS_ICON[izin.jenis]} {JENIS_LABEL[izin.jenis]}</strong>
          </div>
          <div class="eizin-modal-info-row">
            <span>Tanggal</span>
            <strong>{fmtDate(izin.tanggal_mulai)} – {fmtDate(izin.tanggal_selesai)} ({izin.jumlah_hari} hari)</strong>
          </div>
          <div class="eizin-modal-info-row">
            <span>Alasan</span>
            <span class="eizin-modal-alasan">{izin.alasan}</span>
          </div>
        </div>

        <div class="eizin-modal-actions">
          <label class={`eizin-action-btn ${action === 'approve' ? 'active approve' : ''}`}>
            <input type="radio" name="action" value="approve"
              checked={action === 'approve'} onChange={() => setAction('approve')} />
            ✅ Setujui
          </label>
          <label class={`eizin-action-btn ${action === 'reject' ? 'active reject' : ''}`}>
            <input type="radio" name="action" value="reject"
              checked={action === 'reject'} onChange={() => setAction('reject')} />
            ❌ Tolak
          </label>
        </div>

        <div class="eizin-modal-catatan">
          <label>Catatan {action === 'reject' ? '(wajib diisi saat menolak)' : '(opsional)'}</label>
          <textarea
            rows={3}
            placeholder="Tulis catatan untuk siswa/wali..."
            value={catatan}
            onInput={e => setCatatan(e.target.value)}
          />
        </div>

        {error && <div class="eizin-error">{error}</div>}

        <div class="eizin-modal-footer">
          <button class="eizin-btn eizin-btn-ghost" onClick={onClose} disabled={loading}>Batal</button>
          <button
            class={`eizin-btn ${action === 'approve' ? 'eizin-btn-approve' : 'eizin-btn-reject'}`}
            onClick={handleSubmit}
            disabled={loading || (action === 'reject' && !catatan.trim())}
          >
            {loading ? 'Menyimpan...' : action === 'approve' ? '✅ Setujui' : '❌ Tolak'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ izin, onClose, onAct, userType }) {
  const canAct =
    (izin.status === 'pending'        && ['guru'].includes(userType)) ||
    (izin.status === 'disetujui_wali' && ['admin'].includes(userType))

  return (
    <div class="eizin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="eizin-modal eizin-modal-detail">
        <div class="eizin-modal-header">
          <h3>Detail Pengajuan #{izin.izin_id}</h3>
          <button class="eizin-modal-close" onClick={onClose}>✕</button>
        </div>

        <div class="eizin-modal-info">
          <div class="eizin-modal-info-row"><span>Siswa</span><strong>{izin.nama_lengkap}</strong></div>
          <div class="eizin-modal-info-row"><span>Rombel</span><strong>{izin.label_rombel ?? '—'}</strong></div>
          <div class="eizin-modal-info-row">
            <span>Jenis</span>
            <strong>{JENIS_ICON[izin.jenis]} {JENIS_LABEL[izin.jenis]}</strong>
          </div>
          <div class="eizin-modal-info-row">
            <span>Tanggal</span>
            <strong>{fmtDate(izin.tanggal_mulai)} – {fmtDate(izin.tanggal_selesai)} ({izin.jumlah_hari} hari)</strong>
          </div>
          <div class="eizin-modal-info-row"><span>Alasan</span><span class="eizin-modal-alasan">{izin.alasan}</span></div>
          {izin.keterangan_tambahan &&
            <div class="eizin-modal-info-row"><span>Keterangan</span><span>{izin.keterangan_tambahan}</span></div>}
          <div class="eizin-modal-info-row">
            <span>Status</span><StatusBadge status={izin.status} />
          </div>
          <div class="eizin-modal-info-row"><span>Diajukan</span><span>{fmtDate(izin.submitted_at)}</span></div>

          {izin.wali_approved_by && <>
            <div class="eizin-modal-divider">Approval Wali Kelas</div>
            <div class="eizin-modal-info-row"><span>Oleh</span><strong>{izin.wali_username}</strong></div>
            <div class="eizin-modal-info-row"><span>Tanggal</span><span>{fmtDate(izin.wali_approved_at)}</span></div>
            {izin.wali_catatan && <div class="eizin-modal-info-row"><span>Catatan</span><span>{izin.wali_catatan}</span></div>}
          </>}

          {izin.final_approved_by && <>
            <div class="eizin-modal-divider">Approval Final (Admin)</div>
            <div class="eizin-modal-info-row"><span>Oleh</span><strong>{izin.final_username}</strong></div>
            <div class="eizin-modal-info-row"><span>Tanggal</span><span>{fmtDate(izin.final_approved_at)}</span></div>
            {izin.final_catatan && <div class="eizin-modal-info-row"><span>Catatan</span><span>{izin.final_catatan}</span></div>}
          </>}
        </div>

        <div class="eizin-modal-footer">
          <button class="eizin-btn eizin-btn-ghost" onClick={onClose}>Tutup</button>
          {canAct && (
            <button class="eizin-btn eizin-btn-approve" onClick={() => onAct(izin)}>
              Tindak Lanjuti
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Daftar Pengajuan ─────────────────────────────────────────────────────

function DaftarTab({ userType }) {
  const [rows,      setRows]      = useState([])
  const [summary,   setSummary]   = useState({})
  const [meta,      setMeta]      = useState({ total: 0, last_page: 1, page: 1 })
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [filterStatus, setFilterStatus] = useState('semua')
  const [filterJenis,  setFilterJenis]  = useState('semua')
  const [page,      setPage]      = useState(1)
  const [detail,    setDetail]    = useState(null)   // izin yang dibuka detail
  const [actTarget, setActTarget] = useState(null)   // izin yang mau di-approve/reject

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ status: filterStatus, jenis: filterJenis, page })
      const res = await apiFetch(`/e-izin?${params}`)
      setRows(res.data?.data ?? [])
      setSummary(res.data?.summary ?? {})
      setMeta(res.data?.meta ?? { total: 0, last_page: 1, page: 1 })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterJenis, page])

  useEffect(() => { load() }, [load])

  function handleActDone() {
    setActTarget(null)
    setDetail(null)
    load()
  }

  const canAct = (izin) =>
    (izin.status === 'pending'        && ['guru'].includes(userType)) ||
    (izin.status === 'disetujui_wali' && ['admin'].includes(userType))

  return (
    <div class="eizin-tab-content">
      {/* Stat cards */}
      <div class="eizin-stats">
        <StatCard label="Total Pengajuan"  value={summary.total}          color="var(--admin-primary)" icon="📋" />
        <StatCard label="Menunggu Ortu"    value={summary.menunggu_ortu ?? 0} color="#7c3aed" icon="👨‍👩‍👧" />
        <StatCard label="Menunggu Wali"     value={summary.pending}        color="#f59e0b" icon="⏳" />
        <StatCard label="Menunggu Admin"   value={summary.menunggu_final} color="#8b5cf6" icon="🔄" />
        <StatCard label="Disetujui"        value={summary.disetujui}      color="#10b981" icon="✅" />
        <StatCard label="Ditolak"          value={summary.ditolak}        color="#ef4444" icon="❌" />
      </div>

      {/* Filters */}
      <div class="eizin-filters">
        <select class="eizin-select" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="semua">Semua Status</option>
          <option value="menunggu_ortu">Menunggu Ortu</option>
          <option value="pending">Menunggu Wali</option>
          <option value="disetujui_wali">Menunggu Admin</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
          <option value="ditolak_wali">Ditolak Wali</option>
        </select>

        <select class="eizin-select" value={filterJenis}
          onChange={e => { setFilterJenis(e.target.value); setPage(1) }}>
          <option value="semua">Semua Jenis</option>
          <option value="sakit">🤒 Sakit</option>
          <option value="izin">📋 Izin</option>
          <option value="dispensasi">🎓 Dispensasi</option>
        </select>

        <button class="eizin-btn eizin-btn-ghost" onClick={load} disabled={loading}>
          {loading ? '⟳' : '↺'} Refresh
        </button>
      </div>

      {error && <div class="eizin-error">{error}</div>}

      {/* Table */}
      <div class="eizin-table-wrap">
        <table class="eizin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Siswa</th>
              <th>Rombel</th>
              <th>Jenis</th>
              <th>Tanggal</th>
              <th>Hari</th>
              <th>Status</th>
              <th>Diajukan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} class="eizin-empty">Memuat data...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} class="eizin-empty">Tidak ada pengajuan ditemukan</td></tr>
            )}
            {!loading && rows.map(row => (
              <tr key={row.izin_id} class="eizin-row" onClick={() => setDetail(row)}>
                <td class="eizin-id">#{row.izin_id}</td>
                <td class="eizin-nama">{row.nama_lengkap}</td>
                <td class="eizin-rombel">{row.label_rombel ?? '—'}</td>
                <td>{JENIS_ICON[row.jenis]} {JENIS_LABEL[row.jenis]}</td>
                <td class="eizin-tanggal">
                  {fmtDate(row.tanggal_mulai)}<br />
                  <span class="eizin-tanggal-end">s/d {fmtDate(row.tanggal_selesai)}</span>
                </td>
                <td class="eizin-hari">{row.jumlah_hari}h</td>
                <td><StatusBadge status={row.status} /></td>
                <td class="eizin-submitted">{fmtDate(row.submitted_at)}</td>
                <td onClick={e => e.stopPropagation()}>
                  {canAct(row) ? (
                    <button class="eizin-btn eizin-btn-sm eizin-btn-approve"
                      onClick={() => setActTarget(row)}>
                      Proses
                    </button>
                  ) : (
                    <button class="eizin-btn eizin-btn-sm eizin-btn-ghost"
                      onClick={() => setDetail(row)}>
                      Detail
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div class="eizin-pagination">
          <button class="eizin-btn eizin-btn-ghost eizin-btn-sm"
            disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span class="eizin-page-info">Hal {page} / {meta.last_page} ({meta.total} data)</span>
          <button class="eizin-btn eizin-btn-ghost eizin-btn-sm"
            disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      {detail && !actTarget && (
        <DetailModal
          izin={detail}
          userType={userType}
          onClose={() => setDetail(null)}
          onAct={izin => { setActTarget(izin) }}
        />
      )}
      {actTarget && (
        <ApproveModal
          izin={actTarget}
          onClose={() => setActTarget(null)}
          onDone={handleActDone}
        />
      )}
    </div>
  )
}

// ── Tab: Ajukan Izin ──────────────────────────────────────────────────────────

const INITIAL_FORM = {
  siswa_id: '',
  siswa_nama: '',
  tanggal_mulai: '',
  tanggal_selesai: '',
  jenis: 'izin',
  alasan: '',
  keterangan_tambahan: '',
}

function AjukanTab({ userType }) {
  const [form,       setForm]       = useState(INITIAL_FORM)
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState('')
  const [error,      setError]      = useState('')
  // Autocomplete siswa
  const [query,      setQuery]      = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching,  setSearching]  = useState(false)
  const debounceRef = useRef(null)
  const isSiswa = userType === 'siswa'

  // Autocomplete search
  useEffect(() => {
    if (isSiswa || query.length < 2) { setSuggestions([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await apiFetch(`/users?search=${encodeURIComponent(query)}&type=siswa&per_page=8`)
        setSuggestions(res.data?.data ?? [])
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 350)
  }, [query, isSiswa])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setLoading(true); setError(''); setSuccess('')
    try {
      const payload = { ...form }
      if (isSiswa) delete payload.siswa_id
      await apiFetch('/e-izin', { method: 'POST', body: JSON.stringify(payload) })
      setSuccess('Pengajuan berhasil dikirim! Menunggu persetujuan wali kelas.')
      setForm(INITIAL_FORM)
      setQuery('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isValid = form.tanggal_mulai && form.tanggal_selesai && form.alasan.trim() &&
    (isSiswa || form.siswa_id)

  return (
    <div class="eizin-tab-content">
      <div class="eizin-form-card">
        <h3 class="eizin-form-title">📝 Form Pengajuan Izin / Sakit</h3>
        <p class="eizin-form-sub">
          Pengajuan akan melalui persetujuan wali kelas lalu admin sebelum disetujui final.
        </p>

        <div class="eizin-form-grid">
          {/* Siswa — hidden untuk role siswa */}
          {!isSiswa && (
            <div class="eizin-form-group eizin-form-full">
              <label>Siswa <span class="eizin-required">*</span></label>
              <div class="eizin-autocomplete">
                <input
                  class="eizin-input"
                  placeholder="Cari nama siswa..."
                  value={form.siswa_id ? form.siswa_nama : query}
                  onInput={e => {
                    if (form.siswa_id) {
                      setField('siswa_id', '')
                      setField('siswa_nama', '')
                    }
                    setQuery(e.target.value)
                  }}
                />
                {searching && <div class="eizin-ac-loading">Mencari...</div>}
                {suggestions.length > 0 && !form.siswa_id && (
                  <div class="eizin-ac-dropdown">
                    {suggestions.map(s => (
                      <div key={s.siswa_id ?? s.user_id} class="eizin-ac-item"
                        onClick={() => {
                          setField('siswa_id', s.siswa_id ?? s.user_id)
                          setField('siswa_nama', s.nama_lengkap ?? s.username)
                          setQuery('')
                          setSuggestions([])
                        }}>
                        <strong>{s.nama_lengkap ?? s.username}</strong>
                        {s.label_rombel && <span class="eizin-ac-rombel"> — {s.label_rombel}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Jenis */}
          <div class="eizin-form-group">
            <label>Jenis <span class="eizin-required">*</span></label>
            <select class="eizin-select" value={form.jenis}
              onChange={e => setField('jenis', e.target.value)}>
              <option value="sakit">🤒 Sakit</option>
              <option value="izin">📋 Izin</option>
              <option value="dispensasi">🎓 Dispensasi</option>
            </select>
          </div>

          {/* Tanggal mulai */}
          <div class="eizin-form-group">
            <label>Tanggal Mulai <span class="eizin-required">*</span></label>
            <input class="eizin-input" type="date"
              value={form.tanggal_mulai}
              onChange={e => setField('tanggal_mulai', e.target.value)} />
          </div>

          {/* Tanggal selesai */}
          <div class="eizin-form-group">
            <label>Tanggal Selesai <span class="eizin-required">*</span></label>
            <input class="eizin-input" type="date"
              value={form.tanggal_selesai}
              min={form.tanggal_mulai}
              onChange={e => setField('tanggal_selesai', e.target.value)} />
          </div>

          {/* Alasan */}
          <div class="eizin-form-group eizin-form-full">
            <label>Alasan <span class="eizin-required">*</span></label>
            <textarea class="eizin-textarea" rows={3}
              placeholder="Tuliskan alasan izin/sakit dengan jelas..."
              value={form.alasan}
              onInput={e => setField('alasan', e.target.value)} />
          </div>

          {/* Keterangan tambahan */}
          <div class="eizin-form-group eizin-form-full">
            <label>Keterangan Tambahan <span class="eizin-optional">(opsional)</span></label>
            <textarea class="eizin-textarea" rows={2}
              placeholder="Contoh: sudah ada surat dokter, akan dilampirkan..."
              value={form.keterangan_tambahan}
              onInput={e => setField('keterangan_tambahan', e.target.value)} />
          </div>
        </div>

        {success && <div class="eizin-success">{success}</div>}
        {error   && <div class="eizin-error">{error}</div>}

        <div class="eizin-form-footer">
          <button class="eizin-btn eizin-btn-ghost"
            onClick={() => { setForm(INITIAL_FORM); setQuery(''); setError(''); setSuccess('') }}
            disabled={loading}>
            Reset
          </button>
          <button class="eizin-btn eizin-btn-primary"
            onClick={handleSubmit}
            disabled={loading || !isValid}>
            {loading ? 'Mengirim...' : '📤 Kirim Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EIzinPage() {
  const [activeTab, setActiveTab] = useState('daftar')

  // Ambil user type dari localStorage
  const userType = (() => {
    try {
      const raw = localStorage.getItem('presensi_lab_rajasa:auth_user')
              || localStorage.getItem('user_data')
      if (!raw) return 'admin'
      const u = JSON.parse(raw)
      return u?.user_type ?? u?.data?.user_type ?? 'admin'
    } catch { return 'admin' }
  })()

  return (
    <div class="eizin-page">
      <div class="eizin-page-header">
        <div>
          <h2 class="eizin-page-title">Portal E-Izin</h2>
          <p class="eizin-page-sub">
            Pengajuan &amp; approval izin/sakit siswa — berjenjang wali kelas → admin
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div class="eizin-tab-bar">
        <button
          class={`eizin-tab-btn${activeTab === 'daftar' ? ' active' : ''}`}
          onClick={() => setActiveTab('daftar')}>
          📋 Daftar Pengajuan
        </button>
        <button
          class={`eizin-tab-btn${activeTab === 'ajukan' ? ' active' : ''}`}
          onClick={() => setActiveTab('ajukan')}>
          ✏️ Ajukan Izin
        </button>
      </div>

      {activeTab === 'daftar' && <DaftarTab userType={userType} />}
      {activeTab === 'ajukan' && <AjukanTab userType={userType} />}
    </div>
  )
}
