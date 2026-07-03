import { useState } from 'preact/hooks'
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
import GamifikasiPage from './GamifikasiPage'

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
  // Render children hanya setelah pertama kali aktif (lazy mount)
  // Setelah mount, tetap di-render tapi disembunyikan (preserve state)
  const [hasMounted, setHasMounted] = useState(false)
  const isActive = activePage === id

  if (isActive && !hasMounted) setHasMounted(true)
  if (!hasMounted) return null

  return (
    <div
      style={{
        display: isActive ? '' : 'none',
        minHeight: isActive ? '100%' : undefined,
      }}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

// ─── Semua page di-render sekaligus, dikontrol visibility ────────────────────

function AllPages({ activePage, onNav, lang }) {
  return (
    <>
      <PageSlot id="dashboard" activePage={activePage}>
        <AdminDashboardPage onNav={onNav} lang={lang} />
      </PageSlot>

      <PageSlot id="analitik" activePage={activePage}>
        <AnalitikPage lang={lang} />
      </PageSlot>

      <PageSlot id="analitik-prestasi" activePage={activePage}>
        <AnalitikPrestasiPage lang={lang} />
      </PageSlot>

      <PageSlot id="sesi" activePage={activePage}>
        <SesiPage pageActive={activePage === 'sesi'} lang={lang} />
      </PageSlot>

      <PageSlot id="peringatan" activePage={activePage}>
        <EarlyWarningPage lang={lang} />
      </PageSlot>

      <PageSlot id="users" activePage={activePage}>
        <UsersPage lang={lang} />
      </PageSlot>

      <PageSlot id="laporan" activePage={activePage}>
        <LaporanPage lang={lang} />
      </PageSlot>

      <PageSlot id="audit" activePage={activePage}>
        <AuditPage lang={lang} />
      </PageSlot>

      <PageSlot id="settings" activePage={activePage}>
        <PengaturanPage lang={lang} />
      </PageSlot>

      <PageSlot id="e-izin" activePage={activePage}>
        <EIzinPage lang={lang} />
      </PageSlot>

      <PageSlot id="logbook" activePage={activePage}>
        <LogbookPage lang={lang} />
      </PageSlot>

      <PageSlot id="communication" activePage={activePage}>
        <CommunicationHub lang={lang} />
      </PageSlot>

      <PageSlot id="gamifikasi" activePage={activePage}>
        <GamifikasiPage lang={lang} />
      </PageSlot>
    </>
  )
}

export default function DashboardAdmin({ user, onLogout }) {
  return (
    <AdminLayout
      user={user}
      onLogout={onLogout}
      renderPage={(activePage, setActivePage, lang) => (
        <AllPages
          activePage={activePage}
          onNav={setActivePage}
          lang={lang}
        />
      )}
    />
  )
}
