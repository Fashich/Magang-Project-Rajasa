<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\RateLimitMiddleware;

/**
 * OrtuPortalController
 *
 * GET /api/portal-ortu/{token}
 *
 * Endpoint PUBLIK (tanpa login) untuk orang tua melihat data kehadiran
 * anaknya menggunakan token unik yang dikirim via link WhatsApp.
 *
 * Rate limited untuk mencegah brute-force token enumeration.
 */
final class OrtuPortalController
{
    public function __construct(
        private readonly RateLimitMiddleware $rateLimit,
    ) {}

    public function __invoke(string $token): void
    {
        // Rate limit: max 20 request per menit per IP (cegah brute force token)
        $this->rateLimit->check('portal-ortu', 20, 60);

        $token = trim($token);

        if (strlen($token) < 20) {
            Response::error('Token tidak valid.', [], 404);
            return;
        }

        $akses = DB::table('ortu_portal_token')
            ->where('token', $token)
            ->where('is_active', 1)
            ->first();

        if (!$akses) {
            Response::error('Link tidak valid atau sudah tidak aktif. Hubungi wali kelas untuk mendapatkan link terbaru.', [], 404);
            return;
        }

        $siswaId = (int) $akses->siswa_id;

        // Update statistik akses
        DB::table('ortu_portal_token')
            ->where('token_id', $akses->token_id)
            ->update([
                'last_accessed_at' => Carbon::now()->toDateTimeString(),
                'access_count'     => DB::raw('access_count + 1'),
            ]);

        // ── Data siswa ──────────────────────────────────────────────────────
        $siswa = DB::table('siswa AS s')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->leftJoin('jurusan AS j', 'j.jurusan_id', '=', 's.jurusan_id_aktif')
            ->where('s.siswa_id', $siswaId)
            ->selectRaw('s.siswa_id, s.nisn, s.nis, s.nama_lengkap, s.jenis_kelamin, r.label_rombel, j.nama_jurusan')
            ->first();

        if (!$siswa) {
            Response::error('Data siswa tidak ditemukan.', [], 404);
            return;
        }

        // ── Rekap kehadiran 30 hari terakhir ────────────────────────────────
        $dari   = Carbon::now()->subDays(29)->toDateString();
        $sampai = Carbon::now()->toDateString();

        $rekap = DB::table('presensi_jam_siswa')
            ->where('siswa_id', $siswaId)
            ->whereBetween('tanggal', [$dari, $sampai])
            ->selectRaw("
                COUNT(*) total,
                SUM(status = 'hadir')     hadir,
                SUM(status = 'terlambat') terlambat,
                SUM(status = 'alpha')     alpha,
                SUM(status = 'sakit')     sakit,
                SUM(status = 'izin')      izin
            ")
            ->first();

        $totalHari = (int) ($rekap->total ?? 0);
        $hadirTotal = (int) ($rekap->hadir ?? 0) + (int) ($rekap->terlambat ?? 0);
        $rate = $totalHari > 0 ? round(($hadirTotal / $totalHari) * 100, 1) : 0;

        // ── Riwayat 14 hari terakhir (detail harian) ────────────────────────
        $riwayat = DB::table('presensi_jam_siswa')
            ->where('siswa_id', $siswaId)
            ->where('tanggal', '>=', Carbon::now()->subDays(13)->toDateString())
            ->selectRaw('tanggal, status, scanned_at')
            ->orderBy('tanggal', 'desc')
            ->get()
            ->groupBy('tanggal')
            ->map(function ($group) {
                // Ambil status "terbaik" per hari
                $priority = ['hadir' => 4, 'terlambat' => 3, 'izin' => 2, 'sakit' => 2, 'alpha' => 0];
                $best = $group->sortByDesc(fn($r) => $priority[$r->status] ?? 0)->first();
                return [
                    'status'     => $best->status,
                    'scanned_at' => $best->scanned_at,
                ];
            })
            ->map(fn($v, $tanggal) => array_merge(['tanggal' => $tanggal], $v))
            ->values()
            ->sortByDesc('tanggal')
            ->values()
            ->all();

        // ── Riwayat e-izin ───────────────────────────────────────────────────
        $eizin = DB::table('e_izin')
            ->where('siswa_id', $siswaId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['e_izin_id', 'jenis_izin', 'tanggal_mulai', 'tanggal_selesai', 'keterangan', 'status'])
            ->map(fn($e) => (array) $e)
            ->values()
            ->all();

        Response::success('Data kehadiran ditemukan.', [
            'siswa' => [
                'nama_lengkap' => $siswa->nama_lengkap,
                'nisn'         => $siswa->nisn,
                'nis'          => $siswa->nis,
                'rombel'       => $siswa->label_rombel,
                'jurusan'      => $siswa->nama_jurusan,
            ],
            'ringkasan_30_hari' => [
                'total_hari' => $totalHari,
                'hadir'      => (int) ($rekap->hadir ?? 0),
                'terlambat'  => (int) ($rekap->terlambat ?? 0),
                'alpha'      => (int) ($rekap->alpha ?? 0),
                'sakit'      => (int) ($rekap->sakit ?? 0),
                'izin'       => (int) ($rekap->izin ?? 0),
                'tingkat_kehadiran' => $rate,
            ],
            'riwayat_14_hari' => $riwayat,
            'riwayat_izin'    => $eizin,
        ]);
    }
}
