<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;

/**
 * AdminGuruController
 *
 * GET    /api/admin/guru         → list semua guru & staff
 * POST   /api/admin/guru         → buat akun guru baru (default password = NIP)
 * GET    /api/admin/guru/{id}    → detail satu guru
 * PUT    /api/admin/guru/{id}    → update data guru
 * DELETE /api/admin/guru/{id}    → nonaktifkan guru
 */
final class AdminGuruController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
    ) {}

    private function requireAdmin(): ?object
    {
        $user = $this->auth->user();
        if (!in_array($user->user_type, ['admin'], true)) {
            Response::error('Akses ditolak. Hanya admin yang dapat mengelola akun guru.', [], 403);
            return null;
        }
        return $user;
    }

    // ── GET /api/admin/guru ───────────────────────────────────────────────────

    public function index(): void
    {
        if (!$this->requireAdmin()) return;

        $params  = $this->request->query();
        $search  = $params['search']     ?? '';
        $jenis   = $params['jenis_user'] ?? '';
        $status  = $params['status']     ?? '';
        $page    = max(1, (int) ($params['page'] ?? 1));
        $perPage = 15;

        $query = DB::table('guru_staff as g')
            ->leftJoin('users as u', 'u.guru_id', '=', 'g.guru_id')
            ->select([
                'g.guru_id', 'g.nip', 'g.nama_lengkap', 'g.no_telp',
                'g.email', 'g.jabatan', 'g.mapel_pengampu',
                'g.status_kepegawaian', 'g.jenis_user', 'g.status',
                'g.foto_profil', 'g.created_at',
                'u.user_id', 'u.username', 'u.last_login_at',
            ])
            ->orderBy('g.nama_lengkap');

        if ($search) {
            $kw = '%' . $search . '%';
            $query->where(function ($q) use ($kw) {
                $q->where('g.nama_lengkap', 'LIKE', $kw)
                  ->orWhere('g.nip',        'LIKE', $kw)
                  ->orWhere('u.username',   'LIKE', $kw);
            });
        }

        if ($jenis)  $query->where('g.jenis_user', $jenis);
        if ($status) $query->where('g.status',     $status);

        $total = $query->count();
        $rows  = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        $data = $rows->map(function ($r) {
            $row = (array) $r;
            $row['foto_url'] = $row['foto_profil']
                ? '/server/foto/guru/' . $row['foto_profil']
                : null;
            unset($row['foto_profil']);
            return $row;
        })->values()->all();

        Response::success('Data guru & staff.', [
            'data' => $data,
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ]);
    }

    // ── POST /api/admin/guru ──────────────────────────────────────────────────

    public function store(): void
    {
        if (!$this->requireAdmin()) return;

        $body = $this->request->body();

        // Validasi field wajib
        $required = ['nama_lengkap', 'username', 'jenis_user'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::error("Field '{$field}' wajib diisi.", [], 422);
                return;
            }
        }

        $namaLengkap       = trim($body['nama_lengkap']);
        $username          = trim($body['username']);
        $nip               = !empty($body['nip']) ? trim($body['nip']) : null;
        $email             = !empty($body['email']) ? trim($body['email']) : null;
        $noTelp            = !empty($body['no_telp']) ? trim($body['no_telp']) : null;
        $jabatan           = !empty($body['jabatan']) ? trim($body['jabatan']) : null;
        $mapelPengampu     = !empty($body['mapel_pengampu']) ? trim($body['mapel_pengampu']) : null;
        $statusKepegawaian = !empty($body['status_kepegawaian']) ? $body['status_kepegawaian'] : null;
        $jenisUser         = $body['jenis_user'];

        $allowedJenis = ['guru', 'staff', 'admin', 'intern'];
        if (!in_array($jenisUser, $allowedJenis, true)) {
            Response::error("jenis_user tidak valid.", [], 422);
            return;
        }

        // Guru wajib NIP
        if ($jenisUser === 'guru' && empty($nip)) {
            Response::error('NIP wajib diisi untuk jenis_user guru.', [], 422);
            return;
        }

        if ($nip && strlen($nip) < 8) {
            Response::error('NIP minimal 8 karakter.', [], 422);
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

        if ($nip && DB::table('guru_staff')->where('nip', $nip)->exists()) {
            Response::error("NIP '{$nip}' sudah terdaftar.", [], 409);
            return;
        }

        try {
            $result = DB::transaction(function () use (
                $namaLengkap, $username, $nip, $email, $noTelp,
                $jabatan, $mapelPengampu, $statusKepegawaian, $jenisUser
            ) {
                $now = date('Y-m-d H:i:s');

                // 1. Insert guru_staff dulu (trigger DB butuh ini sebelum users)
                $guruId = DB::table('guru_staff')->insertGetId([
                    'nip'                => $nip,
                    'nama_lengkap'       => $namaLengkap,
                    'no_telp'            => $noTelp,
                    'email'              => $email,
                    'jabatan'            => $jabatan,
                    'mapel_pengampu'     => $mapelPengampu,
                    'status_kepegawaian' => $statusKepegawaian,
                    'jenis_user'         => $jenisUser,
                    'status'             => 'aktif',
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ]);

                // 2. Password default = NIP (atau username jika tidak ada NIP)
                $defaultPassword = $nip ?? $username;
                $passwordHash    = password_hash($defaultPassword, PASSWORD_BCRYPT, ['cost' => 12]);

                // 3. Insert users dengan guru_id yang baru
                $userId = DB::table('users')->insertGetId([
                    'username'      => $username,
                    'email'         => $email,
                    'password_hash' => $passwordHash,
                    'user_type'     => $jenisUser,
                    'guru_id'       => $guruId,
                    'status'        => 'aktif',
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);

                return ['guru_id' => $guruId, 'user_id' => $userId];
            });

            Response::success('Akun guru berhasil dibuat. Password default = NIP.', $result, 201);

        } catch (\Throwable $e) {
            Response::error('Gagal membuat akun: ' . $e->getMessage(), [], 500);
        }
    }

    // ── GET /api/admin/guru/{id} ──────────────────────────────────────────────

    public function show(int $id): void
    {
        if (!$this->requireAdmin()) return;

        $row = DB::table('guru_staff as g')
            ->leftJoin('users as u', 'u.guru_id', '=', 'g.guru_id')
            ->where('g.guru_id', $id)
            ->select([
                'g.*', 'u.user_id', 'u.username', 'u.status as user_status', 'u.last_login_at',
            ])
            ->first();

        if (!$row) {
            Response::error('Guru tidak ditemukan.', [], 404);
            return;
        }

        $data = (array) $row;
        $data['foto_url'] = $data['foto_profil']
            ? '/server/foto/guru/' . $data['foto_profil']
            : null;

        Response::success('Detail guru.', ['guru' => $data]);
    }

    // ── PUT /api/admin/guru/{id} ──────────────────────────────────────────────

    public function update(int $id): void
    {
        if (!$this->requireAdmin()) return;

        $guru = DB::table('guru_staff')->where('guru_id', $id)->first();
        if (!$guru) {
            Response::error('Guru tidak ditemukan.', [], 404);
            return;
        }

        $body    = $this->request->body();
        $updates = [];
        $now     = date('Y-m-d H:i:s');

        $fields = ['nama_lengkap', 'nip', 'no_telp', 'email', 'jabatan',
                   'mapel_pengampu', 'status_kepegawaian', 'jenis_user', 'status'];

        foreach ($fields as $f) {
            if (array_key_exists($f, $body)) {
                $updates[$f] = !empty($body[$f]) ? trim((string) $body[$f]) : null;
            }
        }

        if (!empty($updates)) {
            $updates['updated_at'] = $now;
            DB::table('guru_staff')->where('guru_id', $id)->update($updates);
        }

        Response::success('Data guru berhasil diperbarui.');
    }

    // ── DELETE /api/admin/guru/{id} ───────────────────────────────────────────

    public function destroy(int $id): void
    {
        if (!$this->requireAdmin()) return;

        $guru = DB::table('guru_staff')->where('guru_id', $id)->first();
        if (!$guru) {
            Response::error('Guru tidak ditemukan.', [], 404);
            return;
        }

        // Soft delete — nonaktifkan saja
        DB::table('guru_staff')
            ->where('guru_id', $id)
            ->update(['status' => 'nonaktif', 'updated_at' => date('Y-m-d H:i:s')]);

        DB::table('users')
            ->where('guru_id', $id)
            ->update(['status' => 'nonaktif', 'updated_at' => date('Y-m-d H:i:s')]);

        Response::success('Akun guru berhasil dinonaktifkan.');
    }
}
