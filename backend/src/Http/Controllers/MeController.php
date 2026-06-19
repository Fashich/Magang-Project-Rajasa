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

        Response::success('Data user aktif.', [
            'user' => $this->authService->formatUser($user),
            'roles' => $this->permissionService->rolesForUser($userId),
            'permissions' => $this->permissionService->permissionsForUser($userId),
        ]);
    }
}