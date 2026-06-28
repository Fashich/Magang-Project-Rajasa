<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * ProfileController
 *
 * GET  /api/profile/me       → profil lengkap user yang login
 * POST /api/profile/foto     → upload foto profil (max 10 MB)
 * PUT  /api/profile/kontak   → update email + no_telp (guru & admin)
 */
final class ProfileController
{
    private const FOTO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    private const FOTO_MIME_ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    private const FOTO_DIR_GURU  = __DIR__ . '/../../../server/foto/guru/';
    private const FOTO_DIR_SISWA = __DIR__ . '/../../../server/foto/siswa/';

    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    // ── GET /api/profile/me ───────────────────────────────────────────────────

    public function me(): void
    {
        $user = $this->auth->user();

        if (in_array($user->user_type, ['guru', 'staff', 'admin', 'intern'], true)) {
            $this->meGuru($user);
        } else {
            $this->meSiswa($user);
        }
    }

    private function meGuru(object $user): void
    {
        $row = DB::table('guru_staff as g')
            ->join('users as u', 'u.guru_id', '=', 'g.guru_id')
            ->where('u.user_id', '=', (int) $user->user_id)
            ->select([
                'g.guru_id', 'g.nip', 'g.nama_lengkap', 'g.no_telp',
                'g.email', 'g.jabatan', 'g.mapel_pengampu',
                'g.status_kepegawaian', 'g.jenis_user', 'g.status',
                'g.foto_profil',
                'u.username', 'u.last_login_at',
            ])
            ->first();

        if (!$row) {
            Response::error('Profil tidak ditemukan.', [], 404);
            return;
        }

        $data = (array) $row;
        $data['foto_url'] = $data['foto_profil']
            ? '/server/foto/guru/' . $data['foto_profil']
            : null;
        unset($data['foto_profil']);

        Response::success('Profil guru.', ['profile' => $data]);
    }

    private function meSiswa(object $user): void
    {
        $row = DB::table('siswa as s')
            ->join('users as u', 'u.siswa_id', '=', 's.siswa_id')
            ->leftJoin('profil_siswa as ps', 'ps.siswa_id', '=', 's.siswa_id')
            ->leftJoin('jurusan as j', 'j.jurusan_id', '=', 's.jurusan_id_aktif')
            ->where('u.user_id', '=', (int) $user->user_id)
            ->select([
                's.siswa_id', 's.nisn', 's.nis', 's.nama_lengkap',
                's.jenis_kelamin', 's.angkatan', 's.kelas_aktif', 's.status',
                'j.nama_jurusan as jurusan',
                'ps.alamat', 'ps.no_telp', 'ps.email',
                'ps.nama_wali', 'ps.no_telp_wali', 'ps.foto_profil',
                'u.username', 'u.last_login_at',
            ])
            ->first();

        if (!$row) {
            Response::error('Profil tidak ditemukan.', [], 404);
            return;
        }

        $data = (array) $row;
        $data['foto_url'] = $data['foto_profil']
            ? '/server/foto/siswa/' . $data['foto_profil']
            : null;
        unset($data['foto_profil']);

        Response::success('Profil siswa.', ['profile' => $data]);
    }

    // ── POST /api/profile/foto ────────────────────────────────────────────────

    public function uploadFoto(): void
    {
        $user = $this->auth->user();

        if (!isset($_FILES['foto'])) {
            Response::error('File foto tidak ditemukan.', [], 400);
            return;
        }

        $file = $_FILES['foto'];

        // Validasi upload error
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Upload gagal. Coba lagi.', [], 400);
            return;
        }

        // Validasi ukuran max 10MB
        if ($file['size'] > self::FOTO_MAX_BYTES) {
            Response::error('Ukuran foto maksimal 10 MB.', [], 422);
            return;
        }

