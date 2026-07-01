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
  const valueStyle = { flex:1, fontSize:'0.84rem', color: dark ? '#e2e8f0' : '#1e293b', wordBreak:'break-word' }
  const emptyStyle = { ...valueStyle, color: dark ? '#334155' : '#cbd5e1', fontStyle:'italic' }
  const border = dark ? '#1e293b' : '#f1f5f9'

  return (
    <div style={{ display:'flex', alignItems:'center', padding:'3.5px 0', borderBottom:`1px solid ${border}`, minHeight:'23px' }}>
      <span style={{ width:'38%', fontSize:'0.68rem', fontWeight:600, color: dark ? '#64748b' : '#94a3b8',
                     textTransform:'uppercase', letterSpacing:'0.04em', flexShrink:0 }}>
        {label}
      </span>
      <span style={{ color: dark ? '#475569' : '#cbd5e1', marginRight:'8px', fontSize:'0.78rem', flexShrink:0 }}>:</span>
      {editMode && editable ? (
        <input type="text" value={editValue ?? ''} onInput={e => onEditChange(e.currentTarget.value)}
          style={{
            flex:1, padding:'2px 8px', borderRadius:'6px', fontSize:'0.82rem',
            border:'1.5px solid #6366f1', background: dark ? '#0f172a' : '#f8fafc',
            color: dark ? '#f1f5f9' : '#1e293b', fontFamily:'inherit', outline:'none',
          }}/>
      ) : (
        <span style={value ? valueStyle : emptyStyle}>{value || '—'}</span>
      )}
    </div>
  )
}

