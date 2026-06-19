<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiManualEditService;

final class PresensiManualEditController
{
    public function __construct(
        private readonly Request $request,
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
        private readonly PresensiManualEditService $service
    ) {
    }

    public function __invoke(string $id): void
    {
        $this->permission->require('attendance.manual.update');

        $user = $this->auth->user();

        Response::success(
            'Status presensi berhasil diubah.',
            $this->service->updateStatus((int) $id, $this->request->body(), (int) $user->user_id)
        );
    }
}