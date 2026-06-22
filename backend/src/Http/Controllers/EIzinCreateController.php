<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Illuminate\Database\Capsule\Manager as DB;

/**
 * EIzinCreateController
 * POST /api/e-izin
 *
 * Body: { siswa_id?, tanggal_mulai, tanggal_selesai, jenis, alasan, keterangan_tambahan? }
 * siswa_id wajib kalau submitter bukan siswa (admin/guru mengajukan untuk siswa tertentu)
 *
 * @author feature/e-izin
 */
final class EIzinCreateController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();
        $body = $this->request->body();

        // Tentukan siswa_id
        if ($user->user_type === 'siswa') {
            $siswaId = (int) $user->siswa_id;
        } elseif (in_array($user->user_type, ['admin','super_admin','guru','staff'], true)) {
            if (empty($body['siswa_id'])) {
                Response::error('siswa_id wajib diisi.', [], 422); return;
            }
            $siswaId = (int) $body['siswa_id'];
        } else {
            Response::error('Akses ditolak.', [], 403); return;
        }

        // Validasi siswa ada
        if (!DB::table('siswa')->where('siswa_id', $siswaId)->where('status','aktif')->exists()) {
            Response::error('Siswa tidak ditemukan atau tidak aktif.', [], 404); return;
        }

        // Validasi field wajib
        $tanggalMulai   = $body['tanggal_mulai']   ?? '';
        $tanggalSelesai = $body['tanggal_selesai']  ?? '';
        $jenis          = $body['jenis']             ?? '';
        $alasan         = trim($body['alasan']       ?? '');

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalMulai) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggalSelesai)) {
            Response::error('Format tanggal tidak valid (Y-m-d).', [], 422); return;
        }

        if ($tanggalSelesai < $tanggalMulai) {
            Response::error('Tanggal selesai tidak boleh sebelum tanggal mulai.', [], 422); return;
        }

        if (!in_array($jenis, ['sakit','izin','dispensasi'], true)) {
            Response::error('Jenis izin tidak valid.', [], 422); return;
        }

        if (!$alasan) {
            Response::error('Alasan wajib diisi.', [], 422); return;
        }

        // Cek apakah sudah ada izin di rentang tanggal yang sama
        $overlap = DB::table('e_izin')
            ->where('siswa_id', $siswaId)
            ->whereNotIn('status', ['ditolak','ditolak_wali'])
            ->where('tanggal_mulai', '<=', $tanggalSelesai)
            ->where('tanggal_selesai', '>=', $tanggalMulai)
            ->exists();

        if ($overlap) {
            Response::error('Sudah ada pengajuan izin yang aktif pada rentang tanggal ini.', [], 409); return;
        }

        $id = DB::table('e_izin')->insertGetId([
            'siswa_id'             => $siswaId,
            'tanggal_mulai'        => $tanggalMulai,
            'tanggal_selesai'      => $tanggalSelesai,
            'jenis'                => $jenis,
            'alasan'               => $alasan,
            'keterangan_tambahan'  => trim($body['keterangan_tambahan'] ?? '') ?: null,
            'lampiran_url'         => trim($body['lampiran_url'] ?? '') ?: null,
            'status'               => 'pending',
            'submitted_by'         => (int) $user->user_id,
            'submitted_at'         => Carbon::now()->toDateTimeString(),
        ]);

        // Kirim notifikasi ke wali kelas siswa ini
        $this->notifikasiWali($siswaId, $id, $jenis, $tanggalMulai, $tanggalSelesai);

        Response::success('Pengajuan izin berhasil dikirim.', ['izin_id' => $id], 201);
    }

    private function notifikasiWali(int $siswaId, int $izinId, string $jenis, string $dari, string $sampai): void
    {
        // Cari rombel siswa
        $siswa = DB::table('siswa')->where('siswa_id', $siswaId)
            ->select('rombel_id_aktif','nama_lengkap')->first();
        if (!$siswa || !$siswa->rombel_id_aktif) return;

        // Cari wali kelas
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
            'pesan'         => "{$siswa->nama_lengkap} mengajukan {$jenis} dari {$dari} s/d {$sampai}. Mohon ditindaklanjuti.",
            'related_table' => 'e_izin',
            'related_id'    => $izinId,
            'popup_until'   => Carbon::now()->addHours(48)->toDateTimeString(),
            'is_read'       => 0,
            'created_at'    => Carbon::now()->toDateTimeString(),
        ]);
    }
}
