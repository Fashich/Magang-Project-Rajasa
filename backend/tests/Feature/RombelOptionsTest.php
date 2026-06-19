<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class RombelOptionsTest extends TestCase
{
    public function test_rombel_options_requires_token(): void
    {
        $response = $this->runApp('GET', '/api/rombel/options');

        $this->assertSame(401, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Token tidak ditemukan.', $response['message']);
    }

    public function test_rombel_options_returns_active_rombel_for_demo_dropdown(): void
    {
        $token = $this->loginAndGetToken();

        $response = $this->runApp('GET', '/api/rombel/options', [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(
            200,
            $response['__status_code'],
            json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
        $this->assertTrue($response['success']);
        $this->assertSame('Daftar rombel aktif.', $response['message']);
        $this->assertIsArray($response['data']['rombel']);
        $this->assertNotEmpty($response['data']['rombel']);

        $first = $response['data']['rombel'][0];

        $this->assertArrayHasKey('rombel_id', $first);
        $this->assertArrayHasKey('label', $first);
        $this->assertArrayHasKey('label_rombel', $first);
        $this->assertArrayHasKey('label_rombel_raw', $first);
        $this->assertArrayHasKey('tingkatan', $first);
        $this->assertArrayHasKey('tingkat_angka', $first);
        $this->assertArrayHasKey('nomor_rombel', $first);
        $this->assertArrayHasKey('jurusan_id', $first);
        $this->assertArrayHasKey('status', $first);

        $this->assertIsInt($first['rombel_id']);
        $this->assertNotSame('', trim((string) $first['label']));
        $this->assertSame('aktif', $first['status']);
    }

    public function test_rombel_options_matches_active_database_rows_without_excluding_seed_demo(): void
    {
        $token = $this->loginAndGetToken();

        $expectedCount = DB::table('rombel')
            ->where('status', 'aktif')
            ->count();

        $expectedFirst = DB::table('rombel')
            ->leftJoin('jurusan', 'jurusan.jurusan_id', '=', 'rombel.jurusan_id')
            ->where('rombel.status', 'aktif')
            ->orderBy('rombel.tingkat_angka')
            ->orderBy('jurusan.kode_jurusan')
            ->orderBy('rombel.nomor_rombel')
            ->orderBy('rombel.rombel_id')
            ->first([
                'rombel.rombel_id',
                'rombel.label_rombel',
                'rombel.label_rombel_raw',
            ]);

        $response = $this->runApp('GET', '/api/rombel/options', [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $rombel = $response['data']['rombel'] ?? [];

        $this->assertSame((int) $expectedCount, count($rombel));
        $this->assertNotNull($expectedFirst);
        $this->assertSame((int) $expectedFirst->rombel_id, $rombel[0]['rombel_id']);

        $expectedLabel = trim((string) ($expectedFirst->label_rombel ?? ''));
        $expectedRawLabel = trim((string) ($expectedFirst->label_rombel_raw ?? ''));

        if ($expectedLabel === '') {
            $expectedLabel = $expectedRawLabel !== '' ? $expectedRawLabel : 'Rombel #' . (int) $expectedFirst->rombel_id;
        }

        $this->assertSame($expectedLabel, $rombel[0]['label']);
    }
}