/**
 * DashboardSiswa.jsx
 *
 * Main entry page for the student (siswa) role.
 * Wires together SiswaLayout (Level 2 header + Level 3 sidebar) with the
 * appropriate content component for each active tab / sidebar page.
 *
 * Content routing logic:
 *   Tab "dashboard"         + page "presensi"  → PresensiCounter   (Level 4)
 *   Tab "dashboard"         + page "kalender"  → KalenderAkademik  (Level 4)
 *   Tab "halaman-presensi"  + any page         → TablePresensi     (Level 4)
 *
 * Architecture reference: HTA-Magang-SMK-Rajasa-Siswa.png
 *
 * @module pages/siswa/DashboardSiswa
 * @author fashich/dashboard-siswa-page
 */

import SiswaLayout from '../../components/siswa/SiswaLayout'
import PresensiCounter from '../../components/siswa/PresensiCounter'
import KalenderAkademik from '../../components/siswa/KalenderAkademik'
import TablePresensi from '../../components/siswa/TablePresensi'

/**
 * Resolve the content component based on the current active tab and page.
 *
 * @param {string} activeTab   - Level 2 active tab id
 * @param {string} activePage  - Level 3 active sidebar page id
 * @returns {preact.VNode}
 */
function resolveContent(activeTab, activePage) {
  if (activeTab === 'dashboard') {
    if (activePage === 'presensi') {
      // Level 4: Attendance counters — Tepat Waktu, Terlambat, Alpha, Sakit, Izin
      return <PresensiCounter />
    }
    if (activePage === 'kalender') {
      // Level 4: PDF viewer — shows academic calendar or empty state
      return <KalenderAkademik />
    }
  }

  if (activeTab === 'halaman-presensi') {
    // Level 4: Full attendance table with filter + pagination
    return <TablePresensi />
  }

  return null
}

/**
 * DashboardSiswa
 *
 * Main entry page for the student (siswa) role.
 * Wires together SiswaLayout (Level 2 header + Level 3 sidebar) with the
 * appropriate content component for each active tab / sidebar page.
 *
 * Content routing:
 *   Tab "dashboard"        + page "presensi" → PresensiCounter
 *   Tab "dashboard"        + page "kalender" → KalenderAkademik
 *   Tab "halaman-presensi" + any page        → TablePresensi
 *
 * @param {{ user: Object, onLogout: Function }} props
 */
export default function DashboardSiswa({ user, onLogout }) {
  return (
    <SiswaLayout
      user={user}
      onLogout={onLogout}
      renderPage={(activeTab, activePage) => resolveContent(activeTab, activePage)}
    />
  )
}
