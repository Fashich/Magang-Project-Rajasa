<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * NotifikasiActionController
 *
 * PATCH /api/notifikasi/{id}/read  → mark 1 notifikasi as read
 * POST  /api/notifikasi/read-all   → mark semua as read
 * DELETE /api/notifikasi/{id}      → hapus 1 notifikasi
 *
 * @author feature/prd-5-notification
 */
final class NotifikasiActionController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    /** PATCH /api/notifikasi/{id}/read */
    public function markRead(int $id): void
    {
        $user   = $this->auth->user();
        $userId = (int) $user->user_id;

        $affected = DB::table('notifikasi_user')
            ->where('notifikasi_id', $id)
            ->where('user_id', $userId)
            ->where('is_read', 0)
            ->update([
                'is_read' => 1,
                'read_at' => Carbon::now()->toDateTimeString(),
            ]);

        $unread = DB::table('notifikasi_user')
            ->where('user_id', $userId)->where('is_read', 0)->count();

        Response::success('Notifikasi ditandai dibaca.', [
            'affected'     => $affected,
            'unread_count' => (int) $unread,
        ]);
    }

    /** POST /api/notifikasi/read-all */
    public function markAllRead(): void
    {
        $user   = $this->auth->user();
        $userId = (int) $user->user_id;

        $affected = DB::table('notifikasi_user')
            ->where('user_id', $userId)
            ->where('is_read', 0)
            ->update([
                'is_read' => 1,
                'read_at' => Carbon::now()->toDateTimeString(),
            ]);

        Response::success('Semua notifikasi ditandai dibaca.', [
            'affected'     => $affected,
            'unread_count' => 0,
        ]);
    }

    /** DELETE /api/notifikasi/{id} */
    public function delete(int $id): void
    {
        $user   = $this->auth->user();
        $userId = (int) $user->user_id;

        DB::table('notifikasi_user')
            ->where('notifikasi_id', $id)
            ->where('user_id', $userId)
            ->delete();

        $unread = DB::table('notifikasi_user')
            ->where('user_id', $userId)->where('is_read', 0)->count();

        Response::success('Notifikasi dihapus.', ['unread_count' => (int) $unread]);
    }
}
