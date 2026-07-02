<?php
declare(strict_types=1);
namespace Rajasa\PresensiSiswa\Http\Controllers;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * PengaturanMapelController
 * POST   /api/admin/pengaturan/mapel        — tambah
 * PATCH  /api/admin/pengaturan/mapel/{id}   — update
 * DELETE /api/admin/pengaturan/mapel/{id}   — nonaktifkan
 */
final class PengaturanMapelController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(string $id = '0'): void
    {
        $id   = (int) $id;
        $user = $this->auth->user();
        if ($user->user_type !== 'admin') { Response::error('Akses ditolak.', [], 403); return; }

        match ($_SERVER['REQUEST_METHOD'] ?? 'GET') {
            'POST'   => $this->create(),
            'PATCH'  => $this->update($id),
            'DELETE' => $this->delete($id),
            default  => Response::error('Method tidak valid.', [], 405),
        };
    }

    private function create(): void
    {
        $body      = $this->request->body();
        $kode      = strtoupper(trim($body['kode_mapel'] ?? ''));
        $nama      = trim($body['nama_mapel'] ?? '');
        $kelompok  = $body['kelompok']  ?? 'umum';
        $tingkatan = $body['tingkatan'] ?? 'semua';
        $jurusanId = !empty($body['jurusan_id']) ? (int) $body['jurusan_id'] : null;
        $kkm       = (int) ($body['kkm'] ?? 75);

        if (!$kode || !$nama) { Response::error('Kode dan nama mata pelajaran wajib diisi.', [], 422); return; }
        if (!in_array($kelompok, ['umum', 'kejuruan', 'muatan_lokal'], true)) {
            Response::error('Kelompok tidak valid.', [], 422); return;
        }
        if (!in_array($tingkatan, ['X', 'XI', 'XII', 'semua'], true)) {
            Response::error('Tingkatan tidak valid.', [], 422); return;
        }
        if ($kkm < 0 || $kkm > 100) { Response::error('KKM harus antara 0-100.', [], 422); return; }

        if (DB::table('mata_pelajaran')->where('kode_mapel', $kode)->exists()) {
            Response::error('Kode mata pelajaran sudah digunakan.', [], 409); return;
        }
        if ($jurusanId && !DB::table('jurusan')->where('jurusan_id', $jurusanId)->exists()) {
            Response::error('Jurusan tidak ditemukan.', [], 404); return;
        }

        $id = DB::table('mata_pelajaran')->insertGetId([
            'kode_mapel' => $kode,
            'nama_mapel' => $nama,
            'kelompok'   => $kelompok,
            'tingkatan'  => $tingkatan,
            'jurusan_id' => $jurusanId,
            'kkm'        => $kkm,
            'status'     => 'aktif',
        ]);
        Response::success('Mata pelajaran berhasil ditambahkan.', ['mapel_id' => $id], 201);
    }

    private function update(int $id): void
    {
        if (!DB::table('mata_pelajaran')->where('mapel_id', $id)->exists()) {
            Response::error('Mata pelajaran tidak ditemukan.', [], 404); return;
        }

        $body   = $this->request->body();
        $update = [];

        if (!empty($body['nama_mapel'])) $update['nama_mapel'] = trim($body['nama_mapel']);
        if (in_array($body['kelompok'] ?? '', ['umum', 'kejuruan', 'muatan_lokal'], true)) {
            $update['kelompok'] = $body['kelompok'];
        }
        if (in_array($body['tingkatan'] ?? '', ['X', 'XI', 'XII', 'semua'], true)) {
            $update['tingkatan'] = $body['tingkatan'];
        }
        if (array_key_exists('jurusan_id', $body)) {
            $update['jurusan_id'] = !empty($body['jurusan_id']) ? (int) $body['jurusan_id'] : null;
        }
        if (isset($body['kkm'])) {
            $kkm = (int) $body['kkm'];
            if ($kkm >= 0 && $kkm <= 100) $update['kkm'] = $kkm;
        }
        if (in_array($body['status'] ?? '', ['aktif', 'nonaktif'], true)) {
            $update['status'] = $body['status'];
        }

        if (!empty($update)) {
            DB::table('mata_pelajaran')->where('mapel_id', $id)->update($update);
        }
        Response::success('Mata pelajaran berhasil diperbarui.');
    }

    private function delete(int $id): void
    {
        if (!DB::table('mata_pelajaran')->where('mapel_id', $id)->exists()) {
            Response::error('Mata pelajaran tidak ditemukan.', [], 404); return;
        }

        $nilaiCount = DB::table('nilai_akademik')->where('mapel_id', $id)->count();
        if ($nilaiCount > 0) {
            Response::error("Mata pelajaran masih memiliki {$nilaiCount} data nilai terkait.", [], 409); return;
        }

        DB::table('mata_pelajaran')->where('mapel_id', $id)->update(['status' => 'nonaktif']);
        Response::success('Mata pelajaran berhasil dinonaktifkan.');
    }
}
