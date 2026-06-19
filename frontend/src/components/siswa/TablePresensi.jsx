/**
 * TablePresensi.jsx
 *
 * Displays the student's full attendance history as a paginated table.
 * Shown on: Halaman Presensi (Level 4).
 *
 * Features:
 *   - Filter bar with chips: Tampilkan Semua, Tepat Waktu, Terlambat,
 *     Alpha, By Date (start – end), Sakit, Izin
 *   - Data table: 10 rows per page, columns: No, Tanggal, Ruangan,
 *     Kelas, Masuk, Keluar, Status, Keterangan
 *   - Pagination: prev / page numbers / next
 *   - Status badges with per-status color coding
 *   - Skeleton loading, empty state, error state with retry
 *
 * Data source: GET /api/siswa/presensi?filter=&page=&per_page=
 *
 * @module components/siswa/TablePresensi
 * @author fashich/dashboard-siswa-page
 */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { siswaApi } from '../../utils/api'
import './TablePresensi.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE = 10

// ─── Filter configuration ─────────────────────────────────────────────────────

/**
 * Ordered list of filter chips shown in the filter bar.
 * `value` matches the ?filter= query param sent to the backend.
 */
const FILTERS = [
  { value: 'semua',      label: 'Tampilkan Semua' },
  { value: 'hadir',      label: 'Tepat Waktu'     },
  { value: 'terlambat',  label: 'Terlambat'       },
  { value: 'alpha',      label: 'Alpha'            },
  { value: 'date_range', label: 'By Tanggal'       },
  { value: 'sakit',      label: 'Sakit'            },
  { value: 'izin',       label: 'Izin'             },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a date string (YYYY-MM-DD) to Indonesian locale short format.
 * @param {string|null} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Format a TIME string (HH:MM:SS) to HH:MM.
 * @param {string|null} timeStr
 * @returns {string}
 */
function formatTime(timeStr) {
  if (!timeStr) return '—'
  return timeStr.slice(0, 5)
}

/**
 * Map a backend status value to a human-readable label.
 * @param {string} status
 * @returns {string}
 */
function statusLabel(status) {
  const map = {
    hadir:     'Tepat Waktu',
    terlambat: 'Terlambat',
    alpha:     'Alpha',
    sakit:     'Sakit',
    izin:      'Izin',
  }
  return map[status] ?? status
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
    </svg>
  )
}

function IconEmpty() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.98 16.02 1 13.64 1c-1.3 0-2.43.56-3.24 1.44L9 4 7.6 2.44C6.79 1.56 5.66 1 4.36 1 1.98 1 0 2.98 0 5.36 0 5.84.11 6.28.18 6.72H0l2 14h20l2-14h-4zm-2 12H6L4.23 8h15.54L18 18z" />
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

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Status badge with per-status color.
 * @param {{ status: string }} props
 */
function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

/**
 * Skeleton placeholder rows shown while loading.
 * @param {{ rows: number }} props
 */
function SkeletonRows({ rows = PER_PAGE }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="skeleton-row" aria-hidden="true">
      {[40, 100, 90, 70, 65, 65, 90, 110].map((w, j) => (
        <td key={j}>
          <div className="skeleton-cell" style={{ width: w }} />
        </td>
      ))}
    </tr>
  ))
}

/**
 * Pagination controls — prev, page numbers, next.
 * @param {{ page: number, totalPages: number, total: number, onPageChange: Function }} props
 */
