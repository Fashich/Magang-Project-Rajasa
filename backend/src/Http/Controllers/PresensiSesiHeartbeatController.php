<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiSessionTimeoutService;

final class PresensiSesiHeartbeatController
{
    public function __construct(
        private readonly PermissionMiddleware $permission,
        private readonly PresensiSessionTimeoutService $timeout
    ) {
    }

    public function __invoke(string $id): void
    {
        $this->permission->require('attendance.session.update');

        Response::success('Heartbeat sesi presensi diterima.', [
            'session' => $this->timeout->heartbeat((int) $id),
        ]);
    }
}