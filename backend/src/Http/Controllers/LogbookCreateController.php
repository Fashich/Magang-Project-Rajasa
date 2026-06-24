<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * LogbookCreateController
 * POST /api/logbook
 *
 * Body (JSON):
 *   tanggal      string  REQUIRED  YYYY-MM-DD
 *   jam_mulai    string  optional  HH:MM
 *   jam_selesai  string  optional  HH:MM
 *   lokasi       string  optional  max 200
 *   deskripsi    string  REQUIRED  min 10
 *   foto_path    string  optional  path relatif
 *   submit       bool    optional  true → langsung kirim ke review (status: menunggu_review)
 *                                  false/omit → simpan draft
 *
 * Role: siswa only
 */
final class LogbookCreateController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        if ($user->user_type !== 'siswa' || empty($user->siswa_id)) {
            Response::error('Hanya siswa yang dapat membuat logbook.', [], 403);
            return;
        }

        $siswaId = (int) $user->siswa_id;
        $body    = $this->request->body();

        // ── Validasi ──────────────────────────────────────────────────────────
        $errors = [];
        $tanggal    = trim($body['tanggal']    ?? '');
        $deskripsi  = trim($body['deskripsi']  ?? '');
        $lokasi     = trim($body['lokasi']     ?? '');
        $jamMulai   = trim($body['jam_mulai']  ?? '');
        $jamSelesai = trim($body['jam_selesai'] ?? '');
        $fotoPath   = trim($body['foto_path']  ?? '');
        $submit     = !empty($body['submit']) && $body['submit'] !== 'false';

        if (!$tanggal || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
            $errors['tanggal'] = 'Tanggal wajib diisi (format YYYY-MM-DD).';
        } else {
            // Tidak boleh entry tanggal masa depan
            if ($tanggal > Carbon::now()->toDateString()) {
                $errors['tanggal'] = 'Tanggal tidak boleh lebih dari hari ini.';
            }
        }

        if (mb_strlen($deskripsi) < 10) {
            $errors['deskripsi'] = 'Deskripsi minimal 10 karakter.';
        }

        if ($lokasi && mb_strlen($lokasi) > 200) {
            $errors['lokasi'] = 'Lokasi maksimal 200 karakter.';
        }

        if (!empty($errors)) {
            Response::error('Data tidak valid.', $errors, 422);
            return;
        }

        // ── Cek duplikat (1 siswa 1 entri per hari) ──────────────────────────
        $exists = DB::table('logbook_praktik')
            ->where('siswa_id', $siswaId)
            ->where('tanggal', $tanggal)
            ->exists();

        if ($exists) {
            Response::error("Sudah ada entri logbook untuk tanggal {$tanggal}.", [], 409);
            return;
        }

        // ── Cari guru pembimbing yang di-assign untuk siswa ini ───────────────
        // Cari via rombel_wali_kelas → guru aktif di rombel siswa
        $siswa = DB::table('siswa')->where('siswa_id', $siswaId)->first();
        $guruId = null;

        if ($siswa && $siswa->rombel_id_aktif) {
            $wali = DB::table('rombel_wali_kelas')
                ->where('rombel_id', (int) $siswa->rombel_id_aktif)
                ->where('status', 'aktif')
                ->first();

            if ($wali) {
                $guruId = (int) $wali->guru_id;
            }
        }

        // ── Insert ────────────────────────────────────────────────────────────
        $now    = Carbon::now()->toDateTimeString();
        $status = $submit ? 'menunggu_review' : 'draft';

        $id = DB::table('logbook_praktik')->insertGetId([
            'siswa_id'    => $siswaId,
            'guru_id'     => $guruId,
            'tanggal'     => $tanggal,
            'jam_mulai'   => $jamMulai   ?: null,
            'jam_selesai' => $jamSelesai ?: null,
            'lokasi'      => $lokasi     ?: null,
            'deskripsi'   => $deskripsi,
            'foto_path'   => $fotoPath   ?: null,
            'status'      => $status,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // ── Notifikasi guru jika langsung submit ──────────────────────────────
        if ($submit && $guruId) {
            $this->notifikasiGuru($guruId, $siswa->nama_lengkap ?? '', $tanggal, $id);
        }

        $entry = DB::table('logbook_praktik AS lb')
            ->join('siswa AS s', 's.siswa_id', '=', 'lb.siswa_id')
            ->leftJoin('guru_staff AS g', 'g.guru_id', '=', 'lb.guru_id')
            ->where('lb.logbook_id', $id)
            ->selectRaw("lb.*, s.nama_lengkap AS nama_siswa, g.nama_lengkap AS nama_guru")
            ->first();

        Response::success(
            $submit ? 'Logbook berhasil dikirim untuk direview.' : 'Draft logbook berhasil disimpan.',
            ['logbook' => $entry],
            201
        );
    }

    private function notifikasiGuru(int $guruId, string $namaSiswa, string $tanggal, int $logbookId): void
    {
        $guru = DB::table('users')
            ->where('guru_id', $guruId)
            ->where('status', 'aktif')
            ->first();

        if (!$guru) return;

        DB::table('notifikasi_user')->insert([
            'user_id'       => (int) $guru->user_id,
            'tipe'          => 'info',
            'judul'         => 'Logbook Menunggu Review',
            'pesan'         => "{$namaSiswa} mengajukan logbook tanggal {$tanggal} untuk direview.",
            'related_table' => 'logbook_praktik',
            'related_id'    => $logbookId,
            'popup_until'   => Carbon::now()->addHours(48)->toDateTimeString(),
            'is_read'       => 0,
            'created_at'    => Carbon::now()->toDateTimeString(),
        ]);
    }
}
