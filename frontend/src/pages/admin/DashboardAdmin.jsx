import RoleDashboardView from '../shared/RoleDashboardView.jsx';

export default function DashboardAdmin({ user, onLogout }) {
  return (
    <RoleDashboardView
      user={user}
      onLogout={onLogout}
      title="Dashboard Admin"
      subtitle="Monitoring Sekolah"
      scopeLabel="Cakupan sekolah"
    />
  );
}
