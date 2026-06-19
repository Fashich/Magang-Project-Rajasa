<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\RombelWaliKelas;
use Rajasa\PresensiSiswa\Services\EarlyWarningService;

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
                ->where('status', 'aktif')
                ->pluck('rombel_id')
                ->toArray();

            if (!empty($rombelIds)) {
                $options['rombel_ids'] = $rombelIds;
            }

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
        }

        $warnings = $this->service->detect($options);

        Response::success('Early warning list.', ['warnings' => $warnings]);
    }
}
