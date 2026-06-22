/**
 * PengaturanPage.jsx
 * Halaman Pengaturan Sistem (admin)
 * Branch: feature/admin-dashboard
 *
 * Tiga tab:
 *   - Tahun Ajaran   : daftar + tambah + set aktif + ubah semester
 *   - Jurusan        : CRUD jurusan (tambah, edit, nonaktifkan)
 *   - Konfigurasi    : form key-value sistem (nama sekolah, timeout, dll)
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import './PengaturanPage.css'

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

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div class={`pg-toast pg-toast--${toast.type}`}>
      {toast.type === 'success' ? '✓' : '⚠'} {toast.msg}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }
  return [toast, show]
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div class="pg-overlay" onClick={onClose}>
      <div class="pg-modal" onClick={e => e.stopPropagation()}>
        <div class="pg-modal-header">
          <h3 class="pg-modal-title">{title}</h3>
          <button class="pg-modal-close" onClick={onClose}>✕</button>
        </div>
        <div class="pg-modal-body">{children}</div>
      </div>
    </div>
  )
}

// ── Tab: Tahun Ajaran ─────────────────────────────────────────────────────────

function TahunAjaranTab({ data, onReload, showToast }) {
  const [addOpen,  setAddOpen]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState({ nama_tahun_ajaran: '', semester_aktif: 'ganjil', tanggal_mulai: '', tanggal_selesai: '' })

  const resetForm = () => setForm({ nama_tahun_ajaran: '', semester_aktif: 'ganjil', tanggal_mulai: '', tanggal_selesai: '' })

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/admin/pengaturan/tahun-ajaran', { method: 'POST', body: JSON.stringify(form) })
      showToast('Tahun ajaran berhasil ditambahkan.')
      setAddOpen(false); resetForm(); onReload()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleSetAktif(id) {
    setSaving(true)
    try {
      await apiFetch(`/admin/pengaturan/tahun-ajaran/${id}`, { method: 'PATCH', body: JSON.stringify({ is_aktif: true }) })
      showToast('Tahun ajaran aktif berhasil diubah.')
      onReload()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleEditSemester(id, semester_aktif) {
    setSaving(true)
    try {
      await apiFetch(`/admin/pengaturan/tahun-ajaran/${id}`, { method: 'PATCH', body: JSON.stringify({ semester_aktif }) })
      showToast('Semester aktif diperbarui.')
      setEditId(null); onReload()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div class="pg-section">
      <div class="pg-section-toolbar">
        <span class="pg-section-info">{data.length} tahun ajaran</span>
        <button class="pg-btn pg-btn--primary" onClick={() => setAddOpen(true)}>
          + Tambah Tahun Ajaran
        </button>
      </div>

      <div class="pg-table-card">
        <table class="pg-table">
          <thead>
            <tr>
              <th>Tahun Ajaran</th>
              <th>Semester</th>
              <th>Mulai</th>
              <th>Selesai</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6}><div class="pg-empty">Belum ada tahun ajaran.</div></td></tr>
            )}
            {data.map(ta => (
              <tr key={ta.tahun_ajaran_id} class={ta.is_aktif ? 'pg-row-aktif' : ''}>
                <td class="pg-td-bold">{ta.nama_tahun_ajaran}</td>
                <td>
                  {editId === ta.tahun_ajaran_id
                    ? (
                      <select
                        class="pg-select-sm"
                        value={ta.semester_aktif}
                        onChange={e => handleEditSemester(ta.tahun_ajaran_id, e.target.value)}
                        disabled={saving}
                      >
                        <option value="ganjil">Ganjil</option>
                        <option value="genap">Genap</option>
                        <option value="pendek">Pendek</option>
                      </select>
                    )
                    : <span class="pg-semester-chip">{ta.semester_aktif}</span>
                  }
                </td>
                <td class="pg-td-muted">{ta.tanggal_mulai ?? '—'}</td>
                <td class="pg-td-muted">{ta.tanggal_selesai ?? '—'}</td>
                <td>
                  {ta.is_aktif
                    ? <span class="pg-status-badge pg-status-badge--aktif">● Aktif</span>
                    : <span class="pg-status-badge pg-status-badge--nonaktif">Nonaktif</span>
                  }
                </td>
                <td>
                  <div class="pg-action-row">
                    {!ta.is_aktif && (
                      <button
                        class="pg-btn-sm pg-btn-sm--primary"
                        onClick={() => handleSetAktif(ta.tahun_ajaran_id)}
                        disabled={saving}
                      >Set Aktif</button>
                    )}
                    <button
                      class="pg-btn-sm pg-btn-sm--outline"
                      onClick={() => setEditId(editId === ta.tahun_ajaran_id ? null : ta.tahun_ajaran_id)}
                    >{editId === ta.tahun_ajaran_id ? 'Batal' : 'Semester'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} title="Tambah Tahun Ajaran" onClose={() => { setAddOpen(false); resetForm() }}>
        <form onSubmit={handleAdd} class="pg-form">
          <div class="pg-field">
            <label class="pg-label">Nama Tahun Ajaran <span class="pg-req">*</span></label>
            <input class="pg-input" placeholder="2027/2028" value={form.nama_tahun_ajaran}
              onInput={e => setForm(f => ({ ...f, nama_tahun_ajaran: e.target.value }))} required />
            <span class="pg-hint">Format: YYYY/YYYY, misal 2027/2028</span>
          </div>
          <div class="pg-field">
            <label class="pg-label">Semester Aktif</label>
            <select class="pg-select" value={form.semester_aktif}
              onChange={e => setForm(f => ({ ...f, semester_aktif: e.target.value }))}>
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
              <option value="pendek">Pendek</option>
            </select>
          </div>
          <div class="pg-field-row">
            <div class="pg-field">
              <label class="pg-label">Tanggal Mulai</label>
              <input class="pg-input" type="date" value={form.tanggal_mulai}
                onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))} />
            </div>
            <div class="pg-field">
              <label class="pg-label">Tanggal Selesai</label>
              <input class="pg-input" type="date" value={form.tanggal_selesai}
                onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))} />
            </div>
          </div>
          <div class="pg-form-actions">
            <button type="button" class="pg-btn pg-btn--outline" onClick={() => { setAddOpen(false); resetForm() }}>Batal</button>
            <button type="submit" class="pg-btn pg-btn--primary" disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ── Tab: Jurusan ──────────────────────────────────────────────────────────────

function JurusanTab({ data, onReload, showToast }) {
  const [addOpen,  setAddOpen]  = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [form,     setForm]     = useState({ kode_jurusan: '', nama_jurusan: '', ketua_jurusan: '', deskripsi_jurusan: '' })

  const resetForm = () => setForm({ kode_jurusan: '', nama_jurusan: '', ketua_jurusan: '', deskripsi_jurusan: '' })

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/admin/pengaturan/jurusan', { method: 'POST', body: JSON.stringify(form) })
      showToast('Jurusan berhasil ditambahkan.')
      setAddOpen(false); resetForm(); onReload()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch(`/admin/pengaturan/jurusan/${editItem.jurusan_id}`, { method: 'PATCH', body: JSON.stringify(form) })
      showToast('Jurusan berhasil diperbarui.')
      setEditItem(null); resetForm(); onReload()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete(id, nama) {
    if (!confirm(`Nonaktifkan jurusan "${nama}"?`)) return
    setSaving(true)
    try {
      await apiFetch(`/admin/pengaturan/jurusan/${id}`, { method: 'DELETE' })
      showToast('Jurusan berhasil dinonaktifkan.')
      onReload()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ kode_jurusan: item.kode_jurusan, nama_jurusan: item.nama_jurusan,
      ketua_jurusan: item.ketua_jurusan ?? '', deskripsi_jurusan: item.deskripsi_jurusan ?? '' })
  }

  const JurusanForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} class="pg-form">
      <div class="pg-field-row">
        <div class="pg-field">
          <label class="pg-label">Kode Jurusan <span class="pg-req">*</span></label>
          <input class="pg-input" placeholder="TKJ" value={form.kode_jurusan}
            onInput={e => setForm(f => ({ ...f, kode_jurusan: e.target.value.toUpperCase() }))}
            disabled={!!editItem} required />
        </div>
        <div class="pg-field" style={{ flex: 2 }}>
          <label class="pg-label">Nama Jurusan <span class="pg-req">*</span></label>
          <input class="pg-input" placeholder="Teknik Komputer dan Jaringan" value={form.nama_jurusan}
            onInput={e => setForm(f => ({ ...f, nama_jurusan: e.target.value }))} required />
        </div>
      </div>
      <div class="pg-field">
        <label class="pg-label">Ketua Jurusan</label>
        <input class="pg-input" placeholder="Nama ketua jurusan" value={form.ketua_jurusan}
          onInput={e => setForm(f => ({ ...f, ketua_jurusan: e.target.value }))} />
      </div>
      <div class="pg-field">
        <label class="pg-label">Deskripsi</label>
        <textarea class="pg-textarea" rows={2} placeholder="Deskripsi singkat jurusan…"
          value={form.deskripsi_jurusan}
          onInput={e => setForm(f => ({ ...f, deskripsi_jurusan: e.target.value }))} />
      </div>
      <div class="pg-form-actions">
        <button type="button" class="pg-btn pg-btn--outline"
          onClick={() => { setAddOpen(false); setEditItem(null); resetForm() }}>Batal</button>
        <button type="submit" class="pg-btn pg-btn--primary" disabled={saving}>
          {saving ? 'Menyimpan…' : submitLabel}
        </button>
      </div>
    </form>
  )

  return (
    <div class="pg-section">
      <div class="pg-section-toolbar">
        <span class="pg-section-info">{data.length} jurusan</span>
        <button class="pg-btn pg-btn--primary" onClick={() => setAddOpen(true)}>
          + Tambah Jurusan
        </button>
      </div>

      <div class="pg-card-grid">
        {data.length === 0 && <div class="pg-empty">Belum ada jurusan.</div>}
        {data.map(j => (
          <div key={j.jurusan_id} class={`pg-jurusan-card${j.status === 'nonaktif' ? ' pg-jurusan-card--nonaktif' : ''}`}>
            <div class="pg-jurusan-kode">{j.kode_jurusan}</div>
            <div class="pg-jurusan-nama">{j.nama_jurusan}</div>
            {j.ketua_jurusan && <div class="pg-jurusan-ketua">👤 {j.ketua_jurusan}</div>}
            {j.deskripsi_jurusan && <div class="pg-jurusan-desc">{j.deskripsi_jurusan}</div>}
            <div class="pg-jurusan-footer">
              <span class={`pg-status-badge pg-status-badge--${j.status}`}>{j.status}</span>
              <div class="pg-action-row">
                <button class="pg-btn-sm pg-btn-sm--outline" onClick={() => openEdit(j)}>Edit</button>
                {j.status === 'aktif' && (
                  <button class="pg-btn-sm pg-btn-sm--danger"
                    onClick={() => handleDelete(j.jurusan_id, j.nama_jurusan)}
                    disabled={saving}>Nonaktifkan</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={addOpen} title="Tambah Jurusan" onClose={() => { setAddOpen(false); resetForm() }}>
        <JurusanForm onSubmit={handleAdd} submitLabel="Tambah" />
      </Modal>

      <Modal open={!!editItem} title={`Edit Jurusan — ${editItem?.kode_jurusan}`} onClose={() => { setEditItem(null); resetForm() }}>
        <JurusanForm onSubmit={handleEdit} submitLabel="Simpan Perubahan" />
      </Modal>
    </div>
  )
}

// ── Tab: Konfigurasi ──────────────────────────────────────────────────────────

const CONFIG_GROUPS = [
  {
    label: 'Informasi Sekolah',
    icon: '🏫',
    keys: ['nama_sekolah', 'alamat_sekolah', 'npsn', 'kepala_sekolah', 'telp_sekolah', 'email_sekolah', 'logo_url'],
  },
  {
    label: 'Aturan Presensi',
    icon: '⏱',
    keys: ['batas_terlambat_menit', 'sesi_timeout_menit', 'notif_alpha_threshold'],
  },
  {
    label: 'Keamanan & Sistem',
    icon: '🔒',
    keys: ['max_login_attempts', 'maintenance_mode'],
  },
]

function KonfigurasiTab({ data, onReload, showToast }) {
  const [values,  setValues]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [dirty,   setDirty]   = useState(false)

  // Init values dari data
  useEffect(() => {
    const init = {}
    data.forEach(c => { init[c.kunci] = c.nilai ?? '' })
    setValues(init)
    setDirty(false)
  }, [data])

  function handleChange(kunci, val) {
    setValues(v => ({ ...v, [kunci]: val }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await apiFetch('/admin/pengaturan/konfigurasi', { method: 'PATCH', body: JSON.stringify(values) })
      showToast('Konfigurasi berhasil disimpan.')
      setDirty(false)
      onReload()
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  // Map kunci → metadata dari data
  const metaMap = Object.fromEntries(data.map(c => [c.kunci, c]))

  function renderField(kunci) {
    const meta  = metaMap[kunci]
    if (!meta) return null
    const value = values[kunci] ?? ''

    return (
      <div key={kunci} class="pg-config-field">
        <label class="pg-config-label">{kunci.replace(/_/g, ' ')}</label>
        {meta.tipe_nilai === 'boolean'
          ? (
            <select class="pg-select" value={value} onChange={e => handleChange(kunci, e.target.value)}>
              <option value="false">Nonaktif</option>
              <option value="true">Aktif</option>
            </select>
          )
          : (
            <input
              class="pg-input"
              type={meta.tipe_nilai === 'number' ? 'number' : 'text'}
              value={value}
              onInput={e => handleChange(kunci, e.target.value)}
            />
          )
        }
        {meta.keterangan && <span class="pg-config-hint">{meta.keterangan}</span>}
      </div>
    )
  }

  return (
    <div class="pg-section">
      <div class="pg-section-toolbar">
        <span class="pg-section-info">{data.length} konfigurasi</span>
        <button
          class="pg-btn pg-btn--primary"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? 'Menyimpan…' : dirty ? '💾 Simpan Perubahan' : 'Tersimpan'}
        </button>
      </div>

      {CONFIG_GROUPS.map(group => {
        const fields = group.keys.filter(k => metaMap[k])
        if (!fields.length) return null
        return (
          <div key={group.label} class="pg-config-group">
            <h3 class="pg-config-group-title">
              <span>{group.icon}</span> {group.label}
            </h3>
            <div class="pg-config-fields">
              {fields.map(k => renderField(k))}
            </div>
          </div>
        )
      })}

      {dirty && (
        <div class="pg-unsaved-bar">
          Ada perubahan yang belum disimpan.
          <button class="pg-btn pg-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Sekarang'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PengaturanPage() {
  const [tab,          setTab]    = useState('tahun_ajaran')
  const [tahunAjaran,  setTA]     = useState([])
  const [jurusan,      setJur]    = useState([])
  const [konfigurasi,  setKfg]    = useState([])
  const [loading,      setLoad]   = useState(false)
  const [error,        setError]  = useState(null)
  const [toast,        showToast] = useToast()

  const load = useCallback(async () => {
    setLoad(true); setError(null)
    try {
      const res = await apiFetch('/admin/pengaturan')
      setTA(res.data?.tahun_ajaran ?? [])
      setJur(res.data?.jurusan     ?? [])
      setKfg(res.data?.konfigurasi ?? [])
    } catch (e) { setError(e.message) }
    finally { setLoad(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const tabs = [
    { id: 'tahun_ajaran', label: 'Tahun Ajaran', icon: '📅' },
    { id: 'jurusan',      label: 'Jurusan',       icon: '🎓' },
    { id: 'konfigurasi',  label: 'Konfigurasi',   icon: '⚙️' },
  ]

  return (
    <div class="pg-page">
      <Toast toast={toast} />

      {/* Header */}
      <div class="pg-header">
        <h1 class="pg-title">Pengaturan Sistem</h1>
        <p class="pg-sub">Manajemen tahun ajaran, jurusan, dan konfigurasi sistem</p>
      </div>

      {/* Tabs */}
      <div class="pg-tabs">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} class={`pg-tab${tab === id ? ' pg-tab--active' : ''}`}
            onClick={() => setTab(id)}>
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div class="pg-error-bar"><span>⚠</span> {error}</div>}

      {/* Loading */}
      {loading && <div class="pg-loading-bar"><div class="pg-loading-inner" /></div>}

      {/* Tab content */}
      {!loading && !error && tab === 'tahun_ajaran' && (
        <TahunAjaranTab data={tahunAjaran} onReload={load} showToast={showToast} />
      )}
      {!loading && !error && tab === 'jurusan' && (
        <JurusanTab data={jurusan} onReload={load} showToast={showToast} />
      )}
      {!loading && !error && tab === 'konfigurasi' && (
        <KonfigurasiTab data={konfigurasi} onReload={load} showToast={showToast} />
      )}
    </div>
  )
}
