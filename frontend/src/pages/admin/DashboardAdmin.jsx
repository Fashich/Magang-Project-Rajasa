import AdminLayout from './AdminLayout'
import AdminDashboardPage from './AdminDashboardPage'
import UsersPage from './UsersPage'
import SesiPage from './SesiPage'
import AuditPage from './AuditPage'
import LaporanPage from './LaporanPage'
import AnalitikPage from './AnalitikPage'
import AnalitikPrestasiPage from './AnalitikPrestasiPage'
import PengaturanPage from './PengaturanPage'
import EarlyWarningPage from './EarlyWarningPage'
import EIzinPage from './EIzinPage'
import LogbookPage from './LogbookPage'
import CommunicationHub from './CommunicationHub'

// ─── ComingSoon placeholder ───────────────────────────────────────────────────

function ComingSoon({ title, desc, icon }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 360,
      gap: 16,
      color: 'var(--al-text-secondary)',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '3rem' }}>{icon}</div>
      <h2 style={{ margin: 0, color: 'var(--al-text-primary)', fontSize: '1.25rem' }}>{title}</h2>
      <p style={{ margin: 0, maxWidth: 400, lineHeight: 1.6 }}>{desc}</p>
      <span style={{
        fontSize: '.75rem',
        background: 'var(--al-surface-elevated)',
        border: '1px solid var(--al-border)',
        borderRadius: 999,
        padding: '4px 12px',
        marginTop: 4,
      }}>🚧 Dalam pengembangan</span>
    </div>
  )
}

// ─── PageSlot — tampilkan/sembunyikan tanpa unmount ───────────────────────────

function PageSlot({ id, activePage, children }) {
  return (
    <div
      style={{
        display: activePage === id ? '' : 'none',
        minHeight: activePage === id ? '100%' : undefined,
      }}
      aria-hidden={activePage !== id}
    >
      {children}
    </div>
  )
}

// ─── Semua page di-render sekaligus, dikontrol visibility ────────────────────

function AllPages({ activePage, onNav }) {
  return (
    <>
      <PageSlot id="dashboard" activePage={activePage}>
        <AdminDashboardPage onNav={onNav} />
      </PageSlot>

      <PageSlot id="analitik" activePage={activePage}>
        <AnalitikPage />
      </PageSlot>

      <PageSlot id="analitik-prestasi" activePage={activePage}>
        <AnalitikPrestasiPage />
      </PageSlot>

      {/* SesiPage punya auto-refresh 1 detik — kirim pageActive agar
          interval berhenti saat halaman disembunyikan */}
      <PageSlot id="sesi" activePage={activePage}>
        <SesiPage pageActive={activePage === 'sesi'} />
      </PageSlot>

      <PageSlot id="peringatan" activePage={activePage}>
        <EarlyWarningPage />
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

      <PageSlot id="e-izin" activePage={activePage}>
        <EIzinPage />
      </PageSlot>

      <PageSlot id="logbook" activePage={activePage}>
        <LogbookPage />
      </PageSlot>

      <PageSlot id="communication" activePage={activePage}>
        <CommunicationHub />
      </PageSlot>
    </>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function DashboardAdmin({ user, onLogout }) {
  return (
    <AdminLayout
      user={user}
      onLogout={onLogout}
      renderPage={(activePage, setActivePage) => (
        <AllPages
          activePage={activePage}
          onNav={setActivePage}
        />
      )}
    />
  )
}
