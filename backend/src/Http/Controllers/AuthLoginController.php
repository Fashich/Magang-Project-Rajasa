<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Services\AuthService;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * AuthLoginController — Updated Phase 6
 *
 * Tambahan:
 *   - Rate limiting: max 5 gagal per IP → blokir 15 menit
 *   - 2FA check: jika admin & totp_enabled → return temp_token, bukan full token
 *
 * @author feature/prd-6-security
 */
final class AuthLoginController
{
    private const MAX_ATTEMPTS    = 5;
    private const BLOCK_MINUTES   = 15;
    private const TEMP_TOKEN_TTL  = 5; // menit

    public function __construct(
        private readonly Request     $request,
        private readonly AuthService $authService,
    ) {}

    public function __invoke(): void
    {
        $ip       = $this->getClientIp();
        $username = trim((string) $this->request->input('username', ''));
        $password = (string) $this->request->input('password', '');

        // ── 1. Validasi input ─────────────────────────────────────────────────
        if ($username === '' || $password === '') {
            throw new HttpException('Validasi gagal.', 422, [
                'username' => 'Username wajib diisi.',
                'password' => 'Password wajib diisi.',
            ]);
        }

        // ── 2. Rate limit check ───────────────────────────────────────────────
        $this->checkRateLimit($ip);

        // ── 3. Login via AuthService ──────────────────────────────────────────
        try {
            $data = $this->authService->login($username, $password);
        } catch (\Throwable $e) {
            $this->recordFailedAttempt($ip);
            $remaining = $this->getRemainingAttempts($ip);
            $message   = $e->getMessage();
            if ($remaining <= 2) {
                $message .= " ({$remaining} percobaan tersisa sebelum akun diblokir sementara)";
            }
            throw new HttpException($message, 401);
        }

        // ── 4. Login berhasil → reset rate limit ──────────────────────────────
        $this->clearAttempts($ip);

        // ── 5. Cek apakah user ini admin dengan 2FA aktif ─────────────────────
        $user = $data['user'] ?? null;
        if (
            $user &&
            ($user['user_type'] ?? '') === 'admin' &&
            !empty($user['totp_enabled'])
        ) {
            // Buat temp token, jangan kirim full auth token dulu
            $tempToken = $this->createTempToken((int) $user['user_id']);
            Response::success('Masukkan kode autentikasi dua faktor.', [
                'requires_2fa' => true,
                'temp_token'   => $tempToken,
                'expires_in'   => self::TEMP_TOKEN_TTL * 60, // detik
            ]);
            return;
        }

        // ── 6. Login normal (tanpa 2FA) ───────────────────────────────────────
        Response::success('Login berhasil.', $data);
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────

    private function checkRateLimit(string $ip): void
    {
        $record = DB::table('login_attempts')->where('ip_address', $ip)->first();
        if (!$record) return;

        if (
            $record->blocked_until &&
            Carbon::parse($record->blocked_until)->isFuture()
        ) {
            $menit = Carbon::now()->diffInMinutes(Carbon::parse($record->blocked_until)) + 1;
            throw new HttpException(
                "Terlalu banyak percobaan login. Coba lagi dalam {$menit} menit.", 429
            );
        }
    }

    private function recordFailedAttempt(string $ip): void
    {
        $record   = DB::table('login_attempts')->where('ip_address', $ip)->first();
        $attempts = (int)($record->attempts ?? 0) + 1;
        $now      = Carbon::now()->toDateTimeString();
        $blocked  = $attempts >= self::MAX_ATTEMPTS
            ? Carbon::now()->addMinutes(self::BLOCK_MINUTES)->toDateTimeString()
            : null;

        if ($record) {
            DB::table('login_attempts')->where('ip_address', $ip)->update([
                'attempts'        => $attempts,
                'blocked_until'   => $blocked,
                'last_attempt_at' => $now,
            ]);
        } else {
            DB::table('login_attempts')->insert([
                'ip_address'      => $ip,
                'attempts'        => 1,
                'last_attempt_at' => $now,
            ]);
        }
    }

    private function clearAttempts(string $ip): void
    {
        DB::table('login_attempts')->where('ip_address', $ip)->delete();
    }

    private function getRemainingAttempts(string $ip): int
    {
        $record = DB::table('login_attempts')->where('ip_address', $ip)->first();
        return max(0, self::MAX_ATTEMPTS - (int)($record->attempts ?? 0));
    }

    // ── 2FA Temp Token ────────────────────────────────────────────────────────

    private function createTempToken(int $userId): string
    {
        // Hapus pending token lama untuk user ini
        DB::table('two_factor_pending')->where('user_id', $userId)->delete();

        $token = bin2hex(random_bytes(32)); // 64 char hex
        DB::table('two_factor_pending')->insert([
            'user_id'    => $userId,
            'temp_token' => $token,
            'expires_at' => Carbon::now()->addMinutes(self::TEMP_TOKEN_TTL)->toDateTimeString(),
        ]);
        return $token;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function getClientIp(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_X_REAL_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '0.0.0.0';
    }
}
