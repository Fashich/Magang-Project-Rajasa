<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiScanService;

final class PresensiScanController
{
    public function __construct(
        private readonly Request $request,
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
        private readonly PresensiScanService $service
    ) {
    }

    public function __invoke(): void
    {
        $this->permission->require('attendance.scan');

        $user = $this->auth->user();

        Response::success(
            'Scan QR diproses.',
            $this->service->scan($this->request->body(), (int) $user->user_id),
            201
        );
    }
}