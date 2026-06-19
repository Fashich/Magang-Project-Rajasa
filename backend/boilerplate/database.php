<?php

declare(strict_types=1);

use Illuminate\Database\Capsule\Manager as Capsule;
use Rajasa\PresensiSiswa\Support\Config;

return function (): Capsule {
    $capsule = new Capsule();

    $capsule->addConnection([
        'driver' => Config::get('database.driver', 'mysql'),
        'host' => Config::get('database.host', 'db'),
        'port' => Config::get('database.port', '3306'),
        'database' => Config::get('database.database'),
        'username' => Config::get('database.username'),
        'password' => Config::get('database.password'),
        'charset' => Config::get('database.charset', 'utf8mb4'),
        'collation' => Config::get('database.collation', 'utf8mb4_unicode_ci'),
        'prefix' => '',
    ]);

    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    return $capsule;
};