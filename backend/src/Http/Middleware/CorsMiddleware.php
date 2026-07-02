<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Middleware;

use Rajasa\PresensiSiswa\Support\Config;

/**
 * CorsMiddleware
 *
 * Mendukung multiple allowed origins via CORS_ALLOWED_ORIGINS env var.
 * Format: comma-separated list atau wildcard '*'
 *
 * Contoh env:
 *   CORS_ALLOWED_ORIGINS=https://presensi-rajasa-frontend.vercel.app,https://presensi.smksrajasa.sch.id
 */
final class CorsMiddleware
{
    public function handle(): void
    {
        $origin         = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = Config::get('cors.allowed_origins', []);

        // Tangani wildcard '*'
        if ($allowedOrigins === ['*'] || in_array('*', $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: *');
        } elseif ($origin && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
        } elseif ($origin && $this->matchesPattern($origin, $allowedOrigins)) {
            // Dukung wildcard subdomain, contoh: *.vercel.app
            header("Access-Control-Allow-Origin: {$origin}");
        }

        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: ' . Config::get('cors.allowed_methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS'));
        header('Access-Control-Allow-Headers: ' . Config::get('cors.allowed_headers', 'Content-Type,Authorization,X-Requested-With'));
        header('Access-Control-Max-Age: 86400'); // cache preflight 24 jam

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    /**
     * Cocokkan origin ke pattern wildcard subdomain.
     * Contoh: *.vercel.app cocok dengan app.vercel.app
     */
    private function matchesPattern(string $origin, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if (!str_contains($pattern, '*')) {
                continue;
            }
            $regex = '#^' . str_replace(['.', '*'], ['\.', '[^.]+'], $pattern) . '$#i';
            if (preg_match($regex, $origin)) {
                return true;
            }
        }
        return false;
    }
}
