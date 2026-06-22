<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

<<<<<<< Updated upstream
use Illuminate\Database\Capsule\Manager as DB;

final class EarlyWarningService
{
    /**
     * Detect students with concerning attendance patterns.
     *
     * Options:
     * - days: lookback window in days (default 14)
     * - min_absences: minimal number of 'alpha' to trigger (default 3)
     * - rombel_ids: array of rombel ids to limit scope
     * - siswa_id: single siswa id to inspect
     *
     * Returns array of simple warning items.
     */
    public function detect(array $options = []): array
    {
        $days = (int) ($options['days'] ?? 14);
        $minAbsences = (int) ($options['min_absences'] ?? 3);
        $rombelIds = $options['rombel_ids'] ?? null;
        $siswaId = isset($options['siswa_id']) ? (int) $options['siswa_id'] : null;

        $sinceDate = date('Y-m-d', strtotime(sprintf('-%d days', $days)));

        $query = DB::table('presensi_jam_siswa')
            ->select('siswa.siswa_id', 'siswa.nama_lengkap', 'siswa.rombel_id_aktif', DB::raw("SUM(status = 'alpha') AS alpha_count"))
            ->join('siswa', 'presensi_jam_siswa.siswa_id', '=', 'siswa.siswa_id')
            ->where('presensi_jam_siswa.tanggal', '>=', $sinceDate);

        if ($siswaId) {
            $query->where('presensi_jam_siswa.siswa_id', $siswaId);
        } elseif (!empty($rombelIds) && is_array($rombelIds)) {
            $query->whereIn('siswa.rombel_id_aktif', $rombelIds);
        }

        $rows = $query
            ->groupBy('siswa.siswa_id', 'siswa.nama_lengkap', 'siswa.rombel_id_aktif')
            ->havingRaw('SUM(status = "alpha") >= ?', [$minAbsences])
            ->orderByDesc('alpha_count')
            ->limit(50)
            ->get()
            ->map(function ($r) {
                return [
                    'siswa_id' => (int) $r->siswa_id,
                    'nama_lengkap' => $r->nama_lengkap ?? '',
                    'rombel_id_aktif' => $r->rombel_id_aktif ? (int) $r->rombel_id_aktif : null,
                    'alpha_count' => (int) $r->alpha_count,
                ];
            })
            ->toArray();

        return $rows;
=======
use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * EarlyWarningService
 *
 * Mendeteksi pola bolos/alpha mengkhawatirkan dan membuat notifikasi
 * ke tabel notifikasi_user untuk wali kelas terkait.
 *
 * @author feature/early-warning
 */
final class EarlyWarningService
{
    /**
     * Deteksi siswa dengan pola kehadiran bermasalah.
     *
     * Options:
     *   days          — lookback window (default 14)
     *   min_absences  — minimal alpha untuk trigger (default 3)
     *   rombel_ids    — filter per rombel (array)
     *   siswa_id      — filter single siswa
     */
    public function detect(array $options = []): array
    {
        $days        = max(1, (int) ($options['days']         ?? 14));
        $minAbsences = max(1, (int) ($options['min_absences'] ?? 3));
        $rombelIds   = $options['rombel_ids'] ?? null;
        $siswaId     = isset($options['siswa_id']) ? (int) $options['siswa_id'] : null;
        $sinceDate   = Carbon::now()->subDays($days - 1)->toDateString();

        $query = DB::table('presensi_jam_siswa AS pjs')
            ->join('siswa AS s', 's.siswa_id', '=', 'pjs.siswa_id')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('pjs.tanggal', '>=', $sinceDate)
            ->where('s.status', 'aktif')
            ->selectRaw("
                s.siswa_id,
                s.nama_lengkap,
                s.rombel_id_aktif,
                r.label_rombel,
                SUM(pjs.status = 'alpha')                AS alpha_count,
                SUM(pjs.status = 'terlambat')            AS terlambat_count,
                SUM(pjs.status IN ('hadir','terlambat')) AS hadir_count,
                COUNT(pjs.presensi_id)                   AS total_records
            ");

        if ($siswaId) {
            $query->where('pjs.siswa_id', $siswaId);
        } elseif (!empty($rombelIds) && is_array($rombelIds)) {
            $query->whereIn('s.rombel_id_aktif', $rombelIds);
        }

        $rows = $query
            ->groupBy('s.siswa_id', 's.nama_lengkap', 's.rombel_id_aktif', 'r.label_rombel')
            ->havingRaw('SUM(pjs.status = \'alpha\') >= ?', [$minAbsences])
            ->orderByDesc('alpha_count')
            ->limit(100)
            ->get();

        return $rows->map(function ($r) use ($days) {
            $alpha     = (int) $r->alpha_count;
            $total     = (int) $r->total_records;
            $hadir     = (int) $r->hadir_count;
            $rateHadir = $total > 0 ? round(($hadir / $total) * 100, 1) : 0;

            // Severity: critical ≥50% alpha, high ≥30%, medium lainnya
            if ($total > 0 && ($alpha / $total) >= 0.5) {
                $severity = 'critical';
            } elseif ($total > 0 && ($alpha / $total) >= 0.3) {
                $severity = 'high';
            } else {
                $severity = 'medium';
            }

            return [
                'siswa_id'        => (int) $r->siswa_id,
                'nama_lengkap'    => $r->nama_lengkap ?? '',
                'rombel_id'       => $r->rombel_id_aktif ? (int) $r->rombel_id_aktif : null,
                'label_rombel'    => $r->label_rombel ?? '—',
                'alpha_count'     => $alpha,
                'terlambat_count' => (int) $r->terlambat_count,
                'hadir_count'     => $hadir,
                'total_records'   => $total,
                'rate_hadir'      => $rateHadir,
                'severity'        => $severity,
                'window_days'     => $days,
            ];
        })->values()->all();
    }

    /**
     * Ambil tren alpha per hari untuk 1 siswa (sparkline).
     */
    public function trendSiswa(int $siswaId, int $days = 14): array
    {
        $sinceDate = Carbon::now()->subDays($days - 1)->toDateString();

        $rows = DB::table('presensi_jam_siswa')
            ->where('siswa_id', $siswaId)
            ->where('tanggal', '>=', $sinceDate)
            ->selectRaw("
                tanggal,
                SUM(status = 'alpha') AS alpha,
                SUM(status = 'hadir') AS hadir,
                COUNT(*) AS total
            ")
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        return $rows->map(fn ($r) => [
            'tanggal' => $r->tanggal,
            'alpha'   => (int) $r->alpha,
            'hadir'   => (int) $r->hadir,
            'total'   => (int) $r->total,
        ])->values()->all();
    }

    /**
     * Kirim notifikasi ke wali kelas untuk siswa bermasalah.
     * Hanya buat notifikasi baru jika belum ada notif yang sama hari ini.
     *
     * @return int jumlah notifikasi yang dikirim
     */
    public function kirimNotifikasi(array $warnings): int
    {
        $sent = 0;
        $today = Carbon::now()->toDateString();

        foreach ($warnings as $w) {
            if (empty($w['rombel_id'])) continue;

            // Cari user wali kelas dari rombel ini
            $waliKelas = DB::table('rombel_wali_kelas AS rwk')
                ->join('users AS u', function ($j) {
                    $j->on('u.guru_id', '=', 'rwk.guru_id')
                      ->where('u.status', '=', 'aktif');
                })
                ->where('rwk.rombel_id', $w['rombel_id'])
                ->where('rwk.status', 'aktif')
                ->select('u.user_id')
                ->first();

            if (!$waliKelas) continue;

            // Cek apakah sudah ada notifikasi hari ini untuk siswa ini
            $alreadySent = DB::table('notifikasi_user')
                ->where('user_id',       $waliKelas->user_id)
                ->where('related_table', 'siswa')
                ->where('related_id',    $w['siswa_id'])
                ->whereDate('created_at', $today)
                ->exists();

            if ($alreadySent) continue;

            $severityLabel = match ($w['severity']) {
                'critical' => '🔴 KRITIS',
                'high'     => '🟠 Tinggi',
                default    => '🟡 Sedang',
            };

            DB::table('notifikasi_user')->insert([
                'user_id'       => $waliKelas->user_id,
                'tipe'          => $w['severity'] === 'critical' ? 'error' : 'warning',
                'judul'         => "Early Warning: {$w['nama_lengkap']}",
                'pesan'         => "{$severityLabel} — {$w['nama_lengkap']} alpha {$w['alpha_count']}x "
                    . "dalam {$w['window_days']} hari terakhir (rate hadir: {$w['rate_hadir']}%). "
                    . "Segera tindak lanjut.",
                'related_table' => 'siswa',
                'related_id'    => $w['siswa_id'],
                'popup_until'   => Carbon::now()->addHours(24)->toDateTimeString(),
                'is_read'       => 0,
                'created_at'    => Carbon::now()->toDateTimeString(),
            ]);

            $sent++;
        }

        return $sent;
    }

    /**
     * Summary statistik early warning untuk header panel.
     */
    public function summary(array $options = []): array
    {
        $days      = max(1, (int) ($options['days'] ?? 14));
        $since     = Carbon::now()->subDays($days - 1)->toDateString();
        $rombelIds = $options['rombel_ids'] ?? null;

        $q = DB::table('presensi_jam_siswa AS pjs')
            ->join('siswa AS s', 's.siswa_id', '=', 'pjs.siswa_id')
            ->where('pjs.tanggal', '>=', $since)
            ->where('s.status', 'aktif');

        if (!empty($rombelIds)) {
            $q->whereIn('s.rombel_id_aktif', $rombelIds);
        }

        $totals = $q->selectRaw("
            COUNT(DISTINCT s.siswa_id)    AS total_siswa_aktif,
            SUM(pjs.status = 'alpha')     AS total_alpha,
            SUM(pjs.status = 'hadir')     AS total_hadir,
            COUNT(pjs.presensi_id)        AS total_records
        ")->first();

        // Hitung siswa bermasalah (alpha ≥ 3)
        $subQ = DB::table('presensi_jam_siswa AS pjs2')
            ->join('siswa AS s2', 's2.siswa_id', '=', 'pjs2.siswa_id')
            ->where('pjs2.tanggal', '>=', $since)
            ->where('s2.status', 'aktif');
        if (!empty($rombelIds)) {
            $subQ->whereIn('s2.rombel_id_aktif', $rombelIds);
        }
        $bermasalahCount = $subQ
            ->selectRaw("s2.siswa_id, SUM(pjs2.status = 'alpha') AS ac")
            ->groupBy('s2.siswa_id')
            ->havingRaw('SUM(pjs2.status = \'alpha\') >= 3')
            ->get()
            ->count();

        $totalRecords = (int) ($totals->total_records ?? 0);
        $totalHadir   = (int) ($totals->total_hadir   ?? 0);

        return [
            'total_siswa_bermasalah' => $bermasalahCount,
            'total_alpha'            => (int) ($totals->total_alpha ?? 0),
            'rate_hadir_global'      => $totalRecords > 0
                ? round(($totalHadir / $totalRecords) * 100, 1) : 0,
            'window_days'            => $days,
        ];
>>>>>>> Stashed changes
    }
}
