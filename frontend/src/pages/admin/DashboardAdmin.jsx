/**
 * DashboardAdmin.jsx
 * Main entry for admin role — keep-alive pattern
 *
 * Semua halaman di-render sekali lalu disembunyikan via display:none
 * saat tidak aktif. Data tidak di-fetch ulang setiap pindah menu.
 *
 * Branch: feature/admin-dashboard
 */

import AdminLayout from './AdminLayout'
import AdminDashboardPage from './AdminDashboardPage'
import UsersPage from './UsersPage'
import SesiPage from './SesiPage'
import AuditPage from './AuditPage'
import LaporanPage from './LaporanPage'
import AnalitikPage from './AnalitikPage'
import PengaturanPage from './PengaturanPage'

// ─── Placeholder untuk halaman belum diimplementasi ─────────────────────────

function ComingSoon({ title, desc, icon }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'60vh', gap:'1rem',
      fontFamily:'Poppins, sans-serif', textAlign:'center' }}>
      <div style={{ fontSize: 56 }}>{icon}</div>
      <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:700, color:'#1e293b' }}>{title}</h2>
      <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b', maxWidth:360 }}>{desc}</p>
      <span style={{ padding:'0.35rem 1rem', borderRadius:99, background:'#dbeafe',
        color:'#1d4ed8', fontSize:'0.75rem', fontWeight:600 }}>Dalam Pengembangan</span>
    </div>
  )
}

// ─── Daftar semua halaman ────────────────────────────────────────────────────
// Halaman ComingSoon (belum ada data) tidak perlu keep-alive — ringan saja.
// Halaman nyata (ada fetch) → selalu di-render, visibility dikontrol.

const REAL_PAGES = ['dashboard','analitik','sesi','users','laporan','audit','settings']

function PageSlot({ id, activePage, children }) {
  const isActive = activePage === id
  return (
    <div
      key={id}
      style={{
        display: isActive ? '' : 'none',
        // Pastikan slot mengisi full height container saat aktif
        minHeight: isActive ? '100%' : undefined,
      }}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

// ─── Render semua page sekaligus, sembunyikan yang tidak aktif ───────────────

function AllPages({ activePage, onNav }) {
  return (
    <>
      <PageSlot id="dashboard" activePage={activePage}>
        <AdminDashboardPage onNav={onNav} />
      </PageSlot>

      <PageSlot id="analitik" activePage={activePage}>
        <AnalitikPage />
      </PageSlot>

      {/* SesiPage punya auto-refresh 1 detik — kirim pageActive agar interval
          berhenti saat halaman disembunyikan */}
      <PageSlot id="sesi" activePage={activePage}>
        <SesiPage pageActive={activePage === 'sesi'} />
      </PageSlot>

      <PageSlot id="users" activePage={activePage}>
        <UsersPage />
      </PageSlot>

      <PageSlot id="laporan" activePage={activePage}>
        <LaporanPage />
      </PageSlot>

      <PageSlot id="audit" activePage={activePage}>
        <AuditPage />
      </PageSlot>

      <PageSlot id="settings" activePage={activePage}>
        <PengaturanPage />
      </PageSlot>

      {/* Halaman ComingSoon — tidak perlu keep-alive, render hanya saat aktif */}
      {activePage === 'e-izin' && (
        <ComingSoon title="Portal E-Izin"
          desc="Approval berjenjang izin/sakit siswa — ortu → wali kelas → BK." icon="📅" />
      )}
      {activePage === 'peringatan' && (
        <ComingSoon title="Early Warning System"
          desc="Deteksi pola bolos berulang dan notifikasi otomatis ke orang tua." icon="⚠️" />
      )}
    </>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DashboardAdmin({ user, onLogout }) {
  return (
    <AdminLayout
      user={user}
      onLogout={onLogout}
      renderPage={(page, setPage) => (
        <AllPages activePage={page} onNav={setPage} />
      )}
    />
  )
}
