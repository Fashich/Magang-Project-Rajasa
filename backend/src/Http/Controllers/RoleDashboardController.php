<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\PresensiJamSiswa;
use Rajasa\PresensiSiswa\Models\RombelWaliKelas;

final class RoleDashboardController
{
    public function __construct(private readonly AuthMiddleware $auth) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        $userType = $user->user_type ?? null;

        if (!$userType) {
            throw new HttpException('Akses ditolak. User tidak teridentifikasi.', 401);
        }

        // Siswa: same behaviour as existing SiswaDashboardController
        if ($userType === 'siswa' && !empty($user->siswa_id)) {
            $siswaId = (int) $user->siswa_id;

            $counts = PresensiJamSiswa::query()
                ->where('siswa_id', $siswaId)
                ->selectRaw(
                    "
                SUM(status = 'hadir')     AS tepat_waktu,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                SUM(status = 'alpha')     AS alpha
            "
                )
                ->first();

            $trendRows = PresensiJamSiswa::query()
                ->where('siswa_id', $siswaId)
                ->selectRaw(
                    "
                tanggal,
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                SUM(status = 'alpha')     AS alpha
            "
                )
                ->groupBy('tanggal')
                ->orderBy('tanggal', 'desc')
                ->limit(7)
                ->get()
                ->toArray();

            // reverse trend to chronological order
            $trend = array_reverse(array_map(function ($r) {
                return [
                    'tanggal' => $r['tanggal'] ?? null,
                    'hadir' => (int) ($r['hadir'] ?? 0),
                    'terlambat' => (int) ($r['terlambat'] ?? 0),
                    'sakit' => (int) ($r['sakit'] ?? 0),
                    'izin' => (int) ($r['izin'] ?? 0),
                    'alpha' => (int) ($r['alpha'] ?? 0),
                ];
            }, $trendRows));

            Response::success('Data dashboard siswa.', [
                'totals' => [
                    'tepat_waktu' => (int) ($counts->tepat_waktu ?? 0),
                    'terlambat' => (int) ($counts->terlambat ?? 0),
                    'sakit' => (int) ($counts->sakit ?? 0),
                    'izin' => (int) ($counts->izin ?? 0),
                    'alpha' => (int) ($counts->alpha ?? 0),
                ],
                'trend' => $trend,
            ]);

            return;
        }

        // Guru: aggregate by rombel(s) that teacher is wali kelas for
        if ($userType === 'guru' || $userType === 'guru_staff') {
            if (empty($user->guru_id)) {
                throw new HttpException('Akses ditolak. Guru belum dikonfigurasi.', 403);
            }

            $guruId = (int) $user->guru_id;

            $rombelIds = RombelWaliKelas::query()
                ->where('guru_id', $guruId)
                ->where('status', 'aktif')
                ->pluck('rombel_id')
                ->toArray();

            // Base query — join siswa when filtering by rombel
            if (!empty($rombelIds)) {
                $base = PresensiJamSiswa::query()
                    ->join('siswa', 'presensi_jam_siswa.siswa_id', '=', 'siswa.siswa_id')
                    ->whereIn('siswa.rombel_id_aktif', $rombelIds);
            } else {
                // fallback to school-wide if no rombel assigned
                $base = PresensiJamSiswa::query();
            }

            $counts = (clone $base)
                ->selectRaw(
                    "
                SUM(status = 'hadir')     AS tepat_waktu,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                SUM(status = 'alpha')     AS alpha
            "
                )
                ->first();

            $trendRows = (clone $base)
                ->selectRaw(
                    "
                tanggal,
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                SUM(status = 'alpha')     AS alpha
            "
                )
                ->groupBy('tanggal')
                ->orderBy('tanggal', 'desc')
                ->limit(7)
                ->get()
                ->toArray();

            $trend = array_reverse(array_map(function ($r) {
                return [
                    'tanggal' => $r['tanggal'] ?? null,
                    'hadir' => (int) ($r['hadir'] ?? 0),
                    'terlambat' => (int) ($r['terlambat'] ?? 0),
                    'sakit' => (int) ($r['sakit'] ?? 0),
                    'izin' => (int) ($r['izin'] ?? 0),
                    'alpha' => (int) ($r['alpha'] ?? 0),
                ];
            }, $trendRows));

            Response::success('Data dashboard guru.', [
                'totals' => [
                    'tepat_waktu' => (int) ($counts->tepat_waktu ?? 0),
                    'terlambat' => (int) ($counts->terlambat ?? 0),
                    'sakit' => (int) ($counts->sakit ?? 0),
                    'izin' => (int) ($counts->izin ?? 0),
                    'alpha' => (int) ($counts->alpha ?? 0),
                ],
                'trend' => $trend,
            ]);

            return;
        }

