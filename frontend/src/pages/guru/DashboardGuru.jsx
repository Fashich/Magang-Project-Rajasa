import RoleDashboardView from '../shared/RoleDashboardView.jsx';

export default function DashboardGuru({ user, onLogout }) {
  return (
    <RoleDashboardView
      user={user}
      onLogout={onLogout}
      title="Dashboard Guru"
      subtitle="Monitoring Rombel"
      scopeLabel="Cakupan guru"
    />
  );
}
