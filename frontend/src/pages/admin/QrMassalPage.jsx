/**
 * QrMassalPage.jsx
 *
 * Halaman cetak QR card massal per rombel.
 * Admin pilih rombel → generate semua QR sekaligus → siap print (Ctrl+P)
 * atau download sebagai PDF via print-to-PDF browser.
 *
 * Layout: grid kartu 3 kolom, ukuran kartu ~5.4cm x 8.6cm (mirip kartu ID).
 */

import { useState, useEffect, useRef } from 'preact/hooks'
import { T } from '../../utils/lang.js'
import QRCode from 'qrcode'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token')
      || ''
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

function QrCard({ siswa }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current && siswa.qr_token) {
      QRCode.toCanvas(canvasRef.current, siswa.qr_token, {
        width: 130,
        margin: 1,
        color: { dark: '#1e293b', light: '#ffffff' },
      })
    }
  }, [siswa.qr_token])

  return (
    <div className="qr-card">
      <div className="qr-card-header">SMKS RAJASA SURABAYA</div>
      {siswa.has_qr ? (
        <canvas ref={canvasRef} />
      ) : (
        <div className="qr-card-empty">QR belum dibuat</div>
      )}
      <div className="qr-card-name">{siswa.nama_lengkap}</div>
      <div className="qr-card-nis">NIS: {siswa.nis || '-'}</div>
    </div>
  )
}

export default function QrMassalPage({ lang }) {
  const t = T[lang] || T.id
  const [rombels, setRombels]         = useState([])
  const [selectedRombel, setSelected] = useState('')
  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    apiFetch('/rombel/options').then(r => setRombels(r.data?.rombel ?? [])).catch(() => {})
  }, [])

  async function loadQr() {
    if (!selectedRombel) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch(`/siswa/qr-massal?rombel_id=${selectedRombel}`)
      setData(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <style>{`
        .qr-toolbar { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem; }
        .qr-toolbar select { padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; font-family: Poppins, sans-serif; }
        .qr-toolbar button { padding: 0.5rem 1.25rem; border-radius: 8px; border: none; background: #1e3a5f; color: #fff; font-family: Poppins, sans-serif; cursor: pointer; }
        .qr-toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
        .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .qr-card { border: 1px dashed #cbd5e1; border-radius: 10px; padding: 1rem; text-align: center; background: #fff; }
        .qr-card-header { font-size: 0.65rem; font-weight: 700; color: #1e3a5f; letter-spacing: 0.03em; margin-bottom: 0.5rem; }
        .qr-card-empty { width: 130px; height: 130px; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border-radius: 8px; color: #94a3b8; font-size: 0.75rem; }
        .qr-card-name { font-size: 0.85rem; font-weight: 600; color: #1e293b; margin-top: 0.6rem; }
        .qr-card-nis { font-size: 0.75rem; color: #64748b; }
        @media print {
          .qr-toolbar { display: none; }
          .qr-grid { grid-template-columns: repeat(3, 1fr); }
          .qr-card { break-inside: avoid; }
        }
      `}</style>

      <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#1e293b', marginBottom: '1rem' }}>
        Cetak QR Card Massal
      </h2>

      <div className="qr-toolbar">
        <select value={selectedRombel} onChange={e => setSelected(e.target.value)}>
          <option value="">-- Pilih Rombel --</option>
          {rombels.map(r => <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>)}
        </select>
        <button onClick={loadQr} disabled={!selectedRombel || loading}>
          {loading ? t.ad_memuat : 'Tampilkan QR'}
        </button>
        {data && (
          <button onClick={() => window.print()} style={{ background: '#10b981' }}>
            🖨 Print / Simpan PDF
          </button>
        )}
      </div>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {data && (
        <>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {data.rombel.label} — {data.total_siswa} siswa
            {data.siswa.filter(s => !s.has_qr).length > 0 && (
              <span style={{ color: '#f59e0b' }}>
                {' '}({data.siswa.filter(s => !s.has_qr).length} siswa belum punya QR)
              </span>
            )}
          </p>
          <div className="qr-grid">
            {data.siswa.map(s => <QrCard key={s.siswa_id} siswa={s} />)}
          </div>
        </>
      )}
    </div>
  )
}
