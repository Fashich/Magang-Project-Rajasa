<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Support;

use PHPUnit\Framework\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function runApp(
        string $method,
        string $uri,
        array $body = [],
        array $headers = [],
        array $server = []
    ): array {
        $_GET = [];
        $_POST = [];

        $_ENV['APP_ENV'] = 'testing';
        $_SERVER['APP_ENV'] = 'testing';
        putenv('APP_ENV=testing');

        $serverHeaders = [];

        foreach ($headers as $name => $value) {
            $serverHeaders['HTTP_' . strtoupper(str_replace('-', '_', $name))] = $value;
        }

        $_SERVER = array_merge([
            'REQUEST_METHOD' => $method,
            'REQUEST_URI' => $uri,
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
            'APP_ENV' => 'testing',
        ], $serverHeaders, $server);

        $GLOBALS['__TEST_RAW_BODY'] = $body === []
            ? ''
            : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        ob_start();

        require __DIR__ . '/../../public/index.php';

        $content = ob_get_clean();
        $statusCode = http_response_code();

        http_response_code(200);
        unset($GLOBALS['__TEST_RAW_BODY']);

        $json = json_decode((string) $content, true) ?: [];
        $json['__status_code'] = $statusCode ?: 200;

        return $json;
    }

    protected function loginAndGetToken(
        string $username = 'admin.demo',
        string $password = 'Rajasa@123'
    ): string {
        $response = $this->runApp('POST', '/api/auth/login', [
            'username' => $username,
            'password' => $password,
        ]);

        return (string) ($response['data']['token'] ?? '');
    }
}