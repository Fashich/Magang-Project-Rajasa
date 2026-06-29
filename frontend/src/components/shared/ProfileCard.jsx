import { useState, useEffect, useRef } from 'preact/hooks'
import api from '../../utils/api.js'
import auth from '../../utils/auth.js'

// ── Fallback foto ─────────────────────────────────────────────────────────────
function NoPhotoIcon() {
  return (
    <svg viewBox="0 0 90 110" fill="none" width="100%" height="100%">
      <rect width="90" height="110" fill="#cbd5e1"/>
      <circle cx="45" cy="38" r="20" fill="#94a3b8"/>
      <ellipse cx="45" cy="90" rx="30" ry="20" fill="#94a3b8"/>
    </svg>
  )
}

// ── Baris field gaya KTP ──────────────────────────────────────────────────────
function KTPRow({ label, value, editable, editMode, editValue, onEditChange, dark }) {
  const border  = dark ? '#1e293b' : '#f1f5f9'
  const txtMain = dark ? '#e2e8f0' : '#1e293b'
  const txtMute = dark ? '#334155' : '#cbd5e1'
  const txtLbl  = dark ? '#64748b' : '#94a3b8'
  const sep     = dark ? '#475569' : '#cbd5e1'

  return (
    <div style={{ display:'flex', alignItems:'center', padding:'5px 0',
                  borderBottom:`1px solid ${border}`, minHeight:'28px' }}>
      <span style={{ width:'38%', fontSize:'0.68rem', fontWeight:600, color:txtLbl,
                     textTransform:'uppercase', letterSpacing:'0.04em', flexShrink:0 }}>
        {label}
      </span>
      <span style={{ color:sep, marginRight:'8px', fontSize:'0.78rem', flexShrink:0 }}>:</span>
      {editMode && editable ? (
        <input type="text" value={editValue ?? ''} onInput={e => onEditChange(e.currentTarget.value)}
          style={{
            flex:1, padding:'2px 8px', borderRadius:'6px', fontSize:'0.82rem',
            border:'1.5px solid #6366f1', background: dark ? '#0f172a' : '#f8fafc',
            color: dark ? '#f1f5f9' : '#1e293b', fontFamily:'inherit', outline:'none',
          }}/>
      ) : (
        <span style={{ flex:1, fontSize:'0.82rem', color: value ? txtMain : txtMute,
                       fontStyle: value ? 'normal' : 'italic', wordBreak:'break-word' }}>
          {value || '—'}
        </span>
      )}
    </div>
  )
}

