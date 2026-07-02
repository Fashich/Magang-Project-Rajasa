<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Middleware;

use Rajasa\PresensiSiswa\Core\Response;

/**
 * RateLimitMiddleware
 *
 * File-based rate limiting (tanpa Redis/APCu).
 * Cocok untuk Render free tier yang punya writable /tmp.
 *
 * Cara pakai di routes: $rateLimit->check('login', 10, 60)
 *   = max 10 request per 60 detik per IP
 */
final class RateLimitMiddleware
{
    private string $storageDir;

    public function __construct()
    {
        $this->storageDir = sys_get_temp_dir() . '/presensi_ratelimit';
        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0700, true);
        }
    }

    /**
     * Cek rate limit untuk endpoint tertentu.
     *
     * @param string $endpoint  identifier (contoh: 'login', 'scan')
     * @param int    $maxHits   maksimum request dalam $windowSeconds
     * @param int    $windowSeconds  durasi window dalam detik
     */
    public function check(string $endpoint, int $maxHits = 10, int $windowSeconds = 60): void
    {
        $ip  = $this->getClientIp();
        $key = md5($endpoint . ':' . $ip);
        $file = $this->storageDir . '/' . $key . '.json';

        $now   = time();
        $data  = $this->readFile($file);

        // Hapus hits yang sudah di luar window
        $data['hits'] = array_filter(
            $data['hits'] ?? [],
            fn(int $t) => $t > ($now - $windowSeconds)
        );

        $currentHits = count($data['hits']);

        // Set header informatif
        header('X-RateLimit-Limit: ' . $maxHits);
        header('X-RateLimit-Remaining: ' . max(0, $maxHits - $currentHits - 1));
        header('X-RateLimit-Reset: ' . ($now + $windowSeconds));

        if ($currentHits >= $maxHits) {
            $retryAfter = $windowSeconds - ($now - min($data['hits']));
            header('Retry-After: ' . $retryAfter);
            Response::error(
                'Terlalu banyak percobaan. Coba lagi dalam ' . $retryAfter . ' detik.',
                [],
                429
            );
            exit;
        }

        // Catat hit baru
        $data['hits'][] = $now;
        $this->writeFile($file, $data);
    }

    private function getClientIp(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP',   // Cloudflare
            'HTTP_X_FORWARDED_FOR',    // Proxy / Render
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];
        foreach ($headers as $h) {
            if (!empty($_SERVER[$h])) {
                // Ambil IP pertama jika ada beberapa (X-Forwarded-For)
                $ip = trim(explode(',', $_SERVER[$h])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }

    private function readFile(string $file): array
    {
        if (!file_exists($file)) {
            return ['hits' => []];
        }
        try {
            $content = file_get_contents($file);
            return json_decode($content, true) ?? ['hits' => []];
        } catch (\Throwable) {
            return ['hits' => []];
        }
    }

    private function writeFile(string $file, array $data): void
    {
        try {
            file_put_contents($file, json_encode($data), LOCK_EX);
        } catch (\Throwable) {
            // Silent fail — tidak block request jika gagal tulis
        }
    }
}
