import { AppHeader } from './AppHeader.jsx';
import { AppSidebar } from './AppSidebar.jsx';
import './layout.css';

export function AppShell({ title, subtitle = 'Presensi Lab', navItems = [], children }) {
  return (
    <div className="app-shell">
      <AppSidebar navItems={navItems} />
      <div className="app-shell__main">
        <AppHeader title={title} subtitle={subtitle} />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
