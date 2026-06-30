import { render } from 'preact';
import './styles/tokens.css';
import './index.css';
import { App } from './app.jsx';

render(<App />, document.getElementById('app'));

// ── Deteksi otomatis saat koneksi terputus di tengah sesi ────────────────────
// Service worker (sw.js) hanya menangani offline saat ada NAVIGASI baru
// (reload / buka tab). Untuk SPA yang sudah terbuka, mematikan WiFi tidak
// memicu request apapun sehingga sw.js tidak pernah dapat kesempatan
// mengarahkan ke /offline.html. Listener ini menutup celah tersebut —
// begitu koneksi putus, user langsung diarahkan tanpa perlu refresh manual.
window.addEventListener('offline', () => {
  window.location.href = '/offline.html';
});

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
