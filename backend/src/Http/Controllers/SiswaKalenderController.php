<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * SiswaKalenderController
 *
 * Returns the URL of the academic calendar PDF file if one exists in
 *   backend/server/kalender-akademik/
 * or { pdf_url: null } when no file has been uploaded yet.
 *
 * Used by the Dashboard Siswa → Kalender Akademik page (Level 4).
 *
 * Route: GET /api/siswa/kalender-akademik
 *
 * Response shape:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": {
 *     "pdf_url":  "http://localhost:8080/server/kalender-akademik/file.pdf" | null,
 *     "pdf_name": "file.pdf" | null
 *   }
 * }
 *
 * @author fashich/dashboard-siswa-page
 */
final class SiswaKalenderController
{
    /**
     * Directory (relative to backend root) where PDF files are stored.
     * The directory is created automatically when the first PDF is uploaded.
     */
    private const PDF_DIR = __DIR__ . '/../../../server/kalender-akademik/';

    public function __construct(
        private readonly AuthMiddleware $auth
    ) {}

    public function __invoke(): void
    {
        // Auth check — any logged-in user may view the calendar
        $this->auth->user();

        $pdfUrl  = null;
        $pdfName = null;

        if (is_dir(self::PDF_DIR)) {
            $files = glob(self::PDF_DIR . '*.pdf');

            if ($files && count($files) > 0) {
                // Pick the most recently modified PDF
                usort($files, static fn ($a, $b) => filemtime($b) <=> filemtime($a));

                $pdfName = basename($files[0]);

                // Return a root-relative path so the browser can request it
                // via /server/... regardless of hostname (works via Vite proxy
                // at localhost:3000 and also direct nginx at localhost:8080).
                // Pakai absolute URL agar bekerja di production (frontend & backend beda domain)
                $appUrl  = rtrim($_ENV['APP_URL'] ?? ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? 'https') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), '/');
                $pdfUrl  = "{$appUrl}/server/kalender-akademik/{$pdfName}";
            }
        }

        Response::success('Data kalender akademik.', [
            'pdf_url'  => $pdfUrl,
            'pdf_name' => $pdfName,
        ]);
    }
}
