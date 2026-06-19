<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;

final class PresensiSesiWarningCheckController
{
    public function __construct(
        private readonly Request $request,
        private readonly PermissionMiddleware $permission
    ) {
    }

    public function __invoke(): void
    {
        $this->permission->require('attendance.session.create');

        $body = $this->request->body();
        $jamIds = array_values(array_filter(array_map('intval', $body['jam_ids'] ?? [])));
        $tanggal = date('Y-m-d');

        $conflicts = DB::table('presensi_sesi as s')
            ->join('presensi_sesi_jam as sj', 'sj.presensi_sesi_id', '=', 's.presensi_sesi_id')
            ->leftJoin('rombel as r', 'r.rombel_id', '=', 's.rombel_id')
            ->where('s.tanggal', $tanggal)
            ->whereIn('sj.jam_id', $jamIds)
            ->orderByDesc('s.presensi_sesi_id')
            ->get([
                's.presensi_sesi_id',
                's.mode_presensi',
                's.rombel_id',
                'r.label_rombel',
                's.ruang_pilihan',
                's.ruang_label_snapshot',
                's.status',
                'sj.jam_id',
            ])
            ->map(fn (object $row): array => [
                'presensi_sesi_id' => (int) $row->presensi_sesi_id,
                'mode_presensi' => $row->mode_presensi,
                'rombel_id' => $row->rombel_id !== null ? (int) $row->rombel_id : null,
                'label_rombel' => $row->label_rombel,
                'ruang_pilihan' => $row->ruang_pilihan,
                'ruang_label_snapshot' => $row->ruang_label_snapshot,
                'status' => $row->status,
                'jam_id' => (int) $row->jam_id,
            ])
            ->values()
            ->all();

        Response::success('Cek warning sesi selesai.', [
            'has_warning' => count($conflicts) > 0,
            'message' => count($conflicts) > 0
                ? 'Jam pelajaran ini sudah pernah dipakai hari ini.'
                : 'Tidak ada warning.',
            'conflicts' => $conflicts,
        ]);
    }
}