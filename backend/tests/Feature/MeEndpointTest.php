<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class MeEndpointTest extends TestCase
{
    public function test_me_endpoint_rejects_request_without_token(): void
    {
        $response = $this->runApp('GET', '/api/me');

        $this->assertSame(401, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Token tidak ditemukan.', $response['message']);
    }

    public function test_me_endpoint_returns_active_user(): void
    {
        $token = $this->loginAndGetToken();

        $response = $this->runApp('GET', '/api/me', [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $response['__status_code']);
        $this->assertTrue($response['success']);
        $this->assertSame('Data user aktif.', $response['message']);
        $this->assertSame('admin.demo', $response['data']['user']['username']);
        $this->assertIsArray($response['data']['roles']);
        $this->assertIsArray($response['data']['permissions']);
    }
}
