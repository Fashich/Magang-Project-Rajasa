/**
 * DashboardSiswa.jsx — revisi
 *
 * Memakai SiswaLayout baru (sidebar tunggal) dengan 5 halaman:
 *   dashboard → PresensiCounter (ringkasan kehadiran)
 *   rekap     → TablePresensi  (tabel detail)
 *   kalender  → KalenderAkademik
 *   izin      → EIzinSiswa     (ajukan & lihat status izin)
 *   logbook   → LogbookSiswa   (isi & lihat logbook PKL)
 *
 * @author development
 */

import SiswaLayout from '../../components/siswa/SiswaLayout'
import PresensiCounter from '../../components/siswa/PresensiCounter'
import KalenderAkademik from '../../components/siswa/KalenderAkademik'
import TablePresensi from '../../components/siswa/TablePresensi'
import EIzinSiswa from './EIzinSiswa'
import LogbookSiswa from './LogbookSiswa'
import CommunicationHub from '../admin/CommunicationHub'
import GamifikasiPage from '../admin/GamifikasiPage'

// ── Page resolver ─────────────────────────────────────────────────────────────

function resolveContent(activePage, lang) {
  switch (activePage) {
    case 'dashboard': return <PresensiCounter lang={lang} />
    case 'rekap':     return <TablePresensi lang={lang} />
    case 'kalender':  return <KalenderAkademik lang={lang} />
    case 'izin':      return <EIzinSiswa lang={lang} />
    case 'logbook':        return <LogbookSiswa lang={lang} />
    case 'communication':  return <CommunicationHub lang={lang} />
    case 'gamifikasi':     return <GamifikasiPage lang={lang} />
    default:          return <PresensiCounter lang={lang} />
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DashboardSiswa({ user, onLogout }) {
  return (
    <SiswaLayout
      user={user}
      onLogout={onLogout}
      renderPage={(activePage, lang) => resolveContent(activePage, lang)}
    />
  )
}
