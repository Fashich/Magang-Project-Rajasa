<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Http\Middleware\AuthMiddleware;
use Rajasa\PresensiSiswa\Services\UsersService;

/**
 * UsersResetPasswordController
 *
 * POST /api/users/{id}/reset-password — admin reset password user lain
 */
final class UsersResetPasswordController
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

        $body        = $this->request->body();
        $newPassword = $body['new_password'] ?? '';

        if (empty($newPassword)) {
            Response::error('Field new_password wajib diisi.', [], 422);
            return;
        }

        try {
            $this->service->resetPassword($id, $newPassword);
            Response::success('Password berhasil direset.');
        } catch (\InvalidArgumentException $e) {
            Response::error($e->getMessage(), [], 422);
        } catch (\RuntimeException $e) {
            $msg  = $e->getMessage();
            $code = str_contains($msg, 'tidak ditemukan') ? 404 : 400;
            Response::error($msg, [], $code);
        }
    }
}
