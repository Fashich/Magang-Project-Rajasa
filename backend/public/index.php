<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use Rajasa\PresensiSiswa\Core\ExceptionHandler;
use Rajasa\PresensiSiswa\Support\Config;

try {
    require __DIR__ . '/../boilerplate/app.php';
} catch (Throwable $exception) {
    require __DIR__ . '/../vendor/autoload.php';

    if (file_exists(__DIR__ . '/../.env')) {
        Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();
    }

    if (class_exists(Config::class)) {
        Config::load(require __DIR__ . '/../boilerplate/config.php');
    }

    ExceptionHandler::handle($exception);
}