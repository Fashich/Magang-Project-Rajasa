<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * AnalitikPrestasiController
 *
 * GET /api/analitik/prestasi
 *
 * Query params:
 *   jenis             korelasi|ringkasan_siswa|ranking_mapel|risiko
 *   tahun_ajaran_id   wajib atau default tahun aktif
 *   semester          ganjil|genap|pendek  (default: ganjil)
 *   rombel_id         opsional filter
 *   mapel_id          opsional filter (untuk korelasi per mapel)
 *
 * Role: admin, guru
 *
 * @author feature/analitik-prestasi
 */
final class AnalitikPrestasiController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        if (!in_array($user->user_type, ['admin', 'guru'], true)) {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        $jenis    = $_GET['jenis']    ?? 'korelasi';
        $semester = $_GET['semester'] ?? 'ganjil';

        if (!in_array($semester, ['ganjil', 'genap', 'pendek'], true)) {
            $semester = 'ganjil';
        }

        // Resolve tahun ajaran
        $tahunAjaranId = !empty($_GET['tahun_ajaran_id'])
            ? (int) $_GET['tahun_ajaran_id']
            : (int) (DB::table('tahun_ajaran')->where('is_aktif', 1)->value('tahun_ajaran_id') ?? 0);

        if (!$tahunAjaranId) {
            Response::error('Tahun ajaran aktif tidak ditemukan.', [], 422);
            return;
        }

        $rombelId = !empty($_GET['rombel_id']) ? (int) $_GET['rombel_id'] : null;
        $mapelId  = !empty($_GET['mapel_id'])  ? (int) $_GET['mapel_id']  : null;