// ── ProfileCard utama ─────────────────────────────────────────────────────────
export default function ProfileCard({ onClose, theme, userType }) {
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [isDragging,setIsDragging]= useState(false)
  const [editMode,  setEditMode]  = useState(false)
  const [editData,  setEditData]  = useState({})
  const [saving,    setSaving]    = useState(false)
  const [showQR,    setShowQR]    = useState(false)
  const fileRef = useRef(null)
  const dark    = theme === 'dark'

  const isAdmin = userType === 'admin'
  const isGuru  = ['guru','staff','intern'].includes(userType)
  const isSiswa = userType === 'siswa'

  const qrUrl    = `${window.location.origin}/profile-view.html?t=${auth.getToken() ?? ''}`
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&color=${dark?'e2e8f0':'1e293b'}&bgcolor=${dark?'1e293b':'ffffff'}&data=${encodeURIComponent(qrUrl)}`

  useEffect(() => {
    api.get('/profile/me')
      .then(r => setProfile(r.data?.profile ?? null))
      .catch(() => setError('Gagal memuat profil.'))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = () => {
    setEditData({
      nama_lengkap:   profile?.nama_lengkap   ?? '',
      nip:            profile?.nip            ?? '',
      jabatan:        profile?.jabatan         ?? '',
      mapel_pengampu: profile?.mapel_pengampu  ?? '',
      email:          profile?.email           ?? '',
      no_telp:        profile?.no_telp         ?? '',
    })
    setEditMode(true)
    setShowQR(false)
    setUploadErr('')
  }

  const cancelEdit = () => { setEditMode(false); setUploadErr('') }

  const saveEdit = async () => {
    setSaving(true)
    try {
      const payload = {}
      const allowed = isAdmin
        ? ['nama_lengkap','nip','jabatan','email','no_telp']
        : isGuru
          ? ['nama_lengkap','mapel_pengampu','no_telp']
          : ['nama_lengkap','email','no_telp']
      allowed.forEach(f => { payload[f] = editData[f] })
      await api.put('/profile/kontak', payload)
      setProfile(p => ({ ...p, ...payload }))
      setEditMode(false)
    } catch (e) {
      setUploadErr(e?.message ?? 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  const setF = f => val => setEditData(d => ({ ...d, [f]: val }))

  const uploadFile = async (file) => {
    if (!file) return
    setUploadErr('')
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setUploadErr('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.'); return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr('Ukuran foto maksimal 10 MB.'); return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      const res = await api.postForm('/profile/foto', fd)
      const url = res.data?.foto_url ?? res.foto_url
      if (url) setProfile(p => ({ ...p, foto_url: url + '?t=' + Date.now() }))
    } catch (e) {
      setUploadErr(e?.message ?? 'Upload gagal.')
    } finally {
      setUploading(false)
    }
  }

  const onFileChange  = e => { uploadFile(e.currentTarget.files?.[0]); e.currentTarget.value = '' }
  const onDragOver    = e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (editMode) setIsDragging(true)
  }
  const onDragLeave   = e => {
    // Hanya reset jika mouse benar-benar keluar dari container (bukan pindah ke child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }
  const onDrop = e => {
    e.preventDefault()
    setIsDragging(false)
    if (editMode) uploadFile(e.dataTransfer?.files?.[0])
  }

  // colours
  const cardBg  = dark ? '#1e293b' : '#ffffff'
  const headBg  = dark ? '#0f2545' : '#1e3a6e'
  const colBg   = dark ? '#0f172a' : '#f8fafc'
  const border  = dark ? '#334155' : '#e2e8f0'
  const txtSub  = dark ? '#64748b' : '#94a3b8'

  const subtitle = isSiswa
    ? (profile?.nisn ? `NISN: ${profile.nisn}` : 'Siswa')
    : (profile?.jabatan ?? profile?.jenis_user ?? (isAdmin ? 'Admin' : 'Guru'))

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'16px', fontFamily:'inherit',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:cardBg, borderRadius:'16px', overflow:'hidden',
          width:'100%', maxWidth:'620px',
          boxShadow:'0 32px 80px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div style={{ background:headBg, padding:'14px 20px',
                      display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'8px',
                          overflow:'hidden', flexShrink:0 }}>
              <img src="/images/logo/Rajasa-Logo.png" alt="Logo"
                   style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:'0.92rem', letterSpacing:'0.03em' }}>
                SMKS RAJASA SURABAYA
              </div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.68rem', letterSpacing:'0.06em' }}>
                {isAdmin ? 'KARTU IDENTITAS ADMIN' : isGuru ? 'KARTU IDENTITAS GURU / STAFF' : 'KARTU IDENTITAS SISWA'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
                     color:'#fff', width:'30px', height:'30px', borderRadius:'50%', fontSize:'1rem',
                     display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            ✕
          </button>
        </div>

        {/* Body — foto kiri + data kanan */}
        <div style={{ display:'flex', flexDirection:'row' }}>

          {/* Kolom foto */}
          <div style={{
            width:'160px', flexShrink:0, background:colBg,
            borderRight:`1px solid ${border}`,
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'flex-start', padding:'20px 14px', gap:'10px',
          }}>
            {/* Foto box — rasio 3:4, drag & drop */}
            <div
              onClick={() => editMode && fileRef.current?.click()}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              style={{
                position:'relative', width:'108px', height:'144px',
                borderRadius:'6px', overflow:'hidden', flexShrink:0,
                border: isDragging ? '2px dashed #6366f1' : `2px solid ${border}`,
                background: dark ? '#1e293b' : '#e2e8f0',
                cursor: editMode ? 'pointer' : 'default',
              }}
            >
              {profile?.foto_url ? (
                <img src={profile.foto_url} alt="Foto"
                     style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }}/>
              ) : (
                <NoPhotoIcon/>
              )}

              {/* Overlay drag */}
              {isDragging && (
                <div style={{
                  position:'absolute', inset:0, background:'rgba(99,102,241,0.35)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px',
                  borderRadius:'4px',
                }}>
                  <span style={{ fontSize:'1.8rem' }}>📁</span>
                  <span style={{ color:'#fff', fontSize:'0.7rem', fontWeight:700,
                                 textShadow:'0 1px 3px rgba(0,0,0,0.5)', textAlign:'center' }}>
                    Lepas di sini
                  </span>
                </div>
              )}

              {/* Overlay hint saat edit mode & tidak ada foto & tidak drag */}
              {editMode && !isDragging && !uploading && !profile?.foto_url && (
                <div style={{
                  position:'absolute', inset:0,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px',
                  background:'rgba(0,0,0,0.05)',
                }}>
                  <span style={{ fontSize:'1.4rem' }}>📷</span>
                  <span style={{ fontSize:'0.62rem', color: dark ? '#94a3b8' : '#64748b',
                                 fontWeight:600, textAlign:'center', lineHeight:1.3 }}>
                    Klik atau<br/>drag foto
                  </span>
                </div>
              )}

              {/* Overlay upload */}
              {uploading && (
                <div style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,0.55)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <span style={{ color:'#fff', fontSize:'0.68rem', fontWeight:600 }}>Mengupload…</span>
                </div>
              )}

              {/* Badge + */}
              {editMode && !uploading && (
                <div style={{
                  position:'absolute', bottom:5, right:5,
                  width:'22px', height:'22px', borderRadius:'50%',
                  background:'#6366f1', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1rem', fontWeight:700, lineHeight:1,
                  border:`2px solid ${colBg}`,
                }}>+</div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                   onChange={onFileChange} style={{ display:'none' }}/>

            {/* Status badge */}
            {profile && (
              <div style={{
                padding:'3px 12px', borderRadius:'20px', fontSize:'0.68rem', fontWeight:600,
                background: profile.status === 'aktif'
                  ? (dark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)')
                  : (dark ? 'rgba(239,68,68,0.15)'  : 'rgba(239,68,68,0.1)'),
                color:  profile.status === 'aktif' ? '#16a34a' : '#dc2626',
                border: `1px solid ${profile.status === 'aktif' ? '#22c55e' : '#ef4444'}`,
              }}>
                ● {(profile.status ?? 'aktif').toUpperCase()}
              </div>
            )}

            {/* Tombol */}
            {!loading && !error && !editMode && (
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', width:'100%' }}>
                <button type="button" onClick={startEdit}
                  style={{
                    width:'100%', padding:'6px 0', borderRadius:'20px',
                    border:'1.5px solid #6366f1', background:'transparent',
                    color:'#6366f1', cursor:'pointer', fontFamily:'inherit',
                    fontSize:'0.74rem', fontWeight:600,
                  }}>✏️ Edit</button>
                <button type="button" onClick={() => setShowQR(q => !q)}
                  style={{
                    width:'100%', padding:'6px 0', borderRadius:'20px',
                    border:`1.5px solid ${showQR ? '#6366f1' : border}`,
                    background: showQR ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: showQR ? '#6366f1' : txtSub,
                    cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', fontWeight:600,
                  }}>📱 QR Code</button>
              </div>
            )}

            {!loading && !error && editMode && (
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', width:'100%' }}>
                <button type="button" onClick={saveEdit} disabled={saving}
                  style={{
                    width:'100%', padding:'6px 0', borderRadius:'20px', border:'none',
                    background:'#6366f1', color:'#fff', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily:'inherit', fontSize:'0.74rem', fontWeight:600, opacity: saving ? 0.7 : 1,
                  }}>{saving ? 'Menyimpan…' : '✓ Simpan'}</button>
                <button type="button" onClick={cancelEdit}
                  style={{
                    width:'100%', padding:'6px 0', borderRadius:'20px',
                    border:`1.5px solid ${border}`, background:'transparent',
                    color:txtSub, cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', fontWeight:600,
                  }}>Batal</button>
              </div>
            )}

            {uploadErr && (
              <div style={{ color:'#ef4444', fontSize:'0.68rem', textAlign:'center', lineHeight:1.4 }}>
                {uploadErr}
              </div>
            )}
          </div>

          {/* Kolom data */}
          <div style={{ flex:1, padding:'18px 20px', minWidth:0, overflowY:'auto', maxHeight:'520px' }}>
            {loading && <div style={{ color:txtSub, fontSize:'0.85rem' }}>Memuat profil…</div>}
            {error   && <div style={{ color:'#ef4444', fontSize:'0.85rem' }}>{error}</div>}

            {profile && !loading && (
              <>
                {/* Nama */}
                <div style={{ marginBottom:'12px', paddingBottom:'10px', borderBottom:`2px solid ${border}` }}>
                  {editMode ? (
                    <input type="text" value={editData.nama_lengkap}
                      onInput={e => setF('nama_lengkap')(e.currentTarget.value)}
                      style={{
                        width:'100%', padding:'4px 8px', borderRadius:'8px', fontSize:'0.98rem',
                        fontWeight:700, border:'1.5px solid #6366f1',
                        background: dark ? '#0f172a' : '#f8fafc',
                        color: dark ? '#f1f5f9' : '#1e293b', fontFamily:'inherit', outline:'none',
                      }}/>
                  ) : (
                    <div style={{ fontWeight:700, fontSize:'0.98rem',
                                  color: dark ? '#f1f5f9' : '#1e293b', lineHeight:1.3 }}>
                      {profile.nama_lengkap}
                    </div>
                  )}
                  <div style={{ fontSize:'0.74rem', color:txtSub, marginTop:'3px' }}>{subtitle}</div>
                </div>

                {/* Fields admin */}
                {isAdmin && (<>
                  <KTPRow label="NIP"      value={profile.nip}      editable dark={dark} editMode={editMode} editValue={editData.nip}     onEditChange={setF('nip')}/>
                  <KTPRow label="Username" value={profile.username}  editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Jabatan"  value={profile.jabatan}   editable dark={dark} editMode={editMode} editValue={editData.jabatan}  onEditChange={setF('jabatan')}/>
                  <KTPRow label="Email"    value={profile.email}     editable dark={dark} editMode={editMode} editValue={editData.email}    onEditChange={setF('email')}/>
                  <KTPRow label="No. HP"   value={profile.no_telp}   editable dark={dark} editMode={editMode} editValue={editData.no_telp}  onEditChange={setF('no_telp')}/>
                </>)}

                {/* Fields guru */}
                {isGuru && (<>
                  <KTPRow label="NIP"           value={profile.nip}                editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Username"       value={profile.username}           editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Jabatan"        value={profile.jabatan}            editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Mata Pelajaran" value={profile.mapel_pengampu}     editable dark={dark} editMode={editMode} editValue={editData.mapel_pengampu} onEditChange={setF('mapel_pengampu')}/>
                  <KTPRow label="Status Pegawai" value={profile.status_kepegawaian} editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Email"          value={profile.email}              editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="No. HP"         value={profile.no_telp}            editable dark={dark} editMode={editMode} editValue={editData.no_telp} onEditChange={setF('no_telp')}/>
                </>)}

                {/* Fields siswa */}
                {isSiswa && (<>
                  <KTPRow label="NIS"      value={profile.nis}                  editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Username" value={profile.username}             editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Jurusan"  value={profile.jurusan}              editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Angkatan" value={profile.angkatan?.toString()} editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Kelas"    value={profile.kelas_aktif}          editable={false} dark={dark} editMode={editMode}/>
                  <KTPRow label="Email"    value={profile.email}                editable dark={dark} editMode={editMode} editValue={editData.email}   onEditChange={setF('email')}/>
                  <KTPRow label="No. HP"   value={profile.no_telp}              editable dark={dark} editMode={editMode} editValue={editData.no_telp} onEditChange={setF('no_telp')}/>
                </>)}

                {profile.last_login_at && !editMode && (
                  <div style={{ marginTop:'10px', fontSize:'0.68rem', color:txtSub, textAlign:'right' }}>
                    Login terakhir:{' '}
                    {new Date(profile.last_login_at).toLocaleString('id-ID',{ dateStyle:'medium', timeStyle:'short' })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* QR Panel */}
        {showQR && !editMode && (
          <div style={{
            borderTop:`1px solid ${border}`, padding:'18px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'12px',
            background: dark ? '#0f172a' : '#f8fafc',
          }}>
            <div style={{ fontSize:'0.76rem', fontWeight:600, color:txtSub }}>
              Scan untuk lihat profil di HP
            </div>
            <div style={{ padding:'10px', borderRadius:'12px',
                          background: dark ? '#1e293b' : '#fff', border:`1px solid ${border}` }}>
              <img src={qrImgSrc} alt="QR" width="180" height="180"
                   style={{ display:'block', borderRadius:'4px' }}/>
            </div>
            <div style={{ fontSize:'0.66rem', color:txtSub, textAlign:'center', lineHeight:1.5, maxWidth:'240px' }}>
              ⏱ Berlaku selama sesi akun aktif.<br/>
              Pastikan HP terhubung ke jaringan yang sama.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
