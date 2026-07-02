/**
 * ExportButton.jsx
 *
 * Tombol untuk download laporan analitik dalam format Excel.
 * Cara pakai — tempel di dalam AnalitikPage.jsx, contoh:
 *
 *   import ExportButton from '../../components/shared/ExportButton'
 *   ...
 *   <ExportButton jenis="tren" tanggalDari={dari} tanggalSampai={sampai} />
 *
 * Tersedia jenis: 'tren' | 'distribusi' | 'per_siswa' | 'per_rombel'
 */

import { useState } from 'preact/hooks'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token')
      || ''
}

export default function ExportButton({ jenis = 'tren', tanggalDari, tanggalSampai, rombelId, label }) {
  const [downloading, setDownloading] = useState(false)

  async function handleExport() {
    setDownloading(true)
    try {
      const params = new URLSearchParams({ jenis })
      if (tanggalDari)   params.set('tanggal_dari', tanggalDari)
      if (tanggalSampai) params.set('tanggal_sampai', tanggalSampai)
      if (rombelId)      params.set('rombel_id', rombelId)

      const res = await fetch(`${API_BASE}/analitik/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal mengekspor data.')
      }

      const blob = await res.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `analitik_${jenis}_${tanggalDari ?? ''}_sd_${tanggalSampai ?? ''}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e.message || 'Gagal mengekspor data.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={downloading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0',
        background: downloading ? '#f1f5f9' : '#fff', color: '#1e3a5f',
        fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', fontWeight: 500,
        cursor: downloading ? 'not-allowed' : 'pointer',
      }}
    >
      {downloading ? 'Mengekspor…' : `⬇ ${label || 'Export Excel'}`}
    </button>
  )
}
