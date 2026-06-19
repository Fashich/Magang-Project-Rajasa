<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

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
    }
}
