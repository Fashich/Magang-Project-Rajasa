/**
 * TambahSiswaModal.jsx
 * Form tambah akun siswa — terhubung ke AdminSiswaController
 * (NISN/jurusan/rombel/angkatan, password default = NISN)
 */

import { useState, useEffect } from 'preact/hooks'

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

const CURRENT_YEAR = new Date().getFullYear()

const INITIAL_FORM = {
  nama_lengkap:  '',
  username:      '',
  nisn:          '',
  nis:           '',
  email:         '',
  no_telp:       '',
  jenis_kelamin: '',
  angkatan:      String(CURRENT_YEAR),
  jurusan_id:    '',
  rombel_id:     '',
}

export default function TambahSiswaModal({ onClose, onSuccess }) {
  const [form, setForm]       = useState({ ...INITIAL_FORM })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const [jurusanList, setJurusanList] = useState([])
  const [rombelList, setRombelList]   = useState([])
  const [optionsErr, setOptionsErr]   = useState('')

  // Fetch dropdown jurusan + rombel
  useEffect(() => {
    apiFetch('/jurusan/options')
      .then(res => setJurusanList(res.data?.jurusan ?? []))
      .catch(() => setOptionsErr(prev => prev || 'Gagal memuat daftar jurusan.'))

    apiFetch('/rombel/options')
      .then(res => setRombelList(res.data?.rombel ?? []))
      .catch(() => setOptionsErr(prev => prev || 'Gagal memuat daftar rombel.'))
  }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.nama_lengkap.trim() || !form.username.trim() || !form.nisn.trim() || !form.angkatan) {
      setError('Nama lengkap, username, NISN, dan angkatan wajib diisi.')
      return
    }
    if (form.nisn.trim().length < 8) {
      setError('NISN minimal 8 karakter.')
      return
    }

    setLoading(true)
    try {
      await apiFetch('/admin/siswa', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          angkatan:   Number(form.angkatan),
          jurusan_id: form.jurusan_id ? Number(form.jurusan_id) : null,
          rombel_id:  form.rombel_id  ? Number(form.rombel_id)  : null,
        }),
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
          <h3>Tambah Siswa</h3>
          <button type="button" className="users-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="users-modal-body">
          {error && <div className="users-alert users-alert--error">{error}</div>}
          {optionsErr && <div className="users-alert users-alert--error">{optionsErr}</div>}

          <div className="users-alert" style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)' }}>
            ℹ️ Password default = NISN yang dimasukkan. Sampaikan ke siswa untuk mengganti password setelah login pertama.
          </div>

          <div className="users-form-grid">
            <div className="users-form-grid--full">
              <label className="users-label">Nama Lengkap <span className="users-required">*</span></label>
              <input
                className="users-input"
                type="text"
                placeholder="Nama lengkap siswa"
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
              <label className="users-label">NISN <span className="users-required">*</span></label>
              <input
                className="users-input"
                type="text"
                placeholder="10 digit — jadi password default"
                value={form.nisn}
                onInput={set('nisn')}
              />
            </div>

            <div>
              <label className="users-label">NIS</label>
              <input
                className="users-input"
                type="text"
                placeholder="Nomor sekolah"
                value={form.nis}
                onInput={set('nis')}
              />
            </div>

            <div>
              <label className="users-label">Jenis Kelamin</label>
              <select className="users-select" style={{ width: '100%' }} value={form.jenis_kelamin} onChange={set('jenis_kelamin')}>
                <option value="">—</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="users-label">Angkatan <span className="users-required">*</span></label>
              <input
                className="users-input"
                type="number"
                placeholder="2026"
                value={form.angkatan}
                onInput={set('angkatan')}
              />
            </div>

            <div>
              <label className="users-label">Jurusan</label>
              <select className="users-select" style={{ width: '100%' }} value={form.jurusan_id} onChange={set('jurusan_id')}>
                <option value="">— Pilih jurusan —</option>
                {jurusanList.map(j => (
                  <option key={j.jurusan_id} value={j.jurusan_id}>{j.nama_jurusan}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="users-label">Rombel / Kelas</label>
              <select className="users-select" style={{ width: '100%' }} value={form.rombel_id} onChange={set('rombel_id')}>
                <option value="">— Pilih rombel —</option>
                {rombelList.map(r => (
                  <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="users-label">Email</label>
              <input
                className="users-input"
                type="email"
                placeholder="email@student.smksrajasa.sch.id"
                value={form.email}
                onInput={set('email')}
              />
            </div>

            <div>
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
            {loading ? 'Menyimpan…' : 'Buat Akun Siswa'}
          </button>
        </div>
      </div>
    </div>
  )
}
