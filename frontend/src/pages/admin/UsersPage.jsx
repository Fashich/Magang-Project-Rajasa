/**
 * UsersPage.jsx
 * Halaman Manajemen Pengguna (admin)
 * Branch: feature/admin-dashboard
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import './UsersPage.css'

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

const USER_TYPE_LABELS = {
  siswa:      'Siswa',
  guru:       'Guru',
  staff:      'Staff',
  admin:      'Admin',
  super_admin:'Super Admin',
  intern:     'Intern',
}

const STATUS_LABELS = {
  aktif:     'Aktif',
  nonaktif:  'Nonaktif',
  suspended: 'Suspended',
}

const INITIAL_FORM = {
  username: '',
  email: '',
  password: '',
  user_type: 'guru',
  status: 'aktif',
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cls = {
    aktif:     'users-badge users-badge--aktif',
    nonaktif:  'users-badge users-badge--nonaktif',
    suspended: 'users-badge users-badge--suspended',
  }[status] ?? 'users-badge'
  return <span className={cls}>{STATUS_LABELS[status] ?? status}</span>
}

function TypeBadge({ type }) {
  return <span className="users-badge users-badge--type">{USER_TYPE_LABELS[type] ?? type}</span>
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel, danger }) {
  return (
    <div className="users-overlay" onClick={onCancel}>
      <div className="users-modal users-modal--sm" onClick={e => e.stopPropagation()}>
        <p className="users-confirm-msg">{message}</p>
        <div className="users-modal-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onCancel}>Batal</button>
          <button
            type="button"
            className={`users-btn ${danger ? 'users-btn--danger' : 'users-btn--primary'}`}
            onClick={onConfirm}
          >
            {danger ? 'Hapus' : 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Reset Password modal ───────────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return }
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/users/${user.user_id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: password }),
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
      <div className="users-modal" onClick={e => e.stopPropagation()}>
        <div className="users-modal-header">
          <h3>Reset Password — {user.username}</h3>
          <button type="button" className="users-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="users-modal-body">
          {error && <div className="users-alert users-alert--error">{error}</div>}
          <label className="users-label">Password Baru</label>
          <input
            className="users-input"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onInput={e => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <div className="users-modal-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="users-btn users-btn--primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Menyimpan…' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create / Edit modal ────────────────────────────────────────────────────────

function UserFormModal({ user, onClose, onSuccess }) {
  const isEdit = !!user
  const [form, setForm]     = useState(isEdit
    ? { email: user.email ?? '', user_type: user.user_type, status: user.status }
    : { ...INITIAL_FORM }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isEdit) {
        await apiFetch(`/users/${user.user_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ email: form.email, user_type: form.user_type, status: form.status }),
        })
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
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
      <div className="users-modal" onClick={e => e.stopPropagation()}>
        <div className="users-modal-header">
          <h3>{isEdit ? `Edit — ${user.username}` : 'Tambah Pengguna'}</h3>
          <button type="button" className="users-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="users-modal-body">
          {error && <div className="users-alert users-alert--error">{error}</div>}

          {!isEdit && (
            <>
              <label className="users-label">Username <span className="users-required">*</span></label>
              <input
                className="users-input"
                type="text"
                placeholder="username"
                value={form.username}
                onInput={e => set('username', e.target.value)}
                autoFocus
              />
            </>
          )}

          <label className="users-label">Email</label>
          <input
            className="users-input"
            type="email"
            placeholder="email@sekolah.sch.id"
            value={form.email}
            onInput={e => set('email', e.target.value)}
          />

          <label className="users-label">Tipe Pengguna <span className="users-required">*</span></label>
          <select className="users-select" value={form.user_type} onChange={e => set('user_type', e.target.value)}>
            {Object.entries(USER_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <label className="users-label">Status</label>
          <select className="users-select" value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          {!isEdit && (
            <>
              <label className="users-label">Password <span className="users-required">*</span></label>
              <input
                className="users-input"
                type="password"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onInput={e => set('password', e.target.value)}
              />
            </>
          )}
        </div>
        <div className="users-modal-actions">
          <button type="button" className="users-btn users-btn--ghost" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="users-btn users-btn--primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Menyimpan…' : (isEdit ? 'Simpan Perubahan' : 'Buat Pengguna')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]       = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  // filters
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('')
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]         = useState(1)

  // modals
  const [showCreate, setShowCreate]         = useState(false)
  const [editUser, setEditUser]             = useState(null)
  const [resetUser, setResetUser]           = useState(null)
  const [deleteTarget, setDeleteTarget]     = useState(null)
  const [toast, setToast]                   = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page })
      if (search)       params.set('search',    search)
      if (typeFilter)   params.set('user_type', typeFilter)
      if (statusFilter) params.set('status',    statusFilter)

      const res = await apiFetch(`/users?${params}`)
      setUsers(res.data.data)
      setMeta(res.data.meta)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // reset page saat filter berubah
  useEffect(() => { setPage(1) }, [search, typeFilter, statusFilter])

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await apiFetch(`/users/${deleteTarget.user_id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      showToast('Pengguna berhasil dihapus.')
      fetchUsers()
    } catch (err) {
      showToast(err.message, 'error')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="users-page">

      {/* Toast */}
      {toast && (
        <div className={`users-toast users-toast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="users-page-header">
        <div>
          <h2 className="users-page-title">Manajemen Pengguna</h2>
          <p className="users-page-sub">
            {meta ? `${meta.total} pengguna terdaftar` : 'Memuat…'}
          </p>
        </div>
        <button
          type="button"
          className="users-btn users-btn--primary"
          onClick={() => setShowCreate(true)}
        >
          + Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <input
          className="users-input users-search"
          type="search"
          placeholder="Cari username / email…"
          value={search}
          onInput={e => setSearch(e.target.value)}
        />
        <select className="users-select" value={typeFilter} onChange={e => setType(e.target.value)}>
          <option value="">Semua Tipe</option>
          {Object.entries(USER_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select className="users-select" value={statusFilter} onChange={e => setStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && <div className="users-alert users-alert--error">{error}</div>}

      {/* Table */}
      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Login Terakhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="users-td-center">Memuat…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={7} className="users-td-center users-td-empty">Tidak ada data.</td></tr>
            )}
            {!loading && users.map((u, i) => (
              <tr key={u.user_id}>
                <td className="users-td-num">{((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? 15) + i + 1}</td>
                <td className="users-td-bold">{u.username}</td>
                <td className="users-td-muted">{u.email ?? '—'}</td>
                <td><TypeBadge type={u.user_type} /></td>
                <td><StatusBadge status={u.status} /></td>
                <td className="users-td-muted">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('id-ID') : '—'}</td>
                <td>
                  <div className="users-actions">
                    <button type="button" className="users-btn-icon" title="Edit" onClick={() => setEditUser(u)}>✏️</button>
                    <button type="button" className="users-btn-icon" title="Reset Password" onClick={() => setResetUser(u)}>🔑</button>
                    <button type="button" className="users-btn-icon users-btn-icon--danger" title="Hapus" onClick={() => setDeleteTarget(u)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="users-pagination">
          <button
            type="button"
            className="users-btn users-btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Sebelumnya
          </button>
          <span className="users-page-info">
            Halaman {meta.current_page} / {meta.last_page}
          </span>
          <button
            type="button"
            className="users-btn users-btn--ghost"
            disabled={page >= meta.last_page}
            onClick={() => setPage(p => p + 1)}
          >
            Berikutnya →
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <UserFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { showToast('Pengguna berhasil dibuat.'); fetchUsers() }}
        />
      )}
      {editUser && (
        <UserFormModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => { showToast('Pengguna berhasil diperbarui.'); fetchUsers() }}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSuccess={() => showToast('Password berhasil direset.')}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`Hapus pengguna "${deleteTarget.username}"? Tindakan ini tidak bisa dibatalkan.`}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
