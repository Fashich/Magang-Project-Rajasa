export function AppSidebar({ brand = 'Rajasa', navItems = [] }) {
  return (
    <aside className="app-sidebar" aria-label="Navigasi utama">
      <div className="app-sidebar__brand">{brand}</div>
      <nav className="app-sidebar__nav">
        {navItems.map((item) => (
          <a key={item.href} className="app-sidebar__link" href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
