<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\UsersService;

/**
 * UsersCreateController
 *
 * POST /api/users — create new user
 */
final class UsersCreateController
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

        try {
            $created = $this->service->create($this->request->body());
            Response::success('Pengguna berhasil dibuat.', ['user' => $created], 201);
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), [], 422);
        } catch (\RuntimeException $e) {
            Response::error($e->getMessage(), [], 409);
        }
    }
}
