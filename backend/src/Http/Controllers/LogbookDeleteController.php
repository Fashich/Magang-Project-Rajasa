<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * LogbookDeleteController
 * DELETE /api/logbook/{id}
 *
 * Siswa  → hanya bisa hapus milik sendiri, hanya status draft
 * Admin  → bisa hapus semua
 */
final class LogbookDeleteController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(int $id): void
    {
        $user = $this->auth->user();
        $type = $user->user_type;

        $logbook = DB::table('logbook_praktik')->where('logbook_id', $id)->first();

        if (!$logbook) {
            Response::error('Logbook tidak ditemukan.', [], 404);
            return;
        }

        if ($type === 'siswa') {
            if ((int) $user->siswa_id !== (int) $logbook->siswa_id) {
                Response::error('Bukan logbook milik Anda.', [], 403);
                return;
            }
            if ($logbook->status !== 'draft') {
                Response::error('Hanya entri berstatus draft yang dapat dihapus.', [], 409);
                return;
            }
        } elseif (!in_array($type, ['admin'], true)) {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        DB::table('logbook_praktik')->where('logbook_id', $id)->delete();

        Response::success('Logbook berhasil dihapus.', []);
    }
}
