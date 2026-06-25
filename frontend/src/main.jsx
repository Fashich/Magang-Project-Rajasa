import { render } from 'preact';
import './styles/tokens.css';
import './index.css';
import { App } from './app.jsx';

render(<App />, document.getElementById('app'));

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
