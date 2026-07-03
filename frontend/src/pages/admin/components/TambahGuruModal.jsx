/**
 * TambahGuruModal.jsx
 * Form tambah akun guru/staff — terhubung ke AdminGuruController
 * (NIP/jabatan/mapel/status kepegawaian, password default = NIP)
 */

import { useState } from 'preact/hooks'
import { T } from '../../utils/lang.js'

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

const JABATAN_OPTIONS = [
  'Guru Mapel',
  'Wali Kelas',
  'Kepala Program',
  'Staff TU',
  'Admin',
]

const STATUS_KEPEGAWAIAN_OPTIONS = ['PNS', 'PPPK', 'GTT', 'Honorer', 'Kontrak']

const JENIS_USER_OPTIONS = {
  guru:   'Guru',
  staff:  'Staff',
  admin:  'Admin',
  intern: 'Intern',
}

const INITIAL_FORM = {
  nama_lengkap:       '',
  username:           '',
  nip:                '',
  email:              '',
  no_telp:            '',
  jabatan:            '',
  mapel_pengampu:     '',
  status_kepegawaian: '',
  jenis_user:         'guru',
}

export default function TambahGuruModal({ onClose, onSuccess, lang }) {
  const t = T[lang] || T.id
  const [form, setForm]       = useState({ ...INITIAL_FORM })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const isNipRequired = form.jenis_user === 'guru'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.nama_lengkap.trim() || !form.username.trim()) {
      setError(t.ei_keterangan_wajib)
      return
    }
    if (isNipRequired && !form.nip.trim()) {
      setError(t.ei_keterangan_wajib)
      return
    }

    setLoading(true)
    try {
      await apiFetch('/admin/guru', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="users-overlay" onClick={onClose}>
      <div className="users-modal users-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="users-modal-header">
          <h3>Tambah Guru / Staff</h3>
          <button type="button" className="users-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="users-modal-body">
          {error && <div className="users-alert users-alert--error">{error}</div>}

          <div className="users-alert" style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)' }}>
            ℹ️ Password default = NIP yang dimasukkan. Sampaikan ke guru untuk mengganti password setelah login pertama.
          </div>

          <div className="users-form-grid">
            <div className="users-form-grid--full">
              <label className="users-label">Nama Lengkap <span className="users-required">*</span></label>
              <input
                className="users-input"
                type="text"
                placeholder="Contoh: Budi Santoso, S.Pd."
                value={form.nama_lengkap}
                onInput={set('nama_lengkap')}
                autoFocus
              />
            </div>

            <div>
              <label className="users-label">Username <span className="users-required">*</span></label>
              <input
                className="users-input"
                type="text"
                placeholder="username untuk login"
                value={form.username}
                onInput={set('username')}
              />
            </div>

            <div>
              <label className="users-label">Jenis User <span className="users-required">*</span></label>
              <select className="users-select" style={{ width: '100%' }} value={form.jenis_user} onChange={set('jenis_user')}>
                {Object.entries(JENIS_USER_OPTIONS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="users-label">
                NIP {isNipRequired && <span className="users-required">*</span>}
              </label>
              <input
                className="users-input"
                type="text"
                placeholder="Min. 8 digit — jadi password default"
                value={form.nip}
                onInput={set('nip')}
              />
            </div>

            <div>
              <label className="users-label">Jabatan</label>
              <select className="users-select" style={{ width: '100%' }} value={form.jabatan} onChange={set('jabatan')}>
                <option value="">— Pilih jabatan —</option>
                {JABATAN_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>

            <div className="users-form-grid--full">
              <label className="users-label">Mata Pelajaran</label>
              <input
                className="users-input"
                type="text"
                placeholder="Pisahkan dengan koma: Matematika, Fisika"
                value={form.mapel_pengampu}
                onInput={set('mapel_pengampu')}
              />
            </div>

            <div>
              <label className="users-label">Status Kepegawaian</label>
              <select className="users-select" style={{ width: '100%' }} value={form.status_kepegawaian} onChange={set('status_kepegawaian')}>
                <option value="">— Pilih status —</option>
                {STATUS_KEPEGAWAIAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="users-label">Email</label>
              <input
                className="users-input"
                type="email"
                placeholder="email@smksrajasa.sch.id"
                value={form.email}
                onInput={set('email')}
              />
            </div>

            <div className="users-form-grid--full">
              <label className="users-label">No. Telepon</label>
              <input
                className="users-input"
                type="text"
                placeholder="08xxxxxxxxxx"
                value={form.no_telp}
                onInput={set('no_telp')}
              />
            </div>
          </div>
        </div>

        <div className="users-modal-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="users-btn users-btn--primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t.ad_menyimpan : t.ad_buat_pengguna}
          </button>
        </div>
      </div>
    </div>
  )
}
