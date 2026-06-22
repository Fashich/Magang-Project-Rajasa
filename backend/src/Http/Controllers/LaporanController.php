<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * LaporanController
 *
 * GET /api/admin/laporan
 * Query params:
 *   jenis=rekap_rombel|rekap_siswa|rekap_harian   (default: rekap_rombel)
 *   tanggal_dari=Y-m-d    (default: awal bulan ini)
 *   tanggal_sampai=Y-m-d  (default: hari ini)
 *   rombel_id=            (opsional — filter rekap_siswa)
 *
 * @author feature/admin-dashboard
 */
final class LaporanController
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

        $jenis         = $_GET['jenis']          ?? 'rekap_rombel';
        $tanggalDari   = $_GET['tanggal_dari']   ?? Carbon::now()->startOfMonth()->toDateString();
        $tanggalSampai = $_GET['tanggal_sampai'] ?? Carbon::now()->toDateString();
        $rombelId      = isset($_GET['rombel_id']) && $_GET['rombel_id'] !== ''
                            ? (int) $_GET['rombel_id'] : null;

        // Validasi tanggal
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalDari))  {
            $tanggalDari = Carbon::now()->startOfMonth()->toDateString();
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalSampai)) {
            $tanggalSampai = Carbon::now()->toDateString();
        }

        match ($jenis) {
            'rekap_siswa'  => $this->rekapSiswa($rombelId, $tanggalDari, $tanggalSampai),
            'rekap_harian' => $this->rekapHarian($tanggalDari, $tanggalSampai),
            default        => $this->rekapRombel($tanggalDari, $tanggalSampai),
        };
    }

    // ── Rekap per Rombel ─────────────────────────────────────────────────────

    private function rekapRombel(string $dari, string $sampai): void
    {
        // Hitung total hari kerja di rentang (Mon-Sat saja; Sun skip)
        $hariKerja = 0;
        $cursor = Carbon::parse($dari);
        $end    = Carbon::parse($sampai);
        while ($cursor->lte($end)) {
            if ($cursor->dayOfWeek !== Carbon::SUNDAY) $hariKerja++;
            $cursor->addDay();
        }

        // Ambil rombel aktif + hitungan presensi per status
        $rows = DB::table('rombel AS r')
            ->leftJoin('presensi_jam_siswa AS pjs', function ($j) use ($dari, $sampai) {
                $j->on('pjs.rombel_id_snapshot', '=', 'r.rombel_id')
                  ->whereBetween('pjs.tanggal', [$dari, $sampai]);
            })
            ->leftJoin('siswa AS s', function ($j) {
                $j->on('s.rombel_id_aktif', '=', 'r.rombel_id')
                  ->where('s.status', 'aktif');
            })
            ->where('r.status', 'aktif')
            ->selectRaw("
                r.rombel_id,
                r.label_rombel,
                r.tingkatan,
                COUNT(DISTINCT s.siswa_id)                                          AS total_siswa,
                SUM(CASE WHEN pjs.status = 'hadir'     THEN 1 ELSE 0 END)          AS hadir,
                SUM(CASE WHEN pjs.status = 'terlambat' THEN 1 ELSE 0 END)          AS terlambat,
                SUM(CASE WHEN pjs.status = 'alpha'     THEN 1 ELSE 0 END)          AS alpha,
                SUM(CASE WHEN pjs.status = 'sakit'     THEN 1 ELSE 0 END)          AS sakit,
                SUM(CASE WHEN pjs.status = 'izin'      THEN 1 ELSE 0 END)          AS izin,
                COUNT(pjs.presensi_id)                                              AS total_records
            ")
            ->groupBy('r.rombel_id', 'r.label_rombel', 'r.tingkatan', 'r.tingkat_angka')
            ->orderBy('r.tingkat_angka')
            ->orderBy('r.label_rombel')
            ->get();

        // Summary global
        $global = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("
                COUNT(*)                                          AS total_records,
                SUM(status = 'hadir')                             AS hadir,
                SUM(status = 'terlambat')                         AS terlambat,
                SUM(status = 'alpha')                             AS alpha,
                SUM(status = 'sakit')                             AS sakit,
                SUM(status = 'izin')                              AS izin
            ")
            ->first();

        $data = $rows->map(function ($r) {
            $hadir     = (int) $r->hadir + (int) $r->terlambat;
            $total     = (int) $r->total_records;
            $rate      = $total > 0 ? round(($hadir / $total) * 100, 1) : 0;
            return [
                'rombel_id'    => (int) $r->rombel_id,
                'label_rombel' => $r->label_rombel,
                'tingkatan'    => $r->tingkatan,
                'total_siswa'  => (int) $r->total_siswa,
                'hadir'        => (int) $r->hadir,
                'terlambat'    => (int) $r->terlambat,
                'alpha'        => (int) $r->alpha,
                'sakit'        => (int) $r->sakit,
                'izin'         => (int) $r->izin,
                'total'        => $total,
                'rate'         => $rate,
            ];
        })->values()->all();

        $totalGlobal = (int) ($global->total_records ?? 0);
        $hadirGlobal = (int) ($global->hadir ?? 0) + (int) ($global->terlambat ?? 0);

        Response::success('Rekap per rombel.', [
            'jenis'          => 'rekap_rombel',
            'tanggal_dari'   => $dari,
            'tanggal_sampai' => $sampai,
            'hari_kerja'     => $hariKerja,
            'data'           => $data,
            'summary' => [
                'total_rombel'   => count($data),
                'total_records'  => $totalGlobal,
                'total_hadir'    => $hadirGlobal,
                'total_alpha'    => (int) ($global->alpha ?? 0),
                'total_sakit'    => (int) ($global->sakit ?? 0),
                'total_izin'     => (int) ($global->izin  ?? 0),
                'rate_global'    => $totalGlobal > 0
                    ? round(($hadirGlobal / $totalGlobal) * 100, 1) : 0,
            ],
        ]);
    }

    // ── Rekap per Siswa (dalam 1 rombel) ────────────────────────────────────

    private function rekapSiswa(?int $rombelId, string $dari, string $sampai): void
    {
        $query = DB::table('siswa AS s')
            ->leftJoin('presensi_jam_siswa AS pjs', function ($j) use ($dari, $sampai) {
                $j->on('pjs.siswa_id', '=', 's.siswa_id')
                  ->whereBetween('pjs.tanggal', [$dari, $sampai]);
            })
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('s.status', 'aktif')
            ->selectRaw("
                s.siswa_id,
                s.nisn,
                s.nis,
                s.nama_lengkap,
                r.label_rombel,
                SUM(CASE WHEN pjs.status = 'hadir'     THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN pjs.status = 'terlambat' THEN 1 ELSE 0 END) AS terlambat,
                SUM(CASE WHEN pjs.status = 'alpha'     THEN 1 ELSE 0 END) AS alpha,
                SUM(CASE WHEN pjs.status = 'sakit'     THEN 1 ELSE 0 END) AS sakit,
                SUM(CASE WHEN pjs.status = 'izin'      THEN 1 ELSE 0 END) AS izin,
                COUNT(pjs.presensi_id)                                     AS total
            ")
            ->groupBy('s.siswa_id', 's.nisn', 's.nis', 's.nama_lengkap', 'r.label_rombel')
            ->orderBy('r.label_rombel')
            ->orderBy('s.nama_lengkap');

        if ($rombelId !== null) {
            $query->where('s.rombel_id_aktif', $rombelId);
        }

        $rows = $query->get();

        $data = $rows->map(function ($s) {
            $hadir = (int) $s->hadir + (int) $s->terlambat;
            $total = (int) $s->total;
            return [
                'siswa_id'     => (int) $s->siswa_id,
                'nisn'         => $s->nisn,
                'nis'          => $s->nis,
                'nama_lengkap' => $s->nama_lengkap,
                'label_rombel' => $s->label_rombel ?? '—',
                'hadir'        => (int) $s->hadir,
                'terlambat'    => (int) $s->terlambat,
                'alpha'        => (int) $s->alpha,
                'sakit'        => (int) $s->sakit,
                'izin'         => (int) $s->izin,
                'total'        => $total,
                'rate'         => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })->values()->all();

        // Ambil daftar rombel untuk dropdown
        $rombelList = DB::table('rombel')
            ->where('status', 'aktif')
            ->orderBy('tingkat_angka')
            ->orderBy('label_rombel')
            ->select('rombel_id', 'label_rombel')
            ->get()
            ->map(fn($r) => ['rombel_id' => (int) $r->rombel_id, 'label_rombel' => $r->label_rombel])
            ->values()->all();

        Response::success('Rekap per siswa.', [
            'jenis'          => 'rekap_siswa',
            'tanggal_dari'   => $dari,
            'tanggal_sampai' => $sampai,
            'rombel_id'      => $rombelId,
            'data'           => $data,
            'rombel_list'    => $rombelList,
        ]);
    }

    // ── Rekap Harian (tren per hari) ─────────────────────────────────────────

    private function rekapHarian(string $dari, string $sampai): void
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

        // Summary total
        $global = DB::table('presensi_jam_siswa')
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("
                COUNT(*)                  AS total,
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'alpha')     AS alpha,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin
            ")->first();

        $hadirG = (int) ($global->hadir ?? 0) + (int) ($global->terlambat ?? 0);
        $totalG = (int) ($global->total ?? 0);

        Response::success('Rekap harian.', [
            'jenis'          => 'rekap_harian',
            'tanggal_dari'   => $dari,
            'tanggal_sampai' => $sampai,
            'data'           => $data,
            'summary' => [
                'total'        => $totalG,
                'hadir'        => $hadirG,
                'alpha'        => (int) ($global->alpha     ?? 0),
                'sakit'        => (int) ($global->sakit     ?? 0),
                'izin'         => (int) ($global->izin      ?? 0),
                'rate_global'  => $totalG > 0 ? round(($hadirG / $totalG) * 100, 1) : 0,
            ],
        ]);
    }
}
