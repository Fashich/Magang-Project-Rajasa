<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Models\User;

final class AuthService
{
    public function __construct(
        private readonly TokenService $tokenService,
        private readonly PermissionService $permissionService
    ) {
    }

    public function login(string $username, string $password): array
    {
        $user = User::query()
            ->where('username', $username)
            ->first();

        if (!$user || !password_verify($password, $user->password_hash)) {
            throw new HttpException('Username atau password salah.', 401);
        }

        if ($user->status !== 'aktif') {
            throw new HttpException('Akun tidak aktif.', 403);
        }

        $token = $this->tokenService->create((int) $user->user_id);

        return [
            'token' => $token,
            'user' => $this->formatUser($user),
            'roles' => $this->permissionService->rolesForUser((int) $user->user_id),
            'permissions' => $this->permissionService->permissionsForUser((int) $user->user_id),
        ];
    }

    public function userFromToken(string $token): User
    {
        $payload = $this->tokenService->parse($token);

        $user = User::query()->find((int) $payload['user_id']);

        if (!$user || $user->status !== 'aktif') {
            throw new HttpException('Token tidak valid.', 401);
        }

        return $user;
    }

    public function formatUser(User $user): array
    {
        return [
            'user_id' => (int) $user->user_id,
            'username' => $user->username,
            'email' => $user->email,
            'user_type' => $user->user_type,
            'siswa_id' => $user->siswa_id,
            'guru_id' => $user->guru_id,
            'status' => $user->status,
        ];
    }
}