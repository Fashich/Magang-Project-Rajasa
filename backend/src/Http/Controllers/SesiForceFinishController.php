<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * SesiForceFinishController
 *
 * POST /api/admin/sesi/{id}/force-finish
 * Admin bisa paksa selesaikan sesi apapun (override guru/staff)
 *
 * @author feature/admin-dashboard
 */
final class SesiForceFinishController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(string $id): void
    {
        $user = $this->auth->user();

        if ($user->user_type !== 'admin') {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        $sesiId = (int) $id;

        $sesi = DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sesiId)
            ->first();

        if (!$sesi) {
            Response::error('Sesi tidak ditemukan.', [], 404);
            return;
        }

        if ($sesi->status === 'selesai') {
            Response::error('Sesi sudah selesai.', [], 422);
            return;
        }

        if (in_array($sesi->status, ['gagal', 'expired', 'terputus'], true)) {
            Response::error('Sesi sudah tidak aktif (status: ' . $sesi->status . ').', [], 422);
            return;
        }

        $now = date('Y-m-d H:i:s');

        // Cari kolom yang tersedia (defensive terhadap versi schema)
        $columns = DB::select("SHOW COLUMNS FROM presensi_sesi");
        $colNames = array_map(fn($c) => $c->Field, $columns);

        $payload = ['status' => 'selesai', 'ended_at' => $now, 'updated_at' => $now];

        if (in_array('closed_by_user_id', $colNames)) {
            $payload['closed_by_user_id'] = (int) $user->user_id;
        }
        if (in_array('ended_reason', $colNames)) {
            $payload['ended_reason'] = 'force_finish_by_admin';
        }

        DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sesiId)
            ->update($payload);

        $updatedSesi = DB::table('presensi_sesi AS ps')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 'ps.rombel_id')
            ->leftJoin('users AS u', 'u.user_id', '=', 'ps.opened_by_user_id')
            ->where('ps.presensi_sesi_id', $sesiId)
            ->selectRaw('ps.*, r.label_rombel, u.username AS dibuka_oleh_username')
            ->first();

        Response::success('Sesi berhasil diselesaikan paksa.', [
            'sesi' => (array) $updatedSesi,
        ]);
    }
}
