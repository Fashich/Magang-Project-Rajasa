export function AppSidebar({ brand = 'Rajasa', navItems = [] }) {
  return (
    <aside className="app-sidebar" aria-label="Navigasi utama">
      <div className="app-sidebar__brand">
        <span>{brand}</span>
        <small>Presensi Lab</small>
      </div>
      <nav className="app-sidebar__nav">
        {navItems.map((item, index) => (
          <a
            key={item.href}
            className={`app-sidebar__link${index === 0 ? ' app-sidebar__link--active' : ''}`}
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
