<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * JamPembelajaranOptionsController
 * GET /api/jam-pembelajaran/options
 * Returns active jam_pembelajaran as dropdown options
 */
final class JamPembelajaranOptionsController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $this->auth->user(); // require login

        $tipeHari = $_GET['tipe_hari'] ?? 'normal';

        $jams = DB::table('jam_pembelajaran')
            ->where('status', 'aktif')
            ->where('tipe_hari', $tipeHari)
            ->orderBy('jam_ke')
            ->get(['jam_id', 'jam_ke', 'label_jam', 'waktu_mulai', 'waktu_selesai'])
            ->map(fn(object $j): array => [
                'jam_id'       => (int) $j->jam_id,
                'jam_ke'       => (int) $j->jam_ke,
                'label'        => $j->label_jam,
                'waktu_mulai'  => $j->waktu_mulai,
                'waktu_selesai'=> $j->waktu_selesai,
            ])
            ->values()
            ->all();

        Response::success('Daftar jam pembelajaran.', ['jams' => $jams]);
    }
}
