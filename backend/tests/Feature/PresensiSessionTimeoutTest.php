<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class PresensiSessionTimeoutTest extends TestCase
{
    public function test_active_endpoint_expires_inactive_session_after_five_minutes(): void
    {
        $token = $this->loginAndGetToken();
        $sessionId = $this->createActiveSessionFixture();

        DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sessionId)
            ->update([
                'last_seen_at' => date('Y-m-d H:i:s', time() - 360),
                'updated_at' => date('Y-m-d H:i:s', time() - 360),
            ]);

        $response = $this->runApp('GET', '/api/presensi/sesi/aktif', [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $response['__status_code']);

        $session = DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sessionId)
            ->first();

        $this->assertSame('expired', $session->status);
        $this->assertSame('timeout', $session->ended_reason);
        $this->assertNotNull($session->ended_at);
    }

    public function test_heartbeat_keeps_active_session_alive(): void
    {
        $token = $this->loginAndGetToken();
        $sessionId = $this->createActiveSessionFixture();

        $response = $this->runApp('POST', "/api/presensi/sesi/{$sessionId}/heartbeat", [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $response['__status_code']);
        $this->assertTrue($response['success']);

        $session = DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sessionId)
            ->first();

        $this->assertSame('aktif', $session->status);
        $this->assertNotNull($session->last_seen_at);
        $this->assertNotNull($session->expires_at);
    }

    private function createActiveSessionFixture(): int
    {
        $now = date('Y-m-d H:i:s');
        $tanggal = date('Y-m-d');

        $userId = (int) DB::table('users')
            ->where('username', 'admin.demo')
            ->value('user_id');

        $tahunAjaranId = (int) DB::table('tahun_ajaran')->value('tahun_ajaran_id');

        if ($tahunAjaranId === 0) {
            $tahunAjaranId = (int) DB::table('tahun_ajaran')->insertGetId([
                'kode_tahun_ajaran' => '2026/2027',
                'nama_tahun_ajaran' => '2026/2027',
                'tanggal_mulai' => '2026-07-01',
                'tanggal_selesai' => '2027-06-30',
                'status' => 'aktif',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $jurusanId = (int) DB::table('jurusan')->insertGetId([
            'kode_jurusan' => 'TMO' . random_int(100, 999),
            'nama_jurusan' => 'Jurusan Test Timeout',
            'status' => 'aktif',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $rombelId = (int) DB::table('rombel')->insertGetId([
            'tahun_ajaran_id' => $tahunAjaranId,
            'tingkatan' => 'X',
            'tingkat_angka' => 10,
            'jurusan_id' => $jurusanId,
            'nomor_rombel' => 1,
            'is_nomor_rombel_inferred' => 1,
            'label_rombel' => '10 TIMEOUT 1',
            'label_rombel_raw' => '10 TIMEOUT 1',
            'display_mode' => 'dengan_nomor',
            'is_inferred_from_import' => 1,
            'status' => 'aktif',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $sessionId = (int) DB::table('presensi_sesi')->insertGetId([
            'session_uuid' => 'test-timeout-' . bin2hex(random_bytes(8)),
            'mode_presensi' => 'rombel',
            'rombel_id' => $rombelId,
            'tahun_ajaran_id' => $tahunAjaranId,
            'semester' => 'ganjil',
            'tanggal' => $tanggal,
            'status' => 'aktif',
            'ruang_pilihan' => 'kelas',
            'ruang_label_snapshot' => 'Kelas 10 TIMEOUT 1',
            'opened_by_user_id' => $userId,
            'started_at' => $now,
            'last_seen_at' => $now,
            'expires_at' => date('Y-m-d H:i:s', time() + 300),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $jamId = (int) DB::table('jam_pembelajaran')->value('jam_id');

        DB::table('presensi_sesi_jam')->insert([
            'presensi_sesi_id' => $sessionId,
            'jam_id' => $jamId,
            'urutan' => 1,
            'created_at' => $now,
        ]);

        return $sessionId;
    }
}