function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null

  // Build page number list with ellipsis for large ranges
  const pages = []
  const delta = 2
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const from = (page - 1) * PER_PAGE + 1
  const to   = Math.min(page * PER_PAGE, total)

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        Menampilkan {from}–{to} dari {total} data
      </span>

      <nav className="pagination-controls" role="navigation" aria-label="Pagination presensi">
        {/* Prev */}
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
        >
          <IconChevronLeft />
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '…'
            ? <span key={`ellipsis-${idx}`} style={{ padding: '0 0.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>…</span>
            : (
              <button
                key={p}
                type="button"
                className={`pagination-btn${page === p ? ' active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`Halaman ${p}`}
                aria-current={page === p ? 'page' : undefined}
              >
                {p}
              </button>
            )
        )}

        {/* Next */}
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Halaman berikutnya"
        >
          <IconChevronRight />
        </button>
      </nav>
    </div>
  )
}

/**
 * Filter bar with chip buttons and date-range inputs.
 * @param {{ active: string, dateStart: string, dateEnd: string, onFilterChange: Function, onDateApply: Function, onDateChange: Function }} props
 */
function FilterBar({ active, dateStart, dateEnd, onFilterChange, onDateApply, onDateChange }) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter data presensi">
      <span className="filter-bar-label">Filter:</span>

      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          data-filter={f.value}
          className={`filter-chip${active === f.value ? ' active' : ''}`}
          onClick={() => onFilterChange(f.value)}
          aria-pressed={active === f.value}
        >
          {/* Dot for status filters */}
          {['hadir','terlambat','alpha','sakit','izin'].includes(f.value) && (
            <span className="filter-chip-dot" aria-hidden="true" />
          )}
          {f.label}
        </button>
      ))}

      {/* Date range inputs — shown only when date_range filter is active */}
      {active === 'date_range' && (
        <div className="filter-date-group">
          <input
            type="date"
            className="filter-date-input"
            value={dateStart}
            max={dateEnd || undefined}
            aria-label="Tanggal mulai"
            onChange={(e) => onDateChange('start', e.currentTarget.value)}
          />
          <span className="filter-date-sep">s/d</span>
          <input
            type="date"
            className="filter-date-input"
            value={dateEnd}
            min={dateStart || undefined}
            aria-label="Tanggal akhir"
            onChange={(e) => onDateChange('end', e.currentTarget.value)}
          />
          <button
            type="button"
            className="filter-date-apply-btn"
            onClick={onDateApply}
          >
            Tampilkan
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * TablePresensi
 *
 * Full attendance history table for the student with filter and pagination.
 * Rendered for activeTab = 'halaman-presensi' in DashboardSiswa.
 *
 * @returns {preact.VNode}
 */
export default function TablePresensi() {
  // ── Data state ──
  const [rows,       setRows]       = useState([])
  const [meta,       setMeta]       = useState({ total: 0, page: 1, per_page: PER_PAGE, total_pages: 1 })
  const [isLoading,  setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // ── Filter state ──
  const [activeFilter, setActiveFilter] = useState('semua')
  const [dateStart,    setDateStart]    = useState('')
  const [dateEnd,      setDateEnd]      = useState('')

  // ── Pagination state ──
  const [page, setPage] = useState(1)

  // Track applied date range (only sent to API after clicking Tampilkan)
  const appliedDateRef = useRef({ start: '', end: '' })

  // ── Fetch ──
  const fetchPresensi = useCallback(async (targetPage = 1, filter = activeFilter) => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        filter,
        page:     targetPage,
        per_page: PER_PAGE,
      }

      if (filter === 'date_range') {
        params.date_start = appliedDateRef.current.start
        params.date_end   = appliedDateRef.current.end
      }

      const res = await siswaApi.getPresensi(params)
      // Backend shape: { success, message, data: [...rows], meta: {...} }
      setRows(res.data ?? [])
      setMeta(res.meta ?? { total: 0, page: targetPage, per_page: PER_PAGE, total_pages: 1 })
      setPage(targetPage)
    } catch (err) {
      console.error('[TablePresensi] Fetch error:', err)
      setError(err.message || 'Gagal memuat data presensi.')
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  // Initial fetch
  useEffect(() => {
    fetchPresensi(1, 'semua')
  }, [])

  // ── Handlers ──

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter)
    // For date_range, wait for user to click Tampilkan
    if (filter !== 'date_range') {
      fetchPresensi(1, filter)
    }
  }, [fetchPresensi])

  const handleDateChange = useCallback((which, value) => {
    if (which === 'start') setDateStart(value)
    else setDateEnd(value)
  }, [])

  const handleDateApply = useCallback(() => {
    appliedDateRef.current = { start: dateStart, end: dateEnd }
    fetchPresensi(1, 'date_range')
  }, [dateStart, dateEnd, fetchPresensi])

  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > meta.total_pages) return
    fetchPresensi(newPage, activeFilter)
  }, [meta.total_pages, activeFilter, fetchPresensi])

  // ── Render ──

  const startIndex = (page - 1) * PER_PAGE

  return (
    <section className="presensi-table-section" aria-label="Halaman Presensi Siswa">

      {/* Header */}
      <header>
        <h2 className="presensi-table-title">Riwayat Presensi</h2>
        <p className="presensi-table-subtitle">
          Rekap lengkap kehadiran kamu di seluruh sesi laboratorium.
        </p>
      </header>

      {/* Filter bar */}
      <FilterBar
        active={activeFilter}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onFilterChange={handleFilterChange}
        onDateApply={handleDateApply}
        onDateChange={handleDateChange}
      />

      {/* Table card */}
      <div className="presensi-table-card">
        <div className="presensi-table-wrap">
          <table className="presensi-table" aria-label="Tabel riwayat presensi">
            <thead>
              <tr>
                <th className="col-no" scope="col">No</th>
                <th scope="col">Tanggal</th>
                <th scope="col">Ruangan</th>
                <th scope="col">Kelas</th>
                <th scope="col">Jam Sesi</th>
                <th scope="col">Selesai</th>
                <th scope="col">Status</th>
                <th scope="col">Keterangan</th>
              </tr>
            </thead>

            <tbody>
              {/* Loading skeleton */}
              {isLoading && <SkeletonRows />}

              {/* Error state */}
              {!isLoading && error && (
                <tr>
                  <td className="table-empty-cell" colSpan={8}>
                    <div className="table-state-icon is-error" aria-hidden="true">
                      <IconError />
                    </div>
                    <p className="table-state-title">Gagal Memuat Data</p>
                    <p className="table-state-desc">{error}</p>
                    <button
                      type="button"
                      className="table-retry-btn"
                      onClick={() => fetchPresensi(page, activeFilter)}
                    >
                      Coba Lagi
                    </button>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!isLoading && !error && rows.length === 0 && (
                <tr>
                  <td className="table-empty-cell" colSpan={8}>
                    <div className="table-state-icon" aria-hidden="true">
                      <IconEmpty />
                    </div>
                    <p className="table-state-title">Tidak Ada Data</p>
                    <p className="table-state-desc">
                      Tidak ada data presensi yang sesuai dengan filter yang dipilih.
                    </p>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!isLoading && !error && rows.map((row, idx) => (
                <tr key={row.presensi_id}>
                  <td className="col-no">{startIndex + idx + 1}</td>
                  <td>{formatDate(row.tanggal)}</td>
                  <td>{row.ruangan   || '—'}</td>
                  <td>{row.kelas     || '—'}</td>
                  <td>{row.label_jam ? `${row.label_jam} (${formatTime(row.waktu_mulai)})` : formatTime(row.waktu_mulai)}</td>
                  <td>{formatTime(row.waktu_selesai)}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.keterangan || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !error && rows.length > 0 && (
          <Pagination
            page={page}
            totalPages={meta.total_pages}
            total={meta.total}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </section>
  )
}
