/**
 * DashboardOrtu.jsx — with Accessibility Features
 *
 * Fitur aksesibilitas:
 *   1. Mode Sederhana — tampilkan 1 info utama (hadir/tidak hadir hari ini)
 *      font besar, tombol besar, kontras tinggi
 *   2. QR Scan — scan kartu siswa sebagai alternatif input NIS
 *   3. Multi-bahasa — Indonesia / Jawa / Madura
 *
 * @author development
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import CommunicationHub from '../admin/CommunicationHub'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API     = import.meta.env.VITE_API_URL || '/api'
const NIS_KEY = 'rajasa_ortu_nis'
const LANG_KEY = 'rajasa_ortu_lang'
const SIMPLE_KEY = 'rajasa_ortu_simple'
const THEME_KEY  = 'presensi_lab_rajasa:theme'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token') || ''
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Terjemahan ────────────────────────────────────────────────────────────────

const T = {
  id: {
    appName:        'Portal Orang Tua',
    inputNis:       'Masukkan NIS Anak',
    inputNisHint:   'Contoh: 12345 — atau scan kartu siswa',
    cari:           'Cari',
    scanQR:         'Scan Kartu',
    modeSederhana:  'Mode Sederhana',
    modeDetail:     'Mode Detail',
    hariIni:        'Kehadiran Hari Ini',
    hadir:          'HADIR ✅',
    tidakHadir:     'TIDAK HADIR ❌',
    terlambat:      'TERLAMBAT ⏰',
    sakit:          'SAKIT 🏥',
    izin:           'IZIN 📋',
    belumAda:       'Belum ada data hari ini',
    riwayat:        'Riwayat Presensi',
    logbook:        'Logbook PKL',
    hubungi:        'Hubungi Guru',
    dashboard:      'Beranda',
    keluar:         'Keluar',
    loading:        'Memuat...',
    gantiNis:       'Ganti',
    errorNis:       'NIS tidak boleh kosong',
    errorTidakDitemukan: 'Siswa tidak ditemukan. Periksa NIS.',
    nisDisimpan:    'Memantau:',
    scanPetunjuk:   'Arahkan kamera ke QR Code pada kartu siswa',
    scanBerhasil:   'NIS berhasil dibaca!',
    scanGagal:      'QR tidak terbaca, coba lagi',
    totalHadir:     'Total Hadir',
    totalAlpha:     'Total Alpha',
    bulanIni:       'Bulan Ini',
    rateHadir:      'Tingkat Kehadiran',
    perhatian:      '⚠️ Tingkat kehadiran rendah. Mohon diperhatikan.',
    baik:           '✅ Kehadiran dalam kondisi baik.',
  },
  jv: {
    appName:        'Portal Wong Tuwo',
    inputNis:       'Lebokno NIS Anakmu',
    inputNisHint:   'Tulis NIS — utowo scan kartune siswa',
    cari:           'Goleki',
    scanQR:         'Scan Kartu',
    modeSederhana:  'Mode Prasojo',
    modeDetail:     'Mode Jangkep',
    hariIni:        'Kehadiran Dinten Iki',
    hadir:          'RAWUH ✅',
    tidakHadir:     'ORA RAWUH ❌',
    terlambat:      'TELAT ⏰',
    sakit:          'LARA 🏥',
    izin:           'IZIN 📋',
    belumAda:       'Durung ono data dinten iki',
    riwayat:        'Catetan Presensi',
    logbook:        'Logbook PKL',
    hubungi:        'Ngomong Gurune',
    dashboard:      'Ngarep',
    keluar:         'Metu',
    loading:        'Sabar...',
    gantiNis:       'Ganti',
    errorNis:       'NIS ora oleh kosong',
    errorTidakDitemukan: 'Siswa ora ketemu. Cek NIS maneh.',
    nisDisimpan:    'Ndelok:',
    scanPetunjuk:   'Arahno kamera menyang QR Code ing kartune siswa',
    scanBerhasil:   'NIS kasil diwaca!',
    scanGagal:      'QR ora terbaca, coba maneh',
    totalHadir:     'Cacah Rawuh',
    totalAlpha:     'Cacah Alpha',
    bulanIni:       'Wulan Iki',
    rateHadir:      'Persentase Rawuh',
    perhatian:      '⚠️ Kehadiran sithik. Tulung digatekno.',
    baik:           '✅ Kehadiran apik.',
  },
  md: {
    appName:        'Portal Oreng Towa',
    inputNis:       'Masokan NIS Anakah',
    inputNisHint:   'Noles NIS — ataoh scan kartu siswa',
    cari:           'Pare',
    scanQR:         'Scan Kartu',
    modeSederhana:  'Mode Saderhana',
    modeDetail:     'Mode Lengkap',
    hariIni:        'Kaadiran Areh Jiah',
    hadir:          'HADIR ✅',
    tidakHadir:     'TADHA HADIR ❌',
    terlambat:      'TELAT ⏰',
    sakit:          'SAKET 🏥',
    izin:           'IZIN 📋',
    belumAda:       'Tadha data areh jiah',
    riwayat:        'Catetan Presensi',
    logbook:        'Logbook PKL',
    hubungi:        'Obi\' Gurune',
    dashboard:      'Beranda',
    keluar:         'Keluar',
    loading:        'Sabar...',
    gantiNis:       'Ganti',
    errorNis:       'NIS tadha oleh kosong',
    errorTidakDitemukan: 'Siswa tadha ketemo. Periksa NIS.',
    nisDisimpan:    'Nenggu:',
    scanPetunjuk:   'Arahagi kamera ka QR Code e kartuna siswa',
    scanBerhasil:   'NIS hasellah terbaca!',
    scanGagal:      'QR tadha terbaca, coba pole',
    totalHadir:     'Jumlah Hadir',
    totalAlpha:     'Jumlah Alpha',
    bulanIni:       'Bulan Jiah',
    rateHadir:      'Tingkat Hadir',
    perhatian:      '⚠️ Kaadiran redheh. Mohon diperhatekagi.',
    baik:           '✅ Kaadiran bagus.',
  },
}

// ── QR Scanner Component ──────────────────────────────────────────────────────

function QRScanner({ onResult, onClose, t }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [err, setErr] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let stopped = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        streamRef.current = stream
        if (videoRef.current && !stopped) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setScanning(true)
          scanFrame()
        }
      } catch (e) {
        setErr('Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.')
      }
    }

    async function scanFrame() {
      if (stopped || !videoRef.current) return

      // Pakai BarcodeDetector API jika tersedia (Chrome 83+)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
          const detect = async () => {
            if (stopped || !videoRef.current) return
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0) {
                const raw = barcodes[0].rawValue
                // Ambil NIS dari QR — format bisa "NIS:12345" atau langsung "12345"
                const nis = raw.includes(':') ? raw.split(':')[1].trim() : raw.trim()
                stopCamera()
                onResult(nis, true)
                return
              }
            } catch {}
            if (!stopped) requestAnimationFrame(detect)
          }
          detect()
        } catch {}
      } else {
        // Fallback: tampilkan pesan manual
        setErr('Browser ini tidak mendukung scan QR otomatis. Silakan ketik NIS secara manual.')
      }
    }

    function stopCamera() {
      stopped = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }

    startCamera()
    return () => {
      stopped = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000, padding: '1.5rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,.4)',
      }}>
        <div style={{
          background: '#0284c7', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
            📷 {t.scanQR}
          </span>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif", fontSize: '0.875rem',
          }}>✕</button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <p style={{
            margin: '0 0 1rem', fontSize: '0.9rem', textAlign: 'center',
            color: '#475569', lineHeight: 1.6,
          }}>
            {t.scanPetunjuk}
          </p>

          {/* Video viewfinder */}
          <div style={{
            position: 'relative', width: '100%', paddingBottom: '100%',
            background: '#0f172a', borderRadius: 12, overflow: 'hidden',
          }}>
            <video ref={videoRef} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
            }} playsInline muted />
            {/* Scan frame overlay */}
            {scanning && !err && (
              <div style={{
                position: 'absolute', inset: '20%',
                border: '3px solid #0284c7', borderRadius: 12,
                boxShadow: '0 0 0 999px rgba(0,0,0,0.4)',
              }} />
            )}
          </div>

          {err && (
            <div style={{
              marginTop: '1rem', padding: '0.75rem', background: '#fef2f2',
              border: '1px solid #fca5a5', borderRadius: 8,
              color: '#dc2626', fontSize: '0.875rem', textAlign: 'center',
            }}>
              {err}
            </div>
          )}

          {!err && scanning && (
            <p style={{
              margin: '1rem 0 0', textAlign: 'center',
              fontSize: '0.8rem', color: '#64748b',
            }}>
              🔍 Sedang memindai...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mode Sederhana — 1 kartu besar ───────────────────────────────────────────

function ModeSederhana({ siswa, statusHariIni, t, onKeluar }) {
  const statusConfig = {
    hadir:      { label: t.hadir,      bg: '#15803d', emoji: '✅' },
    terlambat:  { label: t.terlambat,  bg: '#d97706', emoji: '⏰' },
    sakit:      { label: t.sakit,      bg: '#0284c7', emoji: '🏥' },
    izin:       { label: t.izin,       bg: '#7c3aed', emoji: '📋' },
    alpha:      { label: t.tidakHadir, bg: '#dc2626', emoji: '❌' },
    null:       { label: t.belumAda,   bg: '#64748b', emoji: '❓' },
  }

  const cfg = statusConfig[statusHariIni] ?? statusConfig['null']

  return (
    <div style={{
      minHeight: '100vh', background: cfg.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: "'Poppins', sans-serif",
    }}>
      {/* Nama anak */}
      <div style={{
        background: 'rgba(255,255,255,0.15)', borderRadius: 20,
        padding: '1.25rem 2rem', marginBottom: '2rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.25rem' }}>
          {t.hariIni}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
          {siswa?.nama_lengkap || '—'}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.2rem' }}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Status besar */}
      <div style={{
        fontSize: '8rem', lineHeight: 1, marginBottom: '1.5rem',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
      }}>
        {cfg.emoji}
      </div>

      <div style={{
        fontSize: '2.5rem', fontWeight: 800, color: '#fff',
        textShadow: '0 2px 8px rgba(0,0,0,0.3)', textAlign: 'center',
        marginBottom: '3rem',
      }}>
        {cfg.label.replace(/[✅❌⏰🏥📋]/g, '').trim()}
      </div>

      {/* Tombol keluar besar */}
      <button onClick={onKeluar} style={{
        padding: '1.25rem 3rem', background: 'rgba(255,255,255,0.2)',
        border: '3px solid rgba(255,255,255,0.6)', borderRadius: 16,
        color: '#fff', fontFamily: "'Poppins', sans-serif",
        fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer',
        transition: 'background 0.15s',
      }}>
        🚪 {t.keluar}
      </button>
    </div>
  )
}

// ── NIS Input ─────────────────────────────────────────────────────────────────

function NisInput({ savedNis, onSave, t, simple }) {
  const [input, setInput] = useState(savedNis || '')
  const [err, setErr] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  function handleSave() {
    if (!input.trim()) { setErr(t.errorNis); return }
    onSave(input.trim()); setErr('')
  }

  function handleQRResult(nis, success) {
    setShowScanner(false)
    if (success) { setInput(nis); onSave(nis) }
    else setErr(t.scanGagal)
  }

  const fontSize = simple ? '1.125rem' : '0.875rem'
  const btnPad   = simple ? '0.875rem 1.5rem' : '0.55rem 1rem'

  return (
    <>
      {showScanner && (
        <QRScanner t={t} onResult={handleQRResult} onClose={() => setShowScanner(false)} />
      )}

      <div style={{
        background: '#e0f2fe', border: '2px solid #0284c7',
        borderRadius: 16, padding: simple ? '1.5rem' : '1.25rem',
        marginBottom: simple ? '1.75rem' : '1.25rem',
      }}>
        {savedNis ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <div>
              <span style={{ fontSize: simple ? '1rem' : '0.8125rem', color: '#0284c7', fontWeight: 600 }}>
                {t.nisDisimpan}
              </span>
              <strong style={{ fontSize: simple ? '1.25rem' : '1rem', color: '#0f172a', marginLeft: '0.5rem' }}>
                {savedNis}
              </strong>
            </div>
            <button onClick={() => onSave('')} style={{
              padding: '0.4rem 1rem', background: '#fff', border: '2px solid #0284c7',
              borderRadius: 8, color: '#0284c7', fontFamily: "'Poppins', sans-serif",
              fontSize: simple ? '1rem' : '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {t.gantiNis}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontSize: simple ? '1.125rem' : '0.875rem', fontWeight: 700, color: '#0284c7' }}>
              👦 {t.inputNis}
            </label>
            <p style={{ margin: 0, fontSize: simple ? '1rem' : '0.8rem', color: '#475569' }}>
              {t.inputNisHint}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input type="text" placeholder="NIS..."
                value={input} onInput={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                style={{
                  padding: simple ? '0.875rem' : '0.55rem 0.75rem',
                  border: '2px solid #0284c7', borderRadius: 10,
                  fontFamily: "'Poppins', sans-serif", fontSize,
                  color: '#0f172a', background: '#fff', flex: 1, minWidth: 120,
                  outline: 'none',
                }} />
              <button onClick={handleSave} style={{
                padding: btnPad, background: '#0284c7', color: '#fff',
                border: 'none', borderRadius: 10, fontFamily: "'Poppins', sans-serif",
                fontSize, fontWeight: 700, cursor: 'pointer',
              }}>
                🔍 {t.cari}
              </button>
              <button onClick={() => setShowScanner(true)} style={{
                padding: btnPad, background: '#fff', color: '#0284c7',
                border: '2px solid #0284c7', borderRadius: 10, fontFamily: "'Poppins', sans-serif",
                fontSize, fontWeight: 700, cursor: 'pointer',
              }}>
                📷 {t.scanQR}
              </button>
            </div>
            {err && <p style={{ margin: 0, fontSize: '0.875rem', color: '#dc2626' }}>{err}</p>}
          </div>
        )}
      </div>
    </>
  )
}

// ── Page Dashboard (mode detail) ──────────────────────────────────────────────

function PageDashboard({ nis, t, simple, onSetPage }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const load = useCallback(async () => {
    if (!nis) return
    setLoading(true); setErr('')
    try {
      const res = await apiFetch(`/siswa/dashboard?nis=${encodeURIComponent(nis)}`)
      setData(res.data ?? res)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }, [nis])

  useEffect(() => { load() }, [load])

  if (!nis) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👦</div>
      <p style={{ fontWeight: 600, fontSize: simple ? '1.25rem' : '1rem' }}>
        {t.inputNis}
      </p>
    </div>
  )

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: simple ? '1.25rem' : '1rem' }}>
      ⏳ {t.loading}
    </div>
  )

  if (err) return (
    <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5',
      borderRadius: 12, color: '#dc2626', fontSize: simple ? '1.125rem' : '0.875rem' }}>
      {t.errorTidakDitemukan}
    </div>
  )

  if (!data) return null

  const totals  = data.totals ?? {}
  const siswa   = data.siswa  ?? {}
  const statHariIni = data.status_hari_ini ?? null

  const fz = simple ? '1.125rem' : '0.8125rem'
  const statCards = [
    { label: t.totalHadir,  value: totals.tepat_waktu ?? 0, color: '#15803d', icon: '✅' },
    { label: 'Terlambat',   value: totals.terlambat   ?? 0, color: '#d97706', icon: '⏰' },
    { label: t.totalAlpha,  value: totals.alpha        ?? 0, color: '#dc2626', icon: '❌' },
    { label: 'Sakit/Izin',  value: (totals.sakit ?? 0) + (totals.izin ?? 0), color: '#0284c7', icon: '📋' },
  ]

  const statusLbl = {
    hadir: t.hadir, terlambat: t.terlambat, alpha: t.tidakHadir, sakit: t.sakit, izin: t.izin,
  }
  const statusBg = { hadir:'#15803d', terlambat:'#d97706', alpha:'#dc2626', sakit:'#0284c7', izin:'#7c3aed' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: simple ? '1.5rem' : '1.25rem' }}>

      {/* Info siswa */}
      <div style={{
        background: '#e0f2fe', border: '1px solid #0284c7', borderRadius: 14,
        padding: simple ? '1.5rem' : '1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div style={{
          width: simple ? 56 : 48, height: simple ? 56 : 48, borderRadius: '50%',
          background: '#0284c7', color: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: simple ? '1.5rem' : '1.25rem', fontWeight: 700, flexShrink: 0,
        }}>
          {(siswa.nama_lengkap || '?').charAt(0)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: simple ? '1.25rem' : '1rem', color: '#0f172a' }}>
            {siswa.nama_lengkap || '—'}
          </div>
          <div style={{ fontSize: simple ? '1rem' : '0.8rem', color: '#475569' }}>
            NIS: {siswa.nis || nis} · {siswa.kelas_aktif || '—'}
          </div>
        </div>
        {/* Status hari ini */}
        {statHariIni && (
          <div style={{
            marginLeft: 'auto', padding: '0.5rem 1.25rem',
            background: statusBg[statHariIni] ?? '#64748b', color: '#fff',
            borderRadius: 999, fontWeight: 700, fontSize: simple ? '1rem' : '0.875rem',
            whiteSpace: 'nowrap',
          }}>
            {statusLbl[statHariIni] ?? statHariIni}
          </div>
        )}
      </div>

      {/* Rate hadir */}
      {totals.rate_hadir !== undefined && (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
          padding: simple ? '1.5rem' : '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <span style={{ fontSize: simple ? '1.125rem' : '0.875rem', fontWeight: 600 }}>
              {t.rateHadir}
            </span>
            <span style={{
              fontWeight: 800, fontSize: simple ? '1.5rem' : '1.125rem',
              color: totals.rate_hadir >= 75 ? '#15803d' : '#dc2626',
            }}>
              {totals.rate_hadir}%
            </span>
          </div>
          <div style={{ height: simple ? 12 : 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${totals.rate_hadir}%`,
              background: totals.rate_hadir >= 75 ? '#15803d' : '#dc2626',
              transition: 'width 0.5s',
            }} />
          </div>
          <p style={{
            margin: '0.625rem 0 0', fontSize: simple ? '1rem' : '0.8rem',
            color: totals.rate_hadir < 75 ? '#dc2626' : '#15803d',
          }}>
            {totals.rate_hadir < 75 ? t.perhatian : t.baik}
          </p>
        </div>
      )}

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: simple ? '1rem' : '0.875rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#fff', border: `1px solid #e2e8f0`,
            borderLeft: `4px solid ${s.color}`, borderRadius: 14,
            padding: simple ? '1.25rem' : '1rem',
          }}>
            <div style={{ fontSize: simple ? '2rem' : '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize: simple ? '2rem' : '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: simple ? '0.9rem' : '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              {s.label} · {t.bulanIni}
            </div>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <button onClick={() => onSetPage('communication')} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        padding: simple ? '1.25rem' : '0.875rem', background: '#0284c7', color: '#fff',
        border: 'none', borderRadius: 14, fontFamily: "'Poppins', sans-serif",
        fontSize: simple ? '1.125rem' : '0.875rem', fontWeight: 700, cursor: 'pointer',
        width: '100%', transition: 'opacity 0.15s',
      }}>
        💬 {t.hubungi}
      </button>
    </div>
  )
}

