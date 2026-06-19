<?php

declare(strict_types=1);

namespace Rajasa\PresensiSiswa\Services;

use Illuminate\Database\Capsule\Manager as DB;
use Rajasa\PresensiSiswa\Core\HttpException;

final class PresensiScanService
{
    private array $columnsCache = [];

    public function __construct(
        private readonly QrPayloadService $qrPayloadService
    ) {
    }

    public function scan(array $input, int $userId): array
    {
        $sessionId = (int) ($input['presensi_sesi_id'] ?? 0);
        $payloadRaw = trim((string) ($input['payload_raw'] ?? ''));
        $clientRequestUuid = trim((string) ($input['client_request_uuid'] ?? ''));

        if ($sessionId <= 0) {
            throw new HttpException('Sesi presensi wajib dipilih.', 422);
        }

        if ($payloadRaw === '') {
            throw new HttpException('Payload QR wajib diisi.', 422);
        }

        if ($clientRequestUuid === '') {
            $clientRequestUuid = $this->uuidV4();
        }

        $session = DB::table('presensi_sesi')
            ->where('presensi_sesi_id', $sessionId)
            ->first();

        if (!$session) {
            throw new HttpException('Sesi presensi tidak ditemukan.', 404);
        }

        if ((string) $session->status !== 'aktif') {
            throw new HttpException('Sesi presensi tidak aktif.', 409);
        }

        $jamIds = DB::table('presensi_sesi_jam')
            ->where('presensi_sesi_id', $sessionId)
            ->orderBy('urutan')
            ->pluck('jam_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($jamIds === []) {
            throw new HttpException('Jam sesi presensi belum tersedia.', 422);
        }

        $parsed = $this->qrPayloadService->parse($payloadRaw);
        $qr = $this->findQrReference($parsed);

        if (!$qr) {
            $scanLogId = $this->createScanLog($session, $userId, $clientRequestUuid, $parsed, null, 'invalid', 'none');

            return [
                'scan_log_id' => $scanLogId,
                'status_scan' => 'invalid',
                'warning_reason' => 'none',
                'message' => 'QR tidak dikenali.',
                'siswa' => null,
                'affected_rows' => 0,
            ];
        }

        $siswa = DB::table('siswa')
            ->where('siswa_id', (int) $qr->siswa_id)
            ->first();

        if (!$siswa) {
            $scanLogId = $this->createScanLog($session, $userId, $clientRequestUuid, $parsed, null, 'invalid', 'none');

            return [
                'scan_log_id' => $scanLogId,
                'status_scan' => 'invalid',
                'warning_reason' => 'none',
                'message' => 'Data siswa pemilik QR tidak ditemukan.',
                'siswa' => null,
                'affected_rows' => 0,
            ];
        }

        $actualRombelId = $siswa->rombel_id_aktif ? (int) $siswa->rombel_id_aktif : null;
        $selectedRombelId = $session->mode_presensi === 'rombel' && $session->rombel_id
            ? (int) $session->rombel_id
            : null;

        if ($session->mode_presensi === 'rombel' && $actualRombelId !== $selectedRombelId) {
            $scanLogId = $this->createScanLog(
                $session,
                $userId,
                $clientRequestUuid,
                $parsed,
                $siswa,
                'warning',
                'siswa_tidak_sesuai_rombel'
            );

            return [
                'scan_log_id' => $scanLogId,
                'status_scan' => 'warning',
                'warning_reason' => 'siswa_tidak_sesuai_rombel',
                'message' => 'Siswa tidak sesuai rombel sesi.',
                'siswa' => $this->formatSiswa($siswa),
                'affected_rows' => 0,
            ];
        }

        if (!$this->hasScannableAttendance($session, $siswa, $jamIds)) {
            $scanLogId = $this->createScanLog($session, $userId, $clientRequestUuid, $parsed, $siswa, 'ditolak', 'none');

            return [
                'scan_log_id' => $scanLogId,
                'status_scan' => 'ditolak',
                'warning_reason' => 'none',
                'message' => 'Siswa sudah presensi pada jam yang dipilih.',
                'siswa' => $this->formatSiswa($siswa),
                'affected_rows' => 0,
            ];
        }

        return DB::connection()->transaction(function () use ($session, $userId, $clientRequestUuid, $parsed, $siswa, $jamIds): array {
            $scanLogId = $this->createScanLog($session, $userId, $clientRequestUuid, $parsed, $siswa, 'berhasil', 'none');
            $status = $session->mode_presensi === 'piket' ? 'terlambat' : 'hadir';
            $affectedRows = $this->applyAttendance($session, $siswa, $jamIds, $scanLogId, $userId, $status);

            return [
                'scan_log_id' => $scanLogId,
                'status_scan' => 'berhasil',
                'warning_reason' => 'none',
                'message' => 'Scan QR berhasil.',
                'attendance_status' => $status,
                'siswa' => $this->formatSiswa($siswa),
                'affected_rows' => $affectedRows,
            ];
        });
    }

