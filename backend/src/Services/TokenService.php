<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Support\Config;

final class TokenService
{
    public function create(int $userId): string
    {
        $now = time();
        $ttl = (int) Config::get('auth.token_ttl_minutes', 720);

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $payload = [
            'user_id' => $userId,
            'iat' => $now,
            'exp' => $now + ($ttl * 60),
        ];

        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload));

        $signature = $this->sign($headerEncoded . '.' . $payloadEncoded);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signature;
    }

    public function parse(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new HttpException('Token tidak valid.', 401);
        }

        [$headerEncoded, $payloadEncoded, $signature] = $parts;

        $expectedSignature = $this->sign($headerEncoded . '.' . $payloadEncoded);

        if (!hash_equals($expectedSignature, $signature)) {
            throw new HttpException('Token tidak valid.', 401);
        }

        $payload = json_decode($this->base64UrlDecode($payloadEncoded), true);

        if (!is_array($payload) || empty($payload['user_id'])) {
            throw new HttpException('Token tidak valid.', 401);
        }

        if (($payload['exp'] ?? 0) < time()) {
            throw new HttpException('Token sudah kedaluwarsa.', 401);
        }

        return $payload;
    }

    private function sign(string $value): string
    {
        $secret = (string) Config::get('auth.secret');

        return $this->base64UrlEncode(hash_hmac('sha256', $value, $secret, true));
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/')) ?: '';
    }
}