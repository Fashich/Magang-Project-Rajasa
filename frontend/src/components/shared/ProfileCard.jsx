import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import api from '../../utils/api.js'

// ── Fallback foto — ikon orang SVG ────────────────────────────────────────────
function NoPhotoIcon({ size = 90 }) {
  return (
    <svg viewBox="0 0 90 90" fill="none" width={size} height={size}>
      <rect width="90" height="90" fill="#cbd5e1"/>
      <circle cx="45" cy="34" r="18" fill="#94a3b8"/>
      <ellipse cx="45" cy="78" rx="28" ry="18" fill="#94a3b8"/>
    </svg>
  )
}

// ── Baris field gaya KTP ──────────────────────────────────────────────────────
function KTPRow({ label, value, editable, onSave, dark }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value ?? '')

  const handleSave = async () => { await onSave?.(val); setEditing(false) }

  const labelStyle = {
    width: '38%', fontSize: '0.72rem', fontWeight: 600,
    color: dark ? '#64748b' : '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    flexShrink: 0,
  }
  const valueStyle = {
    flex: 1, fontSize: '0.84rem',
    color: dark ? '#e2e8f0' : '#1e293b',
    wordBreak: 'break-word',
  }
  const emptyStyle = { ...valueStyle, color: dark ? '#334155' : '#cbd5e1', fontStyle: 'italic' }

  return (
    <div style={{ display:'flex', alignItems:'flex-start', padding:'5px 0',
                  borderBottom: `1px solid ${dark ? '#1e293b' : '#f1f5f9'}` }}>
      <span style={labelStyle}>{label}</span>
      <span style={{ color: dark ? '#475569' : '#cbd5e1', marginRight:'8px', fontSize:'0.8rem' }}>:</span>
      {editing ? (
        <div style={{ flex:1, display:'flex', gap:'6px', alignItems:'center' }}>
          <input type="text" value={val} onInput={e => setVal(e.currentTarget.value)}
            style={{ flex:1, padding:'3px 8px', borderRadius:'6px', fontSize:'0.82rem',
                     border:'1.5px solid #6366f1', background: dark ? '#0f172a' : '#f8fafc',
                     color: dark ? '#f1f5f9' : '#1e293b', fontFamily:'inherit', outline:'none' }}/>
          <button onClick={handleSave}
            style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:'6px',
                     padding:'3px 10px', fontSize:'0.75rem', cursor:'pointer', fontFamily:'inherit' }}>
            Simpan
          </button>
          <button onClick={() => { setVal(value ?? ''); setEditing(false) }}
            style={{ background:'none', border:'none', cursor:'pointer',
                     color: dark ? '#64748b' : '#94a3b8', fontSize:'0.8rem', fontFamily:'inherit' }}>
            ✕
          </button>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
          <span style={value ? valueStyle : emptyStyle}>{value || '—'}</span>
          {editable && (
            <button onClick={() => setEditing(true)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#6366f1',
                       fontSize:'0.72rem', fontWeight:600, flexShrink:0, fontFamily:'inherit',
                       padding:'2px 6px', borderRadius:'4px',
                       border:'1px solid #6366f1' }}>
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── ProfileCard utama — modal tengah layar gaya KTP ───────────────────────────
export default function ProfileCard({ onClose, theme, userType }) {
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileInputRef = useRef(null)
  const dark = theme === 'dark'

  const isGuru  = ['guru','staff','admin','intern'].includes(userType)
  const isSiswa = userType === 'siswa'

  // Fetch profil
  useEffect(() => {
    api.get('/profile/me')
      .then(res => setProfile(res.data?.profile ?? null))
      .catch(() => setError('Gagal memuat profil.'))
      .finally(() => setLoading(false))
  }, [])

  // Upload foto
  const handleFotoChange = async (e) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    setUploadErr('')
    if (file.size > 10 * 1024 * 1024) { setUploadErr('Maksimal 10 MB.'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      const res = await api.postForm('/profile/foto', fd)
      const newUrl = res.data?.foto_url
      if (newUrl) setProfile(p => ({ ...p, foto_url: newUrl + '?t=' + Date.now() }))
    } catch (err) {
      setUploadErr(err?.response?.data?.message ?? 'Upload gagal.')
    } finally {
      setUploading(false)
      e.currentTarget.value = ''
    }
  }

  const handleSaveKontak = useCallback(async (field, value) => {
    await api.put('/profile/kontak', { [field]: value })
    setProfile(p => ({ ...p, [field]: value }))
  }, [])

  // ── Warna & style ─────────────────────────────────────────────────────────
  const cardBg    = dark ? '#1e293b' : '#ffffff'
  const headerBg  = dark ? '#0f2545' : '#1e3a6e'
  const bodyBg    = dark ? '#1e293b' : '#ffffff'
  const photoBg   = dark ? '#0f172a' : '#f1f5f9'

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'16px', fontFamily:'inherit',
      }}
    >
      {/* Card KTP */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: cardBg,
          borderRadius:'16px',
          width:'100%', maxWidth:'620px',
          boxShadow:'0 32px 80px rgba(0,0,0,0.35)',
          overflow:'hidden',
          position:'relative',
        }}
      >
        {/* ── Header bar ── */}
        <div style={{
          background: headerBg,
          padding:'14px 20px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            {/* Logo Rajasa */}
            <div style={{
              width:'36px', height:'36px', borderRadius:'8px',
              background:'#ffffff',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink: 0, overflow:'hidden', padding:'2px',
            }}>
              <img src="/images/logo/Rajasa-Logo.png" alt="Logo Rajasa"
                style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:'0.92rem', letterSpacing:'0.03em' }}>
                SMKS RAJASA SURABAYA
              </div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.7rem', letterSpacing:'0.06em' }}>
                {isGuru ? 'KARTU IDENTITAS GURU / STAFF' : 'KARTU IDENTITAS SISWA'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
                     color:'#fff', width:'30px', height:'30px', borderRadius:'50%',
                     fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>

        {/* ── Body: foto kiri + data kanan ── */}
        <div style={{ display:'flex', gap:0, background: bodyBg }}>

          {/* Kolom foto */}
          <div style={{
            width:'170px', flexShrink:0,
            background: dark ? '#0f172a' : '#f8fafc',
            borderRight: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'24px 16px', gap:'12px',
          }}>
            {/* Foto container — rasio 3:4, stretch bukan crop */}
            <div
              onClick={() => fileInputRef.current?.click()}
              title="Klik untuk ganti foto"
              style={{
                width:'111px', height:'148px',
                background: photoBg,
                borderRadius:'6px',
                overflow:'hidden',
                cursor:'pointer',
                position:'relative',
                border: `2px solid ${dark ? '#334155' : '#e2e8f0'}`,
                flexShrink: 0,
              }}
            >
              {loading ? null : profile?.foto_url ? (
                <img src={profile.foto_url} alt="Foto profil"
                  style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }}/>
              ) : (
                <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                              color: dark ? '#475569' : '#94a3b8' }}>
                  <NoPhotoIcon size={100}/>
                </div>
              )}
              {/* Hover overlay */}
              <div style={{
                position:'absolute', inset:0, background:'rgba(0,0,0,0.45)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px',
                opacity: uploading ? 1 : 0, transition:'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => !uploading && (e.currentTarget.style.opacity = '0')}
              >
                <span style={{ fontSize:'1.4rem' }}>📷</span>
                <span style={{ color:'#fff', fontSize:'0.68rem', fontWeight:600, textAlign:'center', padding:'0 4px' }}>
                  {uploading ? 'Mengupload…' : 'Ganti Foto'}
                </span>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleFotoChange} style={{ display:'none' }}/>

            <button type="button" onClick={() => fileInputRef.current?.click()}
              style={{
                background:'none', border:`1.5px solid ${dark ? '#334155' : '#e2e8f0'}`,
                borderRadius:'20px', padding:'5px 14px', fontSize:'0.72rem',
                color: dark ? '#94a3b8' : '#64748b', cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:'5px',
              }}>
              📷 Ganti Foto
            </button>

            {uploadErr && (
              <div style={{ color:'#ef4444', fontSize:'0.7rem', textAlign:'center' }}>{uploadErr}</div>
            )}

            {/* Status badge */}
            {profile && (
              <div style={{
                padding:'4px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:600,
                background: profile.status === 'aktif'
                  ? (dark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)')
                  : (dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'),
                color: profile.status === 'aktif' ? '#16a34a' : '#dc2626',
                border: `1px solid ${profile.status === 'aktif' ? '#22c55e' : '#ef4444'}`,
              }}>
                ● {(profile.status ?? 'aktif').toUpperCase()}
              </div>
            )}
          </div>

          {/* Kolom data */}
          <div style={{ flex:1, padding:'20px 22px', minWidth:0 }}>
            {loading && (
              <div style={{ color: dark ? '#64748b' : '#94a3b8', fontSize:'0.85rem', paddingTop:'20px' }}>
                Memuat profil…
              </div>
            )}
            {error && (
              <div style={{ color:'#ef4444', fontSize:'0.85rem', paddingTop:'20px' }}>{error}</div>
            )}

            {profile && !loading && (
              <>
                {/* Nama besar */}
                <div style={{
                  fontWeight:700, fontSize:'1.1rem',
                  color: dark ? '#f1f5f9' : '#1e293b',
                  marginBottom:'14px', lineHeight:1.3,
                  borderBottom:`2px solid ${dark ? '#334155' : '#e2e8f0'}`,
                  paddingBottom:'10px',
                }}>
                  {profile.nama_lengkap}
                  <span style={{ display:'block', fontSize:'0.75rem', fontWeight:400,
                                 color: dark ? '#64748b' : '#94a3b8', marginTop:'2px' }}>
                    {isGuru ? (profile.jenis_user ?? 'Guru') : 'Siswa'}
                  </span>
                </div>

                {/* Field guru */}
                {isGuru && (
                  <>
                    <KTPRow label="NIP"            value={profile.nip}                editable={false} dark={dark}/>
                    <KTPRow label="Username"        value={profile.username}           editable={false} dark={dark}/>
                    <KTPRow label="Jabatan"         value={profile.jabatan}            editable={false} dark={dark}/>
                    <KTPRow label="Mata Pelajaran"  value={profile.mapel_pengampu}     editable={false} dark={dark}/>
                    <KTPRow label="Status Pegawai"  value={profile.status_kepegawaian} editable={false} dark={dark}/>
                    <KTPRow label="Email"           value={profile.email}              editable={true}
                      onSave={v => handleSaveKontak('email', v)} dark={dark}/>
                    <KTPRow label="No. HP"          value={profile.no_telp}            editable={true}
                      onSave={v => handleSaveKontak('no_telp', v)} dark={dark}/>
                  </>
                )}

                {/* Field siswa */}
                {isSiswa && (
                  <>
                    <KTPRow label="NISN"     value={profile.nisn}                    editable={false} dark={dark}/>
                    <KTPRow label="NIS"      value={profile.nis}                     editable={false} dark={dark}/>
                    <KTPRow label="Username" value={profile.username}                editable={false} dark={dark}/>
                    <KTPRow label="Jurusan"  value={profile.jurusan}                 editable={false} dark={dark}/>
                    <KTPRow label="Angkatan" value={profile.angkatan?.toString()}    editable={false} dark={dark}/>
                    <KTPRow label="Kelas"    value={profile.kelas_aktif}             editable={false} dark={dark}/>
                    <KTPRow label="Email"    value={profile.email}                   editable={false} dark={dark}/>
                    <KTPRow label="No. HP"   value={profile.no_telp}                 editable={false} dark={dark}/>
                  </>
                )}

                {/* Login terakhir */}
                {profile.last_login_at && (
                  <div style={{ marginTop:'12px', fontSize:'0.7rem',
                                color: dark ? '#475569' : '#cbd5e1', textAlign:'right' }}>
                    Login terakhir:{' '}
                    {new Date(profile.last_login_at).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