        // Admin / Super admin — school level
        if (in_array($userType, ['admin', 'super_admin', 'staff'], true)) {
            $counts = PresensiJamSiswa::query()
                ->selectRaw(
                    "
                SUM(status = 'hadir')     AS tepat_waktu,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                SUM(status = 'alpha')     AS alpha
            "
                )
                ->first();

            $trendRows = PresensiJamSiswa::query()
                ->selectRaw(
                    "
                tanggal,
                SUM(status = 'hadir')     AS hadir,
                SUM(status = 'terlambat') AS terlambat,
                SUM(status = 'sakit')     AS sakit,
                SUM(status = 'izin')      AS izin,
                SUM(status = 'alpha')     AS alpha
            "
                )
                ->groupBy('tanggal')
                ->orderBy('tanggal', 'desc')
                ->limit(7)
                ->get()
                ->toArray();

            $trend = array_reverse(array_map(function ($r) {
                return [
                    'tanggal' => $r['tanggal'] ?? null,
                    'hadir' => (int) ($r['hadir'] ?? 0),
                    'terlambat' => (int) ($r['terlambat'] ?? 0),
                    'sakit' => (int) ($r['sakit'] ?? 0),
                    'izin' => (int) ($r['izin'] ?? 0),
                    'alpha' => (int) ($r['alpha'] ?? 0),
                ];
            }, $trendRows));

            Response::success('Data dashboard admin.', [
                'totals' => [
                    'tepat_waktu' => (int) ($counts->tepat_waktu ?? 0),
                    'terlambat' => (int) ($counts->terlambat ?? 0),
                    'sakit' => (int) ($counts->sakit ?? 0),
                    'izin' => (int) ($counts->izin ?? 0),
                    'alpha' => (int) ($counts->alpha ?? 0),
                ],
                'trend' => $trend,
            ]);

            return;
        }

        // Ortu / wali murid — attempt child mapping via siswa_id on user
        if (in_array($userType, ['ortu', 'wali_murid'], true)) {
            if (!empty($user->siswa_id)) {
                $siswaId = (int) $user->siswa_id;

                $counts = PresensiJamSiswa::query()
                    ->where('siswa_id', $siswaId)
                    ->selectRaw(
                        "
                    SUM(status = 'hadir')     AS tepat_waktu,
                    SUM(status = 'terlambat') AS terlambat,
                    SUM(status = 'sakit')     AS sakit,
                    SUM(status = 'izin')      AS izin,
                    SUM(status = 'alpha')     AS alpha
                "
                    )
                    ->first();

                $trendRows = PresensiJamSiswa::query()
                    ->where('siswa_id', $siswaId)
                    ->selectRaw(
                        "
                    tanggal,
                    SUM(status = 'hadir')     AS hadir,
                    SUM(status = 'terlambat') AS terlambat,
                    SUM(status = 'sakit')     AS sakit,
                    SUM(status = 'izin')      AS izin,
                    SUM(status = 'alpha')     AS alpha
                "
                    )
                    ->groupBy('tanggal')
                    ->orderBy('tanggal', 'desc')
                    ->limit(7)
                    ->get()
                    ->toArray();

                $trend = array_reverse(array_map(function ($r) {
                    return [
                        'tanggal' => $r['tanggal'] ?? null,
                        'hadir' => (int) ($r['hadir'] ?? 0),
                        'terlambat' => (int) ($r['terlambat'] ?? 0),
                        'sakit' => (int) ($r['sakit'] ?? 0),
                        'izin' => (int) ($r['izin'] ?? 0),
                        'alpha' => (int) ($r['alpha'] ?? 0),
                    ];
                }, $trendRows));

                Response::success('Data dashboard ortu.', [
                    'totals' => [
                        'tepat_waktu' => (int) ($counts->tepat_waktu ?? 0),
                        'terlambat' => (int) ($counts->terlambat ?? 0),
                        'sakit' => (int) ($counts->sakit ?? 0),
                        'izin' => (int) ($counts->izin ?? 0),
                        'alpha' => (int) ($counts->alpha ?? 0),
                    ],
                    'trend' => $trend,
                ]);

                return;
            }

            throw new HttpException('Dashboard orang tua belum terkonfigurasi untuk akun ini.', 403);
        }

        throw new HttpException('Role tidak didukung oleh endpoint ini.', 403);
    }
}
