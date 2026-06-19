<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\ScanReadinessImportService;

final class ImportRowsController
{
    public function __construct(
        private readonly PermissionMiddleware $permission,
        private readonly ScanReadinessImportService $service
    ) {
    }

    public function __invoke(string $id): void
    {
        $this->permission->require('import.read');

        Response::success('Log baris import.', [
            'rows' => $this->service->rowLogs((int) $id),
        ]);
    }
}