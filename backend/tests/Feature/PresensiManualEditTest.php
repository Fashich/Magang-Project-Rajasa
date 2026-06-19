<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class PresensiManualEditTest extends TestCase
{
    public function test_edit_reasons_requires_token(): void
    {
        $response = $this->runApp('GET', '/api/presensi/edit-reasons');

        $this->assertSame(401, $response['__status_code']);
        $this->assertFalse($response['success']);
    }

    public function test_edit_reasons_returns_reason_options(): void
    {
        $token = $this->loginAndGetToken();

        $response = $this->runApp('GET', '/api/presensi/edit-reasons', [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $response['__status_code']);
        $this->assertTrue($response['success']);
        $this->assertSame('Daftar alasan edit presensi.', $response['message']);
        $this->assertIsArray($response['data']['reasons']);
        $this->assertNotEmpty($response['data']['reasons']);

        $codes = array_column($response['data']['reasons'], 'code');

        $this->assertContains('siswa_sakit', $codes);
        $this->assertContains('siswa_izin', $codes);
        $this->assertContains('siswa_tidak_bawa_kartu', $codes);
        $this->assertContains('siswa_memakai_kartu_teman', $codes);
        $this->assertContains('koreksi_input', $codes);
        $this->assertContains('lainnya', $codes);
    }

    public function test_list_presensi_jam_siswa_returns_items(): void
    {
        $token = $this->loginAndGetToken();
        $data = $this->createManualEditFixture();

        $response = $this->runApp('GET', '/api/presensi/jam-siswa?tanggal=' . $data['tanggal'], [], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(200, $response['__status_code']);
        $this->assertTrue($response['success']);
        $this->assertSame('Daftar presensi siswa.', $response['message']);
        $this->assertIsArray($response['data']['items']);
        $this->assertNotEmpty($response['data']['items']);

        $first = $response['data']['items'][0];

        $this->assertArrayHasKey('presensi_id', $first);
        $this->assertArrayHasKey('siswa', $first);
        $this->assertArrayHasKey('rombel', $first);
        $this->assertArrayHasKey('jam', $first);
        $this->assertArrayHasKey('status', $first);
    }

    public function test_manual_edit_updates_status_and_writes_audit_log(): void
    {
        $token = $this->loginAndGetToken();
        $data = $this->createManualEditFixture();

        $response = $this->runApp(
            'PATCH',
            '/api/presensi/jam-siswa/' . $data['presensi_id'],
            [
                'status' => 'izin',
                'reason_code' => 'siswa_izin',
                'reason_text' => '',
            ],
            [
                'Authorization' => 'Bearer ' . $token,
            ]
        );

        $this->assertSame(
            200,
            $response['__status_code'],
            json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
        $this->assertTrue($response['success']);
        $this->assertSame('Status presensi berhasil diubah.', $response['message']);
        $this->assertSame('izin', $response['data']['presensi']['status']);
        $this->assertSame('alpha', $response['data']['audit']['old_value']);
        $this->assertSame('izin', $response['data']['audit']['new_value']);
        $this->assertSame('Siswa izin', $response['data']['audit']['alasan_edit']);

        $presensi = DB::table('presensi_jam_siswa')
            ->where('presensi_id', $data['presensi_id'])
            ->first();

        $this->assertNotNull($presensi);
        $this->assertSame('izin', $presensi->status);
        $this->assertSame('manual', $presensi->mode_presensi);
        $this->assertSame('Siswa izin', $presensi->keterangan);
        $this->assertNotNull($presensi->edited_by_user_id);
        $this->assertNotNull($presensi->edited_at);

        $log = DB::table('presensi_edit_log')
            ->where('presensi_id', $data['presensi_id'])
            ->where('field_name', 'status')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame('alpha', $log->old_value);
        $this->assertSame('izin', $log->new_value);
        $this->assertSame('Siswa izin', $log->alasan_edit);
        $this->assertNotNull($log->edited_by_user_id);
        $this->assertNotNull($log->edited_at);
    }

    public function test_manual_edit_requires_reason_text_when_reason_is_lainnya(): void
    {
        $token = $this->loginAndGetToken();
        $data = $this->createManualEditFixture();

        $response = $this->runApp(
            'PATCH',
            '/api/presensi/jam-siswa/' . $data['presensi_id'],
            [
                'status' => 'hadir',
                'reason_code' => 'lainnya',
                'reason_text' => '',
            ],
            [
                'Authorization' => 'Bearer ' . $token,
            ]
        );

        $this->assertSame(422, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Alasan tambahan wajib diisi.', $response['message']);
    }

    public function test_manual_edit_rejects_same_status(): void
    {
        $token = $this->loginAndGetToken();
        $data = $this->createManualEditFixture();

        $response = $this->runApp(
            'PATCH',
            '/api/presensi/jam-siswa/' . $data['presensi_id'],
            [
                'status' => 'alpha',
                'reason_code' => 'koreksi_input',
                'reason_text' => '',
            ],
            [
                'Authorization' => 'Bearer ' . $token,
            ]
        );

        $this->assertSame(422, $response['__status_code']);
        $this->assertFalse($response['success']);
        $this->assertSame('Status presensi tidak berubah.', $response['message']);
    }

    private function createManualEditFixture(): array
    {
        $now = date('Y-m-d H:i:s');
        $tanggal = date('Y-m-d');

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
            'kode_jurusan' => 'TST' . random_int(100, 999),
            'nama_jurusan' => 'Jurusan Test Manual Edit',
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
            'label_rombel' => '10 TEST 1',
            'label_rombel_raw' => '10 TEST 1',
            'display_mode' => 'dengan_nomor',
            'is_inferred_from_import' => 1,
            'status' => 'aktif',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $nisn = (string) random_int(7000000000, 7999999999);

        $siswaId = (int) DB::table('siswa')->insertGetId([
            'nisn' => $nisn,
            'nama_lengkap' => 'SISWA TEST MANUAL EDIT',
            'angkatan' => 2026,
            'jurusan_id_aktif' => $jurusanId,
            'rombel_id_aktif' => $rombelId,
            'kelas_aktif' => '10 TEST 1',
            'status' => 'aktif',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $jamId = (int) DB::table('jam_pembelajaran')->value('jam_id');

        $presensiId = (int) DB::table('presensi_jam_siswa')->insertGetId([
            'tanggal' => $tanggal,
            'siswa_id' => $siswaId,
            'rombel_id_snapshot' => $rombelId,
            'jam_id' => $jamId,
            'status' => 'alpha',
            'mode_presensi' => 'rombel',
            'presensi_sesi_id' => null,
            'scan_log_id' => null,
            'input_by_user_id' => null,
            'scanned_at' => null,
            'edited_by_user_id' => null,
            'edited_at' => null,
            'keterangan' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return [
            'tanggal' => $tanggal,
            'jurusan_id' => $jurusanId,
            'rombel_id' => $rombelId,
            'siswa_id' => $siswaId,
            'jam_id' => $jamId,
            'presensi_id' => $presensiId,
        ];
    }
}