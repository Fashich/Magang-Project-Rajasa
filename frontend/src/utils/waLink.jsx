/**
 * waLink.js — WhatsApp wa.me Link Generator
 * Tidak perlu API key, token, atau biaya apapun.
 *
 * Cara kerja:
 *   - Guru/admin klik tombol "Kirim WA"
 *   - Browser buka WhatsApp dengan pesan sudah terisi
 *   - Guru tinggal pilih kontak ortu → klik Send
 *
 * Tips: jika nomor ortu tersimpan di DB, bisa langsung buka
 * chat ke nomor itu. Jika tidak ada, wa.me/?text=... membuka
 * WhatsApp dan guru pilih kontak sendiri.
 *
 * @author feature/prd-5-notification (rev: wa.me)
 */

/**
 * Normalize nomor HP Indonesia ke format 62xxx
 */
function normalizePhone(phone) {
  if (!phone) return ''
  const clean = String(phone).replace(/\D/g, '')
  if (clean.startsWith('0'))  return '62' + clean.slice(1)
  if (clean.startsWith('62')) return clean
  return '62' + clean
}

/**
 * Buat wa.me URL.
 * @param {string} phone  - nomor HP (opsional). Jika kosong, buka WA tanpa tujuan
 * @param {string} message - isi pesan
 * @returns {string} URL wa.me
 */
export function waLink(phone, message) {
  const encoded = encodeURIComponent(message)
  if (phone) {
    const normalized = normalizePhone(phone)
    return `https://wa.me/${normalized}?text=${encoded}`
  }
  // Tanpa nomor: WA terbuka, guru pilih kontak sendiri
  return `https://wa.me/?text=${encoded}`
}

/**
 * Buka WhatsApp langsung di tab baru.
 */
export function bukaWA(phone, message) {
  window.open(waLink(phone, message), '_blank', 'noopener,noreferrer')
}

// ── Template pesan ───────────────────────────────────────────────────────────

export function pesanIzinMenungguOrtu({ siswa, jenis, dari, sampai, alasan }) {
  return (
    `📋 *Presensi Lab - SMKS Rajasa Surabaya*\n\n` +
    `Halo, Orang Tua/Wali dari *${siswa}*.\n\n` +
    `Ananda mengajukan *${jenis}* untuk tanggal *${dari} s/d ${sampai}*.\n` +
    `Alasan: ${alasan || '-'}\n\n` +
    `Mohon buka aplikasi Presensi Rajasa untuk memberikan persetujuan.\n\n` +
    `_Terima kasih._`
  )
}

export function pesanIzinDisetujui({ siswa, jenis, dari, sampai }) {
  return (
    `✅ *Presensi Lab - SMKS Rajasa Surabaya*\n\n` +
    `Halo, Orang Tua/Wali dari *${siswa}*.\n\n` +
    `Izin *${jenis}* ananda untuk tanggal *${dari} s/d ${sampai}* ` +
    `telah *DISETUJUI*.\n\n` +
    `_Terima kasih._`
  )
}

export function pesanIzinDitolak({ siswa, jenis, dari, sampai, catatan }) {
  return (
    `❌ *Presensi Lab - SMKS Rajasa Surabaya*\n\n` +
    `Halo, Orang Tua/Wali dari *${siswa}*.\n\n` +
    `Izin *${jenis}* ananda untuk tanggal *${dari} s/d ${sampai}* ` +
    `*DITOLAK*.\n` +
    `Catatan: ${catatan || '-'}\n\n` +
    `Silakan hubungi wali kelas untuk informasi lebih lanjut.\n\n` +
    `_Terima kasih._`
  )
}

export function pesanEarlyWarning({ siswa, kelas, rate, periode = 30 }) {
  return (
    `⚠️ *Peringatan Kehadiran - SMKS Rajasa Surabaya*\n\n` +
    `Halo, Orang Tua/Wali dari *${siswa}*.\n\n` +
    `Ananda dari kelas *${kelas}* memiliki tingkat kehadiran ` +
    `*${rate}%* dalam ${periode} hari terakhir.\n\n` +
    `Mohon segera diberikan perhatian dan menghubungi sekolah.\n\n` +
    `_Terima kasih._`
  )
}

// ── WA Button component (inline, tanpa import React/Preact) ──────────────────

/**
 * Render tombol "Kirim WA" sebagai elemen JSX.
 * Contoh penggunaan di Preact:
 *
 *   import { WaButton } from '../utils/waLink.js'
 *   <WaButton phone={ortuPhone} message={pesanIzinDisetujui({...})} label="WA Ortu" />
 */
export function WaButton({ phone, message, label = 'Kirim WA', style = {}, className = '' }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => bukaWA(phone, message)}
      title={phone ? `Kirim WA ke ${phone}` : 'Buka WhatsApp (pilih kontak sendiri)'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0.375rem 0.875rem',
        borderRadius: 8,
        background: '#25D366',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontFamily: "'Poppins', sans-serif",
        fontSize: '0.8rem',
        fontWeight: 600,
        ...style,
      }}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
                 -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463
                 -2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606
                 .134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371
                 -.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51
                 -.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016
                 -1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487
                 .709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719
                 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.932-1.416
                 A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.522 2 12 2zm0 18
                 a7.946 7.946 0 01-4.054-1.115l-.29-.173-3.007.864.888-2.943-.19-.302
                 A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
      </svg>
      {label}
    </button>
  )
}
