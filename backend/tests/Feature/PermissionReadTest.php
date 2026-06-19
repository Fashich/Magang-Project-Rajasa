<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class PermissionReadTest extends TestCase
{
    public function test_login_response_contains_roles_and_permissions(): void
    {
        $response = $this->runApp('POST', '/api/auth/login', [
            'username' => 'admin.demo',
            'password' => 'Rajasa@123',
        ]);

        $this->assertSame(200, $response['__status_code']);
        $this->assertTrue($response['success']);
        $this->assertIsArray($response['data']['roles']);
        $this->assertIsArray($response['data']['permissions']);
    }
}