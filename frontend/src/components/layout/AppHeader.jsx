function displayName(user) {
  return user?.nama_lengkap || user?.name || user?.username || 'Pengguna';
}

export function AppHeader({ title, subtitle, user, onLogout }) {
  return (
    <header className="app-header">
      <div>
        {subtitle ? <p className="app-header__eyebrow">{subtitle}</p> : null}
        <h1 className="app-header__title">{title}</h1>
      </div>

      <div className="app-header__account">
        <div className="app-header__user">
          <span>{displayName(user)}</span>
          <small>{user?.user_type || 'role'}</small>
        </div>
        {onLogout ? (
          <button type="button" className="app-header__logout" onClick={onLogout}>
            Keluar
          </button>
        ) : null}
      </div>
    </header>
  );
}
