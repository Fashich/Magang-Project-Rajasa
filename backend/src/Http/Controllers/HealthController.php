<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Support\Config;

final class HealthController
{
    public function __invoke(): void
    {
        Response::success('Backend API is running', [
            'service' => 'presensi-siswa-api',
            'app' => Config::get('app.name'),
            'env' => Config::get('app.env'),
            'status' => 'ok',
        ]);
    }
}