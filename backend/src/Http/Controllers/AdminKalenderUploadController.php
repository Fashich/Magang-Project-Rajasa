<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Services\FileStorageService;

/**
 * AdminKalenderUploadController
 *
 * POST /api/admin/kalender-akademik (multipart/form-data, field: file)
 *
 * Upload PDF kalender akademik. Prioritas: Cloudflare R2 (persisten).
 * Jika R2 tidak dikonfigurasi, fallback ke local disk (perilaku lama —
 * TIDAK persisten di Render karena container ephemeral).
 */
final class AdminKalenderUploadController
{
    private const LOCAL_DIR = __DIR__ . '/../../../server/kalender-akademik/';
    private const MAX_SIZE  = 10 * 1024 * 1024; // 10MB

    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
        private readonly FileStorageService $storage,
    ) {}

    public function __invoke(): void
    {
        $this->permission->require('konfigurasi.manage');

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('File PDF wajib diunggah.', [], 422);
            return;
        }

        $file = $_FILES['file'];

        if ($file['size'] > self::MAX_SIZE) {
            Response::error('Ukuran file maksimal 10MB.', [], 422);
            return;
        }

        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if ($mimeType !== 'application/pdf') {
            Response::error('File harus berformat PDF.', [], 422);
            return;
        }

        $filename = 'kalender-akademik-' . date('Ymd-His') . '.pdf';
        $contents = file_get_contents($file['tmp_name']);

        // ── Prioritas 1: Upload ke R2 (persisten) ──────────────────────────
        if ($this->storage->isEnabled()) {
            try {
                $url = $this->storage->put("kalender-akademik/{$filename}", $contents, 'application/pdf');

                Response::success('Kalender akademik berhasil diunggah ke cloud storage.', [
                    'pdf_url'  => $url,
                    'pdf_name' => $filename,
                    'storage'  => 'r2',
                ]);
                return;
            } catch (\Throwable $e) {
                error_log('[AdminKalenderUpload] R2 upload gagal, fallback ke local: ' . $e->getMessage());
                // lanjut ke fallback local di bawah
            }
        }

        // ── Fallback: Local disk (peringatan: tidak persisten di Render) ──
        if (!is_dir(self::LOCAL_DIR)) {
            mkdir(self::LOCAL_DIR, 0755, true);
        }

        $localPath = self::LOCAL_DIR . $filename;
        file_put_contents($localPath, $contents);

        Response::success('Kalender akademik berhasil diunggah (local storage — PERINGATAN: file akan hilang saat redeploy).', [
            'pdf_url'  => "/server/kalender-akademik/{$filename}",
            'pdf_name' => $filename,
            'storage'  => 'local',
            'warning'  => 'R2_ACCOUNT_ID belum dikonfigurasi. File ini TIDAK akan bertahan setelah redeploy berikutnya. Hubungi developer untuk setup Cloudflare R2.',
        ]);
    }
}
