<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Core;

use Rajasa\PresensiSiswa\Support\Config;
use Throwable;

final class ExceptionHandler
{
    public static function handle(Throwable $exception): void
    {
        if ($exception instanceof HttpException) {
            Response::error(
                $exception->getMessage(),
                $exception->errors(),
                $exception->statusCode()
            );
            return;
        }

        $debug = Config::get('app.debug', false);

        Response::error('Terjadi kesalahan sistem.', $debug ? [
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ] : [], 500);
    }
}