export function AppHeader({ title, subtitle }) {
  return (
    <header className="app-header">
      <div>
        {subtitle ? <p className="app-header__eyebrow">{subtitle}</p> : null}
        <h1 className="app-header__title">{title}</h1>
      </div>
    </header>
  );
}
