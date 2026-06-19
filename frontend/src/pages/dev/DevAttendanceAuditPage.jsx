import { useState } from 'preact/hooks';
import { fetchPresensiAudit, loginDev } from '../../features/presensi-scan/services/presensiScanApi.js';

function StatusBadge({ value }) {
  const tone =
    value === 'berhasil' || value === 'hadir'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : value === 'warning' || value === 'terlambat'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : value === 'invalid' || value === 'ditolak'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-slate-50 text-slate-700 border-slate-200';

  return <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{value || '-'}</span>;
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td className="px-3 py-4 text-center text-sm text-slate-500" colSpan={colSpan}>
        {text}
      </td>
    </tr>
  );
}

export function DevAttendanceAuditPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('Siap cek audit presensi.');

  const handleLoginAndLoad = async () => {
    setStatus('Login demo...');
    const login = await loginDev({ username: 'admin.demo', password: 'Rajasa@123' });

    if (!login.ok || !login.data?.success) {
      setStatus(login.data?.message || 'Login gagal.');
      return;
    }

    setStatus('Memuat audit presensi...');
    const audit = await fetchPresensiAudit({ token: login.data.data.token });

    if (!audit.ok || !audit.data?.success) {
      setStatus(audit.data?.message || 'Gagal memuat audit.');
      return;
    }

    setData(audit.data.data);
    setStatus(audit.data.message || 'Audit presensi berhasil dimuat.');
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase text-blue-700">Demo Audit</p>
          <h1 className="text-2xl font-bold">Hasil Presensi Terkini</h1>
          <p className="mt-2 text-sm text-slate-600">Menampilkan scan log dan presensi yang sudah masuk database.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a className="rounded-xl border px-4 py-2 font-semibold" href="/dev/scan">Kembali ke Scanner</a>
            <button className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white" onClick={handleLoginAndLoad}>
              Refresh Audit
            </button>
          </div>

          <div className="mt-4 rounded-xl border bg-slate-50 px-4 py-3 text-sm">{status}</div>
        </section>

        {data && (
          <>
            <section className="grid gap-3 sm:grid-cols-5">
              {Object.entries(data.summary || {}).map(([key, value]) => (
                <div className="rounded-2xl bg-white p-4 shadow-sm" key={key}>
                  <p className="text-xs uppercase text-slate-500">{key.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Scan Log Terbaru</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Sesi</th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">NISN</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Warning</th>
                      <th className="px-3 py-2">Rombel Sesi</th>
                      <th className="px-3 py-2">Rombel Siswa</th>
                      <th className="px-3 py-2">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.scan_logs || []).length === 0 && <EmptyRow colSpan={9} text="Belum ada scan log." />}
                    {(data.scan_logs || []).map((row) => (
                      <tr className="border-b" key={row.scan_log_id}>
                        <td className="px-3 py-2">{row.scan_log_id}</td>
                        <td className="px-3 py-2">{row.presensi_sesi_id || '-'}</td>
                        <td className="px-3 py-2 font-semibold">{row.payload_nama || '-'}</td>
                        <td className="px-3 py-2">{row.payload_nisn || '-'}</td>
                        <td className="px-3 py-2"><StatusBadge value={row.status_scan} /></td>
                        <td className="px-3 py-2">{row.warning_reason || '-'}</td>
                        <td className="px-3 py-2">{row.selected_rombel_id || '-'}</td>
                        <td className="px-3 py-2">{row.actual_rombel_id || '-'}</td>
                        <td className="px-3 py-2">{row.created_at || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">Presensi Masuk dari Scan</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Sesi</th>
                      <th className="px-3 py-2">Scan Log</th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">NISN</th>
                      <th className="px-3 py-2">Kelas</th>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2">Jam</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Mode</th>
                      <th className="px-3 py-2">Scan At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.attendance_rows || []).length === 0 && <EmptyRow colSpan={11} text="Belum ada presensi dari scan." />}
                    {(data.attendance_rows || []).map((row) => (
                      <tr className="border-b" key={row.presensi_id}>
                        <td className="px-3 py-2">{row.presensi_id}</td>
                        <td className="px-3 py-2">{row.presensi_sesi_id || '-'}</td>
                        <td className="px-3 py-2">{row.scan_log_id || '-'}</td>
                        <td className="px-3 py-2 font-semibold">{row.nama_lengkap || '-'}</td>
                        <td className="px-3 py-2">{row.nisn || '-'}</td>
                        <td className="px-3 py-2">{row.kelas_aktif || '-'}</td>
                        <td className="px-3 py-2">{row.tanggal || '-'}</td>
                        <td className="px-3 py-2">{row.jam_id || '-'}</td>
                        <td className="px-3 py-2"><StatusBadge value={row.status} /></td>
                        <td className="px-3 py-2">{row.mode_presensi || '-'}</td>
                        <td className="px-3 py-2">{row.scanned_at || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}