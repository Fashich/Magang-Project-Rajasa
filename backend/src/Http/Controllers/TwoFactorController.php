<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\AuthService;
use Rajasa\PresensiSiswa\Services\TotpService;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * TwoFactorController
 *
 * Routes (semua wajib admin kecuali verify):
 *
 *   GET    /api/admin/2fa/setup    → generate secret + QR URL (belum disimpan)
 *   POST   /api/admin/2fa/enable   → { secret, code } verifikasi → simpan + aktifkan
 *   DELETE /api/admin/2fa/disable  → { code } verifikasi → nonaktifkan
 *   GET    /api/admin/2fa/status   → { enabled: bool }
 *
 *   POST   /api/auth/2fa/verify    → { temp_token, code } → return full auth token
 *                                    (tidak wajib login — pakai temp_token)
 *
 * @author feature/prd-6-security
 */
final class TwoFactorController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly TotpService   $totp,
        private readonly AuthService   $authService,
    ) {}

    // ── GET /api/admin/2fa/status ─────────────────────────────────────────────

    public function status(): void
    {
        $user = $this->auth->user();
        Response::success('Status 2FA.', [
            'enabled' => (bool) $user->totp_enabled,
        ]);
    }

    // ── GET /api/admin/2fa/setup ──────────────────────────────────────────────

    public function setup(): void
    {
        $user   = $this->auth->user();
        $secret = $this->totp->generateSecret();

        Response::success('Setup 2FA.', [
            'secret'   => $secret,
            'qr_url'   => $this->totp->getQrImageUrl($secret, $user->username ?? $user->email ?? 'admin'),
            'otp_url'  => $this->totp->getOtpAuthUrl($secret, $user->username ?? 'admin'),
            'instructions' => [
                '1. Install Google Authenticator / Authy di HP.',
                '2. Scan QR code di bawah, atau masukkan secret key secara manual.',
                '3. Masukkan 6 digit kode dari aplikasi untuk mengonfirmasi.',
            ],
        ]);
    }

    // ── POST /api/admin/2fa/enable ────────────────────────────────────────────

    public function enable(): void
    {
        $user   = $this->auth->user();
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $secret = trim($body['secret'] ?? '');
        $code   = trim($body['code']   ?? '');

        if (!$secret || !$code) {
            Response::error('Secret dan kode wajib diisi.', [], 422); return;
        }
        if (!preg_match('/^[A-Z2-7]{32}$/', $secret)) {
            Response::error('Secret tidak valid.', [], 422); return;
        }
        if (!$this->totp->verify($secret, $code)) {
            Response::error('Kode salah atau sudah kadaluarsa. Pastikan waktu HP sudah benar.', [], 422); return;
        }

        DB::table('users')->where('user_id', $user->user_id)->update([
            'totp_secret'  => $secret,
            'totp_enabled' => 1,
            'updated_at'   => Carbon::now()->toDateTimeString(),
        ]);

        Response::success('Two-Factor Authentication berhasil diaktifkan.', ['enabled' => true]);
    }

    // ── DELETE /api/admin/2fa/disable ─────────────────────────────────────────

    public function disable(): void
    {
        $user = $this->auth->user();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $code = trim($body['code'] ?? '');

        if (!$user->totp_enabled) {
            Response::error('2FA belum diaktifkan.', [], 409); return;
        }
        if (!$code) {
            Response::error('Kode wajib diisi untuk menonaktifkan 2FA.', [], 422); return;
        }
        if (!$this->totp->verify($user->totp_secret ?? '', $code)) {
            Response::error('Kode salah. Masukkan kode dari aplikasi authenticator.', [], 422); return;
        }

        DB::table('users')->where('user_id', $user->user_id)->update([
            'totp_secret'  => null,
            'totp_enabled' => 0,
            'updated_at'   => Carbon::now()->toDateTimeString(),
        ]);

        Response::success('Two-Factor Authentication berhasil dinonaktifkan.', ['enabled' => false]);
    }

    // ── POST /api/auth/2fa/verify ─────────────────────────────────────────────

    /**
     * Endpoint publik (tidak butuh Bearer token).
     * Terima temp_token dari step 1 login + kode TOTP → return full auth token.
     */
    public function verifyLogin(): void
    {
        $body      = json_decode(file_get_contents('php://input'), true) ?? [];
        $tempToken = trim($body['temp_token'] ?? '');
        $code      = trim($body['code']       ?? '');

        if (!$tempToken || !$code) {
            Response::error('temp_token dan code wajib diisi.', [], 422); return;
        }

        // Cari pending record
        $pending = DB::table('two_factor_pending')
            ->where('temp_token', $tempToken)
            ->where('expires_at', '>', Carbon::now()->toDateTimeString())
            ->first();

        if (!$pending) {
            Response::error('Token tidak valid atau sudah kadaluarsa. Silakan login ulang.', [], 401); return;
        }

        $user = DB::table('users')->where('user_id', $pending->user_id)->first();
        if (!$user || !$user->totp_enabled) {
            Response::error('Akun tidak ditemukan atau 2FA tidak aktif.', [], 401); return;
        }

        if (!$this->totp->verify($user->totp_secret, $code)) {
            Response::error('Kode salah. Periksa aplikasi authenticator Anda.', [], 422); return;
        }

        // Hapus pending token
        DB::table('two_factor_pending')->where('temp_token', $tempToken)->delete();

        // Update last_login_at
        DB::table('users')->where('user_id', $user->user_id)->update([
            'last_login_at' => Carbon::now()->toDateTimeString(),
        ]);

        // Buat auth token via AuthService (metode yang sama dengan login normal)
        $tokenData = $this->authService->createToken($user);

        Response::success('Login berhasil.', $tokenData);
    }
}
