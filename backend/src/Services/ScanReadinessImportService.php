<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\HttpException;

final class ScanReadinessImportService
{
    private array $columnsCache = [];

    public function importFromPath(string $filePath, int $userId): array
    {
        if (!is_file($filePath)) {
            throw new HttpException('File import tidak ditemukan.', 422);
        }

        $rows = $this->readCsv($filePath);

        if ($rows === []) {
            throw new HttpException('File import kosong.', 422);
        }

        [$headerRowIndex, $headerMap] = $this->detectHeader($rows);

        $jobId = $this->createImportJob($filePath, $userId);

        $summary = [
            'total_rows' => 0,
            'success_rows' => 0,
            'failed_rows' => 0,
            'created_students' => 0,
            'updated_students' => 0,
            'created_qr' => 0,
            'updated_qr' => 0,
        ];

        for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
            $row = $rows[$i];

            if ($this->isEmptyRow($row)) {
                continue;
            }

            $summary['total_rows']++;

            try {
                $data = $this->mapRow($row, $headerMap);

                $result = $this->processRow($data);

                $summary['success_rows']++;
                $summary['created_students'] += $result['student_created'] ? 1 : 0;
                $summary['updated_students'] += $result['student_created'] ? 0 : 1;
                $summary['created_qr'] += $result['qr_created'] ? 1 : 0;
                $summary['updated_qr'] += $result['qr_created'] ? 0 : 1;
            } catch (\Throwable $exception) {
                $summary['failed_rows']++;

                $this->logRowError($jobId, $i + 1, $row, $exception->getMessage());
            }
        }

        $this->finishImportJob($jobId, $summary);

