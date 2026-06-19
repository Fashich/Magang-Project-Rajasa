<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\HttpException;

final class PresensiSessionTimeoutService
{
    private const TIMEOUT_SECONDS = 300;

    public function expireInactiveSessions(): int
    {
        $now = date('Y-m-d H:i:s');
        $limit = date('Y-m-d H:i:s', time() - self::TIMEOUT_SECONDS);

        return DB::table('presensi_sesi')
            ->where('status', 'aktif')
            ->whereRaw('COALESCE(last_seen_at, updated_at, started_at) < ?', [$limit])
            ->update([
                'status' => 'expired',
                'ended_at' => $now,
                'ended_reason' => 'timeout',
                'updated_at' => $now,
            ]);
    }

    public function heartbeat(int $sessionId): array
    {
        $this->expireInactiveSessions();

        $session = DB::table('presensi_sesi')->where('presensi_sesi_id', $sessionId)->first();

        if (!$session) {
            throw new HttpException('Sesi presensi tidak ditemukan.', 404);
        }

        if ($session->status !== 'aktif') {
            throw new HttpException('Sesi presensi sudah tidak aktif.', 409);
        }

        $now = date('Y-m-d H:i:s');
        $expiresAt = date('Y-m-d H:i:s', time() + self::TIMEOUT_SECONDS);

        DB::table('presensi_sesi')->where('presensi_sesi_id', $sessionId)->update([
            'last_seen_at' => $now,
            'expires_at' => $expiresAt,
            'updated_at' => $now,
        ]);

        return ['presensi_sesi_id' => $sessionId, 'last_seen_at' => $now, 'expires_at' => $expiresAt];
    }
}