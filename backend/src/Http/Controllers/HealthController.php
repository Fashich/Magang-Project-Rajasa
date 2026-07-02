<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Support\Config;

/**
 * HealthController
 *
 * GET /api/health
 * Comprehensive health check: tests DB connection, returns latency.
 * Digunakan oleh UptimeRobot dan monitoring tools.
 */
final class HealthController
{
    public function __invoke(): void
    {
        $start = microtime(true);
        $dbOk  = false;
        $dbMs  = null;
        $dbErr = null;

        try {
            $dbStart = microtime(true);
            DB::select('SELECT 1');
            $dbMs  = round((microtime(true) - $dbStart) * 1000, 1);
            $dbOk  = true;
        } catch (\Throwable $e) {
            $dbErr = $e->getMessage();
        }

        $totalMs = round((microtime(true) - $start) * 1000, 1);
        $overall = $dbOk ? 'ok' : 'degraded';

        $payload = [
            'service'    => 'presensi-siswa-api',
            'app'        => Config::get('app.name'),
            'env'        => Config::get('app.env'),
            'status'     => $overall,
            'latency_ms' => $totalMs,
            'checks'     => [
                'database' => [
                    'status'     => $dbOk ? 'ok' : 'error',
                    'latency_ms' => $dbMs,
                    'error'      => $dbErr,
                ],
            ],
            'timestamp' => date('c'),
        ];

        if (!$dbOk) {
            http_response_code(503);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Service degraded', 'data' => $payload]);
            return;
        }

        Response::success('Backend API is running', $payload);
    }
}
