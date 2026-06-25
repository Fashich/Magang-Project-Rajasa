/**
 * GamifikasiPage.jsx
 * Gamifikasi — poin, badge, dan leaderboard kehadiran
 *
 * Shared component — bisa dipakai di:
 *   - DashboardSiswa  : import GamifikasiPage from '../admin/GamifikasiPage'
 *   - DashboardGuru   : import GamifikasiPage from '../admin/GamifikasiPage'
 *   - DashboardAdmin  : import GamifikasiPage from './GamifikasiPage'
 *
 * 3 Tab:
 *   Profil     → poin siswa + badge + streak + riwayat
 *   Leaderboard → ranking per rombel/global
 *   Katalog    → semua badge yang bisa diraih
 *
 * @author feature/gamifikasi
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import './GamifikasiPage.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('presensi_lab_rajasa:auth_token')
      || localStorage.getItem('auth_token') || ''
}

function getUser() {
  try {
    const raw = localStorage.getItem('presensi_lab_rajasa:auth_user')
             || localStorage.getItem('user_data')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TIPE_LABEL = {
  hadir_tepat_waktu: 'Hadir Tepat Waktu',
  hadir_terlambat:   'Hadir (Terlambat)',
  izin_surat:        'Izin dengan Surat',
  streak_7:          'Bonus Streak 7 Hari',
  streak_30:         'Bonus Streak 30 Hari',
  perfect_month:     'Bonus Perfect Month',
  submit_logbook:    'Submit Logbook',
  logbook_approved:  'Logbook Disetujui',
  tiket_selesai:     'Tiket Diselesaikan',
  early_bird:        'Early Bird',
  bonus_admin:       'Bonus dari Admin',
}

const TIPE_ICON = {
  hadir_tepat_waktu: '✅',
  hadir_terlambat:   '⏰',
  izin_surat:        '📋',
  streak_7:          '🔥',
  streak_30:         '💎',
  perfect_month:     '🏆',
  submit_logbook:    '📒',
  logbook_approved:  '✔️',
  tiket_selesai:     '💬',
  early_bird:        '⚡',
  bonus_admin:       '⭐',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PoinBar({ value, max = 500, color = '#6366f1' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div class="gm-poin-bar-wrap">
      <div class="gm-poin-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── Tab: Profil ───────────────────────────────────────────────────────────────

function TabProfil({ userType, siswaId }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (siswaId && userType !== 'siswa') params.set('siswa_id', siswaId)
      const res = await apiFetch(`/gamifikasi/profil?${params}`)
      setData(res.data)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }, [siswaId, userType])

  useEffect(() => { load() }, [load])

  if (loading) return <div class="gm-loading">Memuat profil gamifikasi…</div>
  if (err)     return <div class="gm-alert gm-alert-error">{err}</div>
  if (!data)   return <div class="gm-empty">Data tidak tersedia.</div>

  // Admin/guru tanpa siswa_id → tampilkan statistik global
  if (data.is_global) {
    return (
      <div class="gm-tab-content">
        <div class="gm-stats-row">
          <div class="gm-stat-card">
            <div class="gm-stat-icon">🏅</div>
            <div class="gm-stat-value">{data.total_siswa_aktif}</div>
            <div class="gm-stat-label">Siswa Aktif</div>
          </div>
          <div class="gm-stat-card">
            <div class="gm-stat-icon">⭐</div>
            <div class="gm-stat-value">{data.total_poin_bulan.toLocaleString('id-ID')}</div>
            <div class="gm-stat-label">Total Poin Bulan Ini</div>
          </div>
          <div class="gm-stat-card">
            <div class="gm-stat-icon">🎖️</div>
            <div class="gm-stat-value">{data.total_badge_bulan}</div>
            <div class="gm-stat-label">Badge Diraih</div>
          </div>
        </div>
        <div class="gm-section">
          <h3 class="gm-section-title">🏆 Top 5 Siswa Bulan Ini</h3>
          <div class="gm-card">
            {data.top_siswa.length === 0 ? (
              <div class="gm-empty">
                Belum ada data poin. Jalankan kalkulasi poin terlebih dahulu.
              </div>
            ) : (
              <table class="gm-table">
                <thead><tr><th>#</th><th>Siswa</th><th>Rombel</th><th>Poin</th></tr></thead>
                <tbody>
                  {data.top_siswa.map((s, i) => (
                    <tr key={s.siswa_id}>
                      <td style={{ textAlign: 'center' }}>
                        {['🥇','🥈','🥉','4','5'][i]}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.nama_siswa}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gm-text-muted)' }}>{s.nis}</div>
                      </td>
                      <td>{s.rombel}</td>
                      <td style={{ fontWeight: 700, color: 'var(--gm-primary)' }}>
                        {s.total_poin.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div style={{
          padding: '0.875rem 1.25rem', background: 'var(--gm-primary-light)',
          border: '1px solid var(--gm-primary)', borderRadius: 'var(--gm-radius)',
          fontSize: '0.8125rem', color: 'var(--gm-text)',
        }}>
          💡 Untuk lihat profil poin siswa tertentu, masukkan siswa_id di kolom pencarian di atas.
        </div>
      </div>
    )
  }

  const { siswa, total_poin, poin_bulan_ini, ranking_rombel, streak_saat_ini, badge, riwayat_poin } = data

  // Level berdasarkan total poin
  const level = total_poin >= 2000 ? { nama: 'Platinum', icon: '💎', color: '#8b5cf6', min: 2000 }
              : total_poin >= 1000 ? { nama: 'Gold',     icon: '🥇', color: '#f59e0b', min: 1000 }
              : total_poin >= 500  ? { nama: 'Silver',   icon: '🥈', color: '#6b7280', min: 500  }
              :                      { nama: 'Bronze',   icon: '🥉', color: '#b45309', min: 0    }

  const nextLevel = total_poin >= 2000 ? null
                  : total_poin >= 1000 ? { nama: 'Platinum', min: 2000 }
                  : total_poin >= 500  ? { nama: 'Gold',     min: 1000 }
                  :                      { nama: 'Silver',   min: 500  }

  return (
    <div class="gm-tab-content">
      {/* Hero card */}
      <div class="gm-hero-card" style={{ '--lvl-color': level.color }}>
        <div class="gm-hero-left">
          <div class="gm-level-badge">{level.icon}</div>
          <div>
            <div class="gm-level-nama">{level.nama}</div>
            <div class="gm-siswa-nama">{siswa.nama}</div>
            <div class="gm-siswa-meta">{siswa.nis} · {siswa.rombel}</div>
          </div>
        </div>
        <div class="gm-hero-right">
          <div class="gm-total-poin">{total_poin.toLocaleString('id-ID')}</div>
          <div class="gm-poin-label">Total Poin</div>
          {nextLevel && (
            <>
              <PoinBar value={total_poin - level.min} max={nextLevel.min - level.min} color={level.color} />
              <div style={{ fontSize: '0.7rem', color: 'var(--gm-text-muted)', marginTop: '0.25rem' }}>
                {(nextLevel.min - total_poin).toLocaleString()} poin lagi ke {nextLevel.nama}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div class="gm-stats-row">
        <div class="gm-stat-card">
          <div class="gm-stat-icon">📅</div>
          <div class="gm-stat-value">{poin_bulan_ini}</div>
          <div class="gm-stat-label">Poin Bulan Ini</div>
        </div>
        <div class="gm-stat-card">
          <div class="gm-stat-icon">🏆</div>
          <div class="gm-stat-value">#{ranking_rombel.rank}</div>
          <div class="gm-stat-label">Ranking Rombel</div>
        </div>
        <div class="gm-stat-card">
          <div class="gm-stat-icon">🔥</div>
          <div class="gm-stat-value">{streak_saat_ini}</div>
          <div class="gm-stat-label">Streak Hari Ini</div>
        </div>
        <div class="gm-stat-card">
          <div class="gm-stat-icon">🎖️</div>
          <div class="gm-stat-value">{badge.length}</div>
          <div class="gm-stat-label">Badge Diraih</div>
        </div>
      </div>

      {/* Badge grid */}
      {badge.length > 0 && (
        <div class="gm-section">
          <h3 class="gm-section-title">🎖️ Badge Diraih</h3>
          <div class="gm-badge-grid">
            {badge.map(b => (
              <div key={`${b.kode}-${b.periode}`} class="gm-badge-item"
                style={{ '--bclr': b.warna }}>
                <div class="gm-badge-icon">{b.icon}</div>
                <div class="gm-badge-nama">{b.nama}</div>
                <div class="gm-badge-desc">{b.deskripsi}</div>
                {b.periode && <div class="gm-badge-periode">{b.periode}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat poin */}
      <div class="gm-section">
        <h3 class="gm-section-title">📋 Riwayat Poin Terbaru</h3>
        <div class="gm-card">
          {riwayat_poin.length === 0 ? (
            <div class="gm-empty">Belum ada riwayat poin.</div>
          ) : (
            <table class="gm-table">
              <thead>
                <tr><th>Aktivitas</th><th>Poin</th><th>Tanggal</th></tr>
              </thead>
              <tbody>
                {riwayat_poin.map(r => (
                  <tr key={r.poin_id}>
                    <td>
                      <span style={{ marginRight: '0.4rem' }}>{TIPE_ICON[r.tipe] ?? '⭐'}</span>
                      {TIPE_LABEL[r.tipe] ?? r.tipe}
                      {r.keterangan && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--gm-text-muted)' }}>
                          {r.keterangan}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: r.poin > 0 ? '#15803d' : '#dc2626',
                      }}>
                        {r.poin > 0 ? '+' : ''}{r.poin}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--gm-text-muted)' }}>
                      {fmtDate(r.tanggal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Leaderboard ──────────────────────────────────────────────────────────

function TabLeaderboard() {
  const [data,      setData]      = useState([])
  const [selfRank,  setSelfRank]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [rombelList,setRombelList]= useState([])
  const [rombelId,  setRombelId]  = useState('')
  const [bulan,     setBulan]     = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })

  useEffect(() => {
    apiFetch('/rombel/options').then(r => setRombelList(r.data?.rombel ?? [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ bulan, limit: '10' })
      if (rombelId) params.set('rombel_id', rombelId)
      const res = await apiFetch(`/gamifikasi/leaderboard?${params}`)
      setData(res.data?.leaderboard ?? [])
      setSelfRank(res.data?.self_rank ?? null)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [bulan, rombelId])

  useEffect(() => { load() }, [load])

  const medalColor = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' }
  const medalIcon  = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div class="gm-tab-content">
      {/* Filter */}
      <div class="gm-filter-bar">
        <input type="month" value={bulan} onInput={e => setBulan(e.target.value)} />
        <select value={rombelId} onChange={e => setRombelId(e.target.value)}>
          <option value="">🌐 Global (semua rombel)</option>
          {rombelList.map(r => (
            <option key={r.rombel_id} value={r.rombel_id}>{r.label}</option>
          ))}
        </select>
        <button class="gm-btn-ghost" onClick={load}>↺ Refresh</button>
      </div>

      {/* Podium top 3 */}
      {!loading && data.length >= 3 && (
        <div class="gm-podium">
          {/* Rank 2 */}
          <div class="gm-podium-item" style={{ '--pclr': medalColor[2] }}>
            <div class="gm-podium-avatar">🥈</div>
            <div class="gm-podium-name">{data[1]?.nama_siswa?.split(' ')[0]}</div>
            <div class="gm-podium-poin">{data[1]?.total_poin} poin</div>
            <div class="gm-podium-bar" style={{ height: 60 }} />
          </div>
          {/* Rank 1 */}
          <div class="gm-podium-item gm-podium-top" style={{ '--pclr': medalColor[1] }}>
            <div class="gm-podium-crown">👑</div>
            <div class="gm-podium-avatar">🥇</div>
            <div class="gm-podium-name">{data[0]?.nama_siswa?.split(' ')[0]}</div>
            <div class="gm-podium-poin">{data[0]?.total_poin} poin</div>
            <div class="gm-podium-bar" style={{ height: 80 }} />
          </div>
          {/* Rank 3 */}
          <div class="gm-podium-item" style={{ '--pclr': medalColor[3] }}>
            <div class="gm-podium-avatar">🥉</div>
            <div class="gm-podium-name">{data[2]?.nama_siswa?.split(' ')[0]}</div>
            <div class="gm-podium-poin">{data[2]?.total_poin} poin</div>
            <div class="gm-podium-bar" style={{ height: 45 }} />
          </div>
        </div>
      )}

      {/* Tabel full */}
      <div class="gm-card">
        {loading ? (
          <div class="gm-loading">Memuat leaderboard…</div>
        ) : data.length === 0 ? (
          <div class="gm-empty">
            <div class="gm-empty-icon">🏆</div>
            Belum ada data poin untuk periode ini.
          </div>
        ) : (
          <table class="gm-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Siswa</th>
                <th>Rombel</th>
                <th>Poin</th>
                <th>Hari Hadir</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.siswa_id}
                  class={d.is_self ? 'gm-row-self' : ''}
                  style={d.rank <= 3 ? { background: medalColor[d.rank] + '15' } : {}}>
                  <td style={{ textAlign: 'center', fontSize: '1rem' }}>
                    {medalIcon[d.rank] ?? d.rank}
                  </td>
                  <td>
                    <div style={{ fontWeight: d.is_self ? 700 : 600 }}>{d.nama_siswa}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gm-text-muted)' }}>
                      {d.nis} {d.is_self && '← Kamu'}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{d.label_rombel}</td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: '0.95rem',
                      color: d.rank === 1 ? '#f59e0b' : d.rank === 2 ? '#94a3b8' : d.rank === 3 ? '#b45309' : 'inherit',
                    }}>
                      {d.total_poin.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td>{d.hari_hadir}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Posisi siswa jika tidak di top */}
      {selfRank && (
        <div class="gm-self-rank-card">
          📍 Posisi kamu bulan ini: <strong>#{selfRank.rank}</strong> dengan{' '}
          <strong>{selfRank.poin} poin</strong>
        </div>
      )}
    </div>
  )
}

// ── Tab: Katalog Badge ────────────────────────────────────────────────────────

function TabKatalog({ userType, siswaId }) {
  const [allBadge,    setAllBadge]    = useState([])
  const [ownedBadge,  setOwnedBadge]  = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    const profil = userType === 'siswa'
      ? apiFetch('/gamifikasi/profil')
      : siswaId
        ? apiFetch(`/gamifikasi/profil?siswa_id=${siswaId}`)
        : Promise.resolve({ data: { badge: [] } })

    Promise.all([
      apiFetch('/gamifikasi/badge'),
      profil,
    ]).then(([b, p]) => {
      setAllBadge(b.data?.badge ?? [])
      setOwnedBadge((p.data?.badge ?? []).map(b => b.kode))
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [siswaId, userType])

  const kategoriOrder = ['kehadiran','logbook','komunikasi','prestasi','khusus']
  const grouped = kategoriOrder.reduce((acc, k) => {
    acc[k] = allBadge.filter(b => b.kategori === k)
    return acc
  }, {})

  const kategoriLabel = {
    kehadiran:    '📅 Kehadiran',
    logbook:      '📒 Logbook PKL',
    komunikasi:   '💬 Komunikasi',
    prestasi:     '🏆 Prestasi',
    khusus:       '⭐ Khusus',
  }

  if (loading) return <div class="gm-loading">Memuat katalog badge…</div>

  return (
    <div class="gm-tab-content">
      {kategoriOrder.map(kat => {
        const badges = grouped[kat]
        if (!badges?.length) return null
        return (
          <div key={kat} class="gm-section">
            <h3 class="gm-section-title">{kategoriLabel[kat]}</h3>
            <div class="gm-badge-katalog-grid">
              {badges.map(b => {
                const owned = ownedBadge.includes(b.kode)
                return (
                  <div key={b.badge_id}
                    class={`gm-katalog-item${owned ? ' gm-katalog-owned' : ' gm-katalog-locked'}`}
                    style={{ '--bclr': b.warna }}>
                    <div class="gm-katalog-icon">{owned ? b.icon : '🔒'}</div>
                    <div class="gm-katalog-nama">{b.nama}</div>
                    <div class="gm-katalog-desc">{b.deskripsi}</div>
                    <div class="gm-katalog-reward">+{b.poin_reward} poin</div>
                    {owned && <div class="gm-katalog-check">✅ Diraih</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Admin panel: Hitung Ulang Poin ────────────────────────────────────────────

function AdminPanel() {
  const [bulan,    setBulan]    = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [err,      setErr]      = useState('')

  async function handleHitung() {
    if (!confirm(`Hitung ulang poin & badge untuk bulan ${bulan}? Proses ini akan memperbarui semua data poin bulan tersebut.`)) return
    setErr(''); setResult(null); setLoading(true)
    try {
      const res = await apiFetch('/gamifikasi/hitung', {
        method: 'POST', body: JSON.stringify({ bulan }),
      })
      setResult(res.data)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div class="gm-admin-panel">
      <h3 class="gm-section-title">⚙️ Kalkulasi Poin & Badge</h3>
      <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--gm-text-muted)' }}>
        Jalankan kalkulasi ulang poin dan badge untuk semua siswa aktif dalam satu bulan.
        Biasanya dijalankan di akhir bulan atau setelah data presensi dikoreksi.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="month" value={bulan} onInput={e => setBulan(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--gm-border)',
            borderRadius: '8px', fontFamily: 'var(--gm-font)', fontSize: '0.8125rem',
            color: 'var(--gm-text)', background: 'var(--gm-bg)' }} />
        <button class="gm-btn-primary" onClick={handleHitung} disabled={loading}>
          {loading ? '⏳ Menghitung…' : '▶ Hitung Sekarang'}
        </button>
      </div>
      {err && <div class="gm-alert gm-alert-error" style={{ marginTop: '1rem' }}>{err}</div>}
      {result && (
        <div class="gm-alert gm-alert-success" style={{ marginTop: '1rem' }}>
          ✅ Selesai — {result.processed} siswa diproses · {result.total_poin} poin diberikan · {result.badge_diberikan} badge diraih
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function GamifikasiPage() {
  const user     = getUser()
  const userType = user?.user_type ?? 'siswa'
  const isAdmin  = ['admin'].includes(userType)
  const isGuru   = ['guru'].includes(userType)

  const [tab,     setTab]     = useState('profil')
  const [siswaId, setSiswaId] = useState('')

  const tabs = [
    { key: 'profil',      label: '🎮 Profil Poin' },
    { key: 'leaderboard', label: '🏆 Leaderboard' },
    { key: 'katalog',     label: '🎖️ Katalog Badge' },
  ]

  return (
    <div class="gm-page">
      {/* Header */}
      <div class="gm-page-header">
        <div>
          <h1 class="gm-page-title">Gamifikasi Kehadiran</h1>
          <p class="gm-page-sub">
            Kumpulkan poin, raih badge, dan kompetisi di leaderboard bersama teman sekelasmu
          </p>
        </div>
      </div>

      {/* Guru/Admin: pilih siswa */}
      {(isGuru || isAdmin) && tab === 'profil' && (
        <div class="gm-filter-bar">
          <input type="text" placeholder="Masukkan siswa_id untuk lihat profil siswa..."
            value={siswaId} onInput={e => setSiswaId(e.target.value)}
            style={{ flex: 1 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--gm-text-muted)' }}>
            Kosongkan untuk lihat statistik global
          </span>
        </div>
      )}

      {/* Admin panel */}
      {isAdmin && <AdminPanel />}

      {/* Tab bar */}
      <div class="gm-tab-bar">
        {tabs.map(t => (
          <button key={t.key}
            class={`gm-tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profil'      && <TabProfil      userType={userType} siswaId={siswaId || null} />}
      {tab === 'leaderboard' && <TabLeaderboard />}
      {tab === 'katalog'     && <TabKatalog     userType={userType} siswaId={siswaId || null} />}
    </div>
  )
}
