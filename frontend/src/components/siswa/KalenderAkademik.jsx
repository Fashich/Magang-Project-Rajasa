/**
 * KalenderAkademik.jsx
 *
 * Displays the academic calendar PDF directly in the page.
 * Shown on: Dashboard Siswa → Kalender Akademik (Level 4).
 *
 * PDF features (Level 5):
 *   - Zoom in / Zoom out / Reset zoom
 *   - Download button (opens PDF file download)
 *
 * Behaviour:
 *   - Fetches PDF URL from GET /api/siswa/kalender-akademik
 *   - If pdf_url is returned  → renders <embed> PDF viewer
 *   - If pdf_url is null      → renders informational empty-state container
 *   - PDF directory on server: backend/server/kalender-akademik/*.pdf
 *     (auto-resolved by backend; directory created when first PDF is uploaded)
 *
 * @module components/siswa/KalenderAkademik
 * @author fashich/dashboard-siswa-page
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import { siswaApi } from '../../utils/api'
import './KalenderAkademik.css'

// ─── Zoom configuration ───────────────────────────────────────────────────────

const ZOOM_STEP    = 10   // percent per click
const ZOOM_MIN     = 50
const ZOOM_MAX     = 200
const ZOOM_DEFAULT = 100

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z" />
    </svg>
  )
}

function IconZoomIn() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2V7z" />
    </svg>
  )
}

function IconZoomOut() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 3h-1V1h-2v2H7V1H5v2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 18H4V8h16v13z" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
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
 * Loading skeleton shown while fetching PDF URL.
 */
function LoadingState() {
  return (
    <div className="kalender-loading" role="status" aria-label="Memuat kalender akademik">
      <div className="kalender-loading-spinner" aria-hidden="true" />
      <span>Memuat kalender akademik...</span>
    </div>
  )
}

/**
 * Empty state shown when no PDF has been uploaded yet.
 */
function EmptyState() {
  return (
    <div className="kalender-empty" role="status" aria-label="Kalender akademik belum tersedia">
      <div className="kalender-empty-icon" aria-hidden="true">
        <IconCalendar />
      </div>

      <h3 className="kalender-empty-title">
        Kalender Akademik Belum Tersedia
      </h3>

      <p className="kalender-empty-desc">
        File kalender akademik belum diunggah oleh admin.
        Silakan hubungi pihak sekolah atau cek kembali nanti.
      </p>

      <span className="kalender-empty-badge">
        <IconInfo />
        Menunggu unggahan dari admin
      </span>
    </div>
  )
}

/**
 * PDF toolbar — zoom controls + download button (Level 5 features).
 *
 * @param {{ zoom: number, pdfUrl: string, pdfName: string, onZoomIn: Function, onZoomOut: Function, onReset: Function }} props
 */
function PdfToolbar({ zoom, pdfUrl, pdfName, onZoomIn, onZoomOut, onReset }) {
  return (
    <div className="kalender-toolbar" role="toolbar" aria-label="Kontrol PDF">
      {/* Zoom controls */}
      <div className="zoom-group">
        <button
          type="button"
          className="zoom-btn"
          onClick={onZoomOut}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Perkecil tampilan PDF"
          title="Perkecil"
        >
          <IconZoomOut />
        </button>

        <span className="zoom-value" aria-live="polite" aria-label={`Zoom ${zoom}%`}>
          {zoom}%
        </span>

        <button
          type="button"
          className="zoom-btn"
          onClick={onZoomIn}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Perbesar tampilan PDF"
          title="Perbesar"
        >
          <IconZoomIn />
        </button>
      </div>

      <button
        type="button"
        className="zoom-reset-btn"
        onClick={onReset}
        aria-label="Reset zoom ke 100%"
        title="Reset zoom"
      >
        Reset
      </button>

      {/* Download button */}
      <a
        href={pdfUrl}
        download={pdfName ?? 'kalender-akademik.pdf'}
        className="kalender-download-btn"
        aria-label="Download kalender akademik PDF"
      >
        <IconDownload />
        Download
      </a>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * KalenderAkademik
 *
 * Fetches the academic calendar PDF URL from the backend and renders
 * an embedded PDF viewer with zoom + download controls.
 * Displays an informational empty-state if no PDF has been uploaded yet.
 *
 * @returns {preact.VNode}
 */
export default function KalenderAkademik() {
  const [pdfUrl,    setPdfUrl]    = useState(null)
  const [pdfName,   setPdfName]   = useState(null)
  const [isLoading, setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [zoom,      setZoom]      = useState(ZOOM_DEFAULT)

  const fetchKalender = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await siswaApi.getKalenderAkademik()
      // Backend shape: { success, message, data: { pdf_url, pdf_name } }
      setPdfUrl(res.data?.pdf_url   ?? null)
      setPdfName(res.data?.pdf_name ?? null)
    } catch (err) {
      console.error('[KalenderAkademik] Fetch error:', err)
      setError(err.message || 'Gagal memuat kalender akademik.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKalender()
  }, [])

  // ── Zoom handlers ──
  const handleZoomIn  = useCallback(() => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN)), [])
  const handleReset   = useCallback(() => setZoom(ZOOM_DEFAULT), [])

  return (
    <section className="kalender-section" aria-label="Kalender Akademik">

      {/* ── Page header ── */}
      <div className="kalender-header">
        <header>
          <h2 className="kalender-title">Kalender Akademik</h2>
          <p className="kalender-subtitle">
            Jadwal kegiatan akademik sekolah tahun ini.
          </p>
        </header>

        {/* Toolbar — only shown when PDF is available */}
        {!isLoading && !error && pdfUrl && (
          <PdfToolbar
            zoom={zoom}
            pdfUrl={pdfUrl}
            pdfName={pdfName}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
          />
        )}
      </div>

      {/* ── Error state ── */}
      {error && !isLoading && (
        <div className="kalender-error" role="alert">
          <IconError />
          <span>{error}</span>
          <button type="button" className="kalender-retry-btn" onClick={fetchKalender}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* ── Loading state ── */}
      {isLoading && <LoadingState />}

      {/* ── Content: PDF viewer or empty state ── */}
      {!isLoading && !error && (
        pdfUrl
          ? (
            <div className="kalender-viewer-wrap">
              <embed
                className="kalender-viewer-embed"
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                type="application/pdf"
                title="Kalender Akademik PDF"
                aria-label="Tampilan PDF Kalender Akademik"
                style={{
                  transform: `scale(${zoom / 100})`,
                  height:    `${zoom}%`,
                }}
              />
            </div>
          )
          : <EmptyState />
      )}
    </section>
  )
}
