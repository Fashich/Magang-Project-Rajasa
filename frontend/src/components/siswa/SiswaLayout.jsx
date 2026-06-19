/**
 * SiswaLayout.jsx
 *
 * Root layout component for the student (siswa) dashboard.
 * Renders:
 *   - Fixed top header  → Level 2 navigation (Dashboard Siswa, Presensi)
 *   - Collapsible sidebar → Level 3 menu items (dynamic per active tab)
 *   - Logout button      → bottom of sidebar
 *   - Slot for page content (children)
 *
 * Architecture reference: HTA-Magang-SMK-Rajasa-Siswa.png
 * Font: Poppins 16.5 / 19.5 (per FigJam spec)
 *
 * @module components/siswa/SiswaLayout
 * @author fashich/dashboard-siswa-page
 */

import { useState, useEffect, useCallback } from 'preact/hooks'
import { authApi } from '../../utils/api'
import auth from '../../utils/auth'
import './SiswaLayout.css'

// ─── Theme key ────────────────────────────────────────────────────────────────
const THEME_KEY = 'rajasa-presensi-theme'

// ─── SVG Icon Primitives ─────────────────────────────────────────────────────

/** Grid / Dashboard icon */
function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  )
}

/** Clipboard / Presensi icon */
function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3h-4.18A3 3 0 0 0 9.18 3H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 18H5V5h2v3h10V5h2v16z" />
    </svg>
  )
}

/** Chart bar — counter presensi icon */
function IconBarChart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16 13h3v6h-3v-6z" />
    </svg>
  )
}

/** Calendar / Kalender Akademik icon */
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 3h-1V1h-2v2H7V1H5v2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 18H4V8h16v13z" />
    </svg>
  )
}

/** Logout / sign-out icon */
function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z" />
    </svg>
  )
}

/** Hamburger menu toggle icon */
function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  )
}

/** Theme toggle icon */
function IconTheme() {
  return (
    <img
      src="/icon/circle-half-stroke-solid-full.svg"
      alt=""
      style={{ width: 20, height: 20, display: 'block', filter: 'var(--theme-toggle-icon-filter, none)' }}
    />
  )
}

/** School / brand icon */
function IconSchool() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
    </svg>
  )
}

// ─── Navigation Configuration ────────────────────────────────────────────────

/**
 * Level 2 header tabs configuration.
 * Each tab defines which Level 3 sidebar items it exposes.
 *
 * @type {Array<{id: string, label: string, icon: preact.VNode, sidebar: Array}>}
 */