        return [
            'import_job_id' => $jobId,
            'summary' => $summary,
        ];
    }

    public function jobs(): array
    {
        if (!$this->tableExists('import_jobs')) {
            return [];
        }

        return DB::table('import_jobs')
            ->orderByDesc($this->firstExistingColumn('import_jobs', ['import_job_id', 'job_id', 'id']) ?? 'created_at')
            ->limit(20)
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    public function rowLogs(int $jobId): array
    {
        if (!$this->tableExists('import_row_logs')) {
            return [];
        }

        return DB::table('import_row_logs')
            ->where('import_id', $jobId)
            ->orderBy('row_number')
            ->limit(200)
            ->get()
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    private function processRow(array $data): array
    {
        $nisn = $this->normalizeNisn($data['nisn'] ?? '');
        $nama = $this->normalizeName($data['nama'] ?? '');
        $kelasRaw = $this->normalizeText($data['kelas'] ?? '');

        if ($nisn === '') {
            throw new \RuntimeException('NISN wajib diisi.');
        }

        if ($nama === '') {
            throw new \RuntimeException('Nama wajib diisi.');
        }

        if ($kelasRaw === '') {
            throw new \RuntimeException('Kelas wajib diisi.');
        }

        $kelas = $this->parseKelas($kelasRaw);
        $tahunAjaran = $this->activeTahunAjaran();

        return DB::connection()->transaction(function () use ($nisn, $nama, $kelasRaw, $kelas, $tahunAjaran): array {
            $jurusanId = $this->ensureJurusan($kelas['jurusan']);
            $rombelId = $this->ensureRombel($kelas, $kelasRaw, $jurusanId, (int) $tahunAjaran->tahun_ajaran_id);

            $existing = DB::table('siswa')->where('nisn', $nisn)->first();

            $studentPayload = $this->filterPayload('siswa', [
                'nisn' => $nisn,
                'nama_lengkap' => $nama,
                'angkatan' => date('Y'),
                'jurusan_id_aktif' => $jurusanId,
                'rombel_id_aktif' => $rombelId,
                'kelas_aktif' => $kelasRaw,
                'status' => 'aktif',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            if ($existing) {
                DB::table('siswa')->where('siswa_id', $existing->siswa_id)->update($studentPayload);
                $siswaId = (int) $existing->siswa_id;
                $studentCreated = false;
            } else {
                $siswaId = (int) DB::table('siswa')->insertGetId($studentPayload);
                $studentCreated = true;
            }

            $this->upsertPlacement($siswaId, $rombelId, (int) $tahunAjaran->tahun_ajaran_id, (string) $tahunAjaran->semester_aktif);
            $qrCreated = $this->upsertSiswaQr($siswaId, $nisn, $nama);

            return [
                'student_created' => $studentCreated,
                'qr_created' => $qrCreated,
            ];
        });
    }

    private function upsertSiswaQr(int $siswaId, string $nisn, string $nama): bool
    {
        if (!$this->tableExists('siswa_qr')) {
            return false;
        }

        $payloadRaw = $nama . '|' . $nisn;
        $payloadNormalized = $this->normalizePayload($payloadRaw);

        $existing = null;

        if ($this->hasColumn('siswa_qr', 'siswa_id')) {
            $existing = DB::table('siswa_qr')->where('siswa_id', $siswaId)->first();
        }

        $payload = $this->filterPayload('siswa_qr', [
            'qr_uuid' => $this->uuidV4(),
            'siswa_qr_uuid' => $this->uuidV4(),
            'siswa_id' => $siswaId,
            'payload_raw' => $payloadRaw,
            'payload_normalized' => $payloadNormalized,
            'payload_hash' => hash('sha256', $payloadNormalized),
            'payload_nisn' => $nisn,
            'payload_nama' => $nama,
            'is_active' => 1,
            'status' => 'aktif',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        if ($existing) {
            DB::table('siswa_qr')->where('siswa_id', $siswaId)->update($payload);
            return false;
        }

        DB::table('siswa_qr')->insert($payload);
        return true;
    }

    private function upsertPlacement(int $siswaId, int $rombelId, int $tahunAjaranId, string $semester): void
    {
        if (!$this->tableExists('penempatan_siswa_rombel')) {
            return;
        }

        $match = [
            'siswa_id' => $siswaId,
            'tahun_ajaran_id' => $tahunAjaranId,
        ];

        if ($this->hasColumn('penempatan_siswa_rombel', 'semester')) {
            $match['semester'] = $semester;
        }

        $payload = $this->filterPayload('penempatan_siswa_rombel', [
            'siswa_id' => $siswaId,
            'rombel_id' => $rombelId,
            'tahun_ajaran_id' => $tahunAjaranId,
            'semester' => $semester,
            'is_aktif' => 1,
            'tanggal_mulai' => date('Y-m-d'),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $existing = DB::table('penempatan_siswa_rombel')->where($match)->first();

        if ($existing) {
            DB::table('penempatan_siswa_rombel')->where($match)->update($payload);
            return;
        }

        DB::table('penempatan_siswa_rombel')->insert($payload);
    }

    private function ensureJurusan(string $kode): int
    {
        $kode = strtoupper($kode);

        $nameColumn = $this->firstExistingColumn('jurusan', ['kode_jurusan', 'nama_jurusan', 'nama', 'jurusan']);
        $idColumn = 'jurusan_id';

        if (!$nameColumn) {
            throw new \RuntimeException('Kolom nama jurusan tidak ditemukan.');
        }

        $existing = DB::table('jurusan')->where($nameColumn, $kode)->first();

        if ($existing) {
            return (int) $existing->{$idColumn};
        }

        $payload = $this->filterPayload('jurusan', [
            'kode_jurusan' => $kode,
            'nama_jurusan' => $kode,
            'nama' => $kode,
            'jurusan' => $kode,
            'status' => 'aktif',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return (int) DB::table('jurusan')->insertGetId($payload);
    }

    private function ensureRombel(array $kelas, string $kelasRaw, int $jurusanId, int $tahunAjaranId): int
    {
        $existing = DB::table('rombel')
            ->where('tahun_ajaran_id', $tahunAjaranId)
            ->where('tingkatan', $kelas['tingkatan_romawi'])
            ->where('jurusan_id', $jurusanId)
            ->where('nomor_rombel', $kelas['nomor_rombel'])
            ->first();

        $payload = $this->filterPayload('rombel', [
            'tahun_ajaran_id' => $tahunAjaranId,
            'tingkatan' => $kelas['tingkatan_romawi'],
            'tingkat_angka' => $kelas['tingkat_angka'],
            'jurusan_id' => $jurusanId,
            'nomor_rombel' => $kelas['nomor_rombel'],
            'is_nomor_rombel_inferred' => $kelas['is_nomor_rombel_inferred'],
            'label_rombel' => $kelas['label_rombel'],
            'label_rombel_raw' => $kelasRaw,
            'display_mode' => $kelas['display_mode'],
            'is_inferred_from_import' => 1,
            'status' => 'aktif',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        if (!$existing) {
            return (int) DB::table('rombel')->insertGetId($payload);
        }

        $existingIsInferred = (int) ($existing->is_nomor_rombel_inferred ?? 1) === 1;
        $incomingIsExplicit = (int) $kelas['is_nomor_rombel_inferred'] === 0;

        unset($payload['created_at']);

        if (!$incomingIsExplicit && !$existingIsInferred) {
            unset(
                $payload['label_rombel'],
                $payload['label_rombel_raw'],
                $payload['display_mode'],
                $payload['is_nomor_rombel_inferred']
            );
        }

        DB::table('rombel')
            ->where('rombel_id', $existing->rombel_id)
            ->update($payload);

        return (int) $existing->rombel_id;
    }

    private function parseKelas(string $kelasRaw): array
    {
        $normalized = strtoupper($this->normalizeText(str_replace(['-', '_'], ' ', $kelasRaw)));

        if (!preg_match('/^(10|11|12|13|X|XI|XII|XIII)\s+([A-Z0-9]+)(?:\s+(\d+))?$/', $normalized, $match)) {
            throw new \RuntimeException('Format kelas tidak valid. Contoh benar: 10 TKRO 1 atau 10 AKL.');
        }

        $tingkatRaw = $match[1];
        $jurusan = strtoupper($match[2]);
        $nomorRombelRaw = $match[3] ?? '';

        $romanToNumber = [
            'X' => 10,
            'XI' => 11,
            'XII' => 12,
            'XIII' => 13,
        ];

        $numberToRoman = [
            10 => 'X',
            11 => 'XI',
            12 => 'XII',
            13 => 'XIII',
        ];

        $tingkatAngka = is_numeric($tingkatRaw)
            ? (int) $tingkatRaw
            : ($romanToNumber[$tingkatRaw] ?? 0);

        if (!isset($numberToRoman[$tingkatAngka])) {
            throw new \RuntimeException('Tingkat kelas tidak valid.');
        }

        $hasExplicitNomorRombel = $nomorRombelRaw !== '';
        $nomorRombel = $hasExplicitNomorRombel ? (int) $nomorRombelRaw : 1;

        if ($nomorRombel < 1 || $nomorRombel > 99) {
            throw new \RuntimeException('Nomor rombel tidak valid.');
        }

        $labelRombel = (string) $tingkatAngka . ' ' . $jurusan;

        if ($hasExplicitNomorRombel) {
            $labelRombel .= ' ' . $nomorRombel;
        }

        return [
            'tingkat_angka' => $tingkatAngka,
            'tingkatan_romawi' => $numberToRoman[$tingkatAngka],
            'jurusan' => $jurusan,
            'nomor_rombel' => $nomorRombel,
            'is_nomor_rombel_inferred' => $hasExplicitNomorRombel ? 0 : 1,
            'label_rombel' => $labelRombel,
            'display_mode' => $hasExplicitNomorRombel ? 'dengan_nomor' : 'tanpa_nomor',
        ];
    }

    private function activeTahunAjaran(): object
    {
        $tahunAjaran = DB::table('tahun_ajaran')
            ->where('is_aktif', 1)
            ->first();

        if (!$tahunAjaran) {
            throw new \RuntimeException('Tahun ajaran aktif belum tersedia.');
        }

        return $tahunAjaran;
    }

    private function readCsv(string $filePath): array
    {
        $handle = fopen($filePath, 'rb');

        if (!$handle) {
            throw new HttpException('File tidak bisa dibaca.', 422);
        }

        $rows = [];

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            if (count($row) === 1 && str_contains((string) $row[0], ';')) {
                $row = str_getcsv((string) $row[0], ';');
            }

            $rows[] = array_map(fn ($value) => trim((string) $value), $row);
        }

        fclose($handle);

        return $rows;
    }

    private function detectHeader(array $rows): array
    {
        foreach ($rows as $index => $row) {
            $normalized = array_map(fn ($value) => $this->normalizeHeader($value), $row);

            $nisnIndex = array_search('nisn', $normalized, true);
            $namaIndex = array_search('nama', $normalized, true);
            $kelasIndex = array_search('kelas', $normalized, true);

            if ($nisnIndex !== false && $namaIndex !== false && $kelasIndex !== false) {
                return [$index, [
                    'nisn' => $nisnIndex,
                    'nama' => $namaIndex,
                    'kelas' => $kelasIndex,
                ]];
            }
        }

        throw new HttpException('Header NISN, NAMA, dan KELAS tidak ditemukan.', 422);
    }

    private function mapRow(array $row, array $headerMap): array
    {
        return [
            'nisn' => $row[$headerMap['nisn']] ?? '',
            'nama' => $row[$headerMap['nama']] ?? '',
            'kelas' => $row[$headerMap['kelas']] ?? '',
        ];
    }

    private function createImportJob(string $filePath, int $userId): int
    {
        if (!$this->tableExists('import_jobs')) {
            return 0;
        }

        $now = date('Y-m-d H:i:s');
        $tahunAjaran = $this->activeTahunAjaran();

        $payload = $this->filterPayload('import_jobs', [
            'import_code' => $this->uuidV4(),
            'import_type' => 'siswa',
            'original_filename' => basename($filePath),
            'tahun_ajaran_id' => (int) $tahunAjaran->tahun_ajaran_id,
            'semester' => $tahunAjaran->semester_aktif ?? null,
            'status' => 'diproses',
            'total_rows' => 0,
            'valid_rows' => 0,
            'warning_rows' => 0,
            'error_rows' => 0,
            'inserted_rows' => 0,
            'updated_rows' => 0,
            'skipped_rows' => 0,
            'created_by' => $userId,
            'started_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return (int) DB::table('import_jobs')->insertGetId($payload);
    }

    private function finishImportJob(int $jobId, array $summary): void
    {
        if ($jobId === 0 || !$this->tableExists('import_jobs')) {
            return;
        }

        $status = $summary['failed_rows'] > 0 ? 'selesai' : 'selesai';

        $payload = $this->filterPayload('import_jobs', [
            'status' => $status,
            'total_rows' => $summary['total_rows'],
            'valid_rows' => $summary['success_rows'],
            'warning_rows' => 0,
            'error_rows' => $summary['failed_rows'],
            'inserted_rows' => $summary['created_students'],
            'updated_rows' => $summary['updated_students'],
            'skipped_rows' => 0,
            'finished_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        DB::table('import_jobs')
            ->where($this->primaryKey('import_jobs'), $jobId)
            ->update($payload);
    }

    private function logRowError(int $jobId, int $rowNumber, array $row, string $message): void
    {
        if ($jobId === 0 || !$this->tableExists('import_row_logs')) {
            return;
        }

        $payload = $this->filterPayload('import_row_logs', [
            'import_id' => $jobId,
            'row_number' => $rowNumber,
            'row_status' => 'error',
            'source_payload_json' => json_encode($row, JSON_UNESCAPED_UNICODE),
            'message' => $message,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        DB::table('import_row_logs')->insert($payload);
    }  

    private function normalizeHeader(string $value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '', trim($value)) ?? '');
    }

    private function normalizeText(string $value): string
    {
        return trim(preg_replace('/\\s+/', ' ', $value) ?? '');
    }

    private function normalizeName(string $value): string
    {
        return strtoupper($this->normalizeText($value));
    }

    private function normalizeNisn(string $value): string
    {
        return preg_replace('/\\D+/', '', trim($value)) ?? '';
    }

    private function normalizePayload(string $value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '', $value) ?? '');
    }

    private function isEmptyRow(array $row): bool
    {
        return trim(implode('', $row)) === '';
    }

    private function tableExists(string $table): bool
    {
        return DB::connection()->getSchemaBuilder()->hasTable($table);
    }

    private function filterPayload(string $table, array $payload): array
    {
        $columns = $this->columns($table);

        return array_filter(
            $payload,
            fn ($key) => in_array($key, $columns, true),
            ARRAY_FILTER_USE_KEY
        );
    }

    private function hasColumn(string $table, string $column): bool
    {
        return in_array($column, $this->columns($table), true);
    }

    private function firstExistingColumn(string $table, array $columns): ?string
    {
        foreach ($columns as $column) {
            if ($this->hasColumn($table, $column)) {
                return $column;
            }
        }

        return null;
    }

    private function uuidV4(): string
    {
        $data = random_bytes(16);

        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    private function safeEnumValue(string $table, string $column, string $preferred, array $fallbacks): string
    {
        $values = $this->enumValues($table, $column);

        if ($values === []) {
            return $preferred;
        }

        if (in_array($preferred, $values, true)) {
            return $preferred;
        }

        foreach ($fallbacks as $fallback) {
            if (in_array($fallback, $values, true)) {
                return $fallback;
            }
        }

        return $values[0];
    }

    private function enumValues(string $table, string $column): array
    {
        $database = (string) DB::connection()->getDatabaseName();

        $row = DB::table('information_schema.COLUMNS')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', $table)
            ->where('COLUMN_NAME', $column)
            ->first();

        if (!$row || !isset($row->COLUMN_TYPE)) {
            return [];
        }

        $type = (string) $row->COLUMN_TYPE;

        if (!str_starts_with($type, 'enum(')) {
            return [];
        }

        preg_match_all("/'([^']*)'/", $type, $matches);

        return $matches[1] ?? [];
    }

    private function primaryKey(string $table): string
    {
        return $this->firstExistingColumn($table, [
            'import_id',
            'import_job_id',
            'job_id',
            'id',
        ]) ?? 'id';
    }

    private function columns(string $table): array
    {
        if (!isset($this->columnsCache[$table])) {
            $this->columnsCache[$table] = DB::connection()
                ->getSchemaBuilder()
                ->getColumnListing($table);
        }

        return $this->columnsCache[$table];
    }
}