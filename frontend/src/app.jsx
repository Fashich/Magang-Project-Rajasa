import { useEffect, useState, useRef } from 'preact/hooks';
import { TLogin } from './utils/lang.js';

/** SunMoonIcon — sama seperti di layout, butuh prop theme */
function SunMoonIcon({ theme }) {
  const dark = theme === 'dark'
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <defs>
        <clipPath id="__smicon_clip_login">
          <rect width="24" height="24" rx="5.3"/>
        </clipPath>
      </defs>
      <g clipPath="url(#__smicon_clip_login)">
        <path d="M0,0 L24,0 L0,24 Z" fill={dark ? '#0A0F1E' : '#1E3A5F'}/>
        <path d="M24,0 L24,24 L0,24 Z" fill={dark ? '#1A2744' : '#7DD3FC'}/>
        {dark && (
          <g fill="white">
            <circle cx="3.5" cy="2.5" r="0.5" opacity="0.92"/>
            <circle cx="11" cy="2.5" r="0.38" opacity="0.80"/>
            <circle cx="9" cy="5.5" r="0.32" opacity="0.70"/>
            <circle cx="2" cy="9" r="0.28" opacity="0.85"/>
            <circle cx="6.5" cy="11" r="0.22" opacity="0.60"/>
            <circle cx="4" cy="15" r="0.22" opacity="0.55"/>
            <circle cx="1.5" cy="17.5" r="0.28" opacity="0.65"/>
            <circle cx="8" cy="8" r="0.18" opacity="0.72"/>
          </g>
        )}
        <g opacity={dark ? 1 : 0.18} style={{ transition:'opacity 0.25s' }}>
          <g transform="scale(0.6)">
            <path d="M3 12.79A9 9 0 1 0 12.79 3 7 7 0 0 1 3 12.79z"
              fill={dark ? '#E2E8F0' : 'white'}/>
          </g>
        </g>
        <g opacity={dark ? 0.18 : 1} style={{ transition:'opacity 0.25s' }}>
          <circle cx="16" cy="16" r="3.5" fill={dark ? '#94A3B8' : '#FBBF24'}/>
          <line x1="16" y1="20.5" x2="16" y2="23" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="20.5" y1="16" x2="23" y2="16" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="19.47" y1="19.47" x2="21.19" y2="21.19" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="12.53" y1="19.47" x2="10.81" y2="21.19" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
          <line x1="19.47" y1="12.53" x2="21.19" y2="10.81" stroke={dark ? '#94A3B8' : '#FBBF24'} strokeWidth="2" strokeLinecap="round"/>
        </g>
        <line x1="0" y1="24" x2="24" y2="0" stroke="rgba(255,255,255,0.18)" strokeWidth="0.7"/>
      </g>
    </svg>
  )
}
import { authApi } from './utils/api';
import auth from './utils/auth';
import DashboardSiswa from './pages/siswa/DashboardSiswa';
import DashboardGuru from './pages/guru/DashboardGuru';
import DashboardOrtu from './pages/ortu/DashboardOrtu';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import './app.css';

const THEME_KEY = 'rajasa-presensi-theme';

// ── Kontak Admin — ganti dengan nomor & email asli sekolah ───────────────────
const ADMIN_WA_NUMBER = '6281234567890'     // Format 62xxx tanpa +
const ADMIN_EMAIL     = 'admin@rajasa.sch.id'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm-7.1 8.4h14.2c.8 0 1.4-.6 1.3-1.4-.4-3.3-3.1-5.6-8.4-5.6s-8 2.3-8.4 5.6c-.1.8.5 1.4 1.3 1.4Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.8 9.6h-.7V7.4a5.1 5.1 0 0 0-10.2 0v2.2h-.7c-.9 0-1.7.8-1.7 1.7v7.9c0 .9.8 1.7 1.7 1.7h11.6c.9 0 1.7-.8 1.7-1.7v-7.9c0-.9-.8-1.7-1.7-1.7Zm-8.7 0V7.4a2.9 2.9 0 0 1 5.8 0v2.2H9.1Z" />
    </svg>
  );
}

function IdCardIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M39 10H9a4 4 0 0 0-4 4v20a4 4 0 0 0 4 4h30a4 4 0 0 0 4-4V14a4 4 0 0 0-4-4ZM16.6 18.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm7.1 14H9.5c.8-3.1 3.3-5 7.1-5s6.3 1.9 7.1 5ZM37.5 29h-9.8v-3.1h9.8V29Zm0-7h-9.8v-3.1h9.8V22Z" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 35.9a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Zm11.2-7.1a2.2 2.2 0 0 0-3.1 0 11.5 11.5 0 0 0-16.2 0 2.2 2.2 0 1 0 3.1 3.1 7.1 7.1 0 0 1 10 0 2.2 2.2 0 1 0 3.1-3.1Zm7.3-7.5a25.8 25.8 0 0 0-37 0 2.2 2.2 0 1 0 3.1 3.1 21.4 21.4 0 0 1 30.8 0 2.2 2.2 0 0 0 3.1-3.1Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 4 9.8 9.9v10.8c0 10 6 19.1 14.2 22.9 8.2-3.8 14.2-12.9 14.2-22.9V9.9L24 4Zm0 34.6c-5.8-3.2-9.9-10.2-9.9-17.9v-7.9L24 8.7v29.9Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 5.5A18.5 18.5 0 1 0 24 42.5 18.5 18.5 0 0 0 24 5.5Zm1.9 19.2 7 4.1-1.9 3.2-8.9-5.3V14.2h3.8v10.5Z" />
    </svg>
  );
}

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.6 4.2 4 2.8l17.4 17.4-1.4 1.4-3-3A12.3 12.3 0 0 1 12 19C6.7 19 3.1 15.4 1.7 12c.6-1.5 1.7-3 3.1-4.2L2.6 4.2Zm6.1 6.1a3.7 3.7 0 0 0 5 5l-1.6-1.6a1.6 1.6 0 0 1-2-2l-1.4-1.4ZM12 5c5.3 0 8.9 3.6 10.3 7-.5 1.2-1.3 2.4-2.4 3.5l-3-3A4.8 4.8 0 0 0 10.7 6.3L8.4 4.1A12.2 12.2 0 0 1 12 5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5.3 0 8.9 3.6 10.3 7-1.4 3.4-5 7-10.3 7s-8.9-3.6-10.3-7C3.1 8.6 6.7 5 12 5Zm0 11.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0-2.3a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Z" />
    </svg>
  );
}

function FeatureCard({ icon, label }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <p>{label}</p>
    </div>
  );
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
  );
}

// ─── Role not yet implemented ──────────────────────────────────────────────────
function RoleNotImplemented({ role, onLogout }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'Poppins, sans-serif',
        gap: '0.75rem',
        color: '#64748b',
      }}
    >
      <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>
        Dashboard untuk role <code>{role}</code> belum tersedia.
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem' }}>
        Halaman ini sedang dalam pengembangan di branch lain.
      </p>
      <button
        type="button"
        onClick={onLogout}
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1.25rem',
          border: 'none',
          borderRadius: '8px',
          background: '#0284c7',
          color: '#fff',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Kembali ke Login
      </button>
    </div>
  );
}

