<?php

declare(strict_types=1);

use FastRoute\RouteCollector;
use Rajasa\PresensiSiswa\Http\Controllers\AuthLoginController;
use Rajasa\PresensiSiswa\Http\Controllers\AuthLogoutController;
use Rajasa\PresensiSiswa\Http\Controllers\HealthController;
use Rajasa\PresensiSiswa\Http\Controllers\ImportJobsController;
use Rajasa\PresensiSiswa\Http\Controllers\ImportRowsController;
use Rajasa\PresensiSiswa\Http\Controllers\MeController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiScanController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiAuditController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiEditReasonController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiJamSiswaController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiManualEditController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiActiveController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiCreateController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiFinishController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiHeartbeatController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiWarningCheckController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiPauseController;
use Rajasa\PresensiSiswa\Http\Controllers\PresensiSesiResumeController;
use Rajasa\PresensiSiswa\Http\Controllers\SiswaDashboardController;
use Rajasa\PresensiSiswa\Http\Controllers\SiswaPresensiController;
use Rajasa\PresensiSiswa\Http\Controllers\SiswaKalenderController;
use Rajasa\PresensiSiswa\Http\Controllers\RombelController;
use Rajasa\PresensiSiswa\Http\Controllers\ScanReadinessImportController;

return function (RouteCollector $route): void {
    $route->get('/api/health', HealthController::class);

    $route->post('/api/auth/login', AuthLoginController::class);
    $route->post('/api/auth/logout', AuthLogoutController::class);
    $route->get('/api/me', MeController::class);

        $route->get('/api/siswa/dashboard', SiswaDashboardController::class);
    $route->get('/api/siswa/presensi', SiswaPresensiController::class);
    $route->get('/api/siswa/kalender-akademik', SiswaKalenderController::class);
    $route->get('/api/rombel/options', RombelController::class);

    $route->post('/api/presensi/sesi', PresensiSesiCreateController::class);
    $route->get('/api/presensi/sesi/aktif', PresensiSesiActiveController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/pause', PresensiSesiPauseController::class);
    $route->post('/api/presensi/sesi/check-warning', PresensiSesiWarningCheckController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/resume', PresensiSesiResumeController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/finish', PresensiSesiFinishController::class);
    $route->post('/api/presensi/sesi/{id:\d+}/heartbeat', PresensiSesiHeartbeatController::class);

    $route->post('/api/import/scan-readiness', ScanReadinessImportController::class);
    $route->get('/api/import/jobs', ImportJobsController::class);
    $route->get('/api/import/jobs/{id:\d+}/rows', ImportRowsController::class);

    $route->post('/api/presensi/scan', PresensiScanController::class);
    $route->get('/api/presensi/audit/latest', PresensiAuditController::class);
    $route->get('/api/presensi/jam-siswa', PresensiJamSiswaController::class);
    $route->patch('/api/presensi/jam-siswa/{id:\d+}', PresensiManualEditController::class);
    $route->get('/api/presensi/edit-reasons', PresensiEditReasonController::class);
};
