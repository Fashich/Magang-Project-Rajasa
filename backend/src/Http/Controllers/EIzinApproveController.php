<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Models\RombelWaliKelas;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * EIzinApproveController
 * PATCH /api/e-izin/{id}/approve
 *
 * Body: { action: 'approve'|'reject', catatan? }
 *
 * Flow:
 *   menunggu_ortu  → ortu             → pending | ditolak
 *   pending        → guru (wali kelas) → disetujui_wali | ditolak_wali
 *   disetujui_wali → admin             → disetujui | ditolak
 *
 * Saat disetujui final: update presensi_jam_siswa status → jenis izin
 *
 * @author feature/e-izin
 */
final class EIzinApproveController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(string $id): void
    {
        $id     = (int) $id;
        $user   = $this->auth->user();
        $type   = $user->user_type;
        $body   = $this->request->body();
        $action = $body['action'] ?? '';

        if (!in_array($action, ['approve','reject'], true)) {
            Response::error('Action tidak valid. Gunakan approve atau reject.', [], 422); return;
        }

        $izin = DB::table('e_izin AS ei')
            ->join('siswa AS s', 's.siswa_id', '=', 'ei.siswa_id')
            ->leftJoin('rombel AS r', 'r.rombel_id', '=', 's.rombel_id_aktif')
            ->where('ei.izin_id', $id)
            ->selectRaw("ei.*, s.rombel_id_aktif, s.nama_lengkap, r.label_rombel")
            ->first();

        if (!$izin) {
            Response::error('Pengajuan izin tidak ditemukan.', [], 404); return;
        }

        $catatan = trim($body['catatan'] ?? '');

        // ── Approval level 0: Orang Tua ──────────────────────────────────────
        if ($type === 'ortu') {
            // Verifikasi: izin milik siswa yang terhubung ke akun ortu ini
            if (empty($user->linked_siswa_id) || (int)$user->linked_siswa_id !== (int)$izin->siswa_id) {
                Response::error('Akses ditolak. Izin ini bukan milik siswa Anda.', [], 403); return;
            }
            if ($izin->status !== 'menunggu_ortu') {
                Response::error('Izin ini tidak dalam status menunggu persetujuan orang tua (status: '.$izin->status.').', [], 409); return;
            }

            if ($action === 'approve') {
                DB::table('e_izin')->where('izin_id', $id)->update([
                    'ortu_status'      => 'approved',
                    'ortu_approved_at' => Carbon::now()->toDateTimeString(),
                    'ortu_catatan'     => $catatan ?: null,
                    'status'           => 'pending',
                    'updated_at'       => Carbon::now()->toDateTimeString(),
                ]);
                // Notifikasi wali kelas agar segera proses
                $this->notifikasiWaliKelas((int)$izin->siswa_id, $id, $izin->jenis ?? '',
                    $izin->tanggal_mulai ?? '', $izin->tanggal_selesai ?? '');
                Response::success('Izin disetujui. Menunggu persetujuan wali kelas.', ['status' => 'pending']);
            } else {
                DB::table('e_izin')->where('izin_id', $id)->update([
                    'ortu_status'      => 'rejected',
                    'ortu_approved_at' => Carbon::now()->toDateTimeString(),
                    'ortu_catatan'     => $catatan ?: null,
                    'status'           => 'ditolak',
                    'updated_at'       => Carbon::now()->toDateTimeString(),
                ]);
                Response::success('Izin ditolak oleh orang tua.', ['status' => 'ditolak']);
            }
            return;
        }

        // ── Approval level 1: Wali Kelas ──────────────────────────────────────
        if (in_array($type, ['guru'], true)) {
            if ($izin->status !== 'pending') {
                Response::error('Izin ini sudah tidak bisa diproses (status: '.$izin->status.').', [], 409); return;
            }

            // Cek apakah guru ini wali kelas rombel siswa tersebut
            if (!empty($user->guru_id) && $izin->rombel_id_aktif) {
                $isWali = RombelWaliKelas::where('guru_id', (int)$user->guru_id)
                    ->where('rombel_id', $izin->rombel_id_aktif)
                    ->where('status','aktif')->exists();
                if (!$isWali) {
                    Response::error('Anda bukan wali kelas rombel siswa ini.', [], 403); return;
                }
            }

            $newStatus = $action === 'approve' ? 'disetujui_wali' : 'ditolak_wali';
            DB::table('e_izin')->where('izin_id', $id)->update([
                'status'           => $newStatus,
                'wali_approved_by' => (int) $user->user_id,
                'wali_approved_at' => Carbon::now()->toDateTimeString(),
                'wali_catatan'     => $catatan ?: null,
                'updated_at'       => Carbon::now()->toDateTimeString(),
            ]);

            // Notifikasi admin jika disetujui wali
            if ($newStatus === 'disetujui_wali') {
                $this->notifikasiAdmin($id, $izin->nama_lengkap, $izin->jenis);
            }

            Response::success(
                $newStatus === 'disetujui_wali' ? 'Izin disetujui. Menunggu persetujuan admin.' : 'Izin ditolak.',
                ['status' => $newStatus]
            );
            return;
        }

        // ── Approval level 2: Admin ───────────────────────────────────────────
        if (in_array($type, ['admin'], true)) {
            // Admin bisa approve dari disetujui_wali atau langsung dari pending
            if (!in_array($izin->status, ['menunggu_ortu','pending','disetujui_wali'], true)) {
                Response::error('Izin ini sudah tidak bisa diproses (status: '.$izin->status.').', [], 409); return;
            }

            $newStatus = $action === 'approve' ? 'disetujui' : 'ditolak';
            DB::table('e_izin')->where('izin_id', $id)->update([
                'status'            => $newStatus,
                'final_approved_by' => (int) $user->user_id,
                'final_approved_at' => Carbon::now()->toDateTimeString(),
                'final_catatan'     => $catatan ?: null,
                'updated_at'        => Carbon::now()->toDateTimeString(),
            ]);

            // Kalau disetujui final → update presensi_jam_siswa yang kosong/alpha di rentang tanggal
            if ($newStatus === 'disetujui') {
                $this->terapkanIzin($izin);
            }

            Response::success(
                $newStatus === 'disetujui' ? 'Izin disetujui dan presensi diperbarui.' : 'Izin ditolak.',
                ['status' => $newStatus]
            );
            return;
        }

        Response::error('Akses ditolak.', [], 403);
    }

    /**
     * Setelah izin disetujui admin: update status presensi_jam_siswa
     * yang alpha/belum ada di rentang tanggal izin → status sesuai jenis izin.
     */
    private function terapkanIzin(object $izin): void
    {
        $statusPresensi = $izin->jenis === 'sakit' ? 'sakit' : 'izin';

        DB::table('presensi_jam_siswa')
            ->where('siswa_id', $izin->siswa_id)
            ->whereBetween('tanggal', [$izin->tanggal_mulai, $izin->tanggal_selesai])
            ->where('status', 'alpha')
            ->update([
                'status'           => $statusPresensi,
                'keterangan'       => "E-Izin #{$izin->izin_id}: {$izin->jenis}",
                'edited_by_user_id'=> $izin->final_approved_by,
                'edited_at'        => Carbon::now()->toDateTimeString(),
                'updated_at'       => Carbon::now()->toDateTimeString(),
            ]);
    }

    private function notifikasiAdmin(int $izinId, string $namaSiswa, string $jenis): void
    {
        $admins = DB::table('users')
            ->whereIn('user_type', ['admin'])
            ->where('status','aktif')
            ->pluck('user_id')->all();

        foreach ($admins as $adminId) {
            DB::table('notifikasi_user')->insert([
                'user_id'       => $adminId,
                'tipe'          => 'info',
                'judul'         => "Izin Menunggu Persetujuan Admin",
                'pesan'         => "Izin {$jenis} {$namaSiswa} sudah disetujui wali kelas. Mohon ditindaklanjuti.",
                'related_table' => 'e_izin',
                'related_id'    => $izinId,
                'popup_until'   => Carbon::now()->addHours(48)->toDateTimeString(),
                'is_read'       => 0,
                'created_at'    => Carbon::now()->toDateTimeString(),
            ]);
        }
    }

    private function notifikasiWaliKelas(int $siswaId, int $izinId, string $jenis, string $dari, string $sampai): void
    {
        $siswa = DB::table('siswa')->where('siswa_id', $siswaId)
            ->select('nama_lengkap','rombel_id_aktif')->first();
        if (!$siswa || !$siswa->rombel_id_aktif) return;

        $wali = DB::table('rombel_wali_kelas AS rwk')
            ->join('users AS u', function($j) {
                $j->on('u.guru_id','=','rwk.guru_id')->where('u.status','aktif');
            })
            ->where('rwk.rombel_id', $siswa->rombel_id_aktif)
            ->where('rwk.status','aktif')
            ->select('u.user_id')->first();

        if (!$wali) return;

        DB::table('notifikasi_user')->insert([
            'user_id'       => $wali->user_id,
            'tipe'          => 'info',
            'judul'         => "Pengajuan {$jenis}: {$siswa->nama_lengkap}",
            'pesan'         => "Orang tua telah menyetujui {$jenis} {$siswa->nama_lengkap} ({$dari} s/d {$sampai}). Mohon ditindaklanjuti.",
            'related_table' => 'e_izin',
            'related_id'    => $izinId,
            'popup_until'   => Carbon::now()->addHours(48)->toDateTimeString(),
            'is_read'       => 0,
            'created_at'    => Carbon::now()->toDateTimeString(),
        ]);
    }
}
