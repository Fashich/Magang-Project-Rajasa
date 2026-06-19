import { useEffect, useState } from 'preact/hooks'
import { authApi } from './utils/api'
import auth from './utils/auth'
import DashboardSiswa from './pages/siswa/DashboardSiswa'
import './app.css'

const THEME_KEY = 'rajasa-presensi-theme'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm-7.1 8.4h14.2c.8 0 1.4-.6 1.3-1.4-.4-3.3-3.1-5.6-8.4-5.6s-8 2.3-8.4 5.6c-.1.8.5 1.4 1.3 1.4Z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.8 9.6h-.7V7.4a5.1 5.1 0 0 0-10.2 0v2.2h-.7c-.9 0-1.7.8-1.7 1.7v7.9c0 .9.8 1.7 1.7 1.7h11.6c.9 0 1.7-.8 1.7-1.7v-7.9c0-.9-.8-1.7-1.7-1.7Zm-8.7 0V7.4a2.9 2.9 0 0 1 5.8 0v2.2H9.1Z" />
    </svg>
  )
}

function IdCardIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M39 10H9a4 4 0 0 0-4 4v20a4 4 0 0 0 4 4h30a4 4 0 0 0 4-4V14a4 4 0 0 0-4-4ZM16.6 18.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm7.1 14H9.5c.8-3.1 3.3-5 7.1-5s6.3 1.9 7.1 5ZM37.5 29h-9.8v-3.1h9.8V29Zm0-7h-9.8v-3.1h9.8V22Z" />
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 35.9a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Zm11.2-7.1a2.2 2.2 0 0 0-3.1 0 11.5 11.5 0 0 0-16.2 0 2.2 2.2 0 1 0 3.1 3.1 7.1 7.1 0 0 1 10 0 2.2 2.2 0 1 0 3.1-3.1Zm7.3-7.5a25.8 25.8 0 0 0-37 0 2.2 2.2 0 1 0 3.1 3.1 21.4 21.4 0 0 1 30.8 0 2.2 2.2 0 0 0 3.1-3.1Z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 4 9.8 9.9v10.8c0 10 6 19.1 14.2 22.9 8.2-3.8 14.2-12.9 14.2-22.9V9.9L24 4Zm0 34.6c-5.8-3.2-9.9-10.2-9.9-17.9v-7.9L24 8.7v29.9Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 5.5A18.5 18.5 0 1 0 24 42.5 18.5 18.5 0 0 0 24 5.5Zm1.9 19.2 7 4.1-1.9 3.2-8.9-5.3V14.2h3.8v10.5Z" />
    </svg>
  )
}

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.6 4.2 4 2.8l17.4 17.4-1.4 1.4-3-3A12.3 12.3 0 0 1 12 19C6.7 19 3.1 15.4 1.7 12c.6-1.5 1.7-3 3.1-4.2L2.6 4.2Zm6.1 6.1a3.7 3.7 0 0 0 5 5l-1.6-1.6a1.6 1.6 0 0 1-2-2l-1.4-1.4ZM12 5c5.3 0 8.9 3.6 10.3 7-.5 1.2-1.3 2.4-2.4 3.5l-3-3A4.8 4.8 0 0 0 10.7 6.3L8.4 4.1A12.2 12.2 0 0 1 12 5Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5.3 0 8.9 3.6 10.3 7-1.4 3.4-5 7-10.3 7s-8.9-3.6-10.3-7C3.1 8.6 6.7 5 12 5Zm0 11.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0-2.3a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Z" />
    </svg>
  )
}

function FeatureCard({ icon, label }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <p>{label}</p>
    </div>
  )
}

function FormField({ id, label, type = 'text', placeholder, icon, value, onInput, children }) {
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">
        <span className="label-icon">{icon}</span>
        {label}
      </label>
      <div className="input-wrap">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onInput={onInput}
          autoComplete={id === 'password' ? 'current-password' : 'username'}
        />
        {children}
      </div>
    </div>
  )
}