        match ($jenis) {
            'ringkasan_siswa' => $this->ringkasanSiswa($tahunAjaranId, $semester, $rombelId),
            'ranking_mapel'   => $this->rankingMapel($tahunAjaranId, $semester, $rombelId),
            'risiko'          => $this->siswaRisiko($tahunAjaranId, $semester, $rombelId),
            default           => $this->korelasi($tahunAjaranId, $semester, $rombelId, $mapelId),
        };
    }

    // ── 1. Korelasi kehadiran vs nilai akhir ─────────────────────────────────
    // Scatter-plot data: setiap titik = 1 siswa
    // x = rate kehadiran (%), y = rata-rata nilai akhir semua mapel

    private function korelasi(int $tahunId, string $semester, ?int $rombelId, ?int $mapelId): void
    {
        // Ambil data kehadiran per siswa (periode semester ini)
        $ta = DB::table('tahun_ajaran')->where('tahun_ajaran_id', $tahunId)->first();
        $dari   = $ta?->tanggal_mulai ?? Carbon::now()->startOfYear()->toDateString();
        $sampai = $ta?->tanggal_selesai ?? Carbon::now()->toDateString();

        $kehadiranQ = DB::table('presensi_jam_siswa AS pjs')
            ->join('siswa AS s', 's.siswa_id', '=', 'pjs.siswa_id')
            ->whereBetween('pjs.tanggal', [$dari, $sampai])
            ->where('s.status', 'aktif')
            ->selectRaw("
                pjs.siswa_id,
                s.nama_lengkap,
                s.nis,
                pjs.rombel_id_snapshot AS rombel_id,
                COUNT(*) AS total_sesi,
                SUM(pjs.status IN ('hadir','terlambat')) AS hadir,
                SUM(pjs.status = 'alpha') AS alpha,
                SUM(pjs.status = 'terlambat') AS terlambat
            ")
            ->groupBy('pjs.siswa_id', 's.nama_lengkap', 's.nis', 'pjs.rombel_id_snapshot');

        if ($rombelId) {
            $kehadiranQ->where('pjs.rombel_id_snapshot', $rombelId);
        }

        $kehadiran = $kehadiranQ->get()->keyBy('siswa_id');

        // Ambil rata-rata nilai akhir per siswa
        $nilaiQ = DB::table('nilai_akademik AS na')
            ->where('na.tahun_ajaran_id', $tahunId)
            ->where('na.semester', $semester)
            ->whereNotNull('na.nilai_akhir')
            ->selectRaw("
                na.siswa_id,
                AVG(na.nilai_akhir) AS avg_nilai,
                COUNT(*) AS jumlah_mapel,
                SUM(na.nilai_akhir >= mp.kkm) AS lulus_mapel
            ")
            ->join('mata_pelajaran AS mp', 'mp.mapel_id', '=', 'na.mapel_id');

        if ($rombelId) $nilaiQ->where('na.rombel_id', $rombelId);
        if ($mapelId)  $nilaiQ->where('na.mapel_id', $mapelId);

        $nilaiQ->groupBy('na.siswa_id');
        $nilai = $nilaiQ->get()->keyBy('siswa_id');

        // Gabungkan
        $data = [];
        foreach ($nilai as $siswaId => $n) {
            $k = $kehadiran[$siswaId] ?? null;
            if (!$k) continue;

            $total = (int) $k->total_sesi;
            $rate  = $total > 0 ? round(((int)$k->hadir / $total) * 100, 1) : 0;

            $data[] = [
                'siswa_id'      => (int) $siswaId,
                'nama_siswa'    => $k->nama_lengkap,
                'nis'           => $k->nis,
                'rombel_id'     => $k->rombel_id ? (int) $k->rombel_id : null,
                'rate_hadir'    => $rate,
                'total_sesi'    => $total,
                'alpha'         => (int) $k->alpha,
                'avg_nilai'     => round((float) $n->avg_nilai, 1),
                'jumlah_mapel'  => (int) $n->jumlah_mapel,
                'lulus_mapel'   => (int) $n->lulus_mapel,
            ];
        }

        // Hitung koefisien korelasi Pearson (r)
        $r = $this->pearsonCorrelation(
            array_column($data, 'rate_hadir'),
            array_column($data, 'avg_nilai')
        );

        // Segmentasi kuadran
        $avgRate  = count($data) > 0 ? array_sum(array_column($data, 'rate_hadir'))  / count($data) : 0;
        $avgNilai = count($data) > 0 ? array_sum(array_column($data, 'avg_nilai'))   / count($data) : 0;

        foreach ($data as &$d) {
            $d['kuadran'] = match (true) {
                $d['rate_hadir'] >= $avgRate  && $d['avg_nilai'] >= $avgNilai => 'bintang',   // hadir tinggi, nilai tinggi
                $d['rate_hadir'] >= $avgRate  && $d['avg_nilai'] <  $avgNilai => 'perhatian', // hadir tinggi tapi nilai rendah
                $d['rate_hadir'] <  $avgRate  && $d['avg_nilai'] >= $avgNilai => 'potensi',   // nilai tinggi meski hadir rendah
                default                                                        => 'risiko',    // hadir rendah & nilai rendah
            };
        }

        Response::success('Korelasi kehadiran vs nilai.', [
            'jenis'        => 'korelasi',
            'data'         => $data,
            'meta' => [
                'total_siswa'     => count($data),
                'avg_rate_hadir'  => round($avgRate, 1),
                'avg_nilai'       => round($avgNilai, 1),
                'korelasi_r'      => round($r, 3),
                'keterangan_r'    => $this->interpretR($r),
                'kuadran' => [
                    'bintang'   => count(array_filter($data, fn($d) => $d['kuadran'] === 'bintang')),
                    'perhatian' => count(array_filter($data, fn($d) => $d['kuadran'] === 'perhatian')),
                    'potensi'   => count(array_filter($data, fn($d) => $d['kuadran'] === 'potensi')),
                    'risiko'    => count(array_filter($data, fn($d) => $d['kuadran'] === 'risiko')),
                ],
            ],
        ]);
    }

    // ── 2. Ringkasan per siswa (rapor ringkas) ───────────────────────────────

    private function ringkasanSiswa(int $tahunId, string $semester, ?int $rombelId): void
    {
        $query = DB::table('nilai_akademik AS na')
            ->join('siswa AS s',          's.siswa_id',         '=', 'na.siswa_id')
            ->join('mata_pelajaran AS mp', 'mp.mapel_id',        '=', 'na.mapel_id')
            ->leftJoin('rombel AS r',      'r.rombel_id',        '=', 'na.rombel_id')
            ->where('na.tahun_ajaran_id', $tahunId)
            ->where('na.semester', $semester)
            ->where('s.status', 'aktif')
            ->selectRaw("
                na.siswa_id,
                s.nama_lengkap,
                s.nis,
                r.label_rombel,
                COUNT(na.nilai_id)                    AS jumlah_mapel,
                AVG(na.nilai_akhir)                   AS avg_nilai,
                MIN(na.nilai_akhir)                   AS min_nilai,
                MAX(na.nilai_akhir)                   AS max_nilai,
                SUM(na.nilai_akhir IS NOT NULL AND na.nilai_akhir >= mp.kkm) AS mapel_lulus,
                SUM(na.nilai_akhir IS NOT NULL AND na.nilai_akhir <  mp.kkm) AS mapel_tidak_lulus,
                SUM(na.predikat = 'A') AS grade_a,
                SUM(na.predikat = 'B') AS grade_b,
                SUM(na.predikat = 'C') AS grade_c,
                SUM(na.predikat IN ('D','E')) AS grade_de
            ")
            ->groupBy('na.siswa_id', 's.nama_lengkap', 's.nis', 'r.label_rombel');

        if ($rombelId) $query->where('na.rombel_id', $rombelId);

        $rows = $query->get();

        $data = $rows->map(function ($r) {
            return [
                'siswa_id'         => (int) $r->siswa_id,
                'nama_siswa'       => $r->nama_lengkap,
                'nis'              => $r->nis,
                'label_rombel'     => $r->label_rombel ?? '—',
                'jumlah_mapel'     => (int)   $r->jumlah_mapel,
                'avg_nilai'        => round((float) ($r->avg_nilai ?? 0), 1),
                'min_nilai'        => $r->min_nilai !== null ? (float) $r->min_nilai : null,
                'max_nilai'        => $r->max_nilai !== null ? (float) $r->max_nilai : null,
                'mapel_lulus'      => (int)   $r->mapel_lulus,
                'mapel_tidak_lulus'=> (int)   $r->mapel_tidak_lulus,
                'grade_a'          => (int)   $r->grade_a,
                'grade_b'          => (int)   $r->grade_b,
                'grade_c'          => (int)   $r->grade_c,
                'grade_de'         => (int)   $r->grade_de,
            ];
        })
        ->sortByDesc('avg_nilai')
        ->values()
        ->all();

        Response::success('Ringkasan nilai per siswa.', [
            'jenis' => 'ringkasan_siswa',
            'data'  => $data,
            'meta'  => [
                'total_siswa' => count($data),
                'avg_global'  => count($data) > 0
                    ? round(array_sum(array_column($data, 'avg_nilai')) / count($data), 1)
                    : 0,
            ],
        ]);
    }

    // ── 3. Ranking mapel (rata-rata nilai per mapel) ─────────────────────────

    private function rankingMapel(int $tahunId, string $semester, ?int $rombelId): void
    {
        $query = DB::table('nilai_akademik AS na')
            ->join('mata_pelajaran AS mp', 'mp.mapel_id', '=', 'na.mapel_id')
            ->where('na.tahun_ajaran_id', $tahunId)
            ->where('na.semester', $semester)
            ->whereNotNull('na.nilai_akhir')
            ->selectRaw("
                na.mapel_id,
                mp.kode_mapel,
                mp.nama_mapel,
                mp.kelompok,
                mp.kkm,
                COUNT(na.nilai_id) AS jumlah_siswa,
                AVG(na.nilai_akhir) AS avg_nilai,
                MIN(na.nilai_akhir) AS min_nilai,
                MAX(na.nilai_akhir) AS max_nilai,
                SUM(na.nilai_akhir >= mp.kkm) AS lulus,
                SUM(na.nilai_akhir < mp.kkm)  AS tidak_lulus
            ")
            ->groupBy('na.mapel_id', 'mp.kode_mapel', 'mp.nama_mapel', 'mp.kelompok', 'mp.kkm');

        if ($rombelId) $query->where('na.rombel_id', $rombelId);

        $rows = $query->get();

        $data = $rows->map(function ($r) {
            $jml = (int) $r->jumlah_siswa;
            return [
                'mapel_id'     => (int)   $r->mapel_id,
                'kode_mapel'   =>         $r->kode_mapel,
                'nama_mapel'   =>         $r->nama_mapel,
                'kelompok'     =>         $r->kelompok,
                'kkm'          => (int)   $r->kkm,
                'jumlah_siswa' => $jml,
                'avg_nilai'    => round((float) ($r->avg_nilai ?? 0), 1),
                'min_nilai'    => $r->min_nilai !== null ? (float) $r->min_nilai : null,
                'max_nilai'    => $r->max_nilai !== null ? (float) $r->max_nilai : null,
                'lulus'        => (int)   $r->lulus,
                'tidak_lulus'  => (int)   $r->tidak_lulus,
                'pct_lulus'    => $jml > 0 ? round(((int)$r->lulus / $jml) * 100, 1) : 0,
            ];
        })
        ->sortByDesc('avg_nilai')
        ->values()
        ->all();

        Response::success('Ranking mata pelajaran.', [
            'jenis' => 'ranking_mapel',
            'data'  => $data,
        ]);
    }

    // ── 4. Siswa berisiko (alpha tinggi + nilai rendah) ──────────────────────

    private function siswaRisiko(int $tahunId, string $semester, ?int $rombelId): void
    {
        $ta = DB::table('tahun_ajaran')->where('tahun_ajaran_id', $tahunId)->first();
        $dari   = $ta?->tanggal_mulai ?? Carbon::now()->startOfYear()->toDateString();
        $sampai = $ta?->tanggal_selesai ?? Carbon::now()->toDateString();

        // Kehadiran
        $kehadiranQ = DB::table('presensi_jam_siswa AS pjs')
            ->join('siswa AS s', 's.siswa_id', '=', 'pjs.siswa_id')
            ->whereBetween('pjs.tanggal', [$dari, $sampai])
            ->where('s.status', 'aktif')
            ->selectRaw("
                pjs.siswa_id,
                s.nama_lengkap,
                s.nis,
                pjs.rombel_id_snapshot AS rombel_id,
                COUNT(*) AS total_sesi,
                SUM(pjs.status IN ('hadir','terlambat')) AS hadir,
                SUM(pjs.status = 'alpha') AS alpha
            ")
            ->groupBy('pjs.siswa_id', 's.nama_lengkap', 's.nis', 'pjs.rombel_id_snapshot');

        if ($rombelId) $kehadiranQ->where('pjs.rombel_id_snapshot', $rombelId);
        $kehadiran = $kehadiranQ->get()->keyBy('siswa_id');

        // Nilai
        $nilaiQ = DB::table('nilai_akademik AS na')
            ->where('tahun_ajaran_id', $tahunId)
            ->where('semester', $semester)
            ->whereNotNull('nilai_akhir')
            ->selectRaw("siswa_id, AVG(nilai_akhir) AS avg_nilai,
                SUM(predikat IN ('D','E')) AS mapel_merah")
            ->groupBy('siswa_id');

        if ($rombelId) $nilaiQ->where('rombel_id', $rombelId);
        $nilai = $nilaiQ->get()->keyBy('siswa_id');

        $data = [];
        foreach ($kehadiran as $siswaId => $k) {
            $total = (int) $k->total_sesi;
            $rate  = $total > 0 ? round(((int)$k->hadir / $total) * 100, 1) : 0;
            $n     = $nilai[$siswaId] ?? null;
            $avg   = $n ? round((float) $n->avg_nilai, 1) : null;

            // Threshold risiko: rate < 75% ATAU nilai < 70 ATAU ada mapel merah
            $isRisiko = $rate < 75 || ($avg !== null && $avg < 70) || ($n && (int)$n->mapel_merah > 0);

            if (!$isRisiko) continue;

            $levelRisiko = match (true) {
                $rate < 60 && ($avg !== null && $avg < 60)   => 'kritis',
                $rate < 70 || ($avg !== null && $avg < 65)   => 'tinggi',
                default                                       => 'sedang',
            };

            $data[] = [
                'siswa_id'     => (int)  $siswaId,
                'nama_siswa'   =>        $k->nama_lengkap,
                'nis'          =>        $k->nis,
                'rombel_id'    => $k->rombel_id ? (int) $k->rombel_id : null,
                'rate_hadir'   => $rate,
                'alpha'        => (int)  $k->alpha,
                'avg_nilai'    => $avg,
                'mapel_merah'  => $n ? (int) $n->mapel_merah : 0,
                'level_risiko' => $levelRisiko,
            ];
        }

        usort($data, fn ($a, $b) => [
            'kritis' => 0, 'tinggi' => 1, 'sedang' => 2
        ][$a['level_risiko']] <=> [
            'kritis' => 0, 'tinggi' => 1, 'sedang' => 2
        ][$b['level_risiko']]);

        Response::success('Siswa berisiko.', [
            'jenis' => 'risiko',
            'data'  => $data,
            'meta'  => [
                'total'  => count($data),
                'kritis' => count(array_filter($data, fn($d) => $d['level_risiko'] === 'kritis')),
                'tinggi' => count(array_filter($data, fn($d) => $d['level_risiko'] === 'tinggi')),
                'sedang' => count(array_filter($data, fn($d) => $d['level_risiko'] === 'sedang')),
            ],
        ]);
    }

    // ── Pearson Correlation ───────────────────────────────────────────────────

    private function pearsonCorrelation(array $x, array $y): float
    {
        $n = count($x);
        if ($n < 2) return 0;

        $sumX  = array_sum($x);
        $sumY  = array_sum($y);
        $sumXY = 0;
        $sumX2 = 0;
        $sumY2 = 0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += $x[$i] * $y[$i];
            $sumX2 += $x[$i] ** 2;
            $sumY2 += $y[$i] ** 2;
        }

        $num = ($n * $sumXY) - ($sumX * $sumY);
        $den = sqrt((($n * $sumX2) - ($sumX ** 2)) * (($n * $sumY2) - ($sumY ** 2)));

        return $den == 0 ? 0 : round($num / $den, 4);
    }

    private function interpretR(float $r): string
    {
        $abs = abs($r);
        $dir = $r >= 0 ? 'positif' : 'negatif';
        return match (true) {
            $abs >= 0.8 => "Korelasi {$dir} sangat kuat",
            $abs >= 0.6 => "Korelasi {$dir} kuat",
            $abs >= 0.4 => "Korelasi {$dir} sedang",
            $abs >= 0.2 => "Korelasi {$dir} lemah",
            default     => "Tidak ada korelasi signifikan",
        };
    }
}
