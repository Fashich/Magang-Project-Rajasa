<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Http\Controllers;

use Rajasa\PresensiSiswa\Core\Response;

final class AuthLogoutController
{
    public function __invoke(): void
    {
        Response::success('Logout berhasil.', [
            'note' => 'Token stateless. Hapus token di sisi client.',
        ]);
    }
}