const NAV_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard Siswa',
    icon: <IconDashboard />,
    /** Level 3 sidebar items shown when this tab is active */
    sidebar: [
      {
        id: 'presensi',
        label: 'Presensi',
        icon: <IconBarChart />,
      },
      {
        id: 'kalender',
        label: 'Kalender Akademik',
        icon: <IconCalendar />,
      },
    ],
  },
  {
    id: 'halaman-presensi',
    label: 'Halaman Presensi',
    icon: <IconClipboard />,
    /** No specific sidebar items — content rendered directly */
    sidebar: [],
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Top fixed header bar containing the sidebar toggle, brand mark,
 * Level 2 navigation tabs, and logged-in user info.
 *
 * @param {{ activeTab: string, onTabChange: Function, onToggleSidebar: Function, user: Object }} props
 */
function SiswaHeader({ activeTab, onTabChange, onToggleSidebar, onToggleTheme, theme, user }) {
  // Derive initials from nama_lengkap or username for the avatar
  const initials = (user?.nama_lengkap || user?.username || 'S')
    .charAt(0)
    .toUpperCase()

  return (
    <header className="siswa-header" role="banner">
      {/* Sidebar toggle */}
      <button
        className="header-toggle-btn"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        type="button"
      >
        <IconMenu />
      </button>

      {/* Brand */}
      <div className="header-brand" aria-label="Sistem Presensi Lab SMK Rajasa">
        <div className="header-brand-icon" aria-hidden="true">
          <IconSchool />
        </div>
        <span className="header-brand-text">Presensi Lab</span>
      </div>

      {/* Level 2 navigation tabs */}
      <nav className="header-nav" role="navigation" aria-label="Menu utama siswa">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`header-nav-item${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <button
        type="button"
        className="header-toggle-btn"
        onClick={onToggleTheme}
        aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
        style={{ marginLeft: 'auto' }}
      >
        <IconTheme />
      </button>

      {/* User info */}
      <div className="header-user" aria-label={`Pengguna: ${user?.nama_lengkap || user?.username}`}>
        <div className="header-user-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="header-user-info">
          <span className="header-user-name">
            {user?.nama_lengkap || user?.username || 'Siswa'}
          </span>
          <span className="header-user-role">Siswa</span>
        </div>
      </div>
    </header>
  )
}

/**
 * Collapsible sidebar displaying Level 3 menu items based on the
 * currently active Level 2 header tab, plus the logout button at the bottom.
 *
 * @param {{ collapsed: boolean, activeTab: string, activePage: string, onPageChange: Function, onLogout: Function, isLoggingOut: boolean }} props
 */
function SiswaSidebar({ collapsed, activeTab, activePage, onPageChange, onLogout, isLoggingOut }) {
  // Find the sidebar items for the current active tab
  const currentTab = NAV_TABS.find((t) => t.id === activeTab)
  const sidebarItems = currentTab?.sidebar ?? []

  return (
    <aside
      className="siswa-sidebar"
      aria-label="Sidebar navigasi siswa"
    >
      {/* Brand inside sidebar (visible when sidebar is open) */}
      <div className="sidebar-brand" aria-hidden={collapsed}>
        <div className="sidebar-brand-icon">
          <IconSchool />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <strong>SMK Rajasa</strong>
            <span>Sistem Presensi</span>
          </div>
        )}
      </div>

      {/* Level 3 nav items */}
      <nav className="sidebar-nav" role="navigation" aria-label="Menu sidebar">
        {sidebarItems.length > 0 ? (
          <div className="sidebar-nav-section">
            {!collapsed && (
              <div className="sidebar-nav-label" aria-hidden="true">
                Menu
              </div>
            )}
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item${activePage === item.id ? ' active' : ''}`}
                onClick={() => onPageChange(item.id)}
                aria-current={activePage === item.id ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        ) : (
          /* Empty state when a tab has no sidebar items */
          !collapsed && (
            <p className="sidebar-empty">
              Tidak ada menu tambahan.
            </p>
          )
        )}
      </nav>

      {/* Logout — always at bottom of sidebar */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={onLogout}
          disabled={isLoggingOut}
          title={collapsed ? 'Keluar' : undefined}
          aria-label="Keluar dari sistem"
        >
          <span className="nav-icon" aria-hidden="true">
            <IconLogout />
          </span>
          {!collapsed && (
            <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
          )}
        </button>
      </div>
    </aside>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * SiswaLayout
 *
 * Top-level layout wrapper for all student pages.
 * Manages active header tab (Level 2) and active sidebar page (Level 3),
 * then renders the matching page content via the `renderPage` render-prop.
 *
 * Usage in app.jsx:
 * ```jsx
 * <SiswaLayout
 *   user={authUser}
 *   onLogout={handleLogout}
 *   renderPage={(activeTab, activePage) => (
 *     <DashboardContent tab={activeTab} page={activePage} />
 *   )}
 * />
 * ```
 *
 * @param {{ user: Object, onLogout: Function, renderPage: Function }} props
 */
export default function SiswaLayout({ user, onLogout, renderPage }) {
  // Level 2 active tab — defaults to 'dashboard'
  const [activeTab, setActiveTab] = useState('dashboard')

  // Level 3 active sidebar page — defaults to 'presensi'
  const [activePage, setActivePage] = useState('presensi')

  // Sidebar collapsed state
  const [collapsed, setCollapsed] = useState(false)

  // Loading state for logout
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Theme state
  const [theme, setTheme] = useState(() =>
    localStorage.getItem(THEME_KEY) || 'light'
  )

  // Apply theme to <html> on mount and change
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const handleToggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  /**
   * When the active header tab changes, reset the sidebar to the first
   * available item for that tab (or null if no items).
   */
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
    const tab = NAV_TABS.find((t) => t.id === tabId)
    setActivePage(tab?.sidebar[0]?.id ?? null)
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  /**
   * Perform logout: call the API, then propagate to parent (app.jsx).
   */
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await authApi.logout()
    } catch (error) {
      console.error('[SiswaLayout] Logout error:', error)
    } finally {
      setIsLoggingOut(false)
      if (typeof onLogout === 'function') onLogout()
    }
  }, [isLoggingOut, onLogout])

  return (
    <div className={`siswa-layout${collapsed ? ' sidebar-collapsed' : ''}`}>
      {/* ── Level 2: Header ── */}
      <SiswaHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleSidebar={handleToggleSidebar}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        user={user}
      />

      {/* ── Level 3: Sidebar ── */}
      <SiswaSidebar
        collapsed={collapsed}
        activeTab={activeTab}
        activePage={activePage}
        onPageChange={setActivePage}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* ── Level 4+: Page content (injected by parent) ── */}
      <main className="siswa-content" id="main-content">
        <div className="siswa-page-content">
          {typeof renderPage === 'function'
            ? renderPage(activeTab, activePage)
            : null}
        </div>
      </main>
    </div>
  )
}
