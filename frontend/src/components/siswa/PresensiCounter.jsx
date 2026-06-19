/**
 * PresensiCounter.jsx
 *
 * Displays 5 colored counter cards for the student's attendance summary.
 * Shown on: Dashboard Siswa → Presensi (Level 4).
 *
 * Cards (per FigJam HTA — warna icon ga boleh terlalu cerah):
 *   1. Tepat Waktu  (hadir)     — teal
 *   2. Terlambat                — amber
 *   3. Alpha                    — red (soft)
 *   4. Sakit                    — sky
 *   5. Izin                     — violet
 *
 * Data source: GET /api/siswa/dashboard
 *
 * @module components/siswa/PresensiCounter
 * @author fashich/dashboard-siswa-page
 */

import { useState, useEffect } from 'preact/hooks'
import { siswaApi } from '../../utils/api'
import './PresensiCounter.css'

// ─── SVG Icons (muted colors applied via CSS vars) ───────────────────────────

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
    </svg>
  )
}

function IconMedical() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 3c.55 0 1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H8c-.55 0-1-.45-1-1s.45-1 1-1h3V7c0-.55.45-1 1-1z" />
    </svg>
  )
}

function IconPermit() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-5-7.07c1.15.55 2 1.72 2 3.07H9c0-1.35.85-2.52 2-3.07V13h2v-.07z" />
    </svg>
  )
}

function IconError() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  )
}

// ─── Card configuration ───────────────────────────────────────────────────────

/**
 * Ordered list of counter cards.
 * `key` matches the API response field name.
 */
const COUNTER_CONFIG = [
  {
    key: 'tepat_waktu',
    label: 'Tepat Waktu',
    modifier: 'hadir',
    icon: <IconCheck />,
    ariaLabel: 'Jumlah kehadiran tepat waktu',
  },
  {
    key: 'terlambat',
    label: 'Terlambat',
    modifier: 'terlambat',
    icon: <IconClock />,
    ariaLabel: 'Jumlah kehadiran terlambat',
  },
  {
    key: 'alpha',
    label: 'Alpha',
    modifier: 'alpha',
    icon: <IconClose />,
    ariaLabel: 'Jumlah ketidakhadiran alpha',
  },
  {
    key: 'sakit',
    label: 'Sakit',
    modifier: 'sakit',
    icon: <IconMedical />,
    ariaLabel: 'Jumlah tidak hadir karena sakit',
  },
  {
    key: 'izin',
    label: 'Izin',
    modifier: 'izin',
    icon: <IconPermit />,
    ariaLabel: 'Jumlah tidak hadir dengan izin',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Single counter card.
 *
 * @param {{ config: Object, value: number|null, isLoading: boolean }} props
 */
function CounterCard({ config, value, isLoading }) {
  return (
    <article
      className={`counter-card counter-card--${config.modifier}`}
      aria-label={config.ariaLabel}
    >
      <div className="counter-card-icon" aria-hidden="true">
        {config.icon}
      </div>

      <div className="counter-card-body">
        {isLoading ? (
          <div className="counter-card-value is-loading" aria-busy="true" />
        ) : (
          <span className="counter-card-value">
            {value ?? 0}
          </span>
        )}
        <span className="counter-card-label">{config.label}</span>
      </div>
    </article>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * PresensiCounter
 *
 * Fetches attendance summary from `/api/siswa/dashboard` and renders
 * 5 colored counter cards as defined in the FigJam HTA diagram.
 *
 * @returns {preact.VNode}
 */
export default function PresensiCounter() {
  const [stats, setStats]       = useState(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await siswaApi.getDashboardStats()
      // Backend shape: { success, message, data: { tepat_waktu, ... } }
      setStats(res.data ?? null)
    } catch (err) {
      console.error('[PresensiCounter] Fetch error:', err)
      setError(err.message || 'Gagal memuat data presensi.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <section className="presensi-counter-section" aria-label="Ringkasan Presensi Siswa">
      <header>
        <h2 className="presensi-counter-title">Ringkasan Presensi</h2>
        <p className="presensi-counter-subtitle">
          Rekap kehadiran kamu di seluruh sesi laboratorium.
        </p>
      </header>

      {/* Error state */}
      {error && !isLoading && (
        <div className="presensi-counter-error" role="alert">
          <IconError />
          <span>{error}</span>
          <button
            type="button"
            className="counter-retry-btn"
            onClick={fetchStats}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Counter cards grid */}
      <div className="presensi-counter-grid" role="list">
        {COUNTER_CONFIG.map((config) => (
          <CounterCard
            key={config.key}
            config={config}
            value={stats?.[config.key] ?? null}
            isLoading={isLoading}
          />
        ))}
      </div>
    </section>
  )
}
