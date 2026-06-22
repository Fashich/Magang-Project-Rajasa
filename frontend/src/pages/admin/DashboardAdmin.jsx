import { useEffect, useRef, useState } from 'preact/hooks';
import api from '../../utils/api';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Chart, registerables } from 'chart.js';

<<<<<<< Updated upstream
Chart.register(...registerables);
=======
import AdminLayout from './AdminLayout'
import AdminDashboardPage from './AdminDashboardPage'
import UsersPage from './UsersPage'
import SesiPage from './SesiPage'
import AuditPage from './AuditPage'
import LaporanPage from './LaporanPage'
import AnalitikPage from './AnalitikPage'
import PengaturanPage from './PengaturanPage'
import EarlyWarningPage from './EarlyWarningPage'
>>>>>>> Stashed changes

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

<<<<<<< Updated upstream
=======
// ─── Daftar semua halaman ────────────────────────────────────────────────────
// Halaman ComingSoon (belum ada data) tidak perlu keep-alive — ringan saja.
// Halaman nyata (ada fetch) → selalu di-render, visibility dikontrol.

const REAL_PAGES = ['dashboard','analitik','sesi','users','laporan','audit','settings']

function PageSlot({ id, activePage, children }) {
  const isActive = activePage === id
  return (
    <div
      key={id}
      style={{
        display: isActive ? '' : 'none',
        // Pastikan slot mengisi full height container saat aktif
        minHeight: isActive ? '100%' : undefined,
      }}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

// ─── Render semua page sekaligus, sembunyikan yang tidak aktif ───────────────

function AllPages({ activePage, onNav }) {
  return (
    <>
      <PageSlot id="dashboard" activePage={activePage}>
        <AdminDashboardPage onNav={onNav} />
      </PageSlot>

      <PageSlot id="analitik" activePage={activePage}>
        <AnalitikPage />
      </PageSlot>

      {/* SesiPage punya auto-refresh 1 detik — kirim pageActive agar interval
          berhenti saat halaman disembunyikan */}
      <PageSlot id="sesi" activePage={activePage}>
        <SesiPage pageActive={activePage === 'sesi'} />
      </PageSlot>

      <PageSlot id="peringatan" activePage={activePage}>
        <EarlyWarningPage />
      </PageSlot>

      <PageSlot id="users" activePage={activePage}>
        <UsersPage />
      </PageSlot>

      <PageSlot id="laporan" activePage={activePage}>
        <LaporanPage />
      </PageSlot>

      <PageSlot id="audit" activePage={activePage}>
        <AuditPage />
      </PageSlot>

      <PageSlot id="settings" activePage={activePage}>
        <PengaturanPage />
      </PageSlot>

      {/* Halaman ComingSoon — tidak perlu keep-alive, render hanya saat aktif */}
      {activePage === 'e-izin' && (
        <ComingSoon title="Portal E-Izin"
          desc="Approval berjenjang izin/sakit siswa — ortu → wali kelas → BK." icon="📅" />
      )}

    </>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

>>>>>>> Stashed changes
export default function DashboardAdmin({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await api.get('/dashboard');
        if (!mounted) return;
        setData(res.data || res);
        // fetch early warnings
        try {
          const warnRes = await api.get('/early-warnings');
          if (mounted) setWarnings(warnRes.data?.warnings || warnRes.warnings || []);
        } catch (e) {
          // ignore warning fetch errors
          console.error('Early warnings fetch failed', e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    const labels = (data.trend || []).map((r) => r.tanggal || '');
    const hadir = (data.trend || []).map((r) => r.hadir || 0);
    const terlambat = (data.trend || []).map((r) => r.terlambat || 0);

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
            data: hadir,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.12)',
            tension: 0.3,
          },
          {
            label: 'Terlambat',
            data: terlambat,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            tension: 0.3,
          },
        ],
      },
      options: { maintainAspectRatio: false },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  const totals = data?.totals || {};

  return (
    <AppShell title={`Dashboard Admin`} navItems={[]}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Tepat Waktu" value={totals.tepat_waktu ?? 0} />
        <StatCard label="Terlambat" value={totals.terlambat ?? 0} />
        <StatCard label="Sakit" value={totals.sakit ?? 0} />
      </div>

      <section style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '.5rem' }}>Trend 7 Hari</h3>
        <div style={{ height: 320 }}>
          <canvas ref={canvasRef} />
        </div>
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h3 style={{ marginBottom: '.5rem' }}>Peringatan Dini</h3>
        {warnings.length === 0 ? (
          <p>Tidak ada peringatan untuk saat ini.</p>
        ) : (
          <ul className="warning-list">
            {warnings.map((w) => (
              <li key={w.siswa_id}>
                {w.nama_lengkap} — Absensi alpha: {w.alpha_count} dalam 14 hari
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
