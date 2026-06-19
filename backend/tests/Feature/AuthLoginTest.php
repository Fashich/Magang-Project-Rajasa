<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class AuthLoginTest extends TestCase
{
    public function test_login_success(): void
    {
        $response = $this->runApp('POST', '/api/auth/login', [
            'username' => 'admin.demo',
            'password' => 'Rajasa@123',
        ]);

        $this->assertSame(200, $response['__status_code']);
        $this->assertTrue($response['success']);
        $this->assertSame('Login berhasil.', $response['message']);
        $this->assertNotEmpty($response['data']['token']);
        $this->assertSame('admin.demo', $response['data']['user']['username']);
        $this->assertSame('admin', $response['data']['user']['user_type']);
        $this->assertNotEmpty($response['data']['roles']);
        $this->assertNotEmpty($response['data']['permissions']);
        $this->assertContains('dashboard.read', $response['data']['permissions']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $response = $this->runApp('POST', '/api/auth/login', [
            'username' => 'admin.demo',
            'password' => 'password-salah',
        ]);

        $this->assertSame(401, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Username atau password salah.', $response['message']);
    }

    public function test_login_fails_when_payload_empty(): void
    {
        $response = $this->runApp('POST', '/api/auth/login', []);

        $this->assertSame(422, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Validasi gagal.', $response['message']);
    }
}