<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * LogbookPenilaianController
 *
 * GET  /api/logbook/penilaian          — ambil penilaian (siswa: milik sendiri, guru: semua yg dia nilai)
 * POST /api/logbook/penilaian          — buat penilaian baru (guru only)
 * PATCH /api/logbook/penilaian/{id}    — update penilaian (guru only, milik sendiri)
 *
 * Body POST/PATCH:
 *   siswa_id              int     REQUIRED (POST only)
 *   nilai_kedisiplinan    int     0-100
 *   nilai_keterampilan    int     0-100
 *   nilai_sikap           int     0-100
 *   nilai_laporan         int     0-100
 *   catatan_akhir         string  optional
 */
final class LogbookPenilaianController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(?int $id = null): void
    {
        $user   = $this->auth->user();
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        match (true) {
            $method === 'GET'   => $this->handleGet($user),
            $method === 'POST'  => $this->handleCreate($user),
            $method === 'PATCH' => $this->handleUpdate($user, $id),
            default             => Response::error('Method tidak didukung.', [], 405),
        };
    }

    // ── GET ───────────────────────────────────────────────────────────────────

    private function handleGet(object $user): void
    {
        $type = $user->user_type;

        $query = DB::table('logbook_penilaian AS lp')
            ->join('siswa AS s',      's.siswa_id',  '=', 'lp.siswa_id')
            ->join('guru_staff AS g', 'g.guru_id',   '=', 'lp.guru_id')
            ->selectRaw("
                lp.*,
                s.nama_lengkap AS nama_siswa,
                s.nis,
                g.nama_lengkap AS nama_guru
            ");

        if ($type === 'siswa') {
            $query->where('lp.siswa_id', (int) $user->siswa_id);
        } elseif (in_array($type, ['guru'], true)) {
            $query->where('lp.guru_id', (int) $user->guru_id);
        } elseif (!in_array($type, ['admin'], true)) {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        if (!empty($_GET['siswa_id'])) {
            $query->where('lp.siswa_id', (int) $_GET['siswa_id']);
        }

        $rows = $query->orderByDesc('lp.dinilai_at')->get();
        $items = $rows->map(fn ($r) => $this->formatPenilaian($r))->values()->all();

        Response::success('Daftar penilaian.', ['items' => $items]);
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    private function handleCreate(object $user): void
    {
        if (!in_array($user->user_type, ['guru', 'admin'], true)) {
            Response::error('Hanya guru/admin yang dapat memberi penilaian.', [], 403);
            return;
        }

        $body    = $this->request->body();
        $siswaId = (int) ($body['siswa_id'] ?? 0);

        if (!$siswaId) {
            Response::error('siswa_id wajib diisi.', ['siswa_id' => 'Wajib diisi.'], 422);
            return;
        }

        // Cek siswa ada
        $siswa = DB::table('siswa')->where('siswa_id', $siswaId)->where('status', 'aktif')->first();
        if (!$siswa) {
            Response::error('Siswa tidak ditemukan.', [], 404);
            return;
        }

        $guruId = (int) $user->guru_id;

        // Cek sudah ada penilaian dari guru ini untuk siswa ini
        $exists = DB::table('logbook_penilaian')
            ->where('siswa_id', $siswaId)
            ->where('guru_id', $guruId)
            ->exists();

        if ($exists) {
            Response::error('Penilaian untuk siswa ini sudah ada. Gunakan PATCH untuk memperbarui.', [], 409);
            return;
        }

        [$nilaiAkhir, $predikat, $komponen] = $this->hitungNilai($body);

        $now = Carbon::now()->toDateTimeString();
        $insertId = DB::table('logbook_penilaian')->insertGetId([
            'siswa_id'            => $siswaId,
            'guru_id'             => $guruId,
            'dinilai_by'          => (int) $user->user_id,
            'nilai_kedisiplinan'  => $komponen['kedisiplinan'],
            'nilai_keterampilan'  => $komponen['keterampilan'],
            'nilai_sikap'         => $komponen['sikap'],
            'nilai_laporan'       => $komponen['laporan'],
            'nilai_akhir'         => $nilaiAkhir,
            'predikat'            => $predikat,
            'catatan_akhir'       => trim($body['catatan_akhir'] ?? '') ?: null,
            'dinilai_at'          => $now,
            'created_at'          => $now,
            'updated_at'          => $now,
        ]);

        // Notifikasi ke siswa
        $siswaUser = DB::table('users')->where('siswa_id', $siswaId)->where('status', 'aktif')->first();
        if ($siswaUser) {
            DB::table('notifikasi_user')->insert([
                'user_id'       => (int) $siswaUser->user_id,
                'tipe'          => 'success',
                'judul'         => 'Penilaian Logbook Tersedia',
                'pesan'         => "Guru pembimbing telah memberikan penilaian akhir logbook PKL Anda. Nilai: {$nilaiAkhir} ({$predikat}).",
                'related_table' => 'logbook_penilaian',
                'related_id'    => $insertId,
                'popup_until'   => Carbon::now()->addHours(72)->toDateTimeString(),
                'is_read'       => 0,
                'created_at'    => $now,
            ]);
        }

        $result = DB::table('logbook_penilaian AS lp')
            ->join('siswa AS s',      's.siswa_id', '=', 'lp.siswa_id')
            ->join('guru_staff AS g', 'g.guru_id',  '=', 'lp.guru_id')
            ->selectRaw("lp.*, s.nama_lengkap AS nama_siswa, s.nis, g.nama_lengkap AS nama_guru")
            ->where('lp.penilaian_id', $insertId)->first();

        Response::success('Penilaian berhasil disimpan.', ['penilaian' => $this->formatPenilaian($result)], 201);
    }

    // ── PATCH ─────────────────────────────────────────────────────────────────

    private function handleUpdate(object $user, ?int $id): void
    {
        if (!$id) { Response::error('ID penilaian diperlukan.', [], 400); return; }

        if (!in_array($user->user_type, ['guru', 'admin'], true)) {
            Response::error('Akses ditolak.', [], 403); return;
        }

        $penilaian = DB::table('logbook_penilaian')->where('penilaian_id', $id)->first();
        if (!$penilaian) { Response::error('Penilaian tidak ditemukan.', [], 404); return; }

        // Guru hanya bisa edit penilaian miliknya
        if (in_array($user->user_type, ['guru'], true) &&
            (int) $penilaian->guru_id !== (int) $user->guru_id) {
            Response::error('Penilaian ini bukan milik Anda.', [], 403); return;
        }

        $body = $this->request->body();
        [$nilaiAkhir, $predikat, $komponen] = $this->hitungNilai($body, $penilaian);

        $now = Carbon::now()->toDateTimeString();
        DB::table('logbook_penilaian')->where('penilaian_id', $id)->update([
            'nilai_kedisiplinan' => $komponen['kedisiplinan'],
            'nilai_keterampilan' => $komponen['keterampilan'],
            'nilai_sikap'        => $komponen['sikap'],
            'nilai_laporan'      => $komponen['laporan'],
            'nilai_akhir'        => $nilaiAkhir,
            'predikat'           => $predikat,
            'catatan_akhir'      => isset($body['catatan_akhir'])
                                    ? (trim($body['catatan_akhir']) ?: null)
                                    : $penilaian->catatan_akhir,
            'dinilai_at'         => $now,
            'updated_at'         => $now,
        ]);

        $result = DB::table('logbook_penilaian AS lp')
            ->join('siswa AS s',      's.siswa_id', '=', 'lp.siswa_id')
            ->join('guru_staff AS g', 'g.guru_id',  '=', 'lp.guru_id')
            ->selectRaw("lp.*, s.nama_lengkap AS nama_siswa, s.nis, g.nama_lengkap AS nama_guru")
            ->where('lp.penilaian_id', $id)->first();

        Response::success('Penilaian berhasil diperbarui.', ['penilaian' => $this->formatPenilaian($result)]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Hitung nilai akhir dan predikat dari body request.
     * Existing values dipakai sebagai fallback jika field tidak dikirim.
     */
    private function hitungNilai(array $body, ?object $existing = null): array
    {
        $komponen = [
            'kedisiplinan' => $this->clampNilai($body['nilai_kedisiplinan'] ?? $existing?->nilai_kedisiplinan),
            'keterampilan' => $this->clampNilai($body['nilai_keterampilan'] ?? $existing?->nilai_keterampilan),
            'sikap'        => $this->clampNilai($body['nilai_sikap']        ?? $existing?->nilai_sikap),
            'laporan'      => $this->clampNilai($body['nilai_laporan']      ?? $existing?->nilai_laporan),
        ];

        $filled = array_filter($komponen, fn ($v) => $v !== null);
        $avg    = count($filled) > 0 ? array_sum($filled) / count($filled) : null;

        $nilaiAkhir = $avg !== null ? round($avg, 2) : null;
        $predikat   = match (true) {
            $nilaiAkhir === null    => null,
            $nilaiAkhir >= 90       => 'A',
            $nilaiAkhir >= 75       => 'B',
            $nilaiAkhir >= 60       => 'C',
            default                 => 'D',
        };

        return [$nilaiAkhir, $predikat, $komponen];
    }

    private function clampNilai(mixed $v): ?int
    {
        if ($v === null || $v === '') return null;
        return max(0, min(100, (int) $v));
    }

    private function formatPenilaian(object $r): array
    {
        return [
            'penilaian_id'        => (int)    $r->penilaian_id,
            'siswa_id'            => (int)    $r->siswa_id,
            'guru_id'             => (int)    $r->guru_id,
            'dinilai_by'          => (int)    $r->dinilai_by,
            'nilai_kedisiplinan'  => $r->nilai_kedisiplinan  !== null ? (int) $r->nilai_kedisiplinan  : null,
            'nilai_keterampilan'  => $r->nilai_keterampilan  !== null ? (int) $r->nilai_keterampilan  : null,
            'nilai_sikap'         => $r->nilai_sikap         !== null ? (int) $r->nilai_sikap         : null,
            'nilai_laporan'       => $r->nilai_laporan       !== null ? (int) $r->nilai_laporan       : null,
            'nilai_akhir'         => $r->nilai_akhir         !== null ? (float) $r->nilai_akhir       : null,
            'predikat'            =>           $r->predikat,
            'catatan_akhir'       =>           $r->catatan_akhir ?? '',
            'dinilai_at'          =>           $r->dinilai_at,
            'created_at'          =>           $r->created_at,
            'updated_at'          =>           $r->updated_at,
            'nama_siswa'          =>           $r->nama_siswa ?? '',
            'nis'                 =>           $r->nis ?? '',
            'nama_guru'           =>           $r->nama_guru ?? '',
        ];
    }
}
