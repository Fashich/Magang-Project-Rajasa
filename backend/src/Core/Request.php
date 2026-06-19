<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Core;

final class Request
{
    private ?array $cachedBody = null;

    public function file(string $key): ?array
    {
        return $_FILES[$key] ?? null;
    }
    
    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function uri(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';

        if (false !== $pos = strpos($uri, '?')) {
            return substr($uri, 0, $pos);
        }

        return $uri;
    }

    public function query(): array
    {
        return $_GET;
    }

    public function body(): array
    {
        if ($this->cachedBody !== null) {
            return $this->cachedBody;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw = $this->rawBody();

            if ($raw === '') {
                return $this->cachedBody = [];
            }

            $decoded = json_decode($raw, true);

            if (!is_array($decoded)) {
                throw new HttpException('Body JSON tidak valid.', 422, [
                    'body' => 'Format JSON tidak bisa dibaca.',
                ]);
            }

            return $this->cachedBody = $decoded;
        }

        return $this->cachedBody = $_POST;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body()[$key] ?? $this->query()[$key] ?? $default;
    }

    public function header(string $key, mixed $default = null): mixed
    {
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $key));

        return $_SERVER[$serverKey]
            ?? $_SERVER['REDIRECT_' . $serverKey]
            ?? $default;
    }

    public function bearerToken(): ?string
    {
        $authorization = $this->header('Authorization');

        if (!$authorization || !str_starts_with($authorization, 'Bearer ')) {
            return null;
        }

        return trim(substr($authorization, 7));
    }

    private function rawBody(): string
    {
        if (array_key_exists('__TEST_RAW_BODY', $GLOBALS)) {
            return (string) $GLOBALS['__TEST_RAW_BODY'];
        }

        return file_get_contents('php://input') ?: '';
    }
}