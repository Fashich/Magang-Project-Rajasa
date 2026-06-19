<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;

final class RombelController
{
    public function __construct(
        private readonly PermissionMiddleware $permission
    ) {
    }

    public function __invoke(): void
    {
        $this->permission->require('attendance.session.read');

        $rombel = DB::table('rombel')
            ->leftJoin('jurusan', 'jurusan.jurusan_id', '=', 'rombel.jurusan_id')
            ->where('rombel.status', 'aktif')
            ->orderBy('rombel.tingkat_angka')
            ->orderBy('jurusan.kode_jurusan')
            ->orderBy('rombel.nomor_rombel')
            ->orderBy('rombel.rombel_id')
            ->get([
                'rombel.rombel_id',
                'rombel.label_rombel',
                'rombel.label_rombel_raw',
                'rombel.tingkatan',
                'rombel.tingkat_angka',
                'rombel.nomor_rombel',
                'rombel.jurusan_id',
                'rombel.status',
                'jurusan.kode_jurusan',
                'jurusan.nama_jurusan',
            ])
            ->map(fn (object $row): array => $this->formatRombel($row))
            ->values()
            ->all();

        Response::success('Daftar rombel aktif.', [
            'rombel' => $rombel,
        ]);
    }

    private function formatRombel(object $row): array
    {
        $label = trim((string) ($row->label_rombel ?? ''));
        $rawLabel = trim((string) ($row->label_rombel_raw ?? ''));

        if ($label === '') {
            $label = $rawLabel !== '' ? $rawLabel : 'Rombel #' . (int) $row->rombel_id;
        }

        return [
            'rombel_id' => (int) $row->rombel_id,
            'label' => $label,
            'label_rombel' => $row->label_rombel,
            'label_rombel_raw' => $row->label_rombel_raw,
            'tingkatan' => $row->tingkatan,
            'tingkat_angka' => $row->tingkat_angka !== null ? (int) $row->tingkat_angka : null,
            'nomor_rombel' => (int) $row->nomor_rombel,
            'jurusan_id' => (int) $row->jurusan_id,
            'kode_jurusan' => $row->kode_jurusan,
            'nama_jurusan' => $row->nama_jurusan,
            'status' => $row->status,
        ];
    }
}