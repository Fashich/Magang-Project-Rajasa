import { useState, useEffect, useRef, useCallback } from 'preact/hooks'
import api from '../../utils/api.js'
import auth from '../../utils/auth.js'

// ── Fallback foto ─────────────────────────────────────────────────────────────
function NoPhotoIcon({ size = 90 }) {
  return (
    <svg viewBox="0 0 90 90" fill="none" width={size} height={size}>
      <rect width="90" height="90" fill="#cbd5e1"/>
      <circle cx="45" cy="34" r="18" fill="#94a3b8"/>
      <ellipse cx="45" cy="78" rx="28" ry="18" fill="#94a3b8"/>
    </svg>
  )
}

// ── KTPRow — read-only atau edit input tergantung editMode ────────────────────
function KTPRow({ label, value, editable, editMode, editValue, onEditChange, dark }) {
  const labelStyle = {
    width:'38%', fontSize:'0.72rem', fontWeight:600,
    color: dark ? '#64748b' : '#94a3b8',
    textTransform:'uppercase', letterSpacing:'0.04em', flexShrink:0,
  }
  const valueStyle  = { flex:1, fontSize:'0.84rem', color: dark ? '#e2e8f0' : '#1e293b', wordBreak:'break-word' }
  const emptyStyle  = { ...valueStyle, color: dark ? '#334155' : '#cbd5e1', fontStyle:'italic' }
  const borderColor = dark ? '#1e293b' : '#f1f5f9'

  return (
    <div style={{ display:'flex', alignItems:'center', padding:'5px 0', borderBottom:`1px solid ${borderColor}` }}>
      <span style={labelStyle}>{label}</span>
      <span style={{ color: dark ? '#475569' : '#cbd5e1', marginRight:'8px', fontSize:'0.8rem' }}>:</span>
      {editMode && editable ? (
        <input
          type="text" value={editValue ?? ''}
          onInput={e => onEditChange(e.currentTarget.value)}
          style={{
            flex:1, padding:'3px 8px', borderRadius:'6px', fontSize:'0.82rem',
            border:`1.5px solid #6366f1`,
            background: dark ? '#0f172a' : '#f8fafc',
            color: dark ? '#f1f5f9' : '#1e293b',
            fontFamily:'inherit', outline:'none',
          }}
        />
      ) : (
        <span style={value ? valueStyle : emptyStyle}>{value || '—'}</span>
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
  const [isDragging, setIsDragging] = useState(false)
  const [editMode,  setEditMode]  = useState(false)
  const [editData,  setEditData]  = useState({})
  const [saving,    setSaving]    = useState(false)
  const [showQR,    setShowQR]    = useState(false)
  const fileInputRef = useRef(null)
  const dark = theme === 'dark'

  const isAdmin = userType === 'admin'
  const isGuru  = ['guru','staff','intern'].includes(userType)
  const isSiswa = userType === 'siswa'
  const isGuruOrAdmin = isAdmin || isGuru

  // QR
  const qrUrl    = `${window.location.origin}/profile-view.html?t=${auth.getToken() ?? ''}`
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&color=${dark?'e2e8f0':'1e293b'}&bgcolor=${dark?'1e293b':'ffffff'}&data=${encodeURIComponent(qrUrl)}`

  // Fetch profil
  useEffect(() => {
    api.get('/profile/me')
      .then(res => setProfile(res.data?.profile ?? null))
      .catch(() => setError('Gagal memuat profil.'))
      .finally(() => setLoading(false))
  }, [])

  // Masuk edit mode — copy data profil ke editData
  const startEdit = () => {
    setEditData({
      nama_lengkap:       profile?.nama_lengkap       ?? '',
      nip:                profile?.nip                ?? '',
      jabatan:            profile?.jabatan             ?? '',
      mapel_pengampu:     profile?.mapel_pengampu      ?? '',
      email:              profile?.email               ?? '',
      no_telp:            profile?.no_telp             ?? '',
    })
    setEditMode(true)
    setShowQR(false)
    setUploadErr('')
  }

  const cancelEdit = () => setEditMode(false)

  const saveEdit = async () => {
    setSaving(true)
    try {
      const payload = {}
      if (isAdmin) {
        ['nama_lengkap','nip','jabatan','email','no_telp'].forEach(f => { payload[f] = editData[f] })
      } else if (isGuru) {
        ['nama_lengkap','mapel_pengampu','no_telp'].forEach(f => { payload[f] = editData[f] })
      } else {
        ['nama_lengkap','email','no_telp'].forEach(f => { payload[f] = editData[f] })
      }
      await api.put('/profile/kontak', payload)
      setProfile(p => ({ ...p, ...payload }))
      setEditMode(false)
    } catch (e) {
      setUploadErr(e?.message ?? 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  const setField = (field) => (val) => setEditData(d => ({ ...d, [field]: val }))

  // ── Upload foto — dipakai oleh file input DAN drag & drop ─────────────────
  const uploadFile = async (file) => {
    if (!file) return
    setUploadErr('')
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setUploadErr('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr('Ukuran foto maksimal 10 MB.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      const res = await api.postForm('/profile/foto', fd)
      const newUrl = res.data?.foto_url ?? res.foto_url
      if (newUrl) setProfile(p => ({ ...p, foto_url: newUrl + '?t=' + Date.now() }))
    } catch (err) {
      setUploadErr(err?.message ?? 'Upload gagal. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const handleFotoChange = (e) => {
    uploadFile(e.currentTarget.files?.[0])
    e.currentTarget.value = ''
  }

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const handleDragOver = (e) => {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (!editMode) return
    const file = e.dataTransfer?.files?.[0]
    uploadFile(file)
  }
  // ── Style helpers ─────────────────────────────────────────────────────────
  const cardBg   = dark ? '#1e293b' : '#ffffff'
  const headerBg = dark ? '#0f2545' : '#1e3a6e'
  const bodyBg   = dark ? '#1e293b' : '#ffffff'
  const photoBg  = dark ? '#0f172a' : '#f8fafc'
  const border   = dark ? '#334155' : '#e2e8f0'
  const txtSub   = dark ? '#64748b' : '#94a3b8'

  // Subtitle bawah nama
  const subtitle = isSiswa
    ? (profile?.nisn ? `NISN: ${profile.nisn}` : 'Siswa')
    : (profile?.jabatan ?? profile?.jenis_user ?? (isAdmin ? 'Admin' : 'Guru'))

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'16px', fontFamily:'inherit',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:cardBg, borderRadius:'16px',
        width:'100%', maxWidth:'620px',
        boxShadow:'0 32px 80px rgba(0,0,0,0.35)',
        overflow:'hidden', position:'relative',
      }}>

        {/* ── Header ── */}
        <div style={{ background:headerBg, padding:'14px 20px',
                      display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'8px',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          flexShrink:0, overflow:'hidden' }}>
              <img src="/images/logo/Rajasa-Logo.png" alt="Logo"
                style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:'0.92rem', letterSpacing:'0.03em' }}>
                SMKS RAJASA SURABAYA
              </div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.7rem', letterSpacing:'0.06em' }}>
                {isAdmin ? 'KARTU IDENTITAS ADMIN' : isGuru ? 'KARTU IDENTITAS GURU / STAFF' : 'KARTU IDENTITAS SISWA'}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
            color:'#fff', width:'30px', height:'30px', borderRadius:'50%',
            fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ display:'flex', background:bodyBg }}>

          {/* Kolom foto */}
          <div style={{
            width:'170px', flexShrink:0, background:photoBg,
            borderRight:`1px solid ${border}`,
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', padding:'20px 14px', gap:'10px',
          }}>

            {/* Foto — rasio 3:4 + drag & drop */}
            <div style={{ position:'relative', cursor: editMode ? 'pointer' : 'default' }}
                 onClick={() => editMode && fileInputRef.current?.click()}
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}>
              <div style={{
                width:'111px', height:'148px', background:photoBg, borderRadius:'6px',
                overflow:'hidden',
                border: isDragging
                  ? '2px dashed #6366f1'
                  : `2px solid ${border}`,
                flexShrink:0,
                transition:'border-color 0.15s',
              }}>
                {loading ? null : profile?.foto_url ? (
                  <img src={profile.foto_url} alt="Foto profil"
                    style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }}/>
                ) : (
                  <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
                                justifyContent:'center', color: dark ? '#475569' : '#94a3b8' }}>
                    <NoPhotoIcon size={100}/>
                  </div>
                )}
                {/* Overlay saat drag */}
                {isDragging && (
                  <div style={{
                    position:'absolute', inset:0, background:'rgba(99,102,241,0.18)',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    gap:'4px', borderRadius:'4px',
                  }}>
                    <span style={{ fontSize:'1.5rem' }}>📁</span>
                    <span style={{ color:'#6366f1', fontSize:'0.7rem', fontWeight:700 }}>Lepas di sini</span>
                  </div>
                )}
                {/* Overlay saat uploading */}
                {uploading && !isDragging && (
                  <div style={{
                    position:'absolute', inset:0, background:'rgba(0,0,0,0.5)',
                    display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px',
                  }}>
                    <span style={{ color:'#fff', fontSize:'0.7rem', fontWeight:600 }}>Mengupload…</span>
                  </div>
                )}
              </div>
              <div style={{
                width:'111px', height:'148px', background:photoBg, borderRadius:'6px',
                overflow:'hidden', border:`2px solid ${border}`, flexShrink:0,
              }}>
                {loading ? null : profile?.foto_url ? (
                  <img src={profile.foto_url} alt="Foto profil"
                    style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }}/>
                ) : (
                  <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
                                justifyContent:'center', color: dark ? '#475569' : '#94a3b8' }}>
                    <NoPhotoIcon size={100}/>
                  </div>
                )}
              {/* Tombol "+" di pojok kanan bawah foto — hanya saat edit mode */}
              {editMode && (
                <div style={{
                  position:'absolute', bottom:4, right:4,
                  width:'24px', height:'24px', borderRadius:'50%',
                  background:'#6366f1', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.1rem', fontWeight:700, lineHeight:1,
                  border:`2px solid ${photoBg}`, boxShadow:'0 2px 6px rgba(0,0,0,0.3)',
                  cursor:'pointer',
                }}>+</div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleFotoChange} style={{ display:'none' }}/>

            {uploadErr && (
              <div style={{ color:'#ef4444', fontSize:'0.7rem', textAlign:'center' }}>{uploadErr}</div>
            )}

            {/* Hint drag & drop — hanya saat edit mode */}
            {editMode && !uploading && (
              <div style={{ fontSize:'0.63rem', color:txtSub, textAlign:'center', lineHeight:1.4 }}>
                Klik foto atau drag &amp; drop<br/>ke area foto di atas
              </div>
            )}

            {/* Status badge */}
            {profile && (
              <div style={{
                padding:'4px 12px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:600,
                background: profile.status === 'aktif'
                  ? (dark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)')
                  : (dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'),
                color: profile.status === 'aktif' ? '#16a34a' : '#dc2626',
                border:`1px solid ${profile.status === 'aktif' ? '#22c55e' : '#ef4444'}`,
              }}>● {(profile.status ?? 'aktif').toUpperCase()}</div>
            )}

            {/* Tombol aksi */}
            {!loading && !error && (
              editMode ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', width:'100%' }}>
                  <button type="button" onClick={saveEdit} disabled={saving}
                    style={{
                      width:'100%', padding:'7px 0', borderRadius:'20px', border:'none',
                      background:'#6366f1', color:'#fff', cursor: saving ? 'not-allowed' : 'pointer',
                      fontFamily:'inherit', fontSize:'0.75rem', fontWeight:600,
                      opacity: saving ? 0.7 : 1,
                    }}>
                    {saving ? 'Menyimpan…' : '✓ Simpan'}
                  </button>
                  <button type="button" onClick={cancelEdit}
                    style={{
                      width:'100%', padding:'6px 0', borderRadius:'20px',
                      border:`1.5px solid ${border}`, background:'transparent',
                      color:txtSub, cursor:'pointer', fontFamily:'inherit', fontSize:'0.75rem', fontWeight:600,
                    }}>Batal</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', width:'100%' }}>
                  <button type="button" onClick={startEdit}
                    style={{
                      width:'100%', padding:'7px 0', borderRadius:'20px',
                      border:`1.5px solid #6366f1`, background:'transparent',
                      color:'#6366f1', cursor:'pointer', fontFamily:'inherit',
                      fontSize:'0.75rem', fontWeight:600,
                    }}>✏️ Edit</button>
                  <button type="button" onClick={() => setShowQR(q => !q)}
                    style={{
                      width:'100%', padding:'6px 0', borderRadius:'20px',
                      border:`1.5px solid ${showQR ? '#6366f1' : border}`,
                      background: showQR ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: showQR ? '#6366f1' : txtSub,
                      cursor:'pointer', fontFamily:'inherit', fontSize:'0.75rem', fontWeight:600,
                    }}>📱 QR Code</button>
                </div>
              )
            )}
          </div>

          {/* Kolom data */}
          <div style={{ flex:1, padding:'18px 20px', minWidth:0 }}>
            {loading && <div style={{ color:txtSub, fontSize:'0.85rem', paddingTop:'20px' }}>Memuat profil…</div>}
            {error   && <div style={{ color:'#ef4444', fontSize:'0.85rem', paddingTop:'20px' }}>{error}</div>}

            {profile && !loading && (
              <>
                {/* Nama — editable di semua role saat edit mode */}
                <div style={{ marginBottom:'14px', borderBottom:`2px solid ${border}`, paddingBottom:'10px' }}>
                  {editMode ? (
                    <input
                      type="text" value={editData.nama_lengkap}
                      onInput={e => setField('nama_lengkap')(e.currentTarget.value)}
                      style={{
                        width:'100%', padding:'4px 8px', borderRadius:'8px', fontSize:'1rem',
                        fontWeight:700, border:`1.5px solid #6366f1`,
                        background: dark ? '#0f172a' : '#f8fafc',
                        color: dark ? '#f1f5f9' : '#1e293b',
                        fontFamily:'inherit', outline:'none', marginBottom:'4px',
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight:700, fontSize:'1rem',
                                  color: dark ? '#f1f5f9' : '#1e293b', lineHeight:1.3 }}>
                      {profile.nama_lengkap}
                    </div>
                  )}
                  <div style={{ fontSize:'0.75rem', color:txtSub, marginTop:'3px' }}>{subtitle}</div>
                </div>

                {/* Fields — ADMIN */}
                {isAdmin && (
                  <>
                    <KTPRow label="NIP"      value={profile.nip}      editable={true}  editMode={editMode} editValue={editData.nip}     onEditChange={setField('nip')}     dark={dark}/>
                    <KTPRow label="Username" value={profile.username}  editable={false} editMode={editMode}                                                                   dark={dark}/>
                    <KTPRow label="Jabatan"  value={profile.jabatan}   editable={true}  editMode={editMode} editValue={editData.jabatan}  onEditChange={setField('jabatan')} dark={dark}/>
                    <KTPRow label="Email"    value={profile.email}     editable={true}  editMode={editMode} editValue={editData.email}    onEditChange={setField('email')}   dark={dark}/>
                    <KTPRow label="No. HP"   value={profile.no_telp}   editable={true}  editMode={editMode} editValue={editData.no_telp}  onEditChange={setField('no_telp')} dark={dark}/>
                  </>
                )}

                {/* Fields — GURU */}
                {isGuru && (
                  <>
                    <KTPRow label="NIP"            value={profile.nip}                editable={false} editMode={editMode}                                                                            dark={dark}/>
                    <KTPRow label="Username"        value={profile.username}           editable={false} editMode={editMode}                                                                            dark={dark}/>
                    <KTPRow label="Jabatan"         value={profile.jabatan}            editable={false} editMode={editMode}                                                                            dark={dark}/>
                    <KTPRow label="Mata Pelajaran"  value={profile.mapel_pengampu}     editable={true}  editMode={editMode} editValue={editData.mapel_pengampu} onEditChange={setField('mapel_pengampu')} dark={dark}/>
                    <KTPRow label="Status Pegawai"  value={profile.status_kepegawaian} editable={false} editMode={editMode}                                                                            dark={dark}/>
                    <KTPRow label="Email"           value={profile.email}              editable={false} editMode={editMode}                                                                            dark={dark}/>
                    <KTPRow label="No. HP"          value={profile.no_telp}            editable={true}  editMode={editMode} editValue={editData.no_telp}         onEditChange={setField('no_telp')}       dark={dark}/>
                  </>
                )}

                {/* Fields — SISWA */}
                {isSiswa && (
                  <>
                    <KTPRow label="NIS"      value={profile.nis}                  editable={false} editMode={editMode}                                                                   dark={dark}/>
                    <KTPRow label="Username" value={profile.username}             editable={false} editMode={editMode}                                                                   dark={dark}/>
                    <KTPRow label="Jurusan"  value={profile.jurusan}              editable={false} editMode={editMode}                                                                   dark={dark}/>
                    <KTPRow label="Angkatan" value={profile.angkatan?.toString()} editable={false} editMode={editMode}                                                                   dark={dark}/>
                    <KTPRow label="Kelas"    value={profile.kelas_aktif}          editable={false} editMode={editMode}                                                                   dark={dark}/>
                    <KTPRow label="Email"    value={profile.email}                editable={true}  editMode={editMode} editValue={editData.email}   onEditChange={setField('email')}   dark={dark}/>
                    <KTPRow label="No. HP"   value={profile.no_telp}              editable={true}  editMode={editMode} editValue={editData.no_telp} onEditChange={setField('no_telp')} dark={dark}/>
                  </>
                )}

                {/* Last login */}
                {profile.last_login_at && !editMode && (
                  <div style={{ marginTop:'10px', fontSize:'0.7rem', color:txtSub, textAlign:'right' }}>
                    Login terakhir:{' '}
                    {new Date(profile.last_login_at).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── QR Panel ── */}
        {showQR && !editMode && (
          <div style={{
            borderTop:`1px solid ${border}`, padding:'18px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'12px',
            background: dark ? '#0f172a' : '#f8fafc',
          }}>
            <div style={{ fontSize:'0.78rem', fontWeight:600, color:txtSub }}>
              Scan untuk lihat profil di HP
            </div>
            <div style={{ padding:'10px', borderRadius:'12px',
                          background: dark ? '#1e293b' : '#ffffff',
                          border:`1px solid ${border}` }}>
              <img src={qrImgSrc} alt="QR Profil" width="180" height="180"
                style={{ display:'block', borderRadius:'4px' }}/>
            </div>
            <div style={{ fontSize:'0.68rem', color:txtSub, textAlign:'center',
                          lineHeight:1.5, maxWidth:'240px' }}>
              ⏱ Berlaku selama sesi akun aktif.<br/>
              Pastikan HP terhubung ke jaringan yang sama.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
