<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\FileStorageService;
use Rajasa\PresensiSiswa\Support\Config;

/**
 * ProfileController
 *
 * GET  /api/profile/me       -> profil lengkap user yang login
 * POST /api/profile/foto     -> upload foto profil (max 10 MB)
 * PUT  /api/profile/kontak   -> update email + no_telp (guru & admin)
 *
 * CATATAN PENTING soal foto_profil:
 *   Kolom `foto_profil` di database sekarang menyimpan FULL URL (bukan cuma
 *   nama file) begitu foto di-upload lewat versi ini, agar konsisten baik
 *   memakai Cloudflare R2 (persisten) maupun fallback local disk.
 *   Untuk foto lama (format lama = cuma nama file, sebelum fix ini) tetap
 *   didukung lewat resolveFotoUrl() yang mendeteksi apakah value sudah
 *   berupa URL absolut atau masih nama file saja.
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
        private readonly FileStorageService $storage,
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
        $data['foto_url'] = $this->resolveFotoUrl($data['foto_profil'], 'guru');
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
        $data['foto_url'] = $this->resolveFotoUrl($data['foto_profil'], 'siswa');
        unset($data['foto_profil']);

        Response::success('Profil siswa.', ['profile' => $data]);
    }

    /**
     * Ubah value foto_profil dari database menjadi URL yang bisa langsung
     * dipakai <img src>. Mendukung 3 kemungkinan bentuk value:
     *   1. NULL / kosong           -> null (frontend tampilkan placeholder)
     *   2. Sudah full URL (http... dari R2)  -> dipakai apa adanya
     *   3. Cuma nama file (format lama, local disk) -> di-prefix APP_URL
     */
    private function resolveFotoUrl(?string $fotoProfil, string $type): ?string
    {
        if (!$fotoProfil) {
            return null;
        }

        // Sudah full URL (upload via R2 setelah fix ini)
        if (str_starts_with($fotoProfil, 'http://') || str_starts_with($fotoProfil, 'https://')) {
            return $fotoProfil;
        }

        // Format lama: cuma nama file, disimpan di local disk. Bangun
        // absolute URL memakai APP_URL agar tidak salah resolve ke domain
        // frontend (bug lama: path relatif /server/... di-resolve browser
        // ke domain Vercel, bukan Render).
        $appUrl = rtrim(Config::get('app.url', 'http://localhost:8080'), '/');
        return "{$appUrl}/server/foto/{$type}/{$fotoProfil}";
    }

    // ── POST /api/profile/foto ────────────────────────────────────────────────

    public function uploadFoto(): void
    {
        $user = $this->auth->user();

        if (!isset($_FILES['foto'])) {
            Response::error(
                'File tidak diterima. Pastikan format multipart/form-data dan ukuran <= 10 MB.',
                ['php_post_max' => ini_get('post_max_size'), 'php_upload_max' => ini_get('upload_max_filesize')],
                400
            );
            return;
        }

        $file = $_FILES['foto'];

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

        if ($file['size'] > self::FOTO_MAX_BYTES) {
            Response::error('Ukuran foto maksimal 10 MB.', [], 422);
            return;
        }

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
        $type   = $isGuru ? 'guru' : 'siswa';
        $now    = date('Y-m-d H:i:s');

        try {
            $ownerRow = $isGuru
                ? DB::table('guru_staff as g')
                    ->join('users as u', 'u.guru_id', '=', 'g.guru_id')
                    ->where('u.user_id', '=', (int) $user->user_id)
                    ->select(['g.guru_id as owner_id', 'g.foto_profil'])
                    ->first()
                : DB::table('siswa as s')
                    ->join('users as u', 'u.siswa_id', '=', 's.siswa_id')
                    ->leftJoin('profil_siswa as ps', 'ps.siswa_id', '=', 's.siswa_id')
                    ->where('u.user_id', '=', (int) $user->user_id)
                    ->select(['s.siswa_id as owner_id', 'ps.profil_id', 'ps.foto_profil'])
                    ->first();

            if (!$ownerRow) {
                Response::error('Data pemilik profil tidak ditemukan.', [], 404);
                return;
            }

            $ownerId  = (int) $ownerRow->owner_id;
            $filename = "{$type}_{$ownerId}_" . time() . ".{$ext}";
            $contents = file_get_contents($file['tmp_name']);

            $fotoUrlToStore = null;

            // ── Prioritas 1: Upload ke R2 (persisten, survive redeploy) ────────
            if ($this->storage->isEnabled()) {
                try {
                    $fotoUrlToStore = $this->storage->put(
                        "foto-profil/{$type}/{$filename}",
                        $contents,
                        $mimeType
                    );

                    // Hapus foto lama di R2 kalau formatnya juga full URL R2
                    if ($ownerRow->foto_profil && str_starts_with($ownerRow->foto_profil, 'http')) {
                        $oldKey = $this->extractR2Key($ownerRow->foto_profil, $type);
                        if ($oldKey) {
                            $this->storage->delete($oldKey);
                        }
                    }
                } catch (\Throwable $e) {
                    error_log('[ProfileController] R2 upload gagal, fallback ke local: ' . $e->getMessage());
                    $fotoUrlToStore = null; // lanjut ke fallback di bawah
                }
            }

            // ── Fallback: Local disk (tidak persisten di Render) ────────────────
            if ($fotoUrlToStore === null) {
                $dir = $isGuru ? self::FOTO_DIR_GURU : self::FOTO_DIR_SISWA;

                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                if (!is_writable($dir)) {
                    Response::error("Folder upload tidak writable: {$dir}", [], 500);
                    return;
                }

                // Hapus foto lama lokal (kalau formatnya nama file, bukan URL R2)
                if ($ownerRow->foto_profil
                    && !str_starts_with($ownerRow->foto_profil, 'http')
                    && file_exists($dir . $ownerRow->foto_profil)
                ) {
                    unlink($dir . $ownerRow->foto_profil);
                }

                if (!move_uploaded_file($file['tmp_name'], $dir . $filename)) {
                    Response::error('Gagal menyimpan file foto ke server.', [], 500);
                    return;
                }

                $appUrl = rtrim(Config::get('app.url', 'http://localhost:8080'), '/');
                $fotoUrlToStore = "{$appUrl}/server/foto/{$type}/{$filename}";
            }

            // ── Simpan referensi ke database (selalu full URL) ──────────────────
            if ($isGuru) {
                DB::table('guru_staff')
                    ->where('guru_id', $ownerId)
                    ->update(['foto_profil' => $fotoUrlToStore, 'updated_at' => $now]);
            } else {
                if ($ownerRow->profil_id) {
                    DB::table('profil_siswa')
                        ->where('siswa_id', $ownerId)
                        ->update(['foto_profil' => $fotoUrlToStore, 'updated_at' => $now]);
                } else {
                    DB::table('profil_siswa')->insert([
                        'siswa_id'    => $ownerId,
                        'foto_profil' => $fotoUrlToStore,
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Response::error('Gagal mengupload foto: ' . $e->getMessage(), [], 500);
            return;
        }

        Response::success('Foto profil berhasil diperbarui.', [
            'foto_url' => $fotoUrlToStore,
        ]);
    }

    /**
     * Ekstrak R2 object key dari full URL, dipakai untuk hapus foto lama.
     * Contoh: https://pub-xxx.r2.dev/foto-profil/guru/guru_5_123.jpg
     *      -> foto-profil/guru/guru_5_123.jpg
     */
    private function extractR2Key(string $url, string $type): ?string
    {
        $marker = "foto-profil/{$type}/";
        $pos = strpos($url, $marker);
        return $pos !== false ? substr($url, $pos) : null;
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
