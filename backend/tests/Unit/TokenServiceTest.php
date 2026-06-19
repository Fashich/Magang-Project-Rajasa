<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Unit;

use Rajasa\PresensiSiswa\Core\HttpException;
use Rajasa\PresensiSiswa\Services\TokenService;
use Rajasa\PresensiSiswa\Support\Config;
use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class TokenServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $_ENV['APP_ENV'] = 'testing';
        putenv('APP_ENV=testing');

        Config::load(require __DIR__ . '/../../boilerplate/config.php');
    }

    public function test_token_can_be_created_and_parsed(): void
    {
        $service = new TokenService();

        $token = $service->create(1);
        $payload = $service->parse($token);

        $this->assertSame(1, (int) $payload['user_id']);
        $this->assertArrayHasKey('exp', $payload);
    }

    public function test_invalid_token_is_rejected(): void
    {
        $this->expectException(HttpException::class);

        (new TokenService())->parse('token-rusak');
    }
}