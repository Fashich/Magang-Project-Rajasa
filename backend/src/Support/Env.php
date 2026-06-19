<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Support;

final class Env
{
    public static function get(string $key, mixed $default = null): mixed
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

        return $value === false || $value === null || $value === ''
            ? $default
            : $value;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = self::get($key, $default);

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public static function int(string $key, int $default = 0): int
    {
        return (int) self::get($key, $default);
    }
}