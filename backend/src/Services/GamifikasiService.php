<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;

/**
 * GamifikasiService
 *
 * Menghitung poin gamifikasi secara otomatis saat sesi presensi ditutup.
 * Dipanggil dari PresensiSessionService::finish() setelah sesi di-update.
 *
 * Poin per status:
 *   hadir     = 10 poin
 *   terlambat = 5  poin
 *   izin/sakit= 3  poin
 *   alpha     = 0  poin (tidak dapat poin)
 *
 * Bonus:
 *   early_bird = +5 jika hadir sebelum jam 07:10
 */
final class GamifikasiService
{
    /**
     * Hitung dan simpan poin untuk semua siswa dalam satu sesi yang baru selesai.
     *
     * @param int $sesiId presensi_sesi_id yang baru ditutup
     */
    public function hitungUntukSesi(int $sesiId): void
    {
        try {
            // Ambil tanggal sesi
            $sesi = DB::table('presensi_sesi')
                ->where('presensi_sesi_id', $sesiId)
                ->select('tanggal')
                ->first();

            if (!$sesi) {
                return;
            }

            $tanggal = $sesi->tanggal;

            // Ambil semua rekap kehadiran siswa dalam sesi ini
            $records = DB::table('presensi_jam_siswa AS pjs')
                ->join('presensi_sesi_jam AS psj', 'psj.presensi_sesi_jam_id', '=', 'pjs.presensi_sesi_jam_id')
                ->where('psj.presensi_sesi_id', $sesiId)
                ->where('pjs.tanggal', $tanggal)
                ->selectRaw('pjs.siswa_id, pjs.status, pjs.scanned_at')
                ->get();

            // Grup per siswa — ambil status "terbaik" dalam sesi ini
            $siswaSummary = [];
            foreach ($records as $r) {
                $sid = (int) $r->siswa_id;
                if (!isset($siswaSummary[$sid])) {
                    $siswaSummary[$sid] = [
                        'status'     => $r->status,
                        'scanned_at' => $r->scanned_at,
                    ];
                }
                // Prioritas: hadir > terlambat > izin > sakit > alpha
                $priority = ['hadir' => 4, 'terlambat' => 3, 'izin' => 2, 'sakit' => 2, 'alpha' => 0];
                $existing = $priority[$siswaSummary[$sid]['status']] ?? 0;
                $new      = $priority[$r->status] ?? 0;
                if ($new > $existing) {
                    $siswaSummary[$sid] = [
                        'status'     => $r->status,
                        'scanned_at' => $r->scanned_at,
                    ];
                }
            }

            $now = date('Y-m-d H:i:s');

            foreach ($siswaSummary as $siswaId => $data) {
                $status = $data['status'];

                $poin = match ($status) {
                    'hadir'     => 10,
                    'terlambat' => 5,
                    'izin',
                    'sakit'     => 3,
                    default     => 0,
                };

                if ($poin === 0) {
                    continue;
                }

                $tipe = match ($status) {
                    'hadir'     => 'hadir_tepat_waktu',
                    'terlambat' => 'hadir_terlambat',
                    default     => 'izin_surat',
                };

                // Hindari duplikasi: jika sudah ada poin hari ini untuk sesi ini, skip
                $exists = DB::table('gamifikasi_poin')
                    ->where('siswa_id', $siswaId)
                    ->where('tanggal', $tanggal)
                    ->where('tipe', $tipe)
                    ->where('keterangan', 'like', "%sesi #{$sesiId}%")
                    ->exists();

                if ($exists) {
                    continue;
                }

                DB::table('gamifikasi_poin')->insert([
                    'siswa_id'   => $siswaId,
                    'tipe'       => $tipe,
                    'poin'       => $poin,
                    'keterangan' => "Presensi {$tanggal} — sesi #{$sesiId}",
                    'tanggal'    => $tanggal,
                    'created_at' => $now,
                ]);

                // Bonus early bird: hadir sebelum 07:10
                if ($status === 'hadir' && !empty($data['scanned_at'])) {
                    $scanTime = date('H:i', strtotime($data['scanned_at']));
                    if ($scanTime <= '07:10') {
                        $earlyExists = DB::table('gamifikasi_poin')
                            ->where('siswa_id', $siswaId)
                            ->where('tanggal', $tanggal)
                            ->where('tipe', 'early_bird')
                            ->exists();

                        if (!$earlyExists) {
                            DB::table('gamifikasi_poin')->insert([
                                'siswa_id'   => $siswaId,
                                'tipe'       => 'early_bird',
                                'poin'       => 5,
                                'keterangan' => "Early bird {$tanggal} (scan {$scanTime})",
                                'tanggal'    => $tanggal,
                                'created_at' => $now,
                            ]);
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // Silent fail — jangan sampai error gamifikasi block penutupan sesi
            error_log('[GamifikasiService] Error: ' . $e->getMessage());
        }
    }
}
