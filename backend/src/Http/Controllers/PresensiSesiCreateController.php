<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiSessionService;
use Rajasa\PresensiSiswa\Services\PresensiSessionTimeoutService;

final class PresensiSesiCreateController
{
    public function __construct(
        private readonly Request $request,
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
        private readonly PresensiSessionService $service,
        private readonly PresensiSessionTimeoutService $timeout
    ) {
    }

    public function __invoke(): void
    {
        $this->timeout->expireInactiveSessions();
        $this->permission->require('attendance.session.create');

        $user = $this->auth->user();

        Response::success(
            'Sesi presensi berhasil dibuat.',
            $this->service->create($this->request->body(), (int) $user->user_id),
            201
        );
    }
}