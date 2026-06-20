/**
 * DashboardAdmin.jsx
 * Main entry for admin role — wires AdminLayout with all page components
 * Branch: feature/admin-dashboard
 */

import { useCallback } from 'preact/hooks'
import AdminLayout from './AdminLayout'
import AdminDashboardPage from './AdminDashboardPage'

// ─── Placeholder for pages not yet implemented ────────────────────────────────
function ComingSoon({ title, desc, icon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}>
      <div style={{ fontSize: 56 }}>{icon}</div>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', maxWidth: 360 }}>{desc}</p>
      <span style={{ padding: '0.35rem 1rem', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600 }}>
        Dalam Pengembangan
      </span>
    </div>
  )
}

function resolvePage(page, setPage) {
  switch (page) {
    case 'dashboard':  return <AdminDashboardPage onNav={setPage} />
    case 'analitik':   return <ComingSoon title="Analitik Kehadiran"   desc="Visualisasi tren, korelasi prestasi, laporan mendalam per rombel." icon="📈" />
    case 'sesi':       return <ComingSoon title="Sesi Presensi"        desc="Monitor dan kelola semua sesi presensi aktif di seluruh sekolah." icon="📋" />
    case 'e-izin':     return <ComingSoon title="Portal E-Izin"        desc="Approval berjenjang izin/sakit siswa — ortu → wali kelas → BK." icon="📅" />
    case 'peringatan': return <ComingSoon title="Early Warning System"  desc="Deteksi pola bolos berulang dan notifikasi otomatis ke orang tua." icon="⚠️" />
    case 'users':      return <ComingSoon title="Manajemen Pengguna"    desc="Kelola akun siswa, guru, staff, dan orang tua." icon="👥" />
    case 'laporan':    return <ComingSoon title="Laporan & Export"      desc="Generate laporan akreditasi PDF/Excel." icon="📊" />
    case 'audit':      return <ComingSoon title="Audit Trail"           desc="Log aktivitas lengkap per pengguna." icon="🔍" />
    case 'settings':   return <ComingSoon title="Pengaturan Sistem"     desc="Konfigurasi sekolah, periode akademik, parameter sistem." icon="⚙️" />
    default:           return null
  }
}

export default function DashboardAdmin({ user, onLogout }) {
  return (
    <AdminLayout
      user={user}
      onLogout={onLogout}
      renderPage={(page, setPage) => resolvePage(page, setPage)}
    />
  )
}