// ── Page Riwayat Presensi ─────────────────────────────────────────────────────

function PageRiwayat({ nis, t, simple }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('semua')

  const statusLabels = { semua: 'Semua', hadir: 'Hadir', terlambat: 'Terlambat', alpha: 'Alpha', sakit: 'Sakit', izin: 'Izin' }
  const statusBg     = { hadir:'#15803d', terlambat:'#d97706', alpha:'#dc2626', sakit:'#0284c7', izin:'#7c3aed' }

  const load = useCallback(async () => {
    if (!nis) return
    setLoading(true)
    try {
      const res = await apiFetch(`/siswa/presensi?filter=${filter}&page=1&per_page=30&nis=${encodeURIComponent(nis)}`)
      setRows(res.data?.presensi ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [nis, filter])

  useEffect(() => { load() }, [load])

  const fz = simple ? '1rem' : '0.8125rem'

  if (!nis) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: fz }}>
      {t.inputNis}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter tombol */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Object.entries(statusLabels).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: simple ? '0.625rem 1.25rem' : '0.35rem 0.875rem',
            border: `2px solid ${filter === k ? '#0284c7' : '#e2e8f0'}`,
            borderRadius: 999, background: filter === k ? '#0284c7' : '#fff',
            color: filter === k ? '#fff' : '#64748b',
            fontFamily: "'Poppins', sans-serif", fontSize: fz,
            fontWeight: filter === k ? 700 : 500, cursor: 'pointer',
          }}>
            {v}
          </button>
        ))}
      </div>

      {/* Tabel / cards */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: fz }}>
            ⏳ {t.loading}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: fz }}>
            {t.belumAda}
          </div>
        ) : simple ? (
          // Mode sederhana: cards besar
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
            {rows.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10,
                border: `1px solid ${statusBg[r.status] ?? '#e2e8f0'}`,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#0f172a' }}>
                    {fmtDate(r.tanggal)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.1rem' }}>
                    {r.ruangan || '—'}
                  </div>
                </div>
                <span style={{
                  padding: '0.4rem 1rem', borderRadius: 999, fontWeight: 700,
                  fontSize: '0.9rem', color: '#fff',
                  background: statusBg[r.status] ?? '#64748b',
                }}>
                  {statusLabels[r.status] ?? r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // Mode detail: tabel
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fz }}>
            <thead>
              <tr>
                {['Tanggal','Ruangan','Status'].map(h => (
                  <th key={h} style={{
                    padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.7rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{fmtDate(r.tanggal)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{r.ruangan || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.625rem',
                      borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                      color: '#fff', background: statusBg[r.status] ?? '#64748b',
                    }}>
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function DashboardOrtu({ user, onLogout }) {
  const [activePage,  setActivePage]  = useState('dashboard')
  const [nis,         setNis]         = useState(() => localStorage.getItem(NIS_KEY) || '')
  const [lang,        setLang]        = useState(() => localStorage.getItem(LANG_KEY) || 'id')
  const [simple,      setSimple]      = useState(() => localStorage.getItem(SIMPLE_KEY) === 'true')
  const [siswaData,   setSiswaData]   = useState(null)
  const [statusHariIni, setStatusHariIni] = useState(null)

  const t = T[lang] ?? T.id

  function handleSetNis(val) {
    setNis(val)
    if (val) localStorage.setItem(NIS_KEY, val)
    else { localStorage.removeItem(NIS_KEY); setSiswaData(null); setStatusHariIni(null) }
  }

  function toggleSimple() {
    const next = !simple
    setSimple(next)
    localStorage.setItem(SIMPLE_KEY, String(next))
  }

  function toggleLang() {
    const langs = ['id', 'jv', 'md']
    const next = langs[(langs.indexOf(lang) + 1) % langs.length]
    setLang(next)
    localStorage.setItem(LANG_KEY, next)
  }

  function handleLogout() {
    localStorage.removeItem('presensi_lab_rajasa:auth_token')
    localStorage.removeItem('presensi_lab_rajasa:auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    if (typeof onLogout === 'function') onLogout()
  }

  // Load data siswa saat NIS berubah (untuk mode sederhana)
  useEffect(() => {
    if (!nis) return
    apiFetch(`/siswa/dashboard?nis=${encodeURIComponent(nis)}`)
      .then(r => {
        setSiswaData(r.data?.siswa ?? r.siswa ?? null)
        setStatusHariIni(r.data?.status_hari_ini ?? null)
      }).catch(() => {})
  }, [nis])

  const langLabel = { id: '🇮🇩 ID', jv: '☕ JV', md: '🌊 MD' }
  const initials  = (user?.nama_lengkap || user?.username || 'O').charAt(0).toUpperCase()

  const navItems = [
    { id: 'dashboard',     label: t.dashboard,    icon: '🏠' },
    { id: 'riwayat',       label: t.riwayat,      icon: '📅' },
    { id: 'logbook',       label: t.logbook,       icon: '📒' },
    { id: 'communication', label: t.hubungi,       icon: '💬' },
  ]

  const fz      = simple ? '1.125rem' : '0.8125rem'
  const btnFz   = simple ? '1rem'     : '0.8125rem'
  const sidebarW = simple ? 260       : 240

  // Mode sederhana full screen
  if (simple && nis && siswaData) {
    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }}>
        {/* Bar atas kecil */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 1.25rem',
        }}>
          <button onClick={toggleSimple} style={{
            padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: 8, color: '#fff',
            fontFamily: "'Poppins', sans-serif", fontSize: '0.875rem', cursor: 'pointer',
          }}>
            ← {t.modeDetail}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={toggleLang} style={{
              padding: '0.4rem 0.875rem', background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: 8, color: '#fff',
              fontFamily: "'Poppins', sans-serif", fontSize: '0.875rem', cursor: 'pointer',
            }}>
              {langLabel[lang]}
            </button>
            <button onClick={handleLogout} style={{
              padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: 8, color: '#fff',
              fontFamily: "'Poppins', sans-serif", fontSize: '0.875rem', cursor: 'pointer',
            }}>
              🚪
            </button>
          </div>
        </div>

        <ModeSederhana
          siswa={siswaData}
          statusHariIni={statusHariIni}
          t={t}
          onKeluar={handleLogout}
        />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#f0f9ff', fontFamily: "'Poppins', sans-serif",
      fontSize: fz,
    }}>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: sidebarW, background: '#fff',
        borderRight: '1px solid #e2e8f0', display: 'flex',
        flexDirection: 'column', zIndex: 100, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0 1rem', height: 64, borderBottom: '1px solid #e2e8f0', flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#0284c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.125rem', flexShrink: 0,
          }}>🏫</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: fz, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {t.appName}
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              width: '100%', padding: simple ? '1rem 1.25rem' : '0.625rem 1rem',
              border: 'none',
              background: activePage === item.id ? '#e0f2fe' : 'transparent',
              color: activePage === item.id ? '#0284c7' : '#64748b',
              fontFamily: "'Poppins', sans-serif", fontSize: fz,
              fontWeight: activePage === item.id ? 700 : 500,
              cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
              borderLeft: activePage === item.id ? '4px solid #0284c7' : '4px solid transparent',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: simple ? '1.25rem' : '1rem', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            width: '100%', padding: simple ? '0.875rem 0.75rem' : '0.625rem 0.75rem',
            border: 'none', background: 'transparent', fontFamily: "'Poppins', sans-serif",
            fontSize: btnFz, fontWeight: 500, color: '#64748b', cursor: 'pointer', borderRadius: 8,
          }}>
            <span>🚪</span> {t.keluar}
          </button>
        </div>
      </aside>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: sidebarW, right: 0, height: 64,
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.5rem',
        zIndex: 90, boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        <div style={{ flex: 1 }} />

        {/* Toggle mode sederhana */}
        <button onClick={toggleSimple} style={{
          padding: '0.45rem 1rem', border: `2px solid ${simple ? '#0284c7' : '#e2e8f0'}`,
          borderRadius: 8, background: simple ? '#e0f2fe' : '#fff',
          color: simple ? '#0284c7' : '#64748b', fontFamily: "'Poppins', sans-serif",
          fontSize: btnFz, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {simple ? '📱 ' + t.modeDetail : '♿ ' + t.modeSederhana}
        </button>

        {/* Toggle bahasa */}
        <button onClick={toggleLang} style={{
          padding: '0.45rem 0.875rem', border: '2px solid #e2e8f0',
          borderRadius: 8, background: '#fff', color: '#64748b',
          fontFamily: "'Poppins', sans-serif", fontSize: btnFz,
          fontWeight: 600, cursor: 'pointer',
        }}>
          {langLabel[lang]}
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: '#0284c7',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ display: simple ? 'none' : 'block' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
              {user?.nama_lengkap || user?.username || 'Orang Tua'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ortu / Wali</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{
        marginLeft: sidebarW, marginTop: 64,
        minHeight: 'calc(100vh - 64px)', padding: simple ? '2rem' : '1.5rem',
      }}>
        {/* NIS input di semua halaman kecuali communication */}
        {activePage !== 'communication' && (
          <NisInput savedNis={nis} onSave={handleSetNis} t={t} simple={simple} />
        )}

        {activePage === 'dashboard'     && <PageDashboard nis={nis} t={t} simple={simple} onSetPage={setActivePage} />}
        {activePage === 'riwayat'       && <PageRiwayat   nis={nis} t={t} simple={simple} />}
        {activePage === 'logbook'       && <LogbookPage   nis={nis} t={t} simple={simple} />}
        {activePage === 'communication' && <CommunicationHub />}
      </main>
    </div>
  )
}

// ── Logbook mini (reuse tanpa import LogbookSiswa) ────────────────────────────

function LogbookPage({ nis, t, simple }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const fz = simple ? '1rem' : '0.8125rem'

  const load = useCallback(async () => {
    if (!nis) return
    setLoading(true)
    try {
      const cari = await apiFetch(`/users?search=${encodeURIComponent(nis)}&user_type=siswa`)
      const siswaId = cari.data?.items?.[0]?.siswa_id
      if (!siswaId) return
      const res = await apiFetch(`/logbook?siswa_id=${siswaId}&per_page=15`)
      setItems(res.data?.items ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [nis])

  useEffect(() => { load() }, [load])

  const SB = { draft:'#64748b', menunggu_review:'#d97706', disetujui:'#15803d', ditolak:'#dc2626' }
  const SL = { draft:'Draft', menunggu_review:'Menunggu', disetujui:'Disetujui', ditolak:'Dikembalikan' }

  if (!nis) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: fz }}>{t.inputNis}</div>

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: fz }}>⏳ {t.loading}</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: fz }}>{t.belumAda}</div>
      ) : simple ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
          {items.map(item => (
            <div key={item.logbook_id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10,
              border: `1px solid ${SB[item.status] ?? '#e2e8f0'}`,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{fmtDate(item.tanggal)}</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.lokasi || '—'}</div>
              </div>
              <span style={{
                padding: '0.4rem 1rem', borderRadius: 999, fontWeight: 700,
                fontSize: '0.875rem', color: '#fff', background: SB[item.status] ?? '#64748b',
              }}>
                {SL[item.status] ?? item.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fz }}>
          <thead>
            <tr>
              {['Tanggal','Lokasi','Status'].map(h => (
                <th key={h} style={{
                  padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.7rem',
                  fontWeight: 700, textTransform: 'uppercase', color: '#64748b',
                  background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.logbook_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{fmtDate(item.tanggal)}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.lokasi || '—'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{
                    display: 'inline-block', padding: '0.2rem 0.625rem',
                    borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                    color: '#fff', background: SB[item.status] ?? '#64748b',
                  }}>
                    {SL[item.status] ?? item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
