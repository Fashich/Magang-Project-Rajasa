/**
 * lang.js — Language config + full translations
 * Bahasa: Indonesia (id) | Basa Jawa (jw) | Basa Madura (md)
 */

export const LANG_KEY    = 'rajasa-lang'
export const LANGS       = ['id', 'jw', 'md']
export const LANG_LABELS = { id: 'ID', jw: 'JW', md: 'MD' }
export const LANG_NAMES  = { id: 'Indonesia', jw: 'Basa Jawa', md: 'Basa Madura' }
export const LANG_FLAGS  = { id: '🇮🇩', jw: '🏛️', md: '🏝️' }

export function getLang()       { return localStorage.getItem(LANG_KEY) || 'id' }
export function setStoredLang(l){ localStorage.setItem(LANG_KEY, l) }

/** T[lang][key] — kamus terjemahan UI */
export const T = {
  id: {
    // ── Seksi sidebar ──
    nav_overview:  'Overview',
    nav_presensi:  'Presensi',
    nav_siswa:     'Siswa',
    nav_akun:      'Akun',
    nav_manajemen: 'Manajemen',
    nav_data:      'Data',
    nav_sistem:    'Sistem',
    nav_kegiatan:  'Kegiatan',
    // ── Item menu ──
    dashboard:           'Dashboard',
    sesi_presensi:       'Sesi Presensi',
    rekap_kehadiran:     'Rekap Kehadiran',
    rekap_presensi:      'Rekap Presensi',
    kalender_akademik:   'Kalender Akademik',
    early_warning:       'Early Warning',
    logbook_pkl:         'Logbook PKL',
    e_izin:              'E-Izin',
    pusat_komunikasi:    'Pusat Komunikasi',
    gamifikasi:          'Gamifikasi',
    pengaturan_akun:     'Pengaturan Akun',
    analitik_kehadiran:  'Analitik Kehadiran',
    analitik_prestasi:   'Analitik Prestasi',
    logbook_praktik:     'Logbook Praktik',
    pengguna:            'Pengguna',
    laporan:             'Laporan',
    audit_trail:         'Audit Trail',
    pengaturan:          'Pengaturan',
    keamanan_2fa:        'Keamanan 2FA',
    // ── Tombol umum ──
    keluar:       'Keluar',
    mulai_sesi:   'Mulai Sesi Baru',
  },

  jw: {
    nav_overview:  'Ringkesan',
    nav_presensi:  'Presensi',
    nav_siswa:     'Murid',
    nav_akun:      'Akun',
    nav_manajemen: 'Manajemen',
    nav_data:      'Data',
    nav_sistem:    'Sistem',
    nav_kegiatan:  'Kagiyatan',
    dashboard:           'Dasbor',
    sesi_presensi:       'Sesi Presensi',
    rekap_kehadiran:     'Rekap Rawuh',
    rekap_presensi:      'Rekap Rawuh',
    kalender_akademik:   'Almanak Akademik',
    early_warning:       'Tandha Waspada',
    logbook_pkl:         'Catetan PKL',
    e_izin:              'E-Ijin',
    pusat_komunikasi:    'Pusat Komunikasi',
    gamifikasi:          'Gamifikasi',
    pengaturan_akun:     'Setelan Akun',
    analitik_kehadiran:  'Analitik Rawuh',
    analitik_prestasi:   'Analitik Prestasi',
    logbook_praktik:     'Catetan Praktik',
    pengguna:            'Pengguna',
    laporan:             'Laporan',
    audit_trail:         'Audit Trail',
    pengaturan:          'Setelan',
    keamanan_2fa:        'Keamanan 2FA',
    keluar:       'Metu',
    mulai_sesi:   'Miwiti Sesi',
  },

  md: {
    nav_overview:  'Rengkepan',
    nav_presensi:  'Presensi',
    nav_siswa:     'Mored',
    nav_akun:      'Akun',
    nav_manajemen: 'Manajemen',
    nav_data:      'Data',
    nav_sistem:    'Sistem',
    nav_kegiatan:  'Kagiyatan',
    dashboard:           'Dasbor',
    sesi_presensi:       'Sesi Presensi',
    rekap_kehadiran:     'Rekap Hadhir',
    rekap_presensi:      'Rekap Hadhir',
    kalender_akademik:   'Almanak Akademik',
    early_warning:       'Peringatan Dini',
    logbook_pkl:         'Logbook PKL',
    e_izin:              'E-Ijin',
    pusat_komunikasi:    'Pusat Komunikasi',
    gamifikasi:          'Gamifikasi',
    pengaturan_akun:     'Pangator Akun',
    analitik_kehadiran:  'Analitik Hadhir',
    analitik_prestasi:   'Analitik Prestasi',
    logbook_praktik:     'Logbook Praktik',
    pengguna:            'Pangguna',
    laporan:             'Laporan',
    audit_trail:         'Audit Trail',
    pengaturan:          'Pangator',
    keamanan_2fa:        'Keamanan 2FA',
    keluar:       'Bhâk',
    mulai_sesi:   'Mulae Sesi',
  },
}
