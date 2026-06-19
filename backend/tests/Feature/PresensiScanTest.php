<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class PresensiScanTest extends TestCase
{
    public function test_scan_valid_rombel_qr_marks_attendance_as_hadir(): void
    {
        $token = $this->loginAndGetToken();
        $this->cleanupActiveSessions();
        $this->importMiniStudents($token);
        $this->cleanupAttendanceForTestStudents();

        $siswa = DB::table('siswa')->where('nisn', '0096672112')->first();
        $jamIds = $this->firstJamIds(1);

        $sessionId = $this->createSession($token, (int) $siswa->rombel_id_aktif, $jamIds, 'kelas');

        $response = $this->runApp('POST', '/api/presensi/scan', [
            'presensi_sesi_id' => $sessionId,
            'payload_raw' => $this->googleFormPayload('AISYAH LISTYA NARISTA', '0096672112'),
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code'], json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->assertSame('berhasil', $response['data']['status_scan']);
        $this->assertSame('hadir', $response['data']['attendance_status']);
        $this->assertSame(1, $response['data']['affected_rows']);

        $this->assertTrue(
            DB::table('presensi_jam_siswa')
                ->where('siswa_id', (int) $siswa->siswa_id)
                ->where('jam_id', $jamIds[0])
                ->where('status', 'hadir')
                ->exists()
        );

        $this->finishSession($token, $sessionId);
    }

    public function test_scan_wrong_rombel_returns_warning(): void
    {
        $token = $this->loginAndGetToken();
        $this->cleanupActiveSessions();
        $this->importMiniStudents($token);
        $this->cleanupAttendanceForTestStudents();

        $akl = DB::table('siswa')->where('nisn', '0096672112')->first();
        $mp = DB::table('siswa')->where('nisn', '0106325606')->first();
        $jamIds = $this->firstJamIds(1);

        $sessionId = $this->createSession($token, (int) $akl->rombel_id_aktif, $jamIds, 'kelas');

        $response = $this->runApp('POST', '/api/presensi/scan', [
            'presensi_sesi_id' => $sessionId,
            'payload_raw' => $this->googleFormPayload('AISYAH NUR AMALINA', '0106325606'),
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code'], json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->assertSame('warning', $response['data']['status_scan']);
        $this->assertSame('siswa_tidak_sesuai_rombel', $response['data']['warning_reason']);
        $this->assertSame(0, $response['data']['affected_rows']);

        $this->assertTrue(
            DB::table('presensi_scan_log')
                ->where('siswa_id', (int) $mp->siswa_id)
                ->where('status_scan', 'warning')
                ->exists()
        );

        $this->finishSession($token, $sessionId);
    }

    public function test_scan_invalid_qr_is_logged(): void
    {
        $token = $this->loginAndGetToken();
        $this->cleanupActiveSessions();
        $this->importMiniStudents($token);
        $this->cleanupAttendanceForTestStudents();

        $siswa = DB::table('siswa')->where('nisn', '0096672112')->first();
        $jamIds = $this->firstJamIds(1);

        $sessionId = $this->createSession($token, (int) $siswa->rombel_id_aktif, $jamIds, 'kelas');

        $response = $this->runApp('POST', '/api/presensi/scan', [
            'presensi_sesi_id' => $sessionId,
            'payload_raw' => $this->googleFormPayload('SISWA TIDAK ADA', '9999999999'),
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code'], json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->assertSame('invalid', $response['data']['status_scan']);
        $this->assertSame(0, $response['data']['affected_rows']);

        $this->assertTrue(
            DB::table('presensi_scan_log')
                ->where('payload_nisn', '9999999999')
                ->where('status_scan', 'invalid')
                ->exists()
        );

        $this->finishSession($token, $sessionId);
    }

    public function test_scan_piket_marks_attendance_as_terlambat(): void
    {
        $token = $this->loginAndGetToken();
        $this->cleanupActiveSessions();
        $this->importMiniStudents($token);
        $this->cleanupAttendanceForTestStudents();

        $siswa = DB::table('siswa')->where('nisn', '0096672112')->first();
        $jamIds = $this->firstJamIds(1);

        $sessionId = $this->createPiketSession($token, $jamIds);

        $response = $this->runApp('POST', '/api/presensi/scan', [
            'presensi_sesi_id' => $sessionId,
            'payload_raw' => $this->googleFormPayload('AISYAH LISTYA NARISTA', '0096672112'),
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code'], json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->assertSame('berhasil', $response['data']['status_scan']);
        $this->assertSame('terlambat', $response['data']['attendance_status']);

        $this->assertTrue(
            DB::table('presensi_jam_siswa')
                ->where('siswa_id', (int) $siswa->siswa_id)
                ->where('jam_id', $jamIds[0])
                ->where('status', 'terlambat')
                ->exists()
        );

        $this->finishSession($token, $sessionId);
    }

    public function test_duplicate_scan_is_rejected(): void
    {
        $token = $this->loginAndGetToken();
        $this->cleanupActiveSessions();
        $this->importMiniStudents($token);
        $this->cleanupAttendanceForTestStudents();

        $siswa = DB::table('siswa')->where('nisn', '0096672112')->first();
        $jamIds = $this->firstJamIds(1);

        $sessionId = $this->createSession($token, (int) $siswa->rombel_id_aktif, $jamIds, 'kelas');

        $first = $this->runApp('POST', '/api/presensi/scan', [
            'presensi_sesi_id' => $sessionId,
            'payload_raw' => $this->googleFormPayload('AISYAH LISTYA NARISTA', '0096672112'),
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $first['__status_code'], json_encode($first, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->assertSame('berhasil', $first['data']['status_scan']);

        $second = $this->runApp('POST', '/api/presensi/scan', [
            'presensi_sesi_id' => $sessionId,
            'payload_raw' => $this->googleFormPayload('AISYAH LISTYA NARISTA', '0096672112'),
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $second['__status_code'], json_encode($second, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $this->assertSame('ditolak', $second['data']['status_scan']);
        $this->assertSame(0, $second['data']['affected_rows']);

        $this->finishSession($token, $sessionId);
    }

    private function cleanupActiveSessions(): void
    {
        DB::table('presensi_sesi')
            ->whereIn('status', ['aktif', 'suspended'])
            ->update([
                'status' => 'selesai',
                'ended_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
    }

    private function cleanupAttendanceForTestStudents(): void
    {
        $studentIds = DB::table('siswa')
            ->whereIn('nisn', ['0096672112', '0106325606'])
            ->pluck('siswa_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($studentIds === []) {
            return;
        }

        DB::table('presensi_jam_siswa')
            ->whereIn('siswa_id', $studentIds)
            ->delete();

        DB::table('presensi_scan_log')
            ->whereIn('siswa_id', $studentIds)
            ->delete();
    }

    private function importMiniStudents(string $token): void
    {
        $file = $this->makeCsv([
            ['N', 'NISN', 'NAMA', 'KELAS'],
            ['1', '0096672112', 'AISYAH LISTYA NARISTA', '10 AKL'],
            ['2', '0106325606', 'AISYAH NUR AMALINA', '10 MP'],
        ]);

        $response = $this->runApp('POST', '/api/import/scan-readiness', [
            'file_path' => $file,
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code'], json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    private function createSession(string $token, int $rombelId, array $jamIds, string $room): int
    {
        $response = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'rombel',
            'rombel_id' => $rombelId,
            'jam_ids' => $jamIds,
            'ruang_pilihan' => $room,
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code'], json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return (int) $response['data']['session']['presensi_sesi_id'];
    }

    private function createPiketSession(string $token, array $jamIds): int
    {
        $response = $this->runApp('POST', '/api/presensi/sesi', [
            'mode_presensi' => 'piket',
            'jam_ids' => $jamIds,
            'ruang_pilihan' => 'piket',
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(201, $response['__status_code'], json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return (int) $response['data']['session']['presensi_sesi_id'];
    }

    private function finishSession(string $token, int $sessionId): void
    {
        $this->runApp('POST', "/api/presensi/sesi/{$sessionId}/finish", [], [
            'Authorization' => 'Bearer ' . $token,
        ]);
    }

    private function firstJamIds(int $limit): array
    {
        $ids = DB::table('jam_pembelajaran')
            ->orderBy('jam_id')
            ->limit($limit)
            ->pluck('jam_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (count($ids) < $limit) {
            $this->markTestSkipped('Data jam pembelajaran demo belum tersedia.');
        }

        return $ids;
    }

    private function googleFormPayload(string $nama, string $nisn): string
    {
        return 'https://docs.google.com/forms/d/e/1FAIpQLSdld41u92r5hCQUzp_HeGNnPN7StSC9LcAlixa9Ymzg4ixkRw/formResponse'
            . '?usp=pp_url'
            . '&entry.1743651050=' . urlencode($nama)
            . '&entry.178375719=' . urlencode($nisn);
    }

    private function makeCsv(array $rows): string
    {
        $file = tempnam(sys_get_temp_dir(), 'scan-test-') . '.csv';
        $handle = fopen($file, 'wb');

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        fclose($handle);

        return $file;
    }
}