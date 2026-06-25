<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\AuthService;
use Rajasa\PresensiSiswa\Services\PermissionService;

final class MeController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly AuthService $authService,
        private readonly PermissionService $permissionService
    ) {
    }

    public function __invoke(): void
    {
        $user = $this->auth->user();
        $userId = (int) $user->user_id;

        $userData = $this->authService->formatUser($user);
        // Tambah linked_siswa_id untuk role ortu
        $userData['linked_siswa_id'] = isset($user->linked_siswa_id)
            ? (int) $user->linked_siswa_id
            : null;

        Response::success('Data user aktif.', [
            'user' => $userData,
            'roles' => $this->permissionService->rolesForUser($userId),
            'permissions' => $this->permissionService->permissionsForUser($userId),
        ]);
    }
}