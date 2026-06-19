<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Core;

use RuntimeException;

final class HttpException extends RuntimeException
{
    public function __construct(
        string $message,
        private readonly int $statusCode = 400,
        private readonly array $errors = []
    ) {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }

    public function errors(): array
    {
        return $this->errors;
    }
}