// ─── Role not yet implemented ──────────────────────────────────────────────────
function RoleNotImplemented({ role, onLogout }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      fontFamily: 'Poppins, sans-serif', gap: '0.75rem', color: '#64748b',
    }}>
      <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>
        Dashboard untuk role <code>{role}</code> belum tersedia.
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem' }}>
        Halaman ini sedang dalam pengembangan di branch lain.
      </p>
      <button type="button" onClick={onLogout} style={{
        marginTop: '0.5rem', padding: '0.5rem 1.25rem', border: 'none',
        borderRadius: '8px', background: '#0284c7', color: '#fff',
        fontFamily: 'Poppins, sans-serif', fontWeight: 500, cursor: 'pointer',
      }}>
        Kembali ke Login
      </button>
    </div>
  )
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return localStorage.getItem(THEME_KEY) || 'light'
  })

  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [remember,     setRemember]     = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authUser,     setAuthUser]     = useState(() => auth.getUser())
  const [loginError,   setLoginError]   = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    auth.clearAuth()
    setAuthUser(null)
    setUsername('')
    setPassword('')
    setLoginError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoginError('')
    setIsSubmitting(true)

    try {
      const res = await authApi.login(username, password)

      // Backend shape: { success, message, data: { token, user } }
      if (!res.success) {
        throw new Error(res.message || 'Login gagal.')
      }

      const token = res.data?.token
      const user  = res.data?.user

      if (!token || !user) {
        throw new Error('Response tidak valid dari server.')
      }

      // Simpan ke localStorage via auth utility
      auth.setToken(token)
      auth.setUser(user)
      setAuthUser(user)

    } catch (error) {
      setLoginError(error.message || 'Tidak bisa menghubungi server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Route by role ──
  if (authUser) {
    if (authUser.user_type === 'siswa') {
      return <DashboardSiswa user={authUser} onLogout={handleLogout} />
    }
    return <RoleNotImplemented role={authUser.user_type} onLogout={handleLogout} />
  }

  // ── Login page ──
  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Halaman login sistem presensi lab">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
        >
          <img src="/icon/circle-half-stroke-solid-full.svg" alt="" className="theme-toggle-icon" />
        </button>

        <section className="brand-panel">
          <div className="brand-content">
            <div className="main-logo"><IdCardIcon /></div>
            <div className="brand-heading">
              <h1>Sistem Presensi Lab</h1>
              <p>SMK Rajasa Surabaya</p>
            </div>
            <div className="feature-list" aria-label="Keunggulan sistem">
              <FeatureCard icon={<WifiIcon />} label="IoT Based" />
              <FeatureCard icon={<ShieldIcon />} label="Secure" />
              <FeatureCard icon={<ClockIcon />} label="Real-Time" />
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-main">
            <div className="form-content">
              <header className="login-header">
                <h2>Selamat Datang</h2>
                <p>Silahkan masuk untuk mengakses sistem</p>
              </header>

              <form className="login-form" onSubmit={handleSubmit}>
                <FormField
                  id="username"
                  label="Username"
                  placeholder="Masukkan Username"
                  icon={<UserIcon />}
                  value={username}
                  onInput={(event) => setUsername(event.currentTarget.value)}
                />
                <FormField
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan Password"
                  icon={<LockIcon />}
                  value={password}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                >
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    <EyeIcon hidden={showPassword} />
                  </button>
                </FormField>

                <div className="form-row">
                  <label className="remember-box">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.currentTarget.checked)}
                    />
                    <span>Ingat Saya</span>
                  </label>
                  <a href="#" className="forgot-link">Lupa Password?</a>
                </div>

                {loginError && <p className="login-alert">{loginError}</p>}

                <button type="submit" className="login-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : 'Login'}
                </button>
              </form>
            </div>
          </div>

          <footer className="login-footer">
            <p>2026 SMKS Rajasa Surabaya</p>
            <p>Tim Magang TKJ</p>
          </footer>
        </section>
      </section>
    </main>
  )
}
