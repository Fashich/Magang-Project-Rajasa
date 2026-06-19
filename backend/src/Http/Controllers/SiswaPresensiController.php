<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\PresensiJamSiswa;

/**
 * SiswaPresensiController
 *
 * Returns a paginated, filterable attendance record list for the
 * logged-in student. Used by the Halaman Presensi page (Level 4).
 *
 * Route: GET /api/siswa/presensi
 *
 * Query params:
 *   filter     string  semua|hadir|terlambat|alpha|sakit|izin|date_range
 *   date_start string  YYYY-MM-DD (used only when filter=date_range)
 *   date_end   string  YYYY-MM-DD (used only when filter=date_range)
 *   page       int     Default 1
 *   per_page   int     Default 10, max 100
 *
 * @author fashich/dashboard-siswa-page
 */
final class SiswaPresensiController
{
    private const STATUS_FILTERS = ['hadir', 'terlambat', 'alpha', 'sakit', 'izin'];

    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request $request
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        if ($user->user_type !== 'siswa' || empty($user->siswa_id)) {
            throw new HttpException('Akses ditolak. Endpoint hanya untuk siswa.', 403);
        }

        $siswaId = (int) $user->siswa_id;
        $query   = $this->request->query();

        $page      = max(1, (int) ($query['page']       ?? 1));
        $perPage   = max(1, min(100, (int) ($query['per_page'] ?? 10)));
        $filter    = $query['filter']     ?? 'semua';
        $dateStart = $query['date_start'] ?? null;
        $dateEnd   = $query['date_end']   ?? null;

        $builder = PresensiJamSiswa::query()
            ->where('presensi_jam_siswa.siswa_id', $siswaId)
            ->leftJoin('presensi_sesi',    'presensi_sesi.presensi_sesi_id', '=', 'presensi_jam_siswa.presensi_sesi_id')
            ->leftJoin('jam_pembelajaran', 'jam_pembelajaran.jam_id',        '=', 'presensi_jam_siswa.jam_id')
            ->leftJoin('rombel',           'rombel.rombel_id',               '=', 'presensi_jam_siswa.rombel_id_snapshot')
            ->select([
                'presensi_jam_siswa.presensi_id',
                'presensi_jam_siswa.tanggal',
                'presensi_jam_siswa.status',
                'presensi_jam_siswa.mode_presensi',
                'presensi_jam_siswa.keterangan',
                'presensi_jam_siswa.scanned_at',
                'jam_pembelajaran.jam_ke',
                'jam_pembelajaran.label_jam',
                'jam_pembelajaran.waktu_mulai',
                'jam_pembelajaran.waktu_selesai',
                'presensi_sesi.ruang_label_snapshot AS ruangan',
                'rombel.label_rombel               AS kelas',
            ]);

        if (in_array($filter, self::STATUS_FILTERS, true)) {
            $builder->where('presensi_jam_siswa.status', $filter);
        } elseif ($filter === 'date_range') {
            if ($dateStart) {
                $builder->where('presensi_jam_siswa.tanggal', '>=', $dateStart);
            }
            if ($dateEnd) {
                $builder->where('presensi_jam_siswa.tanggal', '<=', $dateEnd);
            }
        }

        $total      = $builder->count();
        $totalPages = (int) ceil($total / $perPage);

        $rows = (clone $builder)
            ->orderByDesc('presensi_jam_siswa.tanggal')
            ->orderByDesc('presensi_jam_siswa.presensi_id')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->toArray();

        Response::json([
            'success' => true,
            'message' => 'Data presensi siswa.',
            'data'    => $rows,
            'meta'    => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => $totalPages,
            ],
        ]);
    }
}
