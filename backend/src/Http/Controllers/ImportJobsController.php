<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\ScanReadinessImportService;

final class ImportJobsController
{
    public function __construct(
        private readonly PermissionMiddleware $permission,
        private readonly ScanReadinessImportService $service
    ) {
    }

    public function __invoke(): void
    {
        $this->permission->require('import.read');

        Response::success('Riwayat import.', [
            'jobs' => $this->service->jobs(),
        ]);
    }
}