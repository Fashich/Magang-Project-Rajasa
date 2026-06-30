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
