/**
 * OrtuLinkButton.jsx
 *
 * Tombol di halaman detail siswa (admin) untuk mendapatkan link Portal
 * Orang Tua dan langsung membagikannya via WhatsApp.
 *
 * Cara pakai — tempel di baris aksi tabel siswa atau modal detail siswa:
 *
 *   import OrtuLinkButton from '../../components/shared/OrtuLinkButton'
 *   ...
 *   <OrtuLinkButton siswaId={siswa.siswa_id} noTelpWali={siswa.no_telp_wali} />
 */

import { useState } from 'preact/hooks'

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

export default function OrtuLinkButton({ siswaId, noTelpWali }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  async function getLink(regenerate = false) {
    setLoading(true)
    try {
      const path = regenerate
        ? `/admin/siswa/${siswaId}/portal-ortu-link/regenerate`
        : `/admin/siswa/${siswaId}/portal-ortu-link`
      const res = await apiFetch(path, { method: regenerate ? 'POST' : 'GET' })
      return res.data
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyLink() {
    try {
      const { link } = await getLink(false)
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      alert(e.message || 'Gagal mengambil link.')
    }
  }

  async function handleShareWa() {
    try {
      const { wa_share_text } = await getLink(false)
      const phone = (noTelpWali || '').replace(/\D/g, '').replace(/^0/, '62')
      const waUrl = phone
        ? `https://wa.me/${phone}?text=${wa_share_text}`
        : `https://wa.me/?text=${wa_share_text}`
      window.open(waUrl, '_blank')
    } catch (e) {
      alert(e.message || 'Gagal membuat link WhatsApp.')
    }
  }

  return (
    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
      <button
        type="button"
        onClick={handleCopyLink}
        disabled={loading}
        title="Salin link portal orang tua"
        style={btnStyle}
      >
        {copied ? '✓ Tersalin' : '🔗 Salin Link'}
      </button>
      <button
        type="button"
        onClick={handleShareWa}
        disabled={loading}
        title="Kirim via WhatsApp"
        style={{ ...btnStyle, background: '#25d366', color: '#fff', border: 'none' }}
      >
        💬 Kirim WA
      </button>
    </div>
  )
}

const btnStyle = {
  padding: '0.35rem 0.7rem',
  borderRadius: 6,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#1e3a5f',
  fontFamily: 'Poppins, sans-serif',
  fontSize: '0.78rem',
  cursor: 'pointer',
}
