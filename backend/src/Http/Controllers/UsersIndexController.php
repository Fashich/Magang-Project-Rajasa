<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\UsersService;

/**
 * UsersIndexController
 *
 * GET /api/users — list users with pagination, search, filter
 */
final class UsersIndexController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
        private readonly UsersService   $service,
    ) {}

    public function __invoke(): void
    {
        $user = $this->auth->user();

        if ($user->user_type !== 'admin') {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        $result = $this->service->list($this->request->query());

        Response::success('Daftar pengguna.', $result);
    }
}
