<?php
declare(strict_types=1);
namespace Rajasa\PresensiSiswa\Http\Controllers;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * PengaturanKonfigurasiController
 * PATCH /api/admin/pengaturan/konfigurasi — bulk upsert
 */
final class PengaturanKonfigurasiController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();
        if ($user->user_type !== 'admin') { Response::error('Akses ditolak.', [], 403); return; }

        $body = $this->request->body();
        if (empty($body) || !is_array($body)) {
            Response::error('Data konfigurasi tidak valid.', [], 422); return;
        }

        $existingTypes = DB::table('konfigurasi')->pluck('tipe_nilai', 'kunci')->all();
        $updated = 0;

        foreach ($body as $kunci => $nilai) {
            $kunci = trim((string) $kunci);
            if (!$kunci) continue;
            $nilai = (string) $nilai;
            $tipe  = $existingTypes[$kunci] ?? 'string';

            if ($tipe === 'number' && !is_numeric($nilai)) continue;
            if ($tipe === 'boolean' && !in_array($nilai, ['true','false','1','0'], true)) continue;

            if (DB::table('konfigurasi')->where('kunci', $kunci)->exists()) {
                DB::table('konfigurasi')->where('kunci', $kunci)->update(['nilai' => $nilai]);
            } else {
                DB::table('konfigurasi')->insert(['kunci' => $kunci, 'nilai' => $nilai, 'tipe_nilai' => $tipe]);
            }
            $updated++;
        }
        Response::success("{$updated} konfigurasi berhasil disimpan.");
    }
}
