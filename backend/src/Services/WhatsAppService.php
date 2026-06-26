<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

/**
 * WhatsAppService — Integrasi Fonnte API
 *
 * Cara setup:
 *   1. Daftar di https://fonnte.com → dapatkan token
 *   2. Tambah ke .env:  FONNTE_TOKEN=xxxxxxxx
 *   3. Hubungkan nomor WhatsApp sekolah di dashboard Fonnte
 *
 * Cara pakai:
 *   $wa = new WhatsAppService();
 *   $wa->send('081234567890', 'Halo, izin sudah disetujui.');
 *   $wa->sendTemplate('izin_approved', ['siswa' => 'Budi', 'tanggal' => '1 Jan']);
 *
 * @author feature/prd-5-notification
 */
final class WhatsAppService
{
    private const API_URL = 'https://api.fonnte.com/send';

    private string $token;
    private bool   $enabled;

    public function __construct()
    {
        $this->token   = $_ENV['FONNTE_TOKEN'] ?? '';
        $this->enabled = !empty($this->token);
    }

    /**
     * Kirim pesan WhatsApp ke satu nomor.
     *
     * @param string $phone  Nomor HP (format: 08xx atau 62xx)
     * @param string $message Isi pesan (support emoji & newline)
     * @return bool
     */
    public function send(string $phone, string $message): bool
    {
        if (!$this->enabled) {
            error_log("[WhatsApp] Service disabled — FONNTE_TOKEN not set.");
            return false;
        }

        $phone = $this->normalizePhone($phone);
        if (!$phone) {
            error_log("[WhatsApp] Invalid phone number.");
            return false;
        }

        try {
            $ch = curl_init(self::API_URL);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_HTTPHEADER     => [
                    'Authorization: ' . $this->token,
                    'Content-Type: application/json',
                ],
                CURLOPT_POSTFIELDS     => json_encode([
                    'target'      => $phone,
                    'message'     => $message,
                    'countryCode' => '62',
                ]),
                CURLOPT_TIMEOUT        => 10,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error    = curl_error($ch);
            curl_close($ch);

            if ($error) {
                error_log("[WhatsApp] cURL error: {$error}");
                return false;
            }

            $result = json_decode($response, true);
            if ($httpCode !== 200 || !($result['status'] ?? false)) {
                error_log("[WhatsApp] API error [{$httpCode}]: " . ($result['reason'] ?? $response));
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            error_log("[WhatsApp] Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Kirim ke banyak nomor sekaligus.
     */
    public function sendBulk(array $phones, string $message): void
    {
        foreach ($phones as $phone) {
            $this->send($phone, $message);
        }
    }

    /**
     * Template messages — agar konsisten di seluruh sistem.
     */
    public function sendTemplate(string $template, array $vars, string $phone): bool
    {
        $message = match ($template) {

            'eizin_menunggu_ortu' => sprintf(
                "📋 *Presensi Rajasa — Permintaan Persetujuan*\n\n" .
                "Halo, Orang Tua/Wali dari *%s*.\n\n" .
                "Ananda mengajukan *%s* untuk tanggal *%s s/d %s*.\n" .
                "Alasan: %s\n\n" .
                "Mohon berikan persetujuan melalui aplikasi Presensi Rajasa.\n" .
                "_SMKS Rajasa Surabaya_",
                $vars['siswa']    ?? '',
                $vars['jenis']    ?? 'izin',
                $vars['dari']     ?? '',
                $vars['sampai']   ?? '',
                $vars['alasan']   ?? ''
            ),

            'eizin_disetujui' => sprintf(
                "✅ *Presensi Rajasa — Izin Disetujui*\n\n" .
                "Izin *%s* untuk *%s* (%s s/d %s) telah *disetujui*.\n\n" .
                "_SMKS Rajasa Surabaya_",
                $vars['jenis']  ?? 'izin',
                $vars['siswa']  ?? '',
                $vars['dari']   ?? '',
                $vars['sampai'] ?? ''
            ),

            'eizin_ditolak' => sprintf(
                "❌ *Presensi Rajasa — Izin Ditolak*\n\n" .
                "Izin *%s* untuk *%s* (%s s/d %s) *ditolak*.\n" .
                "Catatan: %s\n\n" .
                "_SMKS Rajasa Surabaya_",
                $vars['jenis']   ?? 'izin',
                $vars['siswa']   ?? '',
                $vars['dari']    ?? '',
                $vars['sampai']  ?? '',
                $vars['catatan'] ?? '-'
            ),

            'early_warning' => sprintf(
                "⚠️ *Presensi Rajasa — Peringatan Kehadiran*\n\n" .
                "Ananda *%s* dari kelas *%s* memiliki tingkat kehadiran *%s%%* " .
                "dalam %s hari terakhir.\n\n" .
                "Mohon segera diberikan perhatian.\n" .
                "_SMKS Rajasa Surabaya_",
                $vars['siswa']    ?? '',
                $vars['kelas']    ?? '',
                $vars['rate']     ?? '0',
                $vars['periode']  ?? '30'
            ),

            default => $vars['message'] ?? '',
        };

        return $this->send($phone, $message);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);
        if (empty($phone)) return '';
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (!str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }
        return strlen($phone) >= 10 ? $phone : '';
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }
}
