<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Middleware;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Models\User;
use Rajasa\PresensiSiswa\Services\AuthService;

final class AuthMiddleware
{
    public function __construct(
        private readonly Request $request,
        private readonly AuthService $authService
    ) {
    }

    public function user(): User
    {
        $token = $this->request->bearerToken();

        if (!$token) {
            throw new HttpException('Token tidak ditemukan.', 401);
        }

        return $this->authService->userFromToken($token);
    }
}