    private function findQrReference(array $parsed): ?object
    {
        if (($parsed['payload_nisn'] ?? '') !== '') {
            $qr = DB::table('siswa_qr')
                ->where('payload_nisn', $parsed['payload_nisn'])
                ->first();

            if ($qr) {
                return $qr;
            }
        }

        if (($parsed['payload_normalized'] ?? '') !== '') {
            return DB::table('siswa_qr')
                ->where('payload_normalized', $parsed['payload_normalized'])
                ->first();
        }

        return null;
    }

    private function hasScannableAttendance(object $session, object $siswa, array $jamIds): bool
    {
        if ($session->mode_presensi === 'piket') {
            foreach ($jamIds as $jamId) {
                $existing = DB::table('presensi_jam_siswa')
                    ->where('tanggal', $session->tanggal)
                    ->where('siswa_id', (int) $siswa->siswa_id)
                    ->where('jam_id', $jamId)
                    ->first();

                if (!$existing || $existing->status === 'alpha') {
                    return true;
                }
            }

            return false;
        }

        return DB::table('presensi_jam_siswa')
            ->where('presensi_sesi_id', (int) $session->presensi_sesi_id)
            ->where('siswa_id', (int) $siswa->siswa_id)
            ->whereIn('jam_id', $jamIds)
            ->where('status', 'alpha')
            ->exists();
    }

    private function applyAttendance(object $session, object $siswa, array $jamIds, int $scanLogId, int $userId, string $status): int
    {
        $affected = 0;

        foreach ($jamIds as $jamId) {
            $existing = DB::table('presensi_jam_siswa')
                ->where('tanggal', $session->tanggal)
                ->where('siswa_id', (int) $siswa->siswa_id)
                ->where('jam_id', $jamId)
                ->first();

            if ($existing && $existing->status !== 'alpha') {
                continue;
            }

            if ($existing) {
                $affected += DB::table('presensi_jam_siswa')
                    ->where('presensi_id', (int) $existing->presensi_id)
                    ->update($this->filterPayload('presensi_jam_siswa', [
                        'status' => $status,
                        'mode_presensi' => $session->mode_presensi,
                        'presensi_sesi_id' => (int) $session->presensi_sesi_id,
                        'scan_log_id' => $scanLogId,
                        'input_by_user_id' => $userId,
                        'scanned_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]));

                continue;
            }

            DB::table('presensi_jam_siswa')->insert($this->filterPayload('presensi_jam_siswa', [
                'tanggal' => $session->tanggal,
                'siswa_id' => (int) $siswa->siswa_id,
                'rombel_id_snapshot' => $siswa->rombel_id_aktif,
                'tahun_ajaran_id_snapshot' => $session->tahun_ajaran_id,
                'semester_snapshot' => $session->semester,
                'jam_id' => $jamId,
                'status' => $status,
                'mode_presensi' => $session->mode_presensi,
                'presensi_sesi_id' => (int) $session->presensi_sesi_id,
                'scan_log_id' => $scanLogId,
                'input_by_user_id' => $userId,
                'scanned_at' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]));

            $affected++;
        }

        return $affected;
    }

    private function createScanLog(
        object $session,
        int $userId,
        string $clientRequestUuid,
        array $parsed,
        ?object $siswa,
        string $statusScan,
        string $warningReason
    ): int {
        return (int) DB::table('presensi_scan_log')->insertGetId($this->filterPayload('presensi_scan_log', [
            'presensi_sesi_id' => (int) $session->presensi_sesi_id,
            'client_request_uuid' => $clientRequestUuid,
            'tanggal' => $session->tanggal,
            'scanned_at' => date('Y-m-d H:i:s'),
            'scanned_by_user_id' => $userId,
            'payload_raw' => $parsed['payload_raw'],
            'payload_normalized' => $parsed['payload_normalized'],
            'payload_nama' => $parsed['payload_nama'],
            'payload_nisn' => $parsed['payload_nisn'] !== '' ? $parsed['payload_nisn'] : '-',
            'siswa_id' => $siswa?->siswa_id,
            'selected_rombel_id' => $session->mode_presensi === 'rombel' ? $session->rombel_id : null,
            'actual_rombel_id' => $siswa?->rombel_id_aktif,
            'status_scan' => $statusScan,
            'warning_reason' => $warningReason,
            'created_at' => date('Y-m-d H:i:s'),
        ]));
    }

    private function formatSiswa(object $siswa): array
    {
        return [
            'siswa_id' => (int) $siswa->siswa_id,
            'nisn' => $siswa->nisn,
            'nama_lengkap' => $siswa->nama_lengkap,
            'rombel_id_aktif' => $siswa->rombel_id_aktif,
            'kelas_aktif' => $siswa->kelas_aktif,
        ];
    }

    private function filterPayload(string $table, array $payload): array
    {
        $columns = $this->columns($table);

        return array_filter($payload, fn ($key) => in_array($key, $columns, true), ARRAY_FILTER_USE_KEY);
    }

    private function columns(string $table): array
    {
        if (!isset($this->columnsCache[$table])) {
            $this->columnsCache[$table] = DB::connection()->getSchemaBuilder()->getColumnListing($table);
        }

        return $this->columnsCache[$table];
    }

    private function uuidV4(): string
    {
        $data = random_bytes(16);

        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}