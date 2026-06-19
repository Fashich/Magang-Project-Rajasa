<?php

declare(strict_types=1);

use Rajasa\PresensiSiswa\Support\Env;

return [
    'app' => [
        'name' => Env::get('APP_NAME', 'Presensi Siswa Rajasa'),
        'env' => Env::get('APP_ENV', 'local'),
        'debug' => Env::bool('APP_DEBUG', true),
        'url' => Env::get('APP_URL', 'http://localhost:8080'),
        'timezone' => Env::get('APP_TIMEZONE', 'Asia/Jakarta'),
    ],

    'database' => [
        'driver' => Env::get('DB_CONNECTION', 'mysql'),
        'host' => Env::get('DB_HOST', 'db'),
        'port' => Env::get('DB_PORT', '3306'),
        'database' => Env::get('DB_DATABASE', 'sistem_presensi_siswa_qr'),
        'username' => Env::get('DB_USERNAME', 'root'),
        'password' => Env::get('DB_PASSWORD', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    'auth' => [
        'secret' => Env::get('SESSION_SECRET', 'change_me_for_local_dev'),
        'token_ttl_minutes' => Env::int('ACCESS_TOKEN_TTL_MINUTES', 720),
    ],

    'cors' => [
        'allowed_origins' => array_map('trim', explode(',', Env::get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:8080'))),
        'allowed_methods' => Env::get('CORS_ALLOWED_METHODS', 'GET,POST,PUT,PATCH,DELETE,OPTIONS'),
        'allowed_headers' => Env::get('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization,X-Requested-With'),
    ],

    'presensi' => [
        'session_timeout_minutes' => Env::int('PRESENSI_SESSION_TIMEOUT_MINUTES', 20),
        'max_jam_per_sesi' => Env::int('PRESENSI_MAX_JAM_PER_SESI', 3),
    ],
];