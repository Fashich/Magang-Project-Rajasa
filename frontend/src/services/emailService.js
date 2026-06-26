/**
 * emailService.js — EmailJS Integration
 * Kirim email langsung dari browser, tanpa backend SMTP
 *
 * Setup (15 menit):
 *   1. Daftar gratis di https://emailjs.com
 *   2. Add Email Service → pilih Gmail → authorize
 *   3. Create Email Template → buat template dengan variable:
 *      {{to_email}}, {{siswa_name}}, {{jenis_izin}},
 *      {{tanggal_dari}}, {{tanggal_sampai}}, {{status}}, {{catatan}}
 *   4. Dapat Service ID, Template ID, Public Key dari dashboard
 *   5. Tambah ke frontend/.env:
 *      VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
 *      VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
 *      VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxx
 *
 * Gratis: 200 email/bulan (cukup untuk sekolah kecil)
 *
 * @author feature/prd-5-notification (rev: emailjs)
 */

// Import via CDN — tidak perlu install npm package
// Sudah dimuat via index.html atau diimport langsung
let _emailjs = null

async function getEmailJS() {
  if (_emailjs) return _emailjs
  // Dynamic import — hanya load saat dibutuhkan
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js')
    _emailjs = window.emailjs
    return _emailjs
  } catch {
    return null
  }
}

const SERVICE_ID   = import.meta.env.VITE_EMAILJS_SERVICE_ID   || ''
const TEMPLATE_ID  = import.meta.env.VITE_EMAILJS_TEMPLATE_ID  || ''
const PUBLIC_KEY   = import.meta.env.VITE_EMAILJS_PUBLIC_KEY   || ''

const isConfigured = () => !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

/**
 * Kirim email dengan template EmailJS.
 * @param {Object} templateParams - key-value sesuai variable di template EmailJS
 * @returns {Promise<boolean>}
 */
export async function sendEmail(templateParams) {
  if (!isConfigured()) {
    console.warn('[EmailJS] Belum dikonfigurasi. Tambah VITE_EMAILJS_* ke .env')
    return false
  }

  try {
    // Gunakan emailjs via CDN global jika tersedia, fallback ke import
    const ejs = window.emailjs || await getEmailJS()
    if (!ejs) {
      console.warn('[EmailJS] Library tidak tersedia')
      return false
    }

    await ejs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    console.log('[EmailJS] Email terkirim ke:', templateParams.to_email)
    return true
  } catch (err) {
    console.error('[EmailJS] Gagal kirim:', err?.text || err?.message || err)
    return false
  }
}

// ── Template helpers ─────────────────────────────────────────────────────────

/**
 * Notif ke ortu: izin disetujui
 */
export function emailIzinDisetujui({ toEmail, siswa, jenis, dari, sampai }) {
  if (!toEmail) return Promise.resolve(false)
  return sendEmail({
    to_email:       toEmail,
    siswa_name:     siswa,
    jenis_izin:     jenis,
    tanggal_dari:   dari,
    tanggal_sampai: sampai,
    status:         'DISETUJUI ✅',
    catatan:        '-',
  })
}

/**
 * Notif ke ortu: izin ditolak
 */
export function emailIzinDitolak({ toEmail, siswa, jenis, dari, sampai, catatan }) {
  if (!toEmail) return Promise.resolve(false)
  return sendEmail({
    to_email:       toEmail,
    siswa_name:     siswa,
    jenis_izin:     jenis,
    tanggal_dari:   dari,
    tanggal_sampai: sampai,
    status:         'DITOLAK ❌',
    catatan:        catatan || '-',
  })
}

/**
 * Notif ke ortu: early warning kehadiran
 */
export function emailEarlyWarning({ toEmail, siswa, kelas, rate, periode = 30 }) {
  if (!toEmail) return Promise.resolve(false)
  return sendEmail({
    to_email:       toEmail,
    siswa_name:     siswa,
    jenis_izin:     'Peringatan Kehadiran',
    tanggal_dari:   `${periode} hari terakhir`,
    tanggal_sampai: `Rate: ${rate}%`,
    status:         `⚠️ Kelas ${kelas}`,
    catatan:        'Mohon segera hubungi sekolah.',
  })
}

export { isConfigured }
