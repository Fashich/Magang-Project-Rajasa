<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as MailerException;

/**
 * EmailService — Kirim email via PHPMailer (SMTP)
 *
 * Cara setup:
 *   Tambah ke .env:
 *     MAIL_HOST=smtp.gmail.com
 *     MAIL_PORT=587
 *     MAIL_USERNAME=presensi@smksrajasa.sch.id
 *     MAIL_PASSWORD=app_password_dari_gmail
 *     MAIL_FROM=presensi@smksrajasa.sch.id
 *     MAIL_FROM_NAME=Presensi Lab Rajasa
 *
 * Cara pakai:
 *   $mail = new EmailService();
 *   $mail->send('guru@email.com', 'Judul', '<p>Isi email HTML</p>');
 *   $mail->sendTemplate('eizin_disetujui', ['siswa' => 'Budi'], 'ortu@email.com');
 *
 * @author feature/prd-5-notification
 */
final class EmailService
{
    private bool $enabled;

    public function __construct()
    {
        $this->enabled = !empty($_ENV['MAIL_HOST'] ?? '');
    }

    /**
     * Kirim email HTML ke satu alamat.
     */
    public function send(string $to, string $subject, string $htmlBody, string $toName = ''): bool
    {
        if (!$this->enabled) {
            error_log("[Email] Service disabled — MAIL_HOST not set in .env");
            return false;
        }

        try {
            $mail = new PHPMailer(true);

            // SMTP config
            $mail->isSMTP();
            $mail->Host       = $_ENV['MAIL_HOST']     ?? 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['MAIL_USERNAME'] ?? '';
            $mail->Password   = $_ENV['MAIL_PASSWORD'] ?? '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int)($_ENV['MAIL_PORT'] ?? 587);
            $mail->CharSet    = 'UTF-8';
            $mail->Timeout    = 15;

            // Pengirim
            $mail->setFrom(
                $_ENV['MAIL_FROM']      ?? $_ENV['MAIL_USERNAME'] ?? '',
                $_ENV['MAIL_FROM_NAME'] ?? 'Presensi Rajasa'
            );

            // Penerima
            $mail->addAddress($to, $toName ?: $to);

            // Konten
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $this->wrapInLayout($subject, $htmlBody);
            $mail->AltBody = strip_tags($htmlBody);

            $mail->send();
            return true;

        } catch (MailerException $e) {
            error_log("[Email] Mailer error: " . $e->getMessage());
            return false;
        } catch (\Throwable $e) {
            error_log("[Email] Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Template emails.
     */
    public function sendTemplate(string $template, array $vars, string $to, string $toName = ''): bool
    {
        [$subject, $html] = match ($template) {

            'eizin_menunggu_ortu' => [
                "Permintaan Persetujuan Izin — {$vars['siswa']}",
                "<p>Halo,</p>
                 <p>Ananda <strong>{$vars['siswa']}</strong> mengajukan
                 <strong>{$vars['jenis']}</strong> pada tanggal
                 <strong>{$vars['dari']}</strong> s/d <strong>{$vars['sampai']}</strong>.</p>
                 <p><strong>Alasan:</strong> {$vars['alasan']}</p>
                 <p>Silakan buka aplikasi Presensi Rajasa untuk memberikan persetujuan.</p>",
            ],

            'eizin_disetujui' => [
                "Izin {$vars['siswa']} Telah Disetujui",
                "<p>Halo,</p>
                 <p>Izin <strong>{$vars['jenis']}</strong> untuk
                 <strong>{$vars['siswa']}</strong>
                 ({$vars['dari']} s/d {$vars['sampai']}) telah <strong>disetujui</strong>.</p>",
            ],

            'eizin_ditolak' => [
                "Izin {$vars['siswa']} Ditolak",
                "<p>Halo,</p>
                 <p>Izin <strong>{$vars['jenis']}</strong> untuk
                 <strong>{$vars['siswa']}</strong>
                 ({$vars['dari']} s/d {$vars['sampai']}) <strong>ditolak</strong>.</p>
                 <p><strong>Catatan:</strong> {$vars['catatan']}</p>",
            ],

            'early_warning' => [
                "Peringatan Kehadiran — {$vars['siswa']}",
                "<p>Halo,</p>
                 <p>Ananda <strong>{$vars['siswa']}</strong> (Kelas {$vars['kelas']})
                 memiliki tingkat kehadiran <strong>{$vars['rate']}%</strong>
                 dalam {$vars['periode']} hari terakhir.</p>
                 <p>Mohon segera diberikan perhatian.</p>",
            ],

            default => [
                $vars['subject'] ?? 'Notifikasi Presensi Rajasa',
                $vars['html']    ?? '<p>' . ($vars['message'] ?? '') . '</p>',
            ],
        };

        return $this->send($to, $subject, $html, $toName);
    }

    // ── Email layout wrapper ──────────────────────────────────────────────────

    private function wrapInLayout(string $title, string $body): string
    {
        return <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; color: #1e293b; margin:0; padding:0; }
    .wrap { max-width: 560px; margin: 32px auto; background: #fff;
            border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #1e40af; padding: 20px 24px; }
    .header h1 { color: white; font-size: 16px; margin: 0; }
    .header p  { color: rgba(255,255,255,.75); font-size: 12px; margin: 4px 0 0; }
    .body { padding: 24px; font-size: 14px; line-height: 1.6; }
    .body p { margin: 0 0 12px; }
    .footer { background: #f1f5f9; padding: 14px 24px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🏫 SMKS Rajasa Surabaya</h1>
      <p>Sistem Informasi Presensi Lab</p>
    </div>
    <div class="body">
      {$body}
    </div>
    <div class="footer">
      Email ini dikirim otomatis oleh sistem. Jangan balas email ini. &copy; 2026 SMKS Rajasa Surabaya
    </div>
  </div>
</body>
</html>
HTML;
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }
}
