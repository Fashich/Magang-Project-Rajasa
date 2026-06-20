<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Models\PresensiJamSiswa;
use Rajasa\PresensiSiswa\Models\RombelWaliKelas;
use Rajasa\PresensiSiswa\Models\User;

final class RoleDashboardController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission
    ) {
    }

    public function __invoke(): void
    {
        $user = $this->auth->user();
        $this->permission->require('dashboard.read');

        $userType = (string) ($user->user_type ?? '');

        if ($userType === 'siswa') {
            $this->sendStudentDashboard($user);
            return;
        }

        if (in_array($userType, ['guru', 'guru_staff'], true)) {
            $this->sendTeacherDashboard($user);
            return;
        }

        if (in_array($userType, ['admin', 'super_admin', 'staff'], true)) {
            $this->sendAdminDashboard($user);
            return;
        }

        if (in_array($userType, ['ortu', 'wali_murid'], true)) {
            $this->sendParentDashboard($user);
            return;
        }

        throw new HttpException('Role tidak didukung oleh endpoint ini.', 403);
    }

    private function sendStudentDashboard(User $user): void
    {
        if (empty($user->siswa_id)) {
            throw new HttpException('Akses ditolak. Siswa belum dikonfigurasi.', 403);
        }

        $siswaId = (int) $user->siswa_id;
        $base = PresensiJamSiswa::query()->where('siswa_id', $siswaId);

        Response::success('Data dashboard siswa.', $this->payload(
            role: 'siswa',
            scopeLabel: 'Presensi pribadi',
            base: $base,
            summary: [
                'total_siswa' => 1,
                'total_rombel' => $this->studentRombelCount($siswaId),
                'sesi_aktif' => $this->activeSessionCount(),
            ],
            siswaId: $siswaId
        ));
    }

    private function sendTeacherDashboard(User $user): void
    {
        if (empty($user->guru_id)) {
            throw new HttpException('Akses ditolak. Guru belum dikonfigurasi.', 403);
        }

        $rombelIds = RombelWaliKelas::query()
            ->where('guru_id', (int) $user->guru_id)
            ->where('status', 'aktif')
            ->pluck('rombel_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $base = PresensiJamSiswa::query()
            ->leftJoin('siswa', 'presensi_jam_siswa.siswa_id', '=', 'siswa.siswa_id');

        if ($rombelIds !== []) {
            $base->where(function ($query) use ($rombelIds): void {
                $query
                    ->whereIn('presensi_jam_siswa.rombel_id_snapshot', $rombelIds)
                    ->orWhereIn('siswa.rombel_id_aktif', $rombelIds);
            });
        }

        Response::success('Data dashboard guru.', $this->payload(
            role: 'guru',
            scopeLabel: $rombelIds === [] ? 'Semua rombel' : count($rombelIds) . ' rombel wali kelas',
            base: $base,
            summary: [
                'total_siswa' => $this->studentCountForRombels($rombelIds),
                'total_rombel' => $rombelIds === [] ? $this->activeRombelCount() : count($rombelIds),
                'sesi_aktif' => $this->activeSessionCount($rombelIds),
            ],
            rombelIds: $rombelIds
        ));
    }

    private function sendAdminDashboard(User $user): void
    {
        Response::success('Data dashboard admin.', $this->payload(
            role: (string) $user->user_type,
            scopeLabel: 'Seluruh sekolah',
            base: PresensiJamSiswa::query(),
            summary: [
                'total_siswa' => $this->activeStudentCount(),
                'total_rombel' => $this->activeRombelCount(),
                'sesi_aktif' => $this->activeSessionCount(),
            ]
        ));
    }

    private function sendParentDashboard(User $user): void
    {
        if (empty($user->siswa_id)) {
            throw new HttpException('Dashboard orang tua belum terkonfigurasi untuk akun ini.', 403);
        }

        $siswaId = (int) $user->siswa_id;
        $base = PresensiJamSiswa::query()->where('siswa_id', $siswaId);

        Response::success('Data dashboard orang tua.', $this->payload(
            role: 'ortu',
            scopeLabel: 'Anak terhubung',
            base: $base,
            summary: [
                'total_siswa' => 1,
                'total_rombel' => $this->studentRombelCount($siswaId),
                'sesi_aktif' => $this->activeSessionCount(),
            ],
            siswaId: $siswaId
        ));
    }

    private function payload(
        string $role,
        string $scopeLabel,
        mixed $base,
        array $summary,
        array $rombelIds = [],
        ?int $siswaId = null
    ): array
    {
        $totals = $this->statusTotals(clone $base);
        $trend = $this->trend(clone $base);

        return [
            'role' => $role,
            'scope' => [
                'label' => $scopeLabel,
            ],
            'totals' => $totals,
            'trend' => $trend,
            'rombel_breakdown' => $this->rombelBreakdown($rombelIds, $siswaId),
            'summary' => [
                'total_siswa' => (int) ($summary['total_siswa'] ?? 0),
                'total_rombel' => (int) ($summary['total_rombel'] ?? 0),
                'sesi_aktif' => (int) ($summary['sesi_aktif'] ?? 0),
                'total_presensi' => array_sum($totals),
            ],
        ];
    }

    private function statusTotals(mixed $query): array
    {
        $counts = $query
            ->selectRaw("
                SUM(presensi_jam_siswa.status = 'hadir') AS tepat_waktu,
                SUM(presensi_jam_siswa.status = 'terlambat') AS terlambat,
                SUM(presensi_jam_siswa.status = 'sakit') AS sakit,
                SUM(presensi_jam_siswa.status = 'izin') AS izin,
                SUM(presensi_jam_siswa.status = 'alpha') AS alpha
            ")
            ->first();

        return [
            'tepat_waktu' => (int) ($counts->tepat_waktu ?? 0),
            'terlambat' => (int) ($counts->terlambat ?? 0),
            'sakit' => (int) ($counts->sakit ?? 0),
            'izin' => (int) ($counts->izin ?? 0),
            'alpha' => (int) ($counts->alpha ?? 0),
        ];
    }

    private function trend(mixed $query): array
    {
        $rows = $query
            ->selectRaw("
                presensi_jam_siswa.tanggal AS tanggal,
                SUM(presensi_jam_siswa.status = 'hadir') AS hadir,
                SUM(presensi_jam_siswa.status = 'terlambat') AS terlambat,
                SUM(presensi_jam_siswa.status = 'sakit') AS sakit,
                SUM(presensi_jam_siswa.status = 'izin') AS izin,
                SUM(presensi_jam_siswa.status = 'alpha') AS alpha
            ")
            ->groupBy('presensi_jam_siswa.tanggal')
            ->orderBy('presensi_jam_siswa.tanggal', 'desc')
            ->limit(7)
            ->get()
            ->toArray();

        return array_reverse(array_map(static function ($row): array {
            $row = (array) $row;

            return [
                'tanggal' => $row['tanggal'] ?? null,
                'hadir' => (int) ($row['hadir'] ?? 0),
                'terlambat' => (int) ($row['terlambat'] ?? 0),
                'sakit' => (int) ($row['sakit'] ?? 0),
                'izin' => (int) ($row['izin'] ?? 0),
                'alpha' => (int) ($row['alpha'] ?? 0),
            ];
        }, $rows));
    }

    private function rombelBreakdown(array $rombelIds = [], ?int $siswaId = null): array
    {
        $query = DB::table('presensi_jam_siswa as pjs')
            ->leftJoin('rombel as r', 'r.rombel_id', '=', 'pjs.rombel_id_snapshot')
            ->leftJoin('siswa as s', 's.siswa_id', '=', 'pjs.siswa_id')
            ->selectRaw("
                COALESCE(pjs.rombel_id_snapshot, s.rombel_id_aktif, 0) AS rombel_id,
                COALESCE(r.label_rombel, s.kelas_aktif, 'Tanpa Rombel') AS label,
                COUNT(*) AS total,
                SUM(pjs.status = 'hadir') AS hadir,
                SUM(pjs.status = 'terlambat') AS terlambat,
                SUM(pjs.status = 'sakit') AS sakit,
                SUM(pjs.status = 'izin') AS izin,
                SUM(pjs.status = 'alpha') AS alpha
            ");

        if ($siswaId !== null) {
            $query->where('pjs.siswa_id', $siswaId);
        }

        if ($rombelIds !== []) {
            $query->where(function ($where) use ($rombelIds): void {
                $where
                    ->whereIn('pjs.rombel_id_snapshot', $rombelIds)
                    ->orWhereIn('s.rombel_id_aktif', $rombelIds);
            });
        }

        $rows = $query
            ->groupByRaw("COALESCE(pjs.rombel_id_snapshot, s.rombel_id_aktif, 0), COALESCE(r.label_rombel, s.kelas_aktif, 'Tanpa Rombel')")
            ->orderByRaw("SUM(pjs.status = 'alpha') DESC, SUM(pjs.status = 'terlambat') DESC, COUNT(*) DESC")
            ->limit(8)
            ->get()
            ->toArray();

        return array_map(static function ($row): array {
            $row = (array) $row;
            $total = (int) ($row['total'] ?? 0);
            $hadir = (int) ($row['hadir'] ?? 0);
            $tepatWaktuRate = $total > 0 ? round(($hadir / $total) * 100, 1) : 0.0;

            return [
                'rombel_id' => (int) ($row['rombel_id'] ?? 0),
                'label' => (string) ($row['label'] ?? 'Tanpa Rombel'),
                'total' => $total,
                'hadir' => $hadir,
                'terlambat' => (int) ($row['terlambat'] ?? 0),
                'sakit' => (int) ($row['sakit'] ?? 0),
                'izin' => (int) ($row['izin'] ?? 0),
                'alpha' => (int) ($row['alpha'] ?? 0),
                'tepat_waktu_rate' => $tepatWaktuRate,
            ];
        }, $rows);
    }

    private function activeStudentCount(): int
    {
        return (int) DB::table('siswa')->where('status', 'aktif')->count();
    }

    private function activeRombelCount(): int
    {
        return (int) DB::table('rombel')->where('status', 'aktif')->count();
    }

    private function studentCountForRombels(array $rombelIds): int
    {
        $query = DB::table('siswa')->where('status', 'aktif');

        if ($rombelIds !== []) {
            $query->whereIn('rombel_id_aktif', $rombelIds);
        }

        return (int) $query->count();
    }

    private function studentRombelCount(int $siswaId): int
    {
        return (int) DB::table('siswa')
            ->where('siswa_id', $siswaId)
            ->whereNotNull('rombel_id_aktif')
            ->count();
    }

    private function activeSessionCount(array $rombelIds = []): int
    {
        $query = DB::table('presensi_sesi')->whereIn('status', ['aktif', 'suspended']);

        if ($rombelIds !== []) {
            $query->whereIn('rombel_id', $rombelIds);
        }

        return (int) $query->count();
    }
}
