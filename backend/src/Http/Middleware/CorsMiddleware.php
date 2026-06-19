<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Middleware;

use Rajasa\PresensiSiswa\Support\Config;

final class CorsMiddleware
{
    public function handle(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = Config::get('cors.allowed_origins', []);

        if ($origin && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }

        header('Vary: Origin');
        header('Access-Control-Allow-Methods: ' . Config::get('cors.allowed_methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS'));
        header('Access-Control-Allow-Headers: ' . Config::get('cors.allowed_headers', 'Content-Type,Authorization,X-Requested-With'));

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}