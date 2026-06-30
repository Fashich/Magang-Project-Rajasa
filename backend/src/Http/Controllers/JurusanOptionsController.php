<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;

/**
 * JurusanOptionsController
 *
 * GET /api/jurusan/options — daftar jurusan aktif untuk dropdown form
 * (mis. form Tambah Siswa di Admin)
 */
final class JurusanOptionsController
{
    public function __invoke(): void
    {
        $jurusan = DB::table('jurusan')
            ->where('status', 'aktif')
            ->orderBy('nama_jurusan')
            ->get(['jurusan_id', 'kode_jurusan', 'nama_jurusan'])
            ->map(fn ($row) => [
                'jurusan_id'   => (int) $row->jurusan_id,
                'kode_jurusan' => $row->kode_jurusan,
                'nama_jurusan' => $row->nama_jurusan,
            ])
            ->values()
            ->all();

        Response::success('Daftar jurusan aktif.', ['jurusan' => $jurusan]);
    }
}
