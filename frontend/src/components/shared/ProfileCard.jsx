import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import api from '../../utils/api.js'

// ── Fallback jika tidak ada foto ──────────────────────────────────────────────
function NoPhotoIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" width="72" height="72">
      <circle cx="40" cy="40" r="40" fill="currentColor" opacity="0.12"/>
      <circle cx="40" cy="30" r="14" fill="currentColor" opacity="0.4"/>
      <ellipse cx="40" cy="66" rx="22" ry="15" fill="currentColor" opacity="0.4"/>
    </svg>
  )
}

// ── Baris info di card ────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, editable, onSave, dark }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value ?? '')

  const handleSave = async () => {
    await onSave?.(val)
    setEditing(false)
  }

  if (!value && !editable) return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:'10px',
      padding:'8px 0', borderBottom:`1px solid ${dark ? '#1e293b' : '#f1f5f9'}`,
    }}>
      <span style={{ fontSize:'0.95rem', flexShrink:0, marginTop:'1px' }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.68rem', fontWeight:600, color: dark ? '#64748b' : '#94a3b8',
                      textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'2px' }}>
          {label}
        </div>
        <span style={{ fontSize:'0.84rem', color: dark ? '#334155' : '#cbd5e1', fontStyle:'italic' }}>—</span>
      </div>
    </div>
  )

  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:'10px',
      padding:'8px 0', borderBottom:`1px solid ${dark ? '#1e293b' : '#f1f5f9'}`,
    }}>
      <span style={{ fontSize:'0.95rem', flexShrink:0, marginTop:'1px' }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.68rem', fontWeight:600, color: dark ? '#64748b' : '#94a3b8',
                      textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'2px' }}>
          {label}
        </div>
        {editing ? (
          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
            <input
              type="text" value={val}
              onInput={e => setVal(e.currentTarget.value)}
              style={{
                flex:1, padding:'4px 8px', borderRadius:'6px', fontSize:'0.82rem',
                border:`1.5px solid #6366f1`,
                background: dark ? '#0f172a' : '#f8fafc',
                color: dark ? '#f1f5f9' : '#1e293b',
                fontFamily:'inherit', outline:'none',
              }}
            />
            <button onClick={handleSave}
              style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:'6px',
                       padding:'4px 10px', fontSize:'0.75rem', cursor:'pointer', fontFamily:'inherit' }}>
              Simpan
            </button>
            <button onClick={() => { setVal(value ?? ''); setEditing(false) }}
              style={{ background:'transparent', color: dark ? '#64748b' : '#94a3b8', border:'none',
                       cursor:'pointer', fontSize:'0.8rem', fontFamily:'inherit' }}>
              Batal
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'6px' }}>
            <span style={{ fontSize:'0.84rem', color: dark ? '#e2e8f0' : '#334155',
                           wordBreak:'break-word', flex:1 }}>
              {value || <span style={{ color: dark ? '#334155' : '#cbd5e1', fontStyle:'italic' }}>—</span>}
            </span>
            {editable && (
              <button onClick={() => setEditing(true)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#6366f1',
                         fontSize:'0.72rem', fontWeight:600, flexShrink:0, fontFamily:'inherit' }}>
                Edit
              </button>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ── ProfileCard utama ─────────────────────────────────────────────────────────
export default function ProfileCard({ onClose, theme, userType }) {
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const fileInputRef = useRef(null)
  const cardRef      = useRef(null)
  const dark = theme === 'dark'

  // Fetch profile data
  useEffect(() => {
    api.get('/profile/me')
      .then(res => setProfile(res.data?.profile ?? null))
      .catch(() => setError('Gagal memuat profil.'))
      .finally(() => setLoading(false))
  }, [])

  // Click outside → close
  useEffect(() => {
    const handler = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleFotoClick = () => fileInputRef.current?.click()

  const handleFotoChange = async (e) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setUploadErr('')

    // Validasi frontend: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr('Ukuran foto maksimal 10 MB.')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      const res = await api.postForm('/profile/foto', fd)
      const newUrl = res.data?.foto_url
      if (newUrl) {
        setProfile(p => ({ ...p, foto_url: newUrl + '?t=' + Date.now() }))
      }
    } catch (err) {
      setUploadErr(err?.response?.data?.message ?? 'Upload gagal. Coba lagi.')
    } finally {
      setUploading(false)
      e.currentTarget.value = ''
    }
  }

  const handleSaveKontak = useCallback(async (field, value) => {
    await api.put('/profile/kontak', { [field]: value })
    setProfile(p => ({ ...p, [field]: value }))
  }, [])

  // ── Styles ────────────────────────────────────────────────────────────────
  const bg     = dark ? '#1e293b' : '#ffffff'
  const bgTop  = dark ? '#0f172a' : '#f8fafc'
  const txtSub = dark ? '#94a3b8' : '#64748b'

  const isGuru  = ['guru','staff','admin','intern'].includes(userType)
  const isSiswa = userType === 'siswa'

  return (
    <div
      ref={cardRef}
      style={{
        position:'absolute', top:'calc(100% + 10px)', right:0,
        width:'300px', zIndex:999,
        background:bg,
        border: dark ? '1px solid #334155' : '1px solid #e2e8f0',
        borderRadius:'16px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.22)',
        overflow:'hidden',
        fontFamily:'inherit',
      }}
    >
      {/* ── Top area: foto + nama + role ── */}
      <div style={{ background:bgTop, padding:'20px 20px 14px', textAlign:'center', position:'relative' }}>
        <button type="button" onClick={onClose}
          style={{ position:'absolute', top:'10px', right:'12px', background:'none', border:'none',
                   cursor:'pointer', color:txtSub, fontSize:'1.3rem', lineHeight:1 }}>×</button>

        {/* Foto */}
        <div
          onClick={handleFotoClick}
          style={{
            width:'72px', height:'72px', borderRadius:'50%', margin:'0 auto 10px',
            overflow:'hidden', cursor:'pointer', position:'relative',
            background: dark ? '#334155' : '#e2e8f0',
            color: dark ? '#64748b' : '#94a3b8',
            border:`3px solid ${dark ? '#475569' : '#e2e8f0'}`,
          }}
          title="Klik untuk ganti foto"
        >
          {loading ? null : profile?.foto_url ? (
            <img src={profile.foto_url} alt="Foto profil"
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          ) : (
            <NoPhotoIcon/>
          )}
          {/* Overlay kamera */}
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center',
            justifyContent:'center', background:'rgba(0,0,0,0.38)',
            opacity: uploading ? 1 : 0, transition:'opacity 0.2s',
          }}>
            {uploading
              ? <span style={{ color:'#fff', fontSize:'0.7rem' }}>Mengupload...</span>
              : <span style={{ fontSize:'1.2rem' }}>📷</span>
            }
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={handleFotoChange} style={{ display:'none' }}/>

        {/* Tombol ganti foto */}
        <button type="button" onClick={handleFotoClick}
          style={{
            background:'none', border:`1px solid ${dark ? '#334155' : '#e2e8f0'}`,
            borderRadius:'20px', padding:'3px 12px', fontSize:'0.72rem',
            color:txtSub, cursor:'pointer', fontFamily:'inherit', marginBottom:'8px',
          }}>
          📷 {uploading ? 'Mengupload…' : 'Ganti Foto'}
        </button>

        {uploadErr && (
          <div style={{ color:'#ef4444', fontSize:'0.73rem', marginTop:'4px' }}>{uploadErr}</div>
        )}

        {loading ? (
          <div style={{ color:txtSub, fontSize:'0.83rem' }}>Memuat profil…</div>
        ) : error ? (
          <div style={{ color:'#ef4444', fontSize:'0.83rem' }}>{error}</div>
        ) : profile ? (
          <>
            <div style={{ fontWeight:700, fontSize:'0.97rem', color: dark ? '#f1f5f9' : '#1e293b', lineHeight:1.3 }}>
              {profile.nama_lengkap}
            </div>
            <div style={{ fontSize:'0.76rem', color:txtSub, marginTop:'3px' }}>
              {isGuru ? (profile.jabatan ?? profile.jenis_user) : (profile.kelas_aktif ?? 'Siswa')}
              {' · '}
              <span style={{ color: profile.status === 'aktif' ? '#22c55e' : '#ef4444' }}>
                ● {profile.status}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Info rows ── */}
      {profile && !loading && (
        <div style={{ padding:'4px 16px 12px', maxHeight:'340px', overflowY:'auto' }}>



          {isGuru && (
            <>
              <InfoRow icon="🪪" label="NIP"              value={profile.nip}                editable={false} dark={dark}/>
              <InfoRow icon="👤" label="Username"         value={profile.username}           editable={false} dark={dark}/>
              <InfoRow icon="🏛️"  label="Jabatan"         value={profile.jabatan}            editable={false} dark={dark}/>
              <InfoRow icon="📚" label="Mata Pelajaran"   value={profile.mapel_pengampu}     editable={false} dark={dark}/>
              <InfoRow icon="📋" label="Status Pegawai"   value={profile.status_kepegawaian} editable={false} dark={dark}/>
              <InfoRow icon="📧" label="Email"            value={profile.email}              editable={true}
                onSave={v => handleSaveKontak('email', v)} dark={dark}/>
              <InfoRow icon="📱" label="No. HP"           value={profile.no_telp}            editable={true}
                onSave={v => handleSaveKontak('no_telp', v)} dark={dark}/>
            </>
          )}

          {isSiswa && (
            <>
              <InfoRow icon="🪪" label="NISN"     value={profile.nisn}        editable={false} dark={dark}/>
              <InfoRow icon="🏫" label="NIS"      value={profile.nis}         editable={false} dark={dark}/>
              <InfoRow icon="👤" label="Username" value={profile.username}    editable={false} dark={dark}/>
              <InfoRow icon="🏛️"  label="Jurusan" value={profile.jurusan}     editable={false} dark={dark}/>
              <InfoRow icon="📅" label="Angkatan" value={profile.angkatan?.toString()} editable={false} dark={dark}/>
              <InfoRow icon="🎒" label="Kelas"    value={profile.kelas_aktif} editable={false} dark={dark}/>
              <InfoRow icon="📧" label="Email"    value={profile.email}       editable={false} dark={dark}/>
              <InfoRow icon="📱" label="No. HP"   value={profile.no_telp}     editable={false} dark={dark}/>
            </>
          )}

          {/* Last login */}
          {profile.last_login_at && (
            <div style={{ marginTop:'8px', fontSize:'0.7rem', color:txtSub, textAlign:'right' }}>
              Login terakhir: {new Date(profile.last_login_at).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
