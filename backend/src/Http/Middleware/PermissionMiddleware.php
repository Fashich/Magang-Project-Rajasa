<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Middleware;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Services\PermissionService;

final class PermissionMiddleware
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly PermissionService $permissionService
    ) {
    }

    public function require(string $permission): void
    {
        $user = $this->auth->user();

        if (!$this->permissionService->has((int) $user->user_id, $permission)) {
            throw new HttpException('Tidak punya akses.', 403);
        }
    }
}