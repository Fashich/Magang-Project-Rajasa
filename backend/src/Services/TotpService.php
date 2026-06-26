<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

/**
 * TotpService — Pure PHP TOTP (RFC 6238)
 * Compatible dengan Google Authenticator, Authy, Microsoft Authenticator.
 * Tidak membutuhkan library tambahan (composer).
 *
 * @author feature/prd-6-security
 */
final class TotpService
{
    private const DIGITS    = 6;
    private const PERIOD    = 30;     // detik per time step
    private const ALGORITHM = 'sha1';
    private const ISSUER    = 'Presensi Rajasa';

    // ── Secret Generation ─────────────────────────────────────────────────────

    /**
     * Generate random 32-char base32 secret key.
     */
    public function generateSecret(): string
    {
        $chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 32; $i++) {
            $secret .= $chars[random_int(0, 31)];
        }
        return $secret;
    }

    // ── QR Code URL ───────────────────────────────────────────────────────────

    /**
     * Buat otpauth:// URL untuk di-scan oleh authenticator app.
     * Gunakan URL ini sebagai data QR code.
     */
    public function getOtpAuthUrl(string $secret, string $accountName): string
    {
        $label = rawurlencode(self::ISSUER . ':' . $accountName);
        return sprintf(
            'otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d',
            $label,
            $secret,
            rawurlencode(self::ISSUER),
            self::DIGITS,
            self::PERIOD,
        );
    }

    /**
     * Buat URL gambar QR code (via api.qrserver.com — gratis, tanpa API key).
     */
    public function getQrImageUrl(string $secret, string $accountName, int $size = 220): string
    {
        $otpUrl = $this->getOtpAuthUrl($secret, $accountName);
        return 'https://api.qrserver.com/v1/create-qr-code/?size=' . $size . 'x' . $size
            . '&data=' . rawurlencode($otpUrl)
            . '&ecc=M';
    }

    // ── Verification ──────────────────────────────────────────────────────────

    /**
     * Verifikasi kode TOTP 6 digit.
     *
     * @param string $secret      Secret base32 user
     * @param string $code        Kode 6 digit dari authenticator app
     * @param int    $discrepancy Toleransi time step (default 1 = ±30 detik)
     */
    public function verify(string $secret, string $code, int $discrepancy = 1): bool
    {
        if (!preg_match('/^\d{6}$/', $code)) return false;

        $timeStep = (int) floor(time() / self::PERIOD);
        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            if ($this->computeCode($secret, $timeStep + $i) === $code) {
                return true;
            }
        }
        return false;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private function computeCode(string $secret, int $timeStep): string
    {
        $key  = $this->base32Decode($secret);
        // Pack time step sebagai 8-byte big-endian integer
        $time = "\0\0\0\0" . pack('N', $timeStep);

        $hash   = hash_hmac(self::ALGORITHM, $time, $key, true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;

        $code = (
            ((ord($hash[$offset])     & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8)  |
            ( ord($hash[$offset + 3]) & 0xFF)
        ) % (10 ** self::DIGITS);

        return str_pad((string) $code, self::DIGITS, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $secret): string
    {
        $map    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper($secret);
        $buffer = 0;
        $bits   = 0;
        $result = '';

        for ($i = 0, $len = strlen($secret); $i < $len; $i++) {
            $pos = strpos($map, $secret[$i]);
            if ($pos === false) continue;   // abaikan padding/whitespace
            $buffer = ($buffer << 5) | $pos;
            $bits  += 5;
            if ($bits >= 8) {
                $bits  -= 8;
                $result .= chr(($buffer >> $bits) & 0xFF);
            }
        }
        return $result;
    }
}
