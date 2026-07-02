<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Http\Middleware\PermissionMiddleware;

/**
 * SiswaQrMassalController
 *
 * GET /api/siswa/qr-massal?rombel_id=X
 *
 * Mengembalikan data siswa beserta token QR untuk satu rombel.
 * Frontend menggunakan data ini untuk render dan print semua kartu QR sekaligus.
 *
 * Response:
 * {
 *   "rombel": { label_rombel, ... },
 *   "siswa": [{ siswa_id, nama_lengkap, nis, qr_token, ... }, ...]
 * }
 */
final class SiswaQrMassalController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionMiddleware $permission,
    ) {}

    public function __invoke(): void
    {
        $this->permission->require('students.read');

        $rombelId = isset($_GET['rombel_id']) ? (int)$_GET['rombel_id'] : null;

        if (!$rombelId) {
            Response::error('rombel_id wajib diisi.', [], 422);
            return;
        }

        $rombel = DB::table('rombel')
            ->where('rombel_id', $rombelId)
            ->where('status', 'aktif')
            ->first();

        if (!$rombel) {
            Response::error('Rombel tidak ditemukan.', [], 404);
            return;
        }

        // Ambil siswa aktif di rombel ini beserta QR token-nya
        $siswa = DB::table('siswa AS s')
            ->leftJoin('siswa_qr AS qr', function ($j) {
                $j->on('qr.siswa_id', '=', 's.siswa_id')
                  ->where('qr.is_active', '=', 1);
            })
            ->where('s.rombel_id_aktif', $rombelId)
            ->where('s.status', 'aktif')
            ->orderBy('s.nama_lengkap')
            ->get([
                's.siswa_id',
                's.nisn',
                's.nis',
                's.nama_lengkap',
                's.jenis_kelamin',
                'qr.qr_token',
                'qr.qr_code_data',
            ])
            ->map(fn(object $s): array => [
                'siswa_id'     => (int) $s->siswa_id,
                'nisn'         => $s->nisn,
                'nis'          => $s->nis,
                'nama_lengkap' => $s->nama_lengkap,
                'jenis_kelamin'=> $s->jenis_kelamin,
                'qr_token'     => $s->qr_token,
                'has_qr'       => !empty($s->qr_token),
            ])
            ->values()
            ->all();

        Response::success('Data QR massal berhasil diambil.', [
            'rombel' => [
                'rombel_id'   => (int) $rombel->rombel_id,
                'label'       => $rombel->label_rombel,
                'tingkatan'   => $rombel->tingkatan,
            ],
            'total_siswa' => count($siswa),
            'siswa'       => $siswa,
        ]);
    }
}
