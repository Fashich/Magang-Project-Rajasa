<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\UsersService;

/**
 * UsersDeleteController
 *
 * DELETE /api/users/{id} — delete user (with self-delete protection)
 */
final class UsersDeleteController
{
    public function __construct(
        private readonly AuthMiddleware $auth,
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
            $this->service->delete($id, (int) $user->user_id);
            Response::success('Pengguna berhasil dihapus.');
        } catch (\RuntimeException $e) {
            $msg  = $e->getMessage();
            $code = str_contains($msg, 'tidak ditemukan') ? 404
                  : (str_contains($msg, 'sendiri') ? 403 : 400);
            Response::error($msg, [], $code);
        }
    }
}