// ── Strip dekoratif gaya barcode — kosmetik di belakang kartu ─────────────────
function BarcodeStrip({ dark }) {
  const bars = [2,1,3,1,2,2,1,3,2,1,1,3,2,1,2,3,1,2,1,3,2,2,1,2,3,1,2,1,3,2]
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'2px', height:'22px', opacity: 1 }}>
      {bars.map((w, i) => (
        <div key={i} style={{
          width:`${w}px`, height: i % 3 === 0 ? '100%' : '65%',
          background: dark ? '#cbd5e1' : '#0f172a',
        }}/>
      ))}
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
  const [rotationY, setRotationY] = useState(0)     // sumbu Y — flip kiri/kanan
  const [rotationX, setRotationX] = useState(0)     // sumbu X — flip atas/bawah
  const [isCardDragging,setIsCardDragging]= useState(false)
  const dragStartXRef         = useRef(0)
  const dragStartYRef         = useRef(0)
  const dragStartRotationYRef = useRef(0)
  const dragStartRotationXRef = useRef(0)
  const fileRef = useRef(null)
  const dark    = theme === 'dark'

  const isAdmin = userType === 'admin'
  const isGuru  = ['guru','staff','intern'].includes(userType)
  const isSiswa = userType === 'siswa'

  const qrUrl    = `${window.location.origin}/profile-view.html?t=${auth.getToken() ?? ''}`
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=5&color=${dark?'e2e8f0':'1e293b'}&bgcolor=${dark?'1e293b':'ffffff'}&data=${encodeURIComponent(qrUrl)}`

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

  const onFileChange = e => { uploadFile(e.currentTarget.files?.[0]); e.currentTarget.value = '' }
  const onDragOver   = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; if (editMode) setIsDragging(true) }
  const onDragLeave  = e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }
  const onDrop       = e => { e.preventDefault(); setIsDragging(false); if (editMode) uploadFile(e.dataTransfer?.files?.[0]) }

  // ── Interaksi putar kartu 360° (2 sumbu) — Pointer Events: satu handler
  // untuk mouse, touch, dan stylus sekaligus, jalan di semua device.
  // BEBAS ke segala arah — nyamping, ke atas/bawah, atau diagonal sekalipun,
  // dua sumbu jalan BERSAMAAN mengikuti gerakan asli (bukan dikunci 1 arah).
  const ROTATE_SENSITIVITY = 0.5  // derajat per pixel pergeseran

  const handleCardPointerDown = (e) => {
    if (editMode) return // jangan rotate saat lagi edit, biar tidak ganggu form
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    dragStartRotationYRef.current = rotationY
    dragStartRotationXRef.current = rotationX
    setIsCardDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const handleCardPointerMove = (e) => {
    if (!isCardDragging) return
    const deltaX = e.clientX - dragStartXRef.current
    const deltaY = e.clientY - dragStartYRef.current
    // Kedua sumbu update bareng — diagonal/serong otomatis kebentuk dari
    // kombinasi keduanya, persis gerakan jari/mouse aslinya.
    setRotationY(dragStartRotationYRef.current + deltaX * ROTATE_SENSITIVITY)
    setRotationX(dragStartRotationXRef.current - deltaY * ROTATE_SENSITIVITY)
  }

  const handleCardPointerUp = () => {
    if (!isCardDragging) return
    setIsCardDragging(false)
    // Snap independen tiap sumbu ke kelipatan 180° terdekat — X dan Y
    // sama-sama bisa "nyangkut" di posisi flip, tidak ada yang dipaksa rata.
    setRotationX(r => Math.round(r / 180) * 180)
    setRotationY(r => Math.round(r / 180) * 180)
  }

  // Cegah klik tombol ikut memicu drag-rotate kartu
  const stopCardDrag = e => e.stopPropagation()

  // Wajah yang menghadap depan — kalau TEPAT SATU sumbu yang "terbalik" (≈180°),
  // berarti lagi lihat belakang. Kalau kedua sumbu terbalik atau tidak ada yang
  // terbalik, otomatis balik nampilin depan lagi (persis kartu fisik beneran).
  const norm = deg => ((deg % 360) + 360) % 360
  const yFlipped = (() => { const a = norm(rotationY); return a > 90 && a < 270 })()
  const xFlipped = (() => { const a = norm(rotationX); return a > 90 && a < 270 })()
  const showingBack = yFlipped !== xFlipped // XOR

  // Kalau yang kebalik cuma sumbu X (bukan Y), isi belakang otomatis kebalik
  // 180° secara visual (fisika kartu nyata: dibalik atas-bawah = kontennya
  // jadi terbalik). Kompensasi dengan rotate 2D di kontennya biar tetap kebaca.
  const backNeedsUprightFix = showingBack && xFlipped && !yFlipped

  // colours
  const cardBg  = dark ? '#1e293b' : '#ffffff'
  const headBg  = dark ? '#0f2545' : '#1e3a6e'
  const colBg   = dark ? '#0f172a' : '#f8fafc'
  const border  = dark ? '#334155' : '#e2e8f0'
  const txtSub  = dark ? '#64748b' : '#94a3b8'

  const subtitle = isSiswa
    ? (profile?.nisn ? `NISN: ${profile.nisn}` : 'Siswa')
    : (profile?.jabatan ?? profile?.jenis_user ?? (isAdmin ? 'Admin' : 'Guru'))

  const cardTitle = isAdmin ? 'KARTU IDENTITAS ADMIN' : isGuru ? 'KARTU IDENTITAS GURU / STAFF' : 'KARTU IDENTITAS SISWA'

  // Tinggi kartu DIPAKSA SAMA untuk kedua sisi — supaya flip tidak "menciut/
  // melar" pas pindah depan↔belakang, persis kartu fisik yang dimensinya tetap.
  const CARD_HEIGHT = 400

  // "Ketebalan" kartu — dibikin pakai box-shadow berlapis (bukan elemen 3D
  // terpisah), supaya tidak rawan bug render lintas-browser tapi tetap kerasa
  // solid, bukan selembar kertas tipis.
  const cardDepthShadow = dark
    ? '0 1px 0 #334155, 0 2px 0 #2a3749, 0 3px 0 #1e2a3a, 0 4px 0 #16202c, 0 5px 0 #0f161e, 0 32px 80px rgba(0,0,0,0.45)'
    : '0 1px 0 #cbd5e1, 0 2px 0 #c0cad6, 0 3px 0 #b5c0cd, 0 4px 0 #aab6c4, 0 5px 0 #9fadbc, 0 32px 80px rgba(0,0,0,0.30)'

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'16px', fontFamily:'inherit',
    }}>
      {/* Wrapper perspektif 3D — induk dari flip container */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:'100%', maxWidth:'660px', perspective:'1800px' }}
      >
        {/* Flip container — yang benar-benar berotasi, bisa di-drag bebas 2 sumbu */}
        <div
          onPointerDown={handleCardPointerDown}
          onPointerMove={handleCardPointerMove}
          onPointerUp={handleCardPointerUp}
          onPointerCancel={handleCardPointerUp}
          style={{
            position:'relative', width:'100%', height:`${CARD_HEIGHT}px`,
            transformStyle:'preserve-3d',
            transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
            transition: isCardDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0.15, 0.2, 1)',
            cursor: editMode ? 'default' : (isCardDragging ? 'grabbing' : 'grab'),
            touchAction: 'none', // rotasi custom nangani kedua arah, scroll khusus di-override di data-col
            userSelect: 'none',
          }}
        >
          {/* ══════════════════ SISI DEPAN ══════════════════ */}
          <div style={{
            position:'absolute', inset: 0, width:'100%', height:'100%',
            backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
            pointerEvents: showingBack ? 'none' : 'auto',
            background:cardBg, borderRadius:'16px', overflow:'hidden',
            boxShadow: cardDepthShadow,
            display:'flex', flexDirection:'column',
          }}>
            {/* Header */}
            <div style={{ background:headBg, padding:'11px 18px', flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'8px', overflow:'hidden', flexShrink:0 }}>
                  <img src="/images/logo/Rajasa-Logo.png" alt="Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
                </div>
                <div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:'0.92rem', letterSpacing:'0.03em' }}>SMKS RAJASA SURABAYA</div>
                  <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.68rem', letterSpacing:'0.06em' }}>{cardTitle}</div>
                </div>
              </div>
              <button type="button" onPointerDown={stopCardDrag} onClick={onClose} style={{
                background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
                color:'#fff', width:'30px', height:'30px', borderRadius:'50%', fontSize:'1rem',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ display:'flex', flexDirection:'row', flex:1, minHeight:0, overflow:'hidden' }}>

              {/* Kolom foto */}
              <div style={{
                width:'150px', flexShrink:0, height:'100%', background:colBg, borderRight:`1px solid ${border}`,
                display:'flex', flexDirection:'column', alignItems:'center',
                justifyContent:'center', padding:'14px 14px', gap:'7px', overflowY:'auto',
              }}>
                <div
                  onClick={() => editMode && fileRef.current?.click()}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                  style={{
                    position:'relative', width:'90px', height:'120px', borderRadius:'6px',
                    overflow:'hidden', flexShrink:0,
                    border: isDragging ? '2px dashed #6366f1' : `2px solid ${border}`,
                    background: dark ? '#1e293b' : '#e2e8f0',
                    cursor: editMode ? 'pointer' : 'default',
                  }}
                >
                  {profile?.foto_url ? (
                    <img src={profile.foto_url} alt="Foto" style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }}/>
                  ) : <NoPhotoIcon/>}

                  {isDragging && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(99,102,241,0.35)',
                                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                      <span style={{ fontSize:'1.8rem' }}>📁</span>
                      <span style={{ color:'#fff', fontSize:'0.7rem', fontWeight:700, textShadow:'0 1px 3px rgba(0,0,0,0.5)' }}>Lepas di sini</span>
                    </div>
                  )}
                  {uploading && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)',
                                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ color:'#fff', fontSize:'0.68rem', fontWeight:600 }}>Mengupload…</span>
                    </div>
                  )}
                  {editMode && !isDragging && !uploading && !profile?.foto_url && (
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
                                  alignItems:'center', justifyContent:'center', gap:'4px', background:'rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize:'1.4rem' }}>📷</span>
                      <span style={{ fontSize:'0.62rem', color: dark ? '#94a3b8' : '#64748b', fontWeight:600, textAlign:'center' }}>
                        Klik atau<br/>drag foto
                      </span>
                    </div>
                  )}
                  {editMode && (
                    <div style={{
                      position:'absolute', bottom:5, right:5, width:'22px', height:'22px', borderRadius:'50%',
                      background:'#6366f1', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1rem', fontWeight:700, lineHeight:1, border:`2px solid ${colBg}`,
                    }}>+</div>
                  )}
                </div>

                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} style={{ display:'none' }}/>

                {profile && (
                  <div style={{
                    padding:'3px 12px', borderRadius:'20px', fontSize:'0.68rem', fontWeight:600,
                    background: profile.status === 'aktif' ? (dark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)') : (dark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'),
                    color:  profile.status === 'aktif' ? '#16a34a' : '#dc2626',
                    border: `1px solid ${profile.status === 'aktif' ? '#22c55e' : '#ef4444'}`,
                  }}>● {(profile.status ?? 'aktif').toUpperCase()}</div>
                )}

                {!loading && !error && !editMode && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px', width:'100%' }}>
                    <button type="button" onPointerDown={stopCardDrag} onClick={startEdit} style={{
                      width:'100%', padding:'4px 0', borderRadius:'20px', border:'1.5px solid #6366f1',
                      background:'transparent', color:'#6366f1', cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', fontWeight:600,
                    }}>✏️ Edit</button>
                    <button type="button" onPointerDown={stopCardDrag} onClick={() => setRotationY(r => r + 180)} style={{
                      width:'100%', padding:'4px 0', borderRadius:'20px', border:`1.5px solid ${border}`,
                      background:'transparent', color:txtSub, cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', fontWeight:600,
                    }}>📱 QR Code</button>
                  </div>
                )}

                {!loading && !error && editMode && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px', width:'100%' }}>
                    <button type="button" onPointerDown={stopCardDrag} onClick={saveEdit} disabled={saving} style={{
                      width:'100%', padding:'4px 0', borderRadius:'20px', border:'none',
                      background:'#6366f1', color:'#fff', cursor: saving ? 'not-allowed' : 'pointer',
                      fontFamily:'inherit', fontSize:'0.74rem', fontWeight:600, opacity: saving ? 0.7 : 1,
                    }}>{saving ? 'Menyimpan…' : '✓ Simpan'}</button>
                    <button type="button" onPointerDown={stopCardDrag} onClick={cancelEdit} style={{
                      width:'100%', padding:'4px 0', borderRadius:'20px', border:`1.5px solid ${border}`,
                      background:'transparent', color:txtSub, cursor:'pointer', fontFamily:'inherit', fontSize:'0.74rem', fontWeight:600,
                    }}>Batal</button>
                  </div>
                )}

                {uploadErr && <div style={{ color:'#ef4444', fontSize:'0.68rem', textAlign:'center', lineHeight:1.4 }}>{uploadErr}</div>}

                {!editMode && !loading && (
                  <div style={{ fontSize:'0.6rem', color:txtSub, textAlign:'center', opacity:0.7, marginTop:'2px' }}>
                    ↔ Geser kartu untuk membalik
                  </div>
                )}
              </div>

              {/* Kolom data */}
              <div onPointerDown={stopCardDrag}
                style={{ flex:1, padding:'13px 18px', minWidth:0, overflowY:'auto', height:'100%',
                         touchAction:'pan-y', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                {loading && <div style={{ color:txtSub, fontSize:'0.85rem' }}>Memuat profil…</div>}
                {error   && <div style={{ color:'#ef4444', fontSize:'0.85rem' }}>{error}</div>}

                {profile && !loading && (
                  <>
                    <div style={{ marginBottom:'8px', paddingBottom:'7px', borderBottom:`2px solid ${border}` }}>
                      {editMode ? (
                        <input type="text" value={editData.nama_lengkap} onInput={e => setF('nama_lengkap')(e.currentTarget.value)}
                          style={{
                            width:'100%', padding:'4px 8px', borderRadius:'8px', fontSize:'0.98rem', fontWeight:700,
                            border:'1.5px solid #6366f1', background: dark ? '#0f172a' : '#f8fafc',
                            color: dark ? '#f1f5f9' : '#1e293b', fontFamily:'inherit', outline:'none',
                          }}/>
                      ) : (
                        <div style={{ fontWeight:700, fontSize:'0.98rem', color: dark ? '#f1f5f9' : '#1e293b', lineHeight:1.3 }}>
                          {profile.nama_lengkap}
                        </div>
                      )}
                      <div style={{ fontSize:'0.74rem', color:txtSub, marginTop:'3px' }}>{subtitle}</div>
                    </div>

                    {isAdmin && (<>
                      <KTPRow label="NIP"      value={profile.nip}      editable dark={dark} editMode={editMode} editValue={editData.nip}     onEditChange={setF('nip')}/>
                      <KTPRow label="Username" value={profile.username}  editable={false} dark={dark} editMode={editMode}/>
                      <KTPRow label="Jabatan"  value={profile.jabatan}   editable dark={dark} editMode={editMode} editValue={editData.jabatan}  onEditChange={setF('jabatan')}/>
                      <KTPRow label="Email"    value={profile.email}     editable dark={dark} editMode={editMode} editValue={editData.email}    onEditChange={setF('email')}/>
                      <KTPRow label="No. HP"   value={profile.no_telp}   editable dark={dark} editMode={editMode} editValue={editData.no_telp}  onEditChange={setF('no_telp')}/>
                    </>)}

                    {isGuru && (<>
                      <KTPRow label="NIP"           value={profile.nip}                editable={false} dark={dark} editMode={editMode}/>
                      <KTPRow label="Username"       value={profile.username}           editable={false} dark={dark} editMode={editMode}/>
                      <KTPRow label="Jabatan"        value={profile.jabatan}            editable={false} dark={dark} editMode={editMode}/>
                      <KTPRow label="Mata Pelajaran" value={profile.mapel_pengampu}     editable dark={dark} editMode={editMode} editValue={editData.mapel_pengampu} onEditChange={setF('mapel_pengampu')}/>
                      <KTPRow label="Status Pegawai" value={profile.status_kepegawaian} editable={false} dark={dark} editMode={editMode}/>
                      <KTPRow label="Email"          value={profile.email}              editable={false} dark={dark} editMode={editMode}/>
                      <KTPRow label="No. HP"         value={profile.no_telp}            editable dark={dark} editMode={editMode} editValue={editData.no_telp} onEditChange={setF('no_telp')}/>
                    </>)}

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
                        Login terakhir: {new Date(profile.last_login_at).toLocaleString('id-ID',{ dateStyle:'medium', timeStyle:'short' })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════ SISI BELAKANG ══════════════════ */}
          <div style={{
            position:'absolute', inset: 0, width:'100%', height:'100%',
            backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
            pointerEvents: showingBack ? 'auto' : 'none',
            transform: backNeedsUprightFix ? 'rotateY(180deg) rotateZ(180deg)' : 'rotateY(180deg)',
            background:cardBg, borderRadius:'16px', overflow:'hidden',
            boxShadow: cardDepthShadow,
            display:'flex', flexDirection:'column',
          }}>
            {/* Header belakang — senada, ada tombol kembali */}
            <div style={{ background:headBg, padding:'11px 18px', flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <button type="button" onPointerDown={stopCardDrag} onClick={() => setRotationY(r => r - 180)} style={{
                background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
                color:'#fff', height:'30px', padding:'0 12px', borderRadius:'15px', fontSize:'0.76rem', fontWeight:600,
                display:'flex', alignItems:'center', gap:'6px', fontFamily:'inherit',
              }}>← Kembali</button>
              <button type="button" onPointerDown={stopCardDrag} onClick={onClose} style={{
                background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer',
                color:'#fff', width:'30px', height:'30px', borderRadius:'50%', fontSize:'1rem',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>✕</button>
            </div>

            {/* Body belakang — QR kiri, teks kanan */}
            <div style={{ flex:1, display:'flex', flexDirection:'row', minHeight:0, overflow:'hidden' }}>

              {/* QR kiri */}
              <div style={{
                width:'180px', flexShrink:0, background:colBg, borderRight:`1px solid ${border}`,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                padding:'16px 14px', gap:'9px',
              }}>
                <div style={{ padding:'7px', borderRadius:'10px', background: dark ? '#1e293b' : '#ffffff', border:`1px solid ${border}` }}>
                  <img src={qrImgSrc} alt="QR Profil" width="130" height="130" style={{ display:'block', borderRadius:'4px' }}/>
                </div>
                <div style={{ fontSize:'0.62rem', color:txtSub, textAlign:'center', fontWeight:600, letterSpacing:'0.03em' }}>
                  PINDAI UNTUK VERIFIKASI
                </div>
              </div>

              {/* Teks kanan — gaya belakang kartu identitas resmi */}
              <div onPointerDown={stopCardDrag}
                style={{ flex:1, padding:'16px 18px', display:'flex', flexDirection:'column',
                         justifyContent:'center', gap:'22px', overflowY:'auto', touchAction:'pan-y' }}>
                <div>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color: dark ? '#818cf8' : '#4f46e5',
                                letterSpacing:'0.08em', marginBottom:'8px' }}>
                    AKSES DIGITAL
                  </div>
                  <p style={{ margin:0, fontSize:'0.8rem', lineHeight:1.65, color: dark ? '#cbd5e1' : '#334155' }}>
                    Pindai kode QR di samping menggunakan kamera ponsel untuk membuka
                    kartu identitas ini di perangkat lain.
                  </p>

                  <div style={{ height:'1px', background:border, margin:'14px 0' }}/>

                  <p style={{ margin:0, fontSize:'0.74rem', lineHeight:1.65, color:txtSub }}>
                    Kartu identitas digital ini adalah properti sah SMKS Rajasa Surabaya
                    dan hanya berlaku bagi pemegang akun yang bersangkutan. Dilarang
                    menyalahgunakan atau membagikan kode QR ini kepada pihak lain.
                  </p>
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.7rem', color:txtSub, flexShrink:0 }}>
                    <span>⏱</span>
                    <span>Berlaku selama sesi akun aktif</span>
                  </div>
                  <BarcodeStrip dark={dark}/>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
