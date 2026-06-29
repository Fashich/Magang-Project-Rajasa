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
            Response::error(
                'File tidak diterima. Pastikan format multipart/form-data dan ukuran ≤ 10 MB.',
                ['php_post_max' => ini_get('post_max_size'), 'php_upload_max' => ini_get('upload_max_filesize')],
                400
            );
            return;
        }

        $file = $_FILES['foto'];

        // Validasi upload error
        $phpErrors = [
            UPLOAD_ERR_INI_SIZE   => 'File melebihi batas upload PHP (' . ini_get('upload_max_filesize') . '). Hubungi admin.',
            UPLOAD_ERR_FORM_SIZE  => 'File terlalu besar.',
            UPLOAD_ERR_PARTIAL    => 'File hanya terupload sebagian. Coba lagi.',
            UPLOAD_ERR_NO_FILE    => 'Tidak ada file yang dipilih.',
            UPLOAD_ERR_NO_TMP_DIR => 'Folder temp tidak tersedia. Hubungi admin.',
            UPLOAD_ERR_CANT_WRITE => 'Gagal menulis file. Cek permission folder.',
        ];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error($phpErrors[$file['error']] ?? 'Upload gagal (kode: ' . $file['error'] . ').', [], 400);
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
        $body = $this->request->body();

        if (!is_array($body) || empty($body)) {
            Response::error('Body request kosong atau tidak valid.', [], 400);
            return;
        }

        $now = date('Y-m-d H:i:s');

        try {
            if (in_array($user->user_type, ['guru', 'staff', 'admin', 'intern'], true)) {

                // Field yang boleh diedit per jenis user
                if ($user->user_type === 'admin') {
                    $allowedFields = ['nama_lengkap', 'nip', 'jabatan', 'email', 'no_telp'];
                } else {
                    $allowedFields = ['nama_lengkap', 'mapel_pengampu', 'no_telp'];
                }

                $row = DB::table('guru_staff as g')
                    ->join('users as u', 'u.guru_id', '=', 'g.guru_id')
                    ->where('u.user_id', '=', (int) $user->user_id)
                    ->select(['g.guru_id', 'g.nip as existing_nip'])
                    ->first();

                if (!$row) {
                    Response::error('Data guru tidak ditemukan.', [], 404);
                    return;
                }

                if (!empty($body['email']) && !filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
                    Response::error('Format email tidak valid.', [], 422);
                    return;
                }

                // Cek duplikat NIP hanya jika NIP berubah
                if (
                    !empty($body['nip'])
                    && trim((string) $body['nip']) !== (string) ($row->existing_nip ?? '')
                ) {
                    $nipExist = DB::table('guru_staff')
                        ->where('nip', trim((string) $body['nip']))
                        ->where('guru_id', '!=', (int) $row->guru_id)
                        ->exists();
                    if ($nipExist) {
                        Response::error('NIP sudah digunakan oleh guru lain.', [], 409);
                        return;
                    }
                }

                $updates = [];
                foreach ($allowedFields as $field) {
                    if (array_key_exists($field, $body)) {
                        $val = $body[$field];
                        $updates[$field] = ($val !== null && $val !== '') ? trim((string) $val) : null;
                    }
                }

                if (empty($updates)) {
                    Response::success('Tidak ada perubahan.');
                    return;
                }

                $updates['updated_at'] = $now;
                DB::table('guru_staff')->where('guru_id', (int) $row->guru_id)->update($updates);

            } else {
                // Siswa — bisa edit nama_lengkap, email, no_telp
                $row = DB::table('siswa as s')
                    ->join('users as u', 'u.siswa_id', '=', 's.siswa_id')
                    ->where('u.user_id', '=', (int) $user->user_id)
                    ->select(['s.siswa_id'])
                    ->first();

                if (!$row) {
                    Response::error('Data siswa tidak ditemukan.', [], 404);
                    return;
                }

                if (!empty($body['nama_lengkap'])) {
                    DB::table('siswa')
                        ->where('siswa_id', (int) $row->siswa_id)
                        ->update(['nama_lengkap' => trim((string) $body['nama_lengkap']), 'updated_at' => $now]);
                }

                $profilUpdates = [];
                foreach (['email', 'no_telp'] as $field) {
                    if (array_key_exists($field, $body)) {
                        $val = $body[$field];
                        $profilUpdates[$field] = ($val !== null && $val !== '') ? trim((string) $val) : null;
                    }
                }

                if (!empty($profilUpdates)) {
                    $profilUpdates['updated_at'] = $now;
                    $exists = DB::table('profil_siswa')->where('siswa_id', (int) $row->siswa_id)->exists();
                    if ($exists) {
                        DB::table('profil_siswa')->where('siswa_id', (int) $row->siswa_id)->update($profilUpdates);
                    } else {
                        $profilUpdates['siswa_id']   = (int) $row->siswa_id;
                        $profilUpdates['created_at'] = $now;
                        DB::table('profil_siswa')->insert($profilUpdates);
                    }
                }
            }

        } catch (\Throwable $e) {
            Response::error(
                'Gagal menyimpan profil: ' . $e->getMessage(),
                ['trace' => substr($e->getTraceAsString(), 0, 500)],
                500
            );
            return;
        }

        Response::success('Profil berhasil diperbarui.');
    }
}
