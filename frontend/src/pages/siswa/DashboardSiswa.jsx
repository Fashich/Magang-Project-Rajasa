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

// ── Page resolver ─────────────────────────────────────────────────────────────

function resolveContent(activePage) {
  switch (activePage) {
    case 'dashboard': return <PresensiCounter />
    case 'rekap':     return <TablePresensi />
    case 'kalender':  return <KalenderAkademik />
    case 'izin':      return <EIzinSiswa />
    case 'logbook':        return <LogbookSiswa />
    case 'communication':  return <CommunicationHub />
    default:          return <PresensiCounter />
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DashboardSiswa({ user, onLogout }) {
  return (
    <SiswaLayout
      user={user}
      onLogout={onLogout}
      renderPage={(activePage) => resolveContent(activePage)}
    />
  )
}
