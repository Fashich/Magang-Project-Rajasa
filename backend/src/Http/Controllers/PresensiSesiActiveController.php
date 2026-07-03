<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiSessionService;
use Rajasa\PresensiSiswa\Services\PresensiSessionTimeoutService;

final class PresensiSesiActiveController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
        private readonly PresensiSessionService $service,
        private readonly PresensiSessionTimeoutService $timeout
    ) {
    }

    public function __invoke(): void
    {
        $this->timeout->expireInactiveSessions();

        $user = $this->auth->user();

        // Admin & guru boleh cek sesi aktif tanpa permission khusus
        // Role lain (siswa) tetap butuh permission
        if (!in_array($user->user_type, ['admin', 'guru'], true)) {
            $this->permission->require('attendance.session.read');
        }

        Response::success('Sesi aktif.', [
            'sessions' => $this->service->activeForUser((int) $user->user_id),
        ]);
    }
}