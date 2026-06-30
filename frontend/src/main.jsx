import { render } from 'preact';
import './styles/tokens.css';
import './index.css';
import { App } from './app.jsx';

render(<App />, document.getElementById('app'));

// ── Deteksi koneksi internet — bukan cuma status network interface ──────────
// navigator.onLine & event 'offline' TIDAK bisa diandalkan sepenuhnya:
// browser tetap melaporkan "online" selama ADA SATU SAJA network interface
// aktif (mis. virtual adapter Docker/WSL, Bluetooth PAN, VPN), walau WiFi
// fisik sudah dimatikan dan sama sekali tidak ada akses internet sungguhan.
// Maka selain listener bawaan (fast-path), dilakukan active check berkala
// ke endpoint ringan Google yang didesain khusus untuk uji konektivitas.

let isCheckingConnection = false

async function hasRealInternet() {
  try {
    const ctrl = new AbortController()
    const timeoutId = setTimeout(() => ctrl.abort(), 4000)
    await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      signal: ctrl.signal,
    })
    clearTimeout(timeoutId)
    return true
  } catch {
    return false
  }
}

async function checkConnectionAndRedirect() {
  if (isCheckingConnection) return
  isCheckingConnection = true

  // Fast-path: OS melaporkan tidak ada interface jaringan sama sekali
  if (!navigator.onLine) {
    window.location.href = '/offline.html'
    isCheckingConnection = false
    return
  }

  // Slow-path: ada interface, tapi belum tentu ada internet sungguhan
  const online = await hasRealInternet()
  if (!online) {
    window.location.href = '/offline.html'
  }
  isCheckingConnection = false
}

window.addEventListener('offline', () => {
  window.location.href = '/offline.html'
})

// Cek aktif tiap 3 detik — menutup celah saat navigator.onLine masih
// melaporkan true padahal tidak ada akses internet sungguhan.
setInterval(checkConnectionAndRedirect, 3000)

// ── Service Worker Registration (PWA) ────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] Registered — scope:', reg.scope);
        // Cek update otomatis setiap 30 menit
        setInterval(() => reg.update(), 30 * 60 * 1000);
      })
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// ── Presence tracking (Online / Idle / Offline) ──────────────────────────────
// "Offline" tidak pernah dikirim ke server — itu murni disimpulkan di sisi
// pembaca (UsersPage) dari basi-tidaknya last_heartbeat_at. Yang dikirim
// client cuma 'online' atau 'idle', berdasarkan:
//   - idle  : 10 detik tanpa gerakan mouse/keyboard, ATAU tab ini tidak fokus
//             (pindah tab lain / aplikasi lain)
//   - online: ada aktivitas dalam 10 detik terakhir DAN tab sedang fokus

const IDLE_THRESHOLD_MS     = 10_000  // 10 detik tanpa gerakan → idle
const HEARTBEAT_INTERVAL_MS = 5_000   // kirim heartbeat tiap 5 detik

function getAuthToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token')
      || ''
}

let lastActivityAt = Date.now()

;['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(evt => {
  window.addEventListener(evt, () => { lastActivityAt = Date.now() }, { passive: true })
})

async function sendHeartbeat() {
  const token = getAuthToken()
  if (!token) return // belum login — tidak perlu kirim heartbeat

  const idleByInactivity = (Date.now() - lastActivityAt) > IDLE_THRESHOLD_MS
  const idleByTabHidden  = document.hidden === true
  const state = (idleByInactivity || idleByTabHidden) ? 'idle' : 'online'

  try {
    await fetch(`${import.meta.env.VITE_API_URL || '/api'}/presence/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ state }),
    })
  } catch {
    // Koneksi bermasalah — biarkan saja, akan dideteksi sistem offline
    // terpisah (offline.html) dan dicoba lagi heartbeat berikutnya.
  }
}

sendHeartbeat()
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
