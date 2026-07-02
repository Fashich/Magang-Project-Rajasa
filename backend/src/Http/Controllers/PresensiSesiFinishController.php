<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiSessionService;
use Rajasa\PresensiSiswa\Services\GamifikasiService;

/**
 * PresensiSesiFinishController
 * POST /api/presensi/sesi/{id}/finish
 *
 * Menutup sesi presensi dan secara otomatis menghitung poin gamifikasi
 * untuk seluruh siswa yang hadir dalam sesi tersebut.
 */
final class PresensiSesiFinishController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
        private readonly PresensiSessionService $service,
        private readonly GamifikasiService $gamifikasi,
    ) {
    }

    public function __invoke(string $id): void
    {
        $this->permission->require('attendance.session.update');

        $user   = $this->auth->user();
        $sesiId = (int) $id;

        // Tutup sesi
        $result = $this->service->finish($sesiId, (int) $user->user_id);

        // Hitung poin gamifikasi secara asinkron (fire-and-forget, tidak block response)
        $this->gamifikasi->hitungUntukSesi($sesiId);

        Response::success('Sesi presensi selesai.', $result);
    }
}
