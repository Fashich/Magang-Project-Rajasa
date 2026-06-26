/**
 * NotifikasiBell.jsx — Shared Notification Bell Component
 * Dipakai di AdminLayout, GuruLayout, SiswaLayout
 *
 * - Poll unread count setiap 30 detik
 * - Dropdown list notifikasi saat bell diklik
 * - Mark read saat notif diklik
 * - Mark all read button
 *
 * @author feature/prd-5-notification
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'

const API = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
    || localStorage.getItem('auth_token')
    || ''
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

// Ikon & warna per tipe
const TIPE_ICON  = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }
const TIPE_COLOR = {
  info:    'var(--rjs-info,    #0284c7)',
  success: 'var(--rjs-success, #15803d)',
  warning: 'var(--rjs-warning, #d97706)',
  error:   'var(--rjs-danger,  #dc2626)',
}
const TIPE_BG = {
  info:    'var(--rjs-info-bg,    #e0f2fe)',
  success: 'var(--rjs-success-bg, #dcfce7)',
  warning: 'var(--rjs-warning-bg, #fef3c7)',
  error:   'var(--rjs-danger-bg,  #fee2e2)',
}

// SVG bell icon
const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4
             c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
  </svg>
)

export default function NotifikasiBell({ btnClassName = '', btnStyle = {} }) {
  const [open,        setOpen]        = useState(false)
  const [unread,      setUnread]      = useState(0)
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [markingAll,  setMarkingAll]  = useState(false)
  const panelRef = useRef(null)
  const btnRef   = useRef(null)

  // ── Fetch unread count (untuk badge) ─────────────────────────────────────
  const fetchUnread = useCallback(async () => {
    try {
      const res = await apiFetch('/notifikasi?per_page=1&is_read=0')
      setUnread(res.data?.unread_count ?? 0)
    } catch { /* silent */ }
  }, [])

  // ── Fetch full list (saat dropdown dibuka) ───────────────────────────────
  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/notifikasi?per_page=20&page=1')
      setItems(res.data?.data ?? [])
      setUnread(res.data?.unread_count ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  // ── Poll unread setiap 30 detik ──────────────────────────────────────────
  useEffect(() => {
    fetchUnread()
    const id = setInterval(fetchUnread, 30_000)
    return () => clearInterval(id)
  }, [fetchUnread])

  // ── Tutup panel saat klik di luar ────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function toggleOpen() {
    if (!open) fetchItems()
    setOpen(o => !o)
  }

  // ── Mark single as read ──────────────────────────────────────────────────
  async function markRead(id) {
    try {
      const res = await apiFetch(`/notifikasi/${id}/read`, { method: 'PATCH' })
      setUnread(res.data?.unread_count ?? 0)
      setItems(prev => prev.map(n =>
        n.notifikasi_id === id ? { ...n, is_read: true } : n
      ))
    } catch { /* silent */ }
  }

  // ── Mark all as read ─────────────────────────────────────────────────────
  async function markAllRead() {
    setMarkingAll(true)
    try {
      await apiFetch('/notifikasi/read-all', { method: 'POST' })
      setUnread(0)
      setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch { /* silent */ }
    finally { setMarkingAll(false) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        aria-label={`Notifikasi${unread > 0 ? ` (${unread} belum dibaca)` : ''}`}
        className={btnClassName}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...btnStyle,
        }}
      >
        <BellIcon />
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: -4, right: -4,
            minWidth: 16, height: 16,
            background: 'var(--rjs-danger, #dc2626)',
            color: '#fff',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            border: '2px solid var(--rjs-surface, #fff)',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 340,
            maxHeight: 480,
            background: 'var(--rjs-surface, #fff)',
            border: '1px solid var(--rjs-border, #e2e8f0)',
            borderRadius: 'var(--rjs-radius, 12px)',
            boxShadow: 'var(--rjs-shadow-lg, 0 8px 32px rgba(0,0,0,.15))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 999,
            animation: 'notifFadeIn .15s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid var(--rjs-border, #e2e8f0)',
            flexShrink: 0,
          }}>
            <span style={{
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--rjs-text, #0f172a)',
            }}>
              🔔 Notifikasi {unread > 0 && (
                <span style={{
                  background: 'var(--rjs-danger, #dc2626)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 10,
                  padding: '1px 6px',
                  marginLeft: 4,
                }}>
                  {unread}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                style={{
                  fontSize: 11,
                  color: 'var(--rjs-info, #0284c7)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: 'inherit',
                }}
              >
                {markingAll ? '...' : 'Tandai semua dibaca'}
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--rjs-text-muted, #64748b)',
                fontSize: 13,
              }}>
                ⏳ Memuat...
              </div>
            )}

            {!loading && items.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: 'var(--rjs-text-muted, #64748b)',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔕</div>
                <p style={{ fontSize: 13, margin: 0 }}>Tidak ada notifikasi</p>
              </div>
            )}

            {!loading && items.map(item => (
              <div
                key={item.notifikasi_id}
                onClick={() => !item.is_read && markRead(item.notifikasi_id)}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '11px 14px',
                  borderBottom: '1px solid var(--rjs-border-light, #f1f5f9)',
                  cursor: item.is_read ? 'default' : 'pointer',
                  background: item.is_read
                    ? 'transparent'
                    : 'var(--rjs-surface-alt, #f8fafc)',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => {
                  if (!item.is_read)
                    e.currentTarget.style.background = 'var(--rjs-border-light, #f1f5f9)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = item.is_read
                    ? 'transparent' : 'var(--rjs-surface-alt, #f8fafc)'
                }}
              >
                {/* Type icon */}
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: TIPE_BG[item.tipe] ?? '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  {TIPE_ICON[item.tipe] ?? 'ℹ️'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: item.is_read ? 500 : 700,
                    color: 'var(--rjs-text, #0f172a)',
                    marginBottom: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.judul}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--rjs-text-muted, #475569)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {item.pesan}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--rjs-text-subtle, #94a3b8)',
                    marginTop: 3,
                  }}>
                    {item.time_ago}
                  </div>
                </div>

                {/* Unread dot */}
                {!item.is_read && (
                  <div style={{
                    width: 7, height: 7,
                    borderRadius: '50%',
                    background: TIPE_COLOR[item.tipe] ?? 'var(--rjs-info, #0284c7)',
                    flexShrink: 0,
                    alignSelf: 'center',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--rjs-border, #e2e8f0)',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                fontSize: 11,
                color: 'var(--rjs-text-subtle, #94a3b8)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Animasi */}
      <style>{`
        @keyframes notifFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }
      `}</style>
    </div>
  )
}
