<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\Siswa;
use Rajasa\PresensiSiswa\Models\PresensiJamSiswa;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * AdminDashboardController
 *
 * GET /api/dashboard — Admin overview stats
 *
 * @author feature/admin-dashboard
 */
final class AdminDashboardController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        if ($user->user_type !== 'admin') {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        // ── Summary ──────────────────────────────────────────────────────────

        $totalSiswa  = Siswa::where('status', 'aktif')->count();
        $totalRombel = DB::table('rombel')->where('status', 'aktif')->count();
        $sesiAktif   = DB::table('presensi_sesi')
            ->whereIn('status', ['aktif', 'suspended'])
            ->count();

        // ── Status totals (today) ─────────────────────────────────────────────

        $todayTotals = PresensiJamSiswa::query()
            ->whereDate('created_at', now()->toDateString())
            ->selectRaw("
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'alpha')     AS alpha,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                COUNT(*)                  AS total
            ")
            ->first();

        $totals = [
            'hadir'     => (int) ($todayTotals->hadir     ?? 0),
            'terlambat' => (int) ($todayTotals->terlambat ?? 0),
            'alpha'     => (int) ($todayTotals->alpha     ?? 0),
            'sakit'     => (int) ($todayTotals->sakit     ?? 0),
            'izin'      => (int) ($todayTotals->izin      ?? 0),
            'total'     => (int) ($todayTotals->total     ?? 0),
        ];

        // ── Trend 14 days ─────────────────────────────────────────────────────

        $trendRows = PresensiJamSiswa::query()
            ->where('created_at', '>=', now()->subDays(14)->startOfDay())
            ->selectRaw("
                DATE(created_at) AS date,
                status,
                COUNT(*) AS jumlah
            ")
            ->groupByRaw("DATE(created_at), status")
            ->orderBy('date')
            ->get();

        $trendMap = [];
        foreach ($trendRows as $row) {
            $d = $row->date;
            if (!isset($trendMap[$d])) {
                $trendMap[$d] = [
                    'date'     => $d,
                    'statuses' => ['hadir' => 0, 'terlambat' => 0, 'alpha' => 0, 'sakit' => 0, 'izin' => 0],
                ];
            }
            $trendMap[$d]['statuses'][$row->status] = (int) $row->jumlah;
        }

        // ── Rombel breakdown ──────────────────────────────────────────────────
        // FIX: kolom yang benar adalah rombel_id_aktif (bukan rombel_id)
        //      dan label_rombel (bukan label)

        $rombelRows = DB::table('rombel AS r')
            ->leftJoin('siswa AS s', function ($j) {
                $j->on('s.rombel_id_aktif', '=', 'r.rombel_id')
                  ->where('s.status', '=', 'aktif');
            })
            ->leftJoin('presensi_jam_siswa AS pjs', function ($j) {
                $j->on('pjs.siswa_id', '=', 's.siswa_id')
                  ->whereRaw("DATE(pjs.created_at) = CURDATE()");
            })
            ->where('r.status', 'aktif')
            ->selectRaw("
                r.rombel_id,
                r.label_rombel AS label,
                COUNT(DISTINCT s.siswa_id) AS total_siswa,
                SUM(CASE WHEN pjs.status IN ('hadir','terlambat') THEN 1 ELSE 0 END) AS hadir
            ")
            ->groupBy('r.rombel_id', 'r.label_rombel')
            ->orderBy('r.label_rombel')
            ->limit(10)
            ->get();

        $rombelBreakdown = $rombelRows->map(function ($r) {
            $total = (int) $r->total_siswa;
            $hadir = (int) $r->hadir;
            return [
                'rombel_id'       => $r->rombel_id,
                'label'           => $r->label,
                'total_siswa'     => $total,
                'attendance_rate' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })->values()->toArray();

        Response::success('Data dashboard admin.', [
            'summary' => [
                'total_siswa'    => $totalSiswa,
                'total_rombel'   => $totalRombel,
                'sesi_aktif'     => $sesiAktif,
                'total_presensi' => $totals['total'],
            ],
            'totals'           => $totals,
            'trend'            => array_values($trendMap),
            'rombel_breakdown' => $rombelBreakdown,
        ]);
    }
}
