<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\PresensiJamSiswa;

/**
 * SiswaDashboardController
 *
 * Returns the attendance summary counters for the logged-in student.
 * Used by the Dashboard Siswa → Presensi page (Level 4).
 *
 * Route: GET /api/siswa/dashboard
 *
 * Response shape:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": {
 *     "tepat_waktu": 10,
 *     "terlambat": 2,
 *     "sakit": 1,
 *     "izin": 0,
 *     "alpha": 0
 *   }
 * }
 *
 * @author fashich/dashboard-siswa-page
 */
final class SiswaDashboardController
{
    public function __construct(
        private readonly AuthMiddleware $auth
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        // Only siswa role may access this endpoint
        if ($user->user_type !== 'siswa' || empty($user->siswa_id)) {
            throw new HttpException('Akses ditolak. Endpoint hanya untuk siswa.', 403);
        }

        $siswaId = (int) $user->siswa_id;

        // Aggregate attendance counts per status
        $counts = PresensiJamSiswa::query()
            ->where('siswa_id', $siswaId)
            ->selectRaw("
                SUM(status = 'hadir')     AS tepat_waktu,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                SUM(status = 'alpha')     AS alpha
            ")
            ->first();

        Response::success('Data dashboard siswa.', [
            'tepat_waktu' => (int) ($counts->tepat_waktu ?? 0),
            'terlambat'   => (int) ($counts->terlambat   ?? 0),
            'sakit'       => (int) ($counts->sakit        ?? 0),
            'izin'        => (int) ($counts->izin         ?? 0),
            'alpha'       => (int) ($counts->alpha        ?? 0),
        ]);
    }
}
