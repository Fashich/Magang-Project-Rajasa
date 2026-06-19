<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiSessionService;

final class PresensiSesiFinishController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
        private readonly PresensiSessionService $service
    ) {
    }

    public function __invoke(string $id): void
    {
        $this->permission->require('attendance.session.update');

        $user = $this->auth->user();

        Response::success('Sesi presensi selesai.', $this->service->finish((int) $id, (int) $user->user_id));
    }
}