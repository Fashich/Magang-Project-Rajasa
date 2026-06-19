<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Tests\Feature;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Tests\Support\TestCase;

final class ScanReadinessImportTest extends TestCase
{
    public function test_scan_readiness_import_creates_students_and_qr_reference(): void
    {
        $token = $this->loginAndGetToken();

        $file = $this->makeCsv([
            ['N', 'NISN', 'NAMA', 'KELAS'],
            ['1', '0096672112', 'AISYAH LISTYA NARISTA', '10 AKL'],
            ['2', '0106325606', 'AISYAH NUR AMALINA', '10 AKL'],
        ]);

        $response = $this->runApp('POST', '/api/import/scan-readiness', [
            'file_path' => $file,
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(
            201,
            $response['__status_code'],
            json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
        $this->assertTrue($response['success']);
        $this->assertSame(2, $response['data']['summary']['success_rows']);

        $this->assertTrue(DB::table('siswa')->where('nisn', '0096672112')->exists());

        if (DB::connection()->getSchemaBuilder()->hasTable('siswa_qr')) {
            $this->assertTrue(DB::table('siswa_qr')->where('payload_nisn', '0096672112')->exists());
        }
    }

    public function test_scan_readiness_import_logs_invalid_rows(): void
    {
        $token = $this->loginAndGetToken();

        $file = $this->makeCsv([
            ['N', 'NISN', 'NAMA', 'KELAS'],
            ['1', '', 'TANPA NISN', '10 AKL'],
            ['2', '0123456789', 'VALID SISWA', '10 AKL'],
        ]);

        $response = $this->runApp('POST', '/api/import/scan-readiness', [
            'file_path' => $file,
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(
            201,
            $response['__status_code'],
            json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
        $this->assertSame(1, $response['data']['summary']['success_rows']);
        $this->assertSame(1, $response['data']['summary']['failed_rows']);
    }

    public function test_scan_readiness_import_requires_token(): void
    {
        $file = $this->makeCsv([
            ['NISN', 'NAMA', 'KELAS'],
            ['0096672112', 'AISYAH LISTYA NARISTA', '10 AKL'],
        ]);

        $response = $this->runApp('POST', '/api/import/scan-readiness', [
            'file_path' => $file,
        ]);

        $this->assertSame(401, $response['__status_code']);
        $this->assertFalse($response['success']);
    }

    public function test_scan_readiness_import_separates_rombel_by_class_number(): void
    {
        $token = $this->loginAndGetToken();

        $file = $this->makeCsv([
            ['N', 'NISN', 'NAMA', 'KELAS'],
            ['1', '1111111111', 'SISWA TKRO SATU', '10 TKRO 1'],
            ['2', '2222222222', 'SISWA TKRO DUA', '10 TKRO 2'],
            ['3', '3333333333', 'SISWA TKRO TANPA NOMOR', '10 TKRO'],
        ]);

        $response = $this->runApp('POST', '/api/import/scan-readiness', [
            'file_path' => $file,
        ], [
            'Authorization' => 'Bearer ' . $token,
        ]);

        $this->assertSame(
            201,
            $response['__status_code'],
            json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );
        $this->assertTrue($response['success']);
        $this->assertSame(3, $response['data']['summary']['success_rows']);

        $siswaSatu = DB::table('siswa')->where('nisn', '1111111111')->first();
        $siswaDua = DB::table('siswa')->where('nisn', '2222222222')->first();
        $siswaTanpaNomor = DB::table('siswa')->where('nisn', '3333333333')->first();

        $this->assertNotNull($siswaSatu);
        $this->assertNotNull($siswaDua);
        $this->assertNotNull($siswaTanpaNomor);

        $this->assertNotSame((int) $siswaSatu->rombel_id_aktif, (int) $siswaDua->rombel_id_aktif);
        $this->assertSame((int) $siswaSatu->rombel_id_aktif, (int) $siswaTanpaNomor->rombel_id_aktif);

        $rombelSatu = DB::table('rombel')->where('rombel_id', $siswaSatu->rombel_id_aktif)->first();
        $rombelDua = DB::table('rombel')->where('rombel_id', $siswaDua->rombel_id_aktif)->first();

        $this->assertNotNull($rombelSatu);
        $this->assertNotNull($rombelDua);

        $this->assertSame('X', $rombelSatu->tingkatan);
        $this->assertSame(10, (int) $rombelSatu->tingkat_angka);
        $this->assertSame(1, (int) $rombelSatu->nomor_rombel);
        $this->assertSame('10 TKRO 1', $rombelSatu->label_rombel);
        $this->assertSame('10 TKRO 1', $rombelSatu->label_rombel_raw);
        $this->assertSame('dengan_nomor', $rombelSatu->display_mode);
        $this->assertSame(0, (int) $rombelSatu->is_nomor_rombel_inferred);

        $this->assertSame('X', $rombelDua->tingkatan);
        $this->assertSame(10, (int) $rombelDua->tingkat_angka);
        $this->assertSame(2, (int) $rombelDua->nomor_rombel);
        $this->assertSame('10 TKRO 2', $rombelDua->label_rombel);
        $this->assertSame('10 TKRO 2', $rombelDua->label_rombel_raw);
        $this->assertSame('dengan_nomor', $rombelDua->display_mode);
        $this->assertSame(0, (int) $rombelDua->is_nomor_rombel_inferred);
    }

    private function importCsvPath(): string
    {
        $files = glob(__DIR__ . '/../../database/data/*.csv');

        if (!$files || count($files) === 0) {
            $this->markTestSkipped('File CSV import belum tersedia di backend/database/data/.');
        }

        return $files[0];
    }

    private function makeCsv(array $rows): string
    {
        $file = tempnam(sys_get_temp_dir(), 'scan-readiness-') . '.csv';

        $handle = fopen($file, 'wb');

        if ($handle === false) {
            $this->fail('Gagal membuat file CSV test.');
        }

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        fclose($handle);

        return $file;
    }
}