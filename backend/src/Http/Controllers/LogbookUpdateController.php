<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * LogbookUpdateController
 * PATCH /api/logbook/{id}
 *
 * Dua operasi berbeda berdasarkan role:
 *
 * SISWA — edit konten (hanya status draft):
 *   Body: { tanggal?, jam_mulai?, jam_selesai?, lokasi?, deskripsi?, foto_path?, submit? }
 *
 * GURU — review/approve/reject entri (hanya status menunggu_review):
 *   Body: { action: 'approve'|'reject', catatan_guru? }
 *
 * ADMIN — bisa keduanya
 */
final class LogbookUpdateController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    public function __invoke(string $id): void
    {
        $id   = (int) $id;
        $user = $this->auth->user();
        $type = $user->user_type;
        $body = $this->request->body();

        $logbook = DB::table('logbook_praktik AS lb')
            ->join('siswa AS s', 's.siswa_id', '=', 'lb.siswa_id')
            ->leftJoin('guru_staff AS g', 'g.guru_id', '=', 'lb.guru_id')
            ->where('lb.logbook_id', $id)
            ->selectRaw("lb.*, s.nama_lengkap AS nama_siswa, g.nama_lengkap AS nama_guru")
            ->first();

        if (!$logbook) {
            Response::error('Logbook tidak ditemukan.', [], 404);
            return;
        }

        // ── Siswa: edit draft ─────────────────────────────────────────────────
        if ($type === 'siswa') {
            if ((int) $user->siswa_id !== (int) $logbook->siswa_id) {
                Response::error('Bukan logbook milik Anda.', [], 403);
                return;
            }
            if (!in_array($logbook->status, ['draft', 'ditolak'], true)) {
                Response::error("Logbook status '{$logbook->status}' tidak dapat diedit.", [], 409);
                return;
            }
            $this->siswaEdit($id, $logbook, $body, (int) $user->siswa_id);
            return;
        }

        // ── Guru: review ──────────────────────────────────────────────────────
        if (in_array($type, ['guru'], true)) {
            if ($logbook->status !== 'menunggu_review') {
                Response::error("Logbook status '{$logbook->status}' tidak perlu direview.", [], 409);
                return;
            }
            // Guru hanya bisa review logbook dari siswa yang di-assign ke dia
            if (!empty($user->guru_id) && (int) $logbook->guru_id !== (int) $user->guru_id) {
                Response::error('Logbook ini bukan tanggung jawab Anda.', [], 403);
                return;
            }
            $this->guruReview($id, $logbook, $body, $user);
            return;
        }

        // ── Admin: bisa edit apapun ───────────────────────────────────────────
        if (in_array($type, ['admin'], true)) {
            if (isset($body['action'])) {
                $this->guruReview($id, $logbook, $body, $user);
            } else {
                $this->siswaEdit($id, $logbook, $body, (int) $logbook->siswa_id);
            }
            return;
        }

        Response::error('Akses ditolak.', [], 403);
    }

    private function siswaEdit(int $id, object $logbook, array $body, int $siswaId): void
    {
        $errors = [];
        $now    = Carbon::now()->toDateTimeString();
        $update = ['updated_at' => $now];

        if (isset($body['tanggal'])) {
            $tanggal = trim($body['tanggal']);
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
                $errors['tanggal'] = 'Format tanggal tidak valid (YYYY-MM-DD).';
            } elseif ($tanggal > Carbon::now()->toDateString()) {
                $errors['tanggal'] = 'Tanggal tidak boleh lebih dari hari ini.';
            } else {
                // Cek duplikat jika tanggal berubah
                if ($tanggal !== $logbook->tanggal) {
                    $exists = DB::table('logbook_praktik')
                        ->where('siswa_id', $siswaId)
                        ->where('tanggal', $tanggal)
                        ->where('logbook_id', '!=', $id)
                        ->exists();
                    if ($exists) {
                        $errors['tanggal'] = "Sudah ada entri logbook untuk tanggal {$tanggal}.";
                    }
                }
                $update['tanggal'] = $tanggal;
            }
        }

        if (isset($body['deskripsi'])) {
            $deskripsi = trim($body['deskripsi']);
            if (mb_strlen($deskripsi) < 10) {
                $errors['deskripsi'] = 'Deskripsi minimal 10 karakter.';
            } else {
                $update['deskripsi'] = $deskripsi;
            }
        }

        if (isset($body['jam_mulai']))   $update['jam_mulai']   = trim($body['jam_mulai'])   ?: null;
        if (isset($body['jam_selesai'])) $update['jam_selesai'] = trim($body['jam_selesai']) ?: null;
        if (isset($body['lokasi']))      $update['lokasi']      = trim($body['lokasi'])       ?: null;
        if (isset($body['foto_path']))   $update['foto_path']   = trim($body['foto_path'])    ?: null;

        if (!empty($errors)) {
            Response::error('Data tidak valid.', $errors, 422);
            return;
        }

        // Submit ke review?
        $submit = !empty($body['submit']) && $body['submit'] !== 'false';
        if ($submit) {
            $update['status'] = 'menunggu_review';
        }

        DB::table('logbook_praktik')->where('logbook_id', $id)->update($update);

        // Notifikasi guru jika baru submit
        if ($submit && $logbook->guru_id) {
            $guru = DB::table('users')->where('guru_id', (int) $logbook->guru_id)->where('status', 'aktif')->first();
            if ($guru) {
                DB::table('notifikasi_user')->insert([
                    'user_id'       => (int) $guru->user_id,
                    'tipe'          => 'info',
                    'judul'         => 'Logbook Menunggu Review',
                    'pesan'         => "{$logbook->nama_siswa} mengirim logbook tanggal ".($update['tanggal'] ?? $logbook->tanggal)." untuk direview.",
                    'related_table' => 'logbook_praktik',
                    'related_id'    => $id,
                    'popup_until'   => Carbon::now()->addHours(48)->toDateTimeString(),
                    'is_read'       => 0,
                    'created_at'    => $now,
                ]);
            }
        }

        $updated = DB::table('logbook_praktik')->where('logbook_id', $id)->first();
        Response::success('Logbook berhasil diperbarui.', ['logbook' => $updated]);
    }

    private function guruReview(int $id, object $logbook, array $body, object $user): void
    {
        $action = $body['action'] ?? '';
        if (!in_array($action, ['approve', 'reject'], true)) {
            Response::error("Action tidak valid. Gunakan 'approve' atau 'reject'.", [], 422);
            return;
        }

        $catatan   = trim($body['catatan_guru'] ?? '');
        $newStatus = $action === 'approve' ? 'disetujui' : 'ditolak';
        $now       = Carbon::now()->toDateTimeString();

        DB::table('logbook_praktik')->where('logbook_id', $id)->update([
            'status'       => $newStatus,
            'reviewed_by'  => (int) $user->user_id,
            'reviewed_at'  => $now,
            'catatan_guru' => $catatan ?: null,
            'updated_at'   => $now,
        ]);

        // Notifikasi siswa
        $siswaUser = DB::table('users')
            ->where('siswa_id', (int) $logbook->siswa_id)
            ->where('status', 'aktif')
            ->first();

        if ($siswaUser) {
            $msg = $newStatus === 'disetujui'
                ? "Logbook tanggal {$logbook->tanggal} Anda telah disetujui guru pembimbing."
                : "Logbook tanggal {$logbook->tanggal} Anda dikembalikan. Periksa catatan guru.";

            DB::table('notifikasi_user')->insert([
                'user_id'       => (int) $siswaUser->user_id,
                'tipe'          => $newStatus === 'disetujui' ? 'success' : 'warning',
                'judul'         => $newStatus === 'disetujui' ? 'Logbook Disetujui' : 'Logbook Dikembalikan',
                'pesan'         => $msg,
                'related_table' => 'logbook_praktik',
                'related_id'    => $id,
                'popup_until'   => Carbon::now()->addHours(24)->toDateTimeString(),
                'is_read'       => 0,
                'created_at'    => $now,
            ]);
        }

        $updated = DB::table('logbook_praktik')->where('logbook_id', $id)->first();
        Response::success(
            $newStatus === 'disetujui' ? 'Logbook disetujui.' : 'Logbook dikembalikan ke siswa.',
            ['logbook' => $updated]
        );
    }
}
