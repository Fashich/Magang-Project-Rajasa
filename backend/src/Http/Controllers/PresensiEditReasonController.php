<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\PresensiManualEditService;

final class PresensiEditReasonController
{
    public function __construct(
        private readonly PermissionMiddleware $permission,
        private readonly PresensiManualEditService $service
    ) {
    }

    public function __invoke(): void
    {
        $this->permission->require('attendance.edit_reasons.read');

        Response::success('Daftar alasan edit presensi.', [
            'reasons' => $this->service->reasons(),
        ]);
    }
}