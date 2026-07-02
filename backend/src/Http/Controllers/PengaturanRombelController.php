<?php
declare(strict_types=1);
namespace Rajasa\PresensiSiswa\Http\Controllers;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * PengaturanRombelController
 * POST   /api/admin/pengaturan/rombel        — tambah
 * PATCH  /api/admin/pengaturan/rombel/{id}   — update
 * DELETE /api/admin/pengaturan/rombel/{id}   — nonaktifkan
 */
final class PengaturanRombelController
{
    private const TINGKAT_ANGKA_MAP = ['X' => 10, 'XI' => 11, 'XII' => 12, 'XIII' => 13];

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
        $body           = $this->request->body();
        $tahunAjaranId  = (int) ($body['tahun_ajaran_id'] ?? 0);
        $tingkatan      = strtoupper(trim($body['tingkatan'] ?? ''));
        $jurusanId      = (int) ($body['jurusan_id'] ?? 0);
        $nomorRombel    = (int) ($body['nomor_rombel'] ?? 1);

        if (!$tahunAjaranId)  { Response::error('Tahun ajaran wajib dipilih.', [], 422); return; }
        if (!isset(self::TINGKAT_ANGKA_MAP[$tingkatan])) {
            Response::error('Tingkatan tidak valid. Gunakan X, XI, XII, atau XIII.', [], 422); return;
        }
        if (!$jurusanId) { Response::error('Jurusan wajib dipilih.', [], 422); return; }
        if ($nomorRombel < 1) { Response::error('Nomor rombel minimal 1.', [], 422); return; }

        if (!DB::table('tahun_ajaran')->where('tahun_ajaran_id', $tahunAjaranId)->exists()) {
            Response::error('Tahun ajaran tidak ditemukan.', [], 404); return;
        }
        $jurusan = DB::table('jurusan')->where('jurusan_id', $jurusanId)->first();
        if (!$jurusan) { Response::error('Jurusan tidak ditemukan.', [], 404); return; }

        $duplikat = DB::table('rombel')
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('tingkatan', $tingkatan)
            ->where('jurusan_id', $jurusanId)
            ->where('nomor_rombel', $nomorRombel)
            ->exists();
        if ($duplikat) {
            Response::error('Rombel dengan kombinasi tingkatan, jurusan, dan nomor ini sudah ada.', [], 409); return;
        }

        // Auto-generate label kalau tidak diisi manual, contoh: "X TKJ 1"
        $labelManual = trim($body['label_rombel'] ?? '');
        $label       = $labelManual ?: "{$tingkatan} {$jurusan->kode_jurusan} {$nomorRombel}";

        $id = DB::table('rombel')->insertGetId([
            'tahun_ajaran_id'          => $tahunAjaranId,
            'tingkatan'                => $tingkatan,
            'tingkat_angka'            => self::TINGKAT_ANGKA_MAP[$tingkatan],
            'jurusan_id'               => $jurusanId,
            'nomor_rombel'             => $nomorRombel,
            'is_nomor_rombel_inferred' => 0,
            'label_rombel'             => $label,
            'label_rombel_raw'         => $label,
            'display_mode'             => 'dengan_nomor',
            'status'                   => 'aktif',
        ]);
        Response::success('Rombel berhasil ditambahkan.', ['rombel_id' => $id, 'label_rombel' => $label], 201);
    }

    private function update(int $id): void
    {
        $rombel = DB::table('rombel')->where('rombel_id', $id)->first();
        if (!$rombel) { Response::error('Rombel tidak ditemukan.', [], 404); return; }

        $body   = $this->request->body();
        $update = [];

        if (!empty($body['label_rombel'])) {
            $update['label_rombel']     = trim($body['label_rombel']);
            $update['label_rombel_raw'] = trim($body['label_rombel']);
        }
        if (isset($body['nomor_rombel']) && (int) $body['nomor_rombel'] >= 1) {
            $update['nomor_rombel'] = (int) $body['nomor_rombel'];
        }
        if (in_array($body['status'] ?? '', ['aktif', 'nonaktif'], true)) {
            $update['status'] = $body['status'];
        }

        if (!empty($update)) {
            DB::table('rombel')->where('rombel_id', $id)->update($update);
        }
        Response::success('Rombel berhasil diperbarui.');
    }

    private function delete(int $id): void
    {
        if (!DB::table('rombel')->where('rombel_id', $id)->exists()) {
            Response::error('Rombel tidak ditemukan.', [], 404); return;
        }

        $siswaCount = DB::table('siswa')->where('rombel_id_aktif', $id)->where('status', 'aktif')->count();
        if ($siswaCount > 0) {
            Response::error("Rombel masih memiliki {$siswaCount} siswa aktif.", [], 409); return;
        }

        DB::table('rombel')->where('rombel_id', $id)->update(['status' => 'nonaktif']);
        Response::success('Rombel berhasil dinonaktifkan.');
    }
}
