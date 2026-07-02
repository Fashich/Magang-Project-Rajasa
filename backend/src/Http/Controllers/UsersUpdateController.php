<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\UsersService;

/**
 * UsersUpdateController
 *
 * PATCH /api/users/{id} — update user email, status, atau user_type
 */
final class UsersUpdateController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
        private readonly Request        $request,
        private readonly UsersService   $service,
    ) {}

    public function __invoke(string $id): void
    {
        $id   = (int) $id;
        $user = $this->auth->user();

        if ($user->user_type !== 'admin') {
            Response::error('Akses ditolak.', [], 403);
            return;
        }

        try {
            $updated = $this->service->update($id, $this->request->body());
            Response::success('Pengguna berhasil diperbarui.', ['user' => $updated]);
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), [], 422);
        } catch (\RuntimeException $e) {
            $msg = $e->getMessage();
            $code = str_contains($msg, 'tidak ditemukan') ? 404 : 409;
            Response::error($msg, [], $code);
        }
    }
}
