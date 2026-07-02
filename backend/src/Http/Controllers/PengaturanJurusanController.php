<?php
declare(strict_types=1);
namespace Rajasa\PresensiSiswa\Http\Controllers;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * PengaturanJurusanController
 * POST   /api/admin/pengaturan/jurusan        — tambah
 * PATCH  /api/admin/pengaturan/jurusan/{id}   — update
 * DELETE /api/admin/pengaturan/jurusan/{id}   — nonaktifkan
 */
final class PengaturanJurusanController
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
        $body = $this->request->body();
        $kode = strtoupper(trim($body['kode_jurusan'] ?? ''));
        $nama = trim($body['nama_jurusan'] ?? '');

        if (!$kode || !$nama) { Response::error('Kode dan nama jurusan wajib diisi.', [], 422); return; }
        if (DB::table('jurusan')->where('kode_jurusan', $kode)->exists()) {
            Response::error('Kode jurusan sudah digunakan.', [], 409); return;
        }

        $id = DB::table('jurusan')->insertGetId([
            'kode_jurusan'      => $kode,
            'nama_jurusan'      => $nama,
            'ketua_jurusan'     => trim($body['ketua_jurusan']     ?? '') ?: null,
            'deskripsi_jurusan' => trim($body['deskripsi_jurusan'] ?? '') ?: null,
            'status'            => 'aktif',
        ]);
        Response::success('Jurusan berhasil ditambahkan.', ['jurusan_id' => $id], 201);
    }

    private function update(int $id): void
    {
        if (!DB::table('jurusan')->where('jurusan_id', $id)->exists()) {
            Response::error('Jurusan tidak ditemukan.', [], 404); return;
        }

        $body   = $this->request->body();
        $update = [];
        if (!empty($body['nama_jurusan']))   $update['nama_jurusan']      = trim($body['nama_jurusan']);
        if (array_key_exists('ketua_jurusan',     $body)) $update['ketua_jurusan']     = trim($body['ketua_jurusan'])     ?: null;
        if (array_key_exists('deskripsi_jurusan', $body)) $update['deskripsi_jurusan'] = trim($body['deskripsi_jurusan']) ?: null;
        if (in_array($body['status'] ?? '', ['aktif','nonaktif'])) $update['status'] = $body['status'];

        if (!empty($update)) {
            DB::table('jurusan')->where('jurusan_id', $id)->update($update);
        }
        Response::success('Jurusan berhasil diperbarui.');
    }

    private function delete(int $id): void
    {
        if (!DB::table('jurusan')->where('jurusan_id', $id)->exists()) {
            Response::error('Jurusan tidak ditemukan.', [], 404); return;
        }

        $rombelCount = DB::table('rombel')->where('jurusan_id', $id)->where('status', 'aktif')->count();
        if ($rombelCount > 0) {
            Response::error("Jurusan masih digunakan oleh {$rombelCount} rombel aktif.", [], 409); return;
        }

        DB::table('jurusan')->where('jurusan_id', $id)->update(['status' => 'nonaktif']);
        Response::success('Jurusan berhasil dinonaktifkan.');
    }
}
