<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use Rajasa\PresensiSiswa\Core\Request;
use Rajasa\PresensiSiswa\Core\RouteDispatcher;
use Rajasa\PresensiSiswa\Http\Middleware\CorsMiddleware;
use Rajasa\PresensiSiswa\Support\Config;

require __DIR__ . '/../vendor/autoload.php';

if (file_exists(__DIR__ . '/../.env')) {
    Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();
}

date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Asia/Jakarta');

Config::load(require __DIR__ . '/config.php');

$bootDatabase = require __DIR__ . '/database.php';
$bootDatabase();

(new CorsMiddleware())->handle();

$createContainer = require __DIR__ . '/container.php';
$container = $createContainer();

$dispatcher = require __DIR__ . '/routes.php';

$request = $container->get(Request::class);

$routeDispatcher = new RouteDispatcher($dispatcher, $container);
$routeDispatcher->dispatch($request);