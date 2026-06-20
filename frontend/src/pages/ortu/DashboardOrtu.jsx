import RoleDashboardView from '../shared/RoleDashboardView.jsx';

export default function DashboardOrtu({ user, onLogout }) {
  return (
    <RoleDashboardView
      user={user}
      onLogout={onLogout}
      title="Dashboard Orang Tua"
      subtitle="Pantauan Anak"
      scopeLabel="Cakupan anak"
    />
  );
}
