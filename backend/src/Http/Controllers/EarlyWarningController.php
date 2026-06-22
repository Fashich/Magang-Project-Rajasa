<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

<<<<<<< Updated upstream
use Rajasa\PresensiSiswa\Core\HttpException;
=======
>>>>>>> Stashed changes
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\RombelWaliKelas;
use Rajasa\PresensiSiswa\Services\EarlyWarningService;

<<<<<<< Updated upstream
final class EarlyWarningController
{
    public function __construct(private readonly AuthMiddleware $auth, private readonly EarlyWarningService $service) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();
        $userType = $user->user_type ?? null;

        if (!$userType) {
            throw new HttpException('Akses ditolak. User tidak teridentifikasi.', 401);
        }

        $options = [];

        if ($userType === 'guru' || $userType === 'guru_staff') {
            if (empty($user->guru_id)) {
                throw new HttpException('Akses ditolak. Guru belum dikonfigurasi.', 403);
            }

            $guruId = (int) $user->guru_id;

            $rombelIds = RombelWaliKelas::query()
                ->where('guru_id', $guruId)
=======
/**
 * EarlyWarningController
 *
 * GET /api/early-warnings
 * Query params:
 *   days         — lookback window (default 14)
 *   min_absences — minimal alpha (default 3)
 *   rombel_id    — filter rombel (admin only)
 *   with_summary — kalau '1', tambahkan data summary
 *
 * POST /api/early-warnings/notify
 *   Kirim notifikasi ke wali kelas (admin only)
 *
 * @author feature/early-warning
 */
final class EarlyWarningController
{
    public function __construct(
        private readonly AuthMiddleware    $auth,
        private readonly EarlyWarningService $service,
    ) {}

    public function __invoke(): void
    {
        $user     = $this->auth->user();
        $userType = $user->user_type ?? null;

        if (!$userType) {
            Response::error('Akses ditolak.', [], 401);
            return;
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'POST') {
            $this->handleNotify($user);
            return;
        }

        $this->handleList($user, $userType);
    }

    private function handleList(object $user, string $userType): void
    {
        $days        = max(1, min(90, (int) ($_GET['days']         ?? 14)));
        $minAbsences = max(1, (int) ($_GET['min_absences'] ?? 3));
        $withSummary = ($_GET['with_summary'] ?? '0') === '1';

        $options = ['days' => $days, 'min_absences' => $minAbsences];

        if (in_array($userType, ['guru', 'staff'], true) && !empty($user->guru_id)) {
            // Guru: filter ke rombel yang dia jadi wali kelas
            $rombelIds = RombelWaliKelas::query()
                ->where('guru_id', (int) $user->guru_id)
>>>>>>> Stashed changes
                ->where('status', 'aktif')
                ->pluck('rombel_id')
                ->toArray();

            if (!empty($rombelIds)) {
                $options['rombel_ids'] = $rombelIds;
            }

<<<<<<< Updated upstream
        } elseif (in_array($userType, ['admin', 'super_admin', 'staff'], true)) {
            // school level — no extra options

        } elseif (in_array($userType, ['ortu', 'wali_murid'], true)) {
            if (empty($user->siswa_id)) {
                throw new HttpException('Akun orang tua belum terhubung ke siswa.', 403);
            }

            $options['siswa_id'] = (int) $user->siswa_id;

        } elseif ($userType === 'siswa') {
            $options['siswa_id'] = (int) $user->siswa_id;
        } else {
            throw new HttpException('Role tidak didukung oleh endpoint ini.', 403);
=======
        } elseif ($userType === 'siswa') {
            $options['siswa_id'] = (int) $user->siswa_id;

        } elseif (!in_array($userType, ['admin', 'super_admin'], true)) {
            Response::error('Role tidak didukung.', [], 403);
            return;
        }

        // Filter rombel_id dari query param (admin only)
        if (in_array($userType, ['admin', 'super_admin'], true)
            && isset($_GET['rombel_id']) && $_GET['rombel_id'] !== '') {
            $options['rombel_ids'] = [(int) $_GET['rombel_id']];
>>>>>>> Stashed changes
        }

        $warnings = $this->service->detect($options);

<<<<<<< Updated upstream
        Response::success('Early warning list.', ['warnings' => $warnings]);
=======
        $payload = ['warnings' => $warnings, 'days' => $days];

        if ($withSummary) {
            $payload['summary'] = $this->service->summary($options);
        }

        Response::success('Early warning list.', $payload);
    }

    private function handleNotify(object $user): void
    {
        if (!in_array($user->user_type, ['admin', 'super_admin'], true)) {
            Response::error('Hanya admin yang dapat mengirim notifikasi.', [], 403);
            return;
        }

        // Deteksi dulu, lalu kirim
        $days     = max(1, min(90, (int) ($_GET['days'] ?? 14)));
        $warnings = $this->service->detect(['days' => $days, 'min_absences' => 3]);
        $sent     = $this->service->kirimNotifikasi($warnings);

        Response::success("Notifikasi dikirim ke {$sent} wali kelas.", [
            'sent'         => $sent,
            'total_warned' => count($warnings),
        ]);
>>>>>>> Stashed changes
    }
}
