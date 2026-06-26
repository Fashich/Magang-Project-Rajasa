<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * NotifikasiController
 *
 * GET /api/notifikasi
 * Query params:
 *   per_page=10    (default 10, max 50)
 *   page=1
 *   is_read=0|1|all  (default: all)
 *
 * @author feature/prd-5-notification
 */
final class NotifikasiController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user    = $this->auth->user();
        $userId  = (int) $user->user_id;

        $perPage = min((int)($_GET['per_page'] ?? 10), 50);
        $page    = max((int)($_GET['page'] ?? 1), 1);
        $isRead  = $_GET['is_read'] ?? 'all';

        $query = DB::table('notifikasi_user')
            ->where('user_id', $userId)
            ->orderByDesc('created_at');

        if ($isRead === '0') {
            $query->where('is_read', 0);
        } elseif ($isRead === '1') {
            $query->where('is_read', 1);
        }

        $total  = $query->count();
        $rows   = $query->limit($perPage)->offset(($page - 1) * $perPage)->get();

        // Unread count (selalu dihitung fresh)
        $unreadCount = DB::table('notifikasi_user')
            ->where('user_id', $userId)
            ->where('is_read', 0)
            ->count();

        // Format waktu relatif
        $data = $rows->map(function ($n) {
            return [
                'notifikasi_id' => (int) $n->notifikasi_id,
                'tipe'          => $n->tipe,
                'judul'         => $n->judul,
                'pesan'         => $n->pesan,
                'related_table' => $n->related_table,
                'related_id'    => $n->related_id,
                'is_read'       => (bool) $n->is_read,
                'popup_until'   => $n->popup_until,
                'created_at'    => $n->created_at,
                'time_ago'      => $this->timeAgo($n->created_at),
            ];
        })->values()->all();

        Response::success('Daftar notifikasi.', [
            'data'         => $data,
            'unread_count' => (int) $unreadCount,
            'meta'         => [
                'total'     => $total,
                'page'      => $page,
                'per_page'  => $perPage,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    private function timeAgo(string $datetime): string
    {
        try {
            $diff = Carbon::parse($datetime)->diffInSeconds(Carbon::now());
            if ($diff < 60)  return 'baru saja';
            if ($diff < 3600) return (int)($diff / 60) . ' mnt lalu';
            if ($diff < 86400) return (int)($diff / 3600) . ' jam lalu';
            if ($diff < 604800) return (int)($diff / 86400) . ' hari lalu';
            return Carbon::parse($datetime)->format('d M Y');
        } catch (\Throwable) {
            return '';
        }
    }
}
