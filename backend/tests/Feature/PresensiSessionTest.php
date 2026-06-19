<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class PresensiSessionTest extends TestCase
{
    public function test_create_rombel_session_with_kelas_room(): void
    {
        $token = $this->loginAndGetToken();
        $rombelId = $this->firstRombelId();
        $jamIds = $this->firstJamIds(1);

        if (!$rombelId || count($jamIds) < 1) {
            $this->markTestSkipped('Data rombel atau jam pembelajaran demo belum tersedia.');
        }

        $response = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'rombel',
            'rombel_id' => $rombelId,
            'jam_ids' => $jamIds,
            'ruang_pilihan' => 'kelas',
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code']);
        $this->assertTrue($response['success']);
        $this->assertSame('Sesi presensi berhasil dibuat.', $response['message']);
        $this->assertSame('kelas', $response['data']['session']['ruang_pilihan']);

        $sessionId = (int) $response['data']['session']['presensi_sesi_id'];

        $this->runApp('POST', "/api/presensi/sesi/{$sessionId}/finish", [], [
            'Authorization' => 'Bearer ' . $token,
        ]);
    }

    public function test_create_session_rejects_duplicate_active_rombel_same_jam(): void
    {
        $token = $this->loginAndGetToken();
        $rombelId = $this->firstRombelId();
        $jamIds = $this->firstJamIds(1);

        if (!$rombelId || count($jamIds) < 1) {
            $this->markTestSkipped('Data rombel atau jam pembelajaran demo belum tersedia.');
        }

        $first = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'rombel',
            'rombel_id' => $rombelId,
            'jam_ids' => $jamIds,
            'ruang_pilihan' => 'kelas',
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $first['__status_code']);

        $second = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'rombel',
            'rombel_id' => $rombelId,
            'jam_ids' => $jamIds,
            'ruang_pilihan' => 'kelas',
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(409, $second['__status_code']);
        $this->assertFalse($second['success']);
        $this->assertSame('Rombel sudah memiliki sesi aktif pada jam yang dipilih.', $second['message']);

        $sessionId = (int) $first['data']['session']['presensi_sesi_id'];

        $this->runApp('POST', "/api/presensi/sesi/{$sessionId}/finish", [], [
            'Authorization' => 'Bearer ' . $token,
        ]);
    }

    public function test_create_session_requires_token(): void
    {
        $response = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'piket',
            'jam_ids' => [1],
        ]);

        $this->assertSame(401, $response['__status_code']);
        $this->assertFalse($response['success']);
    }

    public function test_create_session_rejects_more_than_three_jams(): void
    {
        $token = $this->loginAndGetToken();
        $rombelId = $this->firstRombelId();

        $response = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'rombel',
            'rombel_id' => $rombelId,
            'jam_ids' => [1, 2, 3, 4],
            'ruang_pilihan' => 'kelas',
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(422, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Jam pelajaran maksimal 3 jam.', $response['message']);
    }

    public function test_pause_resume_finish_session(): void
    {
        $token = $this->loginAndGetToken();
        $rombelId = $this->firstRombelId();
        $jamIds = $this->firstJamIds(1);

        if (!$rombelId || count($jamIds) < 1) {
            $this->markTestSkipped('Data rombel atau jam pembelajaran demo belum tersedia.');
        }

        $create = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'rombel',
            'rombel_id' => $rombelId,
            'jam_ids' => $jamIds,
            'ruang_pilihan' => 'lab-tkj-1',
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $sessionId = (int) $create['data']['session']['presensi_sesi_id'];

        $pause = $this->runApp('POST', "/api/presensi/sesi/{$sessionId}/pause", [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $pause['__status_code']);

        $resume = $this->runApp('POST', "/api/presensi/sesi/{$sessionId}/resume", [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $resume['__status_code']);

        $finish = $this->runApp('POST', "/api/presensi/sesi/{$sessionId}/finish", [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $finish['__status_code']);
        $this->assertTrue($finish['success']);
    }

    private function firstRombelId(): ?int
    {
        return DB::table('rombel')
            ->orderBy('rombel_id')
            ->value('rombel_id');
    }

    private function firstJamIds(int $limit): array
    {
        return DB::table('jam_pembelajaran')
            ->orderBy('jam_id')
            ->limit($limit)
            ->pluck('jam_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }
}