// ── Forgot Password Modal ─────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose, theme }) {
  const [role, setRole]       = useState('siswa')
  const [idValue, setIdValue] = useState('')
  const dark = theme === 'dark'
  const label       = role === 'siswa' ? 'NISN' : 'NIP'
  const roleLabel   = role === 'siswa' ? 'Siswa' : 'Guru / Staff'
  const placeholder = role === 'siswa' ? 'Contoh: 0012345678' : 'Contoh: 198501012010011001'

  const waMsg = idValue
    ? `Halo Admin Presensi Lab SMKS Rajasa Surabaya 🙏\n\nSaya membutuhkan bantuan reset password akun sistem presensi saya.\n\n📋 Data Saya:\n• Peran  : ${roleLabel}\n• ${label} : ${idValue}\n\nMohon bantuannya untuk mereset password ke password default.\n\nTerima kasih 🙏`
    : ''

  const emailSubject = `[Reset Password] ${roleLabel} - ${label} ${idValue}`
  const emailBody    = idValue
    ? `Kepada Yth.\nAdmin Sistem Presensi Lab SMKS Rajasa Surabaya\n\nDengan hormat,\nSaya membutuhkan bantuan untuk reset password akun sistem presensi lab.\n\nData saya:\n- Peran  : ${roleLabel}\n- ${label} : ${idValue}\n\nMohon bantuannya untuk mereset password ke password default.\n\nTerima kasih atas bantuan dan perhatiannya.`
    : ''

  const openWA = () => {
    if (!idValue) return
    window.open(`https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waMsg)}`, '_blank')
  }
  const openEmail = () => {
    if (!idValue) return
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
  }

  const bg      = dark ? '#1e293b' : '#ffffff'
  const bgInput = dark ? '#0f172a' : '#f8fafc'
  const border  = dark ? '#334155' : '#e2e8f0'
  const txtMain = dark ? '#f1f5f9' : '#1e293b'
  const txtSub  = dark ? '#94a3b8' : '#64748b'

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:bg, borderRadius:'18px', padding:'28px 24px', width:'100%', maxWidth:'440px', boxShadow:'0 24px 64px rgba(0,0,0,0.28)', position:'relative' }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, color:txtMain }}>Lupa Password?</h3>
            <p style={{ margin:'4px 0 0', fontSize:'0.78rem', color:txtSub }}>
              Isi identitasmu agar admin bisa verifikasi dan mereset password
            </p>
          </div>
          <button type="button" onClick={onClose}
            style={{ background:'none', border:'none', cursor:'pointer', color:txtSub, fontSize:'1.5rem', lineHeight:1, padding:'2px 6px' }}>×</button>
        </div>

        {/* Role selector */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
          {['siswa','guru'].map(r => (
            <button key={r} type="button"
              onClick={() => { setRole(r); setIdValue('') }}
              style={{
                flex:1, padding:'10px 8px', borderRadius:'10px',
                border:`2px solid ${r === role ? '#6366f1' : border}`,
                background: r === role ? (dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.07)') : 'transparent',
                color: r === role ? '#6366f1' : txtSub,
                fontFamily:'inherit', fontWeight: r === role ? 600 : 400,
                fontSize:'0.85rem', cursor:'pointer', transition:'all 0.15s',
              }}
            >
              {r === 'siswa' ? '🎒 Siswa' : '📚 Guru / Staff'}
            </button>
          ))}
        </div>

        {/* ID Input */}
        <div style={{ marginBottom:'16px' }}>
          <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:txtSub, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            Masukkan {label} Anda
          </label>
          <input
            type="text" value={idValue}
            onInput={e => setIdValue(e.currentTarget.value.trim())}
            placeholder={placeholder}
            style={{
              width:'100%', padding:'11px 14px', borderRadius:'10px',
              border:`1.5px solid ${idValue ? '#6366f1' : border}`,
              background:bgInput, color:txtMain,
              fontSize:'0.9rem', fontFamily:'inherit',
              outline:'none', boxSizing:'border-box', transition:'border-color 0.15s',
            }}
          />
        </div>

        {/* Preview pesan — muncul setelah isi ID */}
        {idValue && (
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:txtSub, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Preview pesan (otomatis)
            </label>
            <textarea readOnly value={waMsg} rows={6}
              style={{
                width:'100%', padding:'10px 14px', borderRadius:'10px',
                border:`1.5px solid ${border}`,
                background:bgInput, color:txtSub,
                fontSize:'0.74rem', fontFamily:'inherit',
                resize:'none', boxSizing:'border-box', lineHeight:1.6,
              }}
            />
          </div>
        )}

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
          <div style={{ flex:1, height:1, background:border }}/>
          <span style={{ fontSize:'0.73rem', color:txtSub, whiteSpace:'nowrap' }}>Hubungi admin via</span>
          <div style={{ flex:1, height:1, background:border }}/>
        </div>

        {/* Channel buttons */}
        <div style={{ display:'flex', gap:'10px' }}>
          <button type="button" onClick={openWA} disabled={!idValue}
            style={{
              flex:1, padding:'12px 8px', borderRadius:'10px', border:'none',
              background: idValue ? '#25d366' : (dark ? '#0f172a' : '#f1f5f9'),
              color: idValue ? '#fff' : (dark ? '#334155' : '#cbd5e1'),
              fontFamily:'inherit', fontWeight:600, fontSize:'0.85rem',
              cursor: idValue ? 'pointer' : 'not-allowed',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
              transition:'all 0.15s', opacity: idValue ? 1 : 0.5,
            }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button type="button" onClick={openEmail} disabled={!idValue}
            style={{
              flex:1, padding:'12px 8px', borderRadius:'10px', border:'none',
              background: idValue ? '#6366f1' : (dark ? '#0f172a' : '#f1f5f9'),
              color: idValue ? '#fff' : (dark ? '#334155' : '#cbd5e1'),
              fontFamily:'inherit', fontWeight:600, fontSize:'0.85rem',
              cursor: idValue ? 'pointer' : 'not-allowed',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
              transition:'all 0.15s', opacity: idValue ? 1 : 0.5,
            }}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="3"/>
              <polyline points="2,4 12,13 22,4"/>
            </svg>
            Email
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Root App ──────────────────────────────────────────────────────────────────
export function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem(THEME_KEY) || 'light';
  });

  const LANG_LABELS_APP = { id: 'ID', jw: 'JW', md: 'MD' }
  const LANG_NAMES_APP  = { id: 'Indonesia', jw: 'Basa Jawa', md: 'Basa Madura' }
  const LANG_FLAGS_APP  = { id: '🇮🇩', jw: '🏛️', md: '🏝️' }
  const LANGS_APP       = ['id', 'jw', 'md']
  const [lang, setLang]         = useState(() => localStorage.getItem('rajasa-lang') || 'id')
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)
  useEffect(() => {
    if (!langOpen) return
    const close = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [langOpen])
  const changeLang = (l) => { setLang(l); localStorage.setItem('rajasa-lang', l); setLangOpen(false) }
  const tl = TLogin[lang] || TLogin.id

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authUser, setAuthUser] = useState(() => auth.getUser());
  const [loginError, setLoginError] = useState('');
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [twoFaPending,   setTwoFaPending]   = useState(null);  // { tempToken } | null
  const [twoFaCode,      setTwoFaCode]      = useState('');
  const [twoFaLoading,   setTwoFaLoading]   = useState(false);
  const [twoFaError,     setTwoFaError]     = useState('');
  const [forgotOpen,     setForgotOpen]     = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    auth.clearAuth();
    setAuthUser(null);
    setUsername('');
    setPassword('');
    setLoginError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const res = await authApi.login(username, password);

      // Backend shape: { success, message, data: { token, user } }
      if (!res.success) {
        throw new Error(res.message || 'Login gagal.');
      }

      // Cek apakah butuh 2FA
      if (res.data?.requires_2fa) {
        setTwoFaPending({ tempToken: res.data.temp_token });
        return;
      }

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        throw new Error('Response tidak valid dari server.');
      }

      // Simpan ke localStorage via auth utility
      auth.setToken(token);
      auth.setUser(user);
      setAuthUser(user);
    } catch (error) {
      setLoginError(error.message || 'Tidak bisa menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTwoFaVerify(e) {
    e.preventDefault();
    if (!twoFaCode || twoFaCode.length !== 6) { setTwoFaError('Masukkan 6 digit kode.'); return; }
    setTwoFaLoading(true); setTwoFaError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: twoFaPending.tempToken, code: twoFaCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Kode salah.');
      const token = data.data?.token;
      const user  = data.data?.user;
      if (!token || !user) throw new Error('Response tidak valid.');
      auth.setToken(token);
      auth.setUser(user);
      setAuthUser(user);
      setTwoFaPending(null);
    } catch (err) {
      setTwoFaError(err.message);
    } finally {
      setTwoFaLoading(false);
    }
  }

  // ── 2FA verification screen ──
  if (twoFaPending) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--rjs-bg, #f8fafc)', padding: '1.5rem',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{
          background: 'var(--rjs-surface, #fff)', borderRadius: 16,
          border: '1px solid var(--rjs-border, #e2e8f0)',
          padding: '2rem', width: '100%', maxWidth: 380,
          boxShadow: '0 4px 24px rgba(0,0,0,.08)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: 'var(--rjs-text, #0f172a)' }}>
              Verifikasi Dua Faktor
            </h2>
            <p style={{ fontSize: 13, color: 'var(--rjs-text-muted, #64748b)', margin: 0, lineHeight: 1.5 }}>
              Buka Google Authenticator dan masukkan kode 6 digit untuk akun Presensi Rajasa.
            </p>
          </div>
          <form onSubmit={handleTwoFaVerify}>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={twoFaCode}
              onInput={e => { setTwoFaCode(e.currentTarget.value.replace(/\D/g,'').slice(0,6)); setTwoFaError(''); }}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: 10, marginBottom: 8,
                border: `1px solid ${twoFaError ? '#fca5a5' : 'var(--rjs-border, #e2e8f0)'}`,
                fontFamily: "'Poppins', sans-serif", fontSize: 24, textAlign: 'center',
                letterSpacing: '0.3em', background: 'var(--rjs-surface, #fff)',
                color: 'var(--rjs-text, #0f172a)', boxSizing: 'border-box',
              }}
              autoFocus
            />
            {twoFaError && (
              <p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 8px', textAlign: 'center' }}>
                {twoFaError}
              </p>
            )}
            <button type="submit" disabled={twoFaLoading || twoFaCode.length !== 6} style={{
              width: '100%', padding: '0.625rem', borderRadius: 10, border: 'none',
              background: twoFaCode.length === 6 ? '#1e40af' : '#94a3b8',
              color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 600,
              fontSize: 14, cursor: twoFaCode.length === 6 ? 'pointer' : 'not-allowed',
              marginBottom: 8,
            }}>
              {twoFaLoading ? '⏳ Memverifikasi...' : 'Verifikasi'}
            </button>
            <button type="button" onClick={() => { setTwoFaPending(null); setTwoFaCode(''); setTwoFaError(''); }} style={{
              width: '100%', padding: '0.5rem', borderRadius: 10, background: 'transparent',
              border: '1px solid var(--rjs-border, #e2e8f0)', fontFamily: "'Poppins', sans-serif",
              fontSize: 13, cursor: 'pointer', color: 'var(--rjs-text-muted, #64748b)',
            }}>
              ← Kembali ke Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Route by role ──
  if (authUser) {
    const role = authUser.user_type;

    if (role === 'siswa') {
      return <DashboardSiswa user={authUser} onLogout={handleLogout} />;
    }

    if (role === 'guru') {
      return <DashboardGuru user={authUser} onLogout={handleLogout} />;
    }

    if (role === 'ortu' || role === 'wali_murid') {
      return <DashboardOrtu user={authUser} onLogout={handleLogout} />;
    }

    if (role === 'admin') {
      return <DashboardAdmin user={authUser} onLogout={handleLogout} />;
    }

    return <RoleNotImplemented role={authUser.user_type} onLogout={handleLogout} />;
  }

  // ── Login page ──
  return (
    <main className="login-page">
      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} theme={theme} />}
      <section className="login-shell" aria-label="Halaman login sistem presensi lab">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          style={{ width:36, height:36 }}
          aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
        >
          <SunMoonIcon theme={theme} />
        </button>
        <div style={{ position:'relative' }} ref={langRef}>
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLangOpen(o => !o)}
            title="Ganti bahasa / Change language"
            aria-label="Ganti bahasa"
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0 }}>
              <path d="M4 17L7.5 8L11 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.4 14h4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="13.5" y1="5" x2="13.5" y2="19" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.35"/>
              <path d="M15.5 8.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M18 8.5v2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M15.5 13.5c1.2 1.8 2.5 2.7 2.5 2.7s1.3-0.9 2.5-2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16.3 17.5h3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>{LANG_LABELS_APP[lang]}</span>
          </button>
          {langOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 6px)', right:0,
              background: theme === 'dark' ? '#1e293b' : '#ffffff',
              border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius:'12px', boxShadow:'0 10px 32px rgba(0,0,0,0.18)',
              overflow:'hidden', minWidth:'168px', zIndex:999,
            }}>
              {LANGS_APP.map(l => (
                <button key={l} type="button" onClick={() => changeLang(l)}
                  style={{
                    display:'flex', alignItems:'center', gap:'9px', width:'100%',
                    padding:'10px 14px', border:'none', cursor:'pointer',
                    fontFamily:'inherit', textAlign:'left', fontSize:'0.83rem',
                    background: l === lang ? (theme==='dark' ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.08)') : 'transparent',
                    fontWeight: l === lang ? 600 : 400,
                    color: l === lang ? (theme==='dark' ? '#818cf8' : '#4f46e5') : (theme==='dark' ? '#cbd5e1' : '#475569'),
                  }}
                >
                  <span style={{ flex:1 }}>{LANG_NAMES_APP[l]}</span>
                  {l === lang && <span style={{ fontWeight:700 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="brand-panel">
          <div className="brand-content">
            <img src="/images/logo/Rajasa-Logo.png" alt="Logo SMK Rajasa Surabaya" className="main-logo-img" />
            <div className="brand-heading">
              <h1>{tl.brand_title}</h1>
              <p>{tl.brand_sub}</p>
            </div>
            <div className="feature-list" aria-label="Keunggulan sistem">
              <FeatureCard icon={<WifiIcon />} label={tl.feat_iot} />
              <FeatureCard icon={<ShieldIcon />} label={tl.feat_secure} />
              <FeatureCard icon={<ClockIcon />} label={tl.feat_realtime} />
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-main">
            <div className="form-content">
              <header className="login-header">
                <h2>{tl.welcome}</h2>
                <p>{tl.welcome_sub}</p>
              </header>

              <form className="login-form" onSubmit={handleSubmit}>
                <FormField
                  id="username"
                  label="Username"
                  placeholder={tl.ph_username}
                  icon={<UserIcon />}
                  value={username}
                  onInput={(event) => setUsername(event.currentTarget.value)}
                />
                <FormField
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={tl.ph_password}
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
                    <span>{tl.remember}</span>
                  </label>
                  <a href="#" className="forgot-link" onClick={e => { e.preventDefault(); setForgotOpen(true) }}>
                    {tl.forgot}
                  </a>
                </div>

                {loginError && <p className="login-alert">{loginError}</p>}

                <button type="submit" className="login-button" disabled={isSubmitting}>
                  {isSubmitting ? tl.processing : tl.login_btn}
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
  );
}
