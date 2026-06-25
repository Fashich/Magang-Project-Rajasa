<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * NilaiController
 *
 * GET    /api/nilai              — daftar nilai (filter siswa_id/rombel_id/mapel_id/semester)
 * POST   /api/nilai              — input nilai baru (guru/admin)
 * PATCH  /api/nilai/{id}         — update nilai (guru/admin)
 * DELETE /api/nilai/{id}         — hapus nilai (admin only)
 *
 * GET    /api/nilai/mapel        — daftar mata pelajaran aktif
 *
 * @author feature/analitik-prestasi
 */
final class NilaiController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(?int $id = null): void
    {
        $user   = $this->auth->user();
        $type   = $user->user_type;
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $path   = $_SERVER['PATH_INFO']      ?? '';

        // Route ke sub-handler
        if (str_ends_with($path, '/mapel') || isset($_GET['_mapel'])) {
            $this->getMapel();
            return;
        }

        match ($method) {
            'GET'    => $this->handleGet($user, $type),
            'POST'   => $this->handleCreate($user, $type),
            'PATCH'  => $this->handleUpdate($user, $type, $id),
            'DELETE' => $this->handleDelete($user, $type, $id),
            default  => Response::error('Method tidak didukung.', [], 405),
        };
    }

    // ── GET /api/nilai ────────────────────────────────────────────────────────

    private function handleGet(object $user, string $type): void
    {
        $page    = max(1, (int) ($_GET['page']     ?? 1));
        $perPage = min(100, max(1, (int) ($_GET['per_page'] ?? 30)));

        $query = DB::table('nilai_akademik AS na')
            ->join('siswa AS s',         's.siswa_id',         '=', 'na.siswa_id')
            ->join('mata_pelajaran AS mp','mp.mapel_id',        '=', 'na.mapel_id')
            ->join('tahun_ajaran AS ta',  'ta.tahun_ajaran_id', '=', 'na.tahun_ajaran_id')
            ->leftJoin('rombel AS r',     'r.rombel_id',        '=', 'na.rombel_id')
            ->selectRaw("
                na.nilai_id,
                na.siswa_id,
                na.mapel_id,
                na.tahun_ajaran_id,
                na.semester,
                na.rombel_id,
                na.nilai_harian,
                na.nilai_uts,
                na.nilai_uas,
                na.nilai_akhir,
                na.predikat,
                na.catatan,
                na.created_at,
                na.updated_at,
                s.nama_lengkap   AS nama_siswa,
                s.nis,
                mp.kode_mapel,
                mp.nama_mapel,
                mp.kkm,
                ta.nama_tahun_ajaran,
                r.label_rombel
            ");

        // Role-based filter
        if ($type === 'siswa') {
            $query->where('na.siswa_id', (int) $user->siswa_id);
        } elseif (in_array($type, ['guru'], true) && !empty($_GET['guru_filter'])) {
            // Guru hanya lihat nilai siswa di rombel yang dia ajar
            $guruId = (int) $user->guru_id;
            $rombelIds = DB::table('rombel_wali_kelas')
                ->where('guru_id', $guruId)
                ->pluck('rombel_id')
                ->toArray();
            if (!empty($rombelIds)) {
                $query->whereIn('na.rombel_id', $rombelIds);
            }
        } elseif (!in_array($type, ['guru', 'admin'], true)) {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        // Filter opsional
        if (!empty($_GET['siswa_id']))       $query->where('na.siswa_id',        (int) $_GET['siswa_id']);
        if (!empty($_GET['rombel_id']))       $query->where('na.rombel_id',        (int) $_GET['rombel_id']);
        if (!empty($_GET['mapel_id']))        $query->where('na.mapel_id',         (int) $_GET['mapel_id']);
        if (!empty($_GET['tahun_ajaran_id'])) $query->where('na.tahun_ajaran_id',  (int) $_GET['tahun_ajaran_id']);
        if (!empty($_GET['semester']))        $query->where('na.semester',          $_GET['semester']);

        $total = (clone $query)->count();
        $rows  = $query->orderBy('s.nama_lengkap')
                       ->orderBy('mp.kode_mapel')
                       ->offset(($page - 1) * $perPage)
                       ->limit($perPage)
                       ->get();

        $items = $rows->map(fn ($r) => $this->formatNilai($r))->values()->all();

        Response::success('Daftar nilai.', [
            'items' => $items,
            'meta'  => [
                'total'    => $total,
                'page'     => $page,
                'per_page' => $perPage,
                'pages'    => $perPage > 0 ? (int) ceil($total / $perPage) : 1,
            ],
        ]);
    }

    // ── POST /api/nilai ───────────────────────────────────────────────────────

    private function handleCreate(object $user, string $type): void
    {
        if (!in_array($type, ['guru', 'admin'], true)) {
            Response::error('Hanya guru/admin yang dapat menginput nilai.', [], 403);
            return;
        }

        $body   = $this->request->body();
        $errors = [];

        $siswaId      = (int) ($body['siswa_id']        ?? 0);
        $mapelId      = (int) ($body['mapel_id']        ?? 0);
        $tahunAjaranId= (int) ($body['tahun_ajaran_id'] ?? 0);
        $semester     = trim($body['semester']           ?? 'ganjil');
        $rombelId     = !empty($body['rombel_id']) ? (int) $body['rombel_id'] : null;

        if (!$siswaId)       $errors['siswa_id']        = 'Wajib diisi.';
        if (!$mapelId)       $errors['mapel_id']        = 'Wajib diisi.';
        if (!$tahunAjaranId) $errors['tahun_ajaran_id'] = 'Wajib diisi.';
        if (!in_array($semester, ['ganjil','genap','pendek'], true)) {
            $errors['semester'] = 'Harus ganjil/genap/pendek.';
        }

        if (!empty($errors)) { Response::error('Data tidak valid.', $errors, 422); return; }

        // Cek duplikat
        $exists = DB::table('nilai_akademik')
            ->where('siswa_id', $siswaId)
            ->where('mapel_id', $mapelId)
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('semester', $semester)
            ->exists();

        if ($exists) {
            Response::error('Nilai untuk kombinasi ini sudah ada. Gunakan PATCH untuk memperbarui.', [], 409);
            return;
        }

        [$nilaiAkhir, $predikat] = $this->hitungNilaiAkhir($body, $mapelId);

        $now = Carbon::now()->toDateTimeString();
        $id  = DB::table('nilai_akademik')->insertGetId([
            'siswa_id'        => $siswaId,
            'mapel_id'        => $mapelId,
            'tahun_ajaran_id' => $tahunAjaranId,
            'semester'        => $semester,
            'rombel_id'       => $rombelId,
            'nilai_harian'    => !empty($body['nilai_harian'])  ? (float) $body['nilai_harian']  : null,
            'nilai_uts'       => !empty($body['nilai_uts'])     ? (float) $body['nilai_uts']     : null,
            'nilai_uas'       => !empty($body['nilai_uas'])     ? (float) $body['nilai_uas']     : null,
            'nilai_akhir'     => $nilaiAkhir,
            'predikat'        => $predikat,
            'input_by'        => (int) $user->user_id,
            'catatan'         => trim($body['catatan'] ?? '') ?: null,
            'created_at'      => $now,
            'updated_at'      => $now,
        ]);

        $result = $this->fetchNilai($id);
        Response::success('Nilai berhasil disimpan.', ['nilai' => $result], 201);
    }

    // ── PATCH /api/nilai/{id} ─────────────────────────────────────────────────

    private function handleUpdate(object $user, string $type, ?int $id): void
    {
        if (!$id) { Response::error('ID nilai diperlukan.', [], 400); return; }

        if (!in_array($type, ['guru', 'admin'], true)) {
            Response::error('Akses ditolak.', [], 403); return;
        }

        $existing = DB::table('nilai_akademik')->where('nilai_id', $id)->first();
        if (!$existing) { Response::error('Nilai tidak ditemukan.', [], 404); return; }

        $body = $this->request->body();
        [$nilaiAkhir, $predikat] = $this->hitungNilaiAkhir($body, (int) $existing->mapel_id, $existing);

        $update = ['updated_at' => Carbon::now()->toDateTimeString()];

        if (isset($body['nilai_harian'])) $update['nilai_harian'] = $body['nilai_harian'] !== '' ? (float)$body['nilai_harian'] : null;
        if (isset($body['nilai_uts']))    $update['nilai_uts']    = $body['nilai_uts']    !== '' ? (float)$body['nilai_uts']    : null;
        if (isset($body['nilai_uas']))    $update['nilai_uas']    = $body['nilai_uas']    !== '' ? (float)$body['nilai_uas']    : null;
        if (isset($body['catatan']))      $update['catatan']      = trim($body['catatan']) ?: null;

        $update['nilai_akhir'] = $nilaiAkhir;
        $update['predikat']    = $predikat;

        DB::table('nilai_akademik')->where('nilai_id', $id)->update($update);

        $result = $this->fetchNilai($id);
        Response::success('Nilai berhasil diperbarui.', ['nilai' => $result]);
    }

    // ── DELETE /api/nilai/{id} ────────────────────────────────────────────────

    private function handleDelete(object $user, string $type, ?int $id): void
    {
        if (!$id) { Response::error('ID nilai diperlukan.', [], 400); return; }
        if (!in_array($type, ['admin'], true)) {
            Response::error('Hanya admin yang dapat menghapus nilai.', [], 403); return;
        }
        $exists = DB::table('nilai_akademik')->where('nilai_id', $id)->exists();
        if (!$exists) { Response::error('Nilai tidak ditemukan.', [], 404); return; }
        DB::table('nilai_akademik')->where('nilai_id', $id)->delete();
        Response::success('Nilai berhasil dihapus.', []);
    }

    // ── GET /api/nilai/mapel ──────────────────────────────────────────────────

    private function getMapel(): void
    {
        $rows = DB::table('mata_pelajaran AS mp')
            ->leftJoin('jurusan AS j', 'j.jurusan_id', '=', 'mp.jurusan_id')
            ->where('mp.status', 'aktif')
            ->selectRaw("mp.*, j.nama_jurusan")
            ->orderBy('mp.kelompok')
            ->orderBy('mp.nama_mapel')
            ->get();

        Response::success('Daftar mata pelajaran.', [
            'mapel' => $rows->map(fn ($r) => [
                'mapel_id'   => (int) $r->mapel_id,
                'kode_mapel' => $r->kode_mapel,
                'nama_mapel' => $r->nama_mapel,
                'kelompok'   => $r->kelompok,
                'tingkatan'  => $r->tingkatan,
                'kkm'        => (int) $r->kkm,
                'jurusan'    => $r->nama_jurusan ?? 'Semua Jurusan',
            ])->values()->all(),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function hitungNilaiAkhir(array $body, int $mapelId, ?object $existing = null): array
    {
        $harian = isset($body['nilai_harian']) && $body['nilai_harian'] !== ''
            ? (float) $body['nilai_harian']
            : ($existing?->nilai_harian !== null ? (float) $existing->nilai_harian : null);

        $uts = isset($body['nilai_uts']) && $body['nilai_uts'] !== ''
            ? (float) $body['nilai_uts']
            : ($existing?->nilai_uts !== null ? (float) $existing->nilai_uts : null);

        $uas = isset($body['nilai_uas']) && $body['nilai_uas'] !== ''
            ? (float) $body['nilai_uas']
            : ($existing?->nilai_uas !== null ? (float) $existing->nilai_uas : null);

        // Bobot: harian 40%, UTS 30%, UAS 30%
        $filled = array_filter([$harian, $uts, $uas], fn($v) => $v !== null);
        if (empty($filled)) return [null, null];

        if ($harian !== null && $uts !== null && $uas !== null) {
            $akhir = round(($harian * 0.4) + ($uts * 0.3) + ($uas * 0.3), 2);
        } else {
            $akhir = round(array_sum($filled) / count($filled), 2);
        }

        $mapel   = DB::table('mata_pelajaran')->where('mapel_id', $mapelId)->first();
        $kkm     = $mapel ? (int) $mapel->kkm : 75;
        $predikat = match (true) {
            $akhir >= 90             => 'A',
            $akhir >= 80             => 'B',
            $akhir >= $kkm           => 'C',
            $akhir >= ($kkm - 10)    => 'D',
            default                  => 'E',
        };

        return [$akhir, $predikat];
    }

    private function fetchNilai(int $id): ?array
    {
        $r = DB::table('nilai_akademik AS na')
            ->join('siswa AS s',          's.siswa_id',         '=', 'na.siswa_id')
            ->join('mata_pelajaran AS mp', 'mp.mapel_id',        '=', 'na.mapel_id')
            ->join('tahun_ajaran AS ta',   'ta.tahun_ajaran_id', '=', 'na.tahun_ajaran_id')
            ->leftJoin('rombel AS r',      'r.rombel_id',        '=', 'na.rombel_id')
            ->where('na.nilai_id', $id)
            ->selectRaw("na.*, s.nama_lengkap AS nama_siswa, s.nis,
                mp.kode_mapel, mp.nama_mapel, mp.kkm,
                ta.nama_tahun_ajaran, r.label_rombel")
            ->first();
        return $r ? $this->formatNilai($r) : null;
    }

    private function formatNilai(object $r): array
    {
        return [
            'nilai_id'          => (int)   $r->nilai_id,
            'siswa_id'          => (int)   $r->siswa_id,
            'mapel_id'          => (int)   $r->mapel_id,
            'tahun_ajaran_id'   => (int)   $r->tahun_ajaran_id,
            'semester'          =>         $r->semester,
            'rombel_id'         => $r->rombel_id ? (int) $r->rombel_id : null,
            'nilai_harian'      => $r->nilai_harian  !== null ? (float) $r->nilai_harian  : null,
            'nilai_uts'         => $r->nilai_uts     !== null ? (float) $r->nilai_uts     : null,
            'nilai_uas'         => $r->nilai_uas     !== null ? (float) $r->nilai_uas     : null,
            'nilai_akhir'       => $r->nilai_akhir   !== null ? (float) $r->nilai_akhir   : null,
            'predikat'          =>         $r->predikat,
            'catatan'           =>         $r->catatan ?? '',
            'created_at'        =>         $r->created_at,
            'updated_at'        =>         $r->updated_at,
            'nama_siswa'        =>         $r->nama_siswa  ?? '',
            'nis'               =>         $r->nis         ?? '',
            'kode_mapel'        =>         $r->kode_mapel  ?? '',
            'nama_mapel'        =>         $r->nama_mapel  ?? '',
            'kkm'               => (int)  ($r->kkm ?? 75),
            'nama_tahun_ajaran' =>         $r->nama_tahun_ajaran ?? '',
            'label_rombel'      =>         $r->label_rombel ?? '',
        ];
    }
}
