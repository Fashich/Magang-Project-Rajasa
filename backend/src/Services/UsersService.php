<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Models\User;

/**
 * UsersService
 *
 * Handles all business logic for user management (admin).
 */
final class UsersService
{
    private const PER_PAGE = 15;

    // ── List + pagination + search + filter ──────────────────────────────────

    public function list(array $params): array
    {
        $query = DB::table('users')
            ->select([
                'user_id', 'username', 'email', 'user_type',
                'status', 'last_login_at', 'created_at'])
            ->orderBy('created_at', 'desc');

        if (!empty($params['search'])) {
            $keyword = '%' . $params['search'] . '%';
            $query->where(function ($q) use ($keyword) {
                $q->where('username', 'LIKE', $keyword)
                  ->orWhere('email',    'LIKE', $keyword);
            });
        }

        if (!empty($params['user_type'])) {
            $query->where('user_type', $params['user_type']);
        }

        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        $page    = max(1, (int) ($params['page'] ?? 1));
        $perPage = self::PER_PAGE;
        $total   = $query->count();
        $items   = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        return [
            'data' => $items->map(fn ($u) => (array) $u)->values()->all(),
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
            ],
        ];
    }

    // ── Create ───────────────────────────────────────────────────────────────

    public function create(array $data): array
    {
        $this->validateRequiredFields($data, ['username', 'password', 'user_type']);

        $username  = trim($data['username']);
        $email     = !empty($data['email']) ? trim($data['email']) : null;
        $userType  = $data['user_type'];
        $status    = $data['status'] ?? 'aktif';

        $allowedTypes   = ['siswa', 'guru', 'admin'];
        $allowedStatuses = ['aktif', 'nonaktif', 'suspended'];

        if (!in_array($userType, $allowedTypes, true)) {
            throw new \InvalidArgumentException("user_type '$userType' tidak valid.");
        }

        if (!in_array($status, $allowedStatuses, true)) {
            throw new \InvalidArgumentException("status '$status' tidak valid.");
        }

        // Duplicate check
        $exists = DB::table('users')
            ->where('username', $username)
            ->exists();

        if ($exists) {
            throw new \RuntimeException("Username '$username' sudah digunakan.");
        }

        if ($email !== null) {
            $emailExists = DB::table('users')
                ->where('email', $email)
                ->exists();

            if ($emailExists) {
                throw new \RuntimeException("Email '$email' sudah digunakan.");
            }
        }

        $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $now          = now()->toDateTimeString();

        $userId = DB::table('users')->insertGetId([
            'username'      => $username,
            'email'         => $email,
            'password_hash' => $passwordHash,
            'user_type'     => $userType,
            'status'        => $status,
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        return $this->findOrFail($userId);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    public function update(int $userId, array $data): array
    {
        $user = $this->findOrFail($userId);

        $updates = [];

        if (isset($data['email'])) {
            $email = !empty($data['email']) ? trim($data['email']) : null;

            if ($email !== null) {
                $emailExists = DB::table('users')
                    ->where('email', $email)
                    ->where('user_id', '!=', $userId)
                    ->exists();

                if ($emailExists) {
                    throw new \RuntimeException("Email '$email' sudah digunakan.");
                }
            }

            $updates['email'] = $email;
        }

        if (isset($data['status'])) {
            $allowedStatuses = ['aktif', 'nonaktif', 'suspended'];
            if (!in_array($data['status'], $allowedStatuses, true)) {
                throw new \InvalidArgumentException("status '{$data['status']}' tidak valid.");
            }
            $updates['status'] = $data['status'];
        }

        if (isset($data['user_type'])) {
            $allowedTypes = ['siswa', 'guru', 'admin'];
            if (!in_array($data['user_type'], $allowedTypes, true)) {
                throw new \InvalidArgumentException("user_type '{$data['user_type']}' tidak valid.");
            }
            $updates['user_type'] = $data['user_type'];
        }

        if (!empty($updates)) {
            $updates['updated_at'] = now()->toDateTimeString();
            DB::table('users')->where('user_id', $userId)->update($updates);
        }

        return $this->findOrFail($userId);
    }

    // ── Reset Password ───────────────────────────────────────────────────────

    public function resetPassword(int $userId, string $newPassword): void
    {
        $this->findOrFail($userId);

        if (strlen($newPassword) < 6) {
            throw new \InvalidArgumentException('Password minimal 6 karakter.');
        }

        DB::table('users')
            ->where('user_id', $userId)
            ->update([
                'password_hash' => password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]),
                'updated_at'    => now()->toDateTimeString(),
            ]);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public function delete(int $userId, int $currentUserId): void
    {
        if ($userId === $currentUserId) {
            throw new \RuntimeException('Tidak bisa menghapus akun sendiri.');
        }

        $this->findOrFail($userId);

        DB::table('users')->where('user_id', $userId)->delete();
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private function findOrFail(int $userId): array
    {
        $user = DB::table('users')
            ->select(['user_id', 'username', 'email', 'user_type', 'status', 'last_login_at', 'created_at'])
            ->where('user_id', $userId)
            ->first();

        if ($user === null) {
            throw new \RuntimeException("User dengan ID $userId tidak ditemukan.");
        }

        return (array) $user;
    }

    private function validateRequiredFields(array $data, array $fields): void
    {
        foreach ($fields as $field) {
            if (empty($data[$field])) {
                throw new \InvalidArgumentException("Field '$field' wajib diisi.");
            }
        }
    }
}
