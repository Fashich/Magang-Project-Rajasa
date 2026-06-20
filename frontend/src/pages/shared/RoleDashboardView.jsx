import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Chart, registerables } from 'chart.js';
import api from '../../utils/api';
import { AppShell } from '../../components/layout/AppShell.jsx';
import './RoleDashboardView.css';

Chart.register(...registerables);

const STATUS_LABELS = {
  tepat_waktu: 'Tepat Waktu',
  terlambat: 'Terlambat',
  sakit: 'Sakit',
  izin: 'Izin',
  alpha: 'Alpha',
};

const STATUS_COLORS = {
  tepat_waktu: '#0f9f6e',
  terlambat: '#d97706',
  sakit: '#2563eb',
  izin: '#7c3aed',
  alpha: '#dc2626',
};

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value || 0));
}

function StatCard({ label, value, tone = 'neutral' }) {
  return (
    <article className={`role-stat role-stat--${tone}`}>
      <p className="role-stat__label">{label}</p>
      <strong className="role-stat__value">{formatNumber(value)}</strong>
    </article>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="role-summary__item">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}

function useRoleDashboard() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    data: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchDashboard() {
      try {
        const response = await api.get('/dashboard');
        if (!mounted) return;
        setState({ loading: false, error: '', data: response.data || null });
      } catch (error) {
        if (!mounted) return;
        setState({
          loading: false,
          error: error.message || 'Dashboard belum bisa dimuat.',
          data: null,
        });
      }
    }

    fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

function TrendChart({ trend }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const labels = trend.map((row) => row.tanggal || '-');

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Hadir',
            data: trend.map((row) => row.hadir || 0),
            borderColor: STATUS_COLORS.tepat_waktu,
            backgroundColor: 'rgba(15, 159, 110, 0.12)',
            tension: 0.32,
            fill: true,
          },
          {
            label: 'Terlambat',
            data: trend.map((row) => row.terlambat || 0),
            borderColor: STATUS_COLORS.terlambat,
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            tension: 0.32,
          },
          {
            label: 'Alpha',
            data: trend.map((row) => row.alpha || 0),
            borderColor: STATUS_COLORS.alpha,
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            tension: 0.32,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [trend]);

  return <canvas ref={canvasRef} aria-label="Tren presensi tujuh hari" role="img" />;
}

export default function RoleDashboardView({ user, onLogout, title, subtitle, scopeLabel }) {
  const { loading, error, data } = useRoleDashboard();
  const totals = data?.totals || {};
  const summary = data?.summary || {};
  const trend = data?.trend || [];
  const scope = data?.scope || {};

  const statCards = useMemo(
    () => [
      ['tepat_waktu', 'success'],
      ['terlambat', 'warning'],
      ['sakit', 'info'],
      ['izin', 'accent'],
      ['alpha', 'danger'],
    ],
    []
  );

  const navItems = [
    { href: '#dashboard', label: 'Dashboard' },
    { href: '#presensi', label: 'Presensi' },
    { href: '#laporan', label: 'Laporan' },
  ];

  return (
    <AppShell title={title} subtitle={subtitle} navItems={navItems} user={user} onLogout={onLogout}>
      <section className="role-dashboard">
        <div className="role-dashboard__intro">
          <div>
            <p className="role-dashboard__eyebrow">{scopeLabel}</p>
            <h2>{scope.label || 'Ringkasan Presensi'}</h2>
          </div>
          <div className="role-dashboard__period">
            <span>Periode</span>
            <strong>7 hari terakhir</strong>
          </div>
        </div>

        {loading ? <div className="role-alert">Memuat data dashboard...</div> : null}
        {error ? <div className="role-alert role-alert--danger">{error}</div> : null}

        <div className="role-stats" aria-label="Kartu ringkasan presensi">
          {statCards.map(([key, tone]) => (
            <StatCard key={key} label={STATUS_LABELS[key]} value={totals[key]} tone={tone} />
          ))}
        </div>

        <div className="role-dashboard__grid">
          <section className="role-panel role-panel--chart">
            <div className="role-panel__header">
              <div>
                <p>Analitik</p>
                <h3>Tren Presensi</h3>
              </div>
            </div>
            <div className="role-chart">
              {trend.length > 0 ? (
                <TrendChart trend={trend} />
              ) : (
                <div className="role-empty">Belum ada data presensi untuk divisualisasikan.</div>
              )}
            </div>
          </section>

          <aside className="role-panel">
            <div className="role-panel__header">
              <div>
                <p>Operasional</p>
                <h3>Ringkasan</h3>
              </div>
            </div>
            <div className="role-summary">
              <SummaryItem label="Total Siswa" value={summary.total_siswa} />
              <SummaryItem label="Rombel Aktif" value={summary.total_rombel} />
              <SummaryItem label="Sesi Aktif" value={summary.sesi_aktif} />
              <SummaryItem label="Total Rekaman" value={summary.total_presensi} />
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
