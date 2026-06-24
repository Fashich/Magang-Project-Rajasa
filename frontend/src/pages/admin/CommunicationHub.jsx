/**
 * CommunicationHub.jsx
 * Communication Hub — sistem tiket siswa ↔ guru ↔ admin
 *
 * Komponen ini SHARED — bisa dipakai di:
 *   - DashboardAdmin   → import CommunicationHub from './CommunicationHub'
 *   - DashboardGuru    → import CommunicationHub from '../admin/CommunicationHub'
 *   - DashboardSiswa   → import CommunicationHub from '../admin/CommunicationHub'
 *
 * Behavior otomatis menyesuaikan role dari localStorage user_type.
 *
 * @author feature/communication-hub
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import './CommunicationHub.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token') || ''
}

function getUser() {
  try {
    const raw = localStorage.getItem('presensi_lab_rajasa:auth_user')
             || localStorage.getItem('user_data')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
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

function fmtDatetime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtRelative(d) {
  if (!d) return '—'
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  return `${Math.floor(h / 24)} hari lalu`
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CLR = {
  open:        '#3b82f6',
  in_progress: '#8b5cf6',
  waiting:     '#f59e0b',
  resolved:    '#10b981',
  closed:      '#64748b',
}

const STATUS_LBL = {
  open:        'Open',
  in_progress: 'Diproses',
  waiting:     'Menunggu',
  resolved:    'Selesai',
  closed:      'Ditutup',
}

const KATEGORI_LBL = {
  pertanyaan:      '❓ Pertanyaan',
  keluhan:         '😤 Keluhan',
  izin_khusus:     '📋 Izin Khusus',
  konsultasi:      '💬 Konsultasi',
  laporan_masalah: '🐛 Laporan Masalah',
  lainnya:         '📌 Lainnya',
}

const PRIORITAS_CLR = {
  rendah:  '#94a3b8',
  normal:  '#64748b',
  tinggi:  '#f59e0b',
  urgent:  '#dc2626',
}

// ── Modal Buat Tiket ──────────────────────────────────────────────────────────

function ModalBuatTiket({ onClose, onSaved }) {
  const [form, setForm] = useState({
    judul:    '',
    pesan:    '',
    kategori: 'pertanyaan',
    prioritas:'normal',
  })
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    setErr('')
    if (form.judul.trim().length < 5) { setErr('Judul minimal 5 karakter.'); return }
    if (form.pesan.trim().length < 10) { setErr('Pesan minimal 10 karakter.'); return }
    setLoading(true)
    try {
      await apiFetch('/tiket', { method: 'POST', body: JSON.stringify(form) })
      onSaved()
      onClose()
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div class="ch-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="ch-modal">
        <div class="ch-modal-header">
          <h3 class="ch-modal-title">📩 Buat Tiket Baru</h3>
          <button class="ch-modal-close" onClick={onClose}>✕</button>
        </div>
        <div class="ch-modal-body">
          {err && (
            <div class="ch-alert ch-alert-error">{err}</div>
          )}

          <div class="ch-field">
            <label>Judul <span class="ch-req">*</span></label>
            <input type="text" placeholder="Ringkasan singkat masalah/pertanyaan..."
              maxLength={200} value={form.judul}
              onInput={e => setF('judul', e.target.value)} />
          </div>

          <div class="ch-field-row">
            <div class="ch-field">
              <label>Kategori</label>
              <select value={form.kategori} onChange={e => setF('kategori', e.target.value)}>
                {Object.entries(KATEGORI_LBL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div class="ch-field">
              <label>Prioritas</label>
              <select value={form.prioritas} onChange={e => setF('prioritas', e.target.value)}>
                <option value="rendah">🔵 Rendah</option>
                <option value="normal">⚪ Normal</option>
                <option value="tinggi">🟡 Tinggi</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          <div class="ch-field">
            <label>Pesan / Deskripsi <span class="ch-req">*</span></label>
            <textarea rows={6}
              placeholder="Jelaskan pertanyaan atau masalah Anda secara detail..."
              value={form.pesan}
              onInput={e => setF('pesan', e.target.value)} />
          </div>
        </div>
        <div class="ch-modal-footer">
          <button class="ch-btn-ghost" onClick={onClose} disabled={loading}>Batal</button>
          <button class="ch-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Mengirim…' : '📤 Kirim Tiket'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Panel Detail + Chat ───────────────────────────────────────────────────────

function PanelDetail({ tiket, user, userType, onClose, onUpdated }) {
  const [balasan,  setBalasan]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [pesan,    setPesan]    = useState('')
  const [internal, setInternal] = useState(false)
  const [sending,  setSending]  = useState(false)
  const [err,      setErr]      = useState('')
  const bottomRef = useRef(null)

  const isGuru  = ['guru','staff','admin','super_admin'].includes(userType)
  const canReply = !['resolved','closed'].includes(tiket.status)

  const loadBalasan = useCallback(async () => {
    try {
      const res = await apiFetch(`/tiket/${tiket.tiket_id}`)
      setBalasan(res.data?.balasan ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tiket.tiket_id])

  useEffect(() => { loadBalasan() }, [loadBalasan])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [balasan])

  async function handleSend() {
    if (!pesan.trim()) return
    setErr(''); setSending(true)
    try {
      await apiFetch(`/tiket/${tiket.tiket_id}/balas`, {
        method: 'POST',
        body: JSON.stringify({ pesan: pesan.trim(), is_internal: internal }),
      })
      setPesan('')
      setInternal(false)
      await loadBalasan()
      onUpdated()
    } catch (e) { setErr(e.message) }
    finally { setSending(false) }
  }

  async function handleStatusChange(newStatus) {
    try {
      await apiFetch(`/tiket/${tiket.tiket_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      onUpdated()
      if (['resolved','closed'].includes(newStatus)) onClose()
    } catch (e) { alert(e.message) }
  }

  return (
    <div class="ch-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="ch-modal ch-modal-wide">
        {/* Header */}
        <div class="ch-modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span class="ch-badge" style={{ background: STATUS_CLR[tiket.status] }}>
                {STATUS_LBL[tiket.status]}
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: PRIORITAS_CLR[tiket.prioritas],
              }}>
                ● {tiket.prioritas.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ch-text-muted)' }}>
                #{tiket.tiket_id}
              </span>
            </div>
            <h3 class="ch-modal-title" style={{ margin: 0 }}>{tiket.judul}</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--ch-text-muted)' }}>
              {KATEGORI_LBL[tiket.kategori]} · {tiket.username_dari} · {fmtDatetime(tiket.created_at)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
            {isGuru && tiket.status === 'open' && (
              <button class="ch-btn-ghost" style={{ fontSize: '0.75rem' }}
                onClick={() => handleStatusChange('in_progress')}>
                ▶ Proses
              </button>
            )}
            {isGuru && ['open','in_progress','waiting'].includes(tiket.status) && (
              <button class="ch-btn-ghost" style={{ fontSize: '0.75rem', color: '#15803d', borderColor: '#15803d' }}
                onClick={() => handleStatusChange('resolved')}>
                ✅ Selesaikan
              </button>
            )}
            {!isGuru && tiket.is_own && tiket.status === 'open' && (
              <button class="ch-btn-ghost" style={{ fontSize: '0.75rem' }}
                onClick={() => handleStatusChange('closed')}>
                Tutup Tiket
              </button>
            )}
            <button class="ch-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Pesan awal */}
        <div style={{
          padding: '1rem 1.5rem',
          background: 'var(--ch-bg)',
          borderBottom: '1px solid var(--ch-border)',
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {tiket.pesan}
          </p>
        </div>

        {/* Chat balasan */}
        <div class="ch-chat-area">
          {loading ? (
            <div class="ch-loading">Memuat percakapan…</div>
          ) : balasan.length === 0 ? (
            <div class="ch-empty-chat">Belum ada balasan. Mulai percakapan di bawah.</div>
          ) : (
            balasan.map(b => (
              <div key={b.balasan_id}
                class={`ch-bubble ${b.is_own ? 'ch-bubble-own' : 'ch-bubble-other'}${b.is_internal ? ' ch-bubble-internal' : ''}`}>
                <div class="ch-bubble-meta">
                  <span class="ch-bubble-username">{b.username}</span>
                  {b.is_internal && <span class="ch-bubble-internal-tag">📌 Catatan Internal</span>}
                  <span class="ch-bubble-time">{fmtRelative(b.created_at)}</span>
                </div>
                <div class="ch-bubble-text">{b.pesan}</div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input balas */}
        {canReply && (
          <div class="ch-reply-area">
            {err && <div class="ch-alert ch-alert-error" style={{ margin: '0 0 0.5rem' }}>{err}</div>}
            <textarea
              class="ch-reply-input"
              rows={3}
              placeholder="Tulis balasan..."
              value={pesan}
              onInput={e => setPesan(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend()
              }}
            />
            <div class="ch-reply-footer">
              {isGuru && (
                <label class="ch-checkbox-label">
                  <input type="checkbox" checked={internal}
                    onChange={e => setInternal(e.target.checked)} />
                  <span>Catatan internal (tidak terlihat siswa)</span>
                </label>
              )}
              <button class="ch-btn-primary" onClick={handleSend} disabled={sending || !pesan.trim()}>
                {sending ? '…' : '↩ Kirim'} <span style={{ fontSize: '0.7rem' }}>(Ctrl+Enter)</span>
              </button>
            </div>
          </div>
        )}

        {!canReply && (
          <div style={{
            padding: '0.875rem 1.5rem',
            background: 'var(--ch-bg)',
            borderTop: '1px solid var(--ch-border)',
            fontSize: '0.8125rem',
            color: 'var(--ch-text-muted)',
            textAlign: 'center',
          }}>
            Tiket ini sudah ditutup. Buat tiket baru jika masih ada pertanyaan.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommunicationHub() {
  const user     = getUser()
  const userType = user?.user_type ?? 'siswa'
  const isSiswa  = userType === 'siswa'

  const [items,     setItems]     = useState([])
  const [summary,   setSummary]   = useState({})
  const [loading,   setLoading]   = useState(true)
  const [showBuat,  setShowBuat]  = useState(false)
  const [detail,    setDetail]    = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKat,    setFilterKat]    = useState('')
  const [search,    setSearch]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '50' })
      if (filterStatus) params.set('status', filterStatus)
      if (filterKat)    params.set('kategori', filterKat)
      if (search)       params.set('search', search)
      const res = await apiFetch(`/tiket?${params}`)
      setItems(res.data?.items   ?? [])
      setSummary(res.data?.summary ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filterStatus, filterKat, search])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('Yakin hapus tiket ini?')) return
    try {
      await apiFetch(`/tiket/${id}`, { method: 'DELETE' })
      await load()
    } catch (e) { alert(e.message) }
  }

  return (
    <div class="ch-page">
      {/* Header */}
      <div class="ch-page-header">
        <div>
          <h1 class="ch-page-title">Communication Hub</h1>
          <p class="ch-page-sub">
            {isSiswa
              ? 'Kirim pertanyaan, keluhan, atau izin khusus ke guru/admin'
              : 'Kelola tiket komunikasi dari siswa'}
          </p>
        </div>
        <button class="ch-btn-primary" onClick={() => setShowBuat(true)}>
          + Buat Tiket
        </button>
      </div>

      {/* Summary pills */}
      <div class="ch-summary-row">
        {[
          { key: 'open',        label: 'Open',      color: STATUS_CLR.open },
          { key: 'in_progress', label: 'Diproses',  color: STATUS_CLR.in_progress },
          { key: 'waiting',     label: 'Menunggu',  color: STATUS_CLR.waiting },
          { key: 'selesai',     label: 'Selesai',   color: STATUS_CLR.resolved },
        ].map(s => (
          <div key={s.key} class="ch-summary-card" style={{ '--sc': s.color }}>
            <div class="ch-summary-value">{summary[s.key] ?? 0}</div>
            <div class="ch-summary-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div class="ch-filter-bar">
        <input
          placeholder="🔍 Cari judul tiket..."
          value={search}
          onInput={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LBL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterKat} onChange={e => setFilterKat(e.target.value)}>
          <option value="">Semua Kategori</option>
          {Object.entries(KATEGORI_LBL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button class="ch-btn-ghost" onClick={load}>↺ Refresh</button>
      </div>

      {/* List tiket */}
      <div class="ch-tiket-list">
        {loading ? (
          <div class="ch-loading">Memuat tiket…</div>
        ) : items.length === 0 ? (
          <div class="ch-empty">
            <div class="ch-empty-icon">💬</div>
            <p>
              {filterStatus || filterKat || search
                ? 'Tidak ada tiket yang cocok dengan filter ini.'
                : isSiswa
                  ? 'Belum ada tiket. Klik "+ Buat Tiket" untuk memulai.'
                  : 'Tidak ada tiket masuk saat ini.'}
            </p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.tiket_id} class="ch-tiket-card"
              onClick={() => setDetail(item)}>

              {/* Baris atas: status + prioritas + waktu */}
              <div class="ch-tiket-card-top">
                <span class="ch-badge" style={{ background: STATUS_CLR[item.status] }}>
                  {STATUS_LBL[item.status]}
                </span>
                <span class="ch-badge ch-badge-flat"
                  style={{ color: PRIORITAS_CLR[item.prioritas] }}>
                  ● {item.prioritas}
                </span>
                <span class="ch-kategori-tag">{KATEGORI_LBL[item.kategori]}</span>
                <span class="ch-tiket-time">{fmtRelative(item.last_reply_at)}</span>
              </div>

              {/* Judul */}
              <div class="ch-tiket-judul">
                #{item.tiket_id} {item.judul}
              </div>

              {/* Meta bawah */}
              <div class="ch-tiket-meta">
                <span>👤 {item.username_dari}</span>
                {item.username_kepada && (
                  <span>→ {item.username_kepada}</span>
                )}
                <span>💬 {item.reply_count} balasan</span>
              </div>

              {/* Tombol delete (untuk pemilik + open, atau admin) */}
              {(item.is_own && item.status === 'open') ||
               ['admin','super_admin'].includes(userType) ? (
                <button
                  class="ch-delete-btn"
                  onClick={e => { e.stopPropagation(); handleDelete(item.tiket_id) }}
                  title="Hapus tiket"
                >
                  🗑
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showBuat && (
        <ModalBuatTiket
          onClose={() => setShowBuat(false)}
          onSaved={() => { setShowBuat(false); load() }}
        />
      )}

      {detail && (
        <PanelDetail
          tiket={detail}
          user={user}
          userType={userType}
          onClose={() => { setDetail(null); load() }}
          onUpdated={() => load()}
        />
      )}
    </div>
  )
}
