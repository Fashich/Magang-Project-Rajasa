<?php
declare(strict_types=1);
namespace Rajasa\PresensiSiswa\Http\Controllers;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * PengaturanTahunAjaranController
 * POST   /api/admin/pengaturan/tahun-ajaran        — tambah
 * PATCH  /api/admin/pengaturan/tahun-ajaran/{id}   — update / set aktif
 */
final class PengaturanTahunAjaranController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(int $id = 0): void
    {
        $user = $this->auth->user();
        if ($user->user_type !== 'admin') { Response::error('Akses ditolak.', [], 403); return; }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'POST') {
            $this->create();
        } else {
            $this->update($id);
        }
    }

    private function create(): void
    {
        $body = $this->request->body();
        $nama = trim($body['nama_tahun_ajaran'] ?? '');

        if (!preg_match('/^\d{4}\/\d{4}$/', $nama)) {
            Response::error('Format tahun ajaran tidak valid. Contoh: 2026/2027', [], 422); return;
        }
        if (DB::table('tahun_ajaran')->where('nama_tahun_ajaran', $nama)->exists()) {
            Response::error('Tahun ajaran sudah ada.', [], 409); return;
        }

        $id = DB::table('tahun_ajaran')->insertGetId([
            'nama_tahun_ajaran' => $nama,
            'semester_aktif'    => in_array($body['semester_aktif'] ?? '', ['ganjil','genap','pendek'])
                ? $body['semester_aktif'] : 'ganjil',
            'tanggal_mulai'     => $body['tanggal_mulai']   ?? null,
            'tanggal_selesai'   => $body['tanggal_selesai'] ?? null,
            'is_aktif'          => 0,
        ]);
        Response::success('Tahun ajaran berhasil ditambahkan.', ['tahun_ajaran_id' => $id], 201);
    }

    private function update(int $id): void
    {
        if (!DB::table('tahun_ajaran')->where('tahun_ajaran_id', $id)->exists()) {
            Response::error('Tahun ajaran tidak ditemukan.', [], 404); return;
        }

        $body = $this->request->body();

        if (!empty($body['is_aktif'])) {
            DB::table('tahun_ajaran')->update(['is_aktif' => 0]);
        }

        $update = [];
        if (in_array($body['semester_aktif'] ?? '', ['ganjil','genap','pendek'])) {
            $update['semester_aktif'] = $body['semester_aktif'];
        }
        if (isset($body['tanggal_mulai']))   $update['tanggal_mulai']   = $body['tanggal_mulai'];
        if (isset($body['tanggal_selesai'])) $update['tanggal_selesai'] = $body['tanggal_selesai'];
        if (isset($body['is_aktif']))        $update['is_aktif']        = (int)(bool)$body['is_aktif'];

        if (!empty($update)) {
            DB::table('tahun_ajaran')->where('tahun_ajaran_id', $id)->update($update);
        }
        Response::success('Tahun ajaran berhasil diperbarui.');
    }
}
