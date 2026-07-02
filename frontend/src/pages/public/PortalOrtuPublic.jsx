/**
 * PortalOrtuPublic.jsx
 *
 * Halaman PUBLIK untuk orang tua memantau kehadiran anak — TANPA LOGIN.
 * Diakses via link personal: https://.../portal-ortu/{token}
 * Token dikirim admin/guru ke orang tua melalui WhatsApp.
 *
 * Read-only: ringkasan 30 hari, riwayat 14 hari terakhir, riwayat e-izin.
 */

import { useState, useEffect } from 'preact/hooks'

const API = import.meta.env.VITE_API_URL || '/api'

const STATUS_LABEL = {
  hadir:     'Hadir',
  terlambat: 'Terlambat',
  alpha:     'Tidak Hadir',
  sakit:     'Sakit',
  izin:      'Izin',
}

const STATUS_COLOR = {
  hadir:     '#10b981',
  terlambat: '#f59e0b',
  alpha:     '#ef4444',
  sakit:     '#3b82f6',
  izin:      '#8b5cf6',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '1rem 1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flex: '1 1 120px', minWidth: 100,
    }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: color || '#1e293b', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>{label}</div>
    </div>
  )
}

export default function PortalOrtuPublic({ token }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch(`${API}/portal-ortu/${token}`)
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.message || 'Gagal memuat data.')
        return json
      })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            Memuat data kehadiran…
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.1rem', color: '#1e293b', margin: '0 0 0.5rem' }}>Link Tidak Valid</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>{error}</p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
              Silakan hubungi wali kelas atau pihak sekolah untuk mendapatkan link terbaru.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { siswa, ringkasan_30_hari: rk, riwayat_14_hari: riwayat, riwayat_izin: izin } = data

  return (
    <div style={wrapStyle}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', color: '#fff', padding: '1.5rem 1rem 1rem' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Portal Pemantauan Kehadiran</div>
          <h1 style={{ fontSize: '1.4rem', margin: '0.35rem 0', fontWeight: 700 }}>SMKS Rajasa Surabaya</h1>
        </div>

        {/* Profil siswa */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: '#1e3a5f',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', fontWeight: 700, flexShrink: 0,
            }}>
              {siswa.nama_lengkap?.charAt(0) ?? '?'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{siswa.nama_lengkap}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {siswa.rombel ?? '-'} · NISN {siswa.nisn}
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan 30 hari */}
        <div style={{ margin: '1rem 0 0.5rem', color: '#fff', fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
          Ringkasan 30 Hari Terakhir
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <StatCard label="Tingkat Hadir" value={`${rk.tingkat_kehadiran}%`} color="#1e3a5f" />
          <StatCard label="Hadir" value={rk.hadir} color={STATUS_COLOR.hadir} />
          <StatCard label="Terlambat" value={rk.terlambat} color={STATUS_COLOR.terlambat} />
          <StatCard label="Tanpa Ket." value={rk.alpha} color={STATUS_COLOR.alpha} />
        </div>

        {/* Riwayat harian */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '0.95rem', color: '#1e293b', margin: '0 0 0.75rem' }}>Riwayat 14 Hari Terakhir</h3>
          {riwayat.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Belum ada data kehadiran.</p>}
          {riwayat.map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.6rem 0', borderBottom: i < riwayat.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>{fmtDate(r.tanggal)}</span>
              <span style={{
                fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: 999,
                background: `${STATUS_COLOR[r.status]}18`, color: STATUS_COLOR[r.status],
              }}>
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            </div>
          ))}
        </div>

        {/* Riwayat izin */}
        {izin.length > 0 && (
          <div style={{ ...cardStyle, marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#1e293b', margin: '0 0 0.75rem' }}>Riwayat Pengajuan Izin</h3>
            {izin.map((e, i) => (
              <div key={i} style={{ padding: '0.6rem 0', borderBottom: i < izin.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{e.jenis_izin}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{fmtDate(e.tanggal_mulai)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{e.keterangan}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>Status: {e.status}</div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: '1.5rem 0' }}>
          Link ini bersifat pribadi. Mohon tidak dibagikan ke pihak lain.
        </p>
      </div>
    </div>
  )
}

const wrapStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #1e3a5f 0%, #2563eb 100%)',
  padding: '0 1rem 1rem',
  fontFamily: "'Poppins', system-ui, sans-serif",
}

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: '1.1rem 1.25rem',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
}
