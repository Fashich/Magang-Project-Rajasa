<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * AnalitikController
 *
 * GET /api/admin/analitik
 * Query params:
 *   jenis=tren|distribusi|rombel_ranking|jam_heatmap  (default: tren)
 *   tanggal_dari=Y-m-d    (default: 30 hari lalu)
 *   tanggal_sampai=Y-m-d  (default: hari ini)
 *
 * @author feature/admin-dashboard
 */
final class AnalitikController
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

        $jenis         = $_GET['jenis']          ?? 'tren';
        $tanggalDari   = $_GET['tanggal_dari']   ?? Carbon::now()->subDays(29)->toDateString();
        $tanggalSampai = $_GET['tanggal_sampai'] ?? Carbon::now()->toDateString();

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalDari))  {
            $tanggalDari = Carbon::now()->subDays(29)->toDateString();
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalSampai)) {
            $tanggalSampai = Carbon::now()->toDateString();
        }

        match ($jenis) {
            'distribusi'     => $this->distribusi($tanggalDari, $tanggalSampai),
            'rombel_ranking' => $this->rombelRanking($tanggalDari, $tanggalSampai),
            'jam_heatmap'    => $this->jamHeatmap($tanggalDari, $tanggalSampai),
            default          => $this->tren($tanggalDari, $tanggalSampai),
        };
    }

    // ── 1. Tren kehadiran harian ─────────────────────────────────────────────

    private function tren(string $dari, string $sampai): void
    {
        $rows = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("
                tanggal,
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'alpha')     AS alpha,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                COUNT(*)                  AS total
            ")
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        // Rata-rata 7 hari terakhir untuk perbandingan
        $avg7 = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [Carbon::now()->subDays(6)->toDateString(), Carbon::now()->toDateString()])
            ->selectRaw("
                AVG(status IN ('hadir','terlambat')) * 100 AS avg_rate_7d
            ")
            ->value('avg_rate_7d');

        $avg30 = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("
                AVG(status IN ('hadir','terlambat')) * 100 AS avg_rate
            ")
            ->value('avg_rate');

        $data = $rows->map(function ($r) {
            $hadir = (int) $r->hadir + (int) $r->terlambat;
            $total = (int) $r->total;
            return [
                'tanggal'   => $r->tanggal,
                'hadir'     => (int) $r->hadir,
                'terlambat' => (int) $r->terlambat,
                'alpha'     => (int) $r->alpha,
                'sakit'     => (int) $r->sakit,
                'izin'      => (int) $r->izin,
                'total'     => $total,
                'rate'      => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })->values()->all();

        Response::success('Tren kehadiran.', [
            'jenis'          => 'tren',
            'tanggal_dari'   => $dari,
            'tanggal_sampai' => $sampai,
            'data'           => $data,
            'meta' => [
                'avg_rate_periode' => round((float) ($avg30 ?? 0), 1),
                'avg_rate_7d'      => round((float) ($avg7  ?? 0), 1),
                'total_hari'       => count($data),
            ],
        ]);
    }

    // ── 2. Distribusi status (pie/donut) ─────────────────────────────────────

    private function distribusi(string $dari, string $sampai): void
    {
        $global = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("
                COUNT(*)                  AS total,
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'alpha')     AS alpha,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin
            ")
            ->first();

        $total = (int) ($global->total ?? 0);

        $dist = [
            ['status' => 'hadir',     'jumlah' => (int)($global->hadir     ?? 0), 'pct' => 0, 'color' => '#10b981'],
            ['status' => 'terlambat', 'jumlah' => (int)($global->terlambat ?? 0), 'pct' => 0, 'color' => '#f59e0b'],
            ['status' => 'alpha',     'jumlah' => (int)($global->alpha     ?? 0), 'pct' => 0, 'color' => '#ef4444'],
            ['status' => 'sakit',     'jumlah' => (int)($global->sakit     ?? 0), 'pct' => 0, 'color' => '#3b82f6'],
            ['status' => 'izin',      'jumlah' => (int)($global->izin      ?? 0), 'pct' => 0, 'color' => '#8b5cf6'],
        ];

        foreach ($dist as &$d) {
            $d['pct'] = $total > 0 ? round(($d['jumlah'] / $total) * 100, 1) : 0;
        }

        // Per tingkatan
        $perTingkatan = DB::table('presensi_jam_siswa AS pjs')
            ->join('rombel AS r', 'r.rombel_id', '=', 'pjs.rombel_id_snapshot')
            ->whereBetween('pjs.tanggal', [$dari, $sampai])
            ->whereNotNull('pjs.rombel_id_snapshot')
            ->selectRaw("
                r.tingkatan,
                COUNT(*)                  AS total,
                SUM(pjs.status IN ('hadir','terlambat')) AS hadir,
                SUM(pjs.status = 'alpha') AS alpha
            ")
            ->groupBy('r.tingkatan', 'r.tingkat_angka')
            ->orderBy('r.tingkat_angka')
            ->get()
            ->map(function ($r) {
                $total = (int) $r->total;
                return [
                    'tingkatan' => $r->tingkatan,
                    'total'     => $total,
                    'hadir'     => (int) $r->hadir,
                    'alpha'     => (int) $r->alpha,
                    'rate'      => $total > 0 ? round(((int)$r->hadir / $total) * 100, 1) : 0,
                ];
            })->values()->all();

        Response::success('Distribusi status.', [
            'jenis'          => 'distribusi',
            'tanggal_dari'   => $dari,
            'tanggal_sampai' => $sampai,
            'total'          => $total,
            'distribusi'     => $dist,
            'per_tingkatan'  => $perTingkatan,
        ]);
    }

    // ── 3. Ranking rombel by rate ────────────────────────────────────────────

    private function rombelRanking(string $dari, string $sampai): void
    {
        $rows = DB::table('rombel AS r')
            ->join('presensi_jam_siswa AS pjs', 'pjs.rombel_id_snapshot', '=', 'r.rombel_id')
            ->whereBetween('pjs.tanggal', [$dari, $sampai])
            ->where('r.status', 'aktif')
            ->selectRaw("
                r.rombel_id,
                r.label_rombel,
                r.tingkatan,
                COUNT(pjs.presensi_id)                           AS total,
                SUM(pjs.status IN ('hadir','terlambat'))         AS hadir,
                SUM(pjs.status = 'alpha')                        AS alpha,
                SUM(pjs.status = 'terlambat')                    AS terlambat
            ")
            ->groupBy('r.rombel_id', 'r.label_rombel', 'r.tingkatan')
            ->get();

        $data = $rows->map(function ($r) {
            $total = (int) $r->total;
            $hadir = (int) $r->hadir;
            return [
                'rombel_id'    => (int) $r->rombel_id,
                'label_rombel' => $r->label_rombel,
                'tingkatan'    => $r->tingkatan,
                'total'        => $total,
                'hadir'        => $hadir,
                'alpha'        => (int) $r->alpha,
                'terlambat'    => (int) $r->terlambat,
                'rate'         => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })
        ->sortByDesc('rate')
        ->values()
        ->all();

        Response::success('Ranking rombel.', [
            'jenis'          => 'rombel_ranking',
            'tanggal_dari'   => $dari,
            'tanggal_sampai' => $sampai,
            'data'           => $data,
        ]);
    }

    // ── 4. Heatmap jam pembelajaran ──────────────────────────────────────────

    private function jamHeatmap(string $dari, string $sampai): void
    {
        $rows = DB::table('presensi_jam_siswa AS pjs')
            ->join('jam_pembelajaran AS jp', 'jp.jam_id', '=', 'pjs.jam_id')
            ->whereBetween('pjs.tanggal', [$dari, $sampai])
            ->selectRaw("
                pjs.jam_id,
                jp.jam_ke,
                jp.label_jam,
                jp.waktu_mulai,
                COUNT(pjs.presensi_id)                    AS total,
                SUM(pjs.status IN ('hadir','terlambat'))  AS hadir,
                SUM(pjs.status = 'alpha')                 AS alpha,
                SUM(pjs.status = 'terlambat')             AS terlambat
            ")
            ->groupBy('pjs.jam_id', 'jp.jam_ke', 'jp.label_jam', 'jp.waktu_mulai')
            ->orderBy('jp.jam_ke')
            ->get();

        $data = $rows->map(function ($r) {
            $total = (int) $r->total;
            $hadir = (int) $r->hadir;
            return [
                'jam_id'     => (int) $r->jam_id,
                'jam_ke'     => (int) $r->jam_ke,
                'label_jam'  => $r->label_jam,
                'waktu_mulai'=> $r->waktu_mulai,
                'total'      => $total,
                'hadir'      => $hadir,
                'alpha'      => (int) $r->alpha,
                'terlambat'  => (int) $r->terlambat,
                'rate'       => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })->values()->all();

        Response::success('Heatmap per jam.', [
            'jenis'          => 'jam_heatmap',
            'tanggal_dari'   => $dari,
            'tanggal_sampai' => $sampai,
            'data'           => $data,
        ]);
    }
}
