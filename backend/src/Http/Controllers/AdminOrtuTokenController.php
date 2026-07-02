<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;
use Rajasa\PresensiSiswa\Support\Config;

/**
 * AdminOrtuTokenController
 *
 * GET  /api/admin/siswa/{id}/portal-ortu-link   → ambil link portal (generate jika belum ada)
 * POST /api/admin/siswa/{id}/portal-ortu-link/regenerate → buat token baru (invalidate lama)
 *
 * Digunakan admin/guru untuk mendapatkan link yang dikirim ke orang tua via WhatsApp.
 */
final class AdminOrtuTokenController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
    ) {}

    public function get(string $siswaId): void
    {
        $this->permission->require('students.read');

        $sid = (int) $siswaId;

        $existing = DB::table('ortu_portal_token')
            ->where('siswa_id', $sid)
            ->where('is_active', 1)
            ->first();

        if ($existing) {
            $this->respondWithLink($existing->token, $sid);
            return;
        }

        $token = $this->generateToken();
        $user  = $this->auth->user();

        DB::table('ortu_portal_token')->insert([
            'siswa_id'           => $sid,
            'token'              => $token,
            'is_active'          => 1,
            'created_at'         => date('Y-m-d H:i:s'),
            'created_by_user_id' => $user->user_id,
        ]);

        $this->respondWithLink($token, $sid);
    }

    public function regenerate(string $siswaId): void
    {
        $this->permission->require('students.update');

        $sid   = (int) $siswaId;
        $token = $this->generateToken();
        $user  = $this->auth->user();

        // Nonaktifkan token lama, buat baru (link lama otomatis expired)
        DB::table('ortu_portal_token')->where('siswa_id', $sid)->delete();

        DB::table('ortu_portal_token')->insert([
            'siswa_id'           => $sid,
            'token'              => $token,
            'is_active'          => 1,
            'created_at'         => date('Y-m-d H:i:s'),
            'created_by_user_id' => $user->user_id,
        ]);

        $this->respondWithLink($token, $sid, 'Link baru berhasil dibuat. Link lama sudah tidak berlaku.');
    }

    private function generateToken(): string
    {
        return sprintf(
            '%s-%s-%s-%s-%s',
            bin2hex(random_bytes(4)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(2)),
            bin2hex(random_bytes(6))
        );
    }

    private function respondWithLink(string $token, int $siswaId, string $message = 'Link portal orang tua.'): void
    {
        $siswa = DB::table('siswa')->where('siswa_id', $siswaId)->select('nama_lengkap')->first();

        $frontendUrl = rtrim(Config::get('app.frontend_url', 'https://presensi-rajasa-frontend.vercel.app'), '/');
        $link = "{$frontendUrl}/portal-ortu/{$token}";

        $waText = urlencode(
            "Assalamu'alaikum, berikut link untuk memantau kehadiran ananda "
            . ($siswa->nama_lengkap ?? '') . " di SMKS Rajasa Surabaya:\n\n{$link}\n\n"
            . "Link ini pribadi, mohon tidak dibagikan ke pihak lain. Terima kasih."
        );

        Response::success($message, [
            'siswa_id' => $siswaId,
            'token'    => $token,
            'link'     => $link,
            'wa_share_text' => $waText,
        ]);
    }
}