        // Validasi MIME type (pakai finfo, bukan extension)
        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, self::FOTO_MIME_ALLOWED, true)) {
            Response::error('Format foto tidak didukung. Gunakan JPG, PNG, atau WEBP.', [], 422);
            return;
        }

        $ext = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            default      => 'jpg',
        };

        $isGuru = in_array($user->user_type, ['guru', 'staff', 'admin', 'intern'], true);
        $dir    = $isGuru ? self::FOTO_DIR_GURU : self::FOTO_DIR_SISWA;
        $type   = $isGuru ? 'guru' : 'siswa';

        // Buat folder jika belum ada
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if ($isGuru) {
            $row = DB::table('guru_staff as g')
                ->join('users as u', 'u.guru_id', '=', 'g.guru_id')
                ->where('u.user_id', '=', (int) $user->user_id)
                ->select(['g.guru_id', 'g.foto_profil'])
                ->first();

            if (!$row) {
                Response::error('Data guru tidak ditemukan.', [], 404);
                return;
            }

            // Hapus foto lama
            if ($row->foto_profil && file_exists($dir . $row->foto_profil)) {
                unlink($dir . $row->foto_profil);
            }

            $filename = "guru_{$row->guru_id}_" . time() . ".{$ext}";
            move_uploaded_file($file['tmp_name'], $dir . $filename);

            DB::table('guru_staff')
                ->where('guru_id', $row->guru_id)
                ->update(['foto_profil' => $filename, 'updated_at' => now()->toDateTimeString()]);

        } else {
            $row = DB::table('siswa as s')
                ->join('users as u', 'u.siswa_id', '=', 's.siswa_id')
                ->leftJoin('profil_siswa as ps', 'ps.siswa_id', '=', 's.siswa_id')
                ->where('u.user_id', '=', (int) $user->user_id)
                ->select(['s.siswa_id', 'ps.profil_id', 'ps.foto_profil'])
                ->first();

            if (!$row) {
                Response::error('Data siswa tidak ditemukan.', [], 404);
                return;
            }

            if ($row->foto_profil && file_exists($dir . $row->foto_profil)) {
                unlink($dir . $row->foto_profil);
            }

            $filename = "siswa_{$row->siswa_id}_" . time() . ".{$ext}";
            move_uploaded_file($file['tmp_name'], $dir . $filename);

            if ($row->profil_id) {
                DB::table('profil_siswa')
                    ->where('siswa_id', $row->siswa_id)
                    ->update(['foto_profil' => $filename, 'updated_at' => now()->toDateTimeString()]);
            } else {
                DB::table('profil_siswa')->insert([
                    'siswa_id'    => $row->siswa_id,
                    'foto_profil' => $filename,
                    'created_at'  => now()->toDateTimeString(),
                    'updated_at'  => now()->toDateTimeString(),
                ]);
            }
        }

        Response::success('Foto profil berhasil diperbarui.', [
            'foto_url' => "/server/foto/{$type}/{$filename}",
        ]);
    }

    // ── PUT /api/profile/kontak ───────────────────────────────────────────────

    public function updateKontak(): void
    {
        $user = $this->auth->user();

        // Siswa tidak bisa edit kontak sendiri
        if ($user->user_type === 'siswa') {
            Response::error('Siswa tidak dapat mengubah data kontak sendiri. Hubungi admin.', [], 403);
            return;
        }

        $body   = $this->request->body();
        $email  = isset($body['email'])  ? trim($body['email'])  : null;
        $noTelp = isset($body['no_telp'])? trim($body['no_telp']): null;

        if ($email !== null && $email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Format email tidak valid.', [], 422);
            return;
        }

        $row = DB::table('guru_staff as g')
            ->join('users as u', 'u.guru_id', '=', 'g.guru_id')
            ->where('u.user_id', '=', (int) $user->user_id)
            ->select(['g.guru_id'])
            ->first();

        if (!$row) {
            Response::error('Data guru tidak ditemukan.', [], 404);
            return;
        }

        $updates = ['updated_at' => now()->toDateTimeString()];
        if ($email  !== null) $updates['email']   = $email  ?: null;
        if ($noTelp !== null) $updates['no_telp'] = $noTelp ?: null;

        DB::table('guru_staff')
            ->where('guru_id', $row->guru_id)
            ->update($updates);

        Response::success('Data kontak berhasil diperbarui.');
    }
}
