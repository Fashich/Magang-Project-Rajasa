<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * PresenceController
 *
 * POST /api/presence/heartbeat — dipanggil client tiap beberapa detik
 * selama user punya tab aplikasi terbuka (lihat main.jsx).
 *
 * "offline" TIDAK PERNAH disimpan di sini — kalau client berhenti kirim
 * heartbeat (tab ditutup/logout/koneksi putus), itu otomatis dideteksi
 * di frontend dengan membandingkan last_heartbeat_at terhadap waktu saat ini.
 */
final class PresenceController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function heartbeat(): void
    {
        $user  = $this->auth->user();
        $body  = $this->request->body();
        $state = $body['state'] ?? 'online';

        if (!in_array($state, ['online', 'idle'], true)) {
            $state = 'online';
        }

        DB::table('users')
            ->where('user_id', (int) $user->user_id)
            ->update([
                'last_heartbeat_at' => date('Y-m-d H:i:s'),
                'presence_state'    => $state,
            ]);

        Response::success('Heartbeat diterima.');
    }
}
