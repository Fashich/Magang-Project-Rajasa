<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class HealthEndpointTest extends TestCase
{
    public function test_health_endpoint_returns_success_response(): void
    {
        $response = $this->runApp('GET', '/api/health');

        $this->assertSame(200, $response['__status_code']);
        $this->assertTrue($response['success']);
        $this->assertSame('Backend API is running', $response['message']);
        $this->assertSame('presensi-siswa-api', $response['data']['service']);
        $this->assertSame('testing', $response['data']['env']);
        $this->assertSame('ok', $response['data']['status']);
    }

    public function test_not_found_endpoint_returns_404_response(): void
    {
        $response = $this->runApp('GET', '/api/not-found');

        $this->assertSame(404, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Endpoint tidak ditemukan.', $response['message']);
    }

    public function test_wrong_method_returns_405_response(): void
    {
        $response = $this->runApp('POST', '/api/health');

        $this->assertSame(405, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Method tidak diizinkan.', $response['message']);
    }
}