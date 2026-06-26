/**
 * TwoFactorSetup.jsx — Admin 2FA Setup Page
 * Diakses dari AdminLayout nav → Pengaturan → tab 2FA
 *
 * Flow:
 *   1. Cek status 2FA (enabled/disabled)
 *   2. Jika disabled: tampilkan QR code + secret + form verifikasi
 *   3. Jika enabled: tampilkan info + tombol disable
 *
 * @author feature/prd-6-security
 */

import { useState, useEffect, useCallback } from 'preact/hooks'

const API = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
    || localStorage.getItem('auth_token') || ''
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

export default function TwoFactorSetup() {
  const [status,      setStatus]      = useState(null)   // null | { enabled: bool }
  const [setupData,   setSetupData]   = useState(null)   // { secret, qr_url }
  const [step,        setStep]        = useState('idle') // idle | setup | verify | done | disable
  const [code,        setCode]        = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/admin/2fa/status')
      setStatus(res.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  async function handleStartSetup() {
    setLoading(true); setError('')
    try {
      const res = await apiFetch('/admin/2fa/setup')
      setSetupData(res.data)
      setStep('setup')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleEnable() {
    if (!code || code.length !== 6) { setError('Masukkan 6 digit kode.'); return }
    setLoading(true); setError('')
    try {
      await apiFetch('/admin/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ secret: setupData.secret, code }),
      })
      setSuccess('2FA berhasil diaktifkan! Akun Anda sekarang lebih aman.')
      setStep('done')
      await loadStatus()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleDisable() {
    if (!disableCode || disableCode.length !== 6) { setError('Masukkan 6 digit kode.'); return }
    setLoading(true); setError('')
    try {
      await apiFetch('/admin/2fa/disable', {
        method: 'DELETE',
        body: JSON.stringify({ code: disableCode }),
      })
      setSuccess('2FA berhasil dinonaktifkan.')
      setStep('idle')
      setDisableCode('')
      await loadStatus()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const cardStyle = {
    background: 'var(--rjs-surface, #fff)',
    border: '1px solid var(--rjs-border, #e2e8f0)',
    borderRadius: 14,
    padding: '1.5rem',
    maxWidth: 520,
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--rjs-text-muted, #475569)', marginBottom: 4, display: 'block' }
  const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8,
    border: '1px solid var(--rjs-border, #e2e8f0)',
    fontFamily: "'Poppins', sans-serif", fontSize: 14, letterSpacing: '0.2em',
    background: 'var(--rjs-surface, #fff)', color: 'var(--rjs-text, #0f172a)',
  }
  const btnPrimary = {
    padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none',
    background: '#1e40af', color: '#fff', fontFamily: "'Poppins', sans-serif",
    fontWeight: 600, fontSize: 13, cursor: 'pointer',
  }
  const btnDanger = { ...btnPrimary, background: '#dc2626' }
  const btnGhost  = { ...btnPrimary, background: 'transparent',
    color: 'var(--rjs-text-muted, #64748b)', border: '1px solid var(--rjs-border, #e2e8f0)' }

  if (!status) return <div style={{ padding: '2rem', color: 'var(--rjs-text-muted)' }}>⏳ Memuat status 2FA...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--rjs-text, #0f172a)', margin: '0 0 4px' }}>
          🔐 Autentikasi Dua Faktor (2FA)
        </h2>
        <p style={{ fontSize: 13, color: 'var(--rjs-text-muted, #64748b)', margin: 0 }}>
          Tambahkan lapisan keamanan ekstra untuk akun admin Anda.
        </p>
      </div>

      {/* Status banner */}
      <div style={{
        padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
        background: status.enabled ? '#dcfce7' : '#fef3c7',
        color: status.enabled ? '#15803d' : '#92400e',
        border: `1px solid ${status.enabled ? '#86efac' : '#fcd34d'}`,
      }}>
        {status.enabled
          ? '✅ 2FA aktif — akun Anda dilindungi autentikasi dua faktor'
          : '⚠️ 2FA belum aktif — disarankan mengaktifkan untuk keamanan admin'}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2',
          border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13 }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#dcfce7',
          border: '1px solid #86efac', color: '#15803d', fontSize: 13 }}>
          ✅ {success}
        </div>
      )}

      {/* ── 2FA DISABLED: Setup Flow ── */}
      {!status.enabled && step === 'idle' && (
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: 'var(--rjs-text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Setelah diaktifkan, setiap login admin akan meminta kode 6 digit dari aplikasi authenticator di HP Anda.
          </p>
          <ol style={{ fontSize: 13, color: 'var(--rjs-text-muted)', marginBottom: '1rem', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>Install <strong>Google Authenticator</strong> atau <strong>Authy</strong> di HP</li>
            <li>Klik tombol di bawah untuk mendapat QR code</li>
            <li>Scan QR code dengan aplikasi</li>
            <li>Masukkan kode 6 digit untuk konfirmasi</li>
          </ol>
          <button style={btnPrimary} onClick={handleStartSetup} disabled={loading}>
            {loading ? '⏳ Memuat...' : '🔐 Mulai Setup 2FA'}
          </button>
        </div>
      )}

      {!status.enabled && step === 'setup' && setupData && (
        <div style={cardStyle}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--rjs-text)', marginBottom: '1rem' }}>
            📱 Scan QR code dengan Google Authenticator / Authy:
          </p>

          {/* QR Code */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img
              src={setupData.qr_url}
              alt="QR Code 2FA"
              width={200} height={200}
              style={{ border: '4px solid #fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}
            />
          </div>

          {/* Manual secret */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Atau masukkan kode manual di aplikasi:</label>
            <div style={{
              fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.15em',
              background: 'var(--rjs-surface-alt, #f8fafc)', padding: '8px 12px',
              borderRadius: 8, border: '1px solid var(--rjs-border)',
              color: 'var(--rjs-text)', userSelect: 'all',
            }}>
              {setupData.secret}
            </div>
          </div>

          {/* Verify code */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Masukkan 6 digit kode dari aplikasi untuk konfirmasi:</label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={code}
              onInput={e => { setCode(e.currentTarget.value.replace(/\D/g,'').slice(0,6)); setError('') }}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 20, padding: '0.625rem' }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnPrimary} onClick={handleEnable} disabled={loading || code.length !== 6}>
              {loading ? '⏳' : '✅ Aktifkan 2FA'}
            </button>
            <button style={btnGhost} onClick={() => { setStep('idle'); setSetupData(null); setCode('') }}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ── 2FA ENABLED: Status + Disable ── */}
      {status.enabled && step !== 'disable' && (
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: 'var(--rjs-text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            2FA aktif. Setiap login admin memerlukan kode dari aplikasi authenticator.
            <br />Untuk menonaktifkan, masukkan kode dari aplikasi authenticator Anda.
          </p>
          <button style={btnDanger} onClick={() => { setStep('disable'); setError('') }}>
            🗑️ Nonaktifkan 2FA
          </button>
        </div>
      )}

      {status.enabled && step === 'disable' && (
        <div style={{ ...cardStyle, borderColor: '#fca5a5' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: '1rem' }}>
            ⚠️ Menonaktifkan 2FA akan mengurangi keamanan akun Anda.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Masukkan kode dari aplikasi authenticator:</label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={disableCode}
              onInput={e => { setDisableCode(e.currentTarget.value.replace(/\D/g,'').slice(0,6)); setError('') }}
              style={{ ...inputStyle, textAlign: 'center', fontSize: 20, padding: '0.625rem' }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btnDanger} onClick={handleDisable} disabled={loading || disableCode.length !== 6}>
              {loading ? '⏳' : 'Konfirmasi Nonaktifkan'}
            </button>
            <button style={btnGhost} onClick={() => { setStep('idle'); setDisableCode(''); setError('') }}>
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
