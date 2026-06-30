<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * AdminSiswaController
 *
 * GET    /api/admin/siswa         → list semua siswa
 * POST   /api/admin/siswa         → buat akun siswa baru (default password = NISN)
 * GET    /api/admin/siswa/{id}    → detail satu siswa
 * PUT    /api/admin/siswa/{id}    → update data siswa
 * DELETE /api/admin/siswa/{id}    → nonaktifkan siswa
 */
final class AdminSiswaController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    private function requireAdmin(): ?object
    {
        $user = $this->auth->user();
        if ($user->user_type !== 'admin') {
            Response::error('Akses ditolak. Hanya admin yang dapat mengelola akun siswa.', [], 403);
            return null;
        }
        return $user;
    }

    // ── GET /api/admin/siswa ──────────────────────────────────────────────────

    public function index(): void
    {
        if (!$this->requireAdmin()) return;

        $params  = $this->request->query();
        $search  = $params['search'] ?? '';
        $status  = $params['status'] ?? '';
        $page    = max(1, (int) ($params['page'] ?? 1));
        $perPage = 20;

        $query = DB::table('siswa as s')
            ->leftJoin('users as u', 'u.siswa_id', '=', 's.siswa_id')
            ->leftJoin('jurusan as j', 'j.jurusan_id', '=', 's.jurusan_id_aktif')
            ->leftJoin('profil_siswa as ps', 'ps.siswa_id', '=', 's.siswa_id')
            ->select([
                's.siswa_id', 's.nisn', 's.nis', 's.nama_lengkap',
                's.jenis_kelamin', 's.angkatan', 's.kelas_aktif', 's.status',
                'j.nama_jurusan as jurusan',
                'ps.email', 'ps.no_telp', 'ps.foto_profil',
                'u.user_id', 'u.username', 'u.last_login_at',
            ])
            ->orderBy('s.nama_lengkap');

        if ($search) {
            $kw = '%' . $search . '%';
            $query->where(function ($q) use ($kw) {
                $q->where('s.nama_lengkap', 'LIKE', $kw)
                  ->orWhere('s.nisn',       'LIKE', $kw)
                  ->orWhere('s.nis',        'LIKE', $kw)
                  ->orWhere('u.username',   'LIKE', $kw);
            });
        }

        if ($status) $query->where('s.status', $status);

        $total = $query->count();
        $rows  = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        $data = $rows->map(function ($r) {
            $row = (array) $r;
            $row['foto_url'] = $row['foto_profil']
                ? '/server/foto/siswa/' . $row['foto_profil']
                : null;
            unset($row['foto_profil']);
            return $row;
        })->values()->all();

        Response::success('Data siswa.', [
            'data' => $data,
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ]);
    }

    // ── POST /api/admin/siswa ─────────────────────────────────────────────────

    public function store(): void
    {
        if (!$this->requireAdmin()) return;

        $body = $this->request->body();

        // Validasi wajib
        foreach (['nama_lengkap', 'username', 'nisn', 'angkatan'] as $f) {
            if (empty($body[$f])) {
                Response::error("Field '{$f}' wajib diisi.", [], 422);
                return;
            }
        }

        $namaLengkap  = trim($body['nama_lengkap']);
        $username     = trim($body['username']);
        $nisn         = trim($body['nisn']);
        $nis          = !empty($body['nis'])    ? trim($body['nis'])    : null;
        $email        = !empty($body['email'])  ? trim($body['email'])  : null;
        $noTelp       = !empty($body['no_telp'])? trim($body['no_telp']): null;
        $angkatan     = (int) $body['angkatan'];
        $jenisKelamin = !empty($body['jenis_kelamin']) ? $body['jenis_kelamin'] : null;
        $jurusanId    = !empty($body['jurusan_id'])    ? (int) $body['jurusan_id'] : null;
        $rombelId     = !empty($body['rombel_id'])     ? (int) $body['rombel_id']  : null;
        $kelasAktif   = !empty($body['kelas_aktif'])   ? trim($body['kelas_aktif']): null;

        if (strlen($nisn) < 8) {
            Response::error('NISN minimal 8 karakter.', [], 422);
            return;
        }

        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Format email tidak valid.', [], 422);
            return;
        }

        // Cek duplikat
        if (DB::table('users')->where('username', $username)->exists()) {
            Response::error("Username '{$username}' sudah digunakan.", [], 409);
            return;
        }

        if (DB::table('siswa')->where('nisn', $nisn)->exists()) {
            Response::error("NISN '{$nisn}' sudah terdaftar.", [], 409);
            return;
        }

        try {
            $result = DB::transaction(function () use (
                $namaLengkap, $username, $nisn, $nis, $email, $noTelp,
                $angkatan, $jenisKelamin, $jurusanId, $rombelId, $kelasAktif
            ) {
                $now = date('Y-m-d H:i:s');

                // 1. Insert siswa dulu
                $siswaId = DB::table('siswa')->insertGetId([
                    'nisn'             => $nisn,
                    'nis'              => $nis,
                    'nama_lengkap'     => $namaLengkap,
                    'jenis_kelamin'    => $jenisKelamin,
                    'angkatan'         => $angkatan,
                    'jurusan_id_aktif' => $jurusanId,
                    'rombel_id_aktif'  => $rombelId,
                    'kelas_aktif'      => $kelasAktif,
                    'status'           => 'aktif',
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);

                // 2. Insert profil_siswa jika ada data kontak
                if ($email || $noTelp) {
                    DB::table('profil_siswa')->insert([
                        'siswa_id'   => $siswaId,
                        'email'      => $email,
                        'no_telp'    => $noTelp,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }

                // 3. Password default = NISN
                $passwordHash = password_hash($nisn, PASSWORD_BCRYPT, ['cost' => 12]);

                // 4. Insert users dengan siswa_id
                $userId = DB::table('users')->insertGetId([
                    'username'      => $username,
                    'email'         => $email,
                    'password_hash' => $passwordHash,
                    'user_type'     => 'siswa',
                    'siswa_id'      => $siswaId,
                    'status'        => 'aktif',
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);

                return ['siswa_id' => $siswaId, 'user_id' => $userId];
            });

            Response::success('Akun siswa berhasil dibuat. Password default = NISN.', $result, 201);

        } catch (\Throwable $e) {
            Response::error('Gagal membuat akun: ' . $e->getMessage(), [], 500);
        }
    }

    // ── GET /api/admin/siswa/{id} ─────────────────────────────────────────────

    public function show(int $id): void
    {
        if (!$this->requireAdmin()) return;

        $row = DB::table('siswa as s')
            ->leftJoin('users as u', 'u.siswa_id', '=', 's.siswa_id')
            ->leftJoin('jurusan as j', 'j.jurusan_id', '=', 's.jurusan_id_aktif')
            ->leftJoin('profil_siswa as ps', 'ps.siswa_id', '=', 's.siswa_id')
            ->where('s.siswa_id', $id)
            ->select(['s.*', 'j.nama_jurusan as jurusan',
                      'ps.alamat', 'ps.no_telp', 'ps.email', 'ps.nama_wali',
                      'ps.no_telp_wali', 'ps.foto_profil',
                      'u.user_id', 'u.username', 'u.last_login_at'])
            ->first();

        if (!$row) {
            Response::error('Siswa tidak ditemukan.', [], 404);
            return;
        }

        $data = (array) $row;
        $data['foto_url'] = $data['foto_profil']
            ? '/server/foto/siswa/' . $data['foto_profil']
            : null;

        Response::success('Detail siswa.', ['siswa' => $data]);
    }

    // ── PUT /api/admin/siswa/{id} ─────────────────────────────────────────────

    public function update(int $id): void
    {
        if (!$this->requireAdmin()) return;

        $siswa = DB::table('siswa')->where('siswa_id', $id)->first();
        if (!$siswa) {
            Response::error('Siswa tidak ditemukan.', [], 404);
            return;
        }

        $body = $this->request->body();
        $now  = date('Y-m-d H:i:s');

        $siswaUpdates = [];
        foreach (['nama_lengkap','nis','nisn','jenis_kelamin','angkatan',
                  'jurusan_id_aktif','rombel_id_aktif','kelas_aktif','status'] as $f) {
            if (array_key_exists($f, $body)) {
                $siswaUpdates[$f] = !empty($body[$f]) ? $body[$f] : null;
            }
        }

        if ($siswaUpdates) {
            $siswaUpdates['updated_at'] = $now;
            DB::table('siswa')->where('siswa_id', $id)->update($siswaUpdates);
        }

        // Update profil_siswa jika ada
        $profilUpdates = [];
        foreach (['email','no_telp','alamat','nama_wali','no_telp_wali'] as $f) {
            if (array_key_exists($f, $body)) {
                $profilUpdates[$f] = !empty($body[$f]) ? $body[$f] : null;
            }
        }

        if ($profilUpdates) {
            $profilUpdates['updated_at'] = $now;
            $exists = DB::table('profil_siswa')->where('siswa_id', $id)->exists();
            if ($exists) {
                DB::table('profil_siswa')->where('siswa_id', $id)->update($profilUpdates);
            } else {
                $profilUpdates['siswa_id']   = $id;
                $profilUpdates['created_at'] = $now;
                DB::table('profil_siswa')->insert($profilUpdates);
            }
        }

        Response::success('Data siswa berhasil diperbarui.');
    }

    // ── DELETE /api/admin/siswa/{id} ──────────────────────────────────────────

    public function destroy(int $id): void
    {
        if (!$this->requireAdmin()) return;

        if (!DB::table('siswa')->where('siswa_id', $id)->exists()) {
            Response::error('Siswa tidak ditemukan.', [], 404);
            return;
        }

        DB::table('siswa')
            ->where('siswa_id', $id)
            ->update(['status' => 'nonaktif', 'updated_at' => date('Y-m-d H:i:s')]);

        DB::table('users')
            ->where('siswa_id', $id)
            ->update(['status' => 'nonaktif', 'updated_at' => date('Y-m-d H:i:s')]);

        Response::success('Akun siswa berhasil dinonaktifkan.');
    }
}
