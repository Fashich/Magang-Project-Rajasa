<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\Response;
use Rajasa\PresensiSiswa\Services\AuthService;

final class AuthLoginController
{
    public function __construct(
        private readonly Request $request,
        private readonly AuthService $authService
    ) {
    }

    public function __invoke(): void
    {
        $username = trim((string) $this->request->input('username', ''));
        $password = (string) $this->request->input('password', '');

        if ($username === '' || $password === '') {
            throw new HttpException('Validasi gagal.', 422, [
                'username' => 'Username wajib diisi.',
                'password' => 'Password wajib diisi.',
            ]);
        }

        Response::success('Login berhasil.', $this->authService->login($username, $password));
    }
}